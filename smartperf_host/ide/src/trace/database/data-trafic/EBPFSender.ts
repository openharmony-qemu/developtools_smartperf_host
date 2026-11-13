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
import { EBPFChartStruct } from '../ui-worker/ProcedureWorkerEBPF';

export function fileSystemSender(
  type: number,
  scale: number,
  row: TraceRow<EBPFChartStruct>
): Promise<EBPFChartStruct[]> {
  let trafic: number = TraficEnum.TransferArrayBuffer;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      endNS: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startNS: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      size: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve, reject): void => {
    threadPool.submitProto(
      QueryEnum.FileSystemData,
      {
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
        type: type,
        scale: scale,
      },
      (res: unknown, len: number, transfer: boolean): void => {
        resolve(arrayBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
      }
    );
  });
}

export function diskIoSender(
  all: boolean,
  ipid: number,
  typeArr: Array<number>,
  scale: number,
  row: TraceRow<EBPFChartStruct>
): Promise<EBPFChartStruct[]> {
  let trafic: number = TraficEnum.TransferArrayBuffer;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      endNS: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startNS: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      dur: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve, reject): void => {
    threadPool.submitProto(
      QueryEnum.DiskIoData,
      {
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
        all: all,
        ipid: ipid,
        typeArr: typeArr,
        scale: scale,
      },
      (res: unknown, len: number, transfer: boolean) => {
        resolve(arrayBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
      }
    );
  });
}
export function fileSysVMSender(scale: number, row: TraceRow<EBPFChartStruct>): Promise<EBPFChartStruct[]> {
  let trafic: number = TraficEnum.TransferArrayBuffer;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      endNS: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startNS: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      dur: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve, reject) => {
    threadPool.submitProto(
      QueryEnum.EBPFVm,
      {
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
        scale: scale,
      },
      (res: unknown, len: number, transfer: boolean) => {
        resolve(arrayBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
      }
    );
  });
}
function arrayBufferHandler(buffers: unknown, len: number): EBPFChartStruct[] {
  let outArr: EBPFChartStruct[] = [];
  // @ts-ignore
  let endNS = new Float64Array(buffers.endNS);
  // @ts-ignore
  let startNS = new Float64Array(buffers.startNS);
  // @ts-ignore
  let size = new Float64Array(buffers.size);
  // @ts-ignore
  let dur = new Float64Array(buffers.dur);
  // @ts-ignore
  let height = new Int32Array(buffers.height);
  for (let i = 0; i < len; i++) {
    outArr.push({
      size: size[i],
      dur: dur[i],
      endNS: endNS[i],
      startNS: startNS[i],
      height: height[i],
    } as unknown as EBPFChartStruct);
  }
  return outArr;
}
