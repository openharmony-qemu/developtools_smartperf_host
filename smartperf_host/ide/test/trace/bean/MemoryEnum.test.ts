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

import {
  MemoryTraceRowType,
  MemoryTableName,
  MemoryStatisticType,
  MemoryType,
  MemoryBasicType,
  NATIVE_MEMORY_ALL_HEAP_IDX,
  NATIVE_MEMORY_HEAP_INDICES,
  NATIVE_MEMORY_ALL_ANONYMOUS_VM_IDX,
  NATIVE_MEMORY_ANONYMOUS_VM_INDICES,
  nativeMemoryGroupConfig,
  memoryConfig,
  statisticTypeMap,
  handlerConfig,
  getCurrentTypes,
  getEventTypeNameFromTypeId,
} from '../../../src/trace/bean/MemoryEnum';

jest.mock('../../../src/trace/component/trace/base/TraceRow', () => {
  return {};
});

describe('MemoryEnum Test', () => {
  it('MemoryTraceRowTypeTest01', function () {
    expect(MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY).toEqual('nativeMemory');
    expect(MemoryTraceRowType.ROW_TYPE_GPU_MEMORY).toEqual('gpuMemory');
    expect(MemoryTraceRowType.ROW_TYPE_OTHER_SOURCE).toEqual('otherSource');
  });

  it('MemoryTableNameTest02', function () {
    expect(MemoryTableName.NATIVE_HOOK).toEqual('native_hook');
    expect(MemoryTableName.NATIVE_HOOK_STATISTIC).toEqual('native_hook_statistic');
  });

  it('MemoryStatisticTypeTest03', function () {
    expect(MemoryStatisticType.MALLOC).toEqual(0);
    expect(MemoryStatisticType.MMAP).toEqual(1);
    expect(MemoryStatisticType.DART_HEAP).toEqual(20);
    expect(MemoryStatisticType.ARKTS_STATIC_HEAP).toEqual(21);
    expect(MemoryStatisticType.RN).toEqual(13);
  });

  it('MemoryTypeTest04', function () {
    expect(MemoryType.DART_HEAP_Alloc_NAME).toEqual('DART_HEAP_Alloc_Event');
    expect(MemoryType.DART_HEAP_Free_NAME).toEqual('DART_HEAP_Free_Event');
    expect(MemoryType.ARKTS_STATIC_HEAP_Alloc_NAME).toEqual('ARKTS_STATIC_HEAP_Alloc_Event');
    expect(MemoryType.ARKTS_STATIC_HEAP_Free_NAME).toEqual('ARKTS_STATIC_HEAP_Free_Event');
    expect(MemoryType.RN_HERMES_HEAP_Alloc_NAME).toEqual('RN_HERMES_HEAP_Alloc_Event');
    expect(MemoryType.RN_HERMES_HEAP_Free_NAME).toEqual('RN_HERMES_HEAP_Free_Event');
  });

  it('MemoryBasicTypeTest05', function () {
    expect(MemoryBasicType.NATIVE_MEMORY[5]).toEqual('Dart Heap');
    expect(MemoryBasicType.NATIVE_MEMORY[6]).toEqual('Arkts Static Heap');
    expect(MemoryBasicType.NATIVE_MEMORY[7]).toEqual('RN Heap');
    expect(NATIVE_MEMORY_HEAP_INDICES).toEqual([2, 3, 4, 5, 6, 7, 8]);
  });

  it('NativeMemoryGroupConfigTest06', function () {
    expect(nativeMemoryGroupConfig.allHeap.folderSuffix).toEqual(NATIVE_MEMORY_ALL_HEAP_IDX);
    expect(nativeMemoryGroupConfig.allHeap.childIndices).toEqual(NATIVE_MEMORY_HEAP_INDICES);
    expect(nativeMemoryGroupConfig.allAnonymousVM.folderSuffix).toEqual(NATIVE_MEMORY_ALL_ANONYMOUS_VM_IDX);
    expect(nativeMemoryGroupConfig.allAnonymousVM.childIndices).toEqual(NATIVE_MEMORY_ANONYMOUS_VM_INDICES);
  });

  it('MemoryConfigTest07', function () {
    expect(memoryConfig[MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY].filters).toContain('DART_HEAP_Alloc_Event');
    expect(memoryConfig[MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY].filters).toContain('ARKTS_STATIC_HEAP_Alloc_Event');
    expect(memoryConfig[MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY].filters).toContain('RN_HERMES_HEAP_Alloc_Event');
  });

  it('StatisticTypeMapTest08', function () {
    expect(statisticTypeMap[20]).toEqual('dartHeap');
    expect(statisticTypeMap[21]).toEqual('arktsStaticHeap');
    expect(statisticTypeMap[13]).toEqual('rn');
  });

  it('HandlerConfigTest09', function () {
    const nativeHandler = handlerConfig.find(h => h.rowType === MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY);
    expect(nativeHandler).toBeDefined();
    expect(nativeHandler!.suffixes).toContainEqual({ key: "dartHeap", suffix: "5" });
    expect(nativeHandler!.suffixes).toContainEqual({ key: "arktsStaticHeap", suffix: "6" });
    expect(nativeHandler!.suffixes).toContainEqual({ key: "rn", suffix: "7" });
  });

  it('GetEventTypeNameFromTypeIdTest10', function () {
    expect(getEventTypeNameFromTypeId(MemoryStatisticType.DART_HEAP)).toEqual('DART_HEAP_Alloc_Event');
    expect(getEventTypeNameFromTypeId(MemoryStatisticType.ARKTS_STATIC_HEAP)).toEqual('ARKTS_STATIC_HEAP_Alloc_Event');
    expect(getEventTypeNameFromTypeId(MemoryStatisticType.RN)).toEqual('RN_HERMES_HEAP_Alloc_Event');
  });

  it('GetCurrentTypesTest11', function () {
    let selectParam = {
      nativeMemory: ['Dart Heap'],
      nativeMemoryStatistic: [],
      otherSource: [],
      otherSourceStatistic: [],
      gpuMemory: [],
      gpuMemoryStatistic: [],
    };
    let result = getCurrentTypes(selectParam, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY, false, false);
    expect(result).toContain('DART_HEAP_Alloc_Event');
  });

  it('GetCurrentTypesTest12', function () {
    let selectParam = {
      nativeMemory: ['RN Heap'],
      nativeMemoryStatistic: [],
      otherSource: [],
      otherSourceStatistic: [],
      gpuMemory: [],
      gpuMemoryStatistic: [],
    };
    let result = getCurrentTypes(selectParam, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY, false, false);
    expect(result).toContain('RN_HERMES_HEAP_Alloc_Event');
  });

  it('GetCurrentTypesTest13', function () {
    let selectParam = {
      nativeMemory: ['Dart Heap'],
      nativeMemoryStatistic: [],
      otherSource: [],
      otherSourceStatistic: [],
      gpuMemory: [],
      gpuMemoryStatistic: [],
    };
    let result = getCurrentTypes(selectParam, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY, false, true);
    expect(result).toContain('DART_HEAP_Alloc_Event');
    expect(result).toContain('DART_HEAP_Free_Event');
  });

  it('GetCurrentTypesTest14', function () {
    let selectParam = {
      nativeMemory: ['RN Heap'],
      nativeMemoryStatistic: [],
      otherSource: [],
      otherSourceStatistic: [],
      gpuMemory: [],
      gpuMemoryStatistic: [],
    };
    let result = getCurrentTypes(selectParam, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY, false, true);
    expect(result).toContain('RN_HERMES_HEAP_Alloc_Event');
    expect(result).toContain('RN_HERMES_HEAP_Free_Event');
  });

  it('GetCurrentTypesTest15', function () {
    let selectParam = {
      nativeMemory: [],
      nativeMemoryStatistic: [20],
      otherSource: [],
      otherSourceStatistic: [],
      gpuMemory: [],
      gpuMemoryStatistic: [],
    };
    let result = getCurrentTypes(selectParam, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY, true, false);
    expect(result).toContain(20);
  });

  it('GetCurrentTypesTest16', function () {
    let selectParam = {
      nativeMemory: [],
      nativeMemoryStatistic: [13],
      otherSource: [],
      otherSourceStatistic: [],
      gpuMemory: [],
      gpuMemoryStatistic: [],
    };
    let result = getCurrentTypes(selectParam, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY, true, false);
    expect(result).toContain(13);
  });

  it('GetCurrentTypesTest17', function () {
    let selectParam = {
      nativeMemory: ['Arkts Static Heap'],
      nativeMemoryStatistic: [],
      otherSource: [],
      otherSourceStatistic: [],
      gpuMemory: [],
      gpuMemoryStatistic: [],
    };
    let result = getCurrentTypes(selectParam, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY, false, false);
    expect(result).toContain('ARKTS_STATIC_HEAP_Alloc_Event');
  });

  it('GetCurrentTypesTest18', function () {
    let selectParam = {
      nativeMemory: ['Arkts Static Heap'],
      nativeMemoryStatistic: [],
      otherSource: [],
      otherSourceStatistic: [],
      gpuMemory: [],
      gpuMemoryStatistic: [],
    };
    let result = getCurrentTypes(selectParam, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY, false, true);
    expect(result).toContain('ARKTS_STATIC_HEAP_Alloc_Event');
    expect(result).toContain('ARKTS_STATIC_HEAP_Free_Event');
  });

  it('GetCurrentTypesTest19', function () {
    let selectParam = {
      nativeMemory: [],
      nativeMemoryStatistic: [21],
      otherSource: [],
      otherSourceStatistic: [],
      gpuMemory: [],
      gpuMemoryStatistic: [],
    };
    let result = getCurrentTypes(selectParam, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY, true, false);
    expect(result).toContain(21);
  });

  it('GetCurrentTypesTest20 - should handle multiple heap types including ARKTS_STATIC_HEAP', function () {
    let selectParam = {
      nativeMemory: ['All Heap', 'Arkts Static Heap', 'Dart Heap', 'RN Heap'],
      nativeMemoryStatistic: [],
      otherSource: [],
      otherSourceStatistic: [],
      gpuMemory: [],
      gpuMemoryStatistic: [],
    };
    let result = getCurrentTypes(selectParam, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY, false, false);
    expect(result).toContain('ARKTS_STATIC_HEAP_Alloc_Event');
    expect(result).toContain('DART_HEAP_Alloc_Event');
    expect(result).toContain('RN_HERMES_HEAP_Alloc_Event');
    expect(result).toContain('MEMORY_M_ALLOC_NAME');
  });

  it('GetCurrentTypesTest21 - should handle ARKTS_STATIC_HEAP with free events', function () {
    let selectParam = {
      nativeMemory: ['Arkts Static Heap'],
      nativeMemoryStatistic: [],
      otherSource: [],
      otherSourceStatistic: [],
      gpuMemory: [],
      gpuMemoryStatistic: [],
    };
    let result = getCurrentTypes(selectParam, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY, false, true);
    expect(result).toContain('ARKTS_STATIC_HEAP_Alloc_Event');
    expect(result).toContain('ARKTS_STATIC_HEAP_Free_Event');
    expect(result).not.toContain('DART_HEAP_Alloc_Event');
  });

  it('GetCurrentTypesTest22 - should handle statistic mode for ARKTS_STATIC_HEAP', function () {
    let selectParam = {
      nativeMemory: [],
      nativeMemoryStatistic: [21],
      otherSource: [],
      otherSourceStatistic: [],
      gpuMemory: [],
      gpuMemoryStatistic: [],
    };
    let result = getCurrentTypes(selectParam, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY, true, true);
    expect(result).toContain(21);
  });

  it('GetCurrentTypesTest23 - should handle all heap with ARKTS_STATIC_HEAP in statistic mode', function () {
    let selectParam = {
      nativeMemory: ['All Heap'],
      nativeMemoryStatistic: [],
      otherSource: [],
      otherSourceStatistic: [],
      gpuMemory: [],
      gpuMemoryStatistic: [],
    };
    let result = getCurrentTypes(selectParam, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY, true, false);
    expect(result).toContain(MemoryStatisticType.ARKTS_STATIC_HEAP);
    expect(result).toContain(MemoryStatisticType.DART_HEAP);
    expect(result).toContain(MemoryStatisticType.RN);
  });
});
