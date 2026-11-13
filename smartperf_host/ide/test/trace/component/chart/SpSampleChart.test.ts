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
describe('SpArkTsChart Test', () => {
  let htmlElement: any = document.createElement('sp-system-trace');
  let spSampleChart = new SpBpftraceChart(htmlElement);
  let startTime = sqlite.queryStartTime;
  let startTimeData = [
    {startTs: 102132121}
  ];
  startTime.mockResolvedValue(startTimeData);
  it('SpSampleChartTest01', function () {
    expect(spSampleChart.init).toBeTruthy();
  });
  it('SpSampleChartTest02 ', function () {
    expect(spSampleChart.initSample(startTimeData[0].startTs, false)).toBeTruthy();
  });
});
