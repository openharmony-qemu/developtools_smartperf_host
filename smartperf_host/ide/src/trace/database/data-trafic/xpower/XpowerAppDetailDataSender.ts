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

import { CHART_OFFSET_LEFT, MAX_COUNT, QueryEnum, TraficEnum } from '../utils/QueryEnum';
import { getThreadPool } from '../../SqlLite';
import { TraceRow } from '../../../component/trace/base/TraceRow';
import { Utils } from '../../../component/trace/base/Utils';
import { XpowerAppDetailStruct } from '../../ui-worker/ProcedureWorkerXpowerAppDetail';

export function xpowerAppDetailDataSender(
  row: TraceRow<XpowerAppDetailStruct>,
  args?: unknown
): Promise<XpowerAppDetailStruct[]> {
  let trafic: number = TraficEnum.Memory;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      startTime: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      c1hz: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      c5hz: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      c10hz: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      c15hz: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      c24hz: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      c30hz: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      c45hz: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      c60hz: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      c90hz: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      c120hz: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      c180hz: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve, reject): void => {
    getThreadPool(row.traceId).submitProto(
      QueryEnum.XpowerAppDetailData,
      {
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        totalNS: TraceRow.range?.totalNS || 0,
        recordStartNS: Utils.getInstance().getRecordStartNS(row.traceId),
        recordEndNS: Utils.getInstance().getRecordEndNS(row.traceId),
        // @ts-ignore
        queryAll: args && args.queryAll,
        // @ts-ignore
        selectStartNS: args ? args.startNS : 0,
        // @ts-ignore
        selectEndNS: args ? args.endNS : 0,
        // @ts-ignore
        selectTotalNS: args ? args.endNS - args.startNS : 0,
        t: Date.now(),
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
      },
      (res: unknown, len: number, transfer: boolean): void => {
        resolve(arrayBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
      }
    );
  });
}

function arrayBufferHandler(buffers: unknown, len: number): XpowerAppDetailStruct[] {
  let outArr: XpowerAppDetailStruct[] = [];
  // @ts-ignore
  let startTime = new Float64Array(buffers.startTime);
  // @ts-ignore
  let c1hz = new Float64Array(buffers.c1hz);
  // @ts-ignore
  let c5hz = new Float64Array(buffers.c5hz);
  // @ts-ignore
  let c10hz = new Float64Array(buffers.c10hz);
  // @ts-ignore
  let c15hz = new Float64Array(buffers.c15hz);
  // @ts-ignore
  let c24hz = new Float64Array(buffers.c24hz);
  // @ts-ignore
  let c30hz = new Float64Array(buffers.c30hz);
  // @ts-ignore
  let c45hz = new Float64Array(buffers.c45hz);
  // @ts-ignore
  let c60hz = new Float64Array(buffers.c60hz);
  // @ts-ignore
  let c90hz = new Float64Array(buffers.c90hz);
  // @ts-ignore
  let c120hz = new Float64Array(buffers.c120hz);
  // @ts-ignore
  let c180hz = new Float64Array(buffers.c180hz);
  for (let i = 0; i < len; i++) {
    outArr.push({
      startTime: startTime[i],
      c1hz: c1hz[i],
      c5hz: c5hz[i],
      c10hz: c10hz[i],
      c15hz: c15hz[i],
      c24hz: c24hz[i],
      c30hz: c30hz[i],
      c45hz: c45hz[i],
      c60hz: c60hz[i],
      c90hz: c90hz[i],
      c120hz: c120hz[i],
      c180hz: c180hz[i],
    } as unknown as XpowerAppDetailStruct);
  }
  return outArr;
}
