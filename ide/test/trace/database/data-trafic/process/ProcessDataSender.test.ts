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

import { threadPool } from '../../../../../src/trace/database/SqlLite';
import { TraceRow } from '../../../../../src/trace/component/trace/base/TraceRow';
import { ProcessStruct } from '../../../../../src/trace/database/ui-worker/ProcedureWorkerProcess';
import { processDataSender } from '../../../../../src/trace/database/data-trafic/process/ProcessDataSender';
jest.mock('../../../../../src/js-heap/model/DatabaseStruct', () => {});
jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
describe('ProcessDataSender Test', () => {
  let processData =
    {
      cpu: 0,
      dur: 1400,
      startTime: 8339,
    }
  it('ProcessDataSenderTest01', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(processData, 1, true);
    });
    let processTraceRow = TraceRow.skeleton<ProcessStruct>();
    processDataSender(994, processTraceRow).then(result => {
      expect(result).toHaveLength(1);
    });
  });
});