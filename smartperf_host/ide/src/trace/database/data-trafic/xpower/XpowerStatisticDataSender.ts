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
import { XpowerStatisticStruct } from '../../ui-worker/ProcedureWorkerXpowerStatistic';

export function xpowerStatisticDataSender(
  row: TraceRow<XpowerStatisticStruct>,
  args?: unknown
): Promise<XpowerStatisticStruct[]> {
  let trafic: number = TraficEnum.Memory;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (trafic === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      type: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startTime: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      dur: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      energy: new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve, reject): void => {
    getThreadPool(row.traceId).submitProto(
      QueryEnum.XpowerStatisticData,
      {
        xpowerName: 'statistic',
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

function arrayBufferHandler(buffers: unknown, len: number): XpowerStatisticStruct[] {
  let outArr: XpowerStatisticStruct[] = [];
  // @ts-ignore
  let type = new Int32Array(buffers.type);
  // @ts-ignore
  let startTime = new Float64Array(buffers.startTime);
  // @ts-ignore
  let dur = new Float64Array(buffers.dur);
  // @ts-ignore
  let energy = new Int32Array(buffers.energy);
  for (let i = 0; i < len; i++) {
    outArr.push({
      type: type[i],
      startTime: startTime[i],
      dur: dur[i],
      energy: energy[i],
    } as unknown as XpowerStatisticStruct);
  }
  return outArr;
}
