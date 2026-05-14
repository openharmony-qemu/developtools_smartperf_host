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
import { AnalysisSample, AnalysisObj, SizeObj } from '../../../src/trace/bean/MemoryAnalysisStruct';
import { MemoryStatisticType, MemoryType, MemoryTraceRowType } from '../../../src/trace/bean/MemoryEnum';

describe('MemoryAnalysisStruct Test - ARKTS_STATIC_HEAP', () => {
  describe('AnalysisSample - ARKTS_STATIC_HEAP Alloc Event', () => {
    it('should initialize ARKTS_STATIC_HEAP alloc event with type 21 using MemoryStatisticType', () => {
      const sample = new AnalysisSample(1, 1024, 1, MemoryStatisticType.ARKTS_STATIC_HEAP, 1000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY);
      
      expect(sample.type).toBe(21);
      expect(sample.typeName).toBe(MemoryType.ARKTS_STATIC_HEAP_Alloc_NAME);
      expect(sample.isRelease).toBe(false);
    });

    it('should initialize ARKTS_STATIC_HEAP alloc event with type 21 using MemoryType Alloc Name', () => {
      const sample = new AnalysisSample(1, 1024, 1, MemoryType.ARKTS_STATIC_HEAP_Alloc_NAME, 1000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY);
      
      expect(sample.type).toBe(21);
      expect(sample.typeName).toBe(MemoryType.ARKTS_STATIC_HEAP_Alloc_NAME);
      expect(sample.isRelease).toBe(false);
    });

    it('should set correct properties for ARKTS_STATIC_HEAP alloc event', () => {
      const sample = new AnalysisSample(1, 2048, 2, MemoryStatisticType.ARKTS_STATIC_HEAP, 1000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY);
      
      expect(sample.id).toBe(1);
      expect(sample.size).toBe(2048);
      expect(sample.count).toBe(2);
      expect(sample.startTs).toBe(1000);
      expect(sample.isRelease).toBe(false);
      expect(sample.type).toBe(21);
    });
  });

  describe('AnalysisSample - ARKTS_STATIC_HEAP Free Event', () => {
    it('should initialize ARKTS_STATIC_HEAP free event with type 21', () => {
      const sample = new AnalysisSample(1, 1024, 1, MemoryType.ARKTS_STATIC_HEAP_Free_NAME, 1000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY);
      
      expect(sample.type).toBe(21);
      expect(sample.typeName).toBe(MemoryType.ARKTS_STATIC_HEAP_Free_NAME);
      expect(sample.isRelease).toBe(true);
    });

    it('should set correct properties for ARKTS_STATIC_HEAP free event', () => {
      const sample = new AnalysisSample(2, 1024, 1, MemoryType.ARKTS_STATIC_HEAP_Free_NAME, 2000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY);
      
      expect(sample.id).toBe(2);
      expect(sample.size).toBe(1024);
      expect(sample.count).toBe(1);
      expect(sample.startTs).toBe(2000);
      expect(sample.isRelease).toBe(true);
      expect(sample.type).toBe(21);
    });
  });

  describe('AnalysisSample - Other Memory Types (Regression)', () => {
    it('should initialize DART_HEAP alloc event with type 20', () => {
      const sample = new AnalysisSample(1, 1024, 1, MemoryStatisticType.DART_HEAP, 1000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY);
      
      expect(sample.type).toBe(20);
      expect(sample.typeName).toBe(MemoryType.DART_HEAP_Alloc_NAME);
      expect(sample.isRelease).toBe(false);
    });

    it('should initialize RN_HERMES_HEAP alloc event with type 13', () => {
      const sample = new AnalysisSample(1, 1024, 1, MemoryStatisticType.RN, 1000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY);
      
      expect(sample.type).toBe(13);
      expect(sample.typeName).toBe(MemoryType.RN_HERMES_HEAP_Alloc_NAME);
      expect(sample.isRelease).toBe(false);
    });

    it('should initialize ARKTS alloc event with type 10', () => {
      const sample = new AnalysisSample(1, 1024, 1, MemoryStatisticType.ARKTS, 1000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY);
      
      expect(sample.type).toBe(10);
      expect(sample.typeName).toBe(MemoryType.ARKTS_Alloc_NAME);
      expect(sample.isRelease).toBe(false);
    });

    it('should initialize JS alloc event with type 11', () => {
      const sample = new AnalysisSample(1, 1024, 1, MemoryStatisticType.JS, 1000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY);
      
      expect(sample.type).toBe(11);
      expect(sample.typeName).toBe(MemoryType.JS_Alloc_NAME);
      expect(sample.isRelease).toBe(false);
    });

    it('should initialize MALLOC event with type 0', () => {
      const sample = new AnalysisSample(1, 1024, 1, MemoryStatisticType.MALLOC, 1000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY);
      
      expect(sample.type).toBe(0);
      expect(sample.typeName).toBe(MemoryType.MEMORY_M_ALLOC_NAME);
      expect(sample.isRelease).toBe(false);
    });

    it('should initialize KMP alloc event with type 12', () => {
      const sample = new AnalysisSample(1, 1024, 1, MemoryStatisticType.KMP, 1000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY);
      
      expect(sample.type).toBe(12);
      expect(sample.typeName).toBe(MemoryType.KMP_Alloc_NAME);
      expect(sample.isRelease).toBe(false);
    });
  });

  describe('AnalysisObj', () => {
    it('should calculate exist size and count correctly', () => {
      const analysisObj = new AnalysisObj(1000, 10, 300, 3);
      
      expect(analysisObj.applySize).toBe(1000);
      expect(analysisObj.applyCount).toBe(10);
      expect(analysisObj.releaseSize).toBe(300);
      expect(analysisObj.releaseCount).toBe(3);
      expect(analysisObj.existSize).toBe(700);
      expect(analysisObj.existCount).toBe(7);
    });

    it('should format byte sizes correctly', () => {
      const analysisObj1 = new AnalysisObj(1024, 1, 0, 0);
      expect(analysisObj1.applySizeFormat).toContain('KB');
      
      const analysisObj2 = new AnalysisObj(1024 * 1024, 1, 0, 0);
      expect(analysisObj2.applySizeFormat).toContain('MB');
      
      const analysisObj3 = new AnalysisObj(1024 * 1024 * 1024, 1, 0, 0);
      expect(analysisObj3.applySizeFormat).toContain('GB');
    });
  });

  describe('SizeObj', () => {
    it('should initialize with zero values', () => {
      const sizeObj = new SizeObj();
      
      expect(sizeObj.applySize).toBe(0);
      expect(sizeObj.applyCount).toBe(0);
      expect(sizeObj.releaseSize).toBe(0);
      expect(sizeObj.releaseCount).toBe(0);
    });

    it('should allow setting values', () => {
      const sizeObj = new SizeObj();
      sizeObj.applySize = 1000;
      sizeObj.applyCount = 10;
      sizeObj.releaseSize = 300;
      sizeObj.releaseCount = 3;
      
      expect(sizeObj.applySize).toBe(1000);
      expect(sizeObj.applyCount).toBe(10);
      expect(sizeObj.releaseSize).toBe(300);
      expect(sizeObj.releaseCount).toBe(3);
    });
  });

  describe('AnalysisSample - Invalid Type', () => {
    it('should set type to -1 for invalid memory type', () => {
      const sample = new AnalysisSample(1, 1024, 1, 'INVALID_TYPE', 1000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY);
      
      expect(sample.type).toBe(-1);
      expect(sample.isRelease).toBe(false);
    });
  });

  describe('ARKTS_STATIC_HEAP Advanced Tests', () => {
    it('should handle ARKTS_STATIC_HEAP with large size values', () => {
      const sample = new AnalysisSample(1, 1024 * 1024 * 1024, 100, MemoryStatisticType.ARKTS_STATIC_HEAP, 1000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY);

      expect(sample.type).toBe(21);
      expect(sample.size).toBe(1024 * 1024 * 1024);
      expect(sample.count).toBe(100);
      expect(sample.isRelease).toBe(false);
    });

    it('should handle ARKTS_STATIC_HEAP with zero count', () => {
      const sample = new AnalysisSample(1, 1024, 0, MemoryStatisticType.ARKTS_STATIC_HEAP, 1000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY);

      expect(sample.type).toBe(21);
      expect(sample.size).toBe(1024);
      expect(sample.count).toBe(0);
      expect(sample.isRelease).toBe(false);
    });

    it('should handle ARKTS_STATIC_HEAP with very large timestamp', () => {
      const sample = new AnalysisSample(1, 1024, 1, MemoryStatisticType.ARKTS_STATIC_HEAP, Number.MAX_SAFE_INTEGER, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY);

      expect(sample.type).toBe(21);
      expect(sample.startTs).toBe(Number.MAX_SAFE_INTEGER);
      expect(sample.isRelease).toBe(false);
    });
  });

  describe('Type Comparison Tests', () => {
    it('should have unique type values for different heap types', () => {
      const arktsStaticHeap = new AnalysisSample(1, 1024, 1, MemoryStatisticType.ARKTS_STATIC_HEAP, 1000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY);
      const dartHeap = new AnalysisSample(2, 1024, 1, MemoryStatisticType.DART_HEAP, 1000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY);
      const rnHeap = new AnalysisSample(3, 1024, 1, MemoryStatisticType.RN, 1000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY);
      const arktsHeap = new AnalysisSample(4, 1024, 1, MemoryStatisticType.ARKTS, 1000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY);
      const jsHeap = new AnalysisSample(5, 1024, 1, MemoryStatisticType.JS, 1000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY);

      expect(arktsStaticHeap.type).toBe(21);
      expect(dartHeap.type).toBe(20);
      expect(rnHeap.type).toBe(13);
      expect(arktsHeap.type).toBe(10);
      expect(jsHeap.type).toBe(11);

      expect(arktsStaticHeap.type).not.toBe(dartHeap.type);
      expect(arktsStaticHeap.type).not.toBe(rnHeap.type);
      expect(dartHeap.type).not.toBe(rnHeap.type);
    });

    it('should have same type for alloc and free of ARKTS_STATIC_HEAP', () => {
      const alloc = new AnalysisSample(1, 1024, 1, MemoryType.ARKTS_STATIC_HEAP_Alloc_NAME, 1000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY);
      const free = new AnalysisSample(2, 1024, 1, MemoryType.ARKTS_STATIC_HEAP_Free_Name, 2000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY);

      expect(alloc.type).toBe(free.type);
      expect(alloc.isRelease).toBe(false);
      expect(free.isRelease).toBe(true);
    });

    it('should have same type for event name and statistic type', () => {
      const eventSample = new AnalysisSample(1, 1024, 1, MemoryType.ARKTS_STATIC_HEAP_Alloc_NAME, 1000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY);
      const statisticSample = new AnalysisSample(2, 1024, 1, MemoryStatisticType.ARKTS_STATIC_HEAP, 1000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY);

      expect(eventSample.type).toBe(statisticSample.type);
      expect(eventSample.typeName).toBe(statisticSample.typeName);
    });
  });

  describe('Mixed Memory Analysis', () => {
    it('should handle analysis with multiple heap types', () => {
      const samples = [
        new AnalysisSample(1, 1024, 10, MemoryStatisticType.DART_HEAP, 1000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY),
        new AnalysisSample(2, 2048, 20, MemoryStatisticType.ARKTS_STATIC_HEAP, 2000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY),
        new AnalysisSample(3, 512, 5, MemoryStatisticType.RN, 3000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY),
        new AnalysisSample(4, 1024, 10, MemoryStatisticType.ARKTS, 4000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY),
        new AnalysisSample(5, 512, 5, MemoryStatisticType.JS, 5000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY),
      ];

      expect(samples[0].type).toBe(20);
      expect(samples[1].type).toBe(21);
      expect(samples[2].type).toBe(13);
      expect(samples[3].type).toBe(10);
      expect(samples[4].type).toBe(11);

      expect(samples[0].isRelease).toBe(false);
      expect(samples[1].isRelease).toBe(false);
      expect(samples[2].isRelease).toBe(false);
      expect(samples[3].isRelease).toBe(false);
      expect(samples[4].isRelease).toBe(false);
    });

    it('should handle analysis with mixed alloc and free events', () => {
      const samples = [
        new AnalysisSample(1, 1024, 10, MemoryType.ARKTS_STATIC_HEAP_Alloc_NAME, 1000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY),
        new AnalysisSample(2, 512, 5, MemoryType.ARKTS_STATIC_HEAP_Free_NAME, 2000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY),
        new AnalysisSample(3, 2048, 20, MemoryType.DART_HEAP_Alloc_NAME, 3000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY),
        new AnalysisSample(4, 1024, 10, MemoryType.DART_HEAP_Free_NAME, 4000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY),
      ];

      expect(samples[0].type).toBe(21);
      expect(samples[1].type).toBe(21);
      expect(samples[2].type).toBe(20);
      expect(samples[3].type).toBe(20);

      expect(samples[0].isRelease).toBe(false);
      expect(samples[1].isRelease).toBe(true);
      expect(samples[2].isRelease).toBe(false);
      expect(samples[3].isRelease).toBe(true);
    });
  });

  describe('AnalysisObj Advanced Tests', () => {
    it('should calculate correct values with zero release', () => {
      const analysisObj = new AnalysisObj(1000, 10, 0, 0);

      expect(analysisObj.applySize).toBe(1000);
      expect(analysisObj.applyCount).toBe(10);
      expect(analysisObj.releaseSize).toBe(0);
      expect(analysisObj.releaseCount).toBe(0);
      expect(analysisObj.existSize).toBe(1000);
      expect(analysisObj.existCount).toBe(10);
    });

    it('should calculate correct values when release exceeds apply', () => {
      const analysisObj = new AnalysisObj(1000, 10, 1500, 15);

      expect(analysisObj.applySize).toBe(1000);
      expect(analysisObj.applyCount).toBe(10);
      expect(analysisObj.releaseSize).toBe(1500);
      expect(analysisObj.releaseCount).toBe(15);
      expect(analysisObj.existSize).toBe(-500);
      expect(analysisObj.existCount).toBe(-5);
    });

    it('should format negative byte sizes correctly', () => {
      const analysisObj = new AnalysisObj(1000, 10, 1500, 15);

      expect(analysisObj.existSizeFormat).toContain('-');
    });

    it('should format large byte sizes correctly', () => {
      const analysisObj1 = new AnalysisObj(1024, 1, 0, 0);
      expect(analysisObj1.applySizeFormat).toContain('KB');

      const analysisObj2 = new AnalysisObj(1024 * 1024, 1, 0, 0);
      expect(analysisObj2.applySizeFormat).toContain('MB');

      const analysisObj3 = new AnalysisObj(1024 * 1024 * 1024, 1, 0, 0);
      expect(analysisObj3.applySizeFormat).toContain('GB');
    });

    it('should handle zero values in formatting', () => {
      const analysisObj = new AnalysisObj(0, 0, 0, 0);

      expect(analysisObj.applySize).toBe(0);
      expect(analysisObj.applyCount).toBe(0);
      expect(analysisObj.releaseSize).toBe(0);
      expect(analysisObj.releaseCount).toBe(0);
      expect(analysisObj.existSize).toBe(0);
      expect(analysisObj.existCount).toBe(0);
    });
  });

  describe('SizeObj Advanced Tests', () => {
    it('should handle large values correctly', () => {
      const sizeObj = new SizeObj();
      sizeObj.applySize = Number.MAX_SAFE_INTEGER;
      sizeObj.applyCount = Number.MAX_SAFE_INTEGER;
      sizeObj.releaseSize = Number.MAX_SAFE_INTEGER;
      sizeObj.releaseCount = Number.MAX_SAFE_INTEGER;

      expect(sizeObj.applySize).toBe(Number.MAX_SAFE_INTEGER);
      expect(sizeObj.applyCount).toBe(Number.MAX_SAFE_INTEGER);
      expect(sizeObj.releaseSize).toBe(Number.MAX_SAFE_INTEGER);
      expect(sizeObj.releaseCount).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle negative values', () => {
      const sizeObj = new SizeObj();
      sizeObj.applySize = -1000;
      sizeObj.applyCount = -10;
      sizeObj.releaseSize = -300;
      sizeObj.releaseCount = -3;

      expect(sizeObj.applySize).toBe(-1000);
      expect(sizeObj.applyCount).toBe(-10);
      expect(sizeObj.releaseSize).toBe(-300);
      expect(sizeObj.releaseCount).toBe(-3);
    });

    it('should maintain independence between multiple SizeObj instances', () => {
      const sizeObj1 = new SizeObj();
      const sizeObj2 = new SizeObj();

      sizeObj1.applySize = 1000;
      sizeObj2.applySize = 2000;

      expect(sizeObj1.applySize).toBe(1000);
      expect(sizeObj2.applySize).toBe(2000);

      sizeObj1.releaseSize = 300;
      sizeObj2.releaseSize = 400;

      expect(sizeObj1.releaseSize).toBe(300);
      expect(sizeObj2.releaseSize).toBe(400);
    });
  });

  describe('Edge Cases', () => {
    it('should handle ARKTS_STATIC_HEAP with negative size', () => {
      const sample = new AnalysisSample(1, -1024, 1, MemoryStatisticType.ARKTS_STATIC_HEAP, 1000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY);

      expect(sample.type).toBe(21);
      expect(sample.size).toBe(-1024);
      expect(sample.isRelease).toBe(false);
    });

    it('should handle ARKTS_STATIC_HEAP with negative count', () => {
      const sample = new AnalysisSample(1, 1024, -10, MemoryStatisticType.ARKTS_STATIC_HEAP, 1000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY);

      expect(sample.type).toBe(21);
      expect(sample.size).toBe(1024);
      expect(sample.count).toBe(-10);
      expect(sample.isRelease).toBe(false);
    });

    it('should handle ARKTS_STATIC_HEAP with timestamp zero', () => {
      const sample = new AnalysisSample(1, 1024, 1, MemoryStatisticType.ARKTS_STATIC_HEAP, 0, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY);

      expect(sample.type).toBe(21);
      expect(sample.startTs).toBe(0);
      expect(sample.isRelease).toBe(false);
    });

    it('should handle ARKTS_STATIC_HEAP with negative timestamp', () => {
      const sample = new AnalysisSample(1, 1024, 1, MemoryStatisticType.ARKTS_STATIC_HEAP, -1000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY);

      expect(sample.type).toBe(21);
      expect(sample.startTs).toBe(-1000);
      expect(sample.isRelease).toBe(false);
    });
  });

  describe('Multiple Memory Trace Row Types', () => {
    it('should handle ARKTS_STATIC_HEAP in different trace row types', () => {
      const nativeMemorySample = new AnalysisSample(1, 1024, 1, MemoryStatisticType.ARKTS_STATIC_HEAP, 1000, MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY);
      const gpuMemorySample = new AnalysisSample(2, 512, 1, MemoryType.GPU_VK_Alloc_NAME, 2000, MemoryTraceRowType.ROW_TYPE_GPU_MEMORY);
      const otherSourceSample = new AnalysisSample(3, 256, 1, MemoryType.FD_OPEN_NAME, 3000, MemoryTraceRowType.ROW_TYPE_OTHER_SOURCE);

      expect(nativeMemorySample.type).toBe(21);
      expect(gpuMemorySample.type).toBe(0);
      expect(otherSourceSample.type).toBe(0);
    });
  });
});
