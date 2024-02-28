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

import { LogDataSender } from '../../../../src/trace/database/data-trafic/LogDataSender';
import { threadPool } from '../../../../src/trace/database/SqlLite';
import { LogStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerLog';
import { TraceRow } from '../../../../src/trace/component/trace/base/TraceRow';
jest.mock('../../../../src/js-heap/model/DatabaseStruct', () => {});

jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
describe('LogDataSender Test', () => {
  let logData = {
    id: 4,
    startTs: 16276,
    pid: 2082,
    tid: 2082,
    dur: 1,
    depth: 1,
    tag: 'C02c01/Init',
    context: '[param_request.c:53]Can not get log level from param, keep the original loglevel.',
    originTime: '08-06 15:43:19.954',
    processName: 'hilog',
    level: 'Info',
    frame: {
      'x': 1,
      'y': 7,
      'width': 1,
      'height': 7
    }
  }
  it('LogDataSenderTest01', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(logData, 1, true);
    });
    let logTraceRow = TraceRow.skeleton<LogStruct>();
    LogDataSender(logTraceRow).then(res => {
      expect(res).toHaveLength(1);
    });
  });
});