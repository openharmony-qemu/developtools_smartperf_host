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
import { Args } from './CommonArgs';
import { TraficEnum } from './utils/QueryEnum';

export const chartSMapsDataSqlMem = (args: Args): string => {
  return `SELECT (A.timestamp - ${args.recordStartNS}) as startNs,
        sum(${args.name}) * 1024 as value
        FROM smaps A
        WHERE A.timestamp < ${args.recordEndNS}
        GROUP by A.timestamp`;
};
export const chartDmaDataSqlMem = (args: Args): string => {
  return `SELECT (A.ts - ${args.recordStartNS}) as startNs,
        sum(A.size) as value
        FROM memory_dma A
        WHERE A.flag = 0
        AND ${args.ipid} = A.ipid
        AND A.ts < ${args.recordEndNS}
        GROUP by A.ts`;
};
export const chartGpuMemoryDataSqlMem = (args: Args): string => {
  return ` SELECT (A.ts - ${args.recordStartNS}) as startNs,
        sum(A.used_gpu_size) as value
        FROM memory_process_gpu A
        WHERE ${args.ipid} = A.ipid
        AND A.ts < ${args.recordEndNS}
        GROUP by A.ts`;
};
export const chartGpuResourceDataSqlMem = (args: Args): string => {
  return `SELECT subquery1.startNs,
        (IFNULL(subquery1.totalSize, 0) - IFNULL(subquery2.size, 0)) AS value
        FROM
            (SELECT (ts - ${args.recordStartNS}) AS startNs,SUM(total_size) AS totalSize
            FROM memory_profile
            WHERE ts between ${args.recordStartNS} and ${args.recordEndNS}
            GROUP BY ts) AS subquery1
        LEFT JOIN
            (SELECT (ts - ${args.recordStartNS}) AS startNs, SUM(size) AS size
            FROM memory_window_gpu
            WHERE ts between ${args.recordStartNS} and ${args.recordEndNS}
            AND category_name_id = ${args.scratchId}
            GROUP BY ts) AS subquery2
        ON subquery1.startNs = subquery2.startNs`;
};
export const chartGpuDataSqlMem = (args: Args): string => {
  return `select (ts - ${args.recordStartNS}) startNs,
        sum(value) * 1024 value
        from process_measure
        where filter_id = (
            select id
            from process_measure_filter
            where name = ${args.name} and ipid = ${args.ipid}
            )
        and ts between ${args.recordStartNS} AND ${args.recordEndNS}
        group by ts;`;
};
export const chartGpuTotalDataSqlMem = (args: Args): string => {
  let moduleCondition = args.moduleId === null ? '' : `and module_name_id = ${args.moduleId}`;
  return `select (ts - ${args.recordStartNS}) startNs,
        sum(size) value
        from memory_window_gpu
        where window_name_id = 0 ${moduleCondition}
        and ts < ${args.recordEndNS}
        group by ts;`;
};
export const chartGpuWindowDataSqlMem = (args: Args): string => {
  let moduleCondition = args.moduleId === null ? '' : `and module_name_id = ${args.moduleId}`;
  return `select (ts - ${args.recordStartNS}) startNs,
        sum(size) value
        from memory_window_gpu
        where window_name_id = ${args.windowId} ${moduleCondition}
        and ts < ${args.recordEndNS}
        group by ts`;
};
export const chartShmDataSqlMem = (args: Args): string => {
  return `SELECT (A.ts - ${args.recordStartNS}) as startNs,
        sum(A.size) as value
        FROM memory_ashmem A
        where A.ipid = ${args.ipid}
        AND A.ts < ${args.recordEndNS}
        AND flag = 0
        GROUP by A.ts`;
};
export const chartPurgeableDataSqlMem = (args: Args): string => {
  const pinSql = args.isPin ? ' AND a.ref_count > 0' : '';
  const names = args.isPin ? " ('mem.purg_pin')" : "('mem.purg_sum')";
  return `SELECT startNs,
        sum( value ) AS value
        FROM (SELECT m.ts - ${args.recordStartNS} AS startNs,
            sum(m.value) AS value
            FROM process_measure m
            LEFT JOIN process_measure_filter f ON f.id = m.filter_id
            WHERE m.ts < ${args.recordEndNS}
            AND f.name = ${names}
            AND f.ipid = ${args.ipid}
            GROUP BY m.ts
        UNION ALL
            SELECT a.ts - ${args.recordStartNS} AS startNs,
            sum( a.pss ) AS value
            FROM memory_ashmem a
            WHERE a.ts < ${args.recordEndNS}
            AND a.flag = 0
            AND a.ipid = ${args.ipid}
            ${pinSql}
            GROUP BY a.ts)
         GROUP BY startNs`;
};
export const abilityPurgeablelDataSqlMem = (args: Args): string => {
  const pinCondition = args.isPin ? ' AND a.ref_count > 0' : '';
  const names = args.isPin ? " ('sys.mem.pined.purg')" : "('sys.mem.active.purg','sys.mem.inactive.purg')";
  return `SELECT startNs,
        sum( value ) AS value 
        FROM (SELECT m.ts - ${args.recordStartNS} AS startNs,
            sum( m.value ) AS value 
            FROM sys_mem_measure m
            LEFT JOIN sys_event_filter f ON f.id = m.filter_id 
            WHERE m.ts < ${args.recordEndNS}
            AND f.name IN ${names}
            GROUP BY m.ts 
        UNION ALL
            SELECT a.ts - ${args.recordStartNS} AS startNs,
            sum( a.size ) AS value 
            FROM  memory_ashmem a 
            WHERE a.ts < ${args.recordEndNS}
            AND a.flag = 0 
            ${pinCondition}
            GROUP BY a.ts ) 
        GROUP BY startNs`;
};
export const abilityDmaDataSqlMem = (args: Args): string => {
  return `SELECT (A.ts - ${args.recordStartNS}) as startNs,
        sum(A.size) as value,
        E.data as expTaskComm,
        A.flag as flag
        FROM memory_dma A
        left join data_dict as E on E.id=A.exp_task_comm_id
        WHERE A.flag = 0
        AND A.ts < ${args.recordEndNS}
        GROUP by A.ts;`;
};
export const abilityGpuMemoryDataSqlMem = (args: Args): string => {
  return `SELECT 
        (A.ts - ${args.recordStartNS}) as startNs,
        sum(A.used_gpu_size) as value
        FROM memory_process_gpu A
        WHERE A.ts < ${args.recordEndNS}
        GROUP by A.ts;`;
};
// @ts-ignore
let sMapsList: Array<unknown> = []; // @ts-ignore
let dmaList: Array<unknown> = []; // @ts-ignore
let gpuMemoryList: Array<unknown> = []; // @ts-ignore
let gpuList: Array<unknown> = []; // @ts-ignore
let gpuResourceList: Array<unknown> = []; // @ts-ignore
let gpuTotalList: Array<unknown> = []; // @ts-ignore
let gpuWindowList: Array<unknown> = []; // @ts-ignore
let shmList: Array<unknown> = []; // @ts-ignore
let purgeableList: Array<unknown> = []; // @ts-ignore
let sMapsMap = new Map<string, Array<unknown>>(); // @ts-ignore
let purgeableMap = new Map<string, Array<unknown>>(); // @ts-ignore
let gpuMap = new Map<string, Array<unknown>>(); // @ts-ignore
let abilityPurgeableMap: Map<string, Array<unknown>> = new Map(); // @ts-ignore
let abilityPurgeableList: Array<unknown> = []; // @ts-ignore
let abilityDmaList: Array<unknown> = []; // @ts-ignore
let abilityGpuMemoryList: Array<unknown> = [];

export function resetVmTracker(): void {
  sMapsList = [];
  dmaList = [];
  gpuMemoryList = [];
  gpuList = [];
  gpuResourceList = [];
  gpuTotalList = [];
  gpuWindowList = [];
  shmList = [];
  purgeableList = [];
  sMapsMap.clear();
  purgeableMap.clear();
  gpuMap.clear();
}

export function resetAbility(): void {
  abilityPurgeableList = [];
  abilityDmaList = [];
  abilityGpuMemoryList = [];
  abilityPurgeableMap.clear();
}

export function sMapsDataReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (!sMapsMap.has(data.params.name)) {
    // @ts-ignore
    sMapsList = proc(chartSMapsDataSqlMem(data.params)); // @ts-ignore
    sMapsMap.set(data.params.name, sMapsList);
  } // @ts-ignore
  let list = sMapsMap.get(data.params.name) || [];
  arrayBufferHandler(data, list, true);
}

export function dmaDataReceiver(data: unknown, proc: Function): void {
  if (dmaList.length === 0) {
    // @ts-ignore
    dmaList = proc(chartDmaDataSqlMem(data.params));
  }
  arrayBufferHandler(data, dmaList, true);
}

export function gpuMemoryDataReceiver(data: unknown, proc: Function): void {
  if (gpuMemoryList.length === 0) {
    // @ts-ignore
    gpuMemoryList = proc(chartGpuMemoryDataSqlMem(data.params));
  }
  arrayBufferHandler(data, gpuMemoryList, true);
}

export function gpuDataReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (!gpuMap.has(data.params.name)) {
    // @ts-ignore
    gpuList = proc(chartGpuDataSqlMem(data.params)); // @ts-ignore
    gpuMap.set(data.params.name, gpuList);
  } // @ts-ignore
  let list = gpuMap.get(data.params.name) || [];
  arrayBufferHandler(data, list, true);
}

export function gpuResourceDataReceiver(data: unknown, proc: Function): void {
  if (gpuResourceList.length === 0) {
    // @ts-ignore
    gpuResourceList = proc(chartGpuResourceDataSqlMem(data.params));
  }
  arrayBufferHandler(data, gpuResourceList, true);
}

export function gpuTotalDataReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (gpuTotalList.length === 0 || data.params.moduleId) {
    // @ts-ignore
    gpuTotalList = proc(chartGpuTotalDataSqlMem(data.params));
  }
  arrayBufferHandler(data, gpuTotalList, true);
}

export function gpuWindowDataReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (gpuWindowList.length === 0 || data.params.moduleId) {
    // @ts-ignore
    gpuWindowList = proc(chartGpuWindowDataSqlMem(data.params));
  }
  arrayBufferHandler(data, gpuWindowList, true);
}

export function shmDataReceiver(data: unknown, proc: Function): void {
  if (shmList.length === 0) {
    // @ts-ignore
    shmList = proc(chartShmDataSqlMem(data.params));
  }
  arrayBufferHandler(data, shmList, true);
}

export function purgeableDataReceiver(data: unknown, proc: Function): void {
  let key: string = '';
  if (
    // @ts-ignore
    data.params.isPin
  ) {
    key = 'pin';
  } else {
    key = 'total';
  }
  if (
    !purgeableMap.has(
      // @ts-ignore
      data.params.isPin
    )
  ) {
    purgeableList = proc(
      chartPurgeableDataSqlMem(
        // @ts-ignore
        data.params
      )
    );
    purgeableMap.set(key, purgeableList);
  }
  let list = purgeableMap.get(key) || [];
  arrayBufferHandler(data, list, true);
}

export function abilityPurgeableDataReceiver(data: unknown, proc: Function): void {
  let key = '';
  if (
    // @ts-ignore
    data.params.isPin
  ) {
    key = 'pin';
  } else {
    key = 'total';
  }
  if (!abilityPurgeableMap.has(key)) {
    abilityPurgeableList = proc(
      abilityPurgeablelDataSqlMem(
        // @ts-ignore
        data.params
      )
    );
    abilityPurgeableMap.set(key, abilityPurgeableList);
  }
  let abilityList = abilityPurgeableMap.get(key) || [];
  arrayBufferHandler(data, abilityList, true);
}

export function abilityDmaDataReceiver(data: unknown, proc: Function): void {
  if (abilityDmaList.length === 0) {
    // @ts-ignore
    abilityDmaList = proc(abilityDmaDataSqlMem(data.params));
  }
  arrayBufferHandler(data, abilityDmaList, true);
}

export function abilityGpuMemoryDataReceiver(data: unknown, proc: Function): void {
  if (abilityGpuMemoryList.length === 0) {
    // @ts-ignore
    abilityGpuMemoryList = proc(abilityGpuMemoryDataSqlMem(data.params));
  }
  arrayBufferHandler(data, abilityGpuMemoryList, true);
}

function arrayBufferHandler(data: unknown, res: unknown[], transfer: boolean): void {
  // @ts-ignore
  let startNs = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startNs); // @ts-ignore
  let value = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.value);
  res.forEach((it, i) => {
    // @ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.trackerData); // @ts-ignore
    startNs[i] = it.startNs; // @ts-ignore
    value[i] = it.value;
  });
  (self as unknown as Worker).postMessage(
    {
      // @ts-ignore
      id: data.id, // @ts-ignore
      action: data.action,
      results: transfer
        ? {
            startNs: startNs.buffer,
            value: value.buffer,
          }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer ? [startNs.buffer, value.buffer] : []
  );
}
