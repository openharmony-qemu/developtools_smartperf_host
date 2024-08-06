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

export const chartProcessTouchEventDispatchDataSql = (args: unknown): string => {
  return `
  select 
      c.ts-${//@ts-ignore
        args.recordStartNS} as startTs,
      c.dur,
      tid,
      P.pid,
      c.parent_id as parentId,
      c.id,
      c.depth,
      ((c.ts - ${//@ts-ignore
        args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)})) AS px,
      c.name as funName,
      A.name as threadName
  from thread A
  left join process P on P.id = A.ipid
  left join callstack C on A.id = C.callid
  where startTs not null and cookie not null
  and (c.name = 'H:touchEventDispatch' OR c.name = 'H:TouchEventDispatch')  
  and tid = ${//@ts-ignore
    args.tid}
  and startTs + dur >= ${Math.floor(//@ts-ignore
    args.startNS)}
  and startTs <= ${Math.floor(//@ts-ignore
    args.endNS)}
    group by px;
  `;
};

export function processTouchEventDispatchDataReceiver(data: unknown, proc: Function): void {
  //@ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    //@ts-ignore
    let sql = chartProcessTouchEventDispatchDataSql(data.params);
    let res = proc(sql);
    //@ts-ignore
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

function arrayBufferHandler(data: unknown, res: unknown[], transfer: boolean): void {
  let processTouchEventDispatch = new ProcessTouchEventDispatch(data, transfer, res.length);
  res.forEach((it, i) => {
    //@ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.processEventDispatchData);
    //@ts-ignore
    processTouchEventDispatch.tid[i] = it.tid;
    //@ts-ignore
    processTouchEventDispatch.dur[i] = it.dur;
    //@ts-ignore
    processTouchEventDispatch.startTs[i] = it.startTs;
    //@ts-ignore
    processTouchEventDispatch.pid[i] = it.pid;
    //@ts-ignore
    processTouchEventDispatch.id[i] = it.id;
    //@ts-ignore
    processTouchEventDispatch.depth[i] = it.depth;
  });
  postMessage(data, transfer, processTouchEventDispatch, res.length);
}
function postMessage(data: unknown, transfer: boolean, processTouchEventDispatch: ProcessTouchEventDispatch, len: number): void {
  (self as unknown as Worker).postMessage(
    {
      transfer: transfer,
      //@ts-ignore
      id: data.id,
      
      //@ts-ignore
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
  constructor(data: unknown, transfer: boolean, len: number) {
    //@ts-ignore
    this.tid = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.tid);
    //@ts-ignore
    this.pid = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.pid);
    //@ts-ignore
    this.startTs = new Float64Array(transfer ? len : data.params.sharedArrayBuffers.startTs);
    //@ts-ignore
    this.dur = new Float64Array(transfer ? len : data.params.sharedArrayBuffers.dur);
    //@ts-ignore
    this.id = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.id);
    //@ts-ignore
    this.depth = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.depth);
  }
}
