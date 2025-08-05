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
  chartHiperfCpuData10MSProtoSql, chartHiperfCpuDataProtoSql, hiperfCpuDataReceiver
} from '../../../../../src/trace/database/data-trafic/hiperf/HiperfCpuDataReceiver';

describe(' HiperfCpuDataReceiver Test', () => {
  let data;
  let proc;

  beforeEach(() => {
    data = {
      id: '87cc16a3-5dc7-4202-9ac9-4f038b2979ee',
      name: 200,
      action: 'exec-proto',
      params: {
        cpu: -1,
        scale: 2000000000,
        maxCpuCount: 4,
        drawType: -2,
        intervalPerf: 1,
        startNS: 0,
        endNS: 30230251246,
        recordStartNS: 1596201782236,
        recordEndNS: 1626432033482,
        width: 549,
        trafic: 3
      }
    };
    proc = jest.fn((sql: any) => [
      {hiperfData: {startNs: 5600000000, eventCount: 58513886, sampleCount: 42, callchainId: 2279}},
      {hiperfData: {startNs: 5630000000, eventCount: 60359281, sampleCount: 36, callchainId: 5147}}
    ]);
  });
  it('HiperfCpuDataReceiverTest01 ', function () {
    const args = {
      recordStartNS: 1000,
      endNS: 3000,
      startNS: 2000,
      width: 10
    };
    expect(chartHiperfCpuData10MSProtoSql(args)).toBeTruthy();
    expect(chartHiperfCpuDataProtoSql(args)).toBeTruthy();
  });
  it('HiperfCpuDataReceiverTest02 ', function () {
    const mockPostMessage = jest.fn();
    global.postMessage = mockPostMessage;
    hiperfCpuDataReceiver(data, proc);
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
  });
});