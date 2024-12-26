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
import { CHART_OFFSET_LEFT, MAX_COUNT, QueryEnum, TraficEnum } from '../utils/QueryEnum';
import { getThreadPool } from '../../SqlLite';
import { TraceRow } from '../../../component/trace/base/TraceRow';
import { XpowerThreadCountStruct } from '../../ui-worker/ProcedureWorkerXpowerThreadCount';
import { XpowerThreadInfoStruct } from '../../ui-worker/ProcedureWorkerXpowerThreadInfo';
import { Utils } from '../../../component/trace/base/Utils';

export function xpowerThreadCountDataSender(
  row: TraceRow<XpowerThreadCountStruct>,
  args?: unknown
): Promise<XpowerThreadCountStruct[]> {
  let trafic: number = TraficEnum.Memory;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      value: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startNS: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      dur: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve, reject): void => {
    getThreadPool(row.traceId).submitProto(
      QueryEnum.XpowerThreadCountData,
      {
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        totalNS: TraceRow.range?.totalNS || 0,
        recordStartNS: Utils.getInstance().getRecordStartNS(row.traceId),
        recordEndNS: Utils.getInstance().getRecordEndNS(row.traceId),
        // @ts-ignore
        queryAll: args && args.queryAll,
        // @ts-ignore
        selectStartNS: args ? args.startNS : 0,
        // @ts-ignore
        selectEndNS: args ? args.endNS : 0,
        // @ts-ignore
        selectTotalNS: args ? args.endNS - args.startNS : 0,
        t: Date.now(),
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
      },
      (res: unknown, len: number, transfer: boolean): void => {
        resolve(threadCountArrayBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
      }
    );
  });
}

function threadCountArrayBufferHandler(buffers: unknown, len: number): XpowerThreadCountStruct[] {
  let outArr: XpowerThreadCountStruct[] = [];
  // @ts-ignore
  let value = new Float64Array(buffers.value);
  // @ts-ignore
  let startNS = new Float64Array(buffers.startNS);
  // @ts-ignore
  let dur = new Float64Array(buffers.dur);
  for (let i = 0; i < len; i++) {
    outArr.push({
      value: value[i],
      startNS: startNS[i],
      dur: dur[i],
    } as unknown as XpowerThreadCountStruct);
  }
  return outArr;
}

export function xpowerThreadInfoDataSender(
  valueType: string,
  row: TraceRow<XpowerThreadInfoStruct>,
  args?: unknown
): Promise<XpowerThreadInfoStruct[]> {
  let trafic: number = TraficEnum.Memory;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      value: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startNS: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      dur: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      threadTime: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      threadNameId: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve, reject): void => {
    getThreadPool(row.traceId).submitProto(
      QueryEnum.XpowerThreadInfoData,
      {
        valueType: valueType,
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        totalNS: TraceRow.range?.totalNS || 0,
        recordStartNS: Utils.getInstance().getRecordStartNS(row.traceId),
        recordEndNS: Utils.getInstance().getRecordEndNS(row.traceId),
        // @ts-ignore
        queryAll: args && args.queryAll,
        // @ts-ignore
        selectStartNS: args ? args.startNS : 0,
        // @ts-ignore
        selectEndNS: args ? args.endNS : 0,
        // @ts-ignore
        selectTotalNS: args ? args.endNS - args.startNS : 0,
        t: Date.now(),
        width: width,
        trafic: trafic,
        sharedArrayBuffers: row.sharedArrayBuffers,
      },
      (res: unknown, len: number, transfer: boolean): void => {
        resolve(threadInfoArrayBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
      }
    );
  });
}

function threadInfoArrayBufferHandler(buffers: unknown, len: number): XpowerThreadInfoStruct[] {
  let outArr: XpowerThreadInfoStruct[] = [];
  // @ts-ignore
  let value = new Float64Array(buffers.value);
  // @ts-ignore
  let startNS = new Float64Array(buffers.startNS);
  // @ts-ignore
  let dur = new Float64Array(buffers.dur);
  // @ts-ignore
  let threadTime = new Float64Array(buffers.threadTime);
  // @ts-ignore
  let threadNameId = new Float64Array(buffers.threadNameId);
  for (let i = 0; i < len; i++) {
    outArr.push({
      value: value[i],
      startNS: startNS[i],
      dur: dur[i],
      threadTime: threadTime[i],
      threadNameId: threadNameId[i],
    } as unknown as XpowerThreadInfoStruct);
  }
  return outArr;
}
