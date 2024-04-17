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
import {
  GpuMemory,
  GpuMemoryComparison,
  SystemCpuSummary,
  SystemDiskIOSummary,
  SystemNetworkSummary
} from "../../bean/AbilityMonitor";
import {query} from "../SqlLite";
import {CpuAbilityMonitorStruct} from "../ui-worker/ProcedureWorkerCpuAbility";
import {MemoryAbilityMonitorStruct} from "../ui-worker/ProcedureWorkerMemoryAbility";
import {DiskAbilityMonitorStruct} from "../ui-worker/ProcedureWorkerDiskIoAbility";
import {NetworkAbilityMonitorStruct} from "../ui-worker/ProcedureWorkerNetworkAbility";
import type {SnapshotStruct} from "../ui-worker/ProcedureWorkerSnapshot";

export const getTabCpuAbilityData = (leftNs: number, rightNs: number): Promise<Array<SystemCpuSummary>> =>
  query<SystemCpuSummary>(
    'getTabCpuAbilityData',
    `SELECT
        ( n.ts - TR.start_ts ) AS startTime,
        n.dur AS duration,
        n.total_load AS totalLoad,
        n.user_load AS userLoad,
        n.system_load AS systemLoad,
        n.process_num AS threads 
        FROM
        cpu_usage AS n,
        trace_range AS TR 
        WHERE
        ( n.ts - TR.start_ts ) >= ifnull((
        SELECT
        ( usage.ts - TR.start_ts ) 
        FROM
        cpu_usage usage,
        trace_range TR 
        WHERE
        ( usage.ts - TR.start_ts ) <= $leftNS 
        ORDER BY
        usage.ts DESC 
        LIMIT 1 
        ),0)
        AND ( n.ts - TR.start_ts ) <= $rightNS 
        ORDER BY
        startTime ASC;
    `,
    { $leftNS: leftNs, $rightNS: rightNs }
  );
export const getTabMemoryAbilityData = (
  leftNs: number,
  rightNs: number
): Promise<
  Array<{
    startTime: number;
    value: string;
    name: string;
  }>
> =>
  query(
    'getTabMemoryAbilityData',
    `SELECT
        m.ts AS startTime,
        GROUP_CONCAT( IFNULL( m.value, 0 ) ) AS value,
        GROUP_CONCAT( f.name ) AS name 
        FROM
        sys_mem_measure AS m
        INNER JOIN sys_event_filter AS f ON m.filter_id = f.id 
        AND (f.name = 'sys.mem.total' 
         or f.name = 'sys.mem.free'
         or f.name = 'sys.mem.buffers'
         or f.name = 'sys.mem.cached' 
         or f.name = 'sys.mem.shmem'
         or f.name = 'sys.mem.slab'
         or f.name = 'sys.mem.swap.total'
         or f.name = 'sys.mem.swap.free'
         or f.name = 'sys.mem.mapped'
         or f.name = 'sys.mem.vmalloc.used'
         or f.name = 'sys.mem.page.tables'
         or f.name = 'sys.mem.kernel.stack'
         or f.name = 'sys.mem.active'
         or f.name = 'sys.mem.inactive'
         or f.name = 'sys.mem.unevictable'
         or f.name = 'sys.mem.vmalloc.total'
         or f.name = 'sys.mem.slab.unreclaimable'
         or f.name = 'sys.mem.cma.total'
         or f.name = 'sys.mem.cma.free'
         or f.name = 'sys.mem.kernel.reclaimable'
         or f.name = 'sys.mem.zram'
         ) 
        AND m.ts >= ifnull((
        SELECT
        m.ts AS startTime 
        FROM
        sys_mem_measure AS m
        INNER JOIN sys_event_filter AS f ON m.filter_id = f.id 
        AND m.ts <= $leftNS 
        AND (f.name = 'sys.mem.total'
         or f.name = 'sys.mem.kernel.stack'
         or f.name = 'sys.mem.free'
         or f.name = 'sys.mem.swap.free'
         or f.name = 'sys.mem.cma.free'
         or f.name = 'sys.mem.inactive'
         or f.name = 'sys.mem.buffers'
         or f.name = 'sys.mem.cached' 
         or f.name = 'sys.mem.shmem'
         or f.name = 'sys.mem.slab'
         or f.name = 'sys.mem.swap.total'
         or f.name = 'sys.mem.vmalloc.used'
         or f.name = 'sys.mem.page.tables'
         or f.name = 'sys.mem.active'
         or f.name = 'sys.mem.unevictable'
         or f.name = 'sys.mem.vmalloc.total'
         or f.name = 'sys.mem.slab.unreclaimable'
         or f.name = 'sys.mem.cma.total'
         or f.name = 'sys.mem.mapped'
         or f.name = 'sys.mem.kernel.reclaimable'
         or f.name = 'sys.mem.zram'
         ) 
        ORDER BY
        m.ts DESC 
        LIMIT 1 
        ),0)
        AND m.ts <= $rightNS GROUP BY m.ts;`,
    { $leftNS: leftNs, $rightNS: rightNs }
  );
export const getTabNetworkAbilityData = (leftNs: number, rightNs: number): Promise<Array<SystemNetworkSummary>> =>
  query<SystemNetworkSummary>(
    'getTabNetworkAbilityData',
    `SELECT
            ( n.ts - TR.start_ts ) AS startTime,
            n.dur AS duration,
            n.rx AS dataReceived,
            n.tx_speed AS dataReceivedSec,
            n.tx AS dataSend,
            n.rx_speed AS dataSendSec,
            n.packet_in AS packetsIn,
            n.packet_in_sec AS packetsInSec,
            n.packet_out AS packetsOut,
            n.packet_out_sec AS packetsOutSec 
            FROM
            network AS n,
            trace_range AS TR 
            WHERE
            ( n.ts - TR.start_ts ) >= ifnull((
            SELECT
            ( nn.ts - T.start_ts ) AS startTime 
            FROM
            network nn,
            trace_range T 
            WHERE
            ( nn.ts - T.start_ts ) <= $leftNS
            ORDER BY
            nn.ts DESC 
            LIMIT 1 
            ),0)  
            AND ( n.ts - TR.start_ts ) <= $rightNS 
            ORDER BY
            startTime ASC`,
    { $leftNS: leftNs, $rightNS: rightNs }
  );
export const getTabDiskAbilityData = (leftNs: number, rightNs: number): Promise<Array<SystemDiskIOSummary>> =>
  query<SystemDiskIOSummary>(
    'getTabDiskAbilityData',
    `SELECT
        ( n.ts - TR.start_ts ) AS startTime,
        n.dur AS duration,
        n.rd AS dataRead,
        n.rd_speed AS dataReadSec,
        n.wr AS dataWrite,
        n.wr_speed AS dataWriteSec,
        n.rd_count AS readsIn,
        n.rd_count_speed AS readsInSec,
        n.wr_count AS writeOut,
        n.wr_count_speed AS writeOutSec 
        FROM
        diskio AS n,
        trace_range AS TR 
        WHERE
        ( n.ts - TR.start_ts ) >= ifnull((
        SELECT
        ( nn.ts - T.start_ts ) AS startTime 
        FROM
        diskio AS nn,
        trace_range AS T 
        WHERE
        ( nn.ts - T.start_ts ) <= $leftNS 
        ORDER BY
        nn.ts DESC 
        LIMIT 1 
        ),0)
        AND ( n.ts - TR.start_ts ) <= $rightNS 
        ORDER BY
        startTime ASC;
    `,
    { $leftNS: leftNs, $rightNS: rightNs }
  );

export const queryCpuAbilityData = (): Promise<Array<CpuAbilityMonitorStruct>> =>
  query(
    'queryCpuAbilityData',
    `select 
        (t.total_load) as value,
        (t.ts - TR.start_ts) as startNS
        from cpu_usage t, trace_range AS TR;`
  );

export const queryCpuAbilityUserData = (): Promise<Array<CpuAbilityMonitorStruct>> =>
  query(
    'queryCpuAbilityUserData',
    `select 
        t.user_load as value,
        (t.ts - TR.start_ts) as startNS
        from cpu_usage t, trace_range AS TR;`
  );

export const queryCpuAbilitySystemData = (): Promise<Array<CpuAbilityMonitorStruct>> =>
  query(
    'queryCpuAbilitySystemData',
    `select 
        t.system_load as value,
        (t.ts - TR.start_ts) as startNS
        from cpu_usage t, trace_range AS TR;`
  );

export const queryMemoryUsedAbilityData = (id: string): Promise<Array<MemoryAbilityMonitorStruct>> =>
  query(
    'queryMemoryUsedAbilityData',
    `select 
        t.value as value,
        (t.ts - TR.start_ts) as startNS
        from sys_mem_measure t, trace_range AS TR where t.filter_id = $id;`,
    { $id: id }
  );

export const queryCachedFilesAbilityData = (id: string): Promise<Array<MemoryAbilityMonitorStruct>> =>
  query(
    'queryCachedFilesAbilityData',
    `select 
        t.value as value,
        (t.ts - TR.start_ts) as startNS
        from sys_mem_measure t, trace_range AS TR where t.filter_id = $id;`,
    { $id: id }
  );


export const queryCompressedAbilityData = (id: string): Promise<Array<MemoryAbilityMonitorStruct>> =>
  query(
    'queryCompressedAbilityData',
    `select 
        t.value as value,
        (t.ts - TR.start_ts) as startNS
        from sys_mem_measure t, trace_range AS TR where t.filter_id = $id;`,
    { $id: id }
  );

export const querySwapUsedAbilityData = (id: string): Promise<Array<MemoryAbilityMonitorStruct>> =>
  query(
    'querySwapUsedAbilityData',
    `select 
        t.value as value,
        (t.ts - TR.start_ts) as startNS
        from sys_mem_measure t, trace_range AS TR where t.filter_id = $id;`,
    { $id: id }
  );

export const queryBytesReadAbilityData = (): Promise<Array<DiskAbilityMonitorStruct>> =>
  query(
    'queryBytesReadAbilityData',
    `select 
        t.rd_speed as value,
        (t.ts - TR.start_ts) as startNS
        from diskio t, trace_range AS TR;`
  );

export const queryBytesWrittenAbilityData = (): Promise<Array<DiskAbilityMonitorStruct>> =>
  query(
    'queryBytesWrittenAbilityData',
    `select 
        t.wr_speed as value,
        (t.ts - TR.start_ts) as startNS
        from diskio t, trace_range AS TR;`
  );

export const queryReadAbilityData = (): Promise<Array<DiskAbilityMonitorStruct>> =>
  query(
    'queryReadAbilityData',
    `select 
        t.rd_count_speed as value,
        (t.ts - TR.start_ts) as startNS
        from diskio t, trace_range AS TR;`
  );

export const queryWrittenAbilityData = (): Promise<Array<DiskAbilityMonitorStruct>> =>
  query(
    'queryWrittenAbilityData',
    `select 
        t.wr_count_speed as value,
        (t.ts - TR.start_ts) as startNS
        from diskio t, trace_range AS TR;`
  );

export const queryBytesInAbilityData = (): Promise<Array<NetworkAbilityMonitorStruct>> =>
  query(
    'queryBytesInAbilityData',
    `select 
        t.tx_speed as value,
        (t.ts - TR.start_ts) as startNS
        from network t, trace_range AS TR;`
  );

export const queryBytesOutAbilityData = (): Promise<Array<NetworkAbilityMonitorStruct>> =>
  query(
    'queryBytesOutAbilityData',
    `select 
        t.rx_speed as value,
        (t.ts - TR.start_ts) as startNS
        from network t, trace_range AS TR;`
  );

export const queryPacketsInAbilityData = (): Promise<Array<NetworkAbilityMonitorStruct>> =>
  query(
    'queryPacketsInAbilityData',
    `select 
        t.packet_in_sec as value,
        (t.ts - TR.start_ts) as startNS
        from network t, trace_range AS TR;`
  );

export const queryPacketsOutAbilityData = (): Promise<Array<NetworkAbilityMonitorStruct>> =>
  query(
    'queryPacketsOutAbilityData',
    `select 
        t.packet_out_sec as value,
        (t.ts - TR.start_ts) as startNS
        from network t, trace_range AS TR;`
  );
export const queryAbilityExits = (): Promise<Array<any>> =>
  query(
    'queryAbilityExits',
    `select 
      event_name 
      from stat s 
      where s.event_name in ('trace_diskio','trace_network', 'trace_cpu_usage','sys_memory') 
      and s.stat_type ='received' and s.count > 0`
  );
export const queryCPuAbilityMaxData = (): Promise<Array<any>> =>
  query(
    'queryCPuAbilityMaxData',
    `select ifnull(max(total_load),0) as totalLoad, 
                ifnull(max(user_load),0) as userLoad,
                ifnull(max(system_load),0) as systemLoad
                from cpu_usage`
  );
//   Ability Monitor SkiaGpuMemory泳道图
export const queryGpuMemoryAbilityData = (): Promise<Array<SnapshotStruct>> =>
  query(
    'queryGpuMemoryAbilityData',
    `SELECT
    (A.ts - B.start_ts) as startNs,
    sum(A.used_gpu_size) as value
    FROM memory_process_gpu A,trace_range B
    WHERE A.ts < B.end_ts
    GROUP by A.ts
    LIMIT 1;`
  );

//   Ability Monitor Dma泳道图
export const queryDmaAbilityData = (): Promise<Array<SnapshotStruct>> =>
  query(
    'queryDmaAbilityData',
    `SELECT
      (A.ts - B.start_ts) as startNs,
      sum(A.size) as value,
      E.data as expTaskComm,
      A.flag as flag
    FROM memory_dma A,trace_range B
    left join data_dict as E on E.id=A.exp_task_comm_id
    WHERE
      A.flag = 0
      AND A.ts < B.end_ts
    GROUP by A.ts
    LIMIT 1;`
  );
// Ability Monitor Purgeable泳道图
export const queryPurgeableSysData = (isPin?: boolean): Promise<Array<any>> => {
  const pinCondition = isPin ? ' AND a.ref_count > 0' : '';
  const names = isPin ? " ('sys.mem.pined.purg')" : "('sys.mem.active.purg','sys.mem.inactive.purg')";
  return query(
    'queryPurgeableSysData',
    `SELECT
      startNs,
      sum( value ) AS value
  FROM
      (
      SELECT
          m.ts - tr.start_ts AS startNs,
          sum( m.value ) AS value
      FROM
          sys_mem_measure m,
          trace_range tr
          LEFT JOIN sys_event_filter f ON f.id = m.filter_id
      WHERE
          m.ts < tr.end_ts
          AND f.name IN ${names}
      GROUP BY
          m.ts UNION ALL
      SELECT
          a.ts - tr.start_ts AS startNs,
          sum( a.size ) AS value
      FROM
          memory_ashmem a,
          trace_range tr
      WHERE
          a.ts < tr.end_ts
          AND a.flag = 0
          ${pinCondition}
          GROUP BY
              a.ts
          )
      GROUP BY startNs
      LIMIT 1`
  );
};

//Ability Monitor Purgeable 框选 tab页
export const querySysPurgeableTab = (
  leftNs: number,
  rightNs: number,
  dur: number,
  isPin?: boolean
): Promise<Array<any>> => {
  let pinsql = isPin ? ' AND ref_count > 0' : '';
  const names = isPin ? " ('sys.mem.pined.purg')" : "('sys.mem.active.purg','sys.mem.inactive.purg')";
  return query(
    'querySysPurgeableTab',
    `SELECT name, MAX( size ) AS maxSize,MIN( size ) AS minSize,AVG( size ) AS avgSize
    FROM
        (SELECT
          'ShmPurg' AS name,
          ts - tr.start_ts AS startTs,
          SUM( size ) AS size
        FROM
          memory_ashmem,
          trace_range tr
        WHERE flag = 0
        ${pinsql}
        GROUP BY ts UNION
        SELECT
        CASE
          WHEN
            f.name = 'sys.mem.active.purg' THEN
              'ActivePurg'
              WHEN f.name = 'sys.mem.inactive.purg' THEN
              'InActivePurg' ELSE 'PinedPurg'
            END AS name,
            m.ts - tr.start_ts AS startTs,
            m.value AS size
          FROM
            sys_mem_measure m,
            trace_range tr
            LEFT JOIN sys_event_filter f ON f.id = m.filter_id
          WHERE
            f.name IN ${names}
          ),
          trace_range tr
        WHERE ${leftNs} <= startTs + ${dur} AND ${rightNs} >= startTs
        GROUP BY name`
  );
};

//Ability Monitor Purgeable 点选 tab页
export const querySysPurgeableSelectionTab = (startNs: number, isPin?: boolean): Promise<Array<any>> => {
  const pinSql = isPin ? ' AND ref_count > 0' : '';
  const names = isPin ? " ('sys.mem.pined.purg')" : "('sys.mem.active.purg','sys.mem.inactive.purg')";
  return query(
    'querySysPurgeableSelectionTab',
    `SELECT
    ( CASE WHEN f.name = 'sys.mem.active.purg' THEN 'ActivePurg' WHEN f.name = 'sys.mem.inactive.purg' THEN 'InActivePurg' ELSE 'PinedPurg' END ) AS name,
    m.value AS value
    FROM
    sys_mem_measure m,
    trace_range tr
    LEFT JOIN sys_event_filter f ON f.id = m.filter_id
    WHERE
    f.name IN ${names}
    AND m.ts - tr.start_ts = ${startNs} 
    UNION
    SELECT
    'ShmPurg' AS name,
    SUM( size ) AS value
    FROM
    memory_ashmem,
    trace_range tr
    WHERE
    memory_ashmem.ts - tr.start_ts = ${startNs}
    AND flag=0
    ${pinSql}
    GROUP BY ts`
  );
};
//Ability Monitor SkiaGpuMemory 框选
export const getTabGpuMemoryAbilityData = (leftNs: number, rightNs: number, dur: number): Promise<Array<GpuMemory>> =>
  query<GpuMemory>(
    'getTabGpuMemoryAbilityData',
    `SELECT (S.ts-TR.start_ts) as startNs,
    gpu_name_id as gpuNameId,
    MAX(S.used_gpu_size) as maxSize,
    MIN(S.used_gpu_size) as minSize,
    Avg(S.used_gpu_size) as avgSize,
    E.pid as processId,
    E.name as processName
    from trace_range as TR,memory_process_gpu as S
    left join process as E on E.ipid=S.ipid
    WHERE
    $leftNS <= startNs + ${dur}
    and
    $rightNS >= startNs
    GROUP by 
    E.pid ,S.gpu_name_id
            `,
    { $leftNS: leftNs, $rightNS: rightNs }
  );
//Ability Monitor SkiaGpuMemory 点选
export const getTabGpuMemoryAbilityClickData = (startNs: number): Promise<Array<GpuMemory>> =>
  query<GpuMemory>(
    'getTabGpuMemoryAbilityClickData',
    `SELECT
    (S.ts-TR.start_ts) as startNs,
    S.used_gpu_size as size,
    E.pid as processId,
    E.name as processName,
    A.data as gpuName
    from trace_range as TR,memory_process_gpu as S
    left join process as E on E.ipid=S.ipid
    left join data_dict as A on A.id=S.gpu_name_id
    WHERE
    startNs = ${startNs}
              `,
    { $startNs: startNs }
  );
//Ability Monitor Gpu Memory 点选比较
export const getTabGpuMemoryComparisonData = (startNs: number): Promise<Array<GpuMemoryComparison>> =>
  query<GpuMemoryComparison>(
    'getTabGpuMemoryComparisonData',
    `SELECT
      (S.ts-TR.start_ts) as startNs,
      sum(S.used_gpu_size) as value,
      E.pid as processId,
      S.gpu_name_id as gpuNameId,
      E.name as processName
      from trace_range as TR,memory_process_gpu as S
      left join process as E on E.ipid=S.ipid
      WHERE
      startNs = ${startNs}
      GROUP by
      E.pid, S.gpu_name_id
                `,
    { $startNs: startNs }
  );


