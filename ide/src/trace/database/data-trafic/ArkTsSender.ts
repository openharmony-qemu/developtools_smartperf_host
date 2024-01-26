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

import { TraceRow } from '../../component/trace/base/TraceRow';
import { threadPool } from '../SqlLite';
import { JsCpuProfilerStruct } from '../ui-worker/ProcedureWorkerCpuProfiler';
import { CHART_OFFSET_LEFT, QueryEnum, TraficEnum } from './utils/QueryEnum';

export function cpuProfilerDataSender(row: TraceRow<JsCpuProfilerStruct>) {
  let trafic: number = TraficEnum.ProtoBuffer;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  return new Promise((resolve, reject) => {
    threadPool.submitProto(
      QueryEnum.CpuProfilerData,
      {
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        width: width,
        trafic: trafic,
      },
      (res: any, len: number): void => {
        resolve(arrayBufferHandler(res, len));
      }
    );
  });
}

function arrayBufferHandler(res: any, len: number) {
  let outArr: any[] = [];
  let column = new Int32Array(res.column);
  let depth = new Int32Array(res.depth);
  let endTime = new Float64Array(res.endTime);
  let id = new Int32Array(res.id);
  let line = new Int32Array(res.line);
  let nameId = new Int32Array(res.nameId);
  let parentId = new Int32Array(res.parentId);
  let selfTime = new Float64Array(res.selfTime);
  let startTime = new Float64Array(res.startTime);
  let totalTime = new Float64Array(res.totalTime);
  let urlId = new Int32Array(res.urlId);
  for (let i = 0; i < len; i++) {
    outArr.push({
      column: column[i],
      depth: depth[i],
      endTime: endTime[i],
      id: id[i],
      line: line[i],
      nameId: nameId[i],
      parentId: parentId[i],
      samplesIds: res.samplesIds[i],
      selfTime: selfTime[i],
      startTime: startTime[i],
      totalTime: totalTime[i],
      urlId: urlId[i],
      childrenIds: res.childrenIds[i],
    } as any);
  }
  return {
    maxDepth: res.maxDepth,
    dataList: outArr,
  };
}
