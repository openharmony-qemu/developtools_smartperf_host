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

jest.mock('../../../../src/js-heap/model/DatabaseStruct', () => {});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
import {
  proc,
  ProcessStruct,
  ProcessRender,
} from '../../../../src/trace/database/ui-worker/ProcedureWorkerProcess';
import { Rect } from '../../../../src/trace/component/trace/timer-shaft/Rect';

jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});

describe(' ProcessTest', () => {
  let res = [
    {
      startNS: 6,
      dur: 650,
      frame: {
        x: 99,
        y: 92,
        width: 190,
        height: 193,
      },
    },
  ];
  it('ProcessTest01', () => {
    let dataList = new Array();
    dataList.push({
      startTime: 0,
      dur: 10,
      frame: { x: 0, y: 9, width: 10, height: 10 },
    });
    dataList.push({ startTime: 1, dur: 111 });
    let rect = new Rect(0, 10, 10, 10);
    proc(dataList, res, 1, 100254, 100254, rect);
  });

  it('ProcessTest02', () => {
    let processDataList = new Array();
    processDataList.push({
      startTime: 450,
      dur: 150,
      frame: { x: 32, y: 3, width: 10, height: 120 },
    });
    processDataList.push({
      startTime: 1,
      dur: 51,
      frame: { x: 30, y: 93, width: 20, height: 10 },
    });
    let rect = new Rect(0, 10, 10, 50);
    proc(processDataList, res, 1, 100254, 100254, rect);
  });

  it('ProcessTest04', () => {
    const node = {
      frame: {
        x: 104,
        y: 20,
        width: 105,
        height: 100,
      },
      startNS: 200,
      value: 30,
      startTime: 0,
      dur: 0,
    };
    const frame = {
      x: 20,
      y: 120,
      width: 100,
      height: 100,
    };
    expect(ProcessStruct.setFrame(node, 1, 1, 1, frame)).toBeUndefined();
  });

  it('ProcessTest05', () => {
    const node = {
      frame: {
        x: 201,
        y: 20,
        width: 3,
        height: 100,
      },
      startNS: 200,
      value: 50,
      startTime: 2,
      dur: 2,
    };
    const frame = {
      x: 20,
      y: 40,
      width: 100,
      height: 100,
    };
    expect(ProcessStruct.setFrame(node, 1, 1, 1, frame)).toBeUndefined();
  });
  it('ProcessTest06 ', function () {
    let processRender = new ProcessRender();
    let canvas = document.createElement('canvas') as HTMLCanvasElement;
    let context = canvas.getContext('2d');
    const data = {
      context: context!,
      useCache: true,
      type: '',
      traceRange: [],
    };
    window.postMessage = jest.fn(() => true);
    TraceRow.range = jest.fn(() => true);
    TraceRow.range.startNS = jest.fn(() => 2);
    expect(processRender.renderMainThread(data,new TraceRow<ProcessStruct>()))
  });
});
