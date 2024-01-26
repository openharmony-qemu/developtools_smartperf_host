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

export const chartProcessStartupDataSql = (args: any): string => {
  return `
      select P.pid,
             A.tid,
             A.call_id                                                                         as itid,
             (case when A.start_time < ${args.recordStartNS} then 0 else (A.start_time - ${args.recordStartNS}) end) as startTime,
             (case
                  when A.start_time < ${args.recordStartNS} then (A.end_time - ${args.recordStartNS})
                  when A.end_time = -1 then 0
                  else (A.end_time - A.start_time) end)                                        as dur,
             A.start_name                                                                      as startName
      from app_startup A
               left join process P on A.ipid = P.ipid
      where P.pid = ${args.pid}
      order by start_name;`;
};

export function processStartupDataReceiver(data: any, proc: Function): void {
  let sql = chartProcessStartupDataSql(data.params);
  let res = proc(sql);
  arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
}

function arrayBufferHandler(data: any, res: any[], transfer: boolean): void {
  let startTs = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startTime);
  let dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  let pid = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.pid);
  let tid = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.tid);
  let itid = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.itid);
  let startName = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.startName);
  res.forEach((it, i) => {
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.processStartupData);
    dur[i] = it.dur || 0;
    startTs[i] = it.startTime || 0;
    pid[i] = it.pid || 0;
    tid[i] = it.tid || 0;
    itid[i] = it.itid || 0;
    startName[i] = it.startName || 0;
  });
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
      action: data.action,
      results: transfer
        ? {
            dur: dur.buffer,
            startTs: startTs.buffer,
            pid: pid.buffer,
            tid: tid.buffer,
            itid: itid.buffer,
            startName: startName.buffer,
          }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer ? [dur.buffer, startTs.buffer, pid.buffer, tid.buffer, itid.buffer] : []
  );
}
