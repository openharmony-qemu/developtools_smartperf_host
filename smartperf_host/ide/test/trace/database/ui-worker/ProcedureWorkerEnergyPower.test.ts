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

jest.mock('../../../../src/js-heap/model/DatabaseStruct', () => {
  return {};
});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
import {
  EnergyPowerStruct,
  EnergyPowerRender,
  power,
} from '../../../../src/trace/database/ui-worker/ProcedureWorkerEnergyPower';

describe('ProcedureWorkerEnergyPower Test', () => {
  it('ProcedureWorkerEnergyPowerTest01', function () {
    let req = {
      context: {
        globalAlpha: 1.0,
        lineWidth: 1,
        fillStyle: '#333',
      },
    };
    let data = {
      cpu: 1,
      location: 2,
      gpu: 1,
      display: 1,
      camera: 1,
      bluetooth: 3,
      flashlight: 10,
      audio: 16,
      wifiscan: 1,
      ts: 10,
      frame: {
        x: 20,
        y: 20,
        width: 100,
        height: 100,
      },
    };
    let row = {frame: 20};
    EnergyPowerStruct.drawHistogram = jest.fn(() => true);
    EnergyPowerStruct.drawPolyline = jest.fn(() => true);
    TraceRow.range = jest.fn(() => true);
    TraceRow.range!.startNS = jest.fn(() => 0);
    TraceRow.range!.endNS = jest.fn(() => 27763331331);
    TraceRow.range!.totalNS = jest.fn(() => 27763331331);
    expect(EnergyPowerStruct.draw(req, 3, data, row)).toBeUndefined();
  });

  it('ProcedureWorkerEnergyPowerTest02', function () {
    let frame = {
      x: 20,
      y: 20,
      width: 100,
      height: 100,
    };
    let node = {
      ts: 10,
      frame: {
        x: 20,
        y: 20,
        width: 100,
        height: 100,
      },
    };
    expect(EnergyPowerStruct.setPowerFrame(node, 1, 2, 5, 3, frame)).toBeUndefined();
  });

  it('ProcedureWorkerEnergyPowerTest03', function () {
    let frame = {
      x: 20,
      y: 20,
      width: 100,
      height: 100,
    };
    let node = {
      ts: 1,
      frame: {
        x: 20,
        y: 20,
        width: 100,
        height: 100,
      },
    };
    expect(EnergyPowerStruct.setPowerFrame(node, 1, 2, 2000000002, 2000000000, frame)).toBeUndefined();
  });

  it('ProcedureWorkerEnergyPowerTest04', function () {
    expect(EnergyPowerStruct.getHistogramColor('CPU')).toBe('#92D6CC');
  });

  it('ProcedureWorkerEnergyPowerTest05', function () {
    expect(EnergyPowerStruct.getHistogramColor('LOCATION')).toBe('#61CFBE');
  });

  it('ProcedureWorkerEnergyPowerTest06', function () {
    expect(EnergyPowerStruct.getHistogramColor('GPU')).toBe('#86C5E3');
  });

  it('ProcedureWorkerEnergyPowerTest07', function () {
    expect(EnergyPowerStruct.getHistogramColor('DISPLAY')).toBe('#46B1E3');
  });

  it('ProcedureWorkerEnergyPowerTest08', function () {
    expect(EnergyPowerStruct.getHistogramColor('CAMERA')).toBe('#C386F0');
  });

  it('ProcedureWorkerEnergyPowerTest09', function () {
    expect(EnergyPowerStruct.getHistogramColor('BLUETOOTH')).toBe('#8981F7');
  });

  it('ProcedureWorkerEnergyPowerTest10', function () {
    expect(EnergyPowerStruct.getHistogramColor('AUDIO')).toBe('#AC49F5');
  });

  it('ProcedureWorkerEnergyPowerTest11', function () {
    expect(EnergyPowerStruct.getHistogramColor('WIFISCAN')).toBe('#92C4BD');
  });

  it('ProcedureWorkerEnergyPowerTest12', function () {
    expect(EnergyPowerStruct.getHistogramColor('WIFISCANxcda')).toBe('#564AF7');
  });

  it('ProcedureWorkerEnergyPowerTest13', function () {
    expect(EnergyPowerStruct).not.toBeUndefined();
  });

  it('ProcedureWorkerEnergyPowerTest14', function () {
    let frame = {
      x: 50,
      y: 33,
      width: 800,
      height: 500,
    };
    let energyPowerDataList = new Array();
    energyPowerDataList.push({
      startNS: 0,
      dur: 90,
      length: 16,
      frame: {x: 0, y: 9, width: 20, height: 12},
    });
    energyPowerDataList.push({startNS: 71, dur: 32, length: 12});
    power(energyPowerDataList, [{length: 1}], 1, 3, 2, frame, true, '');
  });

  it('ProcedureWorkerEnergyPowerTest15', function () {
    let frame = {
      x: 98,
      y: 90,
      width: 500,
      height: 700,
    };
    let energyPowerDataList = new Array();
    energyPowerDataList.push({
      startNS: 0,
      dur: 50,
      length: 67,
      frame: {x: 0, y: 9, width: 60, height: 60},
    });
    energyPowerDataList.push({startNS: 12, dur: 82, length: 16});
    power(energyPowerDataList, [{length: 0}], 1, 3, 2, frame, false, '');
  });
  it('ProcedureWorkerEnergyPowerTest16 ', function () {
    let energyPowerRender = new EnergyPowerRender();
    let powerReq = {
      lazyRefresh: true,
      type: '',
      startNS: 2,
      endNS: 3,
      totalNS: 1,
      frame: {
        x: 11,
        y: 11,
        width: 77,
        height: 90,
      },
      useCache: false,
      range: {
        refresh: 'refresh',
      },
      canvas: {
        clientWidth: 1
      },
      context: {
        font: '12px sans-serif',
        fillStyle: '#a1696d',
        globalAlpha: 1,
        beginPath: jest.fn(() => true),
        measureText: jest.fn(() => true),
        clearRect: jest.fn(() => true),
        stroke: jest.fn(() => true),
        closePath: jest.fn(() => false),
        fillRect: jest.fn(() => false),
        fillText: jest.fn(() => true),
        canvas: {
          clientWidth: 1
        },
      },
      isHover: '',
      hoverX: 0,
      x: 10,
      y: 8,
      width: 102,
      height: 102,
    };
    let spApplication;
    spApplication = {
      hasAttribute: jest.fn().mockReturnValue(true),
    };
    global.document.getElementsByTagName = jest.fn().mockReturnValue([spApplication]);
    window.postMessage = jest.fn(() => true);
    TraceRow.range = jest.fn(() => true);
    TraceRow.range!.startNS = jest.fn(() => 0);
    expect(energyPowerRender.renderMainThread(powerReq, new TraceRow<EnergyPowerStruct>())).toBeUndefined();
  });
});
