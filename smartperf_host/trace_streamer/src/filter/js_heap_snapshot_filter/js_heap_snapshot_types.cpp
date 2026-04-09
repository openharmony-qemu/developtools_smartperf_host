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

#include "js_heap_snapshot_types.h"
#include <limits>

namespace SysTuning {
namespace TraceStreamer {
namespace jsonns {

// Shared across Nodes and Edges deserialization; Nodes must be parsed before Edges.
namespace {
// NOTE: These are per-thread to avoid cross-file interference when parsing in parallel.
thread_local int32_t g_nodesSingleLength = 0;
thread_local std::vector<uint32_t> g_fromNodeIds;
thread_local std::vector<uint32_t> g_ids;
} // namespace

ParentFunc::ParentFunc()
{
    id = 0;
    functionInfoIndex = 0;
    count = 0;
    size = 0;
}

void from_json(const json &j, Meta &v)
{
    for (size_t i = 0; i < j["node_fields"].size(); i++) {
        v.nodeFields.emplace_back(j["node_fields"][i]);
    }
    g_nodesSingleLength = static_cast<int32_t>(j["node_fields"].size());
    for (size_t i = 0; i < j["node_types"].size(); i++) {
        std::vector<std::string> nodeTypes;
        if (j["node_types"][i].is_array()) {
            for (size_t m = 0; m < j["node_types"][i].size(); m++) {
                nodeTypes.emplace_back(j["node_types"][i][m]);
            }
            v.nodeTypes.emplace_back(nodeTypes);
        } else {
            nodeTypes.emplace_back(j["node_types"][i]);
            v.nodeTypes.emplace_back(nodeTypes);
        }
    }
    for (size_t i = 0; i < j["edge_fields"].size(); i++) {
        v.edgeFields.emplace_back(j["edge_fields"][i]);
    }
    for (size_t i = 0; i < j["edge_types"].size(); i++) {
        std::vector<std::string> edgeTypes;
        if (j["edge_types"][i].is_array()) {
            for (size_t m = 0; m < j["edge_types"][i].size(); m++) {
                edgeTypes.emplace_back(j["edge_types"][i][m]);
            }
            v.edgeTypes.emplace_back(edgeTypes);
        } else {
            edgeTypes.emplace_back(j["edge_types"][i]);
            v.edgeTypes.emplace_back(edgeTypes);
        }
    }
    for (size_t i = 0; i < j["trace_function_info_fields"].size(); i++) {
        v.traceFunctionInfoFields.emplace_back(j["trace_function_info_fields"][i]);
    }
    for (size_t i = 0; i < j["trace_node_fields"].size(); i++) {
        v.traceNodeFields.emplace_back(j["trace_node_fields"][i]);
    }
    for (size_t i = 0; i < j["sample_fields"].size(); i++) {
        v.sampleFields.emplace_back(j["sample_fields"][i]);
    }
    for (size_t i = 0; i < j["location_fields"].size(); i++) {
        v.locationFields.emplace_back(j["location_fields"][i]);
    }
}

void from_json(const json &j, Snapshot &v)
{
    j.at("meta").get_to(v.meta);
    j.at("node_count").get_to(v.nodeCount);
    j.at("edge_count").get_to(v.edgeCount);
    j.at("trace_function_count").get_to(v.traceFunctionCount);
}

void from_json(const json &j, Nodes &v)
{
    if (!j.is_array()) {
        return;
    }
    // Meta must be parsed first to initialize g_nodesSingleLength.
    if (g_nodesSingleLength <= 0) {
        return;
    }
    const size_t jSize = j.size();
    const size_t nodeCount = jSize / static_cast<size_t>(g_nodesSingleLength);
    v.types.reserve(nodeCount);
    v.names.reserve(nodeCount);
    v.ids.reserve(nodeCount);
    v.selfSizes.reserve(nodeCount);
    v.edgeCounts.reserve(nodeCount);
    v.traceNodeIds.reserve(nodeCount);
    v.detachedness.reserve(nodeCount);

    int32_t edgeIndex = 0;
    // Build from-node id list per node edge count.
    g_fromNodeIds.clear();
    g_fromNodeIds.reserve(jSize);
    g_ids.clear();
    g_ids.reserve(jSize);

    for (size_t i = 0; i < nodeCount; i++) {
        const size_t base = i * static_cast<size_t>(g_nodesSingleLength);
        if (base + OFFSET_SIXTH >= jSize) {
            break;
        }
        v.types.emplace_back(j[base]);
        v.names.emplace_back(j[base + OFFSET_FIRST]);
        v.ids.emplace_back(j[base + OFFSET_SECOND]);
        v.selfSizes.emplace_back(j[base + OFFSET_THIRD]);
        v.edgeCounts.emplace_back(j[base + OFFSET_FOURTH]);
        uint32_t ec = v.edgeCounts[i];
        size_t ecCap = static_cast<size_t>(ec);
        if (ecCap > jSize) {
            ecCap = jSize;
        }
        for (size_t m = edgeIndex; m < edgeIndex + ecCap; m++) {
            g_fromNodeIds.emplace_back(j[base + OFFSET_SECOND]);
        }
        edgeIndex += ecCap;
        v.traceNodeIds.emplace_back(j[base + OFFSET_FIFTH]);
        v.detachedness.emplace_back(j[base + OFFSET_SIXTH]);
    }
    // Flat copy for Edges to resolve toNodeId via g_ids[toNode + OFFSET_SECOND].
    for (size_t m = 0; m < j.size(); m++) {
        g_ids.emplace_back(j[m]);
    }
}

constexpr int32_t EDGES_SINGLE_LENGTH = 3;

void from_json(const json &j, Edges &v)
{
    v.fromNodeIds = g_fromNodeIds;  // toNodeIds resolved from g_ids (set in Nodes).
    for (size_t i = 0; i < j.size() / EDGES_SINGLE_LENGTH; i++) {
        v.types.emplace_back(j[i * EDGES_SINGLE_LENGTH]);
        v.nameOrIndexes.emplace_back(j[i * EDGES_SINGLE_LENGTH + OFFSET_FIRST]);
        v.toNodes.emplace_back(j[i * EDGES_SINGLE_LENGTH + OFFSET_SECOND]);
        const size_t idIndex = static_cast<size_t>(v.toNodes[i]) + static_cast<size_t>(OFFSET_SECOND);
        if (idIndex < g_ids.size()) {
            v.toNodeIds.emplace_back(g_ids[idIndex]);
        } else {
            // Defensive: malformed JSON may reference an invalid toNode index.
            v.toNodeIds.emplace_back(std::numeric_limits<uint32_t>::max());
        }
    }
}

constexpr int32_t LOCATION_SINGLE_LENGTH = 4;

void from_json(const json &j, Location &v)
{
    for (size_t i = 0; i < j.size() / LOCATION_SINGLE_LENGTH; i++) {
        v.objectIndexes.emplace_back(j[i * LOCATION_SINGLE_LENGTH]);
        v.scriptIds.emplace_back(j[i * LOCATION_SINGLE_LENGTH + OFFSET_FIRST]);
        v.lines.emplace_back(j[i * LOCATION_SINGLE_LENGTH + OFFSET_SECOND]);
        v.columns.emplace_back(j[i * LOCATION_SINGLE_LENGTH + OFFSET_THIRD]);
    }
}

constexpr int32_t SAMPLE_SINGLE_LENGTH = 2;

void from_json(const json &j, Sample &v)
{
    for (size_t i = 0; i < j.size() / SAMPLE_SINGLE_LENGTH; i++) {
        v.timestampUs.emplace_back(j[i * SAMPLE_SINGLE_LENGTH]);
        v.lastAssignedIds.emplace_back(j[i * SAMPLE_SINGLE_LENGTH + OFFSET_FIRST]);
    }
}

void from_json(const json &j, Strings &v)
{
    for (size_t i = 0; i < j.size(); i++) {
        v.strings.emplace_back(j[i]);
    }
}

constexpr int32_t TRACE_FUNC_INFO_SINGLE_LENGTH = 6;

void from_json(const json &j, TraceFuncInfo &v)
{
    for (size_t i = 0; i < j.size() / TRACE_FUNC_INFO_SINGLE_LENGTH; i++) {
        v.functionIds.emplace_back(j[i * TRACE_FUNC_INFO_SINGLE_LENGTH]);
        v.names.emplace_back(j[i * TRACE_FUNC_INFO_SINGLE_LENGTH + OFFSET_FIRST]);
        v.scriptNames.emplace_back(j[i * TRACE_FUNC_INFO_SINGLE_LENGTH + OFFSET_SECOND]);
        v.scriptIds.emplace_back(j[i * TRACE_FUNC_INFO_SINGLE_LENGTH + OFFSET_THIRD]);
        v.lines.emplace_back(j[i * TRACE_FUNC_INFO_SINGLE_LENGTH + OFFSET_FOURTH]);
        v.columns.emplace_back(j[i * TRACE_FUNC_INFO_SINGLE_LENGTH + OFFSET_FIFTH]);
    }
}

constexpr int32_t TRACE_NODE_LENGTH = 5;

// Recursive parse of trace_tree; each node is [id, functionInfoIndex, count, size, children].
void TraceParser::parse_trace_node(const json &array,
                                   std::vector<std::unique_ptr<ParentFunc>> &funcList,
                                   ParentFunc *parent)
{
    int32_t functionCount = static_cast<int32_t>(array.size()) / TRACE_NODE_LENGTH;
    for (int32_t i = 0; i < functionCount; ++i) {
        auto item = std::make_unique<ParentFunc>();
        if (parent != nullptr) {
            item->parent = parent;
        }
        item->id = array[i * TRACE_NODE_LENGTH];
        item->functionInfoIndex = array[i * TRACE_NODE_LENGTH + OFFSET_FIRST];
        item->count = array[i * TRACE_NODE_LENGTH + OFFSET_SECOND];
        item->size = array[i * TRACE_NODE_LENGTH + OFFSET_THIRD];
        auto childrenArray = array[i * TRACE_NODE_LENGTH + OFFSET_FOURTH];
        funcList.push_back(std::move(item));
        if (!childrenArray.empty()) {
            parse_trace_node(childrenArray, funcList, funcList.back().get());
        }
    }
}

void from_json(const json &j, TraceTree &v)
{
    std::vector<std::unique_ptr<ParentFunc>> funcList;
    TraceParser parser;
    parser.parse_trace_node(j, funcList);
    // Flatten tree to parallel arrays for filter.
    for (auto &func : funcList) {
        v.ids.emplace_back(func->id);
        v.functionInfoIndexes.emplace_back(func->functionInfoIndex);
        v.counts.emplace_back(func->count);
        v.sizes.emplace_back(func->size);
        v.parentIds.emplace_back(func->parent ? func->parent->id : std::numeric_limits<uint32_t>::max());
    }
}

} // namespace jsonns
} // namespace TraceStreamer
} // namespace SysTuning
