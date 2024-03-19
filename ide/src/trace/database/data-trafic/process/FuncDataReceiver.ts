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

import { threadCallStackList } from "../utils/AllMemoryCache";
import { filterDataByGroupLayer } from "../utils/DataFilter";
import { TraficEnum } from "../utils/QueryEnum";


export const chartFuncDataSql = (args: any):string => {
  return `
    select
        startTs,
        dur,
        ifnull(argsetid, -1) as argsetid,
        depth,
        id,
        max(dur2) as dur2,
        (startTs) / (${Math.floor((args.endNS - args.startNS) / args.width)}) + (depth * ${ args.width })                           AS px
    from (
      select c.ts - ${args.recordStartNS} as startTs,
             c.dur as dur,
             case when (c.dur=-1 ) then ${args.recordEndNS} else c.dur end                   as dur2,
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

export const chartFuncDataSqlMem = (args:any):string =>{
  return `select c.ts - ${args.recordStartNS} as startTs,
             c.dur                  as dur,
             ifnull(c.argsetid, -1) as argsetid,
             c.depth,
             c.id                         as id
             --c.name                       as funName,
      from callstack C
      where startTs not null
        and c.cookie is null
        and c.callid in (select id from thread where tid=${args.tid}
        and ipid=${args.ipid})`;
}
export function funcDataReceiver(data: any, proc: Function):void {
  if (data.params.trafic === TraficEnum.Memory) {
    let key = `${data.params.tid}${data.params.ipid}`
    if (!threadCallStackList.has(key)) {
      let list = proc(chartFuncDataSqlMem(data.params));
      for (let i = 0; i < list.length; i++) {
        if (list[i].dur == -1) {
          list[i].nofinish = 1;
          list[i].dur = data.params.endNS - list[i].startTs;
        } else {
          list[i].nofinish = 0;
        }
      }
      threadCallStackList.set(key, list);
    }
    let array = threadCallStackList.get(key) || [];
    let res = filterDataByGroupLayer(
      array,
      'depth',
      'startTs',
      'dur', data.params.startNS, data.params.endNS, data.params.width);
      arrayBufferHandler(data, res, true,array.length===0);
  } else {
    let sql = chartFuncDataSql(data.params);
    let res = proc(sql);
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer,false);
  }
}

function arrayBufferHandler(data: any, res: any[], transfer: boolean,isEmpty:boolean): void {
  let startTs = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startTs);
  let dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  let argsetid = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.argsetid);
  let depth = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.depth);
  let id = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.id);
  res.forEach((it, i) => {
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.processFuncData);
    startTs[i] = it.startTs;
    dur[i] = it.dur;
    argsetid[i] = it.argsetid;
    depth[i] = it.depth;
    id[i] = it.id;
  });
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
      action: data.action,
      results: transfer
        ? {
            startTs: startTs.buffer,
            dur: dur.buffer,
            argsetid: argsetid.buffer,
            depth: depth.buffer,
            id: id.buffer,
          }
        : {},
      len: res.length,
      transfer: transfer,
      isEmpty:isEmpty,
    },
    transfer ? [startTs.buffer, dur.buffer, argsetid.buffer, depth.buffer, id.buffer] : []
  );
}
