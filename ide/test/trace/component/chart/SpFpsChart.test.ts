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

import { SpFpsChart } from '../../../../src/trace/component/chart/SpFpsChart';
import { SpChartManager } from '../../../../src/trace/component/chart/SpChartManager';

const sqlit = require('../../../../src/trace/database/SqlLite');
jest.mock('../../../../src/trace/database/SqlLite');
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});

window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));
describe('spFpsChart Test', () => {
  let spFpsChart = new SpFpsChart(new SpChartManager());
  let fpsMock = sqlit.getFps;
  fpsMock.mockResolvedValue([
    { startNS: 0, fps: 1 },
    { startNS: 2, fps: 3 },
  ]);

  it('spFpsChart01', function () {
    expect(spFpsChart.init()).toBeDefined();
  });
});
