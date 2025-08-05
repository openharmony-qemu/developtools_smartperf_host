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
import { PerfToolStruct, PerfToolRender } from '../../../../src/trace/database/ui-worker/ProcedureWorkerPerfTool';
import { Rect } from '../../../../src/trace/component/trace/timer-shaft/Rect';
jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});
jest
  .spyOn(require('../../../../src/trace/database/ui-worker/ProcedureWorkerCommon'), 'isFrameContainPoint')
  .mockReturnValue(true);
describe('Test', () => {
  let row: TraceRow<PerfToolStruct>;
  let context: CanvasRenderingContext2D;

  row = TraceRow.skeleton<PerfToolStruct>();
  row.isHover = true;
  TraceRow.range = {
    startNS: 0,
    endNS: 1000000,
    totalNS: 1000000,
  };

  row.dataList = [
    {
      count: '100',
      startTs: 50,
      frame: new Rect(0, 0, 100, 100),
      name: 'all-state',
      dur: 88,
      id: 55,
    },
  ];

  row.dataListCache = [
    {
      count: '100',
      startTs: 50,
      frame: new Rect(0, 0, 100, 100),
      name: 'all-state',
      dur: 88,
      id: 55,
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
    globalAlpha: 0.5,
    font: '10px sans-serif',
    canvas: {
      clientWidth: 800,
    },
  } as unknown as CanvasRenderingContext2D;

  it('SamplerTest01', () => {
    const render = new PerfToolRender();
    render.renderMainThread({ context, useCache: false, type: 'cpu', index: 5 }, row);
    expect(context.beginPath).toHaveBeenCalled();
    expect(context.closePath).toHaveBeenCalled();
  });

  it('SamplerTest02', () => {
    PerfToolStruct.selectPerfToolStruct = row.dataList[0];
    expect(PerfToolStruct.draw(context, row.dataList[0])).toBeUndefined();
  });
});
