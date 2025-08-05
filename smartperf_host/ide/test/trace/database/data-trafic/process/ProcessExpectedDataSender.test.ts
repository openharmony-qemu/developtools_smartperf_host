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
import { JankStruct } from '../../../../../src/trace/database/ui-worker/ProcedureWorkerJank';
import { threadPool } from '../../../../../src/trace/database/SqlLite';
import {
  processExpectedDataSender
} from '../../../../../src/trace/database/data-trafic/process/ProcessExpectedDataSender';
jest.mock('../../../../../src/js-heap/model/DatabaseStruct', () => {});
jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
describe('ProcessExpectedDataSender Test', () => {
  let expectedData = {
    cmdline: "render_service",
    depth: 0,
    dur: 166,
    frame: {x: 336, y: 0, width: 3, height: 20},
    frame_type: "render_service",
    id: 415,
    name: 1143,
    pid: 994,
    ts: 20862,
    type: 1143
  }
  it('ExpectedDataSenderTest01', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(expectedData, 1, true);
    });
    let expectedTraceRow = TraceRow.skeleton<JankStruct>();
    processExpectedDataSender(994, expectedTraceRow).then(result => {
      expect(result).toHaveLength(1);
    });
  });
});