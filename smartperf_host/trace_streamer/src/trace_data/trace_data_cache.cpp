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

#include "trace_data_cache.h"

#include <fcntl.h>
#include <stack>
#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>

#include "animation_table.h"
#include "app_startup_table.h"
#include "args_table.h"
#include "bio_latency_sample_table.h"
#include "callstack_table.h"
#include "clk_event_filter_table.h"
#include "clock_event_filter_table.h"
#include "clock_snapshot_table.h"
#include "cpu_measure_filter_table.h"
#include "cpu_usage_info_table.h"
#include "data_dict_table.h"
#include "data_type_table.h"
#include "datasource_clockid_table.h"
#include "device_info_table.h"
#include "device_state_table.h"
#include "dma_fence_table.h"
#include "disk_io_table.h"
#include "dynamic_frame_table.h"
#include "ebpf_callstack_table.h"
#include "file.h"
#include "file_system_sample_table.h"
#include "filter_table.h"
#include "frame_maps_table.h"
#include "frame_slice_table.h"
#include "gpu_slice_table.h"
#include "js_config_table.h"
#include "js_cpu_profiler_node_table.h"
#include "js_cpu_profiler_sample_table.h"
#include "js_heap_edges_table.h"
#include "js_heap_files_table.h"
#include "js_heap_info_table.h"
#include "js_heap_location_table.h"
#include "js_heap_nodes_table.h"
#include "js_heap_sample_table.h"
#include "js_heap_string_table.h"
#include "js_heap_trace_function_info_table.h"
#include "js_heap_trace_node_table.h"
#include "hidump_table.h"
#include "instants_table.h"
#include "irq_table.h"
#include "live_process_table.h"
#include "log_table.h"
#include "measure_table.h"
#include "memory_ashmem_table.h"
#include "memory_dma_table.h"
#include "memory_process_gpu_table.h"
#include "memory_window_gpu_table.h"
#include "memory_cpu_table.h"
#include "memory_profile_table.h"
#include "memory_rs_image_table.h"
#include "meta_table.h"
#include "native_hook_frame_table.h"
#include "native_hook_statistic_table.h"
#include "native_hook_table.h"
#include "network_table.h"
#include "paged_memory_sample_table.h"
#include "perf_call_chain_table.h"
#include "perf_files_table.h"
#include "perf_report_table.h"
#include "perf_sample_table.h"
#include "perf_thread_table.h"
#include "perf_napi_async_table.h"
#include "process_measure_filter_table.h"
#include "process_table.h"
#include "range_table.h"
#include "raw_table.h"
#include "sched_slice_table.h"
#include "smaps_table.h"
#include "span_join.h"
#include "sqlite3.h"
#include "stat_table.h"
#include "so_static_initalization_table.h"
#include "string_to_numerical.h"
#include "symbols_table.h"
#include "sysevent_all_event_table.h"
#include "sysevent_measure_table.h"
#include "sysevent_subkey_table.h"
#include "system_call_table.h"
#include "system_event_filter_table.h"
#include "table_base.h"
#include "task_pool_table.h"
#include "thread_state_table.h"
#include "thread_table.h"
#include "trace_config_table.h"
#include "xpower_app_detaile_cpu_table.h"
#include "xpower_app_detaile_display_table.h"
#include "xpower_app_detaile_gpu_table.h"
#include "xpower_app_detaile_wifi_table.h"
#include "xpower_app_statistic_table.h"
#include "xpower_component_top_table.h"
#include "timerfd_wakeup_table.h"
namespace SysTuning {
namespace TraceStreamer {
constexpr uint8_t CPU_ID_FORMAT_WIDTH = 3;
constexpr uint8_t TIME_PRECISION_SIX = 6;
TraceDataCache::TraceDataCache()
{
    InitDB();
}

TraceDataCache::~TraceDataCache() {}
void TraceDataCache::InitEbpfDB()
{
    TableBase::TableDeclare<EbpfCallStackTable>(*db_, this, "ebpf_callstack");
    TableBase::TableDeclare<BioLatencySampleTable>(*db_, this, "bio_latency_sample");
    TableBase::TableDeclare<FileSystemSampleTable>(*db_, this, "file_system_sample");
    TableBase::TableDeclare<PagedMemorySampleTable>(*db_, this, "paged_memory_sample");
}
void TraceDataCache::InitNativeMemoryDB()
{
    TableBase::TableDeclare<NativeHookTable>(*db_, this, "native_hook");
    TableBase::TableDeclare<NativeHookFrameTable>(*db_, this, "native_hook_frame");
    TableBase::TableDeclare<NativeHookStatisticTable>(*db_, this, "native_hook_statistic");
}
void TraceDataCache::InitArkTsDB()
{
    TableBase::TableDeclare<JsHeapFilesTable>(*db_, this, "js_heap_files");
    TableBase::TableDeclare<JsHeapEdgesTable>(*db_, this, "js_heap_edges");
    TableBase::TableDeclare<JsHeapInfoTable>(*db_, this, "js_heap_info");
    TableBase::TableDeclare<JsHeapLocationTable>(*db_, this, "js_heap_location");
    TableBase::TableDeclare<JsHeapNodesTable>(*db_, this, "js_heap_nodes");
    TableBase::TableDeclare<JsHeapSampleTable>(*db_, this, "js_heap_sample");
    TableBase::TableDeclare<JsHeapStringTable>(*db_, this, "js_heap_string");
    TableBase::TableDeclare<JsHeapTraceFunctionInfoTable>(*db_, this, "js_heap_trace_function_info");
    TableBase::TableDeclare<JsHeapTraceNodeTable>(*db_, this, "js_heap_trace_node");
    TableBase::TableDeclare<JsCpuProfilerNodeTable>(*db_, this, "js_cpu_profiler_node");
    TableBase::TableDeclare<JsCpuProfilerSampleTable>(*db_, this, "js_cpu_profiler_sample");
    TableBase::TableDeclare<JsConfigTable>(*db_, this, "js_config");
}
void TraceDataCache::InitHiperfDB()
{
    TableBase::TableDeclare<PerfReportTable>(*db_, this, "perf_report");
    TableBase::TableDeclare<PerfSampleTable>(*db_, this, "perf_sample");
    TableBase::TableDeclare<PerfCallChainTable>(*db_, this, "perf_callchain");
    TableBase::TableDeclare<PerfThreadTable>(*db_, this, "perf_thread");
    TableBase::TableDeclare<PerfFilesTable>(*db_, this, "perf_files");
    TableBase::TableDeclare<PerfNapiAsyncTable>(*db_, this, "perf_napi_async");
}
void TraceDataCache::InitMeasureDB()
{
    TableBase::TableDeclare<MeasureTable>(*db_, this, "measure");
    TableBase::TableDeclare<MeasureTable>(*db_, this, "sys_mem_measure");
    TableBase::TableDeclare<MeasureTable>(*db_, this, "process_measure");
    TableBase::TableDeclare<MeasureTable>(*db_, this, "xpower_measure");
    TableBase::TableDeclare<CpuMeasureFilterTable>(*db_, this, "cpu_measure_filter");
    TableBase::TableDeclare<FilterTable>(*db_, this, "measure_filter");
    TableBase::TableDeclare<ProcessMeasureFilterTable>(*db_, this, "process_measure_filter");
    TableBase::TableDeclare<ClockEventFilterTable>(*db_, this, "clock_event_filter");
    TableBase::TableDeclare<ClkEventFilterTable>(*db_, this, "clk_event_filter");
}
void TraceDataCache::InitBaseDB()
{
    TableBase::TableDeclare<ProcessTable>(*db_, this, "process");
    TableBase::TableDeclare<ThreadTable>(*db_, this, "thread");
    TableBase::TableDeclare<RangeTable>(*db_, this, "trace_range");
    TableBase::TableDeclare<DataTypeTable>(*db_, this, "data_type");
    TableBase::TableDeclare<SpanJoin>(*db_, this, "span_join");
    TableBase::TableDeclare<SymbolsTable>(*db_, this, "symbols");
    TableBase::TableDeclare<StatTable>(*db_, this, "stat");
    TableBase::TableDeclare<ArgsTable>(*db_, this, "args");
    TableBase::TableDeclare<MetaTable>(*db_, this, "meta");
    TableBase::TableDeclare<TraceConfigTable>(*db_, this, "trace_config");
    TableBase::TableDeclare<DataDictTable>(*db_, this, "data_dict");
    TableBase::TableDeclare<DataSourceClockIdTableTable>(*db_, this, "datasource_clockid");
    TableBase::TableDeclare<ClockSnapShotTable>(*db_, this, "clock_snapshot");
}
void TraceDataCache::InitTemplateDB()
{
    // task pool business
    TableBase::TableDeclare<TaskPoolTable>(*db_, this, "task_pool");
    // app start up business
    TableBase::TableDeclare<AppStartupTable>(*db_, this, "app_startup");
    // so initalize business
    TableBase::TableDeclare<SoStaticInitalizationTable>(*db_, this, "static_initalize");
    // animation business
    TableBase::TableDeclare<AnimationTable>(*db_, this, "animation");
    TableBase::TableDeclare<DynamicFrameTable>(*db_, this, "dynamic_frame");
    TableBase::TableDeclare<DeviceInfoTable>(*db_, this, "device_info");
}
void TraceDataCache::InitRenderServiceDB()
{
    TableBase::TableDeclare<FrameSliceTable>(*db_, this, "frame_slice");
    TableBase::TableDeclare<FrameMapsTable>(*db_, this, "frame_maps");
    TableBase::TableDeclare<GPUSliceTable>(*db_, this, "gpu_slice");
}
void TraceDataCache::InitMemoryDB()
{
    TableBase::TableDeclare<SmapsTable>(*db_, this, "smaps");
    TableBase::TableDeclare<MemoryAshMemTable>(*db_, this, "memory_ashmem");
    TableBase::TableDeclare<MemoryDmaTable>(*db_, this, "memory_dma");
    TableBase::TableDeclare<MemoryProcessGpuTable>(*db_, this, "memory_process_gpu");
    TableBase::TableDeclare<MemoryWindowGpuTable>(*db_, this, "memory_window_gpu");
    TableBase::TableDeclare<MemoryCpuTable>(*db_, this, "memory_cpu");
    TableBase::TableDeclare<MemoryProfileTable>(*db_, this, "memory_profile");
    TableBase::TableDeclare<MemoryRSImageTable>(*db_, this, "memory_rs_image");
}
void TraceDataCache::InitHisysEventDB()
{
    TableBase::TableDeclare<SysEventSubkeyTable>(*db_, this, "app_name");
    TableBase::TableDeclare<SysEventMeasureTable>(*db_, this, "hisys_event_measure");
    TableBase::TableDeclare<DeviceStateTable>(*db_, this, "device_state");
    TableBase::TableDeclare<SysEventAllEventTable>(*db_, this, "hisys_all_event");
}
void TraceDataCache::InitXPowerDB()
{
    TableBase::TableDeclare<XpowerAppDetaileDisplayTable>(*db_, this, "xpower_app_detail_display");
    TableBase::TableDeclare<XpowerAppStatisticTable>(*db_, this, "xpower_app_statistic");
    TableBase::TableDeclare<XpowerAppDetaileCpuTable>(*db_, this, "xpower_app_detail_cpu");
    TableBase::TableDeclare<XpowerAppDetaileGpuTable>(*db_, this, "xpower_app_detail_gpu");
    TableBase::TableDeclare<XpowerAppDetaileWifiTable>(*db_, this, "xpower_app_detail_wifi");
    TableBase::TableDeclare<XpowerComponentTopTable>(*db_, this, "xpower_component_top");
}
void TraceDataCache::InitDB()
{
    if (dbInited_) {
        return;
    }
    InitBaseDB();
    InitEbpfDB();
    InitNativeMemoryDB();
    InitArkTsDB();
    InitHiperfDB();
    InitMeasureDB();
    InitTemplateDB();
    InitRenderServiceDB();
    InitMemoryDB();
    InitHisysEventDB();
    InitXPowerDB();
    TableBase::TableDeclare<RawTable>(*db_, this, "raw");
    TableBase::TableDeclare<InstantsTable>(*db_, this, "instant");
    TableBase::TableDeclare<SchedSliceTable>(*db_, this, "sched_slice");
    TableBase::TableDeclare<ThreadStateTable>(*db_, this, "thread_state");
    TableBase::TableDeclare<CallStackTable>(*db_, this, "callstack");
    TableBase::TableDeclare<IrqTable>(*db_, this, "irq");
    TableBase::TableDeclare<HidumpTable>(*db_, this, "hidump");
    TableBase::TableDeclare<SystemCallTable>(*db_, this, "syscall");
    TableBase::TableDeclare<LogTable>(*db_, this, "log");
    TableBase::TableDeclare<NetworkTable>(*db_, this, "network");
    TableBase::TableDeclare<SystemEventFilterTable>(*db_, this, "sys_event_filter");
    TableBase::TableDeclare<DiskIOTable>(*db_, this, "diskio");
    TableBase::TableDeclare<CpuUsageInfoTable>(*db_, this, "cpu_usage");
    TableBase::TableDeclare<LiveProcessTable>(*db_, this, "live_process");
    TableBase::TableDeclare<DmaFenceTable>(*db_, this, "dma_fence");
    TableBase::TableDeclare<TimerfdWakeupTable>(*db_, this, "timerfd_wakeup");
    dbInited_ = true;
}
bool TraceDataCache::AnimationTraceEnabled() const
{
    return animationTraceEnabled_;
}
void TraceDataCache::UpdateAnimationTraceStatus(bool status)
{
    animationTraceEnabled_ = status;
}
bool TraceDataCache::TaskPoolTraceEnabled() const
{
    return taskPoolTraceEnabled_;
}
void TraceDataCache::UpdateTaskPoolTraceStatus(bool status)
{
    taskPoolTraceEnabled_ = status;
}
bool TraceDataCache::AppStartTraceEnabled() const
{
    return appStartTraceEnabled_;
}
void TraceDataCache::UpdateAppStartTraceStatus(bool status)
{
    appStartTraceEnabled_ = status;
}
bool TraceDataCache::BinderRunnableTraceEnabled() const
{
    return binderRunnableTraceEnabled_;
}
void TraceDataCache::UpdateBinderRunnableTraceStatus(bool status)
{
    binderRunnableTraceEnabled_ = status;
}
bool TraceDataCache::HMKernelTraceEnabled() const
{
    return HMKernelTraceEnabled_;
}
void TraceDataCache::UpdateHMKernelTraceStatus(bool status)
{
    HMKernelTraceEnabled_ = status;
}
bool TraceDataCache::RawTraceCutStartTsEnabled() const
{
    return rawTraceCutStartTsEnabled_;
}
void TraceDataCache::UpdateRawTraceCutStartTsStatus(bool status)
{
    rawTraceCutStartTsEnabled_ = status;
}
uint64_t TraceDataCache::SplitFileMaxTime()
{
    return splitFileMaxTs_;
}
uint64_t TraceDataCache::SplitFileMinTime()
{
    return splitFileMinTs_;
}
void TraceDataCache::SetSplitFileMaxTime(uint64_t maxTs)
{
    splitFileMaxTs_ = maxTs;
}
void TraceDataCache::SetSplitFileMinTime(uint64_t minTs)
{
    splitFileMinTs_ = minTs;
}
std::deque<std::unique_ptr<std::string>> &TraceDataCache::HookCommProtos()
{
    return hookCommProtos_;
}
void TraceDataCache::ClearHookCommProtos()
{
    hookCommProtos_.clear();
}
int32_t TraceDataCache::ExportPerfReadableText(const std::string &outputName,
                                               TraceDataDB::ResultCallBack resultCallBack)
{
    int32_t perfFd = base::OpenFile(outputName, O_CREAT | O_RDWR, TS_PERMISSION_RW);
    TS_CHECK_TRUE(perfFd != -1, 1, "Failed to create file: %s, err:%s", outputName.c_str(), strerror(errno));
    std::unique_ptr<int32_t, std::function<void(int32_t *)>> fp(&perfFd, [](int32_t *fp) { close(*fp); });
    TS_CHECK_TRUE(ftruncate(perfFd, 0) != -1, 1, "Failed to ftruncate file: %s, err:%s", outputName.c_str(),
                  strerror(errno));
    TS_LOGI("ExportPerfReadableText begin...");
    std::string perfBufferLine;
    perfBufferLine.reserve(G_CHUNK_SIZE);
    for (uint64_t row = 0; row < perfSample_.Size();) {
        ExportPerfSampleToFile(perfBufferLine, perfFd, outputName, row);
        TS_CHECK_TRUE(write(perfFd, perfBufferLine.data(), perfBufferLine.size()) != -1, 1,
                      "Failed to write file: %s, err:%s", outputName.c_str(), strerror(errno));
        perfBufferLine.clear();
        if (++row != perfSample_.Size() && perfBufferLine.size() < FLUSH_CHUNK_THRESHOLD) {
            continue;
        }
    }
    TS_LOGI("ExportPerfReadableText end...");
    return 0;
}
void TraceDataCache::ExportPerfSampleToFile(std::string &perfBufferLine,
                                            int32_t perfFd,
                                            const std::string &outputName,
                                            uint64_t row)
{
    std::string perfTaskName;
    std::string cpuIdStr = std::to_string(perfSample_.CpuIds()[row]);
    std::string eventTypeName;
    auto perfTaskId = perfSample_.Tids()[row];
    if (perfTaskId == 0) {
        auto threadDataRow = 0;
        perfTaskName = GetDataFromDict(GetConstThreadData(threadDataRow).nameIndex_);
    } else {
        auto perfThreadTidItor = std::find(perfThread_.Tids().begin(), perfThread_.Tids().end(), perfTaskId);
        if (perfThreadTidItor != perfThread_.Tids().end()) {
            auto perfThreadRow = std::distance(perfThread_.Tids().begin(), perfThreadTidItor);
            perfTaskName = GetDataFromDict(perfThread_.ThreadNames()[perfThreadRow]);
        }
    }
    auto perfReportIdItor =
        std::find(perfReport_.IdsData().begin(), perfReport_.IdsData().end(), perfSample_.EventTypeIds()[row]);
    if (perfReportIdItor != perfReport_.IdsData().end()) {
        auto perfReportRow = std::distance(perfReport_.IdsData().begin(), perfReportIdItor);
        eventTypeName = GetDataFromDict(perfReport_.Values()[perfReportRow]);
    }
    perfBufferLine.append(perfTaskName);
    perfBufferLine.append("  ").append(std::to_string(perfTaskId));
    perfBufferLine.append(" [")
        .append(std::string(CPU_ID_FORMAT_WIDTH - cpuIdStr.size(), '0'))
        .append(cpuIdStr)
        .append("]");
    perfBufferLine.append(" ")
        .append(base::ConvertTimestampToSecStr(perfSample_.TimeStampData()[row], TIME_PRECISION_SIX))
        .append(":");
    perfBufferLine.append("          ").append(std::to_string(perfSample_.EventCounts()[row]));
    perfBufferLine.append(" ").append(eventTypeName).append(" \r\n");
    ExportPerfCallChaninText(perfSample_.SampleIds()[row], perfBufferLine);
}
void TraceDataCache::ExportPerfCallChaninText(uint32_t callChainId, std::string &bufferLine)
{
    std::stack<uint64_t> callChainStackRows;
    auto perfCallChainItor =
        std::lower_bound(perfCallChain_.CallChainIds().begin(), perfCallChain_.CallChainIds().end(), callChainId);
    while (perfCallChainItor != perfCallChain_.CallChainIds().end() && callChainId == *perfCallChainItor) {
        auto perfCallChainRow = std::distance(perfCallChain_.CallChainIds().begin(), perfCallChainItor);
        callChainStackRows.emplace(perfCallChainRow);
        ++perfCallChainItor;
    }
    while (!callChainStackRows.empty()) {
        auto perfCallChainRow = callChainStackRows.top();
        callChainStackRows.pop();
        auto formatIp = base::number(perfCallChain_.Ips()[perfCallChainRow], base::INTEGER_RADIX_TYPE_HEX);
        formatIp = std::string(base::INTEGER_RADIX_TYPE_HEX - formatIp.size(), ' ') + formatIp;
        std::string filePath("[unknown]");
        auto curFileId = perfCallChain_.FileIds()[perfCallChainRow];
        auto perfFileIdItor = std::lower_bound(perfFiles_.FileIds().begin(), perfFiles_.FileIds().end(), curFileId);
        if (perfFileIdItor != perfFiles_.FileIds().end()) {
            auto perfFileRow = std::distance(perfFiles_.FileIds().begin(), perfFileIdItor);
            filePath = GetDataFromDict(perfFiles_.FilePaths()[perfFileRow]);
        }
        bufferLine.append("\t").append(formatIp);
        auto nameStr = GetDataFromDict(perfCallChain_.Names()[perfCallChainRow]);
        bufferLine.append(" [").append(nameStr).append("]");
        bufferLine.append(" (").append(filePath).append(")\r\n");
    }
    bufferLine.append("\r\n");
}
int32_t TraceDataCache::ExportHookReadableText(const std::string &outputName,
                                               TraceDataDB::ResultCallBack resultCallBack)
{
    int32_t hookFd = base::OpenFile(outputName, O_CREAT | O_RDWR, TS_PERMISSION_RW);
    TS_CHECK_TRUE(hookFd != -1, 1, "Failed to create file: %s, err:%s", outputName.c_str(), strerror(errno));
    std::unique_ptr<int32_t, std::function<void(int32_t *)>> fp(&hookFd, [](int32_t *fp) { close(*fp); });
    TS_CHECK_TRUE(ftruncate(hookFd, 0) != -1, 1, "Failed to ftruncate file: %s, err:%s", outputName.c_str(),
                  strerror(errno));
    TS_LOGI("ExportHookReadableText begin...");
    std::string hookBufferLine;
    hookBufferLine.reserve(G_CHUNK_SIZE);
    ExportHookDataReadableText(hookFd, hookBufferLine);
    ExportHookStatisticReadableText(hookFd, hookBufferLine);
    TS_LOGI("ExportHookReadableText end...");
    return 0;
}
bool TraceDataCache::ExportHookDataReadableText(int32_t fd, std::string &bufferLine)
{
    for (uint64_t row = 0; row < nativeHookData_.Size();) {
        auto itid = nativeHookData_.InternalTidsData()[row];
        auto hookTaskId = internalThreadsData_[itid].tid_;
        auto hookTaskName = GetDataFromDict(internalThreadsData_[itid].nameIndex_);
        bufferLine.append(hookTaskName);
        bufferLine.append("  ").append(std::to_string(hookTaskId));
        bufferLine.append(" ").append("[---]"); // default HookData event cpu id
        bufferLine.append(" ")
            .append(base::ConvertTimestampToSecStr(nativeHookData_.TimeStampData()[row], TIME_PRECISION_SIX))
            .append(":");
        bufferLine.append("          ").append("1"); // default HookData event event cnt
        bufferLine.append(" ").append(nativeHookData_.EventTypes()[row]).append(" \r\n");
        ExportHookCallChaninText(nativeHookData_.CallChainIds()[row], bufferLine);
        if (++row != nativeHookData_.Size() && bufferLine.size() < FLUSH_CHUNK_THRESHOLD) {
            continue;
        }
        TS_CHECK_TRUE(write(fd, bufferLine.data(), bufferLine.size()) != -1, false,
                      "Failed to write HookData file, err:%s", strerror(errno));
        bufferLine.clear();
    }
    return true;
}
bool TraceDataCache::ExportHookStatisticReadableText(int32_t fd, std::string &bufferLine)
{
    std::map<uint32_t, std::string_view> statisticEventTypeMap = {
        {static_cast<uint32_t>(HookMemoryType::MALLOC), "AllocEvent"},
        {static_cast<uint32_t>(HookMemoryType::MMAP), "MmapEvent"},
        {static_cast<uint32_t>(HookMemoryType::FILE_PAGE_MSG), "FilePageEvent"},
        {static_cast<uint32_t>(HookMemoryType::MEMORY_USING_MSG), "MemoryUsingEvent"}};
    for (uint64_t row = 0; row < nativeHookStatisticData_.Size();) {
        auto ipid = nativeHookStatisticData_.Ipids()[row];
        auto statisticTaskId = internalProcessesData_[ipid].pid_;
        auto statisticTaskName = internalProcessesData_[ipid].cmdLine_;
        std::string_view eventType;
        auto statisticEventTypeItor = statisticEventTypeMap.find(nativeHookStatisticData_.MemoryTypes()[row]);
        if (statisticEventTypeItor != statisticEventTypeMap.end()) {
            eventType = statisticEventTypeItor->second;
        }
        bufferLine.append(statisticTaskName);
        bufferLine.append("  ").append(std::to_string(statisticTaskId));
        bufferLine.append(" ").append("[---]"); // default HookStatistic event cpu id
        bufferLine.append(" ")
            .append(base::ConvertTimestampToSecStr(nativeHookStatisticData_.TimeStampData()[row], TIME_PRECISION_SIX))
            .append(":");
        bufferLine.append("          ").append("1"); // default HookStatistic event event cnt
        bufferLine.append(" ").append(eventType).append(" \r\n");
        ExportHookCallChaninText(nativeHookStatisticData_.CallChainIds()[row], bufferLine);
        if (++row != nativeHookStatisticData_.Size() && bufferLine.size() < FLUSH_CHUNK_THRESHOLD) {
            continue;
        }
        TS_CHECK_TRUE(write(fd, bufferLine.data(), bufferLine.size()) != -1, false,
                      "Failed to write HookStatistic file, err:%s", strerror(errno));
        bufferLine.clear();
    }
    return true;
}
void TraceDataCache::ExportHookCallChaninText(uint32_t callChainId, std::string &bufferLine)
{
    auto hookFrameCallChainItor = std::lower_bound(nativeHookFrameData_.CallChainIds().begin(),
                                                   nativeHookFrameData_.CallChainIds().end(), callChainId);
    while (hookFrameCallChainItor != nativeHookFrameData_.CallChainIds().end() &&
           callChainId == *hookFrameCallChainItor) {
        auto hookCallChainRow = std::distance(nativeHookFrameData_.CallChainIds().begin(), hookFrameCallChainItor);
        auto hookFrameIp = base::number(nativeHookFrameData_.Ips()[hookCallChainRow], base::INTEGER_RADIX_TYPE_HEX);
        hookFrameIp = std::string(base::INTEGER_RADIX_TYPE_HEX - hookFrameIp.size(), ' ') + hookFrameIp;
        std::string hookSymName("unknown");
        std::string hookFilePath("[unknown]");
        if (nativeHookFrameData_.SymbolNames()[hookCallChainRow] != INVALID_UINT64) {
            hookSymName = GetDataFromDict(nativeHookFrameData_.SymbolNames()[hookCallChainRow]);
        }
        if (nativeHookFrameData_.FilePaths()[hookCallChainRow] != INVALID_UINT64) {
            hookFilePath = GetDataFromDict(nativeHookFrameData_.FilePaths()[hookCallChainRow]);
        }
        bufferLine.append("\t").append(hookFrameIp);
        bufferLine.append(" [").append(hookSymName).append("]");
        bufferLine.append(" (").append(hookFilePath).append(")\r\n");
        ++hookFrameCallChainItor;
    }
    bufferLine.append("\r\n");
}
int32_t TraceDataCache::ExportEbpfReadableText(const std::string &outputName,
                                               TraceDataDB::ResultCallBack resultCallBack)
{
    int32_t ebpfFd = base::OpenFile(outputName, O_CREAT | O_RDWR, TS_PERMISSION_RW);
    TS_CHECK_TRUE(ebpfFd != -1, 1, "Failed to create file: %s, err:%s", outputName.c_str(), strerror(errno));
    std::unique_ptr<int32_t, std::function<void(int32_t *)>> fp(&ebpfFd, [](int32_t *fp) { close(*fp); });
    TS_CHECK_TRUE(ftruncate(ebpfFd, 0) != -1, 1, "Failed to ftruncate file: %s, err:%s", outputName.c_str(),
                  strerror(errno));
    TS_LOGI("ExportEbpfReadableText begin...");
    EbpfEventTypeMap ebpfEventTypeMap = {{EBPF_DATA_TYPE::ITEM_EVENT_MAPS, "MapsEvent"},
                                         {EBPF_DATA_TYPE::ITEM_SYMBOL_INFO, "SymbolEvent"},
                                         {EBPF_DATA_TYPE::ITEM_EVENT_FS, "FsEvent"},
                                         {EBPF_DATA_TYPE::ITEM_EVENT_VM, "VmEvent"},
                                         {EBPF_DATA_TYPE::ITEM_EVENT_BIO, "BioEvent"},
                                         {EBPF_DATA_TYPE::ITEM_EVENT_STR, "StrEvent"},
                                         {EBPF_DATA_TYPE::ITEM_EVENT_KENEL_SYMBOL_INFO, "KernelSymbolEvent"}};
    std::string ebpfBufferLine;
    ebpfBufferLine.reserve(G_CHUNK_SIZE);
    ExportEbpfFileSystemReadableText(ebpfFd, ebpfBufferLine, ebpfEventTypeMap);
    ExportEbpfPagedMemReadableText(ebpfFd, ebpfBufferLine, ebpfEventTypeMap);
    ExportEbpfBIOReadableText(ebpfFd, ebpfBufferLine, ebpfEventTypeMap);
    TS_LOGI("ExportEbpfReadableText end...");
    return 0;
}
bool TraceDataCache::ExportEbpfFileSystemReadableText(int32_t fd,
                                                      std::string &bufferLine,
                                                      const EbpfEventTypeMap &ebpfEventTypeMap)
{
    for (uint64_t row = 0; row < fileSamplingTableData_.Size();) {
        auto fileSysTaskId = internalThreadsData_[fileSamplingTableData_.Itids()[row]].tid_;
        auto fileSysTaskName = GetDataFromDict(internalThreadsData_[fileSamplingTableData_.Itids()[row]].nameIndex_);
        std::string_view fileSampleEventType;
        auto ebpfEventTypeItor = ebpfEventTypeMap.find(fileSamplingTableData_.Types()[row]);
        if (ebpfEventTypeItor != ebpfEventTypeMap.end()) {
            fileSampleEventType = ebpfEventTypeItor->second;
        }
        bufferLine.append(fileSysTaskName);
        bufferLine.append("  ").append(std::to_string(fileSysTaskId));
        bufferLine.append(" ").append("[---]"); // default FileSystem event cpu id
        bufferLine.append(" ")
            .append(base::ConvertTimestampToSecStr(fileSamplingTableData_.StartTs()[row], TIME_PRECISION_SIX))
            .append(":");
        bufferLine.append("          ").append("1"); // default FileSystem event cnt
        bufferLine.append(" ").append(fileSampleEventType).append(" \r\n");
        ExportEbpfCallChaninText(fileSamplingTableData_.CallChainIds()[row], bufferLine);
        if (++row != fileSamplingTableData_.Size() && bufferLine.size() < FLUSH_CHUNK_THRESHOLD) {
            continue;
        }
        TS_CHECK_TRUE(write(fd, bufferLine.data(), bufferLine.size()) != -1, false,
                      "Failed to write FileSystem event file err:%s", strerror(errno));
        bufferLine.clear();
    }
    return true;
}
bool TraceDataCache::ExportEbpfPagedMemReadableText(int32_t fd,
                                                    std::string &bufferLine,
                                                    const EbpfEventTypeMap &ebpfEventTypeMap)
{
    for (uint64_t row = 0; row < pagedMemorySampleData_.Size();) {
        auto pagedMemTaskId = internalThreadsData_[pagedMemorySampleData_.Itids()[row]].tid_;
        auto pagedMemTaskName = GetDataFromDict(internalThreadsData_[pagedMemorySampleData_.Itids()[row]].nameIndex_);
        std::string_view pageMemEventType;
        auto ebpfEventTypeItor = ebpfEventTypeMap.find(pagedMemorySampleData_.Types()[row]);
        if (ebpfEventTypeItor != ebpfEventTypeMap.end()) {
            pageMemEventType = ebpfEventTypeItor->second;
        }
        bufferLine.append(pagedMemTaskName);
        bufferLine.append("  ").append(std::to_string(pagedMemTaskId));
        bufferLine.append(" ").append("[---]"); // default PagedMem event cpu id
        bufferLine.append(" ")
            .append(base::ConvertTimestampToSecStr(pagedMemorySampleData_.StartTs()[row], TIME_PRECISION_SIX))
            .append(":");
        bufferLine.append("          ").append("1"); // default PagedMem event cnt
        bufferLine.append(" ").append(pageMemEventType).append(" \r\n");
        ExportEbpfCallChaninText(pagedMemorySampleData_.CallChainIds()[row], bufferLine);
        if (++row != pagedMemorySampleData_.Size() && bufferLine.size() < FLUSH_CHUNK_THRESHOLD) {
            continue;
        }
        TS_CHECK_TRUE(write(fd, bufferLine.data(), bufferLine.size()) != -1, false,
                      "Failed to write PagedMem event file err:%s", strerror(errno));
        bufferLine.clear();
    }
    return true;
}
bool TraceDataCache::ExportEbpfBIOReadableText(int32_t fd,
                                               std::string &bufferLine,
                                               const EbpfEventTypeMap &ebpfEventTypeMap)
{
    for (uint64_t row = 0; row < bioLatencySampleData_.Size();) {
        auto bioTaskId = internalThreadsData_[bioLatencySampleData_.Itids()[row]].tid_;
        auto bioTaskName = GetDataFromDict(internalThreadsData_[bioLatencySampleData_.Itids()[row]].nameIndex_);
        std::string_view bioEventType;
        auto ebpfEventTypeItor = ebpfEventTypeMap.find(bioLatencySampleData_.Types()[row]);
        if (ebpfEventTypeItor != ebpfEventTypeMap.end()) {
            bioEventType = ebpfEventTypeItor->second;
        }
        bufferLine.append(bioTaskName);
        bufferLine.append("  ").append(std::to_string(bioTaskId));
        bufferLine.append(" ").append("[---]"); // default BIO event cpu id
        bufferLine.append(" ")
            .append(base::ConvertTimestampToSecStr(bioLatencySampleData_.StartTs()[row], TIME_PRECISION_SIX))
            .append(":");
        bufferLine.append("          ").append("1"); // default BIO event cnt
        bufferLine.append(" ").append(bioEventType).append(" \r\n");
        ExportEbpfCallChaninText(bioLatencySampleData_.CallChainIds()[row], bufferLine);
        if (++row != bioLatencySampleData_.Size() && bufferLine.size() < FLUSH_CHUNK_THRESHOLD) {
            continue;
        }
        TS_CHECK_TRUE(write(fd, bufferLine.data(), bufferLine.size()) != -1, false,
                      "Failed to write BIO event file err:%s", strerror(errno));
        bufferLine.clear();
    }
    return true;
}
void TraceDataCache::ExportEbpfCallChaninText(uint32_t callChainId, std::string &bufferLine)
{
    auto ebpfCallChainItor = std::lower_bound(ebpfCallStackData_.CallChainIds().begin(),
                                              ebpfCallStackData_.CallChainIds().end(), callChainId);
    while (ebpfCallChainItor != ebpfCallStackData_.CallChainIds().end() && callChainId == *ebpfCallChainItor) {
        auto ebpfCallChainRow = std::distance(ebpfCallStackData_.CallChainIds().begin(), ebpfCallChainItor);
        auto ebpfFrameIp = GetDataFromDict(ebpfCallStackData_.Ips()[ebpfCallChainRow]).substr(HEX_PREFIX.size());
        ebpfFrameIp = std::string(base::INTEGER_RADIX_TYPE_HEX - ebpfFrameIp.size(), ' ') + ebpfFrameIp;
        std::string ebpfSymName("unknown");
        std::string ebpfFilePath("[unknown]");
        if (ebpfCallStackData_.SymbolIds()[ebpfCallChainRow] != INVALID_UINT64) {
            ebpfSymName = GetDataFromDict(ebpfCallStackData_.SymbolIds()[ebpfCallChainRow]);
        }
        if (ebpfCallStackData_.FilePathIds()[ebpfCallChainRow] != INVALID_UINT64) {
            ebpfFilePath = GetDataFromDict(ebpfCallStackData_.FilePathIds()[ebpfCallChainRow]);
        }
        bufferLine.append("\t").append(ebpfFrameIp);
        bufferLine.append(" [").append(ebpfSymName).append("]");
        bufferLine.append(" (").append(ebpfFilePath).append(")\r\n");
        ++ebpfCallChainItor;
    }
    bufferLine.append("\r\n");
}
void TraceDataCache::ClearAllExportedCacheData()
{
    // ftrace plugin
    argSet_.ClearExportedData();
    filterData_.ClearExportedData();
    clkEventFilterData_.ClearExportedData();
    measureData_.ClearExportedData();
    clockEventFilterData_.ClearExportedData();
    processMeasureData_.ClearExportedData();
    processMeasureFilterData_.ClearExportedData();
    cpuMeasureData_.ClearExportedData();
    rawData_.ClearExportedData();
    instantsData_.ClearExportedData();
    schedSliceData_.ClearExportedData();
    irqData_.ClearExportedData();
    sysMemMeasureData_.ClearExportedData();
    sysCallData_.ClearExportedData();
    frameSliceData_.ClearExportedData();
    frameMapsData_.ClearExportedData();
    gpuSliceData_.ClearExportedData();
    timerfdWakeupData_.ClearExportedData();
}
void TraceDataCache::UpdateAllReadySize()
{
    // ftrace plugin datacache
    measureData_.UpdateReadySize(measureData_.Size());
    processMeasureData_.UpdateReadySize(processMeasureData_.Size());
    tableToCompletedSize_["measure"] = measureData_.readySize_;
    tableToCompletedSize_["process_measure"] = processMeasureData_.readySize_;
    tableToCompletedSize_["frame_slice"] = frameSliceData_.readySize_;
    tableToCompletedSize_["sched_slice"] = schedSliceData_.readySize_;
    tableToCompletedSize_["irq"] = irqData_.readySize_;

    argSet_.UpdateReadySize(argSet_.Size());
    filterData_.UpdateReadySize(filterData_.Size());
    clkEventFilterData_.UpdateReadySize(clkEventFilterData_.Size());
    clockEventFilterData_.UpdateReadySize(clockEventFilterData_.Size());
    processMeasureFilterData_.UpdateReadySize(processMeasureFilterData_.Size());
    cpuMeasureData_.UpdateReadySize(cpuMeasureData_.Size());
    rawData_.UpdateReadySize(rawData_.Size());

    instantsData_.UpdateReadySize(instantsData_.Size());
    sysCallData_.UpdateReadySize(sysCallData_.Size());
    frameMapsData_.UpdateReadySize(frameMapsData_.Size());
    gpuSliceData_.UpdateReadySize(gpuSliceData_.Size());
}
} // namespace TraceStreamer
} // namespace SysTuning
