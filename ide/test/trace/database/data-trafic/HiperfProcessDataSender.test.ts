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
import { hiperfProcessDataSender } from '../../../../src/trace/database/data-trafic/HiperfProcessDataSender';
import { threadPool } from '../../../../src/trace/database/SqlLite';
import { HiPerfProcessStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerHiPerfProcess';
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
describe('HiperfProcessSender Test', () => {
  let traceRowData = [
    {
      dur: 10000000,
      frame: { x: 2, y: 0, width: 1, height: 4 },
      startNS: 170000000,
      callchain_id: 422,
      event_count: 24,
      event_type_id: 2,
      height: 4,
      sampleCount: 1,
    },
    {
      dur: 10000000,
      frame: { x: 2, y: 0, width: 2, height: 8 },
      startNS: 180000000,
      callchain_id: 262,
      event_count: 40,
      event_type_id: 1,
      height: 8,
      sampleCount: 2,
    },
  ];
  it('HiperfProcessSenderTest01', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(traceRowData, traceRowData.length, true);
    });
    let traceRow = TraceRow.skeleton<HiPerfProcessStruct>();
    hiperfProcessDataSender(11, -2, 1, 2000000000, traceRow).then((res) => {
      expect(res).toHaveLength(2);
    });
  });
});
