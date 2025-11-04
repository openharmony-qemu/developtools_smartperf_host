/*
 * Copyright (C) 2025 Huawei Device Co., Ltd.
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
import { QueryEnum, TraficEnum } from './utils/QueryEnum';
import { threadPool } from '../SqlLite';
import { TraceRow } from '../../component/trace/base/TraceRow';

export function GpuMemorySender( //@ts-ignore
  row: TraceRow<unknown>,
  setting: {
    eventType: number;
    ipid: number;
    model: string;
    drawType: number;
  }
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    threadPool.submitProto(
      QueryEnum.GpuMemoryData,
      {
        startNS: TraceRow.range?.startNS || 0,
        endNS: TraceRow.range?.endNS || 0,
        totalNS: (TraceRow.range?.endNS || 0) - (TraceRow.range?.startNS || 0),
        frame: row.frame,
        eventType: setting.eventType,
        drawType: setting.drawType,
        model: setting.model,
        ipid: setting.ipid,
        trafic: TraficEnum.SharedArrayBuffer,
      },
      (res: unknown, len: number): void => {
        resolve(arrayBufferHandler(res, len));
      }
    );
  });
}

export function gpuMemoryChartDataCacheSender(processes: Array<number>, model: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    threadPool.submitProto(
      model === 'native_hook' ? QueryEnum.GpuMemoryCacheNormal : QueryEnum.GpuMemoryCacheStatistic,
      {
        totalNS: window.totalNS,
        recordStartNS: window.recordStartNS,
        recordEndNS: window.recordEndNS,
        model: model,
        processes: processes,
        trafic: TraficEnum.SharedArrayBuffer,
        isCache: true,
      },
      (res: unknown, len: number): void => {
        resolve('ok');
      }
    );
  });
}

function arrayBufferHandler(res: unknown, len: number): unknown[] {
  let outArr: unknown[] = []; //@ts-ignore
  let startTime = new Float64Array(res.startTime); //@ts-ignore
  let dur = new Float64Array(res.dur); //@ts-ignore
  let density = new Int32Array(res.density); //@ts-ignore
  let heapSize = new Float64Array(res.heapSize);
  for (let i = 0; i < len; i++) {
    outArr.push({
      startTime: startTime[i],
      dur: dur[i],
      heapsize: heapSize[i],
      density: density[i], //@ts-ignore
      maxHeapSize: res.maxSize, //@ts-ignore
      maxDensity: res.maxDensity, //@ts-ignore
      minHeapSize: res.minSize, //@ts-ignore
      minDensity: res.minDensity,
    } as unknown);
  }
  return outArr;
}
