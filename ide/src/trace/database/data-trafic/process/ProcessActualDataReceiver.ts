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

export const chartProcessActualDataSql = (args: any): string => {
  return `
  SELECT
               (a.ts - ${args.recordStartNS}) AS ts,
               a.dur,
               ${args.pid} as pid,
               a.id,
               a.vsync AS name,
               a.type,
               a.flag AS jankTag,
               a.dst AS dstSlice,
               a.depth
        FROM frame_slice AS a
        WHERE a.type = 0
          AND a.flag <> 2
          AND a.ipid in (select p.ipid from process AS p where p.pid = ${args.pid})
        ORDER BY a.ipid;`;
};

export const chartProcessActualProtoDataSql = (args: any): string => {
  return `
  SELECT
               (a.ts - ${args.recordStartNS}) AS ts,
               a.dur,
               ${args.pid} as pid,
               a.id,
               a.vsync AS name,
               a.type,
               a.flag AS jankTag,
               a.dst AS dstSlice,
               a.depth,
               (a.ts - ${args.recordStartNS}) / (${Math.floor(
    (args.endNS - args.startNS) / args.width
  )}) + (a.depth * ${args.width})  AS px
        FROM frame_slice AS a
        WHERE a.type = 0
          AND a.flag <> 2
          AND a.ipid in (select p.ipid from process AS p where p.pid = ${args.pid})
          AND (a.ts - ${args.recordStartNS}) + dur >= ${Math.floor(args.startNS)}
          
          AND (a.ts - ${args.recordStartNS}) <= ${Math.floor(args.endNS)}
        group by px
        ORDER BY a.ipid;`;
};

export function processActualDataReceiver(data: any, proc: Function): void {
  if (data.params.trafic === TraficEnum.Memory) {
    if (!processFrameList.has(`${data.params.pid}_actual`)) {
      let sql = chartProcessActualDataSql(data.params);
      processFrameList.set(`${data.params.pid}_actual`, proc(sql));
    }
    arrayBufferHandler(data, processFrameList.get(`${data.params.pid}_actual`)!, true);
  } else {
    let sql = chartProcessActualProtoDataSql(data.params);
    let res = proc(sql);
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

function arrayBufferHandler(data: any, res: any[], transfer: boolean): void {
  let processActual = new ProcessActual(data, transfer, res.length);
  for (let index = 0; index < res.length; index++) {
    let itemData = res[index];
    data.params.trafic === TraficEnum.ProtoBuffer && (itemData = itemData.processJanksActualData);
    if (!itemData.dur || itemData.dur < 0) {
      continue;
    }
    processActual.dur[index] = itemData.dur;
    processActual.ts[index] = itemData.ts;
    processActual.pid[index] = itemData.pid;
    processActual.id[index] = itemData.id;
    processActual.name[index] = itemData.name;
    processActual.type[index] = itemData.type;
    processActual.jank_tag[index] = itemData.jankTag;
    processActual.dst_slice[index] = itemData.dstSlice;
    processActual.depth[index] = itemData.depth;
  }
  postProcessActualMessage(data, transfer, processActual, res.length);
}
function postProcessActualMessage(data: any, transfer: boolean, processActual: ProcessActual, len: number) {
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
      action: data.action,
      results: transfer
        ? {
            dur: processActual.dur.buffer,
            ts: processActual.ts.buffer,
            pid: processActual.pid.buffer,
            id: processActual.id.buffer,
            name: processActual.name.buffer,
            type: processActual.type.buffer,
            jank_tag: processActual.jank_tag.buffer,
            dst_slice: processActual.dst_slice.buffer,
            depth: processActual.depth.buffer,
          }
        : {},
      len: len,
      transfer: transfer,
    },
    transfer
      ? [
          processActual.dur.buffer,
          processActual.ts.buffer,
          processActual.pid.buffer,
          processActual.type.buffer,
          processActual.id.buffer,
          processActual.name.buffer,
          processActual.jank_tag.buffer,
          processActual.dst_slice.buffer,
          processActual.depth.buffer,
        ]
      : []
  );
}
class ProcessActual {
  ts: Float64Array;
  dur: Float64Array;
  pid: Int32Array;
  id: Int32Array;
  name: Int32Array;
  type: Int32Array;
  jank_tag: Int32Array;
  dst_slice: Int32Array;
  depth: Uint16Array;
  constructor(data: any, transfer: boolean, len: number) {
    this.ts = new Float64Array(transfer ? len : data.params.sharedArrayBuffers.ts);
    this.dur = new Float64Array(transfer ? len : data.params.sharedArrayBuffers.dur);
    this.pid = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.pid);
    this.id = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.id);
    this.name = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.name);
    this.type = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.type);
    this.jank_tag = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.jank_tag);
    this.dst_slice = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.dst_slice);
    this.depth = new Uint16Array(transfer ? len : data.params.sharedArrayBuffers.depth);
  }
}
