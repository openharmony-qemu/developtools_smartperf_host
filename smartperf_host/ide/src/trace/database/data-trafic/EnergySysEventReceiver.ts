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

import { TraficEnum } from './utils/QueryEnum';
import { energyList } from './utils/AllMemoryCache';
import { Args } from './CommonArgs';

export const systemDataSql = (args: Args): string => {
  return `SELECT S.id,
                 S.ts - ${args.recordStartNS
    }                                                                   AS startNs,
                 D.data                                                                                         AS eventName,
                 (case when D.data = 'POWER_RUNNINGLOCK' then 1 when D.data = 'GNSS_STATE' then 2 else 0 end) AS appKey,
                 contents                                                                                       AS eventValue,
                 ((S.ts - ${args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)}))   as px
          FROM hisys_all_event AS S
                   LEFT JOIN data_dict AS D ON S.event_name_id = D.id
                   LEFT JOIN data_dict AS D2 ON S.domain_id = D2.id
          WHERE eventName IN ('POWER_RUNNINGLOCK', 'GNSS_STATE', 'WORK_START', 'WORK_REMOVE', 'WORK_STOP', 'WORK_ADD')
            and startNs >= ${Math.floor(args.startNS)}
            and startNs <= ${Math.floor(args.endNS)}
          group by px;`;
};

export const systemDataMemSql = (args: Args): string => {
  return `SELECT S.id,
                 S.ts - ${args.recordStartNS}                                                                         AS startNs,
                 D.data                                                                                               AS eventName,
                 (case when D.data = 'POWER_RUNNINGLOCK' then '1' when D.data = 'GNSS_STATE' then '2' else '0' end) AS appKey,
                 contents                                                                                             AS eventValue
          FROM hisys_all_event AS S
                   LEFT JOIN data_dict AS D ON S.event_name_id = D.id
                   LEFT JOIN data_dict AS D2 ON S.domain_id = D2.id
          WHERE eventName IN
                ('POWER_RUNNINGLOCK', 'GNSS_STATE', 'WORK_START', 'WORK_REMOVE', 'WORK_STOP', 'WORK_ADD');`;
};

export const chartEnergyAnomalyDataSql = (args: Args): string => {
  return `
      select S.id,
             S.ts - ${args.recordStartNS}                  as startNs,
             D.data                                        as eventName,
             D2.data                                       as appKey,
             (case
                  when S.type==1 then group_concat(S.string_value, ',')
                  else group_concat(S.int_value, ',') end) as eventValue
      from hisys_event_measure as S
               left join data_dict as D
                         on D.id = S.name_id
               left join app_name as APP on APP.id = S.key_id
               left join data_dict as D2 on D2.id = APP.app_key
      where D.data in
            ('ANOMALY_SCREEN_OFF_ENERGY', 'ANOMALY_KERNEL_WAKELOCK', 'ANOMALY_CPU_HIGH_FREQUENCY', 'ANOMALY_WAKEUP')
         or (D.data in ('ANOMALY_RUNNINGLOCK', 'ANORMALY_APP_ENERGY', 'ANOMALY_GNSS_ENERGY', 'ANOMALY_CPU_ENERGY',
                        'ANOMALY_ALARM_WAKEUP')
          and D2.data in ('APPNAME'))
      group by S.serial, D.data`;
};
export const queryPowerValueSql = (args: Args): string => {
  return `
      SELECT S.id,
             S.ts - ${args.recordStartNS}                                                        as startNs,
             D.data                                                                              AS eventName,
             D2.data                                                                             AS appKey,
             group_concat((CASE WHEN S.type = 1 THEN S.string_value ELSE S.int_value END), ',') AS eventValue
      FROM hisys_event_measure AS S
               LEFT JOIN data_dict AS D
                         ON D.id = S.name_id
               LEFT JOIN app_name AS APP
                         ON APP.id = S.key_id
               LEFT JOIN data_dict AS D2
                         ON D2.id = APP.app_key
      where D.data in ('POWER_IDE_CPU', 'POWER_IDE_LOCATION', 'POWER_IDE_GPU', 'POWER_IDE_DISPLAY', 'POWER_IDE_CAMERA',
                       'POWER_IDE_BLUETOOTH', 'POWER_IDE_FLASHLIGHT', 'POWER_IDE_AUDIO', 'POWER_IDE_WIFISCAN')
        and D2.data in
            ('BACKGROUND_ENERGY', 'FOREGROUND_ENERGY', 'SCREEN_ON_ENERGY', 'SCREEN_OFF_ENERGY', 'ENERGY', 'APPNAME')
      GROUP BY S.serial,
               APP.app_key,
               D.data,
               D2.data
      ORDER BY eventName;`;
};

export const queryStateDataSql = (args: Args): string => {
  return `
      select S.id,
             S.ts - ${args.recordStartNS} as startNs,
             D.data                       as eventName,
             D2.data                      as appKey,
             S.int_value                  as eventValue
      from hisys_event_measure as S
               left join data_dict as D on D.id = S.name_id
               left join app_name as APP on APP.id = S.key_id
               left join data_dict as D2 on D2.id = APP.app_key
      where (case when 'SENSOR_STATE'== '${args.eventName}' then D.data like '%SENSOR%' else D.data = '${args.eventName}' end)
        and D2.data in ('BRIGHTNESS', 'STATE', 'VALUE', 'LEVEL', 'VOLUME', 'OPER_TYPE', 'VOLUME')
      group by S.serial, APP.app_key, D.data, D2.data;`;
};

export const queryStateProtoDataSql = (args: Args): string => {
  return `
      SELECT S.id,
             S.ts - ${args.recordStartNS} AS startNs,
             D.data                       AS eventName,
             ''                           AS appKey,
             contents                     AS eventValue
      FROM hisys_all_event AS S
               LEFT JOIN data_dict AS D ON S.event_name_id = D.id
               LEFT JOIN data_dict AS D2 ON S.domain_id = D2.id
      WHERE eventName = ${args.eventName}`;
};
let systemList: Array<unknown> = [];
let anomalyList: Array<unknown> = [];
let powerList: Array<unknown> = [];

export function resetEnergyEvent(): void {
  systemList = [];
  anomalyList = [];
  powerList = [];
}

export function energySysEventReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    if (systemList.length === 0) {
      // @ts-ignore
      systemList = proc(systemDataMemSql(data.params));
    }
    // @ts-ignore
    systemBufferHandler(data, systemList, data.params.trafic !== TraficEnum.SharedArrayBuffer);
    // @ts-ignore
  } else if (data.params.trafic === TraficEnum.ProtoBuffer) {
    // @ts-ignore
    let sql = systemDataSql(data.params);
    let res = proc(sql);
    // @ts-ignore
    systemBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

export function hiSysEnergyAnomalyDataReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    if (anomalyList.length === 0) {
      // @ts-ignore
      anomalyList = proc(chartEnergyAnomalyDataSql(data.params));
    }
    // @ts-ignore
    anomalyBufferHandler(data, anomalyList, data.params.trafic !== TraficEnum.SharedArrayBuffer);
    // @ts-ignore
  } else if (data.params.trafic === TraficEnum.ProtoBuffer) {
    // @ts-ignore
    let sql = chartEnergyAnomalyDataSql(data.params);
    let res = proc(sql);
    // @ts-ignore
    anomalyBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

export function hiSysEnergyPowerReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    if (powerList.length === 0) {
      // @ts-ignore
      powerList = proc(queryPowerValueSql(data.params));
    }
    // @ts-ignore
    powerBufferHandler(data, powerList, data.params.trafic !== TraficEnum.SharedArrayBuffer);
    // @ts-ignore
  } else if (data.params.trafic === TraficEnum.ProtoBuffer) {
    // @ts-ignore
    let sql = queryPowerValueSql(data.params);
    let res = proc(sql);
    // @ts-ignore
    powerBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

export function hiSysEnergyStateReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  if (data.params.trafic === TraficEnum.Memory) {
    let res: unknown[];
    let list: unknown[];
    // @ts-ignore
    if (!energyList.has(data.params.eventName)) {
      // @ts-ignore
      list = proc(queryStateDataSql(data.params));
      // @ts-ignore
      energyList.set(data.params.eventName, list);
    } else {
      // @ts-ignore
      list = energyList.get(data.params.eventName) || [];
    }
    res = list;
    // @ts-ignore
    stateBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
    // @ts-ignore
  } else if (data.params.trafic === TraficEnum.ProtoBuffer) {
    // @ts-ignore
    let stateDataSql = queryStateDataSql(data.params);
    let stateDataRes = proc(stateDataSql);
    // @ts-ignore
    stateBufferHandler(data, stateDataRes, data.params.trafic !== TraficEnum.SharedArrayBuffer);
  }
}

function systemBufferHandler(data: unknown, res: unknown[], transfer: boolean): void {
  let hiSysEnergy = new HiSysEnergy(data, res, transfer);
  let systemDataList: unknown = [];
  let workCountMap: Map<string, number> = new Map<string, number>();
  let nameIdMap: Map<string, Array<unknown>> = new Map<string, []>();
  res.forEach((it, index) => {
    // @ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.energyData);
    // @ts-ignore
    let parsedData = it.eventValue;
    // @ts-ignore
    if (typeof it.eventValue === 'string') {
      try {
        // @ts-ignore
        parsedData = JSON.parse(it.eventValue);
      } catch (error) { }
    }
    // @ts-ignore
    it.eventValue = parsedData;
    let beanData: unknown = {};
    // @ts-ignore
    if (it.appKey === '1') {
      // @ts-ignore
      eventNameWithPowerRunninglock(beanData, it, systemDataList);
      // @ts-ignore
    } else if (it.appKey === '2') {
      // @ts-ignore
      eventNameWithGnssState(beanData, it, systemDataList);
    } else {
      // @ts-ignore
      beanData.dataType = 3;
      // @ts-ignore
      if (it.eventValue.NAME) {
        // @ts-ignore
        beanData.appName = it.NAME;
      }
      // @ts-ignore
      if (it.eventValue.WORKID) {
        // @ts-ignore
        beanData.workId = it.WORKID;
      }
      // @ts-ignore
      if (it.eventName === 'WORK_START') {
        // @ts-ignore
        eventNameWithWorkStart(nameIdMap, beanData, workCountMap, it, systemDataList);
        // @ts-ignore
      } else if (it.eventName === 'WORK_STOP') {
        // @ts-ignore
        eventNameWithWorkStop(nameIdMap, beanData, workCountMap, it, systemDataList);
      }
    }
    // @ts-ignore
    hiSysEnergy.id[index] = beanData.id;
    // @ts-ignore
    hiSysEnergy.startNs[index] = beanData.startNs;
    // @ts-ignore
    hiSysEnergy.count[index] = beanData.count;
    // @ts-ignore
    hiSysEnergy.type[index] = beanData.dataType;
    // @ts-ignore
    hiSysEnergy.token[index] = beanData.token;
    // @ts-ignore
    hiSysEnergy.dataType[index] = beanData.dataType;
  });
  postMessage(data, transfer, hiSysEnergy, res.length);
}

function eventNameWithPowerRunninglock(beanData: unknown, it: unknown, systemDataList: Array<unknown>): void {
  let lockCount = 0;
  let tokedIds: Array<string> = [];
  // @ts-ignore
  beanData.dataType = 1;
  // @ts-ignore
  if (it.eventValue.TAG.endsWith('_ADD')) {
    // @ts-ignore
    beanData.startNs = it.startNs;
    lockCount++;
    // @ts-ignore
    beanData.id = it.id;
    // @ts-ignore
    beanData.count = lockCount;
    // @ts-ignore
    beanData.token = it.eventValue.MESSAGE.split('=')[1];
    // @ts-ignore
    beanData.type = 1;
    // @ts-ignore
    tokedIds.push(beanData.token);
    systemDataList.push(beanData);
  } else {
    // @ts-ignore
    beanData.id = it.id;
    // @ts-ignore
    beanData.startNs = it.startNs;
    // @ts-ignore
    let toked = it.eventValue.MESSAGE.split('=')[1];
    let number = tokedIds.indexOf(toked);
    if (number > -1) {
      lockCount--;
      // @ts-ignore
      beanData.count = lockCount;
      // @ts-ignore
      beanData.token = it.eventValue.MESSAGE.split('=')[1];
      // @ts-ignore
      beanData.type = 1;
      systemDataList.push(beanData);
      Reflect.deleteProperty(tokedIds, 'number');
    }
  }
}

function eventNameWithGnssState(beanData: unknown, it: unknown, systemDataList: Array<unknown>): void {
  let locationIndex = -1;
  let locationCount = 0;
  // @ts-ignore
  beanData.dataType = 2;
  // @ts-ignore
  if (it.eventValue.STATE === 'stop') {
    if (locationIndex === -1) {
      // @ts-ignore
      beanData.startNs = 0;
      // @ts-ignore
      beanData.count = 1;
    } else {
      // @ts-ignore
      beanData.startNs = it.startNs;
      locationCount--;
      // @ts-ignore
      beanData.count = locationCount;
    }
    // @ts-ignore
    beanData.state = 'stop';
  } else {
    // @ts-ignore
    beanData.startNs = it.startNs;
    locationCount++;
    // @ts-ignore
    beanData.count = locationCount;
    // @ts-ignore
    beanData.state = 'start';
  }
  locationIndex = 0;
  // @ts-ignore
  beanData.type = 2;
  systemDataList.push(beanData);
}

function eventNameWithWorkStart(
  nameIdMap: Map<string, Array<unknown>>,
  beanData: unknown,
  workCountMap: Map<string, number>,
  it: unknown,
  systemDataList: Array<unknown>
): void {
  // @ts-ignore
  let nameIdList = nameIdMap.get(beanData.appName);
  let workCount = 0;
  if (nameIdList === undefined) {
    workCount = 1;
    // @ts-ignore
    nameIdMap.set(beanData.appName, [beanData.workId]);
  } else {
    // @ts-ignore
    nameIdList.push(beanData.workId);
    workCount = nameIdList.length;
  }
  // @ts-ignore
  let count = workCountMap.get(beanData.appName);
  if (count === undefined) {
    // @ts-ignore
    workCountMap.set(beanData.appName, 1);
  } else {
    // @ts-ignore
    workCountMap.set(beanData.appName, count + 1);
  }
  // @ts-ignore
  beanData.startNs = it.startNs;
  // @ts-ignore
  beanData.count = workCount;
  // @ts-ignore
  beanData.type = 0;
  systemDataList.push(beanData);
}

function eventNameWithWorkStop(
  nameIdMap: Map<string, Array<unknown>>,
  beanData: unknown,
  workCountMap: Map<string, number>,
  it: unknown,
  systemDataList: Array<unknown>
): void {
  // @ts-ignore
  let nameIdList: unknown = nameIdMap.get(beanData.appName);
  // @ts-ignore
  let index = nameIdList.indexOf(beanData.workId);
  if (nameIdList !== undefined && index > -1) {
    // @ts-ignore
    nameIdList.remove(index);
    // @ts-ignore
    let workCount = workCountMap.get(beanData.appName);
    if (workCount !== undefined) {
      workCount = workCount - 1;
      // @ts-ignore
      workCountMap.set(beanData.appName, workCount);
      // @ts-ignore
      beanData.startNs = it.startNs;
      // @ts-ignore
      beanData.count = workCount;
      // @ts-ignore
      beanData.type = 0;
      systemDataList.push(beanData);
    }
  }
}

function postMessage(data: unknown, transfer: boolean, hiSysEnergy: HiSysEnergy, len: number): void {
  (self as unknown as Worker).postMessage(
    {
      // @ts-ignore
      id: data.id,
      // @ts-ignore
      action: data.action,
      results: transfer
        ? {
          id: hiSysEnergy.id.buffer,
          startNs: hiSysEnergy.startNs.buffer,
          count: hiSysEnergy.count.buffer,
          type: hiSysEnergy.type.buffer,
          token: hiSysEnergy.token.buffer,
          dataType: hiSysEnergy.dataType.buffer,
        }
        : {},
      len: len,
      transfer: transfer,
    },
    transfer
      ? [
        hiSysEnergy.id.buffer,
        hiSysEnergy.startNs.buffer,
        hiSysEnergy.count.buffer,
        hiSysEnergy.type.buffer,
        hiSysEnergy.token.buffer,
        hiSysEnergy.dataType.buffer,
      ]
      : []
  );
}

class HiSysEnergy {
  id: Uint16Array;
  startNs: Float64Array;
  count: Uint32Array;
  type: Uint32Array;
  token: Float64Array;
  dataType: Uint16Array;

  constructor(data: unknown, res: unknown[], transfer: boolean) {
    // @ts-ignore
    this.id = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.id);
    // @ts-ignore
    this.startNs = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startNs);
    // @ts-ignore
    this.count = new Uint32Array(transfer ? res.length : data.params.sharedArrayBuffers.count);
    // @ts-ignore
    this.type = new Uint32Array(transfer ? res.length : data.params.sharedArrayBuffers.type);
    // @ts-ignore
    this.token = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.token);
    // @ts-ignore
    this.dataType = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.dataType);
  }
}

function anomalyBufferHandler(data: unknown, res: unknown[], transfer: boolean): void {
  // @ts-ignore
  let id = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.id);
  // @ts-ignore
  let startNs = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startNs);
  res.forEach((it, index) => {
    // @ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.energyData);
    // @ts-ignore
    id[index] = it.id;
    // @ts-ignore
    startNs[index] = it.startNs;
  });
  (self as unknown as Worker).postMessage(
    {
      // @ts-ignore
      id: data.id,
      // @ts-ignore
      action: data.action,
      results: transfer
        ? {
          id: id.buffer,
          startNs: startNs.buffer,
        }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer ? [startNs.buffer, id.buffer] : []
  );
}

function powerBufferHandler(data: unknown, res: unknown[], transfer: boolean): void {
  // @ts-ignore
  let id = new Uint32Array(transfer ? res.length : data.params.sharedArrayBuffers.id);
  // @ts-ignore
  let startNs = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startNs);
  res.forEach((it, index) => {
    // @ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.energyData);
    // @ts-ignore
    id[index] = it.id;
    // @ts-ignore
    startNs[index] = it.startNs;
  });
  (self as unknown as Worker).postMessage(
    {
      // @ts-ignore
      id: data.id,
      // @ts-ignore
      action: data.action,
      results: transfer
        ? {
          id: id.buffer,
          startNs: startNs.buffer,
        }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer ? [id.buffer, startNs.buffer] : []
  );
}

function stateBufferHandler(data: unknown, res: unknown[], transfer: boolean): void {
  // @ts-ignore
  let startNs = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startNs);
  // @ts-ignore
  let eventValue = new Float32Array(transfer ? res.length : data.params.sharedArrayBuffers.eventValue);
  // @ts-ignore
  let id = new Uint32Array(transfer ? res.length : data.params.sharedArrayBuffers.id);
  res.forEach((it, index) => {
    // @ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.energyData);
    // @ts-ignore
    id[index] = it.id;
    // @ts-ignore
    startNs[index] = it.startNs;
    // @ts-ignore
    let eventName = it.eventName.toLocaleLowerCase();
    if (eventName.includes('sensor')) {
      if (eventName.includes('enable')) {
        eventValue[index] = 0;
      } else {
        eventValue[index] = 1;
      }
    } else {
      // @ts-ignore
      eventValue[index] = it.eventValue;
    }
  });
  (self as unknown as Worker).postMessage(
    {
      // @ts-ignore
      id: data.id,
      // @ts-ignore
      action: data.action,
      results: transfer
        ? {
          id: id.buffer,
          startNs: startNs.buffer,
          eventValue: eventValue.buffer,
        }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer ? [id.buffer, startNs.buffer, eventValue.buffer] : []
  );
}
