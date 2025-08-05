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
  TabPaneXpowerComponentTop,
  XpowerComponentTopStruct,
} from '../../../../../../src/trace/component/trace/sheet/xpower/TabPaneXpowerComponentTop';
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
describe('TabPaneXpowerComponentTop', () => {
  let tabpane = new TabPaneXpowerComponentTop();
  let selectionParam = new SelectionParam();
  let traceRow = new TraceRow<XpowerStruct>();
  traceRow.rowId = 'Battery.RealCurrent';
  selectionParam.xpowerMapData.set(traceRow.rowId, (args: unknown): Promise<XpowerStruct[]> | undefined => {
    let result: Promise<XpowerStruct[]> | undefined;
    result = xpowerDataSender('Battery.RealCurrent', traceRow, args);
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
  it('TabPaneXpowerComponentTopTest01', () => {
    expect(tabpane.initElements()).toBeUndefined();
    expect(tabpane.connectedCallback()).toBeUndefined();
  });
  it('TabPaneXpowerComponentTopTest02', () => {
    expect(tabpane.showTabPane()).toBeUndefined();
  });
  it('TabPaneXpowerComponentTopTest03', () => {
    let xPowerComponentTopStruct = new XpowerComponentTopStruct();
    let struct = {
      appName: 0,
      appNameStr: '',
      appUsageDuration: 0,
      appUsageDurationStr: '',
      appUsageEnergy: '',
      backgroundDuration: 0,
      backgroundDurationStr: '',
      backgroundEnergy: '',
      cameraId: 0,
      componentTypeId: 0,
      componentTypeName: '',
      foregroundDuration: 0,
      foregroundDurationStr: '',
      foregroundEnergy: '',
      load: '',
      screenOffDuration: 0,
      screenOffDurationStr: '',
      screenOffEnergy: '',
      screenOnDuration: 0,
      screenOnDurationStr: '',
      screenOnEnergy: '',
      startTime: 0,
      startTimeStr: '',
      structType: 'xpower component',
      uId: 0,
    };
    expect(xPowerComponentTopStruct).toEqual(struct);
  });
});
