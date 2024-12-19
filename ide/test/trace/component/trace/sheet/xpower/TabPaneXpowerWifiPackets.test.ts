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

import { TabPaneXpowerWifiPackets } from '../../../../../../src/trace/component/trace/sheet/xpower/TabPaneXpowerWifiPackets';
import { SelectionParam } from '../../../../../../src/trace/bean/BoxSelection';
import { TraceRow } from '../../../../../../src/trace/component/trace/base/TraceRow';
import { XpowerWifiStruct } from '../../../../../../src/trace/database/ui-worker/ProcedureWorkerXpowerWifi';
import { xpowerWifiDataSender } from '../../../../../../src/trace/database/data-trafic/xpower/XpowerWifiDataSender';
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
describe('TabPaneXpowerWifiPackets', () => {
  let tabpane = new TabPaneXpowerWifiPackets();
  let selectionParam = new SelectionParam();
  let traceRow = new TraceRow<XpowerWifiStruct>();
  traceRow.rowId = 'WIFIPackets';
  selectionParam.xpowerStatisticMapData.set(
    traceRow.rowId,
    (args: unknown): Promise<XpowerWifiStruct[]> | undefined => {
      let result: Promise<XpowerWifiStruct[]> | undefined;
      result = xpowerWifiDataSender(traceRow, 'WIFIPackets', args);
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

  it('TabPaneXpowerWifiPacketsTest01', () => {
    let list = [10, 30, 20];
    expect(tabpane.initElements()).toBeUndefined();
    expect(tabpane.connectedCallback()).toBeUndefined();
    expect(tabpane.initHtml()).not.toBeUndefined();
    expect(tabpane.createSelectCounterData(list, 'rx', 'rx')).not.toBeUndefined();
    expect(tabpane.sortByColumn({ key: 'startTime', sort: 2 })).toBeUndefined();
    expect(tabpane.sortByColumn({ key: 'name', sort: 2 })).toBeUndefined();
    expect(tabpane.sortByColumn({ key: 'max', sort: 2 })).toBeUndefined();
    expect(tabpane.sortByColumn({ key: 'min', sort: 2 })).toBeUndefined();
    expect(tabpane.sortByColumn({ key: 'average', sort: 2 })).toBeUndefined();
    expect(tabpane.getCounterData(selectionParam)).not.toBeUndefined();
    expect(tabpane.createSelectCounterData(list, 'tx', 'tx')).not.toBeUndefined();
  });
});
