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
import { Rect } from '../../../../src/trace/component/trace/timer-shaft/Rect';
import { soDataFilter, SoRender, SoStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerSoInit';

jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
describe('ProcedureWorkerSoInit Test', () => {
  it('soDataFilterTest', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    let rect = new Rect(0, 10, 10, 10);
    let filter = [
      {
        startTs: 520,
        dur: 15400,
        soName: 'Snapshot0',
        tid: 0,
        pid: 21,
        depth: 5,
        itid: 42,
        textMetricsWidth: 52.875,
        process: ''
      },
    ];
    let list = [
      {
        startTs: 32,
        dur: 1320000,
        soName: 'Snapshot1',
        tid: 120,
        pid: 213,
        depth: 21,
        itid: 22,
        textMetricsWidth: 54.6875,
        process: ''
      },
    ];
    soDataFilter(list, filter, 100254, 100254, rect, {height: 40, width: 1407, x: 0, y: 0}, true);
  });

  it('SoStructTest01', () => {
    const data = {
      frame: {
        x: 432,
        y: 222,
        width: 340,
        height: 100,
      },
      startTs: 50,
      dur: 1544000,
      soName: 'Snapshot0',
      tid: 0,
      pid: 4243,
      depth: 6,
      itid: 2,
      textMetricsWidth: 55.75,
      process: ''
    };
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    expect(SoStruct.draw(ctx, data)).toBeUndefined();
  });

  it('SoStructTest02', () => {
    const data = {
      frame: {
        x: 20,
        y: 43,
        width: 120,
        height: 100,
      },
      startTs: 50,
      dur: 152500,
      soName: 'Snapshot1',
      tid: 240,
      pid: 45,
      depth: 35,
      itid: 2,
      textMetricsWidth: 66.650546875,
      process: ''
    };
    let node = {
      frame: {
        x: 20,
        y: 90,
        width: 100,
        height: 500,
      },
      startTs: 3200,
      dur: 42000,
      soName: 'Snapshot2',
      tid: 240,
      pid: 210,
      depth: 10,
      itid: 2,
      textMetricsWidth: 96.2646875,
      process: ''
    };
    expect(SoStruct.setSoFrame(node, 2, 0, 1, 2, data)).toBeUndefined();
  });
  it('SoStructTest03', () => {
    expect(SoStruct).not.toBeUndefined();
  });
  it('SoStructTest04 ', function () {
    let soRender = new SoRender();
    let req = {
      lazyRefresh: true,
      type: '',
      startNS: 5,
      endNS: 9,
      totalNS: 4,
      frame: {
        x: 32,
        y: 20,
        width: 180,
        height: 180,
      },
      useCache: true,
      range: {
        refresh: '',
      },
      canvas: 'a',
      context: {
        font: '12px sans-serif',
        fillStyle: '#a1697d',
        globalAlpha: 0.3,
        measureText: jest.fn(() => true),
        clearRect: jest.fn(() => true),
        stroke: jest.fn(() => true),
        closePath: jest.fn(() => false),
        beginPath: jest.fn(() => true),
        fillRect: jest.fn(() => false),
        fillText: jest.fn(() => true),
      },
      lineColor: '',
      isHover: 'true',
      hoverX: 0,
      params: '',
      wakeupBean: undefined,
      flagMoveInfo: '',
      flagSelectedInfo: '',
      slicesTime: 4,
      id: 1,
      x: 24,
      y: 24,
      width: 100,
      height: 100,
    };
    window.postMessage = jest.fn(() => true);
    TraceRow.range = jest.fn(() => true);
    TraceRow.range.startNS = jest.fn(() => 1);
    expect(soRender.renderMainThread(req,new TraceRow<SoStruct>()));
  });
});
