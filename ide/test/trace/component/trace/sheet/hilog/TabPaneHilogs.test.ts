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

import { TabPaneHiLogs } from '../../../../../../src/trace/component/trace/sheet/hilog/TabPaneHiLogs';
import { TraceSheet } from '../../../../../../src/trace/component/trace/base/TraceSheet';
import '../../../../../../src/base-ui/table/LitPageTable'
import { TraceRow } from '../../../../../../src/trace/component/trace/base/TraceRow';

jest.mock('../../../../../../src/base-ui/table/lit-table', () => {
  return {
    recycleDataSource: (): void => {
    },
  };
});
jest.mock('../../../../../../src/js-heap/model/DatabaseStruct', () => {
});

const intersectionObserverMock = (): { observe: () => null } => ({
  observe: (): null => null,
});
window.IntersectionObserver = jest.fn().mockImplementation(intersectionObserverMock);

jest.mock('../../../../../../src/trace/component/trace/base/TraceSheet', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/cpu/ProcedureWorkerCPU', () => {
  return {
    cpuCount: 1,
    CpuRender: Object,
    EmptyRender: Object,
  };
});

const sqlit = require('../../../../../../src/trace/database/sql/SqlLite.sql');
jest.mock('../../../../../../src/trace/database/sql/SqlLite.sql');

window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

describe('TabPaneHilogs Test', (): void => {
  TraceRow.range = jest.fn(() => true);
  TraceRow.range!.startNS = jest.fn(() => 0);
  TraceRow.range!.endNS = jest.fn(() => 27763331331);
  TraceRow.range!.totalNS = jest.fn(() => 27763331331);
  let hiLogsTab = new TabPaneHiLogs();
  document.body.innerHTML = '<div id="vessel"></div>';
  let vessel = document.querySelector<HTMLDivElement>('#vessel');
  vessel!.append(hiLogsTab);
  let logsData = {
    leftNs: 0,
    rightNs: 33892044011,
    hiLogs: [{
      id: 2,
      pid: 1119,
      tid: 1172,
      processName: 'process1119',
      startTs: 33872275426,
      level: 'I',
      tag: 'C02d0c/Hiprofiler',
      context: 'ParseTimeExtend: upd',
      time: 0,
      depth: 0,
      dur: 0,
    }, {
      id: 3,
      pid: 1119,
      tid: 1172,
      processName: 'process1119',
      startTs: 33874375717,
      level: 'W',
      tag: 'C02d0c/Hiprofiler',
      context: 'ParseTimeExtend: upd',
      time: 0,
      depth: 0,
      dur: 0,
    }, {
      id: 4,
      pid: 1119,
      tid: 1172,
      processName: 'process1119',
      startTs: 33878711051,
      level: 'D',
      tag: 'C02d0c/Hiprofiler',
      context: 'ParseTimeExtend: upd',
      time: 0,
      depth: 0,
      dur: 0,
    }, {
      id: 5,
      pid: 1119,
      tid: 1172,
      processName: 'process1119',
      startTs: 33885632885,
      level: 'E',
      tag: 'C02d0c/Hiprofiler',
      context: 'ParseTimeExtend: upd',
      time: 0,
      depth: 0,
      dur: 0,
    }, {
      id: 6,
      pid: 1119,
      tid: 1172,
      processName: 'process1119',
      startTs: 33889724969,
      level: 'F',
      tag: 'C02d0c/Hiprofiler',
      context: 'ParseTimeExtend: upd',
      time: 0,
      depth: 0,
      dur: 0,
    }, {
      id: 7,
      pid: 1119,
      tid: 1172,
      processName: 'process1119',
      startTs: 33892044011,
      level: 'A',
      tag: 'C02d0c/Hiprofiler',
      context: 'ParseTimeExtend: upd',
      time: 0,
      depth: 0,
      dur: 0,
    }]
  };

  let logs = sqlit.queryLogAllData;
  let logData = [
    {
      id: 1,
      startTs: 25,
      level: "",
      depth: 1,
      tag: "",
      context: "",
      originTime: 15252,
      pid: 258,
      tid: 586,
      processName: "processName",
      dur: 1
    }
  ];
  logs.mockResolvedValue(logData);

  it('TabPaneHilogsTest01', function () {
    let htmlElement = document.createElement('div');
    let sheetEl = document.createElement('trace-sheet') as TraceSheet;
    sheetEl!.systemLogFlag = undefined;
    hiLogsTab.initTabSheetEl(htmlElement, sheetEl);
    hiLogsTab.data = logsData;
  });
});
