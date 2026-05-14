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
  filterNativeMemoryChartData,
  nativeMemoryDataHandler
} from '../../../../src/trace/database/data-trafic/NativeMemoryDataReceiver';

describe(' NativeMemoryDataReceiver Test', () => {
  let data;
  let proc;
  const dataCache = {
    normalCache: new Map(),
    statisticsCache: new Map(),
  };
  beforeEach(() => {
    data = {
      id: 'c07094fb-5340-4f1e-be9d-cd4071a77e24',
      name: 206,
      action: 'exec-proto',
      params: {
        totalNS: 108952700947,
        recordStartNS: 8406282873525,
        recordEndNS: 8515235574472,
        model: 'native_hook',
        processes: [
          1
        ],
        trafic: 1,
        isCache: true
      }
    };
    proc = jest.fn((sql) => [
      {data: {id: 4, startTs: 4.4, pid: 40, tid: 400, dur: 40000, depth: 4}},
      {data: {id: 5, startTs: 5.5, pid: 50, tid: 500, dur: 50000, depth: 5}},
    ]);
  });
  afterEach(() => {
    dataCache.normalCache.clear();
    dataCache.statisticsCache.clear();
  });
  it(' NativeMemoryDataReceiver01', () => {
    const mockPostMessage = jest.fn();
    global.postMessage = mockPostMessage;
    nativeMemoryDataHandler(data, proc);
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
  });
  it(' NativeMemoryDataReceiver02', () => {
    const model = 'native_hook';
    const startNS = 0;
    const endNS = 100;
    const totalNS = 200;
    const drawType = 0;
    const frame = 1;
    const key = 'testKey';
    const result = filterNativeMemoryChartData(model, startNS, endNS, totalNS, drawType, frame, key);
    expect(result.startTime).toEqual([]);
    expect(result.dur).toEqual([]);
    expect(result.heapSize).toEqual([]);
    expect(result.density).toEqual([]);
  });

  it('NativeMemoryDataReceiver03 - should process ARKTS_STATIC_HEAP data', () => {
    const mockData = {
      id: 'test-id',
      name: 1,
      action: 'exec-proto',
      params: {
        totalNS: 1000000,
        recordStartNS: 0,
        recordEndNS: 1000000,
        model: 'native_hook_statistic',
        processes: [1],
        trafic: 1,
        isCache: true
      }
    };

    const mockProc = jest.fn((sql) => {
      return [
        {
          data: {
            id: 1,
            type: 21, // ARKTS_STATIC_HEAP
            startTs: 1000,
            endTs: 2000,
            heapSize: 1024,
            count: 10,
            max: 2048
          }
        }
      ];
    });

    const mockPostMessage = jest.fn();
    global.postMessage = mockPostMessage;

    nativeMemoryDataHandler(mockData, mockProc);
    expect(mockPostMessage).toHaveBeenCalled();
  });

  it('NativeMemoryDataReceiver04 - should filter ARKTS_STATIC_HEAP chart data', () => {
    const model = 'native_hook_statistic';
    const startNS = 0;
    const endNS = 1000000;
    const totalNS = 2000000;
    const drawType = 0;
    const frame = 1;
    const key = 'arktsStaticHeap';

    const result = filterNativeMemoryChartData(model, startNS, endNS, totalNS, drawType, frame, key);
    expect(result).toBeDefined();
    expect(result.startTime).toBeDefined();
    expect(result.dur).toBeDefined();
    expect(result.heapSize).toBeDefined();
    expect(result.density).toBeDefined();
  });
});
