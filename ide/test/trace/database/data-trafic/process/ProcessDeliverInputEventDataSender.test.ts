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
import { FuncStruct } from '../../../../../src/trace/database/ui-worker/ProcedureWorkerFunc';
import {
  processDeliverInputEventDataSender
} from '../../../../../src/trace/database/data-trafic/process/ProcessDeliverInputEventDataSender';
jest.mock('../../../../../src/js-heap/model/DatabaseStruct', () => {});
jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
describe('ProcessDataSender Test', () => {
  let inputEventData = {
    argsetid: 12,
    cookie: 684,
    depth: 0,
    dur: 7810,
    frame: {x: 516, y: 0, width: 1, height: 20},
    funName: "deliverInputEvent",
    id: 408,
    is_main_thread: 1,
    parent_id: 725,
    pid: 756,
    startTs: 740,
    threadName: "ndroid.settings",
    tid: 725,
    track_id: 136
  }
  it('ProcessDataSenderTest01',  () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(inputEventData, 1, true);
    });
    let inputEventTraceRow = TraceRow.skeleton<FuncStruct>();
    processDeliverInputEventDataSender(7256, inputEventTraceRow).then(result => {
      expect(result).toHaveLength(1);
    });
  });
});