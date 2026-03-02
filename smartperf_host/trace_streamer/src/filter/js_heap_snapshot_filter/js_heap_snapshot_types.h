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

#ifndef JS_HEAP_SNAPSHOT_TYPES_H
#define JS_HEAP_SNAPSHOT_TYPES_H

#include <cstdint>
#include <memory>
#include <string>
#include <vector>
#include "json.hpp"

namespace SysTuning {
namespace TraceStreamer {
namespace jsonns {
using json = nlohmann::json;

constexpr int32_t OFFSET_FIRST = 1;
constexpr int32_t OFFSET_SECOND = 2;
constexpr int32_t OFFSET_THIRD = 3;
constexpr int32_t OFFSET_FOURTH = 4;
constexpr int32_t OFFSET_FIFTH = 5;
constexpr int32_t OFFSET_SIXTH = 6;

struct Meta {
    std::vector<std::string> nodeFields;
    std::vector<std::vector<std::string>> nodeTypes;
    std::vector<std::string> edgeFields;
    std::vector<std::vector<std::string>> edgeTypes;
    std::vector<std::string> traceFunctionInfoFields;
    std::vector<std::string> traceNodeFields;
    std::vector<std::string> sampleFields;
    std::vector<std::string> locationFields;
};

struct Snapshot {
    Meta meta;
    int32_t nodeCount;
    int32_t edgeCount;
    int32_t traceFunctionCount;
};

struct Nodes {
    std::vector<uint32_t> types;
    std::vector<uint32_t> names;
    std::vector<uint32_t> ids;
    std::vector<uint32_t> selfSizes;
    std::vector<uint32_t> edgeCounts;
    std::vector<uint32_t> traceNodeIds;
    std::vector<uint32_t> detachedness;
};

struct Edges {
    std::vector<uint32_t> types;
    std::vector<uint32_t> nameOrIndexes;
    std::vector<uint32_t> toNodes;
    std::vector<uint32_t> fromNodeIds;
    std::vector<uint32_t> toNodeIds;
};

struct Location {
    std::vector<uint32_t> objectIndexes;
    std::vector<uint32_t> scriptIds;
    std::vector<uint32_t> lines;
    std::vector<uint32_t> columns;
};

struct Sample {
    std::vector<uint32_t> timestampUs;
    std::vector<uint32_t> lastAssignedIds;
};

struct Strings {
    std::vector<std::string> strings;
};

struct TraceFuncInfo {
    std::vector<uint32_t> functionIds;
    std::vector<uint32_t> names;
    std::vector<uint32_t> scriptNames;
    std::vector<uint32_t> scriptIds;
    std::vector<uint32_t> lines;
    std::vector<uint32_t> columns;
};

struct TraceTree {
    std::vector<uint32_t> ids;
    std::vector<uint32_t> functionInfoIndexes;
    std::vector<uint32_t> counts;
    std::vector<uint32_t> sizes;
    std::vector<uint32_t> parentIds;
};

struct ParentFunc {
    uint32_t id;
    uint32_t functionInfoIndex;
    uint32_t count;
    uint32_t size;
    std::vector<std::unique_ptr<ParentFunc>> children;
    ParentFunc *parent = nullptr;
    ParentFunc();
};

class TraceParser {
public:
    void parse_trace_node(const json &array,
                          std::vector<std::unique_ptr<ParentFunc>> &funcList,
                          ParentFunc *parent = nullptr);
};

void from_json(const json &j, Meta &v);
void from_json(const json &j, Snapshot &v);
void from_json(const json &j, Nodes &v);
void from_json(const json &j, Edges &v);
void from_json(const json &j, Location &v);
void from_json(const json &j, Sample &v);
void from_json(const json &j, Strings &v);
void from_json(const json &j, TraceFuncInfo &v);
void from_json(const json &j, TraceTree &v);

} // namespace jsonns
} // namespace TraceStreamer
} // namespace SysTuning

#endif // JS_HEAP_SNAPSHOT_TYPES_H
