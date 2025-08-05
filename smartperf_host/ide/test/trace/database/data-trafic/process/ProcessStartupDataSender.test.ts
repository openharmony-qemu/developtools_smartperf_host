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

import { TraceRow } from '../../../../../src/trace/component/trace/base/TraceRow';
import { threadPool } from '../../../../../src/trace/database/SqlLite';
import { AppStartupStruct } from '../../../../../src/trace/database/ui-worker/ProcedureWorkerAppStartup';
jest.mock('../../../../../src/js-heap/model/DatabaseStruct', () => {});
import { processStartupDataSender } from '../../../../../src/trace/database/data-trafic/process/ProcessStartupDataSender';
jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});

describe('ProcessStartupDataSender Test', () => {
  let startupData = {
    dur: 60558,
    endItid: 167,
    frame: {y: 5, height: 20, x: 12, width: 2},
    itid: 76,
    pid: 4794,
    startName: 1,
    startTs: 266,
    tid: 4794
  }
  it('ProcessStartupDataSenderTest01', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(startupData, 1, true);
    });
    let startupTraceRow = TraceRow.skeleton<AppStartupStruct>();
    processStartupDataSender(4794, startupTraceRow).then(result => {
      expect(result).toHaveLength(1);
    });
  });
});