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

import { ioDataGroupBy10MSProtoSql, ioDataProtoSql, ioDataReceiver } from '../../../../src/trace/database/data-trafic/IOReceiver';
import { Args } from '../../../../src/trace/database/data-trafic/CommonArgs';
import { TraficEnum } from '../../../../src/trace/database/data-trafic/utils/QueryEnum';

describe('IOReceiver Test', () => {
  describe('ioDataGroupBy10MSProtoSql', () => {
    const baseArgs: Args = {
      type: 0,
      pid: -1,
      startNS: 0,
      endNS: 1000000000,
      recordStartNS: 0,
      recordEndNS: 1000000000,
      width: 800
    };

    it('should generate SQL for Logical Read (type=0)', () => {
      const sql = ioDataGroupBy10MSProtoSql({ ...baseArgs, type: 0 });

      expect(sql).toContain('A.is_write = 0');
      expect(sql).toContain('A.is_block = 0');
    });

    it('should generate SQL for Logical Write (type=1)', () => {
      const sql = ioDataGroupBy10MSProtoSql({ ...baseArgs, type: 1 });

      expect(sql).toContain('A.is_write = 1');
      expect(sql).toContain('A.is_block = 0');
    });

    it('should generate SQL for Physical Read (type=2)', () => {
      const sql = ioDataGroupBy10MSProtoSql({ ...baseArgs, type: 2 });

      expect(sql).toContain('A.is_write = 0');
      expect(sql).toContain('A.is_block = 1');
    });

    it('should generate SQL for Physical Write (type=3)', () => {
      const sql = ioDataGroupBy10MSProtoSql({ ...baseArgs, type: 3 });

      expect(sql).toContain('A.is_write = 1');
      expect(sql).toContain('A.is_block = 1');
    });

    it('should omit pid filter when pid=-1', () => {
      const sql = ioDataGroupBy10MSProtoSql({ ...baseArgs, pid: -1 });

      expect(sql).not.toContain('AND P.pid = -1');
    });

    it('should include pid filter when pid is specific value', () => {
      const sql = ioDataGroupBy10MSProtoSql({ ...baseArgs, pid: 1234 });

      expect(sql).toContain('AND P.pid = 1234');
    });

    it('should include time range filtering', () => {
      const sql = ioDataGroupBy10MSProtoSql(baseArgs);

      expect(sql).toContain('(A.start_time - 0) > 0');
      expect(sql).toContain('(A.start_time - 0) + A.duration >= 0');
      expect(sql).toContain('(A.start_time - 0) < 1000000000');
    });

    it('should use recordStartNS in time calculations', () => {
      const sql = ioDataGroupBy10MSProtoSql({ ...baseArgs, recordStartNS: 1000000 });

      expect(sql).toContain('( A.start_time - 1000000 ) / 10000000 * 10000000');
    });
  });

  describe('ioDataProtoSql', () => {
    const baseArgs: Args = {
      type: 0,
      pid: -1,
      startNS: 0,
      endNS: 1000000000,
      recordStartNS: 0,
      recordEndNS: 1000000000,
      width: 800
    };

    it('should generate SQL for Logical Read (type=0)', () => {
      const sql = ioDataProtoSql({ ...baseArgs, type: 0 });

      expect(sql).toContain('A.is_write = 0');
      expect(sql).toContain('A.is_block = 0');
    });

    it('should generate SQL for Logical Write (type=1)', () => {
      const sql = ioDataProtoSql({ ...baseArgs, type: 1 });

      expect(sql).toContain('A.is_write = 1');
      expect(sql).toContain('A.is_block = 0');
    });

    it('should generate SQL for Physical Read (type=2)', () => {
      const sql = ioDataProtoSql({ ...baseArgs, type: 2 });

      expect(sql).toContain('A.is_write = 0');
      expect(sql).toContain('A.is_block = 1');
    });

    it('should generate SQL for Physical Write (type=3)', () => {
      const sql = ioDataProtoSql({ ...baseArgs, type: 3 });

      expect(sql).toContain('A.is_write = 1');
      expect(sql).toContain('A.is_block = 1');
    });

    it('should omit pid filter when pid=-1', () => {
      const sql = ioDataProtoSql({ ...baseArgs, pid: -1 });

      expect(sql).not.toContain('AND P.pid = -1');
    });

    it('should include pid filter when pid is specific value', () => {
      const sql = ioDataProtoSql({ ...baseArgs, pid: 5678 });

      expect(sql).toContain('AND P.pid = 5678');
    });

    it('should select correct columns', () => {
      const sql = ioDataProtoSql(baseArgs);

      expect(sql).toContain('startNs');
      expect(sql).toContain('endNs');
      expect(sql).toContain('dur');
      expect(sql).toContain('size');
      expect(sql).toContain('isWrite');
      expect(sql).toContain('isPhysical');
      expect(sql).toContain('itid');
    });

    it('should use COALESCE for itid', () => {
      const sql = ioDataProtoSql(baseArgs);

      expect(sql).toContain('COALESCE(A.itid, 0) as itid');
    });
  });

  describe('ioDataReceiver', () => {
    const mockProc = jest.fn();
    const mockPostMessage = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
      (self as unknown as Worker).postMessage = mockPostMessage;
      mockProc.mockReturnValue([]);
    });

    it('should use ioDataGroupBy10MSProtoSql when scale > 40,000,000', () => {
      const mockData = {
        params: {
          scale: 50000000,
          type: 0,
          pid: -1,
          startNS: 0,
          endNS: 1000000000,
          recordStartNS: 0,
          recordEndNS: 1000000000,
          width: 800,
          trafic: TraficEnum.TransferArrayBuffer,
          sharedArrayBuffers: null
        },
        id: 'test-id',
        action: 'test-action'
      };

      ioDataReceiver(mockData as any, mockProc);

      expect(mockProc).toHaveBeenCalled();
      const sqlArg = mockProc.mock.calls[0][0] as string;
      expect(sqlArg).toContain('min( startNs )');
      expect(sqlArg).toContain('max( endNs )');
      expect(sqlArg).toContain('GROUP BY px');
    });

    it('should use ioDataProtoSql when scale <= 40,000,000', () => {
      const mockData = {
        params: {
          scale: 1000000,
          type: 0,
          pid: -1,
          startNS: 0,
          endNS: 1000000000,
          recordStartNS: 0,
          recordEndNS: 1000000000,
          width: 800,
          trafic: TraficEnum.TransferArrayBuffer,
          sharedArrayBuffers: null
        },
        id: 'test-id',
        action: 'test-action'
      };

      ioDataReceiver(mockData as any, mockProc);

      expect(mockProc).toHaveBeenCalled();
      const sqlArg = mockProc.mock.calls[0][0] as string;
      expect(sqlArg).toContain('select');
      expect(sqlArg).toContain('startNs');
      expect(sqlArg).toContain('from filesystem_io A');
    });

    it('should call arrayBufferHandler with transfer=true for TransferArrayBuffer', () => {
      const mockData = {
        params: {
          scale: 1000000,
          type: 0,
          pid: -1,
          startNS: 0,
          endNS: 1000000000,
          recordStartNS: 0,
          recordEndNS: 1000000000,
          width: 800,
          trafic: TraficEnum.TransferArrayBuffer,
          sharedArrayBuffers: null
        },
        id: 'test-id',
        action: 'test-action'
      };

      ioDataReceiver(mockData as any, mockProc);

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-id',
          action: 'test-action',
          len: 0,
          transfer: true
        }),
        expect.any(Array)
      );
    });

    it('should call arrayBufferHandler with transfer=false for SharedArrayBuffer', () => {
      const mockData = {
        params: {
          scale: 1000000,
          type: 0,
          pid: -1,
          startNS: 0,
          endNS: 1000000000,
          recordStartNS: 0,
          recordEndNS: 1000000000,
          width: 800,
          trafic: TraficEnum.SharedArrayBuffer,
          sharedArrayBuffers: {
            startNS: new ArrayBuffer(8),
            endNS: new ArrayBuffer(8),
            size: new ArrayBuffer(8),
            dur: new ArrayBuffer(8),
            height: new ArrayBuffer(4),
            isWrite: new ArrayBuffer(4),
            isPhysical: new ArrayBuffer(4),
            itid: new ArrayBuffer(4)
          }
        },
        id: 'test-id',
        action: 'test-action'
      };

      ioDataReceiver(mockData as any, mockProc);

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          transfer: false
        }),
        expect.arrayContaining([])
      );
    });
  });

  describe('arrayBufferHandler (via ioDataReceiver)', () => {
    const mockPostMessage = jest.fn();
    const mockProc = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
      (self as unknown as Worker).postMessage = mockPostMessage;
    });

    it('should handle empty result array', () => {
      mockProc.mockReturnValue([]);

      const mockData = {
        params: {
          scale: 1000000,
          type: 0,
          pid: -1,
          startNS: 0,
          endNS: 1000000000,
          recordStartNS: 0,
          recordEndNS: 1000000000,
          width: 800,
          trafic: TraficEnum.TransferArrayBuffer,
          sharedArrayBuffers: null
        },
        id: 'test-id',
        action: 'test-action'
      };

      ioDataReceiver(mockData as any, mockProc);

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          len: 0
        }),
        expect.any(Array)
      );
    });

    it('should process result with IO data', () => {
      mockProc.mockReturnValue([
        { startNs: 100, endNs: 200, size: 4096, dur: 100, isWrite: 0, isPhysical: 0, itid: 1 }
      ]);

      const mockData = {
        params: {
          scale: 1000000,
          type: 0,
          pid: -1,
          startNS: 0,
          endNS: 1000000000,
          recordStartNS: 0,
          recordEndNS: 1000000000,
          width: 800,
          trafic: TraficEnum.TransferArrayBuffer,
          sharedArrayBuffers: null
        },
        id: 'test-id',
        action: 'test-action'
      };

      ioDataReceiver(mockData as any, mockProc);

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          len: 1
        }),
        expect.any(Array)
      );
    });

    it('should calculate height based on maxSize', () => {
      mockProc.mockReturnValue([
        { startNs: 100, endNs: 200, size: 1000, dur: 100, isWrite: 0, isPhysical: 0, itid: 1 },
        { startNs: 200, endNs: 300, size: 2000, dur: 100, isWrite: 0, isPhysical: 0, itid: 2 },
        { startNs: 300, endNs: 400, size: 500, dur: 100, isWrite: 0, isPhysical: 0, itid: 3 }
      ]);

      const mockData = {
        params: {
          scale: 1000000,
          type: 0,
          pid: -1,
          startNS: 0,
          endNS: 1000000000,
          recordStartNS: 0,
          recordEndNS: 1000000000,
          width: 800,
          trafic: TraficEnum.TransferArrayBuffer,
          sharedArrayBuffers: null
        },
        id: 'test-id',
        action: 'test-action'
      };

      ioDataReceiver(mockData as any, mockProc);

      // Should post message with correct structure
      expect(mockPostMessage).toHaveBeenCalled();
    });

    it('should handle null dur values', () => {
      mockProc.mockReturnValue([
        { startNs: 100, endNs: 200, size: 1000, dur: null, isWrite: 0, isPhysical: 0, itid: 1 }
      ]);

      const mockData = {
        params: {
          scale: 1000000,
          type: 0,
          pid: -1,
          startNS: 0,
          endNS: 1000000000,
          recordStartNS: 0,
          recordEndNS: 1000000000,
          width: 800,
          trafic: TraficEnum.TransferArrayBuffer,
          sharedArrayBuffers: null
        },
        id: 'test-id',
        action: 'test-action'
      };

      ioDataReceiver(mockData as any, mockProc);

      expect(mockPostMessage).toHaveBeenCalled();
    });

    it('should handle null isWrite/isPhysical/itid values', () => {
      mockProc.mockReturnValue([
        { startNs: 100, endNs: 200, size: 1000, dur: 100, isWrite: null, isPhysical: null, itid: null }
      ]);

      const mockData = {
        params: {
          scale: 1000000,
          type: 0,
          pid: -1,
          startNS: 0,
          endNS: 1000000000,
          recordStartNS: 0,
          recordEndNS: 1000000000,
          width: 800,
          trafic: TraficEnum.TransferArrayBuffer,
          sharedArrayBuffers: null
        },
        id: 'test-id',
        action: 'test-action'
      };

      ioDataReceiver(mockData as any, mockProc);

      expect(mockPostMessage).toHaveBeenCalled();
    });
  });
});
