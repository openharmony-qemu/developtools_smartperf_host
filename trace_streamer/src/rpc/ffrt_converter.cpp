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
#include "log.h"
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
    SupplementFfrtBlockAndWakeInfo(lines);
    for (auto line : lines) {
        outFile << line << std::endl;
    }
    return true;
}
void FfrtConverter::CheckTraceMarker(vector<std::string>& lines)
{
    for (auto line : lines) {
        if (line.find(" tracing_mark_write: ") != std::string::npos) {
            TRACING_MARKER_KEY = "tracing_mark_write: ";
            break;
        }
        if (line.find(" print: ") != std::string::npos) {
            TRACING_MARKER_KEY = "print: ";
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
        return match.str().substr(1, match.str().size() - 2);
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
    auto timestamp = ExtractTimeStr(mark);
    auto cpuId = ExtractCpuId(mark);
    std::unique_ptr<char[]> result(new char[MAX_LEN]);
    sprintf(result.get(),
            "\n  %s-%d    (%7d) [%s] ....   %s: sched_switch: prev_comm=%s prev_pid=%d prev_prio=%d prev_state=S ==> "
            "next_comm=%s next_pid=%d0%lld next_prio=%d\n",
            threadName.c_str(), tid, pid, cpuId.c_str(), timestamp.c_str(), threadName.c_str(), tid, prio,
            label.c_str(), pid, gid, prio);
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
    auto timestamp = ExtractTimeStr(mark);
    auto cpuId = ExtractCpuId(mark);
    std::unique_ptr<char[]> result(new char[MAX_LEN]);
    sprintf(
        result.get(),
        "  %s-%d0%lld    (%7d) [%s] ....   %s: sched_switch: prev_comm=%s prev_pid=%d0%lld prev_prio=%d prev_state=S "
        "==> next_comm=%s next_pid=%d next_prio=%d\n",
        label.c_str(), pid, gid, pid, cpuId.c_str(), timestamp.c_str(), label.c_str(), pid, gid, prio,
        threadName.c_str(), tid, prio);
    std::string fakeLog = result.get();
    memset(result.get(), 0, MAX_LEN);
    if (mark.find("|B|") != std::string::npos || mark.find("|H:B ") != std::string::npos) {
        sprintf(result.get(), "  %s-%d0%lld    (%7d) [%s] ....   %s: %sE|%d\n", label.c_str(), pid, gid, pid,
                cpuId.c_str(), timestamp.c_str(), TRACING_MARKER_KEY.c_str(), pid);
        fakeLog = result.get() + fakeLog;
    }
    return fakeLog;
}

std::string FfrtConverter::ReplaceSchedSwitchLog(std::string& fakeLog,
                                                 const std::string& mark,
                                                 const int pid,
                                                 const std::string& label,
                                                 const long long gid,
                                                 const int tid)
{
    std::unique_ptr<char[]> result(new char[MAX_LEN]);
    std::smatch match;
    if (mark.find("prev_pid=" + std::to_string(tid)) != std::string::npos) {
        if (regex_search(fakeLog, match, indexPattern_)) {
            auto beginPos = fakeLog.find(match.str());
            sprintf(result.get(), "  %s-%d0%lld ", label.c_str(), pid, gid);
            fakeLog = result.get() + fakeLog.substr(beginPos);
            size_t pcommPos = fakeLog.find("prev_comm=");
            size_t pPidPos = fakeLog.find("prev_pid=");
            memset(result.get(), 0, MAX_LEN);
            sprintf(result.get(), "prev_comm=%s ", label.c_str());
            fakeLog = fakeLog.substr(0, pcommPos) + result.get() + fakeLog.substr(pPidPos);
            memset(result.get(), 0, MAX_LEN);
            pPidPos = fakeLog.find("prev_pid=");
            size_t pPrioPos = fakeLog.find("prev_prio=");
            sprintf(result.get(), "prev_pid=%d0%lld ", pid, gid);
            fakeLog = fakeLog.substr(0, pPidPos) + result.get() + fakeLog.substr(pPrioPos);
            memset(result.get(), 0, MAX_LEN);
        }
    } else if (mark.find("next_pid=" + std::to_string(tid)) != std::string::npos) {
        sprintf(result.get(), "next_comm=%s ", label.c_str());
        size_t nCommPos = fakeLog.find("next_comm=");
        size_t nPidPos = fakeLog.find("next_pid=");
        fakeLog = fakeLog.substr(0, nCommPos) + result.get() + fakeLog.substr(nPidPos);
        memset(result.get(), 0, MAX_LEN);
        sprintf(result.get(), "next_pid=%d0%lld ", pid, gid);
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
    std::unique_ptr<char[]> result(new char[MAX_LEN]);
    sprintf(result.get(), "comm=%s ", label.c_str());
    size_t commPos = fakeLog.find("comm=");
    size_t pidPos = fakeLog.find("pid=");
    fakeLog = fakeLog.substr(0, commPos) + result.get() + fakeLog.substr(pidPos);
    memset(result.get(), 0, MAX_LEN);
    sprintf(result.get(), "pid=%d0%lld ", pid, gid);
    pidPos = fakeLog.find("pid=");
    size_t prioPos = fakeLog.find("prio=");
    fakeLog = fakeLog.substr(0, pidPos) + result.get() + fakeLog.substr(prioPos);
    return fakeLog;
}

std::string FfrtConverter::ReplaceSchedBlockLog(std::string& fakeLog, const int pid, const long long gid)
{
    std::unique_ptr<char[]> result(new char[MAX_LEN]);
    sprintf(result.get(), "pid=%d0%lld ", pid, gid);
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
    std::unique_ptr<char[]> result(new char[MAX_LEN]);
    std::smatch match;
    if (regex_search(fakeLog, match, indexPattern_)) {
        auto beginPos = fakeLog.find(match.str());
        sprintf(result.get(), "  %s-%d0%lld ", label.c_str(), pid, gid);
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
        for (auto& pair : tids) {
            auto tid = pair.first;
            ffrtPidMap[pid][tid].line = traceMap[tid];
        }
    }
    return ffrtPidMap;
}
void FfrtConverter::ConvertFfrtThreadToFfrtTask(vector<std::string>& results, FfrtConverter::TypeFfrtPid& ffrtPidsMap)
{
    int prio;
    std::unordered_map<int, std::unordered_map<int, std::string>> taskLabels;
    for (auto& [pid, tids] : ffrtPidsMap) {
        taskLabels[pid] = {};
        for (auto& [tid, info] : ffrtPidsMap[pid]) {
            auto& threadName = info.name;
            auto switchInFakeLog = false;
            auto switchOutFakeLog = false;
            auto ffbkMarkRemove = false;
            auto gid = WAKE_EVENT_DEFAULT_VALUE;
            for (auto& line : info.line) {
                auto mark = results[line];
                if (mark.find("sched_switch:") != std::string::npos) {
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
                if (mark.find("FFRT::[") != std::string::npos) {
                    std::string missLog;
                    auto beginPos = mark.rfind("[");
                    auto endPos = mark.rfind("]");
                    auto label = mark.substr(beginPos + 1, endPos - beginPos - 1);
                    if (gid != WAKE_EVENT_DEFAULT_VALUE) {
                        missLog = MakeEndFakeLog(mark, pid, taskLabels[pid][gid], gid, tid, threadName, prio);
                        auto timestamp = ExtractTimeStr(mark);
                        auto cpuId = ExtractCpuId(mark);
                        std::unique_ptr<char[]> result(new char[MAX_LEN]);
                        sprintf(result.get(), "  %s-%d    (%7d) [%s] ....   %s: %sE|%d\n", threadName.c_str(), tid, pid,
                                cpuId.c_str(), timestamp.c_str(), TRACING_MARKER_KEY.c_str(), pid);
                        missLog = missLog + result.get();
                        memset(result.get(), 0, MAX_LEN);
                    }
                    beginPos = mark.rfind("|");
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
                    static const std::regex CoPattern = std::regex(R"( F\|(\d+)\|Co\|(\d+))");
                    static const std::regex HCoPattern = std::regex(R"( F\|(\d+)\|H:Co\s(\d+))");
                    if (std::regex_search(mark, CoPattern) || std::regex_search(mark, HCoPattern)) {
                        results[line].clear();
                        if (switchInFakeLog) {
                            switchInFakeLog = false;
                            continue;
                        } else {
                            switchOutFakeLog = true;
                            continue;
                        }
                    }
                    if (switchInFakeLog && (mark.find(TRACING_MARKER_KEY + "B") != std::string::npos)) {
                        results[line].clear();
                        continue;
                    }
                    if (switchOutFakeLog && (mark.find(TRACING_MARKER_KEY + "E") != std::string::npos)) {
                        results[line].clear();
                        continue;
                    }
                    static const std::regex EndPattern = std::regex(R"( F\|(\d+)\|[BF]\|(\d+))");
                    static const std::regex HEndPattern = std::regex(R"( F\|(\d+)\|H:[BF]\s(\d+))");
                    if (std::regex_search(mark, EndPattern) || std::regex_search(mark, HEndPattern)) {
                        results[line] = MakeEndFakeLog(mark, pid, taskLabels[pid][gid], gid, tid, threadName, prio);
                        gid = WAKE_EVENT_DEFAULT_VALUE;
                        switchOutFakeLog = false;
                        continue;
                    }
                    auto fakeLog = ConvertWorkerLogToTask(mark, pid, taskLabels[pid][gid], gid, tid);
                    if (fakeLog.find("FFBK[") != std::string::npos) {
                        if (fakeLog.find("[dep]") != std::string::npos) {
                            fakeLog = "";
                        } else if (fakeLog.find("[chd]") != std::string::npos) {
                            auto beginPos = fakeLog.find("[chd]");
                            fakeLog = fakeLog.replace(beginPos, 5, "[wait_child]");
                        } else if (fakeLog.find("[dat]") != std::string::npos) {
                            auto beginPos = fakeLog.find("[dat]");
                            fakeLog = fakeLog.replace(beginPos, 5, "[wait_data]");
                        } else if (fakeLog.find("[fd]") != std::string::npos) {
                            auto beginPos = fakeLog.find("[fd]");
                            fakeLog = fakeLog.replace(beginPos, 4, "[wait_fd]");
                        } else if (fakeLog.find("[mtx]") != std::string::npos) {
                            auto beginPos = fakeLog.find("[mtx]");
                            fakeLog = fakeLog.replace(beginPos, 5, "[mutex]");
                        } else if (fakeLog.find("[slp]") != std::string::npos) {
                            auto beginPos = fakeLog.find("[slp]");
                            fakeLog = fakeLog.replace(beginPos, 5, "[sleep]");
                        } else if (fakeLog.find("[yld]") != std::string::npos) {
                            auto beginPos = fakeLog.find("[yld]");
                            fakeLog = fakeLog.replace(beginPos, 5, "[yield]");
                        } else if (fakeLog.find("[cnd]") != std::string::npos) {
                            auto beginPos = fakeLog.find("[cnd]");
                            fakeLog = fakeLog.replace(beginPos, 5, "[cond_wait]");
                        } else if (fakeLog.find("[cnt]") != std::string::npos) {
                            auto beginPos = fakeLog.find("[cnt]");
                            fakeLog = fakeLog.replace(beginPos, 5, "[cond_timedwait]");
                        }
                        ffbkMarkRemove = true;
                    }
                    if (ffbkMarkRemove && mark.find(TRACING_MARKER_KEY + "E") != std::string::npos) {
                        results[line].clear();
                        ffbkMarkRemove = false;
                        continue;
                    }
                    results[line] = fakeLog;
                    continue;
                }
            }
        }
    }
    return;
}
void FfrtConverter::SupplementFfrtBlockAndWakeInfo(vector<std::string>& results)
{
    std::unordered_map<int, std::unordered_map<int, WakeEvent>> taskWak;
    std::string readyEndLog;
    std::unique_ptr<char[]> result(new char[MAX_LEN]);
    for (int line = 0; line < results.size(); line++) {
        auto log = results[line];
        if (log.find("FFBK[") != std::string::npos) {
            auto pid = ExtractProcessId(log);
            auto beginPos = log.rfind("|");
            auto gid = stoll(log.substr(beginPos + 1));
            if (taskWak.find(pid) == taskWak.end()) {
                taskWak[pid] = {};
            }
            if (taskWak[pid].find(gid) == taskWak[pid].end()) {
                taskWak[pid][gid] = {};
            }
            readyEndLog = "";
            if (taskWak[pid][gid].state == "ready") {
                auto timestamp = ExtractTimeStr(log);
                auto cpuId = ExtractCpuId(log);
                sprintf(result.get(), "  <...>-%d0%lld    (%7d) [%s] ....   %s: %sE|%d\n", pid, gid, pid, cpuId.c_str(),
                        timestamp.c_str(), TRACING_MARKER_KEY.c_str(), pid);
                readyEndLog = result.get();
                memset(result.get(), 0, MAX_LEN);
            }
            taskWak[pid][gid].state = "block";
            auto endPos = results[line].rfind('|');
            results[line] = results[line].substr(0, endPos);
            if (!readyEndLog.empty()) {
                results[line] = readyEndLog + results[line];
            }
        } else if (log.find("FFWK|") != std::string::npos) {
            auto pid = ExtractProcessId(log);
            auto beginPos = log.rfind('|');
            auto gid = stoll(log.substr(beginPos + 1));
            if (taskWak.find(pid) != taskWak.end() && taskWak[pid].find(gid) != taskWak[pid].end()) {
                auto timestamp = ExtractTimeStr(log);
                auto cpuId = ExtractCpuId(log);
                std::string readyBeginLog;
                if (log.find("H:FFWK") != std::string::npos) {
                    sprintf(result.get(), "  <...>-%d0%lld    (%7d) [%s] ....   %s: %sB|%d|H:FFREADY\n", pid, gid, pid,
                            cpuId.c_str(), timestamp.c_str(), TRACING_MARKER_KEY.c_str(), pid);
                    readyBeginLog = result.get();
                    memset(result.get(), 0, MAX_LEN);
                } else {
                    sprintf(result.get(), "  <...>-%d0%lld    (%7d) [%s] ....   %s: %sB|%d|FFREADY\n", pid, gid, pid,
                            cpuId.c_str(), timestamp.c_str(), TRACING_MARKER_KEY.c_str(), pid);
                    readyBeginLog = result.get();
                    memset(result.get(), 0, MAX_LEN);
                }
                results[line] = readyBeginLog + results[line];
                if (taskWak[pid][gid].state == "ready") {
                    results[taskWak[pid][gid].prevWakLine] = results[taskWak[pid][gid].prevWakLine].substr(
                        results[taskWak[pid][gid].prevWakLine].find("FFREADY") + 8);
                }
                taskWak[pid][gid].state = "ready";
                taskWak[pid][gid].prevWakLine = line;
                taskWak[pid][gid].prevWakeLog = log;
            }
        } else if (log.find("FFRT::[") != std::string::npos) {
            auto pid = ExtractProcessId(log);
            long long gid;
            auto beginPos = log.rfind('|');
            auto endPos = log.find_first_of('\n', beginPos + 1);
            if (beginPos != std::string::npos && endPos != std::string::npos &&
                IsDigit(log.substr(beginPos + 1, endPos - beginPos - 1))) {
                gid = stoll(log.substr(beginPos + 1, endPos - beginPos - 1));
            } else {
                continue;
            }
            if (taskWak.find(pid) != taskWak.end() && taskWak[pid].find(gid) != taskWak[pid].end()) {
                if (taskWak[pid][gid].state == "ready") {
                    auto timestamp = ExtractTimeStr(log);
                    auto cpuId = ExtractCpuId(log);
                    auto endPos = log.rfind('\n');
                    auto beginPos = log.find_last_of('\n', endPos - 1);
                    auto switchLog = log.substr(beginPos + 1, endPos);
                    beginPos = switchLog.find("next_comm=");
                    endPos = switchLog.find("next_pid");
                    auto taskComm = switchLog.substr(beginPos + 10, endPos - beginPos - 11);
                    beginPos = switchLog.find("next_pid=");
                    endPos = switchLog.find(" next_prio=");
                    auto taskPid = stoll(switchLog.substr(beginPos + 9, endPos - beginPos - 9));
                    auto taskPrio = stoi(switchLog.substr(endPos + 11));
                    auto cpuIdWake = ExtractCpuId(switchLog);
                    beginPos = taskWak[pid][gid].prevWakeLog.find(TRACING_MARKER_KEY);
                    sprintf(result.get(), "sched_waking: comm=%s pid=%lld prio=%d target_cpu=%s\n", taskComm.c_str(),
                            taskPid, taskPrio, cpuIdWake.c_str());
                    auto wakingLog = taskWak[pid][gid].prevWakeLog.substr(0, beginPos) + result.get();
                    memset(result.get(), 0, MAX_LEN);
                    sprintf(result.get(), "sched_wakeup: comm=%s pid=%lld prio=%d target_cpu=%s", taskComm.c_str(),
                            taskPid, taskPrio, cpuIdWake.c_str());
                    auto wakeupLog = taskWak[pid][gid].prevWakeLog.substr(0, beginPos) + result.get();
                    memset(result.get(), 0, MAX_LEN);
                    results[taskWak[pid][gid].prevWakLine] =
                        results[taskWak[pid][gid].prevWakLine] + "\n" + wakingLog + wakeupLog;
                    sprintf(result.get(), "  <...>-%d0%lld    (%7d) [%s] ....   %s: %sE|%d\n", pid, gid, pid,
                            cpuId.c_str(), timestamp.c_str(), TRACING_MARKER_KEY.c_str(), pid);
                    readyEndLog = result.get();
                    memset(result.get(), 0, MAX_LEN);
                    results[line] = readyEndLog + results[line];
                    taskWak[pid][gid].state = "none";
                }
            }
        }
    }
    return;
}
} // namespace TraceStreamer
} // namespace SysTuning
