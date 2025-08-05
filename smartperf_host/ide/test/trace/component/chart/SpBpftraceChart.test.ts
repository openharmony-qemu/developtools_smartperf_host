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

import { SpBpftraceChart } from '../../../../src/trace/component/chart/SpBpftraceChart';
import { TraceRow } from '../../../../src/trace/component/trace/base/TraceRow';
import { SampleStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerBpftrace';
jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});

const sqlite = require('../../../../src/trace/database/sql/SqlLite.sql');
jest.mock('../../../../src/trace/database/sql/SqlLite.sql');
jest.mock('../../../../src/js-heap/model/DatabaseStruct');
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
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

describe('SpBpftraceChart Test', () => {
  let htmlElement: any = document.createElement('sp-system-trace');
  let BpftraceChart = new SpBpftraceChart(htmlElement);
  let queryStartTime = sqlite.queryStartTime;
  let queryStartTimeData = [
    {
      start_ts: 10000000,
    },
  ];
  queryStartTime.mockResolvedValue(queryStartTimeData);
  let traceRow = new TraceRow<SampleStruct>();
  it('SpBpftraceChart01', function () {
    expect(BpftraceChart.addTraceRowEventListener(traceRow, 10)).toBeUndefined();
  });
  it('SpBpftraceChart02', function () {
    expect(BpftraceChart.resetChartData(traceRow)).toBeUndefined();
  });
});
