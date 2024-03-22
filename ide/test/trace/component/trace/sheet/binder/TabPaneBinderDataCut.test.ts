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


import { TabPaneBinderDataCut } from '../../../../../../src/trace/component/trace/sheet/binder/TabPaneBinderDataCut';
import '../../../../../../src/trace/component/trace/sheet/binder/TabPaneBinderDataCut';
import { LitTable } from '../../../../../../src/base-ui/table/lit-table';
import { SpSegmentationChart } from '../../../../../../src/trace/component/chart/SpSegmentationChart';
import { TraceRow } from '../../../../../../src/trace/component/trace/base/TraceRow';
import { BinderStruct } from '../../../../../../src/trace/database/ui-worker/procedureWorkerBinder';
import { SpSystemTrace } from '../../../../../../src/trace/component/SpSystemTrace';

const processSqlite = require('../../../../../../src/trace/database/sql/ProcessThread.sql');
jest.mock('../../../../../../src/trace/database/sql/ProcessThread.sql');
const sqlite = require('../../../../../../src/trace/database/sql/Func.sql');
jest.mock('../../../../../../src/trace/database/sql/Func.sql');
jest.mock('../../../../../../src/trace/component/trace/base/TraceSheet', () => {
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/cpu/ProcedureWorkerCPU', () => {
  return {};
});
jest.mock('../../../../../../src/trace/component/trace/timer-shaft/RangeRuler', () => {
  return {};
});
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));
describe('TabPaneBinderDataCut Test', () => {
  document.body.innerHTML = `<div><tabpane-binder-datacut id="binder-datacut"></tabpane-binder-datacut></div>`;
  let tabPaneBinderDataCut = document.querySelector<TabPaneBinderDataCut>('#binder-datacut');
  SpSegmentationChart.binderRow = new TraceRow<BinderStruct>;
  SpSegmentationChart.trace = new SpSystemTrace();
  let threadIdInput = document.createElement('input');
  threadIdInput.value = 'threadIdInput';
  let threadFuncInput = document.createElement('input');
  threadFuncInput.value = 'threadFuncInput';
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
    statisticsSelectData: undefined
  };
  let binderItem = [{
    title: 'test title',
    name: 'name',
    count: 2,
    ts: 2536,
    dur: 3666,
    startTime: 3655,
    endTime: 83663,
    tid: 363,
    pid: 523,
    cycleDur: 366,
    cycleStartTime: 3652,
    funcName: 'funcName',
    id: 12,
    thread: 'thread',
    process: 'process',
    totalCount: 12,
    idx: 366
  }];

  let bindGroup = [{
    title: 'title',
    count: 3,
    totalCount: 3,
    binderAsyncRcvCount: 2,
    binderReplyCount: 6,
    binderTransactionAsyncCount: 2,
    binderTransactionCount: 1,
    tid: 5,
    pid: 36,
    thread: 'thread',
    process: 'process',
    name: 'name',
    cycleStartTime: 1222,
    cycleDur: 366,
    id: 65,
    children: [],
    type: 'loop',
    status: false,
    idx: 2,
    isSelected: true
  }]
  tabPaneBinderDataCut.data = threadStatesParam;
  let loopFuncNameCycle = sqlite.queryLoopFuncNameCycle;
  let loopFuncNameCycleData = [{
    funcName: 'funcName',
    cycleStartTime: 1233,
    cycleDur: 0,
    id: 123,
    tid: 254,
    pid: 258
  }];
  loopFuncNameCycle.mockResolvedValue(loopFuncNameCycleData);

  let queryBinder = processSqlite.queryBinderByThreadId;
  let binderData = [{
    name: 'test',
    count: 1,
    ts: 2533,
    dur: 563,
    startTime: 22554,
    endTime: 2633333,
    tid: 122,
    pid: 36
  }];
  queryBinder.mockResolvedValue(binderData);

  let queryFuncName = sqlite.queryFuncNameCycle;
  let funcNameData = [{
    name: 'test',
    count: 1,
    ts: 2533,
    dur: 563,
    startTime: 22554,
    endTime: 2633333,
    tid: 122,
    pid: 36
  }];
  queryFuncName.mockResolvedValue(funcNameData);

  let singleFuncName = sqlite.querySingleFuncNameCycle;
  let singleFuncNameData = [{
    funcName: 'funcName',
    cycleStartTime: 2553,
    cycleDur: 36633,
    id: 253,
    tid: 366,
    pid: 369,
    endTime: 366922
  }];
  singleFuncName.mockResolvedValue(singleFuncNameData);
  let data = [
    {
      cycleStartTime: 2677246000,
      dur: 154698000,
      id: 5567,
      tid: 2532,
      pid: 2519
    },
    {
      cycleStartTime: 3093830000,
      dur: 133540000,
      id: 6417,
      tid: 2532,
      pid: 2519
    },
    {
      cycleStartTime: 3873240000,
      dur: 149769000,
      id: 8045,
      tid: 2532,
      pid: 2519
    },
    {
      cycleStartTime: 5546299000,
      dur: 148508000,
      id: 18380,
      tid: 2532,
      pid: 2519
    },
    {
      cycleStartTime: 5935477000,
      dur: 178657000,
      id: 20853,
      tid: 2532,
      pid: 2519
    },
    {
      cycleStartTime: 8979430000,
      dur: 151986000,
      id: 61239,
      tid: 2532,
      pid: 2519
    },
    {
      cycleStartTime: 10574029000,
      dur: 154463000,
      id: 70140,
      tid: 2532,
      pid: 2519
    }
  ];
  it('TabPaneBinderDataCutTest01 ',  () => {
    tabPaneBinderDataCut.dataCutFunc(threadIdInput, threadFuncInput, 'loop');
    expect(tabPaneBinderDataCut.threadBindersTbl.loading).toBeUndefined();
  });

  it('TabPaneBinderDataCutTest02 ',  () => {
    tabPaneBinderDataCut.verifyInputIsEmpty('', '', threadIdInput, threadFuncInput);
    expect(tabPaneBinderDataCut.threadBindersTbl.loading).toBeFalsy();
  });

  it('TabPaneBinderDataCutTest03 ',  () => {
    tabPaneBinderDataCut.clearCycleRange();
    expect(tabPaneBinderDataCut.cycleAStartRangeDIV.value).toEqual('');
  });

  it('TabPaneBinderDataCutTest04 ',  () => {
    tabPaneBinderDataCut.singleDataCutCycleMap(data);
    tabPaneBinderDataCut.loopDataCutCycleMap(data);
    let cycData = [
      {
        title: "cycle 1_ACCS0",
        tid: 2716,
        pid: 2519,
        durNs: 416584000,
        tsNs: 2677246000,
        cycleDur: 416.584,
        cycleStartTime: 2677.246,
        totalCount: 214,
        binderTransactionCount: 214,
        binderAsyncRcvCount: 0,
        binderReplyCount: 0,
        binderTransactionAsyncCount: 0,
        idx: 1,
        type: "Cycle",
        isHover: false
      },
      {
        title: "cycle 2_ACCS0",
        tid: 2716,
        pid: 2519,
        durNs: 368880000,
        tsNs: 3093830000,
        cycleDur: 368.88,
        cycleStartTime: 3093.83,
        totalCount: 198,
        binderTransactionCount: 198,
        binderAsyncRcvCount: 0,
        binderReplyCount: 0,
        binderTransactionAsyncCount: 0,
        idx: 2,
        type: "Cycle",
        isHover: false
      },
      {
        title: "cycle 6_ACCS0",
        tid: 2716,
        pid: 2519,
        durNs: 458350000,
        tsNs: 4706839000,
        cycleDur: 458.35,
        cycleStartTime: 4706.839,
        totalCount: 200,
        binderTransactionCount: 200,
        binderAsyncRcvCount: 0,
        binderReplyCount: 0,
        binderTransactionAsyncCount: 0,
        idx: 6,
        type: "Cycle",
        isHover: false
      },
      {
        title: "cycle 10_ACCS0",
        tid: 2716,
        pid: 2519,
        durNs: 465838000,
        tsNs: 6408752000,
        cycleDur: 465.838,
        cycleStartTime: 6408.752,
        totalCount: 217,
        binderTransactionCount: 217,
        binderAsyncRcvCount: 0,
        binderReplyCount: 0,
        binderTransactionAsyncCount: 0,
        idx: 10,
        type: "Cycle",
        isHover: false
      },
      {
        title: "cycle 12_ACCS0",
        tid: 2716,
        pid: 2519,
        durNs: 631522000,
        tsNs: 7411421000,
        cycleDur: 631.522,
        cycleStartTime: 7411.421,
        totalCount: 248,
        binderTransactionCount: 248,
        binderAsyncRcvCount: 0,
        binderReplyCount: 0,
        binderTransactionAsyncCount: 0,
        idx: 12,
        type: "Cycle",
        isHover: false
      },
      {
        title: "cycle 14_ACCS0",
        tid: 2716,
        pid: 2519,
        durNs: 470715000,
        tsNs: 8508715000,
        cycleDur: 470.715,
        cycleStartTime: 8508.715,
        totalCount: 252,
        binderTransactionCount: 252,
        binderAsyncRcvCount: 0,
        binderReplyCount: 0,
        binderTransactionAsyncCount: 0,
        idx: 14,
        type: "Cycle",
        isHover: false
      },
      {
        title: "cycle 18_ACCS0",
        tid: 2716,
        pid: 2519,
        durNs: 394807000,
        tsNs: 10179222000,
        cycleDur: 394.807,
        cycleStartTime: 10179.222,
        totalCount: 225,
        binderTransactionCount: 225,
        binderAsyncRcvCount: 0,
        binderReplyCount: 0,
        binderTransactionAsyncCount: 0,
        idx: 18,
        type: "Cycle",
        isHover: false
      }
    ]
    expect(tabPaneBinderDataCut.structuredLaneChartData(cycData)).toEqual([[{
      "cycle": 1,
      "dur": 416584000,
      "name": "binder transaction",
      "startNS": 2677246000,
      "value": 214,
    }], [{
      "cycle": 2,
      "dur": 368880000,
      "name": "binder transaction",
      "startNS": 3093830000,
      "value": 198,
    }], [{
      "cycle": 6,
      "dur": 458350000,
      "name": "binder transaction",
      "startNS": 4706839000,
      "value": 200,
    }], [{
      "cycle": 10,
      "dur": 465838000,
      "name": "binder transaction",
      "startNS": 6408752000,
      "value": 217,
    }], [{
      "cycle": 12,
      "dur": 631522000,
      "name": "binder transaction",
      "startNS": 7411421000,
      "value": 248,
    }], [{
      "cycle": 14,
      "dur": 470715000,
      "name": "binder transaction",
      "startNS": 8508715000,
      "value": 252,
    }], [{
      "cycle": 18,
      "dur": 394807000,
      "name": "binder transaction",
      "startNS": 10179222000,
      "value": 225,
    }]]);
  });

  it('TabPaneBinderDataCutTest05 ',  () => {
    let clickData = {
      pid: 2519,
      title: "tutu.ABenchMark [2519]",
      totalCount: 4097,
      type: "Process",
      children: [
        {
          title: "ACCS0 [2716]",
          totalCount: 4097,
          tid: 2716,
          pid: 2519,
          children: [
            {
              title: "cycle 1_ACCS0",
              tid: 2716,
              pid: 2519,
              durNs: 416584000,
              tsNs: 2677246000,
              cycleDur: 416.584,
              cycleStartTime: 2677.246,
              totalCount: 214,
              binderTransactionCount: 214,
              binderAsyncRcvCount: 0,
              binderReplyCount: 0,
              binderTransactionAsyncCount: 0,
              idx: 1,
              type: "Cycle"
            },
            {
              title: "cycle 3_ACCS0",
              tid: 2716,
              pid: 2519,
              durNs: 410530000,
              tsNs: 3462710000,
              cycleDur: 410.53,
              cycleStartTime: 3462.71,
              totalCount: 216,
              binderTransactionCount: 216,
              binderAsyncRcvCount: 0,
              binderReplyCount: 0,
              binderTransactionAsyncCount: 0,
              idx: 3,
              type: "Cycle"
            },
            {
              title: "cycle 17_ACCS0",
              tid: 2716,
              pid: 2519,
              durNs: 295990000,
              tsNs: 9883232000,
              cycleDur: 295.99,
              cycleStartTime: 9883.232,
              totalCount: 171,
              binderTransactionCount: 171,
              binderAsyncRcvCount: 0,
              binderReplyCount: 0,
              binderTransactionAsyncCount: 0,
              idx: 17,
              type: "Cycle"
            },
            {
              title: "cycle 18_ACCS0",
              tid: 2716,
              pid: 2519,
              durNs: 394807000,
              tsNs: 10179222000,
              cycleDur: 394.807,
              cycleStartTime: 10179.222,
              totalCount: 225,
              binderTransactionCount: 225,
              binderAsyncRcvCount: 0,
              binderReplyCount: 0,
              binderTransactionAsyncCount: 0,
              idx: 18,
              type: "Cycle"
            }
          ],
          type: "Thread",
          isHover: false,
          status: true,
          isSelected: true
        }
      ],
      isHover: false
    }
    tabPaneBinderDataCut.tHeadClick(clickData);
    tabPaneBinderDataCut.drawColumn();
    expect(tabPaneBinderDataCut.chartTotal.config.appendPadding).toEqual(10);
  });

  it('TabPaneBinderDataCutTest06 ',  () => {
    let itemRowClick = new CustomEvent('row-click', <CustomEventInit>{
      detail: {
        ...{},
        data: {
          tid: 1,
          pid: 2,
          type: 'Process',
          isSelected: false
        },
      }
    });
    tabPaneBinderDataCut.tableRowClickFunc();
    tabPaneBinderDataCut.threadBindersTbl.dispatchEvent(itemRowClick);
    expect(tabPaneBinderDataCut.hasAttribute('hideQueryArea')).toBeTruthy();
  });

  it('TabPaneBinderDataCutTest7 ',  () => {
    let itemRowClick = new CustomEvent('row-click', <CustomEventInit>{
      detail: {
        ...{},
        data: {
          tid: 1,
          pid: 2,
          type: 'Thread',
          isSelected: false
        },
      }
    });
    tabPaneBinderDataCut.structuredLaneChartData = jest.fn();
    SpSegmentationChart.setBinderChartData = jest.fn();
    tabPaneBinderDataCut.tableRowClickFunc();
    tabPaneBinderDataCut.threadBindersTbl.dispatchEvent(itemRowClick);
    expect(tabPaneBinderDataCut.hasAttribute('hideQueryArea')).toBeFalsy();
  });

  it('TabPaneBinderDataCutTest8 ',  () => {
    let itemRowClick = new CustomEvent('row-click', <CustomEventInit>{
      detail: {
        ...{},
        data: {
          tid: 1,
          pid: 2,
          type: 'Cycle',
          isSelected: false
        },
      }
    });
    tabPaneBinderDataCut.tableRowClickFunc();
    tabPaneBinderDataCut.threadBindersTbl.dispatchEvent(itemRowClick);
    expect(tabPaneBinderDataCut.hasAttribute('hideQueryArea')).toBeFalsy();
  });

  it('TabPaneBinderDataCutTest9 ',  () => {
    let itemRowClick = new CustomEvent('click', <CustomEventInit>{
      detail: {
        ...{},
        data: {
          tid: 1,
          pid: 2,
          type: 'Cycle',
          isSelected: false
        },
      }
    });
    tabPaneBinderDataCut.queryBtnClick();
    tabPaneBinderDataCut.shadowRoot?.querySelector('#query-btn').dispatchEvent(itemRowClick);
    expect(tabPaneBinderDataCut.hasAttribute('hideQueryArea')).toBeFalsy();
  });
});
