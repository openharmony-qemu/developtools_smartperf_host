/*
 * Copyright (C) 2024 Huawei Device Co., Ltd.
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
import { BinderGroup, CycleBinderItem, FuncNameCycle, FunctionItem } from '../../../src/trace/bean/BinderProcessThread';
describe('BinderProcessThread', () => {
  it('test BinderProcessThread 01', () => {
    let data = new CycleBinderItem();
    data.tid = 10;
    expect(data.tid).toEqual(10);
  });
  it('test BinderProcessThread 02', () => {
    let data = new FuncNameCycle();
    data.tid = 10;
    expect(data.tid).toEqual(10);
  });
  it('test BinderProcessThread 03', () => {
    let data: FunctionItem = { cycleStartTime: 10, cycleDur: 10, dur: 10, id: 10, tid: 10, pid: 10 };
    expect(data.tid).toEqual(10);
  });
  it('test BinderProcessThread 04', () => {
    let data: BinderGroup = {
      title: '10',
      totalCount: 10,
      binderAsyncRcvCount: 10,
      binderReplyCount: 10,
      binderTransactionAsyncCount: 10,
      binderTransactionCount: 10,
      tid: 10,
      pid: 10,
    };
    expect(data.tid).toEqual(10);
  });
  it('test BinderProcessThread 05', () => {
    let data: CycleBinderItem = {
      title: '10',
      durNs: 10,
      tsNs: 10,
      cycleDur: 10,
      cycleStartTime: 10,
      totalCount: 10,
      tid: 10,
      pid: 10,
      binderTransactionCount: 10,
      binderAsyncRcvCount: 10,
      binderReplyCount: 10,
      binderTransactionAsyncCount: 10,
      idx: 10,
      type: 'fds',
    };
    expect(data.tid).toEqual(10);
  });
});
