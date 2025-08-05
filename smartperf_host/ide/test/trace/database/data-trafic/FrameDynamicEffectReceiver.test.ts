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
  frameAnimationReceiver,
  frameDynamicReceiver,
  frameSpacingReceiver
} from '../../../../src/trace/database/data-trafic/FrameDynamicEffectReceiver';

describe('FrameDynamicEffectReceiver Test', () => {
  let data = {
    action: "exec-proto",
    id: "1",
    name: 18,
    params: {
      recordStartNS: 4049847357191,
      recordEndNS: 4059275045731,
      startNS: 0,
      t: 1703474011224,
      width: 1407,
      trafic: 3
    }
  };
  let animationData = [{
    frameAnimationData: {
      depth: 0,
      dur: 79379165,
      endTs: 1451353646,
      name: "H:APP_LIST_FLING, com.tencent.mm",
      startTs: 1371974481
    }
  }]
  let dynamicData = [{
    frameDynamicData: {
      alpha: "0.08",
      appName: "WindowScene_mm37",
      height: "1119",
      ts: 179994792,
      width: "543",
      x: "513",
      y: "1017"
    }
  }, {
    frameDynamicData: {
      alpha: "0.26",
      appName: "WindowScene_mm37",
      height: "1293",
      ts: 196844792,
      width: "627",
      x: "459",
      y: "938"
    }
  }]
  let frameSpacingData = [{
    frameSpacingData: {
      currentFrameHeight: "1119",
      currentFrameWidth: "543",
      currentTs: 179994792,
      frameSpacingResult: 0,
      nameId: "WindowScene_mm37",
      preFrameHeight: 0,
      preFrameWidth: 0,
      preTs: 0,
      preX: 0,
      preY: 0,
      x: "513",
      y: "1017"
    }
  }]
  it('FrameDynamicEffectReceiverTest01', function () {
    const mockCallback = jest.fn(() => animationData);
    const mockPostMessage = jest.fn();
    (self as unknown as Worker).postMessage = mockPostMessage;
    frameAnimationReceiver(data, mockCallback);
    expect(mockCallback).toHaveBeenCalled();
  });

  it('FrameDynamicEffectReceiverTest02', function () {
    const mockCallback = jest.fn(() => dynamicData);
    const mockPostMessage = jest.fn();
    (self as unknown as Worker).postMessage = mockPostMessage;
    frameDynamicReceiver(data, mockCallback);
    expect(mockCallback).toHaveBeenCalled();
  });
  it('FrameDynamicEffectReceiverTest03', function () {
    let mockCallback = jest.fn(() => frameSpacingData);
    (self as unknown as Worker).postMessage = jest.fn();
    frameSpacingReceiver(data, mockCallback);
    expect(mockCallback).toHaveBeenCalled();
  });
});