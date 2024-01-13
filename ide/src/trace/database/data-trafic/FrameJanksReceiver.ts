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

export const frameJankDataSql = (args: any, configure: any): string => {
  let timeLimit: string = '';
  let flag: string = '';
  let fsType: number = -1;
  let fsFlag: string = '';
  switch (configure) {
    case 'ExepectMemory':
      fsType = 1;
      flag = `fs.flag as jankTag,`;
      break;
    case 'ExpectedData':
      fsType = 1;
      flag = `fs.flag as jankTag,`;
      timeLimit = `
       AND (fs.ts - ${args.recordStartNS} + fs.dur) >= ${Math.floor(args.startNS)}
       AND (fs.ts - ${args.recordStartNS}) <= ${Math.floor(args.endNS)}`;
      break;
    case 'ActualMemoryData':
      fsType = 0;
      flag = `(case when (sf.flag == 1 or fs.flag == 1 ) then 1 when (sf.flag == 3 or fs.flag == 3 ) then 3 else 0 end) as jankTag,`;
      fsFlag = 'AND fs.flag <> 2';
      break;
    case 'ActualData':
      fsType = 0;
      flag = `(case when (sf.flag == 1 or fs.flag == 1 ) then 1 when (sf.flag == 3 or fs.flag == 3 ) then 3 else 0 end) as jankTag,`;
      fsFlag = 'AND fs.flag <> 2';
      timeLimit = `AND (fs.ts - ${args.recordStartNS} + fs.dur) >= ${Math.floor(args.startNS)}
       AND (fs.ts - ${args.recordStartNS}) <= ${Math.floor(args.endNS)}`;
      break;
    default:
      break;
  }
  let sql = setFrameJanksSql(args, timeLimit, flag, fsType, fsFlag);
  return sql;
};
function setFrameJanksSql(args: any, timeLimit: string, flag: string, fsType: number, fsFlag: string): string {
  return `SELECT sf.id,
            'frameTime' as frameType,
            fs.ipid,
            fs.vsync as name,
            fs.dur as appDur,
            (sf.ts + sf.dur - fs.ts) as dur,
            (fs.ts - ${args.recordStartNS}) AS ts,
            fs.type,
            ${flag}
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
        AND fs.type = ${fsType}
        ${fsFlag} ${timeLimit}
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
        ${fsFlag} ${timeLimit}
        ORDER by ts`;
}
let frameDepthList: Map<string, number> = new Map();

export function frameExpectedReceiver(data: any, proc: Function): void {
  if (data.params.trafic === TraficEnum.Memory) {
    frameDepthList = new Map<string, number>();
    let sql = frameJankDataSql(data.params, 'ExepectMemory');
    let res = proc(sql);
    frameJanksReceiver(data, res, 'expect', true);
  } else {
    let sql = frameJankDataSql(data.params, 'ExpectedData');
    let res = proc(sql);
    frameJanksReceiver(data, res, 'expect', data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

export function frameActualReceiver(data: any, proc: Function): void {
  if (data.params.trafic === TraficEnum.Memory) {
    let sql = frameJankDataSql(data.params, 'ActualMemoryData');
    let res = proc(sql);
    frameJanksReceiver(data, res, 'actual', true);
  } else {
    let sql = frameJankDataSql(data.params, 'ActualData');
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
      let item = res[index];
      data.params.trafic === TraficEnum.ProtoBuffer && (item = item.frameData);
      if (!item.dur || item.dur < 0) {
        continue;
      }
      if (depths.length === 0) {
        item.depth = 0;
        depths[0] = item;
      } else {
        let depthIndex: number = 0;
        let isContinue: boolean = true;
        while (isContinue) {
          if (isIntersect(depths[depthIndex], item)) {
            if (depths[depthIndex + unitIndex] === undefined || !depths[depthIndex + unitIndex]) {
              item.depth = depthIndex + unitIndex;
              depths[depthIndex + unitIndex] = item;
              isContinue = false;
            }
          } else {
            item.depth = depthIndex;
            depths[depthIndex] = item;
            isContinue = false;
          }
          depthIndex++;
        }
      }
      setFrameJanks(frameJanks, item, index);
      frameDepthList.set(`${type}_${item.id}_${item.ipid}_${item.name}`, item.depth);
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
