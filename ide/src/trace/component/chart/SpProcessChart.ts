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
import { processTouchEventDispatchDataSender } from '../../database/data-trafic/process/ProcessTouchEventDispatchDataSender';
import { getMaxDepthByTid, queryProcessAsyncFunc, queryProcessAsyncFuncCat } from '../../database/sql/Func.sql';
import { queryMemFilterIdMaxValue } from '../../database/sql/Memory.sql';
import { queryAllSoInitNames, queryAllSrcSlices, queryEventCountMap } from '../../database/sql/SqlLite.sql';
import {
  queryProcessByTable,
  queryProcessContentCount,
  queryProcessMem,
  queryProcessSoMaxDepth,
  queryProcessThreadsByTable,
  queryStartupPidArray,
  queryRsProcess,
  queryTaskPoolProcessIds,
  queryDistributedRelationData,
} from '../../database/sql/ProcessThread.sql';
import { queryAllJankProcess } from '../../database/sql/Janks.sql';
import { BaseStruct } from '../../bean/BaseStruct';
import { promises } from 'dns';
import { HangStruct } from '../../database/ui-worker/ProcedureWorkerHang';
import { hangDataSender } from '../../database/data-trafic/HangDataSender';
import { SpHangChart } from './SpHangChart';
import { queryHangData } from '../../database/sql/Hang.sql';

const FOLD_HEIGHT = 24;
export class SpProcessChart {
  private readonly trace: SpSystemTrace;
  private processAsyncFuncMap: unknown = {};
  private processAsyncFuncArray: unknown[] = [];
  private processAsyncFuncCatMap: unknown = {};
  private eventCountMap: unknown;
  private processThreads: Array<ThreadStruct> = [];
  private processMem: Array<unknown> = [];
  private processThreadCountMap: Map<number, number> = new Map();
  private processThreadDataCountMap: Map<number, number> = new Map();
  private processFuncDataCountMap: Map<number, number> = new Map();
  private processMemDataCountMap: Map<number, number> = new Map();
  private threadFuncMaxDepthMap: Map<string, number> = new Map();
  private startupProcessArr: { pid: number }[] = [];
  private processSoMaxDepth: { pid: number; maxDepth: number }[] = [];
  private filterIdMaxValue: Map<number, number> = new Map();
  private soInitNameMap: Map<number, string> = new Map();
  private processSrcSliceMap: Map<number, string> = new Map();
  private distributedDataMap: Map<
    string,
    {
      chainId: string;
      spanId: string;
      parentSpanId: string;
      chainFlag: string;
      traceId: string
    }
  > = new Map();
  private renderRow: TraceRow<BaseStruct> | null = null;
  private loadAppStartup: boolean = false;
  private isDistributed: boolean = false;
  private traceId?: string | undefined;
  private parentRow: TraceRow<BaseStruct> | undefined;
  static asyncFuncCache: unknown[] = [];
  static threadStateList: Map<string, unknown> = new Map();
  static processRowSortMap: Map<string, unknown> = new Map();

  private hangProcessSet: Set<number> = new Set();
  constructor(trace: SpSystemTrace) {
    this.trace = trace;
  }

  clearCache(): void {
    this.processAsyncFuncArray = [];
    this.processAsyncFuncMap = {};
    this.processAsyncFuncCatMap = {};
    this.eventCountMap = {};
    this.processThreads = [];
    this.processMem = [];
    this.processThreadCountMap.clear();
    this.processThreadDataCountMap.clear();
    this.processFuncDataCountMap.clear();
    this.processMemDataCountMap.clear();
    this.threadFuncMaxDepthMap.clear();
    this.startupProcessArr = [];
    this.processSoMaxDepth = [];
    this.filterIdMaxValue.clear();
    this.soInitNameMap.clear();
    this.processSrcSliceMap.clear();
    this.distributedDataMap.clear();
    this.renderRow = null;
    SpProcessChart.asyncFuncCache = [];
    if (this.parentRow) {
      this.parentRow.clearMemory();
      this.parentRow = undefined;
    }
  }

  initAsyncFuncData = async (traceRange: { startTs: number; endTs: number }, traceId?: string): Promise<void> => {
    let asyncFuncList: unknown[] = await queryProcessAsyncFunc(traceRange, traceId);
    for (const func of asyncFuncList) {
      //@ts-ignore
      func.funName = this.traceId ? Utils.getInstance().getCallStatckMap().get(`${this.traceId}_${func.id}`) : Utils.getInstance().getCallStatckMap().get(func.id); //@ts-ignore
      func.threadName = Utils.getInstance().getThreadMap(traceId).get(func.tid);
    }
    info('AsyncFuncData Count is: ', asyncFuncList!.length);
    this.processAsyncFuncArray = asyncFuncList;
    this.processAsyncFuncMap = Utils.groupBy(asyncFuncList, 'pid');

    let asyncFuncCatList: unknown[] = await queryProcessAsyncFuncCat(traceRange);
    info('AsyncFuncCatData Count is: ', asyncFuncCatList!.length);
    this.processAsyncFuncCatMap = Utils.groupBy(asyncFuncCatList, 'pid');
  };

  initDeliverInputEvent = async (): Promise<void> => {
    let row = TraceRow.skeleton();
    row.rowId = 'DeliverInputEvent';
    row.index = 0;
    row.rowType = TraceRow.ROW_TYPE_DELIVER_INPUT_EVENT;
    row.rowParentId = '';
    row.folder = true;
    row.style.height = '40px';
    row.name = 'DeliverInputEvent';
    // @ts-ignore
    row.supplier = folderSupplier();
    row.onThreadHandler = folderThreadHandler(row, this.trace);

    let asyncFuncGroup = Utils.groupBy(
      //@ts-ignore
      this.processAsyncFuncArray.filter((it) => it.funName === 'deliverInputEvent'),
      'pid'
    ); // @ts-ignore
    if (Reflect.ownKeys(asyncFuncGroup).length > 0) {
      this.trace.rowsEL?.appendChild(row);
    } // @ts-ignore
    Reflect.ownKeys(asyncFuncGroup).map((key: unknown) => {
      // @ts-ignore
      let asyncFuncGroups: Array<unknown> = asyncFuncGroup[key];
      if (asyncFuncGroups.length > 0) {
        //@ts-ignore
        row.addChildTraceRow(this.createDeliverInputEventRow(row, key, asyncFuncGroups));
      }
    });
  };

  private createDeliverInputEventRow(
    //@ts-ignore
    parentRow: TraceRow<unknown>,
    key: number,
    asyncFuncGroups: Array<unknown>
  ): TraceRow<FuncStruct> {
    let funcRow = TraceRow.skeleton<FuncStruct>();
    //@ts-ignore
    funcRow.rowId = `${asyncFuncGroups[0].funName}-${key}`; //@ts-ignore
    funcRow.asyncFuncName = asyncFuncGroups[0].funName;
    funcRow.asyncFuncNamePID = key;
    funcRow.rowType = TraceRow.ROW_TYPE_FUNC;
    funcRow.enableCollapseChart(FOLD_HEIGHT, this.trace); //允许折叠泳道图
    funcRow.rowParentId = `${parentRow.rowId}`;
    funcRow.rowHidden = !parentRow.expansion;
    funcRow.style.width = '100%';
    //@ts-ignore
    funcRow.name = `${asyncFuncGroups[0].funName} ${key}`;
    funcRow.setAttribute('children', '');
    funcRow.supplierFrame = async (): Promise<FuncStruct[]> => {
      const res = await processDeliverInputEventDataSender(key, funcRow!);
      this.deliverInputEventSendCallback(res, funcRow, asyncFuncGroups);
      return res;
    };
    funcRow.findHoverStruct = (): void => {
      FuncStruct.hoverFuncStruct = funcRow.getHoverStruct();
    };
    funcRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    funcRow.selectChangeHandler = this.trace.selectChangeHandler;
    funcRow.onThreadHandler = rowThreadHandler<FuncRender>(
      'func',
      'context',
      {
        //@ts-ignore
        type: `func-${asyncFuncGroups[0].funName}-${key}`,
      },
      funcRow,
      this.trace
    );
    return funcRow;
  }
  //@ts-ignore
  private deliverInputEventSendCallback(
    res: Array<unknown>, //@ts-ignore
    funcRow: TraceRow<unknown>,
    asyncFuncGroups: Array<unknown>
  ): void {
    let isIntersect = (
      left: unknown,
      right: unknown
    ): boolean => //@ts-ignore
      Math.max(left.startTs + left.dur, right.startTs + right.dur) - Math.min(left.startTs, right.startTs) <
      //@ts-ignore
      left.dur + right.dur;
    let depths: unknown = [];
    let createDepth = (currentDepth: number, index: number): void => {
      //@ts-ignore
      if (depths[currentDepth] === undefined || !isIntersect(depths[currentDepth], res[index])) {
        //@ts-ignore
        res[index].depth = currentDepth;
        //@ts-ignore
        depths[currentDepth] = res[index];
      } else {
        createDepth(++currentDepth, index);
      }
    };
    res.forEach((it, i): void => {
      //@ts-ignore
      res[i].funName = this.traceId ? Utils.getInstance().getCallStatckMap().get(`${this.traceId}_${res[i].id!}`) : Utils.getInstance().getCallStatckMap().get(res[i].id!); //@ts-ignore
      res[i].threadName = Utils.getInstance().getThreadMap().get(res[i].tid!);
      //@ts-ignore
      if (it.dur === -1 || it.dur === null || it.dur === undefined) {
        //@ts-ignore
        it.dur = (TraceRow.range?.endNS || 0) - it.startTs;
        //@ts-ignore
        it.flag = 'Did not end';
      }
      createDepth(0, i);
    });
    if (funcRow && !funcRow.isComplete) {
      //@ts-ignore
      let max = Math.max(...asyncFuncGroups.map((it) => it.depth || 0)) + 1;
      let maxHeight = max * 18 + 6;
      funcRow.style.height = `${maxHeight}px`;
      funcRow.setAttribute('height', `${maxHeight}`);
    }
  }

  initTouchEventDispatch = async (): Promise<void> => {
    let row = TraceRow.skeleton() as TraceRow<ProcessStruct>;
    row.rowId = 'TouchEventDispatch';
    row.index = 0;
    row.rowType = TraceRow.ROW_TYPE_TOUCH_EVENT_DISPATCH;
    row.rowParentId = '';
    row.folder = true;
    row.style.height = '40px';
    row.name = 'TouchEventDispatch';
    //@ts-ignore
    row.supplier = folderSupplier();
    row.onThreadHandler = folderThreadHandler(row, this.trace);

    let asyncFuncGroup = Utils.groupBy(
      //@ts-ignore
      this.processAsyncFuncArray.filter((it) => it.funName === 'H:touchEventDispatch' || it.funName === 'H:TouchEventDispatch'),
      'pid'
    );
    //@ts-ignore
    if (Reflect.ownKeys(asyncFuncGroup).length > 0) {
      this.trace.rowsEL?.appendChild(row);
    }
    //@ts-ignore
    Reflect.ownKeys(asyncFuncGroup).map((key: unknown) => {
      //@ts-ignore
      let asyncFuncGroups: Array<unknown> = asyncFuncGroup[key];
      if (asyncFuncGroups.length > 0) {
        // @ts-ignore
        row.addChildTraceRow(this.createTouchEventDispatchRow(row, key, asyncFuncGroups));
      }
    });
  };

  private createTouchEventDispatchRow(
    parentRow: TraceRow<ProcessStruct>,
    key: number,
    asyncFuncGroups: Array<unknown>
  ): TraceRow<FuncStruct> {
    let funcRow = TraceRow.skeleton<FuncStruct>();
    // @ts-ignore
    funcRow.rowId = `${asyncFuncGroups[0].funName}-${key}`;
    // @ts-ignore
    funcRow.asyncFuncName = asyncFuncGroups[0].funName;
    funcRow.asyncFuncNamePID = key;
    funcRow.rowType = TraceRow.ROW_TYPE_FUNC;
    funcRow.enableCollapseChart(FOLD_HEIGHT, this.trace); //允许折叠泳道图
    funcRow.rowParentId = `${parentRow.rowId}`;
    funcRow.rowHidden = !parentRow.expansion;
    funcRow.style.width = '100%';
    funcRow.style.height = '24px';
    //@ts-ignore
    funcRow.name = `${asyncFuncGroups[0].funName} ${key}`;
    funcRow.setAttribute('children', '');
    //@ts-ignore
    funcRow.supplierFrame = (): Promise => {
      return processTouchEventDispatchDataSender(key, funcRow!).then((res: Array<unknown>) => {
        this.touchEventDispatchSendCallback(res, funcRow, asyncFuncGroups);
        return res;
      });
    };

    funcRow.findHoverStruct = (): void => {
      FuncStruct.hoverFuncStruct = funcRow.getHoverStruct();
    };
    funcRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    funcRow.selectChangeHandler = this.trace.selectChangeHandler;
    funcRow.onThreadHandler = rowThreadHandler<FuncRender>(
      'func',
      'context',
      {
        // @ts-ignore
        type: `func-${asyncFuncGroups[0].funName}-${key}`,
      },
      funcRow,
      this.trace
    );
    return funcRow;
  }

  // @ts-ignore
  private touchEventDispatchSendCallback(res: Array<unknown>, funcRow: TraceRow<unknown>, asyncFuncGroups: Array<unknown>): void {
    let isIntersect = (left: unknown, right: unknown): boolean =>
      // @ts-ignore
      Math.max(left.startTs + left.dur, right.startTs + right.dur) - Math.min(left.startTs, right.startTs) <
      // @ts-ignore
      left.dur + right.dur;
    let depths: unknown = [];
    let createDepth = (currentDepth: number, index: number): void => {
      // @ts-ignore
      if (depths[currentDepth] === undefined || !isIntersect(depths[currentDepth], res[index])) {
        //@ts-ignore
        res[index].depth = currentDepth;
        // @ts-ignore
        depths[currentDepth] = res[index];
      } else {
        createDepth(++currentDepth, index);
      }
    };
    res.forEach((it, i) => {
      //@ts-ignore
      res[i].funName = this.traceId ? Utils.getInstance().getCallStatckMap().get(`${this.traceId}_${res[i].id!}`) : Utils.getInstance().getCallStatckMap().get(res[i].id!);
      //@ts-ignore
      res[i].threadName = Utils.getInstance().getThreadMap().get(res[i].tid!);
      //@ts-ignore
      if (it.dur === -1 || it.dur === null || it.dur === undefined) {
        //@ts-ignore
        it.dur = (TraceRow.range?.endNS || 0) - it.startTs;
        //@ts-ignore
        it.flag = 'Did not end';
      }
      createDepth(0, i);
    });
    if (funcRow && !funcRow.isComplete) {
      // @ts-ignore
      let max = Math.max(...asyncFuncGroups.map((it) => it.depth || 0)) + 1;
      let maxHeight = max * 18 + 6;
      funcRow.style.height = `${maxHeight}px`;
      funcRow.setAttribute('height', `${maxHeight}`);
    }
  }

  // @ts-ignore
  async init(isDistributed: boolean, parentRow?: TraceRow<unknown>, traceId?: string): Promise<void> {
    this.traceId = traceId;
    // @ts-ignore
    this.parentRow = parentRow;
    this.isDistributed = isDistributed;
    await this.prepareData(traceId);
    if (
      //@ts-ignore
      this.eventCountMap.print === 0 && //@ts-ignore
      this.eventCountMap.tracing_mark_write === 0 && //@ts-ignore
      this.eventCountMap.sched_switch === 0
    ) {
      return;
    }
    let time = new Date().getTime();
    let processSortArray = Array.from(SpProcessChart.processRowSortMap);
    // @ts-ignore
    processSortArray.sort((a: Array<unknown>, b: Array<unknown>) =>
      // @ts-ignore
      b[1] - a[1]
    );
    let processFromTable = await queryProcessByTable(traceId);
    let processList = Utils.sortThreadRow(processSortArray, processFromTable, 'process');
    SpProcessChart.processRowSortMap.clear();
    let allJankProcess: Array<number> = [];
    let allTaskPoolPid: Array<{ pid: number }> = [];
    let renderServiceProcess: unknown[] = [];
    if (!this.isDistributed) {
      let allJankProcessData = await queryAllJankProcess();
      if (allJankProcessData.length > 0) {
        allJankProcessData.forEach((name, index) => {
          allJankProcess.push(name.pid!);
        });
      }
      if (FlagsConfig.getFlagsConfigEnableStatus('TaskPool')) {
        allTaskPoolPid = await queryTaskPoolProcessIds();
      }
      renderServiceProcess = await queryRsProcess();
    }
    
    // @ts-ignore
    info('ProcessList Data size is: ', processList!.length);
    

    this.hangProcessSet = new Set<number>((await queryHangData()).map(item => item.id));

    // @ts-ignore
    await this.initProcessRow(processList, allTaskPoolPid, allJankProcess, renderServiceProcess, traceId);
    let durTime = new Date().getTime() - time;
    info('The time to load the Process data is: ', durTime);
  }

  private async prepareData(traceId?: string): Promise<void> {
    if (!this.isDistributed) {
      let maxValues = await queryMemFilterIdMaxValue();
      maxValues.forEach((it) => {
        this.filterIdMaxValue.set(it.filterId, it.maxValue);
      });
      let soInitNamesArray = await queryAllSoInitNames();
      soInitNamesArray.forEach((it) => {
        // @ts-ignore
        this.soInitNameMap.set(it.id, it.name);
      });
      let processSrcSliceArray = await queryAllSrcSlices();
      processSrcSliceArray.forEach((it) => {
        // @ts-ignore
        this.processSrcSliceMap.set(it.id, it.src);
      });
      this.processMem = await queryProcessMem();
      info('The amount of initialized process memory data is : ', this.processMem!.length);
      this.loadAppStartup = FlagsConfig.getFlagsConfigEnableStatus('AppStartup');
      info('Prepare App startup data ');
      if (this.loadAppStartup) {
        this.startupProcessArr = await queryStartupPidArray();
        this.processSoMaxDepth = await queryProcessSoMaxDepth();
      }
    }
    let threadFuncMaxDepthArray = await getMaxDepthByTid(traceId);
    info('Gets the maximum tier per thread , tid and maxDepth');
    threadFuncMaxDepthArray.forEach((it) => {
      //@ts-ignore
      this.threadFuncMaxDepthMap.set(`${it.ipid}-${it.tid}`, it.maxDepth);
    });
    info('convert tid and maxDepth array to map');
    let pidCountArray = await queryProcessContentCount(traceId);
    info('fetch per process  pid,switch_count,thread_count,slice_count,mem_count');
    pidCountArray.forEach((it) => {
      //@ts-ignore
      this.processThreadDataCountMap.set(it.pid, it.switch_count);
      //@ts-ignore
      this.processThreadCountMap.set(it.pid, it.thread_count);
      //@ts-ignore
      this.processFuncDataCountMap.set(it.pid, it.slice_count);
      //@ts-ignore
      this.processMemDataCountMap.set(it.pid, it.mem_count);
    });
    let eventCountList: Array<unknown> = await queryEventCountMap(traceId);
    this.eventCountMap = eventCountList.reduce((pre, current) => {
      //@ts-ignore
      pre[`${current.eventName}`] = current.count;
      return pre;
    }, {});
    // threadStateList转数组
    let threadArray = Array.from(SpProcessChart.threadStateList);
    // @ts-ignore 排序
    threadArray.sort((a: Array<unknown>, b: Array<unknown>) =>
      // @ts-ignore
      b[1] - a[1]);
    let queryProcessThreadsByTableResult = await queryProcessThreadsByTable(traceId);
    // @ts-ignore
    // 全量threads排序
    // @ts-ignore
    this.processThreads = Utils.sortThreadRow(threadArray, queryProcessThreadsByTableResult, 'thread');
    SpProcessChart.threadStateList.clear();
    let distributedDataLists = await queryDistributedRelationData(traceId);
    distributedDataLists.forEach((item) => {
      this.distributedDataMap.set(`${item.id}_${traceId}`, {
        chainId: item.chainId,
        spanId: item.spanId,
        parentSpanId: item.parentSpanId,
        chainFlag: item.chainFlag,
        traceId: traceId!,
      });
    });
    info('The amount of initialized process threads data is : ', this.processThreads!.length);
  }

  private async initProcessRow(
    pArr: Array<unknown>,
    allTaskPoolPid: Array<{ pid: number }>,
    jankArr: Array<number>,
    rsProcess: Array<unknown>,
    traceId?: string
  ): Promise<void> {
    for (let i = 0; i < pArr.length; i++) {
      const it = pArr[i] as {
        pid: number;
        processName: string | null
      };
      if (
        (this.processThreadDataCountMap.get(it.pid) || 0) === 0 &&
        (this.processThreadCountMap.get(it.pid) || 0) === 0 &&
        (this.processFuncDataCountMap.get(it.pid) || 0) === 0 &&
        (this.processMemDataCountMap.get(it.pid) || 0) === 0
      ) {
        continue;
      }
      let processRow = this.createProcessRow(i, it, allTaskPoolPid);
      if (this.parentRow) {
        this.parentRow.addChildTraceRow(processRow);
      } else {
        this.trace.rowsEL?.appendChild(processRow);
      }
      /* App Startup row*/
      let startupRow: TraceRow<AppStartupStruct> | undefined = undefined;
      let soRow: TraceRow<SoStruct> | undefined = undefined;
      let actualRow: TraceRow<JankStruct> | null = null;
      let expectedRow: TraceRow<JankStruct> | null = null;
      //@ts-ignore
      let currentPid = it.pid;
      if (!this.isDistributed) {
        if (this.loadAppStartup) {
          if (this.startupProcessArr.find((sp) => sp.pid === currentPid)) {
            startupRow = this.addStartUpRow(processRow);
          }
          let maxSoDepth = this.processSoMaxDepth.find((md) => md.pid === currentPid);
          if (maxSoDepth) {
            soRow = this.addSoInitRow(processRow, maxSoDepth.maxDepth);
          }
        }
        if (jankArr.indexOf(currentPid) > -1) {
          expectedRow = this.addExpectedRow(it, processRow, rsProcess);
          actualRow = this.addActualRow(it, processRow, rsProcess);
        }
      }
      this.renderRow = null; //@ts-ignore
      if (this.loadAppStartup) {
        if (this.startupProcessArr.find((sp) => sp.pid === it.pid)) {
          startupRow = this.addStartUpRow(processRow);
        }
        let maxSoDepth = this.processSoMaxDepth.find((md) => md.pid === it.pid);
        if (maxSoDepth) {
          soRow = this.addSoInitRow(processRow, maxSoDepth.maxDepth);
        }
      }
      
      let hangsRow: TraceRow<HangStruct> | null = null;
      this.renderRow = null;
      if (it.processName === 'render_service') {
        //@ts-ignore
        this.addThreadList(it, processRow, expectedRow, actualRow, soRow, startupRow, traceId); //@ts-ignore
        this.addProcessMemInfo(it, processRow); //@ts-ignore
        this.addAsyncFunction(it, processRow);//@ts-ignore
        this.addThreadList(it, processRow, expectedRow, actualRow, hangsRow, soRow, startupRow);
        this.addProcessMemInfo(it, processRow);
        if (jankArr.indexOf(it.pid!) > -1) {
          expectedRow = this.addExpectedRow(it, processRow, rsProcess);
          actualRow = this.addActualRow(it, processRow, rsProcess);
        }
        hangsRow = this.addHangRow(it, processRow);
        this.addProcessRowListener(processRow, actualRow);
        this.addAsyncFunction(it, processRow);
        this.addAsyncCatFunction(it, processRow);
      } else {
        //@ts-ignore
        this.addAsyncFunction(it, processRow); //@ts-ignore
        this.addProcessMemInfo(it, processRow); //@ts-ignore
        this.addThreadList(it, processRow, expectedRow, actualRow, soRow, startupRow, traceId);//@ts-ignore
        if (jankArr.indexOf(it.pid!) > -1) {
          expectedRow = this.addExpectedRow(it, processRow, rsProcess);
          actualRow = this.addActualRow(it, processRow, rsProcess);
        }
        hangsRow = this.addHangRow(it, processRow);
        this.addProcessRowListener(processRow, actualRow);
        this.addAsyncFunction(it, processRow);
        this.addProcessMemInfo(it, processRow);
        this.addThreadList(it, processRow, expectedRow, actualRow, hangsRow, soRow, startupRow);
        this.addAsyncCatFunction(it, processRow);
      }
      this.addProcessRowListener(processRow, actualRow);
      if (!this.isDistributed) {
        //@ts-ignore
        await this.trace.chartManager?.frameTimeChart.initAnimatedScenesChart(processRow, it, expectedRow!, actualRow!);
      }
    }
  }

  private createProcessRow(
    index: number,
    process: unknown,
    allTaskPoolPid: Array<{ pid: number }>
  ): TraceRow<ProcessStruct> {
    let processRow = TraceRow.skeleton<ProcessStruct>(this.traceId); //@ts-ignore
    processRow.rowId = `${process.pid}`;
    processRow.index = index;
    processRow.rowType = TraceRow.ROW_TYPE_PROCESS;
    processRow.rowParentId = '';
    processRow.style.height = '40px';
    processRow.folder = true;
    if (
      //@ts-ignore
      SpChartManager.APP_STARTUP_PID_ARR.find((pid) => pid === process.pid) !== undefined || //@ts-ignore
      process.processName === 'render_service'
    ) {
      processRow.addTemplateTypes('AppStartup');
    }
    if (allTaskPoolPid.find((process) => process.pid === process.pid) !== undefined) {
      processRow.addTemplateTypes('TaskPool');
    } //@ts-ignore
    processRow.name = `${process.processName || 'Process'} ${process.pid}`; //@ts-ignore
    processRow.supplierFrame = (): Promise<Array<unknown>> => {
      //@ts-ignore
      return processDataSender(process.pid || -1, processRow, this.traceId);
    };
    processRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    processRow.selectChangeHandler = this.trace.selectChangeHandler;
    processRow.onThreadHandler = rowThreadHandler<ProcessRender>(
      'process',
      'context',
      {
        //@ts-ignore
        pid: process.pid, //@ts-ignore
        type: `process ${processRow.index} ${process.processName}`,
      },
      processRow,
      this.trace
    );
    return processRow;
  }

  addProcessRowListener(processRow: TraceRow<ProcessStruct>, actualRow: TraceRow<JankStruct> | null): void {
    let offsetYTimeOut: unknown = undefined;
    processRow.addEventListener('expansion-change', (e: unknown) => {
      JankStruct.delJankLineFlag = false;
      if (offsetYTimeOut) {
        //@ts-ignore
        clearTimeout(offsetYTimeOut);
      }
      if (JankStruct.selectJankStruct !== null && JankStruct.selectJankStruct !== undefined) {
        //@ts-ignore
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
      } else if (FuncStruct.selectFuncStruct) { //@ts-ignore
        if (e.detail.expansion) {
          offsetYTimeOut = setTimeout(() => {
            this.trace.linkNodes.forEach((linkNodeItem) => this.handler3(e, linkNodeItem));
          }, 300);
        } else {
          offsetYTimeOut = setTimeout(() => {
            this.trace.linkNodes?.forEach((linkProcessItem) => {
              this.handler4(e, linkProcessItem, processRow);
              JankStruct.selectJankStructList = [];
            });
          }, 300);
        }
        this.trace.resetDistributedLine();

      } else {
        //@ts-ignore
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

  handler1(e: unknown, linkItem: PairPoint[], actualRow: TraceRow<JankStruct> | null): void {
    JankStruct.selectJankStructList?.forEach((selectProcessStruct: unknown) => {
      //@ts-ignore
      if (e.detail.rowId === selectProcessStruct.pid) {
        //@ts-ignore
        JankStruct.selectJankStruct = selectProcessStruct; //@ts-ignore
        JankStruct.hoverJankStruct = selectProcessStruct;
      }
    });
    this.updatePairPointTranslateY(linkItem[0]);
    linkItem[0].y = linkItem[0].rowEL!.translateY! + linkItem[0].offsetY;
    this.updatePairPointTranslateY(linkItem[1]);
    linkItem[1].y = linkItem[1].rowEL!.translateY! + linkItem[1].offsetY;
    if (actualRow) {
      //@ts-ignore
      if (linkItem[0].rowEL.rowId === e.detail.rowId) {
        linkItem[0].x = ns2xByTimeShaft(linkItem[0].ns, this.trace.timerShaftEL!);
        linkItem[0].y = actualRow!.translateY! + linkItem[0].offsetY * 2;
        linkItem[0].offsetY = linkItem[0].offsetY * 2;
        //@ts-ignore
        linkItem[0].rowEL = actualRow!;
        //@ts-ignore
      } else if (linkItem[1].rowEL.rowId === e.detail.rowId) {
        linkItem[1].x = ns2xByTimeShaft(linkItem[1].ns, this.trace.timerShaftEL!);
        linkItem[1].y = actualRow!.translateY! + linkItem[1].offsetY * 2;
        linkItem[1].offsetY = linkItem[1].offsetY * 2;
        //@ts-ignore
        linkItem[1].rowEL = actualRow!;
      }
    }
  }

  handler2(e: unknown, linkItem: PairPoint[], processRow: TraceRow<ProcessStruct>): void {
    this.updatePairPointTranslateY(linkItem[0]);
    linkItem[0].y = linkItem[0].rowEL!.translateY! + linkItem[0].offsetY;
    this.updatePairPointTranslateY(linkItem[1]);
    linkItem[1].y = linkItem[1].rowEL!.translateY! + linkItem[1].offsetY; //@ts-ignore
    if (linkItem[0].rowEL.rowParentId === e.detail.rowId) {
      this.updatePairPoint(linkItem[0], processRow); //@ts-ignore
    } else if (linkItem[1].rowEL.rowParentId === e.detail.rowId) {
      this.updatePairPoint(linkItem[1], processRow);
    }
  }

  handler3(e: unknown, linkItem: PairPoint[]): void {
    ThreadStruct.selectThreadStructList?.forEach((selectProcessStruct: unknown) => {
      //@ts-ignore
      if (e.detail.rowId === selectProcessStruct.pid) {
        //@ts-ignore
        ThreadStruct.selectThreadStruct = selectProcessStruct; //@ts-ignore
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

  handler4(e: unknown, linkItem: PairPoint[], processRow: TraceRow<ProcessStruct>): void {
    this.updatePairPointTranslateY(linkItem[0]);
    linkItem[0].y = processRow!.translateY + linkItem[0].offsetY;
    this.updatePairPointTranslateY(linkItem[1]);
    linkItem[1].y = linkItem[1].rowEL!.translateY + linkItem[1].offsetY; //@ts-ignore
    if (linkItem[0].rowEL.rowParentId === e.detail.rowId) {
      //@ts-ignore
      this.updatePairPoint(linkItem[0], processRow);
    } //@ts-ignore
    if (linkItem[1].rowEL.rowParentId === e.detail.rowId) {
      this.updatePairPoint(linkItem[1], processRow);
    }
  }

  updatePairPointTranslateY(pair: PairPoint): void {
    if (pair.rowEL.collect) {
      pair.rowEL.translateY = pair.rowEL.getBoundingClientRect().top - 195;
    } else {
      pair.rowEL.translateY = pair.rowEL.offsetTop - this.trace.rowsPaneEL!.scrollTop;
    }
  }

  updatePairPoint(pair: PairPoint, processRow: TraceRow<ProcessStruct>): void {
    if (!pair.rowEL.collect) {
      pair.x = ns2xByTimeShaft(pair.ns, this.trace.timerShaftEL!);
      pair.y = processRow!.translateY! + pair.offsetY / 2;
      pair.offsetY = pair.offsetY / 2;
      pair.rowEL = processRow!;
    }
  }

  /* Janks Frames */
  //@ts-ignore
  addExpectedRow(
    process: unknown, //@ts-ignore
    processRow: TraceRow<unknown>,
    renderServiceProcess: Array<unknown>
  ): TraceRow<JankStruct> {
    let expectedRow = TraceRow.skeleton<JankStruct>(); //@ts-ignore
    expectedRow.asyncFuncName = process.processName; //@ts-ignore
    expectedRow.asyncFuncNamePID = process.pid;
    expectedRow.rowType = TraceRow.ROW_TYPE_JANK; //@ts-ignore
    expectedRow.rowParentId = `${process.pid}`;
    expectedRow.rowHidden = !processRow.expansion;
    expectedRow.style.width = '100%';
    expectedRow.name = 'Expected Timeline';
    expectedRow.addTemplateTypes('FrameTimeline');
    expectedRow.setAttribute('children', '');
    expectedRow.supplierFrame = async (): Promise<JankStruct[]> => {
      //@ts-ignore
      let res = await processExpectedDataSender(process.pid, expectedRow!);
      this.jankSenderCallback(res, 'expected', process, expectedRow, renderServiceProcess);
      return res;
    };
    expectedRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    expectedRow.selectChangeHandler = this.trace.selectChangeHandler;
    expectedRow.onThreadHandler = rowThreadHandler<JankRender>(
      'jank',
      'context',
      {
        type: 'expected_frame_timeline_slice',
      },
      expectedRow,
      this.trace
    );
    if (this.renderRow) {
      processRow.addChildTraceRowBefore(expectedRow, this.renderRow);
    } else {
      processRow.addChildTraceRow(expectedRow);
    }
    return expectedRow;
  }

  //@ts-ignore
  addActualRow(
    process: unknown, //@ts-ignore
    processRow: TraceRow<unknown>,
    renderServiceProcess: Array<unknown>
  ): TraceRow<JankStruct> {
    let actualRow = TraceRow.skeleton<JankStruct>();
    actualRow.rowType = TraceRow.ROW_TYPE_JANK; //@ts-ignore
    actualRow.rowParentId = `${process.pid}`;
    actualRow.rowHidden = !processRow.expansion;
    actualRow.style.width = '100%';
    actualRow.name = 'Actual Timeline';
    actualRow.addTemplateTypes('FrameTimeline');
    actualRow.setAttribute('children', '');
    actualRow.supplierFrame = async (): Promise<JankStruct[]> => {
      //@ts-ignore
      let res = await processActualDataSender(process.pid, actualRow!);
      this.jankSenderCallback(res, 'actual', process, actualRow, renderServiceProcess);
      return res;
    };
    actualRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    actualRow.selectChangeHandler = this.trace.selectChangeHandler;
    actualRow.onThreadHandler = rowThreadHandler<JankRender>(
      'jank',
      'context',
      {
        type: 'actual_frame_timeline_slice',
      },
      actualRow,
      this.trace
    );
    if (this.renderRow) {
      processRow.addChildTraceRowBefore(actualRow, this.renderRow);
    } else {
      processRow.addChildTraceRow(actualRow);
    }
    return actualRow;
  }

  //@ts-ignore
  addHangRow(
    data: {
      pid: number;
      processName: string | null;
    },
    row: TraceRow<ProcessStruct>
  ): TraceRow<HangStruct> | null {
    if (!this.hangProcessSet.has(data.pid) || !FlagsConfig.getFlagsConfigEnableStatus('Hangs')) {
      return null;
    }
    let hangsRow = TraceRow.skeleton<HangStruct>();
    hangsRow.rowType = TraceRow.ROW_TYPE_HANG_INNER;
    hangsRow.rowId = `${data.processName ?? 'Process'} ${data.pid}`;
    hangsRow.rowParentId = `${data.pid}`;
    hangsRow.rowHidden = !row.expansion;
    hangsRow.style.width = '100%';
    hangsRow.name = 'Hangs';
    hangsRow.addTemplateTypes('FrameTimeline');
    hangsRow.setAttribute('children', '');
    hangsRow.supplierFrame = async (): Promise<HangStruct[]> => {
      let promiseData = hangDataSender(data.pid, hangsRow);
      if (promiseData === null) {
        return new Promise<Array<HangStruct>>((resolve) => resolve([]));
      } else {
        return promiseData.then((resultHang: Array<HangStruct>) =>
          resultHang.map(hangItem => ({
            ...hangItem,
            pname: data.processName ?? 'process',
            type: SpHangChart.calculateHangType(hangItem.dur!),
            content: SpHangChart.funcNameMap.get(hangItem.id!)
          }))
        );
      }
    };
    hangsRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    hangsRow.selectChangeHandler = this.trace.selectChangeHandler;
    hangsRow.findHoverStruct = (): void => {
      HangStruct.hoverHangStruct = hangsRow.getHoverStruct();
    };
    hangsRow.onThreadHandler = rowThreadHandler<HangStruct>(
      'hang',
      'context',
      {
        type: 'hangs_frame_timeline_slice',
      },
      hangsRow,
      this.trace
    );

    if (this.renderRow) {
      row.addChildTraceRowBefore(hangsRow, this.renderRow);
    } else {
      row.addChildTraceRow(hangsRow);
    }
    return hangsRow;
  }

  jankSenderCallback(
    res: JankStruct[],
    type: string,
    process: unknown,
    row: TraceRow<JankStruct>,
    renderServiceProcess: Array<unknown>,
  ): void {
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
      struct.cmdline = Utils.getInstance().getProcessMap().get(res[j].pid!); //@ts-ignore
      if (res[j].pid! === renderServiceProcess[0].pid) {
        struct.cmdline = 'render_service';
        struct.frameType = struct.cmdline;
      } else {
        struct.frameType = 'app';
      }
    }
    if (row && !row.isComplete && res.length > 0) {
      let maxHeight: number = maxDepth * unitHeight;
      row.style.height = `${maxHeight}px`;
      row.setAttribute('height', `${maxHeight}`);
      if (res[0]) {
        let timeLineType = res[0].type; //@ts-ignore
        row.rowId = `${timeLineType}-${process.pid}`;
        row.setAttribute('frame_type', res[0].frameType || '');
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
    startupRow.style.width = '100%';
    startupRow.name = 'App Startups';
    startupRow.findHoverStruct = (): void => {
      AppStartupStruct.hoverStartupStruct = startupRow.getHoverStruct();
    };
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
    startupRow.onThreadHandler = rowThreadHandler<AppStartupRender>(
      'app-start-up',
      'appStartupContext',
      {
        type: `app-startup ${processRow.rowId}`,
      },
      startupRow,
      this.trace
    );
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
    soRow.style.width = '100%';
    soRow.name = 'Static Initialization';
    soRow.setAttribute('children', '');
    soRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    soRow.selectChangeHandler = this.trace.selectChangeHandler;
    soRow.findHoverStruct = (): void => {
      SoStruct.hoverSoStruct = soRow.getHoverStruct();
    };
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
    soRow.onThreadHandler = rowThreadHandler<SoRender>(
      'app-so-init',
      'context',
      {
        type: `static-init ${processRow.rowId}`,
      },
      soRow,
      this.trace
    );
    processRow.addChildTraceRow(soRow);
    return soRow;
  }

  insertAfter(newEl: HTMLElement, targetEl: HTMLElement): void {
    let parentEl = targetEl.parentNode;
    if (parentEl!.lastChild === targetEl) {
      parentEl!.appendChild(newEl);
    } else {
      parentEl!.insertBefore(newEl, targetEl.nextSibling);
    }
  }

  //add thread list
  addThreadList(
    it: { pid: number | null; processName: string | null },
    pRow: TraceRow<ProcessStruct>,
    expectedRow: TraceRow<JankStruct> | null,
    actualRow: TraceRow<JankStruct> | null,
    hangsRow: TraceRow<HangStruct> | null,
    soRow: TraceRow<SoStruct> | undefined,
    startupRow: TraceRow<AppStartupStruct> | undefined,
    traceId?: string
  ): void {
    let threads = this.processThreads.filter((thread) => thread.pid === it.pid && thread.tid !== 0);
    let tRowArr: Array<TraceRow<BaseStruct>> = [];
    for (let j = 0; j < threads.length; j++) {
      let thread = threads[j];
      let tRow = TraceRow.skeleton<ThreadStruct>(this.traceId);
      tRow.rowId = `${thread.tid}`;
      tRow.rowType = TraceRow.ROW_TYPE_THREAD;
      tRow.rowParentId = `${it.pid}`;
      tRow.rowHidden = !pRow.expansion;
      tRow.index = j;
      tRow.style.height = '18px';
      tRow.style.width = '100%';
      tRow.name = `${thread.threadName || 'Thread'} ${thread.tid}`;
      tRow.namePrefix = `${thread.threadName || 'Thread'}`;
      tRow.setAttribute('children', '');
      tRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
      tRow.selectChangeHandler = this.trace.selectChangeHandler;
      tRow.findHoverStruct = (): void => this.threadRowFindHoverStruct(tRow);
      tRow.supplierFrame = async (): Promise<Array<ThreadStruct>> => {
        const res = await threadDataSender(thread.tid || 0, it.pid || 0, tRow, this.traceId);
        if (res === true) {
          return [];
        }
        let rs = res as ThreadStruct[];
        if (rs.length <= 0 && !tRow.isComplete) {
          this.trace.refreshCanvas(true);
        }
        return rs;
      };
      tRow.onThreadHandler = rowThreadHandler<ThreadRender>(
        'thread',
        'context',
        {
          type: `thread ${thread.tid} ${thread.threadName}`,
          translateY: tRow.translateY,
        },
        tRow,
        this.trace
      );
      this.insertRowToDoc(it, j, thread, pRow, tRow, threads, tRowArr, actualRow, expectedRow, hangsRow, startupRow, soRow);
      this.addFuncStackRow(it, thread, j, threads, tRowArr, tRow, pRow);
      if ((thread.switchCount || 0) === 0) {
        tRow.rowDiscard = true;
      }
    }
  }

  threadRowFindHoverStruct(threadRow: TraceRow<ThreadStruct>): void {
    let arr = threadRow.dataListCache.filter(
      (re) => re.frame && isFrameContainPoint(re.frame, threadRow.hoverX, threadRow.hoverY, true, false)
    );
    let runItem = arr.find((it) => it.state === 'Running');
    if (runItem) {
      ThreadStruct.hoverThreadStruct = runItem;
    } else {
      let otherItem = arr.find((it) => it.state !== 'S');
      if (otherItem) {
        ThreadStruct.hoverThreadStruct = otherItem;
      } else {
        ThreadStruct.hoverThreadStruct = arr[0];
      }
    }
  }

  insertRowToDoc(
    it: unknown,
    index: number,
    thread: ThreadStruct,
    processRow: TraceRow<ProcessStruct>,
    threadRow: TraceRow<ThreadStruct>,
    threads: ThreadStruct[],
    //@ts-ignore
    threadRowArr: TraceRow<unknown>[],
    //@ts-ignore
    actualRow: TraceRow<unknown> | null,
    //@ts-ignore
    expectedRow: TraceRow<unknown> | null,
    hangsRow: TraceRow<HangStruct> | null,
    startupRow: TraceRow<AppStartupStruct> | null | undefined,
    soRow: TraceRow<SoStruct> | null | undefined
  ): void {
    //@ts-ignore
    if (it.processName === 'render_service') {
      //@ts-ignore
      if (threadRow.name === `${it.processName} ${it.pid}`) {
        this.renderRow = threadRow;
      }
      let flag = threads.length === index + 1 && !this.threadFuncMaxDepthMap.has(`${thread.upid}-${thread.tid}`);
      //@ts-ignore
      processRow.sortRenderServiceData(threadRow, threadRow, threadRowArr, flag);
    } else {
      if (threadRow.rowId === threadRow.rowParentId) {
        if (actualRow !== null) {
          processRow.addChildTraceRowAfter(threadRow, actualRow);
        } else if (expectedRow !== null) {
          processRow.addChildTraceRowAfter(threadRow, expectedRow);
        } else if (hangsRow !== null) {
          processRow.addChildTraceRowAfter(threadRow, hangsRow);
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
    process: unknown,
    thread: unknown,
    index: number,
    threads: Array<unknown>,
    threadRowArr: Array<unknown>,
    threadRow: TraceRow<ThreadStruct>,
    processRow: TraceRow<ProcessStruct>,
  ): void {
    //@ts-ignore
    if (this.threadFuncMaxDepthMap.get(`${thread.upid}-${thread.tid}`) !== undefined) {
      //@ts-ignore
      let max = this.threadFuncMaxDepthMap.get(`${thread.upid}-${thread.tid}`) || 1;
      let maxHeight = max * 18 + 6;
      let funcRow = TraceRow.skeleton<FuncStruct>(this.traceId);
      //@ts-ignore
      funcRow.rowId = `${thread.tid}`;
      funcRow.rowType = TraceRow.ROW_TYPE_FUNC;
      funcRow.enableCollapseChart(FOLD_HEIGHT, this.trace); //允许折叠泳道图
      //@ts-ignore
      funcRow.rowParentId = `${process.pid}`;
      funcRow.rowHidden = !processRow.expansion;
      funcRow.checkType = threadRow.checkType;
      funcRow.style.width = '100%';
      funcRow.style.height = `${maxHeight}px`;
      //@ts-ignore
      funcRow.name = `${thread.threadName || 'Thread'} ${thread.tid}`;
      //@ts-ignore
      funcRow.namePrefix = `${thread.threadName || 'Thread'}`;
      funcRow.setAttribute('children', '');
      funcRow.supplierFrame = async (): Promise<Array<FuncStruct>> => {
        //@ts-ignore
        const rs = await funcDataSender(thread.tid || 0, thread.upid || 0, funcRow, this.traceId);
        //@ts-ignore
        return this.funDataSenderCallback(rs, funcRow, thread);
      };
      funcRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
      funcRow.selectChangeHandler = this.trace.selectChangeHandler;
      funcRow.findHoverStruct = (): void => {
        FuncStruct.hoverFuncStruct = funcRow.getHoverStruct();
      };
      funcRow.onThreadHandler = rowThreadHandler<FuncRender>(
        'func',
        'context',
        {
          //@ts-ignore
          type: `func${thread.tid}${thread.threadName}`,
        },
        funcRow,
        this.trace
      ); //@ts-ignore
      if (process.processName === 'render_service') {
        let flag = threads.length === index + 1;
        //@ts-ignore
        processRow.sortRenderServiceData(funcRow, threadRow, threadRowArr, flag);
      } else {
        processRow.addChildTraceRowAfter(funcRow, threadRow);
      }
    }
  }

  funDataSenderCallback(
    rs: Array<unknown> | boolean,
    funcRow: TraceRow<FuncStruct>,
    thread: ThreadStruct
  ): FuncStruct[] {
    if (rs === true) {
      funcRow.rowDiscard = true;
      return [];
    } else {
      let funs = rs as FuncStruct[];
      if (funs.length > 0) {
        funs.forEach((fun, index) => {
          funs[index].itid = thread.utid;
          funs[index].ipid = thread.upid;
          funs[index].tid = thread.tid;
          funs[index].pid = thread.pid;
          funs[index].funName = this.traceId ? Utils.getInstance().getCallStatckMap().get(`${this.traceId}_${funs[index].id}`) : Utils.getInstance().getCallStatckMap().get(funs[index].id!);
          if (Utils.isBinder(fun)) {
          } else {
            if (fun.nofinish) {
              fun.flag = 'Did not end';
            }
          }
          if (fun.id && this.distributedDataMap.has(`${fun.id}_${this.traceId}`)) {
            let distributedData = this.distributedDataMap.get(`${fun.id}_${this.traceId}`);
            funs[index].chainId = distributedData!.chainId;
            funs[index].spanId = distributedData!.spanId;
            funs[index].parentSpanId = distributedData!.parentSpanId;
            funs[index].chainFlag = distributedData!.chainFlag;
            funs[index].traceId = this.traceId;
          }
        });
      } else {
        this.trace.refreshCanvas(true);
      }
      return funs;
    }
  }

  //进程内存信息
  addProcessMemInfo(it: { pid: number | null; processName: string | null }, processRow: TraceRow<ProcessStruct>): void {
    //@ts-ignore
    let processMem = this.processMem.filter((mem) => mem.pid === it.pid);
    processMem.forEach((mem) => {
      let row = TraceRow.skeleton<ProcessMemStruct>();
      //@ts-ignore
      row.rowId = `${mem.trackId}`;
      row.rowType = TraceRow.ROW_TYPE_MEM;
      row.rowParentId = `${it.pid}`;
      row.rowHidden = !processRow.expansion;
      row.style.height = '40px';
      row.style.width = '100%';
      //@ts-ignore
      row.name = `${mem.trackName}`;
      row.setAttribute('children', '');
      row.favoriteChangeHandler = this.trace.favoriteChangeHandler;
      row.selectChangeHandler = this.trace.selectChangeHandler;
      row.focusHandler = (): void => {
        if (row.hoverY <= 5 || row.hoverY >= 35) {
          ProcessMemStruct.hoverProcessMemStruct = undefined;
        }
        this.trace.displayTip(
          row,
          ProcessMemStruct.hoverProcessMemStruct,
          `<span>${ProcessMemStruct.hoverProcessMemStruct?.value || '0'}</span>`
        );
      };
      row.findHoverStruct = (): void => {
        ProcessMemStruct.hoverProcessMemStruct = row.getHoverStruct(false);
      };
      row.supplierFrame = (): Promise<Array<ProcessMemStruct>> =>
        //@ts-ignore
        processMemDataSender(mem.trackId, row).then((resultProcess) => {
          //@ts-ignore
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
      row.onThreadHandler = rowThreadHandler<MemRender>(
        'mem',
        'context',
        {
          //@ts-ignore
          type: `mem ${mem.trackId} ${mem.trackName}`,
        },
        row,
        this.trace
      );
      if (this.renderRow && row.name === 'H:PreferredFrameRate') {
        processRow.addChildTraceRowBefore(row, this.renderRow);
      } else {
        processRow.addChildTraceRow(row);
      }
    });
  }
  private calMaxHeight(asyncFunctions: unknown[]): number {
    let max = 0;
    asyncFunctions.forEach((it) => {
      //@ts-ignore
      const depth = it.depth || 0;
      if (depth > max) {
        max = depth;
      }
    });
    max += 1;
    return max * 18 + 6;
  }
  //处理缓存数据的'startTs'字段统一成'startTime'
  private toAsyncFuncCache(object: unknown, name: string): void {
    // @ts-ignore
    let modifiedObject = { ...object };
    modifiedObject.startTime = modifiedObject.startTs;
    Reflect.deleteProperty(modifiedObject, 'startTs');
    modifiedObject.rowId = name;
    modifiedObject.type = 'func';
    SpProcessChart.asyncFuncCache.push({ ...modifiedObject });
  }
  //Async Function
  addAsyncFunction(it: { pid: number; processName: string | null }, processRow: TraceRow<ProcessStruct>): void {
    let isCategoryAsyncfunc: boolean = FlagsConfig.getFlagsConfigEnableStatus('Start&Finish Trace Category');
    let asyncRemoveCatArr: unknown[];
    let asyncCat: unknown;
    let setArrayLenThanOne: unknown;
    let setArrayLenOnlyOne: unknown;
    //@ts-ignore
    let asyncFuncList = this.processAsyncFuncMap[it.pid] || [];
    if (!asyncFuncList.length) {
      return;
    }
    let flag = FlagsConfig.getSecondarySelectValue('catValue') === 'business';
    if (isCategoryAsyncfunc) {//聚合异步trace
      ({ asyncRemoveCatArr, asyncCat } = this.hanldCatFunc(asyncFuncList, flag));//处理是否cat
      ({ setArrayLenThanOne, setArrayLenOnlyOne } = this.hanldAsyncFunc(it, asyncRemoveCatArr));//len等于0和大于0的分类
      //@ts-ignore
      let aggregateData = { ...asyncCat, ...setArrayLenThanOne, ...setArrayLenOnlyOne };
      Reflect.ownKeys(aggregateData).map((key: unknown) => {//处理business first和length大于1的数据
        //@ts-ignore
        let param: Array<unknown> = aggregateData[key];
        //@ts-ignore
        this.makeAddAsyncFunction(param, it, processRow, key);
      });
    } else {
      //不聚合异步trace
      let asyncFuncGroup = Utils.groupBy(asyncFuncList, 'funName');
      //@ts-ignore
      Reflect.ownKeys(asyncFuncGroup).map((key: unknown) => {
        //@ts-ignore
        let asyncFunctions: Array<unknown> = asyncFuncGroup[key];
        if (asyncFunctions.length > 0) {
          let isIntersect = (a: unknown, b: unknown): boolean =>
            // @ts-ignore
            Math.max(a.startTs + a.dur, b.startTs + b.dur) - Math.min(a.startTs, b.startTs) < a.dur + b.dur;
          let depthArray: unknown = [];
          asyncFunctions.forEach((it, i) => {
            // @ts-ignore
            if (it.dur === -1 || it.dur === null || it.dur === undefined) {
              // @ts-ignore
              it.dur = (TraceRow.range?.endNS || 0) - it.startTs;
              // @ts-ignore
              it.flag = 'Did not end';
            }
            let currentDepth = 0;
            let index = i;
            while (
              // @ts-ignore
              depthArray[currentDepth] !== undefined &&
              // @ts-ignore
              isIntersect(depthArray[currentDepth], asyncFunctions[index])
            ) {
              currentDepth++;
            }
            // @ts-ignore
            asyncFunctions[index].depth = currentDepth;
            // @ts-ignore
            depthArray[currentDepth] = asyncFunctions[index];
            // @ts-ignore
            //处理缓存的异步trace数据缺失的字段
            this.toAsyncFuncCache(asyncFunctions[index], `${asyncFunctions[i].funName}-${it.pid}`);
          });
        }
        //@ts-ignore
        this.lanesConfig(asyncFunctions, it, processRow, `${asyncFunctions[0].funName}`);
      });
    }
  }
  //处理CategoryAsyncFunc
  hanldCatFunc(
    asyncFuncList: Array<unknown>,
    flag: boolean
  ): { asyncRemoveCatArr: Array<unknown>, asyncCat: unknown } {
    let asyncCat;
    let asyncCatArr = new Array();
    let asyncCatMap: Map<string, unknown> = new Map<string, unknown>();
    let asyncRemoveCatArr = new Array();
    //取出cat字段（category）不为null的数据
    for (let i = 0; i < asyncFuncList.length; i++) {
      const el = asyncFuncList[i];
      // @ts-ignore
      if (el.cat !== null) {
        if (flag) {//business first
          asyncCatArr.push(el);
        } else {//thread first
          //@ts-ignore
          if (asyncCatMap.has(`${el.cat}:${el.threadName} ${el.tid}`)) {
            //@ts-ignore
            let item: Array<unknown> = asyncCatMap.get(`${el.cat}:${el.threadName} ${el.tid}`);
            item.push(el);
          } else {
            //@ts-ignore
            asyncCatMap.set(`${el.cat}:${el.threadName} ${el.tid}`, [el]);
          }
        }
      } else {
        //取cat字段为null的数据
        asyncRemoveCatArr.push(el);
      }
    }
    asyncCat = flag ? Utils.groupBy(asyncCatArr, 'cat') : Object.fromEntries(asyncCatMap);
    return { asyncRemoveCatArr, asyncCat };
  }
  //处理cat字段为null的数据，按funname分类，分别按len>1和=1去处理
  hanldAsyncFunc(
    it: { pid: number; processName: string | null },
    asyncRemoveCatList: Array<unknown>
  ): { setArrayLenThanOne: unknown, setArrayLenOnlyOne: unknown } {
    let asyncFuncGroup = Utils.groupBy(asyncRemoveCatList, 'funName');
    let funcArr: unknown[] = [];
    let setArrayLenThanOne: unknown = {};
    let setArrayLenOnlyOne: unknown = {};
    //@ts-ignore
    Reflect.ownKeys(asyncFuncGroup).map((key: unknown) => {
      //@ts-ignore
      let asyncFunctions: Array<unknown> = asyncFuncGroup[key];
      if (asyncFunctions.length > 1) {
        //@ts-ignore
        setArrayLenThanOne[key] = asyncFunctions;
      } else if (asyncFunctions.length === 1) {
        funcArr.push(...asyncFunctions);
      }
    });
    //len=1的数据继续按tid分类
    let asyncFuncTidGroup = Utils.groupBy(funcArr, 'tid');
    //@ts-ignore
    Reflect.ownKeys(asyncFuncTidGroup).map((key: unknown) => {
      //@ts-ignore
      let asyncTidFunc: Array<unknown> = asyncFuncTidGroup[key];
      //@ts-ignore
      setArrayLenOnlyOne[`H:${asyncTidFunc[0].threadName} ${asyncTidFunc[0].tid}`] = asyncTidFunc;
    });
    return { setArrayLenThanOne, setArrayLenOnlyOne };
  }
  makeAddAsyncFunction(
    asyncFunctions: unknown[],
    it: { pid: number; processName: string | null },
    processRow: TraceRow<ProcessStruct>,
    key: string
  ): void {
    let maxDepth: number = -1;
    let i = 0;
    let mapDepth = new Map();
    let noEndData = new Array();
    let normalData = new Array();
    if (asyncFunctions.length) {
      while (i < asyncFunctions.length) {
        let param = asyncFunctions[i];
        // @ts-ignore
        if (param.dur !== null) {
          // @ts-ignore
          let itemEndTime = param.startTs + param.dur;
          let flag = false;
          for (let [key, val] of mapDepth.entries()) {
            // @ts-ignore
            if (val.et < param.startTs) {
              flag = true;
              //更新endts
              val.et = itemEndTime;
              // @ts-ignore
              param.depth = Number(key);
              break;
            }
          }
          if (!flag) {
            //depth增加
            maxDepth++;
            mapDepth.set(`${maxDepth}`, { et: itemEndTime });
            // @ts-ignore
            param.depth = maxDepth;
          }
          this.toAsyncFuncCache(param, `${key}-${it.pid}`);
          normalData.push(param);
        } else {
          noEndData.push(param);
        }
        i++;
      }
      if (noEndData.length) {
        noEndData.forEach((it: unknown, i: unknown) => {
          // @ts-ignore
          if (it.dur === -1 || it.dur === null || it.dur === undefined) {
            // @ts-ignore
            it.dur = (TraceRow.range?.endNS || 0) - it.startTs;
            // @ts-ignore
            it.nofinish = true;
            // @ts-ignore
            it.flag = 'Did not end';
          }
          let index = i;
          maxDepth++;
          // @ts-ignore
          noEndData[index].depth = maxDepth;
          //@ts-ignore
          this.toAsyncFuncCache(noEndData[index], `${key}-${it.pid}`);
        });
      }
      this.lanesConfig([...normalData, ...noEndData], it, processRow, key);
    }
  }
  //初始化异步泳道信息
  lanesConfig(
    asyncFunctions: unknown[],
    it: { pid: number; processName: string | null },
    processRow: TraceRow<ProcessStruct>,
    key: string
  ): void {
    const maxHeight = this.calMaxHeight(asyncFunctions);
    // @ts-ignore
    const namesSet = new Set(asyncFunctions.map((item) => item.funName));
    const asyncFuncName = Array.from(namesSet);
    let funcRow = TraceRow.skeleton<FuncStruct>();
    funcRow.rowId = `${key}-${it.pid}`;
    funcRow.asyncFuncName = asyncFuncName;
    funcRow.asyncFuncNamePID = it.pid;
    funcRow.rowType = TraceRow.ROW_TYPE_FUNC;
    funcRow.enableCollapseChart(FOLD_HEIGHT, this.trace); //允许折叠泳道图
    funcRow.rowParentId = `${it.pid}`;
    funcRow.rowHidden = !processRow.expansion;
    funcRow.style.width = '100%';
    funcRow.style.height = `${maxHeight}px`;
    funcRow.setAttribute('height', `${maxHeight}`);
    funcRow.name = key;
    funcRow.setAttribute('children', '');
    funcRow.findHoverStruct = (): void => {
      FuncStruct.hoverFuncStruct = funcRow.getHoverStruct();
    };
    // @ts-ignore
    funcRow.supplier = (): Promise<unknown> => new Promise((resolve) => resolve(asyncFunctions));
    funcRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
    funcRow.selectChangeHandler = this.trace.selectChangeHandler;
    funcRow.onThreadHandler = rowThreadHandler<FuncRender>(
      'func',
      'context',
      {
        type: `func-${funcRow.rowId}`,
      },
      funcRow,
      this.trace
    );
    processRow.addChildTraceRow(funcRow);
  }

  addAsyncCatFunction(it: { pid: number; processName: string | null }, processRow: TraceRow<ProcessStruct>): void {
    //@ts-ignore
    let asyncFuncCatList = this.processAsyncFuncCatMap[it.pid] || [];
    let asyncFuncGroup: unknown = Utils.groupBy(asyncFuncCatList, 'threadName');
    //@ts-ignore  
    Reflect.ownKeys(asyncFuncGroup).map((key: unknown) => {
      //@ts-ignore 
      let asyncFunctions: Array<unknown> = asyncFuncGroup[key];
      if (asyncFunctions.length > 0) {
        let isIntersect = (a: unknown, b: unknown): boolean =>
          //@ts-ignore  
          Math.max(a.startTs + a.dur, b.startTs + b.dur) - Math.min(a.startTs, b.startTs) < a.dur + b.dur;
        let depthArray: unknown = [];
        asyncFunctions.forEach((it, i) => {
          //@ts-ignore
          if (it.dur === -1 || it.dur === null || it.dur === undefined) {
            //@ts-ignore
            it.dur = (TraceRow.range?.endNS || 0) - it.startTs;
            //@ts-ignore
            it.flag = 'Did not end';
            //@ts-ignore
            it.nofinish = true;
          }
          let currentDepth = 0;
          let index = i;
          //@ts-ignore
          while (depthArray[currentDepth] !== undefined && isIntersect(depthArray[currentDepth], asyncFunctions[index])) {
            currentDepth++;
          }//@ts-ignore
          asyncFunctions[index].depth = currentDepth;
          //@ts-ignore
          depthArray[currentDepth] = asyncFunctions[index];
          //@ts-ignore
          this.toAsyncFuncCache(asyncFunctions[index], `${asyncFunctions[0].threadName}`);
        });
        const maxHeight = this.calMaxHeight(asyncFunctions);
        let funcRow = TraceRow.skeleton<FuncStruct>();
        //@ts-ignore
        funcRow.rowId = `${asyncFunctions[0].threadName}`;
        //@ts-ignore
        funcRow.asyncFuncThreadName = asyncFunctions[0].threadName;
        funcRow.asyncFuncNamePID = it.pid;
        funcRow.rowType = TraceRow.ROW_TYPE_FUNC;
        funcRow.enableCollapseChart(FOLD_HEIGHT, this.trace);
        //允许折叠泳道图
        funcRow.rowParentId = `${it.pid}`;
        funcRow.rowHidden = !processRow.expansion;
        funcRow.style.width = '100%';
        funcRow.style.height = `${maxHeight}px`;
        funcRow.setAttribute('height', `${maxHeight}`);
        //@ts-ignore
        funcRow.name = `${asyncFunctions[0].threadName}`;
        funcRow.setAttribute('children', '');
        funcRow.findHoverStruct = (): void => {
          FuncStruct.hoverFuncStruct = funcRow.getHoverStruct();
        };
        //@ts-ignore  
        funcRow.supplier = (): Promise<unknown> => new Promise((resolve) => resolve(asyncFunctions));
        funcRow.favoriteChangeHandler = this.trace.favoriteChangeHandler;
        funcRow.selectChangeHandler = this.trace.selectChangeHandler;
        funcRow.onThreadHandler = rowThreadHandler<FuncRender>('func', 'context', {
          //@ts-ignore
          type: `func-${asyncFunctions[0].threadName}-${it.pid}`,
        }, funcRow, this.trace);
        processRow.addChildTraceRow(funcRow);
      }
    });
  }
}
