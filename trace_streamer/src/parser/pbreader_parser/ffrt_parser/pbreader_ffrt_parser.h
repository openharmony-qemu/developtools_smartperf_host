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

#ifndef PBREADER_FFRT_PARSER_H
#define PBREADER_FFRT_PARSER_H

#include "common_types.h"
#include "double_map.h"
#include "ffrt_profiler_result.pbreader.h"
#include "event_parser_base.h"
#include "htrace_event_parser.h"

namespace SysTuning {
namespace TraceStreamer {
class PbreaderFfrtDetailParser : public EventParserBase {
public:
    PbreaderFfrtDetailParser(TraceDataCache *dataCache,
                             const TraceStreamerFilters *ctx,
                             HtraceEventParser *eventParser);
    ~PbreaderFfrtDetailParser();
    void Parser(const PbreaderDataSegment &dataSeg, bool &haveSplitSeg);
    void SetFfrtSrcClockid(PbreaderDataSegment &dataSeg);
    void FilterAllEventsReader();

private:
    void PaserCommData(bool &haveSplitSeg, std::unique_ptr<ProtoReader::FfrtProfilerEvent_Reader> &ffrtEventPtr);
    void ParserFfrtTrace(const PbreaderDataSegment &dataSeg,
                         bool &haveSplitSeg,
                         std::unique_ptr<ProtoReader::FfrtProfilerEvent_Reader> &ffrtEventPtr);

private:
    HtraceEventParser *eventParser_;
    ClockId ffrtClockid_ = TS_CLOCK_UNKNOW;
    // tid, pid, taskname
    DoubleMap<int32_t, int32_t, DataIndex> taskNameIndexMap_;
};
} // namespace TraceStreamer
} // namespace SysTuning
#endif // PBREADER_FFRT_PARSER_H
