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
import { LogStruct } from '../ui-worker/ProcedureWorkerLog';

export function LogDataSender(row: TraceRow<LogStruct>): Promise<LogStruct[]> {
  let trafic: number = TraficEnum.ProtoBuffer;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      id: new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startTs: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      pid: new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT * MAX_COUNT),
      tid: new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT * MAX_COUNT),
      dur: new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT * MAX_COUNT),
      depth: new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve) => {
    threadPool.submitProto(
      QueryEnum.HilogData,
      {
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
        oneDayTime: window.recordEndNS - ONE_DAY_NS,
      },
      (res: any, len: number, transfer: boolean) => {
        resolve(arrayBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
      }
    );
  });
}

function arrayBufferHandler(res: any, len: number) {
  let outArr: LogStruct[] = [];
  let id = new Uint16Array(res.id);
  let startTs = new Float64Array(res.startTs);
  let pid = new Uint16Array(res.pid);
  let tid = new Uint16Array(res.tid);
  let dur = new Uint16Array(res.dur);
  let depth = new Uint16Array(res.depth);
  for (let index = 0; index < len; index++) {
    outArr.push({
      id: id[index],
      startTs: startTs[index],
      pid: pid[index],
      tid: tid[index],
      dur: dur[index],
      depth: depth[index],
    } as unknown as LogStruct);
  }
  return outArr;
}

const ONE_DAY_NS = 86_400_000_000_000;
