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

export const chartVirtualMemoryDataSql = (args: any): string => {
  return `
    select ts - ${args.recordStartNS} as startTime,
           filter_id as filterId,
           value
    from sys_mem_measure
    where filter_id = ${args.filterId}`;
};

export const chartVirtualMemoryDataProtoSql = (args: any): string => {
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

let vmList: Array<any> = [];
let vmListMap = new Map<string, Array<any>>();

export function resetVM(): void {
  vmList = [];
  vmListMap.clear();
}

export function virtualMemoryDataReceiver(data: any, proc: Function): void {
  if (data.params.trafic === TraficEnum.Memory) {
    if (!vmListMap.has(data.params.filterId)) {
      vmList = proc(chartVirtualMemoryDataSql(data.params));
      vmListMap.set(data.params.filterId, vmList);
    }
    let list = vmListMap.get(data.params.filterId) || [];
    arrayBufferHandler(data, list, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  } else {
    let sql = chartVirtualMemoryDataProtoSql(data.params);
    let res = proc(sql);
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

function arrayBufferHandler(data: any, res: any[], transfer: boolean): void {
  let startTime = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startTime);
  let value = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.value);
  let filterID = new Uint8Array(transfer ? res.length : data.params.sharedArrayBuffers.filterID);
  res.forEach((it, i) => {
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.virtualMemData);
    startTime[i] = it.startTime;
    filterID[i] = it.filterId;
    value[i] = it.value;
  });
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
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
