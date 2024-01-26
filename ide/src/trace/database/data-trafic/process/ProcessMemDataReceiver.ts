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
import { filterData } from '../utils/DataFilter';
import {memList} from "../utils/AllMemoryCache";

export const chartProcessMemDataSql = (args: any): string => {
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

export function processMemDataReceiver(data: any, proc: Function): void {
  let res: any[], list: any[];
  if (!memList.has(data.params.trackId)) {
    list = proc(chartProcessMemDataSql(data.params));
    memList.set(data.params.trackId, list);
  } else {
    list = memList.get(data.params.trackId) || [];
  }
  res = list;
  arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
}

function arrayBufferHandler(data: any, res: any[], transfer: boolean): void {
  let startTime = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startTime);
  let ts = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.ts);
  let value = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.value);
  let track_id = new Uint8Array(transfer ? res.length : data.params.sharedArrayBuffers.track_id);
  res.forEach((it, i) => {
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.processMemData);
    ts[i] = it.ts;
    startTime[i] = it.startTime;
    track_id[i] = it.trackId;
    value[i] = it.value;
  });
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
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
