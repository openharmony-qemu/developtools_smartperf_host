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

import { TraficEnum } from './QueryEnum';
export const cpuAbilityMonitorDataProtoSql = (args: any): string => {
  return `select 
        (t.total_load) as value,
        (t.ts - ${args.recordStartNS} ) as startNs,
        max(ifnull(t.dur, ${args.recordEndNS} - t.ts)) as dur,
        ((t.ts - ${args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)})) as px
        from cpu_usage t 
        where startNs + (ifnull(dur,0)) >= ${Math.floor(args.startNS)}
        and startNs <= ${Math.floor(args.endNS)}
        group by px`;
};
export const cpuAbilityUserDataProtoSql = (args: any): string => {
  return `select 
        t.user_load as value,
        (t.ts - ${args.recordStartNS} ) as startNs,
        max(ifnull(t.dur, ${args.recordEndNS} - t.ts)) as dur,
        ((t.ts - ${args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)})) as px
        from cpu_usage t 
        where startNs + (ifnull(dur,0)) >= ${Math.floor(args.startNS)}
        and startNs <= ${Math.floor(args.endNS)}
        group by px`;
};
export const cpuAbilitySystemDataProtoSql = (args: any): string => {
  return `select 
        t.system_load as value,
        (t.ts - ${args.recordStartNS} ) as startNs,
        max(ifnull(t.dur, ${args.recordEndNS} - t.ts)) as dur,
        ((t.ts - ${args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)})) as px
        from cpu_usage t 
        where startNs + (ifnull(dur,0)) >= ${Math.floor(args.startNS)}
        and startNs <= ${Math.floor(args.endNS)}
        group by px`;
};
export const abilityMemoryDataProtoSql = (args: any): string => {
  return `select 
        t.value as value,
        (t.ts - ${args.recordStartNS} ) as startNs,
        t.dur as dur,
        ((t.ts - ${args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)})) as px
        from sys_mem_measure t 
        where t.filter_id = ${args.id}
        and startNs + (ifnull(dur,0)) >= ${Math.floor(args.startNS)}
        and startNs <= ${Math.floor(args.endNS)}
        group by px`;
};
export const abilityBytesReadDataProtoSql = (args: any): string => {
  return `select 
        t.rd_speed as value,
        (t.ts - ${args.recordStartNS} ) as startNs,
        max(ifnull(t.dur, ${args.recordEndNS} - t.ts)) as dur,
        ((t.ts - ${args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)})) as px
        from diskio t 
        where startNs + (ifnull(dur,0)) >= ${Math.floor(args.startNS)}
        and startNs <= ${Math.floor(args.endNS)}
        group by px`;
};
export const abilityBytesWrittenDataProtoSql = (args: any): string => {
  return `select 
        t.wr_speed as value,
        (t.ts - ${args.recordStartNS} ) as startNs,
        max(ifnull(t.dur, ${args.recordEndNS} - t.ts)) as dur,
        ((t.ts - ${args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)})) as px
        from diskio t 
        where startNs + (ifnull(dur,0)) >= ${Math.floor(args.startNS)}
        and startNs <= ${Math.floor(args.endNS)}
        group by px`;
};
export const abilityReadOpsDataProtoSql = (args: any): string => {
  return `select 
        t.rd_count_speed as value,
        (t.ts - ${args.recordStartNS} ) as startNs,
        max(ifnull(t.dur, ${args.recordEndNS} - t.ts)) as dur,
        ((t.ts - ${args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)})) as px
        from diskio t 
        where startNs + (ifnull(dur,0)) >= ${Math.floor(args.startNS)}
        and startNs <= ${Math.floor(args.endNS)}
        group by px`;
};
export const abilityWrittenOpsDataProtoSql = (args: any): string => {
  return `select 
        t.wr_count_speed as value,
        (t.ts - ${args.recordStartNS} ) as startNs,
        max(ifnull(t.dur, ${args.recordEndNS} - t.ts)) as dur,
        ((t.ts - ${args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)})) as px
        from diskio t 
        where startNs + (ifnull(dur,0)) >= ${Math.floor(args.startNS)}
        and startNs <= ${Math.floor(args.endNS)}
        group by px`;
};
export const abilityBytesInTraceDataProtoSql = (args: any): string => {
  return `select 
        t.tx_speed as value,
        (t.ts - ${args.recordStartNS} ) as startNs,
        t.dur as dur,
        ((t.ts - ${args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)})) as px
        from network t 
        where startNs + (ifnull(dur,0)) >= ${Math.floor(args.startNS)}
        and startNs <= ${Math.floor(args.endNS)}
        group by px`;
};
export const abilityBytesOutTraceDataProtoSql = (args: any): string => {
  return `select 
        t.rx_speed as value,
        (t.ts - ${args.recordStartNS} ) as startNs,
        max(ifnull(t.dur, ${args.recordEndNS} - t.ts)) as dur,
        ((t.ts - ${args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)})) as px
        from network t 
        where startNs + (ifnull(dur,0)) >= ${Math.floor(args.startNS)}
        and startNs <= ${Math.floor(args.endNS)}
        group by px`;
};
export const abilityPacketInDataProtoSql = (args: any): string => {
  return `select 
        t.packet_in_sec as value,
        (t.ts - ${args.recordStartNS} ) as startNs,
        max(ifnull(t.dur, ${args.recordEndNS} - t.ts)) as dur,
        ((t.ts - ${args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)})) as px
        from network t 
        where startNs + (ifnull(dur,0)) >= ${Math.floor(args.startNS)}
        and startNs <= ${Math.floor(args.endNS)}
        group by px`;
};
export const abilityPacketsOutDataProtoSql = (args: any): string => {
  return `select 
        t.packet_out_sec as value,
        (t.ts - ${args.recordStartNS} ) as startNs,
        max(ifnull(t.dur, ${args.recordEndNS} - t.ts)) as dur,
        ((t.ts - ${args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)})) as px
        from network t 
        where startNs + (ifnull(dur,0)) >= ${Math.floor(args.startNS)}
        and startNs <= ${Math.floor(args.endNS)}
        group by px`;
};

/**
 * @param data
 * @param proc
 */
export function cpuAbilityMonitorDataReceiver(data: any, proc: Function): void {
  let sql = cpuAbilityMonitorDataProtoSql(data.params);
  let res = proc(sql);
  cpuArrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
}
export function cpuAbilityUserDataReceiver(data: any, proc: Function): void {
  let sql = cpuAbilityUserDataProtoSql(data.params);
  let res = proc(sql);
  cpuArrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
}
export function cpuAbilitySystemDataReceiver(data: any, proc: Function): void {
  let sql = cpuAbilitySystemDataProtoSql(data.params);
  let res = proc(sql);
  cpuArrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
}
export function abilityMemoryUsedDataReceiver(data: any, proc: Function): void {
  let sql = abilityMemoryDataProtoSql(data.params);
  let res = proc(sql);
  arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
}
export function abilityBytesReadDataReceiver(data: any, proc: Function): void {
  let sql = abilityBytesReadDataProtoSql(data.params);
  let res = proc(sql);
  arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
}
export function abilityBytesWrittenDataReceiver(data: any, proc: Function): void {
  let sql = abilityBytesWrittenDataProtoSql(data.params);
  let res = proc(sql);
  arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
}
export function abilityReadOpsDataReceiver(data: any, proc: Function): void {
  let sql = abilityReadOpsDataProtoSql(data.params);
  let res = proc(sql);
  arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
}
export function abilityWrittenOpsDataReceiver(data: any, proc: Function): void {
  let sql = abilityWrittenOpsDataProtoSql(data.params);
  let res = proc(sql);
  arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
}
export function abilityBytesInTraceDataReceiver(data: any, proc: Function): void {
  let sql = abilityBytesInTraceDataProtoSql(data.params);
  let res = proc(sql);
  arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
}
export function abilityBytesOutTraceDataReceiver(data: any, proc: Function): void {
  let sql = abilityBytesOutTraceDataProtoSql(data.params);
  let res = proc(sql);
  arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
}
export function abilityPacketInTraceDataReceiver(data: any, proc: Function): void {
  let sql = abilityPacketInDataProtoSql(data.params);
  let res = proc(sql);
  arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
}
export function abilityPacketsOutTraceDataReceiver(data: any, proc: Function): void {
  let sql = abilityPacketsOutDataProtoSql(data.params);
  let res = proc(sql);
  arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
}

function arrayBufferHandler(data: any, res: any[], transfer: boolean): void {
  let startNS = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startNS);
  let value = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.value);
  let dur = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  res.forEach((it, i) => {
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.abilityData);
    startNS[i] = it.startNs;
    value[i] = it.value;
    dur[i] = it.dur;
  });
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
      action: data.action,
      results: transfer
        ? {
            startNS: startNS.buffer,
            value: value.buffer,
            dur: dur.buffer,
          }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer ? [startNS.buffer, value.buffer, dur.buffer] : []
  );
}

function cpuArrayBufferHandler(data: any, res: any[], transfer: boolean): void {
  let startNS = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startNS);
  let value = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.value);
  let dur = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  res.forEach((it, i) => {
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.cpuAbilityData);
    startNS[i] = it.startNs;
    value[i] = it.value;
    dur[i] = it.dur;
  });
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
      action: data.action,
      results: transfer
        ? {
            startNS: startNS.buffer,
            value: value.buffer,
            dur: dur.buffer,
          }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer ? [startNS.buffer, value.buffer, dur.buffer] : []
  );
}
