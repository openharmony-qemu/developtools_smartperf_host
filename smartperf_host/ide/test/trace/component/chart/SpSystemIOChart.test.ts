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

// Mock SqlLite before any imports to avoid import.meta.url issues
jest.mock('../../../../src/trace/database/SqlLite', () => ({
  query: jest.fn().mockResolvedValue([]),
  threadPool: { addTask: jest.fn() },
  threadPool2: { addTask: jest.fn() }
}));

// Mock queryAllIOProcess
const mockQueryAllIOProcess = jest.fn();
jest.mock('../../../../src/trace/database/sql/IO.sql', () => ({
  queryAllIOProcess: () => mockQueryAllIOProcess()
}));

// Mock IOStruct
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorkerIO', () => ({
  IORender: jest.fn(),
  IOStruct: {
    hoverIOStruct: null,
    render: jest.fn()
  }
}));

// Mock renders
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => ({
  renders: {
    empty: { renderMainThread: jest.fn() },
    io: { renderMainThread: jest.fn() }
  }
}));

// Mock ResizeObserver
window.ResizeObserver = window.ResizeObserver || jest.fn().mockImplementation(() => ({
  disconnect: jest.fn(),
  observe: jest.fn(),
  unobserve: jest.fn(),
}));

import { SpSystemIOChart } from '../../../../src/trace/component/chart/SpSystemIOChart';
import { SpSystemTrace } from '../../../../src/trace/SpSystemTrace';
import { TraceRow } from '../../../../src/trace/trace/base/TraceRow';
import { ColorUtils } from '../../../../src/trace/trace/base/ColorUtils';
import { BaseStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerCommon';
import { ioSender } from '../../../../src/trace/database/data-trafic/IOSender';

// Mock ioSender
jest.mock('../../../../src/trace/database/data-trafic/IOSender', () => ({
  ioSender: jest.fn()
}));

describe('SpSystemIOChart Test', () => {
  let mockTrace: Partial<SpSystemTrace>;
  let mockCanvasCtx: Partial<CanvasRenderingContext2D>;
  let ioChart: SpSystemIOChart;

  beforeEach(() => {
    mockCanvasCtx = {
      clearRect: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
    } as Partial<CanvasRenderingContext2D>;

    mockTrace = {
      canvasPanelCtx: mockCanvasCtx as CanvasRenderingContext2D,
      favoriteChangeHandler: jest.fn(),
      selectChangeHandler: jest.fn(),
      rowsEL: {
        appendChild: jest.fn()
      } as unknown as HTMLElement
    };

    ioChart = new SpSystemIOChart(mockTrace as SpSystemTrace);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create SpSystemIOChart instance with trace', () => {
      expect(ioChart).toBeDefined();
    });
  });

  describe('init', () => {
    it('should return early when no processes found', async () => {
      mockQueryAllIOProcess.mockResolvedValue([]);

      const result = await ioChart.init();

      expect(result).toBeUndefined();
      expect(mockTrace.rowsEL?.appendChild).not.toHaveBeenCalled();
    });

    it('should return early when processes is null', async () => {
      mockQueryAllIOProcess.mockResolvedValue(null);

      const result = await ioChart.init();

      expect(result).toBeUndefined();
      expect(mockTrace.rowsEL?.appendChild).not.toHaveBeenCalled();
    });

    it('should init lanes when processes exist', async () => {
      mockQueryAllIOProcess.mockResolvedValue([{ pid: 1234 }]);

      await ioChart.init();

      expect(mockTrace.rowsEL?.appendChild).toHaveBeenCalled();
    });
  });

  describe('initFolderAndLanes', () => {
    it('should create folder with correct properties', async () => {
      mockQueryAllIOProcess.mockResolvedValue([{ pid: 1234 }]);

      await ioChart.init();

      expect(mockTrace.rowsEL?.appendChild).toHaveBeenCalled();
      const folder = (mockTrace.rowsEL?.appendChild as jest.Mock).mock.calls[0][0];
      expect(folder.rowId).toBe('SystemIO');
      expect(folder.index).toBe(0);
      expect(folder.rowType).toBe(TraceRow.ROW_TYPE_FILE_SYSTEM_GROUP);
      expect(folder.folder).toBe(true);
      expect(folder.name).toBe('System IO');
    });

    it('should create 4 IO lanes', async () => {
      mockQueryAllIOProcess.mockResolvedValue([{ pid: 1234 }]);

      await ioChart.init();

      const folder = (mockTrace.rowsEL?.appendChild as jest.Mock).mock.calls[0][0];
      expect(folder.addChildTraceRow).toHaveBeenCalledTimes(4);
    });

    it('should create Logical Read lane with correct color', async () => {
      mockQueryAllIOProcess.mockResolvedValue([{ pid: 1234 }]);

      await ioChart.init();

      const folder = (mockTrace.rowsEL?.appendChild as jest.Mock).mock.calls[0][0];
      const logicalReadCall = folder.addChildTraceRow.mock.calls.find(
        (call: unknown[]) => call[0]?.rowId === 'io-system-logical-read'
      );
      expect(logicalReadCall).toBeDefined();
      expect(logicalReadCall[0].name).toBe('Logical Read');
    });

    it('should create Logical Write lane', async () => {
      mockQueryAllIOProcess.mockResolvedValue([{ pid: 1234 }]);

      await ioChart.init();

      const folder = (mockTrace.rowsEL?.appendChild as jest.Mock).mock.calls[0][0];
      const logicalWriteCall = folder.addChildTraceRow.mock.calls.find(
        (call: unknown[]) => call[0]?.rowId === 'io-system-logical-write'
      );
      expect(logicalWriteCall).toBeDefined();
      expect(logicalWriteCall[0].name).toBe('Logical Write');
    });

    it('should create Physical Read lane', async () => {
      mockQueryAllIOProcess.mockResolvedValue([{ pid: 1234 }]);

      await ioChart.init();

      const folder = (mockTrace.rowsEL?.appendChild as jest.Mock).mock.calls[0][0];
      const physicalReadCall = folder.addChildTraceRow.mock.calls.find(
        (call: unknown[]) => call[0]?.rowId === 'io-system-physical-read'
      );
      expect(physicalReadCall).toBeDefined();
      expect(physicalReadCall[0].name).toBe('Physical Read');
    });

    it('should create Physical Write lane', async () => {
      mockQueryAllIOProcess.mockResolvedValue([{ pid: 1234 }]);

      await ioChart.init();

      const folder = (mockTrace.rowsEL?.appendChild as jest.Mock).mock.calls[0][0];
      const physicalWriteCall = folder.addChildTraceRow.mock.calls.find(
        (call: unknown[]) => call[0]?.rowId === 'io-system-physical-write'
      );
      expect(physicalWriteCall).toBeDefined();
      expect(physicalWriteCall[0].name).toBe('Physical Write');
    });
  });

  describe('initLane', () => {
    it('should create lane with correct properties', async () => {
      mockQueryAllIOProcess.mockResolvedValue([{ pid: 1234 }]);

      await ioChart.init();

      const folder = (mockTrace.rowsEL?.appendChild as jest.Mock).mock.calls[0][0];
      const lane = folder.addChildTraceRow.mock.calls[0][0];

      expect(lane.rowType).toBe(TraceRow.ROW_TYPE_FILE_SYSTEM_IO);
      expect(lane.rowHidden).toBe(!folder.expansion);
      expect(lane.style.height).toBe('48px');
      expect(lane.name).toBeDefined();
    });

    it('should set supplierFrame function', async () => {
      mockQueryAllIOProcess.mockResolvedValue([{ pid: 1234 }]);

      await ioChart.init();

      const folder = (mockTrace.rowsEL?.appendChild as jest.Mock).mock.calls[0][0];
      const lane = folder.addChildTraceRow.mock.calls[0][0];

      expect(lane.supplierFrame).toBeDefined();
      expect(typeof lane.supplierFrame).toBe('function');
    });

    it('should set onThreadHandler function', async () => {
      mockQueryAllIOProcess.mockResolvedValue([{ pid: 1234 }]);

      await ioChart.init();

      const folder = (mockTrace.rowsEL?.appendChild as jest.Mock).mock.calls[0][0];
      const lane = folder.addChildTraceRow.mock.calls[0][0];

      expect(lane.onThreadHandler).toBeDefined();
      expect(typeof lane.onThreadHandler).toBe('function');
    });
  });

  describe('focusIOHandler', () => {
    it('should display tip with hover IO struct size', () => {
      const mockDisplayTip = jest.fn();
      (mockTrace as any).displayTip = mockDisplayTip;

      const mockRow = {
        getHoverStruct: jest.fn().mockReturnValue({ size: 4096, group10Ms: false })
      } as unknown as TraceRow;

      // Access private method via any
      (ioChart as any).focusIOHandler(mockRow);

      expect(mockDisplayTip).toHaveBeenCalled();
    });

    it('should handle hover IO struct with group10Ms', () => {
      const mockDisplayTip = jest.fn();
      (mockTrace as any).displayTip = mockDisplayTip;

      const mockRow = {
        getHoverStruct: jest.fn().mockReturnValue({ size: 4096, group10Ms: true })
      } as unknown as TraceRow;

      (ioChart as any).focusIOHandler(mockRow);

      expect(mockDisplayTip).toHaveBeenCalled();
    });

    it('should handle null hover IO struct', () => {
      const mockDisplayTip = jest.fn();
      (mockTrace as any).displayTip = mockDisplayTip;

      const mockRow = {
        getHoverStruct: jest.fn().mockReturnValue(null)
      } as unknown as TraceRow;

      (ioChart as any).focusIOHandler(mockRow);

      expect(mockDisplayTip).toHaveBeenCalled();
    });

    it('should handle zero size', () => {
      const mockDisplayTip = jest.fn();
      (mockTrace as any).displayTip = mockDisplayTip;

      const mockRow = {
        getHoverStruct: jest.fn().mockReturnValue({ size: 0, group10Ms: false })
      } as unknown as TraceRow;

      (ioChart as any).focusIOHandler(mockRow);

      expect(mockDisplayTip).toHaveBeenCalled();
    });
  });
});
