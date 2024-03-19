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
import { FuncStruct } from '../ui-worker/ProcedureWorkerFunc';
import { SearchFuncBean } from '../../bean/SearchFuncBean';
import { SelectionData } from '../../bean/BoxSelection';
import { HeapTraceFunctionInfo } from '../../../js-heap/model/DatabaseStruct';

export const queryAllFuncNames = (): Promise<Array<any>> => {
  return query(
    'queryAllFuncNames',
    `
        select id,name from callstack;`
  );
};
export const queryProcessAsyncFunc = (_funName?: string): Promise<Array<any>> =>
  query(
    'queryProcessAsyncFunc',
    `
select tid,
    P.pid,
    A.name as threadName,
    is_main_thread,
    c.callid as track_id,
    c.ts-D.start_ts as startTs,
    c.dur,
    c.name as funName,
    c.parent_id,
    c.id,
    c.cookie,
    c.depth,
    c.argsetid
from thread A,trace_range D
left join callstack C on A.id = C.callid
left join process P on P.id = A.ipid
where startTs not null and cookie not null ${_funName ? 'funName=$funName' : ''};`,
    {
      funName: _funName,
    }
  );

export const getFunDataByTid = (tid: number, ipid: number): Promise<Array<FuncStruct>> =>
  query(
    'getFunDataByTid',
    `
    select 
    c.ts-D.start_ts as startTs,
    c.dur,
    c.name as funName,
    c.argsetid,
    c.depth,
    c.id as id,
    A.itid as itid,
    A.ipid as ipid
from thread A,trace_range D
left join callstack C on A.id = C.callid
where startTs not null and c.cookie is null and tid = $tid and A.ipid = $ipid`,
    { $tid: tid, $ipid: ipid }
  );
export const getMaxDepthByTid = (): Promise<Array<any>> =>
  query(
    'getMaxDepthByTid',
    `
    select
tid,
ipid,
    MAX(c.depth + 1) as maxDepth
from thread A
left join callstack C on A.id = C.callid
where c.ts not null and c.cookie is null group by tid,ipid`,
    {}
  );
export const querySearchFuncData = (
  funcName: string,
  tIds: number,
  leftNS: number,
  rightNS: number
): Promise<Array<SearchFuncBean>> =>
  query(
    'querySearchFuncData',
    `
        select 
          c.ts - r.start_ts as startTime,
          c.dur
        from 
          callstack c 
        left join 
          thread t 
        on 
          c.callid = t.id 
        left join 
          process p 
        on 
          t.ipid = p.id
        left join 
          trace_range r
        where 
          c.name like '${funcName}%' 
        and 
          t.tid = ${tIds} 
        and
          not ((startTime < ${leftNS}) or (startTime > ${rightNS}));
    `
  );
export const querySearchRowFuncData = (
  funcName: string,
  tIds: number,
  leftNS: number,
  rightNS: number
): Promise<Array<SearchFuncBean>> =>
  query(
    'querySearchRowFuncData',
    `
          select 
            c.name as funName,
            c.ts - r.start_ts as startTime,
            t.tid,
            t.name as threadName,
            'func' as type 
          from 
            callstack c 
          left join 
            thread t 
          on 
            c.callid = t.id 
          left join 
            process p 
          on 
            t.ipid = p.id
          left join 
            trace_range r
          where 
            c.name like '${funcName}' 
          and 
            t.tid = ${tIds} 
          and
            not ((startTime < ${leftNS}) or (startTime > ${rightNS}));
      `,
    { $search: funcName }
  );
export const getTabSlicesAsyncFunc = (
  asyncNames: Array<string>,
  asyncPid: Array<number>,
  leftNS: number,
  rightNS: number
): Promise<Array<any>> =>
  query<SelectionData>(
    'getTabSlicesAsyncFunc',
    `
    select
      c.name as name,
      sum(c.dur) as wallDuration,
      avg(c.dur) as avgDuration,
      count(c.name) as occurrences
    from
      thread A, trace_range D
    left join
      callstack C
    on
      A.id = C.callid
    left join process P on P.id = A.ipid
    where
      C.ts > 0
    and
      c.dur >= -1
    and 
      c.cookie not null
    and
      P.pid in (${asyncPid.join(',')})
    and
      c.name in (${asyncNames.map((it) => "'" + it + "'").join(',')})
    and
      not ((C.ts - D.start_ts + C.dur < $leftNS) or (C.ts - D.start_ts > $rightNS))
    group by
      c.name
    order by
      wallDuration desc;`,
    { $leftNS: leftNS, $rightNS: rightNS }
  );
export const querySearchFunc = (search: string): Promise<Array<SearchFuncBean>> =>
  query(
    'querySearchFunc',
    `
   select c.cookie,
          c.id,
          c.name as funName,
          c.ts - r.start_ts as startTime,
          c.dur,
          c.depth,
          t.tid,
          t.name as threadName,
          p.pid,
          c.argsetid,
          'func' as type 
   from callstack c left join thread t on c.callid = t.id left join process p on t.ipid = p.id
   left join trace_range r 
   where c.name like '%${search}%' and startTime > 0;
    `,
    { $search: search }
  );

export const querySceneSearchFunc = (search: string, processList: Array<string>): Promise<Array<SearchFuncBean>> =>
  query(
    'querySearchFunc',
    `
   select c.cookie,
          c.id,
          c.name as funName,
          c.ts - r.start_ts as startTime,
          c.dur,
          c.depth,
          t.tid,
          t.name as threadName,
          p.pid,
          c.argsetid,
          'func' as type 
   from callstack c left join thread t on c.callid = t.id left join process p on t.ipid = p.id
   left join trace_range r
   where c.name like '%${search}%' ESCAPE '\\' and startTime > 0 and p.pid in (${processList.join(',')});
    `,
    { $search: search }
  );
export const queryHeapFunction = (fileId: number): Promise<Array<HeapTraceFunctionInfo>> =>
  query(
    'queryHeapFunction',
    `SELECT function_index as index ,function_id as id ,name,script_name as scriptName,script_id as scriptId,line,column
      FROM js_heap_trace_function_info WHERE file_id = ${fileId}`
  );
export const queryHeapTraceNode = (fileId: number): Promise<Array<any>> =>
  query(
    'queryHeapTraceNode',
    `SELECT F.name,
        F.script_name as scriptName,
        F.script_id as scriptId,
        F.column,
        F.line,
        N.id,
        N.function_info_index as functionInfoIndex,
        N.parent_id as parentId,
        N.count,
        N.size,
        IFNULL( S.live_count, 0 ) AS liveCount,
        IFNULL( S.live_size, 0 ) AS liveSize
    FROM
        js_heap_trace_node N
        LEFT JOIN (
            SELECT
                trace_node_id as traceNodeId,
                SUM( self_size ) AS liveSize,
                count( * ) AS liveCount
            FROM
                js_heap_nodes
            WHERE
                file_id = ${fileId}
                AND trace_node_id != 0
            GROUP BY
                trace_node_id
        ) S ON N.id = S.trace_node_id
    LEFT JOIN js_heap_trace_function_info F ON (F.file_id = N.file_id
                AND F.function_index = N.function_info_index)
    WHERE
        N.file_id = ${fileId}
    ORDER BY
        N.id`
  );
export const queryTaskPoolOtherRelationData = (ids: Array<number>, tid: number): Promise<Array<FuncStruct>> => {
  let sqlStr = `select
                    c.ts-D.start_ts as startTs,
                    c.dur,
                    c.name as funName,
                    c.argsetid,
                    c.depth,
                    c.id as id,
                    A.itid as itid,
                    A.ipid as ipid
                from thread A,trace_range D
                                  left join callstack C on A.id = C.callid
                where startTs not null and c.cookie is null and tid = $tid and c.id in (${ids.join(',')})`;
  return query('queryTaskPoolOtherRelationData', sqlStr, { $ids: ids, $tid: tid });
};

export const queryTaskPoolRelationData = (ids: Array<number>, tids: Array<number>): Promise<Array<FuncStruct>> => {
  const sqlArray: Array<string> = [];
  if (ids.length > 0) {
    for (let index = 0; index < ids.length; index++) {
      if (index !== 0) {
        sqlArray.push(`or`);
      }
      sqlArray.push(`( tid = ${tids[index]} and c.id = ${ids[index]})`);
    }
  }
  let sql = sqlArray.join(' ');
  let sqlStr = `select
                    c.ts-D.start_ts as startTs,
                    c.dur,
                    c.name as funName,
                    c.argsetid,
                    c.depth,
                    c.id as id,
                    A.itid as itid,
                    A.ipid as ipid
                from thread A,trace_range D
                                  left join callstack C on A.id = C.callid
                where startTs not null and c.cookie is null and (${sql})`;
  return query('queryTaskPoolRelationData', sqlStr);
};
