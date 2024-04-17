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
import {filterDataByGroup} from "../utils/DataFilter";
import {cpuFreqLimitList} from "../utils/AllMemoryCache";

export const chartCpuFreqLimitDataSql = (args: any): string => {
  return `
      SELECT 
             max AS max,
             min AS min,
             value,
             max(dura)     AS dur,
             startNs AS startNs,
             ${args.cpu} AS cpu,
          (startNs / (${Math.floor((args.endNS - args.startNS) / args.width)})) AS px
      FROM (
          SELECT  ts - ${args.recordStartNS} AS startNs,
          case when dur is null then (${args.endNS + args.recordStartNS} - ts) else dur end AS dura,
          value,
          MAX (value) AS max,
          MIN (value) AS min
          FROM measure
          WHERE filter_id IN (${args.maxId}, ${args.minId})
            AND startNs + dura >= ${Math.floor(args.startNS)}
            AND startNs <= ${Math.floor(args.endNS)}
          GROUP BY ts
          ) AS subquery
      GROUP BY px;
  `;
};

export const chartCpuFreqLimitDataSqlMem = (args: any): string => {
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



export function cpuFreqLimitReceiver(data: any, proc: Function): void {
  if (data.params.trafic === TraficEnum.Memory) {
    let res: any[], list: any[];
    if (!cpuFreqLimitList.has(data.params.cpu)) {
      let sql = chartCpuFreqLimitDataSqlMem(data.params);
      list = proc(sql);
      for (let i = 0; i < list.length; i++) {
        if(i<list.length-1){
          list[i].dur = list[i+1].startNs - list[i].startNs;
        }else{
          list[i].dur = data.params.endNS - list[i].startNs;
        }
      }
      cpuFreqLimitList.set(data.params.cpu, list);
    } else {
      list = cpuFreqLimitList.get(data.params.cpu) || [];
    }
    res = filterDataByGroup(list || [], 'startNs', 'dur', data.params.startNS, data.params.endNS, data.params.width,"value");
    arrayBufferHandler(data, res,true);
  } else {
    let sql = chartCpuFreqLimitDataSql(data.params);
    let res = proc(sql);
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

function arrayBufferHandler(data: any, res: any[], transfer: boolean): void {
  let startNs = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startNs);
  let dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  let value = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.value);
  let max = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.max);
  let min = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.min);
  res.forEach((it, i) => {
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.cpuFreqLimitData);
    startNs[i] = it.startNs;
    dur[i] = it.dur;
    value[i] = it.value;
    max[i] = it.max;
    min[i] = it.min;
  });
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
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
