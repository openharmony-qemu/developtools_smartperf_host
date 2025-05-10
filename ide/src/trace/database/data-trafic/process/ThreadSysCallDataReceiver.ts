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

export const chartThreadSysCallDataSql = (args: Args):unknown => {
  return `SELECT syscall_number as id, itid, ts - ${args.recordStartNS} as startTs, dur
          from syscall
          where itid = ${args.itid} 
             and startTs + dur >= ${Math.floor(args.startNS)}
             and startTs <= ${Math.floor(args.endNS)}
          `;
};

export function threadSysCallDataReceiver(data: unknown, proc: Function): void {
  //@ts-ignore
  let sql = chartThreadSysCallDataSql(data.params);
  let res = proc(sql); //@ts-ignore
  arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer, false);
}

function arrayBufferHandler(data: unknown, res: unknown[], transfer: boolean, isEmpty: boolean): void {
  //@ts-ignore
  let startTs = new Float64Array(res.length); //@ts-ignore
  let dur = new Float64Array(res.length); //@ts-ignore
  let id = new Int32Array(res.length); //@ts-ignore
  let itid = new Int32Array(res.length); //@ts-ignore
  res.forEach((it, i) => {
    //@ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.processThreadSysCallData); //@ts-ignore
    startTs[i] = it.startTs; //@ts-ignore
    dur[i] = it.dur; //@ts-ignore
    id[i] = it.id; //@ts-ignore
    itid[i] = it.itid; //@ts-ignore
  });
  (self as unknown as Worker).postMessage(
    {
      //@ts-ignore
      id: data.id, //@ts-ignorew
      action: data.action,
      results: transfer
        ? {
            id: id.buffer,
            itid: itid.buffer,
            startTs: startTs.buffer,
            dur: dur.buffer,
          }
        : {},
      len: res.length,
      transfer: transfer,
      isEmpty: isEmpty,
    },
    transfer
      ? [startTs.buffer, dur.buffer, id.buffer, itid.buffer]
      : []
  );
}
