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
import { SelectionData } from '../../bean/BoxSelection';
import { ThreadStruct } from '../ui-worker/ProcedureWorkerThread';
import { WakeupBean } from '../../bean/WakeupBean';
import { SPTChild } from '../../bean/StateProcessThread';
import { BinderArgBean } from '../../bean/BinderArgBean';
import { ProcessMemStruct } from '../ui-worker/ProcedureWorkerMem';
import { AppStartupStruct } from '../ui-worker/ProcedureWorkerAppStartup';
import { SoStruct } from '../ui-worker/ProcedureWorkerSoInit';
import { LiveProcess, ProcessHistory } from '../../bean/AbilityMonitor';
import { EnergyAnomalyStruct } from '../ui-worker/ProcedureWorkerEnergyAnomaly';

export const querySchedThreadStates = (
  tIds: Array<number>,
  leftStartNs: number,
  rightEndNs: number
): Promise<Array<any>> =>
  query(
    'getTabThreadStates',
    `
  select
    B.id,
    B.pid,
    B.tid,
    B.state,
    B.type,
    B.dur,
    B.ts,
    B.dur + B.ts as endTs
  from
    thread_state AS B
  where
    B.tid in (${tIds.join(',')})
  and
    not ((B.ts + ifnull(B.dur,0) < $leftStartNs) or (B.ts > $rightEndNs))
  order by
    B.pid;
  `,
    { $leftStartNs: leftStartNs, $rightEndNs: rightEndNs }
  );
// 框选区域内sleeping的时间
export const getTabSleepingTime = (tIds: Array<number>, leftNS: number, rightNS: number): Promise<Array<any>> =>
  query<SelectionData>(
    'getTabRunningPersent',
    `
 select
   B.pid,
   B.tid,
   B.state,
   B.cpu,
   B.dur,
   B.ts
 from
   thread_state AS  B
 left join
   trace_range AS TR
 where
   B.tid in (${tIds.join(',')})
 and
   B.state='Sleeping'
 and
   not ((B.ts - TR.start_ts + ifnull(B.dur,0) < ${leftNS}) or (B.ts - TR.start_ts > ${rightNS}))
 order by
   ts;`,
    { $leftNS: leftNS, $rightNS: rightNS }
  );
export const getTabThreadStatesCpu = (tIds: Array<number>, leftNS: number, rightNS: number): Promise<Array<any>> => {
  let sql = `
select 
       B.pid,
       B.tid,
       B.cpu,
       sum( min(${rightNS},(B.ts - TR.start_ts + B.dur)) - max(${leftNS},B.ts - TR.start_ts)) wallDuration
from thread_state as B
left join trace_range as TR
where cpu notnull
    and B.tid in (${tIds.join(',')})
    and not ((B.ts - TR.start_ts + ifnull(B.dur,0) < ${leftNS}) or (B.ts - TR.start_ts > ${rightNS}))
group by B.tid, B.pid, B.cpu;`;
  return query<SelectionData>('getTabThreadStatesCpu', sql, {
    $leftNS: leftNS,
    $rightNS: rightNS,
  });
};

// 框选区域内running的时间
export const getTabRunningPersent = (tIds: Array<number>, leftNS: number, rightNS: number): Promise<Array<any>> =>
  query<SelectionData>(
    'getTabRunningPersent',
    `
   select
     B.pid,
     B.tid,
     B.state,
     B.cpu,
     B.dur,
     B.ts
   from
     thread_state AS  B
   left join
     trace_range AS TR
   where
     B.tid in (${tIds.join(',')})
   and
     B.state='Running'
   and
     not ((B.ts - TR.start_ts + ifnull(B.dur,0) < ${leftNS}) or (B.ts - TR.start_ts > ${rightNS}))
   order by
     ts;`,
    { $leftNS: leftNS, $rightNS: rightNS }
  );
export const queryThreadData = (tid: number, pid: number): Promise<Array<ThreadStruct>> =>
  query(
    'queryThreadData',
    `
    select 
      B.itid as id
     , B.tid
     , B.cpu
     , B.ts - TR.start_ts AS startTime
     , B.dur
     , B.state
     , B.pid
     , B.arg_setid as argSetID
from thread_state AS B
    left join trace_range AS TR
where B.tid = $tid and B.pid = $pid;`,
    { $tid: tid, $pid: pid }
  );
export const queryThreadNearData = (itid: number, startTime: number): Promise<Array<any>> =>
  query(
    'queryThreadNearData',
    `
select itid,tid,pid,cpu,state,arg_setid as argSetID,dur,max((A.ts - B.start_ts)) as startTime
from thread_state A,trace_range B
where itid = ${itid}
and (A.ts - B.start_ts) < ${startTime} and A.ts > B.start_ts
union
select itid,tid,pid,cpu,state,arg_setid as argSetID,dur,min((A.ts - B.start_ts)) as startTime
from thread_state A,trace_range B
where itid = ${itid}
and (A.ts - B.start_ts) > ${startTime} and A.ts < B.end_ts;
    `,
    {}
  );
export const queryThreadWakeUpFrom = (itid: number, startTime: number): Promise<Array<WakeupBean>> => {
  let sql = `
select (A.ts - B.start_ts) as ts,
       A.tid,
       A.itid,
       A.pid,
       A.cpu,
       A.dur,
       A.arg_setid as argSetID
from thread_state A,trace_range B
where A.state = 'Running'
and A.itid = (select wakeup_from from instant where ts = ${startTime} and ref = ${itid} limit 1)
and (A.ts - B.start_ts) < (${startTime} - B.start_ts)
order by ts desc limit 1
    `;
  return query('queryThreadWakeUpFrom', sql, {});
};

export const queryRunnableTimeByRunning = (tid: number, startTime: number): Promise<Array<WakeupBean>> => {
  let sql = `
select ts from thread_state,trace_range where ts + dur -start_ts = ${startTime} and state = 'R' and tid=${tid} limit 1
    `;
  return query('queryRunnableTimeByRunning', sql, {});
};

export const queryProcess = (): Promise<
  Array<{
    pid: number | null;
    processName: string | null;
  }>
> =>
  query(
    'queryProcess',
    `
    SELECT
      pid, processName
    FROM
      temp_query_process where pid != 0`
  );

export const queryProcessByTable = (): Promise<
  Array<{
    pid: number | null;
    processName: string | null;
  }>
> =>
  query(
    'queryProcessByTable',
    `
    SELECT
      pid, name as processName
    FROM
      process where pid != 0`
  );

export const getTabBoxChildData = (
  leftNs: number,
  rightNs: number,
  cpus: number[],
  state: string | undefined,
  processId: number | undefined,
  threadId: number | undefined
): Promise<Array<SPTChild>> => {
  let condition = `
      ${state != undefined && state != '' ? `and B.state = '${state}'` : ''}
      ${processId != undefined && processId != -1 ? `and IP.pid = ${processId}` : ''}
      ${threadId != undefined && threadId != -1 ? `and A.tid = ${threadId}` : ''}
      ${cpus.length > 0 ? `and (B.cpu is null or B.cpu in (${cpus.join(',')}))` : ''}
  `;
  let sql = `select
      IP.name as process,
      IP.pid as processId,
      A.name as thread,
      B.state as state,
      A.tid as threadId,
      B.dur as duration,
      B.ts - TR.start_ts as startNs,
      B.cpu,
      C.priority
    from
      thread_state AS B
    left join
      thread as A
    on
      B.itid = A.itid
    left join
      process AS IP
    on
      A.ipid = IP.ipid
    left join
      trace_range AS TR
    left join
      sched_slice as C
    on
      B.itid = C.itid
    and
      C.ts = B.ts
    where
      B.dur > 0
    and
      IP.pid not null
    and
      not ((B.ts - TR.start_ts + B.dur < ${leftNs}) or (B.ts - TR.start_ts > ${rightNs})) ${condition};
  `;
  return query('getTabBoxChildData', sql, {});
};
export const getTabStartups = (ids: Array<number>, leftNS: number, rightNS: number): Promise<Array<any>> => {
  let sql = `
select
    P.pid,
    P.name as process,
    (A.start_time - B.start_ts) as startTs,
    (case when A.end_time = -1 then 0 else (A.end_time - A.start_time) end) as dur,
    A.start_name as startName
from app_startup A,trace_range B
left join process P on A.ipid = P.ipid
where P.pid in (${ids.join(',')}) 
and not ((startTs + dur < ${leftNS}) or (startTs > ${rightNS}))
order by start_name;`;
  return query('getTabStartups', sql, {});
};

export const getTabStaticInit = (ids: Array<number>, leftNS: number, rightNS: number): Promise<Array<any>> => {
  let sql = `
select
    P.pid,
    P.name as process,
    (A.start_time - B.start_ts) as startTs,
    (case when A.end_time = -1 then 0 else (A.end_time - A.start_time) end) as dur,
    A.so_name as soName
from static_initalize A,trace_range B
left join process P on A.ipid = P.ipid
where P.pid in (${ids.join(',')}) 
and not ((startTs + dur < ${leftNS}) or (startTs > ${rightNS}))
order by dur desc;`;
  return query('getTabStaticInit', sql, {});
};

export const queryBinderArgsByArgset = (argset: number): Promise<Array<BinderArgBean>> =>
  query(
    'queryBinderArgsByArgset',
    `
    select
      *
    from
      args_view
    where
      argset = $argset;`,
    { $argset: argset }
  );

export const queryProcessData = (pid: number, startNS: number, endNS: number): Promise<Array<any>> =>
  query(
    'queryProcessData',
    `
    select  ta.cpu,
        dur, 
        ts-${(window as any).recordStartNS} as startTime
from thread_state ta
where ta.cpu is not null and pid=$pid and startTime between $startNS and $endNS;`,
    {
      $pid: pid,
      $startNS: startNS,
      $endNS: endNS,
    }
  );

export const queryProcessMem = (): Promise<Array<any>> =>
  query(
    'queryProcessMem',
    `
    select
      process_measure_filter.id as trackId,
      process_measure_filter.name as trackName,
      ipid as upid,
      process.pid,
      process.name as processName
    from
      process_measure_filter
    join
      process using (ipid)
    order by trackName;`
  );

export const queryProcessThreadDataCount = (): Promise<Array<any>> =>
  query(
    `queryProcessThreadDataCount`,
    `select pid,count(id) as count 
    from thread_state 
    where ts between ${(window as any).recordStartNS} and ${(window as any).recordEndNS} group by pid;`,
    {}
  );

export const queryProcessFuncDataCount = (): Promise<Array<any>> =>
  query(
    `queryProcessFuncDataCount`,
    `select
        P.pid,
        count(tid) as count
    from callstack C
    left join thread A on A.id = C.callid
    left join process AS P on P.id = A.ipid
    where  C.ts between ${(window as any).recordStartNS} and ${(window as any).recordEndNS} 
    group by pid;`,
    {}
  );

export const queryProcessMemDataCount = (): Promise<Array<any>> =>
  query(
    `queryProcessMemDataCount`,
    `select
      p.pid as pid, count(value) count
    from process_measure c
    left join process_measure_filter f on f.id = c.filter_id
    left join process p on p.ipid = f.ipid
where f.id not NULL and value>0 
 and c.ts between ${(window as any).recordStartNS} and ${(window as any).recordEndNS}
group by p.pid`,
    {}
  );

export const queryProcessMemData = (trackId: number): Promise<Array<ProcessMemStruct>> =>
  query(
    'queryProcessMemData',
    `
    select
      c.type,
      ts,
      value,
      filter_id as track_id,
      c.ts-tb.start_ts startTime
    from
      process_measure c,
      trace_range tb
    where
      filter_id = $id;`,
    { $id: trackId }
  );

export const queryThreads = (): Promise<Array<any>> =>
  query('queryThreads', `select id,tid,(ifnull(name,'Thread') || '(' || tid || ')') name from thread where id != 0;`);

export const queryDataDICT = (): Promise<Array<any>> => query('queryDataDICT', `select * from data_dict;`);

export const queryAppStartupProcessIds = (): Promise<Array<{ pid: number }>> =>
  query(
    'queryAppStartupProcessIds',
    `
  SELECT pid FROM process 
  WHERE ipid IN (
    SELECT ipid FROM app_startup 
    UNION
    SELECT t.ipid FROM app_startup a LEFT JOIN thread t ON a.call_id = t.itid 
);`
  );

export const queryTaskPoolProcessIds = (): Promise<Array<{ pid: number }>> =>
  query(
    'queryAppStartupProcessIds',
    `SELECT pid 
FROM
    process 
WHERE
    ipid IN (
    SELECT DISTINCT
    ( ipid ) 
    FROM
    thread 
    WHERE
    itid IN ( SELECT DISTINCT ( callid ) FROM callstack WHERE name LIKE 'H:Task%' ) 
    AND name = 'TaskWorkThread' 
    )`
  );

export const queryProcessContentCount = (): Promise<Array<any>> =>
  query(`queryProcessContentCount`, `select pid,switch_count,thread_count,slice_count,mem_count from process;`);
export const queryProcessThreadsByTable = (): Promise<Array<ThreadStruct>> =>
  query(
    'queryProcessThreadsByTable',
    `
        select p.pid as pid,p.ipid as upid,t.tid as tid,p.name as processName,t.name as threadName,t.switch_count as switchCount from thread t left join process  p on t.ipid = p.id where t.tid != 0;
    `
  );
export const queryProcessThreads = (): Promise<Array<ThreadStruct>> =>
  query(
    'queryProcessThreads',
    `
    select
      the_tracks.ipid as upid,
      the_tracks.itid as utid,
      total_dur as hasSched,
      process.pid as pid,
      thread.tid as tid,
      process.name as processName,
      thread.switch_count as switchCount,
      thread.name as threadName
    from (
      select ipid,itid from sched_slice group by itid
    ) the_tracks
    left join (select itid,sum(dur) as total_dur from thread_state where state != 'S' group by itid) using(itid)
    left join thread using(itid)
    left join process using(ipid)
    order by total_dur desc,the_tracks.ipid,the_tracks.itid;`,
    {}
  );
export const queryStartupPidArray = (): Promise<Array<{ pid: number }>> =>
  query(
    'queryStartupPidArray',
    `
    select distinct pid 
from app_startup A,trace_range B left join process P on A.ipid = p.ipid
where A.start_time between B.start_ts and B.end_ts;`,
    {}
  );

export const queryProcessStartup = (pid: number): Promise<Array<AppStartupStruct>> =>
  query(
    'queryProcessStartup',
    `
    select
    P.pid,
    A.tid,
    A.call_id as itid,
    (case when A.start_time < B.start_ts then 0 else (A.start_time - B.start_ts) end) as startTs,
    (case 
        when A.start_time < B.start_ts then (A.end_time - B.start_ts) 
        when A.end_time = -1 then 0
        else (A.end_time - A.start_time) end) as dur,
    A.start_name as startName
from app_startup A,trace_range B
left join process P on A.ipid = P.ipid
where P.pid = $pid
order by start_name;`,
    { $pid: pid }
  );

export const queryProcessAllAppStartup = (pids: Array<number>): Promise<Array<AppStartupStruct>> =>
  query(
    'queryProcessStartup',
    `
    select
    P.pid,
    A.tid,
    A.call_id as itid,
    (case when A.start_time < B.start_ts then 0 else (A.start_time - B.start_ts) end) as startTs,
    (case 
        when A.start_time < B.start_ts then (A.end_time - B.start_ts) 
        when A.end_time = -1 then 0
        else (A.end_time - A.start_time) end) as dur,
    A.start_name as startName
from app_startup A,trace_range B
left join process P on A.ipid = P.ipid
where P.pid in(${pids.join(',')}) 
order by start_name;`,
    { $pid: pids }
  );

export const querySingleAppStartupsName = (pid: number): Promise<Array<any>> =>
  query(
    'queryAllAppStartupsName',
    `select name from process
    where pid=$pid`,
    { $pid: pid }
  );

export const queryProcessSoMaxDepth = (): Promise<Array<{ pid: number; maxDepth: number }>> =>
  query(
    'queryProcessSoMaxDepth',
    `select p.pid,max(depth) maxDepth 
from static_initalize S,trace_range B left join process p on S.ipid = p.ipid 
where S.start_time between B.start_ts and B.end_ts
group by p.pid;`,
    {}
  );
export const queryAllThreadName = (): Promise<Array<any>> => {
  return query(
    'queryAllThreadName',
    `
          select name,tid from thread;`
  );
};

export const queryAllProcessNames = (): Promise<Array<any>> => {
  return query(
    'queryAllProcessNames',
    `
        select id, name, pid from process;`
  );
};

export const queryRsProcess = (): Promise<Array<any>> => {
  return query(
    'queryRsProcess',
    `
        SELECT p.pid FROM process p WHERE p.ipid = (SELECT t.ipid FROM thread t WHERE t.itid IN 
        ( SELECT c.callid FROM callstack c WHERE name LIKE '%H:RSMainThread::DoComposition%' LIMIT 1 ) 
      LIMIT 1 
      )`
  );
};

export const queryProcessSoInitData = (pid: number): Promise<Array<SoStruct>> =>
  query(
    'queryProcessSoInitData',
    `
    select
    P.pid,
    T.tid,
    A.call_id as itid,
    (A.start_time - B.start_ts) as startTs,
    (A.end_time - A.start_time) as dur,
    A.so_name as soName,
    A.depth
from static_initalize A,trace_range B
left join process P on A.ipid = P.ipid
left join thread T on A.call_id = T.itid
where P.pid = $pid;`,
    { $pid: pid }
  );

export const queryThreadAndProcessName = (): Promise<Array<any>> =>
  query(
    'queryThreadAndProcessName',
    `
    select tid id,name,'t' type from thread
union all
select pid id,name,'p' type from process;`,
    {}
  );

export const queryThreadStateArgs = (argset: number): Promise<Array<BinderArgBean>> =>
  query('queryThreadStateArgs', ` select args_view.* from args_view where argset = ${argset}`, {});

export const queryThreadStateArgsByName = (key: string): Promise<Array<{ argset: number; strValue: string }>> =>
  query('queryThreadStateArgsByName', ` select strValue, argset from args_view where keyName = $key`, { $key: key });

export const queryWakeUpThread_Desc = (): Promise<Array<any>> =>
  query(
    'queryWakeUpThread_Desc',
    `This is the interval from when the task became eligible to run
(e.g.because of notifying a wait queue it was a suspended on) to when it started running.`
  );

export const queryThreadWakeUp = (itid: number, startTime: number, dur: number): Promise<Array<WakeupBean>> =>
  query(
    'queryThreadWakeUp',
    `
select TA.tid,min(TA.ts - TR.start_ts) as ts,TA.pid,TA.dur,TA.state,TA.cpu,TA.itid,TA.arg_setid as argSetID
from
  (select min(ts) as wakeTs,ref as itid from instant,trace_range
       where name = 'sched_wakeup'
       and wakeup_from = $itid
       and ts > start_ts + $startTime
       and ts < start_ts + $startTime + $dur
      group by ref
       ) TW
left join thread_state TA on TW.itid = TA.itid
left join trace_range TR
where TA.ts > TW.wakeTs
group by TA.tid,TA.pid;
    `,
    { $itid: itid, $startTime: startTime, $dur: dur }
  );

export const getTabRunningPercent = (
  tIds: Array<number>,
  leftNS: number,
  rightNS: number
): Promise<
  Array<{
    pid: number;
    tid: number;
    cpu: number;
    dur: number;
    ts: number;
    process: string;
    thread: string;
  }>
> =>
  query(
    'getTabRunningPercent',
    `
          select
            B.pid,
            B.tid,
            B.cpu,
            B.dur,
            B.ts
          from
            thread_state AS B
          left join 
            trace_range AS TR
          where
            B.tid in (${tIds.join(',')})
          and
            B.state='Running'
          and
            not ((B.ts - TR.start_ts + ifnull(B.dur,0) < ${leftNS}) or (B.ts - TR.start_ts > ${rightNS}))
          order by ts
        `
  );
//VM  Purgeable 点选 tab页
export const queryProcessPurgeableSelectionTab = (
  startNs: number,
  ipid: number,
  isPin?: boolean
): Promise<Array<any>> => {
  const condition = isPin ? "'mem.purg_pin'" : "'mem.purg_sum'";
  const pinSql = isPin ? ' AND ref_count > 0' : '';
  return query(
    'queryProcessPurgeableSelectionTab',
    `SELECT
        ( CASE WHEN f.name = 'mem.purg_pin' THEN 'PinedPurg' ELSE 'TotalPurg' END ) AS name,
        SUM( m.value )  AS value 
    FROM
        process_measure m,
        trace_range tr
        left join process_measure_filter f on f.id = m.filter_id 
    WHERE
        f.name = ${condition} 
        AND m.ts - tr.start_ts = ${startNs}
    AND f.ipid = ${ipid}
    GROUP BY m.ts
    UNION
    SELECT
        'ShmPurg' AS name,
        SUM( pss ) AS size
    FROM
        memory_ashmem,
        trace_range tr
    WHERE
        ipid = ${ipid}
        AND ts - tr.start_ts = ${startNs}
        AND flag = 0
        ${pinSql}
    GROUP BY ts`
  );
};
///////////////////////////////////////////////
//VM  Purgeable 框选 tab页
export const queryProcessPurgeableTab = (
  leftNs: number,
  rightNs: number,
  dur: number,
  ipid: number,
  isPin?: boolean
): Promise<Array<any>> => {
  const pinSql = isPin ? ' AND ref_count > 0' : '';
  let filterSql = isPin ? "'mem.purg_pin'" : "'mem.purg_sum'";
  return query(
    'queryProcessPurgeableTab',
    `SELECT name, MAX(size) AS maxSize, MIN(size) AS minSize, AVG(size) AS avgSize
    FROM
      (SELECT
        'ShmPurg' AS name, ts - tr.start_ts AS startTs, SUM( pss ) AS size
      FROM
        memory_ashmem,
        trace_range tr
      WHERE
        ipid = ${ipid}
        AND flag = 0
        ${pinSql}
      GROUP BY ts
      UNION
      SELECT
      CASE
          WHEN f.name = 'mem.purg_pin' THEN
          'PinedPurg' ELSE 'TotalPurg'
        END AS name,
        m.ts - tr.start_ts AS startTs,
        sum( m.value ) AS size
      FROM
        process_measure m,
        trace_range tr
        LEFT JOIN process_measure_filter f ON f.id = m.filter_id 
      WHERE f.name = ${filterSql}
        AND f.ipid = ${ipid}
      GROUP BY m.ts
    ) combined_data, trace_range tr
    WHERE ${leftNs} <= startTs + ${dur} AND ${rightNs} >= startTs
    GROUP BY name`
  );
};
export const getTabPowerDetailsData = (
  leftNs: number,
  rightNs: number
): Promise<
  Array<{
    startNS: number;
    eventName: string;
    appKey: string;
    eventValue: string;
  }>
> =>
  query(
    'getTabPowerDetailsData',
    `SELECT
        ( S.ts - TR.start_ts ) AS startNS,
        D.data AS eventName,
        D2.data AS appKey,
        group_concat( ( CASE WHEN S.type == 1 THEN S.string_value ELSE S.int_value END ), ',' ) AS eventValue
        FROM
        trace_range AS TR,
        hisys_event_measure AS S
        LEFT JOIN data_dict AS D ON D.id = S.name_id
        LEFT JOIN app_name AS APP ON APP.id = S.key_id
        LEFT JOIN data_dict AS D2 ON D2.id = APP.app_key
        where
        D.data in ('POWER_IDE_CPU','POWER_IDE_LOCATION','POWER_IDE_GPU','POWER_IDE_DISPLAY','POWER_IDE_CAMERA','POWER_IDE_BLUETOOTH','POWER_IDE_FLASHLIGHT','POWER_IDE_AUDIO','POWER_IDE_WIFISCAN')
        and
        D2.data in ('APPNAME')
        GROUP BY
        S.serial,
        APP.app_key,
        D.data,
        D2.data
        UNION
        SELECT
        ( S.ts - TR.start_ts ) AS startNS,
        D1.data AS eventName,
        D2.data AS appKey,
        group_concat( ( CASE WHEN S.type == 1 THEN S.string_value ELSE S.int_value END ), ',' ) AS eventValue
        FROM
        trace_range AS TR,
        hisys_event_measure AS S
        LEFT JOIN data_dict AS D1 ON D1.id = S.name_id
        LEFT JOIN app_name AS APP ON APP.id = S.key_id
        LEFT JOIN data_dict AS D2 ON D2.id = APP.app_key
        where
        D1.data in ('POWER_IDE_CPU','POWER_IDE_LOCATION','POWER_IDE_GPU','POWER_IDE_DISPLAY','POWER_IDE_CAMERA','POWER_IDE_BLUETOOTH','POWER_IDE_FLASHLIGHT','POWER_IDE_AUDIO','POWER_IDE_WIFISCAN')
        and
        D2.data in ('CHARGE','BACKGROUND_TIME','SCREEN_ON_TIME','SCREEN_OFF_TIME','LOAD','USAGE','DURATION','CAMERA_ID',
        'FOREGROUND_COUNT','BACKGROUND_COUNT','SCREEN_ON_COUNT','SCREEN_OFF_COUNT','COUNT','UID','FOREGROUND_DURATION',
        'FOREGROUND_ENERGY','BACKGROUND_DURATION','BACKGROUND_ENERGY','SCREEN_ON_DURATION','SCREEN_ON_ENERGY',
        'SCREEN_OFF_DURATION','SCREEN_OFF_ENERGY','ENERGY')
        and
        (S.ts - TR.start_ts) >= $leftNS
        and (S.ts - TR.start_ts) <= $rightNS
        GROUP BY
        S.serial,
        APP.app_key,
        D1.data,
        D2.data
        ORDER BY
        eventName;`,
    { $leftNS: leftNs, $rightNS: rightNs }
  );

export const getTabPowerBatteryData = (
  rightNs: number
): Promise<
  Array<{
    ts: number;
    eventName: string;
    appKey: string;
    eventValue: string;
  }>
> =>
  query(
    'getTabPowerBatteryData',
    `select
      MAX(S.ts) as ts,
      D.data as eventName,
      D2.data as appKey, 
      group_concat((case when S.type==1 then S.string_value else S.int_value end), ',') as eventValue 
      from 
      trace_range AS TR,
      hisys_event_measure as S 
      left join 
      data_dict as D 
      on 
      D.id=S.name_id 
      left join 
      app_name as APP 
      on 
      APP.id=S.key_id 
      left join 
      data_dict as D2 
      on 
      D2.id=APP.app_key
      where 
      D.data = 'POWER_IDE_BATTERY'
      and D2.data in ('GAS_GAUGE','CHARGE','SCREEN','LEVEL','CURRENT','CAPACITY','UID')
      and (S.ts - TR.start_ts) >= 0
      and (S.ts - TR.start_ts) <= $rightNS 
      group by APP.app_key,D.data,D2.data;`,
    { $rightNS: rightNs }
  );
export const queryPowerData = (): Promise<
  Array<{
    id: number;
    startNS: number;
    eventName: string;
    appKey: string;
    eventValue: string;
  }>
> =>
  query(
    'queryPowerData',
    `SELECT
         S.id,
        ( S.ts - TR.start_ts ) AS startNS,
        D.data AS eventName,
        D2.data AS appKey,
        group_concat( ( CASE WHEN S.type == 1 THEN S.string_value ELSE S.int_value END ), ',' ) AS eventValue
        FROM
        trace_range AS TR,
        hisys_event_measure AS S
        LEFT JOIN data_dict AS D
        ON D.id = S.name_id
        LEFT JOIN app_name AS APP
        ON APP.id = S.key_id
        LEFT JOIN data_dict AS D2
        ON D2.id = APP.app_key
        where
        D.data in ('POWER_IDE_CPU','POWER_IDE_LOCATION','POWER_IDE_GPU','POWER_IDE_DISPLAY','POWER_IDE_CAMERA','POWER_IDE_BLUETOOTH','POWER_IDE_FLASHLIGHT','POWER_IDE_AUDIO','POWER_IDE_WIFISCAN')
        and
        D2.data in ('BACKGROUND_ENERGY','FOREGROUND_ENERGY','SCREEN_ON_ENERGY','SCREEN_OFF_ENERGY','ENERGY','APPNAME')
        GROUP BY
        S.serial,
        APP.app_key,
        D.data,
        D2.data
        ORDER BY
        eventName;`,
    {}
  );
export const getTabLiveProcessData = (leftNs: number, rightNs: number): Promise<Array<LiveProcess>> =>
  query<LiveProcess>(
    'getTabLiveProcessData',
    `SELECT
        process.id as processId,
        process.name as processName,
        process.ppid as responsibleProcess,
        process.uud as userName,
        process.usag as cpu,
        process.threadN as threads,
        process.pss as memory,
        process.cpu_time as cpuTime,
        process.disk_reads as diskReads,
        process.disk_writes as diskWrite
        FROM
        (
        SELECT
        tt.process_id AS id,
        tt.process_name AS name,
        tt.parent_process_id AS ppid,
        tt.uid as uud,
        tt.cpu_usage as usag,
        tt.thread_num AS threadN,
        mt.maxTT - TR.start_ts as endTs,
        tt.pss_info as pss,
        tt.cpu_time,
        tt.disk_reads,
        tt.disk_writes
        FROM
        live_process tt
        LEFT JOIN trace_range AS TR 
        LEFT JOIN (select re.process_id as idd, max(re.ts) as maxTT, min(re.ts) as minTT 
        from live_process re GROUP BY re.process_name, re.process_id ) mt
        on mt.idd = tt.process_id where endTs >= $rightNS
        GROUP BY
        tt.process_name,
        tt.process_id 
        ) process ;`,
    { $leftNS: leftNs, $rightNS: rightNs }
  );

export const getTabProcessHistoryData = (
  leftNs: number,
  rightNs: number,
  processId: number | undefined,
  threadId: number | undefined
): Promise<Array<ProcessHistory>> =>
  query<ProcessHistory>(
    'getTabProcessHistoryData',
    `SELECT
        process.id as processId,
        process.isD as alive,
        process.startTS as firstSeen,
        process.endTs as lastSeen,
        process.name as processName,
        process.ppid as responsibleProcess,
        process.uuid as userName,
        process.cpu_time as cpuTime,
        0 as pss
        FROM
        (
        SELECT
        tt.process_id AS id,
        tt.process_name AS name,
        tt.parent_process_id AS ppid,
        tt.uid AS uuid,
        tt.cpu_time,
        (mt.minTT - TR.start_ts ) AS startTS,
        mt.maxTT - TR.start_ts as endTs,
        (mt.maxTT - TR.start_ts - $rightNS) > 0 as isD
        FROM
        live_process tt
        LEFT JOIN trace_range AS TR 
        LEFT JOIN (select re.process_id as idd, max(re.ts) as maxTT, min(re.ts) as minTT 
        from live_process re GROUP BY re.process_name, re.process_id ) mt
        on mt.idd = tt.process_id 
        GROUP BY
        tt.process_name,
        tt.process_id 
        ) process;`,
    {
      $leftNS: leftNs,
      $rightNS: rightNs,
      $processID: processId,
      $threadID: threadId,
    }
  );
export const getTabSlices = (
  funTids: Array<number>,
  pids: Array<number>,
  leftNS: number,
  rightNS: number
): Promise<Array<any>> =>
  query<SelectionData>(
    'getTabSlices',
    `
    select
      c.name as name,
      sum(c.dur) as wallDuration,
      avg(c.dur) as avgDuration,
      count(c.name) as occurrences
    from
      thread T, trace_range TR
      left join process P on T.ipid = P.id
    left join
      callstack C
    on
      T.id = C.callid
    where
      C.ts > 0
      and
      c.dur >= 0
    and
      T.tid in (${funTids.join(',')})
    and
      P.pid in (${pids.join(',')})
    and
      c.cookie is null
    and
      not ((C.ts - TR.start_ts + C.dur < $leftNS) or (C.ts - TR.start_ts > $rightNS))
    group by
      c.name
    order by
      wallDuration desc;`,
    { $leftNS: leftNS, $rightNS: rightNS }
  );
export const getTabThreadStates = (tIds: Array<number>, leftNS: number, rightNS: number): Promise<Array<any>> =>
  query<SelectionData>(
    'getTabThreadStates',
    `
    select
      B.pid,
      B.tid,
      B.state,
      sum(B.dur) as wallDuration,
      avg(ifnull(B.dur,0)) as avgDuration,
      count(B.tid) as occurrences
    from
      thread_state AS B
    left join
      trace_range AS TR
    where
      B.tid in (${tIds.join(',')})
    and
      not ((B.ts - TR.start_ts + ifnull(B.dur,0) < $leftNS) or (B.ts - TR.start_ts > $rightNS))
    group by
      B.pid, B.tid, B.state
    order by
      wallDuration desc;`,
    { $leftNS: leftNS, $rightNS: rightNS }
  );

// 查询线程状态详细信息
export const getTabThreadStatesDetail = (tIds: Array<number>, leftNS: number, rightNS: number): Promise<Array<any>> =>
  query<SelectionData>(
    'getTabThreadStates',
    `select
        B.pid,
        B.tid,
        B.state, 
        B.ts, 
        B.dur 
      from
        thread_state AS B
      left join
        trace_range AS TR
      where
        B.tid in (${tIds.join(',')})
      and
        not ((B.ts - TR.start_ts + ifnull(B.dur,0) < $leftNS) or (B.ts - TR.start_ts > $rightNS))     
      order by ts;`,
    { $leftNS: leftNS, $rightNS: rightNS }
  );
export const queryAnomalyDetailedData = (leftNs: number, rightNs: number): Promise<Array<EnergyAnomalyStruct>> =>
  query<EnergyAnomalyStruct>(
    'queryAnomalyDetailedData',
    `select
  S.ts,
  D.data as eventName,
  D2.data as appKey,
  group_concat((case when S.type==1 then S.string_value else S.int_value end), ',') as Value
  from trace_range AS TR,hisys_event_measure as S
  left join data_dict as D on D.id=S.name_id
  left join app_name as APP on APP.id=S.key_id
  left join data_dict as D2 on D2.id=APP.app_key
  where D.data in ('ANOMALY_SCREEN_OFF_ENERGY','ANOMALY_ALARM_WAKEUP','ANOMALY_KERNEL_WAKELOCK',
  'ANOMALY_RUNNINGLOCK','ANORMALY_APP_ENERGY','ANOMALY_GNSS_ENERGY','ANOMALY_CPU_HIGH_FREQUENCY','ANOMALY_CPU_ENERGY','ANOMALY_WAKEUP')
  and D2.data in ('APPNAME')
  and (S.ts - TR.start_ts) >= $leftNS
   and (S.ts - TR.start_ts) <= $rightNS
  group by S.serial,APP.app_key,D.data,D2.data
  union
  select
  S.ts,
  D.data as eventName,
  D2.data as appKey,
  group_concat((case when S.type == 1 then S.string_value else S.int_value end), ',') as Value
  from trace_range AS TR,hisys_event_measure as S
  left join data_dict as D on D.id = S.name_id
  left join app_name as APP on APP.id = S.key_id
  left join data_dict as D2 on D2.id = APP.app_key
  where D.data in ('ANOMALY_SCREEN_OFF_ENERGY', 'ANOMALY_ALARM_WAKEUP', 'ANOMALY_KERNEL_WAKELOCK',
  'ANOMALY_RUNNINGLOCK', 'ANORMALY_APP_ENERGY', 'ANOMALY_GNSS_ENERGY', 'ANOMALY_CPU_HIGH_FREQUENCY', 'ANOMALY_CPU_ENERGY', 'ANOMALY_WAKEUP')
  and D2.data not in ('pid_', 'tid_', 'type_', 'tz_', 'uid_', 'domain_', 'id_', 'level_', 'info_', 'tag_', 'APPNAME')
  and (S.ts - TR.start_ts) >= $leftNS
  and (S.ts - TR.start_ts) <= $rightNS
  group by S.serial, APP.app_key, D.data, D2.data;`,
    { $leftNS: leftNs, $rightNS: rightNs }
  );

export const queryBySelectExecute = (
  executeId: string,
  itid: number
): Promise<
  Array<{
    tid: number;
    allocation_task_row: number;
    execute_task_row: number;
    return_task_row: number;
    priority: number;
  }>
> => {
  let sqlStr = `SELECT thread.tid,
                       task_pool.allocation_task_row,
                       task_pool.execute_task_row,
                       task_pool.return_task_row,
                       task_pool.priority
                FROM task_pool
                       LEFT JOIN callstack ON callstack.id = task_pool.allocation_task_row
                       LEFT JOIN thread ON thread.id = callstack.callid
                WHERE task_pool.execute_id = $executeId AND task_pool.execute_itid = $itid;
    `;
  return query('queryBySelectExecute', sqlStr, { $executeId: executeId, $itid: itid });
};
