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
import { FpsStruct } from '../ui-worker/ProcedureWorkerFPS';
import { Counter, Fps } from '../../bean/BoxSelection';
import { NativeEvent, NativeEventHeap } from '../../bean/NativeHook';
import { HeapTreeDataBean } from '../logic-worker/ProcedureLogicWorkerCommon';
import { EnergyAnomalyStruct } from '../ui-worker/ProcedureWorkerEnergyAnomaly';
import { SystemDetailsEnergy } from '../../bean/EnergyStruct';
import { EnergyStateStruct } from '../ui-worker/ProcedureWorkerEnergyState';
import { FileInfo } from '../../../js-heap/model/UiStruct';
import { HeapEdge, HeapLocation, HeapNode, HeapSample } from '../../../js-heap/model/DatabaseStruct';
import { TaskTabStruct } from '../../component/trace/sheet/task/TabPaneTaskFrames';
import type { FrameAnimationStruct } from '../ui-worker/ProcedureWorkerFrameAnimation';
import type { FrameDynamicStruct } from '../ui-worker/ProcedureWorkerFrameDynamic';
import type { FrameSpacingStruct } from '../ui-worker/ProcedureWorkerFrameSpacing';
import type { DeviceStruct } from '../../bean/FrameComponentBean';
import { LogStruct } from '../ui-worker/ProcedureWorkerLog';
import { query } from '../SqlLite';
import { Utils } from '../../component/trace/base/Utils';

export const queryEventCountMap = (
  traceId?: string
): Promise<
  Array<{
    eventName: string;
    count: number;
  }>
> =>
  query(
    'queryEventCountMap',
    `select 
  event_name as eventName,
  count 
  from stat where stat_type = 'received';`,
    {},
    { traceId: traceId }
  );

export const queryTotalTime = (
  traceId?: string
): Promise<Array<{ total: number; recordStartNS: number; recordEndNS: number }>> =>
  query(
    'queryTotalTime',
    `select start_ts as recordStartNS,end_ts as recordEndNS,end_ts-start_ts as total
    from
      trace_range;`,
    {},
    { traceId: traceId }
  );
export const getFps = (): Promise<FpsStruct[]> =>
  query<FpsStruct>(
    'getFps',
    `
    select
      distinct(ts-tb.start_ts) as startNS, fps
    from
      hidump c ,trace_range tb
    where
      startNS >= 0
    --order by startNS;
    `,
    {}
  );

export const getTabFps = (leftNs: number, rightNs: number): Promise<Array<Fps>> =>
  query<Fps>(
    'getTabFps',
    `
    select
      distinct(ts-tb.start_ts) as startNS,
      fps
    from
      hidump c,
      trace_range tb
    where
      startNS <= $rightNS
    and
      startNS >= 0
    --order by startNS;
    `,
    { $leftNS: leftNs, $rightNS: rightNs }
  );

export const getTabVirtualCounters = (virtualFilterIds: Array<number>, startTime: number): Promise<Counter[]> =>
  query<Counter>(
    'getTabVirtualCounters',
    `
    select
      table1.filter_id as trackId,
      table2.name,
      value,
      table1.ts - table3.start_ts as startTime
    from
      sys_mem_measure table1
    left join
      sys_event_filter table2
    on
      table1.filter_id = table2.id
    left join
      trace_range table3
    where
      filter_id in (${virtualFilterIds.join(',')})
    and
      startTime <= $startTime
    `,
    { $startTime: startTime }
  );

export const queryAllSoInitNames = (): //@ts-ignore
Promise<Array<unknown>> => {
  return query(
    'queryAllSoInitNames',
    `
        select id,so_name as name from static_initalize;`
  );
};

export const queryAllSrcSlices = (): //@ts-ignore
Promise<Array<unknown>> => {
  return query(
    'queryAllSrcSlices',
    `
        select src,id from frame_slice;`
  );
};

/*-------------------------------------------------------------------------------------*/
export const queryHeapGroupByEvent = (type: string): Promise<Array<NativeEventHeap>> => {
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
  return query('queryHeapGroupByEvent', type === 'native_hook' ? sql1 : sql2, {});
};

export const queryAllHeapByEvent = (): Promise<Array<NativeEvent>> =>
  query(
    'queryAllHeapByEvent',
    `
    select * from (
      select h.start_ts - t.start_ts as startTime,
       h.heap_size as heapSize,
       h.event_type as eventType
from native_hook h ,trace_range t
where h.start_ts >= t.start_ts and h.start_ts <= t.end_ts
and (h.event_type = 'AllocEvent' or h.event_type = 'MmapEvent')
union
select h.end_ts - t.start_ts as startTime,
       h.heap_size as heapSize,
       (case when h.event_type = 'AllocEvent' then 'FreeEvent' else 'MunmapEvent' end) as eventType
from native_hook h ,trace_range t
where h.start_ts >= t.start_ts and h.start_ts <= t.end_ts
and (h.event_type = 'AllocEvent' or h.event_type = 'MmapEvent')
and h.end_ts not null ) order by startTime;
`,
    {}
  );

export const queryHeapAllData = (
  startTs: number,
  endTs: number,
  ipids: Array<number>
): Promise<Array<HeapTreeDataBean>> =>
  query(
    'queryHeapAllData',
    `
    select
      h.start_ts - t.start_ts as startTs,
      h.end_ts - t.start_ts as endTs,
      h.heap_size as heapSize,
      h.event_type as eventType,
      h.callchain_id as eventId
    from
      native_hook h
    inner join
      trace_range  t
    where
      event_type = 'AllocEvent'
    and
      ipid in (${ipids.join(',')})
    and
      (h.start_ts - t.start_ts between ${startTs} and ${endTs} 
      or h.end_ts - t.start_ts between ${startTs} and ${endTs})`,
    { ipids: ipids, $startTs: startTs, $endTs: endTs }
  );

export const querySelectTraceStats = (): Promise<
  Array<{
    event_name: string;
    stat_type: string;
    count: number;
    source: string;
    serverity: string;
  }>
> => query('querySelectTraceStats', 'select event_name,stat_type,count,source,serverity from stat');

export const queryCustomizeSelect = (
  sql: string
): //@ts-ignore
Promise<Array<unknown>> => query('queryCustomizeSelect', sql);

export const queryDistributedTerm = (): Promise<
  Array<{
    threadId: string;
    threadName: string;
    processId: string;
    processName: string;
    funName: string;
    dur: string;
    ts: string;
    chainId: string;
    spanId: string;
    parentSpanId: string;
    flag: string;
    trace_name: string;
  }>
> =>
  query(
    'queryDistributedTerm',
    `
    select
      group_concat(thread.id,',') as threadId,
      group_concat(thread.name,',') as threadName,
      group_concat(process.id,',') as processId,
      group_concat(process.name,',') as processName,
      group_concat(callstack.name,',') as funName,
      group_concat(callstack.dur,',') as dur,
      group_concat(callstack.ts,',') as ts,
      cast(callstack.chainId as varchar) as chainId,
      callstack.spanId as spanId,
      callstack.parentSpanId as parentSpanId,
      group_concat(callstack.flag,',') as flag,
      (select
        value
      from
        meta
      where
        name='source_name') as trace_name
      from
        callstack
      inner join thread on callstack.callid = thread.id
      inner join process on process.id = thread.ipid
      where (callstack.flag='S' or callstack.flag='C')
      group by callstack.chainId,callstack.spanId,callstack.parentSpanId`
  );
export const queryTraceTaskName = (): Promise<
  Array<{
    id: string;
    pid: string;
    process_name: string;
    thread_name: string;
  }>
> =>
  query(
    'queryTraceTaskName',
    `
    select
        P.id as id,
        P.pid as pid,
        P.name as process_name,
        group_concat(T.name,',') as thread_name
    from process as P left join thread as T where P.id = T.ipid
    group by pid`
  );

export const queryTraceMetaData = (): Promise<
  Array<{
    name: string;
    valueText: string;
  }>
> =>
  query(
    'queryTraceMetaData',
    `
    select
        cast(name as varchar) as name,
        cast(value as varchar) as valueText 
        from meta
        UNION
        select 'start_ts',cast(start_ts as varchar) from trace_range
        UNION
        select 'end_ts',cast(end_ts as varchar) from trace_range`
  );

export const querySystemCalls = (): Promise<
  Array<{
    frequency: string;
    minDur: number;
    maxDur: number;
    avgDur: number;
    funName: string;
  }>
> =>
  query(
    'querySystemCalls',
    `
    select
      count(*) as frequency,
      min(dur) as minDur,
      max(dur) as maxDur,
      avg(dur) as avgDur,
      name as funName
    from
      callstack
      group by name
      order by
    frequency desc limit 100`
  );

export const queryNetWorkMaxData = (): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'queryNetWorkMaxData',
    `select 
     ifnull(max(tx_speed),0) as maxIn, 
     ifnull(max(rx_speed),0) as maxOut,
     ifnull(max(packet_in_sec),0) as maxPacketIn,
     ifnull(max(packet_in_sec),0) as maxPacketOut
     from network`
  );

export const queryDiskIoMaxData = (): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'queryDiskIoMaxData',
    `select
    ifnull(max(rd_speed),0) as bytesRead, 
    ifnull(max(wr_speed),0) as bytesWrite,
    ifnull(max(rd_count_speed),0) as readOps,
    ifnull(max(wr_count_speed),0)  as writeOps
    from diskio`
  );
//@ts-ignore
export const queryStartTime = (): Promise<Array<unknown>> =>
  query('queryStartTime', 'SELECT start_ts FROM trace_range');
//@ts-ignore
export const queryRangeTime = (): Promise<Array<unknown>> =>
  query('queryRangeTime', `SELECT start_ts, end_ts FROM trace_range`);

export const queryBinderBySliceId = (
  id: number
): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'queryBinderBySliceId',
    `SELECT 
    c.ts - D.start_ts AS startTs,
    c.dur,
    t.tid,
    p.pid,
    c.depth,
    c.argsetid,
    c.name AS funName,
    c.cookie 
  FROM
    callstack c,
    trace_range D
    LEFT JOIN thread t ON c.callid = t.id
    LEFT JOIN process p ON p.id = t.ipid 
  WHERE
    cat = 'binder' and c.id = $id;`,
    { $id: id },
    { traceId: Utils.currentSelectTrace }
  );

export const queryThreadByItid = (
  itid: number,
  ts: number
): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'queryThreadByItid',
    `SELECT 
      tid,
      pid,
      c.dur,
      c.depth,
      c.name 
    FROM
      thread t
      LEFT JOIN process p ON t.ipid = p.ipid
      LEFT JOIN callstack c ON t.itid = c.callid
    WHERE itid = $itid and c.ts = $ts;`,
    { $itid: itid, $ts: ts }
  );
export const queryBinderByArgsId = (
  id: number,
  startTime: number,
  isNext: boolean
): //@ts-ignore
Promise<Array<unknown>> => {
  let sql = `select c.ts - D.start_ts as startTs,
    c.dur,
    t.tid,
    p.pid,
    c.depth,
    c.argsetid,
      c.name as funName,
      c.cookie
    from callstack c,trace_range D
    left join thread t on c.callid = t.id
    left join process p on p.id = t.ipid
where cat = 'binder' and  c.argsetid = $id`;
  if (isNext) {
    sql += ' and c.ts > $startTime +  D.start_ts';
  } else {
    sql += ' and c.ts < $startTime +  D.start_ts';
  }
  return query('queryBinderByArgsId', sql, { $id: id, $startTime: startTime},
    { traceId : Utils.currentSelectTrace }
  );
};

export const getTabPaneFilesystemStatisticsFather = (
  leftNs: number,
  rightNs: number
): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'getTabPaneFilesystemStatisticsFather',
    `
    select SUM(dur) as allDuration,
    count(f.type) as count,
    min(dur) as minDuration,
    max(dur) as maxDuration,
    round(avg(dur),2) as avgDuration,
    p.name,
    f.type,
    p.pid,
    sum(ifnull(size,0)) as size
    from file_system_sample as f
    left join process as p on f.ipid=p.ipid
    where f.start_ts >= $leftNs
    and end_ts <= $rightNs
    group by f.type;
    `,
    { $leftNs: leftNs, $rightNs: rightNs }
  );

export const getTabPaneFilesystemStatisticsChild = (
  leftNs: number,
  rightNs: number
): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'getTabPaneFilesystemStatisticsChild',
    `
    select SUM(dur)    as allDuration,
        count(f.type) as count,
        min(dur)    as minDuration,
        max(dur)    as maxDuration,
        round(avg(dur),2)    as avgDuration,
        p.name,
        p.pid,
        f.type,
        sum(ifnull(size,0))    as size
        from file_system_sample as f left join process as p on f.ipid=p.ipid
        where f.start_ts >= $leftNs
        and end_ts <= $rightNs
        group by f.type, f.ipid;
`,
    { $leftNs: leftNs, $rightNs: rightNs }
  );

export const getTabPaneFilesystemStatisticsAll = (
  leftNs: number,
  rightNs: number
): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'getTabPaneFilesystemStatisticsAll',
    `
    select SUM(dur)    as allDuration,
       count(type) as count,
       min(dur)    as minDuration,
       max(dur)    as maxDuration,
       round(avg(dur),2)    as avgDuration,
       type
    from file_system_sample
    where start_ts <= $rightNs
    and end_ts >= $leftNs;
`,
    { $leftNs: leftNs, $rightNs: rightNs }
  );

export const getTabPaneFilesystemStatistics = (
  leftNs: number,
  rightNs: number,
  types: number[]
): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'getTabPaneFilesystemStatistics',
    `
    select p.pid,
       ifnull(p.name,'Process') as name,
       f.type,
       count(f.ipid) as count,
       sum(ifnull(size,0)) as size,
       sum(case when f.type = 2 then ifnull(size,0) else 0 end) as logicalReads,
       sum(case when f.type = 3 then ifnull(size,0) else 0 end) as logicalWrites,
       sum(case when f.type != 2 and f.type != 3 then ifnull(size,0) else 0 end) as otherFile,
       sum(dur) as allDuration,
       min(dur) as minDuration,
       max(dur) as maxDuration,
       avg(dur) as avgDuration
    from file_system_sample as f left join process as p on f.ipid=p.ipid
    where f.end_ts >= $leftNs
    and f.start_ts <= $rightNs
    and f.type in (${types.join(',')})
    group by f.type,f.ipid
    order by f.type;
`,
    { $leftNs: leftNs, $rightNs: rightNs }
  );

export const getTabPaneIOTierStatisticsData = (
  leftNs: number,
  rightNs: number,
  diskIOipids: Array<number>
): //@ts-ignore
Promise<Array<unknown>> => {
  let str = '';
  if (diskIOipids.length > 0) {
    str = ` and i.ipid in (${diskIOipids.join(',')})`;
  }
  return query(
    'getTabPaneIOTierStatisticsData',
    `
    select p.pid,
       ifnull(p.name,'Process') as pname,
       i.tier,
       i.ipid,
       path_id as path,
       count(i.ipid) as count,
       sum(latency_dur) as allDuration,
       min(latency_dur) as minDuration,
       max(latency_dur) as maxDuration,
       avg(latency_dur) as avgDuration
    from bio_latency_sample as i left join process as p on i.ipid=p.ipid
    where i.end_ts+latency_dur >= $leftNs
    and i.start_ts+latency_dur <= $rightNs
    ${str}
    group by i.tier,i.ipid,i.path_id
    order by i.tier;
`,
    { $leftNs: leftNs, $rightNs: rightNs }
  );
};

export const getTabPaneFrequencySampleData = (
  leftNs: number,
  rightNs: number,
  cpuFreqFilterIds: Array<number>
): //@ts-ignore
Promise<Array<unknown>> => {
  let str = '';
  if (cpuFreqFilterIds.length > 0) {
    str = ` and filter_id in (${cpuFreqFilterIds.join(',')})`;
  }
  return query(
    'getTabPaneFrequencySampleData',
    `
    select value, filter_id as filterId, ts, f.cpu
    from measure left join cpu_measure_filter as f on f.id=filter_id
    where
    ts <= $rightNs${str} order by ts asc;
`,
    { $leftNs: leftNs, $rightNs: rightNs }, {traceId: Utils.currentSelectTrace}
  );
};

export const getFileSysChartDataByType = (
  type: number
): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'getFileSysChartData',
    `
    select
       (A.start_ts -B.start_ts) as startNS,
       (A.end_ts - B.start_ts) as endNS,
       dur
    from file_system_sample A,trace_range B
    where type = $type and startNS > 0;`,
    { $type: type }
  );

export const getDiskIOProcess = (): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'getDiskIOProcess',
    `
    select name,B.ipid,pid
    from (select distinct ipid from bio_latency_sample A,trace_range B 
    where A.start_ts between B.start_ts and B.end_ts) A
    left join process B on A.ipid = B.ipid;`,
    {}
  );

export const getDiskIOLatencyChartDataByProcess = (
  all: boolean,
  ipid: number,
  typeArr: Array<number>
): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'getDiskIOLatencyChartDataByProcess',
    `
    select
       (A.start_ts -B.start_ts) as startNS,
       (A.start_ts - B.start_ts + A.latency_dur) as endNS,
       latency_dur as dur
    from bio_latency_sample A,trace_range B
    where type in (${typeArr.join(',')}) and startNS > 0
        ${all ? '' : 'and ipid = ' + ipid}
    order by A.start_ts;`,
    {}
  );

export const queryAnomalyData = (): Promise<Array<EnergyAnomalyStruct>> =>
  query(
    'queryAnomalyData',
    `select 
       S.id,
      (S.ts - TR.start_ts) as startNS,
      D.data as eventName,
      D2.data as appKey, 
      (case when S.type==1 then group_concat(S.string_value,',') else group_concat(S.int_value,',') 
      end) as Value
      from trace_range AS TR,hisys_event_measure as S 
      left join data_dict as D on D.id=S.name_id 
      left join app_name as APP on APP.id=S.key_id 
      left join data_dict as D2 on D2.id=APP.app_key
      where D.data in ('ANOMALY_SCREEN_OFF_ENERGY','ANOMALY_KERNEL_WAKELOCK',
      'ANOMALY_CPU_HIGH_FREQUENCY','ANOMALY_WAKEUP')
     or (D.data in ('ANOMALY_RUNNINGLOCK','ANORMALY_APP_ENERGY','ANOMALY_GNSS_ENERGY',
     'ANOMALY_CPU_ENERGY','ANOMALY_ALARM_WAKEUP') and D2.data in ("APPNAME")) 
      group by S.serial,D.data`
  );

export const querySystemLocationData = (): Promise<
  Array<{
    ts: string;
    eventName: string;
    appKey: string;
    Value: string;
  }>
> =>
  query(
    'querySystemLocationData',
    `SELECT
        ( S.ts - TR.start_ts ) AS ts,
        D.data AS eventName,
        D2.data AS appKey,
        group_concat( ( CASE WHEN S.type == 1 THEN S.string_value ELSE S.int_value END ), ',' ) AS Value 
        FROM
        trace_range AS TR,
        hisys_event_measure AS S
        LEFT JOIN data_dict AS D ON D.id = S.name_id
        LEFT JOIN app_name AS APP ON APP.id = S.key_id
        LEFT JOIN data_dict AS D2 ON D2.id = APP.app_key 
        WHERE
        D.data = 'GNSS_STATE' AND D2.data = 'STATE'
        GROUP BY
        S.serial,
        APP.app_key,
        D.data,
        D2.data;`
  );

export const querySystemLockData = (): Promise<
  Array<{
    ts: string;
    eventName: string;
    appKey: string;
    Value: string;
  }>
> =>
  query(
    'querySystemLockData',
    `SELECT
        ( S.ts - TR.start_ts ) AS ts,
        D.data AS eventName,
        D2.data AS appKey,
        group_concat(( CASE WHEN S.type == 1 THEN S.string_value ELSE S.int_value END ), ',' ) AS Value 
        FROM
        trace_range AS TR,
        hisys_event_measure AS S
        LEFT JOIN data_dict AS D ON D.id = S.name_id
        LEFT JOIN app_name AS APP ON APP.id = S.key_id
        LEFT JOIN data_dict AS D2 ON D2.id = APP.app_key 
        WHERE
        ( D.data = 'POWER_RUNNINGLOCK' AND D2.data in ('TAG','MESSAGE')) 
        GROUP BY
        S.serial;`
  );

export const querySystemAllData = (): Promise<
  Array<{
    id: number;
    eventName: string;
    eventValue: string;
  }>
> =>
  query(
    'querySystemAllData',
    `SELECT
      S.id,
      D.data AS eventName,
      contents AS eventValue
     FROM
      trace_range AS TR,
      hisys_all_event AS S
          LEFT JOIN data_dict AS D ON S.event_name_id = D.id
          LEFT JOIN data_dict AS D2 ON S.domain_id = D2.id
     WHERE
       eventName IN ( 'POWER_RUNNINGLOCK', 'GNSS_STATE', 'WORK_REMOVE', 'WORK_STOP', 'WORK_ADD' );`
  );

export const querySystemSchedulerData = (): Promise<
  Array<{
    startNs: string;
    eventName: string;
    appKey: string;
    Value: string;
  }>
> =>
  query(
    'querySystemSchedulerData',
    `SELECT
      ( S.ts - TR.start_ts ) AS startNs,
      D.data AS eventName,
      group_concat(D2.data, ',') AS appKey,
      group_concat( ( CASE WHEN S.type == 1 THEN S.string_value ELSE S.int_value END ), ',' ) AS Value 
      FROM
      trace_range AS TR,
      hisys_event_measure AS S
      LEFT JOIN data_dict AS D ON D.id = S.name_id
      LEFT JOIN app_name AS APP ON APP.id = S.key_id
      LEFT JOIN data_dict AS D2 ON D2.id = APP.app_key 
      WHERE
      D.data IN ( 'WORK_REMOVE', 'WORK_STOP', 'WORK_ADD' ) AND D2.data in ('NAME','TYPE','WORKID') 
      GROUP BY
      S.serial;`
  );

export const querySystemDetailsData = (rightNs: number, eventName: string): Promise<Array<SystemDetailsEnergy>> =>
  query(
    'querySystemDetailsData',
    `SELECT
        ( S.ts - TR.start_ts ) AS ts,
        D.data AS eventName,
        D2.data AS appKey,
        group_concat( ( CASE WHEN S.type == 1 THEN S.string_value ELSE S.int_value END ), ',' ) AS appValue
    FROM
        trace_range AS TR,
        hisys_event_measure AS S
        LEFT JOIN data_dict AS D ON D.id = S.name_id
        LEFT JOIN app_name AS APP ON APP.id = S.key_id
        LEFT JOIN data_dict AS D2 ON D2.id = APP.app_key
    WHERE
        D.data in ($eventName)
    AND
        D2.data in ('UID', 'TYPE', 'WORKID', 'NAME', 'INTERVAL', 'TAG', 'STATE', 'STACK', 'APPNAME', 
        'MESSAGE', 'PID', 'LOG_LEVEL')
    AND
        (S.ts - TR.start_ts) <= $rightNS
    GROUP BY
        S.serial,
        APP.app_key,
        D.data,
        D2.data;`,
    { $rightNS: rightNs, $eventName: eventName }
  );

export const querySystemWorkData = (rightNs: number): Promise<Array<SystemDetailsEnergy>> =>
  query(
    'querySystemWorkData',
    `SELECT
    ( S.ts - TR.start_ts ) AS ts,
    D.data AS eventName,
    D2.data AS appKey,
    group_concat( ( CASE WHEN S.type == 1 THEN S.string_value ELSE S.int_value END ), ',' ) AS appValue
    FROM
    trace_range AS TR,
    hisys_event_measure AS S
    LEFT JOIN data_dict AS D
    ON D.id = S.name_id
    LEFT JOIN app_name AS APP
    ON APP.id = S.key_id
    LEFT JOIN data_dict AS D2
    ON D2.id = APP.app_key
    WHERE
    D.data in ("WORK_REMOVE", "WORK_STOP", "WORK_ADD", "WORK_START")
    and
    D2.data in ('UID', 'TYPE', 'WORKID', 'NAME', 'INTERVAL', 'TAG', 'STATE', 'STACK', 'APPNAME', 
    'MESSAGE', 'PID', 'LOG_LEVEL')
    and (S.ts - TR.start_ts) <= $rightNS
    GROUP BY
    S.serial,
    APP.app_key,
    D.data,
    D2.data;`,
    { $rightNS: rightNs }
  );

export const queryMaxPowerValue = (
  appName: string
): Promise<
  Array<{
    maxValue: number;
  }>
> =>
  query(
    'queryMaxPowerValue',
    `SELECT
    max( item ) AS maxValue 
    FROM
    (
    SELECT 
    sum( energy + background_energy + screen_on_energy + screen_off_energy + foreground_energy ) AS item 
    FROM 
    energy 
    WHERE 
    app_name = $appName 
    GROUP BY 
    startNs);`,
    { $appName: appName }
  );

export const queryMaxStateValue = (
  eventName: string
): Promise<
  Array<{
    type: string;
    maxValue: number;
  }>
> =>
  query(
    'queryMaxStateValue',
    `select 
  D.data as type,
  max(S.int_value) as maxValue 
  from trace_range AS TR,hisys_event_measure as S 
  left join data_dict as D on D.id=S.name_id 
  left join app_name as APP on APP.id=S.key_id 
  left join data_dict as D2 on D2.id=APP.app_key
  where (case when 'SENSOR_STATE'==$eventName then D.data like '%SENSOR%' else D.data = $eventName end)
  and D2.data in ('BRIGHTNESS','STATE','VALUE','LEVEL','VOLUME','OPER_TYPE','VOLUME')
  group by APP.app_key,D.data,D2.data;`,
    { $eventName: eventName }
  );

export const queryStateData = (eventName: string): Promise<Array<EnergyStateStruct>> =>
  query(
    'queryStateData',
    `select
  (S.ts-TR.start_ts) as startNs,
  D.data as type,
  D2.data as appKey, 
  S.int_value as value 
  from trace_range AS TR,hisys_event_measure as S 
  left join data_dict as D on D.id=S.name_id 
  left join app_name as APP on APP.id=S.key_id 
  left join data_dict as D2 on D2.id=APP.app_key
  where (case when 'SENSOR_STATE'==$eventName then D.data like '%SENSOR%' else D.data = $eventName end)
  and D2.data in ('BRIGHTNESS','STATE','VALUE','LEVEL','VOLUME','OPER_TYPE','VOLUME')
  group by S.serial,APP.app_key,D.data,D2.data;`,
    { $eventName: eventName }
  );

export const queryEnergyAppName = (): Promise<
  Array<{
    string_value: string | null;
  }>
> =>
  query(
    'queryEnergyAppName',
    `
    SELECT
    DISTINCT hisys_event_measure.string_value from data_dict 
    left join app_name on app_name.app_key=data_dict.id 
    left join hisys_event_measure on hisys_event_measure.key_id = app_name.id
    where data_dict.data = "APPNAME"`
  );

export const getTabIoCompletionTimesType = (startTime: number, endTime: number): Promise<Array<string>> =>
  query(
    'getTabIoCompletionTimesType',
    `
    SELECT tier from bio_latency_sample s,trace_range t
     WHERE s.start_ts + s.latency_dur >= $startTime + t.start_ts 
     and s.start_ts <= $endTime + t.start_ts group by tier`,
    { $startTime: startTime, $endTime: endTime }
  );

export const queryEnergyEventExits = (): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'queryEnergyEventExits',
    `select 
      event_name 
      from stat s 
      where s.event_name = 'trace_hisys_event' 
      and s.stat_type ='received' and s.count > 0`
  );

export const querySysLockDetailsData = (rightNs: number, eventName: string): Promise<Array<SystemDetailsEnergy>> =>
  query(
    'querySysLockDetailsData',
    `SELECT
      ( S.ts - TR.start_ts ) AS ts,
      D.data AS eventName,
      D2.data AS appKey,
      group_concat( ( CASE WHEN S.type == 1 THEN S.string_value ELSE S.int_value END ), ',' ) AS appValue
    FROM
      trace_range AS TR,
      hisys_event_measure AS S
      LEFT JOIN data_dict AS D ON D.id = S.name_id
      LEFT JOIN app_name AS APP ON APP.id = S.key_id
      LEFT JOIN data_dict AS D2 ON D2.id = APP.app_key
    WHERE
        D.data in ($eventName)
    AND
        D2.data in ('UID', 'TYPE', 'WORKID', 'NAME', 'INTERVAL', 'TAG', 'STATE', 'STACK', 'APPNAME', 
        'MESSAGE', 'PID', 'LOG_LEVEL')
    AND
        (S.ts - TR.start_ts) <= $rightNS
    GROUP BY
        S.serial, APP.app_key, D.data, D2.data;`,
    { $rightNS: rightNs, $eventName: eventName }
  );

export const queryStateInitValue = (eventName: string, keyName: string): Promise<Array<EnergyStateStruct>> =>
  query(
    'queryStateInitValue',
    `select
  0 as startNs,
  $eventName as type,
  '' as appKey,
  (case $keyName
  when 'brightness' then device_state.brightness
  when 'wifi' then device_state.wifi
  when 'bt_state' then device_state.bt_state
  when 'location' then device_state.location
  else 0 end) as value
  from device_state;`,
    { $eventName: eventName, $keyName: keyName }
  );

export const querySysLocationDetailsData = (rightNs: number, eventName: string): Promise<Array<SystemDetailsEnergy>> =>
  query(
    'querySysLocationDetailsData',
    `SELECT
        ( S.ts - TR.start_ts ) AS ts,
        D.data AS eventName,
        D2.data AS appKey,
        group_concat( ( CASE WHEN S.type == 1 THEN S.string_value ELSE S.int_value END ), ',' ) AS appValue 
        FROM
        trace_range AS TR,
        hisys_event_measure AS S
        LEFT JOIN data_dict AS D ON D.id = S.name_id
        LEFT JOIN app_name AS APP ON APP.id = S.key_id
        LEFT JOIN data_dict AS D2 ON D2.id = APP.app_key 
        WHERE
        D.data in ($eventName) 
        and 
        D2.data in ('UID', 'TYPE', 'WORKID', 'NAME', 'INTERVAL', 'TAG', 'STATE', 'STACK', 
        'APPNAME', 'MESSAGE', 'PID', 'LOG_LEVEL')
        and (S.ts - TR.start_ts) <= $rightNS
        GROUP BY
        S.serial,
        APP.app_key,
        D.data,
        D2.data;`,
    { $rightNS: rightNs, $eventName: eventName }
  );
export const queryConfigEnergyAppName = (): Promise<
  Array<{
    process_name: string;
  }>
> =>
  query(
    'queryConfigEnergyAppName',
    `
    SELECT value from trace_config where trace_source = 'hisys_event' and key = 'process_name'`
  );

export const queryAllExpectedData = (): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'queryAllExpectedData',
    `
        SELECT
            a.id,
            (a.ts - TR.start_ts) AS ts,
            a.vsync as name,
            a.type,
            a.dur,
            p.pid,
            p.name as cmdline
        FROM frame_slice AS a, trace_range AS TR
             LEFT JOIN process AS p ON a.ipid = p.ipid
        WHERE a.type = 1
          and (a.flag <> 2 or a.flag is null)
        ORDER BY a.ipid,ts;`
  );

export const queryFlowsData = (
  src_slice: Array<string>
): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'queryFlowsData',
    `
    SELECT fs.vsync AS name,
        p.pid,
        p.name  AS cmdline,
        fs.type
    FROM frame_slice AS fs
    LEFT JOIN process AS p ON fs.ipid = p.ipid
    WHERE fs.type = 0
        AND fs.id IN (${src_slice.join(',')});`
  );

export const queryPrecedingData = (
  dst_slice: string
): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'queryFlowsData',
    `
        SELECT a.vsync AS name,
               p.pid,
               p.name  AS cmdline,
               a.type
        FROM frame_slice AS a
                 LEFT JOIN process AS p ON a.ipid = p.ipid
        WHERE a.type = 0
          AND a.id = $dst_slice;`,
    { $dst_slice: dst_slice }
  );

export const queryFrameTimeData = (): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'queryFrameTimeData',
    `
        SELECT DISTINCT p.pid
        FROM frame_slice AS a
            LEFT JOIN process AS p
            ON a.ipid = p.ipid;`
  );

export const queryAllSnapshotNames = (): Promise<Array<FileInfo>> =>
  query(
    'queryAllSnapshotNames',
    `SELECT f.id,
        f.file_name AS name
      FROM
        js_heap_files f,
        trace_range t
      WHERE
        ( t.end_ts >= f.end_time AND f.file_name != 'Timeline' )
        OR f.file_name = 'Timeline'`
  );
export const queryHeapFile = (): Promise<Array<FileInfo>> =>
  query(
    'queryHeapFile',
    `SELECT f.id,
        f.file_name AS name,
        f.start_time - t.start_ts AS startTs,
        f.end_time - t.start_ts AS endTs,
        f.self_size AS size,
        c.pid
      FROM
        js_heap_files f,
        trace_range t,
        js_config c
      WHERE
        ( t.end_ts >= f.end_time AND f.file_name != 'Timeline' )
        OR f.file_name = 'Timeline'`
  );

export const queryHeapInfo = (
  fileId: number
): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'queryHeapInfo',
    `SELECT file_id as fileId, key, type, int_value as intValue, str_value as strValue
      FROM js_heap_info WHERE file_id = ${fileId}`
  );

export const queryHeapNode = (fileId: number): Promise<Array<HeapNode>> =>
  query(
    'queryHeapNode',
    `SELECT 
    node_index as nodeIndex,
    type,
    name as nameIdx,
    id,
    self_size as selfSize,
    edge_count as edgeCount,
    trace_node_id as traceNodeId,
    detachedness 
    FROM js_heap_nodes WHERE file_id = ${fileId}`
  );

export const queryHeapEdge = (fileId: number): Promise<Array<HeapEdge>> =>
  query(
    'queryHeapEdge',
    `SELECT 
      edge_index as edgeIndex,
      type,
      name_or_index as nameOrIndex,
      to_node as nodeId,
      from_node_id as fromNodeId,
      to_node_id as toNodeId
    FROM js_heap_edges WHERE file_id = ${fileId}`
  );
export const queryHeapSample = (fileId: number): Promise<Array<HeapSample>> =>
  query(
    'queryHeapSample',
    `SELECT timestamp_us as timestamp , last_assigned_id as lastAssignedId, 0 as size
      FROM js_heap_sample WHERE file_id = ${fileId}`
  );

export const queryHeapLocation = (fileId: number): Promise<Array<HeapLocation>> =>
  query(
    'queryHeapLocation',
    `SELECT object_index as objectIndex,script_id as scriptId ,column
      FROM js_heap_location WHERE file_id = ${fileId}`
  );

export const queryHeapString = (
  fileId: number
): //@ts-ignore
Promise<Array<unknown>> =>
  query(
    'queryHeapString',
    `SELECT string
      FROM js_heap_string WHERE file_id = ${fileId}`
  );
export const queryTraceRange = (): Promise<Array<unknown>> =>
  query(
    'queryTraceRange',
    `SELECT 
    t.start_ts as startTs, 
    t.end_ts as endTs 
    FROM trace_range t`
  );

export const queryBySelectAllocationOrReturn = (
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
                       LEFT JOIN callstack ON callstack.id = task_pool.execute_task_row
                       LEFT JOIN thread ON thread.id = callstack.callid
                WHERE task_pool.execute_task_row IS NOT NULL AND task_pool.task_id = $executeId
                AND task_pool.allocation_itid = $itid;
    `;
  return query('queryBySelectAllocationOrReturn', sqlStr, { $executeId: executeId, $itid: itid });
};

export const queryTaskListByExecuteTaskIds = (
  executeTaskIds: Array<number>,
  ipid: number
): Promise<Array<TaskTabStruct>> => {
  let sqlStr = `
    SELECT thread.ipid,
           task_pool.allocation_task_row AS allocationTaskRow,
           task_pool.execute_task_row    AS executeTaskRow,
           task_pool.return_task_row     AS returnTaskRow,
           task_pool.task_id          AS executeId,
           task_pool.priority
    FROM task_pool
           LEFT JOIN callstack ON callstack.id = task_pool.allocation_task_row
           LEFT JOIN thread ON thread.id = callstack.callid
    WHERE task_pool.task_id IN (${executeTaskIds.join(',')})
      AND thread.ipid = $ipid
      AND task_pool.execute_task_row IS NOT NULL;
    `;
  return query('queryTaskListByExecuteTaskIds', sqlStr, { $executeTaskIds: executeTaskIds, $ipid: ipid });
};

export const queryTaskPoolCallStack = (): Promise<Array<{ id: number; ts: number; dur: number; name: string }>> => {
  let sqlStr = `
  select 
    * 
  from callstack where name like 'H:Task%';`;
  return query('queryTaskPoolCallStack', sqlStr, {});
};

export const queryTaskPoolTotalNum = (itid: number): Promise<number[]> =>
  query<number>(
    'queryTaskPoolTotalNum',
    `SELECT thread.tid
         FROM thread
                LEFT JOIN callstack ON thread.id = callstack.callid
         WHERE ipid in (SELECT thread.ipid
                       FROM thread
                       WHERE thread.itid = $itid)
           AND thread.name LIKE '%TaskWork%'
         GROUP BY thread.tid;`,
    { $itid: itid }
  );

export const queryFrameAnimationData = (): Promise<Array<FrameAnimationStruct>> =>
  query(
    'queryFrameAnimationData',
    `SELECT a.id AS animationId,
           'Response delay' as status,
           (CASE WHEN a.input_time NOT NULL 
               THEN ( a.input_time - R.start_ts ) 
               ELSE ( a.start_point - R.start_ts ) END
           ) AS startTs,
           (a.start_point - R.start_ts) AS endTs,
           0 AS frameInfo,
           a.name AS name
         FROM 
             animation AS a, 
             trace_range AS R
         UNION
         SELECT a.id AS animationId,
           'Completion delay' as status,
           (CASE WHEN a.input_time NOT NULL
               THEN ( a.input_time - R.start_ts )
               ELSE ( a.start_point - R.start_ts ) END
           ) AS startTs,
           (a.end_point - R.start_ts) AS endTs,
           a.frame_info AS frameInfo,
           a.name AS name
         FROM 
             animation AS a, 
             trace_range AS R
         ORDER BY
            endTs;`
  );

export const queryAnimationTimeRangeData = (): Promise<Array<FrameAnimationStruct>> =>
  query(
    'queryAnimationTimeRangeData',
    `SELECT 'Response delay' as status,
           (CASE WHEN a.input_time NOT NULL
               THEN ( a.input_time - R.start_ts )
               ELSE ( a.start_point - R.start_ts ) END
           ) AS startTs,
            (a.start_point - R.start_ts) AS endTs
         FROM 
             animation AS a,
             trace_range AS R
         UNION
         SELECT 'Completion delay' as status,
           (CASE WHEN a.input_time NOT NULL
               THEN ( a.input_time - R.start_ts )
               ELSE ( a.start_point - R.start_ts ) END
           ) AS startTs,
           (a.end_point - R.start_ts) AS endTs
         FROM 
             animation AS a,
             trace_range AS R
         ORDER BY
            endTs;`
  );

export const queryFrameDynamicData = (): Promise<FrameDynamicStruct[]> =>
  query(
    'queryFrameDynamicData',
    `SELECT d.id,
           d.x,
           d.y,
           d.width,
           d.height,
           d.alpha,
           d.name AS appName,
           (d.end_time - R.start_ts) AS ts
        FROM 
            dynamic_frame AS d,
            trace_range AS R
        ORDER BY 
            d.end_time;`
  );

export const queryDynamicIdAndNameData = (): Promise<Array<{ id: number; appName: string }>> =>
  query('queryDynamicIdAndNameData', 'SELECT id, name AS appName FROM dynamic_frame;');

export const queryAnimationIdAndNameData = (): Promise<
  Array<{
    id: number;
    name: string;
    info: string;
  }>
> => query('queryAnimationIdAndNameData', 'SELECT id, name, frame_info as info FROM animation;');

export const queryFrameApp = (): Promise<
  Array<{
    name: string;
  }>
> =>
  query(
    'queryFrameApp',
    `SELECT 
            DISTINCT d.name
         FROM 
             dynamic_frame AS d, 
             trace_range AS R
         WHERE 
            d.end_time >= R.start_ts
            AND
            d.end_time <= R.end_ts;`
  );

export const queryFrameSpacing = (): Promise<Array<FrameSpacingStruct>> =>
  query(
    'queryFrameSpacing',
    `SELECT d.id,
         d.width AS currentFrameWidth,
         d.height AS currentFrameHeight,
         d.name AS nameId,
         (d.end_time - R.start_ts) AS currentTs,
         d.x,
         d.y
     FROM
         dynamic_frame AS d,
         trace_range AS R
     ORDER BY
         d.end_time;`
  );

export const queryPhysicalData = (): Promise<Array<DeviceStruct>> =>
  query(
    'queryPhysicalData',
    `SELECT physical_width AS physicalWidth,
            physical_height AS physicalHeight,
            physical_frame_rate AS physicalFrameRate
     FROM device_info;`
  );
export const getSystemLogsData = (): Promise<
  Array<{
    id: number;
    ts: number;
    processName: string;
    tid: number;
    level: string;
    tag: string;
    message: string;
    des: number;
  }>
> =>
  query(
    'getSystemLogsData',
    `SELECT ROW_NUMBER() OVER (ORDER BY l.ts) AS processName,
            l.seq AS id,
            (l.ts - TR.start_ts) AS ts,
            l.pid AS indexs,
            l.tid,
            l.level,
            l.tag,
            l.context AS message,
            l.origints AS des
         FROM trace_range AS TR,
              log AS l
         ORDER BY ts`
  );

export const queryLogData = (): Promise<Array<LogStruct>> =>
  query(
    'queryLogData',
    `SELECT 
    l.ts - tr.start_ts as startNs 
    FROM log AS l, trace_range tr WHERE startNs > 0 LIMIT 1;`
  );

export const queryMetric = (metricName: string): Promise<Array<string>> =>
  query('queryMetric', metricName, '', { action: 'exec-metric' });

export const queryExistFtrace = (): Promise<Array<number>> =>
  query(
    'queryExistFtrace',
    `select 1 from thread_state
         UNION
         select 1 from args;`
  );

export const queryTraceType = (): Promise<
  Array<{
    value: string;
  }>
> =>
  query(
    'queryTraceType',
    `SELECT m.value
            FROM 
                meta AS m
            WHERE 
                m.name = 'source_type';`
  );

export const queryLogAllData = (oneDayTime: number, leftNs: number, rightNs: number): Promise<Array<LogStruct>> =>
  query(
    'queryLogAllData',
    `SELECT l.seq AS id,
         CASE
             WHEN l.ts < ${oneDayTime} THEN 0
             ELSE (l.ts - TR.start_ts)
             END AS startTs,
         CASE l.level
             WHEN 'D' THEN 'Debug'
             WHEN 'I' THEN 'Info'
             WHEN 'W' THEN 'Warn'
             WHEN 'E' THEN 'Error'
             WHEN 'F' THEN 'Fatal'
             END AS level,
         l.tag AS tag,
         l.context AS context,
         (strftime( '%m-%d %H:%M:%S', l.origints / 1000000000, 'unixepoch', 'localtime' ) || 
         '.' || printf('%03d', (l.origints / 1000000) % 1000)) AS originTime,
         COALESCE(p.name, 'Process ' || l.pid) AS processName
     FROM
         log AS l
             LEFT JOIN trace_range AS TR ON l.ts >= TR.start_ts
             LEFT JOIN process AS p ON p.pid = l.pid
     WHERE
         startTs >= ${Math.floor(leftNs)}
       AND startTs <= ${Math.floor(rightNs)}
     ORDER BY
         l.ts;`,
    { $oneDayTime: oneDayTime }
  );

export const queryFpsSourceList = (
  inputTime: number,
  endTime: number,
  name: string
): Promise<
  Array<{
    name: string;
    ts: number;
    dur: number;
    pid: number;
    tid: number;
    depth: number;
  }>
> =>
  query(
    'queryFpsSourceList',
    `SELECT t.tid,
        c.dur,
        c.depth,
        c.ts,
        c.name 
      FROM
        callstack c
      INNER JOIN thread t ON c.callid = t.itid 
      WHERE
        c.name LIKE '%${name}%' 
        AND 
        c.ts BETWEEN ${inputTime} and ${endTime} 
        AND 
        t.name = 'render_service';`
  );

export const queryStateFreqList = (
  startTime: number,
  endTime: number,
  cpu: number
): //@ts-ignore
Promise<Array<unknown>> => {
  let sql = `select c.value,
    c.ts,
    c.dur,
    c.ts - r.start_ts AS startTime, 
    c.ts - r.start_ts + c.dur AS endTime
   from
     measure c, trace_range r 
   inner join
     cpu_measure_filter t
   on
     c.filter_id = t.id
   where
     (name = 'cpufreq' or name='cpu_frequency')
     and
     t.cpu = $cpu
     and  
     (((startTime < $startTime) and  (endtime > $endTime))
      or ((startTime < $startTime) and ($startTime < endtime and endtime < $endTime)) 
      or ((startTime > $startTime) and ( $startTime < endtime and endtime < $endTime)) 
      or ((startTime > $startTime and startTime < $endTime) and (endtime > $endTime)))`;
  return query('queryBinderByArgsId', sql, {
    $endTime: endTime,
    $startTime: startTime,
    $cpu: cpu,
  });
};
export const queryPerfOutputData = (): Promise<Array<unknown>> =>
  query(
    'queryPerfOutputData',
    `SELECT 
    name, 
    ts 
    FROM callstack where name like '%PERFORMANCE_DATA%'`
  );

export const queryPerfToolsDur = (): Promise<Array<unknown>> =>
  query(
    'queryPerfToolsDur',
    `SELECT 
    name, 
    ts, 
    dur 
    FROM callstack where name = 'H:GRAB'`
  );
