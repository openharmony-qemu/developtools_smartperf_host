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

import { CpuStruct } from '../ui-worker/cpu/ProcedureWorkerCPU';
import { CHART_OFFSET_LEFT, MAX_COUNT, QueryEnum, TraficEnum } from './utils/QueryEnum';
import { getThreadPool } from '../SqlLite';
import { TraceRow } from '../../component/trace/base/TraceRow';
import { Utils } from '../../component/trace/base/Utils';

export function cpuDataSender(cpu: number, row: TraceRow<CpuStruct>, traceId?: string): Promise<CpuStruct[]> {
  let trafic: number = TraficEnum.Memory;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      processId: new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT * MAX_COUNT),
      id: new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT * MAX_COUNT),
      tid: new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT * MAX_COUNT),
      cpu: new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT * MAX_COUNT),
      dur: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startTime: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      argSetId: new SharedArrayBuffer(Int8Array.BYTES_PER_ELEMENT * MAX_COUNT),
      nofinish: new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve): void => {
    getThreadPool(traceId).submitProto(
      QueryEnum.CpuData,
      {
        cpu: cpu,
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        recordStartNS: Utils.getInstance().getRecordStartNS(traceId),
        recordEndNS: Utils.getInstance().getRecordEndNS(traceId),
        width: width,
        t: new Date().getTime(),
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
      },
      (res: unknown, len: number, transfer: boolean): void => {
        resolve(arrayBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
      }
    );
  });
}

export function searchCpuDataSender(pidArr: Array<number>, tidArr: Array<number>,
  traceId?: string | null): Promise<unknown[]> {
  return new Promise((resolve): void => {
    getThreadPool(traceId).submitProto(
      QueryEnum.SearchCpuData,
      {
        tidArr: tidArr,
        pidArr: pidArr,
        trafic: TraficEnum.SharedArrayBuffer,
      },
      (res: unknown, len: number, transfer: boolean): void => {
        resolve(searchArrayBufferHandler(res, len));
      }
    );
  });
}

function arrayBufferHandler(res: unknown, len: number): CpuStruct[] {
  let outArr: CpuStruct[] = [];
  // @ts-ignore
  let startTime = new Float64Array(res.startTime);
  // @ts-ignore
  let dur = new Float64Array(res.dur);
  // @ts-ignore
  let id = new Uint16Array(res.id);
  // @ts-ignore
  let processId = new Uint16Array(res.processId);
  // @ts-ignore
  let tid = new Uint16Array(res.tid);
  // @ts-ignore
  let cpu = new Uint8Array(res.cpu);
  // @ts-ignore
  let argSetID = new Int32Array(res.argSetID);
  // @ts-ignore
  let nofinish = new Uint8Array(res.nofinish);
  for (let i = 0; i < len; i++) {
    outArr.push({
      processId: processId[i],
      cpu: cpu[i],
      tid: tid[i],
      id: id[i],
      dur: dur[i],
      startTime: startTime[i],
      argSetID: argSetID[i],
      nofinish: nofinish[i] === 1 ? true : false,
    } as CpuStruct);
  }
  return outArr;
}

function searchArrayBufferHandler(res: unknown, len: number): CpuStruct[] {
  let outArr: CpuStruct[] = [];
  // @ts-ignore
  let startTime = new Float64Array(res.startTime);
  // @ts-ignore
  let dur = new Float64Array(res.dur);
  // @ts-ignore
  let id = new Uint16Array(res.id);
  // @ts-ignore
  let processId = new Uint16Array(res.processId);
  // @ts-ignore
  let tid = new Uint16Array(res.tid);
  // @ts-ignore
  let cpu = new Uint8Array(res.cpu);
  // @ts-ignore
  let argSetID = new Int32Array(res.argSetID);
  // @ts-ignore
  let nofinish = new Uint8Array(res.nofinish);
  for (let i = 0; i < len; i++) {
    outArr.push({
      processId: processId[i],
      cpu: cpu[i],
      tid: tid[i],
      id: id[i],
      dur: dur[i],
      startTime: startTime[i],
      type: 'cpu',
      argSetID: -1,
      nofinish: nofinish[i] === 1 ? true : false,
    } as CpuStruct);
  }
  return outArr;
}
