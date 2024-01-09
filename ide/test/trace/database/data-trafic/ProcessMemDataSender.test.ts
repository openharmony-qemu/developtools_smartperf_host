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
import { threadPool } from '../../../../src/trace/database/SqlLite';
import { processMemDataSender } from '../../../../src/trace/database/data-trafic/ProcessMemDataSender';
import { ProcessMemStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerMem';

jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});

describe('ProcessMemDataSender Test', () => {
  let memData = [{
    delta: 0,
    duration: 4077000,
    frame: {x: 645, y: 5, width: 1, height: 30},
    maxValue: 5,
    startTime: 9178680000,
    track_id: 31,
    ts: 168767841541000,
    value: 3
  }]
  it('ProcessMemDataSenderTest01', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(memData, memData.length, true);
    });
    let memTraceRow = TraceRow.skeleton<ProcessMemStruct>();
    processMemDataSender(543, memTraceRow).then(result => {
      expect(result).toHaveLength(1);
    });
  });
});