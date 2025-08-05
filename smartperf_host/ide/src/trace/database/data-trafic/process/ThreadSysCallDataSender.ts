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
import { getThreadPool } from '../../SqlLite';
import { TraceRow } from '../../../component/trace/base/TraceRow';
import { SysCallMap } from '../../../component/trace/base/SysCallUtils';
import { Utils } from '../../../component/trace/base/Utils';
import { ThreadSysCallStruct } from '../../ui-worker/ProcedureWorkerThreadSysCall';

export function threadSysCallDataSender(
  itid: number,
  tid: number,
  pid: number,
  row: TraceRow<ThreadSysCallStruct>,
  traceId?: string
): Promise<ThreadSysCallStruct[] | boolean> {
  let trafic: number = TraficEnum.Memory;
  let width = row.clientWidth || row.parentRowEl!.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      startTs: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      dur: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      id: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      itid: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      ipid: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve): void => {
    getThreadPool(traceId).submitProto(
      QueryEnum.ThreadDataSysCall,
      {
        itid: itid,
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        recordStartNS: Utils.getInstance().getRecordStartNS(traceId),
        recordEndNS: Utils.getInstance().getRecordEndNS(traceId),
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
      },
      (res: unknown, len: number, transfer: boolean, isEmpty: boolean): void => {
        if (isEmpty) {
          resolve(true);
        } else {
          resolve(arrayBufferHandler(transfer ? res : row.sharedArrayBuffers, len, tid, pid));
        }
      }
    );
  });
}

function arrayBufferHandler(buffers: unknown, len: number, tid: number, pid: number): ThreadSysCallStruct[] {
  let outArr: ThreadSysCallStruct[] = []; //@ts-ignore
  let startTs = new Float64Array(buffers.startTs); //@ts-ignore
  let dur = new Float64Array(buffers.dur); //@ts-ignore
  let id = new Int32Array(buffers.id); //@ts-ignore
  let itid = new Int32Array(buffers.itid); //@ts-ignore
  for (let i = 0; i < len; i++) {
    //@ts-ignore
    outArr.push({
      startTs: startTs[i],
      dur: dur[i],
      id: id[i],
      itid: itid[i],
      name: SysCallMap.get(id[i]) || 'unknown event',
      tid: tid,
      pid: pid,
    } as ThreadSysCallStruct);
  }
  return outArr;
}
