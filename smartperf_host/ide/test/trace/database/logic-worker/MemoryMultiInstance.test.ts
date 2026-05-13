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
  queryNativeHookEventSql,
  queryStatisticCallChainsSamplesSql,
  statisticCallChainsSamplesConfig,
  eventConfigMap,
  getFilterType,
} from '../../../src/trace/database/logic-worker/MemoryMultiInstance';
import { MemoryTraceRowType, MemoryBasicType, MemoryStatisticType, MemoryType } from '../../../src/trace/bean/MemoryEnum';
import { NativeHookStatistics, NativeMemory, StatisticsSelection } from '../../../src/trace/database/logic-worker/ProcedureLogicWorkerNativeNemory';

jest.mock('../../../../src/trace/component/trace/base/TraceRow', () => {
  return {};
});

describe('MemoryMultiInstance Test', () => {
  it('StatististicCallChainsSamplesConfigTest01', function () {
    const config = statisticCallChainsSamplesConfig[MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY];
    expect(config).toBeDefined();
    expect(config!.caseStatement).toContain(`when type = ${MemoryStatisticType.DART_HEAP} then '${MemoryType.DART_HEAP_Alloc_NAME}'`);
    expect(config!.caseStatement).toContain(`when type = ${MemoryStatisticType.ARKTS_STATIC_HEAP} then '${MemoryType.ARKTS_STATIC_HEAP_Alloc_NAME}'`);
    expect(config!.caseStatement).toContain(`when type = ${MemoryStatisticType.RN} then '${MemoryType.RN_HERMES_HEAP_Alloc_NAME}'`);
  });

  it('MemoryBasicTypeTest02', function () {
    expect(MemoryBasicType.NATIVE_MEMORY[5]).toEqual('Dart Heap');
    expect(MemoryBasicType.NATIVE_MEMORY[6]).toEqual('Arkts Static Heap');
    expect(MemoryBasicType.NATIVE_MEMORY[7]).toEqual('RN Heap');
  });

  it('MemoryTypeConstantsTest03', function () {
    expect(MemoryType.DART_HEAP_Alloc_NAME).toEqual('DART_HEAP_Alloc_Event');
    expect(MemoryType.ARKTS_STATIC_HEAP_Alloc_NAME).toEqual('ARKTS_STATIC_HEAP_Alloc_Event');
    expect(MemoryType.RN_HERMES_HEAP_Alloc_NAME).toEqual('RN_HERMES_HEAP_Alloc_Event');
    expect(MemoryType.DART_HEAP_Free_NAME).toEqual('DART_HEAP_Free_Event');
    expect(MemoryType.ARKTS_STATIC_HEAP_Free_NAME).toEqual('ARKTS_STATIC_HEAP_Free_Event');
    expect(MemoryType.RN_HERMES_HEAP_Free_NAME).toEqual('RN_HERMES_HEAP_Free_Event');
  });

  it('MemoryStatisticTypeTest04', function () {
    expect(MemoryStatisticType.DART_HEAP).toEqual(20);
    expect(MemoryStatisticType.ARKTS_STATIC_HEAP).toEqual(21);
    expect(MemoryStatisticType.RN).toEqual(13);
  });

  it('QueryNativeHookEventSqlTest05', function () {
    const sql = queryNativeHookEventSql(0, 1000, 'native_hook', 1, '', new Map());
    expect(sql).toContain('select');
    expect(sql).toContain('from');
    expect(sql).toContain('where');
  });

  it('QueryStatisticCallChainsSamplesSqlTest06', function () {
    const selectTypeCase = statisticCallChainsSamplesConfig[MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY]!.caseStatement;
    const sql = queryStatisticCallChainsSamplesSql(0, 1000, 'native_hook_statistic', 1, '', selectTypeCase);
    expect(sql).toContain('select');
    expect(sql).toContain('from');
    expect(sql).toContain('where');
  });

  it('EventConfigMapTest07', function () {
    expect(eventConfigMap[MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY]).toBeDefined();
    expect(eventConfigMap[MemoryTraceRowType.ROW_TYPE_GPU_MEMORY]).toBeDefined();
    expect(eventConfigMap[MemoryTraceRowType.ROW_TYPE_OTHER_SOURCE]).toBeDefined();
  });

  it('GetFilterTypeDartHeapAllocTest08', function () {
    const item: NativeMemory = {
      index: 0,
      eventId: 0,
      eventType: 'DART_HEAP_Alloc_Event',
      subType: '',
      addr: '0x123456',
      startTs: 0,
      timestamp: '',
      heapSize: 1024,
      heapSizeUnit: 'Bytes',
      symbol: 'test_symbol',
      library: 'test_lib',
      isSelected: false,
    };
    const result = getFilterType('Dart Heap', item, [], MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY, false);
    expect(result).toBe(true);
  });

  it('GetFilterTypeRNHeapAllocTest09', function () {
    const item: NativeMemory = {
      index: 0,
      eventId: 0,
      eventType: 'RN_HERMES_HEAP_Alloc_Event',
      subType: '',
      addr: '0x123456',
      startTs: 0,
      timestamp: '',
      heapSize: 1024,
      heapSizeUnit: 'Bytes',
      symbol: 'test_symbol',
      library: 'test_lib',
      isSelected: false,
    };
    const result = getFilterType('RN Heap', item, [], MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY, false);
    expect(result).toBe(true);
  });

  it('GetFilterTypeDartHeapFreeTest10', function () {
    const item: NativeMemory = {
      index: 0,
      eventId: 0,
      eventType: 'DART_HEAP_Free_Event',
      subType: '',
      addr: '0x123456',
      startTs: 0,
      timestamp: '',
      heapSize: 1024,
      heapSizeUnit: 'Bytes',
      symbol: 'test_symbol',
      library: 'test_lib',
      isSelected: false,
    };
    const result = getFilterType('Dart Heap', item, [], MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY, false);
    expect(result).toBe(true);
  });

  it('GetFilterTypeRNHeapFreeTest11', function () {
    const item: NativeMemory = {
      index: 0,
      eventId: 0,
      eventType: 'RN_HERMES_HEAP_Free_Event',
      subType: '',
      addr: '0x123456',
      startTs: 0,
      timestamp: '',
      heapSize: 1024,
      heapSizeUnit: 'Bytes',
      symbol: 'test_symbol',
      library: 'test_lib',
      isSelected: false,
    };
    const result = getFilterType('RN Heap', item, [], MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY, false);
    expect(result).toBe(true);
  });

  it('GetFilterTypeDartHeapStatisticModeTest12', function () {
    const item: NativeHookStatistics = {
      eventId: 0,
      eventType: '',
      subType: '',
      subTypeId: 0,
      heapSize: 1024,
      addr: '0x123456',
      startTs: 0,
      endTs: 1000,
      sumHeapSize: 1024,
      max: 2048,
      count: 10,
      tid: 1,
      threadName: 'test_thread',
      sSelected: false,
    };
    const result = getFilterType('Dart Heap', item, [], MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY, true);
    expect(result).toBe(true);
  });

  it('GetFilterTypeRNHeapStatisticModeTest13', function () {
    const item: NativeHookStatistics = {
      eventId: 0,
      eventType: '',
      subType: '',
      subTypeId: 0,
      heapSize: 1024,
      addr: '0x123456',
      startTs: 0,
      endTs: 1000,
      sumHeapSize: 1024,
      max: 2048,
      count: 10,
      tid: 1,
      threadName: 'test_thread',
      sSelected: false,
    };
    const result = getFilterType('RN Heap', item, [], MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY, true);
    expect(result).toBe(true);
  });

  it('GetFilterTypeInvalidDartHeapTest14', function () {
    const item: NativeMemory = {
      index: 0,
      eventId: 0,
      eventType: 'JS_HEAP_Alloc_Event',
      subType: '',
      addr: '0x123456',
      startTs: 0,
      timestamp: '',
      heapSize: 1024,
      heapSizeUnit: 'Bytes',
      symbol: 'test_symbol',
      library: 'test_lib',
      isSelected: false,
    };
    const result = getFilterType('Dart Heap', item, [], MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY, false);
    expect(result).toBe(false);
  });

  it('GetFilterTypeInvalidRNHeapTest15', function () {
    const item: NativeMemory = {
      index: 0,
      eventId: 0,
      eventType: 'ARKTS_HEAP_Alloc_Event',
      subType: '',
      addr: '0x123456',
      startTs: 0,
      timestamp: '',
      heapSize: 1024,
      heapSizeUnit: 'Bytes',
      symbol: 'test_symbol',
      library: 'test_lib',
      isSelected: false,
    };
    const result = getFilterType('RN Heap', item, [], MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY, false);
    expect(result).toBe(false);
  });

  it('GetFilterTypeArktsStaticHeapAllocTest16', function () {
    const item: NativeMemory = {
      index: 0,
      eventId: 0,
      eventType: 'ARKTS_STATIC_HEAP_Alloc_Event',
      hasSubType: 0,
      subType: '',
      subTypeId: 0,
      addr: '0x123456',
      startTs: 0,
      endTs: 0,
      heapSize: 1024,
      symbol: 'test_symbol',
      library: 'test_lib',
      lastLibId: 0,
      lastSymbolId: 0,
      isSelected: false,
      threadId: 0,
    };
    const result = getFilterType('Arkts Static Heap', item, [], MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY, false);
    expect(result).toBe(true);
  });

  it('GetFilterTypeArktsStaticHeapFreeTest17', function () {
    const item: NativeMemory = {
      index: 0,
      eventId: 0,
      eventType: 'ARKTS_STATIC_HEAP_Free_Event',
      hasSubType: 0,
      subType: '',
      subTypeId: 0,
      addr: '0x123456',
      startTs: 0,
      endTs: 0,
      heapSize: 1024,
      symbol: 'test_symbol',
      library: 'test_lib',
      lastLibId: 0,
      lastSymbolId: 0,
      isSelected: false,
      threadId: 0,
    };
    const result = getFilterType('Arkts Static Heap', item, [], MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY, false);
    expect(result).toBe(true);
  });

  it('GetFilterTypeArktsStaticHeapStatisticModeTest18', function () {
    const item: NativeHookStatistics = {
      id: 0,
      type: 21,
      eventId: 0,
      eventType: '',
      hasSubType: 0,
      subType: '',
      subTypeId: 0,
      heapSize: 1024,
      freeSize: 0,
      addr: '0x123456',
      startTs: 0,
      endTs: 1000,
      sumHeapSize: 1024,
      max: 2048,
      count: 10,
      freeCount: 0,
      tid: 1,
      threadName: 'test_thread',
      lastLibId: 0,
      lastSymbolId: 0,
      isSelected: false,
      tsArray: [],
      countArray: [],
    };
    const result = getFilterType('Arkts Static Heap', item, [], MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY, true);
    expect(result).toBe(true);
  });

  it('GetFilterTypeInvalidArktsStaticHeapTest19', function () {
    const item: NativeMemory = {
      index: 0,
      eventId: 0,
      eventType: 'JS_HEAP_Alloc_Event',
      hasSubType: 0,
      subType: '',
      subTypeId: 0,
      addr: '0x123456',
      startTs: 0,
      endTs: 0,
      heapSize: 1024,
      symbol: 'test_symbol',
      library: 'test_lib',
      lastLibId: 0,
      lastSymbolId: 0,
      isSelected: false,
      threadId: 0,
    };
    const result = getFilterType('Arkts Static Heap', item, [], MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY, false);
    expect(result).toBe(false);
  });
});
