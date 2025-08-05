// Copyright (c) 2021 Huawei Device Co., Ltd.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { TraficEnum } from './utils/QueryEnum';
import { dmaFenceList } from './utils/AllMemoryCache';
import { filterDataByGroup } from './utils/DataFilter';
export const queryPresentInfo = (args: unknown): string => {
  return `WITH state AS (  
    SELECT      
        id,     
        ts,      
        cat,      
        driver,      
        timeline,      
        context,      
        seqno,    
        CASE       
           WHEN LAG(cat) OVER (ORDER BY ts) = '${//@ts-ignore
    args.dmaFenceInit}'  AND  LAG(driver) OVER (ORDER BY ts) = ''   
				   THEN LAG(ts, 2) OVER (ORDER BY ts) 
           ELSE LAG(ts) OVER (ORDER BY ts)      
        END AS new_ts,    
        CASE    
            WHEN LAG(cat) OVER (ORDER BY ts) = '${//@ts-ignore
    args.dmaFenceInit}' AND  LAG(driver) OVER (ORDER BY ts) = '' 
            THEN Dur + LAG(dur) OVER (ORDER BY ts)      
            ELSE Dur     
        END AS newDur,    
        ROW_NUMBER() OVER (ORDER BY ts) AS rn 
        FROM  
        dma_fence  
        WHERE  
        timeline = '${//@ts-ignore
    args.dmaFenceName}'  
    )  
    SELECT    
        s.id,    
        s.new_ts - COALESCE(r.start_ts, 0) AS startTime,    
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
        s.cat <> '${//@ts-ignore
    args.dmaFenceInit}'
    		AND s.rn > 1
    ORDER BY    
        s.new_ts;`;
};

export function dmaFenceReceiver(data: unknown, proc: Function): void {
  //@ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    let res: unknown[];
    //@ts-ignore
    if (!dmaFenceList.has(data.params.dmaFenceName)) {
      //@ts-ignore
      res = proc(queryPresentInfo(data.params));
      //@ts-ignore
      dmaFenceList.set(data.params.dmaFenceName, res);
    } else {
      //@ts-ignore
      res = dmaFenceList.get(data.params.dmaFenceName) || [];
    }
    //@ts-ignore
    res = filterDataByGroup(res || [], 'startTime', 'dur', data.params.startNS, data.params.endNS, data.params.width, '', undefined, true, true);
    arrayBufferHandler(data, res, true);
  } else {
    //@ts-ignore
    let sql = queryPresentInfo(data.params);
    let res = proc(sql);
    //@ts-ignore
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

function arrayBufferHandler(data: unknown, res: unknown[], transfer: boolean): void {
  //@ts-ignore
  let startTime = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startTime);
  //@ts-ignore
  let dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  //@ts-ignore
  let id = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.id);
  res.forEach((it, i) => {
    //@ts-ignore
    startTime[i] = it.startTime;
    //@ts-ignore
    dur[i] = it.dur;
    //@ts-ignore
    id[i] = it.id;
  });
  (self as unknown as Worker).postMessage(
    {
      //@ts-ignore
      id: data.id,
      //@ts-ignore
      action: data.action,
      results: transfer
        ? {
          startTime: startTime.buffer,
          dur: dur.buffer,
          id: id.buffer,
        }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer ? [startTime.buffer, dur.buffer, id.buffer] : []
  );
}