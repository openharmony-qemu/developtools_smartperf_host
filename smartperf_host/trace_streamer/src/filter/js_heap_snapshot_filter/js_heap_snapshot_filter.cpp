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

#include "js_heap_snapshot_filter.h"
#include <limits>
#include "js_heap_snapshot_types.h"
#include "stat_filter.h"
#include "trace_data_cache.h"
#include "trace_stdtype/htrace/arkts_stdtype.h"

namespace SysTuning {
namespace TraceStreamer {
using namespace SysTuning::TraceCfg;
using namespace SysTuning::TraceStdtype;
using json = nlohmann::json;

namespace {
const std::string NODE_TYPES = "node_types";
const std::string EDGE_TYPES = "edge_types";
} // namespace

JsHeapSnapshotFilter::JsHeapSnapshotFilter(TraceDataCache *dataCache, const TraceStreamerFilters *filter)
    : FilterBase(dataCache, filter)
{
}

JsHeapSnapshotFilter::~JsHeapSnapshotFilter() = default;

void JsHeapSnapshotFilter::ParserSnapInfo(int32_t fileId,
                                          const std::string &key,
                                          const std::vector<std::vector<std::string>> &types)
{
    // First dimension: kind 0 entries (e.g. node type names).
    for (size_t m = 0; m < types[0].size(); ++m) {
        (void)traceDataCache_->GetJsHeapInfoData()->AppendNewData(fileId, key, 0, std::numeric_limits<uint32_t>::max(),
                                                                  types[0][m]);
    }
    // Remaining dimensions: kind 1 entries (e.g. edge type names).
    for (size_t i = 1; i < types.size(); ++i) {
        (void)traceDataCache_->GetJsHeapInfoData()->AppendNewData(fileId, key, 1, std::numeric_limits<uint32_t>::max(),
                                                                  types[i][0]);
    }
}

void JsHeapSnapshotFilter::ParserJSSnapInfo(int32_t fileId, const json &jMessage)
{
    jsonns::Snapshot snapshot = jMessage.at("snapshot");
    ParserSnapInfo(fileId, NODE_TYPES, snapshot.meta.nodeTypes);
    ParserSnapInfo(fileId, EDGE_TYPES, snapshot.meta.edgeTypes);
    auto traceFuncCount = snapshot.traceFunctionCount;
    (void)traceDataCache_->GetJsHeapInfoData()->AppendNewData(fileId, "trace_function_count", 0, traceFuncCount, "");
}

uint64_t JsHeapSnapshotFilter::ParseNodes(int32_t fileId, const json &jMessage)
{
    uint64_t selfSizeSum = 0;
    const json &nodesJson = jMessage.at("nodes");
    jsonns::Nodes node = nodesJson;
    // Map deserialized nodes to JsHeapNodesData and sum self size.
    for (size_t i = 0; i < node.names.size(); ++i) {
        JsHeapNodesRow row;
        row.fileId = fileId;
        row.nodeIndex = static_cast<uint32_t>(i);
        row.type = node.types[i];
        row.name = node.names[i];
        row.id = node.ids[i];
        row.selfSize = node.selfSizes[i];
        row.edgeCount = node.edgeCounts[i];
        row.traceNodeId = node.traceNodeIds[i];
        row.detachedNess = node.detachedness[i];
        (void)traceDataCache_->GetJsHeapNodesData()->AppendNewData(row);
        selfSizeSum += node.selfSizes[i];
    }
    (void)traceDataCache_->GetJsHeapInfoData()->AppendNewData(fileId, "node_count", 0,
                                                              static_cast<uint32_t>(node.names.size()), "");
    return selfSizeSum;
}

void JsHeapSnapshotFilter::ParseEdges(int32_t fileId, const json &jMessage)
{
    jsonns::Edges edge = jMessage.at("edges");
    JsHeapEdgesRow row;
    row.fileId = fileId;
    for (size_t i = 0; i < edge.types.size(); ++i) {
        row.edgeIndex = static_cast<uint32_t>(i);
        row.type = edge.types[i];
        row.nameOrIndex = edge.nameOrIndexes[i];
        row.toNode = edge.toNodes[i];
        row.fromNodeId = edge.fromNodeIds[i];
        row.toNodeId = edge.toNodeIds[i];
        (void)traceDataCache_->GetJsHeapEdgesData()->AppendNewData(row);
    }
    (void)traceDataCache_->GetJsHeapInfoData()->AppendNewData(fileId, "edge_count", 0,
                                                              static_cast<uint32_t>(edge.types.size()), "");
}

void JsHeapSnapshotFilter::ParseLocation(int32_t fileId, const json &jMessage)
{
    jsonns::Location location = jMessage.at("locations");
    for (size_t i = 0; i < location.columns.size(); ++i) {
        auto objectIndex = location.objectIndexes[i];
        auto scriptId = location.scriptIds[i];
        auto line = location.lines[i];
        auto column = location.columns[i];
        (void)traceDataCache_->GetJsHeapLocationData()->AppendNewData(fileId, objectIndex, scriptId, line, column);
    }
}

void JsHeapSnapshotFilter::ParseSample(int32_t fileId, const json &jMessage)
{
    jsonns::Sample sample = jMessage.at("samples");
    for (size_t i = 0; i < sample.timestampUs.size(); ++i) {
        (void)traceDataCache_->GetJsHeapSampleData()->AppendNewData(fileId, sample.timestampUs[i],
                                                                    sample.lastAssignedIds[i]);
    }
}

void JsHeapSnapshotFilter::ParseString(int32_t fileId, const json &jMessage)
{
    jsonns::Strings string = jMessage.at("strings");
    for (size_t i = 0; i < string.strings.size(); ++i) {
        (void)traceDataCache_->GetJsHeapStringData()->AppendNewData(fileId, static_cast<uint32_t>(i),
                                                                    string.strings[i]);
    }
}

void JsHeapSnapshotFilter::ParseTraceFuncInfo(int32_t fileId, const json &jMessage)
{
    jsonns::TraceFuncInfo traceFuncInfo = jMessage.at("trace_function_infos");
    JsHeapTraceFuncRow row;
    row.fileId = fileId;
    for (size_t i = 0; i < traceFuncInfo.functionIds.size(); ++i) {
        row.functionIndex = static_cast<uint32_t>(i);
        row.functionId = traceFuncInfo.functionIds[i];
        row.name = traceFuncInfo.names[i];
        row.scriptName = traceFuncInfo.scriptNames[i];
        row.scriptId = traceFuncInfo.scriptIds[i];
        row.line = traceFuncInfo.lines[i];
        row.column = traceFuncInfo.columns[i];
        (void)traceDataCache_->GetJsHeapTraceFuncInfoData()->AppendNewData(row);
    }
}

void JsHeapSnapshotFilter::ParseTraceNode(int32_t fileId, const json &jMessage)
{
    JsHeapTraceNodeRow row;
    row.fileId = fileId;
    jsonns::TraceTree traceTree = jMessage.at("trace_tree");
    for (size_t i = 0; i < traceTree.ids.size(); ++i) {
        row.traceNodeId = traceTree.ids[i];
        row.functionInfoIndex = traceTree.functionInfoIndexes[i];
        row.count = traceTree.counts[i];
        row.size = traceTree.sizes[i];
        row.parentId = static_cast<int32_t>(traceTree.parentIds[i]);
        (void)traceDataCache_->GetJsHeapTraceNodeData()->AppendNewData(row);
    }
}

uint64_t JsHeapSnapshotFilter::ParseSnapshot(int32_t fileId, const nlohmann::json &jMessage)
{
    return ParseAllSections(fileId, jMessage);
}

uint64_t JsHeapSnapshotFilter::ParseTimeline(int32_t fileId, const nlohmann::json &jMessage)
{
    return ParseAllSections(fileId, jMessage);
}

uint64_t JsHeapSnapshotFilter::ParseAllSections(int32_t fileId, const nlohmann::json &jMessage)
{
    ParserJSSnapInfo(fileId, jMessage);
    uint64_t selfSizeSum = ParseNodes(fileId, jMessage);
    ParseEdges(fileId, jMessage);
    ParseLocation(fileId, jMessage);
    ParseSample(fileId, jMessage);
    ParseString(fileId, jMessage);
    ParseTraceFuncInfo(fileId, jMessage);
    ParseTraceNode(fileId, jMessage);
    streamFilters_->statFilter_->IncreaseStat(TRACE_JS_MEMORY, STAT_EVENT_RECEIVED);
    return selfSizeSum;
}
} // namespace TraceStreamer
} // namespace SysTuning
