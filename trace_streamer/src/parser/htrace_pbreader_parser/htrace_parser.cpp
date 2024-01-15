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

#include "htrace_parser.h"
#include <unistd.h>
#include "app_start_filter.h"
#include "binder_filter.h"
#include "common_types.pbreader.h"
#include "cpu_filter.h"
#include "data_area.h"
#include "ftrace_event.pbreader.h"
#include "log.h"
#include "memory_plugin_result.pbreader.h"
#include "stat_filter.h"
#include "trace_plugin_result.pbreader.h"
#if IS_WASM
#include "../rpc/wasm_func.h"
#endif
namespace SysTuning {
namespace TraceStreamer {
HtraceParser::HtraceParser(TraceDataCache* dataCache, const TraceStreamerFilters* filters)
    : ParserBase(filters),
      traceDataCache_(dataCache),
      htraceCpuDetailParser_(std::make_unique<HtraceCpuDetailParser>(dataCache, filters)),
      htraceSymbolsDetailParser_(std::make_unique<HtraceSymbolsDetailParser>(dataCache, filters)),
      htraceMemParser_(std::make_unique<HtraceMemParser>(dataCache, filters)),
      htraceClockDetailParser_(std::make_unique<HtraceClockDetailParser>(dataCache, filters)),
      htraceHiLogParser_(std::make_unique<HtraceHiLogParser>(dataCache, filters)),
      htraceNativeHookParser_(std::make_unique<HtraceNativeHookParser>(dataCache, filters)),
      htraceHidumpParser_(std::make_unique<HtraceHidumpParser>(dataCache, filters)),
      cpuUsageParser_(std::make_unique<HtraceCpuDataParser>(dataCache, filters)),
      networkParser_(std::make_unique<HtraceNetworkParser>(dataCache, filters)),
      diskIOParser_(std::make_unique<HtraceDiskIOParser>(dataCache, filters)),
      processParser_(std::make_unique<HtraceProcessParser>(dataCache, filters)),
      hisyseventParser_(std::make_unique<HtraceHisyseventParser>(dataCache, filters)),
      jsMemoryParser_(std::make_unique<HtraceJSMemoryParser>(dataCache, filters)),
      perfDataParser_(std::make_unique<PerfDataParser>(dataCache, filters)),
      ebpfDataParser_(std::make_unique<EbpfDataParser>(dataCache, filters))
{
    InitPluginNameIndex();
    if (traceDataCache_->supportThread_) {
        dataSegArray_ = std::make_unique<HtraceDataSegment[]>(maxSegArraySize);
    } else {
        dataSegArray_ = std::make_unique<HtraceDataSegment[]>(1);
    }
}
void HtraceParser::InitPluginNameIndex()
{
    nativeHookPluginIndex_.insert(traceDataCache_->GetDataIndex("nativehook"));
    nativeHookPluginIndex_.insert(traceDataCache_->GetDataIndex("hookdaemon"));
    nativeHookConfigIndex_ = traceDataCache_->GetDataIndex("nativehook_config");
    hisyseventPluginIndex_ = traceDataCache_->GetDataIndex("hisysevent-plugin");
    hisyseventPluginConfigIndex_ = traceDataCache_->GetDataIndex("hisysevent-plugin_config");
    memPluginIndex_ = traceDataCache_->GetDataIndex("memory-plugin");
    memoryPluginConfigIndex_ = traceDataCache_->GetDataIndex("memory-plugin_config");
    ftracePluginIndex_.insert(traceDataCache_->GetDataIndex("ftrace-plugin"));
    ftracePluginIndex_.insert(traceDataCache_->GetDataIndex("/data/local/tmp/libftrace_plugin.z.so"));
    hilogPluginIndex_.insert(traceDataCache_->GetDataIndex("hilog-plugin"));
    hilogPluginIndex_.insert(traceDataCache_->GetDataIndex("/data/local/tmp/libhilogplugin.z.so"));
    hidumpPluginIndex_.insert(traceDataCache_->GetDataIndex("hidump-plugin"));
    hidumpPluginIndex_.insert(traceDataCache_->GetDataIndex("/data/local/tmp/libhidumpplugin.z.so"));
    cpuPluginIndex_ = traceDataCache_->GetDataIndex("cpu-plugin");
    networkPluginIndex_ = traceDataCache_->GetDataIndex("network-plugin");
    diskioPluginIndex_ = traceDataCache_->GetDataIndex("diskio-plugin");
    processPluginIndex_ = traceDataCache_->GetDataIndex("process-plugin");
    arktsPluginIndex_ = traceDataCache_->GetDataIndex("arkts-plugin");
    arktsPluginConfigIndex_ = traceDataCache_->GetDataIndex("arkts-plugin_config");
    supportPluginNameIndex_.insert(nativeHookPluginIndex_.begin(), nativeHookPluginIndex_.end());
    supportPluginNameIndex_.insert(nativeHookConfigIndex_);
    supportPluginNameIndex_.insert(hisyseventPluginIndex_);
    supportPluginNameIndex_.insert(hisyseventPluginConfigIndex_);
    supportPluginNameIndex_.insert(memPluginIndex_);
    supportPluginNameIndex_.insert(memoryPluginConfigIndex_);
    supportPluginNameIndex_.insert(ftracePluginIndex_.begin(), ftracePluginIndex_.end());
    supportPluginNameIndex_.insert(hilogPluginIndex_.begin(), hilogPluginIndex_.end());
    supportPluginNameIndex_.insert(hidumpPluginIndex_.begin(), hidumpPluginIndex_.end());
    supportPluginNameIndex_.insert(cpuPluginIndex_);
    supportPluginNameIndex_.insert(networkPluginIndex_);
    supportPluginNameIndex_.insert(diskioPluginIndex_);
    supportPluginNameIndex_.insert(processPluginIndex_);
    supportPluginNameIndex_.insert(arktsPluginIndex_);
    supportPluginNameIndex_.insert(arktsPluginConfigIndex_);
}

void HtraceParser::ParserFileSO(std::string& directory, const std::vector<std::string>& relativeFilePaths)
{
    for (const auto& filePath : relativeFilePaths) {
        auto absoluteFilePath = filePath.substr(directory.length());
        auto symbolsFile =
            OHOS::Developtools::HiPerf::SymbolsFile::CreateSymbolsFile(SYMBOL_ELF_FILE, absoluteFilePath);
        symbolsFile->setSymbolsFilePath(directory);
        symbolsFile->LoadSymbols(absoluteFilePath);
        symbolsFiles_.emplace_back(std::move(symbolsFile));
    }
}

HtraceParser::~HtraceParser()
{
    TS_LOGI("clockid 2 is for RealTime and 1 is for BootTime");
}

bool HtraceParser::ReparseSymbolFilesAndResymbolization(std::string& symbolsPath,
                                                        std::vector<std::string>& symbolsPaths)
{
    std::vector<std::string> dir;
    dir.emplace_back(symbolsPath);
    auto parseStatus = false;
    parseStatus = perfDataParser_->PerfReloadSymbolFiles(dir);
    ParserFileSO(symbolsPath, symbolsPaths);
    if (traceDataCache_->GetNativeHookFrameData()->Size() > 0) {
        htraceNativeHookParser_->NativeHookReloadElfSymbolTable(symbolsFiles_);
        parseStatus = true;
    }
    if (traceDataCache_->GetEbpfCallStack()->Size() > 0) {
        ebpfDataParser_->EBPFReloadElfSymbolTable(symbolsFiles_);
        parseStatus = true;
    }
    symbolsFiles_.clear();
    return parseStatus;
}

void HtraceParser::WaitForParserEnd()
{
    if (parseThreadStarted_ || filterThreadStarted_) {
        toExit_ = true;
        while (!exited_) {
            usleep(sleepDur_ * sleepDur_);
        }
    }
    hasGotHeader_ = false;
    htraceCpuDetailParser_->FilterAllEvents();
    htraceNativeHookParser_->FinishParseNativeHookData();
    htraceHiLogParser_->Finish();
    htraceHidumpParser_->Finish();
    cpuUsageParser_->Finish();
    networkParser_->Finish();
    processParser_->Finish();
    diskIOParser_->Finish();
    hisyseventParser_->Finish();
    jsMemoryParser_->Finish();
    // keep final upate perf and ebpf data time range
    ebpfDataParser_->Finish();
    perfDataParser_->Finish();
    htraceNativeHookParser_->Finish();
    htraceMemParser_->Finish();
    traceDataCache_->GetDataSourceClockIdData()->SetDataSourceClockId(DATA_SOURCE_TYPE_TRACE,
                                                                      dataSourceTypeTraceClockid_);
    traceDataCache_->GetDataSourceClockIdData()->SetDataSourceClockId(DATA_SOURCE_TYPE_MEM, dataSourceTypeMemClockid_);
    traceDataCache_->GetDataSourceClockIdData()->SetDataSourceClockId(DATA_SOURCE_TYPE_HILOG,
                                                                      dataSourceTypeHilogClockid_);
    traceDataCache_->GetDataSourceClockIdData()->SetDataSourceClockId(DATA_SOURCE_TYPE_NATIVEHOOK,
                                                                      dataSourceTypeNativeHookClockid_);
    traceDataCache_->GetDataSourceClockIdData()->SetDataSourceClockId(DATA_SOURCE_TYPE_FPS, dataSourceTypeFpsClockid_);
    traceDataCache_->GetDataSourceClockIdData()->SetDataSourceClockId(DATA_SOURCE_TYPE_NETWORK,
                                                                      dataSourceTypeNetworkClockid_);
    traceDataCache_->GetDataSourceClockIdData()->SetDataSourceClockId(DATA_SOURCE_TYPE_DISKIO,
                                                                      dataSourceTypeDiskioClockid_);
    traceDataCache_->GetDataSourceClockIdData()->SetDataSourceClockId(DATA_SOURCE_TYPE_CPU, dataSourceTypeCpuClockid_);
    traceDataCache_->GetDataSourceClockIdData()->SetDataSourceClockId(DATA_SOURCE_TYPE_PROCESS,
                                                                      dataSourceTypeProcessClockid_);
    traceDataCache_->GetDataSourceClockIdData()->SetDataSourceClockId(DATA_SOURCE_TYPE_HISYSEVENT,
                                                                      dataSourceTypeHisyseventClockid_);
    traceDataCache_->GetDataSourceClockIdData()->SetDataSourceClockId(DATA_SOURCE_TYPE_JSMEMORY,
                                                                      dataSourceTypeJSMemoryClockid_);
    traceDataCache_->GetDataSourceClockIdData()->Finish();
    dataSegArray_.reset();
    processedDataLen_ = 0;
}

void HtraceParser::ParseTraceDataItem(const std::string& buffer)
{
    int32_t head = rawDataHead_;
    if (!traceDataCache_->supportThread_ || traceDataCache_->isSplitFile_) {
        dataSegArray_[head].seg = std::make_shared<std::string>(std::move(buffer));
        dataSegArray_[head].status = TS_PARSE_STATUS_SEPRATED;
        ParserData(dataSegArray_[head], traceDataCache_->isSplitFile_);
        return;
    }
    while (!toExit_) {
        if (dataSegArray_[head].status.load() != TS_PARSE_STATUS_INIT) {
            usleep(sleepDur_);
            continue;
        }
        dataSegArray_[head].seg = std::make_shared<std::string>(std::move(buffer));
        dataSegArray_[head].status = TS_PARSE_STATUS_SEPRATED;
        rawDataHead_ = (rawDataHead_ + 1) % maxSegArraySize;
        break;
    }
    if (!parseThreadStarted_) {
        parseThreadStarted_ = true;
        int32_t tmp = traceDataCache_->parserThreadNum_;
        while (tmp--) {
            parserThreadCount_++;
            std::thread ParseTypeThread(&HtraceParser::ParseThread, this);
            ParseTypeThread.detach();
            TS_LOGI("parser Thread:%d/%d start working ...\n", traceDataCache_->parserThreadNum_ - tmp,
                    traceDataCache_->parserThreadNum_);
        }
    }
    if (!filterThreadStarted_) {
        filterThreadStarted_ = true;
        std::thread FilterTypeThread(&HtraceParser::FilterThread, this);
        TS_LOGI("FilterThread start working ...");
        FilterTypeThread.detach();
    }
}

void HtraceParser::EnableFileSeparate(bool enabled)
{
    jsMemoryParser_->EnableSaveFile(enabled);
}
void HtraceParser::FilterData(HtraceDataSegment& seg, bool isSplitFile)
{
    bool haveSplitSeg = false;
    if (seg.dataType == DATA_SOURCE_TYPE_NATIVEHOOK) {
        htraceNativeHookParser_->Parse(seg, haveSplitSeg);
    } else if (seg.dataType == DATA_SOURCE_TYPE_NATIVEHOOK_CONFIG) {
        htraceNativeHookParser_->ParseConfigInfo(seg);
    } else if (seg.dataType == DATA_SOURCE_TYPE_TRACE) {
        htraceCpuDetailParser_->FilterAllEventsReader();
    } else if (seg.dataType == DATA_SOURCE_TYPE_MEM) {
        htraceMemParser_->Parse(seg, seg.timeStamp, seg.clockId);
    } else if (seg.dataType == DATA_SOURCE_TYPE_HILOG) {
        htraceHiLogParser_->Parse(seg.protoData, haveSplitSeg);
    } else if (seg.dataType == DATA_SOURCE_TYPE_CPU) {
        cpuUsageParser_->Parse(seg.protoData, seg.timeStamp);
    } else if (seg.dataType == DATA_SOURCE_TYPE_FPS) {
        htraceHidumpParser_->Parse(seg.protoData);
        dataSourceTypeFpsClockid_ = htraceHidumpParser_->ClockId();
    } else if (seg.dataType == DATA_SOURCE_TYPE_NETWORK) {
        networkParser_->Parse(seg.protoData, seg.timeStamp);
    } else if (seg.dataType == DATA_SOURCE_TYPE_PROCESS) {
        processParser_->Parse(seg.protoData, seg.timeStamp);
    } else if (seg.dataType == DATA_SOURCE_TYPE_DISKIO) {
        diskIOParser_->Parse(seg.protoData, seg.timeStamp);
    } else if (seg.dataType == DATA_SOURCE_TYPE_JSMEMORY) {
        jsMemoryParser_->Parse(seg.protoData, seg.timeStamp, traceDataCache_->SplitFileMinTime(),
                               traceDataCache_->SplitFileMaxTime(), profilerPluginData_);
    } else if (seg.dataType == DATA_SOURCE_TYPE_JSMEMORY_CONFIG) {
        jsMemoryParser_->ParseJSMemoryConfig(seg.protoData);
    } else if (seg.dataType == DATA_SOURCE_TYPE_HISYSEVENT) {
        ProtoReader::HisyseventInfo_Reader hisyseventInfo(seg.protoData.data_, seg.protoData.size_);
        hisyseventParser_->Parse(&hisyseventInfo, seg.timeStamp, haveSplitSeg);
    } else if (seg.dataType == DATA_SOURCE_TYPE_HISYSEVENT_CONFIG) {
        ProtoReader::HisyseventConfig_Reader hisyseventConfig(seg.protoData.data_, seg.protoData.size_);
        hisyseventParser_->Parse(&hisyseventConfig, seg.timeStamp);
    } else if (seg.dataType == DATA_SOURCE_TYPE_MEM_CONFIG) {
        htraceMemParser_->ParseMemoryConfig(seg);
    }
    if (traceDataCache_->isSplitFile_ && haveSplitSeg) {
        mTraceDataHtrace_.emplace(splitFileOffset_, nextLength_ + packetSegLength_);
    }
    if (traceDataCache_->supportThread_ && !traceDataCache_->isSplitFile_) {
        filterHead_ = (filterHead_ + 1) % maxSegArraySize;
    }
    seg.status = TS_PARSE_STATUS_INIT;
}
void HtraceParser::FilterThread()
{
    TS_LOGI("filter thread start work!");
    while (true) {
        HtraceDataSegment& seg = dataSegArray_[filterHead_];
        if (seg.status.load() == TS_PARSE_STATUS_INVALID) {
            seg.status = TS_PARSE_STATUS_INIT;
            filterHead_ = (filterHead_ + 1) % maxSegArraySize;
            TS_LOGD("seprateHead_d:\t%d, parseHead_:\t%d, filterHead_:\t%d\n", rawDataHead_, parseHead_, filterHead_);
            continue;
        }
        if (seg.status.load() != TS_PARSE_STATUS_PARSED) {
            if (toExit_ && !parserThreadCount_) {
                TS_LOGI("exiting Filter Thread");
                exited_ = true;
                filterThreadStarted_ = false;
                TS_LOGI("seprateHead:\t%d, parseHead_:\t%d, filterHead_:\t%d, status:%d\n", rawDataHead_, parseHead_,
                        filterHead_, seg.status.load());
                return;
            }
            TS_LOGD("seprateHead:\t%d, parseHead_:\t%d, filterHead_:\t%d, status:%d\n", rawDataHead_, parseHead_,
                    filterHead_, seg.status.load());
            usleep(sleepDur_);
            continue;
        }
        FilterData(seg, false);
    }
}

bool HtraceParser::SpliteConfigData(const std::string& pluginName, const HtraceDataSegment& dataSeg)
{
    if (EndWith(pluginName, "arkts-plugin_config")) {
        std::string dataString(dataSeg.seg->c_str(), dataSeg.seg->length());
        arkTsConfigData_ = lenBuffer_ + dataString;
        return true;
    } else if (EndWith(pluginName, "config")) {
        mTraceDataHtrace_.emplace(splitFileOffset_, nextLength_ + packetSegLength_);
        return true;
    }
    return false;
}

bool HtraceParser::SpliteDataBySegment(DataIndex pluginNameIndex, HtraceDataSegment& dataSeg)
{
    if (nativeHookPluginIndex_.count(pluginNameIndex) || ftracePluginIndex_.count(pluginNameIndex) ||
        hilogPluginIndex_.count(pluginNameIndex) || hisyseventPluginIndex_ == pluginNameIndex) {
        return false;
    }
    // need convert to Primary Time Plugin
    if (pluginNameIndex == memPluginIndex_) {
        dataSeg.timeStamp = streamFilters_->clockFilter_->ToPrimaryTraceTime(TS_CLOCK_REALTIME, dataSeg.timeStamp);
        UpdatePluginTimeRange(TS_CLOCK_BOOTTIME, dataSeg.timeStamp, dataSeg.timeStamp);
    }
    if (dataSeg.timeStamp >= traceDataCache_->SplitFileMinTime() &&
        dataSeg.timeStamp <= traceDataCache_->SplitFileMaxTime()) {
        mTraceDataHtrace_.emplace(splitFileOffset_, nextLength_ + packetSegLength_);
    }
    if (pluginNameIndex == arktsPluginConfigIndex_ || pluginNameIndex == arktsPluginIndex_) {
        return false;
    }
    return true;
}
void HtraceParser::ParseDataByPluginName(HtraceDataSegment& dataSeg,
                                         DataIndex pulginNameIndex,
                                         const ProtoReader::ProfilerPluginData_Reader& pluginDataZero,
                                         bool isSplitFile)
{
    if (nativeHookPluginIndex_.count(pulginNameIndex)) {
        ParseNativeHook(dataSeg, isSplitFile);
    } else if (pulginNameIndex == nativeHookConfigIndex_) {
        ParseNativeHookConfig(dataSeg);
    } else if (ftracePluginIndex_.count(pulginNameIndex)) { // ok
        ParseFtrace(dataSeg);
    } else if (pulginNameIndex == memPluginIndex_) {
        ParseMemory(pluginDataZero, dataSeg);
    } else if (hilogPluginIndex_.count(pulginNameIndex)) {
        ParseHilog(dataSeg);
    } else if (hidumpPluginIndex_.count(pulginNameIndex)) {
        ParseFPS(dataSeg);
    } else if (pulginNameIndex == cpuPluginIndex_) {
        ParseCpuUsage(dataSeg);
    } else if (pulginNameIndex == networkPluginIndex_) {
        ParseNetwork(dataSeg);
    } else if (pulginNameIndex == diskioPluginIndex_) {
        ParseDiskIO(dataSeg);
    } else if (pulginNameIndex == processPluginIndex_) {
        ParseProcess(dataSeg);
    } else if (pulginNameIndex == hisyseventPluginIndex_) {
        ParseHisysevent(dataSeg);
    } else if (pulginNameIndex == hisyseventPluginConfigIndex_) {
        ParseHisyseventConfig(dataSeg);
    } else if (pulginNameIndex == arktsPluginIndex_) {
        ParseJSMemory(dataSeg, isSplitFile);
    } else if (pulginNameIndex == arktsPluginConfigIndex_) {
        ParseJSMemoryConfig(dataSeg);
    } else if (pulginNameIndex == memoryPluginConfigIndex_) {
        ParseMemoryConfig(dataSeg, pluginDataZero);
    }
}

void HtraceParser::ParserData(HtraceDataSegment& dataSeg, bool isSplitFile)
{
    ProtoReader::ProfilerPluginData_Reader pluginDataZero(reinterpret_cast<const uint8_t*>(dataSeg.seg->c_str()),
                                                          dataSeg.seg->length());
    if (!pluginDataZero.has_name()) {
        return;
    }
    auto pluginName = pluginDataZero.name().ToStdString();
    auto pluginNameIndex = traceDataCache_->GetDataIndex(pluginName);
    if (isSplitFile && SpliteConfigData(pluginName, dataSeg)) {
        return;
    }
    if (pluginDataZero.has_tv_sec() && pluginDataZero.has_tv_nsec()) {
        dataSeg.timeStamp = pluginDataZero.tv_sec() * SEC_TO_NS + pluginDataZero.tv_nsec();
    }

    if (isSplitFile && SpliteDataBySegment(pluginNameIndex, dataSeg)) {
        return;
    }
    if (supportPluginNameIndex_.count(pluginNameIndex)) {
        dataSeg.protoData = pluginDataZero.data();
        ParseDataByPluginName(dataSeg, pluginNameIndex, pluginDataZero, isSplitFile);
    } else {
#if IS_WASM
        TraceStreamer_Plugin_Out_Filter(reinterpret_cast<const char*>(pluginDataZero.data().data_),
                                        pluginDataZero.data().size_, pluginName);
#endif
        dataSeg.status = TS_PARSE_STATUS_INVALID;
        streamFilters_->statFilter_->IncreaseStat(TRACE_EVENT_OTHER, STAT_EVENT_DATA_INVALID);
        return;
    }
    if (!traceDataCache_->supportThread_ || traceDataCache_->isSplitFile_) {
        FilterData(dataSeg, isSplitFile);
    }
}
void HtraceParser::ParseThread()
{
    TS_LOGI("parser thread start work!\n");
    while (true) {
        int32_t head = GetNextSegment();
        if (head < 0) {
            if (head == ERROR_CODE_EXIT) {
                TS_LOGI("parse thread exit");
                return;
            } else if (head == ERROR_CODE_NODATA) {
                continue;
            }
        }
        HtraceDataSegment& dataSeg = dataSegArray_[head];
        ParserData(dataSeg, false);
    }
}

void HtraceParser::ParseMemory(const ProtoReader::ProfilerPluginData_Reader& pluginDataZero, HtraceDataSegment& dataSeg)
{
    BuiltinClocks clockId = TS_CLOCK_REALTIME;
    auto clockIdTemp = pluginDataZero.clock_id();
    if (clockIdTemp == ProtoReader::ProfilerPluginData_ClockId_CLOCKID_REALTIME) {
        clockId = TS_CLOCK_REALTIME;
    }
    dataSourceTypeMemClockid_ = clockId;
    dataSeg.dataType = DATA_SOURCE_TYPE_MEM;
    dataSeg.clockId = clockId;
    dataSeg.status = TS_PARSE_STATUS_PARSED;
}
void HtraceParser::ParseHilog(HtraceDataSegment& dataSeg)
{
    dataSeg.dataType = DATA_SOURCE_TYPE_HILOG;
    dataSourceTypeHilogClockid_ = TS_CLOCK_REALTIME;
    dataSeg.status = TS_PARSE_STATUS_PARSED;
}
void HtraceParser::ParseNativeHookConfig(HtraceDataSegment& dataSeg)
{
    dataSeg.dataType = DATA_SOURCE_TYPE_NATIVEHOOK_CONFIG;
    dataSeg.status = TS_PARSE_STATUS_PARSED;
}
void HtraceParser::ParseNativeHook(HtraceDataSegment& dataSeg, bool isSplitFile)
{
    dataSourceTypeNativeHookClockid_ = TS_CLOCK_REALTIME;
    dataSeg.dataType = DATA_SOURCE_TYPE_NATIVEHOOK;
    dataSeg.status = TS_PARSE_STATUS_PARSED;
    if (isSplitFile) {
        dataSourceType_ = DATA_SOURCE_TYPE_NATIVEHOOK;
    }
}
void HtraceParser::ParseMemoryConfig(HtraceDataSegment& dataSeg,
                                     const ProtoReader::ProfilerPluginData_Reader& pluginDataZero)
{
    if (pluginDataZero.has_sample_interval()) {
        uint32_t sampleInterval = pluginDataZero.sample_interval();
        traceDataCache_->GetTraceConfigData()->AppendNewData("memory_config", "sample_interval",
                                                             std::to_string(sampleInterval));
    }
    dataSeg.dataType = DATA_SOURCE_TYPE_MEM_CONFIG;
    dataSeg.status = TS_PARSE_STATUS_PARSED;
}

void HtraceParser::ParseFtrace(HtraceDataSegment& dataSeg)
{
    dataSeg.dataType = DATA_SOURCE_TYPE_TRACE;
    ProtoReader::TracePluginResult_Reader tracePluginResult(dataSeg.protoData);
    if (tracePluginResult.has_ftrace_cpu_stats()) {
        auto cpuStats = *tracePluginResult.ftrace_cpu_stats();
        ProtoReader::FtraceCpuStatsMsg_Reader ftraceCpuStatsMsg(cpuStats.data_, cpuStats.size_);
        auto s = *ftraceCpuStatsMsg.per_cpu_stats();
        ProtoReader::PerCpuStatsMsg_Reader perCpuStatsMsg(s.data_, s.size_);
        TS_LOGD("s.overrun():%lu", perCpuStatsMsg.overrun());
        TS_LOGD("s.dropped_events():%lu", perCpuStatsMsg.dropped_events());
        auto clock = ftraceCpuStatsMsg.trace_clock().ToStdString();
        if (clock == "boot") {
            clock_ = TS_CLOCK_BOOTTIME;
        } else if (clock == "mono") {
            clock_ = TS_MONOTONIC;
        } else {
            TS_LOGI("invalid clock:%s", clock.c_str());
            dataSeg.status = TS_PARSE_STATUS_INVALID;
            return;
        }
        dataSeg.clockId = clock_;
        dataSourceTypeTraceClockid_ = clock_;
        dataSeg.status = TS_PARSE_STATUS_PARSED;
        return;
    }
    bool haveSplitSeg = false;
    dataSeg.clockId = clock_;
    if (tracePluginResult.has_ftrace_cpu_detail()) {
        htraceCpuDetailParser_->Parse(dataSeg, tracePluginResult, haveSplitSeg);
        dataSeg.status = TS_PARSE_STATUS_PARSED;
    }
    if (tracePluginResult.has_symbols_detail()) {
        htraceSymbolsDetailParser_->Parse(dataSeg.protoData); // has Event
        haveSplitSeg = true;
        dataSeg.status = TS_PARSE_STATUS_PARSED;
    }
    if (tracePluginResult.has_clocks_detail()) {
        htraceClockDetailParser_->Parse(dataSeg.protoData); // has Event
        haveSplitSeg = true;
        dataSeg.status = TS_PARSE_STATUS_PARSED;
    }
    if (traceDataCache_->isSplitFile_ && haveSplitSeg) {
        mTraceDataHtrace_.emplace(splitFileOffset_, nextLength_ + packetSegLength_);
    }
    dataSeg.status = TS_PARSE_STATUS_INVALID;
}

void HtraceParser::ParseFPS(HtraceDataSegment& dataSeg)
{
    dataSeg.dataType = DATA_SOURCE_TYPE_FPS;
    dataSeg.status = TS_PARSE_STATUS_PARSED;
}

void HtraceParser::ParseCpuUsage(HtraceDataSegment& dataSeg)
{
    dataSourceTypeProcessClockid_ = TS_CLOCK_REALTIME;
    dataSeg.dataType = DATA_SOURCE_TYPE_CPU;
    dataSeg.status = TS_PARSE_STATUS_PARSED;
}
void HtraceParser::ParseNetwork(HtraceDataSegment& dataSeg)
{
    dataSourceTypeProcessClockid_ = TS_CLOCK_REALTIME;
    dataSeg.dataType = DATA_SOURCE_TYPE_NETWORK;
    dataSeg.status = TS_PARSE_STATUS_PARSED;
}
void HtraceParser::ParseDiskIO(HtraceDataSegment& dataSeg)
{
    dataSourceTypeProcessClockid_ = TS_CLOCK_REALTIME;
    dataSeg.dataType = DATA_SOURCE_TYPE_DISKIO;
    dataSeg.status = TS_PARSE_STATUS_PARSED;
}

void HtraceParser::ParseProcess(HtraceDataSegment& dataSeg)
{
    dataSourceTypeProcessClockid_ = TS_CLOCK_BOOTTIME;
    dataSeg.dataType = DATA_SOURCE_TYPE_PROCESS;
    dataSeg.status = TS_PARSE_STATUS_PARSED;
}

void HtraceParser::ParseHisysevent(HtraceDataSegment& dataSeg)
{
    dataSourceTypeHisyseventClockid_ = TS_CLOCK_REALTIME;
    dataSeg.dataType = DATA_SOURCE_TYPE_HISYSEVENT;
    dataSeg.status = TS_PARSE_STATUS_PARSED;
}
void HtraceParser::ParseHisyseventConfig(HtraceDataSegment& dataSeg)
{
    dataSourceTypeHisyseventClockid_ = TS_CLOCK_REALTIME;
    dataSeg.dataType = DATA_SOURCE_TYPE_HISYSEVENT_CONFIG;
    dataSeg.status = TS_PARSE_STATUS_PARSED;
}

void HtraceParser::ParseJSMemory(HtraceDataSegment& dataSeg, bool isSplitFile)
{
    if (isSplitFile) {
        dataSourceType_ = DATA_SOURCE_TYPE_JSMEMORY;
        memcpy_s(&profilerPluginData_, sizeof(profilerPluginData_), dataSeg.seg->c_str(), dataSeg.seg->length());
    }
    dataSourceTypeJSMemoryClockid_ = TS_CLOCK_REALTIME;
    dataSeg.dataType = DATA_SOURCE_TYPE_JSMEMORY;
    dataSeg.status = TS_PARSE_STATUS_PARSED;
}

void HtraceParser::ParseJSMemoryConfig(HtraceDataSegment& dataSeg)
{
    dataSourceTypeJSMemoryClockid_ = TS_CLOCK_REALTIME;
    dataSeg.dataType = DATA_SOURCE_TYPE_JSMEMORY_CONFIG;
    dataSeg.status = TS_PARSE_STATUS_PARSED;
}

int32_t HtraceParser::GetNextSegment()
{
    int32_t head;
    std::lock_guard<std::mutex> muxLockGuard(htraceDataSegMux_);
    head = parseHead_;
    HtraceDataSegment& htraceDataSegmentSeg = dataSegArray_[head];
    if (htraceDataSegmentSeg.status.load() != TS_PARSE_STATUS_SEPRATED) {
        if (toExit_) {
            parserThreadCount_--;
            TS_LOGI("exiting parser, parserThread Count:%d\n", parserThreadCount_);
            TS_LOGI("seprateHead_x:\t%d, parseHead_:\t%d, filterHead_:\t%d status:%d\n", rawDataHead_, parseHead_,
                    filterHead_, htraceDataSegmentSeg.status.load());
            if (!parserThreadCount_ && !filterThreadStarted_) {
                exited_ = true;
            }
            return ERROR_CODE_EXIT;
        }
        usleep(sleepDur_);
        return ERROR_CODE_NODATA;
    }
    parseHead_ = (parseHead_ + 1) % maxSegArraySize;
    htraceDataSegmentSeg.status = TS_PARSE_STATUS_PARSING;
    return head;
}
bool HtraceParser::CalcEbpfCutOffset(std::deque<uint8_t>::iterator& packagesBegin, size_t& currentLength)
{
    auto standaloneDataLength = profilerDataLength_ - packetHeaderLength_;
    if (traceDataCache_->isSplitFile_ && !parsedEbpfOver_) {
        if (!hasInitEbpfPublicData_) {
            // Record the offset of Hiperf's 1024-byte header relative to the entire file.
            ebpfDataParser_->SetEbpfDataOffset(processedDataLen_);
            ebpfDataParser_->SetSpliteTimeRange(traceDataCache_->SplitFileMinTime(),
                                                traceDataCache_->SplitFileMaxTime());
            parsedFileOffset_ += profilerDataLength_ - packetHeaderLength_;
            hasInitEbpfPublicData_ = true;
        }
        parsedEbpfOver_ = ebpfDataParser_->AddAndSplitEbpfData(packagesBuffer_);
        if (parsedEbpfOver_) {
            profilerDataType_ = ProfilerTraceFileHeader::UNKNOW_TYPE;
            hasGotHeader_ = false;
            processedDataLen_ += standaloneDataLength;
        }
        return false;
    }
    if (!traceDataCache_->isSplitFile_ && packagesBuffer_.size() >= standaloneDataLength) {
        ebpfDataParser_->InitAndParseEbpfData(packagesBuffer_, standaloneDataLength);
        currentLength -= standaloneDataLength;
        packagesBegin += standaloneDataLength;
        profilerDataType_ = ProfilerTraceFileHeader::UNKNOW_TYPE;
        hasGotHeader_ = false;
        return true;
    }
    return false;
}

bool HtraceParser::GetHeaderAndUpdateLengthMark(std::deque<uint8_t>::iterator& packagesBegin, size_t& currentLength)
{
    if (!hasGotHeader_) {
        if (!InitProfilerTraceFileHeader()) {
            return false;
        }
        packagesBuffer_.erase(packagesBuffer_.begin(), packagesBuffer_.begin() + packetHeaderLength_);
        processedDataLen_ += packetHeaderLength_;
        currentLength -= packetHeaderLength_;
        packagesBegin += packetHeaderLength_;
        parsedFileOffset_ += packetHeaderLength_;
        htraceCurentLength_ = profilerDataLength_ - packetHeaderLength_;
        hasGotHeader_ = true;
        if (!currentLength) {
            return false;
        }
    }
    return true;
}
#if IS_WASM
bool HtraceParser::ParseSDKData()
{
    if (packagesBuffer_.size() >= profilerDataLength_ - packetHeaderLength_) {
        auto thirdPartySize = profilerDataLength_ - packetHeaderLength_;
        auto buffer = std::make_unique<uint8_t[]>(thirdPartySize).get();
        std::copy(packagesBuffer_.begin(), packagesBuffer_.begin() + thirdPartySize, buffer);
        TraceStreamer_Plugin_Out_Filter(reinterpret_cast<const char*>(buffer), thirdPartySize, standalonePluginName_);
        return true;
    }
    return false;
}
#endif

bool HtraceParser::ParseSegLengthAndEnsureSegDataEnough(std::deque<uint8_t>::iterator& packagesBegin,
                                                        size_t& currentLength)
{
    std::string bufferLine;
    if (!hasGotSegLength_) {
        if (currentLength < packetSegLength_) {
            return false;
        }
        bufferLine.assign(packagesBegin, packagesBegin + packetSegLength_);
        const uint32_t* len = reinterpret_cast<const uint32_t*>(bufferLine.data());
        nextLength_ = *len;
        lenBuffer_ = bufferLine;
        htraceLength_ += nextLength_ + packetSegLength_;
        hasGotSegLength_ = true;
        currentLength -= packetSegLength_;
        packagesBegin += packetSegLength_;
        parsedFileOffset_ += packetSegLength_;
        splitFileOffset_ = profilerDataLength_ - htraceCurentLength_;
        htraceCurentLength_ -= packetSegLength_;
    }
    if (currentLength < nextLength_) {
        return false;
    }
    return true;
}
bool HtraceParser::ParseDataRecursively(std::deque<uint8_t>::iterator& packagesBegin, size_t& currentLength)
{
    TS_CHECK_TRUE_RET(GetHeaderAndUpdateLengthMark(packagesBegin, currentLength), false);
    if (profilerDataType_ == ProfilerTraceFileHeader::HIPERF_DATA) {
        return ParseHiperfData(packagesBegin, currentLength);
    }
    if (profilerDataType_ == ProfilerTraceFileHeader::STANDALONE_DATA) {
        if (EBPF_PLUGIN_NAME.compare(standalonePluginName_) == 0) {
            return CalcEbpfCutOffset(packagesBegin, currentLength);
        } else {
#if IS_WASM
            TS_CHECK_TRUE_RET(ParseSDKData(), false); // 三方sdk逻辑待验证。
#endif
        }
    }
    std::string bufferLine;
    while (true) {
        TS_CHECK_TRUE_RET(ParseSegLengthAndEnsureSegDataEnough(packagesBegin, currentLength), true);
        bufferLine.assign(packagesBegin, packagesBegin + nextLength_);
        ParseTraceDataItem(bufferLine);
        hasGotSegLength_ = false;
        packagesBegin += nextLength_;
        currentLength -= nextLength_;
        parsedFileOffset_ += nextLength_;
        if (nextLength_ > htraceCurentLength_) {
            TS_LOGE("fatal error, data length not match nextLength_:%u, htraceCurentLength_:%" PRIu64 "", nextLength_,
                    htraceCurentLength_);
        }
        htraceCurentLength_ -= nextLength_;
        if (htraceCurentLength_ == 0) {
            hasGotHeader_ = false;
            processedDataLen_ += packagesBegin - packagesBuffer_.begin();
            packagesBuffer_.erase(packagesBuffer_.begin(), packagesBegin);
            profilerDataType_ = ProfilerTraceFileHeader::UNKNOW_TYPE;
            TS_LOGD("read proto finished!");
            return ParseDataRecursively(packagesBegin, currentLength);
        }
    }
    return true;
}

void HtraceParser::ParseTraceDataSegment(std::unique_ptr<uint8_t[]> bufferStr, size_t size, bool isFinish)
{
    packagesBuffer_.insert(packagesBuffer_.end(), &bufferStr[0], &bufferStr[size]);
    auto packagesBegin = packagesBuffer_.begin();
    auto currentLength = packagesBuffer_.size();
    if (ParseDataRecursively(packagesBegin, currentLength)) {
        processedDataLen_ += packagesBegin - packagesBuffer_.begin();
        packagesBuffer_.erase(packagesBuffer_.begin(), packagesBegin);
    }
    return;
}
bool HtraceParser::ParseHiperfData(std::deque<uint8_t>::iterator& packagesBegin, size_t& currentLength)
{
    if (!traceDataCache_->isSplitFile_) {
        if (packagesBuffer_.size() >= profilerDataLength_ - packetHeaderLength_) {
            auto size = profilerDataLength_ - packetHeaderLength_;
            (void)perfDataParser_->InitPerfDataAndLoad(packagesBuffer_, size, processedDataLen_, false, true);
            currentLength -= size;
            packagesBegin += size;
            profilerDataType_ = ProfilerTraceFileHeader::UNKNOW_TYPE;
            hasGotHeader_ = false;
            return true;
        }
        return false;
    }

    bool isFinish = perfProcessedLen_ + packagesBuffer_.size() >= profilerDataLength_ - packetHeaderLength_;
    auto size = packagesBuffer_.size();
    if (isFinish) {
        size = profilerDataLength_ - packetHeaderLength_ - perfProcessedLen_;
    }
    auto ret = perfDataParser_->InitPerfDataAndLoad(packagesBuffer_, size, processedDataLen_, true, isFinish);
    perfProcessedLen_ += ret;
    currentLength -= ret;
    packagesBegin += ret;
    if (isFinish) {
        profilerDataType_ = ProfilerTraceFileHeader::UNKNOW_TYPE;
        hasGotHeader_ = false;
    }
    return true;
}
void HtraceParser::StoreTraceDataSegment(std::unique_ptr<uint8_t[]> bufferStr, size_t size, int32_t isFinish)
{
    packagesBuffer_.insert(packagesBuffer_.end(), &bufferStr[0], &bufferStr[size]);
    if (!traceDataCache_->isSplitFile_) {
        return;
    }

    uint64_t length = packagesBuffer_.size();
    auto ret = perfDataParser_->InitPerfDataAndLoad(packagesBuffer_, length, 0, true, isFinish);
    perfProcessedLen_ += ret;
    processedDataLen_ += ret;
    packagesBuffer_.erase(packagesBuffer_.begin(), packagesBuffer_.begin() + ret);
    return;
}
void HtraceParser::TraceDataSegmentEnd(bool isSplitFile)
{
    perfDataParser_->InitPerfDataAndLoad(packagesBuffer_, packagesBuffer_.size(), 0, isSplitFile, true);
    packagesBuffer_.clear();
    return;
}

bool HtraceParser::InitProfilerTraceFileHeader()
{
    if (packagesBuffer_.size() < packetHeaderLength_) {
        TS_LOGI("buffer size less than profiler trace file header");
        return false;
    }
    uint8_t buffer[packetHeaderLength_];
    (void)memset_s(buffer, sizeof(buffer), 0, sizeof(buffer));
    int32_t i = 0;
    for (auto it = packagesBuffer_.begin(); it != packagesBuffer_.begin() + packetHeaderLength_; ++it, ++i) {
        buffer[i] = *it;
    }
    ProfilerTraceFileHeader* pHeader = reinterpret_cast<ProfilerTraceFileHeader*>(buffer);
    if (pHeader->data.length <= packetHeaderLength_ || pHeader->data.magic != ProfilerTraceFileHeader::HEADER_MAGIC) {
        TS_LOGE("Profiler Trace data is truncated or invalid magic! len = %" PRIu64 ", maigc = %" PRIx64 "",
                pHeader->data.length, pHeader->data.magic);
        return false;
    }
    if (pHeader->data.dataType == ProfilerTraceFileHeader::HIPERF_DATA) {
        perfDataParser_->RecordPerfProfilerHeader(buffer, packetHeaderLength_);
    } else if (pHeader->data.dataType == ProfilerTraceFileHeader::STANDALONE_DATA &&
               EBPF_PLUGIN_NAME.compare(pHeader->data.standalonePluginName) == 0) {
        ebpfDataParser_->RecordEbpfProfilerHeader(buffer, packetHeaderLength_);
    } else {
        auto ret = memcpy_s(&profilerTraceFileHeader_, sizeof(profilerTraceFileHeader_), buffer, packetHeaderLength_);
        if (ret == -1 || profilerTraceFileHeader_.data.magic != ProfilerTraceFileHeader::HEADER_MAGIC) {
            TS_LOGE("Get profiler trace file header failed! ret = %d, magic = %" PRIx64 "", ret,
                    profilerTraceFileHeader_.data.magic);
            return false;
        }
    }
    profilerDataLength_ = pHeader->data.length;
    profilerDataType_ = pHeader->data.dataType;
    memcpy_s(standalonePluginName_, sizeof(standalonePluginName_), pHeader->data.standalonePluginName,
             sizeof(standalonePluginName_));

    TS_LOGI("magic = %" PRIx64 ", length = %" PRIu64 ", dataType = %x, boottime = %" PRIu64 "", pHeader->data.magic,
            pHeader->data.length, pHeader->data.dataType, pHeader->data.boottime);
#if IS_WASM
    const int32_t DATA_TYPE_CLOCK = 100;
    TraceStreamer_Plugin_Out_SendData(reinterpret_cast<char*>(buffer), packetHeaderLength_, DATA_TYPE_CLOCK);
#endif
    htraceClockDetailParser_->Parse(pHeader);
    return true;
}
} // namespace TraceStreamer
} // namespace SysTuning
