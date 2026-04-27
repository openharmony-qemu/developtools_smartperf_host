// Copyright (c) 2026 Huawei Device Co., Ltd.
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

export const ioDataGroupBy10MSProtoSql = (args: Args): string => {
  // 根据type确定is_write和is_block的值
  const isWrite = args.type === 1 || args.type === 3 ? 1 : 0;
  const isBlock = args.type === 2 || args.type === 3 ? 1 : 0;
  const pidFilter = args.pid === -1 ? '' : `AND P.pid = ${args.pid}`;

  return `SELECT
        min( startNs ) AS startNs,
        max( endNs ) AS endNs,
        sum( size ) AS size,
        ( startNS / ( ( ${args.endNS} - ${args.startNS} ) / ${args.width} ) ) AS px
        FROM
        (
        SELECT
            ( A.start_time - ${args.recordStartNS} ) / 10000000 * 10000000 AS startNs,
            ( A.start_time - ${args.recordStartNS} + 10000000 ) / 10000000 * 10000000 AS endNs,
            sum( A.request_bytes ) AS size,
            A.duration as duration,
            0 AS itid
        FROM
            filesystem_io A
        JOIN
            process P ON A.ipid = P.ipid
        WHERE
            A.is_write = ${isWrite}
            AND A.is_block = ${isBlock}
            ${pidFilter}
            and (A.start_time - ${args.recordStartNS}) > ${Math.floor(args.startNS)}
            AND (A.start_time - ${args.recordStartNS}) + A.duration >= ${Math.floor(args.startNS)}
            AND (A.start_time - ${args.recordStartNS}) < ${Math.floor(args.endNS)}
        GROUP BY startNs
        )
        GROUP BY px
            `;
};

export const ioDataProtoSql = (args: Args): string => {
  // 根据type确定is_write和is_block的值
  const isWrite = args.type === 1 || args.type === 3 ? 1 : 0;
  const isBlock = args.type === 2 || args.type === 3 ? 1 : 0;
  const pidFilter = args.pid === -1 ? '' : `AND P.pid = ${args.pid}`;
  
  return `select
          (A.start_time - ${args.recordStartNS}) as startNs,
          (A.end_time - ${args.recordStartNS}) as endNs,
          A.duration as dur,
          A.request_bytes as size,
          A.is_write as isWrite,
          A.is_block as isPhysical,
          COALESCE(A.itid, 0) as itid
          from filesystem_io A
          JOIN
              process P ON A.ipid = P.ipid
          where A.is_write = ${isWrite}
          AND A.is_block = ${isBlock}
          ${pidFilter}
          and (A.start_time - ${args.recordStartNS}) > 0
          and (A.start_time - ${args.recordStartNS}) + A.duration > ${args.startNS}
          and (A.start_time - ${args.recordStartNS}) < ${args.endNS}
    `;
};

export function ioDataReceiver(data: unknown, proc: Function): void {
  let sql: string;
  // @ts-ignore
  if (data.params.scale > 40_000_000) {
    // @ts-ignore
    sql = ioDataGroupBy10MSProtoSql(data.params);
  } else {
    // @ts-ignore
    sql = ioDataProtoSql(data.params);
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
  let isWrite = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.isWrite);
  // @ts-ignore
  let isPhysical = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.isPhysical);
  // @ts-ignore
  let itid = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.itid);
  // @ts-ignore
  let maxSize = res.length > 0 ? Math.max(...res.map((it) => it.size)) : 0;
  res.forEach((it, i) => {
    // @ts-ignore
    startNS[i] = it.startNs;
    // @ts-ignore
    endNS[i] = it.endNs;
    // @ts-ignore
    size[i] = it.size;
    // @ts-ignore
    const durVal = it.dur != null ? it.dur : it.endNs - it.startNs;
    dur[i] = durVal;
    // @ts-ignore
    height[i] = maxSize > 0 ? Math.ceil((it.size / maxSize) * 36) : 36;
    // @ts-ignore
    isWrite[i] = it.isWrite != null ? it.isWrite : 0;
    // @ts-ignore
    isPhysical[i] = it.isPhysical != null ? it.isPhysical : 0;
    // @ts-ignore
    itid[i] = it.itid != null ? it.itid : 0;
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
            isWrite: isWrite.buffer,
            isPhysical: isPhysical.buffer,
            itid: itid.buffer,
          }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer
      ? [startNS.buffer, endNS.buffer, size.buffer, height.buffer, dur.buffer, isWrite.buffer, isPhysical.buffer, itid.buffer]
      : []
  );
}
