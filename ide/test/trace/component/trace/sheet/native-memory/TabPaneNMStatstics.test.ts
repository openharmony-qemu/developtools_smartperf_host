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

import { TabPaneNMStatstics } from '../../../../../../src/trace/component/trace/sheet/native-memory/TabPaneNMStatstics';
import { NativeHookMalloc, NativeHookStatisticsTableData, } from '../../../../../../src/trace/bean/NativeHook';

jest.mock('../../../../../../src/js-heap/model/DatabaseStruct', () => {
});

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
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
describe('TabPaneNMStatstics Test', () => {
  let tabPaneNMStatstics = new TabPaneNMStatstics();
  document.body.innerHTML = '<div class="table"></div>';
  let valData = {
    cpus: [0],
    threadIds: [2, 90, 0],
    trackIds: [],
    funTids: [23, 44],
    heapIds: [2, 9],
    nativeMemory: ['All Heap & Anonymous VM', 'All Heap', 'All Anonymous VM'],
    cpuAbilityIds: [33, 22],
    memoryAbilityIds: [],
    diskAbilityIds: [56, 87, 45],
    networkAbilityIds: [],
    leftNs: 52540,
    rightNs: 9654120,
    hasFps: false,
    statisticsSelectData: undefined,
    perfSampleIds: [12, 45, 87],
    perfCpus: [1, 3],
    perfProcess: [],
    perfThread: [],
    perfAll: true,
  };
  let nativeHookMalloc: Array<NativeHookMalloc> = [
    {
      eventType: '',
      subType: '',
      subTypeId: 0,
      heapSize: 0,
      allocByte: 0,
      allocCount: 0,
      freeByte: 0,
      freeCount: 0,
      max: 0,
    },
  ];
  let nativeHookStatisticsTableData: Array<NativeHookStatisticsTableData> = [
    {
      memoryTap: '12',
      existing: 50,
      existingString: '',
      freeByteString: '',
      allocCount: 254,
      freeCount: 43,
      freeByte: 23,
      totalBytes: 1,
      totalBytesString: '',
      maxStr: '',
      max: 110,
      totalCount: 1150,
      existingValue: [],
    },
  ];

  it('TabPaneNMStatsticsTest01', function () {
    expect(tabPaneNMStatstics.setMallocTableData(nativeHookMalloc, nativeHookStatisticsTableData, 0)).toBeUndefined();
  });

  it('TabPaneNMStatsticsTest02', function () {
    expect(tabPaneNMStatstics.setSubTypeTableData(nativeHookMalloc, nativeHookStatisticsTableData)).toBeUndefined();
  });

  it('TabPaneNMStatsticsTest03', function () {
    expect(
      tabPaneNMStatstics.setMemoryTypeData(valData, nativeHookMalloc, nativeHookStatisticsTableData)
    ).toBeUndefined();
  });
  it('TabPaneNMStatsticsTest04', function () {
    expect(tabPaneNMStatstics.sortByColumn('', 0)).toBeUndefined();
  });
  it('TabPaneNMStatsticsTest105', function () {
    expect(tabPaneNMStatstics.sortByColumn('existingString', 1)).toBeUndefined();
  });
  it('TabPaneNMStatsticsTest06', function () {
    expect(tabPaneNMStatstics.sortByColumn('allocCount', 1)).toBeUndefined();
  });
  it('TabPaneNMStatsticsTest07', function () {
    expect(tabPaneNMStatstics.sortByColumn('freeByteString', 1)).toBeUndefined();
  });
});
