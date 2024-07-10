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
//  VM Tracker Gpu Memory泳道图
import type { SnapshotStruct } from '../ui-worker/ProcedureWorkerSnapshot';
import { query } from '../SqlLite';
import { GpuMemory, GpuMemoryComparison } from '../../bean/AbilityMonitor';
import type { MemoryConfig } from '../../bean/MemoryConfig';

export const queryGpuMemoryData = (processId: number): Promise<Array<SnapshotStruct>> =>
  query(
    'queryGpuMemorySampsData',
    `SELECT
    (A.ts - B.start_ts) as startNs,
    sum(A.used_gpu_size) as value,
    A.ipid as ipid
    FROM memory_process_gpu A,trace_range B
    WHERE
    $pid = A.ipid
    AND A.ts < B.end_ts
    GROUP by A.ts;`,
    { $pid: processId }
  );

// 判断VM Tracker Gpu Memory泳道图是否有数据
export const queryisExistsGpuMemoryData = (processId: number): Promise<Array<SnapshotStruct>> =>
  query(
    'queryisExistsGpuMemoryData',
    `SELECT EXISTS (
      SELECT 1
      FROM memory_process_gpu A, trace_range B
      WHERE $pid = A.ipid
      AND A.ts < B.end_ts
      GROUP BY A.ts
   ) AS data_exists`,
    { $pid: processId }
  );

//VM Tracker SkiaGpuMemory 框选
export const getTabGpuMemoryData = (
  leftNs: number,
  rightNs: number,
  processId: number,
  dur: number
): Promise<Array<GpuMemory>> =>
  query<GpuMemory>(
    'getTabGpuMemoryData',
    `SELECT  
      (S.ts-TR.start_ts) as startNs,
      gpu_name_id as gpuNameId,
      T.tid as threadId,
      T.name as threadName,
      MAX(S.used_gpu_size) as maxSize,
      MIN(S.used_gpu_size) as minSize,
      Avg(S.used_gpu_size) as avgSize
      from trace_range as TR,memory_process_gpu as S
      left join thread as T on T.itid=S.itid
      where
       $leftNS <= startNs + ${dur}
      and
      $rightNS >= startNs
      and
        $pid = S.ipid
      group by gpu_name_id,threadId
              `,
    { $leftNS: leftNs, $rightNS: rightNs, $pid: processId }
  );

//VM Tracker SkiaGpuMemory 点选
export const getTabGpuMemoryVMTrackerClickData = (startNs: number, processId: number):
  Promise<Array<GpuMemory>> =>
  query<GpuMemory>(
    'getTabGpuMemoryVMTrackerClickData',
    `SELECT
    (S.ts-TR.start_ts) as startNs,
    S.used_gpu_size as size,
    T.tid as threadId,
    T.name as threadName,
    A.data as gpuName
    from trace_range as TR,memory_process_gpu as S
    left join thread as T on T.itid=S.itid
    left join data_dict as A on A.id=S.gpu_name_id
    WHERE
    startNs = ${startNs}
    AND
    $pid = S.ipid
              `,
    { $startNs: startNs, $pid: processId }
  );

//VM Tracker Gpu Memory 点选比较
export const getTabGpuMemoryVmTrackerComparisonData = (
  startNs: number,
  processId: number
): Promise<Array<GpuMemoryComparison>> =>
  query<GpuMemoryComparison>(
    'getTabGpuMemoryVmTrackerComparisonData',
    `SELECT
    (S.ts-TR.start_ts) as startNs,
    sum(S.used_gpu_size) as value,
    T.tid as threadId,
    T.name as threadName,
    S.gpu_name_id as gpuNameId
    from trace_range as TR,memory_process_gpu as S
    left join thread as T on T.itid=S.itid
    WHERE
    startNs = ${startNs}
    AND
    $pid = S.ipid
                `,
    { $startNs: startNs, $pid: processId }
  );

export const queryMemFilterIdMaxValue = (): Promise<Array<{ filterId: number; maxValue: number }>> => {
  return query(
    'queryMemFilterIdMaxValue',
    `select filter_id as filterId,max(value) maxValue from process_measure group by filter_id;`
  );
};

export const getTabVirtualMemoryType = (startTime: number, endTime: number): Promise<Array<string>> =>
  query(
    'getTabVirtualMemoryType',
    `
    SELECT type from paged_memory_sample s,trace_range t
     WHERE s.end_ts >= $startTime + t.start_ts 
     and s.start_ts <= $endTime + t.start_ts 
     group by type`,
    { $startTime: startTime, $endTime: endTime }
  );

export const queryNativeMemoryRealTime = (): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'queryNativeMemoryRealTime',
    `select cs.ts,cs.clock_name from datasource_clockid dc 
    left join clock_snapshot cs on dc.clock_id = cs.clock_id 
    where data_source_name = 'memory-plugin' or data_source_name = 'nativehook'
`,
    {}
  );

export const queryJsMemoryData = (): //@ts-ignore
Promise<Array<unknown>> => query('queryJsMemoryData',
  'SELECT 1 WHERE EXISTS(SELECT 1 FROM js_heap_nodes)');

export const queryVmTrackerShmData = (
  iPid: number
): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'queryVmTrackerShmData',
    `SELECT (A.ts - B.start_ts) as startNs,
      sum(A.size) as value 
    FROM
      memory_ashmem A,trace_range B 
    where
      A.ipid = ${iPid}
      AND A.ts < B.end_ts
    and
      flag = 0
    GROUP by A.ts`,
    {}
  );
export const queryVmTrackerShmSelectionData = (
  startNs: number,
  ipid: number
): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'queryVmTrackerShmSelectionData',
    `SELECT (A.ts - B.start_ts) as startNS,A.ipid,
             A.fd,A.size,A.adj,A.ashmem_name_id as name,
             A.ashmem_id as id,A.time,A.purged,A.ref_count as count,
             A.flag
             FROM memory_ashmem A,trace_range B 
             where startNS = ${startNs} and ipid = ${ipid};`,
    {}
  );
export const queryMemoryConfig = (): Promise<Array<MemoryConfig>> =>
  query(
    'queryMemoryConfiig',
    `SELECT ipid as iPid, process.pid AS pid,
      process.name AS processName,
      (
        SELECT value 
        FROM trace_config 
        WHERE trace_source = 'memory_config' AND key = 'sample_interval') AS interval
    FROM
      trace_config
      LEFT JOIN process ON value = ipid
    WHERE
      trace_source = 'memory_config'
      AND key = 'ipid'
      ;`
  );

// VM Tracker Purgeable泳道图
export const queryPurgeableProcessData = (
  ipid: number,
  isPin?: boolean
): //@ts-ignore
Promise<Array<unknown>> => {
  const pinSql = isPin ? ' AND a.ref_count > 0' : '';
  const names = isPin ? " ('mem.purg_pin')" : "('mem.purg_sum')";
  return query(
    'queryPurgeableProcessData',
    `SELECT startNs, sum( value ) AS value 
    FROM
        (SELECT
            m.ts - tr.start_ts AS startNs,
            sum(m.value) AS value
        FROM
            process_measure m,
            trace_range tr
            LEFT JOIN process_measure_filter f ON f.id = m.filter_id
        WHERE
            m.ts < tr.end_ts
            AND f.name = ${names}
            AND f.ipid = ${ipid}
        GROUP BY m.ts
        UNION ALL
        SELECT
            a.ts - tr.start_ts AS startNs,
            sum( a.pss ) AS value 
        FROM
            memory_ashmem a,
            trace_range tr 
        WHERE
            a.ts < tr.end_ts
            AND a.flag = 0
            AND a.ipid = ${ipid}
            ${pinSql}
            GROUP BY a.ts) 
        GROUP BY startNs`
  );
};

export const queryVirtualMemory = (): //@ts-ignore
Promise<Array<unknown>> =>
  query('queryVirtualMemory',
    `select 
    id,
    name 
    from sys_event_filter where type='sys_virtual_memory_filter'`);

export const queryVirtualMemoryData = (
  filterId: number
): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'queryVirtualMemoryData',
    `select ts-${window.recordStartNS} as startTime,value,filter_id as filterID 
    from sys_mem_measure where filter_id=$filter_id`,
    { $filter_id: filterId }
  );

export const queryTraceMemory = (): Promise<
  Array<{
    maxNum: string;
    minNum: string;
    avgNum: string;
    name: string;
    processName: string;
  }>
> =>
  query(
    'queryTraceMemory',
    `
    select
        max(value) as maxNum,
        min(value) as minNum,
        avg(value) as avgNum,
        filter.name as name,
        p.name as processName
        from process_measure
        left join process_measure_filter as filter on filter.id= filter_id
        left join process as p on p.id = filter.ipid
    where 
    filter_id > 0 
    and 
    filter.name = 'mem.rss.anon' 
    group by 
    filter_id 
    order by 
    avgNum desc`
  );

export const queryTraceMemoryTop = (): Promise<
  Array<{
    maxNum: string;
    minNum: string;
    avgNum: string;
    name: string;
    processName: string;
  }>
> =>
  query(
    'queryTraceMemoryTop',
    `
    select
        max(value) as maxNum,
        min(value) as minNum,
        avg(value) as avgNum,
        f.name as name,
        p.name as processName
        from process_measure
        left join process_measure_filter as f on f.id= filter_id
        left join process as p on p.id = f.ipid
    where
    filter_id > 0
    and
    f.name = 'mem.rss.anon'
    group by
    filter_id
    order by
    avgNum desc limit 10`
  );

export const queryTraceMemoryUnAgg = (): Promise<
  Array<{
    processName: string;
    name: string;
    value: string;
    ts: string;
  }>
> =>
  query(
    'queryTraceMemoryUnAgg',
    `
    select
        p.name as processName,
        group_concat(filter.name) as name,
        cast(group_concat(value) as varchar) as value,
        cast(group_concat(ts) as varchar) as ts
        from process_measure m
        left join process_measure_filter as filter on filter.id= m.filter_id
        left join process as p on p.id = filter.ipid
        where 
        filter.name = 'mem.rss.anon' 
        or 
        filter.name = 'mem.rss.file' 
        or 
        filter.name = 'mem.swap' 
        or 
        filter.name = 'oom_score_adj'
    group by 
    p.name,filter.ipid 
    order by 
    filter.ipid`
  );

export const queryMemoryMaxData = (
  memoryName: string
): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'queryMemoryMaxData',
    `SELECT ifnull(max(m.value),0) as maxValue,
            filter_id 
            from sys_mem_measure m 
            WHERE m.filter_id =
            (SELECT id FROM sys_event_filter WHERE name = $memoryName)
`,
    { $memoryName: memoryName }
  );

export const getTabPaneVirtualMemoryStatisticsData = (
  leftNs: number,
  rightNs: number
): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'getTabPaneVirtualMemoryStatisticsData',
    `
    select p.pid,
       t.tid,
       ifnull(p.name,'Process') as pname,
       ifnull(t.name,'Thread') as tname,
       f.type,
       f.ipid,
       f.itid,
       count(f.ipid) as count,
       sum(dur) as allDuration,
       min(dur) as minDuration,
       max(dur) as maxDuration,
       avg(dur) as avgDuration
    from paged_memory_sample as f 
    left join process as p on f.ipid=p.ipid left join thread as t on f.itid=t.itid
    where f.end_ts >= $leftNs
    and f.start_ts <= $rightNs
    group by f.type,f.ipid,f.itid
    order by f.type;
`,
    { $leftNs: leftNs, $rightNs: rightNs }
  );

export const getFileSysVirtualMemoryChartData = (): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'getFileSysVirtualMemoryChartData',
    `
    select
       (A.start_ts -B.start_ts) as startNS,
       (A.end_ts - B.start_ts) as endNS,
       dur as dur
    from paged_memory_sample A,trace_range B
    where startNS > 0
    order by A.start_ts;`,
    {}
  );

export const hasFileSysData = (): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'hasFileSysData',
    `
    select 
        fsCount,
        vmCount,
        ioCount from
        (select count(1) as fsCount from file_system_sample s,trace_range t where (s.start_ts between t.start_ts and t.end_ts) or (s.end_ts between t.start_ts and t.end_ts) )
        ,(select count(1) as vmCount from paged_memory_sample s,trace_range t where (s.start_ts between t.start_ts and t.end_ts) or (s.end_ts between t.start_ts and t.end_ts) )
        ,(select count(1) as ioCount from bio_latency_sample s,trace_range t where (s.start_ts between t.start_ts and t.end_ts) or (s.end_ts between t.start_ts and t.end_ts) );
    `,
    {}
  );

export const queryEbpfSamplesCount = (
  startTime: number,
  endTime: number,
  ipids: number[]
): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'queryEbpfSamplesCount',
    `
    select
    fsCount,
    vmCount 
    from
    (select count(1) as fsCount from file_system_sample s,trace_range t 
    where s.end_ts between $startTime + t.start_ts and $endTime + t.start_ts ${
  ipids.length > 0 ? `and s.ipid in (${ipids.join(',')})` : ''
})
,(select count(1) as vmCount from paged_memory_sample s,trace_range t 
where s.end_ts between $startTime + t.start_ts and $endTime + t.start_ts ${
  ipids.length > 0 ? `and s.ipid in (${ipids.join(',')})` : ''
});
`,
  { $startTime: startTime, $endTime: endTime }
);

export const queryisExistsShmData = (
  iPid: number
): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'queryisExistsShmData',
    `SELECT EXISTS (
        SELECT 1
        FROM memory_ashmem A,trace_range B 
        where A.ipid = ${iPid}
        AND A.ts < B.end_ts
        AND flag = 0
        GROUP BY A.ts
    ) AS data_exists`,
    {}
  );

export const queryVmTrackerShmSizeData = (
  leftNs: number,
  rightNs: number,
  iPid: number,
  dur: number
): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'queryVmTrackerShmSizeData',
    `SELECT ( A.ts - B.start_ts ) AS startNS,
        A.flag,
        avg( A.size ) AS avg,
        max( A.size ) AS max,
        min( A.size ) AS min,
        sum( A.size ) AS sum 
      FROM
        memory_ashmem A,
        trace_range B 
      WHERE 
        startNS <= ${rightNs}  and (startNS+ ${dur}) >=${leftNs}
        AND ipid = ${iPid}`,
    {}
  );

export const queryisExistsPurgeableData = (
  ipid: number,
  isPin?: boolean
): //@ts-ignore
Promise<Array<unknown>> => {
  const pinSql = isPin ? ' AND a.ref_count > 0' : '';
  const names = isPin ? " ('mem.purg_pin')" : "('mem.purg_sum')";
  return query(
    'queryisExistsPurgeableData',
    `SELECT EXISTS (
        SELECT 1
        FROM
          (SELECT 1
          FROM
              process_measure m,
              trace_range tr
              LEFT JOIN process_measure_filter f ON f.id = m.filter_id
          WHERE
              m.ts < tr.end_ts
              AND f.name = ${names}
              AND f.ipid = ${ipid}
          UNION ALL
          SELECT 1
          FROM
              memory_ashmem a,
              trace_range tr
          WHERE
              a.ts < tr.end_ts
              AND a.flag = 0
              AND a.ipid = ${ipid}
              ${pinSql})
        ) AS data_exists`
  );
};
