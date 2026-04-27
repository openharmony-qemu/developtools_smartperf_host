// Copyright (c) 2026 Huawei Device Co., Ltd.
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
import { IOStruct } from '../ui-worker/ProcedureWorkerIO';

export function ioSender(
  type: number,
  scale: number,
  row: TraceRow<IOStruct>,
  pid: number
): Promise<IOStruct[]> {
  let trafic: number = TraficEnum.TransferArrayBuffer;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      endNS: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startNS: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      size: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      dur: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      height: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      isWrite: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      isPhysical: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      itid: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve, reject): void => {
    const recordStartNS = window.recordStartNS || 0;
    const recordEndNS = window.recordEndNS || 0;
    threadPool.submitProto(
      QueryEnum.IOData,
      {
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        recordStartNS: recordStartNS,
        recordEndNS: recordEndNS,
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
        type: type,
        scale: scale,
        pid: pid,
      },
      (res: unknown, len: number, transfer: boolean): void => {
        resolve(arrayBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
      }
    );
  });
}

function arrayBufferHandler(buffers: unknown, len: number): IOStruct[] {
  let outArr: IOStruct[] = [];
  // @ts-ignore
  let endNS = new Float64Array(buffers.endNS);
  // @ts-ignore
  let startNS = new Float64Array(buffers.startNS);
  // @ts-ignore
  let size = new Float64Array(buffers.size);
  // @ts-ignore
  let dur = new Float64Array(buffers.dur);
  // @ts-ignore
  let height = new Int32Array(buffers.height);
  // @ts-ignore
  let isWrite = new Int32Array(buffers.isWrite || new ArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT));
  // @ts-ignore
  let isPhysical = new Int32Array(buffers.isPhysical || new ArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT));
  // @ts-ignore
  let itid = new Int32Array(buffers.itid || new ArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT));

  for (let i = 0; i < len; i++) {
    outArr.push({
      size: size[i],
      dur: dur[i],
      endNS: endNS[i],
      startNS: startNS[i],
      height: height[i],
      isWrite: isWrite[i] === 1,
      isPhysical: isPhysical[i] === 1,
      itid: itid[i],
    } as unknown as IOStruct);
  }
  return outArr;
}
