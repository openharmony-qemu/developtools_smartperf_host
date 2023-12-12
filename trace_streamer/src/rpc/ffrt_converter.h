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
#ifndef FFRT_CONVERTER_H
#define FFRT_CONVERTER_H
#include <iostream>
#include <string>
#include <vector>
#include <unordered_map>
#include <regex>
#include <fstream>
#include <vector>
#include <variant>
#include <cstdio>
#include <cstring>
#include <memory>
namespace SysTuning {
namespace TraceStreamer {
using namespace std;
#define WAKE_EVENT_DEFAULT_VALUE -1
#define MAX_LEN 256
struct ffrtContent {
    std::string name;
    std::vector<int> line;
};
struct WakeEvent {
    std::string state = "none";
    int prevWakLine = WAKE_EVENT_DEFAULT_VALUE;
    std::string prevWakeLog;
};
class FfrtConverter {
public:
    FfrtConverter() = default;
    ~FfrtConverter() = default;
    bool RecoverTraceAndGenerateNewFile(const std::string& ffrtFileName, std::ofstream& outFile);

private:
    using TypeFfrtPid = std::unordered_map<int, std::unordered_map<int, ffrtContent>>;
    int ExtractProcessId(const std::string& log);
    std::string ExtractTimeStr(const std::string& log);
    std::string ExtractCpuId(const std::string& log);
    TypeFfrtPid ClassifyLogsForFfrtWorker(vector<std::string>& results);
    void FindFfrtProcessAndClassifyLogs(std::string& log,
                                        size_t line,
                                        std::unordered_map<int, std::vector<int>>& traceMap,
                                        TypeFfrtPid& ffrtPidsMap);
    void ClassifySchedSwitchLogs(std::string& log,
                                 size_t line,
                                 std::unordered_map<int, std::vector<int>>& traceMap,
                                 FfrtConverter::TypeFfrtPid& ffrtPidsMap);
    int FindTid(string& log);
    void ConvertFfrtThreadToFfrtTask(vector<std::string>& results, TypeFfrtPid& ffrtPidsMap);
    std::string MakeBeginFakeLog(const std::string& mark,
                                 const int pid,
                                 const std::string& label,
                                 const int gid,
                                 const int tid,
                                 const std::string& tname,
                                 const int prio);
    std::string MakeEndFakeLog(const std::string& mark,
                               const int pid,
                               const std::string& label,
                               const int gid,
                               const int tid,
                               const std::string& tname,
                               const int prio);
    std::string ReplaceSchedSwitchLog(std::string& fakeLog,
                                      const std::string& mark,
                                      const int pid,
                                      const std::string& label,
                                      const int gid,
                                      const int tid);
    std::string ReplaceSchedWakeLog(std::string& fakeLog, const std::string& label, const int pid, const int gid);
    std::string ReplaceSchedBlockLog(std::string& fakeLog, const int pid, const int gid);
    std::string ReplaceTracingMarkLog(std::string& fakeLog, const std::string& label, const int pid, const int gid);
    std::string ConvertWorkerLogToTask(const std::string& mark,
                                       const int pid,
                                       const std::string& label,
                                       const int gid,
                                       const int tid);
    void SupplementFfrtBlockAndWakeInfo(vector<std::string>& results);
    bool IsDigit(const std::string& str);

private:
    const std::regex indexPattern_ = std::regex("\\(.+\\)\\s+\\[\\d");
};
} // namespace TraceStreamer
} // namespace SysTuning
#endif // FFRT_CONVERTER_H
