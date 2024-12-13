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

#include "trace_streamer_selector.h"
#include <algorithm>
#include <chrono>
#include <cstdlib>
#include <fstream>
#include <functional>
#include <regex>
#include "animation_filter.h"
#include "app_start_filter.h"
#include "args_filter.h"
#include "binder_filter.h"
#include "clock_filter_ex.h"
#include "cpu_filter.h"
#include "file.h"
#include "filter_filter.h"
#include "frame_filter.h"
#ifdef ENABLE_HISYSEVENT
#include "hi_sysevent_measure_filter.h"
#endif
#include "irq_filter.h"
#include "measure_filter.h"
#include "pbreader_parser.h"
#ifdef ENABLE_HIPERF
#include "perf_data_filter.h"
#endif
#include "process_filter.h"
#include "ptreader_parser.h"
#ifdef ENABLE_RAWTRACE
#include "rawtrace_parser.h"
#endif
#include "slice_filter.h"
#include "stat_filter.h"
#include "string_help.h"
#include "system_event_measure_filter.h"
#include "task_pool_filter.h"

namespace {
const uint32_t CHUNK_SIZE = 1024 * 1024;
constexpr uint16_t RAW_TRACE_MAGIC_NUMBER = 57161;
} // namespace
using namespace SysTuning::base;
namespace SysTuning {
namespace TraceStreamer {
namespace {
bool IsHisysEventData(const std::string &bytraceMode)
{
    auto firstLine = std::find(bytraceMode.begin(), bytraceMode.end(), '}');
    if (firstLine == bytraceMode.end()) {
        return false;
    }
    std::string line(bytraceMode.begin(), ++firstLine);
    json jMessage;
    if (!jMessage.accept(line)) {
        return false;
    }
    std::string startStr = R"({"domain_":)";
    if (!StartWith(line, startStr)) {
        return false;
    }
    return true;
}
TraceFileType GuessFileType(const uint8_t *data, size_t size)
{
    if (size == 0) {
        return TRACE_FILETYPE_UN_KNOW;
    }
    std::string start(reinterpret_cast<const char *>(data), std::min<size_t>(size, 20));
    if (start.find("# tracer") != std::string::npos || start.find("# TRACE") != std::string::npos) {
        return TRACE_FILETYPE_BY_TRACE;
    }
#ifdef ENABLE_RAWTRACE
    uint16_t magicNumber = INVALID_UINT16;
    int ret = memcpy_s(&magicNumber, sizeof(uint16_t), data, sizeof(uint16_t));
    TS_CHECK_TRUE(ret == EOK, TRACE_FILETYPE_UN_KNOW, "Memcpy FAILED!Error code is %d, data size is %zu.", ret, size);
    if (magicNumber == RAW_TRACE_MAGIC_NUMBER) {
        return TRACE_FILETYPE_RAW_TRACE;
    }
#endif
    std::string lowerStart(start);
    transform(start.begin(), start.end(), lowerStart.begin(), ::tolower);
    if ((lowerStart.compare(0, std::string("<!doctype html>").length(), "<!doctype html>") == 0) ||
        (lowerStart.compare(0, std::string("<html>").length(), "<html>") == 0)) {
        return TRACE_FILETYPE_BY_TRACE;
    }
    if (start.compare(0, std::string("\x0a").length(), "\x0a") == 0) {
        return TRACE_FILETYPE_UN_KNOW;
    }
    if (start.compare(0, std::string("OHOSPROF").length(), "OHOSPROF") == 0) {
        return TRACE_FILETYPE_H_TRACE;
    }
#ifdef ENABLE_HIPERF
    if (start.compare(0, std::string("PERFILE2").length(), "PERFILE2") == 0) {
        return TRACE_FILETYPE_PERF;
    }
#endif
    const std::regex bytraceMatcher = std::regex(R"(-(\d+)\s+\(?\s*(\d+|-+)?\)?\s?\[(\d+)\]\s*)"
                                                 R"([a-zA-Z0-9.]{0,5}\s+(\d+\.\d+):\s+(\S+):)");
    std::smatch matcheLine;
    std::string bytraceMode(reinterpret_cast<const char *>(data), size);
    if (std::regex_search(bytraceMode, matcheLine, bytraceMatcher)) {
        return TRACE_FILETYPE_BY_TRACE;
    }

    const std::regex hilogMatcher = std::regex(R"( *(\w+ )?([\-\d: ]+\.\d+) +(\d+) +(\d+) +([FEWID]) +(.+?): +(.+))");
    if (std::regex_search(bytraceMode, matcheLine, hilogMatcher)) {
        return TRACE_FILETYPE_HILOG;
    }
    // Identify hisysevent data
    if (IsHisysEventData(bytraceMode)) {
        return TRACE_FILETYPE_HI_SYSEVENT;
    }
    return TRACE_FILETYPE_UN_KNOW;
}
} // namespace

TraceStreamerSelector::TraceStreamerSelector()
    : ptreaderParser_(nullptr),
      pbreaderParser_(nullptr),
#ifdef ENABLE_RAWTRACE
      rawTraceParser_(nullptr),
#endif
      fileType_(TRACE_FILETYPE_UN_KNOW)
{
    InitFilter();
}
TraceStreamerSelector::~TraceStreamerSelector() {}

void TraceStreamerSelector::InitFilter()
{
    streamFilters_ = std::make_unique<TraceStreamerFilters>();
    traceDataCache_ = std::make_unique<TraceDataCache>();
    streamFilters_->animationFilter_ = std::make_unique<AnimationFilter>(traceDataCache_.get(), streamFilters_.get());
    streamFilters_->cpuFilter_ = std::make_unique<CpuFilter>(traceDataCache_.get(), streamFilters_.get());
    streamFilters_->sliceFilter_ = std::make_unique<SliceFilter>(traceDataCache_.get(), streamFilters_.get());

    streamFilters_->processFilter_ = std::make_unique<ProcessFilter>(traceDataCache_.get(), streamFilters_.get());
    streamFilters_->clockFilter_ = std::make_unique<ClockFilterEx>(traceDataCache_.get(), streamFilters_.get());
    streamFilters_->filterFilter_ = std::make_unique<FilterFilter>(traceDataCache_.get(), streamFilters_.get());
    streamFilters_->measureFilter_ = std::make_unique<MeasureFilter>(traceDataCache_.get(), streamFilters_.get());
    streamFilters_->statFilter_ = std::make_unique<StatFilter>(traceDataCache_.get(), streamFilters_.get());
    streamFilters_->binderFilter_ = std::make_unique<BinderFilter>(traceDataCache_.get(), streamFilters_.get());
    streamFilters_->argsFilter_ = std::make_unique<ArgsFilter>(traceDataCache_.get(), streamFilters_.get());
    streamFilters_->irqFilter_ = std::make_unique<IrqFilter>(traceDataCache_.get(), streamFilters_.get());
    streamFilters_->frameFilter_ = std::make_unique<FrameFilter>(traceDataCache_.get(), streamFilters_.get());
    streamFilters_->sysEventMemMeasureFilter_ =
        std::make_unique<SystemEventMeasureFilter>(traceDataCache_.get(), streamFilters_.get(), E_SYS_MEMORY_FILTER);
    streamFilters_->sysEventVMemMeasureFilter_ = std::make_unique<SystemEventMeasureFilter>(
        traceDataCache_.get(), streamFilters_.get(), E_SYS_VIRTUAL_MEMORY_FILTER);
    streamFilters_->appStartupFilter_ = std::make_unique<APPStartupFilter>(traceDataCache_.get(), streamFilters_.get());
#ifdef ENABLE_HIPERF
    streamFilters_->perfDataFilter_ = std::make_unique<PerfDataFilter>(traceDataCache_.get(), streamFilters_.get());
#endif
    streamFilters_->sysEventSourceFilter_ = std::make_unique<SystemEventMeasureFilter>(
        traceDataCache_.get(), streamFilters_.get(), E_SYS_EVENT_SOURCE_FILTER);
#ifdef ENABLE_HISYSEVENT
    streamFilters_->hiSysEventMeasureFilter_ =
        std::make_unique<HiSysEventMeasureFilter>(traceDataCache_.get(), streamFilters_.get());
#endif
    streamFilters_->taskPoolFilter_ = std::make_unique<TaskPoolFilter>(traceDataCache_.get(), streamFilters_.get());
}

void TraceStreamerSelector::WaitForParserEnd()
{
    if (fileType_ == TRACE_FILETYPE_H_TRACE) {
        pbreaderParser_->WaitForParserEnd();
    }
    if (fileType_ == TRACE_FILETYPE_BY_TRACE || fileType_ == TRACE_FILETYPE_HILOG ||
        fileType_ == TRACE_FILETYPE_HI_SYSEVENT) {
        ptreaderParser_->WaitForParserEnd();
    }
#ifdef ENABLE_HIPERF
    if (fileType_ == TRACE_FILETYPE_PERF) {
        pbreaderParser_->TraceDataSegmentEnd(false);
        pbreaderParser_->WaitForParserEnd();
    }
#endif
#ifdef ENABLE_RAWTRACE
    if (fileType_ == TRACE_FILETYPE_RAW_TRACE) {
        rawTraceParser_->WaitForParserEnd();
    }
#endif
    traceDataCache_->UpdateTraceRange();
    if (traceDataCache_->AnimationTraceEnabled()) {
        streamFilters_->animationFilter_->UpdateFrameInfo();
        streamFilters_->animationFilter_->UpdateDynamicFrameInfo();
    }
#if IS_WASM
    ComputeDataDictStrHash();
#endif
}

MetaData *TraceStreamerSelector::GetMetaData()
{
    return traceDataCache_->GetMetaData();
}

void TraceStreamerSelector::SetDataType(TraceFileType type)
{
    fileType_ = type;
    if (fileType_ == TRACE_FILETYPE_H_TRACE) {
        pbreaderParser_ = std::make_unique<PbreaderParser>(traceDataCache_.get(), streamFilters_.get());
    } else if (fileType_ == TRACE_FILETYPE_BY_TRACE) {
        ptreaderParser_ = std::make_unique<PtreaderParser>(traceDataCache_.get(), streamFilters_.get());
    }
#ifdef ENABLE_RAWTRACE
    else if (fileType_ == TRACE_FILETYPE_RAW_TRACE) {
        rawTraceParser_ = std::make_unique<RawTraceParser>(traceDataCache_.get(), streamFilters_.get());
    }
#endif
}
// only support parse long trace profiler_data_xxxxxxxx_xxxxxx_x.htrace
bool TraceStreamerSelector::BatchParseTraceDataSegment(std::unique_ptr<uint8_t[]> data, size_t size)
{
    if (size == 0) {
        return true;
    }
    if (fileType_ == TRACE_FILETYPE_UN_KNOW) {
        fileType_ = GuessFileType(data.get(), size);
        if (fileType_ != TRACE_FILETYPE_H_TRACE) {
            TS_LOGE("File type is not supported in this mode!");
            return false;
        }
        pbreaderParser_ = std::make_unique<PbreaderParser>(traceDataCache_.get(), streamFilters_.get());
#ifdef ENABLE_HTRACE
        pbreaderParser_->EnableOnlyParseFtrace();
#endif
    }
    pbreaderParser_->ParseTraceDataSegment(std::move(data), size);
    return true;
}

void TraceStreamerSelector::GetMarkPositionData(std::unique_ptr<uint8_t[]> &data, size_t &size)
{
    if (!markHeard_) {
        std::string markStr(reinterpret_cast<const char *>(data.get()), size);
        auto foundPos = markStr.find("MarkPositionJSON->");
        if (foundPos == std::string::npos) {
            // trace not MarkPosition,parse trace data
            hasGotMarkFinish_ = true;
            return;
        }
        // found MarkPosition
        markHeard_ = true;
    }
    auto pos = std::find(data.get(), data.get() + size, '\n');
    if (pos != data.get() + size) {
        hasGotMarkFinish_ = true;
        // Calculate the size of mark position information (include '\n')
        auto curMarkSize = pos - data.get() + 1;
        // Move the data pointer to the starting position of the remaining data
        // The remaining data size is equal to the data size minus the current markinfo size
        size -= curMarkSize;
        auto remainingData = std::make_unique<uint8_t[]>(size);
        memcpy_s(remainingData.get(), size, data.get() + curMarkSize, size);
        data.reset(remainingData.release());
    }
}
void TraceStreamerSelector::InitializeParser()
{
    if (fileType_ == TRACE_FILETYPE_H_TRACE || fileType_ == TRACE_FILETYPE_PERF) {
        pbreaderParser_ = std::make_unique<PbreaderParser>(traceDataCache_.get(), streamFilters_.get());
#ifdef ENABLE_ARKTS
        pbreaderParser_->EnableFileSeparate(enableFileSeparate_);
#endif
    } else if (fileType_ == TRACE_FILETYPE_BY_TRACE || fileType_ == TRACE_FILETYPE_HI_SYSEVENT ||
               fileType_ == TRACE_FILETYPE_HILOG) {
        ptreaderParser_ = std::make_unique<PtreaderParser>(traceDataCache_.get(), streamFilters_.get(), fileType_);
#ifdef ENABLE_BYTRACE
        ptreaderParser_->EnableBytrace(fileType_ == TRACE_FILETYPE_BY_TRACE);
#endif
#ifdef ENABLE_RAWTRACE
    } else if (fileType_ == TRACE_FILETYPE_RAW_TRACE) {
        rawTraceParser_ = std::make_unique<RawTraceParser>(traceDataCache_.get(), streamFilters_.get());
#endif
    }
}

void TraceStreamerSelector::ProcessTraceData(std::unique_ptr<uint8_t[]> data,
                                             size_t size,
                                             int32_t isFinish,
                                             bool isWasmReadFile)
{
    if (fileType_ == TRACE_FILETYPE_H_TRACE) {
        pbreaderParser_->ParseTraceDataSegment(std::move(data), size);
    } else if (fileType_ == TRACE_FILETYPE_BY_TRACE || fileType_ == TRACE_FILETYPE_HI_SYSEVENT ||
               fileType_ == TRACE_FILETYPE_HILOG) {
        ptreaderParser_->ParseTraceDataSegment(std::move(data), size, isFinish);
        return;
    } else if (fileType_ == TRACE_FILETYPE_PERF) {
#ifdef ENABLE_HIPERF
        pbreaderParser_->StoreTraceDataSegment(std::move(data), size, isFinish);
#endif
    } else if (fileType_ == TRACE_FILETYPE_RAW_TRACE) {
#ifdef ENABLE_RAWTRACE
#ifdef IS_WASM
        if (isWasmReadFile && !rawTraceParser_->IsWasmReadFile()) {
            rawTraceParser_->SetWasmReadFile(true);
        }
#endif
        rawTraceParser_->ParseTraceDataSegment(std::move(data), size, isFinish);
#endif
    }

    SetAnalysisResult(TRACE_PARSER_NORMAL);
}

bool TraceStreamerSelector::ParseTraceDataSegment(std::unique_ptr<uint8_t[]> data,
                                                  size_t size,
                                                  bool isSplitFile,
                                                  int32_t isFinish,
                                                  bool isWasmReadFile)
{
    if (size == 0) {
        return true;
    }
#if !IS_WASM
    // if in the linux,hasGotMarkFinish_ = fasle, get markinfo
    if (!hasGotMarkFinish_) {
        GetMarkPositionData(data, size);
        if (!hasGotMarkFinish_) {
            // Believing that the markInfo data has not been sent completely,Waiting for next send
            return true;
        }
    }
#endif

    if (fileType_ == TRACE_FILETYPE_UN_KNOW) {
        fileType_ = GuessFileType(data.get(), size);
        if (fileType_ == TRACE_FILETYPE_UN_KNOW) {
            SetAnalysisResult(TRACE_PARSER_FILE_TYPE_ERROR);
            TS_LOGI(
                "File type is not supported!,\nthe head content is:%s\n ---warning!!!---\n"
                "File type is not supported!,\n",
                data.get());
            return false;
        }
        InitializeParser();
    }
    traceDataCache_->SetSplitFileMinTime(minTs_);
    traceDataCache_->SetSplitFileMaxTime(maxTs_);
    traceDataCache_->isSplitFile_ = isSplitFile;
    ProcessTraceData(std::move(data), size, isFinish, isWasmReadFile);

#if !IS_WASM
    // in the linux,isFinish = 1,clear markinfo
    if (isFinish) {
        ClearMarkPositionInfo();
    }
#endif
    return true;
}
void TraceStreamerSelector::EnableMetaTable(bool enabled)
{
    traceDataCache_->EnableMetaTable(enabled);
}

void TraceStreamerSelector::EnableFileSave(bool enabled)
{
    enableFileSeparate_ = enabled;
}

void TraceStreamerSelector::SetCleanMode(bool cleanMode)
{
    g_curLogLevel = LOG_OFF;
}

int32_t TraceStreamerSelector::ExportDatabase(const std::string &outputName, TraceDataDB::ResultCallBack resultCallBack)
{
    traceDataCache_->UpdateTraceRange();
    return traceDataCache_->ExportDatabase(outputName, resultCallBack);
}
int32_t TraceStreamerSelector::CreatEmptyBatchDB(const std::string dbPath)
{
    return traceDataCache_->CreatEmptyBatchDB(dbPath);
}
int32_t TraceStreamerSelector::BatchExportDatabase(const std::string &outputName)
{
    traceDataCache_->UpdateTraceRange();
    return traceDataCache_->BatchExportDatabase(outputName);
}
void TraceStreamerSelector::RevertTableName(const std::string &outputName)
{
    return traceDataCache_->RevertTableName(outputName);
}
int32_t TraceStreamerSelector::ExportPerfReadableText(const std::string &outputName,
                                                      TraceDataDB::ResultCallBack resultCallBack)
{
    traceDataCache_->UpdateTraceRange();
    return traceDataCache_->ExportPerfReadableText(outputName, resultCallBack);
}

int32_t TraceStreamerSelector::ExportHookReadableText(const std::string &outputName,
                                                      TraceDataDB::ResultCallBack resultCallBack)
{
    traceDataCache_->UpdateTraceRange();
    return traceDataCache_->ExportHookReadableText(outputName, resultCallBack);
}

int32_t TraceStreamerSelector::ExportEbpfReadableText(const std::string &outputName,
                                                      TraceDataDB::ResultCallBack resultCallBack)
{
    traceDataCache_->UpdateTraceRange();
    return traceDataCache_->ExportEbpfReadableText(outputName, resultCallBack);
}

bool TraceStreamerSelector::ReloadSymbolFiles(const std::string &directory, const std::vector<std::string> &fileNames)
{
    bool result = false;
    bool ret = false;
    for (auto fileName : fileNames) {
        std::filesystem::path filePath(fileName);
        if (std::filesystem::exists(filePath) && std::filesystem::is_regular_file(filePath)) {
            ret = pbreaderParser_->ReparseSymbolFileAndResymbolization(filePath.parent_path().string(),
                                                                       filePath.filename().string());
        } else if (std::filesystem::exists(std::filesystem::path(directory) / fileName)) {
            ret = pbreaderParser_->ReparseSymbolFileAndResymbolization(directory, fileName);
        }
        if (ret) {
            result = true;
        }
    }
    return result;
}
void TraceStreamerSelector::Clear()
{
    traceDataCache_->Prepare();
    traceDataCache_->Clear();
}
std::vector<std::string> TraceStreamerSelector::SearchData()
{
    return traceDataCache_->SearchData();
}
int32_t TraceStreamerSelector::OperateDatabase(const std::string &sql)
{
    return traceDataCache_->OperateDatabase(sql);
}
int32_t TraceStreamerSelector::SearchDatabase(const std::string &sql, TraceDataDB::ResultCallBack resultCallBack)
{
    return traceDataCache_->SearchDatabase(sql, resultCallBack);
}
int32_t TraceStreamerSelector::SearchDatabaseToProto(const std::string &data,
                                                     SqllitePreparCacheData::TLVResultCallBack resultCallBack)
{
    return traceDataCache_->SearchDatabaseToProto(data, resultCallBack);
}
int32_t TraceStreamerSelector::SearchDatabase(const std::string &sql, uint8_t *out, int32_t outLen)
{
    return traceDataCache_->SearchDatabase(sql, out, outLen);
}
int32_t TraceStreamerSelector::SearchDatabase(std::string &sql, bool printf)
{
    return traceDataCache_->SearchDatabase(sql, printf);
}
std::string TraceStreamerSelector::SearchDatabase(const std::string &sql)
{
    return traceDataCache_->SearchDatabase(sql);
}
void TraceStreamerSelector::InitMetricsMap(std::map<std::string, std::string> &metricsMap)
{
    metricsMap.emplace(TRACE_MEM_UNAGG, MEM_UNAGG_QUERY);
    metricsMap.emplace(TRACE_MEM, MEM_QUERY);
    metricsMap.emplace(TRACE_MEM_TOP_TEN, MEM_TOP_QUERY);
    metricsMap.emplace(TRACE_METADATA, META_DATA_QUERY);
    metricsMap.emplace(SYS_CALLS, SYS_CALL_QUERY);
    metricsMap.emplace(TRACE_STATS, TRACE_STATE_QUERY);
    metricsMap.emplace(TRACE_TASK_NAMES, TRACE_TASK_NAME);
}
const std::string TraceStreamerSelector::MetricsSqlQuery(const std::string &metrics)
{
    std::map<std::string, std::string> metricsMap;
    InitMetricsMap(metricsMap);
    auto itor = metricsMap.find(metrics);
    if (itor == metricsMap.end()) {
        TS_LOGE("metrics name error!!!");
        return "";
    }
    return itor->second;
}
int32_t TraceStreamerSelector::UpdateTraceRangeTime(uint8_t *data, int32_t len)
{
    std::string traceRangeStr;
    (void)memcpy_s(&traceRangeStr, len, data, len);
    std::vector<std::string> vTraceRangeStr = SplitStringToVec(traceRangeStr, ";");
    uint64_t minTs = std::stoull(vTraceRangeStr.at(0));
    uint64_t maxTs = std::stoull(vTraceRangeStr.at(1));
    traceDataCache_->UpdateTraceTime(minTs);
    traceDataCache_->UpdateTraceTime(maxTs);
    return 0;
}
void TraceStreamerSelector::SetCancel(bool cancel)
{
    traceDataCache_->SetCancel(cancel);
}
void TraceStreamerSelector::UpdateBinderRunnableTraceStatus(bool status)
{
    traceDataCache_->UpdateBinderRunnableTraceStatus(status);
}
void TraceStreamerSelector::UpdateAnimationTraceStatus(bool status)
{
    traceDataCache_->UpdateAnimationTraceStatus(status);
}
void TraceStreamerSelector::UpdateTaskPoolTraceStatus(bool status)
{
    traceDataCache_->UpdateTaskPoolTraceStatus(status);
}
void TraceStreamerSelector::UpdateAppStartTraceStatus(bool status)
{
    traceDataCache_->UpdateAppStartTraceStatus(status);
}
void TraceStreamerSelector::UpdateHMKernelTraceStatus(bool status)
{
    traceDataCache_->UpdateHMKernelTraceStatus(status);
}
void TraceStreamerSelector::UpdateRawTraceCutStartTsStatus(bool status)
{
    traceDataCache_->UpdateRawTraceCutStartTsStatus(status);
}
bool TraceStreamerSelector::LoadQueryFile(const std::string &sqlOperator, std::vector<std::string> &sqlStrings)
{
    std::ifstream file(sqlOperator);
    if (!file.is_open()) {
        TS_LOGE("open file failed!");
    }
    std::string sqlString;
    std::string line;
    while (std::getline(file, line)) {
        sqlString += line;
    }
    if (!sqlString.empty()) {
        auto strVec = SplitStringToVec(sqlString, ";");
        for (auto str : strVec) {
            auto result = TrimInvisibleCharacters(str);
            if (!result.empty()) {
                sqlStrings.push_back(result);
            }
        }
    }
    file.close();
    return true;
}
bool TraceStreamerSelector::ReadSqlFileAndPrintResult(const std::string &sqlOperator)
{
    std::vector<std::string> sqlStrings;
    if (!LoadQueryFile(sqlOperator, sqlStrings)) {
        return false;
    }
    if (sqlStrings.empty()) {
        TS_LOGE("%s is empty!", sqlOperator.c_str());
        return false;
    }
    for (auto &str : sqlStrings) {
        SearchDatabase(str, true);
    }
    return true;
}
bool TraceStreamerSelector::ParserAndPrintMetrics(const std::string &metrics)
{
    auto metricsName = SplitStringToVec(metrics, ",");
    for (const auto &itemName : metricsName) {
        std::string result = SearchDatabase(MetricsSqlQuery(itemName));
        if (result == "") {
            return false;
        }
        Metrics metricsOperator;
        metricsOperator.ParserJson(itemName, result);
        for (auto item : metricsOperator.GetMetricsMap()) {
            if (item.second == itemName) {
                metricsOperator.PrintMetricsResult(item.first, nullptr);
                continue;
            }
        }
    }
    return true;
}

void TraceStreamerSelector::ComputeDataDictStrHash()
{
    auto callStack = traceDataCache_->GetConstInternalSlicesData();
    for (auto i = 0; i < callStack.NamesData().size(); i++) {
        auto str = traceDataCache_->GetDataFromDict(callStack.NamesData()[i]);
        auto res = StrHash(str);
        traceDataCache_->GetInternalSlicesData()->SetColorIndex(i, res);
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
