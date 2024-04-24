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

import { TraficEnum } from '../utils/QueryEnum';

export const chartProcessTouchEventDispatchDataSql = (args: any): string => {
  return `
  select 
      c.ts-${args.recordStartNS} as startTs,
      c.dur,
      tid,
      P.pid,
      c.parent_id as parentId,
      c.id,
      c.depth,
      ((c.ts - ${args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)})) AS px,
      c.name as funName,
      A.name as threadName
  from thread A
  left join callstack C on A.id = C.callid
  left join process P on P.id = A.ipid
  where startTs not null and cookie not null
  and c.name ='H:touchEventDispatch'
  and tid = ${args.tid}
  and startTs + dur >= ${Math.floor(args.startNS)}
  and startTs <= ${Math.floor(args.endNS)}
    group by px;
  `;
};

export function processTouchEventDispatchDataReceiver(data: any, proc: Function): void {
  if (data.params.trafic === TraficEnum.Memory) {
    let sql = chartProcessTouchEventDispatchDataSql(data.params);
    let res = proc(sql);
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

function arrayBufferHandler(data: any, res: any[], transfer: boolean): void {
  let processTouchEventDispatch = new ProcessTouchEventDispatch(data, transfer, res.length);
  res.forEach((it, i) => {
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.processEventDispatchData);
    processTouchEventDispatch.tid[i] = it.tid;
    processTouchEventDispatch.dur[i] = it.dur;
    processTouchEventDispatch.startTs[i] = it.startTs;
    processTouchEventDispatch.pid[i] = it.pid;
    processTouchEventDispatch.id[i] = it.id;
    processTouchEventDispatch.depth[i] = it.depth;
  });
  postMessage(data, transfer, processTouchEventDispatch, res.length);
}
function postMessage(data: any, transfer: boolean, processTouchEventDispatch: ProcessTouchEventDispatch, len: number) {
  (self as unknown as Worker).postMessage(
    {
      transfer: transfer,
      id: data.id,
      action: data.action,
      results: transfer
        ? {
          tid: processTouchEventDispatch.tid.buffer,
          dur: processTouchEventDispatch.dur.buffer,
          startTs: processTouchEventDispatch.startTs.buffer,
          pid: processTouchEventDispatch.pid.buffer,
          id: processTouchEventDispatch.id.buffer,
          depth: processTouchEventDispatch.depth.buffer,
        }
        : {},
      len: len,
    },
    transfer
      ? [
        processTouchEventDispatch.tid.buffer,
        processTouchEventDispatch.dur.buffer,
        processTouchEventDispatch.startTs.buffer,
        processTouchEventDispatch.pid.buffer,
        processTouchEventDispatch.id.buffer,
        processTouchEventDispatch.depth.buffer,
      ]
      : []
  );
}
class ProcessTouchEventDispatch {
  tid: Int32Array;
  pid: Int32Array;
  startTs: Float64Array;
  dur: Float64Array;
  id: Int32Array;
  depth: Int32Array;
  constructor(data: any, transfer: boolean, len: number) {
    this.tid = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.tid);
    this.pid = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.pid);
    this.startTs = new Float64Array(transfer ? len : data.params.sharedArrayBuffers.startTs);
    this.dur = new Float64Array(transfer ? len : data.params.sharedArrayBuffers.dur);
    this.id = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.id);
    this.depth = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.depth);
  }
}
