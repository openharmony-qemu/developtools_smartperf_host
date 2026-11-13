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
import { MemoryBasicType, MemoryStatisticType, MemoryTraceRowType, MemoryType } from '../../bean/MemoryEnum';
import { FilterByAnalysis, NativeMemoryExpression } from '../../bean/NativeHook';
import { AnalysisTabDataLogic, eventConfigMap, getFilterType, queryCallChainsSamplesSql, queryNativeHookEventSql, queryNMFrameDataSql, queryStatisticCallChainsSamplesSql, statisticCallChainsSamplesConfig } from './MemoryMultiInstance';
import {
  convertJSON,
  DataCache,
  getByteWithUnit,
  HeapTreeDataBean,
  LogicHandler,
  MerageBean,
  merageBeanDataSplit,
  postMessage,
  setFileName,
} from './ProcedureLogicWorkerCommon';

type CallInfoMap = {
  [key: string]: NativeHookCallInfo;
};

type StatisticMap = {
  [key: string]: NativeHookStatistics;
};

const HAP_TYPE = ['.hap', '.har', '.hsp'];

export class ProcedureLogicWorkerNativeMemory extends LogicHandler {
  selectTotalSize = 0;
  selectTotalCount = 0;
  currentTreeMapData: CallInfoMap = {};
  currentTreeList: NativeHookCallInfo[] = [];
  queryAllCallChainsSamples: NativeHookStatistics[] = [];
  currentSamples: NativeHookStatistics[] = [];
  allThreads: NativeHookCallInfo[] = [];
  splitMapData: CallInfoMap = {};
  searchValue: string = '';
  currentEventId: string = '';
  realTimeDif: number = 0;
  responseTypes: { key: number; value: string }[] = [];
  totalNS: number = 0;
  isStatisticMode: boolean = false;
  boxRangeNativeHook: Array<NativeMemory> = [];
  clearBoxSelectionData: boolean = false;
  nmArgs?: Map<string, unknown>;
  private dataCache = DataCache.getInstance();
  isHideThread: boolean = false;
  private currentSelectIPid: number = 1;
  useFreedSize: boolean = false;
  static secondList: string[] = [];
  private memoryType: MemoryTraceRowType;
  private analysisTabDataLogic?: AnalysisTabDataLogic;
  private tableName: string

  constructor(memoryType: MemoryTraceRowType, tableName: string) {
    super();
    this.memoryType = memoryType;
    this.tableName = tableName;
  }

  handle(data: unknown): void {
    //@ts-ignore
    this.currentEventId = data.id;
    //@ts-ignore
    if (data && data.type) {
      //@ts-ignore
      const realType = data.type.substring(data.type.indexOf('-',) + 1);
      switch (realType) {
        case 'init':
          // 初始化查询frame表数据后缓存
          //@ts-ignore
          this.nmInit(data.params);
          break;
        case 'queryNMFrameData':
          // 将frame表数据缓存到dataCache中
          this.nmQueryNMFrameData(data);
          break;
        case 'queryCallchainsSamples':
          // 普通模式下框选泳道后根据框选的时间范围查询对应hook表数据
          this.nmQueryCallChainsSamples(data);
          break;
        case 'queryStatisticCallchainsSamples':
          // 统计模式下框选泳道后根据框选的时间范围查询对应hook_statistic表数据
          this.nmQueryStatisticCallChainsSamples(data);
          break;
        case 'queryAnalysis':
          // Analysis Tab页查询对应samples数据并根据事件合并统计数据
          this.nmQueryAnalysis(data);
          break;
        case 'queryNativeHookEvent':
          // 列表Tab页使用
          this.nmQueryNativeHookEvent(data);
          break;
        case 'action':
          // 列表Tab页使用获取每条数据对应的调用者
          this.nmAction(data);
          break;
        case 'calltree-action':
          // 处理调用栈数据
          this.nmCallTreeAction(data);
          break;
        case 'init-responseType':
          // 设置lastLibId
          this.nmInitResponseType(data);
          break;
        case 'get-responseType':
          // 获取所有lastLibId
          this.nmGetResponseType(data);
          break;
        case 'reset':
          this.isHideThread = false;
          break;
        case 'set-current_ipid':
          //@ts-ignore
          this.currentSelectIPid = data.params;
      }
    }
  }
  private nmInit(params: unknown): void {
    this.clearAll();
    //@ts-ignore
    if (params.isRealtime) {
      //@ts-ignore
      this.realTimeDif = params.realTimeDif;
    }
    this.initNMFrameData();
  }
  private nmQueryNMFrameData(data: unknown): void {
    //@ts-ignore
    let arr = convertJSON(data.params.list) || [];
    //@ts-ignore
    this.initNMStack(arr);
    arr = [];
    self.postMessage({
      //@ts-ignore
      id: data.id,
      action: `${this.memoryType}-init`,
      results: [],
    });
  }
  private nmQueryCallChainsSamples(data: unknown): void {
    this.searchValue = '';
    //@ts-ignore
    if (data.params.list) {
      //@ts-ignore
      let callChainsSamples = convertJSON(data.params.list) || [];
      //@ts-ignore
      this.queryAllCallChainsSamples = callChainsSamples;
      this.freshCurrentCallChains(this.queryAllCallChainsSamples, true);
      // @ts-ignore
      self.postMessage({
        //@ts-ignore
        id: data.id,
        //@ts-ignore
        action: data.action,
        results: this.allThreads,
      });
    } else {
      this.queryCallChainsSamples(
        `${this.memoryType}-queryCallchainsSamples`,
        //@ts-ignore
        data.params.leftNs,
        //@ts-ignore
        data.params.rightNs,
        //@ts-ignore
        data.params.types
      );
    }
  }
  private nmQueryStatisticCallChainsSamples(data: unknown): void {
    this.searchValue = '';
    //@ts-ignore
    if (data.params.list) {
      //@ts-ignore
      let samples = convertJSON(data.params.list) || [];
      //@ts-ignore
      this.queryAllCallChainsSamples = samples;
      this.freshCurrentCallChains(this.queryAllCallChainsSamples, true);
      // @ts-ignore
      self.postMessage({
        //@ts-ignore
        id: data.id,
        //@ts-ignore
        action: data.action,
        results: this.allThreads,
      });
    } else {
      this.queryStatisticCallChainsSamples(
        `${this.memoryType}-queryStatisticCallchainsSamples`,
        //@ts-ignore
        data.params.leftNs,
        //@ts-ignore
        data.params.rightNs,
        //@ts-ignore
        data.params.types
      );
    }
  }
  private nmQueryAnalysis(data: unknown): void {
    //@ts-ignore
    if (data.params.list) {
      //@ts-ignore
      let samples = convertJSON(data.params.list) || [];
      //@ts-ignore
      this.queryAllCallChainsSamples = samples;
      if (!this.analysisTabDataLogic) {
        this.analysisTabDataLogic = new AnalysisTabDataLogic();
      }
      this.analysisTabDataLogic.init(this.memoryType, this.isStatisticMode);
      self.postMessage({
        //@ts-ignore
        id: data.id,
        //@ts-ignore
        action: data.action,
        results: this.analysisTabDataLogic.combineStatisticAndCallChain(this.queryAllCallChainsSamples),
      });
    } else {
      //@ts-ignore
      if (data.params.isStatistic) {
        this.isStatisticMode = true;
        this.queryStatisticCallChainsSamples(
          `${this.memoryType}-queryAnalysis`,
          //@ts-ignore
          data.params.leftNs,
          //@ts-ignore
          data.params.rightNs,
          //@ts-ignore
          data.params.types
        );
      } else {
        this.isStatisticMode = false;
        this.queryCallChainsSamples(
          `${this.memoryType}-queryAnalysis`,
          //@ts-ignore
          data.params.leftNs,
          //@ts-ignore
          data.params.rightNs,
          //@ts-ignore
          data.params.types
        );
      }
    }
  }
  private nmQueryNativeHookEvent(data: unknown): void {
    //@ts-ignore
    const params = data.params;
    if (params) {
      if (params.list) {
        //@ts-ignore
        this.boxRangeNativeHook = convertJSON(params.list);
        if (this.nmArgs?.get('refresh')) {
          this.clearBoxSelectionData = this.boxRangeNativeHook.length > 100_0000;
        }
        this.supplementNativeHoodData();
        //@ts-ignore
        postMessage(data.id, data.action, this.resolvingActionNativeMemory(this.nmArgs!), 50_0000);
        if (this.clearBoxSelectionData) {
          this.boxRangeNativeHook = [];
        }
      } else if (params.get('refresh') || this.boxRangeNativeHook.length === 0) {
        this.nmArgs = params;
        let leftNs = params.get('leftNs');
        let rightNs = params.get('rightNs');
        let types = params.get('types');
        this.boxRangeNativeHook = [];
        this.isStatisticMode = false;
        this.queryNativeHookEvent(leftNs, rightNs, types);
      } else {
        this.nmArgs = params;
        //@ts-ignore
        postMessage(data.id, data.action, this.resolvingActionNativeMemory(this.nmArgs!), 50_0000);
        if (this.clearBoxSelectionData) {
          this.boxRangeNativeHook = [];
        }
      }
    }
  }
  private nmAction(data: { params?: unknown; id?: string; action?: string }): void {
    if (data.params) {
      self.postMessage({
        id: data.id,
        action: data.action,
        //@ts-ignore
        results: this.resolvingAction(data.params),
      });
    }
  }
  private nmCallTreeAction(data: { params?: unknown; id?: string; action?: string }): void {
    if (data.params) {
      self.postMessage({
        id: data.id,
        action: data.action,
        //@ts-ignore
        results: this.resolvingNMCallAction(data.params),
      });
    }
  }
  private nmInitResponseType(data: { params?: unknown; id?: string; action?: string }): void {
    //@ts-ignore
    this.initResponseTypeList(data.params);
    self.postMessage({
      id: data.id,
      action: data.action,
      results: [],
    });
  }
  private nmGetResponseType(data: { params?: unknown; id?: string; action?: string }): void {
    self.postMessage({
      id: data.id,
      action: data.action,
      results: this.responseTypes,
    });
  }

  queryNativeHookEvent(leftNs: number, rightNs: number, types: Array<string>): void {
    const buildSingleCondition = (type: string): string => `and A.event_type = '${type}'`;
    const config = eventConfigMap[this.memoryType];
    if (!config) {
      return;
    }
    let condition = '';
    if (types.length === 1) {
      condition = buildSingleCondition(types[0]);
    } else {
      condition = config.multiCondition(types); // 使用特定配置的多条件
    }

    const sql = queryNativeHookEventSql(leftNs, rightNs, this.tableName, this.currentSelectIPid, condition, this.nmArgs!);
    this.queryData(this.currentEventId, `${this.memoryType}-queryNativeHookEvent`, sql, {});
  }

  supplementNativeHoodData(): void {
    let len = this.boxRangeNativeHook.length;
    for (let i = 0, j = len - 1; i <= j; i++, j--) {
      this.fillNativeHook(this.boxRangeNativeHook[i], i);
      if (i !== j) {
        this.fillNativeHook(this.boxRangeNativeHook[j], j);
      }
    }
  }

  fillNativeHook(memory: NativeMemory, index: number): void {
    if (memory.subTypeId !== null && memory.subType === undefined) {
      memory.subType = this.dataCache.dataDict.get(memory.subTypeId) || '-';
    }
    memory.index = index;
    let arr = this.dataCache.nmHeapFrameMap.get(memory.eventId) || [];
    let frame = Array.from(arr)
      .reverse()
      .find((item: HeapTreeDataBean): boolean => {
        let fileName = this.dataCache.dataDict.get(item.fileId);
        return !((fileName ?? '').includes('libc++') || (fileName ?? '').includes('musl'));
      });
    if (frame === null || frame === undefined) {
      if (arr.length > 0) {
        frame = arr[0];
      }
    }
    if (frame !== null && frame !== undefined) {
      memory.symbol = this.groupCutFilePath(frame.symbolId, this.dataCache.dataDict.get(frame.symbolId) || '');
      memory.library = this.groupCutFilePath(frame.fileId, this.dataCache.dataDict.get(frame.fileId) || 'Unknown Path');
    } else {
      memory.symbol = '-';
      memory.library = '-';
    }
  }

  initResponseTypeList(list: unknown[]): void {
    this.responseTypes = [
      {
        key: -1,
        value: 'ALL',
      },
    ];
    list.forEach((item: unknown): void => {
      //@ts-ignore
      if (item.lastLibId === null) {
        this.responseTypes.push({
          key: 0,
          value: '-',
        });
      } else {
        this.responseTypes.push({
          //@ts-ignore
          key: item.lastLibId,
          //@ts-ignore
          value: this.groupCutFilePath(item.lastLibId, item.value) || '-',
        });
      }
    });
  }
  initNMFrameData(): void {
    this.queryData(
      this.currentEventId,
      `${this.memoryType}-queryNMFrameData`,
      queryNMFrameDataSql(),
      {}
    );
  }
  initNMStack(frameArr: Array<HeapTreeDataBean>): void {
    frameArr.map((frame): void => {
      let frameEventId = frame.eventId;
      if (this.dataCache.nmHeapFrameMap.has(frameEventId)) {
        this.dataCache.nmHeapFrameMap.get(frameEventId)!.push(frame);
      } else {
        this.dataCache.nmHeapFrameMap.set(frameEventId, [frame]);
      }
    });
  }
  resolvingAction(paramMap: Map<string, unknown>): Array<NativeHookCallInfo | NativeMemory | HeapStruct> {
    let actionType = paramMap.get('actionType');
    if (actionType === 'memory-stack') {
      return this.resolvingActionNativeMemoryStack(paramMap);
    } else if (actionType === 'native-memory-state-change') {
      let startTs = paramMap.get('startTs');
      let currentSelection = this.boxRangeNativeHook.filter((item) => {
        return item.startTs === startTs;
      });
      if (currentSelection.length > 0) {
        currentSelection[0].isSelected = true;
      }
      return [];
    } else {
      return [];
    }
  }

  resolvingActionNativeMemoryStack(paramMap: Map<string, unknown>): NativeHookCallInfo[] {
    let eventId = paramMap.get('eventId');
    let frameArr = this.dataCache.nmHeapFrameMap.get(eventId as number) || [];
    let arr: Array<NativeHookCallInfo> = [];
    frameArr.map((frame: HeapTreeDataBean): void => {
      let target = new NativeHookCallInfo();
      target.eventId = frame.eventId;
      target.depth = frame.depth;
      target.addr = frame.addr;
      target.symbol = this.groupCutFilePath(frame.symbolId, this.dataCache.dataDict.get(frame.symbolId) || '') ?? '';
      target.lib = this.groupCutFilePath(frame.fileId, this.dataCache.dataDict.get(frame.fileId) || '') ?? '';
      target.type = target.lib.endsWith('.so.1') || target.lib.endsWith('.dll') || target.lib.endsWith('.so') ? 0 : 1;
      arr.push(target);
    });
    return arr;
  }

  resolvingActionNativeMemory(paramMap: Map<string, unknown>): Array<NativeMemory> {
    let filterAllocType = paramMap.get('filterAllocType');
    let filterEventType = paramMap.get('filterEventType') as string;
    let filterResponseType = paramMap.get('filterResponseType');
    let leftNs = paramMap.get('leftNs') as number;
    let rightNs = paramMap.get('rightNs') as number;
    let sortColumn = paramMap.get('sortColumn');
    let sortType = paramMap.get('sortType');
    let statisticsSelection = paramMap.get('statisticsSelection') as StatisticsSelection[];
    let filter = this.boxRangeNativeHook;
    if (
      (filterAllocType !== undefined && filterAllocType !== 0) ||
      (filterEventType !== undefined && filterEventType !== '0') ||
      (filterResponseType !== undefined && filterResponseType !== -1)
    ) {
      filter = this.boxRangeNativeHook.filter((item: NativeMemory): boolean => {
        let filterAllocation = true;
        let freed = item.endTs > leftNs && item.endTs <= rightNs && item.endTs !== 0 && item.endTs !== null;
        if (filterAllocType === '1') {
          filterAllocation = !freed;
        } else if (filterAllocType === '2') {
          filterAllocation = freed;
        }
        let filterNative = getFilterType(filterEventType, item, statisticsSelection, this.memoryType, this.isStatisticMode);
        let filterLastLib = filterResponseType === -1 ? true : filterResponseType === item.lastLibId;
        return filterAllocation && filterNative && filterLastLib;
      });
    }
    if (sortColumn !== undefined && sortType !== undefined && sortColumn !== '' && sortType !== 0) {
      //@ts-ignore
      return this.sortByNativeMemoryColumn(sortColumn, sortType, filter);
    } else {
      return filter;
    }
  }

  sortByNativeMemoryColumn(nmMemoryColumn: string, nmMemorySort: number, list: Array<NativeMemory>): NativeMemory[] {
    if (nmMemorySort === 0) {
      return list;
    } else {
      return list.sort((memoryLeftData: unknown, memoryRightData: unknown): number => {
        if (nmMemoryColumn === 'index' || nmMemoryColumn === 'startTs' || nmMemoryColumn === 'heapSize') {
          return nmMemorySort === 1
            ? //@ts-ignore
            memoryLeftData[nmMemoryColumn] - memoryRightData[nmMemoryColumn]
            : //@ts-ignore
            memoryRightData[nmMemoryColumn] - memoryLeftData[nmMemoryColumn];
        } else {
          if (nmMemorySort === 1) {
            //@ts-ignore
            if (memoryLeftData[nmMemoryColumn] > memoryRightData[nmMemoryColumn]) {
              return 1;
              //@ts-ignore
            } else if (memoryLeftData[nmMemoryColumn] === memoryRightData[nmMemoryColumn]) {
              return 0;
            } else {
              return -1;
            }
          } else {
            //@ts-ignore
            if (memoryRightData[nmMemoryColumn] > memoryLeftData[nmMemoryColumn]) {
              return 1;
              //@ts-ignore
            } else if (memoryLeftData[nmMemoryColumn] === memoryRightData[nmMemoryColumn]) {
              return 0;
            } else {
              return -1;
            }
          }
        }
      });
    }
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

  traverseSampleTree(stack: NativeHookCallInfo, hook: NativeHookStatistics): void {
    stack.count += 1;
    stack.countValue = `${stack.count}`;
    stack.countPercent = `${((stack.count / this.selectTotalCount) * 100).toFixed(1)}%`;
    stack.size += hook.heapSize;
    stack.tid = hook.tid;
    stack.threadName = hook.threadName;
    stack.heapSizeStr = `${getByteWithUnit(stack.size)}`;
    stack.heapPercent = `${((stack.size / this.selectTotalSize) * 100).toFixed(1)}%`;
    stack.countArray.push(...(hook.countArray || hook.count));
    stack.tsArray.push(...(hook.tsArray || hook.startTs));
    if (stack.children.length > 0) {
      stack.children.map((child: MerageBean): void => {
        this.traverseSampleTree(child as NativeHookCallInfo, hook);
      });
    }
  }
  traverseTree(stack: NativeHookCallInfo, hook: NativeHookStatistics): void {
    stack.count = 1;
    stack.countValue = `${stack.count}`;
    stack.countPercent = `${((stack!.count / this.selectTotalCount) * 100).toFixed(1)}%`;
    stack.size = hook.heapSize;
    stack.tid = hook.tid;
    stack.threadName = hook.threadName;
    stack.heapSizeStr = `${getByteWithUnit(stack!.size)}`;
    stack.heapPercent = `${((stack!.size / this.selectTotalSize) * 100).toFixed(1)}%`;
    stack.countArray.push(...(hook.countArray || hook.count));
    stack.tsArray.push(...(hook.tsArray || hook.startTs));
    if (stack.children.length > 0) {
      stack.children.map((child) => {
        this.traverseTree(child as NativeHookCallInfo, hook);
      });
    }
  }

  clearAll(): void {
    this.dataCache.clearMemory();
    this.splitMapData = {};
    this.currentSamples = [];
    this.allThreads = [];
    this.queryAllCallChainsSamples = [];
    this.realTimeDif = 0;
    this.currentTreeMapData = {};
    this.currentTreeList.length = 0;
    this.responseTypes.length = 0;
    this.boxRangeNativeHook = [];
    this.nmArgs?.clear();
    this.isHideThread = false;
    this.useFreedSize = false;
  }

  queryCallChainsSamples(action: string, leftNs: number, rightNs: number, types: Array<string>): void {
    this.queryData(
      this.currentEventId,
      action,
      queryCallChainsSamplesSql(leftNs, rightNs, this.currentSelectIPid, types, this.tableName),
      {}
    );
  }
  queryStatisticCallChainsSamples(action: string, leftNs: number, rightNs: number, types: Array<number>): void {
    let queryCondition: string = '';
    let selectTypeCase: string = '';

    if (types && types.length > 0) {
      const sortedTypes: number[] = [...new Set(types)].sort((a, b) => a - b);
      const config = statisticCallChainsSamplesConfig[this.memoryType];
      if (!config) {
        return;
      }
      queryCondition = `and type in (${sortedTypes.join(',')})`;
      selectTypeCase = config.caseStatement;
    }
    const statisticTableName = this.tableName + '_statistic';
    let sql = queryStatisticCallChainsSamplesSql(leftNs, rightNs, statisticTableName, this.currentSelectIPid, queryCondition, selectTypeCase);
    this.queryData(this.currentEventId, action, sql, {});
  }

  private freshCurrentCallChains(samples: NativeHookStatistics[], isTopDown: boolean): void {
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
          this.mergeChildrenByIndex(root, callChains, topIndex, nativeHookSample, isTopDown);
        }
      }
    });
    // 合并线程级别
    let rootMergeMap = this.mergeNodeData(totalCount, totalSize);
    this.handleCurrentTreeList(totalCount, totalSize);
    this.allThreads = Object.values(rootMergeMap) as NativeHookCallInfo[];
  }
  private mergeNodeData(totalCount: number, totalSize: number): CallInfoMap {
    let rootMergeMap: CallInfoMap = {};
    let threads = Object.values(this.currentTreeMapData);
    // 遍历所有线程
    threads.forEach((mergeData: NativeHookCallInfo): void => {
      if (this.isHideThread) {
        mergeData.tid = 0;
        mergeData.threadName = undefined;
      }
      // 没有父级，生成父级，把当前项放进去
      if (rootMergeMap[mergeData.tid] === undefined) {
        let threadMergeData = new NativeHookCallInfo(); //新增进程的节点数据
        threadMergeData.canCharge = false;
        threadMergeData.type = -1;
        threadMergeData.isThread = true;
        threadMergeData.symbol = `${mergeData.threadName || 'Thread'} [${mergeData.tid}]`;
        threadMergeData.children.push(mergeData);
        threadMergeData.initChildren.push(mergeData);
        threadMergeData.count = mergeData.count || 1;
        threadMergeData.heapSize = mergeData.heapSize;
        threadMergeData.totalCount = totalCount;
        threadMergeData.totalSize = totalSize;
        threadMergeData.tsArray = [...mergeData.tsArray];
        threadMergeData.countArray = [...mergeData.countArray];
        rootMergeMap[mergeData.tid] = threadMergeData;
      } else {
        // 有父级，直接放进去
        rootMergeMap[mergeData.tid].children.push(mergeData);
        rootMergeMap[mergeData.tid].initChildren.push(mergeData);
        rootMergeMap[mergeData.tid].count += mergeData.count || 1;
        rootMergeMap[mergeData.tid].heapSize += mergeData.heapSize;
        rootMergeMap[mergeData.tid].totalCount = totalCount;
        rootMergeMap[mergeData.tid].totalSize = totalSize;
        for (const count of mergeData.countArray) {
          rootMergeMap[mergeData.tid].countArray.push(count);
        }
        for (const ts of mergeData.tsArray) {
          rootMergeMap[mergeData.tid].tsArray.push(ts);
        }
      }
      mergeData.parentNode = rootMergeMap[mergeData.tid]; //子节点添加父节点的引用
    });
    return rootMergeMap;
  }
  private handleCurrentTreeList(totalCount: number, totalSize: number): void {
    let id = 0;
    this.currentTreeList.forEach((nmTreeNode: NativeHookCallInfo): void => {
      nmTreeNode.totalCount = totalCount;
      nmTreeNode.totalSize = totalSize;
      this.setMergeName(nmTreeNode);
      if (nmTreeNode.id === '') {
        nmTreeNode.id = id + '';
        id++;
      }
      if (nmTreeNode.parentNode && nmTreeNode.parentNode.id === '') {
        nmTreeNode.parentNode.id = id + '';
        id++;
        nmTreeNode.parentId = nmTreeNode.parentNode.id;
      }
    });
  }
  private groupCallChainSample(paramMap: Map<string, unknown>): void {
    let filterAllocType = paramMap.get('filterAllocType') as string;
    let filterEventType = paramMap.get('filterEventType') as string;
    let filterResponseType = paramMap.get('filterResponseType') as number;
    let filterAnalysis = paramMap.get('filterByTitleArr') as FilterByAnalysis;
    if (filterAnalysis) {
      if (filterAnalysis.type) {
        filterEventType = filterAnalysis.type;
        if(MemoryType.APPLY_NM_EVENTS.includes(filterEventType)){
          filterEventType = filterEventType.toLowerCase();
        }
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
      this.currentSamples = this.queryAllCallChainsSamples;
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
    return this.queryAllCallChainsSamples.filter((item: NativeHookStatistics): boolean => {
      let filterAllocation = true;
      if (nativeHookType === 'normal') {
        filterAllocation = this.setFilterAllocation(item, filterAllocType, filterAllocation, leftNs, rightNs);
      } else {
        // Create & Existing
        if (filterAllocType === '1') {
          filterAllocation = item.heapSize > item.freeSize;
          // Create & Destroy 
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
      let filterNative = getFilterType(filterEventType, item, statisticsSelection, this.memoryType, this.isStatisticMode);
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
    // Create & Existing
    if (filterAllocType === '1') {
      filterAllocation =
        item.startTs >= leftNs &&
        item.startTs <= rightNs &&
        (item.endTs > rightNs || item.endTs === 0 || item.endTs === null);
      // Create & Destroy 
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
  private setGroupMap(
    filter: Array<NativeHookStatistics>,
    filterAllocType: string,
    nativeHookType: string
  ): StatisticMap {
    let groupMap: StatisticMap = {};
    filter.forEach((sample: NativeHookStatistics): void => {
      // 调用栈合并逻辑为tid相同, EventType 相同，callChainId相同则合并计算
      const groupKey = sample.tid + '-' + sample.eventType + '-' + sample.eventId ;
      let currentNode = groupMap[groupKey] || new NativeHookStatistics();
      if (currentNode.count === 0) {
        Object.assign(currentNode, sample);
        if (filterAllocType === '1' && nativeHookType !== 'normal') {
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
      groupMap[groupKey] = currentNode;
    });
    return groupMap;
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

  createThreadSample(sample: NativeHookStatistics): HeapTreeDataBean[] {
    return this.dataCache.nmHeapFrameMap.get(sample.eventId) || [];
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

  mergeChildrenByIndex(
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
      this.mergeChildrenByIndex(node, callChainDataList, index, sample, isTopDown);
    }
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

  private isHap(path: string): boolean {
    for (const name of HAP_TYPE) {
      if (path.endsWith(name)) {
        return true;
      }
    }
    return false;
  }

  setMergeName(currentNode: NativeHookCallInfo): void {
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
  clearSplitMapData(symbolName: string): void {
    if (symbolName in this.splitMapData) {
      Reflect.deleteProperty(this.splitMapData, symbolName);
    }
  }
  resolvingNMCallAction(params: unknown[]): NativeHookCallInfo[] {
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
        this.freshCurrentCallChains(this.currentSamples, args[0] as boolean);
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
}

export class NativeHookStatistics {
  id: number = 0;
  type: number = 0;
  eventId: number = 0;
  eventType: string = '';
  hasSubType: number = 0;
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
export class NativeMemory {
  index: number = 0;
  eventId: number = 0;
  eventType: string = '';
  hasSubType: number = 0; // 1有子类型 0没有子类型 
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

export class HeapStruct {
  startTime: number | undefined;
  endTime: number | undefined;
  dur: number | undefined;
  density: number | undefined;
  heapsize: number | undefined;
  maxHeapSize: number = 0;
  maxDensity: number = 0;
  minHeapSize: number = 0;
  minDensity: number = 0;
}
export class StatisticsSelection {
  memoryTap: string = '';
  subType: string = '';
  max: number = 0;
  eventType: string = '';
}

