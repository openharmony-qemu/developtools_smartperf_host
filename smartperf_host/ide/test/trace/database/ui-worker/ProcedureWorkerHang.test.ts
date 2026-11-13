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
import { HangType } from '../../../../src/trace/component/chart/SpHangChart';
import { HangStruct, HangRender } from '../../../../src/trace/database/ui-worker/ProcedureWorkerHang';
import { Rect } from '../../../../src/trace/component/trace/timer-shaft/Rect';
jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});
jest
  .spyOn(require('../../../../src/trace/database/ui-worker/ProcedureWorkerCommon'), 'isFrameContainPoint')
  .mockReturnValue(true);
describe('Test', () => {
  let row: TraceRow<HangStruct>;
  let context: CanvasRenderingContext2D;

  row = TraceRow.skeleton<HangStruct>();
  row.isHover = true;
  TraceRow.range = {
    startNS: 0,
    endNS: 1000000,
    totalNS: 1000000,
  };
  let type: HangType = "Instant";

  row.dataList = [
    {
      id: 100,
      startTime: 50,
      dur: 100,
      frame: new Rect(0, 0, 100, 100),
      pid: 5,
      tid: 8,
      pname: 'f',
      content: 'gr',
      name: 'gt',
      type: type
    },
    {
      id: 100,
      startTime: 50,
      dur: 100,
      frame: new Rect(0, 0, 100, 100),
      pid: 5,
      tid: 8,
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

  it('HangRenderTest01', () => {
    const xpowerStatisticRender = new HangRender();
    xpowerStatisticRender.renderMainThread({ context, useCache: false, type: 'cpu', index: 5 }, row);
    expect(context.beginPath).toHaveBeenCalled();
    expect(context.closePath).toHaveBeenCalled();
  });

  it('HangRenderTest02', () => {
    HangStruct.hoverHangStruct = row.dataList[0];
    HangStruct.selectHangStruct = row.dataList[0];
    expect(HangStruct.draw(context, row.dataList[0])).toBeUndefined();
  });

  it('HangRenderTest03', () => {
    expect(HangStruct.getFrameColor(row.dataList[0])).toEqual('#559CFF');
  });
});
