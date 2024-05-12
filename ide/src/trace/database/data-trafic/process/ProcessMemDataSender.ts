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
import { ProcessMemStruct } from '../../ui-worker/ProcedureWorkerMem';

export function processMemDataSender(trackId: number, row: TraceRow<ProcessMemStruct>): Promise<ProcessMemStruct[]> {
  let trafic: number = TraficEnum.ProtoBuffer;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      track_id: new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT * MAX_COUNT),
      value: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startTime: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      ts: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve): void => {
    threadPool.submitProto(
      QueryEnum.ProcessMemData,
      {
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
        t: Date.now(),
        trackId: trackId,
      },
      (res: unknown, len: number, transfer: boolean): void => {
        resolve(arrayBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
      }
    );
  });
}

function arrayBufferHandler(buffers: unknown, len: number): ProcessMemStruct[] {
  let outArr: ProcessMemStruct[] = [];
  //@ts-ignore
  let track_id = new Uint8Array(buffers.track_id);
  //@ts-ignore
  let value = new Float64Array(buffers.value);
  //@ts-ignore
  let startTime = new Float64Array(buffers.startTime);
  //@ts-ignore
  let ts = new Float64Array(buffers.ts);
  for (let i = 0; i < len; i++) {
    outArr.push({
      track_id: track_id[i],
      value: value[i],
      startTime: startTime[i],
      ts: ts[i],
    } as unknown as ProcessMemStruct);
  }
  return outArr;
}
