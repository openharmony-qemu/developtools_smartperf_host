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
//cpu 泳道 memory 缓存
export const cpuList: Map<number, Array<any>> = new Map();
//clock 泳道 memory 模式缓存
export const clockList: Map<string, Array<any>> = new Map();
//cpu freq 泳道 memory模式缓存
export const cpuFreqList: Map<number, Array<any>> = new Map();
//cpu freq limit 泳道 memory模式缓存
export const cpuFreqLimitList: Map<number, Array<any>> = new Map();
//cpu state 泳道 memory模式缓存
export const cpuStateList: Map<number, Array<any>> = new Map();
//thread call stack 泳道图 memory 模式缓存
export const threadCallStackList: Map<string, Array<any>> = new Map();
//irq 泳道图 memory 模式缓存
export const lrqList: Map<string, Array<any>> = new Map();
//进程 泳道图 memory 模式缓存
export const processList: Map<number, Array<any>> = new Map();
//进程内存 泳道图 memory 模式缓存数据
export const memList: Map<number, Array<any>> = new Map();
//线程状态 泳道图 memory 模式缓存
export const threadStateList: Map<string, Array<any>> = new Map();
//进程下卡顿丢帧 泳道图 memory 模式缓存
export const processFrameList: Map<string, Array<any>> = new Map();
export function clearMemoryCache(data: any, proc: Function) {
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
  hiPerfCallChartClearCache(true);
  nativeMemoryCacheClear();
  resetVmTracker();
  resetAbilityMonitor();
  resetAbility();
  resetVM();
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
      action: data.action,
      results: 'ok',
      len: 0,
      transfer: [],
    },
    []
  );
}
