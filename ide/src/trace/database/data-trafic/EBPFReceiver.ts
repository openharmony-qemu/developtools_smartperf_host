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

import { TraficEnum } from './utils/QueryEnum';

let maxSize: number = 0;
export const fileSystemDataGroupBy10MSProtoSql = (args: any): string => {
  return `SELECT
        startNs, endNs, max( count ) AS size,
        ( startNS / ( ( ${args.endNS} - ${args.startNS} ) / ${args.width} ) ) AS px
        FROM
        (
        SELECT
            ( A.start_ts - ${args.recordStartNS} ) / 10000000 * 10000000 AS startNs,
            ( A.start_ts - ${args.recordStartNS} + 10000000 ) / 10000000 * 10000000 AS endNs,
            count( dur ) AS count
        FROM
            file_system_sample A
        WHERE
            type = ${args.type}
            and startNs > ${Math.floor(args.startNS)}
            AND startNs + dur >= ${Math.floor(args.startNS)}
            AND startNs < ${Math.floor(args.endNS)}
        GROUP BY
        startNs
        )
        GROUP BY px
            `;
};
export const fileSystemDataProtoSql = (args: any): string => {
  return `select
          (A.start_ts - ${args.recordStartNS}) as startNs,
          (A.end_ts - ${args.recordStartNS}) as endNs,
          dur
          from file_system_sample A
          where type = ${args.type}
          and startNs > 0
          and startNs + dur > ${args.startNS}
          and startNs < ${args.endNS}
    `;
};
export const diskIoDataGroupBy10MSProtoSql = (args: any): string => {
  return `SELECT
        startNs,
        endNs,
        max( dur ) AS size,
        ( startNS / ( ( ${args.endNS} - ${args.startNS} ) / ${args.width} ) ) AS px
        FROM
        (
        SELECT
            ( A.start_ts - ${args.recordStartNS} ) / 10000000 * 10000000 AS startNs,
            ( A.start_ts - ${args.recordStartNS} + 10000000 ) / 10000000 * 10000000 AS endNs,
            max( latency_dur ) AS dur
        FROM bio_latency_sample A
            where type in (${args.typeArr.join(',')}) and startNs > 0
            ${args.all ? '' : 'and ipid = ' + args.ipid}
            and startNs + latency_dur > ${args.startNS}
            and startNs < ${args.endNS}
            GROUP BY startNs
            order by startNs
        )
        GROUP BY px`;
};
export const diskIoDataProtoSql = (args: any): string => {
  return `select
        (A.start_ts - ${args.recordStartNS}) as startNs,
        (A.start_ts - ${args.recordStartNS} + A.latency_dur) as endNs,
        latency_dur as dur
        from bio_latency_sample A
        where type in (${args.typeArr.join(',')}) and startNs > 0
        ${args.all ? '' : 'and ipid = ' + args.ipid}
        and startNs + dur > ${args.startNS}
        and startNs < ${args.endNS}
        order by A.start_ts;`;
};
export const eBPFVmDataGroupBy10MSProtoSql = (args: any): string => {
  return `SELECT startNs, endNs, max( count ) AS size,
        ( startNS / ( ( ${args.endNS} - ${args.startNS} ) / ${args.width} ) ) AS px
        FROM
        (
        SELECT
            ( A.start_ts - ${args.recordStartNS} ) / 10000000 * 10000000 AS startNs,
            ( A.start_ts - ${args.recordStartNS} + 10000000 ) / 10000000 * 10000000 AS endNs,
            count( dur ) AS count
        FROM
        paged_memory_sample A
        where startNs + dur > ${args.startNS}
        and startNs > 0
        and startNs < ${args.endNS}
        and endNs > ${args.startNS}
        GROUP BY startNs
        order by startNs
        )
        GROUP BY px`;
};
export const eBPFVmDataProtoSql = (args: any): string => {
  return `select
        (A.start_ts - ${args.recordStartNS}) as startNs,
        (A.end_ts - ${args.recordStartNS}) as endNs,
        dur as dur
        from paged_memory_sample A
        where startNs + dur > ${args.startNS}
        and startNs > 0
        and startNs < ${args.endNS}
        and endNs > ${args.startNS}
        order by A.start_ts;`;
};

let eBPFMap = new Map<any, number>();
/**
 * @param data
 * @param proc
 */
export function fileSystemDataReceiver(data: any, proc: Function): void {
  let sql: string;
  if (data.params.scale > 40_000_000) {
    sql = fileSystemDataGroupBy10MSProtoSql(data.params);
  } else {
    sql = fileSystemDataProtoSql(data.params);
  }
  let res = proc(sql);
  arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
}
export function diskIoReceiver(data: any, proc: Function): void {
  let sql: string;
  if (data.params.scale > 40_000_000) {
    sql = diskIoDataGroupBy10MSProtoSql(data.params);
  } else {
    sql = diskIoDataProtoSql(data.params);
  }
  let res = proc(sql);
  arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
}
export function eBPFVmReceiver(data: any, proc: Function): void {
  let sql: string;
  if (data.params.scale > 40_000_000) {
    sql = eBPFVmDataGroupBy10MSProtoSql(data.params);
  } else {
    sql = eBPFVmDataProtoSql(data.params);
  }
  let res = proc(sql);
  arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
}
function arrayBufferHandler(data: any, res: any[], transfer: boolean): void {
  let startNS = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startNS);
  let endNS = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.endNS);
  let size = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.size);
  let dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  let height = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.height);
  let type: any;

  if (data.params.type) {
    type = data.params.type;
  } else if (data.params.typeArr) {
    type = data.params.typeArr;
  } else {
    type = -1;
  }
  if (!eBPFMap!.get(type)) {
    maxSize = Math.max(
      ...res.map((it) => {
        return it.size;
      })
    );
    eBPFMap.set(type, maxSize);
  }
  res.forEach((it, i) => {
    startNS[i] = it.startNs;
    endNS[i] = it.endNs;
    size[i] = it.size;
    dur[i] = it.dur;
    height[i] = Math.ceil((it.size / eBPFMap!.get(type)!) * 36);
  });
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
      action: data.action,
      results: transfer
        ? {
            startNS: startNS.buffer,
            endNS: endNS.buffer,
            size: size.buffer,
            height: height.buffer,
            dur: dur.buffer,
          }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer ? [startNS.buffer, endNS.buffer, size.buffer, height.buffer, dur.buffer] : []
  );
}
