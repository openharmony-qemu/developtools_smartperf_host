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

import { TabPaneXpowerGpuFreqSelection } from '../../../../../../src/trace/component/trace/sheet/xpower/TabPaneXpowerGpuFreqSelection';
import { TraceRow } from '../../../../../../src/trace/component/trace/base/TraceRow';
import { XpowerGpuFreqStruct } from '../../../../../../src/trace/database/ui-worker/ProcedureWorkerXpowerGpuFreq';
import { Utils } from '../../../../../../src/trace/component/trace/base/Utils';
jest.mock('../../../../../../src/js-heap/model/DatabaseStruct', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorkerCommon', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});
jest.mock('../../../../../../src/trace/bean/FrameChartStruct', () => {
  return {};
});
jest.mock('../../../../../../src/trace/bean/NativeHook', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/cpu/ProcedureWorkerCPU', () => {
  return {};
});
jest.mock('../../../../../../src/trace/bean/BoxSelection', () => {
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
describe('TabPaneXpowerGpuFreqSelection', () => {
  let tabpane = new TabPaneXpowerGpuFreqSelection();
  let traceRow = new TraceRow<XpowerGpuFreqStruct>();
  traceRow.rowId = 'gpu-frequency';
  let list = [
    {
      value: 10,
      valueStr: '1',
      startNS: 10,
      dur: 10,
      valueType: '',
      runTime: 10,
      idleTime: 10,
      runTimeStr: '10',
      idleTimeStr: '10',
      startTimeStr: '10ns ',
      frequency: 10,
      count: 10,
      translateY: 10,
      frame: undefined,
      isHover: false,
    },
  ];
  tabpane.initElements();
  const mockParentElement = document.createElement('div');
  mockParentElement.style.height = '100px';
  Object.defineProperty(tabpane, 'parentElement', {
    value: mockParentElement,
    writable: true,
  });

  tabpane.initElements = jest.fn();
  tabpane.init = jest.fn();
  it('TabPaneXpowerGpuFreqSelectionTest01', () => {
    expect(tabpane.initElements()).toBeUndefined();
    expect(tabpane.connectedCallback()).toBeUndefined();
    expect(Utils.getTimeString(list[0].startNS)).toEqual(list[0].startTimeStr);
  });
  it('TabPaneXpowerGpuFreqSelectionTest03', () => {
    expect(tabpane.sortByColumn({ key: 'runTimeStr', sort: 2 })).toBeUndefined();
    expect(tabpane.sortByColumn({ key: 'startTimeStr', sort: 2 })).toBeUndefined();
    expect(tabpane.sortByColumn({ key: 'frequency', sort: 2 })).toBeUndefined();
  });
  it('TabPaneXpowerGpuFreqSelectionTest04', () => {
    expect(tabpane.setSortKey('runTimeStr')).toBe('runTime');
    expect(tabpane.setSortKey('idleTimeStr')).toBe('idleTime');
    expect(tabpane.setSortKey('startTimeStr')).toBe('startNS');
    expect(tabpane.setSortKey('')).toBe('');
  });
});
