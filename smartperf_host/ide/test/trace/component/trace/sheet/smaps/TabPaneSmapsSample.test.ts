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

import { TabPaneSmapsSample } from '../../../../../../src/trace/component/trace/sheet/smaps/TabPaneSmapsSample';
import { SelectionParam } from '../../../../../../src/trace/bean/BoxSelection';
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
describe('TabPaneSmapsSample', () => {
  let tabpane = new TabPaneSmapsSample();
  let selectionParam = new SelectionParam();
  tabpane.queryDataByDB = jest.fn();
  tabpane.setSmaps = jest.fn();
  tabpane.initElements();
  selectionParam.rightNs = 100000000;
  selectionParam.leftNs = 0;
  const mockParentElement = document.createElement('div');
  mockParentElement.style.height = '100px';
  Object.defineProperty(tabpane, 'parentElement', {
    value: mockParentElement,
    writable: true,
  });

  it('TabPaneSmapsSampleTest01', () => {
    tabpane.initElements();
    tabpane.init = jest.fn();
    tabpane.data = selectionParam;
    expect(tabpane.setSmaps).toHaveBeenCalled();
  });

  it('TabPaneSmapsSampleTest02', () => {
    tabpane.initElements();
    expect(tabpane.initElements()).toBeUndefined();
    expect(tabpane.connectedCallback()).toBeUndefined();
    expect(tabpane.initHtml()).not.toBeUndefined();
    expect(tabpane.sortByColumn({ key: 'rssStr', sort: 2 })).toBeUndefined();
    expect(tabpane.sortByColumn({ key: 'sizeStr', sort: 2 })).toBeUndefined();
    expect(tabpane.sortByColumn({ key: 'fds', sort: 2 })).toBeUndefined();
    expect(tabpane.sortByColumn({ key: 'number', sort: 2 })).toBeUndefined();
  });
});
