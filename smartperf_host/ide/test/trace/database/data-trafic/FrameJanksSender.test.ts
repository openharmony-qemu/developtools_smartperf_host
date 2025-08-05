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
import { frameJanksSender } from '../../../../src/trace/database/data-trafic/FrameJanksSender';
import { TraceRow } from '../../../../src/trace/component/trace/base/TraceRow';
import { JanksStruct } from '../../../../src/trace/bean/JanksStruct';
import { QueryEnum } from '../../../../src/trace/database/data-trafic/utils/QueryEnum';
jest.mock('../../../../src/js-heap/model/DatabaseStruct', () => {});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});

describe('FrameJanksSender Test', () => {
  let expectedData = {
    app_dur: 16603333,
    cmdline: "com.ohos.launch",
    depth: 0,
    dur: 16603333,
    frame: {x: 167, y: 0, width: 3, height: 20},
    frame_type: "frameTime",
    id: 157,
    ipid: 19,
    jank_tag: 65535,
    name: 2087,
    pid: 2128,
    rs_dur: 16603333,
    rs_ipid: 15,
    rs_name: "swapper",
    rs_pid: 994,
    rs_ts: 1038812,
    rs_vsync: 1080,
    ts: 1038812
  }

  let actualData = {
    app_dur: 3403000,
    cmdline: "com.ohos.launch",
    depth: 0,
    dur: 17569000,
    frame: {x: 739, y: 0, width: 3, height: 20},
    frame_type: "frameTime",
    id: 898,
    ipid: 19,
    jank_tag: 0,
    name: 2275,
    pid: 2128,
    rs_dur: 1192000,
    rs_ipid: 15,
    rs_name: "swapper",
    rs_pid: 994,
    rs_ts: 4598062,
    rs_vsync: 1255,
    ts: 4581685,
    type: "0"
  }

  it('FrameJanksSenderTest01',  () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(expectedData, 1, true);
    });
    let expectedTraceRow = TraceRow.skeleton<JanksStruct>();
    frameJanksSender(QueryEnum.FrameExpectedData, expectedTraceRow).then(result => {
      expect(result).toHaveLength(1);
    });
  });

  it('FrameJanksSenderTest02',  () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(actualData, 1, true);
    });
    let actualTraceRow = TraceRow.skeleton<JanksStruct>();
    frameJanksSender(QueryEnum.FrameActualData, actualTraceRow).then(result => {
      expect(result).toHaveLength(1);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});