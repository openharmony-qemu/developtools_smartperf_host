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
  frameActualReceiver,
  frameExpectedReceiver
} from "../../../../src/trace/database/data-trafic/FrameJanksReceiver";

describe('FrameJanksReceiver Test', () => {
  let data = {
    action: "exec-proto",
    id: "5",
    name: 16,
    params: {
      endNS: 8711323000,
      queryEnum: 16,
      recordEndNS: 512261248000,
      recordStartNS: 503549925000,
      sharedArrayBuffers: undefined,
      startNS: 0,
      t: 1703484466189,
      trafic: 3,
      width: 1407
    }
  }

  let expectData = {
    frameData: {
      appDur: 16634548,
      cmdline: "com.wx",
      depth: 2,
      dur: 33269438,
      frameType: "frameTime",
      id: 1007,
      ipid: 135,
      jankTag: -1,
      name: 2299,
      pid: 3104,
      rsDur: 16634548,
      rsIpid: 15,
      rsPid: 994,
      rsTs: 4996898311,
      rsVsync: 1279,
      ts: 4980263421,
      type: "1"
    }
  }

  let actualData = {
    frameData: {
      appDur: 1697000,
      cmdline: "com.ohos.launch",
      depth: 0,
      dur: 24662000,
      frameType: "frameTime",
      id: 918,
      ipid: 19,
      name: 2280,
      pid: 2128,
      rsDur: 11082000,
      rsIpid: 15,
      rsPid: 994,
      rsTs: 4681218000,
      rsVsync: 1260,
      ts: 4667638000,
      type: "0"
    }
  }
  it('FrameJanksReceiverTest01', function () {
    (self as unknown as Worker).postMessage = jest.fn(() => true);
    expect(frameExpectedReceiver(data, () => {
      return expectData;
    })).toBeUndefined();
  });

  it('FrameJanksReceiverTest02', function () {
    (self as unknown as Worker).postMessage = jest.fn(() => true);
    expect(frameActualReceiver(data, () => {
      return actualData;
    })).toBeUndefined();
  });
});