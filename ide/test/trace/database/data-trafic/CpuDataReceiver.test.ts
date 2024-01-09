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
  chartCpuDataProtoSql,
  chartCpuDataProtoSqlMem, cpuDataReceiver
} from '../../../../src/trace/database/data-trafic/CpuDataReceiver';

describe('CpuDataReceiver Test', () => {
  let data;
  let proc;
  let data2;
  beforeEach(() => {
    data = {
      id: 'b1ba1ace-8f2b-4ce4-b27e-7a3bf2ff8499',
      name: 0,
      action: 'exec-proto',
      params: {
        cpu: 0,
        startNS: 0,
        endNS: 74946716780,
        recordStartNS: 1395573006744,
        recordEndNS: 1470519723524,
        width: 491,
        t: 1703729410566,
        trafic: 0,
        sharedArrayBuffers: {
          processId: {},
          id: {},
          tid: {},
          cpu: {},
          dur: {},
          startTime: {},
          argSetId: {}
        }
      }
    };
     data2 = {
      id: 'b1ba1ace-8f2b-4ce4-b27e-7a3bf2ff8499',
      name: 0,
      action: 'exec-proto',
      params: {
        cpu: 0,
        startNS: 0,
        endNS: 74946716780,
        recordStartNS: 1395573006744,
        recordEndNS: 1470519723524,
        width: 491,
        t: 1703729410566,
        trafic: 1,
        sharedArrayBuffers: {
          processId: {},
          id: {},
          tid: {},
          cpu: {},
          dur: {},
          startTime: {},
          argSetId: {}
        }
      }
    };
    proc = jest.fn((sql) => [
      {CpuData: {id: 4, startTime: 4.4, processId: 40, tid: 400, cpu: 0, argSetId: 1, dur: 40000}},
      {CpuData: {id: 5, startTime: 5.5, processId: 50, tid: 500, cpu: 0, argSetId: 2, dur: 50000}},
    ]);
  });
  it('CpuDataReceiverTest01 ', function () {
    const args = {
      recordStartNS: 1000,
      endNS: 3000,
      startNS: 2000,
      width: 10,
      cpu:0,
    };
    expect(chartCpuDataProtoSql(args)).toBeTruthy();
    expect(chartCpuDataProtoSqlMem(args)).toBeTruthy();
  });
  it('CpuDataReceiverTest02 ', function () {
    const mockPostMessage = jest.fn();
    global.postMessage = mockPostMessage;
    cpuDataReceiver(data, proc);
    cpuDataReceiver(data2,proc)
    expect(mockPostMessage).toHaveBeenCalledTimes(2);
  });
});