/*
 * Copyright (C) 2024 Shenzhen Kaihong Digital Industry Development Co., Ltd.
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
import { HangStruct } from '../ui-worker/ProcedureWorkerHang';
import { FlagsConfig } from '../../component/SpFlags';

export function hangDataSender(
  processId: number = 0,
  row: TraceRow<HangStruct>,
  args?: unknown,
): Promise<HangStruct[]> {
  let trafic: number = TraficEnum.Memory;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  return new Promise((resolve, reject): void => {
    let flagsItemJson = JSON.parse(window.localStorage.getItem(FlagsConfig.FLAGS_CONFIG_KEY)!);
    let minDur = parseInt(flagsItemJson.hangValue);
    threadPool.submitProto(
      QueryEnum.HangData,
      {
        pid: processId,
        minDur: minDur,
        // @ts-ignore
        queryAll: args && args.queryAll,
        // @ts-ignore
        selectStartNS: args ? args.startNS : 0,
        // @ts-ignore
        selectEndNS: args ? args.endNS : 0,
        // @ts-ignore
        selectTotalNS: args ? args.endNS - args.startNS : 0,
        trafic: trafic,
        width: width,
      },
      (res: unknown, len: number, transfer: boolean): void => {
        resolve(arrayBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
      }
    );
  });
}

function arrayBufferHandler(buffers: unknown, len: number): HangStruct[] {
  let outArr: HangStruct[] = [];
  // @ts-ignore
  let id = new Int32Array(buffers.id);
  // @ts-ignore
  let startTime = new Float64Array(buffers.startTime);
  // @ts-ignore
  let dur = new Float64Array(buffers.dur);
  // @ts-ignore
  let tid = new Int32Array(buffers.tid);
  // @ts-ignore
  let pid = new Int32Array(buffers.pid);
  for (let i = 0; i < len; i += 1) {
    outArr.push({
      id: id[i],
      startTime: startTime[i],
      dur: dur[i],
      tid: tid[i],
      pid: pid[i],
    } as HangStruct);
  }
  return outArr;
}
