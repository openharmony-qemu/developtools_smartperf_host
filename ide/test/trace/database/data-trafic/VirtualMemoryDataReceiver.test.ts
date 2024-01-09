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

import { virtualMemoryDataReceiver } from '../../../../src/trace/database/data-trafic/VirtualMemoryDataReceiver';

jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});

describe('VirtualMemoryDataReceiver Test', () => {
  let data = {
    action: "exec-proto",
    id: "30",
    name: 12,
    params:
      {
        endNS: 109726762483,
        filterId: 6347,
        recordEndNS: 490640100187894,
        recordStartNS: 490530373425411,
        sharedArrayBuffers: undefined,
        startNS: 0,
        t: 1703643817436,
        trafic: 3,
        width: 1407
      }
  }

  let vmData = [{
    virtualMemData: {
      delta: -1,
      duration: 252,
      filterId: 6347,
      maxValue: -1,
      startTime: 19680640101,
      value: 423440
    }
  }]
  it('VirtualMemoryReceiverTest01', async () => {
    const mockCallback = jest.fn(() => vmData);
    const mockPostMessage = jest.fn();
    (self as unknown as Worker).postMessage = mockPostMessage;
    virtualMemoryDataReceiver(data, mockCallback);
    expect(mockCallback).toHaveBeenCalled();
  });
});