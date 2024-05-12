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
import { Args } from '../CommonArgs';

export const chartCpuFreqDataSql = (args: Args): string => {
  const endNS = args.endNS;
  const startNS = args.startNS;
  const recordStartNS = args.recordStartNS;
  const cpu = args.cpu;
  const width = args.width;
  const recordEndNS = args.recordEndNS;
  return `select ${cpu} cpu,
                 value,
                 max(ifnull(dur, ${recordEndNS}-c.ts)) dur,
                 ts - ${recordStartNS} as startNs,
                 ((ts - ${recordStartNS}) / (${Math.floor((endNS - startNS) / width)})) AS px
          from measure c
          where c.filter_id = (select id from cpu_measure_filter t where t.cpu = ${cpu} 
          and (t.name = 'cpufreq' or t.name = 'cpu_frequency')
              limit 1)
            and startNs + ifnull(dur, ${recordEndNS}-c.ts) >= ${Math.floor(startNS)}
            and startNs <= ${Math.floor(endNS)}
          group by px
            union
            select ${cpu} cpu,
                 max(value),
                 dur dur,
                 ts - ${recordStartNS} as startNs,
                 ((ts - ${recordStartNS}) / (${Math.floor((endNS - startNS) / width)})) AS px
          from measure c
          where c.filter_id = (select id from cpu_measure_filter t where t.cpu = ${cpu} 
            and (t.name = 'cpufreq' or t.name = 'cpu_frequency')
              limit 1)
            and startNs + ifnull(dur, ${recordEndNS}-c.ts) >= ${Math.floor(startNS)}
            and startNs <= ${Math.floor(endNS)}
          group by px;
        ;`;
};

export const chartCpuFreqDataSqlMem = (args: Args): string => {
  const recordStartNS = args.recordStartNS;
  const cpu = args.cpu;
  const recordEndNS = args.recordEndNS;
  return `
      select cpu,
             value,
             ifnull(dur, ${recordEndNS} - c.ts) dur,
             ts - ${recordStartNS} as           startNs
      from measure c
               inner join
           cpu_measure_filter t
           on c.filter_id = t.id
      where (name = 'cpufreq' or name = 'cpu_frequency')
        and cpu = ${cpu};
  `;
};

export function cpuFreqDataReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    let res: unknown[];
    let list: unknown[];
    // @ts-ignore
    if (!cpuFreqList.has(data.params.cpu)) {
      // @ts-ignore
      list = proc(chartCpuFreqDataSqlMem(data.params));
      for (let i = 0; i < list.length; i++) {
        // @ts-ignore
        if (list[i].dur === -1 || list[i].dur === null || list[i].dur === undefined) {
          // @ts-ignore
          list[i].dur = data.params.recordEndNS - data.params.recordStartNS - list[i].startNs;
        }
      }
      // @ts-ignore
      cpuFreqList.set(data.params.cpu, list);
    } else {
      // @ts-ignore
      list = cpuFreqList.get(data.params.cpu) || [];
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
    let sql = chartCpuFreqDataSql(data.params);
    let res = proc(sql);
    // @ts-ignore
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

export function arrayBufferHandler(data: unknown, res: unknown[], transfer: boolean): void {
  // @ts-ignore
  let startNS = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startNS);
  // @ts-ignore
  let dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  // @ts-ignore
  let value = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.value);
  // @ts-ignore
  let cpu = new Uint8Array(transfer ? res.length : data.params.sharedArrayBuffers.cpu);
  res.forEach((it, i): void => {
    // @ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.cpuFreqData);
    // @ts-ignore
    startNS[i] = it.startNs;
    // @ts-ignore
    dur[i] = it.dur;
    // @ts-ignore
    cpu[i] = it.cpu;
    // @ts-ignore
    value[i] = it.value;
  });
  (self as unknown as Worker).postMessage(
    {
      // @ts-ignore
      id: data.id,
      // @ts-ignore
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
