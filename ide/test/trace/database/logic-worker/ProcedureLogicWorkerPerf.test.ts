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
  ProcedureLogicWorkerPerf,
  PerfCountSample,
  PerfCallChainMerageData,
  PerfStack,
  PerfCmdLine,
  timeMsFormat2p,
  PerfFile,
  PerfThread,
  PerfCallChain,
} from '../../../../src/trace/database/logic-worker/ProcedureLogicWorkerPerf';

import { PerfCall } from '../../../../src/trace/database/logic-worker/ProcedureLogicWorkerCommon';

describe('ProcedureLogicWorkerPerf Test', () => {
  it('ProcedureLogicWorkerPerfTest', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    expect(procedureLogicWorkerPerf).not.toBeUndefined();
  });

  it('ProcedureLogicWorkerPerfTest01', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let data = {
      id: 1,
      params: [
        {
          list: '',
        },
      ],
      action: '',
      type: 'perf-init',
    };
    procedureLogicWorkerPerf.initPerfFiles = jest.fn(() => true);
    expect(procedureLogicWorkerPerf.handle(data)).toBeUndefined();
  });

  it('ProcedureLogicWorkerPerfTest02', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let data = {
      id: 1,
      params: [
        {
          list: '',
        },
      ],
      action: '',
      type: 'perf-queryPerfFiles',
    };
    procedureLogicWorkerPerf.initPerfThreads = jest.fn(() => true);
    expect(procedureLogicWorkerPerf.handle(data)).toBeUndefined();
  });

  it('ProcedureLogicWorkerPerfTest03', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let data = {
      id: 1,
      params: [
        {
          list: '',
        },
      ],
      action: '',
      type: 'perf-queryPerfThread',
    };
    procedureLogicWorkerPerf.initPerfCalls = jest.fn(() => true);
    expect(procedureLogicWorkerPerf.handle(data)).toBeUndefined();
  });

  it('ProcedureLogicWorkerPerfTest04', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let data = {
      id: 1,
      params: [
        {
          list: '',
        },
      ],
      action: '',
      type: 'perf-queryPerfCalls',
    };
    procedureLogicWorkerPerf.initPerfCallchains = jest.fn(() => true);
    expect(procedureLogicWorkerPerf.handle(data)).toBeUndefined();
  });

  it('ProcedureLogicWorkerPerfTest05', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let data = {
      id: 1,
      params: [
        {
          list: '',
        },
      ],
      action: '',
      type: 'perf-queryPerfCallchains',
    };
    window.postMessage = jest.fn(() => true);
    procedureLogicWorkerPerf.initCallChainTopDown = jest.fn(() => true);
    expect(procedureLogicWorkerPerf.handle(data)).toBeUndefined();
  });

  it('ProcedureLogicWorkerPerfTest06', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let data = {
      id: 1,
      params: [
        {
          list: '',
        },
      ],
      action: '',
      type: 'perf-queryCallchainsGroupSample',
    };
    window.postMessage = jest.fn(() => true);
    expect(procedureLogicWorkerPerf.handle(data)).toBeUndefined();
  });

  it('ProcedureLogicWorkerPerfTest07', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let data = {
      id: 1,
      params: [
        {
          list: '',
        },
      ],
      action: '',
      type: 'perf-action',
    };
    procedureLogicWorkerPerf.resolvingAction = jest.fn(() => true);
    window.postMessage = jest.fn(() => true);
    expect(procedureLogicWorkerPerf.handle(data)).toBeUndefined();
  });

  it('ProcedureLogicWorkerPerfTest08', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    expect(procedureLogicWorkerPerf.clearAll()).toBeUndefined();
  });

  it('ProcedureLogicWorkerPerfTest19', function () {
    let perfCountSample = new PerfCountSample();
    perfCountSample = {
      sampleId: 0,
      count: 0,
      pid: 0,
      tid: 0,
      threadState: '',
    };
    expect(perfCountSample).not.toBeUndefined();
  });

  it('ProcedureLogicWorkerPerfTest20', function () {
    let perfStack = new PerfStack();
    perfStack = {
      sample: '',
      path: '',
      fileId: 0,
      type: 0,
      vaddrInFile: 0,
    };
    expect(perfStack).not.toBeUndefined();
  });

  it('ProcedureLogicWorkerPerfTest21', function () {
    let perfCmdLine = new PerfCmdLine();
    perfCmdLine = {
      report_value: '',
    };
    expect(perfCmdLine).not.toBeUndefined();
  });

  it('ProcedureLogicWorkerPerfTest21', function () {
    let perfCmdLine = new PerfCmdLine();
    perfCmdLine = {
      report_value: '',
    };
    expect(perfCmdLine).not.toBeUndefined();
  });

  it('ProcedureLogicWorkerPerfTest21', function () {
    let perfCall = new PerfCall();
    perfCall = {
      sampleId: 0,
      name: '',
      depth: 0,
    };
    expect(perfCall).not.toBeUndefined();
  });

  it('ProcedureLogicWorkerPerfTest22', function () {
    expect(timeMsFormat2p('')).toBe('0s');
  });

  it('ProcedureLogicWorkerPerfTest23', function () {
    expect(timeMsFormat2p(3600_000)).toBe('1.00h');
  });

  it('ProcedureLogicWorkerPerfTest24', function () {
    expect(timeMsFormat2p(60_000)).toBe('1.00min');
  });

  it('ProcedureLogicWorkerPerfTest25', function () {
    expect(timeMsFormat2p(1_000)).toBe('1.00s');
  });

  it('ProcedureLogicWorkerPerfTest26', function () {
    expect(timeMsFormat2p(100)).toBe('100.00ms');
  });

  it('ProcedureLogicWorkerPerfTest31', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    procedureLogicWorkerPerf.recursionChargeInitTree = jest.fn(() => undefined);
    let node = [
      {
        symbolName: '',
        libName: '',
        length: 1,
        initChildren: {
          length: 1,
        },
      },
    ];
    expect(procedureLogicWorkerPerf.recursionChargeInitTree(node, '', true)).toBeUndefined();
  });

  it('ProcedureLogicWorkerPerfTest33', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    procedureLogicWorkerPerf.recursionPruneInitTree = jest.fn(() => undefined);
    let node = {
      symbolName: '',
      libName: '',
      length: 1,
      initChildren: {
        length: 1,
      },
    };
    expect(procedureLogicWorkerPerf.recursionPruneInitTree(node, '', true)).toBeUndefined();
  });

  it('ProcedureLogicWorkerPerfTest34', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    procedureLogicWorkerPerf.recursionChargeByRule = jest.fn(() => undefined);
    let node = {
      initChildren: [
        {
          length: 1,
        },
      ],
    };
    let rule = {
      child: {
        isStore: 1,
      },
    };
    expect(procedureLogicWorkerPerf.recursionChargeByRule(node, '', rule)).toBeUndefined();
  });

  it('ProcedureLogicWorkerPerfTest35', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    window.postMessage = jest.fn(() => true);
    expect(procedureLogicWorkerPerf.queryData('', '', '')).toBeUndefined();
  });

  it('ProcedureLogicWorkerPerfTest36', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    procedureLogicWorkerPerf.queryData = jest.fn(() => true);
    expect(procedureLogicWorkerPerf.initPerfFiles()).toBeUndefined();
  });

  it('ProcedureLogicWorkerPerfTest37', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    procedureLogicWorkerPerf.queryData = jest.fn(() => true);
    expect(procedureLogicWorkerPerf.initPerfThreads()).toBeUndefined();
  });

  it('ProcedureLogicWorkerPerfTest38', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    procedureLogicWorkerPerf.queryData = jest.fn(() => true);
    expect(procedureLogicWorkerPerf.initPerfCalls()).toBeUndefined();
  });

  it('ProcedureLogicWorkerPerfTest39', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    procedureLogicWorkerPerf.queryData = jest.fn(() => true);
    expect(procedureLogicWorkerPerf.initPerfCallchains()).toBeUndefined();
  });

  it('ProcedureLogicWorkerPerfTest40', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    procedureLogicWorkerPerf.queryData = jest.fn(() => true);
    let selectionParam = {
      perfAll: '',
      perfCpus: [1],
      perfProcess: [2],
      perfThread: [1],
      leftNs: 0,
      rightNs: 0,
    };
    expect(procedureLogicWorkerPerf.getCurrentDataFromDb(selectionParam)).toBeUndefined();
  });

  it('ProcedureLogicWorkerPerfTest46', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let node = {
      children: {
        length: 1,
        forEach: jest.fn(() => true),
      },
      libName: 1,
    };
    let symbolName = 1;

    let isSymbol = true;
    expect(procedureLogicWorkerPerf.recursionPruneTree(node, symbolName, isSymbol)).toBeUndefined();
  });
  it('ProcedureLogicWorkerPerfTest47', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let node = {
      initChildren: {
        length: 1,
        forEach: jest.fn(() => true),
      },
    };
    let ruleName = 1;

    let rule = true;
    expect(procedureLogicWorkerPerf.recursionChargeByRule(node, ruleName, rule)).toBeUndefined();
  });
  it('ProcedureLogicWorkerPerfTest48', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let node = {
      initChildren: {
        length: 1,
        forEach: jest.fn(() => true),
      },
    };
    let symbolName = 1;
    expect(procedureLogicWorkerPerf.pruneChildren(node, symbolName)).toBeUndefined();
  });
  it('ProcedureLogicWorkerPerfTest49', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    expect(procedureLogicWorkerPerf.clearSplitMapData()).toBeUndefined();
  });
  it('PerfFileTest02', function () {
    let perfFile = new PerfFile();
    perfFile.path = jest.fn(() => true);
    perfFile.path.lastIndexOf = jest.fn(() => true);
    perfFile.path.substring = jest.fn(() => true);
    expect(perfFile.setFileName()).toBeUndefined();
  });
  it('PerfCallChainMerageDataTest03', function () {
    let perfCallChainMerageData = new PerfCallChainMerageData();
    perfCallChainMerageData.parentNode = true;
    expect(perfCallChainMerageData.parentNode).toBeTruthy();
  });
  it('PerfCallChainMerageDataTest04', function () {
    let perfCallChainMerageData = new PerfCallChainMerageData();
    perfCallChainMerageData.total = true;
    expect(perfCallChainMerageData.total).toBeTruthy();
  });
  it('ProcedureLogicWorkerPerfTest53', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    expect(procedureLogicWorkerPerf.hideSystemLibrary()).toBeUndefined();
  });
  it('ProcedureLogicWorkerPerfTest54', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    expect(procedureLogicWorkerPerf.hideNumMaxAndMin(1, '∞')).toBeUndefined();
  });
  it('ProcedureLogicWorkerPerfTest55', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let sampleArray = [
      {
        addr: '',
        canCharge: true,
        children: [],
        count: 4,
        currentTreeParentNode: {
          addr: '',
          canCharge: true,
          children: [],
          count: 4,
          currentTreeParentNode: {},
          depth: 0,
          dur: 1,
          id: '11758',
          initChildren: [],
          isSearch: false,
          isSelected: false,
          isStore: 0,
          lib: '',
          libName: 'ld-musl-aarch64.so.1',
          parentId: '977',
          path: '/system/lib/ld-musl-aarch64.so.1',
          pid: 28917,
          searchShow: false,
          self: '0ms',
          selfDur: 4,
          size: 0,
          symbol: 'fopen64  (ld-musl-aarch64.so.1)',
          symbolName: 'fopen64',
          tid: 28922,
          type: 0,
          vaddrInFile: 730108,
          weight: '1.00ms',
          weightPercent: '0.0%',
        },
        depth: 0,
        dur: 4,
        id: '2791',
        initChildren: [],
        isSearch: false,
        isSelected: false,
        isStore: 0,
        lib: '',
        libName: '[kernel.kallsyms]',
        parentId: '2790',
        path: '[kernel.kallsyms]',
        pid: 28917,
        searchShow: false,
        self: '4.00ms',
        selfDur: 4,
        size: 0,
        symbol: 'perf_trace_sched_switch  ([kernel.kallsyms])',
        symbolName: 'perf_trace_sched_switch',
        tid: 28922,
        type: 0,
        vaddrInFile: -274609073904,
        weight: '4.00ms',
        weightPercent: '0.0%',
      },
    ];
    expect(procedureLogicWorkerPerf.markSearchNode(sampleArray, 'da', false)).toBeUndefined();
  });
  it('ProcedureLogicWorkerPerfTest56', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    expect(procedureLogicWorkerPerf.splitAllProcess([])).toBeUndefined();
  });
  it('ProcedureLogicWorkerPerfTest58', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let callChains = [
      {
        tid: 1,
        sampleId: 20,
        symbolId: -1,
        fileName: 'a',
      },
      {
        tid: 2,
        sampleId: 30,
        symbolId: 0,
        fileName: 'a',
      },
    ];
    expect(procedureLogicWorkerPerf.setPerfCallChainFrameName(callChains)).toBeUndefined();
  });
  it('ProcedureLogicWorkerPerfTest59', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let callChains = [
      {
        sampleId: '',
        depth: 0,
        canCharge: false,
        name: '',
        tid: '',
        fileName: '',
        threadName: '',
      },
      {
        sampleId: '',
        depth: 0,
        canCharge: false,
        name: '',
        tid: '',
        fileName: '',
        threadName: '',
      },
    ];
    expect(procedureLogicWorkerPerf.addPerfGroupData(callChains)).toBeUndefined();
  });

  it('ProcedureLogicWorkerPerfTest61', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let currentNode = {
      initChildren: {
        filter: jest.fn(() => true),
      },
    };
    expect(procedureLogicWorkerPerf.mergeChildrenByIndex(currentNode, [{name:'sf'}], 0, [], true)).toBeUndefined();
  });
  it('ProcedureLogicWorkerPerfTest62', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let sample = {
      symbolName: '',
      initChildren: {
        length: 2,
        forEach: jest.fn(() => true),
      },
    };
    expect(procedureLogicWorkerPerf.recursionPerfChargeInitTree(sample, [], true)).toBeUndefined();
  });
  it('ProcedureLogicWorkerPerfTest63', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let sample = {
      symbolName: '',
      initChildren: {
        length: 2,
        forEach: jest.fn(() => true),
      },
    };
    expect(procedureLogicWorkerPerf.recursionPerfPruneInitTree(sample, [], true)).toBeUndefined();
  });
  it('ProcedureLogicWorkerPerfTest64', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let params = [
      {
        length: 2,
        funcName: 'hideSystemLibrary',
        funcArgs: [{}],
      },
    ];
    expect(procedureLogicWorkerPerf.resolvingAction(params)).toBeTruthy();
  });
  it('ProcedureLogicWorkerPerfTest65', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let params = [
      {
        length: 2,
        funcName: 'hideNumMaxAndMin',
        funcArgs: [{}],
      },
    ];
    expect(procedureLogicWorkerPerf.resolvingAction(params)).toBeTruthy();
  });
  it('ProcedureLogicWorkerPerfTest66', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let params = [
      {
        length: 2,
        funcName: 'getCurrentDataFromDb',
        funcArgs: [
          {
            perfAll: 1,
          },
        ],
      },
    ];
    window.postMessage = jest.fn(() => true);
    expect(procedureLogicWorkerPerf.resolvingAction(params)).toBeTruthy();
  });
  it('ProcedureLogicWorkerPerfTest67', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let params = [
      {
        length: 2,
        funcName: 'splitAllProcess',
        funcArgs: [
          {
            perfAll: 1,
            forEach: jest.fn(() => true),
          },
        ],
      },
    ];
    window.postMessage = jest.fn(() => true);
    expect(procedureLogicWorkerPerf.resolvingAction(params)).toBeTruthy();
  });
  it('ProcedureLogicWorkerPerfTest68', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let params = [
      {
        length: 2,
        funcName: 'resetAllNode',
        funcArgs: [{}],
      },
    ];
    window.postMessage = jest.fn(() => true);
    expect(procedureLogicWorkerPerf.resolvingAction(params)).toBeTruthy();
  });
  it('ProcedureLogicWorkerPerfTest69', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let params = [
      {
        length: 2,
        funcArgs: [
          {
            forEach: jest.fn(() => true),
          },
        ],
        funcName: 'resotreAllNode',
      },
    ];
    window.postMessage = jest.fn(() => true);
    expect(procedureLogicWorkerPerf.resolvingAction(params)).toBeTruthy();
  });
  it('ProcedureLogicWorkerPerfTest70', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let params = [
      {
        length: 2,
        funcArgs: [
          {
            forEach: jest.fn(() => true),
          },
        ],
        funcName: 'clearSplitMapData',
      },
    ];
    window.postMessage = jest.fn(() => true);
    expect(procedureLogicWorkerPerf.resolvingAction(params)).toBeTruthy();
  });
  it('ProcedureLogicWorkerPerfTest71', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let params = [
      {
        length: 2,
        funcName: 'splitTree',
        funcArgs: [
          {
            forEach: jest.fn(() => true),
          },
        ],
      },
    ];
    window.postMessage = jest.fn(() => true);
    expect(procedureLogicWorkerPerf.resolvingAction(params)).toBeTruthy();
  });
  it('ProcedureLogicWorkerPerfTest72', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    window.postMessage = jest.fn(() => true);
    expect(procedureLogicWorkerPerf.topUpDataToBottomUpData([])).toBeTruthy();
  });
  it('ProcedureLogicWorkerPerfTest73', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    window.postMessage = jest.fn(() => true);
    expect(procedureLogicWorkerPerf.mergeTreeBifurcation([], [])).toBeTruthy();
  });
  it('ProcedureLogicWorkerPerfTest74', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    window.postMessage = jest.fn(() => true);
    let perfBottomUpStruct = {
      addChildren: jest.fn(() => true),
      tsArray: [],
    };
    expect(procedureLogicWorkerPerf.copyParentNode(perfBottomUpStruct, { parentNode: 1, tsArray: [] })).toBeUndefined();
  });
  it('ProcedureLogicWorkerPerfTest75', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    window.postMessage = jest.fn(() => true);
    let perfBottomUpStruct = {
      addChildren: jest.fn(() => true),
      tsArray: [],
    };
    expect(procedureLogicWorkerPerf.copyParentNode(perfBottomUpStruct, { parentNode: 1, tsArray: [] })).toBeUndefined();
  });
  it('PerfCallChainTest76', function () {
    expect(PerfCallChain.setNextNode([], []));
  });
  it('PerfCallChainTest77', function () {
    expect(PerfCallChain.setPreviousNode([], []));
  });
  it('PerfCallChainTest78', function () {
    expect(PerfCallChain.merageCallChain([], []));
  });
  it('PerfCallChainTest79', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    expect(procedureLogicWorkerPerf.perfReset()).toBeUndefined();
  });
  it('PerfCallChainTest80', function () {
    let currentNode = {
      symbolName: '',
      tsArray: [],
    };
    let callChain = {
      vaddrInFile: {
        toString: jest.fn(() => true),
      },
    };
    expect(
      PerfCallChainMerageData.merageCallChainSample(
        currentNode,
        callChain,
        {
          ts: '',
        },
        true
      )
    );
  });
  it('PerfCallChainTest81', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let data = {
      id: 18,
      type: 'perf-async',
    };
    procedureLogicWorkerPerf.perfAsync = jest.fn(() => true);
    procedureLogicWorkerPerf.handle(data);
    expect(procedureLogicWorkerPerf.perfAsync).toHaveBeenCalled();
  });
  it('PerfCallChainTest82', function () {
    let perfCallChain = new PerfCallChain();
    perfCallChain.startNS = 10;
    perfCallChain.dur = 10;
    perfCallChain.sampleId = 10;
    perfCallChain.vaddrInFile = 10;
    perfCallChain.callChainId = 10;
    perfCallChain.tid = 10;
    expect(perfCallChain.startNS).toEqual(10);
    expect(perfCallChain.dur).toEqual(10);
    expect(perfCallChain.sampleId).toEqual(10);
    expect(perfCallChain.vaddrInFile).toEqual(10);
    expect(perfCallChain.callChainId).toEqual(10);
    expect(perfCallChain.tid).toEqual(10);
  });
  it('PerfCallChainTest83', function () {
    let perfCallChainMerageData = new PerfCallChainMerageData();
    perfCallChainMerageData.totalEvent = 80;
    expect(perfCallChainMerageData.totalEvent).toEqual(80);
  });
  it('PerfCallChainTest84', function () {
    let perfThread = new PerfThread();
    perfThread.tid = 80;
    expect(perfThread.tid).toEqual(80);
  });
  it('PerfCallChainTest85', function () {
    let perfFile = new PerfFile();
    perfFile.symbol = '80';
    perfFile.path = 'C:/myfile';
    let data = {
      path: 'C:/myfile',
    };
    expect(perfFile.setFileName()).toBeUndefined();
  });
  it('PerfCallChainTest86', function () {
    let data = {
      path: 'C:/myfile',
      fileId: 5,
      symbol: 'f',
      fileName: 'myfile',
      setFileName: 'sfd',
    };
    expect(PerfFile.setFileName(data)).toBeUndefined();
  });
  it('PerfCallChainTest87', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let data = new PerfCountSample();
    data.sampleId = 10;
    expect(procedureLogicWorkerPerf.getBottomUp()).not.toBeUndefined();
  });
  it('PerfCallChainTest88', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    expect(procedureLogicWorkerPerf.combineCallChainForAnalysis()).not.toBeUndefined();
  });
  it('PerfCallChainTest90', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let data = {
      id: 18,
      type: 'perf-reset',
    };
    procedureLogicWorkerPerf.perfReset = jest.fn(() => true);
    procedureLogicWorkerPerf.handle(data);
    expect(procedureLogicWorkerPerf.perfReset).toHaveBeenCalled();
  });
  it('PerfCallChainTest91', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let data = {
      id: 18,
      type: 'perf-reset',
    };
    procedureLogicWorkerPerf.perfReset = jest.fn(() => true);
    procedureLogicWorkerPerf.handle(data);
    expect(procedureLogicWorkerPerf.perfReset).toHaveBeenCalled();
  });
  it('PerfCallChainTest92', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let data = [{ funcArgs: [1, 2, 3] }];
    expect(procedureLogicWorkerPerf.setLib(data)).toBeUndefined();
  });
  it('PerfCallChainTest93', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let data = [{ funcArgs: [1, 2, 3] }];
    expect(procedureLogicWorkerPerf.setSymbol(data)).toBeUndefined();
  });
  it('PerfCallChainTest94', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let data = [
      { funcName: 'getCallChainsBySampleIds', funcArgs: [1, 8, 5] },
      { funcName: 'hideSystemLibrary', funcArgs: [1, 8, 5] },
      { funcName: 'hideThreadState', funcArgs: [1, 8, 5] },
      { funcName: 'hideThread', funcArgs: [1, 8, 5] },
    ];
    procedureLogicWorkerPerf.lib = { name: 'getCallChainsBySampleIds' };
    expect(procedureLogicWorkerPerf.calReturnData(data)).not.toBeUndefined();
  });
  it('PerfCallChainTest95', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let data = [
      { funcName: 'getCallChainsBySampleIds', funcArgs: [1, 8, 5] },
      { funcName: 'hideSystemLibrary', funcArgs: [1, 8, 5] },
      { funcName: 'hideThreadState', funcArgs: [1, 8, 5] },
      { funcName: 'hideThread', funcArgs: [1, 8, 5] },
    ];
    procedureLogicWorkerPerf.symbol = { name: 'hideThread' };
    expect(procedureLogicWorkerPerf.calReturnData(data)).not.toBeUndefined();
  });
  it('PerfCallChainTest96', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let data = [
      { startNS: 50, dur: 8, sampleId: 1, callChainId: 4 },
      { startNS: 50, dur: 8, sampleId: 80, callChainId: 4 },
    ];
    expect(procedureLogicWorkerPerf.initPerfCallChainTopDown(data)).toBeUndefined();
  });
  it('PerfCallChainTest97', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let perfCountSample = new PerfCountSample();
    let perfThread = new PerfThread();
    perfThread.processName = 'a';
    procedureLogicWorkerPerf.threadData[0] =  perfThread;
    let perfCallChainMerageData = new PerfCallChainMerageData();
    perfCallChainMerageData.tid = 0;
    procedureLogicWorkerPerf.currentTreeMapData['sf'] = perfCallChainMerageData;
    let list: PerfCallChain[] = [
      { startNS: 50, dur: 8, sampleId: 1, callChainId: 4 },
      { startNS: 50, dur: 8, sampleId: 80, callChainId: 4 },
    ];
    expect(procedureLogicWorkerPerf.addOtherCallchainsData(perfCountSample, list)).toBeUndefined();
  });
  it('PerfCallChainTest98', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let perfThread = new PerfThread();
    perfThread.processName = 'a';
    procedureLogicWorkerPerf.threadData[0] =  perfThread;
    let perfCallChainMerageData = new PerfCallChainMerageData();
    perfCallChainMerageData.tid = 0;
    procedureLogicWorkerPerf.currentTreeMapData['sf'] = perfCallChainMerageData;
    expect(procedureLogicWorkerPerf.mergeNodeData(5, 8)).not.toBeUndefined();
  });
  it('PerfCallChainTest99', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let perfCountSample = new PerfCountSample();
    perfCountSample.sampleId = 0;
    perfCountSample.tid = 0;
    let perfThread = new PerfThread();
    perfThread.processName = 'a';
    procedureLogicWorkerPerf.threadData[0] =  perfThread;
    let perfCallChain = new PerfCallChain();
    perfCallChain.name = '0';
    procedureLogicWorkerPerf.callChainData[0] = [perfCallChain];
    expect(procedureLogicWorkerPerf.freshPerfCallchains([perfCountSample], true)).toBeUndefined();
  });
  it('PerfCallChainTest100', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let perf = new PerfCallChainMerageData();
    procedureLogicWorkerPerf.currentTreeList = [perf];
    expect(procedureLogicWorkerPerf.handleCurrentTreeList(100, 8)).toBeUndefined();
  });
  it('PerfCallChainTest101', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let perfThread = new PerfThread();
    perfThread.processName = 'a';
    procedureLogicWorkerPerf.threadData[0] = perfThread;
    let perfCallChainMerageData = new PerfCallChainMerageData();
    perfCallChainMerageData.tid = 0;
    procedureLogicWorkerPerf.currentTreeMapData['sf'] = perfCallChainMerageData;
    let perf = new PerfCallChainMerageData();
    let perfCallChain = new PerfCallChain();
    perfCallChain.name = '0';
    let callChainDataList = [perfCallChain];
    procedureLogicWorkerPerf.callChainData[0] = [perfCallChain];
    let perfCountSample = new PerfCountSample();
    procedureLogicWorkerPerf.currentTreeList = [perf];
    expect(
      procedureLogicWorkerPerf.mergeChildrenByIndex(
        perfCallChainMerageData,
        callChainDataList,
        100,
        perfCountSample,
        true
      )
    ).toBeUndefined();
  });
  it('PerfCallChainTest102', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let perf = new PerfCallChainMerageData();
    expect(procedureLogicWorkerPerf.hasSearchNode(perf)).not.toBeUndefined();
  });
  it('PerfCallChainTest103', function () {
    let data = new PerfCallChainMerageData();
    let sampleArray = [data];
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    expect(procedureLogicWorkerPerf.kernelCombination()).toBeUndefined();
    expect(procedureLogicWorkerPerf.markSearchNode(sampleArray, 's', true)).toBeUndefined();
  });
  it('PerfCallChainTest104', function () {
    let data = [{funcName: 'a', funcArgs: [0,1,2]}];
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    expect(procedureLogicWorkerPerf.resolvingAction(data)).not.toBeUndefined();
  });
  it('PerfCallChainTest105', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let perf = new PerfCallChainMerageData();
    procedureLogicWorkerPerf.currentTreeList = [perf];
    perf.parentNode = new PerfCallChainMerageData();
    perf.parentNode.parentId = '10';
    expect(procedureLogicWorkerPerf.handleCurrentTreeList(100, 8)).toBeUndefined();
  });
  it('PerfCallChainTest106', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let perf = new PerfCallChainMerageData();
    let samples = [perf];
    expect(procedureLogicWorkerPerf.splitPerfTree(samples, '8', true, false)).toBeUndefined();
  });
  it('PerfCallChainTest107', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let perf = new PerfCallChainMerageData();
    let samples = [perf];
    procedureLogicWorkerPerf.recursionPerfChargeInitTree = jest.fn();
    expect(procedureLogicWorkerPerf.splitPerfTree(samples, '8', false, false)).toBeUndefined();
  });
  it('PerfCallChainTest108', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let perf = new PerfCallChainMerageData();
    procedureLogicWorkerPerf.recursionPerfChargeInitTree = jest.fn();
    expect(procedureLogicWorkerPerf.recursionPerfChargeInitTree(perf, '8', false)).toBeUndefined();
  });
  it('PerfCallChainTest109', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    procedureLogicWorkerPerf.recursionPerfChargeInitTree = jest.fn();
    let sample = {
      symbolName: '8',
      initChildren: {
        length: 2,
        forEach: jest.fn(() => true),
      },
    };
    expect(procedureLogicWorkerPerf.recursionPerfPruneInitTree(sample, '8', true)).toBeUndefined();
  });
  it('PerfCallChainTest110', function () {
    let procedureLogicWorkerPerf = new ProcedureLogicWorkerPerf();
    let perf = new PerfCallChainMerageData();
    procedureLogicWorkerPerf.recursionPerfChargeInitTree = jest.fn();
    expect(procedureLogicWorkerPerf.recursionPerfPruneInitTree(perf, '8', true)).toBeUndefined();
  });
});
