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

import { CHART_OFFSET_LEFT, MAX_COUNT, QueryEnum, threadStateToString, TraficEnum } from '../utils/QueryEnum';
import { threadPool } from '../../SqlLite';
import { TraceRow } from '../../../component/trace/base/TraceRow';
import { ThreadStruct } from '../../ui-worker/ProcedureWorkerThread';

export function threadDataSender(tid: number, pid: number, row: TraceRow<ThreadStruct>): Promise<ThreadStruct[]|boolean> {
  let trafic: number = TraficEnum.Memory;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if ((trafic === TraficEnum.SharedArrayBuffer) && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      startTime: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      dur: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      cpu: new SharedArrayBuffer(Int8Array.BYTES_PER_ELEMENT * MAX_COUNT),
      id: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      tid: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      state: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      pid: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      argSetID: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve): void => {
    threadPool.submitProto(
      QueryEnum.ThreadData,
      {
        pid: pid,
        tid: tid,
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
      },
      (res: any, len: number, transfer: boolean,isEmpty:boolean): void => {
        if (isEmpty) {
          resolve(true);
        }else{
          resolve(arrayBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
        }
      }
    );
  });
}

function arrayBufferHandler(buffers: any, len: number): ThreadStruct[] {
  let outArr: ThreadStruct[] = [];
  let startTime = new Float64Array(buffers.startTime);
  let dur = new Float64Array(buffers.dur);
  let cpu = new Int8Array(buffers.cpu);
  let id = new Int32Array(buffers.id);
  let tid = new Int32Array(buffers.tid);
  let state = new Int32Array(buffers.state);
  let pid = new Int32Array(buffers.pid);
  let argSetID = new Int32Array(buffers.argSetID);
  for (let i = 0; i < len; i++) {
    outArr.push({
      startTime: startTime[i],
      dur: dur[i],
      cpu: cpu[i],
      id: id[i],
      tid: tid[i],
      state: threadStateToString(state[i]),
      pid: pid[i],
      argSetID: argSetID[i],
    } as ThreadStruct);
  }
  return outArr;
}
