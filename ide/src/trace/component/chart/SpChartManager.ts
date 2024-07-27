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
import { SpHiPerf } from './SpHiPerf';
import { SpCpuChart } from './SpCpuChart';
import { SpFreqChart } from './SpFreqChart';
import { SpFpsChart } from './SpFpsChart';
import { info } from '../../../log/Log';
import { SpNativeMemoryChart } from './SpNativeMemoryChart';
import { SpAbilityMonitorChart } from './SpAbilityMonitorChart';
import { SpProcessChart } from './SpProcessChart';
import { perfDataQuery } from './PerfDataQuery';
import { SpVirtualMemChart } from './SpVirtualMemChart';
import { SpEBPFChart } from './SpEBPFChart';
import { SpSdkChart } from './SpSdkChart';
import { SpHiSysEnergyChart } from './SpHiSysEnergyChart';
import { VmTrackerChart } from './SpVmTrackerChart';
import { SpClockChart } from './SpClockChart';
import { SpIrqChart } from './SpIrqChart';
import { renders } from '../../database/ui-worker/ProcedureWorker';
import { EmptyRender } from '../../database/ui-worker/cpu/ProcedureWorkerCPU';
import { TraceRow } from '../trace/base/TraceRow';
import { SpFrameTimeChart } from './SpFrameTimeChart';
import { Utils } from '../trace/base/Utils';
import { SpArkTsChart } from './SpArkTsChart';
import { MemoryConfig } from '../../bean/MemoryConfig';
import { FlagsConfig } from '../SpFlags';
import { SpLogChart } from './SpLogChart';
import { SpHiSysEventChart } from './SpHiSysEventChart';
import { SpAllAppStartupsChart } from './SpAllAppStartups';
import { procedurePool } from '../../database/Procedure';
import { SpSegmentationChart } from './SpSegmentationChart';
import { SpPerfOutputDataChart } from './SpPerfOutputDataChart';
import {
  queryAppStartupProcessIds,
  queryDataDICT,
  queryThreadAndProcessName,
} from '../../database/sql/ProcessThread.sql';
import { queryTaskPoolCallStack, queryTotalTime } from '../../database/sql/SqlLite.sql';
import { queryMemoryConfig } from '../../database/sql/Memory.sql';
import { SpLtpoChart } from './SpLTPO';
import { SpBpftraceChart } from './SpBpftraceChart';
import { sliceSender } from '../../database/data-trafic/SliceSender';
import { BaseStruct } from '../../bean/BaseStruct';
import { SpGpuCounterChart } from './SpGpuCounterChart';
import { SpUserFileChart } from './SpUserPluginChart'
import { queryDmaFenceIdAndCat } from '../../database/sql/dmaFence.sql';
import { queryAllFuncNames } from '../../database/sql/Func.sql';

export class SpChartManager {
  static APP_STARTUP_PID_ARR: Array<number> = [];

  private trace: SpSystemTrace;
  public perf: SpHiPerf;
  private cpu: SpCpuChart;
  private freq: SpFreqChart;
  private virtualMemChart: SpVirtualMemChart;
  private fps: SpFpsChart;
  private nativeMemory: SpNativeMemoryChart;
  private abilityMonitor: SpAbilityMonitorChart;
  private process: SpProcessChart;
  private process2?: SpProcessChart;
  private fileSystem: SpEBPFChart;
  private sdkChart: SpSdkChart;
  private hiSyseventChart: SpHiSysEnergyChart;
  private smapsChart: VmTrackerChart;
  private clockChart: SpClockChart;
  private irqChart: SpIrqChart;
  private spAllAppStartupsChart!: SpAllAppStartupsChart;
  private SpLtpoChart!: SpLtpoChart;
  frameTimeChart: SpFrameTimeChart;
  public arkTsChart: SpArkTsChart;
  private logChart: SpLogChart;
  private spHiSysEvent: SpHiSysEventChart;
  private spSegmentationChart: SpSegmentationChart;
  private spBpftraceChart: SpBpftraceChart;
  private spPerfOutputDataChart: SpPerfOutputDataChart;
  private spGpuCounterChart: SpGpuCounterChart;
  private spUserFileChart: SpUserFileChart;

  constructor(trace: SpSystemTrace) {
    this.trace = trace;
    this.perf = new SpHiPerf(trace);
    this.fileSystem = new SpEBPFChart(trace);
    this.cpu = new SpCpuChart(trace);
    this.freq = new SpFreqChart(trace);
    this.virtualMemChart = new SpVirtualMemChart(trace);
    this.fps = new SpFpsChart(trace);
    this.nativeMemory = new SpNativeMemoryChart(trace);
    this.abilityMonitor = new SpAbilityMonitorChart(trace);
    this.process = new SpProcessChart(trace);
    this.sdkChart = new SpSdkChart(trace);
    this.hiSyseventChart = new SpHiSysEnergyChart(trace);
    this.smapsChart = new VmTrackerChart(trace);
    this.clockChart = new SpClockChart(trace);
    this.irqChart = new SpIrqChart(trace);
    this.frameTimeChart = new SpFrameTimeChart(trace);
    this.arkTsChart = new SpArkTsChart(trace);
    this.logChart = new SpLogChart(trace);
    this.spHiSysEvent = new SpHiSysEventChart(trace);
    this.spAllAppStartupsChart = new SpAllAppStartupsChart(trace);
    this.SpLtpoChart = new SpLtpoChart(trace);
    this.spSegmentationChart = new SpSegmentationChart(trace);
    this.spBpftraceChart = new SpBpftraceChart(trace);
    this.spPerfOutputDataChart = new SpPerfOutputDataChart(trace);
    this.spGpuCounterChart = new SpGpuCounterChart(trace);
    this.spUserFileChart = new SpUserFileChart(trace)
  }
  async initPreprocessData(progress: Function): Promise<void> {
    progress('load data dict', 50);
    this.process2 = undefined;
    SpSystemTrace.DATA_DICT.clear();
    SpChartManager.APP_STARTUP_PID_ARR = [];
    let dict = await queryDataDICT();
    if (FlagsConfig.getFlagsConfigEnableStatus('AppStartup')) {
      let appStartUpPids = await queryAppStartupProcessIds();
      appStartUpPids.forEach((it) => SpChartManager.APP_STARTUP_PID_ARR.push(it.pid));
    }
    await this.initTraceConfig(); //@ts-ignore
    dict.map((d) => SpSystemTrace.DATA_DICT.set(d.id, d.data));
    await this.cacheDataDictToWorker();
    SpSystemTrace.DATA_TASK_POOL_CALLSTACK.clear();
    let taskPoolCallStack = await queryTaskPoolCallStack();
    taskPoolCallStack.map((d) => SpSystemTrace.DATA_TASK_POOL_CALLSTACK.set(d.id, d));
    progress('time range', 65);
    await this.initTotalTime();
    let ptArr = await queryThreadAndProcessName(); //@ts-ignore
    this.handleProcessThread(ptArr);
    info('initData timerShaftEL Data initialized');
    let funArr = await queryAllFuncNames();
    this.handleFuncName(funArr);
  }

  async initCpu(progress: Function): Promise<void> {
    progress('cpu', 70);
    let result = await sliceSender();
    // @ts-ignore
    SpProcessChart.threadStateList = result.threadMap;
    // @ts-ignore
    SpProcessChart.processRowSortMap = result.processRowSortMap;
    //@ts-ignore
    await this.cpu.init(result.count.cpu);
    info('initData cpu Data initialized');
    if (FlagsConfig.getFlagsConfigEnableStatus('Bpftrace')) {
      await this.spBpftraceChart.init(null);
    }
    if (FlagsConfig.getFlagsConfigEnableStatus('UserPluginsRow')) {
      await this.spUserFileChart.init(null)
    }
    if (FlagsConfig.getFlagsConfigEnableStatus('GpuCounter')) {
      await this.spGpuCounterChart.init([]);
    }
    if (FlagsConfig.getFlagsConfigEnableStatus('SchedulingAnalysis')) {
      await this.cpu.initCpuIdle0Data(progress);
      await this.cpu.initSchedulingPTData(progress);
      await this.cpu.initSchedulingFreqData(progress);
    }
    info('initData ProcessThreadState Data initialized');
    progress('cpu rate', 75);
    //@ts-ignore
    await this.initCpuRate(result.cpuUtiliRateArray);
    info('initData Cpu Rate Data initialized');
    progress('cpu freq', 80);
    await this.freq.init();
    info('initData Cpu Freq Data initialized');
  }

  async init(progress: Function): Promise<void> {
    info('initData data parse end ');
    await this.initPreprocessData(progress);
    await this.initCpu(progress);
    await this.logChart.init();
    await this.spHiSysEvent.init();
    let idAndNameArr = await queryDmaFenceIdAndCat();
    this.handleDmaFenceName(idAndNameArr as { id: number; cat: string; seqno: number; driver: string; context: string }[]);
    progress('Clock init', 82);
    await this.clockChart.init();
    progress('Irq init', 84);
    await this.irqChart.init();
    progress('SpSegmentationChart inin', 84.5);
    await this.spSegmentationChart.init();
    await this.virtualMemChart.init();
    progress('fps', 85);
    await this.fps.init();
    progress('native memory', 87);
    await this.nativeMemory.initChart();
    progress('ability monitor', 88);
    await this.abilityMonitor.init();
    progress('hiSysevent', 88.2);
    await this.hiSyseventChart.init();
    progress('vm tracker', 88.4);
    await this.smapsChart.init();
    progress('sdk', 88.6);
    await this.sdkChart.init();
    progress('perf', 88.8);
    await this.perf!.init();
    await perfDataQuery.initPerfCache();
    progress('file system', 89);
    await this.fileSystem!.init();
    progress('ark ts', 90);
    await this.arkTsChart.initFolder();
    await this.spAllAppStartupsChart.init();
    await this.SpLtpoChart.init();
    await this.frameTimeChart.init();
    await this.spPerfOutputDataChart.init();
    progress('process', 92);
    this.process.clearCache();
    this.process2?.clearCache();
    this.process2 = undefined;
    await this.process.initAsyncFuncData({
      startTs: Utils.getInstance().getRecordStartNS(),
      endTs: Utils.getInstance().getRecordEndNS(),
    });
    await this.process.initDeliverInputEvent();
    await this.process.initTouchEventDispatch();
    await this.process.init(false);
    progress('display', 95);
  }

  async initDistributedChart(progress: Function, file1: string, file2: string): Promise<void> {
    let funArr1 = await queryAllFuncNames('1');
    let funArr2 = await queryAllFuncNames('2');
    this.handleFuncName(funArr1, '1');
    this.handleFuncName(funArr2, '2');
    progress('load data dict', 50);
    SpSystemTrace.DATA_DICT.clear();
    SpChartManager.APP_STARTUP_PID_ARR = [];
    SpSystemTrace.DATA_TASK_POOL_CALLSTACK.clear();
    this.process.clearCache();
    this.process2?.clearCache();
    let trace1Folder = this.createFolderRow('trace-1', 'trace-1', file1);
    let trace2Folder = this.createFolderRow('trace-2', 'trace-2', file2);
    this.trace.rowsEL!.appendChild(trace1Folder);
    this.trace.rowsEL!.appendChild(trace2Folder);
    await this.initTotalTime(true);
    await this.initDistributedTraceRow('1', trace1Folder, progress);
    info(`trace 1 load completed`);
    await this.initDistributedTraceRow('2', trace2Folder, progress);
    info(`trace 2 load completed`);
  }

  // @ts-ignore
  async initDistributedTraceRow(traceId: string, traceFolder: TraceRow<unknown>, progress: Function): Promise<void> {
    let ptArr = await queryThreadAndProcessName(traceId);
    // @ts-ignore
    this.handleProcessThread(ptArr, traceId);
    info(`initData trace ${traceId} timerShaftEL Data initialized`);
    progress(`trace ${traceId} cpu`, 70);
    let count = await sliceSender(traceId);
    // @ts-ignore
    await this.cpu.init(count.cpu, traceFolder, traceId);
    info(`initData trace ${traceId} cpu Data initialized`);
    progress(`trace ${traceId} cpu freq`, 75);
    // @ts-ignore
    await this.freq.init(traceFolder, traceId);
    info(`initData trace ${traceId} cpu freq Data initialized`);
    progress(`trace ${traceId} clock`, 80);
    // @ts-ignore
    await this.clockChart.init(traceFolder, traceId);
    info(`initData trace ${traceId} clock Data initialized`);
    progress(`trace ${traceId} Irq`, 85);
    // @ts-ignore
    await this.irqChart.init(traceFolder, traceId);
    info(`initData trace ${traceId} irq Data initialized`);
    progress(`trace ${traceId} process`, 92);
    if (traceId === '2') {
      if (!this.process2) {
        this.process2 = new SpProcessChart(this.trace);
      }
      await this.process2.initAsyncFuncData(
        {
          startTs: Utils.getInstance().getRecordStartNS('2'),
          endTs: Utils.getInstance().getRecordEndNS('2'),
        },
        traceId
      );
      await this.process2.init(true, traceFolder, traceId);
    } else {
      await this.process.initAsyncFuncData(
        {
          startTs: Utils.getInstance().getRecordStartNS('1'),
          endTs: Utils.getInstance().getRecordEndNS('1'),
        },
        traceId
      );
      await this.process.init(true, traceFolder, traceId);
    }
  }

  async initSample(ev: File) {
    await this.initSampleTime(ev, 'bpftrace');
    await this.spBpftraceChart.init(ev);
  }

  async initGpuCounter(ev: File): Promise<void> {
    const res = await this.initSampleTime(ev, 'gpucounter');
    //@ts-ignore
    await this.spGpuCounterChart.init(res);
  }

  async importSoFileUpdate(): Promise<void> {
    SpSystemTrace.DATA_DICT.clear();
    let dict = await queryDataDICT(); //@ts-ignore
    dict.map((d) => SpSystemTrace.DATA_DICT.set(d.id, d.data));
    await this.cacheDataDictToWorker();
    await perfDataQuery.initPerfCache();
    await this.nativeMemory.initNativeMemory();
    await this.fileSystem.initFileCallchain();
    this.perf.resetAllChartData();
  }

  handleProcessThread(arr: { id: number; name: string; type: string }[], traceId?: string): void {
    Utils.getInstance().getProcessMap(traceId).clear();
    Utils.getInstance().getThreadMap(traceId).clear();
    for (let pt of arr) {
      if (pt.type === 'p') {
        Utils.getInstance().getProcessMap(traceId).set(pt.id, pt.name);
      } else {
        Utils.getInstance().getThreadMap(traceId).set(pt.id, pt.name);
      }
    }
  }

  // 将callstatck表信息转为map存入utils
  handleFuncName(funcNameArray: Array<unknown>, traceId?: string): void {
    if (traceId) {
      funcNameArray.forEach((it) => {
        //@ts-ignore
        Utils.getInstance().getCallStatckMap().set(`${traceId}_${it.id!}`, it.name);
      });
    } else {
      funcNameArray.forEach((it) => {
        //@ts-ignore
        Utils.getInstance().getCallStatckMap().set(it.id, it.name);
      });
    }
  }

  initTotalTime = async (isDistributed: boolean = false): Promise<void> => {
    let res1 = await queryTotalTime('1');
    let total = res1[0].total;
    Utils.getInstance().trace1RecordStartNS = res1[0].recordStartNS;
    Utils.getInstance().trace1RecordEndNS = Math.max(res1[0].recordEndNS, res1[0].recordStartNS + 1);
    if (isDistributed) {
      let res2 = await queryTotalTime('2');
      total = Math.max(total, res2[0].total);
      Utils.getInstance().trace2RecordStartNS = res2[0].recordStartNS;
      Utils.getInstance().trace2RecordEndNS = Math.max(res2[0].recordEndNS, res2[0].recordStartNS + 1);
    }
    if (this.trace.timerShaftEL) {
      if (total === 0) {
        total = 1;
      }
      Utils.getInstance().totalNS = total;
      this.trace.timerShaftEL.totalNS = total;
      this.trace.timerShaftEL.getRangeRuler()!.drawMark = true;
      this.trace.timerShaftEL.setRangeNS(0, total);
      window.recordStartNS = Utils.getInstance().trace1RecordStartNS;
      window.recordEndNS = Utils.getInstance().trace1RecordEndNS;
      window.totalNS = total;
      this.trace.timerShaftEL.loadComplete = true;
    }
  };

  initSampleTime = async (ev: File, type: string): Promise<unknown> => {
    let res;
    let endNS = 30_000_000_000;
    if (type === 'gpucounter') {
      res = await this.spGpuCounterChart.getCsvData(ev);
      // @ts-ignore
      const endTime = Number(res[res.length - 1].split(',')[0]);
      // @ts-ignore
      const minIndex = this.spGpuCounterChart.getMinData(res) + 1;
      // @ts-ignore
      const startTime = Number(res[minIndex].split(',')[0]);
      endNS = Number((endTime - startTime).toString().slice(0, 11));
    }
    if (this.trace.timerShaftEL) {
      let total = endNS;
      let startNS = 0;
      this.trace.timerShaftEL.totalNS = total;
      this.trace.timerShaftEL.getRangeRuler()!.drawMark = true;
      this.trace.timerShaftEL.setRangeNS(0, total); // @ts-ignore
      (window as unknown).recordStartNS = startNS; // @ts-ignore
      (window as unknown).recordEndNS = endNS; // @ts-ignore
      (window as unknown).totalNS = total;
      this.trace.timerShaftEL.loadComplete = true;
    }
    return res;
  };

  initCpuRate = async (rates: Array<{ cpu: number; ro: number; rate: number; }>): Promise<void> => {
    if (this.trace.timerShaftEL) {
      this.trace.timerShaftEL.cpuUsage = rates;
    }
    info('Cpu UtilizationRate data size is: ', rates.length);
  };

  initTraceConfig = async (): Promise<void> => {
    queryMemoryConfig().then((result) => {
      if (result && result.length > 0) {
        const config = result[0];
        MemoryConfig.getInstance().updateConfig(config.pid, config.iPid, config.processName, config.interval);
      }
    });
  };

  async cacheDataDictToWorker(): Promise<void> {
    return new Promise((resolve) => {
      procedurePool.submitWithName(
        'logic0',
        'cache-data-dict',
        { dataDict: SpSystemTrace.DATA_DICT },
        undefined,
        (res: unknown): void => {
          resolve();
        }
      );
    });
  }

  // @ts-ignore
  createFolderRow(rowId: string, rowType: string, rowName: string, traceId?: string): TraceRow<unknown> {
    let row = TraceRow.skeleton<BaseStruct>(traceId);
    row.setAttribute('disabled-check', '');
    row.rowId = rowId;
    row.rowType = rowType;
    row.rowParentId = '';
    row.folder = true;
    row.style.height = '40px';
    row.name = rowName;
    // @ts-ignore
    row.supplier = folderSupplier();
    row.onThreadHandler = folderThreadHandler(row, this.trace);
    row.addEventListener('expansion-change', (evt) => {
      if (!row.expansion) {
        this.trace.clickEmptyArea();
      }
    });
    return row;
  }

  //存名字
  handleDmaFenceName<T extends { id: number; cat: string; seqno: number; driver: string; context: string }>(arr: T[]): void {
    Utils.DMAFENCECAT_MAP.clear();
    for (let item of arr) {
      Utils.DMAFENCECAT_MAP.set(item.id, item);
    }
  }
}

export const folderSupplier = (): () => Promise<BaseStruct[]> => {
  return () => new Promise<Array<BaseStruct>>((resolve) => resolve([]));
};

export const folderThreadHandler = (row: TraceRow<BaseStruct>, trace: SpSystemTrace) => {
  return (useCache: boolean): void => {
    row.canvasSave(trace.canvasPanelCtx!);
    if (row.expansion) {
      // @ts-ignore
      trace.canvasPanelCtx?.clearRect(0, 0, row.frame.width, row.frame.height);
    } else {
      (renders.empty as EmptyRender).renderMainThread(
        {
          context: trace.canvasPanelCtx,
          useCache: useCache,
          type: '',
        },
        row
      );
    }
    row.canvasRestore(trace.canvasPanelCtx!, trace);
  };
};

export function rowThreadHandler<T>(
  tag: string,
  contextField: string,
  arg: unknown, // @ts-ignore
  row: TraceRow<unknown>,
  trace: SpSystemTrace
) {
  return (useCache: boolean): void => {
    let context: CanvasRenderingContext2D = getRowContext(row, trace);
    row.canvasSave(context); // @ts-ignore
    arg.useCache = useCache;
    if (contextField) {
      // @ts-ignore
      arg[contextField] = context;
    } // @ts-ignore
    (renders[tag] as unknown).renderMainThread(arg, row);
    row.canvasRestore(context, trace);
  };
}
// @ts-ignore
export const getRowContext = (row: TraceRow<unknown>, trace: SpSystemTrace): CanvasRenderingContext2D => {
  if (row.currentContext) {
    return row.currentContext;
  } else {
    return row.collect ? trace.canvasFavoritePanelCtx! : trace.canvasPanelCtx!;
  }
};
