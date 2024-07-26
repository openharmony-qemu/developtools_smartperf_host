
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
import { type SpSystemTrace } from '../SpSystemTrace';
import { TraceRow } from '../trace/base/TraceRow';
import { renders } from '../../database/ui-worker/ProcedureWorker';
import { type EmptyRender } from '../../database/ui-worker/cpu/ProcedureWorkerCPU';
import { type FreqExtendRender, CpuFreqExtendStruct } from '../../database/ui-worker/ProcedureWorkerFreqExtend';
import { type BinderRender, BinderStruct } from '../../database/ui-worker/procedureWorkerBinder';
import { type BaseStruct } from '../../bean/BaseStruct';
import { type AllStatesRender, AllstatesStruct } from '../../database/ui-worker/ProcedureWorkerAllStates';
import { StateGroup } from '../../bean/StateModle';
import { queryAllFuncNames } from '../../database/sql/Func.sql';
import { Utils } from '../trace/base/Utils';
const UNIT_HEIGHT: number = 20;
const MS_TO_US: number = 1000000;
const MIN_HEIGHT: number = 2;
export class SpSegmentationChart {
  static trace: SpSystemTrace;
  static cpuRow: TraceRow<CpuFreqExtendStruct> | undefined;
  static GpuRow: TraceRow<CpuFreqExtendStruct> | undefined;
  static binderRow: TraceRow<BinderStruct> | undefined;
  static schedRow: TraceRow<CpuFreqExtendStruct> | undefined;
  static freqInfoMapData = new Map<number, Map<number, number>>();
  static hoverLine: Array<HeightLine> = [];
  static tabHoverObj: { key: string, cycle: number };
  private rowFolder!: TraceRow<BaseStruct>;
  static chartData: Array<Object> = [];
  static statesRow: TraceRow<AllstatesStruct> | undefined;
  // 数据切割联动
  static setChartData(type: string, data: Array<FreqChartDataStruct>): void {
    SpSegmentationChart.tabHoverObj = { key: '', cycle: -1 };
    SpSegmentationChart.trace.traceSheetEL!.systemLogFlag = undefined;
    if (type === 'CPU-FREQ') {
      setCpuData(data);
    } else if (type === 'GPU-FREQ') {
      setGpuData(data);
    } else {
      setSchedData(data);
    }
    SpSegmentationChart.trace.refreshCanvas(false);
  }

  // state泳道联动
  static setStateChartData(data: Array<StateGroup>) {
    SpSegmentationChart.tabHoverObj = { key: '', cycle: -1 };
    SpSegmentationChart.trace.traceSheetEL!.systemLogFlag = undefined;
    let stateChartData = new Array();
    stateChartData = data.map(v => {
      return {
        dur: v.dur,
        chartDur: v.chartDur,
        pid: v.pid,
        tid: v.tid,
        end_ts: v.startTs! + v.chartDur!,
        id: v.id,
        name: 'all-state',
        startTime: v.startTs,
        start_ts: v.startTs,
        state: v.state,
        type: v.type,
        cycle: v.cycle,
      };
    });
    SpSegmentationChart.statesRow!.dataList = [];
    SpSegmentationChart.statesRow!.dataListCache = [];
    SpSegmentationChart.statesRow!.isComplete = false;
    // @ts-ignore
    SpSegmentationChart.statesRow!.supplier = (): Promise<Array<ThreadStruct>> =>
      new Promise<Array<AllstatesStruct>>((resolve) => resolve(stateChartData));
    SpSegmentationChart.trace.refreshCanvas(false);
  };

  // binder联动调用
  static setBinderChartData(data: Array<Array<FreqChartDataStruct>>): void {
    SpSegmentationChart.tabHoverObj = { key: '', cycle: -1 };
    SpSegmentationChart.trace.traceSheetEL!.systemLogFlag = undefined;
    BinderStruct.maxHeight = 0;
    SpSegmentationChart.binderRow!.dataList = [];
    SpSegmentationChart.binderRow!.dataListCache = [];
    SpSegmentationChart.binderRow!.isComplete = false;
    if (data.length === 0) {
      SpSegmentationChart.binderRow!.style.height = `40px`;
      SpSegmentationChart.binderRow!.funcMaxHeight = 40;
      // @ts-ignore
      SpSegmentationChart.binderRow!.supplier = (): Promise<Array<FreqChartDataStruct>> =>
        new Promise<Array<FreqChartDataStruct>>((resolve) => resolve([]));
    } else {
      let binderList: Array<FreqChartDataStruct> = [];
      let chartData: Array<FreqChartDataStruct> = [];
      setBinderData(data, binderList);
      chartData = binderList.map((v: FreqChartDataStruct) => {
        return {
          cpu:
            v.name === 'binder transaction'
              ? 0
              : v.name === 'binder transaction async'
                ? 1
                : v.name === 'binder reply'
                  ? MS_TO_US
                  : 3,
          startNS: v.startNS,
          dur: v.dur,
          name: `${v.name}`,
          value: v.value,
          depth: v.depth,
          cycle: v.cycle,
        };
      });
      // @ts-ignore
      SpSegmentationChart.binderRow!.supplier = (): Promise<Array<FreqChartDataStruct>> =>
        new Promise<Array<FreqChartDataStruct>>((resolve) => resolve(chartData));
      SpSegmentationChart.binderRow!.style.height = `${BinderStruct.maxHeight > MIN_HEIGHT ? BinderStruct.maxHeight * UNIT_HEIGHT + UNIT_HEIGHT : 40}px`;
      SpSegmentationChart.binderRow!.funcMaxHeight = BinderStruct.maxHeight > MIN_HEIGHT ? BinderStruct.maxHeight * UNIT_HEIGHT + UNIT_HEIGHT : 40;
    }
    TraceRow.range!.refresh = true;
    SpSegmentationChart.binderRow!.needRefresh = true;
    SpSegmentationChart.binderRow!.draw(false);
    if (SpSegmentationChart.binderRow!.collect) {
      window.publish(window.SmartEvent.UI.RowHeightChange, {
        expand: SpSegmentationChart.binderRow!.funcExpand,
        value: SpSegmentationChart.binderRow!.funcMaxHeight - 40,
      });
    }
    SpSegmentationChart.trace.favoriteChartListEL?.scrollTo(0, 0);
    SpSegmentationChart.trace.refreshCanvas(false);
  }
  // 悬浮联动
  static tabHover(type: string, tableIsHover: boolean = false, cycle: number = -1): void {
    if (tableIsHover) {
      if (SpSegmentationChart.tabHoverObj.cycle === cycle && SpSegmentationChart.tabHoverObj.key === type) {
        SpSegmentationChart.tabHoverObj = { cycle: -1, key: '' };
      } else {
        SpSegmentationChart.tabHoverObj = { cycle, key: type };
      }
    } else {
      SpSegmentationChart.tabHoverObj = { cycle: -1, key: '' };
    }

    SpSegmentationChart.trace.refreshCanvas(false);
  }
  constructor(trace: SpSystemTrace) {
    SpSegmentationChart.trace = trace;
  }
  async init() {
    if (Utils.getInstance().getCallStatckMap().size > 0) {
      await this.initFolder();
      await this.initCpuFreq();
      await this.initGpuTrace();
      await this.initSchedTrace();
      await this.initBinderTrace();
      await this.initAllStates();
    } else {
      return;
    }
  }
  async initFolder() {
    let row = TraceRow.skeleton();
    row.rowId = 'segmentation';
    row.index = 0;
    row.rowType = TraceRow.ROW_TYPE_SPSEGNENTATION;
    row.rowParentId = '';
    row.folder = true;
    row.style.height = '40px';
    row.name = 'Segmentation';
    row.supplier = (): Promise<Array<BaseStruct>> => new Promise<Array<BaseStruct>>((resolve) => resolve([]));
    row.onThreadHandler = (useCache): void => {
      row.canvasSave(SpSegmentationChart.trace.canvasPanelCtx!);
      if (row.expansion) {
        SpSegmentationChart.trace.canvasPanelCtx?.clearRect(0, 0, row.frame.width, row.frame.height);
      } else {
        (renders['empty'] as EmptyRender).renderMainThread(
          {
            context: SpSegmentationChart.trace.canvasPanelCtx,
            useCache: useCache,
            type: '',
          },
          row
        );
      }
      row.canvasRestore(SpSegmentationChart.trace.canvasPanelCtx!);
    };
    this.rowFolder = row;
    SpSegmentationChart.trace.rowsEL?.appendChild(row);
  }
  async initCpuFreq() {
    // json文件泳道
    SpSegmentationChart.cpuRow = TraceRow.skeleton<CpuFreqExtendStruct>();
    SpSegmentationChart.cpuRow.rowId = 'cpu-freq';
    SpSegmentationChart.cpuRow.rowType = TraceRow.ROW_TYPE_CPU_COMPUTILITY;
    SpSegmentationChart.cpuRow.rowParentId = '';
    SpSegmentationChart.cpuRow.style.height = '40px';
    SpSegmentationChart.cpuRow.name = 'Cpu Computility';
    SpSegmentationChart.cpuRow.favoriteChangeHandler = SpSegmentationChart.trace.favoriteChangeHandler;
    SpSegmentationChart.cpuRow.addRowCheckFilePop();
    SpSegmentationChart.cpuRow.rowSetting = 'checkFile';
    // 拿到了用户传递的数据
    SpSegmentationChart.cpuRow.onRowCheckFileChangeHandler = (): void => {
      SpSegmentationChart.freqInfoMapData = new Map<number, Map<number, number>>();
      if (sessionStorage.getItem('freqInfoData')) {
        // @ts-ignore
        let chartData = JSON.parse(JSON.parse(sessionStorage.getItem('freqInfoData')));
        let mapData = new Map<number, number>();
        // @ts-ignore
        chartData.map((v) => {
          for (let key in v.freqInfo) {
            mapData.set(Number(key), Number(v.freqInfo[key]));
          }
          SpSegmentationChart.freqInfoMapData.set(v.cpuId, mapData);
          mapData = new Map();
        });
      }
    };
    SpSegmentationChart.cpuRow.focusHandler = (ev): void => {
      SpSegmentationChart.trace?.displayTip(
        SpSegmentationChart.cpuRow!,
        CpuFreqExtendStruct.hoverStruct,
        `<span>${CpuFreqExtendStruct.hoverStruct === undefined ? 0 : CpuFreqExtendStruct.hoverStruct.value!
        }</span>`
      );
    };
    SpSegmentationChart.cpuRow.findHoverStruct = (): void => {
      CpuFreqExtendStruct.hoverStruct = SpSegmentationChart.cpuRow!.getHoverStruct();
    };
    // @ts-ignore
    SpSegmentationChart.cpuRow.supplier = (): Promise<Array<freqChartDataStruct>> =>
      new Promise<Array<FreqChartDataStruct>>((resolve) => resolve([]));
    SpSegmentationChart.cpuRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (SpSegmentationChart.cpuRow!.currentContext) {
        context = SpSegmentationChart.cpuRow!.currentContext;
      } else {
        context = SpSegmentationChart.cpuRow!.collect
          ? SpSegmentationChart.trace.canvasFavoritePanelCtx!
          : SpSegmentationChart.trace.canvasPanelCtx!;
      }
      SpSegmentationChart.cpuRow!.canvasSave(context);
      (renders['freq-extend'] as FreqExtendRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'CPU-FREQ',
        },
        SpSegmentationChart.cpuRow!
      );
      SpSegmentationChart.cpuRow!.canvasRestore(context);
    };
    SpSegmentationChart.trace.rowsEL?.appendChild(SpSegmentationChart.cpuRow);
    this.rowFolder!.addChildTraceRow(SpSegmentationChart.cpuRow);
  }
  async initGpuTrace() {
    SpSegmentationChart.GpuRow = TraceRow.skeleton<CpuFreqExtendStruct>();
    SpSegmentationChart.GpuRow.rowId = 'gpurow';
    SpSegmentationChart.GpuRow.rowType = TraceRow.ROW_TYPE_GPU_COMPUTILITY;
    SpSegmentationChart.GpuRow.rowParentId = '';
    SpSegmentationChart.GpuRow.style.height = '40px';
    SpSegmentationChart.GpuRow.name = 'Gpu Computility';
    SpSegmentationChart.GpuRow.favoriteChangeHandler = SpSegmentationChart.trace.favoriteChangeHandler;
    SpSegmentationChart.GpuRow.selectChangeHandler = SpSegmentationChart.trace.selectChangeHandler;
    // @ts-ignore
    SpSegmentationChart.GpuRow.supplier = (): Promise<Array<freqChartDataStruct>> =>
      new Promise<Array<FreqChartDataStruct>>((resolve) => resolve([]));
    SpSegmentationChart.GpuRow.focusHandler = (ev): void => {
      SpSegmentationChart.trace?.displayTip(
        SpSegmentationChart.GpuRow!,
        CpuFreqExtendStruct.hoverStruct,
        `<span>${CpuFreqExtendStruct.hoverStruct === undefined ? 0 : CpuFreqExtendStruct.hoverStruct.value!
        }</span>`
      );
    };
    SpSegmentationChart.GpuRow.findHoverStruct = (): void => {
      CpuFreqExtendStruct.hoverStruct = SpSegmentationChart.GpuRow!.getHoverStruct();
    };
    SpSegmentationChart.GpuRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (SpSegmentationChart.GpuRow!.currentContext) {
        context = SpSegmentationChart.GpuRow!.currentContext;
      } else {
        context = SpSegmentationChart.GpuRow!.collect
          ? SpSegmentationChart.trace.canvasFavoritePanelCtx!
          : SpSegmentationChart.trace.canvasPanelCtx!;
      }
      SpSegmentationChart.GpuRow!.canvasSave(context);
      (renders['freq-extend'] as FreqExtendRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'GPU-FREQ',
        },
        SpSegmentationChart.GpuRow!
      );
      SpSegmentationChart.GpuRow!.canvasRestore(context);
    };
    SpSegmentationChart.trace.rowsEL?.appendChild(SpSegmentationChart.GpuRow);
    this.rowFolder!.addChildTraceRow(SpSegmentationChart.GpuRow);
  }
  async initSchedTrace() {
    SpSegmentationChart.schedRow = TraceRow.skeleton<CpuFreqExtendStruct>();
    SpSegmentationChart.schedRow.rowId = 'sched_switch Count';
    SpSegmentationChart.schedRow.rowType = TraceRow.ROW_TYPE_SCHED_SWITCH;
    SpSegmentationChart.schedRow.rowParentId = '';
    SpSegmentationChart.schedRow.style.height = '40px';
    SpSegmentationChart.schedRow.name = 'Sched_switch Count';
    SpSegmentationChart.schedRow.favoriteChangeHandler = SpSegmentationChart.trace.favoriteChangeHandler;
    SpSegmentationChart.schedRow.selectChangeHandler = SpSegmentationChart.trace.selectChangeHandler;
    SpSegmentationChart.schedRow.focusHandler = (ev): void => {
      SpSegmentationChart.trace?.displayTip(
        SpSegmentationChart.schedRow!,
        CpuFreqExtendStruct.hoverStruct,
        `<span>${CpuFreqExtendStruct.hoverStruct?.value!}</span>`
      );
    };
    SpSegmentationChart.schedRow.findHoverStruct = (): void => {
      CpuFreqExtendStruct.hoverStruct = SpSegmentationChart.schedRow!.getHoverStruct();
    };
    // @ts-ignore
    SpSegmentationChart.schedRow.supplier = (): Promise<Array<freqChartDataStruct>> =>
      new Promise<Array<FreqChartDataStruct>>((resolve) => resolve([]));
    SpSegmentationChart.schedRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (SpSegmentationChart.schedRow!.currentContext) {
        context = SpSegmentationChart.schedRow!.currentContext;
      } else {
        context = SpSegmentationChart.schedRow!.collect
          ? SpSegmentationChart.trace.canvasFavoritePanelCtx!
          : SpSegmentationChart.trace.canvasPanelCtx!;
      }
      SpSegmentationChart.schedRow!.canvasSave(context);
      (renders['freq-extend'] as FreqExtendRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'SCHED-SWITCH',
        },
        SpSegmentationChart.schedRow!
      );
      SpSegmentationChart.schedRow!.canvasRestore(context);
    };
    SpSegmentationChart.trace.rowsEL?.appendChild(SpSegmentationChart.schedRow);
    this.rowFolder!.addChildTraceRow(SpSegmentationChart.schedRow);
  }

  async initAllStates() {
    SpSegmentationChart.statesRow = TraceRow.skeleton<AllstatesStruct>();
    SpSegmentationChart.statesRow.rowId = `statesrow`;
    SpSegmentationChart.statesRow.rowType = TraceRow.ROW_TYPE_THREAD;
    SpSegmentationChart.statesRow.rowParentId = '';
    SpSegmentationChart.statesRow.style.height = '30px';
    SpSegmentationChart.statesRow.name = `All States`;
    SpSegmentationChart.statesRow.favoriteChangeHandler = SpSegmentationChart.trace.favoriteChangeHandler;
    SpSegmentationChart.statesRow.selectChangeHandler = SpSegmentationChart.trace.selectChangeHandler;
    // @ts-ignore
    SpSegmentationChart.statesRow.supplier = (): Promise<Array<freqChartDataStruct>> =>
      new Promise<Array<FreqChartDataStruct>>((resolve) => resolve([]));
    SpSegmentationChart.statesRow.onThreadHandler = (useCache) => {
      let context: CanvasRenderingContext2D;
      if (SpSegmentationChart.statesRow!.currentContext) {
        context = SpSegmentationChart.statesRow!.currentContext;
      } else {
        context = SpSegmentationChart.statesRow!.collect ? SpSegmentationChart.trace.canvasFavoritePanelCtx! : SpSegmentationChart.trace.canvasPanelCtx!;
      }
      SpSegmentationChart.statesRow!.canvasSave(context);
      (renders.stateCut as AllStatesRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: ``,
          translateY: SpSegmentationChart.statesRow!.translateY,
        },
        SpSegmentationChart.statesRow!
      );
      SpSegmentationChart.statesRow!.canvasRestore(context);
    };
    SpSegmentationChart.trace.rowsEL?.appendChild(SpSegmentationChart.statesRow);
    this.rowFolder!.addChildTraceRow(SpSegmentationChart.statesRow);
  }

  async initBinderTrace() {
    SpSegmentationChart.binderRow = TraceRow.skeleton<BinderStruct>();
    SpSegmentationChart.binderRow.rowId = 'binderrow';
    SpSegmentationChart.binderRow.rowType = TraceRow.ROW_TYPE_BINDER_COUNT;
    SpSegmentationChart.binderRow.enableCollapseChart(40, SpSegmentationChart.trace);
    SpSegmentationChart.binderRow.rowParentId = '';
    SpSegmentationChart.binderRow.name = 'Binder Count';
    SpSegmentationChart.binderRow.style.height = '40px';
    SpSegmentationChart.binderRow.favoriteChangeHandler = SpSegmentationChart.trace.favoriteChangeHandler;
    SpSegmentationChart.binderRow.selectChangeHandler = SpSegmentationChart.trace.selectChangeHandler;
    SpSegmentationChart.binderRow.findHoverStruct = () => {
      BinderStruct.hoverCpuFreqStruct = SpSegmentationChart.binderRow!.dataListCache.find((v: BinderStruct) => {
        if (SpSegmentationChart.binderRow!.isHover) {
          if (v.frame!.x < SpSegmentationChart.binderRow!.hoverX + 1 &&
            v.frame!.x + v.frame!.width > SpSegmentationChart.binderRow!.hoverX - 1 &&
            (BinderStruct.maxHeight * 20 - v.depth * 20 + 20) < SpSegmentationChart.binderRow!.hoverY &&
            BinderStruct.maxHeight * 20 - v.depth * 20 + v.value * 20 + 20 > SpSegmentationChart.binderRow!.hoverY) {
            return v;
          }
        }
      })
    };
    SpSegmentationChart.binderRow.focusHandler = (ev): void => {
      SpSegmentationChart.trace!.displayTip(
        SpSegmentationChart.binderRow!,
        BinderStruct.hoverCpuFreqStruct,
        `<span style='font-weight: bold;'>Cycle: ${BinderStruct.hoverCpuFreqStruct ? BinderStruct.hoverCpuFreqStruct.cycle : 0
        }</span><br>
                <span style='font-weight: bold;'>Name: ${BinderStruct.hoverCpuFreqStruct ? BinderStruct.hoverCpuFreqStruct.name : ''
        }</span><br>
                <span style='font-weight: bold;'>Count: ${BinderStruct.hoverCpuFreqStruct ? BinderStruct.hoverCpuFreqStruct.value : 0
        }</span>`
      );
    };

    SpSegmentationChart.binderRow.supplier = (): Promise<Array<BinderStruct>> =>
      new Promise<Array<BinderStruct>>((resolve) => resolve([]));
    SpSegmentationChart.binderRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (SpSegmentationChart.binderRow!.currentContext) {
        context = SpSegmentationChart.binderRow!.currentContext;
      } else {
        context = SpSegmentationChart.binderRow!.collect
          ? SpSegmentationChart.trace.canvasFavoritePanelCtx!
          : SpSegmentationChart.trace.canvasPanelCtx!;
      }
      SpSegmentationChart.binderRow!.canvasSave(context);
      (renders.binder as BinderRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'BINDER',
        },
        SpSegmentationChart.binderRow!
      );
      SpSegmentationChart.binderRow!.canvasRestore(context);
    };
    SpSegmentationChart.trace.rowsEL?.appendChild(SpSegmentationChart.binderRow);
    this.rowFolder!.addChildTraceRow(SpSegmentationChart.binderRow);
  }
}
class FreqChartDataStruct {
  colorIndex?: number = 0;
  dur: number = 0;
  value: number = 0;
  startNS: number = 0;
  cycle: number = 0;
  depth?: number = 1;
  name?: string = '';
}

function setCpuData(data: Array<FreqChartDataStruct>) {
  let currentMaxValue = 0;
  data.map((v: FreqChartDataStruct) => {
    if (v.value > currentMaxValue) {
      currentMaxValue = v.value;
    }
  });
  CpuFreqExtendStruct.hoverType = 'CPU-FREQ';
  CpuFreqExtendStruct.cpuMaxValue = currentMaxValue;
  SpSegmentationChart.cpuRow!.dataList = [];
  SpSegmentationChart.cpuRow!.dataListCache = [];
  SpSegmentationChart.cpuRow!.isComplete = false;
  // @ts-ignore
  SpSegmentationChart.cpuRow!.supplier = (): Promise<Array<FreqChartDataStruct>> =>
    new Promise<Array<FreqChartDataStruct>>((resolve) => resolve(data));
}
function setGpuData(data: Array<FreqChartDataStruct>): void {
  let currentMaxValue = 0;
  data.map((v: FreqChartDataStruct) => {
    if (v.value && v.value > currentMaxValue!) {
      currentMaxValue = v.value;
    }
  });
  CpuFreqExtendStruct.hoverType = 'GPU-FREQ';
  CpuFreqExtendStruct.gpuMaxValue = currentMaxValue;
  SpSegmentationChart.GpuRow!.dataList = [];
  SpSegmentationChart.GpuRow!.dataListCache = [];
  SpSegmentationChart.GpuRow!.isComplete = false;
  // @ts-ignore
  SpSegmentationChart.GpuRow!.supplier = (): Promise<Array<FreqChartDataStruct>> =>
    new Promise<Array<FreqChartDataStruct>>((resolve) => resolve(data));
}
function setSchedData(data: Array<FreqChartDataStruct>): void {
  let currentMaxValue = 0;
  data.map((v: FreqChartDataStruct) => {
    if (v.value && v.value > currentMaxValue!) {
      currentMaxValue = v.value;
    }
  });
  CpuFreqExtendStruct.hoverType = 'SCHED-SWITCH';
  CpuFreqExtendStruct.schedMaxValue = currentMaxValue!;
  SpSegmentationChart.schedRow!.dataList = [];
  SpSegmentationChart.schedRow!.dataListCache = [];
  SpSegmentationChart.schedRow!.isComplete = false;
  // @ts-ignore
  SpSegmentationChart.schedRow!.supplier = (): Promise<Array<FreqChartDataStruct>> =>
    new Promise<Array<FreqChartDataStruct>>((resolve) => resolve(data));
}
function setBinderData(data: Array<Array<FreqChartDataStruct>>, binderList: Array<FreqChartDataStruct>): void {
  data.map((v: Array<FreqChartDataStruct>) => {
    // 统计每一竖列的最大count
    let listCount = 0;
    v.map((t: FreqChartDataStruct) => {
      listCount += t.value;
      if (t.name === 'binder transaction') {
        t.depth = t.value;
      }
      if (t.name === 'binder transaction async') {
        t.depth =
          t.value +
          (v.filter((i: FreqChartDataStruct) => {
            return i.name === 'binder transaction';
          }).length > 0
            ? v.filter((i: FreqChartDataStruct) => {
              return i.name === 'binder transaction';
            })[0].value
            : 0);
      }
      if (t.name === 'binder reply') {
        t.depth =
          t.value +
          (v.filter((i: FreqChartDataStruct) => {
            return i.name === 'binder transaction';
          }).length > 0
            ? v.filter((i: FreqChartDataStruct) => {
              return i.name === 'binder transaction';
            })[0].value
            : 0) +
          (v.filter((i: FreqChartDataStruct) => {
            return i.name === 'binder transaction async';
          }).length > 0
            ? v.filter((i: FreqChartDataStruct) => {
              return i.name === 'binder transaction async';
            })[0].value
            : 0);
      }
      if (t.name === 'binder async rcv') {
        t.depth =
          t.value +
          (v.filter((i: FreqChartDataStruct) => {
            return i.name === 'binder transaction';
          }).length > 0
            ? v.filter((i: FreqChartDataStruct) => {
              return i.name === 'binder transaction';
            })[0].value
            : 0) +
          (v.filter((i: FreqChartDataStruct) => {
            return i.name === 'binder transaction async';
          }).length > 0
            ? v.filter((i: FreqChartDataStruct) => {
              return i.name === 'binder transaction async';
            })[0].value
            : 0) +
          (v.filter((i: FreqChartDataStruct) => {
            return i.name === 'binder reply';
          }).length > 0
            ? v.filter((i: FreqChartDataStruct) => {
              return i.name === 'binder reply';
            })[0].value
            : 0);
      }
      binderList.push(t);
    });
    BinderStruct.maxHeight =
      BinderStruct.maxHeight > listCount ? BinderStruct.maxHeight : JSON.parse(JSON.stringify(listCount));
    listCount = 0;
  });
}

class HeightLine {
  key: string = '';
  cycle: number = -1;
}
