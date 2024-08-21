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

import { BaseElement, element } from '../../base-ui/BaseElement';
import './trace/TimerShaftElement';
import './trace/base/TraceRow';
import { threadPool, threadPool2 } from '../database/SqlLite';
import { TraceRow } from './trace/base/TraceRow';
import { TimerShaftElement } from './trace/TimerShaftElement';
import './trace/base/TraceSheet';
import { TraceSheet } from './trace/base/TraceSheet';
import { RangeSelect } from './trace/base/RangeSelect';
import { SelectionParam } from '../bean/BoxSelection';
import { procedurePool } from '../database/Procedure';
import { SpApplication } from '../SpApplication';
import { Flag } from './trace/timer-shaft/Flag';
import { SlicesTime, SportRuler } from './trace/timer-shaft/SportRuler';
import { SpHiPerf } from './chart/SpHiPerf';
import { SearchSdkBean } from '../bean/SearchFuncBean';
import { info } from '../../log/Log';
import {
  drawFlagLineSegment,
  drawLines,
  drawLinkLines,
  drawLogsLineSegment,
  drawWakeUp,
  drawWakeUpList,
  LineType,
  ns2x,
  ns2xByTimeShaft,
  PairPoint,
  Rect,
  prioClickHandlerFun,
  drawThreadCurve,
} from '../database/ui-worker/ProcedureWorkerCommon';
import { SpChartManager } from './chart/SpChartManager';
import { CpuStruct, WakeupBean } from '../database/ui-worker/cpu/ProcedureWorkerCPU';
import { ProcessStruct } from '../database/ui-worker/ProcedureWorkerProcess';
import { CpuFreqStruct } from '../database/ui-worker/ProcedureWorkerFreq';
import { CpuFreqLimitsStruct } from '../database/ui-worker/cpu/ProcedureWorkerCpuFreqLimits';
import { ThreadStruct } from '../database/ui-worker/ProcedureWorkerThread';
import { FuncStruct } from '../database/ui-worker/ProcedureWorkerFunc';
import { CpuStateStruct } from '../database/ui-worker/cpu/ProcedureWorkerCpuState';
import { HiPerfCpuStruct } from '../database/ui-worker/hiperf/ProcedureWorkerHiPerfCPU2';
import { HiPerfProcessStruct } from '../database/ui-worker/hiperf/ProcedureWorkerHiPerfProcess2';
import { HiPerfThreadStruct } from '../database/ui-worker/hiperf/ProcedureWorkerHiPerfThread2';
import { HiPerfEventStruct } from '../database/ui-worker/hiperf/ProcedureWorkerHiPerfEvent';
import { HiPerfReportStruct } from '../database/ui-worker/hiperf/ProcedureWorkerHiPerfReport';
import { FpsStruct } from '../database/ui-worker/ProcedureWorkerFPS';
import { CpuAbilityMonitorStruct } from '../database/ui-worker/ProcedureWorkerCpuAbility';
import { DiskAbilityMonitorStruct } from '../database/ui-worker/ProcedureWorkerDiskIoAbility';
import { MemoryAbilityMonitorStruct } from '../database/ui-worker/ProcedureWorkerMemoryAbility';
import { NetworkAbilityMonitorStruct } from '../database/ui-worker/ProcedureWorkerNetworkAbility';
import { ClockStruct } from '../database/ui-worker/ProcedureWorkerClock';
import { DmaFenceStruct } from '../database/ui-worker/ProcedureWorkerDmaFence';
import { Utils } from './trace/base/Utils';
import { IrqStruct } from '../database/ui-worker/ProcedureWorkerIrq';
import { JankStruct } from '../database/ui-worker/ProcedureWorkerJank';
import { TabPaneCurrent } from './trace/sheet/TabPaneCurrent';
import { HeapStruct } from '../database/ui-worker/ProcedureWorkerHeap';
import { SpStatisticsHttpUtil } from '../../statistics/util/SpStatisticsHttpUtil';
import { HeapSnapshotStruct } from '../database/ui-worker/ProcedureWorkerHeapSnapshot';
import { HeapDataInterface } from '../../js-heap/HeapDataInterface';
import { LitTabs } from '../../base-ui/tabs/lit-tabs';
import { TraceRowConfig } from './trace/base/TraceRowConfig';
import { TabPaneCurrentSelection } from './trace/sheet/TabPaneCurrentSelection';
import { SpChartList } from './trace/SpChartList';
import './trace/SpChartList';
import { AppStartupStruct } from '../database/ui-worker/ProcedureWorkerAppStartup';
import { AllAppStartupStruct } from '../database/ui-worker/ProcedureWorkerAllAppStartup';
import { SoStruct } from '../database/ui-worker/ProcedureWorkerSoInit';
import { FrameDynamicStruct } from '../database/ui-worker/ProcedureWorkerFrameDynamic';
import { FrameAnimationStruct } from '../database/ui-worker/ProcedureWorkerFrameAnimation';
import { FrameSpacingStruct } from '../database/ui-worker/ProcedureWorkerFrameSpacing';
import { JsCpuProfilerStruct } from '../database/ui-worker/ProcedureWorkerCpuProfiler';
import { FileInfo } from '../../js-heap/model/UiStruct';
import { SnapshotStruct } from '../database/ui-worker/ProcedureWorkerSnapshot';
import { TabPaneFrequencySample } from './trace/sheet/cpu/TabPaneFrequencySample';
import { TabPaneCounterSample } from './trace/sheet/cpu/TabPaneCounterSample';
import { TabPaneFlag } from './trace/timer-shaft/TabPaneFlag';
import { LitTabpane } from '../../base-ui/tabs/lit-tabpane';
import { HiPerfCallChartStruct } from '../database/ui-worker/hiperf/ProcedureWorkerHiPerfCallChart';
import { InitAnalysis } from '../database/logic-worker/ProcedureLogicWorkerCommon';
import { searchCpuDataSender } from '../database/data-trafic/CpuDataSender';
import { resetVSync } from './chart/VSync';
import { QueryEnum } from '../database/data-trafic/utils/QueryEnum';
import { SpSystemTraceHtml } from './SpSystemTrace.html';
import { querySceneSearchFunc, querySearchFunc } from '../database/sql/Func.sql';
import { queryCpuKeyPathData } from '../database/sql/Cpu.sql';
import { LtpoStruct } from '../database/ui-worker/ProcedureWorkerLTPO';
import { HitchTimeStruct } from '../database/ui-worker/ProcedureWorkerHitchTime';
import { ProcessMemStruct } from '../database/ui-worker/ProcedureWorkerMem';
import {
  spSystemTraceInit,
  spSystemTraceInitElement,
  spSystemTraceInitPointToEvent,
  spSystemTraceParentRowSticky,
  spSystemTraceShowStruct,
} from './SpSystemTrace.init';
import {
  spSystemTraceDrawDistributedLine,
  spSystemTraceDrawFuncLine,
  spSystemTraceDrawJankLine,
  spSystemTraceDrawTaskPollLine,
  spSystemTraceDrawThreadLine,
} from './SpSystemTrace.line';
import spSystemTraceOnClickHandler, {
  spSystemTraceDocumentOnClick,
  spSystemTraceDocumentOnKeyDown,
  spSystemTraceDocumentOnKeyPress,
  spSystemTraceDocumentOnKeyUp,
  spSystemTraceDocumentOnMouseDown,
  spSystemTraceDocumentOnMouseMove,
  spSystemTraceDocumentOnMouseOut,
  spSystemTraceDocumentOnMouseUp,
} from './SpSystemTrace.event';
import { SampleStruct } from '../database/ui-worker/ProcedureWorkerBpftrace';
import { readTraceFileBuffer } from '../SpApplicationPublicFunc';
import { PerfToolStruct } from '../database/ui-worker/ProcedureWorkerPerfTool';
import { BaseStruct } from '../bean/BaseStruct';
import { GpuCounterStruct } from '../database/ui-worker/ProcedureWorkerGpuCounter';
import { SpProcessChart } from './chart/SpProcessChart';
import { HangStruct } from '../database/ui-worker/ProcedureWorkerHang';

function dpr(): number {
  return window.devicePixelRatio || 1;
}

export class CurrentSlicesTime {
  startTime: number | undefined;
  endTime: number | undefined;
}

type HTMLDivElementAlias = HTMLDivElement | undefined | null;
type FlagAlias = Flag | undefined | null;
type SlicesTimeAlias = SlicesTime | undefined | null;

@element('sp-system-trace')
export class SpSystemTrace extends BaseElement {
  mouseCurrentPosition = 0;
  static isKeyUp: boolean = true;
  offsetMouse = 0;
  static isMouseLeftDown = false;
  static scrollViewWidth = 0;
  static isCanvasOffScreen = true;
  static DATA_DICT: Map<number, string> = new Map<number, string>();
  static DATA_TASK_POOL_CALLSTACK: Map<number, { id: number; ts: number; dur: number; name: string }> = new Map<
    number,
    { id: number; ts: number; dur: number; name: string }
  >();
  static SDK_CONFIG_MAP: unknown;
  static sliceRangeMark: unknown;
  static wakeupList: Array<WakeupBean> = [];
  static keyPathList: Array<CpuStruct> = [];
  static keyboardFlar: Boolean = true;
  static jsProfilerMap: Map<number, unknown> = new Map<number, unknown>();
  times: Set<number> = new Set<number>();
  currentSlicesTime: CurrentSlicesTime = new CurrentSlicesTime();
  intersectionObserver: IntersectionObserver | undefined;
  tipEL: HTMLDivElementAlias;
  rowsEL: HTMLDivElementAlias;
  rowsPaneEL: HTMLDivElementAlias;
  stateRowsId: Array<object> = [];
  spacerEL: HTMLDivElementAlias; // @ts-ignore
  visibleRows: Array<TraceRow<unknown>> = []; // @ts-ignore
  invisibleRows: Array<TraceRow<unknown>> = []; // @ts-ignore
  collectRows: Array<TraceRow<unknown>> = []; // @ts-ignore
  currentRow: TraceRow<unknown> | undefined | null;
  keyboardEnable = true;
  mouseEventEnable = true;
  currentRowType = ''; /*保存当前鼠标所在行的类型*/
  observerScrollHeightEnable: boolean = false;
  observerScrollHeightCallback: Function | undefined;
  favoriteChartListEL: SpChartList | undefined | null;
  // @ts-ignore
  observer = new ResizeObserver((entries) => {
    if (this.observerScrollHeightEnable && this.observerScrollHeightCallback) {
      this.observerScrollHeightCallback();
    }
  });
  static btnTimer: unknown = null;
  isMousePointInSheet = false;
  hoverFlag: FlagAlias;
  selectFlag: FlagAlias;
  slicestime: SlicesTimeAlias;
  public timerShaftEL: TimerShaftElement | null | undefined;
  public traceSheetEL: TraceSheet | undefined | null;
  public rangeSelect!: RangeSelect;
  chartManager: SpChartManager | undefined | null;
  loadTraceCompleted: boolean = false; // @ts-ignore
  rangeTraceRow: Array<TraceRow<unknown>> | undefined = [];
  canvasFavoritePanelCtx: CanvasRenderingContext2D | null | undefined;
  canvasPanel: HTMLCanvasElement | null | undefined; //绘制取消收藏后泳道图
  canvasPanelCtx: CanvasRenderingContext2D | undefined | null;
  linkNodes: PairPoint[][] = [];
  public currentClickRow: HTMLDivElement | undefined | null;
  private litTabs: LitTabs | undefined | null;
  eventMap: unknown = {};
  isSelectClick: boolean = false;
  selectionParam: SelectionParam | undefined;
  snapshotFiles: FileInfo | null | undefined;
  tabCpuFreq: TabPaneFrequencySample | undefined | null;
  tabCpuState: TabPaneCounterSample | undefined | null;
  collapseAll: boolean = false;
  currentCollectGroup: string = '1';
  private _list: Array<SlicesTime> = [];
  static isHiddenMenu: boolean = false; // @ts-ignore
  expandRowList: Array<TraceRow<unknown>> = [];
  _slicesList: Array<SlicesTime> = [];
  _flagList: Array<unknown> = [];
  static currentStartTime: number = 0;
  static retargetIndex: number = 0;
  prevScrollY: number = 0;
  focusTarget: string = '';

  set snapshotFile(data: FileInfo) {
    this.snapshotFiles = data;
  }

  set slicesList(list: Array<SlicesTime>) {
    this._slicesList = list;
  }

  set flagList(list: Array<unknown>) {
    this._flagList = list;
  }

  //节流处理
  throttle(fn: Function, t: number, ev?: unknown): Function {
    let timerId: unknown = null;
    return (): void => {
      if (!timerId) {
        timerId = setTimeout(function (): void {
          if (ev) {
            fn(ev);
          } else {
            fn();
          }
          timerId = null;
        }, t); // @ts-ignore
        this.times.add(timerId);
      }
    };
  }

  // 防抖处理
  debounce(fn: Function, ms: number, ev?: unknown): Function {
    let timerId: undefined | number;
    return (): void => {
      if (timerId) {
        window.clearTimeout(timerId);
      } else {
        timerId = window.setTimeout((): void => {
          if (ev) {
            fn(ev);
          } else {
            fn();
          }
          timerId = undefined;
        }, ms);
        this.times.add(timerId);
      }
    };
  }

  addPointPair(startPoint: PairPoint, endPoint: PairPoint, lineType?: string): void {
    if (startPoint !== null && startPoint.rowEL !== null && endPoint !== null && endPoint.rowEL !== null) {
      if (startPoint.rowEL.collect) {
        if (this.timerShaftEL?._checkExpand) {
          startPoint.rowEL.translateY =
            startPoint.rowEL.getBoundingClientRect().top - 195 + this.timerShaftEL._usageFoldHeight!;
        } else {
          startPoint.rowEL.translateY = startPoint.rowEL.getBoundingClientRect().top - 195;
        }
      } else {
        startPoint.rowEL.translateY = startPoint.rowEL.offsetTop - this.rowsPaneEL!.scrollTop;
      }
      if (endPoint.rowEL.collect) {
        endPoint.rowEL.translateY = endPoint.rowEL.getBoundingClientRect().top - 195;
      } else {
        endPoint.rowEL.translateY = endPoint.rowEL.offsetTop - this.rowsPaneEL!.scrollTop;
      }
      startPoint.y = startPoint.rowEL!.translateY! + startPoint.offsetY;
      endPoint.y = endPoint.rowEL!.translateY! + endPoint.offsetY;
      startPoint.backrowEL = startPoint.rowEL;
      endPoint.backrowEL = endPoint.rowEL;
      //判断是否是分布式连线，分布式连线需有rangeTime
      if (!lineType) {
        this.linkNodes.push([startPoint, endPoint]);
      } else {
        if (startPoint.rangeTime) {
          this.linkNodes.push([startPoint, endPoint]);
        }
      }
      this.refreshCanvas(true);
    }
  }

  clearPointPair(): void {
    this.linkNodes.length = 0;
  }

  removeLinkLinesByBusinessType(...businessTypes: string[]): void {
    this.linkNodes = this.linkNodes.filter((pointPair) => {
      if (businessTypes.indexOf('distributed') >= 0) {
        FuncStruct.selectLineFuncStruct = [];
      }
      return businessTypes.indexOf(pointPair[0].business) <= -1;
    });
  }

  hiddenLinkLinesByBusinessType(...businessTypes: string[]): void {
    this.linkNodes.map((value) => {
      if (businessTypes.indexOf(value[0].business) !== -1) {
        value[0].hidden = true;
        value[1].hidden = true;
      }
    });
  }

  showLinkLinesByBusinessType(...businessTypes: string[]): void {
    this.linkNodes.map((value) => {
      if (businessTypes.indexOf(value[0].business) !== -1) {
        value[0].hidden = false;
        value[1].hidden = false;
      }
    });
  }

  initElements(): void {
    spSystemTraceInitElement(this);
  }

  // 清除上一次点击调用栈产生的三角旗子
  clearTriangle(flagList: Array<Flag>): void {
    this.timerShaftEL!.sportRuler!.times = [];
    for (let i = 0; i < flagList.length; i++) {
      if (flagList[i].type === 'triangle') {
        flagList.splice(i, 1);
        this.timerShaftELFlagChange(this.hoverFlag, null);
        i--;
      }
    }
  }

  pushPidToSelection(selection: SelectionParam, id: string): void {
    let pid = parseInt(id);
    if (!isNaN(pid)) {
      if (!selection.processIds.includes(pid)) {
        selection.processIds.push(pid);
      }
    }
  }
  // @ts-ignore
  getCollectRows(condition: (row: TraceRow<unknown>) => boolean): Array<TraceRow<unknown>> {
    return this.favoriteChartListEL!.getCollectRows(condition);
  }
  // @ts-ignore
  createPointEvent(it: TraceRow<unknown>): unknown {
    // @ts-ignore
    let event = this.eventMap[`${it.rowType}`];
    if (event) {
      return event;
    } else {
      if (it.rowType === TraceRow.ROW_TYPE_HEAP) {
        event = it.name;
      } else if (it.rowType === TraceRow.ROW_TYPE_HIPERF_CPU) {
        event = 'HiPerf Cpu';
        if (it.rowId === 'HiPerf-cpu-merge') {
          event = 'HiPerf';
        }
      } else if (it.rowType === TraceRow.ROW_TYPE_FILE_SYSTEM) {
        event = this.handleFileSystemType(it, event);
      } else if (it.rowType === TraceRow.ROW_TYPE_STATE_ENERGY) {
        event = it.name;
      } else if (it.rowType === TraceRow.ROW_TYPE_VM_TRACKER) {
        if (it.rowParentId === '') {
          event = 'VM Tracker';
        } else {
          event = it.name;
        }
      } else if (it.rowType === TraceRow.ROW_TYPE_JANK) {
        if (it.rowId === 'frameTime' || it.rowParentId === 'frameTime') {
          event = 'FrameTimeLine';
        } else if (it.hasAttribute('frame_type')) {
          event = `${it.getAttribute('frame_type')}`;
        }
      } else if (it.rowType === TraceRow.ROW_TYPE_DELIVER_INPUT_EVENT) {
        event = 'DeliverInputEvent';
        if (it.rowParentId === TraceRow.ROW_TYPE_DELIVER_INPUT_EVENT) {
          event = 'DeliverInputEvent Func';
        }
      } else if (it.rowType === TraceRow.ROW_TYPE_TOUCH_EVENT_DISPATCH) {
        event = 'TouchEventDispatch';
        if (it.rowParentId === TraceRow.ROW_TYPE_TOUCH_EVENT_DISPATCH) {
          event = 'TouchEventDispatch Func';
        }
      } else {
        event = it.name;
      }
      return event;
    }
  }
  // @ts-ignore
  private handleFileSystemType(it: TraceRow<unknown>, event: unknown): void {
    if (it.rowId === 'FileSystemLogicalWrite') {
      event = 'FileSystem Logical Write';
    } else if (it.rowId === 'FileSystemLogicalRead') {
      event = 'FileSystem Logical Read';
    } else if (it.rowId === 'FileSystemVirtualMemory') {
      event = 'Page Fault Trace';
    } else if (it.rowId!.startsWith('FileSystemDiskIOLatency')) {
      event = 'Disk I/O Latency';
      if (it.rowId!.startsWith('FileSystemDiskIOLatency-')) {
        event = 'Bio Process';
      }
    } // @ts-ignore
    return event;
  }

  refreshFavoriteCanvas(): void {
    this.favoriteChartListEL!.refreshFavoriteCanvas();
  }
  // @ts-ignore
  expansionAllParentRow(currentRow: TraceRow<unknown>): void {
    // @ts-ignore
    let parentRow = this.rowsEL!.querySelector<TraceRow<unknown>>(
      `trace-row[row-id='${currentRow.rowParentId}'][folder][scene]`
    );
    if (parentRow) {
      parentRow.expansion = true; // @ts-ignore
      if (this.rowsEL!.querySelector<TraceRow<unknown>>(`trace-row[row-id='${parentRow.rowParentId}'][folder]`)) {
        this.expansionAllParentRow(parentRow);
      }
    }
  }

  canvasPanelConfig(): void {
    this.canvasPanel!.style.left = `${this.timerShaftEL!.canvas!.offsetLeft!}px`;
    this.canvasPanel!.width = this.canvasPanel!.offsetWidth * dpr();
    this.canvasPanel!.height = this.canvasPanel!.offsetHeight * dpr();
    this.canvasPanelCtx!.scale(dpr(), dpr());
  }

  getScrollWidth(): number {
    let overflowDiv = document.createElement('div');
    overflowDiv.style.cssText = 'position:absolute; top:-2000px;width:200px; height:200px; overflow:hidden;';
    let totalScrollDiv = document.body.appendChild(overflowDiv).clientWidth;
    overflowDiv.style.overflowY = 'scroll';
    let scrollDiv = overflowDiv.clientWidth;
    document.body.removeChild(overflowDiv);
    return totalScrollDiv - scrollDiv;
  }

  getShowTab(): Array<string> {
    let tabpane = this.traceSheetEL!.shadowRoot!.querySelectorAll('lit-tabpane') as NodeListOf<LitTabpane>;
    let showTab: Array<string> = [];
    for (let pane of tabpane) {
      if (pane.getAttribute('hidden') === 'false') {
        showTab.push(pane.getAttribute('id') || '');
      }
    }
    return showTab;
  }

  timerShaftELFlagClickHandler = (flag: FlagAlias): void => {
    if (flag) {
      setTimeout(() => {
        if (TraceRow.rangeSelectObject) {
          let showTab = this.getShowTab();
          this.traceSheetEL?.displayTab<TabPaneFlag>('box-flag', ...showTab).setCurrentFlag(flag);
        } else {
          this.traceSheetEL?.displayTab<TabPaneFlag>('box-flag').setCurrentFlag(flag);
        }
      }, 100);
    }
  };

  timerShaftELFlagChange = (hoverFlag: FlagAlias, selectFlag: FlagAlias): void => {
    this.hoverFlag = hoverFlag;
    this.selectFlag = selectFlag;
    this.refreshCanvas(true, 'flagChange');
  };

  timerShaftELRangeClick = (sliceTime: SlicesTimeAlias): void => {
    if (sliceTime) {
      setTimeout(() => {
        if (TraceRow.rangeSelectObject) {
          let showTab = this.getShowTab();
          this.traceSheetEL?.displayTab<TabPaneCurrent>('tabpane-current', ...showTab).setCurrentSlicesTime(sliceTime);
        } else {
          this.traceSheetEL?.displayTab<TabPaneCurrent>('tabpane-current').setCurrentSlicesTime(sliceTime);
        }
      }, 0);
    }
  };

  timerShaftELRangeChange = (e: unknown): void => {
    // @ts-ignore
    TraceRow.range = e;
    if (TraceRow.rangeSelectObject) {
      TraceRow.rangeSelectObject!.startX = Math.floor(
        ns2x(
          TraceRow.rangeSelectObject!.startNS!,
          TraceRow.range?.startNS!,
          TraceRow.range?.endNS!,
          TraceRow.range?.totalNS!,
          this.timerShaftEL!.sportRuler!.frame
        )
      );
      TraceRow.rangeSelectObject!.endX = Math.floor(
        ns2x(
          TraceRow.rangeSelectObject!.endNS!,
          TraceRow.range?.startNS!,
          TraceRow.range?.endNS!,
          TraceRow.range?.totalNS!,
          this.timerShaftEL!.sportRuler!.frame
        )
      );
    }
    //在rowsEL显示范围内的 trace-row组件将收到时间区间变化通知
    this.linkNodes.forEach((it) => {
      it[0].x = ns2xByTimeShaft(it[0].ns, this.timerShaftEL!);
      it[1].x = ns2xByTimeShaft(it[1].ns, this.timerShaftEL!);
    });
    this.invisibleRows.forEach((it) => (it.needRefresh = true));
    this.visibleRows.forEach((it) => (it.needRefresh = true));
    this.refreshCanvas(false, 'rangeChange');
  };
  top: number = 0;
  handler: number = -1;
  rowsElOnScroll = (e: unknown): void => {
    // @ts-ignore
    const currentScrollY = e.target.scrollTop;
    const deltaY = currentScrollY - this.prevScrollY;
    this.linkNodes.forEach((itln) => {
      if (itln[0].rowEL.collect) {
        if (this.timerShaftEL?._checkExpand) {
          itln[0].rowEL.translateY =
            itln[0].rowEL.getBoundingClientRect().top - 195 + this.timerShaftEL._usageFoldHeight!;
        } else {
          itln[0].rowEL.translateY = itln[0].rowEL.getBoundingClientRect().top - 195;
        }
      } else {
        itln[0].rowEL.translateY = itln[0].rowEL.offsetTop - this.rowsPaneEL!.scrollTop;
      }
      if (itln[1].rowEL.collect) {
        if (this.timerShaftEL?._checkExpand) {
          itln[1].rowEL.translateY =
            itln[1].rowEL.getBoundingClientRect().top - 195 + this.timerShaftEL._usageFoldHeight!;
        } else {
          itln[1].rowEL.translateY = itln[1].rowEL.getBoundingClientRect().top - 195;
        }
      } else {
        itln[1].rowEL.translateY = itln[1].rowEL.offsetTop - this.rowsPaneEL!.scrollTop;
      }
      itln[0].y = itln[0].rowEL.translateY + itln[0].offsetY;
      itln[1].y = itln[1].rowEL.translateY + itln[1].offsetY;
    });
    this.hoverStructNull();
    if (this.scrollTimer) {
      // @ts-ignore
      clearTimeout(this.scrollTimer);
    }
    this.scrollTimer = setTimeout(() => {
      TraceRow.range!.refresh = true;
      requestAnimationFrame(() => this.refreshCanvas(false));
    }, 200);
    spSystemTraceParentRowSticky(this, deltaY);
    this.prevScrollY = currentScrollY;
  };

  private scrollTimer: unknown;

  favoriteRowsElOnScroll = (e: unknown): void => {
    this.rowsElOnScroll(e);
  };

  offset = 147;

  getRowsContentHeight(): number {
    // @ts-ignore
    return [...this.rowsEL!.querySelectorAll<TraceRow<unknown>>('trace-row:not([sleeping])')]
      .map((it) => it.clientHeight)
      .reduce((acr, cur) => acr + cur, 0);
  }

  // refresh main canvas and favorite canvas
  refreshCanvas(cache: boolean, from?: string): void {
    if (this.visibleRows.length === 0) {
      return;
    }
    //clear main canvas
    this.canvasPanelCtx!.clearRect(0, 0, this.canvasPanel!.offsetWidth, this.canvasPanel!.offsetHeight);
    this.favoriteChartListEL!.clearRect();
    //draw lines for main canvas
    let rowsContentHeight = this.getRowsContentHeight();
    let canvasHeight =
      rowsContentHeight > this.canvasPanel!.clientHeight ? this.canvasPanel!.clientHeight : rowsContentHeight;
    drawLines(this.canvasPanelCtx!, TraceRow.range?.xs || [], canvasHeight, this.timerShaftEL!.lineColor());
    //draw lines for favorite canvas
    this.favoriteChartListEL?.drawLines(TraceRow.range?.xs, this.timerShaftEL!.lineColor()); // chart list

    //canvas translate
    this.canvasPanel!.style.transform = `translateY(${this.rowsPaneEL!.scrollTop}px)`;
    //draw trace row
    this.visibleRows.forEach((v, i) => {
      if (v.collect) {
        v.translateY =
          v.getBoundingClientRect().top -
          this.timerShaftEL?.clientHeight! -
          this.parentElement!.previousElementSibling!.clientHeight -
          1;
      } else {
        v.translateY = v.offsetTop - this.rowsPaneEL!.scrollTop;
      }
      v.draw(cache);
    });
    this.drawAllLines();
  }

  drawWakeUpLine(): void {
    //draw wakeup for main canvas
    drawWakeUp(
      this.canvasPanelCtx,
      CpuStruct.wakeupBean,
      TraceRow.range!.startNS,
      TraceRow.range!.endNS,
      TraceRow.range!.totalNS,
      {
        x: 0,
        y: 0,
        width: TraceRow.FRAME_WIDTH,
        height: this.canvasPanel!.clientHeight!,
      } as Rect
    );
    this.favoriteChartListEL?.drawWakeUp();
    // draw wakeuplist for main canvas
    for (let i = 0; i < SpSystemTrace.wakeupList.length; i++) {
      if (i + 1 === SpSystemTrace.wakeupList.length) {
        return;
      }
      drawWakeUpList(
        this.canvasPanelCtx,
        SpSystemTrace.wakeupList[i + 1],
        TraceRow.range!.startNS,
        TraceRow.range!.endNS,
        TraceRow.range!.totalNS,
        {
          x: 0,
          y: 0,
          width: this.timerShaftEL!.canvas!.clientWidth,
          height: this.canvasPanel!.clientHeight!,
        } as Rect
      );
      this.favoriteChartListEL?.drawWakeUpList(SpSystemTrace.wakeupList[i + 1]);
    }
  }

  drawAllLines(): void {
    // draw flag line segment for canvas
    drawFlagLineSegment(
      this.canvasPanelCtx,
      this.hoverFlag,
      this.selectFlag,
      {
        x: 0,
        y: 0,
        width: this.timerShaftEL?.canvas?.clientWidth,
        height: this.canvasPanel?.clientHeight,
      } as Rect,
      this.timerShaftEL!
    );
    this.favoriteChartListEL?.drawFlagLineSegment(this.hoverFlag, this.selectFlag, this.timerShaftEL!);
    this.drawWakeUpLine();
    //draw system logs line segment for canvas
    drawLogsLineSegment(
      this.canvasPanelCtx,
      this.traceSheetEL?.systemLogFlag,
      {
        x: 0,
        y: 0,
        width: this.timerShaftEL?.canvas?.clientWidth,
        height: this.canvasPanel?.clientHeight,
      },
      this.timerShaftEL!
    );
    this.favoriteChartListEL?.drawLogsLineSegment(this.traceSheetEL!.systemLogFlag, this.timerShaftEL!);

    // Draw the connection curve
    if (this.linkNodes && this.linkNodes.length > 0) {
      drawLinkLines(
        this.canvasPanelCtx!,
        this.linkNodes,
        this.timerShaftEL!,
        false,
        this.favoriteChartListEL!.clientHeight
      );
      this.favoriteChartListEL?.drawLinkLines(
        this.linkNodes,
        this.timerShaftEL!,
        true,
        this.favoriteChartListEL!.clientHeight
      );
    }
    // draw prio curve
    if (
      ThreadStruct.isClickPrio &&
      this.currentRow!.parentRowEl!.expansion &&
      ThreadStruct.selectThreadStruct &&
      ThreadStruct.contrast(ThreadStruct.selectThreadStruct, this.currentRow!.rowParentId, this.currentRow!.rowId)
    ) {
      let context: CanvasRenderingContext2D;
      if (this.currentRow!.currentContext) {
        context = this.currentRow!.currentContext;
      } else {
        context = this.currentRow!.collect ? this.canvasFavoritePanelCtx! : this.canvasPanelCtx!;
      }
      this.drawPrioCurve(context, this.currentRow!);
    }
  }

  // draw prio curve
  // @ts-ignore
  drawPrioCurve(context: unknown, row: TraceRow<unknown>): void {
    let curveDrawList: unknown = [];
    let oldVal: number = -1;
    // @ts-ignore
    let threadFilter = row.dataListCache.filter((it: unknown) => it.state === 'Running'); //筛选状态是Running的数据
    //计算每个点的坐标
    // @ts-ignore
    prioClickHandlerFun(ThreadStruct.prioCount, row, threadFilter, curveDrawList, oldVal);
    //绘制曲线透明度设置1，根据计算的曲线坐标开始画图
    // @ts-ignore
    context.globalAlpha = 1;
    // @ts-ignore
    context.beginPath();
    let x0;
    let y0;
    // @ts-ignore
    if (curveDrawList[0] && curveDrawList[0].frame) {
      // @ts-ignore
      x0 = curveDrawList[0].frame.x;
      // @ts-ignore
      y0 = curveDrawList[0].curveFloatY;
    }
    // @ts-ignore
    context!.moveTo(x0!, y0!);
    // @ts-ignore
    if (SpSystemTrace.isKeyUp || curveDrawList.length < 90) {
      // @ts-ignore
      for (let i = 0; i < curveDrawList.length - 1; i++) {
        // @ts-ignore
        let re = curveDrawList[i];
        // @ts-ignore
        let nextRe = curveDrawList[i + 1];
        // @ts-ignore
        drawThreadCurve(context, re, nextRe);
      }
      // @ts-ignore
      context.closePath();
      // @ts-ignore
    } else if (!SpSystemTrace.isKeyUp && curveDrawList.length >= 90) {
      let x;
      let y;
      // @ts-ignore
      if (curveDrawList[curveDrawList.length - 1] && curveDrawList[curveDrawList.length - 1].frame) {
        // @ts-ignore
        x = curveDrawList[curveDrawList.length - 1].frame.x;
        // @ts-ignore
        y = curveDrawList[curveDrawList.length - 1].curveFloatY;
      }
      // @ts-ignore
      context.lineWidth = 1;
      // @ts-ignore
      context.strokeStyle = '#ffc90e';
      // @ts-ignore
      context.lineCap = 'round';
      // @ts-ignore
      context.lineTo(x, y);
      // @ts-ignore
      context.stroke();
    }
  }

  documentOnMouseDown = (ev: MouseEvent): void => spSystemTraceDocumentOnMouseDown(this, ev);

  onContextMenuHandler = (e: Event): void => {
    setTimeout(() => {
      for (let key of this.keyPressMap.keys()) {
        if (this.keyPressMap.get(key)) {
          this.timerShaftEL?.stopWASD({ key: key });
          this.keyPressMap.set(key, false);
        }
      }
    }, 100);
  };

  documentOnMouseUp = (ev: MouseEvent): void => spSystemTraceDocumentOnMouseUp(this, ev);

  cancelDrag(): void {
    this.rangeSelect.drag = false;
    this.rangeSelect.isMouseDown = false;
    TraceRow.rangeSelectObject = {
      startX: 0,
      endX: 0,
      startNS: 0,
      endNS: 0,
    };
  }

  documentOnMouseOut = (ev: MouseEvent): void => spSystemTraceDocumentOnMouseOut(this, ev);

  keyPressMap: Map<string, boolean> = new Map([
    ['w', false],
    ['s', false],
    ['a', false],
    ['d', false],
    ['f', false],
  ]);

  documentOnKeyDown = (ev: KeyboardEvent): void => spSystemTraceDocumentOnKeyDown(this, ev);

  documentOnKeyPress = (ev: KeyboardEvent): void => spSystemTraceDocumentOnKeyPress(this, ev);

  verticalScrollToRow(): void {
    if (this.currentRow) {
      //@ts-ignore
      this.currentRow.scrollIntoViewIfNeeded();
    }
  }

  setCurrentSlicesTime(): void {
    if (CpuStruct.selectCpuStruct) {
      this.currentSlicesTime.startTime = CpuStruct.selectCpuStruct.startTime;
      this.currentSlicesTime.endTime = CpuStruct.selectCpuStruct.startTime! + CpuStruct.selectCpuStruct.dur!;
    } else if (ThreadStruct.selectThreadStruct) {
      this.currentSlicesTime.startTime = ThreadStruct.selectThreadStruct.startTime;
      this.currentSlicesTime.endTime =
        ThreadStruct.selectThreadStruct.startTime! + ThreadStruct.selectThreadStruct.dur!;
    } else if (FuncStruct.selectFuncStruct) {
      this.currentSlicesTime.startTime = FuncStruct.selectFuncStruct.startTs;
      this.currentSlicesTime.endTime = FuncStruct.selectFuncStruct.startTs! + FuncStruct.selectFuncStruct.dur!;
    } else if (IrqStruct.selectIrqStruct) {
      this.currentSlicesTime.startTime = IrqStruct.selectIrqStruct.startNS;
      this.currentSlicesTime.endTime = IrqStruct.selectIrqStruct.startNS! + IrqStruct.selectIrqStruct.dur!;
    } else if (TraceRow.rangeSelectObject) {
      this.currentRow = undefined;
      if (TraceRow.rangeSelectObject.startNS && TraceRow.rangeSelectObject.endNS) {
        this.currentSlicesTime.startTime = TraceRow.rangeSelectObject.startNS;
        this.currentSlicesTime.endTime = TraceRow.rangeSelectObject.endNS;
      }
    } else if (JankStruct.selectJankStruct) {
      this.currentSlicesTime.startTime = JankStruct.selectJankStruct.ts;
      this.currentSlicesTime.endTime = JankStruct.selectJankStruct.ts! + JankStruct.selectJankStruct.dur!;
    } else if (SampleStruct.selectSampleStruct) {
      if (SampleStruct.selectSampleStruct.begin && SampleStruct.selectSampleStruct.end) {
        this.currentSlicesTime.startTime =
          SampleStruct.selectSampleStruct.begin - SampleStruct.selectSampleStruct.startTs!;
        this.currentSlicesTime.endTime = SampleStruct.selectSampleStruct.end - SampleStruct.selectSampleStruct.startTs!;
      }
    } else if (GpuCounterStruct.selectGpuCounterStruct) {
      this.currentSlicesTime.startTime =
        GpuCounterStruct.selectGpuCounterStruct.startNS! - GpuCounterStruct.selectGpuCounterStruct.startTime!;
      this.currentSlicesTime.endTime =
        GpuCounterStruct.selectGpuCounterStruct.startNS! +
        GpuCounterStruct.selectGpuCounterStruct.dur! -
        GpuCounterStruct.selectGpuCounterStruct.startTime!;
    } else if (AppStartupStruct.selectStartupStruct) {
      this.currentSlicesTime.startTime = AppStartupStruct.selectStartupStruct.startTs;
      this.currentSlicesTime.endTime = AppStartupStruct.selectStartupStruct.startTs! + AppStartupStruct.selectStartupStruct.dur!;
    } else if (AllAppStartupStruct.selectStartupStruct) {
      this.currentSlicesTime.startTime = AllAppStartupStruct.selectStartupStruct.startTs;
      this.currentSlicesTime.endTime = AllAppStartupStruct.selectStartupStruct.startTs! + AllAppStartupStruct.selectStartupStruct.dur!;
    } else if (PerfToolStruct.selectPerfToolStruct) {
      this.currentSlicesTime.startTime = PerfToolStruct.selectPerfToolStruct.startTs;
      this.currentSlicesTime.endTime = PerfToolStruct.selectPerfToolStruct.startTs! + PerfToolStruct.selectPerfToolStruct.dur!;
    } else if (DmaFenceStruct.selectDmaFenceStruct) {
      if (DmaFenceStruct.selectDmaFenceStruct.startTime && DmaFenceStruct.selectDmaFenceStruct.dur) {
        this.currentSlicesTime.startTime = DmaFenceStruct.selectDmaFenceStruct.startTime;
        this.currentSlicesTime.endTime = DmaFenceStruct.selectDmaFenceStruct.startTime + DmaFenceStruct.selectDmaFenceStruct.dur;
      }
    } else {
      this.currentSlicesTime.startTime = 0;
      this.currentSlicesTime.endTime = 0;
    }
  }

  public setSLiceMark = (shiftKey: boolean): SlicesTime | null | undefined => {
    const selectedStruct: unknown =
      CpuStruct.selectCpuStruct ||
      ThreadStruct.selectThreadStruct ||
      TraceRow.rangeSelectObject ||
      FuncStruct.selectFuncStruct ||
      IrqStruct.selectIrqStruct ||
      JankStruct.selectJankStruct ||
      AppStartupStruct.selectStartupStruct ||
      SoStruct.selectSoStruct ||
      SampleStruct.selectSampleStruct ||
      GpuCounterStruct.selectGpuCounterStruct ||
      AllAppStartupStruct.selectStartupStruct ||
      FrameAnimationStruct.selectFrameAnimationStruct ||
      JsCpuProfilerStruct.selectJsCpuProfilerStruct ||
      PerfToolStruct.selectPerfToolStruct ||
      DmaFenceStruct.selectDmaFenceStruct;
    this.calculateSlicesTime(selectedStruct, shiftKey);

    return this.slicestime;
  };

  private calculateSlicesTime(selected: unknown, shiftKey: boolean): void {
    if (selected) {
      let startTs = 0;
      // @ts-ignore
      if (selected.begin && selected.end) {
        // @ts-ignore
        startTs = selected.begin - selected.startTs;
        // @ts-ignore
        let end = selected.end - selected.startTs;
        this.slicestime = this.timerShaftEL?.setSlicesMark(startTs, end, shiftKey);
        // @ts-ignore
      } else if (selected.startNS && selected.dur) {
        // @ts-ignore
        startTs = selected.startNS - selected.startTime;
        // @ts-ignore
        let end = selected.startNS + selected.dur - selected.startTime;
        this.slicestime = this.timerShaftEL?.setSlicesMark(startTs, end, shiftKey);
      } else {
        // @ts-ignore
        startTs = selected.startTs || selected.startTime || selected.startNS || selected.ts || 0;
        // @ts-ignore
        let dur = selected.dur || selected.totalTime || selected.endNS - selected.startNS || 0;
        this.slicestime = this.timerShaftEL?.setSlicesMark(startTs, startTs + dur, shiftKey);
      }
    } else {
      this.slicestime = this.timerShaftEL?.setSlicesMark();
    }
  }

  stopWASD = (): void => {
    setTimeout((): void => {
      for (let key of this.keyPressMap.keys()) {
        if (this.keyPressMap.get(key)) {
          this.timerShaftEL?.stopWASD({ key: key });
          this.keyPressMap.set(key, false);
        }
      }
    }, 100);
  };

  // 一直按着回车键的时候执行搜索功能
  continueSearch = (ev: KeyboardEvent): void => {
    if (ev.key === 'Enter') {
      if (ev.shiftKey) {
        this.dispatchEvent(
          new CustomEvent('trace-previous-data', {
            detail: { down: true },
            composed: false,
          })
        );
      } else {
        if (this.focusTarget === '') {
          this.dispatchEvent(
            new CustomEvent('trace-next-data', {
              detail: { down: true },
              composed: false,
            })
          );
        }
      }
    }
  };

  documentOnKeyUp = (ev: KeyboardEvent): void => spSystemTraceDocumentOnKeyUp(this, ev);

  /**
   * 根据传入的参数实现卡尺和旗子的快捷跳转
   * @param list 要跳转的数组
   * @param type 标记类型（卡尺和旗子）
   * @param direction 跳转方向（前一个/后一个）
   */
  MarkJump(list: Array<unknown>, type: string, direction: string, ev: KeyboardEvent): void {
    this.traceSheetEL = this.shadowRoot?.querySelector('.trace-sheet'); // @ts-ignore
    let find = list.find((it) => it.selected);
    if (!find) {
      // 如果当前没有选中的，就选中第一个
      // @ts-ignore
      list.forEach((it) => (it.selected = false));
      this.ifSliceInView(list[0], type, ev); // @ts-ignore
      list[0].selected = true;
    } else {
      for (let i = 0; i < list.length; i++) {
        // 将当前数组中选中的那条数据改为未选中
        // @ts-ignore
        if (list[i].selected) {
          // @ts-ignore
          list[i].selected = false;
          if (direction === 'previous') {
            if (i === 0) {
              // 如果当前选中的是第一个，就循环到最后一个上
              this.ifSliceInView(list[list.length - 1], type, ev); // @ts-ignore
              list[list.length - 1].selected = true;
              break;
            } else {
              // 选中当前的上一个
              this.ifSliceInView(list[i - 1], type, ev); // @ts-ignore
              list[i - 1].selected = true;
              break;
            }
          } else if (direction === 'next') {
            if (i === list.length - 1) {
              // 如果当前选中的是最后一个，就循环到第一个上
              this.ifSliceInView(list[0], type, ev); // @ts-ignore
              list[0].selected = true;
              break;
            } else {
              // 选中当前的下一个
              this.ifSliceInView(list[i + 1], type, ev); // @ts-ignore
              list[i + 1].selected = true;
              break;
            }
          }
        }
      }
    }

    if (type === 'flag') {
      let currentPane = this.traceSheetEL?.displayTab<TabPaneFlag>('box-flag');
      list.forEach((flag, index) => {
        // @ts-ignore
        this.timerShaftEL!.sportRuler!.drawTriangle(flag.time, flag.type); // @ts-ignore
        if (flag.selected) {
          // 修改当前选中的旗子对应的表格中某行的背景
          currentPane!.setTableSelection(index + 1);
        }
      });
    } else if (type === 'slice') {
      this.refreshCanvas(true);
      let currentPane = this.traceSheetEL?.displayTab<TabPaneCurrent>('tabpane-current');
      list.forEach((slice, index) => {
        // @ts-ignore
        if (slice.selected) {
          // 修改当前选中的卡尺对应的表格中某行的背景
          currentPane!.setTableSelection(index + 1);
        }
      });
    }
  }

  ifSliceInView(data: unknown, type: string, ev: KeyboardEvent): void {
    let timeRangeEndNS = this.timerShaftEL?.getRangeRuler()?.range.endNS;
    let timeRangeStartNS = this.timerShaftEL?.getRangeRuler()?.range.startNS;
    if (type === 'flag') {
      // @ts-ignore
      data.startTime = data.time; // @ts-ignore
      data.endTime = data.time;
    } // @ts-ignore
    let endTime = data.endTime; // @ts-ignore
    let startTime = data.startTime;
    if (endTime > timeRangeEndNS! || startTime < timeRangeStartNS!) {
      // @ts-ignore
      this.timerShaftEL!.documentOnKeyPress(ev, data);
      setTimeout(() => {
        this.timerShaftEL!.documentOnKeyUp(ev);
      }, 1000);
    }
  }

  isMouseInSheet = (ev: MouseEvent): boolean => {
    this.isMousePointInSheet =
      this.traceSheetEL?.getAttribute('mode') !== 'hidden' &&
      ev.offsetX > this.traceSheetEL!.offsetLeft &&
      ev.offsetY > this.traceSheetEL!.offsetTop;
    return this.isMousePointInSheet;
  };
  // @ts-ignore
  favoriteChangeHandler = (row: TraceRow<unknown>): void => {
    info('favoriteChangeHandler', row.frame, row.offsetTop, row.offsetHeight);
  };

  /**
   * 根据选择的traceRow 处理foler
   * @param currentRow 当前点击checkbox的row
   */
  // @ts-ignore
  setParentCheckStatus(currentRow: TraceRow<unknown>): void {
    if (currentRow.parentRowEl?.folder && currentRow.parentRowEl?.childrenList) {
      const parent = currentRow.parentRowEl;
      const childrenList = parent.childrenList;
      const selectList = [];
      const unSelectList = [];
      for (const child of childrenList) {
        if (child.offsetParent === null) {
          continue;
        }
        if (child.checkType === '2') {
          selectList.push(child);
        } else {
          unSelectList.push(child);
        }
      }
      if (unSelectList.length === 0) {
        parent.setAttribute('check-type', '2');
        parent.rangeSelect = true;
        parent.checkBoxEL!.checked = true;
        parent.checkBoxEL!.indeterminate = false;
      } else if (selectList.length === 0) {
        parent.setAttribute('check-type', '0');
        parent.rangeSelect = false;
        parent.checkBoxEL!.checked = false;
        parent.checkBoxEL!.indeterminate = false;
      } else {
        parent.setAttribute('check-type', '1');
        parent.rangeSelect = false;
        parent.checkBoxEL!.checked = false;
        parent.checkBoxEL!.indeterminate = true;
      }
    }
  }

  /**
   * 处理点击checkbox的逻辑
   * @param row 当前点击checkbox的row
   */
  // @ts-ignore
  selectChangeHandler = (row: TraceRow<unknown>): void => {
    this.setParentCheckStatus(row);
    const rows = [
      // @ts-ignore
      ...this.shadowRoot!.querySelectorAll<TraceRow<unknown>>("trace-row[check-type='2']"),
      ...this.favoriteChartListEL!.getAllSelectCollectRows(),
    ];
    this.isSelectClick = true;
    this.rangeSelect.rangeTraceRow = rows; // @ts-ignore
    let changeTraceRows: Array<TraceRow<unknown>> = [];
    if (this.rangeTraceRow!.length < rows.length) {
      // @ts-ignore
      rows!.forEach((currentTraceRow: TraceRow<unknown>) => {
        let changeFilter = this.rangeTraceRow!.filter(
          // @ts-ignore
          (prevTraceRow: TraceRow<unknown>) => prevTraceRow === currentTraceRow
        );
        if (changeFilter.length < 1) {
          changeTraceRows.push(currentTraceRow);
        }
      });
      if (changeTraceRows.length > 0) {
        // @ts-ignore
        changeTraceRows!.forEach((changeTraceRow: TraceRow<unknown>) => {
          let pointEvent = this.createPointEvent(changeTraceRow);
          SpStatisticsHttpUtil.addOrdinaryVisitAction({
            action: 'trace_row', // @ts-ignore
            event: pointEvent,
          });
        });
      }
    }
    this.rangeTraceRow = rows;
    this.rangeSelect.selectHandler?.(this.rangeSelect.rangeTraceRow, false);
  };
  inFavoriteArea: boolean | undefined;
  documentOnMouseMove = (ev: MouseEvent): void => spSystemTraceDocumentOnMouseMove(this, ev);

  hoverStructNull(): SpSystemTrace {
    CpuStruct.hoverCpuStruct = undefined;
    CpuFreqStruct.hoverCpuFreqStruct = undefined;
    ThreadStruct.hoverThreadStruct = undefined;
    FuncStruct.hoverFuncStruct = undefined;
    ProcessMemStruct.hoverProcessMemStruct = undefined;
    HiPerfCpuStruct.hoverStruct = undefined;
    HiPerfProcessStruct.hoverStruct = undefined;
    HiPerfThreadStruct.hoverStruct = undefined;
    HiPerfEventStruct.hoverStruct = undefined;
    HiPerfReportStruct.hoverStruct = undefined;
    CpuStateStruct.hoverStateStruct = undefined;
    CpuAbilityMonitorStruct.hoverCpuAbilityStruct = undefined;
    DiskAbilityMonitorStruct.hoverDiskAbilityStruct = undefined;
    MemoryAbilityMonitorStruct.hoverMemoryAbilityStruct = undefined;
    NetworkAbilityMonitorStruct.hoverNetworkAbilityStruct = undefined;
    CpuFreqLimitsStruct.hoverCpuFreqLimitsStruct = undefined;
    FpsStruct.hoverFpsStruct = undefined;
    ClockStruct.hoverClockStruct = undefined;
    IrqStruct.hoverIrqStruct = undefined;
    HeapStruct.hoverHeapStruct = undefined;
    JankStruct.hoverJankStruct = undefined;
    AppStartupStruct.hoverStartupStruct = undefined;
    SoStruct.hoverSoStruct = undefined;
    HeapSnapshotStruct.hoverSnapshotStruct = undefined;
    FrameAnimationStruct.hoverFrameAnimationStruct = undefined;
    FrameDynamicStruct.hoverFrameDynamicStruct = undefined;
    FrameSpacingStruct.hoverFrameSpacingStruct = undefined;
    JsCpuProfilerStruct.hoverJsCpuProfilerStruct = undefined;
    SnapshotStruct.hoverSnapshotStruct = undefined;
    HiPerfCallChartStruct.hoverPerfCallCutStruct = undefined;
    SampleStruct.hoverSampleStruct = undefined;
    PerfToolStruct.hoverPerfToolStruct = undefined;
    GpuCounterStruct.hoverGpuCounterStruct = undefined;
    DmaFenceStruct.hoverDmaFenceStruct = undefined;//清空hover slice
    this.tipEL!.style.display = 'none';
    return this;
  }

  selectStructNull(): SpSystemTrace {
    CpuStruct.selectCpuStruct = undefined;
    CpuStruct.wakeupBean = null;
    CpuFreqStruct.selectCpuFreqStruct = undefined;
    ThreadStruct.selectThreadStruct = undefined;
    ThreadStruct.isClickPrio = false;
    FuncStruct.selectFuncStruct = undefined;
    SpHiPerf.selectCpuStruct = undefined;
    CpuStateStruct.selectStateStruct = undefined;
    CpuFreqLimitsStruct.selectCpuFreqLimitsStruct = undefined;
    ClockStruct.selectClockStruct = undefined;
    HangStruct.selectHangStruct = undefined;
    IrqStruct.selectIrqStruct = undefined;
    JankStruct.selectJankStruct = undefined;
    HeapStruct.selectHeapStruct = undefined;
    AppStartupStruct.selectStartupStruct = undefined;
    SoStruct.selectSoStruct = undefined;
    HeapSnapshotStruct.selectSnapshotStruct = undefined;
    FrameSpacingStruct.selectFrameSpacingStruct = undefined;
    FrameAnimationStruct.selectFrameAnimationStruct = undefined;
    FrameDynamicStruct.selectFrameDynamicStruct = undefined;
    JsCpuProfilerStruct.selectJsCpuProfilerStruct = undefined;
    SnapshotStruct.selectSnapshotStruct = undefined;
    HiPerfCallChartStruct.selectStruct = undefined;
    AllAppStartupStruct.selectStartupStruct = undefined;
    LtpoStruct.selectLtpoStruct = undefined;
    HitchTimeStruct.selectHitchTimeStruct = undefined;
    SampleStruct.selectSampleStruct = undefined;
    PerfToolStruct.selectPerfToolStruct = undefined;
    GpuCounterStruct.selectGpuCounterStruct = undefined;
    DmaFenceStruct.selectDmaFenceStruct = undefined;//清空选中slice
    return this;
  }

  isWASDKeyPress(): boolean | undefined {
    return (
      this.keyPressMap.get('w') || this.keyPressMap.get('a') || this.keyPressMap.get('d') || this.keyPressMap.get('s')
    );
  }

  documentOnClick = (ev: MouseEvent): void => spSystemTraceDocumentOnClick(this, ev);

  clickEmptyArea(): void {
    this.queryAllTraceRow().forEach((it) => {
      it.checkType = '-1';
      it.rangeSelect = false;
    });
    this.rangeSelect.rangeTraceRow = [];
    TraceRow.rangeSelectObject = undefined;
    this.selectStructNull();
    this.wakeupListNull();
    this.observerScrollHeightEnable = false;
    this.selectFlag = null;
    this.timerShaftEL?.removeTriangle('inverted');
    //   如果鼠标在SportRuler区域不隐藏tab页
    if (!SportRuler.isMouseInSportRuler) {
      this.traceSheetEL?.setMode('hidden');
    }
    this.removeLinkLinesByBusinessType('task', 'thread', 'func');
    this.removeLinkLinesByBusinessType('task', 'thread', 'distributed');
    this.refreshCanvas(true, 'click empty');
    JankStruct.delJankLineFlag = true;
  }

  //泳道图点击判定条件
  traceRowClickJudgmentConditions: Map<string, () => boolean> = new Map<string, () => boolean>([
    [TraceRow.ROW_TYPE_CPU, (): boolean => CpuStruct.hoverCpuStruct !== null && CpuStruct.hoverCpuStruct !== undefined],
    [
      TraceRow.ROW_TYPE_THREAD,
      (): boolean => ThreadStruct.hoverThreadStruct !== null && ThreadStruct.hoverThreadStruct !== undefined,
    ],
    [
      TraceRow.ROW_TYPE_FUNC,
      (): boolean => FuncStruct.hoverFuncStruct !== null && FuncStruct.hoverFuncStruct !== undefined,
    ],
    [
      TraceRow.ROW_TYPE_SAMPLE,
      (): boolean => SampleStruct.hoverSampleStruct !== null && SampleStruct.hoverSampleStruct !== undefined,
    ],
    [
      TraceRow.ROW_TYPE_GPU_COUNTER,
      (): boolean =>
        GpuCounterStruct.hoverGpuCounterStruct !== null && GpuCounterStruct.hoverGpuCounterStruct !== undefined,
    ],
    [
      TraceRow.ROW_TYPE_CPU_FREQ,
      (): boolean => CpuFreqStruct.hoverCpuFreqStruct !== null && CpuFreqStruct.hoverCpuFreqStruct !== undefined,
    ],
    [
      TraceRow.ROW_TYPE_CPU_STATE,
      (): boolean => CpuStateStruct.hoverStateStruct !== null && CpuStateStruct.hoverStateStruct !== undefined,
    ],
    [
      TraceRow.ROW_TYPE_CPU_FREQ_LIMIT,
      (): boolean =>
        CpuFreqLimitsStruct.hoverCpuFreqLimitsStruct !== null &&
        CpuFreqLimitsStruct.hoverCpuFreqLimitsStruct !== undefined,
    ],
    [
      TraceRow.ROW_TYPE_CLOCK,
      (): boolean => ClockStruct.hoverClockStruct !== null && ClockStruct.hoverClockStruct !== undefined,
    ],
    [TraceRow.ROW_TYPE_IRQ, (): boolean => IrqStruct.hoverIrqStruct !== null && IrqStruct.hoverIrqStruct !== undefined],
    [
      TraceRow.ROW_TYPE_APP_STARTUP,
      (): boolean => AppStartupStruct.hoverStartupStruct !== null && AppStartupStruct.hoverStartupStruct !== undefined,
    ],
    [
      TraceRow.ROW_TYPE_ALL_APPSTARTUPS,
      (): boolean =>
        AllAppStartupStruct.hoverStartupStruct !== null && AllAppStartupStruct.hoverStartupStruct !== undefined,
    ],
    [
      TraceRow.ROW_TYPE_STATIC_INIT,
      (): boolean => SoStruct.hoverSoStruct !== null && SoStruct.hoverSoStruct !== undefined,
    ],
    [
      TraceRow.ROW_TYPE_JANK,
      (): boolean => JankStruct.hoverJankStruct !== null && JankStruct.hoverJankStruct !== undefined,
    ],
    [
      TraceRow.ROW_TYPE_HEAP,
      (): boolean => HeapStruct.hoverHeapStruct !== null && HeapStruct.hoverHeapStruct !== undefined,
    ],
    [
      TraceRow.ROW_TYPE_SYS_MEMORY_GPU_TOTAL,
      (): boolean => SnapshotStruct.hoverSnapshotStruct !== null && SnapshotStruct.hoverSnapshotStruct !== undefined,
    ],
    [
      TraceRow.ROW_TYPE_SYS_MEMORY_GPU_WINDOW,
      (): boolean => SnapshotStruct.hoverSnapshotStruct !== null && SnapshotStruct.hoverSnapshotStruct !== undefined,
    ],
    [
      TraceRow.ROW_TYPE_HEAP_SNAPSHOT,
      (): boolean =>
        HeapSnapshotStruct.hoverSnapshotStruct !== null && HeapSnapshotStruct.hoverSnapshotStruct !== undefined,
    ],
    [
      TraceRow.ROW_TYPE_FRAME_ANIMATION,
      (): boolean =>
        FrameAnimationStruct.hoverFrameAnimationStruct !== null &&
        FrameAnimationStruct.hoverFrameAnimationStruct !== undefined,
    ],
    [
      TraceRow.ROW_TYPE_FRAME_DYNAMIC,
      (): boolean =>
        FrameDynamicStruct.hoverFrameDynamicStruct !== null && FrameDynamicStruct.hoverFrameDynamicStruct !== undefined,
    ],
    [
      TraceRow.ROW_TYPE_FRAME_SPACING,
      (): boolean =>
        FrameSpacingStruct.hoverFrameSpacingStruct !== null && FrameSpacingStruct.hoverFrameSpacingStruct !== undefined,
    ],
    [
      TraceRow.ROW_TYPE_JS_CPU_PROFILER,
      (): boolean =>
        JsCpuProfilerStruct.hoverJsCpuProfilerStruct !== null &&
        JsCpuProfilerStruct.hoverJsCpuProfilerStruct !== undefined,
    ],
    [
      TraceRow.ROW_TYPE_PURGEABLE_TOTAL_ABILITY,
      (): boolean => SnapshotStruct.hoverSnapshotStruct !== null && SnapshotStruct.hoverSnapshotStruct !== undefined,
    ],
    [
      TraceRow.ROW_TYPE_PURGEABLE_PIN_ABILITY,
      (): boolean => SnapshotStruct.hoverSnapshotStruct !== null && SnapshotStruct.hoverSnapshotStruct !== undefined,
    ],
    [
      TraceRow.ROW_TYPE_PURGEABLE_TOTAL_VM,
      (): boolean => SnapshotStruct.hoverSnapshotStruct !== null && SnapshotStruct.hoverSnapshotStruct !== undefined,
    ],
    [
      TraceRow.ROW_TYPE_PURGEABLE_PIN_VM,
      (): boolean => SnapshotStruct.hoverSnapshotStruct !== null && SnapshotStruct.hoverSnapshotStruct !== undefined,
    ],
    [
      TraceRow.ROW_TYPE_DMA_ABILITY,
      (): boolean => SnapshotStruct.hoverSnapshotStruct !== null && SnapshotStruct.hoverSnapshotStruct !== undefined,
    ],
    [
      TraceRow.ROW_TYPE_DMA_VMTRACKER,
      (): boolean => SnapshotStruct.hoverSnapshotStruct !== null && SnapshotStruct.hoverSnapshotStruct !== undefined,
    ],
    [
      TraceRow.ROW_TYPE_GPU_MEMORY_ABILITY,
      (): boolean => SnapshotStruct.hoverSnapshotStruct !== null && SnapshotStruct.hoverSnapshotStruct !== undefined,
    ],
    [
      TraceRow.ROW_TYPE_GPU_MEMORY_VMTRACKER,
      (): boolean => SnapshotStruct.hoverSnapshotStruct !== null && SnapshotStruct.hoverSnapshotStruct !== undefined,
    ],
    [
      TraceRow.ROW_TYPE_GPU_RESOURCE_VMTRACKER,
      (): boolean => SnapshotStruct.hoverSnapshotStruct !== null && SnapshotStruct.hoverSnapshotStruct !== undefined,
    ],
    [
      TraceRow.ROW_TYPE_VMTRACKER_SHM,
      (): boolean => SnapshotStruct.hoverSnapshotStruct !== null && SnapshotStruct.hoverSnapshotStruct !== undefined,
    ],
    [
      TraceRow.ROW_TYPE_VM_TRACKER_SMAPS,
      (): boolean => SnapshotStruct.hoverSnapshotStruct !== null && SnapshotStruct.hoverSnapshotStruct !== undefined,
    ],
  ]);

  // @ts-ignore
  onClickHandler(clickRowType: string, row?: TraceRow<unknown>, entry?: unknown): void {
    spSystemTraceOnClickHandler(this, clickRowType, row as TraceRow<BaseStruct>, entry);
  }

  makePoint(
    ts: number,
    dur: number,
    translateY: number,
    rowStruct: unknown,
    offsetY: number,
    business: string,
    lineType: LineType,
    isRight: boolean
  ): PairPoint {
    return {
      x: ns2xByTimeShaft(ts + dur, this.timerShaftEL!),
      y: translateY!,
      offsetY: offsetY,
      ns: ts + dur, // @ts-ignore
      rowEL: rowStruct!,
      isRight: isRight,
      business: business,
      lineType: lineType,
    };
  }
  // @ts-ignore
  drawTaskPollLine(row?: TraceRow<unknown>): void {
    spSystemTraceDrawTaskPollLine(this, row);
  }
  drawJankLine(
    endParentRow: unknown,
    selectJankStruct: JankStruct,
    data: unknown,
    isBinderClick: boolean = false
  ): void {
    spSystemTraceDrawJankLine(this, endParentRow, selectJankStruct, data, isBinderClick);
  }

  drawDistributedLine(
    sourceData: FuncStruct,
    targetData: FuncStruct,
    selectFuncStruct: FuncStruct,
  ): void {
    spSystemTraceDrawDistributedLine(this, sourceData, targetData, selectFuncStruct);
  }

  drawThreadLine(endParentRow: unknown, selectThreadStruct: ThreadStruct | undefined, data: unknown): void {
    spSystemTraceDrawThreadLine(this, endParentRow, selectThreadStruct, data);
  }

  drawFuncLine(endParentRow: unknown, selectFuncStruct: FuncStruct | undefined, data: unknown, binderTid: Number): void {
    spSystemTraceDrawFuncLine(this, endParentRow, selectFuncStruct, data, binderTid);
  }

  getStartRow(selectRowId: number | undefined, collectList: unknown[]): unknown {
    let startRow = this.shadowRoot?.querySelector<TraceRow<ThreadStruct>>(
      `trace-row[row-id='${selectRowId}'][row-type='thread']`
    );
    if (!startRow) {
      for (let collectChart of collectList) {
        // @ts-ignore
        if (collectChart.rowId === selectRowId?.toString() && collectChart.rowType === 'thread') {
          // @ts-ignore
          startRow = collectChart;
          break;
        }
      }
    }
    return startRow;
  }

  calculateStartY(startRow: unknown, pid: number | undefined, selectFuncStruct?: FuncStruct): [number, unknown, number] {
    // @ts-ignore
    let startY = startRow ? startRow!.translateY! : 0;
    let startRowEl = startRow;
    let startOffSetY = selectFuncStruct ? 20 * (0.5 + Number(selectFuncStruct.depth)) : 20 * 0.5;
    // @ts-ignore
    const startParentRow = startRow ? this.shadowRoot?.querySelector<TraceRow<ThreadStruct>>(`trace-row[row-id='${startRow.rowParentId}'][folder]`) : this.shadowRoot?.querySelector<TraceRow<ThreadStruct>>(
      `trace-row[row-id='${pid}'][folder]`
    );
    const expansionFlag = this.collectionHasThread(startRow);
    if (startParentRow && !startParentRow.expansion && expansionFlag) {
      startY = startParentRow.translateY!;
      startRowEl = startParentRow;
      startOffSetY = selectFuncStruct ? 10 * (0.5 + Number(selectFuncStruct.depth)) : 10 * 0.5;
    }
    return [startY, startRowEl, startOffSetY];
  }

  calculateEndY(endParentRow: unknown, endRowStruct: unknown, data?: unknown): [number, unknown, number] {
    // @ts-ignore
    let endY = endRowStruct.translateY!;
    let endRowEl = endRowStruct;
    // @ts-ignore
    let endOffSetY = data ? 20 * (0.5 + Number(data.depth)) : 20 * 0.5;
    const expansionFlag = this.collectionHasThread(endRowStruct);
    // @ts-ignore
    if (!endParentRow.expansion && expansionFlag) {
      // @ts-ignore
      endY = endParentRow.translateY!;
      endRowEl = endParentRow;
      // @ts-ignore
      endOffSetY = data ? 10 * (0.5 + Number(data.depth)) : 10 * 0.5;
    }
    return [endY, endRowEl, endOffSetY];
  }

  collectionHasThread(threadRow: unknown): boolean {
    const collectList = this.favoriteChartListEL!.getCollectRows();
    for (let item of collectList!) {
      // @ts-ignore
      if (threadRow && item.rowId === threadRow.rowId && item.rowType === threadRow.rowType) {
        return false;
      }
    }
    return true;
  }

  translateByMouseMove(ev: MouseEvent): void {
    ev.preventDefault();
    let offset = 0;
    if (this.offsetMouse === 0) {
      this.offsetMouse = ev.clientX;
      offset = ev.clientX - this.mouseCurrentPosition;
    } else {
      offset = ev.clientX - this.offsetMouse;
    }
    this.offsetMouse = ev.clientX;
    const rangeRuler = this.timerShaftEL?.getRangeRuler()!;
    rangeRuler.translate(offset);
  }

  private eventListener(): void {
    /**
     * 监听时间轴区间变化
     */
    this.timerShaftEL!.rangeChangeHandler = this.timerShaftELRangeChange;
    this.timerShaftEL!.rangeClickHandler = this.timerShaftELRangeClick;
    this.timerShaftEL!.flagChangeHandler = this.timerShaftELFlagChange;
    this.timerShaftEL!.flagClickHandler = this.timerShaftELFlagClickHandler;
    /**
     * 监听rowsEL的滚动时间，刷新可见区域的trace-row组件的时间区间（将触发trace-row组件重绘）
     */
    this.rowsPaneEL?.addEventListener('scroll', this.rowsElOnScroll, {
      passive: true,
    });
    this.favoriteChartListEL?.addEventListener('scroll', this.favoriteRowsElOnScroll, {
      passive: true,
    });
    /**
     * 监听document的mousemove事件 坐标通过换算后找到当前鼠标所在的trace-row组件，将坐标传入
     */
    this.addEventListener('mousemove', this.documentOnMouseMove);
    this.addEventListener('click', this.documentOnClick);
    this.addEventListener('mousedown', this.documentOnMouseDown);
    this.addEventListener('mouseup', this.documentOnMouseUp);
    this.addEventListener('mouseout', this.documentOnMouseOut);
    document.addEventListener('keydown', this.documentOnKeyDown);
    document.addEventListener('keypress', this.documentOnKeyPress);
    document.addEventListener('keyup', this.documentOnKeyUp);
    document.addEventListener('contextmenu', this.onContextMenuHandler);
    this.wheelListener();
  }

  private subRecordExportListener(): void {
    window.subscribe(window.SmartEvent.UI.ExportRecord, (params) => {
      let range = this.timerShaftEL?.rangeRuler?.range;
      if (range) {
        let expandRows =
          Array.from(this.rowsEL!.querySelectorAll<TraceRow<BaseStruct>>('trace-row[folder][expansion]')) || [];
        let data = JSON.stringify({
          leftNS: range.startNS,
          rightNS: range.endNS,
          G1: this.favoriteChartListEL!.getCollectRowsInfo('1'),
          G2: this.favoriteChartListEL!.getCollectRowsInfo('2'),
          expand: expandRows.map((row) => {
            return {
              type: row.rowType,
              name: row.name,
              id: row.rowId,
            };
          }),
          scrollTop: this.rowsEL!.scrollTop,
          favoriteScrollTop: this.favoriteChartListEL!.scrollTop,
          //下载时存旗帜的信息
          drawFlag: this.timerShaftEL!.sportRuler!.flagList,
          //下载时存M和shiftM的信息
          markFlag: this.timerShaftEL!.sportRuler!.slicesTimeList,
        });
        this.downloadRecordFile(data).then(() => { });
      }
    });
  }

  private async downloadRecordFile(jsonStr: string): Promise<void> {
    let a = document.createElement('a');
    let buffer = await readTraceFileBuffer();
    if (buffer) {
      let str = `MarkPositionJSON->${jsonStr}\n`;
      let mark = new Blob([str]);
      let markBuf = await mark.arrayBuffer();
      a.href = URL.createObjectURL(new Blob([`${markBuf.byteLength}`, mark, buffer])); // @ts-ignore
      a.download = (window as unknown).traceFileName || `${new Date().getTime()}`;
      a.click();
    }
    window.publish(window.SmartEvent.UI.Loading, { loading: false, text: 'Downloading trace file with mark' });
  }

  private subRecordImportListener(): void {
    //@ts-ignore
    window.subscribe(window.SmartEvent.UI.ImportRecord, (data: string) => {
      let record = JSON.parse(data);
      if (record.leftNS !== undefined && record.rightNS !== undefined) {
        this.favoriteChartListEL?.removeAllCollectRow();
        let currentGroup = this.currentCollectGroup;
        if (record.G1) {
          this.currentCollectGroup = '1';
          this.restoreRecordCollectRows(record.G1);
        }
        if (record.G2) {
          this.currentCollectGroup = '2';
          this.restoreRecordCollectRows(record.G2);
        }
        this.restoreRecordExpandAndTimeRange(record);
        this.currentCollectGroup = currentGroup;
        if (record.drawFlag !== undefined) {
          this.timerShaftEL!.sportRuler!.flagList = record.drawFlag;//获取下载时存的旗帜信息
          this.selectFlag = this.timerShaftEL!.sportRuler!.flagList.find((it) => it.selected);//绘制被选中旗帜对应的线
        }
        if (record.markFlag !== undefined) {
          this.timerShaftEL!.sportRuler!.slicesTimeList = record.markFlag;//获取下载时存的M键信息
        }
        TraceRow.range!.refresh = true;
        this.refreshCanvas(true);
        this.restoreRecordScrollTop(record.scrollTop, record.favoriteScrollTop);
      }
    });
  }

  private restoreRecordExpandAndTimeRange(record: unknown): void {
    // @ts-ignore
    if (record.expand) {
      let expandRows = // @ts-ignore
        Array.from(this.rowsEL!.querySelectorAll<TraceRow<unknown>>('trace-row[folder][expansion]')) || [];
      // @ts-ignore
      let expands: Array<unknown> = record.expand;
      //关闭不在记录中的父泳道
      for (let expandRow of expandRows) {
        if (
          !expands.includes(
            (it: unknown) =>
              // @ts-ignore
              it.id === expandRow.rowId && it.name === expandRow.name && it.type === expandRow.rowType
          )
        ) {
          expandRow.expansion = false;
        }
      }
      //展开记录的泳道
      // @ts-ignore
      for (let it of record.expand) {
        // @ts-ignore
        let traceRow = this.rowsEL!.querySelector<TraceRow<unknown>>(
          `trace-row[folder][row-id='${it.id}'][row-type='${it.type}']`
        );
        if (traceRow && !traceRow.expansion) {
          traceRow.expansion = true;
        }
      }
    }
    // @ts-ignore
    this.timerShaftEL?.setRangeNS(record.leftNS, record.rightNS);
  }

  private restoreRecordScrollTop(mainScrollTop: number, favoriteScrollTop: number): void {
    if (mainScrollTop && mainScrollTop > 0) {
      this.rowsPaneEL!.scroll({
        top: mainScrollTop,
        left: 0,
        behavior: 'smooth',
      });
    }
    if (favoriteScrollTop && favoriteScrollTop > 0) {
      this.favoriteChartListEL?.scroll({
        top: favoriteScrollTop,
        left: 0,
        behavior: 'smooth',
      });
    }
  }

  private restoreRecordCollectRows(group: Array<unknown>): void {
    group.forEach((it: unknown) => {
      // @ts-ignore
      let traceRow: TraceRow<unknown> | undefined | null = this.rowsEL!.querySelector<TraceRow<unknown>>( // @ts-ignore
        `trace-row[row-id='${it.id}'][row-type='${it.type}']`
      );
      if (traceRow === null || traceRow === undefined) {
        // @ts-ignore
        if (it.parents.length > 0) {
          // @ts-ignore
          let rootFolder = it.parents[0]; // @ts-ignore
          let folderRow: TraceRow<unknown> | undefined | null = this.rowsEL!.querySelector<TraceRow<unknown>>(
            `trace-row[row-id='${rootFolder.id}'][row-type='${rootFolder.type}']`
          );
          if (folderRow) {
            if (!folderRow!.expansion) {
              folderRow!.expansion = true;
            } // @ts-ignore
            for (let i = 1; i < it.parents.length; i++) {
              folderRow = folderRow!.childrenList.find(
                // @ts-ignore
                (child) => child.rowId === it.parents[i].id && child.rowType === it.parents[i].type
              );
              if (!folderRow!.expansion) {
                folderRow!.expansion = true;
              }
            }
          }
          if (folderRow) {
            // @ts-ignore
            traceRow = folderRow.childrenList.find((child) => child.rowId === it.id && child.rowType === it.type);
          }
        }
      }
      if (traceRow) {
        traceRow.collectEL?.click();
      }
    });
  }

  private wheelListener(): void {
    document.addEventListener(
      'wheel',
      (e): void => {
        if (e.ctrlKey) {
          if (e.deltaY > 0) {
            e.preventDefault();
            e.stopPropagation();
            let eventS = new KeyboardEvent('keypress', {
              key: 's',
              code: '83',
              keyCode: 83,
            });
            this.timerShaftEL!.documentOnKeyPress(eventS);
            setTimeout(() => this.timerShaftEL!.documentOnKeyUp(eventS), 200);
          }
          if (e.deltaY < 0) {
            e.preventDefault();
            e.stopPropagation();
            let eventW = new KeyboardEvent('keypress', {
              key: 'w',
              code: '87',
              keyCode: 87,
            });
            this.timerShaftEL!.documentOnKeyPress(eventW);
            setTimeout(() => this.timerShaftEL!.documentOnKeyUp(eventW), 200);
          }
        }
      },
      { passive: false }
    );
  }

  connectedCallback(): void {
    this.initPointToEvent();
    this.eventListener();
    this.subRecordExportListener();
    this.subRecordImportListener();
    /**
     * 泳道图中添加ctrl+鼠标滚轮事件，对泳道图进行放大缩小。
     * 鼠标滚轮事件转化为键盘事件，keyPress和keyUp两个事件需要配合使用，
     * 否则泳道图会一直放大或一直缩小。
     * setTimeout()函数中的时间参数可以控制鼠标滚轮的频率。
     */
    SpApplication.skinChange2 = (val: boolean): void => {
      this.timerShaftEL?.render();
    };
    window.subscribe(window.SmartEvent.UI.UploadSOFile, (data): void => {
      this.chartManager?.importSoFileUpdate().then(() => {
        window.publish(window.SmartEvent.UI.Loading, { loading: false, text: 'Import So File' });
        let updateCanvas = this.traceSheetEL?.updateRangeSelect();
        if (updateCanvas) {
          this.refreshCanvas(true);
        }
      });
    });
    window.subscribe(window.SmartEvent.UI.KeyPath, (data): void => {
      this.invisibleRows.forEach((it) => (it.needRefresh = true));
      this.visibleRows.forEach((it) => (it.needRefresh = true)); //@ts-ignore
      if (data.length === 0) {
        // clear
        SpSystemTrace.keyPathList = [];
        this.refreshCanvas(false);
      } else {
        // draw
        //@ts-ignore
        queryCpuKeyPathData(data).then((res): void => {
          SpSystemTrace.keyPathList = res;
          this.refreshCanvas(false);
        });
      }
    });
    window.subscribe(window.SmartEvent.UI.CheckALL, (data): void => {
      //@ts-ignore
      this.getCollectRows((row) => row.rowParentId === data.rowId).forEach((it) => {
        //@ts-ignore
        it.checkType = data.isCheck ? '2' : '0';
      });
    });
    window.subscribe(window.SmartEvent.UI.HoverNull, () => this.hoverStructNull());
    this.subscribeBottomTabVisibleEvent();
  }

  private scrollH: number = 0;

  subscribeBottomTabVisibleEvent(): void {
    //@ts-ignore
    window.subscribe(window.SmartEvent.UI.ShowBottomTab, (data: { show: number; delta: number }): void => {
      if (data.show === 1) {
        //显示底部tab
        this.scrollH = this.rowsEL!.scrollHeight;
      } else {
        // 底部 tab 为 最小化 或者隐藏 时候
        if (this.rowsEL!.scrollHeight > this.scrollH) {
          this.rowsEL!.scrollTop = this.rowsEL!.scrollTop - data.delta;
        }
      }
    });
  }
  // @ts-ignore
  favoriteAreaSearchHandler(row: TraceRow<unknown>): void {
    if (this.timerShaftEL!.collecBtn!.hasAttribute('close')) {
      this.timerShaftEL!.collecBtn!.removeAttribute('close');
      this.favoriteChartListEL!.showCollectArea();
    }
    this.favoriteChartListEL?.expandSearchRowGroup(row);
  }

  scrollToProcess(rowId: string, rowParentId: string, rowType: string, smooth: boolean = true): void {
    let id = Utils.getDistributedRowId(rowId);
    let parentId = Utils.getDistributedRowId(rowParentId);
    let traceRow = // @ts-ignore
      this.rowsEL!.querySelector<TraceRow<unknown>>(`trace-row[row-id='${id}'][row-type='${rowType}']`) ||
      this.favoriteChartListEL!.getCollectRow((row) => row.rowId === id && row.rowType === rowType);
    if (traceRow?.collect) {
      this.favoriteChartListEL!.scroll({
        top:
          (traceRow?.offsetTop || 0) -
          this.favoriteChartListEL!.getCanvas()!.offsetHeight +
          (traceRow?.offsetHeight || 0),
        left: 0,
        behavior: smooth ? 'smooth' : undefined,
      });
    } else {
      // @ts-ignore
      let row = this.rowsEL!.querySelector<TraceRow<unknown>>(`trace-row[row-id='${parentId}'][folder]`);
      if (row && !row.expansion) {
        row.expansion = true;
      }
      if (traceRow && traceRow.offsetTop >= 0 && traceRow.offsetHeight >= 0) {
        this.rowsPaneEL!.scroll({
          top: (traceRow?.offsetTop || 0) - this.canvasPanel!.offsetHeight + (traceRow?.offsetHeight || 0),
          left: 0,
          behavior: smooth ? 'smooth' : undefined,
        });
      }
    }
  }

  scrollToDepth(rowId: string, rowParentId: string, rowType: string, smooth: boolean = true, depth: number): void {
    let rootRow = // @ts-ignore
      this.rowsEL!.querySelector<TraceRow<unknown>>(`trace-row[row-id='${rowId}'][row-type='${rowType}']`) ||
      this.favoriteChartListEL!.getCollectRow((row) => row.rowId === rowId && row.rowType === rowType);
    if (rootRow && rootRow!.collect) {
      this.favoriteAreaSearchHandler(rootRow);
      rootRow.expandFunc(rootRow, this);
      if (!this.isInViewport(rootRow)) {
        setTimeout(() => {
          rootRow!.scrollIntoView({ behavior: 'smooth' });
        }, 500);
      }
    } else {
      // @ts-ignore
      let row = this.rowsEL!.querySelector<TraceRow<unknown>>(`trace-row[row-id='${rowParentId}'][folder]`);
      if (row && !row.expansion) {
        row.expansion = true;
      }
      if (rootRow) {
        rootRow.expandFunc(rootRow, this);
      }
      setTimeout(() => {
        rootRow!.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }

  isInViewport(e: unknown): boolean {
    // @ts-ignore
    const rect = e.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  scrollToFunction(rowId: string, rowParentId: string, rowType: string, smooth: boolean = true): void {
    let id = Utils.getDistributedRowId(rowId);
    let parentId = Utils.getDistributedRowId(rowParentId);
    let condition = `trace-row[row-id='${id}'][row-type='${rowType}'][row-parent-id='${parentId}']`;
    let rootRow = // @ts-ignore
      this.rowsEL!.querySelector<TraceRow<unknown>>(condition) ||
      this.favoriteChartListEL!.getCollectRow((row) => {
        return row.rowId === id && row.rowType === rowType && row.rowParentId === parentId;
      });
    if (rootRow?.collect) {
      this.favoriteAreaSearchHandler(rootRow);
      this.favoriteChartListEL!.scroll({
        top:
          (rootRow?.offsetTop || 0) -
          this.favoriteChartListEL!.getCanvas()!.offsetHeight +
          (rootRow?.offsetHeight || 0),
        left: 0,
        behavior: smooth ? 'smooth' : undefined,
      });
    } else {
      // @ts-ignore
      let row = this.rowsEL!.querySelector<TraceRow<unknown>>(`trace-row[row-id='${rowParentId}'][folder]`);
      if (row && !row.expansion) {
        row.expansion = true;
      }
      if (rootRow && rootRow.offsetTop >= 0 && rootRow.offsetHeight >= 0) {
        this.rowsPaneEL!.scroll({
          top: (rootRow?.offsetTop || 0) - this.canvasPanel!.offsetHeight + 20,
          left: 0,
          behavior: smooth ? 'smooth' : undefined,
        });
      }
    }
  }

  disconnectedCallback(): void {
    this.timerShaftEL?.removeEventListener('range-change', this.timerShaftELRangeChange);
    this.rowsPaneEL?.removeEventListener('scroll', this.rowsElOnScroll);
    this.favoriteChartListEL?.removeEventListener('scroll', this.favoriteRowsElOnScroll);
    this.removeEventListener('mousemove', this.documentOnMouseMove);
    this.removeEventListener('click', this.documentOnClick);
    this.removeEventListener('mousedown', this.documentOnMouseDown);
    this.removeEventListener('mouseup', this.documentOnMouseUp);
    this.removeEventListener('mouseout', this.documentOnMouseOut);
    document.removeEventListener('keypress', this.documentOnKeyPress);
    document.removeEventListener('keydown', this.documentOnKeyDown);
    document.removeEventListener('keyup', this.documentOnKeyUp);
    document.removeEventListener('contextmenu', this.onContextMenuHandler);
    window.unsubscribe(window.SmartEvent.UI.SliceMark, this.sliceMarkEventHandler.bind(this));
  }

  sliceMarkEventHandler(ev: unknown): void {
    SpSystemTrace.sliceRangeMark = ev; // @ts-ignore
    let startNS = ev.timestamp - (window as unknown).recordStartNS; // @ts-ignore
    let endNS = ev.maxDuration + startNS;
    TraceRow.rangeSelectObject = {
      startX: 0,
      startNS: startNS,
      endNS: endNS,
      endX: 0,
    };
    window.publish(window.SmartEvent.UI.MenuTrace, {});
    window.publish(window.SmartEvent.UI.TimeRange, {
      // @ts-ignore
      startNS: startNS - ev.maxDuration, // @ts-ignore
      endNS: endNS + ev.maxDuration,
    });
    this.queryAllTraceRow().forEach((it) => (it.checkType = '-1'));
    this.rangeSelect.rangeTraceRow = [];
    this.selectStructNull();
    this.wakeupListNull();
    this.traceSheetEL?.setMode('hidden');
    this.removeLinkLinesByBusinessType('janks');
    this.removeLinkLinesByBusinessType('distributed');
    TraceRow.range!.refresh = true;
    this.refreshCanvas(false, 'slice mark event');
  }

  loadDatabaseUrl(
    url: string,
    progress: Function,
    complete?: ((res: { status: boolean; msg: string }) => void) | undefined
  ): void {
    this.observerScrollHeightEnable = false;
    this.init({ url: url }, '', progress, false).then((res) => {
      if (complete) {
        // @ts-ignore
        complete(res);
        window.publish(window.SmartEvent.UI.MouseEventEnable, {
          mouseEnable: true,
        });
      }
    });
  }

  loadDatabaseArrayBuffer(
    buf: ArrayBuffer,
    thirdPartyWasmConfigUrl: string,
    progress: (name: string, percent: number) => void,
    isDistributed: boolean,
    complete?: ((res: { status: boolean; msg: string }) => void) | undefined,
    buf2?: ArrayBuffer,
    fileName1?: string,
    fileName2?: string
  ): void {
    this.observerScrollHeightEnable = false;
    if (isDistributed) {
      this.timerShaftEL?.setAttribute('distributed', '');
    } else {
      this.timerShaftEL?.removeAttribute('distributed');
    }
    this.init({ buf, buf2, fileName1, fileName2 }, thirdPartyWasmConfigUrl, progress, isDistributed).then((res) => {
      // @ts-ignore
      this.rowsEL?.querySelectorAll('trace-row').forEach((it: unknown) => this.observer.observe(it));
      if (complete) {
        // @ts-ignore
        complete(res);
        window.publish(window.SmartEvent.UI.MouseEventEnable, {
          mouseEnable: true,
        });
      }
    });
  }

  loadSample = async (ev: File): Promise<void> => {
    this.observerScrollHeightEnable = false;
    await this.initSample(ev); // @ts-ignore
    this.rowsEL?.querySelectorAll('trace-row').forEach((it: unknown) => this.observer.observe(it));
    window.publish(window.SmartEvent.UI.MouseEventEnable, {
      mouseEnable: true,
    });
  };

  initSample = async (ev: File): Promise<void> => {
    this.rowsPaneEL!.scroll({
      top: 0,
      left: 0,
    });
    this.chartManager?.initSample(ev).then((): void => {
      this.loadTraceCompleted = true; // @ts-ignore
      this.rowsEL!.querySelectorAll<TraceRow<unknown>>('trace-row').forEach((it): void => {
        this.intersectionObserver?.observe(it);
      });
    });
  };

  loadGpuCounter = async (ev: File): Promise<void> => {
    this.observerScrollHeightEnable = false;
    await this.initGpuCounter(ev);
    // @ts-ignore
    this.rowsEL?.querySelectorAll('trace-row').forEach((it: unknown) => this.observer.observe(it));
    window.publish(window.SmartEvent.UI.MouseEventEnable, {
      mouseEnable: true,
    });
  };

  initGpuCounter = async (ev: File): Promise<void> => {
    this.rowsPaneEL!.scroll({
      top: 0,
      left: 0,
    });
    this.chartManager?.initGpuCounter(ev).then(() => {
      this.loadTraceCompleted = true;
      // @ts-ignore
      this.rowsEL!.querySelectorAll<TraceRow<unknown>>('trace-row').forEach((it) => {
        this.intersectionObserver?.observe(it);
      });
    });
  };

  // @ts-ignore
  queryAllTraceRow<T>(selectors?: string, filter?: (row: TraceRow<unknown>) => boolean): TraceRow<unknown>[] {
    return [
      // @ts-ignore
      ...this.rowsEL!.querySelectorAll<TraceRow<unknown>>(selectors ?? 'trace-row'),
      ...this.favoriteChartListEL!.getCollectRows(filter),
    ];
  }

  search(query: string): void {
    this.queryAllTraceRow().forEach((item): void => {
      if (query === null || query === undefined || query === '') {
        if (
          item.rowType === TraceRow.ROW_TYPE_CPU ||
          item.rowType === TraceRow.ROW_TYPE_CPU_FREQ ||
          item.rowType === TraceRow.ROW_TYPE_NATIVE_MEMORY ||
          item.rowType === TraceRow.ROW_TYPE_FPS ||
          item.rowType === TraceRow.ROW_TYPE_PROCESS ||
          item.rowType === TraceRow.ROW_TYPE_CPU_ABILITY ||
          item.rowType === TraceRow.ROW_TYPE_MEMORY_ABILITY ||
          item.rowType === TraceRow.ROW_TYPE_DISK_ABILITY ||
          item.rowType === TraceRow.ROW_TYPE_NETWORK_ABILITY
        ) {
          item.expansion = false;
          item.rowHidden = false;
        } else {
          item.rowHidden = true;
        }
      } else {
        item.rowHidden = item.name.toLowerCase().indexOf(query.toLowerCase()) < 0;
      }
    });
    this.visibleRows.forEach((it) => (it.rowHidden = false && it.draw(true)));
  }

  async searchCPU(query: string): Promise<Array<unknown>> {
    let pidArr: Array<number> = [];
    let tidArr: Array<number> = [];
    let processMap = Utils.getInstance().getProcessMap(Utils.currentSelectTrace);
    let threadMap = Utils.getInstance().getThreadMap(Utils.currentSelectTrace);
    for (let key of processMap.keys()) {
      if (`${key}`.includes(query) || (processMap.get(key) || '').includes(query)) {
        pidArr.push(key);
      }
    }
    for (let key of threadMap.keys()) {
      if (`${key}`.includes(query) || (threadMap.get(key) || '').includes(query)) {
        tidArr.push(key);
      }
    }
    return await searchCpuDataSender(pidArr, tidArr, Utils.currentSelectTrace);
  }
  //根据seach的内容匹配异步缓存数据中那些符合条件
  seachAsyncFunc(query: string): unknown[] {
    let asyncFuncArr: Array<unknown> = [];
    let strNew = (str: unknown): string => {
      const specialChars = {
        '': '\\^',
        '$': '\\$',
        '.': '\\.',
        '*': '\\*',
        '+': '\\+',
        '?': '\\?',
        '-': '\\-',
        '|': '\\|',
        '(': '\\(',
        ')': '\\)',
        '[': '\\[',
        ']': '\\]',
        '{': '\\{',
        '}': '\\}',
      };
      // @ts-ignore
      return str.replace(/[$\^.*+?|()\[\]{}-]/g, (match: string) => specialChars[match as keyof typeof specialChars]); // 类型断言
    };
    let regex = new RegExp(strNew(query), 'i');
    SpProcessChart.asyncFuncCache.forEach((item: unknown) => {
      // @ts-ignore
      if (regex.test(item.funName)) {
        asyncFuncArr.push(item);
      }
    });
    return asyncFuncArr;
  }

  async searchFunction(cpuList: Array<unknown>, asynList: Array<unknown>, query: string): Promise<Array<unknown>> {
    let processList: Array<string> = [];
    let traceRow = // @ts-ignore
      this.shadowRoot!.querySelector<TraceRow<unknown>>('trace-row[scene]') ||
      this.favoriteChartListEL!.getCollectRow((row) => row.hasAttribute('scene'));
    if (traceRow) {
      // @ts-ignore
      this.shadowRoot!.querySelectorAll<TraceRow<unknown>>("trace-row[row-type='process'][scene]").forEach(
        (row): void => {
          let rowId = row.rowId;
          if (rowId && rowId.includes('-')) {
            rowId = rowId.split('-')[0];
          }
          processList.push(rowId as string);
        }
      );
      if (query.includes('_')) {
        query = query.replace(/_/g, '\\_');
      }
      if (query.includes('%')) {
        query = query.replace(/%/g, '\\%');
      }
      let list = await querySceneSearchFunc(query, processList);
      cpuList = cpuList.concat(asynList);
      cpuList = cpuList.concat(list); // @ts-ignore
      cpuList.sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
      return cpuList;
    } else {
      let list = await querySearchFunc(query);
      cpuList = cpuList.concat(asynList);
      cpuList = cpuList.concat(list); // @ts-ignore
      cpuList.sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
      return cpuList;
    }
  }

  searchTargetTraceHandler(): void {
    if (Utils.currentSelectTrace) {
      // @ts-ignore
      let traceFolder1 = this.shadowRoot!.querySelector<TraceRow<unknown>>(`trace-row[row-id='trace-1']`);
      // @ts-ignore
      let traceFolder2 = this.shadowRoot!.querySelector<TraceRow<unknown>>(`trace-row[row-id='trace-2']`);
      if (Utils.currentSelectTrace === '1') {
        if (traceFolder2?.expansion) {
          traceFolder2!.expansion = false;
        }
        traceFolder1!.expansion = true;
      } else {
        if (traceFolder1?.expansion) {
          traceFolder1!.expansion = false;
        }
        traceFolder2!.expansion = true;
      }
    }
  }

  searchSdk(dataList: Array<unknown>, query: string): Array<unknown> {
    let traceRow = // @ts-ignore
      this.shadowRoot!.querySelector<TraceRow<unknown>>('trace-row[scene]') ||
      this.favoriteChartListEL!.getCollectRow((row) => row.hasAttribute('scene'));
    let dataAll = "trace-row[row-type^='sdk']";
    if (traceRow) {
      dataAll = "trace-row[row-type^='sdk'][scene]";
    }
    let allTraceRow: unknown = []; // @ts-ignore
    let parentRows = this.shadowRoot!.querySelectorAll<TraceRow<unknown>>(`${dataAll}`); // @ts-ignore
    parentRows.forEach((parentRow: TraceRow<unknown>): void => {
      // @ts-ignore
      allTraceRow.push(parentRow);
      if (parentRow.childrenList && parentRow.childrenList.length > 0) {
        // @ts-ignore
        allTraceRow.push(...parentRow.childrenList);
      }
    }); // @ts-ignore
    allTraceRow.forEach((row: unknown): void => {
      // @ts-ignore
      if (row!.name.indexOf(query) >= 0) {
        let searchSdkBean = new SearchSdkBean();
        searchSdkBean.startTime = TraceRow.range!.startNS;
        searchSdkBean.dur = TraceRow.range!.totalNS; // @ts-ignore
        searchSdkBean.name = row.name; // @ts-ignore
        searchSdkBean.rowId = row.rowId;
        searchSdkBean.type = 'sdk'; // @ts-ignore
        searchSdkBean.rowType = row.rowType; // @ts-ignore
        searchSdkBean.rowParentId = row.rowParentId;
        dataList.push(searchSdkBean);
      }
    });
    return dataList;
  }

  showStruct(previous: boolean, currentIndex: number, structs: Array<unknown>, retargetIndex?: number): number {
    return spSystemTraceShowStruct(this, previous, currentIndex, structs, retargetIndex);
  }

  private toTargetDepth = (entry: unknown, funcRowID: string, funcStract: unknown): void => {
    if (entry) {
      this.hoverStructNull();
      this.selectStructNull();
      this.wakeupListNull();
      // @ts-ignore
      FuncStruct.hoverFuncStruct = entry; // @ts-ignore
      FuncStruct.selectFuncStruct = entry;
      this.scrollToDepth(
        `${funcRowID}`, // @ts-ignore
        `${Utils.getDistributedRowId(funcStract.pid)}`,
        'func',
        true, // @ts-ignore
        entry.depth || 0
      );
      // 鼠标左键点击不需要触发点击事件
      if (FuncStruct.funcSelect) {
        this.onClickHandler(TraceRow.ROW_TYPE_FUNC, undefined, entry);
      } // @ts-ignore
      FuncStruct.funcSelect = true;
    }
  };

  scrollToActFunc(funcStract: unknown, highlight: boolean): void {
    if (!Utils.isBinder(funcStract)) {
      // @ts-ignore
      if (funcStract.dur === -1 || funcStract.dur === null || funcStract.dur === undefined) {
        // @ts-ignore
        funcStract.dur = (TraceRow.range?.totalNS || 0) - (funcStract.startTs || 0); // @ts-ignore
        funcStract.flag = 'Did not end';
      }
    }
    //@ts-ignore
    let funId = funcStract.row_id === null ? `${funcStract.funName}-${funcStract.pid}` : funcStract.row_id;
    //@ts-ignore
    let funcRowID = (funcStract.cookie === null || funcStract.cookie === undefined) ? `${Utils.getDistributedRowId(funcStract.tid)}` : funId;
    let targetRow = this.favoriteChartListEL?.getCollectRow((row) => {
      return row.rowId === funcRowID && row.rowType === 'func';
    });
    if (targetRow) {
      targetRow.fixedList[0] = funcStract;
      targetRow.highlight = highlight;
      //如果目标泳道图在收藏上面，则跳转至收藏
      this.toTargetDepth(funcStract, funcRowID, funcStract);
      return;
    }
    let parentRow = this.rowsEL!.querySelector<TraceRow<BaseStruct>>(
      // @ts-ignore
      `trace-row[row-id='${Utils.getDistributedRowId(funcStract.pid)}'][folder]`
    );
    if (!parentRow) {
      return;
    }
    let filterRow = parentRow.childrenList.filter((child) => child.rowId === funcRowID && child.rowType === 'func')[0];
    if (!filterRow) {
      // @ts-ignore
      let funcRow = this.rowsEL?.querySelector<TraceRow<unknown>>(`trace-row[row-id='${funcRowID}'][row-type='func']`);
      if (funcRow) {
        filterRow = funcRow;
      } else {
        return;
      }
    }
    filterRow.fixedList = [funcStract];
    filterRow!.highlight = highlight;
    let row = this.rowsEL!.querySelector<TraceRow<BaseStruct>>( // @ts-ignore
      `trace-row[row-id='${Utils.getDistributedRowId(funcStract.pid)}'][folder]`
    );
    this.currentRow = row;
    if (row && !row.expansion) {
      row.expansion = true;
    }
    const completeEntry = (): void => {
      this.toTargetDepth(filterRow.fixedList[0], funcRowID, funcStract);
    };
    if (filterRow!.isComplete) {
      completeEntry();
    } else {
      // @ts-ignore
      this.scrollToProcess(`${funcStract.tid}`, `${funcStract.pid}`, 'thread', false); // @ts-ignore
      this.scrollToFunction(`${funcStract.tid}`, `${funcStract.pid}`, 'func', true);
      // filterRow!.onComplete = completeEntry;
      completeEntry();
    }
  }

  closeAllExpandRows(pid: string): void {
    let expandRows = this.rowsEL?.querySelectorAll<TraceRow<ProcessStruct>>("trace-row[row-type='process'][expansion]");
    expandRows?.forEach((row): void => {
      if (row.rowId !== pid) {
        row.expansion = false;
      }
    });
  }

  moveRangeToLeft(startTime: number, dur: number): void {
    let startNS = this.timerShaftEL?.getRange()?.startNS || 0;
    let endNS = this.timerShaftEL?.getRange()?.endNS || 0;
    let harfDur = Math.trunc(endNS - startNS - dur / 2);
    let leftNs = startTime;
    let rightNs = startTime + dur + harfDur;
    if (startTime - harfDur < 0) {
      leftNs = 0;
      rightNs += harfDur - startTime;
    }
    this.timerShaftEL?.setRangeNS(leftNs, rightNs);
    TraceRow.range!.refresh = true;
    this.refreshCanvas(true, 'move range to left');
  }

  moveRangeToCenter(startTime: number, dur: number): void {
    let startNS = this.timerShaftEL?.getRange()?.startNS || 0;
    let endNS = this.timerShaftEL?.getRange()?.endNS || 0;
    let harfDur = Math.trunc((endNS - startNS) / 2 - dur / 2);
    let leftNs = startTime - harfDur;
    let rightNs = startTime + dur + harfDur;
    if (startTime - harfDur < 0) {
      leftNs = 0;
      rightNs += harfDur - startTime;
    }
    this.timerShaftEL?.setRangeNS(leftNs, rightNs);
    TraceRow.range!.refresh = true;
    this.refreshCanvas(true, 'move range to center');
  }

  rechargeCpuData(it: CpuStruct, next: CpuStruct | undefined): void {
    let p = Utils.getInstance().getProcessMap().get(it.processId!);
    let t = Utils.getInstance().getThreadMap().get(it.tid!);
    let slice = Utils.getInstance().getSchedSliceMap().get(`${it.id}-${it.startTime}`);
    if (slice) {
      it.end_state = slice.endState;
      it.priority = slice.priority;
    }
    it.processName = p;
    it.processCmdLine = p;
    it.name = t;
    if (next) {
      if (it.startTime! + it.dur! > next!.startTime! || it.dur === -1 || it.dur === null || it.dur === undefined) {
        it.dur = next!.startTime! - it.startTime!;
        it.nofinish = true;
      }
    } else {
      if (it.dur === -1 || it.dur === null || it.dur === undefined) {
        it.dur = TraceRow.range!.endNS - it.startTime!;
        it.nofinish = true;
      }
    }
  }

  reset(progress: Function | undefined | null): void {
    this.visibleRows.length = 0;
    this.tipEL!.style.display = 'none';
    this.canvasPanelCtx?.clearRect(0, 0, this.canvasPanel!.clientWidth, this.canvasPanel!.offsetHeight);
    this.loadTraceCompleted = false;
    this.collectRows = [];
    this.visibleRows = [];
    TraceRowConfig.allTraceRowList.forEach((it) => {
      it.clearMemory();
    });
    TraceRowConfig.allTraceRowList = [];
    this.favoriteChartListEL!.reset();
    if (this.rowsEL) {
      // @ts-ignore
      this.rowsEL.querySelectorAll<TraceRow<unknown>>('trace-row').forEach((row) => {
        row.clearMemory();
        this.rowsEL!.removeChild(row);
      });
    }
    this.traceSheetEL?.clearMemory();
    this.spacerEL!.style.height = '0px';
    this.rangeSelect.rangeTraceRow = [];
    SpSystemTrace.SDK_CONFIG_MAP = undefined;
    SpSystemTrace.sliceRangeMark = undefined;
    this.timerShaftEL?.displayCollect(false);
    this.timerShaftEL!.collecBtn!.removeAttribute('close');
    CpuStruct.wakeupBean = undefined;
    this.selectStructNull();
    this.hoverStructNull();
    this.wakeupListNull();
    this.traceSheetEL?.setMode('hidden');
    progress?.('rest timershaft', 8);
    this.timerShaftEL?.reset();
    progress?.('clear cache', 10);
    HeapDataInterface.getInstance().clearData();
    procedurePool.clearCache();
    Utils.clearData();
    InitAnalysis.getInstance().isInitAnalysis = true;
    procedurePool.submitWithName('logic0', 'clear', {}, undefined, (res: unknown) => { });
    if (threadPool) {
      threadPool.submitProto(QueryEnum.ClearMemoryCache, {}, (res: unknown, len: number): void => { });
    }
    if (threadPool2) {
      threadPool2.submitProto(QueryEnum.ClearMemoryCache, {}, (res: unknown, len: number): void => { });
    }
    this.times.clear();
    resetVSync();
    SpSystemTrace.keyPathList = [];
    Utils.isTransformed = false;
  }

  init = async (
    param: { buf?: ArrayBuffer; url?: string; buf2?: ArrayBuffer; fileName1?: string; fileName2?: string },
    wasmConfigUri: string,
    progress: Function,
    isDistributed: boolean
  ): Promise<unknown> => {
    return spSystemTraceInit(this, param, wasmConfigUri, progress, isDistributed);
  };
  // @ts-ignore
  extracted(it: TraceRow<unknown>) {
    return (): void => {
      if (it.hasAttribute('expansion')) {
        it.childrenList.forEach((child): void => {
          if (child.hasAttribute('scene') && !child.collect) {
            child.rowHidden = false;
          }
          if (child.folder) {
            child.addEventListener('expansion-change', this.extracted(child));
          }
          this.intersectionObserver?.observe(child);
        });
      } else {
        //@ts-ignore
        let parentElTopHeight = it.hasParentRowEl ? //@ts-ignore
          (it.parentRowEl.getBoundingClientRect().top + it.parentRowEl.clientHeight) : this.rowsPaneEL!.getBoundingClientRect().top;
        it.childrenList.forEach((child): void => {
          if (child.hasAttribute('scene') && !child.collect) {
            child.rowHidden = true;
            this.intersectionObserver?.unobserve(child);
          }
          if (child.folder) {
            child.removeEventListener('expansion-change', this.extracted(child));
          }
        });
        if (it.getBoundingClientRect().top < 0) {
          this.rowsPaneEL!.scrollTop =
            this.rowsPaneEL!.scrollTop -
            (it.getBoundingClientRect().top * -1 + parentElTopHeight);
        } else if (it.getBoundingClientRect().top > 0) {
          this.rowsPaneEL!.scrollTop =
            parentElTopHeight <
              it.getBoundingClientRect().top ?
              this.rowsPaneEL!.scrollTop :
              this.rowsPaneEL!.scrollTop -
              (parentElTopHeight - it.getBoundingClientRect().top);
        } else {
          this.rowsPaneEL!.scrollTop =
            this.rowsPaneEL!.scrollTop -
            parentElTopHeight;
        }
        this.linkNodes.map((value): void => {
          if ('task' === value[0].business && value[0].rowEL.parentRowEl?.rowId === it.rowId) {
            value[0].hidden = true;
            value[1].hidden = true;
            this.clickEmptyArea();
          }
        });
      }
      this.resetDistributedLine();
      if (!this.collapseAll) {
        this.refreshCanvas(false, 'extracted');
      }
    };
  }

  resetDistributedLine(): void {
    if (FuncStruct.selectFuncStruct) {
      let dataList = FuncStruct.selectLineFuncStruct;
      this.removeLinkLinesByBusinessType('distributed');
      FuncStruct.selectLineFuncStruct = dataList;
      for (let index = 0; index < FuncStruct.selectLineFuncStruct.length; index++) {
        let sourceData = FuncStruct.selectLineFuncStruct[index];
        if (index !== FuncStruct.selectLineFuncStruct.length - 1) {
          let targetData = FuncStruct.selectLineFuncStruct[index + 1];
          this.drawDistributedLine(sourceData, targetData, FuncStruct.selectFuncStruct!);
        }
      }
      this.refreshCanvas(true);
    }
  }

  // @ts-ignore
  displayTip(row: TraceRow<unknown>, struct: unknown, html: string): void {
    let x = row.hoverX + 248;
    let y = row.getBoundingClientRect().top - this.getBoundingClientRect().top;
    if ((struct === undefined || struct === null) && this.tipEL) {
      this.tipEL.style.display = 'none';
      return;
    }
    if (this.tipEL) {
      this.tipEL.innerHTML = html;
      if (
        row.rowType === TraceRow.ROW_TYPE_JS_CPU_PROFILER ||
        row.rowType === TraceRow.ROW_TYPE_PERF_CALLCHART ||
        row.rowType === TraceRow.ROW_TYPE_BINDER_COUNT
      ) {
        this.tipEL.style.maxWidth = `${row.clientWidth / 3} px`;
        this.tipEL.style.wordBreak = ' break-all';
        this.tipEL.style.height = 'unset';
        this.tipEL.style.display = 'block'; // @ts-ignore
        y = y + struct.depth * 20;
        if (row.rowType === TraceRow.ROW_TYPE_BINDER_COUNT) {
          this.tipEL.style.height = 'auto';
          y = row.hoverY + row.getBoundingClientRect().top - this.getBoundingClientRect().top;
        }
      } else {
        this.tipEL.style.display = 'flex';
        this.tipEL.style.height = row.style.height;
      }
      if (x + this.tipEL.clientWidth > (this.canvasPanel!.clientWidth ?? 0)) {
        this.tipEL.style.transform = `translateX(${x - this.tipEL.clientWidth - 1}px) translateY(${y}px)`;
      } else {
        this.tipEL.style.transform = `translateX(${x}px) translateY(${y}px)`;
      }
    }
  }

  queryCPUWakeUpList(data: WakeupBean): void {
    TabPaneCurrentSelection.queryCPUWakeUpListFromBean(data).then((a: unknown) => {
      if (a === null) {
        window.publish(window.SmartEvent.UI.WakeupList, SpSystemTrace.wakeupList);
        return null;
      } // @ts-ignore
      SpSystemTrace.wakeupList.push(a); // @ts-ignore
      this.queryCPUWakeUpList(a);
    });
  }

  wakeupListNull(): SpSystemTrace {
    SpSystemTrace.wakeupList = [];
    return this;
  }

  initPointToEvent(): void {
    spSystemTraceInitPointToEvent(this);
  }

  initHtml(): string {
    return SpSystemTraceHtml;
  }
}
