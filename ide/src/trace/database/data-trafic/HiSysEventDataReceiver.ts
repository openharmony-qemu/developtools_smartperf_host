/*
 * Copyright (C) 2022 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { TraficEnum } from './utils/QueryEnum';

export const chartHiSysEventDataSql = (args: any): string => {
  return `
      SELECT S.id,
       (S.ts - ${args.recordStartNS}) AS startNs,
       pid,
       tid,
       uid,
       seq,
       CASE
          WHEN S.level = 'MINOR' THEN 0
          WHEN S.level = 'CRITICAL' THEN 1
      END
      AS depth,
      1 AS dur,
      ((S.ts - ${args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)})) + (CASE
      WHEN S.level = 'MINOR' THEN 0
      WHEN S.level = 'CRITICAL' THEN 1
      END * ${args.width}) AS px
      FROM hisys_all_event AS S
      where S.id is not null
      and    startNs + dur >= ${Math.floor(args.startNS)}
      and    startNs <= ${Math.floor(args.endNS)}
      group by px`;
};

export function hiSysEventDataReceiver(data: any, proc: Function) {
  let sql = chartHiSysEventDataSql(data.params);
  let res = proc(sql);
  arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
}

function arrayBufferHandler(data: any, res: any[], transfer: boolean) {
  let id = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.id);
  let ts = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.ts);
  let pid = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.pid);
  let tid = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.tid);
  let seq = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.seq);
  let uid = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.uid);
  let dur = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  let depth = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.depth);
  res.forEach((it, index) => {
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.hiSysEventData);
    uid[index] = it.uid;
    id[index] = it.id;
    ts[index] = it.ts;
    pid[index] = it.pid;
    tid[index] = it.tid;
    seq[index] = it.seq;
    dur[index] = it.dur;
    depth[index] = it.depth;
  });
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
      action: data.action,
      results: transfer
        ? {
            uid: uid.buffer,
            id: id.buffer,
            ts: ts.buffer,
            pid: pid.buffer,
            tid: tid.buffer,
            seq: seq.buffer,
            dur: dur.buffer,
            depth: depth.buffer,
          }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer ? [id.buffer, ts.buffer, pid.buffer, tid.buffer, uid.buffer, dur.buffer, seq.buffer, depth.buffer] : []
  );
}
