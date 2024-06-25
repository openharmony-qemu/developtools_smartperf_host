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
#include "ffrt_converter.h"

namespace SysTuning {
namespace TraceStreamer {
bool FfrtConverter::RecoverTraceAndGenerateNewFile(const std::string &ffrtFileName, std::ofstream &outFile)
{
    std::ifstream ffrtFile(ffrtFileName);
    if (!ffrtFile.is_open() || !outFile.is_open()) {
        TS_LOGE("ffrtFile or outFile is invalid.");
        return false;
    }
    std::string line;
    while (std::getline(ffrtFile, line))
        context_.emplace_back(line);
    ffrtFile.close();
    InitTracingMarkerKey();
    ClassifyContextForFfrtWorker();
    ConvertFfrtThreadToFfrtTask();
    for (const std::string &oneLine : context_) {
        outFile << oneLine << std::endl;
    }
    Clear();
    return true;
}
void FfrtConverter::Clear()
{
    context_.clear();
    ffrtPidMap_.clear();
    taskLabels_.clear();
}
void FfrtConverter::InitTracingMarkerKey()
{
    for (auto line : context_) {
        if (line.find(" tracing_mark_write: ") != std::string::npos) {
            tracingMarkerKey_ = "tracing_mark_write: ";
            break;
        }
        if (line.find(" print: ") != std::string::npos) {
            tracingMarkerKey_ = "print: ";
            break;
        }
    }
}
int FfrtConverter::ExtractProcessId(const size_t index)
{
    std::smatch match;
    static const std::regex pidPattern = std::regex(R"(\(\s*\d+\) \[)");
    if (!std::regex_search(context_[index], match, pidPattern)) {
        return 0;
    }
    for (size_t i = 0; i < match.size(); i++) {
        if (match[i] == '-') {
            return 0;
        }
    }
    auto beginPos = match.str().find('(') + 1;
    auto endPos = match.str().find(')');
    return std::stoi(match.str().substr(beginPos, endPos - beginPos));
}

std::string FfrtConverter::ExtractTimeStr(const std::string &log)
{
    std::smatch match;
    static const std::regex timePattern = std::regex(R"( (\d+)\.(\d+):)");
    if (std::regex_search(log, match, timePattern)) {
        return match.str().substr(1, match.str().size() - STR_LEGH);
    }
    return "";
}

std::string FfrtConverter::ExtractCpuId(const std::string &log)
{
    std::smatch match;
    static const std::regex cpuIdPattern = std::regex(R"(\) \[.*?\])");
    if (std::regex_search(log, match, cpuIdPattern)) {
        auto beginPos = match.str().find('[') + 1;
        auto endPos = match.str().find(']');
        return match.str().substr(beginPos, endPos - beginPos);
    }
    return "";
}

std::string FfrtConverter::MakeBeginFakeLog(const std::string &mark,
                                            const long long gid,
                                            const int prio,
                                            const ThreadInfo &threadInfo)
{
    auto beginTimeStamp = ExtractTimeStr(mark);
    auto cpuId = ExtractCpuId(mark);
    std::unique_ptr<char[]> result = std::make_unique<char[]>(MAX_LEN);
    auto taskId = GetTaskId(threadInfo.pid, gid);
    (void)sprintf_s(
        result.get(), MAX_LEN,
        "\n  %s-%d    (%7d) [%s] ....   %s: sched_switch: prev_comm=%s prev_pid=%d prev_prio=%d prev_state=S ==> "
        "next_comm=%s next_pid=%s next_prio=%d\n",
        threadInfo.name.c_str(), threadInfo.tid, threadInfo.pid, cpuId.c_str(), beginTimeStamp.c_str(),
        threadInfo.name.c_str(), threadInfo.tid, prio, taskLabels_[threadInfo.pid][gid].c_str(), taskId.c_str(), prio);
    return mark + result.get();
}

std::string FfrtConverter::MakeEndFakeLog(const std::string &mark,
                                          const long long gid,
                                          const int prio,
                                          const ThreadInfo &threadInfo)
{
    auto endTimeStamp = ExtractTimeStr(mark);
    auto cpuId = ExtractCpuId(mark);
    std::unique_ptr<char[]> result = std::make_unique<char[]>(MAX_LEN);
    auto taskId = GetTaskId(threadInfo.pid, gid);
    (void)sprintf_s(
        result.get(), MAX_LEN,
        "  %s-%s    (%7d) [%s] ....   %s: sched_switch: prev_comm=%s prev_pid=%s prev_prio=%d prev_state=S ==> "
        "next_comm=%s next_pid=%d next_prio=%d\n",
        taskLabels_[threadInfo.pid][gid].c_str(), taskId.c_str(), threadInfo.pid, cpuId.c_str(), endTimeStamp.c_str(),
        taskLabels_[threadInfo.pid][gid].c_str(), taskId.c_str(), prio, threadInfo.name.c_str(), threadInfo.tid, prio);
    std::string fakeLog = result.get();
    memset_s(result.get(), MAX_LEN, 0, MAX_LEN);
    return fakeLog;
}

std::string FfrtConverter::ReplaceSchedSwitchLog(std::string &fakeLog,
                                                 const std::string &mark,
                                                 const int pid,
                                                 const long long gid,
                                                 const int tid)
{
    std::unique_ptr<char[]> result = std::make_unique<char[]>(MAX_LEN);
    std::smatch match;
    auto taskId = GetTaskId(pid, gid);
    if (mark.find("prev_pid=" + std::to_string(tid)) != std::string::npos) {
        if (regex_search(fakeLog, match, indexPattern_) && fakeLog.find("prev_comm=") != std::string::npos &&
            fakeLog.find("prev_prio=") != std::string::npos) {
            auto beginPos = fakeLog.find(match.str());
            (void)sprintf_s(result.get(), MAX_LEN, "  %s-%s ", taskLabels_[pid][gid].c_str(), taskId.c_str());
            fakeLog = result.get() + fakeLog.substr(beginPos);
            size_t pcommPos = fakeLog.find("prev_comm=");
            size_t pPidPos = fakeLog.find("prev_pid=");
            memset_s(result.get(), MAX_LEN, 0, MAX_LEN);
            (void)sprintf_s(result.get(), MAX_LEN, "prev_comm=%s ", taskLabels_[pid][gid].c_str());
            fakeLog = fakeLog.substr(0, pcommPos) + result.get() + fakeLog.substr(pPidPos);
            memset_s(result.get(), MAX_LEN, 0, MAX_LEN);
            pPidPos = fakeLog.find("prev_pid=");
            size_t pPrioPos = fakeLog.find("prev_prio=");
            (void)sprintf_s(result.get(), MAX_LEN, "prev_pid=%s ", taskId.c_str());
            fakeLog = fakeLog.substr(0, pPidPos) + result.get() + fakeLog.substr(pPrioPos);
            memset_s(result.get(), MAX_LEN, 0, MAX_LEN);
        }
    } else if (mark.find("next_pid=" + std::to_string(tid)) != std::string::npos &&
               fakeLog.find("next_comm=") != std::string::npos && fakeLog.find("next_prio=") != std::string::npos) {
        (void)sprintf_s(result.get(), MAX_LEN, "next_comm=%s ", taskLabels_[pid][gid].c_str());
        size_t nCommPos = fakeLog.find("next_comm=");
        size_t nPidPos = fakeLog.find("next_pid=");
        fakeLog = fakeLog.substr(0, nCommPos) + result.get() + fakeLog.substr(nPidPos);
        memset_s(result.get(), MAX_LEN, 0, MAX_LEN);
        (void)sprintf_s(result.get(), MAX_LEN, "next_pid=%s ", taskId.c_str());
        nPidPos = fakeLog.find("next_pid=");
        size_t nPrioPos = fakeLog.find("next_prio=");
        fakeLog = fakeLog.substr(0, nPidPos) + result.get() + fakeLog.substr(nPrioPos);
    }
    return fakeLog;
}

std::string FfrtConverter::ReplaceSchedWakeLog(std::string &fakeLog,
                                               const std::string &label,
                                               const int pid,
                                               const long long gid)
{
    std::unique_ptr<char[]> result = std::make_unique<char[]>(MAX_LEN);
    auto taskId = GetTaskId(pid, gid);
    (void)sprintf_s(result.get(), MAX_LEN, "comm=%s ", label.c_str());
    size_t commPos = fakeLog.find("comm=");
    size_t pidPos = fakeLog.find("pid=");
    if (commPos != std::string::npos && pidPos != std::string::npos) {
        fakeLog = fakeLog.substr(0, commPos) + result.get() + fakeLog.substr(pidPos);
        memset_s(result.get(), MAX_LEN, 0, MAX_LEN);
        (void)sprintf_s(result.get(), MAX_LEN, "pid=%s ", taskId.c_str());
        pidPos = fakeLog.find("pid=");
        size_t prioPos = fakeLog.find("prio=");
        if (prioPos != std::string::npos) {
            fakeLog = fakeLog.substr(0, pidPos) + result.get() + fakeLog.substr(prioPos);
        }
    }
    return fakeLog;
}

std::string FfrtConverter::ReplaceSchedBlockLog(std::string &fakeLog, const int pid, const long long gid)
{
    std::unique_ptr<char[]> result = std::make_unique<char[]>(MAX_LEN);
    auto taskId = GetTaskId(pid, gid);
    (void)sprintf_s(result.get(), MAX_LEN, "pid=%s ", taskId.c_str());
    size_t pidPos = fakeLog.find("pid");
    size_t ioPos = fakeLog.find("iowait=");
    if (pidPos != std::string::npos && ioPos != std::string::npos) {
        fakeLog = fakeLog.substr(0, pidPos) + result.get() + fakeLog.substr(ioPos);
    }
    return fakeLog;
}
std::string FfrtConverter::ReplaceTracingMarkLog(std::string &fakeLog,
                                                 const std::string &label,
                                                 const int pid,
                                                 const long long gid)
{
    std::unique_ptr<char[]> result = std::make_unique<char[]>(MAX_LEN);
    std::smatch match;
    auto taskId = GetTaskId(pid, gid);
    if (regex_search(fakeLog, match, indexPattern_)) {
        auto beginPos = fakeLog.find(match.str());
        (void)sprintf_s(result.get(), MAX_LEN, "  %s-%s ", label.c_str(), taskId.c_str());
        fakeLog = result.get() + fakeLog.substr(beginPos);
    }
    return fakeLog;
}
std::string FfrtConverter::ConvertWorkerLogToTask(const std::string &mark,
                                                  const int pid,
                                                  const long long gid,
                                                  const int tid)
{
    std::string fakeLog = mark;
    if (mark.find("sched_switch: ") != std::string::npos) {
        return ReplaceSchedSwitchLog(fakeLog, mark, pid, gid, tid);
    }
    if (mark.find(": sched_wak") != std::string::npos) {
        return ReplaceSchedWakeLog(fakeLog, taskLabels_[pid][gid], pid, gid);
    }
    if (mark.find("sched_blocked_reason: ") != std::string::npos) {
        return ReplaceSchedBlockLog(fakeLog, pid, gid);
    }
    return ReplaceTracingMarkLog(fakeLog, taskLabels_[pid][gid], pid, gid);
}
int FfrtConverter::FindIntNumberAfterStr(const size_t index, const string &str)
{
    auto beginPos = context_[index].find(str);
    if (beginPos != std::string::npos) {
        beginPos = beginPos + str.length();
        auto endPos = context_[index].find_first_of(" ", beginPos);
        return stoi(context_[index].substr(beginPos, endPos - beginPos));
    }
    return -1;
}
std::string FfrtConverter::FindSubStrAfterStr(const size_t index, const string &str)
{
    auto beginPos = context_[index].find(str) + str.length();
    auto endPos = context_[index].find_first_of(" ", beginPos);
    return context_[index].substr(beginPos, endPos - beginPos);
}
void FfrtConverter::ClassifySchedSwitchData(const size_t index, std::unordered_map<int, std::vector<int>> &traceMap)
{
    auto prevTid = FindIntNumberAfterStr(index, "prev_pid=");
    auto nextTid = FindIntNumberAfterStr(index, "next_pid=");
    // update sched_switch prev_pid and next_pid corresponding line number
    if (prevTid != -1 && traceMap.count(prevTid) == 0) {
        traceMap[prevTid] = std::vector<int>();
    }
    if (nextTid != -1 && traceMap.count(nextTid) == 0) {
        traceMap[nextTid] = std::vector<int>();
    }
    traceMap[prevTid].push_back(index);
    traceMap[nextTid].push_back(index);

    // Get thread name as ffrtxxx or OS_FFRTxxx
    if (context_[index].find("prev_comm=ffrt") != std::string::npos ||
        context_[index].find("prev_comm=OS_FFRT") != std::string::npos) {
        auto pid = ExtractProcessId(index);
        if (ffrtPidMap_.count(pid) == 0 || ffrtPidMap_[pid].count(prevTid) == 0) {
            ffrtPidMap_[pid][prevTid].name = FindSubStrAfterStr(index, "prev_comm=");
        }
    }
    return;
}
void FfrtConverter::FindFfrtProcessAndClassify(const size_t index, std::unordered_map<int, std::vector<int>> &traceMap)
{
    if (context_[index].find("sched_switch") != std::string::npos) {
        ClassifySchedSwitchData(index, traceMap);
        return;
    }
    if (context_[index].find(": sched_wak") != std::string::npos ||
        (context_[index].find("sched_blocked_reason:") != std::string::npos)) {
        auto tid = FindIntNumberAfterStr(index, "pid=");
        if (traceMap.find(tid) == traceMap.end()) {
            traceMap[tid] = std::vector<int>();
        }
        traceMap[tid].push_back(index);
        return;
    }
    static std::smatch match;
    if (std::regex_search(context_[index], match, matchPattern_)) {
        auto endPos = context_[index].find(match.str());
        std::string res = context_[index].substr(0, endPos);
        std::string begin = "-";
        auto beginPos = res.find_last_of(begin);
        if (beginPos != std::string::npos) {
            beginPos = beginPos + begin.length();
            auto tid = stoi(context_[index].substr(beginPos, endPos - beginPos));
            if (traceMap.find(tid) == traceMap.end()) {
                traceMap[tid] = std::vector<int>();
            }
            traceMap[tid].push_back(index);
        }
    }
    return;
}

std::string FfrtConverter::GetTaskId(int pid, long long gid)
{
    stringstream ss;
    ss << pid << "0" << gid;
    auto str = ss.str();
    while (str.size() > uint32MaxLength_) {
        str.erase(0, 1);
    }
    auto result = stoll(str);
    if (result > INVALID_UINT32) {
        str.erase(0, 1);
    }
    return str;
}

bool FfrtConverter::IsDigit(const std::string &str)
{
    auto endPos = str.find_last_not_of(" ");
    string newStr = str;
    newStr.erase(endPos + 1);
    if (newStr.back() == '\r') {
        newStr.pop_back();
    }
    for (int i = 0; i < newStr.length(); i++) {
        if (!std::isdigit(newStr[i])) {
            return false;
        }
    }
    return true;
}

void FfrtConverter::ClassifyContextForFfrtWorker()
{
    std::unordered_map<int, std::vector<int>> traceMap;
    for (auto index = 0; index < context_.size(); index++) {
        FindFfrtProcessAndClassify(index, traceMap);
    }
    for (auto &[pid, threads] : ffrtPidMap_) {
        for (const auto &thread : threads) {
            auto tid = thread.first;
            ffrtPidMap_[pid][tid].indices = traceMap[tid];
        }
    }
}
void FfrtConverter::ConvertFfrtThreadToFfrtTask()
{
    int prio;
    for (auto &[pid, threads] : ffrtPidMap_) {
        taskLabels_[pid] = {};
        for (auto &[tid, ffrtContent] : ffrtPidMap_[pid]) {
            ThreadInfo threadInfo;
            threadInfo.pid = pid;
            threadInfo.tid = tid;
            threadInfo.name = ffrtContent.name;
            auto switchInFakeLog = false;
            auto switchOutFakeLog = false;
            auto ffbkMarkRemove = false;
            auto gid = WAKE_EVENT_DEFAULT_VALUE;
            for (auto index : ffrtContent.indices) {
                ProcessMarkWithSchedSwitch(tid, prio, index);
                if (context_[index].find("|FFRT") != std::string::npos ||
                    context_[index].find("|H:FFRT") != std::string::npos) {
                    if (!ProcessMarkWithFFRT(index, prio, gid, threadInfo)) {
                        continue;
                    }
                    switchInFakeLog = true;
                    continue;
                }
                if (gid != WAKE_EVENT_DEFAULT_VALUE) {
                    if (!DeleteRedundance(switchInFakeLog, switchOutFakeLog, index)) {
                        continue;
                    }
                    static const std::regex EndPattern = std::regex(R"( F\|(\d+)\|[BF]\|(\d+))");
                    static const std::regex HEndPattern = std::regex(R"( F\|(\d+)\|H:[BF]\s(\d+))");
                    if (std::regex_search(context_[index], EndPattern) ||
                        std::regex_search(context_[index], HEndPattern)) {
                        context_[index] = MakeEndFakeLog(context_[index], gid, prio, threadInfo);
                        gid = WAKE_EVENT_DEFAULT_VALUE;
                        switchOutFakeLog = false;
                        continue;
                    }
                    context_[index] = ConvertWorkerLogToTask(context_[index], pid, gid, tid);
                    continue;
                }
            }
        }
    }
}
void FfrtConverter::ProcessMarkWithSchedSwitch(const int tid, int &prio, const size_t index)
{
    if (context_[index].find("sched_switch:") != std::string::npos) {
        if (context_[index].find("prev_pid=" + std::to_string(tid) + " ") != std::string::npos) {
            static std::string beginPprio = "prev_prio=";
            auto beginPos = context_[index].find(beginPprio);
            if (beginPos != std::string::npos) {
                beginPos = beginPos + beginPprio.length();
                auto endPos = context_[index].find_first_of(" ", beginPos);
                prio = stoi(context_[index].substr(beginPos, endPos - beginPos));
            }
        } else if (context_[index].find("next_pid=" + std::to_string(tid)) != std::string::npos) {
            static std::string beginNprio = "next_prio=";
            auto beginPos = context_[index].find(beginNprio);
            if (beginPos != std::string::npos) {
                beginPos = beginPos + beginNprio.length();
                prio = stoi(context_[index].substr(beginPos));
            }
        }
    }
}
std::string FfrtConverter::GetLabel(const string &line)
{
    std::string label;
    if (line.find("|H:FFRT") != std::string::npos) {
        if (line.find("H:FFRT::") != std::string::npos) {
            auto beginPos = line.rfind("[");
            auto endPos = line.rfind("]");
            if (beginPos != std::string::npos && endPos != std::string::npos) {
                label = line.substr(beginPos + 1, endPos - beginPos - 1);
            }
        } else {
            static std::string indexHFfrt = "|H:FFRT";
            auto beginPos = line.find(indexHFfrt);
            beginPos = beginPos + indexHFfrt.length();
            auto endPos = line.find_first_of("|", beginPos);
            if (endPos != std::string::npos) {
                label = line.substr(beginPos, endPos - beginPos);
            }
        }
    } else {
        if (line.find("|FFRT::") != std::string::npos) {
            auto beginPos = line.rfind("[");
            auto endPos = line.rfind("]");
            if (beginPos != std::string::npos && endPos != std::string::npos) {
                label = line.substr(beginPos + 1, endPos - beginPos - 1);
            }
        } else {
            static std::string indexFfrt = "|FFRT";
            auto beginPos = line.find(indexFfrt);
            beginPos = beginPos + indexFfrt.length();
            auto endPos = line.find_first_of("|", beginPos);
            if (endPos != std::string::npos) {
                label = line.substr(beginPos, endPos - beginPos);
            }
        }
    }
    return label;
}
bool FfrtConverter::ProcessMarkWithFFRT(const int index, int &prio, int32_t &gid, const ThreadInfo &threadInfo)
{
    auto line = context_[index];
    auto label = GetLabel(line);
    if (label.find("executor_task") != std::string::npos || label.find("ex_task") != std::string::npos) {
        return false;
    }
    std::string missLog;
    if (gid != WAKE_EVENT_DEFAULT_VALUE) {
        missLog = MakeEndFakeLog(line, gid, prio, threadInfo);
        auto timestamp = ExtractTimeStr(line);
        auto cpuId = ExtractCpuId(line);
        std::unique_ptr<char[]> result = std::make_unique<char[]>(MAX_LEN);
        (void)sprintf_s(result.get(), MAX_LEN, "  %s-%d    (%7d) [%s] ....   %s: %sE|%d\n", threadInfo.name.c_str(),
                        threadInfo.tid, threadInfo.pid, cpuId.c_str(), timestamp.c_str(), tracingMarkerKey_.c_str(),
                        threadInfo.pid);
        missLog = missLog + result.get();
        memset_s(result.get(), MAX_LEN, 0, MAX_LEN);
    }
    auto beginPos = line.rfind("|");
    if (beginPos == std::string::npos || !IsDigit(line.substr(beginPos + 1))) {
        return false;
    }
    gid = stoll(line.substr(beginPos + 1));
    if (taskLabels_[threadInfo.pid].count(gid) == 0) {
        taskLabels_[threadInfo.pid][gid] = label;
    }
    context_[index] = MakeBeginFakeLog(line, gid, prio, threadInfo);
    if (!missLog.empty()) {
        context_[index] = missLog + context_[index];
    }
    return true;
}
bool FfrtConverter::DeleteRedundance(bool &switchInFakeLog, bool &switchOutFakeLog, const int index)
{
    static const std::regex CoPattern = std::regex(R"( F\|(\d+)\|Co\|(\d+))");
    static const std::regex HCoPattern = std::regex(R"( F\|(\d+)\|H:Co\s(\d+))");
    if (std::regex_search(context_[index], CoPattern) || std::regex_search(context_[index], HCoPattern)) {
        context_[index].clear();
        if (switchInFakeLog) {
            switchInFakeLog = false;
            return false;
        } else {
            switchOutFakeLog = true;
            return false;
        }
    }
    if (switchInFakeLog && (context_[index].find(tracingMarkerKey_ + "B") != std::string::npos)) {
        context_[index].clear();
        return false;
    }
    if (switchOutFakeLog && (context_[index].find(tracingMarkerKey_ + "E") != std::string::npos)) {
        context_[index].clear();
        return false;
    }
    return true;
}
} // namespace TraceStreamer
} // namespace SysTuning
