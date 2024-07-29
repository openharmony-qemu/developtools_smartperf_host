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
 * WITHOUT WARRANTIES OR CONDITIONS OF unknown KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { SpSystemTrace } from './SpSystemTrace';
import { TabPaneFrequencySample } from './trace/sheet/cpu/TabPaneFrequencySample';
import { TabPaneCounterSample } from './trace/sheet/cpu/TabPaneCounterSample';
import { RangeSelect } from './trace/base/RangeSelect';
import { TraceRow } from './trace/base/TraceRow';
import { SportRuler } from './trace/timer-shaft/SportRuler';
import { SelectionParam } from '../bean/BoxSelection';
import { error, info } from '../../log/Log';
import { SpStatisticsHttpUtil } from '../../statistics/util/SpStatisticsHttpUtil';
import { queryEbpfSamplesCount } from '../database/sql/Memory.sql';
import { SpChartManager } from './chart/SpChartManager';
import { ThreadStruct } from '../database/ui-worker/ProcedureWorkerThread';
import { FlagsConfig } from './SpFlags';
import { threadPool, threadPool2 } from '../database/SqlLite';
import { JankStruct } from '../database/ui-worker/ProcedureWorkerJank';
import { CpuStruct } from '../database/ui-worker/cpu/ProcedureWorkerCPU';
import { PairPoint } from '../database/ui-worker/ProcedureWorkerCommon';
import { TraceSheet } from './trace/base/TraceSheet';
import { TimerShaftElement } from './trace/TimerShaftElement';
import { SpChartList } from './trace/SpChartList';
type HTMLElementAlias = HTMLElement | null | undefined;
import { Utils } from './trace/base/Utils';

function rightButtonOnClick(sp: SpSystemTrace, rightStar: HTMLElementAlias): unknown {
  Object.assign(sp, {
    ext(): string {
      return 'Handle the right button click event';
    },
  });

  return function (event: unknown): void {
    if (SpSystemTrace.btnTimer) {
      return;
    }
    // 唤醒树有值则不再重复添加
    const startIndex = CpuStruct.selectCpuStruct!.displayProcess?.indexOf('[');
    if (SpSystemTrace.wakeupList.length === 0) {
      SpSystemTrace.wakeupList.unshift(CpuStruct.wakeupBean!);
      sp.queryCPUWakeUpList(CpuStruct.wakeupBean!);
      CpuStruct.selectCpuStruct!.ts = CpuStruct.selectCpuStruct!.startTime;
      CpuStruct.selectCpuStruct!.thread = CpuStruct.selectCpuStruct!.name;
      CpuStruct.selectCpuStruct!.pid = CpuStruct.selectCpuStruct!.processId;
      CpuStruct.selectCpuStruct!.process = CpuStruct.selectCpuStruct!.displayProcess?.substring(0, startIndex).trim();
      CpuStruct.selectCpuStruct!.itid = CpuStruct.wakeupBean!.itid;
      sessionStorage.setItem('saveselectcpustruct', JSON.stringify(CpuStruct.selectCpuStruct));
    } else {
      sp.wakeupListNull();
      SpSystemTrace.wakeupList.unshift(CpuStruct.wakeupBean!);
      sp.queryCPUWakeUpList(CpuStruct.wakeupBean!);
      CpuStruct.selectCpuStruct!.ts = CpuStruct.selectCpuStruct!.startTime;
      CpuStruct.selectCpuStruct!.thread = CpuStruct.selectCpuStruct!.name;
      CpuStruct.selectCpuStruct!.pid = CpuStruct.selectCpuStruct!.processId;
      CpuStruct.selectCpuStruct!.process = CpuStruct.selectCpuStruct!.displayProcess?.substring(0, startIndex).trim();
      CpuStruct.selectCpuStruct!.itid = CpuStruct.wakeupBean!.itid;
      sessionStorage.setItem('saveselectcpustruct', JSON.stringify(CpuStruct.selectCpuStruct));
    }
    setTimeout(() => {
      requestAnimationFrame(() => sp.refreshCanvas(false));
    }, 300);
    rightStar!.style.visibility = 'visible';
    rightStar!.style.cursor = 'pointer';
    SpSystemTrace.btnTimer = setTimeout((): void => {
      SpSystemTrace.btnTimer = null; // 2.清空节流阀，方便下次开启定时器
    }, 2000);
  };
}
function rightStarOnClick(sp: SpSystemTrace) {
  return function (ev: unknown): void {
    let wakeupLists = [];
    wakeupLists.push(CpuStruct.selectCpuStruct?.cpu);
    for (let wakeupBean of SpSystemTrace.wakeupList) {
      wakeupLists.push(wakeupBean.cpu);
    }
    let wakeupCpuLists = Array.from(new Set(wakeupLists)).sort();
    for (let wakeupCpu of wakeupCpuLists) {
      // @ts-ignore
      let cpuFavoriteRow: unknown = sp.shadowRoot?.querySelector<TraceRow<unknown>>(
        `trace-row[row-type='cpu-data'][row-id='${Utils.getDistributedRowId(wakeupCpu)}']`
      );
      if (cpuFavoriteRow === null || cpuFavoriteRow === undefined) {
        continue;
      }
      // @ts-ignore
      cpuFavoriteRow!.setAttribute('collect-type', '');
      let replaceRow = document.createElement('div');
      // @ts-ignore
      replaceRow.setAttribute('row-id', `${cpuFavoriteRow.rowId}-${cpuFavoriteRow.rowType}`);
      replaceRow.setAttribute('type', 'replaceRow');
      // @ts-ignore
      replaceRow.setAttribute('row-parent-id', cpuFavoriteRow.rowParentId);
      replaceRow.style.display = 'none';
      // @ts-ignore
      cpuFavoriteRow.rowHidden = !cpuFavoriteRow.hasAttribute('scene');
      // @ts-ignore
      if (sp.rowsEL!.contains(cpuFavoriteRow)) {
        // @ts-ignore
        sp.rowsEL!.replaceChild(replaceRow, cpuFavoriteRow);
      }
      // @ts-ignore
      cpuFavoriteRow.tampName = cpuFavoriteRow.name;
      // @ts-ignore
      sp.favoriteChartListEL!.insertRow(cpuFavoriteRow, cpuFavoriteRow.traceId || sp.currentCollectGroup, true);
      // @ts-ignore
      sp.collectRows.push(cpuFavoriteRow);
      sp.timerShaftEL?.displayCollect(sp.collectRows.length !== 0);
      sp.currentClickRow = null;
      // @ts-ignore
      cpuFavoriteRow.setAttribute('draggable', 'true');
      // @ts-ignore
      cpuFavoriteRow.addEventListener('dragstart', cpuFavoriteRowDragStart(sp, cpuFavoriteRow));
      // @ts-ignore
      cpuFavoriteRow.addEventListener('dragover', cpuFavoriteRowDragOver(sp));
      // @ts-ignore
      cpuFavoriteRow.addEventListener('drop', cpuFavoriteRowDropHandler(sp, cpuFavoriteRow));
      // @ts-ignore
      cpuFavoriteRow.addEventListener('dragend', cpuFavoriteRowDragendHandler(sp));
    }
    sp.refreshFavoriteCanvas();
    sp.refreshCanvas(true);
  };
}
function cpuFavoriteRowDragStart(sp: SpSystemTrace, cpuFavoriteRow: unknown) {
  return function (): void {
    // @ts-ignore
    sp.currentClickRow = cpuFavoriteRow;
  };
}
function cpuFavoriteRowDragOver(sp: SpSystemTrace) {
  return function (ev: unknown): void {
    // @ts-ignore
    ev.preventDefault();
    // @ts-ignore
    ev.dataTransfer.dropEffect = 'move';
  };
}
function cpuFavoriteRowDropHandler(sp: SpSystemTrace, cpuFavoriteRow: unknown) {
  return function (ev: unknown): void {
    if (sp.favoriteChartListEL && sp.currentClickRow && sp.currentClickRow !== cpuFavoriteRow) {
      // @ts-ignore
      let rect = cpuFavoriteRow.getBoundingClientRect();
      // @ts-ignore
      if (ev.clientY >= rect.top && ev.clientY < rect.top + rect.height / 2) {
        //向上移动
        // @ts-ignore
        sp.favoriteChartListEL.insertRowBefore(sp.currentClickRow, cpuFavoriteRow);
        // @ts-ignore
      } else if (ev.clientY <= rect.bottom && ev.clientY > rect.top + rect.height / 2) {
        //向下移动
        // @ts-ignore
        sp.favoriteChartListEL.insertRowBefore(sp.currentClickRow, cpuFavoriteRow.nextSibling);
      }
      sp.refreshFavoriteCanvas();
    }
  };
}
function cpuFavoriteRowDragendHandler(sp: SpSystemTrace): () => void {
  return function (): void {
    sp.linkNodes.forEach((itln) => {
      if (itln[0].rowEL.collect) {
        itln[0].rowEL.translateY = itln[0].rowEL.getBoundingClientRect().top - 195;
      } else {
        itln[0].rowEL.translateY = itln[0].rowEL.offsetTop - sp.rowsPaneEL!.scrollTop;
      }
      if (itln[1].rowEL.collect) {
        itln[1].rowEL.translateY = itln[1].rowEL.getBoundingClientRect().top - 195;
      } else {
        itln[1].rowEL.translateY = itln[1].rowEL.offsetTop - sp.rowsPaneEL!.scrollTop;
      }
      itln[0].y = itln[0].rowEL.translateY + itln[0].offsetY;
      itln[1].y = itln[1].rowEL.translateY + itln[1].offsetY;
    });
    sp.currentClickRow = null;
  };
}
function triangleFlagHandler(sp: SpSystemTrace): (event: unknown) => void {
  return function (event: unknown): void {
    //@ts-ignore
    let temporaryTime = sp.timerShaftEL?.drawTriangle(event.detail.time, event.detail.type);
    //@ts-ignore
    if (event.detail.timeCallback && temporaryTime) {
      //@ts-ignore
      event.detail.timeCallback(temporaryTime);
    }
  };
}
function numberCalibrationHandler(sp: SpSystemTrace): (event: unknown) => void {
  return function (event: unknown): void {
    // @ts-ignore
    sp.timerShaftEL!.sportRuler!.times = event.detail.time;
    // @ts-ignore
    sp.timerShaftEL!.sportRuler!.counts = event.detail.counts;
    // @ts-ignore
    sp.timerShaftEL!.sportRuler!.durations = event.detail.durations;
    sp.timerShaftEL!.sportRuler?.draw();
  };
}
function flagChangeHandler(sp: SpSystemTrace): (event: unknown) => void {
  return function (event: unknown): void {
    // @ts-ignore
    sp.timerShaftEL?.modifyFlagList(event.detail);
    // @ts-ignore
    if (event.detail.hidden) {
      //@ts-ignore
      sp.selectFlag = undefined;
      if (sp._flagList.length <= 0) {
        let showTab = sp.getShowTab();
        showTab = showTab.filter((it) => it !== 'box-flag');
        if (TraceRow.rangeSelectObject && showTab.length > 0) {
          sp.traceSheetEL?.displayTab(...showTab);
        } else {
          sp.traceSheetEL?.setMode('hidden');
        }
      }
      sp.refreshCanvas(true);
    }
  };
}
function slicesChangeHandler(sp: SpSystemTrace): (event: unknown) => void {
  return function (event: unknown): void {
    // @ts-ignore
    sp.timerShaftEL?.modifySlicesList(event.detail);
    // @ts-ignore
    if (event.detail.hidden) {
      sp.slicestime = null;
      if (sp._slicesList.length <= 0) {
        let showTab = sp.getShowTab();
        showTab = showTab.filter((it) => it !== 'tabpane-current');
        if (TraceRow.rangeSelectObject && showTab.length > 0) {
          sp.traceSheetEL?.displayTab(...showTab);
        } else {
          sp.traceSheetEL?.setMode('hidden');
        }
      }
      sp.refreshCanvas(true);
    }
  };
}
function collectHandler(sp: SpSystemTrace): (event: unknown) => void {
  return function (event: unknown): void {
    // @ts-ignore
    let currentRow = event.detail.row;
    if (currentRow.collect) {
      collectHandlerYes(sp, currentRow, event);
    } else {
      collectHandlerNo(sp, currentRow, event);
    }
    sp.timerShaftEL?.displayCollect(sp.collectRows.length !== 0);
    sp.refreshFavoriteCanvas();
    sp.refreshCanvas(true);
    sp.linkNodes.forEach((itln) => {
      if (itln[0].rowEL === currentRow) {
        if (itln[0].rowEL.collect) {
          itln[0].rowEL.translateY = itln[0].rowEL.getBoundingClientRect().top - 195;
        } else {
          itln[0].rowEL.translateY = itln[0].rowEL.offsetTop - sp.rowsPaneEL!.scrollTop;
        }
        itln[0].y = itln[0].rowEL.translateY + itln[0].offsetY;
      } else if (itln[1].rowEL === currentRow) {
        if (itln[1].rowEL.collect) {
          itln[1].rowEL.translateY = itln[1].rowEL.getBoundingClientRect().top - 195;
        } else {
          itln[1].rowEL.translateY = itln[1].rowEL.offsetTop - sp.rowsPaneEL!.scrollTop;
        }
        itln[1].y = itln[1].rowEL.translateY + itln[1].offsetY;
      }
    });
    // 收藏夹元素拖动排序功能
    sp.currentClickRow = null;
    currentRow.setAttribute('draggable', 'true');
    currentRow.addEventListener('dragstart', () => {
      sp.currentClickRow = currentRow;
    });
    currentRow.addEventListener('dragover', (ev: unknown) => {
      // @ts-ignore
      ev.preventDefault();
      // @ts-ignore
      ev.dataTransfer.dropEffect = 'move';
    });
    currentRow.addEventListener('drop', collectHandlerDrop(sp, currentRow));
    currentRow.addEventListener('dragend', collectHandlerDragEnd(sp));
  };
}
function collectHandlerNo(sp: SpSystemTrace, currentRow: unknown, event: unknown): void {
  // @ts-ignore
  sp.favoriteChartListEL?.deleteRow(currentRow, event.detail.type !== 'auto-collect');
  // @ts-ignore
  if (event.detail.type !== 'auto-collect') {
    // @ts-ignore
    let rowIndex = sp.collectRows.indexOf(currentRow);
    if (rowIndex !== -1) {
      sp.collectRows.splice(rowIndex, 1);
    }
  }
  let row = currentRow;
  let allowExpansionRow = [];
  // @ts-ignore
  while (row.hasParentRowEl) {
    // @ts-ignore
    let parent = row.parentRowEl;
    allowExpansionRow.push(parent);
    row = parent;
  }
  if (allowExpansionRow.length === 1) {
    for (let index: number = allowExpansionRow.length - 1; index >= 0; index--) {
      if (allowExpansionRow[index]?.hasAttribute('scene')) {
        if (allowExpansionRow[index]!.expansion) {
          allowExpansionRow[index].updateChildRowStatus();
        } else {
          allowExpansionRow[index].expansion = true;
        }
      }
    }
  } else {
    for (let index: number = allowExpansionRow.length - 1; index >= 0; index--) {
      let currentItemRow = allowExpansionRow[index];
      if (currentItemRow.hasAttribute('scene')) {
        if (currentItemRow.rowParentId !== '') {
          if (currentItemRow.expansion) {
            currentItemRow.updateChildRowStatus();
          } else {
            currentItemRow.expansion = true;
          }
        }
        else {
          currentItemRow.expansion = true;
          let number = currentItemRow.childrenList.indexOf(currentRow);
          if (number !== -1) {// 确保 currentRow 在 childrenList 中
            let childrenEl = currentItemRow.childrenList[number];
            let childrenNextEl = currentItemRow.childrenList[number + 1];
            if (childrenEl) {
              if (childrenNextEl) {
                currentItemRow.parentNode.insertBefore(childrenEl, currentItemRow.childrenList[number + 1]);
              } else if (childrenEl.nextSibling) {
                currentItemRow.parentNode.insertBefore(childrenEl, childrenEl.nextSibling);
              } else {
                currentItemRow.parentNode.appendChild(childrenEl);
              }
            }
          }
        }
      }
    }
  }
  allowExpansionRow.length = 0;
  // @ts-ignore
  let traceId = currentRow.traceId ? `${currentRow.traceId}-` : '';
  let replaceRow = sp.rowsEL!.querySelector<HTMLCanvasElement>(
    // @ts-ignore
    `div[row-id='${traceId}${currentRow.rowId}-${currentRow.rowType}']`
  );
  // 取消收藏时，删除父亲ID
  // @ts-ignore
  currentRow.name = currentRow.tampName;
  if (replaceRow !== null) {
    // @ts-ignore
    sp.rowsEL!.replaceChild(currentRow, replaceRow);
    // @ts-ignore
    currentRow.style.boxShadow = '0 10px 10px #00000000';
  }
}
function collectHandlerYes(sp: SpSystemTrace, currentRow: unknown, event: unknown): void {
  if (!sp.collectRows.find((find) => find === currentRow)) {
    // @ts-ignore
    sp.collectRows.push(currentRow);
  }
  let replaceRow = document.createElement('div');
  // @ts-ignore
  let traceId = currentRow.traceId ? `${currentRow.traceId}-` : '';
  // @ts-ignore
  replaceRow.setAttribute('row-id', `${traceId}${currentRow.rowId}-${currentRow.rowType}`);
  replaceRow.setAttribute('type', 'replaceRow');
  // @ts-ignore
  replaceRow.setAttribute('row-parent-id', currentRow.rowParentId);
  replaceRow.style.display = 'none';
  // @ts-ignore
  if (!currentRow.hasAttribute('scene')) {
    // @ts-ignore
    currentRow.setAttribute('row-hidden', '');
  } else {
    // @ts-ignore
    currentRow.removeAttribute('row-hidden');
  }
  // 添加收藏时，在线程名前面追加父亲ID
  // @ts-ignore
  let rowParentId = currentRow.rowParentId;
  // @ts-ignore
  currentRow.tampName = currentRow.name;
  if (rowParentId) {
    // @ts-ignore
    let parentRows = sp.shadowRoot?.querySelectorAll<TraceRow<unknown>>(`trace-row[row-id='${rowParentId}']`);
    parentRows?.forEach((parentRow) => {
      if (
        parentRow?.name &&
        // @ts-ignore
        parentRow?.name !== currentRow.name &&
        !parentRow.rowType!.startsWith('cpu') &&
        !parentRow.rowType!.startsWith('thread') &&
        !parentRow.rowType!.startsWith('func') &&
        // @ts-ignore
        !currentRow.name.includes(parentRow.name)
      ) {
        // @ts-ignore
        currentRow.name += `(${parentRow.name})`;
      }
    });
  }
  // @ts-ignore
  if (!currentRow.hasParentRowEl) {
    // @ts-ignore
    sp.rowsEL!.replaceChild(replaceRow, currentRow);
  }
  // @ts-ignore
  let group = currentRow.traceId || sp.currentCollectGroup;
  // @ts-ignore
  sp.favoriteChartListEL?.insertRow(currentRow, group, event.detail.type !== 'auto-collect');
}
function collectHandlerDrop(sp: SpSystemTrace, currentRow: HTMLDivElement | undefined | null): (ev: unknown) => void {
  return function (ev: unknown) {
    if (sp.favoriteChartListEL !== null && sp.currentClickRow !== null && sp.currentClickRow !== currentRow) {
      // @ts-ignore
      let rect = currentRow!.getBoundingClientRect();
      // @ts-ignore
      if (ev.clientY >= rect.top && ev.clientY < rect.top + rect.height / 2) {
        //向上移动
        sp.favoriteChartListEL!.insertRowBefore(sp.currentClickRow!, currentRow!);
        // @ts-ignore
      } else if (ev.clientY <= rect.bottom && ev.clientY > rect.top + rect.height / 2) {
        //向下移动
        sp.favoriteChartListEL!.insertRowBefore(sp.currentClickRow!, currentRow!.nextSibling!);
      }
      sp.refreshFavoriteCanvas();
    }
  };
}
function collectHandlerDragEnd(sp: SpSystemTrace): (ev: unknown) => void {
  return function (ev: unknown): void {
    sp.linkNodes.forEach((itln) => {
      if (itln[0].rowEL.collect) {
        if (sp.timerShaftEL?._checkExpand) {
          itln[0].rowEL.translateY =
            itln[0].rowEL.getBoundingClientRect().top - 195 + sp.timerShaftEL._usageFoldHeight!;
        } else {
          itln[0].rowEL.translateY = itln[0].rowEL.getBoundingClientRect().top - 195;
        }
      } else {
        itln[0].rowEL.translateY = itln[0].rowEL.offsetTop - sp.rowsPaneEL!.scrollTop;
      }
      if (itln[1].rowEL.collect) {
        if (sp.timerShaftEL?._checkExpand) {
          itln[1].rowEL.translateY =
            itln[1].rowEL.getBoundingClientRect().top - 195 + sp.timerShaftEL._usageFoldHeight!;
        } else {
          itln[1].rowEL.translateY = itln[1].rowEL.getBoundingClientRect().top - 195;
        }
      } else {
        itln[1].rowEL.translateY = itln[1].rowEL.offsetTop - sp.rowsPaneEL!.scrollTop;
      }
      itln[0].y = itln[0].rowEL.translateY + itln[0].offsetY;
      itln[1].y = itln[1].rowEL.translateY + itln[1].offsetY;
    });
    sp.currentClickRow = null;
  };
}
function selectHandler(sp: SpSystemTrace): void {
  sp.rangeSelect.selectHandler = (rows, refreshCheckBox): void => {
    rows.forEach((item) => {
      sp.setAttribute('clickRow', item.rowType!);
      sp.setAttribute('rowName', item.name);
      sp.setAttribute('rowId', item.rowId!);
    });
    if (rows.length === 0) {
      const allRows = [
        // @ts-ignore
        ...sp.shadowRoot!.querySelectorAll<TraceRow<unknown>>('trace-row'),
        ...sp.favoriteChartListEL!.getAllCollectRows(),
      ];
      for (const row of allRows) {
        row.checkType = '-1';
        if (row.folder) {
          row.childrenList.forEach((item) => {
            row.checkType = '-1';
          });
        }
      }
      sp.refreshCanvas(true);
      if (!SportRuler.isMouseInSportRuler) {
        sp.traceSheetEL?.setMode('hidden');
      }
      return;
    }
    let checkRows = rows;
    if (!refreshCheckBox) {
      checkRows = [
        // @ts-ignore
        ...sp.shadowRoot!.querySelectorAll<TraceRow<unknown>>(`trace-row[check-type='2']`),
        ...sp.favoriteChartListEL!.getAllSelectCollectRows(),
      ];
    }
    selectHandlerRefreshCheckBox(sp, checkRows, refreshCheckBox);
    if (!sp.isSelectClick) {
      sp.rangeTraceRow = [];
    }
    selectHandlerRows(sp, checkRows);
  };
}
// @ts-ignore
function selectHandlerRefreshCheckBox(sp: SpSystemTrace, rows: Array<TraceRow<unknown>>, refreshCheckBox: boolean): void {
  if (refreshCheckBox) {
    if (rows.length > 0) {
      sp.queryAllTraceRow().forEach((row) => (row.checkType = '0'));
      rows.forEach((it) => (it.checkType = '2'));
    } else {
      sp.queryAllTraceRow().forEach((row) => (row.checkType = '-1'));
      return;
    }
  }
}
// @ts-ignore
function selectHandlerRows(sp: SpSystemTrace, rows: Array<TraceRow<unknown>>): void {
  let selection = new SelectionParam();
  selection.traceId = Utils.currentSelectTrace;
  selection.cpuStateRowsId = sp.stateRowsId;
  selection.leftNs = TraceRow.rangeSelectObject?.startNS || 0;
  selection.rightNs = TraceRow.rangeSelectObject?.endNS || 0;
  selection.recordStartNs = Utils.getInstance().getRecordStartNS(Utils.currentSelectTrace);
  rows.forEach((it) => {
    selection.pushSelection(it, sp);
    if (sp.rangeTraceRow!.length !== rows.length) {
      let event = sp.createPointEvent(it);
      SpStatisticsHttpUtil.addOrdinaryVisitAction({
        action: 'trace_row', // @ts-ignore
        event: event,
      });
    }
  });
  if (selection.diskIOipids.length > 0 && !selection.diskIOLatency) {
    selection.promiseList.push(
      queryEbpfSamplesCount(
        TraceRow.rangeSelectObject?.startNS || 0,
        TraceRow.rangeSelectObject?.endNS || 0,
        selection.diskIOipids
      ).then((res) => {
        if (res.length > 0) {
          //@ts-ignore
          selection.fsCount = res[0].fsCount;
          //@ts-ignore
          selection.vmCount = res[0].vmCount;
        }
        return new Promise((resolve) => resolve(1));
      })
    );
  }
  sp.rangeTraceRow = rows;
  sp.isSelectClick = false;
  sp.selectStructNull();
  sp.timerShaftEL?.removeTriangle('inverted');
  if (selection.promiseList.length > 0) {
    Promise.all(selection.promiseList).then(() => {
      selection.promiseList = [];
      sp.traceSheetEL?.rangeSelect(selection);
    });
  } else {
    sp.traceSheetEL?.rangeSelect(selection);
  }
  sp.timerShaftEL!.selectionList.push(selection); // 保持选中对象，为后面的再次选中该框选区域做准备。
  sp.selectionParam = selection;
}
function resizeObserverHandler(sp: SpSystemTrace): void {
  // @ts-ignore
  new ResizeObserver((entries) => {
    TraceRow.FRAME_WIDTH = sp.clientWidth - 249 - sp.getScrollWidth();
    requestAnimationFrame(() => {
      sp.timerShaftEL?.updateWidth(sp.clientWidth - 1 - sp.getScrollWidth());
      // @ts-ignore
      sp.shadowRoot!.querySelectorAll<TraceRow<unknown>>('trace-row').forEach((it) => {
        it.updateWidth(sp.clientWidth);
      });
    });
  }).observe(sp);

  new ResizeObserver((entries) => {
    sp.canvasPanelConfig();
    if (sp.traceSheetEL!.getAttribute('mode') === 'hidden') {
      sp.timerShaftEL?.removeTriangle('triangle');
    }
    if (sp.favoriteChartListEL?.style.display === 'flex') {
      sp.refreshFavoriteCanvas();
    }
    sp.refreshCanvas(true);
  }).observe(sp.rowsPaneEL!);
}
function mutationObserverHandler(sp: SpSystemTrace): void {
  new MutationObserver((mutations, observer) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes') {
        if (sp.style.visibility === 'visible') {
          if (TraceRow.rangeSelectObject && SpSystemTrace.sliceRangeMark) {
            sp.timerShaftEL?.setSlicesMark(
              TraceRow.rangeSelectObject.startNS || 0,
              TraceRow.rangeSelectObject.endNS || 0,
              false
            );
            SpSystemTrace.sliceRangeMark = undefined;
            window.publish(window.SmartEvent.UI.RefreshCanvas, {});
          }
        }
      }
    }
  }).observe(sp, {
    attributes: true,
    childList: false,
    subtree: false,
  });
}
function intersectionObserverHandler(sp: SpSystemTrace): void {
  sp.intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((it) => {
        // @ts-ignore
        let tr = it.target as TraceRow<unknown>;
        // 目标元素的可见比例
        tr.intersectionRatio = it.intersectionRatio;
        // 判断目标元素是否可见 isIntersecting为true是可见
        if (!it.isIntersecting) {
          tr.sleeping = true;
          sp.invisibleRows.indexOf(tr) === -1 && sp.invisibleRows.push(tr);
        } else {
          tr.sleeping = false;
          sp.visibleRows.indexOf(tr) === -1 && sp.visibleRows.push(tr);
        }
      });
      //更新可见泳道及不可见泳道值
      sp.visibleRows = sp.visibleRows.filter((it) => !it.sleeping);
      sp.invisibleRows = sp.invisibleRows.filter((it) => it.sleeping);
      if (sp.handler === -1) {
        cancelAnimationFrame(sp.handler);
      }
      sp.handler = requestAnimationFrame(() => sp.refreshCanvas(false));
    },
    { threshold: [0, 0.01, 0.99, 1] }
  );
}
function observerHandler(sp: SpSystemTrace): void {
  resizeObserverHandler(sp);
  mutationObserverHandler(sp);
  intersectionObserverHandler(sp);
}
function windowKeyDownHandler(sp: SpSystemTrace): (ev: KeyboardEvent) => void {
  return function (ev: KeyboardEvent) {
    if (ev.key.toLocaleLowerCase() === 'escape') {
      sp.queryAllTraceRow().forEach((it) => {
        it.checkType = '-1';
      });
      TraceRow.rangeSelectObject = undefined;
      sp.rangeSelect.rangeTraceRow = [];
      sp.selectStructNull();
      sp.timerShaftEL?.setSlicesMark();
      sp.traceSheetEL?.setMode('hidden');
      sp.removeLinkLinesByBusinessType('janks', 'task');
    }
  };
}
function smartEventSubscribe(sp: SpSystemTrace): void {
  window.subscribe(window.SmartEvent.UI.SliceMark, (data) => sp.sliceMarkEventHandler(data));
  window.subscribe(window.SmartEvent.UI.TraceRowComplete, (tr) => { });
  window.subscribe(window.SmartEvent.UI.RefreshCanvas, () => sp.refreshCanvas(false));
  window.subscribe(window.SmartEvent.UI.KeyboardEnable, (tr) => {
    //@ts-ignore
    sp.keyboardEnable = tr.enable;
    if (!sp.keyboardEnable) {
      sp.stopWASD();
    }
  }); //@ts-ignore
  window.subscribe(window.SmartEvent.UI.CollapseAllLane, (collapse: boolean) => {
    if (!collapse) {
      // 一键折叠之前，记录当前打开的泳道图
      // @ts-ignore
      sp.expandRowList = Array.from(sp.rowsEL!.querySelectorAll<TraceRow<unknown>>('trace-row[folder][expansion]')) || [];
    }
    sp.collapseAll = true;
    sp.setAttribute('disable', '');
    sp.expandRowList!.forEach((it) => (it.expansion = collapse));
    sp.collapseAll = false;
    sp.removeAttribute('disable');
    sp.refreshCanvas(true);
  });
  window.subscribe(window.SmartEvent.UI.MouseEventEnable, (tr) => {
    //@ts-ignore
    sp.mouseEventEnable = tr.mouseEnable;
    if (sp.mouseEventEnable) {
      sp.removeAttribute('disable');
    } else {
      sp.setAttribute('disable', '');
    }
  }); //@ts-ignore
  window.subscribe(window.SmartEvent.UI.CollectGroupChange, (group: string) => (sp.currentCollectGroup = group));
}

export function documentInitEvent(sp: SpSystemTrace): void {
  if (!document) {
    return;
  }
  document.addEventListener('triangle-flag', triangleFlagHandler(sp));
  document.addEventListener('number_calibration', numberCalibrationHandler(sp));
  document.addEventListener('flag-change', flagChangeHandler(sp));
  document.addEventListener('remarksFocus-change', remarksFocuseChangeHandler(sp));
  document.addEventListener('slices-change', slicesChangeHandler(sp));
  if (sp.timerShaftEL?.collecBtn) {
    sp.timerShaftEL.collecBtn.onclick = (): void => {
      if (sp.timerShaftEL!.collecBtn!.hasAttribute('close')) {
        sp.timerShaftEL!.collecBtn!.removeAttribute('close');
        sp.favoriteChartListEL?.showCollectArea();
      } else {
        sp.timerShaftEL!.collecBtn!.setAttribute('close', '');
        sp.favoriteChartListEL?.hideCollectArea();
      }
    };
  }
  document.addEventListener('collect', collectHandler(sp));
}

function remarksFocuseChangeHandler(sp: SpSystemTrace): (event: unknown) => void {
  return function (event: unknown): void {
    // @ts-ignore
    sp.focusTarget = event.detail;
  };
}

export function spSystemTraceInitElement(sp: SpSystemTrace): void {
  window.subscribe(window.SmartEvent.UI.LoadFinishFrame, () => sp.drawAllLines());
  sp.traceSheetEL = sp.shadowRoot?.querySelector<TraceSheet>('.trace-sheet');
  if (!sp || !sp.shadowRoot || !sp.traceSheetEL) {
    return;
  }
  let rightButton: HTMLElement | null | undefined = sp.traceSheetEL.shadowRoot
    ?.querySelector('#current-selection > tabpane-current-selection')
    ?.shadowRoot?.querySelector('#rightButton');
  let rightStar: HTMLElement | null | undefined = sp.traceSheetEL.shadowRoot
    ?.querySelector('#current-selection > tabpane-current-selection')
    ?.shadowRoot?.querySelector('#right-star');
  sp.tipEL = sp.shadowRoot.querySelector<HTMLDivElement>('.tip');
  sp.rowsPaneEL = sp.shadowRoot.querySelector<HTMLDivElement>('.rows-pane');
  sp.rowsEL = sp.rowsPaneEL;
  sp.spacerEL = sp.shadowRoot.querySelector<HTMLDivElement>('.spacer');
  sp.timerShaftEL = sp.shadowRoot.querySelector<TimerShaftElement>('.timer-shaft');
  sp.favoriteChartListEL = sp.shadowRoot.querySelector<SpChartList>('#favorite-chart-list');
  if (!sp.traceSheetEL.shadowRoot) {
    return;
  }
  sp.tabCpuFreq = sp.traceSheetEL.shadowRoot.querySelector<TabPaneFrequencySample>('tabpane-frequency-sample');
  sp.tabCpuState = sp.traceSheetEL.shadowRoot.querySelector<TabPaneCounterSample>('tabpane-counter-sample');
  sp.rangeSelect = new RangeSelect(sp);
  // @ts-ignore
  rightButton?.addEventListener('click', rightButtonOnClick(sp, rightStar));
  rightStar?.addEventListener('click', rightStarOnClick(sp));
  documentInitEvent(sp);
  SpSystemTrace.scrollViewWidth = sp.getScrollWidth();
  selectHandler(sp);
  observerHandler(sp);
  window.addEventListener('keydown', windowKeyDownHandler(sp));
  sp.chartManager = new SpChartManager(sp);
  sp.canvasPanel = sp.shadowRoot.querySelector<HTMLCanvasElement>('#canvas-panel')!;
  sp.canvasPanelCtx = sp.canvasPanel.getContext('2d');
  sp.canvasFavoritePanelCtx = sp.favoriteChartListEL!.context();
  sp.canvasPanelConfig();
  smartEventSubscribe(sp);
}

function moveRangeToCenterAndHighlight(sp: SpSystemTrace, findEntry: unknown, currentEntry: unknown): void {
  if (findEntry) {
    //findEntry不在range范围内，会把它移动到泳道最左侧
    // @ts-ignore
    if (findEntry.startTime > TraceRow.range!.endNS || findEntry.startTime + findEntry.dur < TraceRow.range!.startNS) {
      // @ts-ignore
      sp.moveRangeToLeft(findEntry.startTime!, findEntry.dur!);
    }
    cancelCurrentTraceRowHighlight(sp, currentEntry);
    // @ts-ignore
    if (findEntry.type === 'cpu') {
      findEntryTypeCpu(sp, findEntry);
      // @ts-ignore
    } else if (findEntry.type === 'func') {
      findEntryTypeFunc(sp, findEntry);
      // @ts-ignore
    } else if (findEntry.type === 'thread||process') {
      findEntryTypeThreadProcess(sp, findEntry);
      // @ts-ignore
    } else if (findEntry.type === 'sdk') {
      findEntryTypeSdk(sp, findEntry);
    }
  }
}

export function cancelCurrentTraceRowHighlight(sp: SpSystemTrace, currentEntry: unknown): void {
  // @ts-ignore
  if (currentEntry?.type === 'cpu') {
    // @ts-ignore
    sp.queryAllTraceRow(`trace-row[row-type='cpu-data'][row-id='${currentEntry.cpu}']`,
      // @ts-ignore
      (row) => row.rowType === 'cpu-data' && row.rowId === `${currentEntry.cpu}`)[0].highlight = false;
    // @ts-ignore
  } else if (currentEntry?.type === 'func') {
    // @ts-ignore
    let funId = (currentEntry.rowId === null || currentEntry.rowId === undefined) ? `${currentEntry.funName}-${currentEntry.pid}` : currentEntry.rowId;
    // @ts-ignore
    let funcRowID = (currentEntry.cookie === null || currentEntry.cookie === undefined) ? `${Utils.getDistributedRowId(currentEntry.tid)}` : funId;
    // @ts-ignore
    let parentRow = sp.queryAllTraceRow(`trace-row[row-id='${Utils.getDistributedRowId(currentEntry.pid)}'][folder]`,
      // @ts-ignore
      (row) => row.rowId === `trace-row[row-id='${Utils.getDistributedRowId(currentEntry.pid)}'][folder]`)[0];
    if (!parentRow) {
      return;
    }
    let filterRow = parentRow.childrenList.filter((child) => child.rowId === funcRowID && child.rowType === 'func')[0];
    filterRow.highlight = false;
    // @ts-ignore
  } else if (currentEntry?.type === 'sdk') {
    // @ts-ignore
    let parentRow = sp.shadowRoot!.querySelector<TraceRow<unknown>>("trace-row[row-type='sdk'][folder]");
    if (parentRow) {
      let sdkRow = parentRow.childrenList.filter(
        // @ts-ignore
        (child) => child.rowId === currentEntry.rowId && child.rowType === currentEntry.rowType
      )[0];
      sdkRow!.highlight = false;
    }
  }
}

export function spSystemTraceShowStruct(
  sp: SpSystemTrace,
  previous: boolean,
  currentIndex: number,
  structs: Array<unknown>,
  retargetIndex?: number
): number {
  if (structs.length === 0) {
    return 0;
  }
  let findIndex = spSystemTraceShowStructFindIndex(previous, currentIndex, structs, retargetIndex);
  let findEntry: unknown;
  findEntry = structs[findIndex];
  let currentEntry: unknown = undefined;
  if (currentIndex >= 0) {
    currentEntry = structs[currentIndex];
  }
  moveRangeToCenterAndHighlight(sp, findEntry, currentEntry);
  return findIndex;
}

function spSystemTraceShowStructFindIndex(
  previous: boolean,
  currentIndex: number,
  structs: Array<unknown>,
  retargetIndex: number | undefined
): number {
  const rangeStart = TraceRow.range!.startNS;
  const rangeEnd = TraceRow.range!.endNS;
  let findIndex = -1;
  if (retargetIndex) {
    findIndex = retargetIndex - 1;
  } else if (previous) {
    for (let i = structs.length - 1; i >= 0; i--) {
      let it = structs[i];
      // @ts-ignore
      if ((i < currentIndex && it.startTime! >= rangeStart && it.startTime! + it.dur! <= rangeEnd) ||
        // @ts-ignore
        (it.startTime! + it.dur! < rangeStart)) {
        findIndex = i;
        break;
      }
    }
    if (findIndex === -1) {
      findIndex = structs.length - 1;
    }
  } else {
    if (currentIndex > 0) {
      if (rangeStart > SpSystemTrace.currentStartTime) {
        SpSystemTrace.currentStartTime = rangeStart;
      }
      //右移rangeStart变小重新赋值
      if (SpSystemTrace.currentStartTime > rangeStart) {
        SpSystemTrace.currentStartTime = rangeStart;//currentIndex不在可视区时，currentIndex = -1
        if (
          // @ts-ignore
          structs[currentIndex].startTime < rangeStart ||
          // @ts-ignore
          structs[currentIndex].startTime! + structs[currentIndex].dur! > rangeEnd
        ) {
          currentIndex = -1;
        }
      }
    }
    //在数组中查找比currentIndex大且在range范围内的第一个下标，如果range范围内没有返回-1
    findIndex = structs.findIndex((it, idx) => {
      // @ts-ignore
      return ((idx > currentIndex && it.startTime! >= rangeStart && it.startTime! + it.dur! <= rangeEnd) ||
        // @ts-ignore
        (it.startTime! > rangeEnd));
    });
    if (findIndex === -1) {
      findIndex = 0;
    }
  }
  return findIndex;
}
function findEntryTypeCpu(sp: SpSystemTrace, findEntry: unknown): void {
  // @ts-ignore
  CpuStruct.selectCpuStruct = findEntry;
  CpuStruct.hoverCpuStruct = CpuStruct.selectCpuStruct;
  sp.queryAllTraceRow(`trace-row[row-type='cpu-data']`, (row): boolean => row.rowType === 'cpu-data').forEach(
    (item): void => {
      // @ts-ignore
      if (item.rowId === `${Utils.getDistributedRowId(findEntry.cpu)}`) {
        sp.rechargeCpuData(
          // @ts-ignore
          findEntry, // @ts-ignore
          item.dataListCache.find((it) => it.startTime > findEntry.startTime)
        );
        let _findEntry = JSON.parse(JSON.stringify(findEntry));
        _findEntry.type = 'thread';
        item.fixedList = [_findEntry];
      }
      // @ts-ignore
      item.highlight = item.rowId === `${Utils.getDistributedRowId(findEntry.cpu)}`;
      item.draw(true);
    }
  );
  // @ts-ignore
  sp.scrollToProcess(`${findEntry.cpu}`, '', 'cpu-data', true);
  sp.onClickHandler(TraceRow.ROW_TYPE_CPU);
}
function findEntryTypeFunc(sp: SpSystemTrace, findEntry: unknown): void {
  sp.observerScrollHeightEnable = true;
  sp.scrollToActFunc(
    {
      // @ts-ignore
      startTs: findEntry.startTime,
      // @ts-ignore
      dur: findEntry.dur,
      // @ts-ignore
      tid: findEntry.tid,
      // @ts-ignore
      pid: findEntry.pid,
      // @ts-ignore
      depth: findEntry.depth,
      // @ts-ignore
      argsetid: findEntry.argsetid,
      // @ts-ignore
      funName: findEntry.funName,
      // @ts-ignore
      cookie: findEntry.cookie,
      // @ts-ignore
      //因异步trace分类出的rowId类型有三种，故新增row_id字段，该字段为异步方法的对应的rowId，支持搜索查询定位到该方法属于那个row，只有缓存的异步trace数据中含该字段
      row_id: findEntry.rowId ? findEntry.rowId : null,
    },
    true
  );
}
function findEntryTypeThreadProcess(sp: SpSystemTrace, findEntry: unknown): void {
  let threadProcessRow = sp.rowsEL?.querySelectorAll<TraceRow<ThreadStruct>>('trace-row')[0];
  if (threadProcessRow) {
    let filterRow = threadProcessRow.childrenList.filter(
      // @ts-ignore
      (row) => row.rowId === Utils.getDistributedRowId(findEntry.rowId) && row.rowId === findEntry.rowType
    )[0];
    filterRow!.highlight = true;
    // @ts-ignore
    sp.closeAllExpandRows(Utils.getDistributedRowId(findEntry.rowParentId));
    // @ts-ignore
    sp.scrollToProcess(`${findEntry.rowId}`, `${findEntry.rowParentId}`, findEntry.rowType, true);
    let completeEntry = (): void => {
      sp.hoverStructNull();
      sp.selectStructNull();
      sp.wakeupListNull();
      // @ts-ignore
      sp.scrollToProcess(`${findEntry.rowId}`, `${findEntry.rowParentId}`, findEntry.rowType, true);
    };
    if (filterRow!.isComplete) {
      completeEntry();
    } else {
      filterRow!.onComplete = completeEntry;
    }
  }
}
function findEntryTypeSdk(sp: SpSystemTrace, findEntry: unknown): void {
  // @ts-ignore
  let parentRow = sp.shadowRoot!.querySelector<TraceRow<unknown>>(`trace-row[row-type='sdk'][folder]`);
  if (parentRow) {
    let sdkRow = parentRow.childrenList.filter(
      // @ts-ignore
      (child) => child.rowId === findEntry.rowId && child.rowType === findEntry.rowType
    )[0];
    sdkRow!.highlight = true;
  }
  sp.hoverStructNull();
  sp.selectStructNull();
  sp.wakeupListNull();
  // @ts-ignore
  sp.onClickHandler(findEntry.rowType!);
  // @ts-ignore
  sp.closeAllExpandRows(findEntry.rowParentId);
  // @ts-ignore
  sp.scrollToProcess(`${findEntry.rowId}`, `${findEntry.rowParentId}`, findEntry.rowType, true);
}
async function spSystemTraceInitBuffer(
  sp: SpSystemTrace,
  param: { buf?: ArrayBuffer; Url?: string; buf2?: ArrayBuffer },
  wasmConfigUri: string,
  progress: Function
): Promise<{
  status: boolean;
  msg: string;
} | null> {
  if (param.buf) {
    let configJson = '';
    try {
      configJson = await fetch(wasmConfigUri).then((res) => res.text());
    } catch (e) {
      error('getWasmConfigFailed', e);
    }
    let parseConfig = FlagsConfig.getSpTraceStreamParseConfig();
    let { status, msg, sdkConfigMap } = await threadPool.initSqlite(param.buf, parseConfig, configJson, progress);
    if (!status) {
      return { status: false, msg: msg };
    }
    SpSystemTrace.SDK_CONFIG_MAP = sdkConfigMap;
    if (param.buf2) {
      let { status, msg } = await threadPool2.initSqlite(param.buf2, parseConfig, configJson, progress);
      if (!status) {
        return { status: false, msg: msg };
      }
    }
    return null;
  } else {
    return null;
  }
}
async function spSystemTraceInitUrl(
  sp: SpSystemTrace,
  param: { buf?: ArrayBuffer; url?: string },
  wasmConfigUri: string,
  progress: Function
): Promise<{
  status: boolean;
  msg: string;
} | null> {
  if (param.url) {
    let { status, msg } = await threadPool.initServer(param.url, progress);
    if (!status) {
      return { status: false, msg: msg };
    } else {
      return null;
    }
  } else {
    return null;
  }
}
export async function spSystemTraceInit(
  sp: SpSystemTrace,
  param: { buf?: ArrayBuffer; url?: string; buf2?: ArrayBuffer; fileName1?: string; fileName2?: string },
  wasmConfigUri: string,
  progress: Function,
  isDistributed: boolean
): Promise<unknown> {
  progress('Load database', 6);
  sp.rowsPaneEL!.scroll({ top: 0, left: 0 });
  let rsBuf = await spSystemTraceInitBuffer(sp, param, wasmConfigUri, progress);
  if (rsBuf) {
    return rsBuf;
  }
  let rsUrl = await spSystemTraceInitUrl(sp, param, wasmConfigUri, progress);
  if (rsUrl) {
    return rsUrl;
  }
  if (isDistributed) {
    await sp.chartManager?.initDistributedChart(progress, param.fileName1 || 'Trace 1', param.fileName2 || 'Trace 2');
  } else {
    await sp.chartManager?.init(progress);
  }
  let rowId: string = '';
  // @ts-ignore
  sp.rowsEL?.querySelectorAll<TraceRow<unknown>>('trace-row').forEach((it) => {
    if (it.name.includes('Ark Ts')) {
      rowId = it.rowId!;
    }
    if (it.folder) {
      it.addEventListener('expansion-change', sp.extracted(it));
    }
  });
  progress('completed', 100);
  info('All TraceRow Data initialized');
  sp.loadTraceCompleted = true;
  // @ts-ignore
  sp.rowsEL!.querySelectorAll<TraceRow<unknown>>('trace-row').forEach((it) => {
    if (rowId !== '' && (it.rowId?.includes(rowId) || it.name.includes(rowId))) {
      it.addTemplateTypes('Ark Ts');
      for (let child of it.childrenList) {
        child.addTemplateTypes('Ark Ts');
      }
    }
    if (it.folder) {
      let offsetYTimeOut: unknown = undefined;
      it.addEventListener('expansion-change', expansionChangeHandler(sp, offsetYTimeOut));
    }
    if (sp.loadTraceCompleted) {
      sp.traceSheetEL?.displaySystemLogsData();
      sp.traceSheetEL?.displaySystemStatesData();
    }
    sp.intersectionObserver?.observe(it);
  });
  // trace文件加载完毕,将动效json文件读取并存入缓存
  let funDetailUrl = `https://${window.location.host.split(':')[0]}:${window.location.port
    }/application/doc/funDetail.json`;
  let xhr = new XMLHttpRequest();
  // 创建XMLHttpRequest对象
  xhr.open('GET', funDetailUrl);
  xhr.onreadystatechange = function (): void {
    if (xhr.readyState === 4 && xhr.status === 200) {
      let content = xhr.responseText;
      caches.open('/funDetail').then((cache) => {
        let headers = new Headers();
        headers.append('Content-Type', 'application/json');
        return cache
          .put(
            '/funDetail',
            new Response(content, {
              status: 200,
              headers,
            })
          )
          .then();
      });
    }
  };
  xhr.send(); // 发送请求
  return { status: true, msg: 'success' };
}
function expansionChangeHandler(sp: SpSystemTrace, offsetYTimeOut: unknown): (event: unknown) => void {
  return function (event: unknown) {
    let max = [...sp.rowsPaneEL!.querySelectorAll('trace-row')].reduce((pre, cur) => pre + cur.clientHeight!, 0);
    let offset = sp.rowsPaneEL!.scrollHeight - max;
    sp.rowsPaneEL!.scrollTop = sp.rowsPaneEL!.scrollTop - offset;
    JankStruct.delJankLineFlag = false;
    if (offsetYTimeOut) {
      // @ts-ignore
      clearTimeout(offsetYTimeOut);
    }
    // @ts-ignore
    if (event.detail.expansion) {
      offsetYTimeOut = setTimeout(() => {
        sp.linkNodes.forEach((linkNode) => {
          JankStruct.selectJankStructList?.forEach((selectStruct: unknown) => {
            // @ts-ignore
            if (event.detail.rowId === selectStruct.pid) {
              // @ts-ignore
              JankStruct.selectJankStruct = selectStruct;
              // @ts-ignore
              JankStruct.hoverJankStruct = selectStruct;
            }
          });
          linkNodeHandler(linkNode, sp);
        });
      }, 300);
    } else {
      if (JankStruct!.selectJankStruct) {
        JankStruct.selectJankStructList?.push(<JankStruct>JankStruct!.selectJankStruct);
      }
      offsetYTimeOut = setTimeout(() => {
        sp.linkNodes?.forEach((linkNode) => linkNodeHandler(linkNode, sp));
      }, 300);
    }
    let refreshTimeOut = setTimeout(() => {
      sp.refreshCanvas(true);
      clearTimeout(refreshTimeOut);
    }, 360);
  };
}
function linkNodeHandler(linkNode: PairPoint[], sp: SpSystemTrace): void {
  if (linkNode[0].rowEL.collect) {
    linkNode[0].rowEL.translateY = linkNode[0].rowEL.getBoundingClientRect().top - 195;
  } else {
    linkNode[0].rowEL.translateY = linkNode[0].rowEL.offsetTop - sp.rowsPaneEL!.scrollTop;
  }
  linkNode[0].y = linkNode[0].rowEL!.translateY! + linkNode[0].offsetY;
  if (linkNode[1].rowEL.collect) {
    linkNode[1].rowEL.translateY = linkNode[1].rowEL.getBoundingClientRect().top - 195;
  } else {
    linkNode[1].rowEL.translateY = linkNode[1].rowEL.offsetTop - sp.rowsPaneEL!.scrollTop;
  }
  linkNode[1].y = linkNode[1].rowEL!.translateY! + linkNode[1].offsetY;
}

const eventMap = {
  'cpu-data': 'Cpu',
  'cpu-state': 'Cpu State',
  'cpu-freq': 'Cpu Frequency',
  'cpu-limit-freq': 'Cpu Freq Limit',
  process: 'Process',
  'native-memory': 'Native Memory',
  thread: 'Thread',
  func: 'Func',
  mem: 'Memory',
  'virtual-memory-cell': 'Virtual Memory',
  'virtual-memory-group': 'Virtual Memory',
  fps: 'FPS',
  'ability-monitor': 'Ability Monitor',
  'cpu-ability': 'Cpu Ability',
  'memory-ability': 'Memory Ability',
  'disk-ability': 'DiskIO Ability',
  'network-ability': 'Network Ability',
  sdk: 'Sdk',
  'sdk-counter': 'SDK Counter',
  'sdk-slice': 'Sdk Slice',
  energy: 'Energy',
  'power-energy': 'Power Event',
  'system-energy': 'System Event',
  'anomaly-energy': 'Anomaly Event',
  'clock-group': 'Clocks',
  clock: 'clock',
  'irq-group': 'Irqs',
  irq: 'irq',
  hiperf: 'HiPerf (All)',
  'hiperf-event': 'HiPerf Event',
  'hiperf-report': 'HiPerf Report',
  'hiperf-process': 'HiPerf Process',
  'hiperf-thread': 'HiPerf Thread',
  'js-memory': 'Js Memory',
};
export function spSystemTraceInitPointToEvent(sp: SpSystemTrace): void {
  sp.eventMap = eventMap;
}

export function spSystemTraceParentRowSticky(sp: SpSystemTrace, deltaY: number): void {
  if (deltaY > 0) {
    // 从上往下划
    const expandRowList = sp.visibleRows.filter((vr) => vr.expansion);
    // @ts-ignore
    expandRowList.forEach((vr: TraceRow<unknown>) => {
      // @ts-ignore
      const visibleNotCollectList = vr.childrenList.filter((child: TraceRow<unknown>) => !child.collect && !child.sleeping);
      vr.sticky = visibleNotCollectList.length > 0;
    });
  } else if (deltaY < 0) {
    // 从下往上划
    sp.visibleRows
      .filter((vr) => !vr.folder && vr.parentRowEl && vr.parentRowEl.expansion && !vr.collect)
      .forEach((vr) => (vr.parentRowEl!.sticky = true));
  } else {
    return;
  }
}
