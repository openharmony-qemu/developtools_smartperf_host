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
import { ThreadStruct, ThreadStructOnClick } from '../database/ui-worker/ProcedureWorkerThread';
import { TraceRow } from './trace/base/TraceRow';
import { JankStruct, JankStructOnClick } from '../database/ui-worker/ProcedureWorkerJank';
import { HeapSnapshotStruct, HeapSnapshotStructOnClick } from '../database/ui-worker/ProcedureWorkerHeapSnapshot';
import { FuncStruct, funcStructOnClick } from '../database/ui-worker/ProcedureWorkerFunc';
import { CpuFreqStruct, CpuFreqStructOnClick } from '../database/ui-worker/ProcedureWorkerFreq';
import { ClockStruct, ClockStructOnClick } from '../database/ui-worker/ProcedureWorkerClock';
import { DmaFenceStruct, DmaFenceStructOnClick } from '../database/ui-worker/ProcedureWorkerDmaFence';
import { SnapshotStruct, SnapshotStructOnClick } from '../database/ui-worker/ProcedureWorkerSnapshot';
import { IrqStruct, IrqStructOnClick } from '../database/ui-worker/ProcedureWorkerIrq';
import { HeapStruct, HeapStructOnClick } from '../database/ui-worker/ProcedureWorkerHeap';
import { JsCpuProfilerStruct, JsCpuProfilerStructOnClick } from '../database/ui-worker/ProcedureWorkerCpuProfiler';
import { AppStartupStruct, AppStartupStructOnClick } from '../database/ui-worker/ProcedureWorkerAppStartup';
import { AllAppStartupStruct, allAppStartupStructOnClick } from '../database/ui-worker/ProcedureWorkerAllAppStartup';
import { SoStruct, SoStructOnClick } from '../database/ui-worker/ProcedureWorkerSoInit';
import { FrameAnimationStruct, FrameAnimationStructOnClick } from '../database/ui-worker/ProcedureWorkerFrameAnimation';
import { FrameDynamicStruct, FrameDynamicStructOnClick } from '../database/ui-worker/ProcedureWorkerFrameDynamic';
import { FrameSpacingStruct, FrameSpacingStructOnClick } from '../database/ui-worker/ProcedureWorkerFrameSpacing';
import { SampleStruct, sampleStructOnClick } from '../database/ui-worker/ProcedureWorkerBpftrace';
import { SportRuler } from './trace/timer-shaft/SportRuler';
import { SpStatisticsHttpUtil } from '../../statistics/util/SpStatisticsHttpUtil';
import { LitSearch } from './trace/search/Search';
import { TabPaneCurrent } from './trace/sheet/TabPaneCurrent';
import type { SpKeyboard } from './SpKeyboard';
import { enableVSync } from './chart/VSync';
import { CpuStruct, CpuStructOnClick } from '../database/ui-worker/cpu/ProcedureWorkerCPU';
import { ProcessMemStruct } from '../database/ui-worker/ProcedureWorkerMem';
import { CpuStateStruct, CpuStateStructOnClick } from '../database/ui-worker/cpu/ProcedureWorkerCpuState';
import {
  CpuFreqLimitsStruct,
  CpuFreqLimitsStructOnClick
} from '../database/ui-worker/cpu/ProcedureWorkerCpuFreqLimits';
import { FlagsConfig } from './SpFlags';
import { LitMainMenu } from '../../base-ui/menu/LitMainMenu';
import { PerfToolsStructOnClick, PerfToolStruct } from '../database/ui-worker/ProcedureWorkerPerfTool';
import { Utils } from './trace/base/Utils';
import { BaseStruct } from '../bean/BaseStruct';
import { GpuCounterStruct, gpuCounterStructOnClick } from '../database/ui-worker/ProcedureWorkerGpuCounter';
import { HangStructOnClick } from '../database/ui-worker/ProcedureWorkerHang';
import { XpowerStruct, XpowerStructOnClick } from '../database/ui-worker/ProcedureWorkerXpower';
import { XpowerStatisticStruct, XpowerStatisticStructOnClick } from '../database/ui-worker/ProcedureWorkerXpowerStatistic';
import { SpAiAnalysisPage } from './SpAiAnalysisPage';
import { XpowerAppDetailStruct, XpowerAppDetailStructOnClick } from '../database/ui-worker/ProcedureWorkerXpowerAppDetail';
import { XpowerWifiBytesStructOnClick, XpowerWifiPacketsStructOnClick, XpowerWifiStruct } from '../database/ui-worker/ProcedureWorkerXpowerWifi';
import { XpowerThreadInfoStruct, XpowerThreadInfoStructOnClick } from '../database/ui-worker/ProcedureWorkerXpowerThreadInfo';
import { XpowerGpuFreqStruct, XpowerGpuFreqStructOnClick } from '../database/ui-worker/ProcedureWorkerXpowerGpuFreq';

function timeoutJudge(sp: SpSystemTrace): number {
  let timeoutJudge = window.setTimeout((): void => {
    if (SpSystemTrace.wakeupList.length && CpuStruct.selectCpuStruct) {
      let checkHandlerKey: boolean = true;
      let saveSelectCpuStruct: unknown = JSON.parse(sessionStorage.getItem('saveselectcpustruct')!);
      for (const item of SpSystemTrace.wakeupList) {
        if (item.ts === CpuStruct.selectCpuStruct.startTime && item.dur === CpuStruct.selectCpuStruct.dur) {
          checkHandlerKey = false;
          if (SpSystemTrace.wakeupList[0].schedulingDesc) {
            //@ts-ignore
            SpSystemTrace.wakeupList.unshift(saveSelectCpuStruct);
          }
          sp.refreshCanvas(true);
          break;
        } else if (
          //@ts-ignore
          saveSelectCpuStruct.startTime === CpuStruct.selectCpuStruct.startTime &&
          //@ts-ignore
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
  return timeoutJudge;
}

function threadClickHandlerFunc(sp: SpSystemTrace): (e: ThreadStruct) => void {
  let threadClickHandler = (d: ThreadStruct): void => {
    sp.observerScrollHeightEnable = false;
    sp.scrollToProcess(`${d.cpu}`, '', 'cpu-data', true);
    let cpuRow = sp.queryAllTraceRow<TraceRow<CpuStruct>>(
      `trace-row[row-id='${Utils.getDistributedRowId(d.cpu)}'][row-type='cpu-data']`,
      (row) => row.rowId === `${Utils.getDistributedRowId(d.cpu)}` && row.rowType === 'cpu-data'
    )[0];
    if (cpuRow) {
      sp.currentRow = cpuRow;
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
        // @ts-ignore
        findEntry, // @ts-ignore
        cpuRow.dataListCache.find((it) => it.startTime > findEntry.startTime)
      );
      if (
        // @ts-ignore
        findEntry!.startTime! + findEntry!.dur! < TraceRow.range!.startNS || // @ts-ignore
        findEntry!.startTime! > TraceRow.range!.endNS
      ) {
        sp.timerShaftEL?.setRangeNS(
          // @ts-ignore
          findEntry!.startTime! - findEntry!.dur! * 2, // @ts-ignore
          findEntry!.startTime! + findEntry!.dur! + findEntry!.dur! * 2
        );
      }
      sp.hoverStructNull().selectStructNull().wakeupListNull(); // @ts-ignore
      CpuStruct.hoverCpuStruct = findEntry; // @ts-ignore
      CpuStruct.selectCpuStruct = findEntry; // @ts-ignore
      sp.timerShaftEL?.drawTriangle(findEntry!.startTime || 0, 'inverted');
      sp.traceSheetEL?.displayCpuData(
        CpuStruct.selectCpuStruct!,
        (wakeUpBean) => {
          sp.removeLinkLinesByBusinessType('thread');
          CpuStruct.wakeupBean = wakeUpBean;
          sp.refreshCanvas(true);
        },
        cpuClickHandlerFunc(sp)
      );
    }
  };
  return threadClickHandler;
}

//点击prio箭头刷新canvas
function prioClickHandlerFunc(sp: SpSystemTrace): (d: unknown) => void {
  return function (d: unknown): void {
    // @ts-ignore
    ThreadStruct.prioCount = d;
    ThreadStruct.isClickPrio = true;
    sp.refreshCanvas(true);
  };
}

function scrollToFuncHandlerFunc(sp: SpSystemTrace): Function {
  let funClickHandle = (funcStruct: unknown): void => {
    // @ts-ignore
    if (funcStruct.chainId) {
    }
    sp.observerScrollHeightEnable = true;
    // @ts-ignore
    sp.moveRangeToCenter(funcStruct.startTs!, funcStruct.dur!);
    sp.scrollToActFunc(funcStruct, false);
  };
  return funClickHandle;
}

function scrollToFunc(sp: SpSystemTrace): Function {
  let funClickHandle = (funcStruct: unknown): void => {
    // @ts-ignore
    if (funcStruct.chainId) {
    }
    sp.observerScrollHeightEnable = true;
    // @ts-ignore
    sp.scrollToActFunc(funcStruct, false);
  };
  return funClickHandle;
}

function jankClickHandlerFunc(sp: SpSystemTrace): Function {
  let jankClickHandler = (d: unknown): void => {
    sp.observerScrollHeightEnable = true;
    let jankRowParent: unknown;
    //@ts-ignore
    if (d.rowId === 'actual frameTime') {
      jankRowParent = sp.shadowRoot?.querySelector<TraceRow<JankStruct>>("trace-row[row-id='frameTime']");
    } else {
      jankRowParent = sp.shadowRoot?.querySelector<TraceRow<JankStruct>>(
        //@ts-ignore
        `trace-row[row-type='process'][row-id='${d.pid}']`
      );
    }
    //@ts-ignore
    jankRowParent!.expansion = true;
    let jankRow: unknown;
    //@ts-ignore
    jankRowParent.childrenList.forEach((item: TraceRow<JankStruct>) => {
      //@ts-ignore
      if (`${item.rowId}` === `${d.rowId}` && `${item.rowType}` === 'janks') {
        jankRow = item;
      }
    });
    //@ts-ignore
    sp.currentRow = jankRow;
    if (jankRow) {
      JankStruct.selectJankStructList.length = 0;
      //@ts-ignore
      let findJankEntry = jankRow!.dataListCache!.find(
        //@ts-ignore
        (dat: unknown) => `${dat.name}` === `${d.name}` && `${dat.pid}` === `${d.pid}`
      );
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
        sp.hoverStructNull().selectStructNull().wakeupListNull();
        JankStruct.hoverJankStruct = findJankEntry;
        JankStruct.selectJankStruct = findJankEntry;
        sp.timerShaftEL?.drawTriangle(findJankEntry!.ts || 0, 'inverted');
        sp.traceSheetEL?.displayJankData(
          JankStruct.selectJankStruct!,
          (datas) => {
            sp.removeLinkLinesByBusinessType('janks');
            // 绘制跟自己关联的线
            datas.forEach((data) => {
              //@ts-ignore
              let endParentRow = sp.shadowRoot?.querySelector<TraceRow<BaseStruct>>( // @ts-ignore
                `trace-row[row-type='process'][row-id='${data.pid}'][folder]`
              );
              sp.drawJankLine(endParentRow, JankStruct.selectJankStruct!, data, true);
            });
          },
          jankClickHandler
        );
      }
      //@ts-ignore
      sp.scrollToProcess(jankRow.rowId!, jankRow.rowParentId!, jankRow.rowType!, true);
    }
  };
  return jankClickHandler;
}

function snapshotClickHandlerFunc(sp: SpSystemTrace): Function {
  let snapshotClickHandler = (d: HeapSnapshotStruct): void => {
    sp.observerScrollHeightEnable = true;
    let snapshotRow = sp.shadowRoot?.querySelector<TraceRow<HeapSnapshotStruct>>(`trace-row[row-id='heapsnapshot']`);
    let task = (): void => {
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
  return snapshotClickHandler;
}

//@ts-ignore
function cpuClickHandlerTask(threadRow: TraceRow<unknown>, sp: SpSystemTrace, d: CpuStruct): void {
  if (threadRow) {
    let findEntry = threadRow!.fixedList[0];
    if (
      //@ts-ignore
      findEntry!.startTime! + findEntry!.dur! < TraceRow.range!.startNS ||
      //@ts-ignore
      findEntry!.startTime! > TraceRow.range!.endNS
    ) {
      sp.timerShaftEL?.setRangeNS(
        //@ts-ignore
        findEntry!.startTime! - findEntry!.dur! * 2,
        //@ts-ignore
        findEntry!.startTime! + findEntry!.dur! + findEntry!.dur! * 2
      );
    }
    ThreadStruct.firstselectThreadStruct = ThreadStruct.selectThreadStruct;
    sp.hoverStructNull().selectStructNull().wakeupListNull();
    //@ts-ignore
    ThreadStruct.hoverThreadStruct = findEntry;
    //@ts-ignore
    ThreadStruct.selectThreadStruct = findEntry;
    //@ts-ignore
    sp.timerShaftEL?.drawTriangle(findEntry!.startTime || 0, 'inverted');
    sp.traceSheetEL?.displayThreadData(
      ThreadStruct.selectThreadStruct!,
      threadClickHandlerFunc(sp), // @ts-ignore
      cpuClickHandlerFunc(sp),
      prioClickHandlerFunc(sp),
      (datas, str): void => {
        sp.removeLinkLinesByBusinessType('thread');
        if (str === 'wakeup tid') {
          datas.forEach((data) => {
            //@ts-ignore
            let endParentRow = sp.shadowRoot?.querySelector<TraceRow<unknown>>( //@ts-ignore
              `trace-row[row-id='${data.pid}'][folder]`
            );
            sp.drawThreadLine(endParentRow, ThreadStruct.firstselectThreadStruct, data);
          });
        }
        sp.refreshCanvas(true);
      }
    );
    sp.scrollToProcess(`${d.tid}`, `${d.processId}`, 'thread', true);
  }
}

function cpuClickHandlerFunc(sp: SpSystemTrace) {
  return function (d: CpuStruct): void {
    //@ts-ignore
    let traceRow = sp.shadowRoot?.querySelector<TraceRow<unknown>>(
      `trace-row[row-id='${Utils.getDistributedRowId(d.processId)}'][row-type='process']`
    );
    if (traceRow) {
      traceRow.expansion = true;
    }
    sp.observerScrollHeightEnable = true;
    let threadRow = sp.queryAllTraceRow<TraceRow<ThreadStruct>>(
      `trace-row[row-id='${Utils.getDistributedRowId(d.tid)}'][row-type='thread'][row-parent-id='${traceRow?.rowId}']`,
      (row) => row.rowId === `${d.tid}` && row.rowType === 'thread' && row.rowParentId === traceRow?.rowId
    )[0];
    sp.currentRow = threadRow;
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
        cpuClickHandlerTask(threadRow, sp, d);
      } else {
        sp.scrollToProcess(`${d.tid}`, `${d.processId}`, 'process', false);
        sp.scrollToProcess(`${d.tid}`, `${d.processId}`, 'thread', true);
        threadRow!.onComplete = (): void => cpuClickHandlerTask(threadRow, sp, d);
      }
    }
  };
}


function allStructOnClick(clickRowType: string, sp: SpSystemTrace, row?: TraceRow<BaseStruct>, entry?: unknown): void {
  CpuStructOnClick(clickRowType, sp, cpuClickHandlerFunc(sp), entry as CpuStruct)
    .then(() => ThreadStructOnClick(clickRowType, sp, threadClickHandlerFunc(sp), cpuClickHandlerFunc(sp),
      prioClickHandlerFunc(sp), entry as ThreadStruct))
    .then(() => funcStructOnClick(clickRowType, sp, row as TraceRow<FuncStruct>,
      scrollToFuncHandlerFunc(sp), entry as FuncStruct))
    .then(() => CpuFreqStructOnClick(clickRowType, sp, entry as CpuFreqStruct))
    .then(() => CpuStateStructOnClick(clickRowType, sp, entry as CpuStateStruct))
    .then(() => CpuFreqLimitsStructOnClick(clickRowType, sp, entry as CpuFreqLimitsStruct))
    .then(() => ClockStructOnClick(clickRowType, sp, entry as ClockStruct))
    .then(() => XpowerStructOnClick(clickRowType, sp, entry as XpowerStruct))
    .then(() => XpowerStatisticStructOnClick(clickRowType, sp, row as TraceRow<XpowerStatisticStruct>, entry as XpowerStatisticStruct))
    .then(() => XpowerAppDetailStructOnClick(clickRowType, sp, entry as XpowerAppDetailStruct))
    .then(() => XpowerWifiBytesStructOnClick(clickRowType, sp, entry as XpowerWifiStruct))
    .then(() => XpowerWifiPacketsStructOnClick(clickRowType, sp, entry as XpowerWifiStruct))
    .then(() => XpowerThreadInfoStructOnClick(clickRowType, sp, entry as XpowerThreadInfoStruct))
    .then(() => XpowerGpuFreqStructOnClick(clickRowType, sp, entry as XpowerGpuFreqStruct))
    .then(() => HangStructOnClick(clickRowType, sp, scrollToFunc(sp)))
    .then(() => DmaFenceStructOnClick(clickRowType, sp, entry as DmaFenceStruct))
    .then(() => SnapshotStructOnClick(clickRowType, sp, row as TraceRow<SnapshotStruct>, entry as SnapshotStruct))
    .then(() => IrqStructOnClick(clickRowType, sp, entry as IrqStruct))
    .then(() => HeapStructOnClick(clickRowType, sp, row as TraceRow<HeapStruct>, entry as HeapStruct))
    .then(() => JankStructOnClick(clickRowType, sp, row as TraceRow<JankStruct>,
      jankClickHandlerFunc(sp), entry as JankStruct))
    .then(() => HeapSnapshotStructOnClick(clickRowType, sp, row as TraceRow<HeapSnapshotStruct>,
      snapshotClickHandlerFunc(sp), entry as HeapSnapshotStruct))
    .then(() => JsCpuProfilerStructOnClick(clickRowType, sp, row as TraceRow<JsCpuProfilerStruct>,
      entry as JsCpuProfilerStruct))
    .then(() => AppStartupStructOnClick(clickRowType, sp, scrollToFuncHandlerFunc(sp), entry as AppStartupStruct))
    .then(() => allAppStartupStructOnClick(clickRowType, sp, scrollToFuncHandlerFunc(sp), entry as AllAppStartupStruct))
    .then(() => SoStructOnClick(clickRowType, sp, scrollToFuncHandlerFunc(sp), entry as SoStruct))
    .then(() => FrameAnimationStructOnClick(clickRowType, sp,
      scrollToFuncHandlerFunc(sp), row as TraceRow<FrameAnimationStruct>, entry as FrameAnimationStruct))
    .then(() => FrameDynamicStructOnClick(clickRowType, sp, row, entry as FrameDynamicStruct))
    .then(() => FrameSpacingStructOnClick(clickRowType, sp, row!, entry as FrameSpacingStruct))
    .then(() => sampleStructOnClick(clickRowType, sp, row as TraceRow<SampleStruct>, entry as SampleStruct))
    .then(() => gpuCounterStructOnClick(clickRowType, sp, entry as GpuCounterStruct))
    .then(() => PerfToolsStructOnClick(clickRowType, sp, entry as PerfToolStruct))
    .then(() => {
      if (!JankStruct.hoverJankStruct && JankStruct.delJankLineFlag) {
        sp.removeLinkLinesByBusinessType('janks');
      }
      sp.observerScrollHeightEnable = false;
      sp.selectFlag = null;
      sp.timerShaftEL?.removeTriangle('inverted');
      if (!SportRuler.isMouseInSportRuler) {
        sp.traceSheetEL?.setMode('hidden');
        sp.refreshCanvas(true, 'click');
      }
    })
    .catch((e): void => { });
  SpAiAnalysisPage.selectChangeListener(TraceRow.range?.startNS!, TraceRow.range?.endNS!);
}
export default function spSystemTraceOnClickHandler(
  sp: SpSystemTrace,
  clickRowType: string,
  row?: TraceRow<BaseStruct>,
  entry?: unknown
): void {
  if (row) {
    sp.currentRow = row;
    sp.setAttribute('clickRow', clickRowType);
    sp.setAttribute('rowName', row.name!);
    sp.setAttribute('rowId', row.rowId!);
  }
  if (!sp.loadTraceCompleted) {
    return;
  }
  sp.queryAllTraceRow().forEach(it => {
    it.checkType = '-1';
    it.rangeSelect = false;
  });
  sp.selectStructNull();
  sp._slicesList.forEach((slice: { selected: boolean }): void => {
    slice.selected = false;
  });
  // 判断点击的线程是否在唤醒树内
  timeoutJudge(sp);
  allStructOnClick(clickRowType, sp, row, entry);
  if (!JankStruct.selectJankStruct) {
    sp.removeLinkLinesByBusinessType('janks');
  }
  if (!ThreadStruct.selectThreadStruct) {
    sp.removeLinkLinesByBusinessType('thread');
  }
  if (!FuncStruct.selectFuncStruct) {
    sp.removeLinkLinesByBusinessType('distributed', 'func');
  }
  if (row) {
    let pointEvent = sp.createPointEvent(row);
    SpStatisticsHttpUtil.addOrdinaryVisitAction({
      action: 'trace_row', // @ts-ignore
      event: pointEvent,
    });
  }
}

//@ts-ignore
function handleActions(sp: SpSystemTrace, rows: Array<TraceRow<unknown>>, ev: MouseEvent): void {
  if (sp.rangeSelect.isMouseDown && sp.rangeSelect.drag) {
    let downRow = sp.visibleRows.find((row) => row.containPoint(ev));
    if (downRow && downRow.traceId !== Utils.currentSelectTrace) {
      spSystemTraceDocumentOnMouseMoveMouseUp(sp, rows, ev);
      return;
    }
  }
  sp.rangeSelect.mouseMove(rows, ev);
  if (sp.rangeSelect.rangeTraceRow!.length > 0) {
    sp.tabCpuFreq!.rangeTraceRow = sp.rangeSelect.rangeTraceRow;
    sp.tabCpuState!.rangeTraceRow = sp.rangeSelect.rangeTraceRow;
  }
  let search = document.querySelector('body > sp-application')!.shadowRoot!.querySelector<LitSearch>('#lit-search');
  if (sp.rangeSelect.isMouseDown && search?.isClearValue) {
    spSystemTraceDocumentOnMouseMoveMouseDown(sp, search);
  } else {
    spSystemTraceDocumentOnMouseMoveMouseUp(sp, rows, ev);
  }
}

function handleMouseInTimeShaft(sp: SpSystemTrace, ev: MouseEvent): boolean | undefined {
  let isMouseInTimeShaft = sp.timerShaftEL?.containPoint(ev);
  if (isMouseInTimeShaft) {
    sp.tipEL!.style.display = 'none';
    sp.hoverStructNull();
  }
  return isMouseInTimeShaft;
}

export function spSystemTraceDocumentOnMouseMove(sp: SpSystemTrace, ev: MouseEvent): void {
  //@ts-ignore
  if (!sp.loadTraceCompleted || !sp.mouseEventEnable) {
    return;
  }
  //@ts-ignore
  if ((window as unknown).collectResize) {
    sp.style.cursor = 'row-resize';
    sp.cancelDrag();
    return;
  }
  if (sp.isWASDKeyPress()) {
    sp.hoverFlag = null;
    ev.preventDefault();
    return;
  }
  if (ev.ctrlKey && ev.button === 0 && SpSystemTrace.isMouseLeftDown) {
    // 计算当前tab组件的高度
    let tabHeight: number =
      sp.shadowRoot?.querySelector('trace-sheet')!.shadowRoot?.querySelector('lit-tabs')!.clientHeight! + 1;
    // 计算当前屏幕内高与鼠标位置坐标高度的差值
    let diffHeight: number = window.innerHeight - ev.clientY;
    // 如果差值大于面板高度，意味着鼠标位于泳道区域，可以通过ctrl+鼠标左键移动。否则不予生效
    if (diffHeight > tabHeight) {
      sp.translateByMouseMove(ev);
    } else {
      // 若鼠标位于tab面板区，则将其中标志位置成false
      SpSystemTrace.isMouseLeftDown = false;
    }
  }
  sp.inFavoriteArea = sp.favoriteChartListEL?.containPoint(ev);
  //@ts-ignore
  if ((window as unknown).isSheetMove || sp.isMouseInSheet(ev)) {
    sp.hoverStructNull();
    sp.tipEL!.style.display = 'none';
    return;
  }
  let isMouseInTimeShaft = handleMouseInTimeShaft(sp, ev);
  let rows = sp.visibleRows;
  sp.timerShaftEL?.documentOnMouseMove(ev, sp);

  if (isMouseInTimeShaft) {
    return;
  }
  handleActions(sp, rows, ev);
}

export function spSystemTraceDocumentOnMouseMoveMouseDown(sp: SpSystemTrace, search: LitSearch): void {
  sp.refreshCanvas(true, 'sp move down');
  if (TraceRow.rangeSelectObject) {
    if (search && search.searchValue !== '') {
      search.clear();
      search.valueChangeHandler?.('');
    }
  }
}

function spSystemTraceDocumentOnMouseMoveMouseUp(
  sp: SpSystemTrace, //@ts-ignore
  rows: Array<TraceRow<unknown>>,
  ev: MouseEvent
): void {
  if (!sp.rowsPaneEL!.containPoint(ev, { left: 248 })) {
    sp.hoverStructNull();
  }
  const transformYMatch = sp.canvasPanel?.style.transform.match(/\((\d+)[^\)]+\)/);
  const transformY = transformYMatch![1];
  let favoriteHeight = sp.favoriteChartListEL!.getBoundingClientRect().height;
  // @ts-ignore
  let memTr = rows.filter((item: unknown) => item.rowType === TraceRow.ROW_TYPE_MEM);
  rows
    .filter((it) => it.focusContain(ev, sp.inFavoriteArea!, Number(transformY), favoriteHeight) && it.collect === sp.inFavoriteArea)
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
    .forEach((tr): void => {
      if (tr.rowType !== TraceRow.ROW_TYPE_CPU) {
        CpuStruct.hoverCpuStruct = undefined;
      }
      if (tr.rowType !== TraceRow.ROW_TYPE_MEM) {
        ProcessMemStruct.hoverProcessMemStruct = undefined;
        memTr.forEach((i: unknown) => {
          // @ts-ignore
          i.focusHandler(ev);
        });
      }
      if (sp.currentRowType !== tr.rowType) {
        sp.currentRowType = tr.rowType || '';
      }
      tr.findHoverStruct?.();
      tr.focusHandler?.(ev);
    });
  requestAnimationFrame(() => sp.refreshCanvas(true, 'sp move up'));
}

export function spSystemTraceDocumentOnMouseOut(sp: SpSystemTrace, ev: MouseEvent): void {
  if (!sp.loadTraceCompleted) {
    return;
  }
  CpuStruct.hoverCpuStruct = undefined;
  TraceRow.isUserInteraction = false;
  SpSystemTrace.isMouseLeftDown = false;
  if (!sp.keyboardEnable) {
    return;
  }
  if (sp.isMouseInSheet(ev)) {
    return;
  }
  if (ev.offsetX > sp.timerShaftEL!.canvas!.offsetLeft) {
    sp.rangeSelect.mouseOut(ev);
    sp.timerShaftEL?.documentOnMouseOut(ev);
  }
}

export function spSystemTraceDocumentOnKeyPress(this: unknown, sp: SpSystemTrace, ev: KeyboardEvent): void {
  if (!sp.loadTraceCompleted || SpSystemTrace.isAiAsk) {
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
      if (sp.selectFlag) {
        sp.selectFlag!.selected = false;
      }
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
      let search = document.querySelector('body > sp-application')!.shadowRoot!.querySelector<LitSearch>('#lit-search');
      if (search && search.searchValue !== '' && sp.currentRow !== undefined) {
        sp.copyCurrentRow = sp.currentRow;
        sp.currentRow = undefined;
      }
      let isSelectSliceOrFlag = false;
      // 设置当前选中的slicetime
      let selectSlice: unknown = undefined;
      sp._slicesList.forEach((slice: { selected: boolean }): void => {
        if (slice.selected) {
          selectSlice = slice;
        }
      });
      if (!!selectSlice) {
        //@ts-ignore
        sp.currentSlicesTime.startTime = selectSlice.startTime;
        //@ts-ignore
        sp.currentSlicesTime.endTime = selectSlice.endTime;
        isSelectSliceOrFlag = true;
      }

      if (sp.selectFlag && sp.selectFlag.selected) {
        sp.currentSlicesTime.startTime = sp.selectFlag?.time;
        sp.currentSlicesTime.endTime = sp.selectFlag?.time;
        isSelectSliceOrFlag = true;
      }
      // 设置当前的slicesTime
      !isSelectSliceOrFlag && sp.setCurrentSlicesTime();
    }
    let keyPressWASD = keyPress === 'w' || keyPress === 'a' || keyPress === 's' || keyPress === 'd';
    if (keyPressWASD) {
      sp.keyPressMap.set(keyPress, true);
      if (sp.rangeSelect.isMouseDown && sp.rangeSelect.drag) {
        sp.rangeSelect.mouseUp();
      }
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

export function spSystemTraceDocumentOnMouseDown(sp: SpSystemTrace, ev: MouseEvent): void {
  if (!sp.loadTraceCompleted || !sp.mouseEventEnable) {
    return;
  }
  if (sp.isWASDKeyPress()) {
    ev.preventDefault();
    ev.stopPropagation();
    return;
  }
  if (ev.button === 0) {
    SpSystemTrace.isMouseLeftDown = true;
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
    if (y > sp.timerShaftEL!.offsetHeight) {
      sp.rangeSelect.mouseDown(ev);
      sp.rangeSelect.drag = true;
      let downRow = sp.visibleRows.find((row) => row.containPoint(ev));
      Utils.currentSelectTrace = downRow?.traceId;
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

function handleTimerShaftActions(ev: MouseEvent, sp: SpSystemTrace): void {
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
}

export function spSystemTraceDocumentOnMouseUp(sp: SpSystemTrace, ev: MouseEvent): void {
  //@ts-ignore
  if ((window as unknown).collectResize) {
    return;
  }
  if (!sp.loadTraceCompleted || !sp.mouseEventEnable) {
    return;
  }
  //@ts-ignore
  if ((window as unknown).isSheetMove) {
    return;
  }
  if (sp.isWASDKeyPress()) {
    ev.preventDefault();
    ev.stopPropagation();
    return;
  }
  SpSystemTrace.isMouseLeftDown = false;
  if (ev.ctrlKey) {
    ev.preventDefault();
    sp.offsetMouse = 0;
    sp.mouseCurrentPosition = 0;
    sp.style.cursor = 'default';
    return;
  }
  TraceRow.isUserInteraction = false;
  sp.rangeSelect.isMouseDown = false;
  if (sp.isMouseInSheet(ev)) {
    return;
  }
  handleTimerShaftActions(ev, sp);
  if (!SportRuler.isMouseInSportRuler) {
    sp.rangeSelect.mouseUp(ev);
  }
  sp.timerShaftEL?.documentOnMouseUp(ev);
}

export function spSystemTraceDocumentOnKeyUp(sp: SpSystemTrace, ev: KeyboardEvent): void {
  if (SpSystemTrace.isAiAsk) {
    return;
  }
  if (sp.times.size > 0) {
    for (let timerId of sp.times) {
      clearTimeout(timerId);
    }
  }
  if (!sp.keyboardEnable) {
    return;
  }
  let recordTraceElement = sp.parentElement?.querySelector('sp-record-trace');
  let menuItemElement = recordTraceElement?.shadowRoot?.querySelector('lit-main-menu-item[icon="file-config"]');
  let flag: boolean = menuItemElement ? menuItemElement.hasAttribute('back') : false;
  if (ev.key.toLocaleLowerCase() === String.fromCharCode(47) && !flag && !SpSystemTrace.isAiAsk) {
    if (SpSystemTrace.keyboardFlar) {
      document
        .querySelector('body > sp-application')!
        .shadowRoot!.querySelector<SpKeyboard>('#sp-keyboard')!.style.visibility = 'visible';
      SpSystemTrace.keyboardFlar = false;
    } else {
      document
        .querySelector('body > sp-application')!
        .shadowRoot!.querySelector<SpKeyboard>('#sp-keyboard')!.style.visibility = 'hidden';
      SpSystemTrace.keyboardFlar = true;
    }
  }
  if (!sp.loadTraceCompleted) {
    return;
  }
  let flagsItem = window.localStorage.getItem(FlagsConfig.FLAGS_CONFIG_KEY);
  let flagsItemJson = JSON.parse(flagsItem!);
  if (flagsItemJson.VSync === 'Enabled') {
    enableVSync(false, ev, () => sp.refreshCanvas(true, 'sp key up'));
  }
  let keyPress = ev.key.toLocaleLowerCase();
  if (keyPress === 'w' || keyPress === 'a' || keyPress === 's' || keyPress === 'd') {
    sp.keyPressMap.set(keyPress, false);
  }
  if (keyPress === 'f' && sp.copyCurrentRow) {
    sp.currentRow = sp.copyCurrentRow;
  }
  TraceRow.isUserInteraction = false;
  sp.observerScrollHeightEnable = false;
  sp.keyboardEnable && sp.timerShaftEL!.documentOnKeyUp(ev);
  if (ev.code === 'Enter' || ev.code === 'NumpadEnter') {
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
    spSystemTraceDocumentOnKeyUpCtrlKey(keyPress, sp, ev);
  }
}

function spSystemTraceDocumentOnKeyUpCtrlKey(keyPress: string, sp: SpSystemTrace, ev: KeyboardEvent): void {
  if (keyPress === 'b') {
    let menuBox = document
      .querySelector('body > sp-application')!
      .shadowRoot?.querySelector('#main-menu') as LitMainMenu;
    let searchBox = document
      .querySelector('body > sp-application')
      ?.shadowRoot?.querySelector('div > div.search-vessel') as HTMLDivElement;
    let appContent = document
      .querySelector('body > sp-application')
      ?.shadowRoot?.querySelector('div > #app-content') as HTMLDivElement;
    let rowPane = appContent
      ?.querySelector('#sp-system-trace')
      ?.shadowRoot?.querySelector('div > div.rows-pane') as HTMLDivElement;
    let timerShaft = appContent
      ?.querySelector('#sp-system-trace')
      ?.shadowRoot?.querySelector('div > timer-shaft-element') as HTMLDivElement;
    let spChartList = appContent
      ?.querySelector('#sp-system-trace')
      ?.shadowRoot?.querySelector('div > sp-chart-list') as HTMLDivElement;
    let canvasEle = spChartList.shadowRoot?.querySelector('canvas') as unknown as HTMLDivElement;
    let sidebarButton = searchBox!.querySelector('div > div.sidebar-button') as HTMLDivElement;
    let importConfigDiv = searchBox!.querySelector('div > #import-key-path') as HTMLDivElement;
    if (menuBox.style.zIndex! === '2000' || searchBox!.style.display !== 'none') {
      SpSystemTrace.isHiddenMenu = true;
      menuBox.style.width = '0px';
      menuBox.style.display = 'flex';
      menuBox.style.zIndex = '0';
      sidebarButton.style.width = '48px';
      importConfigDiv!.style.left = '45px';
      searchBox!.style.display = 'none';
      rowPane.style.maxHeight = '100%';
    } else {
      SpSystemTrace.isHiddenMenu = false;
      menuBox.style.width = '248px';
      menuBox.style.zIndex = '2000';
      menuBox.style.display = 'flex';
      sidebarButton.style.width = '0px';
      importConfigDiv!.style.left = '5px';
      searchBox!.style.display = '';
      rowPane.style.maxHeight = '100%';
    }
  }
  if (keyPress === '[' && sp._slicesList.length > 1) {
    sp.selectFlag = undefined;
    sp.MarkJump(sp._slicesList, 'slice', 'previous', ev);
  } else if (keyPress === ',' && sp._flagList.length > 1) {
    sp.MarkJump(sp._flagList, 'flag', 'previous', ev);
  } else if (keyPress === ']' && sp._slicesList.length > 1) {
    sp.selectFlag = undefined;
    sp.MarkJump(sp._slicesList, 'slice', 'next', ev);
  } else if (keyPress === '.' && sp._flagList.length > 1) {
    sp.MarkJump(sp._flagList, 'flag', 'next', ev);
  } else {
    return;
  }
}

function handleClickActions(sp: SpSystemTrace, x: number, y: number, ev: MouseEvent): void {
  if (
    !(
      sp.timerShaftEL!.sportRuler!.frame.contains(x, y) &&
      x > (TraceRow.rangeSelectObject?.startX || 0) &&
      x < (TraceRow.rangeSelectObject?.endX || 0)
    )
  ) {
    const transformYMatch = sp.canvasPanel?.style.transform.match(/\((\d+)[^\)]+\)/);
    const transformY = transformYMatch![1];
    let inFavoriteArea = sp.favoriteChartListEL?.containPoint(ev);
    let favoriteHeight = sp.favoriteChartListEL!.getBoundingClientRect().height;
    let rows = sp.visibleRows.filter((it) =>
      it.focusContain(ev, inFavoriteArea!, Number(transformY), favoriteHeight) && it.collect === inFavoriteArea);
    if (JankStruct.delJankLineFlag) {
      sp.removeLinkLinesByBusinessType('janks');
    }
    let strict = true;
    let offset = false;
    if (
      rows[0] &&
      (rows[0].rowType === TraceRow.ROW_TYPE_FRAME_DYNAMIC || rows[0].rowType === TraceRow.ROW_TYPE_FRAME_SPACING)
    ) {
      strict = false;
      offset = true;
    }
    let skip = false;
    if (
      rows[0].rowType === TraceRow.ROW_TYPE_XPOWER_WIFI_BYTES ||
      rows[0].rowType === TraceRow.ROW_TYPE_XPOWER_WIFI_PACKETS ||
      rows[0].rowType === TraceRow.ROW_TYPE_XPOWER_APP_DETAIL_DISPLAY ||
      rows[0].rowType === TraceRow.ROW_TYPE_XPOWER_STATISTIC
    ) {
      skip = true;
    }
    if (rows && rows[0] && (rows[0].getHoverStruct(strict, offset) ||
      (rows[0].rowType === TraceRow.ROW_TYPE_GPU_COUNTER && rows[0].getHoverStruct(false) || skip))
      ) {
      sp.onClickHandler(rows[0]!.rowType!, rows[0], rows[0].getHoverStruct(strict, offset));
      sp.documentOnMouseMove(ev);
    } else {
      sp.clickEmptyArea();
    }
  }
}

export function spSystemTraceDocumentOnClick(sp: SpSystemTrace, ev: MouseEvent): void {
  if (!sp.loadTraceCompleted) {
    return;
  }
  if (sp.isWASDKeyPress()) {
    sp.hoverFlag = null;
    ev.preventDefault();
    ev.stopPropagation();
    return;
  }
  //@ts-ignore
  if ((window as unknown).isSheetMove) {
    return;
  }
  if (sp.isMouseInSheet(ev)) {
    return;
  }
  //@ts-ignore
  if ((window as unknown).isPackUpTable) {
    //@ts-ignore
    (window as unknown).isPackUpTable = false;
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
  handleClickActions(sp, x, y, ev);
  ev.preventDefault();
}

export function spSystemTraceDocumentOnKeyDown(sp: SpSystemTrace, ev: KeyboardEvent): void {
  document.removeEventListener('keyup', sp.documentOnKeyUp);
  sp.debounce(sp.continueSearch, 250, ev)();
  document.addEventListener('keyup', sp.documentOnKeyUp);
}
