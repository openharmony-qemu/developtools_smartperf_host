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
  XpowerGpuFreqRender,
  XpowerGpuFreqStruct,
} from '../../../../src/trace/database/ui-worker/ProcedureWorkerXpowerGpuFreq';
import { ColorUtils } from '../../../../src/trace/component/trace/base/ColorUtils';
import { SpApplication } from '../../../../src/trace/SpApplication';
import { SpSystemTrace } from '../../../../src/trace/component/SpSystemTrace';
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});
jest
  .spyOn(require('../../../../src/trace/database/ui-worker/ProcedureWorkerCommon'), 'isFrameContainPoint')
  .mockReturnValue(true);
describe('ProcedureWorkerXpowerGpuFreq Test', () => {
  let row: TraceRow<XpowerGpuFreqStruct>;
  let context: CanvasRenderingContext2D;
  document.body.innerHTML = '<sp-application id="sss"></sp-application>';
  let spApplication = document.querySelector('#sss') as SpApplication;
  spApplication.dark = false;
  let frame = new Rect(0, 0, 100, 100);
  beforeEach(() => {
    row = TraceRow.skeleton<XpowerGpuFreqStruct>();
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
        dur: 10,
        frequency: 10,
        value: 10,
        runTime: 10,
        idleTime: 10,
        runTimeStr: '10',
        valueType: '',
        idleTimeStr: '10',
        count: 10,
        translateY: 10,
        frame: frame,
        isHover: false,
      },
      {
        startNS: 100,
        startTimeStr: '100',
        dur: 10,
        frequency: 10,
        value: 10,
        runTime: 10,
        idleTime: 10,
        runTimeStr: '10',
        valueType: '',
        idleTimeStr: '10',
        count: 10,
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
  const data = new XpowerGpuFreqStruct();
  data.startNS = 100;
  data.isHover = true;
  data.frame = frame;
  const data1 = new XpowerGpuFreqStruct();
  data1.startNS = 200;
  it('ProcedureWorkerXpowerGpuFreq01', () => {
    const xpowerGpuFreqRender = new XpowerGpuFreqRender();
    xpowerGpuFreqRender.renderMainThread({ context, useCache: false }, row);
    expect(context.beginPath).toHaveBeenCalled();
    expect(context.closePath).toHaveBeenCalled();
    expect(context.fillRect).toHaveBeenCalled();
    expect(context.globalAlpha).toBe(1);
    expect(context.fillStyle).toBe('#333');
    expect(context.textBaseline).toBe('middle');
    expect(context.fillText).toHaveBeenCalled();
  });
  it('ProcedureWorkerXpowerGpuFreq02', () => {
    const xpowerGpuFreqRender = new XpowerGpuFreqRender();
    xpowerGpuFreqRender.renderMainThread({ context, useCache: false }, row);
    expect(row.dataListCache[0].value).toBe(10);
    expect(row.dataListCache[0].startNS).toBe(100);
    expect(row.dataListCache[0].startTimeStr).toBe('100');
    expect(row.dataListCache[0].dur).toBe(10);
    expect(row.dataListCache[0].frequency).toBe(10);
    expect(row.dataListCache[0].runTime).toBe(10);
    expect(row.dataListCache[0].idleTime).toBe(10);
    expect(row.dataListCache[0].runTimeStr).toBe('10');
    expect(row.dataListCache[0].idleTimeStr).toBe('10');
    expect(row.dataListCache[0].count).toBe(10);
    expect(row.dataListCache[0].valueType).toBe('');
    expect(row.dataListCache[0].translateY).toBe(10);
    expect(row.dataListCache[0].frame).toBe(frame);
    expect(row.dataListCache[0].isHover).toBe(false);
  });
  it('ProcedureWorkerXpowerGpuFreq03', () => {
    row.isHover = true;
    row.hoverX = 50;
    row.hoverY = 50;
    row.dataListCache[0].frame = new Rect(0, 0, 100, 100);
    const xpowerGpuFreqRender = new XpowerGpuFreqRender();
    xpowerGpuFreqRender.renderMainThread({ context, useCache: false }, row);
    expect(XpowerGpuFreqStruct.hoverXpowerStruct).toBeDefined();
    expect(XpowerGpuFreqStruct.hoverXpowerStruct!.startNS).toBe(100);
  });
  it('ProcedureWorkerXpowerGpuFreq04', () => {
    row.isHover = true;
    row.hoverX = 50;
    row.hoverY = 50;
    row.dataListCache[0].frame = new Rect(0, 0, 100, 100);
    const xpowerGpuFreqRender = new XpowerGpuFreqRender();
    xpowerGpuFreqRender.renderMainThread({ context, useCache: false }, row);
    expect(XpowerGpuFreqStruct.hoverXpowerStruct).toBeDefined();
    expect(XpowerGpuFreqStruct.hoverXpowerStruct!.startNS).toBe(100);
  });
  it('ProcedureWorkerXpowerGpuFreq05', () => {
    XpowerGpuFreqStruct.drawStroke({ context, useCache: false }, data, row);
    expect(context.strokeStyle).toBe('#000000');
  });
  it('ProcedureWorkerXpowerGpuFreq06', () => {
    XpowerGpuFreqStruct.drawStroke({ context, useCache: false }, data, row);
    expect(context.fillStyle).toBe('#000000');
  });
  it('ProcedureWorkerXpowerGpuFreq08', () => {
    XpowerGpuFreqStruct.drawHistogram({ context, useCache: false }, data, row.frame);
    expect(context.fillRect).toHaveBeenCalled();
  });
  it('ProcedureWorkerXpowerGpuFreq09', () => {
    data.frame = new Rect(0, 0, 100, 100);
    XpowerGpuFreqStruct.drawHistogram({ context, useCache: false }, data, row.frame);
    expect(context.fillRect).toHaveBeenCalled();
  });
  it('ProcedureWorkerXpowerGpuFreq10', () => {
    data.frame = new Rect(0, 0, 100, 100);
    XpowerGpuFreqStruct.draw({ context, useCache: false }, data, row);
    expect(data.frame).toBeDefined();
  });
  it('ProcedureWorkerXpowerGpuFreq11', () => {
    let isHover = XpowerGpuFreqStruct.isHover(data);
    expect(isHover).toBeFalsy();
  });
  it('ProcedureWorkerXpowerGpuFreq12', () => {
    let equals = XpowerGpuFreqStruct.equals(data, data1);
    expect(equals).toBeFalsy();
  });
  it('ProcedureWorkerXpowerGpuFreq13', () => {
    XpowerGpuFreqStruct.setGpuFreqFrame(data, 5, 0, 1000000, 1000000, row.frame!);
    expect(data.frame).toBeDefined();
  });
});
