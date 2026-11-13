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
import { JankStruct } from '../../ui-worker/ProcedureWorkerJank';

export function processExpectedDataSender(pid: number, row: TraceRow<JankStruct>): Promise<JankStruct[]> {
  let trafic: number = TraficEnum.Memory;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      name: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      pid: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      type: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      id: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      ts: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      dur: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      depth: new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve, reject) => {
    threadPool.submitProto(
      QueryEnum.processExpectedData,
      {
        pid: pid,
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        t: Date.now(),
        width: width,
        sharedArrayBuffers: row.sharedArrayBuffers,
        trafic: trafic,
      },
      (res: unknown, len: number, transfer: boolean): void => {
        resolve(arrayBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
      }
    );
  });
}

function arrayBufferHandler(buffers: unknown, len: number): JankStruct[] {
  let outArr: JankStruct[] = []; //@ts-ignore
  let name = new Int32Array(buffers.name); //@ts-ignore
  let pid = new Int32Array(buffers.pid); //@ts-ignore
  let type = new Int32Array(buffers.type); //@ts-ignore
  let id = new Int32Array(buffers.id); //@ts-ignore
  let ts = new Float64Array(buffers.ts); //@ts-ignore
  let dur = new Float64Array(buffers.dur); //@ts-ignore
  let depth = new Uint16Array(buffers.depth);
  for (let i = 0; i < len; i++) {
    outArr.push({
      name: name[i],
      pid: pid[i],
      type: type[i],
      id: id[i],
      ts: ts[i],
      dur: dur[i],
      depth: depth[i],
    } as unknown as JankStruct);
  }
  return outArr;
}
