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

import { TraceRow } from '../../../../src/trace/component/trace/base/TraceRow';
import {
  energySysEventSender,
  hiSysEnergyAnomalyDataSender,
  hiSysEnergyPowerSender,
  hiSysEnergyStateSender
} from '../../../../src/trace/database/data-trafic/EnergySysEventSender';
import { EnergySystemStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerEnergySystem';
import { threadPool } from '../../../../src/trace/database/SqlLite';
import { EnergyAnomalyStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerEnergyAnomaly';
import { EnergyPowerStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerEnergyPower';
import { EnergyStateStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerEnergyState';
jest.mock('../../../../src/js-heap/model/DatabaseStruct', () => {});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
describe('EnergySysEventSender Test', () => {
  let systemData = {
    count: 2,
    dataType: 1,
    dur: 13200,
    frame:
      {x: 70, y: 45, width: 11, height: 10},
    id: 73,
    startNs: 89300,
    token: 54668,
    type: 1
  }

  let anomalyData =
    {
      id: 126,
      startNs: 23840,
      eventName: "ANOMALY_SCREEN_OFF_ENERGY",
      appKey: "APPNAME",
      eventValue: "bt_switch"
    }

  let powerData = {
    appKey: "APPNAME",
    eventName: "POWER_IDE_BLUETOOTH",
    eventValue: "bt_switch",
    id: 8940,
    startNS: 1110
  }

  let stateData = {
    dur: 3000,
    frame: {x: 394, y: 5, width: 1, height: 30},
    id: 5807,
    startNs: 49686,
    type: "WIFI_EVENT_RECEIVED",
    value: 4
  }

  it('EnergySysEventSenderTest01', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(systemData, 1, true);
    });
    let systemTraceRow = TraceRow.skeleton<EnergySystemStruct>();
    energySysEventSender(systemTraceRow).then(result => {
      expect(result).toHaveLength(1);
    })
  });

  it('EnergySysEventSenderTest02', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(anomalyData, 1, true);
    });
    let anomalyTraceRow = TraceRow.skeleton<EnergyAnomalyStruct>();
    hiSysEnergyAnomalyDataSender(anomalyTraceRow).then(result => {
      expect(result).toHaveLength(1);
    })
  });

  it('EnergySysEventSenderTest03', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(powerData, 1, true);
    });
    let powerTraceRow = TraceRow.skeleton<EnergyPowerStruct>();
    hiSysEnergyPowerSender(powerTraceRow).then(result => {
      expect(Array.isArray(result)).toBe(true);
    })
  });

  it('EnergySysEventSenderTest04', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(stateData, 1, true);
    });
    let eventName = ['WIFI_EVENT_RECEIVED'];
    let stateTraceRow = TraceRow.skeleton<EnergyStateStruct>();
    hiSysEnergyStateSender(eventName, 0, stateTraceRow).then(result => {
      expect(result).toHaveLength(1);
    })
  });
});