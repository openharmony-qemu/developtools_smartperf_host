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

import { CpuFreqLimitsStruct } from '../database/ui-worker/ProcedureWorkerCpuFreqLimits';
import { ClockStruct } from '../database/ui-worker/ProcedureWorkerClock';
import { IrqStruct } from '../database/ui-worker/ProcedureWorkerIrq';
import { FuncStruct } from '../database/ui-worker/ProcedureWorkerFunc';
import { FrameDynamicStruct } from '../database/ui-worker/ProcedureWorkerFrameDynamic';
import { FrameAnimationStruct } from '../database/ui-worker/ProcedureWorkerFrameAnimation';
import { FrameSpacingStruct } from '../database/ui-worker/ProcedureWorkerFrameSpacing';
import { JsCpuProfilerChartFrame } from './JsStruct';
import { LogStruct } from '../database/ui-worker/ProcedureWorkerLog';
import { HiSysEventStruct } from '../database/ui-worker/ProcedureWorkerHiSysEvent';

export class SelectionParam {
  recordStartNs: number = 0;
  leftNs: number = 0;
  rightNs: number = 0;
  hasFps: boolean = false;
  statisticsSelectData: any = undefined;
  fileSystemVMData: any = undefined;
  fileSystemIoData: any = undefined;
  fileSystemFsData: any = undefined;
  perfAll: boolean = false;
  fileSysVirtualMemory: boolean = false;
  diskIOLatency: boolean = false;
  fsCount: number = 0;
  vmCount: number = 0;
  isCurrentPane: boolean = false;
  startup: boolean = false;
  staticInit: boolean = false;
  isRowClick: boolean = false;
  eventTypeId: string = '';

  cpus: Array<number> = [];
  cpuStateRowsId: Array<object> = [];
  //新增框选cpu freq row名
  cpuFreqFilterNames: Array<string> = [];
  cpuStateFilterIds: Array<number> = [];
  cpuFreqFilterIds: Array<number> = [];
  threadIds: Array<number> = [];
  processIds: Array<number> = [];
  processTrackIds: Array<number> = [];
  virtualTrackIds: Array<number> = [];
  cpuFreqLimit: Array<any> = [];
  clockMapData: Map<string, ((arg: any) => Promise<Array<any>> | undefined) | undefined>
    = new Map<string, ((arg: any) => (Promise<Array<any>> | undefined)) | undefined>();
  irqCallIds: Array<number> = [];
  softIrqCallIds: Array<number> = [];
  funTids: Array<number> = [];
  funAsync: Array<{ name: string; pid: number }> = [];
  nativeMemory: Array<String> = [];
  nativeMemoryStatistic: Array<String> = [];
  nativeMemoryAllProcess: Array<{ pid: number; ipid: number }> = [];
  nativeMemoryCurrentIPid: number = -1;
  cpuAbilityIds: Array<string> = [];
  memoryAbilityIds: Array<string> = [];
  diskAbilityIds: Array<string> = [];
  networkAbilityIds: Array<string> = [];
  perfSampleIds: Array<number> = [];
  perfEventTypeId?: number;
  perfCpus: Array<number> = [];
  perfProcess: Array<number> = [];
  perfThread: Array<number> = [];
  fileSystemType: Array<number> = [];
  sdkCounterIds: Array<string> = [];
  sdkSliceIds: Array<string> = [];
  diskIOipids: Array<number> = [];
  diskIOReadIds: Array<number> = [];
  diskIOWriteIds: Array<number> = [];
  systemEnergy: Array<string> = [];
  powerEnergy: Array<string> = [];
  anomalyEnergy: Array<string> = [];
  smapsType: Array<string> = [];
  vmtrackershm: Array<string> = [];
  promiseList: Array<Promise<any>> = [];
  jankFramesData: Array<any> = [];
  jsMemory: Array<any> = [];
  taskFramesData: Array<FuncStruct> = [];
  frameDynamic: Array<FrameDynamicStruct> = [];
  frameAnimation: Array<FrameAnimationStruct> = [];
  frameSpacing: Array<FrameSpacingStruct> = [];
  jsCpuProfilerData: Array<JsCpuProfilerChartFrame> = [];
  gpu: {
    gl: boolean;
    graph: boolean;
    gpuTotal: boolean;
    gpuWindow: boolean;
  } = {
    gl: false,
    graph: false,
    gpuWindow: false,
    gpuTotal: false,
  };
  purgeableTotalAbility: Array<any> = [];
  purgeableTotalVM: Array<any> = [];
  purgeablePinAbility: Array<any> = [];
  purgeablePinVM: Array<any> = [];
  purgeableTotalSelection: Array<any> = [];
  purgeablePinSelection: Array<any> = [];
  dmaAbilityData: Array<any> = [];
  gpuMemoryAbilityData: Array<any> = [];
  dmaVmTrackerData: Array<any> = [];
  gpuMemoryTrackerData: Array<any> = [];
  hiLogs: Array<string> = [];
  sysAllEventsData: Array<HiSysEventStruct> = [];
  sysAlllogsData: Array<LogStruct> = [];
  hiSysEvents: Array<string> = [];
}

export class BoxJumpParam {
  leftNs: number = 0;
  rightNs: number = 0;
  cpus: Array<number> = [];
  state: string = '';
  processId: number = 0;
  threadId: number = 0;
}

export class SelectionData {
  name: string = '';
  process: string = '';
  pid: string = '';
  thread: string = '';
  tid: string = '';
  wallDuration: number = 0;
  wallDurationFormat: string = '';
  avgDuration: string = '';
  maxDuration: number = 0;
  maxDurationFormat: string = '';
  occurrences: number = 0;
  state: string = '';
  trackId: number = 0;
  delta: string = '';
  rate: string = '';
  avgWeight: string = '';
  count: string = '';
  first: string = '';
  last: string = '';
  min: string = '';
  max: string = '';
  stateJX: string = '';
  cpu: number = 0;
  recordStartNs: number = 0;
  leftNs: number = 0;
  rightNs: number = 0;
  threadIds: Array<number> = [];
  ts: number = 0;
  dur: number = 0;
}

export class Counter {
  id: number = 0;
  trackId: number = 0;
  name: string = '';
  value: number = 0;
  startTime: number = 0;
}

export class Fps {
  startNS: number = 0;
  timeStr: string = '';
  fps: number = 0;
}
