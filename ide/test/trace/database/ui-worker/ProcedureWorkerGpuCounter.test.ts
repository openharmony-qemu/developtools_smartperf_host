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
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
import {
  MaleoonCounterObj,
  GpuCounterStruct,
  gpuCounterChart,
  GpuCounterRender,
  GpuCounterType,
} from '../../../../src/trace/database/ui-worker/ProcedureWorkerGpuCounter';
import { Rect } from '../../../../src/trace/component/trace/timer-shaft/Rect';
jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});
describe('Test', () => {
  let row: TraceRow<GpuCounterStruct>;
  let context: CanvasRenderingContext2D;

  row = TraceRow.skeleton<GpuCounterStruct>();
  TraceRow.range = {
    startNS: 0,
    endNS: 1000000,
    totalNS: 1000000,
  };

  row.dataListCache = [
    {
      startNS: 100,
      type: '5587',
      dur: 100,
    },
    {
      startNS: 100,
      type: '557',
      dur: 100,
    },
  ];

  context = {
    save: jest.fn(),
    translate: jest.fn(),
    rect: jest.fn(),
    clip: jest.fn(),
    strokeStyle: '#000000',
    strokeRect: jest.fn(),
    fillRect: jest.fn(),
    fillText: jest.fn(),
    measureText: jest.fn().mockReturnValue({ width: 10 }),
    beginPath: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    clearRect: jest.fn(),
    fill: jest.fn(),
    fillStyle: '#000000',
    globalAlpha: 1,
    font: '10px sans-serif',
    canvas: {
      clientWidth: 800,
    },
  } as unknown as CanvasRenderingContext2D;

  it('GpuCounterTest01', () => {
    const xpowerStatisticRender = new GpuCounterRender();
    xpowerStatisticRender.renderMainThread({ context, useCache: false, type: 'cpu', startTime: 0, maxValue: 5 }, row);
    expect(context.beginPath).toHaveBeenCalled();
    expect(context.closePath).toHaveBeenCalled();
  });

  it('GpuCounterTest02', () => {
    GpuCounterStruct.selectGpuCounterStruct = row.dataListCache[0];
    expect(GpuCounterStruct.draw(context, row.dataListCache[0])).toBeUndefined();
  });

  it('GpuCounterTest03', () => {
    let data = new MaleoonCounterObj();
    data.gpu_clocks = [];
    expect(data.gpu_clocks).toEqual([]);
  });

  it('GpuCounterTest04', () => {
    let data = new GpuCounterType();
    data.local_count = [];
    expect(data.local_count).toEqual([]);
  });
});
