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

import '../../../../../../src/trace/component/trace/sheet/bpftrace/TabPaneSampleInstructionDistributions';
import { TabPaneSampleInstructionDistributions } from '../../../../../../src/trace/component/trace/sheet/bpftrace/TabPaneSampleInstructionDistributions';
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

describe('TabPaneSampleInstructionDistributions Test', () => {
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
  let sampleInstruction = new TabPaneSampleInstructionDistributions();
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  sampleInstruction.data = {
    sampleData: [{
      property: []
    }]
  };

  it('TabPaneSampleInstructionDistributionsTest01', function () {
    sampleInstruction.ctx = ctx;
    let htmlDivElement = document.createElement('div');
    htmlDivElement.appendChild(sampleInstruction);
    sampleInstruction.updateCanvasCoord();
    sampleInstruction.showTip();
    sampleInstruction.updateTipContent();
    sampleInstruction.drawLineLabelMarkers(10, 20, true);
    sampleInstruction.drawLineLabelMarkers(10, 20, false);
    sampleInstruction.drawLine(10, 20, 50, 60);
    sampleInstruction.drawRect(10, 20, 50, 60);
    sampleInstruction.drawMarkers(50, 60);
    let instructionData = {
      x: 0,
      y: 2,
      width: 20,
      height: 30
    }
    sampleInstruction.updateCanvasCoord();
    sampleInstruction.drawBar(instructionData, 10, 20);
    expect(sampleInstruction.isContains(instructionData, 1, 20)).toBeTruthy();
  });
});
