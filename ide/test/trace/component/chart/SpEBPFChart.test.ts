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

import { SpEBPFChart } from '../../../../src/trace/component/chart/SpEBPFChart';
import { SpChartManager } from '../../../../src/trace/component/chart/SpChartManager';
const sqlit = require('../../../../src/trace/database/SqlLite');
jest.mock('../../../../src/trace/database/SqlLite');
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
import { TraceRow } from '../../../../src/trace/component/trace/base/TraceRow';
jest.mock('../../../../src/js-heap/model/DatabaseStruct', () => {});
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

describe('SpFileSystemChart Test', () => {
  let hasFileSysData = sqlit.hasFileSysData;
  hasFileSysData.mockResolvedValue([
    {
      fsCount: 2,
      vmCount: 2,
      ioCount: 2,
    },
  ]);

  let ss = new SpChartManager();
  let spEBPFChart = new SpEBPFChart(ss);
  spEBPFChart.initFileCallchain = jest.fn(() => true);
  it('SpMpsChart01', function () {
    spEBPFChart.init();
    expect(spEBPFChart).toBeDefined();
  });
  it('SpMpsChart02', function () {
    ss.displayTip = jest.fn(() => true);
    expect(spEBPFChart.focusHandler(TraceRow)).toBeUndefined();
  });
});
