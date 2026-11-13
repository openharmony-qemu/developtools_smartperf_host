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
jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});
import { LogStruct, LogRender } from '../../../../src/trace/database/ui-worker/ProcedureWorkerLog';

describe('ProcedureWorkerLog Test', () => {
  let canvas = document.createElement('canvas');
  canvas.width = 12;
  canvas.height = 12;
  const ctx = canvas.getContext('2d');
  let data = {
    id: 5230,
    startTs: 27351020209,
    level: 'E',
    depth: 3,
    tag: 'C01510/BinderInvoker1',
    context: '124: SendRequest: handle=0 result = 2',
    time: 15020293020884055,
    pid: 577,
    tid: 967,
    processName: 'distributeddata',
    dur: 1,
    frame: {
      x: 1385,
      y: 22,
      width: 1,
      height: 7,
    },
  };
  it('ProcedureWorkerLog01', () => {
    expect(LogStruct.draw(ctx!, data)).toBeUndefined();
  });
  it('ProcedureWorkerLog02', () => {
    let logRender = new LogRender();
    let logReq = {
      lazyRefresh: true,
      type: 'log',
      startNS: 5,
      endNS: 9,
      totalNS: 3,
      frame: {
        x: 32,
        y: 20,
        width: 130,
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
      height: 100
    };
    window.postMessage = jest.fn(() => true);
    TraceRow.range = jest.fn(() => true);
    TraceRow.range.startNS = jest.fn(() => 1);
    expect(logRender.renderMainThread(logReq, new TraceRow()));
  });
  it('ProcedureWorkerLog03 ', function () {
    let logNode = {
      frame: {
        x: 60,
        y: 24,
        width: 430,
        height: 460,
      },
      startNS: 100,
      value: 980,
      startTs: 53,
      dur: 21,
      height: 222,
    };
    let frame = {
      x: 2,
      y: 20,
      width: 15,
      height: 84,
    };
    expect(LogStruct.setLogFrame(logNode,1,1,1,1,frame)).toBeUndefined()
  });
});
