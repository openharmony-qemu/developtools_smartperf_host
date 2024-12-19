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

import { TabPaneXpowerStatisticCurrentData } from '../../../../../../src/trace/component/trace/sheet/xpower/TabPaneXpowerStatisticCurrentData';
import { SelectionParam } from '../../../../../../src/trace/bean/BoxSelection';
import { TraceRow } from '../../../../../../src/trace/component/trace/base/TraceRow';
import { XpowerStatisticStruct } from '../../../../../../src/trace/database/ui-worker/ProcedureWorkerXpowerStatistic';
import { xpowerStatisticDataSender } from '../../../../../../src/trace/database/data-trafic/xpower/XpowerStatisticDataSender';
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
describe('TabPaneXpowerStatisticCurrentData', () => {
  let tabpane = new TabPaneXpowerStatisticCurrentData();
  let selectionParam = new SelectionParam();
  let traceRow = new TraceRow<XpowerStatisticStruct>();
  traceRow.rowId = 'Statistic';
  selectionParam.xpowerStatisticMapData.set(
    traceRow.rowId,
    (args: unknown): Promise<XpowerStatisticStruct[]> | undefined => {
      let result: Promise<XpowerStatisticStruct[]> | undefined;
      result = xpowerStatisticDataSender(traceRow, args);
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
  let data = new XpowerStatisticStruct();
  data.audio = 10;
  data.audioDur = 100;
  data.cpu = 100;
  data.cpuDur = 200;
  tabpane.setXpowerStatisticCurrentData(data);

  it('TabPaneXpowerStatisticCurrentDataTest01', () => {
    let list = { dur: 100, energy: 100, startStamp: 100 };
    expect(tabpane.initElements()).toBeUndefined();
    expect(tabpane.connectedCallback()).toBeUndefined();
    expect(tabpane.initHtml()).not.toBeUndefined();
    expect(tabpane.createSelectCounterData(list, 'c1hz')).not.toBeUndefined();
    expect(tabpane.sortByColumn({ key: 'duration', sort: 2 })).toBeUndefined();
    expect(tabpane.sortByColumn({ key: 'name', sort: 2 })).toBeUndefined();
    expect(tabpane.sortByColumn({ key: 'aaa', sort: 1 })).toBeUndefined();
  });

  it('TabPaneXpowerStatisticCurrentDataTest02', () => {
    let data = new XpowerStatisticStruct();
    data.audio = 10;
    data.audioDur = 100;
    data.cpu = 100;
    data.cpuDur = 200;
    expect(tabpane.setXpowerStatisticCurrentData(data)).toBeUndefined();
  });

  it('TabPaneXpowerStatisticCurrentDataTest03', () => {
    let data = new XpowerStatisticStruct();
    data.audio = 50;
    data.audioDur = 150;
    data.cpu = 100;
    data.cpuDur = 200;
    tabpane.setXpowerStatisticCurrentData(data);
    expect(tabpane.compare('energy', 2, 'number')).not.toBeUndefined();
  });
});
