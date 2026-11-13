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

#ifdef ENABLE_ARKTS

#include <hwext/gtest-ext.h>
#include <hwext/gtest-tag.h>
#include <string>

#define private public
#include "json.hpp"
#include "js_heap_snapshot_filter.h"
#include "trace_data_cache.h"
#include "trace_streamer_filters.h"
#include "trace_streamer_selector.h"

using namespace testing::ext;
using namespace SysTuning::TraceStreamer;

namespace {
constexpr uint32_t DEFAULT_FILE_ID = 0;
constexpr uint64_t EXPECTED_SELF_SIZE_EMPTY = 0u;
constexpr uint64_t EXPECTED_SELF_SIZE_ONE_NODE = 64u;
constexpr size_t EXPECTED_TABLE_SIZE_ONE = 1u;
constexpr uint32_t EXPECTED_FULL_NODE_ID = 100u;
constexpr uint32_t EXPECTED_EDGE_INDEX_FIRST = 0u;
constexpr uint32_t EXPECTED_LOCATION_OBJECT_INDEX = 0u;
constexpr uint32_t EXPECTED_LOCATION_SCRIPT_ID = 10u;
constexpr uint32_t EXPECTED_LOCATION_LINE = 20u;
constexpr uint32_t EXPECTED_LOCATION_COLUMN = 30u;
constexpr uint64_t EXPECTED_SAMPLE_TIMESTAMP_US = 1000u;
constexpr uint32_t EXPECTED_SAMPLE_LAST_ASSIGNED_ID = 100u;
constexpr uint32_t EXPECTED_TRACE_FUNC_ID = 1u;
constexpr uint32_t EXPECTED_TRACE_NODE_ID = 1u;
constexpr size_t MIN_INFO_ENTRIES_FOR_FULL = 3u;
constexpr int EXPECTED_INFO_COUNT_VALUE = 1;
} // namespace

namespace SysTuning {
namespace TraceStreamer {

class JsHeapSnapshotFilterTest : public ::testing::Test {
public:
    void SetUp() override
    {
        stream_.InitFilter();
    }

    void TearDown() override {}

public:
    SysTuning::TraceStreamer::TraceStreamerSelector stream_ = {};
};

// Minimal valid heap snapshot JSON (empty nodes/edges) for ParseTimeline
static std::string GetMinimalSnapshotJson()
{
    return R"({
        "snapshot": {
            "meta": {
                "node_fields": ["type","name","id","self_size","edge_count","trace_node_id","detachedness"],
                "node_types": [["hidden","array","string"],"string","number","number","number","number","number"],
                "edge_fields": ["type","name_or_index","to_node"],
                "edge_types": [["context","element","property"],"string_or_number","node"],
                "trace_function_info_fields": [],
                "trace_node_fields": [],
                "sample_fields": [],
                "location_fields": []
            },
            "node_count": 0,
            "edge_count": 0,
            "trace_function_count": 0
        },
        "nodes": [],
        "edges": [],
        "locations": [],
        "samples": [],
        "strings": [],
        "trace_function_infos": [],
        "trace_tree": []
    })";
}

// Snapshot JSON with one node for selfSizeSum check
static std::string GetSnapshotJsonWithOneNode()
{
    return R"({
        "snapshot": {
            "meta": {
                "node_fields": ["type","name","id","self_size","edge_count","trace_node_id","detachedness"],
                "node_types": [["hidden","array","string"],"string","number","number","number","number","number"],
                "edge_fields": ["type","name_or_index","to_node"],
                "edge_types": [["context","element","property"],"string_or_number","node"],
                "trace_function_info_fields": [],
                "trace_node_fields": [],
                "sample_fields": [],
                "location_fields": []
            },
            "node_count": 1,
            "edge_count": 0,
            "trace_function_count": 0
        },
        "nodes": [0, 1, 100, 64, 0, 0, 0],
        "edges": [],
        "locations": [],
        "samples": [],
        "strings": [],
        "trace_function_infos": [],
        "trace_tree": []
    })";
}

// Snapshot JSON with one node and full sections to verify data cache tables
static std::string GetFullSnapshotJson()
{
    return R"({
        "snapshot": {
            "meta": {
                "node_fields": ["type","name","id","self_size","edge_count","trace_node_id","detachedness"],
                "node_types": [["hidden","array","string"],"string","number","number","number","number","number"],
                "edge_fields": ["type","name_or_index","to_node"],
                "edge_types": [["context","element","property"],"string_or_number","node"],
                "trace_function_info_fields": ["function_id","name","script_name","script_id","line","column"],
                "trace_node_fields": ["id","function_info_index","count","size","children"],
                "sample_fields": ["timestamp_us","last_assigned_id"],
                "location_fields": ["object_index","script_id","line","column"]
            },
            "node_count": 1,
            "edge_count": 1,
            "trace_function_count": 1
        },
        "nodes": [0, 1, 100, 64, 1, 0, 0],
        "edges": [0, 0, 0],
        "locations": [0, 10, 20, 30],
        "samples": [1000, 100],
        "strings": ["foo"],
        "trace_function_infos": [1, 0, 0, 10, 1, 1],
        "trace_tree": [1, 0, 2, 64, []]
    })";
}

/**
 * @tc.name: ParseTimelineToCache_EmptySnapshot
 * @tc.desc: ParseTimeline with minimal valid JSON returns zero selfSizeSum
 * @tc.type: FUNC
 */
HWTEST_F(JsHeapSnapshotFilterTest, ParseTimelineToCache_EmptySnapshot, TestSize.Level1)
{
    JsHeapSnapshotFilter filter(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    nlohmann::json jMessage = nlohmann::json::parse(GetMinimalSnapshotJson());
    uint64_t selfSizeSum = filter.ParseTimeline(DEFAULT_FILE_ID, jMessage);
    EXPECT_EQ(selfSizeSum, EXPECTED_SELF_SIZE_EMPTY);
}

/**
 * @tc.name: ParseTimelineToCache_OneNode
 * @tc.desc: ParseTimeline with one node returns node selfSize
 * @tc.type: FUNC
 */
HWTEST_F(JsHeapSnapshotFilterTest, ParseTimelineToCache_OneNode, TestSize.Level1)
{
    JsHeapSnapshotFilter filter(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    nlohmann::json jMessage = nlohmann::json::parse(GetSnapshotJsonWithOneNode());
    uint64_t selfSizeSum = filter.ParseTimeline(DEFAULT_FILE_ID, jMessage);
    EXPECT_EQ(selfSizeSum, EXPECTED_SELF_SIZE_ONE_NODE);
}

/**
 * @tc.name: ParseSnapshotToCache_EmptySnapshot
 * @tc.desc: ParseSnapshot parses all sections and returns zero for empty snapshot
 * @tc.type: FUNC
 */
HWTEST_F(JsHeapSnapshotFilterTest, ParseSnapshotToCache_EmptySnapshot, TestSize.Level1)
{
    JsHeapSnapshotFilter filter(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    nlohmann::json jMessage = nlohmann::json::parse(GetMinimalSnapshotJson());
    uint64_t selfSizeSum = filter.ParseSnapshot(DEFAULT_FILE_ID, jMessage);
    EXPECT_EQ(selfSizeSum, EXPECTED_SELF_SIZE_EMPTY);
}

/**
 * @tc.name: ParseSnapshotToCache_FullPopulatesTables
 * @tc.desc: ParseSnapshot parses all sections including samples/traceFunc/traceNode
 * @tc.type: FUNC
 */
HWTEST_F(JsHeapSnapshotFilterTest, ParseSnapshotToCache_FullPopulatesTables, TestSize.Level1)
{
    JsHeapSnapshotFilter filter(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    nlohmann::json jMessage = nlohmann::json::parse(GetFullSnapshotJson());
    uint64_t selfSizeSum = filter.ParseSnapshot(DEFAULT_FILE_ID, jMessage);
    EXPECT_EQ(selfSizeSum, EXPECTED_SELF_SIZE_ONE_NODE);

    const auto &nodes = stream_.traceDataCache_->GetConstJsHeapNodesData();
    ASSERT_EQ(nodes.FileIds().size(), EXPECTED_TABLE_SIZE_ONE);

    const auto &samples = stream_.traceDataCache_->GetConstJsHeapSampleData();
    EXPECT_EQ(samples.FileIds().size(), EXPECTED_TABLE_SIZE_ONE);

    const auto &traceFunc = stream_.traceDataCache_->GetConstJsHeapTraceFuncInfoData();
    EXPECT_EQ(traceFunc.FileIds().size(), EXPECTED_TABLE_SIZE_ONE);

    const auto &traceNode = stream_.traceDataCache_->GetConstJsHeapTraceNodeData();
    EXPECT_EQ(traceNode.FileIds().size(), EXPECTED_TABLE_SIZE_ONE);
}

/**
 * @tc.name: ParseTimelineToCache_FullSnapshot_PopulatesTables
 * @tc.desc: ParseTimeline with full snapshot JSON populates all JS heap tables correctly
 * @tc.type: FUNC
 */
HWTEST_F(JsHeapSnapshotFilterTest, ParseTimelineToCache_FullSnapshot_PopulatesTables, TestSize.Level1)
{
    JsHeapSnapshotFilter filter(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    nlohmann::json jMessage = nlohmann::json::parse(GetFullSnapshotJson());
    uint64_t selfSizeSum = filter.ParseTimeline(DEFAULT_FILE_ID, jMessage);
    EXPECT_EQ(selfSizeSum, EXPECTED_SELF_SIZE_ONE_NODE);

    const auto &nodes = stream_.traceDataCache_->GetConstJsHeapNodesData();
    ASSERT_EQ(nodes.FileIds().size(), EXPECTED_TABLE_SIZE_ONE);
    EXPECT_EQ(nodes.FileIds()[0], DEFAULT_FILE_ID);
    EXPECT_EQ(nodes.NodeIds()[0], EXPECTED_FULL_NODE_ID);
    EXPECT_EQ(nodes.SelfSizes()[0], EXPECTED_SELF_SIZE_ONE_NODE);

    const auto &edges = stream_.traceDataCache_->GetConstJsHeapEdgesData();
    ASSERT_EQ(edges.FileIds().size(), EXPECTED_TABLE_SIZE_ONE);
    EXPECT_EQ(edges.FileIds()[0], DEFAULT_FILE_ID);
    EXPECT_EQ(edges.EdgeIndexs()[0], EXPECTED_EDGE_INDEX_FIRST);

    const auto &locations = stream_.traceDataCache_->GetConstJsHeapLocationData();
    ASSERT_EQ(locations.FileIds().size(), EXPECTED_TABLE_SIZE_ONE);
    EXPECT_EQ(locations.ObjectIndexs()[0], EXPECTED_LOCATION_OBJECT_INDEX);
    EXPECT_EQ(locations.ScriptIds()[0], EXPECTED_LOCATION_SCRIPT_ID);
    EXPECT_EQ(locations.Lines()[0], EXPECTED_LOCATION_LINE);
    EXPECT_EQ(locations.Columns()[0], EXPECTED_LOCATION_COLUMN);

    const auto &samples = stream_.traceDataCache_->GetConstJsHeapSampleData();
    ASSERT_EQ(samples.FileIds().size(), EXPECTED_TABLE_SIZE_ONE);
    EXPECT_EQ(samples.TimeStampUs()[0], EXPECTED_SAMPLE_TIMESTAMP_US);
    EXPECT_EQ(samples.LastAssignedIds()[0], EXPECTED_SAMPLE_LAST_ASSIGNED_ID);

    const auto &strings = stream_.traceDataCache_->GetConstJsHeapStringData();
    ASSERT_EQ(strings.FileIds().size(), EXPECTED_TABLE_SIZE_ONE);
    EXPECT_EQ(strings.Strings()[0], "foo");

    const auto &traceFunc = stream_.traceDataCache_->GetConstJsHeapTraceFuncInfoData();
    ASSERT_EQ(traceFunc.FileIds().size(), EXPECTED_TABLE_SIZE_ONE);
    EXPECT_EQ(traceFunc.FunctionIds()[0], EXPECTED_TRACE_FUNC_ID);

    const auto &traceNode = stream_.traceDataCache_->GetConstJsHeapTraceNodeData();
    ASSERT_EQ(traceNode.FileIds().size(), EXPECTED_TABLE_SIZE_ONE);
    EXPECT_EQ(traceNode.TraceNodeIDs()[0], EXPECTED_TRACE_NODE_ID);
    EXPECT_EQ(traceNode.NodeSizes()[0], EXPECTED_SELF_SIZE_ONE_NODE);

    const auto &info = stream_.traceDataCache_->GetConstJsHeapInfoData();
    ASSERT_GE(info.FileIds().size(), MIN_INFO_ENTRIES_FOR_FULL);
    bool hasNodeCount = false;
    bool hasEdgeCount = false;
    bool hasTraceFuncCount = false;
    for (size_t i = 0; i < info.FileIds().size(); ++i) {
        if (info.FileIds()[i] != DEFAULT_FILE_ID) {
            continue;
        }
        if (info.Keys()[i] == "node_count" && info.IntValues()[i] == EXPECTED_INFO_COUNT_VALUE) {
            hasNodeCount = true;
        } else if (info.Keys()[i] == "edge_count" && info.IntValues()[i] == EXPECTED_INFO_COUNT_VALUE) {
            hasEdgeCount = true;
        } else if (info.Keys()[i] == "trace_function_count" && info.IntValues()[i] == EXPECTED_INFO_COUNT_VALUE) {
            hasTraceFuncCount = true;
        }
    }
    EXPECT_TRUE(hasNodeCount);
    EXPECT_TRUE(hasEdgeCount);
    EXPECT_TRUE(hasTraceFuncCount);
}

} // namespace TraceStreamer
} // namespace SysTuning

#endif // ENABLE_ARKTS
