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
import { Rect } from '../../../../src/trace/database/ui-worker/ProcedureWorkerCommon';
import {
  XpowerThreadInfoRender,
  XpowerThreadInfoStruct,
  drawMaxValue,
  threadInfo,
} from '../../../../src/trace/database/ui-worker/ProcedureWorkerXpowerThreadInfo';
import { SpApplication } from '../../../../src/trace/SpApplication';
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});
jest
  .spyOn(require('../../../../src/trace/database/ui-worker/ProcedureWorkerCommon'), 'isFrameContainPoint')
  .mockReturnValue(true);
describe('ProcedureWorkerXpowerThreadInfo Test', () => {
  let row: TraceRow<XpowerThreadInfoStruct>;
  let context: CanvasRenderingContext2D;
  document.body.innerHTML = '<sp-application id="sss"></sp-application>';
  let spApplication = document.querySelector('#sss') as SpApplication;
  spApplication.dark = false;
  let frame = new Rect(0, 0, 100, 100);
  beforeEach(() => {
    row = TraceRow.skeleton<XpowerThreadInfoStruct>();
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
        startTimeStr: '100',
        value: 10,
        threadTime: 10,
        threadTimeStr: '10',
        threadName: 'aaa',
        threadNameId: 0,
        valueStr: '10',
        dur: 10,
        valueType: 'energy',
        translateY: 10,
        frame: frame,
        isHover: false,
      },
      {
        startNS: 100,
        startTimeStr: '100',
        value: 20,
        threadTime: 10,
        threadTimeStr: '10',
        threadName: 'aaa',
        threadNameId: 0,
        valueStr: '10',
        dur: 10,
        valueType: 'load',
        translateY: 10,
        frame: frame,
        isHover: false,
      },
    ];
    row.frame = frame;
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
  });
  const data = new XpowerThreadInfoStruct();
  data.startNS = 100;
  data.isHover = true;
  data.frame = frame;
  const data1 = new XpowerThreadInfoStruct();
  data1.startNS = 200;
  it('ProcedureWorkerXpowerThreadInfo01', () => {
    const xpowerThreadInfoRender = new XpowerThreadInfoRender();
    xpowerThreadInfoRender.renderMainThread({ context, useCache: false, type: 'load' }, row);
    expect(context.beginPath).toHaveBeenCalled();
    expect(context.closePath).toHaveBeenCalled();
  });
  it('ProcedureWorkerXpowerThreadInfo02', () => {
    const xpowerThreadInfoRender = new XpowerThreadInfoRender();
    xpowerThreadInfoRender.renderMainThread({ context, useCache: false, type: 'load' }, row);
    expect(row.dataListCache[0].value).toBe(10);
    expect(row.dataListCache[0].startNS).toBe(100);
    expect(row.dataListCache[0].startTimeStr).toBe('100');
    expect(row.dataListCache[0].threadTime).toBe(10);
    expect(row.dataListCache[0].threadTimeStr).toBe('10');
    expect(row.dataListCache[0].threadName).toBe('aaa');
    expect(row.dataListCache[0].threadNameId).toBe(0);
    expect(row.dataListCache[0].valueStr).toBe('10');
    expect(row.dataListCache[0].dur).toBe(10);
    expect(row.dataListCache[0].valueType).toBe('energy');
    expect(row.dataListCache[0].translateY).toBe(10);
    expect(row.dataListCache[0].frame).toBe(frame);
    expect(row.dataListCache[0].isHover).toBe(false);
  });
  it('ProcedureWorkerXpowerThreadInfo03', () => {
    row.isHover = true;
    row.hoverX = 50;
    row.hoverY = 50;
    row.dataListCache[0].frame = new Rect(0, 0, 100, 100);
    const xpowerThreadInfoRender = new XpowerThreadInfoRender();
    xpowerThreadInfoRender.renderMainThread({ context, useCache: false, type: 'energy' }, row);
    expect(XpowerThreadInfoStruct.hoverXpowerStruct).toBeDefined();
    expect(XpowerThreadInfoStruct.hoverXpowerStruct!.startNS).toBe(100);
  });
  it('ProcedureWorkerXpowerThreadInfo04', () => {
    row.isHover = true;
    row.hoverX = 50;
    row.hoverY = 50;
    row.dataListCache[0].frame = new Rect(0, 0, 100, 100);
    const xpowerThreadInfoRender = new XpowerThreadInfoRender();
    xpowerThreadInfoRender.renderMainThread({ context, useCache: false, type: 'load' }, row);
    expect(XpowerThreadInfoStruct.hoverXpowerStruct).toBeDefined();
    expect(XpowerThreadInfoStruct.hoverXpowerStruct!.startNS).toBe(100);
  });
  it('ProcedureWorkerXpowerThreadInfo05', () => {
    XpowerThreadInfoStruct.drawStroke({ context, useCache: false }, data, row);
    expect(context.strokeStyle).toBe('#000000');
  });
  it('ProcedureWorkerXpowerThreadInfo06', () => {
    XpowerThreadInfoStruct.drawStroke({ context, useCache: false }, data, row);
    expect(context.fillStyle).toBe('#000000');
  });
  it('ProcedureWorkerXpowerThreadInfo08', () => {
    XpowerThreadInfoStruct.drawHistogram({ context, useCache: false }, data, 20, row);
    expect(context.fillRect).toHaveBeenCalled();
  });
  it('ProcedureWorkerXpowerThreadInfo09', () => {
    data.frame = new Rect(0, 0, 100, 100);
    XpowerThreadInfoStruct.drawHistogram({ context, useCache: false }, data, 20, row);
    expect(context.fillRect).toHaveBeenCalled();
  });
  it('ProcedureWorkerXpowerThreadInfo10', () => {
    data.frame = new Rect(0, 0, 100, 100);
    XpowerThreadInfoStruct.draw({ context, useCache: false }, data, 50, row);
    expect(data.frame).toBeDefined();
  });
  it('ProcedureWorkerXpowerThreadInfo11', () => {
    let isHover = XpowerThreadInfoStruct.isHover(data);
    expect(isHover).toBeFalsy();
  });
  it('ProcedureWorkerXpowerThreadInfo12', () => {
    let equals = XpowerThreadInfoStruct.equals(data, data1);
    expect(equals).toBeFalsy();
    expect(XpowerThreadInfoStruct.equals(data, data1)).toBeDefined();
  });
  it('ProcedureWorkerXpowerThreadInfo13', () => {
    XpowerThreadInfoStruct.setThreadInfoFrame(data, 5, 0, 1000000, 1000000, row.frame!);
    expect(data.frame).toBeDefined();
  });
  it('ProcedureWorkerXpowerThreadInfo14', () => {
    drawMaxValue({ context, useCache: false, type: 'load' }, '10');
    expect(data.frame).toBeDefined();
    expect(context.fillRect).toHaveBeenCalled();
    expect(context.globalAlpha).toBe(1);
    expect(context.fillStyle).toBe('#333');
    expect(context.textBaseline).toBe('middle');
    expect(context.fillText).toHaveBeenCalled();
  });
  it('ProcedureWorkerXpowerThreadInfo15', () => {
    threadInfo(row.dataList, row.dataListCache, 0, 100, 100, frame, true);
    expect(data.frame).toBeDefined();
  });
});
