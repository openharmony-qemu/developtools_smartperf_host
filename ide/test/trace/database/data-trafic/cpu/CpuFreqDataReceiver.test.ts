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
  chartCpuFreqDataSql,
  chartCpuFreqDataSqlMem, cpuFreqDataReceiver
} from '../../../../../src/trace/database/data-trafic/cpu/CpuFreqDataReceiver';

describe('CpuFreqDataReceiver Test',()=>{
  let data;
  let proc;

  beforeEach(() => {
    data = {
      id: "6a41c242-3e3e-4c3f-82f3-eab7102f0e9f",
      name: 2,
      action: "exec-proto",
      params: {
        cpu: 0,
        startNS: 0,
        endNS: 9427688540,
        recordStartNS: 4049847357191,
        recordEndNS: 4059275045731,
        t: 1703754730919,
        width: 549,
        trafic: 2
      }
    };
    proc = jest.fn((sql) => [
      {cpuFreqData: {cpu: 4, value: 826000, dur: 0, startNs: 8252840103}},
      {cpuFreqData: {cpu: 4, value: 826000, dur: 0, startNs: 8252840103}},
    ]);
  });
  it('CpuFreqDataReceiverTest01 ', function () {
    const args = {
      recordStartNS: 1000,
      endNS: 3000,
      startNS: 2000,
      width: 10
    };
    expect(chartCpuFreqDataSql (args)).toBeTruthy();
    expect(chartCpuFreqDataSqlMem  (args)).toBeTruthy();
  });
  it('CpuFreqDataReceiverTest02 ', function () {
    const mockPostMessage = jest.fn();
    global.postMessage = mockPostMessage;
    cpuFreqDataReceiver(data, proc);
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
  });
})