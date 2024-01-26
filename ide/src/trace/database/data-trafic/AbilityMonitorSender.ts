// Copyright (c) 2021 Huawei Device Co., Ltd.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { CHART_OFFSET_LEFT, MAX_COUNT, QueryEnum, TraficEnum } from './utils/QueryEnum';
import { threadPool } from '../SqlLite';
import { TraceRow } from '../../component/trace/base/TraceRow';
import { DiskAbilityMonitorStruct } from '../ui-worker/ProcedureWorkerDiskIoAbility';
import { NetworkAbilityMonitorStruct } from '../ui-worker/ProcedureWorkerNetworkAbility';
import { CpuAbilityMonitorStruct } from '../ui-worker/ProcedureWorkerCpuAbility';
import { MemoryAbilityMonitorStruct } from '../ui-worker/ProcedureWorkerMemoryAbility';
import { SnapshotStruct } from '../ui-worker/ProcedureWorkerSnapshot';

export function cpuAbilityUserDataSender(
  row: TraceRow<CpuAbilityMonitorStruct>,
  type: string
): Promise<CpuAbilityMonitorStruct[]> {
  let trafic: number = TraficEnum.Memory;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  let QueryEnumber: number = -1;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      value: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startNS: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      dur: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  if (type === 'CpuAbilityUserData') {
    QueryEnumber = QueryEnum.CpuAbilityUserData;
  } else if (type === 'CpuAbilitySystemData') {
    QueryEnumber = QueryEnum.CpuAbilitySystemData;
  } else if (type === 'CpuAbilityMonitorData') {
    QueryEnumber = QueryEnum.CpuAbilityMonitorData;
  }
  return new Promise((resolve, reject) => {
    threadPool.submitProto(
      QueryEnumber,
      {
        width: width,
        trafic: trafic,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        sharedArrayBuffers: row.sharedArrayBuffers,
      },
      (res: any, len: number, transfer: boolean) => {
        resolve(cpuAbilityMonitorArrayBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
      }
    );
  });
}
export function abilityMemoryUsedDataSender(
  id: string = '',
  row: TraceRow<MemoryAbilityMonitorStruct>
): Promise<MemoryAbilityMonitorStruct[]> {
  let trafic: number = TraficEnum.Memory;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      value: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startNS: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      dur: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve, reject) => {
    threadPool.submitProto(
      QueryEnum.AbilityMemoryUsedData,
      {
        id: id,
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
      },
      (res: any, len: number, transfer: boolean) => {
        resolve(memoryArrayBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
      }
    );
  });
}
export function abilityBytesReadDataSender(
  row: TraceRow<DiskAbilityMonitorStruct>,
  type: string
): Promise<DiskAbilityMonitorStruct[]> {
  let trafic: number = TraficEnum.Memory;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      value: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startNS: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      dur: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  let QueryEnumber = -1;
  if (type === 'AbilityBytesReadData') {
    QueryEnumber = QueryEnum.AbilityBytesReadData;
  } else if (type === 'AbilityBytesWrittenData') {
    QueryEnumber = QueryEnum.AbilityBytesWrittenData;
  } else if (type === 'AbilityReadOpsData') {
    QueryEnumber = QueryEnum.AbilityReadOpsData;
  } else if (type === 'AbilityWrittenOpsData') {
    QueryEnumber = QueryEnum.AbilityWrittenOpsData;
  }
  return new Promise((resolve, reject) => {
    threadPool.submitProto(
      QueryEnumber,
      {
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
      },
      (res: any, len: number, transfer: boolean) => {
        resolve(arrayBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
      }
    );
  });
}
export function abilityBytesInTraceDataSender(
  row: TraceRow<NetworkAbilityMonitorStruct>,
  type: string
): Promise<NetworkAbilityMonitorStruct[]> {
  let trafic: number = TraficEnum.Memory;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      value: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startNS: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      dur: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  let QueryEnumber: number = -1;
  if (type === 'AbilityBytesInTraceData') {
    QueryEnumber = QueryEnum.AbilityBytesInTraceData;
  } else if (type === 'AbilityBytesOutTraceData') {
    QueryEnumber = QueryEnum.AbilityBytesOutTraceData;
  } else if (type === 'AbilityPacketInTraceData') {
    QueryEnumber = QueryEnum.AbilityPacketInTraceData;
  } else if (type === 'AbilityPacketsOutTraceData') {
    QueryEnumber = QueryEnum.AbilityPacketsOutTraceData;
  }
  return new Promise((resolve, reject) => {
    threadPool.submitProto(
      QueryEnumber,
      {
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
      },
      (res: any, len: number, transfer: boolean) => {
        resolve(networkArrayBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
      }
    );
  });
}
function memoryArrayBufferHandler(buffers: any, len: number): MemoryAbilityMonitorStruct[] {
  let outArr: MemoryAbilityMonitorStruct[] = [];
  let value = new Float64Array(buffers.value);
  let startNS = new Float64Array(buffers.startNS);
  let dur = new Int32Array(buffers.dur);
  for (let i = 0; i < len; i++) {
    outArr.push({
      dur: dur[i],
      value: value[i],
      startNS: startNS[i],
    } as unknown as MemoryAbilityMonitorStruct);
  }
  return outArr;
}
function cpuAbilityMonitorArrayBufferHandler(buffers: any, len: number): CpuAbilityMonitorStruct[] {
  let outArr: CpuAbilityMonitorStruct[] = [];
  let value = new Float64Array(buffers.value);
  let startNS = new Float64Array(buffers.startNS);
  let dur = new Int32Array(buffers.dur);
  for (let i = 0; i < len; i++) {
    outArr.push({
      dur: dur[i],
      value: value[i],
      startNS: startNS[i],
    } as unknown as CpuAbilityMonitorStruct);
  }
  return outArr;
}
function arrayBufferHandler(buffers: any, len: number): DiskAbilityMonitorStruct[] {
  let outArr: DiskAbilityMonitorStruct[] = [];
  let value = new Float64Array(buffers.value);
  let startNS = new Float64Array(buffers.startNS);
  let dur = new Int32Array(buffers.dur);
  for (let i = 0; i < len; i++) {
    outArr.push({
      dur: dur[i],
      value: value[i],
      startNS: startNS[i],
    } as unknown as DiskAbilityMonitorStruct);
  }
  return outArr;
}
function networkArrayBufferHandler(buffers: any, len: number): NetworkAbilityMonitorStruct[] {
  let outArr: NetworkAbilityMonitorStruct[] = [];
  let value = new Float64Array(buffers.value);
  let startNS = new Float64Array(buffers.startNS);
  let dur = new Int32Array(buffers.dur);
  for (let i = 0; i < len; i++) {
    outArr.push({
      dur: dur[i],
      value: value[i],
      startNS: startNS[i],
    } as unknown as NetworkAbilityMonitorStruct);
  }
  return outArr;
}
