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

import { TraficEnum } from '../../../../../src/trace/database/data-trafic/utils/QueryEnum';
import {
  chartHiperfThreadData10MSProtoSql, chartHiperfThreadDataProtoSql, hiperfThreadDataReceiver
} from '../../../../../src/trace/database/data-trafic/hiperf/HiperfThreadDataReceiver';

describe('HiperfThread Test', () => {
  let data1;
  let data2;
  let proc1;
  let proc2;

  beforeEach(() => {
    data1 = {
      params: {
        trafic: TraficEnum.ProtoBuffer,
        sharedArrayBuffers: {},
        drawType: -2,
        endNS: 49171193732,
        intervalPerf: 1,
        maxCpuCount: -1,
        recordEndNS: 30418971157414,
        recordStartNS: 30369799963682,
        scale: 2000000000,
        startNS: 0,
        tid: 28917,
        width: 841,
      },
    };
    data2 = {
      params: {
        trafic: TraficEnum.ProtoBuffer,
        sharedArrayBuffers: {},
        drawType: -2,
        endNS: 38843292896.21842,
        intervalPerf: 1,
        maxCpuCount: -1,
        recordEndNS: 30418971157414,
        recordStartNS: 30369799963682,
        scale: 20000000,
        startNS: 38410507602.73825,
        tid: 28917,
        width: 841,
      },
    };
    proc1 = jest.fn((sql) => [
      { hiperfData: { callchainId: 12, eventCount: 3603585, sampleCount: 11, startNs: 0 } },
      { hiperfData: { callchainId: 128, eventCount: 728632, sampleCount: 1, startNs: 70000000 } },
    ]);
    proc2 = jest.fn((sql) => [
      { hiperfData: { callchainId: 1114, eventCount: 106450, sampleCount: 1, startNs: 38427936069 } },
      { hiperfData: { callchainId: 94, eventCount: 140815, sampleCount: 1, startNs: 38428328069 } },
    ]);
  });
  it('HiperfThreadReceiverTest01', () => {
    expect(chartHiperfThreadData10MSProtoSql(data1.params)).toBeTruthy();
    expect(chartHiperfThreadDataProtoSql(data2.params)).toBeTruthy();
  });
  it('HiperfThreadReceiverTest02', () => {
    let mockPostMessage = jest.fn();
    global.postMessage = mockPostMessage;
    hiperfThreadDataReceiver(data1, proc1);
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
  });
  it('HiperfThreadReceiverTest03', () => {
    let mockPostMessage = jest.fn();
    global.postMessage = mockPostMessage;
    hiperfThreadDataReceiver(data2, proc2);
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
  });
});
