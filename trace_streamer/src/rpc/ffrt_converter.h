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
#include <cstdio>
#include <cstring>
#include <fstream>
#include <iostream>
#include <memory>
#include <regex>
#include <securec.h>
#include <sstream>
#include <string>
#include <unordered_map>
#include <variant>
#include <vector>
#include "log.h"
#include "ts_common.h"
namespace SysTuning {
namespace TraceStreamer {
using namespace std;
constexpr int32_t WAKE_EVENT_DEFAULT_VALUE = -1;
constexpr int32_t STR_LEGH = 2;
constexpr int32_t STR_LEN = 8;
constexpr int32_t MAX_LEN = 256;
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
    void ConvertFfrtThreadToFfrtTaskByLine(int pid,
                                           int tid,
                                           int& prio,
                                           std::vector<std::string>& results,
                                           ffrtContent& content,
                                           std::unordered_map<int, std::unordered_map<int, std::string>>& taskLabels);
    void ConvertFfrtThreadToFfrtTask(vector<std::string>& results, TypeFfrtPid& ffrtPidsMap);
    std::string MakeBeginFakeLog(const std::string& mark,
                                 const int pid,
                                 const std::string& label,
                                 const long long gid,
                                 const int tid,
                                 const std::string& threadName,
                                 const int prio);
    std::string MakeEndFakeLog(const std::string& mark,
                               const int pid,
                               const std::string& label,
                               const long long gid,
                               const int tid,
                               const std::string& threadName,
                               const int prio);
    std::string ReplaceSchedSwitchLog(std::string& fakeLog,
                                      const std::string& mark,
                                      const int pid,
                                      const std::string& label,
                                      const long long gid,
                                      const int tid);
    std::string ReplaceSchedWakeLog(std::string& fakeLog, const std::string& label, const int pid, const long long gid);
    std::string ReplaceSchedBlockLog(std::string& fakeLog, const int pid, const long long gid);
    std::string ReplaceTracingMarkLog(std::string& fakeLog,
                                      const std::string& label,
                                      const int pid,
                                      const long long gid);
    std::string ConvertWorkerLogToTask(const std::string& mark,
                                       const int pid,
                                       const std::string& label,
                                       const long long gid,
                                       const int tid);
    std::string GetTaskId(int pid, long long gid);
    bool IsDigit(const std::string& str);
    void CheckTraceMarker(vector<std::string>& lines);
    void UpdatePrio(int& prio, const std::string& mark, const int tid);
    std::string GetLabel(const std::string& mark);
    void DeleteRedundance(const std::string& mark,
                          std::string& log,
                          bool switchInFakeLog,
                          bool switchOutFakeLog,
                          const int pid,
                          const std::string& label,
                          long long gid,
                          const int tid,
                          const std::string& threadName,
                          const int prio);
    std::string getNewMissLog(std::string& missLog,
                              const std::string& mark,
                              const int pid,
                              const int tid,
                              std::string threadName);

private:
    const std::regex indexPattern_ = std::regex(R"(\(.+\)\s+\[\d)");
    const std::regex matchPattern_ = std::regex(R"( \(.+\)\s+\[\d)");
    const int scaleFactor_ = 10;
    std::string tracingMarkerKey_ = "tracing_mark_write: ";
};
} // namespace TraceStreamer
} // namespace SysTuning
#endif // FFRT_CONVERTER_H
