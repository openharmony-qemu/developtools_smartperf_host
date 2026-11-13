/*
 * Copyright (c) Huawei Technologies Co., Ltd. 2026. All rights reserved.
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

#ifndef PBREADER_NETWORK_PROFILER_PARSER_H
#define PBREADER_NETWORK_PROFILER_PARSER_H

#include <cstdint>
#include <string>
#include "common_types.h"
#include "event_parser_base.h"
#include "htrace_plugin_time_parser.h"
#include "proto_reader_help.h"
#include "tlv_parser.h"
#include "trace_streamer_filters.h"

namespace SysTuning {
namespace TraceStreamer {

struct UrlParts {
    std::string protocol;
    std::string domain;
    std::string requestUri;
};

class PbreaderNetworkProfilerParser : public EventParserBase, public HtracePluginTimeParser {
public:
    PbreaderNetworkProfilerParser(TraceDataCache *dataCache, const TraceStreamerFilters *ctx);
    ~PbreaderNetworkProfilerParser();
    void Parse(ProtoReader::BytesView tracePacket, uint64_t ts);
    void Finish();
    void SetNetworkProfilerSrcClockid(PbreaderDataSegment &dataSeg);
    UrlParts ParseUrl(const std::string &requestUrl);
    uint8_t CalculateCacheHit(const TlvResult &result);

private:
    void StoreTimeInformation(const TlvResult &result, uint32_t pid, uint32_t tid);
    void StoreInformation(const TlvResult &result, const UrlParts &urlParts);

private:
    TlvParser tlvParser_;
    ClockId networkProfilerClockid_ = TS_CLOCK_UNKNOW;
};

} // namespace TraceStreamer
} // namespace SysTuning

#endif // PBREADER_NETWORK_PROFILER_PARSER_H