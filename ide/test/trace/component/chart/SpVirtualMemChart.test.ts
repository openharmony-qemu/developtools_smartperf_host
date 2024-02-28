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

import { SpChartManager } from '../../../../src/trace/component/chart/SpChartManager';
import { SpVirtualMemChart } from '../../../../src/trace/component/chart/SpVirtualMemChart';
import { SpSystemTrace } from '../../../../src/trace/component/SpSystemTrace';
import { TraceRow } from '../../../../src/trace/component/trace/base/TraceRow';
// @ts-ignore
window.ResizeObserver = window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(), observe: jest.fn(), unobserve: jest.fn(),
  }));
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../src/js-heap/model/DatabaseStruct');
const memorySqlite = require('../../../../src/trace/database/sql/Memory.sql');
jest.mock('../../../../src/trace/database/sql/Memory.sql');
describe('SpVirtualMemChart Test', () => {
  let manager = new SpChartManager();
  let spVirtualMemChart = new SpVirtualMemChart(manager);
  let MockVirtualMemory = memorySqlite.queryVirtualMemory;
  MockVirtualMemory.mockResolvedValue([
    {
      id: 0,
      name: 'name',
    },
  ]);

  let MockVirtualMemoryData = memorySqlite.queryVirtualMemoryData;
  MockVirtualMemoryData.mockResolvedValue([
    {
      startTime: 0,
      value: 20,
      filterID: 0,
    },
  ]);

  it('SpVirtualMemChart01', function () {
    spVirtualMemChart.init();
    expect(spVirtualMemChart).toBeDefined();
  });

  it('SpVirtualMemChart02', function () {
    let folder = new TraceRow({
      canvasNumber: 1,
      alpha: false,
      contextId: '2d',
      isOffScreen: SpSystemTrace.isCanvasOffScreen,
    });
    spVirtualMemChart.initVirtualMemoryRow(folder, 2, 'name', 2);
    expect(spVirtualMemChart).toBeDefined();
  });
});
