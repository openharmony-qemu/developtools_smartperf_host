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
import { BinderItem } from '../../bean/BinderProcessThread';
import { Utils } from '../../component/trace/base/Utils';
import { FuncStruct } from '../ui-worker/ProcedureWorkerFunc';

export const queryBinderByThreadId = (
  pIds: number[],
  tIds: Array<number>,
  leftNS: number,
  rightNS: number
): Promise<Array<BinderItem>> =>
  query<BinderItem>(
    'queryBinderByThreadId',
    `
      SELECT 
            c.name, 
            c.ts - r.start_ts AS ts, 
            c.dur, 
            t.tid,
            p.pid
          FROM 
              callstack c, trace_range r 
          LEFT JOIN 
              thread t 
          ON 
              c.callid = t.id 
          LEFT JOIN
              process p 
          ON
              t.ipid = p.id  
          WHERE 
              c.name in ('binder transaction', 'binder async rcv', 'binder reply', 'binder transaction async') 
          AND 
              t.tid in (${tIds.join(',')})
          AND 
              p.pid in (${pIds.join(',')})
          AND NOT 
              (((c.ts - r.start_ts) < ${leftNS}) 
          OR 
              ((c.ts - r.start_ts) > ${rightNS}))
        `,
    {
      $pIds: pIds,
      $tIds: tIds,
      $leftNS: leftNS,
      $rightNS: rightNS,
    },
    { traceId: Utils.currentSelectTrace }
  );

export const getTabBindersCount = (
  pIds: number[],
  tIds: number[],
  leftNS: number,
  rightNS: number
): Promise<Array<BinderItem>> =>
  query<BinderItem>(
    'getTabBindersCount',
    `
      SELECT 
          c.name,
          c.dur,
          1 AS count,
          c.ts,
          c.ts - r.start_ts AS startTime, 
          c.ts -r.start_ts + c.dur AS endTime,
          t.tid, 
          p.pid
        FROM 
            callstack c, trace_range r 
          LEFT JOIN
            thread t 
          ON 
            c.callid = t.id 
          LEFT JOIN
            process p 
          ON
            t.ipid = p.id 
        WHERE 
            c.name in ('binder transaction', 'binder async rcv', 'binder reply', 'binder transaction async') 
          AND 
            t.tid in (${tIds.join(',')})
          AND 
            p.pid in (${pIds.join(',')})
          AND NOT 
            ((startTime < ${leftNS}) 
          OR 
            (endTime > ${rightNS}));
      `,
    {
      $pIds: pIds,
      $tIds: tIds,
      $leftNS: leftNS,
      $rightNS: rightNS,
    }
  );

export const querySchedThreadStates = (
  pIds: Array<number>,
  tIds: Array<number>,
  leftStartNs: number,
  rightEndNs: number
): //@ts-ignore
  Promise<Array<unknown>> =>
  query(
    'getTabThreadStates',
    `
    select
      B.pid,
      B.tid,
      B.state,
      ifnull(B.dur,0) as dur,
      B.ts,
      ifnull(B.dur,0) + B.ts as endTs
    from
      thread_state AS B
    where
      B.tid in (${tIds.join(',')})
    and 
      B.pid in (${pIds.join(',')})
    and
      B.state='Running'
    and
      not ((B.ts + ifnull(B.dur,0) < $leftStartNs) or (B.ts > $rightEndNs))
    order by
      B.pid;
    `,
    { $leftStartNs: leftStartNs, $rightEndNs: rightEndNs }
  );

export const querySingleCutData = (
  funcName: string,
  tIds: string,
  leftStartNs: number,
  rightEndNs: number
): //@ts-ignore
  Promise<Array<unknown>> =>
  query(
    'querySingleCutData',
    `
    select 
      c.ts as cycleStartTime,
      c.ts + ifnull(c.dur, 0) as cycleEndTime,
      t.tid,
      p.pid
      from
      callstack c 
    left join
      thread t on c.callid = t.id 
    left join
      process p on t.ipid = p.id
    left join
      trace_range r
    where
      c.name like '${funcName}%'
    and 
      t.tid = '${tIds}'
    and
      not ((c.ts < $leftStartNs) or (c.ts + ifnull(c.dur, 0) > $rightEndNs))
    order by
      c.ts
    `,
    { $leftStartNs: leftStartNs, $rightEndNs: rightEndNs }
  );

export const queryLoopCutData = (
  funcName: string,
  tIds: string,
  leftStartNs: number,
  rightEndNs: number
): //@ts-ignore
  Promise<Array<unknown>> =>
  query(
    'queryLoopCutData',
    `
    select 
      c.ts as cycleStartTime,
      t.tid,
      p.pid
    from callstack c 
    left join
      thread t on c.callid = t.id 
    left join
      process p on t.ipid = p.id
    where 
      c.name like '${funcName}%' 
    and
      t.tid = '${tIds}' 
    and
      not ((c.ts < $leftStartNs) or (c.ts > $rightEndNs))
    order by
      c.ts
    `,
    { $leftStartNs: leftStartNs, $rightEndNs: rightEndNs }
  );
// 框选区域内sleeping的时间
export const getTabSleepingTime = (
  tIds: Array<number>,
  leftNS: number,
  rightNS: number
): //@ts-ignore
  Promise<Array<unknown>> =>
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
export const getTabThreadStatesCpu = (
  tIds: Array<number>,
  leftNS: number,
  rightNS: number
): //@ts-ignore
  Promise<Array<unknown>> => {
  let sql = `
select
       B.pid,
       B.tid,
       B.cpu,
       sum( min(${rightNS},(B.ts - TR.start_ts + iif(B.dur = -1 or B.dur is null, 0, B.dur))) - 
       max(${leftNS},B.ts - TR.start_ts)) wallDuration
from thread_state as B
left join trace_range as TR
where cpu notnull
    and B.tid in (${tIds.join(',')})
    and not ((B.ts - TR.start_ts + iif(B.dur = -1 or B.dur is null, 0, B.dur) < ${leftNS}) 
    or (B.ts - TR.start_ts > ${rightNS}))
group by B.tid, B.pid, B.cpu;`;
  return query<SelectionData>('getTabThreadStatesCpu', sql, {
    $leftNS: leftNS,
    $rightNS: rightNS,
  }, {
    traceId: Utils.currentSelectTrace
  });
};

// 框选区域内running的时间
export const getTabRunningPersent = (
  tIds: Array<number>,
  leftNS: number,
  rightNS: number
): //@ts-ignore
  Promise<Array<unknown>> =>
  query<SelectionData>(
    'getTabRunningPersent',
    `
   select
     B.pid,
     B.tid,
     B.state,
     B.cpu,
     iif(B.dur = -1 or B.dur is null, 0, B.dur) as dur,
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
     not ((B.ts - TR.start_ts + iif(B.dur = -1 or B.dur is null, 0, B.dur) < ${leftNS}) 
     or (B.ts - TR.start_ts > ${rightNS}))
   order by
     ts;`,
    { $leftNS: leftNS, $rightNS: rightNS },
    { traceId: Utils.currentSelectTrace }
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

export const queryThreadWakeUpFrom = async (itid: number, startTime: number): Promise<unknown> => {
  let sql1 = `select wakeup_from from instant where ts = ${startTime} and ref = ${itid} limit 1`;
  const result = await query('queryThreadWakeUpFrom', sql1, {}, { traceId: Utils.currentSelectTrace });
  let res: unknown = [];
  if (result && result.length > 0) { //@ts-ignore
    let wakeupFromItid = result[0].wakeup_from; // 获取wakeup_from的值  
    let sql2 = `  
            select (A.ts - B.start_ts) as ts,  
                   A.tid,  
                   A.itid,  
                   A.pid,  
                   A.cpu,  
                   A.dur,  
                   A.arg_setid as argSetID  
            from thread_state A, trace_range B  
            where A.state = 'Running'  
            and A.itid = ${wakeupFromItid}  
            and (A.ts - B.start_ts) < (${startTime} - B.start_ts)  
            order by ts desc limit 1  
          `;
    res = query('queryThreadWakeUpFrom', sql2, {}, { traceId: Utils.currentSelectTrace });
  }
  return res;
};

export const queryRWakeUpFrom = async (itid: number, startTime: number): Promise<unknown> => {
  let sql1 = `select wakeup_from from instant where ts = ${startTime} and ref = ${itid} limit 1`;
  const res = await query('queryRWakeUpFrom', sql1, {}, { traceId: Utils.currentSelectTrace });
  let result: unknown = [];
  if (res && res.length) {
    //@ts-ignore
    let wakeupFromItid = res[0].wakeup_from;
    let sql2 = `
      select 
        (A.ts - B.start_ts) as ts,
        A.tid,
        A.itid,
        A.arg_setid as argSetID
      from 
        thread_state A,
        trace_range B
      where 
        A.state = 'Running'
        and A.itid = ${wakeupFromItid}
        and A.ts < ${startTime}
      order by 
        ts desc 
        limit 1
    `;
    result = query('queryRWakeUpFrom', sql2, {}, { traceId: Utils.currentSelectTrace });
  }
  return result;
};
export const queryRunnableTimeByRunning = (tid: number, startTime: number): Promise<Array<WakeupBean>> => {
  let sql = `
select ts from thread_state,trace_range where ts + dur -start_ts = ${startTime} and state = 'R' and tid=${tid} limit 1
    `;
  return query('queryRunnableTimeByRunning', sql, {}, { traceId: Utils.currentSelectTrace });
};

export const queryProcessByTable = (traceId?: string): Promise<
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
      process where pid != 0`,
    {},
    { traceId: traceId }
  );

export const getTabStartups = (
  ids: Array<number>,
  leftNS: number,
  rightNS: number
): //@ts-ignore
  Promise<Array<unknown>> => {
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

export const getTabStaticInit = (
  ids: Array<number>,
  leftNS: number,
  rightNS: number
): //@ts-ignore
  Promise<Array<unknown>> => {
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
    { $argset: argset },
    { traceId: Utils.currentSelectTrace }
  );

export const queryProcessData = (
  pid: number,
  startNS: number,
  endNS: number
): //@ts-ignore
  Promise<Array<unknown>> =>
  query(
    'queryProcessData',
    `
    select  ta.cpu,
        dur, 
        ts-${window.recordStartNS} as startTime
from thread_state ta
where ta.cpu is not null and pid=$pid and startTime between $startNS and $endNS;`,
    {
      $pid: pid,
      $startNS: startNS,
      $endNS: endNS,
    }
  );

export const queryProcessMem = (): //@ts-ignore
  Promise<Array<unknown>> =>
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

export const queryProcessThreadDataCount = (): //@ts-ignore
  Promise<Array<unknown>> =>
  query(
    'queryProcessThreadDataCount',
    `select pid,count(id) as count 
    from thread_state 
    where ts between ${window.recordStartNS} and ${window.recordEndNS} group by pid;`,
    {}
  );

export const queryProcessFuncDataCount = (): //@ts-ignore
  Promise<Array<unknown>> =>
  query(
    'queryProcessFuncDataCount',
    `select
        P.pid,
        count(tid) as count
    from callstack C
    left join thread A on A.id = C.callid
    left join process AS P on P.id = A.ipid
    where  C.ts between ${window.recordStartNS} and ${window.recordEndNS} 
    group by pid;`,
    {}
  );

export const queryProcessMemDataCount = (): //@ts-ignore
  Promise<Array<unknown>> =>
  query(
    'queryProcessMemDataCount',
    `select
      p.pid as pid, count(value) count
    from process_measure c
    left join process_measure_filter f on f.id = c.filter_id
    left join process p on p.ipid = f.ipid
where f.id not NULL and value>0 
 and c.ts between ${window.recordStartNS} and ${window.recordEndNS}
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

export const queryThreads = ():
  Promise<Array<{ id: number; tid: number; name: string; }>> =>
  query('queryThreads', `select id,tid,(ifnull(name,'Thread') || '(' || tid || ')') name from thread where id != 0;`);

export const queryDataDICT = async (): Promise<Array<unknown>> => {
  let dataDictBuffer = await query(
    'queryDataDICT',
    'select * from data_dict;',
    {},
    { action: 'exec-buf' }
  );
  // @ts-ignore
  return Utils.convertJSON(dataDictBuffer);
};

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

export const querySysCallThreadIds = (traceId?: string): Promise<Array<{ pid: number, tid: number, itid: number, ipid: number }>> =>
  query(
    'querySysCallThreadIds',
    `SELECT tid, pid, itid, thread.ipid
FROM
    thread left join process on thread.ipid = process.ipid 
WHERE
    itid IN (SELECT DISTINCT( itid ) FROM syscall )
    `,
    {},
    { traceId: traceId}
  );

export const querySysCallEventDetail = 
(itid: number, startTs: number, dur: number, traceId?: string): Promise<Array<{tid: number, pid: number, 
  tName: string, pName: string, args: string, ret: number}>> => 
  query(
    'querySysCallEventDetail',
    `SELECT tid, thread.name as tName, pid, process.name as pName, args, ret 
FROM
  (select * from syscall where itid= ${itid} and ts = ${startTs} and dur = ${dur}) A
  left join thread on A.itid = thread.itid 
  left join process on thread.ipid = process.ipid 
    `,
    {},
    { traceId: traceId}
  );

export const querySysCallEventWithBoxSelect = 
(ipidArr: Array<number>, itidArr: Array<number>, leftNs: number, rightNs: number): Promise<Array<{
  pName: string,
  tName: string,
  pid: number,
  tid: number,
  nameId: number,
  sumDur: number,
  totalCount: number
}>> => 
  query(
    'querySysCallEventWithBoxSelect',
    `select ifnull(process.name, 'Process') as pName, 
	   ifnull(thread.name, 'Thread') as tName,
	   process.pid,
	   thread.tid,
	   A.nameId,
	   A.sumDur,
	   A.totalCount 
from (
select itid, syscall_number as nameId, sum(dur) as sumDur, count(1) as totalCount
from syscall
where 
  ${itidArr.length > 0 ? 'itid in (' + itidArr.join(',') + ')' : '1 = 1'}
  and not ((ts - ${window.recordStartNS} + ifnull(dur,0) < ${leftNs}) or (ts - ${window.recordStartNS} > ${rightNs}))
group by itid, syscall_number 
) as A
left join thread on A.itid = thread.itid
left join process on thread.ipid = process.ipid  
where
  ${ipidArr.length > 0 ? 'thread.ipid in (' + ipidArr.join(',') + ')' : '1 = 1'}
    `,
    {}
  );

  export const querySysCallEventWithRange = 
(ipidArr: Array<number>, itidArr: Array<number>, leftNs: number, rightNs: number, sysCallId?: number): Promise<Array<{
  pName: string,
  tName: string,
  pid: number,
  tid: number,
  nameId: number,
  startTs: number,
  dur: number,
  args: string,
  ret: number,
}>> => 
  query(
    'querySysCallEventWithRange',
    `select ifnull(process.name, 'Process') as pName, 
	   ifnull(thread.name, 'Thread') as tName,
	   process.pid,
	   thread.tid,
	   A.nameId,
	   A.startTs,
	   A.dur,
	   A.args,
	   A.ret
from (
	select itid, syscall_number as nameId, (ts - ${window.recordStartNS}) as startTs, dur, args, ret
	from syscall
	where 
		${itidArr.length > 0 ? 'itid in (' + itidArr.join(',') + ')' : '1 = 1'}
		and ${sysCallId !== undefined ? 'syscall_number = ' + sysCallId : '1 = 1'  }
		and not ((ts - ${window.recordStartNS} + ifnull(dur,0) < ${leftNs}) or (ts - ${window.recordStartNS} > ${rightNs}))
	) as A
	left join thread on A.itid = thread.itid
	left join process on thread.ipid = process.ipid  
where
  ${ipidArr.length > 0 ? 'thread.ipid in (' + ipidArr.join(',') + ')' : '1 = 1'}
    `,
    {}
  );

export const queryProcessContentCount = (traceId?: string): Promise<Array<unknown>> =>
  query(
    `queryProcessContentCount`,
    `select 
    pid,
    switch_count,
    thread_count,
    slice_count,
    mem_count 
    from process;`,
    {},
    { traceId: traceId }
  );

export const queryProcessThreadsByTable = (traceId?: string): Promise<Array<ThreadStruct>> =>
  query(
    'queryProcessThreadsByTable',
    `
        select 
        p.pid as pid,
        p.ipid as upid,
        t.tid as tid,
        p.name as processName,
        t.name as threadName,
        t.switch_count as switchCount, 
        t.itid as utid 
        from 
        thread t left join process  p on t.ipid = p.id where t.tid != 0`,
    {},
    { traceId: traceId }
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

export const querySingleAppStartupsName = (
  pid: number
): //@ts-ignore
  Promise<Array<unknown>> =>
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
export const queryAllThreadName = (): //@ts-ignore
  Promise<Array<unknown>> => {
  return query(
    'queryAllThreadName',
    `
          select name,tid from thread;`
  );
};

export const queryAllProcessNames = (): //@ts-ignore
  Promise<Array<unknown>> => {
  return query(
    'queryAllProcessNames',
    `
        select id, name, pid from process;`
  );
};

export const queryRsProcess = (): //@ts-ignore
  Promise<Array<unknown>> => {
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

export const queryThreadAndProcessName = (traceId?: string): //@ts-ignore
  Promise<Array<unknown>> =>
  query(
    'queryThreadAndProcessName',
    `
    select tid id,name,'t' type from thread
union all
select pid id,name,'p' type from process;`,
    {},
    { traceId: traceId }
  );

export const queryThreadStateArgs = (argset: number): Promise<Array<BinderArgBean>> =>
  query('queryThreadStateArgs',
    `select args_view.* from args_view where argset = ${argset}`, {}, {
    traceId: Utils.currentSelectTrace
  });

export const queryThreadStateArgsByName = (key: string, traceId?: string):
  Promise<Array<{ argset: number; strValue: string }>> =>
  query(
    'queryThreadStateArgsByName',
    `select 
    strValue, 
    argset 
    from args_view where keyName = $key`,
    { $key: key },
    { traceId: traceId }
  );

export const queryArgsById = (key: string, traceId?: string):
  Promise<Array<{ id: number }>> =>
  query(
    'queryArgsById',
    `select
    id 
    from data_dict 
    WHERE data = $key`,
    { $key: key },
    { traceId: traceId }
  );

export const queryThreadStateArgsById = (id: number, traceId?: string):
  Promise<Array<{ argset: number; strValue: string }>> =>
  query(
    'queryThreadStateArgsById',
    `select
    A.argset,
    DD.data as strValue
    from 
    (select argset,value 
    from args where key = $id) as A left join data_dict as DD
    on DD.id = A.value
    `,
    { $id: id },
    { traceId: traceId }
  );

export const queryThreadWakeUp = (itid: number, startTime: number, dur: number):
  Promise<Array<WakeupBean>> =>
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
    { $itid: itid, $startTime: startTime, $dur: dur },
    { traceId: Utils.currentSelectTrace }
  );

export const getTabRunningPercent = (
  tIds: Array<number>,
  pIds: Array<number>,
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
            B.pid in (${pIds.join(',')})
          and
            not ((B.ts - TR.start_ts + ifnull(B.dur,0) < ${leftNS}) or (B.ts - TR.start_ts > ${rightNS}))
          order by ts
       `,
    {},
    { traceId: Utils.currentSelectTrace }
  );

//VM  Purgeable 点选 tab页
export const queryProcessPurgeableSelectionTab = (
  startNs: number,
  ipid: number,
  isPin?: boolean
): //@ts-ignore
  Promise<Array<unknown>> => {
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
): //@ts-ignore
  Promise<Array<unknown>> => {
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
        group_concat( ( CASE WHEN S.type = 1 THEN S.string_value ELSE S.int_value END ), ',' ) AS eventValue
        FROM
        trace_range AS TR,
        hisys_event_measure AS S
        LEFT JOIN data_dict AS D ON D.id = S.name_id
        LEFT JOIN app_name AS APP ON APP.id = S.key_id
        LEFT JOIN data_dict AS D2 ON D2.id = APP.app_key
        where
        D.data in ('POWER_IDE_CPU','POWER_IDE_LOCATION','POWER_IDE_GPU','POWER_IDE_DISPLAY',
        'POWER_IDE_CAMERA','POWER_IDE_BLUETOOTH','POWER_IDE_FLASHLIGHT','POWER_IDE_AUDIO',
        'POWER_IDE_WIFISCAN')
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
        group_concat( ( CASE WHEN S.type = 1 THEN S.string_value ELSE S.int_value END ), ',' ) AS eventValue
        FROM
        trace_range AS TR,
        hisys_event_measure AS S
        LEFT JOIN data_dict AS D1 ON D1.id = S.name_id
        LEFT JOIN app_name AS APP ON APP.id = S.key_id
        LEFT JOIN data_dict AS D2 ON D2.id = APP.app_key
        where
        D1.data in ('POWER_IDE_CPU','POWER_IDE_LOCATION','POWER_IDE_GPU','POWER_IDE_DISPLAY',
        'POWER_IDE_CAMERA','POWER_IDE_BLUETOOTH','POWER_IDE_FLASHLIGHT','POWER_IDE_AUDIO',
        'POWER_IDE_WIFISCAN')
        and
        D2.data in ('CHARGE','BACKGROUND_TIME','SCREEN_ON_TIME','SCREEN_OFF_TIME','LOAD','USAGE',
        'DURATION','CAMERA_ID','FOREGROUND_COUNT','BACKGROUND_COUNT','SCREEN_ON_COUNT',
        'SCREEN_OFF_COUNT','COUNT','UID','FOREGROUND_DURATION','FOREGROUND_ENERGY',
        'BACKGROUND_DURATION','BACKGROUND_ENERGY','SCREEN_ON_DURATION','SCREEN_ON_ENERGY',
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
        group_concat( ( CASE WHEN S.type = 1 THEN S.string_value ELSE S.int_value END ), ',' ) AS eventValue
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
        D.data in ('POWER_IDE_CPU','POWER_IDE_LOCATION','POWER_IDE_GPU','POWER_IDE_DISPLAY',
        'POWER_IDE_CAMERA','POWER_IDE_BLUETOOTH','POWER_IDE_FLASHLIGHT','POWER_IDE_AUDIO',
        'POWER_IDE_WIFISCAN')
        and
        D2.data in ('BACKGROUND_ENERGY','FOREGROUND_ENERGY','SCREEN_ON_ENERGY','SCREEN_OFF_ENERGY',
        'ENERGY','APPNAME')
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
): Promise<Array<unknown>> =>
  query<SelectionData>(
    'getTabSlices',
    `
    select
      c.name as name,
      c.id,
      sum(c.dur) as wallDuration,
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
    { $leftNS: leftNS, $rightNS: rightNS },
    { traceId: Utils.currentSelectTrace }
  );

export const getTabThreadStates = (
  tIds: Array<number>,
  leftNS: number,
  rightNS: number
): //@ts-ignore
  Promise<Array<unknown>> =>
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
  'ANOMALY_RUNNINGLOCK','ANORMALY_APP_ENERGY','ANOMALY_GNSS_ENERGY','ANOMALY_CPU_HIGH_FREQUENCY',
  'ANOMALY_CPU_ENERGY','ANOMALY_WAKEUP')
  and D2.data in ('APPNAME')
  and (S.ts - TR.start_ts) >= $leftNS
   and (S.ts - TR.start_ts) <= $rightNS
  group by S.serial,APP.app_key,D.data,D2.data
  union
  select
  S.ts,
  D.data as eventName,
  D2.data as appKey,
  group_concat((case when S.type = 1 then S.string_value else S.int_value end), ',') as Value
  from trace_range AS TR,hisys_event_measure as S
  left join data_dict as D on D.id = S.name_id
  left join app_name as APP on APP.id = S.key_id
  left join data_dict as D2 on D2.id = APP.app_key
  where D.data in ('ANOMALY_SCREEN_OFF_ENERGY', 'ANOMALY_ALARM_WAKEUP', 'ANOMALY_KERNEL_WAKELOCK',
  'ANOMALY_RUNNINGLOCK', 'ANORMALY_APP_ENERGY', 'ANOMALY_GNSS_ENERGY', 'ANOMALY_CPU_HIGH_FREQUENCY', 
  'ANOMALY_CPU_ENERGY', 'ANOMALY_WAKEUP')
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
                WHERE task_pool.task_id = $executeId AND task_pool.execute_itid = $itid;
    `;
  return query('queryBySelectExecute', sqlStr, { $executeId: executeId, $itid: itid });
};

export const queryDistributedRelationData = (traceId?: string): Promise<
  Array<{
    id: number;
    chainId: string;
    spanId: string;
    parentSpanId: string;
    chainFlag: string;
  }>
> => {
  let sqlStr = `SELECT 
                      c.id, 
                      c.chainId, 
                      c.spanId, 
                      c.parentSpanId, 
                      c.flag as chainFlag
                      FROM
                      callstack c
                      WHERE
                      c.chainId IS NOT NULL
                      AND c.spanId IS NOT NULL
                      AND c.parentSpanId IS NOT NULL;`;
  return query('queryDistributedRelationData', sqlStr, {}, { traceId: traceId });
};

export const queryDistributedRelationAllData = (
  chainId: string,
  traceId: string = ''
): Promise<
  Array<FuncStruct>
> => {
  let sqlStr = `SELECT
                      P.pid,
                      A.tid,
                      C.name as chainName,
                      C.chainId,
                      C.spanId,
                      C.parentSpanId,
                      C.flag as chainFlag,
                      C.depth,
                      (C.ts - r.start_ts) as ts,
                      c.dur,
                      $traceId as traceId
                  from callstack C, trace_range r
                      left join thread A on A.id = C.callid
                      left join process AS P on P.id = A.ipid
                      where C.chainId = $chainId;`;
  if (traceId === '') {
    return query('queryDistributedRelationAllData', sqlStr, { $chainId: chainId, $traceId: traceId });
  }
  return query('queryDistributedRelationAllData', sqlStr, { $chainId: chainId, $traceId: traceId }, { traceId: traceId });
};

export const sqlPrioCount = (args: unknown): Promise<unknown> =>
  query(
    'prioCount',
    `select 
      S.priority AS prio,
      COUNT(S.priority) as count
      from 
      sched_slice AS S
      left join
      process P on S.ipid = P.ipid
      left join
      thread T on S.itid = T.itid
      where T.tid = ${//@ts-ignore
    args.tid}
      and P.pid = ${//@ts-ignore
    args.pid}
      GROUP BY S.priority;`
  );

export const queryRunningThread = (
  pIds: Array<number>,
  tIds: Array<number>,
  leftStartNs: number,
  rightEndNs: number
): Promise<Array<unknown>> =>
  query(
    'getTabThread',
    `
            select
              P.pid,
              T.tid,
              S.itid,
              S.ts,
              P.name AS pName,
              ifnull(S.dur,0) + S.ts as endTs
            from
              sched_slice AS S
            left join
              process P on S.ipid = P.ipid
            left join
              thread T on S.itid = T.itid
            where
              T.tid in (${tIds.join(',')})
            and 
              P.pid in (${pIds.join(',')})
            and
              not ((S.ts + ifnull(S.dur,0) < $leftStartNs) or (S.ts > $rightEndNs))
            order by
              S.ts;
            `,
    { $leftStartNs: leftStartNs, $rightEndNs: rightEndNs }
  );

export const queryCoreRunningThread = (
  pIds: Array<number>,
  tIds: Array<number>,
  cpu: Array<number>,
  leftStartNs: number,
  rightEndNs: number
): Promise<Array<unknown>> =>
  query(
    'getTabThread',
    `
            select
              P.pid,
              T.tid,
              S.cpu,
              S.itid,
              S.ts,
              P.name AS pName,
              ifnull(S.dur,0) + S.ts as endTs
            from
              sched_slice AS S
            left join
              process P on S.ipid = P.ipid
            left join
              thread T on S.itid = T.itid
            where
              T.tid in (${tIds.join(',')})
            and 
              P.pid in (${pIds.join(',')})
            and
              S.cpu in (${cpu.join(',')})
            and
              not ((S.ts + ifnull(S.dur,0) < $leftStartNs) or (S.ts > $rightEndNs))
            order by
              S.ts;
            `,
    { $leftStartNs: leftStartNs, $rightEndNs: rightEndNs }
  );
