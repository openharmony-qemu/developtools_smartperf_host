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
import { KeyPathStruct } from "../../bean/KeyPathStruct";
import { CpuStruct } from "../ui-worker/cpu/ProcedureWorkerCPU";
import { query } from "../SqlLite";
import { CpuUsage, Freq } from "../../bean/CpuUsage";
import { Counter } from "../../bean/BoxSelection";
import { CpuFreqStruct } from "../ui-worker/ProcedureWorkerFreq";
import { CpuFreqLimitsStruct } from "../ui-worker/cpu/ProcedureWorkerCpuFreqLimits";
import { CpuFreqRowLimit } from "../../component/chart/SpFreqChart";

export const queryCpuKeyPathData = (threads: Array<KeyPathStruct>): Promise<Array<CpuStruct>> => {
  const sqlArray: Array<string> = [];
  sqlArray.push(` 1 = 0`);
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
export const getCpuUtilizationRate = (
  startNS: number,
  endNS: number
): Promise<
  Array<{
    cpu: number;
    ro: number;
    rate: number;
  }>
> =>
  query(
    'getCpuUtilizationRate',
    `
    with cpu as (
    select
      cpu,
      ts,
      dur,
      (case when ro < 99 then ro else 99 end) as ro ,
      (case when ro < 99 then stime+ro*cell else stime + 99 * cell end) as st,
      (case when ro < 99 then stime + (ro+1)*cell else etime end) as et
    from (
        select
          cpu,
          ts,
          A.dur,
          ((ts+A.dur)-D.start_ts)/((D.end_ts-D.start_ts)/100) as ro,
          D.start_ts as stime,
          D.end_ts etime,
          (D.end_ts-D.start_ts)/100 as cell
        from
          sched_slice A
        left join
          trace_range D
        left join
          thread B on A.itid = B.id
        where
          tid != 0
        and (A.ts)
          between D.start_ts and D.end_ts))
    select cpu,ro,
       sum(case
               when ts <= st and ts + dur <= et then (ts + dur - st)
               when ts <= st and ts + dur > et then et-st
               when ts > st and ts + dur <= et then dur
               when ts > st and ts + dur > et then et - ts end)/cast(et-st as float) as rate
    from cpu
    group by cpu,ro;`,
    {}
  );
export const getTabCpuUsage = (cpus: Array<number>, leftNs: number, rightNs: number): Promise<Array<CpuUsage>> =>
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
    { $leftNS: leftNs, $rightNS: rightNs }
  );

export const getTabCpuFreq = (cpus: Array<number>, leftNs: number, rightNs: number): Promise<Array<Freq>> =>
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
    { $leftNS: leftNs, $rightNS: rightNs }
  );


export const getTabCounters = (processFilterIds: Array<number>, virtualFilterIds: Array<number>, startTime: number) => {
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
export const getTabCpuByProcess = (cpus: Array<number>, leftNS: number, rightNS: number) =>
  query<any>(
    'getTabCpuByProcess',
    `
    select
      B.pid as pid,
      sum(B.dur) as wallDuration,
      avg(B.dur) as avgDuration,
      count(B.tid) as occurrences
    from
      thread_state AS B
    left join
      trace_range AS TR
    where
      B.cpu in (${cpus.join(',')})
    and
      not ((B.ts - TR.start_ts + B.dur < $leftNS) or (B.ts - TR.start_ts > $rightNS ))
    group by
      B.pid
    order by
      wallDuration desc;`,
    { $rightNS: rightNS, $leftNS: leftNS }
  );
export const getTabCpuByThread = (cpus: Array<number>, leftNS: number, rightNS: number) =>
  query<any>(
    'getTabCpuByThread',
    `
    select
      TS.pid as pid,
      TS.tid as tid,
      TS.cpu,
      sum( min(${rightNS},(TS.ts - TR.start_ts + TS.dur)) - max(${leftNS},TS.ts - TR.start_ts)) wallDuration,
      count(TS.tid) as occurrences
    from
      thread_state AS TS
    left join
      trace_range AS TR
    where
      TS.cpu in (${cpus.join(',')})
    and
      not ((TS.ts - TR.start_ts + TS.dur < $leftNS) or (TS.ts - TR.start_ts > $rightNS))
    group by
      TS.cpu,
      TS.pid,
      TS.tid
    order by
      wallDuration desc;`,
    { $rightNS: rightNS, $leftNS: leftNS }
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

export const queryCpuFreq = (): Promise<Array<{ cpu: number; filterId: number }>> =>
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
    `
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

export const queryCpuMax = (): Promise<Array<any>> =>
  query(
    'queryCpuMax',
    `
    select
      cpu
    from
      sched_slice
    order by
      cpu
    desc limit 1;`
  );

export const queryCpuDataCount = () =>
  query('queryCpuDataCount', 'select count(1) as count,cpu from thread_state where cpu not null group by cpu');

export const queryCpuCount = (): Promise<Array<any>> =>
  query(
    'queryCpuCount',
    `
   select max(cpuCount) cpuCount from
(select ifnull((max(cpu) + 1),0) cpuCount  from cpu_measure_filter where name in ('cpu_frequency','cpu_idle')
 union all
 select ifnull((max(callid)+1),0) cpuCount from irq
) A;`
  );

export const queryCpuSchedSlice = (): Promise<Array<any>> =>
  query(
    'queryCpuSchedSlice',
    `
   select (ts - start_ts) as ts,
       itid,
       end_state as endState,
       priority
   from sched_slice,trace_range;`
  );

export const queryCpuStateFilter = (): Promise<Array<any>> =>
  query(
    'queryCpuStateFilter',
    `select cpu,id as filterId from cpu_measure_filter where name = 'cpu_idle' order by cpu;`,
    {}
  );

export const queryCpuState = (cpuFilterId: number): Promise<Array<any>> =>
  query(
    'queryCpuState',
    `
        select (A.ts - B.start_ts) as startTs,ifnull(dur,B.end_ts - A.ts) dur,
            value
        from measure A,trace_range B
        where filter_id = $filterId;`,
    { $filterId: cpuFilterId }
  );

export const queryCpuMaxFreq = (): Promise<Array<any>> =>
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
      (name = 'cpufreq' or name='cpu_frequency');`
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
    dur: number
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
      `
  );

export const queryCpuFreqFilterId = (): Promise<
  Array<{
    id: number;
    cpu: number
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
      `
  );
export const searchCpuData = (keyword: string): Promise<Array<any>> => {
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
): Promise<Array<any>> => {
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
    { $leftNs: leftNs, $rightNs: rightNs }
  );
};
export const queryJsCpuProfilerConfig = (): Promise<Array<any>> =>
  query('queryJsCpuProfilerConfig', `SELECT pid, type, enable_cpu_Profiler as enableCpuProfiler FROM js_config`);
export const queryJsCpuProfilerData = (): Promise<Array<any>> =>
  query('queryJsCpuProfilerData', `SELECT 1 WHERE EXISTS(select 1 from js_cpu_profiler_node)`);
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
export const queryWakeupListPriority = (itid: number[], ts: number[], cpus: number[]): Promise<Array<any>> =>
  query(
    'queryWakeupListPriority',
    `
    select itid, priority, (ts - start_ts) as ts, dur, cpu
    from sched_slice,trace_range where cpu in (${cpus.join(',')})
    and itid in (${itid.join(',')})
    and ts - start_ts in (${ts.join(',')})
    `,
    {}
  );
export const getCpuLimitFreqBoxSelect = (
  arr: Array<{
    maxFilterId: string;
    minFilterId: string;
    cpu: string;
  }>,
  rightNS: number
): Promise<Array<any>> => {
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
  console.log(sql);
  return query('getCpuLimitFreqBoxSelect', sql, {});
};
export const getCpuLimitFreq = (maxId: number, minId: number, cpu: number): Promise<Array<CpuFreqLimitsStruct>> =>
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
export const getCpuLimitFreqId = (): Promise<Array<CpuFreqRowLimit>> =>
  query(
    'getCpuMaxMinFreqId',
    `
    select cpu,MAX(iif(name = 'cpu_frequency_limits_max',id,0)) as maxFilterId,MAX(iif(name = 'cpu_frequency_limits_min',id,0)) as minFilterId from cpu_measure_filter where name in ('cpu_frequency_limits_max','cpu_frequency_limits_min') group by cpu
`,
    {}
  );

export const getCpuLimitFreqMax = (filterIds: string): Promise<Array<any>> => {
  return query(
    'getCpuLimitFreqMax',
    `
    select max(value) as maxValue,filter_id as filterId from measure where filter_id in (${filterIds}) group by filter_id
`,
    {}
  );
};