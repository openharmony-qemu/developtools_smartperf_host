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


import { TabPaneBinderDataCut } from '../../../../../../src/trace/component/trace/sheet/binder/TabPaneBinderDataCut';
import { LitTable } from '../../../../../../src/base-ui/table/lit-table';

const sqlite = require('../../../../../../src/trace/database/SqlLite');
jest.mock('../../../../../../src/trace/database/SqlLite');
jest.mock('../../../../../../src/trace/component/trace/sheet/SheetUtils', () => {
});
jest.mock('../../../../../../src/trace/component/trace/base/TraceRow', () => {
  return {};
});
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));
describe('TabPaneBinderDataCut Test', () => {
  let tabPaneBinderDataCut = new TabPaneBinderDataCut();
  tabPaneBinderDataCut.threadBindersTbl = jest.fn(() => {
    return new LitTable();
  });
  let threadIdInput = document.createElement('input');
  threadIdInput.value = 'threadIdInput';
  let threadFuncInput = document.createElement('input');
  threadFuncInput.value = 'threadFuncInput';
  let threadStatesParam = {
    cpus: [],
    threadIds: [1, 2, 3],
    trackIds: [23, 56, 77],
    funTids: [675, 75],
    heapIds: [11, 223],
    processIds: [114, 23],
    nativeMemory: [],
    leftNs: 12222,
    rightNs: 654233,
    hasFps: false,
    statisticsSelectData: undefined
  };
  let binderItem = [{
    title: 'test title',
    name: 'name',
    count: 2,
    ts: 2536,
    dur: 3666,
    startTime: 3655,
    endTime: 83663,
    tid: 363,
    pid: 523,
    cycleDur: 366,
    cycleStartTime: 3652,
    funcName: 'funcName',
    id: 12,
    thread: 'thread',
    process: 'process',
    totalCount: 12,
    idx: 366
  }];

  let bindGroup = [{
    title: 'title',
    count: 3,
    totalCount: 3,
    binderAsyncRcvCount: 2,
    binderReplyCount: 6,
    binderTransactionAsyncCount: 2,
    binderTransactionCount: 1,
    tid: 5,
    pid: 36,
    thread: 'thread',
    process: 'process',
    name: 'name',
    cycleStartTime: 1222,
    cycleDur: 366,
    id: 65,
    children: [],
    type: 'loop',
    status: false,
    idx: 2,
    isSelected: true
  }]
  tabPaneBinderDataCut.data = threadStatesParam;
  let loopFuncNameCycle = sqlite.queryLoopFuncNameCycle;
  let loopFuncNameCycleData = [{
    funcName: 'funcName',
    cycleStartTime: 1233,
    cycleDur: 0,
    id: 123,
    tid: 254,
    pid: 258
  }];
  loopFuncNameCycle.mockResolvedValue(loopFuncNameCycleData);

  let queryBinder = sqlite.queryBinderByThreadId;
  let binderData = [{
    name: 'test',
    count: 1,
    ts: 2533,
    dur: 563,
    startTime: 22554,
    endTime: 2633333,
    tid: 122,
    pid: 36
  }];
  queryBinder.mockResolvedValue(binderData);

  let querySingle = sqlite.querySingleFuncNameCycle;
  let querySingleData = [{
    funcName: 'funcName',
    cycleStartTime: 2553,
    cycleDur: 36633,
    id: 253,
    tid: 366,
    pid: 369,
    endTime: 366922
  }];
  querySingle.mockResolvedValue(querySingleData);

  it('TabPaneBinderDataCutTest01 ', async () => {
    tabPaneBinderDataCut.dataLoopCut(threadIdInput, threadFuncInput);
    expect(tabPaneBinderDataCut.threadBindersTbl.loading).toBeTruthy();
  });

  it('TabPaneBinderDataCutTest02 ', async () => {
    tabPaneBinderDataCut.dataSingleCut(threadIdInput, threadFuncInput);
    expect(tabPaneBinderDataCut.currentThreadId).toEqual('');
  });

  it('TabPaneBinderDataCutTest03 ', async () => {
    tabPaneBinderDataCut.verifyInputIsEmpty('', '', threadIdInput, threadFuncInput);
    expect(tabPaneBinderDataCut.threadBindersTbl.loading).toBeFalsy();
  });

  it('TabPaneBinderDataCutTest04 ', async () => {
    expect(tabPaneBinderDataCut.completionCycleName(binderItem, 'loop').length).toBe(0);
  });

  it('TabPaneBinderDataCutTest05 ', async () => {
    expect(tabPaneBinderDataCut.transferToTreeData(binderItem).length).toBe(1);
  });

  it('TabPaneBinderDataCutTest06 ', async () => {
    expect(tabPaneBinderDataCut.addCycleNumber(bindGroup)[0].title).toEqual('title');
  });

  it('TabPaneBinderDataCutTest07 ', async () => {
    expect(tabPaneBinderDataCut.timeUnitConversion(bindGroup).length).toEqual(1);
  });

  it('TabPaneBinderDataCutTest08 ', async () => {
    expect(tabPaneBinderDataCut.binderWithCountList(bindGroup).length).not.toBeUndefined();
  });

  it('TabPaneBinderDataCutTest09 ', async () => {
    expect(tabPaneBinderDataCut.findThreadByThreadId(bindGroup, 5)).not.toBeUndefined();
  });

  it('TabPaneBinderDataCutTest10 ', async () => {
    tabPaneBinderDataCut.clearCycleRange();
    expect(tabPaneBinderDataCut.cycleAStartRangeDIV.value).toEqual('');
  });
});