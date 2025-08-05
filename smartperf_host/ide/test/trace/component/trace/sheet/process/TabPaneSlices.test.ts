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

import { SelectionData } from '../../../../../../src/trace/bean/BoxSelection';
import { TabPaneSlices } from '../../../../../../src/trace/component/trace/sheet/process/TabPaneSlices';
jest.mock('../../../../../../src/base-ui/table/lit-table', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../../../src/js-heap/model/DatabaseStruct', () => {});
const sqlit = require('../../../../../../src/trace/database/sql/Func.sql');
jest.mock('../../../../../../src/trace/database/sql/Func.sql');
const processSqlite = require('../../../../../../src/trace/database/sql/ProcessThread.sql');
jest.mock('../../../../../../src/trace/database/sql/ProcessThread.sql');

window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

jest.mock('../../../../../../src/trace/component/trace/base/TraceRow', () => {
  return {};
});

describe('TabPaneSlices Test', () => {
  let tabPaneSlices = new TabPaneSlices();
  sqlit.getTabSlicesAsyncFunc.mockResolvedValue([]);
  processSqlite.getTabSlices.mockResolvedValue([
    {
      name: 'binder reply',
      wallDuration: 61.847,
      avgDuration: 30.9235,
      occurrences: 2,
      isHover: false,
    },
    {
      name: 'binder transaction',
      wallDuration: 1.64,
      avgDuration: 0.54667,
      occurrences: 3,
      isHover: false,
    },
  ]);
  it('TabPaneSlicesTest01', function () {
    expect(
      (tabPaneSlices.data = {
        recordStartNs: 26014913992000,
        leftNs: 530809208,
        rightNs: 532115193,
        hasFps: false,
        perfAll: false,
        fileSysVirtualMemory: false,
        diskIOLatency: false,
        fsCount: 0,
        vmCount: 0,
        isCurrentPane: false,
        startup: false,
        staticInit: false,
        cpus: [],
        cpuStateFilterIds: [],
        cpuFreqFilterIds: [],
        cpuFreqLimitDatas: [],
        threadIds: [],
        processIds: [578],
        funTids: [915],
        funAsync: [],
        funCatAsync: [{ threadName: 'thread01', pid: 1 }],
      })
    );
  });

  it('TabPaneSlicesTest02', function () {
    let selectionData = new SelectionData();
    selectionData.name = '';
    tabPaneSlices.slicesTbl!.recycleDataSource = [selectionData];
    expect(
      tabPaneSlices.sortByColumn({
        key: 'name',
        sort: () => {},
      })
    ).toBeUndefined();
  });

  it('TabPaneSlicesTest05', function () {
    expect(
      tabPaneSlices.sortByColumn({
        key: !'name',
        sort: () => {},
      })
    ).toBeUndefined();
  });
});
