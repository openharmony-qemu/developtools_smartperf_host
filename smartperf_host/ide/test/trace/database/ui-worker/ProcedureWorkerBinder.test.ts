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

import { BinderRender, BinderStruct } from '../../../../src/trace/database/ui-worker/procedureWorkerBinder';
import { SpSegmentationChart } from '../../../../src/trace/component/chart/SpSegmentationChart';

jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../src/js-heap/model/DatabaseStruct', () => {
  return {};
});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../src/trace/database/ui-worker/cpu/ProcedureWorkerCPU', () => {
  return {};
});
jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});
describe('Binder Test', () => {
  const canvas = document.createElement('canvas');
  canvas.width = 10;
  canvas.height = 10;
  TraceRow.range = jest.fn(() => {
    return {
      startNS: 0
    }
  });
  SpSegmentationChart.trace = jest.fn();
  SpSegmentationChart.trace.traceSheetEL = jest.fn();
  const ctx = canvas.getContext('2d');
  it('BinderTest01 ', function () {
    const data = {
      frame: {
        x: 210,
        y: 209,
        width: 111,
        height: 100,
      },
      name: 'binder transaction',
      cycle: -1,
      value: 0,
      depth: 0,
      startNS: 0
    };
    expect(BinderStruct.draw(ctx, data)).toBeUndefined();
  });
  it('BinderTest02', () => {
    const data = {
      context: ctx!,
      useCache: true,
      type: '',
      traceRange: [],
    };
    let binderRender = new BinderRender();
    expect(binderRender.renderMainThread(data, new TraceRow<BinderStruct>())).toBeUndefined();
  });
});
