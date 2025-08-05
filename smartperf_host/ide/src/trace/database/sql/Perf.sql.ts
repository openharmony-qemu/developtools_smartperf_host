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
import { PerfCmdLine, PerfFile, PerfSample, PerfStack, PerfThread } from '../../bean/PerfProfile';
import { query } from '../SqlLite';
import { HiSysEventStruct } from '../ui-worker/ProcedureWorkerHiSysEvent';
import { TaskTabStruct } from '../../component/trace/sheet/task/TabPaneTaskFrames';
import { GpuCountBean, SearchGpuFuncBean } from '../../bean/GpufreqBean';

export const queryPerfFiles = (): Promise<Array<PerfFile>> =>
  query('queryPerfFiles', `select file_id as fileId,symbol,path from perf_files`, {});

export const queryPerfCallChainName = (): //@ts-ignore
Promise<Array<unknown>> => query('queryPerfCallChainName', `select callchain_id,depth,name from perf_callchain`, {});

export const queryPerfProcess = (): Promise<Array<PerfThread>> =>
  query(
    'queryPerfThread',
    `select process_id as pid,thread_name as processName from perf_thread where process_id = thread_id`,
    {}
  );

export const queryPerfThread = (): Promise<Array<PerfThread>> =>
  query(
    'queryPerfThread',
    `select a.thread_id as tid,
       a.thread_name as threadName,
       a.process_id as pid,
       b.thread_name as processName
from perf_thread a
         left join (select distinct process_id, thread_name from perf_thread where process_id = thread_id) b 
         on a.process_id = b.process_id
order by pid;`,
    {}
  );
export const queryPerfSampleListByTimeRange = (
  leftNs: number,
  rightNs: number,
  cpus: Array<number>,
  processes: Array<number>,
  threads: Array<number>,
  eventTypeId?: number
): Promise<Array<PerfSample>> => {
  let sql = `
select A.callchain_id as sampleId,
       A.thread_id as tid,
       C.thread_name as threadName,
       A.thread_state as state,
       C.process_id as pid,
       (timestamp_trace - R.start_ts) as time,
       cpu_id as core
from perf_sample A,trace_range R
left join perf_thread C on A.thread_id = C.thread_id
where time >= $leftNs and time <= $rightNs and A.thread_id != 0
    `;
  if (eventTypeId !== undefined) {
    sql = `${sql} and event_type_id = ${eventTypeId}`;
  }
  if (cpus.length !== 0 || processes.length !== 0 || threads.length !== 0) {
    let arg1 = cpus.length > 0 ? `or core in (${cpus.join(',')}) ` : '';
    let arg2 = processes.length > 0 ? `or pid in (${processes.join(',')}) ` : '';
    let arg3 = threads.length > 0 ? `or tid in (${threads.join(',')})` : '';
    let arg = `${arg1}${arg2}${arg3}`.substring(3);
    sql = `${sql} and (${arg})`;
  }
  return query('queryPerfSampleListByTimeRange', sql, {
    $leftNs: leftNs,
    $rightNs: rightNs,
  });
};

export const queryPerfSampleChildListByTree = (
  leftNs: number,
  rightNs: number,
  pid?: number,
  tid?: number,
): Promise<Array<PerfSample>> => {
  let sql = `
select A.callchain_id as sampleId,
       A.thread_id as tid,
       C.thread_name as threadName,
       A.thread_state as state,
       C.process_id as pid,
       (timestamp_trace - R.start_ts) as time,
       cpu_id as core
from perf_sample A,trace_range R
left join perf_thread C on A.thread_id = C.thread_id
where time >= $leftNs and time <= $rightNs and A.thread_id != 0
    `;
  if (pid) {
    sql = `${sql} and C.process_id = ${pid}`;
  }
  if (pid && tid !== undefined) {
    sql = `${sql} and A.thread_id = ${tid}`;
  }
  return query('queryPerfSampleChildListByTree', sql, {
    $leftNs: leftNs,
    $rightNs: rightNs,
  });
};

export const queryPerfSampleIdsByTimeRange = (
  leftNs: number,
  rightNs: number,
  cpus: Array<number>,
  processes: Array<number>,
  threads: Array<number>
): Promise<Array<PerfSample>> => {
  let sql = `
select A.callchain_id as sampleId 
from perf_sample A,trace_range R
left join perf_thread C on A.thread_id = C.thread_id
where (timestamp_trace - R.start_ts) >= $leftNs and (timestamp_trace - R.start_ts) <= $rightNs and A.thread_id != 0 
    `;
  if (cpus.length !== 0 || processes.length !== 0 || threads.length !== 0) {
    let arg1 = cpus.length > 0 ? `or A.cpu_id in (${cpus.join(',')}) ` : '';
    let arg2 = processes.length > 0 ? `or C.process_id in (${processes.join(',')}) ` : '';
    let arg3 = threads.length > 0 ? `or A.thread_id in (${threads.join(',')})` : '';
    let arg = `${arg1}${arg2}${arg3}`.substring(3);
    sql = `${sql} and (${arg})`;
  }
  return query('queryPerfSampleIdsByTimeRange', sql, {
    $leftNs: leftNs,
    $rightNs: rightNs,
  });
};

export const queryPerfSampleCallChain = (sampleId: number): Promise<Array<PerfStack>> =>
  query(
    'queryPerfSampleCallChain',
    `
    select
    callchain_id as callChainId,
    callchain_id as sampleId,
    file_id as fileId,
    symbol_id as symbolId,
    vaddr_in_file as vaddrInFile,
    source_file_id as sourceId,
    line_number as lineNumber,
    name as symbol
from perf_callchain where callchain_id = $sampleId;
    `,
    { $sampleId: sampleId }
  );

export const queryPerfCmdline = (): Promise<Array<PerfCmdLine>> =>
  query(
    'queryPerfCmdline',
    `
    select report_value from perf_report  where report_type = 'cmdline'
    `,
    {}
  );
export const queryPerfEventType = (): Promise<Array<{ id: number; report: string }>> =>
  query(
    'queryPerfEventType',
    `
    select id,report_value as report from perf_report where id in (
select distinct event_type_id from perf_sample);
    `,
    {}
  );
/**
 * HiPerf
 */
export const queryHiPerfEventList = (): //@ts-ignore
Promise<Array<unknown>> =>
  query('queryHiPerfEventList', `select id,report_value from perf_report where report_type='config_name'`, {});
export const queryHiPerfEventListData = (
  eventTypeId: number
): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'queryHiPerfEventListData',
    `
        select s.callchain_id,
               (s.timestamp_trace-t.start_ts) startNS 
        from perf_sample s,trace_range t 
        where 
            event_type_id=${eventTypeId} 
            and s.thread_id != 0
            and s.callchain_id != -1;
`,
    { $eventTypeId: eventTypeId }
  );
export const queryHiPerfEventData = (
  eventTypeId: number,
  cpu: number
): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'queryHiPerfEventList',
    `
    select s.callchain_id,
        (s.timestamp_trace-t.start_ts) startNS 
    from perf_sample s,trace_range t 
    where
        event_type_id=${eventTypeId} 
        and cpu_id=${cpu} 
        and s.thread_id != 0
        and s.callchain_id != -1;
`,
    { $eventTypeId: eventTypeId, $cpu: cpu }
  );
export const queryHiPerfCpuData = (
  cpu: number
): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'queryHiPerfCpuData',
    `
    select s.callchain_id,
        (s.timestamp_trace-t.start_ts) startNS, event_count, event_type_id 
    from perf_sample s,trace_range t 
    where 
        cpu_id=${cpu} 
        and s.thread_id != 0;`,
    { $cpu: cpu }
  );
export const queryHiPerfCpuMergeData = (): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'queryHiPerfCpuData',
    `select s.callchain_id,(s.timestamp_trace-t.start_ts) startNS, event_count, event_type_id from perf_sample s,trace_range t 
where s.thread_id != 0;`,
    {}
  );
export const queryHiPerfCpuMergeData2 = (): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'queryHiPerfCpuData2',
    `select distinct cpu_id from perf_sample where thread_id != 0 order by cpu_id desc;`,
    {}
  );

export const queryHiPerfProcessData = (
  pid: number
): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'queryHiPerfProcessData',
    `
SELECT sp.callchain_id,
       th.thread_name,
       th.thread_id                     tid,
       th.process_id                    pid,
       sp.timestamp_trace - tr.start_ts startNS,
       event_count,
       event_type_id
from perf_sample sp,
     trace_range tr
         left join perf_thread th on th.thread_id = sp.thread_id
where pid = ${pid} and sp.thread_id != 0 `,
    { $pid: pid }
  );

export const queryHiPerfThreadData = (
  tid: number
): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'queryHiPerfThreadData',
    `
SELECT sp.callchain_id,
       th.thread_name,
       th.thread_id                     tid,
       th.process_id                    pid,
       sp.timestamp_trace - tr.start_ts startNS, 
       event_count,
       event_type_id
from perf_sample sp,
     trace_range tr
         left join perf_thread th on th.thread_id = sp.thread_id
where tid = ${tid} and sp.thread_id != 0 ;`,
    { $tid: tid }
  );

export const getGpufreqDataCut = (
  tIds: string,
  funcName: string,
  leftNS: number,
  rightNS: number,
  single: boolean,
  loop: boolean
): Promise<Array<SearchGpuFuncBean>> => {
  let queryCondition: string = '';
  if (single) {
    queryCondition += `select s.funName,s.startTime,s.dur,s.startTime+s.dur as endTime,s.tid,s.threadName,s.pid from state s 
            where endTime between ${leftNS} and ${rightNS}`;
  }
  if (loop) {
    queryCondition += `select s.funName,s.startTime,s.loopEndTime-s.startTime as dur,s.loopEndTime as endTime,s.tid,s.threadName,s.pid from state s 
            where endTime between ${leftNS} and ${rightNS} `;
  }
  return query(
    'getGpufreqDataCut',
    `
            with state as
              (select 
                 * 
              from
                 (select
                    c.name as funName,
                    c.ts - r.start_ts as startTime,
                    c.dur,
                    lead(c.ts - r.start_ts, 1, null) over( order by c.ts - r.start_ts) loopEndTime,
                    t.tid,
                    t.name as threadName,
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
                    tid = '${tIds}' 
                 and 
                    startTime between ${leftNS} and ${rightNS}))
             ${queryCondition}  
          `,
    { $search: funcName }
  );
};
export const getGpufreqData = (leftNS: number, rightNS: number, earliest: boolean): Promise<Array<GpuCountBean>> => {
  let queryCondition: string = '';
  if (!earliest) {
    queryCondition += ` where  not  ((s.ts - r.start_ts + ifnull(s.dur,0) < ${leftNS}) or (s.ts - r.start_ts > ${rightNS}))`;
  }
  return query(
    'getGpufreqData',
    `
            with state as 
              (select 
                 name,
                 filter_id, 
                 ts, 
                 endts, 
                 endts-ts as dur, 
                 value as val
               from
                  (select 
                     measure.filter_id,
                     clock_event_filter.name, 
                     measure.ts, 
                     lead(ts, 1, null) over( order by measure.ts) endts, 
                     measure.value 
                  from 
                     clock_event_filter,
                     trace_range
                  left join 
                     measure
                  where 
                     clock_event_filter.name = 'gpufreq' 
                  and 
                     clock_event_filter.type = 'clock_set_rate' 
                  and
                     clock_event_filter.id = measure.filter_id
                  order by measure.ts)
               where 
                  endts is not null
               )
            select 
                s.name as thread,
                s.val/1000000 as freq,
                s.val*s.dur as value,
                s.val,
                s.ts-r.start_ts as startNS,
                s.dur,
                s.endts- r.start_ts as endTime
            from 
                state s,
                trace_range r 
            ${queryCondition} 
            order by ts
          `,
    { $leftNS: leftNS, $rightNS: rightNS }
  );
};

export const queryHiSysEventTabData = (leftNs: number, rightNs: number): Promise<Array<HiSysEventStruct>> =>
  query(
    'queryHiSysEventTabData',
    `SELECT S.id,
            D2.data AS domain, 
            D.data AS eventName, 
            type AS eventType, 
            time_zone AS tz, 
            pid,
            tid,
            uid,
            info,
            level,
            seq,
            contents,
            S.ts - TR.start_ts AS startTs,
            1 AS dur,
            CASE
            WHEN level = 'MINOR' THEN
             0
            WHEN level = 'CRITICAL' THEN
             1
            END AS depth
        FROM hisys_all_event AS S ,trace_range AS TR
        LEFT JOIN data_dict AS D on S.event_name_id = D.id
        LEFT JOIN data_dict AS D2 on S.domain_id = D2.id
        WHERE S.id is not null
         and    startTs >= ${Math.floor(leftNs)}
         and    startTs <= ${Math.floor(rightNs)}
        ORDER BY S.ts`
  );
export const queryHiSysEventData = (): Promise<Array<HiSysEventStruct>> =>
  query(
    'queryHiSysEventData',
    `SELECT l.ts - tr.start_ts as startNs  FROM hisys_all_event AS l, trace_range tr WHERE startNs  > 0 LIMIT 1`
  );
export const queryHiPerfProcessCount = (
  leftNs: number,
  rightNs: number,
  cpus: Array<number>,
  threads: Array<number>,
  processes: Array<number>
): //@ts-ignore
Promise<Array<unknown>> => {
  let str = '';
  if (processes.length > 0) {
    str = ` and C.process_id in (${processes.join(',')})`;
  }
  if (threads.length > 0) {
    str = ` and A.thread_id in (${threads.join(',')}) `;
  }
  if (processes.length > 0 && threads.length > 0) {
    str = ` and (C.process_id in (${processes.join(',')}) or A.thread_id in (${threads.join(',')}))`;
  }
  if (cpus.length > 0) {
    str = ` and A.cpu_id in (${cpus.join(',')})`;
  }
  if (cpus.length > 0 && processes.length > 0) {
    str = ` and (C.process_id in (${processes.join(',')}) or A.cpu_id in (${cpus.join(',')}))`;
  }
  return query(
    'queryHiPerfProcessCount',
    `
    select     C.process_id as pid,
               (A.timestamp_trace - R.start_ts) as time,
               C.thread_name as threadName,
               A.thread_id as tid,
               A.id,
               A.callchain_id
        from perf_sample A,trace_range R
             left join perf_thread C on A.thread_id = C.thread_id  and  A.thread_id != 0
        where time >= $leftNs and time <= $rightNs and A.callchain_id > 0
        ${str} 
    `,
    { $leftNs: leftNs, $rightNs: rightNs }
  );
};
export const queryTransferList = (): Promise<Array<{ id: number; cmdStr: string }>> =>
  query('queryTransferList', `select id, report_value as cmdStr from perf_report where report_type = 'config_name'`);
export const queryConcurrencyTask = (
  itid: number,
  selectStartTime: number,
  selectEndTime: number
): Promise<TaskTabStruct[]> =>
  query<TaskTabStruct>(
    'queryConcurrencyTask',
    `SELECT thread.tid,
            thread.ipid,
            callstack.name                AS funName,
            callstack.ts                  AS startTs,
            (case when callstack.dur = -1 then (SELECT end_ts FROM trace_range) else callstack.dur end) as dur,
            callstack.id,
            task_pool.priority,
            task_pool.allocation_task_row AS allocationTaskRow,
            task_pool.execute_task_row    AS executeTaskRow,
            task_pool.return_task_row     AS returnTaskRow,
            task_pool.task_id             AS executeId
     FROM thread
            LEFT JOIN callstack ON thread.id = callstack.callid
            LEFT JOIN task_pool ON callstack.id = task_pool.execute_task_row
     WHERE ipid in (SELECT thread.ipid
                   FROM thread
                   WHERE thread.itid = $itid)
       AND thread.name LIKE '%TaskWork%'
       AND callstack.name LIKE 'H:Task Perform:%'
       AND -- 左包含
           (($selectStartTime <= callstack.ts AND $selectEndTime > callstack.ts)
        OR -- 右包含
       ($selectStartTime < callstack.ts + callstack.dur AND $selectEndTime >= callstack.ts + callstack.dur)
        OR -- 包含
       ($selectStartTime >= callstack.ts AND $selectEndTime <= callstack.ts +
        (case when callstack.dur = -1 then (SELECT end_ts FROM trace_range) else callstack.dur end))
        OR -- 被包含
       ($selectStartTime <= callstack.ts AND $selectEndTime >= callstack.ts + callstack.dur))
     ORDER BY callstack.ts;`,
    { $itid: itid, $selectStartTime: selectStartTime, $selectEndTime: selectEndTime }
  );
