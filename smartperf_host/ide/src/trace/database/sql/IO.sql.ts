/*
 * Copyright (C) 2026 Huawei Device Co., Ltd.
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

 export const queryAllIOProcess = (): Promise<
  Array<{
    pid: number;
  }>
> =>
  query(
    'queryAllIOProcess',
    `
        SELECT DISTINCT p.pid
        FROM filesystem_io AS a
        LEFT JOIN process AS p ON a.ipid = p.ipid;
        `
  );

export const queryDistinctItidCountForIO = (
  pid: number,
  type: number
): Promise<Array<{ cnt: number }>> => {
  const isWrite = type === 1 || type === 3 ? 1 : 0;
  const isBlock = type === 2 || type === 3 ? 1 : 0;
  return query(
    'queryDistinctItidCountForIO',
    `
        SELECT COUNT(DISTINCT COALESCE(A.itid, 0)) AS cnt
        FROM filesystem_io AS A
        JOIN process AS P ON A.ipid = P.ipid
        WHERE A.is_write = $isWrite
          AND A.is_block = $isBlock
          AND P.pid = $pid;
        `,
    { $isWrite: isWrite, $isBlock: isBlock, $pid: pid }
  );
};

export type IOStatisticsRow = {
  pid: number;
  pName: string;
  tid: number;
  tName: string;
  start_time: number;
  end_time: number;
  duration: number;
  is_write: number;
  is_physical: number;
  request_bytes: number;
  actualBytes: number;
  minDuration: number;
  maxDuration: number;
  avgDuration: number;
};

/**
 * IO Statistics
 * 根据框选的 IO 泳道（Logical Read / Logical Write / Physical Read / Physical Write）
 * 过滤对应的 is_write / is_block 组合，避免返回与泳道类型不匹配的数据。
 */
export const queryIOStatisticsByRange = (
  startTimeNs: number,
  endTimeNs: number,
  filters?: Array<{ isWrite: number; isBlock: number }>
): Promise<IOStatisticsRow[]> => {
  let typeFilterSql = '';
  if (filters && filters.length > 0) {
    const clauses = filters
      .map((f) => `(A.is_write = ${f.isWrite} AND A.is_block = ${f.isBlock})`)
      .join(' OR ');
    typeFilterSql = `AND (${clauses})`;
  }
  return query(
    'queryIOStatisticsByRange',
    `
      SELECT
        IFNULL(p.pid, 0) as pid,
        IFNULL(p.name, 'Process') as pName,
        IFNULL(t.tid, 0) as tid,
        IFNULL(t.name, 'Thread') as tName,
        A.start_time,
        A.end_time,
        IFNULL(A.duration, A.end_time - A.start_time) as duration,
        A.is_write as is_write,
        A.is_block as is_physical,
        A.request_bytes as request_bytes,
        A.actual_bytes as actualBytes,
        MIN(IFNULL(A.duration, A.end_time - A.start_time)) OVER (PARTITION BY A.ipid, A.itid) as minDuration,
        MAX(IFNULL(A.duration, A.end_time - A.start_time)) OVER (PARTITION BY A.ipid, A.itid) as maxDuration,
        AVG(IFNULL(A.duration, A.end_time - A.start_time)) OVER (PARTITION BY A.ipid, A.itid) as avgDuration
      FROM
        filesystem_io A
      LEFT JOIN process p ON A.ipid = p.ipid
      LEFT JOIN thread t ON A.itid = t.itid,
        trace_range tr
      WHERE
        (start_time - tr.start_ts + IFNULL(A.duration, A.end_time - A.start_time)) >= $startTimeNs
        AND (start_time - tr.start_ts) <= $endTimeNs
        ${typeFilterSql}
      ORDER BY
        A.start_time;
    `,
    { $startTimeNs: startTimeNs, $endTimeNs: endTimeNs }
  );
};