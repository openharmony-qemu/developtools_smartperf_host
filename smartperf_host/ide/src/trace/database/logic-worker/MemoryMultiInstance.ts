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
            when type = ${MemoryStatisticType.ARK_GLOBAL_HANDLE} then '${MemoryType.ARK_GLOBAL_HANDLE_Alloc_NAME}'
            when type = ${MemoryStatisticType.ARK_LOCAL_HANDLE} then '${MemoryType.ARK_LOCAL_HANDLE_Alloc_NAME}'
            when type = ${MemoryStatisticType.ARKTS} then '${MemoryType.ARKTS_Alloc_NAME}'
            when type = ${MemoryStatisticType.JS} then '${MemoryType.JS_Alloc_NAME}'
            when type = ${MemoryStatisticType.DART_HEAP} then '${MemoryType.DART_HEAP_Alloc_NAME}'
            when type = ${MemoryStatisticType.ARKTS_STATIC_HEAP} then '${MemoryType.ARKTS_STATIC_HEAP_Alloc_NAME}'
            when type = ${MemoryStatisticType.RN} then '${MemoryType.RN_HERMES_HEAP_Alloc_NAME}'
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
                max(apply_count) as count,
                max(release_count) as freeCount,
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
            applyEventType: MemoryType.ARK_GLOBAL_HANDLE_Alloc_NAME,
            releaseEventType: MemoryType.ARK_GLOBAL_HANDLE_Free_NAME,
            sampleArray: []
          },
          {
            applyEventType: MemoryType.ARK_LOCAL_HANDLE_Alloc_NAME,
            releaseEventType: MemoryType.ARK_LOCAL_HANDLE_Free_NAME,
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
            applyEventType: MemoryType.DART_HEAP_Alloc_NAME,
            releaseEventType: MemoryType.DART_HEAP_Free_NAME,
            sampleArray: []
          },
          {
            applyEventType: MemoryType.ARKTS_STATIC_HEAP_Alloc_NAME,
            releaseEventType: MemoryType.ARKTS_STATIC_HEAP_Free_NAME,
            sampleArray: []
          },
          {
            applyEventType: MemoryType.RN_HERMES_HEAP_Alloc_NAME,
            releaseEventType: MemoryType.RN_HERMES_HEAP_Free_NAME,
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

// 辅助函数：获取子类型
function getSubType(item: NativeHookStatistics | NativeMemory): string {
  if (item.hasSubType) {
    return DataCache.getInstance().dataDict.get(item.subTypeId) || '';
  }
  return '';
}

// 辅助函数：处理 "Other" 前缀的过滤类型
function handleOtherFilterType(filterType: string, item: NativeHookStatistics | NativeMemory, subType: string): boolean | null {
  if (filterType.startsWith('Other ')) {
    const realType = filterType.replace('Other ', '');
    return !subType && (item.eventType.startsWith(realType) || realType.startsWith(item.eventType));
  }
  return null;
}

// 辅助函数：处理从StatisticTab size行跳转的情况
function handleStatisticTabJump(filterType: string, item: NativeHookStatistics | NativeMemory, statisticsSelection: StatisticsSelection[]): boolean | null {
  // 子类型不按照Size统计
  if (item.hasSubType) {
    return null;
  }
  if (filterType.endsWith('GB') || filterType.endsWith('MB') || filterType.endsWith('KB') || filterType.endsWith('byte')) {
    return statisticsSelection.some(selectionElement =>
      selectionElement.memoryTap === filterType &&
      selectionElement.max === item.heapSize &&
      selectionElement.eventType === item.eventType
    );
  }
  return null;
}

// 辅助函数：处理统计模式下的特殊事件类型
function handleStatisticModeSpecialTypes(filterType: string, item: NativeHookStatistics | NativeMemory): boolean | null {
  if (filterType === MemoryType.MEMORY_M_FILE_PAGE_MSG) {
    return item.subTypeId === -1 && item.eventType === MemoryType.MEMORY_M_FILE_PAGE_MSG;
  } else if (filterType === MemoryType.MEMORY_M_MEMORY_USING_MSG) {
    return item.subTypeId === -1 && item.eventType === MemoryType.MEMORY_M_MEMORY_USING_MSG;
  }
  return null;
}

// 定义MemoryBasicType的索引常量，提高可读性
const MEMORY_BASIC_TYPE = {
  ALL: 0,
  ALL_HEAP: 1,
  NATIVE_HEAP: 2,
  ARKTS_HEAP: 3,
  JS_HEAP: 4,
  DART_HEAP: 5,
  ARKTS_STATIC_HEAP: 6,
  RN_HEAP: 7,
  KMP_HEAP: 8,
  ALL_ANONYMOUS_VM: 9,
  VM_ION: 10,
  VM_ASHMEM: 11,
  VM_SO: 12,
  VM_OTHERS: 13
};

// 定义内存类型常量数组
const MEMORY_TYPE_CONSTANTS = {
  HEAP_EVENT_TYPES: [
    MemoryType.MEMORY_M_ALLOC_NAME,
    MemoryType.ARKTS_Alloc_NAME,
    MemoryType.JS_Alloc_NAME,
    MemoryType.DART_HEAP_Alloc_NAME,
    MemoryType.ARKTS_STATIC_HEAP_Alloc_NAME,
    MemoryType.RN_HERMES_HEAP_Alloc_NAME,
    MemoryType.KMP_Alloc_NAME,
    MemoryType.ARK_GLOBAL_HANDLE_Alloc_NAME,
    MemoryType.ARK_LOCAL_HANDLE_Alloc_NAME
  ],
  HEAP_STATISTIC_TYPES: [
    MemoryStatisticType.MALLOC,
    MemoryStatisticType.ARKTS,
    MemoryStatisticType.JS,
    MemoryStatisticType.DART_HEAP,
    MemoryStatisticType.ARKTS_STATIC_HEAP,
    MemoryStatisticType.RN,
    MemoryStatisticType.KMP,
    MemoryStatisticType.ARK_GLOBAL_HANDLE,
    MemoryStatisticType.ARK_LOCAL_HANDLE
  ],
  VM_EVENT_TYPES: [
    MemoryType.MEMORY_M_MAP_NAME,
    MemoryType.ION_Alloc_NAME,
    MemoryType.ASHMEM_Alloc_NAME,
    MemoryType.SO_Alloc_NAME
  ],
  VM_STATISTIC_TYPES: [
    MemoryStatisticType.MMAP,
    MemoryStatisticType.FILE_PAGE_MSG,
    MemoryStatisticType.MEMORY_USING_MSG,
    MemoryStatisticType.DMA,
    MemoryStatisticType.ASHMEM,
    MemoryStatisticType.SO
  ],
  VM_OTHERS_STATISTIC_TYPES: [
    MemoryStatisticType.MMAP,
    MemoryStatisticType.FILE_PAGE_MSG,
    MemoryStatisticType.MEMORY_USING_MSG
  ]
};

// 辅助函数：处理全量内存类型过滤
function handleAllMemoryType(filterType: string, memoryBasicType: readonly string[]): boolean {
  return filterType === memoryBasicType[MEMORY_BASIC_TYPE.ALL];
}

// 辅助函数：处理内存类型映射
function mapMemoryType(filterType: string, memoryBasicType: readonly string[]): string | null {
  const typeMap = new Map<string, string>([
    [memoryBasicType[MEMORY_BASIC_TYPE.NATIVE_HEAP], MemoryType.MEMORY_M_ALLOC_NAME],
    [memoryBasicType[MEMORY_BASIC_TYPE.ARKTS_HEAP], MemoryType.ARKTS_Alloc_NAME],
    [memoryBasicType[MEMORY_BASIC_TYPE.JS_HEAP], MemoryType.JS_Alloc_NAME],
    [memoryBasicType[MEMORY_BASIC_TYPE.DART_HEAP], MemoryType.DART_HEAP_Alloc_NAME],
    [memoryBasicType[MEMORY_BASIC_TYPE.ARKTS_STATIC_HEAP], MemoryType.ARKTS_STATIC_HEAP_Alloc_NAME],
    [memoryBasicType[MEMORY_BASIC_TYPE.RN_HEAP], MemoryType.RN_HERMES_HEAP_Alloc_NAME],
    [memoryBasicType[MEMORY_BASIC_TYPE.KMP_HEAP], MemoryType.KMP_Alloc_NAME],
    [memoryBasicType[MEMORY_BASIC_TYPE.VM_ION], MemoryType.ION_Alloc_NAME],
    [memoryBasicType[MEMORY_BASIC_TYPE.VM_ASHMEM], MemoryType.ASHMEM_Alloc_NAME],
    [memoryBasicType[MEMORY_BASIC_TYPE.VM_SO], MemoryType.SO_Alloc_NAME]
  ]);

  return typeMap.get(filterType) || null;
}

// 辅助函数：处理所有Heap类型
function handleAllHeapType(filterType: string, item: NativeHookStatistics | NativeMemory, isStatisticMode: boolean): boolean | null {
  if (filterType !== MemoryBasicType.NATIVE_MEMORY[MEMORY_BASIC_TYPE.ALL_HEAP]) {
    return null;
  }

  return MEMORY_TYPE_CONSTANTS.HEAP_EVENT_TYPES.includes(item.eventType) ||
    (isStatisticMode && MEMORY_TYPE_CONSTANTS.HEAP_STATISTIC_TYPES.includes((item as any).type));
}

// 辅助函数：处理所有VM类型
function handleAllVMType(filterType: string, item: NativeHookStatistics | NativeMemory, isStatisticMode: boolean): boolean | null {
  if (filterType !== MemoryBasicType.NATIVE_MEMORY[MEMORY_BASIC_TYPE.ALL_ANONYMOUS_VM]) {
    return null;
  }

  return MEMORY_TYPE_CONSTANTS.VM_EVENT_TYPES.includes(item.eventType) ||
    (isStatisticMode && MEMORY_TYPE_CONSTANTS.VM_STATISTIC_TYPES.includes((item as any).type));
}

// 辅助函数：处理VM Others类型
function handleVMOthersType(filterType: string, item: NativeHookStatistics | NativeMemory, isStatisticMode: boolean): boolean | null {
  if (filterType !== MemoryBasicType.NATIVE_MEMORY[MEMORY_BASIC_TYPE.VM_OTHERS]) {
    return null;
  }

  return item.eventType === MemoryType.MEMORY_M_MAP_NAME ||
    (isStatisticMode && MEMORY_TYPE_CONSTANTS.VM_OTHERS_STATISTIC_TYPES.includes((item as any).type));
}

// 辅助函数：处理统计模式和跳转逻辑
function handleStatisticAndJumpLogic(filterType: string, item: NativeHookStatistics | NativeMemory, statisticsSelection: StatisticsSelection[], isStatisticMode: boolean): boolean | null {
  if (isStatisticMode) {
    return handleStatisticModeSpecialTypes(filterType, item);
  } else {
    return handleStatisticTabJump(filterType, item, statisticsSelection);
  }
}

// 辅助函数：处理GPU内存类型映射
function handleGPUMemoryTypeMapping(filterType: string, isStatisticMode: boolean): string {
  const gpuMemoryMap = new Map<string, string>([
    [MemoryBasicType.GPU_MEMORY[1], isStatisticMode ? MemoryType.GPU_VK_SIMPLE_NAME : MemoryType.GPU_VK_Alloc_NAME],
    [MemoryBasicType.GPU_MEMORY[2], isStatisticMode ? MemoryType.GPU_GLES_SIMPLE_NAME : MemoryType.GPU_GLES_Alloc_NAME],
    [MemoryBasicType.GPU_MEMORY[3], isStatisticMode ? MemoryType.GPU_CL_SIMPLE_NAME : MemoryType.GPU_CL_Alloc_NAME]
  ]);

  return gpuMemoryMap.get(filterType) || filterType;
}

// 辅助函数：处理其他来源内存类型映射
function handleOtherSourceTypeMapping(filterType: string, isStatisticMode: boolean): string {
  const otherSourceMap = new Map<string, string>([
    [MemoryBasicType.OTHER_SOURCE[1], isStatisticMode ? MemoryType.FD_SIMPLE_NAME : MemoryType.FD_OPEN_NAME],
    [MemoryBasicType.OTHER_SOURCE[2], isStatisticMode ? MemoryType.THREAD_SIMPLE_NAME : MemoryType.THREAD_CREATE_NAME]
  ]);

  return otherSourceMap.get(filterType) || filterType;
}

export function getFilterType(
  filterType: string,
  item: NativeHookStatistics | NativeMemory,
  statisticsSelection: Array<StatisticsSelection>,
  memoryType: MemoryTraceRowType,
  isStatisticMode: boolean
): boolean {
  if (!filterType || filterType === '-1') {
    return false;
  }

  const subType = getSubType(item);

  // 处理 "Other" 前缀的通用逻辑
  const otherResult = handleOtherFilterType(filterType, item, subType);
  if (otherResult !== null) {
    return otherResult;
  }

  switch (memoryType) {
    case MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY:
      return handleNativeMemory(filterType, item, statisticsSelection, isStatisticMode, subType);
    case MemoryTraceRowType.ROW_TYPE_GPU_MEMORY:
      return handleGPUMemory(filterType, item, statisticsSelection, isStatisticMode, subType);
    case MemoryTraceRowType.ROW_TYPE_OTHER_SOURCE:
      return handleOtherSource(filterType, item, isStatisticMode, subType);
    default:
      return false;
  }
}

function handleNativeMemory(
  filterType: string,
  item: NativeHookStatistics | NativeMemory,
  statisticsSelection: StatisticsSelection[],
  isStatisticMode: boolean,
  subType: string
): boolean {
  // 处理全量数据
  if (handleAllMemoryType(filterType, MemoryBasicType.NATIVE_MEMORY)) {
    return true;
  }

  // 处理特殊内存类型组
  const allHeapResult = handleAllHeapType(filterType, item, isStatisticMode);
  if (allHeapResult !== null) return allHeapResult;

  const allVMResult = handleAllVMType(filterType, item, isStatisticMode);
  if (allVMResult !== null) return allVMResult;

  const vmOthersResult = handleVMOthersType(filterType, item, isStatisticMode);
  if (vmOthersResult !== null) return vmOthersResult;

  // 处理内存类型映射
  const mappedType = mapMemoryType(filterType, MemoryBasicType.NATIVE_MEMORY);
  if (mappedType) {
    filterType = mappedType;
  }

  // 处理统计模式和跳转逻辑
  const logicResult = handleStatisticAndJumpLogic(filterType, item, statisticsSelection, isStatisticMode);
  if (logicResult !== null) {
    return logicResult;
  }

  // Native Heap 需要包含 ARK_GLOBAL_HANDLE_Alloc_Event
  if ((filterType === MemoryType.MEMORY_M_ALLOC_NAME && item.eventType === MemoryType.ARK_GLOBAL_HANDLE_Alloc_NAME) || (filterType === MemoryType.MEMORY_M_ALLOC_NAME && item.eventType === MemoryType.ARK_LOCAL_HANDLE_Alloc_NAME)) {
    return true;
  }

  return subType === filterType || item.eventType.startsWith(filterType);
}

function handleGPUMemory(
  filterType: string,
  item: NativeHookStatistics | NativeMemory,
  statisticsSelection: StatisticsSelection[],
  isStatisticMode: boolean,
  subType: string
): boolean {
  if (filterType === MemoryBasicType.GPU_MEMORY[0]) {
    return true;
  }

  // 处理GPU内存类型映射
  filterType = handleGPUMemoryTypeMapping(filterType, isStatisticMode);

  // 处理从StatisticTab size行跳转
  if (!isStatisticMode) {
    const jumpResult = handleStatisticTabJump(filterType, item, statisticsSelection);
    if (jumpResult !== null) {
      return jumpResult;
    }
  }

  return subType === filterType || item.eventType.startsWith(filterType);
}

function handleOtherSource(
  filterType: string,
  item: NativeHookStatistics | NativeMemory,
  isStatisticMode: boolean,
  subType: string
): boolean {
  if (filterType === MemoryBasicType.OTHER_SOURCE[0]) {
    return true;
  }

  // 处理其他来源内存类型映射
  filterType = handleOtherSourceTypeMapping(filterType, isStatisticMode);

  return subType === filterType || item.eventType.startsWith(filterType);
}