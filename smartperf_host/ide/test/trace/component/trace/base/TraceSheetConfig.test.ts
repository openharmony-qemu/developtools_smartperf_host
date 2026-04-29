/*
 * Copyright (C) 2026 Huawei Device Co., Ltd.
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

import { tabConfig } from '../../../../src/trace/component/trace/base/TraceSheetConfig';
import { SelectionParam } from '../../../../src/trace/bean/BoxSelection';

describe('TraceSheetConfig Test', () => {
  describe('tabConfig', () => {
    it('should have tabConfig defined', () => {
      expect(tabConfig).toBeDefined();
      expect(typeof tabConfig).toBe('object');
    });

    it('should have required properties for each tab', () => {
      Object.entries(tabConfig).forEach(([key, config]) => {
        expect(config).toHaveProperty('title');
        expect(config).toHaveProperty('type');
        expect(typeof config.title).toBe('string');
        expect(config.title.length).toBeGreaterThan(0);
      });
    });

    it('should have unique keys', () => {
      const keys = Object.keys(tabConfig);
      const uniqueKeys = new Set(keys);
      expect(keys.length).toBe(uniqueKeys.size);
    });
  });

  describe('CPU related tabs', () => {
    it('should have box-cpu-thread tab', () => {
      expect(tabConfig['box-cpu-thread']).toBeDefined();
      expect(tabConfig['box-cpu-thread'].title).toBe('CPU by thread');
      expect(tabConfig['box-cpu-thread'].require).toBeDefined();
    });

    it('should have box-cpu-process tab', () => {
      expect(tabConfig['box-cpu-process']).toBeDefined();
      expect(tabConfig['box-cpu-process'].title).toBe('CPU by process');
    });

    it('should have box-cpu-usage tab', () => {
      expect(tabConfig['box-cpu-usage']).toBeDefined();
      expect(tabConfig['box-cpu-usage'].title).toBe('CPU Usage');
    });

    it('should have box-spt tab', () => {
      expect(tabConfig['box-spt']).toBeDefined();
      expect(tabConfig['box-spt'].title).toBe('Thread Switches');
    });

    it('should have box-pts tab', () => {
      expect(tabConfig['box-pts']).toBeDefined();
      expect(tabConfig['box-pts'].title).toBe('Thread States');
    });
  });

  describe('Memory related tabs', () => {
    it('should have box-native-statstics tab', () => {
      expect(tabConfig['box-native-statstics']).toBeDefined();
      expect(tabConfig['box-native-statstics'].title).toBe('Statistics');
    });

    it('should have box-native-memory tab', () => {
      expect(tabConfig['box-native-memory']).toBeDefined();
      expect(tabConfig['box-native-memory'].title).toBe('Native Memory');
    });

    it('should have box-gpu-statstics tab', () => {
      expect(tabConfig['box-gpu-statstics']).toBeDefined();
      expect(tabConfig['box-gpu-statstics'].title).toBe('Gpu Statistics');
    });
  });

  describe('IO related tabs', () => {
    it('should have box-file-system-statistics tab', () => {
      expect(tabConfig['box-file-system-statistics']).toBeDefined();
      expect(tabConfig['box-file-system-statistics'].title).toBe('Filesystem statistics');
    });

    it('should have box-io-tier-statistics tab', () => {
      expect(tabConfig['box-io-tier-statistics']).toBeDefined();
      expect(tabConfig['box-io-tier-statistics'].title).toBe('Disk I/O Tier Statistics');
    });

    it('should have box-io-statiics tab', () => {
      expect(tabConfig['box-io-statiics']).toBeDefined();
      expect(tabConfig['box-io-statiics'].title).toBe('IO Statistics');
    });

    it('should have box-virtual-memory-statistics tab', () => {
      expect(tabConfig['box-virtual-memory-statistics']).toBeDefined();
      expect(tabConfig['box-virtual-memory-statistics'].title).toBe('Page Fault Statistics');
    });
  });

  describe('require function tests', () => {
    const createMockSelectionParam = (overrides: Partial<SelectionParam>): SelectionParam => {
      return {
        leftNs: 0,
        rightNs: 0,
        cpus: [],
        threadIds: [],
        processIds: [],
        processSysCallIds: [],
        threadSysCallIds: [],
        funTids: [],
        funAsync: [],
        funCatAsync: [],
        perfSampleIds: [],
        processTrackIds: [],
        virtualTrackIds: [],
        clockMapData: new Map(),
        xpowerMapData: new Map(),
        xpowerComponentTopMapData: new Map(),
        xpowerStatisticMapData: new Map(),
        xpowerDisplayMapData: new Map(),
        xpowerWifiPacketsMapData: new Map(),
        xpowerWifiBytesMapData: new Map(),
        xpowerThreadEnergyMapData: new Map(),
        xpowerThreadLoadMapData: new Map(),
        xpowerGpuFreqMapData: new Map(),
        hangMapData: new Map(),
        irqCallIds: [],
        softIrqCallIds: [],
        hasFps: false,
        nativeMemory: [],
        nativeMemoryStatistic: [],
        gpuMemory: [],
        gpuMemoryStatistic: [],
        otherSource: [],
        otherSourceStatistic: [],
        cpuAbilityIds: [],
        memoryAbilityIds: [],
        diskAbilityIds: [],
        networkAbilityIds: [],
        sdkSliceIds: [],
        sdkCounterIds: [],
        cpuStateFilterIds: [],
        cpuFreqFilterIds: [],
        anomalyEnergy: [],
        systemEnergy: [],
        powerEnergy: [],
        fileSystemType: [],
        fsCount: 0,
        fileSysVirtualMemory: false,
        vmCount: 0,
        diskIOLatency: false,
        diskIOipids: [],
        smapsType: [],
        smapsTypeComparison: [],
        vmtrackershm: [],
        jankFramesData: [],
        jsMemory: [],
        taskFramesData: [],
        frameDynamic: [],
        frameSpacing: [],
        jsCpuProfilerData: [],
        gpu: {
          gl: false,
          graph: false,
          gpuTotal: false,
          gpuWindow: false
        } as any,
        purgeableTotalAbility: [],
        purgeableTotalVM: [],
        purgeablePinAbility: [],
        purgeablePinVM: [],
        dmaAbilityData: [],
        dmaVmTrackerData: [],
        gpuMemoryAbilityData: [],
        gpuMemoryTrackerData: [],
        hiLogs: [],
        hiSysEvents: [],
        startup: false,
        staticInit: false,
        isCurrentPane: false,
        perfSampleChildIds: [],
        threadIdsForFreq: [],
        gpuCounter: [],
        dmaFenceNameData: [],
        ioStatisticsRowIds: [],
        ioStatiicsData: [],
        ...overrides
      } as SelectionParam;
    };

    describe('box-cpu-thread require', () => {
      it('should return false when cpus is empty', () => {
        const param = createMockSelectionParam({ cpus: [] });
        const result = tabConfig['box-cpu-thread'].require?.(param);
        expect(result).toBe(false);
      });

      it('should return true when cpus has items', () => {
        const param = createMockSelectionParam({ cpus: [1, 2, 3] });
        const result = tabConfig['box-cpu-thread'].require?.(param);
        expect(result).toBe(true);
      });
    });

    describe('box-cpu-freq-limit require', () => {
      it('should return false when cpuFreqLimit is empty', () => {
        const param = createMockSelectionParam({ cpuFreqLimit: [] });
        const result = tabConfig['box-cpu-freq-limit'].require?.(param);
        expect(result).toBe(false);
      });

      it('should return true when cpuFreqLimit has items', () => {
        const param = createMockSelectionParam({ cpuFreqLimit: [1] });
        const result = tabConfig['box-cpu-freq-limit'].require?.(param);
        expect(result).toBe(true);
      });
    });

    describe('box-io-statiics require', () => {
      it('should return false when ioStatisticsRowIds and ioStatiicsData are empty', () => {
        const param = createMockSelectionParam({
          ioStatisticsRowIds: [],
          ioStatiicsData: []
        });
        const result = tabConfig['box-io-statiics'].require?.(param);
        expect(result).toBe(false);
      });

      it('should return true when ioStatisticsRowIds has items', () => {
        const param = createMockSelectionParam({
          ioStatisticsRowIds: [1],
          ioStatiicsData: []
        });
        const result = tabConfig['box-io-statiics'].require?.(param);
        expect(result).toBe(true);
      });

      it('should return true when ioStatiicsData has items', () => {
        const param = createMockSelectionParam({
          ioStatisticsRowIds: [],
          ioStatiicsData: [{ startNS: 100 }] as any
        });
        const result = tabConfig['box-io-statiics'].require?.(param);
        expect(result).toBe(true);
      });
    });

    describe('box-virtual-memory-statistics require', () => {
      it('should return false when fileSysVirtualMemory is false', () => {
        const param = createMockSelectionParam({ fileSysVirtualMemory: false });
        const result = tabConfig['box-virtual-memory-statistics'].require?.(param);
        expect(result).toBe(false);
      });

      it('should return true when fileSysVirtualMemory is true', () => {
        const param = createMockSelectionParam({ fileSysVirtualMemory: true });
        const result = tabConfig['box-virtual-memory-statistics'].require?.(param);
        expect(result).toBe(true);
      });
    });

    describe('box-io-tier-statistics require', () => {
      it('should return false when diskIOLatency is false', () => {
        const param = createMockSelectionParam({ diskIOLatency: false });
        const result = tabConfig['box-io-tier-statistics'].require?.(param);
        expect(result).toBe(false);
      });

      it('should return true when diskIOLatency is true', () => {
        const param = createMockSelectionParam({ diskIOLatency: true });
        const result = tabConfig['box-io-tier-statistics'].require?.(param);
        expect(result).toBe(true);
      });
    });
  });

  describe('Tab type validation', () => {
    it('should have valid type for each tab', () => {
      Object.entries(tabConfig).forEach(([key, config]) => {
        expect(config.type).toBeDefined();
        expect(typeof config.type).toBe('function');
      });
    });
  });
});
