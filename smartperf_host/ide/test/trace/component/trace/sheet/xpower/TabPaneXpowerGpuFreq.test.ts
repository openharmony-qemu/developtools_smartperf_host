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

import { TabPaneXpowerGpuFreq } from '../../../../../../src/trace/component/trace/sheet/xpower/TabPaneXpowerGpuFreq';
import { TraceRow } from '../../../../../../src/trace/component/trace/base/TraceRow';
import { XpowerGpuFreqStruct } from '../../../../../../src/trace/database/ui-worker/ProcedureWorkerXpowerGpuFreq';
jest.mock('../../../../../../src/js-heap/model/DatabaseStruct', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorkerCommon', () => {
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
describe('TabPaneXpowerGpuFreq', () => {
  let tabpane = new TabPaneXpowerGpuFreq();
  let traceRow = new TraceRow<XpowerGpuFreqStruct>();
  traceRow.rowId = 'gpu-frequency';
  tabpane.initElements();
  const mockParentElement = document.createElement('div');
  mockParentElement.style.height = '100px';
  Object.defineProperty(tabpane, 'parentElement', {
    value: mockParentElement,
    writable: true,
  });
  tabpane.initElements = jest.fn();
  tabpane.init = jest.fn();
  it('TabPaneXpowerGpuFreqTest01', () => {
    expect(tabpane.initElements()).toBeUndefined();
    expect(tabpane.connectedCallback()).toBeUndefined();
  });
  it('TabPaneXpowerGpuFreqTest03', () => {
    expect(tabpane.sortByColumn({ key: 'maxRunTime', sort: 0 })).toBeUndefined();
    expect(tabpane.sortByColumn({ key: 'avgRunTimeStr', sort: 1 })).toBeUndefined();
    expect(tabpane.sortByColumn({ key: 'name', sort: 2 })).toBeUndefined();
  });
  it('TabPaneXpowerGpuFreqTest04', () => {
    expect(tabpane.setSortKey('avgRunTimeStr')).toBe('avgRunTime');
    expect(tabpane.setSortKey('maxRunTimeStr')).toBe('maxRunTime');
    expect(tabpane.setSortKey('minRunTimeStr')).toBe('minRunTime');
    expect(tabpane.setSortKey('avgIdleTimeStr')).toBe('avgIdleTime');
    expect(tabpane.setSortKey('maxIdleTimeStr')).toBe('maxIdleTime');
    expect(tabpane.setSortKey('minIdleTimeStr')).toBe('minIdleTime');
    expect(tabpane.setSortKey('startTimeStr')).toBe('startNS');
    expect(tabpane.setSortKey('')).toBe('');
  });
  it('TabPaneXpowerGpuFreqTest05', () => {
    let res = [
      {
        frequency: 10,
        count: 10,
        avgRunTime: 10,
        maxRunTime: 10,
        minRunTime: 10,
        avgIdleTime: 10,
        maxIdleTime: 10,
        minIdleTime: 10,
        avgRunTimeStr: '',
        maxRunTimeStr: '',
        minRunTimeStr: '',
        avgIdleTimeStr: '',
        maxIdleTimeStr: '',
        minIdleTimeStr: '',
        runTime: 10,
        value: 10,
        startNS: 10,
        dur: 10,
        valueType: '10',
        idleTime: 10,
        runTimeStr: '10',
        idleTimeStr: '10',
        startTimeStr: '10',
        translateY: 10,
        frame: undefined,
        isHover: false,
      },
    ];
    let tabXpowerGpuFreqStruct = [
      {
        frequency: 10,
        count: 1,
        avgRunTime: 10,
        maxRunTime: 10,
        minRunTime: 10,
        avgIdleTime: 10,
        maxIdleTime: 10,
        minIdleTime: 10,
        avgRunTimeStr: '10 ms ',
        maxRunTimeStr: '10 ms ',
        minRunTimeStr: '10 ms ',
        avgIdleTimeStr: '10 ms ',
        maxIdleTimeStr: '10 ms ',
        minIdleTimeStr: '10 ms ',
      },
    ];
    expect(tabpane.createTabXpowerGpuFreqStruct(res)).toEqual(tabXpowerGpuFreqStruct);
  });
});
