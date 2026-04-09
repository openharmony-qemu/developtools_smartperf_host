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

#ifndef JS_HEAP_SNAPSHOT_FILTER_H
#define JS_HEAP_SNAPSHOT_FILTER_H

#include <cstdint>
#include <string>
#include <vector>
#include "filter_base.h"
#include "json.hpp"
#include "trace_streamer_config.h"

namespace SysTuning {
namespace TraceStreamer {

// Parses JS heap snapshot/timeline JSON into trace data cache tables.
class JsHeapSnapshotFilter : private FilterBase {
public:
    JsHeapSnapshotFilter(TraceDataCache *dataCache, const TraceStreamerFilters *filter);
    JsHeapSnapshotFilter(const JsHeapSnapshotFilter &) = delete;
    JsHeapSnapshotFilter &operator=(const JsHeapSnapshotFilter &) = delete;
    ~JsHeapSnapshotFilter() override;

    uint64_t ParseSnapshot(int32_t fileId, const nlohmann::json &jMessage);
    uint64_t ParseTimeline(int32_t fileId, const nlohmann::json &jMessage);

private:
    uint64_t ParseAllSections(int32_t fileId, const nlohmann::json &jMessage);
    void ParserSnapInfo(int32_t fileId, const std::string &key, const std::vector<std::vector<std::string>> &types);
    void ParserJSSnapInfo(int32_t fileId, const nlohmann::json &jMessage);
    uint64_t ParseNodes(int32_t fileId, const nlohmann::json &jMessage);
    void ParseEdges(int32_t fileId, const nlohmann::json &jMessage);
    void ParseLocation(int32_t fileId, const nlohmann::json &jMessage);
    void ParseSample(int32_t fileId, const nlohmann::json &jMessage);
    void ParseString(int32_t fileId, const nlohmann::json &jMessage);
    void ParseTraceFuncInfo(int32_t fileId, const nlohmann::json &jMessage);
    void ParseTraceNode(int32_t fileId, const nlohmann::json &jMessage);
};

} // namespace TraceStreamer
} // namespace SysTuning

#endif // JS_HEAP_SNAPSHOT_FILTER_H
