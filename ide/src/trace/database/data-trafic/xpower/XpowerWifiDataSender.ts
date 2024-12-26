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
import { Utils } from '../../../component/trace/base/Utils';
import { XpowerWifiStruct } from '../../ui-worker/ProcedureWorkerXpowerWifi';

export function xpowerWifiDataSender(
  row: TraceRow<XpowerWifiStruct>,
  xpowerName: string = '',
  args?: unknown
): Promise<XpowerWifiStruct[]> {
  let trafic: number = TraficEnum.Memory;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      startTime: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      tx: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      rx: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve, reject): void => {
    getThreadPool(row.traceId).submitProto(
      QueryEnum.XpowerWifiData,
      {
        xpowerName: xpowerName,
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
        resolve(arrayBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
      }
    );
  });
}

function arrayBufferHandler(buffers: unknown, len: number): XpowerWifiStruct[] {
  let outArr: XpowerWifiStruct[] = [];
  // @ts-ignore
  let startTime = new Float64Array(buffers.startTime);
  // @ts-ignore
  let tx = new Float64Array(buffers.tx);
  // @ts-ignore
  let rx = new Float64Array(buffers.rx);
  for (let i = 0; i < len; i++) {
    outArr.push({
      startTime: startTime[i],
      tx: tx[i],
      rx: rx[i],
    } as unknown as XpowerWifiStruct);
  }
  return outArr;
}
