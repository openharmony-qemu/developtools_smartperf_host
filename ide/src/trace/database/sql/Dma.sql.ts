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
//   VM Tracker Dma泳道图
import { Dma, DmaComparison } from '../../bean/AbilityMonitor';
import { query } from '../SqlLite';
import { SnapshotStruct } from '../ui-worker/ProcedureWorkerSnapshot';

export const queryDmaSampsData = (process: number): Promise<Array<SnapshotStruct>> =>
  query(
    'queryDmaSampsData',
    `SELECT 
      (A.ts - B.start_ts) as startNs,
      sum(A.size) as value,
      A.flag as flag,
      A.ipid as ipid,
      E.data as expTaskComm
      FROM memory_dma A,trace_range B 
      left join data_dict as E on E.id=A.exp_task_comm_id
    WHERE
      A.flag = 0
      AND  $pid = A.ipid
      AND A.ts < B.end_ts
    GROUP by A.ts;`,
    { $pid: process }
  );

export const queryisExistsDmaData = (process: number): Promise<Array<SnapshotStruct>> =>
  query(
    'queryisExistsDmaData',
    `SELECT EXISTS (
        SELECT 1
        FROM memory_dma A,trace_range B
        left join data_dict as E on E.id=A.exp_task_comm_id
        WHERE A.flag = 0
        AND  $pid = A.ipid
        AND A.ts < B.end_ts
        GROUP by A.ts
    ) AS data_exists`,
    { $pid: process }
  );

//Ability Monitor Dma 框选
export const getTabDmaAbilityData = (leftNs: number, rightNs: number, dur: number): Promise<Array<Dma>> =>
  query<Dma>(
    'getTabDmaAbilityData',
    `SELECT (S.ts-TR.start_ts) as startNs,
        MAX(S.size) as maxSize,
        MIN(S.size) as minSize,
        Avg(S.size) as avgSize,
        E.pid as processId,
        E.name as processName
    from trace_range as TR,memory_dma as S
    left join process as E on E.ipid=S.ipid
    WHERE
      $leftNS <= startNs + ${dur} and $rightNS >= startNs
      and flag = 0
    GROUP by E.pid
              `,
    { $leftNS: leftNs, $rightNS: rightNs }
  );

//VM Tracker Dma 框选
export const getTabDmaVmTrackerData = (
  leftNs: number,
  rightNs: number,
  processId: number,
  dur: number
): Promise<Array<Dma>> =>
  query<Dma>(
    'getTabDmaVmTrackerData',
    `SELECT (S.ts-TR.start_ts) as startNs,
      MAX(S.size) as maxSize,
      MIN(S.size) as minSize,
      Avg(S.size) as avgSize
    from trace_range as TR,memory_dma as S
    left join data_dict as C on C.id=S.exp_task_comm_id
    where
      $leftNS <= startNs + ${dur} and $rightNS >= startNs
      and flag = 0
    and
        $pid = S.ipid
              `,
    { $leftNS: leftNs, $rightNS: rightNs, $pid: processId }
  );

//Ability Monitor Dma 点选
export const getTabDmaAbilityClickData = (startNs: number): Promise<Array<Dma>> =>
  query<Dma>(
    'getTabDmaAbilityClickData',
    `SELECT
  (S.ts-TR.start_ts) as startNs,
    S.fd as fd,
    S.size as size,
    S.ino as ino,
    S.exp_pid as expPid,
    buf_name_id as bufName,
    exp_name_id as expName,
    exp_task_comm_id as expTaskComm,
    E.pid as processId,
    E.name as processName,
    S.flag as flag
    from trace_range as TR,memory_dma as S
    left join process as E on E.ipid=S.ipid
    WHERE
    startNs = ${startNs}
              `,
    { $startNs: startNs }
  );

//VM Tracker Dma 点选
export const getTabDmaVMTrackerClickData = (startNs: number, processId: number): Promise<Array<Dma>> =>
  query<Dma>(
    'getTabDmaVMTrackerClickData',
    `SELECT
    (S.ts-TR.start_ts) as startNs,
    S.fd as fd,
    S.size as size,
    S.ino as ino,
    S.exp_pid as expPid,
    buf_name_id as bufName,
    exp_name_id as expName,
    exp_task_comm_id as expTaskComm,
    S.flag as flag
    from trace_range as TR,memory_dma as S
    WHERE
    startNs = ${startNs}
    AND
    $pid = S.ipid
              `,
    { $startNs: startNs, $pid: processId }
  );

//Ability Monitor Dma 点选比较
export const getTabDmaAbilityComparisonData = (startNs: number): Promise<Array<DmaComparison>> =>
  query<DmaComparison>(
    'getTabDmaAbilityComparisonData',
    `SELECT
      (S.ts-TR.start_ts) as startNs,
      sum(S.size) as value,
      E.pid as processId,
      E.name as processName
      from trace_range as TR,memory_dma as S
      left join process as E on E.ipid=S.ipid
      WHERE
      startNs = ${startNs}
      GROUP by
      E.pid
                `,
    { $startNs: startNs }
  );

//VM Tracker Dma 点选比较
export const getTabDmaVmTrackerComparisonData = (startNs: number, processId: number): Promise<Array<DmaComparison>> =>
  query<DmaComparison>(
    'getTabDmaVmTrackerComparisonData',
    `SELECT
    (S.ts-TR.start_ts) as startNs,
    sum(S.size) as value
    from trace_range as TR,memory_dma as S
    WHERE
    startNs = ${startNs}
    AND
    $pid = S.ipid
                `,
    { $startNs: startNs, $pid: processId }
  );
