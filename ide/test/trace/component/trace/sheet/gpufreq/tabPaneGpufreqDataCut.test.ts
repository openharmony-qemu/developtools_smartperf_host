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

import { TabPaneGpufreqDataCut } from '../../../../../../src/trace/component/trace/sheet/gpufreq/tabPaneGpufreqDataCut';
import '../../../../../../src/trace/component/trace/sheet/gpufreq/tabPaneGpufreqDataCut';
import { LitTable } from '../../../../../../src/base-ui/table/lit-table';
import '../../../../../../src/base-ui/table/lit-table';
import { SpSegmentationChart } from "../../../../../../src/trace/component/chart/SpSegmentationChart";

jest.mock('../../../../../../src/trace/component/trace/base/TraceRow', () => {
  return {};
});

window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

const sqlite = require('../../../../../../src/trace/database/SqlLite');
jest.mock('../../../../../../src/trace/database/SqlLite');

describe('TabPaneSchedSwitch Test', () => {
  let threadStatesParam = {
    cpus: [],
    threadIds: [1, 2, 3],
    trackIds: [23, 56, 77],
    funTids: [675, 75],
    heapIds: [11, 223],
    processIds: [114, 23],
    nativeMemory: [],
    leftNs: 12222,
    rightNs: 654233,
    hasFps: false,
    statisticsSelectData: undefined,
  }

  let dataCut = [{
    funName: 'funName',
    startTime: 0,
    dur: 2155,
    endTime: 0,
    depth: 2,
    threadName: '',
    pid: 5256
  }]

  let initData = [{
    filterId: '12',
    freq: 'freq',
    count: '4',
    value: '45',
    ts: '2255',
    startNS: '4455',
    dur: '58547',
    endTime: '1255858',
    thread: 'thread',
    parentIndex: 0,
    leve: 0,
    name: 'name'
  }]

  let gpufreq = sqlite.getGpufreqData;
  let gpufreqData = [{
    filterId: '12',
    freq: 'freq',
    count: '4',
    value: '45',
    ts: '2255',
    startNS: '4455',
    dur: '58547',
    endTime: '1255858',
    thread: 'thread',
    parentIndex: 0,
    leve: 0,
    name: 'name'
  }];
  gpufreq.mockResolvedValue(gpufreqData);

  let dataFreqCut = sqlite.getGpufreqDataCut;
  let gpufreqCut = [{
    funName: 'funName',
    startTime: 0,
    dur: 2155,
    endTime: 0,
    depth: 2,
    threadName: '',
    pid: 5256
  }];
  dataFreqCut.mockResolvedValue(gpufreqCut);

  let gpufreqDataCut = new TabPaneGpufreqDataCut();
  gpufreqDataCut.threadStatesTbl = jest.fn(() => {
    return new LitTable();
  });
  it('TabPaneSchedSwitchTest01', function () {
    gpufreqDataCut.data = threadStatesParam;
    expect(gpufreqDataCut.threadStatesTbl.loading).toBeTruthy();
  });

  it('TabPaneSchedSwitchTest02', function () {
    gpufreqDataCut.data = threadStatesParam;
    gpufreqDataCut.validationFun('', '', '', '', '', '', '');
    expect(gpufreqDataCut._threadId.getAttribute('placeholder')).toEqual('Please input thread id');
  });

  it('TabPaneSchedSwitchTest03', function () {
    gpufreqDataCut.data = threadStatesParam;
    gpufreqDataCut.validationFun('1', 'name', '1px solid red', '1px solid green', 'placeholder', 'placeholder', 'single');
    expect(gpufreqDataCut._threadId.getAttribute('placeholder')).toEqual('placeholder');
  });

  it('TabPaneSchedSwitchTest04', function () {
    gpufreqDataCut.data = threadStatesParam;
    gpufreqDataCut.validationFun('1', 'name', '1px solid red', '1px solid green', 'placeholder', 'thread function placeholder', 'loop');
    expect(gpufreqDataCut._threadFunc.getAttribute('placeholder')).toEqual('thread function placeholder');
  });

  it('TabPaneSchedSwitchTest05', function () {
    gpufreqDataCut.filterData(initData, dataCut, initData);
    expect(gpufreqDataCut.threadStatesTbl.loading).toBeFalsy();
  });

  it('TabPaneSchedSwitchTest06', function () {
    expect(gpufreqDataCut.segmentationData(initData[0], dataCut,1).length).toBe(0);
  });

  it('TabPaneSchedSwitchTest07', function () {
    SpSegmentationChart.setChartData = jest.fn();
    expect(gpufreqDataCut.createTree(initData)).not.toBeUndefined();
  });

  it('TabPaneSchedSwitchTest08', function () {
    expect(gpufreqDataCut.updateValueMap(initData[0], 0, '', {}, 1)).toBeUndefined();
  });
});
