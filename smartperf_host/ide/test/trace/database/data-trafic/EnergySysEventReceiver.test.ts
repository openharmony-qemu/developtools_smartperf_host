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

import {
  systemDataSql,
  chartEnergyAnomalyDataSql,
  queryPowerValueSql,
  queryStateDataSql,
  queryStateProtoDataSql,
  energySysEventReceiver,
  hiSysEnergyAnomalyDataReceiver,
  hiSysEnergyStateReceiver,
  hiSysEnergyPowerReceiver
} from '../../../../src/trace/database/data-trafic/EnergySysEventReceiver';
import { TraficEnum } from '../../../../src/trace/database/data-trafic/utils/QueryEnum';

describe('EnergySysEventReceiver Test', () => {
  let data;
  let proc;
  beforeEach(() => {
    data = {
      params: {
        trafic: TraficEnum.ProtoBuffer,
        sharedArrayBuffers: {
          id: new Uint16Array([1, 2, 3]),
        },
      },
    };
    proc = jest.fn((sql) => [
      {energyData: {id: 1, startNs: 4.4, eventName: '', appKey: '', eventValue: ''}},
      {energyData: {id: 2, startNs: 5.5, eventName: '', appKey: '', eventValue: ''}},
      {energyData: {id: 3, startNs: 5.5, eventName: '', appKey: '', eventValue: ''}},
      {energyData: {id: 4, startNs: 5.5, eventName: '', appKey: '', eventValue: ''}},
      {energyData: {id: 5, startNs: 5.5, eventName: '', appKey: '', eventValue: ''}},
    ]);
  });
  it('EnergySysEventReceiverTest01', () => {
    let args = {
      recordStartNS: 1000,
      endNS: 3000,
      startNS: 2000,
      width: 10
    };
    expect(systemDataSql(args)).toBeTruthy();
    expect(chartEnergyAnomalyDataSql(args)).toBeTruthy();
    expect(queryPowerValueSql(args)).toBeTruthy();
    expect(queryStateDataSql(args)).toBeTruthy();
    expect(queryStateProtoDataSql(args)).toBeTruthy();
  });
  it('EnergySysEventReceiverTest02', () => {
    let mockPostMessage = jest.fn();
    global.postMessage = mockPostMessage;
    hiSysEnergyAnomalyDataReceiver(data, proc);
    hiSysEnergyPowerReceiver(data, proc);
    hiSysEnergyStateReceiver(data, proc);
    expect(mockPostMessage).toHaveBeenCalledTimes(3);
  });
  it('EnergySysEventReceiverTest03', () => {
    let systemData = {
      params: {
        trafic: TraficEnum.ProtoBuffer,
        sharedArrayBuffers: {
          id: new Uint16Array([1, 2, 3]),
        },
      },
    };
    let systemEventvalue = {
      'LOG_LEVEL': 2,
      'MESSAGE': 'token=548210734912',
      'NAME': 'backGround',
      'PID': 4192,
      'STATE': 1,
      'TAG': 'DUBAI_TAG_RUNNINGLOCK_ADD',
      'TYPE': 1,
      'UID': 20010034
    };
    let systemEventvalueJson = JSON.stringify(systemEventvalue);
    let systemProc = jest.fn((sql) => [
      {
        energyData: {
          id: 1,
          startNs: 4.4,
          eventName: 'POWER_RUNNINGLOCK',
          appKey: '1',
          eventValue: systemEventvalueJson
        }
      },
    ]);
    let mockPostMessage = jest.fn();
    global.postMessage = mockPostMessage;
    energySysEventReceiver(systemData, systemProc);
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
  });
  it('EnergySysEventReceiverTest04', () => {
    let systemData = {
      params: {
        trafic: TraficEnum.ProtoBuffer,
        sharedArrayBuffers: {
          id: new Uint16Array([1, 2, 3]),
        },
      },
    };
    let systemEventvalue = {
      'LOG_LEVEL': 2,
      'MESSAGE': 'token=548210734912',
      'NAME': 'backGround',
      'PID': 4192,
      'STATE': 1,
      'TAG': 'DUBAI_TAG_RUNNINGLOCK',
      'TYPE': 1,
      'UID': 20010034
    };
    let systemEventvalueJson = JSON.stringify(systemEventvalue);
    let systemProc = jest.fn((sql) => [
      {
        energyData: {
          id: 1,
          startNs: 4.4,
          eventName: 'POWER_RUNNINGLOCK',
          appKey: '1',
          eventValue: systemEventvalueJson
        }
      },
    ]);
    let mockPostMessage = jest.fn();
    global.postMessage = mockPostMessage;
    energySysEventReceiver(systemData, systemProc);
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
  });
  it('EnergySysEventReceiverTest05', () => {
    let systemData = {
      params: {
        trafic: TraficEnum.ProtoBuffer,
        sharedArrayBuffers: {
          id: new Uint16Array([1, 2, 3]),
        },
      },
    };
    let systemEventvalue = {
      'LOG_LEVEL': 2,
      'MESSAGE': 'token=548210734912',
      'NAME': 'backGround',
      'PID': 4192,
      'STATE': 'stop',
      'TAG': 'DUBAI_TAG_RUNNINGLOCK',
      'TYPE': 1,
      'UID': 20010034
    };
    let systemEventvalueJson = JSON.stringify(systemEventvalue);
    let systemProc = jest.fn((sql) => [
      {energyData: {id: 1, startNs: 4.4, eventName: 'GNSS_STATE', appKey: '1', eventValue: systemEventvalueJson}},
    ]);
    let mockPostMessage = jest.fn();
    global.postMessage = mockPostMessage;
    energySysEventReceiver(systemData, systemProc);
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
  });
  it('EnergySysEventReceiverTest06', () => {
    let systemData = {
      params: {
        trafic: TraficEnum.ProtoBuffer,
        sharedArrayBuffers: {
          id: new Uint16Array([1, 2, 3]),
        },
      },
    };
    let systemEventvalue = {
      'LOG_LEVEL': 2,
      'MESSAGE': 'token=548210734912',
      'NAME': 'backGround',
      'PID': 4192,
      'STATE': 'stop',
      'TAG': 'DUBAI_TAG_RUNNINGLOCK',
      'TYPE': 1,
      'UID': 20010034
    };
    let systemEventvalueJson = JSON.stringify(systemEventvalue);
    let systemProc = jest.fn((sql) => [
      {energyData: {id: 1, startNs: 4.4, eventName: 'GNSS_STATE', appKey: '1', eventValue: systemEventvalueJson}},
    ]);
    let mockPostMessage = jest.fn();
    global.postMessage = mockPostMessage;
    energySysEventReceiver(systemData, systemProc);
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
  });
  it('EnergySysEventReceiverTest07', () => {
    let systemData = {
      params: {
        trafic: TraficEnum.ProtoBuffer,
        sharedArrayBuffers: {
          id: new Uint16Array([1, 2, 3]),
        },
      },
    };
    let systemEventvalue = {
      'LOG_LEVEL': 2,
      'MESSAGE': 'token=548210734912',
      'NAME': 'WORK_START',
      'PID': 4192,
      'STATE': 'stop',
      'TAG': 'DUBAI_TAG_RUNNINGLOCK',
      'TYPE': 1,
      'UID': 20010034
    };
    let systemEventvalueJson = JSON.stringify(systemEventvalue);
    let systemProc = jest.fn((sql) => [
      {energyData: {id: 1, startNs: 4.4, eventName: 'WORK_START', appKey: '1', eventValue: systemEventvalueJson}},
    ]);
    let mockPostMessage = jest.fn();
    global.postMessage = mockPostMessage;
    energySysEventReceiver(systemData, systemProc);
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
  });
});