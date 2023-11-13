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

import { LogicHandler, ChartStruct, convertJSON, DataCache, PerfCall } from './ProcedureLogicWorkerCommon.js';
import { PerfBottomUpStruct } from '../../bean/PerfBottomUpStruct.js';

const systemRuleName: string = '/system/';
const numRuleName: string = '/max/min/';
const maxDepth: number = 128;

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
  queryFunc?: Function | undefined;
  isActualQuery: boolean = false;
  currentEventId: string = '';
  isAnalysis: boolean = false;
  isPerfBottomUp: boolean = false;
  isHideThread: boolean = false;
  isHideThreadState: boolean = false;
  processMap = new Map<number, { count: number; eventCount: number }>();
  threadMap = new Map<number, { count: number; eventCount: number }>();
  eventTypeId?: string = '';

  private dataCache = DataCache.getInstance();

  handle(data: any): void {
    this.currentEventId = data.id;
    if (data && data.type) {
      switch (data.type) {
        case 'perf-init':
          this.dataCache.perfCountToMs = data.params.fValue;
          this.initPerfFiles();
          break;
        case 'perf-queryPerfFiles':
          let files = convertJSON(data.params.list) || [];
          files.forEach((file: any) => {
            this.filesData[file.fileId] = this.filesData[file.fileId] || [];
            PerfFile.setFileName(file);
            this.filesData[file.fileId].push(file);
          });
          this.initPerfThreads();
          break;
        case 'perf-queryPerfThread':
          let threads = convertJSON(data.params.list) || [];
          threads.forEach((thread: any): void => {
            this.threadData[thread.tid] = thread;
          });
          this.initPerfCalls();
          break;
        case 'perf-queryPerfCalls':
          let perfCalls = convertJSON(data.params.list) || [];
          if (perfCalls.length !== 0) {
            perfCalls.forEach((perfCall: any): void => {
              this.dataCache.perfCallChainMap.set(perfCall.sampleId, perfCall);
            });
          }
          this.initPerfCallchains();
          break;
        case 'perf-queryPerfCallchains':
          let arr = convertJSON(data.params.list) || [];
          this.initPerfCallChainTopDown(arr);
          // @ts-ignore
          self.postMessage({
            id: data.id,
            action: data.action,
            results: this.dataCache.perfCallChainMap,
          });
          break;
        case 'perf-queryCallchainsGroupSample':
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
            result = this.resolvingAction([
              {
                funcName: 'getCallChainsBySampleIds',
                funcArgs: [true],
              },
            ]);
          }
          self.postMessage({
            id: data.id,
            action: data.action,
            results: result,
          });
          break;
        case 'perf-action':
          if (data.params) {
            let filter = data.params.filter((item: any): boolean => item.funcName === 'getCurrentDataFromDb');
            if (filter.length === 0) {
              // @ts-ignore
              self.postMessage({
                id: data.id,
                action: data.action,
                results: this.resolvingAction(data.params),
              });
            } else {
              this.resolvingAction(data.params);
            }
          }
          break;
        case 'perf-reset':
          this.isHideThread = false;
          this.isHideThreadState = false;
      }
    }
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
              c.symbol_id     as symbolId
       from perf_callchain c
       where callchain_id != -1;`,
      {}
    );
  }

  getCurrentDataFromDb(selectionParam: any): void {
    const cpus = selectionParam.perfAll ? [] : selectionParam.perfCpus;
    const processes = selectionParam.perfAll ? [] : selectionParam.perfProcess;
    const threads = selectionParam.perfAll ? [] : selectionParam.perfThread;
    let filterSql = '';
    if (cpus.length != 0 || processes.length != 0 || threads.length != 0) {
      const cpuFilter = cpus.length > 0 ? `or s.cpu_id in (${cpus.join(',')}) ` : '';
      const processFilter = processes.length > 0 ? `or thread.process_id in (${processes.join(',')}) ` : '';
      const threadFilter = threads.length > 0 ? `or s.thread_id in (${threads.join(',')})` : '';
      let arg = `${cpuFilter}${processFilter}${threadFilter}`.substring(3);
      filterSql = ` and (${arg})`;
    }
    const eventTypeFilter = this.eventTypeId ? ` and s.event_type_id = ${this.eventTypeId}` : '';
    filterSql += eventTypeFilter;
    this.queryData(
      this.currentEventId,
      'perf-queryCallchainsGroupSample',
      `select p.callchain_id as sampleId,
          p.thread_state as threadState,
          p.thread_id    as tid,
          p.count,
          p.process_id   as pid,
          p.event_count  as eventCount,
          p.ts as ts,
          p.event_type_id as eventTypeId
      from (
        select callchain_id, s.thread_id, s.event_type_id, thread_state, process_id, 
                count(callchain_id) as count,SUM(event_count) as event_count,
                group_concat(s.timestamp_trace - t.start_ts,',') as ts
        from perf_sample s, trace_range t
        left join perf_thread thread on s.thread_id = thread.thread_id
        where timestamp_trace between $startTime + t.start_ts
            and $endTime + t.start_ts
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

  clearAll(): void {
    this.filesData = {};
    this.samplesData = {};
    this.threadData = {};
    this.callChainData = {};
    this.splitMapData = {};
    this.currentTreeMapData = {};
    this.currentTreeList = [];
    this.searchValue = '';
    this.dataSource = [];
    this.allProcess = [];
    this.dataCache.clearPerf();
    this.eventTypeId = undefined;
  }

  initPerfCallChainBottomUp(callChains: PerfCallChain[]): void {
    callChains.forEach((callChain: PerfCallChain, index: number): void => {
      if (this.threadData[callChain.tid] === undefined) {
        return;
      }
      this.setPerfCallChainFrameName(callChain);
      this.addPerfGroupData(callChain);
      if (index + 1 < callChains.length && callChains[index + 1].sampleId === callChain.sampleId) {
        PerfCallChain.setPreviousNode(callChain, callChains[index + 1]);
      }
      if (callChains.length === index + 1 || callChains[index + 1].sampleId !== callChain.sampleId) {
        this.addProcessThreadStateData(callChain);
      }
    });
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

  addProcessThreadStateData(callChain: PerfCallChain): void {
    //当调用栈为调用的根节点时
    this.addPerfCallData(callChain);
    let threadCallChain = new PerfCallChain(); //新增的线程数据
    threadCallChain.depth = 0;
    PerfCallChain.merageCallChain(threadCallChain, callChain);
    threadCallChain.canCharge = false;
    threadCallChain.name = `${this.threadData[callChain.tid].threadName || 'Thread'}(${callChain.tid})`;
    let threadStateCallChain = new PerfCallChain(); //新增的线程状态数据
    PerfCallChain.merageCallChain(threadStateCallChain, callChain);
    threadStateCallChain.name = callChain.threadState || 'Unknown State';
    threadStateCallChain.fileName = threadStateCallChain.name === '-' ? 'Unknown Thread State' : '';
    threadStateCallChain.canCharge = false;
    this.addPerfGroupData(threadCallChain);
    this.addPerfGroupData(threadStateCallChain);
    PerfCallChain.setNextNode(threadCallChain, threadStateCallChain);
    PerfCallChain.setNextNode(threadStateCallChain, callChain);
  }

  addPerfCallData(callChain: PerfCallChain): void {
    let perfCall = new PerfCall();
    perfCall.depth = this.callChainData[callChain.sampleId]?.length || 0;
    perfCall.sampleId = callChain.sampleId;
    perfCall.name = callChain.name;
    this.dataCache.perfCallChainMap.set(callChain.sampleId, perfCall);
  }

  addPerfGroupData(callChain: PerfCallChain): void {
    const currentCallChain = this.callChainData[callChain.sampleId] || [];
    this.callChainData[callChain.sampleId] = currentCallChain;
    if (currentCallChain.length > maxDepth) {
      currentCallChain.splice(0, 1);
    }
    currentCallChain.push(callChain);
  }

  getPerfCallChainsBySampleIds(sampleIds: string[], isTopDown: boolean): PerfCallChainMerageData[] {
    this.allProcess = this.groupNewTreeNoId(sampleIds, isTopDown);
    return this.allProcess;
  }

  addOtherCallchainsData(countSample: PerfCountSample, list: any[]): void {
    let threadCallChain = new PerfCallChain(); //新增的线程数据
    threadCallChain.tid = countSample.tid;
    threadCallChain.canCharge = false;
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

  freshPerfCallchains(perfCountSamples: PerfCountSample[], isTopDown: boolean): void {
    this.currentTreeMapData = {};
    this.currentTreeList = [];
    let totalSamplesCount = 0;
    this.processMap = new Map<number, { count: number; eventCount: number }>();
    this.threadMap = new Map<number, { count: number; eventCount: number }>();
    perfCountSamples.forEach((perfSample) => {
      if (this.processMap.has(perfSample.pid)) {
        this.processMap.get(perfSample.pid)!.count += perfSample.count;
        this.processMap.get(perfSample.pid)!.eventCount += perfSample.eventCount;
      } else {
        this.processMap.set(perfSample.pid, { count: perfSample.count, eventCount: perfSample.eventCount });
      }
      if (this.threadMap.has(perfSample.tid)) {
        this.threadMap.get(perfSample.tid)!.count += perfSample.count;
        this.threadMap.get(perfSample.tid)!.eventCount += perfSample.eventCount;
      } else {
        this.threadMap.set(perfSample.tid, { count: perfSample.count, eventCount: perfSample.eventCount });
      }
    });

    perfCountSamples.forEach((perfSample): void => {
      totalSamplesCount += perfSample.count;
      if (this.callChainData[perfSample.sampleId] && this.callChainData[perfSample.sampleId].length > 0) {
        let perfCallChains = [...this.callChainData[perfSample.sampleId]];
        this.addOtherCallchainsData(perfSample, perfCallChains);
        let topIndex = isTopDown ? 0 : perfCallChains.length - 1;
        if (perfCallChains.length > 0) {
          let perfRootNode = this.currentTreeMapData[perfCallChains[topIndex].name + perfSample.pid];
          if (perfRootNode === undefined) {
            perfRootNode = new PerfCallChainMerageData();
            this.currentTreeMapData[perfCallChains[topIndex].name + perfSample.pid] = perfRootNode;
            this.currentTreeList.push(perfRootNode);
          }

          PerfCallChainMerageData.merageCallChainSample(
            perfRootNode,
            perfCallChains[topIndex],
            perfSample,
            false,
            this.processMap,
            this.threadMap
          );
          this.mergeChildrenByIndex(perfRootNode, perfCallChains, topIndex, perfSample, isTopDown);
        }
      }
    });
    let rootMerageMap: any = {};
    // @ts-ignore
    Object.values(this.currentTreeMapData).forEach((merageData: any): void => {
      if (rootMerageMap[merageData.pid] === undefined) {
        let perfProcessMerageData = new PerfCallChainMerageData(); //新增进程的节点数据
        perfProcessMerageData.canCharge = false;
        perfProcessMerageData.symbolName =
          (this.threadData[merageData.tid].processName || 'Process') + `(${merageData.pid})`;
        perfProcessMerageData.symbol = perfProcessMerageData.symbolName;
        perfProcessMerageData.tid = merageData.tid;
        perfProcessMerageData.children.push(merageData);
        perfProcessMerageData.initChildren.push(merageData);
        perfProcessMerageData.dur = merageData.dur;
        perfProcessMerageData.count = merageData.dur;
        perfProcessMerageData.eventCount = merageData.eventCount;
        perfProcessMerageData.total = totalSamplesCount;
        perfProcessMerageData.tsArray = [...merageData.tsArray];
        rootMerageMap[merageData.pid] = perfProcessMerageData;
      } else {
        rootMerageMap[merageData.pid].children.push(merageData);
        rootMerageMap[merageData.pid].initChildren.push(merageData);
        rootMerageMap[merageData.pid].dur += merageData.dur;
        rootMerageMap[merageData.pid].count += merageData.dur;
        rootMerageMap[merageData.pid].eventCount += merageData.eventCount;
        rootMerageMap[merageData.pid].total = totalSamplesCount;
        for (const ts of merageData.tsArray) {
          rootMerageMap[merageData.pid].tsArray.push(ts);
        }
      }
      merageData.parentNode = rootMerageMap[merageData.pid]; //子节点添加父节点的引用
    });
    let id = 0;
    this.currentTreeList.forEach((perfTreeNode: any): void => {
      perfTreeNode.total = totalSamplesCount;
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
    // @ts-ignore
    this.allProcess = Object.values(rootMerageMap);
  }

  mergeChildrenByIndex(
    currentNode: PerfCallChainMerageData,
    callChainDataList: any[],
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
        if (child.symbolName === callChainDataList[index]?.name) {
          node = child;
          PerfCallChainMerageData.merageCallChainSample(
            child,
            callChainDataList[index],
            sample,
            isEnd,
            this.processMap,
            this.threadMap
          );
          return true;
        }
        return false;
      }).length === 0
    ) {
      node = new PerfCallChainMerageData();
      PerfCallChainMerageData.merageCallChainSample(
        node,
        callChainDataList[index],
        sample,
        isEnd,
        this.processMap,
        this.threadMap
      );
      node.processPercent = node.count / this.processMap.get(node.pid)!.count;
      node.processEventPercent = node.eventCount / this.processMap.get(node.pid)!.eventCount;
      node.threadPercent = node.count / this.threadMap.get(node.tid)!.count;
      node.threadEventPercent = node.eventCount / this.threadMap.get(node.tid)!.eventCount;
      currentNode.children.push(node);
      currentNode.initChildren.push(node);
      this.currentTreeList.push(node);
      node.parentNode = currentNode;
    }
    if (node! && !isEnd) this.mergeChildrenByIndex(node, callChainDataList, index, sample, isTopDown);
  }

  groupNewTreeNoId(sampleIds: string[], isTopDown: boolean): any[] {
    this.currentTreeMapData = {};
    this.currentTreeList = [];
    for (let i = 0; i < sampleIds.length; i++) {
      let callChains = this.callChainData[sampleIds[i]];
      if (callChains === undefined) continue;
      let topIndex = isTopDown ? 0 : callChains.length - 1;
      if (callChains.length > 0) {
        let root = this.currentTreeMapData[callChains[topIndex].name + callChains[topIndex].pid];
        if (root === undefined) {
          root = new PerfCallChainMerageData();
          this.currentTreeMapData[callChains[topIndex].name + callChains[topIndex].pid] = root;
          this.currentTreeList.push(root);
        }
        PerfCallChainMerageData.merageCallChain(root, callChains[topIndex], isTopDown);
        this.merageChildren(root, callChains[topIndex], isTopDown);
      }
    }
    let rootMerageMap: any = {};
    // @ts-ignore
    Object.values(this.currentTreeMapData).forEach((merageData: any): void => {
      if (rootMerageMap[merageData.pid] === undefined) {
        let processMerageData = new PerfCallChainMerageData(); //新增进程的节点数据
        processMerageData.canCharge = false;
        processMerageData.symbolName = this.threadData[merageData.tid].processName || `Process(${merageData.pid})`;
        processMerageData.symbol = processMerageData.symbolName;
        processMerageData.tid = merageData.tid;
        processMerageData.children.push(merageData);
        processMerageData.initChildren.push(merageData);
        processMerageData.dur = merageData.dur;
        processMerageData.count = merageData.dur;
        processMerageData.eventCount = merageData.dur;
        processMerageData.total = sampleIds.length;
        rootMerageMap[merageData.pid] = processMerageData;
      } else {
        rootMerageMap[merageData.pid].children.push(merageData);
        rootMerageMap[merageData.pid].initChildren.push(merageData);
        rootMerageMap[merageData.pid].dur += merageData.dur;
        rootMerageMap[merageData.pid].count += merageData.dur;
        rootMerageMap[merageData.pid].eventCount += merageData.dur;
        rootMerageMap[merageData.pid].total = sampleIds.length;
      }
      merageData.parentNode = rootMerageMap[merageData.pid]; //子节点添加父节点的引用
    });
    let id = 0;
    this.currentTreeList.forEach((node: any): void => {
      node.total = sampleIds.length;
      if (node.id === '') {
        node.id = id + '';
        id++;
      }
      if (node.parentNode) {
        if (node.parentNode.id === '') {
          node.parentNode.id = id + '';
          id++;
        }
        node.parentId = node.parentNode.id;
      }
    });
    // @ts-ignore
    return Object.values(rootMerageMap);
  }

  merageChildren(currentNode: PerfCallChainMerageData, callChain: any, isTopDown: boolean): void {
    let nextNodeKey = isTopDown ? 'nextNode' : 'previousNode';
    if (callChain[nextNodeKey] === undefined) {
      return;
    }
    let node;
    if (
      currentNode.initChildren.filter((child: PerfCallChainMerageData): boolean => {
        if (child.symbolName === callChain[nextNodeKey]?.name) {
          node = child;
          PerfCallChainMerageData.merageCallChain(child, callChain[nextNodeKey], isTopDown);
          return true;
        }
        return false;
      }).length === 0
    ) {
      node = new PerfCallChainMerageData();
      PerfCallChainMerageData.merageCallChain(node, callChain[nextNodeKey], isTopDown);
      currentNode.children.push(node);
      currentNode.initChildren.push(node);
      this.currentTreeList.push(node);
      node.parentNode = currentNode;
    }
    if (node) {
      this.merageChildren(node, callChain[nextNodeKey], isTopDown);
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
          switch (item.funcName) {
            case 'getCallChainsBySampleIds':
              this.freshPerfCallchains(this.samplesData, item.funcArgs[0]);
              break;
            case 'getCurrentDataFromDb':
              this.getCurrentDataFromDb(item.funcArgs[0]);
              break;
            case 'hideSystemLibrary':
              this.hideSystemLibrary();
              break;
            case 'hideThread':
              this.isHideThread = item.funcArgs[0];
              break;
            case 'hideThreadState':
              this.isHideThreadState = item.funcArgs[0];
              break;
            case 'hideNumMaxAndMin':
              this.hideNumMaxAndMin(item.funcArgs[0], item.funcArgs[1]);
              break;
            case 'splitAllProcess':
              this.splitAllProcess(item.funcArgs[0]);
              break;
            case 'resetAllNode':
              this.resetAllNode(this.allProcess);
              break;
            case 'resotreAllNode':
              this.resetAllSymbol(item.funcArgs[0]);
              break;
            case 'clearSplitMapData':
              this.clearSplitMapData(item.funcArgs[0]);
              break;
            case 'splitTree':
              this.splitPerfTree(this.allProcess, item.funcArgs[0], item.funcArgs[1], item.funcArgs[2]);
              break;
            case 'setSearchValue':
              this.searchValue = item.funcArgs[0];
              break;
            case 'setEventTypeId':
              this.eventTypeId = item.funcArgs[0];
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
      }
      this.dataSource = this.allProcess.filter((process: PerfCallChainMerageData): boolean => {
        return process.children && process.children.length > 0;
      });
    }
    return this.dataSource;
  }

  combineCallChainForAnalysis(): PerfAnalysisSample[] {
    let sampleCallChainList: Array<PerfAnalysisSample> = [];
    for (let sample of this.samplesData) {
      let callChains = [...this.callChainData[sample.sampleId]];
      const lastCallChain = callChains[callChains.length - 1];
      const threadName = this.threadData[sample.tid].threadName || 'Thread';
      const processName = this.threadData[sample.pid].threadName || 'Process';
      let analysisSample = new PerfAnalysisSample(
        threadName,
        processName,
        lastCallChain.fileId,
        lastCallChain.fileName,
        lastCallChain.symbolId,
        lastCallChain.name
      );
      analysisSample.tid = sample.tid;
      analysisSample.pid = sample.pid;
      analysisSample.count = sample.count;
      analysisSample.threadState = sample.threadState;
      analysisSample.eventCount = sample.eventCount;
      sampleCallChainList.push(analysisSample);
    }
    if (this.isAnalysis) {
      this.isAnalysis = false;
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
          existingNode.calculateSelfTime();
          existingNode.notifyParentUpdateSelfTime();
        } else {
          let newNode = new PerfBottomUpStruct(`${item.name}(${item.fileName})`);
          newNode.totalTime = perfTime * sample.count;
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
  name: string = '';
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
  #parentNode: PerfCallChainMerageData | undefined = undefined;
  #total = 0;
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
  processPercent: number = 0;
  threadEventPercent: number = 0;
  threadPercent: number = 0;
  processEventPercent: number = 0;
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

  static merageCallChain(currentNode: PerfCallChainMerageData, callChain: PerfCallChain, isTopDown: boolean): void {
    if (currentNode.symbolName === '') {
      currentNode.symbol = `${callChain.name}  ${callChain.fileName ? `(${callChain.fileName})` : ''}`;
      currentNode.symbolName = callChain.name;
      currentNode.pid = callChain.pid;
      currentNode.tid = callChain.tid;
      currentNode.libName = callChain.fileName;
      currentNode.vaddrInFile = callChain.vaddrInFile;
      currentNode.addr = `${'0x'}${callChain.vaddrInFile.toString(16)}`;
      currentNode.lib = currentNode.libName;
      currentNode.canCharge = callChain.canCharge;
      if (callChain.path) {
        currentNode.path = callChain.path;
      }
    }
    if (callChain[isTopDown ? 'nextNode' : 'previousNode'] === undefined) {
      currentNode.selfDur += callChain.count;
    }
    currentNode.dur += callChain.count;
    currentNode.count += callChain.count;
    currentNode.eventCount += callChain.eventCount;
  }

  static merageCallChainSample(
    currentNode: PerfCallChainMerageData,
    callChain: PerfCallChain,
    sample: PerfCountSample,
    isEnd: boolean,
    processMap: Map<number, { count: number; eventCount: number }>,
    threadMap: Map<number, { count: number; eventCount: number }>
  ): void {
    if (currentNode.symbolName === '') {
      currentNode.symbol = `${callChain.name}  ${callChain.fileName ? `(${callChain.fileName})` : ''}`;
      currentNode.symbolName = callChain.name;
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
    currentNode.dur += sample.count;
    currentNode.count += sample.count;
    currentNode.eventCount += sample.eventCount;
    currentNode.processPercent = currentNode.count / processMap.get(currentNode.pid)!.count;
    currentNode.processEventPercent = currentNode.eventCount / processMap.get(currentNode.pid)!.eventCount;
    currentNode.threadPercent = currentNode.count / threadMap.get(currentNode.tid)!.count;
    currentNode.threadEventPercent = currentNode.eventCount / threadMap.get(currentNode.tid)!.eventCount;
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
