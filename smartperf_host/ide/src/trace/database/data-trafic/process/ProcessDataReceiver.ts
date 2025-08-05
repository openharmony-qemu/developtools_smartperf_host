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
import { filterDataByLayer } from '../utils/DataFilter';
import { processList } from '../utils/AllMemoryCache';
import { Args } from '../CommonArgs';

const sqlNormal = (args: Args): string => {
  return `select ta.cpu,                                                            
                 max(dur)  as dur,
                 ts - ${args.recordStartNS} as startTime,
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

const sqlMem = (args: Args): string => {
  return `select ta.cpu,
                 dur                        as dur,
                 ts - ${args.recordStartNS} as startTime
          from thread_state ta
          where ta.cpu is not null
            and pid = ${args.pid};`;
};

export function processDataReceiver(data: unknown, proc: Function): void {
  //@ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    //@ts-ignore
    if (!processList.has(data.params.pid)) {
      //@ts-ignore
      processList.set(data.params.pid, proc(sqlMem(data.params)));
    }
    let res = filterDataByLayer(
      //@ts-ignore
      processList.get(data.params.pid) || [],
      'cpu',
      'startTime',
      'dur', //@ts-ignore
      data.params.startNS, //@ts-ignore
      data.params.endNS, //@ts-ignore
      data.params.width
    );
    arrayBufferHandler(data, res, true);
    return;
  } else {
    //@ts-ignore
    let transfer = data.params.trafic !== TraficEnum.SharedArrayBuffer; //@ts-ignore
    let sql = sqlNormal(data.params);
    let res: unknown[] = proc(sql);
    arrayBufferHandler(data, res, transfer);
  }
}

function arrayBufferHandler(data: unknown, res: unknown[], transfer: boolean): void {
  //@ts-ignore
  let startTime = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startTime); //@ts-ignore
  let dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur); //@ts-ignore
  let cpu = new Uint8Array(transfer ? res.length : data.params.sharedArrayBuffers.cpu);
  res.forEach((it, i) => {
    //@ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.processData); //@ts-ignore
    startTime[i] = it.startTime; //@ts-ignore
    dur[i] = it.dur; //@ts-ignore
    cpu[i] = it.cpu;
  });
  (self as unknown as Worker).postMessage(
    {
      //@ts-ignore
      id: data.id, //@ts-ignore
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
