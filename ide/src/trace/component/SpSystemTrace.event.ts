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

import {SpSystemTrace} from "./SpSystemTrace";
import {ThreadStruct, ThreadStructOnClick} from "../database/ui-worker/ProcedureWorkerThread";
import {TraceRow} from "./trace/base/TraceRow";
import {JankStruct, JankStructOnClick} from "../database/ui-worker/ProcedureWorkerJank";
import {HeapSnapshotStruct, HeapSnapshotStructOnClick} from "../database/ui-worker/ProcedureWorkerHeapSnapshot";
import {FuncStructOnClick} from "../database/ui-worker/ProcedureWorkerFunc";
import {CpuFreqStructOnClick} from "../database/ui-worker/ProcedureWorkerFreq";
import {ClockStructOnClick} from "../database/ui-worker/ProcedureWorkerClock";
import {SnapshotStructOnClick} from "../database/ui-worker/ProcedureWorkerSnapshot";
import {IrqStructOnClick} from "../database/ui-worker/ProcedureWorkerIrq";
import {HeapStructOnClick} from "../database/ui-worker/ProcedureWorkerHeap";
import {JsCpuProfilerStructOnClick} from "../database/ui-worker/ProcedureWorkerCpuProfiler";
import {AppStartupStructOnClick} from "../database/ui-worker/ProcedureWorkerAppStartup";
import {SoStructOnClick} from "../database/ui-worker/ProcedureWorkerSoInit";
import {FrameAnimationStructOnClick} from "../database/ui-worker/ProcedureWorkerFrameAnimation";
import {FrameDynamicStructOnClick} from "../database/ui-worker/ProcedureWorkerFrameDynamic";
import {FrameSpacingStructOnClick} from "../database/ui-worker/ProcedureWorkerFrameSpacing";
import {SportRuler} from "./trace/timer-shaft/SportRuler";
import {SpStatisticsHttpUtil} from "../../statistics/util/SpStatisticsHttpUtil";
import {LitSearch} from "./trace/search/Search";
import {TabPaneCurrent} from "./trace/sheet/TabPaneCurrent";
import type {SpKeyboard} from "./SpKeyboard";
import {enableVSync} from "./chart/VSync";
import {CpuStruct, CpuStructOnClick} from "../database/ui-worker/cpu/ProcedureWorkerCPU";
import {CpuStateStructOnClick} from "../database/ui-worker/cpu/ProcedureWorkerCpuState";
import {CpuFreqLimitsStructOnClick} from "../database/ui-worker/cpu/ProcedureWorkerCpuFreqLimits";

function timeoutJudge(sp: SpSystemTrace) {
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
  return timeoutJudge;
}

function threadClickHandlerFunc(sp: SpSystemTrace) {
  let threadClickHandler = (d: ThreadStruct) => {
    sp.observerScrollHeightEnable = false;
    sp.scrollToProcess(`${d.cpu}`, '', 'cpu-data', true);
    let cpuRow = sp.queryAllTraceRow<TraceRow<CpuStruct>>(
      `trace-row[row-id='${d.cpu}'][row-type='cpu-data']`,
      (row) => row.rowId === `${d.cpu}` && row.rowType === 'cpu-data'
    )[0];
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
    sp.hoverStructNull().selectStructNull().wakeupListNull();
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
      cpuClickHandlerFunc(sp)
    );
  };
  return threadClickHandler;
}

function scrollToFuncHandlerFunc(sp: SpSystemTrace) {
  return function (funcStruct: any) {
    sp.observerScrollHeightEnable = true;
    sp.moveRangeToCenter(funcStruct.startTs!, funcStruct.dur!);
    sp.scrollToActFunc(funcStruct, false);
  };
}

function jankClickHandlerFunc(sp: SpSystemTrace) {
  let jankClickHandler = (d: any) => {
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
    if (jankRow) {
      JankStruct.selectJankStructList.length = 0;
      let findJankEntry = jankRow!.dataListCache!.find((dat: any) => dat.name == d.name && dat.pid == d.pid);
      if (findJankEntry) {
        if (findJankEntry!.ts! + findJankEntry!.dur! < TraceRow.range!.startNS ||
          findJankEntry!.ts! > TraceRow.range!.endNS) {
          sp.timerShaftEL?.setRangeNS(
            findJankEntry!.ts! - findJankEntry!.dur! * 2,
            findJankEntry!.ts! + findJankEntry!.dur! + findJankEntry!.dur! * 2
          );
        }
        sp.hoverStructNull().selectStructNull().wakeupListNull();
        JankStruct.hoverJankStruct = findJankEntry;
        JankStruct.selectJankStruct = findJankEntry;
        sp.timerShaftEL?.drawTriangle(findJankEntry!.ts || 0, 'inverted');
        sp.traceSheetEL?.displayJankData(JankStruct.selectJankStruct!, (datas) => {
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
  return jankClickHandler;
}

function snapshotClickHandlerFunc(sp: SpSystemTrace) {
  let snapshotClickHandler = (d: HeapSnapshotStruct) => {
    sp.observerScrollHeightEnable = true;
    let snapshotRow = sp.shadowRoot?.querySelector<TraceRow<HeapSnapshotStruct>>(
      `trace-row[row-id='heapsnapshot']`
    );
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
  return snapshotClickHandler;
}

function cpuClickHandlerTask(threadRow: TraceRow<any>, sp: SpSystemTrace, d: CpuStruct) {
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
    sp.hoverStructNull().selectStructNull().wakeupListNull();
    ThreadStruct.hoverThreadStruct = findEntry;
    ThreadStruct.selectThreadStruct = findEntry;
    sp.timerShaftEL?.drawTriangle(findEntry!.startTime || 0, 'inverted');
    sp.traceSheetEL?.displayThreadData(
      ThreadStruct.selectThreadStruct!,
      threadClickHandlerFunc(sp),
      cpuClickHandlerFunc(sp),
      (datas) => sp.removeLinkLinesByBusinessType('thread')
    );
    sp.scrollToProcess(`${d.tid}`, `${d.processId}`, 'thread', true);
  }
}

function cpuClickHandlerFunc(sp: SpSystemTrace) {
  return function (d: CpuStruct) {
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
        threadRow!.onComplete = () => cpuClickHandlerTask(threadRow, sp, d);
      }
    }
  };
}

function AllStructOnClick(clickRowType:string,sp:SpSystemTrace,row?:TraceRow<any>) {
  CpuStructOnClick(clickRowType, sp, cpuClickHandlerFunc(sp))
    .then(() => ThreadStructOnClick(clickRowType, sp, threadClickHandlerFunc(sp), cpuClickHandlerFunc(sp)))
    .then(() => FuncStructOnClick(clickRowType, sp, row, scrollToFuncHandlerFunc(sp)))
    .then(() => CpuFreqStructOnClick(clickRowType, sp))
    .then(() => CpuStateStructOnClick(clickRowType, sp))
    .then(() => CpuFreqLimitsStructOnClick(clickRowType, sp))
    .then(() => ClockStructOnClick(clickRowType, sp))
    .then(() => SnapshotStructOnClick(clickRowType, sp))
    .then(() => IrqStructOnClick(clickRowType, sp))
    .then(() => HeapStructOnClick(clickRowType, sp, row))
    .then(() => JankStructOnClick(clickRowType, sp, jankClickHandlerFunc(sp)))
    .then(() => HeapSnapshotStructOnClick(clickRowType, sp, snapshotClickHandlerFunc(sp)))
    .then(() => JsCpuProfilerStructOnClick(clickRowType, sp))
    .then(() => AppStartupStructOnClick(clickRowType, sp, scrollToFuncHandlerFunc(sp)))
    .then(() => SoStructOnClick(clickRowType, sp, scrollToFuncHandlerFunc(sp)))
    .then(() => FrameAnimationStructOnClick(clickRowType, sp))
    .then(() => FrameDynamicStructOnClick(clickRowType, sp, row))
    .then(() => FrameSpacingStructOnClick(clickRowType, sp))
    .then(() => {
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
    }).catch(e => {});
}
export default function spSystemTraceOnClickHandler(sp: SpSystemTrace, clickRowType: string, row?: TraceRow<any>) {
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
  timeoutJudge(sp);
  AllStructOnClick(clickRowType,sp,row);
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

function handleActions(sp: SpSystemTrace, rows: Array<TraceRow<any>>, ev: MouseEvent) {
  sp.rangeSelect.mouseMove(rows, ev);
  if (sp.rangeSelect.rangeTraceRow!.length > 0) {
    sp.tabCpuFreq!.rangeTraceRow = sp.rangeSelect.rangeTraceRow;
    sp.tabCpuState!.rangeTraceRow = sp.rangeSelect.rangeTraceRow;
  }
  let search = document.querySelector('body > sp-application')!.shadowRoot!.querySelector<LitSearch>('#lit-search');
  if (sp.rangeSelect.isMouseDown && search?.isClearValue) {
    SpSystemTraceDocumentOnMouseMoveMouseDown(sp, search);
  } else {
    SpSystemTraceDocumentOnMouseMoveMouseUp(sp, rows, ev);
  }
}

function handleMouseInTimeShaft(sp: SpSystemTrace, ev: MouseEvent) {
  let isMouseInTimeShaft = sp.timerShaftEL?.containPoint(ev);
  if (isMouseInTimeShaft) {
    sp.tipEL!.style.display = 'none';
    sp.hoverStructNull();
  }
  return isMouseInTimeShaft;
}

export function spSystemTraceDocumentOnMouseMove(sp: SpSystemTrace, ev: MouseEvent) {
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
  let isMouseInTimeShaft = handleMouseInTimeShaft(sp, ev);
  let rows = sp.visibleRows;
  if (sp.timerShaftEL?.isScaling()) {
    return;
  }
  sp.timerShaftEL?.documentOnMouseMove(ev, sp);
  if (isMouseInTimeShaft) {
    return;
  }
  handleActions(sp, rows, ev);
}

function SpSystemTraceDocumentOnMouseMoveMouseDown(sp: SpSystemTrace, search: LitSearch) {
  sp.refreshCanvas(true);
  if (TraceRow.rangeSelectObject) {
    if (search && search.searchValue !== '') {
      search.clear();
      search.valueChangeHandler?.('');
    }
  }
}

function SpSystemTraceDocumentOnMouseMoveMouseUp(sp: SpSystemTrace, rows: Array<TraceRow<any>>, ev: MouseEvent) {
  if (!sp.rowsPaneEL!.containPoint(ev, {left: 248})) {
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

export function spSystemTraceDocumentOnMouseOut(sp: SpSystemTrace, ev: MouseEvent) {
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

export function spSystemTraceDocumentOnMouseDown(sp: SpSystemTrace, ev: MouseEvent) {
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

function handleTimerShaftActions(ev: MouseEvent, sp: SpSystemTrace) {
  if (ev.offsetX > sp.timerShaftEL!.canvas!.offsetLeft) {
    let x = ev.offsetX - sp.timerShaftEL!.canvas!.offsetLeft;
    let y = ev.offsetY;
    if (sp.timerShaftEL!.sportRuler!.frame.contains(x, y) &&
      x > (TraceRow.rangeSelectObject?.startX || 0) &&
      x < (TraceRow.rangeSelectObject?.endX || 0)) {
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

export function spSystemTraceDocumentOnMouseUp(sp: SpSystemTrace, ev: MouseEvent) {
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
  handleTimerShaftActions(ev, sp);
  if (!SportRuler.isMouseInSportRuler) {
    sp.rangeSelect.mouseUp(ev);
  }
  sp.timerShaftEL?.documentOnMouseUp(ev);
}

export function spSystemTraceDocumentOnKeyUp(sp: SpSystemTrace, ev: KeyboardEvent) {
  if (sp.times.size > 0) {
    for (let timerId of sp.times) {
      clearTimeout(timerId);
    }
  }
  if (ev.key.toLocaleLowerCase() === '?') {
    document.querySelector('body > sp-application')!
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
    spSystemTraceDocumentOnKeyUpCtrlKey(keyPress, sp);
  }
}

function spSystemTraceDocumentOnKeyUpCtrlKey(keyPress: string, sp: SpSystemTrace) {
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

function handleClickActions(sp: SpSystemTrace, x: number, y: number, ev: MouseEvent) {
  if (
    !(sp.timerShaftEL!.sportRuler!.frame.contains(x, y) &&
      x > (TraceRow.rangeSelectObject?.startX || 0) &&
      x < (TraceRow.rangeSelectObject?.endX || 0))
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
}

export function spSystemTraceDocumentOnClick(sp: SpSystemTrace, ev: MouseEvent) {
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
  handleClickActions(sp, x, y, ev);
  ev.preventDefault();
}

export function spSystemTraceDocumentOnKeyDown(sp: SpSystemTrace, ev: KeyboardEvent) {
  document.removeEventListener('keyup', sp.documentOnKeyUp);
  sp.debounce(sp.continueSearch, 250, ev)();
  document.addEventListener('keyup', sp.documentOnKeyUp);
}
