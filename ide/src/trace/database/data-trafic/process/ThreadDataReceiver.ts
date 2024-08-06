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
import { threadStateList } from '../utils/AllMemoryCache';
import { filterDataByGroup } from '../utils/DataFilter';
import { TraficEnum, threadStateToNumber } from '../utils/QueryEnum';

export const chartThreadDataSql = (args: Args):unknown => {
  return `select B.cpu, max(B.dur) AS dur, B.itid AS id, B.tid AS tid, B.state, B.pid, 
                 B.ts - ${args.recordStartNS} AS startTime, ifnull(B.arg_setid, -1) AS argSetId, 
                 ((B.ts - ${args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)})) AS px
            from thread_state AS B
            where B.tid = ${args.tid}
              and B.pid = ${args.pid}
              and B.state != 'Running'
              and startTime + dur >= ${Math.floor(args.startNS)}
              and startTime <= ${Math.floor(args.endNS)}
            group by px
            union all
    select B.cpu, max(B.dur) AS dur, B.itid AS id, B.tid AS tid, B.state, 
           B.pid, B.ts - ${args.recordStartNS} AS startTime, ifnull(B.arg_setid, -1) AS argSetId, 
           ((B.ts - ${args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)})) AS px
    from thread_state AS B
    where B.tid = ${args.tid}
      and B.pid = ${args.pid}
      and B.state = 'Running'
      and startTime + dur >= ${Math.floor(args.startNS)}
      and startTime <= ${Math.floor(args.endNS)}
    group by px;
    ;`;
};

export const sqlMem = (args: Args): string => {
  return `select B.cpu, B.dur AS dur, B.itid AS id, B.tid AS tid, B.state, B.pid, B.ts - ${args.recordStartNS} AS startTime, 
                 ifnull(B.arg_setid, -1) AS argSetId
            from thread_state AS B
            where B.tid = ${args.tid}
            and B.pid = ${args.pid};`;
};

export function threadDataReceiver(data: unknown, proc: Function): void {
  //@ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    //@ts-ignore
    let key = `${data.params.pid}-${data.params.tid}`;
    if (!threadStateList.has(key)) {
      //@ts-ignore
      threadStateList.set(key, proc(sqlMem(data.params)));
    }
    let array = threadStateList.get(key) || [];
    let res = filterDataByGroup(
      array,
      'startTime',
      'dur', //@ts-ignore
      data.params.startNS, //@ts-ignore
      data.params.endNS, //@ts-ignore
      data.params.width,
      undefined,
      //@ts-ignore
      (a) => a.state === 'Running',
      false
    );
    arrayBufferHandler(data, res, true, array.length === 0);
    return;
  } else {
    //@ts-ignore
    let sql = chartThreadDataSql(data.params);
    let res = proc(sql); //@ts-ignore
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer, false);
  }
}

function arrayBufferHandler(data: unknown, res: unknown[], transfer: boolean, isEmpty: boolean): void {
  //@ts-ignore
  let startTime = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startTime); //@ts-ignore
  let dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur); //@ts-ignore
  let cpu = new Int8Array(transfer ? res.length : data.params.sharedArrayBuffers.cpu); //@ts-ignore
  let id = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.id); //@ts-ignore
  let tid = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.tid); //@ts-ignore
  let state = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.state); //@ts-ignore
  let pid = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.pid); //@ts-ignore
  let argSetID = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.argSetID);
  res.forEach((it, i) => {
    //@ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.processThreadData); //@ts-ignore
    startTime[i] = it.startTime; //@ts-ignore
    dur[i] = it.dur; //@ts-ignore
    cpu[i] = it.cpu; //@ts-ignore
    id[i] = it.id; //@ts-ignore
    tid[i] = it.tid; //@ts-ignore
    state[i] = threadStateToNumber(it.state); //@ts-ignore
    pid[i] = it.pid; //@ts-ignore
    argSetID[i] = it.argSetId;
  });
  (self as unknown as Worker).postMessage(
    {
      //@ts-ignore
      id: data.id, //@ts-ignore
      action: data.action,
      results: transfer
        ? {
            id: id.buffer,
            tid: tid.buffer,
            state: state.buffer,
            startTime: startTime.buffer,
            dur: dur.buffer,
            cpu: cpu.buffer,
            pid: pid.buffer,
            argSetID: argSetID.buffer,
          }
        : {},
      len: res.length,
      transfer: transfer,
      isEmpty: isEmpty,
    },
    transfer
      ? [startTime.buffer, dur.buffer, cpu.buffer, id.buffer, tid.buffer, state.buffer, pid.buffer, argSetID.buffer]
      : []
  );
}
