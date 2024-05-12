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

import { Args } from '../CommonArgs';
import { TraficEnum } from '../utils/QueryEnum';

export const chartProcessDeliverInputEventDataSql = (args: Args): string => {
  return `select  
      c.ts-${args.recordStartNS} as startTs,
      c.dur,
      c.argsetid,
      tid,
      P.pid,
      is_main_thread as isMainThread,
      c.callid as trackId,
      c.parent_id as parentId,
      c.id,
      c.cookie,
      c.depth,
      ((c.ts - ${args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)})) AS px,
      c.name as funName,
      A.name as threadName
  from thread A
  left join process P on P.id = A.ipid
  left join callstack C on A.id = C.callid
  where startTs not null and cookie not null
  and c.name ='deliverInputEvent'
  and tid = ${args.tid}
  and startTs + dur >= ${Math.floor(args.startNS)}
  and startTs <= ${Math.floor(args.endNS)}
    group by px;
  `;
};

export function processDeliverInputEventDataReceiver(data: unknown, proc: Function): void {
  //@ts-ignore
  let sql = chartProcessDeliverInputEventDataSql(data.params);
  let res = proc(sql); //@ts-ignore
  arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
}

function arrayBufferHandler(data: unknown, res: unknown[], transfer: boolean): void {
  let processDeliverInputEvent = new ProcessDeliverInputEvent(data, transfer, res.length);
  res.forEach((it, i) => {
    //@ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.processInputEventData); //@ts-ignore
    processDeliverInputEvent.tid[i] = it.tid; //@ts-ignore
    processDeliverInputEvent.dur[i] = it.dur; //@ts-ignore
    processDeliverInputEvent.is_main_thread[i] = it.isMainThread; //@ts-ignore
    processDeliverInputEvent.track_id[i] = it.trackId; //@ts-ignore
    processDeliverInputEvent.startTs[i] = it.startTs; //@ts-ignore
    processDeliverInputEvent.pid[i] = it.pid; //@ts-ignore
    processDeliverInputEvent.parent_id[i] = it.parentId; //@ts-ignore
    processDeliverInputEvent.id[i] = it.id; //@ts-ignore
    processDeliverInputEvent.cookie[i] = it.cookie; //@ts-ignore
    processDeliverInputEvent.depth[i] = it.depth; //@ts-ignore
    processDeliverInputEvent.argsetid[i] = it.argsetid;
  });
  postMessage(data, transfer, processDeliverInputEvent, res.length);
}

function postMessage(
  data: unknown,
  transfer: boolean,
  processDeliverInputEvent: ProcessDeliverInputEvent,
  len: number
): void {
  (self as unknown as Worker).postMessage(
    {
      transfer: transfer, //@ts-ignore
      id: data.id, //@ts-ignore
      action: data.action,
      results: transfer
        ? {
            tid: processDeliverInputEvent.tid.buffer,
            dur: processDeliverInputEvent.dur.buffer,
            is_main_thread: processDeliverInputEvent.is_main_thread.buffer,
            track_id: processDeliverInputEvent.track_id.buffer,
            startTs: processDeliverInputEvent.startTs.buffer,
            pid: processDeliverInputEvent.pid.buffer,
            parent_id: processDeliverInputEvent.parent_id.buffer,
            id: processDeliverInputEvent.id.buffer,
            cookie: processDeliverInputEvent.cookie.buffer,
            depth: processDeliverInputEvent.depth.buffer,
            argsetid: processDeliverInputEvent.argsetid.buffer,
          }
        : {},
      len: len,
    },
    transfer
      ? [
          processDeliverInputEvent.tid.buffer,
          processDeliverInputEvent.dur.buffer,
          processDeliverInputEvent.is_main_thread.buffer,
          processDeliverInputEvent.track_id.buffer,
          processDeliverInputEvent.startTs.buffer,
          processDeliverInputEvent.pid.buffer,
          processDeliverInputEvent.parent_id.buffer,
          processDeliverInputEvent.id.buffer,
          processDeliverInputEvent.cookie.buffer,
          processDeliverInputEvent.depth.buffer,
          processDeliverInputEvent.argsetid.buffer,
        ]
      : []
  );
}
class ProcessDeliverInputEvent {
  tid: Int32Array;
  pid: Int32Array;
  is_main_thread: Int8Array;
  track_id: Int32Array;
  startTs: Float64Array;
  dur: Float64Array;
  parent_id: Int32Array;
  id: Int32Array;
  cookie: Int32Array;
  depth: Int32Array;
  argsetid: Int32Array;
  constructor(data: unknown, transfer: boolean, len: number) {
    //@ts-ignore
    this.tid = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.tid); //@ts-ignore
    this.pid = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.pid); //@ts-ignore
    this.is_main_thread = new Int8Array(transfer ? len : data.params.sharedArrayBuffers.is_main_thread); //@ts-ignore
    this.track_id = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.track_id); //@ts-ignore
    this.startTs = new Float64Array(transfer ? len : data.params.sharedArrayBuffers.startTs); //@ts-ignore
    this.dur = new Float64Array(transfer ? len : data.params.sharedArrayBuffers.dur); //@ts-ignore
    this.parent_id = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.parent_id); //@ts-ignore
    this.id = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.id); //@ts-ignore
    this.cookie = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.cookie); //@ts-ignore
    this.depth = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.depth); //@ts-ignore
    this.argsetid = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.argsetid);
  }
}
