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
import { CpuFreqStruct } from '../../../../../src/trace/database/ui-worker/ProcedureWorkerFreq';
import { cpuFreqDataSender } from '../../../../../src/trace/database/data-trafic/cpu/CpuFreqDataSender';
import { QueryEnum } from '../../../../../src/trace/database/data-trafic/utils/QueryEnum';
jest.mock('../../../../../src/js-heap/model/DatabaseStruct', () => {});
jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
describe('CpuFreqDataSender Test', () => {
  let CpuFreqData = {
    cpu: 1,
    value: 88400,
    dur: 566,
    startNS: 9400,
    frame: {
      y: 5,
      height: 30,
      x: 547,
      width: 1
    }
  }
  it('CpuFreqDataSenderTest01 ', function () {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(CpuFreqData, 1, true);
    });
    let cpuFreqDataTraceRow = TraceRow.skeleton<CpuFreqStruct>();
    cpuFreqDataSender(QueryEnum.CpuData, cpuFreqDataTraceRow).then(res => {
      expect(res).toHaveLength(1);
    });
  });
});