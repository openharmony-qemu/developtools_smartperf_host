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
import { cpuFreqList } from '../utils/AllMemoryCache';

export const chartCpuFreqDataSql = (args: any): string => {
  return `select ${args.cpu} cpu,
                 value,
                 max(ifnull(dur, ${args.recordEndNS}-c.ts)) dur,
                 ts - ${args.recordStartNS} as startNs,
                 ((ts - ${args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)})) AS px
          from measure c
          where c.filter_id = (select id from cpu_measure_filter t where t.cpu = ${args.cpu} 
          and (t.name = 'cpufreq' or t.name = 'cpu_frequency')
              limit 1)
            and startNs + ifnull(dur, ${args.recordEndNS}-c.ts) >= ${Math.floor(args.startNS)}
            and startNs <= ${Math.floor(args.endNS)}
          group by px
            union
            select ${args.cpu} cpu,
                 max(value),
                 dur dur,
                 ts - ${args.recordStartNS} as startNs,
                 ((ts - ${args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)})) AS px
          from measure c
          where c.filter_id = (select id from cpu_measure_filter t where t.cpu = ${args.cpu} 
            and (t.name = 'cpufreq' or t.name = 'cpu_frequency')
              limit 1)
            and startNs + ifnull(dur, ${args.recordEndNS}-c.ts) >= ${Math.floor(args.startNS)}
            and startNs <= ${Math.floor(args.endNS)}
          group by px;
        ;`;
};

export const chartCpuFreqDataSqlMem = (args: any): string => {
  return `
      select cpu,
             value,
             ifnull(dur, ${args.recordEndNS} - c.ts) dur,
             ts - ${args.recordStartNS} as           startNs
      from measure c
               inner join
           cpu_measure_filter t
           on c.filter_id = t.id
      where (name = 'cpufreq' or name = 'cpu_frequency')
        and cpu = ${args.cpu};
  `;
};

export function cpuFreqDataReceiver(data: any, proc: Function): void {
  if (data.params.trafic === TraficEnum.Memory) {
    let res: any[], list: any[];
    if (!cpuFreqList.has(data.params.cpu)) {
      list = proc(chartCpuFreqDataSqlMem(data.params));
      for (let i = 0; i < list.length; i++) {
        if (list[i].dur === -1 || list[i].dur === null || list[i].dur === undefined) {
          list[i].dur = data.params.recordEndNS - data.params.recordStartNS - list[i].startNs;
        }
      }
      cpuFreqList.set(data.params.cpu, list);
    } else {
      list = cpuFreqList.get(data.params.cpu) || [];
    }
    res = filterDataByGroup(
      list || [],
      'startNs',
      'dur',
      data.params.startNS,
      data.params.endNS,
      data.params.width,
      'value'
    );
    arrayBufferHandler(data, res, true);
  } else {
    let sql = chartCpuFreqDataSql(data.params);
    let res = proc(sql);
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

export function arrayBufferHandler(data: any, res: any[], transfer: boolean): void {
  let startNS = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startNS);
  let dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  let value = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.value);
  let cpu = new Uint8Array(transfer ? res.length : data.params.sharedArrayBuffers.cpu);
  res.forEach((it, i): void => {
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.cpuFreqData);
    startNS[i] = it.startNs;
    dur[i] = it.dur;
    cpu[i] = it.cpu;
    value[i] = it.value;
  });
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
      action: data.action,
      results: transfer
        ? {
            startNS: startNS.buffer,
            dur: dur.buffer,
            value: value.buffer,
            cpu: cpu.buffer,
          }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer ? [startNS.buffer, dur.buffer, value.buffer, cpu.buffer] : []
  );
}
