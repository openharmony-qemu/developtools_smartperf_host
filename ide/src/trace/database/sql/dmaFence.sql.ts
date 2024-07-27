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
import { query } from '../SqlLite';
import { DmaFenceDataBean } from '../../../trace/component/trace/sheet/dma-fence/DmaFenceBean';

export const queryDmaFenceName = (): Promise<Array<{timeline:string}>> =>
  query(
    'queryDmaFenceName',
    `SELECT DISTINCT timeline  
     FROM dma_fence;`
  );
export const queryDmaFenceIdAndCat = (): Promise<Array<{ id: number; cat: string; seqno: number;driver:string;context:string}>> =>
  query(
    'queryDmaFenceIdAndCat',
    `SELECT
       id,
       cat,
       seqno,
       driver,
       context 
     FROM
       dma_fence;`
  );

export const queryDmaFenceData = (leftNS: number, rightNS: number, nameList: String[]): Promise<Array<DmaFenceDataBean>> =>{
  const inClause = nameList.map(name => `'${name}'`).join(', ');
  const sql = `WITH state AS (
        SELECT
          id,
          ts,
          cat,
          driver,
          timeline,
          context,
          seqno,
        CASE
            WHEN LAG( cat ) OVER ( PARTITION BY timeline ORDER BY ts ) = 'dma_fence_init' AND  LAG(driver) OVER (PARTITION BY timeline ORDER BY ts) = ''
            THEN LAG( ts, 2 ) OVER ( PARTITION BY timeline ORDER BY ts ) 
            ELSE LAG( ts ) OVER ( PARTITION BY timeline ORDER BY ts ) 
            END AS new_ts,
        CASE
            WHEN LAG( cat ) OVER ( PARTITION BY timeline ORDER BY ts ) = 'dma_fence_init' AND  LAG(driver) OVER (PARTITION BY timeline ORDER BY ts) = ''
            THEN Dur + LAG( dur ) OVER ( PARTITION BY timeline ORDER BY ts ) 
            ELSE Dur 
            END AS newDur,
        ROW_NUMBER( ) OVER ( PARTITION BY timeline ORDER BY ts ) AS rn
        FROM
            dma_fence 
        WHERE
            timeline IN ( ${inClause} ) 
          )
        SELECT
          s.id,
          s.new_ts - COALESCE( r.start_ts, 0 ) AS startTime,
          s.newDur AS dur,
          s.new_ts - COALESCE(r.start_ts, 0) + s.newDur AS endTime,    
          s.cat,
          s.driver,
          s.timeline,
          s.context,
          s.seqno 
        FROM
          state s
          LEFT JOIN trace_range r ON s.new_ts BETWEEN r.start_ts AND r.end_ts 
        WHERE
          s.driver <> '' 
          AND s.cat <> 'dma_fence_init' 
          AND s.rn > 1 
          AND (  
            s.new_ts BETWEEN ${leftNS} + r.start_ts AND ${rightNS} + r.start_ts   
            OR   
            (s.new_ts + s.newDur) BETWEEN ${leftNS} + r.start_ts AND ${rightNS} + r.start_ts 
            OR 
            (s.new_ts < ${leftNS} + r.start_ts AND (s.new_ts + s.newDur) > ${rightNS} + r.start_ts)
          ) 
        ORDER BY
          s.new_ts;`;
  return query('queryDmaFenceData', sql); 
};