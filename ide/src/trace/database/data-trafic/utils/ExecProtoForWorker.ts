/*
 * Copyright (C) 2022 Huawei Device Co., Ltd.
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

import { QueryEnum } from './QueryEnum';
import { cpuDataReceiver, searchDataHandler } from '../CpuDataReceiver';
import { processDataReceiver } from '../process/ProcessDataReceiver';
import { threadDataReceiver } from '../process//ThreadDataReceiver';
import { funcDataReceiver } from '../process//FuncDataReceiver';
import { hiperfCpuDataReceiver } from '../hiperf/HiperfCpuDataReceiver';
import { hiperfProcessDataReceiver } from '../hiperf/HiperfProcessDataReceiver';
import { hiperfThreadDataReceiver } from '../hiperf/HiperfThreadDataReceiver';
import { cpuStateReceiver } from '../cpu/CpuStateReceiver';
import { cpuFreqLimitReceiver } from '../cpu/CpuFreqLimitDataReceiver';
import { clockDataReceiver } from '../ClockDataReceiver';
import { irqDataReceiver } from '../IrqDataReceiver';
import { processExpectedDataReceiver } from '../process/ProcessExpectedDataReceiver';
import { processActualDataReceiver } from '../process//ProcessActualDataReceiver';
import { hiPerfCallChartDataHandler, hiPerfCallStackCacheHandler } from '../hiperf/HiperfCallChartReceiver';
import { virtualMemoryDataReceiver } from '../VirtualMemoryDataReceiver';
import { processMemDataReceiver } from '../process//ProcessMemDataReceiver';
import { processStartupDataReceiver } from '../process//ProcessStartupDataReceiver';
import { processSoInitDataReceiver } from '../process//ProcessSoInitDataReceiver';
import { processDeliverInputEventDataReceiver } from '../process//ProcessDeliverInputEventDataReceiver';
import { processTouchEventDispatchDataReceiver } from '../process//ProcessTouchEventDispatchDataReceiver';
import { xpowerDataReceiver } from '../xpower/XpowerDataReceiver';
import { xpowerWifiDataReceiver } from '../xpower/XpowerWifiDataReceiver';
import { xpowerAppDetailDataReceiver } from '../xpower/XpowerAppDetailDataReceiver';
import {
  dmaDataReceiver,
  gpuDataReceiver,
  gpuMemoryDataReceiver,
  gpuResourceDataReceiver,
  gpuTotalDataReceiver,
  gpuWindowDataReceiver,
  purgeableDataReceiver,
  sMapsDataReceiver,
  shmDataReceiver,
  abilityDmaDataReceiver,
  abilityGpuMemoryDataReceiver,
  abilityPurgeableDataReceiver,
} from '../VmTrackerDataReceiver';
import {
  abilityBytesInTraceDataReceiver,
  abilityBytesOutTraceDataReceiver,
  abilityMemoryUsedDataReceiver,
  abilityPacketInTraceDataReceiver,
  abilityPacketsOutTraceDataReceiver,
  cpuAbilityMonitorDataReceiver,
  cpuAbilitySystemDataReceiver,
  cpuAbilityUserDataReceiver,
  abilityBytesReadDataReceiver,
  abilityBytesWrittenDataReceiver,
  abilityReadOpsDataReceiver,
  abilityWrittenOpsDataReceiver,
} from '../AbilityMonitorReceiver';
import { hiSysEventDataReceiver } from '../HiSysEventDataReceiver';
import { logDataReceiver } from '../LogDataReceiver';
import { cpuProfilerDataReceiver } from '../ArkTsReceiver';
import { frameActualReceiver, frameExpectedReceiver } from '../FrameJanksReceiver';
import { diskIoReceiver, eBPFVmReceiver, fileSystemDataReceiver } from '../EBPFReceiver';
import { nativeMemoryDataHandler } from '../NativeMemoryDataReceiver';
import { frameAnimationReceiver, frameDynamicReceiver, frameSpacingReceiver } from '../FrameDynamicEffectReceiver';
import {
  energySysEventReceiver,
  hiSysEnergyAnomalyDataReceiver,
  hiSysEnergyPowerReceiver,
  hiSysEnergyStateReceiver,
} from '../EnergySysEventReceiver';
import { clearMemoryCache } from './AllMemoryCache';
import { cpuFreqDataReceiver } from '../cpu/CpuFreqDataReceiver';
import { lostFrameReceiver } from './../LostFrameReceiver';
import { sliceReceiver, sliceSPTReceiver } from '../SliceReceiver';
import { dmaFenceReceiver } from './../dmaFenceReceiver';
import { hangDataReceiver } from '../HangDataReceiver';
import { xpowerStatisticDataReceiver } from '../xpower/XpowerStatisticDataReceiver';
import { xpowerDataGpuFreqCountReceiver, xpowerDataGpuFreqReceiver } from '../xpower/XpowerGpuFrequencyRecevier';
import { xpowerDataThreadCountReceiver, xpowerDataThreadInfoReceiver } from '../xpower/XpowerThreadReceiver';

// @ts-ignore
const traficHandlers: Map<number, unknown> = new Map<number, unknown>([]); // @ts-ignore
export const execProtoForWorker = (data: unknown, proc: Function): void => traficHandlers.get(data.name)?.(data, proc);

traficHandlers.set(QueryEnum.ClearMemoryCache, clearMemoryCache);
traficHandlers.set(QueryEnum.CpuData, cpuDataReceiver);
traficHandlers.set(QueryEnum.SearchCpuData, searchDataHandler);
traficHandlers.set(QueryEnum.CpuFreqData, cpuFreqDataReceiver);
traficHandlers.set(QueryEnum.CpuStateData, cpuStateReceiver);
traficHandlers.set(QueryEnum.CpuFreqLimitData, cpuFreqLimitReceiver);
traficHandlers.set(QueryEnum.ProcessData, processDataReceiver);
traficHandlers.set(QueryEnum.ThreadData, threadDataReceiver);
traficHandlers.set(QueryEnum.FuncData, funcDataReceiver);
traficHandlers.set(QueryEnum.HiperfCallChart, hiPerfCallChartDataHandler);
traficHandlers.set(QueryEnum.HiperfCallStack, hiPerfCallStackCacheHandler);
traficHandlers.set(QueryEnum.HiperfCpuData, hiperfCpuDataReceiver);
traficHandlers.set(QueryEnum.HiperfProcessData, hiperfProcessDataReceiver);
traficHandlers.set(QueryEnum.HiperfThreadData, hiperfThreadDataReceiver);
traficHandlers.set(QueryEnum.NativeMemoryChartCacheNormal, nativeMemoryDataHandler);
traficHandlers.set(QueryEnum.NativeMemoryChartCacheStatistic, nativeMemoryDataHandler);
traficHandlers.set(QueryEnum.NativeMemoryChartData, nativeMemoryDataHandler);
traficHandlers.set(QueryEnum.HangData, hangDataReceiver);
traficHandlers.set(QueryEnum.ClockData, clockDataReceiver);
traficHandlers.set(QueryEnum.IrqData, irqDataReceiver);
traficHandlers.set(QueryEnum.VirtualMemoryData, virtualMemoryDataReceiver);
traficHandlers.set(QueryEnum.ProcessMemData, processMemDataReceiver);
traficHandlers.set(QueryEnum.ProcessStartupData, processStartupDataReceiver);
traficHandlers.set(QueryEnum.ProcessSoInitData, processSoInitDataReceiver);
traficHandlers.set(QueryEnum.processExpectedData, processExpectedDataReceiver);
traficHandlers.set(QueryEnum.processActualData, processActualDataReceiver);
traficHandlers.set(QueryEnum.processDeliverInputEventData, processDeliverInputEventDataReceiver);
traficHandlers.set(QueryEnum.processTouchEventDispatchData, processTouchEventDispatchDataReceiver);
traficHandlers.set(QueryEnum.VmTrackerSmapsData, sMapsDataReceiver);
traficHandlers.set(QueryEnum.VmTrackerDmaData, dmaDataReceiver);
traficHandlers.set(QueryEnum.VmTrackerGpuMemoryData, gpuMemoryDataReceiver);
traficHandlers.set(QueryEnum.VmTrackerGpuData, gpuDataReceiver);
traficHandlers.set(QueryEnum.VmTrackerGpuResourceData, gpuResourceDataReceiver);
traficHandlers.set(QueryEnum.VmTrackerGpuTotalData, gpuTotalDataReceiver);
traficHandlers.set(QueryEnum.VmTrackerGpuWindowData, gpuWindowDataReceiver);
traficHandlers.set(QueryEnum.VmTrackerShmData, shmDataReceiver);
traficHandlers.set(QueryEnum.VmTrackerPurgeableData, purgeableDataReceiver);
traficHandlers.set(QueryEnum.AbilityMemoryUsedData, abilityMemoryUsedDataReceiver);
traficHandlers.set(QueryEnum.CpuAbilityUserData, cpuAbilityUserDataReceiver);
traficHandlers.set(QueryEnum.CpuAbilitySystemData, cpuAbilitySystemDataReceiver);
traficHandlers.set(QueryEnum.CpuAbilityMonitorData, cpuAbilityMonitorDataReceiver);
traficHandlers.set(QueryEnum.AbilityBytesReadData, abilityBytesReadDataReceiver);
traficHandlers.set(QueryEnum.AbilityBytesWrittenData, abilityBytesWrittenDataReceiver);
traficHandlers.set(QueryEnum.AbilityReadOpsData, abilityReadOpsDataReceiver);
traficHandlers.set(QueryEnum.AbilityWrittenOpsData, abilityWrittenOpsDataReceiver);
traficHandlers.set(QueryEnum.AbilityBytesInTraceData, abilityBytesInTraceDataReceiver);
traficHandlers.set(QueryEnum.AbilityBytesOutTraceData, abilityBytesOutTraceDataReceiver);
traficHandlers.set(QueryEnum.AbilityPacketInTraceData, abilityPacketInTraceDataReceiver);
traficHandlers.set(QueryEnum.AbilityPacketsOutTraceData, abilityPacketsOutTraceDataReceiver);
traficHandlers.set(QueryEnum.AbilityPurgeableData, abilityPurgeableDataReceiver);
traficHandlers.set(QueryEnum.AbilityDmaData, abilityDmaDataReceiver);
traficHandlers.set(QueryEnum.AbilityGpuMemoryData, abilityGpuMemoryDataReceiver);
traficHandlers.set(QueryEnum.HiSysEventData, hiSysEventDataReceiver);
traficHandlers.set(QueryEnum.HilogData, logDataReceiver);
traficHandlers.set(QueryEnum.FileSystemData, fileSystemDataReceiver);
traficHandlers.set(QueryEnum.DiskIoData, diskIoReceiver);
traficHandlers.set(QueryEnum.EBPFVm, eBPFVmReceiver);
traficHandlers.set(QueryEnum.CpuProfilerData, cpuProfilerDataReceiver);
traficHandlers.set(QueryEnum.FrameExpectedData, frameExpectedReceiver);
traficHandlers.set(QueryEnum.FrameActualData, frameActualReceiver);
traficHandlers.set(QueryEnum.EnergyAnomalyData, hiSysEnergyAnomalyDataReceiver);
traficHandlers.set(QueryEnum.EnergyStateData, hiSysEnergyStateReceiver);
traficHandlers.set(QueryEnum.EnergyPowerData, hiSysEnergyPowerReceiver);
traficHandlers.set(QueryEnum.FrameAnimationData, frameAnimationReceiver);
traficHandlers.set(QueryEnum.FrameDynamicData, frameDynamicReceiver);
traficHandlers.set(QueryEnum.FrameSpacingData, frameSpacingReceiver);
traficHandlers.set(QueryEnum.EnergySystemData, energySysEventReceiver);
traficHandlers.set(QueryEnum.LostFrameData, lostFrameReceiver);
traficHandlers.set(QueryEnum.SliceData, sliceReceiver);
traficHandlers.set(QueryEnum.SliceSPTData, sliceSPTReceiver);
traficHandlers.set(QueryEnum.dmaFenceData, dmaFenceReceiver);
traficHandlers.set(QueryEnum.SliceChildBoxData, sliceSPTReceiver);
traficHandlers.set(QueryEnum.ThreadNearData, sliceSPTReceiver);
traficHandlers.set(QueryEnum.XpowerData, xpowerDataReceiver);
traficHandlers.set(QueryEnum.XpowerWifiData, xpowerWifiDataReceiver);
traficHandlers.set(QueryEnum.XpowerAppDetailData, xpowerAppDetailDataReceiver);
traficHandlers.set(QueryEnum.XpowerStatisticData, xpowerStatisticDataReceiver);
traficHandlers.set(QueryEnum.XpowerThreadCountData, xpowerDataThreadCountReceiver);
traficHandlers.set(QueryEnum.XpowerThreadInfoData, xpowerDataThreadInfoReceiver);
traficHandlers.set(QueryEnum.XpowerGpuFreqCountData, xpowerDataGpuFreqCountReceiver);
traficHandlers.set(QueryEnum.XpowerGpuFreqData, xpowerDataGpuFreqReceiver);