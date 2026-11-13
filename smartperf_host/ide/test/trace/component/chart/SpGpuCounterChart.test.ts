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

import { BaseStruct } from '../../../../src/trace/bean/BaseStruct';
import '../../../../src/trace/component/chart/SpGpuCounterChart';
import { SpGpuCounterChart } from '../../../../src/trace/component/chart/SpGpuCounterChart';
import { SpSystemTrace } from '../../../../src/trace/component/SpSystemTrace';
import { TraceRow } from '../../../../src/trace/component/trace/base/TraceRow';
jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../src/js-heap/model/DatabaseStruct', () => {});

const sqlite = require('../../../../src/trace/database/sql/SqlLite.sql');
jest.mock('../../../../src/trace/database/sql/SqlLite.sql');

const intersectionObserverMock = () => ({
  observe: () => null,
});
window.IntersectionObserver = jest.fn().mockImplementation(intersectionObserverMock);
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));
describe('SpGpuCounterChart Test', () => {
  global.Worker = jest.fn();
  let rangeTimeData = sqlite.queryRangeTime;
  let mockRangeTime = [
    {
      start_ts: 10,
      end_ts: 20,
    },
  ];
  rangeTimeData.mockResolvedValue([]);
  rangeTimeData.mockResolvedValue(mockRangeTime);
  let htmlElement: SpSystemTrace = document.createElement('sp-system-trace') as SpSystemTrace;
  let chart = new SpGpuCounterChart(htmlElement);

  it('SpGpuCounterChart Test01 ', function () {
    chart.trace.extracted = jest.fn();
    expect(chart.initFolder([], false)).toBeUndefined();
  });
});
