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
import { CpuFreqStruct } from '../../ui-worker/ProcedureWorkerFreq';
import { Utils } from '../../../component/trace/base/Utils';

export function cpuFreqDataSender(cpu: number, row: TraceRow<CpuFreqStruct>): Promise<CpuFreqStruct[]> {
  let trafic: number = TraficEnum.Memory;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      cpu: new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT * MAX_COUNT),
      value: new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      dur: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startNS: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve): void => {
    getThreadPool(row.traceId).submitProto(
      QueryEnum.CpuFreqData,
      {
        cpu: cpu,
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        recordStartNS: Utils.getInstance().getRecordStartNS(row.traceId),
        recordEndNS: Utils.getInstance().getRecordEndNS(row.traceId),
        t: Date.now(),
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
        width: width,
      },
      (res: unknown, len: number, transfer: boolean): void => {
        resolve(arrayBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
      }
    );
  });
}

function arrayBufferHandler(buffers: unknown, len: number): CpuFreqStruct[] {
  let outArr: CpuFreqStruct[] = [];
  // @ts-ignore
  let cpu = new Uint8Array(buffers.cpu);
  // @ts-ignore
  let value = new Uint32Array(buffers.value);
  // @ts-ignore
  let startNS = new Float64Array(buffers.startNS);
  // @ts-ignore
  let dur = new Float64Array(buffers.dur);
  for (let i = 0; i < len; i++) {
    outArr.push({
      cpu: cpu[i],
      value: value[i],
      dur: dur[i],
      startNS: startNS[i],
    } as CpuFreqStruct);
  }
  return outArr;
}
