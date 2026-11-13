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
  XpowerStatisticStruct,
  XpowerStatisticRender,
  drawLegend,
} from '../../../../src/trace/database/ui-worker/ProcedureWorkerXpowerStatistic';
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

describe('ProcedureWorkerXpowerStatistic Test', () => {
  let row: TraceRow<XpowerStatisticStruct>;
  let context: CanvasRenderingContext2D;

  let list = [
    'audio',
    'bluetooth',
    'camera',
    'cpu',
    'display',
    'flashlight',
    'gpu',
    'location',
    'wifiscan',
    'wifi',
    'modem',
  ];
  row = TraceRow.skeleton<XpowerStatisticStruct>();
  TraceRow.range = {
    startNS: 0,
    endNS: 1000000,
    totalNS: 1000000,
  };

  row.dataListCache = [
    {
      startTime: 100,
      audio: 0,
      bluetooth: 10,
      camera: 100,
      cpu: 0,
      display: 0,
      flashlight: 0,
      gpu: 0,
      location: 0,
      wifiscan: 0,
      wifi: 0,
      modem: 0,
      audioDur: 0,
      bluetoothDur: 0,
      cameraDur: 0,
      cpuDur: 0,
      displayDur: 0,
      flashlightDur: 0,
      gpuDur: 0,
      locationDur: 0,
      wifiscanDur: 0,
      wifiDur: 0,
      modemDur: 0,
      type: 557,
      typeStr: 'bluetooth',
      dur: 100,
      energy: 80,
    },
    {
      startTime: 100,
      audio: 0,
      bluetooth: 10,
      camera: 100,
      cpu: 0,
      display: 0,
      flashlight: 0,
      gpu: 50,
      location: 0,
      wifiscan: 70,
      wifi: 0,
      modem: 0,
      audioDur: 0,
      bluetoothDur: 0,
      cameraDur: 0,
      cpuDur: 0,
      displayDur: 40,
      flashlightDur: 10,
      gpuDur: 0,
      locationDur: 0,
      wifiscanDur: 0,
      wifiDur: 0,
      modemDur: 0,
      type: 557,
      typeStr: 'gpu',
      dur: 100,
      energy: 80,
    },
    {
      startTime: 100,
      type: 557,
      typeStr: 'audio',
      dur: 100,
      energy: 80,
    },
    {
      startTime: 100,
      type: 557,
      typeStr: 'camera',
      dur: 100,
      energy: 80,
    },
    {
      startTime: 100,
      type: 557,
      typeStr: 'cpu',
      dur: 100,
      energy: 80,
    },
    {
      startTime: 100,
      type: 557,
      typeStr: 'display',
      dur: 100,
      energy: 80,
    },
    {
      startTime: 100,
      type: 557,
      typeStr: 'flashlight',
      dur: 100,
      energy: 80,
    },
    {
      startTime: 100,
      type: 557,
      typeStr: 'location',
      dur: 100,
      energy: 80,
    },
    {
      startTime: 100,
      type: 557,
      typeStr: 'wifiscan',
      dur: 100,
      energy: 80,
    },
    {
      startTime: 100,
      type: 557,
      typeStr: 'wifi',
      dur: 100,
      energy: 80,
    },
    {
      startTime: 100,
      type: 557,
      typeStr: 'modem',
      dur: 100,
      energy: 80,
    },
  ];
  row.rowSettingCheckBoxList = list;
  row.addRowSettingCheckBox();

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

  it('ProcedureWorkerXpowerStatistic01', () => {
    const xpowerStatisticRender = new XpowerStatisticRender();
    xpowerStatisticRender.renderMainThread({ context, useCache: false }, row);
    expect(context.beginPath).toHaveBeenCalled();
    expect(context.closePath).toHaveBeenCalled();
  });

  it('ProcedureWorkerXpowerStatistic02', () => {
    const xpowerStatisticRender = new XpowerStatisticRender();
    expect(xpowerStatisticRender.renderMainThread({ context, useCache: false }, row)).toBeUndefined();
  });

  it('ProcedureWorkerXpowerStatistic03', () => {
    row.isHover = true;
    row.hoverX = 50;
    row.hoverY = 50;
    row.dataListCache[0].frame = new Rect(0, 0, 100, 100);
    const xpowerStatisticRender = new XpowerStatisticRender();
    xpowerStatisticRender.renderMainThread({ context, useCache: false }, row);
    expect(XpowerStatisticStruct.hoverXpowerStruct).toBeDefined();
    expect(XpowerStatisticStruct.hoverXpowerStruct!.startTime).toBe(100);
  });

  it('ProcedureWorkerXpowerStatistic04', () => {
    let checked = new Array(11).fill(true);
    drawLegend({ context, useCache: false }, checked, list, false);
    expect(context.fillRect).toHaveBeenCalled();
    expect(context.fillText).toHaveBeenCalled();
  });

  it('ProcedureWorkerXpowerStatistic05', () => {
    let checked = new Array(11).fill(false);
    checked[0] = true;
    drawLegend({ context, useCache: false }, checked, list, true);
    expect(context.fillStyle).toBe('#333');
  });

  it('ProcedureWorkerXpowerStatistic06', () => {
    XpowerStatisticStruct.draw({ context, useCache: false }, row.dataListCache[0], row, true);
    expect(context.strokeRect).toHaveBeenCalled();
  });

  it('ProcedureWorkerXpowerStatistic07', () => {
    row.dataListCache[0].frame = new Rect(0, 0, 100, 100);
    XpowerStatisticStruct.drawHistogram({ context, useCache: false }, row.dataListCache[0], -1, 20, 1, row.frame!);
    expect(context.fillRect).toHaveBeenCalled();
  });

  it('ProcedureWorkerXpowerStatistic08', () => {
    row.dataListCache[0].frame = new Rect(0, 0, 100, 100);
    XpowerStatisticStruct.drawHistogram({ context, useCache: false }, row.dataListCache[0], 50, 5, 1, row.frame!);
    expect(context.fillRect).toHaveBeenCalled();
  });

  it('ProcedureWorkerXpowerStatistic09', () => {
    XpowerStatisticStruct.setHoverHtml(row.dataListCache[0], list);
    expect(row.dataListCache[0].hoverHtml).toBeDefined();
  });

  it('ProcedureWorkerXpowerStatistic10', () => {
    XpowerStatisticStruct.setHoverHtml(row.dataListCache[1], list);
    expect(row.dataListCache[1].hoverHtml).toBeDefined();
  });

  it('ProcedureWorkerXpowerStatistic11', () => {
    XpowerStatisticStruct.setXPowerStatisticFrame(row.dataListCache[1], 5, 0, 1000000, 1000000, row.frame!);
    expect(row.dataListCache[1].frame).toBeDefined();
    expect(
      XpowerStatisticStruct.setXPowerStatisticFrame(row.dataListCache[1], 5, 0, 1000000, 1000000, row.frame!)
    ).toBeUndefined();
  });

  it('ProcedureWorkerXpowerStatistic12', () => {
    expect(XpowerStatisticStruct.computeMaxEnergy(row.dataListCache)).toBeUndefined();
    XpowerStatisticStruct.computeMaxEnergy(row.dataListCache);
    expect(XpowerStatisticStruct.maxEnergy).toEqual(0);
  });
});
