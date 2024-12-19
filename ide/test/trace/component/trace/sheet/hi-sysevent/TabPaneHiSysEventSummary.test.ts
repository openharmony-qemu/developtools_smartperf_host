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
import { TabPaneHiSysEventSummary } from '../../../../../../src/trace/component/trace/sheet/hisysevent/TabPaneHiSysEventSummary';
const perf = require('../../../../../../src/trace/database/sql/Perf.sql');
jest.mock('../../../../../../src/trace/database/sql/Perf.sql');

window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));
describe('TabPaneHilogSummary Test', () => {
  let queryHiSysEventTabData = perf.queryHiSysEventTabData;
  let data = [
    {
      id: 1,
      domain: "d",
      eventName: "s",
      eventType: 0,
      tz: 475,
      pid: 999,
      tid: 5,
      uid: 4,
      info: "885",
      level: 1,
      seq: "5",
      contents: "60",
      startTs: 5,
      dur: 511,
    }
  ];
  queryHiSysEventTabData.mockResolvedValue(data);
  
  let summaryTab = new TabPaneHiSysEventSummary();
  let summaryData = {
    sysAllEventsData: [{
      id: 1,
      domain: 'DISPLAY',
      eventName: 'AMBIENT_LIGHT',
      eventType: 2,
      ts: 2797000000,
      tz: '23925',
      pid: 23925,
      tid: 24086,
      uid: 5523,
      info: '',
      level:'MINOR',
      seq: '92839',
      contents: '{"LEVEL":126}',
      dur: 0,
      depth: 0,
      isSelected: false,
    }]
  };
  it('TabPaneHilogSummaryTest01', function () {
    summaryTab.data = summaryData;
    expect(summaryTab.data).toBeUndefined();
  });
});
