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

import { threadPool } from '../../../../src/trace/database/SqlLite';
import { TraceRow } from '../../../../src/trace/component/trace/base/TraceRow';
import {
  nativeMemoryChartDataCacheSender,
  nativeMemoryChartDataSender
} from '../../../../src/trace/database/data-trafic/NativeMemoryDataSender';
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../src/js-heap/model/DatabaseStruct', () => {});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
describe('NativeMemoryDataSender Test',()=>{
  let NativeMemoryData =  {
    startTime: 3384,
    dur: 369,
    heapsize: 173,
    density: 193,
    maxHeapSize: 58,
    maxDensity: 4993,
    minHeapSize: 0,
    minDensity: 0,
    frame: {
      x: 17,
      y: 5,
      width: 2,
      height: 30
    }
  }
  it('NativeMemoryDataSenderTest01 ', function () {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(NativeMemoryData, 1, true);
    });
    let nativeMemoryChartDataTraceRow = TraceRow.skeleton<any>();
    let setting = {
      eventType: 0,
      ipid: 1,
      model: "native_hook",
      drawType: 0
    }
    nativeMemoryChartDataSender(nativeMemoryChartDataTraceRow,setting).then(res => {
      expect(res).toHaveLength(1);
    });
  });
  it('NativeMemoryDataSenderTest02 ', function () {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(NativeMemoryData, 1, true);
    });
    let processes = [1];
    let model = 'native_hook';
    nativeMemoryChartDataCacheSender(processes,model).then(res => {
      expect(res).toHaveLength(2);
    });
  });
})