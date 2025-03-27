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

import {
  LogicHandler,
  ChartStruct,
  convertJSON,
  DataCache,
  HiPerfSymbol,
  PerfCall,
} from './ProcedureLogicWorkerCommon';
import { PerfBottomUpStruct } from '../../bean/PerfBottomUpStruct';
import { SelectionParam } from '../../bean/BoxSelection';
import { dealAsyncData } from './ProcedureLogicWorkerCommon';

const systemRuleName: string = '/system/';
const numRuleName: string = '/max/min/';
const maxDepth: number = 256;

type PerfThreadMap = {
  [pid: string]: PerfThread;
};
type PerfCallChainMap = {
  [id: number]: PerfCallChain[];
};
type FileMap = {
  [id: number]: PerfFile[];
};

type MergeMap = {
  [id: string]: PerfCallChainMerageData;
};

type spiltMap = {
  [id: string]: PerfCallChainMerageData[];
};

export class ProcedureLogicWorkerPerf extends LogicHandler {
  filesData: FileMap = {};
  samplesData: Array<PerfCountSample> = [];
  threadData: PerfThreadMap = {};
  callChainData: PerfCallChainMap = {};
  splitMapData: spiltMap = {};
  currentTreeMapData: MergeMap = {};
  currentTreeList: PerfCallChainMerageData[] = [];
  searchValue: string = '';
  dataSource: PerfCallChainMerageData[] = [];
  allProcess: PerfCallChainMerageData[] = [];
  currentEventId: string = '';
  isAnalysis: boolean = false;
  isPerfBottomUp: boolean = false;
  isHideThread: boolean = false;
  isHideThreadState: boolean = false;
  isOnlyKernel: boolean = false;
  private lib: object | undefined;
  private symbol: object | undefined;
  private dataCache = DataCache.getInstance();
  private isTopDown: boolean = true;
  // 应对当depth为0是的结构变化后的数据还原
  private forkAllProcess: PerfCallChainMerageData[] = [];
  private lineMap: Map<string, Set<number>> = new Map<string, Set<number>>();

  handle(data: unknown): void {
    //@ts-ignore
    this.currentEventId = data.id;
    //@ts-ignore
    if (data && data.type) {
      //@ts-ignore
      switch (data.type) {
        case 'perf-init':
          //@ts-ignore
          this.dataCache.perfCountToMs = data.params.fValue;
          this.initPerfFiles();
          break;
        case 'perf-queryPerfFiles':
          //@ts-ignore
          this.perfQueryPerfFiles(data.params.list);
          break;
        case 'perf-queryPerfThread':
          //@ts-ignore
          this.perfQueryPerfThread(data.params.list);
          break;
        case 'perf-queryPerfCalls':
          //@ts-ignore
          this.perfQueryPerfCalls(data.params.list);
          break;
        case 'perf-queryPerfCallchains':
          this.perfQueryPerfCallchains(data);
          break;
        case 'perf-analysis':
          this.getAnalysisData(data);
          break;
        case 'perf-bottomUp':
          this.getBottomUpData(data);
          break;
        case 'perf-profile':
          this.getProfileData(data);
          break;
        case 'perf-action':
          this.perfAction(data);
          break;
        case 'perf-vaddr-back':
          this.rebackVaddrList(data);
          break;
        case 'perf-vaddr':
          this.perfGetVaddr(data);
          break;
        case 'perf-reset':
          this.perfReset();
          break;
        case 'perf-async':
          this.perfAsync(data);
          break;
      }
    }
  }

  private getAnalysisData(data: unknown): void {
    //@ts-ignore
    this.samplesData = convertJSON(data.params.list) || [];
    let result;
    result = this.resolvingAction([
      {
        funcName: 'combineAnalysisCallChain',
        funcArgs: [true],
      },
    ]),
      self.postMessage({
        //@ts-ignore
        id: data.id,
        //@ts-ignore
        action: data.action,
        // @ts-ignore
        results: result,
      });
  }

  private getBottomUpData(data: unknown): void {
    //@ts-ignore
    this.samplesData = convertJSON(data.params.list) || [];
    let result;
    result = this.resolvingAction([
      {
        funcName: 'getBottomUp',
        funcArgs: [true],
      },
    ]);
    self.postMessage({
      //@ts-ignore
      id: data.id,
      //@ts-ignore
      action: data.action,
      // @ts-ignore
      results: result,
    });
  }

  private getProfileData(data: unknown): void {
    //@ts-ignore
    this.samplesData = convertJSON(data.params.list) || [];
    let result;
    if (this.lib) {
      let libData = this.combineCallChainForAnalysis(this.lib);
      this.freshPerfCallchains(libData, this.isTopDown);
      result = this.allProcess;
      this.lib = undefined;
    } else if (this.symbol) {
      let funData = this.combineCallChainForAnalysis(this.symbol);
      this.freshPerfCallchains(funData, this.isTopDown);
      result = this.allProcess;
      this.symbol = undefined;
    } else {
      result = this.resolvingAction([
        {
          funcName: 'getCallChainsBySampleIds',
          funcArgs: [this.isTopDown],
        },
      ]);
    }
    self.postMessage({
      //@ts-ignore
      id: data.id,
      //@ts-ignore
      action: data.action,
      // @ts-ignore
      results: result,
    });
  }

  private perfQueryPerfFiles(list: Array<PerfFile>): void {
    let files = convertJSON(list) || [];
    //@ts-ignore
    files.forEach((file: PerfFile) => {
      this.filesData[file.fileId] = this.filesData[file.fileId] || [];
      PerfFile.setFileName(file);
      this.filesData[file.fileId].push(file);
    });
    this.initPerfThreads();
  }
  private perfQueryPerfThread(list: Array<PerfThread>): void {
    let threads = convertJSON(list) || [];
    //@ts-ignore
    threads.forEach((thread: PerfThread): void => {
      this.threadData[thread.tid] = thread;
    });
    this.initPerfCalls();
  }
  private perfQueryPerfCalls(list: Array<PerfCall>): void {
    let perfCalls = convertJSON(list) || [];
    if (perfCalls.length !== 0) {
      //@ts-ignore
      perfCalls.forEach((perfCall: PerfCall): void => {
        this.dataCache.perfCallChainMap.set(perfCall.sampleId, perfCall);
      });
    }
    this.initPerfCallchains();
  }
  private perfQueryPerfCallchains(data: unknown): void {
    //@ts-ignore
    let arr = convertJSON(data.params.list) || [];
    this.initPerfCallChainTopDown(arr as PerfCallChain[]);

    self.postMessage({
      // @ts-ignore
      id: data.id,
      // @ts-ignore
      action: data.action,
      results: this.dataCache.perfCallChainMap,
    });
  }
  private perfQueryCallchainsGroupSample(data: unknown): void {
    //@ts-ignore
    this.samplesData = convertJSON(data.params.list) || [];
    let result;
    if (this.isAnalysis) {
      result = this.resolvingAction([
        {
          funcName: 'combineAnalysisCallChain',
          funcArgs: [true],
        },
      ]);
    } else if (this.isPerfBottomUp) {
      result = this.resolvingAction([
        {
          funcName: 'getBottomUp',
          funcArgs: [true],
        },
      ]);
    } else {
      if (this.lib) {
        let libData = this.combineCallChainForAnalysis(this.lib);
        this.freshPerfCallchains(libData, this.isTopDown);
        result = this.allProcess;
        this.lib = undefined;
      } else if (this.symbol) {
        let funData = this.combineCallChainForAnalysis(this.symbol);
        this.freshPerfCallchains(funData, this.isTopDown);
        result = this.allProcess;
        this.symbol = undefined;
      } else {
        result = this.resolvingAction([
          {
            funcName: 'getCallChainsBySampleIds',
            funcArgs: [this.isTopDown],
          },
        ]);
      }
    }
    self.postMessage({
      //@ts-ignore
      id: data.id,
      //@ts-ignore
      action: data.action,
      results: result,
    });
    if (this.isAnalysis) {
      this.isAnalysis = false;
    }
  }

  rebackVaddrList(data: unknown): void {
    // @ts-ignore
    let vaddrCallchainList = convertJSON(data.params.list);
    let sampleCallChainList: unknown = [];
    for (let i = 0; i < vaddrCallchainList.length; i++) {
      let funcVaddrLastItem = {};
      // @ts-ignore
      let callChains = [...this.callChainData[vaddrCallchainList[i].callchain_id]];
      const lastCallChain = callChains[callChains.length - 1];
      // @ts-ignore
      funcVaddrLastItem.callchain_id = lastCallChain.sampleId;
      // @ts-ignore
      funcVaddrLastItem.symbolName = this.dataCache.dataDict.get(lastCallChain.name as number);
      // @ts-ignore
      funcVaddrLastItem.vaddrInFile = lastCallChain.vaddrInFile;
      // @ts-ignore
      funcVaddrLastItem.offsetToVaddr = lastCallChain.offsetToVaddr;
      // @ts-ignore
      funcVaddrLastItem.process_id = vaddrCallchainList[i].process_id;
      // @ts-ignore
      funcVaddrLastItem.thread_id = vaddrCallchainList[i].thread_id;
      // @ts-ignore
      funcVaddrLastItem.libName = lastCallChain.fileName;
      // @ts-ignore
      sampleCallChainList.push(funcVaddrLastItem);
    }

    self.postMessage({
      //@ts-ignore
      id: data.id,
      //@ts-ignore
      action: data.action,
      results: sampleCallChainList,
    });
  }

  private perfAction(data: unknown): void {
    //@ts-ignore
    const params = data.params;
    if (params) {
      let filter = params.filter((item: { funcName: string }): boolean => item.funcName === 'getCurrentDataFromDbBottomUp' ||
        item.funcName === 'getCurrentDataFromDbProfile' || item.funcName === 'getCurrentDataFromDbAnalysis');
      let libFilter = params.filter((item: { funcName: string }): boolean => item.funcName === 'showLibLevelData');
      let funFilter = params.filter((item: { funcName: string }): boolean => item.funcName === 'showFunLevelData');
      if (libFilter.length !== 0) {
        this.setLib(libFilter);
      }
      if (funFilter.length !== 0) {
        this.setSymbol(funFilter);
      }
      if (filter.length === 0) {
        let result = this.calReturnData(params);
        self.postMessage({
          //@ts-ignore
          id: data.id,
          //@ts-ignore
          action: data.action,
          results: result,
        });
      } else {
        this.resolvingAction(params);
      }
    }
  }

  private perfGetVaddr(data: unknown): void {
    // @ts-ignore
    const params = data.params;
    this.backVaddrData(data);
  }

  backVaddrData(data: unknown): void {
    // @ts-ignore
    this.handleDataByFuncName(data.params[0].funcName, data.params[0].funcArgs);
  }

  private perfReset(): void {
    this.isHideThread = false;
    this.isHideThreadState = false;
    this.isTopDown = true;
    this.isOnlyKernel = false;
  }

  private perfAsync(data: unknown): void {
    //@ts-ignore
    if (data.params.list) {
      // 若前端存储过调用栈信息与被调用栈信息，可考虑从此处一起返回给主线程
      //@ts-ignore
      let arr = convertJSON(data.params.list) || [];
      //@ts-ignore
      let result = dealAsyncData(arr, this.callChainData, this.dataCache.nmHeapFrameMap, this.dataCache.dataDict, this.searchValue);
      this.searchValue = '';
      self.postMessage({
        //@ts-ignore
        id: data.id,
        //@ts-ignore
        action: data.action,
        results: result,
      });
      arr = [];
      result = [];
    } else {
      //@ts-ignore
      this.searchValue = data.params.searchValue.toLocaleLowerCase();
      //@ts-ignore
      this.queryPerfAsync(data.params);
    }
  }

  private setLib(libFilter: unknown): void {
    this.lib = {
      //@ts-ignore
      libId: libFilter[0].funcArgs[0],
      //@ts-ignore
      libName: libFilter[0].funcArgs[1],
    };
  }
  private setSymbol(funFilter: unknown): void {
    this.symbol = {
      //@ts-ignore
      symbolId: funFilter[0].funcArgs[0],
      //@ts-ignore
      symbolName: funFilter[0].funcArgs[1],
    };
  }
  private calReturnData(params: unknown): Array<unknown> {
    let result: unknown[];
    //@ts-ignore
    let callChainsFilter = params.filter(
      (item: { funcName: string }): boolean => item.funcName === 'getCallChainsBySampleIds'
    );
    callChainsFilter.length > 0 ? (this.isTopDown = callChainsFilter[0].funcArgs[0]) : (this.isTopDown = true);
    //@ts-ignore
    let isHideSystemSoFilter = params.filter(
      (item: { funcName: string }): boolean => item.funcName === 'hideSystemLibrary'
    );
    //@ts-ignore
    let hideThreadFilter = params.filter((item: { funcName: string }): boolean => item.funcName === 'hideThread');
    //@ts-ignore
    let hideThreadStateFilter = params.filter(
      (item: { funcName: string }): boolean => item.funcName === 'hideThreadState'
    );
    //@ts-ignore
    let onlyKernelFilter = [true];
    if (this.lib) {
      if (
        callChainsFilter.length > 0 ||
        isHideSystemSoFilter.length > 0 ||
        hideThreadFilter.length > 0 ||
        hideThreadStateFilter.length > 0 ||
        onlyKernelFilter.length > 0
      ) {
        this.samplesData = this.combineCallChainForAnalysis(this.lib);
        //@ts-ignore
        result = this.resolvingAction(params);
      } else {
        let libData = this.combineCallChainForAnalysis(this.lib);
        this.freshPerfCallchains(libData, this.isTopDown);
        result = this.allProcess;
        this.lib = undefined;
      }
    } else if (this.symbol) {
      if (
        callChainsFilter.length > 0 ||
        isHideSystemSoFilter.length > 0 ||
        hideThreadFilter.length > 0 ||
        hideThreadStateFilter.length > 0 ||
        onlyKernelFilter.length > 0
      ) {
        this.samplesData = this.combineCallChainForAnalysis(this.symbol);
        //@ts-ignore
        result = this.resolvingAction(params);
      } else {
        let funData = this.combineCallChainForAnalysis(this.symbol);
        this.freshPerfCallchains(funData, this.isTopDown);
        result = this.allProcess;
        this.symbol = undefined;
      }
    } else {
      //@ts-ignore
      result = this.resolvingAction(params);
    }
    return result;
  }
  initPerfFiles(): void {
    this.clearAll();
    this.queryData(
      this.currentEventId,
      'perf-queryPerfFiles',
      `select file_id as fileId, symbol, path
       from perf_files`,
      {}
    );
  }

  initPerfThreads(): void {
    this.queryData(
      this.currentEventId,
      'perf-queryPerfThread',
      `select a.thread_id as tid, a.thread_name as threadName, a.process_id as pid, b.thread_name as processName
       from perf_thread a
                left join (select * from perf_thread where thread_id = process_id) b on a.process_id = b.thread_id`,
      {}
    );
  }

  initPerfCalls(): void {
    this.queryData(
      this.currentEventId,
      'perf-queryPerfCalls',
      `select count(callchain_id) as depth, callchain_id as sampleId, name
       from perf_callchain
       where callchain_id != -1
       group by callchain_id`,
      {}
    );
  }

  initPerfCallchains(): void {
    this.queryData(
      this.currentEventId,
      'perf-queryPerfCallchains',
      `select c.name,
              c.callchain_id  as sampleId,
              c.vaddr_in_file as vaddrInFile,
              c.offset_to_vaddr as offsetToVaddr,
              c.file_id       as fileId,
              c.depth,
              c.symbol_id     as symbolId,
              c.source_file_id as sourceFileId,
              c.line_number as lineNumber
       from perf_callchain c
       where callchain_id != -1;`,
      {}
    );
  }

  queryPerfAsync(args: unknown): void {
    let str: string = ``;
    //@ts-ignore
    if (args.cpu.length > 0) {
      //@ts-ignore
      str += `or cpu_id in (${args.cpu.join(',')})`;
    }
    //@ts-ignore
    if (args.tid.length > 0) {
      //@ts-ignore
      str += `or tid in (${args.tid.join(',')})`;
    }
    //@ts-ignore
    if (args.pid.length > 0) {
      //@ts-ignore
      str += `or process_id in (${args.pid.join(',')})`;
    }
    str = str.slice(3);
    let eventStr: string = ``;
    //@ts-ignore
    if (args.eventId) {
      //@ts-ignore
      eventStr = `AND eventTypeId = ${args.eventId}`;
    }
    this.queryData(this.currentEventId, 'perf-async', `
    select 
      ts - R.start_ts as time,
      traceid,
      thread_id as tid,
      process_id as pid,
      caller_callchainid as callerCallchainid,
      callee_callchainid as calleeCallchainid,
      perf_sample_id as perfSampleId,
      event_count as eventCount,
      event_type_id as eventTypeId
    from 
      perf_napi_async A, trace_range R
    WHERE 
      (` + str + `)` + eventStr + `
    AND
      time between ${
      //@ts-ignore
      args.leftNs} and ${args.rightNs} 
    `, {});
  }

  /**
   *
   * @param selectionParam
   * @param sql 从饼图进程或者线程层点击进入Perf Profile时传入
   */
  private getCurrentDataFromDb(selectionParam: SelectionParam, flag: string, sql?: string): void {
    let filterSql = this.setFilterSql(selectionParam, sql);
    this.queryData(
      this.currentEventId,
      `${flag}`,
      `select p.callchain_id as sampleId,
          p.thread_state as threadState,
          p.thread_id    as tid,
          p.count as count,
          p.process_id   as pid,
          p.event_count  as eventCount,
          p.ts as ts,
          p.event_type_id as eventTypeId
      from (select callchain_id, s.thread_id, s.event_type_id, thread_state, process_id, 
                count(callchain_id) as count,SUM(event_count) as event_count,
                group_concat(s.timestamp_trace - t.start_ts,',') as ts
            from perf_sample s, trace_range t
            left join perf_thread thread on s.thread_id = thread.thread_id
            where timestamp_trace between ${selectionParam.leftNs} + t.start_ts
            and ${selectionParam.rightNs} + t.start_ts
            and callchain_id != -1
            and s.thread_id != 0 ${filterSql}
            group by callchain_id, s.thread_id, thread_state, process_id) p`,
      {
        $startTime: selectionParam.leftNs,
        $endTime: selectionParam.rightNs,
        $sql: filterSql,
      }
    );
  }

  private setFilterSql(selectionParam: SelectionParam, sql?: string): string {
    let filterSql = '';
    if (sql) {
      const cpus = selectionParam.perfAll ? [] : selectionParam.perfCpus;
      const cpuFilter = cpus.length > 0 ? ` and s.cpu_id in (${cpus.join(',')}) ` : '';
      let arg = `${sql}${cpuFilter}`.substring(3);
      filterSql = `and ${arg}`;
    } else {
      const cpus = selectionParam.perfAll ? [] : selectionParam.perfCpus;
      const processes = selectionParam.perfAll ? [] : selectionParam.perfProcess;
      const threads = selectionParam.perfAll ? [] : selectionParam.perfThread;
      if (cpus.length !== 0 || processes.length !== 0 || threads.length !== 0) {
        const cpuFilter = cpus.length > 0 ? `or s.cpu_id in (${cpus.join(',')}) ` : '';
        const processFilter = processes.length > 0 ? `or thread.process_id in (${processes.join(',')}) ` : '';
        const threadFilter = threads.length > 0 ? `or s.thread_id in (${threads.join(',')})` : '';
        let arg = `${cpuFilter}${processFilter}${threadFilter}`.substring(3);
        filterSql = ` and (${arg})`;
      }
    }
    let eventTypeId = selectionParam.perfEventTypeId;
    const eventTypeFilter = eventTypeId !== undefined ? ` and s.event_type_id = ${eventTypeId}` : '';
    filterSql += eventTypeFilter;
    return filterSql;
  }

  clearAll(): void {
    this.filesData = {};
    this.samplesData = [];
    this.threadData = {};
    this.callChainData = {};
    this.splitMapData = {};
    this.currentTreeMapData = {};
    this.currentTreeList = [];
    this.searchValue = '';
    this.dataSource = [];
    this.allProcess = [];
    this.dataCache.clearPerf();
  }

  initPerfCallChainTopDown(callChains: PerfCallChain[]): void {
    this.callChainData = {};
    callChains.forEach((callChain: PerfCallChain, index: number): void => {
      if (callChain.sourceFileId) {
        const sourceFile = DataCache.getInstance().dataDict.get(callChain.sourceFileId) || '';
        const symbolName = DataCache.getInstance().dataDict.get(callChain.name as number) || '';
        let lines = this.lineMap.get(`${sourceFile}_${symbolName}`);
        if (lines === undefined) {
          lines = new Set<number>();
          this.lineMap.set(`${sourceFile}_${symbolName}`, lines);
        }
        lines.add(callChain.lineNumber);
      }
      this.setPerfCallChainFrameName(callChain);
      this.addPerfGroupData(callChain);
      let callChainDatum = this.callChainData[callChain.sampleId];
      if (callChainDatum.length > 1) {
        PerfCallChain.setNextNode(callChainDatum[callChainDatum.length - 2], callChainDatum[callChainDatum.length - 1]);
      }
    });
  }

  setPerfCallChainFrameName(callChain: PerfCallChain): void {
    //设置调用栈的名称
    callChain.canCharge = true;
    if (this.filesData[callChain.fileId] && this.filesData[callChain.fileId].length > 0) {
      callChain.fileName = this.filesData[callChain.fileId][0].fileName;
      callChain.path = this.filesData[callChain.fileId][0].path;
    } else {
      callChain.fileName = 'unknown';
    }
  }

  addPerfGroupData(callChain: PerfCallChain): void {
    const currentCallChain = this.callChainData[callChain.sampleId] || [];
    this.callChainData[callChain.sampleId] = currentCallChain;
    if (currentCallChain.length > maxDepth) {
      currentCallChain.splice(0, 1);
    }
    currentCallChain.push(callChain);
  }

  addOtherCallchainsData(countSample: PerfCountSample, list: PerfCallChain[]): void {
    let threadCallChain = new PerfCallChain(); //新增的线程数据
    threadCallChain.tid = countSample.tid;
    threadCallChain.canCharge = false;
    threadCallChain.isThread = true;
    threadCallChain.name = `${this.threadData[countSample.tid].threadName || 'Thread'}(${countSample.tid})`;
    let threadStateCallChain = new PerfCallChain(); //新增的线程状态数据
    threadStateCallChain.tid = countSample.tid;
    threadStateCallChain.isThreadState = true;
    threadStateCallChain.name = countSample.threadState || 'Unknown State';
    threadStateCallChain.fileName = threadStateCallChain.name === '-' ? 'Unknown Thread State' : '';
    threadStateCallChain.canCharge = false;
    if (!this.isHideThreadState) {
      list.unshift(threadStateCallChain);
    }
    if (!this.isHideThread) {
      list.unshift(threadCallChain);
    }

    if (this.isOnlyKernel) {
      const flag = '[kernel.kallsyms]';
      const newList = list.filter(i => i.fileName === flag || i.path === flag);
      list.splice(0);
      list.push(...newList);
    }
  }

  private freshPerfCallchains(perfCountSamples: PerfCountSample[], isTopDown: boolean): void {
    this.currentTreeMapData = {};
    this.currentTreeList = [];
    let totalSamplesCount = 0;
    let totalEventCount = 0;
    perfCountSamples.forEach((perfSample): void => {
      totalSamplesCount += perfSample.count;
      totalEventCount += perfSample.eventCount;
      if (this.callChainData[perfSample.sampleId] && this.callChainData[perfSample.sampleId].length > 0) {
        let perfCallChains = [...this.callChainData[perfSample.sampleId]];
        this.addOtherCallchainsData(perfSample, perfCallChains);
        let topIndex = isTopDown ? 0 : perfCallChains.length - 1;
        if (perfCallChains.length > 0) {
          let symbolName = '';
          if (typeof perfCallChains[topIndex].name === 'number') {
            //@ts-ignore
            symbolName = this.dataCache.dataDict.get(perfCallChains[topIndex].name) || '';
          } else {
            //@ts-ignore
            symbolName = perfCallChains[topIndex].name;
          }
          // 只展示内核栈合并进程栈
          const usePidAsKey = this.isOnlyKernel ? '' : perfSample.pid;
          let perfRootNode = this.currentTreeMapData[symbolName + usePidAsKey];
          if (perfRootNode === undefined) {
            perfRootNode = new PerfCallChainMerageData();
            this.currentTreeMapData[symbolName + usePidAsKey] = perfRootNode;
            this.currentTreeList.push(perfRootNode);
          }
          PerfCallChainMerageData.merageCallChainSample(perfRootNode, perfCallChains[topIndex], perfSample, false, this.lineMap);
          this.mergeChildrenByIndex(perfRootNode, perfCallChains, topIndex, perfSample, isTopDown);
        }
      }
    });
    let rootMerageMap = this.mergeNodeData(totalEventCount, totalSamplesCount);
    this.handleCurrentTreeList(totalEventCount, totalSamplesCount);
    this.allProcess = Object.values(rootMerageMap);
    // 浅拷贝
    this.forkAllProcess = this.allProcess.slice();
  }
  private mergeNodeData(totalEventCount: number, totalSamplesCount: number): MergeMap {
    // 只展示内核栈不添加进程这一级的结构
    if (this.isOnlyKernel) {
      return this.currentTreeMapData;
    }
    // 添加进程级结构
    let rootMerageMap: MergeMap = {};
    // @ts-ignore
    Object.values(this.currentTreeMapData).forEach((merageData: PerfCallChainMerageData): void => {
      if (rootMerageMap[merageData.pid] === undefined) {
        let perfProcessMerageData = new PerfCallChainMerageData(); //新增进程的节点数据
        perfProcessMerageData.canCharge = false;
        perfProcessMerageData.symbolName =
          (this.threadData[merageData.tid].processName || 'Process') + `(${merageData.pid})`;
        perfProcessMerageData.isProcess = true;
        perfProcessMerageData.symbol = perfProcessMerageData.symbolName;
        perfProcessMerageData.tid = merageData.tid;
        perfProcessMerageData.children.push(merageData);
        perfProcessMerageData.initChildren.push(merageData);
        perfProcessMerageData.dur = merageData.dur;
        perfProcessMerageData.count = merageData.dur;
        perfProcessMerageData.eventCount = merageData.eventCount;
        perfProcessMerageData.total = totalSamplesCount;
        perfProcessMerageData.totalEvent = totalEventCount;
        perfProcessMerageData.tsArray = [...merageData.tsArray];
        rootMerageMap[merageData.pid] = perfProcessMerageData;
      } else {
        rootMerageMap[merageData.pid].children.push(merageData);
        rootMerageMap[merageData.pid].initChildren.push(merageData);
        rootMerageMap[merageData.pid].dur += merageData.dur;
        rootMerageMap[merageData.pid].count += merageData.dur;
        rootMerageMap[merageData.pid].eventCount += merageData.eventCount;
        rootMerageMap[merageData.pid].total = totalSamplesCount;
        rootMerageMap[merageData.pid].totalEvent = totalEventCount;
        for (const ts of merageData.tsArray) {
          rootMerageMap[merageData.pid].tsArray.push(ts);
        }
      }
      merageData.parentNode = rootMerageMap[merageData.pid]; //子节点添加父节点的引用
    });
    return rootMerageMap;
  }
  private handleCurrentTreeList(totalEventCount: number, totalSamplesCount: number): void {
    let id = 0;
    this.currentTreeList.forEach((perfTreeNode: PerfCallChainMerageData): void => {
      perfTreeNode.total = totalSamplesCount;
      perfTreeNode.totalEvent = totalEventCount;
      if (perfTreeNode.id === '') {
        perfTreeNode.id = id + '';
        id++;
      }
      if (perfTreeNode.parentNode) {
        if (perfTreeNode.parentNode.id === '') {
          perfTreeNode.parentNode.id = id + '';
          id++;
        }
        perfTreeNode.parentId = perfTreeNode.parentNode.id;
      }
    });
  }

  mergeChildrenByIndex(
    currentNode: PerfCallChainMerageData,
    callChainDataList: PerfCallChain[],
    index: number,
    sample: PerfCountSample,
    isTopDown: boolean
  ): void {
    if ((isTopDown && index >= callChainDataList.length - 1) || (!isTopDown && index <= 0)) {
      return;
    }
    isTopDown ? index++ : index--;
    let isEnd = isTopDown ? callChainDataList.length === index + 1 : index === 0;
    let node: PerfCallChainMerageData;
    if (
      currentNode.initChildren.filter((child: PerfCallChainMerageData): boolean => {
        let name: number | string | undefined = callChainDataList[index].name;
        if (typeof name === 'number') {
          name = this.dataCache.dataDict.get(name);
        }
        if (child.symbolName === name) {
          node = child;
          PerfCallChainMerageData.merageCallChainSample(child, callChainDataList[index], sample, isEnd, this.lineMap);
          return true;
        }
        return false;
      }).length === 0
    ) {
      node = new PerfCallChainMerageData();
      PerfCallChainMerageData.merageCallChainSample(node, callChainDataList[index], sample, isEnd, this.lineMap);
      currentNode.children.push(node);
      currentNode.initChildren.push(node);
      this.currentTreeList.push(node);
      node.parentNode = currentNode;
    }
    if (node! && !isEnd) {
      this.mergeChildrenByIndex(node, callChainDataList, index, sample, isTopDown);
    }
  }

  //所有的操作都是针对整个树结构的 不区分特定的数据
  splitPerfTree(samples: PerfCallChainMerageData[], name: string, isCharge: boolean, isSymbol: boolean): void {
    samples.forEach((process: PerfCallChainMerageData): void => {
      process.children = [];
      if (isCharge) {
        this.recursionPerfChargeInitTree(process, name, isSymbol);
      } else {
        this.recursionPerfPruneInitTree(process, name, isSymbol);
      }
    });
    this.resetAllNode(samples);
  }

  recursionPerfChargeInitTree(sample: PerfCallChainMerageData, symbolName: string, isSymbol: boolean): void {
    if ((isSymbol && sample.symbolName === symbolName) || (!isSymbol && sample.libName === symbolName)) {
      (this.splitMapData[symbolName] = this.splitMapData[symbolName] || []).push(sample);
      sample.isStore++;
    }
    if (sample.initChildren.length > 0) {
      sample.initChildren.forEach((child: PerfCallChainMerageData): void => {
        this.recursionPerfChargeInitTree(child, symbolName, isSymbol);
      });
    }
  }

  recursionPerfPruneInitTree(node: PerfCallChainMerageData, symbolName: string, isSymbol: boolean): void {
    if ((isSymbol && node.symbolName === symbolName) || (!isSymbol && node.libName === symbolName)) {
      (this.splitMapData[symbolName] = this.splitMapData[symbolName] || []).push(node);
      node.isStore++;
      this.pruneChildren(node, symbolName);
    } else if (node.initChildren.length > 0) {
      node.initChildren.forEach((child): void => {
        this.recursionPerfPruneInitTree(child, symbolName, isSymbol);
      });
    }
  }

  //symbol lib prune
  recursionPruneTree(sample: PerfCallChainMerageData, symbolName: string, isSymbol: boolean): void {
    if ((isSymbol && sample.symbolName === symbolName) || (!isSymbol && sample.libName === symbolName)) {
      sample.parent && sample.parent.children.splice(sample.parent.children.indexOf(sample), 1);
    } else {
      sample.children.forEach((child: PerfCallChainMerageData): void => {
        this.recursionPruneTree(child, symbolName, isSymbol);
      });
    }
  }

  recursionChargeByRule(
    sample: PerfCallChainMerageData,
    ruleName: string,
    rule: (node: PerfCallChainMerageData) => boolean
  ): void {
    if (sample.initChildren.length > 0) {
      sample.initChildren.forEach((child): void => {
        if (rule(child) && !child.isThread && !child.isState) {
          (this.splitMapData[ruleName] = this.splitMapData[ruleName] || []).push(child);
          child.isStore++;
        }
        this.recursionChargeByRule(child, ruleName, rule);
      });
    }
  }

  pruneChildren(sample: PerfCallChainMerageData, symbolName: string): void {
    if (sample.initChildren.length > 0) {
      sample.initChildren.forEach((child: PerfCallChainMerageData): void => {
        child.isStore++;
        (this.splitMapData[symbolName] = this.splitMapData[symbolName] || []).push(child);
        this.pruneChildren(child, symbolName);
      });
    }
  }

  hideSystemLibrary(): void {
    this.allProcess.forEach((item: PerfCallChainMerageData): void => {
      item.children = [];
      this.recursionChargeByRule(item, systemRuleName, (node: PerfCallChainMerageData): boolean => {
        return node.path.startsWith(systemRuleName);
      });
    });
  }

  hideNumMaxAndMin(startNum: number, endNum: string): void {
    let max = endNum === '∞' ? Number.POSITIVE_INFINITY : parseInt(endNum);
    this.allProcess.forEach((item: PerfCallChainMerageData): void => {
      item.children = [];
      // only kernel模式下第0层结构为调用栈，也需要变化
      if (this.isOnlyKernel && (item.dur < startNum || item.dur > max)) {
        (this.splitMapData[numRuleName] = this.splitMapData[numRuleName] || []).push(item);
        item.isStore++;
      }
      this.recursionChargeByRule(item, numRuleName, (node: PerfCallChainMerageData): boolean => {
        return node.dur < startNum || node.dur > max;
      });
    });
  }

  clearSplitMapData(symbolName: string): void {
    if (symbolName in this.splitMapData) {
      Reflect.deleteProperty(this.splitMapData, symbolName);
    }
  }

  resetAllSymbol(symbols: string[]): void {
    // 浅拷贝取出备份数据
    this.allProcess = this.forkAllProcess.slice();
    symbols.forEach((symbol: string): void => {
      let list = this.splitMapData[symbol];
      if (list !== undefined) {
        list.forEach((item: PerfCallChainMerageData): void => {
          item.isStore--;
        });
      }
    });
  }


  clearSearchNode(): void {
    this.currentTreeList.forEach((sample: PerfCallChainMerageData): void => {
      sample.searchShow = true;
      sample.isSearch = false;
    });
  }

  resetAllNode(sample: PerfCallChainMerageData[]): void {
    this.allProcess = this.forkAllProcess.slice();
    if (this.isOnlyKernel) {
      this.markSearchNode(this.allProcess, this.searchValue, false);
      this.resetNewAllNode(sample);
    } else {
      this.clearSearchNode();
      sample.forEach((process: PerfCallChainMerageData): void => {
        process.searchShow = true;
        process.isSearch = false;
      });
      this.resetNewAllNode(sample);
      if (this.searchValue !== '') {
        this.markSearchNode(sample, this.searchValue, false);
        this.resetNewAllNode(sample);
      }
    }
  }

  /**
   * 重置所有节点的子节点列表，并根据条件重新构建子节点列表
   * 此函数旨在清理和重新组织 PerfCallChainMerageData 类型的样本数组中的节点关系
   * 它通过移除某些节点并重新分配子节点来更新树结构
   *
   * @param sampleArray - lastShowNode
   */
  resetNewAllNode(sampleArray: PerfCallChainMerageData[]): void {
    sampleArray.forEach((process: PerfCallChainMerageData): void => {
      process.children = [];
    });
    let values = this.currentTreeList.map((item: PerfCallChainMerageData): PerfCallChainMerageData => {
      item.children = [];
      return item;
    });
    // 记录待删除的节点索引
    const removeList: number[] = [];
    // 用于记录所有有效的子节点
    const effectChildList: PerfCallChainMerageData[] = [];
    for (const sample of values) {
      if (sample.parentNode !== undefined && sample.isStore === 0 && sample.searchShow) {
        let parentNode = sample.parentNode;
        while (parentNode !== undefined && !(parentNode.isStore === 0 && parentNode.searchShow)) {
          parentNode = parentNode.parentNode!;
        }
        if (parentNode) {
          sample.parent = parentNode;
          parentNode.children.push(sample);
        }
      } else {
        // 如果节点没有父节点且是存储节点或者搜索不显示，则将其标记为待删除，并检查其子节点中是否有需要保留的
        if (!sample.parentNode && (sample.isStore > 0 || !sample.searchShow)) {
          removeList.push(this.allProcess.indexOf(sample));
          const effectChildren = this.findEffectChildren(sample.initChildren);
          if (effectChildren.length > 0) {
            effectChildList.push(...effectChildren);
          }
        }
      }
    }
    // 删除标记为待删除的节点
    removeList.sort((a, b) => b - a).forEach(index => {
      if (index >= 0 && index < values.length) {
        this.allProcess.splice(index, 1);
      }
    });
    // 将所有有效的子节点添加到返回的列表中
    this.allProcess.push(...effectChildList);
  }

  /**
   * 递归查找调用链中非存储且标记为显示的子节点
   * 
   * 本函数旨在筛选出调用链数据中，所有非存储（isStore为0）且被标记为需要显示（searchShow为true）的节点
   * 它通过递归遍历每个节点的子节点（initChildren），确保所有符合条件的节点都被找出
   * 
   * @param children 调用链的子节点数组，这些子节点是待筛选的数据
   * @returns 返回一个新数组，包含所有非存储且标记为显示的子节点
   */
  private findEffectChildren(children: PerfCallChainMerageData[]): PerfCallChainMerageData[] {
    let result: PerfCallChainMerageData[] = [];
    for (let child of children) {
      // 如果搜索框有值，检查当前子树是否有任何一个节点的 isSearch 为 true
      if (this.searchValue === '' || this.hasSearchNode(child)) {
        // 如果当前节点非存储且需要显示，则直接添加到结果数组中
        if (child.isStore === 0 && child.searchShow) {
          result.push(child);
        } else {
          // 如果当前节点不符合条件，递归查找其子节点中符合条件的节点
          result.push(...this.findEffectChildren(child.initChildren));
        }
      }
    }
    // 返回结果数组
    return result;
  }

  /**
   * 检查性能调用链合并数据中的节点是否包含搜索节点
   *
   * 该函数采用递归方式遍历节点及其子节点，以确定是否至少存在一个搜索节点
   * 主要用于在性能数据结构中快速定位是否有符合搜索条件的节点
   *
   * @param node 当前遍历的节点，类型为PerfCallChainMerageData
   * @returns 如果找到搜索节点则返回true，否则返回false
   */
  private hasSearchNode(node: PerfCallChainMerageData): boolean {
    if (node.isSearch) {
      return true;
    }
    for (let child of node.initChildren) {
      if (this.hasSearchNode(child)) {
        return true;
      }
    }
    return false;
  }

  kernelCombination(): void {
    function mergeChildren(item: PerfCallChainMerageData): void {
      if (item.children.length <= 0) {
        return;
      }
      item.children = item.children.reduce((total: PerfCallChainMerageData[], pfcall: PerfCallChainMerageData): PerfCallChainMerageData[] => {
        for (const prev of total) {
          if (pfcall.symbol === prev.symbol) {
            prev.children.push(...pfcall.children);
            prev.total += pfcall.total;
            prev.count += pfcall.count;
            prev.totalEvent += pfcall.totalEvent;
            prev.eventCount += pfcall.eventCount;
            return total;
          }
        }
        total.push(pfcall);
        return total;
      }, [] as PerfCallChainMerageData[]);
      for (const child of item.children) {
        mergeChildren(child);
      }
    }
    this.allProcess.forEach((item: PerfCallChainMerageData): void => {
      mergeChildren(item);
    });
  }

  markSearchNode(sampleArray: PerfCallChainMerageData[], search: string, parentSearch: boolean): void {
    for (const sample of sampleArray) {
      if (search === '') {
        sample.searchShow = true;
        sample.isSearch = false;
      } else {
        let isInclude = sample.symbol.toLocaleLowerCase().includes(search);
        if ((sample.symbol && isInclude) || parentSearch) {
          sample.searchShow = true;
          sample.isSearch = sample.symbol !== undefined && isInclude;
          let parentNode = sample.parent;
          // 如果匹配，所有parent都显示
          while (parentNode !== undefined && !parentNode.searchShow) {
            parentNode.searchShow = true;
            parentNode = parentNode.parent;
          }
        } else {
          sample.searchShow = false;
          sample.isSearch = false;
        }
      }
      const children = this.isOnlyKernel ? sample.initChildren : sample.children;
      if (children.length > 0) {
        this.markSearchNode(children, search, sample.searchShow);
      }
    }
  }
  splitAllProcess(processArray: { select: string; name: string; type: string; checked: boolean }[]): void {
    processArray.forEach((item: { select: string; name: string; type: string; checked: boolean }): void => {
      this.allProcess.forEach((process): void => {
        if (item.select === '0') {
          this.recursionPerfChargeInitTree(process, item.name, item.type === 'symbol');
        } else {
          this.recursionPerfPruneInitTree(process, item.name, item.type === 'symbol');
        }
      });
      if (!item.checked) {
        this.resetAllSymbol([item.name]);
      }
    });
  }
  resolvingAction(params: unknown[]): unknown[] {
    if (params.length > 0) {
      for (let item of params) {
        //@ts-ignore
        if (item.funcName && item.funcArgs) {
          //@ts-ignore
          let result = this.handleDataByFuncName(item.funcName, item.funcArgs);
          if (result) {
            //@ts-ignore
            return result;
          }
        }
      }
      if (this.isOnlyKernel) {
        this.dataSource = this.allProcess;
      } else {
        this.dataSource = this.allProcess.filter((process: PerfCallChainMerageData): boolean => {
          return process.children && process.children.length > 0;
        });
      }
    }
    return this.dataSource;
  }
  private queryDataFromDb(funcArgs: unknown[], flag: string): void {
    if (funcArgs[1]) {
      let sql = '';
      //@ts-ignore
      if (funcArgs[1].processId !== undefined) {
        //@ts-ignore
        sql += `and thread.process_id = ${funcArgs[1].processId}`;
      }
      //@ts-ignore
      if (funcArgs[1].threadId !== undefined) {
        //@ts-ignore
        sql += ` and s.thread_id = ${funcArgs[1].threadId}`;
      }
      //@ts-ignore
      this.getCurrentDataFromDb(funcArgs[0], flag, sql);
    } else {
      //@ts-ignore
      this.getCurrentDataFromDb(funcArgs[0], flag, funcArgs[1]);
    }
  }

  private queryVaddrToFile(funcArgs: unknown[]): void {
    if (funcArgs[1]) {
      let sql = '';
      //@ts-ignore
      if (funcArgs[1].processId !== undefined) {
        //@ts-ignore
        sql += `and thread.process_id = ${funcArgs[1].processId}`;
      }
      //@ts-ignore
      if (funcArgs[1].threadId !== undefined) {
        //@ts-ignore
        sql += ` and s.thread_id = ${funcArgs[1].threadId}`;
      }
      //@ts-ignore
      this.getVaddrToFile(funcArgs[0], sql);
    } else {
      //@ts-ignore
      this.getVaddrToFile(funcArgs[0]);
    }
  }

  private getVaddrToFile(selectionParam: SelectionParam, sql?: string): void {
    let filterSql = this.setFilterSql(selectionParam, sql);
    this.queryData(
      this.currentEventId,
      'perf-vaddr-back',
      `select s.callchain_id,
            s.thread_id,
            thread.process_id
            from perf_sample s, trace_range t
            left join perf_thread thread on s.thread_id = thread.thread_id
            where timestamp_trace between ${selectionParam.leftNs} + t.start_ts
            and ${selectionParam.rightNs} + t.start_ts
            and s.callchain_id != -1
            and s.thread_id != 0  ${filterSql}
        group by s.callchain_id`,
      {
        $startTime: selectionParam.leftNs,
        $endTime: selectionParam.rightNs,
        $sql: filterSql,
      }
    );
  }

  private handleDataByFuncName(funcName: string, funcArgs: unknown[]): unknown {
    let result;
    switch (funcName) {
      case 'getCallChainsBySampleIds':
        this.freshPerfCallchains(this.samplesData, funcArgs[0] as boolean);
        break;
      case 'getCurrentDataFromDbProfile':
        this.queryDataFromDb(funcArgs, 'perf-profile');
        break;
      case 'getCurrentDataFromDbAnalysis':
        this.queryDataFromDb(funcArgs, 'perf-analysis');
        break;
      case 'getCurrentDataFromDbBottomUp':
        this.queryDataFromDb(funcArgs, 'perf-bottomUp');
      case 'getVaddrToFile':
        this.queryVaddrToFile(funcArgs);
        break;
      case 'hideSystemLibrary':
        this.hideSystemLibrary();
        break;
      case 'hideThread':
        this.isHideThread = funcArgs[0] as boolean;
        break;
      case 'hideThreadState':
        this.isHideThreadState = funcArgs[0] as boolean;
        break;
      case 'onlyKernel':
        this.isOnlyKernel = funcArgs[0] as boolean;
        break;
      case 'hideNumMaxAndMin':
        this.hideNumMaxAndMin(funcArgs[0] as number, funcArgs[1] as string);
        break;
      case 'splitAllProcess':
        //@ts-ignore
        this.splitAllProcess(funcArgs[0]);
        break;
      case 'resetAllNode':
        this.resetAllNode(this.allProcess);
        break;
      case 'resotreAllNode':
        this.resetAllSymbol(funcArgs[0] as string[]);
        break;
      case 'clearSplitMapData':
        this.clearSplitMapData(funcArgs[0] as string);
        break;
      case 'splitTree':
        this.splitPerfTree(this.allProcess, funcArgs[0] as string, funcArgs[1] as boolean, funcArgs[2] as boolean);
        break;
      case 'setSearchValue':
        this.searchValue = funcArgs[0] as string;
        break;

      case 'combineAnalysisCallChain':
        result = this.combineCallChainForAnalysis();
        break;
      case 'getBottomUp':
        result = this.getBottomUp();
        break;
      case 'kernelCombination':
        this.kernelCombination();
        break;
    }
    return result;
  }

  combineCallChainForAnalysis(obj?: unknown): PerfAnalysisSample[] {
    let sampleCallChainList: Array<PerfAnalysisSample> = [];
    for (let sample of this.samplesData) {
      let callChains = [...this.callChainData[sample.sampleId]];
      const lastCallChain = callChains[callChains.length - 1];
      const threadName = this.threadData[sample.tid].threadName || 'Thread';
      const processName = this.threadData[sample.pid].threadName || 'Process';
      const funcName = this.dataCache.dataDict.get(lastCallChain.name as number);
      if (
        //@ts-ignore
        (obj && obj.libId === lastCallChain.fileId && obj.libName === lastCallChain.fileName) ||
        //@ts-ignore
        (obj && obj.symbolId === lastCallChain.symbolId && obj.symbolName === funcName) ||
        !obj
      ) {
        let analysisSample = new PerfAnalysisSample(
          threadName,
          lastCallChain.depth,
          lastCallChain.vaddrInFile,
          lastCallChain.offsetToVaddr,
          processName,
          lastCallChain.fileId,
          lastCallChain.fileName,
          lastCallChain.symbolId,
          this.dataCache.dataDict.get(lastCallChain.name as number) || ''
        );
        analysisSample.tid = sample.tid;
        analysisSample.pid = sample.pid;
        analysisSample.count = sample.count;
        analysisSample.threadState = sample.threadState;
        analysisSample.eventCount = sample.eventCount;
        analysisSample.sampleId = sample.sampleId;
        sampleCallChainList.push(analysisSample);
      }
    }
    return sampleCallChainList;
  }

  getBottomUp(): PerfBottomUpStruct[] {
    const topUp = new PerfBottomUpStruct('topUp');
    let perfTime = 1;
    for (let sample of this.samplesData) {
      let currentNode = topUp;
      let callChains = this.callChainData[sample.sampleId];
      for (let i = 0; i < callChains.length; i++) {
        if (i === 0) {
          currentNode = topUp;
        }
        let item = callChains[i];
        const existingNode = currentNode.children.find(
          (child) => child.symbolName === `${item.name}(${item.fileName})`
        );
        if (existingNode) {
          existingNode.tsArray.push(...sample.ts.split(',').map(Number));
          currentNode = existingNode;
          existingNode.totalTime += perfTime * sample.count;
          existingNode.eventCount += sample.eventCount;
          existingNode.calculateSelfTime();
          existingNode.notifyParentUpdateSelfTime();
        } else {
          const symbolName = this.dataCache.dataDict.get(item.name as number) || '';
          let newNode = new PerfBottomUpStruct(`${symbolName}(${item.fileName})`);
          newNode.totalTime = perfTime * sample.count;
          newNode.eventCount = sample.eventCount;
          newNode.tsArray = sample.ts.split(',').map(Number);
          currentNode.addChildren(newNode);
          newNode.calculateSelfTime();
          newNode.notifyParentUpdateSelfTime();
          currentNode = newNode;
        }
      }
    }
    topUp.children.forEach((child: PerfBottomUpStruct): void => {
      child.parentNode = undefined;
    });

    let date = this.topUpDataToBottomUpData(topUp.children);
    if (this.isPerfBottomUp) {
      this.isPerfBottomUp = false;
    }
    return date;
  }

  private topUpDataToBottomUpData(perfPositiveArray: Array<PerfBottomUpStruct>): Array<PerfBottomUpStruct> {
    let reverseTreeArray: Array<PerfBottomUpStruct> = [];
    const recursionTree = (perfBottomUpStruct: PerfBottomUpStruct): void => {
      if (perfBottomUpStruct.selfTime > 0) {
        const clonePerfBottomUpStruct = new PerfBottomUpStruct(perfBottomUpStruct.symbolName);
        clonePerfBottomUpStruct.selfTime = perfBottomUpStruct.selfTime;
        clonePerfBottomUpStruct.totalTime = perfBottomUpStruct.totalTime;
        clonePerfBottomUpStruct.eventCount = perfBottomUpStruct.eventCount;
        clonePerfBottomUpStruct.tsArray = [...perfBottomUpStruct.tsArray];
        reverseTreeArray.push(clonePerfBottomUpStruct);
        this.copyParentNode(clonePerfBottomUpStruct, perfBottomUpStruct);
      }
      if (perfBottomUpStruct.children.length > 0) {
        for (const children of perfBottomUpStruct.children) {
          children.parentNode = perfBottomUpStruct;
          recursionTree(children);
        }
      }
    };
    for (const perfBottomUpStruct of perfPositiveArray) {
      recursionTree(perfBottomUpStruct);
    }
    return this.mergeTreeBifurcation(reverseTreeArray, null);
  }

  private mergeTreeBifurcation(
    reverseTreeArray: Array<PerfBottomUpStruct> | null,
    parent: PerfBottomUpStruct | null
  ): Array<PerfBottomUpStruct> {
    const sameSymbolMap = new Map<string, PerfBottomUpStruct>();
    const currentLevelData: Array<PerfBottomUpStruct> = [];
    const dataArray = reverseTreeArray || parent?.frameChildren;
    if (!dataArray) {
      return [];
    }
    for (const perfBottomUpStruct of dataArray) {
      let symbolKey = perfBottomUpStruct.symbolName;
      let bottomUpStruct: PerfBottomUpStruct;
      if (sameSymbolMap.has(symbolKey)) {
        bottomUpStruct = sameSymbolMap.get(symbolKey)!;
        bottomUpStruct.totalTime += perfBottomUpStruct.totalTime;
        bottomUpStruct.selfTime += perfBottomUpStruct.selfTime;
        for (const ts of perfBottomUpStruct.tsArray) {
          bottomUpStruct.tsArray.push(ts);
        }
      } else {
        bottomUpStruct = perfBottomUpStruct;
        sameSymbolMap.set(symbolKey, bottomUpStruct);
        currentLevelData.push(bottomUpStruct);
        if (parent) {
          parent.addChildren(bottomUpStruct);
        }
      }
      bottomUpStruct.frameChildren?.push(...perfBottomUpStruct.children);
    }

    for (const data of currentLevelData) {
      this.mergeTreeBifurcation(null, data);
      data.frameChildren = [];
    }
    if (reverseTreeArray) {
      return currentLevelData;
    } else {
      return [];
    }
  }

  /**
   * copy整体调用链，从栈顶函数一直copy到栈底函数，
   * 给Parent设置selfTime，totalTime设置为children的selfTime,totalTime
   *  */
  private copyParentNode(perfBottomUpStruct: PerfBottomUpStruct, bottomUpStruct: PerfBottomUpStruct): void {
    if (bottomUpStruct.parentNode) {
      const copyParent = new PerfBottomUpStruct(bottomUpStruct.parentNode.symbolName);
      copyParent.selfTime = perfBottomUpStruct.selfTime;
      copyParent.totalTime = perfBottomUpStruct.totalTime;
      copyParent.eventCount = perfBottomUpStruct.eventCount;
      copyParent.tsArray = [...perfBottomUpStruct.tsArray];
      perfBottomUpStruct.addChildren(copyParent);
      this.copyParentNode(copyParent, bottomUpStruct.parentNode);
    }
  }
}

export class PerfFile {
  fileId: number = 0;
  symbol: string = '';
  path: string = '';
  fileName: string = '';

  static setFileName(data: PerfFile): void {
    if (data.path) {
      let number = data.path.lastIndexOf('/');
      if (number > 0) {
        data.fileName = data.path.substring(number + 1);
        return;
      }
    }
    data.fileName = data.path;
  }

  setFileName(): void {
    if (this.path) {
      let number = this.path.lastIndexOf('/');
      if (number > 0) {
        this.fileName = this.path.substring(number + 1);
        return;
      }
    }
    this.fileName = this.path;
  }
}

export class PerfThread {
  tid: number = 0;
  pid: number = 0;
  threadName: string = '';
  processName: string = '';
}

export class PerfCallChain {
  startNS: number = 0;
  dur: number = 0;
  sampleId: number = 0;
  callChainId: number = 0;
  vaddrInFile: number = 0;
  offsetToVaddr: number = 0;
  tid: number = 0;
  pid: number = 0;
  name: number | string = 0;
  fileName: string = '';
  threadState: string = '';
  fileId: number = 0;
  symbolId: number = 0;
  path: string = '';
  count: number = 0;
  eventCount: number = 0;
  parentId: string = ''; //合并之后区分的id
  id: string = '';
  topDownMerageId: string = ''; //top down合并使用的id
  topDownMerageParentId: string = ''; //top down合并使用的id
  bottomUpMerageId: string = ''; //bottom up合并使用的id
  bottomUpMerageParentId: string = ''; //bottom up合并使用的id
  depth: number = 0;
  canCharge: boolean = true;
  previousNode: PerfCallChain | undefined = undefined; //将list转换为一个链表结构
  nextNode: PerfCallChain | undefined = undefined;
  isThread: boolean = false;
  isProcess: boolean = false;
  isThreadState: boolean = false;
  sourceFileId: number = 0;
  lineNumber: number = 0;

  static setNextNode(currentNode: PerfCallChain, nextNode: PerfCallChain): void {
    currentNode.nextNode = nextNode;
    nextNode.previousNode = currentNode;
  }

  static setPreviousNode(currentNode: PerfCallChain, prevNode: PerfCallChain): void {
    currentNode.previousNode = prevNode;
    prevNode.nextNode = currentNode;
  }

  static merageCallChain(currentNode: PerfCallChain, callChain: PerfCallChain): void {
    currentNode.startNS = callChain.startNS;
    currentNode.tid = callChain.tid;
    currentNode.pid = callChain.pid;
    currentNode.sampleId = callChain.sampleId;
    currentNode.dur = callChain.dur;
    currentNode.count = callChain.count;
    currentNode.eventCount = callChain.eventCount;
  }
}

export class PerfCallChainMerageData extends ChartStruct {
  // @ts-ignore
  #parentNode: PerfCallChainMerageData | undefined = undefined;
  // @ts-ignore
  #total = 0;
  // @ts-ignore
  #totalEvent = 0;
  id: string = '';
  parentId: string = '';
  parent: PerfCallChainMerageData | undefined = undefined;
  symbolName: string = '';
  symbol: string = '';
  libName: string = '';
  path: string = '';
  weight: string = '';
  weightPercent: string = '';
  selfDur: number = 0;
  dur: number = 0;
  tid: number = 0;
  pid: number = 0;
  isStore = 0;
  canCharge: boolean = true;
  children: PerfCallChainMerageData[] = [];
  initChildren: PerfCallChainMerageData[] = [];
  type: number = 0;
  vaddrInFile: number = 0;
  offsetToVaddr: number = 0;
  isSelected: boolean = false;
  searchShow: boolean = true;
  isSearch: boolean = false;
  isState: boolean = false;
  set parentNode(data: PerfCallChainMerageData | undefined) {
    this.parent = data;
    this.#parentNode = data;
  }

  get parentNode(): PerfCallChainMerageData | undefined {
    return this.#parentNode;
  }

  set total(data: number) {
    this.#total = data;
    this.weight = `${this.dur}`;
    this.weightPercent = `${((this.dur / data) * 100).toFixed(1)}%`;
  }

  get total(): number {
    return this.#total;
  }

  set totalEvent(data: number) {
    this.#totalEvent = data;
    this.eventPercent = `${((this.eventCount / data) * 100).toFixed(1)}%`;
  }

  get totalEvent(): number {
    return this.#totalEvent;
  }

  static merageCallChainSample(
    currentNode: PerfCallChainMerageData,
    callChain: PerfCallChain,
    sample: PerfCountSample,
    isEnd: boolean,
    lineMap: Map<string, Set<number>>
  ): void {
    if (currentNode.symbolName === '') {
      let symbolName = '';
      if (typeof callChain.name === 'number') {
        symbolName = DataCache.getInstance().dataDict.get(callChain.name) || '';
      } else {
        symbolName = callChain.name;
      }
      currentNode.symbol = `${symbolName} ${callChain.fileName ? `(${callChain.fileName})` : ''}`;
      currentNode.symbolName = symbolName;
      currentNode.pid = sample.pid;
      currentNode.tid = sample.tid;
      currentNode.libName = callChain.fileName;
      currentNode.vaddrInFile = callChain.vaddrInFile;
      currentNode.offsetToVaddr = callChain.offsetToVaddr;
      currentNode.lib = callChain.fileName;
      currentNode.addr = `${'0x'}${callChain.vaddrInFile.toString(16)}`;
      currentNode.canCharge = callChain.canCharge;
      if (callChain.path) {
        currentNode.path = callChain.path;
      }
      if (callChain.sourceFileId) {
        currentNode.sourceFile = DataCache.getInstance().dataDict.get(callChain.sourceFileId) || '';
        const lines = lineMap.get(`${currentNode.sourceFile}_${currentNode.symbolName}`);
        if (lines) {
          currentNode.lineNumber = lines;
        }
      }
    }
    if (isEnd) {
      currentNode.selfDur += sample.count;
    }
    if (callChain.isThread && !currentNode.isThread) {
      currentNode.isThread = callChain.isThread;
    }
    if (callChain.isThreadState && !currentNode.isState) {
      currentNode.isState = callChain.isThreadState;
    }
    currentNode.dur += sample.count;
    currentNode.count += sample.count;
    currentNode.eventCount += sample.eventCount;
    currentNode.tsArray.push(...sample.ts.split(',').map(Number));
  }
}

export class PerfCountSample {
  sampleId: number = 0;
  tid: number = 0;
  count: number = 0;
  threadState: string = '';
  pid: number = 0;
  eventCount: number = 0;
  ts: string = '';
}

export class PerfStack {
  symbol: string = '';
  path: string = '';
  fileId: number = 0;
  type: number = 0;
  vaddrInFile: number = 0;
}

export class PerfCmdLine {
  report_value: string = '';
}

class PerfAnalysisSample extends PerfCountSample {
  threadName: string;
  depth: number;
  vaddr_in_file: number;
  offset_to_vaddr: number;
  processName: string;
  libId: number;
  libName: string;
  symbolId: number;
  symbolName: string;

  constructor(
    threadName: string,
    depth: number,
    vaddr_in_file: number,
    offset_to_vaddr: number,
    processName: string,
    libId: number,
    libName: string,
    symbolId: number,
    symbolName: string
  ) {
    super();
    this.threadName = threadName;
    this.depth = depth;
    this.vaddr_in_file = vaddr_in_file;
    this.offset_to_vaddr = offset_to_vaddr;
    this.processName = processName;
    this.libId = libId;
    this.libName = libName;
    this.symbolId = symbolId;
    this.symbolName = symbolName;
  }
}

export function timeMsFormat2p(ns: number): string {
  let currentNs = ns;
  let hour1 = 3600_000;
  let minute1 = 60_000;
  let second1 = 1_000; // 1 second
  let perfResult = '';
  if (currentNs >= hour1) {
    perfResult += `${Math.floor(currentNs / hour1).toFixed(2)}h`;
    return perfResult;
  }
  if (currentNs >= minute1) {
    perfResult += `${Math.floor(currentNs / minute1).toFixed(2)}min`;
    return perfResult;
  }
  if (currentNs >= second1) {
    perfResult += `${Math.floor(currentNs / second1).toFixed(2)}s`;
    return perfResult;
  }
  if (currentNs > 0) {
    perfResult += `${currentNs.toFixed(2)}ms`;
    return perfResult;
  }
  if (perfResult === '') {
    perfResult = '0s';
  }
  return perfResult;
}

class HiPrefSample {
  name: string = '';
  depth: number = 0;
  callchain_id: number = 0;
  totalTime: number = 0;
  thread_id: number = 0;
  id: number = 0;
  eventCount: number = 0;
  startTime: number = 0;
  endTime: number = 0;
  timeTip: number = 0;
  cpu_id: number = 0;
  stack?: Array<HiPerfSymbol>;
}
