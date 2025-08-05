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
import { Args } from '../CommonArgs';

export const chartProcessActualDataSql = (args: Args): string => {
  return `
  SELECT
               (a.ts - ${args.recordStartNS}) AS ts,
               a.dur,
               ${args.pid} as pid,
               t.tid as tid,
               a.id,
               a.vsync AS name,
               a.type,
               a.flag AS jankTag,
               a.dst AS dstSlice,
               a.depth
        FROM frame_slice AS a
        LEFT JOIN thread AS t ON a.itid = t.id
        WHERE a.type = 0
          AND a.flag <> 2
          AND a.ipid in (select p.ipid from process AS p where p.pid = ${args.pid})
        ORDER BY a.ipid;`;
};

export const chartProcessActualProtoDataSql = (args: Args): string => {
  return `
  SELECT
               (a.ts - ${args.recordStartNS}) AS ts,
               a.dur,
               ${args.pid} as pid,
               t.tid as tid,
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
        LEFT JOIN thread AS t ON a.itid = t.id
        WHERE a.type = 0
          AND a.flag <> 2
          AND a.ipid in (select p.ipid from process AS p where p.pid = ${args.pid})
          AND (a.ts - ${args.recordStartNS}) + dur >= ${Math.floor(args.startNS)}
          AND (a.ts - ${args.recordStartNS}) <= ${Math.floor(args.endNS)}
        group by px
        ORDER BY a.ipid;`;
};

export function processActualDataReceiver(data: unknown, proc: Function): void {
  //@ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    //@ts-ignore
    if (!processFrameList.has(`${data.params.pid}_actual`)) {
      //@ts-ignore
      let sql = chartProcessActualDataSql(data.params); //@ts-ignore
      processFrameList.set(`${data.params.pid}_actual`, proc(sql));
    } //@ts-ignore
    arrayBufferHandler(data, processFrameList.get(`${data.params.pid}_actual`)!, true);
  } else {
    //@ts-ignore
    let sql = chartProcessActualProtoDataSql(data.params);
    let res = proc(sql); //@ts-ignore
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

function arrayBufferHandler(data: unknown, res: unknown[], transfer: boolean): void {
  let processActual = new ProcessActual(data, transfer, res.length);
  for (let index = 0; index < res.length; index++) {
    let itemData = res[index]; //@ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (itemData = itemData.processJanksActualData); //@ts-ignore
    if (!itemData.dur || itemData.dur < 0) {
      continue;
    } //@ts-ignore
    processActual.dur[index] = itemData.dur; //@ts-ignore
    processActual.ts[index] = itemData.ts; //@ts-ignore
    processActual.pid[index] = itemData.pid; //@ts-ignore
    processActual.tid[index] = itemData.tid; //@ts-ignore
    processActual.id[index] = itemData.id; //@ts-ignore
    processActual.name[index] = itemData.name; //@ts-ignore
    processActual.type[index] = itemData.type; //@ts-ignore
    processActual.jank_tag[index] = itemData.jankTag; //@ts-ignore
    processActual.dst_slice[index] = itemData.dstSlice; //@ts-ignore
    processActual.depth[index] = itemData.depth;
  }
  postProcessActualMessage(data, transfer, processActual, res.length);
}
function postProcessActualMessage(data: unknown, transfer: boolean, processActual: ProcessActual, len: number): void {
  (self as unknown as Worker).postMessage(
    {
      //@ts-ignore
      id: data.id, //@ts-ignore
      action: data.action,
      results: transfer
        ? {
            dur: processActual.dur.buffer,
            ts: processActual.ts.buffer,
            pid: processActual.pid.buffer,
            tid: processActual.tid.buffer,
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
          processActual.tid.buffer,
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
  tid: Int32Array;
  id: Int32Array;
  name: Int32Array;
  type: Int32Array;
  jank_tag: Int32Array;
  dst_slice: Int32Array;
  depth: Uint16Array;
  constructor(data: unknown, transfer: boolean, len: number) {
    //@ts-ignore
    this.ts = new Float64Array(transfer ? len : data.params.sharedArrayBuffers.ts); //@ts-ignore
    this.dur = new Float64Array(transfer ? len : data.params.sharedArrayBuffers.dur); //@ts-ignore
    this.pid = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.pid); //@ts-ignore
    this.tid = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.tid); //@ts-ignore
    this.id = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.id); //@ts-ignore
    this.name = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.name); //@ts-ignore
    this.type = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.type); //@ts-ignore
    this.jank_tag = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.jank_tag); //@ts-ignore
    this.dst_slice = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.dst_slice); //@ts-ignore
    this.depth = new Uint16Array(transfer ? len : data.params.sharedArrayBuffers.depth);
  }
}
