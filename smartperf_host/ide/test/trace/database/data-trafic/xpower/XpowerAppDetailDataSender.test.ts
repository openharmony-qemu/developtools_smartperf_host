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

import { xpowerAppDetailDataSender } from '../../../../../src/trace/database/data-trafic/xpower/XpowerAppDetailDataSender';
import { threadPool } from '../../../../../src/trace/database/SqlLite';
import { TraceRow } from '../../../../../src/trace/component/trace/base/TraceRow';
import { XpowerAppDetailStruct } from '../../../../../src/trace/database/ui-worker/ProcedureWorkerXpowerAppDetail';
jest.mock('../../../../../src/js-heap/model/DatabaseStruct', () => {});
jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});

describe('xpowerAppDetailDataSender Test', () => {
  let data = {
    startTime: 100,
    c1hz: 100,
    c5hz: 100,
    c10hz: 100,
    c15hz: 100,
    c24hz: 100,
    c30hz: 100,
    c45hz: 100,
    c60hz: 100,
    c90hz: 100,
    c120hz: 100,
    c180hz: 100,
  };
  it('xpowerAppDetailDataSenderTest01', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(data, 1, true);
    });
    let traceRow = TraceRow.skeleton<XpowerAppDetailStruct>();
    xpowerAppDetailDataSender(traceRow).then((result) => {
      expect(result).toBeTruthy();
    });
  });
});