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
import { TraceRow } from '../../../../../../src/trace/component/trace/base/TraceRow';
import { TabPaneTimeParallel } from '../../../../../../src/trace/component/trace/sheet/parallel/TabPaneTimeParallel';
jest.mock('../../../../../../src/js-heap/model/DatabaseStruct', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest
  .spyOn(require('../../../../../../src/trace/component/trace/sheet/parallel/ParallelUtil'), 'MeterHeaderClick')
  .mockReturnValue(1);
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
global.onclick = {
  match: jest.fn(),
} as any;
global.addEventListener = {
  match: jest.fn(),
} as any;
describe('TabPaneTimeParallel Test', () => {
  let tabpane = new TabPaneTimeParallel();
  let selectionParam = new SelectionParam();
  selectionParam.processIds = [1, 2, 3];
  selectionParam.threadIds = [1, 2, 3];
  selectionParam.leftNs = 5000;
  selectionParam.rightNs = 50000;
  selectionParam.recordStartNs = 0;
  selectionParam.recordStartNs = 0;
  tabpane.initElements();
  it('TabPaneTimeParallelt01', function () {
    expect(tabpane.initElements()).toBeUndefined();
  });

  it('TabPaneTimeParallelt02', function () {
    tabpane.assignAllCore = jest.fn();
    tabpane.assignGroupCore = jest.fn();
    expect(tabpane.switchTableInfo()).toBeUndefined();
  });

  it('TabPaneTimeParallelt03', function () {
    expect(tabpane.reset()).toBeUndefined();
  });

  it('TabPaneTimeParallelt04', function () {
    expect(tabpane.initDefaultConfig()).toBeUndefined();
  });

  it('TabPaneTimeParallelt05', function () {
    expect(tabpane.connectedCallback()).toBeUndefined();
    expect(tabpane.initHtml()).not.toBeUndefined();
  });
});
