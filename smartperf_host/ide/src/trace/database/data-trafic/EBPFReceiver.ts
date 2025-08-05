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

import { Args } from './CommonArgs';
import { TraficEnum } from './utils/QueryEnum';

export const fileSystemDataGroupBy10MSProtoSql = (args: Args): string => {
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
export const fileSystemDataProtoSql = (args: Args): string => {
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
export const diskIoDataGroupBy10MSProtoSql = (args: Args): string => {
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
export const diskIoDataProtoSql = (args: Args): string => {
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
export const eBPFVmDataGroupBy10MSProtoSql = (args: unknown): string => {
  return `SELECT startNs, endNs, max( count ) AS size,
        ( startNS / ( ( ${
          // @ts-ignore
          args.endNS
        } - ${
    // @ts-ignore
    args.startNS
  } ) / ${
    // @ts-ignore
    args.width
  } ) ) AS px
        FROM
        (
        SELECT
            ( A.start_ts - ${
              // @ts-ignore
              args.recordStartNS
            } ) / 10000000 * 10000000 AS startNs,
            ( A.start_ts - ${
              // @ts-ignore
              args.recordStartNS
            } + 10000000 ) / 10000000 * 10000000 AS endNs,
            count( dur ) AS count
        FROM
        paged_memory_sample A
        where startNs + dur > ${
          // @ts-ignore
          args.startNS
        }
        and startNs > 0
        and startNs < ${
          // @ts-ignore
          args.endNS
        }
        and endNs > ${
          // @ts-ignore
          args.startNS
        }
        GROUP BY startNs
        order by startNs
        )
        GROUP BY px`;
};
export const eBPFVmDataProtoSql = (args: unknown): string => {
  return `select
        (A.start_ts - ${
          // @ts-ignore
          args.recordStartNS
        }) as startNs,
        (A.end_ts - ${
          // @ts-ignore
          args.recordStartNS
        }) as endNs,
        dur as dur
        from paged_memory_sample A
        where startNs + dur > ${
          // @ts-ignore
          args.startNS
        }
        and startNs > 0
        and startNs < ${
          // @ts-ignore
          args.endNS
        }
        and endNs > ${
          // @ts-ignore
          args.startNS
        }
        order by A.start_ts;`;
};

/**
 * @param data
 * @param proc
 */
export function fileSystemDataReceiver(data: unknown, proc: Function): void {
  let sql: string;
  // @ts-ignore
  if (data.params.scale > 40_000_000) {
    // @ts-ignore
    sql = fileSystemDataGroupBy10MSProtoSql(data.params);
  } else {
    // @ts-ignore
    sql = fileSystemDataProtoSql(data.params);
  }
  let res = proc(sql);
  // @ts-ignore
  arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
}
export function diskIoReceiver(data: unknown, proc: Function): void {
  let sql: string;
  // @ts-ignore
  if (data.params.scale > 40_000_000) {
    // @ts-ignore
    sql = diskIoDataGroupBy10MSProtoSql(data.params);
  } else {
    // @ts-ignore
    sql = diskIoDataProtoSql(data.params);
  }
  let res = proc(sql);
  // @ts-ignore
  arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
}
export function eBPFVmReceiver(data: unknown, proc: Function): void {
  let sql: string;
  // @ts-ignore
  if (data.params.scale > 40_000_000) {
    // @ts-ignore
    sql = eBPFVmDataGroupBy10MSProtoSql(data.params);
  } else {
    // @ts-ignore
    sql = eBPFVmDataProtoSql(data.params);
  }
  let res = proc(sql);
  // @ts-ignore
  arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
}

function arrayBufferHandler(data: unknown, res: unknown[], transfer: boolean): void {
  // @ts-ignore
  let startNS = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startNS);
  // @ts-ignore
  let endNS = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.endNS);
  // @ts-ignore
  let size = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.size);
  // @ts-ignore
  let dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  // @ts-ignore
  let height = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.height);
  // @ts-ignore
  let maxSize = Math.max(...res.map((it) => it.size));
  res.forEach((it, i) => {
    // @ts-ignore
    startNS[i] = it.startNs;
    // @ts-ignore
    endNS[i] = it.endNs;
    // @ts-ignore
    size[i] = it.size;
    // @ts-ignore
    dur[i] = it.dur;
    // @ts-ignore
    height[i] = Math.ceil((it.size / maxSize) * 36);
  });
  (self as unknown as Worker).postMessage(
    {
      // @ts-ignore
      id: data.id,
      // @ts-ignore
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
