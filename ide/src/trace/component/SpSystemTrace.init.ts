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
import { TabPaneFrequencySample } from './trace/sheet/cpu/TabPaneFrequencySample';
import { TabPaneCounterSample } from './trace/sheet/cpu/TabPaneCounterSample';
import { RangeSelect } from './trace/base/RangeSelect';
import { RangeSelectStruct, TraceRow } from './trace/base/TraceRow';
import { SportRuler } from './trace/timer-shaft/SportRuler';
import { SelectionParam } from '../bean/BoxSelection';
import { error, info } from '../../log/Log';
import { intersectData, isExistPidInArray, setSelectState } from './Utils';
import { TabPaneTaskFrames } from './trace/sheet/task/TabPaneTaskFrames';
import { FuncStruct } from '../database/ui-worker/ProcedureWorkerFunc';
import { JanksStruct } from '../bean/JanksStruct';
import { HeapDataInterface } from '../../js-heap/HeapDataInterface';
import { LitTabs } from '../../base-ui/tabs/lit-tabs';
import { TabPaneSummary } from './trace/sheet/ark-ts/TabPaneSummary';
import { JsCpuProfilerStruct } from '../database/ui-worker/ProcedureWorkerCpuProfiler';
import { FrameAnimationStruct } from '../database/ui-worker/ProcedureWorkerFrameAnimation';
import { FrameDynamicStruct } from '../database/ui-worker/ProcedureWorkerFrameDynamic';
import { FrameSpacingStruct } from '../database/ui-worker/ProcedureWorkerFrameSpacing';
import { SpStatisticsHttpUtil } from '../../statistics/util/SpStatisticsHttpUtil';
import { queryEbpfSamplesCount } from '../database/sql/Memory.sql';
import { SpChartManager } from './chart/SpChartManager';
import { ThreadStruct } from '../database/ui-worker/ProcedureWorkerThread';
import { FlagsConfig } from './SpFlags';
import { threadPool } from '../database/SqlLite';
import { JankStruct } from '../database/ui-worker/ProcedureWorkerJank';
import { CpuStruct } from '../database/ui-worker/cpu/ProcedureWorkerCPU';

export function SpSystemTraceInitElement(sp: SpSystemTrace) {
  window.subscribe(window.SmartEvent.UI.LoadFinishFrame, () => sp.drawAllLines());
  sp.traceSheetEL = sp.shadowRoot?.querySelector('.trace-sheet');
  let rightButton: HTMLElement | null | undefined = sp.traceSheetEL?.shadowRoot
    ?.querySelector('#current-selection > tabpane-current-selection')
    ?.shadowRoot?.querySelector('#rightButton');
  let rightStar: HTMLElement | null | undefined = sp.traceSheetEL?.shadowRoot
    ?.querySelector('#current-selection > tabpane-current-selection')
    ?.shadowRoot?.querySelector('#right-star');
  sp.tipEL = sp.shadowRoot?.querySelector<HTMLDivElement>('.tip');
  sp.rowsPaneEL = sp.shadowRoot?.querySelector<HTMLDivElement>('.rows-pane');
  sp.rowsEL = sp.rowsPaneEL;
  sp.spacerEL = sp.shadowRoot?.querySelector<HTMLDivElement>('.spacer');
  sp.timerShaftEL = sp.shadowRoot?.querySelector('.timer-shaft');
  sp.favoriteChartListEL = sp.shadowRoot?.querySelector('#favorite-chart-list');
  sp.tabCpuFreq = sp.traceSheetEL?.shadowRoot?.querySelector<TabPaneFrequencySample>('tabpane-frequency-sample');
  sp.tabCpuState = sp.traceSheetEL?.shadowRoot?.querySelector<TabPaneCounterSample>('tabpane-counter-sample');
  sp.rangeSelect = new RangeSelect(sp);
  rightButton?.addEventListener('click', (event: any) => {
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
    SpSystemTrace.btnTimer = setTimeout(() => {
      SpSystemTrace.btnTimer = null; // 2.清空节流阀，方便下次开启定时器
    }, 2000);
  });
  rightStar?.addEventListener('click', () => {
    let wakeupLists = [];
    wakeupLists.push(CpuStruct.selectCpuStruct?.cpu);
    for (let wakeupBean of SpSystemTrace.wakeupList) {
      wakeupLists.push(wakeupBean.cpu);
    }
    let wakeupCpuLists = Array.from(new Set(wakeupLists)).sort();
    for (let i = 0; i < wakeupCpuLists.length; i++) {
      let cpuFavoriteRow: any = sp.shadowRoot?.querySelector<TraceRow<any>>(
        `trace-row[row-type='cpu-data'][row-id='${wakeupCpuLists[i]}']`
      );
      if (cpuFavoriteRow === null || cpuFavoriteRow === undefined) {
        continue;
      }
      cpuFavoriteRow!.setAttribute('collect-type', '');
      let replaceRow = document.createElement('div');
      replaceRow.setAttribute('row-id', cpuFavoriteRow.rowId + '-' + cpuFavoriteRow.rowType);
      replaceRow.setAttribute('type', 'replaceRow');
      replaceRow.setAttribute('row-parent-id', cpuFavoriteRow.rowParentId);
      replaceRow.style.display = 'none';
      cpuFavoriteRow.rowHidden = !cpuFavoriteRow.hasAttribute('scene');
      if (sp.rowsEL!.contains(cpuFavoriteRow)) {
        sp.rowsEL!.replaceChild(replaceRow, cpuFavoriteRow);
      }
      cpuFavoriteRow.tampName = cpuFavoriteRow.name;
      sp.favoriteChartListEL!.insertRow(cpuFavoriteRow, sp.currentCollectGroup, true);
      sp.collectRows.push(cpuFavoriteRow);
      sp.timerShaftEL?.displayCollect(sp.collectRows.length !== 0);
      sp.currentClickRow = null;
      cpuFavoriteRow.setAttribute('draggable', 'true');
      cpuFavoriteRow.addEventListener('dragstart', () => {
        sp.currentClickRow = cpuFavoriteRow;
      });
      cpuFavoriteRow.addEventListener('dragover', (ev: any) => {
        ev.preventDefault();
        ev.dataTransfer.dropEffect = 'move';
      });
      cpuFavoriteRow.addEventListener('drop', (ev: any) => {
        if (sp.favoriteChartListEL != null && sp.currentClickRow != null && sp.currentClickRow !== cpuFavoriteRow) {
          let rect = cpuFavoriteRow.getBoundingClientRect();
          if (ev.clientY >= rect.top && ev.clientY < rect.top + rect.height / 2) {
            //向上移动
            sp.favoriteChartListEL.insertRowBefore(sp.currentClickRow, cpuFavoriteRow);
          } else if (ev.clientY <= rect.bottom && ev.clientY > rect.top + rect.height / 2) {
            //向下移动
            sp.favoriteChartListEL.insertRowBefore(sp.currentClickRow, cpuFavoriteRow.nextSibling);
          }
          sp.refreshFavoriteCanvas();
        }
      });
      cpuFavoriteRow.addEventListener('dragend', () => {
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
      });
    }
    sp.refreshFavoriteCanvas();
    sp.refreshCanvas(true);
  });
  document?.addEventListener('triangle-flag', (event: any) => {
    let temporaryTime = sp.timerShaftEL?.drawTriangle(event.detail.time, event.detail.type);
    if (event.detail.timeCallback && temporaryTime) event.detail.timeCallback(temporaryTime);
  });

  document?.addEventListener('number_calibration', (event: any) => {
    sp.timerShaftEL!.sportRuler!.times = event.detail.time;
    sp.timerShaftEL!.sportRuler!.counts = event.detail.counts;
    sp.timerShaftEL!.sportRuler!.durations = event.detail.durations;
    sp.timerShaftEL!.sportRuler?.draw();
  });

  document?.addEventListener('flag-change', (event: any) => {
    sp.timerShaftEL?.modifyFlagList(event.detail);
    if (event.detail.hidden) {
      sp.selectFlag = undefined;
      if (sp._flagList.length <= 0) {
        if (TraceRow.rangeSelectObject) {
          let showTab = sp.getShowTab();
          showTab = showTab.filter((it) => it !== 'box-flag');
          sp.traceSheetEL?.displayTab(...showTab);
        } else {
          sp.traceSheetEL?.setAttribute('mode', 'hidden');
        }
      }
      sp.refreshCanvas(true);
    }
  });
  document?.addEventListener('slices-change', (event: any) => {
    sp.timerShaftEL?.modifySlicesList(event.detail);
    if (event.detail.hidden) {
      sp.slicestime = null;
      if (sp._slicesList.length <= 0) {
        if (TraceRow.rangeSelectObject) {
          let showTab = sp.getShowTab();
          showTab = showTab.filter((it) => it !== 'tabpane-current');
          sp.traceSheetEL?.displayTab(...showTab);
        } else {
          sp.traceSheetEL?.setAttribute('mode', 'hidden');
        }
      }
      sp.refreshCanvas(true);
    }
  });
  if (sp.timerShaftEL?.collecBtn) {
    sp.timerShaftEL.collecBtn.onclick = () => {
      if (sp.timerShaftEL!.collecBtn!.hasAttribute('close')) {
        sp.timerShaftEL!.collecBtn!.removeAttribute('close');
        sp.favoriteChartListEL?.showCollectArea();
      } else {
        sp.timerShaftEL!.collecBtn!.setAttribute('close', '');
        sp.favoriteChartListEL?.hideCollectArea();
      }
    };
  }
  document?.addEventListener('collect', (event: any) => {
    let currentRow = event.detail.row;
    if (currentRow.collect) {
      if (
        !sp.collectRows.find((find) => {
          return find === currentRow;
        })
      ) {
        sp.collectRows.push(currentRow);
      }
      let replaceRow = document.createElement('div');
      replaceRow.setAttribute('row-id', currentRow.rowId + '-' + currentRow.rowType);
      replaceRow.setAttribute('type', 'replaceRow');
      replaceRow.setAttribute('row-parent-id', currentRow.rowParentId);
      replaceRow.style.display = 'none';
      if (!currentRow.hasAttribute('scene')) {
        currentRow.setAttribute('row-hidden', '');
      } else {
        currentRow.removeAttribute('row-hidden');
      }
      // 添加收藏时，在线程名前面追加父亲ID
      let rowParentId = currentRow.rowParentId;
      currentRow.tampName = currentRow.name;
      if (rowParentId) {
        let parentRows = sp.shadowRoot?.querySelectorAll<TraceRow<any>>(`trace-row[row-id='${rowParentId}']`);
        parentRows?.forEach((parentRow) => {
          if (
            parentRow?.name &&
            parentRow?.name != currentRow.name &&
            !parentRow.rowType!.startsWith('cpu') &&
            !parentRow.rowType!.startsWith('thread') &&
            !parentRow.rowType!.startsWith('func') &&
            !currentRow.name.includes(parentRow.name)
          ) {
            currentRow.name += '(' + parentRow.name + ')';
          }
        });
      }
      if (!currentRow.hasParentRowEl) {
        sp.rowsEL!.replaceChild(replaceRow, currentRow);
      }
      sp.favoriteChartListEL?.insertRow(currentRow, sp.currentCollectGroup, event.detail.type !== 'auto-collect');
    } else {
      sp.favoriteChartListEL?.deleteRow(currentRow, event.detail.type !== 'auto-collect');
      if (event.detail.type !== 'auto-collect') {
        let rowIndex = sp.collectRows.indexOf(currentRow);
        if (rowIndex !== -1) {
          sp.collectRows.splice(rowIndex, 1);
        }
      }
      let row = currentRow;
      let allowExpansionRow = [];
      while (row.hasParentRowEl) {
        let parent = row.parentRowEl;
        allowExpansionRow.push(parent);
        row = parent;
      }
      for (let index: number = allowExpansionRow.length - 1; index >= 0; index--) {
        if (allowExpansionRow[index]?.hasAttribute('scene')) {
          if (allowExpansionRow[index]!.expansion) {
            allowExpansionRow[index].updateChildRowStatus();
          } else {
            allowExpansionRow[index].expansion = true;
          }
        }
      }
      allowExpansionRow.length = 0;
      let replaceRow = sp.rowsEL!.querySelector<HTMLCanvasElement>(
        `div[row-id='${currentRow.rowId}-${currentRow.rowType}']`
      );
      // 取消收藏时，删除父亲ID
      currentRow.name = currentRow.tampName;
      if (replaceRow != null) {
        sp.rowsEL!.replaceChild(currentRow, replaceRow);
        currentRow.style.boxShadow = `0 10px 10px #00000000`;
      }
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
    currentRow.addEventListener('dragover', (ev: any) => {
      ev.preventDefault();
      ev.dataTransfer.dropEffect = 'move';
    });
    currentRow.addEventListener('drop', (ev: any) => {
      if (sp.favoriteChartListEL !== null && sp.currentClickRow !== null && sp.currentClickRow !== currentRow) {
        let rect = currentRow.getBoundingClientRect();
        if (ev.clientY >= rect.top && ev.clientY < rect.top + rect.height / 2) {
          //向上移动
          sp.favoriteChartListEL!.insertRowBefore(sp.currentClickRow!, currentRow);
        } else if (ev.clientY <= rect.bottom && ev.clientY > rect.top + rect.height / 2) {
          //向下移动
          sp.favoriteChartListEL!.insertRowBefore(sp.currentClickRow!, currentRow.nextSibling);
        }
        sp.refreshFavoriteCanvas();
      }
    });
    currentRow.addEventListener('dragend', () => {
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
    });
  });
  SpSystemTrace.scrollViewWidth = sp.getScrollWidth();
  sp.rangeSelect.selectHandler = (rows, refreshCheckBox): void => {
    rows.forEach((item) => {
      sp.setAttribute('clickRow', item.rowType!);
      sp.setAttribute('rowName', item.name);
      sp.setAttribute('rowId', item.rowId!);
    });
    if (rows.length == 0) {
      const allRows = [
        ...sp.shadowRoot!.querySelectorAll<TraceRow<any>>('trace-row'),
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
        sp.traceSheetEL?.setAttribute('mode', 'hidden');
      }
      return;
    }
    if (refreshCheckBox) {
      if (rows.length > 0) {
        sp.queryAllTraceRow().forEach((row) => {
          row.checkType = '0';
          if (row.folder) {
            row.childrenList.forEach((ite) => {
              ite.checkType = '0';
            });
          }
        });
        rows.forEach((it) => (it.checkType = '2'));
      } else {
        sp.queryAllTraceRow().forEach((row) => {
          row.checkType = '-1';
          if (row.folder) {
            row.childrenList.forEach((it) => {
              it.checkType = '-1';
            });
          }
        });
        return;
      }
    }
    if (!sp.isSelectClick) {
      sp.rangeTraceRow = [];
    }
    let selection = new SelectionParam();
    selection.cpuStateRowsId = sp.stateRowsId;
    selection.leftNs = TraceRow.rangeSelectObject?.startNS || 0;
    selection.rightNs = TraceRow.rangeSelectObject?.endNS || 0;
    selection.recordStartNs = (window as any).recordStartNS;
    rows.forEach((it) => {
      if (it.rowType == TraceRow.ROW_TYPE_CPU) {
        selection.cpus.push(parseInt(it.rowId!));
        info('load CPU traceRow id is : ', it.rowId);
      } else if (it.rowType == TraceRow.ROW_TYPE_CPU_STATE) {
        let filterId = parseInt(it.rowId!);
        if (selection.cpuStateFilterIds.indexOf(filterId) == -1) {
          selection.cpuStateFilterIds.push(filterId);
        }
      } else if (it.rowType == TraceRow.ROW_TYPE_CPU_FREQ) {
        let filterId = parseInt(it.rowId!);
        let filterName = it.name!;
        if (selection.cpuFreqFilterIds.indexOf(filterId) == -1) {
          selection.cpuFreqFilterIds.push(filterId);
        }
        if (selection.cpuFreqFilterNames.indexOf(filterName) == -1) {
          selection.cpuFreqFilterNames.push(filterName);
        }
      } else if (it.rowType == TraceRow.ROW_TYPE_CPU_FREQ_LIMIT) {
        selection.cpuFreqLimit.push({
          maxFilterId: it.getAttribute('maxFilterId'),
          minFilterId: it.getAttribute('minFilterId'),
          cpu: it.getAttribute('cpu'),
        });
      } else if (it.rowType == TraceRow.ROW_TYPE_PROCESS) {
        sp.pushPidToSelection(selection, it.rowId!);
        if (it.getAttribute('hasStartup') === 'true') {
          selection.startup = true;
        }
        if (it.getAttribute('hasStaticInit') === 'true') {
          selection.staticInit = true;
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
            selection.threadIds.push(parseInt(th.rowId!));
          } else if (th.rowType == TraceRow.ROW_TYPE_FUNC) {
            if (th.asyncFuncName) {
              selection.funAsync.push({
                name: th.asyncFuncName,
                pid: th.asyncFuncNamePID || 0,
              });
            } else {
              selection.funTids.push(parseInt(th.rowId!));
            }
          } else if (th.rowType == TraceRow.ROW_TYPE_MEM) {
            selection.processTrackIds.push(parseInt(th.rowId!));
          }
        });
        info('load process traceRow id is : ', it.rowId);
      } else if (it.rowType == TraceRow.ROW_TYPE_NATIVE_MEMORY) {
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
        if (!isExistPidInArray(selection.nativeMemoryAllProcess, process.pid)) {
          selection.nativeMemoryAllProcess.push(process);
        }
        if (selection.nativeMemoryCurrentIPid === -1) {
          selection.nativeMemoryCurrentIPid = process.ipid;
        }
        memoryRows.forEach((th) => {
          th.rangeSelect = true;
          th.checkType = '2';
          if (th.getAttribute('heap-type') === 'native_hook_statistic') {
            selection.nativeMemoryStatistic.push(th.rowId!);
          } else {
            selection.nativeMemory.push(th.rowId!);
          }
        });
        info('load nativeMemory traceRow id is : ', it.rowId);
      } else if (it.rowType == TraceRow.ROW_TYPE_STATIC_INIT) {
        selection.staticInit = true;
        sp.pushPidToSelection(selection, it.rowParentId!);
        info('load thread traceRow id is : ', it.rowId);
      } else if (it.rowType == TraceRow.ROW_TYPE_APP_STARTUP) {
        selection.startup = true;
        sp.pushPidToSelection(selection, it.rowParentId!);
        info('load thread traceRow id is : ', it.rowId);
      } else if (it.rowType == TraceRow.ROW_TYPE_THREAD) {
        sp.pushPidToSelection(selection, it.rowParentId!);
        selection.threadIds.push(parseInt(it.rowId!));
        info('load thread traceRow id is : ', it.rowId);
      } else if (it.rowType == TraceRow.ROW_TYPE_FUNC) {
        TabPaneTaskFrames.TaskArray = [];
        sp.pushPidToSelection(selection, it.rowParentId!);
        if (it.asyncFuncName) {
          selection.funAsync.push({
            name: it.asyncFuncName,
            pid: it.asyncFuncNamePID || 0,
          });
        } else {
          selection.funTids.push(parseInt(it.rowId!));
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
          selection.taskFramesData.push(...taskData);
        }
        info('load func traceRow id is : ', it.rowId);
      } else if (it.rowType == TraceRow.ROW_TYPE_MEM || it.rowType == TraceRow.ROW_TYPE_VIRTUAL_MEMORY) {
        if (it.rowType == TraceRow.ROW_TYPE_MEM) {
          selection.processTrackIds.push(parseInt(it.rowId!));
        } else {
          selection.virtualTrackIds.push(parseInt(it.rowId!));
        }
        info('load memory traceRow id is : ', it.rowId);
      } else if (it.rowType == TraceRow.ROW_TYPE_FPS) {
        selection.hasFps = true;
        info('load FPS traceRow id is : ', it.rowId);
      } else if (it.rowType == TraceRow.ROW_TYPE_HEAP) {
        const key = it.rowParentId!.split(' ');
        const process = {
          ipid: Number(key[key.length - 1]),
          pid: Number(key[key.length - 2]),
        };

        if (!isExistPidInArray(selection.nativeMemoryAllProcess, process.pid)) {
          selection.nativeMemoryAllProcess.push(process);
        }
        if (selection.nativeMemoryCurrentIPid === -1) {
          selection.nativeMemoryCurrentIPid = process.ipid;
        }
        if (selection.nativeMemoryAllProcess)
          if (it.getAttribute('heap-type') === 'native_hook_statistic') {
            selection.nativeMemoryStatistic.push(it.rowId!);
          } else {
            selection.nativeMemory.push(it.rowId!);
          }
        info('load nativeMemory traceRow id is : ', it.rowId);
      } else if (it.rowType == TraceRow.ROW_TYPE_MONITOR) {
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
            selection.cpuAbilityIds.push(th.rowId!);
          } else if (th.rowType == TraceRow.ROW_TYPE_MEMORY_ABILITY) {
            selection.memoryAbilityIds.push(th.rowId!);
          } else if (th.rowType == TraceRow.ROW_TYPE_DISK_ABILITY) {
            selection.diskAbilityIds.push(th.rowId!);
          } else if (th.rowType == TraceRow.ROW_TYPE_NETWORK_ABILITY) {
            selection.networkAbilityIds.push(th.rowId!);
          } else if (th.rowType == TraceRow.ROW_TYPE_DMA_ABILITY) {
            selection.dmaAbilityData.push(...intersectData(th)!);
          } else if (th.rowType == TraceRow.ROW_TYPE_GPU_MEMORY_ABILITY) {
            selection.gpuMemoryAbilityData.push(...intersectData(th)!);
          } else if (th.rowType === TraceRow.ROW_TYPE_PURGEABLE_TOTAL_ABILITY) {
            selection.purgeableTotalAbility.push(...intersectData(th));
          } else if (th.rowType === TraceRow.ROW_TYPE_PURGEABLE_PIN_ABILITY) {
            selection.purgeablePinAbility.push(...intersectData(th));
          }
        });
      } else if (it.rowType == TraceRow.ROW_TYPE_CPU_ABILITY) {
        selection.cpuAbilityIds.push(it.rowId!);
        info('load CPU Ability traceRow id is : ', it.rowId);
      } else if (it.rowType == TraceRow.ROW_TYPE_MEMORY_ABILITY) {
        selection.memoryAbilityIds.push(it.rowId!);
        info('load Memory Ability traceRow id is : ', it.rowId);
      } else if (it.rowType == TraceRow.ROW_TYPE_DISK_ABILITY) {
        selection.diskAbilityIds.push(it.rowId!);
        info('load DiskIo Ability traceRow id is : ', it.rowId);
      } else if (it.rowType == TraceRow.ROW_TYPE_NETWORK_ABILITY) {
        selection.networkAbilityIds.push(it.rowId!);
        info('load Network Ability traceRow id is : ', it.rowId);
      } else if (it.rowType == TraceRow.ROW_TYPE_DMA_ABILITY) {
        selection.dmaAbilityData.push(...intersectData(it)!);
      } else if (it.rowType == TraceRow.ROW_TYPE_GPU_MEMORY_ABILITY) {
        selection.gpuMemoryAbilityData.push(...intersectData(it)!);
      } else if (it.rowType?.startsWith(TraceRow.ROW_TYPE_SDK)) {
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
          selection.sdkCounterIds.push(it.rowId!);
        }
        if (it.rowType == TraceRow.ROW_TYPE_SDK_SLICE) {
          selection.sdkSliceIds.push(it.rowId!);
        }
      } else if (it.rowType?.startsWith('hiperf')) {
        if (it.rowType == TraceRow.ROW_TYPE_HIPERF_EVENT || it.rowType == TraceRow.ROW_TYPE_HIPERF_REPORT) {
          return;
        }
        selection.perfEventTypeId = it.drawType === -2 ? undefined : it.drawType;
        selection.perfSampleIds.push(1);
        if (it.rowType === TraceRow.ROW_TYPE_PERF_CALLCHART) {
          let setting = it.getRowSettingKeys();
          if (setting && setting.length > 0) {
            //type 0:cpu,1:process,2:thread
            let key: string = setting[0];
            let id = Number(key.split('-')[0]);
            if (key.includes('p')) {
              selection.perfProcess.push(id);
            } else if (key.includes('t')) {
              selection.perfThread.push(id);
            } else {
              selection.perfCpus.push(id);
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
          selection.perfAll = true;
        }
        if (it.rowType == TraceRow.ROW_TYPE_HIPERF_CPU) {
          selection.perfCpus.push(it.index);
        }
        if (it.rowType == TraceRow.ROW_TYPE_HIPERF_PROCESS) {
          selection.perfProcess.push(parseInt(it.rowId!.split('-')[0]));
        }
        if (it.rowType == TraceRow.ROW_TYPE_HIPERF_THREAD) {
          selection.perfThread.push(parseInt(it.rowId!.split('-')[0]));
        }
      } else if (it.rowType == TraceRow.ROW_TYPE_FILE_SYSTEM) {
        if (it.rowId == 'FileSystemLogicalWrite') {
          if (selection.fileSystemType.length == 0) {
            selection.fileSystemType = [0, 1, 3];
          } else {
            if (selection.fileSystemType.indexOf(3) == -1) {
              selection.fileSystemType.push(3);
            }
          }
        } else if (it.rowId == 'FileSystemLogicalRead') {
          if (selection.fileSystemType.length == 0) {
            selection.fileSystemType = [0, 1, 2];
          } else {
            if (selection.fileSystemType.indexOf(2) == -1) {
              selection.fileSystemType.push(2);
            }
          }
        } else if (it.rowId == 'FileSystemVirtualMemory') {
          selection.fileSysVirtualMemory = true;
        } else if (it.rowId == 'FileSystemDiskIOLatency') {
          selection.diskIOLatency = true;
        } else {
          if (!selection.diskIOLatency) {
            let arr = it.rowId!.split('-').reverse();
            let ipid = parseInt(arr[0]);
            if (selection.diskIOipids.indexOf(ipid) == -1) {
              selection.diskIOipids.push(ipid);
            }
            if (arr[1] == 'read') {
              selection.diskIOReadIds.indexOf(ipid) == -1 ? selection.diskIOReadIds.push(ipid) : '';
            } else if (arr[1] == 'write') {
              selection.diskIOWriteIds.indexOf(ipid) == -1 ? selection.diskIOWriteIds.push(ipid) : '';
            }
          }
        }
      } else if (it.rowType == TraceRow.ROW_TYPE_POWER_ENERGY) {
        selection.powerEnergy.push(it.rowId!);
      } else if (it.rowType == TraceRow.ROW_TYPE_SYSTEM_ENERGY) {
        selection.systemEnergy.push(it.rowId!);
      } else if (it.rowType == TraceRow.ROW_TYPE_ANOMALY_ENERGY) {
        selection.anomalyEnergy.push(it.rowId!);
      } else if (it.rowType == TraceRow.ROW_TYPE_SYSTEM_ENERGY) {
        info('load anomaly Energy traceRow id is : ', it.rowId);
      } else if (it.rowType == TraceRow.ROW_TYPE_VM_TRACKER_SMAPS) {
        selection.smapsType.push(...intersectData(it)!);
        let sMapsChildRows: Array<TraceRow<any>> = [
          ...sp.shadowRoot!.querySelectorAll<TraceRow<any>>(`trace-row[row-parent-id='${it.rowId}']`),
        ];
        if (!it.expansion) {
          sMapsChildRows = [...it.childrenList];
        }
        sMapsChildRows.forEach((item) => {
          item.rangeSelect = true;
          if (item.rowType == TraceRow.ROW_TYPE_VM_TRACKER_SMAPS) {
            selection.smapsType.push(...intersectData(item)!);
          }
        });
      } else if (it.rowType == TraceRow.ROW_TYPE_VMTRACKER_SHM) {
        selection.vmtrackershm.push(...intersectData(it)!);
      } else if (it.rowType == TraceRow.ROW_TYPE_CLOCK) {
        selection.clockMapData.set(it.rowId || '', it.getCacheData);
      } else if (it.rowType == TraceRow.ROW_TYPE_IRQ) {
        if (it.getAttribute('cat') === 'irq') {
          selection.irqCallIds.push(parseInt(it.getAttribute('callId') || '-1'));
        } else {
          selection.softIrqCallIds.push(parseInt(it.getAttribute('callId') || '-1'));
        }
      } else if (it.rowType === TraceRow.ROW_TYPE_VM_TRACKER) {
        let vMTrackerChildRows: Array<TraceRow<any>> = [
          ...sp.shadowRoot!.querySelectorAll<TraceRow<any>>(`trace-row[row-parent-id='${it.rowId}']`),
        ];
        if (!it.expansion) {
          vMTrackerChildRows = [...it.childrenList];
        }
        vMTrackerChildRows.forEach((th) => {
          th.rangeSelect = true;
          if (th.rowType === TraceRow.ROW_TYPE_DMA_VMTRACKER) {
            selection.dmaVmTrackerData.push(...intersectData(th)!);
          } else if (th.rowType === TraceRow.ROW_TYPE_SYS_MEMORY_GPU) {
            let vMTrackerGpuChildRows: Array<TraceRow<any>> = [
              ...sp.shadowRoot!.querySelectorAll<TraceRow<any>>(`trace-row[row-parent-id='${th.rowId}']`),
            ];
            if (!th.expansion) {
              vMTrackerGpuChildRows = [...th.childrenList];
            }
            vMTrackerGpuChildRows.forEach((item) => {
              item.rangeSelect = true;
              if (item.rowType == TraceRow.ROW_TYPE_GPU_MEMORY_VMTRACKER) {
                selection.gpuMemoryTrackerData.push(...intersectData(item)!);
              } else if (item.rowType == TraceRow.ROW_TYPE_SYS_MEMORY_GPU_GL) {
                selection.gpu.gl =
                  item.dataListCache.filter(
                    (it) =>
                      (it.startNs >= selection.leftNs && it.startNs <= selection.rightNs) ||
                      (it.endNs >= selection.leftNs && it.endNs <= selection.rightNs)
                  ).length > 0;
              } else if (item.rowType == TraceRow.ROW_TYPE_SYS_MEMORY_GPU_GRAPH) {
                selection.gpu.graph =
                  item.dataListCache.filter(
                    (it) =>
                      (it.startNs >= selection.leftNs && it.startNs <= selection.rightNs) ||
                      (it.endNs >= selection.leftNs && it.endNs <= selection.rightNs)
                  ).length > 0;
              } else if (item.rowType == TraceRow.ROW_TYPE_SYS_MEMORY_GPU_TOTAL) {
                selection.gpu.gpuTotal =
                  item.dataListCache.filter(
                    (it) =>
                      (it.startNs >= selection.leftNs && it.startNs <= selection.rightNs) ||
                      (it.endNs >= selection.leftNs && it.endNs <= selection.rightNs)
                  ).length > 0;
              } else if (item.rowType == TraceRow.ROW_TYPE_SYS_MEMORY_GPU_WINDOW) {
                selection.gpu.gpuWindow =
                  item.dataListCache.filter(
                    (it) =>
                      (it.startNs >= selection.leftNs && it.startNs <= selection.rightNs) ||
                      (it.endNs >= selection.leftNs && it.endNs <= selection.rightNs)
                  ).length > 0;
              }
            });
          } else if (th.rowType === TraceRow.ROW_TYPE_PURGEABLE_TOTAL_VM) {
            selection.purgeableTotalVM.push(...intersectData(th));
          } else if (th.rowType === TraceRow.ROW_TYPE_PURGEABLE_PIN_VM) {
            selection.purgeablePinVM.push(...intersectData(th));
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
                selection.smapsType.push(...intersectData(item)!);
              }
            });
          } else if (th.rowType == TraceRow.ROW_TYPE_VMTRACKER_SHM) {
            selection.vmtrackershm.push(...intersectData(th)!);
          }
        });
      } else if (it.rowType == TraceRow.ROW_TYPE_SYS_MEMORY_GPU) {
        let vMTrackerGpuChildRows: Array<TraceRow<any>> = [
          ...sp.shadowRoot!.querySelectorAll<TraceRow<any>>(`trace-row[row-parent-id='${it.rowId}']`),
        ];
        if (!it.expansion) {
          vMTrackerGpuChildRows = [...it.childrenList];
        }
        vMTrackerGpuChildRows.forEach((th) => {
          th.rangeSelect = true;
          if (th.rowType == TraceRow.ROW_TYPE_GPU_MEMORY_VMTRACKER) {
            selection.gpuMemoryTrackerData.push(...intersectData(th)!);
          } else if (th.rowType == TraceRow.ROW_TYPE_SYS_MEMORY_GPU_GL) {
            selection.gpu.gl =
              th.dataListCache.filter(
                (it) =>
                  (it.startNs >= selection.leftNs && it.startNs <= selection.rightNs) ||
                  (it.endNs >= selection.leftNs && it.endNs <= selection.rightNs)
              ).length > 0;
          } else if (th.rowType == TraceRow.ROW_TYPE_SYS_MEMORY_GPU_GRAPH) {
            selection.gpu.graph =
              th.dataListCache.filter(
                (it) =>
                  (it.startNs >= selection.leftNs && it.startNs <= selection.rightNs) ||
                  (it.endNs >= selection.leftNs && it.endNs <= selection.rightNs)
              ).length > 0;
          } else if (th.rowType == TraceRow.ROW_TYPE_SYS_MEMORY_GPU_TOTAL) {
            selection.gpu.gpuTotal =
              th.dataListCache.filter(
                (it) =>
                  (it.startNs >= selection.leftNs && it.startNs <= selection.rightNs) ||
                  (it.endNs >= selection.leftNs && it.endNs <= selection.rightNs)
              ).length > 0;
          } else if (th.rowType == TraceRow.ROW_TYPE_SYS_MEMORY_GPU_WINDOW) {
            selection.gpu.gpuWindow =
              th.dataListCache.filter(
                (it) =>
                  (it.startNs >= selection.leftNs && it.startNs <= selection.rightNs) ||
                  (it.endNs >= selection.leftNs && it.endNs <= selection.rightNs)
              ).length > 0;
          }
        });
      } else if (it.rowType == TraceRow.ROW_TYPE_GPU_MEMORY_VMTRACKER) {
        selection.gpuMemoryTrackerData.push(...intersectData(it)!);
      } else if (it.rowType == TraceRow.ROW_TYPE_DMA_VMTRACKER) {
        selection.dmaVmTrackerData.push(...intersectData(it)!);
      } else if (it.rowType == TraceRow.ROW_TYPE_SYS_MEMORY_GPU_GL) {
        selection.gpu.gl =
          it.dataListCache.filter(
            (it) =>
              (it.startNs >= selection.leftNs && it.startNs <= selection.rightNs) ||
              (it.endNs >= selection.leftNs && it.endNs <= selection.rightNs)
          ).length > 0;
      } else if (it.rowType === TraceRow.ROW_TYPE_SYS_MEMORY_GPU_GRAPH) {
        selection.gpu.graph =
          it.dataListCache.filter(
            (it) =>
              (it.startNs >= selection.leftNs && it.startNs <= selection.rightNs) ||
              (it.endNs >= selection.leftNs && it.endNs <= selection.rightNs)
          ).length > 0;
      } else if (it.rowType == TraceRow.ROW_TYPE_SYS_MEMORY_GPU_TOTAL) {
        selection.gpu.gpuTotal =
          it.dataListCache.filter(
            (it) =>
              (it.startNs >= selection.leftNs && it.startNs <= selection.rightNs) ||
              (it.endNs >= selection.leftNs && it.endNs <= selection.rightNs)
          ).length > 0;
      } else if (it.rowType == TraceRow.ROW_TYPE_SYS_MEMORY_GPU_WINDOW) {
        selection.gpu.gpuWindow =
          it.dataListCache.filter(
            (it) =>
              (it.startNs >= selection.leftNs && it.startNs <= selection.rightNs) ||
              (it.endNs >= selection.leftNs && it.endNs <= selection.rightNs)
          ).length > 0;
      } else if (it.rowType == TraceRow.ROW_TYPE_JANK) {
        let isIntersect = (filterJank: JanksStruct, rangeData: RangeSelectStruct) =>
          Math.max(filterJank.ts! + filterJank.dur!, rangeData!.endNS || 0) -
            Math.min(filterJank.ts!, rangeData!.startNS || 0) <
          filterJank.dur! + (rangeData!.endNS || 0) - (rangeData!.startNS || 0);
        if (it.name == 'Actual Timeline') {
          if (it.rowParentId === 'frameTime') {
            it.dataListCache.forEach((jankData: any) => {
              if (isIntersect(jankData, TraceRow.rangeSelectObject!)) {
                selection.jankFramesData.push(jankData);
              }
            });
          } else {
            selection.jankFramesData.push(it.rowParentId);
          }
        } else if (it.folder) {
          selection.jankFramesData = [];
          it.childrenList.forEach((child) => {
            if (child.rowType == TraceRow.ROW_TYPE_JANK && child.name == 'Actual Timeline') {
              if (it.rowParentId === 'frameTime') {
                it.dataListCache.forEach((jankData: any) => {
                  if (isIntersect(jankData, TraceRow.rangeSelectObject!)) {
                    selection.jankFramesData.push(jankData);
                  }
                });
              } else {
                selection.jankFramesData.push(child.rowParentId);
              }
            }
          });
        }
      } else if (it.rowType == TraceRow.ROW_TYPE_HEAP_TIMELINE) {
        let endNS = TraceRow.rangeSelectObject?.endNS ? TraceRow.rangeSelectObject?.endNS : TraceRow.range?.endNS;
        let startNS = TraceRow.rangeSelectObject?.startNS
          ? TraceRow.rangeSelectObject?.startNS
          : TraceRow.range?.startNS;
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
        if (startNS! <= TraceRow.range?.startNS!) {
          minNodeId = HeapDataInterface.getInstance().getMinNodeId(sp.snapshotFiles!.id);
        }
        //If you select the box from the ending
        if (
          endNS! >= TraceRow.range?.endNS! ||
          endNS! >= it.dataListCache[it.dataListCache.length - 1].timestampUs * 1000
        ) {
          maxNodeId = HeapDataInterface.getInstance().getMaxNodeId(sp.snapshotFiles!.id);
        }
        let summary = (sp.traceSheetEL?.shadowRoot?.querySelector('#tabs') as LitTabs)
          ?.querySelector('#box-heap-summary')
          ?.querySelector('tabpane-summary') as TabPaneSummary;
        summary.initSummaryData(sp.snapshotFiles!, minNodeId, maxNodeId);
        selection.jsMemory.push(1);
      } else if (it.rowType == TraceRow.ROW_TYPE_JS_CPU_PROFILER) {
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
        selection.jsCpuProfilerData = jsCpuProfilerData;
      } else if (it.rowType == TraceRow.ROW_TYPE_FRAME_ANIMATION) {
        let isIntersect = (animationStruct: FrameAnimationStruct, selectStruct: RangeSelectStruct) =>
          Math.max(animationStruct.startTs! + animationStruct.dur!, selectStruct!.endNS || 0) -
            Math.min(animationStruct.startTs!, selectStruct!.startNS || 0) <
          animationStruct.dur! + (selectStruct!.endNS || 0) - (selectStruct!.startNS || 0);
        let frameAnimationList = it.dataListCache.filter((frameAnimationBean: FrameAnimationStruct) => {
          return isIntersect(frameAnimationBean, TraceRow.rangeSelectObject!);
        });
        selection.frameAnimation.push(...frameAnimationList);
      } else if (it.rowType == TraceRow.ROW_TYPE_FRAME_DYNAMIC) {
        let appName = it.getAttribute('model-name');
        let isSelect = (dynamicStruct: FrameDynamicStruct, b: RangeSelectStruct) =>
          dynamicStruct.ts >= b.startNS! && dynamicStruct.ts <= b.endNS!;
        let frameDynamicList = it.dataListCache.filter(
          (frameAnimationBean: FrameDynamicStruct) =>
            isSelect(frameAnimationBean, TraceRow.rangeSelectObject!) &&
            frameAnimationBean.groupId !== -1 &&
            frameAnimationBean.appName === appName
        );
        selection.frameDynamic.push(...frameDynamicList);
      } else if (it.rowType == TraceRow.ROW_TYPE_FRAME_SPACING) {
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
        selection.frameSpacing.push(...frameDatas);
      } else if (it.rowType == TraceRow.ROW_TYPE_PURGEABLE_TOTAL_ABILITY) {
        selection.purgeableTotalAbility.push(...intersectData(it));
      } else if (it.rowType == TraceRow.ROW_TYPE_PURGEABLE_PIN_ABILITY) {
        selection.purgeablePinAbility.push(...intersectData(it));
      } else if (it.rowType == TraceRow.ROW_TYPE_PURGEABLE_TOTAL_VM) {
        selection.purgeableTotalVM.push(...intersectData(it));
      } else if (it.rowType == TraceRow.ROW_TYPE_PURGEABLE_PIN_VM) {
        selection.purgeablePinVM.push(...intersectData(it));
      } else if (it.rowType === TraceRow.ROW_TYPE_LOGS) {
        selection.hiLogs.push(it.rowId!);
      } else if (it.rowType === TraceRow.ROW_TYPE_HI_SYSEVENT) {
        selection.hiSysEvents.push(it.rowId!);
      }
      if (sp.rangeTraceRow!.length !== rows.length) {
        let event = sp.createPointEvent(it);
        SpStatisticsHttpUtil.addOrdinaryVisitAction({
          action: 'trace_row',
          event: event,
        });
      }
    });
    sp.rangeTraceRow = rows;
    sp.isSelectClick = false;
    if (selection.diskIOipids.length > 0 && !selection.diskIOLatency) {
      selection.promiseList.push(
        queryEbpfSamplesCount(
          TraceRow.rangeSelectObject?.startNS || 0,
          TraceRow.rangeSelectObject?.endNS || 0,
          selection.diskIOipids
        ).then((res) => {
          if (res.length > 0) {
            selection.fsCount = res[0].fsCount;
            selection.vmCount = res[0].vmCount;
          }
          return new Promise((resolve) => resolve(1));
        })
      );
    }
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
  };
  // @ts-ignore
  new ResizeObserver((entries) => {
    TraceRow.FRAME_WIDTH = sp.clientWidth - 249 - sp.getScrollWidth();
    requestAnimationFrame(() => {
      sp.timerShaftEL?.updateWidth(sp.clientWidth - 1 - sp.getScrollWidth());
      sp.shadowRoot!.querySelectorAll<TraceRow<any>>('trace-row').forEach((it) => {
        it.updateWidth(sp.clientWidth);
      });
    });
  }).observe(sp);

  new ResizeObserver((entries) => {
    sp.canvasPanelConfig();
    if (sp.traceSheetEL!.getAttribute('mode') == 'hidden') {
      sp.timerShaftEL?.removeTriangle('triangle');
    }
    sp.refreshFavoriteCanvas();
    sp.refreshCanvas(true);
  }).observe(sp.rowsPaneEL!);
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

  sp.intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((it) => {
        let tr = it.target as TraceRow<any>;
        tr.intersectionRatio = it.intersectionRatio;
        if (!it.isIntersecting) {
          tr.sleeping = true;
          sp.invisibleRows.indexOf(tr) == -1 && sp.invisibleRows.push(tr);
          sp.visibleRows = sp.visibleRows.filter((it) => !it.sleeping);
        } else {
          tr.sleeping = false;
          sp.visibleRows.indexOf(tr) == -1 && sp.visibleRows.push(tr);
          sp.invisibleRows = sp.invisibleRows.filter((it) => it.sleeping);
        }
        sp.visibleRows
          .filter((vr) => vr.expansion)
          .forEach((vr) => {
            vr.sticky = sp.visibleRows.some((vro) => vr.childrenList.filter((it) => !it.collect).indexOf(vro) >= 0);
          });
        sp.visibleRows
          .filter((vr) => !vr.folder && vr.parentRowEl && vr.parentRowEl.expansion)
          .forEach((vr) => (vr.parentRowEl!.sticky = true));
        if (sp.handler) {
          clearTimeout(sp.handler);
        }
        sp.handler = setTimeout(() => sp.refreshCanvas(false), 100);
      });
    },
    { threshold: [0, 0.01, 0.99, 1] }
  );
  window.addEventListener('keydown', (ev) => {
    if (ev.key.toLocaleLowerCase() === 'escape') {
      sp.queryAllTraceRow().forEach((it) => {
        it.checkType = '-1';
      });
      TraceRow.rangeSelectObject = undefined;
      sp.rangeSelect.rangeTraceRow = [];
      sp.selectStructNull();
      sp.timerShaftEL?.setSlicesMark();
      sp.traceSheetEL?.setAttribute('mode', 'hidden');
      sp.removeLinkLinesByBusinessType('janks', 'task');
    }
  });
  sp.chartManager = new SpChartManager(sp);
  sp.canvasPanel = sp.shadowRoot!.querySelector<HTMLCanvasElement>('#canvas-panel')!;
  sp.canvasPanelCtx = sp.canvasPanel.getContext('2d');
  sp.canvasFavoritePanelCtx = sp.favoriteChartListEL!.context();
  sp.canvasPanelConfig();
  window.subscribe(window.SmartEvent.UI.SliceMark, (data) => {
    sp.sliceMarkEventHandler(data);
  });
  window.subscribe(window.SmartEvent.UI.TraceRowComplete, (tr) => {});
  window.subscribe(window.SmartEvent.UI.RefreshCanvas, () => {
    sp.refreshCanvas(false);
  });
  window.subscribe(window.SmartEvent.UI.KeyboardEnable, (tr) => {
    sp.keyboardEnable = tr.enable;
    if (!sp.keyboardEnable) {
      sp.stopWASD();
    }
  });
  window.subscribe(window.SmartEvent.UI.CollapseAllLane, (collapse: boolean) => {
    if (!collapse) {
      // 一键折叠之前，记录当前打开的泳道图
      sp.expandRowList = Array.from(sp.rowsEL!.querySelectorAll<TraceRow<any>>(`trace-row[folder][expansion]`)) || [];
    }
    sp.collapseAll = true;
    sp.setAttribute('disable', '');
    sp.expandRowList!.forEach((it) => (it.expansion = collapse));
    sp.collapseAll = false;
    sp.removeAttribute('disable');
    sp.refreshCanvas(true);
  });
  window.subscribe(window.SmartEvent.UI.MouseEventEnable, (tr) => {
    sp.mouseEventEnable = tr.mouseEnable;
    if (sp.mouseEventEnable) {
      sp.removeAttribute('disable');
    } else {
      sp.setAttribute('disable', '');
    }
  });
  window.subscribe(window.SmartEvent.UI.CollectGroupChange, (group: string) => {
    sp.currentCollectGroup = group;
  });
}

export function SpSystemTraceShowStruct(
  sp: SpSystemTrace,
  previous: boolean,
  currentIndex: number,
  structs: Array<any>,
  retargetIndex?: number
) {
  if (structs.length == 0) {
    return 0;
  }
  let findIndex = -1;
  if (previous) {
    if (retargetIndex) {
      findIndex = retargetIndex - 1;
    } else {
      for (let i = structs.length - 1; i >= 0; i--) {
        let it = structs[i];
        if (
          i < currentIndex &&
          it.startTime! >= TraceRow.range!.startNS &&
          it.startTime! + it.dur! <= TraceRow.range!.endNS
        ) {
          findIndex = i;
          break;
        }
      }
    }
  } else {
    if (currentIndex == -1) {
      findIndex = 0;
    } else {
      findIndex = structs.findIndex((it, idx) => {
        return (
          idx > currentIndex &&
          it.startTime! >= TraceRow.range!.startNS &&
          it.startTime! + it.dur! <= TraceRow.range!.endNS
        );
      });
    }
  }
  let findEntry: any;
  if (findIndex >= 0) {
    findEntry = structs[findIndex];
  } else {
    if (previous) {
      for (let i = structs.length - 1; i >= 0; i--) {
        let it = structs[i];
        if (it.startTime! + it.dur! < TraceRow.range!.startNS) {
          findIndex = i;
          break;
        }
      }
      if (findIndex == -1) {
        findIndex = structs.length - 1;
      }
    } else {
      findIndex = structs.findIndex((it) => it.startTime! > TraceRow.range!.endNS);
      if (findIndex == -1) {
        findIndex = 0;
      }
    }
    findEntry = structs[findIndex];
  }
  sp.moveRangeToCenter(findEntry.startTime!, findEntry.dur!);
  sp.queryAllTraceRow().forEach((item) => {
    item.highlight = false;
  });
  if (findEntry.type == 'cpu') {
    CpuStruct.selectCpuStruct = findEntry;
    CpuStruct.hoverCpuStruct = CpuStruct.selectCpuStruct;
    sp.queryAllTraceRow(`trace-row[row-type='cpu-data']`, (row) => row.rowType === 'cpu-data').forEach((item) => {
      if (item.rowId === `${findEntry.cpu}`) {
        sp.rechargeCpuData(
          findEntry,
          item.dataListCache.find((it) => it.startTime > findEntry.startTime)
        );
        item.fixedList = [findEntry];
      }
      item.highlight = item.rowId == `${findEntry.cpu}`;
      item.draw(true);
    });
    sp.scrollToProcess(`${findEntry.cpu}`, '', 'cpu-data', true);
    sp.onClickHandler(TraceRow.ROW_TYPE_CPU);
  } else if (findEntry.type == 'func') {
    sp.observerScrollHeightEnable = true;
    sp.moveRangeToCenter(findEntry.startTime!, findEntry.dur!);
    sp.scrollToActFunc(
      {
        startTs: findEntry.startTime,
        dur: findEntry.dur,
        tid: findEntry.tid,
        pid: findEntry.pid,
        depth: findEntry.depth,
        argsetid: findEntry.argsetid,
        funName: findEntry.funName,
        cookie: findEntry.cookie,
      },
      true
    );
  } else if (findEntry.type == 'thread||process') {
    let threadProcessRow = sp.rowsEL?.querySelectorAll<TraceRow<ThreadStruct>>('trace-row')[0];
    if (threadProcessRow) {
      let filterRow = threadProcessRow.childrenList.filter(
        (row) => row.rowId === findEntry.rowId && row.rowId === findEntry.rowType
      )[0];
      filterRow!.highlight = true;
      sp.closeAllExpandRows(findEntry.rowParentId);
      sp.scrollToProcess(`${findEntry.rowId}`, `${findEntry.rowParentId}`, findEntry.rowType, true);
      let completeEntry = () => {
        sp.hoverStructNull();
        sp.selectStructNull();
        sp.wakeupListNull();
        sp.scrollToProcess(`${findEntry.rowId}`, `${findEntry.rowParentId}`, findEntry.rowType, true);
      };
      if (filterRow!.isComplete) {
        completeEntry();
      } else {
        filterRow!.onComplete = completeEntry;
      }
    }
  } else if (findEntry.type == 'sdk') {
    let parentRow = sp.shadowRoot!.querySelector<TraceRow<any>>(`trace-row[row-type='sdk'][folder]`);
    if (parentRow) {
      let sdkRow = parentRow.childrenList.filter(
        (child) => child.rowId === findEntry.rowId && child.rowType === findEntry.rowType
      )[0];
      sdkRow!.highlight = true;
    }
    sp.hoverStructNull();
    sp.selectStructNull();
    sp.wakeupListNull();
    sp.onClickHandler(findEntry.rowType!);
    sp.closeAllExpandRows(findEntry.rowParentId);
    sp.scrollToProcess(`${findEntry.rowId}`, `${findEntry.rowParentId}`, findEntry.rowType, true);
  }
  sp.timerShaftEL?.drawTriangle(findEntry.startTime || 0, 'inverted');
  return findIndex;
}
export async function SpSystemTraceInit(
  sp: SpSystemTrace,
  param: { buf?: ArrayBuffer; url?: string },
  wasmConfigUri: string,
  progress: Function
) {
  progress('Load database', 6);
  sp.rowsPaneEL!.scroll({
    top: 0,
    left: 0,
  });
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
    SpSystemTrace.SDK_CONFIG_MAP = sdkConfigMap == undefined ? undefined : sdkConfigMap;
  }
  if (param.url) {
    let { status, msg } = await threadPool.initServer(param.url, progress);
    if (!status) {
      return { status: false, msg: msg };
    }
  }
  await sp.chartManager?.init(progress);
  let rowId: string = '';
  sp.rowsEL?.querySelectorAll<TraceRow<any>>('trace-row').forEach((it: any) => {
    if (it.name.includes('Ark Ts')) {
      rowId = it.rowId;
    }
    if (it.folder) it.addEventListener('expansion-change', sp.extracted(it));
  });
  progress('completed', 100);
  info('All TraceRow Data initialized');
  sp.loadTraceCompleted = true;
  sp.rowsEL!.querySelectorAll<TraceRow<any>>('trace-row').forEach((it) => {
    if (rowId !== '' && (it.rowId?.includes(rowId) || it.name.includes(rowId))) {
      it.addTemplateTypes('Ark Ts');
      for (let child of it.childrenList) {
        child.addTemplateTypes('Ark Ts');
      }
    }
    if (it.folder) {
      let offsetYTimeOut: any = undefined;
      it.addEventListener('expansion-change', (event: any) => {
        let max = [...sp.rowsPaneEL!.querySelectorAll('trace-row')].reduce((pre, cur) => pre + cur.clientHeight!, 0);
        let offset = sp.rowsPaneEL!.scrollHeight - max;
        sp.rowsPaneEL!.scrollTop = sp.rowsPaneEL!.scrollTop - offset;
        JankStruct.delJankLineFlag = false;
        if (offsetYTimeOut) {
          clearTimeout(offsetYTimeOut);
        }
        if (event.detail.expansion) {
          offsetYTimeOut = setTimeout(() => {
            sp.linkNodes.forEach((linkNode) => {
              JankStruct.selectJankStructList?.forEach((selectStruct: any) => {
                if (event.detail.rowId == selectStruct.pid) {
                  JankStruct.selectJankStruct = selectStruct;
                  JankStruct.hoverJankStruct = selectStruct;
                }
              });
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
            });
          }, 300);
        } else {
          if (JankStruct!.selectJankStruct) {
            JankStruct.selectJankStructList?.push(<JankStruct>JankStruct!.selectJankStruct);
          }
          offsetYTimeOut = setTimeout(() => {
            sp.linkNodes?.forEach((linkNode) => {
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
            });
          }, 300);
        }
        let refreshTimeOut = setTimeout(() => {
          sp.refreshCanvas(true);
          clearTimeout(refreshTimeOut);
        }, 360);
      });
    }
    if (sp.loadTraceCompleted) {
      sp.traceSheetEL?.displaySystemLogsData();
    }
    sp.intersectionObserver?.observe(it);
  });
  return { status: true, msg: 'success' };
}

export function SpSystemTraceInitPointToEvent(sp: SpSystemTrace) {
  sp.eventMap = {
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
}
