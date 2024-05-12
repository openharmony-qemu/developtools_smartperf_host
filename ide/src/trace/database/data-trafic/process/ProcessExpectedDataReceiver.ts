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
import { BaseStruct } from '../../ui-worker/ProcedureWorkerCommon';
import { Args } from '../CommonArgs';

export const chartProcessExpectedDataSql = (args: Args): string => {
  const recordStartNS = args.recordStartNS;
  const pid = args.pid;
  return `
  SELECT 
         (a.ts - ${recordStartNS}) AS ts,
         a.dur,
         ${pid} as pid,
         a.id,
         a.vsync              as name,
         a.type,
         a.depth
  FROM frame_slice AS a
  WHERE a.type = 1
    and (a.flag <> 2 or a.flag is null)
    and a.ipid in (select p.ipid from process AS p where p.pid = ${pid})
  ORDER BY a.ipid`;
};

export const chartProcessExpectedProtoDataSql = (args: Args): string => {
  const endNS = args.endNS;
  const startNS = args.startNS;
  const recordStartNS = args.recordStartNS;
  const pid = args.pid;
  const width = args.width;
  return `
  SELECT 
         (a.ts - ${startNS}) AS ts,
         a.dur,
         ${pid} as pid,
         a.id,
         a.vsync              as name,
         a.type,
         a.depth,
         (a.ts - ${recordStartNS}) / (${Math.floor((endNS - startNS) / width)}) + (a.depth * ${width})  AS px
  FROM frame_slice AS a
  WHERE a.type = 1
    and (a.flag <> 2 or a.flag is null)
    and a.ipid in (select p.ipid from process AS p where p.pid = ${pid})
    and (a.ts - ${recordStartNS} + a.dur) >= ${Math.floor(startNS)}
    and (a.ts - ${recordStartNS}) <= ${Math.floor(endNS)}
  group by px
  ORDER BY a.ipid;`;
};

export function processExpectedDataReceiver(data: unknown, proc: Function): void {
  //@ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    //@ts-ignore
    if (!processFrameList.has(`${data.params.pid}_expected`)) {
      //@ts-ignore
      let sql = chartProcessExpectedDataSql(data.params); //@ts-ignore
      processFrameList.set(`${data.params.pid}_expected`, proc(sql));
    } //@ts-ignore
    arrayBufferHandler(data, processFrameList.get(`${data.params.pid}_expected`)!, true);
  } else {
    //@ts-ignore
    let sql = chartProcessExpectedProtoDataSql(data.params as BaseStruct);
    let res = proc(sql); //@ts-ignore
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

function arrayBufferHandler(data: unknown, res: unknown[], transfer: boolean): void {
  //@ts-ignore
  let ts = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.ts); //@ts-ignore
  let dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur); //@ts-ignore
  let pid = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.pid); //@ts-ignore
  let id = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.id); //@ts-ignore
  let name = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.name); //@ts-ignore
  let type = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.type); //@ts-ignore
  let depth = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.depth);
  for (let index = 0; index < res.length; index++) {
    let itemData = res[index]; //@ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (itemData = itemData.processJanksFramesData); //@ts-ignore
    dur[index] = itemData.dur; //@ts-ignore
    ts[index] = itemData.ts; //@ts-ignore
    pid[index] = itemData.pid; //@ts-ignore
    id[index] = itemData.id; //@ts-ignore
    name[index] = itemData.name; //@ts-ignore
    type[index] = itemData.type; //@ts-ignore
    depth[index] = itemData.depth;
  }
  (self as unknown as Worker).postMessage(
    {
      //@ts-ignore
      id: data.id, //@ts-ignore
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
