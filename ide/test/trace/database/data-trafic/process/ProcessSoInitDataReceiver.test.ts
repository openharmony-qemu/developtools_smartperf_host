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
  processSoInitDataReceiver
} from '../../../../../src/trace/database/data-trafic/process/ProcessSoInitDataReceiver';

jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});

describe('ProcessSoInitDataReceiver Test', () => {
  let data = {
    action: "exec-proto",
    id: "81",
    name: 8,
    params:
      {
        endNS: 29372913537,
        pid: 4794,
        recordEndNS: 262379203084,
        recordStartNS: 233006289547,
        sharedArrayBuffers: undefined,
        startNS: 0,
        t: 1703581047560,
        trafic: 3,
        width: 1407
      }
  }
  it('SoInitDataReceiverTest01', async () => {
    (self as unknown as Worker).postMessage = jest.fn(() => true);
    expect(processSoInitDataReceiver(data, () => {
      return [];
    })).toBeUndefined();
  });
});