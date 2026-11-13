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
import { CpuStruct } from '../../../../src/trace/database/ui-worker/cpu/ProcedureWorkerCPU';
import { cpuDataSender } from '../../../../src/trace/database/data-trafic/CpuDataSender';
import { QueryEnum } from '../../../../src/trace/database/data-trafic/utils/QueryEnum';
jest.mock('../../../../src/js-heap/model/DatabaseStruct', () => {});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
describe('CpuDataSender Test', () => {
  let CpuData = {
    processId: 182,
    cpu: 0,
    tid: 182,
    id: 76,
    dur: 198041,
    startTime: 6670,
    end_state: 'S',
    priority: 4294,
    processName: 'sugov:0',
    processCmdLine: 'sugov:0',
    name: 'sugov:0',
    type: 'thread',
    frame: {
      y: 5,
      height: 30,
      x: 4,
      width: 1
    },
    translateY: 0
  }
  it('CpuDataSenderTest01 ', function () {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(CpuData, 1, true);
    });
    let CpuDataTraceRow = TraceRow.skeleton<CpuStruct>();
    cpuDataSender(QueryEnum.CpuData, CpuDataTraceRow).then(res => {
      expect(res).toHaveLength(1);
    });
  });
});
