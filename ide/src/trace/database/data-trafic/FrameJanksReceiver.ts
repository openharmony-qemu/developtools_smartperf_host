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

import { TraficEnum } from './utils/QueryEnum';
import { JanksStruct } from '../../bean/JanksStruct';
import { CounterStruct } from '../ui-worker/ProduceWorkerSdkCounter';

export const chartExpectedMemoryDataSql = (args: any): string => {
  return `SELECT sf.id,
                'frameTime' as frameType,
                fs.ipid,
                fs.vsync as name,
                fs.dur as appDur,
                (sf.ts + sf.dur - fs.ts) as dur,
                (fs.ts - ${args.recordStartNS}) AS ts,
                fs.type,
                fs.flag as jankTag,
                pro.pid,
                pro.name as cmdline,
                (sf.ts - ${args.recordStartNS}) AS rsTs,
                sf.vsync AS rsVsync,
                sf.dur AS rsDur,
                sf.ipid AS rsIpid,
                proc.pid AS rsPid,
                proc.name AS rsName
            FROM frame_slice AS fs
            LEFT JOIN process AS pro ON pro.id = fs.ipid
            LEFT JOIN frame_slice AS sf ON fs.dst = sf.id
            LEFT JOIN process AS proc ON proc.id = sf.ipid
            WHERE fs.dst IS NOT NULL AND fs.type = 1
            UNION
            SELECT -1 as id,
                'frameTime' as frameType,
                fs.ipid,
                fs.vsync  as name,
                fs.dur as appDur,
                fs.dur,
                (fs.ts - ${args.recordStartNS}) AS ts,
                fs.type,
                fs.flag as jankTag,
                pro.pid,
                pro.name as cmdline,
                NULL AS rsTs, NULL AS rsVsync, NULL AS rsDur, NULL AS rsIpid, NULL AS rsPid, NULL AS rsName
            FROM frame_slice AS fs LEFT JOIN process AS pro ON pro.id = fs.ipid
            WHERE fs.dst IS NULL
            AND pro.name NOT LIKE '%render_service%'
            AND fs.type = 1
            ORDER by ts`;
};

export const chartExpectedDataSql = (args: any): string => {
  return `SELECT sf.id,
            'frameTime' as frameType,
            fs.ipid,
            fs.vsync as name,
            fs.dur as appDur,
            (sf.ts + sf.dur - fs.ts) as dur,
            (fs.ts - ${args.recordStartNS}) AS ts,
            fs.type,
            fs.flag as jankTag,
            pro.pid,
            pro.name as cmdline,
            (sf.ts - ${args.recordStartNS}) AS rsTs,
            sf.vsync AS rsVsync,
            sf.dur AS rsDur,
            sf.ipid AS rsIpid,
            proc.pid AS rsPid,
            proc.name AS rsName
        FROM frame_slice AS fs
        LEFT JOIN process AS pro ON pro.id = fs.ipid
        LEFT JOIN frame_slice AS sf ON fs.dst = sf.id
        LEFT JOIN process AS proc ON proc.id = sf.ipid
        WHERE fs.dst IS NOT NULL
        AND fs.type = 1
        AND (fs.ts - ${args.recordStartNS} + fs.dur) >= ${Math.floor(args.startNS)}
        AND (fs.ts - ${args.recordStartNS}) <= ${Math.floor(args.endNS)}
        UNION
        SELECT -1 as id,
            'frameTime' as frameType,
            fs.ipid,
            fs.vsync  as name,
            fs.dur as appDur,
            fs.dur,
            (fs.ts - ${args.recordStartNS}) AS ts,
            fs.type,
            fs.flag as jankTag,
            pro.pid,
            pro.name as cmdline,
            NULL AS rsTs, NULL AS rsVsync, NULL AS rsDur, NULL AS rsIpid, NULL AS rsPid, NULL AS rsName
        FROM frame_slice AS fs LEFT JOIN process AS pro ON pro.id = fs.ipid
        WHERE fs.dst IS NULL
        AND pro.name NOT LIKE '%render_service%'
        AND fs.type = 1
        AND (fs.ts - ${args.recordStartNS} + fs.dur) >= ${Math.floor(args.startNS)}
        AND (fs.ts - ${args.recordStartNS}) <= ${Math.floor(args.endNS)}
        ORDER by ts`;
};

export const chartActualMemoryDataSql = (args: any): string => {
  return `SELECT sf.id,
            'frameTime' as frameType,
            fs.ipid,
            fs.vsync as name,
            fs.dur as appDur,
            (sf.ts + sf.dur - fs.ts) as dur,
            (fs.ts - ${args.recordStartNS}) AS ts,
            fs.type,
            (case when (sf.flag == 1 or fs.flag == 1 ) then 1 when (sf.flag == 3 or fs.flag == 3 ) then 3 else 0 end) as jankTag,
            pro.pid,
            pro.name as cmdline,
            (sf.ts - ${args.recordStartNS}) AS rsTs,
            sf.vsync AS rsVsync,
            sf.dur AS rsDur,
            sf.ipid AS rsIpid,
            proc.pid AS rsPid,
            proc.name AS rsName
        FROM frame_slice AS fs
        LEFT JOIN process AS pro ON pro.id = fs.ipid
        LEFT JOIN frame_slice AS sf ON fs.dst = sf.id
        LEFT JOIN process AS proc ON proc.id = sf.ipid
        WHERE fs.dst IS NOT NULL
        AND fs.type = 0
        AND fs.flag <> 2
        UNION
        SELECT -1 as id,
            'frameTime' as frameType,
            fs.ipid,
            fs.vsync as name,
            fs.dur as appDur,
            fs.dur,
            (fs.ts - ${args.recordStartNS}) AS ts,
            fs.type,
            fs.flag as jankTag,
            pro.pid,
            pro.name as cmdline,
            NULL AS rsTs, NULL AS rsVsync, NULL AS rsDur, NULL AS rsIpid, NULL AS rsPid, NULL AS rsName
        FROM frame_slice AS fs LEFT JOIN process AS pro ON pro.id = fs.ipid
        WHERE fs.dst IS NULL
        AND pro.name NOT LIKE '%render_service%'
        AND fs.type = 0
        AND fs.flag <> 2
        ORDER by ts;`;
};

export const chartActualDataSql = (args: any): string => {
  return `SELECT sf.id,
            'frameTime' as frameType,
            fs.ipid,
            fs.vsync as name,
            fs.dur as appDur,
            (sf.ts + sf.dur - fs.ts) as dur,
            (fs.ts - ${args.recordStartNS}) AS ts,
            fs.type,
            (case when (sf.flag == 1 or fs.flag == 1 ) then 1 when (sf.flag == 3 or fs.flag == 3 ) then 3 else 0 end) as jankTag,
            pro.pid,
            pro.name as cmdline,
            (sf.ts - ${args.recordStartNS}) AS rsTs,
            sf.vsync AS rsVsync,
            sf.dur AS rsDur,
            sf.ipid AS rsIpid,
            proc.pid AS rsPid,
            proc.name AS rsName
        FROM frame_slice AS fs
        LEFT JOIN process AS pro ON pro.id = fs.ipid
        LEFT JOIN frame_slice AS sf ON fs.dst = sf.id
        LEFT JOIN process AS proc ON proc.id = sf.ipid
        WHERE fs.dst IS NOT NULL
        AND fs.type = 0
        AND fs.flag <> 2
        AND (fs.ts - ${args.recordStartNS} + fs.dur) >= ${Math.floor(args.startNS)}
        AND (fs.ts - ${args.recordStartNS}) <= ${Math.floor(args.endNS)}
        UNION
        SELECT -1 as id,
            'frameTime' as frameType,
            fs.ipid,
            fs.vsync as name,
            fs.dur as appDur,
            fs.dur,
            (fs.ts - ${args.recordStartNS}) AS ts,
            fs.type,
            fs.flag as jankTag,
            pro.pid,
            pro.name as cmdline,
            NULL AS rsTs, NULL AS rsVsync, NULL AS rsDur, NULL AS rsIpid, NULL AS rsPid, NULL AS rsName
        FROM frame_slice AS fs LEFT JOIN process AS pro ON pro.id = fs.ipid
        WHERE fs.dst IS NULL
        AND pro.name NOT LIKE '%render_service%'
        AND fs.type = 0
        AND fs.flag <> 2
        AND (fs.ts - ${args.recordStartNS} + fs.dur) >= ${Math.floor(args.startNS)}
        AND (fs.ts - ${args.recordStartNS}) <= ${Math.floor(args.endNS)}
        ORDER by ts`;
};

let frameDepthList: Map<string, number> = new Map();

export function frameExpectedReceiver(data: any, proc: Function): void {
  if (data.params.trafic === TraficEnum.Memory) {
    frameDepthList = new Map<string, number>();
    let sql = chartExpectedMemoryDataSql(data.params);
    let res = proc(sql);
    frameJanksReceiver(data, res, 'expect', true);
  } else {
    let sql = chartExpectedDataSql(data.params);
    let res = proc(sql);
    frameJanksReceiver(data, res, 'expect', data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

export function frameActualReceiver(data: any, proc: Function): void {
  if (data.params.trafic === TraficEnum.Memory) {
    let sql = chartActualMemoryDataSql(data.params);
    let res = proc(sql);
    frameJanksReceiver(data, res, 'actual', true);
  } else {
    let sql = chartActualDataSql(data.params);
    let res = proc(sql);
    frameJanksReceiver(data, res, 'actual', data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}
let isIntersect = (leftData: JanksStruct, rightData: JanksStruct): boolean =>
  Math.max(leftData.ts! + leftData.dur!, rightData.ts! + rightData.dur!) - Math.min(leftData.ts!, rightData.ts!) <
  leftData.dur! + rightData.dur!;
function frameJanksReceiver(data: any, res: any[], type: string, transfer: boolean): void {
  let frameJanks = new FrameJanks(data, transfer, res.length);
  if (data.params.trafic === TraficEnum.Memory) {
    let unitIndex: number = 1;
    let depths: any[] = [];
    for (let index = 0; index < res.length; index++) {
      let itemData = res[index];
      data.params.trafic === TraficEnum.ProtoBuffer && (itemData = itemData.frameData);
      if (!itemData.dur || itemData.dur < 0) {
        continue;
      }
      if (depths.length === 0) {
        itemData.depth = 0;
        depths[0] = itemData;
      } else {
        let depthIndex: number = 0;
        let isContinue: boolean = true;
        while (isContinue) {
          if (isIntersect(depths[depthIndex], itemData)) {
            if (depths[depthIndex + unitIndex] === undefined || !depths[depthIndex + unitIndex]) {
              itemData.depth = depthIndex + unitIndex;
              depths[depthIndex + unitIndex] = itemData;
              isContinue = false;
            }
          } else {
            itemData.depth = depthIndex;
            depths[depthIndex] = itemData;
            isContinue = false;
          }
          depthIndex++;
        }
      }
      setFrameJanks(frameJanks, itemData, index);
      frameDepthList.set(`${type}_${itemData.id}_${itemData.ipid}_${itemData.name}`, itemData.depth);
    }
  } else {
    for (let index = 0; index < res.length; index++) {
      let itemData = res[index];
      data.params.trafic === TraficEnum.ProtoBuffer && (itemData = itemData.frameData);
      setFrameJanks(frameJanks, itemData, index);
      if (frameDepthList.has(`${type}_${itemData.id}_${itemData.ipid}_${itemData.name}`)) {
        frameJanks.depth[index] = frameDepthList.get(`${type}_${itemData.id}_${itemData.ipid}_${itemData.name}`)!;
      }
    }
  }
  postFrameJanksMessage(data, transfer, frameJanks, res.length);
}
function setFrameJanks(frameJanks: FrameJanks, itemData: any, index: number) {
  frameJanks.id[index] = itemData.id;
  frameJanks.ipId[index] = itemData.ipid;
  frameJanks.name[index] = itemData.name;
  frameJanks.appDur[index] = itemData.appDur;
  frameJanks.dur[index] = itemData.dur;
  frameJanks.ts[index] = itemData.ts;
  frameJanks.jankTag[index] = itemData.jankTag ? itemData.jankTag : 0;
  frameJanks.pid[index] = itemData.pid;
  frameJanks.rsTs[index] = itemData.rsTs;
  frameJanks.rsVsync[index] = itemData.rsVsync;
  frameJanks.rsDur[index] = itemData.rsDur;
  frameJanks.rsIpId[index] = itemData.rsIpid;
  frameJanks.rsPid[index] = itemData.rsPid;
  frameJanks.rsName[index] = itemData.rsName;
  frameJanks.depth[index] = itemData.depth;
}
function setResults(transfer: boolean, frameJanks: FrameJanks): any {
  return transfer
    ? {
        id: frameJanks.id.buffer,
        ipid: frameJanks.ipId.buffer,
        name: frameJanks.name.buffer,
        app_dur: frameJanks.appDur.buffer,
        dur: frameJanks.dur.buffer,
        ts: frameJanks.ts.buffer,
        jank_tag: frameJanks.jankTag.buffer,
        pid: frameJanks.pid.buffer,
        rs_ts: frameJanks.rsTs.buffer,
        rs_vsync: frameJanks.rsVsync.buffer,
        rs_dur: frameJanks.rsDur.buffer,
        rs_ipid: frameJanks.rsIpId.buffer,
        rs_pid: frameJanks.rsPid.buffer,
        rs_name: frameJanks.rsName.buffer,
        depth: frameJanks.depth.buffer,
      }
    : {};
}
function postFrameJanksMessage(data: any, transfer: boolean, frameJanks: FrameJanks, len: number) {
  let results = setResults(transfer, frameJanks);
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
      action: data.action,
      results: results,
      len: len,
      transfer: transfer,
    },
    transfer
      ? [
          frameJanks.id.buffer,
          frameJanks.ipId.buffer,
          frameJanks.name.buffer,
          frameJanks.appDur.buffer,
          frameJanks.dur.buffer,
          frameJanks.ts.buffer,
          frameJanks.jankTag.buffer,
          frameJanks.pid.buffer,
          frameJanks.rsTs.buffer,
          frameJanks.rsVsync.buffer,
          frameJanks.rsDur.buffer,
          frameJanks.rsIpId.buffer,
          frameJanks.rsPid.buffer,
          frameJanks.rsName.buffer,
          frameJanks.depth.buffer,
        ]
      : []
  );
}
class FrameJanks {
  id: Uint16Array;
  ipId: Uint16Array;
  name: Int32Array;
  appDur: Float64Array;
  dur: Float64Array;
  ts: Float64Array;
  jankTag: Uint16Array;
  pid: Uint16Array;
  rsTs: Float64Array;
  rsVsync: Int32Array;
  rsDur: Float64Array;
  rsIpId: Uint16Array;
  rsPid: Uint16Array;
  rsName: Int32Array;
  depth: Uint16Array;
  constructor(data: any, transfer: boolean, len: number) {
    this.id = new Uint16Array(transfer ? len : data.params.sharedArrayBuffers.id);
    this.ipId = new Uint16Array(transfer ? len : data.params.sharedArrayBuffers.ipid);
    this.name = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.name);
    this.appDur = new Float64Array(transfer ? len : data.params.sharedArrayBuffers.app_dur);
    this.dur = new Float64Array(transfer ? len : data.params.sharedArrayBuffers.dur);
    this.ts = new Float64Array(transfer ? len : data.params.sharedArrayBuffers.ts);
    this.jankTag = new Uint16Array(transfer ? len : data.params.sharedArrayBuffers.jank_tag);
    this.pid = new Uint16Array(transfer ? len : data.params.sharedArrayBuffers.pid);
    this.rsTs = new Float64Array(transfer ? len : data.params.sharedArrayBuffers.rs_ts);
    this.rsVsync = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.rs_vsync);
    this.rsDur = new Float64Array(transfer ? len : data.params.sharedArrayBuffers.rs_dur);
    this.rsIpId = new Uint16Array(transfer ? len : data.params.sharedArrayBuffers.rs_ipid);
    this.rsPid = new Uint16Array(transfer ? len : data.params.sharedArrayBuffers.rs_pid);
    this.rsName = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.rs_name);
    this.depth = new Uint16Array(transfer ? len : data.params.sharedArrayBuffers.depth);
  }
}
