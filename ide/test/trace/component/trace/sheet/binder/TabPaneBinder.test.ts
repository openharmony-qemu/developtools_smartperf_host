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

import { TabPaneBinders } from '../../../../../../src/trace/component/trace/sheet/binder/TabPaneBinders';
import { LitTable } from '../../../../../../src/base-ui/table/lit-table';
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));
const sqlite = require('../../../../../../src/trace/database/sql/ProcessThread.sql');
jest.mock('../../../../../../src/trace/database/sql/ProcessThread.sql');
jest.mock('../../../../../../src/trace/component/trace/base/TraceRow', () => {
  return {};
});
jest.mock('../../../../../../src/base-ui/table/lit-table');
describe('TabPaneBinders Test', () => {
  let tabPaneBinders = new TabPaneBinders();
  let threadBindersTbl = new LitTable();
  jest.clearAllMocks();
  tabPaneBinders['threadBindersTbl'] = threadBindersTbl;
  const data = [
    {
      pid: 1,
      tid: 2,
      title: 'P-Render',
      totalCount: 3,
      children: [
        {
          binderAsyncRcvCount: 2,
          binderReplyCount: 2,
          binderTransactionAsyncCount: 2,
          binderTransactionCount: 2,
          pid: 1,
          tid: 2,
          title: 'T-Render',
          totalCount: 1
        }
      ]
    },{
      pid: 1,
      tid: 2,
      title: 'P-Service',
      totalCount: 1,
      children: [
        {
          binderAsyncRcvCount: 1,
          binderReplyCount: 1,
          binderTransactionAsyncCount: 1,
          binderTransactionCount: 1,
          pid: 1,
          tid: 2,
          title: 'T-Service',
          totalCount: 2
        }
      ]
    }
  ];

  it('TabPaneBindersTest01', () => {
    let binder = sqlite.queryBinderByThreadId;
    binder.mockResolvedValue(data);
    const threadStatesParam = {
      threadIds: [1, 2],
      processIds: [1, 2],
      leftNs: 0,
      rightNs: 100
    };
    tabPaneBinders.initBinderData(threadStatesParam);
    tabPaneBinders.data = data;
    expect(tabPaneBinders.data).toBeUndefined();
    expect(threadBindersTbl.recycleDataSource).toEqual([]);
    expect(tabPaneBinders['threadBindersTblSource']).toEqual([]);
    expect(threadBindersTbl.loading).toBe(true);
  });

  it('TabPaneBindersTest02', () => {
    let binder = sqlite.queryBinderByThreadId;
    binder.mockResolvedValue([]);
    const threadStatesParam = {
      threadIds: [1, 2],
      processIds: [1, 2],
      leftNs: 0,
      rightNs: 100
    };
    tabPaneBinders.initBinderData(threadStatesParam);
    expect(threadBindersTbl.loading).toBe(true);
  });
});
