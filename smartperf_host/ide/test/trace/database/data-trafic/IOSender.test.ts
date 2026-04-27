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

// Setup window BEFORE any imports - this runs at module load time
Object.defineProperty(global, 'window', {
  value: {
    recordStartNS: 0,
    recordEndNS: 1000000000
  },
  writable: true,
  configurable: true
});

// Mock TraceRow.range - must be inside jest.mock to avoid hoisting issues
jest.mock('../../../../src/trace/component/trace/base/TraceRow', () => ({
  TraceRow: {
    range: { startNS: 0, endNS: 1000000 },
    ROW_TYPE_FILE_SYSTEM_IO: 'io'
  }
}));

// Mock SqlLite and threadPool
const mockSubmitProto = jest.fn();
jest.mock('../../../../src/trace/database/SqlLite', () => ({
  threadPool: {
    submitProto: (...args: unknown[]) => mockSubmitProto(...args)
  }
}));

// Mock dataFilterHandler
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorkerCommon', () => ({
  dataFilterHandler: jest.fn(),
  drawLoadingFrame: jest.fn(),
  isFrameContainPoint: jest.fn()
}));

import { ioSender } from '../../../../src/trace/database/data-trafic/IOSender';
import { TraceRow } from '../../../../src/trace/component/trace/base/TraceRow';
import { IOStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerIO';

describe('IOSender Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitProto.mockClear();
  });

  describe('ioSender', () => {
    const createMockRow = (clientWidth = 800) => ({
      clientWidth,
      sharedArrayBuffers: null,
      dataList: [],
      dataListCache: [],
      frame: { x: 0, y: 0, width: clientWidth, height: 48 },
      isHover: false,
      hoverX: 0,
      hoverY: 0,
      rowId: 'test-row',
      rowType: 'io',
      expansion: true
    } as unknown as TraceRow<IOStruct>);

    it('should return a Promise', async () => {
      mockSubmitProto.mockImplementation((_type, _params, callback) => {
        const buffers = {
          endNS: new ArrayBuffer(8 * 2),
          startNS: new ArrayBuffer(8 * 2),
          size: new ArrayBuffer(8 * 2),
          dur: new ArrayBuffer(8 * 2),
          height: new ArrayBuffer(4 * 2),
          isWrite: new ArrayBuffer(4 * 2),
          isPhysical: new ArrayBuffer(4 * 2),
          itid: new ArrayBuffer(4 * 2)
        };
        callback(buffers, 2, true);
      });

      const result = ioSender(0, 50, createMockRow(), -1);

      expect(result).toBeInstanceOf(Promise);
    });

    it('should call threadPool.submitProto with QueryEnum.IOData', async () => {
      mockSubmitProto.mockImplementation((_type, _params, callback) => {
        const buffers = {
          endNS: new ArrayBuffer(8 * 2),
          startNS: new ArrayBuffer(8 * 2),
          size: new ArrayBuffer(8 * 2),
          dur: new ArrayBuffer(8 * 2),
          height: new ArrayBuffer(4 * 2),
          isWrite: new ArrayBuffer(4 * 2),
          isPhysical: new ArrayBuffer(4 * 2),
          itid: new ArrayBuffer(4 * 2)
        };
        callback(buffers, 2, true);
      });

      await ioSender(0, 50, createMockRow(), -1);

      expect(mockSubmitProto).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 0,
          scale: 50,
          pid: -1
        }),
        expect.any(Function)
      );
    });

    it('should use correct type parameter for Logical Read (type=0)', async () => {
      mockSubmitProto.mockImplementation((_type, _params, callback) => {
        const buffers = {
          endNS: new ArrayBuffer(8 * 2),
          startNS: new ArrayBuffer(8 * 2),
          size: new ArrayBuffer(8 * 2),
          dur: new ArrayBuffer(8 * 2),
          height: new ArrayBuffer(4 * 2),
          isWrite: new ArrayBuffer(4 * 2),
          isPhysical: new ArrayBuffer(4 * 2),
          itid: new ArrayBuffer(4 * 2)
        };
        callback(buffers, 2, true);
      });

      await ioSender(0, 50, createMockRow(), -1);

      const callArgs = mockSubmitProto.mock.calls[0][1];
      expect(callArgs.type).toBe(0);
    });

    it('should use correct type parameter for Logical Write (type=1)', async () => {
      mockSubmitProto.mockImplementation((_type, _params, callback) => {
        const buffers = {
          endNS: new ArrayBuffer(8 * 2),
          startNS: new ArrayBuffer(8 * 2),
          size: new ArrayBuffer(8 * 2),
          dur: new ArrayBuffer(8 * 2),
          height: new ArrayBuffer(4 * 2),
          isWrite: new ArrayBuffer(4 * 2),
          isPhysical: new ArrayBuffer(4 * 2),
          itid: new ArrayBuffer(4 * 2)
        };
        callback(buffers, 2, true);
      });

      await ioSender(1, 50, createMockRow(), -1);

      const callArgs = mockSubmitProto.mock.calls[0][1];
      expect(callArgs.type).toBe(1);
    });

    it('should use correct type parameter for Physical Read (type=2)', async () => {
      mockSubmitProto.mockImplementation((_type, _params, callback) => {
        const buffers = {
          endNS: new ArrayBuffer(8 * 2),
          startNS: new ArrayBuffer(8 * 2),
          size: new ArrayBuffer(8 * 2),
          dur: new ArrayBuffer(8 * 2),
          height: new ArrayBuffer(4 * 2),
          isWrite: new ArrayBuffer(4 * 2),
          isPhysical: new ArrayBuffer(4 * 2),
          itid: new ArrayBuffer(4 * 2)
        };
        callback(buffers, 2, true);
      });

      await ioSender(2, 50, createMockRow(), -1);

      const callArgs = mockSubmitProto.mock.calls[0][1];
      expect(callArgs.type).toBe(2);
    });

    it('should use correct type parameter for Physical Write (type=3)', async () => {
      mockSubmitProto.mockImplementation((_type, _params, callback) => {
        const buffers = {
          endNS: new ArrayBuffer(8 * 2),
          startNS: new ArrayBuffer(8 * 2),
          size: new ArrayBuffer(8 * 2),
          dur: new ArrayBuffer(8 * 2),
          height: new ArrayBuffer(4 * 2),
          isWrite: new ArrayBuffer(4 * 2),
          isPhysical: new ArrayBuffer(4 * 2),
          itid: new ArrayBuffer(4 * 2)
        };
        callback(buffers, 2, true);
      });

      await ioSender(3, 50, createMockRow(), -1);

      const callArgs = mockSubmitProto.mock.calls[0][1];
      expect(callArgs.type).toBe(3);
    });

    it('should pass pid parameter correctly', async () => {
      mockSubmitProto.mockImplementation((_type, _params, callback) => {
        const buffers = {
          endNS: new ArrayBuffer(8 * 2),
          startNS: new ArrayBuffer(8 * 2),
          size: new ArrayBuffer(8 * 2),
          dur: new ArrayBuffer(8 * 2),
          height: new ArrayBuffer(4 * 2),
          isWrite: new ArrayBuffer(4 * 2),
          isPhysical: new ArrayBuffer(4 * 2),
          itid: new ArrayBuffer(4 * 2)
        };
        callback(buffers, 2, true);
      });

      await ioSender(0, 50, createMockRow(), 1234);

      const callArgs = mockSubmitProto.mock.calls[0][1];
      expect(callArgs.pid).toBe(1234);
    });

    it('should pass -1 for pid to get global data', async () => {
      mockSubmitProto.mockImplementation((_type, _params, callback) => {
        const buffers = {
          endNS: new ArrayBuffer(8 * 2),
          startNS: new ArrayBuffer(8 * 2),
          size: new ArrayBuffer(8 * 2),
          dur: new ArrayBuffer(8 * 2),
          height: new ArrayBuffer(4 * 2),
          isWrite: new ArrayBuffer(4 * 2),
          isPhysical: new ArrayBuffer(4 * 2),
          itid: new ArrayBuffer(4 * 2)
        };
        callback(buffers, 2, true);
      });

      await ioSender(0, 50, createMockRow(), -1);

      const callArgs = mockSubmitProto.mock.calls[0][1];
      expect(callArgs.pid).toBe(-1);
    });

    it('should use TraceRow.range for startNS and endNS', async () => {
      mockSubmitProto.mockImplementation((_type, _params, callback) => {
        const buffers = {
          endNS: new ArrayBuffer(8 * 2),
          startNS: new ArrayBuffer(8 * 2),
          size: new ArrayBuffer(8 * 2),
          dur: new ArrayBuffer(8 * 2),
          height: new ArrayBuffer(4 * 2),
          isWrite: new ArrayBuffer(4 * 2),
          isPhysical: new ArrayBuffer(4 * 2),
          itid: new ArrayBuffer(4 * 2)
        };
        callback(buffers, 2, true);
      });

      await ioSender(0, 50, createMockRow(), -1);

      const callArgs = mockSubmitProto.mock.calls[0][1];
      expect(callArgs.startNS).toBeDefined();
      expect(callArgs.endNS).toBeDefined();
    });

    it('should calculate width from row.clientWidth', async () => {
      mockSubmitProto.mockImplementation((_type, _params, callback) => {
        const buffers = {
          endNS: new ArrayBuffer(8 * 2),
          startNS: new ArrayBuffer(8 * 2),
          size: new ArrayBuffer(8 * 2),
          dur: new ArrayBuffer(8 * 2),
          height: new ArrayBuffer(4 * 2),
          isWrite: new ArrayBuffer(4 * 2),
          isPhysical: new ArrayBuffer(4 * 2),
          itid: new ArrayBuffer(4 * 2)
        };
        callback(buffers, 2, true);
      });

      await ioSender(0, 50, createMockRow(1000), -1);

      const callArgs = mockSubmitProto.mock.calls[0][1];
      expect(callArgs.width).toBeDefined();
    });

    it('should return IOStruct array from promise', async () => {
      mockSubmitProto.mockImplementation((_type, _params, callback) => {
        const buffers = {
          endNS: new ArrayBuffer(8 * 2),
          startNS: new ArrayBuffer(8 * 2),
          size: new ArrayBuffer(8 * 2),
          dur: new ArrayBuffer(8 * 2),
          height: new ArrayBuffer(4 * 2),
          isWrite: new ArrayBuffer(4 * 2),
          isPhysical: new ArrayBuffer(4 * 2),
          itid: new ArrayBuffer(4 * 2)
        };
        callback(buffers, 2, true);
      });

      const result = await ioSender(0, 50, createMockRow(), -1);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('should handle empty result (len=0)', async () => {
      mockSubmitProto.mockImplementation((_type, _params, callback) => {
        const buffers = {
          endNS: new ArrayBuffer(8),
          startNS: new ArrayBuffer(8),
          size: new ArrayBuffer(8),
          dur: new ArrayBuffer(8),
          height: new ArrayBuffer(4),
          isWrite: new ArrayBuffer(4),
          isPhysical: new ArrayBuffer(4),
          itid: new ArrayBuffer(4)
        };
        callback(buffers, 0, true);
      });

      const result = await ioSender(0, 50, createMockRow(), -1);

      expect(result).toEqual([]);
    });
  });
});
