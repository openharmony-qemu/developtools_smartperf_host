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
#include "pbreader_js_memory_parser.h"
#include <dirent.h>
#include <memory>
#include <regex>
#include "clock_filter_ex.h"
#include "fcntl.h"
#include "file.h"
#include "js_heap_config.pbreader.h"
#include "js_heap_result.pbreader.h"
#include "process_filter.h"
#include "stat_filter.h"
#include "unistd.h"
namespace SysTuning {
namespace TraceStreamer {
namespace jsonns {
const int32_t OFFSET_FIRST = 1;
const int32_t OFFSET_SECOND = 2;
const int32_t OFFSET_THIRD = 3;
const int32_t OFFSET_FOURTH = 4;
const int32_t OFFSET_FIFTH = 5;
const int32_t OFFSET_SIXTH = 6;
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
int32_t g_nodesSingleLength = 0;
void from_json(const json &j, Meta &v)
{
    for (size_t i = 0; i < j["node_fields"].size(); i++) {
        v.nodeFields.emplace_back(j["node_fields"][i]);
    }
    g_nodesSingleLength = j["node_fields"].size();
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
    return;
}
void from_json(const json &j, Snapshot &v)
{
    j.at("meta").get_to(v.meta);
    j.at("node_count").get_to(v.nodeCount);
    j.at("edge_count").get_to(v.edgeCount);
    j.at("trace_function_count").get_to(v.traceFunctionCount);
    return;
}
struct Nodes {
    std::vector<uint32_t> types;
    std::vector<uint32_t> names;
    std::vector<uint32_t> ids;
    std::vector<uint32_t> selfSizes;
    std::vector<uint32_t> edgeCounts;
    std::vector<uint32_t> traceNodeIds;
    std::vector<uint32_t> detachedness;
};
std::vector<uint32_t> g_fromNodeIds;
std::vector<uint32_t> g_ids;
void from_json(const json &j, Nodes &v)
{
    int32_t edgeIndex = 0;
    for (size_t i = 0; i < j.size() / g_nodesSingleLength; i++) {
        v.types.emplace_back(j[i * g_nodesSingleLength]);
        v.names.emplace_back(j[i * g_nodesSingleLength + OFFSET_FIRST]);
        v.ids.emplace_back(j[i * g_nodesSingleLength + OFFSET_SECOND]);
        v.selfSizes.emplace_back(j[i * g_nodesSingleLength + OFFSET_THIRD]);
        v.edgeCounts.emplace_back(j[i * g_nodesSingleLength + OFFSET_FOURTH]);
        for (size_t m = edgeIndex; m < edgeIndex + v.edgeCounts.at(i); m++) {
            g_fromNodeIds.emplace_back(j[i * g_nodesSingleLength + OFFSET_SECOND]);
        }
        edgeIndex += v.edgeCounts.at(i);
        v.traceNodeIds.emplace_back(j[i * g_nodesSingleLength + OFFSET_FIFTH]);
        v.detachedness.emplace_back(j[i * g_nodesSingleLength + OFFSET_SIXTH]);
    }
    for (size_t m = 0; m < j.size(); m++) {
        g_ids.emplace_back(j[m]);
    }
}
struct Edges {
    std::vector<uint32_t> types;
    std::vector<uint32_t> nameOrIndexes;
    std::vector<uint32_t> toNodes;
    std::vector<uint32_t> fromNodeIds;
    std::vector<uint32_t> toNodeIds;
};
const int32_t EDGES_SINGLE_LENGTH = 3;
void from_json(const json &j, Edges &v)
{
    v.fromNodeIds = g_fromNodeIds;
    for (size_t i = 0; i < j.size() / EDGES_SINGLE_LENGTH; i++) {
        v.types.emplace_back(j[i * EDGES_SINGLE_LENGTH]);
        v.nameOrIndexes.emplace_back(j[i * EDGES_SINGLE_LENGTH + OFFSET_FIRST]);
        v.toNodes.emplace_back(j[i * EDGES_SINGLE_LENGTH + OFFSET_SECOND]);
        v.toNodeIds.emplace_back(g_ids[v.toNodes[i] + OFFSET_SECOND]);
    }
    return;
}
struct Location {
    std::vector<uint32_t> objectIndexes;
    std::vector<uint32_t> scriptIds;
    std::vector<uint32_t> lines;
    std::vector<uint32_t> columns;
};
const int32_t LOCATION_SINGLE_LENGTH = 4;
void from_json(const json &j, Location &v)
{
    for (size_t i = 0; i < j.size() / LOCATION_SINGLE_LENGTH; i++) {
        v.objectIndexes.emplace_back(j[i * LOCATION_SINGLE_LENGTH]);
        v.scriptIds.emplace_back(j[i * LOCATION_SINGLE_LENGTH + OFFSET_FIRST]);
        v.lines.emplace_back(j[i * LOCATION_SINGLE_LENGTH + OFFSET_SECOND]);
        v.columns.emplace_back(j[i * LOCATION_SINGLE_LENGTH + OFFSET_THIRD]);
    }
}
struct Sample {
    std::vector<uint32_t> timestampUs;
    std::vector<uint32_t> lastAssignedIds;
};
const int32_t SAMPLE_SINGLE_LENGTH = 2;
void from_json(const json &j, Sample &v)
{
    for (size_t i = 0; i < j.size() / SAMPLE_SINGLE_LENGTH; i++) {
        v.timestampUs.emplace_back(j[i * SAMPLE_SINGLE_LENGTH]);
        v.lastAssignedIds.emplace_back(j[i * SAMPLE_SINGLE_LENGTH + OFFSET_FIRST]);
    }
}
struct Strings {
    std::vector<std::string> strings;
};
void from_json(const json &j, Strings &v)
{
    for (size_t i = 0; i < j.size(); i++) {
        v.strings.emplace_back(j[i]);
    }
}
struct TraceFuncInfo {
    std::vector<uint32_t> functionIds;
    std::vector<uint32_t> names;
    std::vector<uint32_t> scriptNames;
    std::vector<uint32_t> scriptIds;
    std::vector<uint32_t> lines;
    std::vector<uint32_t> columns;
};
const int32_t TRACE_FUNC_INFO_SINGLE_LENGTH = 6;
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
    ParentFunc()
    {
        id = 0;
        functionInfoIndex = 0;
        count = 0;
        size = 0;
    }
};
class TraceParser {
public:
    void parse_trace_node(const json &array,
                          std::vector<std::unique_ptr<ParentFunc>> &funcList,
                          ParentFunc *parent = nullptr)
    {
        int32_t singleLength = 5;
        int32_t functionCount = array.size() / singleLength;
        for (int32_t i = 0; i < functionCount; ++i) {
            auto item = std::make_unique<ParentFunc>();
            if (parent != nullptr) {
                item->parent = parent;
            }
            item->id = array[i * singleLength];
            item->functionInfoIndex = array[i * singleLength + OFFSET_FIRST];
            item->count = array[i * singleLength + OFFSET_SECOND];
            item->size = array[i * singleLength + OFFSET_THIRD];
            auto childrenArray = array[i * singleLength + OFFSET_FOURTH];
            funcList.push_back(std::move(item));
            if (!childrenArray.empty()) {
                parse_trace_node(childrenArray, funcList, funcList.back().get());
            }
        }
    }
};
void from_json(const json &j, TraceTree &v)
{
    std::vector<std::unique_ptr<ParentFunc>> funcList;
    TraceParser parser;
    parser.parse_trace_node(j, funcList);
    for (auto &func : funcList) {
        v.ids.emplace_back(func->id);
        v.functionInfoIndexes.emplace_back(func->functionInfoIndex);
        v.counts.emplace_back(func->count);
        v.sizes.emplace_back(func->size);
        v.parentIds.emplace_back(func->parent ? func->parent->id : std::numeric_limits<uint32_t>::max());
    }
}
} // namespace jsonns
const int32_t END_POS = 3;
const int32_t CHUNK_POS = 8;
const int32_t PROFILE_POS = 9;
const int32_t END_PROFILE_POS = 2;
const int32_t TIME_MILLI_SECOND = 1000;
const int32_t TIME_MICRO_SECOND = 1000 * 1000;
const std::string JS_MEMORY_INDEX = "{\"params\":{\"chunk\":";
const std::string ARKTS_INDEX = "{\"id\":3, \"result\":{\"profile\":";
PbreaderJSMemoryParser::PbreaderJSMemoryParser(TraceDataCache *dataCache, const TraceStreamerFilters *ctx)
    : EventParserBase(dataCache, ctx), jsCpuProfilerParser_(std::make_unique<HtraceJsCpuProfilerParser>(dataCache, ctx))
{
    // Delete files in the executable file path that fileName contain the string "ts_tmp. jsmemory_snapshot"
    DIR *dir = opendir(".");
    if (dir != nullptr) {
        dirent *entry;
        while ((entry = readdir(dir)) != nullptr) {
            std::string filename(entry->d_name);
            if (filename.find(tmpJsMemorySnapshotData_) != std::string::npos) {
                (void)std::remove(filename.c_str());
            }
        }
        closedir(dir);
    }
}
PbreaderJSMemoryParser::~PbreaderJSMemoryParser()
{
    TS_LOGI("arkts-plugin ts MIN:%llu, MAX:%llu", static_cast<unsigned long long>(GetPluginStartTime()),
            static_cast<unsigned long long>(GetPluginEndTime()));
}
void PbreaderJSMemoryParser::ParseJSMemoryConfig(ProtoReader::BytesView tracePacket)
{
    ProtoReader::ArkTSConfig_Reader jsHeapConfig(tracePacket.data_, tracePacket.size_);
    JsConfigRow row;
    row.pid = jsHeapConfig.pid();
    type_ = jsHeapConfig.type();
    row.type = jsHeapConfig.type();
    row.interval = jsHeapConfig.interval();
    row.captureNumericValue = jsHeapConfig.capture_numeric_value() ? 1 : 0;
    row.trackAllocation = jsHeapConfig.track_allocations() ? 1 : 0;
    row.cpuProfiler = jsHeapConfig.enable_cpu_profiler() ? 1 : 0;
    hasCpuProfiler_ = row.cpuProfiler ? true : false;
    row.cpuProfilerInterval = jsHeapConfig.cpu_profiler_interval();
    (void)traceDataCache_->GetJsConfigData()->AppendNewData(row);
}
struct timespec PbreaderJSMemoryParser::TimeToTimespec(uint64_t timeMs)
{
    timeMs = timeMs / TIME_MILLI_SECOND;
    timespec ts;
    ts.tv_sec = timeMs / TIME_MICRO_SECOND;
    ts.tv_nsec = (timeMs % TIME_MICRO_SECOND) * TIME_MILLI_SECOND;
    return ts;
}
void PbreaderJSMemoryParser::SerializeToString(const ProfilerPluginDataHeader &profilerPluginData,
                                               uint64_t startTime,
                                               uint64_t endTime)
{
    startTime = streamFilters_->clockFilter_->Convert(TS_CLOCK_BOOTTIME, startTime, TS_CLOCK_REALTIME);
    endTime = streamFilters_->clockFilter_->Convert(TS_CLOCK_BOOTTIME, endTime, TS_CLOCK_REALTIME);
    ProfilerPluginData profilerPluginDataResult;
    ArkTSResult jsHeapResult;
    profilerPluginDataResult.set_name("arkts-plugin");
    profilerPluginDataResult.set_status(profilerPluginData.status);
    profilerPluginDataResult.set_clock_id(::ProfilerPluginData_ClockId(profilerPluginData.clockId));
    profilerPluginDataResult.set_version("1.01");
    profilerPluginDataResult.set_sample_interval(profilerPluginData.sampleInterval);
    if (!jsMemorySplitFileData_.size() && !cpuProfilerSplitFileData_.size()) {
        return;
    }
    if (type_ == ProtoReader::ArkTSConfig_HeapType::ArkTSConfig_HeapType_SNAPSHOT) {
        SerializeSnapshotData(profilerPluginDataResult, jsHeapResult);
    } else if (type_ == ProtoReader::ArkTSConfig_HeapType::ArkTSConfig_HeapType_TIMELINE) {
        SerializeTimelineData(startTime, endTime, profilerPluginDataResult, jsHeapResult);
    }
    if (hasCpuProfiler_) {
        SerializeCpuProfilerData(startTime, endTime, profilerPluginDataResult, jsHeapResult);
    }
}
void PbreaderJSMemoryParser::SerializeSnapshotData(ProfilerPluginData &profilerPluginDataResult,
                                                   ArkTSResult &jsHeapResult)
{
    if (curTypeIsCpuProfile_) {
        curTypeIsCpuProfile_ = false;
        return;
    }
    jsHeapResult.set_result(JS_MEMORY_INDEX + snapShotData_.snapshotData + "}}");
    snapShotData_.startTime =
        streamFilters_->clockFilter_->Convert(TS_CLOCK_BOOTTIME, snapShotData_.startTime, TS_CLOCK_REALTIME);
    snapShotData_.endTime =
        streamFilters_->clockFilter_->Convert(TS_CLOCK_BOOTTIME, snapShotData_.endTime, TS_CLOCK_REALTIME);
    timespec startTs = TimeToTimespec(snapShotData_.startTime);
    profilerPluginDataResult.set_tv_sec(startTs.tv_sec);
    profilerPluginDataResult.set_tv_nsec(startTs.tv_nsec);
    jsHeapResult.SerializeToString(&arkTsSplitFileDataResult_);
    profilerPluginDataResult.set_data(arkTsSplitFileDataResult_);
    std::string profilerArktsData = "";
    profilerPluginDataResult.SerializeToString(&profilerArktsData);
    std::string endString = "";
    jsHeapResult.set_result(snapshotEnd_);
    timespec endTs = TimeToTimespec(snapShotData_.endTime);
    profilerPluginDataResult.set_tv_sec(endTs.tv_sec);
    profilerPluginDataResult.set_tv_nsec(endTs.tv_nsec);
    jsHeapResult.SerializeToString(&endString);
    profilerPluginDataResult.set_data(endString);
    std::string arkTsEndString = "";
    profilerPluginDataResult.SerializeToString(&arkTsEndString);
    std::string bufflen(sizeof(uint32_t), '\0');
    uint32_t profilerArktsDataSize = profilerArktsData.size();
    memcpy_s(&bufflen[0], sizeof(uint32_t), &profilerArktsDataSize, sizeof(uint32_t));
    std::string endLen(sizeof(uint32_t), '\0');
    profilerArktsDataSize = arkTsEndString.size();
    memcpy_s(&endLen[0], sizeof(uint32_t), &profilerArktsDataSize, sizeof(uint32_t));
    profilerArktsData_ += bufflen + profilerArktsData + endLen + arkTsEndString;
}
void PbreaderJSMemoryParser::SerializeTimelineData(uint64_t startTime,
                                                   uint64_t endTime,
                                                   ProfilerPluginData &profilerPluginDataResult,
                                                   ArkTSResult &jsHeapResult)
{
    std::string startString = "";
    jsHeapResult.set_result(snapshotEnd_);
    timespec startTs = TimeToTimespec(startTime);
    profilerPluginDataResult.set_tv_sec(startTs.tv_sec);
    profilerPluginDataResult.set_tv_nsec(startTs.tv_nsec);
    jsHeapResult.SerializeToString(&startString);
    profilerPluginDataResult.set_data(startString);
    std::string timelineStartString = "";
    profilerPluginDataResult.SerializeToString(&timelineStartString);
    jsHeapResult.set_result(JS_MEMORY_INDEX + jsMemorySplitFileData_ + "}}");
    jsHeapResult.SerializeToString(&arkTsSplitFileDataResult_);
    profilerPluginDataResult.set_data(arkTsSplitFileDataResult_);
    std::string profilerArktsData = "";
    profilerPluginDataResult.SerializeToString(&profilerArktsData);
    std::string endString = "";
    jsHeapResult.set_result(timeLineEnd_);
    timespec endTs = TimeToTimespec(endTime);
    profilerPluginDataResult.set_tv_sec(endTs.tv_sec);
    profilerPluginDataResult.set_tv_nsec(endTs.tv_nsec);
    jsHeapResult.SerializeToString(&endString);
    profilerPluginDataResult.set_data(endString);
    std::string timelineEndString = "";
    profilerPluginDataResult.SerializeToString(&timelineEndString);
    std::string startLen(sizeof(uint32_t), '\0');
    uint32_t size = timelineStartString.size();
    memcpy_s(&startLen[0], sizeof(uint32_t), &size, sizeof(uint32_t));
    std::string bufflen(sizeof(uint32_t), '\0');
    size = profilerArktsData.size();
    memcpy_s(&bufflen[0], sizeof(uint32_t), &size, sizeof(uint32_t));
    std::string endLen(sizeof(uint32_t), '\0');
    size = timelineEndString.size();
    memcpy_s(&endLen[0], sizeof(uint32_t), &size, sizeof(uint32_t));
    profilerArktsData_ = startLen + timelineStartString + bufflen + profilerArktsData + endLen + timelineEndString;
}
void PbreaderJSMemoryParser::SerializeCpuProfilerData(uint64_t startTime,
                                                      uint64_t endTime,
                                                      ProfilerPluginData &profilerPluginDataResult,
                                                      ArkTSResult &jsHeapResult)
{
    std::string startString = "";
    jsHeapResult.set_result(jsCpuProfilerStart_);
    timespec startTs = TimeToTimespec(startTime);
    profilerPluginDataResult.set_tv_sec(startTs.tv_sec);
    profilerPluginDataResult.set_tv_nsec(startTs.tv_nsec);
    jsHeapResult.SerializeToString(&startString);
    profilerPluginDataResult.set_data(startString);
    std::string arkTsStartString = "";
    profilerPluginDataResult.SerializeToString(&arkTsStartString);
    jsHeapResult.set_result(ARKTS_INDEX + cpuProfilerSplitFileData_ + "}\"");
    jsHeapResult.SerializeToString(&arkTsSplitFileDataResult_);
    profilerPluginDataResult.set_data(arkTsSplitFileDataResult_);
    timespec endTs = TimeToTimespec(endTime);
    profilerPluginDataResult.set_tv_sec(endTs.tv_sec);
    profilerPluginDataResult.set_tv_nsec(endTs.tv_nsec);
    std::string profilerArktsData = "";
    profilerPluginDataResult.SerializeToString(&profilerArktsData);
    std::string startLen(sizeof(uint32_t), '\0');
    uint32_t size = arkTsStartString.size();
    memcpy_s(&startLen[0], sizeof(uint32_t), &size, sizeof(uint32_t));
    std::string bufflen(sizeof(uint32_t), '\0');
    size = profilerArktsData.size();
    memcpy_s(&bufflen[0], sizeof(uint32_t), &size, sizeof(uint32_t));
    profilerArktsData_ += startLen + arkTsStartString + bufflen + profilerArktsData;
}
void PbreaderJSMemoryParser::ParseSnapshotOrTimeLineEnd(const std::string &result,
                                                        ProtoReader::BytesView &tracePacket,
                                                        ProfilerPluginDataHeader &profilerPluginData,
                                                        uint64_t ts)
{
    std::string fileName = "";
    if (type_ == ProtoReader::ArkTSConfig_HeapType::ArkTSConfig_HeapType_SNAPSHOT) {
        fileName = "Snapshot" + std::to_string(fileId_);
        ParseSnapshot(tracePacket, profilerPluginData, jsMemoryString_, ts);
    } else if (type_ == ProtoReader::ArkTSConfig_HeapType::ArkTSConfig_HeapType_TIMELINE) {
        if (result == snapshotEnd_) {
            ts = streamFilters_->clockFilter_->ToPrimaryTraceTime(TS_CLOCK_REALTIME, ts);
            UpdatePluginTimeRange(TS_CLOCK_REALTIME, ts, ts);
            startTime_ = ts;
            return;
        }
        fileName = "Timeline";
        ParseTimeLine(profilerPluginData, jsMemoryString_);
    }
    ts = streamFilters_->clockFilter_->ToPrimaryTraceTime(TS_CLOCK_REALTIME, ts);
    UpdatePluginTimeRange(TS_CLOCK_REALTIME, ts, ts);
    if (traceDataCache_->isSplitFile_ && startTime_ >= traceDataCache_->SplitFileMinTime() &&
        ts <= traceDataCache_->SplitFileMaxTime()) {
        jsMemorySplitFileData_ = tracePacket.ToStdString();
    }
    if (!traceDataCache_->isSplitFile_) {
        (void)traceDataCache_->GetJsHeapFilesData()->AppendNewData(fileId_, fileName, startTime_, ts, selfSizeCount_);
    }
    selfSizeCount_ = 0;
    fileId_++;
    isFirst_ = true;
}
void PbreaderJSMemoryParser::ParseJsCpuProfiler(const std::string &result,
                                                ProfilerPluginDataHeader &profilerPluginData,
                                                uint64_t ts)
{
    auto jsCpuProfilerPos = result.find("profile");
    if (jsCpuProfilerPos == std::string::npos) {
        return;
    }
    curTypeIsCpuProfile_ = true;
    auto jsCpuProfilerString =
        result.substr(jsCpuProfilerPos + PROFILE_POS, result.size() - jsCpuProfilerPos - PROFILE_POS - END_PROFILE_POS);

    ts = streamFilters_->clockFilter_->ToPrimaryTraceTime(TS_CLOCK_REALTIME, ts);
    UpdatePluginTimeRange(TS_CLOCK_REALTIME, ts, ts);
    if (enableFileSave_) {
        auto fd = base::OpenFile(tmpJsCpuProfilerData_ + jsCpuProFiler, O_CREAT | O_RDWR, TS_PERMISSION_RW);
        if (!fd) {
            fprintf(stdout, "Failed to create file: %s", jsCpuProFiler.c_str());
            exit(-1);
        }
        (void)ftruncate(fd, 0);
        (void)write(fd, jsCpuProfilerString.data(), jsCpuProfilerString.size());
        close(fd);
        fd = 0;
    }
    jsCpuProfilerParser_->ParseJsCpuProfiler(jsCpuProfilerString, traceDataCache_->SplitFileMinTime(),
                                             traceDataCache_->SplitFileMaxTime());
    if (traceDataCache_->isSplitFile_) {
        cpuProfilerSplitFileData_ = jsCpuProfilerParser_->GetUpdateJson().dump();
        SerializeToString(profilerPluginData, traceDataCache_->SplitFileMinTime(), traceDataCache_->SplitFileMaxTime());
    }
}
void PbreaderJSMemoryParser::Parse(ProtoReader::BytesView tracePacket,
                                   uint64_t ts,
                                   uint64_t startTime,
                                   uint64_t endTime,
                                   ProfilerPluginDataHeader profilerPluginData)
{
    ProtoReader::ArkTSResult_Reader jsHeapResult(tracePacket.data_, tracePacket.size_);
    auto result = jsHeapResult.result().ToStdString();
    if (result == snapshotEnd_ || result == timeLineEnd_) {
        ParseSnapshotOrTimeLineEnd(result, tracePacket, profilerPluginData, ts);
        return;
    } else if (cpuTimeFirst_ && result == jsCpuProfilerStart_) {
        ts = streamFilters_->clockFilter_->ToPrimaryTraceTime(TS_CLOCK_REALTIME, ts);
        UpdatePluginTimeRange(TS_CLOCK_REALTIME, ts, ts);
        startTime_ = ts;
        cpuTimeFirst_ = false;
    }
    auto pos = result.find("chunk");
    if (pos != std::string::npos) {
        if (isFirst_ && type_ == ProtoReader::ArkTSConfig_HeapType::ArkTSConfig_HeapType_SNAPSHOT) {
            ts = streamFilters_->clockFilter_->ToPrimaryTraceTime(TS_CLOCK_REALTIME, ts);
            UpdatePluginTimeRange(TS_CLOCK_REALTIME, ts, ts);
            startTime_ = ts;
            isFirst_ = false;
        }
        auto jMessage = json::parse(result);
        if (jMessage.contains("params") && jMessage["params"].contains("chunk")) {
            if (jMessage["params"]["chunk"].is_string()) {
                jsMemoryString_ += jMessage["params"]["chunk"];
            } else {
                jsMemoryString_ += jMessage["params"]["chunk"].dump();
            }
        }
        curTypeIsCpuProfile_ = false;
    } else {
        ParseJsCpuProfiler(result, profilerPluginData, ts);
    }
}
void PbreaderJSMemoryParser::ParseTimeLine(ProfilerPluginDataHeader &profilerPluginData, const std::string &jsonString)
{
    if (enableFileSave_) {
        (void)write(jsFileId_, jsonString.data(), jsonString.size());
    }
    json jMessage = json::parse(jsonString);
    if (traceDataCache_->isSplitFile_) {
        for (auto &item : jMessage.items()) {
            if (item.key() != "samples" && item.key() != "nodes") {
                updatedJson_[item.key()] = item.value();
            }
        }
    }
    ParserJSSnapInfo(fileId_, jMessage);
    ParseSample(fileId_, jMessage, traceDataCache_->SplitFileMinTime(), traceDataCache_->SplitFileMaxTime(),
                traceDataCache_->isSplitFile_);
    ParseNodes(fileId_, jMessage, traceDataCache_->SplitFileMinTime(), traceDataCache_->isSplitFile_);
    ParseEdges(fileId_, jMessage);
    ParseLocation(fileId_, jMessage);
    ParseString(fileId_, jMessage);
    ParseTraceFuncInfo(fileId_, jMessage);
    ParseTraceNode(fileId_, jMessage);
    if (traceDataCache_->isSplitFile_) {
        updatedJson_["snapshot"]["node_count"] = nodeCount_;
        jsMemorySplitFileData_ = updatedJson_.dump();
        SerializeToString(profilerPluginData, traceDataCache_->SplitFileMinTime(), traceDataCache_->SplitFileMaxTime());
        nodeCount_ = 0;
    }
    jsMemoryString_ = "";
    streamFilters_->statFilter_->IncreaseStat(TRACE_JS_MEMORY, STAT_EVENT_RECEIVED);
    return;
}
void PbreaderJSMemoryParser::ParserSnapInfo(int32_t fileId,
                                            const std::string &key,
                                            const std::vector<std::vector<std::string>> &types)
{
    if (traceDataCache_->isSplitFile_) {
        return;
    }
    for (size_t m = 0; m < types[0].size(); ++m) {
        (void)traceDataCache_->GetJsHeapInfoData()->AppendNewData(fileId, key, 0, std::numeric_limits<uint32_t>::max(),
                                                                  types[0][m]);
    }
    for (size_t i = 1; i < types.size(); ++i) {
        (void)traceDataCache_->GetJsHeapInfoData()->AppendNewData(fileId, key, 1, std::numeric_limits<uint32_t>::max(),
                                                                  types[i][0]);
    }
    return;
}
const std::string NODE_TYPES = "node_types";
const std::string EDGE_TYPES = "edge_types";
void PbreaderJSMemoryParser::ParserJSSnapInfo(int32_t fileId, const json &jMessage)
{
    jsonns::Snapshot snapshot = jMessage.at("snapshot");
    ParserSnapInfo(fileId, NODE_TYPES, snapshot.meta.nodeTypes);
    ParserSnapInfo(fileId, EDGE_TYPES, snapshot.meta.edgeTypes);
    // Ensure successful update of g_nodesSingleLength
    if (traceDataCache_->isSplitFile_) {
        return;
    }
    auto nodeCount = snapshot.nodeCount;
    auto edgeCount = snapshot.edgeCount;
    auto traceFuncCount = snapshot.traceFunctionCount;
    (void)traceDataCache_->GetJsHeapInfoData()->AppendNewData(fileId, "node_count", 0, nodeCount, "");
    (void)traceDataCache_->GetJsHeapInfoData()->AppendNewData(fileId, "edge_count", 0, edgeCount, "");
    (void)traceDataCache_->GetJsHeapInfoData()->AppendNewData(fileId, "trace_function_count", 0, traceFuncCount, "");
    return;
}
void PbreaderJSMemoryParser::ParseNodes(int32_t fileId, const json &jMessage, uint64_t endTime, bool isSplitFile)
{
    json filteredNodes = nlohmann::json::array();
    jsonns::Nodes node = jMessage.at("nodes");
    for (size_t i = 0; i < node.names.size(); ++i) {
        if (!isSplitFile) {
            JsHeapNodesRow row;
            row.fileId = fileId;
            row.nodeIndex = i;
            row.type = node.types[i];
            row.name = node.names[i];
            row.id = node.ids[i];
            row.selfSize = node.selfSizes[i];
            row.edgeCount = node.edgeCounts[i];
            row.traceNodeId = node.traceNodeIds[i];
            row.detachedNess = node.detachedness[i];
            (void)traceDataCache_->GetJsHeapNodesData()->AppendNewData(row);
        }
        selfSizeCount_ += node.selfSizes[i];
        if (isSplitFile && nodeFileId_ != INVALID_UINT32 && node.ids[i] <= nodeFileId_) {
            filteredNodes.push_back(node.types[i]);
            filteredNodes.push_back(node.names[i]);
            filteredNodes.push_back(node.ids[i]);
            filteredNodes.push_back(node.selfSizes[i]);
            filteredNodes.push_back(node.edgeCounts[i]);
            filteredNodes.push_back(node.traceNodeIds[i]);
            filteredNodes.push_back(node.detachedness[i]);
            nodeCount_++;
        }
    }
    if (isSplitFile) {
        updatedJson_["nodes"] = filteredNodes;
    }
    return;
}
void PbreaderJSMemoryParser::ParseEdges(int32_t fileId, const json &jMessage)
{
    if (traceDataCache_->isSplitFile_) {
        return;
    }
    jsonns::Edges edge = jMessage.at("edges");
    JsHeapEdgesRow row;
    row.fileId = fileId;
    for (size_t i = 0; i < edge.types.size(); ++i) {
        row.edgeIndex = i;
        row.type = edge.types[i];
        row.nameOrIndex = edge.nameOrIndexes[i];
        row.toNode = edge.toNodes[i];
        row.fromNodeId = edge.fromNodeIds[i];
        row.toNodeId = edge.toNodeIds[i];
        (void)traceDataCache_->GetJsHeapEdgesData()->AppendNewData(row);
    }
    return;
}
void PbreaderJSMemoryParser::ParseLocation(int32_t fileId, const json &jMessage)
{
    if (traceDataCache_->isSplitFile_) {
        return;
    }
    jsonns::Location location = jMessage.at("locations");
    for (size_t i = 0; i < location.columns.size(); ++i) {
        auto objectIndex = location.objectIndexes[i];
        auto scriptId = location.scriptIds[i];
        auto line = location.lines[i];
        auto column = location.columns[i];
        (void)traceDataCache_->GetJsHeapLocationData()->AppendNewData(fileId, objectIndex, scriptId, line, column);
    }
    return;
}
void PbreaderJSMemoryParser::ParseSample(int32_t fileId,
                                         const json &jMessage,
                                         uint64_t startTime,
                                         uint64_t endTime,
                                         bool isSplitFile)
{
    json filteredSamples = nlohmann::json::array();
    jsonns::Sample sample = jMessage.at("samples");
    uint32_t firstTimeStamp = INVALID_UINT32;
    for (size_t i = 0; i < sample.timestampUs.size(); ++i) {
        auto timestampUs = sample.timestampUs[i];
        auto lastAssignedId = sample.lastAssignedIds[i];
        if (!isSplitFile) {
            (void)traceDataCache_->GetJsHeapSampleData()->AppendNewData(fileId, timestampUs, lastAssignedId);
        }
        uint64_t timestampNs = (uint64_t)timestampUs * 1000;
        if (isSplitFile && startTime <= (GetPluginStartTime() + timestampNs) &&
            endTime >= (GetPluginStartTime() + timestampNs)) {
            if (firstTimeStamp == INVALID_UINT32) {
                firstTimeStamp = timestampUs;
            }
            filteredSamples.push_back(timestampUs - firstTimeStamp);
            filteredSamples.push_back(lastAssignedId);
            nodeFileId_ = lastAssignedId;
        }
    }
    if (isSplitFile) {
        updatedJson_["samples"] = filteredSamples;
    }
    return;
}
void PbreaderJSMemoryParser::ParseString(int32_t fileId, const json &jMessage)
{
    if (traceDataCache_->isSplitFile_) {
        return;
    }
    jsonns::Strings string = jMessage.at("strings");
    for (size_t i = 0; i < string.strings.size(); ++i) {
        (void)traceDataCache_->GetJsHeapStringData()->AppendNewData(fileId, i, string.strings[i]);
    }
    return;
}
void PbreaderJSMemoryParser::ParseTraceFuncInfo(int32_t fileId, const json &jMessage)
{
    if (traceDataCache_->isSplitFile_) {
        return;
    }
    jsonns::TraceFuncInfo traceFuncInfo = jMessage.at("trace_function_infos");
    JsHeapTraceFuncRow row;
    row.fileId = fileId;
    for (size_t i = 0; i < traceFuncInfo.functionIds.size(); ++i) {
        row.functionIndex = i;
        row.functionId = traceFuncInfo.functionIds[i];
        row.name = traceFuncInfo.names[i];
        row.scriptName = traceFuncInfo.scriptNames[i];
        row.scriptId = traceFuncInfo.scriptIds[i];
        row.line = traceFuncInfo.lines[i];
        row.column = traceFuncInfo.columns[i];
        (void)traceDataCache_->GetJsHeapTraceFuncInfoData()->AppendNewData(row);
    }
    return;
}
void PbreaderJSMemoryParser::ParseTraceNode(int32_t fileId, const json &jMessage)
{
    if (traceDataCache_->isSplitFile_) {
        return;
    }
    JsHeapTraceNodeRow row;
    row.fileId = fileId;
    jsonns::TraceTree traceTree = jMessage.at("trace_tree");
    for (size_t i = 0; i < traceTree.ids.size(); ++i) {
        row.traceNodeId = traceTree.ids[i];
        row.functionInfoIndex = traceTree.functionInfoIndexes[i];
        row.count = traceTree.counts[i];
        row.size = traceTree.sizes[i];
        row.parentId = traceTree.parentIds[i];
        (void)traceDataCache_->GetJsHeapTraceNodeData()->AppendNewData(row);
    }
    return;
}
void PbreaderJSMemoryParser::ParseSnapshot(ProtoReader::BytesView &tracePacket,
                                           ProfilerPluginDataHeader &profilerPluginData,
                                           const std::string &jsonString,
                                           uint64_t &ts)
{
    if (enableFileSave_) {
        if (jsFileId_) {
            close(jsFileId_);
            jsFileId_ = 0;
            if (access(tmpJsMemoryTimelineData_.c_str(), F_OK) == 0) {
                (void)remove(tmpJsMemoryTimelineData_.c_str());
            }
        }
        jsFileId_ = base::OpenFile(tmpJsMemorySnapshotData_ + "_" + base::number(fileId_) + jsSnapshotFileTail,
                                   O_CREAT | O_RDWR, TS_PERMISSION_RW);
        if (!jsFileId_) {
            fprintf(stdout, "Failed to create file: %s", jsSnapshotFileTail.c_str());
            exit(-1);
        }
        (void)ftruncate(jsFileId_, 0);
        (void)write(jsFileId_, jsonString.data(), jsonString.size());
        close(jsFileId_);
        jsFileId_ = 0;
        return;
    }
    json jMessage = json::parse(jsonString);
    ParserJSSnapInfo(fileId_, jMessage);
    ParseNodes(fileId_, jMessage, INVALID_UINT64, false);
    ParseEdges(fileId_, jMessage);
    ParseLocation(fileId_, jMessage);
    ParseSample(fileId_, jMessage, INVALID_UINT64, INVALID_UINT64, false);
    ParseString(fileId_, jMessage);
    ParseTraceFuncInfo(fileId_, jMessage);
    ParseTraceNode(fileId_, jMessage);
    if (traceDataCache_->isSplitFile_) {
        ts = streamFilters_->clockFilter_->ToPrimaryTraceTime(TS_CLOCK_REALTIME, ts);
        if (startTime_ >= traceDataCache_->SplitFileMinTime() && ts <= traceDataCache_->SplitFileMaxTime()) {
            snapShotData_.startTime = startTime_;
            snapShotData_.endTime = ts;
            snapShotData_.snapshotData = jsonString;
            jsMemorySplitFileData_ = tracePacket.ToStdString();
            SerializeToString(profilerPluginData, traceDataCache_->SplitFileMinTime(),
                              traceDataCache_->SplitFileMaxTime());
        }
    }
    jsMemoryString_ = "";
    streamFilters_->statFilter_->IncreaseStat(TRACE_JS_MEMORY, STAT_EVENT_RECEIVED);
    return;
}
void PbreaderJSMemoryParser::EnableSaveFile(bool enable)
{
    enableFileSave_ = enable;
    if (enable) {
        jsFileId_ = base::OpenFile(tmpJsMemoryTimelineData_, O_CREAT | O_RDWR, TS_PERMISSION_RW);
        if (!jsFileId_) {
            fprintf(stdout, "Failed to create file: %s", tmpJsMemoryTimelineData_.c_str());
            exit(-1);
        }
        (void)ftruncate(jsFileId_, 0);
    } else {
        if (jsFileId_) {
            close(jsFileId_);
            jsFileId_ = 0;
        }
        if (access(tmpJsMemoryTimelineData_.c_str(), F_OK) == 0) {
            (void)remove(tmpJsMemoryTimelineData_.c_str());
        }
    }
}
void PbreaderJSMemoryParser::Finish()
{
    traceDataCache_->MixTraceTime(GetPluginStartTime(), GetPluginEndTime());
    // In the case of incomplete data at the end of the file, jsMemoryString_ has an initial value when cutting data.
    // This part of the data should be discarded
    jsMemoryString_ = "";
    return;
}
} // namespace TraceStreamer
} // namespace SysTuning
