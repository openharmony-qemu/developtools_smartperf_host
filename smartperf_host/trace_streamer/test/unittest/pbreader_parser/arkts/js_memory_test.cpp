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

#include <hwext/gtest-ext.h>
#include <hwext/gtest-tag.h>
#include <fcntl.h>
#include <fstream>
#include <iostream>
#include <string>
#include <unistd.h>

#define private public
#include "file.h"
#include "arkts/pbreader_js_memory_parser.h"
#include "js_heap_config.pb.h"
#include "js_heap_config.pbreader.h"
#include "js_heap_result.pb.h"
#include "js_heap_result.pbreader.h"
#include "trace_streamer_selector.h"

using namespace testing::ext;
using namespace SysTuning;
using namespace SysTuning::TraceStreamer;

namespace {
constexpr int32_t TEST_PID = 1734;
constexpr size_t EXPECTED_CHUNK_COUNT = 4;
constexpr int64_t PARSE_TS_CHUNK1 = 10000;
constexpr int64_t PARSE_TS_CHUNK2 = 11000;
constexpr int64_t PARSE_TS_CHUNK3 = 12000;
constexpr int64_t PARSE_TS_CHUNK4 = 13000;
constexpr int32_t DEFAULT_PARSE_OFFSET = 0;
constexpr size_t EXPECTED_JS_HEAP_FILE_COUNT = 1;
constexpr int HEAP_TYPE_SNAPSHOT = 0;
constexpr int HEAP_TYPE_TIMELINE = 1;
constexpr uint32_t EXPECTED_NODE0_TYPE = 9;
constexpr uint32_t EXPECTED_NODE0_NAME_INDEX = 25571;
constexpr uint32_t EXPECTED_NODE0_NODE_ID = 1;
constexpr uint32_t EXPECTED_NODE0_SELF_SIZE = 0;
constexpr uint32_t EXPECTED_NODE0_EDGE_COUNT = 3575;
constexpr uint32_t EXPECTED_NODE0_TRACE_NODE_ID = 0;
constexpr uint32_t EXPECTED_NODE0_DETACHEDNESS = 0;
constexpr uint32_t EXPECTED_EDGE0_TYPE = 5;
constexpr uint32_t EXPECTED_EDGE0_NAME_OR_INDEX = 25572;
constexpr uint32_t EXPECTED_EDGE0_TO_NODE = 1;
constexpr uint32_t EXPECTED_EDGE_FROM_NODE_ID_0 = 1;
constexpr uint32_t EXPECTED_EDGE_FROM_NODE_ID_1 = 3;
constexpr uint32_t EXPECTED_EDGE_FROM_NODE_ID_4 = 9949;
constexpr uint32_t EXPECTED_SAMPLE0_TIMESTAMP_US = 0;
constexpr uint32_t EXPECTED_SAMPLE0_LAST_ASSIGNED_ID = 42570;
constexpr uint32_t EXPECTED_SAMPLE1_TIMESTAMP_US = 200631;
constexpr uint32_t EXPECTED_SAMPLE1_LAST_ASSIGNED_ID = 42571;
constexpr uint32_t EXPECTED_SAMPLE2_TIMESTAMP_US = 401040;
constexpr uint32_t EXPECTED_SAMPLE2_LAST_ASSIGNED_ID = 42572;
constexpr uint32_t EXPECTED_SAMPLE3_TIMESTAMP_US = 601899;
constexpr uint32_t EXPECTED_SAMPLE3_LAST_ASSIGNED_ID = 42573;
constexpr uint32_t EXPECTED_TRACE_FUNC_FUNCTION_ID = 0;
constexpr uint32_t EXPECTED_TRACE_FUNC_NAME = 181;
constexpr uint32_t EXPECTED_TRACE_FUNC_SCRIPT_NAME = 1601;
constexpr uint32_t EXPECTED_TRACE_FUNC_SCRIPT_ID = 0;
constexpr uint32_t EXPECTED_TRACE_FUNC_LINE = 0;
constexpr uint32_t EXPECTED_TRACE_FUNC_COLUMN = 0;
constexpr int32_t EXPECTED_PARENT_ID_ROOT = -1;
constexpr uint32_t EXPECTED_TRACE_NODE0_FUNC_INFO_IDX = 0;
constexpr uint32_t EXPECTED_TRACE_NODE0_COUNT = 53;
constexpr uint32_t EXPECTED_TRACE_NODE0_SIZE = 996;
constexpr uint32_t EXPECTED_TRACE_NODE1_FUNC_INFO_IDX = 1;
constexpr uint32_t EXPECTED_TRACE_NODE1_COUNT = 571;
constexpr uint32_t EXPECTED_TRACE_NODE1_SIZE = 26580;
constexpr uint32_t EXPECTED_TRACE_NODE2_FUNC_INFO_IDX = 2;
constexpr uint32_t EXPECTED_TRACE_NODE2_COUNT = 5;
constexpr uint32_t EXPECTED_TRACE_NODE2_SIZE = 248;
constexpr uint32_t EXPECTED_TRACE_NODE10_FUNC_INFO_IDX = 10;
constexpr uint32_t EXPECTED_TRACE_NODE10_COUNT = 10;
constexpr uint32_t EXPECTED_TRACE_NODE10_SIZE = 348;
constexpr size_t INDEX_0 = 0;
constexpr size_t INDEX_1 = 1;
constexpr size_t INDEX_2 = 2;
constexpr size_t INDEX_3 = 3;
constexpr size_t INDEX_4 = 4;
constexpr size_t INDEX_10 = 10;
} // namespace

namespace SysTuning {
namespace TraceStreamer {
class JsMemoryTest : public ::testing::Test {
public:
    void SetUp()
    {
        stream_.InitFilter();
    }

    void TearDown() {}

    void SerializeConfig(ArkTSConfig_HeapType type)
    {
        const int32_t pid = TEST_PID;
        ArkTSConfig arkTSConfig;
        arkTSConfig.set_pid(pid);
        arkTSConfig.set_type(type);
        arkTSConfig.SerializeToString(&strConfig_);
    }

    void SerializeResult(std::vector<std::string> &strResultVec, std::vector<std::string> &resultVec)
    {
        ArkTSResult jsHeapResult;
        for (int i = 0; i < resultVec.size(); i++) {
            jsHeapResult.set_result(resultVec[i]);
            std::string strResult = "";
            jsHeapResult.SerializeToString(&strResult);
            strResultVec.push_back(strResult);
        }
    }

    void SetSnapshotParserNodesByJsmemory(std::vector<std::string> &strResultVec)
    {
        std::string result1 =
            "{\"method\":\"HeapProfiler.reportHeapSnapshotProgress\",\"params\":{\"done\":0,\"total\":21288}}";
        std::string result2 =
            "{\"method\":\"HeapProfiler.addHeapSnapshotChunk\",\"params\":{\"chunk\":\"{\\\"snapshot\\\":\\n{"
            "\\\"meta\\\":"
            "\\n{\\\"node_fields\\\":[\\\"type\\\",\\\"name\\\",\\\"id\\\",\\\"self_size\\\",\\\"edge_count\\\","
            "\\\"trace_"
            "node_id\\\",\\\"detachedness\\\"],\\n\\\"node_types\\\":[[\\\"hidden\\\",\\\"array\\\",\\\"string\\\","
            "\\\"object\\\",\\\"code\\\",\\\"closure\\\",\\\"regexp\\\",\\\"number\\\",\\\"native\\\","
            "\\\"synthetic\\\","
            "\\\"concatenated "
            "string\\\",\\\"slicedstring\\\",\\\"symbol\\\",\\\"bigint\\\"],\\\"string\\\",\\\"number\\\","
            "\\\"number\\\","
            "\\\"number\\\",\\\"number\\\",\\\"number\\\"],\\n\\\"edge_fields\\\":[\\\"type\\\",\\\"name_or_index\\\","
            "\\\"to_node\\\"],\\n\\\"edge_types\\\":[[\\\"context\\\",\\\"element\\\",\\\"property\\\","
            "\\\"internal\\\","
            "\\\"hidden\\\",\\\"shortcut\\\",\\\"weak\\\"],\\\"string_or_number\\\",\\\"node\\\"],\\n\\\"trace_"
            "function_"
            "info_fields\\\":[\\\"function_id\\\",\\\"name\\\",\\\"script_name\\\",\\\"script_id\\\",\\\"line\\\","
            "\\\"column\\\"],\\n\\\"trace_node_fields\\\":[\\\"id\\\",\\\"function_info_index\\\",\\\"count\\\","
            "\\\"size\\\",\\\"children\\\"],\\n\\\"sample_fields\\\":[\\\"timestamp_us\\\",\\\"last_assigned_id\\\"],"
            "\\n\\\"location_fields\\\":[\\\"object_index\\\",\\\"script_id\\\",\\\"line\\\",\\\"column\\\"]},"
            "\\n\\\"node_"
            "count\\\":32837,\\n\\\"edge_count\\\":152856,\\n\\\"trace_function_count\\\":0\\n},\\n\\\"nodes\\\":[9,"
            "25571,"
            "1,0,3575,0,0\\n,1,3,3,432,52,0,0\\n,8,9,9949,40,\"}}";
        std::string result3 =
            "{\"method\":\"HeapProfiler.addHeapSnapshotChunk\",\"params\":{\"chunk\":\"1,0,0],\\n\\\"edges\\\":[],"
            "\\n\\\"locations\\\":[],\\n\\\"samples\\\":[],\\n\\\"strings\\\":[],\\n\\\"trace_function_infos\\\":[],"
            "\\n\\\"trace_tree\\\":[]}\\n\"}}";
        std::string result4 = "{\"id\":1,\"result\":{}}";
        std::vector<std::string> resultVec = {result1, result2, result3, result4};
        SerializeResult(strResultVec, resultVec);
    }

    void SetSnapshotParserEdgesByJsmemory(std::vector<std::string> &strResultVec)
    {
        std::string result1 =
            "{\"method\":\"HeapProfiler.reportHeapSnapshotProgress\",\"params\":{\"done\":0,\"total\":21288}}";
        std::string result2 =
            "{\"method\":\"HeapProfiler.addHeapSnapshotChunk\",\"params\":{\"chunk\":\"{\\\"snapshot\\\":\\n{"
            "\\\"meta\\\":"
            "\\n{\\\"node_fields\\\":[\\\"type\\\",\\\"name\\\",\\\"id\\\",\\\"self_size\\\",\\\"edge_count\\\","
            "\\\"trace_"
            "node_id\\\",\\\"detachedness\\\"],\\n\\\"node_types\\\":[[\\\"hidden\\\",\\\"array\\\",\\\"string\\\","
            "\\\"object\\\",\\\"code\\\",\\\"closure\\\",\\\"regexp\\\",\\\"number\\\",\\\"native\\\","
            "\\\"synthetic\\\","
            "\\\"concatenated "
            "string\\\",\\\"slicedstring\\\",\\\"symbol\\\",\\\"bigint\\\"],\\\"string\\\",\\\"number\\\","
            "\\\"number\\\","
            "\\\"number\\\",\\\"number\\\",\\\"number\\\"],\\n\\\"edge_fields\\\":[\\\"type\\\",\\\"name_or_index\\\","
            "\\\"to_node\\\"],\\n\\\"edge_types\\\":[[\\\"context\\\",\\\"element\\\",\\\"property\\\","
            "\\\"internal\\\","
            "\\\"hidden\\\",\\\"shortcut\\\",\\\"weak\\\"],\\\"string_or_number\\\",\\\"node\\\"],\\n\\\"trace_"
            "function_"
            "info_fields\\\":[\\\"function_id\\\",\\\"name\\\",\\\"script_name\\\",\\\"script_id\\\",\\\"line\\\","
            "\\\"column\\\"],\\n\\\"trace_node_fields\\\":[\\\"id\\\",\\\"function_info_index\\\",\\\"count\\\","
            "\\\"size\\\",\\\"children\\\"],\\n\\\"sample_fields\\\":[\\\"timestamp_us\\\",\\\"last_assigned_id\\\"],"
            "\\n\\\"location_fields\\\":[\\\"object_index\\\",\\\"script_id\\\",\\\"line\\\",\\\"column\\\"]},"
            "\\n\\\"node_"
            "count\\\":3,\\n\\\"edge_count\\\":5,\\n\\\"trace_function_count\\\":0\\n},\\n\\\"nodes\\\":[9,25571,"
            "1,0,1,0,0\\n,1,3,3,432,3,0,0\\n,8,9,9949,40,\"}}";
        std::string result3 =
            "{\"method\":\"HeapProfiler.addHeapSnapshotChunk\",\"params\":{\"chunk\":\"1,0,0],\\n\\\"edges\\\":[5,"
            "25572,"
            "1\\n,5,25572,1\\n,5,25572,1\\n,5,25572,1\\n,5,25572,1\\n],"
            "\\n\\\"locations\\\":[],\\n\\\"samples\\\":[],\\n\\\"strings\\\":[],\\n\\\"trace_function_infos\\\":[],"
            "\\n\\\"trace_tree\\\":[]}\\n\"}}";
        std::string result4 = "{\"id\":1,\"result\":{}}";
        std::vector<std::string> resultVec = {result1, result2, result3, result4};
        SerializeResult(strResultVec, resultVec);
    }

    void SetTimelineParserNodesByJsmemory(std::vector<std::string> &strResultVec)
    {
        std::string result1 = "{\"id\":1,\"result\":{}}";
        std::string result2 =
            "{\"method\":\"HeapProfiler.addHeapSnapshotChunk\",\"params\":{\"chunk\":\"{\\\"snapshot\\\":\\n{"
            "\\\"meta\\\":"
            "\\n{\\\"node_fields\\\":[\\\"type\\\",\\\"name\\\",\\\"id\\\",\\\"self_size\\\",\\\"edge_count\\\","
            "\\\"trace_"
            "node_id\\\",\\\"detachedness\\\"],\\n\\\"node_types\\\":[[\\\"hidden\\\",\\\"array\\\",\\\"string\\\","
            "\\\"object\\\",\\\"code\\\",\\\"closure\\\",\\\"regexp\\\",\\\"number\\\",\\\"native\\\","
            "\\\"synthetic\\\","
            "\\\"concatenated "
            "string\\\",\\\"slicedstring\\\",\\\"symbol\\\",\\\"bigint\\\"],\\\"string\\\",\\\"number\\\","
            "\\\"number\\\","
            "\\\"number\\\",\\\"number\\\",\\\"number\\\"],\\n\\\"edge_fields\\\":[\\\"type\\\",\\\"name_or_index\\\","
            "\\\"to_node\\\"],\\n\\\"edge_types\\\":[[\\\"context\\\",\\\"element\\\",\\\"property\\\","
            "\\\"internal\\\","
            "\\\"hidden\\\",\\\"shortcut\\\",\\\"weak\\\"],\\\"string_or_number\\\",\\\"node\\\"],\\n\\\"trace_"
            "function_"
            "info_fields\\\":[\\\"function_id\\\",\\\"name\\\",\\\"script_name\\\",\\\"script_id\\\",\\\"line\\\","
            "\\\"column\\\"],\\n\\\"trace_node_fields\\\":[\\\"id\\\",\\\"function_info_index\\\",\\\"count\\\","
            "\\\"size\\\",\\\"children\\\"],\\n\\\"sample_fields\\\":[\\\"timestamp_us\\\",\\\"last_assigned_id\\\"],"
            "\\n\\\"location_fields\\\":[\\\"object_index\\\",\\\"script_id\\\",\\\"line\\\",\\\"column\\\"]},"
            "\\n\\\"node_"
            "count\\\":32837,\\n\\\"edge_count\\\":152856,\\n\\\"trace_function_count\\\":0\\n},\\n\\\"nodes\\\":[9,"
            "25571,"
            "1,0,3575,0,0\\n,1,3,3,432,52,0,0\\n,8,9,9949,40,\"}}";
        std::string result3 =
            "{\"method\":\"HeapProfiler.addHeapSnapshotChunk\",\"params\":{\"chunk\":\"1,0,0],\\n\\\"edges\\\":[],"
            "\\n\\\"locations\\\":[],\\n\\\"samples\\\":[],\\n\\\"strings\\\":[],\\n\\\"trace_function_infos\\\":[],"
            "\\n\\\"trace_tree\\\":[]}\\n\"}}";
        std::string result4 = "{\"id\":2,\"result\":{}}";
        std::vector<std::string> resultVec = {result1, result2, result3, result4};
        SerializeResult(strResultVec, resultVec);
    }

    void SetTimelineParserEdgesByJsmemory(std::vector<std::string> &strResultVec)
    {
        std::string result1 = "{\"id\":1,\"result\":{}}";
        std::string result2 =
            "{\"method\":\"HeapProfiler.addHeapSnapshotChunk\",\"params\":{\"chunk\":\"{\\\"snapshot\\\":\\n{"
            "\\\"meta\\\":"
            "\\n{\\\"node_fields\\\":[\\\"type\\\",\\\"name\\\",\\\"id\\\",\\\"self_size\\\",\\\"edge_count\\\","
            "\\\"trace_"
            "node_id\\\",\\\"detachedness\\\"],\\n\\\"node_types\\\":[[\\\"hidden\\\",\\\"array\\\",\\\"string\\\","
            "\\\"object\\\",\\\"code\\\",\\\"closure\\\",\\\"regexp\\\",\\\"number\\\",\\\"native\\\","
            "\\\"synthetic\\\","
            "\\\"concatenated "
            "string\\\",\\\"slicedstring\\\",\\\"symbol\\\",\\\"bigint\\\"],\\\"string\\\",\\\"number\\\","
            "\\\"number\\\","
            "\\\"number\\\",\\\"number\\\",\\\"number\\\"],\\n\\\"edge_fields\\\":[\\\"type\\\",\\\"name_or_index\\\","
            "\\\"to_node\\\"],\\n\\\"edge_types\\\":[[\\\"context\\\",\\\"element\\\",\\\"property\\\","
            "\\\"internal\\\","
            "\\\"hidden\\\",\\\"shortcut\\\",\\\"weak\\\"],\\\"string_or_number\\\",\\\"node\\\"],\\n\\\"trace_"
            "function_"
            "info_fields\\\":[\\\"function_id\\\",\\\"name\\\",\\\"script_name\\\",\\\"script_id\\\",\\\"line\\\","
            "\\\"column\\\"],\\n\\\"trace_node_fields\\\":[\\\"id\\\",\\\"function_info_index\\\",\\\"count\\\","
            "\\\"size\\\",\\\"children\\\"],\\n\\\"sample_fields\\\":[\\\"timestamp_us\\\",\\\"last_assigned_id\\\"],"
            "\\n\\\"location_fields\\\":[\\\"object_index\\\",\\\"script_id\\\",\\\"line\\\",\\\"column\\\"]},"
            "\\n\\\"node_"
            "count\\\":32837,\\n\\\"edge_count\\\":152856,\\n\\\"trace_function_count\\\":0\\n},\\n\\\"nodes\\\":[9,"
            "25571,"
            "1,0,1,0,0\\n,1,3,3,432,3,0,0\\n,8,9,9949,40,\"}}";
        std::string result3 =
            "{\"method\":\"HeapProfiler.addHeapSnapshotChunk\",\"params\":{\"chunk\":\"1,0,0],\\n\\\"edges\\\":[5,"
            "25572,"
            "1\\n,5,25572,1\\n,5,25572,1\\n,5,25572,1\\n,5,25572,1\\n],"
            "\\n\\\"locations\\\":[],\\n\\\"samples\\\":[],\\n\\\"strings\\\":[],\\n\\\"trace_function_infos\\\":[],"
            "\\n\\\"trace_tree\\\":[]}\\n\"}}";
        std::string result4 = "{\"id\":2,\"result\":{}}";
        std::vector<std::string> resultVec = {result1, result2, result3, result4};
        SerializeResult(strResultVec, resultVec);
    }

    void SetTimelineParserSamplesByJsmemory(std::vector<std::string> &strResultVec)
    {
        std::string result1 = "{\"id\":1,\"result\":{}}";
        std::string result2 =
            "{\"method\":\"HeapProfiler.addHeapSnapshotChunk\",\"params\":{\"chunk\":\"{\\\"snapshot\\\":\\n{"
            "\\\"meta\\\":"
            "\\n{\\\"node_fields\\\":[\\\"type\\\",\\\"name\\\",\\\"id\\\",\\\"self_size\\\",\\\"edge_count\\\","
            "\\\"trace_"
            "node_id\\\",\\\"detachedness\\\"],\\n\\\"node_types\\\":[[\\\"hidden\\\",\\\"array\\\",\\\"string\\\","
            "\\\"object\\\",\\\"code\\\",\\\"closure\\\",\\\"regexp\\\",\\\"number\\\",\\\"native\\\","
            "\\\"synthetic\\\","
            "\\\"concatenated "
            "string\\\",\\\"slicedstring\\\",\\\"symbol\\\",\\\"bigint\\\"],\\\"string\\\",\\\"number\\\","
            "\\\"number\\\","
            "\\\"number\\\",\\\"number\\\",\\\"number\\\"],\\n\\\"edge_fields\\\":[\\\"type\\\",\\\"name_or_index\\\","
            "\\\"to_node\\\"],\\n\\\"edge_types\\\":[[\\\"context\\\",\\\"element\\\",\\\"property\\\","
            "\\\"internal\\\","
            "\\\"hidden\\\",\\\"shortcut\\\",\\\"weak\\\"],\\\"string_or_number\\\",\\\"node\\\"],\\n\\\"trace_"
            "function_"
            "info_fields\\\":[\\\"function_id\\\",\\\"name\\\",\\\"script_name\\\",\\\"script_id\\\",\\\"line\\\","
            "\\\"column\\\"],\\n\\\"trace_node_fields\\\":[\\\"id\\\",\\\"function_info_index\\\",\\\"count\\\","
            "\\\"size\\\",\\\"children\\\"],\\n\\\"sample_fields\\\":[\\\"timestamp_us\\\",\\\"last_assigned_id\\\"],"
            "\\n\\\"location_fields\\\":[\\\"object_index\\\",\\\"script_id\\\",\\\"line\\\",\\\"column\\\"]},"
            "\\n\\\"node_"
            "count\\\":32837,\\n\\\"edge_count\\\":152856,\\n\\\"trace_function_count\\\":0\\n},\\n\\\"nodes\\\":[9,"
            "25571,"
            "1,0,1,0,0\\n,1,3,3,432,3,0,0\\n,8,9,9949,40,\"}}";
        std::string result3 =
            "{\"method\":\"HeapProfiler.addHeapSnapshotChunk\",\"params\":{\"chunk\":\"1,0,0],\\n\\\"edges\\\":[5,"
            "25572,"
            "1\\n,5,25572,1\\n,5,25572,1\\n,5,25572,1\\n,5,25572,1\\n],"
            "\\n\\\"locations\\\":[],\\n\\\"samples\\\":[0, 42570\\n, 200631, 42571\\n, 401040, 42572\\n, 601899, "
            "42573\\n, 804764, 42574\\n, 1006866, 42575\\n, 1207797, "
            "42576\\n],\\n\\\"strings\\\":[],\\n\\\"trace_function_infos\\\":[],"
            "\\n\\\"trace_tree\\\":[]}\\n\"}}";
        std::string result4 = "{\"id\":2,\"result\":{}}";
        std::vector<std::string> resultVec = {result1, result2, result3, result4};
        SerializeResult(strResultVec, resultVec);
    }

    void SetTimelineParserStringsByJsmemory(std::vector<std::string> &strResultVec)
    {
        std::string result1 = "{\"id\":1,\"result\":{}}";
        std::string result2 =
            "{\"method\":\"HeapProfiler.addHeapSnapshotChunk\",\"params\":{\"chunk\":\"{\\\"snapshot\\\":\\n{"
            "\\\"meta\\\":"
            "\\n{\\\"node_fields\\\":[\\\"type\\\",\\\"name\\\",\\\"id\\\",\\\"self_size\\\",\\\"edge_count\\\","
            "\\\"trace_"
            "node_id\\\",\\\"detachedness\\\"],\\n\\\"node_types\\\":[[\\\"hidden\\\",\\\"array\\\",\\\"string\\\","
            "\\\"object\\\",\\\"code\\\",\\\"closure\\\",\\\"regexp\\\",\\\"number\\\",\\\"native\\\","
            "\\\"synthetic\\\","
            "\\\"concatenated "
            "string\\\",\\\"slicedstring\\\",\\\"symbol\\\",\\\"bigint\\\"],\\\"string\\\",\\\"number\\\","
            "\\\"number\\\","
            "\\\"number\\\",\\\"number\\\",\\\"number\\\"],\\n\\\"edge_fields\\\":[\\\"type\\\",\\\"name_or_index\\\","
            "\\\"to_node\\\"],\\n\\\"edge_types\\\":[[\\\"context\\\",\\\"element\\\",\\\"property\\\","
            "\\\"internal\\\","
            "\\\"hidden\\\",\\\"shortcut\\\",\\\"weak\\\"],\\\"string_or_number\\\",\\\"node\\\"],\\n\\\"trace_"
            "function_"
            "info_fields\\\":[\\\"function_id\\\",\\\"name\\\",\\\"script_name\\\",\\\"script_id\\\",\\\"line\\\","
            "\\\"column\\\"],\\n\\\"trace_node_fields\\\":[\\\"id\\\",\\\"function_info_index\\\",\\\"count\\\","
            "\\\"size\\\",\\\"children\\\"],\\n\\\"sample_fields\\\":[\\\"timestamp_us\\\",\\\"last_assigned_id\\\"],"
            "\\n\\\"location_fields\\\":[\\\"object_index\\\",\\\"script_id\\\",\\\"line\\\",\\\"column\\\"]},"
            "\\n\\\"node_"
            "count\\\":32837,\\n\\\"edge_count\\\":152856,\\n\\\"trace_function_count\\\":0\\n},\\n\\\"nodes\\\":[9,"
            "25571,"
            "1,0,1,0,0\\n,1,3,3,432,3,0,0\\n,8,9,9949,40,\"}}";
        std::string result3 =
            "{\"method\":\"HeapProfiler.addHeapSnapshotChunk\",\"params\":{\"chunk\":\"1,0,0],\\n\\\"edges\\\":[5,"
            "25572,"
            "1\\n,5,25572,1\\n,5,25572,1\\n,5,25572,1\\n,5,25572,1\\n],"
            "\\n\\\"locations\\\":[],\\n\\\"samples\\\":[0, 42570\\n, 200631, 42571\\n, 401040, 42572\\n, 601899, "
            "42573\\n, 804764, 42574\\n, 1006866, 42575\\n, 1207797, "
            "42576\\n],\\n\\\"strings\\\":[\\\"<dummy>\\\",\\n\\\"\\\",\\n\\\"GC "
            "roots\\\",\\n\\\"TaggedDict[52]\\\",\\n\\\"JSFunction\\\"],\\n\\\"trace_function_infos\\\":[],"
            "\\n\\\"trace_tree\\\":[]}\\n\"}}";
        std::string result4 = "{\"id\":2,\"result\":{}}";
        std::vector<std::string> resultVec = {result1, result2, result3, result4};
        SerializeResult(strResultVec, resultVec);
    }

    void SetTimelineParserTraceFuncInfoByJsmemory(std::vector<std::string> &strResultVec)
    {
        std::string result1 = "{\"id\":1,\"result\":{}}";
        std::string result2 =
            "{\"method\":\"HeapProfiler.addHeapSnapshotChunk\",\"params\":{\"chunk\":\"{\\\"snapshot\\\":\\n{"
            "\\\"meta\\\":"
            "\\n{\\\"node_fields\\\":[\\\"type\\\",\\\"name\\\",\\\"id\\\",\\\"self_size\\\",\\\"edge_count\\\","
            "\\\"trace_"
            "node_id\\\",\\\"detachedness\\\"],\\n\\\"node_types\\\":[[\\\"hidden\\\",\\\"array\\\",\\\"string\\\","
            "\\\"object\\\",\\\"code\\\",\\\"closure\\\",\\\"regexp\\\",\\\"number\\\",\\\"native\\\","
            "\\\"synthetic\\\","
            "\\\"concatenated "
            "string\\\",\\\"slicedstring\\\",\\\"symbol\\\",\\\"bigint\\\"],\\\"string\\\",\\\"number\\\","
            "\\\"number\\\","
            "\\\"number\\\",\\\"number\\\",\\\"number\\\"],\\n\\\"edge_fields\\\":[\\\"type\\\",\\\"name_or_index\\\","
            "\\\"to_node\\\"],\\n\\\"edge_types\\\":[[\\\"context\\\",\\\"element\\\",\\\"property\\\","
            "\\\"internal\\\","
            "\\\"hidden\\\",\\\"shortcut\\\",\\\"weak\\\"],\\\"string_or_number\\\",\\\"node\\\"],\\n\\\"trace_"
            "function_"
            "info_fields\\\":[\\\"function_id\\\",\\\"name\\\",\\\"script_name\\\",\\\"script_id\\\",\\\"line\\\","
            "\\\"column\\\"],\\n\\\"trace_node_fields\\\":[\\\"id\\\",\\\"function_info_index\\\",\\\"count\\\","
            "\\\"size\\\",\\\"children\\\"],\\n\\\"sample_fields\\\":[\\\"timestamp_us\\\",\\\"last_assigned_id\\\"],"
            "\\n\\\"location_fields\\\":[\\\"object_index\\\",\\\"script_id\\\",\\\"line\\\",\\\"column\\\"]},"
            "\\n\\\"node_"
            "count\\\":32837,\\n\\\"edge_count\\\":152856,\\n\\\"trace_function_count\\\":0\\n},\\n\\\"nodes\\\":[9,"
            "25571,"
            "1,0,1,0,0\\n,1,3,3,432,3,0,0\\n,8,9,9949,40,\"}}";
        std::string result3 =
            "{\"method\":\"HeapProfiler.addHeapSnapshotChunk\",\"params\":{\"chunk\":\"1,0,0],\\n\\\"edges\\\":[5,"
            "25572,"
            "1\\n,5,25572,1\\n,5,25572,1\\n,5,25572,1\\n,5,25572,1\\n],"
            "\\n\\\"locations\\\":[],\\n\\\"samples\\\":[],\\n\\\"strings\\\":[],\\n\\\"trace_function_infos\\\":[0,"
            "181,"
            "1601,0,0,"
            "0\\n],"
            "\\n\\\"trace_tree\\\":[]}\\n\"}}";
        std::string result4 = "{\"id\":2,\"result\":{}}";
        std::vector<std::string> resultVec = {result1, result2, result3, result4};
        SerializeResult(strResultVec, resultVec);
    }

    void SetTimelineParserTraceTreeByJsmemory(std::vector<std::string> &strResultVec)
    {
        std::string result1 = "{\"id\":1,\"result\":{}}";
        std::string result2 =
            "{\"method\":\"HeapProfiler.addHeapSnapshotChunk\",\"params\":{\"chunk\":\"{\\\"snapshot\\\":\\n{"
            "\\\"meta\\\":"
            "\\n{\\\"node_fields\\\":[\\\"type\\\",\\\"name\\\",\\\"id\\\",\\\"self_size\\\",\\\"edge_count\\\","
            "\\\"trace_"
            "node_id\\\",\\\"detachedness\\\"],\\n\\\"node_types\\\":[[\\\"hidden\\\",\\\"array\\\",\\\"string\\\","
            "\\\"object\\\",\\\"code\\\",\\\"closure\\\",\\\"regexp\\\",\\\"number\\\",\\\"native\\\","
            "\\\"synthetic\\\","
            "\\\"concatenated "
            "string\\\",\\\"slicedstring\\\",\\\"symbol\\\",\\\"bigint\\\"],\\\"string\\\",\\\"number\\\","
            "\\\"number\\\","
            "\\\"number\\\",\\\"number\\\",\\\"number\\\"],\\n\\\"edge_fields\\\":[\\\"type\\\",\\\"name_or_index\\\","
            "\\\"to_node\\\"],\\n\\\"edge_types\\\":[[\\\"context\\\",\\\"element\\\",\\\"property\\\","
            "\\\"internal\\\","
            "\\\"hidden\\\",\\\"shortcut\\\",\\\"weak\\\"],\\\"string_or_number\\\",\\\"node\\\"],\\n\\\"trace_"
            "function_"
            "info_fields\\\":[\\\"function_id\\\",\\\"name\\\",\\\"script_name\\\",\\\"script_id\\\",\\\"line\\\","
            "\\\"column\\\"],\\n\\\"trace_node_fields\\\":[\\\"id\\\",\\\"function_info_index\\\",\\\"count\\\","
            "\\\"size\\\",\\\"children\\\"],\\n\\\"sample_fields\\\":[\\\"timestamp_us\\\",\\\"last_assigned_id\\\"],"
            "\\n\\\"location_fields\\\":[\\\"object_index\\\",\\\"script_id\\\",\\\"line\\\",\\\"column\\\"]},"
            "\\n\\\"node_"
            "count\\\":32837,\\n\\\"edge_count\\\":152856,\\n\\\"trace_function_count\\\":0\\n},\\n\\\"nodes\\\":[9,"
            "25571,"
            "1,0,1,0,0\\n,1,3,3,432,3,0,0\\n,8,9,9949,40,\"}}";
        std::string result3 =
            "{\"method\":\"HeapProfiler.addHeapSnapshotChunk\",\"params\":{\"chunk\":\"1,0,0],\\n\\\"edges\\\":[5,"
            "25572,"
            "1\\n,5,25572,1\\n,5,25572,1\\n,5,25572,1\\n,5,25572,1\\n],"
            "\\n\\\"locations\\\":[],\\n\\\"samples\\\":[],\\n\\\"strings\\\":[],\\n\\\"trace_function_infos\\\":[0,"
            "181,"
            "1601,0,0,"
            "0\\n],"
            "\\n\\\"trace_tree\\\":[1,0,53,996,[2,1,571,26580,[],3,2,5,248,[4,3,27,2684,[5,4,1352,68984,[6,5,20,920,[]]"
            ",7,"
            "6,5,144,[],8,7,18,636,[9,8,5,120,[10,9,1,28,[]]]]],11,10,10,348,[12,11,11,576,[13,12,21,632,[14,14,0,0,["
            "15,13,"
            "2,28,[]],16,15,5,188,[17,16,7,196,[]]]]],18,17,10,560,[19,9,2,28,[],20,18,172,7896,[21,19,4,3196,[]]]]]}"
            "\\n\"}"
            "}";
        std::string result4 = "{\"id\":2,\"result\":{}}";
        std::vector<std::string> resultVec = {result1, result2, result3, result4};
        SerializeResult(strResultVec, resultVec);
    }

public:
    SysTuning::TraceStreamer::TraceStreamerSelector stream_ = {};
    std::string strConfig_ = "";
};
/**
 * @tc.name: snapshotParserNodesbyJsmemory
 * @tc.desc: snapshot parser nodes
 * @tc.type: FUNC
 */
HWTEST_F(JsMemoryTest, snapshotParserNodesByJsmemory, TestSize.Level1)
{
    TS_LOGI("test35-1");
    SerializeConfig(ArkTSConfig_HeapType(HEAP_TYPE_SNAPSHOT));
    PbreaderJSMemoryParser htraceJSMemoryParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ProtoReader::BytesView tracePacket(reinterpret_cast<const uint8_t *>(strConfig_.data()), strConfig_.size());
    htraceJSMemoryParser.ParseJSMemoryConfig(tracePacket);

    std::vector<std::string> strResultVec;
    SetSnapshotParserNodesByJsmemory(strResultVec);
    ASSERT_EQ(EXPECTED_CHUNK_COUNT, strResultVec.size());
    std::string strResult1 = strResultVec[0];
    std::string strResult2 = strResultVec[1];
    std::string strResult3 = strResultVec[2];
    std::string strResult4 = strResultVec[3];
    ProtoReader::BytesView tracePacket1(reinterpret_cast<const uint8_t *>(strResult1.data()), strResult1.size());
    ProfilerPluginDataHeader profilerPluginData;
    htraceJSMemoryParser.Parse(tracePacket1, PARSE_TS_CHUNK1, DEFAULT_PARSE_OFFSET, DEFAULT_PARSE_OFFSET,
                               profilerPluginData);

    ProtoReader::BytesView tracePacket2(reinterpret_cast<const uint8_t *>(strResult2.data()), strResult2.size());
    htraceJSMemoryParser.Parse(tracePacket2, PARSE_TS_CHUNK2, DEFAULT_PARSE_OFFSET, DEFAULT_PARSE_OFFSET,
                               profilerPluginData);

    ProtoReader::BytesView tracePacket3(reinterpret_cast<const uint8_t *>(strResult3.data()), strResult3.size());
    htraceJSMemoryParser.Parse(tracePacket3, PARSE_TS_CHUNK3, DEFAULT_PARSE_OFFSET, DEFAULT_PARSE_OFFSET,
                               profilerPluginData);

    ProtoReader::BytesView tracePacket4(reinterpret_cast<const uint8_t *>(strResult4.data()), strResult4.size());
    htraceJSMemoryParser.Parse(tracePacket4, PARSE_TS_CHUNK4, DEFAULT_PARSE_OFFSET, DEFAULT_PARSE_OFFSET,
                               profilerPluginData);
    htraceJSMemoryParser.Finish();

    auto jsHeapFilesData = stream_.traceDataCache_->GetConstJsHeapFilesData();
    ASSERT_EQ(EXPECTED_JS_HEAP_FILE_COUNT, jsHeapFilesData.Size());
    EXPECT_EQ("Snapshot0", jsHeapFilesData.FilePaths()[INDEX_0]);
    EXPECT_EQ(PARSE_TS_CHUNK2, jsHeapFilesData.StartTimes()[INDEX_0]);
    EXPECT_EQ(PARSE_TS_CHUNK4, jsHeapFilesData.EndTimes()[INDEX_0]);
    auto jsHeapNodesData = stream_.traceDataCache_->GetConstJsHeapNodesData();
    EXPECT_EQ(EXPECTED_NODE0_TYPE, jsHeapNodesData.Types()[INDEX_0]);
    EXPECT_EQ(EXPECTED_NODE0_NAME_INDEX, jsHeapNodesData.Names()[INDEX_0]);
    EXPECT_EQ(EXPECTED_NODE0_NODE_ID, jsHeapNodesData.NodeIds()[INDEX_0]);
    EXPECT_EQ(EXPECTED_NODE0_SELF_SIZE, jsHeapNodesData.SelfSizes()[INDEX_0]);
    EXPECT_EQ(EXPECTED_NODE0_EDGE_COUNT, jsHeapNodesData.EdgeCounts()[INDEX_0]);
    EXPECT_EQ(EXPECTED_NODE0_TRACE_NODE_ID, jsHeapNodesData.TraceNodeIds()[INDEX_0]);
    EXPECT_EQ(EXPECTED_NODE0_DETACHEDNESS, jsHeapNodesData.DetachedNess()[INDEX_0]);
}

HWTEST_F(JsMemoryTest, snapshotParserEdgesByJsmemory, TestSize.Level1)
{
    TS_LOGI("test35-2");
    SerializeConfig(ArkTSConfig_HeapType(HEAP_TYPE_SNAPSHOT));
    PbreaderJSMemoryParser htraceJSMemoryParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ProtoReader::BytesView tracePacket(reinterpret_cast<const uint8_t *>(strConfig_.data()), strConfig_.size());
    htraceJSMemoryParser.ParseJSMemoryConfig(tracePacket);

    std::vector<std::string> strResultVec;
    SetSnapshotParserEdgesByJsmemory(strResultVec);
    std::string strResult1 = strResultVec[0];
    std::string strResult2 = strResultVec[1];
    std::string strResult3 = strResultVec[2];
    std::string strResult4 = strResultVec[3];
    ProtoReader::BytesView tracePacket1(reinterpret_cast<const uint8_t *>(strResult1.data()), strResult1.size());
    ProfilerPluginDataHeader profilerPluginData;
    htraceJSMemoryParser.Parse(tracePacket1, PARSE_TS_CHUNK1, DEFAULT_PARSE_OFFSET, DEFAULT_PARSE_OFFSET,
                               profilerPluginData);

    ProtoReader::BytesView tracePacket2(reinterpret_cast<const uint8_t *>(strResult2.data()), strResult2.size());
    htraceJSMemoryParser.Parse(tracePacket2, PARSE_TS_CHUNK2, DEFAULT_PARSE_OFFSET, DEFAULT_PARSE_OFFSET,
                               profilerPluginData);

    ProtoReader::BytesView tracePacket3(reinterpret_cast<const uint8_t *>(strResult3.data()), strResult3.size());
    htraceJSMemoryParser.Parse(tracePacket3, PARSE_TS_CHUNK3, DEFAULT_PARSE_OFFSET, DEFAULT_PARSE_OFFSET,
                               profilerPluginData);

    ProtoReader::BytesView tracePacket4(reinterpret_cast<const uint8_t *>(strResult4.data()), strResult4.size());
    htraceJSMemoryParser.Parse(tracePacket4, PARSE_TS_CHUNK4, DEFAULT_PARSE_OFFSET, DEFAULT_PARSE_OFFSET,
                               profilerPluginData);
    htraceJSMemoryParser.Finish();

    auto jsHeapEdgesData = stream_.traceDataCache_->GetConstJsHeapEdgesData();
    EXPECT_EQ(EXPECTED_EDGE0_TYPE, jsHeapEdgesData.Types()[INDEX_0]);
    EXPECT_EQ(EXPECTED_EDGE0_NAME_OR_INDEX, jsHeapEdgesData.NameOrIndexs()[INDEX_0]);
    EXPECT_EQ(EXPECTED_EDGE0_TO_NODE, jsHeapEdgesData.ToNodes()[INDEX_0]);

    EXPECT_EQ(EXPECTED_EDGE_FROM_NODE_ID_0, jsHeapEdgesData.FromNodeIds()[INDEX_0]);
    EXPECT_EQ(EXPECTED_EDGE_FROM_NODE_ID_1, jsHeapEdgesData.FromNodeIds()[INDEX_1]);
    EXPECT_EQ(EXPECTED_EDGE_FROM_NODE_ID_1, jsHeapEdgesData.FromNodeIds()[INDEX_2]);
    EXPECT_EQ(EXPECTED_EDGE_FROM_NODE_ID_1, jsHeapEdgesData.FromNodeIds()[INDEX_3]);
    EXPECT_EQ(EXPECTED_EDGE_FROM_NODE_ID_4, jsHeapEdgesData.FromNodeIds()[INDEX_4]);
}

HWTEST_F(JsMemoryTest, timelineParserNodesByJsmemory, TestSize.Level1)
{
    TS_LOGI("test35-3");
    SerializeConfig(ArkTSConfig_HeapType(HEAP_TYPE_TIMELINE));
    PbreaderJSMemoryParser htraceJSMemoryParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ProtoReader::BytesView tracePacket(reinterpret_cast<const uint8_t *>(strConfig_.data()), strConfig_.size());
    htraceJSMemoryParser.ParseJSMemoryConfig(tracePacket);

    std::vector<std::string> strResultVec;
    SetTimelineParserNodesByJsmemory(strResultVec);
    std::string strResult1 = strResultVec[0];
    std::string strResult2 = strResultVec[1];
    std::string strResult3 = strResultVec[2];
    std::string strResult4 = strResultVec[3];
    ProtoReader::BytesView tracePacket1(reinterpret_cast<const uint8_t *>(strResult1.data()), strResult1.size());
    ProfilerPluginDataHeader profilerPluginData;
    htraceJSMemoryParser.Parse(tracePacket1, PARSE_TS_CHUNK1, DEFAULT_PARSE_OFFSET, DEFAULT_PARSE_OFFSET,
                               profilerPluginData);

    ProtoReader::BytesView tracePacket2(reinterpret_cast<const uint8_t *>(strResult2.data()), strResult2.size());
    htraceJSMemoryParser.Parse(tracePacket2, PARSE_TS_CHUNK2, DEFAULT_PARSE_OFFSET, DEFAULT_PARSE_OFFSET,
                               profilerPluginData);

    ProtoReader::BytesView tracePacket3(reinterpret_cast<const uint8_t *>(strResult3.data()), strResult3.size());
    htraceJSMemoryParser.Parse(tracePacket3, PARSE_TS_CHUNK3, DEFAULT_PARSE_OFFSET, DEFAULT_PARSE_OFFSET,
                               profilerPluginData);

    ProtoReader::BytesView tracePacket4(reinterpret_cast<const uint8_t *>(strResult4.data()), strResult4.size());
    htraceJSMemoryParser.Parse(tracePacket4, PARSE_TS_CHUNK4, DEFAULT_PARSE_OFFSET, DEFAULT_PARSE_OFFSET,
                               profilerPluginData);
    htraceJSMemoryParser.Finish();

    auto jsHeapFilesData = stream_.traceDataCache_->GetConstJsHeapFilesData();
    ASSERT_EQ(EXPECTED_JS_HEAP_FILE_COUNT, jsHeapFilesData.Size());
    EXPECT_EQ("Timeline", jsHeapFilesData.FilePaths()[INDEX_0]);
    EXPECT_EQ(PARSE_TS_CHUNK1, jsHeapFilesData.StartTimes()[INDEX_0]);
    EXPECT_EQ(PARSE_TS_CHUNK4, jsHeapFilesData.EndTimes()[INDEX_0]);
    auto jsHeapNodesData = stream_.traceDataCache_->GetConstJsHeapNodesData();
    EXPECT_EQ(EXPECTED_NODE0_TYPE, jsHeapNodesData.Types()[INDEX_0]);
    EXPECT_EQ(EXPECTED_NODE0_NAME_INDEX, jsHeapNodesData.Names()[INDEX_0]);
    EXPECT_EQ(EXPECTED_NODE0_NODE_ID, jsHeapNodesData.NodeIds()[INDEX_0]);
    EXPECT_EQ(EXPECTED_NODE0_SELF_SIZE, jsHeapNodesData.SelfSizes()[INDEX_0]);
    EXPECT_EQ(EXPECTED_NODE0_EDGE_COUNT, jsHeapNodesData.EdgeCounts()[INDEX_0]);
    EXPECT_EQ(EXPECTED_NODE0_TRACE_NODE_ID, jsHeapNodesData.TraceNodeIds()[INDEX_0]);
    EXPECT_EQ(EXPECTED_NODE0_DETACHEDNESS, jsHeapNodesData.DetachedNess()[INDEX_0]);
}

HWTEST_F(JsMemoryTest, timelineParserEdgesByJsmemory, TestSize.Level1)
{
    TS_LOGI("test35-4");
    SerializeConfig(ArkTSConfig_HeapType(HEAP_TYPE_TIMELINE));
    PbreaderJSMemoryParser htraceJSMemoryParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ProtoReader::BytesView tracePacket(reinterpret_cast<const uint8_t *>(strConfig_.data()), strConfig_.size());
    htraceJSMemoryParser.ParseJSMemoryConfig(tracePacket);

    std::vector<std::string> strResultVec;
    SetTimelineParserEdgesByJsmemory(strResultVec);
    std::string strResult1 = strResultVec[0];
    std::string strResult2 = strResultVec[1];
    std::string strResult3 = strResultVec[2];
    std::string strResult4 = strResultVec[3];
    ProtoReader::BytesView tracePacket1(reinterpret_cast<const uint8_t *>(strResult1.data()), strResult1.size());
    ProfilerPluginDataHeader profilerPluginData;
    htraceJSMemoryParser.Parse(tracePacket1, PARSE_TS_CHUNK1, DEFAULT_PARSE_OFFSET, DEFAULT_PARSE_OFFSET,
                               profilerPluginData);

    ProtoReader::BytesView tracePacket2(reinterpret_cast<const uint8_t *>(strResult2.data()), strResult2.size());
    htraceJSMemoryParser.Parse(tracePacket2, PARSE_TS_CHUNK2, DEFAULT_PARSE_OFFSET, DEFAULT_PARSE_OFFSET,
                               profilerPluginData);

    ProtoReader::BytesView tracePacket3(reinterpret_cast<const uint8_t *>(strResult3.data()), strResult3.size());
    htraceJSMemoryParser.Parse(tracePacket3, PARSE_TS_CHUNK3, DEFAULT_PARSE_OFFSET, DEFAULT_PARSE_OFFSET,
                               profilerPluginData);

    ProtoReader::BytesView tracePacket4(reinterpret_cast<const uint8_t *>(strResult4.data()), strResult4.size());
    htraceJSMemoryParser.Parse(tracePacket4, PARSE_TS_CHUNK4, DEFAULT_PARSE_OFFSET, DEFAULT_PARSE_OFFSET,
                               profilerPluginData);
    htraceJSMemoryParser.Finish();

    auto jsHeapEdgesData = stream_.traceDataCache_->GetConstJsHeapEdgesData();
    EXPECT_EQ(EXPECTED_EDGE0_TYPE, jsHeapEdgesData.Types()[INDEX_0]);
    EXPECT_EQ(EXPECTED_EDGE0_NAME_OR_INDEX, jsHeapEdgesData.NameOrIndexs()[INDEX_0]);
    EXPECT_EQ(EXPECTED_EDGE0_TO_NODE, jsHeapEdgesData.ToNodes()[INDEX_0]);

    EXPECT_EQ(EXPECTED_EDGE_FROM_NODE_ID_0, jsHeapEdgesData.FromNodeIds()[INDEX_0]);
    EXPECT_EQ(EXPECTED_EDGE_FROM_NODE_ID_1, jsHeapEdgesData.FromNodeIds()[INDEX_1]);
    EXPECT_EQ(EXPECTED_EDGE_FROM_NODE_ID_1, jsHeapEdgesData.FromNodeIds()[INDEX_2]);
    EXPECT_EQ(EXPECTED_EDGE_FROM_NODE_ID_1, jsHeapEdgesData.FromNodeIds()[INDEX_3]);
    EXPECT_EQ(EXPECTED_EDGE_FROM_NODE_ID_4, jsHeapEdgesData.FromNodeIds()[INDEX_4]);
}

HWTEST_F(JsMemoryTest, timelineParserSamplesByJsmemory, TestSize.Level1)
{
    TS_LOGI("test35-5");
    SerializeConfig(ArkTSConfig_HeapType(HEAP_TYPE_TIMELINE));
    PbreaderJSMemoryParser htraceJSMemoryParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ProtoReader::BytesView tracePacket(reinterpret_cast<const uint8_t *>(strConfig_.data()), strConfig_.size());
    htraceJSMemoryParser.ParseJSMemoryConfig(tracePacket);

    std::vector<std::string> strResultVec;
    SetTimelineParserSamplesByJsmemory(strResultVec);
    std::string strResult1 = strResultVec[0];
    std::string strResult2 = strResultVec[1];
    std::string strResult3 = strResultVec[2];
    std::string strResult4 = strResultVec[3];
    ProtoReader::BytesView tracePacket1(reinterpret_cast<const uint8_t *>(strResult1.data()), strResult1.size());
    ProfilerPluginDataHeader profilerPluginData;
    htraceJSMemoryParser.Parse(tracePacket1, PARSE_TS_CHUNK1, DEFAULT_PARSE_OFFSET, DEFAULT_PARSE_OFFSET,
                               profilerPluginData);

    ProtoReader::BytesView tracePacket2(reinterpret_cast<const uint8_t *>(strResult2.data()), strResult2.size());
    htraceJSMemoryParser.Parse(tracePacket2, PARSE_TS_CHUNK2, DEFAULT_PARSE_OFFSET, DEFAULT_PARSE_OFFSET,
                               profilerPluginData);

    ProtoReader::BytesView tracePacket3(reinterpret_cast<const uint8_t *>(strResult3.data()), strResult3.size());
    htraceJSMemoryParser.Parse(tracePacket3, PARSE_TS_CHUNK3, DEFAULT_PARSE_OFFSET, DEFAULT_PARSE_OFFSET,
                               profilerPluginData);

    ProtoReader::BytesView tracePacket4(reinterpret_cast<const uint8_t *>(strResult4.data()), strResult4.size());
    htraceJSMemoryParser.Parse(tracePacket4, PARSE_TS_CHUNK4, DEFAULT_PARSE_OFFSET, DEFAULT_PARSE_OFFSET,
                               profilerPluginData);
    htraceJSMemoryParser.Finish();

    auto jsHeapSampleData = stream_.traceDataCache_->GetConstJsHeapSampleData();
    EXPECT_EQ(EXPECTED_SAMPLE0_TIMESTAMP_US, jsHeapSampleData.TimeStampUs()[INDEX_0]);
    EXPECT_EQ(EXPECTED_SAMPLE0_LAST_ASSIGNED_ID, jsHeapSampleData.LastAssignedIds()[INDEX_0]);
    EXPECT_EQ(EXPECTED_SAMPLE1_TIMESTAMP_US, jsHeapSampleData.TimeStampUs()[INDEX_1]);
    EXPECT_EQ(EXPECTED_SAMPLE1_LAST_ASSIGNED_ID, jsHeapSampleData.LastAssignedIds()[INDEX_1]);
    EXPECT_EQ(EXPECTED_SAMPLE2_TIMESTAMP_US, jsHeapSampleData.TimeStampUs()[INDEX_2]);
    EXPECT_EQ(EXPECTED_SAMPLE2_LAST_ASSIGNED_ID, jsHeapSampleData.LastAssignedIds()[INDEX_2]);
    EXPECT_EQ(EXPECTED_SAMPLE3_TIMESTAMP_US, jsHeapSampleData.TimeStampUs()[INDEX_3]);
    EXPECT_EQ(EXPECTED_SAMPLE3_LAST_ASSIGNED_ID, jsHeapSampleData.LastAssignedIds()[INDEX_3]);
}

HWTEST_F(JsMemoryTest, timelineParserStringsByJsmemory, TestSize.Level1)
{
    TS_LOGI("test35-6");
    SerializeConfig(ArkTSConfig_HeapType(HEAP_TYPE_TIMELINE));
    PbreaderJSMemoryParser htraceJSMemoryParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ProtoReader::BytesView tracePacket(reinterpret_cast<const uint8_t *>(strConfig_.data()), strConfig_.size());
    htraceJSMemoryParser.ParseJSMemoryConfig(tracePacket);

    std::vector<std::string> strResultVec;
    SetTimelineParserStringsByJsmemory(strResultVec);
    std::string strResult1 = strResultVec[0];
    std::string strResult2 = strResultVec[1];
    std::string strResult3 = strResultVec[2];
    std::string strResult4 = strResultVec[3];
    ProtoReader::BytesView tracePacket1(reinterpret_cast<const uint8_t *>(strResult1.data()), strResult1.size());
    ProfilerPluginDataHeader profilerPluginData;
    htraceJSMemoryParser.Parse(tracePacket1, PARSE_TS_CHUNK1, DEFAULT_PARSE_OFFSET, DEFAULT_PARSE_OFFSET,
                               profilerPluginData);

    ProtoReader::BytesView tracePacket2(reinterpret_cast<const uint8_t *>(strResult2.data()), strResult2.size());
    htraceJSMemoryParser.Parse(tracePacket2, PARSE_TS_CHUNK2, DEFAULT_PARSE_OFFSET, DEFAULT_PARSE_OFFSET,
                               profilerPluginData);

    ProtoReader::BytesView tracePacket3(reinterpret_cast<const uint8_t *>(strResult3.data()), strResult3.size());
    htraceJSMemoryParser.Parse(tracePacket3, PARSE_TS_CHUNK3, DEFAULT_PARSE_OFFSET, DEFAULT_PARSE_OFFSET,
                               profilerPluginData);

    ProtoReader::BytesView tracePacket4(reinterpret_cast<const uint8_t *>(strResult4.data()), strResult4.size());
    htraceJSMemoryParser.Parse(tracePacket4, PARSE_TS_CHUNK4, DEFAULT_PARSE_OFFSET, DEFAULT_PARSE_OFFSET,
                               profilerPluginData);
    htraceJSMemoryParser.Finish();

    auto jsHeapStringData = stream_.traceDataCache_->GetConstJsHeapStringData();
    EXPECT_EQ("<dummy>", jsHeapStringData.Strings()[INDEX_0]);
    EXPECT_EQ("", jsHeapStringData.Strings()[INDEX_1]);
    EXPECT_EQ("GC roots", jsHeapStringData.Strings()[INDEX_2]);
    EXPECT_EQ("TaggedDict[52]", jsHeapStringData.Strings()[INDEX_3]);
    EXPECT_EQ("JSFunction", jsHeapStringData.Strings()[INDEX_4]);
}

HWTEST_F(JsMemoryTest, timelineParserTraceFuncInfoByJsmemory, TestSize.Level1)
{
    TS_LOGI("test35-7");
    SerializeConfig(ArkTSConfig_HeapType(HEAP_TYPE_TIMELINE));
    PbreaderJSMemoryParser htraceJSMemoryParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ProtoReader::BytesView tracePacket(reinterpret_cast<const uint8_t *>(strConfig_.data()), strConfig_.size());
    htraceJSMemoryParser.ParseJSMemoryConfig(tracePacket);

    std::vector<std::string> strResultVec;
    SetTimelineParserTraceFuncInfoByJsmemory(strResultVec);
    std::string strResult1 = strResultVec[0];
    std::string strResult2 = strResultVec[1];
    std::string strResult3 = strResultVec[2];
    std::string strResult4 = strResultVec[3];
    ProtoReader::BytesView tracePacket1(reinterpret_cast<const uint8_t *>(strResult1.data()), strResult1.size());
    ProfilerPluginDataHeader profilerPluginData;
    htraceJSMemoryParser.Parse(tracePacket1, PARSE_TS_CHUNK1, DEFAULT_PARSE_OFFSET, DEFAULT_PARSE_OFFSET,
                               profilerPluginData);

    ProtoReader::BytesView tracePacket2(reinterpret_cast<const uint8_t *>(strResult2.data()), strResult2.size());
    htraceJSMemoryParser.Parse(tracePacket2, PARSE_TS_CHUNK2, DEFAULT_PARSE_OFFSET, DEFAULT_PARSE_OFFSET,
                               profilerPluginData);

    ProtoReader::BytesView tracePacket3(reinterpret_cast<const uint8_t *>(strResult3.data()), strResult3.size());
    htraceJSMemoryParser.Parse(tracePacket3, PARSE_TS_CHUNK3, DEFAULT_PARSE_OFFSET, DEFAULT_PARSE_OFFSET,
                               profilerPluginData);

    ProtoReader::BytesView tracePacket4(reinterpret_cast<const uint8_t *>(strResult4.data()), strResult4.size());
    htraceJSMemoryParser.Parse(tracePacket4, PARSE_TS_CHUNK4, DEFAULT_PARSE_OFFSET, DEFAULT_PARSE_OFFSET,
                               profilerPluginData);
    htraceJSMemoryParser.Finish();

    auto jsHeapTraceFuncInfoData = stream_.traceDataCache_->GetConstJsHeapTraceFuncInfoData();
    EXPECT_EQ(EXPECTED_TRACE_FUNC_FUNCTION_ID, jsHeapTraceFuncInfoData.FunctionIds()[INDEX_0]);
    EXPECT_EQ(EXPECTED_TRACE_FUNC_NAME, jsHeapTraceFuncInfoData.Names()[INDEX_0]);
    EXPECT_EQ(EXPECTED_TRACE_FUNC_SCRIPT_NAME, jsHeapTraceFuncInfoData.ScriptNames()[INDEX_0]);
    EXPECT_EQ(EXPECTED_TRACE_FUNC_SCRIPT_ID, jsHeapTraceFuncInfoData.ScriptIds()[INDEX_0]);
    EXPECT_EQ(EXPECTED_TRACE_FUNC_LINE, jsHeapTraceFuncInfoData.Lines()[INDEX_0]);
    EXPECT_EQ(EXPECTED_TRACE_FUNC_COLUMN, jsHeapTraceFuncInfoData.Columns()[INDEX_0]);
}

HWTEST_F(JsMemoryTest, timelineParserTraceTreeByJsmemory, TestSize.Level1)
{
    TS_LOGI("test35-8");
    SerializeConfig(ArkTSConfig_HeapType(HEAP_TYPE_TIMELINE));
    PbreaderJSMemoryParser htraceJSMemoryParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ProtoReader::BytesView tracePacket(reinterpret_cast<const uint8_t *>(strConfig_.data()), strConfig_.size());
    htraceJSMemoryParser.ParseJSMemoryConfig(tracePacket);

    std::vector<std::string> strResultVec;
    SetTimelineParserTraceTreeByJsmemory(strResultVec);
    std::string strResult1 = strResultVec[0];
    std::string strResult2 = strResultVec[1];
    std::string strResult3 = strResultVec[2];
    std::string strResult4 = strResultVec[3];
    ProtoReader::BytesView tracePacket1(reinterpret_cast<const uint8_t *>(strResult1.data()), strResult1.size());
    ProfilerPluginDataHeader profilerPluginData;
    htraceJSMemoryParser.Parse(tracePacket1, PARSE_TS_CHUNK1, DEFAULT_PARSE_OFFSET, DEFAULT_PARSE_OFFSET,
                               profilerPluginData);

    ProtoReader::BytesView tracePacket2(reinterpret_cast<const uint8_t *>(strResult2.data()), strResult2.size());
    htraceJSMemoryParser.Parse(tracePacket2, PARSE_TS_CHUNK2, DEFAULT_PARSE_OFFSET, DEFAULT_PARSE_OFFSET,
                               profilerPluginData);

    ProtoReader::BytesView tracePacket3(reinterpret_cast<const uint8_t *>(strResult3.data()), strResult3.size());
    htraceJSMemoryParser.Parse(tracePacket3, PARSE_TS_CHUNK3, DEFAULT_PARSE_OFFSET, DEFAULT_PARSE_OFFSET,
                               profilerPluginData);

    ProtoReader::BytesView tracePacket4(reinterpret_cast<const uint8_t *>(strResult4.data()), strResult4.size());
    htraceJSMemoryParser.Parse(tracePacket4, PARSE_TS_CHUNK4, DEFAULT_PARSE_OFFSET, DEFAULT_PARSE_OFFSET,
                               profilerPluginData);
    htraceJSMemoryParser.Finish();

    auto jsHeapTraceNodeData = stream_.traceDataCache_->GetConstJsHeapTraceNodeData();
    EXPECT_EQ(EXPECTED_TRACE_NODE0_FUNC_INFO_IDX, jsHeapTraceNodeData.FunctionInfoIndexs()[INDEX_0]);
    EXPECT_EQ(EXPECTED_TRACE_NODE0_COUNT, jsHeapTraceNodeData.Counts()[INDEX_0]);
    EXPECT_EQ(EXPECTED_TRACE_NODE0_SIZE, jsHeapTraceNodeData.NodeSizes()[INDEX_0]);
    EXPECT_EQ(EXPECTED_PARENT_ID_ROOT, jsHeapTraceNodeData.ParentIds()[INDEX_0]);
    EXPECT_EQ(EXPECTED_TRACE_NODE1_FUNC_INFO_IDX, jsHeapTraceNodeData.FunctionInfoIndexs()[INDEX_1]);
    EXPECT_EQ(EXPECTED_TRACE_NODE1_COUNT, jsHeapTraceNodeData.Counts()[INDEX_1]);
    EXPECT_EQ(EXPECTED_TRACE_NODE1_SIZE, jsHeapTraceNodeData.NodeSizes()[INDEX_1]);
    EXPECT_EQ(INDEX_1, jsHeapTraceNodeData.ParentIds()[INDEX_1]);
    EXPECT_EQ(EXPECTED_TRACE_NODE2_FUNC_INFO_IDX, jsHeapTraceNodeData.FunctionInfoIndexs()[INDEX_2]);
    EXPECT_EQ(EXPECTED_TRACE_NODE2_COUNT, jsHeapTraceNodeData.Counts()[INDEX_2]);
    EXPECT_EQ(EXPECTED_TRACE_NODE2_SIZE, jsHeapTraceNodeData.NodeSizes()[INDEX_2]);
    EXPECT_EQ(INDEX_1, jsHeapTraceNodeData.ParentIds()[INDEX_2]);
    EXPECT_EQ(INDEX_3, jsHeapTraceNodeData.ParentIds()[INDEX_3]);
    EXPECT_EQ(INDEX_4, jsHeapTraceNodeData.ParentIds()[INDEX_4]);
    EXPECT_EQ(EXPECTED_TRACE_NODE10_FUNC_INFO_IDX, jsHeapTraceNodeData.FunctionInfoIndexs()[INDEX_10]);
    EXPECT_EQ(EXPECTED_TRACE_NODE10_COUNT, jsHeapTraceNodeData.Counts()[INDEX_10]);
    EXPECT_EQ(EXPECTED_TRACE_NODE10_SIZE, jsHeapTraceNodeData.NodeSizes()[INDEX_10]);
    EXPECT_EQ(INDEX_1, jsHeapTraceNodeData.ParentIds()[INDEX_10]);
}
} // namespace TraceStreamer
} // namespace SysTuning
