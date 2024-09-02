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
import { IrqStruct } from '../ui-worker/ProcedureWorkerIrq';
import { IrqAndSoftirqBean } from '../../component/trace/sheet/irq/irqAndSoftirqBean'
import { Utils } from '../../component/trace/base/Utils';

export const queryIrqList = (traceId?: string): Promise<Array<{ name: string; cpu: number }>> =>
  query('queryIrqList',
  `SELECT 
  * 
  FROM
    (SELECT DISTINCT cat AS name, callid AS cpu FROM irq WHERE cat<>'ipi')
  ORDER By 
    name,
    cpu`
    , {}, { traceId: traceId });

export const queryAllIrqNames = async (traceId?: string): Promise<Array<{ ipiName: string; name: string; id: number }>> => {
  let allIrqNamesBuffer = await query(
    'queryAllIrqNames',
    `select
      id,
      case 
    when 
      cat = 'ipi' then 'IPI' || name else name end as ipiName from irq;`,
    {}, 
    { traceId: traceId, action: 'exec-buf' }
  );
  // @ts-ignore
  return Utils.convertJSON(allIrqNamesBuffer);
};

export const queryIrqData = (callid: number, cat: string): Promise<Array<IrqStruct>> => {
  let sqlSoftIrq = `
    select i.ts - t.start_ts as startNS,i.dur,i.name,i.depth,argsetid as argSetId,i.id from irq i,
trace_range t where i.callid = ${callid} and i.cat = 'softirq'
    `;
  let sqlIrq = `
    select i.ts - t.start_ts as startNS,i.dur,
        case when i.cat = 'ipi' then 'IPI' || i.name else i.name end as name,
        i.depth,
        argsetid as argSetId,
        i.id 
        from irq i,trace_range t 
        where i.callid = ${callid} and ((i.cat = 'irq' and i.flag ='1') or i.cat = 'ipi') 
    `;
  return query('queryIrqData', cat === 'irq' ? sqlIrq : sqlSoftIrq, {});
};

export const queryIrqDataBoxSelect = (
  callIds: Array<number>,
  startNS: number,
  endNS: number
): Promise<Array<unknown>> => {
  let sqlIrq = `
select case when i.cat = 'ipi' then 'IPI' || i.name else i.name end as irqName,
       'irq'                                                        as cat,
       sum(
        min(${endNS},(i.ts - t.start_ts + iif(i.dur = -1 or i.dur is null, 0, i.dur))) - max(${startNS},i.ts - t.start_ts)
        )                                                           as wallDuration,
       max(dur)                                                     as maxDuration,
       count(1)                                                     as count,
       avg(ifnull(dur, 0))                                          as avgDuration
from irq i,
     trace_range t
where ((i.cat = 'irq' and i.flag = '1') or i.cat = 'ipi')
  and callid in (${callIds.join(',')})
  and max(i.ts - t.start_ts, ${startNS}) <= min(i.ts - t.start_ts + dur, ${endNS})
group by irqName;
    `;
  return query('queryIrqDataBoxSelect', callIds.length > 0 ? sqlIrq : '', {}, { traceId: Utils.currentSelectTrace });
};

export const querySoftIrqDataBoxSelect = (
  callIds: Array<number>,
  startNS: number,
  endNS: number
): Promise<Array<unknown>> => {
  let sqlIrq = `
select i.name              as irqName,
       i.cat,
       sum(
         min(${endNS},(i.ts - t.start_ts + iif(i.dur = -1 or i.dur is null, 0, i.dur))) - max(${startNS},i.ts - t.start_ts)
         )                 as wallDuration,
       max(dur)            as maxDuration,
       count(1)            as count,
       avg(ifnull(dur, 0)) as avgDuration
from irq i,
     trace_range t
where callid in (${callIds.join(',')})
  and i.cat = 'softirq'
  and max(i.ts - t.start_ts, ${startNS}) <= min(i.ts - t.start_ts + dur, ${endNS})
group by irqName;
    `;
  return query('querySoftIrqDataBoxSelect', callIds.length > 0 ? sqlIrq : '', {}, { traceId: Utils.currentSelectTrace });
};

export const queryIrqSelectData = (callIds: Array<number>, startNS: number, endNS: number): Promise<Array<IrqAndSoftirqBean>> =>
  query(
    'getIrqSelectData',
    `
    SELECT
        'irq' AS cat,
        i.callid,
        CASE
          WHEN i.cat = 'ipi'
          THEN 'IPI' || i.name
          ELSE i.name
          END AS name,
        1 As count,
        true As isFirstObject,
        2 AS priority, 
        MAX(${startNS},i.ts - TR.start_ts) AS startTime,
        MIN(${endNS},(i.ts - TR.start_ts + iif(i.dur = -1 OR i.dur IS NULL, 0, i.dur))) AS endTime,
        MIN(${endNS},(i.ts - TR.start_ts + iif(i.dur = -1 OR i.dur IS NULL, 0, i.dur))) - MAX(${startNS},i.ts - TR.start_ts) AS wallDuration 
    FROM
      irq i 
    LEFT JOIN
      trace_range AS TR
      WHERE
      i.callid IN (${callIds.join(',')})
    AND
      NOT ((i.ts - TR.start_ts + iif(i.dur = -1 OR i.dur IS NULL, 0, i.dur) < ${startNS}) OR (i.ts - TR.start_ts > ${endNS}))
    AND ( ( i.cat = 'irq' AND i.flag = '1' ) OR i.cat = 'ipi' )`
  );

export const querySoftirqSelectData = (callIds: Array<number>, startNS: number, endNS: number): Promise<Array<IrqAndSoftirqBean>> =>
  query(
    'getSoftirqSelectData',
    `
      SELECT
          'softirq' AS cat,
          i.callid,
          i.name,
          1 As count,
          true As isFirstObject,
          1 AS priority, 
          MAX(${startNS},i.ts - TR.start_ts) AS startTime,
          MIN(${endNS},(i.ts - TR.start_ts + iif(i.dur = -1 OR i.dur IS NULL, 0, i.dur))) AS endTime,
          MIN(${endNS},(i.ts - TR.start_ts + iif(i.dur = -1 OR i.dur IS NULL, 0, i.dur))) - MAX(${startNS},i.ts - TR.start_ts) AS wallDuration 
      FROM
        irq i 
      LEFT JOIN
        trace_range AS TR
      WHERE
        i.callid IN (${callIds.join(',')})
      AND
        NOT ((i.ts - TR.start_ts + iif(i.dur = -1 OR i.dur IS NULL, 0, i.dur) < ${startNS}) OR (i.ts - TR.start_ts > ${endNS}))
      AND 
        i.cat = 'softirq' `
  );