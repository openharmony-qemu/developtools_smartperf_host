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
import { CpuFreqLimitsStruct } from '../../ui-worker/cpu/ProcedureWorkerCpuFreqLimits';
import { Utils } from '../../../component/trace/base/Utils';

export function cpuFreqLimitSender(
  maxId: number,
  minId: number,
  cpu: number,
  row: TraceRow<CpuFreqLimitsStruct>
): Promise<CpuFreqLimitsStruct[]> {
  let trafic: number = TraficEnum.Memory;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      value: new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      max: new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      min: new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      dur: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startNs: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve, reject): void => {
    getThreadPool(row.traceId).submitProto(
      QueryEnum.CpuFreqLimitData,
      {
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        recordStartNS: Utils.getInstance().getRecordStartNS(row.traceId),
        recordEndNS: Utils.getInstance().getRecordEndNS(row.traceId),
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
        maxId: maxId,
        minId: minId,
        cpu: cpu,
      },
      (res: unknown, len: number, transfer: boolean): void => {
        resolve(arrayBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
      }
    );
  });
}

function arrayBufferHandler(res: unknown, len: number): CpuFreqLimitsStruct[] {
  let outArr: CpuFreqLimitsStruct[] = [];
  // @ts-ignore
  let startNs = new Float64Array(res.startNs);
  // @ts-ignore
  let dur = new Float64Array(res.dur);
  // @ts-ignore
  let value = new Uint32Array(res.value);
  // @ts-ignore
  let max = new Uint32Array(res.max);
  // @ts-ignore
  let min = new Uint32Array(res.min);
  for (let i = 0; i < len; i++) {
    outArr.push({
      value: value[i],
      max: max[i],
      min: min[i],
      dur: dur[i],
      startNs: startNs[i],
    } as unknown as CpuFreqLimitsStruct);
  }
  return outArr;
}
