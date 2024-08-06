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

import '../../../../../../src/base-ui/table/lit-table';
import '../../../../../../src/trace/component/trace/sheet/schedswitch/TabPaneSchedSwitch';
import { TabPaneSchedSwitch } from '../../../../../../src/trace/component/trace/sheet/schedswitch/TabPaneSchedSwitch';
import { SpSegmentationChart } from '../../../../../../src/trace/component/chart/SpSegmentationChart';
import { SpSystemTrace } from '../../../../../../src/trace/component/SpSystemTrace';
import { TraceRow } from '../../../../../../src/trace/component/trace/base/TraceRow';
import { CpuFreqExtendStruct } from '../../../../../../src/trace/database/ui-worker/ProcedureWorkerFreqExtend';
import { Utils } from '../../../../../../src/trace/component/trace/base/Utils';

jest.mock('../../../../../../src/trace/component/trace/sheet/SheetUtils', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../../../src/trace/component/trace/base/TraceSheet', () => {
  return {};
});
// @ts-ignore
window.ResizeObserver = window.ResizeObserver || jest.fn().mockImplementation(() => ({
  disconnect: jest.fn(),
  observe: jest.fn(),
  unobserve: jest.fn(),
}));
const sqlite = require('../../../../../../src/trace/database/sql/ProcessThread.sql');
jest.mock('../../../../../../src/trace/database/sql/ProcessThread.sql');

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
  };
  let single = sqlite.querySingleCutData;
  let singleCutData = [
    {
      id: 12,
      name: 'name',
      cycleStartTime: 25,
      cycleEndTime: 25877,
      depth: 2,
      tid: 25,
      pid: 12,
      dur: 2544
    }
  ];
  single.mockResolvedValue(singleCutData);

  let threadState = sqlite.querySchedThreadStates;
  let threadStateData = [
    {
      id: 12,
      pid: 15,
      tid: 589,
      state: 'test',
      type: 'test',
      dur: 15552,
      ts: 526,
      endTs: 63965
    }
  ];
  threadState.mockResolvedValue(threadStateData);

  let loopCut = sqlite.queryLoopCutData;
  let loopCutData = [
    {
      id: 12,
      pid: 15,
      tid: 589,
      name: 'name',
      cycleStartTime: 526,
      depth: 1
    }
  ];
  loopCut.mockResolvedValue(loopCutData);
  Utils.getInstance().getProcessMap().set(15, '');
  Utils.getInstance().getThreadMap().set(589, '');
  let tabPaneSchedSwitch = new TabPaneSchedSwitch();
  tabPaneSchedSwitch.schedSwitchTbl.exportProgress = {
    loading: ''
  };
  tabPaneSchedSwitch.chartTotal.offset = jest.fn(() => ({ x: 60, y: 20 }));
  tabPaneSchedSwitch.selectionParam = {
    rightNs: 1000,
    recordStartNs: 200,
    leftNs: 0
  };
  SpSegmentationChart.trace = new SpSystemTrace();
  SpSegmentationChart.schedRow = new TraceRow<CpuFreqExtendStruct>();
  tabPaneSchedSwitch.clickTableLabel = jest.fn();
  it('TabPaneSchedSwitchTest01', function () {
    let htmlDivElement = document.createElement('div');
    htmlDivElement.appendChild(tabPaneSchedSwitch);
    SpSegmentationChart.setChartData = jest.fn();
    SpSegmentationChart.tabHover = jest.fn();
    tabPaneSchedSwitch.data = threadStatesParam;
    expect(tabPaneSchedSwitch.schedSwitchTbl.loading).toBeFalsy();
  });

  it('TabPaneSchedSwitchTest02', function () {
    tabPaneSchedSwitch.queryCycleRangeData();
    expect(tabPaneSchedSwitch.histogramSource.length).toBe(1);
  });

  it('TabPaneSchedSwitchTest03', function () {
    let data = {
      title: 'title',
      count: 6,
      cycleNum: 1,
      state: 'state',
      tid: 122,
      pid: 58,
      thread: 'thread',
      process: 'process',
      cycleStartTime: 254,
      duration: 2573,
      level: 'thread',
      children: [],
    };
    let customEvent = new CustomEvent('click', {
      bubbles: true,
      cancelable: true,
      detail: {data: data}
    });
    tabPaneSchedSwitch.clickTreeRowEvent(customEvent);
    expect(tabPaneSchedSwitch.cycleALeftInput.value).toEqual('');
  });

  it('TabPaneSchedSwitchTest04', function () {
    let firstInput = document.createElement('input');
    firstInput.value = '11';
    let secondInput = document.createElement('input');
    secondInput.value = '22';
    let thirdInput = document.createElement('input');
    let fourInput = document.createElement('input');
    tabPaneSchedSwitch.checkInputRangeFn(firstInput, secondInput, thirdInput, fourInput, '2', '36');
    expect(tabPaneSchedSwitch.getAttribute('query-button')).toEqual('');
  });

  it('TabPaneSchedSwitchTest05', function () {
    tabPaneSchedSwitch.queryCutInfoFn('Single');
    expect(tabPaneSchedSwitch.threadIdInput.getAttribute('placeholder')).toEqual('Please input thread id');
  });

  it('TabPaneSchedSwitchTest06', function () {
    tabPaneSchedSwitch.threadIdInput.value = '12';
    tabPaneSchedSwitch.funcNameInput.value = 'name';
    tabPaneSchedSwitch.queryCutInfoFn('Single');
    expect(tabPaneSchedSwitch.getAttribute('isSingleButton')).toBeNull();
  });

  it('TabPaneSchedSwitchTest07', function () {
    tabPaneSchedSwitch.threadIdInput.value = '12';
    tabPaneSchedSwitch.funcNameInput.value = 'name';
    tabPaneSchedSwitch.queryCutInfoFn('Loop');
    expect(tabPaneSchedSwitch.getAttribute('isLoopButton')).toBeNull();
  });

  it('TabPaneSchedSwitchTest08', function () {
    let firstInput = document.createElement('input');
    firstInput.value = '11';
    let secondInput = document.createElement('input');
    secondInput.value = '22';
    let thirdInput = document.createElement('input');
    let fourInput = document.createElement('input');
    tabPaneSchedSwitch.checkInputRangeFn(firstInput, secondInput, thirdInput, fourInput, '36', '2');
    expect(tabPaneSchedSwitch.queryButton.style.pointerEvents).toEqual('none');
  });

  it('TabPaneSchedSwitchTest09', function () {
    let firstInput = document.createElement('input');
    firstInput.value = '';
    let secondInput = document.createElement('input');
    secondInput.value = '22';
    let thirdInput = document.createElement('input');
    let fourInput = document.createElement('input');
    tabPaneSchedSwitch.checkInputRangeFn(firstInput, secondInput, thirdInput, fourInput, '36', '2');
    expect(tabPaneSchedSwitch.queryButton.style.pointerEvents).toEqual('none');
  });

  it('TabPaneSchedSwitchTest10', function () {
    let firstInput = document.createElement('input');
    firstInput.value = '';
    let secondInput = document.createElement('input');
    secondInput.value = '';
    let thirdInput = document.createElement('input');
    thirdInput.value = 'third';
    let fourInput = document.createElement('input');
    fourInput.value = 'four';
    tabPaneSchedSwitch.checkInputRangeFn(firstInput, secondInput, thirdInput, fourInput, '36', '2');
    expect(tabPaneSchedSwitch.queryButton.style.pointerEvents).toEqual('auto');
  });

  it('TabPaneSchedSwitchTest11', function () {
    let firstInput = document.createElement('input');
    firstInput.value = '';
    let secondInput = document.createElement('input');
    secondInput.value = '';
    let thirdInput = document.createElement('input');
    thirdInput.value = '';
    let fourInput = document.createElement('input');
    fourInput.value = 'four';
    tabPaneSchedSwitch.checkInputRangeFn(firstInput, secondInput, thirdInput, fourInput, '36', '2');
    expect(tabPaneSchedSwitch.queryButton.style.pointerEvents).toEqual('none');
  });

  it('TabPaneSchedSwitchTest12', function () {
    let data = {
      title: 'title',
      count: 6,
      cycleNum: 1,
      state: 'state',
      tid: 122,
      pid: 58,
      thread: 'thread',
      process: 'process',
      cycleStartTime: 254,
      duration: 2573,
      level: 'process',
      children: [],
    };
    let customEvent = new CustomEvent('click', {
      bubbles: true,
      cancelable: true,
      detail: {data: data}
    });
    tabPaneSchedSwitch.clickTreeRowEvent(customEvent);
    expect(tabPaneSchedSwitch.cycleALeftInput.value).toEqual('');
  });

  it('TabPaneSchedSwitchTest12', function () {
    let data = {
      title: 'title',
      count: 6,
      cycleNum: 1,
      state: 'state',
      tid: 122,
      pid: 58,
      thread: 'thread',
      process: 'process',
      cycleStartTime: 254,
      duration: 2573,
      level: 'cycle',
      children: [],
    };
    let customEvent = new CustomEvent('click', {
      bubbles: true,
      cancelable: true,
      detail: {data: data}
    });
    tabPaneSchedSwitch.clickTreeRowEvent(customEvent);
    expect(tabPaneSchedSwitch.cycleALeftInput.value).toEqual('');
  });
});
