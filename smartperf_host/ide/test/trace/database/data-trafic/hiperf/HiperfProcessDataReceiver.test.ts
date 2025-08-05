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
  chartHiperfProcessData10MSProtoSql, chartHiperfProcessDataProtoSql, hiperfProcessDataReceiver
} from '../../../../../src/trace/database/data-trafic/hiperf/HiperfProcessDataReceiver';

describe('HiperfProcess Test', () => {
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
        pid: 11,
        recordEndNS: 30418971157414,
        recordStartNS: 30369799963682,
        scale: 2000000000,
        startNS: 0,
        width: 1407,
      },
    };
    data2 = {
      params: {
        trafic: TraficEnum.ProtoBuffer,
        sharedArrayBuffers: {},
        drawType: -2,
        endNS: 10360520695.855345,
        intervalPerf: 1,
        maxCpuCount: -1,
        pid: 11,
        recordEndNS: 30418971157414,
        recordStartNS: 30369799963682,
        scale: 20000000,
        startNS: 9901354882.564587,
        width: 888,
      },
    };
    proc1 = jest.fn((sql) => [
      { hiperfData: { callchainId: 262, eventCount: 14, eventTypeId: 1, sampleCount: 1, startNs: 130000000 } },
      { hiperfData: { callchainId: 422, eventCount: 24, eventTypeId: 2, sampleCount: 1, startNs: 170000000 } },
    ]);
    proc2 = jest.fn((sql) => [
      { hiperfData: { callchainId: 12515, eventCount: 191077, eventTypeId: 1, sampleCount: 1, startNs: 10017921673 } },
      { hiperfData: { callchainId: 94, eventCount: 140815, eventTypeId: 1, sampleCount: 1, startNs: 10022069465 } },
    ]);
  });
  it('HiperfProcessReceiverTest01', () => {
    expect(chartHiperfProcessData10MSProtoSql(data1.params)).toBeTruthy();
    expect(chartHiperfProcessDataProtoSql(data2.params)).toBeTruthy();
  });
  it('HiperfProcessReceiverTest02', () => {
    let mockPostMessage = jest.fn();
    global.postMessage = mockPostMessage;
    hiperfProcessDataReceiver(data1, proc1);
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
  });
  it('HiperfProcessReceiverTest03', () => {
    let mockPostMessage = jest.fn();
    global.postMessage = mockPostMessage;
    hiperfProcessDataReceiver(data2, proc2);
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
  });
});
