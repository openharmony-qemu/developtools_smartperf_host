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
import { SpClockChart } from '../../../../src/trace/component/chart/SpClockChart';

const sqlite = require('../../../../src/trace/database/SqlLite');
jest.mock('../../../../src/trace/database/SqlLite');

window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

describe('SpClockChart Test', () => {
  let clockChart = new SpClockChart(new SpChartManager());

  let queryClock = sqlite.queryClockData;
  let queryClockData = [
    {
      name: 'Frequency',
      num: 20,
    },
    {
      name: 'State',
      num: 10,
    },
    {
      name: 'ScreenState',
      num: 10,
    },
  ];
  queryClock.mockResolvedValue(queryClockData);

  it('SpClockChart01', function () {
    expect(clockChart.init()).toBeDefined();
  });
});
