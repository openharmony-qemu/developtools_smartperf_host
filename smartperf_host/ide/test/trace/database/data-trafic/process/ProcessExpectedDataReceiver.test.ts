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
  processExpectedDataReceiver
} from '../../../../../src/trace/database/data-trafic/process/ProcessExpectedDataReceiver';

jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});

describe('ProcessExpectedDataReceiver Test', () => {
  let data = {
    action: "exec-proto",
    id: "966",
    name: 26,
    params:
      {
        endNS: 8711323000,
        pid: 994,
        recordEndNS: 512261248000,
        recordStartNS: 503549925000,
        sharedArrayBuffers: undefined,
        startNS: 0,
        t: 1703572989578,
        trafic: 3,
        width: 1407
      }
  }
  let expectedData = [{
    processJanksFramesData: {
      dur: 16627734,
      id: 415,
      name: 1143,
      pid: 994,
      ts: 2086211199,
      type: 1
    }
  }]
  it('ExpectedDataReceiverTest01', async () => {
    (self as unknown as Worker).postMessage = jest.fn(() => true);
    expect(processExpectedDataReceiver(data, () => {
      return expectedData;
    })).toBeUndefined();
  });
});