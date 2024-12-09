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
import { xpowerList } from '../utils/AllMemoryCache';
import { Args } from '../CommonArgs';

export const chartXpowerDataSql = (args: Args): string => {
  return `
    select
    xm.filter_id,
    mf.name,
    xm.ts - ${args.recordStartNS} as startNs,
    xm.dur,
    xm.value,
    xm.type
    from 
    xpower_measure xm
    left join
    measure_filter mf
    on
    mf.id = xm.filter_id
    left join 
    trace_range r
    where 
    name = '${args.xpowerName}'
    order by
    startNs
    `;
};

export function xpowerDataReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    let res: unknown[];
    let list: unknown[];
    // @ts-ignore
    if (!xpowerList.has(data.params.xpowerName)) {
      // @ts-ignore
      list = proc(chartXpowerDataSql(data.params));
      for (let j = 0; j < list.length; j++) {
        // @ts-ignore
        if (list[j].name === 'ThermalReport.ShellTemp') {
          // @ts-ignore
          list[j].value = list[j].value / 1000;
        }
        if (j === list.length - 1) {
          // @ts-ignore
          list[j].dur = (data.params.totalNS || 0) - (list[j].startNs || 0);
        } else {
          // @ts-ignore
          list[j].dur = (list[j + 1].startNs || 0) - (list[j].startNs || 0);
        }
      }
      // @ts-ignore
      xpowerList.set(data.params.xpowerName, list);
    } else {
      // @ts-ignore
      list = xpowerList.get(data.params.xpowerName) || [];
    }
    // @ts-ignore
    if (data.params.queryAll) {
      //框选时候取数据，只需要根据时间过滤数据
      res = (list || []).filter(
        // @ts-ignore
        (it) => it.startNs + it.dur >= data.params.selectStartNS && it.startNs <= data.params.selectEndNS
      );
    } else {
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
    }
    arrayBufferHandler(data, res, true);
  } else {
    // @ts-ignore
    let sql = chartXpowerDataSql(data.params);
    let res = proc(sql);
    // @ts-ignore
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

function arrayBufferHandler(data: unknown, res: unknown[], transfer: boolean): void {
  // @ts-ignore
  let dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  // @ts-ignore
  let startNS = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startNS);
  // @ts-ignore
  let value = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.value);
  // @ts-ignore
  let filterId = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.filterId);
  res.forEach((it, i) => {
    // @ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.xpowerData);
    // @ts-ignore
    dur[i] = it.dur;
    // @ts-ignore
    startNS[i] = it.startNs;
    // @ts-ignore
    filterId[i] = it.filterId;
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
          dur: dur.buffer,
          startNS: startNS.buffer,
          value: value.buffer,
          filterId: filterId.buffer,
        }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer ? [dur.buffer, startNS.buffer, value.buffer, filterId.buffer] : []
  );
}
