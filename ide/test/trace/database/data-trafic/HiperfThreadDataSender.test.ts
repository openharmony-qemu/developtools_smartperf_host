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
import { hiperfThreadDataSender } from '../../../../src/trace/database/data-trafic/HiperfThreadDataSender';
import { threadPool } from '../../../../src/trace/database/SqlLite';
import { HiPerfThreadStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerHiPerfThread';
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
describe('HiperfThreadSender Test', () => {
  let traceRowData = [
    {
      dur: 10000000,
      frame: { x: 0, y: 0, width: 1, height: 44 },
      startNS: 0,
      callchain_id: 12,
      event_count: 3603585,
      event_type_id: 0,
      height: 44,
      sampleCount: 11,
    },
    {
      dur: 10000000,
      frame: { x: 1, y: 0, width: 1, height: 4 },
      startNS: 70000000,
      callchain_id: 128,
      event_count: 728632,
      event_type_id: 0,
      height: 4,
      sampleCount: 1,
    },
  ];
  it('HiperfThreadSenderTest01', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(traceRowData, traceRowData.length, true);
    });
    let traceRow = TraceRow.skeleton<HiPerfThreadStruct>();
    hiperfThreadDataSender(28917, -2, 1, 2000000000, traceRow).then((res) => {
      expect(res).toHaveLength(2);
    });
  });
});
