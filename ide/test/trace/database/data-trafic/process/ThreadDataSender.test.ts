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
import { ThreadStruct } from '../../../../../src/trace/database/ui-worker/ProcedureWorkerThread';
import { threadDataSender } from '../../../../../src/trace/database/data-trafic/process/ThreadDataSender';
jest.mock('../../../../../src/js-heap/model/DatabaseStruct', () => {});
jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
describe('ThreadDataSender Test', () => {
  let threadData = {
    argSetID: 12,
    cpu: 2,
    dur: 496000,
    frame: {y: 5, height: 20, x: 369, width: 1},
    id: 23,
    pid: 1668,
    startTime: 2629548,
    state: "Running",
    tid: 1693,
    translateY: 650
  }
  it('ThreadDataSenderTest01', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(threadData, 1, true);
    });
    let threadTraceRow = TraceRow.skeleton<ThreadStruct>();
    threadDataSender(543, 12, threadTraceRow).then(result => {
      expect(result).toHaveLength(1);
    });
  });
});