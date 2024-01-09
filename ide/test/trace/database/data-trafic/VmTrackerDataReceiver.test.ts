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
  abilityDmaDataReceiver, abilityGpuMemoryDataReceiver,
  abilityPurgeableDataReceiver,
  dmaDataReceiver,
  gpuDataReceiver,
  gpuMemoryDataReceiver,
  gpuResourceDataReceiver,
  gpuTotalDataReceiver,
  gpuWindowDataReceiver,
  purgeableDataReceiver,
  shmDataReceiver,
  sMapsDataReceiver
} from "../../../../src/trace/database/data-trafic/VmTrackerDataReceiver";

describe('VmTrackerDataReceiver Test', () => {
  let data = {
    action: "exec-proto",
    id: "6",
    name: 82,
    params: {
      endNs: 109726762483,
      ipid: 1,
      recordEndNS: 490640100187894,
      recordStartNS: 490530373425411,
      sharedArrayBuffers: undefined,
      startNs: 0,
      trafic: 3,
      width: 1424
    }
  };
  let res = [{
    trackerData: {
      startNs: 4762581249,
      value: 108232704
    }
  }]
  it('VmTrackerDataReceiverTest01', function () {
    const mockCallback = jest.fn(() => res);
    (self as unknown as Worker).postMessage = jest.fn();
    sMapsDataReceiver(data, mockCallback);
    expect(mockCallback).toHaveBeenCalled();
  });

  it('VmTrackerDataReceiverTest02', function () {
    const mockCallback = jest.fn(() => res);
    (self as unknown as Worker).postMessage = jest.fn();
    dmaDataReceiver(data, mockCallback);
    expect(mockCallback).toHaveBeenCalled();
  });

  it('VmTrackerDataReceiverTest03', function () {
    const mockCallback = jest.fn(() => res);
    (self as unknown as Worker).postMessage = jest.fn();
    gpuMemoryDataReceiver(data, mockCallback);
    expect(mockCallback).toHaveBeenCalled();
  });

  it('VmTrackerDataReceiverTest04', function () {
    const mockCallback = jest.fn(() => res);
    (self as unknown as Worker).postMessage = jest.fn();
    gpuDataReceiver(data, mockCallback);
    expect(mockCallback).toHaveBeenCalled();
  });

  it('VmTrackerDataReceiverTest05', function () {
    const mockCallback = jest.fn(() => res);
    (self as unknown as Worker).postMessage = jest.fn();
    gpuResourceDataReceiver(data, mockCallback);
    expect(mockCallback).toHaveBeenCalled();
  });

  it('VmTrackerDataReceiverTest06', function () {
    const mockCallback = jest.fn(() => res);
    (self as unknown as Worker).postMessage = jest.fn();
    gpuTotalDataReceiver(data, mockCallback);
    expect(mockCallback).toHaveBeenCalled();
  });

  it('VmTrackerDataReceiverTest07', function () {
    const mockCallback = jest.fn(() => res);
    (self as unknown as Worker).postMessage = jest.fn();
    gpuWindowDataReceiver(data, mockCallback);
    expect(mockCallback).toHaveBeenCalled();
  });

  it('VmTrackerDataReceiverTest08', function () {
    const mockCallback = jest.fn(() => res);
    (self as unknown as Worker).postMessage = jest.fn();
    shmDataReceiver(data, mockCallback);
    expect(mockCallback).toHaveBeenCalled();
  });

  it('VmTrackerDataReceiverTest09', function () {
    const mockCallback = jest.fn(() => res);
    (self as unknown as Worker).postMessage = jest.fn();
    purgeableDataReceiver(data, mockCallback);
    expect(mockCallback).toHaveBeenCalled();
  });

  it('VmTrackerDataReceiverTest10', function () {
    const mockCallback = jest.fn(() => res);
    (self as unknown as Worker).postMessage = jest.fn();
    abilityPurgeableDataReceiver(data, mockCallback);
    expect(mockCallback).toHaveBeenCalled();
  });

  it('VmTrackerDataReceiverTest11', function () {
    const mockCallback = jest.fn(() => res);
    (self as unknown as Worker).postMessage = jest.fn();
    abilityDmaDataReceiver(data, mockCallback);
    expect(mockCallback).toHaveBeenCalled();
  });

  it('VmTrackerDataReceiverTest12', function () {
    const mockCallback = jest.fn(() => res);
    (self as unknown as Worker).postMessage = jest.fn();
    abilityGpuMemoryDataReceiver(data, mockCallback);
    expect(mockCallback).toHaveBeenCalled();
  });
});