/*
 * Copyright (c) 2021 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
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
bool FfrtConverter::RecoverTraceAndGenerateNewFile(const std::string& ffrtFileName, std::ofstream& outFile)
{
    std::ifstream ffrtFile(ffrtFileName);
    if (!ffrtFile.is_open() || !outFile.is_open()) {
        TS_LOGE("ffrtFile or outFile is invalid.");
        return false;
    }
    std::vector<std::string> lines;
    std::string line;
    while (std::getline(ffrtFile, line))
        lines.push_back(std::move(line));
    ffrtFile.close();
    CheckTraceMarker(lines);
    TypeFfrtPid result = ClassifyLogsForFfrtWorker(lines);
    ConvertFfrtThreadToFfrtTask(lines, result);
    for (const std::string& lineergodic : lines) {
        outFile << lineergodic << std::endl;
    }
    return true;
}
void FfrtConverter::CheckTraceMarker(vector<std::string>& lines)
{
    for (auto line : lines) {
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
int FfrtConverter::ExtractProcessId(const std::string& log)
{
    std::smatch match;
    static const std::regex pidPattern = std::regex(R"(\(\s*\d+\) \[)");
    if (std::regex_search(log, match, pidPattern)) {
        for (size_t i = 0; i < match.size(); i++) {
            if (match[i] == '-') {
                return 0;
            }
        }
        auto beginPos = match.str().find('(') + 1;
        auto endPos = match.str().find(')');
        return std::stoi(match.str().substr(beginPos, endPos - beginPos));
    } else {
        return 0;
    }
}

std::string FfrtConverter::ExtractTimeStr(const std::string& log)
{
    std::smatch match;
    static const std::regex timePattern = std::regex(R"( (\d+)\.(\d+):)");
    if (std::regex_search(log, match, timePattern)) {
        return match.str().substr(1, match.str().size() - STR_LEGH);
    } else {
        return "";
    }
}

std::string FfrtConverter::ExtractCpuId(const std::string& log)
{
    std::smatch match;
    static const std::regex cpuIdPattern = std::regex(R"(\) \[.*?\])");
    if (std::regex_search(log, match, cpuIdPattern)) {
        auto beginPos = match.str().find('[') + 1;
        auto endPos = match.str().find(']');
        return match.str().substr(beginPos, endPos - beginPos);
    } else {
        return "";
    }
}

std::string FfrtConverter::MakeBeginFakeLog(const std::string& mark,
                                            const int pid,
                                            const std::string& label,
                                            const long long gid,
                                            const int tid,
                                            const std::string& threadName,
                                            const int prio)
{
    auto beginTimeStamp = ExtractTimeStr(mark);
    auto cpuId = ExtractCpuId(mark);
    std::unique_ptr<char[]> result = std::make_unique<char[]>(MAX_LEN);
    auto taskId = GetTaskId(pid, gid);
    (void)sprintf_s(
        result.get(), MAX_LEN,
        "\n  %s-%d    (%7d) [%s] ....   %s: sched_switch: prev_comm=%s prev_pid=%d prev_prio=%d prev_state=S ==> "
        "next_comm=%s next_pid=%s next_prio=%d\n",
        threadName.c_str(), tid, pid, cpuId.c_str(), beginTimeStamp.c_str(), threadName.c_str(), tid, prio,
        label.c_str(), taskId.c_str(), prio);
    return mark + result.get();
}

std::string FfrtConverter::MakeEndFakeLog(const std::string& mark,
                                          const int pid,
                                          const std::string& label,
                                          const long long gid,
                                          const int tid,
                                          const std::string& threadName,
                                          const int prio)
{
    auto endTimeStamp = ExtractTimeStr(mark);
    auto cpuId = ExtractCpuId(mark);
    std::unique_ptr<char[]> result = std::make_unique<char[]>(MAX_LEN);
    auto taskId = GetTaskId(pid, gid);
    (void)sprintf_s(
        result.get(), MAX_LEN,
        "  %s-%s    (%7d) [%s] ....   %s: sched_switch: prev_comm=%s prev_pid=%s prev_prio=%d prev_state=S ==> "
        "next_comm=%s next_pid=%s next_prio=%d\n",
        label.c_str(), taskId.c_str(), pid, cpuId.c_str(), endTimeStamp.c_str(), label.c_str(), taskId.c_str(), prio,
        threadName.c_str(), tid, prio);
    std::string fakeLog = result.get();
    memset_s(result.get(), MAX_LEN, 0, MAX_LEN);
    return fakeLog;
}

std::string FfrtConverter::ReplaceSchedSwitchLog(std::string& fakeLog,
                                                 const std::string& mark,
                                                 const int pid,
                                                 const std::string& label,
                                                 const long long gid,
                                                 const int tid)
{
    std::unique_ptr<char[]> result = std::make_unique<char[]>(MAX_LEN);
    std::smatch match;
    auto taskId = GetTaskId(pid, gid);
    if (mark.find("prev_pid=" + std::to_string(tid)) != std::string::npos) {
        if (regex_search(fakeLog, match, indexPattern_)) {
            auto beginPos = fakeLog.find(match.str());
            (void)sprintf_s(result.get(), MAX_LEN, "  %s-%s ", label.c_str(), taskId.c_str());
            fakeLog = result.get() + fakeLog.substr(beginPos);
            size_t pcommPos = fakeLog.find("prev_comm=");
            size_t pPidPos = fakeLog.find("prev_pid=");
            memset_s(result.get(), MAX_LEN, 0, MAX_LEN);
            (void)sprintf_s(result.get(), MAX_LEN, "prev_comm=%s ", label.c_str());
            fakeLog = fakeLog.substr(0, pcommPos) + result.get() + fakeLog.substr(pPidPos);
            memset_s(result.get(), MAX_LEN, 0, MAX_LEN);
            pPidPos = fakeLog.find("prev_pid=");
            size_t pPrioPos = fakeLog.find("prev_prio=");
            (void)sprintf_s(result.get(), MAX_LEN, "prev_pid=%s ", taskId.c_str());
            fakeLog = fakeLog.substr(0, pPidPos) + result.get() + fakeLog.substr(pPrioPos);
            memset_s(result.get(), MAX_LEN, 0, MAX_LEN);
        }
    } else if (mark.find("next_pid=" + std::to_string(tid)) != std::string::npos) {
        (void)sprintf_s(result.get(), MAX_LEN, "next_comm=%s ", label.c_str());
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

std::string FfrtConverter::ReplaceSchedWakeLog(std::string& fakeLog,
                                               const std::string& label,
                                               const int pid,
                                               const long long gid)
{
    std::unique_ptr<char[]> result = std::make_unique<char[]>(MAX_LEN);
    auto taskId = GetTaskId(pid, gid);
    (void)sprintf_s(result.get(), MAX_LEN, "comm=%s ", label.c_str());
    size_t commPos = fakeLog.find("comm=");
    size_t pidPos = fakeLog.find("pid=");
    fakeLog = fakeLog.substr(0, commPos) + result.get() + fakeLog.substr(pidPos);
    memset_s(result.get(), MAX_LEN, 0, MAX_LEN);
    (void)sprintf_s(result.get(), MAX_LEN, "pid=%s ", taskId.c_str());
    pidPos = fakeLog.find("pid=");
    size_t prioPos = fakeLog.find("prio=");
    fakeLog = fakeLog.substr(0, pidPos) + result.get() + fakeLog.substr(prioPos);
    return fakeLog;
}

std::string FfrtConverter::ReplaceSchedBlockLog(std::string& fakeLog, const int pid, const long long gid)
{
    std::unique_ptr<char[]> result = std::make_unique<char[]>(MAX_LEN);
    auto taskId = GetTaskId(pid, gid);
    (void)sprintf_s(result.get(), MAX_LEN, "pid=%s ", taskId.c_str());
    size_t pidPos = fakeLog.find("pid");
    size_t ioPos = fakeLog.find("iowait=");
    fakeLog = fakeLog.substr(0, pidPos) + result.get() + fakeLog.substr(ioPos);
    return fakeLog;
}
std::string FfrtConverter::ReplaceTracingMarkLog(std::string& fakeLog,
                                                 const std::string& label,
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
std::string FfrtConverter::ConvertWorkerLogToTask(const std::string& mark,
                                                  const int pid,
                                                  const std::string& label,
                                                  const long long gid,
                                                  const int tid)
{
    std::string fakeLog = mark;
    if (mark.find("sched_switch: ") != std::string::npos) {
        return ReplaceSchedSwitchLog(fakeLog, mark, pid, label, gid, tid);
    }
    if (mark.find(": sched_wak") != std::string::npos) {
        return ReplaceSchedWakeLog(fakeLog, label, pid, gid);
    }
    if (mark.find("sched_blocked_reason: ") != std::string::npos) {
        return ReplaceSchedBlockLog(fakeLog, pid, gid);
    }
    return ReplaceTracingMarkLog(fakeLog, label, pid, gid);
}
int FfrtConverter::FindTid(std::string& log)
{
    std::string index = "prev_pid=";
    auto beginPos = log.find(index);
    auto endPos = log.find_first_of(" ", beginPos);
    beginPos = beginPos + index.length();
    auto tid = stoi(log.substr(beginPos, endPos - beginPos));
    return tid;
}

void FfrtConverter::ClassifySchedSwitchLogs(std::string& log,
                                            size_t line,
                                            std::unordered_map<int, std::vector<int>>& traceMap,
                                            FfrtConverter::TypeFfrtPid& ffrtPidsMap)
{
    if (log.find("prev_comm=ffrt") != std::string::npos || log.find("prev_comm=OS_FFRT") != std::string::npos) {
        auto pid = ExtractProcessId(log);
        if (ffrtPidsMap.find(pid) == ffrtPidsMap.end()) {
            ffrtPidsMap[pid] = {};
        }
        std::string begin = "prev_comm=";
        std::string end = " prev_pid=";
        auto beginPos = log.find(begin) + begin.length();
        auto endPos = log.find(end);
        auto tid = FindTid(log);
        if (ffrtPidsMap[pid].find(tid) == ffrtPidsMap[pid].end()) {
            ffrtPidsMap[pid][tid].name = log.substr(beginPos, endPos - beginPos);
        }
    }
    auto prevTid = FindTid(log);
    if (traceMap.find(prevTid) == traceMap.end()) {
        traceMap[prevTid] = std::vector<int>();
    }
    traceMap[prevTid].push_back(line);
    std::string begin = "next_pid=";
    auto beginPos = log.find(begin) + begin.length();
    std::string end = " next_prio=";
    auto endPos = log.find(end);
    auto nextTid = stoi(log.substr(beginPos, endPos - beginPos));
    if (traceMap.find(nextTid) == traceMap.end()) {
        traceMap[nextTid] = std::vector<int>();
    }
    traceMap[nextTid].push_back(line);
    return;
}
void FfrtConverter::FindFfrtProcessAndClassifyLogs(std::string& log,
                                                   size_t line,
                                                   std::unordered_map<int, std::vector<int>>& traceMap,
                                                   FfrtConverter::TypeFfrtPid& ffrtPidsMap)
{
    if (log.find("sched_switch") != std::string::npos) {
        ClassifySchedSwitchLogs(log, line, traceMap, ffrtPidsMap);
        return;
    }
    if (log.find(": sched_wak") != std::string::npos || (log.find("sched_blocked_reason:") != std::string::npos)) {
        std::string begin = "pid=";
        auto beginPos = log.find(begin);
        auto endPos = log.find_first_of(" ", beginPos);
        beginPos = beginPos + begin.length();
        auto tid = stoi(log.substr(beginPos, endPos - beginPos));
        if (traceMap.find(tid) == traceMap.end()) {
            traceMap[tid] = std::vector<int>();
        }
        traceMap[tid].push_back(line);
        return;
    }
    static std::smatch match;
    if (std::regex_search(log, match, matchPattern_)) {
        auto endPos = log.find(match.str());
        std::string res = log.substr(0, endPos);
        std::string begin = "-";
        auto beginPos = res.find_last_of(begin);
        beginPos = beginPos + begin.length();
        auto tid = stoi(log.substr(beginPos, endPos - beginPos));
        if (traceMap.find(tid) == traceMap.end()) {
            traceMap[tid] = std::vector<int>();
        }
        traceMap[tid].push_back(line);
    }
    return;
}

std::string FfrtConverter::GetTaskId(int pid, long long gid)
{
    std::stringstream ss;
    auto max = INVALID_UINT32 / scaleFactor_;
    int length = 1;
    auto temp = gid;
    while (temp > 0) {
        temp /= scaleFactor_;
        length++;
        max /= scaleFactor_;
    }
    while (pid >= max) {
        pid /= scaleFactor_;
    }
    ss << pid << "0" << gid;
    return ss.str();
}

bool FfrtConverter::IsDigit(const std::string& str)
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

FfrtConverter::TypeFfrtPid FfrtConverter::ClassifyLogsForFfrtWorker(vector<std::string>& results)
{
    TypeFfrtPid ffrtPidMap;
    std::unordered_map<int, std::vector<int>> traceMap;
    for (auto line = 0; line < results.size(); line++) {
        FindFfrtProcessAndClassifyLogs(results[line], line, traceMap, ffrtPidMap);
    }
    for (auto& [pid, tids] : ffrtPidMap) {
        for (const auto& pair : tids) {
            auto tid = pair.first;
            ffrtPidMap[pid][tid].line = traceMap[tid];
        }
    }
    return ffrtPidMap;
}
void FfrtConverter::UpdatePrio(int& prio, const std::string& mark, const int tid)
{
    if (mark.find("sched_switch:") == std::string::npos) {
        return;
    }
    if (mark.find("prev_pid=" + std::to_string(tid) + " ") != std::string::npos) {
        static std::string beginPprio = "prev_prio=";
        auto beginPos = mark.find(beginPprio);
        beginPos = beginPos + beginPprio.length();
        auto endPos = mark.find_first_of(" ", beginPos);
        prio = stoi(mark.substr(beginPos, endPos - beginPos));
    } else if (mark.find("next_pid=" + std::to_string(tid)) != std::string::npos) {
        static std::string beginNprio = "next_prio=";
        auto beginPos = mark.find(beginNprio);
        beginPos = beginPos + beginNprio.length();
        prio = stoi(mark.substr(beginPos));
    }
}
std::string FfrtConverter::GetLabel(const string& mark)
{
    std::string label;
    if (mark.find("|H:FFRT") != std::string::npos) {
        if (mark.find("H:FFRT::") != std::string::npos) {
            auto beginPos = mark.rfind("[");
            auto endPos = mark.rfind("]");
            auto label = mark.substr(beginPos + 1, endPos - beginPos - 1);
        } else {
            static std::string indexHFfrt = "|H:FFRT";
            auto beginPos = mark.find(indexHFfrt);
            beginPos = beginPos + indexHFfrt.length();
            auto endPos = mark.find_first_of("|", beginPos);
            label = mark.substr(beginPos, endPos - beginPos);
        }
    } else {
        if (mark.find("|FFRT::") != std::string::npos) {
            auto beginPos = mark.rfind("[");
            auto endPos = mark.rfind("]");
            auto label = mark.substr(beginPos + 1, endPos - beginPos - 1);
        } else {
            static std::string indexFfrt = "|FFRT";
            auto beginPos = mark.find(indexFfrt);
            beginPos = beginPos + indexFfrt.length();
            auto endPos = mark.find_first_of("|", beginPos);
            label = mark.substr(beginPos, endPos - beginPos);
        }
    }
    return label;
}
std::string FfrtConverter::getNewMissLog(std::string& missLog,
                                         const std::string& mark,
                                         const int pid,
                                         const int tid,
                                         std::string threadName)
{
    auto timestamp = ExtractTimeStr(mark);
    auto cpuId = ExtractCpuId(mark);
    std::unique_ptr<char[]> result = std::make_unique<char[]>(MAX_LEN);
    (void)sprintf_s(result.get(), MAX_LEN, "  %s-%d    (%7d) [%s] ....   %s: %sE|%d\n", threadName.c_str(), tid, pid,
                    cpuId.c_str(), timestamp.c_str(), tracingMarkerKey_.c_str(), pid);
    missLog = missLog + result.get();
    memset_s(result.get(), MAX_LEN, 0, MAX_LEN);
    return missLog;
}

void FfrtConverter::DeleteRedundance(const std::string& mark,
                                     std::string& log,
                                     bool switchInFakeLog,
                                     bool switchOutFakeLog,
                                     const int pid,
                                     const std::string& label,
                                     long long gid,
                                     const int tid,
                                     const std::string& threadName,
                                     const int prio)
{
    static const std::regex CoPattern = std::regex(R"( F\|(\d+)\|Co\|(\d+))");
    static const std::regex HCoPattern = std::regex(R"( F\|(\d+)\|H:Co\s(\d+))");
    if (std::regex_search(mark, CoPattern) || std::regex_search(mark, HCoPattern)) {
        log.clear();
        if (switchInFakeLog) {
            switchInFakeLog = false;
            return;
        } else {
            switchOutFakeLog = true;
            return;
        }
    }
    if (switchInFakeLog && (mark.find(tracingMarkerKey_ + "B") != std::string::npos)) {
        log.clear();
        return;
    }
    if (switchOutFakeLog && (mark.find(tracingMarkerKey_ + "E") != std::string::npos)) {
        log.clear();
        return;
    }
    static const std::regex EndPattern = std::regex(R"( F\|(\d+)\|[BF]\|(\d+))");
    static const std::regex HEndPattern = std::regex(R"( F\|(\d+)\|H:[BF]\s(\d+))");
    if (std::regex_search(mark, EndPattern) || std::regex_search(mark, HEndPattern)) {
        log = MakeEndFakeLog(mark, pid, label, gid, tid, threadName, prio);
        gid = WAKE_EVENT_DEFAULT_VALUE;
        switchOutFakeLog = false;
        return;
    }
    auto fakeLog = ConvertWorkerLogToTask(mark, pid, label, gid, tid);
    log = fakeLog;
    return;
}
void FfrtConverter::ConvertFfrtThreadToFfrtTaskByLine(
    int pid,
    int tid,
    int& prio,
    std::vector<std::string>& results,
    ffrtContent& content,
    std::unordered_map<int, std::unordered_map<int, std::string>>& taskLabels)
{
    auto& threadName = content.name;
    auto switchInFakeLog = false;
    auto switchOutFakeLog = false;
    auto gid = WAKE_EVENT_DEFAULT_VALUE;
    for (auto& line : content.line) {
        auto mark = results[line];
        UpdatePrio(prio, mark, tid);
        if (mark.find("FFRT::[") != std::string::npos) {
            std::string missLog;
            auto label = GetLabel(mark);
            if (label.find("executor_task") != std::string::npos || label.find("ex_task") != std::string::npos) {
                continue;
            }
            if (gid != WAKE_EVENT_DEFAULT_VALUE) {
                missLog = MakeEndFakeLog(mark, pid, taskLabels[pid][gid], gid, tid, threadName, prio);
                missLog = getNewMissLog(missLog, mark, pid, tid, threadName);
            }
            auto beginPos = mark.rfind("|");
            if (beginPos != std::string::npos && IsDigit(mark.substr(beginPos + 1))) {
                gid = stoll(mark.substr(beginPos + 1));
            } else {
                continue;
            }
            if (taskLabels[pid].find(gid) == taskLabels[pid].end()) {
                taskLabels[pid][gid] = label;
            }
            results[line] = MakeBeginFakeLog(mark, pid, taskLabels[pid][gid], gid, tid, threadName, prio);
            if (!missLog.empty()) {
                results[line] = missLog + results[line];
            }
            switchInFakeLog = true;
            continue;
        }
        if (gid != WAKE_EVENT_DEFAULT_VALUE) {
            DeleteRedundance(mark, results[line], switchInFakeLog, switchOutFakeLog, pid, taskLabels[pid][gid], gid,
                             tid, threadName, prio);
        }
    }
}
void FfrtConverter::ConvertFfrtThreadToFfrtTask(vector<std::string>& results, FfrtConverter::TypeFfrtPid& ffrtPidsMap)
{
    int prio;
    std::unordered_map<int, std::unordered_map<int, std::string>> taskLabels;
    for (auto& [pid, tids] : ffrtPidsMap) {
        taskLabels[pid] = {};
        for (auto& [tid, info] : ffrtPidsMap[pid]) {
            ConvertFfrtThreadToFfrtTaskByLine(pid, tid, prio, results, info, taskLabels);
        }
    }
    return;
}
} // namespace TraceStreamer
} // namespace SysTuning
