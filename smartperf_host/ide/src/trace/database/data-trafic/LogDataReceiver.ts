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
import { hiLogList } from './utils/AllMemoryCache';
import { filterDataByGroupLayer } from './utils/DataFilter';
import { Args } from './CommonArgs';

export const chartLogDataSql = (args: Args): string => {
  return `SELECT l.seq                   AS id,
                 l.pid,
                 l.tid,
                 CASE
                     WHEN l.ts < ${args.oneDayTime} THEN 0
                     ELSE (l.ts - ${args.recordStartNS})
                     END                 AS startTs,
                 CASE
                     WHEN l.level = 'D' THEN 0
                     WHEN l.level = 'I' THEN 1
                     WHEN l.level = 'W' THEN 2
                     WHEN l.level = 'E' THEN 3
                     WHEN l.level = 'F' THEN 4
                     END                 AS depth,
                 1                       AS dur,
                 ((l.ts - ${args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)})) +
                 CASE
                     WHEN l.level = 'D' THEN 0
                     WHEN l.level = 'I' THEN 1
                     WHEN l.level = 'W' THEN 2
                     WHEN l.level = 'E' THEN 3
                     WHEN l.level = 'F' THEN 4
                     END * ${args.width} AS px
          FROM (SELECT DISTINCT seq FROM log) AS inner_log
                   JOIN log AS l ON l.seq = inner_log.seq
          WHERE (CASE
                     WHEN l.ts < ${args.oneDayTime} THEN 0
                     ELSE (l.ts - ${args.recordStartNS})
              END) + 1 >= ${Math.floor(args.startNS)}
            AND (CASE
                     WHEN l.ts < ${args.oneDayTime} THEN 0
                     ELSE (l.ts - ${args.recordStartNS})
              END) <= ${Math.floor(args.endNS)}
          GROUP BY px`;
};

export const chartLogDataMemorySql = (args: Args): string => {
  return `SELECT l.seq                   AS id,
                 l.pid,
                 l.tid,
                 CASE
                     WHEN l.ts < ${args.oneDayTime} THEN 0
                     ELSE (l.ts - ${args.recordStartNS})
                     END                 AS startTs,
                 CASE
                     WHEN l.level = 'D' THEN 0
                     WHEN l.level = 'I' THEN 1
                     WHEN l.level = 'W' THEN 2
                     WHEN l.level = 'E' THEN 3
                     WHEN l.level = 'F' THEN 4
                     END                 AS depth,
                 1                       AS dur
          FROM (SELECT DISTINCT seq FROM log) AS inner_log
                   JOIN log AS l ON l.seq = inner_log.seq
          ORDER BY l.seq`;
};

export function logDataReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    // @ts-ignore
    if (!hiLogList.has(data.params.id)) {
      // @ts-ignore
      let sql = chartLogDataMemorySql(data.params);
      // @ts-ignore
      hiLogList.set(data.params.id, proc(sql));
    }
    // @ts-ignore
    let list = hiLogList.get(data.params.id) || [];
    let res = filterDataByGroupLayer(
      list || [],
      'depth',
      'startTs',
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
    let sql = chartLogDataSql(data.params);
    let res = proc(sql);
    // @ts-ignore
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

function arrayBufferHandler(data: unknown, res: unknown[], transfer: boolean): void {
  // @ts-ignore
  let id = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.id);
  // @ts-ignore
  let startTs = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startTs);
  // @ts-ignore
  let pid = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.pid);
  // @ts-ignore
  let tid = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.tid);
  // @ts-ignore
  let dur = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  // @ts-ignore
  let depth = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.depth);
  res.forEach((it, index) => {
    // @ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.logData);
    // @ts-ignore
    id[index] = it.id;
    // @ts-ignore
    startTs[index] = it.startTs;
    // @ts-ignore
    pid[index] = it.pid;
    // @ts-ignore
    tid[index] = it.tid;
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
            id: id.buffer,
            startTs: startTs.buffer,
            pid: pid.buffer,
            tid: tid.buffer,
            dur: dur.buffer,
            depth: depth.buffer,
          }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer ? [id.buffer, startTs.buffer, pid.buffer, tid.buffer, dur.buffer, depth.buffer] : []
  );
}
