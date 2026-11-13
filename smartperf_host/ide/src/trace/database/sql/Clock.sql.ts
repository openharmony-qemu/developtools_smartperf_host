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

import { query } from '../SqlLite';
import { ClockStruct } from '../ui-worker/ProcedureWorkerClock';

export const queryClockData = (traceId?: string): Promise<
  Array<{
    name: string;
    num: number;
    srcname: string;
    maxValue?: number;
  }>
> =>
  query(
    'queryClockData',
    `
    select name || ' Frequency' name, COUNT(*) num, name srcname
from (select id, name
      from clock_event_filter
      where type = 'clock_set_rate')
group by name
union
select name || ' State' name, COUNT(*) num, name srcname
from (select id, name
      from clock_event_filter
      where type != 'clock_set_rate')
group by name;
`, {}, {traceId: traceId}
  );

export const queryClockFrequency = (clockName: string): Promise<Array<ClockStruct>> =>
  query(
    'queryClockFrequency',
    `with freq as (  select measure.filter_id, measure.ts, measure.type, measure.value from clock_event_filter
      left join measure
      where 
      clock_event_filter.name = $clockName 
      and 
      clock_event_filter.type = 'clock_set_rate' 
      and 
      clock_event_filter.id = measure.filter_id
      order by measure.ts)
      select 
      freq.filter_id as filterId,
      freq.ts - r.start_ts as startNS,freq.type,freq.value from freq,trace_range r order by startNS`,
    { $clockName: clockName }
  );

export const queryClockState = (clockName: string): Promise<Array<ClockStruct>> =>
  query(
    'queryClockState',
    `with state as (
          select 
          filter_id, 
          ts, 
          endts, 
          endts-ts as dur, 
          type, 
          value 
          from
            (select 
            measure.filter_id, 
            measure.ts, 
            lead(ts, 1, null) over( order by measure.ts) endts, 
            measure.type, 
            measure.value 
            from clock_event_filter,trace_range
            left join measure
            where 
            clock_event_filter.name = $clockName 
            and clock_event_filter.type != 'clock_set_rate' and clock_event_filter.id = measure.filter_id
            order by measure.ts))
            select s.filter_id as filterId,s.ts-r.start_ts as startNS,s.type,s.value,s.dur from state s,trace_range r`,
    { $clockName: clockName }
  );

export const queryBootTime = (): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'queryBootTime',
    `select CS.ts -TR.start_ts as ts ,clock_name from clock_snapshot as CS ,trace_range as TR
      where clock_name = 'boottime'`,
    {}
  );

export const queryScreenState = (): Promise<Array<ClockStruct>> =>
  query(
    'queryScreenState',
    `select 
    m.type, 
    m.ts-r.start_ts as startNS, 
    value, filter_id as filterId 
    from 
    measure m,trace_range r 
    where filter_id in (select id from process_measure_filter where name = 'ScreenState')  order by startNS;
`
  );

export const queryRealTime = (): Promise<
  Array<{
    ts: number;
    name: string;
  }>
> =>
  query(
    'queryRealTime',
    `SELECT
  ( CASE WHEN CS.clock_name = 'realtime' THEN CS.ts ELSE CS.ts - TR.start_ts END ) AS ts,
  CS.clock_name AS name 
  FROM
  clock_snapshot AS CS,
  trace_range AS TR 
  WHERE
  CS.clock_name = 'realtime' 
  OR CS.clock_name = 'boottime';`
  );
