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
  switch (data.params.trafic) {
    case TraficEnum.SharedArrayBuffer:
      arrayBufferHandler(data, res, false);
      break;
    case TraficEnum.ProtoBuffer:
      arrayBufferHandler(data, res, true);
      break;
    case TraficEnum.TransferArrayBuffer:
      arrayBufferHandler(data, res, true);
      break;
  }
}

function arrayBufferHandler(data: any, res: any[], transfer: boolean): void {
  let tid = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.tid);
  let pid = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.pid);
  let is_main_thread = new Int8Array(transfer ? res.length : data.params.sharedArrayBuffers.is_main_thread);
  let track_id = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.track_id);
  let startTs = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startTs);
  let dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  let parent_id = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.parent_id);
  let id = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.id);
  let cookie = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.cookie);
  let depth = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.depth);
  let argsetid = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.argsetid);
  res.forEach((it, i) => {
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.processInputEventData);
    tid[i] = it.tid;
    dur[i] = it.dur;
    is_main_thread[i] = it.isMainThread;
    track_id[i] = it.trackId;
    startTs[i] = it.startTs;
    pid[i] = it.pid;
    parent_id[i] = it.parentId;
    id[i] = it.id;
    cookie[i] = it.cookie;
    depth[i] = it.depth;
    argsetid[i] = it.argsetid;
  });
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
      action: data.action,
      results: transfer
        ? {
            tid: tid.buffer,
            dur: dur.buffer,
            is_main_thread: is_main_thread.buffer,
            track_id: track_id.buffer,
            startTs: startTs.buffer,
            pid: pid.buffer,
            parent_id: parent_id.buffer,
            id: id.buffer,
            cookie: cookie.buffer,
            depth: depth.buffer,
            argsetid: argsetid.buffer,
          }
        : {},
      len: res.length,
    },
    transfer
      ? [
          tid.buffer,
          dur.buffer,
          is_main_thread.buffer,
          track_id.buffer,
          startTs.buffer,
          pid.buffer,
          parent_id.buffer,
          id.buffer,
          cookie.buffer,
          depth.buffer,
          argsetid.buffer,
        ]
      : []
  );
}
