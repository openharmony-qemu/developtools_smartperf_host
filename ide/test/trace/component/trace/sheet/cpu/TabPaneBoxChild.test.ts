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

import { TabPaneBoxChild } from '../../../../../../src/trace/component/trace/sheet/cpu/TabPaneBoxChild';
const sqlite = require('../../../../../../src/trace/database/sql/ProcessThread.sql');
jest.mock('../../../../../../src/trace/database/sql/ProcessThread.sql');
jest.mock('../../../../../../src/trace/bean/NativeHook', () => {
  return {};
});
jest.mock('../../../../../../src/js-heap/model/DatabaseStruct', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

describe('TabPaneBoxChild Test', () => {
  document.body.innerHTML = `<div id="div"></div>`;
  let element = document.querySelector('#div') as HTMLDivElement;
  let tabPaneBoxChild = new TabPaneBoxChild();
  element.appendChild(tabPaneBoxChild);
  let getTabBox = sqlite.queryArgsById;
  let data = [
    {
      id: 0,
    },
  ];
  getTabBox.mockResolvedValue(data);
  tabPaneBoxChild.data = {
    cpus: [],
    threadIds: [],
    trackIds: [],
    funTids: [],
    heapIds: [],
    leftNs: 0,
    rightNs: 233,
    hasFps: false,
    state: '',
    processId: 0,
    threadId: 0,
  };
  tabPaneBoxChild.initElements();
  const mockParentElement = document.createElement('div');
  mockParentElement.style.height = '100px';
  Object.defineProperty(tabPaneBoxChild, 'parentElement', {
    value: mockParentElement,
    writable: true,
  });

  tabPaneBoxChild.initElements = jest.fn();
  it('TabPaneBoxChildTest01', () => {
    expect(tabPaneBoxChild.initElements()).toBeUndefined();
    expect(tabPaneBoxChild.initHtml()).not.toBeUndefined();
  });
  it('TabPaneBoxChildTest02', function () {
    expect(
      tabPaneBoxChild.sortByColumn({
        key: 'number',
        sort: 1,
      })
    ).toBeUndefined();
    expect(
      tabPaneBoxChild.sortByColumn({
        key: 'number',
        sort: 2,
      })
    ).toBeUndefined();
  });
  it('TabPaneCounterTest03', function () {
    let val = [
      {
        leftNs: 11,
        rightNs: 34,
        state: true,
        processId: 3,
        threadId: 1,
        traceId: 0,
        cpus: 0,
        isJumpPage: 0,
        currentId: 0,
      },
    ];
    expect(tabPaneBoxChild.getDataByDB(val)).toBeUndefined();
  });
});
