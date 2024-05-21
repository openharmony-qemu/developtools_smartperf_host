/*
 * Copyright (C) 2024 Huawei Device Co., Ltd.
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

import { query } from "../SqlLite";
import { CpuAndIrqBean} from "../../component/trace/sheet/cpu/CpuAndIrqBean";
export const getCpuData = (cpus: Array<number>, leftNS: number, rightNS: number): Promise<Array<CpuAndIrqBean>> =>
    query(
      'getCpuData',
      `
      SELECT
        TS.pid AS pid,
        TS.tid AS tid,
        TS.cpu,
        'cpu' AS cat,
        1 As occurrences,
        1 As priority,
        true As isFirstObject,
        MAX(${leftNS},TS.ts - TR.start_ts) AS startTime,
        MIN(${rightNS},(TS.ts - TR.start_ts + iif(TS.dur = -1 OR TS.dur IS NULL, 0, TS.dur))) AS endTime,
        MIN(${rightNS},(TS.ts - TR.start_ts + iif(TS.dur = -1 OR TS.dur IS NULL, 0, TS.dur))) - MAX(${leftNS},TS.ts - TR.start_ts) AS dur
      FROM
        thread_state AS TS
      LEFT JOIN
        trace_range AS TR
      WHERE
        TS.cpu IN (${cpus.join(',')})
      AND
        NOT ((TS.ts - TR.start_ts + iif(TS.dur = -1 OR TS.dur IS NULL, 0, TS.dur) < ${leftNS}) OR (TS.ts - TR.start_ts > ${rightNS}))`
    );
export const getIrqAndSoftIrqData = (cpus: Array<number>, leftNS: number, rightNS: number): Promise<Array<CpuAndIrqBean>> =>{
  return query(
    'getIrqAndSoftIrqData',
    `
    SELECT
      CASE
        WHEN i.cat = 'softirq'
        THEN 'softirq'
        ELSE 'irq'
        END AS cat,
      CASE
        WHEN i.cat = 'softirq'
        THEN 2
        ELSE 3
        END AS priority,
      i.callid as cpu,
      1 As occurrences,
      true As isFirstObject,
      MAX(${leftNS},i.ts - TR.start_ts) AS startTime,
      MIN(${rightNS},(i.ts - TR.start_ts + iif(i.dur = -1 OR i.dur IS NULL, 0, i.dur))) AS endTime,
      MIN(${rightNS},(i.ts - TR.start_ts + iif(i.dur = -1 OR i.dur IS NULL, 0, i.dur))) - MAX(${leftNS},i.ts - TR.start_ts) AS dur
    FROM
      irq i 
    LEFT JOIN
      trace_range AS TR
    WHERE
      i.callid IN (${cpus.join(',')})
    AND
      NOT ((i.ts - TR.start_ts + iif(i.dur = -1 OR i.dur IS NULL, 0, i.dur) < ${leftNS}) OR (i.ts - TR.start_ts > ${rightNS}))
    AND ( ( i.cat = 'irq' AND i.flag = '1' ) OR i.cat = 'ipi' OR  i.cat = 'softirq' )`
  );
}