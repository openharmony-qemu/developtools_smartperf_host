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
import {
  queryAppStartupProcessIds,
  queryDataDICT,
  queryThreadAndProcessName,
} from '../../database/sql/ProcessThread.sql';
import { queryTaskPoolCallStack, queryTotalTime } from '../../database/sql/SqlLite.sql';
import { getCpuUtilizationRate } from '../../database/sql/Cpu.sql';
import { queryMemoryConfig } from '../../database/sql/Memory.sql';
import { SpLtpoChart } from './SpLTPO';
import { SpBpftraceChart } from './SpBpftraceChart';
import { sliceSender } from '../../database/data-trafic/SliceSender';

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
  }
  async initPreprocessData(progress: Function): Promise<void> {
    progress('load data dict', 50);
    SpSystemTrace.DATA_DICT.clear();
    SpChartManager.APP_STARTUP_PID_ARR = [];
    let dict = await queryDataDICT();
    if (FlagsConfig.getFlagsConfigEnableStatus('AppStartup')) {
      let appStartUpPids = await queryAppStartupProcessIds();
      appStartUpPids.forEach((it) => SpChartManager.APP_STARTUP_PID_ARR.push(it.pid));
    }
    await this.initTraceConfig();
    dict.map((d) => SpSystemTrace.DATA_DICT.set(d['id'], d['data']));
    await this.cacheDataDictToWorker();
    SpSystemTrace.DATA_TASK_POOL_CALLSTACK.clear();
    let taskPoolCallStack = await queryTaskPoolCallStack();
    taskPoolCallStack.map((d) => SpSystemTrace.DATA_TASK_POOL_CALLSTACK.set(d.id, d));
    progress('time range', 65);
    await this.initTotalTime();
    let ptArr = await queryThreadAndProcessName();
    this.handleProcessThread(ptArr);
    info('initData timerShaftEL Data initialized');
  }

  async initCpu(progress: Function): Promise<void> {
    progress('cpu', 70);
    let count = await sliceSender();
    await this.cpu.init(count.cpu);
    info('initData cpu Data initialized');
    if (FlagsConfig.getFlagsConfigEnableStatus('Bpftrace')) {
      await this.spBpftraceChart.init(null);
    }
    if (FlagsConfig.getFlagsConfigEnableStatus('SchedulingAnalysis')) {
      await this.cpu.initCpuIdle0Data(progress);
      await this.cpu.initSchedulingPTData(progress);
      await this.cpu.initSchedulingFreqData(progress);
    }
    info('initData ProcessThreadState Data initialized');
    progress('cpu rate', 75);
    await this.initCpuRate();
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
    progress('process', 92);
    await this.process.initAsyncFuncData();
    await this.process.initDeliverInputEvent();
    await this.process.init();
    progress('display', 95);
  }

  async initSample(ev: File): Promise<void> {
    await this.initSampleTime();
    await this.spBpftraceChart.init(ev);
  }

  async importSoFileUpdate(): Promise<void> {
    SpSystemTrace.DATA_DICT.clear();
    let dict = await queryDataDICT();
    dict.map((d) => SpSystemTrace.DATA_DICT.set(d['id'], d['data']));
    await this.cacheDataDictToWorker();
    await perfDataQuery.initPerfCache();
    await this.nativeMemory.initNativeMemory();
    await this.fileSystem.initFileCallchain();
    this.perf.resetAllChartData();
  }

  handleProcessThread(arr: { id: number; name: string; type: string }[]): void {
    Utils.PROCESS_MAP.clear();
    Utils.THREAD_MAP.clear();
    for (let pt of arr) {
      if (pt.type === 'p') {
        Utils.PROCESS_MAP.set(pt.id, pt.name);
      } else {
        Utils.THREAD_MAP.set(pt.id, pt.name);
      }
    }
  }

  initTotalTime = async (): Promise<void> => {
    let res = await queryTotalTime();
    if (this.trace.timerShaftEL) {
      let total = res[0].total;
      let startNS = res[0].recordStartNS;
      let endNS = res[0].recordEndNS;
      if (total === 0 && startNS === endNS) {
        total = 1;
        endNS = startNS + 1;
      }
      this.trace.timerShaftEL.totalNS = total;
      this.trace.timerShaftEL.getRangeRuler()!.drawMark = true;
      this.trace.timerShaftEL.setRangeNS(0, total);
      window.recordStartNS = startNS;
      window.recordEndNS = endNS;
      window.totalNS = total;
      this.trace.timerShaftEL.loadComplete = true;
    }
  };

  initSampleTime = async (): Promise<void> => {
    if (this.trace.timerShaftEL) {
      let total = 30_000_000_000;
      let startNS = 0;
      let endNS = 30_000_000_000;
      this.trace.timerShaftEL.totalNS = total;
      this.trace.timerShaftEL.getRangeRuler()!.drawMark = true;
      this.trace.timerShaftEL.setRangeNS(0, total);
      (window as any).recordStartNS = startNS;
      (window as any).recordEndNS = endNS;
      (window as any).totalNS = total;
      this.trace.timerShaftEL.loadComplete = true;
    }
  };

  initCpuRate = async (): Promise<void> => {
    let rates = await getCpuUtilizationRate(0, this.trace.timerShaftEL?.totalNS || 0);
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
        (res: any): void => {
          resolve();
        }
      );
    });
  }
}

export const folderSupplier = (): any => {
  return () => new Promise<Array<any>>((resolve) => resolve([]));
};
export const folderThreadHandler = (row: TraceRow<any>, trace: SpSystemTrace) => {
  return (useCache: boolean): void => {
    row.canvasSave(trace.canvasPanelCtx!);
    if (row.expansion) {
      trace.canvasPanelCtx?.clearRect(0, 0, row.frame.width, row.frame.height);
    } else {
      (renders['empty'] as EmptyRender).renderMainThread(
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
  arg: any,
  row: TraceRow<any>,
  trace: SpSystemTrace
) {
  return (useCache: boolean) => {
    let context: CanvasRenderingContext2D = getRowContext(row, trace);
    row.canvasSave(context);
    arg.useCache = useCache;
    if (contextField) {
      arg[contextField] = context;
    }
    (renders[tag] as any).renderMainThread(arg, row);
    row.canvasRestore(context, trace);
  };
}

export const getRowContext = (row: TraceRow<any>, trace: SpSystemTrace): CanvasRenderingContext2D => {
  if (row.currentContext) {
    return row.currentContext;
  } else {
    return row.collect ? trace.canvasFavoritePanelCtx! : trace.canvasPanelCtx!;
  }
};
