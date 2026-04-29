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

import { TabPaneIOStatistics } from '../../../../../../src/trace/component/trace/sheet/io/TabPaneIOStatistics';
import { IOStatisticsRow } from '../../../../../../src/trace/database/sql/IO.sql';

// Mock ResizeObserver
window.ResizeObserver = window.ResizeObserver || jest.fn().mockImplementation(() => ({
  disconnect: jest.fn(),
  observe: jest.fn(),
  unobserve: jest.fn(),
}));

// Mock SqlLite to avoid import.meta.url issues
jest.mock('../../../../../../src/trace/database/SqlLite', () => ({
  query: jest.fn().mockResolvedValue([])
}));

// Mock queryIOStatisticsByRange
jest.mock('../../../../../../src/trace/database/sql/IO.sql', () => ({
  queryIOStatisticsByRange: jest.fn().mockResolvedValue([])
}));

describe('TabPaneIOStatistics Test', () => {
  let tabPaneIO: TabPaneIOStatistics;

  beforeEach(() => {
    tabPaneIO = new TabPaneIOStatistics();
    // 初始化必要的属性
    document.body.innerHTML = '<tabpane-io-statistics></tabpane-io-statistics>';
    const element = document.querySelector('tabpane-io-statistics') as TabPaneIOStatistics;
    if (element) {
      tabPaneIO = element;
    }
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('formatDurationMs', () => {
    it('should format nanoseconds to milliseconds with 3 decimal places', () => {
      // 测试 formatDurationMs 方法（需要访问私有方法，使用 any 类型）
      const ns = 1000000; // 1ms
      const result = (tabPaneIO as any).formatDurationMs(ns);
      expect(result).toBe('1000.000');
    });

    it('should handle zero duration', () => {
      const result = (tabPaneIO as any).formatDurationMs(0);
      expect(result).toBe('0.000');
    });

    it('should handle small durations', () => {
      const result = (tabPaneIO as any).formatDurationMs(123); // 0.000123ms
      expect(result).toBe('0.000');
    });
  });

  describe('sortByColumn', () => {
    it('should sort by numeric column ascending', () => {
      const mockData = [
        { startTime: 300, duration: '3.000' },
        { startTime: 100, duration: '1.000' },
        { startTime: 200, duration: '2.000' }
      ];
      (tabPaneIO as any).tableRows = mockData;
      (tabPaneIO as any).defaultTableRows = mockData;

      // 模拟 table 存在
      (tabPaneIO as any).table = {
        recycleDataSource: null
      };

      (tabPaneIO as any).sortByColumn({ key: 'startTime', sort: 1 });

      expect((tabPaneIO as any).tableRows[0].startTime).toBe(100);
      expect((tabPaneIO as any).tableRows[1].startTime).toBe(200);
      expect((tabPaneIO as any).tableRows[2].startTime).toBe(300);
    });

    it('should sort by numeric column descending', () => {
      const mockData = [
        { startTime: 100, duration: '1.000' },
        { startTime: 300, duration: '3.000' },
        { startTime: 200, duration: '2.000' }
      ];
      (tabPaneIO as any).tableRows = mockData;
      (tabPaneIO as any).defaultTableRows = mockData;
      (tabPaneIO as any).table = { recycleDataSource: null };

      (tabPaneIO as any).sortByColumn({ key: 'startTime', sort: 2 });

      expect((tabPaneIO as any).tableRows[0].startTime).toBe(300);
      expect((tabPaneIO as any).tableRows[1].startTime).toBe(200);
      expect((tabPaneIO as any).tableRows[2].startTime).toBe(100);
    });

    it('should sort by string column', () => {
      const mockData = [
        { isWrite: 'Write', startTime: 100 },
        { isWrite: 'Read', startTime: 200 }
      ];
      (tabPaneIO as any).tableRows = mockData;
      (tabPaneIO as any).defaultTableRows = mockData;
      (tabPaneIO as any).table = { recycleDataSource: null };

      (tabPaneIO as any).sortByColumn({ key: 'isWrite', sort: 1 });

      expect((tabPaneIO as any).tableRows[0].isWrite).toBe('Read');
      expect((tabPaneIO as any).tableRows[1].isWrite).toBe('Write');
    });

    it('should reset sort when sort is 0', () => {
      const mockData = [
        { startTime: 300 },
        { startTime: 100 }
      ];
      const originalData = [
        { startTime: 100 },
        { startTime: 300 }
      ];
      (tabPaneIO as any).tableRows = mockData;
      (tabPaneIO as any).defaultTableRows = originalData;
      (tabPaneIO as any).table = { recycleDataSource: null };

      (tabPaneIO as any).sortByColumn({ key: 'startTime', sort: 0 });

      expect((tabPaneIO as any).tableRows).toEqual(originalData);
    });

    it('should handle empty table rows', () => {
      (tabPaneIO as any).tableRows = [];
      (tabPaneIO as any).table = { recycleDataSource: null };

      expect(() => (tabPaneIO as any).sortByColumn({ key: 'startTime', sort: 1 })).not.toThrow();
    });

    it('should handle mixed numeric and string values', () => {
      const mockData = [
        { duration: '10.500' },
        { duration: '2.000' },
        { duration: 'N/A' }
      ];
      (tabPaneIO as any).tableRows = mockData;
      (tabPaneIO as any).defaultTableRows = mockData;
      (tabPaneIO as any).table = { recycleDataSource: null };

      (tabPaneIO as any).sortByColumn({ key: 'duration', sort: 1 });

      // '2.000' should come first (smallest number)
      // '10.500' should come second
      // 'N/A' should come last (NaN, treated as string)
      expect((tabPaneIO as any).tableRows[0].duration).toBe('2.000');
      expect((tabPaneIO as any).tableRows[1].duration).toBe('10.500');
    });
  });

  describe('setIoStatisticsData', () => {
    it('should handle empty data list', () => {
      (tabPaneIO as any).table = {
        recycleDataSource: null
      };

      tabPaneIO.setIoStatisticsData([]);

      expect((tabPaneIO as any).tableRows).toEqual([]);
      expect((tabPaneIO as any).defaultTableRows).toEqual([]);
    });

    it('should handle null table', () => {
      (tabPaneIO as any).table = null;

      expect(() => tabPaneIO.setIoStatisticsData([{ startNS: 100, dur: 50, size: 100, isWrite: false, isPhysical: false } as any])).not.toThrow();
    });

    it('should process IO data correctly', () => {
      const mockData = [
        {
          startNS: 1000000,
          dur: 500000,
          size: 4096,
          isWrite: true,
          isPhysical: true,
          actualBytes: 4096
        } as any
      ];
      (tabPaneIO as any).table = { recycleDataSource: null };

      tabPaneIO.setIoStatisticsData(mockData);

      expect((tabPaneIO as any).tableRows.length).toBe(1);
      expect((tabPaneIO as any).tableRows[0].isWrite).toBe('Write');
      expect((tabPaneIO as any).tableRows[0].isPhysical).toBe('Physical');
    });
  });

  describe('fetchIOData error handling', () => {
    it('should handle query failure gracefully', async () => {
      const mockTable = { style: { display: 'block' }, recycleDataSource: null };
      const mockProgress = { loading: true };

      (tabPaneIO as any).table = mockTable;
      (tabPaneIO as any).progressEL = mockProgress;

      // Mock console.error to verify it's called
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // 模拟 queryIOStatisticsByRange 抛出错误
      jest.mock('../../../../src/trace/database/sql/IO.sql', () => ({
        queryIOStatisticsByRange: jest.fn().mockRejectedValue(new Error('Query failed'))
      }));

      (tabPaneIO as any).fetchIOData(0, 1000000);

      // Wait for promise to resolve
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(mockProgress.loading).toBe(false);

      consoleErrorSpy.mockRestore();
    });
  });
});
