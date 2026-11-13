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
import { Smaps } from '../../bean/SmapsStruct';

export const querySmapsExits = (): Promise<Array<unknown>> =>
  query(
    'querySmapsExits',
    `select
      event_name
      from stat s
      where s.event_name = 'trace_smaps'
      and s.stat_type ='received' and s.count > 0`
  );

export const querySmapsData = (columnName: string): Promise<Array<unknown>> =>
  query(
    'querySmapsCounterData',
    `SELECT 
    (A.timestamp - B.start_ts) as startNs, 
    sum(${columnName}) * 1024 as value, 
    $columnName as name 
    FROM smaps A,trace_range B WHERE A.timestamp < B.end_ts GROUP by A.timestamp;`,
    { $columnName: columnName }
  );

export const querySmapsDataMax = (columnName: string): Promise<Array<unknown>> =>
  query(
    'querySmapsDataMax',
    `
   SELECT 
   (A.timestamp - B.start_ts) as startNS,
   sum(${columnName}) as max_value 
   FROM smaps A,trace_range B GROUP by A.timestamp order by max_value desc LIMIT 1`
  );

export const getTabSmapsMaxSize = (leftNs: number, rightNs: number, dur: number):
  Promise<Array<unknown>> =>
  query<Smaps>(
    'getTabSmapsMaxRss',
    `
      SELECT 
      (A.timestamp - B.start_ts) as startNS, 
      sum(virtaul_size) *1024 as max_value 
      FROM smaps A,trace_range B where startNS <= $rightNs and (startNS+$dur)>=$leftNs`,
    { $rightNs: rightNs, $leftNs: leftNs, $dur: dur }
  );

export const getTabSmapsData = (leftNs: number, rightNs: number, dur: number):
  Promise<Array<Smaps>> =>
  query<Smaps>(
    'getTabSmapsData',
    `
    SELECT
     (A.timestamp - t.start_ts) AS startNs,
     start_addr as startAddr,
     end_addr as endAddr,
     A.type,
     resident_size * 1024 AS rss,
     protection_id as pid,
     pss * 1024 as pss,virtaul_size * 1024 AS size,reside,A.path_id AS path,
     shared_clean * 1024 as sharedClean,
     shared_dirty * 1024 as sharedDirty,
     private_clean * 1024 as privateClean,
     private_dirty * 1024 as privateDirty,swap * 1024 as swap,swap_pss * 1024 as swapPss
     FROM smaps A,
     trace_range AS t
     WHERE (startNs) <= $rightNs and (startNs+$dur) >=$leftNs`,
    { $rightNs: rightNs, $leftNs: leftNs, $dur: dur },
  );
export const getTabSmapsSampleData = (leftNs: number): Promise<Array<Smaps>> =>
  query<Smaps>(
    'getTabSmapsSampleData',
    `
      SELECT
     (A.timestamp - t.start_ts) AS startNs,
     start_addr as startAddr,
     end_addr as endAddr,
     A.type,
     resident_size * 1024 AS rss,
     protection_id as pid,
     pss * 1024 as pss,virtaul_size * 1024 AS size,reside,A.path_id AS path,
     shared_clean * 1024 as sharedClean,
     shared_dirty * 1024 as sharedDirty,
     private_clean * 1024 as privateClean,
     private_dirty * 1024 as privateDirty,swap * 1024 as swap,swap_pss * 1024 as swapPss
     FROM smaps A,
     trace_range AS t
     WHERE (startNs) = ${leftNs}`,
    { $leftNs: leftNs },
  );
// VM Tracker Smaps Record Tab页
export const querySmapsRecordTabData = (
  startNs: number,
  ipid: number,
  pixelmapId: number,
  typeId: number
): Promise<Array<{ name: string; size: number }>> =>
  query(
    'querySmapsRecordTabData',
    `select  'RenderServiceCpu' as name, IFNULL(sum(mem_size), 0) as size 
    from memory_rs_image, trace_range tr
    where ipid = ${ipid} and (ts - tr.start_ts) = ${startNs} and type_id = ${pixelmapId}
    union all
    select 'SkiaCpu' as name, total_size as size from memory_cpu,trace_range
    where (ts - start_ts) = ${startNs}
    union all
    select 'GLESHostCache' as name, 0
    union all
    select 'VirtaulSize' as name, sum(virtaul_size) * 1024 as size from smaps, trace_range
    where type = ${typeId} and (timeStamp - start_ts) = ${startNs}`
  );

export const getTabSmapsStatisticMaxSize = (rightNs: number): Promise<Array<unknown>> =>
  query<Smaps>(
    'getTabSmapsStatisticMaxRss',
    `
    SELECT 
    (A.timestamp - B.start_ts) as startNS, 
    sum(virtaul_size) * 1024 as max_value 
    FROM smaps A,trace_range B where startNS = $rightNs`,
    { $rightNs: rightNs }
  );

export const getTabSmapsStatisticData = (rightNs: number): Promise<Array<Smaps>> =>
  query<Smaps>(
    'getTabSmapsStatisticData',
    `SELECT
     (A.timestamp - t.start_ts) AS startNs,
     start_addr as startAddr,
     end_addr as endAddr,
     A.type,
     sum(resident_size) * 1024 AS rss,
     protection_id as pid,
     count(A.path_id) as count,
     sum(pss) * 1024 as pss ,
     sum(virtaul_size) * 1024 AS size,
     sum(reside) as reside,
     A.path_id AS path,
     sum(shared_clean) * 1024 as sharedClean,sum(shared_dirty) * 1024 as sharedDirty,
     sum(private_clean) * 1024 as privateClean,sum(private_dirty) * 1024 as privateDirty,
     sum(swap) * 1024 as swap,sum(swap_pss) * 1024 as swapPss
     FROM smaps A,
     trace_range AS t
     WHERE (startNs) =$rightNs
     group by type,path`,
    { $rightNs: rightNs }
  );


export const getTabSmapsStatisticSelectData = (leftNs: number, rightNs: number, dur: number):
  Promise<Array<Smaps>> =>
  query<Smaps>(
    'getTabSmapsStatisticData',
    `SELECT
     (A.timestamp - t.start_ts) AS startNs,
     start_addr as startAddr,
     end_addr as endAddr,
     A.type,
     sum(resident_size) * 1024 AS rss,
     protection_id as pid,
     count(A.path_id) as count,
     sum(pss) * 1024 as pss ,sum(virtaul_size) * 1024 AS size,sum(reside) as reside,
     A.path_id AS path,
     sum(shared_clean) * 1024 as sharedClean,sum(shared_dirty) * 1024 as sharedDirty,
     sum(private_clean) * 1024 as privateClean,sum(private_dirty) * 1024 as privateDirty,
     sum(swap) * 1024 as swap,sum(swap_pss) * 1024 as swapPss
     FROM smaps A,
     trace_range AS t
     WHERE (startNs) <=$rightNs and (startNs+$dur)>=$leftNs
     group by type,path`,
    { $rightNs: rightNs, $leftNs: leftNs, $dur: dur },
  );
