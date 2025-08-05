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

import '../../../../../../src/trace/component/trace/sheet/bpftrace/TabPaneSampleInstruction';
import { TabPaneSampleInstruction } from '../../../../../../src/trace/component/trace/sheet/bpftrace/TabPaneSampleInstruction';
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../../../src/trace/component/trace/base/TraceRow', () => {
  return {};
});
jest.mock('../../../../../../src/js-heap/model/DatabaseStruct', () => {
  return {};
});
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

describe('TabPaneSampleInstruction Test', () => {
  let map = new Map();
  map.set('clock', [
    {
      filterId: 255,
      value: 1252,
      startNS: 4515,
      dur: 5255,
      delta: 415,
    },
  ]);
  let clockCounterData = {
    leftNs: 253,
    rightNs: 1252,
    clockMapData: map,
  };
  let sampleInstruction = new TabPaneSampleInstruction();
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  it('TabPaneSampleInstructionTest01', function () {
    sampleInstruction.updateCanvas(10);
    let clickData = {
      begin: 0
    };
    let reqProperty = {
      uniqueProperty: [[{
        begin: 0,
        func_name: 'cpu'
      },{
        begin: 1,
        func_name: 'memory'
      }]],
      flattenTreeArray: [{
        name: 'tree',
        instructions: 2
      },{
        name: 'cpu',
        instructions: 3
      },{
        name: 'memory',
        instructions: 5
      },{
        name: 'unknown',
        instructions: 5
      }]
    }
    sampleInstruction.isChecked = true;
    sampleInstruction.drawInstructionData = jest.fn();
    sampleInstruction.setSampleInstructionData(clickData, reqProperty);
    expect(sampleInstruction.instructionData).toStrictEqual([[{
      begin: 0,
      func_name: 'cpu'
    },{
      begin: 1,
      func_name: 'memory'
    }]])
  });

  it('TabPaneSampleInstructionTest02', function () {
    // sampleInstruction.floatHint = true;
    sampleInstruction.hideTip();
    sampleInstruction.showTip();
    sampleInstruction.updateTipContent();
    let sampleNode = {
      frame: undefined,
    }
    sampleInstruction.setSampleFrame(sampleNode, 10, 20);
    sampleInstruction.updateCanvasCoord();
    document.body.innerHTML = `<sp-application></sp-application>`
    let drawData = {
      frame: {
        x: 0,
        y: 2,
        width: 20,
        height: 30
      },
      name: 'cpu',
      depth: 2
    }
    sampleInstruction.draw(ctx, drawData);
    expect(sampleInstruction.instructionEle.getBoundingClientRect()).toBeTruthy()
  });
});
