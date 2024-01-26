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
import { HiPerfCpuStruct } from '../../../../../src/trace/database/ui-worker/hiperf/ProcedureWorkerHiPerfCPU2';
import { hiperfCpuDataSender } from '../../../../../src/trace/database/data-trafic/hiperf/HiperfCpuDataSender';
jest.mock('../../../../../src/js-heap/model/DatabaseStruct', () => {});
jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
describe('HiperfCpuDataSender Test',()=>{
  let HiperfCpuData = {
    startNS: 0,
    eventCount: 26655990,
    sampleCount: 63,
    event_type_id: 0,
    callchain_id: 3,
    height: 63,
    dur: 10000000,
    frame: {
      y: 0,
      height: 63,
      x: 0,
      width: 1
    }
  }
  it('HiperfCpuDataTest01 ', function () {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(HiperfCpuData, 1, true);
    });
   let cpu = -1;
   let drawType = -2;
   let maxCpuCount = 4;
   let intervalPerf = 1;
   let scale = 2000000000;
    let HiperfCpuDataTraceRow = TraceRow.skeleton<HiPerfCpuStruct>();
    hiperfCpuDataSender(cpu,drawType,maxCpuCount,intervalPerf,scale,HiperfCpuDataTraceRow).then(res => {
      expect(res).toHaveLength(1);
    });
  });
})

