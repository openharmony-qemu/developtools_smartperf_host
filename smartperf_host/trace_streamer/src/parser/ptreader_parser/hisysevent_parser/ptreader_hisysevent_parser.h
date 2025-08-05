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
#ifndef PTREADER_HI_SYS_EVENT_PARSER_H
#define PTREADER_HI_SYS_EVENT_PARSER_H

#include "common_types.h"
#include "string_help.h"
#include "string_to_numerical.h"
#include "parser_base.h"
#include "event_parser_base.h"
#include "trace_data_cache.h"
#include "hi_sysevent_filter/hi_sysevent_measure_filter.h"

namespace SysTuning {
namespace TraceStreamer {
class PtreaderHiSysEventParser : public EventParserBase {
public:
    PtreaderHiSysEventParser(TraceDataCache *dataCache, const TraceStreamerFilters *filters);
    ~PtreaderHiSysEventParser();
    void ParseHiSysEventDataItem(const std::string &buffer, const uint64_t lineSeq, bool &haveSplitSeg);
    void Finish();
};
} // namespace TraceStreamer
} // namespace SysTuning

#endif // PTREADER_HI_SYS_EVENT_PARSER_H
