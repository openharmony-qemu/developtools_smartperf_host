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

import {
  SelectionParam,
  BoxJumpParam,
  SelectionData,
  Counter,
  Fps,
  GpuCounter,
  SliceBoxJumpParam,
} from '../../../src/trace/bean/BoxSelection';
import { TraceRow } from '../../../src/trace/component/trace/base/TraceRow';
import { SpSystemTrace } from '../../../src/trace/component/SpSystemTrace';
jest.mock('../../../src/js-heap/model/DatabaseStruct', () => {
  return {};
});
jest.mock('../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../src/trace/component/chart/FrameChart', () => {
  return {};
});

jest.mock('../../../src/trace/component/trace/sheet/task/TabPaneTaskFrames', () => {
  return {};
});

jest.mock('../../../src/trace/component/trace/sheet/native-memory/TabPaneNMCallTree', () => {
  return {};
});

jest.mock('../../../src/trace/component/trace/base/TraceSheet', () => {
  return {};
});

// @ts-ignore
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));
window.IntersectionObserver = jest.fn();

describe('BoxSelection Test', () => {
  let sp = new SpSystemTrace();
  let itRow = new TraceRow();
  let selectionParam = new SelectionParam();
  it('BoxSelectionTest01', () => {
    let selectionParam: SelectionParam;
    selectionParam = {
      recordStartNs: 0,
      cpus: 1,
      threadIds: 2,
      trackIds: 1,
      funTids: 2,
      heapIds: 1,
      nativeMemory: 3,
      leftNs: 1,
      rightNs: 1,
      hasFps: true,
      statisticsSelectData: 1,
      perfAll: true,
    };
    expect(selectionParam).not.toBeUndefined();
    expect(selectionParam).toMatchInlineSnapshot(
      {
        recordStartNs: expect.any(Number),
        cpus: expect.any(Number),
        threadIds: expect.any(Number),
        trackIds: expect.any(Number),
        funTids: expect.any(Number),
        heapIds: expect.any(Number),
        nativeMemory: expect.any(Number),
        leftNs: expect.any(Number),
        rightNs: expect.any(Number),
        hasFps: expect.any(Boolean),
        perfAll: expect.any(Boolean),
      },
      `
{
  "cpus": Any<Number>,
  "funTids": Any<Number>,
  "hasFps": Any<Boolean>,
  "heapIds": Any<Number>,
  "leftNs": Any<Number>,
  "nativeMemory": Any<Number>,
  "perfAll": Any<Boolean>,
  "recordStartNs": Any<Number>,
  "rightNs": Any<Number>,
  "statisticsSelectData": 1,
  "threadIds": Any<Number>,
  "trackIds": Any<Number>,
}
`
    );
  });

  it('BoxSelectionTest02', function () {
    let boxJumpParam: BoxJumpParam;
    boxJumpParam = {
      leftNs: 0,
      rightNs: 0,
      state: '',
      processId: 0,
      threadId: 0,
    };
    expect(boxJumpParam).not.toBeUndefined();
    expect(boxJumpParam).toMatchInlineSnapshot(
      {
        leftNs: expect.any(Number),
        rightNs: expect.any(Number),
        state: expect.any(String),
        processId: expect.any(Number),
        threadId: expect.any(Number),
      },
      `
{
  "leftNs": Any<Number>,
  "processId": Any<Number>,
  "rightNs": Any<Number>,
  "state": Any<String>,
  "threadId": Any<Number>,
}
`
    );
  });

  it('BoxSelectionTest03', function () {
    let selectionData: SelectionData;
    selectionData = {
      name: 'name',
      process: 'process',
      pid: 'pid',
      thread: 'thread',
      tid: 'tid',
      wallDuration: 0,
      avgDuration: 'avgDuration',
      occurrences: 0,
      state: 'state',
      trackId: 0,
      delta: 'delta',
      rate: 'rate',
      avgWeight: 'avgWeight',
      count: 'count',
      first: 'first',
      last: 'last',
      min: 'min',
      max: 'max',
      stateJX: 'stateJX',
    };
    expect(selectionData).not.toBeUndefined();
    expect(selectionData).toMatchInlineSnapshot(
      {
        process: expect.any(String),
        pid: expect.any(String),
        thread: expect.any(String),
        tid: expect.any(String),
        wallDuration: expect.any(Number),
        avgDuration: expect.any(String),
        occurrences: expect.any(Number),
        state: expect.any(String),
        trackId: expect.any(Number),
        delta: expect.any(String),
        rate: expect.any(String),
        avgWeight: expect.any(String),
        count: expect.any(String),
        first: expect.any(String),
        last: expect.any(String),
        min: expect.any(String),
        max: expect.any(String),
        stateJX: expect.any(String),
      },
      `
{
  "avgDuration": Any<String>,
  "avgWeight": Any<String>,
  "count": Any<String>,
  "delta": Any<String>,
  "first": Any<String>,
  "last": Any<String>,
  "max": Any<String>,
  "min": Any<String>,
  "name": "name",
  "occurrences": Any<Number>,
  "pid": Any<String>,
  "process": Any<String>,
  "rate": Any<String>,
  "state": Any<String>,
  "stateJX": Any<String>,
  "thread": Any<String>,
  "tid": Any<String>,
  "trackId": Any<Number>,
  "wallDuration": Any<Number>,
}
`
    );
  });

  it('BoxSelectionTest04', function () {
    let counter: Counter;
    counter = {
      id: 0,
      trackId: 0,
      name: '',
      value: 0,
      startTime: 0,
    };
    expect(counter).not.toBeUndefined();
    expect(counter).toMatchInlineSnapshot(
      {
        id: expect.any(Number),
        trackId: expect.any(Number),
        name: expect.any(String),
        value: expect.any(Number),
        startTime: expect.any(Number),
      },
      `
{
  "id": Any<Number>,
  "name": Any<String>,
  "startTime": Any<Number>,
  "trackId": Any<Number>,
  "value": Any<Number>,
}
`
    );
  });

  it('BoxSelectionTest05', function () {
    let fps: Fps;
    fps = {
      startNS: 0,
      timeStr: '',
      fps: 0,
    };
    expect(fps).not.toBeUndefined();
    expect(fps).toMatchInlineSnapshot(
      {
        startNS: expect.any(Number),
        timeStr: expect.any(String),
        fps: expect.any(Number),
      },
      `
{
  "fps": Any<Number>,
  "startNS": Any<Number>,
  "timeStr": Any<String>,
}
`
    );
  });

  it('BoxSelectionTest06', function () {
    let it: TraceRow<any> = {
      intersectionRatio: 0,
      isHover: true,
      hoverX: 129,
      hoverY: 113,
      index: 0,
      must: true,
      isTransferCanvas: true,
      isComplete: true,
      dataList: [
        {
          detail: '自绘制buffer轮转(视频/鼠标等)',
          depth: 2,
          name: 'ConsumeAndUpdateAllNodes',
          parentName: 'unknown-1',
          property: [
            {
              name: 'ConsumeAndUpdateAllNodes',
              detail: '自绘制buffer轮转(视频/鼠标等)',
              end: 512062139514826,
              begin: 512062139339305,
              depth: 2,
              instructions: 0,
              cycles: 2,
              frame: {
                x: 0,
                y: 40,
                width: 1,
                height: 20,
              },
              startTs: 512062138606492,
              textMetricsWidth: 289.8828125,
            },
          ],
        },
      ],
      dataList2: [],
      dataListCache: [
        {
          name: 'OnReadable',
          detail: 'OnVsync信号回调',
          end: 512062163748680,
          begin: 512062138606492,
          depth: 0,
          instructions: 132,
          cycles: 471,
          frame: {
            x: 0,
            y: 0,
            width: 1,
            height: 20,
          },
          startTs: 512062138606492,
          textMetricsWidth: 146.8896484375,
        },
        {
          name: 'OnReadable',
          detail: 'OnVsync信号回调',
          end: 512062233204930,
          begin: 512062222968471,
          depth: 0,
          instructions: 144,
          cycles: 281,
          frame: {
            x: 1,
            y: 0,
            width: 1,
            height: 20,
          },
          startTs: 512062138606492,
          textMetricsWidth: 146.8896484375,
        },
      ],
      fixedList: [],
      sliceCache: [-1, -1],
      canvas: [],
      dpr: 1,
      offscreen: [],
      canvasWidth: 0,
      canvasHeight: 0,
      isLoading: false,
      tampName: '',
      templateType: {},
      _rangeSelect: true,
      _drawType: 0,
      _enableCollapseChart: false,
      online: false,
      translateY: 0,
      childrenList: [],
      loadingFrame: false,
      needRefresh: true,
      funcMaxHeight: 0,
      sleeping: true,
      fragment: {},
      loadingPin1: 0,
      loadingPin2: 0,
      args: {
        alpha: false,
        canvasNumber: 0,
        contextId: '',
        isOffScreen: false,
        skeleton: true,
      },
      rootEL: {},
      checkBoxEL: {
        args: null,
        checkbox: {},
      },
      collectEL: {
        args: null,
        icon: {},
        use: {},
        d: null,
      },
      describeEl: {},
      nameEL: {},
      canvasVessel: null,
      tipEL: null,
      sampleUploadEl: {},
      jsonFileEl: {},
      _frame: {
        x: 0,
        y: 0,
        height: 140,
        width: 422,
      },
      rowType: 'sample',
    };

    TraceRow.rangeSelectObject = {
      startX: 100,
      endX: 1000,
      startNS: 0,
      endNS: 100000,
    };
    expect(selectionParam.pushSampleData(itRow)).toBeUndefined();
  });

  it('BoxSelectionTest07', function () {
    itRow.rowType = 'cpu-data';
    itRow.rowId = '10';
    expect(selectionParam.pushCpus(itRow)).toBeUndefined();
  });

  it('BoxSelectionTest08', function () {
    itRow.rowType = 'cpu-state';
    itRow.rowId = '10';
    expect(selectionParam.pushCpuStateFilterIds(itRow)).toBeUndefined();
  });

  it('BoxSelectionTest09', function () {
    itRow.rowType = 'cpu-State';
    itRow.childrenList = [];
    expect(selectionParam.pushCpuStateFilterIds(itRow)).toBeUndefined();
  });

  it('BoxSelectionTest10', function () {
    itRow.rowType = 'cpu-frequency';
    itRow.childrenList = [];
    expect(selectionParam.pushCpuFreqFilter(itRow)).toBeUndefined();
  });

  it('BoxSelectionTest11', function () {
    itRow.rowType = 'cpu-freq';
    itRow.rowId = '10';
    itRow.name = 'aaa';
    itRow.childrenList = [];
    expect(selectionParam.pushCpuFreqFilter(itRow)).toBeUndefined();
  });

  it('BoxSelectionTest12', function () {
    itRow.rowType = 'cpu-frequency-limit';
    itRow.rowId = '10';
    itRow.name = 'aaa';
    itRow.childrenList = [];
    expect(selectionParam.pushCpuFreqLimit(itRow)).toBeUndefined();
  });

  it('BoxSelectionTest13', function () {
    itRow.setAttribute('cpu', '1');
    itRow.rowType = 'cpu-limit-freq';
    itRow.rowId = '10';
    itRow.childrenList = [];
    expect(selectionParam.pushCpuFreqLimit(itRow)).toBeUndefined();
  });

  it('BoxSelectionTest14', function () {
    itRow.rowType = 'process';
    itRow.rowId = '99';
    itRow.setAttribute('hasStartup', 'true');
    itRow.setAttribute('hasStaticInit', 'false');
    itRow.expansion = false;
    itRow.childrenList = [];
    expect(selectionParam.pushProcess(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest15', function () {
    itRow.rowType = 'native-memory';
    itRow.rowId = '11';
    itRow.expansion = false;
    itRow.childrenList = [];
    expect(selectionParam.pushNativeMemory(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest16', function () {
    itRow.rowType = 'func';
    itRow.asyncFuncName = '11';
    itRow.expansion = false;
    itRow.asyncFuncNamePID = 5;
    itRow.rowId = '7';
    expect(selectionParam.pushNativeMemory(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest17', function () {
    itRow.rowType = 'heap';
    itRow.rowParentId = '11 12 5';
    itRow.setAttribute('heap-type', 'native_hook_statistic');
    itRow.rowId = '7';
    expect(selectionParam.pushHeap(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest18', function () {
    itRow.rowType = 'ability-monitor';
    itRow.rowId = '8';
    itRow.expansion = false;
    itRow.childrenList = [];
    expect(selectionParam.pushMonitor(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest19', function () {
    itRow.rowType = 'hiperf-event';
    expect(selectionParam.pushHiperf(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest20', function () {
    itRow.rowType = 'hiperf-report';
    expect(selectionParam.pushHiperf(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest21', function () {
    itRow.rowType = 'hiperf-callchart';
    itRow.drawType = 7;
    itRow.getRowSettingKeys = jest.fn(() => ['5']);
    expect(selectionParam.pushHiperf(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest22', function () {
    itRow.rowType = 'hiperf-process';
    itRow.rowId = '18';
    itRow.expansion = false;
    itRow.childrenList = [];
    expect(selectionParam.pushHiperf(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest23', function () {
    itRow.rowType = 'hiperf';
    expect(selectionParam.pushHiperf(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest24', function () {
    itRow.rowType = 'hiperf-cpu';
    itRow.index = 5;
    expect(selectionParam.pushHiperf(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest25', function () {
    itRow.rowType = 'hiperf-thread';
    itRow.rowId = '5-7';
    expect(selectionParam.pushHiperf(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest26', function () {
    itRow.rowType = 'file-system-cell';
    itRow.rowId = 'FileSystemLogicalWrite';
    selectionParam.fileSystemType = [];
    expect(selectionParam.pushFileSystem(itRow, sp)).toBeUndefined();
    selectionParam.pushFileSystem(itRow, sp);
    expect(selectionParam.fileSystemType).toEqual([0, 1, 3]);
  });

  it('BoxSelectionTest26', function () {
    itRow.rowType = 'file-system-cell';
    itRow.rowId = 'FileSystemLogicalWrite';
    selectionParam.fileSystemType = [1, 1, 1, -1];
    expect(selectionParam.pushFileSystem(itRow, sp)).toBeUndefined();
    selectionParam.pushFileSystem(itRow, sp);
    expect(selectionParam.fileSystemType).toEqual([1, 1, 1, -1, 3]);
  });

  it('BoxSelectionTest27', function () {
    itRow.rowType = 'file-system-cell';
    itRow.rowId = 'FileSystemLogicalRead';
    selectionParam.fileSystemType = [];
    expect(selectionParam.pushFileSystem(itRow, sp)).toBeUndefined();
    selectionParam.pushFileSystem(itRow, sp);
    expect(selectionParam.fileSystemType).toEqual([0, 1, 2]);
  });

  it('BoxSelectionTest28', function () {
    itRow.rowType = 'file-system-cell';
    itRow.rowId = 'FileSystemLogicalRead';
    selectionParam.fileSystemType = [1, 1, -1];
    expect(selectionParam.pushFileSystem(itRow, sp)).toBeUndefined();
    selectionParam.pushFileSystem(itRow, sp);
    expect(selectionParam.fileSystemType).toEqual([1, 1, -1, 2]);
  });

  it('BoxSelectionTest29', function () {
    itRow.rowType = 'file-system-cell';
    itRow.rowId = 'FileSystemVirtualMemory';
    selectionParam.fileSystemType = [1, 1, -1];
    expect(selectionParam.pushFileSystem(itRow, sp)).toBeUndefined();
    selectionParam.pushFileSystem(itRow, sp);
    expect(selectionParam.fileSysVirtualMemory).toBeTruthy();
  });

  it('BoxSelectionTest30', function () {
    itRow.rowType = 'file-system-cell';
    itRow.rowId = 'FileSystemDiskIOLatency';
    selectionParam.fileSystemType = [1, 1, -1];
    expect(selectionParam.pushFileSystem(itRow, sp)).toBeUndefined();
    selectionParam.pushFileSystem(itRow, sp);
    expect(selectionParam.diskIOLatency).toBeTruthy();
  });

  it('BoxSelectionTest31', function () {
    itRow.rowType = 'VmTracker';
    itRow.rowId = '55';
    itRow.expansion = false;
    let child = new TraceRow();
    child.rowType = 'dma-vmTracker';
    itRow.childrenList = [child];
    expect(selectionParam.pushVmTracker(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest32', function () {
    itRow.rowType = 'VmTracker';
    itRow.rowId = '100';
    itRow.expansion = false;
    let child = new TraceRow();
    child.rowType = 'sys-memory-gpu';
    itRow.childrenList = [child];
    expect(selectionParam.pushVmTracker(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest33', function () {
    itRow.rowType = 'VmTracker';
    itRow.rowId = '100';
    itRow.expansion = false;
    let child = new TraceRow();
    child.rowType = 'purgeable-total-vm';
    itRow.childrenList = [child];
    expect(selectionParam.pushVmTracker(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest34', function () {
    itRow.rowType = 'VmTracker';
    itRow.rowId = '100';
    itRow.expansion = false;
    let child = new TraceRow();
    child.rowType = 'purgeable-pin-vm';
    itRow.childrenList = [child];
    expect(selectionParam.pushVmTracker(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest35', function () {
    itRow.rowType = 'VmTracker';
    itRow.rowId = '110';
    itRow.expansion = false;
    let child = new TraceRow();
    child.rowType = 'smaps';
    itRow.childrenList = [child];
    expect(selectionParam.pushVmTracker(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest36', function () {
    itRow.rowType = 'VmTracker';
    itRow.rowId = '10';
    itRow.expansion = false;
    let child = new TraceRow();
    child.rowType = 'VmTracker-shm';
    itRow.childrenList = [child];
    expect(selectionParam.pushVmTracker(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest37', function () {
    itRow.rowType = 'janks';
    itRow.rowId = '50';
    itRow.name == 'Actual Timeline';
    itRow.rowParentId === 'frameTime';
    itRow.dataListCache = [];
    expect(selectionParam.pushJank(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest38', function () {
    TraceRow.range = {
      refresh: true,
      xsTxt: ['a'],
      startX: 100,
      endX: 1000,
      startNS: 0,
      endNS: 100000,
      slicesTime: {
        color: 'red',
        startTime: 1000,
        endTime: 5000,
      },
      scale: 5000,
      totalNS: 10000,
      xs: [100],
    };
    itRow.rowType = 'heap-timeline';
    itRow.rowId = '50';
    itRow.name == 'Actual Timeline';
    itRow.rowParentId === 'frameTime';
    itRow.dataListCache = [];
    expect(selectionParam.pushHeapTimeline(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest39', function () {
    itRow.rowType = 'js-cpu-profiler-cell';
    itRow.rowId = '50';
    itRow.dataListCache = [];
    expect(selectionParam.pushJsCpuProfiler(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest40', function () {
    itRow.rowType = 'sys-memory-gpu';
    itRow.rowId = '40';
    itRow.childrenList = [];
    expect(selectionParam.pushSysMemoryGpu(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest41', function () {
    itRow.rowType = 'sdk';
    itRow.rowId = '45';
    itRow.childrenList = [];
    expect(selectionParam.pushSDK(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest42', function () {
    itRow.rowType = 'sdk-counter';
    itRow.rowId = '47';
    expect(selectionParam.pushSDK(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest43', function () {
    itRow.rowType = 'sdk-slice';
    itRow.rowId = '98';
    expect(selectionParam.pushSDK(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest44', function () {
    itRow.rowType = 'smaps';
    itRow.rowId = '98';
    expect(selectionParam.pushVmTrackerSmaps(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest45', function () {
    itRow.rowType = 'irq-group';
    itRow.rowId = '98';
    itRow.childrenList = [];
    expect(selectionParam.pushIrq(itRow)).toBeUndefined();
  });

  it('BoxSelectionTest46', function () {
    itRow.rowType = 'irq';
    itRow.rowId = '98';
    itRow.setAttribute('callId', '45');
    itRow.childrenList = [];
    expect(selectionParam.pushIrq(itRow)).toBeUndefined();
  });

  it('BoxSelectionTest47', function () {
    itRow.rowType = 'sys-memory-gpu-gl';
    itRow.rowId = '98';
    itRow.dataListCache = [];
    expect(selectionParam.pushSysMemoryGpuGl(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest48', function () {
    itRow.rowType = 'frame-dynamic';
    itRow.rowId = '98';
    itRow.dataListCache = [];
    itRow.setAttribute('model-name', 'dd');
    expect(selectionParam.pushFrameDynamic(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest49', function () {
    itRow.rowType = 'frame-spacing';
    itRow.rowId = '98';
    itRow.dataListCache = [];
    expect(selectionParam.pushFrameSpacing(itRow)).toBeUndefined();
  });

  it('BoxSelectionTest50', function () {
    itRow.rowType = 'frame-animation';
    itRow.rowId = '98';
    itRow.dataListCache = [];
    expect(selectionParam.pushFrameAnimation(itRow)).toBeUndefined();
  });

  it('BoxSelectionTest51', function () {
    itRow.rowType = 'sys-memory-gpu-window';
    itRow.rowId = '98';
    itRow.dataListCache = [];
    expect(selectionParam.pushSysMemoryGpuWindow(itRow)).toBeUndefined();
  });

  it('BoxSelectionTest52', function () {
    itRow.rowType = 'sys-memory-gpu-total';
    itRow.rowId = '98';
    itRow.dataListCache = [];
    expect(selectionParam.pushSysMemoryGpuTotal(itRow)).toBeUndefined();
  });

  it('BoxSelectionTest53', function () {
    itRow.rowType = 'sys-memory-gpu-graph';
    itRow.rowId = '98';
    itRow.dataListCache = [];
    expect(selectionParam.pushSysMemoryGpuGraph(itRow)).toBeUndefined();
  });

  it('BoxSelectionTest54', function () {
    itRow.rowType = 'static-init';
    itRow.rowId = '98';
    expect(selectionParam.pushStaticInit(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest55', function () {
    itRow.rowType = 'app-startup';
    itRow.rowId = '98';
    itRow.rowParentId = '55';
    expect(selectionParam.pushAppStartUp(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest56', function () {
    itRow.rowType = 'thread';
    itRow.rowId = '98';
    expect(selectionParam.pushThread(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest57', function () {
    itRow.rowType = 'mem';
    itRow.rowId = '98';
    expect(selectionParam.pushVirtualMemory(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest58', function () {
    itRow.rowType = 'virtual-memory-cell';
    itRow.rowId = '98';
    expect(selectionParam.pushVirtualMemory(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest59', function () {
    itRow.rowType = 'fps';
    itRow.rowId = '98';
    expect(selectionParam.pushFps(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest60', function () {
    itRow.rowType = 'cpu-ability';
    itRow.rowId = '98';
    expect(selectionParam.pushCpuAbility(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest61', function () {
    itRow.rowType = 'memory-ability';
    itRow.rowId = '98';
    expect(selectionParam.pushMemoryAbility(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest62', function () {
    itRow.rowType = 'disk-ability';
    itRow.rowId = '98';
    expect(selectionParam.pushDiskAbility(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest63', function () {
    itRow.rowType = 'network-ability';
    itRow.rowId = '98';
    expect(selectionParam.pushNetworkAbility(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest64', function () {
    itRow.rowType = 'dma-ability';
    itRow.rowId = '98';
    expect(selectionParam.pushDmaAbility(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest65', function () {
    itRow.rowType = 'gpu-memory-ability';
    itRow.rowId = '98';
    expect(selectionParam.pushGpuMemoryAbility(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest66', function () {
    itRow.rowType = 'power-energy';
    itRow.rowId = '98';
    expect(selectionParam.pushPowerEnergy(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest67', function () {
    itRow.rowType = 'system-energy';
    itRow.rowId = '98';
    expect(selectionParam.pushSystemEnergy(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest68', function () {
    itRow.rowType = 'anomaly-energy';
    itRow.rowId = '98';
    expect(selectionParam.pushAnomalyEnergy(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest69', function () {
    itRow.rowType = 'VmTracker-shm';
    itRow.rowId = '98';
    expect(selectionParam.pushVmTrackerShm(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest70', function () {
    itRow.rowType = 'clock-group';
    itRow.rowId = '98';
    expect(selectionParam.pushClock(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest71', function () {
    itRow.rowType = 'gpu-memory-vmTracker';
    itRow.rowId = '98';
    expect(selectionParam.pushGpuMemoryVmTracker(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest72', function () {
    itRow.rowType = 'dma-vmTracker';
    itRow.rowId = '98';
    expect(selectionParam.pushDmaVmTracker(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest73', function () {
    itRow.rowType = 'purgeable-total-ability';
    itRow.rowId = '98';
    expect(selectionParam.pushPugreable(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest74', function () {
    itRow.rowType = 'purgeable-pin-ability';
    itRow.rowId = '98';
    expect(selectionParam.pushPugreablePinAbility(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest75', function () {
    itRow.rowType = 'purgeable-total-vm';
    itRow.rowId = '98';
    expect(selectionParam.pushPugreableTotalVm(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest76', function () {
    itRow.rowType = 'purgeable-pin-vm';
    itRow.rowId = '98';
    expect(selectionParam.pushPugreablePinVm(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest77', function () {
    itRow.rowType = 'logs';
    itRow.rowId = '98';
    expect(selectionParam.pushLogs(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest78', function () {
    itRow.rowType = 'hi-sysevent';
    itRow.rowId = '98';
    expect(selectionParam.pushHiSysEvent(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest79', function () {
    itRow.rowType = 'sample';
    itRow.rowId = '98';
    expect(selectionParam.pushSelection(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest80', () => {
    let data = new GpuCounter();
    data.startNS = 54;
    expect(data.startNS).toEqual(54);
  });

  it('BoxSelectionTest81', () => {
    let data = new Fps();
    data.startNS = 54;
    expect(data.startNS).toEqual(54);
  });

  it('BoxSelectionTest82', () => {
    let data = new Counter();
    data.trackId = 54;
    expect(data.trackId).toEqual(54);
  });

  it('BoxSelectionTest83', () => {
    let data = new BoxJumpParam();
    data.rightNs = 54;
    expect(data.rightNs).toEqual(54);
  });

  it('BoxSelectionTest84', () => {
    let data = new SliceBoxJumpParam();
    data.leftNs = 54;
    expect(data.leftNs).toEqual(54);
  });

  it('BoxSelectionTest85', function () {
    itRow.rowType = TraceRow.ROW_TYPE_XPOWER;
    itRow.rowId = '98';
    expect(selectionParam.pushXpower(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest86', function () {
    itRow.rowType = TraceRow.ROW_TYPE_XPOWER_SYSTEM_GROUP;
    itRow.rowId = '98';
    expect(selectionParam.pushXpower(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest87', function () {
    itRow.rowType = TraceRow.ROW_TYPE_XPOWER_STATISTIC;
    itRow.rowId = '98';
    expect(selectionParam.pushXpower(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest88', function () {
    itRow.rowType = TraceRow.ROW_TYPE_XPOWER_SYSTEM;
    itRow.rowId = 'Battery.RealCurrent';
    expect(selectionParam.pushXpower(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest89', function () {
    itRow.rowType = TraceRow.ROW_TYPE_XPOWER_APP_DETAIL_DISPLAY;
    itRow.rowId = '98';
    expect(selectionParam.pushXpower(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest90', function () {
    itRow.rowType = TraceRow.ROW_TYPE_XPOWER_WIFI_PACKETS;
    itRow.rowId = '98';
    expect(selectionParam.pushXpower(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest91', function () {
    itRow.rowType = TraceRow.ROW_TYPE_XPOWER_WIFI_BYTES;
    itRow.rowId = '98';
    expect(selectionParam.pushXpower(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest92', function () {
    itRow.rowType = TraceRow.ROW_TYPE_XPOWER_THREAD_COUNT;
    itRow.rowId = '98';
    expect(selectionParam.pushXpower(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest93', function () {
    itRow.rowType = TraceRow.ROW_TYPE_XPOWER_GPU_COUNT;
    itRow.rowId = '98';
    expect(selectionParam.pushXpower(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest94', function () {
    itRow.rowType = TraceRow.ROW_TYPE_XPOWER_THREAD_INFO;
    itRow.rowId = 'THREAD_ENERGY';
    expect(selectionParam.pushXpowerThreadInfo(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest95', function () {
    itRow.rowType = TraceRow.ROW_TYPE_XPOWER_THREAD_INFO;
    itRow.rowId = 'THREAD_LOAD';
    expect(selectionParam.pushXpowerThreadInfo(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest96', function () {
    itRow.rowType = TraceRow.ROW_TYPE_XPOWER_GPU_FREQUENCY;
    itRow.rowId = 'THREAD_LOAD';
    expect(selectionParam.pushXpowerGpuFreq(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest97', function () {
    itRow.rowType = TraceRow.ROW_TYPE_HANG_GROUP;
    itRow.rowId = 'THREAD_LOAD';
    expect(selectionParam.pushHang(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest98', function () {
    itRow.rowType = TraceRow.ROW_TYPE_HANG;
    itRow.rowId = 'THREAD_LOAD';
    expect(selectionParam.pushHang(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest99', function () {
    itRow.rowType = TraceRow.ROW_TYPE_PURGEABLE_PIN_ABILITY;
    itRow.rowId = 'THREAD_LOAD';
    expect(selectionParam.pushHang(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest100', function () {
    itRow.rowType = TraceRow.ROW_TYPE_PURGEABLE_TOTAL_VM;
    itRow.rowId = 'THREAD_LOAD';
    expect(selectionParam.pushHang(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest101', function () {
    itRow.rowType = TraceRow.ROW_TYPE_PURGEABLE_PIN_VM;
    itRow.rowId = 'THREAD_LOAD';
    expect(selectionParam.pushHang(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest102', function () {
    itRow.rowType = TraceRow.ROW_TYPE_DMA_FENCE;
    itRow.rowId = 'THREAD_LOAD';
    expect(selectionParam.pushDmaFence(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest103', function () {
    itRow.rowType = TraceRow.ROW_TYPE_CLOCK_GROUP;
    itRow.rowId = 'THREAD_LOAD';
    expect(selectionParam.pushClock(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest104', function () {
    itRow.rowType = TraceRow.ROW_TYPE_CLOCK;
    itRow.rowId = 'THREAD_LOAD';
    expect(selectionParam.pushClock(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest105', function () {
    itRow.rowType = TraceRow.ROW_TYPE_FILE_SYSTEM_GROUP;
    itRow.rowId = 'THREAD_LOAD';
    expect(selectionParam.pushFileSystem(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest106', function () {
    itRow.rowType = TraceRow.ROW_TYPE_FUNC;
    itRow.rowId = 'THREAD_LOAD';
    expect(selectionParam.pushFileSystem(itRow, sp)).toBeUndefined();
  });

  it('BoxSelectionTest107', function () {
    itRow.rowType = TraceRow.ROW_TYPE_SAMPLE;
    itRow.rowId = 'THREAD_LOAD';
    expect(selectionParam.pushSampleData(itRow)).toBeUndefined();
  });

  it('BoxSelectionTest108', function () {
    itRow.rowType = TraceRow.ROW_TYPE_CPU_STATE_ALL;
    itRow.rowId = 'THREAD_LOAD';
    expect(selectionParam.pushCpuStateFilterIds(itRow)).toBeUndefined();
  });

  it('BoxSelectionTest109', function () {
    itRow.rowType = TraceRow.ROW_TYPE_CPU_FREQ_LIMITALL;
    itRow.rowId = 'THREAD_LOAD';
    expect(selectionParam.pushCpuFreqLimit(itRow)).toBeUndefined();
  });

  it('BoxSelectionTest110', function () {
    itRow.rowType = TraceRow.ROW_TYPE_GPU_MEMORY_VMTRACKER;
    itRow.rowId = 'THREAD_LOAD';
    expect(selectionParam.vMTrackerGpuChildRowsEvery(itRow)).toBeUndefined();
  });

  it('BoxSelectionTest111', function () {
    itRow.rowType = TraceRow.ROW_TYPE_SYS_MEMORY_GPU_GL;
    itRow.rowId = 'THREAD_LOAD';
    expect(selectionParam.vMTrackerGpuChildRowsEvery(itRow)).toBeUndefined();
  });

  it('BoxSelectionTest112', function () {
    itRow.rowType = TraceRow.ROW_TYPE_SYS_MEMORY_GPU_GRAPH;
    itRow.rowId = 'THREAD_LOAD';
    expect(selectionParam.vMTrackerGpuChildRowsEvery(itRow)).toBeUndefined();
  });

  it('BoxSelectionTest113', function () {
    itRow.rowType = TraceRow.ROW_TYPE_SYS_MEMORY_GPU_TOTAL;
    itRow.rowId = 'THREAD_LOAD';
    expect(selectionParam.vMTrackerGpuChildRowsEvery(itRow)).toBeUndefined();
  });

  it('BoxSelectionTest114', function () {
    itRow.rowType = TraceRow.ROW_TYPE_SYS_MEMORY_GPU_WINDOW;
    itRow.rowId = 'THREAD_LOAD';
    expect(selectionParam.vMTrackerGpuChildRowsEvery(itRow)).toBeUndefined();
  });
});
