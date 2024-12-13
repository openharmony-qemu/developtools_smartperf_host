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

#ifndef TRACE_DATA_CACHE_WRITER_H
#define TRACE_DATA_CACHE_WRITER_H

#include "trace_data_cache_reader.h"

namespace SysTuning {
namespace TraceStreamer {
using namespace TraceStdtype;
class TraceDataCacheWriter : virtual public TraceDataCacheBase {
public:
    TraceDataCacheWriter() = default;
    TraceDataCacheWriter(const TraceDataCacheWriter &) = delete;
    TraceDataCacheWriter &operator=(const TraceDataCacheWriter &) = delete;
    ~TraceDataCacheWriter() override;
    void Clear();

public:
    InternalPid GetProcessInternalPid(uint32_t pid);
    Process *GetProcessData(InternalPid internalPid);
    uint32_t AppendNewProcessData(uint32_t pid, const std::string &name, uint64_t startTs);
    InternalTid NewInternalThread(uint32_t tid);
    Thread *GetThreadData(InternalTid internalTid);
    void UpdateTraceTime(uint64_t timeStamp);
    void UpdateTraceMinTime(uint64_t timestampMin);
    void MixTraceTime(uint64_t timestampMin, uint64_t timestampMax);
    CallStack *GetInternalSlicesData();
    CallStack *GetIrqData();
    Filter *GetFilterData();
    Raw *GetRawData();
    Measure *GetMeasureData();
    Measure *GetSysMemMeasureData();
    Measure *GetProcessMeasureData();
    Measure *GetXpowerMeasureData();
    ThreadStateData *GetThreadStateData();
    SchedSlice *GetSchedSliceData();
    CpuMeasureFilter *GetCpuMeasuresData();
    Instants *GetInstantsData();
    ProcessMeasureFilter *GetProcessMeasureFilterData();
    ClockEventData *GetClockEventFilterData();
    ClkEventData *GetClkEventFilterData();
    StatAndInfo *GetStatAndInfo();
    MetaData *GetMetaData();
    SymbolsData *GetSymbolsData();
    SysCall *GetSysCallData();
    LogInfo *GetHilogData();
    NativeHook *GetNativeHookData();
    NativeHookFrame *GetNativeHookFrameData();
    NativeHookStatistic *GetNativeHookStatisticsData();
    Hidump *GetHidumpData();
    PerfCallChain *GetPerfCallChainData();
    PerfFiles *GetPerfFilesData();
    PerfSample *GetPerfSampleData();
    PerfThread *GetPerfThreadData();
    PerfReport *GetPerfReportData();
    PerfNapiAsync *GetPerfNapiAsyncData();
    ArgSet *GetArgSetData();
    DataType *GetDataTypeData();
    SysMeasureFilter *GetSysMeasureFilterData();
    NetDetailData *GetNetworkData();
    DiskIOData *GetDiskIOData();
    CpuUsageDetailData *GetCpuUsageInfoData();
    LiveProcessDetailData *GetLiveProcessData();
    FileSystemSample *GetFileSystemSample();
    EbpfCallStackData *GetEbpfCallStack();
    PagedMemorySampleData *GetPagedMemorySampleData();
    HiSysEventSubkeys *GetHiSysEventSubkeysData();
    HiSysEventMeasureData *GetHiSysEventMeasureData();
    HiSysEventDeviceStateData *GetHiSysEventDeviceStateData();
    TraceConfig *GetTraceConfigData();
    HiSysEventAllEventData *GetHiSysEventAllEventData();
    SmapsData *GetSmapsData();
    BioLatencySampleData *GetBioLatencySampleData();
    ClockSnapshotData *GetClockSnapshotData();
    DataSourceClockIdData *GetDataSourceClockIdData();
    FrameSlice *GetFrameSliceData();
    FrameMaps *GetFrameMapsData();
    GPUSlice *GetGPUSliceData();
    DmaFence *GetDmaFenceData();
    TaskPoolInfo *GetTaskPoolData();
    JsHeapFiles *GetJsHeapFilesData();
    JsHeapEdges *GetJsHeapEdgesData();
    JsHeapInfo *GetJsHeapInfoData();
    JsHeapLocation *GetJsHeapLocationData();
    JsHeapNodes *GetJsHeapNodesData();
    JsHeapSample *GetJsHeapSampleData();
    JsHeapString *GetJsHeapStringData();
    JsHeapTraceFuncInfo *GetJsHeapTraceFuncInfoData();
    JsHeapTraceNode *GetJsHeapTraceNodeData();
    JsCpuProfilerNode *GetJsCpuProfilerNodeData();
    JsCpuProfilerSample *GetJsCpuProfilerSampleData();
    JsConfig *GetJsConfigData();
    AppStartup *GetAppStartupData();
    SoStaticInitalization *GetSoStaticInitalizationData();
    Animation *GetAnimation();
    DeviceInfo *GetDeviceInfo();
    DynamicFrame *GetDynamicFrame();
    AshMemData *GetAshMemData();
    DmaMemData *GetDmaMemData();
    GpuProcessMemData *GetGpuProcessMemData();
    GpuWindowMemData *GetGpuWindowMemData();
    CpuDumpInfo *GetCpuDumpInfo();
    ProfileMemInfo *GetProfileMemInfo();
    RSImageDumpInfo *GetRSImageDumpInfo();
    XPowerAppStatistic *GetXPowerAppStatisticInfo();
    XPowerAppDetailCPU *GetXPowerAppDetailCPUInfo();
    XPowerAppDetailGPU *GetXPowerAppDetailGPUInfo();
    XPowerAppDetailWifi *GetXPowerAppDetailWifiInfo();
    XPowerAppDetailDisplay *GetXPowerAppDetailDisplayInfo();
    XPowerComponentTop *GetXPowerComponentTopInfo();

private:
    void ClearBase();
    void ClearMeasure();
    void ClearHiperf();
    void ClearArkTs();
    void ClearNativeMemory();
    void ClearEbpf();
    void ClearTemplate();
};
} // namespace TraceStreamer
} // namespace SysTuning
#endif
