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

import { SpSystemTrace } from '../SpSystemTrace';
import { TraceRow } from '../trace/base/TraceRow';
import { Utils } from '../trace/base/Utils';
import { PerfThread } from '../../bean/PerfProfile';
import { HiPerfCpuStruct } from '../../database/ui-worker/hiperf/ProcedureWorkerHiPerfCPU2';
import {
  HiPerfCallChartRender,
  HiPerfCallChartStruct,
} from '../../database/ui-worker/hiperf/ProcedureWorkerHiPerfCallChart';
import { HiPerfThreadStruct } from '../../database/ui-worker/hiperf/ProcedureWorkerHiPerfThread2';
import { HiPerfProcessStruct } from '../../database/ui-worker/hiperf/ProcedureWorkerHiPerfProcess2';
import { info } from '../../../log/Log';
import { HiPerfEventStruct } from '../../database/ui-worker/hiperf/ProcedureWorkerHiPerfEvent';
import { perfDataQuery } from './PerfDataQuery';
import { type HiPerfReportStruct } from '../../database/ui-worker/hiperf/ProcedureWorkerHiPerfReport';
import { folderThreadHandler, getRowContext, rowThreadHandler, SpChartManager } from './SpChartManager';
import { HiperfCpuRender2 } from '../../database/ui-worker/hiperf/ProcedureWorkerHiPerfCPU2';
import { hiperfCpuDataSender } from '../../database/data-trafic/hiperf/HiperfCpuDataSender';
import { hiperfProcessDataSender } from '../../database/data-trafic/hiperf/HiperfProcessDataSender';
import { HiperfProcessRender2 } from '../../database/ui-worker/hiperf/ProcedureWorkerHiPerfProcess2';
import { hiperfThreadDataSender } from '../../database/data-trafic/hiperf/HiperfThreadDataSender';
import { HiperfThreadRender2 } from '../../database/ui-worker/hiperf/ProcedureWorkerHiPerfThread2';
import {
  hiperfCallChartDataCacheSender,
  hiperfCallChartDataSender,
  hiperfCallStackCacheSender,
} from '../../database/data-trafic/hiperf/HiperfCallChartSender';
import {
  queryHiPerfCpuMergeData2,
  queryPerfCmdline,
  queryPerfEventType,
  queryPerfThread,
} from '../../database/sql/Perf.sql';
import { renders } from '../../database/ui-worker/ProcedureWorker';
import { SpStatisticsHttpUtil } from '../../../statistics/util/SpStatisticsHttpUtil';

export interface ResultData {
  existA: boolean | null | undefined;
  existF: boolean | null | undefined;
  fValue: number;
}
const FOLD_HEIGHT = 20;
export class SpHiPerf {
  static selectCpuStruct: HiPerfCpuStruct | undefined;
  static stringResult: ResultData | undefined;

  private cpuData: Array<unknown> | undefined;
  public maxCpuId: number = 0; //@ts-ignore
  private rowFolder!: TraceRow<unknown>;
  private perfThreads: Array<PerfThread> | undefined;
  private trace: SpSystemTrace;
  private group: unknown; //@ts-ignore
  private rowList: TraceRow<unknown>[] | undefined;
  private eventTypeList: Array<{ id: number; report: string }> = [];
  private callChartType: number = 0;
  private callChartId: number = 0;
  private eventTypeId: number = -2;
  static hiperfEvent: number | undefined = -2;

  constructor(trace: SpSystemTrace) {
    this.trace = trace;
  }

  async init(): Promise<void> {
    await this.initCmdLine();
    this.eventTypeList = await queryPerfEventType();
    this.rowList = [];
    this.perfThreads = await queryPerfThread();
    info('PerfThread Data size is: ', this.perfThreads!.length);
    this.group = Utils.groupBy(this.perfThreads || [], 'pid');
    this.cpuData = await queryHiPerfCpuMergeData2();
    this.callChartType = 0;
    this.callChartId = 0;
    SpHiPerf.hiperfEvent = -2;
    this.eventTypeId = -2; //@ts-ignore
    this.maxCpuId = this.cpuData.length > 0 ? this.cpuData[0].cpu_id : -Infinity;
    if (this.cpuData.length > 0) {
      await this.initFolder();
      await this.initCallChart();
      await this.initCpuMerge();
      await this.initCpu();
      await this.initProcess();
    }
    info('HiPerf Data initialized');
  }

  getStringResult(s: string = ''): void {
    let list = s.split(' ');
    let sA = list.findIndex((item) => item === '-a');
    let sF = list.findIndex((item) => item === '-f');
    SpHiPerf.stringResult = {
      existA: sA !== -1,
      existF: sF !== -1,
      fValue: Number((1000 / (sF !== -1 ? parseInt(list[sF + 1]) : 1000)).toFixed(2)),
    };
  }

  async initCmdLine(): Promise<void> {
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

  async initFolder(): Promise<void> {
    let row = TraceRow.skeleton();
    row.rowId = 'HiPerf';
    row.index = 0;
    row.rowType = TraceRow.ROW_TYPE_HIPERF;
    row.rowParentId = '';
    row.folder = true;
    row.drawType = -2;
    row.addRowSettingPop();
    row.rowSetting = 'enable';
    row.rowSettingPopoverDirection = 'bottomLeft';
    row.style.height = '40px';
    this.folderRowSettingConfig(row);
    if (SpHiPerf.stringResult?.existA === true) {
      row.name = 'HiPerf (All)';
    } else {
      //@ts-ignore
      let names = Reflect.ownKeys(this.group)
        .map((pid: unknown) => {
          //@ts-ignore
          let array = this.group[pid] as Array<PerfThread>;
          let process = array.filter((th) => th.pid === th.tid)[0];
          return process.processName;
        })
        .join(',');
      row.name = `HiPerf (${names})`;
    } //@ts-ignore
    row.supplier = (): Promise<Array<unknown>> => new Promise<Array<unknown>>((resolve) => resolve([]));
    row.onThreadHandler = folderThreadHandler(row, this.trace);
    this.rowFolder = row;
    this.trace.rowsEL?.appendChild(row);
  }

  //@ts-ignore
  folderRowSettingConfig(row: TraceRow<unknown>): void {
    row.rowSettingList = [
      {
        key: '-2',
        title: 'Cpu Usage',
        checked: true,
      },
      ...this.eventTypeList.map((et) => {
        return {
          key: `${et.id}`,
          title: et.report,
        };
      }),
    ];
    row.onRowSettingChangeHandler = (value): void => {
      let drawType = parseInt(value[0]);
      if (this.eventTypeId !== drawType) {
        this.eventTypeId = drawType;
        SpHiPerf.hiperfEvent = drawType;
        row.drawType = drawType;
        row.childrenList.forEach((child): void => {
          if (child.drawType !== drawType) {
            child.drawType = drawType;
            child.needRefresh = true;
            child.isComplete = false;
            child.childrenList.forEach((sz) => {
              sz.drawType = drawType;
              sz.isComplete = false;
              sz.needRefresh = true;
            });
          }
        });
        TraceRow.range!.refresh = true;
        this.trace.refreshCanvas(false);
      }
    };
  }

  async initCallChart(): Promise<void> {
    await hiperfCallStackCacheSender();
    await hiperfCallChartDataCacheSender();
    let perfCallCutRow = TraceRow.skeleton<HiPerfCallChartStruct>();
    perfCallCutRow.rowId = 'HiPerf-callchart';
    perfCallCutRow.index = 0;
    perfCallCutRow.rowType = TraceRow.ROW_TYPE_PERF_CALLCHART;
    perfCallCutRow.enableCollapseChart(FOLD_HEIGHT, this.trace);
    perfCallCutRow.rowParentId = 'HiPerf';
    perfCallCutRow.rowHidden = !this.rowFolder.expansion;
    perfCallCutRow.folder = false;
    perfCallCutRow.drawType = -2;
    perfCallCutRow.name = 'CallChart [cpu0]';
    perfCallCutRow.funcExpand = false;
    perfCallCutRow.setAttribute('children', '');
    perfCallCutRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    perfCallCutRow.selectChangeHandler = this.trace.selectChangeHandler;
    this.rowFolder.addChildTraceRow(perfCallCutRow);
    perfCallCutRow.focusHandler = (): void => {
      this.callChartRowFocusHandler(perfCallCutRow);
    };
    // @ts-ignore
    perfCallCutRow.supplierFrame = async (): Promise<unknown> => {
      const res = await hiperfCallChartDataSender(perfCallCutRow, {
        startTime: window.recordStartNS,
        eventTypeId: this.eventTypeId,
        type: this.callChartType,
        id: this.callChartId,
      });
      // @ts-ignore
      let maxHeight = res.maxDepth * FOLD_HEIGHT;
      perfCallCutRow.funcMaxHeight = maxHeight;
      if (perfCallCutRow.funcExpand) {
        perfCallCutRow!.style.height = `${maxHeight}px`;
        if (perfCallCutRow.collect) {
          window.publish(window.SmartEvent.UI.RowHeightChange, {
            expand: true,
            value: perfCallCutRow.funcMaxHeight - FOLD_HEIGHT,
          });
        }
      }
      // @ts-ignore
      return res.dataList;
    };
    perfCallCutRow.findHoverStruct = (): void => {
      HiPerfCallChartStruct.hoverPerfCallCutStruct = perfCallCutRow.getHoverStruct();
    };
    await this.setCallTotalRow(perfCallCutRow, this.cpuData, this.perfThreads);
  }

  callChartRowFocusHandler(perfCallCutRow: TraceRow<HiPerfCallChartStruct>): void {
    let hoverStruct = HiPerfCallChartStruct.hoverPerfCallCutStruct;
    if (hoverStruct) {
      let callName = hoverStruct.name;
      callName = callName.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      this.trace?.displayTip(
        perfCallCutRow!,
        hoverStruct,
        `<span style="font-weight: bold;color:'#000'">Name: </span>
        <span>${callName}</span><br>
        <span style='font-weight: bold;'>Lib: </span>
        <span>${perfDataQuery.getLibName(hoverStruct!.fileId, hoverStruct!.symbolId)}</span><br>
        <span style='font-weight: bold;'>Self Time: </span>
        <span>${Utils.getProbablyTime(hoverStruct.selfDur || 0)}</span><br>
        <span style='font-weight: bold;'>Duration: </span>
        <span>${Utils.getProbablyTime(hoverStruct.totalTime)}</span><br>
        <span style='font-weight: bold;'>Event Count: </span>
        <span>${hoverStruct.eventCount || ''}</span><br>`
      );
    }
  }

  //@ts-ignore
  async setCallTotalRow(row: TraceRow<unknown>, cpuData: unknown = Array, threadData: unknown = Array): Promise<void> {
    //@ts-ignore
    let pt: Map<string, unknown> = threadData.reduce((map: Map<string, unknown>, current: unknown) => {
      //@ts-ignore
      const key = `${current.processName || 'Process'}(${current.pid})`;
      const thread = {
        //@ts-ignore
        key: `${current.tid}-t`, //@ts-ignore
        title: `${current.threadName || 'Thread'}(${current.tid})`,
      };
      if (map.has(key)) {
        //@ts-ignore
        if (map.get(key).children) {
          //@ts-ignore
          map.get(key).children.push(thread);
        } else {
          //@ts-ignore
          map.get(key).children = [thread];
        }
      } else {
        map.set(key, {
          //@ts-ignore
          key: `${current.pid}-p`,
          title: key,
          children: [thread],
          disable: true,
        });
      }
      return map;
    }, new Map<string, unknown>());
    row.addTemplateTypes('hiperf-callchart');
    row.addRowSettingPop();
    row.rowSetting = 'enable'; //@ts-ignore
    this.setCallChartRowSetting(row, cpuData, pt);
    row.onThreadHandler = rowThreadHandler<HiPerfCallChartRender>(
      'HiPerf-callchart',
      'context',
      {
        type: 'HiPerf-callchart',
      },
      row,
      this.trace
    );
  }

  setCallChartRowSetting(
    row: TraceRow<HiPerfCallChartStruct>,
    cpuData: Array<unknown>,
    pt: Map<string, unknown>
  ): void {
    //@ts-ignore
    row.rowSettingList = [
      ...cpuData.reverse().map(
        (
          it: unknown
        ): {
          key: string;
          title: string;
          checked?: boolean;
        } => {
          return {
            //@ts-ignore
            key: `${it.cpu_id}-c`,
            //@ts-ignore
            checked: it.cpu_id === 0,
            //@ts-ignore
            title: `cpu${it.cpu_id}`,
          };
        }
      ),
      ...Array.from(pt.values()),
    ];
    row.onRowSettingChangeHandler = (setting: unknown, nodes): void => {
      //@ts-ignore
      if (setting && setting.length > 0) {
        //type 0:cpu,1:process,2:thread
        //@ts-ignore
        let key: string = setting[0];
        let type = this.callChartType;
        if (key.includes('p')) {
          type = 1;
        } else if (key.includes('t')) {
          type = 2;
        } else {
          type = 0;
        }
        let id = Number(key.split('-')[0]);
        if (this.callChartType === type && this.callChartId === id) {
          return;
        }
        this.callChartType = type;
        this.callChartId = id; // @ts-ignore
        row.name = `CallChart [${nodes[0].title}]`;
        row.isComplete = false;
        row.needRefresh = true;
        row.drawFrame();
      }
    };
  }

  async initCpuMerge(): Promise<void> {
    let cpuMergeRow = TraceRow.skeleton<HiPerfCpuStruct>();
    cpuMergeRow.rowId = 'HiPerf-cpu-merge';
    cpuMergeRow.index = 0;
    cpuMergeRow.rowType = TraceRow.ROW_TYPE_HIPERF_CPU;
    cpuMergeRow.rowParentId = 'HiPerf';
    cpuMergeRow.rowHidden = !this.rowFolder.expansion;
    cpuMergeRow.folder = false;
    cpuMergeRow.drawType = -2;
    cpuMergeRow.name = 'HiPerf';
    cpuMergeRow.style.height = '40px';
    cpuMergeRow.setAttribute('children', '');
    cpuMergeRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    cpuMergeRow.selectChangeHandler = this.trace.selectChangeHandler; //@ts-ignore
    cpuMergeRow.supplierFrame = (): Promise<unknown> => {
      return hiperfCpuDataSender(
        -1,
        cpuMergeRow.drawType,
        this.maxCpuId + 1,
        SpHiPerf.stringResult?.fValue || 1,
        TraceRow.range?.scale || 50,
        cpuMergeRow
      );
    };
    cpuMergeRow.focusHandler = (): void => this.hoverTip(cpuMergeRow, HiPerfCpuStruct.hoverStruct);
    cpuMergeRow.findHoverStruct = (): void => {
      HiPerfCpuStruct.hoverStruct = cpuMergeRow.getHoverStruct(false, (TraceRow.range?.scale || 50) <= 30_000_000);
    };
    cpuMergeRow.onThreadHandler = this.rowThreadHandler<HiperfCpuRender2>(
      'HiPerf-Cpu-2',
      'context',
      {
        type: 'HiPerf-Cpu-Merge',
        maxCpu: this.maxCpuId + 1,
        intervalPerf: SpHiPerf.stringResult?.fValue || 1,
      },
      cpuMergeRow,
      this.trace
    );
    this.rowFolder.addChildTraceRow(cpuMergeRow);
    this.rowList?.push(cpuMergeRow);
  }

  //@ts-ignore
  rowThreadHandler<T>(tag: string, contextField: string, arg: unknown, row: TraceRow<unknown>, trace: SpSystemTrace) {
    return (useCache: boolean): void => {
      let context: CanvasRenderingContext2D = getRowContext(row, trace);
      row.canvasSave(context); //@ts-ignore
      arg.useCache = useCache; //@ts-ignore
      arg.scale = TraceRow.range?.scale || 50; //@ts-ignore
      arg.range = TraceRow.range;
      if (contextField) {
        //@ts-ignore
        arg[contextField] = context;
      } //@ts-ignore
      (renders[tag] as unknown).renderMainThread(arg, row);
      row.canvasRestore(context, trace);
    };
  }

  async initCpu(): Promise<void> {
    for (let i = 0; i <= this.maxCpuId; i++) {
      let perfCpuRow = TraceRow.skeleton<HiPerfCpuStruct>();
      perfCpuRow.rowId = `HiPerf-cpu-${i}`;
      perfCpuRow.index = i;
      perfCpuRow.rowType = TraceRow.ROW_TYPE_HIPERF_CPU;
      perfCpuRow.rowParentId = 'HiPerf';
      perfCpuRow.rowHidden = !this.rowFolder.expansion;
      perfCpuRow.folder = false;
      perfCpuRow.drawType = -2;
      perfCpuRow.name = `Cpu ${i}`;
      perfCpuRow.setAttribute('children', '');
      perfCpuRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
      perfCpuRow.selectChangeHandler = this.trace.selectChangeHandler;
      perfCpuRow.style.height = '40px'; //@ts-ignore
      perfCpuRow.supplierFrame = (): Promise<unknown> => {
        return hiperfCpuDataSender(
          i,
          perfCpuRow.drawType,
          this.maxCpuId + 1,
          SpHiPerf.stringResult?.fValue || 1,
          TraceRow.range?.scale || 50,
          perfCpuRow
        );
      };
      perfCpuRow.focusHandler = (): void => this.hoverTip(perfCpuRow, HiPerfCpuStruct.hoverStruct);
      perfCpuRow.findHoverStruct = (): void => {
        HiPerfCpuStruct.hoverStruct = perfCpuRow.getHoverStruct(false, (TraceRow.range?.scale || 50) <= 30_000_000);
      };
      perfCpuRow.onThreadHandler = this.rowThreadHandler<HiperfCpuRender2>(
        'HiPerf-Cpu-2',
        'context',
        {
          type: `HiPerf-Cpu-${i}`,
          maxCpu: this.maxCpuId + 1,
          intervalPerf: SpHiPerf.stringResult?.fValue || 1,
        },
        perfCpuRow,
        this.trace
      );
      this.rowFolder.addChildTraceRow(perfCpuRow);
      this.rowList?.push(perfCpuRow);
    }
  }

  async initProcess(): Promise<void> {
    //@ts-ignore
    Reflect.ownKeys(this.group).forEach((key, index): void => {
      //@ts-ignore
      let array = this.group[key] as Array<PerfThread>;
      let process = array.filter((th): boolean => th.pid === th.tid)[0];
      let row = TraceRow.skeleton<HiPerfProcessStruct>();
      row.rowId = `${process ? process.pid : Number(key)}-Perf-Process`;
      row.index = index;
      row.rowType = TraceRow.ROW_TYPE_HIPERF_PROCESS;
      row.rowParentId = 'HiPerf';
      row.rowHidden = !this.rowFolder.expansion;
      row.folder = true;
      row.drawType = -2;
      if (SpChartManager.APP_STARTUP_PID_ARR.find((pid) => pid === process.pid) !== undefined) {
        row.addTemplateTypes('AppStartup');
      }
      row.addTemplateTypes('HiPerf');
      row.name = `${process ? process.processName : 'Process'} [${process ? process.pid : Number(key)}]`;
      row.folderPaddingLeft = 6;
      row.style.height = '40px';
      row.favoriteChangeHandler = this.trace.favoriteChangeHandler;
      row.selectChangeHandler = this.trace.selectChangeHandler; //@ts-ignore
      row.supplierFrame = (): Promise<unknown> => {
        return hiperfProcessDataSender(
          process ? process.pid : Number(key),
          row.drawType,
          this.maxCpuId + 1,
          SpHiPerf.stringResult?.fValue || 1,
          TraceRow.range?.scale || 50,
          row
        );
      };
      row.focusHandler = (): void => this.hoverTip(row, HiPerfProcessStruct.hoverStruct);
      row.findHoverStruct = (): void => {
        HiPerfProcessStruct.hoverStruct = row.getHoverStruct(false, (TraceRow.range?.scale || 50) <= 30_000_000);
      };
      row.onThreadHandler = this.rowThreadHandler<HiperfProcessRender2>(
        'HiPerf-Process-2',
        'context',
        {
          type: `HiPerf-Process-${row.index}`,
          intervalPerf: SpHiPerf.stringResult?.fValue || 1,
        },
        row,
        this.trace
      );
      this.rowFolder.addChildTraceRow(row);
      this.rowList?.push(row);
      this.addHiPerfThreadRow(array, row);
    });
  }

  addHiPerfThreadRow(array: PerfThread[], row: TraceRow<HiPerfProcessStruct>): void {
    array.forEach((thObj, thIdx): void => {
      let thread = TraceRow.skeleton<HiPerfThreadStruct>();
      thread.rowId = `${thObj.tid}-Perf-Thread`;
      thread.index = thIdx;
      thread.rowType = TraceRow.ROW_TYPE_HIPERF_THREAD;
      thread.rowParentId = row.rowId;
      thread.rowHidden = !row.expansion;
      thread.folder = false;
      thread.drawType = -2;
      thread.name = `${thObj.threadName || 'Thread'} [${thObj.tid}]`;
      thread.setAttribute('children', '');
      thread.folderPaddingLeft = 0;
      thread.style.height = '40px';
      thread.favoriteChangeHandler = this.trace.favoriteChangeHandler;
      thread.selectChangeHandler = this.trace.selectChangeHandler; //@ts-ignore
      thread.supplierFrame = (): Promise<unknown> => {
        return hiperfThreadDataSender(
          thObj.tid,
          thread.drawType,
          this.maxCpuId + 1,
          SpHiPerf.stringResult?.fValue || 1,
          TraceRow.range?.scale || 50,
          thread
        );
      };
      thread.focusHandler = (): void => this.hoverTip(thread, HiPerfThreadStruct.hoverStruct);
      thread.findHoverStruct = (): void => {
        HiPerfThreadStruct.hoverStruct = thread.getHoverStruct(false, (TraceRow.range?.scale || 50) <= 30_000_000);
      };
      thread.onThreadHandler = this.rowThreadHandler<HiperfThreadRender2>(
        'HiPerf-Thread-2',
        'context',
        {
          type: `HiPerf-Thread-${row.index}-${thread.index}`,
          intervalPerf: SpHiPerf.stringResult?.fValue || 1,
        },
        thread,
        this.trace
      );
      row.addChildTraceRow(thread);
      this.rowList?.push(thread);
    });
  }

  //@ts-ignore
  resetChartData(row: TraceRow<unknown>): void {
    row.dataList = [];
    row.dataList2 = [];
    row.dataListCache = [];
    row.isComplete = false;
  }

  resetAllChartData(): void {
    const callChartRow = this.rowList?.find(row => row.rowId === 'HiPerf-callchart');
    if (callChartRow) {
      this.resetChartData(callChartRow);
    }
  }

  hoverTip(
    //@ts-ignore
    row: TraceRow<unknown>,
    struct:
      | HiPerfThreadStruct
      | HiPerfProcessStruct
      | HiPerfEventStruct
      | HiPerfReportStruct
      | HiPerfCpuStruct
      | undefined
  ): void {
    let tip = '';
    let groupBy10MS = (TraceRow.range?.scale || 50) > 30_000_000;
    if (struct) {
      if (groupBy10MS) {
        if (row.drawType === -2) {
          let num: number | string = 0;
          if (struct instanceof HiPerfEventStruct) {
            num = Math.trunc(((struct.sum || 0) / (struct.max || 0)) * 100);
          } else {
            let interval = SpHiPerf.stringResult?.fValue || 1;
            num = ((struct.sampleCount! / (10 / interval)) * 100).toFixed(2);
          }
          tip = `<span>${num}% (10.00ms)</span>`;
        } else {
          tip = `<span>${struct.event_count || struct.eventCount} (10.00ms)</span>`;
        }
      } else {
        let perfCall = perfDataQuery.callChainMap.get(struct.callchain_id || 0);
        if (perfCall) {
          let perfName;
          typeof perfCall.name === 'number'
            ? (perfName = SpSystemTrace.DATA_DICT.get(parseInt(perfCall.name)))
            : (perfName = perfCall.name);
          tip = `<span>${perfCall ? perfName : ''} (${perfCall ? perfCall.depth : '0'} other frames)</span>`;
        }
      }
    }
    this.trace?.displayTip(row, struct, tip);
  }
}
