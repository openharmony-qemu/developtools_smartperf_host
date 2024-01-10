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

export const chartProcessDeliverInputEventDataSql = (args: any): string => {
  return `
  select 
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
  left join callstack C on A.id = C.callid
  left join process P on P.id = A.ipid
  where startTs not null and cookie not null
  and c.name ='deliverInputEvent'
  and tid = ${args.tid}
  and startTs + dur >= ${Math.floor(args.startNS)}
  and startTs <= ${Math.floor(args.endNS)}
    group by px;
  `;
};

export function processDeliverInputEventDataReceiver(data: any, proc: Function): void {
  let sql = chartProcessDeliverInputEventDataSql(data.params);
  let res = proc(sql);
  arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
}

function arrayBufferHandler(data: any, res: any[], transfer: boolean): void {
  let processDeliverInputEvent = new ProcessDeliverInputEvent(data, transfer, res.length);
  res.forEach((it, i) => {
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.processInputEventData);
    processDeliverInputEvent.tid[i] = it.tid;
    processDeliverInputEvent.dur[i] = it.dur;
    processDeliverInputEvent.is_main_thread[i] = it.isMainThread;
    processDeliverInputEvent.track_id[i] = it.trackId;
    processDeliverInputEvent.startTs[i] = it.startTs;
    processDeliverInputEvent.pid[i] = it.pid;
    processDeliverInputEvent.parent_id[i] = it.parentId;
    processDeliverInputEvent.id[i] = it.id;
    processDeliverInputEvent.cookie[i] = it.cookie;
    processDeliverInputEvent.depth[i] = it.depth;
    processDeliverInputEvent.argsetid[i] = it.argsetid;
  });
  postMessage(data, transfer, processDeliverInputEvent, res.length);
}
function postMessage(data: any, transfer: boolean, processDeliverInputEvent: ProcessDeliverInputEvent, len: number) {
  (self as unknown as Worker).postMessage(
    {
      transfer: transfer,
      id: data.id,
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
  constructor(data: any, transfer: boolean, len: number) {
    this.tid = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.tid);
    this.pid = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.pid);
    this.is_main_thread = new Int8Array(transfer ? len : data.params.sharedArrayBuffers.is_main_thread);
    this.track_id = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.track_id);
    this.startTs = new Float64Array(transfer ? len : data.params.sharedArrayBuffers.startTs);
    this.dur = new Float64Array(transfer ? len : data.params.sharedArrayBuffers.dur);
    this.parent_id = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.parent_id);
    this.id = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.id);
    this.cookie = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.cookie);
    this.depth = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.depth);
    this.argsetid = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.argsetid);
  }
}
