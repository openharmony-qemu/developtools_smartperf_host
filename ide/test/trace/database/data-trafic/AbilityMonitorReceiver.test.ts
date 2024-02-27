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
  abilityBytesInTraceDataProtoSql, abilityBytesInTraceDataReceiver,
  abilityBytesOutTraceDataProtoSql, abilityBytesOutTraceDataReceiver,
  abilityBytesReadDataProtoSql, abilityBytesReadDataReceiver,
  abilityBytesWrittenDataProtoSql, abilityBytesWrittenDataReceiver,
  abilityMemoryDataProtoSql, abilityMemoryUsedDataReceiver,
  abilityPacketInDataProtoSql, abilityPacketInTraceDataReceiver,
  abilityPacketsOutDataProtoSql, abilityPacketsOutTraceDataReceiver,
  abilityReadOpsDataProtoSql, abilityReadOpsDataReceiver,
  abilityWrittenOpsDataProtoSql, abilityWrittenOpsDataReceiver,
  cpuAbilityMonitorDataProtoSql, cpuAbilityMonitorDataReceiver,
  cpuAbilitySystemDataProtoSql, cpuAbilitySystemDataReceiver,
  cpuAbilityUserDataProtoSql, cpuAbilityUserDataReceiver
} from '../../../../src/trace/database/data-trafic/AbilityMonitorReceiver';
import { TraficEnum } from '../../../../src/trace/database/data-trafic/utils/QueryEnum';

describe('AbilityMonitorReceiver Test', () => {
  let data;
  let proc;

  beforeEach(() => {
    data = {
      params: {
        trafic: TraficEnum.ProtoBuffer,
        sharedArrayBuffers: {
          id: new Uint16Array([1, 2, 3]),
        },
      },
    };
    proc = jest.fn((sql) => [
      {abilityData: {id: 4, startNs: 4.4, pid: 40, tid: 400, dur: 40000, depth: 4}},
      {abilityData: {id: 5, startNs: 5.5, pid: 50, tid: 500, dur: 50000, depth: 5}},
    ]);
  });
  it('AbilityMonitorReceiverTest01', () => {
    const args = {
      recordStartNS: 1000,
      endNS: 3000,
      startNS: 2000,
      width: 10
    };
    expect(cpuAbilityMonitorDataProtoSql(args)).toBeTruthy();
    expect(cpuAbilityUserDataProtoSql(args)).toBeTruthy();
    expect(cpuAbilitySystemDataProtoSql(args)).toBeTruthy();
    expect(abilityMemoryDataProtoSql(args)).toBeTruthy();
    expect(abilityBytesReadDataProtoSql(args)).toBeTruthy();
    expect(abilityBytesWrittenDataProtoSql(args)).toBeTruthy();
    expect(abilityReadOpsDataProtoSql(args)).toBeTruthy();
    expect(abilityWrittenOpsDataProtoSql(args)).toBeTruthy();
    expect(abilityBytesInTraceDataProtoSql(args)).toBeTruthy();
    expect(abilityBytesOutTraceDataProtoSql(args)).toBeTruthy();
    expect(abilityPacketInDataProtoSql(args)).toBeTruthy();
    expect(abilityPacketsOutDataProtoSql(args)).toBeTruthy();
  });
  it('AbilityMonitorReceiverTest02', () => {
    let mockPostMessage = jest.fn();
    global.postMessage = mockPostMessage;
    abilityMemoryUsedDataReceiver(data, proc);
    abilityBytesReadDataReceiver(data, proc);
    abilityBytesWrittenDataReceiver(data, proc);
    abilityReadOpsDataReceiver(data, proc);
    abilityWrittenOpsDataReceiver(data, proc);
    abilityBytesInTraceDataReceiver(data, proc);
    abilityBytesOutTraceDataReceiver(data, proc);
    abilityPacketInTraceDataReceiver(data, proc);
    abilityPacketsOutTraceDataReceiver(data, proc);

    expect(mockPostMessage).toHaveBeenCalledTimes(9);
  });
  it('AbilityMonitorReceiverTest03', () => {
    let cpuAbilityData = {
      params: {
        trafic: TraficEnum.ProtoBuffer,
        sharedArrayBuffers: {
          id: new Uint16Array([1, 2, 3]),
        },
      },
    };
    let cpuAbilityProc = jest.fn((sql) => [
      {cpuAbilityData: {id: 4, startNs: 4.4, pid: 40, tid: 400, dur: 40000, depth: 4}},
      {cpuAbilityData: {id: 5, startNs: 5.5, pid: 50, tid: 500, dur: 50000, depth: 5}},
    ]);
    let mockPostMessage = jest.fn();
    global.postMessage = mockPostMessage;
    cpuAbilityMonitorDataReceiver(cpuAbilityData, cpuAbilityProc);
    cpuAbilityUserDataReceiver(cpuAbilityData, cpuAbilityProc);
    cpuAbilitySystemDataReceiver(cpuAbilityData, cpuAbilityProc);
    expect(mockPostMessage).toHaveBeenCalledTimes(3);
  });
});