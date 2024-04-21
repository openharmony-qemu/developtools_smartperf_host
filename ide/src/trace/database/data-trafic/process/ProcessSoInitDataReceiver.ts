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
import { TraficEnum } from '../utils/QueryEnum';

export const chartProcessSoInitDataSql = (args: Args): string => {
  return `
  select
    A.depth,
    P.pid,
    T.tid,
    A.call_id as itid,
    (A.start_time - B.start_ts) as startTime,
    (A.end_time - A.start_time) as dur,
    A.id,
    A.so_name as soName
from static_initalize A,trace_range B
left join process P on A.ipid = P.ipid
left join thread T on A.call_id = T.itid
where P.pid = ${args.pid};`;
};

export function processSoInitDataReceiver(data: unknown, proc: Function): void {
  //@ts-ignore
  let sql = chartProcessSoInitDataSql(data.params);
  let res = proc(sql); //@ts-ignore
  arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
}

function arrayBufferHandler(data: unknown, res: unknown[], transfer: boolean): void {
  //@ts-ignore
  let startTs = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startTs); //@ts-ignore
  let dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur); //@ts-ignore
  let pid = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.pid); //@ts-ignore
  let tid = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.tid); //@ts-ignore
  let itid = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.itid); //@ts-ignore
  let depth = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.depth); //@ts-ignore
  let id = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.id);
  res.forEach((it, i) => {
    //@ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.processSoInitData); //@ts-ignore
    dur[i] = it.dur || 0; //@ts-ignore
    startTs[i] = it.startTime || 0; //@ts-ignore
    pid[i] = it.pid || 0; //@ts-ignore
    tid[i] = it.tid || 0; //@ts-ignore
    itid[i] = it.itid || 0; //@ts-ignore
    depth[i] = it.depth || 0; //@ts-ignore
    id[i] = it.id || 0;
  });
  (self as unknown as Worker).postMessage(
    {
      transfer: transfer, //@ts-ignore
      id: data.id, //@ts-ignore
      action: data.action,
      results: transfer
        ? {
            dur: dur.buffer,
            startTs: startTs.buffer,
            pid: pid.buffer,
            tid: tid.buffer,
            itid: itid.buffer,
            depth: depth.buffer,
            id: id.buffer,
          }
        : {},
      len: res.length,
    },
    transfer ? [dur.buffer, startTs.buffer, pid.buffer, tid.buffer, itid.buffer, depth.buffer, id.buffer] : []
  );
}
