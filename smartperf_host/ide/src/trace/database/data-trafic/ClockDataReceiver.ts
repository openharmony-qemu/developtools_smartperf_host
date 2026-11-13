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

import { TraficEnum } from './utils/QueryEnum';
import { filterDataByGroup } from './utils/DataFilter';
import { clockList } from './utils/AllMemoryCache';
import { Args } from './CommonArgs';

export const chartClockDataSql = (args: Args): string => {
  if (args.sqlType === 'clockFrequency') {
    return `
    with freq as (
        select measure.filter_id,
               measure.value,
               measure.ts,
               measure.type
        from measure
        where measure.filter_id in (select id
                                    from clock_event_filter
                                    where clock_event_filter.name = '${args.clockName}'
                                      and clock_event_filter.type = 'clock_set_rate')
                                      --and startNs >= ${Math.floor(args.startNS)}
                                      --and startNs <= ${Math.floor(args.endNS)}
    )
    select freq.filter_id as filterId, freq.value, freq.ts - ${args.recordStartNS} as startNs, freq.type
    from freq
    order by startNs;
    `;
  } else if (args.sqlType === 'clockState') {
    return `select measure.filter_id                                     as filterId,
                   measure.value                                         as value,
                   measure.ts - ${args.recordStartNS}                    as startNs,
                   (lead(ts, 1, null) over ( order by measure.ts)) - ts as dur,
                   measure.type                                          as type
            from measure
            where measure.filter_id in (select id
                from clock_event_filter
                where clock_event_filter.name = '${args.clockName}'
                and clock_event_filter.type != 'clock_set_rate')
            --and startNs + dur >= ${Math.floor(args.startNS)}
            --and startNs <= ${Math.floor(args.endNS)}`;
  } else if (args.sqlType === 'screenState') {
    return `select filter_id as filterId,value,  m.ts - ${args.recordStartNS} as startNs, m.type
            from measure m
            where filter_id in (select id from process_measure_filter where name = 'ScreenState')
            --and startNs >= ${Math.floor(args.startNS)}
            --and startNs <= ${Math.floor(args.endNS)};`;
  } else {
    return '';
  }
};

export const chartClockDataSqlMem = (args: Args): string => {
  if (args.sqlType === 'clockFrequency') {
    return `
        with freq as (  select 
          m.filter_id,
          m.ts,
          m.type,
          m.value from clock_event_filter as c
          left join measure as m on c.id = m.filter_id
          where c.name = '${args.clockName}' 
          and c.type = 'clock_set_rate'
          order by m.ts)
        select freq.filter_id as filterId,freq.ts - r.start_ts as startNs,freq.type,freq.value from freq,trace_range r order by startNs;
    `;
  } else if (args.sqlType === 'clockState') {
    return `with state as (
        select filter_id, ts, endts, endts-ts as dur, type, value from
            (select measure.filter_id, measure.ts, lead(ts, 1, null) over( order by measure.ts) endts, measure.type, measure.value from clock_event_filter,trace_range
                                                                                                                                                               left join measure
             where clock_event_filter.name = '${args.clockName}' and clock_event_filter.type != 'clock_set_rate' and clock_event_filter.id = measure.filter_id
             order by measure.ts))
            select s.filter_id as filterId,s.ts-r.start_ts as startNs,s.type,s.value,s.dur from state s,trace_range r`;
  } else if (args.sqlType === 'screenState') {
    return `select m.type, m.ts-r.start_ts as startNs, value, filter_id  as filterId 
    from measure m,trace_range r 
    where filter_id in (select id from process_measure_filter where name = 'ScreenState')  order by startNs;`;
  } else {
    return '';
  }
};

export function clockDataReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    let res: unknown[];
    let list: unknown[];
    // @ts-ignore
    if (!clockList.has(data.params.sqlType + data.params.clockName)) {
      // @ts-ignore
      let sql = chartClockDataSqlMem(data.params);
      // @ts-ignore
      list = proc(sql);
      for (let j = 0; j < list.length; j++) {
        if (j === list.length - 1) {
          // @ts-ignore
          list[j].dur = (data.params.totalNS || 0) - (list[j].startNs || 0);
        } else {
          // @ts-ignore
          list[j].dur = (list[j + 1].startNs || 0) - (list[j].startNs || 0);
        }
      }
      // @ts-ignore
      clockList.set(data.params.sqlType + data.params.clockName, list);
    } else {
      // @ts-ignore
      list = clockList.get(data.params.sqlType + data.params.clockName) || [];
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
    let sql = chartClockDataSql(data.params);
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
  let value = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.value);
  // @ts-ignore
  let filterId = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.filterId);
  res.forEach((it, i) => {
    // @ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.clockData);
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
