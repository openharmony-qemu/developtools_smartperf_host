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

import { threadPool } from '../../../../src/trace/database/SqlLite';
import { TraceRow } from '../../../../src/trace/component/trace/base/TraceRow';
import { processActualDataSender } from '../../../../src/trace/database/data-trafic/ProcessActualDataSender';
import { JankStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerJank';

jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});

describe('ProcessActualDataSender Test', () => {
  let actualData = [
    {
      cmdline: "com.ohos.launch",
      depth: 0,
      dst_slice: 506,
      dur: 2273000,
      frame: {x: 393, y: 0, width: 1, height: 20},
      frame_type: "app",
      id: 502,
      jank_tag: 0,
      name: 2171,
      pid: 2128,
      src_slice: "",
      ts: 2435796000,
      type: 0
    },
    {
      cmdline: "com.ohos.launch",
      depth: 0,
      dst_slice: 510,
      dur: 2395000,
      frame: {x: 395, y: 0, width: 1, height: 20},
      frame_type: "app",
      id: 508,
      jank_tag: 0,
      name: 2172,
      pid: 2128,
      src_slice: "",
      ts: 2452847000,
      type: 0
    }]
  it('ActualDataSenderTest01', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(actualData, actualData.length, true);
    });
    let actualTraceRow = TraceRow.skeleton<JankStruct>();
    processActualDataSender(2128, actualTraceRow).then(result => {
      expect(result).toHaveLength(2);
    });
  });
});