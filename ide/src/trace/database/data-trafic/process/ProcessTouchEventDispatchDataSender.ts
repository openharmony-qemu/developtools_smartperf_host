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
import { FuncStruct } from '../../ui-worker/ProcedureWorkerFunc';

export function processTouchEventDispatchDataSender(tid: number, row: TraceRow<FuncStruct>): Promise<FuncStruct[]> {
  let trafic: number = TraficEnum.Memory;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      tid: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      pid: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startTs: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      dur: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      id: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      depth: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve) => {
    threadPool.submitProto(
      QueryEnum.processTouchEventDispatchData,
      {
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        t: Date.now(),
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
        tid: tid,
      },
      (res: unknown, len: number, transfer: boolean) => {
        resolve(arrayBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
      }
    );


  });
}

function arrayBufferHandler(buffers: unknown, len: number): FuncStruct[] {
  let outArr: FuncStruct[] = [];
  //@ts-ignore
  let tid = new Int32Array(buffers.tid);
  //@ts-ignore
  let pid = new Int32Array(buffers.pid);
  //@ts-ignore
  let startTs = new Float64Array(buffers.startTs);
  //@ts-ignore
  let dur = new Float64Array(buffers.dur);
  //@ts-ignore
  let id = new Int32Array(buffers.id);
  //@ts-ignore
  let depth = new Int32Array(buffers.depth);
  for (let i = 0; i < len; i++) {
    outArr.push({
      tid: tid[i],
      pid: pid[i],
      startTs: startTs[i],
      dur: dur[i],
      id: id[i],
      depth: depth[i],
    } as unknown as FuncStruct);
  }
  return outArr;
}
