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
import { FuncStruct } from '../../ui-worker/ProcedureWorkerFunc';
import { Utils } from '../../../component/trace/base/Utils';

export function funcDataSender(tid: number, ipid: number, row: TraceRow<FuncStruct>, traceId?: string):
  Promise<FuncStruct[] | boolean>
{
  let trafic: number = TraficEnum.Memory;
  let width = row.clientWidth || (row.parentRowEl && (row.parentRowEl.clientWidth - CHART_OFFSET_LEFT));
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      startTs: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      dur: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      argsetid: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      depth: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      id: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      nofinish: new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve, reject): void => {
    getThreadPool(traceId).submitProto(
      QueryEnum.FuncData,
      {
        tid: tid,
        ipid: ipid,
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        recordStartNS: Utils.getInstance().getRecordStartNS(traceId),
        recordEndNS: Utils.getInstance().getRecordEndNS(traceId),
        width: width,
        expand: row.funcExpand,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
      },
      (res: unknown, len: number, transfer: boolean, isEmpty: boolean) => {
        if (isEmpty) {
          resolve(true);
        } else {
          resolve(arrayBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
        }
      }
    );
  });
}

function arrayBufferHandler(buffers: unknown, len: number): FuncStruct[] {
  let outArr: unknown[] = []; //@ts-ignore
  let startTs = new Float64Array(buffers.startTs); //@ts-ignore
  let dur = new Float64Array(buffers.dur); //@ts-ignore
  let argsetid = new Int32Array(buffers.argsetid); //@ts-ignore
  let depth = new Int32Array(buffers.depth); //@ts-ignore
  let id = new Int32Array(buffers.id); //@ts-ignore
  let nofinish = new Uint8Array(buffers.nofinish);
  for (let i = 0; i < len; i++) {
    outArr.push({
      startTs: startTs[i],
      dur: dur[i],
      argsetid: argsetid[i],
      depth: depth[i],
      id: id[i],
      nofinish: nofinish[i] === 1,
    });
  } //@ts-ignore
  return outArr;
}
