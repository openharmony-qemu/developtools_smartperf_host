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
import { JanksStruct } from '../../bean/JanksStruct';

export const chartExpectedMemoryDataSql = (args: any): string => {
  return `
      SELECT
          sf.id,
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
      UNION
      SELECT
          -1 as id,
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
          NULL AS rsTs,
          NULL AS rsVsync,
          NULL AS rsDur,
          NULL AS rsIpid,
          NULL AS rsPid,
          NULL AS rsName
      FROM frame_slice AS fs
               LEFT JOIN process AS pro ON pro.id = fs.ipid
      WHERE fs.dst IS NULL
        AND pro.name NOT LIKE '%render_service%'
        AND fs.type = 1
        Order by ts`;
};

export const chartExpectedDataSql = (args: any): string => {
  return `
      SELECT
          sf.id,
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
      SELECT
          -1 as id,
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
          NULL AS rsTs,
          NULL AS rsVsync,
          NULL AS rsDur,
          NULL AS rsIpid,
          NULL AS rsPid,
          NULL AS rsName
      FROM frame_slice AS fs
               LEFT JOIN process AS pro ON pro.id = fs.ipid
      WHERE fs.dst IS NULL
        AND pro.name NOT LIKE '%render_service%'
        AND fs.type = 1
        AND (fs.ts - ${args.recordStartNS} + fs.dur) >= ${Math.floor(args.startNS)}
        AND (fs.ts - ${args.recordStartNS}) <= ${Math.floor(args.endNS)}
        Order by ts`;
};

export const chartActualMemoryDataSql = (args: any): string => {
  return `
      SELECT
          sf.id,
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
      SELECT
          -1 as id,
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
          NULL AS rsTs,
          NULL AS rsVsync,
          NULL AS rsDur,
          NULL AS rsIpid,
          NULL AS rsPid,
          NULL AS rsName
      FROM frame_slice AS fs
               LEFT JOIN process AS pro ON pro.id = fs.ipid
      WHERE fs.dst IS NULL
        AND pro.name NOT LIKE '%render_service%'
        AND fs.type = 0
        AND fs.flag <> 2
        Order by ts;`;
};

export const chartActualDataSql = (args: any): string => {
  return `
      SELECT
          sf.id,
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
      SELECT
          -1 as id,
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
          NULL AS rsTs,
          NULL AS rsVsync,
          NULL AS rsDur,
          NULL AS rsIpid,
          NULL AS rsPid,
          NULL AS rsName
      FROM frame_slice AS fs
               LEFT JOIN process AS pro ON pro.id = fs.ipid
      WHERE fs.dst IS NULL
        AND pro.name NOT LIKE '%render_service%'
        AND fs.type = 0
        AND fs.flag <> 2
        AND (fs.ts - ${args.recordStartNS} + fs.dur) >= ${Math.floor(args.startNS)}
        AND (fs.ts - ${args.recordStartNS}) <= ${Math.floor(args.endNS)}
        Order by ts`;
};

let frameDepthList: Map<string, number> = new Map();

export function frameExpectedReceiver(data: any, proc: Function): void {
  if (data.params.trafic === TraficEnum.Memory) {
    frameDepthList = new Map<string, number>();
    let sql = chartExpectedMemoryDataSql(data.params);
    let res = proc(sql);
    frameJanksReceiver(data, res, 'expect', false);
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
    frameJanksReceiver(data, res, 'actual', false);
  } else {
    let sql = chartActualDataSql(data.params);
    let res = proc(sql);
    frameJanksReceiver(data, res, 'actual', data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

function frameJanksReceiver(data: any, res: any[], type: string, transfer: boolean): void {
  let id = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.id);
  let ipId = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.ipid);
  let name = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.name);
  let appDur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.app_dur);
  let dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  let ts = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.ts);
  let jankTag = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.jank_tag);
  let pid = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.pid);
  let rsTs = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.rs_ts);
  let rsVsync = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.rs_vsync);
  let rsDur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.rs_dur);
  let rsIpId = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.rs_ipid);
  let rsPid = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.rs_pid);
  let rsName = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.rs_name);
  let depth = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.depth);
  if (data.params.trafic === TraficEnum.Memory) {
    let unitIndex: number = 1;
    let isIntersect = (leftData: JanksStruct, rightData: JanksStruct): boolean =>
        Math.max(leftData.ts! + leftData.dur!, rightData.ts! + rightData.dur!) - Math.min(leftData.ts!, rightData.ts!) <
        leftData.dur! + rightData.dur!;
    let depths = [];
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
      id[index] = itemData.id;
      ipId[index] = itemData.ipid;
      name[index] = itemData.name;
      appDur[index] = itemData.appDur;
      dur[index] = itemData.dur;
      ts[index] = itemData.ts;
      jankTag[index] = itemData.jankTag ? itemData.jankTag : 0;
      pid[index] = itemData.pid;
      rsTs[index] = itemData.rsTs;
      rsVsync[index] = itemData.rsVsync;
      rsDur[index] = itemData.rsDur;
      rsIpId[index] = itemData.rsIpid;
      rsPid[index] = itemData.rsPid;
      rsName[index] = itemData.rsName;
      depth[index] = itemData.depth;
      frameDepthList.set(`${type}_${itemData.id}_${itemData.ipid}_${itemData.name}`, itemData.depth);
    }
  } else {
    for (let index = 0; index < res.length; index++) {
      let itemData = res[index];
      data.params.trafic === TraficEnum.ProtoBuffer && (itemData = itemData.frameData);
      id[index] = itemData.id;
      ipId[index] = itemData.ipid;
      name[index] = itemData.name;
      appDur[index] = itemData.appDur;
      dur[index] = itemData.dur;
      ts[index] = itemData.ts;
      jankTag[index] = itemData.jankTag ? itemData.jankTag : 0;
      pid[index] = itemData.pid;
      rsTs[index] = itemData.rsTs;
      rsVsync[index] = itemData.rsVsync;
      rsDur[index] = itemData.rsDur;
      rsIpId[index] = itemData.rsIpid;
      rsPid[index] = itemData.rsPid;
      rsName[index] = itemData.rsName;
      depth[index] = itemData.depth;
      if (frameDepthList.has(`${type}_${itemData.id}_${itemData.ipid}_${itemData.name}`)) {
        depth[index] = frameDepthList.get(`${type}_${itemData.id}_${itemData.ipid}_${itemData.name}`)!;
      }
    }
  }
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
      action: data.action,
      results: transfer
        ? {
            id: id.buffer,
            ipid: ipId.buffer,
            name: name.buffer,
            app_dur: appDur.buffer,
            dur: dur.buffer,
            ts: ts.buffer,
            jank_tag: jankTag.buffer,
            pid: pid.buffer,
            rs_ts: rsTs.buffer,
            rs_vsync: rsVsync.buffer,
            rs_dur: rsDur.buffer,
            rs_ipid: rsIpId.buffer,
            rs_pid: rsPid.buffer,
            rs_name: rsName.buffer,
            depth: depth.buffer,
          }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer
      ? [
          id.buffer,
          ipId.buffer,
          name.buffer,
          appDur.buffer,
          dur.buffer,
          ts.buffer,
          jankTag.buffer,
          pid.buffer,
          rsTs.buffer,
          rsVsync.buffer,
          rsDur.buffer,
          rsIpId.buffer,
          rsPid.buffer,
          rsName.buffer,
          depth.buffer,
        ]
      : []
  );
}
