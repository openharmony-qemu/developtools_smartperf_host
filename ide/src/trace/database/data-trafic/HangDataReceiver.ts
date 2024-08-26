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
import { clockList, hangList } from './utils/AllMemoryCache';
import { Args } from './CommonArgs';

export const chartHangDataSql = (args: Args): string => `
SELECT
  c.id as id,
  c.ts - r.start_ts as startNS,
  c.dur as dur,
  t.tid as tid,
  t.name as tname,
  p.pid as pid,
  p.name as pname
FROM
  callstack c, trace_range r
LEFT JOIN thread t ON
  t.itid = c.callid
LEFT JOIN process p ON
  p.ipid = t.ipid
WHERE
  c.dur >= ${args.minDur}
  AND c.name LIKE 'H:Et:%'
  AND t.is_main_thread = 1
  AND p.pid = ${args.pid}
`.trim();

export interface HangSQLStruct {
  id: number;
  startNS: number;
  dur: number;
  tid: number;
  pid: number;
}

export function hangDataReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    let res: HangSQLStruct[];
    let list: HangSQLStruct[];

    // @ts-ignore
    if (!hangList.has(data.params.pid)) {
      // @ts-ignore
      let sql = chartHangDataSql(data.params);
      list = proc(sql);
      // @ts-ignore
      hangList.set(data.params.pid, list);
    }
    else {
      // @ts-ignore
      list = hangList.get(data.params.pid) || [];
    }

    // @ts-ignore
    if (data.params.queryAll) {
      res = list.filter(
        //@ts-ignore
        (it) => it.startNS + it.dur >= data.params.selectStartNS && it.startNS <= data.params.selectEndNS
      );
    }
    else {
      res = list;
    }

    arrayBufferHandler(data, res, true);
  }
  else {
    // @ts-ignore
    let sql = chartHangDataSql(data.params);
    let res: HangSQLStruct[] = proc(sql);
    // @ts-ignore
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

function arrayBufferHandler(data: unknown, res: HangSQLStruct[], transfer: boolean = true): void {
  // @ts-ignore
  let id = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.id);
  // @ts-ignore
  let startNS = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startNS);
  // @ts-ignore
  let dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  // @ts-ignore
  let tid = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.tid);
  // @ts-ignore
  let pid = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.pid);
  res.forEach((it, i) => {
    id[i] = it.id;
    startNS[i] = it.startNS;
    dur[i] = it.dur;
    pid[i] = it.pid;
  });

  let arg1 = {
    // @ts-ignore
    id: data.id,
    // @ts-ignore
    action: data.action,
    results: {
      id: id.buffer,
      startNS: startNS.buffer,
      dur: dur.buffer,
      tid: tid.buffer,
      pid: pid.buffer,
    },
    len: res.length,
    transfer: transfer,
  };
  let arg2 = [
    id.buffer,
    startNS.buffer,
    dur.buffer,
    tid.buffer,
    pid.buffer,
  ];
  (self as unknown as Worker).postMessage(
    arg1, arg2,
  );
}