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
#include <vector>
#include "ts_common.h"
namespace SysTuning {
namespace TraceStreamer {
using namespace std;
constexpr int32_t WAKE_EVENT_DEFAULT_VALUE = -1;
constexpr int32_t STR_LEGH = 2;
constexpr int32_t STR_LEN = 8;
constexpr int32_t MAX_LEN = 256;
struct FfrtContent {
    std::string name;
    std::vector<int> indices;
};
struct WakeEvent {
    std::string state = "none";
    int prevWakLine = WAKE_EVENT_DEFAULT_VALUE;
    std::string prevWakeLog;
};
struct ThreadInfo {
    int pid;
    int tid;
    std::string name;
};
class FfrtConverter {
public:
    FfrtConverter() = default;
    ~FfrtConverter() = default;
    bool RecoverTraceAndGenerateNewFile(const std::string &ffrtFileName, std::ofstream &outFile);

private:
    void Clear();
    using TypeFfrtPid = std::unordered_map<int, std::unordered_map<int, FfrtContent>>;
    int ExtractProcessId(const size_t index);
    std::string ExtractTimeStr(const std::string &log);
    std::string ExtractCpuId(const std::string &log);
    void ClassifyContextForFfrtWorker();
    void FindFfrtProcessAndClassify(const size_t index, std::unordered_map<int, std::vector<int>> &traceMap);
    void ClassifySchedSwitchData(const size_t index, std::unordered_map<int, std::vector<int>> &traceMap);
    int FindIntNumberAfterStr(const size_t index, const string &str);
    std::string FindSubStrAfterStr(const size_t index, const string &str);
    std::string GetLabel(const std::string &line);
    void ConvertFfrtThreadToFfrtTask();
    void ProcessMarkWithSchedSwitch(const int tid, int &prio, const size_t index);
    bool ProcessMarkWithFFRT(const int index, int &prio, int32_t &gid, const ThreadInfo &threadInfo);
    bool DeleteRedundance(bool &switchInFakeLog, bool &switchOutFakeLog, const int index);
    std::string MakeBeginFakeLog(const std::string &mark,
                                 const long long gid,
                                 const int prio,
                                 const ThreadInfo &threadInfo);
    std::string MakeEndFakeLog(const std::string &mark,
                               const long long gid,
                               const int prio,
                               const ThreadInfo &threadInfo);
    std::string ReplaceSchedSwitchLog(std::string &fakeLog,
                                      const std::string &mark,
                                      const int pid,
                                      const long long gid,
                                      const int tid);
    std::string ReplaceSchedWakeLog(std::string &fakeLog, const std::string &label, const int pid, const long long gid);
    std::string ReplaceSchedBlockLog(std::string &fakeLog, const int pid, const long long gid);
    std::string ReplaceTracingMarkLog(std::string &fakeLog,
                                      const std::string &label,
                                      const int pid,
                                      const long long gid);
    std::string ConvertWorkerLogToTask(const std::string &mark, const int pid, const long long gid, const int tid);
    std::string GetTaskId(int pid, long long gid);
    bool IsDigit(const std::string &str);
    void InitTracingMarkerKey();

private:
    const std::regex indexPattern_ = std::regex(R"(\(.+\)\s+\[\d)");
    const std::regex matchPattern_ = std::regex(R"( \(.+\)\s+\[\d)");
    const int uint32MaxLength_ = 10;
    std::string tracingMarkerKey_ = "tracing_mark_write: ";
    std::vector<std::string> context_ = {};
    TypeFfrtPid ffrtPidMap_ = {};
    std::unordered_map<int, std::unordered_map<int, std::string>> taskLabels_ = {};
};
} // namespace TraceStreamer
} // namespace SysTuning
#endif // FFRT_CONVERTER_H
