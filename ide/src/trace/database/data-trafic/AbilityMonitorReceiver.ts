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
export const cpuAbilityMonitorDataSql = (args: any): string => {
  return `select 
        (t.total_load) as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from cpu_usage t`;
};
export const cpuAbilityUserDataSql = (args: any): string => {
  return `select 
        t.user_load as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from cpu_usage t`;
};
export const cpuAbilitySystemDataSql = (args: any): string => {
  return `select 
        t.system_load as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from cpu_usage t`;
};
export const abilityMemoryDataSql = (args: any): string => {
  return `select 
        t.value as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from sys_mem_measure t 
        where t.filter_id = ${args.id}`;
};
export const abilityBytesReadDataSql = (args: any): string => {
  return `select 
        t.rd_speed as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from diskio t`;
};
export const abilityBytesWrittenDataSql = (args: any): string => {
  return `select 
        t.wr_speed as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from diskio t`;
};
export const abilityReadOpsDataSql = (args: any): string => {
  return `select 
        t.rd_count_speed as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from diskio t`;
};
export const abilityWrittenOpsDataSql = (args: any): string => {
  return `select 
        t.wr_count_speed as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from diskio t`;
};
export const abilityBytesInTraceDataSql = (args: any): string => {
  return `select 
        t.tx_speed as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from network t`;
};
export const abilityBytesOutTraceDataSql = (args: any): string => {
  return `select 
        t.rx_speed as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from network t`;
};
export const abilityPacketInDataSql = (args: any): string => {
  return `select 
        t.packet_in_sec as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from network t`;
};
export const abilityPacketsOutDataSql = (args: any): string => {
  return `select 
        t.packet_out_sec as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from network t`;
};
export const cpuAbilityMonitorDataProtoSql = (args: any): string => {
  return `select 
        (t.total_load) as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from cpu_usage t`;
};
export const cpuAbilityUserDataProtoSql = (args: any): string => {
  return `select 
        t.user_load as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from cpu_usage t`;
};
export const cpuAbilitySystemDataProtoSql = (args: any): string => {
  return `select 
        t.system_load as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from cpu_usage t`;
};
export const abilityMemoryDataProtoSql = (args: any): string => {
  return `select 
        t.value as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from sys_mem_measure t 
        where t.filter_id = ${args.id}`;
};
export const abilityBytesReadDataProtoSql = (args: any): string => {
  return `select 
        t.rd_speed as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from diskio t`;
};
export const abilityBytesWrittenDataProtoSql = (args: any): string => {
  return `select 
        t.wr_speed as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from diskio t`;
};
export const abilityReadOpsDataProtoSql = (args: any): string => {
  return `select 
        t.rd_count_speed as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from diskio t`;
};
export const abilityWrittenOpsDataProtoSql = (args: any): string => {
  return `select 
        t.wr_count_speed as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from diskio t`;
};
export const abilityBytesInTraceDataProtoSql = (args: any): string => {
  return `select 
        t.tx_speed as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from network t`;
};
export const abilityBytesOutTraceDataProtoSql = (args: any): string => {
  return `select 
        t.rx_speed as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from network t`;
};
export const abilityPacketInDataProtoSql = (args: any): string => {
  return `select 
        t.packet_in_sec as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from network t`;
};
export const abilityPacketsOutDataProtoSql = (args: any): string => {
  return `select 
        t.packet_out_sec as value,
        (t.ts - ${args.recordStartNS} ) as startNs
        from network t`;
};

let totalList: Array<any> = [];
let userList: Array<any> = [];
let systemList: Array<any> = [];
let memoryList: Array<any> = [];
let memoryListMap = new Map<string, Array<any>>();
let bytesReadList: Array<any> = [];
let bytesWriteList: Array<any> = [];
let readOpsList: Array<any> = [];
let writeOpsList: Array<any> = [];
let bytesInList: Array<any> = [];
let bytesOutList: Array<any> = [];
let packetInList: Array<any> = [];
let packetOutList: Array<any> = [];

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

export function cpuAbilityMonitorDataReceiver(data: any, proc: Function): void {
  if (data.params.trafic === TraficEnum.Memory) {
    if (totalList.length === 0) {
      totalList = proc(cpuAbilityMonitorDataSql(data.params));
    }
    cpuArrayBufferHandler(data, totalList, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  } else {
    let sql = cpuAbilityMonitorDataProtoSql(data.params);
    let res = proc(sql);
    cpuArrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}
export function cpuAbilityUserDataReceiver(data: any, proc: Function): void {
  if (data.params.trafic === TraficEnum.Memory) {
    if (userList.length === 0) {
      userList = proc(cpuAbilityUserDataSql(data.params));
    }
    cpuArrayBufferHandler(data, userList, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  } else {
    let sql = cpuAbilityUserDataProtoSql(data.params);
    let res = proc(sql);
    cpuArrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}
export function cpuAbilitySystemDataReceiver(data: any, proc: Function): void {
  if (data.params.trafic === TraficEnum.Memory) {
    if (systemList.length === 0) {
      systemList = proc(cpuAbilitySystemDataSql(data.params));
    }
    cpuArrayBufferHandler(data, systemList, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  } else {
    let sql = cpuAbilitySystemDataProtoSql(data.params);
    let res = proc(sql);
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}
export function abilityMemoryUsedDataReceiver(data: any, proc: Function): void {
  if (data.params.trafic === TraficEnum.Memory) {
    if (!memoryListMap.has(data.params.id)) {
      memoryList = proc(abilityMemoryDataSql(data.params));
      memoryListMap.set(data.params.id, memoryList);
    }
    let list = memoryListMap.get(data.params.id) || [];
    arrayBufferHandler(data, list, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  } else {
    let sql = abilityMemoryDataProtoSql(data.params);
    let res = proc(sql);
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}
export function abilityBytesReadDataReceiver(data: any, proc: Function): void {
  if (data.params.trafic === TraficEnum.Memory) {
    if (bytesReadList.length === 0) {
      bytesReadList = proc(abilityBytesReadDataSql(data.params));
    }
    arrayBufferHandler(data, bytesReadList, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  } else {
    let sql = abilityBytesReadDataProtoSql(data.params);
    let res = proc(sql);
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}
export function abilityBytesWrittenDataReceiver(data: any, proc: Function): void {
  if (data.params.trafic === TraficEnum.Memory) {
    if (bytesWriteList.length === 0) {
      bytesWriteList = proc(abilityBytesWrittenDataSql(data.params));
    }
    arrayBufferHandler(data, bytesWriteList, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  } else {
    let sql = abilityBytesWrittenDataProtoSql(data.params);
    let res = proc(sql);
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}
export function abilityReadOpsDataReceiver(data: any, proc: Function): void {
  if (data.params.trafic === TraficEnum.Memory) {
    if (readOpsList.length === 0) {
      readOpsList = proc(abilityReadOpsDataSql(data.params));
    }
    arrayBufferHandler(data, readOpsList, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  } else {
    let sql = abilityReadOpsDataProtoSql(data.params);
    let res = proc(sql);
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}
export function abilityWrittenOpsDataReceiver(data: any, proc: Function): void {
  if (data.params.trafic === TraficEnum.Memory) {
    if (writeOpsList.length === 0) {
      writeOpsList = proc(abilityWrittenOpsDataSql(data.params));
    }
    arrayBufferHandler(data, writeOpsList, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  } else {
    let sql = abilityWrittenOpsDataProtoSql(data.params);
    let res = proc(sql);
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}
export function abilityBytesInTraceDataReceiver(data: any, proc: Function): void {
  if (data.params.trafic === TraficEnum.Memory) {
    if (bytesInList.length === 0) {
      bytesInList = proc(abilityBytesInTraceDataSql(data.params));
    }
    arrayBufferHandler(data, bytesInList, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  } else {
    let sql = abilityBytesInTraceDataProtoSql(data.params);
    let res = proc(sql);
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}
export function abilityBytesOutTraceDataReceiver(data: any, proc: Function): void {
  if (data.params.trafic === TraficEnum.Memory) {
    if (bytesOutList.length === 0) {
      bytesOutList = proc(abilityBytesOutTraceDataSql(data.params));
    }
    arrayBufferHandler(data, bytesOutList, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  } else {
    let sql = abilityBytesOutTraceDataProtoSql(data.params);
    let res = proc(sql);
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}
export function abilityPacketInTraceDataReceiver(data: any, proc: Function): void {
  if (data.params.trafic === TraficEnum.Memory) {
    if (packetInList.length === 0) {
      packetInList = proc(abilityPacketInDataSql(data.params));
    }
    arrayBufferHandler(data, packetInList, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  } else {
    let sql = abilityPacketInDataProtoSql(data.params);
    let res = proc(sql);
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}
export function abilityPacketsOutTraceDataReceiver(data: any, proc: Function): void {
  if (data.params.trafic === TraficEnum.Memory) {
    if (packetOutList.length === 0) {
      packetOutList = proc(abilityPacketsOutDataSql(data.params));
    }
    arrayBufferHandler(data, packetOutList, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  } else {
    let sql = abilityPacketsOutDataProtoSql(data.params);
    let res = proc(sql);
    arrayBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
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
