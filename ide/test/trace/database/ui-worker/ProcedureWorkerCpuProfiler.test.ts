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
import { Rect } from '../../../../src/trace/component/trace/timer-shaft/Rect';
import {
  jsCpuProfiler,
  JsCpuProfilerRender,
  JsCpuProfilerStruct,
} from '../../../../src/trace/database/ui-worker/ProcedureWorkerCpuProfiler';

jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});
describe('ProcedureWorkerCpuProfiler Test', () => {
  let jsCpuProfilerRender = new JsCpuProfilerRender();
  let traceRow = new TraceRow();
  traceRow.frame = {height: 40, width: 1407, x: 0, y: 0};
  it('jsCpuProfilerTest', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    let traceRow = new TraceRow();
    traceRow.frame = {height: 40, width: 1407, x: 0, y: 0};
    let rect = new Rect(0, 10, 10, 10);
    let filter = [
      {
        startTime: 50,
        endTime: 1520000,
        name: 'Snapshot2',
        frame: {x: 0, y: 0, width: 25, height: 40},
        id: 0,
        depth: 1,
        selfTime: 0,
        url: '',
        totalTime: 83321693463,
        parentId: 123,
        children: [],
        isSelect: true,
      },
    ];
    let list = [
      {
        startTime: 250,
        endTime: 2333333,
        name: 'Snapshot0',
        frame: {x: 0, y: 0, width: 25, height: 20},
        id: 32,
        depth: 21,
        selfTime: 34,
        url: '',
        totalTime: 32155693464,
        parentId: 32,
        children: [],
        isSelect: true,
      },
    ];
    jsCpuProfiler(list, filter, 100254, 100254, rect, traceRow.frame, true);
  });

  it('JsCpuProfilerStructTest01', () => {
    const data = {
      frame: {
        x: 20,
        y: 20,
        width: 101,
        height: 101,
      },
      filterID: 2,
      startNs: 1,
      value: 1,
      maxValue: undefined,
      startTime: 1,
      size: 102,
      cpu: 1,
    };
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    expect(JsCpuProfilerStruct.draw(ctx, data)).toBeUndefined();
  });

  it('JsCpuProfilerStructTest02', () => {
    let node = {
      startTime: 150,
      endTime: 122000,
      name: 'Snapshot1',
      frame: {x: 1, y: 2, width: 25, height: 40},
      id: 12,
      depth: 1,
      selfTime: 1243,
      url: '',
      totalTime: 882141164,
      parentId: 1213,
      children: [],
      isSelect: true,
    };
    expect(JsCpuProfilerStruct.setJsCpuProfilerFrame(node, 0, 1, 2, traceRow.frame)).toBeUndefined();
  });
  it('JsCpuProfilerStructTest04', () => {
    expect(JsCpuProfilerStruct).not.toBeUndefined();
  });
  it('JsCpuProfilerStructTest05 ', function () {
    let jsCpuProfilerRender = new JsCpuProfilerRender();
    let canvas = document.createElement('canvas') as HTMLCanvasElement;
    let context = canvas.getContext('2d');
    const data = {
      context: context!,
      useCache: true,
      type: '',
      traceRange: [],
    };
    window.postMessage = jest.fn(() => true);
    TraceRow.range = jest.fn(() => true);
    TraceRow.range.startNS = jest.fn(() => 1);
    expect(jsCpuProfilerRender.renderMainThread(data, new TraceRow<JsCpuProfilerStruct>())).toBeUndefined();
  });
});
