/*
 * Copyright (c) Huawei Technologies Co., Ltd. 2023. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
#include <iomanip>
#include <iostream>
#include <future>
#include <climits>
#include <sstream>
#include <charconv>
#include "ffrt_converter.h"

namespace SysTuning {
namespace TraceStreamer {
constexpr uint64_t INITIAL_TEXT_LINE_NUM = 2000000;
constexpr uint64_t MAX_MOCK_TID = 4294967295;
constexpr size_t BUFFER_SIZE = 1024 * 1024; // 1MB buffer

using PidMap = std::unordered_map<int, std::set<int>>;
using FfrtTidMap = std::unordered_map<int, std::pair<std::string, std::vector<int>>>;
using FfrtPids = std::unordered_map<int, FfrtTidMap>;
using WakeLogs = std::unordered_map<int, std::vector<int>>;
using FfrtWakeLogs = std::unordered_map<int, WakeLogs>;
using Info = const std::pair<int, std::set<int>>;
using ConVecStr = const std::vector<std::string>;

static bool WriteOutputFile(std::ofstream &outfile, std::vector<std::string> &context_)
{
    if (!outfile.is_open()) {
        TS_LOGE("outFile is invalid.");
        return false;
    }

    std::vector<char> file_buffer(BUFFER_SIZE);
    outfile.rdbuf()->pubsetbuf(file_buffer.data(), file_buffer.size());

    for (const auto &line : context_) {
        outfile.write(line.c_str(), line.size());
        outfile.put('\n');
    }

    outfile.close();
    context_.clear();
    return true;
}

bool FfrtConverter::RecoverTraceAndGenerateNewFile(ConStr &ffrtFileName, std::ofstream &outFile)
{
    std::ifstream ffrtFile(ffrtFileName);
    if (!ffrtFile.is_open() || !outFile.is_open()) {
        TS_LOGE("ffrtFile or outFile is invalid.");
        return false;
    }

    // reserve initial line size
    context_.reserve(INITIAL_TEXT_LINE_NUM);
    std::string line;
    while (std::getline(ffrtFile, line)) {
        context_.emplace_back(line);
    }
    ffrtFile.close();

    FfrtPids ffrtPids;
    FfrtWakeLogs ffrtWakeLogs;
    ClassifyLogsForFfrtWorker(ffrtPids, ffrtWakeLogs);

    if (tracingMarkerKey_.empty()) {
        tracingMarkerKey_ = "tracing_mark_write: ";
    }

    if (osPlatformKet_ == "ohos") {
        ConvertFrrtThreadToFfrtTaskOhos(ffrtPids, ffrtWakeLogs);
    } else {
        ConvertFrrtThreadToFfrtTaskNohos(ffrtPids, ffrtWakeLogs);
    }

    return WriteOutputFile(outFile, context_);
}

static uint32_t ExtractProcessId(ConStr &log)
{
    size_t leftParen = log.find('(');
    size_t rightParen = log.find(')', leftParen);
    if (leftParen == std::string::npos || rightParen == std::string::npos || leftParen >= rightParen) {
        return 0;
    }

    std::string processIdStr = log.substr(leftParen + 1, rightParen - leftParen - 1);
    processIdStr.erase(0, processIdStr.find_first_not_of(" \t"));
    size_t lastNonSpace = processIdStr.find_last_not_of(" \t");
    if (lastNonSpace != std::string::npos) {
        processIdStr.erase(lastNonSpace + 1);
    }

    if (processIdStr.find('-') != std::string::npos || processIdStr.empty()) {
        return 0;
    }

    uint32_t processId = 0;
    const int base = 10;
    for (char c : processIdStr) {
        if (!std::isdigit(c)) {
            return 0;
        }
        processId = processId * base + (static_cast<int>(c) - static_cast<int>('0'));
        if (processId > UINT32_MAX) {
            return 0;
        }
    }
    return processId;
}

static int ExtractThreadId(ConStr &log)
{
    static const std::regex pattern(R"( \(\s*\d+\)\s+\[\d)");
    std::smatch match;
    if (std::regex_search(log, match, pattern)) {
        std::string prefix = log.substr(0, match.position());
        return std::stoull(prefix.substr(prefix.find_last_of('-') + 1));
    }
    return INT_MAX;
}

static std::string TrimRight(ConStr &str)
{
    auto end = std::find_if_not(str.rbegin(), str.rend(), [](unsigned char ch) { return std::isspace(ch); }).base();

    return std::string(str.begin(), end);
}

static void ExtraceFfrtThreadInfoFromSchedSwitch(ConStr &log, std::string &tName, int &tid)
{
    static std::string prevComm = "prev_comm";
    static std::string prevPid = "prev_pid=";
    size_t prevCommPos = log.find(prevComm);
    size_t prevPidPos = log.find(prevPid);
    if (prevCommPos != std::string::npos && prevPidPos != std::string::npos) {
        if (prevCommPos < prevPidPos) {
            std::string containName = log.substr(prevCommPos, prevPidPos - prevCommPos);
            size_t tNameStartIndex = containName.find_first_of("=") + 1;
            tName = containName.substr(tNameStartIndex, containName.size() - tNameStartIndex);
            size_t startPos = prevPidPos + prevComm.size();
            size_t tidLen = log.find(" ", prevPidPos) - prevPidPos - prevPid.size();
            tid = std::stoull(log.substr(startPos, tidLen));
        }
    } else {
        tName = "";
        tid = -1;
    }
}

static std::string ExtractTimeStr(ConStr &log)
{
    std::smatch match;
    static const int spaceNum = 2;
    static const std::regex timePattern = std::regex(R"( (\d+)\.(\d+):)");
    if (std::regex_search(log, match, timePattern)) {
        return match.str().substr(1, match.str().size() - spaceNum);
    }
    return "";
}

static std::string ExtractCpuId(ConStr &log)
{
    std::smatch match;
    static const int spaceNum = 3;
    static const std::regex cpuidpattern = std::regex(R"(\) \[.*?\])");
    if (std::regex_search(log, match, cpuidpattern)) {
        return log.substr(match.position() + spaceNum, spaceNum);
    }
    return "";
}

static std::string ExtractTaskLable(ConStr &log)
{
    size_t pos = log.find("|H:FFRT");
    if (pos != std::string::npos) { // ohos
        size_t startPos = pos + std::string("|H:FFRT").length();
        size_t endPos = log.find("|", startPos);
        if (endPos != std::string::npos) {
            return log.substr(startPos, endPos - startPos);
        }
    } else {
        size_t startPos = log.find_last_of("[");
        size_t endPos = log.find("]", startPos);
        if (startPos != std::string::npos && endPos != std::string::npos) {
            return log.substr(startPos + 1, endPos - startPos - 1);
        }
    }
    return ""; // Return empty string if no label found
}

static void FindPrevAndNextPidForSchedSwitch(ConStr &log, int &prevPid, int &nextPid)
{
    static std::string prevPidStr = "prev_pid=";
    static std::string nextPidStr = "next_pid=";
    size_t prevPidPos = log.find(prevPidStr);
    size_t nextPidPos = log.find(nextPidStr);
    size_t startPos = prevPidPos + prevPidStr.size();
    size_t pidLen = log.find(" ", prevPidPos) - prevPidPos - (prevPidStr.size() - 1);
    prevPid = std::stoull(log.substr(startPos, pidLen));
    startPos = nextPidPos + nextPidStr.size();
    pidLen = log.find(" ", nextPidPos) - nextPidPos - (nextPidStr.size() - 1);
    nextPid = std::stoull(log.substr(startPos, pidLen));
}

void FfrtConverter::SetOSPlatformKey(const FfrtTidMap &ffrtTidMap)
{
    for (const auto &tinfo : ffrtTidMap) {
        if (tinfo.second.first.find("ffrtwk") != std::string::npos) {
            osPlatformKet_ = "nohos";
            return;
        }
        if (tinfo.second.first.find("OS_FFRT_") != std::string::npos) {
            osPlatformKet_ = "ohos";
            return;
        }
    }
}

static void PushProcessNamePositions(ConStr &log, size_t &hyphenPos, size_t &spacePos, std::vector<size_t> &indexs)
{
    bool allDigits = true;
    for (size_t i = hyphenPos + 1; i < spacePos; ++i) {
        if (!isdigit(log[i])) {
            allDigits = false;
            break;
        }
    }

    if (allDigits && spacePos > hyphenPos + 1) {
        bool foundStart = false;
        size_t start = hyphenPos;
        while (start > 0) {
            if (isspace(log[start - 1])) {
                foundStart = true;
                break;
            }
            --start;
        }
        if (foundStart || start == 0) {
            indexs.push_back(start);
        }
    }
}

static void FindProcessNamePositions(ConStr &log, std::vector<size_t> &indexs)
{
    size_t pos = 0;
    const size_t logLength = log.length();
    while (pos < logLength) {
        size_t hyphenPos = log.find('-', pos);
        if (hyphenPos == std::string::npos) {
            break;
        }

        size_t spacePos = hyphenPos + 1;
        while (spacePos < logLength && !isspace(log[spacePos])) {
            spacePos++;
        }
        if (spacePos < logLength && isspace(log[spacePos])) {
            size_t bracketPos = spacePos;
            while (bracketPos < logLength && isspace(log[bracketPos])) {
                bracketPos++;
            }
            if (bracketPos < logLength && log[bracketPos] == '(') {
                PushProcessNamePositions(log, hyphenPos, spacePos, indexs);
            }
        }
        pos = hyphenPos + 1;
    }
}

static void SplitLogs(std::vector<size_t> &indexs, std::vector<std::string> &newLogs, ConStr &log)
{
    for (int i = 0; i < indexs.size(); i++) {
        int begin = indexs[i];
        int end = (i + 1 < indexs.size()) ? indexs[i + 1] : static_cast<int>(log.size());
        std::string logSplit = log.substr(begin, end - begin);
        if (i + 1 < indexs.size()) {
            logSplit += "\n";
        }
        newLogs.emplace_back(logSplit);
    }
}

static void GenFfrtPids(FfrtPids &ffrtPids, Info &info, FfrtTidMap &ffrtTidMap, WakeLogs &traceMap)
{
    for (const auto tid : info.second) {
        if (ffrtTidMap.find(tid) != ffrtTidMap.end()) {
            if (ffrtPids.find(info.first) == ffrtPids.end()) {
                ffrtPids[info.first] = {};
            }
            ffrtPids[info.first][tid] = ffrtTidMap[tid];
            ffrtPids[info.first][tid].second = traceMap[tid];
        }
    }
}

bool IsOldVersionTrace(ConStr &log)
{
    static const std::string fPattern = " F|";
    static const std::string hCo = "|H:Co";

    size_t fPos = log.find(fPattern);
    if (fPos == std::string::npos) {
        return false;
    }

    size_t num1Start = fPos + fPattern.size();
    if (num1Start >= log.length() || !std::isdigit(log[num1Start])) {
        return false;
    }
    size_t num1End = num1Start;
    while (num1End < log.length() && std::isdigit(log[num1End])) {
        num1End++;
    }
    if (num1End == num1Start) {
        return false;
    }

    size_t hCoPos = log.find(hCo, num1End);
    if (hCoPos == std::string::npos) {
        return false;
    }

    size_t afterHCo = hCoPos + hCo.size();
    if (afterHCo >= log.length() || (log[afterHCo] != '|' && !std::isspace(log[afterHCo]))) {
        return false;
    }

    size_t num2Start = afterHCo + 1;
    if (num2Start >= log.length() || !std::isdigit(log[num2Start])) {
        return false;
    }
    size_t num2End = num2Start;
    while (num2End < log.length() && std::isdigit(log[num2End])) {
        num2End++;
    }
    if (num2End == num2Start) {
        return false;
    }
    return true;
}

void FfrtConverter::ClassifyLogsForFfrtWorker(FfrtPids &ffrtPids, FfrtWakeLogs &ffrtWakeLogs)
{
    PidMap pidMap;
    FfrtTidMap ffrtTidMap;
    WakeLogs traceMap;
    const size_t estimatedSize = context_.size();
    const size_t oneHundred = 100;
    const size_t fifty = 50;
    const size_t ten = 10;
    pidMap.reserve(estimatedSize / oneHundred);
    ffrtTidMap.reserve(estimatedSize / fifty);
    traceMap.reserve(estimatedSize / fifty);
#ifdef MUL_THREAD_EXEC
    std::mutex pidMutex;
    std::mutex tidMutex;
    std::mutex traceMutex;
    std::mutex contextMutex;
    const size_t numThreads = std::thread::hardware_concurrency();
    const size_t chunkSize = context_.size() / numThreads + 1;
    std::vector<std::thread> threads;
    threads.reserve(numThreads);
    std::vector<std::vector<ContextUpdate>> threadUpdates(numThreads);

    auto worker = [&](size_t threadId, size_t start, size_t end) {
        std::vector<size_t> indexs;
        indexs.reserve(10);
        std::unordered_map<int, std::set<int>> localPidMap;
        std::unordered_map<int, std::pair<std::string, std::vector<int>>> locFfrtTidMap;
        std::unordered_map<int, std::vector<int>> locTraceMap;
        std::vector<ContextUpdate> &updates = threadUpdates[threadId];

        for (size_t lineno = start; lineno < end && lineno < context_.size(); ++lineno) {
            const std::string &log = context_[lineno];
            indexs.clear();
            FindProcessNamePositions(log, indexs);

            if (indexs.size() > 1) {
                ContextUpdate update;
                update.position = lineno;
                for (size_t i = 0; i < indexs.size(); ++i) {
                    int begin = indexs[i];
                    end = (i + 1 < indexs.size()) ? indexs[i + 1] : static_cast<int>(log.size());
                    std::string logSplit = log.substr(begin, end - begin);
                    if (i + 1 < indexs.size()) {
                        logSplit += "\n";
                    }
                    update.new_logs.push_back(logSplit);
                }
                updates.push_back(update);
                for (size_t i = 0; i < update.new_logs.size(); ++i) {
                    auto logInfo = LogInfo{update.new_logs[i], static_cast<int>(lineno + i), 0, 0};
                    FindFfrtProcClassifyLogs(logInfo, locTraceMap, localPidMap, locFfrtTidMap, ffrtWakeLogs);
                }
            } else {
                auto logInfo = LogInfo{log, static_cast<int>(lineno), 0, 0};
                FindFfrtProcClassifyLogs(logInfo, locTraceMap, localPidMap, locFfrtTidMap, ffrtWakeLogs);
            }
        }
        {
            std::lock_guard<std::mutex> lock(pidMutex);
            for (const auto &[pid, tid_set] : localPidMap) {
                pidMap[pid].insert(tid_set.begin(), tid_set.end());
            }
        }
        {
            std::lock_guard<std::mutex> lock(tidMutex);
            for (const auto &[tid, info] : locFfrtTidMap) {
                if (ffrtTidMap.find(tid) == ffrtTidMap.end()) {
                    ffrtTidMap[tid] = info;
                }
            }
        }
        {
            std::lock_guard<std::mutex> lock(traceMutex);
            for (const auto &[tid, traces] : locTraceMap) {
                auto &target = traceMap[tid];
                target.insert(target.end(), traces.begin(), traces.end());
            }
        }
    };
    for (size_t i = 0; i < numThreads; ++i) {
        std::lock_guard<std::mutex> lock(contextMutex);
        size_t start = i * chunkSize;
        size_t end = std::min((i + 1) * chunkSize, context_.size());
        threads.emplace_back(worker, i, start, end);
    }
    for (auto &thread : threads) {
        thread.join();
    }
    std::vector<ContextUpdate> allUpdates;
    for (const auto &threadUpdate : threadUpdates) {
        allUpdates.insert(allUpdates.end(), threadUpdate.begin(), threadUpdate.end());
    }
    std::sort(allUpdates.begin(), allUpdates.end(),
              [](const ContextUpdate &a, const ContextUpdate &b) { return a.position > b.position; });
    for (const auto &update : allUpdates) {
        context_.erase(context_.begin() + update.position);
        context_.insert(context_.begin() + update.position, update.new_logs.begin(), update.new_logs.end());
    }
#else
    uint64_t lineno = 0;
    bool shouldCheck = true;
    std::vector<size_t> indexs;
    indexs.reserve(ten);
    auto classifyLogs = [this, &traceMap, &pidMap, &ffrtTidMap, &ffrtWakeLogs](ConVecStr &newLogs, size_t startLineNo) {
        for (size_t i = 0; i < newLogs.size(); ++i) {
            auto logInfo = LogInfo{context_[startLineNo + i], static_cast<int>(startLineNo + i), 0, 0};
            FindFfrtProcClassifyLogs(logInfo, traceMap, pidMap, ffrtTidMap, ffrtWakeLogs);
        }
    };
    while (lineno < context_.size()) {
        ConStr &log = context_[lineno];
        indexs.clear();
        FindProcessNamePositions(log, indexs);
        if (shouldCheck && IsOldVersionTrace(log)) {
            this->isOldVersionTrace_ = true;
            shouldCheck = false;
        }
        if (indexs.size() > 1) {
            std::vector<std::string> newLogs;
            SplitLogs(indexs, newLogs, log);
            context_.erase(context_.begin() + lineno);
            context_.insert(context_.begin() + lineno, newLogs.begin(), newLogs.end());
            classifyLogs(newLogs, lineno);
            lineno += newLogs.size() - 1;
        } else {
            auto logInfo = LogInfo{context_[lineno], static_cast<int>(lineno), 0, 0};
            FindFfrtProcClassifyLogs(logInfo, traceMap, pidMap, ffrtTidMap, ffrtWakeLogs);
        }
        ++lineno;
    }
#endif
    SetOSPlatformKey(ffrtTidMap);
    for (auto &info : pidMap) {
        GenFfrtPids(ffrtPids, info, ffrtTidMap, traceMap);
    }
}

static size_t FindPatternStart(ConStr &log)
{
    size_t pos = 0;
    while (pos < log.size()) {
        pos = log.find(" (", pos);
        if (pos == std::string::npos) {
            return std::string::npos;
        }

        size_t rightBracket = log.find(')', pos + 2);
        if (rightBracket == std::string::npos) {
            return std::string::npos;
        }

        size_t bracketEnd = rightBracket + 1;
        while (bracketEnd < log.length() && isspace(log[bracketEnd])) {
            ++bracketEnd;
        }

        if (bracketEnd < log.length() && log[bracketEnd] == '[' && bracketEnd + 1 < log.length() &&
            isdigit(log[bracketEnd + 1])) {
            return pos;
        }
        pos = rightBracket + 1;
    }
    return std::string::npos;
}

static std::pair<size_t, size_t> FindPatternEnd(ConStr &log)
{
    size_t pos = 0;
    static std::string hr = "H:R";
    while (pos < log.size()) {
        pos = log.find(" F|", pos);
        if (pos == std::string::npos) {
            return {std::string::npos, std::string::npos};
        }

        size_t numStart = pos + 3;
        size_t pipePos = log.find('|', numStart);
        if (pipePos == std::string::npos) {
            pos = numStart;
            continue;
        }

        bool validNum = true;
        for (size_t i = numStart; i < pipePos; ++i) {
            if (!isdigit(log[i])) {
                validNum = false;
                break;
            }
        }
        if (!validNum || numStart == pipePos) {
            pos = pipePos + 1;
            continue;
        }

        size_t rPos = pipePos + 1;
        if (rPos + hr.size() - 1 < log.length() && log.substr(rPos, hr.size()) == hr) {
            rPos += hr.size();
        } else if (rPos < log.length() && log[rPos] == 'R') {
            rPos += 1;
        } else {
            pos = pipePos + 1;
            continue;
        }

        if (rPos < log.length() && (log[rPos] == '|' || isspace(log[rPos]))) {
            size_t finalNum = rPos + 1;
            while (finalNum < log.length() && isspace(log[finalNum])) {
                finalNum++;
            }

            if (finalNum < log.length() && isdigit(log[finalNum])) {
                size_t endPos = finalNum;
                while (endPos < log.length() && std::isdigit(log[endPos])) {
                    endPos++;
                }
                return {pos, endPos - 1};
            }
        }
        pos = rPos;
    }
    return {std::string::npos, std::string::npos};
}

static void ParseOtherTraceLogs(LogInfo logInfo, WakeLogs &traceMap, FfrtWakeLogs &ffrtWakeLogs)
{
    size_t matchPos = FindPatternStart(logInfo.log);
    if (matchPos != std::string::npos) {
        std::string tmp = logInfo.log.substr(0, matchPos);
        logInfo.tid = std::stoull(tmp.substr(tmp.find_last_of('-') + 1));
        if (traceMap.find(logInfo.tid) == traceMap.end()) {
            traceMap[logInfo.tid] = {};
        }
        traceMap[logInfo.tid].emplace_back(logInfo.lineno);

        auto posPair = FindPatternEnd(logInfo.log);
        if (posPair.first != std::string::npos) {
            std::string logSub = logInfo.log.substr(posPair.first, posPair.second - posPair.first + 1);
            std::string hStr = logSub.substr(logSub.find_last_of('|') + 1);
            if (hStr[0] == 'H') {
                hStr = hStr.substr(hStr.find_last_of(' ') + 1);
            }
            int wakee = std::stoull(hStr);
            if (ffrtWakeLogs.find(logInfo.pid) == ffrtWakeLogs.end()) {
                ffrtWakeLogs[logInfo.pid] = {};
            }
            if (ffrtWakeLogs[logInfo.pid].find(wakee) == ffrtWakeLogs[logInfo.pid].end()) {
                ffrtWakeLogs[logInfo.pid][wakee] = {};
            }
            ffrtWakeLogs[logInfo.pid][wakee].emplace_back(logInfo.lineno);
        }
    }
}

void FfrtConverter::SetTracingMarkerKey(LogInfo logInfo)
{
    if (tracingMarkerKey_.empty()) {
        if (logInfo.log.find("tracing_mark_write: ") != std::string::npos) {
            tracingMarkerKey_ = "tracing_mark_write: ";
        } else if (logInfo.log.find("print: ") != std::string::npos) {
            tracingMarkerKey_ = "print: ";
        }
    }
}

void FfrtConverter::FindFfrtProcClassifyLogs(LogInfo logInfo,
                                             WakeLogs &traceMap,
                                             PidMap &pidMap,
                                             FfrtTidMap &ffrtTidMap,
                                             FfrtWakeLogs &ffrtWakeLogs)
{
    bool isPrevCommFfrt = logInfo.log.find("prev_comm=ffrt") != std::string::npos;
    bool isPrevCommFfrtOs = logInfo.log.find("prev_comm=OS_FFRT") != std::string::npos;
    auto pid = ExtractProcessId(logInfo.log);
    auto tid = ExtractThreadId(logInfo.log);
    if (pidMap.find(pid) == pidMap.end()) {
        pidMap[pid] = {};
    }
    pidMap[pid].insert(tid);
    if (isPrevCommFfrt || isPrevCommFfrtOs) {
        std::string tname;
        ExtraceFfrtThreadInfoFromSchedSwitch(logInfo.log, tname, tid);
        tname = TrimRight(tname);
        if (ffrtTidMap.find(tid) == ffrtTidMap.end()) {
            ffrtTidMap[tid] = {tname, {}};
        }
    }

    SetTracingMarkerKey(logInfo);

    if (logInfo.log.find("sched_switch: ") != std::string::npos) {
        int prevTid;
        int nextTid;
        FindPrevAndNextPidForSchedSwitch(logInfo.log, prevTid, nextTid);
        if (traceMap.find(prevTid) == traceMap.end()) {
            traceMap[prevTid] = {};
        }
        traceMap[prevTid].emplace_back(logInfo.lineno);
        if (traceMap.find(nextTid) == traceMap.end()) {
            traceMap[nextTid] = {};
        }
        traceMap[nextTid].emplace_back(logInfo.lineno);
        return;
    }
    static std::string pidStr = "pid=";
    if ((logInfo.log.find("sched_wak") != std::string::npos) ||
        (logInfo.log.find("sched_blocked_reason: ") != std::string::npos)) {
        int pidPos = logInfo.log.find(pidStr);
        int startStr = pidPos + pidStr.size();
        int tidLen = logInfo.log.find(" ", pidPos) - pidPos - pidStr.size() + 1;
        tid = std::stoull(logInfo.log.substr(startStr, tidLen));
        if (traceMap.find(tid) == traceMap.end()) {
            traceMap[tid] = {};
        }
        traceMap[tid].emplace_back(logInfo.lineno);
    }
    ParseOtherTraceLogs(LogInfo{logInfo.log, logInfo.lineno, static_cast<int>(pid), tid}, traceMap, ffrtWakeLogs);
}

static bool IsNumeric(ConStr &str)
{
    if (str.empty()) { 
        return false;
    }
    bool result = true;
    std::for_each(str.begin(), str.end(), [&](char c) {
        if (!std::isdigit(c)) {
            result = false;
        }
    });
    return result;
}

static int GetQid(ConStr &containQid)
{
    size_t oldPos = 0;
    size_t newPos = 0;
    while ((newPos = containQid.find("_", newPos)) != std::string::npos) {
        std::string qidStr = containQid.substr(oldPos, newPos - oldPos);
        if (IsNumeric(qidStr)) {
            return std::stoull(qidStr);
        }
        newPos++;
        oldPos = newPos;
    }
    if (oldPos != containQid.size()) {
        std::string qidStr = containQid.substr(oldPos, containQid.size() - oldPos);
        if (IsNumeric(qidStr)) {
            return std::stoull(qidStr);
        }
    }
    return -1;
}

static std::string GenMockTid(int pid, int gid)
{
    std::string mockTid = std::to_string(pid) + "0" + std::to_string(gid);
    while (std::stoull(mockTid) > MAX_MOCK_TID) {
        mockTid = mockTid.substr(1);
    }
    return mockTid;
}

static std::string MakeCoyieldFakeLog(FakeLogArgs &fakeLogArgs)
{
    std::stringstream ss;
    static const int spaceNum = 7;
    std::string mockTid = GenMockTid(fakeLogArgs.pid, fakeLogArgs.taskRunning);
    ss << "  " << fakeLogArgs.taskLabel << "-" << mockTid << "    (" << std::setw(spaceNum);
    ss << std::right << fakeLogArgs.pid << ") [" << fakeLogArgs.cpuId << "] ....   " << fakeLogArgs.timestamp;
    ss << ": sched_switch: prev_comm=" << fakeLogArgs.taskLabel << " prev_pid=" << mockTid;
    ss << " prev_prio=" << fakeLogArgs.prio << " prev_state=S ==> next_comm=" << fakeLogArgs.tname;
    ss << " next_pid=" << fakeLogArgs.tid << " next_prio=" << fakeLogArgs.prio << "\n";
    std::string fakeLog = ss.str();
    return fakeLog;
}

static std::string MakeCostartFakeLog(FakeLogArgs &fakeLogArgs)
{
    std::string mockTid = GenMockTid(fakeLogArgs.pid, fakeLogArgs.taskRunning);
    std::stringstream ss;
    static const int spaceNum = 7;
    ss << fakeLogArgs.log << "\n  " << fakeLogArgs.tname << "-" << fakeLogArgs.tid << "    (" << std::setw(spaceNum);
    ss << std::right << fakeLogArgs.pid << ") [" << fakeLogArgs.cpuId << "] ....   " << fakeLogArgs.timestamp;
    ss << ": sched_switch: prev_comm=" << fakeLogArgs.tname << " prev_pid=" << fakeLogArgs.tid << " prev_prio=";
    ss << fakeLogArgs.prio << " prev_state=S ==> next_comm=" << fakeLogArgs.taskLabel;
    ss << " next_pid=" << mockTid << " next_prio=" << fakeLogArgs.prio << "\n";
    return ss.str();
}

static std::string MakeWakeupFakeLog(ConStr &log, const FakeLogArgs &fakeLogArgs, ConStr &tracingMarkerKey)
{
    std::string mockTid = GenMockTid(fakeLogArgs.pid, fakeLogArgs.taskRunning);
    std::stringstream fakeLogStrm;
    fakeLogStrm << log.substr(0, log.find(tracingMarkerKey)) << "sched_wakeup: comm=" << fakeLogArgs.taskLabel
                << " pid=" << mockTid << " prio=" << fakeLogArgs.prio << " target_cpu=" << fakeLogArgs.cpuId;
    return fakeLogStrm.str();
}

static std::string ReplaceSchedSwitchLog(ConStr &fakeLog, LogInfo logInfo, int gid, ConStr &label)
{
    std::string mockTid = GenMockTid(logInfo.pid, gid);
    std::string result = fakeLog;

    if (logInfo.log.find("prev_pid=" + std::to_string(logInfo.tid)) != std::string::npos) {
        if (ExtractThreadId(fakeLog) == logInfo.tid) {
            size_t index = fakeLog.find("(");
            result = "  " + label + "-" + mockTid + " " + fakeLog.substr(index);
        }
        result = result.substr(0, result.find("prev_comm=")) + "prev_comm=" + label + " " +
                 result.substr(result.find("prev_pid="));
        result = result.substr(0, result.find("prev_pid=")) + "prev_pid=" + mockTid + " " +
                 result.substr(result.find("prev_prio="));
    } else if (logInfo.log.find("next_pid=" + std::to_string(logInfo.tid)) != std::string::npos) {
        result = result.substr(0, result.find("next_comm=")) + "next_comm=" + label + " " +
                 result.substr(result.find("next_pid="));
        result = result.substr(0, result.find("next_pid=")) + "next_pid=" + mockTid + " " +
                 result.substr(result.find("next_prio="));
    }
    return result;
}

static std::string ReplaceSchedWakeLog(ConStr &fakeLog, ConStr &label, int pid, int gid)
{
    std::string result = fakeLog;
    result = result.substr(0, result.find("comm=")) + "comm=" + label + " " + result.substr(result.find("pid="));
    // Replace "pid=" part
    std::string mockTid = GenMockTid(pid, gid);
    result = result.substr(0, result.find("pid=")) + "pid=" + mockTid + " " + result.substr(result.find("prio="));
    return result;
}

static std::string ReplaceTracingMarkLog(ConStr &fakeLog, ConStr &label, int pid, int gid)
{
    size_t index = fakeLog.find("(");
    std::string mockTid = GenMockTid(pid, gid);
    std::string result = "  " + label + "-" + mockTid + " " + fakeLog.substr(index);
    return result;
}

static std::string ReplaceSchedBlockLog(ConStr &fakeLog, int pid, int gid)
{
    std::string mockTid = GenMockTid(pid, gid);
    std::string::size_type pos = fakeLog.find("pid=");
    std::string result;
    if (pos != std::string::npos) {
        pos = fakeLog.find("iowait=", pos);
        if (pos != std::string::npos) {
            result = fakeLog.substr(0, fakeLog.find("pid=")) + "pid=" + mockTid + " " + fakeLog.substr(pos);
        } else {
            result = fakeLog.substr(0, fakeLog.find("pid=")) + "pid=" + mockTid + " " +
                     fakeLog.substr(fakeLog.find("io_wait="));
        }
    }
    return result;
}

static std::string ConvertWorkerLogToTask(ConStr &mark, int pid, int tid, int gid, ConStr &label)
{
    std::string fakeLog = mark;
    if (mark.find("sched_switch: ") != std::string::npos) {
        LogInfo logInfo = LogInfo{mark, -1, pid, tid};
        return ReplaceSchedSwitchLog(fakeLog, logInfo, gid, label);
    }
    if (mark.find(": sched_wak") != std::string::npos) {
        if (mark.find("pid=" + std::to_string(tid)) != std::string::npos) {
            return ReplaceSchedWakeLog(fakeLog, label, pid, gid);
        } else {
            return ReplaceTracingMarkLog(fakeLog, label, pid, gid);
        }
    }
    if (mark.find("sched_blocked_reason: ") != std::string::npos) {
        if (mark.find("pid=" + std::to_string(tid)) != std::string::npos) {
            return ReplaceSchedBlockLog(fakeLog, pid, gid);
        } else {
            return ReplaceTracingMarkLog(fakeLog, label, pid, gid);
        }
    }
    return ReplaceTracingMarkLog(fakeLog, label, pid, gid);
}

static int FindGreaterThan(const std::vector<int> &vec, int target)
{
    if (vec.size() == 0) {
        return 0;
    }
    if (target >= vec.back()) {
        return vec.size();
    }
    auto it = std::lower_bound(vec.begin(), vec.end(), target + 1);
    if (it != vec.end() && *it > target) {
        return std::distance(vec.begin(), it);
    }
    return vec.size();
}

static bool HandleQueTaskInfoIn(ConStr &log, int lineno, int pid, QueueTaskInfo &queueTaskInfo)
{
    static std::string sqStr = "sq_";
    size_t sqPos = log.find("H:FFRTsq_");
    if (sqPos != std::string::npos) {
        size_t sqStart = log.find(sqStr);
        std::string containInfo = log.substr(sqStart + sqStr.size());
        size_t firstPipePos = containInfo.find_first_of("|");
        if (firstPipePos != std::string::npos) {
            std::string containQid = containInfo.substr(0, firstPipePos);
            int qid = GetQid(containQid);
            if (qid == -1) {
                return true;
            }
            size_t gidStart = containQid.size() + 1;
            int gid = std::stoull(containInfo.substr(gidStart, containInfo.find("|", gidStart) - gidStart));
            if (queueTaskInfo[pid].find(gid) == queueTaskInfo[pid].end()) {
                queueTaskInfo[pid][gid] = tidInfo{{lineno}, -1, gid, qid};
            } else {
                queueTaskInfo[pid][gid].begin.emplace_back(lineno);
            }
        }
    }
    return false;
}

static void HandleQueTaskInfoOut(ConStr &log, int lineno, int pid, QueueTaskInfo &queueTaskInfo)
{
    static std::string fStr = " F|";
    size_t fPos = log.find(fStr);
    if (fPos == std::string::npos) {
        return;
    }
    size_t hPos = log.find("|H:F", fPos);
    if (hPos == std::string::npos) {
        return;
    }
    std::string pidStr = log.substr(fPos + fStr.size(), hPos - (fPos + fStr.size()));
    if (!pidStr.empty() && std::all_of(pidStr.begin(), pidStr.end(), ::isdigit)) {
        int spacePos = hPos + fStr.size() + 1;
        if (log[spacePos] != ' ' && log[spacePos] != '|') {
            return;
        }
        spacePos++;
        bool spaceFlage = spacePos != std::string::npos && spacePos < log.length();
        if (!spaceFlage) {
            return;
        }
        std::string gidStr = "";
        if (log[spacePos - 1] == ' ') {
            gidStr = log.substr(spacePos);
        } else {
            gidStr = log.substr(spacePos, log.substr(spacePos).find('|'));
        }
        if (!gidStr.empty() && std::all_of(gidStr.begin(), gidStr.end(), ::isdigit)) {
            int gid = std::stoull(gidStr);
            if (queueTaskInfo[pid].find(gid) != queueTaskInfo[pid].end()) {
                queueTaskInfo[pid][gid].end = lineno;
            }
        }
    }
}

void FfrtConverter::ExceQueTaskInfoPreLog(std::vector<int> &linenos, int pid, QueueTaskInfo &queueTaskInfo)
{
    for (auto lineno : linenos) {
        std::string &log = context_[lineno];

        if (HandleQueTaskInfoIn(log, lineno, pid, queueTaskInfo)) {
            continue;
        }
        HandleQueTaskInfoOut(log, lineno, pid, queueTaskInfo);
    }
}

void FfrtConverter::FindQueueTaskInfo(FfrtPids &ffrtPids, QueueTaskInfo &queueTaskInfo)
{
    for (auto &pidItem : ffrtPids) {
        int pid = pidItem.first;
        queueTaskInfo[pid] = {}; // Initialize map for this pid

        for (auto &tidItem : pidItem.second) {
            std::vector<int> &linenos = tidItem.second.second;
            std::sort(linenos.begin(), linenos.end());
            ExceQueTaskInfoPreLog(linenos, pid, queueTaskInfo);
        }
    }
}

void GenFfrtQueueTasks(FfrtQueueTasks &ffrtQueueTasks, QueueTaskInfo &queueTaskInfo)
{
    for (auto &pidItem : queueTaskInfo) {
        int pid = pidItem.first;
        ffrtQueueTasks[pid] = {};
        for (auto &qidItem : pidItem.second) {
            std::sort(qidItem.second.begin.begin(), qidItem.second.begin.end());
            int qid = qidItem.second.qid;
            if (ffrtQueueTasks[pid].find(qid) == ffrtQueueTasks[pid].end()) {
                ffrtQueueTasks[pid][qid] = {};
            }
            ffrtQueueTasks[pid][qid].push_back(qidItem.second);
        }
    }
}

static void GenTaskGroups(std::vector<std::vector<tidInfo>> &taskGroups, std::pair<int, std::vector<tidInfo>> qidItem)
{
    for (auto &task : qidItem.second) {
        if (task.end == -1) {
            taskGroups.push_back({task});
            continue;
        }
        bool inserted = false;
        for (auto &group : taskGroups) {
            if (group.back().end != -1 && task.begin[0] > group.back().end) {
                group.emplace_back(task);
                inserted = true;
                break;
            }
        }
        if (!inserted) {
            taskGroups.push_back({task});
        }
    }
}

void FfrtConverter::ExceTaskGroups(std::vector<tidInfo> &group, WakeLogs &wakeLogs, int firstGid)
{
    for (int i = 1; i < group.size(); i++) {
        if (wakeLogs.find(group[i].gid) != wakeLogs.end()) {
            int gid = group[i].gid;
            wakeLogs[firstGid].insert(wakeLogs[firstGid].end(), wakeLogs[gid].begin(), wakeLogs[gid].end());
            for (auto &lineno : group[i].begin) {
                size_t rightIndex = context_[lineno].find_last_of("|");
                if (context_[lineno][rightIndex + 1] == 'I') {
                    context_[lineno] =
                        context_[lineno].substr(0, context_[lineno].substr(0, rightIndex).find_last_of("|") + 1) +
                        std::to_string(firstGid) + context_[lineno].substr(rightIndex) + "\n";
                } else {
                    context_[lineno] = context_[lineno].substr(0, rightIndex + 1) + std::to_string(firstGid) + "\n";
                }
            }
        }
    }
}

void FfrtConverter::HandleTaskGroups(std::vector<std::vector<tidInfo>> &taskGroups, WakeLogs &wakeLogs)
{
    for (auto &group : taskGroups) {
        if (group.size() > 1) {
            int firstGid = group[0].gid;
            if (wakeLogs.find(firstGid) == wakeLogs.end()) {
                wakeLogs[firstGid] = {};
            }
            ExceTaskGroups(group, wakeLogs, firstGid);
            std::sort(wakeLogs[firstGid].begin(), wakeLogs[firstGid].end());
        }
    }
}

void FfrtConverter::HandleFfrtQueueTasks(FfrtQueueTasks &ffrtQueueTasks, FfrtWakeLogs &ffrtWakeLogs)
{
    for (auto &pidItem : ffrtQueueTasks) {
        WakeLogs tmp = {};
        WakeLogs &wakeLogs =
            (ffrtWakeLogs.find(pidItem.first) != ffrtWakeLogs.end()) ? ffrtWakeLogs[pidItem.first] : tmp;

        for (auto &qidItem : pidItem.second) {
            auto cmp = [](tidInfo &value1, tidInfo &value2) { return value1.begin[0] < value2.begin[0]; };
            std::sort(qidItem.second.begin(), qidItem.second.end(), cmp);

            std::vector<std::vector<tidInfo>> taskGroups;
            GenTaskGroups(taskGroups, qidItem);
            HandleTaskGroups(taskGroups, wakeLogs);
        }
    }
}

void FfrtConverter::HandleMarks(ConStr &log, int lineno, int pid)
{
    static std::string lostTracingMark = tracingMarkerKey_ + "?";
    static std::string faultTracingMark = tracingMarkerKey_ + "<faulted>";

    size_t lostMarkPos = log.find(lostTracingMark);
    size_t faultMarkPos = log.find(faultTracingMark);
    size_t tracingMarkerPos = log.find(tracingMarkerKey_);

    if (lostMarkPos != std::string::npos || faultMarkPos != std::string::npos) {
        if (tracingMarkerPos != std::string::npos) {
            context_[lineno] =
                log.substr(0, tracingMarkerPos + tracingMarkerKey_.size()) + "E|" + std::to_string(pid) + "\n";
        }
    }
}

void HandleSchedSwitch(ConStr &mark, int tid, int &prio)
{
    if (mark.find("sched_switch: ") != std::string::npos) {
        size_t prevPidPos = mark.find("prev_pid=" + std::to_string(tid));
        size_t nextPidPos = mark.find("next_pid=" + std::to_string(tid));
        if (prevPidPos != std::string::npos || nextPidPos != std::string::npos) {
            std::string pidTag = (prevPidPos != std::string::npos) ? "prev_prio=" : "next_prio=";
            size_t prioPos = mark.find(pidTag);
            if (prioPos != std::string::npos) {
                std::string prioStr = mark.substr(prioPos + pidTag.size());
                prio = std::stoull(prioStr.substr(0, prioStr.find(" ")));
            }
        }
    }
}

bool FfrtConverter::HandleFfrtTaskCo(ConStr &log, int lineno, bool &switchInFakeLog, bool &switchOutFakeLog)
{
    if (IsOldVersionTrace(log)) {
        context_[lineno] = "\n";
        if (switchInFakeLog) {
            switchInFakeLog = false;
        } else {
            switchOutFakeLog = true;
        }
        return true;
    }
    return false;
}

bool IsFfrtTaskBlockOrFinish(ConStr &log)
{
    static const std::string fStr = "F|";
    size_t fPos = log.find(fStr);
    if (fPos == std::string::npos) {
        return false;
    }

    size_t num1Start = fPos + fStr.size();
    if (num1Start >= log.length() || !std::isdigit(log[num1Start])) {
        return false;
    }
    size_t num1End = num1Start;
    while (num1End < log.length() && std::isdigit(log[num1End])) {
        num1End++;
    }
    if (num1End == num1Start) {
        return false;
    }

    size_t hPos = log.find("|H:", num1End);
    if (hPos == std::string::npos) {
        return false;
    }

    size_t typePos = hPos + 3;
    if (typePos >= log.length() || (log[typePos] != 'B' && log[typePos] != 'F')) {
        return false;
    }

    size_t afterType = typePos + 1;
    if (afterType >= log.length() || (log[afterType] != '|' && !std::isspace(log[afterType]))) {
        return false;
    }

    size_t num2Start = afterType + 1;
    if (num2Start >= log.length() || !std::isdigit(log[num2Start])) {
        return false;
    }
    size_t num2End = num2Start;
    while (num2End < log.length() && std::isdigit(log[num2End])) {
        num2End++;
    }

    if (num2End == num2Start) {
        return false;
    }

    return true;
}

bool FfrtConverter::HandleFfrtTaskExecute(FakeLogArgs &fakLogArg,
                                          WakeLogs &wakeLogs,
                                          TaskLabels &taskLabels,
                                          std::string &label)
{
    static const int spaceNum = 7;
    if (fakLogArg.log.find("|H:FFRT") != std::string::npos) {
        std::string missLog;
        if (fakLogArg.taskRunning != -1) {
            missLog = MakeCoyieldFakeLog(fakLogArg);
            std::stringstream ss;
            ss << "  " << fakLogArg.tname << "-" << fakLogArg.tid << "    (" << std::setw(spaceNum) << std::right
               << fakLogArg.pid << ") [" << fakLogArg.cpuId << "] ....   " << fakLogArg.timestamp << ": "
               << tracingMarkerKey_ << "E|" << fakLogArg.pid << "\n";
            missLog += ss.str();
        }
        if (label.find("ex_task") != std::string::npos) {
            return true;
        }
        int gid = -1;
        size_t pos = fakLogArg.log.find_last_of('|');
        if (pos != std::string::npos) {
            if (pos + 1 >= fakLogArg.log.size()) {
                return true;
            }
            std::string gidStr = "";
            if (fakLogArg.log[pos + 1] == 'I') {
                size_t rightIndex = fakLogArg.log.find_last_of("|");
                size_t leftIndex = fakLogArg.log.substr(0, rightIndex).find_last_of("|") + 1;
                gidStr = fakLogArg.log.substr(leftIndex, rightIndex - leftIndex);
            } else {
                gidStr = fakLogArg.log.substr(pos + 1);
            }
            auto [ptr, ec] = std::from_chars(gidStr.data(), gidStr.data() + gidStr.size(), gid);
            if (ec != std::errc{}) {
                return true;
            }
        }
        if (taskLabels[fakLogArg.pid].find(gid) == taskLabels[fakLogArg.pid].end()) {
            taskLabels[fakLogArg.pid][gid] = label;
        }
        fakLogArg.taskRunning = gid;
        fakLogArg.taskLabel = taskLabels[fakLogArg.pid][fakLogArg.taskRunning];
        std::string fakeLog = MakeCostartFakeLog(fakLogArg);
        context_[fakLogArg.lineno] = fakeLog;
        if (!missLog.empty()) {
            context_[fakLogArg.lineno] = missLog + context_[fakLogArg.lineno];
        }
        fakLogArg.switchInFakeLog = true;
        fakLogArg.switchOutFakeLog = false;
        if (wakeLogs.find(fakLogArg.taskRunning) != wakeLogs.end()) {
            int prevIndex = FindGreaterThan(wakeLogs[fakLogArg.taskRunning], fakLogArg.lineno);
            if (prevIndex > 0) {
                int linenoWake = wakeLogs[fakLogArg.taskRunning][prevIndex - 1];
                context_[linenoWake] = MakeWakeupFakeLog(context_[linenoWake], fakLogArg, tracingMarkerKey_);
            }
        }
        return true;
    }
    return false;
}

bool FfrtConverter::HandlePreLineno(FakeLogArgs &fakArg,
                                    WakeLogs &wakeLogs,
                                    TaskLabels &taskLabels,
                                    ConStr traceBeginMark,
                                    ConStr traceEndMark)
{
    std::string label = ExtractTaskLable(fakArg.log);
    if (HandleFfrtTaskExecute(fakArg, wakeLogs, taskLabels, label)) {
        return true;
    }
    if (fakArg.taskRunning != -1) {
        if (this->isOldVersionTrace_) {
            if (HandleFfrtTaskCo(fakArg.log, fakArg.lineno, fakArg.switchInFakeLog, fakArg.switchOutFakeLog)) {
                return true;
            }
            if (fakArg.switchInFakeLog && (fakArg.log.find(traceBeginMark) != std::string::npos)) {
                context_[fakArg.lineno] = "\n";
                return true;
            }
            if (fakArg.switchOutFakeLog && (fakArg.log.find(traceEndMark) != std::string::npos)) {
                context_[fakArg.lineno] = "\n";
                return true;
            }
        }
        if (IsFfrtTaskBlockOrFinish(fakArg.log)) {
            std::string fakeLog = MakeCoyieldFakeLog(fakArg);
            context_[fakArg.lineno] = fakeLog;
            if (this->isOldVersionTrace_ && fakArg.switchOutFakeLog) {
                fakArg.switchOutFakeLog = false;
            }
            fakArg.taskRunning = -1;
            return true;
        }
        label = taskLabels[fakArg.pid][fakArg.taskRunning];
        std::string fakeLog = ConvertWorkerLogToTask(fakArg.log, fakArg.pid, fakArg.tid, fakArg.taskRunning, label);
        context_[fakArg.lineno] = fakeLog;
        return true;
    }
    return false;
}

void FfrtConverter::ExceTaskLabelOhos(TaskLabels &taskLabels,
                                      FfrtWakeLogs &ffrtWakeLogs,
                                      std::pair<int, FfrtTidMap> pidItem,
                                      std::string traceBeginMark,
                                      std::string traceEndMark)
{
    taskLabels[pidItem.first] = {};
    WakeLogs tmp = {};
    WakeLogs &wakeLogs = (ffrtWakeLogs.find(pidItem.first) != ffrtWakeLogs.end()) ? ffrtWakeLogs[pidItem.first] : tmp;

    for (auto &tidItem : pidItem.second) {
        std::string tname = tidItem.second.first;
        std::vector<int> linenos = tidItem.second.second;
        int prio = 120;
        bool switchInFakeLog = false;
        bool switchOutFakeLog = false;
        int taskRunning = -1;

        for (auto lineno : linenos) {
            std::string &log = context_[lineno];
            HandleMarks(log, lineno, pidItem.first);
            HandleSchedSwitch(log, tidItem.first, prio);

            std::string cpuId = ExtractCpuId(log);
            std::string timestamp = ExtractTimeStr(log);
            FakeLogArgs fakArg{
                pidItem.first,   tidItem.first,    taskRunning, prio,  lineno,
                switchInFakeLog, switchOutFakeLog, log,         tname, taskLabels[pidItem.first][taskRunning],
                cpuId,           timestamp};
            HandlePreLineno(fakArg, wakeLogs, taskLabels, traceBeginMark, traceEndMark);
        }
    }
}

void FfrtConverter::GenTaskLabelsOhos(FfrtPids &ffrtPids, FfrtWakeLogs &ffrtWakeLogs, TaskLabels &taskLabels)
{
    static std::string traceBeginMark = tracingMarkerKey_ + "B";
    static std::string traceEndMark = tracingMarkerKey_ + "E";
    for (auto &pidItem : ffrtPids) {
        ExceTaskLabelOhos(taskLabels, ffrtWakeLogs, pidItem, traceBeginMark, traceEndMark);
    }
}

void FfrtConverter::ConvertFrrtThreadToFfrtTaskOhos(FfrtPids &ffrtPids, FfrtWakeLogs &ffrtWakeLogs)
{
    QueueTaskInfo queueTaskInfo;
    FindQueueTaskInfo(ffrtPids, queueTaskInfo);

    FfrtQueueTasks ffrtQueueTasks;
    GenFfrtQueueTasks(ffrtQueueTasks, queueTaskInfo);
    HandleFfrtQueueTasks(ffrtQueueTasks, ffrtWakeLogs);

    TaskLabels taskLabels;
    taskLabels.reserve(ffrtPids.size());
    GenTaskLabelsOhos(ffrtPids, ffrtWakeLogs, taskLabels);
}

bool FfrtConverter::HandleHFfrtTaskExecute(FakeLogArgs &fakeArgs,
                                           WakeLogs &wakeLogs,
                                           TaskLabels &taskLabels,
                                           std::string label,
                                           std::unordered_map<int, int> &schedWakeFlag)
{
    static const int spaceNum = 7;
    if (fakeArgs.log.find("|FFRT") == std::string::npos) {
        return false;
    }
    std::string missLog;
    if (fakeArgs.taskRunning != -1) {
        missLog = MakeCoyieldFakeLog(fakeArgs);
        std::stringstream ss;
        ss << "  " << fakeArgs.tname << "-" << fakeArgs.tid << "    (" << std::setw(spaceNum) << std::right
           << fakeArgs.pid << ") [" << fakeArgs.cpuId << "] ....   " << fakeArgs.timestamp << ": " << tracingMarkerKey_
           << "E|" << fakeArgs.pid << "\n";
        missLog += ss.str();
    }
    if (label.find("executor_task") != std::string::npos) {
        return true;
    }
    int gid = -1;
    size_t pos = fakeArgs.log.find_last_of('|');
    if (pos != std::string::npos) {
        if (pos + 1 >= fakeArgs.log.size()) {
            return true;
        }
        std::string gidStr = fakeArgs.log.substr(pos + 1);
        auto [ptr, ec] = std::from_chars(gidStr.data(), gidStr.data() + gidStr.size(), gid);
        if (ec != std::errc{}) {
            return true;
        }
    }
    if (taskLabels[fakeArgs.pid].find(gid) == taskLabels[fakeArgs.pid].end()) {
        taskLabels[fakeArgs.pid][gid] = label;
    }
    fakeArgs.taskRunning = gid;
    FakeLogArgs fakArg2{fakeArgs.pid,
                        fakeArgs.tid,
                        fakeArgs.taskRunning,
                        fakeArgs.prio,
                        fakeArgs.lineno,
                        fakeArgs.switchInFakeLog,
                        fakeArgs.switchOutFakeLog,
                        fakeArgs.log,
                        fakeArgs.tname,
                        taskLabels[fakeArgs.pid][fakeArgs.taskRunning],
                        fakeArgs.cpuId,
                        fakeArgs.timestamp};
    std::string fakeLog = MakeCostartFakeLog(fakArg2);
    context_[fakeArgs.lineno] = fakeLog;
    if (!missLog.empty()) {
        context_[fakeArgs.lineno] = missLog + context_[fakeArgs.lineno];
    }
    FakeLogArgs fakArg3{fakeArgs.pid,
                        fakeArgs.tid,
                        fakeArgs.taskRunning,
                        fakeArgs.prio,
                        fakeArgs.lineno,
                        fakeArgs.switchInFakeLog,
                        fakeArgs.switchOutFakeLog,
                        fakeArgs.log,
                        fakeArgs.tname,
                        taskLabels[fakeArgs.pid][fakeArgs.taskRunning],
                        fakeArgs.cpuId,
                        fakeArgs.timestamp};
    if (wakeLogs.find(fakeArgs.taskRunning) != wakeLogs.end()) {
        int prevIndex = FindGreaterThan(wakeLogs[fakeArgs.taskRunning], fakeArgs.lineno);
        if (prevIndex > 0) {
            int linenoWake = wakeLogs[fakeArgs.taskRunning][prevIndex - 1];
            if (schedWakeFlag.find(linenoWake) == schedWakeFlag.end()) {
                context_[linenoWake] = MakeWakeupFakeLog(context_[linenoWake], fakArg3, tracingMarkerKey_);
                schedWakeFlag[linenoWake] = 0;
            }
        }
    }
    return true;
}

static bool IsFfrtTaskBlockOrFinishNohos(ConStr &log)
{
    static const std::string fStr = " F|";
    size_t fPos = log.find(fStr);
    if (fPos == std::string::npos) {
        return false;
    }
    size_t firstNumberEndPos = log.find('|', fPos + fStr.size());
    if (firstNumberEndPos == std::string::npos) {
        return false;
    }
    std::string firstNumber = log.substr(fPos + 3, firstNumberEndPos - (fPos + fStr.size()));
    bool isValidNumber = true;
    for (char c : firstNumber) {
        if (!std::isdigit(c)) {
            isValidNumber = false;
            break;
        }
    }
    if (!isValidNumber) {
        return false;
    }
    size_t typePos = firstNumberEndPos + 1;
    if (typePos < log.length() && (log[typePos] == 'B' || log[typePos] == 'F')) {
        size_t thirdPipePos = log.find('|', typePos + 1);
        if (thirdPipePos != std::string::npos) {
            size_t secondNumberPos = thirdPipePos + 1;
            if (secondNumberPos < log.length() && std::isdigit(log[secondNumberPos])) {
                return true;
            }
        }
    }
    return false;
}

bool FfrtConverter::HandlePreLinenoNohos(FakeLogArgs &fakArg,
                                         WakeLogs &wakeLogs,
                                         TaskLabels &taskLabels,
                                         std::unordered_map<int, int> &schedWakeFlag)
{
    std::string label = ExtractTaskLable(fakArg.log);
    if (HandleHFfrtTaskExecute(fakArg, wakeLogs, taskLabels, label, schedWakeFlag)) {
        return true;
    }
    if (fakArg.taskRunning != -1) {
        if (IsFfrtTaskBlockOrFinishNohos(fakArg.log)) {
            std::string fakeLog = MakeCoyieldFakeLog(fakArg);
            context_[fakArg.lineno] = fakeLog;
            fakArg.taskRunning = -1;
            return true;
        }
        label = taskLabels[fakArg.pid][fakArg.taskRunning];
        std::string fakeLog = ConvertWorkerLogToTask(fakArg.log, fakArg.pid, fakArg.tid, fakArg.taskRunning, label);
        context_[fakArg.lineno] = fakeLog;
        return true;
    }
    return false;
}
void FfrtConverter::ExceTaskLabelNohos(TaskLabels &taskLabels,
                                       FfrtWakeLogs &ffrtWakeLogs,
                                       std::pair<int, FfrtTidMap> pidItem,
                                       std::unordered_map<int, int> &schedWakeFlag)
{
    bool oneF = false;
    bool twoF = false;
    taskLabels[pidItem.first] = {};
    WakeLogs tmp = {};
    WakeLogs &wakeLogs = (ffrtWakeLogs.find(pidItem.first) != ffrtWakeLogs.end()) ? ffrtWakeLogs[pidItem.first] : tmp;

    for (auto &tidItem : pidItem.second) {
        std::string tname = tidItem.second.first;
        std::vector<int> linenos = tidItem.second.second;
        int prio = 120;
        int taskRunning = -1;

        for (auto lineno : linenos) {
            std::string &log = context_[lineno];

            HandleMarks(log, lineno, pidItem.first);
            HandleSchedSwitch(log, tidItem.first, prio);

            std::string cpuId = ExtractCpuId(log);
            std::string timestamp = ExtractTimeStr(log);
            std::string label = ExtractTaskLable(log);

            FakeLogArgs fakArg{pidItem.first, tidItem.first, taskRunning, prio,  lineno,
                               oneF,          twoF,          log,         tname, taskLabels[pidItem.first][taskRunning],
                               cpuId,         timestamp};
            HandlePreLinenoNohos(fakArg, wakeLogs, taskLabels, schedWakeFlag);
        }
    }
}

void FfrtConverter::ConvertFrrtThreadToFfrtTaskNohos(FfrtPids &ffrtPids, FfrtWakeLogs &ffrtWakeLogs)
{
    TaskLabels taskLabels;
    std::unordered_map<int, int> schedWakeFlag;
    taskLabels.reserve(ffrtPids.size());
    schedWakeFlag.reserve(ffrtWakeLogs.size());

    for (auto &pidItem : ffrtPids) {
        ExceTaskLabelNohos(taskLabels, ffrtWakeLogs, pidItem, schedWakeFlag);
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
