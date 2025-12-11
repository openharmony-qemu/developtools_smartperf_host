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

#include "pbreader_parser.h"
#include <unistd.h>
#include "app_start_filter.h"
#include "binder_filter.h"
#include "common_types.pbreader.h"
#include "cpu_filter.h"
#include "data_area.h"
#ifdef ENABLE_HTRACE
#include "ftrace_event.pbreader.h"
#include "trace_plugin_result.pbreader.h"
#endif
#ifdef ENABLE_MEMORY
#include "memory_plugin_result.pbreader.h"
#endif
#include "stat_filter.h"
#if IS_WASM
#include "wasm_func.h"
#endif
namespace SysTuning {
namespace TraceStreamer {
PbreaderParser::PbreaderParser(TraceDataCache *dataCache, const TraceStreamerFilters *filters)
    : ParserBase(filters),
      pbreaderClockDetailParser_(std::make_unique<PbreaderClockDetailParser>(dataCache, filters)),
#ifdef ENABLE_HTRACE
      htraceCpuDetailParser_(std::make_unique<HtraceCpuDetailParser>(dataCache, filters)),
      htraceSymbolsDetailParser_(std::make_unique<HtraceSymbolsDetailParser>(dataCache, filters)),
#endif
#ifdef ENABLE_FFRT
      pbreaderFfrtParser_(
          std::make_unique<PbreaderFfrtDetailParser>(dataCache, filters, htraceCpuDetailParser_->eventParser_.get())),
#endif
#ifdef ENABLE_MEMORY
      pbreaderMemParser_(std::make_unique<PbreaderMemParser>(dataCache, filters)),
#endif
#ifdef ENABLE_HILOG
      pbreaderHiLogParser_(std::make_unique<PbreaderHiLogParser>(dataCache, filters)),
#endif
#ifdef ENABLE_NATIVE_HOOK
      pbreaderNativeHookParser_(std::make_unique<PbreaderNativeHookParser>(dataCache, filters)),
#endif
#ifdef ENABLE_HTDUMP
      pbreaderHidumpParser_(std::make_unique<PbreaderHidumpParser>(dataCache, filters)),
#endif
#ifdef ENABLE_CPUDATA
      cpuUsageParser_(std::make_unique<PbreaderCpuDataParser>(dataCache, filters)),
#endif
#ifdef ENABLE_NETWORK
      networkParser_(std::make_unique<PbreaderNetworkParser>(dataCache, filters)),
#endif
#ifdef ENABLE_DISKIO
      diskIOParser_(std::make_unique<PbreaderDiskIOParser>(dataCache, filters)),
#endif
#ifdef ENABLE_PROCESS
      processParser_(std::make_unique<PbreaderProcessParser>(dataCache, filters)),
#endif
#ifdef ENABLE_HISYSEVENT
      hisyseventParser_(std::make_unique<PbreaderHisyseventParser>(dataCache, filters)),
#endif
#ifdef ENABLE_ARKTS
      jsMemoryParser_(std::make_unique<PbreaderJSMemoryParser>(dataCache, filters)),
#endif
#ifdef ENABLE_HIPERF
      perfDataParser_(std::make_unique<PerfDataParser>(dataCache, filters)),
#endif
#ifdef ENABLE_EBPF
      ebpfDataParser_(std::make_unique<EbpfDataParser>(dataCache, filters)),
#endif
#ifdef ENABLE_XPOWER
      xpowerParser_(std::make_unique<PbreaderXpowerParser>(dataCache, filters)),
#endif
#ifdef ENABLE_STREAM_EXTEND
      pbreaderStreamParser_(std::make_unique<PbreaderStreamParser>(dataCache, filters)),
#endif
      traceDataCache_(dataCache)
{
    InitPluginNameIndex();
    if (traceDataCache_->supportThread_) {
        dataSegArray_ = std::make_unique<PbreaderDataSegment[]>(maxSegArraySize);
    } else {
        dataSegArray_ = std::make_unique<PbreaderDataSegment[]>(1);
    }
}
inline void PbreaderParser::InitHookPluginNameIndex()
{
#ifdef ENABLE_NATIVE_HOOK
    nativeHookPluginIndex_.insert(traceDataCache_->GetDataIndex("nativehook"));
    nativeHookPluginIndex_.insert(traceDataCache_->GetDataIndex("hookdaemon"));
    nativeHookConfigIndex_ = traceDataCache_->GetDataIndex("nativehook_config");
    supportPluginNameIndex_.insert(nativeHookPluginIndex_.begin(), nativeHookPluginIndex_.end());
    supportPluginNameIndex_.insert(nativeHookConfigIndex_);
#endif
}
inline void PbreaderParser::InitMemoryPluginNameIndex()
{
#ifdef ENABLE_MEMORY
    memPluginIndex_ = traceDataCache_->GetDataIndex("memory-plugin");
    memoryPluginConfigIndex_ = traceDataCache_->GetDataIndex("memory-plugin_config");
    supportPluginNameIndex_.insert(memPluginIndex_);
    supportPluginNameIndex_.insert(memoryPluginConfigIndex_);
#endif
}
inline void PbreaderParser::InitHiPluginNameIndex()
{
#ifdef ENABLE_HTDUMP
    hidumpPluginIndex_.insert(traceDataCache_->GetDataIndex("hidump-plugin"));
    hidumpPluginIndex_.insert(traceDataCache_->GetDataIndex("/data/local/tmp/libhidumpplugin.z.so"));
    supportPluginNameIndex_.insert(hidumpPluginIndex_.begin(), hidumpPluginIndex_.end());
#endif
#ifdef ENABLE_HILOG
    hilogPluginIndex_.insert(traceDataCache_->GetDataIndex("hilog-plugin"));
    hilogPluginIndex_.insert(traceDataCache_->GetDataIndex("/data/local/tmp/libhilogplugin.z.so"));
    supportPluginNameIndex_.insert(hilogPluginIndex_.begin(), hilogPluginIndex_.end());
#endif
#ifdef ENABLE_HISYSEVENT
    hisyseventPluginIndex_ = traceDataCache_->GetDataIndex("hisysevent-plugin");
    hisyseventPluginConfigIndex_ = traceDataCache_->GetDataIndex("hisysevent-plugin_config");
    supportPluginNameIndex_.insert(hisyseventPluginIndex_);
    supportPluginNameIndex_.insert(hisyseventPluginConfigIndex_);
#endif
}
void PbreaderParser::InitPluginNameIndex()
{
#ifdef ENABLE_PROCESS
    processPluginIndex_ = traceDataCache_->GetDataIndex("process-plugin");
    supportPluginNameIndex_.insert(processPluginIndex_);
#endif
#ifdef ENABLE_DISKIO
    diskioPluginIndex_ = traceDataCache_->GetDataIndex("diskio-plugin");
    supportPluginNameIndex_.insert(diskioPluginIndex_);
#endif
    InitMemoryPluginNameIndex();
    InitHiPluginNameIndex();
#ifdef ENABLE_CPUDATA
    cpuPluginIndex_ = traceDataCache_->GetDataIndex("cpu-plugin");
    supportPluginNameIndex_.insert(cpuPluginIndex_);
#endif
#ifdef ENABLE_NETWORK
    networkPluginIndex_ = traceDataCache_->GetDataIndex("network-plugin");
    supportPluginNameIndex_.insert(networkPluginIndex_);
#endif
    InitHookPluginNameIndex();
#ifdef ENABLE_ARKTS
    arktsPluginIndex_ = traceDataCache_->GetDataIndex("arkts-plugin");
    arktsPluginConfigIndex_ = traceDataCache_->GetDataIndex("arkts-plugin_config");
    supportPluginNameIndex_.insert(arktsPluginIndex_);
    supportPluginNameIndex_.insert(arktsPluginConfigIndex_);
#endif
#ifdef ENABLE_HTRACE
    ftracePluginIndex_.insert(traceDataCache_->GetDataIndex("ftrace-plugin"));
    ftracePluginIndex_.insert(traceDataCache_->GetDataIndex("/data/local/tmp/libftrace_plugin.z.so"));
    supportPluginNameIndex_.insert(ftracePluginIndex_.begin(), ftracePluginIndex_.end());
#endif
#ifdef ENABLE_FFRT
    ffrtPluginIndex_ = traceDataCache_->GetDataIndex("ffrt-profiler");
    ffrtPluginConfigIndex_ = traceDataCache_->GetDataIndex("ffrt-profiler_config");
    supportPluginNameIndex_.insert(ffrtPluginIndex_);
    supportPluginNameIndex_.insert(ffrtPluginConfigIndex_);
#endif
#ifdef ENABLE_STREAM_EXTEND
    streamPluginIndex_ = traceDataCache_->GetDataIndex("stream-plugin");
    supportPluginNameIndex_.insert(streamPluginIndex_);
#endif
#ifdef ENABLE_XPOWER
    xpowerPluginIndex_ = traceDataCache_->GetDataIndex("xpower-plugin");
    supportPluginNameIndex_.insert(xpowerPluginIndex_);
#endif
}

#if defined(ENABLE_HIPERF) || defined(ENABLE_NATIVE_HOOK) || defined(ENABLE_EBPF)
std::unique_ptr<SymbolsFile> PbreaderParser::ParseELF(const std::string &directory, const std::string &fileName)
{
    auto symbolsFile = OHOS::Developtools::HiPerf::SymbolsFile::CreateSymbolsFile(SYMBOL_ELF_FILE, fileName);
    if (!symbolsFile) {
        return nullptr;
    }
    symbolsFile->setSymbolsFilePath(directory);
    if (!symbolsFile->LoadSymbols(nullptr, fileName)) {
        return nullptr;
    }
    return symbolsFile;
}
#endif

PbreaderParser::~PbreaderParser()
{
    TS_LOGI("clockid 2 is for RealTime and 1 is for BootTime");
}

bool PbreaderParser::ReparseSymbolFileAndResymbolization(const std::string &directory, const std::string &fileName)
{
    auto parseStatus = false;
#if defined(ENABLE_HIPERF) || defined(ENABLE_NATIVE_HOOK) || defined(ENABLE_EBPF)
    auto symbolsFile = ParseELF(directory, fileName);
#endif
#ifdef ENABLE_HIPERF
    if (traceDataCache_->GetPerfFilesData()->Size() > 0) {
        perfDataParser_->PerfReloadSymbolFile(symbolsFile);
#ifdef ENABLE_ADDR2LINE
        perfDataParser_->ParseSourceLocation(directory, fileName);
#endif
        parseStatus = true;
    }
#endif
#ifdef ENABLE_NATIVE_HOOK
    if (traceDataCache_->GetNativeHookFrameData()->Size() > 0) {
        pbreaderNativeHookParser_->NativeHookReloadElfSymbolTable(symbolsFile);
        parseStatus = true;
    }
#endif
#ifdef ENABLE_EBPF
    if (traceDataCache_->GetEbpfCallStack()->Size() > 0) {
        ebpfDataParser_->EBPFReloadElfSymbolTable(symbolsFile);
        parseStatus = true;
    }
#endif
    return parseStatus;
}

inline void PbreaderParser::WaitForHPluginParserEnd()
{
#ifdef ENABLE_HTRACE
    htraceCpuDetailParser_->FilterAllEvents();
    traceDataCache_->GetDataSourceClockIdData()->SetDataSourceClockId(DATA_SOURCE_TYPE_TRACE,
                                                                      dataSourceTypeTraceClockid_);
    streamFilters_->processFilter_->UpdateProcessNameByNameToTid(commDict_);
#endif
#ifdef ENABLE_HILOG
    pbreaderHiLogParser_->Finish();
    traceDataCache_->GetDataSourceClockIdData()->SetDataSourceClockId(DATA_SOURCE_TYPE_HILOG,
                                                                      dataSourceTypeHilogClockid_);
#endif
#ifdef ENABLE_HTDUMP
    pbreaderHidumpParser_->Finish();
    traceDataCache_->GetDataSourceClockIdData()->SetDataSourceClockId(DATA_SOURCE_TYPE_FPS, dataSourceTypeFpsClockid_);
#endif
#ifdef ENABLE_HISYSEVENT
    hisyseventParser_->Finish();
    traceDataCache_->GetDataSourceClockIdData()->SetDataSourceClockId(DATA_SOURCE_TYPE_HISYSEVENT,
                                                                      dataSourceTypeHisyseventClockid_);
#endif
}

inline void PbreaderParser::WaitForOtherPluginParserEnd()
{
#ifdef ENABLE_NATIVE_HOOK
    pbreaderNativeHookParser_->FinishParseNativeHookData();
    pbreaderNativeHookParser_->Finish();
    traceDataCache_->GetDataSourceClockIdData()->SetDataSourceClockId(DATA_SOURCE_TYPE_NATIVEHOOK,
                                                                      dataSourceTypeNativeHookClockid_);
#endif
#ifdef ENABLE_CPUDATA
    cpuUsageParser_->Finish();
    traceDataCache_->GetDataSourceClockIdData()->SetDataSourceClockId(DATA_SOURCE_TYPE_CPU, dataSourceTypeCpuClockid_);
#endif
#ifdef ENABLE_NETWORK
    networkParser_->Finish();
    traceDataCache_->GetDataSourceClockIdData()->SetDataSourceClockId(DATA_SOURCE_TYPE_NETWORK,
                                                                      dataSourceTypeNetworkClockid_);
#endif
#ifdef ENABLE_PROCESS
    processParser_->Finish();
    traceDataCache_->GetDataSourceClockIdData()->SetDataSourceClockId(DATA_SOURCE_TYPE_PROCESS,
                                                                      dataSourceTypeProcessClockid_);
#endif
#ifdef ENABLE_DISKIO
    diskIOParser_->Finish();
    traceDataCache_->GetDataSourceClockIdData()->SetDataSourceClockId(DATA_SOURCE_TYPE_DISKIO,
                                                                      dataSourceTypeDiskioClockid_);
#endif
#ifdef ENABLE_ARKTS
    jsMemoryParser_->Finish();
    traceDataCache_->GetDataSourceClockIdData()->SetDataSourceClockId(DATA_SOURCE_TYPE_JSMEMORY,
                                                                      dataSourceTypeJSMemoryClockid_);
#endif
#ifdef ENABLE_EBPF
    ebpfDataParser_->Finish(); // keep final upate perf and ebpf data time range
#endif
#ifdef ENABLE_HIPERF
    perfDataParser_->Finish();
#endif
#ifdef ENABLE_MEMORY
    pbreaderMemParser_->Finish();
    traceDataCache_->GetDataSourceClockIdData()->SetDataSourceClockId(DATA_SOURCE_TYPE_MEM, dataSourceTypeMemClockid_);
#endif
}

void PbreaderParser::WaitForParserEnd()
{
    if (parseThreadStarted_ || filterThreadStarted_) {
        toExit_ = true;
        while (!exited_) {
            usleep(sleepDur_ * sleepDur_);
        }
    }
    hasGotHeader_ = false;
    WaitForHPluginParserEnd();
    WaitForOtherPluginParserEnd();
#if defined(ENABLE_HTRACE) && defined(ENABLE_NATIVE_HOOK) && defined(ENABLE_HIPERF)
    ParseNapiAsync();
#endif
    traceDataCache_->GetDataSourceClockIdData()->Finish();
    dataSegArray_.reset();
    processedDataLen_ = 0;
}

void PbreaderParser::ParseTraceDataItem(const std::string &buffer)
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
            std::thread ParseTypeThread(&PbreaderParser::ParseThread, this);
            ParseTypeThread.detach();
            TS_LOGI("parser Thread:%d/%d start working ...\n", traceDataCache_->parserThreadNum_ - tmp,
                    traceDataCache_->parserThreadNum_);
        }
    }
    if (!filterThreadStarted_) {
        filterThreadStarted_ = true;
        std::thread FilterTypeThread(&PbreaderParser::FilterThread, this);
        TS_LOGI("FilterThread start working ...");
        FilterTypeThread.detach();
    }
}

#ifdef ENABLE_ARKTS
void PbreaderParser::EnableFileSeparate(bool enabled)
{
    jsMemoryParser_->EnableSaveFile(enabled);
}
#endif
void PbreaderParser::FilterData(PbreaderDataSegment &seg, bool isSplitFile)
{
    bool haveSplitSeg = false;
    if (seg.dataType == DATA_SOURCE_TYPE_TRACE) {
#ifdef ENABLE_HTRACE
        htraceCpuDetailParser_->FilterAllEventsReader();
#endif
    }
#ifdef ENABLE_FFRT
    else if (seg.dataType == DATA_SOURCE_TYPE_FFRT) {
        pbreaderFfrtParser_->FilterAllEventsReader();
    }
#endif
#ifdef ENABLE_NATIVE_HOOK
    else if (seg.dataType == DATA_SOURCE_TYPE_NATIVEHOOK) {
        pbreaderNativeHookParser_->Parse(seg, haveSplitSeg);
    } else if (seg.dataType == DATA_SOURCE_TYPE_NATIVEHOOK_CONFIG) {
        pbreaderNativeHookParser_->ParseConfigInfo(seg);
    }
#endif
#ifdef ENABLE_MEMORY
    else if (seg.dataType == DATA_SOURCE_TYPE_MEM) {
        pbreaderMemParser_->Parse(seg, seg.timeStamp, seg.clockId);
    } else if (seg.dataType == DATA_SOURCE_TYPE_MEM_CONFIG) {
        pbreaderMemParser_->ParseMemoryConfig(seg);
    }
#endif
#ifdef ENABLE_HILOG
    else if (seg.dataType == DATA_SOURCE_TYPE_HILOG) {
        pbreaderHiLogParser_->Parse(seg.protoData, haveSplitSeg);
    }
#endif
#ifdef ENABLE_CPUDATA
    else if (seg.dataType == DATA_SOURCE_TYPE_CPU) {
        cpuUsageParser_->Parse(seg.protoData, seg.timeStamp);
    }
#endif
#ifdef ENABLE_HTDUMP
    else if (seg.dataType == DATA_SOURCE_TYPE_FPS) {
        pbreaderHidumpParser_->Parse(seg.protoData);
        dataSourceTypeFpsClockid_ = pbreaderHidumpParser_->ClockId();
    }
#endif
#ifdef ENABLE_NETWORK
    else if (seg.dataType == DATA_SOURCE_TYPE_NETWORK) {
        networkParser_->Parse(seg.protoData, seg.timeStamp);
    }
#endif
#ifdef ENABLE_PROCESS
    else if (seg.dataType == DATA_SOURCE_TYPE_PROCESS) {
        processParser_->Parse(seg.protoData, seg.timeStamp);
    }
#endif
#ifdef ENABLE_DISKIO
    else if (seg.dataType == DATA_SOURCE_TYPE_DISKIO) {
        diskIOParser_->Parse(seg.protoData, seg.timeStamp);
    }
#endif
#ifdef ENABLE_ARKTS
    else if (seg.dataType == DATA_SOURCE_TYPE_JSMEMORY) {
        jsMemoryParser_->Parse(seg.protoData, seg.timeStamp, traceDataCache_->SplitFileMinTime(),
                               traceDataCache_->SplitFileMaxTime(), profilerPluginData_);
    } else if (seg.dataType == DATA_SOURCE_TYPE_JSMEMORY_CONFIG) {
        jsMemoryParser_->ParseJSMemoryConfig(seg.protoData);
    }
#endif
#ifdef ENABLE_HISYSEVENT
    else if (seg.dataType == DATA_SOURCE_TYPE_HISYSEVENT) {
        ProtoReader::HisyseventInfo_Reader hisyseventInfo(seg.protoData.data_, seg.protoData.size_);
        hisyseventParser_->Parse(&hisyseventInfo, seg.timeStamp, haveSplitSeg);
    } else if (seg.dataType == DATA_SOURCE_TYPE_HISYSEVENT_CONFIG) {
        ProtoReader::HisyseventConfig_Reader hisyseventConfig(seg.protoData.data_, seg.protoData.size_);
        hisyseventParser_->Parse(&hisyseventConfig, seg.timeStamp);
    }
#endif
#ifdef ENABLE_XPOWER
    else if (seg.dataType == DATA_SOURCE_TYPE_XPOWER) {
        xpowerParser_->Parse(seg, seg.timeStamp, seg.clockId);
    }
#endif
#ifdef ENABLE_STREAM_EXTEND
    else if (seg.dataType == DATA_SOURCE_TYPE_STREAM) {
        pbreaderStreamParser_->Parse(seg);
    }
#endif
    if (traceDataCache_->isSplitFile_ && haveSplitSeg) {
        mPbreaderSplitData_.emplace(splitFileOffset_, nextLength_ + packetSegLength_);
    }
    if (traceDataCache_->supportThread_ && !traceDataCache_->isSplitFile_) {
        filterHead_ = (filterHead_ + 1) % maxSegArraySize;
    }
    seg.status = TS_PARSE_STATUS_INIT;
}
void PbreaderParser::FilterThread()
{
    TS_LOGI("filter thread start work!");
    while (true) {
        PbreaderDataSegment &seg = dataSegArray_[filterHead_];
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

bool PbreaderParser::SpliteConfigData(const std::string &pluginName, const PbreaderDataSegment &dataSeg)
{
    if (EndWith(pluginName, "arkts-plugin_config")) {
        std::string dataString(dataSeg.seg->c_str(), dataSeg.seg->length());
        arkTsConfigData_ = lenBuffer_ + dataString;
        return true;
    } else if (EndWith(pluginName, "config")) {
        mPbreaderSplitData_.emplace(splitFileOffset_, nextLength_ + packetSegLength_);
        return true;
    }
    return false;
}

bool PbreaderParser::SpliteDataBySegment(DataIndex pluginNameIndex, PbreaderDataSegment &dataSeg)
{
    bool isOtherPlugin = false;
#ifdef ENABLE_HTRACE
    isOtherPlugin = isOtherPlugin || ftracePluginIndex_.count(pluginNameIndex);
#endif
#ifdef ENABLE_FFRT
    isOtherPlugin = isOtherPlugin || (ffrtPluginIndex_ == pluginNameIndex);
#endif
#ifdef ENABLE_HISYSEVENT
    isOtherPlugin = isOtherPlugin || (hisyseventPluginIndex_ == pluginNameIndex);
#endif
#ifdef ENABLE_NATIVE_HOOK
    isOtherPlugin = isOtherPlugin || nativeHookPluginIndex_.count(pluginNameIndex);
#endif
#ifdef ENABLE_HILOG
    isOtherPlugin = isOtherPlugin || hilogPluginIndex_.count(pluginNameIndex);
#endif
    if (isOtherPlugin) {
        return false;
    }
    // need convert to Primary Time Plugin
#ifdef ENABLE_MEMORY
    if (pluginNameIndex == memPluginIndex_) {
        dataSeg.timeStamp = streamFilters_->clockFilter_->ToPrimaryTraceTime(TS_CLOCK_REALTIME, dataSeg.timeStamp);
        UpdatePluginTimeRange(TS_CLOCK_BOOTTIME, dataSeg.timeStamp, dataSeg.timeStamp);
    }
#endif
    if (dataSeg.timeStamp >= traceDataCache_->SplitFileMinTime() &&
        dataSeg.timeStamp <= traceDataCache_->SplitFileMaxTime()) {
        mPbreaderSplitData_.emplace(splitFileOffset_, nextLength_ + packetSegLength_);
    }
    if (pluginNameIndex == arktsPluginConfigIndex_ || pluginNameIndex == arktsPluginIndex_) {
        return false;
    }
    return true;
}
void PbreaderParser::ParseDataByPluginName(PbreaderDataSegment &dataSeg,
                                           DataIndex pulginNameIndex,
                                           const ProtoReader::ProfilerPluginData_Reader &pluginDataZero,
                                           bool isSplitFile)
{
    if (ftracePluginIndex_.count(pulginNameIndex)) { // ok
#ifdef ENABLE_HTRACE
        ParseFtrace(dataSeg);
#endif
    }
#ifdef ENABLE_FFRT
    else if (ffrtPluginIndex_ == pulginNameIndex) {
        ParseFfrt(dataSeg);
    } else if (ffrtPluginConfigIndex_ == pulginNameIndex) {
        ParseFfrtConfig(dataSeg);
    }
#endif
#ifdef ENABLE_NATIVE_HOOK
    else if (nativeHookPluginIndex_.count(pulginNameIndex)) {
        ParseNativeHook(dataSeg, isSplitFile);
    } else if (pulginNameIndex == nativeHookConfigIndex_) {
        ParseNativeHookConfig(dataSeg);
    }
#endif
#ifdef ENABLE_MEMORY
    else if (pulginNameIndex == memPluginIndex_) {
        ParseMemory(pluginDataZero, dataSeg);
    } else if (pulginNameIndex == memoryPluginConfigIndex_) {
        ParseMemoryConfig(dataSeg, pluginDataZero);
    }
#endif
#ifdef ENABLE_HILOG
    else if (hilogPluginIndex_.count(pulginNameIndex)) {
        ParseHilog(dataSeg);
    }
#endif
#ifdef ENABLE_HTDUMP
    else if (hidumpPluginIndex_.count(pulginNameIndex)) {
        ParseFPS(dataSeg);
    }
#endif
#ifdef ENABLE_CPUDATA
    else if (pulginNameIndex == cpuPluginIndex_) {
        ParseCpuUsage(dataSeg);
    }
#endif
#ifdef ENABLE_NETWORK
    else if (pulginNameIndex == networkPluginIndex_) {
        ParseNetwork(dataSeg);
    }
#endif
#ifdef ENABLE_DISKIO
    else if (pulginNameIndex == diskioPluginIndex_) {
        ParseDiskIO(dataSeg);
    }
#endif
#ifdef ENABLE_PROCESS
    else if (pulginNameIndex == processPluginIndex_) {
        ParseProcess(dataSeg);
    }
#endif
#ifdef ENABLE_HISYSEVENT
    else if (pulginNameIndex == hisyseventPluginIndex_) {
        ParseHisysevent(dataSeg);
    } else if (pulginNameIndex == hisyseventPluginConfigIndex_) {
        ParseHisyseventConfig(dataSeg);
    }
#endif
#ifdef ENABLE_ARKTS
    else if (pulginNameIndex == arktsPluginIndex_) {
        ParseJSMemory(pluginDataZero, dataSeg, isSplitFile);
    } else if (pulginNameIndex == arktsPluginConfigIndex_) {
        ParseJSMemoryConfig(dataSeg);
    }
#endif
#ifdef ENABLE_XPOWER
    else if (pulginNameIndex == xpowerPluginIndex_) {
        ParseXpower(dataSeg);
    }
#endif
#ifdef ENABLE_STREAM_EXTEND
    else if (pulginNameIndex == streamPluginIndex_) { // for trace extend demo
        ParseStream(dataSeg);
    }
#endif
}

void PbreaderParser::ParserData(PbreaderDataSegment &dataSeg, bool isSplitFile)
{
    ProtoReader::ProfilerPluginData_Reader pluginDataZero(reinterpret_cast<const uint8_t *>(dataSeg.seg->c_str()),
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
        TraceStreamerPluginOutFilter(reinterpret_cast<const char *>(pluginDataZero.data().data_),
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
void PbreaderParser::ParseThread()
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
        PbreaderDataSegment &dataSeg = dataSegArray_[head];
        ParserData(dataSeg, false);
    }
}

#ifdef ENABLE_MEMORY
void PbreaderParser::ParseMemory(const ProtoReader::ProfilerPluginData_Reader &pluginDataZero,
                                 PbreaderDataSegment &dataSeg)
{
    BuiltinClocks clockId = TS_CLOCK_REALTIME;
    dataSourceTypeMemClockid_ = clockId;
    dataSeg.dataType = DATA_SOURCE_TYPE_MEM;
    dataSeg.clockId = clockId;
    dataSeg.status = TS_PARSE_STATUS_PARSED;
}
void PbreaderParser::ParseMemoryConfig(PbreaderDataSegment &dataSeg,
                                       const ProtoReader::ProfilerPluginData_Reader &pluginDataZero)
{
    if (pluginDataZero.has_sample_interval()) {
        uint32_t sampleInterval = pluginDataZero.sample_interval();
        traceDataCache_->GetTraceConfigData()->AppendNewData("memory_config", "sample_interval",
                                                             std::to_string(sampleInterval));
    }
    dataSeg.dataType = DATA_SOURCE_TYPE_MEM_CONFIG;
    dataSeg.status = TS_PARSE_STATUS_PARSED;
}
#endif
#ifdef ENABLE_HILOG
void PbreaderParser::ParseHilog(PbreaderDataSegment &dataSeg)
{
    dataSeg.dataType = DATA_SOURCE_TYPE_HILOG;
    dataSourceTypeHilogClockid_ = TS_CLOCK_REALTIME;
    dataSeg.status = TS_PARSE_STATUS_PARSED;
}
#endif
#ifdef ENABLE_NATIVE_HOOK
void PbreaderParser::ParseNativeHookConfig(PbreaderDataSegment &dataSeg)
{
    dataSeg.dataType = DATA_SOURCE_TYPE_NATIVEHOOK_CONFIG;
    dataSeg.status = TS_PARSE_STATUS_PARSED;
}
void PbreaderParser::ParseNativeHook(PbreaderDataSegment &dataSeg, bool isSplitFile)
{
    dataSourceTypeNativeHookClockid_ = TS_CLOCK_REALTIME;
    dataSeg.dataType = DATA_SOURCE_TYPE_NATIVEHOOK;
    dataSeg.status = TS_PARSE_STATUS_PARSED;
    if (isSplitFile) {
        dataSourceType_ = DATA_SOURCE_TYPE_NATIVEHOOK;
    }
}
#endif

#ifdef ENABLE_HTRACE
void PbreaderParser::ParseFtrace(PbreaderDataSegment &dataSeg)
{
    dataSeg.dataType = DATA_SOURCE_TYPE_TRACE;
    ProtoReader::TracePluginResult_Reader tracePluginResult(dataSeg.protoData);
    if (tracePluginResult.has_ftrace_cpu_stats()) {
        ParseHtraceCpuStats(tracePluginResult, dataSeg);
        return;
    }
    bool haveSplitSeg = false;
    dataSeg.clockId = clock_;
    if (tracePluginResult.has_ftrace_cpu_detail()) {
        htraceCpuDetailParser_->Parse(dataSeg, tracePluginResult, haveSplitSeg);
    }
    if (tracePluginResult.has_symbols_detail()) {
        htraceSymbolsDetailParser_->Parse(dataSeg.protoData); // has Event
        haveSplitSeg = true;
    }
    if (tracePluginResult.has_clocks_detail()) {
        pbreaderClockDetailParser_->Parse(dataSeg.protoData); // has Event
        haveSplitSeg = true;
    }
    if (tracePluginResult.has_comm_dict()) {
        ParseHtraceCommDict(tracePluginResult);
    }
    if (traceDataCache_->isSplitFile_ && haveSplitSeg) {
        mPbreaderSplitData_.emplace(splitFileOffset_, nextLength_ + packetSegLength_);
    }
    if (tracePluginResult.has_ftrace_cpu_detail() || tracePluginResult.has_clocks_detail() ||
        tracePluginResult.has_symbols_detail() || tracePluginResult.has_comm_dict()) {
        dataSeg.status = TS_PARSE_STATUS_PARSED;
    } else {
        dataSeg.status = TS_PARSE_STATUS_INVALID;
    }
}
void PbreaderParser::ParseHtraceCpuStats(ProtoReader::TracePluginResult_Reader &tracePluginResult,
                                         PbreaderDataSegment &dataSeg)
{
    auto cpuStats = *tracePluginResult.ftrace_cpu_stats();
    ProtoReader::FtraceCpuStatsMsg_Reader ftraceCpuStatsMsg(cpuStats.data_, cpuStats.size_);
    auto s = *ftraceCpuStatsMsg.per_cpu_stats();
    ProtoReader::PerCpuStatsMsg_Reader perCpuStatsMsg(s.data_, s.size_);
    TS_LOGD("s.overrun():%" PRIu64 "", perCpuStatsMsg.overrun());
    TS_LOGD("s.dropped_events():%" PRIu64 "", perCpuStatsMsg.dropped_events());
    std::string clock = ftraceCpuStatsMsg.trace_clock().ToStdString();
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
}
void PbreaderParser::ParseHtraceCommDict(ProtoReader::TracePluginResult_Reader &tracePluginResult)
{
    for (auto it = tracePluginResult.comm_dict(); it; it++) {
        ProtoReader::CommDictMsg_Reader commDictMsg(it->ToBytes());
        commDict_.insert(std::make_pair<int32_t, std::string>(commDictMsg.tid(), commDictMsg.comm().ToStdString()));
    }
}
#endif
#ifdef ENABLE_FFRT
void PbreaderParser::ParseFfrtConfig(PbreaderDataSegment &dataSeg)
{
    pbreaderFfrtParser_->SetFfrtSrcClockid(dataSeg);
    dataSeg.dataType = DATA_SOURCE_TYPE_FFRT_CONFIG;
    dataSeg.status = TS_PARSE_STATUS_PARSED;
}
void PbreaderParser::ParseFfrt(PbreaderDataSegment &dataSeg)
{
    bool haveSplitSeg = false;
    pbreaderFfrtParser_->Parser(dataSeg, haveSplitSeg);
    if (haveSplitSeg) {
        mPbreaderSplitData_.emplace(splitFileOffset_, nextLength_ + packetSegLength_);
    }
    dataSeg.dataType = DATA_SOURCE_TYPE_FFRT;
    dataSeg.status = TS_PARSE_STATUS_PARSED;
}
#endif
#ifdef ENABLE_HTDUMP
void PbreaderParser::ParseFPS(PbreaderDataSegment &dataSeg)
{
    dataSeg.dataType = DATA_SOURCE_TYPE_FPS;
    dataSeg.status = TS_PARSE_STATUS_PARSED;
}
#endif

#ifdef ENABLE_CPUDATA
void PbreaderParser::ParseCpuUsage(PbreaderDataSegment &dataSeg)
{
    dataSourceTypeCpuClockid_ = TS_CLOCK_REALTIME;
    dataSeg.dataType = DATA_SOURCE_TYPE_CPU;
    dataSeg.status = TS_PARSE_STATUS_PARSED;
}
#endif
#ifdef ENABLE_NETWORK
void PbreaderParser::ParseNetwork(PbreaderDataSegment &dataSeg)
{
    dataSourceTypeNetworkClockid_ = TS_CLOCK_REALTIME;
    dataSeg.dataType = DATA_SOURCE_TYPE_NETWORK;
    dataSeg.status = TS_PARSE_STATUS_PARSED;
}
#endif
#ifdef ENABLE_XPOWER
void PbreaderParser::ParseXpower(PbreaderDataSegment &dataSeg)
{
    dataSeg.dataType = DATA_SOURCE_TYPE_XPOWER;
    dataSeg.status = TS_PARSE_STATUS_PARSED;
}
#endif
#ifdef ENABLE_DISKIO
void PbreaderParser::ParseDiskIO(PbreaderDataSegment &dataSeg)
{
    dataSourceTypeDiskioClockid_ = TS_CLOCK_REALTIME;
    dataSeg.dataType = DATA_SOURCE_TYPE_DISKIO;
    dataSeg.status = TS_PARSE_STATUS_PARSED;
}
#endif

#ifdef ENABLE_PROCESS
void PbreaderParser::ParseProcess(PbreaderDataSegment &dataSeg)
{
    dataSourceTypeProcessClockid_ = TS_CLOCK_BOOTTIME;
    dataSeg.dataType = DATA_SOURCE_TYPE_PROCESS;
    dataSeg.status = TS_PARSE_STATUS_PARSED;
}
#endif

#ifdef ENABLE_HISYSEVENT
void PbreaderParser::ParseHisysevent(PbreaderDataSegment &dataSeg)
{
    dataSourceTypeHisyseventClockid_ = TS_CLOCK_REALTIME;
    dataSeg.dataType = DATA_SOURCE_TYPE_HISYSEVENT;
    dataSeg.status = TS_PARSE_STATUS_PARSED;
}
void PbreaderParser::ParseHisyseventConfig(PbreaderDataSegment &dataSeg)
{
    dataSourceTypeHisyseventClockid_ = TS_CLOCK_REALTIME;
    dataSeg.dataType = DATA_SOURCE_TYPE_HISYSEVENT_CONFIG;
    dataSeg.status = TS_PARSE_STATUS_PARSED;
}
#endif

#ifdef ENABLE_ARKTS
void PbreaderParser::ParseJSMemory(const ProtoReader::ProfilerPluginData_Reader &pluginDataZero,
                                   PbreaderDataSegment &dataSeg,
                                   bool isSplitFile)
{
    if (isSplitFile) {
        dataSourceType_ = DATA_SOURCE_TYPE_JSMEMORY;
        profilerPluginData_.name = pluginDataZero.name().ToStdString();
        profilerPluginData_.status = pluginDataZero.status();
        profilerPluginData_.clockId = pluginDataZero.clock_id();
        profilerPluginData_.tvSec = pluginDataZero.tv_sec();
        profilerPluginData_.tvNsec = pluginDataZero.tv_nsec();
        profilerPluginData_.version = pluginDataZero.version().ToStdString();
        profilerPluginData_.sampleInterval = pluginDataZero.sample_interval();
    }
    dataSourceTypeJSMemoryClockid_ = TS_CLOCK_REALTIME;
    dataSeg.dataType = DATA_SOURCE_TYPE_JSMEMORY;
    dataSeg.status = TS_PARSE_STATUS_PARSED;
}
void PbreaderParser::ParseJSMemoryConfig(PbreaderDataSegment &dataSeg)
{
    dataSourceTypeJSMemoryClockid_ = TS_CLOCK_REALTIME;
    dataSeg.dataType = DATA_SOURCE_TYPE_JSMEMORY_CONFIG;
    dataSeg.status = TS_PARSE_STATUS_PARSED;
}
#endif

#ifdef ENABLE_STREAM_EXTEND
void PbreaderParser::ParseStream(PbreaderDataSegment &dataSeg)
{
    dataSeg.dataType = DATA_SOURCE_TYPE_STREAM;
    dataSeg.status = TS_PARSE_STATUS_PARSED;
}
#endif

int32_t PbreaderParser::GetNextSegment()
{
    int32_t head;
    std::lock_guard<std::mutex> muxLockGuard(pbreaderDataSegMux_);
    head = parseHead_;
    PbreaderDataSegment &pbreaderDataSegmentSeg = dataSegArray_[head];
    if (pbreaderDataSegmentSeg.status.load() != TS_PARSE_STATUS_SEPRATED) {
        if (toExit_) {
            parserThreadCount_--;
            TS_LOGI("exiting parser, parserThread Count:%d\n", parserThreadCount_);
            TS_LOGI("seprateHead_x:\t%d, parseHead_:\t%d, filterHead_:\t%d status:%d\n", rawDataHead_, parseHead_,
                    filterHead_, pbreaderDataSegmentSeg.status.load());
            if (!parserThreadCount_ && !filterThreadStarted_) {
                exited_ = true;
            }
            return ERROR_CODE_EXIT;
        }
        usleep(sleepDur_);
        return ERROR_CODE_NODATA;
    }
    parseHead_ = (parseHead_ + 1) % maxSegArraySize;
    pbreaderDataSegmentSeg.status = TS_PARSE_STATUS_PARSING;
    return head;
}
#ifdef ENABLE_EBPF
bool PbreaderParser::CalcEbpfCutOffset(std::deque<uint8_t>::iterator &packagesBegin, size_t &currentLength)
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
#endif

bool PbreaderParser::GetHeaderAndUpdateLengthMark(std::deque<uint8_t>::iterator &packagesBegin, size_t &currentLength)
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
        pbreaderCurentLength_ = profilerDataLength_ - packetHeaderLength_;
        hasGotHeader_ = true;
        if (!currentLength) {
            return false;
        }
    }
    return true;
}
#if IS_WASM
bool PbreaderParser::ParseSDKData()
{
    if (packagesBuffer_.size() >= profilerDataLength_ - packetHeaderLength_) {
        auto thirdPartySize = profilerDataLength_ - packetHeaderLength_;
        auto buffer = std::make_unique<uint8_t[]>(thirdPartySize).get();
        std::copy(packagesBuffer_.begin(), packagesBuffer_.begin() + thirdPartySize, buffer);
        TraceStreamerPluginOutFilter(reinterpret_cast<const char *>(buffer), thirdPartySize, standalonePluginName_);
        return true;
    }
    return false;
}
#endif

bool PbreaderParser::ParseSegLengthAndEnsureSegDataEnough(std::deque<uint8_t>::iterator &packagesBegin,
                                                          size_t &currentLength)
{
    std::string bufferLine;
    if (!hasGotSegLength_) {
        if (currentLength < packetSegLength_) {
            return false;
        }
        bufferLine.assign(packagesBegin, packagesBegin + packetSegLength_);
        const uint32_t *len = reinterpret_cast<const uint32_t *>(bufferLine.data());
        nextLength_ = *len;
        lenBuffer_ = bufferLine;
        pbreaderLength_ += nextLength_ + packetSegLength_;
        hasGotSegLength_ = true;
        currentLength -= packetSegLength_;
        packagesBegin += packetSegLength_;
        parsedFileOffset_ += packetSegLength_;
        splitFileOffset_ = profilerDataLength_ - pbreaderCurentLength_;
        pbreaderCurentLength_ -= packetSegLength_;
    }
    if (currentLength < nextLength_) {
        return false;
    }
    return true;
}
bool PbreaderParser::ParseDataRecursively(std::deque<uint8_t>::iterator &packagesBegin, size_t &currentLength)
{
    TS_CHECK_TRUE_RET(GetHeaderAndUpdateLengthMark(packagesBegin, currentLength), false);
#ifdef ENABLE_HIPERF
    if (profilerDataType_ == ProfilerTraceFileHeader::HIPERF_DATA) {
        return ParseHiperfData(packagesBegin, currentLength);
    }
#endif
    if (profilerDataType_ == ProfilerTraceFileHeader::STANDALONE_DATA) {
        if (EBPF_PLUGIN_NAME.compare(standalonePluginName_) == 0) {
#ifdef ENABLE_EBPF
            return CalcEbpfCutOffset(packagesBegin, currentLength);
#else
            return false;
#endif
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
        if (nextLength_ > pbreaderCurentLength_) {
            TS_LOGE("fatal error, data length not match nextLength_:%u, pbreaderCurentLength_:%" PRIu64 "", nextLength_,
                    pbreaderCurentLength_);
        }
        pbreaderCurentLength_ -= nextLength_;
        if (pbreaderCurentLength_ == 0) {
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

void PbreaderParser::ParseTraceDataSegment(std::unique_ptr<uint8_t[]> bufferStr, size_t size, bool isFinish)
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
#ifdef ENABLE_HIPERF
bool PbreaderParser::ParseHiperfData(std::deque<uint8_t>::iterator &packagesBegin, size_t &currentLength)
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
void PbreaderParser::StoreTraceDataSegment(std::unique_ptr<uint8_t[]> bufferStr, size_t size, int32_t isFinish)
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
void PbreaderParser::TraceDataSegmentEnd(bool isSplitFile)
{
    perfDataParser_->InitPerfDataAndLoad(packagesBuffer_, packagesBuffer_.size(), 0, isSplitFile, true);
    packagesBuffer_.clear();
    return;
}
#endif

bool PbreaderParser::InitProfilerTraceFileHeader()
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
    ProfilerTraceFileHeader *pHeader = reinterpret_cast<ProfilerTraceFileHeader *>(buffer);
    if (pHeader->data.length <= packetHeaderLength_ || pHeader->data.magic != ProfilerTraceFileHeader::HEADER_MAGIC) {
        TS_LOGE("Profiler Trace data is truncated or invalid magic! len = %" PRIu64 ", maigc = %" PRIx64 "",
                pHeader->data.length, pHeader->data.magic);
        return false;
    }
    if (pHeader->data.dataType == ProfilerTraceFileHeader::HIPERF_DATA) {
#ifdef ENABLE_HIPERF
        perfDataParser_->RecordPerfProfilerHeader(buffer, packetHeaderLength_);
#endif
    } else if (pHeader->data.dataType == ProfilerTraceFileHeader::STANDALONE_DATA &&
               EBPF_PLUGIN_NAME.compare(pHeader->data.standalonePluginName) == 0) {
#ifdef ENABLE_EBPF
        ebpfDataParser_->RecordEbpfProfilerHeader(buffer, packetHeaderLength_);
#endif
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
    TraceStreamerPluginOutSendData(reinterpret_cast<char *>(buffer), packetHeaderLength_, DATA_TYPE_CLOCK);
#endif
    pbreaderClockDetailParser_->Parse(pHeader);
    return true;
}

#if defined(ENABLE_HTRACE) && defined(ENABLE_NATIVE_HOOK) && defined(ENABLE_HIPERF)
void PbreaderParser::ParseNapiAsync()
{
    // 将native memory中存在的traceid取出, 并记录其对应的callstackid
    std::unordered_map<std::string, uint32_t> traceidToCallchainidMap;
    GetTraceidInfoFromNativeHook(traceidToCallchainidMap);

    // 从callstack表中获取所有的traceid, 根据其所属的itid将SliceInfo存入对应queue
    std::unordered_map<uint64_t, std::queue<SliceInfo>> itidToCallstackIdsMap;
    GetTraceidInfoFromCallstack(traceidToCallchainidMap, itidToCallstackIdsMap);

    // 筛选出包含NativeAsyncWork::AsyncWorkCallback的函数栈的callchainid, 将其存入callchainIdSet
    std::unordered_set<uint32_t> callchainIdSet;
    GetCallchainIdSetFromHiperf(callchainIdSet);

    DumpDataFromHiperf(traceidToCallchainidMap, callchainIdSet, itidToCallstackIdsMap);
}

void PbreaderParser::GetTraceidInfoFromNativeHook(std::unordered_map<std::string, uint32_t> &traceidToCallchainidMap)
{
    auto nativeHook = traceDataCache_->GetConstNativeHookData();
    std::string preWord("napi:");
    for (int i = 0; i < nativeHook.Size(); i++) {
        auto subType = nativeHook.SubTypes()[i];
        if (subType == INVALID_UINT64) {
            continue;
        }
        auto subTypeStr = traceDataCache_->GetDataFromDict(subType);
        if (!StartWith(subTypeStr, preWord)) {
            continue;
        }
        auto pos = subTypeStr.find(preWord) + preWord.size();
        auto traceidStr = subTypeStr.substr(pos, subTypeStr.find_last_of(':') - pos);
        auto traceidIndex = traceDataCache_->GetDataIndex(traceidStr);
        traceidToCallchainidMap.emplace(std::move(traceidStr), nativeHook.CallChainIds()[i]);
    }
}

void PbreaderParser::GetTraceidInfoFromCallstack(
    const std::unordered_map<std::string, uint32_t> &traceidToCallchainidMap,
    std::unordered_map<uint64_t, std::queue<SliceInfo>> &itidToCallstackIdsMap)
{
    auto callStack = traceDataCache_->GetConstInternalSlicesData();
    std::string preWord("traceid:");
    std::string invalidTraceidStr("0x0");
    for (int i = 0; i < callStack.Size(); i++) {
        auto name = traceDataCache_->GetDataFromDict(callStack.NamesData()[i]);
        if (!StartWith(name, "H:Native async work execute callback") || callStack.DursData()[i] == INVALID_UINT64) {
            continue;
        }
        auto preWordPos = name.find(preWord);
        if (preWordPos == std::string::npos) {
            continue;
        }
        auto beginPos = preWordPos + preWord.size();
        if (beginPos + 1 >= name.size()) {
            continue;
        }
        auto endPos = name.find_first_of('|', beginPos + 1);
        if (endPos == std::string::npos) {
            continue;
        }
        auto traceidStr = name.substr(beginPos, endPos - beginPos);
        if (traceidStr == invalidTraceidStr) {
            continue;
        }
        if (traceidToCallchainidMap.find(traceidStr) == traceidToCallchainidMap.end()) {
            continue;
        }
        auto iter = itidToCallstackIdsMap.find(callStack.CallIds()[i]);
        if (iter == itidToCallstackIdsMap.end()) {
            itidToCallstackIdsMap.emplace(callStack.CallIds()[i], std::queue<SliceInfo>());
            iter = itidToCallstackIdsMap.find(callStack.CallIds()[i]);
        }
        iter->second.emplace(callStack.TimeStampData()[i], callStack.TimeStampData()[i] + callStack.DursData()[i],
                             traceidStr);
    }
}

void PbreaderParser::GetCallchainIdSetFromHiperf(std::unordered_set<uint32_t> &callchainIdSet)
{
    auto perfCallChain = traceDataCache_->GetConstPerfCallChainData();
    std::string asyncWork("NativeAsyncWork::AsyncWorkCallback");
    for (int i = 0; i < perfCallChain.Size(); i++) {
        auto callchainId = perfCallChain.CallChainIds()[i];
        if (callchainIdSet.find(callchainId) != callchainIdSet.end()) {
            continue;
        }
        auto nameIndex = perfCallChain.Names()[i];
        if (nameIndex == INVALID_UINT64) {
            continue;
        }
        auto name = traceDataCache_->GetDataFromDict(nameIndex);
        if (name.find(asyncWork) != std::string::npos) {
            callchainIdSet.emplace(perfCallChain.CallChainIds()[i]);
        }
    }
}

void PbreaderParser::DumpDataFromHiperf(const std::unordered_map<std::string, uint32_t> &traceidToCallchainidMap,
                                        const std::unordered_set<uint32_t> &callchainIdSet,
                                        std::unordered_map<uint64_t, std::queue<SliceInfo>> &itidToCallstackIdsMap)
{
    auto perfThread = traceDataCache_->GetConstPerfThreadData();
    std::unordered_map<uint32_t, uint32_t> tidToPidMap;
    for (size_t i = 0; i < perfThread.Size(); i++) {
        tidToPidMap.emplace(perfThread.Tids()[i], perfThread.Pids()[i]);
    }
    auto perfSample = traceDataCache_->GetConstPerfSampleData();
    auto callStack = traceDataCache_->GetConstInternalSlicesData();
    for (size_t i = 0; i < perfSample.Size(); i++) {
        // callchainid未命中, 即当前栈不包含NativeAsyncWork::AsyncWorkCallback
        if (callchainIdSet.find(perfSample.SampleIds()[i]) == callchainIdSet.end()) {
            continue;
        }
        // 根据tid和tsPerfSample查询对应的SliceInfo
        auto itid = streamFilters_->processFilter_->GetInternalTid(perfSample.Tids()[i]);
        if (itidToCallstackIdsMap.find(itid) == itidToCallstackIdsMap.end()) {
            continue;
        }
        auto tsPerfSample = perfSample.TimestampTraces()[i];
        auto queue = itidToCallstackIdsMap.at(itid);
        while (!queue.empty() && queue.front().tsEnd_ < tsPerfSample) {
            queue.pop();
        }
        if (queue.empty() || tsPerfSample < queue.front().tsBegin_) {
            continue;
        }
        // 根据traceid查询native侧的callchainid
        auto iterNative = traceidToCallchainidMap.find(queue.front().traceid_);
        if (iterNative == traceidToCallchainidMap.end()) {
            continue;
        }
        // 根据tid查询pid
        auto iterPid = tidToPidMap.find(perfSample.Tids()[i]);
        if (iterPid == tidToPidMap.end()) {
            continue;
        }
        PerfNapiAsyncRow perfNapiAsyncRow{
            .timeStamp = tsPerfSample,
            .traceid = traceDataCache_->GetDataIndex(queue.front().traceid_),
            .cpuId = static_cast<uint8_t>(perfSample.CpuIds()[i]),
            .threadId = perfSample.Tids()[i],
            .processId = iterPid->second,
            .callerCallchainid = iterNative->second,
            .calleeCallchainid = perfSample.SampleIds()[i],
            .perfSampleId = i,
            .eventCount = perfSample.EventCounts()[i],
            .eventTypeId = perfSample.EventTypeIds()[i],
        };
        traceDataCache_->GetPerfNapiAsyncData()->AppendNewPerfNapiAsync(perfNapiAsyncRow);
    }
}
#endif
} // namespace TraceStreamer
} // namespace SysTuning
