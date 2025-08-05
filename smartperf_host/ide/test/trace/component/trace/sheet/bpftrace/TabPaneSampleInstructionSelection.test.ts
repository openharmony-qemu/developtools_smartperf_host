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

import '../../../../../../src/trace/component/trace/sheet/bpftrace/TabPaneSampleInstructionSelection';
import { TabPaneSampleInstructionSelection } from '../../../../../../src/trace/component/trace/sheet/bpftrace/TabPaneSampleInstructionSelection';
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

describe('TabPaneSampleInstructionSelection Test', () => {
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
  let sampleInstruction = new TabPaneSampleInstructionSelection();
  sampleInstruction.drawInstructionData = jest.fn();
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');

  sampleInstruction.data = {
    sampleData: [{
      name: 'tree',
      instructions: 2,
      property: ['S']
    },{
      name: 'cpu',
      instructions: 3,
      property: ['S']
    },{
      name: 'memory',
      instructions: 5,
      property: ['S']
    },{
      name: 'unknown',
      instructions: 5,
      property: ['S']
    }]
  };
  document.body.innerHTML = `<sp-application></sp-application>`
  it('TabPaneSampleInstructionSelectionTest01', function () {
    let htmlDivElement = document.createElement('div');
    htmlDivElement.appendChild(sampleInstruction);
    sampleInstruction.updateCanvasCoord();
    sampleInstruction.showTip();
    sampleInstruction.updateTipContent();

    let instructionData = {
      x: 0,
      y: 2,
      width: 20,
      height: 30
    }

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
    sampleInstruction.setSampleFrame({frame: undefined}, 20, 30);
    sampleInstruction.updateCanvasCoord();
    sampleInstruction.draw(ctx, drawData);
    expect(sampleInstruction.isContains(instructionData, 1, 20)).toBeTruthy();
  });
});
