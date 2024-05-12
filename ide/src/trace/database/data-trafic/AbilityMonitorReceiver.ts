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
export const cpuAbilityMonitorDataSql = (args: Args): string => {
  return `select 
        (t.total_load) as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from cpu_usage t`;
};
export const cpuAbilityUserDataSql = (args: Args): string => {
  return `select 
        t.user_load as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from cpu_usage t`;
};
export const cpuAbilitySystemDataSql = (args: Args): string => {
  return `select 
        t.system_load as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from cpu_usage t`;
};
export const abilityMemoryDataSql = (args: Args): string => {
  return `select 
        t.value as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from sys_mem_measure t 
        where t.filter_id = ${args.id}`;
};
export const abilityBytesReadDataSql = (args: Args): string => {
  return `select 
        t.rd_speed as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from diskio t`;
};
export const abilityBytesWrittenDataSql = (args: Args): string => {
  return `select 
        t.wr_speed as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from diskio t`;
};
export const abilityReadOpsDataSql = (args: Args): string => {
  return `select 
        t.rd_count_speed as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from diskio t`;
};
export const abilityWrittenOpsDataSql = (args: Args): string => {
  return `select 
        t.wr_count_speed as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from diskio t`;
};
export const abilityBytesInTraceDataSql = (args: Args): string => {
  return `select 
        t.tx_speed as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from network t`;
};
export const abilityBytesOutTraceDataSql = (args: Args): string => {
  return `select 
        t.rx_speed as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from network t`;
};
export const abilityPacketInDataSql = (args: Args): string => {
  return `select 
        t.packet_in_sec as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from network t`;
};
export const abilityPacketsOutDataSql = (args: Args): string => {
  return `select 
        t.packet_out_sec as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from network t`;
};
export const cpuAbilityMonitorDataProtoSql = (args: Args): string => {
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
export const cpuAbilityUserDataProtoSql = (args: Args): string => {
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
export const cpuAbilitySystemDataProtoSql = (args: Args): string => {
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
export const abilityMemoryDataProtoSql = (args: Args): string => {
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
export const abilityBytesReadDataProtoSql = (args: Args): string => {
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
export const abilityBytesWrittenDataProtoSql = (args: Args): string => {
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
export const abilityReadOpsDataProtoSql = (args: Args): string => {
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
export const abilityWrittenOpsDataProtoSql = (args: Args): string => {
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
export const abilityBytesInTraceDataProtoSql = (args: Args): string => {
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
export const abilityBytesOutTraceDataProtoSql = (args: Args): string => {
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
export const abilityPacketInDataProtoSql = (args: Args): string => {
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
export const abilityPacketsOutDataProtoSql = (args: Args): string => {
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

let totalList: Array<unknown> = [];
let userList: Array<unknown> = [];
let systemList: Array<unknown> = [];
let memoryList: Array<unknown> = [];
let memoryListMap = new Map<string, Array<unknown>>();
let bytesReadList: Array<unknown> = [];
let bytesWriteList: Array<unknown> = [];
let readOpsList: Array<unknown> = [];
let writeOpsList: Array<unknown> = [];
let bytesInList: Array<unknown> = [];
let bytesOutList: Array<unknown> = [];
let packetInList: Array<unknown> = [];
let packetOutList: Array<unknown> = [];

export function resetAbilityMonitor(): void {
  totalList = [];
  userList = [];
  systemList = [];
  memoryList = [];
  memoryListMap.clear();
  bytesReadList = [];
  bytesWriteList = [];
  readOpsList = [];
  writeOpsList = [];
  bytesInList = [];
  bytesOutList = [];
  packetInList = [];
  packetOutList = [];
}
/**
 * @param data
 * @param proc
 */

export function cpuAbilityMonitorDataReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    if (totalList.length === 0) {
      // @ts-ignore
      totalList = proc(cpuAbilityMonitorDataSql(data.params));
    }
    // @ts-ignore
    cpuArrayBufferHandler(data, totalList, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  } else {
    // @ts-ignore
    let sql = cpuAbilityMonitorDataProtoSql(data.params);
    let res = proc(sql);
    // @ts-ignore
    cpuArrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}
export function cpuAbilityUserDataReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    if (userList.length === 0) {
      // @ts-ignore
      userList = proc(cpuAbilityUserDataSql(data.params));
    }
    // @ts-ignore
    cpuArrayBufferHandler(data, userList, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  } else {
    // @ts-ignore
    let sql = cpuAbilityUserDataProtoSql(data.params);
    let res = proc(sql);
    // @ts-ignore
    cpuArrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}
export function cpuAbilitySystemDataReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    if (systemList.length === 0) {
      // @ts-ignore
      systemList = proc(cpuAbilitySystemDataSql(data.params));
    }
    // @ts-ignore
    cpuArrayBufferHandler(data, systemList, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  } else {
    // @ts-ignore
    let sql = cpuAbilitySystemDataProtoSql(data.params);
    let res = proc(sql);
    // @ts-ignore
    cpuArrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}
export function abilityMemoryUsedDataReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    // @ts-ignore
    if (!memoryListMap.has(data.params.id)) {
      // @ts-ignore
      memoryList = proc(abilityMemoryDataSql(data.params));
      // @ts-ignore
      memoryListMap.set(data.params.id, memoryList);
    }
    // @ts-ignore
    let list = memoryListMap.get(data.params.id) || [];
    // @ts-ignore
    arrayBufferHandler(data, list, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  } else {
    // @ts-ignore
    let sql = abilityMemoryDataProtoSql(data.params);
    let res = proc(sql);
    // @ts-ignore
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}
export function abilityBytesReadDataReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    if (bytesReadList.length === 0) {
      // @ts-ignore
      bytesReadList = proc(abilityBytesReadDataSql(data.params));
    }
    // @ts-ignore
    arrayBufferHandler(data, bytesReadList, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  } else {
    // @ts-ignore
    let sql = abilityBytesReadDataProtoSql(data.params);
    let res = proc(sql);
    // @ts-ignore
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}
export function abilityBytesWrittenDataReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    if (bytesWriteList.length === 0) {
      // @ts-ignore
      bytesWriteList = proc(abilityBytesWrittenDataSql(data.params));
    }
    // @ts-ignore
    arrayBufferHandler(data, bytesWriteList, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  } else {
    // @ts-ignore
    let sql = abilityBytesWrittenDataProtoSql(data.params);
    let res = proc(sql);
    // @ts-ignore
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}
export function abilityReadOpsDataReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    if (readOpsList.length === 0) {
      // @ts-ignore
      readOpsList = proc(abilityReadOpsDataSql(data.params));
    }
    // @ts-ignore
    arrayBufferHandler(data, readOpsList, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  } else {
    // @ts-ignore
    let sql = abilityReadOpsDataProtoSql(data.params);
    let res = proc(sql);
    // @ts-ignore
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}
export function abilityWrittenOpsDataReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    if (writeOpsList.length === 0) {
      // @ts-ignore
      writeOpsList = proc(abilityWrittenOpsDataSql(data.params));
    }
    // @ts-ignore
    arrayBufferHandler(data, writeOpsList, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  } else {
    // @ts-ignore
    let sql = abilityWrittenOpsDataProtoSql(data.params);
    let res = proc(sql);
    // @ts-ignore
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}
export function abilityBytesInTraceDataReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    if (bytesInList.length === 0) {
      // @ts-ignore
      bytesInList = proc(abilityBytesInTraceDataSql(data.params));
    }
    // @ts-ignore
    arrayBufferHandler(data, bytesInList, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  } else {
    // @ts-ignore
    let sql = abilityBytesInTraceDataProtoSql(data.params);
    let res = proc(sql);
    // @ts-ignore
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}
export function abilityBytesOutTraceDataReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    if (bytesOutList.length === 0) {
      // @ts-ignore
      bytesOutList = proc(abilityBytesOutTraceDataSql(data.params));
    }
    // @ts-ignore
    arrayBufferHandler(data, bytesOutList, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  } else {
    // @ts-ignore
    let sql = abilityBytesOutTraceDataProtoSql(data.params);
    let res = proc(sql);
    // @ts-ignore
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}
export function abilityPacketInTraceDataReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    if (packetInList.length === 0) {
      // @ts-ignore
      packetInList = proc(abilityPacketInDataSql(data.params));
    }
    // @ts-ignore
    arrayBufferHandler(data, packetInList, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  } else {
    // @ts-ignore
    let sql = abilityPacketInDataProtoSql(data.params);
    let res = proc(sql);
    // @ts-ignore
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}
export function abilityPacketsOutTraceDataReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    if (packetOutList.length === 0) {
      // @ts-ignore
      packetOutList = proc(abilityPacketsOutDataSql(data.params));
    }
    // @ts-ignore
    arrayBufferHandler(data, packetOutList, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  } else {
    // @ts-ignore
    let sql = abilityPacketsOutDataProtoSql(data.params);
    let res = proc(sql);
    // @ts-ignore
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

function arrayBufferHandler(data: unknown, res: unknown[], transfer: boolean): void {
  // @ts-ignore
  let startNS = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startNS);
  // @ts-ignore
  let value = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.value);
  // @ts-ignore
  let dur = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  res.forEach((it, i) => {
    // @ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.abilityData);
    // @ts-ignore
    startNS[i] = it.startNs;
    // @ts-ignore
    value[i] = it.value;
    // @ts-ignore
    dur[i] = it.dur;
  });
  (self as unknown as Worker).postMessage(
    {
      // @ts-ignore
      id: data.id,
      // @ts-ignore
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

function cpuArrayBufferHandler(data: unknown, res: unknown[], transfer: boolean): void {
  // @ts-ignore
  let startNS = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startNS);
  // @ts-ignore
  let value = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.value);
  // @ts-ignore
  let dur = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  res.forEach((it, i) => {
    // @ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.cpuAbilityData);
    // @ts-ignore
    startNS[i] = it.startNs;
    // @ts-ignore
    value[i] = it.value;
    // @ts-ignore
    dur[i] = it.dur;
  });
  (self as unknown as Worker).postMessage(
    {
      // @ts-ignore
      id: data.id,
      // @ts-ignore
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
