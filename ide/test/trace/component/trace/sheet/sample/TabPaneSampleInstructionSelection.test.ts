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
import { TabPaneSampleInstructionSelection } from '../../../../../../src/trace/component/trace/sheet/bpftrace/TabPaneSampleInstructionSelection';
import { SelectionParam } from '../../../../../../src/trace/bean/BoxSelection';
jest.mock('../../../../../../src/trace/component/trace/base/TraceRow', () => {
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

describe('', () => {
  let tab = new TabPaneSampleInstructionSelection();
  let SelectionParam: SelectionParam = {
    recordStartNs: 0,
    leftNs: 1621621621,
    rightNs: 1749644381,
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
        detail: 'OnVsync信号回调',
        depth: 0,
        name: 'OnReadable',
        parentName: '',
        property: [
          {
            name: 'OnReadable',
            detail: 'OnVsync信号回调',
            end: 512063811316909,
            begin: 512063803840867,
            depth: 0,
            instructions: 54,
            cycles: 148,
            frame: {
              x: 78,
              y: 0,
              width: 1,
              height: 20,
            },
            startTs: 512062138606492,
            textMetricsWidth: 146.8896484375,
          },
        ],
        instructions: 54,
        hoverInstructions: 54,
        cycles: 148,
        hoverCycles: 148,
        frame: {
          x: 0,
          y: 0,
          width: 1635,
          height: 30,
        },
        textMetricsWidth: 146.8896484375,
      },
    ],
  };
  const node = {
    '0': [
      {
        detail: 'OnVsync信号回调',
        depth: 0,
        name: 'OnReadable',
        parentName: '',
        property: [
          {
            name: 'OnReadable',
            detail: 'OnVsync信号回调',
            end: 512065485173158,
            begin: 512065467605450,
            depth: 0,
            instructions: 216,
            cycles: 383,
            frame: {
              x: 156,
              y: 0,
              width: 1,
              height: 20,
            },
            startTs: 512062138606492,
            textMetricsWidth: 146.8896484375,
          },
        ],
        instructions: 120,
        cycles: 249,
        hoverInstructions: 120,
        hoverCycles: 249,
        frame: {
          x: 0,
          y: 0,
          width: 1652,
          height: 30,
        },
        textMetricsWidth: 146.8896484375,
      },
    ],
  };
  it('TabPaneSampleInstructionSelection test01', () => {
    expect(tab.isContains({ x: 100, width: 2, y: 100, height: 10 }, 100, 100)).toBeTruthy();
    expect(tab.updateCanvasCoord()).toBeUndefined();
    expect(tab.searchDataByCoord(node, 100, 200)).not.toBeUndefined();
    expect(tab.initHtml()).not.toBeUndefined();
    expect(tab.initElements()).toBeUndefined();
    expect(tab.hideTip()).toBeUndefined();
    expect(tab.showTip()).toBeUndefined();
    expect(tab.updateTipContent()).toBeUndefined();
    expect(tab.updateCanvas()).toBeUndefined();
    expect(tab.listenerResize()).toBeUndefined();
    expect(tab.onMouseMove()).toBeUndefined();
  });

  it('TabPaneSampleInstructionSelection test02', () => {
    const mockFn = jest.fn();
    tab.isContains = mockFn;
    tab.searchDataByCoord(node, 471, 251);
    expect(mockFn).toHaveBeenCalled();
  });

  it('TabPaneSampleInstructionSelection test03', () => {
    const nodes = [
      {
        instruct: '10.5',
        x: 890,
        y: 180,
        height: 100,
        width: 100,
      },
    ];
    expect(tab.searchDataByCoord(nodes, 891, 251)).not.toBeUndefined();
  });

  it('TabPaneSampleInstructionSelection test04', () => {
    expect(tab.getAvgInstructionData(SelectionParam.sampleData)).not.toBeUndefined();
  });

  it('TabPaneSampleInstructionSelection test05', () => {
    const mockFn = jest.fn();
    tab.showTip = mockFn;
    tab.initElements();
    tab.searchDataByCoord = jest.fn(() => true);
    tab.onMouseMove();
    expect(mockFn).toHaveBeenCalled();
  });
});
