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
import { SnapshotStruct } from '../ui-worker/ProcedureWorkerSnapshot';

export function sMapsDataSender(rowName: string, row: TraceRow<SnapshotStruct>): Promise<SnapshotStruct[]> {
  let trafic: number = TraficEnum.ProtoBuffer;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      value: new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startNs: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve, reject) => {
    threadPool.submitProto(
      QueryEnum.VmTrackerSmapsData,
      {
        name: rowName,
        startNs: TraceRow.range?.startNS || 0,
        endNs: TraceRow.range?.endNS || 0,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
      },
      (res: any, len: number, transfer: boolean) => {
        resolve(arrayBufferHandler(res, len));
      }
    );
  });
}

export function dmaDataSender(ipid: number, row: TraceRow<SnapshotStruct>): Promise<SnapshotStruct[]> {
  let trafic: number = TraficEnum.ProtoBuffer;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      startNs: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      value: new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve, reject) => {
    threadPool.submitProto(
      QueryEnum.VmTrackerDmaData,
      {
        ipid: ipid,
        startNs: TraceRow.range?.startNS || 0,
        endNs: TraceRow.range?.endNS || 0,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
      },
      (res: any, len: number, transfer: boolean) => {
        resolve(arrayBufferHandler(res, len));
      }
    );
  });
}

export function gpuMemoryDataSender(ipid: number, row: TraceRow<SnapshotStruct>): Promise<SnapshotStruct[]> {
  let trafic: number = TraficEnum.ProtoBuffer;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      startNs: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      value: new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve, reject) => {
    threadPool.submitProto(
      QueryEnum.VmTrackerGpuMemoryData,
      {
        ipid: ipid,
        startNs: TraceRow.range?.startNS || 0,
        endNs: TraceRow.range?.endNS || 0,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
      },
      (res: any, len: number, transfer: boolean) => {
        resolve(arrayBufferHandler(res, len));
      }
    );
  });
}
export function gpuResourceDataSender(scratchId: number, row: TraceRow<SnapshotStruct>): Promise<SnapshotStruct[]> {
  let trafic: number = TraficEnum.ProtoBuffer;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      startNs: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      value: new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve, reject) => {
    threadPool.submitProto(
      QueryEnum.VmTrackerGpuResourceData,
      {
        scratchId: scratchId,
        startNs: TraceRow.range?.startNS || 0,
        endNs: TraceRow.range?.endNS || 0,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
      },
      (res: any, len: number, transfer: boolean) => {
        resolve(arrayBufferHandler(res, len));
      }
    );
  });
}

export function gpuGpuDataSender(ipid: number, name: string, row: TraceRow<SnapshotStruct>): Promise<SnapshotStruct[]> {
  let trafic: number = TraficEnum.ProtoBuffer;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      startNs: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      value: new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve, reject) => {
    threadPool.submitProto(
      QueryEnum.VmTrackerGpuData,
      {
        ipid: ipid,
        name: name,
        startNs: TraceRow.range?.startNS || 0,
        endNs: TraceRow.range?.endNS || 0,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
      },
      (res: any, len: number, transfer: boolean) => {
        resolve(arrayBufferHandler(res, len));
      }
    );
  });
}

export function gpuTotalDataSender(moduleId: number | null, row: TraceRow<SnapshotStruct>): Promise<SnapshotStruct[]> {
  let trafic: number = TraficEnum.ProtoBuffer;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      startNs: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      value: new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve, reject) => {
    threadPool.submitProto(
      QueryEnum.VmTrackerGpuTotalData,
      {
        moduleId: moduleId,
        startNs: TraceRow.range?.startNS || 0,
        endNs: TraceRow.range?.endNS || 0,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
      },
      (res: any, len: number, transfer: boolean) => {
        resolve(arrayBufferHandler(res, len));
      }
    );
  });
}

export function gpuWindowDataSender(
  windowId: number | null,
  moduleId: number | null,
  row: TraceRow<SnapshotStruct>
): Promise<SnapshotStruct[]> {
  let trafic: number = TraficEnum.ProtoBuffer;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      startNs: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      value: new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve, reject) => {
    threadPool.submitProto(
      QueryEnum.VmTrackerGpuWindowData,
      {
        windowId: windowId,
        moduleId: moduleId,
        startNs: TraceRow.range?.startNS || 0,
        endNs: TraceRow.range?.endNS || 0,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
      },
      (res: any, len: number, transfer: boolean) => {
        resolve(arrayBufferHandler(res, len));
      }
    );
  });
}

export function shmDataSender(ipid: number, row: TraceRow<SnapshotStruct>): Promise<SnapshotStruct[]> {
  let trafic: number = TraficEnum.ProtoBuffer;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      startNs: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      value: new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve, reject) => {
    threadPool.submitProto(
      QueryEnum.VmTrackerShmData,
      {
        ipid: ipid,
        startNs: TraceRow.range?.startNS || 0,
        endNs: TraceRow.range?.endNS || 0,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
      },
      (res: any, len: number, transfer: boolean) => {
        resolve(arrayBufferHandler(res, len));
      }
    );
  });
}

export function purgeableDataSender(
  ipid: number,
  row: TraceRow<SnapshotStruct>,
  isPin?: boolean
): Promise<SnapshotStruct[]> {
  let trafic: number = TraficEnum.ProtoBuffer;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      startNs: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      value: new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve, reject) => {
    threadPool.submitProto(
      QueryEnum.VmTrackerPurgeableData,
      {
        ipid: ipid,
        isPin: isPin,
        startNs: TraceRow.range?.startNS || 0,
        endNs: TraceRow.range?.endNS || 0,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
      },
      (res: any, len: number, transfer: boolean): void => {
        resolve(arrayBufferHandler(res, len));
      }
    );
  });
}

export function abilityPurgeableDataSender(
  row: TraceRow<SnapshotStruct>,
  dur: number,
  isPin: Boolean
): Promise<SnapshotStruct[]> {
  let trafic: number = TraficEnum.ProtoBuffer;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      value: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startNs: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve, reject) => {
    threadPool.submitProto(
      QueryEnum.AbilityPurgeableData,
      {
        dur: dur,
        isPin: isPin,
        startNs: TraceRow.range?.startNS || 0,
        endNs: TraceRow.range?.endNS || 0,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
      },
      (res: any, len: number, transfer: boolean) => {
        resolve(arrayBufferHandler(res, len));
      }
    );
  });
}

export function abilityDmaDataSender(row: TraceRow<SnapshotStruct>, dur: number): Promise<SnapshotStruct[]> {
  let trafic: number = TraficEnum.ProtoBuffer;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      value: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startNs: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      expTaskComm: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      flag: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve, reject) => {
    threadPool.submitProto(
      QueryEnum.AbilityDmaData,
      {
        dma: 'dma',
        dur: dur,
        startNs: TraceRow.range?.startNS || 0,
        endNs: TraceRow.range?.endNS || 0,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
      },
      (res: any, len: number, transfer: boolean) => {
        resolve(arrayBufferHandler(res, len));
      }
    );
  });
}

export function abilityGpuMemoryDataSender(row: TraceRow<SnapshotStruct>, dur: number): Promise<SnapshotStruct[]> {
  let trafic: number = TraficEnum.ProtoBuffer;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      value: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startNs: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve, reject) => {
    threadPool.submitProto(
      QueryEnum.AbilityGpuMemoryData,
      {
        dur: dur,
        startNs: TraceRow.range?.startNS || 0,
        endNs: TraceRow.range?.endNS || 0,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
      },
      (res: any, len: number, transfer: boolean) => {
        resolve(arrayBufferHandler(res, len));
      }
    );
  });
}

function arrayBufferHandler(buffers: any, len: number): SnapshotStruct[] {
  let outArr: SnapshotStruct[] = [];
  let startNs = new Float64Array(buffers.startNs);
  let value = new Uint32Array(buffers.value);
  for (let i = 0; i < len; i++) {
    outArr.push({
      value: value[i],
      startNs: startNs[i],
    } as SnapshotStruct);
  }
  return outArr;
}
