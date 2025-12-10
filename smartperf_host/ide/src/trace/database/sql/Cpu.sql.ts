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

import { KeyPathStruct } from '../../bean/KeyPathStruct';
import { CpuStruct } from '../ui-worker/cpu/ProcedureWorkerCPU';
import { query } from '../SqlLite';
import { CpuUsage, Freq } from '../../bean/CpuUsage';
import { Counter } from '../../bean/BoxSelection';
import { CpuFreqStruct } from '../ui-worker/ProcedureWorkerFreq';
import { CpuFreqLimitsStruct } from '../ui-worker/cpu/ProcedureWorkerCpuFreqLimits';
import { CpuFreqRowLimit } from '../../component/chart/SpFreqChart';
import { Utils } from '../../component/trace/base/Utils';

export const queryCpuKeyPathData = (threads: Array<KeyPathStruct>): Promise<Array<CpuStruct>> => {
  const sqlArray: Array<string> = [];
  sqlArray.push(' 1 = 0');
  for (const thread of threads) {
    sqlArray.push(` or  (tid = ${thread.tid} and ts in (${thread.tsArray}))`);
  }
  let sql = sqlArray.join(' ');
  return query(
    'queryCpuKeyPathData',
    `SELECT B.pid as processId,
        B.cpu,
        B.tid,
        B.itid  as id,
        B.dur  AS dur,
        B.ts - T.start_ts  AS startTime,
        B.arg_setid   as argSetID,
        1 as isKeyPath
    from thread_state AS B
    left join trace_range as T
    where ${sql}`
  );
};

export const getSchedTaskData = (leftNs: number, rightNs: number): Promise<Array<unknown>> =>
  query<unknown>(
    'getSchedTaskData',
    `SELECT
      ts as startTime,
      tid,
      pid,
      thread_name as threadName,
      interval,
      curr_mono,
      expire_mono
    from timerfd_wakeup,
    trace_range B
    where
    startTime >= ${leftNs} AND startTime <= ${rightNs}`
  )

export const getProcessSchedTaskData = (leftNs: number, rightNs: number, pids: Array<number>, tids: Array<number>) =>
  query<unknown>(
    'getSchedTaskData',
    `SELECT
      ts as startTime,
      tid,
      pid,
      thread_name as threadName,
      interval,
      curr_mono,
      expire_mono
    from timerfd_wakeup,
    trace_range B
    where
    startTime >= ${leftNs} AND startTime <= ${rightNs}
    AND pid in (${pids.join(',')}) 
    AND tid in (${tids.join(',')})`
  )

export const getTabCpuUsage = (cpus: Array<number>, leftNs: number, rightNs: number,
  traceId?: string): Promise<Array<CpuUsage>> =>
  query<CpuUsage>(
    'getTabCpuUsage',
    `
    select
      cpu,
      sum(case
        when (A.ts - B.start_ts) < $leftNS
          then (A.ts - B.start_ts + A.dur - $leftNS)
        when (A.ts - B.start_ts) >= $leftNS
          and (A.ts - B.start_ts + A.dur) <= $rightNS
          then A.dur
        when (A.ts - B.start_ts + A.dur) > $rightNS
          then ($rightNS - (A.ts - B.start_ts)) end) / cast($rightNS - $leftNS as float) as usage
    from
      thread_state A,
      trace_range B
    where
      (A.ts - B.start_ts) > 0 and A.dur > 0
    and
      cpu in (${cpus.join(',')})
    and
      (A.ts - B.start_ts + A.dur) > $leftNS
    and
      (A.ts - B.start_ts) < $rightNS
    group by
      cpu`,
    { $leftNS: leftNs, $rightNS: rightNs },
    { traceId: traceId }
  );

export const getTabCpuFreq = (cpus: Array<number>, leftNs: number, rightNs: number,
  traceId?: string): Promise<Array<Freq>> =>
  query<Freq>(
    'getTabCpuFreq',
    `
    select
      cpu,
      value,
      (ts - tr.start_ts) as startNs
    from
      measure m,
      trace_range tr
    inner join
      cpu_measure_filter t
    on
      m.filter_id = t.id
    where
      (name = 'cpufreq' or name='cpu_frequency')
    and
      cpu in (${cpus.join(',')})
    and
      startNs > 0
    and
      startNs < $rightNS
    --order by startNs
    `,
    { $leftNS: leftNs, $rightNS: rightNs },
    { traceId: traceId }
  );

export const getTabCounters = (
  processFilterIds: Array<number>,
  virtualFilterIds: Array<number>,
  startTime: number
): //@ts-ignore
Promise<unknown> => {
  let processSql = `select
        t1.filter_id as trackId,
        t2.name,
        value,
        t1.ts - t3.start_ts as startTime
      from
        process_measure t1
      left join
        process_measure_filter t2
      on
        t1.filter_id = t2.id
      left join
        trace_range t3
      where
        filter_id in (${processFilterIds.join(',')})
      and
        startTime <= ${startTime}`;
  let virtualSql = `select
        t1.filter_id as trackId,
        t2.name,
        value,
        t1.ts - t3.start_ts as startTime
      from
        sys_mem_measure t1
      left join
        sys_event_filter t2
      on
        t1.filter_id = t2.id
      left join
        trace_range t3
      where
        filter_id in (${virtualFilterIds.join(',')})
      and
        startTime <= ${startTime}`;
  let sql = '';
  if (processFilterIds.length > 0 && virtualFilterIds.length > 0) {
    sql = `${processSql} union ${virtualSql}`;
  } else {
    if (processFilterIds.length > 0) {
      sql = processSql;
    } else {
      sql = virtualSql;
    }
  }
  return query<Counter>('getTabCounters', sql, {});
};
export const getTabCpuByProcess = (
  cpus: Array<number>,
  leftNS: number,
  rightNS: number,
  traceId?: string
): //@ts-ignore
Promise<unknown[]> => //@ts-ignore
  query<unknown>(
    'getTabCpuByProcess',
    `
    select
      B.pid as pid,
      sum(iif(B.dur = -1 or B.dur is null, 0, B.dur)) as wallDuration,
      avg(iif(B.dur = -1 or B.dur is null, 0, B.dur)) as avgDuration,
      count(B.tid) as occurrences
    from
      thread_state AS B
    left join
      trace_range AS TR
    where
      B.cpu in (${cpus.join(',')})
    and
      not ((B.ts - TR.start_ts + iif(B.dur = -1 or B.dur is null, 0, B.dur) < $leftNS) 
      or (B.ts - TR.start_ts > $rightNS ))
    group by
      B.pid
    order by
      wallDuration desc;`,
    { $rightNS: rightNS, $leftNS: leftNS },
    { traceId: traceId }
  );

export const getTabCpuByThread = (cpus: Array<number>, leftNS: number, rightNS: number,
  traceId?: string): Promise<unknown[]> =>
  query<unknown>(
    'getTabCpuByThread',
    `
    select
      TS.pid as pid,
      TS.tid as tid,
      TS.cpu,
      sum( min(${rightNS},(TS.ts - TR.start_ts + iif(TS.dur = -1 or TS.dur is null, 0, TS.dur))) - 
      max(${leftNS},TS.ts - TR.start_ts)) wallDuration,
      count(TS.tid) as occurrences
    from
      thread_state AS TS
    left join
      trace_range AS TR
    where
      TS.cpu in (${cpus.join(',')})
    and
      not ((TS.ts - TR.start_ts + iif(TS.dur = -1 or TS.dur is null, 0, TS.dur) < $leftNS) 
      or (TS.ts - TR.start_ts > $rightNS))
    group by
      TS.cpu,
      TS.pid,
      TS.tid
    order by
      wallDuration desc;`,
    { $rightNS: rightNS, $leftNS: leftNS },
    { traceId: traceId }
  );

   export const queryRunningCpuData = (cpus: Array<number>, leftNS: number, rightNS: number): Promise<unknown[]> =>
query<unknown>(
  'getSelectCpuData',
  `SELECT
  B.pid,
  B.cpu,
  B.tid,
  B.itid as id,
  B.dur,
  B.ts - TR.start_ts AS ts,
  B.arg_setid as argSetID,
	p.name as p_name,
	t.name as t_name
from thread_state AS B
  left join trace_range AS TR
  left join process AS p on B.pid = p.pid
	left join thread AS t on B.tid = t.tid
where B.itid is not null
  and
    B.cpu in (${cpus.join(',')})
  and
    not ((B.ts - TR.start_ts + ifnull(B.dur,0) < ${leftNS}) or (B.ts - TR.start_ts > ${rightNS}))
  and
  B.state = 'Running'`,
    { $rightNS: rightNS, $leftNS: leftNS },
);

export const querySelectCpuFreqFilterId = (cpus: Array<number>): Promise<
  Array<{
    id: number;
    cpu: number;
  }>
> =>
  query(
    'querySelectCpuFreqFilterId',
    `
        select
          id,
          cpu
        from
          cpu_measure_filter 
        where
          (name='cpufreq' or name='cpu_frequency')
        and
        cpu in (${cpus.join(',')})
     `,
    {},
    { traceId: Utils.currentSelectTrace }
  );

export const queryCpuData = (cpu: number, startNS: number, endNS: number): Promise<Array<CpuStruct>> =>
  query(
    'queryCpuData',
    `
    SELECT
    B.pid as processId,
    B.cpu,
    B.tid,
    B.itid as id,
    B.dur,
    B.ts - TR.start_ts AS startTime,
    B.arg_setid as argSetID
from thread_state AS B
    left join trace_range AS TR
where B.itid is not null
    and
      B.cpu = $cpu
    and
      startTime between $startNS and $endNS;`,
    {
      $cpu: cpu,
      $startNS: startNS,
      $endNS: endNS,
    }
  );

export const queryCpuFreq = (traceId?: string): Promise<Array<{ cpu: number; filterId: number }>> =>
  query(
    'queryCpuFreq',
    `
    select
      cpu,id as filterId
    from
      cpu_measure_filter
    where
      (name='cpufreq' or name='cpu_frequency')
    order by cpu;
    `, {}, { traceId: traceId }
  );

export const queryCpuFreqData = (cpu: number): Promise<Array<CpuFreqStruct>> =>
  query<CpuFreqStruct>(
    'queryCpuFreqData',
    `
    select
      cpu,
      value,
      ifnull(dur,tb.end_ts - c.ts) dur,
      ts-tb.start_ts as startNS
    from
      measure c,
      trace_range tb
    inner join
      cpu_measure_filter t
    on
      c.filter_id = t.id
    where
      (name = 'cpufreq' or name='cpu_frequency')
    and
      cpu= $cpu
    --order by ts;
    `,
    { $cpu: cpu }
  );

export const queryCpuMax = (traceId?: string): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'queryCpuMax',
    `
    select
      cpu
    from
      sched_slice
    order by
      cpu
    desc limit 1;`,
    {},
    { traceId: traceId }
  );

export const queryCpuDataCount = (): Promise<unknown[]> =>
  query('queryCpuDataCount',
    'select count(1) as count,cpu from thread_state where cpu not null group by cpu');

export const queryCpuCount = (traceId?: string): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'queryCpuCount',
    `
   select max(cpuCount) cpuCount from
(select ifnull((max(cpu) + 1),0) cpuCount  from cpu_measure_filter where name in ('cpu_frequency','cpu_idle')
 union all
 select ifnull((max(callid)+1),0) cpuCount from irq
) A;`,
    {},
    { traceId: traceId }
  );

export const queryCpuSchedSlice = async (traceId?: string): Promise<Array<unknown>> => {
  let cpuSchedSliceBuffer = await query(
    'queryCpuSchedSlice',
    `select 
      (ts - start_ts) as ts,
       itid,
       end_state as endState,
       priority
    from
      sched_slice,
      trace_range;`,
    {},
    { traceId: traceId, action: 'exec-buf' }
  );
  // @ts-ignore
  return Utils.convertJSON(cpuSchedSliceBuffer);
};

export const queryCpuStateFilter = (traceId?: string):
Promise<Array<{ cpu: number; filterId: number }>> =>
  query(
    'queryCpuStateFilter',
    `select cpu,id as filterId 
    from cpu_measure_filter 
    where name = 'cpu_idle' order by cpu;`,
    {},
    { traceId: traceId }
  );

export const queryCpuState = (
  cpuFilterId: number
): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'queryCpuState',
    `
        select (A.ts - B.start_ts) as startTs,ifnull(dur,B.end_ts - A.ts) dur,
            value
        from measure A,trace_range B
        where filter_id = $filterId;`,
    { $filterId: cpuFilterId }
  );

export const queryCpuMaxFreq = (traceId?: string):
Promise<Array<{
  maxFreq: number
}>> =>
  query(
    'queryCpuMaxFreq',
    `
    select
      max(value) as maxFreq
    from
      measure c
    inner join
      cpu_measure_filter t
    on
      c.filter_id = t.id
    where
      (name = 'cpufreq' or name='cpu_frequency');`, {}, { traceId: traceId }
  );

export const queryTraceCpu = (): Promise<
  Array<{
    tid: string;
    pid: string;
    cpu: string;
    dur: string;
    min_freq: string;
    max_freq: string;
    avg_frequency: string;
  }>
> =>
  query(
    'queryTraceCpu',
    `SELECT 
        itid AS tid, 
        ipid AS pid, 
        group_concat(cpu, ',') AS cpu, 
        group_concat(dur, ',') AS dur, 
        group_concat(min_freq, ',') AS min_freq, 
        group_concat(max_freq, ',') AS max_freq, 
        group_concat(avg_frequency, ',') AS avg_frequency 
        FROM 
        (SELECT 
            itid, 
            ipid, 
            cpu, 
            CAST (SUM(dur) AS INT) AS dur, 
            CAST (MIN(freq) AS INT) AS min_freq, 
            CAST (MAX(freq) AS INT) AS max_freq, 
            CAST ( (SUM(dur * freq) / SUM(dur) ) AS INT) AS avg_frequency 
            from 
            result 
            group by 
            itid, cpu
        ) 
        GROUP BY 
        ipid, itid 
        ORDER BY 
        ipid
    `
  );

export const queryTraceCpuTop = (): Promise<
  Array<{
    tid: string;
    pid: string;
    cpu: string;
    duration: string;
    min_freq: string;
    max_freq: string;
    avg_frequency: string;
    sumNum: string;
  }>
> =>
  query(
    'queryTraceCpuTop',
    `SELECT
         ipid AS pid,
         itid AS tid, 
        group_concat(cpu, ',') AS cpu, 
        group_concat(dur, ',') AS dur,
        group_concat(avg_frequency, ',') AS avg_frequency,
        group_concat(min_freq, ',') AS min_freq, 
        group_concat(max_freq, ',') AS max_freq, 
        sum(dur * avg_frequency) AS sumNum 
        FROM 
        (SELECT 
            itid, 
            ipid, 
            cpu, 
            CAST (SUM(dur) AS INT) AS dur, 
            CAST (MIN(freq) AS INT) AS min_freq, 
            CAST (MAX(freq) AS INT) AS max_freq, 
            CAST ( (SUM(dur * freq) / SUM(dur) ) AS INT) AS avg_frequency 
            from result group by itid, cpu
        ) 
        GROUP BY 
        ipid, itid 
        ORDER BY 
        sumNum 
        DESC 
        LIMIT 10;
    `
  );

export const queryCpuFreqUsageData = (
  Ids: Array<number>
): Promise<
  Array<{
    startNS: number;
    filter_id: number;
    value: number;
    dur: number;
  }>
> =>
  query(
    'queryCpuFreqUsageData',
    `select
          value,
          ifnull(dur,tb.end_ts - c.ts) dur,
          ts-tb.start_ts as startNS,
          filter_id
        from
          measure c,
          trace_range tb
        where
          c.filter_id in (${Ids.join(',')})
       `,
    {},
    { traceId: Utils.currentSelectTrace }
  );

export const queryCpuFreqFilterId = (): Promise<
  Array<{
    id: number;
    cpu: number;
  }>
> =>
  query(
    'queryCpuFreqFilterId',
    `
        select
          id,
          cpu
        from
          cpu_measure_filter 
        where
          name='cpufreq'
        or
          name='cpu_frequency'
     `,
    {},
    { traceId: Utils.currentSelectTrace }
  );

export const searchCpuData = (
  keyword: string
): //@ts-ignore
Promise<Array<unknown>> => {
  let id = parseInt(keyword);
  let sql = `
  select B.pid                        as processId,
       B.cpu,
       B.tid,
       'cpu'                          as type,
       B.itid                         as id,
       B.dur                          as dur,
       B.ts - TR.start_ts             as startTime,
       B.arg_setid                    as argSetID
from thread_state AS B, trace_range TR
         left join process p on B.pid = p.pid
         left join thread t on B.itid = t.itid
where B.cpu not null and B.ts between TR.start_ts and TR.end_ts 
  and (
        t.name like '%${keyword}%'
        or B.tid = ${Number.isNaN(id) ? -1 : id}
        or B.pid = ${Number.isNaN(id) ? -1 : id}
        or p.name like '%${keyword}%'
    )
order by startTime;`;
  return query('searchCpuData', sql, {});
};

export const getTabPaneCounterSampleData = (
  leftNs: number,
  rightNs: number,
  cpuStateFilterIds: Array<number>
): //@ts-ignore
Promise<Array<unknown>> => {
  let str = '';
  if (cpuStateFilterIds.length > 0) {
    str = ` and filter_id in (${cpuStateFilterIds.join(',')})`;
  }
  return query(
    'getTabPaneCounterSampleData',
    `
    select value, filter_id as filterId, ts, f.cpu
    from measure left join cpu_measure_filter as f on f.id=filter_id
    where
    ts <= $rightNs${str} order by ts asc;
`,
    { $leftNs: leftNs, $rightNs: rightNs }, {traceId: Utils.currentSelectTrace}
  );
};
export const queryJsCpuProfilerConfig = (): //@ts-ignore
Promise<Array<unknown>> =>
  query('queryJsCpuProfilerConfig',
    'SELECT pid, type, enable_cpu_Profiler as enableCpuProfiler FROM js_config');

export const queryJsCpuProfilerData = (): //@ts-ignore
Promise<Array<unknown>> => query('queryJsCpuProfilerData',
  'SELECT 1 WHERE EXISTS(select 1 from js_cpu_profiler_node)');

export const querySystemCallsTop = (): Promise<
  Array<{
    tid: string;
    pid: string;
    funName: string;
    frequency: string;
    minDur: string;
    maxDur: string;
    avgDur: string;
  }>
> =>
  query(
    'querySystemCallsTop',
    `SELECT 
        cpu.tid AS tid, 
        cpu.pid AS pid, 
        callstack.name AS funName, 
        count(callstack.name) AS frequency, 
        min(callstack.dur) AS minDur, 
        max(callstack.dur) AS maxDur, 
        round(avg(callstack.dur)) AS avgDur 
        FROM 
        callstack 
        INNER JOIN 
        (SELECT 
            itid AS tid, 
            ipid AS pid, 
            group_concat(cpu, ',') AS cpu, 
            group_concat(dur, ',') AS dur, 
            group_concat(min_freq, ',') AS min_freq, 
            group_concat(max_freq, ',') AS max_freq, 
            group_concat(avg_frequency, ',') AS avg_frequency, 
            sum(dur * avg_frequency) AS sumNum 
            FROM 
            (SELECT 
                itid, 
                ipid, 
                cpu, 
                CAST (SUM(dur) AS INT) AS dur, 
                CAST (MIN(freq) AS INT) AS min_freq, 
                CAST (MAX(freq) AS INT) AS max_freq, 
                CAST ( (SUM(dur * freq) / SUM(dur) ) AS INT) AS avg_frequency 
                FROM 
                result 
                GROUP BY 
                itid, cpu
            ) 
            GROUP BY 
            ipid, itid 
            ORDER BY 
            sumNum 
            DESC 
            LIMIT 10
        ) AS cpu 
        ON 
        callstack.callid = cpu.tid 
        GROUP BY 
        callstack.name 
        ORDER BY 
        frequency 
        DESC
    LIMIT 10`
  );

export const queryWakeupListPriority = (
  itid: number[],
  ts: number[],
  cpus: number[]
): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'queryWakeupListPriority',
    `
    select itid, priority, (ts - start_ts) as ts, dur, cpu
    from sched_slice,trace_range where cpu in (${cpus.join(',')})
    and itid in (${itid.join(',')})
    and ts - start_ts in (${ts.join(',')})
    `,
    {},
    { traceId: Utils.currentSelectTrace }
  );

export const getCpuLimitFreqBoxSelect = (
  arr: Array<{
    maxFilterId: string;
    minFilterId: string;
    cpu: string;
  }>,
  rightNS: number
): //@ts-ignore
Promise<Array<unknown>> => {
  let ids = [];
  let condition = `(case`;
  for (let item of arr) {
    condition = `${condition} when filter_id in (${item.maxFilterId}, ${item.minFilterId}) then ${item.cpu}`;
    ids.push(item.maxFilterId, item.minFilterId);
  }
  condition = `${condition} else -1 end) as cpu`;
  let sql = `
  select 
    ts - T.start_ts as startNs,
    dur,
    max(value) as max,
    min(value) as min,
    ${condition}
  from measure,trace_range T 
  where filter_id in (${ids.join(',')})
    and ts - T.start_ts < ${rightNS} 
  group by ts
  `;
  return query('getCpuLimitFreqBoxSelect', sql, {}, {traceId: Utils.currentSelectTrace});
};

export const getCpuLimitFreq = (maxId: number, minId: number, cpu: number):
  Promise<Array<CpuFreqLimitsStruct>> =>
  query(
    'getCpuLimitFreq',
    `
    select ts - T.start_ts as startNs,
           dur,
           max(value) as max,
           min(value) as min,
            $cpu as cpu 
    from measure,trace_range T where filter_id in ($maxId,$minId) group by ts
`,
    { $maxId: maxId, $minId: minId, $cpu: cpu }
  );

export const getCpuLimitFreqId = (traceId?: string): Promise<Array<CpuFreqRowLimit>> =>
  query(
    'getCpuMaxMinFreqId',
    `
    select 
    cpu,
    MAX(iif(name = 'cpu_frequency_limits_max',id,0)) as maxFilterId,
    MAX(iif(name = 'cpu_frequency_limits_min',id,0)) as minFilterId 
    from cpu_measure_filter 
    where name in ('cpu_frequency_limits_max','cpu_frequency_limits_min') group by cpu
`,
    {},
    { traceId: traceId }
  );

export const getCpuLimitFreqMax = (
  filterIds: string,
  traceId?: string
): Promise<Array<{ maxValue: number; filterId: number }>> => {
  return query(
    'getCpuLimitFreqMax',
    `
    select max(value) as maxValue,filter_id as filterId 
    from measure where filter_id in (${filterIds}) group by filter_id
`,
    {},
    { traceId: traceId }
  );
};
