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

import { LogicHandler, ChartStruct, convertJSON, DataCache, HiPerfSymbol } from './ProcedureLogicWorkerCommon';
import { PerfBottomUpStruct } from '../../bean/PerfBottomUpStruct';

const systemRuleName: string = '/system/';
const numRuleName: string = '/max/min/';
const maxDepth: number = 256;

export class ProcedureLogicWorkerPerf extends LogicHandler {
  filesData: any = {};
  samplesData: any = {};
  threadData: any = {};
  callChainData: any = {};
  splitMapData: any = {};
  currentTreeMapData: any = {};
  currentTreeList: any[] = [];
  searchValue: string = '';
  dataSource: PerfCallChainMerageData[] = [];
  allProcess: PerfCallChainMerageData[] = [];
  currentEventId: string = '';
  isAnalysis: boolean = false;
  isPerfBottomUp: boolean = false;
  isHideThread: boolean = false;
  isHideThreadState: boolean = false;
  private lib: object | undefined;
  private symbol: object | undefined;
  perfCallData: any[] = [];
  private dataCache = DataCache.getInstance();
  private isTopDown: boolean = true;

  handle(data: any): void {
    this.currentEventId = data.id;
    if (data && data.type) {
      switch (data.type) {
        case 'perf-init':
          this.dataCache.perfCountToMs = data.params.fValue;
          this.initPerfFiles();
          break;
        case 'perf-queryPerfFiles':
          this.perfQueryPerfFiles(data.params.list);
          break;
        case 'perf-queryPerfThread':
          this.perfQueryPerfThread(data.params.list);
          break;
        case 'perf-queryPerfCalls':
          this.perfQueryPerfCalls(data.params.list);
          break;
        case 'perf-queryPerfCallchains':
          this.perfQueryPerfCallchains(data);
          break;
        case 'perf-queryCallchainsGroupSample':
          this.perfQueryCallchainsGroupSample(data);
          break;
        case 'perf-action':
          this.perfAction(data);
          break;
        case 'perf-reset':
          this.perfReset();
      }
    }
  }
  private perfQueryPerfFiles(list: Array<any>): void {
    let files = convertJSON(list) || [];
    files.forEach((file: any) => {
      this.filesData[file.fileId] = this.filesData[file.fileId] || [];
      PerfFile.setFileName(file);
      this.filesData[file.fileId].push(file);
    });
    this.initPerfThreads();
  }
  private perfQueryPerfThread(list: Array<any>): void {
    let threads = convertJSON(list) || [];
    threads.forEach((thread: any): void => {
      this.threadData[thread.tid] = thread;
    });
    this.initPerfCalls();
  }
  private perfQueryPerfCalls(list: Array<any>): void {
    let perfCalls = convertJSON(list) || [];
    if (perfCalls.length !== 0) {
      perfCalls.forEach((perfCall: any): void => {
        this.dataCache.perfCallChainMap.set(perfCall.sampleId, perfCall);
      });
    }
    this.initPerfCallchains();
  }
  private perfQueryPerfCallchains(data: any): void {
    let arr = convertJSON(data.params.list) || [];
    this.initPerfCallChainTopDown(arr);
    // @ts-ignore
    self.postMessage({
      id: data.id,
      action: data.action,
      results: this.dataCache.perfCallChainMap,
    });
  }
  private perfQueryCallchainsGroupSample(data: any): void {
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
      id: data.id,
      action: data.action,
      results: result,
    });
    if (this.isAnalysis) {
      this.isAnalysis = false;
    }
  }
  private perfAction(data: any): void {
    if (data.params) {
      let filter = data.params.filter((item: any): boolean => item.funcName === 'getCurrentDataFromDb');
      let libFilter = data.params.filter((item: any): boolean => item.funcName === 'showLibLevelData');
      let funFilter = data.params.filter((item: any): boolean => item.funcName === 'showFunLevelData');
      if (libFilter.length !== 0) {
        this.setLib(libFilter);
      }
      if (funFilter.length !== 0) {
        this.setSymbol(funFilter);
      }
      if (filter.length === 0) {
        let result = this.calReturnData(data.params);
        self.postMessage({
          id: data.id,
          action: data.action,
          results: result,
        });
      } else {
        this.resolvingAction(data.params);
      }
    }
  }
  private perfReset(): void {
    this.isHideThread = false;
    this.isHideThreadState = false;
  }
  private setLib(libFilter: any): void {
    this.lib = {
      libId: libFilter[0].funcArgs[0],
      libName: libFilter[0].funcArgs[1],
    };
  }
  private setSymbol(funFilter: any): void {
    this.symbol = {
      symbolId: funFilter[0].funcArgs[0],
      symbolName: funFilter[0].funcArgs[1],
    };
  }
  private calReturnData(params: any): Array<any> {
    let result;
    let callChainsFilter = params.filter((item: any): boolean => item.funcName === 'getCallChainsBySampleIds');
    callChainsFilter.length > 0 ? (this.isTopDown = callChainsFilter[0].funcArgs[0]) : (this.isTopDown = true);
    let isHideSystemSoFilter = params.filter((item: any): boolean => item.funcName === 'hideSystemLibrary');
    let hideThreadFilter = params.filter((item: any): boolean => item.funcName === 'hideThread');
    let hideThreadStateFilter = params.filter((item: any): boolean => item.funcName === 'hideThreadState');
    if (this.lib) {
      if (
        callChainsFilter.length > 0 ||
        isHideSystemSoFilter.length > 0 ||
        hideThreadFilter.length > 0 ||
        hideThreadStateFilter.length > 0
      ) {
        this.samplesData = this.combineCallChainForAnalysis(this.lib);
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
        hideThreadStateFilter.length > 0
      ) {
        this.samplesData = this.combineCallChainForAnalysis(this.symbol);
        result = this.resolvingAction(params);
      } else {
        let funData = this.combineCallChainForAnalysis(this.symbol);
        this.freshPerfCallchains(funData, this.isTopDown);
        result = this.allProcess;
        this.symbol = undefined;
      }
    } else {
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
              c.file_id       as fileId,
              c.depth,
              c.symbol_id     as symbolId
       from perf_callchain c
       where callchain_id != -1;`,
      {}
    );
  }
  /**
   *
   * @param selectionParam
   * @param sql 从饼图进程或者线程层点击进入Perf Profile时传入
   */
  private getCurrentDataFromDb(selectionParam: any, sql?: string): void {
    let filterSql = this.setFilterSql(selectionParam, sql);
    this.queryData(
      this.currentEventId,
      'perf-queryCallchainsGroupSample',
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
  private setFilterSql(selectionParam: any, sql?: string): string {
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
    this.samplesData = {};
    this.threadData = {};
    this.perfCallData = [];
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
    if (callChain.symbolId === -1) {
      if (this.filesData[callChain.fileId] && this.filesData[callChain.fileId].length > 0) {
        callChain.fileName = this.filesData[callChain.fileId][0].fileName;
        callChain.path = this.filesData[callChain.fileId][0].path;
      } else {
        callChain.fileName = 'unknown';
      }
    } else {
      if (this.filesData[callChain.fileId] && this.filesData[callChain.fileId].length > callChain.symbolId) {
        callChain.fileName = this.filesData[callChain.fileId][callChain.symbolId].fileName;
        callChain.path = this.filesData[callChain.fileId][callChain.symbolId].path;
      } else {
        callChain.fileName = 'unknown';
      }
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

  addOtherCallchainsData(countSample: PerfCountSample, list: any[]): void {
    let threadCallChain = new PerfCallChain(); //新增的线程数据
    threadCallChain.tid = countSample.tid;
    threadCallChain.canCharge = false;
    threadCallChain.isThread = true;
    threadCallChain.name = `${this.threadData[countSample.tid].threadName || 'Thread'}(${countSample.tid})`;
    let threadStateCallChain = new PerfCallChain(); //新增的线程状态数据
    threadStateCallChain.tid = countSample.tid;
    threadStateCallChain.name = countSample.threadState || 'Unknown State';
    threadStateCallChain.fileName = threadStateCallChain.name === '-' ? 'Unknown Thread State' : '';
    threadStateCallChain.canCharge = false;
    if (!this.isHideThreadState) {
      list.unshift(threadStateCallChain);
    }
    if (!this.isHideThread) {
      list.unshift(threadCallChain);
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
          let symbolName = this.dataCache.dataDict.get(perfCallChains[topIndex].name) || '';
          if (typeof perfCallChains[topIndex].name === 'number') {
            symbolName = this.dataCache.dataDict.get(perfCallChains[topIndex].name) || '';
          } else {
            symbolName = perfCallChains[topIndex].name;
          }
          let perfRootNode = this.currentTreeMapData[symbolName + perfSample.pid];
          if (perfRootNode === undefined) {
            perfRootNode = new PerfCallChainMerageData();
            this.currentTreeMapData[symbolName + perfSample.pid] = perfRootNode;
            this.currentTreeList.push(perfRootNode);
          }
          PerfCallChainMerageData.merageCallChainSample(perfRootNode, perfCallChains[topIndex], perfSample, false);
          this.mergeChildrenByIndex(perfRootNode, perfCallChains, topIndex, perfSample, isTopDown);
        }
      }
    });
    let rootMerageMap = this.mergeNodeData(totalEventCount, totalSamplesCount);
    this.handleCurrentTreeList(totalEventCount, totalSamplesCount);
    this.allProcess = Object.values(rootMerageMap);
  }
  private mergeNodeData(totalEventCount: number, totalSamplesCount: number): Map<any, any> {
    let rootMerageMap: any = {};
    // @ts-ignore
    Object.values(this.currentTreeMapData).forEach((merageData: any): void => {
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
    this.currentTreeList.forEach((perfTreeNode: any): void => {
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
          PerfCallChainMerageData.merageCallChainSample(child, callChainDataList[index], sample, isEnd);
          return true;
        }
        return false;
      }).length === 0
    ) {
      node = new PerfCallChainMerageData();
      PerfCallChainMerageData.merageCallChainSample(node, callChainDataList[index], sample, isEnd);
      currentNode.children.push(node);
      currentNode.initChildren.push(node);
      this.currentTreeList.push(node);
      node.parentNode = currentNode;
    }
    if (node! && !isEnd) this.mergeChildrenByIndex(node, callChainDataList, index, sample, isTopDown);
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
        if (rule(child)) {
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
      this.recursionChargeByRule(item, numRuleName, (node: PerfCallChainMerageData): boolean => {
        return node.dur < startNum || node.dur > max;
      });
    });
  }

  clearSplitMapData(symbolName: string): void {
    delete this.splitMapData[symbolName];
  }

  resetAllSymbol(symbols: string[]): void {
    symbols.forEach((symbol: string): void => {
      let list = this.splitMapData[symbol];
      if (list !== undefined) {
        list.forEach((item: any): void => {
          item.isStore--;
        });
      }
    });
  }

  resetAllNode(sample: PerfCallChainMerageData[]): void {
    this.clearSearchNode();
    sample.forEach((process: PerfCallChainMerageData): void => {
      process.searchShow = true;
      process.isSearch = false;
    });
    this.resetNewAllNode(sample);
    if (this.searchValue !== '') {
      this.findSearchNode(sample, this.searchValue, false);
      this.resetNewAllNode(sample);
    }
  }

  resetNewAllNode(sampleArray: PerfCallChainMerageData[]): void {
    sampleArray.forEach((process: PerfCallChainMerageData): void => {
      process.children = [];
    });
    let values = this.currentTreeList.map((item: any): any => {
      item.children = [];
      return item;
    });
    values.forEach((sample: any): void => {
      if (sample.parentNode !== undefined) {
        if (sample.isStore === 0 && sample.searchShow) {
          let parentNode = sample.parentNode;
          while (parentNode !== undefined && !(parentNode.isStore === 0 && parentNode.searchShow)) {
            parentNode = parentNode.parentNode;
          }
          if (parentNode) {
            sample.currentTreeParentNode = parentNode;
            parentNode.children.push(sample);
          }
        }
      }
    });
  }

  findSearchNode(sampleArray: PerfCallChainMerageData[], search: string, parentSearch: boolean): void {
    search = search.toLocaleLowerCase();
    sampleArray.forEach((sample: PerfCallChainMerageData): void => {
      if ((sample.symbol && sample.symbol.toLocaleLowerCase().includes(search)) || parentSearch) {
        sample.searchShow = true;
        let parentNode = sample.parent;
        sample.isSearch = sample.symbol !== undefined && sample.symbol.toLocaleLowerCase().includes(search);
        while (parentNode !== undefined && !parentNode.searchShow) {
          parentNode.searchShow = true;
          parentNode = parentNode.parent;
        }
      } else {
        sample.searchShow = false;
        sample.isSearch = false;
      }
      if (sample.children.length > 0) {
        this.findSearchNode(sample.children, search, sample.searchShow);
      }
    });
  }

  clearSearchNode(): void {
    this.currentTreeList.forEach((sample: any): void => {
      sample.searchShow = true;
      sample.isSearch = false;
    });
  }

  splitAllProcess(processArray: any[]): void {
    processArray.forEach((item: any): void => {
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
  resolvingAction(params: any[]): PerfCallChainMerageData[] | PerfAnalysisSample[] | PerfBottomUpStruct[] {
    if (params.length > 0) {
      for (let item of params) {
        if (item.funcName && item.funcArgs) {
          let result = this.handleDataByFuncName(item.funcName, item.funcArgs);
          if (result) {
            return result;
          }
        }
      }
      this.dataSource = this.allProcess.filter((process: PerfCallChainMerageData): boolean => {
        return process.children && process.children.length > 0;
      });
    }
    return this.dataSource;
  }
  private queryDataFromDb(funcArgs: any): void {
    if (funcArgs[1]) {
      let sql = '';
      if (funcArgs[1].processId !== undefined) {
        sql += `and thread.process_id = ${funcArgs[1].processId}`;
      }
      if (funcArgs[1].threadId !== undefined) {
        sql += ` and s.thread_id = ${funcArgs[1].threadId}`;
      }
      this.getCurrentDataFromDb(funcArgs[0], sql);
    } else {
      this.getCurrentDataFromDb(funcArgs[0]);
    }
  }
  private handleDataByFuncName(funcName: string, funcArgs: any): Array<any> | undefined {
    switch (funcName) {
      case 'getCallChainsBySampleIds':
        this.freshPerfCallchains(this.samplesData, funcArgs[0]);
        break;
      case 'getCurrentDataFromDb':
        this.queryDataFromDb(funcArgs);
        break;
      case 'hideSystemLibrary':
        this.hideSystemLibrary();
        break;
      case 'hideThread':
        this.isHideThread = funcArgs[0];
        break;
      case 'hideThreadState':
        this.isHideThreadState = funcArgs[0];
        break;
      case 'hideNumMaxAndMin':
        this.hideNumMaxAndMin(funcArgs[0], funcArgs[1]);
        break;
      case 'splitAllProcess':
        this.splitAllProcess(funcArgs[0]);
        break;
      case 'resetAllNode':
        this.resetAllNode(this.allProcess);
        break;
      case 'resotreAllNode':
        this.resetAllSymbol(funcArgs[0]);
        break;
      case 'clearSplitMapData':
        this.clearSplitMapData(funcArgs[0]);
        break;
      case 'splitTree':
        this.splitPerfTree(this.allProcess, funcArgs[0], funcArgs[1], funcArgs[2]);
        break;
      case 'setSearchValue':
        this.searchValue = funcArgs[0];
        break;
      case 'setCombineCallChain':
        this.isAnalysis = true;
        break;
      case 'setPerfBottomUp':
        this.isPerfBottomUp = true;
        break;
      case 'combineAnalysisCallChain':
        return this.combineCallChainForAnalysis();
      case 'getBottomUp':
        return this.getBottomUp();
    }
  }

  combineCallChainForAnalysis(obj?: any): PerfAnalysisSample[] {
    let sampleCallChainList: Array<PerfAnalysisSample> = [];
    for (let sample of this.samplesData) {
      let callChains = [...this.callChainData[sample.sampleId]];
      const lastCallChain = callChains[callChains.length - 1];
      const threadName = this.threadData[sample.tid].threadName || 'Thread';
      const processName = this.threadData[sample.pid].threadName || 'Process';
      const funcName = this.dataCache.dataDict.get(lastCallChain.name);
      if (
        (obj && obj.libId === lastCallChain.fileId && obj.libName === lastCallChain.fileName) ||
        (obj && obj.symbolId === lastCallChain.symbolId && obj.symbolName === funcName) ||
        !obj
      ) {
        let analysisSample = new PerfAnalysisSample(
          threadName,
          processName,
          lastCallChain.fileId,
          lastCallChain.fileName,
          lastCallChain.symbolId,
          this.dataCache.dataDict.get(lastCallChain.name) || ''
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
          const symbolName = this.dataCache.dataDict.get(item.name) || '';
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
  isSelected: boolean = false;
  searchShow: boolean = true;
  isSearch: boolean = false;
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
    isEnd: boolean
  ): void {
    if (currentNode.symbolName === '') {
      let symbolName = '';
      if (typeof callChain.name === 'number') {
        symbolName = DataCache.getInstance().dataDict.get(callChain.name) || '';
      } else {
        symbolName = callChain.name;
      }
      currentNode.symbol = `${symbolName}  ${callChain.fileName ? `(${callChain.fileName})` : ''}`;
      currentNode.symbolName = symbolName;
      currentNode.pid = sample.pid;
      currentNode.tid = sample.tid;
      currentNode.libName = callChain.fileName;
      currentNode.vaddrInFile = callChain.vaddrInFile;
      currentNode.lib = callChain.fileName;
      currentNode.addr = `${'0x'}${callChain.vaddrInFile.toString(16)}`;
      currentNode.canCharge = callChain.canCharge;
      if (callChain.path) {
        currentNode.path = callChain.path;
      }
    }
    if (isEnd) {
      currentNode.selfDur += sample.count;
    }
    if (callChain.isThread && !currentNode.isThread) {
      currentNode.isThread = callChain.isThread;
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
  processName: string;
  libId: number;
  libName: string;
  symbolId: number;
  symbolName: string;

  constructor(
    threadName: string,
    processName: string,
    libId: number,
    libName: string,
    symbolId: number,
    symbolName: string
  ) {
    super();
    this.threadName = threadName;
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
