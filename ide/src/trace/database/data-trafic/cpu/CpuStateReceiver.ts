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
import { filterDataByGroup } from '../utils/DataFilter';
import { cpuStateList } from '../utils/AllMemoryCache';
import { Args } from '../CommonArgs';

export const chartCpuStateDataSql = (args: Args): string => {
  return `
      select  (value) as value,
              max(ifnull(dur, ${args.recordEndNS} - A.ts))                                                 as dur,
              (A.ts - ${args.recordStartNS})                                                               as startTs,
             ((A.ts - ${args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)})) AS px
      from measure A
      where filter_id = ${args.filterId}
        and startTs + ifnull(dur, ${args.recordEndNS} - A.ts) >= ${Math.floor(args.startNS)}
        and startTs <= ${Math.floor(args.endNS)}
      group by px
      union
      select  max(value) as value,
              (ifnull(dur, ${args.recordEndNS} - A.ts))                                                 as dur,
              (A.ts - ${args.recordStartNS})                                                               as startTs,
             ((A.ts - ${args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)})) AS px
      from measure A
      where filter_id = ${args.filterId}
        and startTs + ifnull(dur, ${args.recordEndNS} - A.ts) >= ${Math.floor(args.startNS)}
        and startTs <= ${Math.floor(args.endNS)}
      group by px
      ;`;
};

export const chartCpuStateDataSqlMem = (args: Args): string => {
  return `
   select (A.ts - ${args.recordStartNS}) as startTs,ifnull(dur,${args.recordEndNS} - A.ts) dur,
            value
        from measure A
        where filter_id = ${args.filterId};
      `;
};

export function cpuStateReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    let res: unknown[];
    let list: unknown[];
    // @ts-ignore
    if (!cpuStateList.has(data.params.filterId)) {
      // @ts-ignore
      list = proc(chartCpuStateDataSqlMem(data.params));
      for (let i = 0; i < list.length; i++) {
        // @ts-ignore
        if (list[i].dur === -1 || list[i].dur === null || list[i].dur === undefined) {
          // @ts-ignore
          list[i].dur = data.params.recordEndNS - data.params.recordStartNS - list[i].startTs;
        }
      }
      // @ts-ignore
      cpuStateList.set(data.params.filterId, list);
    } else {
      // @ts-ignore
      list = cpuStateList.get(data.params.filterId) || [];
    }
    res = filterDataByGroup(
      list || [],
      'startTs',
      'dur',
      // @ts-ignore
      data.params.startNS,
      // @ts-ignore
      data.params.endNS,
      // @ts-ignore
      data.params.width,
      'value'
    );
    arrayBufferHandler(data, res, true);
  } else {
    // @ts-ignore
    let sql = chartCpuStateDataSql(data.params);
    let res = proc(sql);
    // @ts-ignore
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

let heights = [4, 8, 12, 16, 20, 24, 28, 32];

function arrayBufferHandler(data: unknown, res: unknown[], transfer: boolean): void {
  // @ts-ignore
  let startTs = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startTs);
  // @ts-ignore
  let dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  // @ts-ignore
  let value = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.value);
  // @ts-ignore
  let height = new Uint8Array(transfer ? res.length : data.params.sharedArrayBuffers.height);
  res.forEach((it, i) => {
    // @ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.cpuStateData);
    // @ts-ignore
    startTs[i] = it.startTs;
    // @ts-ignore
    dur[i] = it.dur;
    // @ts-ignore
    value[i] = it.value;
    // @ts-ignore
    height[i] = heights[it.value];
  });
  (self as unknown as Worker).postMessage(
    {
      // @ts-ignore
      id: data.id,
      // @ts-ignore
      action: data.action,
      results: transfer
        ? {
            startTs: startTs.buffer,
            dur: dur.buffer,
            value: value.buffer,
          }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer ? [startTs.buffer, dur.buffer, value.buffer] : []
  );
}
