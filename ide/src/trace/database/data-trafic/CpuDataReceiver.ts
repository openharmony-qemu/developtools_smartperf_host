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
import { Args } from './CommonArgs';

export const chartCpuDataProtoSql = (args: Args): string => {
  return `
      SELECT B.pid                                                                                        as processId,
             B.cpu,
             B.tid,
             B.itid                                                                                       as id,
             max(B.dur)                                                                                   AS dur,
             B.ts - ${args.recordStartNS}                                                                 AS startTime,
             ifnull(B.arg_setid, -1)                                                                      as argSetId,
             ((B.ts - ${args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)})) AS px
      from thread_state AS B
      where B.itid is not null
        and B.cpu = ${args.cpu}
        and startTime + dur >= ${Math.floor(args.startNS)}
        and startTime <= ${Math.floor(args.endNS)}
      group by px;`;
};

export const chartCpuDataProtoSqlMem = (args: Args): string => {
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

export function cpuDataReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    let res: unknown[];
    let list: unknown[];
    // @ts-ignore
    if (!cpuList.has(data.params.cpu)) {
      // @ts-ignore
      list = proc(chartCpuDataProtoSqlMem(data.params));
      for (let i = 0; i < list.length; i++) {
        // @ts-ignore
        if (list[i].dur === -1 || list[i].dur === null || list[i].dur === undefined) {
          // @ts-ignore
          list[i].nofinish = 1;
          if (i === list.length - 1) {
            // @ts-ignore
            list[i].dur = data.params.endNS - list[i].startTime;
          } else {
            // @ts-ignore
            list[i].dur = list[i + 1].startTime - list[i].startTime;
          }
        } else {
          // @ts-ignore
          list[i].nofinish = 0;
        }
      }
      // @ts-ignore
      cpuList.set(data.params.cpu, list);
    } else {
      // @ts-ignore
      list = cpuList.get(data.params.cpu) || [];
    }
    // @ts-ignore
    res = filterDataByGroup(list || [], 'startTime', 'dur', data.params.startNS, data.params.endNS, data.params.width);
    arrayBufferHandler(data, res, true);
  } else {
    // @ts-ignore
    let sql = chartCpuDataProtoSql(data.params);
    let res = proc(sql);
    // @ts-ignore
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

export function searchDataHandler(data: unknown): void {
  let res: unknown[] = [];
  // @ts-ignore
  let pidArr = data.params.pidArr as number[];
  // @ts-ignore
  let tidArr = data.params.tidArr as number[];
  for (let value of Array.from(cpuList.values())) {
    res.push(
      //@ts-ignore
      ...value.filter((cpuData) => pidArr.includes(cpuData.pid || cpuData.processId) || tidArr.includes(cpuData.tid))
    );
  }
  // @ts-ignore
  res.sort((dataA, dataB) => dataA.startTime - dataB.startTime);
  arrayBufferHandler(data, res, true);
}

function arrayBufferHandler(data: unknown, res: unknown[], transfer: boolean): void {
  // @ts-ignore
  let startTime = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startTime);
  // @ts-ignore
  let dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  // @ts-ignore
  let tid = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.tid);
  // @ts-ignore
  let id = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.id);
  // @ts-ignore
  let processId = new Int16Array(transfer ? res.length : data.params.sharedArrayBuffers.processId);
  // @ts-ignore
  let cpu = new Uint8Array(transfer ? res.length : data.params.sharedArrayBuffers.cpu);
  // @ts-ignore
  let argSetId = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.argSetId);
  // @ts-ignore
  let nofinish = new Uint8Array(transfer ? res.length : data.params.sharedArrayBuffers.nofinish);
  res.forEach((it, i) => {
    // @ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.cpuData);
    // @ts-ignore
    startTime[i] = it.startTime;
    // @ts-ignore
    dur[i] = it.dur;
    // @ts-ignore
    tid[i] = it.tid;
    // @ts-ignore
    cpu[i] = it.cpu;
    // @ts-ignore
    id[i] = it.id;
    // @ts-ignore
    nofinish[i] = it.nofinish;
    // @ts-ignore
    processId[i] = it.pid || it.processId;
    // @ts-ignore
    argSetId[i] = it.argSetId;
  });
  (self as unknown as Worker).postMessage(
    {
      // @ts-ignore
      id: data.id,
      // @ts-ignore
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
            nofinish: nofinish.buffer,
          }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer
      ? [
          startTime.buffer,
          dur.buffer,
          tid.buffer,
          id.buffer,
          processId.buffer,
          cpu.buffer,
          argSetId.buffer,
          nofinish.buffer,
        ]
      : []
  );
}
