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

import {
  logDataReceiver,
  chartLogDataSql
} from '../../../../src/trace/database/data-trafic/LogDataReceiver';
import { TraficEnum } from "../../../../src/trace/database/data-trafic/utils/QueryEnum";

describe('logDataReceiver Test', () => {
  let data;
  let proc;

  beforeEach(() => {
    data = {
      params: {
        trafic: TraficEnum.ProtoBuffer,
        sharedArrayBuffers: {
          id: new Uint16Array([1, 2, 3]),
        },
      },
    };
    proc = jest.fn((sql) => [
      {logData: {id: 4, startTs: 4.4, pid: 40, tid: 400, dur: 40000, depth: 4}},
      {logData: {id: 5, startTs: 5.5, pid: 50, tid: 500, dur: 50000, depth: 5}},
    ]);
  });
  it('logDataReceiverTest01', () => {
    const args = {
      recordStartNS: 1000,
      endNS: 3000,
      startNS: 2000,
      width: 10
    };
    expect(chartLogDataSql(args)).toBeTruthy();
  });
  it('logDataReceiverTest02', () => {
    const mockPostMessage = jest.fn();
    global.postMessage = mockPostMessage;
    logDataReceiver(data, proc);
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
  });
});