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

import { MAX_COUNT, QueryEnum, TraficEnum } from './utils/QueryEnum';
import { threadPool } from '../SqlLite';
import { TraceRow } from '../../component/trace/base/TraceRow';
import { EnergySystemStruct } from '../ui-worker/ProcedureWorkerEnergySystem';
import { EnergyAnomalyStruct } from '../ui-worker/ProcedureWorkerEnergyAnomaly';
import { EnergyPowerStruct } from '../ui-worker/ProcedureWorkerEnergyPower';
import { EnergyStateStruct } from '../ui-worker/ProcedureWorkerEnergyState';

export function energySysEventSender(row: TraceRow<EnergySystemStruct>): Promise<EnergySystemStruct[]> {
  let trafic: number = TraficEnum.ProtoBuffer;
  let width = row.clientWidth - 248;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      id: new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startNs: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      count: new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      type: new SharedArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      token: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      dataType: new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve) => {
    threadPool.submitProto(
      QueryEnum.EnergySystemData,
      {
        sharedArrayBuffers: row.sharedArrayBuffers,
        trafic: trafic,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        width: width,
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
      },
      (res: any, len: number, transfer: boolean) => {
        resolve(systemBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
      }
    );
  });
}

export function hiSysEnergyAnomalyDataSender(row: TraceRow<EnergyAnomalyStruct>): Promise<EnergyAnomalyStruct[]> {
  let trafic: number = TraficEnum.ProtoBuffer;
  let width = row.clientWidth - 248;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      id: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startNS: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve) => {
    threadPool.submitProto(
      QueryEnum.EnergyAnomalyData,
      {
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        sharedArrayBuffers: row.sharedArrayBuffers,
        width: width,
        trafic: trafic,
      },
      (res: any, len: number, transfer: boolean) => {
        resolve(anomalyBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
      }
    );
  });
}

export function hiSysEnergyPowerSender(row: TraceRow<EnergyPowerStruct>): Promise<EnergyPowerStruct[]> {
  let trafic: number = TraficEnum.ProtoBuffer;
  let width = row.clientWidth - 248;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      id: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startNS: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve, reject): void => {
    threadPool.submitProto(
      QueryEnum.EnergyPowerData,
      {
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
      },
      (res: any, len: number, transfer: boolean): void => {
        resolve(powerBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
      }
    );
  });
}

export function hiSysEnergyStateSender(
  eventName: string[],
  index: number,
  row: TraceRow<EnergyStateStruct>
): Promise<EnergyStateStruct[]> {
  let trafic: number = TraficEnum.ProtoBuffer;
  let width = row.clientWidth - 248;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      id: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startNs: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      value: new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve, reject): void => {
    threadPool.submitProto(
      QueryEnum.EnergyStateData,
      {
        eventName: eventName[index],
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
      },
      (res: any, len: number, transfer: boolean): void => {
        resolve(stateArrayBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
      }
    );
  });
}

function systemBufferHandler(res: any, len: number): any[] {
  let outArr: EnergySystemStruct[] = [];
  let startNs = new Float64Array(res.startNs);
  let id = new Uint16Array(res.id);
  let count = new Uint32Array(res.count);
  let type = new Uint32Array(res.type);
  let token = new Float64Array(res.token);
  let dataType = new Uint16Array(res.dataType);
  for (let index = 0; index < len; index++) {
    outArr.push({
      id: id[index],
      startNs: startNs[index],
      count: count[index],
      type: type[index],
      token: token[index],
      dataType: dataType[index],
    } as unknown as EnergySystemStruct);
  }
  return outArr;
}

function anomalyBufferHandler(res: any, len: number): EnergyAnomalyStruct[] {
  let outArr: EnergyAnomalyStruct[] = [];
  let startNs = new Float64Array(res.startNs);
  let id = new Int32Array(res.id);
  for (let index = 0; index < len; index++) {
    outArr.push({
      id: id[index],
      startNS: startNs[index],
    } as unknown as EnergyAnomalyStruct);
  }
  return outArr;
}

function powerBufferHandler(buffers: any, len: number): EnergyPowerStruct[] {
  let outArr: EnergyPowerStruct[] = [];
  let startNs = new Float64Array(buffers.startNs);
  let id = new Uint32Array(buffers.id);
  for (let i = 0; i < len; i++) {
    outArr.push({
      id: id[i],
      startNS: startNs[i],
    } as unknown as EnergyPowerStruct);
  }
  return outArr;
}

function stateArrayBufferHandler(buffers: any, len: number): EnergyStateStruct[] {
  let outArr: EnergyStateStruct[] = [];
  let startNs = new Float64Array(buffers.startNs);
  let eventValue = new Float32Array(buffers.eventValue);
  let id = new Uint32Array(buffers.id);
  for (let i = 0; i < len; i++) {
    outArr.push({
      id: id[i],
      startNs: startNs[i],
      value: eventValue[i],
    } as unknown as EnergyStateStruct);
  }
  return outArr;
}
