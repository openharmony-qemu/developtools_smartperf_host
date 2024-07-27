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
import { hiPerfCallChartClearCache } from '../hiperf/HiperfCallChartReceiver';
import { nativeMemoryCacheClear } from '../NativeMemoryDataReceiver';
import { resetVmTracker } from '../VmTrackerDataReceiver';
import { resetVM } from '../VirtualMemoryDataReceiver';
import { resetAbilityMonitor } from '../AbilityMonitorReceiver';
import { resetAbility } from '../VmTrackerDataReceiver';
import { resetDynamicEffect } from '../FrameDynamicEffectReceiver';
import { resetEnergyEvent } from '../EnergySysEventReceiver';
// thread_state 表缓存
export const sliceList: Map<number, Array<unknown>> = new Map();
//cpu 泳道 memory 缓存
export const cpuList: Map<number, Array<unknown>> = new Map();
//clock 泳道 memory 模式缓存
export const clockList: Map<string, Array<unknown>> = new Map();
//cpu freq 泳道 memory模式缓存
export const cpuFreqList: Map<number, Array<unknown>> = new Map();
//cpu freq limit 泳道 memory模式缓存
export const cpuFreqLimitList: Map<number, Array<unknown>> = new Map();
//cpu state 泳道 memory模式缓存
export const cpuStateList: Map<number, Array<unknown>> = new Map();
//thread call stack 泳道图 memory 模式缓存
export const threadCallStackList: Map<string, Array<unknown>> = new Map();
//irq 泳道图 memory 模式缓存
export const lrqList: Map<string, Array<unknown>> = new Map();
//Lost Frame 泳道图 memory 模式缓存
export const lostFrameList: Map<number, Array<unknown>> = new Map();
//Hitch Time 泳道图 memory 模式缓存
export const hitchTimeList: Map<number, Array<unknown>> = new Map();
//进程 泳道图 memory 模式缓存
export const processList: Map<number, Array<unknown>> = new Map();
//进程内存 泳道图 memory 模式缓存数据
export const memList: Map<number, Array<unknown>> = new Map();
//线程状态 泳道图 memory 模式缓存
export const threadStateList: Map<string, Array<unknown>> = new Map();
//进程下卡顿丢帧 泳道图 memory 模式缓存
export const processFrameList: Map<string, Array<unknown>> = new Map();
//hiSysEvent 泳道图 memory 模式缓存
export const hiSysEventList: Map<string, Array<unknown>> = new Map();
//hiLog 泳道图 memory 模式缓存
export const hiLogList: Map<string, Array<unknown>> = new Map();

//energy 泳道图 memory 模式缓存
export const energyList: Map<string, Array<unknown>> = new Map();
//dma_fence 泳道图 memory 模式缓存
export const dmaFenceList: Map<string, Array<unknown>> = new Map();
export function clearMemoryCache(data: unknown, proc: Function): void {
  sliceList.clear();
  cpuList.clear();
  clockList.clear();
  cpuFreqList.clear();
  cpuFreqLimitList.clear();
  cpuStateList.clear();
  threadCallStackList.clear();
  lrqList.clear();
  processList.clear();
  memList.clear();
  threadStateList.clear();
  processFrameList.clear();
  lostFrameList.clear();
  hitchTimeList.clear();
  hiSysEventList.clear();
  hiLogList.clear();
  energyList.clear();
  hiPerfCallChartClearCache(true);
  nativeMemoryCacheClear();
  resetVmTracker();
  resetAbilityMonitor();
  resetAbility();
  resetVM();
  resetDynamicEffect();
  resetEnergyEvent();
  (self as unknown as Worker).postMessage(
    {
      //@ts-ignore
      id: data.id, //@ts-ignore
      action: data.action,
      results: 'ok',
      len: 0,
      transfer: [],
    },
    []
  );
}
