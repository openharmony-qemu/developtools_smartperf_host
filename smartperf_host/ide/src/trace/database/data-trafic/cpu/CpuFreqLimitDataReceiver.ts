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
import { filterDataByGroup } from '../utils/DataFilter';
import { cpuFreqLimitList } from '../utils/AllMemoryCache';
import { Args } from '../CommonArgs';

export const chartCpuFreqLimitDataSql = (args: Args): string => {
  const endNS = args.endNS;
  const startNS = args.startNS;
  const recordStartNS = args.recordStartNS;
  const cpu = args.cpu;
  const width = args.width;
  const maxId = args.maxId;
  const minId = args.minId;
  return `
      SELECT 
             max AS max,
             min AS min,
             value,
             max(dura)     AS dur,
             startNs AS startNs,
             ${cpu} AS cpu,
          (startNs / (${Math.floor((endNS - startNS) / width)})) AS px
      FROM (
          SELECT  ts - ${recordStartNS} AS startNs,
          case when dur is null then (${endNS + recordStartNS} - ts) else dur end AS dura,
          value,
          MAX (value) AS max,
          MIN (value) AS min
          FROM measure
          WHERE filter_id IN (${maxId}, ${minId})
            AND startNs + dura >= ${Math.floor(startNS)}
            AND startNs <= ${Math.floor(endNS)}
          GROUP BY ts
          ) AS subquery
      GROUP BY px;
  `;
};

export const chartCpuFreqLimitDataSqlMem = (args: Args): string => {
  return `
      select ts - ${args.recordStartNS} as startNs,
           dur,
           max(value) as max,
           min(value) as min,
            $cpu as cpu 
    from measure where filter_id in (${args.maxId}, ${args.minId}) 
                 group by ts;
  `;
};

export function cpuFreqLimitReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    let res: unknown[];
    let list: unknown[];
    // @ts-ignore
    if (!cpuFreqLimitList.has(data.params.cpu)) {
      // @ts-ignore
      let sql = chartCpuFreqLimitDataSqlMem(data.params);
      list = proc(sql);
      for (let i = 0; i < list.length; i++) {
        if (i < list.length - 1) {
          // @ts-ignore
          list[i].dur = list[i + 1].startNs - list[i].startNs;
        } else {
          // @ts-ignore
          list[i].dur = data.params.recordEndNS - data.params.recordStartNS - list[i].startNs;
        }
      }
      // @ts-ignore
      cpuFreqLimitList.set(data.params.cpu, list);
    } else {
      // @ts-ignore
      list = cpuFreqLimitList.get(data.params.cpu) || [];
    }
    res = filterDataByGroup(
      list || [],
      'startNs',
      'dur',
      // @ts-ignore
      data.params.startNS,
      // @ts-ignore
      data.params.endNS,
      // @ts-ignore
      data.params.width,
      'value'
    );
    arrayBufferHandler(data, res, true);
  } else {
    // @ts-ignore
    let sql = chartCpuFreqLimitDataSql(data.params);
    let res = proc(sql);
    // @ts-ignore
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

function arrayBufferHandler(data: unknown, res: unknown[], transfer: boolean): void {
  // @ts-ignore
  let startNs = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startNs);
  // @ts-ignore
  let dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  // @ts-ignore
  let value = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.value);
  // @ts-ignore
  let max = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.max);
  // @ts-ignore
  let min = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.min);
  res.forEach((it, i) => {
    // @ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.cpuFreqLimitData);
    // @ts-ignore
    startNs[i] = it.startNs;
    // @ts-ignore
    dur[i] = it.dur;
    // @ts-ignore
    value[i] = it.value;
    // @ts-ignore
    max[i] = it.max;
    // @ts-ignore
    min[i] = it.min;
  });
  (self as unknown as Worker).postMessage(
    {
      // @ts-ignore
      id: data.id,
      // @ts-ignore
      action: data.action,
      results: transfer
        ? {
          startNs: startNs.buffer,
          dur: dur.buffer,
          value: value.buffer,
          max: max.buffer,
          min: min.buffer,
        }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer ? [startNs.buffer, dur.buffer, value.buffer, max.buffer, min.buffer] : []
  );
}
