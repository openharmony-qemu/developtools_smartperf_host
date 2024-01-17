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
import { threadPool } from '../database/SqlLite';
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
import { LogStruct } from '../database/ui-worker/ProcedureWorkerLog';
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
import {
  spSystemTraceInit,
  spSystemTraceInitElement,
  spSystemTraceInitPointToEvent,
  spSystemTraceShowStruct,
} from './SpSystemTrace.init';
import {
  spSystemTraceDrawJankLine,
  spSystemTraceDrawTaskPollLine,
  spSystemTraceDrawThreadLine,
} from './SpSystemTrace.line';
import spSystemTraceOnClickHandler, {
  spSystemTraceDocumentOnClick,
  spSystemTraceDocumentOnKeyDown,
  SpSystemTraceDocumentOnKeyPress,
  spSystemTraceDocumentOnKeyUp,
  spSystemTraceDocumentOnMouseDown,
  spSystemTraceDocumentOnMouseMove,
  spSystemTraceDocumentOnMouseOut,
  spSystemTraceDocumentOnMouseUp,
} from './SpSystemTrace.event';

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
  offsetMouse = 0;
  isMouseLeftDown = false;
  static scrollViewWidth = 0;
  static isCanvasOffScreen = true;
  static DATA_DICT: Map<number, string> = new Map<number, string>();
  static DATA_TASK_POOL_CALLSTACK: Map<number, { id: number; ts: number; dur: number; name: string }> = new Map<
    number,
    { id: number; ts: number; dur: number; name: string }
  >();
  static SDK_CONFIG_MAP: any;
  static sliceRangeMark: any;
  static wakeupList: Array<WakeupBean> = [];
  static keyPathList: Array<CpuStruct> = [];
  static jsProfilerMap: Map<number, any> = new Map<number, any>();
  times: Set<number> = new Set<number>();
  currentSlicesTime: CurrentSlicesTime = new CurrentSlicesTime();
  intersectionObserver: IntersectionObserver | undefined;
  tipEL: HTMLDivElementAlias;
  rowsEL: HTMLDivElementAlias;
  rowsPaneEL: HTMLDivElementAlias;
  stateRowsId: Array<object> = [];
  spacerEL: HTMLDivElementAlias;
  visibleRows: Array<TraceRow<any>> = [];
  invisibleRows: Array<TraceRow<any>> = [];
  collectRows: Array<TraceRow<any>> = [];
  currentRow: TraceRow<any> | undefined | null;
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
  static btnTimer: any = null;
  isMousePointInSheet = false;
  hoverFlag: FlagAlias;
  selectFlag: FlagAlias;
  slicestime: SlicesTimeAlias;
  public timerShaftEL: TimerShaftElement | null | undefined;
  public traceSheetEL: TraceSheet | undefined | null;
  public rangeSelect!: RangeSelect;
  chartManager: SpChartManager | undefined | null;
  loadTraceCompleted: boolean = false;
  rangeTraceRow: Array<TraceRow<any>> | undefined = [];
  canvasFavoritePanelCtx: CanvasRenderingContext2D | null | undefined;
  canvasPanel: HTMLCanvasElement | null | undefined; //绘制取消收藏后泳道图
  canvasPanelCtx: CanvasRenderingContext2D | undefined | null;
  linkNodes: PairPoint[][] = [];
  public currentClickRow: HTMLDivElement | undefined | null;
  private litTabs: LitTabs | undefined | null;
  eventMap: any = {};
  isSelectClick: boolean = false;
  selectionParam: SelectionParam | undefined;
  snapshotFiles: FileInfo | null | undefined;
  tabCpuFreq: TabPaneFrequencySample | undefined | null;
  tabCpuState: TabPaneCounterSample | undefined | null;
  collapseAll: boolean = false;
  currentCollectGroup: string = '1';
  private _list: Array<SlicesTime> = [];
  expandRowList: Array<TraceRow<any>> = [];
  _slicesList: Array<SlicesTime> = [];
  _flagList: Array<any> = [];

  set snapshotFile(data: FileInfo) {
    this.snapshotFiles = data;
  }

  set slicesList(list: Array<SlicesTime>) {
    this._slicesList = list;
  }

  set flagList(list: Array<any>) {
    this._flagList = list;
  }

  //节流处理
  throttle(fn: Function, t: number, ev?: any): Function {
    let timerId: any = null;
    return () => {
      if (!timerId) {
        timerId = setTimeout(function () {
          if (ev) {
            fn(ev);
          } else {
            fn();
          }
          timerId = null;
        }, t);
        this.times.add(timerId);
      }
    };
  }

  // 防抖处理
  debounce(fn: Function, ms: number, ev?: any): Function {
    let timerId: undefined | number;
    return () => {
      if (timerId) {
        window.clearTimeout(timerId);
      } else {
        timerId = window.setTimeout(() => {
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

  addPointPair(startPoint: PairPoint, endPoint: PairPoint): void {
    if (startPoint.rowEL.collect) {
      startPoint.rowEL.translateY = startPoint.rowEL.getBoundingClientRect().top - 195;
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
    this.linkNodes.push([startPoint, endPoint]);
  }

  clearPointPair(): void {
    this.linkNodes.length = 0;
  }

  removeLinkLinesByBusinessType(...businessTypes: string[]): void {
    this.linkNodes = this.linkNodes.filter((pointPair) => {
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
        i--;
      }
    }
  }

  pushPidToSelection(selection: SelectionParam, id: string): void {
    let pid = parseInt(id);
    if (!selection.processIds.includes(pid)) {
      selection.processIds.push(pid);
    }
  }

  getCollectRows(condition: (row: TraceRow<any>) => boolean): Array<TraceRow<any>> {
    return this.favoriteChartListEL!.getCollectRows(condition);
  }

  createPointEvent(it: TraceRow<any>) {
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
          event = it.getAttribute('frame_type') + '';
        }
      } else if (it.rowType === TraceRow.ROW_TYPE_DELIVER_INPUT_EVENT) {
        event = 'DeliverInputEvent';
        if (it.rowParentId === TraceRow.ROW_TYPE_DELIVER_INPUT_EVENT) {
          event = 'DeliverInputEvent Func';
        }
      } else {
        event = it.name;
      }
      return event;
    }
  }

  private handleFileSystemType(it: TraceRow<any>, event: any) {
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
    }
    return event;
  }

  refreshFavoriteCanvas(): void {
    this.favoriteChartListEL!.refreshFavoriteCanvas();
  }

  expansionAllParentRow(currentRow: TraceRow<any>): void {
    let parentRow = this.rowsEL!.querySelector<TraceRow<any>>(
      `trace-row[row-id='${currentRow.rowParentId}'][folder][scene]`
    );
    if (parentRow) {
      parentRow.expansion = true;
      if (this.rowsEL!.querySelector<TraceRow<any>>(`trace-row[row-id='${parentRow.rowParentId}'][folder]`)) {
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
    let totalScrollDiv,
      scrollDiv,
      overflowDiv = document.createElement('div');
    overflowDiv.style.cssText = 'position:absolute; top:-2000px;width:200px; height:200px; overflow:hidden;';
    totalScrollDiv = document.body.appendChild(overflowDiv).clientWidth;
    overflowDiv.style.overflowY = 'scroll';
    scrollDiv = overflowDiv.clientWidth;
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

  timerShaftELFlagClickHandler = (flag: FlagAlias) => {
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

  timerShaftELFlagChange = (hoverFlag: FlagAlias, selectFlag: FlagAlias) => {
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

  timerShaftELRangeChange = (e: any): void => {
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
  tim: number = -1;
  top: number = 0;
  handler: any = undefined;
  rowsElOnScroll = (e: any): void => {
    this.linkNodes.forEach((itln) => {
      if (itln[0].rowEL.collect) {
        itln[0].rowEL.translateY = itln[0].rowEL.getBoundingClientRect().top - 195;
      } else {
        itln[0].rowEL.translateY = itln[0].rowEL.offsetTop - this.rowsPaneEL!.scrollTop;
      }
      if (itln[1].rowEL.collect) {
        itln[1].rowEL.translateY = itln[1].rowEL.getBoundingClientRect().top - 195;
      } else {
        itln[1].rowEL.translateY = itln[1].rowEL.offsetTop - this.rowsPaneEL!.scrollTop;
      }
      itln[0].y = itln[0].rowEL.translateY + itln[0].offsetY;
      itln[1].y = itln[1].rowEL.translateY + itln[1].offsetY;
    });
    this.hoverStructNull();
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
    }
    this.scrollTimer = setTimeout(() => {
      TraceRow.range!.refresh = true;
      requestAnimationFrame(() => this.refreshCanvas(false));
    }, 200);
    requestAnimationFrame(() => this.refreshCanvas(false));
  };

  private scrollTimer: any;

  favoriteRowsElOnScroll = (e: any): void => {
    this.rowsElOnScroll(e);
  };

  offset = 147;

  getRowsContentHeight(): number {
    return [...this.rowsEL!.querySelectorAll<TraceRow<any>>(`trace-row:not([sleeping])`)]
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
        v.translateY = v.getBoundingClientRect().top - 195;
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
      if (i + 1 == SpSystemTrace.wakeupList.length) {
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
      },
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
  }

  drawAllLine(row: TraceRow<any>) {
    let context: CanvasRenderingContext2D;
    if (row.currentContext) {
      context = row.currentContext;
    } else {
      context = row.collect ? this.canvasFavoritePanelCtx! : this.canvasPanelCtx!;
    }
    let startNS = TraceRow.range!.startNS;
    let endNS = TraceRow.range!.endNS;
    let totalNS = TraceRow.range!.totalNS;
    drawFlagLineSegment(context, this.hoverFlag, this.selectFlag, row.frame, this.timerShaftEL!);
    drawWakeUp(context, CpuStruct.wakeupBean, startNS, endNS, totalNS, row.frame);
    for (let i = 0; i < SpSystemTrace.wakeupList.length; i++) {
      if (i + 1 == SpSystemTrace.wakeupList.length) {
        return;
      }
      drawWakeUpList(context, SpSystemTrace.wakeupList[i + 1], startNS, endNS, totalNS, row.frame);
    }
    drawLogsLineSegment(context, this.traceSheetEL?.systemLogFlag, row.frame, this.timerShaftEL!);
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

  documentOnMouseOut = (ev: MouseEvent) => spSystemTraceDocumentOnMouseOut(this, ev);

  keyPressMap: Map<string, boolean> = new Map([
    ['w', false],
    ['s', false],
    ['a', false],
    ['d', false],
    ['f', false],
  ]);

  documentOnKeyDown = (ev: KeyboardEvent): void => spSystemTraceDocumentOnKeyDown(this, ev);

  documentOnKeyPress = (ev: KeyboardEvent): void => SpSystemTraceDocumentOnKeyPress(this, ev);

  verticalScrollToRow(): void {
    if (this.currentRow) {
      //@ts-ignore
      this.currentRow.scrollIntoViewIfNeeded();
    }
  }

  setCurrentSlicesTime(): void {
    if (CpuStruct.selectCpuStruct) {
      if (CpuStruct.selectCpuStruct.startTime && CpuStruct.selectCpuStruct.dur) {
        this.currentSlicesTime.startTime = CpuStruct.selectCpuStruct.startTime;
        this.currentSlicesTime.endTime = CpuStruct.selectCpuStruct.startTime + CpuStruct.selectCpuStruct.dur;
      }
    } else if (ThreadStruct.selectThreadStruct) {
      if (ThreadStruct.selectThreadStruct.startTime && ThreadStruct.selectThreadStruct.dur) {
        this.currentSlicesTime.startTime = ThreadStruct.selectThreadStruct.startTime;
        this.currentSlicesTime.endTime =
          ThreadStruct.selectThreadStruct.startTime + ThreadStruct.selectThreadStruct.dur;
      }
    } else if (FuncStruct.selectFuncStruct) {
      if (FuncStruct.selectFuncStruct.startTs && FuncStruct.selectFuncStruct.dur) {
        this.currentSlicesTime.startTime = FuncStruct.selectFuncStruct.startTs;
        this.currentSlicesTime.endTime = FuncStruct.selectFuncStruct.startTs + FuncStruct.selectFuncStruct.dur;
      }
    } else if (IrqStruct.selectIrqStruct) {
      if (IrqStruct.selectIrqStruct.startNS && IrqStruct.selectIrqStruct.dur) {
        this.currentSlicesTime.startTime = IrqStruct.selectIrqStruct.startNS;
        this.currentSlicesTime.endTime = IrqStruct.selectIrqStruct.startNS + IrqStruct.selectIrqStruct.dur;
      }
    } else if (TraceRow.rangeSelectObject) {
      this.currentRow = undefined;
      if (TraceRow.rangeSelectObject.startNS && TraceRow.rangeSelectObject.endNS) {
        this.currentSlicesTime.startTime = TraceRow.rangeSelectObject.startNS;
        this.currentSlicesTime.endTime = TraceRow.rangeSelectObject.endNS;
      }
    } else if (JankStruct.selectJankStruct) {
      if (JankStruct.selectJankStruct.ts && JankStruct.selectJankStruct.dur) {
        this.currentSlicesTime.startTime = JankStruct.selectJankStruct.ts;
        this.currentSlicesTime.endTime = JankStruct.selectJankStruct.ts + JankStruct.selectJankStruct.dur;
      }
    } else {
      this.currentSlicesTime.startTime = 0;
      this.currentSlicesTime.endTime = 0;
    }
  }

  public setSLiceMark = (shiftKey: boolean): SlicesTime | null | undefined => {
    const selectedStruct: any =
      CpuStruct.selectCpuStruct ||
      ThreadStruct.selectThreadStruct ||
      FuncStruct.selectFuncStruct ||
      IrqStruct.selectIrqStruct ||
      TraceRow.rangeSelectObject ||
      JankStruct.selectJankStruct ||
      AppStartupStruct.selectStartupStruct ||
      SoStruct.selectSoStruct ||
      AllAppStartupStruct.selectStartupStruct ||
      FrameAnimationStruct.selectFrameAnimationStruct ||
      JsCpuProfilerStruct.selectJsCpuProfilerStruct;
    this.calculateSlicesTime(selectedStruct, shiftKey);

    return this.slicestime;
  };

  private calculateSlicesTime(selectedStruct: any, shiftKey: boolean): void {
    if (selectedStruct) {
      const startTs = selectedStruct.startTs || selectedStruct.startTime || selectedStruct.startNS || 0;
      const dur = selectedStruct.dur || selectedStruct.totalTime || selectedStruct.endNS || 0;
      this.slicestime = this.timerShaftEL?.setSlicesMark(startTs, startTs + dur, shiftKey);
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
  continueSearch = (ev: KeyboardEvent) => {
    if (ev.key === 'Enter') {
      if (ev.shiftKey) {
        this.dispatchEvent(
          new CustomEvent('trace-previous-data', {
            detail: { down: true },
            composed: false,
          })
        );
      } else {
        this.dispatchEvent(
          new CustomEvent('trace-next-data', {
            detail: { down: true },
            composed: false,
          })
        );
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
  MarkJump(list: Array<any>, type: string, direction: string): void {
    this.traceSheetEL = this.shadowRoot?.querySelector('.trace-sheet');
    let find = list.find((it) => it.selected);
    if (!find) {
      // 如果当前没有选中的，就选中第一个
      list.forEach((it) => (it.selected = false));
      list[0].selected = true;
    } else {
      for (let i = 0; i < list.length; i++) {
        // 将当前数组中选中的那条数据改为未选中
        if (list[i].selected) {
          list[i].selected = false;
          if (direction === 'previous') {
            if (i === 0) {
              // 如果当前选中的是第一个，就循环到最后一个上
              list[list.length - 1].selected = true;
              break;
            } else {
              // 选中当前的上一个
              list[i - 1].selected = true;
              break;
            }
          } else if (direction === 'next') {
            if (i === list.length - 1) {
              // 如果当前选中的是最后一个，就循环到第一个上
              list[0].selected = true;
              break;
            } else {
              // 选中当前的下一个
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
        this.timerShaftEL!.sportRuler!.drawTriangle(flag.time, flag.type);
        if (flag.selected) {
          // 修改当前选中的旗子对应的表格中某行的背景
          currentPane!.setTableSelection(index + 1);
        }
      });
    } else if (type === 'slice') {
      this.refreshCanvas(true);
      let currentPane = this.traceSheetEL?.displayTab<TabPaneCurrent>('tabpane-current');
      list.forEach((slice, index) => {
        if (slice.selected) {
          // 修改当前选中的卡尺对应的表格中某行的背景
          currentPane!.setTableSelection(index + 1);
        }
      });
    }
  }

  isMouseInSheet = (ev: MouseEvent) => {
    this.isMousePointInSheet =
      this.traceSheetEL?.getAttribute('mode') != 'hidden' &&
      ev.offsetX > this.traceSheetEL!.offsetLeft &&
      ev.offsetY > this.traceSheetEL!.offsetTop;
    return this.isMousePointInSheet;
  };

  favoriteChangeHandler = (row: TraceRow<any>): void => {
    info('favoriteChangeHandler', row.frame, row.offsetTop, row.offsetHeight);
  };

  verticalScrollHandler = (row: TraceRow<any>): void => {
    row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  /**
   * 根据选择的traceRow 处理foler
   * @param currentRow 当前点击checkbox的row
   */
  setParentCheckStatus(currentRow: TraceRow<any>): void {
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
  selectChangeHandler = (row: TraceRow<any>): void => {
    this.setParentCheckStatus(row);
    const rows = [
      ...this.shadowRoot!.querySelectorAll<TraceRow<any>>("trace-row[check-type='2']"),
      ...this.favoriteChartListEL!.getAllSelectCollectRows(),
    ];
    this.isSelectClick = true;
    this.rangeSelect.rangeTraceRow = rows;
    let changeTraceRows: Array<TraceRow<any>> = [];
    if (this.rangeTraceRow!.length < rows.length) {
      rows!.forEach((currentTraceRow: TraceRow<any>) => {
        let changeFilter = this.rangeTraceRow!.filter(
          (prevTraceRow: TraceRow<any>) => prevTraceRow === currentTraceRow
        );
        if (changeFilter.length < 1) {
          changeTraceRows.push(currentTraceRow);
        }
      });
      if (changeTraceRows.length > 0) {
        changeTraceRows!.forEach((changeTraceRow: TraceRow<any>) => {
          let pointEvent = this.createPointEvent(changeTraceRow);
          SpStatisticsHttpUtil.addOrdinaryVisitAction({
            action: 'trace_row',
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

  hoverStructNull() {
    CpuStruct.hoverCpuStruct = undefined;
    CpuFreqStruct.hoverCpuFreqStruct = undefined;
    ThreadStruct.hoverThreadStruct = undefined;
    FuncStruct.hoverFuncStruct = undefined;
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
    this.tipEL!.style.display = 'none';
    return this;
  }

  selectStructNull() {
    CpuStruct.selectCpuStruct = undefined;
    CpuStruct.wakeupBean = null;
    CpuFreqStruct.selectCpuFreqStruct = undefined;
    ThreadStruct.selectThreadStruct = undefined;
    FuncStruct.selectFuncStruct = undefined;
    SpHiPerf.selectCpuStruct = undefined;
    CpuStateStruct.selectStateStruct = undefined;
    CpuFreqLimitsStruct.selectCpuFreqLimitsStruct = undefined;
    ClockStruct.selectClockStruct = undefined;
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
    return this;
  }

  isWASDKeyPress() {
    return (
      this.keyPressMap.get('w') || this.keyPressMap.get('a') || this.keyPressMap.get('d') || this.keyPressMap.get('s')
    );
  }

  documentOnClick = (ev: MouseEvent) => spSystemTraceDocumentOnClick(this, ev);

  clickEmptyArea() {
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
      this.traceSheetEL?.setAttribute('mode', 'hidden');
    }
    this.removeLinkLinesByBusinessType('task', 'thread');
    this.refreshCanvas(true);
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
        CpuFreqLimitsStruct.selectCpuFreqLimitsStruct !== null &&
        CpuFreqLimitsStruct.selectCpuFreqLimitsStruct !== undefined,
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
    [TraceRow.ROW_TYPE_STATIC_INIT, () => SoStruct.hoverSoStruct !== null && SoStruct.hoverSoStruct !== undefined],
    [TraceRow.ROW_TYPE_JANK, () => JankStruct.hoverJankStruct !== null && JankStruct.hoverJankStruct !== undefined],
    [TraceRow.ROW_TYPE_HEAP, () => HeapStruct.hoverHeapStruct !== null && HeapStruct.hoverHeapStruct !== undefined],
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
      () => SnapshotStruct.hoverSnapshotStruct !== null && SnapshotStruct.hoverSnapshotStruct !== undefined,
    ],
    [
      TraceRow.ROW_TYPE_VMTRACKER_SHM,
      () => SnapshotStruct.hoverSnapshotStruct !== null && SnapshotStruct.hoverSnapshotStruct !== undefined,
    ],
    [
      TraceRow.ROW_TYPE_VM_TRACKER_SMAPS,
      () => SnapshotStruct.hoverSnapshotStruct !== null && SnapshotStruct.hoverSnapshotStruct !== undefined,
    ],
    [TraceRow.ROW_TYPE_LOGS, () => LogStruct.hoverLogStruct !== null && LogStruct.hoverLogStruct !== undefined],
  ]);

  onClickHandler(clickRowType: string, row?: TraceRow<any>) {
    spSystemTraceOnClickHandler(this, clickRowType, row);
  }

  makePoint(
    ts: number,
    dur: number,
    translateY: number,
    rowStruct: any,
    offsetY: number,
    business: string,
    lineType: LineType,
    isRight: boolean
  ): PairPoint {
    return {
      x: ns2xByTimeShaft(ts + dur, this.timerShaftEL!),
      y: translateY!,
      offsetY: offsetY,
      ns: ts + dur,
      rowEL: rowStruct!,
      isRight: isRight,
      business: business,
      lineType: lineType,
    };
  }

  drawTaskPollLine(row?: TraceRow<any>) {
    spSystemTraceDrawTaskPollLine(this, row);
  }
  drawJankLine(endParentRow: any, selectJankStruct: JankStruct, data: any) {
    spSystemTraceDrawJankLine(this, endParentRow, selectJankStruct, data);
  }

  drawThreadLine(endParentRow: any, selectThreadStruct: ThreadStruct | undefined, data: any) {
    spSystemTraceDrawThreadLine(this, endParentRow, selectThreadStruct, data);
  }

  getStartRow(selectRowId: number | undefined, collectList: any[]): any {
    let startRow = this.shadowRoot?.querySelector<TraceRow<ThreadStruct>>(
      `trace-row[row-id='${selectRowId}'][row-type='thread']`
    );
    if (!startRow) {
      for (let collectChart of collectList) {
        if (collectChart.rowId === selectRowId?.toString() && collectChart.rowType === 'thread') {
          startRow = collectChart;
          break;
        }
      }
    }
    return startRow;
  }

  calculateStartY(startRow: any, selectThreadStruct: ThreadStruct): [number, any, number] {
    let startY = startRow!.translateY!;
    let startRowEl = startRow;
    let startOffSetY = 20 * 0.5;
    const startParentRow = this.shadowRoot?.querySelector<TraceRow<ThreadStruct>>(
      `trace-row[row-id='${startRow.rowParentId}'][folder]`
    );
    const expansionFlag = this.collectionHasThread(startRow);
    if (startParentRow && !startParentRow.expansion && expansionFlag) {
      startY = startParentRow.translateY!;
      startRowEl = startParentRow;
      startOffSetY = 10 * 0.5;
    }
    return [startY, startRowEl, startOffSetY];
  }

  calculateEndY(endParentRow: any, endRowStruct: any): [number, any, number] {
    let endY = endRowStruct.translateY!;
    let endRowEl = endRowStruct;
    let endOffSetY = 20 * 0.5;
    const expansionFlag = this.collectionHasThread(endRowStruct);
    if (!endParentRow.expansion && expansionFlag) {
      endY = endParentRow.translateY!;
      endRowEl = endParentRow;
      endOffSetY = 10 * 0.5;
    }
    return [endY, endRowEl, endOffSetY];
  }

  collectionHasThread(threadRow: any): boolean {
    const collectList = this.favoriteChartListEL!.getCollectRows();
    for (let item of collectList!) {
      if (item.rowId === threadRow.rowId && item.rowType === threadRow.rowType) {
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

  private wheelListener() {
    document.addEventListener(
      'wheel',
      (e) => {
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
            setTimeout(() => {
              this.timerShaftEL!.documentOnKeyUp(eventS);
            }, 200);
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
            setTimeout(() => {
              this.timerShaftEL!.documentOnKeyUp(eventW);
            }, 200);
          }
        }
      },
      { passive: false }
    );
  }

  connectedCallback(): void {
    this.initPointToEvent();
    this.eventListener();
    /**
     * 泳道图中添加ctrl+鼠标滚轮事件，对泳道图进行放大缩小。
     * 鼠标滚轮事件转化为键盘事件，keyPress和keyUp两个事件需要配合使用，
     * 否则泳道图会一直放大或一直缩小。
     * setTimeout()函数中的时间参数可以控制鼠标滚轮的频率。
     */
    SpApplication.skinChange2 = (val: boolean) => {
      this.timerShaftEL?.render();
    };
    window.subscribe(window.SmartEvent.UI.UploadSOFile, (data) => {
      this.chartManager?.importSoFileUpdate().then(() => {
        window.publish(window.SmartEvent.UI.Loading, { loading: false, text: 'Import So File' });
        let updateCanvas = this.traceSheetEL?.updateRangeSelect();
        if (updateCanvas) {
          this.refreshCanvas(true);
        }
      });
    });

    window.subscribe(window.SmartEvent.UI.KeyPath, (data) => {
      this.invisibleRows.forEach((it) => (it.needRefresh = true));
      this.visibleRows.forEach((it) => (it.needRefresh = true));
      if (data.length === 0) {
        // clear
        SpSystemTrace.keyPathList = [];
        this.refreshCanvas(false);
      } else {
        // draw
        queryCpuKeyPathData(data).then((res) => {
          SpSystemTrace.keyPathList = res;
          this.refreshCanvas(false);
        });
      }
    });

    window.subscribe(window.SmartEvent.UI.CheckALL, (data) => {
      this.getCollectRows((row) => row.rowParentId === data.rowId).forEach((it) => {
        it.checkType = data.isCheck ? '2' : '0';
      });
    });
    window.subscribe(window.SmartEvent.UI.HoverNull, () => this.hoverStructNull());
  }

  favoriteAreaSearchHandler(row: TraceRow<any>): void {
    if (this.timerShaftEL!.collecBtn!.hasAttribute('close')) {
      this.timerShaftEL!.collecBtn!.removeAttribute('close');
      this.favoriteChartListEL!.showCollectArea();
    }
    this.favoriteChartListEL?.expandSearchRowGroup(row);
  }

  scrollToProcess(rowId: string, rowParentId: string, rowType: string, smooth: boolean = true) {
    let traceRow =
      this.rowsEL!.querySelector<TraceRow<any>>(`trace-row[row-id='${rowId}'][row-type='${rowType}']`) ||
      this.favoriteChartListEL!.getCollectRow((row) => row.rowId === rowId && row.rowType === rowType);
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
      let row = this.rowsEL!.querySelector<TraceRow<any>>(`trace-row[row-id='${rowParentId}'][folder]`);
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

  scrollToDepth(rowId: string, rowParentId: string, rowType: string, smooth: boolean = true, depth: number) {
    let rootRow =
      this.rowsEL!.querySelector<TraceRow<any>>(`trace-row[row-id='${rowId}'][row-type='${rowType}']`) ||
      this.favoriteChartListEL!.getCollectRow((row) => row.rowId === rowId && row.rowType === rowType);
    if (rootRow && rootRow!.collect) {
      this.favoriteAreaSearchHandler(rootRow);
      rootRow.expandFunc();
      this.favoriteChartListEL!.scroll({
        top: (rootRow?.offsetTop || 0) - this.favoriteChartListEL!.getCanvas()!.offsetHeight + (++depth * 20 || 0),
        left: 0,
        behavior: smooth ? 'smooth' : undefined,
      });
    } else {
      let row = this.rowsEL!.querySelector<TraceRow<any>>(`trace-row[row-id='${rowParentId}'][folder]`);
      if (row && !row.expansion) {
        row.expansion = true;
      }
      if (rootRow) {
        rootRow.expandFunc();
      }
      if (rootRow && rootRow.offsetTop >= 0 && rootRow.offsetHeight >= 0) {
        let top = (rootRow?.offsetTop || 0) - this.canvasPanel!.offsetHeight + (++depth * 20 || 0);
        this.rowsPaneEL!.scroll({
          top: top,
          left: 0,
          behavior: smooth ? 'smooth' : undefined,
        });
      }
    }
  }

  scrollToFunction(rowId: string, rowParentId: string, rowType: string, smooth: boolean = true) {
    let condition = `trace-row[row-id='${rowId}'][row-type='${rowType}'][row-parent-id='${rowParentId}']`;
    let rootRow =
      this.rowsEL!.querySelector<TraceRow<any>>(condition) ||
      this.favoriteChartListEL!.getCollectRow((row) => {
        return row.rowId === rowId && row.rowType === rowType && row.rowParentId === rowParentId;
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
      let row = this.rowsEL!.querySelector<TraceRow<any>>(`trace-row[row-id='${rowParentId}'][folder]`);
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

  disconnectedCallback() {
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

  sliceMarkEventHandler(ev: any) {
    SpSystemTrace.sliceRangeMark = ev;
    let startNS = ev.timestamp - (window as any).recordStartNS;
    let endNS = ev.maxDuration + startNS;
    TraceRow.rangeSelectObject = {
      startX: 0,
      startNS: startNS,
      endNS: endNS,
      endX: 0,
    };
    window.publish(window.SmartEvent.UI.MenuTrace, {});
    window.publish(window.SmartEvent.UI.TimeRange, {
      startNS: startNS - ev.maxDuration,
      endNS: endNS + ev.maxDuration,
    });
    this.queryAllTraceRow().forEach((it) => (it.checkType = '-1'));
    this.rangeSelect.rangeTraceRow = [];
    this.selectStructNull();
    this.wakeupListNull();
    this.traceSheetEL?.setAttribute('mode', 'hidden');
    this.removeLinkLinesByBusinessType('janks');
    TraceRow.range!.refresh = true;
    this.refreshCanvas(false);
  }

  loadDatabaseUrl(
    url: string,
    progress: Function,
    complete?: ((res: { status: boolean; msg: string }) => void) | undefined
  ) {
    this.observerScrollHeightEnable = false;
    this.init({ url: url }, '', progress).then((res) => {
      if (complete) {
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
    complete?: ((res: { status: boolean; msg: string }) => void) | undefined
  ) {
    this.observerScrollHeightEnable = false;
    this.init({ buf }, thirdPartyWasmConfigUrl, progress).then((res) => {
      this.rowsEL?.querySelectorAll('trace-row').forEach((it: any) => this.observer.observe(it));
      if (complete) {
        complete(res);
        window.publish(window.SmartEvent.UI.MouseEventEnable, {
          mouseEnable: true,
        });
      }
    });
  }

  queryAllTraceRow<T>(selectors?: string, filter?: (row: TraceRow<any>) => boolean): TraceRow<any>[] {
    return [
      ...this.rowsEL!.querySelectorAll<TraceRow<any>>(selectors ?? 'trace-row'),
      ...this.favoriteChartListEL!.getCollectRows(filter),
    ];
  }

  search(query: string) {
    this.queryAllTraceRow().forEach((item) => {
      if (query == null || query == undefined || query == '') {
        if (
          item.rowType == TraceRow.ROW_TYPE_CPU ||
          item.rowType == TraceRow.ROW_TYPE_CPU_FREQ ||
          item.rowType == TraceRow.ROW_TYPE_NATIVE_MEMORY ||
          item.rowType == TraceRow.ROW_TYPE_FPS ||
          item.rowType == TraceRow.ROW_TYPE_PROCESS ||
          item.rowType == TraceRow.ROW_TYPE_CPU_ABILITY ||
          item.rowType == TraceRow.ROW_TYPE_MEMORY_ABILITY ||
          item.rowType == TraceRow.ROW_TYPE_DISK_ABILITY ||
          item.rowType == TraceRow.ROW_TYPE_NETWORK_ABILITY
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

  async searchCPU(query: string): Promise<Array<any>> {
    let pidArr: Array<number> = [];
    let tidArr: Array<number> = [];
    for (let key of Utils.PROCESS_MAP.keys()) {
      if (`${key}`.includes(query) || (Utils.PROCESS_MAP.get(key) || '').includes(query)) {
        pidArr.push(key);
      }
    }
    for (let key of Utils.THREAD_MAP.keys()) {
      if (`${key}`.includes(query) || (Utils.THREAD_MAP.get(key) || '').includes(query)) {
        tidArr.push(key);
      }
    }
    return await searchCpuDataSender(pidArr, tidArr);
  }

  async searchFunction(cpuList: Array<any>, query: string): Promise<Array<any>> {
    let processList: Array<string> = [];
    let traceRow =
      this.shadowRoot!.querySelector<TraceRow<any>>(`trace-row[scene]`) ||
      this.favoriteChartListEL!.getCollectRow((row) => row.hasAttribute('scene'));
    if (traceRow) {
      this.shadowRoot!.querySelectorAll<TraceRow<any>>(`trace-row[row-type='process'][scene]`).forEach((row) => {
        processList.push(row.rowId!);
      });
      if (query.includes('_')) {
        query = query.replace(/_/g, '\\_');
      }
      if (query.includes('%')) {
        query = query.replace(/%/g, '\\%');
      }
      let list = await querySceneSearchFunc(query, processList);
      cpuList = cpuList.concat(list);
      cpuList.sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
      return cpuList;
    } else {
      let list = await querySearchFunc(query);
      cpuList = cpuList.concat(list);
      cpuList.sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
      return cpuList;
    }
  }

  searchSdk(dataList: Array<any>, query: string): Array<any> {
    let traceRow =
      this.shadowRoot!.querySelector<TraceRow<any>>(`trace-row[scene]`) ||
      this.favoriteChartListEL!.getCollectRow((row) => row.hasAttribute('scene'));
    let dataAll = `trace-row[row-type^='sdk']`;
    if (traceRow) {
      dataAll = `trace-row[row-type^='sdk'][scene]`;
    }
    let allTraceRow: any = [];
    let parentRows = this.shadowRoot!.querySelectorAll<TraceRow<any>>(`${dataAll}`);
    parentRows.forEach((parentRow: TraceRow<any>) => {
      allTraceRow.push(parentRow);
      if (parentRow.childrenList && parentRow.childrenList.length > 0) {
        allTraceRow.push(...parentRow.childrenList);
      }
    });
    allTraceRow.forEach((row: any) => {
      if (row!.name.indexOf(query) >= 0) {
        let searchSdkBean = new SearchSdkBean();
        searchSdkBean.startTime = TraceRow.range!.startNS;
        searchSdkBean.dur = TraceRow.range!.totalNS;
        searchSdkBean.name = row.name;
        searchSdkBean.rowId = row.rowId;
        searchSdkBean.type = 'sdk';
        searchSdkBean.rowType = row.rowType;
        searchSdkBean.rowParentId = row.rowParentId;
        dataList.push(searchSdkBean);
      }
    });
    return dataList;
  }

  showStruct(previous: boolean, currentIndex: number, structs: Array<any>, retargetIndex?: number) {
    return spSystemTraceShowStruct(this, previous, currentIndex, structs, retargetIndex);
  }

  private toTargetDepth = (entry: any, funcRowID: number, funcStract: any) => {
    if (entry) {
      this.hoverStructNull();
      this.selectStructNull();
      this.wakeupListNull();
      FuncStruct.hoverFuncStruct = entry;
      FuncStruct.selectFuncStruct = entry;
      this.onClickHandler(TraceRow.ROW_TYPE_FUNC);
      this.scrollToDepth(`${funcRowID}`, `${funcStract.pid}`, 'func', true, entry.depth || 0);
    }
  };

  scrollToActFunc(funcStract: any, highlight: boolean): void {
    if (!Utils.isBinder(funcStract)) {
      if (funcStract.dur === -1 || funcStract.dur === null || funcStract.dur === undefined) {
        funcStract.dur = (TraceRow.range?.totalNS || 0) - (funcStract.startTs || 0);
        funcStract.flag = 'Did not end';
      }
    }

    let funcRowID = funcStract.cookie == null ? funcStract.tid : `${funcStract.funName}-${funcStract.pid}`;
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
    let parentRow = this.rowsEL!.querySelector<TraceRow<any>>(`trace-row[row-id='${funcStract.pid}'][folder]`);
    if (!parentRow) {
      return;
    }
    let filterRow = parentRow.childrenList.filter((child) => child.rowId == funcRowID && child.rowType == 'func')[0];
    if (filterRow == null) {
      let funcRow = this.rowsEL?.querySelector<TraceRow<any>>(`trace-row[row-id='${funcRowID}'][row-type='func']`);
      if (funcRow) {
        filterRow = funcRow;
      } else {
        return;
      }
    }
    filterRow.fixedList = [funcStract];
    filterRow!.highlight = highlight;
    let row = this.rowsEL!.querySelector<TraceRow<any>>(`trace-row[row-id='${funcStract.pid}'][folder]`);
    this.currentRow = row;
    if (row && !row.expansion) {
      row.expansion = true;
    }
    const completeEntry = () => {
      this.toTargetDepth(filterRow.fixedList[0], funcRowID, funcStract);
    };
    if (filterRow!.isComplete) {
      completeEntry();
    } else {
      this.scrollToProcess(`${funcStract.tid}`, `${funcStract.pid}`, 'thread', false);
      this.scrollToFunction(`${funcStract.tid}`, `${funcStract.pid}`, 'func', true);
      filterRow!.onComplete = completeEntry;
    }
  }

  closeAllExpandRows(pid: string) {
    let expandRows = this.rowsEL?.querySelectorAll<TraceRow<ProcessStruct>>(`trace-row[row-type='process'][expansion]`);
    expandRows?.forEach((row) => {
      if (row.rowId != pid) {
        row.expansion = false;
      }
    });
  }

  moveRangeToCenter(startTime: number, dur: number) {
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
    this.refreshCanvas(true);
  }

  rechargeCpuData(it: CpuStruct, next: CpuStruct | undefined): void {
    let p = Utils.PROCESS_MAP.get(it.processId!);
    let t = Utils.THREAD_MAP.get(it.tid!);
    let slice = Utils.SCHED_SLICE_MAP.get(`${it.id}-${it.startTime}`);
    if (slice) {
      it.end_state = slice.endState;
      it.priority = slice.priority;
    }
    it.processName = p;
    it.processCmdLine = p;
    it.name = t;
    it.type = 'thread';
    if (next) {
      if (it.startTime! + it.dur! > next!.startTime! || it.dur == -1 || it.dur === null || it.dur === undefined) {
        it.dur = next!.startTime! - it.startTime!;
        it.nofinish = true;
      }
    } else {
      if (it.dur == -1 || it.dur === null || it.dur === undefined) {
        it.dur = TraceRow.range!.endNS - it.startTime!;
        it.nofinish = true;
      }
    }
  }

  reset(progress: Function | undefined | null) {
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
      this.rowsEL.querySelectorAll<TraceRow<any>>(`trace-row`).forEach((row) => {
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
    this.traceSheetEL?.setAttribute('mode', 'hidden');
    progress?.('rest timershaft', 8);
    this.timerShaftEL?.reset();
    progress?.('clear cache', 10);
    HeapDataInterface.getInstance().clearData();
    procedurePool.clearCache();
    Utils.clearData();
    InitAnalysis.getInstance().isInitAnalysis = true;
    procedurePool.submitWithName('logic0', 'clear', {}, undefined, (res: any) => {});
    if (threadPool) {
      threadPool.submitProto(QueryEnum.ClearMemoryCache, {}, (res: any, len: number): void => {});
    }
    this.times.clear();
    resetVSync();
    SpSystemTrace.keyPathList = [];
  }

  init = async (param: { buf?: ArrayBuffer; url?: string }, wasmConfigUri: string, progress: Function) => {
    return spSystemTraceInit(this, param, wasmConfigUri, progress);
  };

  extracted(it: TraceRow<any>) {
    return () => {
      if (it.hasAttribute('expansion')) {
        it.childrenList.forEach((child) => {
          if (child.hasAttribute('scene') && !child.collect) {
            child.rowHidden = false;
          }
          if (child.folder) {
            child.addEventListener('expansion-change', this.extracted(child));
          }
          this.intersectionObserver?.observe(child);
        });
      } else {
        it.childrenList.forEach((child) => {
          if (child.hasAttribute('scene') && !child.collect) {
            child.rowHidden = true;
            this.intersectionObserver?.unobserve(child);
          }
          if (child.folder) {
            child.removeEventListener('expansion-change', this.extracted(child));
          }
        });
        this.linkNodes.map((value) => {
          if ('task' === value[0].business && value[0].rowEL.parentRowEl?.rowId === it.rowId) {
            value[0].hidden = true;
            value[1].hidden = true;
            this.clickEmptyArea();
          }
        });
      }
      if (!this.collapseAll) {
        this.refreshCanvas(false);
      }
    };
  }

  displayTip(row: TraceRow<any>, struct: any, html: string) {
    let x = row.hoverX + 248;
    let y = row.getBoundingClientRect().top - this.getBoundingClientRect().top;
    if ((struct === undefined || struct === null) && this.tipEL) {
      this.tipEL.style.display = 'none';
      return;
    }
    if (this.tipEL) {
      this.tipEL.innerHTML = html;
      if (row.rowType === TraceRow.ROW_TYPE_JS_CPU_PROFILER || row.rowType === TraceRow.ROW_TYPE_PERF_CALLCHART) {
        this.tipEL.style.maxWidth = row.clientWidth / 3 + 'px';
        this.tipEL.style.wordBreak = ' break-all';
        this.tipEL.style.height = 'unset';
        this.tipEL.style.display = 'block';
        y = y + struct.depth * 20;
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
    TabPaneCurrentSelection.queryCPUWakeUpListFromBean(data).then((a: any) => {
      if (a === null) {
        window.publish(window.SmartEvent.UI.WakeupList, SpSystemTrace.wakeupList);
        return null;
      }
      SpSystemTrace.wakeupList.push(a);
      this.queryCPUWakeUpList(a);
    });
  }

  wakeupListNull() {
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
