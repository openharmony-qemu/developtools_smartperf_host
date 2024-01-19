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

import {SpSystemTrace} from './SpSystemTrace';
import { TabPaneFrequencySample } from "./trace/sheet/cpu/TabPaneFrequencySample";
import { TabPaneCounterSample } from "./trace/sheet/cpu/TabPaneCounterSample";
import { RangeSelect } from "./trace/base/RangeSelect";
import { TraceRow } from "./trace/base/TraceRow";
import { SportRuler } from "./trace/timer-shaft/SportRuler";
import { SelectionParam } from "../bean/BoxSelection";
import {error, info} from "../../log/Log";
import { SpStatisticsHttpUtil } from "../../statistics/util/SpStatisticsHttpUtil";
import { queryEbpfSamplesCount } from "../database/sql/Memory.sql";
import { SpChartManager } from "./chart/SpChartManager";
import {ThreadStruct} from "../database/ui-worker/ProcedureWorkerThread";
import {FlagsConfig} from "./SpFlags";
import {threadPool} from "../database/SqlLite";
import {JankStruct} from "../database/ui-worker/ProcedureWorkerJank";
import {CpuStruct} from "../database/ui-worker/cpu/ProcedureWorkerCPU";
import {PairPoint} from "../database/ui-worker/ProcedureWorkerCommon";
import { TraceSheet } from './trace/base/TraceSheet';
import { TimerShaftElement } from './trace/TimerShaftElement';
import { SpChartList } from './trace/SpChartList';
type HTMLElementAlias = HTMLElement | null | undefined;

function rightButtonOnClick(sp: SpSystemTrace,rightStar: HTMLElementAlias) {
    Object.assign(sp, {
        ext(): string {
            return "Handle the right button click event";
        }
    })

    return function (event: any) {
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
    }
}
function rightStarOnClick(sp:SpSystemTrace) {
   return function (ev:any){
       let wakeupLists = [];
       wakeupLists.push(CpuStruct.selectCpuStruct?.cpu);
       for (let wakeupBean of SpSystemTrace.wakeupList) {
           wakeupLists.push(wakeupBean.cpu);
       }
       let wakeupCpuLists = Array.from(new Set(wakeupLists)).sort();
       for (let wakeupCpu of wakeupCpuLists) {
           let cpuFavoriteRow: any = sp.shadowRoot?.querySelector<TraceRow<any>>(
             `trace-row[row-type='cpu-data'][row-id='${wakeupCpu}']`
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
           cpuFavoriteRow.addEventListener('dragstart', cpuFavoriteRowDragStart(sp,cpuFavoriteRow));
           cpuFavoriteRow.addEventListener('dragover', cpuFavoriteRowDragOver(sp));
           cpuFavoriteRow.addEventListener('drop', cpuFavoriteRowDropHandler(sp,cpuFavoriteRow));
           cpuFavoriteRow.addEventListener('dragend', cpuFavoriteRowDragendHandler(sp));
       }
       sp.refreshFavoriteCanvas();
       sp.refreshCanvas(true);
   }
}
function cpuFavoriteRowDragStart(sp: SpSystemTrace, cpuFavoriteRow: any) {
    return function () {
        sp.currentClickRow = cpuFavoriteRow;
    }
}
function cpuFavoriteRowDragOver(sp: SpSystemTrace) {
    return function (ev:any){
        ev.preventDefault();
        ev.dataTransfer.dropEffect = 'move';
    }
}
function cpuFavoriteRowDropHandler(sp: SpSystemTrace, cpuFavoriteRow: any) {
    return function (ev:any){
        if (
          sp.favoriteChartListEL != null &&
          sp.currentClickRow != null &&
          sp.currentClickRow !== cpuFavoriteRow
        ) {
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
    }
}
function cpuFavoriteRowDragendHandler(sp: SpSystemTrace) {
    return function(){
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
    }
}
function triangleFlagHandler(sp:SpSystemTrace) {
    return function (event:any) {
        let temporaryTime = sp.timerShaftEL?.drawTriangle(event.detail.time, event.detail.type);
        if (event.detail.timeCallback && temporaryTime) event.detail.timeCallback(temporaryTime);
    };
}
function numberCalibrationHandler(sp: SpSystemTrace) {
    return function (event: any) {
        sp.timerShaftEL!.sportRuler!.times = event.detail.time;
        sp.timerShaftEL!.sportRuler!.counts = event.detail.counts;
        sp.timerShaftEL!.sportRuler!.durations = event.detail.durations;
        sp.timerShaftEL!.sportRuler?.draw();
    }
}
function flagChangeHandler(sp: SpSystemTrace) {
    return function (event: any) {
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
    }
}
function slicesChangeHandler(sp:SpSystemTrace) {
   return function (event: any) {
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
   }
}
function collectHandler(sp: SpSystemTrace) {
    return function (event: any) {
        let currentRow = event.detail.row;
        if (currentRow.collect) {
            collectHandlerYes(sp,currentRow,event);
        } else {
            collectHandlerNo(sp,currentRow,event);
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
        currentRow.addEventListener('drop', collectHandlerDrop(sp,currentRow));
        currentRow.addEventListener('dragend', collectHandlerDragEnd(sp));
    };
}
function collectHandlerNo(sp: SpSystemTrace, currentRow: any, event: any) {
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
function collectHandlerYes(sp: SpSystemTrace, currentRow: any, event: any){
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
}
function collectHandlerDrop(sp: SpSystemTrace, currentRow: HTMLDivElement|undefined|null) {
    return function (ev:any) {
        if (sp.favoriteChartListEL !== null && sp.currentClickRow !== null && sp.currentClickRow !== currentRow) {
            let rect = currentRow!.getBoundingClientRect();
            if (ev.clientY >= rect.top && ev.clientY < rect.top + rect.height / 2) {
                //向上移动
                sp.favoriteChartListEL!.insertRowBefore(sp.currentClickRow!, currentRow!);
            } else if (ev.clientY <= rect.bottom && ev.clientY > rect.top + rect.height / 2) {
                //向下移动
                sp.favoriteChartListEL!.insertRowBefore(sp.currentClickRow!, currentRow!.nextSibling!);
            }
            sp.refreshFavoriteCanvas();
        }
    };
}
function collectHandlerDragEnd(sp: SpSystemTrace) {
    return function (ev:any) {
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
function selectHandler(sp: SpSystemTrace) {
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
        selectHandlerRefreshCheckBox(sp,rows, refreshCheckBox);
        if (!sp.isSelectClick) {
            sp.rangeTraceRow = [];
        }
        selectHandlerRows(sp, rows);
    };
}
function selectHandlerRefreshCheckBox(sp: SpSystemTrace, rows: Array<TraceRow<any>>, refreshCheckBox: boolean) {
    if (refreshCheckBox) {
        if (rows.length > 0) {
            sp.queryAllTraceRow().forEach((row) => {
                row.checkType = '0';
                if (row.folder) {
                    row.childrenList.forEach((ite) => ite.checkType = '0');
                }
            });
            rows.forEach((it) => it.checkType = '2');
        } else {
            sp.queryAllTraceRow().forEach((row) => {
                row.checkType = '-1';
                if (row.folder) {
                    row.childrenList.forEach((it) => it.checkType = '-1');
                }
            });
            return;
        }
    }
}
function selectHandlerRows(sp: SpSystemTrace, rows: Array<TraceRow<any>>) {
    let selection = new SelectionParam();
    selection.cpuStateRowsId = sp.stateRowsId;
    selection.leftNs = TraceRow.rangeSelectObject?.startNS || 0;
    selection.rightNs = TraceRow.rangeSelectObject?.endNS || 0;
    selection.recordStartNs = (window as any).recordStartNS;
    rows.forEach((it) => {
        selection.pushSelection(it, sp);
        if (sp.rangeTraceRow!.length !== rows.length) {
            let event = sp.createPointEvent(it);
            SpStatisticsHttpUtil.addOrdinaryVisitAction({
                action: 'trace_row',
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
                  selection.fsCount = res[0].fsCount;
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
function resizeObserverHandler(sp:SpSystemTrace) {
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
}
function mutationObserverHandler(sp: SpSystemTrace) {
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
function intersectionObserverHandler(sp: SpSystemTrace) {
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
}
function observerHandler(sp: SpSystemTrace) {
    resizeObserverHandler(sp);
    mutationObserverHandler(sp);
    intersectionObserverHandler(sp);
}
function windowKeyDownHandler(sp: SpSystemTrace) {
    return function (ev: KeyboardEvent) {
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
    }
}
function smartEventSubscribe(sp: SpSystemTrace) {
    window.subscribe(window.SmartEvent.UI.SliceMark, (data) => sp.sliceMarkEventHandler(data));
    window.subscribe(window.SmartEvent.UI.TraceRowComplete, (tr) => {});
    window.subscribe(window.SmartEvent.UI.RefreshCanvas, () => sp.refreshCanvas(false));
    window.subscribe(window.SmartEvent.UI.KeyboardEnable, (tr) => {
        sp.keyboardEnable = tr.enable;
        if (!sp.keyboardEnable) {
            sp.stopWASD();
        }
    });
    window.subscribe(window.SmartEvent.UI.CollapseAllLane, (collapse: boolean) => {
        if (!collapse) {
            // 一键折叠之前，记录当前打开的泳道图
            sp.expandRowList =
              Array.from(sp.rowsEL!.querySelectorAll<TraceRow<any>>(`trace-row[folder][expansion]`)) || [];
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
    window.subscribe(window.SmartEvent.UI.CollectGroupChange, (group: string) => sp.currentCollectGroup = group);
}

export function documentInitEvent(sp:SpSystemTrace) : void{
    if (!document) {
        return
    }
    document.addEventListener('triangle-flag', triangleFlagHandler(sp));
    document.addEventListener('number_calibration', numberCalibrationHandler(sp));
    document.addEventListener('flag-change', flagChangeHandler(sp));
    document.addEventListener('slices-change', slicesChangeHandler(sp));
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
    document.addEventListener('collect', collectHandler(sp));
}

export function spSystemTraceInitElement(sp:SpSystemTrace){
    window.subscribe(window.SmartEvent.UI.LoadFinishFrame, () => sp.drawAllLines());
    sp.traceSheetEL = sp.shadowRoot?.querySelector<TraceSheet>('.trace-sheet');
    if (!sp || !sp.shadowRoot || !sp.traceSheetEL){
        return;
    }
    let rightButton: HTMLElement | null | undefined = sp.traceSheetEL.shadowRoot
      ?.querySelector('#current-selection > tabpane-current-selection')
      ?.shadowRoot?.querySelector('#rightButton');
    let rightStar: HTMLElement | null | undefined =sp.traceSheetEL.shadowRoot
      ?.querySelector('#current-selection > tabpane-current-selection')
      ?.shadowRoot?.querySelector('#right-star');
    sp.tipEL = sp.shadowRoot.querySelector<HTMLDivElement>('.tip');
    sp.rowsPaneEL = sp.shadowRoot.querySelector<HTMLDivElement>('.rows-pane');
    sp.rowsEL = sp.rowsPaneEL;
    sp.spacerEL = sp.shadowRoot.querySelector<HTMLDivElement>('.spacer');
    sp.timerShaftEL = sp.shadowRoot.querySelector<TimerShaftElement>('.timer-shaft');
    sp.favoriteChartListEL = sp.shadowRoot.querySelector<SpChartList>('#favorite-chart-list');
    if (!sp.traceSheetEL.shadowRoot){
        return;
    }
    sp.tabCpuFreq = sp.traceSheetEL.shadowRoot.querySelector<TabPaneFrequencySample>('tabpane-frequency-sample');
    sp.tabCpuState = sp.traceSheetEL.shadowRoot.querySelector<TabPaneCounterSample>('tabpane-counter-sample');
    sp.rangeSelect = new RangeSelect(sp);
    rightButton?.addEventListener('click', rightButtonOnClick(sp,rightStar));
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

function moveRangeToCenterAndHighlight(sp: SpSystemTrace, findEntry: any) {
    sp.moveRangeToCenter(findEntry.startTime!, findEntry.dur!);
    sp.queryAllTraceRow().forEach((item) => {
        item.highlight = false;
    });
    if (findEntry.type == 'cpu') {
        findEntryTypeCpu(sp, findEntry);
    } else if (findEntry.type == 'func') {
        findEntryTypeFunc(sp, findEntry);
    } else if (findEntry.type == 'thread||process') {
        findEntryTypeThreadProcess(sp, findEntry);
    } else if (findEntry.type == 'sdk') {
        findEntryTypeSdk(sp, findEntry);
    }
    sp.timerShaftEL?.drawTriangle(findEntry.startTime || 0, 'inverted');
}

export function spSystemTraceShowStruct(sp:SpSystemTrace,previous: boolean, currentIndex: number, structs: Array<any>, retargetIndex?: number){
    if (structs.length == 0) {
        return 0;
    }
    let findIndex = spSystemTraceShowStructFindIndex(sp,previous,currentIndex,structs,retargetIndex);
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
    moveRangeToCenterAndHighlight(sp, findEntry);
    return findIndex;
}
function spSystemTraceShowStructFindIndex(sp: SpSystemTrace,  previous: boolean, currentIndex: number, structs: Array<any>, retargetIndex: number | undefined) {
    let findIndex = -1;
    if (previous) {
        if (retargetIndex) {
            findIndex = retargetIndex - 1;
        } else {
            for (let i = structs.length - 1; i >= 0; i--) {
                let it = structs[i];
                if (
                  i < currentIndex
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
                  idx > currentIndex
                );
            });
        }
    }
    return findIndex;
}
function findEntryTypeCpu(sp: SpSystemTrace, findEntry: any) {
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
}
function findEntryTypeFunc(sp: SpSystemTrace, findEntry: any) {
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
}
function findEntryTypeThreadProcess(sp: SpSystemTrace, findEntry: any) {
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
}
function findEntryTypeSdk(sp: SpSystemTrace, findEntry: any) {
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
async function spSystemTraceInitBuffer(sp:SpSystemTrace,param:{buf?:ArrayBuffer;Url?:string},wasmConfigUri:string,progress:Function) {
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
        return null
    }else{
        return null;
    }
}
async function spSystemTraceInitUrl(sp:SpSystemTrace,param: { buf?: ArrayBuffer; url?: string }, wasmConfigUri: string, progress: Function) {
    if (param.url) {
        let { status, msg } = await threadPool.initServer(param.url, progress);
        if (!status) {
            return { status: false, msg: msg };
        }else{
            return null;
        }
    }else{
        return null;
    }
}
export async function spSystemTraceInit(sp:SpSystemTrace,param: { buf?: ArrayBuffer; url?: string }, wasmConfigUri: string, progress: Function) {
    progress('Load database', 6);
    sp.rowsPaneEL!.scroll({top: 0, left: 0});
    let rsBuf = await spSystemTraceInitBuffer(sp,param,wasmConfigUri,progress);
    if (rsBuf) {
        return rsBuf;
    }
    let rsUrl = await spSystemTraceInitUrl(sp,param,wasmConfigUri,progress);
    if (rsUrl) {
        return rsUrl;
    }
    await sp.chartManager?.init(progress);
    let rowId: string = '';
    sp.rowsEL?.querySelectorAll<TraceRow<any>>('trace-row').forEach((it) => {
        if (it.name.includes('Ark Ts')) {
            rowId = it.rowId!;
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
            it.addEventListener('expansion-change', expansionChangeHandler(sp,offsetYTimeOut));
        }
        if (sp.loadTraceCompleted) {
            sp.traceSheetEL?.displaySystemLogsData();
        }
        sp.intersectionObserver?.observe(it);
    });
    return { status: true, msg: 'success' };
}
function expansionChangeHandler(sp: SpSystemTrace, offsetYTimeOut: any) {
    return function (event: any) {
        let max = [...sp.rowsPaneEL!.querySelectorAll('trace-row')].reduce(
          (pre, cur) => pre + cur.clientHeight!, 0);
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
    }
}
function linkNodeHandler(linkNode: PairPoint[], sp: SpSystemTrace){
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
    'process': 'Process',
    'native-memory': 'Native Memory',
    'thread': 'Thread',
    'func': 'Func',
    'mem': 'Memory',
    'virtual-memory-cell': 'Virtual Memory',
    'virtual-memory-group': 'Virtual Memory',
    'fps': 'FPS',
    'ability-monitor': 'Ability Monitor',
    'cpu-ability': 'Cpu Ability',
    'memory-ability': 'Memory Ability',
    'disk-ability': 'DiskIO Ability',
    'network-ability': 'Network Ability',
    'sdk': 'Sdk',
    'sdk-counter': 'SDK Counter',
    'sdk-slice': 'Sdk Slice',
    'energy': 'Energy',
    'power-energy': 'Power Event',
    'system-energy': 'System Event',
    'anomaly-energy': 'Anomaly Event',
    'clock-group': 'Clocks',
    'clock': 'clock',
    'irq-group': 'Irqs',
    'irq': 'irq',
    'hiperf': 'HiPerf (All)',
    'hiperf-event': 'HiPerf Event',
    'hiperf-report': 'HiPerf Report',
    'hiperf-process': 'HiPerf Process',
    'hiperf-thread': 'HiPerf Thread',
    'js-memory': 'Js Memory',
}
export function spSystemTraceInitPointToEvent(sp: SpSystemTrace) {
    sp.eventMap = eventMap;
}
