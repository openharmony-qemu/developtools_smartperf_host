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

import { TraficEnum } from './QueryEnum';
import { filterDataByGroup } from './DataFilter';

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
               a.dst AS dstSlice
        FROM frame_slice AS a
        WHERE a.type = 0
          AND a.flag <> 2
          AND a.ipid in (select p.ipid from process AS p where p.pid = ${args.pid})
        ORDER BY a.ipid, ts;`;
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
               (a.ts - ${args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)}) + (a.depth * ${ args.width })  AS px
        FROM frame_slice AS a
        WHERE a.type = 0
          AND a.flag <> 2
          AND a.ipid in (select p.ipid from process AS p where p.pid = ${args.pid})
          AND (a.ts - ${args.recordStartNS}) + dur >= ${Math.floor(args.startNS)}
          
          AND (a.ts - ${args.recordStartNS}) <= ${Math.floor(args.endNS)}
        group by px
        ORDER BY a.ipid;`;
};

let frameDepthList: Map<string, number> = new Map();

export function processActualDataReceiver(data: any, proc: Function): void {
  if (data.params.trafic === TraficEnum.Memory) {
    frameDepthList = new Map<string, number>();
    let sql = chartProcessActualDataSql(data.params);
    let res = proc(sql);
    let filterDataList = filterDataByGroup(res || [], 'ts', 'dur', data.params.startNS, data.params.endNS, data.params.width);
    setTimeout(() => {
      arrayBufferHandler(data, filterDataList, false);
    }, 1);
  } else {
    let sql = chartProcessActualProtoDataSql(data.params);
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
  let jank_tag = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.jank_tag);
  let dst_slice = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.dst_slice);
  let depth = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.depth);
  for (let index = 0; index < res.length; index++) {
    let itemData = res[index];
    data.params.trafic === TraficEnum.ProtoBuffer && (itemData = itemData.processJanksActualData);
    if (!itemData.dur || itemData.dur < 0) {
      continue;
    }
    dur[index] = itemData.dur;
    ts[index] = itemData.ts;
    pid[index] = itemData.pid;
    id[index] = itemData.id;
    name[index] = itemData.name;
    type[index] = itemData.type;
    jank_tag[index] = itemData.jankTag;
    dst_slice[index] = itemData.dstSlice;
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
            type: type.buffer,
            jank_tag: jank_tag.buffer,
            dst_slice: dst_slice.buffer,
            depth: depth.buffer,
          }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer
      ? [dur.buffer, ts.buffer, pid.buffer, type.buffer, id.buffer, name.buffer, jank_tag.buffer, dst_slice.buffer, depth.buffer]
      : []
  );
}
