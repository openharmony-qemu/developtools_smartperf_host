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

jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});
import { SpNativeMemoryChart } from '../../../../src/trace/component/chart/SpNativeMemoryChart';

jest.mock('../../../../src/js-heap/model/DatabaseStruct');
const sqlit = require('../../../../src/trace/database/sql/NativeHook.sql');
jest.mock('../../../../src/trace/database/sql/NativeHook.sql');
const memSqlite = require('../../../../src/trace/database/sql/Memory.sql');
jest.mock('../../../../src/trace/database/sql/Memory.sql');
const clockSqlite = require('../../../../src/trace/database/sql/Clock.sql');
jest.mock('../../../../src/trace/database/sql/Clock.sql');
const sqlite = require('../../../../src/trace/database/sql/SqlLite.sql');
jest.mock('../../../../src/trace/database/sql/SqlLite.sql');
const intersectionObserverMock = () => ({
  observe: () => null,
});
window.IntersectionObserver = jest.fn().mockImplementation(intersectionObserverMock);

// @ts-ignore
window.ResizeObserver = window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    unobserve: jest.fn(),
    observe: jest.fn(),
  }));
describe('SpNativeMemoryChart Test', () => {
  let htmlElement: any = document.createElement('sp-system-trace');
  let spNativeMemoryChart = new SpNativeMemoryChart(htmlElement);

  let queryNativeHookStatisticsCount = sqlit.queryNativeHookStatisticsCount;
  queryNativeHookStatisticsCount.mockResolvedValue([
    {
      num: 2,
    },
  ]);

  let queryNativeMemoryRealTime = memSqlite.queryNativeMemoryRealTime;
  queryNativeMemoryRealTime.mockResolvedValue([
    {
      ts: 1502013097360370200,
      clock_name: 'realtime',
    },
  ]);

  let queryBootTime = clockSqlite.queryBootTime;
  queryBootTime.mockResolvedValue([
    {
      ts: -557295431,
      clock_name: 'boottime',
    },
  ]);

  let nativeHookProcess = sqlit.queryNativeHookProcess;
  nativeHookProcess.mockResolvedValue([
    {
      ipid: 0,
      pid: 0,
      name: 'name',
    },
  ]);

  let heapGroupByEvent = sqlite.queryHeapGroupByEvent;
  heapGroupByEvent.mockResolvedValue([
    {
      eventType: 'AllocEvent',
      sumHeapSize: 10,
    },
  ]);

  it('SpNativeMemoryChart01', function () {
    expect(spNativeMemoryChart.initChart()).toBeDefined();
  });
});
