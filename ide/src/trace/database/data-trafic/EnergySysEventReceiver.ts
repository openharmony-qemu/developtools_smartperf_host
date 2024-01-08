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
                 '1'                          AS appKey,
                 contents                     AS eventValue
          FROM hisys_all_event AS S
                   LEFT JOIN data_dict AS D ON S.event_name_id = D.id
                   LEFT JOIN data_dict AS D2 ON S.domain_id = D2.id
          WHERE eventName IN ('POWER_RUNNINGLOCK', 'GNSS_STATE', 'WORK_REMOVE', 'WORK_STOP', 'WORK_ADD');`;
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
  let id = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.id);
  let startNs = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startNs);
  let count = new Uint32Array(transfer ? res.length : data.params.sharedArrayBuffers.count);
  let type = new Uint32Array(transfer ? res.length : data.params.sharedArrayBuffers.type);
  let token = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.token);
  let dataType = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.dataType);
  let systemList: any = [];
  let lockCount = 0;
  let tokedIds: Array<string> = [];
  let locationIndex = -1;
  let locationCount = 0;
  let systemDataList: any = [];
  let workCountMap: Map<string, number> = new Map<string, number>();
  let nameIdMap: Map<string, Array<any>> = new Map<string, []>();
  res.forEach((it, index) => {
    data.params.trafic === TraficEnum.ProtoBuffer && (it = it.energyData);
    let parseData = JSON.parse(it.eventValue);
    it.eventValue = parseData;
    let beanData: any = {};
    if (it.eventName === 'POWER_RUNNINGLOCK') {
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
    } else if (it.eventName === 'GNSS_STATE') {
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
    } else {
      beanData.dataType = 3;
      if (it.eventValue['NAME']) {
        beanData.appName = it['NAME'];
      }
      if (it.eventValue['WORKID']) {
        beanData.workId = it['WORKID'];
      }
      if (it.eventName === 'WORK_START') {
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
      } else if (it.eventName === 'WORK_STOP') {
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
    }
    id[index] = beanData.id;
    startNs[index] = beanData.startNs;
    count[index] = beanData.count;
    type[index] = beanData.type;
    token[index] = beanData.token;
    dataType[index] = beanData.dataType;
  });
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
      action: data.action,
      results: transfer
        ? {
            id: id.buffer,
            startNs: startNs.buffer,
            count: count.buffer,
            type: type.buffer,
            token: token.buffer,
            dataType: dataType.buffer,
          }
        : {},
      len: res.length,
      transfer: transfer,
    },
    transfer ? [id.buffer, startNs.buffer, count.buffer, type.buffer, token.buffer, dataType.buffer] : []
  );
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

