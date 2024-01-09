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
import { ClockStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerClock';
import { QueryEnum } from '../../../../src/trace/database/data-trafic/QueryEnum';
import { clockDataSender } from '../../../../src/trace/database/data-trafic/ClockDataSender';
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
describe('ClockDataSender Test',()=>{
   let clockData = [{
     filterId: 89,
     value: 48000,
     startNS: 197364063,
     dur: 230475000,
     type: "measure",
     delta: 0,
     frame: {
       y: 5,
       height: 30,
       x: 11,
       width: 14
     }
   }]
  it('ClockDataSenderTest01 ', function () {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(clockData, clockData.length, true);
    });
    let clockTraceRow =  TraceRow.skeleton<ClockStruct>();
    clockDataSender( '','screenState',clockTraceRow).then(result => {
      expect(result).toHaveLength(1);
    });
  });
})