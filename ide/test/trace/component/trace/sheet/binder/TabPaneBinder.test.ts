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
import { queryBinderByThreadId } from '../../../../../../src/trace/database/SqlLite';
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));
const sqlite = require('../../../../../../src/trace/database/SqlLite');
jest.mock('../../../../../../src/trace/database/SqlLite');
jest.mock('../../../../../../src/trace/component/trace/base/TraceRow', () => {
  return {};
});
jest.mock('../../../../../../src/base-ui/table/lit-table');
describe('TabPaneBinders Test', () => {
  let tabPaneBinders;
  let threadBindersTbl;
  beforeEach(() => {
    jest.clearAllMocks();
    tabPaneBinders = new TabPaneBinders();
    threadBindersTbl = new LitTable();
    tabPaneBinders['threadBindersTbl'] = threadBindersTbl;
  });
  it('TabPaneBindersTest01', () => {
    const data = [
      {
        pid: undefined,
        tid: undefined,
        title: 'P-undefined',
        totalCount: undefined,
        children: [
          {
            binderAsyncRcvCount: 0,
            binderReplyCount: 0,
            binderTransactionAsyncCount: 0,
            binderTransactionCount: 0,
            pid: undefined,
            tid: undefined,
            title: 'T-undefined',
            totalCount: undefined
          }
        ]
      }
    ];
    queryBinderByThreadId.mockResolvedValue(data);
    const threadStatesParam = {
      threadIds: [1, 2],
      processIds: [1, 2],
      leftNs: 0,
      rightNs: 100
    };
    tabPaneBinders.initBinderData(threadStatesParam);
    tabPaneBinders.data = data;
    expect(tabPaneBinders.data).toBeUndefined();
    expect(queryBinderByThreadId).toHaveBeenCalledWith([1, 2], [1, 2], 0, 100);
    expect(threadBindersTbl.recycleDataSource).toEqual([]);
    expect(tabPaneBinders['threadBindersTblSource']).toEqual([]);
    expect(threadBindersTbl.loading).toBe(true);
  });
});