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
import { filterDataByGroup } from './utils/DataFilter';
import { cpuList } from './utils/AllMemoryCache';

export const chartCpuDataProtoSql = (args: any): string => {
  return `
      SELECT B.pid                                                                                        as processId,
             B.cpu,
             B.tid,
             B.itid                                                                                       as id,
             max(B.dur)                                                                                   AS dur,
             B.ts - ${
               args.recordStartNS
             }                                                                                            AS startTime,
             ifnull(B.arg_setid, -1)                                                                      as argSetId,
             ((B.ts - ${args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)})) AS px
      from thread_state AS B
      where B.itid is not null
        and B.cpu = ${args.cpu}
        and startTime + dur >= ${Math.floor(args.startNS)}
        and startTime <= ${Math.floor(args.endNS)}
      group by px;`;
};

export const chartCpuDataProtoSqlMem = (args: any): string => {
  return `
      SELECT B.pid                        as processId,
             B.cpu,
             B.tid,
             B.itid                       as id,
             B.dur                        AS dur,
             B.ts - ${args.recordStartNS} AS startTime,
             ifnull(B.arg_setid, -1)      as argSetId
      from thread_state AS B
      where B.itid is not null
        and B.cpu = ${args.cpu};`;
};

export function cpuDataReceiver(data: any, proc: Function): void {
  if (data.params.trafic === TraficEnum.Memory) {
    let res: any[], list: any[];
    if (!cpuList.has(data.params.cpu)) {
      list = proc(chartCpuDataProtoSqlMem(data.params));
      for (let i = 0; i < list.length; i++) {
        if (list[i].dur == -1) {
          list[i].nofinish = 1;
          if (i === list.length - 1) {
            list[i].dur = data.params.endNS - list[i].startTime;
          } else {
            list[i].dur = list[i + 1].startTime - list[i].startTime;
          }
        } else {
          list[i].nofinish = 0;
        }
      }
      cpuList.set(data.params.cpu, list);
    } else {
      list = cpuList.get(data.params.cpu) || [];
    }
    res = filterDataByGroup(list || [], 'startTime', 'dur', data.params.startNS, data.params.endNS, data.params.width);
    arrayBufferHandler(data, res, true);
  } else {
    let sql = chartCpuDataProtoSql(data.params);
    let res = proc(sql);
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

export function searchDataHandler(data: any): void {
  let res: any[] = [];
  let pidArr = data.params.pidArr as number[];
  let tidArr = data.params.tidArr as number[];
  for (let value of Array.from(cpuList.values())) {
    res.push(...value.filter((cpuData) => pidArr.includes(cpuData.processId) || tidArr.includes(cpuData.tid)));
  }
  res.sort((dataA, dataB) => dataA.startTime - dataB.startTime);
  arrayBufferHandler(data, res, true);
}

function arrayBufferHandler(data: any, res: any[], transfer: boolean): void {
  let startTime = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startTime);
  let dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  let tid = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.tid);
  let id = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.id);
  let processId = new Int16Array(transfer ? res.length : data.params.sharedArrayBuffers.processId);
  let cpu = new Uint8Array(transfer ? res.length : data.params.sharedArrayBuffers.cpu);
  let argSetId = new Int8Array(transfer ? res.length : data.params.sharedArrayBuffers.argSetId);
  let nofinish = new Uint8Array(transfer ? res.length : data.params.sharedArrayBuffers.nofinish);
  res.forEach((it, i) => {
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.cpuData);
    startTime[i] = it.startTime;
    dur[i] = it.dur;
    tid[i] = it.tid;
    cpu[i] = it.cpu;
    id[i] = it.id;
    nofinish[i] = it.nofinish;
    processId[i] = it.processId;
    argSetId[i] = it.argSetId;
  });
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
      action: data.action,
      results: transfer
        ? {
            startTime: startTime.buffer,
            dur: dur.buffer,
            tid: tid.buffer,
            id: id.buffer,
            processId: processId.buffer,
            cpu: cpu.buffer,
            argSetID: argSetId.buffer,
          }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer ? [startTime.buffer, dur.buffer, tid.buffer, id.buffer, processId.buffer, cpu.buffer, argSetId.buffer] : []
  );
}
