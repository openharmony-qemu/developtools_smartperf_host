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
import { hiSysEventList } from './utils/AllMemoryCache';
import { filterDataByGroupLayer } from './utils/DataFilter';
import { Args } from './CommonArgs';

export const chartHiSysEventDataSql = (args: Args): string => {
  return `
      SELECT S.id,
             (S.ts - ${
               args.recordStartNS
             })                                                                                 AS startNs,
             pid,
             tid,
             uid,
             seq,
             CASE
                 WHEN S.level = 'MINOR' THEN 0
                 WHEN S.level = 'CRITICAL' THEN 1
                 END
                                                                                                                            AS depth,
             1                                                                                                              AS dur,
             ((S.ts - ${args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)})) + (CASE
                                                                                                                 WHEN S.level = 'MINOR'
                                                                                                                     THEN 0
                                                                                                                 WHEN S.level = 'CRITICAL'
                                                                                                                     THEN 1
                                                                                                                 END *
                                                                                                             ${
                                                                                                               args.width
                                                                                                             }) AS px
      FROM hisys_all_event AS S
      where S.id is not null
        and startNs + dur >= ${Math.floor(args.startNS)}
        and startNs <= ${Math.floor(args.endNS)}
      group by px`;
};

export const chartHiSysEventSql = (args: Args): string => {
  return `
     SELECT S.id,
             (S.ts - ${args.recordStartNS})                                                                                 AS startNs,
             pid,
             tid,
             uid,
             seq,
             CASE
                 WHEN S.level = 'MINOR' THEN 0
                 WHEN S.level = 'CRITICAL' THEN 1
                 END
                                                                                                                            AS depth,
             1                                                                                                              AS dur
      FROM hisys_all_event AS S
      where S.id is not null
      ORDER BY S.id`;
};

export function hiSysEventDataReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    // @ts-ignore
    if (!hiSysEventList.has(data.params.id)) {
      // @ts-ignore
      let sql = chartHiSysEventSql(data.params);
      // @ts-ignore
      hiSysEventList.set(data.params.id, proc(sql));
    }
    // @ts-ignore
    let list = hiSysEventList.get(data.params.id) || [];
    let res = filterDataByGroupLayer(
      list || [],
      'depth',
      'startNs',
      'dur',
      // @ts-ignore
      data.params.startNS,
      // @ts-ignore
      data.params.endNS,
      // @ts-ignore
      data.params.width
    );
    // @ts-ignore
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  } else {
    // @ts-ignore
    let sql = chartHiSysEventDataSql(data.params);
    let res = proc(sql);
    // @ts-ignore
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

function arrayBufferHandler(data: unknown, res: unknown[], transfer: boolean): void {
  // @ts-ignore
  let id = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.id);
  // @ts-ignore
  let ts = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.ts);
  // @ts-ignore
  let pid = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.pid);
  // @ts-ignore
  let tid = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.tid);
  // @ts-ignore
  let seq = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.seq);
  // @ts-ignore
  let uid = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.uid);
  // @ts-ignore
  let dur = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  // @ts-ignore
  let depth = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.depth);
  res.forEach((it, index) => {
    // @ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.hiSysEventData);
    // @ts-ignore
    uid[index] = it.uid;
    // @ts-ignore
    id[index] = it.id;
    // @ts-ignore
    ts[index] = it.startNs || it.ts;
    // @ts-ignore
    pid[index] = it.pid;
    // @ts-ignore
    tid[index] = it.tid;
    // @ts-ignore
    seq[index] = it.seq;
    // @ts-ignore
    dur[index] = it.dur;
    // @ts-ignore
    depth[index] = it.depth;
  });
  (self as unknown as Worker).postMessage(
    {
      // @ts-ignore
      id: data.id,
      // @ts-ignore
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
