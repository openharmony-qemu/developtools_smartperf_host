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

import { xpowerWifiDataSender } from '../../../../../src/trace/database/data-trafic/xpower/XpowerWifiDataSender';
import { threadPool } from '../../../../../src/trace/database/SqlLite';
import { TraceRow } from '../../../../../src/trace/component/trace/base/TraceRow';
import { XpowerWifiStruct } from '../../../../../src/trace/database/ui-worker/ProcedureWorkerXpowerWifi';
jest.mock('../../../../../src/js-heap/model/DatabaseStruct', () => {});
jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});

describe('xpowerWifiDataSender Test', () => {
  let data = {
    startTime: 5000,
    rx: 500,
    tx: 500,
  };
  it('xpowerWifiDataSenderTest01', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(data, 1, true);
    });
    let traceRow = TraceRow.skeleton<XpowerWifiStruct>();
    xpowerWifiDataSender(traceRow, 'WIFIPackets').then((result) => {
      expect(result).toBeTruthy();
    });
  });
  it('xpowerWifiDataSenderTest02', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(data, 1, true);
    });
    let traceRow = TraceRow.skeleton<XpowerWifiStruct>();
    xpowerWifiDataSender(traceRow, 'WIFIBytes').then((result) => {
      expect(result).toBeTruthy();
    });
  });
});
