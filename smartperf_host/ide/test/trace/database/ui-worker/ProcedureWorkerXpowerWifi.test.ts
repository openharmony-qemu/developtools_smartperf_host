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
  XpowerWifiRender,
  XpowerWifiStruct,
  drawLegend,
} from '../../../../src/trace/database/ui-worker/ProcedureWorkerXpowerWifi';
import { SpApplication } from '../../../../src/trace/SpApplication';

jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});

jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});

jest.spyOn(require('../../../../src/trace/database/ui-worker/ProcedureWorkerCommon'), 'isFrameContainPoint').mockReturnValue(true);


describe('ProcedureWorkerXpowerWifi Test', () => {
  let row: TraceRow<XpowerWifiStruct>;
  let context: CanvasRenderingContext2D;
  document.body.innerHTML = '<sp-application id="sss"></sp-application>';
  let spApplication = document.querySelector('#sss') as SpApplication;
  spApplication.dark = false;
  beforeEach(() => {
    row = TraceRow.skeleton<XpowerWifiStruct>();
    TraceRow.range = {
      startNS: 0,
      endNS: 1000000,
      totalNS: 1000000,
    };
    row.dataListCache = [
      {
        startTime: 100,
        rx: 10,
        tx: 20,
      },
      {
        startTime: 200,
        rx: 15,
        tx: 25,
      },
    ];
    let list = ['tx', 'rx'];
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
  });

  it('ProcedureWorkerXpowerWifi01', () => {
    const xpowerWifiRender = new XpowerWifiRender();
    xpowerWifiRender.renderMainThread({ context, useCache: false, name: 'WIFIPackets' }, row);
    expect(context.beginPath).toHaveBeenCalled();
    expect(context.closePath).toHaveBeenCalled();
  });

  it('ProcedureWorkerXpowerWifi02', () => {
    const xpowerWifiRender = new XpowerWifiRender();
    xpowerWifiRender.renderMainThread({ context, useCache: false, name: 'WIFIPackets' }, row);
    expect(row.dataListCache[0].tx).toBe(20);
    expect(row.dataListCache[0].rx).toBe(10);
    expect(row.dataListCache[1].tx).toBe(25);
    expect(row.dataListCache[1].rx).toBe(15);
  });

  it('ProcedureWorkerXpowerWifi03', () => {
    row.isHover = true;
    row.hoverX = 50;
    row.hoverY = 50;
    row.dataListCache[0].frame = new Rect(0, 0, 100, 100);
    const xpowerWifiRender = new XpowerWifiRender();
    xpowerWifiRender.renderMainThread({ context, useCache: false, name: 'WIFIPackets' }, row);
    expect(XpowerWifiStruct.hoverPacketsStruct).toBeDefined();
    expect(XpowerWifiStruct.hoverPacketsStruct!.startTime).toBe(200);
  });

  it('ProcedureWorkerXpowerWifi04', () => {
    row.isHover = true;
    row.hoverX = 50;
    row.hoverY = 50;
    row.dataListCache[0].frame = new Rect(0, 0, 100, 100);
    row.dataListCache[1].frame = new Rect(100, 100, 200, 200);
    const xpowerWifiRender = new XpowerWifiRender();
    xpowerWifiRender.renderMainThread({ context, useCache: false, name: 'WIFIBytes' }, row);
    expect(XpowerWifiStruct.hoverBytesStruct).toBeDefined();
    expect(XpowerWifiStruct.hoverBytesStruct!.startTime).toBe(200);
  });

  it('ProcedureWorkerXpowerWifi05', () => {
    row.hoverX = 0;
    row.hoverY = 0;
    const xpowerWifiRender = new XpowerWifiRender();
    xpowerWifiRender.renderMainThread({ context, useCache: false, name: 'WIFIPackets' }, row);
    expect(XpowerWifiStruct.hoverPacketsStruct).toBeUndefined();
  });

  it('ProcedureWorkerXpowerWifi06', () => {
    drawLegend({ context, useCache: false, name: 'WIFIPackets' }, [true, true], false);
    expect(context.fillRect).toHaveBeenCalled();
    expect(context.fillText).toHaveBeenCalled();
  });

  it('ProcedureWorkerXpowerWifi07', () => {
    drawLegend({ context, useCache: false, name: 'WIFIPackets' }, [true, true], true);
    expect(context.fillStyle).toBe('#333');
  });

  const data = new XpowerWifiStruct();
  data.startTime = 100;
  data.rx = 10;
  data.tx = 20;

  it('ProcedureWorkerXpowerWifi08', () => {
    XpowerWifiStruct.draw({ context, useCache: false, name: 'WIFIPackets' }, data, row, true);
    expect(context.strokeRect).not.toHaveBeenCalled();
  });

  it('ProcedureWorkerXpowerWifi09', () => {
    data.frame = new Rect(0, 0, 100, 100);
    XpowerWifiStruct.drawHistogram({ context, useCache: false }, data, -1, 20, 'tx', row.frame!);
    expect(context.fillRect).toHaveBeenCalled();
  });

  it('ProcedureWorkerXpowerWifi10', () => {
    data.frame = new Rect(0, 0, 100, 100);
    XpowerWifiStruct.drawHistogram({ context, useCache: false }, data, 50, 10, 'rx', row.frame!);
    expect(context.fillRect).toHaveBeenCalled();
  });

  it('ProcedureWorkerXpowerWifi11', () => {
    XpowerWifiStruct.setHoverHtml(data, 'WIFIPackets');
    expect(data.hoverHtmlPackets).toBeDefined();
  });

  it('ProcedureWorkerXpowerWifi12', () => {
    XpowerWifiStruct.setHoverHtml(data, 'WIFIBytes');
    expect(data.hoverHtmlBytes).toBeDefined();
  });

  it('ProcedureWorkerXpowerWifi13', () => {
    XpowerWifiStruct.setXPowerStatisticFrame(data, 5, 0, 1000000, 1000000, row.frame!);
    expect(data.frame).toBeDefined();
  });
});
