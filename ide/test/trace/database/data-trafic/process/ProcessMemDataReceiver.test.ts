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

import { processMemDataReceiver } from '../../../../../src/trace/database/data-trafic/process/ProcessMemDataReceiver';

jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});

describe('ProcessMemDataReceiver Test', () => {
  let data = {
    action: "exec-proto",
    id: "71",
    name: 7,
    params:
      {
        endNS: 20000305000,
        recordEndNS: 168778663166000,
        recordStartNS: 168758662861000,
        sharedArrayBuffers: undefined,
        startNS: 0,
        t: 1703574363518,
        trackId: 543,
        trafic: 3,
        width: 1407
      }
  }
  let memData = [{
    processMemData: {
      startTime: 7578590000,
      trackId: 545,
      ts: 168766241451000,
      value: 1728
    }
  }]
  it('ProcessMemDataReceiverTest01', async () => {
    (self as unknown as Worker).postMessage = jest.fn(() => true);
    expect(processMemDataReceiver(data, () => {
      return memData;
    })).toBeUndefined();
  });
});