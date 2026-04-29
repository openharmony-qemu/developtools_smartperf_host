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

import {
  queryAllIOProcess,
  queryDistinctItidCountForIO,
  queryIOStatisticsByRange
} from '../../../../src/trace/database/sql/IO.sql';

// Mock query function
const mockQuery = jest.fn();
jest.mock('../../../../src/trace/database/SqlLite', () => ({
  query: (name: string, sql: string, params?: Record<string, unknown>) => mockQuery(name, sql, params)
}));

describe('IO.sql Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('queryAllIOProcess', () => {
    it('should call query with correct SQL', async () => {
      mockQuery.mockResolvedValue([{ pid: 1234 }]);

      const result = await queryAllIOProcess();

      expect(mockQuery).toHaveBeenCalledWith(
        'queryAllIOProcess',
        expect.stringContaining('SELECT DISTINCT p.pid'),
        undefined
      );
      expect(result).toEqual([{ pid: 1234 }]);
    });

    it('should handle empty result', async () => {
      mockQuery.mockResolvedValue([]);

      const result = await queryAllIOProcess();

      expect(result).toEqual([]);
    });
  });

  describe('queryDistinctItidCountForIO', () => {
    it('should use parameterized query for logical read (type=0)', async () => {
      mockQuery.mockResolvedValue([{ cnt: 5 }]);

      await queryDistinctItidCountForIO(1234, 0);

      expect(mockQuery).toHaveBeenCalledWith(
        'queryDistinctItidCountForIO',
        expect.stringContaining('WHERE A.is_write = $isWrite'),
        { $isWrite: 0, $isBlock: 0, $pid: 1234 }
      );
    });

    it('should use parameterized query for logical write (type=1)', async () => {
      mockQuery.mockResolvedValue([{ cnt: 3 }]);

      await queryDistinctItidCountForIO(1234, 1);

      expect(mockQuery).toHaveBeenCalledWith(
        'queryDistinctItidCountForIO',
        expect.stringContaining('WHERE A.is_write = $isWrite'),
        { $isWrite: 1, $isBlock: 0, $pid: 1234 }
      );
    });

    it('should use parameterized query for physical read (type=2)', async () => {
      mockQuery.mockResolvedValue([{ cnt: 7 }]);

      await queryDistinctItidCountForIO(5678, 2);

      expect(mockQuery).toHaveBeenCalledWith(
        'queryDistinctItidCountForIO',
        expect.stringContaining('WHERE A.is_write = $isWrite'),
        { $isWrite: 0, $isBlock: 1, $pid: 5678 }
      );
    });

    it('should use parameterized query for physical write (type=3)', async () => {
      mockQuery.mockResolvedValue([{ cnt: 10 }]);

      await queryDistinctItidCountForIO(9999, 3);

      expect(mockQuery).toHaveBeenCalledWith(
        'queryDistinctItidCountForIO',
        expect.stringContaining('WHERE A.is_write = $isWrite'),
        { $isWrite: 1, $isBlock: 1, $pid: 9999 }
      );
    });

    it('should handle large pid values', async () => {
      mockQuery.mockResolvedValue([{ cnt: 0 }]);

      await queryDistinctItidCountForIO(Number.MAX_SAFE_INTEGER, 0);

      expect(mockQuery).toHaveBeenCalledWith(
        'queryDistinctItidCountForIO',
        expect.any(String),
        { $isWrite: 0, $isBlock: 0, $pid: Number.MAX_SAFE_INTEGER }
      );
    });

    it('should handle negative pid values', async () => {
      mockQuery.mockResolvedValue([{ cnt: 0 }]);

      await queryDistinctItidCountForIO(-1, 0);

      expect(mockQuery).toHaveBeenCalledWith(
        'queryDistinctItidCountForIO',
        expect.any(String),
        { $isWrite: 0, $isBlock: 0, $pid: -1 }
      );
    });
  });

  describe('queryIOStatisticsByRange', () => {
    it('should query with time range parameters', async () => {
      const mockResult = [
        {
          start_time: 1000000,
          end_time: 2000000,
          duration: 1000000,
          is_write: 1,
          is_physical: 0,
          request_bytes: 4096,
          actualBytes: 4096
        }
      ];
      mockQuery.mockResolvedValue(mockResult);

      const result = await queryIOStatisticsByRange(0, 1000000000);

      expect(mockQuery).toHaveBeenCalledWith(
        'queryIOStatisticsByRange',
        expect.stringContaining('WHERE'),
        { $startTimeNs: 0, $endTimeNs: 1000000000 }
      );
      expect(result).toEqual(mockResult);
    });

    it('should handle empty result', async () => {
      mockQuery.mockResolvedValue([]);

      const result = await queryIOStatisticsByRange(0, 1000000);

      expect(result).toEqual([]);
    });

    it('should handle large time range', async () => {
      mockQuery.mockResolvedValue([]);

      await queryIOStatisticsByRange(0, Number.MAX_SAFE_INTEGER);

      expect(mockQuery).toHaveBeenCalledWith(
        'queryIOStatisticsByRange',
        expect.any(String),
        { $startTimeNs: 0, $endTimeNs: Number.MAX_SAFE_INTEGER }
      );
    });

    it('should handle zero time range', async () => {
      mockQuery.mockResolvedValue([]);

      await queryIOStatisticsByRange(0, 0);

      expect(mockQuery).toHaveBeenCalledWith(
        'queryIOStatisticsByRange',
        expect.any(String),
        { $startTimeNs: 0, $endTimeNs: 0 }
      );
    });
  });

  describe('SQL injection prevention', () => {
    it('should not concatenate pid directly into SQL', async () => {
      const maliciousPid = "123; DROP TABLE filesystem_io; --";
      mockQuery.mockResolvedValue([]);

      await queryDistinctItidCountForIO(maliciousPid as any, 0);

      const sqlCall = mockQuery.mock.calls[0][1];
      // Verify SQL doesn't contain the raw pid value
      expect(sqlCall).not.toContain('DROP TABLE');
      expect(sqlCall).toContain('$pid');
    });

    it('should not concatenate type values directly into SQL', async () => {
      mockQuery.mockResolvedValue([]);

      await queryDistinctItidCountForIO(1234, 999);

      const sqlCall = mockQuery.mock.calls[0][1];
      // Verify SQL uses parameterized values
      expect(sqlCall).toContain('$isWrite');
      expect(sqlCall).toContain('$isBlock');
      expect(sqlCall).not.toContain('999');
    });
  });
});
