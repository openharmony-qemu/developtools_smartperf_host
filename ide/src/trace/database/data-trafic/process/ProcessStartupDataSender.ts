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

import { CHART_OFFSET_LEFT, MAX_COUNT, QueryEnum, TraficEnum } from '../utils/QueryEnum';
import { threadPool } from '../../SqlLite';
import { TraceRow } from '../../../component/trace/base/TraceRow';
import { AppStartupStruct } from '../../ui-worker/ProcedureWorkerAppStartup';

export function processStartupDataSender(pid: number, row: TraceRow<AppStartupStruct>): Promise<AppStartupStruct[]> {
  let trafic: number = TraficEnum.ProtoBuffer;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      startName: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      pid: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      tid: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      itid: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startTs: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      dur: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve) => {
    threadPool.submitProto(
      QueryEnum.ProcessStartupData,
      {
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        t: Date.now(),
        width: width,
        pid: pid,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
      },
      (res: unknown, len: number, transfer: boolean) => {
        resolve(arrayBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
      }
    );
  });
}

function arrayBufferHandler(buffers: unknown, len: number): AppStartupStruct[] {
  //@ts-ignore
  let startName = new Int32Array(buffers.startName); //@ts-ignore
  let pid = new Int32Array(buffers.pid); //@ts-ignore
  let tid = new Int32Array(buffers.tid); //@ts-ignore
  let itid = new Int32Array(buffers.itid); //@ts-ignore
  let startTs = new Float64Array(buffers.startTs); //@ts-ignore
  let dur = new Float64Array(buffers.dur);
  let outArr: AppStartupStruct[] = [];
  for (let i = 0; i < len; i++) {
    outArr.push({
      startName: startName[i],
      pid: pid[i],
      tid: tid[i],
      itid: itid[i],
      startTs: startTs[i],
      dur: dur[i],
    } as unknown as AppStartupStruct);
  }
  return outArr;
}

function protoBufferHandler(res: ArrayBuffer, len: number): AppStartupStruct[] {
  return [];
}
