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

import { TraceRow } from '../../../component/trace/base/TraceRow';
import { CHART_OFFSET_LEFT, MAX_COUNT, QueryEnum, TraficEnum } from '../utils/QueryEnum';
import { threadPool } from '../../SqlLite';
import { HiPerfCpuStruct } from '../../ui-worker/hiperf/ProcedureWorkerHiPerfCPU2';

export function hiperfCpuDataSender(
  cpu: number,
  drawType: number,
  maxCpuCount: number,
  intervalPerf: number,
  scale: number,
  row: TraceRow<any>
): Promise<any[]> {
  let trafic: number = TraficEnum.ProtoBuffer;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      height: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startNS: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      eventCount: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      sampleCount: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      eventTypeId: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      callChainId: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve, reject) => {
    threadPool.submitProto(
      QueryEnum.HiperfCpuData,
      {
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
        cpu: cpu,
        scale: scale,
        maxCpuCount: maxCpuCount,
        drawType: drawType,
        intervalPerf: intervalPerf,
      },
      (res: any, len: number, transfer: boolean) => {
        resolve(arrayBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
      }
    );
  });
}

function arrayBufferHandler(buffers: any, len: number): HiPerfCpuStruct[] {
  let outArr: HiPerfCpuStruct[] = [];
  let startNS = new Float64Array(buffers.startNS);
  let eventCount = new Int32Array(buffers.eventCount);
  let sampleCount = new Int32Array(buffers.sampleCount);
  let eventTypeId = new Int32Array(buffers.eventTypeId);
  let callChainId = new Int32Array(buffers.callChainId);
  let height = new Int32Array(buffers.height);
  for (let i = 0; i < len; i++) {
    outArr.push({
      startNS: startNS[i],
      eventCount: eventCount[i],
      sampleCount: sampleCount[i],
      event_type_id: eventTypeId[i],
      callchain_id: callChainId[i],
      height: height[i],
      dur: 10_000_000,
    } as HiPerfCpuStruct);
  }
  return outArr;
}
