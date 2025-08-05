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

import '../../../../src/trace/component/chart/SpSegmentationChart';
import { SpSegmentationChart } from '../../../../src/trace/component/chart/SpSegmentationChart';
import { SpSystemTrace } from '../../../../src/trace/component/SpSystemTrace';

jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../src/js-heap/model/DatabaseStruct', () => {});

const funcSqlit = require('../../../../src/trace/database/sql/Func.sql');
jest.mock('../../../../src/trace/database/sql/Func.sql');

const intersectionObserverMock = () => ({
  observe: () => null,
});
window.IntersectionObserver = jest.fn().mockImplementation(intersectionObserverMock);
// @ts-ignore
window.ResizeObserver = window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));
describe('SpSegmentationChart Test', () => {
  global.Worker = jest.fn();
  let mockqueryAllFuncNames = funcSqlit.queryAllFuncNames;
  mockqueryAllFuncNames.mockResolvedValue([]);
  let spSystemTrace = new SpSystemTrace();
  let segmentationChart = new SpSegmentationChart(spSystemTrace);
  it('SpSegmentationChartTest01 ', function () {
    segmentationChart.init();
  });
});
