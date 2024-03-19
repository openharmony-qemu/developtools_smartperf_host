/*
 * Copyright (c) 2021 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
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

#include "file.h"
#include "htrace_js_memory_parser.h"
#include "js_heap_config.pb.h"
#include "js_heap_config.pbreader.h"
#include "js_heap_result.pb.h"
#include "js_heap_result.pbreader.h"
#include "trace_streamer_selector.h"

using namespace testing::ext;
using namespace SysTuning;
using namespace SysTuning::TraceStreamer;
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
        const int32_t pid = 1734;
        ArkTSConfig arkTSConfig;
        arkTSConfig.set_pid(pid);
        arkTSConfig.set_type(type);
        arkTSConfig.SerializeToString(&strConfig_);
    }

    void SerializeResult(std::vector<std::string>& strResultVec, std::vector<std::string>& resultVec)
    {
        ArkTSResult jsHeapResult;
        for (int i = 0; i < resultVec.size(); i++) {
            jsHeapResult.set_result(resultVec[i]);
            std::string strResult = "";
            jsHeapResult.SerializeToString(&strResult);
            strResultVec.push_back(strResult);
        }
    }

    void SetSnapshotParserNodesByJsmemory(std::vector<std::string>& strResultVec)
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

    void SetSnapshotParserEdgesByJsmemory(std::vector<std::string>& strResultVec)
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

    void SetTimelineParserNodesByJsmemory(std::vector<std::string>& strResultVec)
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

    void SetTimelineParserEdgesByJsmemory(std::vector<std::string>& strResultVec)
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

    void SetTimelineParserSamplesByJsmemory(std::vector<std::string>& strResultVec)
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

    void SetTimelineParserStringsByJsmemory(std::vector<std::string>& strResultVec)
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

    void SetTimelineParserTraceFuncInfoByJsmemory(std::vector<std::string>& strResultVec)
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

    void SetTimelineParserTraceTreeByJsmemory(std::vector<std::string>& strResultVec)
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
    SerializeConfig(ArkTSConfig_HeapType(0));
    HtraceJSMemoryParser htraceJSMemoryParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ProtoReader::BytesView tracePacket(reinterpret_cast<const uint8_t*>(strConfig_.data()), strConfig_.size());
    htraceJSMemoryParser.ParseJSMemoryConfig(tracePacket);

    std::vector<std::string> strResultVec;
    SetSnapshotParserNodesByJsmemory(strResultVec);
    ASSERT_EQ(4, strResultVec.size());
    std::string strResult1 = strResultVec[0];
    std::string strResult2 = strResultVec[1];
    std::string strResult3 = strResultVec[2];
    std::string strResult4 = strResultVec[3];
    ProtoReader::BytesView tracePacket1(reinterpret_cast<const uint8_t*>(strResult1.data()), strResult1.size());
    ProfilerPluginDataHeader profilerPluginData;
    htraceJSMemoryParser.Parse(tracePacket1, 10000, 0, 0, profilerPluginData);

    ProtoReader::BytesView tracePacket2(reinterpret_cast<const uint8_t*>(strResult2.data()), strResult2.size());
    htraceJSMemoryParser.Parse(tracePacket2, 11000, 0, 0, profilerPluginData);

    ProtoReader::BytesView tracePacket3(reinterpret_cast<const uint8_t*>(strResult3.data()), strResult3.size());
    htraceJSMemoryParser.Parse(tracePacket3, 12000, 0, 0, profilerPluginData);

    ProtoReader::BytesView tracePacket4(reinterpret_cast<const uint8_t*>(strResult4.data()), strResult4.size());
    htraceJSMemoryParser.Parse(tracePacket4, 13000, 0, 0, profilerPluginData);
    htraceJSMemoryParser.Finish();

    auto jsHeapFilesData = stream_.traceDataCache_->GetConstJsHeapFilesData();
    ASSERT_EQ(1, jsHeapFilesData.Size());
    EXPECT_EQ("Snapshot0", jsHeapFilesData.FilePaths()[0]);
    EXPECT_EQ(11000, jsHeapFilesData.StartTimes()[0]);
    EXPECT_EQ(13000, jsHeapFilesData.EndTimes()[0]);
    auto jsHeapNodesData = stream_.traceDataCache_->GetConstJsHeapNodesData();
    EXPECT_EQ(9, jsHeapNodesData.Types()[0]);
    EXPECT_EQ(25571, jsHeapNodesData.Names()[0]);
    EXPECT_EQ(1, jsHeapNodesData.NodeIds()[0]);
    EXPECT_EQ(0, jsHeapNodesData.SelfSizes()[0]);
    EXPECT_EQ(3575, jsHeapNodesData.EdgeCounts()[0]);
    EXPECT_EQ(0, jsHeapNodesData.TraceNodeIds()[0]);
    EXPECT_EQ(0, jsHeapNodesData.DetachedNess()[0]);
}

HWTEST_F(JsMemoryTest, snapshotParserEdgesByJsmemory, TestSize.Level1)
{
    TS_LOGI("test35-2");
    SerializeConfig(ArkTSConfig_HeapType(0));
    HtraceJSMemoryParser htraceJSMemoryParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ProtoReader::BytesView tracePacket(reinterpret_cast<const uint8_t*>(strConfig_.data()), strConfig_.size());
    htraceJSMemoryParser.ParseJSMemoryConfig(tracePacket);

    std::vector<std::string> strResultVec;
    SetSnapshotParserEdgesByJsmemory(strResultVec);
    std::string strResult1 = strResultVec[0];
    std::string strResult2 = strResultVec[1];
    std::string strResult3 = strResultVec[2];
    std::string strResult4 = strResultVec[3];
    ProtoReader::BytesView tracePacket1(reinterpret_cast<const uint8_t*>(strResult1.data()), strResult1.size());
    ProfilerPluginDataHeader profilerPluginData;
    htraceJSMemoryParser.Parse(tracePacket1, 10000, 0, 0, profilerPluginData);

    ProtoReader::BytesView tracePacket2(reinterpret_cast<const uint8_t*>(strResult2.data()), strResult2.size());
    htraceJSMemoryParser.Parse(tracePacket2, 11000, 0, 0, profilerPluginData);

    ProtoReader::BytesView tracePacket3(reinterpret_cast<const uint8_t*>(strResult3.data()), strResult3.size());
    htraceJSMemoryParser.Parse(tracePacket3, 12000, 0, 0, profilerPluginData);

    ProtoReader::BytesView tracePacket4(reinterpret_cast<const uint8_t*>(strResult4.data()), strResult4.size());
    htraceJSMemoryParser.Parse(tracePacket4, 13000, 0, 0, profilerPluginData);
    htraceJSMemoryParser.Finish();

    auto jsHeapEdgesData = stream_.traceDataCache_->GetConstJsHeapEdgesData();
    EXPECT_EQ(5, jsHeapEdgesData.Types()[0]);
    EXPECT_EQ(25572, jsHeapEdgesData.NameOrIndexs()[0]);
    EXPECT_EQ(1, jsHeapEdgesData.ToNodes()[0]);
    EXPECT_EQ(1, jsHeapEdgesData.FromNodeIds()[0]);
    EXPECT_EQ(1, jsHeapEdgesData.FromNodeIds()[1]);
    EXPECT_EQ(1, jsHeapEdgesData.FromNodeIds()[2]);
    EXPECT_EQ(1, jsHeapEdgesData.FromNodeIds()[3]);
    EXPECT_EQ(1, jsHeapEdgesData.FromNodeIds()[4]);
}

HWTEST_F(JsMemoryTest, timelineParserNodesByJsmemory, TestSize.Level1)
{
    TS_LOGI("test35-3");
    SerializeConfig(ArkTSConfig_HeapType(1));
    HtraceJSMemoryParser htraceJSMemoryParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ProtoReader::BytesView tracePacket(reinterpret_cast<const uint8_t*>(strConfig_.data()), strConfig_.size());
    htraceJSMemoryParser.ParseJSMemoryConfig(tracePacket);

    std::vector<std::string> strResultVec;
    SetTimelineParserNodesByJsmemory(strResultVec);
    std::string strResult1 = strResultVec[0];
    std::string strResult2 = strResultVec[1];
    std::string strResult3 = strResultVec[2];
    std::string strResult4 = strResultVec[3];
    ProtoReader::BytesView tracePacket1(reinterpret_cast<const uint8_t*>(strResult1.data()), strResult1.size());
    ProfilerPluginDataHeader profilerPluginData;
    htraceJSMemoryParser.Parse(tracePacket1, 10000, 0, 0, profilerPluginData);

    ProtoReader::BytesView tracePacket2(reinterpret_cast<const uint8_t*>(strResult2.data()), strResult2.size());
    htraceJSMemoryParser.Parse(tracePacket2, 11000, 0, 0, profilerPluginData);

    ProtoReader::BytesView tracePacket3(reinterpret_cast<const uint8_t*>(strResult3.data()), strResult3.size());
    htraceJSMemoryParser.Parse(tracePacket3, 12000, 0, 0, profilerPluginData);

    ProtoReader::BytesView tracePacket4(reinterpret_cast<const uint8_t*>(strResult4.data()), strResult4.size());
    htraceJSMemoryParser.Parse(tracePacket4, 13000, 0, 0, profilerPluginData);
    htraceJSMemoryParser.Finish();

    auto jsHeapFilesData = stream_.traceDataCache_->GetConstJsHeapFilesData();
    ASSERT_EQ(1, jsHeapFilesData.Size());
    EXPECT_EQ("Timeline", jsHeapFilesData.FilePaths()[0]);
    EXPECT_EQ(10000, jsHeapFilesData.StartTimes()[0]);
    EXPECT_EQ(13000, jsHeapFilesData.EndTimes()[0]);
    auto jsHeapNodesData = stream_.traceDataCache_->GetConstJsHeapNodesData();
    EXPECT_EQ(9, jsHeapNodesData.Types()[0]);
    EXPECT_EQ(25571, jsHeapNodesData.Names()[0]);
    EXPECT_EQ(1, jsHeapNodesData.NodeIds()[0]);
    EXPECT_EQ(0, jsHeapNodesData.SelfSizes()[0]);
    EXPECT_EQ(3575, jsHeapNodesData.EdgeCounts()[0]);
    EXPECT_EQ(0, jsHeapNodesData.TraceNodeIds()[0]);
    EXPECT_EQ(0, jsHeapNodesData.DetachedNess()[0]);
}

HWTEST_F(JsMemoryTest, timelineParserEdgesByJsmemory, TestSize.Level1)
{
    TS_LOGI("test35-4");
    SerializeConfig(ArkTSConfig_HeapType(1));
    HtraceJSMemoryParser htraceJSMemoryParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ProtoReader::BytesView tracePacket(reinterpret_cast<const uint8_t*>(strConfig_.data()), strConfig_.size());
    htraceJSMemoryParser.ParseJSMemoryConfig(tracePacket);

    std::vector<std::string> strResultVec;
    SetTimelineParserEdgesByJsmemory(strResultVec);
    std::string strResult1 = strResultVec[0];
    std::string strResult2 = strResultVec[1];
    std::string strResult3 = strResultVec[2];
    std::string strResult4 = strResultVec[3];
    ProtoReader::BytesView tracePacket1(reinterpret_cast<const uint8_t*>(strResult1.data()), strResult1.size());
    ProfilerPluginDataHeader profilerPluginData;
    htraceJSMemoryParser.Parse(tracePacket1, 10000, 0, 0, profilerPluginData);

    ProtoReader::BytesView tracePacket2(reinterpret_cast<const uint8_t*>(strResult2.data()), strResult2.size());
    htraceJSMemoryParser.Parse(tracePacket2, 11000, 0, 0, profilerPluginData);

    ProtoReader::BytesView tracePacket3(reinterpret_cast<const uint8_t*>(strResult3.data()), strResult3.size());
    htraceJSMemoryParser.Parse(tracePacket3, 12000, 0, 0, profilerPluginData);

    ProtoReader::BytesView tracePacket4(reinterpret_cast<const uint8_t*>(strResult4.data()), strResult4.size());
    htraceJSMemoryParser.Parse(tracePacket4, 13000, 0, 0, profilerPluginData);
    htraceJSMemoryParser.Finish();

    auto jsHeapEdgesData = stream_.traceDataCache_->GetConstJsHeapEdgesData();
    EXPECT_EQ(5, jsHeapEdgesData.Types()[0]);
    EXPECT_EQ(25572, jsHeapEdgesData.NameOrIndexs()[0]);
    EXPECT_EQ(1, jsHeapEdgesData.ToNodes()[0]);
    EXPECT_EQ(1, jsHeapEdgesData.FromNodeIds()[0]);
    EXPECT_EQ(1, jsHeapEdgesData.FromNodeIds()[1]);
    EXPECT_EQ(1, jsHeapEdgesData.FromNodeIds()[2]);
    EXPECT_EQ(1, jsHeapEdgesData.FromNodeIds()[3]);
    EXPECT_EQ(1, jsHeapEdgesData.FromNodeIds()[4]);
}

HWTEST_F(JsMemoryTest, timelineParserSamplesByJsmemory, TestSize.Level1)
{
    TS_LOGI("test35-5");
    SerializeConfig(ArkTSConfig_HeapType(1));
    HtraceJSMemoryParser htraceJSMemoryParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ProtoReader::BytesView tracePacket(reinterpret_cast<const uint8_t*>(strConfig_.data()), strConfig_.size());
    htraceJSMemoryParser.ParseJSMemoryConfig(tracePacket);

    std::vector<std::string> strResultVec;
    SetTimelineParserSamplesByJsmemory(strResultVec);
    std::string strResult1 = strResultVec[0];
    std::string strResult2 = strResultVec[1];
    std::string strResult3 = strResultVec[2];
    std::string strResult4 = strResultVec[3];
    ProtoReader::BytesView tracePacket1(reinterpret_cast<const uint8_t*>(strResult1.data()), strResult1.size());
    ProfilerPluginDataHeader profilerPluginData;
    htraceJSMemoryParser.Parse(tracePacket1, 10000, 0, 0, profilerPluginData);

    ProtoReader::BytesView tracePacket2(reinterpret_cast<const uint8_t*>(strResult2.data()), strResult2.size());
    htraceJSMemoryParser.Parse(tracePacket2, 11000, 0, 0, profilerPluginData);

    ProtoReader::BytesView tracePacket3(reinterpret_cast<const uint8_t*>(strResult3.data()), strResult3.size());
    htraceJSMemoryParser.Parse(tracePacket3, 12000, 0, 0, profilerPluginData);

    ProtoReader::BytesView tracePacket4(reinterpret_cast<const uint8_t*>(strResult4.data()), strResult4.size());
    htraceJSMemoryParser.Parse(tracePacket4, 13000, 0, 0, profilerPluginData);
    htraceJSMemoryParser.Finish();

    auto jsHeapSampleData = stream_.traceDataCache_->GetConstJsHeapSampleData();
    EXPECT_EQ(0, jsHeapSampleData.TimeStampUs()[0]);
    EXPECT_EQ(42570, jsHeapSampleData.LastAssignedIds()[0]);
    EXPECT_EQ(200631, jsHeapSampleData.TimeStampUs()[1]);
    EXPECT_EQ(42571, jsHeapSampleData.LastAssignedIds()[1]);
    EXPECT_EQ(401040, jsHeapSampleData.TimeStampUs()[2]);
    EXPECT_EQ(42572, jsHeapSampleData.LastAssignedIds()[2]);
    EXPECT_EQ(601899, jsHeapSampleData.TimeStampUs()[3]);
    EXPECT_EQ(42573, jsHeapSampleData.LastAssignedIds()[3]);
}

HWTEST_F(JsMemoryTest, timelineParserStringsByJsmemory, TestSize.Level1)
{
    TS_LOGI("test35-6");
    SerializeConfig(ArkTSConfig_HeapType(1));
    HtraceJSMemoryParser htraceJSMemoryParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ProtoReader::BytesView tracePacket(reinterpret_cast<const uint8_t*>(strConfig_.data()), strConfig_.size());
    htraceJSMemoryParser.ParseJSMemoryConfig(tracePacket);

    std::vector<std::string> strResultVec;
    SetTimelineParserStringsByJsmemory(strResultVec);
    std::string strResult1 = strResultVec[0];
    std::string strResult2 = strResultVec[1];
    std::string strResult3 = strResultVec[2];
    std::string strResult4 = strResultVec[3];
    ProtoReader::BytesView tracePacket1(reinterpret_cast<const uint8_t*>(strResult1.data()), strResult1.size());
    ProfilerPluginDataHeader profilerPluginData;
    htraceJSMemoryParser.Parse(tracePacket1, 10000, 0, 0, profilerPluginData);

    ProtoReader::BytesView tracePacket2(reinterpret_cast<const uint8_t*>(strResult2.data()), strResult2.size());
    htraceJSMemoryParser.Parse(tracePacket2, 11000, 0, 0, profilerPluginData);

    ProtoReader::BytesView tracePacket3(reinterpret_cast<const uint8_t*>(strResult3.data()), strResult3.size());
    htraceJSMemoryParser.Parse(tracePacket3, 12000, 0, 0, profilerPluginData);

    ProtoReader::BytesView tracePacket4(reinterpret_cast<const uint8_t*>(strResult4.data()), strResult4.size());
    htraceJSMemoryParser.Parse(tracePacket4, 13000, 0, 0, profilerPluginData);
    htraceJSMemoryParser.Finish();

    auto jsHeapStringData = stream_.traceDataCache_->GetConstJsHeapStringData();
    EXPECT_EQ("<dummy>", jsHeapStringData.Strings()[0]);
    EXPECT_EQ("", jsHeapStringData.Strings()[1]);
    EXPECT_EQ("GC roots", jsHeapStringData.Strings()[2]);
    EXPECT_EQ("TaggedDict[52]", jsHeapStringData.Strings()[3]);
    EXPECT_EQ("JSFunction", jsHeapStringData.Strings()[4]);
}

HWTEST_F(JsMemoryTest, timelineParserTraceFuncInfoByJsmemory, TestSize.Level1)
{
    TS_LOGI("test35-7");
    SerializeConfig(ArkTSConfig_HeapType(1));
    HtraceJSMemoryParser htraceJSMemoryParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ProtoReader::BytesView tracePacket(reinterpret_cast<const uint8_t*>(strConfig_.data()), strConfig_.size());
    htraceJSMemoryParser.ParseJSMemoryConfig(tracePacket);

    std::vector<std::string> strResultVec;
    SetTimelineParserTraceFuncInfoByJsmemory(strResultVec);
    std::string strResult1 = strResultVec[0];
    std::string strResult2 = strResultVec[1];
    std::string strResult3 = strResultVec[2];
    std::string strResult4 = strResultVec[3];
    ProtoReader::BytesView tracePacket1(reinterpret_cast<const uint8_t*>(strResult1.data()), strResult1.size());
    ProfilerPluginDataHeader profilerPluginData;
    htraceJSMemoryParser.Parse(tracePacket1, 10000, 0, 0, profilerPluginData);

    ProtoReader::BytesView tracePacket2(reinterpret_cast<const uint8_t*>(strResult2.data()), strResult2.size());
    htraceJSMemoryParser.Parse(tracePacket2, 11000, 0, 0, profilerPluginData);

    ProtoReader::BytesView tracePacket3(reinterpret_cast<const uint8_t*>(strResult3.data()), strResult3.size());
    htraceJSMemoryParser.Parse(tracePacket3, 12000, 0, 0, profilerPluginData);

    ProtoReader::BytesView tracePacket4(reinterpret_cast<const uint8_t*>(strResult4.data()), strResult4.size());
    htraceJSMemoryParser.Parse(tracePacket4, 13000, 0, 0, profilerPluginData);
    htraceJSMemoryParser.Finish();

    auto jsHeapTraceFuncInfoData = stream_.traceDataCache_->GetConstJsHeapTraceFuncInfoData();
    EXPECT_EQ(0, jsHeapTraceFuncInfoData.FunctionIds()[0]);
    EXPECT_EQ(181, jsHeapTraceFuncInfoData.Names()[0]);
    EXPECT_EQ(1601, jsHeapTraceFuncInfoData.ScriptNames()[0]);
    EXPECT_EQ(0, jsHeapTraceFuncInfoData.ScriptIds()[0]);
    EXPECT_EQ(0, jsHeapTraceFuncInfoData.Lines()[0]);
    EXPECT_EQ(0, jsHeapTraceFuncInfoData.Columns()[0]);
}

HWTEST_F(JsMemoryTest, timelineParserTraceTreeByJsmemory, TestSize.Level1)
{
    TS_LOGI("test35-8");
    SerializeConfig(ArkTSConfig_HeapType(1));
    HtraceJSMemoryParser htraceJSMemoryParser(stream_.traceDataCache_.get(), stream_.streamFilters_.get());
    ProtoReader::BytesView tracePacket(reinterpret_cast<const uint8_t*>(strConfig_.data()), strConfig_.size());
    htraceJSMemoryParser.ParseJSMemoryConfig(tracePacket);

    std::vector<std::string> strResultVec;
    SetTimelineParserTraceTreeByJsmemory(strResultVec);
    std::string strResult1 = strResultVec[0];
    std::string strResult2 = strResultVec[1];
    std::string strResult3 = strResultVec[2];
    std::string strResult4 = strResultVec[3];
    ProtoReader::BytesView tracePacket1(reinterpret_cast<const uint8_t*>(strResult1.data()), strResult1.size());
    ProfilerPluginDataHeader profilerPluginData;
    htraceJSMemoryParser.Parse(tracePacket1, 10000, 0, 0, profilerPluginData);

    ProtoReader::BytesView tracePacket2(reinterpret_cast<const uint8_t*>(strResult2.data()), strResult2.size());
    htraceJSMemoryParser.Parse(tracePacket2, 11000, 0, 0, profilerPluginData);

    ProtoReader::BytesView tracePacket3(reinterpret_cast<const uint8_t*>(strResult3.data()), strResult3.size());
    htraceJSMemoryParser.Parse(tracePacket3, 12000, 0, 0, profilerPluginData);

    ProtoReader::BytesView tracePacket4(reinterpret_cast<const uint8_t*>(strResult4.data()), strResult4.size());
    htraceJSMemoryParser.Parse(tracePacket4, 13000, 0, 0, profilerPluginData);
    htraceJSMemoryParser.Finish();

    auto jsHeapTraceNodeData = stream_.traceDataCache_->GetConstJsHeapTraceNodeData();
    EXPECT_EQ(0, jsHeapTraceNodeData.FunctionInfoIndexs()[0]);
    EXPECT_EQ(53, jsHeapTraceNodeData.Counts()[0]);
    EXPECT_EQ(996, jsHeapTraceNodeData.NodeSizes()[0]);
    EXPECT_EQ(-1, jsHeapTraceNodeData.ParentIds()[0]);
    EXPECT_EQ(1, jsHeapTraceNodeData.FunctionInfoIndexs()[1]);
    EXPECT_EQ(571, jsHeapTraceNodeData.Counts()[1]);
    EXPECT_EQ(26580, jsHeapTraceNodeData.NodeSizes()[1]);
    EXPECT_EQ(1, jsHeapTraceNodeData.ParentIds()[1]);
    EXPECT_EQ(2, jsHeapTraceNodeData.FunctionInfoIndexs()[2]);
    EXPECT_EQ(5, jsHeapTraceNodeData.Counts()[2]);
    EXPECT_EQ(248, jsHeapTraceNodeData.NodeSizes()[2]);
    EXPECT_EQ(1, jsHeapTraceNodeData.ParentIds()[2]);
    EXPECT_EQ(3, jsHeapTraceNodeData.ParentIds()[3]);
    EXPECT_EQ(4, jsHeapTraceNodeData.ParentIds()[4]);
    EXPECT_EQ(10, jsHeapTraceNodeData.FunctionInfoIndexs()[10]);
    EXPECT_EQ(10, jsHeapTraceNodeData.Counts()[10]);
    EXPECT_EQ(348, jsHeapTraceNodeData.NodeSizes()[10]);
    EXPECT_EQ(1, jsHeapTraceNodeData.ParentIds()[10]);
}
} // namespace TraceStreamer
} // namespace SysTuning
