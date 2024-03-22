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
import { TabPaneSampleInstructionTotalTime } from '../../../../../../src/trace/component/trace/sheet/bpftrace/TabPaneSampleInstructionSelectionTotalTime';
import { SelectionParam } from '../../../../../../src/trace/bean/BoxSelection';
jest.mock('../../../../../../src/js-heap/model/DatabaseStruct', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
describe('', () => {
  let tab = new TabPaneSampleInstructionTotalTime();
  let SelectionParam: SelectionParam = {
    recordStartNs: 0,
    leftNs: 2603129445,
    rightNs: 10071123755,
    hasFps: false,
    perfAll: false,
    fileSysVirtualMemory: false,
    diskIOLatency: false,
    fsCount: 0,
    vmCount: 0,
    isCurrentPane: false,
    startup: false,
    staticInit: false,
    isRowClick: false,
    eventTypeId: '',
    cpus: [],
    cpuStateRowsId: [],
    cpuFreqFilterNames: [],
    cpuStateFilterIds: [],
    cpuFreqFilterIds: [],
    threadIds: [],
    processIds: [],
    processTrackIds: [],
    virtualTrackIds: [],
    cpuFreqLimit: [],
    clockMapData: {},
    irqCallIds: [],
    softIrqCallIds: [],
    funTids: [],
    funAsync: [],
    nativeMemory: [],
    nativeMemoryStatistic: [],
    nativeMemoryAllProcess: [],
    nativeMemoryCurrentIPid: -1,
    cpuAbilityIds: [],
    memoryAbilityIds: [],
    diskAbilityIds: [],
    networkAbilityIds: [],
    perfSampleIds: [],
    perfCpus: [],
    perfProcess: [],
    perfThread: [],
    fileSystemType: [],
    sdkCounterIds: [],
    sdkSliceIds: [],
    diskIOipids: [],
    diskIOReadIds: [],
    diskIOWriteIds: [],
    systemEnergy: [],
    powerEnergy: [],
    anomalyEnergy: [],
    smapsType: [],
    vmtrackershm: [],
    promiseList: [],
    jankFramesData: [],
    jsMemory: [],
    taskFramesData: [],
    frameDynamic: [],
    frameAnimation: [],
    frameSpacing: [],
    jsCpuProfilerData: [],
    gpu: {
      gl: false,
      graph: false,
      gpuWindow: false,
      gpuTotal: false,
    },
    purgeableTotalAbility: [],
    purgeableTotalVM: [],
    purgeablePinAbility: [],
    purgeablePinVM: [],
    purgeableTotalSelection: [],
    purgeablePinSelection: [],
    dmaAbilityData: [],
    gpuMemoryAbilityData: [],
    dmaVmTrackerData: [],
    gpuMemoryTrackerData: [],
    hiLogs: [],
    sysAllEventsData: [],
    sysAlllogsData: [],
    hiSysEvents: [],
    sampleData: [
      {
        children: {
          RenderFrameStart: [],
          ConsumeAndUpdateAllNodes: [
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
          WaitUntilUnmarshallingTaskFinished: [
            {
              name: 'WaitUntilUnmarshallingTaskFinished',
              detail: '等待反序列化完成',
              end: 512062139535138,
              begin: 512062139526284,
              depth: 2,
              instructions: 0.785,
              cycles: 0,
              frame: {
                x: 0,
                y: 40,
                width: 1,
                height: 20,
              },
              startTs: 512062138606492,
              textMetricsWidth: 260.1611328125,
            },
          ],
          ProcessCommand: [
            {
              name: 'ProcessCommand',
              detail: '数据同步',
              end: 512062141885138,
              begin: 512062139543471,
              depth: 2,
              instructions: 6,
              cycles: 35,
              frame: {
                x: 0,
                y: 40,
                width: 1,
                height: 20,
              },
              startTs: 512062138606492,
              textMetricsWidth: 132.6513671875,
            },
          ],
          CheckParallelSubThreadNodesStatus: [
            {
              name: 'CheckParallelSubThreadNodesStatus',
              detail: '执行并行绘制',
              end: 512062139563263,
              begin: 512062139553888,
              depth: 3,
              instructions: 0,
              cycles: 0,
              frame: {
                x: 0,
                y: 60,
                width: 1,
                height: 20,
              },
              startTs: 512062138606492,
              textMetricsWidth: 241.826171875,
            },
          ],
          CacheCommands: [],
          Animate: [
            {
              name: 'Animate',
              detail: '动画步进计算',
              end: 512062142174201,
              begin: 512062142004930,
              depth: 3,
              instructions: 3,
              cycles: 2,
              frame: {
                x: 0,
                y: 60,
                width: 1,
                height: 20,
              },
              startTs: 512062138606492,
              textMetricsWidth: 106.7529296875,
            },
          ],
          ApplyModifiers: [
            {
              name: 'ApplyModifiers',
              detail: 'modifier 属性更新',
              end: 512062142871076,
              begin: 512062142186180,
              depth: 3,
              instructions: 0,
              cycles: 10,
              frame: {
                x: 0,
                y: 60,
                width: 1,
                height: 20,
              },
              startTs: 512062138606492,
              textMetricsWidth: 163.3154296875,
            },
          ],
        },
        detail: 'Tree同步&预处理',
        depth: 1,
        name: 'unknown-1',
        parentName: 'OnReadable',
        property: [
          {
            name: 'unknown-1',
            detail: 'Tree同步&预处理',
            begin: 512065467744513,
            end: 512065468112742,
            depth: 1,
            frame: {
              x: 156,
              y: 20,
              width: 1,
              height: 20,
            },
            startTs: 512062138606492,
            textMetricsWidth: 139.736328125,
          },
        ],
        instructions: 7,
        cycles: 9,
        hoverInstructions: 7,
        hoverCycles: 8,
        frame: {
          x: 0,
          y: 30,
          width: 106,
          height: 30,
        },
        textMetricsWidth: 139.736328125,
      },
    ],
  };
  it('TabPaneSampleInstructionTotalTime test01', () => {
    tab.data = SelectionParam;
    expect(tab.initHtml()).not.toBeUndefined();
    expect(tab.initElements()).toBeUndefined();
    expect(tab.onMouseMove()).toBeUndefined();
    expect(tab.hideTip()).toBeUndefined();
    expect(tab.showTip()).toBeUndefined();
    expect(tab.updateTipContent()).toBeUndefined();
    expect(tab.calInstructionRangeCount()).toBeUndefined();
    expect(tab.drawLineLabelMarkers(100, 100)).toBeUndefined();
    expect(tab.drawLine(100, 20, 30, 40)).toBeUndefined();
    expect(tab.drawMarkers(100, 20)).toBeUndefined();
    expect(tab.drawRect(0, 10, 20, 30)).toBeUndefined();
  });

  it('TabPaneSampleInstructionTotalTime test02', () => {
    const mockFn = jest.fn();
    tab.calInstructionRangeCount = mockFn;
    tab.data = SelectionParam;
    expect(mockFn).toHaveBeenCalled();
  });

  it('TabPaneSampleInstructionTotalTime test03', () => {
    const mockFn = jest.fn();
    tab.isContains = mockFn;
    const nodes = [
      {
        instruct: '10.5',
        x: 836.5,
        y: 183.23000000000002,
        height: 81.77,
        heightPer: 0.056,
      },
      {
        instruct: '10.8',
        x: 859,
        y: 183.23000000000002,
        height: 81.77,
        heightPer: 0.056,
      },
    ];
    tab.searchDataByCoord(nodes, 471, 251);
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('TabPaneSampleInstructionTotalTime test04', () => {
    const nodes = [
      {
        instruct: '10.5',
        x: 890,
        y: 183.23000000000002,
        height: 81.77,
        heightPer: 0.056,
      },
      {
        instruct: '10.8',
        x: 800,
        y: 183.23000000000002,
        height: 81.77,
        heightPer: 0.056,
      },
    ];
    expect(tab.searchDataByCoord(nodes, 471, 251)).toBeNull();
  });

  it('TabPaneSampleInstructionTotalTime test05', () => {
    const nodes = [
      {
        instruct: '10.5',
        x: 890,
        y: 180,
        height: 100,
        heightPer: 0.056,
      },
    ];
    expect(tab.searchDataByCoord(nodes, 891, 251)).not.toBeUndefined();
  });

  it('TabPaneSampleInstructionTotalTime test06', () => {
    const mockFn = jest.fn();
    tab.drawBar = mockFn;
    SelectionParam.sampleData[0].property = [];
    tab.data = SelectionParam;
    tab.calInstructionRangeCount();
    expect(mockFn).not.toHaveBeenCalled();
  });

  it('TabPaneSampleInstructionTotalTime test07', () => {
    const mockDrawLine = jest.fn();
    tab.drawLine = mockDrawLine;
    const mockDdrawMarkers = jest.fn();
    tab.drawMarkers = mockDdrawMarkers;
    tab.initElements()
    tab.drawLineLabelMarkers(100,100);
    expect(mockDrawLine).toHaveBeenCalled();
    expect(mockDdrawMarkers).toHaveBeenCalled();
  });
});
