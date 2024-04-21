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
import { processFrameList } from './utils/AllMemoryCache';
import { Args } from './CommonArgs';

export const frameJankDataSql = (args: Args, configure: unknown): string => {
  let timeLimit: string = '';
  let flag: string = '';
  let fsType: number = -1;
  let fsFlag: string = '';
  //@ts-ignore
  const endNS = args.endNS;
  //@ts-ignore
  const startNS = args.startNS;
  //@ts-ignore
  const recordStartNS = args.recordStartNS;
  switch (configure) {
    case 'ExepectMemory':
      fsType = 1;
      flag = 'fs.flag as jankTag,';
      break;
    case 'ExpectedData':
      fsType = 1;
      flag = 'fs.flag as jankTag,';
      timeLimit = `
       AND (fs.ts - ${recordStartNS} + fs.dur) >= ${Math.floor(startNS)}
       AND (fs.ts - ${recordStartNS}) <= ${Math.floor(endNS)}`;
      break;
    case 'ActualMemoryData':
      fsType = 0;
      flag =
        '(case when (sf.flag == 1 or fs.flag == 1 ) then 1 when (sf.flag == 3 or fs.flag == 3 ) then 3 else 0 end) as jankTag,';
      fsFlag = 'AND fs.flag <> 2';
      break;
    case 'ActualData':
      fsType = 0;
      flag =
        '(case when (sf.flag == 1 or fs.flag == 1 ) then 1 when (sf.flag == 3 or fs.flag == 3 ) then 3 else 0 end) as jankTag,';
      fsFlag = 'AND fs.flag <> 2';
      timeLimit = `AND (fs.ts - ${recordStartNS} + fs.dur) >= ${Math.floor(startNS)}
       AND (fs.ts - ${recordStartNS}) <= ${Math.floor(endNS)}`;
      break;
    default:
      break;
  }
  let sql = setFrameJanksSql(args, timeLimit, flag, fsType, fsFlag);
  return sql;
};
function setFrameJanksSql(args: Args, timeLimit: string, flag: string, fsType: number, fsFlag: string): string {
  //@ts-ignore
  const recordStartNS = args.recordStartNS;
  return `SELECT sf.id,
            'frameTime' as frameType,
            fs.ipid,
            fs.vsync as name,
            fs.dur as appDur,
            (sf.ts + sf.dur - fs.ts) as dur,
            (fs.ts - ${recordStartNS}) AS ts,
            fs.type,
            ${flag}
            pro.pid,
            pro.name as cmdline,
            (sf.ts - ${recordStartNS}) AS rsTs,
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
            (fs.ts - ${recordStartNS}) AS ts,
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

export function frameExpectedReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    if (!processFrameList.has('FrameTimeLine_expected')) {
      // @ts-ignore
      let sql = frameJankDataSql(data.params, 'ExepectMemory');
      processFrameList.set('FrameTimeLine_expected', proc(sql));
    }
    frameJanksReceiver(data, processFrameList.get('FrameTimeLine_expected')!, 'expected', true);
  } else {
    // @ts-ignore
    let sql = frameJankDataSql(data.params, 'ExpectedData');
    let res = proc(sql);
    // @ts-ignore
    frameJanksReceiver(data, res, 'expect', data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

export function frameActualReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    if (!processFrameList.has('FrameTimeLine_actual')) {
      // @ts-ignore
      let sql = frameJankDataSql(data.params, 'ActualMemoryData');
      processFrameList.set('FrameTimeLine_actual', proc(sql));
    }
    frameJanksReceiver(data, processFrameList.get('FrameTimeLine_actual')!, 'actual', true);
  } else {
    // @ts-ignore
    let sql = frameJankDataSql(data.params, 'ActualData');
    let res = proc(sql);
    // @ts-ignore
    frameJanksReceiver(data, res, 'actual', data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}
let isIntersect = (leftData: JanksStruct, rightData: JanksStruct): boolean =>
  Math.max(leftData.ts! + leftData.dur!, rightData.ts! + rightData.dur!) - Math.min(leftData.ts!, rightData.ts!) <
  leftData.dur! + rightData.dur!;
function frameJanksReceiver(data: unknown, res: unknown[], type: string, transfer: boolean): void {
  let frameJanks = new FrameJanks(data, transfer, res.length);
  let unitIndex: number = 1;
  let depths: unknown[] = [];
  for (let index = 0; index < res.length; index++) {
    let item = res[index];
    // @ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (item = item.frameData);
    // @ts-ignore
    if (!item.dur || item.dur < 0) {
      continue;
    }
    if (depths.length === 0) {
      // @ts-ignore
      item.depth = 0;
      depths[0] = item;
    } else {
      let depthIndex: number = 0;
      let isContinue: boolean = true;
      while (isContinue) {
        // @ts-ignore
        if (isIntersect(depths[depthIndex], item)) {
          if (depths[depthIndex + unitIndex] === undefined || !depths[depthIndex + unitIndex]) {
            // @ts-ignore
            item.depth = depthIndex + unitIndex;
            depths[depthIndex + unitIndex] = item;
            isContinue = false;
          }
        } else {
          // @ts-ignore
          item.depth = depthIndex;
          depths[depthIndex] = item;
          isContinue = false;
        }
        depthIndex++;
      }
    }
    setFrameJanks(frameJanks, item, index);
  }
  postFrameJanksMessage(data, transfer, frameJanks, res.length);
}
function setFrameJanks(frameJanks: FrameJanks, itemData: unknown, index: number): void {
  // @ts-ignore
  frameJanks.id[index] = itemData.id;
  // @ts-ignore
  frameJanks.ipId[index] = itemData.ipid;
  // @ts-ignore
  frameJanks.name[index] = itemData.name;
  // @ts-ignore
  frameJanks.appDur[index] = itemData.appDur;
  // @ts-ignore
  frameJanks.dur[index] = itemData.dur;
  // @ts-ignore
  frameJanks.ts[index] = itemData.ts;
  // @ts-ignore
  frameJanks.jankTag[index] = itemData.jankTag ? itemData.jankTag : 0;
  // @ts-ignore
  frameJanks.pid[index] = itemData.pid;
  // @ts-ignore
  frameJanks.rsTs[index] = itemData.rsTs;
  // @ts-ignore
  frameJanks.rsVsync[index] = itemData.rsVsync;
  // @ts-ignore
  frameJanks.rsDur[index] = itemData.rsDur;
  // @ts-ignore
  frameJanks.rsIpId[index] = itemData.rsIpid;
  // @ts-ignore
  frameJanks.rsPid[index] = itemData.rsPid;
  // @ts-ignore
  frameJanks.rsName[index] = itemData.rsName;
  // @ts-ignore
  frameJanks.depth[index] = itemData.depth;
}
function setResults(transfer: boolean, frameJanks: FrameJanks): unknown {
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
function postFrameJanksMessage(data: unknown, transfer: boolean, frameJanks: FrameJanks, len: number): void {
  let results = setResults(transfer, frameJanks);
  (self as unknown as Worker).postMessage(
    {
      // @ts-ignore
      id: data.id,
      // @ts-ignore
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
  constructor(data: unknown, transfer: boolean, len: number) {
    // @ts-ignore
    this.id = new Uint16Array(transfer ? len : data.params.sharedArrayBuffers.id);
    // @ts-ignore
    this.ipId = new Uint16Array(transfer ? len : data.params.sharedArrayBuffers.ipid);
    // @ts-ignore
    this.name = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.name);
    // @ts-ignore
    this.appDur = new Float64Array(transfer ? len : data.params.sharedArrayBuffers.app_dur);
    // @ts-ignore
    this.dur = new Float64Array(transfer ? len : data.params.sharedArrayBuffers.dur);
    // @ts-ignore
    this.ts = new Float64Array(transfer ? len : data.params.sharedArrayBuffers.ts);
    // @ts-ignore
    this.jankTag = new Uint16Array(transfer ? len : data.params.sharedArrayBuffers.jank_tag);
    // @ts-ignore
    this.pid = new Uint16Array(transfer ? len : data.params.sharedArrayBuffers.pid);
    // @ts-ignore
    this.rsTs = new Float64Array(transfer ? len : data.params.sharedArrayBuffers.rs_ts);
    // @ts-ignore
    this.rsVsync = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.rs_vsync);
    // @ts-ignore
    this.rsDur = new Float64Array(transfer ? len : data.params.sharedArrayBuffers.rs_dur);
    // @ts-ignore
    this.rsIpId = new Uint16Array(transfer ? len : data.params.sharedArrayBuffers.rs_ipid);
    // @ts-ignore
    this.rsPid = new Uint16Array(transfer ? len : data.params.sharedArrayBuffers.rs_pid);
    // @ts-ignore
    this.rsName = new Int32Array(transfer ? len : data.params.sharedArrayBuffers.rs_name);
    // @ts-ignore
    this.depth = new Uint16Array(transfer ? len : data.params.sharedArrayBuffers.depth);
  }
}
