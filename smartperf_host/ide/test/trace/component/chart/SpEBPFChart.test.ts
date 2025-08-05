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
jest.mock('../../../../src/js-heap/model/DatabaseStruct');
const sqlit = require('../../../../src/trace/database/sql/Memory.sql');
jest.mock('../../../../src/trace/database/sql/Memory.sql');
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
import { TraceRow } from '../../../../src/trace/component/trace/base/TraceRow';
jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});
import { EBPFChartStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerEBPF';
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

describe('SpFileSystemChart Test', () => {
  let hasFileSysData = sqlit.hasFileSysData;
  hasFileSysData.mockResolvedValue([
    {
      fsCount: 2,
      vmCount: 2,
      ioCount: 2,
    },
  ]);
  let getDiskIOProcess = sqlite.getDiskIOProcess;
  getDiskIOProcess.mockResolvedValue([
    {
      name: 'kworker/u8:4',
      ipid: 2,
      pid: 186,
    }
  ]);
  let htmlElement: any = document.createElement('sp-system-trace');
  let spEBPFChart = new SpEBPFChart(htmlElement);
  spEBPFChart.initFileCallchain = jest.fn(() => true);
  it('SpMpsChart01', function () {
    spEBPFChart.init();
    expect(spEBPFChart).toBeDefined();
  });
  it('SpMpsChart02', function () {
    spEBPFChart.trace.displayTip = jest.fn();
    expect(spEBPFChart.focusHandler(new TraceRow<EBPFChartStruct>())).toBeUndefined();
  });
});
