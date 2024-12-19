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

import { TabPaneXpowerThreadLoad } from '../../../../../../src/trace/component/trace/sheet/xpower/TabPaneXpowerThreadLoad';
import { SelectionParam } from '../../../../../../src/trace/bean/BoxSelection';
import { TraceRow } from '../../../../../../src/trace/component/trace/base/TraceRow';
import { XpowerThreadInfoStruct } from '../../../../../../src/trace/database/ui-worker/ProcedureWorkerXpowerThreadInfo';
import { Rect } from '../../../../../../src/trace/database/ui-worker/ProcedureWorkerCommon';
import { xpowerThreadInfoDataSender } from '../../../../../../src/trace/database/data-trafic/xpower/XpowerThreadSender';
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
describe('TabPaneXpowerThreadLoad', () => {
  let tabpane = new TabPaneXpowerThreadLoad();
  let selectionParam = new SelectionParam();
  let traceRow = new TraceRow<XpowerThreadInfoStruct>();
  traceRow.rowId = 'thread_loads';
  selectionParam.xpowerThreadLoadMapData.set(
    traceRow.rowId,
    (args: unknown): Promise<XpowerThreadInfoStruct[]> | undefined => {
      let result: Promise<XpowerThreadInfoStruct[]> | undefined;
      result = xpowerThreadInfoDataSender('thread_loads', traceRow, args);
      return result;
    }
  );
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
  tabpane.init = jest.fn();
  let frame = new Rect(0, 0, 100, 100);
  it('TabPaneXpowerThreadLoadTest01', () => {
    expect(tabpane.initElements()).toBeUndefined();
    expect(tabpane.connectedCallback()).toBeUndefined();
    tabpane.data = selectionParam;
    expect(tabpane.data).toBeUndefined();
  });
  it('TabPaneXpowerThreadLoadTest03', () => {
    expect(tabpane.sortByColumn({ key: 'name', sort: 1 })).toBeUndefined();
    expect(tabpane.sortByColumn({ key: 'avg', sort: 2 })).toBeUndefined();
  });
  it('TabPaneXpowerThreadLoadTest04', () => {
    let res = [
      {
        value: 10,
        valueStr: '10',
        startNS: 10,
        dur: 10,
        valueType: '',
        startTimeStr: '10',
        threadTime: 10,
        threadTimeStr: '10',
        threadName: '10',
        threadNameId: 10,
        count: 10,
        translateY: 10,
        frame: frame,
        isHover: false,
      },
    ];
    let selectionData = [
      {
        asyncCatNames: [],
        asyncNames: [],
        average: '',
        avg: '10 %',
        avgDuration: '',
        avgNumber: 0,
        avgWeight: '',
        count: 1,
        cpu: 0,
        delta: '',
        dur: 0,
        duration: '',
        energy: '',
        first: '',
        last: '',
        leftNs: 0,
        max: '10 %',
        maxDuration: 0,
        maxDurationFormat: '',
        maxNumber: 0,
        min: '10 %',
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
    expect(tabpane.createSelectThreadLoadData(res)).toEqual(selectionData);
  });
});
