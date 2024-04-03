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
import { Utils } from '../trace/base/Utils';
import { info } from '../../../log/Log';
import { TraceRow } from '../trace/base/TraceRow';
import { ProcessRender, ProcessStruct } from '../../database/ui-worker/ProcedureWorkerProcess';
import { ThreadRender, ThreadStruct } from '../../database/ui-worker/ProcedureWorkerThread';
import { FuncRender, FuncStruct } from '../../database/ui-worker/ProcedureWorkerFunc';
import { MemRender, ProcessMemStruct } from '../../database/ui-worker/ProcedureWorkerMem';
import { folderSupplier, folderThreadHandler, getRowContext, rowThreadHandler, SpChartManager } from './SpChartManager';
import { JankRender, JankStruct } from '../../database/ui-worker/ProcedureWorkerJank';
import { isFrameContainPoint, ns2xByTimeShaft, PairPoint } from '../../database/ui-worker/ProcedureWorkerCommon';
import { AppStartupRender, AppStartupStruct } from '../../database/ui-worker/ProcedureWorkerAppStartup';
import { SoRender, SoStruct } from '../../database/ui-worker/ProcedureWorkerSoInit';
import { FlagsConfig } from '../SpFlags';
import { processDataSender } from '../../database/data-trafic/process/ProcessDataSender';
import { threadDataSender } from '../../database/data-trafic/process/ThreadDataSender';
import { funcDataSender } from '../../database/data-trafic/process/FuncDataSender';
import { processMemDataSender } from '../../database/data-trafic/process/ProcessMemDataSender';
import { processStartupDataSender } from '../../database/data-trafic/process/ProcessStartupDataSender';
import { processSoInitDataSender } from '../../database/data-trafic/process/ProcessSoInitDataSender';
import { processExpectedDataSender } from '../../database/data-trafic/process/ProcessExpectedDataSender';
import { processActualDataSender } from '../../database/data-trafic/process/ProcessActualDataSender';
import { processDeliverInputEventDataSender } from '../../database/data-trafic/process/ProcessDeliverInputEventDataSender';
import { getMaxDepthByTid, queryAllFuncNames, queryProcessAsyncFunc } from '../../database/sql/Func.sql';
import { queryMemFilterIdMaxValue } from '../../database/sql/Memory.sql';
import { queryAllSoInitNames, queryAllSrcSlices, queryEventCountMap } from '../../database/sql/SqlLite.sql';
import {
  queryProcess,
  queryProcessByTable,
  queryProcessContentCount,
  queryProcessMem,
  queryProcessSoMaxDepth,
  queryProcessThreads,
  queryProcessThreadsByTable,
  queryStartupPidArray,
  queryRsProcess,
  queryTaskPoolProcessIds,
} from '../../database/sql/ProcessThread.sql';
import { queryAllJankProcess } from '../../database/sql/Janks.sql';
import { BaseStruct } from '../../bean/BaseStruct';

export class SpProcessChart {
  private readonly trace: SpSystemTrace;
  private processAsyncFuncMap: any = {};
  private processAsyncFuncArray: any[] = [];
  private eventCountMap: any;
  private processThreads: Array<ThreadStruct> = [];
  private processMem: Array<any> = [];
  private processThreadCountMap: Map<number, number> = new Map();
  private processThreadDataCountMap: Map<number, number> = new Map();
  private processFuncDataCountMap: Map<number, number> = new Map();
  private processMemDataCountMap: Map<number, number> = new Map();
  private threadFuncMaxDepthMap: Map<string, number> = new Map();
  private startupProcessArr: { pid: number }[] = [];
  private processSoMaxDepth: { pid: number; maxDepth: number }[] = [];
  private funcNameMap: Map<number, string> = new Map();
  private filterIdMaxValue: Map<number, number> = new Map();
  private soInitNameMap: Map<number, string> = new Map();
  private processSrcSliceMap: Map<number, string> = new Map();
private renderRow: TraceRow<BaseStruct> | null = null;
  private loadAppStartup: boolean = false;
  constructor(trace: SpSystemTrace) {
    this.trace = trace;
  }

  initAsyncFuncData = async (): Promise<void> => {
    let asyncFuncList: any[] = await queryProcessAsyncFunc();
    info('AsyncFuncData Count is: ', asyncFuncList!.length);
    this.processAsyncFuncArray = asyncFuncList;
    this.processAsyncFuncMap = Utils.groupBy(asyncFuncList, 'pid');
  };

  initDeliverInputEvent = async (): Promise<void> => {
    let row = TraceRow.skeleton();
    row.setAttribute('disabled-check', '');
    row.rowId = 'DeliverInputEvent';
    row.index = 0;
    row.rowType = TraceRow.ROW_TYPE_DELIVER_INPUT_EVENT;
    row.rowParentId = '';
    row.folder = true;
    row.style.height = '40px';
    row.name = 'DeliverInputEvent';
    row.supplier = folderSupplier();
    row.onThreadHandler = folderThreadHandler(row, this.trace);

    let asyncFuncGroup = Utils.groupBy(
      this.processAsyncFuncArray.filter((it) => it.funName === 'deliverInputEvent'),
      'tid'
    );
    if (Reflect.ownKeys(asyncFuncGroup).length > 0) {
      this.trace.rowsEL?.appendChild(row);
    }
    Reflect.ownKeys(asyncFuncGroup).map((key: any) => {
      let asyncFuncGroups: Array<any> = asyncFuncGroup[key];
      if (asyncFuncGroups.length > 0) {
        row.addChildTraceRow(this.createDeliverInputEventRow(row, key, asyncFuncGroups));
      }
    });
  };

  private createDeliverInputEventRow(parentRow: TraceRow<any>, key: number, asyncFuncGroups: Array<any>): TraceRow<FuncStruct> {
    let funcRow = TraceRow.skeleton<FuncStruct>();
    funcRow.rowId = `${asyncFuncGroups[0].funName}-${key}`;
    funcRow.asyncFuncName = asyncFuncGroups[0].funName;
    funcRow.asyncFuncNamePID = key;
    funcRow.rowType = TraceRow.ROW_TYPE_FUNC;
    funcRow.enableCollapseChart(); //允许折叠泳道图
    funcRow.rowParentId = `${parentRow.rowId}`;
    funcRow.rowHidden = !parentRow.expansion;
    funcRow.style.width = '100%';
    funcRow.name = `${asyncFuncGroups[0].funName} ${key}`;
    funcRow.setAttribute('children', '');
    funcRow.supplierFrame = () => {
      return processDeliverInputEventDataSender(key, funcRow!).then((res: Array<any>) => {
        this.deliverInputEventSendCallback(res, funcRow, asyncFuncGroups);
        return res;
      });
    };
    funcRow.findHoverStruct = (): void => {
      FuncStruct.hoverFuncStruct = funcRow.getHoverStruct();
    }
    funcRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    funcRow.selectChangeHandler = this.trace.selectChangeHandler;
    funcRow.onThreadHandler = rowThreadHandler<FuncRender>('func', 'context', {
      type: `func-${asyncFuncGroups[0].funName}-${key}`,
    }, funcRow, this.trace);
    return funcRow;
  }
  private deliverInputEventSendCallback(res: Array<any>, funcRow: TraceRow<any>, asyncFuncGroups: Array<any>): void {
    let isIntersect = (left: any, right: any): boolean =>
      Math.max(left.startTs + left.dur, right.startTs + right.dur) - Math.min(left.startTs, right.startTs) <
      left.dur + right.dur;
    let depths: any = [];
    let createDepth = (currentDepth: number, index: number): void => {
      if (depths[currentDepth] == undefined || !isIntersect(depths[currentDepth], res[index])) {
        res[index].depth = currentDepth;
        depths[currentDepth] = res[index];
      } else {
        createDepth(++currentDepth, index);
      }
    };
    res.forEach((it, i) => {
      res[i].funName = this.funcNameMap.get(res[i].id!);
      res[i].threadName = Utils.THREAD_MAP.get(res[i].tid!);
      if (it.dur == -1 || it.dur === null || it.dur === undefined) {
        it.dur = (TraceRow.range?.endNS || 0) - it.startTs;
        it.flag = 'Did not end';
      }
      createDepth(0, i);
    });
    if (funcRow && !funcRow.isComplete) {
      let max = Math.max(...asyncFuncGroups.map((it) => it.depth || 0)) + 1;
      let maxHeight = max * 18 + 6;
      funcRow.style.height = `${maxHeight}px`;
      funcRow.setAttribute('height', `${maxHeight}`);
    }
  }



  async init(): Promise<void> {
    await this.prepareData();
    if (
      this.eventCountMap['print'] == 0 &&
      this.eventCountMap['tracing_mark_write'] == 0 &&
      this.eventCountMap['sched_switch'] == 0
    ) {
      return;
    }
    let time = new Date().getTime();
    let processes = await queryProcess();
    let processFromTable = await queryProcessByTable();
    let processList = Utils.removeDuplicates(processes, processFromTable, 'pid');
    let allJankProcessData = await queryAllJankProcess();
    let allJankProcess: Array<number> = [];
    if (allJankProcessData.length > 0) {
      allJankProcessData.forEach((name, index) => {
        allJankProcess.push(name.pid!);
      });
    }
    let allTaskPoolPid: Array<{ pid: number }> = [];
    if (FlagsConfig.getFlagsConfigEnableStatus('TaskPool')) {
      allTaskPoolPid = await queryTaskPoolProcessIds();
    }
    let renderServiceProcess = await queryRsProcess();
    info('ProcessList Data size is: ', processList!.length);
    await this.initProcessRow(processList, allTaskPoolPid, allJankProcess, renderServiceProcess);
    let durTime = new Date().getTime() - time;
    info('The time to load the Process data is: ', durTime);
  }

  private async prepareData(): Promise<void> {
    let maxValues = await queryMemFilterIdMaxValue();
    maxValues.forEach((it) => {
      this.filterIdMaxValue.set(it.filterId, it.maxValue);
    });
    let funcNamesArray = await queryAllFuncNames();
    funcNamesArray.forEach((it) => {
      this.funcNameMap.set(it.id, it.name);
    });
    let soInitNamesArray = await queryAllSoInitNames();
    soInitNamesArray.forEach((it) => {
      this.soInitNameMap.set(it.id, it.name);
    });
    let processSrcSliceArray = await queryAllSrcSlices();
    processSrcSliceArray.forEach((it) => {
      this.processSrcSliceMap.set(it.id, it.src);
    });
    let threadFuncMaxDepthArray = await getMaxDepthByTid();
    info('Gets the maximum tier per thread , tid and maxDepth');
    threadFuncMaxDepthArray.forEach((it) => {
      this.threadFuncMaxDepthMap.set(`${it.ipid}-${it.tid}`, it.maxDepth);
    });
    info('convert tid and maxDepth array to map');
    let pidCountArray = await queryProcessContentCount();
    info('fetch per process  pid,switch_count,thread_count,slice_count,mem_count');
    pidCountArray.forEach((it) => {
      this.processThreadDataCountMap.set(it.pid, it.switch_count);
      this.processThreadCountMap.set(it.pid, it.thread_count);
      this.processFuncDataCountMap.set(it.pid, it.slice_count);
      this.processMemDataCountMap.set(it.pid, it.mem_count);
    });
    this.processMem = await queryProcessMem();
    info('The amount of initialized process memory data is : ', this.processMem!.length);
    this.loadAppStartup = FlagsConfig.getFlagsConfigEnableStatus('AppStartup');
    info('Prepare App startup data ');
    if (this.loadAppStartup) {
      this.startupProcessArr = await queryStartupPidArray();
      this.processSoMaxDepth = await queryProcessSoMaxDepth();
    }
    let eventCountList: Array<any> = await queryEventCountMap();
    this.eventCountMap = eventCountList.reduce((pre, current) => {
      pre[`${current.eventName}`] = current.count;
      return pre;
    }, {});
    let queryProcessThreadResult = await queryProcessThreads();
    let queryProcessThreadsByTableResult = await queryProcessThreadsByTable();
    this.processThreads = Utils.removeDuplicates(queryProcessThreadResult, queryProcessThreadsByTableResult, 'tid');
    info('The amount of initialized process threads data is : ', this.processThreads!.length);
  }

  private async initProcessRow(pArr: Array<any>, allTaskPoolPid: Array<{ pid: number }>, jankArr: Array<number>, rsProcess: Array<any>) {
    for (let i = 0; i < pArr.length; i++) {
      const it = pArr[i];
      if (
        (this.processThreadDataCountMap.get(it.pid) || 0) == 0 &&
        (this.processThreadCountMap.get(it.pid) || 0) == 0 &&
        (this.processFuncDataCountMap.get(it.pid) || 0) == 0 &&
        (this.processMemDataCountMap.get(it.pid) || 0) == 0
      ) {
        continue;
      }
      let processRow = this.createProcessRow(i, it, allTaskPoolPid);
      this.trace.rowsEL?.appendChild(processRow);
      /* App Startup row*/
      let startupRow: TraceRow<AppStartupStruct> | undefined = undefined;
      let soRow: TraceRow<SoStruct> | undefined = undefined;
      if (this.loadAppStartup) {
        if (this.startupProcessArr.find((sp) => sp.pid === it.pid)) {
          startupRow = this.addStartUpRow(processRow);
        }
        let maxSoDepth = this.processSoMaxDepth.find((md) => md.pid === it.pid);
        if (maxSoDepth) {
          soRow = this.addSoInitRow(processRow, maxSoDepth.maxDepth);
        }
      }
      /* Janks Frames */
      let actualRow: TraceRow<JankStruct> | null = null;
      let expectedRow: TraceRow<JankStruct> | null = null;
      this.renderRow = null;
      if (it.processName === 'render_service') {
        this.addThreadList(it, processRow, expectedRow, actualRow, soRow, startupRow);
        this.addProcessMemInfo(it, processRow);
        if (jankArr.indexOf(it.pid!) > -1) {
          expectedRow = this.addExpectedRow(it, processRow, rsProcess);
          actualRow = this.addActualRow(it, processRow, rsProcess);
        }
        this.addProcessRowListener(processRow, actualRow);
        this.addAsyncFunction(it, processRow);
      } else {
        if (jankArr.indexOf(it.pid!) > -1) {
          expectedRow = this.addExpectedRow(it, processRow, rsProcess);
          actualRow = this.addActualRow(it, processRow, rsProcess);
        }
        this.addProcessRowListener(processRow, actualRow);
        this.addAsyncFunction(it, processRow);
        this.addProcessMemInfo(it, processRow);
        this.addThreadList(it, processRow, expectedRow, actualRow, soRow, startupRow);
      }
      
      await this.trace.chartManager?.frameTimeChart.initAnimatedScenesChart(processRow, it, expectedRow!, actualRow!);
    }
  }

  private createProcessRow(index: number, process: any, allTaskPoolPid: Array<{ pid: number }>) {
    let processRow = TraceRow.skeleton<ProcessStruct>();
    processRow.rowId = `${process.pid}`;
    processRow.index = index;
    processRow.rowType = TraceRow.ROW_TYPE_PROCESS;
    processRow.rowParentId = '';
    processRow.style.height = '40px';
    processRow.folder = true;
    if (
      SpChartManager.APP_STARTUP_PID_ARR.find((pid) => pid === process.pid) !== undefined ||
      process.processName === 'render_service'
    ) {
      processRow.addTemplateTypes('AppStartup');
    }
    if (allTaskPoolPid.find((process) => process.pid === process.pid) !== undefined) {
      processRow.addTemplateTypes('TaskPool');
    }
    processRow.name = `${process.processName || 'Process'} ${process.pid}`;
    processRow.supplierFrame = (): Promise<Array<any>> => {
      return processDataSender(process.pid || -1, processRow);
    };
    processRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    processRow.selectChangeHandler = this.trace.selectChangeHandler;
    processRow.onThreadHandler = rowThreadHandler<ProcessRender>('process', 'context', {
      pid: process.pid,
      type: `process ${processRow.index} ${process.processName}`
    }, processRow, this.trace);
    return processRow;
  }

  addProcessRowListener(processRow: TraceRow<ProcessStruct>, actualRow: TraceRow<JankStruct> | null) {
    let offsetYTimeOut: any = undefined;
    processRow.addEventListener('expansion-change', (e: any) => {
      JankStruct.delJankLineFlag = false;
      if (offsetYTimeOut) {
        clearTimeout(offsetYTimeOut);
      }
      if (JankStruct.selectJankStruct !== null && JankStruct.selectJankStruct !== undefined) {
        if (e.detail.expansion) {
          offsetYTimeOut = setTimeout(() => {
            this.trace.linkNodes.forEach((linkNodeItem) => this.handler1(e, linkNodeItem, actualRow));
          }, 300);
        } else {
          if (JankStruct!.selectJankStruct) {
            JankStruct.selectJankStructList?.push(<JankStruct>JankStruct!.selectJankStruct);
          }
          offsetYTimeOut = setTimeout(() => {
            this.trace.linkNodes?.forEach((linkProcessItem) => this.handler2(e, linkProcessItem, processRow));
          }, 300);
        }
      } else {
        if (e.detail.expansion) {
          offsetYTimeOut = setTimeout(() => {
            this.trace.linkNodes.forEach((linkNodeItem) => this.handler3(e, linkNodeItem));
          }, 300);
        } else {
          if (ThreadStruct!.selectThreadStruct) {
            ThreadStruct.selectThreadStructList?.push(<ThreadStruct>ThreadStruct!.selectThreadStruct);
          }
          offsetYTimeOut = setTimeout(() => {
            this.trace.linkNodes?.forEach((linkProcessItem) => {
              this.handler4(e, linkProcessItem, processRow);
              JankStruct.selectJankStructList = [];
            });
          }, 300);
        }
      }
      let refreshTimeOut = setTimeout(() => {
        this.trace.refreshCanvas(true);
        clearTimeout(refreshTimeOut);
      }, 360);
    });
  }

  handler1(e: any, linkItem: PairPoint[], actualRow: TraceRow<JankStruct> | null) {
    JankStruct.selectJankStructList?.forEach((selectProcessStruct: any) => {
      if (e.detail.rowId == selectProcessStruct.pid) {
        JankStruct.selectJankStruct = selectProcessStruct;
        JankStruct.hoverJankStruct = selectProcessStruct;
      }
    });
    this.updatePairPointTranslateY(linkItem[0]);
    linkItem[0].y = linkItem[0].rowEL!.translateY! + linkItem[0].offsetY;
    this.updatePairPointTranslateY(linkItem[1]);
    linkItem[1].y = linkItem[1].rowEL!.translateY! + linkItem[1].offsetY;
    if (actualRow) {
      if (linkItem[0].rowEL.rowId == e.detail.rowId) {
        linkItem[0].x = ns2xByTimeShaft(linkItem[0].ns, this.trace.timerShaftEL!);
        linkItem[0].y = actualRow!.translateY! + linkItem[0].offsetY * 2;
        linkItem[0].offsetY = linkItem[0].offsetY * 2;
        linkItem[0].rowEL = actualRow!;
      } else if (linkItem[1].rowEL.rowId == e.detail.rowId) {
        linkItem[1].x = ns2xByTimeShaft(linkItem[1].ns, this.trace.timerShaftEL!);
        linkItem[1].y = actualRow!.translateY! + linkItem[1].offsetY * 2;
        linkItem[1].offsetY = linkItem[1].offsetY * 2;
        linkItem[1].rowEL = actualRow!;
      }
    }
  }

  handler2(e: any, linkItem: PairPoint[], processRow: TraceRow<ProcessStruct>) {
    this.updatePairPointTranslateY(linkItem[0]);
    linkItem[0].y = linkItem[0].rowEL!.translateY! + linkItem[0].offsetY;
    this.updatePairPointTranslateY(linkItem[1]);
    linkItem[1].y = linkItem[1].rowEL!.translateY! + linkItem[1].offsetY;
    if (linkItem[0].rowEL.rowParentId == e.detail.rowId) {
      this.updatePairPoint(linkItem[0], processRow);
    } else if (linkItem[1].rowEL.rowParentId == e.detail.rowId) {
      this.updatePairPoint(linkItem[1], processRow);
    }
  }

  handler3(e: any, linkItem: PairPoint[]) {
    ThreadStruct.selectThreadStructList?.forEach((selectProcessStruct: any) => {
      if (e.detail.rowId == selectProcessStruct.pid) {
        ThreadStruct.selectThreadStruct = selectProcessStruct;
        ThreadStruct.hoverThreadStruct = selectProcessStruct;
      }
    });
    if (linkItem[0].rowEL.expansion && linkItem[0].backrowEL) {
      this.updatePairPointTranslateY(linkItem[0]);
      linkItem[0].x = ns2xByTimeShaft(linkItem[0].ns, this.trace.timerShaftEL!);
      linkItem[0].y = linkItem[0].rowEL.translateY + linkItem[0].offsetY;
      linkItem[0].offsetY = linkItem[0].offsetY * 2;
      linkItem[0].rowEL = linkItem[0].backrowEL;
    }
    if (linkItem[1].rowEL.expansion && linkItem[1].backrowEL) {
      this.updatePairPointTranslateY(linkItem[1]);
      linkItem[1].x = ns2xByTimeShaft(linkItem[1].ns, this.trace.timerShaftEL!);
      linkItem[1].y = linkItem[1].rowEL!.translateY! + linkItem[1].offsetY;
      linkItem[1].offsetY = linkItem[1].offsetY * 2;
      linkItem[1].rowEL = linkItem[1].backrowEL;
    }
  }

  handler4(e: any, linkItem: PairPoint[], processRow: TraceRow<ProcessStruct>) {
    this.updatePairPointTranslateY(linkItem[0]);
    linkItem[0].y = processRow!.translateY + linkItem[0].offsetY;
    this.updatePairPointTranslateY(linkItem[1]);
    linkItem[1].y = linkItem[1].rowEL!.translateY + linkItem[1].offsetY;
    if (linkItem[0].rowEL.rowParentId == e.detail.rowId) {
      this.updatePairPoint(linkItem[0], processRow);
    }
    if (linkItem[1].rowEL.rowParentId == e.detail.rowId) {
      this.updatePairPoint(linkItem[1], processRow);
    }
  }

  updatePairPointTranslateY(pair: PairPoint) {
    if (pair.rowEL.collect) {
      pair.rowEL.translateY = pair.rowEL.getBoundingClientRect().top - 195;
    } else {
      pair.rowEL.translateY = pair.rowEL.offsetTop - this.trace.rowsPaneEL!.scrollTop;
    }
  }

  updatePairPoint(pair: PairPoint, processRow: TraceRow<ProcessStruct>) {
    if (!pair.rowEL.collect) {
      pair.x = ns2xByTimeShaft(pair.ns, this.trace.timerShaftEL!);
      pair.y = processRow!.translateY! + pair.offsetY / 2;
      pair.offsetY = pair.offsetY / 2;
      pair.rowEL = processRow!;
    }
  }

  addExpectedRow(
    process: any,
    processRow: TraceRow<any>,
    renderServiceProcess: Array<any>
  ): TraceRow<JankStruct> {
    let expectedRow = TraceRow.skeleton<JankStruct>();
    expectedRow.asyncFuncName = process.processName;
    expectedRow.asyncFuncNamePID = process.pid;
    expectedRow.rowType = TraceRow.ROW_TYPE_JANK;
    expectedRow.rowParentId = `${process.pid}`;
    expectedRow.rowHidden = !processRow.expansion;
    expectedRow.style.width = '100%';
    expectedRow.name = 'Expected Timeline';
    expectedRow.addTemplateTypes('FrameTimeline');
    expectedRow.setAttribute('children', '');
    expectedRow.supplierFrame = async () => {
      let res = await processExpectedDataSender(process.pid, expectedRow!);
      this.jankSenderCallback(res, 'expected', process, expectedRow, renderServiceProcess);
      return res;
    };
    expectedRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    expectedRow.selectChangeHandler = this.trace.selectChangeHandler;
    expectedRow.onThreadHandler = rowThreadHandler<JankRender>('jank', 'context', {
      type: 'expected_frame_timeline_slice',
    }, expectedRow, this.trace);
    if (this.renderRow) {
      processRow.addChildTraceRowBefore(expectedRow, this.renderRow);
    } else {
      processRow.addChildTraceRow(expectedRow);
    }
    return expectedRow;
  }

  addActualRow(
    process: any, 
    processRow: TraceRow<any>, 
    renderServiceProcess: Array<any>
  ): TraceRow<JankStruct> {
    let actualRow = TraceRow.skeleton<JankStruct>();
    actualRow.rowType = TraceRow.ROW_TYPE_JANK;
    actualRow.rowParentId = `${process.pid}`;
    actualRow.rowHidden = !processRow.expansion;
    actualRow.style.width = '100%';
    actualRow.name = 'Actual Timeline';
    actualRow.addTemplateTypes('FrameTimeline');
    actualRow.setAttribute('children', '');
    actualRow.supplierFrame = async () => {
      let res = await processActualDataSender(process.pid, actualRow!);
      this.jankSenderCallback(res, 'actual', process, actualRow, renderServiceProcess);
      return res;
    };
    actualRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    actualRow.selectChangeHandler = this.trace.selectChangeHandler;
    actualRow.onThreadHandler = rowThreadHandler<JankRender>('jank', 'context', {
      type: 'actual_frame_timeline_slice',
    }, actualRow, this.trace);
    if (this.renderRow) {
      processRow.addChildTraceRowBefore(actualRow, this.renderRow);
    } else {
      processRow.addChildTraceRow(actualRow);
    }
    return actualRow;
  }

  jankSenderCallback(res: JankStruct[], type: string, process: any, row: TraceRow<JankStruct>, renderServiceProcess: Array<any>) {
    let maxDepth: number = 1;
    let unitHeight: number = 20;
    for (let j = 0; j < res.length; j++) {
      let struct = res[j];
      if (struct.depth! >= maxDepth) {
        maxDepth = struct.depth! + 1;
      }
      if (type === 'actual') {
        struct.src_slice = this.processSrcSliceMap.get(res[j].id!);
      }
      struct.cmdline = Utils.PROCESS_MAP.get(res[j].pid!);
      if (res[j].pid! === renderServiceProcess[0].pid) {
        struct.cmdline = 'render_service';
        struct.frame_type = struct.cmdline;
      } else {
        struct.frame_type = 'app';
      }
    }
    if (row && !row.isComplete && res.length > 0) {
      let maxHeight: number = maxDepth * unitHeight;
      row.style.height = `${maxHeight}px`;
      row.setAttribute('height', `${maxHeight}`);
      if (res[0]) {
        let timeLineType = res[0].type;
        row.rowId = `${timeLineType}-${process.pid}`;
        row.setAttribute('frame_type', res[0].frame_type || '');
        if (type === 'actual') {
          row.dataList = res;
        }
      }
    }
  }

  addStartUpRow(processRow: TraceRow<ProcessStruct>): TraceRow<AppStartupStruct> {
    processRow.setAttribute('hasStartup', 'true');
    let startupRow: TraceRow<AppStartupStruct> = TraceRow.skeleton<AppStartupStruct>();
    startupRow.rowId = `app-start-${processRow.rowId}`;
    startupRow.rowType = TraceRow.ROW_TYPE_APP_STARTUP;
    startupRow.rowParentId = `${processRow.rowId}`;
    startupRow.rowHidden = !processRow.expansion;
    startupRow.index = 0;
    startupRow.style.height = '30px';
    startupRow.style.width = `100%`;
    startupRow.name = `App Startups`;
    startupRow.findHoverStruct = (): void => {
      AppStartupStruct.hoverStartupStruct = startupRow.getHoverStruct();
    }
    startupRow.setAttribute('children', '');
    startupRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    startupRow.selectChangeHandler = this.trace.selectChangeHandler;
    startupRow.supplierFrame = (): Promise<Array<AppStartupStruct>> =>
      processStartupDataSender(parseInt(processRow.rowId!), startupRow).then((res) => {
        if (res.length <= 0) {
          this.trace.refreshCanvas(true);
        }
        for (let i = 0; i < res.length; i++) {
          if (res[i].startName! < 6 && i < res.length - 1) {
            res[i].endItid = res[i + 1].itid;
          }
        }
        return res;
      });
    startupRow.onThreadHandler = rowThreadHandler<AppStartupRender>('app-start-up', 'appStartupContext', {
      type: `app-startup ${processRow.rowId}`,
    }, startupRow, this.trace);
    processRow.addChildTraceRow(startupRow);
    return startupRow;
  }

  addSoInitRow(processRow: TraceRow<ProcessStruct>, maxDepth: number): TraceRow<SoStruct> {
    processRow.setAttribute('hasStaticInit', 'true');
    let maxHeight = (maxDepth + 1) * 20;
    let soRow: TraceRow<SoStruct> = TraceRow.skeleton<SoStruct>();
    soRow.rowId = `app-start-${processRow.rowId}`;
    soRow.rowType = TraceRow.ROW_TYPE_STATIC_INIT;
    soRow.rowParentId = `${processRow.rowId}`;
    soRow.rowHidden = !processRow.expansion;
    soRow.index = 0;
    soRow.style.height = `${maxHeight}px`;
    soRow.style.width = `100%`;
    soRow.name = `Static Initialization`;
    soRow.setAttribute('children', '');
    soRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    soRow.selectChangeHandler = this.trace.selectChangeHandler;
    soRow.findHoverStruct = (): void => {
      SoStruct.hoverSoStruct = soRow.getHoverStruct();
    }
    soRow.supplierFrame = (): Promise<Array<SoStruct>> =>
      processSoInitDataSender(parseInt(processRow.rowId!), soRow).then((res) => {
        if (res.length <= 0) {
          this.trace.refreshCanvas(true);
        }
        res.forEach((so, index) => {
          let soName = this.soInitNameMap.get(res[index].id!);
          if (soName) {
            so.soName = soName.replace('dlopen: ', '');
          }
        });
        return res;
      });
    soRow.onThreadHandler = rowThreadHandler<SoRender>('app-so-init', 'context', {
      type: `static-init ${processRow.rowId}`,
    }, soRow, this.trace);
    processRow.addChildTraceRow(soRow);
    return soRow;
  }

  insertAfter(newEl: HTMLElement, targetEl: HTMLElement): void {
    let parentEl = targetEl.parentNode;
    if (parentEl!.lastChild == targetEl) {
      parentEl!.appendChild(newEl);
    } else {
      parentEl!.insertBefore(newEl, targetEl.nextSibling);
    }
  }

  //add thread list
  addThreadList(
    it: { pid: number | null; processName: string | null },
    processRow: TraceRow<ProcessStruct>,
    expectedRow: TraceRow<JankStruct> | null,
    actualRow: TraceRow<JankStruct> | null,
    soRow: TraceRow<SoStruct> | undefined,
    startupRow: TraceRow<AppStartupStruct> | undefined
  ){
    let threads = this.processThreads.filter((thread) => thread.pid === it.pid && thread.tid != 0);
    let threadRowArr: Array<TraceRow<BaseStruct>> = [];
    for (let j = 0; j < threads.length; j++) {
      let thread = threads[j];
      let threadRow = TraceRow.skeleton<ThreadStruct>();
      threadRow.rowId = `${thread.tid}`;
      threadRow.rowType = TraceRow.ROW_TYPE_THREAD;
      threadRow.rowParentId = `${it.pid}`;
      threadRow.rowHidden = !processRow.expansion;
      threadRow.index = j;
      threadRow.style.height = '18px';
      threadRow.style.width = '100%';
      threadRow.name = `${thread.threadName || 'Thread'} ${thread.tid}`;
      threadRow.namePrefix = `${thread.threadName || 'Thread'}`;
      threadRow.setAttribute('children', '');
      threadRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
      threadRow.selectChangeHandler = this.trace.selectChangeHandler;
      threadRow.findHoverStruct = (): void => this.threadRowFindHoverStruct(threadRow);
      threadRow.supplierFrame = async (): Promise<Array<ThreadStruct>> => {
        const res = await threadDataSender(thread.tid || 0, it.pid || 0, threadRow);
        if (res === true) {
          return [];
        } else {
          let rs = res as ThreadStruct[];
          if (rs.length <= 0 && !threadRow.isComplete) {
            this.trace.refreshCanvas(true);
          }
          return rs;
        }
      };
      threadRow.onThreadHandler = rowThreadHandler<ThreadRender>('thread', 'context', {
        type: `thread ${thread.tid} ${thread.threadName}`,
        translateY: threadRow.translateY,
      }, threadRow, this.trace);
      this.insertThreadRowToDocument(it, j, thread, processRow, threadRow, threads, threadRowArr, actualRow, expectedRow, startupRow, soRow);
      this.addFuncStackRow(it, thread, j, threads, threadRowArr, threadRow, processRow);
      if ((thread.switchCount || 0) === 0) {
        threadRow.rowDiscard = true;
      }
    }
  }

  threadRowFindHoverStruct(threadRow: TraceRow<ThreadStruct>) {
    let arr = threadRow.dataListCache.filter(
      (re) => re.frame && isFrameContainPoint(re.frame, threadRow.hoverX, threadRow.hoverY, true, false)
    );
    let runItem = arr.find(it => it.state === 'Running');
    if (runItem) {
      ThreadStruct.hoverThreadStruct = runItem;
    } else {
      let otherItem = arr.find(it => it.state !== 'S');
      if (otherItem) {
        ThreadStruct.hoverThreadStruct = otherItem;
      } else {
        ThreadStruct.hoverThreadStruct = arr[0];
      }
    }
  }

  insertThreadRowToDocument(
    it: any,
    index: number,
    thread: ThreadStruct,
    processRow: TraceRow<ProcessStruct>,
    threadRow: TraceRow<ThreadStruct>,
    threads: ThreadStruct[],
    threadRowArr: TraceRow<any>[],
    actualRow: TraceRow<any> | null,
    expectedRow: TraceRow<any> | null,
    startupRow: TraceRow<AppStartupStruct> | null | undefined,
    soRow: TraceRow<SoStruct> | null | undefined
  ) {
    if (it.processName === 'render_service') {
      if (threadRow.name === `${it.processName} ${it.pid}`) {
        this.renderRow = threadRow;
      }
      let flag = threads.length === index + 1 && !this.threadFuncMaxDepthMap.has(`${thread.upid}-${thread.tid}`);
      processRow.sortRenderServiceData(threadRow, threadRow, threadRowArr, flag);
    } else {
      if (threadRow.rowId === threadRow.rowParentId) {
        if (actualRow !== null) {
          processRow.addChildTraceRowAfter(threadRow, actualRow);
        } else if (expectedRow !== null) {
          processRow.addChildTraceRowAfter(threadRow, expectedRow);
        } else if (soRow) {
          processRow.addChildTraceRowAfter(threadRow, soRow);
        } else if (startupRow) {
          processRow.addChildTraceRowAfter(threadRow, startupRow);
        } else {
          processRow.addChildTraceRowSpecifyLocation(threadRow, 0);
        }
      } else {
        processRow.addChildTraceRow(threadRow);
      }
    }
  }

  addFuncStackRow(
    process: any,
    thread: any,
    index: number,
    threads: Array<any>,
    threadRowArr: Array<any>,
    threadRow: TraceRow<ThreadStruct>,
    processRow: TraceRow<ProcessStruct>
  ) {
    if (this.threadFuncMaxDepthMap.get(`${thread.upid}-${thread.tid}`) != undefined) {
      let max = this.threadFuncMaxDepthMap.get(`${thread.upid}-${thread.tid}`) || 1;
      let maxHeight = max * 18 + 6;
      let funcRow = TraceRow.skeleton<FuncStruct>();
      funcRow.rowId = `${thread.tid}`;
      funcRow.rowType = TraceRow.ROW_TYPE_FUNC;
      funcRow.enableCollapseChart(); //允许折叠泳道图
      funcRow.rowParentId = `${process.pid}`;
      funcRow.rowHidden = !processRow.expansion;
      funcRow.checkType = threadRow.checkType;
      funcRow.style.width = '100%';
      funcRow.style.height = `${maxHeight}px`;
      funcRow.name = `${thread.threadName || 'Thread'} ${thread.tid}`;
      funcRow.namePrefix = `${thread.threadName || 'Thread'}`;
      funcRow.setAttribute('children', '');
      funcRow.supplierFrame = async (): Promise<Array<FuncStruct>> => {
        const rs = await funcDataSender(thread.tid || 0, thread.upid || 0, funcRow);
        return this.funDataSenderCallback(rs, funcRow, thread);
      };
      funcRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
      funcRow.selectChangeHandler = this.trace.selectChangeHandler;
      funcRow.findHoverStruct = (): void => {
        FuncStruct.hoverFuncStruct = funcRow.getHoverStruct();
      }
      funcRow.onThreadHandler = rowThreadHandler<FuncRender>('func', 'context', {
        type: `func${thread.tid}${thread.threadName}`,
      }, funcRow, this.trace);
      if (process.processName === 'render_service') {
        let flag = threads.length === index + 1;
        processRow.sortRenderServiceData(funcRow, threadRow, threadRowArr, flag);
      } else {
        processRow.addChildTraceRowAfter(funcRow, threadRow);
      }
    }
  }

  funDataSenderCallback(rs: Array<any> | boolean, funcRow: TraceRow<FuncStruct>, thread: ThreadStruct): FuncStruct[] {
    if (rs === true) {
      funcRow.rowDiscard = true;
      return [];
    } else {
      let funs = rs as FuncStruct[];
      if (funs.length > 0) {
        funs.forEach((fun, index) => {
          funs[index].itid = thread.utid;
          funs[index].ipid = thread.upid;
          funs[index].funName = this.funcNameMap.get(funs[index].id!);
          if (Utils.isBinder(fun)) {
          } else {
            if (fun.nofinish) {
              fun.flag = 'Did not end';
            }
          }
        });
      } else {
        this.trace.refreshCanvas(true);
      }
      return funs;
    }
  }

  //进程内存信息
  addProcessMemInfo(
    it: { pid: number | null; processName: string | null },
    processRow: TraceRow<ProcessStruct>
  ) {
    let processMem = this.processMem.filter((mem) => mem.pid === it.pid);
    processMem.forEach((mem) => {
      let row = TraceRow.skeleton<ProcessMemStruct>();
      row.rowId = `${mem.trackId}`;
      row.rowType = TraceRow.ROW_TYPE_MEM;
      row.rowParentId = `${it.pid}`;
      row.rowHidden = !processRow.expansion;
      row.style.height = '40px';
      row.style.width = '100%';
      row.name = `${mem.trackName}`;
      row.setAttribute('children', '');
      row.favoriteChangeHandler = this.trace.favoriteChangeHandler;
      row.selectChangeHandler = this.trace.selectChangeHandler;
      row.focusHandler = (): void => {
        this.trace.displayTip(row, ProcessMemStruct.hoverProcessMemStruct, `<span>${ProcessMemStruct.hoverProcessMemStruct?.value || '0'}</span>`);
      };
      row.findHoverStruct = (): void => {
        ProcessMemStruct.hoverProcessMemStruct = row.getHoverStruct(false);
      };
      row.supplierFrame = (): Promise<Array<ProcessMemStruct>> =>
        processMemDataSender(mem.trackId, row).then((resultProcess) => {
          let maxValue = this.filterIdMaxValue.get(mem.trackId) || 0;
          for (let j = 0; j < resultProcess.length; j++) {
            resultProcess[j].maxValue = maxValue;
            if (j === resultProcess.length - 1) {
              resultProcess[j].duration = (TraceRow.range?.totalNS || 0) - (resultProcess[j].startTime || 0);
            } else {
              resultProcess[j].duration = (resultProcess[j + 1].startTime || 0) - (resultProcess[j].startTime || 0);
            }
            if (j > 0) {
              resultProcess[j].delta = (resultProcess[j].value || 0) - (resultProcess[j - 1].value || 0);
            } else {
              resultProcess[j].delta = 0;
            }
          }
          return resultProcess;
        });
      row.onThreadHandler = rowThreadHandler<MemRender>('mem', 'context', {
        type: `mem ${mem.trackId} ${mem.trackName}`,
      }, row, this.trace);
      if (this.renderRow && row.name === 'H:PreferredFrameRate') {
        processRow.addChildTraceRowBefore(row, this.renderRow);
      } else {
        processRow.addChildTraceRow(row);
      }
    });
  }
  private calMaxHeight(asyncFunctions: any[]): number {
    let max = 0;
    asyncFunctions.forEach((it) => {
      const depth = it.depth || 0;
      if (depth > max) {
        max = depth;
      }
    });
    max += 1;
    return max * 18 + 6;;
  }

  //Async Function
  addAsyncFunction(it: { pid: number; processName: string | null }, processRow: TraceRow<ProcessStruct>) {
    let asyncFuncList = this.processAsyncFuncMap[it.pid] || [];
    let asyncFuncGroup = Utils.groupBy(asyncFuncList, 'funName');
    Reflect.ownKeys(asyncFuncGroup).map((key: any) => {
      let asyncFunctions: Array<any> = asyncFuncGroup[key];
      if (asyncFunctions.length > 0) {
        let isIntersect = (a: any, b: any): boolean =>
          Math.max(a.startTs + a.dur, b.startTs + b.dur) - Math.min(a.startTs, b.startTs) < a.dur + b.dur;
        let depthArray: any = [];
        asyncFunctions.forEach((it, i) => {
          if (it.dur === -1 || it.dur === null || it.dur === undefined) {
            it.dur = (TraceRow.range?.endNS || 0) - it.startTs;
            it.flag = 'Did not end';
          }
          let currentDepth = 0;
          let index = i;
          while (depthArray[currentDepth] !== undefined && isIntersect(depthArray[currentDepth], asyncFunctions[index])) {
            currentDepth++;
          }
          asyncFunctions[index].depth = currentDepth;
          depthArray[currentDepth] = asyncFunctions[index];
        });
        const maxHeight = this.calMaxHeight(asyncFunctions);
        let funcRow = TraceRow.skeleton<FuncStruct>();
        funcRow.rowId = `${asyncFunctions[0].funName}-${it.pid}`;
        funcRow.asyncFuncName = asyncFunctions[0].funName;
        funcRow.asyncFuncNamePID = it.pid;
        funcRow.rowType = TraceRow.ROW_TYPE_FUNC;
        funcRow.enableCollapseChart(); //允许折叠泳道图
        funcRow.rowParentId = `${it.pid}`;
        funcRow.rowHidden = !processRow.expansion;
        funcRow.style.width = '100%';
        funcRow.style.height = `${maxHeight}px`;
        funcRow.setAttribute('height', `${maxHeight}`);
        funcRow.name = `${asyncFunctions[0].funName}`;
        funcRow.setAttribute('children', '');
        funcRow.findHoverStruct = (): void => {
          FuncStruct.hoverFuncStruct = funcRow.getHoverStruct();
        }
        funcRow.supplier = (): Promise<any> => new Promise((resolve) => resolve(asyncFunctions));
        funcRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
        funcRow.selectChangeHandler = this.trace.selectChangeHandler;
        funcRow.onThreadHandler = rowThreadHandler<FuncRender>('func', 'context', {
          type: `func-${asyncFunctions[0].funName}-${it.pid}`,
        }, funcRow, this.trace);
        processRow.addChildTraceRow(funcRow);
      }
    });
  }
}
