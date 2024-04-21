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

import { Args } from './CommonArgs';
import { TraficEnum } from './utils/QueryEnum';

export const chartVirtualMemoryDataSql = (args: Args): string => {
  return `
    select ts - ${args.recordStartNS} as startTime,
           filter_id as filterId,
           value
    from sys_mem_measure
    where filter_id = ${args.filterId}`;
};

export const chartVirtualMemoryDataProtoSql = (args: Args): string => {
  return `
    select ts - ${args.recordStartNS} as startTime,
           filter_id as filterId,
           value,
           ((ts - ${args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)})) AS px
    from sys_mem_measure
    where filter_id = ${args.filterId}
      and startTime + (ifnull(dur,0)) >= ${Math.floor(args.startNS)}
      and startTime <= ${Math.floor(args.endNS)}
    group by px;`;
};

let vmList: Array<unknown> = []; // @ts-ignore
let vmListMap = new Map<string, Array<unknown>>();

export function resetVM(): void {
  vmList = [];
  vmListMap.clear();
}

export function virtualMemoryDataReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    // @ts-ignore
    if (!vmListMap.has(data.params.filterId)) {
      // @ts-ignore
      vmList = proc(chartVirtualMemoryDataSql(data.params)); // @ts-ignore
      vmListMap.set(data.params.filterId, vmList);
    } // @ts-ignore
    let list = vmListMap.get(data.params.filterId) || []; // @ts-ignore
    arrayBufferHandler(data, list, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  } else {
    // @ts-ignore
    let sql = chartVirtualMemoryDataProtoSql(data.params);
    let res = proc(sql); // @ts-ignore
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

function arrayBufferHandler(data: unknown, res: unknown[], transfer: boolean): void {
  // @ts-ignore
  let startTime = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startTime); // @ts-ignore
  let value = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.value); // @ts-ignore
  let filterID = new Uint8Array(transfer ? res.length : data.params.sharedArrayBuffers.filterID);
  res.forEach((it, i) => {
    // @ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.virtualMemData); // @ts-ignore
    startTime[i] = it.startTime; // @ts-ignore
    filterID[i] = it.filterId; // @ts-ignore
    value[i] = it.value;
  });
  (self as unknown as Worker).postMessage(
    {
      // @ts-ignore
      id: data.id, // @ts-ignore
      action: data.action,
      results: transfer
        ? {
            startTime: startTime.buffer,
            value: value.buffer,
            filterID: filterID.buffer,
          }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer ? [startTime.buffer, value.buffer, filterID.buffer] : []
  );
}
