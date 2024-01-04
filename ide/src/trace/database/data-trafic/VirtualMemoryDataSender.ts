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

import { CHART_OFFSET_LEFT, MAX_COUNT, QueryEnum, TraficEnum } from './QueryEnum';
import { threadPool } from '../SqlLite';
import { TraceRow } from '../../component/trace/base/TraceRow';
import { VirtualMemoryStruct } from '../ui-worker/ProcedureWorkerVirtualMemory';

export function virtualMemoryDataSender(
  filterId: number,
  row: TraceRow<VirtualMemoryStruct>
): Promise<VirtualMemoryStruct[]> {
  let trafic: number = TraficEnum.ProtoBuffer;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      filterID: new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT * MAX_COUNT),
      value: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startTime: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve, reject) => {
    threadPool.submitProto(
      QueryEnum.VirtualMemoryData,
      {
        filterId: filterId,
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        t: Date.now(),
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
      },
      (res: any, len: number) => {
        switch (trafic) {
          case TraficEnum.SharedArrayBuffer:
            resolve(arrayBufferHandler(row.sharedArrayBuffers, len));
            break;
          case TraficEnum.ProtoBuffer:
            resolve(arrayBufferHandler(res, len));
            break;
          case TraficEnum.TransferArrayBuffer:
            resolve(arrayBufferHandler(res, len));
            break;
        }
      }
    );
  });
}

function arrayBufferHandler(buffers: any, len: number) {
  let outArr: VirtualMemoryStruct[] = [];
  let filterID = new Uint8Array(buffers.filterID);
  let value = new Int32Array(buffers.value);
  let startTime = new Float64Array(buffers.startTime);
  for (let i = 0; i < len; i++) {
    outArr.push({
      filterID: filterID[i],
      value: value[i],
      startTime: startTime[i],
    } as unknown as VirtualMemoryStruct);
  }
  return outArr;
}
