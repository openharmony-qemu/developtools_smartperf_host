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

import { XpowerComponentTopStruct } from '../../component/trace/sheet/xpower/TabPaneXpowerComponentTop';
import { query } from '../SqlLite';
export const queryXpowerMeasureData = (traceId?: string): Promise<
  Array<{
    filter_id: number;
  }>
> =>
  query(
    'queryXpowerMeasureData',
    `
    select 
        name 
    from     
        measure_filter mf
    where
        mf.type = 'xpower_filter'
;
`, {}, { traceId: traceId }
  );

export const queryXpowerData = (traceId?: string): Promise<
  Array<{
    name: string;
    num: number;
    maxValue: number;
    minValue: number;
  }>
> =>
  query(
    'queryXpowerData',
    `
      select
        name,
        COUNT(*) num,
                max(value) maxValue,
                min(value) minValue
      from
        measure_filter mf
      left join
        xpower_measure xm
      on
        mf.id = xm.filter_id
      where
        mf.type = 'xpower_filter'
      group by name
;
`, {}, { traceId: traceId }
  );

export const queryTraceConfig = (traceId?: string): Promise<
  Array<{
    traceSource: string;
    key: string;
    value: string;
  }>
> =>
  query(
    'queryTraceConfig',
    `
    select
      trace_source as traceSource,
      key,
      value
    from
      trace_config;
;
`, {}, { traceId: traceId }
  );

export const queryXpowerComponentTop = (leftNS: number, rightNS: number, dur: number, traceId?: string): Promise<
  Array<XpowerComponentTopStruct>
> =>
  query(
    'queryXpowerComponentTop',
    `
    select
        (start_time - tr.start_ts) as startNS,
        component_type_id as componentTypeId,
        appname as appName,
        background_duration as backgroundDuration,
        background_energy as backgroundEnergy,
        foreground_duration as foregroundDuration,
        foreground_energy as foregroundEnergy,
        screen_off_duration as screenOffDuration,
        screen_off_energy as screenOffEnergy,
        screen_on_duration as screenOnDuration,
        screen_on_energy as screenOnEnergy,
        camera_id as cameraId,
        uid as uId,
        load,
        app_usage_duration as appUsageDuration,
        app_usage_energy as appUsageEnergy
    from
      xpower_component_top,
      trace_range as tr
    where
      $leftNS <= startNS + ${dur} and $rightNS >= startNS
    `, { $leftNS: leftNS, $rightNS: rightNS, traceId: traceId }
);

export const queryFreq = (traceId?: string): Promise<Array<{ frequency: number }>> =>
  query(
    'queryTraceConfig',
    `
  select
    frequency
  from
    xpower_app_detail_gpu
  order by
    frequency
`,
    {},
    { traceId: traceId }
  );