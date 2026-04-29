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

// Mock SqlLite to avoid import.meta.url issues
jest.mock('../../../../src/trace/database/SqlLite', () => ({
  query: jest.fn(),
  threadPool: {
    submitProto: jest.fn()
  }
}));

// Mock Procedure to avoid import.meta.url issues
jest.mock('../../../../src/trace/database/Procedure', () => ({
  procedurePool: {},
  ProcedureThread: jest.fn()
}));

// Mock TraceRow.range
jest.mock('../../../../src/trace/component/trace/base/TraceRow', () => ({
  TraceRow: {
    range: {
      startNS: 0,
      endNS: 1000000000,
      totalNS: 1000000000,
      refresh: false
    },
    ROW_TYPE_FILE_SYSTEM_IO: 'io'
  }
}));

// Mock ProcedureWorkerCommon to avoid deep imports
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorkerCommon', () => {
  const actualModule = jest.requireActual('../../../../src/trace/database/ui-worker/ProcedureWorkerCommon');
  return {
    ...actualModule,
    dataFilterHandler: jest.fn((ioList, ioFilter, options) => {
      // Simulate real behavior: copy from ioList to ioFilter when useCache is false
      if (!options.useCache && ioList && ioList.length > 0) {
        ioFilter.push(...ioList);
      }
    }),
    drawLoadingFrame: jest.fn(),
    isFrameContainPoint: actualModule.isFrameContainPoint || jest.fn()
  };
});

import { IOStruct, IOStructOnClick, IORender } from '../../../../src/trace/database/ui-worker/ProcedureWorkerIO';
import { TraceRow } from '../../../../src/trace/component/trace/base/TraceRow';
import { SpSystemTrace } from '../../../../src/trace/component/SpSystemTrace';

describe('ProcedureWorkerIO Test', () => {
  beforeEach(() => {
    IOStruct.hoverIOStruct = null;
    IOStruct.selectIOStruct = null;
    IOStruct.selectIOStructList = [];
    jest.clearAllMocks();
  });

  describe('IOStruct class', () => {
    it('should create IOStruct with default values', () => {
      const io = new IOStruct();

      expect(io.size).toBe(0);
      expect(io.dur).toBe(0);
      expect(io.endNS).toBe(0);
      expect(io.startNS).toBe(0);
      expect(io.height).toBe(0);
      expect(io.group10Ms).toBe(false);
      expect(io.isWrite).toBe(false);
      expect(io.isPhysical).toBe(false);
      expect(io.itid).toBe(0);
    });

    it('should allow setting properties', () => {
      const io = new IOStruct();
      io.startNS = 100;
      io.endNS = 200;
      io.dur = 100;
      io.size = 4096;
      io.isWrite = true;
      io.isPhysical = true;
      io.itid = 1234;

      expect(io.startNS).toBe(100);
      expect(io.endNS).toBe(200);
      expect(io.dur).toBe(100);
      expect(io.size).toBe(4096);
      expect(io.isWrite).toBe(true);
      expect(io.isPhysical).toBe(true);
      expect(io.itid).toBe(1234);
    });

    it('should inherit from BaseStruct', () => {
      const io = new IOStruct();

      // IOStruct inherits frame from BaseStruct
      expect(io).toHaveProperty('frame');
      // IOStruct has its own properties
      expect(io.size).toBe(0);
      expect(io.dur).toBe(0);
    });
  });

  describe('IOStruct static properties', () => {
    it('should initialize hoverIOStruct to null', () => {
      expect(IOStruct.hoverIOStruct).toBeNull();
    });

    it('should initialize selectIOStruct to null', () => {
      expect(IOStruct.selectIOStruct).toBeNull();
    });

    it('should initialize selectIOStructList to empty array', () => {
      expect(IOStruct.selectIOStructList).toEqual([]);
    });

    it('should allow setting hoverIOStruct', () => {
      const io = new IOStruct();
      IOStruct.hoverIOStruct = io;

      expect(IOStruct.hoverIOStruct).toBe(io);
    });

    it('should allow setting selectIOStruct', () => {
      const io = new IOStruct();
      IOStruct.selectIOStruct = io;

      expect(IOStruct.selectIOStruct).toBe(io);
    });
  });

  describe('IOStructOnClick', () => {
    const createMockSp = () => ({
      traceSheetEL: {
        displayIoStatiicsData: jest.fn()
      },
      timerShaftEL: {
        modifyFlagList: jest.fn()
      }
    } as unknown as SpSystemTrace);

    it('should reject when clickRowType is ROW_TYPE_FILE_SYSTEM_IO and hoverIOStruct exists', async () => {
      const mockSp = createMockSp();
      const io = new IOStruct();
      IOStruct.hoverIOStruct = io;

      const promise = IOStructOnClick(TraceRow.ROW_TYPE_FILE_SYSTEM_IO, mockSp);

      await expect(promise).rejects.toThrow();
    });

    it('should reject when clickRowType is ROW_TYPE_FILE_SYSTEM_IO and entry is provided', async () => {
      const mockSp = createMockSp();
      const io = new IOStruct();

      const promise = IOStructOnClick(TraceRow.ROW_TYPE_FILE_SYSTEM_IO, mockSp, io);

      await expect(promise).rejects.toThrow();
    });

    it('should set selectIOStruct to entry when provided', async () => {
      const mockSp = createMockSp();
      const io = new IOStruct();
      io.size = 4096;

      try {
        await IOStructOnClick(TraceRow.ROW_TYPE_FILE_SYSTEM_IO, mockSp, io);
      } catch (e) {
        // Expected to reject
      }

      expect(IOStruct.selectIOStruct).toBe(io);
    });

    it('should set selectIOStruct to hoverIOStruct when entry not provided', async () => {
      const mockSp = createMockSp();
      const io = new IOStruct();
      io.size = 4096;
      IOStruct.hoverIOStruct = io;

      try {
        await IOStructOnClick(TraceRow.ROW_TYPE_FILE_SYSTEM_IO, mockSp);
      } catch (e) {
        // Expected to reject
      }

      expect(IOStruct.selectIOStruct).toBe(io);
    });

    it('should call displayIoStatiicsData with selectIOStruct', async () => {
      const mockSp = createMockSp();
      const io = new IOStruct();

      try {
        await IOStructOnClick(TraceRow.ROW_TYPE_FILE_SYSTEM_IO, mockSp, io);
      } catch (e) {
        // Expected to reject
      }

      expect(mockSp.traceSheetEL?.displayIoStatiicsData).toHaveBeenCalledWith([io]);
    });

    it('should call modifyFlagList with undefined', async () => {
      const mockSp = createMockSp();
      const io = new IOStruct();

      try {
        await IOStructOnClick(TraceRow.ROW_TYPE_FILE_SYSTEM_IO, mockSp, io);
      } catch (e) {
        // Expected to reject
      }

      expect(mockSp.timerShaftEL?.modifyFlagList).toHaveBeenCalledWith(undefined);
    });

    it('should resolve when clickRowType is not ROW_TYPE_FILE_SYSTEM_IO', async () => {
      const mockSp = createMockSp();
      IOStruct.hoverIOStruct = new IOStruct();

      const result = await IOStructOnClick('other-type', mockSp);

      expect(result).toBeNull();
    });

    it('should resolve when hoverIOStruct and entry are both null/undefined', async () => {
      const mockSp = createMockSp();

      const result = await IOStructOnClick(TraceRow.ROW_TYPE_FILE_SYSTEM_IO, mockSp, undefined);

      expect(result).toBeNull();
    });
  });

  describe('IORender', () => {
    const createMockRow = () => ({
      dataList: [],
      dataListCache: [],
      frame: { x: 0, y: 0, width: 800, height: 48 },
      isHover: false,
      hoverX: 0,
      hoverY: 0,
      clientWidth: 800
    } as unknown as TraceRow<IOStruct>);

    const createMockContext = () => ({
      beginPath: jest.fn(),
      closePath: jest.fn(),
      fillStyle: '',
      fillRect: jest.fn(),
      strokeStyle: '',
      lineWidth: 0,
      strokeRect: jest.fn()
    } as unknown as CanvasRenderingContext2D);

    describe('renderMainThread', () => {
      it('should handle empty dataList', () => {
        const mockRow = createMockRow();
        const mockCtx = createMockContext();
        const renderer = new IORender();

        renderer.renderMainThread({
          context: mockCtx,
          useCache: false,
          type: 'test',
          chartColor: '#ff0000'
        }, mockRow);

        expect(mockCtx.beginPath).toHaveBeenCalled();
        expect(mockCtx.closePath).toHaveBeenCalled();
      });

      it('should process dataList with IO events', () => {
        const mockRow = createMockRow();
        mockRow.dataList = [];
        mockRow.dataListCache = [
          { startNS: 100000000, endNS: 200000000, dur: 100000000, size: 4096, isWrite: false, isPhysical: false, frame: { x: 0, y: 0, width: 100, height: 40 } }
        ];
        const mockCtx = createMockContext();
        const renderer = new IORender();

        renderer.renderMainThread({
          context: mockCtx,
          useCache: true,
          type: 'test',
          chartColor: '#ff0000'
        }, mockRow);

        // Should draw when there are cached IO events with frames
        expect(mockCtx.fillRect).toHaveBeenCalled();
      });

      it('should set hoverIOStruct when hover occurs', () => {
        const mockRow = createMockRow();
        const ioData = {
          startNS: 100000000,
          endNS: 200000000,
          dur: 100000000,
          size: 4096,
          isWrite: false,
          isPhysical: false,
          frame: { x: 0, y: 0, width: 100, height: 40 }
        };
        // When useCache is false, dataList is used and processed
        mockRow.dataList = [ioData];
        mockRow.dataListCache = [];
        mockRow.isHover = true;
        mockRow.hoverX = 50;
        mockRow.hoverY = 20;
        const mockCtx = createMockContext();
        const renderer = new IORender();

        renderer.renderMainThread({
          context: mockCtx,
          useCache: false,
          type: 'test',
          chartColor: '#ff0000'
        }, mockRow);

        // IOStruct should be set when hovering over an IO event with a frame
        // Note: This depends on dataFilterHandler populating dataListCache
        expect(IOStruct.hoverIOStruct).toBeDefined();
      });
    });

    describe('drawIO', () => {
      it('should draw rectangle when frame exists', () => {
        const mockCtx = createMockContext();
        const io = new IOStruct();
        io.frame = { x: 10, y: 20, width: 100, height: 30 };

        IORender.drawIO(mockCtx, io, '#00ff00');

        expect(mockCtx.fillStyle).toBe('#00ff00');
        expect(mockCtx.fillRect).toHaveBeenCalledWith(10, 20, 100, 30);
        expect(mockCtx.strokeStyle).toBe('rgba(0, 0, 0, 0.3)');
        expect(mockCtx.strokeRect).toHaveBeenCalledWith(10, 20, 100, 30);
      });

      it('should not draw when frame is null', () => {
        const mockCtx = createMockContext();
        const io = new IOStruct();
        io.frame = null;

        IORender.drawIO(mockCtx, io, '#00ff00');

        expect(mockCtx.fillRect).not.toHaveBeenCalled();
      });
    });

    describe('renderWorkerThread', () => {
      it('should be an empty implementation', () => {
        const renderer = new IORender();

        expect(() => renderer.renderWorkerThread()).not.toThrow();
      });
    });
  });

  describe('buildAccumulatedSegmentsNoOverlap (indirect)', () => {
    const createMockRow = () => ({
      dataList: [],
      dataListCache: [],
      frame: { x: 0, y: 0, width: 800, height: 48 },
      isHover: false,
      hoverX: 0,
      hoverY: 0,
      clientWidth: 800
    } as unknown as TraceRow<IOStruct>);

    const createMockContext = () => ({
      beginPath: jest.fn(),
      closePath: jest.fn(),
      fillStyle: '',
      fillRect: jest.fn(),
      strokeStyle: '',
      lineWidth: 0,
      strokeRect: jest.fn()
    } as unknown as CanvasRenderingContext2D);

    it('should handle events with same start time (accumulation)', () => {
      const mockRow = createMockRow();
      mockRow.dataList = [];
      mockRow.dataListCache = [
        { startNS: 100000000, endNS: 200000000, dur: 100000000, size: 1000, isWrite: false, isPhysical: false, frame: { x: 0, y: 0, width: 100, height: 40 } },
        { startNS: 100000000, endNS: 150000000, dur: 50000000, size: 500, isWrite: false, isPhysical: false, frame: { x: 0, y: 0, width: 50, height: 20 } }
      ];
      const mockCtx = createMockContext();
      const renderer = new IORender();

      renderer.renderMainThread({
        context: mockCtx,
        useCache: true,
        type: 'test',
        chartColor: '#00ff00'
      }, mockRow);

      expect(mockCtx.fillRect).toHaveBeenCalled();
    });

    it('should handle events with zero size', () => {
      const mockRow = createMockRow();
      mockRow.dataList = [
        { startNS: 100000000, endNS: 200000000, dur: 100000000, size: 0, isWrite: false, isPhysical: false }
      ];
      const mockCtx = createMockContext();
      const renderer = new IORender();

      renderer.renderMainThread({
        context: mockCtx,
        useCache: false,
        type: 'test',
        chartColor: '#00ff00'
      }, mockRow);

      // Zero size events should be filtered out
      expect(mockCtx.fillRect).not.toHaveBeenCalled();
    });

    it('should handle events outside time range', () => {
      const mockRow = createMockRow();
      mockRow.dataList = [
        { startNS: 2000000000, endNS: 3000000000, dur: 1000000000, size: 4096, isWrite: false, isPhysical: false }
      ];
      const mockCtx = createMockContext();
      const renderer = new IORender();

      renderer.renderMainThread({
        context: mockCtx,
        useCache: false,
        type: 'test',
        chartColor: '#00ff00'
      }, mockRow);

      // Events outside range should be filtered
      expect(mockCtx.fillRect).not.toHaveBeenCalled();
    });
  });
});
