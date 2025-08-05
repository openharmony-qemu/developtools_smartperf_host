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
import { HiSysEventStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerHiSysEvent';
import { hiSysEventDataSender } from '../../../../src/trace/database/data-trafic/HiSysEventDataSender';
jest.mock('../../../../src/js-heap/model/DatabaseStruct', () => {});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
describe('hiSysEventDataSender Test', () => {
  let hiSysEventData = {
    id: 808,
    ts: 78977,
    pid: 491,
    tid: 25,
    uid: 66,
    dur: 1,
    depth: 0,
    seq: 1,
    domain: 'MULTIMODALINPUT',
    eventName: 'TARGET_POINTER_EVENT_SUCCESS',
    info: '',
    level: 'MINOR',
    contents: '{"AGENT_WINDOWID":16,"EVENTTYPE":131072,"FD":33,"MSG":"The window manager successfully update target pointer","PID":4192,"TARGET_WINDOWID":16}',
    frame: {
      y: 10,
      height: 20,
      x: 168,
      width: 1
    },
    v: true
  }
  it('hiSysEventDataSenderTest01', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(hiSysEventData, 1, true);
    });
    let hiSysEventTraceRow = TraceRow.skeleton<HiSysEventStruct>();
    hiSysEventDataSender(hiSysEventTraceRow).then(result => {
      expect(result).toHaveLength(1);
    });
  });
});