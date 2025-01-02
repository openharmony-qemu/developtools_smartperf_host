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

import { CpuRender, EmptyRender } from './cpu/ProcedureWorkerCPU';
import { RequestMessage } from './ProcedureWorkerCommon';
import { FreqRender } from './ProcedureWorkerFreq';
import { ProcessRender } from './ProcedureWorkerProcess';
import { MemRender } from './ProcedureWorkerMem';
import { ThreadRender } from './ProcedureWorkerThread';
import { FuncRender } from './ProcedureWorkerFunc';
import { FpsRender } from './ProcedureWorkerFPS';
import { HeapRender, NativeMemoryRender } from './ProcedureWorkerHeap';
import { CpuAbilityRender } from './ProcedureWorkerCpuAbility';
import { MemoryAbilityRender } from './ProcedureWorkerMemoryAbility';
import { DiskIoAbilityRender } from './ProcedureWorkerDiskIoAbility';
import { NetworkAbilityRender } from './ProcedureWorkerNetworkAbility';
import { HiperfEventRender } from './hiperf/ProcedureWorkerHiPerfEvent';
import { HiperfReportRender } from './hiperf/ProcedureWorkerHiPerfReport';
import { VirtualMemoryRender } from './ProcedureWorkerVirtualMemory';
import { EBPFRender } from './ProcedureWorkerEBPF';
import { info } from '../../../log/Log';
import { SdkSliceRender } from './ProduceWorkerSdkSlice';
import { SdkCounterRender } from './ProduceWorkerSdkCounter';
import { CpuStateRender } from './cpu/ProcedureWorkerCpuState';
import { EnergyAnomalyRender } from './ProcedureWorkerEnergyAnomaly';
import { EnergySystemRender } from './ProcedureWorkerEnergySystem';
import { EnergyPowerRender } from './ProcedureWorkerEnergyPower';
import { EnergyStateRender } from './ProcedureWorkerEnergyState';
import { CpuFreqLimitRender } from './cpu/ProcedureWorkerCpuFreqLimits';
import { HangRender } from './ProcedureWorkerHang';
import { ClockRender } from './ProcedureWorkerClock';
import { XpowerRender } from './ProcedureWorkerXpower';
import { XpowerThreadCountRender } from './ProcedureWorkerXpowerThreadCount';
import { XpowerThreadInfoRender } from './ProcedureWorkerXpowerThreadInfo';
import { IrqRender } from './ProcedureWorkerIrq';
import { JankRender } from './ProcedureWorkerJank';
import { HeapTimelineRender } from './ProcedureWorkerHeapTimeline';
import { HeapSnapshotRender } from './ProcedureWorkerHeapSnapshot';
import { translateJsonString } from '../logic-worker/ProcedureLogicWorkerCommon';
import { AppStartupRender } from './ProcedureWorkerAppStartup';
import { SoRender } from './ProcedureWorkerSoInit';
import { FrameDynamicRender } from './ProcedureWorkerFrameDynamic';
import { FrameAnimationRender } from './ProcedureWorkerFrameAnimation';
import { FrameSpacingRender } from './ProcedureWorkerFrameSpacing';
import { JsCpuProfilerRender } from './ProcedureWorkerCpuProfiler';
import { SnapshotRender } from './ProcedureWorkerSnapshot';
import { LogRender } from './ProcedureWorkerLog';
import { HiPerfCallChartRender } from './hiperf/ProcedureWorkerHiPerfCallChart';
import { HiSysEventRender } from './ProcedureWorkerHiSysEvent';
import { HiperfCpuRender2 } from './hiperf/ProcedureWorkerHiPerfCPU2';
import { HiperfProcessRender2 } from './hiperf/ProcedureWorkerHiPerfProcess2';
import { HiperfThreadRender2 } from './hiperf/ProcedureWorkerHiPerfThread2';
import { AllAppStartupRender } from './ProcedureWorkerAllAppStartup';
import { FreqExtendRender } from './ProcedureWorkerFreqExtend';
import { hitchTimeRender } from './ProcedureWorkerHitchTime';
import { LtpoRender } from './ProcedureWorkerLTPO';
import { BinderRender } from './procedureWorkerBinder';
import { SampleRender } from './ProcedureWorkerBpftrace';
import { PerfToolRender } from './ProcedureWorkerPerfTool';
import { GpuCounterRender } from './ProcedureWorkerGpuCounter';
import { AllStatesRender } from './ProcedureWorkerAllStates';
import { DmaFenceRender } from './ProcedureWorkerDmaFence';
import { XpowerStatisticRender } from './ProcedureWorkerXpowerStatistic';
import { XpowerAppDetailRender } from './ProcedureWorkerXpowerAppDetail';
import { XpowerWifiRender } from './ProcedureWorkerXpowerWifi';
import { XpowerGpuFreqCountRender } from './ProcedureWorkerXpowerGpuFreqCount';
import { XpowerGpuFreqRender } from './ProcedureWorkerXpowerGpuFreq';
import { SnapShotRender } from './ProcedureWorkerSnaps';

let dataList: unknown = {};
let dataList2: unknown = {};
let dataFilter: unknown = {};
let canvasList: unknown = {};
let contextList: unknown = {};
export let renders = {
  'cpu-data': new CpuRender(),
  'cpu-state': new CpuStateRender(),
  'cpu-limit-freq': new CpuFreqLimitRender(),
  fps: new FpsRender(),
  freq: new FreqRender(),
  empty: new EmptyRender(),
  'virtual-memory-folder': new EmptyRender(),
  'virtual-memory-cell': new VirtualMemoryRender(),
  'file-system-group': new EmptyRender(),
  'file-system-cell': new EBPFRender(),
  process: new ProcessRender(),
  'app-start-up': new AppStartupRender(),
  'all-app-start-up': new AllAppStartupRender(),
  'ltpo-present': new LtpoRender(),
  hitch: new hitchTimeRender(),
  'app-so-init': new SoRender(),
  heap: new HeapRender(),
  'heap-timeline': new HeapTimelineRender(),
  'heap-snapshot': new HeapSnapshotRender(),
  mem: new MemRender(),
  thread: new ThreadRender(),
  func: new FuncRender(),
  native: new NativeMemoryRender(),
  'HiPerf-Group': new EmptyRender(),
  monitorGroup: new EmptyRender(),
  'HiPerf-Cpu-2': new HiperfCpuRender2(),
  'HiPerf-callchart': new HiPerfCallChartRender(),
  'HiPerf-Process-2': new HiperfProcessRender2(),
  'HiPerf-Thread-2': new HiperfThreadRender2(),
  'HiPerf-Report-Event': new HiperfEventRender(),
  'HiPerf-Report-Fold': new HiperfReportRender(),
  monitorCpu: new CpuAbilityRender(),
  monitorMemory: new MemoryAbilityRender(),
  monitorDiskIo: new DiskIoAbilityRender(),
  monitorNetwork: new NetworkAbilityRender(),
  'sdk-slice': new SdkSliceRender(),
  'sdk-counter': new SdkCounterRender(),
  energyAnomaly: new EnergyAnomalyRender(),
  energySystem: new EnergySystemRender(),
  energyPower: new EnergyPowerRender(),
  energyState: new EnergyStateRender(),
  hang: new HangRender(),
  clock: new ClockRender(),
  xpower: new XpowerRender(),
  xpowerStatistic: new XpowerStatisticRender(),
  xpowerAppDetail: new XpowerAppDetailRender(),
  xpowerWifi: new XpowerWifiRender(),
  xpowerThreadCount: new XpowerThreadCountRender(),
  xpowerThreadInfo: new XpowerThreadInfoRender(),
  xpowerGpuFreqCount: new XpowerGpuFreqCountRender(),
  xpowerGpuFreq: new XpowerGpuFreqRender(),
  irq: new IrqRender(),
  jank: new JankRender(),
  frameDynamicCurve: new FrameDynamicRender(),
  frameAnimation: new FrameAnimationRender(),
  frameSpacing: new FrameSpacingRender(),
  'js-cpu-profiler': new JsCpuProfilerRender(),
  snapshot: new SnapshotRender(),
  logs: new LogRender(),
  hiSysEvent: new HiSysEventRender(),
  'freq-extend': new FreqExtendRender(),
  binder: new BinderRender(),
  sample: new SampleRender(),
  perfTool: new PerfToolRender(),
  gpuCounter: new GpuCounterRender(),
  stateCut: new AllStatesRender(),
  dmaFence:new DmaFenceRender(),
  'snap-shot': new SnapShotRender()
};

function match(type: string, req: RequestMessage): void {
  Reflect.ownKeys(renders).filter((it) => {
    if (type && type.startsWith(it as string)) {
      //@ts-ignore
      if (dataList[type]) {
        //@ts-ignore
        req.lazyRefresh = dataList[type].length > 20000;
      }
      //@ts-ignore
      renders[it].render(req, dataList[type], dataFilter[type], dataList2);
    }
  });
}

let dec = new TextDecoder();
let convertJSON = (arr: unknown): unknown => {
  if (arr instanceof ArrayBuffer) {
    let jsonArr = [];
    let str = dec.decode(new Uint8Array(arr));
    str = str.substring(str.indexOf('\n') + 1);
    if (!str) {
    } else {
      let parsed = JSON.parse(translateJsonString(str));
      let columns = parsed.columns;
      let values = parsed.values;
      for (let i = 0; i < values.length; i++) {
        let obj: unknown = {};
        for (let j = 0; j < columns.length; j++) {
          //@ts-ignore
          obj[columns[j]] = values[i][j];
        }
        jsonArr.push(obj);
      }
    }
    return jsonArr;
  } else {
    return arr;
  }
};

self.onmessage = (e: unknown): void => {
  clear(e);
  //@ts-ignore
  if (e.data.params && e.data.params.list) {
    //@ts-ignore
    dataList[e.data.type] = convertJSON(e.data.params.list);
    //@ts-ignore
    if (e.data.params.offscreen) {
      //@ts-ignore
      canvasList[e.data.type] = e.data.params.offscreen;
      //@ts-ignore
      contextList[e.data.type] = e.data.params.offscreen!.getContext('2d');
      //@ts-ignore
      contextList[e.data.type].scale(e.data.params.dpr, e.data.params.dpr);
    }
  }
  //@ts-ignore
  if (!dataFilter[e.data.type]) {
    //@ts-ignore
    dataFilter[e.data.type] = [];
  }
  let req = new RequestMessage();
  setReq(req, e);

  match(req.type!, req);
};

function clear(e: unknown): void {
  //@ts-ignore
  if (e.data.type && (e.data.type as string).startsWith('clear')) {
    dataList = {};
    dataList2 = {};
    dataFilter = {};
    canvasList = {};
    contextList = {};
    // @ts-ignore
    self.postMessage({
      //@ts-ignore
      id: e.data.id,
      //@ts-ignore
      type: e.data.type,
      results: null,
    });
    return;
  }
}

function setReq(req: RequestMessage, e: unknown): void {
  //@ts-ignore
  req.canvas = canvasList[e.data.type];
  //@ts-ignore
  req.context = contextList[e.data.type];
  //@ts-ignore
  req.type = e.data.type as string;
  //@ts-ignore
  req.params = e.data.params;
  //@ts-ignore
  if (e.data.params) {
    //@ts-ignore
    req.online = e.data.params.online;
    //@ts-ignore
    req.buf = e.data.params.buf;
    //@ts-ignore
    req.isRangeSelect = e.data.params.isRangeSelect;
    //@ts-ignore
    req.isHover = e.data.params.isHover;
    //@ts-ignore
    req.xs = e.data.params.xs;
    //@ts-ignore
    req.frame = e.data.params.frame;
    //@ts-ignore
    req.flagMoveInfo = e.data.params.flagMoveInfo;
    //@ts-ignore
    req.flagSelectedInfo = e.data.params.flagSelectedInfo;
    //@ts-ignore
    req.hoverX = e.data.params.hoverX;
    //@ts-ignore
    req.hoverY = e.data.params.hoverY;
    //@ts-ignore
    req.startNS = e.data.params.startNS;
    //@ts-ignore
    req.endNS = e.data.params.endNS;
    //@ts-ignore
    req.totalNS = e.data.params.totalNS;
    //@ts-ignore
    req.slicesTime = e.data.params.slicesTime;
    //@ts-ignore
    req.range = e.data.params.range;
    //@ts-ignore
    req.scale = e.data.params.scale;
    //@ts-ignore
    req.canvasWidth = e.data.params.canvasWidth;
    //@ts-ignore
    req.canvasHeight = e.data.params.canvasHeight;
    //@ts-ignore
    req.useCache = e.data.params.useCache;
    //@ts-ignore
    req.lineColor = e.data.params.lineColor;
    //@ts-ignore
    req.chartColor = e.data.params.chartColor;
    //@ts-ignore
    req.wakeupBean = e.data.params.wakeupBean;
    //@ts-ignore
    req.intervalPerf = e.data.params.intervalPerf;
  }
  //@ts-ignore
  req.id = e.data.id;
  if (!req.frame) {
    info(req.frame);
    return;
  }
  if (req.canvas) {
    //@ts-ignore
    if (req.canvas.width !== req.canvasWidth || req.canvas.height !== req.canvasHeight) {
      //@ts-ignore
      req.canvas.width = req.canvasWidth;
      //@ts-ignore
      req.canvas.height = req.canvasHeight;
      //@ts-ignore
      req.context.scale(e.data.params.dpr, e.data.params.dpr);
    }
  }
}

self.onmessageerror = function (e: unknown): void {};
