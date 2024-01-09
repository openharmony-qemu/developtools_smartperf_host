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
import { QueryEnum } from '../../../../src/trace/database/data-trafic/QueryEnum';
import { CpuFreqLimitsStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerCpuFreqLimits';
import { cpuFreqLimitSender } from '../../../../src/trace/database/data-trafic/CpuFreqLimitDataSender';

jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
describe(' CpuFreqLimitDataSender Test', () => {
  let  CpuFreqLimitData = [{
    cpu: 1,
    value: 884000,
    dur: -1,
    startNS: 9400191145,
    frame: {
      y: 5,
      height: 30,
      x: 547,
      width: 1
    }
  }];
  it(' CpuFreqLimitDataSenderTest01 ', function () {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(CpuFreqLimitData, CpuFreqLimitData.length, true);
    });
    let CpuFreqLimitDataTraceRow = TraceRow.skeleton<CpuFreqLimitsStruct>();
    let maxId = 0;
    let minId = 0;
    let cpu = 1;
    cpuFreqLimitSender(maxId,minId,QueryEnum.CpuFreqLimitData, CpuFreqLimitDataTraceRow).then(res => {
      expect(res).toHaveLength(1);
    });
  });
});