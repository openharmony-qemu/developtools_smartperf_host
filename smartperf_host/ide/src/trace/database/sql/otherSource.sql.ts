/*
 * Copyright (C) 2025 Huawei Device Co., Ltd.
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

export class otherProcess {
    ipid: number = 0;
    pid: number = 0;
    name: String = '';
}

export const queryCount = (): Promise<Array<{ num: number }>> =>
    query('queryCount', `select count(1) num from native_hook_statistic`, {});

export const queryStatisticType = (): Promise<Array<{ num: number }>> =>
  query('queryStatisticType', `SELECT 
  EXISTS(SELECT 1 FROM native_hook_statistic WHERE type = 4) AS FD,
  EXISTS(SELECT 1 FROM native_hook_statistic WHERE type = 5) AS THRESD;`, {});

export const queryProcess = (table: string): Promise<Array<otherProcess>> => {
    let sql = `
    select
      distinct ${table}.ipid,
      pid,
      name
    from
      ${table}
    left join
      process p
    on
      ${table}.ipid = p.id
    `;
    return query('queryProcess', sql, {});
};

export const queryOtherSourceRealTime = (): //@ts-ignore
  Promise<Array<unknown>> =>
  query(
    'queryOtherSourceRealTime',
    `select cs.ts,cs.clock_name from datasource_clockid dc 
    left join clock_snapshot cs on dc.clock_id = cs.clock_id 
    where data_source_name = 'memory-plugin' or data_source_name = 'nativehook'
`,
    {}
  );

  export const queryBootTime = (): //@ts-ignore
  Promise<Array<unknown>> =>
  query(
    'queryBootTime',
    `select CS.ts -TR.start_ts as ts ,clock_name from clock_snapshot as CS ,trace_range as TR
      where clock_name = 'boottime'`,
    {}
  );const TYPE_FD_STRING = 'FD';
  const TYPE_THREAD_STRING = 'THREAD';

  export const queryNativeHookStatisticSubType = (
    leftNs: number,
    rightNs: number,
    ipid: number
  ): //@ts-ignore
    Promise<Array<unknown>> =>
    query(
      'queryNativeHookStatisticSubType',
      `SELECT DISTINCT
         COALESCE(NHS.type, TT.type) AS subTypeId,
         CASE
           WHEN NHS.type = 4 THEN 'FD'
           WHEN NHS.type = 5 THEN 'THREAD'
           ELSE TT.default_name
         END AS subType
         FROM (
           SELECT 4 AS type, 'FD' AS default_name
           UNION ALL SELECT 5, 'THREAD'
         ) TT
         LEFT JOIN native_hook_statistic NHS 
           ON TT.type = NHS.type 
           AND NHS.type IN (4, 5)
           AND EXISTS (SELECT 1 FROM trace_range TR WHERE (NHS.ts - TR.start_ts) BETWEEN ${leftNs} AND ${rightNs})
           AND NHS.ipid = ${ipid}
         ORDER BY subTypeId;
        `,
      { $leftNs: leftNs, $rightNs: rightNs }
    );