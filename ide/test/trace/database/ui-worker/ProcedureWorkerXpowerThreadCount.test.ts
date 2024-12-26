/*
 * Copyright (C) 2024 Huawei Device Co., Ltd.
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
import {
  XpowerThreadCountRender,
  XpowerThreadCountStruct,
} from '../../../../src/trace/database/ui-worker/ProcedureWorkerXpowerThreadCount';
import { SpSystemTrace } from '../../../../src/trace/component/SpSystemTrace';
import {
  Rect,
  dataFilterHandler,
  drawLoadingFrame,
} from '../../../../src/trace/database/ui-worker/ProcedureWorkerCommon';
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});
jest
  .spyOn(require('../../../../src/trace/database/ui-worker/ProcedureWorkerCommon'), 'isFrameContainPoint')
  .mockReturnValue(true);
describe('ProcedureWorkerXpowerThreadCount Test', () => {
  let row: TraceRow<XpowerThreadCountStruct>;
  let context: CanvasRenderingContext2D;
  let frame = new Rect(0, 0, 100, 100);
  // 模拟数据
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
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    fillStyle: '#000000',
    globalAlpha: 1,
    font: '10px sans-serif',
    canvas: {
      clientWidth: 800,
    },
  } as unknown as CanvasRenderingContext2D;

  const traceRow = {
    dataList: [],
    dataListCache: [],
    frame: { x: 0, y: 0, width: 100, height: 50 },
    isHover: false,
    hoverX: 0,
    hoverY: 0,
  } as unknown as TraceRow<XpowerThreadCountStruct>;

  const traceRow1 = {
    dataList: [],
    dataListCache: [
      {
        startNS: 100,
        dur: 10,
        filterId: 10,
        value: 10,
        delta: 10,
        translateY: 10,
        frame: frame,
        isHover: false,
      },
    ],
    frame: { x: 0, y: 0, width: 100, height: 50 },
    isHover: false,
    hoverX: 0,
    hoverY: 0,
  } as unknown as TraceRow<XpowerThreadCountStruct>;

  const spSystemTrace = {
    traceSheetEL: {
      displayXpowerData: jest.fn(),
    },
    timerShaftEL: {
      modifyFlagList: jest.fn(),
    },
  } as unknown as SpSystemTrace;

  row = TraceRow.skeleton<XpowerThreadCountStruct>();
  TraceRow.range = {
    startNS: 0,
    endNS: 1000000,
    totalNS: 1000000,
    slicesTime: {
      color: '#0ff',
      startTime: 0,
      endTime: 20000,
    },
    scale: 1,
    startX: 10,
    endX: 30,
    xs: [0, 1],
    refresh: true,
    xsTxt: ['0', '1'],
  };

  row.dataListCache = [
    {
      startNS: 100,
      dur: 10,
      value: 10,
      translateY: 10,
      frame: frame,
      isHover: false,
    },
  ];
  row.frame = frame;
  const data = new XpowerThreadCountStruct();
  data.startNS = 100;
  data.isHover = true;
  data.frame = frame;
  data.value = 0;
  const data1 = new XpowerThreadCountStruct();
  data1.startNS = 200;
  data1.isHover = false;
  data1.value = 10;

  it('ProcedureWorkerXpowerThreadCount Test01', () => {
    const xpowerRender = new XpowerThreadCountRender();
    const xpowerReq = {
      context: context,
      useCache: false,
      type: 'mainThread',
      maxValue: 100,
      minValue: 0,
      index: 0,
      maxName: 'MaxValue',
    };
    xpowerRender.renderMainThread(xpowerReq, traceRow);
    expect(context.beginPath).toHaveBeenCalled();
    expect(context.closePath).toHaveBeenCalled();
    expect(context.fillRect).toHaveBeenCalled();
    expect(context.fillText).toHaveBeenCalled();
    expect(context.globalAlpha).toBe(1);
    expect(context.fillStyle).toBe('#333');
    expect(context.textBaseline).toBe('middle');

    xpowerRender.renderMainThread(xpowerReq, traceRow1);
    expect(context.strokeRect).toHaveBeenCalled();
    expect(context.fillRect).toHaveBeenCalled();
  });

  it('ProcedureWorkerXpowerThreadCount Test04', async () => {
    data.frame = new Rect(0, 0, 100, 100);
    XpowerThreadCountStruct.draw(context, data, 10);
    expect(data.frame).toBeDefined();
    expect(context.stroke).toHaveBeenCalled();
    expect(context.fillRect).toHaveBeenCalled();
  });
  it('ProcedureWorkerXpowerThreadCount Test05', async () => {
    data1.frame = new Rect(0, 0, 100, 100);
    XpowerThreadCountStruct.draw(context, data1, 10);
    expect(data.frame).toBeDefined();
    expect(context.strokeRect).toHaveBeenCalled();

    expect(context.fillRect).toHaveBeenCalled();
  });
  it('ProcedureWorkerXpowerThreadCount Test06', async () => {
    expect(XpowerThreadCountStruct.calculateDrawHeight(data, 10)).toBeDefined();
    expect(XpowerThreadCountStruct.calculateDrawHeight(data1, 100)).toBe(10);
    expect(XpowerThreadCountStruct.calculateDrawHeight(data, 1)).toBe(1);
  });
  it('ProcedureWorkerXpowerThreadCount Test07', async () => {
    let isHover = XpowerThreadCountStruct.isHover(data);
    expect(isHover).toBeFalsy();
  });
  it('ProcedureWorkerXpowerThreadCount Test08', async () => {
    let filterConfig = {
      startKey: 'startNS',
      durKey: 'dur',
      startNS: TraceRow.range?.startNS ?? 0,
      endNS: TraceRow.range?.endNS ?? 0,
      totalNS: TraceRow.range?.totalNS ?? 0,
      frame: row.frame,
      paddingTop: 5,
      useCache: true,
    };
    dataFilterHandler(row.dataList, row.dataListCache, filterConfig);
  });
  it('ProcedureWorkerXpowerThreadCount Test08', async () => {
    drawLoadingFrame(context, row.dataListCache, row);
  });
});
