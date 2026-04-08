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
#include "js_heap_snapshot_types.h"
#include "process_filter.h"
#include "stat_filter.h"
#include "unistd.h"
namespace SysTuning {
namespace TraceStreamer {
const int32_t END_POS = 3;
const int32_t CHUNK_POS = 8;
const int32_t PROFILE_POS = 9;
const int32_t END_PROFILE_POS = 2;
const int32_t TIME_MILLI_SECOND = 1000;
const int32_t TIME_MICRO_SECOND = 1000 * 1000;
const std::string JS_MEMORY_INDEX = "{\"params\":{\"chunk\":";
const std::string ARKTS_INDEX = "{\"id\":3, \"result\":{\"profile\":";
PbreaderJSMemoryParser::PbreaderJSMemoryParser(TraceDataCache *dataCache, const TraceStreamerFilters *ctx)
    : EventParserBase(dataCache, ctx),
      jsCpuProfilerParser_(std::make_unique<HtraceJsCpuProfilerParser>(dataCache, ctx)),
      jsHeapSnapshotFilter_(std::make_unique<JsHeapSnapshotFilter>(dataCache, ctx))
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
        jsonns::Sample sample = jMessage.at("samples");
        json filteredSamples = json::array();
        uint32_t firstTimeStamp = INVALID_UINT32;
        uint64_t startTime = traceDataCache_->SplitFileMinTime();
        uint64_t endTime = traceDataCache_->SplitFileMaxTime();
        uint64_t pluginStart = GetPluginStartTime();
        for (size_t i = 0; i < sample.timestampUs.size(); ++i) {
            uint32_t timestampUs = sample.timestampUs[i];
            uint32_t lastAssignedId = sample.lastAssignedIds[i];
            uint64_t timestampNs = static_cast<uint64_t>(timestampUs) * TIME_MILLI_SECOND;
            if (startTime <= (pluginStart + timestampNs) && endTime >= (pluginStart + timestampNs)) {
                if (firstTimeStamp == INVALID_UINT32) {
                    firstTimeStamp = timestampUs;
                }
                filteredSamples.push_back(timestampUs - firstTimeStamp);
                filteredSamples.push_back(lastAssignedId);
                nodeFileId_ = lastAssignedId;
            }
        }
        updatedJson_["samples"] = filteredSamples;
        jsonns::Nodes node = jMessage.at("nodes");
        json filteredNodes = json::array();
        for (size_t i = 0; i < node.names.size(); ++i) {
            selfSizeCount_ += node.selfSizes[i];
            if (nodeFileId_ != INVALID_UINT32 && node.ids[i] <= nodeFileId_) {
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
        updatedJson_["nodes"] = filteredNodes;
        updatedJson_["snapshot"]["node_count"] = nodeCount_;
        jsMemorySplitFileData_ = updatedJson_.dump();
        SerializeToString(profilerPluginData, traceDataCache_->SplitFileMinTime(), traceDataCache_->SplitFileMaxTime());
        nodeCount_ = 0;
        streamFilters_->statFilter_->IncreaseStat(SysTuning::TraceCfg::TRACE_JS_MEMORY,
                                                  SysTuning::TraceCfg::STAT_EVENT_RECEIVED);
    } else {
        selfSizeCount_ += jsHeapSnapshotFilter_->ParseTimeline(fileId_, jMessage);
    }
    jsMemoryString_ = "";
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
    selfSizeCount_ += jsHeapSnapshotFilter_->ParseSnapshot(fileId_, jMessage);
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
