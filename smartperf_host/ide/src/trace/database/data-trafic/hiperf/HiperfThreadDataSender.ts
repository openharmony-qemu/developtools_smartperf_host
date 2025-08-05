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
import { HiPerfThreadStruct } from '../../ui-worker/hiperf/ProcedureWorkerHiPerfThread2';

export function hiperfThreadDataSender(
  tid: number,
  drawType: number,
  maxCpu: number,
  intervalPerf: number,
  scale: number,
  // @ts-ignore
  row: TraceRow<unknown>
): Promise<unknown[]> {
  let trafic: number = TraficEnum.ProtoBuffer;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      eventTypeId: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startNS: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      eventCount: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      sampleCount: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      callChainId: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      height: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve): void => {
    threadPool.submitProto(
      QueryEnum.HiperfThreadData,
      {
        scale: scale,
        drawType: drawType,
        intervalPerf: intervalPerf,
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
        tid: tid,
        maxCpuCount: maxCpu,
      },
      (res: unknown, len: number, transfer: boolean): void => {
        resolve(arrayBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
      }
    );
  });
}

function arrayBufferHandler(buffers: unknown, len: number): HiPerfThreadStruct[] {
  let outArr: HiPerfThreadStruct[] = [];
  // @ts-ignore
  let startNS = new Float64Array(buffers.startNS);
  // @ts-ignore
  let eventCount = new Int32Array(buffers.eventCount);
  // @ts-ignore
  let sampleCount = new Int32Array(buffers.sampleCount);
  // @ts-ignore
  let eventTypeId = new Int32Array(buffers.eventTypeId);
  // @ts-ignore
  let callChainId = new Int32Array(buffers.callChainId);
  // @ts-ignore
  let height = new Int32Array(buffers.height);
  for (let i = 0; i < len; i++) {
    outArr.push({
      dur: 10_000_000,
      startNS: startNS[i],
      event_count: eventCount[i],
      sampleCount: sampleCount[i],
      event_type_id: eventTypeId[i],
      callchain_id: callChainId[i],
      height: height[i],
    } as unknown as HiPerfThreadStruct);
  }
  return outArr;
}
