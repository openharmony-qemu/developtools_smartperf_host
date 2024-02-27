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

import { threadDataReceiver } from '../../../../../src/trace/database/data-trafic/process/ThreadDataReceiver';

jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});

describe('ThreadDataReceiver Test', () => {
  let data = {
    action: "exec-proto",
    id: "258",
    name: 30,
    params:
      {
        endNS: 29372913537,
        pid: 1668,
        recordEndNS: 262379203084,
        recordStartNS: 233006289547,
        sharedArrayBuffers: undefined,
        startNS: 0,
        t: 1703581047560,
        trafic: 2,
        width: 1407
      }
  }

  let threadData = [
    {
      argSetId: -1,
      cpu: null,
      dur: 2327000,
      id: 16,
      pid: 590,
      px: 285,
      startTime: 2029133000,
      state: "D",
      tid: 590
    },
    {
      argSetId: -1,
      cpu: 3,
      dur: 14494000,
      id: 6,
      pid: 1668,
      px: 1331,
      startTime: 9464658000,
      state: "Running",
      tid: 1699
    }
  ]
  it('ThreadDataReceiverTest01', async () => {
    (self as unknown as Worker).postMessage = jest.fn(() => true);
    expect(threadDataReceiver(data, () => {
      return threadData;
    })).toBeUndefined();
  });
});