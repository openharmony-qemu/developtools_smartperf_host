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
import {
  chartClockDataSql,
  chartClockDataSqlMem,
  clockDataReceiver
} from '../../../../src/trace/database/data-trafic/ClockDataReceiver';

describe('ClockDataReceiver Test', () => {
  let data;
  let proc;
  beforeEach(() => {
    data = {
      id: 'bfcedc13-f545-434e-9914-c7823f1a6c17',
      name: 4,
      action: 'exec-proto',
      params: {
        clockName: 'cluster0_temp',
        sqlType: 'clockFrequency',
        startNS: 0,
        endNS: 9427688540,
        totalNS: 9427688540,
        recordStartNS: 4049847357191,
        recordEndNS: 4059275045731,
        t: 1703747964987,
        width: 491,
        trafic: 2,
      }
    };
    proc = jest.fn((sql) => [
      {ClockData: {filterId: 89, startNs: 197364063, type: 'measure', value: 48000, dur: 230475000, px: 11}},
      {ClockData: {filterId: 0, startNs: 197364063, type: 'measure', value: 48000, dur: 230475000, px: 11}},
    ]);
  });
  it('ClockDataReceiverTest01 ', function () {
    const args = {
      recordStartNS: 1000,
      endNS: 3000,
      startNS: 2000,
      width: 10,
      sqlType: 'clockFrequency'
    };
    expect(chartClockDataSql(args)).toBeTruthy();
    expect(chartClockDataSqlMem(args)).toBeTruthy();
  });
  it('ClockDataReceiverTest02 ', function () {
    const args = {
      recordStartNS: 1000,
      endNS: 3000,
      startNS: 2000,
      width: 10,
      sqlType: 'screenState'
    };
    expect(chartClockDataSql(args)).toBeTruthy();
    expect(chartClockDataSqlMem(args)).toBeTruthy();
  });
  it('hiSysEventDataReceiverTest03 ', function () {
    const args = {
      recordStartNS: 1000,
      endNS: 3000,
      startNS: 2000,
      width: 10,
      sqlType: 'clockState'
    };
    expect(chartClockDataSql(args)).toBeTruthy();
    expect(chartClockDataSqlMem(args)).toBeTruthy();
  });
  it('hiSysEventDataReceiverTest04', () => {
    const mockPostMessage = jest.fn();
    global.postMessage = mockPostMessage;
    clockDataReceiver(data,proc);
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
  });
});