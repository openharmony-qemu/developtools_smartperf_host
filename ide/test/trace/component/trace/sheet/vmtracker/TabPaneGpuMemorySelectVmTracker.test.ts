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

import { TabPaneGpuMemorySelectVmTracker } from '../../../../../../src/trace/component/trace/sheet/vmtracker/TabPaneGpuMemorySelectVmTracker';

jest.mock('../../../../../../src/js-heap/model/DatabaseStruct', () => {});

jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
const sqlite = require('../../../../../../src/trace/database/sql/Memory.sql');
jest.mock('../../../../../../src/trace/database/sql/Memory.sql');
jest.mock('../../../../../../src/trace/component/trace/base/TraceRow', () => {
  return {};
});
jest.mock('../../../../../../src/base-ui/table/lit-table', () => {
  return {};
});

// @ts-ignore
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));
describe('TabPaneGpuMemorySelectVmTracker Test', () => {
  let tabPaneGpuMemorySelectVmTracker = new TabPaneGpuMemorySelectVmTracker();
  let val = [
    {
      leftNs: 0,
      rightNs: 1000,
    },
  ];
  let gpuMemoryVMData = sqlite.getTabGpuMemoryVMTrackerClickData;
  let gpuVMData = [
    {
      startNs: 0,
      size: 1,
      threadId: 1,
      threadName: 'bb',
      gpuName: 'aa',
    },
  ];
  gpuMemoryVMData.mockResolvedValue(gpuVMData);
  it('TabPaneGpuMemorySelectVmTracker01', () => {
    expect(tabPaneGpuMemorySelectVmTracker.sortGpuMemoryByColumn('', 0)).toBeUndefined();
  });
  it('TabPaneGpuMemorySelectVmTracker02', () => {
    expect(tabPaneGpuMemorySelectVmTracker.sortGpuMemoryByColumn('startNs', 1)).toBeUndefined();
  });
  it('TabPaneGpuMemorySelectVmTracker03', () => {
    expect(tabPaneGpuMemorySelectVmTracker.sortGpuMemoryByColumn('gpuName', 1)).toBeUndefined();
  });
  it('TabPaneGpuMemorySelectVmTracker04', () => {
    expect(tabPaneGpuMemorySelectVmTracker.sortGpuMemoryByColumn('size', 1)).toBeUndefined();
  });
  it('TabPaneGpuMemorySelectVmTracker05', () => {
    expect(tabPaneGpuMemorySelectVmTracker.sortGpuMemoryByColumn('thread', 1)).toBeUndefined();
  });
  it('TabPaneGpuMemorySelectVmTracker06', () => {
    tabPaneGpuMemorySelectVmTracker.init = jest.fn(() => true);
    expect(tabPaneGpuMemorySelectVmTracker.queryGpuMemoryVmTrackerClickDataByDB(val)).toBeUndefined();
  });
});
