/*
 * Copyright (C) 2025-2026 Huawei Device Co., Ltd.
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

import { AnalysisSample } from "../../bean/MemoryAnalysisStruct";
import { MemoryBasicType, MemoryStatisticType, MemoryTraceRowType, MemoryType } from "../../bean/MemoryEnum";
import { DataCache } from "./ProcedureLogicWorkerCommon";
import { NativeHookStatistics, NativeMemory, StatisticsSelection } from "./ProcedureLogicWorkerNativeMemory";


interface MemoryTypeConfig {
  multiCondition: ((types: Array<string>) => string);
}

type MemoryTypeConfigMap = {
  [key in MemoryTraceRowType]?: MemoryTypeConfig;
};
const defaultMultiCondition = (types: Array<string>): string => {
  if (types.length === 0) {
    return '';
  }
  return `and A.event_type in (${types.map(e => `'${e}'`).join(', ')})`;
};

export const eventConfigMap: MemoryTypeConfigMap = {
  [MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY]: {
    multiCondition: defaultMultiCondition
  },
  [MemoryTraceRowType.ROW_TYPE_GPU_MEMORY]: {
    multiCondition: defaultMultiCondition
  },
  [MemoryTraceRowType.ROW_TYPE_OTHER_SOURCE]: {
    multiCondition: defaultMultiCondition
  }
};

export function queryNativeHookEventSql(
  leftNs: number,
  rightNs: number,
  tableName: string,
  iPid: number,
  condition: string,
  nmArgs: Map<string, unknown>): string {
  let libId = nmArgs.get('filterResponseType');
  let allocType = nmArgs.get('filterAllocType');
  if (libId !== undefined && libId !== -1) {
    condition = `${condition} and last_lib_id = ${libId}`; // filter lib
  }
  // 数字为Tab页筛选下标，0表示全部分配数据，1表示分配且存在 2表示分配且释放
  if (allocType === '1') {
    condition = `${condition} and ((A.end_ts - B.start_ts) > ${rightNs} or A.end_ts is null)`;
  } else if (allocType === '2') {
    condition = `${condition} and (A.end_ts - B.start_ts) <= ${rightNs}`;
  }
  let sql = `select 
          callchain_id as eventId,
          event_type as eventType,
          heap_size as heapSize,
          ('0x' || addr) as addr,
          (A.start_ts - B.start_ts) as startTs,
          (A.end_ts - B.start_ts) as endTs,
          tid as threadId,
          sub_type_id as subTypeId,
          (case when sub_type_id not null then 1 else 0 end) as hasSubType,
          ifnull(last_lib_id,0) as lastLibId,
          ifnull(last_symbol_id,0) as lastSymbolId
        from
          ${tableName} A,
          trace_range B
        left join
          thread t
        on
          A.itid = t.id
        where
          A.start_ts - B.start_ts between ${leftNs} and ${rightNs} ${condition}
          and A.ipid = ${iPid}
          `;
  return sql;
}


export function queryCallChainsSamplesSql(leftNs: number, rightNs: number, iPid: number, types: Array<string>, tableName: string): string {
  return `select 
              A.id,
              callchain_id as eventId,
              event_type as eventType,
              heap_size as heapSize,
              (A.start_ts - B.start_ts) as startTs,
              (A.end_ts - B.start_ts) as endTs,
              tid,
              ifnull(last_lib_id,0) as lastLibId,
              ifnull(last_symbol_id,0) as lastSymbolId,
              t.name as threadName,
              A.addr,
              (case when sub_type_id not null then 1 else 0 end) as hasSubType,
              ifnull(A.sub_type_id, -1) as subTypeId
          from
              ${tableName} A,
              trace_range B
              left join
              thread t
              on
              A.itid = t.id
          where
              A.start_ts - B.start_ts
              between ${leftNs} and ${rightNs} and A.event_type in (${types.map(type => `'${type}'`).join(',')})
              and A.ipid = ${iPid}
        `
}

interface MemoryConfig {
  caseStatement: string;
}

type ConfigMap = {
  [key in MemoryTraceRowType]?: MemoryConfig;
};

// 定义各 memoryType 对应的配置信息
export const statisticCallChainsSamplesConfig: ConfigMap = {
  [MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY]: {
    caseStatement: `(case 
            when type = ${MemoryStatisticType.MALLOC} then '${MemoryType.MEMORY_M_ALLOC_NAME}' 
            when type = ${MemoryStatisticType.ARKTS} then '${MemoryType.ARKTS_Alloc_NAME}'
            when type = ${MemoryStatisticType.JS} then '${MemoryType.JS_Alloc_NAME}'
            when type = ${MemoryStatisticType.KMP} then '${MemoryType.KMP_Alloc_NAME}'
            when type = ${MemoryStatisticType.DMA} then '${MemoryType.ION_Alloc_NAME}'
            when type = ${MemoryStatisticType.ASHMEM} then '${MemoryType.ASHMEM_Alloc_NAME}'
            when type = ${MemoryStatisticType.SO} then '${MemoryType.SO_Alloc_NAME}'
            when type = ${MemoryStatisticType.MMAP} then '${MemoryType.MEMORY_M_MAP_NAME}'
            when type = ${MemoryStatisticType.FILE_PAGE_MSG} then '${MemoryType.MEMORY_M_FILE_PAGE_MSG}'
            when type = ${MemoryStatisticType.MEMORY_USING_MSG} then '${MemoryType.MEMORY_M_MEMORY_USING_MSG}' end) as eventType,`
  },
  [MemoryTraceRowType.ROW_TYPE_GPU_MEMORY]: {
    caseStatement: `(case 
            when type = ${MemoryStatisticType.GPU_VK} then '${MemoryType.GPU_VK_SIMPLE_NAME}' 
            when type = ${MemoryStatisticType.GPU_GLES} then '${MemoryType.GPU_GLES_SIMPLE_NAME}' 
            when type = ${MemoryStatisticType.GPU_CL} then '${MemoryType.GPU_CL_SIMPLE_NAME}' end) as eventType,`
  },
  [MemoryTraceRowType.ROW_TYPE_OTHER_SOURCE]: {
    caseStatement: `(case 
            when type = ${MemoryStatisticType.FD} then '${MemoryType.FD_SIMPLE_NAME}' 
            when type = ${MemoryStatisticType.THREAD} then '${MemoryType.THREAD_SIMPLE_NAME}' end) as eventType,`
  }
};

export function queryStatisticCallChainsSamplesSql(leftNs: number,
  rightNs: number,
  tableName: string,
  iPid: number,
  queryCondition: string,
  selectTypeCase: string): string {
  let sql = `select 
                A.id,
                A.type,
                0 as tid,
                callchain_id as eventId,
                ${selectTypeCase}
                (case when sub_type_id not null then sub_type_id else -1 end) as subTypeId,
                (case when sub_type_id not null then 1 else 0 end) as hasSubType,
                max(apply_size) as heapSize,
                max(release_size) as freeSize,
                apply_count as count,
                release_count as freeCount,
                (max(A.ts) - B.start_ts) as startTs,
                ifnull(last_lib_id,0) as lastLibId,
                ifnull(last_symbol_id,0) as lastSymbolId
            from
                ${tableName} A,
                trace_range B
            where
                A.ts - B.start_ts
                between ${leftNs} and ${rightNs}
                ${queryCondition}
                and A.ipid = ${iPid}
            group by callchain_id,type;`;
  return sql;
}


export function queryNMFrameDataSql(): string {
  return `select 
            h.symbol_id as symbolId,
            h.file_id as fileId,
            h.depth,
            h.callchain_id as eventId,
            h.vaddr as addr
          from 
            native_hook_frame h`
}

// 分析页计算每个type分配释放size，count的结构
interface AnalysisEventGroupConfig {
  applyEventType: MemoryType; // 分配的事件名称
  releaseEventType: MemoryType; // 释放的事件名称
  sampleArray: AnalysisSample[]; // 分析结果
}

export class AnalysisTabDataLogic {
  private isStatisticMode: boolean = false;
  private dataCache!: DataCache;
  private memoryType!: string;
  private eventGroups: AnalysisEventGroupConfig[] = [];

  init(memoryType: string, isStatisticMode: boolean): void {
    this.memoryType = memoryType;
    this.isStatisticMode = isStatisticMode;
    this.dataCache = DataCache.getInstance();
    this.configEventGroups()
  }

  private configEventGroups(): void {
    switch (this.memoryType) {
      case MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY:
        this.eventGroups = [
          {
            applyEventType: MemoryType.MEMORY_M_ALLOC_NAME,
            releaseEventType: MemoryType.MEMORY_M_FREE_NAME,
            sampleArray: []
          },
          {
            applyEventType: MemoryType.MEMORY_M_MAP_NAME,
            releaseEventType: MemoryType.MEMORY_M_UNMAP_NAME,
            sampleArray: []
          },
          {
            applyEventType: MemoryType.ARKTS_Alloc_NAME,
            releaseEventType: MemoryType.ARKTS_Free_NAME,
            sampleArray: []
          },
          {
            applyEventType: MemoryType.JS_Alloc_NAME,
            releaseEventType: MemoryType.JS_Free_NAME,
            sampleArray: []
          },
          {
            applyEventType: MemoryType.KMP_Alloc_NAME,
            releaseEventType: MemoryType.KMP_Free_NAME,
            sampleArray: []
          },
          {
            applyEventType: MemoryType.ION_Alloc_NAME,
            releaseEventType: MemoryType.ION_Free_NAME,
            sampleArray: []
          },
          {
            applyEventType: MemoryType.ASHMEM_Alloc_NAME,
            releaseEventType: MemoryType.ASHMEM_Free_NAME,
            sampleArray: []
          },
          {
            applyEventType: MemoryType.SO_Alloc_NAME,
            releaseEventType: MemoryType.SO_Free_NAME,
            sampleArray: []
          }
        ];
        break;
      case MemoryTraceRowType.ROW_TYPE_GPU_MEMORY:
        this.eventGroups = [
          {
            applyEventType: MemoryType.GPU_CL_Alloc_NAME,
            releaseEventType: MemoryType.GPU_CL_Free_NAME,
            sampleArray: []
          },
          {
            applyEventType: MemoryType.GPU_GLES_Alloc_NAME,
            releaseEventType: MemoryType.GPU_GLES_Free_NAME,
            sampleArray: []
          },
          {
            applyEventType: MemoryType.GPU_VK_Alloc_NAME,
            releaseEventType: MemoryType.GPU_VK_Free_NAME,
            sampleArray: []
          }
        ];
        break;
      case MemoryTraceRowType.ROW_TYPE_OTHER_SOURCE:
        this.eventGroups = [
          {
            applyEventType: MemoryType.FD_OPEN_NAME,
            releaseEventType: MemoryType.FD_CLOSE_NAME,
            sampleArray: []
          },
          {
            applyEventType: MemoryType.THREAD_CREATE_NAME,
            releaseEventType: MemoryType.THREAD_DESTROY_NAME,
            sampleArray: []
          }
        ];
        break;
      default:
        this.eventGroups = [];
    }
  }

  /**
   * 通用的统计与调用链合并函数
   * @param samples 原始统计数据
   * @param eventGroups 事件组配置（支持任意数量的Alloc/Free事件对）
   * @returns 合并后的分析样本列表
   */
  public combineStatisticAndCallChain(samples: NativeHookStatistics[]): Array<AnalysisSample> {
    samples.sort((a, b) => a.id - b.id);
    const analysisSampleList: Array<AnalysisSample> = [];
    for (const sample of samples) {
      const count = this.isStatisticMode ? sample.count : 1;
      const analysisSample = new AnalysisSample(
        sample.id,
        sample.heapSize,
        count,
        this.isStatisticMode ? sample.type : sample.eventType,
        sample.startTs,
        this.memoryType
      );

      if (this.isStatisticMode) {
        this.setStatisticSubType(analysisSample, sample);
      } else {
        let subType: string | undefined;
        if (sample.subTypeId) {
          subType = this.dataCache.dataDict.get(sample.subTypeId);
        }
        analysisSample.endTs = sample.endTs;
        analysisSample.addr = sample.addr;
        analysisSample.tid = sample.tid;
        analysisSample.threadName = sample.threadName;
        analysisSample.subType = subType;
      }

      // 配置驱动：查找当前事件是否为「释放事件」,只适用于正常模式
      const freeEventGroup = this.eventGroups.find(
        group => group.releaseEventType === sample.eventType
      );
      if (freeEventGroup) {
        this.setApplyIsRelease(analysisSample, freeEventGroup.sampleArray);
        continue; // 释放事件不加入结果列表，直接跳过
      }

      // 配置驱动：查找当前事件是否为「分配事件」
      const allocEventGroup = this.eventGroups.find(
        group => group.applyEventType === sample.eventType
      );
      if (allocEventGroup) {
        allocEventGroup.sampleArray.push(analysisSample); // 存入对应分配数组
      }

      const processedSample = this.setAnalysisSampleArgs(analysisSample, sample);
      analysisSampleList.push(processedSample);
    }

    return analysisSampleList;
  }
  /**
   * 设置统计信息子类型
   * @param analysisSample 分析Tab页的样本新新
   * @param sample 数据库查询的样本新新
   */
  private setStatisticSubType(analysisSample: AnalysisSample, sample: NativeHookStatistics): void {
    analysisSample.releaseCount = sample.freeCount;
    analysisSample.releaseSize = sample.freeSize;
    // NativeMemory的子类型固定为Mmap,FilePageMsg,MemoryUsingMsg，以及新增类型
    if (this.memoryType === MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY) {
      analysisSample.subType = this.dataCache.dataDict.get(sample.subTypeId);
    } else {
      // sql查询没有子类型时会将主类型的typeId赋值给子类型，所以需要判断主类型与子类型不同时才有真的子类型
      if (sample.hasSubType) {
        analysisSample.subType = this.dataCache.dataDict.get(sample.subTypeId);
      }
    }
  }

  /**
   * 设置申请样本是否为释放操作 
   * 
   * @param sample 当前分析样本
   * @param arr 分析样本数组
   */
  private setApplyIsRelease(sample: AnalysisSample, arr: Array<AnalysisSample>): void {
    let idx = arr.length - 1;
    for (idx; idx >= 0; idx--) {
      let item = arr[idx];
      // 判断当前样本的结束时间和地址是否与目标样本的开始时间和地址匹配
      if (item.endTs === sample.startTs && item.addr === sample.addr) {
        // 找到匹配项后，从数组中移除该项并标记为释放操作
        arr.splice(idx, 1);
        item.isRelease = true;
        return;
      }
    }
  }

  private setAnalysisSampleArgs(analysisSample: AnalysisSample, sample: NativeHookStatistics): AnalysisSample {
    const filePath = this.dataCache.dataDict.get(sample.lastLibId)!;
    let libName = '';
    if (filePath) {
      const path = filePath.split('/');
      libName = path[path.length - 1];
    }

    // 获取符号名称，如果不存在则使用库名和地址组合作为备用
    const symbolName = this.dataCache.dataDict.get(sample.lastSymbolId) || libName + ' (' + sample.addr + ')';

    analysisSample.libId = sample.lastLibId || -1;
    analysisSample.libName = libName || 'Unknown';

    analysisSample.symbolId = sample.lastSymbolId || -1;
    analysisSample.symbolName = symbolName || 'Unknown';

    return analysisSample;
  }
}

export function getFilterType(
  filterType: string,
  item: NativeHookStatistics | NativeMemory,
  statisticsSelection: Array<StatisticsSelection>,
  memoryType: MemoryTraceRowType,
  isStatisticMode: boolean
): boolean {
  if (filterType === undefined || filterType === '-1' || filterType === '') {
    return false;
  }

  switch (memoryType) {
    case MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY:
      return handleNativeMemory(filterType, item, statisticsSelection, isStatisticMode);
    case MemoryTraceRowType.ROW_TYPE_GPU_MEMORY:
      return handleGPUMemory(filterType, item, statisticsSelection, isStatisticMode);
    case MemoryTraceRowType.ROW_TYPE_OTHER_SOURCE:
      return handleOtherSource(filterType, item, isStatisticMode);
    default:
      return false;
  }
}

function handleNativeMemory(
  filterType: string,
  item: NativeHookStatistics | NativeMemory,
  statisticsSelection: StatisticsSelection[],
  isStatisticMode: boolean
): boolean {
  if (!filterType) {
    return false;
  }
  if (filterType === MemoryBasicType.NATIVE_MEMORY[0]) {
    // 全量数据，返回true
    return true;
  } else if (filterType === MemoryBasicType.NATIVE_MEMORY[1]) {
    // All Heap 泳道组 - 包含所有 Heap 类型
    return item.eventType === MemoryType.MEMORY_M_ALLOC_NAME ||
      item.eventType === MemoryType.ARKTS_Alloc_NAME ||
      item.eventType === MemoryType.JS_Alloc_NAME ||
      item.eventType === MemoryType.KMP_Alloc_NAME ||
      (isStatisticMode && (//@ts-ignore
        item.type === MemoryStatisticType.MALLOC ||//@ts-ignore
        item.type === MemoryStatisticType.ARKTS ||//@ts-ignore
        item.type === MemoryStatisticType.JS ||//@ts-ignore
        item.type === MemoryStatisticType.KMP
      ));
  } else if (filterType === MemoryBasicType.NATIVE_MEMORY[2]) {
    // Native Heap
    filterType = MemoryType.MEMORY_M_ALLOC_NAME;
  } else if (filterType === MemoryBasicType.NATIVE_MEMORY[3]) {
    // ArkTs Heap
    filterType = MemoryType.ARKTS_Alloc_NAME;
  } else if (filterType === MemoryBasicType.NATIVE_MEMORY[4]) {
    // JS Heap
    filterType = MemoryType.JS_Alloc_NAME;
  } else if (filterType === MemoryBasicType.NATIVE_MEMORY[5]) {
    // KMP Heap
    filterType = MemoryType.KMP_Alloc_NAME;
  } else if (filterType === MemoryBasicType.NATIVE_MEMORY[6]) {
    // All Anonymous VM 泳道组 - 包含所有 VM 类型
    return item.eventType === MemoryType.MEMORY_M_MAP_NAME ||
      item.eventType === MemoryType.ION_Alloc_NAME ||
      item.eventType === MemoryType.ASHMEM_Alloc_NAME ||
      item.eventType === MemoryType.SO_Alloc_NAME ||
      (isStatisticMode && (//@ts-ignore
        item.type === MemoryStatisticType.MMAP ||//@ts-ignore
        item.type === MemoryStatisticType.FILE_PAGE_MSG ||//@ts-ignore
        item.type === MemoryStatisticType.MEMORY_USING_MSG ||//@ts-ignore
        item.type === MemoryStatisticType.DMA ||//@ts-ignore
        item.type === MemoryStatisticType.ASHMEM ||//@ts-ignore
        item.type === MemoryStatisticType.SO
      ));
  } else if (filterType === MemoryBasicType.NATIVE_MEMORY[7]) {
    // VM ION
    filterType = MemoryType.ION_Alloc_NAME;
  } else if (filterType === MemoryBasicType.NATIVE_MEMORY[8]) {
    // VM Ashmem
    filterType = MemoryType.ASHMEM_Alloc_NAME;
  } else if (filterType === MemoryBasicType.NATIVE_MEMORY[9]) {
    // VM SO
    filterType = MemoryType.SO_Alloc_NAME;
  } else if (filterType === MemoryBasicType.NATIVE_MEMORY[10]) {
    // VM Others (原 All Anonymous VM)
    return item.eventType === MemoryType.MEMORY_M_MAP_NAME ||
      (isStatisticMode && (//@ts-ignore
        item.type === MemoryStatisticType.MMAP ||//@ts-ignore
        item.type === MemoryStatisticType.FILE_PAGE_MSG ||//@ts-ignore
        item.type === MemoryStatisticType.MEMORY_USING_MSG
      ));
  }

  let subType = '';
  if (item.hasSubType) {
    subType = DataCache.getInstance().dataDict.get(item.subTypeId) || '';
  }
  if (filterType.startsWith('Other ')) {
    const realType = filterType.replace('Other ', '');
    return !subType && (item.eventType.startsWith(realType) || realType.startsWith(item.eventType));
  }
  if (isStatisticMode) {
    // 处理FILE_PAGE_MSG,MEMORY_USING_MSG的情况
    if (filterType === 'FILE_PAGE_MSG') {
      return item.subTypeId === -1 && item.eventType === 'FILE_PAGE_MSG';
    } else if (filterType === 'MEMORY_USING_MSG') {
      return item.subTypeId === -1 && item.eventType === 'MEMORY_USING_MSG';
    }
  } else {
    // 从StatisticTab size行跳转
    if (filterType.endsWith('GB') || filterType.endsWith('MB') || filterType.endsWith('KB') || filterType.endsWith('byte')) {
      return statisticsSelection.some(selectionElement =>
        selectionElement.memoryTap === filterType &&
        selectionElement.max === item.heapSize &&
        selectionElement.eventType === item.eventType
      );
    }
  }
  return subType === filterType || item.eventType.startsWith(filterType);
}

function handleGPUMemory(
  filterType: string,
  item: NativeHookStatistics | NativeMemory,
  statisticsSelection: StatisticsSelection[],
  isStatisticMode: boolean
): boolean {
  if (!filterType) {
    return false;
  }
  // 固定4个选项
  if (filterType === MemoryBasicType.GPU_MEMORY[0]) {
    // 全量数据，返回true
    return true;
  } else if (filterType.includes(MemoryBasicType.GPU_MEMORY[1])) {
    // 所有的VulKan 数据
    filterType = isStatisticMode ? MemoryType.GPU_VK_SIMPLE_NAME : MemoryType.GPU_VK_Alloc_NAME;
  } else if (filterType.includes(MemoryBasicType.GPU_MEMORY[2])) {
    // 所有的GLES 数据
    filterType = isStatisticMode ? MemoryType.GPU_GLES_SIMPLE_NAME : MemoryType.GPU_GLES_Alloc_NAME;

  } else if (filterType.includes(MemoryBasicType.GPU_MEMORY[3])) {
    // 所有的CL 数据
    filterType = isStatisticMode ? MemoryType.GPU_CL_SIMPLE_NAME : MemoryType.GPU_CL_Alloc_NAME;
  }

  let subType = '';
  if (item.hasSubType) {
    subType = DataCache.getInstance().dataDict.get(item.subTypeId) || '';
  }
  if (filterType.startsWith('Other ')) {
    const realType = filterType.replace('Other ', '');
    return !subType && (item.eventType.startsWith(realType) || realType.startsWith(item.eventType));
  }
  if (!isStatisticMode) {
    // 从StatisticTab size行跳转
    if (filterType.endsWith('GB') || filterType.endsWith('MB') || filterType.endsWith('KB') || filterType.endsWith('byte')) {
      return statisticsSelection.some(selectionElement =>
        selectionElement.memoryTap === filterType &&
        selectionElement.max === item.heapSize &&
        selectionElement.eventType === item.eventType
      );
    }
  }
  return subType.startsWith(filterType) || item.eventType.startsWith(filterType);
}

function handleOtherSource(
  filterType: string,
  item: NativeHookStatistics | NativeMemory,
  isStatisticMode: boolean
): boolean {
  if (filterType === MemoryBasicType.OTHER_SOURCE[0]) {
    // 全量数据，返回true
    return true;
  } else if (filterType === MemoryBasicType.OTHER_SOURCE[1]) {
    // 所有的FD数据
    filterType = isStatisticMode ? MemoryType.FD_SIMPLE_NAME : MemoryType.FD_OPEN_NAME;
  } else if (filterType === MemoryBasicType.OTHER_SOURCE[2]) {
    // 所有的THREAD数据
    filterType = isStatisticMode ? MemoryType.THREAD_SIMPLE_NAME : MemoryType.THREAD_CREATE_NAME;
  }
  let subType = '';
  if (item.hasSubType) {
    subType = DataCache.getInstance().dataDict.get(item.subTypeId) || '';
  }
  if (filterType.startsWith('Other ')) {
    const realType = filterType.replace('Other ', '');
    return !subType && (item.eventType.startsWith(realType) || realType.startsWith(item.eventType));
  }

  return subType.startsWith(filterType) || item.eventType.startsWith(filterType);
}