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

import { threadStateList } from '../utils/AllMemoryCache';
import { filterDataByGroup } from '../utils/DataFilter';
import { TraficEnum, threadStateToNumber } from '../utils/QueryEnum';

export const chartThreadDataSql = (args: any) => {
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

export const sqlMem = (args: any): string => {
  return `select B.cpu, B.dur AS dur, B.itid AS id, B.tid AS tid, B.state, B.pid, B.ts - ${args.recordStartNS} AS startTime, 
                 ifnull(B.arg_setid, -1) AS argSetId
            from thread_state AS B
            where B.tid = ${args.tid}
            and B.pid = ${args.pid};`;
};

export function threadDataReceiver(data: any, proc: Function): void {
  if (data.params.trafic === TraficEnum.Memory) {
    let key = `${data.params.pid}${data.params.tid}`;
    if (!threadStateList.has(key)) {
      threadStateList.set(key, proc(sqlMem(data.params)));
    }
    let array = threadStateList.get(key) || [];
    let res = filterDataByGroup(
      array,
      'startTime',
      'dur',
      data.params.startNS,
      data.params.endNS,
      data.params.width,
      undefined,
      (a) => a.state === 'Running'
    );
    arrayBufferHandler(data, res, true, array.length === 0);
    return;
  } else {
    let sql = chartThreadDataSql(data.params);
    let res = proc(sql);
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer, false);
  }
}

function arrayBufferHandler(data: any, res: any[], transfer: boolean, isEmpty: boolean): void {
  let startTime = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startTime);
  let dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  let cpu = new Int8Array(transfer ? res.length : data.params.sharedArrayBuffers.cpu);
  let id = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.id);
  let tid = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.tid);
  let state = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.state);
  let pid = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.pid);
  let argSetID = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.argSetID);
  res.forEach((it, i) => {
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.processThreadData);
    startTime[i] = it.startTime;
    dur[i] = it.dur;
    cpu[i] = it.cpu;
    id[i] = it.id;
    tid[i] = it.tid;
    state[i] = threadStateToNumber(it.state);
    pid[i] = it.pid;
    argSetID[i] = it.argSetId;
  });
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
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
