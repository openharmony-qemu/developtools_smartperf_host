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
//  VM Tracker Gpu Resourcet泳道图
import type {SnapshotStruct} from "../ui-worker/ProcedureWorkerSnapshot";
import {query} from "../SqlLite";

export const queryGpuResourceData = (categoryNameId: number): Promise<Array<SnapshotStruct>> =>
  query(
    'queryGpuResourceData',
    `SELECT
    subquery1.startNs,
    IFNULL(subquery1.totalSize, 0) as aSize, 
    IFNULL(subquery2.size, 0) as bSize,
    (IFNULL(subquery1.totalSize, 0) - IFNULL(subquery2.size, 0)) AS value
  FROM
    (SELECT (ts - start_ts) AS startNs,SUM(total_size) AS totalSize
     FROM memory_profile, trace_range
     WHERE ts between start_ts and end_ts
     GROUP BY ts) AS subquery1
   LEFT JOIN
    (SELECT (ts - start_ts) AS startNs, SUM(size) AS size
     FROM memory_window_gpu, trace_range
     WHERE ts between start_ts and end_ts
    AND category_name_id = ${categoryNameId}
     GROUP BY ts) AS subquery2
  ON subquery1.startNs = subquery2.startNs`
  );
export const queryisExistsGpuResourceData = (categoryNameId: number): Promise<Array<SnapshotStruct>> =>
  query(
    'queryisExistsGpuResourceData',
    `SELECT EXISTS (
      SELECT 1
    FROM
      (SELECT (ts - start_ts) AS startNs
      FROM memory_profile, trace_range
      WHERE ts between start_ts and end_ts
      GROUP BY ts) AS subquery1
    LEFT JOIN
      (SELECT (ts - start_ts) AS startNs
      FROM memory_window_gpu, trace_range
      WHERE ts between start_ts and end_ts
      AND category_name_id = ${categoryNameId}
      GROUP BY ts) AS subquery2
    ON subquery1.startNs = subquery2.startNs
    ) AS data_exists
    `
  );

//  VM Tracker Gpu Resource Tab页
export const queryGpuResourceTabData = (
  startNs: number
): Promise<Array<{ startNs: number; channelId: number; totalSize: number }>> =>
  query(
    'queryGpuResourceTabData',
    `SELECT (ts - start_ts) as startNs, channel_id as channelId, sum(total_size) as totalSize 
    FROM memory_profile, trace_range
    WHERE (ts - start_ts) = ${startNs}
    GROUP by ts, channelId`
  );


export const queryGpuTotalType = (): Promise<Array<{ id: number; data: string }>> =>
  query(
    'queryGpuTotalType',
    `
    select distinct module_name_id id,data
    from memory_window_gpu A, trace_range TR left join data_dict B on A.module_name_id = B.id
    where window_name_id = 0
    and A.ts < TR.end_ts
  `
  );

export const queryGpuDataByTs = (
  ts: number,
  window: number,
  module: number | null
): Promise<
  Array<{
    windowNameId: number;
    windowId: number;
    moduleId: number;
    categoryId: number;
    size: number;
  }>
> => {
  let condition =
    module === null
      ? `and window_name_id = ${window}`
      : `and window_name_id = ${window} and module_name_id = ${module}`;
  let sql = `select window_name_id as windowNameId,
       window_id as windowId,
       module_name_id as moduleId,
       category_name_id as categoryId,
       size
       from memory_window_gpu, trace_range
       where ts - start_ts = ${ts} ${condition}
        `;
  return query('queryGpuDataByTs', sql);
};

export const queryGpuTotalData = (moduleId: number | null): Promise<Array<{ startNs: number; value: number }>> => {
  let moduleCondition = moduleId === null ? '' : `and module_name_id = ${moduleId}`;
  let sql = `
  select (ts - start_ts) startNs, sum(size) value
    from memory_window_gpu,trace_range
    where window_name_id = 0 ${moduleCondition}
    and ts< end_ts
    group by ts;
  `;
  return query('queryGpuTotalData', sql);
};

// GL 或 Graph 泳道图
export const queryGpuData = (ipid: number, name: string): Promise<Array<{ startNs: number; value: number }>> => {
  let sql = `
    select (ts - start_ts) startNs,sum(value) value
  from process_measure, trace_range
  where filter_id = (
      select id
      from process_measure_filter
      where name = ${name} and ipid = ${ipid}
      )
  and ts between start_ts and end_ts
  group by ts;
    `;
  return query('queryGpuData', sql);
};
// 判断VM Tracker Gl或 Graph泳道图是否有数据
export const queryisExistsGpuData = (
  ipid: number,
  name: string
): Promise<Array<{ startNs: number; value: number }>> => {
  let sql = `
   SELECT EXISTS (
      SELECT 1
      FROM process_measure, trace_range
      WHERE filter_id = (
         SELECT id
         FROM process_measure_filter
         WHERE name = ${name} AND ipid = ${ipid}
         )
         AND ts BETWEEN start_ts AND end_ts
   ) AS data_exists;
     `;
  return query('queryGpuData', sql);
};

// GL 或 Graph 框选Tab页
export const queryGpuDataTab = (
  ipid: number,
  leftNs: number,
  rightNs: number,
  interval: number,
  name: string
): Promise<Array<{ startTs: number; size: number }>> => {
  let sql = `
    select (ts - start_ts) startTs,sum(value) * 1024 size
  from process_measure, trace_range
  where filter_id = (
      select id
      from process_measure_filter
      where name = ${name} and ipid = ${ipid}
      )
  and not ((startTs + ${interval} < ${leftNs}) or (startTs > ${rightNs}))
  group by ts;
    `;
  return query('queryGpuGLDataByRange', sql);
};

export const queryGpuDataByRange = (
  leftNs: number,
  rightNs: number,
  interval: number
): Promise<
  Array<{
    startTs: number;
    windowId: number;
    moduleId: number;
    categoryId: number;
    avgSize: number;
    maxSize: number;
    minSize: number;
  }>
> => {
  let sql = `select (ts - start_ts) startTs,
    window_name_id windowId,
    module_name_id moduleId,
    category_name_id categoryId,
    avg(size) avgSize,
    max(size) maxSize,
    min(size) minSize
  from memory_window_gpu,trace_range
  where not ((startTs + ${interval} < ${leftNs}) or (startTs > ${rightNs}))
  group by window_name_id,module_name_id,category_name_id
  order by avgSize DESC;
  `;
  return query('queryGpuWindowData', sql);
};

export const queryGpuWindowData = (
  windowId: number,
  moduleId: number | null
): Promise<Array<{ startNs: number; value: number }>> => {
  let moduleCondition = moduleId === null ? '' : `and module_name_id = ${moduleId}`;
  let sql = `
  select (ts - start_ts) startNs, sum(size) value
    from memory_window_gpu,trace_range
    where window_name_id = ${windowId} ${moduleCondition}
    and ts < end_ts
    group by ts;
  `;
  return query('queryGpuWindowData', sql);
};

export const queryGpuWindowType = (): Promise<Array<{ id: number; data: string; pid: number }>> =>
  query(
    'queryGpuWindowType',
    `
  select distinct A.window_name_id as id,B.data, null as pid
from memory_window_gpu A, trace_range tr left join data_dict B on A.window_name_id = B.id
where window_name_id != 0
and A.ts < tr.end_ts
union all
select distinct A.module_name_id id, B.data, A.window_name_id pid
from memory_window_gpu A, trace_range TR left join data_dict B on A.module_name_id = B.id
where window_name_id != 0
and A.ts < TR.end_ts
  `
  );
export const queryGpuDur = (id: number): Promise<any> =>
  query(
    'queryGpuDur',
    `
        SELECT dur AS gpu_dur
        FROM gpu_slice
        WHERE frame_row = $id;`,
    { $id: id }
  );