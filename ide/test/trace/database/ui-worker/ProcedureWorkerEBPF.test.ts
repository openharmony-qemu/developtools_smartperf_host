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
import {
  eBPFChart,
  EBPFChartStruct, EBPFRender,
} from '../../../../src/trace/database/ui-worker/ProcedureWorkerEBPF';
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});
describe('ProcedureWorkerFileSystem Test', () => {
  it('ProcedureWorkerFileSystemTest01', function () {
    let frame = {
      x: 20,
      width: 100,
      y: 20,
      height: 100,
    };
    expect(eBPFChart([{ length: 1 }], 1, 2, 1, frame, true, true, true)).toBeUndefined();
  });

  it('ProcedureWorkerFileSystemTest02', function () {
    let frame = {
      x: 20,
      y: 20,
      width: 100,
      height: 100,
    };
    expect(eBPFChart([{ length: 0 }], 1, 2, 1, frame, false, false, false)).toBeUndefined();
  });

  it('ProcedureWorkerFileSystemTest03', function () {
    let frame = {
      x: 40,
      width: 440,
      y: 24,
      height: 500,
    };
    let fileSystemDataList = new Array();
    fileSystemDataList.push({
      startTime: 60,
      dur: 110,
      frame: { x: 40, y: 59, width: 140, height: 142 },
    });
    fileSystemDataList.push({ startTime: 14, dur: 41 });
    eBPFChart([{ length: 0 }], 1, 2, 1, frame, true, false, false);
  });

  it('ProcedureWorkerFileSystemTest03', function () {
    let frame = {
      x: 24,
      y: 21,
      width: 121,
      height: 230,
    };
    let eBPFFilters = new Array();
    eBPFFilters.push({
      startTime: 20,
      dur: 11,
      frame: { x: 10, y: 91, width: 40, height: 540 },
    });
    eBPFFilters.push({ startTime: 41, dur: 141 });
    eBPFChart([{ length: 0 }], 1, 2, 1, frame, true, false, false);
  });

  it('ProcedureWorkerFileSystemTest04', function () {
    let node = {
      frame: {
        x: 60,
        y: 24,
        width: 440,
        height: 460,
      },
      startNS: 100,
      value: 980,
      startTs: 63,
      dur: 21,
      height: 222,
    };
    let frame = {
      x: 2,
      y: 21,
      width: 15,
      height: 84,
    };
    expect(EBPFChartStruct.setFrame(node, 2, 1, 2, frame)).toBeUndefined();
  });

  it('ProcedureWorkerFileSystemTest05', function () {
    let node = {
      frame: {
        x: 80,
        y: 20,
        width: 330,
        height: 330,
      },
      startNS: 2,
      value: 61,
      startTs: 32,
      dur: 8,
      height: 10,
    };
    let frame = {
      x: 66,
      y: 2,
      width: 600,
      height: 188,
    };
    expect(EBPFChartStruct.setFrame(node, 2, 1, 2, frame)).toBeUndefined();
  });

  it('ProcedureWorkerFileSystemTest06', function () {
    expect(EBPFChartStruct.computeHeightNoGroup([{ length: 1 }], 10)).toEqual([
      {
        dur: 10,
        group10Ms: false,
        height: 18,
        size: 1,
        startNS: 0,
      },
      { dur: 0, group10Ms: false, height: 0, size: 0, startNS: 10 },
    ]);
  });
  it('ProcedureWorkerFileSystemTest07 ', function () {
    let eBPFRender = new EBPFRender();
    let eBPFReq = {
      lazyRefresh: true,
      type: '',
      startNS: 2,
      endNS: 3,
      totalNS: 1,
      frame: {
        x: 11,
        y: 11,
        width: 70,
        height: 90,
      },
      useCache: false,
      range: {
        refresh: 'refresh',
      },
      canvas: '',
      context: {
        font: '12px sans-serif',
        fillStyle: '#a1697d',
        globalAlpha: 0,
        measureText: jest.fn(() => true),
        clearRect: jest.fn(() => true),
        stroke: jest.fn(() => true),
        closePath: jest.fn(() => false),
        beginPath: jest.fn(() => true),
        fillRect: jest.fn(() => false),
        fillText: jest.fn(() => true),
      },
      isHover: '',
      hoverX: 0,
      params: '',
      wakeupBean: undefined,
      id: 1,
      x: 12,
      y: 11,
      width: 102,
      height: 102,
    };
    window.postMessage = jest.fn(() => true);
    expect(eBPFRender.renderMainThread(eBPFReq,new TraceRow<EBPFChartStruct>())).toBeUndefined()
    expect(eBPFRender.render(eBPFReq,[],[])).toBeUndefined()
  });
});
