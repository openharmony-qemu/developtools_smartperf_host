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

import { TraficEnum } from '../utils/QueryEnum';
import { xpowerAppDetailList } from '../utils/AllMemoryCache';
import { Args } from '../CommonArgs';

export const chartXpowerAppDetailMemoryDataSql = (args: Args): string => {
  return `
    SELECT a.start_time - b.start_ts AS startTime,
           ifnull(a.count_1hz, 0) AS c1hz,
           ifnull(a.count_5hz, 0) AS c5hz,
           ifnull(a.count_10hz, 0) AS c10hz,
           ifnull(a.count_15hz, 0) AS c15hz,
           ifnull(a.count_24hz, 0) AS c24hz,
           ifnull(a.count_30hz, 0) AS c30hz,
           ifnull(a.count_45hz, 0) AS c45hz,
           ifnull(a.count_60hz, 0) AS c60hz,
           ifnull(a.count_90hz, 0) AS c90hz,
           ifnull(a.count_120hz, 0) AS c120hz,
           ifnull(a.count_180hz, 0) AS c180hz
    FROM xpower_app_detail_display a, trace_range b`;
};

export const chartXpowerStatisticDataSql = (args: Args): string => {
  return `
  SELECT a.start_time - b.start_ts AS startTime,
         ifnull(a.count_1hz, 0) AS c1hz,
         ifnull(a.count_5hz, 0) AS c5hz,
         ifnull(a.count_10hz, 0) AS c10hz,
         ifnull(a.count_15hz, 0) AS c15hz,
         ifnull(a.count_24hz, 0) AS c24hz,
         ifnull(a.count_30hz, 0) AS c30hz,
         ifnull(a.count_45hz, 0) AS c45hz,
         ifnull(a.count_60hz, 0) AS c60hz,
         ifnull(a.count_90hz, 0) AS c90hz,
         ifnull(a.count_120hz, 0) AS c120hz,
         ifnull(a.count_180hz, 0) AS c180hz
  FROM xpower_app_detail_display a, trace_range b`;
};

export function xpowerAppDetailDataReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    let list: unknown[];
    // @ts-ignore
    if (!xpowerAppDetailList.has(data.params.xpowerName)) {
      // @ts-ignore
      list = proc(chartXpowerAppDetailMemoryDataSql(data.params));
      // @ts-ignore
      xpowerAppDetailList.set(data.params.xpowerName, list);
    } else {
      // @ts-ignore
      list = xpowerAppDetailList.get(data.params.xpowerName) || [];
    }
    // @ts-ignore
    if (data.params.queryAll) {
      list = (list || []).filter(
        // @ts-ignore
        (it) => it.startTime + 3000000000 >= data.params.selectStartNS && it.startTime <= data.params.selectEndNS
      );
    }
    arrayBufferHandler(data, list, true);
  } else {
    // @ts-ignore
    let sql = chartXpowerStatisticDataSql(data.params);
    let res = proc(sql);
    // @ts-ignore
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

const keys = [
  'startTime',
  'c1hz',
  'c5hz',
  'c10hz',
  'c15hz',
  'c24hz',
  'c30hz',
  'c45hz',
  'c60hz',
  'c90hz',
  'c120hz',
  'c180hz',
];

function initializeArrays(res: unknown[], transfer: boolean, data: unknown): { [key: string]: Float64Array } {
  return keys.reduce((acc, key) => { // @ts-ignore
    acc[key] = new Float64Array(transfer ? res.length : (data as unknown).params.sharedArrayBuffers[key]);
    return acc;
  }, {} as { [key: string]: Float64Array });
}

function fillArrays(arrays: { [key: string]: Float64Array }, res: unknown[], data: unknown): void {
  let keysCopy = [...keys];
  keysCopy.shift();
  res.forEach((it, i) => { // @ts-ignore
    if ((data as unknown).params.trafic === TraficEnum.ProtoBuffer) { // @ts-ignore
      it = (it as unknown).xpowerAppDetailData;
    } // @ts-ignore
    arrays.startTime[i] = (it as unknown).startTime;
    keysCopy.forEach((key) => { // @ts-ignore
      arrays[key][i] = (it as unknown)[key];
    });
  });
}

function arrayBufferHandler(data: unknown, res: unknown[], transfer: boolean): void {
  const arrays = initializeArrays(res, transfer, data);
  fillArrays(arrays, res, data);
  (self as unknown as Worker).postMessage(
    { // @ts-ignore
      id: (data as unknown).id, // @ts-ignore
      action: (data as unknown).action,
      results: transfer
        ? {
            startTime: arrays.startTime.buffer, 
            c1hz: arrays.c1hz.buffer,
            c5hz: arrays.c5hz.buffer,
            c10hz: arrays.c10hz.buffer,
            c15hz: arrays.c15hz.buffer,
            c24hz: arrays.c24hz.buffer,
            c30hz: arrays.c30hz.buffer,
            c45hz: arrays.c45hz.buffer,
            c60hz: arrays.c60hz.buffer,
            c90hz: arrays.c90hz.buffer,
            c120hz: arrays.c120hz.buffer,
            c180hz: arrays.c180hz.buffer,
          }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer
      ? [
          arrays.startTime.buffer,
          arrays.c1hz.buffer,
          arrays.c5hz.buffer,
          arrays.c10hz.buffer,
          arrays.c15hz.buffer,
          arrays.c24hz.buffer,
          arrays.c30hz.buffer,
          arrays.c45hz.buffer,
          arrays.c60hz.buffer,
          arrays.c90hz.buffer,
          arrays.c120hz.buffer,
          arrays.c180hz.buffer,
        ]
      : []
  );
}
