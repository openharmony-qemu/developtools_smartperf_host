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

import { TraceRow } from '../../../../src/trace/component/trace/base/TraceRow';
import { threadPool } from '../../../../src/trace/database/SqlLite';
import {
  abilityDmaDataSender,
  abilityGpuMemoryDataSender,
  abilityPurgeableDataSender,
  dmaDataSender,
  gpuGpuDataSender,
  gpuMemoryDataSender,
  gpuResourceDataSender,
  gpuTotalDataSender,
  gpuWindowDataSender,
  purgeableDataSender,
  shmDataSender,
  sMapsDataSender
} from '../../../../src/trace/database/data-trafic/VmTrackerDataSender';
import { SnapshotStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot';

jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});

describe('VmTrackerDataSender Test', () => {
  let data = [{
    dur: 1000000000,
    endNs: 5762581249,
    frame: {x: 61, y: 3, width: 13, height: 33},
    name: "SnapShot 1",
    startNs: 4762581249,
    textWidth: 54.6826171875,
    value: 213135360
  }]
  it('VmTrackerDataSenderTest01', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(data, data.length, true);
    });
    let sMapsTraceRow = TraceRow.skeleton<SnapshotStruct>();
    sMapsDataSender('dirty', sMapsTraceRow).then(result => {
      expect(result).toHaveLength(1);
      expect(threadPool.submitProto).toHaveBeenCalled();
    });
  });

  it('VmTrackerDataSenderTest02', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(data, data.length, true);
    });
    let dmaTraceRow = TraceRow.skeleton<SnapshotStruct>();
    dmaDataSender(1, dmaTraceRow).then(result => {
      expect(result).toHaveLength(1);
      expect(threadPool.submitProto).toHaveBeenCalled();
    });
  });

  it('VmTrackerDataSenderTest03', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(data, data.length, true);
    });
    let gpuMemoryTraceRow = TraceRow.skeleton<SnapshotStruct>();
    gpuMemoryDataSender(1, gpuMemoryTraceRow).then(result => {
      expect(result).toHaveLength(1);
      expect(threadPool.submitProto).toHaveBeenCalled();
    });
  });

  it('VmTrackerDataSenderTest04', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(data, data.length, true);
    });
    let gpuResourceTraceRow = TraceRow.skeleton<SnapshotStruct>();
    gpuResourceDataSender(13, gpuResourceTraceRow).then(result => {
      expect(result).toHaveLength(1);
      expect(threadPool.submitProto).toHaveBeenCalled();
    });
  });

  it('VmTrackerDataSenderTest05', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(data, data.length, true);
    });
    let gpuGpuTraceRow = TraceRow.skeleton<SnapshotStruct>();
    gpuGpuDataSender(13, "'mem.graph_pss'", gpuGpuTraceRow).then(result => {
      expect(result).toHaveLength(1);
      expect(threadPool.submitProto).toHaveBeenCalled();
    });
  });

  it('VmTrackerDataSenderTest06', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(data, data.length, true);
    });
    let gpuTotalTraceRow = TraceRow.skeleton<SnapshotStruct>();
    gpuTotalDataSender(13, gpuTotalTraceRow).then(result => {
      expect(result).toHaveLength(1);
      expect(threadPool.submitProto).toHaveBeenCalled();
    });
  });

  it('VmTrackerDataSenderTest07', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(data, data.length, true);
    });
    let gpuWindowTraceRow = TraceRow.skeleton<SnapshotStruct>();
    gpuWindowDataSender(13, 15, gpuWindowTraceRow).then(result => {
      expect(result).toHaveLength(1);
      expect(threadPool.submitProto).toHaveBeenCalled();
    });
  });

  it('VmTrackerDataSenderTest08', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(data, data.length, true);
    });
    let shmTraceRow = TraceRow.skeleton<SnapshotStruct>();
    shmDataSender(13, shmTraceRow).then(result => {
      expect(result).toHaveLength(1);
      expect(threadPool.submitProto).toHaveBeenCalled();
    });
  });

  it('VmTrackerDataSenderTest09', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(data, data.length, true);
    });
    let purgeableTraceRow = TraceRow.skeleton<SnapshotStruct>();
    purgeableDataSender(13, purgeableTraceRow).then(result => {
      expect(result).toHaveLength(1);
      expect(threadPool.submitProto).toHaveBeenCalled();
    });
  });

  it('VmTrackerDataSenderTest10', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(data, data.length, true);
    });
    let abilityPurgeablTraceRow = TraceRow.skeleton<SnapshotStruct>();
    abilityPurgeableDataSender(abilityPurgeablTraceRow, 1000000000, false).then(result => {
      expect(result).toHaveLength(1);
      expect(threadPool.submitProto).toHaveBeenCalled();
    });
  });

  it('VmTrackerDataSenderTest11', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(data, data.length, true);
    });
    let abilityDmaTraceRow = TraceRow.skeleton<SnapshotStruct>();
    abilityDmaDataSender(abilityDmaTraceRow, 1000000000).then(result => {
      expect(result).toHaveLength(1);
      expect(threadPool.submitProto).toHaveBeenCalled();
    });
  });

  it('VmTrackerDataSenderTest12', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(data, data.length, true);
    });
    let abilityGpuMemoryTraceRow = TraceRow.skeleton<SnapshotStruct>();
    abilityGpuMemoryDataSender(abilityGpuMemoryTraceRow, 1000000000).then(result => {
      expect(result).toHaveLength(1);
      expect(threadPool.submitProto).toHaveBeenCalled();
    });
  });
});