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
  processDeliverInputEventDataReceiver
} from '../../../../../src/trace/database/data-trafic/process/ProcessDeliverInputEventDataReceiver';

jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});

describe('DeliverInputEventDataReceiver Test', () => {
  let data = {
    action: "exec-proto",
    id: "52",
    name: 28,
    params:
      {
        endNS: 20000305000,
        recordEndNS: 168778663166000,
        recordStartNS: 168758662861000,
        sharedArrayBuffers: undefined,
        startNS: 0,
        t: 1703561897634,
        tid: "1298",
        trafic: 3,
        width: 1407
      }
  }
  let res = [
    {
      processInputEventData: {
        argsetid: -1,
        cookie: 10350,
        dur: 83000,
        id: 41459,
        isMainThread: 1,
        parentId: -1,
        pid: 1298,
        startTs: 7379559000,
        tid: 1298,
        trackId: 14
      }
    }]
  it('DeliverInputEventDataReceiverTest01', async () => {
    let mockCallback = jest.fn(() => res);
    (self as unknown as Worker).postMessage = jest.fn();
    processDeliverInputEventDataReceiver(data, mockCallback);
    expect(mockCallback).toHaveBeenCalled();
  });
});