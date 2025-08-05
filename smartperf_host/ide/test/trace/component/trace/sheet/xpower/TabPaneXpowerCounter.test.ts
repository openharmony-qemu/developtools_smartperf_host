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

import { TabPaneXpowerCounter } from '../../../../../../src/trace/component/trace/sheet/xpower/TabPaneXpowerCounter';
import { SelectionParam } from '../../../../../../src/trace/bean/BoxSelection';
import { TraceRow } from '../../../../../../src/trace/component/trace/base/TraceRow';
import { XpowerStruct } from '../../../../../../src/trace/database/ui-worker/ProcedureWorkerXpower';
import { xpowerDataSender } from '../../../../../../src/trace/database/data-trafic/xpower/XpowerDataSender';
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
const intersectionObserverMock = () => ({
  observe: () => null,
});
window.IntersectionObserver = jest.fn().mockImplementation(intersectionObserverMock);
describe('TabPaneXpowerCounter', () => {
  let tabpane = new TabPaneXpowerCounter();
  let selectionParam = new SelectionParam();
  let traceRow = new TraceRow<XpowerStruct>();
  traceRow.rowId = 'ThermalReport.ShellTemp';
  traceRow.name = 'ThermalReport.ShellTemp';
  selectionParam.xpowerMapData.set(traceRow.rowId, (args: unknown): Promise<XpowerStruct[]> | undefined => {
    let result: Promise<XpowerStruct[]> | undefined;
    result = xpowerDataSender('ThermalReport.ShellTemp', traceRow, args);
    return result;
  });
  selectionParam.rightNs = 100000000;
  selectionParam.leftNs = 0;

  tabpane.initElements();
  const mockParentElement = document.createElement('div');
  mockParentElement.style.height = '100px';
  Object.defineProperty(tabpane, 'parentElement', {
    value: mockParentElement,
    writable: true,
  });
  tabpane.initElements = jest.fn();
  it('TabPaneXpowerCounterTest01', () => {
    expect(tabpane.initElements()).toBeUndefined();
    expect(tabpane.connectedCallback()).toBeUndefined();
    tabpane.data = selectionParam;
    expect(tabpane.data).toBeUndefined();
  });
  it('TabPaneXpowerCounterTest02', () => {
    expect(tabpane.sortByColumn({ key: 'delta', sort: 1 })).toBeUndefined();
    expect(tabpane.sortByColumn({ key: 'name', sort: 2 })).toBeUndefined();
  });
  it('TabPaneXpowerCounterTest03', () => {
    let res = [
      {
        asyncCatNames: [],
        asyncNames: [],
        average: '',
        avg: '10',
        avgDuration: '',
        avgNumber: 0,
        avgWeight: '',
        count: 1,
        cpu: 0,
        delta: '10',
        dur: 0,
        duration: '',
        energy: '',
        first: '',
        last: '',
        leftNs: 0,
        max: '10',
        maxDuration: 0,
        maxDurationFormat: '',
        maxNumber: 0,
        min: '10',
        minNumber: 0,
        name: '10',
        occurrences: 0,
        pid: '',
        process: '',
        rate: '',
        recordStartNs: 0,
        rightNs: 0,
        state: '',
        stateJX: '',
        tabTitle: '',
        thread: '',
        threadIds: [],
        tid: '',
        timeStamp: '',
        trackId: 0,
        ts: 0,
        wallDuration: 0,
        wallDurationFormat: '',
      },
    ];
    let tabXpowerStruct = 
      {
        asyncCatNames: [],
        asyncNames: [],
        average: '',
        avg: '',
        avgDuration: '',
        avgNumber: 0,
        avgWeight: 'NaN',
        count: '1',
        cpu: 0,
        delta: 'NaN',
        dur: 0,
        duration: '',
        energy: '',
        first: 'undefined',
        last: 'undefined',
        leftNs: 0,
        max: 'undefined',
        maxDuration: 0,
        maxDurationFormat: '',
        maxNumber: 0,
        min: 'undefined',
        minNumber: 0,
        name: 'ThermalReport.ShellTemp',
        occurrences: 0,
        pid: '',
        process: '',
        rate: 'NaN',
        recordStartNs: 0,
        rightNs: 0,
        state: '',
        stateJX: '',
        tabTitle: '',
        thread: '',
        threadIds: [],
        tid: '',
        timeStamp: '',
        trackId: undefined,
        ts: 0,
        wallDuration: 0,
        wallDurationFormat: '',
      };
    expect(
      tabpane.createSelectCounterData('ThermalReport.ShellTemp', res, selectionParam.leftNs, selectionParam.rightNs)
    ).toEqual(tabXpowerStruct);
  });
});
