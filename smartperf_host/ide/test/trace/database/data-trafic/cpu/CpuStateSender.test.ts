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
import { cpuStateSender } from '../../../../../src/trace/database/data-trafic/cpu/CpuStateSender';
import { TraceRow } from '../../../../../src/trace/component/trace/base/TraceRow';
import { CpuStateStruct } from '../../../../../src/trace/database/ui-worker/cpu/ProcedureWorkerCpuState';
jest.mock('../../../../../src/js-heap/model/DatabaseStruct', () => {});
jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
describe('CpuStateSender Test', () => {
  let cpuStateData = {
    value: 0,
    dur: 193229,
    height: 4,
    startTs: 69926,
    cpu: 1,
    frame: {
      y: 5,
      height: 30,
      x: 364,
      width: 1
    }
  }
  it('CpuStateSenderTest01 ', function () {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(cpuStateData, 1, true);
    });
    let filterId = 1;
    let CpustataDataTraceRow = TraceRow.skeleton<CpuStateStruct>();
    cpuStateSender(filterId,CpustataDataTraceRow).then(result => {
      expect(result).toHaveLength(1);
    });
  });
});