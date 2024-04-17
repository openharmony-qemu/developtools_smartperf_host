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
import { filterDataByGroupLayer, filterDataByLayer } from '../utils/DataFilter';
import {processList} from "../utils/AllMemoryCache";

const sqlNormal = (args: any): string => {
  return `select ta.cpu,                                                            
                 max(dur)                                                                                                              as dur,
                 ts - ${
                   args.recordStartNS
                 }                                                                                            as startTime,
                 ((ts - ${args.recordStartNS}) / (${Math.floor(
    (args.endNS - args.startNS) / args.width
  )})) + (ta.cpu * ${args.width}) AS px
          from thread_state ta
          where ta.cpu is not null
            and pid = ${args.pid}
            and startTime + dur >= ${Math.floor(args.startNS)}
            and startTime <= ${Math.floor(args.endNS)}
          group by px;`;
};

const sqlMem = (args: any): string => {
  return `select ta.cpu,
                 dur                        as dur,
                 ts - ${args.recordStartNS} as startTime
          from thread_state ta
          where ta.cpu is not null
            and pid = ${args.pid};`;
};

export function processDataReceiver(data: any, proc: Function): void {
  if (data.params.trafic === TraficEnum.Memory) {
    if (!processList.has(data.params.pid)) {
      processList.set(data.params.pid, proc(sqlMem(data.params)));
    }
    let res = filterDataByLayer(
      processList.get(data.params.pid) || [],
      'cpu',
      'startTime',
      'dur',
      data.params.startNS,
      data.params.endNS,
      data.params.width
    );
    arrayBufferHandler(data, res, true);
    return;
  } else {
    let transfer = data.params.trafic !== TraficEnum.SharedArrayBuffer;
    let sql = sqlNormal(data.params);
    let res: any[] = proc(sql);
    arrayBufferHandler(data, res, transfer);
  }
}

function arrayBufferHandler(data: any, res: any[], transfer: boolean): void {
  let startTime = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startTime);
  let dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  let cpu = new Uint8Array(transfer ? res.length : data.params.sharedArrayBuffers.cpu);
  res.forEach((it, i) => {
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.processData);
    startTime[i] = it.startTime;
    dur[i] = it.dur;
    cpu[i] = it.cpu;
  });
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
      action: data.action,
      results: transfer
        ? {
            startTime: startTime.buffer,
            dur: dur.buffer,
            cpu: cpu.buffer,
          }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer ? [startTime.buffer, dur.buffer, cpu.buffer] : []
  );
}
