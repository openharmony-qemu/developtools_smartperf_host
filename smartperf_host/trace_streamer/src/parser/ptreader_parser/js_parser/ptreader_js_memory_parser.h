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
#ifndef PTREADER_JS_MEMORY_PARSER_H
#define PTREADER_JS_MEMORY_PARSER_H

#include <memory>
#include <string>
#include "common_types.h"
#include "event_parser_base.h"
#include "js_heap_snapshot_filter.h"
#include "trace_data_cache.h"

namespace SysTuning {
namespace TraceStreamer {
class PtreaderJsMemoryParser : public EventParserBase {
public:
    PtreaderJsMemoryParser(TraceDataCache *dataCache, const TraceStreamerFilters *filters);
    ~PtreaderJsMemoryParser();
    bool ParseHeapFromBuffer(const std::string &jsonStr);

private:
    std::unique_ptr<JsHeapSnapshotFilter> jsHeapSnapshotFilter_;
};
} // namespace TraceStreamer
} // namespace SysTuning

#endif // PTREADER_JS_MEMORY_PARSER_H
