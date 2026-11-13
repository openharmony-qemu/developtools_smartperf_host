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
#ifndef FTRACE_CPU_DETAIL_PARSER_H
#define FTRACE_CPU_DETAIL_PARSER_H
#include <cstdint>
#include <limits>
#include <map>
#include <stdexcept>
#include <string>
#include "event_parser_base.h"
#include "htrace_event_parser.h"
#include "parser_base.h"
#include "proto_reader_help.h"
#include "trace_data_cache.h"
#include "trace_plugin_result.pbreader.h"
#include "trace_streamer_filters.h"

namespace SysTuning {
namespace TraceStreamer {
class HtraceCpuDetailParser {
public:
    HtraceCpuDetailParser(TraceDataCache *dataCache, const TraceStreamerFilters *ctx);
    ~HtraceCpuDetailParser();
    void Parse(PbreaderDataSegment &tracePacket,
               ProtoReader::TracePluginResult_Reader &tracePluginResult,
               bool &haveSplitSeg);
    void FilterAllEventsReader();
    void FilterAllEvents();

public:
    std::unique_ptr<HtraceEventParser> eventParser_;
};
} // namespace TraceStreamer
} // namespace SysTuning

#endif // FTRACE_CPU_DETAIL_PARSER_H
