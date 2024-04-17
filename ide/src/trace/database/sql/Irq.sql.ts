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
import {query} from "../SqlLite";
import {IrqStruct} from "../ui-worker/ProcedureWorkerIrq";

export const queryIrqList = (): Promise<Array<{ name: string; cpu: number }>> =>
  query('queryIrqList', `select cat as name,callid as cpu from irq where cat!= 'ipi' group by cat,callid`);

export const queryAllIrqNames = (): Promise<Array<{ ipiName: string; name: string; id: number }>> => {
  return query(
    'queryAllIrqNames',
    `select id,case when cat = 'ipi' then 'IPI' || name else name end as ipiName, name from irq;`
  );
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

export const queryIrqDataBoxSelect = (callIds: Array<number>, startNS: number, endNS: number): Promise<Array<any>> => {
  let sqlIrq = `
select case when i.cat = 'ipi' then 'IPI' || i.name else i.name end as irqName,
       sum(dur)                                                     as wallDuration,
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
  return query('queryIrqDataBoxSelect', callIds.length > 0 ? sqlIrq : '', {});
};

export const querySoftIrqDataBoxSelect = (
  callIds: Array<number>,
  startNS: number,
  endNS: number
): Promise<Array<any>> => {
  let sqlIrq = `
select i.name              as irqName,
       sum(dur)            as wallDuration,
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
  return query('querySoftIrqDataBoxSelect', callIds.length > 0 ? sqlIrq : '', {});
};