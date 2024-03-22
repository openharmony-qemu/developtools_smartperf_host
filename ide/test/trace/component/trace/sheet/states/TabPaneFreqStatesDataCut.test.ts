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
  TabPaneFreqStatesDataCut
} from '../../../../../../src/trace/component/trace/sheet/states/TabPaneFreqStatesDataCut';
import { StateGroup } from '../../../../../../src/trace/bean/StateModle';
jest.mock('../../../../../../src/trace/component/trace/base/TraceSheet', () => {
  return {
    systemLogFlag: {
    }
  };
});
jest.mock('../../../../../../src/trace/component/chart/SpSegmentationChart', () => {
  return {
    statesRow: {
      dataList: []
    },
    SpSegmentationChart: {
      setStateChartData: ()=>{}
    }
  };
});
import '../../../../../../src/trace/component/trace/base/TraceSheet';
import { TraceSheet } from '../../../../../../src/trace/component/trace/base/TraceSheet';
const funSqlite = require('../../../../../../src/trace/database/sql/Func.sql');
jest.mock('../../../../../../src/trace/database/sql/Func.sql');
jest.mock('../../../../../../src/base-ui/table/lit-table', () => {
  return {
    snapshotDataSource: () => {
    },
    removeAttribute: () => {
    },
  };
});

jest.mock('../../../../../../src/trace/component/trace/base/TraceRow', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
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

describe('TabPaneFreqStatesDataCut Test', () => {
  let tabPaneFreqStatesDataCut = new TabPaneFreqStatesDataCut();
  tabPaneFreqStatesDataCut.theadClick = jest.fn();
  let htmlElement = document.createElement('trace-sheet') as TraceSheet;
  tabPaneFreqStatesDataCut.initTabSheetEl(htmlElement);
  let threadDataMock = [
    new StateGroup('pid1', 'tid1', 'R', 100),
    new StateGroup('pid1', 'tid2', 'Running', 200),
    new StateGroup('pid1', 'tid3', 'S', 300),
    new StateGroup('pid1', 'tid4', 'D', 400),
    new StateGroup('pid2', 'tid5', 'R', 500),
  ];

  let statesCut = funSqlite.queryStatesCut;
  statesCut.mockResolvedValue([{
    ts: 10,
    depth: 1,
    dur: 1000,
    funName: '',
    id: 1,
    startTime: 10,
    endTime: 20000,
    tid: 2,
    pid: 2,
    type: '',
    state: 'S'
  },{
    ts: 10,
    depth: 1,
    dur: 1000,
    funName: '',
    id: 1,
    startTime: 10,
    endTime: 20000,
    tid: 2,
    pid: 2,
    type: '',
    state: 'Running'
  },{
    ts: 10,
    depth: 1,
    dur: 1000,
    funName: '',
    id: 1,
    startTime: 10,
    endTime: 20000,
    tid: 2,
    pid: 2,
    type: '',
    state: 'R'
  },{
    ts: 10,
    depth: 1,
    dur: 1000,
    funName: '',
    id: 1,
    startTime: 10,
    endTime: 20000,
    tid: 2,
    pid: 2,
    type: '',
    state: 'D'
  },{
    ts: 10,
    depth: 1,
    dur: 1000,
    funName: '',
    id: 1,
    startTime: 10,
    endTime: 20000,
    tid: 2,
    pid: 2,
    type: '',
    state: 'Running'
  }]);

  let loopFuncNameCycle = funSqlite.queryLoopFuncNameCycle;
  loopFuncNameCycle.mockResolvedValue([{
    depth: 1,
    dur: 1000,
    funName: '',
    id: 1,
    startTime: 10,
    endTime: 20000,
    tid: 2,
    pid: 2,
    type: ''
  }]);

  let singleFuncNameCycleStates = funSqlite.querySingleFuncNameCycleStates;
  singleFuncNameCycleStates.mockResolvedValue([{
    depth: 1,
    dur: 1000,
    funName: '',
    id: 1,
    startTime: 10,
    tid: 2,
    pid: 2,
    type: '',
    cycleStartTime: 100,
    endTime: 2000,
  },
    {
      depth: 1,
      dur: 1000,
      funName: '',
      id: 1,
      startTime: 10,
      tid: 2,
      pid: 2,
      type: '',
      cycleStartTime: 2000,
      endTime: 5000,
    }]);

  it('TabPaneFreqStatesDataCutTest01 ', function () {
    tabPaneFreqStatesDataCut.data = {threadId: '123', cycleName: 'Cycle1'};
    expect(tabPaneFreqStatesDataCut.currentSelectionParam).toEqual({threadId: '123', cycleName: 'Cycle1'});
  });
  it('TabPaneFreqStatesDataCutTest02', () => {
    let filterState = [
      {pid: 1, state: 'R'},
      {pid: 2, state: 'D'},
      {pid: 1, state: 'Running'},
    ];
    tabPaneFreqStatesDataCut.currentSelectionParam = {
      rightNs: 1000,
      recordStartNs: 200,
      leftNs: 0,
      processIds: [1, 2, 1, 1],
      threadIds: ['tid1', 'tid2', 'tid3', 'tid4']
    };
    let processId = 1;
    let stateCutArr = [];
    let expectedResult = new StateGroup();
    expectedResult.totalCount = 2;
    expectedResult.RunnableCount = 1;
    expectedResult.RunningCount = 1;
    expectedResult.DCount = 0;
    expectedResult.SleepingCount = 0;
    expectedResult.title = 'Process1';
    expectedResult.pid = 1;
    expectedResult.type = 'process';
    expectedResult.children = [];
    tabPaneFreqStatesDataCut.setProcessData(filterState, processId, stateCutArr);
    expect(stateCutArr).toHaveLength(1);
    expect(stateCutArr[0]).toEqual(expectedResult);
  });
  it('TabPaneFreqStatesDataCutTest03 ', function () {
    tabPaneFreqStatesDataCut.currentSelectionParam = {
      processIds: [1, 2, 1, 1],
      threadIds: ['tid1', 'tid2', 'tid3', 'tid4']
    };
    const result = tabPaneFreqStatesDataCut.setThreadData(threadDataMock);
    expect(result).toEqual([]);
  });
  it('TabPaneFreqStatesDataCutTest04 ', function () {
    let mockStateGroupArr;
    let mockFuncNameCycleArr;
    mockStateGroupArr = [
      {ts: 100, dur: 50, state: 'R'},
      {ts: 200, dur: 70, state: 'S'},
      {ts: 300, dur: 80, state: 'Running'},
      {ts: 400, dur: 60, state: 'D'},
    ];
    mockFuncNameCycleArr = [
      {cycleStartTime: 100, endTime: 150},
      {cycleStartTime: 200, endTime: 250},
    ];
    tabPaneFreqStatesDataCut.funcNameCycleArr = mockFuncNameCycleArr;
    const result = tabPaneFreqStatesDataCut.setCycleData(mockStateGroupArr);
    expect(result).toHaveLength(mockFuncNameCycleArr.length);
  });

  it('TabPaneFreqStatesDataCutTest05 ', function () {
    let itemClick = new CustomEvent('click', <CustomEventInit>{
      detail: {
        ...{},
        data: {},
      },
      composed: true,
    });
    let itemClick1 = new CustomEvent('click', <CustomEventInit>{
      detail: {
        ...{},
        data: {},
      },
      composed: true,
    });
    let itemMouseout = new CustomEvent('mouseout', <CustomEventInit>{
      detail: {
        ...{},
        data: {},
      },
      composed: true,
    });
    let itemRowClick = new CustomEvent('row-click', <CustomEventInit>{
      detail: {
        ...{},
        data: {},
      }
    });
    tabPaneFreqStatesDataCut.threadStatesDIV?.children[2].children[0].dispatchEvent(itemClick);
    tabPaneFreqStatesDataCut.threadStatesDIV?.children[2].children[1].dispatchEvent(itemClick1);

    tabPaneFreqStatesDataCut.threadBindersTbl!.dispatchEvent(itemMouseout);
    tabPaneFreqStatesDataCut.threadBindersTbl!.dispatchEvent(itemRowClick);

    let threadIdDiv = document.createElement('div') as HTMLInputElement;
    let threadFuncDiv = document.createElement('div') as HTMLInputElement;
    tabPaneFreqStatesDataCut.currentSelectionParam = {
      rightNs: 1000,
      recordStartNs: 200,
      leftNs: 0,
      processIds: [1, 2, 1, 1],
      threadIds: ['tid1', 'tid2', 'tid3', 'tid4']
    }
    threadIdDiv.value = '1';
    threadFuncDiv.value = '2';
    tabPaneFreqStatesDataCut.threadBindersTbl.exportProgress = {
      loading: ''
    }
    expect(tabPaneFreqStatesDataCut.dataLoopCut(threadIdDiv, threadFuncDiv)).resolves.toBeUndefined();
  });

  it('TabPaneFreqStatesDataCutTest06 ', function () {
    let threadIdDiv = document.createElement('div') as HTMLInputElement;
    let threadFuncDiv = document.createElement('div') as HTMLInputElement;
    tabPaneFreqStatesDataCut.currentSelectionParam = {
      rightNs: 1000,
      recordStartNs: 200,
      leftNs: 0,
      processIds: [1, 2, 1, 1],
      threadIds: ['tid1', 'tid2', 'tid3', 'tid4']
    }
    threadIdDiv.value = '1';
    threadFuncDiv.value = '2';
    tabPaneFreqStatesDataCut.funcNameCycleArr = [{
      funcName: '',
      cycleStartTime: 0,
      cycleDur: 0,
      startTime: 0,
      endTime: 0,
      id: 0,
      tid: 0,
      pid: 0
    }]
    tabPaneFreqStatesDataCut.dataSingleCut(threadIdDiv, threadFuncDiv)
  });

});
