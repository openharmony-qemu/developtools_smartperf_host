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
#include <memory>
#include <string>

#define private public
#include "parser/ptreader_parser/js_parser/ptreader_js_memory_parser.h"
#include "trace_streamer_selector.h"

using namespace testing::ext;
using namespace SysTuning::TraceStreamer;

namespace {
constexpr uint32_t JS_HEAP_TYPE_SNAPSHOT = 0;
constexpr uint32_t JS_HEAP_TYPE_TIMELINE = 1;
} // namespace

namespace SysTuning {
namespace TraceStreamer {

class PtreaderJsMemoryParserTest : public ::testing::Test {
public:
    void SetUp() override
    {
        stream_.InitFilter();
    }

    void TearDown() override {}

public:
    SysTuning::TraceStreamer::TraceStreamerSelector stream_ = {};
};

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

static std::string GetMinimalTimelineJson()
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
        "samples": [1000, 1, 2000, 2],
        "strings": [],
        "trace_function_infos": [],
        "trace_tree": []
    })";
}

/**
 * @tc.name: ParseHeapFromBuffer_EmptyString
 * @tc.desc: ParseHeapFromBuffer with empty string returns false
 * @tc.type: FUNC
 */
HWTEST_F(PtreaderJsMemoryParserTest, ParseHeapFromBuffer_EmptyString, TestSize.Level1)
{
    PtreaderJsMemoryParser parser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool ok = parser.ParseHeapFromBuffer("");
    EXPECT_FALSE(ok);
}

/**
 * @tc.name: ParseHeapFromBuffer_InvalidJson
 * @tc.desc: ParseHeapFromBuffer with invalid JSON returns false
 * @tc.type: FUNC
 */
HWTEST_F(PtreaderJsMemoryParserTest, ParseHeapFromBuffer_InvalidJson, TestSize.Level1)
{
    PtreaderJsMemoryParser parser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool ok = parser.ParseHeapFromBuffer("not valid json {");
    EXPECT_FALSE(ok);
}

/**
 * @tc.name: ParseHeapFromBuffer_ValidSnapshot
 * @tc.desc: ParseHeapFromBuffer with valid snapshot JSON returns true
 * @tc.type: FUNC
 */
HWTEST_F(PtreaderJsMemoryParserTest, ParseHeapFromBuffer_ValidSnapshot, TestSize.Level1)
{
    PtreaderJsMemoryParser parser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool ok = parser.ParseHeapFromBuffer(GetMinimalSnapshotJson());
    EXPECT_TRUE(ok);
}

/**
 * @tc.name: ParseHeapFromBuffer_ValidTimeline
 * @tc.desc: ParseHeapFromBuffer with valid timeline JSON (non-empty samples) returns true
 * @tc.type: FUNC
 */
HWTEST_F(PtreaderJsMemoryParserTest, ParseHeapFromBuffer_ValidTimeline, TestSize.Level1)
{
    PtreaderJsMemoryParser parser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool ok = parser.ParseHeapFromBuffer(GetMinimalTimelineJson());
    EXPECT_TRUE(ok);

    const auto &files = stream_.traceDataCache_->GetConstJsHeapFilesData();
    ASSERT_EQ(files.FilePaths().size(), 1u);
    EXPECT_EQ(files.FilePaths()[0], "Timeline");
    EXPECT_EQ(files.SelfSizeCount()[0], 0u);

    const auto &config = stream_.traceDataCache_->GetConstJsConfigData();
    ASSERT_EQ(config.Pids().size(), 1u);
    EXPECT_EQ(config.Types()[0], JS_HEAP_TYPE_TIMELINE);
}

/**
 * @tc.name: ParseHeapFromBuffer_ValidSnapshot_PopulatesFilesAndConfig
 * @tc.desc: ParseHeapFromBuffer with valid snapshot JSON fills JsHeapFiles and JsConfig correctly
 * @tc.type: FUNC
 */
HWTEST_F(PtreaderJsMemoryParserTest, ParseHeapFromBuffer_ValidSnapshot_PopulatesFilesAndConfig, TestSize.Level1)
{
    PtreaderJsMemoryParser parser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    bool ok = parser.ParseHeapFromBuffer(GetMinimalSnapshotJson());
    EXPECT_TRUE(ok);

    const auto &files = stream_.traceDataCache_->GetConstJsHeapFilesData();
    ASSERT_EQ(files.FilePaths().size(), 1u);
    EXPECT_EQ(files.FilePaths()[0], "Snapshot");

    const auto &config = stream_.traceDataCache_->GetConstJsConfigData();
    ASSERT_EQ(config.Pids().size(), 1u);
    EXPECT_EQ(config.Types()[0], JS_HEAP_TYPE_SNAPSHOT);
}

} // namespace TraceStreamer
} // namespace SysTuning

#endif // ENABLE_ARKTS
