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
import { memList } from '../utils/AllMemoryCache';
import { Args } from '../CommonArgs';

export const chartProcessMemDataSql = (args: Args): string => {
  return `
      select 
             filter_id as       trackId,
             value,
             c.ts - ${args.recordStartNS} as startTime,
             ts
      from process_measure c,
           trace_range tb
      where filter_id = ${args.trackId};`;
};

export function processMemDataReceiver(data: unknown, proc: Function): void {
  let res: unknown[];
  let list: unknown[]; //@ts-ignore
  if (!memList.has(data.params.trackId)) {
    //@ts-ignore
    list = proc(chartProcessMemDataSql(data.params)); //@ts-ignore
    memList.set(data.params.trackId, list);
  } else {
    //@ts-ignore
    list = memList.get(data.params.trackId) || [];
  }
  res = list; //@ts-ignore
  arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
}

function arrayBufferHandler(data: unknown, res: unknown[], transfer: boolean): void {
  //@ts-ignore
  let startTime = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startTime); //@ts-ignore
  let ts = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.ts); //@ts-ignore
  let value = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.value); //@ts-ignore
  let track_id = new Uint8Array(transfer ? res.length : data.params.sharedArrayBuffers.track_id);
  res.forEach((it, i) => {
    //@ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.processMemData); //@ts-ignore
    ts[i] = it.ts; //@ts-ignore
    startTime[i] = it.startTime; //@ts-ignore
    track_id[i] = it.trackId; //@ts-ignore
    value[i] = it.value;
  });
  (self as unknown as Worker).postMessage(
    {
      //@ts-ignore
      id: data.id, //@ts-ignore
      action: data.action,
      results: transfer
        ? {
            ts: ts.buffer,
            startTime: startTime.buffer,
            value: value.buffer,
            track_id: track_id.buffer,
          }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer ? [ts.buffer, startTime.buffer, value.buffer, track_id.buffer] : []
  );
}
