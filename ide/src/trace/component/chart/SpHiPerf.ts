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

import { SpSystemTrace } from '../SpSystemTrace.js';
import { TraceRow } from '../trace/base/TraceRow.js';
import {
  queryHiPerfCpuData,
  queryHiPerfCpuMergeData,
  queryHiPerfCpuMergeData2,
  queryHiPerfEventList,
  queryHiPerfProcessData,
  queryHiPerfThreadData,
  queryPerfCmdline,
  queryPerfThread,
} from '../../database/SqlLite.js';
import { Utils } from '../trace/base/Utils.js';
import { PerfThread } from '../../bean/PerfProfile.js';
import { HiperfCpuRender, HiPerfCpuStruct } from '../../database/ui-worker/ProcedureWorkerHiPerfCPU.js';
import { HiperfCallChartRender, HiPerfCallChartStruct } from '../../database/ui-worker/ProcedureWorkerHiPerfCallChart.js';
import { HiperfThreadRender, HiPerfThreadStruct } from '../../database/ui-worker/ProcedureWorkerHiPerfThread.js';
import { HiperfProcessRender, HiPerfProcessStruct } from '../../database/ui-worker/ProcedureWorkerHiPerfProcess.js';
import { info } from '../../../log/Log.js';
import { HiPerfEventStruct } from '../../database/ui-worker/ProcedureWorkerHiPerfEvent.js';
import { perfDataQuery } from './PerfDataQuery.js';
import { renders } from '../../database/ui-worker/ProcedureWorker.js';
import { EmptyRender } from '../../database/ui-worker/ProcedureWorkerCPU.js';
import { type HiPerfReportStruct } from '../../database/ui-worker/ProcedureWorkerHiPerfReport.js';
import { SpChartManager } from './SpChartManager.js';
import { procedurePool } from '../../database/Procedure.js';
import { hiPerfchartFrame } from '../../bean/perfStruct.js';

export interface ResultData {
  existA: boolean | null | undefined;
  existF: boolean | null | undefined;
  fValue: number;
}

export class SpHiPerf {
  static selectCpuStruct: HiPerfCpuStruct | undefined;
  static selectProcessStruct: HiPerfProcessStruct | undefined;
  static selectThreadStruct: HiPerfThreadStruct | undefined;
  static stringResult: ResultData | undefined;

  private cpuData: Array<any> | undefined;
  public maxCpuId: number = 0;
  private rowFolder!: TraceRow<any>;
  private perfThreads: Array<PerfThread> | undefined;
  private trace: SpSystemTrace;
  private group: any;
  private rowList: TraceRow<any>[] | undefined;
  private eventTypeList: Array<{ id: number; report_value: string }> = [];
  private allCombineDataMap = new Map<number, hiPerfchartFrame>();
  
  public perfCallDataList: any = [];
  public threadDataList: any = [];

  constructor(trace: SpSystemTrace) {
    this.trace = trace;
  }

  async init() {
    await this.initCmdLine();
    this.rowList = [];
    this.perfThreads = await queryPerfThread();
    this.eventTypeList = await queryHiPerfEventList();
    info('PerfThread Data size is: ', this.perfThreads!.length);
    this.group = Utils.groupBy(this.perfThreads || [], 'pid');
    Reflect.ownKeys(this.group).forEach((v, i) => {
      this.threadDataList.push((this.group[v] as Array<PerfThread>).filter((item: any) => { return item.pid === item.tid })[0])
    })
    this.cpuData = await queryHiPerfCpuMergeData2();
    this.maxCpuId = this.cpuData.length > 0 ? this.cpuData[0].cpu_id : -Infinity;
    if (this.cpuData.length > 0) {
      await this.initFolder();
      await this.initCallChart()
      await this.initCpuMerge();
      await this.initCpu();
      await this.initProcess();
    }
    info('HiPerf Data initialized');
  }

  getStringResult(s: string = '') {
    let list = s.split(' ').filter((e) => e);
    let sA = list.findIndex((item) => item == '-a');
    let sF = list.findIndex((item) => item == '-f');
    SpHiPerf.stringResult = {
      existA: sA !== -1,
      existF: sF !== -1,
      fValue: Number((1000 / (sF !== -1 ? parseInt(list[sF + 1]) : 1000)).toFixed(2)),
    };
  }

  async initCmdLine() {
    let perfCmdLines = await queryPerfCmdline();
    if (perfCmdLines.length > 0) {
      this.getStringResult(perfCmdLines[0].report_value);
    } else {
      SpHiPerf.stringResult = {
        existA: true,
        existF: false,
        fValue: 1,
      };
    }
  }

  async initFolder() {
    let row = TraceRow.skeleton();
    row.setAttribute('disabled-check', '');
    row.rowId = `HiPerf`;
    row.index = 0;
    row.rowType = TraceRow.ROW_TYPE_HIPERF;
    row.rowParentId = '';
    row.folder = true;
    row.style.height = '40px';
    if (SpHiPerf.stringResult?.existA === true) {
      row.name = `HiPerf (All)`;
    } else {
      let names = Reflect.ownKeys(this.group)
        .map((pid: any) => {
          let array = this.group[pid] as Array<PerfThread>;
          let process = array.filter((th) => th.pid === th.tid)[0];
          return process.processName;
        })
        .join(',');
      row.name = `HiPerf (${names})`;
    }
    row.supplier = () => new Promise<Array<any>>((resolve) => resolve([]));
    row.onThreadHandler = (useCache) => {
      row.canvasSave(this.trace.canvasPanelCtx!);
      if (row.expansion) {
        this.trace.canvasPanelCtx?.clearRect(0, 0, row.frame.width, row.frame.height);
      } else {
        (renders['empty'] as EmptyRender).renderMainThread(
          {
            context: this.trace.canvasPanelCtx,
            useCache: useCache,
            type: ``,
          },
          row
        );
      }
      row.canvasRestore(this.trace.canvasPanelCtx!);
    };
    this.rowFolder = row;
    this.trace.rowsEL?.appendChild(row);
  }

  async initCpuMerge() {
    let cpuMergeRow = TraceRow.skeleton<HiPerfCpuStruct>();
    cpuMergeRow.rowId = `HiPerf-cpu-merge`;
    cpuMergeRow.index = 0;
    cpuMergeRow.rowType = TraceRow.ROW_TYPE_HIPERF_CPU;
    cpuMergeRow.rowParentId = 'HiPerf';
    cpuMergeRow.rowHidden = !this.rowFolder.expansion;
    cpuMergeRow.folder = false;
    cpuMergeRow.name = `HiPerf`;
    cpuMergeRow.style.height = '40px';
    cpuMergeRow.setAttribute('children', '');
    cpuMergeRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    cpuMergeRow.selectChangeHandler = this.trace.selectChangeHandler;
    cpuMergeRow.supplier = () => queryHiPerfCpuMergeData();
    cpuMergeRow.focusHandler = () => this.hoverTip(cpuMergeRow, HiPerfCpuStruct.hoverStruct);
    cpuMergeRow.findHoverStruct = () => {
      HiPerfCpuStruct.hoverStruct = cpuMergeRow.getHoverStruct(false, (TraceRow.range?.scale || 50) <= 30_000_000);
    };
    cpuMergeRow.onThreadHandler = (useCache) => {
      let context: CanvasRenderingContext2D;
      if (cpuMergeRow.currentContext) {
        context = cpuMergeRow.currentContext;
      } else {
        context = cpuMergeRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
      }
      cpuMergeRow.canvasSave(context);
      (renders['HiPerf-Cpu'] as HiperfCpuRender).renderMainThread(
        {
          context: context,
          useCache: useCache,
          scale: TraceRow.range?.scale || 50,
          type: `HiPerf-Cpu-Merge`,
          maxCpu: this.maxCpuId + 1,
          intervalPerf: SpHiPerf.stringResult?.fValue || 1,
          range: TraceRow.range,
        },
        cpuMergeRow
      );
      cpuMergeRow.canvasRestore(context);
    };
    this.rowFolder.addChildTraceRow(cpuMergeRow);
    this.rowList?.push(cpuMergeRow);
  }

  // callchart泳道
  async initCallChart() {
    let perfCallCutRow = TraceRow.skeleton<HiPerfCallChartStruct>();
    perfCallCutRow.rowId = `HiPerf-callchart`;
    perfCallCutRow.index = 0;
    perfCallCutRow.rowType = TraceRow.ROW_TYPE_PERF_CALLCHART;
    perfCallCutRow.rowParentId = 'HiPerf';
    perfCallCutRow.rowHidden = !this.rowFolder.expansion;
    perfCallCutRow.folder = false;
    perfCallCutRow.name = 'callchart';
    perfCallCutRow.setAttribute('children', '');
    perfCallCutRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    perfCallCutRow.selectChangeHandler = this.trace.selectChangeHandler;
    this.rowFolder.addChildTraceRow(perfCallCutRow);
    perfCallCutRow.focusHandler = (): void => {
      this.trace?.displayTip(
        perfCallCutRow!,
        HiPerfCallChartStruct.hoverPerfCallCutStruct,
        `<span style='font-weight: bold;color:"#000"'>Name: </span>
        <span>${HiPerfCallChartStruct.hoverPerfCallCutStruct?.name || ''}</span><br>
        <span style='font-weight: bold;'>Self Time: </span>
        <span>${HiPerfCallChartStruct.hoverPerfCallCutStruct?.totalTime || ''}</span><br>
        <span style='font-weight: bold;'>Event Type: </span>
        <span>${HiPerfCallChartStruct.hoverPerfCallCutStruct?.totalTime || ''}</span><br>`
      );
    };
    this.rowList?.push(perfCallCutRow);
    perfCallCutRow.findHoverStruct = () => {
      HiPerfCallChartStruct.hoverPerfCallCutStruct = perfCallCutRow.getHoverStruct();
    };
    await this.setCallTotalRow(perfCallCutRow, this.cpuData, this.threadDataList);
  }

  async initCpu() {
    for (let i = 0; i <= this.maxCpuId; i++) {
      let perfCpuRow = TraceRow.skeleton<HiPerfCpuStruct>();
      perfCpuRow.rowId = `HiPerf-cpu-${i}`;
      perfCpuRow.index = i;
      perfCpuRow.rowType = TraceRow.ROW_TYPE_HIPERF_CPU;
      perfCpuRow.rowParentId = 'HiPerf';
      perfCpuRow.rowHidden = !this.rowFolder.expansion;
      perfCpuRow.folder = false;
      perfCpuRow.name = `Cpu ${i}`;
      perfCpuRow.setAttribute('children', '');
      perfCpuRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
      perfCpuRow.selectChangeHandler = this.trace.selectChangeHandler;
      perfCpuRow.style.height = '40px';
      perfCpuRow.supplier = () => queryHiPerfCpuData(i);
      perfCpuRow.focusHandler = () => this.hoverTip(perfCpuRow, HiPerfCpuStruct.hoverStruct);
      perfCpuRow.findHoverStruct = () => {
        HiPerfCpuStruct.hoverStruct = perfCpuRow.getHoverStruct(false, (TraceRow.range?.scale || 50) <= 30_000_000);
      };
      perfCpuRow.onThreadHandler = (useCache) => {
        let context: CanvasRenderingContext2D;
        if (perfCpuRow.currentContext) {
          context = perfCpuRow.currentContext;
        } else {
          context = perfCpuRow.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
        }
        perfCpuRow.canvasSave(context);
        (renders['HiPerf-Cpu'] as HiperfCpuRender).renderMainThread(
          {
            context: context,
            useCache: useCache,
            scale: TraceRow.range?.scale || 50,
            type: `HiPerf-Cpu-${i}`,
            maxCpu: this.maxCpuId + 1,
            intervalPerf: SpHiPerf.stringResult?.fValue || 1,
            range: TraceRow.range,
          },
          perfCpuRow
        );
        perfCpuRow.canvasRestore(context);
      };
      this.rowFolder.addChildTraceRow(perfCpuRow);
      this.rowList?.push(perfCpuRow);
    }
  }

  async initProcess() {
    Reflect.ownKeys(this.group).forEach((key, index) => {
      let array = this.group[key] as Array<PerfThread>;
      let process = array.filter((th) => th.pid === th.tid)[0];
      let row = TraceRow.skeleton<HiPerfProcessStruct>();
      row.rowId = `${process.pid}-Perf-Process`;
      row.index = index;
      row.rowType = TraceRow.ROW_TYPE_HIPERF_PROCESS;
      row.rowParentId = 'HiPerf';
      row.rowHidden = !this.rowFolder.expansion;
      row.folder = true;
      if (SpChartManager.APP_STARTUP_PID_ARR.find((pid) => pid === process.pid) !== undefined) {
        row.addTemplateTypes('AppStartup');
      }
      row.addTemplateTypes('HiPerf');
      row.name = `${process.processName || 'Process'} [${process.pid}]`;
      row.folderPaddingLeft = 6;
      row.style.height = '40px';
      row.favoriteChangeHandler = this.trace.favoriteChangeHandler;
      row.selectChangeHandler = this.trace.selectChangeHandler;
      row.supplier = () => queryHiPerfProcessData(process.pid);
      row.focusHandler = () => this.hoverTip(row, HiPerfProcessStruct.hoverStruct);
      row.findHoverStruct = () => {
        HiPerfProcessStruct.hoverStruct = row.getHoverStruct(false, (TraceRow.range?.scale || 50) <= 30_000_000);
      };
      row.onThreadHandler = (useCache) => {
        let context: CanvasRenderingContext2D;
        if (row.currentContext) {
          context = row.currentContext;
        } else {
          context = row.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
        }
        row.canvasSave(context);
        if (row.expansion) {
          this.trace.canvasPanelCtx?.clearRect(0, 0, row.frame.width, row.frame.height);
        } else {
          (renders['HiPerf-Process'] as HiperfProcessRender).renderMainThread(
            {
              context: context,
              useCache: useCache,
              scale: TraceRow.range?.scale || 50,
              type: `HiPerf-Process-${row.index}`,
              intervalPerf: SpHiPerf.stringResult?.fValue || 1,
              range: TraceRow.range,
            },
            row
          );
        }
        row.canvasRestore(context);
      };
      this.rowFolder.addChildTraceRow(row);
      this.rowList?.push(row);
      array.forEach((thObj, thIdx) => {
        let thread = TraceRow.skeleton<HiPerfThreadStruct>();
        thread.rowId = `${thObj.tid}-Perf-Thread`;
        thread.index = thIdx;
        thread.rowType = TraceRow.ROW_TYPE_HIPERF_THREAD;
        thread.rowParentId = row.rowId;
        thread.rowHidden = !row.expansion;
        thread.folder = false;
        thread.name = `${thObj.threadName || 'Thread'} [${thObj.tid}]`;
        thread.setAttribute('children', '');
        thread.folderPaddingLeft = 0;
        thread.style.height = '40px';
        thread.favoriteChangeHandler = this.trace.favoriteChangeHandler;
        thread.selectChangeHandler = this.trace.selectChangeHandler;
        thread.supplier = () => queryHiPerfThreadData(thObj.tid);
        thread.focusHandler = () => this.hoverTip(thread, HiPerfThreadStruct.hoverStruct);
        thread.findHoverStruct = () => {
          HiPerfThreadStruct.hoverStruct = thread.getHoverStruct(false, (TraceRow.range?.scale || 50) <= 30_000_000);
        };
        thread.onThreadHandler = (useCache) => {
          let context: CanvasRenderingContext2D;
          if (thread.currentContext) {
            context = thread.currentContext;
          } else {
            context = thread.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
          }
          thread.canvasSave(context);
          (renders['HiPerf-Thread'] as HiperfThreadRender).renderMainThread(
            {
              context: context,
              useCache: useCache,
              scale: TraceRow.range?.scale || 50,
              type: `HiPerf-Thread-${row.index}-${thread.index}`,
              intervalPerf: SpHiPerf.stringResult?.fValue || 1,
              range: TraceRow.range,
            },
            thread
          );
          thread.canvasRestore(context);
        };
        row.addChildTraceRow(thread);
        this.rowList?.push(thread);
      });
    });
  }

  // callchart级联单选按钮
  async setCallTotalRow(row: any, cpuData: any = Array, threadData: any = Array) {
    row.addTemplateTypes('Hiperf-callchart');
    row.rowSetting = 'enable';
    row.rowSettingList = [
      {
        key: "cpu",
        title: 'cpu',
        children: [
          ...cpuData.reverse().map(
            (
              it: any
            ): {
              key: string;
              title: string;
            } => {
              return {
                key: `${it.cpu_id}c`,
                title: `cpu${it.cpu_id}`,
              };
            }
          ),
        ]
      },
      {
        key: "thread",
        title: 'thread',
        children: [
          ...threadData.map(
            (it: any): {
              key: string;
              title: string;
            } => {
              return {
                key: `${it.tid}t`,
                title: `${it.threadName || 'thread'}[${it.tid}] `
              }
            }
          )
        ]
      }

    ];
    row.onRowSettingChangeHandler = (setting: any): void => {
      if (setting && setting.length > 0) {
        // 0:cpu,1:thread
        this.initHiPerfChartData(setting[0].indexOf('c') > -1 ? 0 : 1, Number(setting[0].indexOf('c') > -1 ?
          setting[0].substring(0, setting[0].indexOf('c')) : setting[0].substring(0, setting[0].indexOf('t'))), row);
        row.name = `callchart[${setting[0].indexOf('c') > -1 ? 'cpu' : 'thread'}${setting[0].substring(0, setting[0].length - 1)}]`;
      }
      row.clearCanvas();
      row.onThreadHandler = (useCache: any) => {
        row.dataList = this.perfCallDataList;
        let context: CanvasRenderingContext2D;
        if (row.currentContext) {
          context = row.currentContext;
        } else {
          context = row.collect ? this.trace.canvasFavoritePanelCtx! : this.trace.canvasPanelCtx!;
        }
        row.canvasSave(context);
        (renders['Hiperf-callchart'] as HiperfCallChartRender).renderMainThread(
          {
            context: context,
            useCache: useCache,
            type: `Hiperf-callchart`,
          },
          row
        );
        row.canvasRestore(context);
      };
    };
  }

  /*
   *  callchart请求数据
   */
  async initHiPerfChartData(type: number, id: number, perfCpuRow: any) {
    await procedurePool.submitWithName(
      'logic0',
      'perf-fire',
      [
        type, id
      ],
      undefined,
      (res: Array<hiPerfchartFrame>) => {
        let allCombineData: Array<hiPerfchartFrame> = [];
        this.getAllCombineData(res, allCombineData);
        this.allCombineDataMap = new Map<number, hiPerfchartFrame>();
        for (let data of allCombineData) {
          this.allCombineDataMap.set(data.id, data);
        }
        // let max = Math.max(...allCombineData.map((it) => it.depth || 0)) + 1;
        let max = 0;
        for (let i = 0; i < allCombineData.length; i++) {
          if (allCombineData[i].depth > max) {
            max = allCombineData[i].depth
          } else {

          }
          i++;
        }
        let maxHeight = max * 20;
        perfCpuRow!.style.height = `${maxHeight}px`;
        perfCpuRow.supplier = (): Promise<Array<any>> =>
          new Promise<Array<any>>((resolve) => resolve(allCombineData));
        this.perfCallDataList = allCombineData
      }
    )
  }

  getAllCombineData(
    combineData: Array<hiPerfchartFrame>,
    allCombineData: Array<hiPerfchartFrame>
  ): void {
    for (let data of combineData) {
      if (data.name != 'name') {
        allCombineData.push(data);
      }
      if (data.children && data.children.length > 0) {
        this.getAllCombineData(data.children, allCombineData);
      }
    }
  }


  updateChartData() {
    this.rowList?.forEach((it) => {
      it.dataList = [];
      it.dataList2 = [];
      it.dataListCache = [];
      it.isComplete = false;
    });
  }

  hoverTip(
    row: TraceRow<any>,
    struct:
      | HiPerfThreadStruct
      | HiPerfProcessStruct
      | HiPerfEventStruct
      | HiPerfReportStruct
      | HiPerfCpuStruct
      | undefined
  ) {
    let tip = '';
    if (struct) {
      let num = 0;
      if (struct instanceof HiPerfEventStruct) {
        num = Math.trunc(((struct.sum || 0) / (struct.max || 0)) * 100);
      } else {
        num = Math.trunc(((struct.height || 0) / 40) * 100);
      }
      if (num > 0) {
        tip = `<span>${num * (this.maxCpuId + 1)}% (10.00ms)</span>`;
      } else {
        let perfCall = perfDataQuery.callChainMap.get(struct.callchain_id || 0);
        tip = `<span>${perfCall ? perfCall.name : ''} (${perfCall ? perfCall.depth : '0'} other frames)</span>`;
      }
    }
    this.trace?.displayTip(row, struct, tip);
  }
}
