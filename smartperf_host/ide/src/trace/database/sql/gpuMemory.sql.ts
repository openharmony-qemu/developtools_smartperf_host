/*
 * Copyright (C) 2025 Huawei Device Co., Ltd.
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
import { NativeHookMalloc, NativeHookSampleQueryInfo } from '../../bean/NativeHook';
import { query } from '../SqlLite';

export class gpuProcess {
  ipid: number = 0;
  pid: number = 0;
  name: String = '';
}

export class GpuMemoryEventHeap {
  eventType: string = '';
  sumHeapSize: number = 0;
}

export const queryCount = (): Promise<Array<{ num: number }>> =>
  query('queryCount', `select count(1) num from native_hook_statistic`, {});

export const queryStatisticType = (): Promise<Array<{ num: number }>> =>
  query('queryStatisticType', `SELECT 
  EXISTS(SELECT 1 FROM native_hook_statistic WHERE type = 6) AS vk,
  EXISTS(SELECT 1 FROM native_hook_statistic WHERE type = 7) AS og,
  EXISTS(SELECT 1 FROM native_hook_statistic WHERE type = 8) AS oc;`, {});

export const queryGpuType = (): Promise<Array<{ num: number }>> =>
  query('queryGpuType', `SELECT 
    EXISTS(SELECT 1 FROM native_hook WHERE event_type = 'GPU_VK_Alloc_Event') AS vkAlloc,
    EXISTS(SELECT 1 FROM native_hook WHERE event_type = 'GPU_VK_Free_Event') AS vkFree,
    EXISTS(SELECT 1 FROM native_hook WHERE event_type = 'GPU_GLES_Alloc_Event') AS ogAlloc,
    EXISTS(SELECT 1 FROM native_hook WHERE event_type = 'GPU_GLES_Free_Event') AS ogFree,
    EXISTS(SELECT 1 FROM native_hook WHERE event_type = 'GPU_CL_Alloc_Event') AS ocAlloc,
    EXISTS(SELECT 1 FROM native_hook WHERE event_type = 'GPU_CL_Free_Event') AS ocFree;`, {});

export const queryProcess = (table: string): Promise<Array<gpuProcess>> => {
  let sql = `
    select
      distinct ${table}.ipid,
      pid,
      name
    from
      ${table}
    left join
      process p
    on
      ${table}.ipid = p.id
    `;
  return query('queryProcess', sql, {});
};

export const queryGpuMemoryRealTime = (): //@ts-ignore
  Promise<Array<unknown>> =>
  query(
    'queryGpuMemoryRealTime',
    `select cs.ts,cs.clock_name from datasource_clockid dc 
    left join clock_snapshot cs on dc.clock_id = cs.clock_id 
    where data_source_name = 'memory-plugin' or data_source_name = 'nativehook'
`,
    {}
  );

export const queryBootTime = (): //@ts-ignore
  Promise<Array<unknown>> =>
  query(
    'queryBootTime',
    `select CS.ts -TR.start_ts as ts ,clock_name from clock_snapshot as CS ,trace_range as TR
      where clock_name = 'boottime'`,
    {}
  );

export const queryGpuMemoryGroupByEvent = (type: string): Promise<Array<GpuMemoryEventHeap>> => {
  let sql = `
        SELECT
          event_type AS eventType,
          sum(heap_size) AS sumHeapSize
        FROM
          native_hook
        WHERE
          event_type = 'GPU_VK_Alloc_Event'
        UNION ALL
        SELECT
          event_type AS eventType,
          sum(heap_size) AS sumHeapSize
        FROM
          native_hook
        WHERE
          event_type = 'GPU_GLES_Alloc_Event'
        UNION ALL
        SELECT
          event_type AS eventType,
          sum(heap_size) AS sumHeapSize
        FROM
          native_hook
        WHERE
          event_type = 'GPU_CL_Alloc_Event'
        `;
  return query('queryGpuMemoryGroupByEvent', sql, {});
};

export const queryNativeHookStatisticSubType = (
  leftNs: number,
  rightNs: number,
  ipid: number,
  types: Array<string | number>
): //@ts-ignore
Promise<Array<unknown>> => {
  let condition = '';
  if (types && types.length > 0) {
    const sortedTypes: number[] = [...new Set(types)].map(type => Number(type)).sort((a, b) => a - b);
    if (sortedTypes.includes(0)) {
      condition = 'NHS.type IN (6,7,8)';
    } else {
      const typeValues: number[] = [];
      if (sortedTypes.includes(1)) typeValues.push(6);
      if (sortedTypes.includes(2)) typeValues.push(7);
      if (sortedTypes.includes(3)) typeValues.push(8);
      if (typeValues.length > 0) {
        condition = `NHS.type IN (${typeValues.join(',')})`;
      }
    }
  }
  return query(
    'queryNativeHookStatisticSubType',
    `SELECT DISTINCT
       IFNULL(NHS.sub_type_id, -1) AS subTypeId,
       CASE
         WHEN NHS.sub_type_id IS NULL AND NHS.type = 6 THEN 'GPU_VK'
         WHEN NHS.sub_type_id IS NULL AND NHS.type = 7 THEN 'GPU_GLES'
         WHEN NHS.sub_type_id IS NULL AND NHS.type = 8 THEN 'GPU_CL'
         WHEN NHS.sub_type_id IS NOT NULL THEN DD.data
       END AS subType
     FROM native_hook_statistic NHS
     LEFT JOIN data_dict DD ON NHS.sub_type_id = DD.id
     WHERE ${condition}
       AND EXISTS (
         SELECT 1 FROM trace_range TR 
         WHERE (NHS.ts - TR.start_ts) BETWEEN ${leftNs} AND ${rightNs}
       )
       AND NHS.ipid = ${ipid}
     ORDER BY subTypeId;
    `,
    { $leftNs: leftNs, $rightNs: rightNs }
  );
};

export const queryHeapSizeByIpid = (ipid: number): //@ts-ignore
  Promise<Array<NativeEventHeap>> => {
  return query(
    'queryHeapSizeByIpid',
    `SELECT
      event_type AS eventType,
      sum(heap_size) AS sumHeapSize
    FROM
      native_hook h left join process p on p.ipid = h.ipid
    WHERE
      event_type = 'GPU_VK_Alloc_Event' and
      p.ipid = ${ipid}
    UNION ALL
    SELECT
      event_type AS eventType,
      sum(heap_size) AS sumHeapSize
    FROM
      native_hook h left join process p on p.ipid = h.ipid
    WHERE
      event_type = 'GPU_GLES_Alloc_Event' and
      p.ipid = ${ipid}
    UNION ALL
    SELECT
      event_type AS eventType,
      sum(heap_size) AS sumHeapSize
    FROM
      native_hook h left join process p on p.ipid = h.ipid
    WHERE
      event_type = 'GPU_CL_Alloc_Event' and
      p.ipid = ${ipid}`
  );
};

export const queryNativeHookStatistics = (
  leftNs: number,
  rightNs: number,
  ipid: number
): Promise<Array<NativeHookMalloc>> =>
  query(
    'queryGpuHookStatistics',
    `
    select
      event_type as eventType,
      sub_type_id as subTypeId,
      max(heap_size) as max,
      sum(case when ((A.start_ts - B.start_ts) between ${leftNs} and ${rightNs}) then heap_size else 0 end) as allocByte,
      sum(case when ((A.start_ts - B.start_ts) between ${leftNs} and ${rightNs}) then 1 else 0 end) as allocCount,
      sum(case when ((A.end_ts - B.start_ts) between ${leftNs} and ${rightNs} ) then heap_size else 0 end) as freeByte,
      sum(case when ((A.end_ts - B.start_ts) between ${leftNs} and ${rightNs} ) then 1 else 0 end) as freeCount
    from
      native_hook A,
      trace_range B
    where
      (A.start_ts - B.start_ts) between ${leftNs} and ${rightNs}
     and (event_type = 'GPU_VK_Alloc_Event' or event_type = 'GPU_GLES_Alloc_Event' or event_type = 'GPU_CL_Alloc_Event')
     and ipid = ${ipid}
    group by event_type;`,
    { $leftNs: leftNs, $rightNs: rightNs }
  );

export const queryNativeHookStatisticsMalloc = (
  leftNs: number,
  rightNs: number,
  ipid: number
): Promise<Array<NativeHookMalloc>> =>
  query(
    'queryNativeHookStatisticsMalloc',
    `
      select
        event_type as eventType,
        heap_size as heapSize,
        sum(case when ((A.start_ts - B.start_ts) between ${leftNs} and ${rightNs}) then heap_size else 0 end) as allocByte,
        sum(case when ((A.start_ts - B.start_ts) between ${leftNs} and ${rightNs}) then 1 else 0 end) as allocCount,
        sum(case when ((A.end_ts - B.start_ts) between ${leftNs} and ${rightNs} ) then heap_size else 0 end) as freeByte,
        sum(case when ((A.end_ts - B.start_ts) between ${leftNs} and ${rightNs} ) then 1 else 0 end) as freeCount
      from
        native_hook A,
        trace_range B
      where
        (A.start_ts - B.start_ts) between ${leftNs} and ${rightNs}
      and
        (event_type = 'GPU_VK_Alloc_Event' or event_type = 'GPU_GLES_Alloc_Event' or event_type = 'GPU_CL_Alloc_Event')
      and 
        sub_type_id is null
        and ipid = ${ipid}
      group by
        event_type,
        heap_size
      order by heap_size desc
      `,
    { $leftNs: leftNs, $rightNs: rightNs }
  );

  export const queryNativeHookStatisticsSubType = (
    leftNs: number,
    rightNs: number,
    ipid: number
  ): Promise<Array<NativeHookMalloc>> =>
    query(
      'queryNativeHookStatisticsSubType',
      `
        select
          event_type as eventType,
          sub_type_id as subTypeId,
          max(heap_size) as max,
          sum(case when ((NH.start_ts - TR.start_ts) between ${leftNs} and ${rightNs}) then heap_size else 0 end) as allocByte,
          sum(case when ((NH.start_ts - TR.start_ts) between ${leftNs} and ${rightNs}) then 1 else 0 end) as allocCount,
          sum(case when ((NH.end_ts - TR.start_ts) between ${leftNs} and ${rightNs} ) then heap_size else 0 end) as freeByte,
          sum(case when ((NH.end_ts - TR.start_ts) between ${leftNs} and ${rightNs} ) then 1 else 0 end) as freeCount
        from
          native_hook NH,
          trace_range TR
        where
          (NH.start_ts - TR.start_ts) between ${leftNs} and ${rightNs}
        and
          (event_type = 'GPU_VK_Alloc_Event' or event_type = 'GPU_GLES_Alloc_Event' or event_type = 'GPU_CL_Alloc_Event')
        and ipid = ${ipid}
        group by
          event_type,sub_type_id;
            `,
      { $leftNs: leftNs, $rightNs: rightNs }
    );

  export const queryNativeHookSubType = (
    leftNs: number,
    rightNs: number,
    ipid: number,
    types: Array<string | number>
  ): //@ts-ignore
  Promise<Array<unknown>> => {
    let condition = '';
    if (types && types.length > 0) {
      const sortedTypes: number[] = [...new Set(types)].map(type => Number(type)).sort((a, b) => a - b);
      if (sortedTypes.includes(0)) {
        condition = `NH.event_type IN ('GPU_VK_Alloc_Event', 'GPU_GLES_Alloc_Event', 'GPU_CL_Alloc_Event')`;
      } else {
        const typeValues: string[] = [];
        if (sortedTypes.includes(1)) typeValues.push('GPU_VK_Alloc_Event');
        if (sortedTypes.includes(2)) typeValues.push('GPU_GLES_Alloc_Event');
        if (sortedTypes.includes(3)) typeValues.push('GPU_CL_Alloc_Event');
        if (typeValues.length > 0) {
          const quotedValues = typeValues.map(value => `'${value}'`).join(',');
          condition = `NH.event_type IN (${quotedValues})`;
        }
      }
    }
    return query(
      'queryNativeHookSubType',
      `SELECT DISTINCT
         IFNULL(NH.sub_type_id, -1) AS subTypeId,
         CASE
           WHEN NH.sub_type_id IS NULL AND NH.event_type = 'GPU_VK_Alloc_Event' THEN 'GPU_VK'
           WHEN NH.sub_type_id IS NULL AND NH.event_type = 'GPU_GLES_Alloc_Event' THEN 'GPU_GLES'
           WHEN NH.sub_type_id IS NULL AND NH.event_type = 'GPU_CL_Alloc_Event' THEN 'GPU_CL'
           WHEN NH.sub_type_id IS NOT NULL THEN DD.data
         END AS subType
       FROM native_hook NH
       LEFT JOIN data_dict DD ON NH.sub_type_id = DD.id
       WHERE ${condition}
         AND EXISTS (
           SELECT 1 FROM trace_range TR 
           WHERE (NH.start_ts - TR.start_ts) BETWEEN ${leftNs} AND ${rightNs}
         )
         AND NH.ipid = ${ipid}
       ORDER BY subTypeId;
      `,
      { $leftNs: leftNs, $rightNs: rightNs }
    );
  };

export const queryGpuSnapshotTypes = (ipid: number): Promise<Array<NativeHookSampleQueryInfo>> =>
  query(
    'queryGpuSnapshotTypes',
    `
  select
        event_type as eventType,
        data as subType
      from
        native_hook left join data_dict on native_hook.sub_type_id = data_dict.id
      where
        (event_type = 'GPU_VK_Alloc_Event' or event_type = 'GPU_GLES_Alloc_Event' or event_type = 'GPU_CL_Alloc_Event')
        and ipid = ${ipid}
      group by
        event_type,data;`,
    {}
  );

export const queryGpuAllHookData = (rightNs: number, ipid: number): Promise<Array<NativeHookSampleQueryInfo>> =>
  query(
    'queryGpuAllHookData',
    `
        select
          callchain_id as eventId,
          event_type as eventType,
          data as subType,
          addr,
          heap_size as growth,
          (n.start_ts - t.start_ts) as startTs,
          (n.end_ts - t.start_ts) as endTs
        from
          native_hook n left join data_dict on n.sub_type_id = data_dict.id,
          trace_range t
        where
          (event_type = 'GPU_VK_Alloc_Event' or event_type = 'GPU_GLES_Alloc_Event' or event_type = 'GPU_CL_Alloc_Event')
          and ipid = ${ipid}
        and
          n.start_ts between t.start_ts and ${rightNs} + t.start_ts`,
    { $rightNs: rightNs }
  );