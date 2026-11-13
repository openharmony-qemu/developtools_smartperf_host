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

import { SelectionParam } from '../../../../../../src/trace/bean/BoxSelection';
import { TabPaneIrqCounter } from '../../../../../../src/trace/component/trace/sheet/irq/TabPaneIrqCounter';
import { IrqStruct } from '../../../../../../src/trace/database/ui-worker/ProcedureWorkerIrq';
jest.mock('../../../../../../src/trace/component/trace/base/TraceRow', () => {
  return {};
});
const sqlite = require('../../../../../../src/trace/database/sql/Irq.sql');
jest.mock('../../../../../../src/trace/database/sql/Irq.sql');
jest.mock('../../../../../../src/js-heap/model/DatabaseStruct', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});

window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

describe('TabPaneIrqCounter Test', () => {
  document.body.innerHTML = `<div><tabpane-irq-counter id="irq"></tabpane-irq-counter></div>`;
  let tabPaneIrqCounter = document.querySelector<TabPaneIrqCounter>('#irq');
  let map = new Map();
  map.set('irq', [new IrqStruct()]);
  let frameData = {
    leftNs: 253,
    rightNs: 1252,
    argSetId: 5,
    startNS: 11111,
    dur: 22222,
    name: 'irq',
    irqMapData: map,
    framesData: [
      {
        id: 25,
        ts: 254151,
        dur: 1202,
        name: '1583',
        argSetId: 5,
        type: '0',
        pid: 20,
        gpu_dur: 2568,
        app_dur: 110,
      },
    ],
  };

  let irqData = sqlite.queryIrqDataBoxSelect;
  irqData.mockResolvedValue([
    {
      irqName: 'name',
      wallDuration: 9536,
      maxDuration: 5239,
      count: 1,
      avgDuration: 2563,
    },
  ]);

  let softIrqData = sqlite.querySoftIrqDataBoxSelect;
  softIrqData.mockResolvedValue([
    {
      irqName: 'name',
      wallDuration: 6765,
      maxDuration: 56756,
      count: 1,
      avgDuration: 46545,
    },
  ]);

  let selectionParam = new SelectionParam();
  selectionParam.rightNs = 100000000;
  selectionParam.leftNs = 0;
  selectionParam.softIrqCallIds = [1, 2, 3];
  selectionParam.irqCallIds = [1, 2, 3];

  it('TabPaneIrqCounterTest01', function () {
    let tabPane = new TabPaneIrqCounter();
    expect(tabPane.initElements()).toBeUndefined();
  });

  it('TabPaneIrqCounterTest02', function () {
    let tabPane = new TabPaneIrqCounter();
    expect(tabPane.connectedCallback()).toBeUndefined();
  });

  it('TabPaneIrqCounterTest03', function () {
    let tabPane = new TabPaneIrqCounter();
    expect(tabPane.initHtml()).not.toBeUndefined();
  });

  it('TabPaneIrqCounterTest04', function () {
    let tabPane = new TabPaneIrqCounter();
    tabPane.initElements();
    expect(tabPane.sortByColumn('wallDurationFormat', 0)).toBeUndefined();
    expect(tabPane.sortByColumn('count', 0)).toBeUndefined();
    expect(tabPane.sortByColumn('avgDuration', 0)).toBeUndefined();
    expect(tabPane.sortByColumn('maxDurationFormat', 0)).toBeUndefined();
    expect(tabPane.sortByColumn('name', 0)).toBeUndefined();
  });

  it('TabPaneIrqCounterTest04', function () {
    let tabPane = new TabPaneIrqCounter();
    let data = [
      {
        cat: '',
        name: '',
        callid: 50,
        count: 50,
        isFirstObject: 1,
        startTime: 50,
        endTime: 50,
        wallDuration: 50,
        priority: 50,
      },
    ];
    expect(tabPane.groupByCallid(data)).not.toBeUndefined();
  });

  it('TabPaneIrqCounterTest05', function () {
    let tabPane = new TabPaneIrqCounter();
    let data = [
      {
        cat: '',
        name: '',
        callid: 50,
        count: 50,
        isFirstObject: 1,
        startTime: 50,
        endTime: 150,
        wallDuration: 50,
        priority: 50,
      },
    ];
    expect(tabPane.callidByIrq(data)).not.toBeUndefined();
  });

  it('TabPaneIrqCounterTest06', function () {
    let tabPane = new TabPaneIrqCounter();
    let data = [
      {
        cat: '',
        name: '',
        callid: 50,
        count: 50,
        isFirstObject: 1,
        startTime: 50,
        endTime: 150,
        wallDuration: 50,
        priority: 50,
      },
    ];
    expect(tabPane.findMaxPriority(data)).not.toBeUndefined();
  });

  it('TabPaneIrqCounterTest07', function () {
    let tabPane = new TabPaneIrqCounter();
    let data = [
      {
        cat: '',
        wallDuration: 0,
        maxDuration: 100,
        name: '555',
        count: 2,
        avgDuration: 50,
        wallDurationFormat: 50,
        maxDurationFormat: 50,
      },
    ];
    expect(tabPane.aggregateData(data, true)).toBeUndefined();
  });

  it('TabPaneIrqCounterTest08', function () {
    let tabPane = new TabPaneIrqCounter();
    tabPane.initElements();
    expect(tabPane.reSortByColum('name', 0)).toBeUndefined();
    expect(tabPane.reSortByColum('cat', 0)).toBeUndefined();
    expect(tabPane.reSortByColum('string', 0)).toBeUndefined();
    expect(tabPane.reSortByColum('maxDurationFormat', 0)).toBeUndefined();
    expect(tabPane.reSortByColum('number', 0)).toBeUndefined();
  });
});
