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

import { Args } from '../CommonArgs';
import { threadCallStackList } from '../utils/AllMemoryCache';
import { filterDataByGroupLayer } from '../utils/DataFilter';
import { TraficEnum } from '../utils/QueryEnum';

export const chartFuncDataSql = (args: Args): string => {
  return `
    select
        startTs,
        dur,
        ifnull(argsetid, -1) as argsetid,
        depth,
        id,
        max(dur2) as dur2,
        (startTs) / (${Math.floor((args.endNS - args.startNS) / args.width)}) + (depth * ${
    args.width
  })                           AS px
    from (
      select c.ts - ${args.recordStartNS} as startTs,
             c.dur as dur,
             case when (c.dur=-1 or c.dur is null ) then ${args.recordEndNS} else c.dur end                   as dur2,
             c.argsetid,
             c.depth,
             c.id                         as id
             --c.name                       as funName,
      from callstack C
      where startTs not null
        and c.cookie is null
        and c.callid in (select id from thread where tid=${args.tid}
        and ipid=${args.ipid})
        and startTs + dur2 >= ${Math.floor(args.startNS)}
        and startTs <= ${Math.floor(args.endNS)}
    )
    group by px;  
`;
};

export const chartFuncDataSqlMem = (args: Args): string => {
  return `select c.ts - ${args.recordStartNS} as startTs,
             c.dur                  as dur,
             ifnull(c.argsetid, -1) as argsetid,
             c.depth,
             c.id                         as id
      from callstack C
      where startTs not null
        and c.cookie is null
        and c.callid in (select id from thread where tid=${args.tid}
        and ipid=${args.ipid})`;
};
export function funcDataReceiver(data: unknown, proc: Function): void {
  //@ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    //@ts-ignore
    let key = `${data.params.tid}${data.params.ipid}`;
    if (!threadCallStackList.has(key)) {
      //@ts-ignore
      let list = proc(chartFuncDataSqlMem(data.params));
      for (let i = 0; i < list.length; i++) {
        if (list[i].dur === -1 || list[i].dur === null || list[i].dur === undefined) {
          list[i].nofinish = 1; //@ts-ignore
          let totalNs = data.params.recordEndNS - data.params.recordStartNS;
          list[i].dur = totalNs - list[i].startTs;
        } else {
          list[i].nofinish = 0;
        }
      }
      threadCallStackList.set(key, list);
    }
    //@ts-ignore
    let array = data.params.expand ? (threadCallStackList.get(key) || []) : arrayFoldHandler(key);
    let res = filterDataByGroupLayer(
      //@ts-ignore
      array,
      'depth',
      'startTs',
      'dur', //@ts-ignore
      data.params.startNS, //@ts-ignore
      data.params.endNS, //@ts-ignore
      data.params.width
    );
    //@ts-ignore
    arrayBufferHandler(data, res, true, array.length === 0);
  } else {
    //@ts-ignore
    let sql = chartFuncDataSql(data.params);
    let res = proc(sql); //@ts-ignore
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer, false);
  }
}

//func泳道折叠时，过滤出depth为0的数据
function arrayFoldHandler(key: unknown): unknown {
  //@ts-ignore
  return (threadCallStackList.get(key) || []).filter((it) => it.depth === 0 );
}

function arrayBufferHandler(data: unknown, res: unknown[], transfer: boolean, isEmpty: boolean): void {
  //@ts-ignore
  let startTs = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startTs); //@ts-ignore
  let dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur); //@ts-ignore
  let argsetid = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.argsetid); //@ts-ignore
  let depth = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.depth); //@ts-ignore
  let id = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.id); //@ts-ignore
  let nofinish = new Uint8Array(transfer ? res.length : data.params.sharedArrayBuffers.nofinish);
  res.forEach((it, i) => {
    //@ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.processFuncData); //@ts-ignore
    startTs[i] = it.startTs; //@ts-ignore
    dur[i] = it.dur; //@ts-ignore
    argsetid[i] = it.argsetid; //@ts-ignore
    depth[i] = it.depth; //@ts-ignore
    id[i] = it.id; //@ts-ignore
    nofinish[i] = it.nofinish;
  });
  (self as unknown as Worker).postMessage(
    {
      //@ts-ignore
      id: data.id, //@ts-ignore
      action: data.action,
      results: transfer
        ? {
            startTs: startTs.buffer,
            dur: dur.buffer,
            argsetid: argsetid.buffer,
            depth: depth.buffer,
            id: id.buffer,
            nofinish: nofinish.buffer,
          }
        : {},
      len: res.length,
      transfer: transfer,
      isEmpty: isEmpty,
    },
    transfer ? [startTs.buffer, dur.buffer, argsetid.buffer, depth.buffer, id.buffer, nofinish.buffer] : []
  );
}
