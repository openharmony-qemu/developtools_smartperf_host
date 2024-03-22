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
  chartHiperfCallChartDataSql,
  hiPerfCallChartDataHandler, hiPerfCallStackCacheHandler
} from '../../../../../src/trace/database/data-trafic/hiperf/HiperfCallChartReceiver';

describe('HiperfCallChartReceiver Test', () => {
  let data;
  let proc;
  let data2;
  beforeEach(() => {
    data = {
      id: "817fccf0-76a8-41f3-86d6-6282b1208b58",
      name: 203,
      action: "exec-proto",
      params: {
        recordStartNS: 1395573006744,
        trafic: 2,
        isCache: true
      }
    };
    data2 = {
      id: "817fccf0-76a8-41f3-86d6-6282b1208b58",
      name: 203,
      action: "exec-proto",
      params: {
        recordStartNS: 1395573006744,
        trafic: 2,
        isCache: false
      }
    };
    proc = jest.fn((sql) => [
      {HiperfCallChartData: {callchainId: 4, startTs: 4.4, eventCount: 40, threadId: 400, cpuId: 40000, eventTypeId: 4}},
      {HiperfCallChartData: {callchainId: 5, startTs: 5.5, eventCount: 50, threadId: 500, cpuId: 50000, eventTypeId: 5}},
    ]);
  });
  it('HiperfCallChartReceiver01', function () {
    const args = {
      recordStartNS: 1000,
      endNS: 3000,
      startNS: 2000,
      width: 10
    };
    expect(chartHiperfCallChartDataSql(args)).toBeTruthy();
  });
  it('HiperfCallChartReceiver02', () => {
    const mockPostMessage = jest.fn();
    global.postMessage = mockPostMessage;
    hiPerfCallChartDataHandler(data, proc);
    hiPerfCallChartDataHandler(data2, proc);
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
  });
  it('HiperfCallChartReceiver03', () => {
    const mockPostMessage = jest.fn();
    global.postMessage = mockPostMessage;
    hiPerfCallStackCacheHandler(data, proc);
    hiPerfCallStackCacheHandler(data2, proc);
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
  });
});