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

import { SpAllAppStartupsChart } from "../../../../src/trace/component/chart/SpAllAppStartups";

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
// @ts-ignore
window.ResizeObserver = window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));
const sqlite = require('../../../../src/trace/database/sql/ProcessThread.sql');
jest.mock('../../../../src/trace/database/sql/ProcessThread.sql');
describe('SpAllAppStartupsChart Test', () => {
  let htmlElement: any = document.createElement('sp-system-trace');
  let appStartUpsChart = new SpAllAppStartupsChart(htmlElement);
  let ids = sqlite.queryAppStartupProcessIds;
  ids.mockResolvedValue([
    {
      pid: 12
    }
  ]);
  let processStartup = sqlite.queryProcessStartup;
  processStartup.mockResolvedValue([
    {
      pid: 12,
      tid: 125,
      itid: 56
    }
  ]);
  let startupsName = sqlite.querySingleAppStartupsName;
  startupsName.mockResolvedValue([
    {
      name: 'name'
    }
  ]);
  it('SpLtpoChartTest01', function () {
    appStartUpsChart.init();
    expect(SpAllAppStartupsChart.APP_STARTUP_PID_ARR).toEqual([]);
  });
  it('SpLtpoChartTest02', function () {
    appStartUpsChart.initFolder();
    expect(SpAllAppStartupsChart.trace.rowsEL).toBeUndefined();
  });
});
