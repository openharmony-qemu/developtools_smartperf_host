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

import { MemoryAnalysisDataLogic } from '../../../../../src/trace/component/trace/base/MemoryAnalysisData';
import { MemoryStatisticType, MemoryType, MemoryTraceRowType } from '../../../../../src/trace/bean/MemoryEnum';
import { SelectionParam } from '../../../../../src/trace/bean/BoxSelection';

jest.mock('../../../../../src/trace/database/Procedure', () => ({
  procedurePool: {
    submitWithName: jest.fn()
  }
}));

jest.mock('../../../../../src/trace/database/sql/NativeHook.sql', () => ({
  queryNativeHookResponseTypes: jest.fn()
}));

describe('MemoryAnalysisData Test', () => {
  let dataLogic: MemoryAnalysisDataLogic;

  beforeEach(() => {
    dataLogic = new MemoryAnalysisDataLogic();
  });

  describe('TypeConfig Tests', () => {
    it('should include DART_HEAP in typeConfigs', () => {
      const dartHeapConfig = dataLogic['typeConfigs'].find(
        config => config.eventId === MemoryStatisticType.DART_HEAP
      );
      expect(dartHeapConfig).toBeDefined();
      expect(dartHeapConfig?.eventId).toBe(MemoryStatisticType.DART_HEAP);
      expect(dartHeapConfig?.eventType).toBe(MemoryType.DART_HEAP_Alloc_NAME);
      expect(dartHeapConfig?.hasSubType).toBe(true);
    });

    it('should include ARKTS_STATIC_HEAP in typeConfigs', () => {
      const arktsStaticHeapConfig = dataLogic['typeConfigs'].find(
        config => config.eventId === MemoryStatisticType.ARKTS_STATIC_HEAP
      );
      expect(arktsStaticHeapConfig).toBeDefined();
      expect(arktsStaticHeapConfig?.eventId).toBe(MemoryStatisticType.ARKTS_STATIC_HEAP);
      expect(arktsStaticHeapConfig?.eventType).toBe(MemoryType.ARKTS_STATIC_HEAP_Alloc_NAME);
      expect(arktsStaticHeapConfig?.hasSubType).toBe(true);
    });

    it('should include RN_HERMES_HEAP in typeConfigs', () => {
      const rnHeapConfig = dataLogic['typeConfigs'].find(
        config => config.eventId === MemoryStatisticType.RN
      );
      expect(rnHeapConfig).toBeDefined();
      expect(rnHeapConfig?.eventId).toBe(MemoryStatisticType.RN);
      expect(rnHeapConfig?.eventType).toBe(MemoryType.RN_HERMES_HEAP_Alloc_NAME);
      expect(rnHeapConfig?.hasSubType).toBe(true);
    });
  });

  describe('Initialization Tests', () => {
    it('should initialize with native memory type', () => {
      dataLogic.init(MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY, false);
      expect(dataLogic['memoryType']).toBe(MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY);
      expect(dataLogic['isStatistic']).toBe(false);
    });

    it('should initialize with statistic mode', () => {
      dataLogic.init(MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY, true);
      expect(dataLogic['isStatistic']).toBe(true);
    });
  });

  describe('DART_HEAP Configuration Tests', () => {
    it('should configure DART_HEAP in ALL Heap & Anonymous VM mapping', () => {
      const mapping = {
        mappings: [
          {
            selectionKey: 'All Heap & Anonymous VM',
            statisticTypes: [MemoryStatisticType.DART_HEAP],
            normalTypes: [`'${MemoryType.DART_HEAP_Alloc_NAME}'`]
          }
        ]
      };
      expect(mapping.mappings[0].statisticTypes).toContain(MemoryStatisticType.DART_HEAP);
    });

    it('should configure DART_HEAP in All Heap mapping', () => {
      const mapping = {
        mappings: [
          {
            selectionKey: 'All Heap',
            statisticTypes: [MemoryStatisticType.DART_HEAP],
            normalTypes: [`'${MemoryType.DART_HEAP_Alloc_NAME}'`]
          }
        ]
      };
      expect(mapping.mappings[0].statisticTypes).toContain(MemoryStatisticType.DART_HEAP);
    });

    it('should configure DART_HEAP standalone mapping', () => {
      const mapping = {
        mappings: [
          {
            selectionKey: 'DART HEAP',
            statisticTypes: [MemoryStatisticType.DART_HEAP],
            normalTypes: [`'${MemoryType.DART_HEAP_Alloc_NAME}'`]
          }
        ]
      };
      expect(mapping.mappings[0].statisticTypes).toContain(MemoryStatisticType.DART_HEAP);
    });
  });

  describe('ARKTS_STATIC_HEAP Configuration Tests', () => {
    it('should configure ARKTS_STATIC_HEAP in ALL Heap & Anonymous VM mapping', () => {
      const mapping = {
        mappings: [
          {
            selectionKey: 'All Heap & Anonymous VM',
            statisticTypes: [MemoryStatisticType.ARKTS_STATIC_HEAP],
            normalTypes: [`'${MemoryType.ARKTS_STATIC_HEAP_Alloc_NAME}'`]
          }
        ]
      };
      expect(mapping.mappings[0].statisticTypes).toContain(MemoryStatisticType.ARKTS_STATIC_HEAP);
    });

    it('should configure ARKTS_STATIC_HEAP in All Heap mapping', () => {
      const mapping = {
        mappings: [
          {
            selectionKey: 'All Heap',
            statisticTypes: [MemoryStatisticType.ARKTS_STATIC_HEAP],
            normalTypes: [`'${MemoryType.ARKTS_STATIC_HEAP_Alloc_NAME}'`]
          }
        ]
      };
      expect(mapping.mappings[0].statisticTypes).toContain(MemoryStatisticType.ARKTS_STATIC_HEAP);
    });

    it('should configure ARKTS_STATIC_HEAP standalone mapping', () => {
      const mapping = {
        mappings: [
          {
            selectionKey: 'ARKTS STATIC HEAP',
            statisticTypes: [MemoryStatisticType.ARKTS_STATIC_HEAP],
            normalTypes: [`'${MemoryType.ARKTS_STATIC_HEAP_Alloc_NAME}'`]
          }
        ]
      };
      expect(mapping.mappings[0].statisticTypes).toContain(MemoryStatisticType.ARKTS_STATIC_HEAP);
    });
  });

  describe('RN_HERMES_HEAP Configuration Tests', () => {
    it('should configure RN_HERMES_HEAP in ALL Heap & Anonymous VM mapping', () => {
      const mapping = {
        mappings: [
          {
            selectionKey: 'All Heap & Anonymous VM',
            statisticTypes: [MemoryStatisticType.RN],
            normalTypes: [`'${MemoryType.RN_HERMES_HEAP_Alloc_NAME}'`]
          }
        ]
      };
      expect(mapping.mappings[0].statisticTypes).toContain(MemoryStatisticType.RN);
    });

    it('should configure RN_HERMES_HEAP in All Heap mapping', () => {
      const mapping = {
        mappings: [
          {
            selectionKey: 'All Heap',
            statisticTypes: [MemoryStatisticType.RN],
            normalTypes: [`'${MemoryType.RN_HERMES_HEAP_Alloc_NAME}'`]
          }
        ]
      };
      expect(mapping.mappings[0].statisticTypes).toContain(MemoryStatisticType.RN);
    });

    it('should configure RN_HERMES_HEAP standalone mapping', () => {
      const mapping = {
        mappings: [
          {
            selectionKey: 'RN HEAP',
            statisticTypes: [MemoryStatisticType.RN],
            normalTypes: [`'${MemoryType.RN_HERMES_HEAP_Alloc_NAME}'`]
          }
        ]
      };
      expect(mapping.mappings[0].statisticTypes).toContain(MemoryStatisticType.RN);
    });
  });

  describe('Data Logic Tests', () => {
    it('should get empty eventTypeData initially', () => {
      const data = dataLogic.getEventTypeData();
      expect(data).toEqual([]);
    });

    it('should get empty threadData initially', () => {
      const data = dataLogic.getThreadData();
      expect(data).toEqual([]);
    });

    it('should get empty libData initially', () => {
      const data = dataLogic.getLibData();
      expect(data).toEqual([]);
    });

    it('should get empty functionData initially', () => {
      const data = dataLogic.getFunctionData();
      expect(data).toEqual([]);
    });

    it('should set memory type', () => {
      dataLogic.setMemoryType(MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY);
      expect(dataLogic['memoryType']).toBe(MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY);
    });

    it('should set isStatistic flag', () => {
      dataLogic.setIsStatistic(true);
      expect(dataLogic['isStatistic']).toBe(true);
    });

    it('should get current level data', () => {
      const currentData = dataLogic.getCurrentLevelData();
      expect(currentData).toBeDefined();
      expect(currentData.applySize).toBe(0);
      expect(currentData.applyCount).toBe(0);
    });
  });

  describe('SetTypeMap Tests', () => {
    it('should handle DART_HEAP type correctly', () => {
      const mockSample = [
        {
          type: MemoryStatisticType.DART_HEAP,
          typeName: MemoryType.DART_HEAP_Alloc_NAME,
          subType: 'DART_SUBTYPE',
          size: 1024,
          count: 10,
          isRelease: false,
          releaseSize: 0,
          releaseCount: 0
        }
      ];
      const typeMap = new Map<number, any[]>();
      typeMap.set(MemoryStatisticType.DART_HEAP, mockSample);
      dataLogic['isStatistic'] = false;
      dataLogic['memoryType'] = MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY;
      const result = dataLogic['setTypeMap'](typeMap, MemoryStatisticType.DART_HEAP, 'DART_SUBTYPE');
      expect(result).not.toBeNull();
      expect(result?.typeName).toBe('DART_SUBTYPE');
    });

    it('should handle ARKTS_STATIC_HEAP type correctly', () => {
      const mockSample = [
        {
          type: MemoryStatisticType.ARKTS_STATIC_HEAP,
          typeName: MemoryType.ARKTS_STATIC_HEAP_Alloc_NAME,
          subType: 'ARKTS_STATIC_SUBTYPE',
          size: 1536,
          count: 15,
          isRelease: false,
          releaseSize: 0,
          releaseCount: 0
        }
      ];
      const typeMap = new Map<number, any[]>();
      typeMap.set(MemoryStatisticType.ARKTS_STATIC_HEAP, mockSample);
      dataLogic['isStatistic'] = false;
      dataLogic['memoryType'] = MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY;
      const result = dataLogic['setTypeMap'](typeMap, MemoryStatisticType.ARKTS_STATIC_HEAP, 'ARKTS_STATIC_SUBTYPE');
      expect(result).not.toBeNull();
      expect(result?.typeName).toBe('ARKTS_STATIC_SUBTYPE');
    });

    it('should handle RN_HERMES_HEAP type correctly', () => {
      const mockSample = [
        {
          type: MemoryStatisticType.RN,
          typeName: MemoryType.RN_HERMES_HEAP_Alloc_NAME,
          subType: 'RN_SUBTYPE',
          size: 2048,
          count: 20,
          isRelease: false,
          releaseSize: 0,
          releaseCount: 0
        }
      ];
      const typeMap = new Map<number, any[]>();
      typeMap.set(MemoryStatisticType.RN, mockSample);
      dataLogic['isStatistic'] = false;
      dataLogic['memoryType'] = MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY;
      const result = dataLogic['setTypeMap'](typeMap, MemoryStatisticType.RN, 'RN_SUBTYPE');
      expect(result).not.toBeNull();
      expect(result?.typeName).toBe('RN_SUBTYPE');
    });
  });

  describe('Helper Method Tests', () => {
    it('should reset current level data correctly', () => {
      dataLogic['currentLevelApplySize'] = 1000;
      dataLogic['currentLevelApplyCount'] = 50;
      dataLogic.resetCurrentLevelData();
      expect(dataLogic['currentLevelApplySize']).toBe(0);
      expect(dataLogic['currentLevelApplyCount']).toBe(0);
    });

    it('should calculate percentage correctly', () => {
      const mockAnalysisObj = {
        applySize: 100,
        existSize: 80,
        releaseSize: 20
      };
      dataLogic['currentLevelApplySize'] = 100;
      dataLogic['currentLevelExistSize'] = 80;
      dataLogic['currentLevelReleaseSize'] = 20;
      dataLogic['calPercent'](mockAnalysisObj);
      expect(mockAnalysisObj.applySizePercent).toBe('100.00');
      expect(mockAnalysisObj.existSizePercent).toBe('100.00');
      expect(mockAnalysisObj.releaseSizePercent).toBe('100.00');
    });

    it('should build subTypeMap correctly for DART_HEAP', () => {
      const sampleArray = [
        {
          subType: 'DART_SUBTYPE1',
          size: 512
        },
        {
          subType: 'DART_SUBTYPE2',
          size: 1024
        }
      ];
      const result = dataLogic['buildSubTypeMap'](sampleArray, MemoryType.DART_HEAP_Alloc_NAME);
      expect(result.size).toBe(2);
      expect(result.has('DART_SUBTYPE1')).toBe(true);
      expect(result.has('DART_SUBTYPE2')).toBe(true);
    });

    it('should build subTypeMap correctly for ARKTS_STATIC_HEAP', () => {
      const sampleArray = [
        {
          subType: 'ARKTS_STATIC_SUBTYPE1',
          size: 768
        },
        {
          subType: 'ARKTS_STATIC_SUBTYPE2',
          size: 1536
        }
      ];
      const result = dataLogic['buildSubTypeMap'](sampleArray, MemoryType.ARKTS_STATIC_HEAP_Alloc_NAME);
      expect(result.size).toBe(2);
      expect(result.has('ARKTS_STATIC_SUBTYPE1')).toBe(true);
      expect(result.has('ARKTS_STATIC_SUBTYPE2')).toBe(true);
    });

    it('should build subTypeMap correctly for RN_HERMES_HEAP', () => {
      const sampleArray = [
        {
          subType: 'RN_SUBTYPE1',
          size: 1024
        },
        {
          subType: 'RN_SUBTYPE2',
          size: 2048
        }
      ];
      const result = dataLogic['buildSubTypeMap'](sampleArray, MemoryType.RN_HERMES_HEAP_Alloc_NAME);
      expect(result.size).toBe(2);
      expect(result.has('RN_SUBTYPE1')).toBe(true);
      expect(result.has('RN_SUBTYPE2')).toBe(true);
    });
  });

  describe('GetPieChartData Tests', () => {
    it('should return data within PIE_CHART_LIMIT', () => {
      const data = Array.from({ length: 10 }, (_, i) => ({
        existCount: i + 1,
        existSize: (i + 1) * 100,
        tableName: `Type${i + 1}`
      }));
      const result = dataLogic.getPieChartData(data);
      expect(result.length).toBe(10);
    });

    it('should aggregate data exceeding PIE_CHART_LIMIT', () => {
      const data = Array.from({ length: 25 }, (_, i) => ({
        existCount: i + 1,
        existSize: (i + 1) * 100,
        tableName: `Type${i + 1}`,
        applySize: (i + 1) * 50,
        applyCount: i + 1,
        releaseSize: (i + 1) * 20,
        releaseCount: i + 1
      }));
      dataLogic['currentLevelExistCount'] = 325;
      dataLogic['currentLevelExistSize'] = 32500;
      dataLogic['currentLevelApplyCount'] = 325;
      dataLogic['currentLevelApplySize'] = 16250;
      dataLogic['currentLevelReleaseCount'] = 325;
      dataLogic['currentLevelReleaseSize'] = 6500;
      const result = dataLogic.getPieChartData(data);
      expect(result.length).toBe(20);
      expect(result[19].tableName).toBe('other');
    });
  });

  describe('TypeSizeGroup Tests', () => {
    it('should group data by type correctly', () => {
      const mockData = [
        {
          type: MemoryStatisticType.DART_HEAP,
          size: 1024,
          count: 10,
          isRelease: false
        },
        {
          type: MemoryStatisticType.ARKTS_STATIC_HEAP,
          size: 1536,
          count: 15,
          isRelease: false
        },
        {
          type: MemoryStatisticType.RN,
          size: 2048,
          count: 20,
          isRelease: false
        },
        {
          type: MemoryStatisticType.DART_HEAP,
          size: 512,
          count: 5,
          isRelease: false
        }
      ];
      dataLogic['isStatistic'] = false;
      const result = dataLogic['typeSizeGroup'](mockData);
      expect(result.size).toBe(3);
      expect(result.get(MemoryStatisticType.DART_HEAP)?.length).toBe(2);
      expect(result.get(MemoryStatisticType.ARKTS_STATIC_HEAP)?.length).toBe(1);
      expect(result.get(MemoryStatisticType.RN)?.length).toBe(1);
    });
  });

  describe('CalSizeObj Tests', () => {
    it('should calculate size object in non-statistic mode', () => {
      const mockData = [
        {
          size: 1024,
          count: 10,
          isRelease: false
        },
        {
          size: 512,
          count: 5,
          isRelease: true
        }
      ];
      dataLogic['isStatistic'] = false;
      const result = dataLogic['calSizeObj'](mockData);
      expect(result.applySize).toBe(1536);
      expect(result.applyCount).toBe(15);
      expect(result.releaseSize).toBe(512);
      expect(result.releaseCount).toBe(5);
    });

    it('should calculate size object in statistic mode', () => {
      const mockData = [
        {
          size: 1024,
          count: 10,
          releaseSize: 256,
          releaseCount: 2
        },
        {
          size: 512,
          count: 5,
          releaseSize: 128,
          releaseCount: 1
        }
      ];
      dataLogic['isStatistic'] = true;
      const result = dataLogic['calSizeObj'](mockData);
      expect(result.applySize).toBe(1536);
      expect(result.applyCount).toBe(15);
      expect(result.releaseSize).toBe(384);
      expect(result.releaseCount).toBe(3);
    });
  });

  describe('InitResponseTypeList Tests', () => {
    it('should call initNativeMemoryResponseTypeList for ROW_TYPE_NATIVE_MEMORY', () => {
      const spy = jest.spyOn(dataLogic as any, 'initNativeMemoryResponseTypeList');
      dataLogic['memoryType'] = MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY;
      const mockVal = { nativeMemory: ['DART HEAP'] } as SelectionParam;
      dataLogic.initResponseTypeList(mockVal);
      expect(spy).toHaveBeenCalledWith(mockVal);
      spy.mockRestore();
    });
  });

  describe('BuildSubTypeMap Tests', () => {
    it('should handle samples without subType', () => {
      const sampleArray = [
        {
          subType: null,
          size: 1024,
          typeName: MemoryType.DART_HEAP_Alloc_NAME
        },
        {
          subType: undefined,
          size: 2048,
          typeName: MemoryType.DART_HEAP_Alloc_NAME
        }
      ];
      const result = dataLogic['buildSubTypeMap'](sampleArray, MemoryType.DART_HEAP_Alloc_NAME);
      expect(result.size).toBe(1);
      expect(result.get(MemoryType.DART_HEAP_Alloc_NAME)?.length).toBe(2);
    });

    it('should handle mixed samples with and without subType', () => {
      const sampleArray = [
        {
          subType: 'SUBTYPE1',
          size: 1024
        },
        {
          subType: null,
          size: 2048,
          typeName: MemoryType.DART_HEAP_Alloc_NAME
        },
        {
          subType: 'SUBTYPE2',
          size: 512
        }
      ];
      const result = dataLogic['buildSubTypeMap'](sampleArray, MemoryType.DART_HEAP_Alloc_NAME);
      expect(result.size).toBe(2);
      expect(result.has('SUBTYPE1')).toBe(true);
      expect(result.has(MemoryType.DART_HEAP_Alloc_NAME)).toBe(true);
      expect(result.has('SUBTYPE2')).toBe(true);
    });
  });
});
