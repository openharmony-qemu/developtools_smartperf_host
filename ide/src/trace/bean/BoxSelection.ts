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

import { CpuFreqLimitsStruct } from '../database/ui-worker/cpu/ProcedureWorkerCpuFreqLimits';
import { ClockStruct } from '../database/ui-worker/ProcedureWorkerClock';
import { IrqStruct } from '../database/ui-worker/ProcedureWorkerIrq';
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
  clockMapData: Map<string, ((arg: any) => Promise<Array<any>> | undefined) | undefined> = new Map<
    string,
    ((arg: any) => Promise<Array<any>> | undefined) | undefined
  >();
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
  pushCpus(it: TraceRow<any>) {
    if (it.rowType == TraceRow.ROW_TYPE_CPU) {
      this.cpus.push(parseInt(it.rowId!));
      info('load CPU traceRow id is : ', it.rowId);
    }
  }

  pushCpuStateFilterIds(it: TraceRow<any>) {
    if (it.rowType == TraceRow.ROW_TYPE_CPU_STATE) {
      let filterId = parseInt(it.rowId!);
      if (this.cpuStateFilterIds.indexOf(filterId) == -1) {
        this.cpuStateFilterIds.push(filterId);
      }
    }
  }

  pushCpuFreqFilter(it: TraceRow<any>) {
    if (it.rowType == TraceRow.ROW_TYPE_CPU_FREQ) {
      let filterId = parseInt(it.rowId!);
      let filterName = it.name!;
      if (this.cpuFreqFilterIds.indexOf(filterId) == -1) {
        this.cpuFreqFilterIds.push(filterId);
      }
      if (this.cpuFreqFilterNames.indexOf(filterName) == -1) {
        this.cpuFreqFilterNames.push(filterName);
      }
    }
  }

  pushCpuFreqLimit(it: TraceRow<any>) {
    if (it.rowType == TraceRow.ROW_TYPE_CPU_FREQ_LIMIT) {
      this.cpuFreqLimit.push({
        maxFilterId: it.getAttribute('maxFilterId'),
        minFilterId: it.getAttribute('minFilterId'),
        cpu: it.getAttribute('cpu'),
      });
    }
  }

  pushProcess(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_PROCESS) {
      sp.pushPidToSelection(this, it.rowId!);
      if (it.getAttribute('hasStartup') === 'true') {
        this.startup = true;
      }
      if (it.getAttribute('hasStaticInit') === 'true') {
        this.staticInit = true;
      }
      let processChildRows: Array<TraceRow<any>> = [
        ...sp.shadowRoot!.querySelectorAll<TraceRow<any>>(`trace-row[row-parent-id='${it.rowId}']`),
      ];
      if (!it.expansion) {
        processChildRows = [...it.childrenList];
      }
      processChildRows.forEach((th) => {
        th.rangeSelect = true;
        th.checkType = '2';
        if (th.rowType == TraceRow.ROW_TYPE_THREAD) {
          this.threadIds.push(parseInt(th.rowId!));
        } else if (th.rowType == TraceRow.ROW_TYPE_FUNC) {
          if (th.asyncFuncName) {
            this.funAsync.push({
              name: th.asyncFuncName,
              pid: th.asyncFuncNamePID || 0,
            });
          } else {
            this.funTids.push(parseInt(th.rowId!));
          }
        } else if (th.rowType == TraceRow.ROW_TYPE_MEM) {
          this.processTrackIds.push(parseInt(th.rowId!));
        }
      });
      info('load process traceRow id is : ', it.rowId);
    }
  }

  pushNativeMemory(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_NATIVE_MEMORY) {
      let memoryRows: Array<TraceRow<any>> = [
        ...sp.shadowRoot!.querySelectorAll<TraceRow<any>>(`trace-row[row-parent-id='${it.rowId}']`),
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

  pushFunc(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_FUNC) {
      TabPaneTaskFrames.TaskArray = [];
      sp.pushPidToSelection(this, it.rowParentId!);
      if (it.asyncFuncName) {
        this.funAsync.push({
          name: it.asyncFuncName,
          pid: it.asyncFuncNamePID || 0,
        });
      } else {
        this.funTids.push(parseInt(it.rowId!));
      }

      let isIntersect = (filterFunc: FuncStruct, rangeData: RangeSelectStruct) =>
        Math.max(filterFunc.startTs! + filterFunc.dur!, rangeData!.endNS || 0) -
          Math.min(filterFunc.startTs!, rangeData!.startNS || 0) <
          filterFunc.dur! + (rangeData!.endNS || 0) - (rangeData!.startNS || 0) &&
        filterFunc.funName!.indexOf('H:Task ') >= 0;
      let taskData = it.dataListCache.filter((taskData: FuncStruct) => {
        taskData!.tid = parseInt(it.rowId!);
        return isIntersect(taskData, TraceRow.rangeSelectObject!);
      });
      if (taskData.length > 0) {
        this.taskFramesData.push(...taskData);
      }
      info('load func traceRow id is : ', it.rowId);
    }
  }

  pushHeap(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_HEAP) {
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
      }
      if (this.nativeMemoryAllProcess)
        if (it.getAttribute('heap-type') === 'native_hook_statistic') {
          this.nativeMemoryStatistic.push(it.rowId!);
        } else {
          this.nativeMemory.push(it.rowId!);
        }
      info('load nativeMemory traceRow id is : ', it.rowId);
    }
  }

  pushMonitor(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_MONITOR) {
      let abilityChildRows: Array<TraceRow<any>> = [
        ...sp.shadowRoot!.querySelectorAll<TraceRow<any>>(`trace-row[row-parent-id='${it.rowId}']`),
      ];
      if (!it.expansion) {
        abilityChildRows = [...it.childrenList];
      }
      abilityChildRows.forEach((th) => {
        th.rangeSelect = true;
        th.checkType = '2';
        if (th.rowType == TraceRow.ROW_TYPE_CPU_ABILITY) {
          this.cpuAbilityIds.push(th.rowId!);
        } else if (th.rowType == TraceRow.ROW_TYPE_MEMORY_ABILITY) {
          this.memoryAbilityIds.push(th.rowId!);
        } else if (th.rowType == TraceRow.ROW_TYPE_DISK_ABILITY) {
          this.diskAbilityIds.push(th.rowId!);
        } else if (th.rowType == TraceRow.ROW_TYPE_NETWORK_ABILITY) {
          this.networkAbilityIds.push(th.rowId!);
        } else if (th.rowType == TraceRow.ROW_TYPE_DMA_ABILITY) {
          this.dmaAbilityData.push(...intersectData(th)!);
        } else if (th.rowType == TraceRow.ROW_TYPE_GPU_MEMORY_ABILITY) {
          this.gpuMemoryAbilityData.push(...intersectData(th)!);
        } else if (th.rowType === TraceRow.ROW_TYPE_PURGEABLE_TOTAL_ABILITY) {
          this.purgeableTotalAbility.push(...intersectData(th));
        } else if (th.rowType === TraceRow.ROW_TYPE_PURGEABLE_PIN_ABILITY) {
          this.purgeablePinAbility.push(...intersectData(th));
        }
      });
    }
  }

  pushHiperf(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType?.startsWith('hiperf')) {
      if (it.rowType == TraceRow.ROW_TYPE_HIPERF_EVENT || it.rowType == TraceRow.ROW_TYPE_HIPERF_REPORT) {
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
      if (it.rowType == TraceRow.ROW_TYPE_HIPERF_PROCESS) {
        let hiperfProcessRows: Array<TraceRow<any>> = [
          ...sp.shadowRoot!.querySelectorAll<TraceRow<any>>(`trace-row[row-parent-id='${it.rowId}']`),
        ];
        if (!it.expansion) {
          hiperfProcessRows = [...it.childrenList];
        }
        hiperfProcessRows.forEach((th) => {
          th.rangeSelect = true;
          th.checkType = '2';
        });
      }
      if (it.rowType == TraceRow.ROW_TYPE_HIPERF || it.rowId == 'HiPerf-cpu-merge') {
        this.perfAll = true;
      }
      if (it.rowType == TraceRow.ROW_TYPE_HIPERF_CPU) {
        this.perfCpus.push(it.index);
      }
      if (it.rowType == TraceRow.ROW_TYPE_HIPERF_PROCESS) {
        this.perfProcess.push(parseInt(it.rowId!.split('-')[0]));
      }
      if (it.rowType == TraceRow.ROW_TYPE_HIPERF_THREAD) {
        this.perfThread.push(parseInt(it.rowId!.split('-')[0]));
      }
    }
  }

  pushFileSystem(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_FILE_SYSTEM) {
      if (it.rowId == 'FileSystemLogicalWrite') {
        if (this.fileSystemType.length == 0) {
          this.fileSystemType = [0, 1, 3];
        } else {
          if (this.fileSystemType.indexOf(3) == -1) {
            this.fileSystemType.push(3);
          }
        }
      } else if (it.rowId == 'FileSystemLogicalRead') {
        if (this.fileSystemType.length == 0) {
          this.fileSystemType = [0, 1, 2];
        } else {
          if (this.fileSystemType.indexOf(2) == -1) {
            this.fileSystemType.push(2);
          }
        }
      } else if (it.rowId == 'FileSystemVirtualMemory') {
        this.fileSysVirtualMemory = true;
      } else if (it.rowId == 'FileSystemDiskIOLatency') {
        this.diskIOLatency = true;
      } else {
        if (!this.diskIOLatency) {
          let arr = it.rowId!.split('-').reverse();
          let ipid = parseInt(arr[0]);
          if (this.diskIOipids.indexOf(ipid) == -1) {
            this.diskIOipids.push(ipid);
          }
          if (arr[1] == 'read') {
            this.diskIOReadIds.indexOf(ipid) == -1 ? this.diskIOReadIds.push(ipid) : '';
          } else if (arr[1] == 'write') {
            this.diskIOWriteIds.indexOf(ipid) == -1 ? this.diskIOWriteIds.push(ipid) : '';
          }
        }
      }
    }
  }
  vMTrackerGpuChildRowsEvery(item: TraceRow<any>) {
    item.rangeSelect = true;
    if (item.rowType == TraceRow.ROW_TYPE_GPU_MEMORY_VMTRACKER) {
      this.gpuMemoryTrackerData.push(...intersectData(item)!);
    } else if (item.rowType == TraceRow.ROW_TYPE_SYS_MEMORY_GPU_GL) {
      this.gpu.gl =
        item.dataListCache.filter(
          (it) =>
            (it.startNs >= this.leftNs && it.startNs <= this.rightNs) ||
            (it.endNs >= this.leftNs && it.endNs <= this.rightNs)
        ).length > 0;
    } else if (item.rowType == TraceRow.ROW_TYPE_SYS_MEMORY_GPU_GRAPH) {
      this.gpu.graph =
        item.dataListCache.filter(
          (it) =>
            (it.startNs >= this.leftNs && it.startNs <= this.rightNs) ||
            (it.endNs >= this.leftNs && it.endNs <= this.rightNs)
        ).length > 0;
    } else if (item.rowType == TraceRow.ROW_TYPE_SYS_MEMORY_GPU_TOTAL) {
      this.gpu.gpuTotal =
        item.dataListCache.filter(
          (it) =>
            (it.startNs >= this.leftNs && it.startNs <= this.rightNs) ||
            (it.endNs >= this.leftNs && it.endNs <= this.rightNs)
        ).length > 0;
    } else if (item.rowType == TraceRow.ROW_TYPE_SYS_MEMORY_GPU_WINDOW) {
      this.gpu.gpuWindow =
        item.dataListCache.filter(
          (it) =>
            (it.startNs >= this.leftNs && it.startNs <= this.rightNs) ||
            (it.endNs >= this.leftNs && it.endNs <= this.rightNs)
        ).length > 0;
    }
  }
  pushVmTracker(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType === TraceRow.ROW_TYPE_VM_TRACKER) {
      let vMTrackerChildRows: Array<TraceRow<any>> = [
        ...sp.shadowRoot!.querySelectorAll<TraceRow<any>>(`trace-row[row-parent-id='${it.rowId}']`),
      ];
      if (!it.expansion) {
        vMTrackerChildRows = [...it.childrenList];
      }
      vMTrackerChildRows.forEach((th) => {
        th.rangeSelect = true;
        if (th.rowType === TraceRow.ROW_TYPE_DMA_VMTRACKER) {
          this.dmaVmTrackerData.push(...intersectData(th)!);
        } else if (th.rowType === TraceRow.ROW_TYPE_SYS_MEMORY_GPU) {
          let vMTrackerGpuChildRows: Array<TraceRow<any>> = [
            ...sp.shadowRoot!.querySelectorAll<TraceRow<any>>(`trace-row[row-parent-id='${th.rowId}']`),
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
          let sMapsChildRows: Array<TraceRow<any>> = [
            ...sp.shadowRoot!.querySelectorAll<TraceRow<any>>(`trace-row[row-parent-id='${th.rowId}']`),
          ];
          if (!th.expansion) {
            sMapsChildRows = [...th.childrenList];
          }
          sMapsChildRows.forEach((item) => {
            item.rangeSelect = true;
            if (item.rowType == TraceRow.ROW_TYPE_VM_TRACKER_SMAPS) {
              this.smapsType.push(...intersectData(item)!);
            }
          });
        } else if (th.rowType == TraceRow.ROW_TYPE_VMTRACKER_SHM) {
          this.vmtrackershm.push(...intersectData(th)!);
        }
      });
    }
  }

  pushJank(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_JANK) {
      let isIntersect = (filterJank: JanksStruct, rangeData: RangeSelectStruct) =>
        Math.max(filterJank.ts! + filterJank.dur!, rangeData!.endNS || 0) -
          Math.min(filterJank.ts!, rangeData!.startNS || 0) <
        filterJank.dur! + (rangeData!.endNS || 0) - (rangeData!.startNS || 0);
      if (it.name == 'Actual Timeline') {
        if (it.rowParentId === 'frameTime') {
          it.dataListCache.forEach((jankData: any) => {
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
          if (child.rowType == TraceRow.ROW_TYPE_JANK && child.name == 'Actual Timeline') {
            if (it.rowParentId === 'frameTime') {
              it.dataListCache.forEach((jankData: any) => {
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

  pushHeapTimeline(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_HEAP_TIMELINE) {
      const [rangeStart, rangeEnd] = [TraceRow.range?.startNS, TraceRow.range?.endNS];
      const endNS = TraceRow.rangeSelectObject?.endNS || rangeStart;
      const startNS = TraceRow.rangeSelectObject?.startNS || rangeEnd;
      let minNodeId, maxNodeId;
      if (!it.dataListCache || it.dataListCache.length === 0) {
        return;
      }
      for (let sample of it.dataListCache) {
        if (sample.timestamp * 1000 <= startNS!) {
          minNodeId = sample.lastAssignedId;
        }
        // 个别文件的sample的最大timestamp小于时间的框选结束时间，不能给maxNodeId赋值
        // 所以加上此条件：sample.timestamp === it.dataListCache[it.dataListCache.length -1].timestamp
        if (
          sample.timestamp * 1000 >= endNS! ||
          sample.timestamp === it.dataListCache[it.dataListCache.length - 1].timestamp
        ) {
          if (maxNodeId === undefined) {
            maxNodeId = sample.lastAssignedId;
          }
        }
      }

      // If the start time range of the selected box is greater than the end time of the sampled data
      if (startNS! >= it.dataListCache[it.dataListCache.length - 1].timestamp * 1000) {
        minNodeId = it.dataListCache[it.dataListCache.length - 1].lastAssignedId;
      }
      // If you select the box from the beginning
      if (startNS! <= rangeStart!) {
        minNodeId = HeapDataInterface.getInstance().getMinNodeId(sp.snapshotFiles!.id);
      }
      //If you select the box from the ending
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

  pushJsCpuProfiler(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_JS_CPU_PROFILER) {
      let isIntersect = (a: JsCpuProfilerStruct, b: RangeSelectStruct) =>
        Math.max(a.startTime! + a.totalTime!, b!.endNS || 0) - Math.min(a.startTime!, b!.startNS || 0) <
        a.totalTime! + (b!.endNS || 0) - (b!.startNS || 0);
      let frameSelectData = it.dataListCache.filter((frameSelectData: any) => {
        return isIntersect(frameSelectData, TraceRow.rangeSelectObject!);
      });
      let copyFrameSelectData = JSON.parse(JSON.stringify(frameSelectData));
      let frameSelectDataIdArr: Array<number> = [];
      for (let data of copyFrameSelectData) {
        frameSelectDataIdArr.push(data.id);
      }
      let jsCpuProfilerData = copyFrameSelectData.filter((item: any) => {
        if (item.depth === 0) {
          setSelectState(item, frameSelectDataIdArr);
          item.isSelect = true;
          return item;
        }
      });
      this.jsCpuProfilerData = jsCpuProfilerData;
    }
  }

  pushSysMemoryGpu(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_SYS_MEMORY_GPU) {
      let vMTrackerGpuChildRows: Array<TraceRow<any>> = [
        ...sp.shadowRoot!.querySelectorAll<TraceRow<any>>(`trace-row[row-parent-id='${it.rowId}']`),
      ];
      if (!it.expansion) {
        vMTrackerGpuChildRows = [...it.childrenList];
      }
      vMTrackerGpuChildRows.forEach((th) => {
        th.rangeSelect = true;
        if (th.rowType == TraceRow.ROW_TYPE_GPU_MEMORY_VMTRACKER) {
          this.gpuMemoryTrackerData.push(...intersectData(th)!);
        } else if (th.rowType == TraceRow.ROW_TYPE_SYS_MEMORY_GPU_GL) {
          this.gpu.gl =
            th.dataListCache.filter(
              (it) =>
                (it.startNs >= this.leftNs && it.startNs <= this.rightNs) ||
                (it.endNs >= this.leftNs && it.endNs <= this.rightNs)
            ).length > 0;
        } else if (th.rowType == TraceRow.ROW_TYPE_SYS_MEMORY_GPU_GRAPH) {
          this.gpu.graph =
            th.dataListCache.filter(
              (it) =>
                (it.startNs >= this.leftNs && it.startNs <= this.rightNs) ||
                (it.endNs >= this.leftNs && it.endNs <= this.rightNs)
            ).length > 0;
        } else if (th.rowType == TraceRow.ROW_TYPE_SYS_MEMORY_GPU_TOTAL) {
          this.gpu.gpuTotal =
            th.dataListCache.filter(
              (it) =>
                (it.startNs >= this.leftNs && it.startNs <= this.rightNs) ||
                (it.endNs >= this.leftNs && it.endNs <= this.rightNs)
            ).length > 0;
        } else if (th.rowType == TraceRow.ROW_TYPE_SYS_MEMORY_GPU_WINDOW) {
          this.gpu.gpuWindow =
            th.dataListCache.filter(
              (it) =>
                (it.startNs >= this.leftNs && it.startNs <= this.rightNs) ||
                (it.endNs >= this.leftNs && it.endNs <= this.rightNs)
            ).length > 0;
        }
      });
    }
  }

  pushSDK(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType?.startsWith(TraceRow.ROW_TYPE_SDK)) {
      if (it.rowType == TraceRow.ROW_TYPE_SDK) {
        let sdkRows: Array<TraceRow<any>> = [
          ...sp.shadowRoot!.querySelectorAll<TraceRow<any>>(`trace-row[row-parent-id='${it.rowId}']`),
        ];
        if (!it.expansion) {
          sdkRows = [...it.childrenList];
        }
        sdkRows.forEach((th) => {
          th.rangeSelect = true;
          th.checkType = '2';
        });
      }
      if (it.rowType == TraceRow.ROW_TYPE_SDK_COUNTER) {
        this.sdkCounterIds.push(it.rowId!);
      }
      if (it.rowType == TraceRow.ROW_TYPE_SDK_SLICE) {
        this.sdkSliceIds.push(it.rowId!);
      }
    }
  }

  pushVmTrackerSmaps(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_VM_TRACKER_SMAPS) {
      this.smapsType.push(...intersectData(it)!);
      let sMapsChildRows: Array<TraceRow<any>> = [
        ...sp.shadowRoot!.querySelectorAll<TraceRow<any>>(`trace-row[row-parent-id='${it.rowId}']`),
      ];
      if (!it.expansion) {
        sMapsChildRows = [...it.childrenList];
      }
      sMapsChildRows.forEach((item) => {
        item.rangeSelect = true;
        if (item.rowType == TraceRow.ROW_TYPE_VM_TRACKER_SMAPS) {
          this.smapsType.push(...intersectData(item)!);
        }
      });
    }
  }

  pushIrq(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_IRQ) {
      if (it.getAttribute('cat') === 'irq') {
        this.irqCallIds.push(parseInt(it.getAttribute('callId') || '-1'));
      } else {
        this.softIrqCallIds.push(parseInt(it.getAttribute('callId') || '-1'));
      }
    }
  }

  pushSysMemoryGpuGl(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_SYS_MEMORY_GPU_GL) {
      this.gpu.gl =
        it.dataListCache.filter(
          (it) =>
            (it.startNs >= this.leftNs && it.startNs <= this.rightNs) ||
            (it.endNs >= this.leftNs && it.endNs <= this.rightNs)
        ).length > 0;
    }
  }

  pushFrameDynamic(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_FRAME_DYNAMIC) {
      let appName = it.getAttribute('model-name');
      let isSelect = (dynamicStruct: FrameDynamicStruct, b: RangeSelectStruct) =>
        dynamicStruct.ts >= b.startNS! && dynamicStruct.ts <= b.endNS!;
      let frameDynamicList = it.dataListCache.filter(
        (frameAnimationBean: FrameDynamicStruct) =>
          isSelect(frameAnimationBean, TraceRow.rangeSelectObject!) &&
          frameAnimationBean.groupId !== -1 &&
          frameAnimationBean.appName === appName
      );
      this.frameDynamic.push(...frameDynamicList);
    }
  }

  pushFrameSpacing(it: TraceRow<any>) {
    if (it.rowType == TraceRow.ROW_TYPE_FRAME_SPACING) {
      let appName = it.getAttribute('model-name');
      let isSelect = (a: FrameSpacingStruct, b: RangeSelectStruct) =>
        a.currentTs >= b.startNS! && a.currentTs <= b.endNS!;
      let frameDatas = it.dataListCache.filter((frameData: FrameSpacingStruct) => {
        return (
          isSelect(frameData, TraceRow.rangeSelectObject!) &&
          frameData.groupId !== -1 &&
          frameData.frameSpacingResult !== -1 &&
          frameData.nameId === appName
        );
      });
      this.frameSpacing.push(...frameDatas);
    }
  }

  pushFrameAnimation(it: TraceRow<any>) {
    if (it.rowType == TraceRow.ROW_TYPE_FRAME_ANIMATION) {
      let isIntersect = (animationStruct: FrameAnimationStruct, selectStruct: RangeSelectStruct) =>
        Math.max(animationStruct.startTs! + animationStruct.dur!, selectStruct!.endNS || 0) -
          Math.min(animationStruct.startTs!, selectStruct!.startNS || 0) <
        animationStruct.dur! + (selectStruct!.endNS || 0) - (selectStruct!.startNS || 0);
      let frameAnimationList = it.dataListCache.filter((frameAnimationBean: FrameAnimationStruct) => {
        return isIntersect(frameAnimationBean, TraceRow.rangeSelectObject!);
      });
      this.frameAnimation.push(...frameAnimationList);
    }
  }

  pushSysMemoryGpuWindow(it: TraceRow<any>) {
    if (it.rowType == TraceRow.ROW_TYPE_SYS_MEMORY_GPU_WINDOW) {
      this.gpu.gpuWindow =
        it.dataListCache.filter(
          (it) =>
            (it.startNs >= this.leftNs && it.startNs <= this.rightNs) ||
            (it.endNs >= this.leftNs && it.endNs <= this.rightNs)
        ).length > 0;
    }
  }

  pushSysMemoryGpuTotal(it: TraceRow<any>) {
    if (it.rowType == TraceRow.ROW_TYPE_SYS_MEMORY_GPU_TOTAL) {
      this.gpu.gpuTotal =
        it.dataListCache.filter(
          (it) =>
            (it.startNs >= this.leftNs && it.startNs <= this.rightNs) ||
            (it.endNs >= this.leftNs && it.endNs <= this.rightNs)
        ).length > 0;
    }
  }

  pushSysMemoryGpuGraph(it: TraceRow<any>) {
    if (it.rowType === TraceRow.ROW_TYPE_SYS_MEMORY_GPU_GRAPH) {
      this.gpu.graph =
        it.dataListCache.filter(
          (it) =>
            (it.startNs >= this.leftNs && it.startNs <= this.rightNs) ||
            (it.endNs >= this.leftNs && it.endNs <= this.rightNs)
        ).length > 0;
    }
  }

  pushStaticInit(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_STATIC_INIT) {
      this.staticInit = true;
      sp.pushPidToSelection(this, it.rowParentId!);
      info('load thread traceRow id is : ', it.rowId);
    }
  }

  pushAppStartUp(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_APP_STARTUP) {
      this.startup = true;
      sp.pushPidToSelection(this, it.rowParentId!);
      info('load thread traceRow id is : ', it.rowId);
    }
  }

  pushThread(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_THREAD) {
      sp.pushPidToSelection(this, it.rowParentId!);
      this.threadIds.push(parseInt(it.rowId!));
      info('load thread traceRow id is : ', it.rowId);
    }
  }

  pushVirtualMemory(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_MEM || it.rowType == TraceRow.ROW_TYPE_VIRTUAL_MEMORY) {
      if (it.rowType == TraceRow.ROW_TYPE_MEM) {
        this.processTrackIds.push(parseInt(it.rowId!));
      } else {
        this.virtualTrackIds.push(parseInt(it.rowId!));
      }
      info('load memory traceRow id is : ', it.rowId);
    }
  }

  pushFps(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_FPS) {
      this.hasFps = true;
      info('load FPS traceRow id is : ', it.rowId);
    }
  }

  pushCpuAbility(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_CPU_ABILITY) {
      this.cpuAbilityIds.push(it.rowId!);
      info('load CPU Ability traceRow id is : ', it.rowId);
    }
  }

  pushMemoryAbility(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_MEMORY_ABILITY) {
      this.memoryAbilityIds.push(it.rowId!);
      info('load Memory Ability traceRow id is : ', it.rowId);
    }
  }

  pushDiskAbility(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_DISK_ABILITY) {
      this.diskAbilityIds.push(it.rowId!);
      info('load DiskIo Ability traceRow id is : ', it.rowId);
    }
  }

  pushNetworkAbility(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_NETWORK_ABILITY) {
      this.networkAbilityIds.push(it.rowId!);
      info('load Network Ability traceRow id is : ', it.rowId);
    }
  }

  pushDmaAbility(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_DMA_ABILITY) {
      this.dmaAbilityData.push(...intersectData(it)!);
    }
  }

  pushGpuMemoryAbility(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_GPU_MEMORY_ABILITY) {
      this.gpuMemoryAbilityData.push(...intersectData(it)!);
    }
  }

  pushPowerEnergy(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_POWER_ENERGY) {
      this.powerEnergy.push(it.rowId!);
    }
  }

  pushSystemEnergy(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_SYSTEM_ENERGY) {
      this.systemEnergy.push(it.rowId!);
    }
  }

  pushAnomalyEnergy(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_ANOMALY_ENERGY) {
      this.anomalyEnergy.push(it.rowId!);
    }
  }

  pushVmTrackerShm(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_VMTRACKER_SHM) {
      this.vmtrackershm.push(...intersectData(it)!);
    }
  }

  pushClock(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_CLOCK) {
      this.clockMapData.set(it.rowId || '', it.getCacheData);
    }
  }

  pushGpuMemoryVmTracker(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_GPU_MEMORY_VMTRACKER) {
      this.gpuMemoryTrackerData.push(...intersectData(it)!);
    }
  }

  pushDmaVmTracker(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_DMA_VMTRACKER) {
      this.dmaVmTrackerData.push(...intersectData(it)!);
    }
  }

  pushPugreable(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_PURGEABLE_TOTAL_ABILITY) {
      this.purgeableTotalAbility.push(...intersectData(it));
    }
    if (it.rowType == TraceRow.ROW_TYPE_PURGEABLE_PIN_ABILITY) {
      this.purgeablePinAbility.push(...intersectData(it));
    }
    if (it.rowType == TraceRow.ROW_TYPE_PURGEABLE_TOTAL_VM) {
      this.purgeableTotalVM.push(...intersectData(it));
    }
    if (it.rowType == TraceRow.ROW_TYPE_PURGEABLE_PIN_VM) {
      this.purgeablePinVM.push(...intersectData(it));
    }
  }

  pushPugreablePinAbility(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_PURGEABLE_PIN_ABILITY) {
      this.purgeablePinAbility.push(...intersectData(it));
    }
  }

  pushPugreableTotalVm(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_PURGEABLE_TOTAL_VM) {
      this.purgeableTotalVM.push(...intersectData(it));
    }
  }

  pushPugreablePinVm(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType == TraceRow.ROW_TYPE_PURGEABLE_PIN_VM) {
      this.purgeablePinVM.push(...intersectData(it));
    }
  }

  pushLogs(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType === TraceRow.ROW_TYPE_LOGS) {
      this.hiLogs.push(it.rowId!);
    }
  }

  pushHiSysEvent(it: TraceRow<any>, sp: SpSystemTrace) {
    if (it.rowType === TraceRow.ROW_TYPE_HI_SYSEVENT) {
      this.hiSysEvents.push(it.rowId!);
    }
  }

  pushSelection(it: TraceRow<any>, sp: SpSystemTrace) {
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
    this.pushIrq(it, sp);
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
    this.pushGpuMemoryVmTracker(it, sp);
    this.pushDmaVmTracker(it, sp);
    this.pushPugreable(it, sp);
    this.pushLogs(it, sp);
    this.pushHiSysEvent(it, sp);
  }
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
