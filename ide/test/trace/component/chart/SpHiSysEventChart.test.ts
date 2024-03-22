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

import { SpHiSysEventChart } from '../../../../src/trace/component/chart/SpHiSysEventChart';
jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});
jest.mock('../../../../src/js-heap/model/DatabaseStruct');
const sqlite = require('../../../../src/trace/database/sql/Perf.sql');
jest.mock('../../../../src/trace/database/sql/Perf.sql');
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

describe('SpHiSysEventChart Test', () => {
  let spHiSysEvent;
  let hiSysEventList;
  let hiSysEventListData;
  beforeEach(() => {
    let htmlElement: any = document.createElement('sp-system-trace');
    spHiSysEvent = new SpHiSysEventChart(htmlElement);
    hiSysEventList = jest.spyOn(sqlite, 'queryHiSysEventData');
    hiSysEventListData = [{
      id: 1,
      domain: 'STARTUP',
      eventName: 'PROCESS_EXIT',
      eventType: '4',
      ts: 1,
      tz: 'dad',
      pid: 1,
      tid: 1,
      uid: 1,
      info: '',
      level: 'MINOR',
      seq: '92860',
      contents: 'APP_PID',
      dur: 1,
      depth: 1,
    }];
    hiSysEventList.mockResolvedValue(hiSysEventListData);
  });
  it('SpHiSysEventChartTest01', function () {
    expect(spHiSysEvent.init()).toBeTruthy();
  });
});
