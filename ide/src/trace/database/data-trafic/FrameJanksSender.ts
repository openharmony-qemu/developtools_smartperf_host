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

import { CHART_OFFSET_LEFT, MAX_COUNT, TraficEnum } from './utils/QueryEnum';
import { threadPool } from '../SqlLite';
import { TraceRow } from '../../component/trace/base/TraceRow';
import { JanksStruct } from '../../bean/JanksStruct';

export function frameJanksSender(queryEnum: number, row: TraceRow<JanksStruct>): Promise<JanksStruct[]> {
  let transferJankDataType: number = TraficEnum.Memory;
  if (row.isComplete) {
    transferJankDataType = TraficEnum.ProtoBuffer;
  }
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if ((transferJankDataType === TraficEnum.SharedArrayBuffer) && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      id: new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT * MAX_COUNT),
      ipid: new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT * MAX_COUNT),
      name: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      app_dur: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      dur: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      ts: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      jank_tag: new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT * MAX_COUNT),
      pid: new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT * MAX_COUNT),
      rs_ts: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      rs_vsync: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      rs_dur: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      rs_ipid: new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT * MAX_COUNT),
      rs_pid: new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT * MAX_COUNT),
      rs_name: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      depth: new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve): void => {
    threadPool.submitProto(
      queryEnum,
      {
        queryEnum: queryEnum,
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        width: width,
        t: new Date().getTime(),
        trafic: transferJankDataType,
        sharedArrayBuffers: row.sharedArrayBuffers,
      },
      (res: any, len: number, transfer: boolean): void => {
        resolve(arrayBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
      }
    );
  });
}

function arrayBufferHandler(res: any, len: number): any[] {
  let outArr = [];
  let id = new Uint16Array(res.id);
  let ipId = new Uint16Array(res.ipid);
  let nameId = new Int32Array(res.name);
  let app_dur = new Float64Array(res.app_dur);
  let dur = new Float64Array(res.dur);
  let ts = new Float64Array(res.ts);
  let jank_tag = new Uint16Array(res.jank_tag);
  let pid = new Uint16Array(res.pid);
  let rsTs = new Float64Array(res.rs_ts);
  let rs_vsync = new Int32Array(res.rs_vsync);
  let rs_dur = new Float64Array(res.rs_dur);
  let rs_ipId = new Uint16Array(res.rs_ipid);
  let rs_pid = new Uint16Array(res.rs_pid);
  let rs_name = new Int32Array(res.rs_name);
  let depth = new Uint16Array(res.depth);
  for (let index = 0; index < len; index++) {
    outArr.push({
      id: id[index],
      ipid: ipId[index],
      name: nameId[index],
      app_dur: app_dur[index],
      dur: dur[index],
      ts: ts[index],
      jank_tag: jank_tag[index],
      pid: pid[index],
      rs_ts: rsTs[index],
      rs_vsync: rs_vsync[index],
      rs_dur: rs_dur[index],
      rs_ipid: rs_ipId[index],
      rs_pid: rs_pid[index],
      rs_name: rs_name[index],
      depth: depth[index],
    });
  }
  return outArr;
}
