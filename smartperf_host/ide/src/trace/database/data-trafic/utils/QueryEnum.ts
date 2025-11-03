// Copyright (c) 2021 Huawei Device Co., Ltd.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

export const CHART_OFFSET_LEFT = 248;
export enum QueryEnum {
  ClearMemoryCache = -1,
  CpuData = 0,
  CpuStateData = 1,
  CpuFreqData = 2,
  CpuFreqLimitData = 3,
  HangData = 3.5,
  ClockData = 4,
  IrqData = 5,
  ProcessData = 6,
  ProcessMemData = 7,
  ProcessStartupData = 8,
  ProcessSoInitData = 9,
  HiSysEventData = 10,
  HilogData = 11,
  VirtualMemoryData = 12,
  EnergySystemData = 13,
  EnergyStateData = 14,
  EnergyAnomalyData = 15,
  FrameExpectedData = 16,
  FrameActualData = 17,
  FrameAnimationData = 18,
  FrameDynamicData = 19,
  FrameSpacingData = 20,
  EnergyPowerData = 47,
  FileSystemData = 48,
  DiskIoData = 49,
  EBPFVm = 50,
  VmTrackerSmapsData = 81,
  VmTrackerDmaData = 82,
  VmTrackerGpuMemoryData = 83,
  VmTrackerGpuData = 84,
  VmTrackerGpuResourceData = 85,
  VmTrackerGpuTotalData = 86,
  VmTrackerGpuWindowData = 87,
  VmTrackerShmData = 88,
  VmTrackerPurgeableData = 89,
  AbilityMemoryUsedData = 90,
  CpuAbilityUserData = 91,
  CpuAbilitySystemData = 92,
  CpuAbilityMonitorData = 93,
  AbilityBytesReadData = 94,
  AbilityBytesWrittenData = 95,
  AbilityReadOpsData = 96,
  AbilityWrittenOpsData = 97,
  AbilityBytesInTraceData = 98,
  AbilityBytesOutTraceData = 99,
  AbilityPacketInTraceData = 100,
  AbilityPacketsOutTraceData = 101,
  AbilityCachedFilesData,
  AbilityCompressedData,
  AbilityPurgeableData = 151,
  AbilityGpuMemoryData = 152,
  AbilityDmaData = 153,
  ThreadData = 30,
  FuncData = 31,
  HiperfCpuData = 200,
  HiperfProcessData = 201,
  HiperfThreadData = 202,
  HiperfCallChart = 203,
  HiperfCallStack = 204,
  NativeMemoryChartData = 205,
  NativeMemoryChartCacheNormal = 206,
  NativeMemoryChartCacheStatistic = 207,
  GpuMemoryData = 208,
  GpuMemoryCacheNormal = 209,
  GpuMemoryCacheStatistic = 210,
  otherSourceData = 211,
  otherSourceCacheNormal = 212,
  otherSourceCacheStatistic = 213,
  processExpectedData = 26,
  processActualData = 27,
  processDeliverInputEventData = 28,
  processTouchEventDispatchData = 29,
  HeapTimelineData = 160,
  HeapSnapshotData = 161,
  CpuProfilerData = 162,
  SearchCpuData = 163,
  LostFrameData = 164,
  HitchTime = 165,
  dmaFenceData = 166,
  SliceData = 300,
  SliceSPTData = 301,
  SliceChildBoxData = 302,
  ThreadNearData = 303,
  XpowerData = 304,
  XpowerThreadCountData = 305,
  XpowerThreadInfoData = 306,
  XpowerGpuFreqCountData = 307,
  XpowerGpuFreqData = 308,
  XpowerStatisticData = 309,
  XpowerWifiData = 310,
  XpowerAppDetailData = 311,
  ThreadDataSysCall = 312,
}
export const MAX_COUNT = 2000;
export enum TraficEnum {
  Memory,
  SharedArrayBuffer,
  TransferArrayBuffer,
  ProtoBuffer,
}

export function threadStateToNumber(state: string): number {
  return threadStateArray.findIndex((it) => it === state);
}
export function threadStateToString(state: number): string {
  if (state === -1) {
    return '';
  } else {
    return threadStateArray[state];
  }
}
const threadStateArray = ['D-NIO', 'DK-NIO', 'D-IO', 'DK-IO', 'D', 'DK', 'R', 'R+', 'R-B', 'I', 'Running', 'S'];
