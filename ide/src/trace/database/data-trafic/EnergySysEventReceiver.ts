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

export const systemDataSql = (args: any): string => {
  return `SELECT S.id,
                 S.ts - ${args.recordStartNS} AS startNs,
                 D.data                       AS eventName,
                 (case when D.data == 'POWER_RUNNINGLOCK' then 1 when D.data == 'GNSS_STATE' then 2 else 0 end) AS appKey,
                 contents                     AS eventValue
          FROM hisys_all_event AS S
                   LEFT JOIN data_dict AS D ON S.event_name_id = D.id
                   LEFT JOIN data_dict AS D2 ON S.domain_id = D2.id
          WHERE eventName IN ('POWER_RUNNINGLOCK', 'GNSS_STATE', 'WORK_START', 'WORK_REMOVE', 'WORK_STOP', 'WORK_ADD');`;
};

export const chartEnergyAnomalyDataSql = (args: any): string => {
  return `
      select S.id,
             S.ts - ${args.recordStartNS} as startNs,
             D.data                       as eventName,
             D2.data                      as appKey,
             (case
                  when S.type==1 then group_concat(S.string_value, ',')
                  else group_concat(S.int_value, ',') end) as eventValue
      from hisys_event_measure as S
          left join data_dict as D
      on D.id=S.name_id
          left join app_name as APP on APP.id=S.key_id
          left join data_dict as D2 on D2.id=APP.app_key
      where D.data in ('ANOMALY_SCREEN_OFF_ENERGY'
          , 'ANOMALY_KERNEL_WAKELOCK'
          , 'ANOMALY_CPU_HIGH_FREQUENCY'
          , 'ANOMALY_WAKEUP')
         or (D.data in ('ANOMALY_RUNNINGLOCK'
          , 'ANORMALY_APP_ENERGY'
          , 'ANOMALY_GNSS_ENERGY'
          , 'ANOMALY_CPU_ENERGY'
          , 'ANOMALY_ALARM_WAKEUP')
        and D2.data in ('APPNAME'))
      group by S.serial, D.data`;
};
export const queryPowerValueSql = (args: any): string => {
  return `
      SELECT
          S.id,
          S.ts - ${args.recordStartNS} as startNs,
          D.data AS eventName,
          D2.data AS appKey,
          group_concat( ( CASE WHEN S.type == 1 THEN S.string_value ELSE S.int_value END ), ',' ) AS eventValue
      FROM
          hisys_event_measure AS S
              LEFT JOIN data_dict AS D
                        ON D.id = S.name_id
              LEFT JOIN app_name AS APP
                        ON APP.id = S.key_id
              LEFT JOIN data_dict AS D2
                        ON D2.id = APP.app_key
      where
              D.data in ('POWER_IDE_CPU','POWER_IDE_LOCATION','POWER_IDE_GPU','POWER_IDE_DISPLAY','POWER_IDE_CAMERA','POWER_IDE_BLUETOOTH','POWER_IDE_FLASHLIGHT','POWER_IDE_AUDIO','POWER_IDE_WIFISCAN')
        and
              D2.data in ('BACKGROUND_ENERGY','FOREGROUND_ENERGY','SCREEN_ON_ENERGY','SCREEN_OFF_ENERGY','ENERGY','APPNAME')
      GROUP BY
          S.serial,
          APP.app_key,
          D.data,
          D2.data
      ORDER BY
          eventName;`;
};
export const queryStateDataSql = (args: any): string => {
  return `
      select
          S.id,
          S.ts - ${args.recordStartNS} as startNs,
          D.data as eventName,
          D2.data as appKey,
          S.int_value as eventValue
      from hisys_event_measure as S
          left join data_dict as D on D.id=S.name_id
          left join app_name as APP on APP.id=S.key_id
          left join data_dict as D2 on D2.id=APP.app_key
      where (case when 'SENSOR_STATE'== '${args.eventName}' then D.data like '%SENSOR%' else D.data = '${args.eventName}' end)
        and D2.data in ('BRIGHTNESS','STATE','VALUE','LEVEL','VOLUME','OPER_TYPE','VOLUME')
      group by S.serial,APP.app_key,D.data,D2.data;`;
};

export const queryStateProtoDataSql = (args: any): string => {
  return `
      SELECT
          S.id,
          S.ts - ${args.recordStartNS} AS startNs,
          D.data AS eventName,
          '' AS appKey,
          contents AS eventValue
      FROM
          hisys_all_event AS S
              LEFT JOIN data_dict AS D ON S.event_name_id = D.id
              LEFT JOIN data_dict AS D2 ON S.domain_id = D2.id
      WHERE
          eventName = ${args.eventName}`;
};

export function energySysEventReceiver(data: any, proc: Function) {
  let sql = systemDataSql(data.params);
  let res = proc(sql);
  systemBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
}

export function hiSysEnergyAnomalyDataReceiver(data: any, proc: Function) {
  let sql = chartEnergyAnomalyDataSql(data.params);
  let res = proc(sql);
  anomalyBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
}

export function hiSysEnergyPowerReceiver(data: any, proc: Function): void {
  let sql = queryPowerValueSql(data.params);
  let res = proc(sql);
  powerBufferHandler(data, res, data.params.trafic !== TraficEnum.SharedArrayBuffer);
}

export function hiSysEnergyStateReceiver(data: any, proc: Function): void {
  let stateDataSql = queryStateDataSql(data.params);
  let stateDataRes = proc(stateDataSql);
  stateBufferHandler(data, stateDataRes, data.params.trafic !== TraficEnum.SharedArrayBuffer);
}

function systemBufferHandler(data: any, res: any[], transfer: boolean) {
  let hiSysEnergy = new HiSysEnergy(data, res, transfer);
  let systemDataList: any = [];
  let workCountMap: Map<string, number> = new Map<string, number>();
  let nameIdMap: Map<string, Array<any>> = new Map<string, []>();
  res.forEach((it, index) => {
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.energyData);
    let parseData = JSON.parse(it.eventValue);
    it.eventValue = parseData;
    let beanData: any = {};
    if (it.appKey === '1') {
      eventNameWithPowerRunninglock(beanData, it, systemDataList);
    } else if (it.appKey === '2') {
      eventNameWithGnssState(beanData, it, systemDataList);
    } else {
      beanData.dataType = 3;
      if (it.eventValue['NAME']) {
        beanData.appName = it['NAME'];
      }
      if (it.eventValue['WORKID']) {
        beanData.workId = it['WORKID'];
      }
      if (it.eventName === 'WORK_START') {
        eventNameWithWorkStart(nameIdMap, beanData, workCountMap, it, systemDataList);
      } else if (it.eventName === 'WORK_STOP') {
        eventNameWithWorkStop(nameIdMap, beanData, workCountMap, it, systemDataList);
      }
    }
    hiSysEnergy.id[index] = beanData.id;
    hiSysEnergy.startNs[index] = beanData.startNs;
    hiSysEnergy.count[index] = beanData.count;
    hiSysEnergy.type[index] = beanData.dataType;
    hiSysEnergy.token[index] = beanData.token;
    hiSysEnergy.dataType[index] = beanData.dataType;
  });
  postMessage(data, transfer, hiSysEnergy, res.length);
}
function eventNameWithPowerRunninglock(beanData: any, it: any, systemDataList: Array<any>): void {
  let lockCount = 0;
  let tokedIds: Array<string> = [];
  beanData.dataType = 1;
  if (it.eventValue['TAG'].endsWith('_ADD')) {
    beanData.startNs = it.startNs;
    lockCount++;
    beanData.id = it.id;
    beanData.count = lockCount;
    beanData.token = it.eventValue['MESSAGE'].split('=')[1];
    beanData.type = 1;
    tokedIds.push(beanData.token);
    systemDataList.push(beanData);
  } else {
    beanData.id = it.id;
    beanData.startNs = it.startNs;
    let toked = it.eventValue['MESSAGE'].split('=')[1];
    let number = tokedIds.indexOf(toked);
    if (number > -1) {
      lockCount--;
      beanData.count = lockCount;
      beanData.token = it.eventValue['MESSAGE'].split('=')[1];
      beanData.type = 1;
      systemDataList.push(beanData);
      delete tokedIds[number];
    }
  }
}
function eventNameWithGnssState(beanData: any, it: any, systemDataList: Array<any>): void {
  let locationIndex = -1;
  let locationCount = 0;
  beanData.dataType = 2;
  if (it.eventValue['STATE'] === 'stop') {
    if (locationIndex == -1) {
      beanData.startNs = 0;
      beanData.count = 1;
    } else {
      beanData.startNs = it.startNs;
      locationCount--;
      beanData.count = locationCount;
    }
    beanData.state = 'stop';
  } else {
    beanData.startNs = it.startNs;
    locationCount++;
    beanData.count = locationCount;
    beanData.state = 'start';
  }
  locationIndex = 0;
  beanData.type = 2;
  systemDataList.push(beanData);
}
function eventNameWithWorkStart(
  nameIdMap: Map<string, Array<any>>,
  beanData: any,
  workCountMap: Map<string, number>,
  it: any,
  systemDataList: Array<any>
): void {
  let nameIdList = nameIdMap.get(beanData.appName);
  let workCount = 0;
  if (nameIdList == undefined) {
    workCount = 1;
    nameIdMap.set(beanData.appName, [beanData.workId]);
  } else {
    nameIdList.push(beanData.workId);
    workCount = nameIdList.length;
  }
  let count = workCountMap.get(beanData.appName);
  if (count == undefined) {
    workCountMap.set(beanData.appName, 1);
  } else {
    workCountMap.set(beanData.appName, count + 1);
  }
  beanData.startNs = it.startNs;
  beanData.count = workCount;
  beanData.type = 0;
  systemDataList.push(beanData);
}
function eventNameWithWorkStop(
  nameIdMap: Map<string, Array<any>>,
  beanData: any,
  workCountMap: Map<string, number>,
  it: any,
  systemDataList: Array<any>
): void {
  let nameIdList: any = nameIdMap.get(beanData.appName);
  let index = nameIdList.indexOf(beanData.workId);
  if (nameIdList != undefined && index > -1) {
    delete nameIdList[index];
    let workCount = workCountMap.get(beanData.appName);
    if (workCount != undefined) {
      workCount = workCount - 1;
      workCountMap.set(beanData.appName, workCount);
      beanData.startNs = it.startNs;
      beanData.count = workCount;
      beanData.type = 0;
      systemDataList.push(beanData);
    }
  }
}
function postMessage(data: any, transfer: boolean, hiSysEnergy: HiSysEnergy, len: number): void {
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
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

  constructor(data: any, res: any[], transfer: boolean) {
    this.id = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.id);
    this.startNs = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startNs);
    this.count = new Uint32Array(transfer ? res.length : data.params.sharedArrayBuffers.count);
    this.type = new Uint32Array(transfer ? res.length : data.params.sharedArrayBuffers.type);
    this.token = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.token);
    this.dataType = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.dataType);
  }
}

function anomalyBufferHandler(data: any, res: any[], transfer: boolean) {
  let id = new Int32Array(transfer ? res.length : data.params.sharedArrayBuffers.id);
  let startNs = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startNs);
  res.forEach((it, index) => {
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.energyData);
    id[index] = it.id;
    startNs[index] = it.startNs;
  });
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
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

function powerBufferHandler(data: any, res: any[], transfer: boolean) {
  let id = new Uint32Array(transfer ? res.length : data.params.sharedArrayBuffers.id);
  let startNs = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startNs);
  res.forEach((it, index) => {
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.energyData);
    id[index] = it.id;
    startNs[index] = it.startNs;
  });
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
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

function stateBufferHandler(data: any, res: any[], transfer: boolean) {
  let startNs = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startNs);
  let eventValue = new Float32Array(transfer ? res.length : data.params.sharedArrayBuffers.eventValue);
  let id = new Uint32Array(transfer ? res.length : data.params.sharedArrayBuffers.id);
  res.forEach((it, index) => {
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.energyData);
    id[index] = it.id;
    startNs[index] = it.startNs;
    let eventName = it.eventName.toLocaleLowerCase();
    if (eventName.includes('sensor')) {
      if (eventName.includes('enable')) {
        eventValue[index] = 0;
      } else {
        eventValue[index] = 1;
      }
    } else {
      eventValue[index] = it.eventValue;
    }
  });
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
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
