/*
 * Copyright (C) 2023 Huawei Device Co., Ltd.
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
import { TabPaneFreqDataCut } from '../../../../../../src/trace/component/trace/sheet/frequsage/TabPaneFreqDataCut';
import {
  TabPaneFreqUsageConfig
} from '../../../../../../src/trace/component/trace/sheet/frequsage/TabPaneFreqUsageConfig';

const sqlite = require('../../../../../../src/trace/database/sql/ProcessThread.sql');
jest.mock('../../../../../../src/trace/database/sql/ProcessThread.sql');
const cpuSqlite = require('../../../../../../src/trace/database/sql/Cpu.sql');
jest.mock('../../../../../../src/trace/database/sql/Cpu.sql');
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
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../../../src/trace/component/trace/base/TraceRow', () => {
  return {};
});
jest.mock('../../../../../../src/js-heap/model/DatabaseStruct', () => {
  return {};
});

window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));
describe('TabPaneFreqDataCut Test', () => {
  let data = {
    leftNs: 0,
    rightNs: 0,
    processIds: [1, 2],
  };
  let getTabRunningPercent = sqlite.getTabRunningPercent;
  getTabRunningPercent.mockResolvedValue([
    {
      pid: 1,
      tid: 1,
      state: 'Running',
      cpu: 0,
      dur: 0,
      ts: 1,
    }
  ]);
  let queryCpuFreqFilterId = cpuSqlite.queryCpuFreqFilterId;
  queryCpuFreqFilterId.mockResolvedValue([{
    id: 1,
    cpu: 0,
  }]);
  let queryCpuFreqUsageData = cpuSqlite.queryCpuFreqUsageData;
  queryCpuFreqUsageData.mockResolvedValue([{
    value: '',
    dur: '',
    startNS: 0,
    filter_id: 1,
  }]);
  let searchFuncDataData = funSqlite.querySearchFuncData;
  searchFuncDataData.mockResolvedValue([{
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
  let tabPaneFreqDataCut = new TabPaneFreqDataCut();
  it('TabPaneFreqDataCutTest01 ', function () {
    document.body.innerHTML = `<div><tabpane-freqdatacut id="freq-data"></tabpane-freqdatacut></div>`;
    let tabFreqDataCut = document.querySelector<TabPaneFreqDataCut>('#freq-data');
    tabFreqDataCut.data = data;
    expect(tabFreqDataCut.data).toBeUndefined();
  });
  it('TabPaneFreqDataCutTest02', () => {
    const arr = [
      {percent: 50, children: []},
      {percent: 75.123456, children: [{percent: 80, children: []}]},
    ];
    tabPaneFreqDataCut.fixedDeal(arr);
    expect(arr[0].percent).toBe('50.00');
    expect(arr[1].percent).toBe('75.12');
    expect(arr[1].children[0].percent).toBe('80.00');
  });
  it('TabPaneFreqDataCutTest03', () => {
    const threadArr = [
      {pid: 1, tid: 1, children: []},
      {pid: 2, tid: 2, children: []},
    ];
    const totalData = [
      {pid: 1, tid: 1},
    ];
    tabPaneFreqDataCut.mergeTotalData(threadArr, totalData);
    expect(threadArr).toEqual([
      {pid: 1, tid: 1, children: [{pid: 1, tid: 1, thread: 'TotalData'}]},
      {pid: 2, tid: 2, children: []},
    ]);
  });
  it('TabPaneFreqDataCutTest04 ', function () {
    const obj = {
      children: [],
      count: 0,
      dur: 0,
      percent: 0
    };
    const arr = [
      {count: 1, dur: 10, percent: 10},
      {count: 2, dur: 20, percent: 20},
      {count: 0, dur: 0, percent: 0},
      {count: 3, dur: 30, percent: 30}
    ];
    tabPaneFreqDataCut.mergeCycleData(obj, arr);
    expect(obj.children.length).toBe(3);
    expect(obj.children).toContainEqual({count: 1, dur: 10, percent: 10});
    expect(obj.children).toContainEqual({count: 2, dur: 20, percent: 20});
    expect(obj.children).toContainEqual({count: 3, dur: 30, percent: 30});
    expect(obj.count).toBe(6);
    expect(obj.dur).toBe(60);
    expect(obj.percent).toBe(60);
  });
  it('TabPaneFreqDataCutTest05 ', function () {
    const resList = [
      {cpu: 'A', freq: 1, id: 1, dur: 10, percent: 50, count: 1},
      {cpu: 'A', freq: 1, id: 1, dur: 20, percent: 30, count: 2},
      {cpu: 'B', freq: 2, id: 2, dur: 15, percent: 40, count: 1},
      {cpu: 'B', freq: 2, id: 2, dur: 25, percent: 20, count: 2},
    ];
    tabPaneFreqDataCut.mergeData(resList);
    expect(resList).toEqual([
      {cpu: 'A', freq: 1, id: 1, dur: 30, percent: 80, count: 3},
      {cpu: 'B', freq: 2, id: 2, dur: 40, percent: 60, count: 3}
    ]);
  });

  it('TabPaneFreqDataCutTest06 ', function () {
    let dealArr: Array<{ts: number, dur: number}> = [
      {
        "ts": 168760136913000,
        "dur": 137768000
      },
      {
        "ts": 168760506232000,
        "dur": 144391000
      },
      {
        "ts": 168760915781000,
        "dur": 164178000
      },
      {
        "ts": 168761340107000,
        "dur": 154698000
      },
      {
        "ts": 168761756691000,
        "dur": 133540000
      },
      {
        "ts": 168762125571000,
        "dur": 142127000
      },
      {
        "ts": 168762536101000,
        "dur": 149769000
      },
      {
        "ts": 168762958217000,
        "dur": 150150000
      },
      {
        "ts": 168763369700000,
        "dur": 143612000
      },
      {
        "ts": 168763828050000,
        "dur": 145251000
      },
      {
        "ts": 168764209160000,
        "dur": 148508000
      },
      {
        "ts": 168764598338000,
        "dur": 178657000
      },
      {
        "ts": 168765071613000,
        "dur": 264921000
      },
      {
        "ts": 168765537451000,
        "dur": 205472000
      },
      {
        "ts": 168766074282000,
        "dur": 311942000
      },
      {
        "ts": 168766705804000,
        "dur": 165649000
      }
    ];
    let freqUsageConfig = [
      {
        "thread": "ACCS0",
        "count": 0,
        "dur": 745659,
        "cdur": "",
        "flag": "freqdata",
        "id": -1,
        "ts": 168760089353341,
        "pid": 2519,
        "tid": 2716,
        "cpu": 0,
        "freq": 1593600,
        "percent": 0.014515453053278886
      },
      {
        "thread": "ACCS0",
        "count": 0,
        "dur": 1125000,
        "cdur": "",
        "flag": "freqdata",
        "id": -1,
        "ts": 168760090523000,
        "pid": 2519,
        "tid": 2716,
        "cpu": 0,
        "freq": 1593600,
        "percent": 0.021899936411870234
      }
    ];
    let targetMap: Map<string, Array<TabPaneFreqUsageConfig>> = new Map<string, Array<TabPaneFreqUsageConfig>>();
    targetMap.set("2519_2716", freqUsageConfig);
    targetMap.set("2519_2532", freqUsageConfig);
    let cycleMap: Map<string, Array<TabPaneFreqUsageConfig>> = new Map<string, Array<TabPaneFreqUsageConfig>>();
    cycleMap.set("2519_2716", freqUsageConfig);
    cycleMap.set("2519_2532", freqUsageConfig);
    let totalList: Map<string, Array<TabPaneFreqUsageConfig>> = new Map<string, Array<TabPaneFreqUsageConfig>>();
    totalList.set("2519_2716", freqUsageConfig);
    totalList.set("2519_2532", freqUsageConfig);
    tabPaneFreqDataCut.currentSelectionParam = {
      rightNs: 1000,
      recordStartNs: 200,
      leftNs: 0
    };
    expect(tabPaneFreqDataCut.mergeSingleData(dealArr, targetMap, cycleMap, totalList)).toBeUndefined();
  });

  it('TabPaneFreqDataCutTest07 ', function () {
    let threadIdDiv = document.createElement('div') as HTMLInputElement;
    let threadFuncDiv = document.createElement('div') as HTMLInputElement;
    tabPaneFreqDataCut.currentSelectionParam = {
      rightNs: 1000,
      recordStartNs: 200,
      leftNs: 0
    }
    threadIdDiv.value = '';
    threadFuncDiv.value = '';
    tabPaneFreqDataCut.mergeSingleData = jest.fn();
    expect(tabPaneFreqDataCut.dataSingleCut(threadIdDiv, threadFuncDiv, [])).toBeUndefined();
  });

  it('TabPaneFreqDataCutTest08 ', function () {
    let threadIdDiv = document.createElement('div') as HTMLInputElement;
    let threadFuncDiv = document.createElement('div') as HTMLInputElement;
    let dataList = [{pid: 1, tid: 1, children: [{pid: 1, tid: 1, thread: 'TotalData'}]}];
    tabPaneFreqDataCut.currentSelectionParam = {
      rightNs: 1000,
      recordStartNs: 200,
      leftNs: 0
    }
    threadIdDiv.value = '7';
    threadFuncDiv.value = '8';
    tabPaneFreqDataCut.mergeSingleData = jest.fn();
    expect(tabPaneFreqDataCut.dataSingleCut(threadIdDiv, threadFuncDiv, dataList)).toBeUndefined();
  });

  it('TabPaneFreqDataCutTest09 ', function () {
    let str = '';
    let arg = {i: 1, percent: 20, startTime: 0, consumption: 30, countMutiple: 3};
    let value = {pid: 12, tid: 17, dur: 200, cpu: 3, freq: 3};
    let funData = {ts: 10, dur: 20};
    let flag = 1;
    expect(tabPaneFreqDataCut.returnSingleObj(str, arg, value, funData, flag)).toEqual({
      cdur: "",
      children: undefined,
      count: 2000,
      cpu: 3,
      dur: 200,
      flag: "freqdata",
      freq: 3,
      id: 1,
      percent: 20,
      pid: 12,
      thread: "",
      tid: 17,
      ts: "",
    });
  });

  it('TabPaneFreqDataCutTest10 ', function () {
    let str = '';
    let arg = {i: 1, percent: 20, startTime: 0, consumption: 30, countMutiple: 3};
    let value = {pid: 12, tid: 17, dur: 200, cpu: 3, freq: 3};
    let funData = {ts: 10, dur: 20};
    let flag = 2;
    expect(tabPaneFreqDataCut.returnSingleObj(str, arg, value, funData, flag)).toEqual({
      cdur: "",
      children: undefined,
      count: 300,
      cpu: 3,
      dur: 30,
      flag: "freqdata",
      freq: 3,
      id: 1,
      percent: 3,
      pid: 12,
      thread: "",
      tid: 17,
      ts: "",
    });
  });

  it('TabPaneFreqDataCutTest11 ', function () {
    let str = '';
    let arg = {i: 1, percent: 20, startTime: 0, consumption: 30, countMutiple: 3};
    let value = {pid: 12, tid: 17, dur: 200, cpu: 3, freq: 3};
    let funData = {ts: 10, dur: 20};
    let flag = 3;
    expect(tabPaneFreqDataCut.returnSingleObj(str, arg, value, funData, flag)).toEqual({
      cdur: "",
      children: undefined,
      count: 200,
      cpu: 3,
      dur: 20,
      flag: "freqdata",
      freq: 3,
      id: 1,
      percent: 2,
      pid: 12,
      thread: "",
      tid: 17,
      ts: "",
    });
  });

  it('TabPaneFreqDataCutTest12 ', function () {
    let str = '';
    let arg = {i: 1, percent: 20, startTime: 0, consumption: 30, countMutiple: 3};
    let value = {pid: 12, tid: 17, dur: 200, cpu: 3, freq: 3};
    let funData = {ts: 10, dur: 20};
    let flag = 4;
    expect(tabPaneFreqDataCut.returnSingleObj(str, arg, value, funData, flag)).toEqual({
      cdur: "",
      children: undefined,
      count: 1900,
      cpu: 3,
      dur: 190,
      flag: "freqdata",
      freq: 3,
      id: 1,
      percent: 19,
      pid: 12,
      thread: "",
      tid: 17,
      ts: "",
    });
  });

  it('TabPaneFreqDataCutTest13 ', function () {
    let threadIdDiv = document.createElement('div') as HTMLInputElement;
    let threadFuncDiv = document.createElement('div') as HTMLInputElement;
    let dataList = [{pid: 1, tid: 1, children: [{pid: 1, tid: 1, thread: 'TotalData'}]}];
    tabPaneFreqDataCut.currentSelectionParam = {
      rightNs: 1000,
      recordStartNs: 200,
      leftNs: 0
    }
    threadIdDiv.value = '';
    threadFuncDiv.value = '';
    tabPaneFreqDataCut.mergeSingleData = jest.fn();
    tabPaneFreqDataCut.merge = jest.fn();
    expect(tabPaneFreqDataCut.dataLoopCut(threadIdDiv, threadFuncDiv, dataList)).toBeUndefined();
  });

  it('TabPaneFreqDataCutTest14 ', function () {
    let threadIdDiv = document.createElement('div') as HTMLInputElement;
    let threadFuncDiv = document.createElement('div') as HTMLInputElement;
    let dataList = [{pid: 1, tid: 1, children: [{pid: 1, tid: 1, thread: 'TotalData'}]}];
    tabPaneFreqDataCut.currentSelectionParam = {
      rightNs: 1000,
      recordStartNs: 200,
      leftNs: 0
    }
    threadIdDiv.value = '7';
    threadFuncDiv.value = '8';
    tabPaneFreqDataCut.mergeSingleData = jest.fn();
    tabPaneFreqDataCut.merge = jest.fn();
    expect(tabPaneFreqDataCut.dataLoopCut(threadIdDiv, threadFuncDiv, dataList)).toBeUndefined();
  });

  it('TabPaneFreqDataCutTest15 ', function () {
    let value = [{
      thread: "HeapTaskDaemon",
      count: 0,
      dur: 652420,
      cdur: "",
      flag: "freqdata",
      id: -1,
      ts: 168760398181580,
      pid: 2519,
      tid: 2532,
      cpu: 0,
      freq: 1593600,
      percent: 0.008945954654902404
    },{
      thread: "HeapTaskDaemon",
      count: 0,
      dur: 1062000,
      cdur: "",
      flag: "freqdata",
      id: -1,
      ts: 168760611803000,
      pid: 2519,
      tid: 2532,
      cpu: 0,
      freq: 1593600,
      percent: 0.014562097795141705
    },{
      thread: "HeapTaskDaemon",
      count: 0,
      dur: 515000,
      cdur: "",
      flag: "freqdata",
      id: -1,
      ts: 168763001249000,
      pid: 2519,
      tid: 2532,
      cpu: 0,
      freq: 1593600,
      percent: 0.007061657593689246
    },{
      thread: "HeapTaskDaemon",
      count: 0,
      dur: 37000,
      cdur: "",
      flag: "freqdata",
      id: -1,
      ts: 168768634868000,
      pid: 2519,
      tid: 2532,
      cpu: 0,
      freq: 1593600,
      percent: 0.0005073423902262177
    }];
    let cutArr = [{
      ts: 168760506232000,
      dur: 409549000
    },{
      ts: 168762125571000,
      dur: 410530000
    },{
      ts: 168764209160000,
      dur: 389178000
    },{
      ts: 168766074282000,
      dur: 631522000
    },{
      ts: 168768546093000,
      dur: 295990000
    },{
      ts: 168770208469000
    }];
    let constant = {
      i: 0,
      key: "2519_2532",
      countMutiple: 1000000,
      cpuArr: [
        0
      ],
      cpuMap: {}
    }

    let resList = [];
    let totalList = new Map([
      [
        "2519_2532",
        [
          {
            "thread": "HeapTaskDaemon",
            "count": "2400366.374",
            "dur": "1506.254",
            "cdur": "",
            "flag": "freqdata",
            "id": 0,
            "ts": "",
            "pid": 2519,
            "tid": 2532,
            "cpu": 0,
            "freq": 1593.6,
            "percent": "20.65"
          },
          {
            "thread": "HeapTaskDaemon",
            "count": "974.688",
            "dur": "0.715",
            "cdur": "",
            "flag": "freqdata",
            "id": 11,
            "ts": "",
            "pid": 2519,
            "tid": 2532,
            "cpu": 0,
            "freq": 1363.2,
            "percent": "0.01"
          }
        ]
      ],
      [
        "2519_2716",
        [
          {
            "thread": "ACCS0",
            "count": "7833524.064",
            "dur": "4915.615",
            "cdur": "",
            "flag": "freqdata",
            "id": 0,
            "ts": "",
            "pid": 2519,
            "tid": 2716,
            "cpu": 0,
            "freq": 1593.6,
            "percent": "67.40"
          },
          {
            "thread": "ACCS0",
            "count": "302.630",
            "dur": "0.222",
            "cdur": "",
            "flag": "freqdata",
            "id": 13,
            "ts": "",
            "pid": 2519,
            "tid": 2716,
            "cpu": 0,
            "freq": 1363.2,
            "percent": "0.00"
          }
        ]
      ],
      [
        "2519_2534",
        [
          {
            "thread": "FinalizerDaemon",
            "count": "13112.141",
            "dur": "8.228",
            "cdur": "",
            "flag": "freqdata",
            "id": 0,
            "ts": "",
            "pid": 2519,
            "tid": 2534,
            "cpu": 0,
            "freq": 1593.6,
            "percent": "0.11"
          }
        ]
      ],
      [
        "2519_2627",
        [
          {
            "thread": "tutu.ABenchMark",
            "count": "1874.074",
            "dur": "1.176",
            "cdur": "",
            "flag": "freqdata",
            "id": 0,
            "ts": "",
            "pid": 2519,
            "tid": 2627,
            "cpu": 0,
            "freq": 1593.6,
            "percent": "0.02"
          },
          {
            "thread": "tutu.ABenchMark",
            "count": "30.336",
            "dur": "0.020",
            "cdur": "",
            "flag": "freqdata",
            "id": 9,
            "ts": "",
            "pid": 2519,
            "tid": 2627,
            "cpu": 0,
            "freq": 1516.8,
            "percent": "0.00"
          },
          {
            "thread": "tutu.ABenchMark",
            "count": "37.440",
            "dur": "0.026",
            "cdur": "",
            "flag": "freqdata",
            "id": 15,
            "ts": "",
            "pid": 2519,
            "tid": 2627,
            "cpu": 0,
            "freq": 1440,
            "percent": "0.00"
          }
        ]
      ]
    ]);
    expect(tabPaneFreqDataCut.dismantlingLoop(value, cutArr, constant, resList, totalList)).toBeUndefined();
  });


  it('TabPaneFreqDataCutTest16 ', function () {
    let str = '';
    let arg = {i: 1, percent: 20, startTime: 0, consumption: 30, countMutiple: 3};
    let value = {pid: 12, tid: 17, dur: 200, cpu: 3, freq: 3};
    let funData = [{ts: 10, dur: 20}, {ts: 20, dur: 40}];
    let flag = 1;
    expect(tabPaneFreqDataCut.returnLoopObj(str, arg, value, funData, flag)).toEqual({
      cdur: "",
      children: undefined,
      count: 2000,
      cpu: 3,
      dur: 200,
      flag: "freqdata",
      freq: 3,
      id: 1,
      percent: undefined,
      pid: 12,
      thread: "",
      tid: 17,
      ts: "",
    });
  });

  it('TabPaneFreqDataCutTest17 ', function () {
    let str = '';
    let arg = {i: 0, percent: 20, startTime: 0, consumption: 30, countMutiple: 3};
    let value = {pid: 12, tid: 17, dur: 200, cpu: 3, freq: 3};
    let funData = [{ts: 10, dur: 20}, {ts: 20, dur: 40}];
    let flag = 2;
    expect(tabPaneFreqDataCut.returnLoopObj(str, arg, value, funData, flag)).toEqual({
      cdur: "",
      children: undefined,
      count: 200,
      cpu: 3,
      dur: 20,
      flag: "freqdata",
      freq: 3,
      id: 0,
      percent: 2,
      pid: 12,
      thread: "",
      tid: 17,
      ts: "",
    });
  });

  it('TabPaneFreqDataCutTest18 ', function () {
    let str = '';
    let arg = {i: 0, percent: 20, startTime: 0, consumption: 30, countMutiple: 3};
    let value = {pid: 12, tid: 17, dur: 200, cpu: 3, freq: 3};
    let funData = [{ts: 10, dur: 20}, {ts: 20, dur: 40}];
    let flag = 3;
    expect(tabPaneFreqDataCut.returnLoopObj(str, arg, value, funData, flag)).toEqual({
      cdur: "",
      children: undefined,
      count: 100,
      cpu: 3,
      dur: 10,
      flag: "freqdata",
      freq: 3,
      id: 0,
      percent: 1,
      pid: 12,
      thread: "",
      tid: 17,
      ts: "",
    });
  });

  it('TabPaneFreqDataCutTest19 ', function () {
    let str = '';
    let arg = {i: 0, percent: 20, startTime: 0, consumption: 30, countMutiple: 3};
    let value = {pid: 12, tid: 17, dur: 200, cpu: 3, freq: 3};
    let funData = [{ts: 10, dur: 20}, {ts: 20, dur: 40}];
    let flag = 4;
    expect(tabPaneFreqDataCut.returnLoopObj(str, arg, value, funData, flag)).toEqual({
      cdur: "",
      children: undefined,
      count: 1900,
      cpu: 3,
      dur: 190,
      flag: "freqdata",
      freq: 3,
      id: 0,
      percent: 19,
      pid: 12,
      thread: "",
      tid: 17,
      ts: "",
    });
  });

  it('TabPaneFreqDataCutTest20 ', function () {
    let threadArr = [
      {
        thread: 'ACCS0 2716',
        count: 3006075.782,
        dur: 1895.313,
        cdur: '',
        flag: 'thread',
        id: -1,
        ts: '',
        pid: 2519,
        tid: 2716,
        cpu: '',
        freq: '',
        percent: 27.72,
        children: [{
          thread: 'TotalData',
          count: 3006075.782,
          dur: 1895.313,
          cdur: '',
          flag: 'cycle',
          id: 0,
          ts: '',
          pid: 2519,
          tid: 2716,
          cpu: '',
          freq: '',
          percent: 27.72,
          children: [],
          isHover: false
        }],
        isHover: false,
        status: true
      }
    ];
    let cycleMap: Map<string, Array<TabPaneFreqUsageConfig>> = new Map<string, Array<TabPaneFreqUsageConfig>>();
    cycleMap.set('2519_2716', [{
      thread: 'cycle1—ACCS0',
      count: 125228.275,
      dur: 78.582,
      cdur: 144.391,
      flag: 'cycle',
      id: 1,
      ts: 1843.371,
      pid: 2519,
      tid: 2716,
      cpu: '',
      freq: '',
      percent: 1.15,
      children: [
        {
          thread: 'cycle1—ACCS0',
          count: 125228.275,
          dur: 78.582,
          cdur: '',
          flag: 'cpu',
          id: -1,
          ts: '',
          pid: 2519,
          tid: 2716,
          cpu: 0,
          freq: '',
          percent: 1.15,
          children: []
        }
      ],
      isHover: false
    }])
    expect(tabPaneFreqDataCut.mergeThreadData(threadArr, cycleMap)).toBeUndefined();
  });

  it('TabPaneFreqDataCutTest21 ', function () {
    let threadArr = [
      {
        thread: 'ACCS0 2716',
        count: 3006075.782,
        dur: 1895.313,
        cdur: '',
        flag: 'thread',
        id: -1,
        ts: '',
        pid: 2519,
        tid: 2716,
        cpu: '',
        freq: '',
        percent: 27.72,
        children: [{
          thread: 'TotalData',
          count: 3006075.782,
          dur: 1895.313,
          cdur: '',
          flag: 'cycle',
          id: 0,
          ts: '',
          pid: 2519,
          tid: 2716,
          cpu: '',
          freq: '',
          percent: 27.72,
          children: [],
          isHover: false
        }],
        isHover: false,
        status: true
      }
    ];
    let pidArr = [
      {
        thread: "tutu.ABenchMark 2519",
        count: "4673904.326",
        dur: "2948.279",
        cdur: "",
        flag: "process",
        id: -1,
        ts: "",
        pid: 2519,
        tid: "",
        cpu: "",
        freq: "",
        percent: "43.12",
        children: [
          {
            thread: "ACCS0 2716",
            count: "3006075.782",
            dur: "1895.313",
            cdur: "",
            flag: "thread",
            id: -1,
            ts: "",
            pid: 2519,
            tid: 2716,
            cpu: "",
            freq: "",
            percent: "27.72",
            children: [],
            isHover: false,
            status: true
          },
          {
            thread: "HeapTaskDaemon 2532",
            count: "1667117.798",
            dur: "1052.520",
            cdur: "",
            flag: "thread",
            id: -1,
            ts: "",
            pid: 2519,
            tid: 2532,
            cpu: "",
            freq: "",
            percent: "15.39",
            children: [],
            isHover: false
          }],
        isHover: false,
        status: true
      }
    ];
    expect(tabPaneFreqDataCut.mergePidData(pidArr, threadArr)).toBeUndefined();
  });
});
