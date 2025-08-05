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

#ifndef PBREADER_PARSER_H
#define PBREADER_PARSER_H
#include <cstdint>
#include <limits>
#include <map>
#include <queue>
#include <stdexcept>
#include <string>
#include <thread>
#include <unordered_map>
#include <unordered_set>
#include "common_types.h"
#include "common_types.pbreader.h"
#include "clock_filter_ex.h"
#ifdef ENABLE_EBPF
#include "ebpf_data_parser.h"
#endif
#include "file.h"
#ifdef ENABLE_HTRACE
#include "htrace_cpu_detail_parser.h"
#include "htrace_symbols_detail_parser.h"
#endif
#include "htrace_plugin_time_parser.h"
#include "parser_base.h"
#include "pbreader_clock_detail_parser.h"
#include "pbreader_file_header.h"
#ifdef ENABLE_FFRT
#include "pbreader_ffrt_parser.h"
#endif
#ifdef ENABLE_CPUDATA
#include "pbreader_cpu_data_parser.h"
#endif
#ifdef ENABLE_DISKIO
#include "pbreader_disk_io_parser.h"
#endif
#ifdef ENABLE_HTDUMP
#include "pbreader_hidump_parser.h"
#endif
#ifdef ENABLE_HILOG
#include "pbreader_hilog_parser.h"
#endif
#ifdef ENABLE_HISYSEVENT
#include "pbreader_hisysevent_parser.h"
#endif
#ifdef ENABLE_ARKTS
#include "pbreader_js_memory_parser.h"
#endif
#ifdef ENABLE_MEMORY
#include "pbreader_mem_parser.h"
#endif
#ifdef ENABLE_NATIVE_HOOK
#include "pbreader_native_hook_parser.h"
#endif
#ifdef ENABLE_NETWORK
#include "pbreader_network_parser.h"
#endif
#ifdef ENABLE_PROCESS
#include "pbreader_process_parser.h"
#endif
#ifdef ENABLE_STREAM_EXTEND
#include "pbreader_stream_parser.h"
#endif
#ifdef ENABLE_XPOWER
#include "pbreader_xpower_parser.h"
#endif
#ifdef ENABLE_HIPERF
#include "perf_data_parser.h"
#endif
#include "proto_reader_help.h"
#include "string_help.h"
#include "trace_data_cache.h"
#include "trace_streamer_filters.h"
#include "ts_common.h"

namespace SysTuning {
namespace TraceStreamer {
using namespace SysTuning::base;
#if defined(ENABLE_HTRACE) && defined(ENABLE_NATIVE_HOOK) && defined(ENABLE_HIPERF)
struct SliceInfo {
    SliceInfo(uint64_t tsBegin, uint64_t tsEnd, const std::string &traceid)
        : tsBegin_(tsBegin), tsEnd_(tsEnd), traceid_(traceid){};
    uint64_t tsBegin_ = INVALID_UINT64;
    uint64_t tsEnd_ = INVALID_UINT64;
    std::string traceid_;
};
#endif
class PbreaderParser : public ParserBase, public HtracePluginTimeParser {
public:
    PbreaderParser(TraceDataCache *dataCache, const TraceStreamerFilters *filters);
    ~PbreaderParser();
    void ParseTraceDataSegment(std::unique_ptr<uint8_t[]> bufferStr, size_t size, bool isFinish = false) override;
    bool ReparseSymbolFileAndResymbolization(const std::string &directory, const std::string &fileName);
    void WaitForParserEnd();
#ifdef ENABLE_ARKTS
    void EnableFileSeparate(bool enabled);
#endif
#if defined(ENABLE_HIPERF) || defined(ENABLE_NATIVE_HOOK) || defined(ENABLE_EBPF)
    std::unique_ptr<SymbolsFile> ParseELF(const std::string &directory, const std::string &fileName);
#endif
#ifdef ENABLE_HIPERF
    void TraceDataSegmentEnd(bool isSplitFile);
    void StoreTraceDataSegment(std::unique_ptr<uint8_t[]> bufferStr, size_t size, int32_t isFinish);
#endif
    const auto &GetPbreaderSplitData()
    {
        return mPbreaderSplitData_;
    }
    auto GetProfilerHeader()
    {
        return profilerTraceFileHeader_;
    }
#ifdef ENABLE_NATIVE_HOOK
    auto ClearNativehookData()
    {
        pbreaderNativeHookParser_->FinishSplitNativeHook();
    }
#endif
    auto GetDataSourceType()
    {
        return dataSourceType_;
    }
#ifdef ENABLE_ARKTS
    auto GetJsMemoryData()
    {
        return jsMemoryParser_.get();
    }
    auto GetArkTsConfigData()
    {
        return arkTsConfigData_;
    }
#endif
    auto ClearPbreaderSplitData()
    {
#ifdef ENABLE_HIPERF
        perfDataParser_->ClearPerfSplitResult();
        perfProcessedLen_ = 0;
#endif
#ifdef ENABLE_EBPF
        ebpfDataParser_->ClearEbpfSplitResult();
        hasInitEbpfPublicData_ = false;
        parsedEbpfOver_ = false;
#endif
        processedDataLen_ = 0;
        splitFileOffset_ = 0;
        hasGotHeader_ = false;
        return mPbreaderSplitData_.clear();
    }
#ifdef ENABLE_HIPERF
    const auto &GetPerfSplitResult()
    {
        return perfDataParser_->GetPerfSplitResult();
    }
#endif
#ifdef ENABLE_EBPF
    const auto &GetEbpfDataParser()
    {
        return ebpfDataParser_;
    }
#endif
#ifdef ENABLE_HTRACE
    void EnableOnlyParseFtrace()
    {
        onlyParseFtrace_ = true;
    }
#endif

private:
    bool ParseDataRecursively(std::deque<uint8_t>::iterator &packagesBegin, size_t &currentLength);
#ifdef ENABLE_HIPERF
    bool ParseHiperfData(std::deque<uint8_t>::iterator &packagesBegin, size_t &currentLength);
#endif
    void ParseTraceDataItem(const std::string &buffer) override;
    void FilterData(PbreaderDataSegment &seg, bool isSplitFile);
    void ParserData(PbreaderDataSegment &dataSeg, bool isSplitFile);

private:
#if IS_WASM
    bool ParseSDKData();
#endif
    void InitPluginNameIndex();
    void InitHookPluginNameIndex();
    void InitMemoryPluginNameIndex();
    void InitHiPluginNameIndex();
    void WaitForHPluginParserEnd();
    void WaitForOtherPluginParserEnd();
    bool GetHeaderAndUpdateLengthMark(std::deque<uint8_t>::iterator &packagesBegin, size_t &currentLength);
    bool ParseSegLengthAndEnsureSegDataEnough(std::deque<uint8_t>::iterator &packagesBegin, size_t &currentLength);
#ifdef ENABLE_MEMORY
    void ParseMemory(const ProtoReader::ProfilerPluginData_Reader &pluginDataZero, PbreaderDataSegment &dataSeg);
    void ParseMemoryConfig(PbreaderDataSegment &dataSeg, const ProtoReader::ProfilerPluginData_Reader &pluginDataZero);
#endif
#ifdef ENABLE_HILOG
    void ParseHilog(PbreaderDataSegment &dataSeg);
#endif
#ifdef ENABLE_HTRACE
    void ParseFtrace(PbreaderDataSegment &dataSeg);
#endif
#ifdef ENABLE_FFRT
    void ParseFfrtConfig(PbreaderDataSegment &dataSeg);
    void ParseFfrt(PbreaderDataSegment &dataSeg);
#endif
#ifdef ENABLE_HTDUMP
    void ParseFPS(PbreaderDataSegment &dataSeg);
#endif
#ifdef ENABLE_CPUDATA
    void ParseCpuUsage(PbreaderDataSegment &dataSeg);
#endif
#ifdef ENABLE_NETWORK
    void ParseNetwork(PbreaderDataSegment &dataSeg);
#endif
#ifdef ENABLE_XPOWER
    void ParseXpower(PbreaderDataSegment &dataSeg);
#endif
#ifdef ENABLE_DISKIO
    void ParseDiskIO(PbreaderDataSegment &dataSeg);
#endif
#ifdef ENABLE_PROCESS
    void ParseProcess(PbreaderDataSegment &dataSeg);
#endif
#ifdef ENABLE_HISYSEVENT
    void ParseHisysevent(PbreaderDataSegment &dataSeg);
    void ParseHisyseventConfig(PbreaderDataSegment &dataSeg);
#endif
#ifdef ENABLE_NATIVE_HOOK
    void ParseNativeHookConfig(PbreaderDataSegment &dataSeg);
    void ParseNativeHook(PbreaderDataSegment &dataSeg, bool isSplitFile);
#endif
#ifdef ENABLE_ARKTS
    void ParseJSMemory(const ProtoReader::ProfilerPluginData_Reader &pluginDataZero,
                       PbreaderDataSegment &dataSeg,
                       bool isSplitFile);
    void ParseJSMemoryConfig(PbreaderDataSegment &dataSeg);
#endif
#ifdef ENABLE_STREAM_EXTEND
    void ParseStream(PbreaderDataSegment &dataSeg);
#endif
    void ParseThread();
    int32_t GetNextSegment();
    void FilterThread();
#ifdef ENABLE_EBPF
    bool CalcEbpfCutOffset(std::deque<uint8_t>::iterator &packagesBegin, size_t &currentLength);
#endif
    bool SpliteConfigData(const std::string &pluginName, const PbreaderDataSegment &dataSeg);
    bool InitProfilerTraceFileHeader();
    void ParseDataByPluginName(PbreaderDataSegment &dataSeg,
                               DataIndex pulginNameIndex,
                               const ProtoReader::ProfilerPluginData_Reader &pluginDataZero,
                               bool isSplitFile);
    bool SpliteDataBySegment(DataIndex pluginNameIndex, PbreaderDataSegment &dataSeg);
#if defined(ENABLE_HTRACE) && defined(ENABLE_NATIVE_HOOK) && defined(ENABLE_HIPERF)
    void ParseNapiAsync();
    void GetTraceidInfoFromCallstack(const std::unordered_map<std::string, uint32_t> &traceidToCallchainidMap,
                                     std::unordered_map<uint64_t, std::queue<SliceInfo>> &itidToCallstackIdsMap);
    void GetTraceidInfoFromNativeHook(std::unordered_map<std::string, uint32_t> &traceidToCallchainidMap);
    void GetCallchainIdSetFromHiperf(std::unordered_set<uint32_t> &callchainIdSet);
    void DumpDataFromHiperf(const std::unordered_map<std::string, uint32_t> &traceidToCallchainidMap,
                            const std::unordered_set<uint32_t> &callchainIdSet,
                            std::unordered_map<uint64_t, std::queue<SliceInfo>> &itidToCallstackIdsMap);
#endif
    ProfilerTraceFileHeader profilerTraceFileHeader_;
    uint32_t profilerDataType_ = ProfilerTraceFileHeader::UNKNOW_TYPE;
    uint64_t profilerDataLength_ = 0;
    ProfilerPluginDataHeader profilerPluginData_;
    uint64_t pbreaderCurentLength_ = 0;
    char standalonePluginName_[ProfilerTraceFileHeader::PLUGIN_MODULE_NAME_MAX + 1] = "";
    bool hasGotSegLength_ = false;
    bool hasGotHeader_ = false;
    uint32_t nextLength_ = 0;
    const size_t packetSegLength_ = 4;
    const size_t packetHeaderLength_ = 1024;
    TraceDataCache *traceDataCache_;
    std::unique_ptr<PbreaderClockDetailParser> pbreaderClockDetailParser_;
#ifdef ENABLE_HTRACE
    std::unique_ptr<HtraceCpuDetailParser> htraceCpuDetailParser_;
    std::unique_ptr<HtraceSymbolsDetailParser> htraceSymbolsDetailParser_;
    ClockId dataSourceTypeTraceClockid_ = TS_CLOCK_UNKNOW;
    bool onlyParseFtrace_ = false;
#endif
    std::set<DataIndex> ftracePluginIndex_ = {};
#ifdef ENABLE_FFRT
    DataIndex ffrtPluginIndex_ = {};
    DataIndex ffrtPluginConfigIndex_ = {};
    std::unique_ptr<PbreaderFfrtDetailParser> pbreaderFfrtParser_;
#endif
#ifdef ENABLE_MEMORY
    std::unique_ptr<PbreaderMemParser> pbreaderMemParser_;
    ClockId dataSourceTypeMemClockid_ = TS_CLOCK_UNKNOW;
    DataIndex memPluginIndex_;
    DataIndex memoryPluginConfigIndex_;
#endif
#ifdef ENABLE_HTDUMP
    std::unique_ptr<PbreaderHidumpParser> pbreaderHidumpParser_;
    std::set<DataIndex> hidumpPluginIndex_ = {};
    ClockId dataSourceTypeFpsClockid_ = TS_CLOCK_UNKNOW;
#endif
#ifdef ENABLE_CPUDATA
    std::unique_ptr<PbreaderCpuDataParser> cpuUsageParser_;
    ClockId dataSourceTypeCpuClockid_ = TS_CLOCK_UNKNOW;
    DataIndex cpuPluginIndex_;
#endif
#ifdef ENABLE_NETWORK
    std::unique_ptr<PbreaderNetworkParser> networkParser_;
    ClockId dataSourceTypeNetworkClockid_ = TS_CLOCK_UNKNOW;
    DataIndex networkPluginIndex_;
#endif
#ifdef ENABLE_DISKIO
    std::unique_ptr<PbreaderDiskIOParser> diskIOParser_;
    ClockId dataSourceTypeDiskioClockid_ = TS_CLOCK_UNKNOW;
    DataIndex diskioPluginIndex_;
#endif
#ifdef ENABLE_PROCESS
    std::unique_ptr<PbreaderProcessParser> processParser_;
    ClockId dataSourceTypeProcessClockid_ = TS_CLOCK_UNKNOW;
    DataIndex processPluginIndex_;
#endif
#ifdef ENABLE_HISYSEVENT
    std::unique_ptr<PbreaderHisyseventParser> hisyseventParser_;
    ClockId dataSourceTypeHisyseventClockid_ = TS_CLOCK_UNKNOW;
    DataIndex hisyseventPluginIndex_;
    DataIndex hisyseventPluginConfigIndex_;
#endif
#ifdef ENABLE_ARKTS
    std::unique_ptr<PbreaderJSMemoryParser> jsMemoryParser_;
    ClockId dataSourceTypeJSMemoryClockid_ = TS_CLOCK_UNKNOW;
#endif
#ifdef ENABLE_HIPERF
    uint64_t perfProcessedLen_ = 0;
    std::unique_ptr<PerfDataParser> perfDataParser_;
#endif
#ifdef ENABLE_EBPF
    std::unique_ptr<EbpfDataParser> ebpfDataParser_;
    bool hasInitEbpfPublicData_ = false;
    bool parsedEbpfOver_ = false;
#endif
#ifdef ENABLE_NATIVE_HOOK
    std::unique_ptr<PbreaderNativeHookParser> pbreaderNativeHookParser_;
    ClockId dataSourceTypeNativeHookClockid_ = TS_CLOCK_UNKNOW;
    std::set<DataIndex> nativeHookPluginIndex_ = {};
    DataIndex nativeHookConfigIndex_;
#endif
#ifdef ENABLE_HILOG
    std::set<DataIndex> hilogPluginIndex_ = {};
    std::unique_ptr<PbreaderHiLogParser> pbreaderHiLogParser_;
    ClockId dataSourceTypeHilogClockid_ = TS_CLOCK_UNKNOW;
#endif
#ifdef ENABLE_XPOWER
    std::unique_ptr<PbreaderXpowerParser> xpowerParser_;
    DataIndex xpowerPluginIndex_;
#endif
#ifdef ENABLE_STREAM_EXTEND
    DataIndex streamPluginIndex_;
    std::unique_ptr<PbreaderStreamParser> pbreaderStreamParser_;
#endif
    std::unique_ptr<PbreaderDataSegment[]> dataSegArray_;
    std::atomic<bool> filterThreadStarted_{false};
    const int32_t maxSegArraySize = 10000;
    int32_t rawDataHead_ = 0;
    bool toExit_ = false;
    bool exited_ = false;
    int32_t filterHead_ = 0;
    int32_t parseHead_ = 0;
    size_t pbreaderLength_ = 1024;
    const int32_t sleepDur_ = 100;
    bool parseThreadStarted_ = false;
    int32_t parserThreadCount_ = 0;
    std::mutex pbreaderDataSegMux_ = {};
    std::map<int32_t, int32_t> mPbreaderSplitData_ = {};
    uint64_t splitFileOffset_ = 0;
    uint64_t processedDataLen_ = 0;
    uint64_t parsedFileOffset_ = 0;
    uint32_t dataSourceType_ = INVALID_UINT32;
    std::string arkTsConfigData_ = "";
    std::string lenBuffer_ = "";
    DataIndex arktsPluginIndex_;
    DataIndex arktsPluginConfigIndex_;
    std::set<DataIndex> supportPluginNameIndex_ = {};
};
} // namespace TraceStreamer
} // namespace SysTuning

#endif // HTRACE_PARSER_H_
