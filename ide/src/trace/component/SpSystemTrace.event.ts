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

import { SpSystemTrace } from './SpSystemTrace';
import { ThreadStruct } from '../database/ui-worker/ProcedureWorkerThread';
import { TraceRow } from './trace/base/TraceRow';
import { JankStruct } from '../database/ui-worker/ProcedureWorkerJank';
import { HeapSnapshotStruct } from '../database/ui-worker/ProcedureWorkerHeapSnapshot';
import { FuncStruct } from '../database/ui-worker/ProcedureWorkerFunc';
import { TabPaneTaskFrames } from './trace/sheet/task/TabPaneTaskFrames';
import { FlagsConfig } from './SpFlags';
import { CpuFreqStruct } from '../database/ui-worker/ProcedureWorkerFreq';
import { ClockStruct } from '../database/ui-worker/ProcedureWorkerClock';
import { SnapshotStruct } from '../database/ui-worker/ProcedureWorkerSnapshot';
import { IrqStruct } from '../database/ui-worker/ProcedureWorkerIrq';
import { HeapStruct } from '../database/ui-worker/ProcedureWorkerHeap';
import { JsCpuProfilerStruct } from '../database/ui-worker/ProcedureWorkerCpuProfiler';
import { JsCpuProfilerChartFrame } from '../bean/JsStruct';
import { AppStartupStruct } from '../database/ui-worker/ProcedureWorkerAppStartup';
import { AllAppStartupStruct } from '../database/ui-worker/ProcedureWorkerAllAppStartup';
import { SoStruct } from '../database/ui-worker/ProcedureWorkerSoInit';
import { FrameAnimationStruct } from '../database/ui-worker/ProcedureWorkerFrameAnimation';
import { FrameDynamicStruct } from '../database/ui-worker/ProcedureWorkerFrameDynamic';
import { FrameSpacingStruct } from '../database/ui-worker/ProcedureWorkerFrameSpacing';
import { SportRuler } from './trace/timer-shaft/SportRuler';
import { SpStatisticsHttpUtil } from '../../statistics/util/SpStatisticsHttpUtil';
import { LitSearch } from './trace/search/Search';
import { TabPaneCurrent } from './trace/sheet/TabPaneCurrent';
import type { SpKeyboard } from './SpKeyboard';
import { enableVSync } from './chart/VSync';
import { CpuStruct } from '../database/ui-worker/cpu/ProcedureWorkerCPU';
import { CpuStateStruct } from '../database/ui-worker/cpu/ProcedureWorkerCpuState';
import { CpuFreqLimitsStruct } from '../database/ui-worker/cpu/ProcedureWorkerCpuFreqLimits';

export default function SpSystemTraceOnClickHandler(sp: SpSystemTrace, clickRowType: string, row?: TraceRow<any>) {
  if (row) {
    sp.currentRow = row;
    sp.setAttribute('clickRow', clickRowType);
    sp.setAttribute('rowName', row.name!);
    sp.setAttribute('rowId', row.rowId!);
  }
  if (!sp.loadTraceCompleted) return;
  sp.queryAllTraceRow().forEach((it) => (it.rangeSelect = false));
  sp.selectStructNull();
  // 判断点击的线程是否在唤醒树内
  let timeoutJudge = setTimeout(() => {
    if (SpSystemTrace.wakeupList.length && CpuStruct.selectCpuStruct) {
      let checkHandlerKey: boolean = true;
      let saveSelectCpuStruct: any = JSON.parse(sessionStorage.getItem('saveselectcpustruct')!);
      for (const item of SpSystemTrace.wakeupList) {
        if (item.ts === CpuStruct.selectCpuStruct.startTime && item.dur === CpuStruct.selectCpuStruct.dur) {
          checkHandlerKey = false;
          if (SpSystemTrace.wakeupList[0].schedulingDesc) {
            SpSystemTrace.wakeupList.unshift(saveSelectCpuStruct);
          }
          sp.refreshCanvas(true);
          break;
        } else if (
          saveSelectCpuStruct.startTime === CpuStruct.selectCpuStruct.startTime &&
          saveSelectCpuStruct.dur === CpuStruct.selectCpuStruct.dur
        ) {
          // 如果点击的是第一层，保持唤醒树不变
          checkHandlerKey = false;
          sp.refreshCanvas(true);
          break;
        }
      }
      // 点击线程在唤醒树内
      if (!checkHandlerKey) {
        // 查询获取tab表格数据
        window.publish(window.SmartEvent.UI.WakeupList, SpSystemTrace.wakeupList);
      } else {
        // 不在唤醒树内，清空数组
        sp.wakeupListNull();
        sp.refreshCanvas(true);
      }
    } else {
      sp.wakeupListNull();
      sp.refreshCanvas(true);
    }
    clearTimeout(timeoutJudge);
  }, 10);
  let threadClickHandler: any;
  let cpuClickHandler: any;
  let jankClickHandler: any;
  let snapshotClickHandler: any;
  let scrollToFuncHandler: any;
  threadClickHandler = (d: ThreadStruct) => {
    sp.observerScrollHeightEnable = false;
    sp.scrollToProcess(`${d.cpu}`, '', 'cpu-data', true);
    let cpuRow = sp.queryAllTraceRow<TraceRow<CpuStruct>>(
      `trace-row[row-id='${d.cpu}'][row-type='cpu-data']`,
      (row) => row.rowId === `${d.cpu}` && row.rowType === 'cpu-data'
    )[0];
    cpuRow.fixedList = [
      {
        startTime: d.startTime,
        dur: d.dur,
        tid: d.tid,
        id: d.id,
        processId: d.pid,
        cpu: d.cpu,
        argSetID: d.argSetID,
      },
    ];
    let findEntry = cpuRow!.fixedList[0];
    sp.rechargeCpuData(
      findEntry,
      cpuRow.dataListCache.find((it) => it.startTime > findEntry.startTime)
    );
    if (
      findEntry!.startTime! + findEntry!.dur! < TraceRow.range!.startNS ||
      findEntry!.startTime! > TraceRow.range!.endNS
    ) {
      sp.timerShaftEL?.setRangeNS(
        findEntry!.startTime! - findEntry!.dur! * 2,
        findEntry!.startTime! + findEntry!.dur! + findEntry!.dur! * 2
      );
    }
    sp.hoverStructNull();
    sp.selectStructNull();
    sp.wakeupListNull();
    CpuStruct.hoverCpuStruct = findEntry;
    CpuStruct.selectCpuStruct = findEntry;
    sp.timerShaftEL?.drawTriangle(findEntry!.startTime || 0, 'inverted');
    sp.traceSheetEL?.displayCpuData(
      CpuStruct.selectCpuStruct!,
      (wakeUpBean) => {
        sp.removeLinkLinesByBusinessType('thread');
        CpuStruct.wakeupBean = wakeUpBean;
        sp.refreshCanvas(true);
      },
      cpuClickHandler
    );
  };
  cpuClickHandler = (d: CpuStruct) => {
    let traceRow = sp.shadowRoot?.querySelector<TraceRow<any>>(
      `trace-row[row-id='${d.processId}'][row-type='process']`
    );
    if (traceRow) {
      traceRow.expansion = true;
    }
    sp.observerScrollHeightEnable = true;
    let threadRow = sp.queryAllTraceRow<TraceRow<ThreadStruct>>(
      `trace-row[row-id='${d.tid}'][row-type='thread']`,
      (row) => row.rowId === `${d.tid}` && row.rowType === 'thread'
    )[0];
    let task = () => {
      if (threadRow) {
        let findEntry = threadRow!.fixedList[0];
        if (
          findEntry!.startTime! + findEntry!.dur! < TraceRow.range!.startNS ||
          findEntry!.startTime! > TraceRow.range!.endNS
        ) {
          sp.timerShaftEL?.setRangeNS(
            findEntry!.startTime! - findEntry!.dur! * 2,
            findEntry!.startTime! + findEntry!.dur! + findEntry!.dur! * 2
          );
        }
        sp.hoverStructNull();
        sp.selectStructNull();
        sp.wakeupListNull();
        ThreadStruct.hoverThreadStruct = findEntry;
        ThreadStruct.selectThreadStruct = findEntry;
        sp.timerShaftEL?.drawTriangle(findEntry!.startTime || 0, 'inverted');
        sp.traceSheetEL?.displayThreadData(
          ThreadStruct.selectThreadStruct!,
          threadClickHandler,
          cpuClickHandler,
          (datas) => {
            sp.removeLinkLinesByBusinessType('thread');
          }
        );
        sp.scrollToProcess(`${d.tid}`, `${d.processId}`, 'thread', true);
      }
    };
    if (threadRow) {
      threadRow.fixedList = [
        {
          startTime: d.startTime,
          dur: d.dur,
          cpu: d.cpu,
          id: d.id,
          tid: d.tid,
          state: d.state,
          pid: d.processId,
          argSetID: d.argSetID,
        },
      ];

      if (threadRow!.isComplete) {
        task();
      } else {
        sp.scrollToProcess(`${d.tid}`, `${d.processId}`, 'process', false);
        sp.scrollToProcess(`${d.tid}`, `${d.processId}`, 'thread', true);
        threadRow!.onComplete = task;
      }
    }
  };

  jankClickHandler = (d: any) => {
    sp.observerScrollHeightEnable = true;
    let jankRowParent: any;
    if (d.rowId === 'actual frameTime') {
      jankRowParent = sp.shadowRoot?.querySelector<TraceRow<JankStruct>>("trace-row[row-id='frameTime']");
    } else {
      jankRowParent = sp.shadowRoot?.querySelector<TraceRow<JankStruct>>(`trace-row[row-id='${d.pid}']`);
    }
    jankRowParent!.expansion = true;
    let jankRow: any;
    jankRowParent.childrenList.forEach((item: TraceRow<JankStruct>) => {
      if (item.rowId === `${d.rowId}` && item.rowType === 'janks') {
        jankRow = item;
      }
    });
    let task = () => {
      if (jankRow) {
        JankStruct.selectJankStructList.length = 0;
        let findJankEntry = jankRow!.dataListCache!.find((dat: any) => dat.name == d.name && dat.pid == d.pid);
        if (findJankEntry) {
          if (
            findJankEntry!.ts! + findJankEntry!.dur! < TraceRow.range!.startNS ||
            findJankEntry!.ts! > TraceRow.range!.endNS
          ) {
            sp.timerShaftEL?.setRangeNS(
              findJankEntry!.ts! - findJankEntry!.dur! * 2,
              findJankEntry!.ts! + findJankEntry!.dur! + findJankEntry!.dur! * 2
            );
          }
          sp.hoverStructNull();
          sp.selectStructNull();
          sp.wakeupListNull();
          JankStruct.hoverJankStruct = findJankEntry;
          JankStruct.selectJankStruct = findJankEntry;
          sp.timerShaftEL?.drawTriangle(findJankEntry!.ts || 0, 'inverted');
          sp.traceSheetEL?.displayJankData(
            JankStruct.selectJankStruct!,
            (datas) => {
              sp.removeLinkLinesByBusinessType('janks');
              // 绘制跟自己关联的线
              datas.forEach((data) => {
                let endParentRow = sp.shadowRoot?.querySelector<TraceRow<any>>(
                  `trace-row[row-id='${data.pid}'][folder]`
                );
                sp.drawJankLine(endParentRow, JankStruct.selectJankStruct!, data);
              });
            },
            jankClickHandler
          );
        }
        sp.scrollToProcess(jankRow.rowId!, jankRow.rowParentId!, jankRow.rowType!, true);
      }
    };
    task();
  };

  scrollToFuncHandler = (funcStract: any) => {
    sp.observerScrollHeightEnable = true;
    sp.moveRangeToCenter(funcStract.startTs!, funcStract.dur!);
    sp.scrollToActFunc(funcStract, false);
  };

  snapshotClickHandler = (d: HeapSnapshotStruct) => {
    sp.observerScrollHeightEnable = true;
    let snapshotRow = sp.shadowRoot?.querySelector<TraceRow<HeapSnapshotStruct>>(`trace-row[row-id='heapsnapshot']`);
    let task = () => {
      if (snapshotRow) {
        let findEntry = snapshotRow!.dataListCache!.find((dat) => dat.startTs === d.startTs);
        sp.hoverStructNull();
        sp.selectStructNull();
        sp.wakeupListNull();
        HeapSnapshotStruct.hoverSnapshotStruct = findEntry;
        HeapSnapshotStruct.selectSnapshotStruct = findEntry;
      }
    };
    if (snapshotRow) {
      if (snapshotRow!.isComplete) {
        task();
      } else {
        snapshotRow!.onComplete = task;
      }
    }
  };
  if (clickRowType === TraceRow.ROW_TYPE_CPU && CpuStruct.hoverCpuStruct) {
    CpuStruct.selectCpuStruct = CpuStruct.hoverCpuStruct;
    sp.timerShaftEL?.drawTriangle(CpuStruct.selectCpuStruct!.startTime || 0, 'inverted');
    sp.traceSheetEL?.displayCpuData(
      CpuStruct.selectCpuStruct,
      (wakeUpBean) => {
        CpuStruct.wakeupBean = wakeUpBean;
        sp.refreshCanvas(false);
      },
      cpuClickHandler
    );
    sp.timerShaftEL?.modifyFlagList(undefined);
  } else if (clickRowType === TraceRow.ROW_TYPE_THREAD && ThreadStruct.hoverThreadStruct) {
    sp.removeLinkLinesByBusinessType('thread');
    ThreadStruct.selectThreadStruct = ThreadStruct.hoverThreadStruct;
    sp.timerShaftEL?.drawTriangle(ThreadStruct.selectThreadStruct!.startTime || 0, 'inverted');
    sp.traceSheetEL?.displayThreadData(ThreadStruct.selectThreadStruct, threadClickHandler, cpuClickHandler);
    sp.timerShaftEL?.modifyFlagList(undefined);
  } else if (clickRowType === TraceRow.ROW_TYPE_FUNC && FuncStruct.hoverFuncStruct) {
    TabPaneTaskFrames.TaskArray = [];
    sp.removeLinkLinesByBusinessType('task');
    FuncStruct.selectFuncStruct = FuncStruct.hoverFuncStruct;
    let hoverFuncStruct = FuncStruct.hoverFuncStruct;
    sp.timerShaftEL?.drawTriangle(FuncStruct.selectFuncStruct!.startTs || 0, 'inverted');
    FuncStruct.selectFuncStruct = hoverFuncStruct;
    let flagConfig = FlagsConfig.getFlagsConfig('TaskPool');
    let showTabArray: Array<string> = ['current-selection'];
    if (flagConfig!.TaskPool === 'Enabled') {
      if (FuncStruct.selectFuncStruct?.funName) {
        if (FuncStruct.selectFuncStruct.funName.indexOf('H:Task ') >= 0) {
          showTabArray.push('box-task-frames');
          sp.drawTaskPollLine(row);
        }
      }
    }
    sp.traceSheetEL?.displayFuncData(showTabArray, FuncStruct.selectFuncStruct, scrollToFuncHandler);
    sp.timerShaftEL?.modifyFlagList(undefined);
  } else if (clickRowType === TraceRow.ROW_TYPE_CPU_FREQ && CpuFreqStruct.hoverCpuFreqStruct) {
    CpuFreqStruct.selectCpuFreqStruct = CpuFreqStruct.hoverCpuFreqStruct;
    sp.traceSheetEL?.displayFreqData();
    sp.timerShaftEL?.modifyFlagList(undefined);
  } else if (clickRowType === TraceRow.ROW_TYPE_CPU_STATE && CpuStateStruct.hoverStateStruct) {
    CpuStateStruct.selectStateStruct = CpuStateStruct.hoverStateStruct;
    sp.traceSheetEL?.displayCpuStateData();
    sp.timerShaftEL?.modifyFlagList(undefined);
  } else if (clickRowType === TraceRow.ROW_TYPE_CPU_FREQ_LIMIT && CpuFreqLimitsStruct.hoverCpuFreqLimitsStruct) {
    CpuFreqLimitsStruct.selectCpuFreqLimitsStruct = CpuFreqLimitsStruct.hoverCpuFreqLimitsStruct;
    sp.traceSheetEL?.displayFreqLimitData();
    sp.timerShaftEL?.modifyFlagList(undefined);
  } else if (clickRowType === TraceRow.ROW_TYPE_CLOCK && ClockStruct.hoverClockStruct) {
    ClockStruct.selectClockStruct = ClockStruct.hoverClockStruct;
    sp.traceSheetEL?.displayClockData(ClockStruct.selectClockStruct);
    sp.timerShaftEL?.modifyFlagList(undefined);
  } else if (clickRowType === TraceRow.ROW_TYPE_SYS_MEMORY_GPU_TOTAL && SnapshotStruct.hoverSnapshotStruct) {
    let gpuDumpTotalRow = sp.shadowRoot?.querySelector<TraceRow<SnapshotStruct>>(
      `trace-row[row-id='Skia Gpu Dump Total']`
    );
    SnapshotStruct.selectSnapshotStruct = SnapshotStruct.hoverSnapshotStruct;
    sp.traceSheetEL?.displayGpuSelectedData(
      'total',
      SnapshotStruct.selectSnapshotStruct.startNs,
      gpuDumpTotalRow!.dataListCache
    );
    sp.timerShaftEL?.modifyFlagList(undefined);
  } else if (clickRowType === TraceRow.ROW_TYPE_SYS_MEMORY_GPU_WINDOW && SnapshotStruct.hoverSnapshotStruct) {
    let gpuDumpWindowRow = sp.shadowRoot?.querySelector<TraceRow<SnapshotStruct>>(
      `trace-row[row-id='Skia Gpu Dump Window']`
    );
    SnapshotStruct.selectSnapshotStruct = SnapshotStruct.hoverSnapshotStruct;
    sp.traceSheetEL?.displayGpuSelectedData(
      'window',
      SnapshotStruct.selectSnapshotStruct.startNs,
      gpuDumpWindowRow!.dataListCache
    );
    sp.timerShaftEL?.modifyFlagList(undefined);
  } else if (clickRowType === TraceRow.ROW_TYPE_IRQ && IrqStruct.hoverIrqStruct) {
    IrqStruct.selectIrqStruct = IrqStruct.hoverIrqStruct;
    sp.traceSheetEL?.displayIrqData(IrqStruct.selectIrqStruct);
    sp.timerShaftEL?.modifyFlagList(undefined);
  } else if (
    clickRowType === TraceRow.ROW_TYPE_HEAP &&
    row &&
    row.getAttribute('heap-type') === 'native_hook_statistic' &&
    HeapStruct.hoverHeapStruct
  ) {
    HeapStruct.selectHeapStruct = HeapStruct.hoverHeapStruct;
    const key = row.rowParentId!.split(' ');
    let ipid = 1;
    if (key.length > 0) {
      ipid = Number(key[key.length - 1]);
    }
    sp.traceSheetEL?.displayNativeHookData(HeapStruct.selectHeapStruct, row.rowId!, ipid);
    sp.timerShaftEL?.modifyFlagList(undefined);
  } else if (clickRowType === TraceRow.ROW_TYPE_JANK && JankStruct.hoverJankStruct) {
    JankStruct.selectJankStructList.length = 0;
    sp.removeLinkLinesByBusinessType('janks');
    JankStruct.selectJankStruct = JankStruct.hoverJankStruct;
    sp.timerShaftEL?.drawTriangle(JankStruct.selectJankStruct!.ts || 0, 'inverted');
    sp.traceSheetEL?.displayJankData(
      JankStruct.selectJankStruct,
      (datas) => {
        datas.forEach((data) => {
          let endParentRow;
          if (data.frame_type == 'frameTime') {
            endParentRow = sp.shadowRoot?.querySelector<TraceRow<JankStruct>>(
              `trace-row[row-id='frameTime'][row-type='janks']`
            );
          } else {
            endParentRow = sp.shadowRoot?.querySelector<TraceRow<any>>(`trace-row[row-id='${data.pid}'][folder]`);
          }
          sp.drawJankLine(endParentRow, JankStruct.selectJankStruct!, data);
        });
      },
      jankClickHandler
    );
  } else if (clickRowType === TraceRow.ROW_TYPE_HEAP_SNAPSHOT && HeapSnapshotStruct.hoverSnapshotStruct) {
    let snapshotRow = sp.shadowRoot?.querySelector<TraceRow<HeapSnapshotStruct>>(`trace-row[row-id='heapsnapshot']`);
    HeapSnapshotStruct.selectSnapshotStruct = HeapSnapshotStruct.hoverSnapshotStruct;
    sp.traceSheetEL?.displaySnapshotData(
      HeapSnapshotStruct.selectSnapshotStruct!,
      snapshotRow!.dataListCache,
      snapshotClickHandler
    );
  } else if (clickRowType === TraceRow.ROW_TYPE_JS_CPU_PROFILER && JsCpuProfilerStruct.hoverJsCpuProfilerStruct) {
    JsCpuProfilerStruct.selectJsCpuProfilerStruct = JsCpuProfilerStruct.hoverJsCpuProfilerStruct;
    let selectStruct = JsCpuProfilerStruct.selectJsCpuProfilerStruct;
    let dataArr: Array<JsCpuProfilerChartFrame> = [];
    let parentIdArr: Array<number> = [];
    let that = sp;
    getTopJsCpuProfilerStruct(selectStruct.parentId);

    function getTopJsCpuProfilerStruct(parentId: number) {
      if (parentId === -1 && selectStruct.parentId === -1) {
        // 点击的函数是第一层，直接设置其children的isSelect为true，不用重新算totalTime
        let data = that.chartManager!.arkTsChart.chartFrameMap.get(selectStruct!.id);
        if (data && dataArr.length === 0) {
          let copyData = JSON.parse(JSON.stringify(data));
          setSelectChildrenState(copyData);
          dataArr.push(copyData);
        }
      } else {
        let parent = that.chartManager!.arkTsChart.chartFrameMap.get(parentId);
        if (parent) {
          parentIdArr.push(parent.id);
          getTopJsCpuProfilerStruct(parent.parentId!);
          if (parent.parentId === -1 && dataArr.length === 0) {
            let data = that.chartManager!.arkTsChart.chartFrameMap.get(parent.id);
            let copyParent = JSON.parse(JSON.stringify(data));
            copyParent.totalTime = selectStruct.totalTime;
            copyParent.selfTime = 0;
            // depth为0的isSelect改为true
            copyParent.isSelect = true;
            if (copyParent.children.length > 0) {
              getSelectStruct(copyParent);
            }
            dataArr.push(copyParent);
          }
        }
      }
    }

    function getSelectStruct(data: JsCpuProfilerChartFrame) {
      for (let child of data.children) {
        if (child === null) {
          continue;
        }
        if (child.id === selectStruct!.id) {
          // 将点击的函数的children的isSelect改为true
          setSelectChildrenState(child);
        } else {
          getSelectStruct(child);
        }
        if (parentIdArr.includes(child.id)) {
          child.isSelect = true;
          child.totalTime = selectStruct.totalTime;
          child.selfTime = 0;
        }
      }
    }

    function setSelectChildrenState(data: JsCpuProfilerChartFrame) {
      data.isSelect = true;
      if (data.children.length > 0) {
        for (let child of data.children) {
          if (child === null) {
            continue;
          }
          setSelectChildrenState(child);
        }
      }
    }

    that.traceSheetEL?.displayJsProfilerData(dataArr);
  } else if (clickRowType === TraceRow.ROW_TYPE_APP_STARTUP && AppStartupStruct.hoverStartupStruct) {
    AppStartupStruct.selectStartupStruct = AppStartupStruct.hoverStartupStruct;
    sp.traceSheetEL?.displayStartupData(AppStartupStruct.selectStartupStruct, scrollToFuncHandler);
    sp.timerShaftEL?.modifyFlagList(undefined);
  } else if (clickRowType === TraceRow.ROW_TYPE_ALL_APPSTARTUPS && AllAppStartupStruct.hoverStartupStruct) {
    AllAppStartupStruct.selectStartupStruct = AllAppStartupStruct.hoverStartupStruct;
    sp.traceSheetEL?.displayAllStartupData(AllAppStartupStruct.selectStartupStruct!, scrollToFuncHandler);
    sp.timerShaftEL?.modifyFlagList(undefined);
  } else if (clickRowType === TraceRow.ROW_TYPE_STATIC_INIT && SoStruct.hoverSoStruct) {
    SoStruct.selectSoStruct = SoStruct.hoverSoStruct;
    sp.traceSheetEL?.displayStaticInitData(SoStruct.selectSoStruct, scrollToFuncHandler);
    sp.timerShaftEL?.modifyFlagList(undefined);
  } else if (clickRowType === TraceRow.ROW_TYPE_FRAME_ANIMATION && FrameAnimationStruct.hoverFrameAnimationStruct) {
    FrameAnimationStruct.selectFrameAnimationStruct = FrameAnimationStruct.hoverFrameAnimationStruct;
    sp.traceSheetEL?.displayFrameAnimationData(FrameAnimationStruct.selectFrameAnimationStruct);
    sp.timerShaftEL?.modifyFlagList(undefined);
  } else if (clickRowType === TraceRow.ROW_TYPE_FRAME_DYNAMIC && FrameDynamicStruct.hoverFrameDynamicStruct) {
    FrameDynamicStruct.selectFrameDynamicStruct = FrameDynamicStruct.hoverFrameDynamicStruct;
    sp.traceSheetEL?.displayFrameDynamicData(row!, FrameDynamicStruct.selectFrameDynamicStruct);
    sp.timerShaftEL?.modifyFlagList(undefined);
  } else if (clickRowType === TraceRow.ROW_TYPE_FRAME_SPACING && FrameSpacingStruct.hoverFrameSpacingStruct) {
    FrameSpacingStruct.selectFrameSpacingStruct = FrameSpacingStruct.hoverFrameSpacingStruct;
    sp.traceSheetEL?.displayFrameSpacingData(FrameSpacingStruct.selectFrameSpacingStruct);
    sp.timerShaftEL?.modifyFlagList(undefined);
  } else if (clickRowType === TraceRow.ROW_TYPE_VM_TRACKER_SMAPS && SnapshotStruct.hoverSnapshotStruct) {
    let smapsRow = sp.shadowRoot?.querySelector<TraceRow<SnapshotStruct>>(`trace-row[row-id='Dirty']`);
    SnapshotStruct.selectSnapshotStruct = SnapshotStruct.hoverSnapshotStruct;
    sp.traceSheetEL?.displaySmapsData(SnapshotStruct.selectSnapshotStruct!, smapsRow!.dataListCache);
  } else if (clickRowType === TraceRow.ROW_TYPE_VMTRACKER_SHM && SnapshotStruct.hoverSnapshotStruct) {
    let shmRow = sp.shadowRoot?.querySelector<TraceRow<SnapshotStruct>>(`trace-row[row-id='SHM']`);
    SnapshotStruct.selectSnapshotStruct = SnapshotStruct.hoverSnapshotStruct;
    sp.traceSheetEL?.displayShmData(SnapshotStruct.selectSnapshotStruct!, shmRow!.dataListCache);
  } else if (clickRowType === TraceRow.ROW_TYPE_PURGEABLE_TOTAL_ABILITY && SnapshotStruct.hoverSnapshotStruct) {
    let totalAbilityRow = sp.shadowRoot?.querySelector<TraceRow<SnapshotStruct>>(
      `trace-row[row-id='System Purgeable Total']`
    );
    SnapshotStruct.selectSnapshotStruct = SnapshotStruct.hoverSnapshotStruct;
    sp.traceSheetEL?.displayPurgTotalAbilityData(SnapshotStruct.hoverSnapshotStruct, totalAbilityRow!.dataListCache);
  } else if (clickRowType === TraceRow.ROW_TYPE_PURGEABLE_PIN_ABILITY && SnapshotStruct.hoverSnapshotStruct) {
    let pinAbilityRow = sp.shadowRoot?.querySelector<TraceRow<SnapshotStruct>>(
      `trace-row[row-id='System Purgeable Pin']`
    );
    SnapshotStruct.selectSnapshotStruct = SnapshotStruct.hoverSnapshotStruct;
    sp.traceSheetEL?.displayPurgPinAbilityData(SnapshotStruct.hoverSnapshotStruct, pinAbilityRow!.dataListCache);
  } else if (clickRowType === TraceRow.ROW_TYPE_PURGEABLE_TOTAL_VM && SnapshotStruct.hoverSnapshotStruct) {
    let totalVMRow = sp.shadowRoot?.querySelector<TraceRow<SnapshotStruct>>(`trace-row[row-id='Purgeable Total']`);
    SnapshotStruct.selectSnapshotStruct = SnapshotStruct.hoverSnapshotStruct;
    sp.traceSheetEL?.displayPurgTotalVMData(SnapshotStruct.hoverSnapshotStruct, totalVMRow!.dataListCache);
  } else if (clickRowType === TraceRow.ROW_TYPE_PURGEABLE_PIN_VM && SnapshotStruct.hoverSnapshotStruct) {
    let pinVMRow = sp.shadowRoot?.querySelector<TraceRow<SnapshotStruct>>(`trace-row[row-id='Purgeable Pin']`);
    SnapshotStruct.selectSnapshotStruct = SnapshotStruct.hoverSnapshotStruct;
    sp.traceSheetEL?.displayPurgPinVMData(SnapshotStruct.hoverSnapshotStruct, pinVMRow!.dataListCache);
  } else if (clickRowType === TraceRow.ROW_TYPE_DMA_ABILITY && SnapshotStruct.hoverSnapshotStruct) {
    let dmaAbilityRow = sp.shadowRoot?.querySelector<TraceRow<SnapshotStruct>>(`trace-row[row-id='abilityMonitorDma']`);
    SnapshotStruct.selectSnapshotStruct = SnapshotStruct.hoverSnapshotStruct;
    sp.traceSheetEL?.displayDmaAbility(SnapshotStruct.selectSnapshotStruct.startNs, dmaAbilityRow!.dataListCache);
  } else if (clickRowType === TraceRow.ROW_TYPE_DMA_VMTRACKER && SnapshotStruct.hoverSnapshotStruct) {
    let dmaVmTracker = sp.shadowRoot?.querySelector<TraceRow<SnapshotStruct>>(`trace-row[row-type='dma-vmTracker']`);
    SnapshotStruct.selectSnapshotStruct = SnapshotStruct.hoverSnapshotStruct;
    sp.traceSheetEL?.displayDmaVmTracker(SnapshotStruct.selectSnapshotStruct.startNs, dmaVmTracker!.dataListCache);
  } else if (clickRowType === TraceRow.ROW_TYPE_GPU_MEMORY_ABILITY && SnapshotStruct.hoverSnapshotStruct) {
    let gpuMemoryAbilityMonitor = sp.shadowRoot?.querySelector<TraceRow<SnapshotStruct>>(
      `trace-row[row-id='abilityMonitorGpuMemory']`
    );
    SnapshotStruct.selectSnapshotStruct = SnapshotStruct.hoverSnapshotStruct;
    sp.traceSheetEL?.displayGpuMemoryAbility(
      SnapshotStruct.selectSnapshotStruct.startNs,
      gpuMemoryAbilityMonitor!.dataListCache
    );
  } else if (clickRowType === TraceRow.ROW_TYPE_GPU_MEMORY_VMTRACKER && SnapshotStruct.hoverSnapshotStruct) {
    let gpuMemoryVmTracker = sp.shadowRoot?.querySelector<TraceRow<SnapshotStruct>>(
      `trace-row[row-id='Skia Gpu Memory']`
    );
    SnapshotStruct.selectSnapshotStruct = SnapshotStruct.hoverSnapshotStruct;
    sp.traceSheetEL?.displayGpuMemoryVmTracker(
      SnapshotStruct.selectSnapshotStruct.startNs,
      gpuMemoryVmTracker!.dataListCache
    );
  } else if (clickRowType === TraceRow.ROW_TYPE_GPU_RESOURCE_VMTRACKER && SnapshotStruct.hoverSnapshotStruct) {
    SnapshotStruct.selectSnapshotStruct = SnapshotStruct.hoverSnapshotStruct;
    sp.traceSheetEL?.displayGpuResourceVmTracker(SnapshotStruct.selectSnapshotStruct.startNs);
  } else {
    if (!JankStruct.hoverJankStruct && JankStruct.delJankLineFlag) {
      sp.removeLinkLinesByBusinessType('janks');
    }
    sp.observerScrollHeightEnable = false;
    sp.selectFlag = null;
    sp.timerShaftEL?.removeTriangle('inverted');
    if (!SportRuler.isMouseInSportRuler) {
      sp.traceSheetEL?.setAttribute('mode', 'hidden');
      sp.refreshCanvas(true);
    }
  }
  if (!JankStruct.selectJankStruct) {
    sp.removeLinkLinesByBusinessType('janks');
  }
  if (!ThreadStruct.selectThreadStruct) {
    sp.removeLinkLinesByBusinessType('thread');
  }
  if (row) {
    let pointEvent = sp.createPointEvent(row);
    SpStatisticsHttpUtil.addOrdinaryVisitAction({
      action: 'trace_row',
      event: pointEvent,
    });
  }
}
export function SpSystemTraceDocumentOnMouseMove(sp: SpSystemTrace, ev: MouseEvent) {
  if (!sp.loadTraceCompleted || (window as any).flagInputFocus || !sp.mouseEventEnable) {
    return;
  }
  if ((window as any).collectResize) {
    sp.style.cursor = 'row-resize';
    sp.cancelDrag();
    return;
  }
  if (sp.isWASDKeyPress()) {
    sp.hoverFlag = null;
    ev.preventDefault();
    return;
  }
  if (ev.ctrlKey && ev.button === 0 && sp.isMouseLeftDown) {
    sp.translateByMouseMove(ev);
  }
  sp.inFavoriteArea = sp.favoriteChartListEL?.containPoint(ev);
  if ((window as any).isSheetMove || sp.isMouseInSheet(ev)) {
    sp.hoverStructNull();
    sp.tipEL!.style.display = 'none';
    return;
  }
  let isMouseInTimeShaft = sp.timerShaftEL?.containPoint(ev);
  if (isMouseInTimeShaft) {
    sp.tipEL!.style.display = 'none';
    sp.hoverStructNull();
  }
  let rows = sp.visibleRows;
  if (sp.timerShaftEL?.isScaling()) {
    return;
  }
  sp.timerShaftEL?.documentOnMouseMove(ev, sp);
  if (isMouseInTimeShaft) {
    return;
  }
  sp.rangeSelect.mouseMove(rows, ev);
  if (sp.rangeSelect.rangeTraceRow!.length > 0) {
    sp.tabCpuFreq!.rangeTraceRow = sp.rangeSelect.rangeTraceRow;
    sp.tabCpuState!.rangeTraceRow = sp.rangeSelect.rangeTraceRow;
  }
  let search = document.querySelector('body > sp-application')!.shadowRoot!.querySelector<LitSearch>('#lit-search');
  if (sp.rangeSelect.isMouseDown && search?.isClearValue) {
    sp.refreshCanvas(true);
    if (TraceRow.rangeSelectObject) {
      if (search && search.searchValue !== '') {
        search.clear();
        search.valueChangeHandler?.('');
      }
    }
  } else {
    if (!sp.rowsPaneEL!.containPoint(ev, { left: 248 })) {
      sp.hoverStructNull();
    }
    rows
      .filter((it) => it.focusContain(ev, sp.inFavoriteArea!) && it.collect === sp.inFavoriteArea)
      .filter((it) => {
        if (it.collect) {
          return true;
        } else {
          return (
            it.getBoundingClientRect().bottom + it.getBoundingClientRect().height >
            sp.favoriteChartListEL!.getBoundingClientRect().bottom
          );
        }
      })
      .forEach((tr) => {
        sp.hoverStructNull();
        if (sp.currentRowType != tr.rowType) {
          sp.currentRowType = tr.rowType || '';
        }
        tr.findHoverStruct?.();
        tr.focusHandler?.(ev);
      });
    requestAnimationFrame(() => sp.refreshCanvas(true));
  }
}

export function SpSystemTraceDocumentOnMouseOut(sp: SpSystemTrace, ev: MouseEvent) {
  if (!sp.loadTraceCompleted) {
    return;
  }
  TraceRow.isUserInteraction = false;
  sp.isMouseLeftDown = false;
  if (sp.isMouseInSheet(ev)) {
    return;
  }
  if (ev.offsetX > sp.timerShaftEL!.canvas!.offsetLeft) {
    sp.rangeSelect.mouseOut(ev);
    sp.timerShaftEL?.documentOnMouseOut(ev);
  }
}

export function SpSystemTraceDocumentOnKeyPress(sp: SpSystemTrace, ev: KeyboardEvent) {
  if (!sp.loadTraceCompleted) {
    return;
  }
  let keyPress = ev.key.toLocaleLowerCase();
  TraceRow.isUserInteraction = true;
  if (sp.isMousePointInSheet) {
    return;
  }
  sp.observerScrollHeightEnable = false;
  if (sp.keyboardEnable) {
    if (keyPress === 'm') {
      sp.slicestime = sp.setSLiceMark(ev.shiftKey);
      if (sp.slicestime) {
        if (TraceRow.rangeSelectObject) {
          let showTab = sp.getShowTab();
          sp.traceSheetEL
            ?.displayTab<TabPaneCurrent>('tabpane-current', ...showTab)
            .setCurrentSlicesTime(sp.slicestime);
        } else {
          sp.traceSheetEL?.displayTab<TabPaneCurrent>('tabpane-current').setCurrentSlicesTime(sp.slicestime);
        }
      }
    }
    if (keyPress === 'f') {
      // 设置当前的slicesTime
      sp.setCurrentSlicesTime();
    }
    let keyPressWASD = keyPress === 'w' || keyPress === 'a' || keyPress === 's' || keyPress === 'd';
    if (keyPressWASD) {
      sp.keyPressMap.set(keyPress, true);
      sp.hoverFlag = null;
    }
    sp.timerShaftEL!.documentOnKeyPress(ev, sp.currentSlicesTime);
    if (keyPress === 'f') {
      sp.verticalScrollToRow();
    }
  } else {
    sp.stopWASD();
  }
}

export function SpSystemTraceDocumentOnMouseDown(sp: SpSystemTrace, ev: MouseEvent) {
  if (!sp.loadTraceCompleted || !sp.mouseEventEnable) {
    return;
  }
  if (sp.isWASDKeyPress()) {
    ev.preventDefault();
    ev.stopPropagation();
    return;
  }
  if (ev.button === 0) {
    sp.isMouseLeftDown = true;
    if (ev.ctrlKey) {
      ev.preventDefault();
      sp.style.cursor = 'move';
      sp.mouseCurrentPosition = ev.clientX;
      return;
    }
  }

  TraceRow.isUserInteraction = true;
  if (sp.isMouseInSheet(ev)) {
    return;
  }
  sp.observerScrollHeightEnable = false;
  if (ev.offsetX > sp.timerShaftEL!.canvas!.offsetLeft) {
    let x = ev.offsetX - sp.timerShaftEL!.canvas!.offsetLeft;
    let y = ev.offsetY;
    sp.timerShaftEL?.documentOnMouseDown(ev);
    if (
      !(
        sp.timerShaftEL!.sportRuler!.frame.contains(x, y) &&
        x > (TraceRow.rangeSelectObject?.startX || 0) &&
        x < (TraceRow.rangeSelectObject?.endX || 0)
      )
    ) {
      sp.rangeSelect.mouseDown(ev);
      sp.rangeSelect.drag = true;
    }
    //  如果鼠标摁下事件发生在traceRow范围或时间轴(sportRuler除外)范围内,清除上次点击调用栈产生的所有的三角旗子
    // ev.offsetY:鼠标在SpSystemTrace元素的y轴偏移量
    if (
      ev.offsetY > sp.timerShaftEL!.clientHeight ||
      ev.offsetY < sp.timerShaftEL!.clientHeight - sp.timerShaftEL!.sportRuler!.frame.height
    ) {
      sp.clearTriangle(sp.timerShaftEL!.sportRuler!.flagList);
    }
  } else {
    sp.rangeSelect.drag = false;
  }
}

export function SpSystemTraceDocumentOnMouseUp(sp: SpSystemTrace, ev: MouseEvent) {
  if ((window as any).collectResize) {
    return;
  }
  if (!sp.loadTraceCompleted || !sp.mouseEventEnable) {
    return;
  }
  if (sp.isWASDKeyPress()) {
    ev.preventDefault();
    ev.stopPropagation();
    return;
  }
  sp.isMouseLeftDown = false;
  if (ev.ctrlKey) {
    ev.preventDefault();
    sp.offsetMouse = 0;
    sp.mouseCurrentPosition = 0;
    sp.style.cursor = 'default';
    return;
  }
  TraceRow.isUserInteraction = false;
  sp.rangeSelect.isMouseDown = false;
  if ((window as any).isSheetMove) {
    return;
  }
  if (sp.isMouseInSheet(ev)) {
    return;
  }
  if (ev.offsetX > sp.timerShaftEL!.canvas!.offsetLeft) {
    let x = ev.offsetX - sp.timerShaftEL!.canvas!.offsetLeft;
    let y = ev.offsetY;
    if (
      sp.timerShaftEL!.sportRuler!.frame.contains(x, y) &&
      x > (TraceRow.rangeSelectObject?.startX || 0) &&
      x < (TraceRow.rangeSelectObject?.endX || 0)
    ) {
      let findSlicestime = sp.timerShaftEL!.sportRuler?.findSlicesTime(x, y); // 查找帽子
      if (!findSlicestime) {
        // 如果没有找到帽子，则绘制一个旗子
        let time = Math.round(
          (x * (TraceRow.range?.endNS! - TraceRow.range?.startNS!)) / sp.timerShaftEL!.canvas!.offsetWidth +
            TraceRow.range?.startNS!
        );
        sp.timerShaftEL!.sportRuler!.drawTriangle(time, 'squre');
      }
    }
  }
  if (!SportRuler.isMouseInSportRuler) {
    sp.rangeSelect.mouseUp(ev);
  }
  sp.timerShaftEL?.documentOnMouseUp(ev);
}

export function SpSystemTraceDocumentOnKeyUp(sp: SpSystemTrace, ev: KeyboardEvent) {
  if (sp.times.size > 0) {
    for (let timerId of sp.times) {
      clearTimeout(timerId);
    }
  }
  if (ev.key.toLocaleLowerCase() === '?') {
    document
      .querySelector('body > sp-application')!
      .shadowRoot!.querySelector<SpKeyboard>('#sp-keyboard')!.style.visibility = 'visible';
  }
  if (!sp.loadTraceCompleted) return;
  sp.keyboardEnable && enableVSync(false, ev, () => sp.refreshCanvas(true));
  let keyPress = ev.key.toLocaleLowerCase();
  if (keyPress === 'w' || keyPress === 'a' || keyPress === 's' || keyPress === 'd') {
    sp.keyPressMap.set(keyPress, false);
  }
  TraceRow.isUserInteraction = false;
  sp.observerScrollHeightEnable = false;
  sp.keyboardEnable && sp.timerShaftEL!.documentOnKeyUp(ev);
  if (ev.code === 'Enter') {
    document.removeEventListener('keydown', sp.documentOnKeyDown);
    if (ev.shiftKey) {
      sp.dispatchEvent(
        new CustomEvent('trace-previous-data', {
          detail: {},
          composed: false,
        })
      );
    } else {
      sp.dispatchEvent(
        new CustomEvent('trace-next-data', {
          detail: {},
          composed: false,
        })
      );
    }
    document.addEventListener('keydown', sp.documentOnKeyDown);
  }

  if (ev.ctrlKey) {
    if (keyPress === '[' && sp._slicesList.length > 1) {
      sp.MarkJump(sp._slicesList, 'slice', 'previous');
    } else if (keyPress === ',' && sp._flagList.length > 1) {
      sp.MarkJump(sp._flagList, 'flag', 'previous');
    } else if (keyPress === ']' && sp._slicesList.length > 1) {
      sp.MarkJump(sp._slicesList, 'slice', 'next');
    } else if (keyPress === '.' && sp._flagList.length > 1) {
      sp.MarkJump(sp._flagList, 'flag', 'next');
    } else {
      return;
    }
  }
}

export function SpSystemTraceDocumentOnClick(sp: SpSystemTrace, ev: MouseEvent) {
  if (!sp.loadTraceCompleted) {
    return;
  }
  if (sp.isWASDKeyPress()) {
    sp.hoverFlag = null;
    ev.preventDefault();
    ev.stopPropagation();
    return;
  }
  if ((window as any).isSheetMove) {
    return;
  }
  if (sp.isMouseInSheet(ev)) {
    return;
  }
  if ((window as any).isPackUpTable) {
    (window as any).isPackUpTable = false;
    return;
  }
  let x = ev.offsetX - sp.timerShaftEL!.canvas!.offsetLeft;
  let y = ev.offsetY;
  if (sp.timerShaftEL?.getRangeRuler()?.frame.contains(x, y)) {
    sp.clickEmptyArea();
    return;
  }
  if (sp.rangeSelect.isDrag()) {
    return;
  }
  if (
    !(
      sp.timerShaftEL!.sportRuler!.frame.contains(x, y) &&
      x > (TraceRow.rangeSelectObject?.startX || 0) &&
      x < (TraceRow.rangeSelectObject?.endX || 0)
    )
  ) {
    let inFavoriteArea = sp.favoriteChartListEL?.containPoint(ev);
    let rows = sp.visibleRows.filter((it) => it.focusContain(ev, inFavoriteArea!) && it.collect === inFavoriteArea);
    if (JankStruct.delJankLineFlag) {
      sp.removeLinkLinesByBusinessType('janks');
    }
    if (rows && rows[0] && sp.traceRowClickJudgmentConditions.get(rows[0]!.rowType!)?.()) {
      sp.onClickHandler(rows[0]!.rowType!, rows[0]);
      sp.documentOnMouseMove(ev);
    } else {
      sp.clickEmptyArea();
    }
  }
  ev.preventDefault();
}

export function SpSystemTraceDocumentOnKeyDown(sp: SpSystemTrace, ev: KeyboardEvent) {
  document.removeEventListener('keyup', sp.documentOnKeyUp);
  sp.debounce(sp.continueSearch, 250, ev)();
  document.addEventListener('keyup', sp.documentOnKeyUp);
}
