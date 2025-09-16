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
import { NativeHookMalloc } from '../../bean/NativeHook';
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
    let sql1 = `
        SELECT
          event_type AS eventType,
          sum(heap_size) AS sumHeapSize
        FROM
          native_hook
        WHERE
          event_type = 'AllocEvent'
        UNION ALL
        SELECT
          event_type AS eventType,
          sum(heap_size) AS sumHeapSize
        FROM
          native_hook
        WHERE
          event_type = 'MmapEvent'
        `;
    let sql2 = `
            select (case when type = 0 then 'AllocEvent' else 'MmapEvent' end) eventType,
                sum(apply_size) sumHeapSize
            from native_hook_statistic
            group by eventType;
        `;
    return query('queryGpuMemoryGroupByEvent', type === 'native_hook' ? sql1 : sql2, {});
};

export const queryNativeHookStatisticSubType = (
  leftNs: number,
  rightNs: number,
  ipid: number
): //@ts-ignore
  Promise<Array<unknown>> =>
  query(
    'queryNativeHookStatisticSubType',
    `SELECT DISTINCT
      type AS subTypeId,
      CASE
        WHEN type = 6 THEN 'VulKan'
        WHEN type = 7 THEN 'OpenGLES'
        WHEN type = 8 THEN 'OpenCL' END AS subType
      FROM
        native_hook_statistic NHS,
        trace_range TR
      WHERE
        NHS.type IN (6, 7, 8) AND
        (NHS.ts - TR.start_ts) between ${leftNs} and ${rightNs}
        AND ipid = ${ipid}
      `,
    { $leftNs: leftNs, $rightNs: rightNs }
  );

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