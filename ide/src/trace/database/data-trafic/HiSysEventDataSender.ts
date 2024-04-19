/*
 * Copyright (C) 2022 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { CHART_OFFSET_LEFT, MAX_COUNT, QueryEnum, TraficEnum } from './utils/QueryEnum';
import { threadPool } from '../SqlLite';
import { TraceRow } from '../../component/trace/base/TraceRow';
import { HiSysEventStruct } from '../ui-worker/ProcedureWorkerHiSysEvent';

export function hiSysEventDataSender(row: TraceRow<HiSysEventStruct>): Promise<HiSysEventStruct[]> {
  let trafic: number = TraficEnum.ProtoBuffer;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      id: new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT * MAX_COUNT),
      ts: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      pid: new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT * MAX_COUNT),
      tid: new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT * MAX_COUNT),
      uid: new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT * MAX_COUNT),
      dur: new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT * MAX_COUNT),
      depth: new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT * MAX_COUNT),
      seq: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve) => {
    threadPool.submitProto(
      QueryEnum.HiSysEventData,
      {
        width: width,
        trafic: trafic,
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        sharedArrayBuffers: row.sharedArrayBuffers,
      },
      (res: unknown, len: number, transfer: boolean) => {
        resolve(arrayBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
      }
    );
  });
}

function arrayBufferHandler(res: unknown, len: number): HiSysEventStruct[] {
  let outArr: HiSysEventStruct[] = [];
  // @ts-ignore
  let id = new Uint16Array(res.id);
  // @ts-ignore
  let ts = new Float64Array(res.ts);
  // @ts-ignore
  let pid = new Uint16Array(res.pid);
  // @ts-ignore
  let tid = new Uint16Array(res.tid);
  // @ts-ignore
  let uid = new Uint16Array(res.uid);
  // @ts-ignore
  let seq = new Float64Array(res.seq);
  // @ts-ignore
  let dur = new Uint16Array(res.dur);
  // @ts-ignore
  let depth = new Uint16Array(res.depth);
  for (let index = 0; index < len; index++) {
    outArr.push({
      id: id[index],
      ts: ts[index],
      pid: pid[index],
      tid: tid[index],
      uid: uid[index],
      dur: dur[index],
      depth: depth[index],
      seq: seq[index],
    } as unknown as HiSysEventStruct);
  }
  return outArr;
}
