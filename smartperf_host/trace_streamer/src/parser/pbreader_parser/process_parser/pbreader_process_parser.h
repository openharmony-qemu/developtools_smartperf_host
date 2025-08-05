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
#ifndef HTRACE_PROCESS_PARSER_H
#define HTRACE_PROCESS_PARSER_H
#include <cstdint>
#include <map>
#include <string>
#include "common_types.h"
#include "event_parser_base.h"
#include "htrace_plugin_time_parser.h"
#include "trace_streamer_filters.h"

namespace SysTuning {
namespace TraceStreamer {
class PbreaderProcessParser : public EventParserBase, public HtracePluginTimeParser {
public:
    PbreaderProcessParser(TraceDataCache *dataCache, const TraceStreamerFilters *ctx);
    ~PbreaderProcessParser();
    void Parse(ProtoReader::BytesView tracePacket, uint64_t ts);
    void Finish();
    struct DiskioInfo {
        DiskioInfo(uint64_t rchar,
                   uint64_t wchar,
                   uint64_t syscr,
                   uint64_t syscw,
                   uint64_t rbytes,
                   uint64_t wbytes,
                   uint64_t cancelled_wbytes)
            : rchar(rchar),
              wchar(wchar),
              syscr(syscr),
              syscw(syscw),
              rbytes(rbytes),
              wbytes(wbytes),
              cancelled_wbytes(cancelled_wbytes)
        {
        }
        uint64_t rchar;
        uint64_t wchar;
        uint64_t syscr;
        uint64_t syscw;
        uint64_t rbytes;
        uint64_t wbytes;
        uint64_t cancelled_wbytes;
    };
    struct PssInfo {
        explicit PssInfo(int32_t pssInfo) : pssInfo(pssInfo) {}
        int32_t pssInfo;
    };
    struct CpuInfo {
        CpuInfo(double cpuUsage, int32_t threadSum, uint64_t cpuTimeMs)
            : cpuUsage(cpuUsage), threadSum(threadSum), cpuTimeMs(cpuTimeMs)
        {
        }
        double cpuUsage;
        int32_t threadSum;
        uint64_t cpuTimeMs;
    };
    struct ProcessInfo {
        ProcessInfo(int32_t pid, const std::string &name, int32_t ppid, int32_t uid)
            : pid(pid), name(name), ppid(ppid), uid(uid)
        {
        }
        int32_t pid;
        std::string name;
        int32_t ppid;
        int32_t uid;
    };
    struct TsLiveProcessData {
        void SetLiveProcess(uint64_t ts,
                            std::unique_ptr<ProcessInfo> liveProcessInfo,
                            std::unique_ptr<CpuInfo> cpuUsageData,
                            std::unique_ptr<PssInfo> pssInfo,
                            std::unique_ptr<DiskioInfo> diskio)
        {
            ts_ = ts;
            processInfo_ = std::move(liveProcessInfo);
            cpuUsageData_ = std::move(cpuUsageData);
            pssInfo_ = std::move(pssInfo);
            diskio_ = std::move(diskio);
        }
        uint64_t ts_;
        std::unique_ptr<ProcessInfo> processInfo_;
        std::unique_ptr<CpuInfo> cpuUsageData_;
        std::unique_ptr<PssInfo> pssInfo_;
        std::unique_ptr<DiskioInfo> diskio_;
    };
    std::vector<std::unique_ptr<TsLiveProcessData>> liveProcessData_;
};
} // namespace TraceStreamer
} // namespace SysTuning

#endif // HTRACE_PROCESS_PARSER_H
