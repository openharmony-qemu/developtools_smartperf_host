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

import { FuncStruct } from '../database/ui-worker/ProcedureWorkerFunc';
import { FrameDynamicStruct } from '../database/ui-worker/ProcedureWorkerFrameDynamic';
import { FrameAnimationStruct } from '../database/ui-worker/ProcedureWorkerFrameAnimation';
import { FrameSpacingStruct } from '../database/ui-worker/ProcedureWorkerFrameSpacing';
import { JsCpuProfilerChartFrame } from './JsStruct';
import { LogStruct } from '../database/ui-worker/ProcedureWorkerLog';
import { HiSysEventStruct } from '../database/ui-worker/ProcedureWorkerHiSysEvent';
import { RangeSelectStruct, TraceRow } from '../component/trace/base/TraceRow';
import { info } from '../../log/Log';
import { SpSystemTrace } from '../component/SpSystemTrace';
import { intersectData, isExistPidInArray, setSelectState } from '../component/Utils';
import { TabPaneTaskFrames } from '../component/trace/sheet/task/TabPaneTaskFrames';
import { JanksStruct } from './JanksStruct';
import { HeapDataInterface } from '../../js-heap/HeapDataInterface';
import { LitTabs } from '../../base-ui/tabs/lit-tabs';
import { TabPaneSummary } from '../component/trace/sheet/ark-ts/TabPaneSummary';
import { JsCpuProfilerStruct } from '../database/ui-worker/ProcedureWorkerCpuProfiler';
import { SampleStruct } from '../database/ui-worker/ProcedureWorkerBpftrace';
import { GpuCounterStruct } from '../database/ui-worker/ProcedureWorkerGpuCounter';
import { Utils } from '../component/trace/base/Utils';
import { XpowerStatisticStruct } from '../database/ui-worker/ProcedureWorkerXpowerStatistic';
import { XpowerThreadInfoStruct } from '../database/ui-worker/ProcedureWorkerXpowerThreadInfo';
import { THREAD_ENERGY, THREAD_LOAD } from '../component/chart/SpXpowerChart';
import { SpHiPerf } from '../component/chart/SpHiPerf';

export class SelectionParam {
  traceId: string | undefined | null;
  recordStartNs: number = 0;
  leftNs: number = 0;
  rightNs: number = 0;
  hasFps: boolean = false;
  statisticsSelectData: unknown = undefined;
  fileSystemVMData: unknown = undefined;
  fileSystemIoData: unknown = undefined;
  fileSystemFsData: unknown = undefined;
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
  cpuFreqLimit: Array<unknown> = [];
  clockMapData: Map<string, ((arg: unknown) => Promise<Array<unknown>> | undefined) | undefined> = new Map<
    string,
    ((arg: unknown) => Promise<Array<unknown>> | undefined) | undefined
  >();
  dmaFenceNameData: Array<String> = [];//新增框选dma_fence数据
  xpowerMapData: Map<string, ((arg: unknown) => Promise<Array<unknown>> | undefined) | undefined> = new Map<
    string,
    ((arg: unknown) => Promise<Array<unknown>> | undefined) | undefined
  >();
  xpowerComponentTopMapData: Map<string, ((arg: unknown) => Promise<Array<unknown>> | undefined) | undefined> = new Map<
    string,
    ((arg: unknown) => Promise<Array<unknown>> | undefined) | undefined
  >();
  xpowerStatisticMapData: Map<string, ((arg: unknown) => Promise<Array<unknown>> | undefined) | undefined> = new Map();
  xpowerDisplayMapData: Map<string, ((arg: unknown) => Promise<Array<unknown>> | undefined) | undefined> = new Map();
  xpowerWifiPacketsMapData: Map<string, ((arg: unknown) => Promise<Array<unknown>> | undefined) | undefined> = new Map();
  xpowerWifiBytesMapData: Map<string, ((arg: unknown) => Promise<Array<unknown>> | undefined) | undefined> = new Map();
  xpowerThreadEnergyMapData: Map<string, ((arg: unknown) => Promise<Array<unknown>> | undefined) | undefined> = new Map<
    string,
    ((arg: unknown) => Promise<Array<unknown>> | undefined) | undefined
  >();
  xpowerThreadLoadMapData: Map<string, ((arg: unknown) => Promise<Array<unknown>> | undefined) | undefined> = new Map<
    string,
    ((arg: unknown) => Promise<Array<unknown>> | undefined) | undefined
  >();
  xpowerGpuFreqMapData: Map<string, ((arg: unknown) => Promise<Array<unknown>> | undefined) | undefined> = new Map<
    string,
    ((arg: unknown) => Promise<Array<unknown>> | undefined) | undefined
  >();

  hangMapData: Map<string, ((arg: unknown) => Promise<Array<unknown>> | undefined) | undefined> = new Map();
  irqCallIds: Array<number> = [];
  softIrqCallIds: Array<number> = [];
  funTids: Array<number> = [];
  threadSysCallIds: Array<number> = [];
  processSysCallIds: Array<number> = [];
  funAsync: Array<{ name: string; pid: number, tid: number | undefined }> = [];
  funCatAsync: Array<{ pid: number; threadName: string }> = [];
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
  promiseList: Array<Promise<unknown>> = [];
  jankFramesData: Array<unknown> = [];
  jsMemory: Array<unknown> = [];
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
  purgeableTotalAbility: Array<unknown> = [];
  purgeableTotalVM: Array<unknown> = [];
  purgeablePinAbility: Array<unknown> = [];
  purgeablePinVM: Array<unknown> = [];
  purgeableTotalSelection: Array<unknown> = [];
  purgeablePinSelection: Array<unknown> = [];
  dmaAbilityData: Array<unknown> = [];
  gpuMemoryAbilityData: Array<unknown> = [];
  dmaVmTrackerData: Array<unknown> = [];
  gpuMemoryTrackerData: Array<unknown> = [];
  hiLogs: Array<string> = [];
  sysAllEventsData: Array<HiSysEventStruct> = [];
  sysAlllogsData: Array<LogStruct> = [];
  hiSysEvents: Array<string> = [];
  sampleData: Array<unknown> = [];
  gpuCounter: Array<unknown> = [];
  isImportSo: boolean = false;

  // @ts-ignore
  pushSampleData(it: TraceRow<unknown>): void {
    if (it.rowType === TraceRow.ROW_TYPE_SAMPLE) {
      let dataList: SampleStruct[] = JSON.parse(JSON.stringify(it.dataList));
      if (dataList.length > 0) {
        dataList.forEach((SampleStruct) => {
          SampleStruct.property = SampleStruct.property!.filter(
            (i: unknown) =>
              // @ts-ignore
              (i.begin! - i.startTs! ?? 0) >= TraceRow.rangeSelectObject!.startNS! &&
              // @ts-ignore
              (i.end! - i.startTs! ?? 0) <= TraceRow.rangeSelectObject!.endNS!
          );
        });
        if (dataList[0].property!.length !== 0) {
          this.sampleData.push(...dataList);
        }
      }
    }
  }

  // @ts-ignore
  pushCpus(it: TraceRow<unknown>): void {
    if (it.rowType === TraceRow.ROW_TYPE_CPU) {
      this.cpus.push(parseInt(it.rowId!));
      info('load CPU traceRow id is : ', it.rowId);
    }
  }

  // @ts-ignore
  pushSysCallIds(it: TraceRow<unknown>): void {
    if (it.rowType === TraceRow.ROW_TYPE_THREAD_SYS_CALL) {
      const arr = it.rowId?.split('-');
      if (arr && arr.length === 3) {
        this.threadSysCallIds.push(parseInt(arr[1]));
      }
    }
  }

  // @ts-ignore
  pushCpuStateFilterIds(it: TraceRow<unknown>): void {
    if (it.rowType === TraceRow.ROW_TYPE_CPU_STATE_ALL) {
      it.childrenList.forEach((child) => {
        child.rangeSelect = true;
        child.checkType = '2';
        this.pushCpuStateFilterIds(child);
      });
    }
    if (it.rowType === TraceRow.ROW_TYPE_CPU_STATE) {
      let filterId = parseInt(it.rowId!);
      if (this.cpuStateFilterIds.indexOf(filterId) === -1) {
        this.cpuStateFilterIds.push(filterId);
      }
    }
  }

  // @ts-ignore
  pushCpuFreqFilter(it: TraceRow<unknown>): void {
    if (it.rowType === TraceRow.ROW_TYPE_CPU_FREQ_ALL) {
      it.childrenList.forEach((child) => {
        child.rangeSelect = true;
        child.checkType = '2';
        this.pushCpuFreqFilter(child);
      });
    }
    if (it.rowType === TraceRow.ROW_TYPE_CPU_FREQ) {
      let filterId = parseInt(it.rowId!);
      let filterName = it.name!;
      if (this.cpuFreqFilterIds.indexOf(filterId) === -1) {
        this.cpuFreqFilterIds.push(filterId);
      }
      if (this.cpuFreqFilterNames.indexOf(filterName) === -1) {
        this.cpuFreqFilterNames.push(filterName);
      }
    }
  }

  // @ts-ignore
  pushCpuFreqLimit(it: TraceRow<unknown>): void {
    if (it.rowType === TraceRow.ROW_TYPE_CPU_FREQ_LIMITALL) {
      it.childrenList.forEach((child) => {
        child.rangeSelect = true;
        child.checkType = '2';
        this.pushCpuFreqLimit(child);
      });
    }
    if (it.rowType === TraceRow.ROW_TYPE_CPU_FREQ_LIMIT) {
      // @ts-ignore
      if (!this.cpuFreqLimit.includes((item: unknown) => item.cpu === it.getAttribute('cpu'))) {
        this.cpuFreqLimit.push({
          maxFilterId: it.getAttribute('maxFilterId'),
          minFilterId: it.getAttribute('minFilterId'),
          cpu: it.getAttribute('cpu'),
        });
      }
    }
  }

  // @ts-ignore
  pushProcess(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_PROCESS || it.rowType === TraceRow.ROW_TYPE_IMPORT) {
      sp.pushPidToSelection(this, it.rowId!, it.summaryProtoPid);
      sp.pushPidToSelection(this, it.rowId!);
      if (it.getRowSettingCheckStateByKey('SysCall Event')) {
        let pid = parseInt(it.rowId!);
        if (!isNaN(pid!)) {
          if (!this.processSysCallIds.includes(pid!)) {
            this.processSysCallIds.push(pid!);
          }
        }
      }
      if (it.getAttribute('hasStartup') === 'true') {
        this.startup = true;
      }
      if (it.getAttribute('hasStaticInit') === 'true') {
        this.staticInit = true;
      }
      // @ts-ignore
      let processChildRows: Array<TraceRow<unknown>> = [
        // @ts-ignore
        ...sp.shadowRoot!.querySelectorAll<TraceRow<unknown>>(`trace-row[row-parent-id='${it.rowId}']`),
      ];
      if (!it.expansion) {
        processChildRows = [...it.childrenList];
      }
      processChildRows.forEach((th) => {
        th.rangeSelect = true;
        th.checkType = '2';
        if (th.rowType === TraceRow.ROW_TYPE_THREAD) {
          this.threadIds.push(parseInt(th.rowId!));
        } else if (th.rowType === TraceRow.ROW_TYPE_FUNC) {
          if (th.asyncFuncName) {
            if (typeof th.asyncFuncName === 'string') {
              this.funAsync.push({
                name: th.asyncFuncName,
                pid: th.asyncFuncNamePID || 0,
                tid: th.asyncFuncStartTID
              });
            } else {
              for (let i = 0; i < th.asyncFuncName.length; i++) {
                const el = th.asyncFuncName[i];
                this.funAsync.push({
                  name: el,
                  pid: th.asyncFuncNamePID || 0,
                  tid: th.asyncFuncStartTID
                });
              }
            }
          } else if (th.asyncFuncThreadName) {
            if (typeof th.asyncFuncThreadName === 'string') {
              this.funCatAsync.push({
                pid: th.asyncFuncNamePID || 0,
                threadName: th.asyncFuncThreadName,
              });
            }
          } else {
            this.funTids.push(parseInt(th.rowId!));
          }
        } else if (th.rowType === TraceRow.ROW_TYPE_MEM) {
          this.processTrackIds.push(parseInt(th.rowId!));
        }
      });
      info('load process traceRow id is : ', it.rowId);
    }
  }

  // @ts-ignore
  pushNativeMemory(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_NATIVE_MEMORY) {
      // @ts-ignore
      let memoryRows: Array<TraceRow<unknown>> = [
        // @ts-ignore
        ...sp.shadowRoot!.querySelectorAll<TraceRow<unknown>>(`trace-row[row-parent-id='${it.rowId}']`),
      ];
      if (!it.expansion) {
        memoryRows = [...it.childrenList];
      }
      const rowKey = it.rowId!.split(' ');
      const process = {
        ipid: Number(rowKey[rowKey.length - 1]),
        pid: Number(rowKey[rowKey.length - 2]),
      };
      if (!isExistPidInArray(this.nativeMemoryAllProcess, process.pid)) {
        this.nativeMemoryAllProcess.push(process);
      }
      if (this.nativeMemoryCurrentIPid === -1) {
        this.nativeMemoryCurrentIPid = process.ipid;
      }
      memoryRows.forEach((th) => {
        th.rangeSelect = true;
        th.checkType = '2';
        if (th.getAttribute('heap-type') === 'native_hook_statistic') {
          this.nativeMemoryStatistic.push(th.rowId!);
        } else {
          this.nativeMemory.push(th.rowId!);
        }
      });
      info('load nativeMemory traceRow id is : ', it.rowId);
    }
  }

  // @ts-ignore
  pushFunc(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_FUNC) {
      TabPaneTaskFrames.TaskArray = [];
      sp.pushPidToSelection(this, it.rowParentId!, it.protoPid);
      if (it.asyncFuncName) {
        if (typeof it.asyncFuncName === 'string') {
          this.funAsync.push({
            name: it.asyncFuncName,
            pid: it.asyncFuncNamePID || 0,
            tid: it.asyncFuncStartTID
          });
        } else {
          //@ts-ignore
          for (let i = 0; i < it.asyncFuncName.length; i++) {
            const el = it.asyncFuncName[i];
            this.funAsync.push({
              name: el,
              pid: it.asyncFuncNamePID || 0,
              tid: it.asyncFuncStartTID
            });
          }
        }
      } else if (it.asyncFuncThreadName) {
        if (typeof it.asyncFuncThreadName === 'string') {
          this.funCatAsync.push({
            pid: it.asyncFuncNamePID || 0,
            threadName: it.asyncFuncThreadName
          });
        } else {
          for (let i = 0; i < it.asyncFuncThreadName.length; i++) {
            const tn = it.asyncFuncThreadName[i];
            this.funCatAsync.push({
              pid: it.asyncFuncNamePID || 0, //@ts-ignore
              threadName: tn
            });
          }
        }
      } else {
        this.funTids.push(parseInt(it.rowId!));
      }

      let isIntersect = (filterFunc: FuncStruct, rangeData: RangeSelectStruct): boolean =>
        Math.max(filterFunc.startTs! + filterFunc.dur!, rangeData!.endNS || 0) -
        Math.min(filterFunc.startTs!, rangeData!.startNS || 0) <
        filterFunc.dur! + (rangeData!.endNS || 0) - (rangeData!.startNS || 0) &&
        filterFunc.funName!.indexOf('H:Task ') >= 0;
      // @ts-ignore
      let taskData = it.dataListCache.filter((taskData: FuncStruct) => {
        taskData!.tid = isNaN(Number(it.rowId!)) && typeof it.rowId! === 'string' ?
          (function (): number | undefined {
            const match = (it.rowId!).match(/-(\d+)/);
            return match ? parseInt(match[1]) : undefined;
          })() :
          parseInt(it.rowId!);
        return isIntersect(taskData, TraceRow.rangeSelectObject!);
      });
      if (taskData.length > 0) {
        // @ts-ignore
        this.taskFramesData.push(...taskData);
      }
      info('load func traceRow id is : ', it.rowId);
    }
  }

  // @ts-ignore
  pushHeap(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_HEAP) {
      const key = it.rowParentId!.split(' ');
      const process = {
        ipid: Number(key[key.length - 1]),
        pid: Number(key[key.length - 2]),
      };

      if (!isExistPidInArray(this.nativeMemoryAllProcess, process.pid)) {
        this.nativeMemoryAllProcess.push(process);
      }
      if (this.nativeMemoryCurrentIPid === -1) {
        this.nativeMemoryCurrentIPid = process.ipid;
        Utils.getInstance().setCurrentSelectIPid(this.nativeMemoryCurrentIPid);
      }
      if (this.nativeMemoryAllProcess) {
        if (it.getAttribute('heap-type') === 'native_hook_statistic') {
          this.nativeMemoryStatistic.push(it.rowId!);
        } else {
          this.nativeMemory.push(it.rowId!);
        }
      }
      info('load nativeMemory traceRow id is : ', it.rowId);
    }
  }

  // @ts-ignore
  pushMonitor(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_MONITOR) {
      // @ts-ignore
      let abilityChildRows: Array<TraceRow<unknown>> = [
        // @ts-ignore
        ...sp.shadowRoot!.querySelectorAll<TraceRow<unknown>>(`trace-row[row-parent-id='${it.rowId}']`),
      ];
      if (!it.expansion) {
        abilityChildRows = [...it.childrenList];
      }
      abilityChildRows.forEach((th) => {
        th.rangeSelect = true;
        th.checkType = '2';
        if (th.rowType === TraceRow.ROW_TYPE_CPU_ABILITY) {
          this.cpuAbilityIds.push(th.rowId!);
        } else if (th.rowType === TraceRow.ROW_TYPE_MEMORY_ABILITY) {
          this.memoryAbilityIds.push(th.rowId!);
        } else if (th.rowType === TraceRow.ROW_TYPE_DISK_ABILITY) {
          this.diskAbilityIds.push(th.rowId!);
        } else if (th.rowType === TraceRow.ROW_TYPE_NETWORK_ABILITY) {
          this.networkAbilityIds.push(th.rowId!);
        } else if (th.rowType === TraceRow.ROW_TYPE_DMA_ABILITY) {
          this.dmaAbilityData.push(...intersectData(th)!);
        } else if (th.rowType === TraceRow.ROW_TYPE_GPU_MEMORY_ABILITY) {
          this.gpuMemoryAbilityData.push(...intersectData(th)!);
        } else if (th.rowType === TraceRow.ROW_TYPE_PURGEABLE_TOTAL_ABILITY) {
          this.purgeableTotalAbility.push(...intersectData(th));
        } else if (th.rowType === TraceRow.ROW_TYPE_PURGEABLE_PIN_ABILITY) {
          this.purgeablePinAbility.push(...intersectData(th));
        }
      });
    }
  }

  // @ts-ignore
  pushHiperf(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType?.startsWith('hiperf')) {
      if (it.rowType === TraceRow.ROW_TYPE_HIPERF_EVENT || it.rowType === TraceRow.ROW_TYPE_HIPERF_REPORT) {
        return;
      }
      this.perfEventTypeId = it.drawType === -2 ? undefined : it.drawType;
      this.perfSampleIds.push(1);
      if (it.rowType === TraceRow.ROW_TYPE_PERF_CALLCHART) {
        let setting = it.getRowSettingKeys();
        if (setting && setting.length > 0) {
          //type 0:cpu,1:process,2:thread
          let key: string = setting[0];
          let id = Number(key.split('-')[0]);
          if (key.includes('p')) {
            this.perfProcess.push(id);
          } else if (key.includes('t')) {
            this.perfThread.push(id);
          } else {
            this.perfCpus.push(id);
          }
        }
      }
      if (it.rowType === TraceRow.ROW_TYPE_HIPERF_PROCESS) {
        // @ts-ignore
        let hiperfProcessRows: Array<TraceRow<unknown>> = [
          // @ts-ignore
          ...sp.shadowRoot!.querySelectorAll<TraceRow<unknown>>(`trace-row[row-parent-id='${it.rowId}']`),
        ];
        if (!it.expansion) {
          hiperfProcessRows = [...it.childrenList];
        }
        hiperfProcessRows.forEach((th) => {
          th.rangeSelect = true;
          th.checkType = '2';
        });
      }
      if (it.rowType === TraceRow.ROW_TYPE_HIPERF || it.rowId === 'HiPerf-cpu-merge') {
        this.perfAll = true;
      }
      if (it.rowType === TraceRow.ROW_TYPE_HIPERF_CPU) {
        this.perfCpus.push(it.index);
      }
      if (it.rowType === TraceRow.ROW_TYPE_HIPERF_PROCESS) {
        this.perfProcess.push(parseInt(it.rowId!.split('-')[0]));
      }
      if (it.rowType === TraceRow.ROW_TYPE_HIPERF_THREAD) {
        this.perfThread.push(parseInt(it.rowId!.split('-')[0]));
      }
    }
  }

  // @ts-ignore
  pushFileSystem(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_FILE_SYSTEM_GROUP) {
      it.childrenList.forEach((child) => {
        child.rangeSelect = true;
        child.checkType = '2';
        this.pushFileSystem(child, sp);
      });
    }
    if (it.rowType === TraceRow.ROW_TYPE_FILE_SYSTEM) {
      if (it.rowId === 'FileSystemLogicalWrite') {
        if (this.fileSystemType.length === 0) {
          this.fileSystemType = [0, 1, 3];
        } else {
          if (this.fileSystemType.indexOf(3) === -1) {
            this.fileSystemType.push(3);
          }
        }
      } else if (it.rowId === 'FileSystemLogicalRead') {
        if (this.fileSystemType.length === 0) {
          this.fileSystemType = [0, 1, 2];
        } else {
          if (this.fileSystemType.indexOf(2) === -1) {
            this.fileSystemType.push(2);
          }
        }
      } else if (it.rowId === 'FileSystemVirtualMemory') {
        this.fileSysVirtualMemory = true;
      } else if (it.rowId === 'FileSystemDiskIOLatency') {
        this.diskIOLatency = true;
      } else {
        if (!this.diskIOLatency) {
          let arr = it.rowId!.split('-').reverse();
          let ipid = parseInt(arr[0]);
          if (this.diskIOipids.indexOf(ipid) === -1) {
            this.diskIOipids.push(ipid);
          }
          if (arr[1] === 'read') {
            this.diskIOReadIds.indexOf(ipid) === -1 ? this.diskIOReadIds.push(ipid) : '';
          } else if (arr[1] === 'write') {
            this.diskIOWriteIds.indexOf(ipid) === -1 ? this.diskIOWriteIds.push(ipid) : '';
          }
        }
      }
    }
  }
  // @ts-ignore
  vMTrackerGpuChildRowsEvery(item: TraceRow<unknown>): void {
    item.rangeSelect = true;
    if (item.rowType === TraceRow.ROW_TYPE_GPU_MEMORY_VMTRACKER) {
      this.gpuMemoryTrackerData.push(...intersectData(item)!);
    } else if (item.rowType === TraceRow.ROW_TYPE_SYS_MEMORY_GPU_GL) {
      this.gpu.gl =
        item.dataListCache.filter(
          (it) =>
            // @ts-ignore
            (it.startNs >= this.leftNs && it.startNs <= this.rightNs) ||
            // @ts-ignore
            (it.endNs >= this.leftNs && it.endNs <= this.rightNs)
        ).length > 0;
    } else if (item.rowType === TraceRow.ROW_TYPE_SYS_MEMORY_GPU_GRAPH) {
      this.gpu.graph =
        item.dataListCache.filter(
          // @ts-ignore
          (it) =>
            // @ts-ignore
            (it.startNs >= this.leftNs && it.startNs <= this.rightNs) ||
            // @ts-ignore
            (it.endNs >= this.leftNs && it.endNs <= this.rightNs)
        ).length > 0;
    } else if (item.rowType === TraceRow.ROW_TYPE_SYS_MEMORY_GPU_TOTAL) {
      this.gpu.gpuTotal =
        item.dataListCache.filter(
          (it) =>
            // @ts-ignore
            (it.startNs >= this.leftNs && it.startNs <= this.rightNs) ||
            // @ts-ignore
            (it.endNs >= this.leftNs && it.endNs <= this.rightNs)
        ).length > 0;
    } else if (item.rowType === TraceRow.ROW_TYPE_SYS_MEMORY_GPU_WINDOW) {
      this.gpu.gpuWindow =
        item.dataListCache.filter(
          (it) =>
            // @ts-ignore
            (it.startNs >= this.leftNs && it.startNs <= this.rightNs) ||
            // @ts-ignore
            (it.endNs >= this.leftNs && it.endNs <= this.rightNs)
        ).length > 0;
    }
  }
  // @ts-ignore
  pushVmTracker(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_VM_TRACKER) {
      // @ts-ignore
      let vMTrackerChildRows: Array<TraceRow<unknown>> = [
        // @ts-ignore
        ...sp.shadowRoot!.querySelectorAll<TraceRow<unknown>>(`trace-row[row-parent-id='${it.rowId}']`),
      ];
      if (!it.expansion) {
        vMTrackerChildRows = [...it.childrenList];
      }
      vMTrackerChildRows.forEach((th) => {
        th.rangeSelect = true;
        if (th.rowType === TraceRow.ROW_TYPE_DMA_VMTRACKER) {
          this.dmaVmTrackerData.push(...intersectData(th)!);
        } else if (th.rowType === TraceRow.ROW_TYPE_SYS_MEMORY_GPU) {
          // @ts-ignore
          let vMTrackerGpuChildRows: Array<TraceRow<unknown>> = [
            // @ts-ignore
            ...sp.shadowRoot!.querySelectorAll<TraceRow<unknown>>(`trace-row[row-parent-id='${th.rowId}']`),
          ];
          if (!th.expansion) {
            vMTrackerGpuChildRows = [...th.childrenList];
          }
          vMTrackerGpuChildRows.forEach((item) => {
            this.vMTrackerGpuChildRowsEvery(item);
          });
        } else if (th.rowType === TraceRow.ROW_TYPE_PURGEABLE_TOTAL_VM) {
          this.purgeableTotalVM.push(...intersectData(th));
        } else if (th.rowType === TraceRow.ROW_TYPE_PURGEABLE_PIN_VM) {
          this.purgeablePinVM.push(...intersectData(th));
        } else if (th.rowType === TraceRow.ROW_TYPE_VM_TRACKER_SMAPS) {
          // @ts-ignore
          let sMapsChildRows: Array<TraceRow<unknown>> = [
            // @ts-ignore
            ...sp.shadowRoot!.querySelectorAll<TraceRow<unknown>>(`trace-row[row-parent-id='${th.rowId}']`),
          ];
          if (!th.expansion) {
            sMapsChildRows = [...th.childrenList];
          }
          sMapsChildRows.forEach((item) => {
            item.rangeSelect = true;
            if (item.rowType === TraceRow.ROW_TYPE_VM_TRACKER_SMAPS) {
              this.smapsType.push(...intersectData(item)!);
            }
          });
        } else if (th.rowType === TraceRow.ROW_TYPE_VMTRACKER_SHM) {
          this.vmtrackershm.push(...intersectData(th)!);
        }
      });
    }
  }

  // @ts-ignore
  pushJank(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_JANK) {
      let isIntersect = (filterJank: JanksStruct, rangeData: RangeSelectStruct): boolean =>
        Math.max(filterJank.ts! + filterJank.dur!, rangeData!.endNS || 0) -
        Math.min(filterJank.ts!, rangeData!.startNS || 0) <
        filterJank.dur! + (rangeData!.endNS || 0) - (rangeData!.startNS || 0);
      if (it.name.startsWith('Actual Timeline')) {
        if (it.rowParentId === 'frameTime') {
          it.dataListCache.forEach((jankData: unknown) => {
            // @ts-ignore
            if (isIntersect(jankData, TraceRow.rangeSelectObject!)) {
              this.jankFramesData.push(jankData);
            }
          });
        } else {
          this.jankFramesData.push(it.rowParentId);
        }
      } else if (it.folder) {
        this.jankFramesData = [];
        it.childrenList.forEach((child) => {
          if (child.rowType === TraceRow.ROW_TYPE_JANK && child.name.startsWith('Actual Timeline')) {
            if (child.rowParentId === 'frameTime') {
              child.dataListCache.forEach((jankData: unknown) => {
                // @ts-ignore
                if (isIntersect(jankData, TraceRow.rangeSelectObject!)) {
                  this.jankFramesData.push(jankData);
                }
              });
            } else {
              this.jankFramesData.push(child.rowParentId);
            }
          }
        });
      }
    }
  }

  // @ts-ignore
  pushHeapTimeline(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_HEAP_TIMELINE) {
      const [rangeStart, rangeEnd] = [TraceRow.range?.startNS, TraceRow.range?.endNS];
      const startNS = TraceRow.rangeSelectObject?.startNS || rangeStart;
      const endNS = TraceRow.rangeSelectObject?.endNS || rangeEnd;
      let minNodeId;
      let maxNodeId;
      if (!it.dataListCache || it.dataListCache.length === 0) {
        return;
      }
      for (let sample of it.dataListCache) {
        // @ts-ignore
        if (sample.timestamp * 1000 <= startNS!) {
          // @ts-ignore
          minNodeId = sample.lastAssignedId;
        }
        // 个别文件的sample的最大timestamp小于时间的框选结束时间，不能给maxNodeId赋值
        // 所以加上此条件：sample.timestamp === it.dataListCache[it.dataListCache.length -1].timestamp
        if (
          // @ts-ignore
          sample.timestamp * 1000 >= endNS! ||
          // @ts-ignore
          sample.timestamp === it.dataListCache[it.dataListCache.length - 1].timestamp
        ) {
          if (maxNodeId === undefined) {
            // @ts-ignore
            maxNodeId = sample.lastAssignedId;
          }
        }
      }

      // If the start time range of the selected box is greater than the end time of the sampled data
      // @ts-ignore
      if (startNS! >= it.dataListCache[it.dataListCache.length - 1].timestamp * 1000) {
        // @ts-ignore
        minNodeId = it.dataListCache[it.dataListCache.length - 1].lastAssignedId;
      }
      // If you select the box from the beginning
      if (startNS! <= rangeStart!) {
        minNodeId = HeapDataInterface.getInstance().getMinNodeId(sp.snapshotFiles!.id);
      }
      //If you select the box from the ending
      // @ts-ignore
      if (endNS! >= rangeEnd! || endNS! >= it.dataListCache[it.dataListCache.length - 1].timestampUs * 1000) {
        maxNodeId = HeapDataInterface.getInstance().getMaxNodeId(sp.snapshotFiles!.id);
      }
      let summary = (sp.traceSheetEL!.shadowRoot!.querySelector('#tabs') as LitTabs)
        .querySelector('#box-heap-summary')
        ?.querySelector('tabpane-summary') as TabPaneSummary;
      summary.initSummaryData(sp.snapshotFiles!, minNodeId, maxNodeId);
      this.jsMemory.push(1);
    }
  }

  // @ts-ignore
  pushJsCpuProfiler(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_JS_CPU_PROFILER) {
      let isIntersect = (a: JsCpuProfilerStruct, b: RangeSelectStruct): boolean =>
        Math.max(a.startTime! + a.totalTime!, b!.endNS || 0) - Math.min(a.startTime!, b!.startNS || 0) <
        a.totalTime! + (b!.endNS || 0) - (b!.startNS || 0);
      let frameSelectData = it.dataListCache.filter((frameSelectData: unknown) => {
        // @ts-ignore
        return isIntersect(frameSelectData, TraceRow.rangeSelectObject!);
      });
      let copyFrameSelectData = JSON.parse(JSON.stringify(frameSelectData));
      let frameSelectDataIdArr: Array<number> = [];
      for (let data of copyFrameSelectData) {
        frameSelectDataIdArr.push(data.id);
      }
      let jsCpuProfilerData = copyFrameSelectData.filter((item: JsCpuProfilerChartFrame) => {
        // @ts-ignore
        if (item.depth === 0) {
          // @ts-ignore
          setSelectState(item, frameSelectDataIdArr);
          // @ts-ignore
          item.isSelect = true;
        }
        return item.depth === 0;
      });
      this.jsCpuProfilerData = jsCpuProfilerData;
    }
  }

  // @ts-ignore
  pushSysMemoryGpu(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    // @ts-ignore
    if (it.rowType === TraceRow.ROW_TYPE_SYS_MEMORY_GPU) {
      // @ts-ignore
      let vMTrackerGpuChildRows: Array<TraceRow<unknown>> = [
        // @ts-ignore
        ...sp.shadowRoot!.querySelectorAll<TraceRow<unknown>>(`trace-row[row-parent-id='${it.rowId}']`),
      ];
      if (!it.expansion) {
        vMTrackerGpuChildRows = [...it.childrenList];
      }
      vMTrackerGpuChildRows.forEach((th) => {
        th.rangeSelect = true;
        if (th.rowType === TraceRow.ROW_TYPE_GPU_MEMORY_VMTRACKER) {
          this.gpuMemoryTrackerData.push(...intersectData(th)!);
        } else if (th.rowType === TraceRow.ROW_TYPE_SYS_MEMORY_GPU_GL) {
          this.gpu.gl =
            th.dataListCache.filter(
              (it) =>
                // @ts-ignore
                (it.startNs >= this.leftNs && it.startNs <= this.rightNs) ||
                // @ts-ignore
                (it.endNs >= this.leftNs && it.endNs <= this.rightNs)
            ).length > 0;
        } else if (th.rowType === TraceRow.ROW_TYPE_SYS_MEMORY_GPU_GRAPH) {
          this.gpu.graph =
            th.dataListCache.filter(
              (it) =>
                // @ts-ignore
                (it.startNs >= this.leftNs && it.startNs <= this.rightNs) ||
                // @ts-ignore
                (it.endNs >= this.leftNs && it.endNs <= this.rightNs)
            ).length > 0;
        } else if (th.rowType === TraceRow.ROW_TYPE_SYS_MEMORY_GPU_TOTAL) {
          this.gpu.gpuTotal =
            th.dataListCache.filter(
              (it) =>
                // @ts-ignore
                (it.startNs >= this.leftNs && it.startNs <= this.rightNs) ||
                // @ts-ignore
                (it.endNs >= this.leftNs && it.endNs <= this.rightNs)
            ).length > 0;
        } else if (th.rowType === TraceRow.ROW_TYPE_SYS_MEMORY_GPU_WINDOW) {
          this.gpu.gpuWindow =
            th.dataListCache.filter(
              (it) =>
                // @ts-ignore
                (it.startNs >= this.leftNs && it.startNs <= this.rightNs) ||
                // @ts-ignore
                (it.endNs >= this.leftNs && it.endNs <= this.rightNs)
            ).length > 0;
        }
      });
    }
  }

  // @ts-ignore
  pushSDK(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType?.startsWith(TraceRow.ROW_TYPE_SDK)) {
      if (it.rowType === TraceRow.ROW_TYPE_SDK) {
        // @ts-ignore
        let sdkRows: Array<TraceRow<unknown>> = [
          // @ts-ignore
          ...sp.shadowRoot!.querySelectorAll<TraceRow<unknown>>(`trace-row[row-parent-id='${it.rowId}']`),
        ];
        if (!it.expansion) {
          sdkRows = [...it.childrenList];
        }
        sdkRows.forEach((th) => {
          th.rangeSelect = true;
          th.checkType = '2';
        });
      }
      if (it.rowType === TraceRow.ROW_TYPE_SDK_COUNTER) {
        this.sdkCounterIds.push(it.rowId!);
      }
      if (it.rowType === TraceRow.ROW_TYPE_SDK_SLICE) {
        this.sdkSliceIds.push(it.rowId!);
      }
    }
  }

  // @ts-ignore
  pushVmTrackerSmaps(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_VM_TRACKER_SMAPS) {
      this.smapsType.push(...intersectData(it)!);
      // @ts-ignore
      let sMapsChildRows: Array<TraceRow<unknown>> = [
        // @ts-ignore
        ...sp.shadowRoot!.querySelectorAll<TraceRow<unknown>>(`trace-row[row-parent-id='${it.rowId}']`),
      ];
      if (!it.expansion) {
        sMapsChildRows = [...it.childrenList];
      }
      sMapsChildRows.forEach((item) => {
        item.rangeSelect = true;
        if (item.rowType === TraceRow.ROW_TYPE_VM_TRACKER_SMAPS) {
          this.smapsType.push(...intersectData(item)!);
        }
      });
    }
  }

  // @ts-ignore
  pushIrq(it: TraceRow<unknown>): void {
    if (it.rowType === TraceRow.ROW_TYPE_IRQ_GROUP) {
      it.childrenList.forEach((child) => {
        child.rangeSelect = true;
        child.checkType = '2';
        this.pushIrq(child);
      });
    }
    if (it.rowType === TraceRow.ROW_TYPE_IRQ) {
      let filterId = parseInt(it.getAttribute('callId') || '-1');
      if (it.getAttribute('cat') === 'irq') {
        if (this.irqCallIds.indexOf(filterId) === -1) {
          this.irqCallIds.push(filterId);
        }
      } else {
        if (this.softIrqCallIds.indexOf(filterId) === -1) {
          this.softIrqCallIds.push(filterId);
        }
      }
    }
  }

  // @ts-ignore
  pushSysMemoryGpuGl(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_SYS_MEMORY_GPU_GL) {
      this.gpu.gl =
        it.dataListCache.filter(
          (it) =>
            // @ts-ignore
            (it.startNs >= this.leftNs && it.startNs <= this.rightNs) ||
            // @ts-ignore
            (it.endNs >= this.leftNs && it.endNs <= this.rightNs)
        ).length > 0;
    }
  }

  // @ts-ignore
  pushFrameDynamic(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_FRAME_DYNAMIC) {
      let appName = it.getAttribute('model-name');
      let isSelect = (dynamicStruct: FrameDynamicStruct, b: RangeSelectStruct): boolean =>
        dynamicStruct.ts >= b.startNS! && dynamicStruct.ts <= b.endNS!;
      let frameDynamicList = it.dataListCache.filter(
        // @ts-ignore
        (frameAnimationBean: FrameDynamicStruct) =>
          isSelect(frameAnimationBean, TraceRow.rangeSelectObject!) &&
          frameAnimationBean.groupId !== -1 &&
          frameAnimationBean.appName === appName
      );
      // @ts-ignore
      this.frameDynamic.push(...frameDynamicList);
    }
  }

  // @ts-ignore
  pushFrameSpacing(it: TraceRow<unknown>): void {
    if (it.rowType === TraceRow.ROW_TYPE_FRAME_SPACING) {
      let appName = it.getAttribute('model-name');
      let isSelect = (a: FrameSpacingStruct, b: RangeSelectStruct): boolean =>
        a.currentTs >= b.startNS! && a.currentTs <= b.endNS!;
      // @ts-ignore
      let frameDatas = it.dataListCache.filter((frameData: FrameSpacingStruct) => {
        return (
          isSelect(frameData, TraceRow.rangeSelectObject!) &&
          frameData.groupId !== -1 &&
          frameData.frameSpacingResult !== -1 &&
          frameData.nameId === appName
        );
      });
      // @ts-ignore
      this.frameSpacing.push(...frameDatas);
    }
  }

  // @ts-ignore
  pushFrameAnimation(it: TraceRow<unknown>): void {
    if (it.rowType === TraceRow.ROW_TYPE_FRAME_ANIMATION) {
      let isIntersect = (animationStruct: FrameAnimationStruct, selectStruct: RangeSelectStruct): boolean =>
        Math.max(animationStruct.startTs! + animationStruct.dur!, selectStruct!.endNS || 0) -
        Math.min(animationStruct.startTs!, selectStruct!.startNS || 0) <
        animationStruct.dur! + (selectStruct!.endNS || 0) - (selectStruct!.startNS || 0);
      // @ts-ignore
      let frameAnimationList = it.dataListCache.filter((frameAnimationBean: FrameAnimationStruct) => {
        return isIntersect(frameAnimationBean, TraceRow.rangeSelectObject!);
      });
      // @ts-ignore
      this.frameAnimation.push(...frameAnimationList);
    }
  }

  // @ts-ignore
  pushSysMemoryGpuWindow(it: TraceRow<unknown>): void {
    if (it.rowType === TraceRow.ROW_TYPE_SYS_MEMORY_GPU_WINDOW) {
      this.gpu.gpuWindow =
        it.dataListCache.filter(
          (it) =>
            // @ts-ignore
            (it.startNs >= this.leftNs && it.startNs <= this.rightNs) ||
            // @ts-ignore
            (it.endNs >= this.leftNs && it.endNs <= this.rightNs)
        ).length > 0;
    }
  }

  // @ts-ignore
  pushSysMemoryGpuTotal(it: TraceRow<unknown>): void {
    if (it.rowType === TraceRow.ROW_TYPE_SYS_MEMORY_GPU_TOTAL) {
      this.gpu.gpuTotal =
        it.dataListCache.filter(
          (it) =>
            // @ts-ignore
            (it.startNs >= this.leftNs && it.startNs <= this.rightNs) ||
            // @ts-ignore
            (it.endNs >= this.leftNs && it.endNs <= this.rightNs)
        ).length > 0;
    }
  }

  // @ts-ignore
  pushSysMemoryGpuGraph(it: TraceRow<unknown>): void {
    if (it.rowType === TraceRow.ROW_TYPE_SYS_MEMORY_GPU_GRAPH) {
      this.gpu.graph =
        it.dataListCache.filter(
          (it) =>
            // @ts-ignore
            (it.startNs >= this.leftNs && it.startNs <= this.rightNs) ||
            // @ts-ignore
            (it.endNs >= this.leftNs && it.endNs <= this.rightNs)
        ).length > 0;
    }
  }

  // @ts-ignore
  pushStaticInit(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_STATIC_INIT) {
      this.staticInit = true;
      sp.pushPidToSelection(this, it.rowParentId!);
      info('load thread traceRow id is : ', it.rowId);
    }
  }

  // @ts-ignore
  pushAppStartUp(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_APP_STARTUP) {
      this.startup = true;
      sp.pushPidToSelection(this, it.rowParentId!);
      info('load thread traceRow id is : ', it.rowId);
    }
  }

  // @ts-ignore
  pushThread(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_THREAD) {
      this.perfEventTypeId = SpHiPerf.hiperfEvent === -2 ? undefined :  SpHiPerf.hiperfEvent;
      sp.pushPidToSelection(this, it.rowParentId!, it.protoPid);
      if (it.dataListCache && it.dataListCache.length) {
        //@ts-ignore
        let hiTid = it.dataListCache[0]!.tid;
        this.perfThread.push(parseInt(hiTid));
      }
      this.threadIds.push(parseInt(it.rowId!));
      info('load thread traceRow id is : ', it.rowId);
    }
  }

  // @ts-ignore
  pushVirtualMemory(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_MEM || it.rowType === TraceRow.ROW_TYPE_VIRTUAL_MEMORY) {
      if (it.rowType === TraceRow.ROW_TYPE_MEM) {
        this.processTrackIds.push(parseInt(it.rowId!));
      } else {
        this.virtualTrackIds.push(parseInt(it.rowId!));
      }
      info('load memory traceRow id is : ', it.rowId);
    }
  }

  // @ts-ignore
  pushFps(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_FPS) {
      this.hasFps = true;
      info('load FPS traceRow id is : ', it.rowId);
    }
  }

  // @ts-ignore
  pushCpuAbility(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_CPU_ABILITY) {
      this.cpuAbilityIds.push(it.rowId!);
      info('load CPU Ability traceRow id is : ', it.rowId);
    }
  }

  // @ts-ignore
  pushMemoryAbility(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_MEMORY_ABILITY) {
      this.memoryAbilityIds.push(it.rowId!);
      info('load Memory Ability traceRow id is : ', it.rowId);
    }
  }

  // @ts-ignore
  pushDiskAbility(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_DISK_ABILITY) {
      this.diskAbilityIds.push(it.rowId!);
      info('load DiskIo Ability traceRow id is : ', it.rowId);
    }
  }

  // @ts-ignore
  pushNetworkAbility(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_NETWORK_ABILITY) {
      this.networkAbilityIds.push(it.rowId!);
      info('load Network Ability traceRow id is : ', it.rowId);
    }
  }

  // @ts-ignore
  pushDmaAbility(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_DMA_ABILITY) {
      this.dmaAbilityData.push(...intersectData(it)!);
    }
  }

  // @ts-ignore
  pushGpuMemoryAbility(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_GPU_MEMORY_ABILITY) {
      this.gpuMemoryAbilityData.push(...intersectData(it)!);
    }
  }

  // @ts-ignore
  pushPowerEnergy(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_POWER_ENERGY) {
      this.powerEnergy.push(it.rowId!);
    }
  }

  // @ts-ignore
  pushSystemEnergy(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_SYSTEM_ENERGY) {
      this.systemEnergy.push(it.rowId!);
    }
  }

  // @ts-ignore
  pushAnomalyEnergy(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_ANOMALY_ENERGY) {
      this.anomalyEnergy.push(it.rowId!);
    }
  }

  // @ts-ignore
  pushVmTrackerShm(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_VMTRACKER_SHM) {
      this.vmtrackershm.push(...intersectData(it)!);
    }
  }

  // @ts-ignore
  pushClock(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_CLOCK_GROUP) {
      it.childrenList.forEach((it) => {
        it.rangeSelect = true;
        it.checkType = '2';
        this.clockMapData.set(it.rowId || '', it.getCacheData);
        it.rowType === TraceRow.ROW_TYPE_DMA_FENCE && this.dmaFenceNameData.push(it.rowId!);
      });
    }
    if (it.rowType === TraceRow.ROW_TYPE_CLOCK) {
      this.clockMapData.set(it.rowId || '', it.getCacheData);
    }
  }

  //匹配id
  // @ts-ignore
  pushDmaFence(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_DMA_FENCE) {
      this.dmaFenceNameData.push(it.rowId!);
    }
  }

  // @ts-ignore
  pushXpower(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_XPOWER) {
      it.childrenList.forEach((it) => {
        it.childrenList.forEach((item) => {
          item.rangeSelect = true;
          item.checkType = '2';
          this.xpowerMapData.set(item.rowId || '', item.getCacheData);
        });
      });
    }
    if (it.rowType === TraceRow.ROW_TYPE_XPOWER_SYSTEM_GROUP) {
      it.childrenList.forEach((it) => {
        it.rangeSelect = true;
        it.checkType = '2';
        this.xpowerMapData.set(it.rowId || '', it.getCacheData);
      });
    }
    if (it.rowType === TraceRow.ROW_TYPE_XPOWER_SYSTEM) {
      this.xpowerMapData.set(it.rowId || '', it.getCacheData);
      if (it.rowId === 'Battery.RealCurrent') {
        this.xpowerComponentTopMapData.set(it.rowId || '', it.getCacheData);
      }
    }
    if (it.rowType === TraceRow.ROW_TYPE_XPOWER_STATISTIC) {
      this.xpowerStatisticMapData.set(it.rowId || '', it.getCacheData);
    }
    if (it.rowType === TraceRow.ROW_TYPE_XPOWER_APP_DETAIL_DISPLAY) {
      this.xpowerDisplayMapData.set(it.rowId || '', it.getCacheData);
    }
    if (it.rowType === TraceRow.ROW_TYPE_XPOWER_WIFI_PACKETS) {
      this.xpowerWifiPacketsMapData.set(it.rowId || '', it.getCacheData);
    }
    if (it.rowType === TraceRow.ROW_TYPE_XPOWER_WIFI_BYTES) {
      this.xpowerWifiBytesMapData.set(it.rowId || '', it.getCacheData);
    }
    if (it.rowType === TraceRow.ROW_TYPE_XPOWER_THREAD_COUNT) {
      this.xpowerMapData.set(it.rowId || '', it.getCacheData);
    }
    if (it.rowType === TraceRow.ROW_TYPE_XPOWER_GPU_COUNT) {
      this.xpowerMapData.set(it.rowId || '', it.getCacheData);
    }
  }

  // @ts-ignore
  pushXpowerThreadInfo(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_XPOWER_THREAD_INFO) {
      if (it.rowId === THREAD_ENERGY) {
        this.xpowerThreadEnergyMapData.set(it.rowId || '', it.getCacheData);
      } else if (it.rowId === THREAD_LOAD) {
        this.xpowerThreadLoadMapData.set(it.rowId || '', it.getCacheData);
      }
    }
  }
  // @ts-ignore
  pushXpowerGpuFreq(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_XPOWER_GPU_FREQUENCY) {
      this.xpowerGpuFreqMapData.set(it.rowId || '', it.getCacheData);
    }
  }
  // @ts-ignore
  pushHang(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_HANG_GROUP) {
      it.childrenList.forEach((it) => {
        it.rangeSelect = true;
        it.checkType = '2';
        this.hangMapData.set(it.rowId || '', it.getCacheData);
      });
    }
    if (it.rowType === TraceRow.ROW_TYPE_HANG || it.rowType === TraceRow.ROW_TYPE_HANG_INNER) {
      this.hangMapData.set(it.rowId || '', it.getCacheData);
    }
  }

  // @ts-ignore
  pushGpuMemoryVmTracker(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_GPU_MEMORY_VMTRACKER) {
      this.gpuMemoryTrackerData.push(...intersectData(it)!);
    }
  }

  // @ts-ignore
  pushDmaVmTracker(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_DMA_VMTRACKER) {
      this.dmaVmTrackerData.push(...intersectData(it)!);
    }
  }

  // @ts-ignore
  pushPugreable(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_PURGEABLE_TOTAL_ABILITY) {
      this.purgeableTotalAbility.push(...intersectData(it));
    }
    if (it.rowType === TraceRow.ROW_TYPE_PURGEABLE_PIN_ABILITY) {
      this.purgeablePinAbility.push(...intersectData(it));
    }
    if (it.rowType === TraceRow.ROW_TYPE_PURGEABLE_TOTAL_VM) {
      this.purgeableTotalVM.push(...intersectData(it));
    }
    if (it.rowType === TraceRow.ROW_TYPE_PURGEABLE_PIN_VM) {
      this.purgeablePinVM.push(...intersectData(it));
    }
  }

  // @ts-ignore
  pushPugreablePinAbility(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_PURGEABLE_PIN_ABILITY) {
      this.purgeablePinAbility.push(...intersectData(it));
    }
  }

  // @ts-ignore
  pushPugreableTotalVm(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_PURGEABLE_TOTAL_VM) {
      this.purgeableTotalVM.push(...intersectData(it));
    }
  }

  // @ts-ignore
  pushPugreablePinVm(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_PURGEABLE_PIN_VM) {
      this.purgeablePinVM.push(...intersectData(it));
    }
  }

  // @ts-ignore
  pushLogs(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_LOGS) {
      this.hiLogs.push(it.rowId!);
    }
  }

  // @ts-ignore
  pushHiSysEvent(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    if (it.rowType === TraceRow.ROW_TYPE_HI_SYSEVENT) {
      this.hiSysEvents.push(it.rowId!);
    }
  }

  // @ts-ignore
  pushSelection(it: TraceRow<unknown>, sp: SpSystemTrace): void {
    this.pushCpus(it);
    this.pushCpuStateFilterIds(it);
    this.pushCpuFreqFilter(it);
    this.pushCpuFreqLimit(it);
    this.pushProcess(it, sp);
    this.pushNativeMemory(it, sp);
    this.pushFunc(it, sp);
    this.pushHeap(it, sp);
    this.pushMonitor(it, sp);
    this.pushHiperf(it, sp);
    this.pushFileSystem(it, sp);
    this.pushJank(it, sp);
    this.pushHeapTimeline(it, sp);
    this.pushJsCpuProfiler(it, sp);
    this.pushSysMemoryGpu(it, sp);
    this.pushSDK(it, sp);
    this.pushVmTrackerSmaps(it, sp);
    this.pushIrq(it);
    this.pushSysMemoryGpuGl(it, sp);
    this.pushFrameDynamic(it, sp);
    this.pushFrameSpacing(it);
    this.pushFrameAnimation(it);
    this.pushSysMemoryGpuWindow(it);
    this.pushSysMemoryGpuTotal(it);
    this.pushSysMemoryGpuGraph(it);
    this.pushStaticInit(it, sp);
    this.pushAppStartUp(it, sp);
    this.pushThread(it, sp);
    this.pushSysCallIds(it);
    this.pushVirtualMemory(it, sp);
    this.pushFps(it, sp);
    this.pushCpuAbility(it, sp);
    this.pushMemoryAbility(it, sp);
    this.pushDiskAbility(it, sp);
    this.pushNetworkAbility(it, sp);
    this.pushDmaAbility(it, sp);
    this.pushGpuMemoryAbility(it, sp);
    this.pushPowerEnergy(it, sp);
    this.pushSystemEnergy(it, sp);
    this.pushAnomalyEnergy(it, sp);
    this.pushVmTracker(it, sp);
    this.pushVmTrackerShm(it, sp);
    this.pushClock(it, sp);
    this.pushDmaFence(it, sp);
    this.pushHang(it, sp);
    this.pushGpuMemoryVmTracker(it, sp);
    this.pushDmaVmTracker(it, sp);
    this.pushPugreable(it, sp);
    this.pushLogs(it, sp);
    this.pushHiSysEvent(it, sp);
    this.pushSampleData(it);
    this.pushXpower(it, sp);
    this.pushXpowerThreadInfo(it, sp);
    this.pushXpowerGpuFreq(it, sp);
  }
}

export class BoxJumpParam {
  traceId: string | undefined | null;
  leftNs: number = 0;
  rightNs: number = 0;
  cpus: Array<number> = [];
  state: string = '';
  processId: number[] | undefined;
  threadId: number[] | undefined;
  isJumpPage: boolean | undefined;
  currentId: string | undefined | null;
}

export class SysCallBoxJumpParam {
  traceId: string | undefined | null;
  leftNs: number = 0;
  rightNs: number = 0;
  processId: number[] | undefined;
  threadId: number[] | undefined;
  sysCallId: number | undefined;
  isJumpPage: boolean | undefined;
}

export class PerfSampleBoxJumpParam {
  traceId: string | undefined | null;
  leftNs: number = 0;
  rightNs: number = 0;
  isJumpPage: boolean | undefined;
  pid: number | undefined;
  tid: number | undefined;
  count: number = 0;
  tsArr: number[] = [];
}

export class SliceBoxJumpParam {
  traceId: string | undefined | null;
  leftNs: number = 0;
  rightNs: number = 0;
  processId: Array<number> = [];
  threadId: Array<number> = [];
  name: string[] | undefined | null;
  isJumpPage: boolean | undefined;
  isSummary: boolean | undefined;
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
  selfTime: number = 0;
  state: string = '';
  trackId: number = 0;
  delta: string = '';
  rate: string = '';
  avgWeight: string = '';
  count: string = '';
  first: string = '';
  last: string = '';
  min: string = '';
  minNumber: number = 0;
  max: string = '';
  maxNumber: number = 0;
  avg: string = '';
  stateJX: string = '';
  cpu: number = 0;
  recordStartNs: number = 0;
  leftNs: number = 0;
  rightNs: number = 0;
  threadIds: Array<number> = [];
  ts: number = 0;
  dur: number = 0;
  tabTitle: string = '';
  allName: string[] | undefined;
  asyncNames: Array<string> = [];
  asyncCatNames: Array<string> = [];
  average: string = '';
  avgNumber: number = 0;
  energy: string = '';
  timeStamp: string = '';
  duration: string = '';
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

export class GpuCounter {
  startNS: number = 0;
  height: number = 0;
  dur: number = 0;
  type: string = '';
  startTime: number = 0;
  frame: object = {};
}
