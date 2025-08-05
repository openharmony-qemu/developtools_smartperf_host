
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
import '../../../../src/trace/component/trace/base/TraceRow';
import { TraceRow } from '../../../../src/trace/component/trace/base/TraceRow';
import {
    cpuAbilityUserDataSender,
    abilityMemoryUsedDataSender,
    abilityBytesReadDataSender,
    abilityBytesInTraceDataSender
} from '../../../../src/trace/database/data-trafic/AbilityMonitorSender';
import { threadPool } from '../../../../src/trace/database/SqlLite';
import { DiskAbilityMonitorStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerDiskIoAbility';
import { NetworkAbilityMonitorStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerNetworkAbility';
import { CpuAbilityMonitorStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerCpuAbility';
import { MemoryAbilityMonitorStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerMemoryAbility';
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../src/js-heap/model/DatabaseStruct', () => {});
describe('AbilityMonitorSender Test', () => {
  let traceRowData = {
    dur: 9928,
    frame:
      {x: 16, y: 5, width: 17, height: 30},
    startNS: 9928,
    value: 6
  }
  let useTraceRowData = {
    dur: 9928,
    frame:
      {x: 16, y: 5, width: 17, height: 30},
    startNS: 9928,
    value: 2.62424
  }
  let sysTraceRowData = {
    dur: 92876,
    frame:
      {x: 16, y: 5, width: 17, height: 30},
    startNS: 6648,
    value: 3.474
  }
  let memoryUsedData = {
    dur: 877,
    frame:
      {x: 68, y: 5, width: 83, height: 30},
    startNS: 2089,
    value: 2012
  }
  let bytesReadData = {
    dur: 9961,
    frame:
      {x: 16, y: 5, width: 17, height: 30},
    startNS: 147,
    value: 4
  }
  let bytesInTraceRowData = {
    dur: 1768,
    frame:
      {x: 16, y: 5, width: 18, height: 30},
    startNS: 21817,
    value: 24
  }
  it('AbilityMonitorSenderTest01', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(traceRowData, 1, true);
    });
    let traceRow = TraceRow.skeleton<CpuAbilityMonitorStruct>();
    cpuAbilityUserDataSender(traceRow,'CpuAbilityMonitorData').then(res => {
      expect(res).toHaveLength(1);
    });
  });
  it('AbilityMonitorSenderTest02', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(useTraceRowData, 1, true);
    });
    let traceRow = TraceRow.skeleton<CpuAbilityMonitorStruct>();
    cpuAbilityUserDataSender(traceRow,'CpuAbilityUserData').then(res => {
      expect(res).toHaveLength(1);
    });
  });
  it('AbilityMonitorSenderTest03', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(sysTraceRowData, 1, true);
    });
    let traceRow = TraceRow.skeleton<CpuAbilityMonitorStruct>();
    cpuAbilityUserDataSender(traceRow,'CpuAbilitySystemData').then(res => {
      expect(res).toHaveLength(1);
    });
  });
  it('AbilityMonitorSenderTest04', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(memoryUsedData, 1, true);
    });
    let memoryUsedTraceRow = TraceRow.skeleton<MemoryAbilityMonitorStruct>();
    abilityMemoryUsedDataSender('2241',memoryUsedTraceRow).then(res => {
      expect(res).toHaveLength(1);
    });
  });
  it('AbilityMonitorSenderTest05', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(memoryUsedData, 1, true);
    });
    let memoryUsedTraceRow = TraceRow.skeleton<MemoryAbilityMonitorStruct>();
    abilityMemoryUsedDataSender('2241',memoryUsedTraceRow).then(res => {
      expect(res).toHaveLength(1);
    });
  });
  it('AbilityMonitorSenderTest06', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(bytesReadData, 1 , true);
    });
    let traceRow = TraceRow.skeleton<DiskAbilityMonitorStruct>();
    abilityBytesReadDataSender(traceRow,'AbilityBytesReadData').then(res => {
      expect(Array.isArray(res)).toBe(true);
    });
  });
  it('AbilityMonitorSenderTest07', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(bytesReadData, 1, true);
    });
    let traceRow = TraceRow.skeleton<DiskAbilityMonitorStruct>();
    abilityBytesReadDataSender(traceRow,'AbilityBytesWrittenData').then(res => {
      expect(Array.isArray(res)).toBe(true);
    });
  });
  it('AbilityMonitorSenderTest08', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(bytesReadData, 1, true);
    });
    let traceRow = TraceRow.skeleton<DiskAbilityMonitorStruct>();
    abilityBytesReadDataSender(traceRow,'AbilityReadOpsData').then(res => {
      expect(Array.isArray(res)).toBe(true);
    });
  });
  it('AbilityMonitorSenderTest08', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(bytesReadData, 1, true);
    });
    let traceRow = TraceRow.skeleton<DiskAbilityMonitorStruct>();
    abilityBytesReadDataSender(traceRow,'AbilityWrittenOpsData').then(res => {
      expect(Array.isArray(res)).toBe(true);
    });
  });
  it('AbilityMonitorSenderTest09', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(bytesInTraceRowData, 1, true);
    });
    let traceRow = TraceRow.skeleton<NetworkAbilityMonitorStruct>();
    abilityBytesInTraceDataSender(traceRow, 'AbilityBytesInTraceData').then(res => {
      expect(res).toHaveLength(1);
    });
  });
  it('AbilityMonitorSenderTest10', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(bytesInTraceRowData, 1, true);
    });
    let traceRow = TraceRow.skeleton<NetworkAbilityMonitorStruct>();
    abilityBytesInTraceDataSender(traceRow, 'AbilityBytesOutTraceData').then(res => {
      expect(res).toHaveLength(1);
    });
  });
  it('AbilityMonitorSenderTest11', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(bytesInTraceRowData, 1, true);
    });
    let traceRow = TraceRow.skeleton<NetworkAbilityMonitorStruct>();
    abilityBytesInTraceDataSender(traceRow, 'AbilityPacketInTraceData').then(res => {
      expect(res).toHaveLength(1);
    });
  });
  it('AbilityMonitorSenderTest12', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(bytesInTraceRowData, 1, true);
    });
    let traceRow = TraceRow.skeleton<NetworkAbilityMonitorStruct>();
    abilityBytesInTraceDataSender(traceRow, 'AbilityPacketsOutTraceData').then(res => {
      expect(res).toHaveLength(1);
    });
  });
});