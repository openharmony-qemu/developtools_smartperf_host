/*
 * Copyright (C) UNIT_HEIGHT22 Huawei Device Co., Ltd.
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
import { type EmptyRender } from '../../database/ui-worker/ProcedureWorkerCPU';
import { type FreqExtendRender, CpuFreqExtendStruct } from '../../database/ui-worker/ProcedureWorkerFreqExtend';
import { type BinderRender, BinderStruct } from '../../database/ui-worker/procedureWorkerBinder';
import { queryIrqList } from '../../database/SqlLite';
import { type BaseStruct } from '../../bean/BaseStruct';

const UNIT_HEIGHT: number = 20;
const MS_TO_US: number = 1000000;
const MIN_HEIGHT: number = 2;
export class SpSegmentationChart {
  static trace: SpSystemTrace;
  static jsonRow: TraceRow<CpuFreqExtendStruct> | undefined;
  static GpuRow: TraceRow<CpuFreqExtendStruct> | undefined;
  static binderRow: TraceRow<BinderStruct> | undefined;
  static schedRow: TraceRow<CpuFreqExtendStruct> | undefined;
  static freqInfoMapData = new Map<number, Map<number, number>>();
  private rowFolder!: TraceRow<BaseStruct>;
  static chartData: Array<Object> = [];
  // 数据切割联动
  static setChartData(type: string, data: Array<FreqChartDataStruct>): void {
    let currentMaxValue: number = 0;
    if (type === 'CPU-FREQ') {
      setCpuData(data, currentMaxValue, type);
    } else if (type === 'GPU-FREQ') {
      setGpuData(data, currentMaxValue, type);
    } else {
      setSchedData(data, currentMaxValue, type);
    }
    SpSegmentationChart.trace.refreshCanvas(true);
  }

  // binder联动调用
  static setBinderChartData(type: string, data: Array<Array<BinderDataStruct>>): void {
    BinderStruct.maxHeight = 0;
    let binderList: Array<BinderDataStruct> = [];
    let chartData: Array<BinderDataStruct> = [];
    setBinderData(data, binderList);
    chartData = binderList.map((v: BinderDataStruct) => {
      return {
        cpu:
          v.name === 'binder transaction' ?
            0 :
            v.name === 'binder transaction async' ?
              1 :
              v.name === 'binder reply' ?
                MS_TO_US : 3,
        startNS: v.startNS,
        dur: v.dur,
        name: `${v.name}`,
        value: v.count,
        depth: v.depth,
        cycle: v.idx,
        idx: v.idx,
        count: v.count,
      }
    })
    SpSegmentationChart.binderRow!.dataList = [];
    SpSegmentationChart.binderRow!.dataListCache = [];
    SpSegmentationChart.binderRow!.isComplete = false;
    SpSegmentationChart.binderRow!.style.height = `${BinderStruct.maxHeight > MS_TO_US ? BinderStruct.maxHeight * UNIT_HEIGHT + UNIT_HEIGHT : 40
      }px`;
    // @ts-ignore
    SpSegmentationChart.binderRow!.supplier = (): Promise<Array<binderDataStruct>> =>
      new Promise<Array<BinderDataStruct>>((resolve) => resolve(chartData));
  }

  // 悬浮联动
  static tabHover(type: String, tableIsHover: boolean = false, cycle: number = -1): void {
    CpuFreqExtendStruct.isTabHover = tableIsHover;
    if (type === 'CPU-FREQ' || type === 'GPU-FREQ' || type === 'SCHED-SWITCH') {
      if (tableIsHover) {
        SpSegmentationChart.jsonRow!.isHover = false;
        SpSegmentationChart.GpuRow!.isHover = false;
        CpuFreqExtendStruct.cycle = cycle;
      } else {
        CpuFreqExtendStruct.cycle = -1;
        CpuFreqExtendStruct.hoverCpuFreqStruct = undefined;
      }
    } else if (type === 'BINDER') {
      if (tableIsHover) {
        BinderStruct.hoverCycle = cycle;
      } else {
        BinderStruct.hoverCycle = -1;
      }
    }
    SpSegmentationChart.trace.refreshCanvas(true, 'flagChange');
  }

  constructor(trace: SpSystemTrace) {
    SpSegmentationChart.trace = trace;
  }

  async init() {
    let irqList = await queryIrqList();
    if (irqList.length === 0) {
      return;
    } else {
      await this.initFolder();
      await this.initCpuFreq();
      await this.initGpuTrace();
      await this.initSchedTrace();
      await this.initBinderTrace();
    }
  }

  async initFolder() {
    let row = TraceRow.skeleton();
    row.setAttribute('disabled-check', '');
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
    }
    this.rowFolder = row;
    SpSegmentationChart.trace.rowsEL?.appendChild(row);
  }

  async initCpuFreq() {
    // json文件泳道
    SpSegmentationChart.jsonRow = TraceRow.skeleton<CpuFreqExtendStruct>();
    SpSegmentationChart.jsonRow.rowId = 'cpu-freq';
    SpSegmentationChart.jsonRow.rowType = TraceRow.ROW_TYPE_CPU_COMPUTILITY;
    SpSegmentationChart.jsonRow.rowParentId = '';
    SpSegmentationChart.jsonRow.style.height = '40px';
    SpSegmentationChart.jsonRow.name = 'Cpu Computility';
    SpSegmentationChart.jsonRow.favoriteChangeHandler = SpSegmentationChart.trace.favoriteChangeHandler;
    SpSegmentationChart.jsonRow.addRowCheckFilePop();
    SpSegmentationChart.jsonRow.rowSetting = 'checkFile';
    // 拿到了用户传递的数据
    SpSegmentationChart.jsonRow.onRowCheckFileChangeHandler = (e: string | ArrayBuffer | null): void => {
      // @ts-ignore
      let chartData = JSON.parse(e);
      let mapData = new Map<number, number>();
      // @ts-ignore
      chartData.map((v) => {
        for (let key in v.freqInfo) {
          mapData.set(Number(key), Number(v.freqInfo[key]));
        };
        SpSegmentationChart.freqInfoMapData.set(v.cpuId, mapData);
        mapData = new Map();
      })
    }
    SpSegmentationChart.jsonRow.focusHandler = (ev): void => {
      SpSegmentationChart.trace?.displayTip(
        SpSegmentationChart.jsonRow!,
        CpuFreqExtendStruct.hoverCpuFreqStruct,
        `<span>${CpuFreqExtendStruct.hoverCpuFreqStruct === undefined ? 0 : CpuFreqExtendStruct.hoverCpuFreqStruct.value!
        }</span>`
      )
    }
    SpSegmentationChart.jsonRow.findHoverStruct = (): void => {
      CpuFreqExtendStruct.hoverCpuFreqStruct = SpSegmentationChart.jsonRow!.getHoverStruct();
    }
    // @ts-ignore
    SpSegmentationChart.jsonRow.supplier = (): Promise<Array<freqChartDataStruct>> =>
      new Promise<Array<FreqChartDataStruct>>((resolve) => resolve([]));
    SpSegmentationChart.jsonRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (SpSegmentationChart.jsonRow!.currentContext) {
        context = SpSegmentationChart.jsonRow!.currentContext;
      } else {
        context = SpSegmentationChart.jsonRow!.collect ?
          SpSegmentationChart.trace.canvasFavoritePanelCtx! :
          SpSegmentationChart.trace.canvasPanelCtx!;
      }
      SpSegmentationChart.jsonRow!.canvasSave(context);
      (renders['freq-extend'] as FreqExtendRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'cpu-freq',
        },
        SpSegmentationChart.jsonRow!
      )
      SpSegmentationChart.jsonRow!.canvasRestore(context);
    }
    SpSegmentationChart.trace.rowsEL?.appendChild(SpSegmentationChart.jsonRow);
    this.rowFolder!.addChildTraceRow(SpSegmentationChart.jsonRow);
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
        CpuFreqExtendStruct.hoverCpuFreqStruct,
        `<span>${CpuFreqExtendStruct.hoverCpuFreqStruct === undefined ? 0 : CpuFreqExtendStruct.hoverCpuFreqStruct.value!
        }</span>`
      );
    }
    SpSegmentationChart.GpuRow.findHoverStruct = (): void => {
      CpuFreqExtendStruct.hoverCpuFreqStruct = SpSegmentationChart.GpuRow!.getHoverStruct();
    }
    SpSegmentationChart.GpuRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (SpSegmentationChart.GpuRow!.currentContext) {
        context = SpSegmentationChart.GpuRow!.currentContext;
      } else {
        context = SpSegmentationChart.GpuRow!.collect ?
          SpSegmentationChart.trace.canvasFavoritePanelCtx! :
          SpSegmentationChart.trace.canvasPanelCtx!;
      }
      SpSegmentationChart.GpuRow!.canvasSave(context);
      (renders['freq-extend'] as FreqExtendRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'gpu-freq',
        },
        SpSegmentationChart.GpuRow!
      )
      SpSegmentationChart.GpuRow!.canvasRestore(context);
    }
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
        CpuFreqExtendStruct.hoverCpuFreqStruct,
        `<span>${CpuFreqExtendStruct.hoverCpuFreqStruct?.value!}</span>`
      )
    }
    SpSegmentationChart.schedRow.findHoverStruct = (): void => {
      CpuFreqExtendStruct.hoverCpuFreqStruct = SpSegmentationChart.schedRow!.getHoverStruct();
    }
    // @ts-ignore
    SpSegmentationChart.schedRow.supplier = (): Promise<Array<freqChartDataStruct>> =>
      new Promise<Array<FreqChartDataStruct>>((resolve) => resolve([]));
    SpSegmentationChart.schedRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (SpSegmentationChart.schedRow!.currentContext) {
        context = SpSegmentationChart.schedRow!.currentContext;
      } else {
        context = SpSegmentationChart.schedRow!.collect ?
          SpSegmentationChart.trace.canvasFavoritePanelCtx! :
          SpSegmentationChart.trace.canvasPanelCtx!;
      }
      SpSegmentationChart.schedRow!.canvasSave(context);
      (renders['freq-extend'] as FreqExtendRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'sched',
        },
        SpSegmentationChart.schedRow!
      )
      SpSegmentationChart.schedRow!.canvasRestore(context);
    }
    SpSegmentationChart.trace.rowsEL?.appendChild(SpSegmentationChart.schedRow);
    this.rowFolder!.addChildTraceRow(SpSegmentationChart.schedRow);
  }

  async initBinderTrace() {
    SpSegmentationChart.binderRow = TraceRow.skeleton<BinderStruct>();
    SpSegmentationChart.binderRow.rowId = 'binderrow';
    SpSegmentationChart.binderRow.rowType = TraceRow.ROW_TYPE_BINDER_COUNT;
    SpSegmentationChart.binderRow.rowParentId = '';
    SpSegmentationChart.binderRow.name = 'Binder Count';
    SpSegmentationChart.binderRow.style.height = '40px';
    SpSegmentationChart.binderRow.favoriteChangeHandler = SpSegmentationChart.trace.favoriteChangeHandler;
    SpSegmentationChart.binderRow.selectChangeHandler = SpSegmentationChart.trace.selectChangeHandler;
    SpSegmentationChart.binderRow.findHoverStruct = (): void => {
      BinderStruct.hoverCpuFreqStruct = SpSegmentationChart.binderRow!.dataListCache.find((v: BinderStruct): BinderStruct => {
        if (SpSegmentationChart.binderRow!.isHover) {
          if (
            v.frame!.x < SpSegmentationChart.binderRow!.hoverX &&
            v.frame!.x + v.frame!.width > SpSegmentationChart.binderRow!.hoverX &&
            BinderStruct.maxHeight * UNIT_HEIGHT - v.depth * UNIT_HEIGHT + UNIT_HEIGHT < SpSegmentationChart.binderRow!.hoverY &&
            BinderStruct.maxHeight * UNIT_HEIGHT - v.depth * UNIT_HEIGHT + v.value * UNIT_HEIGHT + UNIT_HEIGHT > SpSegmentationChart.binderRow!.hoverY
          ) {
            return v;
          } else {
            return new BinderStruct();
          }
        } else {
          return new BinderStruct();
        }
      })
    }
    SpSegmentationChart.binderRow.supplier = (): Promise<Array<BinderStruct>> =>
      new Promise<Array<BinderStruct>>((resolve) => resolve([]));
    SpSegmentationChart.binderRow.onThreadHandler = (useCache): void => {
      let context: CanvasRenderingContext2D;
      if (SpSegmentationChart.binderRow!.currentContext) {
        context = SpSegmentationChart.binderRow!.currentContext;
      } else {
        context = SpSegmentationChart.binderRow!.collect ?
          SpSegmentationChart.trace.canvasFavoritePanelCtx! :
          SpSegmentationChart.trace.canvasPanelCtx!;
      }
      SpSegmentationChart.binderRow!.canvasSave(context);
      (renders.binder as BinderRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          type: 'binder',
        },
        SpSegmentationChart.binderRow!
      )
      SpSegmentationChart.binderRow!.canvasRestore(context);
    }
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
    }
    SpSegmentationChart.trace.rowsEL?.appendChild(SpSegmentationChart.binderRow);
    this.rowFolder!.addChildTraceRow(SpSegmentationChart.binderRow);
  }
}

class FreqChartDataStruct {
  cpu?: number = 0;
  dur: number = 0;
  duration?: number = 0;
  value: number = 0;
  startNS: number = 0;
  cycle: number = 0;
  freq?: number = 0;
  type?: string = '';
  count?: number = 0;
  cycleStartTime?: number = 0;
}

class BinderDataStruct {
  name: string = '';
  count: number = 0;
  dur: number = 0;
  startNS: number = 0;
  idx: number = -1;
  depth?: number = 0;
}

function setCpuData(data: Array<FreqChartDataStruct>, currentMaxValue: number, type: string) {
  let chartData = data.map((v: FreqChartDataStruct) => {
    if (v.value > currentMaxValue) {
      currentMaxValue = v.value;
    }
    return {
      cpu: 0,
      dur: v.dur,
      value: v.value ? v.value : v.count ? v.count : 0,
      startNS: v.startNS,
      cycle: v.cycle,
      type,
    }
  })
  CpuFreqExtendStruct.maxValue = currentMaxValue;
  SpSegmentationChart.jsonRow!.dataList = [];
  SpSegmentationChart.jsonRow!.dataListCache = [];
  SpSegmentationChart.jsonRow!.isComplete = false;
  // @ts-ignore
  SpSegmentationChart.jsonRow!.supplier = (): Promise<Array<FreqChartDataStruct>> =>
    new Promise<Array<FreqChartDataStruct>>((resolve) => resolve(chartData));
}

function setGpuData(data: Array<FreqChartDataStruct>, currentMaxValue: number, type: string): void {
  let chartData = data.map((v: FreqChartDataStruct) => {
    let _count = Number(v.count);
    if (_count > currentMaxValue) {
      currentMaxValue = _count;
    }
    return {
      cpu: 7,
      dur: v.dur ? Number(v.dur * MS_TO_US) : 0,
      value: Number(v.count),
      startNS: Number(v.startNS),
      cycle: Number(v.cycle),
      type,
    }
  })
  CpuFreqExtendStruct.maxValue = currentMaxValue;
  SpSegmentationChart.GpuRow!.dataList = [];
  SpSegmentationChart.GpuRow!.dataListCache = [];
  SpSegmentationChart.GpuRow!.isComplete = false;
  // @ts-ignore
  SpSegmentationChart.GpuRow!.supplier = (): Promise<Array<FreqChartDataStruct>> =>
    new Promise<Array<FreqChartDataStruct>>((resolve) => resolve(chartData));
}

function setSchedData(data: Array<FreqChartDataStruct>, currentMaxValue: number | undefined, type: string): void {
  let chartData = data.map((v: FreqChartDataStruct) => {
    if (v.count && v.count > currentMaxValue!) {
      currentMaxValue = v.count;
    }
    return {
      cpu: 5,
      dur: Number(v.duration) * 100000,
      value: Number(v.count),
      startNS: Number(v.cycleStartTime) * MS_TO_US,
      cycle: v.cycle,
      type,
    }
  })
  CpuFreqExtendStruct.maxValue = currentMaxValue!;
  SpSegmentationChart.schedRow!.dataList = [];
  SpSegmentationChart.schedRow!.dataListCache = [];
  SpSegmentationChart.schedRow!.isComplete = false;
  // @ts-ignore
  SpSegmentationChart.schedRow!.supplier = (): Promise<Array<FreqChartDataStruct>> =>
    new Promise<Array<FreqChartDataStruct>>((resolve) => resolve(chartData));
}

function setBinderData(data: Array<Array<BinderDataStruct>>, binderList: Array<BinderDataStruct>): void {
  data.map((v: Array<BinderDataStruct>) => {
    // 统计每一竖列的最大count
    let listCount = 0;
    v.map((t: BinderDataStruct) => {
      listCount += t.count;
      if (t.name === 'binder transaction') {
        t.depth = t.count;
      }
      if (t.name === 'binder transaction async') {
        t.depth =
          t.count +
          (v.filter((i: BinderDataStruct) => {
            return i.name === 'binder transaction';
          }).length > 0 ?
            v.filter((i: BinderDataStruct) => {
              return i.name === 'binder transaction';
            })[0].count :
            0);
      }
      if (t.name === 'binder reply') {
        t.depth =
          t.count +
          (v.filter((i: BinderDataStruct) => {
            return i.name === 'binder transaction';
          }).length > 0 ?
            v.filter((i: BinderDataStruct) => {
              return i.name === 'binder transaction';
            })[0].count :
            0) +
          (v.filter((i: BinderDataStruct) => {
            return i.name === 'binder transaction async';
          }).length > 0 ?
            v.filter((i: BinderDataStruct) => {
              return i.name === 'binder transaction async';
            })[0].count :
            0);
      }
      if (t.name === 'binder async rcv') {
        t.depth =
          t.count +
          (v.filter((i: BinderDataStruct) => {
            return i.name === 'binder transaction';
          }).length > 0 ?
            v.filter((i: BinderDataStruct) => {
              return i.name === 'binder transaction';
            })[0].count :
            0) +
          (v.filter((i: BinderDataStruct) => {
            return i.name === 'binder transaction async';
          }).length > 0 ?
            v.filter((i: BinderDataStruct) => {
              return i.name === 'binder transaction async';
            })[0].count :
            0) +
          (v.filter((i: BinderDataStruct) => {
            return i.name === 'binder reply';
          }).length > 0 ?
            v.filter((i: BinderDataStruct) => {
              return i.name === 'binder reply';
            })[0].count :
            0);
      }
      binderList.push(t);
    })
    BinderStruct.maxHeight =
      BinderStruct.maxHeight > listCount ? BinderStruct.maxHeight : JSON.parse(JSON.stringify(listCount));
    listCount = 0;
  })
}
