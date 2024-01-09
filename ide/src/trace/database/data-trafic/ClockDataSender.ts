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

import { CHART_OFFSET_LEFT, MAX_COUNT, QueryEnum, TraficEnum } from './utils/QueryEnum';
import { threadPool } from '../SqlLite';
import { TraceRow } from '../../component/trace/base/TraceRow';
import { ClockStruct } from '../ui-worker/ProcedureWorkerClock';

export function clockDataSender(
  clockName: string = '',
  sqlType: string,
  row: TraceRow<ClockStruct>,
  args?: any
): Promise<ClockStruct[]> {
  let trafic: number = TraficEnum.Memory;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if ((trafic === TraficEnum.SharedArrayBuffer) && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      filterId: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      value: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startNS: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      dur: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve, reject): void => {
    threadPool.submitProto(
      QueryEnum.ClockData,
      {
        clockName: clockName,
        sqlType: sqlType,
        startNS: args ? args.startNS : (TraceRow.range?.startNS || 0),
        endNS: args ? args.endNS : (TraceRow.range?.endNS || 0),
        totalNS: args ? (args.endNS - args.startNS) : (TraceRow.range?.totalNS || 0),
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        queryAll: args && args.queryAll,
        t: Date.now(),
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
      },
      (res: any, len: number, transfer: boolean): void => {
        resolve(arrayBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
      }
    );
  });
}

function arrayBufferHandler(buffers: any, len: number): ClockStruct[] {
  let outArr: ClockStruct[] = [];
  let filterId = new Int32Array(buffers.filterId);
  let value = new Int32Array(buffers.value);
  let startNS = new Float64Array(buffers.startNS);
  let dur = new Float64Array(buffers.dur);
  for (let i = 0; i < len; i++) {
    outArr.push({
      filterId: filterId[i],
      value: value[i],
      startNS: startNS[i],
      dur: dur[i],
    } as unknown as ClockStruct);
  }
  return outArr;
}
