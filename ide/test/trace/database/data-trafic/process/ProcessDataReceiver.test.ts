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

import { processDataReceiver } from '../../../../../src/trace/database/data-trafic/process/ProcessDataReceiver';

jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});

describe('ProcessDataReceiver Test', () => {
  let data = {
    action: "exec-proto",
    id: "6",
    name: 6,
    params:
      {
        endNS: 8711323000,
        pid: 431,
        recordEndNS: 512261248000,
        recordStartNS: 503549925000,
        sharedArrayBuffers: undefined,
        startNS: 0,
        t: 1703560455293,
        trafic: 0,
        width: 1407
      }
  }
  let processData = [
    {
      cpu: 1,
      dur: 1136000,
      startTime: 3650382000,
      v: true,
    },
    {
      cpu: 1,
      dur: 104000,
      startTime: 3665355000
    }
  ]
  it('ProcessDataReceiverTest01', async () => {
    (self as unknown as Worker).postMessage = jest.fn(() => true);
    expect(processDataReceiver(data, () => {
      return processData;
    })).toBeUndefined();
  });
});