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
import { xpowerStasticList } from '../utils/AllMemoryCache';
import { Args } from '../CommonArgs';

export const chartXpowerStatisticMemoryDataSql = (args: Args): string => {
  return `
  SELECT a.component_type_id AS type,
         a.start_time - b.start_ts AS startTime,
         a.duration AS dur,
         a.energy
  FROM xpower_app_statistic a, trace_range b`;
};

export const chartXpowerStatisticDataSql = (args: Args): string => {
  return `
  SELECT a.component_type_id AS type,
         a.start_time - b.start_ts AS startTime,
         a.duration AS dur,
         a.energy
  FROM xpower_app_statistic a, trace_range b`;
};

export function xpowerStatisticDataReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    let list: unknown[];
    // @ts-ignore
    if (!xpowerStasticList.has(data.params.xpowerName)) {
      // @ts-ignore
      list = proc(chartXpowerStatisticMemoryDataSql(data.params));
      // @ts-ignore
      xpowerStasticList.set(data.params.xpowerName, list);
    } else {
      // @ts-ignore
      list = xpowerStasticList.get(data.params.xpowerName) || [];
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

function arrayBufferHandler(data: unknown, res: unknown[], transfer: boolean): void {
  // @ts-ignore
  let dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  // @ts-ignore
  let startTime = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startTime);
  // @ts-ignore
  let energy = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.energy);
  // @ts-ignore
  let type = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.type);
  res.forEach((it, i) => {
    // @ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.xpowerStatisticData);
    // @ts-ignore
    dur[i] = it.dur;
    // @ts-ignore
    startTime[i] = it.startTime;
    // @ts-ignore
    energy[i] = it.energy;
    // @ts-ignore
    type[i] = it.type;
  });

  (self as unknown as Worker).postMessage(
    {
      // @ts-ignore
      id: data.id,
      // @ts-ignore
      action: data.action,
      results: transfer
        ? {
            dur: dur.buffer,
            startTime: startTime.buffer,
            type: type.buffer,
            energy: energy.buffer,
          }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer ? [dur.buffer, startTime.buffer, type.buffer, energy.buffer] : []
  );
}
