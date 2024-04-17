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
import { processFrameList } from '../utils/AllMemoryCache';
import { filterDataByGroup } from '../utils/DataFilter';

export const chartProcessExpectedDataSql = (args: any): string => {
  return `
  SELECT 
         (a.ts - ${args.recordStartNS}) AS ts,
         a.dur,
         ${args.pid} as pid,
         a.id,
         a.vsync              as name,
         a.type,
         a.depth
  FROM frame_slice AS a
  WHERE a.type = 1
    and (a.flag <> 2 or a.flag is null)
    and a.ipid in (select p.ipid from process AS p where p.pid = ${args.pid})
  ORDER BY a.ipid`;
};

export const chartProcessExpectedProtoDataSql = (args: any): string => {
  return `
  SELECT 
         (a.ts - ${args.recordStartNS}) AS ts,
         a.dur,
         ${args.pid} as pid,
         a.id,
         a.vsync              as name,
         a.type,
         a.depth,
         (a.ts - ${args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)}) + (a.depth * ${ args.width })  AS px
  FROM frame_slice AS a
  WHERE a.type = 1
    and (a.flag <> 2 or a.flag is null)
    and a.ipid in (select p.ipid from process AS p where p.pid = ${args.pid})
    and (a.ts - ${args.recordStartNS} + a.dur) >= ${Math.floor(args.startNS)}
    and (a.ts - ${args.recordStartNS}) <= ${Math.floor(args.endNS)}
  group by px
  ORDER BY a.ipid;`;
};

export function processExpectedDataReceiver(data: any, proc: Function): void {
  if (data.params.trafic === TraficEnum.Memory) {
    if (!processFrameList.has(`${data.params.pid}_expected`)) {
      let sql = chartProcessExpectedDataSql(data.params);
      processFrameList.set(`${data.params.pid}_expected`, proc(sql));
    }
    arrayBufferHandler(data, processFrameList.get(`${data.params.pid}_expected`)!, true);
  } else {
    let sql = chartProcessExpectedProtoDataSql(data.params);
    let res = proc(sql);
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

function arrayBufferHandler(data: any, res: any[], transfer: boolean): void {
  let ts = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.ts);
  let dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  let pid = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.pid);
  let id = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.id);
  let name = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.name);
  let type = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.type);
  let depth = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.depth);
  for (let index = 0; index < res.length; index++) {
    let itemData = res[index];
    data.params.trafic === TraficEnum.ProtoBuffer && (itemData = itemData.processJanksFramesData);
    dur[index] = itemData.dur;
    ts[index] = itemData.ts;
    pid[index] = itemData.pid;
    id[index] = itemData.id;
    name[index] = itemData.name;
    type[index] = itemData.type;
    depth[index] = itemData.depth;
  }
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
      action: data.action,
      results: transfer
        ? {
            dur: dur.buffer,
            ts: ts.buffer,
            pid: pid.buffer,
            id: id.buffer,
            name: name.buffer,
            type: name.buffer,
            depth: depth.buffer,
          }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer ? [dur.buffer, ts.buffer, pid.buffer, type.buffer, id.buffer, name.buffer, depth.buffer] : []
  );
}
