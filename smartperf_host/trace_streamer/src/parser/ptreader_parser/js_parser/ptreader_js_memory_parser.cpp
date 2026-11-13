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

#include "ptreader_js_memory_parser.h"
#include <algorithm>
#include "json.hpp"
#include "arkts_stdtype.h"
#include "common_stdtype.h"
#include "js_heap_snapshot_types.h"
#include "ts_common.h"

namespace {
constexpr uint64_t US_TO_NS = 1000;

// Determine whether the JSON represents a timeline (non-empty "samples" array).
bool IsTimelineJson(const nlohmann::json &jMessage)
{
    return jMessage.contains("samples") && jMessage["samples"].is_array() && !jMessage["samples"].empty();
}

// Default 0-5s for snapshot; use sample timestamps for timeline.
void CalcHeapTimeRange(bool isTimeline, const nlohmann::json &jMessage, uint64_t &startNs, uint64_t &endNs)
{
    startNs = 0;
    endNs = 5 * SysTuning::SEC_TO_NS;
    if (!isTimeline) {
        return;
    }
    SysTuning::TraceStreamer::jsonns::Sample heapSample = jMessage.at("samples");
    if (!heapSample.timestampUs.empty()) {
        startNs = heapSample.timestampUs.front() * US_TO_NS;
        endNs = heapSample.timestampUs.back() * US_TO_NS;
    }
}
}

namespace SysTuning {
namespace TraceStreamer {
PtreaderJsMemoryParser::PtreaderJsMemoryParser(TraceDataCache *dataCache, const TraceStreamerFilters *filters)
    : EventParserBase(dataCache, filters),
      jsHeapSnapshotFilter_(std::make_unique<JsHeapSnapshotFilter>(dataCache, filters))
{
}

PtreaderJsMemoryParser::~PtreaderJsMemoryParser() = default;

// Validate with accept then parse to avoid throwing.
static bool ParseJsonNoThrow(const std::string &jsonStr, nlohmann::json &out)
{
    if (jsonStr.empty()) {
        return false;
    }
    nlohmann::json j;
    if (!j.accept(jsonStr)) {
        return false;
    }
    out = nlohmann::json::parse(jsonStr);
    return true;
}

bool PtreaderJsMemoryParser::ParseHeapFromBuffer(const std::string &jsonStr)
{
    nlohmann::json jMessage;
    if (!ParseJsonNoThrow(jsonStr, jMessage)) {
        return false;
    }

    bool isTimeline = IsTimelineJson(jMessage);
    // 0 : There is only one file, The fileId is a fixed value of 0
    uint64_t selfSizeSum = isTimeline ? jsHeapSnapshotFilter_->ParseTimeline(0, jMessage)
                                      : jsHeapSnapshotFilter_->ParseSnapshot(0, jMessage);

    uint64_t startNs = 0;
    uint64_t endNs = 0;
    CalcHeapTimeRange(isTimeline, jMessage, startNs, endNs);
    traceDataCache_->MixTraceTime(startNs, endNs);
    const char *fileName = isTimeline ? "Timeline" : "Snapshot";
    (void)traceDataCache_->GetJsHeapFilesData()->AppendNewData(0, fileName, startNs, endNs,
                                                               selfSizeSum);
    JsConfigRow row;
    // type 1 = timeline, 0 = snapshot.
    row.type = isTimeline ? 1 : 0;
    (void)traceDataCache_->GetJsConfigData()->AppendNewData(row);
    SysTuning::TraceStdtype::MetaData *meta = traceDataCache_->GetMetaData();
    if (meta != nullptr) {
        meta->SetTraceType(isTimeline ? "heap-timeline" : "heap-snapshot");
    }
    return true;
}
} // namespace TraceStreamer
} // namespace SysTuning
