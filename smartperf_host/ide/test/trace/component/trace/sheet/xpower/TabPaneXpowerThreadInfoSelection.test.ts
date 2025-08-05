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

import { TabPaneXpowerThreadInfoSelection } from '../../../../../../src/trace/component/trace/sheet/xpower/TabPaneXpowerThreadInfoSelection';
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
describe('TabPaneXpowerThreadInfoSelection', () => {
  let tabpane = new TabPaneXpowerThreadInfoSelection();
  let selectionParam = new SelectionParam();
  let traceRow = new TraceRow<XpowerThreadInfoStruct>();
  traceRow.rowId = 'thread_energy';
  selectionParam.xpowerThreadEnergyMapData.set(
    traceRow.rowId,
    (args: unknown): Promise<XpowerThreadInfoStruct[]> | undefined => {
      let result: Promise<XpowerThreadInfoStruct[]> | undefined;
      result = xpowerThreadInfoDataSender('thread_energy', traceRow, args);
      return result;
    }
  );
  tabpane.initElements();
  selectionParam.rightNs = 100000000;
  selectionParam.leftNs = 0;
  const mockParentElement = document.createElement('div');
  mockParentElement.style.height = '100px';
  Object.defineProperty(tabpane, 'parentElement', {
    value: mockParentElement,
    writable: true,
  });

  tabpane.initElements = jest.fn();
  tabpane.init = jest.fn();
  let frame = new Rect(0, 0, 100, 100);
  it('TabPaneXpowerThreadInfoSelectionTest01', () => {
    let list = [
      {
        value: 10,
        valueStr: '1',
        startNS: 10,
        startTimeStr: '1',
        dur: 10,
        threadTime: 10,
        threadTimeStr: '1',
        threadName: '1',
        threadNameId: 1,
        valueType: 'thread_energy',
        translateY: 10,
        frame: frame,
        isHover: false,
      },
    ];

    expect(tabpane.initElements()).toBeUndefined();
    expect(tabpane.connectedCallback()).toBeUndefined();
    // expect(tabpane.initHtml()).toBeUndefined();

    expect(tabpane.setThreadInfoData(list)).toBeUndefined();
  });
  it('TabPaneXpowerThreadInfoSelectionTest02', () => {
    traceRow.rowId = 'thread_loads';
    let list = [
      {
        value: 10,
        valueStr: '1',
        startNS: 10,
        startTimeStr: '1',
        dur: 10,
        threadTime: 10,
        threadTimeStr: '1',
        threadName: '1',
        threadNameId: 1,
        valueType: 'thread_loads',
        translateY: 10,
        frame: frame,
        isHover: false,
      },
    ];
    expect(tabpane.initElements()).toBeUndefined();
    expect(tabpane.connectedCallback()).toBeUndefined();
    expect(tabpane.setThreadInfoData(list)).toBeUndefined();
  });
  it('TabPaneXpowerThreadInfoSelectionTest03', () => {
    expect(tabpane.sortByColumn({ key: 'threadTimeStr', sort: 2 })).toBeUndefined();
    expect(tabpane.sortByColumn({ key: 'startTimeStr', sort: 2 })).toBeUndefined();
    expect(tabpane.sortByColumn({ key: 'threadName', sort: 2 })).toBeUndefined();
  });
  it('TabPaneXpowerThreadInfoSelectionTest04', () => {
    expect(tabpane.setSortKey('threadTimeStr')).toBe('threadTime');
    expect(tabpane.setSortKey('startTimeStr')).toBe('startNS');
    expect(tabpane.setSortKey('')).toBe('');
  });
});
