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
import { filterDataByGroup } from './utils/DataFilter';
import { lrqList } from './utils/AllMemoryCache';
import { Args } from './CommonArgs';

export const chartIrqDataSql = (args: Args): string => {
  if (args.name === 'irq') {
    return `
        select i.ts - ${args.recordStartNS
      }                                                                                                   as startNs,
               max(i.dur)                                                                                       as dur,
               i.depth,
               ifnull(argsetid, -1)                                                                         as argSetId,
               i.id,
               ((i.ts - ${args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)})) as px
        from irq i
        where i.callid = ${args.cpu}
          and ((i.cat = 'irq' and i.flag = '1') or i.cat = 'ipi')
          and startNs + dur >= ${Math.floor(args.startNS)}
          and startNs <= ${Math.floor(args.endNS)}
        group by px;
    `;
  } else {
    return `
        select i.ts - ${args.recordStartNS}                                                                 as startNs,
               max(i.dur)                                                                                       as dur,
               i.depth,
               ifnull(argsetid,-1)                                                                            as argSetId,
               i.id,
               ((i.ts - ${args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)})) as px
        from irq i
        where i.callid = ${args.cpu}
          and i.cat = 'softirq'
          and startNs + dur >= ${Math.floor(args.startNS)}
          and startNs <= ${Math.floor(args.endNS)}
        group by px;
    `;
  }
};

export const chartIrqDataSqlMem = (args: Args): string => {
  if (args.name === 'irq') {
    return `
        select i.ts - t.start_ts as startNs,i.dur,
        case when i.cat = 'ipi' then 'IPI' || i.name else i.name end as name,
        i.depth,
        ifnull(argsetid, -1) as argSetId,
        i.id 
        from irq i,trace_range t 
        where i.callid = ${args.cpu} and ((i.cat = 'irq' and i.flag ='1') or i.cat = 'ipi') 
    `;
  } else {
    return `
        select i.ts - t.start_ts as startNs,i.dur,i.name,i.depth,ifnull(argsetid, -1) as argSetId,i.id from irq i,
trace_range t where i.callid = ${args.cpu} and i.cat = 'softirq'
    `;
  }
};

export function irqDataReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    let res: unknown[];
    let list: unknown[];
    // @ts-ignore
    if (!lrqList.has(data.params.cpu + data.params.name)) {
      // @ts-ignore
      list = proc(chartIrqDataSqlMem(data.params));
      // @ts-ignore
      lrqList.set(data.params.cpu + data.params.name, list);
    } else {
      // @ts-ignore
      list = lrqList.get(data.params.cpu + data.params.name) || [];
    }
    // @ts-ignore
    res = filterDataByGroup(list || [], 'startNs', 'dur', data.params.startNS, data.params.endNS, data.params.width);
    arrayBufferHandler(data, res, true);
  } else {
    // @ts-ignore
    let sql = chartIrqDataSql(data.params);
    let res = proc(sql);
    // @ts-ignore
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

function arrayBufferHandler(data: unknown, res: unknown[], transfer: boolean): void {
  // @ts-ignore
  let startNS = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startNS);
  // @ts-ignore
  let dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  // @ts-ignore
  let depth = new Uint32Array(transfer ? res.length : data.params.sharedArrayBuffers.depth);
  // @ts-ignore
  let argSetId = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.argSetId);
  // @ts-ignore
  let id = new Uint32Array(transfer ? res.length : data.params.sharedArrayBuffers.id);
  res.forEach((it, i) => {
    // @ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.irqData);
    // @ts-ignore
    startNS[i] = it.startNs;
    // @ts-ignore
    dur[i] = it.dur;
    // @ts-ignore
    depth[i] = it.depth;
    // @ts-ignore
    argSetId[i] = it.argSetId;
    // @ts-ignore
    id[i] = it.id;
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
          dur: dur.buffer,
          depth: depth.buffer,
          argSetId: argSetId.buffer,
          id: id.buffer,
        }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer ? [startNS.buffer, dur.buffer, depth.buffer, argSetId.buffer, id.buffer] : []
  );
}
