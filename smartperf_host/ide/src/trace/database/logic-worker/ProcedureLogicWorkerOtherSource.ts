/*
 * Copyright (C) 2025 Huawei Device Co., Ltd.
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

import { FilterByAnalysis, NativeMemoryExpression } from "../../bean/NativeHook";
import { convertJSON, DataCache, getByteWithUnit, HeapTreeDataBean, LogicHandler, MerageBean, merageBeanDataSplit, setFileName } from "./ProcedureLogicWorkerCommon";

export class NativeMemory {
  index: number = 0;
  eventId: number = 0;
  eventType: string = '';
  subType: string = '';
  subTypeId: number = 0;
  addr: string = '';
  startTs: number = 0;
  endTs: number = 0;
  heapSize: number = 0;
  symbol: string = '';
  library: string = '';
  lastLibId: number = 0;
  lastSymbolId: number = 0;
  isSelected: boolean = false;
  threadId: number = 0;
}

export class NativeHookStatistics {
  id: number = 0;
  eventId: number = 0;
  eventType: string = '';
  subType: string = '';
  subTypeId: number = 0;
  heapSize: number = 0;
  freeSize: number = 0;
  addr: string = '';
  startTs: number = 0;
  endTs: number = 0;
  sumHeapSize: number = 0;
  max: number = 0;
  count: number = 0;
  freeCount: number = 0;
  tid: number = 0;
  threadName: string = '';
  lastLibId: number = 0;
  lastSymbolId: number = 0;
  isSelected: boolean = false;
  tsArray: Array<number> = [];
  countArray: Array<number> = [];
}

export class NativeHookCallInfo extends MerageBean {
  #totalCount: number = 0;
  #totalSize: number = 0;
  symbolId: number = 0;
  fileId: number = 0;
  count: number = 0;
  countValue: string = '';
  countPercent: string = '';
  type: number = 0;
  heapSize: number = 0;
  heapPercent: string = '';
  heapSizeStr: string = '';
  eventId: number = 0;
  tid: number = 0;
  threadName: string | undefined = '';
  eventType: string = '';
  isSelected: boolean = false;
  set totalCount(total: number) {
    this.#totalCount = total;
    this.countValue = `${this.count}`;
    this.size = this.heapSize;
    this.countPercent = `${((this.count / total) * 100).toFixed(1)}%`;
  }
  get totalCount(): number {
    return this.#totalCount;
  }
  set totalSize(total: number) {
    this.#totalSize = total;
    this.heapSizeStr = `${getByteWithUnit(this.heapSize)}`;
    this.heapPercent = `${((this.heapSize / total) * 100).toFixed(1)}%`;
  }
  get totalSize(): number {
    return this.#totalSize;
  }
}

type CallInfoMap = {
  [key: string]: NativeHookCallInfo;
};

const HAP_TYPE = ['.hap', '.har', '.hsp'];

export class StatisticsSelection {
  memoryTap: string = '';
  max: number = 0;
}

type StatisticMap = {
  [key: string]: NativeHookStatistics;
};

export class ProcedureLogicWorkerOtherSource extends LogicHandler {
  queryAllCallchainsSamples: NativeHookStatistics[] = [];
  isStatisticMode: boolean = false;
  private dataCache = DataCache.getInstance();
  private currentSelectIPid: number = 1;
  currentEventId: string = '';
  isHideThread: boolean = false;
  useFreedSize: boolean = false;
  splitMapData: CallInfoMap = {};
  allThreads: NativeHookCallInfo[] = [];
  currentSamples: NativeHookStatistics[] = [];
  responseTypes: { key: number; value: string }[] = [];
  searchValue: string = '';
  realTimeDif: number = 0;
  currentTreeMapData: CallInfoMap = {};
  currentTreeList: NativeHookCallInfo[] = [];
  boxRangeNativeHook: Array<NativeMemory> = [];
  osArgs?: Map<string, unknown>;

  clearAll(): void {
    this.dataCache.clearGM();
    this.splitMapData = {};
    this.currentSamples = [];
    this.allThreads = [];
    this.queryAllCallchainsSamples = [];
    this.realTimeDif = 0;
    this.currentTreeMapData = {};
    this.currentTreeList.length = 0;
    this.responseTypes.length = 0;
    this.boxRangeNativeHook = [];
    this.osArgs?.clear();
    this.isHideThread = false;
    this.useFreedSize = false;
  }

  handle(data: unknown): void {
    //@ts-ignore
    this.currentEventId = data.id;
    //@ts-ignore
    if (data && data.type) {
      //@ts-ignore
      switch (data.type) {
        case 'other-source-init':
          //@ts-ignore
          this.osInit(data.params);
          break;
        case 'other-source-queryOSFrameData':
          this.osQueryNMFrameData(data);
          break;
        case 'other-source-queryAnalysis':
          this.osQueryAnalysis(data);
          break;
        case 'other-source-reset':
          this.isHideThread = false;
          break;
        case 'other-source-get-responseType':
          this.osGetResponseType(data);
          break;
        // case 'other-source-queryCallchainsSamples':
        //   this.osQueryCallchainsSamples(data);
        //   break;
        case 'other-source-queryStatisticCallchainsSamples':
          this.osQueryStatisticCallchainsSamples(data);
          break;
        case 'other-source-calltree-action':
          this.osCalltreeAction(data);
          break;
        case 'other-source-set-current_ipid':
          //@ts-ignore
          this.currentSelectIPid = data.params;
      }
    }
  }

  private osInit(params: unknown): void {
    this.clearAll();
    //@ts-ignore
    if (params.isRealtime) {
      //@ts-ignore
      this.realTimeDif = params.realTimeDif;
    }
    this.initOSFrameData()
  }

  private osQueryNMFrameData(data: unknown): void {
    //@ts-ignore
    let arr = convertJSON(data.params.list) || [];
    //@ts-ignore
    this.initOtherSourceStack(arr);
    arr = [];
    self.postMessage({
      //@ts-ignore
      id: data.id,
      action: 'other-source-init',
      results: [],
    });
  }

  initOtherSourceStack(frameArr: Array<HeapTreeDataBean>): void {
    frameArr.map((frame): void => {
      let frameEventId = frame.eventId;
      if (this.dataCache.osHeapFrameMap.has(frameEventId)) {
        this.dataCache.osHeapFrameMap.get(frameEventId)!.push(frame);
      } else {
        this.dataCache.osHeapFrameMap.set(frameEventId, [frame]);
      }
    });
  }

  initOSFrameData(): void {
    this.queryData(
      this.currentEventId,
      'other-source-queryOSFrameData',
      `select h.symbol_id as symbolId, h.file_id as fileId, h.depth, h.callchain_id as eventId, h.vaddr as addr
                    from native_hook_frame h
        `,
      {}
    );
  }

  private osQueryAnalysis(data: unknown): void {
    //@ts-ignore
    if (data.params.list) {
      //@ts-ignore
      let samples = convertJSON(data.params.list) || [];
      //@ts-ignore
      this.queryAllCallchainsSamples = samples;
      self.postMessage({
        //@ts-ignore
        id: data.id,
        //@ts-ignore
        action: data.action,
        results: this.combineStatisticAndCallChain(this.queryAllCallchainsSamples),
      });
    } else {
      //@ts-ignore
      if (data.params.isStatistic) {
        this.isStatisticMode = true;
        this.queryStatisticCallchainsSamples(
          'other-source-queryAnalysis',
          //@ts-ignore
          data.params.leftNs,
          //@ts-ignore
          data.params.rightNs,
          //@ts-ignore
          data.params.types
        );
      } else {
        //非统计模式
      }
    }
  }

  queryStatisticCallchainsSamples(action: string, leftNs: number, rightNs: number, types: Array<number>): void {
    let condition = '';
    if (types && types.length > 0) {
      const sortedTypes: number[] = [...new Set(types)].sort((a, b) => a - b);
      const typeValues: number[] = [];
      if (sortedTypes.includes(1)) typeValues.push(4);
      if (sortedTypes.includes(2)) typeValues.push(5);
      if (typeValues.length > 0) {
        condition = `and type in (${typeValues.join(',')})`;
      }
    }
    let sql = `select A.id,
                0 as tid,
                callchain_id as eventId,
                (case when type = 4 then 'FD' when type = 5 then 'THREAD' end) as eventType,
                (case when sub_type_id not null then sub_type_id else type end) as subTypeId,
                max(apply_size) as heapSize,
                max(release_size) as freeSize,
                apply_count as count,
                release_count as freeCount,
                (max(A.ts) - B.start_ts) as startTs,
                ifnull(last_lib_id,0) as lastLibId,
                ifnull(last_symbol_id,0) as lastSymbolId
            from
                native_hook_statistic A,
                trace_range B
            where
                A.ts - B.start_ts
                between ${leftNs} and ${rightNs}
                ${condition}
                and A.ipid = ${this.currentSelectIPid}
            group by callchain_id,type;`;
    this.queryData(this.currentEventId, action, sql, {});
  }

  combineStatisticAndCallChain(samples: NativeHookStatistics[]): Array<AnalysisSample> {
    samples.sort((a, b) => a.id - b.id);
    const analysisSampleList: Array<AnalysisSample> = [];
    const applyfdSamples: Array<AnalysisSample> = [];
    const applythSamples: Array<AnalysisSample> = [];
    for (const sample of samples) {
      const count = this.isStatisticMode ? sample.count : 1;
      const analysisSample = new AnalysisSample(sample.id, sample.heapSize, count, sample.eventType, sample.startTs);
      if (this.isStatisticMode) {
        this.setStatisticSubType(analysisSample, sample);
      } else {
        //非统计模式
      }
      let s = this.setAnalysisSampleArgs(analysisSample, sample);
      analysisSampleList.push(s);
    }
    return analysisSampleList;
  }

  private setStatisticSubType(analysisSample: AnalysisSample, sample: NativeHookStatistics): void {
    analysisSample.releaseCount = sample.freeCount;
    analysisSample.releaseSize = sample.freeSize;
    switch (sample.subTypeId) {
      case 4:
        analysisSample.subType = 'FD';
        break;
      case 5:
        analysisSample.subType = 'THREAD';
        break;
      default:
        analysisSample.subType = this.dataCache.dataDict.get(sample.subTypeId);
    }
  }

  private setAnalysisSampleArgs(analysisSample: AnalysisSample, sample: NativeHookStatistics): AnalysisSample {
    const filePath = this.dataCache.dataDict.get(sample.lastLibId)!;
    let libName = '';
    if (filePath) {
      const path = filePath.split('/');
      libName = path[path.length - 1];
    }
    const symbolName = this.dataCache.dataDict.get(sample.lastSymbolId) || libName + ' (' + sample.addr + ')';
    analysisSample.libId = sample.lastLibId || -1;
    analysisSample.libName = libName || 'Unknown';
    analysisSample.symbolId = sample.lastSymbolId || -1;
    analysisSample.symbolName = symbolName || 'Unknown';
    return analysisSample;
  }

  private osGetResponseType(data: { params?: unknown; id?: string; action?: string }): void {
    self.postMessage({
      id: data.id,
      action: data.action,
      results: this.responseTypes,
    });
  }

  private osQueryStatisticCallchainsSamples(data: unknown): void {
    this.searchValue = '';
    //@ts-ignore
    if (data.params.list) {
      //@ts-ignore
      let samples = convertJSON(data.params.list) || [];
      //@ts-ignore
      this.queryAllCallchainsSamples = samples;
      this.freshCurrentCallchains(this.queryAllCallchainsSamples, true);
      // @ts-ignore
      self.postMessage({
        //@ts-ignore
        id: data.id,
        //@ts-ignore
        action: data.action,
        results: this.allThreads,
      });
    } else {
      this.queryStatisticCallchainsSamples(
        'other-source-queryStatisticCallchainsSamples',
        //@ts-ignore
        data.params.leftNs,
        //@ts-ignore
        data.params.rightNs,
        //@ts-ignore
        data.params.types
      );
    }
  }

  private osCalltreeAction(data: { params?: unknown; id?: string; action?: string }): void {
    if (data.params) {
      self.postMessage({
        id: data.id,
        action: data.action,
        //@ts-ignore
        results: this.resolvingOSCallAction(data.params),
      });
    }
  }

  resolvingOSCallAction(params: unknown[]): NativeHookCallInfo[] {
    if (params.length > 0) {
      params.forEach((item: unknown): void => {
        //@ts-ignore
        let funcName = item.funcName;
        //@ts-ignore
        let args = item.funcArgs;
        if (funcName && args) {
          this.handleDataByFuncName(funcName, args);
        }
      });
    }
    return this.allThreads.filter((thread: NativeHookCallInfo): boolean => {
      return thread.children && thread.children.length > 0;
    });
  }

  handleDataByFuncName(funcName: string, args: unknown[]): void {
    switch (funcName) {
      case 'hideThread':
        this.isHideThread = args[0] as boolean;
        break;
      case 'groupCallchainSample':
        this.groupCallChainSample(args[0] as Map<string, unknown>);
        break;
      case 'getCallChainsBySampleIds':
        this.freshCurrentCallchains(this.currentSamples, args[0] as boolean);
        break;
      case 'hideSystemLibrary':
        merageBeanDataSplit.hideSystemLibrary(this.allThreads, this.splitMapData);
        break;
      case 'hideNumMaxAndMin':
        merageBeanDataSplit.hideNumMaxAndMin(this.allThreads, this.splitMapData, args[0] as number, args[1] as string);
        break;
      case 'splitAllProcess':
        merageBeanDataSplit.splitAllProcess(this.allThreads, this.splitMapData, args[0]);
        break;
      case 'resetAllNode':
        merageBeanDataSplit.resetAllNode(this.allThreads, this.currentTreeList, this.searchValue);
        break;
      case 'resotreAllNode':
        merageBeanDataSplit.resotreAllNode(this.splitMapData, args[0] as string[]);
        break;
      case 'splitTree':
        merageBeanDataSplit.splitTree(
          this.splitMapData,
          this.allThreads,
          args[0] as string,
          args[1] as boolean,
          args[2] as boolean,
          this.currentTreeList,
          this.searchValue
        );
        break;
      case 'setSearchValue':
        this.searchValue = args[0] as string;
        break;
      case 'clearSplitMapData':
        this.clearSplitMapData(args[0] as string);
        break;
    }
  }

  private groupCallChainSample(paramMap: Map<string, unknown>): void {
    let filterAllocType = paramMap.get('filterAllocType') as string;
    let filterEventType = paramMap.get('filterEventType') as string;
    let filterResponseType = paramMap.get('filterResponseType') as number;
    let filterAnalysis = paramMap.get('filterByTitleArr') as FilterByAnalysis;
    if (filterAnalysis) {
      if (filterAnalysis.type) {
        filterEventType = filterAnalysis.type;
      }
      if (filterAnalysis.libId) {
        filterResponseType = filterAnalysis.libId;
      }
    }
    let libTree = paramMap?.get('filterExpression') as NativeMemoryExpression;
    let leftNs = paramMap.get('leftNs') as number;
    let rightNs = paramMap.get('rightNs') as number;
    let nativeHookType = paramMap.get('nativeHookType') as string;
    let statisticsSelection = paramMap.get('statisticsSelection') as StatisticsSelection[];
    if (!libTree && filterAllocType === '0' && filterEventType === '0' && filterResponseType === -1) {
      this.currentSamples = this.queryAllCallchainsSamples;
      return;
    }
    this.useFreedSize = this.isStatisticMode && filterAllocType === '2';
    let filter = this.dataFilter(
      libTree,
      filterAnalysis,
      filterAllocType,
      leftNs,
      rightNs,
      nativeHookType,
      filterResponseType,
      filterEventType,
      statisticsSelection
    );
    let groupMap = this.setGroupMap(filter, filterAllocType, nativeHookType);
    this.currentSamples = Object.values(groupMap);
  }

  private dataFilter(
    libTree: NativeMemoryExpression,
    filterAnalysis: FilterByAnalysis,
    filterAllocType: string,
    leftNs: number,
    rightNs: number,
    nativeHookType: string,
    filterResponseType: number,
    filterEventType: string,
    statisticsSelection: StatisticsSelection[]
  ): NativeHookStatistics[] {
    return this.queryAllCallchainsSamples.filter((item: NativeHookStatistics): boolean => {
      let filterAllocation = true;
      if (nativeHookType === 'native-hook') {
        filterAllocation = this.setFilterAllocation(item, filterAllocType, filterAllocation, leftNs, rightNs);
      } else {
        if (filterAllocType === '1') {
          filterAllocation = item.heapSize > item.freeSize;
        } else if (filterAllocType === '2') {
          filterAllocation = item.freeSize > 0;
        }
      }
      let filterThread = true;
      if (filterAnalysis && filterAnalysis.tid) {
        filterThread = item.tid === filterAnalysis.tid;
      }
      let filterLastLib = true;
      if (libTree) {
        filterLastLib = this.filterExpressionSample(item, libTree);
        this.searchValue = '';
      } else {
        filterLastLib = filterResponseType === -1 ? true : filterResponseType === item.lastLibId;
      }
      let filterFunction = true;
      if (filterAnalysis && filterAnalysis.symbolId) {
        filterFunction = filterAnalysis.symbolId === item.lastSymbolId;
      }
      let filterNative = this.getTypeFromIndex(parseInt(filterEventType), item, statisticsSelection);
      return filterAllocation && filterNative && filterLastLib && filterThread && filterFunction;
    });
  }

  private setFilterAllocation(
    item: NativeHookStatistics,
    filterAllocType: string,
    filterAllocation: boolean,
    leftNs: number,
    rightNs: number
  ): boolean {
    if (filterAllocType === '1') {
      filterAllocation =
        item.startTs >= leftNs &&
        item.startTs <= rightNs &&
        (item.endTs > rightNs || item.endTs === 0 || item.endTs === null);
    } else if (filterAllocType === '2') {
      filterAllocation =
        item.startTs >= leftNs &&
        item.startTs <= rightNs &&
        item.endTs <= rightNs &&
        item.endTs !== 0 &&
        item.endTs !== null;
    }
    return filterAllocation;
  }

  private filterExpressionSample(sample: NativeHookStatistics, expressStruct: NativeMemoryExpression): boolean {
    const itemLibName = this.dataCache.dataDict.get(sample.lastLibId);
    const itemSymbolName = this.dataCache.dataDict.get(sample.lastSymbolId);
    if (!itemLibName || !itemSymbolName) {
      return false;
    }

    function isMatch(libTree: Map<string, string[]>, match: boolean): boolean {
      for (const [lib, symbols] of libTree) {
        // lib不包含则跳过
        if (!itemLibName!.toLowerCase().includes(lib.toLowerCase()) && lib !== '*') {
          continue;
        }
        // * 表示全量
        if (symbols.includes('*')) {
          match = true;
          break;
        }

        for (const symbol of symbols) {
          // 匹配到了就返回
          if (itemSymbolName!.toLowerCase().includes(symbol.toLowerCase())) {
            match = true;
            break;
          }
        }
        // 如果匹配到了，跳出循环
        if (match) {
          break;
        }
        //全部没有匹配到
        match = false;
      }
      return match;
    }

    let includeMatch = expressStruct.includeLib.size === 0; // true表达这条数据需要显示
    includeMatch = isMatch(expressStruct.includeLib, includeMatch);

    if (expressStruct.abandonLib.size === 0) {
      return includeMatch;
    }

    let abandonMatch = false; // false表示这条数据需要显示
    abandonMatch = isMatch(expressStruct.abandonLib, abandonMatch);

    return includeMatch && !abandonMatch;
  }

  getTypeFromIndex(
    indexOf: number,
    item: NativeHookStatistics | NativeMemory,
    statisticsSelection: Array<StatisticsSelection>
  ): boolean {
    if (indexOf === -1) {
      return false;
    }
    if (indexOf < 3) {
      if (indexOf === 0) {
        return true;
      } else if (indexOf === 1) {
        return item.eventType.indexOf('FD') === 0;
      } else if (indexOf === 2) {
        return item.eventType.indexOf('THREAD') === 0;
      }
    }
    else if (indexOf - 2 < statisticsSelection.length) {
      let selectionElement = statisticsSelection[indexOf - 2];
      if (selectionElement.memoryTap !== undefined && selectionElement.max !== undefined) {
        if (selectionElement.memoryTap.indexOf('FD') !== -1) {
          return item.eventType.indexOf('FD') === 0 && item.heapSize === selectionElement.max;
        } else if (selectionElement.memoryTap.indexOf('THREAD') !== -1) {
          return item.eventType.indexOf('THREAD') === 0 && item.heapSize === selectionElement.max && item.subTypeId === null;
        }
      }
    }
    return false;
  }

  private freshCurrentCallchains(samples: NativeHookStatistics[], isTopDown: boolean): void {
    this.currentTreeMapData = {};
    this.currentTreeList = [];
    let totalSize = 0;
    let totalCount = 0;
    samples.forEach((nativeHookSample: NativeHookStatistics): void => {
      if (nativeHookSample.eventId === -1) {
        return;
      }
      totalSize += nativeHookSample.heapSize;
      totalCount += nativeHookSample.count || 1;
      // 根据eventId拿到对应的调用栈
      let callChains = this.createThreadSample(nativeHookSample);
      let topIndex = isTopDown ? 0 : callChains.length - 1;
      if (callChains.length > 0) {
        let key = '';
        if (this.isHideThread) {
          key = (callChains[topIndex].symbolId || '') + '-' + (callChains[topIndex].fileId || '');
        } else {
          key =
            nativeHookSample.tid +
            '-' +
            (callChains[topIndex].symbolId || '') +
            '-' +
            (callChains[topIndex].fileId || '');
        }
        // 有根节点的话就拿到对应的根节点 -----线程
        let root = this.currentTreeMapData[key];
        // 没有当前项的根节点，就new一个新的，放在currentTreeList
        if (root === undefined) {
          root = new NativeHookCallInfo();
          root.threadName = nativeHookSample.threadName;
          // 把新建的根节点加到map对象
          this.currentTreeMapData[key] = root;
          // 并且假草根节点数组
          this.currentTreeList.push(root);
        }
        // 给顶层节点赋值，symbol,eventId,fileId等等
        this.mergeCallChainSample(root, callChains[topIndex], nativeHookSample);
        if (callChains.length > 1) {
          // 递归造树结构
          this.merageChildrenByIndex(root, callChains, topIndex, nativeHookSample, isTopDown);
        }
      }
    });
    // 合并线程级别
    let rootMerageMap = this.mergeNodeData(totalCount, totalSize);
    this.handleCurrentTreeList(totalCount, totalSize);
    this.allThreads = Object.values(rootMerageMap) as NativeHookCallInfo[];
  }

  createThreadSample(sample: NativeHookStatistics): HeapTreeDataBean[] {
    return this.dataCache.osHeapFrameMap.get(sample.eventId) || [];
  }

  mergeCallChainSample(
    currentNode: NativeHookCallInfo,
    callChain: HeapTreeDataBean,
    sample: NativeHookStatistics
  ): void {
    if (currentNode.symbol === undefined || currentNode.symbol === '') {
      currentNode.symbol = callChain.AllocationFunction || '';
      currentNode.addr = callChain.addr;
      currentNode.eventId = sample.eventId;
      currentNode.eventType = sample.eventType;
      currentNode.symbolId = callChain.symbolId;
      currentNode.fileId = callChain.fileId;
      currentNode.tid = sample.tid;
    }
    if (this.useFreedSize) {
      currentNode.count += sample.freeCount || 1;
    } else {
      currentNode.count += sample.count || 1;
    }

    if (sample.countArray && sample.countArray.length > 0) {
      currentNode.countArray = currentNode.countArray.concat(sample.countArray);
    } else {
      currentNode.countArray.push(sample.count);
    }

    if (sample.tsArray && sample.tsArray.length > 0) {
      currentNode.tsArray = currentNode.tsArray.concat(sample.tsArray);
    } else {
      currentNode.tsArray.push(sample.startTs);
    }
    if (this.useFreedSize) {
      currentNode.heapSize += sample.freeSize;
    } else {
      currentNode.heapSize += sample.heapSize;
    }
  }

  merageChildrenByIndex(
    currentNode: NativeHookCallInfo,
    callChainDataList: HeapTreeDataBean[],
    index: number,
    sample: NativeHookStatistics,
    isTopDown: boolean
  ): void {
    isTopDown ? index++ : index--;
    let isEnd = isTopDown ? callChainDataList.length === index + 1 : index === 0;
    let node: NativeHookCallInfo;
    if (
      //@ts-ignore
      currentNode.initChildren.filter((child: NativeHookCallInfo): boolean => {
        if (
          child.symbolId === callChainDataList[index]?.symbolId &&
          child.fileId === callChainDataList[index]?.fileId
        ) {
          node = child;
          this.mergeCallChainSample(child, callChainDataList[index], sample);
          return true;
        }
        return false;
      }).length === 0
    ) {
      node = new NativeHookCallInfo();
      this.mergeCallChainSample(node, callChainDataList[index], sample);
      currentNode.children.push(node);
      currentNode.initChildren.push(node);
      // 将所有节点存到this.currentTreeList
      this.currentTreeList.push(node);
      node.parentNode = currentNode;
    }
    if (node! && !isEnd) {
      this.merageChildrenByIndex(node, callChainDataList, index, sample, isTopDown);
    }
  }

  private setGroupMap(
    filter: Array<NativeHookStatistics>,
    filterAllocType: string,
    nativeHookType: string
  ): StatisticMap {
    let groupMap: StatisticMap = {};
    filter.forEach((sample: NativeHookStatistics): void => {
      let currentNode = groupMap[sample.tid + '-' + sample.eventId] || new NativeHookStatistics();
      if (currentNode.count === 0) {
        Object.assign(currentNode, sample);
        if (filterAllocType === '1' && nativeHookType !== 'native-hook') {
          currentNode.heapSize = sample.heapSize - sample.freeSize;
          currentNode.count = sample.count - sample.freeCount;
        }
        if (currentNode.count === 0) {
          currentNode.count++;
          currentNode.countArray.push(1);
          currentNode.tsArray.push(sample.startTs);
        }
      } else {
        currentNode.count++;
        currentNode.heapSize += sample.heapSize;
        currentNode.countArray.push(1);
        currentNode.tsArray.push(sample.startTs);
      }
      groupMap[sample.tid + '-' + sample.eventId] = currentNode;
    });
    return groupMap;
  }

  clearSplitMapData(symbolName: string): void {
    if (symbolName in this.splitMapData) {
      Reflect.deleteProperty(this.splitMapData, symbolName);
    }
  }

  private mergeNodeData(totalCount: number, totalSize: number): CallInfoMap {
    let rootMerageMap: CallInfoMap = {};
    let threads = Object.values(this.currentTreeMapData);
    // 遍历所有线程
    threads.forEach((merageData: NativeHookCallInfo): void => {
      if (this.isHideThread) {
        merageData.tid = 0;
        merageData.threadName = undefined;
      }
      // 没有父级，生成父级，把当前项放进去
      if (rootMerageMap[merageData.tid] === undefined) {
        let threadMerageData = new NativeHookCallInfo(); //新增进程的节点数据
        threadMerageData.canCharge = false;
        threadMerageData.type = -1;
        threadMerageData.isThread = true;
        threadMerageData.symbol = `${merageData.threadName || 'Thread'} [${merageData.tid}]`;
        threadMerageData.children.push(merageData);
        threadMerageData.initChildren.push(merageData);
        threadMerageData.count = merageData.count || 1;
        threadMerageData.heapSize = merageData.heapSize;
        threadMerageData.totalCount = totalCount;
        threadMerageData.totalSize = totalSize;
        threadMerageData.tsArray = [...merageData.tsArray];
        threadMerageData.countArray = [...merageData.countArray];
        rootMerageMap[merageData.tid] = threadMerageData;
      } else {
        // 有父级，直接放进去
        rootMerageMap[merageData.tid].children.push(merageData);
        rootMerageMap[merageData.tid].initChildren.push(merageData);
        rootMerageMap[merageData.tid].count += merageData.count || 1;
        rootMerageMap[merageData.tid].heapSize += merageData.heapSize;
        rootMerageMap[merageData.tid].totalCount = totalCount;
        rootMerageMap[merageData.tid].totalSize = totalSize;
        for (const count of merageData.countArray) {
          rootMerageMap[merageData.tid].countArray.push(count);
        }
        for (const ts of merageData.tsArray) {
          rootMerageMap[merageData.tid].tsArray.push(ts);
        }
      }
      merageData.parentNode = rootMerageMap[merageData.tid]; //子节点添加父节点的引用
    });
    return rootMerageMap;
  }

  private handleCurrentTreeList(totalCount: number, totalSize: number): void {
    let id = 0;
    this.currentTreeList.forEach((osTreeNode: NativeHookCallInfo): void => {
      osTreeNode.totalCount = totalCount;
      osTreeNode.totalSize = totalSize;
      this.setMerageName(osTreeNode);
      if (osTreeNode.id === '') {
        osTreeNode.id = id + '';
        id++;
      }
      if (osTreeNode.parentNode && osTreeNode.parentNode.id === '') {
        osTreeNode.parentNode.id = id + '';
        id++;
        osTreeNode.parentId = osTreeNode.parentNode.id;
      }
    });
  }

  setMerageName(currentNode: NativeHookCallInfo): void {
    currentNode.lib = this.dataCache.dataDict.get(currentNode.fileId) || 'unknown';
    if (this.isHap(currentNode.lib)) {
      const fullName = this.dataCache.dataDict.get(currentNode.symbolId);
      this.extractSymbolAndPath(currentNode, fullName);
    } else {
      currentNode.symbol =
        this.groupCutFilePath(currentNode.symbolId, this.dataCache.dataDict.get(currentNode.symbolId) || '') ??
        'unknown';
    }
    currentNode.path = currentNode.lib;
    currentNode.lib = setFileName(currentNode.lib);
    currentNode.symbol = `${currentNode.symbol} (${currentNode.lib})`;
    currentNode.type =
      currentNode.lib.endsWith('.so.1') || currentNode.lib.endsWith('.dll') || currentNode.lib.endsWith('.so') ? 0 : 1;
  }

  private isHap(path: string): boolean {
    for (const name of HAP_TYPE) {
      if (path.endsWith(name)) {
        return true;
      }
    }
    return false;
  }

  private extractSymbolAndPath(node: NativeHookCallInfo, str?: string): void {
    node.symbol = 'unknown';
    if (!str) {
      return;
    }
    const match = str.match(/^([^\[:]+):\[url:(.+)\]$/);
    if (!match) {
      return;
    }
    node.symbol = match[1].trim();
    node.lib = match[2].replace(/^url:/, '');
  }

  groupCutFilePath(fileId: number, path: string): string {
    let name: string;
    if (this.dataCache.nmFileDict.has(fileId)) {
      name = this.dataCache.nmFileDict.get(fileId) ?? '';
    } else {
      let currentPath = path.substring(path.lastIndexOf('/') + 1);
      this.dataCache.nmFileDict.set(fileId, currentPath);
      name = currentPath;
    }
    return name === '' ? '-' : name;
  }

}

class AnalysisSample {
  id: number;
  count: number;
  size: number;
  type: number;
  startTs: number;

  isRelease: boolean;
  releaseCount?: number;
  releaseSize?: number;

  endTs?: number;
  subType?: string;
  tid?: number;
  threadName?: string;
  addr?: string;

  libId!: number;
  libName!: string;
  symbolId!: number;
  symbolName!: string;

  constructor(id: number, size: number, count: number, type: number | string, startTs: number) {
    this.id = id;
    this.size = size;
    this.count = count;
    this.startTs = startTs;
    switch (type) {
      case 'FD':
        this.type = 4;
        this.isRelease = false;
        break;
      case 'THREAD':
        this.isRelease = false;
        this.type = 5;
        break;
      default:
        this.isRelease = false;
        this.type = -1;
    }
  }
}