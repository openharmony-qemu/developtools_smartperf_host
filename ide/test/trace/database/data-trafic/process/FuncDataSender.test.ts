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
import { FuncStruct } from '../../../../../src/trace/database/ui-worker/ProcedureWorkerFunc';
import { funcDataSender } from '../../../../../src/trace/database/data-trafic/process/FuncDataSender';
jest.mock('../../../../../src/js-heap/model/DatabaseStruct', () => {});
jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
describe('FuncDataSender Test',()=>{
  let FuncData = {
    startTs: 1115,
    dur: 0,
    argsetid: 1462,
    depth: 0,
    id: 633,
    itid: 120,
    ipid: 52,
    funName: "binder transaction async",
    frame: {
      x: 6,
      y: 0,
      width: 1,
      height: 20
    }
  }
  it('FuncDataSenderTest01 ', function () {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(FuncData, 1, true);
    });
    let tid = 1;
    let ipid = 52;
    let FuncDataTraceRow =  TraceRow.skeleton<FuncStruct>();
    funcDataSender(tid,ipid,FuncDataTraceRow).then(res=>{
      expect(res).toHaveLength(1);
    })
  });
})