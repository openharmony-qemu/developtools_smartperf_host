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

import { TabPaneThreadStates } from '../../../../../../src/trace/component/trace/sheet/process/TabPaneThreadStates';

window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

const sqlit = require('../../../../../../src/trace/database/sql/ProcessThread.sql');
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
describe('TabPaneThreadStates Test', () => {
  let tabPaneThreadStates = null;
  beforeEach(() => {
    document.body.innerHTML = `<lit-table id="tb-thread-states"></lit-table>`;
    tabPaneThreadStates = document.querySelector('#tb-thread-states') as TabPaneThreadStates;
  });
  it('TabPaneThreadStatesTest01', function () {
    let tabPaneThreadStates = new TabPaneThreadStates();
    expect(
      tabPaneThreadStates.sortByColumn({
        key: 'name' || 'thread' || 'state',
        sort: () => {},
      })
    ).toBeUndefined();
  });

  it('TabPaneThreadStatesTest02', function () {
    let tabPaneThreadStates = new TabPaneThreadStates();
    expect(
      tabPaneThreadStates.sortByColumn({
        key: !'name' || !'thread' || !'state',
        sort: () => {},
      })
    ).toBeUndefined();
  });

  it('TabPaneThreadStatesTest03', function () {
    // @ts-ignore
    let mockgetTabThreadStates = sqlit.getTabThreadStates;
    mockgetTabThreadStates.mockResolvedValue([
      {
        process: '11',
        thread: '222',
        wallDuration: 10,
        occurrences: 10,
        state: 'sss',
        stateJX: 'mm',
      },
      {
        process: '11',
        thread: '222',
        wallDuration: 10,
        occurrences: 10,
        state: 'sss',
        stateJX: 'mm',
      },
    ]);
    let a = { rightNs: 1, leftNs: 0, threadIds: [11, 12, 13], processIds: [11, 12, 13] };
    expect((tabPaneThreadStates.data = a)).toBeTruthy();
  });

  it('TabPaneThreadStatesTest04', function () {
    // @ts-ignore
    let mockgetTabThreadStates = sqlit.getTabThreadStates;
    mockgetTabThreadStates.mockResolvedValue([]);
    let a = { rightNs: 1, leftNs: 0, threadIds: [11, 12, 13], processIds: [11, 12, 13] };
    expect((tabPaneThreadStates.data = a)).toBeTruthy();
  });
});
