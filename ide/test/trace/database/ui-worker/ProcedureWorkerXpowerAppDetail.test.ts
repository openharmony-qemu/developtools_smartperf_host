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
import { Rect } from '../../../../src/trace/database/ui-worker/ProcedureWorkerCommon';
import {
  XpowerAppDetailRender,
  XpowerAppDetailStruct,
  drawLegend,
} from '../../../../src/trace/database/ui-worker/ProcedureWorkerXpowerAppDetail';
jest.mock('../../../../src/js-heap/model/DatabaseStruct', () => {
  return {};
});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest
  .spyOn(require('../../../../src/trace/database/ui-worker/ProcedureWorkerCommon'), 'isFrameContainPoint')
  .mockReturnValue(true);

describe('XpowerAppDetailTest', () => {
  TraceRow.range = {
    startNS: 0,
    endNS: 1000000,
    totalNS: 1000000,
  };
  let mockRow = new TraceRow();
  mockRow = TraceRow.skeleton<XpowerAppDetailStruct>();
  mockRow.rowId = 'AppDetailDisplay';
  mockRow.rowType = TraceRow.ROW_TYPE_XPOWER_APP_DETAIL_DISPLAY;
  let context: CanvasRenderingContext2D;
  let checked: boolean[];
  let checkedValue: string[];
  checked = [true, false, true];
  checkedValue = ['C1HZ', 'C5HZ', 'C10HZ'];
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

  mockRow.dataListCache = [
    {
      startTime: 1000,
      c1hz: 10,
      c5hz: 20,
      c10hz: 30,
      c15hz: 40,
      c24hz: 50,
      c30hz: 60,
      c45hz: 70,
      c60hz: 80,
      c90hz: 90,
      c120hz: 100,
      c180hz: 110,
      frame: new Rect(0, 0, 100, 100),
    },
  ];
  mockRow.rowSettingCheckBoxList = [
    'C1HZ',
    'C5HZ',
    'C10HZ',
    'C15HZ',
    'C24HZ',
    'C30HZ',
    'C45HZ',
    'C60HZ',
    'C90HZ',
    'C120HZ',
    'C180HZ',
  ];
  mockRow.addRowSettingCheckBox();
  mockRow.frame = new Rect(0, 0, 500, 500);
  mockRow.hoverX = 500;
  mockRow.hoverY = 100;
  mockRow.isHover = true;

  TraceRow.range = {
    startNS: 0,
    endNS: 1000000000,
    totalNS: 1000000000,
  };

  it('XpowerAppDetailTest01', () => {
    let checked = new Array(11).fill(true);
    const checkedValue = mockRow.rowSettingCheckBoxList;
    drawLegend({ context: context, useCache: false }, checked, checkedValue!);

    expect(context.fillRect).toHaveBeenCalled();
    expect(context.fillText).toHaveBeenCalled();
  });

  it('XpowerAppDetailTest02', () => {
    drawLegend({ context, useCache: false }, checked, checkedValue);

    expect(context.fillRect).toHaveBeenCalled();
    expect(context.fillText).toHaveBeenCalled();
  });

  it('XpowerAppDetailTest03', () => {
    drawLegend({ context, useCache: false }, checked, checkedValue, true);

    expect(context.fillStyle).toBe('#333');
  });

  it('XpowerAppDetailTest04', () => {
    checked = [true];
    checkedValue = ['C1HZ'];
    drawLegend({ context, useCache: false }, checked, checkedValue);

    expect(context.fillRect).toHaveBeenCalled();
    expect(context.fillText).toHaveBeenCalled();
  });

  it('XpowerAppDetailTest05', () => {
    XpowerAppDetailStruct.draw({ context, useCache: false }, mockRow.dataListCache[0], mockRow, false);
    expect(context.globalAlpha).toEqual(0.8);
    expect(context.lineWidth).toEqual(1);
    expect(
      XpowerAppDetailStruct.drawHistogram(
        { context, useCache: false },
        mockRow.dataListCache[0],
        -1,
        10,
        0,
        mockRow.frame
      )
    ).not.toBeUndefined();
    expect(
      XpowerAppDetailStruct.drawHistogram(
        { context, useCache: false },
        mockRow.dataListCache[0],
        -1,
        10,
        5,
        mockRow.frame
      )
    ).not.toBeUndefined();
  });

  it('XpowerAppDetailTest06', () => {
    expect(
      XpowerAppDetailStruct.setHoverHtml(mockRow.dataListCache[0], mockRow.rowSettingCheckBoxList)
    ).toBeUndefined();
  });

  it('XpowerAppDetailTest07', () => {
    XpowerAppDetailStruct.hoverXpowerStruct = mockRow.dataListCache[0];
    XpowerAppDetailStruct.draw({ context, useCache: false }, mockRow.dataListCache[0], mockRow, true);
    expect(context.strokeStyle).toEqual('#9899a0');
  });

  it('XpowerAppDetailTest08', () => {
    expect(
      XpowerAppDetailStruct.setXPowerAppDetailFrame(
        mockRow.dataListCache[0],
        5,
        TraceRow.range?.startNS ?? 0,
        TraceRow.range?.endNS ?? 0,
        TraceRow.range?.totalNS ?? 0,
        mockRow.frame
      )
    ).toBeUndefined();
  });

  it('XpowerAppDetailTest09', () => {
    let data = new XpowerAppDetailStruct();
    data.c1hz = 10;
    expect(data.c1hz).toEqual(10);
  });

  it('XpowerAppDetailTest10', () => {
    const render = new XpowerAppDetailRender();
    render.renderMainThread({ context, useCache: false }, mockRow);
    expect(XpowerAppDetailStruct.hoverXpowerStruct).toBeDefined();
    expect(XpowerAppDetailStruct.hoverXpowerStruct!.startTime).toBe(1000);
  });
});
