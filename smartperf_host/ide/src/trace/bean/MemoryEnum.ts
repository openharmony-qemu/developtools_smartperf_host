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

import { SelectionParam } from "./BoxSelection";

// 内存类型组
export enum MemoryTraceRowType {
  ROW_TYPE_NATIVE_MEMORY = 'nativeMemory',
  ROW_TYPE_GPU_MEMORY = 'gpuMemory',
  ROW_TYPE_OTHER_SOURCE = 'otherSource'
}

export class MemoryTableName {
  static readonly NATIVE_HOOK = 'native_hook';
  static readonly NATIVE_HOOK_STATISTIC = 'native_hook_statistic';
  // other Table
}


// 对应统计模式数据库中的type定义
export enum MemoryStatisticType {
  MALLOC = 0,
  MMAP = 1,
  FILE_PAGE_MSG = 2,
  MEMORY_USING_MSG = 3,
  FD = 4,
  THREAD = 5,
  GPU_VK = 6,
  GPU_GLES = 7,
  GPU_CL = 8,
  SO = 9,           // VM SO
  ARKTS = 10,       // ArkTs Heap
  JS = 11,        // JS Heap
  KMP = 12,         // KMP Heap
  RN = 13,          // RN Heap 废弃
  ASHMEM = 14,      // VM Ashmem
  DMA = 15,         // VM ION
  OTHER = 16,       // Other
};

export class MemoryType {
  static readonly MEMORY_M_ALLOC_NAME = 'AllocEvent';
  static readonly MEMORY_M_MAP_NAME = 'MmapEvent';
  static readonly MEMORY_M_FILE_PAGE_MSG = 'FILE_PAGE_MSG';// MMap子类型
  static readonly MEMORY_M_MEMORY_USING_MSG = 'MEMORY_USING_MSG';// MMap子类型
  static readonly MEMORY_M_FREE_NAME = 'FreeEvent';
  static readonly MEMORY_M_UNMAP_NAME = 'MunmapEvent';
  static readonly FD_OPEN_NAME = 'FD_Open_Event';
  static readonly FD_SIMPLE_NAME = 'FD'; // 过滤简称
  static readonly THREAD_CREATE_NAME = 'Thread_Create_Event';
  static readonly THREAD_SIMPLE_NAME = 'Thread'; // 过滤简称
  static readonly FD_CLOSE_NAME = 'FD_Close_Event';
  static readonly THREAD_DESTROY_NAME = 'Thread_Destroy_Event';
  static readonly GPU_CL_Alloc_NAME = 'GPU_CL_Alloc_Event';
  static readonly GPU_CL_SIMPLE_NAME = 'GPU_CL'; // 过滤简称
  static readonly GPU_CL_Free_NAME = 'GPU_CL_Free_Event';
  static readonly GPU_GLES_Alloc_NAME = 'GPU_GLES_Alloc_Event';
  static readonly GPU_GLES_SIMPLE_NAME = 'GPU_GLES'; // 过滤简称
  static readonly GPU_GLES_Free_NAME = 'GPU_GLES_Free_Event';
  static readonly GPU_VK_Alloc_NAME = 'GPU_VK_Alloc_Event';
  static readonly GPU_VK_SIMPLE_NAME = 'GPU_VK'; // 过滤简称
  static readonly GPU_VK_Free_NAME = 'GPU_VK_Free_Event';
  // 新增类型
  static readonly ARKTS_Alloc_NAME = 'ARKTS_HEAP_Alloc_Event';
  static readonly ARKTS_Free_NAME = 'ARKTS_HEAP_Free_Event';
  static readonly JS_Alloc_NAME = 'JS_HEAP_Alloc_Event';
  static readonly JS_Free_NAME = 'JS_HEAP_Free_Event';
  static readonly KMP_Alloc_NAME = 'KMP_HEAP_Alloc_Event';
  static readonly KMP_Free_NAME = 'KMP_HEAP_Free_Event';
  static readonly ION_Alloc_NAME = 'ION_Alloc_Event';
  static readonly ION_Free_NAME = 'ION_Free_Event';
  static readonly SO_Alloc_NAME = 'SO_Alloc_Event';
  static readonly SO_Free_NAME = 'SO_Free_Event';
  static readonly ASHMEM_Alloc_NAME = 'ASHMEM_Alloc_Event';
  static readonly ASHMEM_Free_NAME = 'ASHMEM_Free_Event';
  // 数据库中所有的申请事件集合
  static readonly APPLY_EVENTS = [MemoryType.MEMORY_M_ALLOC_NAME, MemoryType.MEMORY_M_MAP_NAME,
  MemoryType.FD_OPEN_NAME, MemoryType.THREAD_CREATE_NAME,
  MemoryType.GPU_VK_Alloc_NAME, MemoryType.GPU_GLES_Alloc_NAME, MemoryType.GPU_CL_Alloc_NAME,
  MemoryType.ARKTS_Alloc_NAME, MemoryType.JS_Alloc_NAME,
  MemoryType.KMP_Alloc_NAME, MemoryType.SO_Alloc_NAME, MemoryType.ASHMEM_Alloc_NAME,
  MemoryType.ION_Alloc_NAME];

  static readonly APPLY_NM_EVENTS = [MemoryType.MEMORY_M_ALLOC_NAME, MemoryType.MEMORY_M_MAP_NAME,
  MemoryType.ARKTS_Alloc_NAME, MemoryType.JS_Alloc_NAME, MemoryType.KMP_Alloc_NAME, MemoryType.ION_Alloc_NAME, MemoryType.SO_Alloc_NAME, MemoryType.ASHMEM_Alloc_NAME];

  static readonly ALL_HEAP_EVENTS = [MemoryType.MEMORY_M_ALLOC_NAME, MemoryType.ARKTS_Alloc_NAME, MemoryType.JS_Alloc_NAME, MemoryType.KMP_Alloc_NAME];
  static readonly ALL_ANONYMOUS_EVENTS = [MemoryType.MEMORY_M_MAP_NAME, MemoryType.ION_Alloc_NAME, MemoryType.SO_Alloc_NAME, MemoryType.ASHMEM_Alloc_NAME];

};

// 对应泳道图的基本类型
export const MemoryBasicType = {
  NATIVE_MEMORY: [
    'All Heap & Anonymous VM',
    'All Heap',
    'Native Heap',
    'ArkTs Heap',
    'JS Heap',
    'KMP Heap',
    'All Anonymous VM',
    'VM ION',
    'VM Ashmem',
    'VM SO',
    'VM Others',
  ] as const,
  GPU_MEMORY: [
    'All Gpu Memory',
    'Gpu VK',
    'Gpu GLES',
    'Gpu CL',
  ] as const,
  OTHER_SOURCE: [
    'All Other Source',
    'FD',
    'Thread',
  ] as const,
};

// 定义 Native Memory 的堆类型索引数组
export const NATIVE_MEMORY_ALL_HEAP_IDX = 1; // All Heap
export const NATIVE_MEMORY_HEAP_INDICES = [2, 3, 4, 5] as const; // Native Heap, ArkTs Heap, ArkWeb Heap, KMP Heap
export const NATIVE_MEMORY_ALL_ANONYMOUS_VM_IDX = 6; // All Anonymous VM
export const NATIVE_MEMORY_ANONYMOUS_VM_INDICES = [7, 8, 9, 10] as const; // VM ION, VM Ashmem, VM SO, VM Others

// Native Memory 泳道组配置
export const nativeMemoryGroupConfig = {
  allHeap: {
    folderSuffix: NATIVE_MEMORY_ALL_HEAP_IDX,  // All Heap folder suffix 泳道idx
    childIndices: NATIVE_MEMORY_HEAP_INDICES,  // Native Heap, ArkTs Heap, ArkWeb Heap, RN Heap, KMP Heap
  },
  allAnonymousVM: {
    folderSuffix: NATIVE_MEMORY_ALL_ANONYMOUS_VM_IDX,  // All Anonymous VM folder suffix 泳道idx
    childIndices: NATIVE_MEMORY_ANONYMOUS_VM_INDICES,  // VM ION, VM Ashmem, VM SO, VM Others
  }
};

// 非统计模式泳道图配置
export const memoryConfig: Record<
  MemoryTraceRowType,// 每类内存泳道图
  {
    filters: Array<MemoryType>; // 需要从native_hook表中取得event_type数据
    chartConfigs: Array<{ filter?: MemoryType; suffix: number; }>; //泳道图顺序
  }
> = {
  [MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY]: {
    filters: [
      MemoryType.MEMORY_M_ALLOC_NAME, MemoryType.MEMORY_M_MAP_NAME,
      MemoryType.ARKTS_Alloc_NAME, MemoryType.JS_Alloc_NAME,
      MemoryType.KMP_Alloc_NAME,
      MemoryType.SO_Alloc_NAME, MemoryType.ASHMEM_Alloc_NAME,
      MemoryType.ION_Alloc_NAME
    ],
    chartConfigs: [
      { suffix: 0 }, // NativeMemory 总和泳道 (All Heap & Anonymous VM)
      { filter: MemoryType.MEMORY_M_ALLOC_NAME, suffix: 2 }, // Native Heap (原 All Heap)
      { filter: MemoryType.ARKTS_Alloc_NAME, suffix: 3 }, // ArkTs Heap
      { filter: MemoryType.JS_Alloc_NAME, suffix: 4 }, // JS Heap
      { filter: MemoryType.KMP_Alloc_NAME, suffix: 5 }, // KMP Heap
      { filter: MemoryType.ION_Alloc_NAME, suffix: 7 }, // VM ION
      { filter: MemoryType.ASHMEM_Alloc_NAME, suffix: 8 }, // VM Ashmem
      { filter: MemoryType.SO_Alloc_NAME, suffix: 9 }, // VM SO
      { filter: MemoryType.MEMORY_M_MAP_NAME, suffix: 10 }, // VM Others (原 All Anonymous VM)
    ],
  },
  [MemoryTraceRowType.ROW_TYPE_OTHER_SOURCE]: {
    filters: [MemoryType.FD_OPEN_NAME, MemoryType.THREAD_CREATE_NAME],
    chartConfigs: [
      { filter: MemoryType.FD_OPEN_NAME, suffix: 0 }, // FD泳道
      { filter: MemoryType.THREAD_CREATE_NAME, suffix: 1 }, // THREAD泳道
    ],
  },
  [MemoryTraceRowType.ROW_TYPE_GPU_MEMORY]: {
    filters: [MemoryType.GPU_VK_Alloc_NAME, MemoryType.GPU_GLES_Alloc_NAME, MemoryType.GPU_CL_Alloc_NAME],
    chartConfigs: [
      { suffix: 0 }, // GpuMemory 总和泳道
      { filter: MemoryType.GPU_VK_Alloc_NAME, suffix: 1 }, // GPU_CL泳道
      { filter: MemoryType.GPU_GLES_Alloc_NAME, suffix: 2 }, // GPU_GLES泳道
      { filter: MemoryType.GPU_CL_Alloc_NAME, suffix: 3 }, // GPU_VK泳道
    ],
  },
};


// 统计模式对应数据库中的type定义
export const statisticTypeMap: Record<number, string> = {
  0: "alloc",      // MemoryStatisticType.MALLOC (Native Heap)
  1: "mmap",       // MemoryStatisticType.MMAP (VM Others)
  2: "mmap",       // MemoryStatisticType.FILE_PAGE_MSG (VM Others)
  3: "mmap",       // MemoryStatisticType.MEMORY_USING_MSG (VM Others)
  4: "fd",         // MemoryStatisticType.FD
  5: "thread",     // MemoryStatisticType.THREAD
  6: "gpuVk",      // MemoryStatisticType.GPU_VK
  7: "gpuGles",    // MemoryStatisticType.GPU_GLES
  8: "gpuCl",      // MemoryStatisticType.GPU_CL
  9: "so",         // MemoryStatisticType.SO (VM SO)
  10: "arkts",     // MemoryStatisticType.ARKTS (ArkTs Heap)
  11: "js",        // MemoryStatisticType.JS (JS Heap)
  12: "kmp",       // MemoryStatisticType.KMP (KMP Heap)
  13: "rn",        // MemoryStatisticType.RN (RN Heap) 废弃
  14: "ashmem",     // MemoryStatisticType.ASHMEM (VM Ashmem)
  15: "ion",       // MemoryStatisticType.DMA (VM ION)
  16: "other",     // MemoryStatisticType.OTHER (Other)
};

//统计模式泳道图配置：
type HandlerItem = {
  rowType: MemoryTraceRowType;   // rowType: 内存类型
  suffixes: Array<{ key: string; suffix: string; }>;  // suffixes: 对应的泳道图的idx
  sum?: true | string[]; // 可选；是否需要总和泳道图，存在时从 suffixes 取值
};

export const handlerConfig: HandlerItem[] = [
  {
    rowType: MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY,
    suffixes: [
      { key: "alloc", suffix: "2" },      // Native Heap
      { key: "arkts", suffix: "3" },      // ArkTs Heap
      { key: "js", suffix: "4" },     // JS Heap
      { key: "kmp", suffix: "5" },       // KMP Heap
      { key: "ion", suffix: "7" },       // VM ION
      { key: "ashmem", suffix: "8" },   // VM Ashmem
      { key: "so", suffix: "9" },      // VM SO
      { key: "mmap", suffix: "10" },    // VM Others
    ],
    sum: true,
  },
  {
    rowType: MemoryTraceRowType.ROW_TYPE_OTHER_SOURCE,
    suffixes: [
      { key: "fd", suffix: "0" },
      { key: "thread", suffix: "1" },
    ],
  },
  {
    rowType: MemoryTraceRowType.ROW_TYPE_GPU_MEMORY,
    suffixes: [
      { key: "gpuVk", suffix: "1" },
      { key: "gpuGles", suffix: "2" },
      { key: "gpuCl", suffix: "3" },
    ],
    sum: true,
  },
];


// 映射框选的每个泳道图type 对应需要 push 的 事件值，查询sql的时候过滤事件使用
function mapTypeToFilters(type: string, isStat: boolean, needFree: boolean): Array<string | number> {
  switch (type) {
    //NativeMemory 第一行汇总泳道 (All Heap & Anonymous VM)
    case MemoryBasicType.NATIVE_MEMORY[0]:
      return isStat
        ? [
          MemoryStatisticType.MALLOC, MemoryStatisticType.MMAP,
          MemoryStatisticType.FILE_PAGE_MSG, MemoryStatisticType.MEMORY_USING_MSG,
          MemoryStatisticType.ARKTS, MemoryStatisticType.JS, MemoryStatisticType.KMP,
          MemoryStatisticType.SO, MemoryStatisticType.ASHMEM, MemoryStatisticType.DMA
        ]
        : needFree
          ? [
            `${MemoryType.MEMORY_M_ALLOC_NAME}`, `${MemoryType.MEMORY_M_FREE_NAME}`,
            `${MemoryType.MEMORY_M_MAP_NAME}`, `${MemoryType.MEMORY_M_UNMAP_NAME}`,
            `${MemoryType.ARKTS_Alloc_NAME}`, `${MemoryType.ARKTS_Free_NAME}`,
            `${MemoryType.JS_Alloc_NAME}`, `${MemoryType.JS_Free_NAME}`,
            `${MemoryType.KMP_Alloc_NAME}`, `${MemoryType.KMP_Free_NAME}`,
            `${MemoryType.SO_Alloc_NAME}`, `${MemoryType.SO_Free_NAME}`,
            `${MemoryType.ASHMEM_Alloc_NAME}`, `${MemoryType.ASHMEM_Free_NAME}`,
            `${MemoryType.ION_Alloc_NAME}`, `${MemoryType.ION_Free_NAME}`
          ]
          : [
            `${MemoryType.MEMORY_M_ALLOC_NAME}`, `${MemoryType.MEMORY_M_MAP_NAME}`,
            `${MemoryType.ARKTS_Alloc_NAME}`, `${MemoryType.JS_Alloc_NAME}`,
            `${MemoryType.SO_Alloc_NAME}`, `${MemoryType.ASHMEM_Alloc_NAME}`,
            `${MemoryType.ION_Alloc_NAME}`, `${MemoryType.KMP_Alloc_NAME}`
          ];
    //NativeMemory 第二行All Heap泳道组
    case MemoryBasicType.NATIVE_MEMORY[1]:
      return isStat
        ? [MemoryStatisticType.MALLOC, MemoryStatisticType.ARKTS,
          MemoryStatisticType.JS, MemoryStatisticType.KMP]
        : needFree
          ? [
            `${MemoryType.MEMORY_M_ALLOC_NAME}`, `${MemoryType.MEMORY_M_FREE_NAME}`,
            `${MemoryType.ARKTS_Alloc_NAME}`, `${MemoryType.ARKTS_Free_NAME}`,
            `${MemoryType.JS_Alloc_NAME}`, `${MemoryType.JS_Free_NAME}`,
            `${MemoryType.KMP_Alloc_NAME}`, `${MemoryType.KMP_Free_NAME}`
          ]
          : [
            `${MemoryType.MEMORY_M_ALLOC_NAME}`,
            `${MemoryType.ARKTS_Alloc_NAME}`, `${MemoryType.JS_Alloc_NAME}`,
            `${MemoryType.KMP_Alloc_NAME}`
          ];
    //NativeMemory Native Heap (原 All Heap)
    case MemoryBasicType.NATIVE_MEMORY[2]:
      return isStat
        ? [MemoryStatisticType.MALLOC]
        : needFree
          ? [`${MemoryType.MEMORY_M_ALLOC_NAME}`, `${MemoryType.MEMORY_M_FREE_NAME}`]
          : [`${MemoryType.MEMORY_M_ALLOC_NAME}`];
    //NativeMemory ArkTs Heap
    case MemoryBasicType.NATIVE_MEMORY[3]:
      return isStat
        ? [MemoryStatisticType.ARKTS]
        : needFree
          ? [`${MemoryType.ARKTS_Alloc_NAME}`, `${MemoryType.ARKTS_Free_NAME}`]
          : [`${MemoryType.ARKTS_Alloc_NAME}`];
    //NativeMemory ArkWeb Heap
    case MemoryBasicType.NATIVE_MEMORY[4]:
      return isStat
        ? [MemoryStatisticType.JS]
        : needFree
          ? [`${MemoryType.JS_Alloc_NAME}`, `${MemoryType.JS_Free_NAME}`]
          : [`${MemoryType.JS_Alloc_NAME}`];
    //NativeMemory KMP Heap
    case MemoryBasicType.NATIVE_MEMORY[5]:
      return isStat
        ? [MemoryStatisticType.KMP]
        : needFree
          ? [`${MemoryType.KMP_Alloc_NAME}`, `${MemoryType.KMP_Free_NAME}`]
          : [`${MemoryType.KMP_Alloc_NAME}`];
    //NativeMemory 第七行All Anonymous VM泳道组
    case MemoryBasicType.NATIVE_MEMORY[6]:
      return isStat
        ? [MemoryStatisticType.MMAP, MemoryStatisticType.FILE_PAGE_MSG, MemoryStatisticType.MEMORY_USING_MSG,
        MemoryStatisticType.SO, MemoryStatisticType.ASHMEM, MemoryStatisticType.DMA]
        : needFree
          ? [
            `${MemoryType.MEMORY_M_MAP_NAME}`, `${MemoryType.MEMORY_M_UNMAP_NAME}`,
            `${MemoryType.SO_Alloc_NAME}`, `${MemoryType.SO_Free_NAME}`,
            `${MemoryType.ASHMEM_Alloc_NAME}`, `${MemoryType.ASHMEM_Free_NAME}`,
            `${MemoryType.ION_Alloc_NAME}`, `${MemoryType.ION_Free_NAME}`
          ]
          : [
            `${MemoryType.MEMORY_M_MAP_NAME}`,
            `${MemoryType.SO_Alloc_NAME}`, `${MemoryType.ASHMEM_Alloc_NAME}`,
            `${MemoryType.ION_Alloc_NAME}`
          ];
    //NativeMemory VM ION
    case MemoryBasicType.NATIVE_MEMORY[7]:
      return isStat
        ? [MemoryStatisticType.DMA]
        : needFree
          ? [`${MemoryType.ION_Alloc_NAME}`, `${MemoryType.ION_Free_NAME}`]
          : [`${MemoryType.ION_Alloc_NAME}`];
    //NativeMemory VM Ashmem  
    case MemoryBasicType.NATIVE_MEMORY[8]:
      return isStat
        ? [MemoryStatisticType.ASHMEM]
        : needFree
          ? [`${MemoryType.ASHMEM_Alloc_NAME}`, `${MemoryType.ASHMEM_Free_NAME}`]
          : [`${MemoryType.ASHMEM_Alloc_NAME}`];
    //NativeMemory VM SO
    case MemoryBasicType.NATIVE_MEMORY[9]:
      return isStat
        ? [MemoryStatisticType.SO]
        : needFree
          ? [`${MemoryType.SO_Alloc_NAME}`, `${MemoryType.SO_Free_NAME}`]
          : [`${MemoryType.SO_Alloc_NAME}`];
    //NativeMemory VM Others (原 All Anonymous VM)
    case MemoryBasicType.NATIVE_MEMORY[10]:
      return isStat
        ? [MemoryStatisticType.MMAP, MemoryStatisticType.FILE_PAGE_MSG, MemoryStatisticType.MEMORY_USING_MSG]
        : needFree
          ? [`${MemoryType.MEMORY_M_MAP_NAME}`, `${MemoryType.MEMORY_M_UNMAP_NAME}`]
          : [`${MemoryType.MEMORY_M_MAP_NAME}`];
    //OtherSource 第一行FD泳道
    case MemoryBasicType.OTHER_SOURCE[1]:
      return isStat
        ? [MemoryStatisticType.FD]
        : needFree
          ? [`${MemoryType.FD_OPEN_NAME}`, `${MemoryType.FD_CLOSE_NAME}`]
          : [`${MemoryType.FD_OPEN_NAME}`];
    //OtherSource 第二行Thread泳道
    case MemoryBasicType.OTHER_SOURCE[2]:
      return isStat
        ? [MemoryStatisticType.THREAD]
        : needFree
          ? [`${MemoryType.THREAD_CREATE_NAME}`, `${MemoryType.THREAD_DESTROY_NAME}`]
          : [`${MemoryType.THREAD_CREATE_NAME}`];
    // TODO:GPU Memory
    default:
      return [];
  }
};


// 定义 memoryType 到 selectionParam 属性之间的映射关系
function getMemoryTypeListKey(memoryType: MemoryTraceRowType, isStatistic: boolean): keyof SelectionParam {
  switch (memoryType) {
    case MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY:
      return isStatistic ? 'nativeMemoryStatistic' : 'nativeMemory';
    case MemoryTraceRowType.ROW_TYPE_OTHER_SOURCE:
      return isStatistic ? 'otherSourceStatistic' : 'otherSource';
    case MemoryTraceRowType.ROW_TYPE_GPU_MEMORY:
      return isStatistic ? 'gpuMemoryStatistic' : 'gpuMemory';
    default:
      throw new Error(`Unsupported memory type: ${memoryType}`);
  }
};

export function getCurrentTypes(selectParam: SelectionParam, memoryType: MemoryTraceRowType, isStatistic: boolean, needFree: boolean = true): Array<string | number> {
  const key = getMemoryTypeListKey(memoryType, isStatistic);
  const typeList = selectParam[key];
  const targetFilters: Array<number | string> = [];
  if (!Array.isArray(typeList)) {
    return [];
  }
  for (const type of typeList) {
    targetFilters.push(...mapTypeToFilters(type, isStatistic, needFree));
  }
  return targetFilters;
}

export interface TraceRowMemoryConfig {
  allProcess: Array<{ pid: number; ipid: number; }>;
  statisticData: string[];
  normalData: string[];
  currentIPid: number;
  memoryType: MemoryTraceRowType;
  setCurrentIPid: (ipid: number) => void;
}


export function getEventTypeNameFromTypeId(type: number): string {
  switch (type) {
    case MemoryStatisticType.MALLOC:
      return MemoryType.MEMORY_M_ALLOC_NAME;
    case MemoryStatisticType.MMAP:
      return MemoryType.MEMORY_M_MAP_NAME;
    case MemoryStatisticType.FILE_PAGE_MSG:
      return MemoryType.MEMORY_M_FILE_PAGE_MSG;
    case MemoryStatisticType.MEMORY_USING_MSG:
      return MemoryType.MEMORY_M_MEMORY_USING_MSG;
    case MemoryStatisticType.FD:
      return MemoryType.FD_OPEN_NAME;
    case MemoryStatisticType.THREAD:
      return MemoryType.THREAD_CREATE_NAME;
    case MemoryStatisticType.GPU_VK:
      return MemoryType.GPU_VK_Alloc_NAME;
    case MemoryStatisticType.GPU_GLES:
      return MemoryType.GPU_GLES_Alloc_NAME;
    case MemoryStatisticType.GPU_CL:
      return MemoryType.GPU_CL_Alloc_NAME;
    case MemoryStatisticType.SO:
      return MemoryType.SO_Alloc_NAME;
    case MemoryStatisticType.ARKTS:
      return MemoryType.ARKTS_Alloc_NAME;
    case MemoryStatisticType.JS:
      return MemoryType.JS_Alloc_NAME;
    case MemoryStatisticType.KMP:
      return MemoryType.KMP_Alloc_NAME;
    case MemoryStatisticType.ASHMEM:
      return MemoryType.ASHMEM_Alloc_NAME;
    case MemoryStatisticType.DMA:
      return MemoryType.ION_Alloc_NAME;
    default:
      return '';
  }
}
