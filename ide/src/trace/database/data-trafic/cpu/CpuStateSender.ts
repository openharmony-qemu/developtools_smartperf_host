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
import { CpuStateStruct } from '../../ui-worker/cpu/ProcedureWorkerCpuState';
import { Utils } from '../../../component/trace/base/Utils';

export function cpuStateSender(filterId: number, row: TraceRow<CpuStateStruct>): Promise<CpuStateStruct[]> {
  let trafic: number = TraficEnum.Memory;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      value: new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      dur: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startTs: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      height: new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve, reject): void => {
    getThreadPool(row.traceId).submitProto(
      QueryEnum.CpuStateData,
      {
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        recordStartNS: Utils.getInstance().getRecordStartNS(row.traceId),
        recordEndNS: Utils.getInstance().getRecordEndNS(row.traceId),
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
        filterId: filterId,
      },
      (res: unknown, len: number, transfer: boolean): void => {
        resolve(arrayBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
      }
    );
  });
}

function arrayBufferHandler(res: unknown, len: number): CpuStateStruct[] {
  let outArr: CpuStateStruct[] = [];
  // @ts-ignore
  let startTs = new Float64Array(res.startTs);
  // @ts-ignore
  let dur = new Float64Array(res.dur);
  // @ts-ignore
  let value = new Uint32Array(res.value);
  // @ts-ignore
  let height = new Uint8Array(res.value);
  for (let i = 0; i < len; i++) {
    outArr.push({
      value: value[i],
      dur: dur[i],
      height: height[i],
      startTs: startTs[i],
    } as unknown as CpuStateStruct);
  }
  return outArr;
}
