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

import { SampleRender, SampleStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerBpftrace';
import { TraceRow } from '../../../../src/trace/component/trace/base/TraceRow';

jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});

jest.mock('../../../../src/trace/database/ui-worker/cpu/ProcedureWorkerCPU', () => {
  return {};
});
jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});
describe('ProcedureWorkerSample Test', () => {
  const canvas = document.createElement('canvas');
  canvas.width = 10;
  canvas.height = 10;
  const ctx = canvas.getContext('2d');
  it('ProcedureWorkerSampleTest01 ', function () {
    const data = {
      frame: {
        x: 210,
        y: 209,
        width: 111,
        height: 100,
      },
      name: 'Sample',
      cycle: -1,
      value: 0,
      depth: 0,
      detail: 1
    };
    expect(SampleStruct.draw(ctx, data)).toBeUndefined();
  });
  it('ProcedureWorkerSampleTest02 ', function () {
    const data = {
      context: ctx!,
      useCache: true,
      type: '',
      traceRange: [],
    };
    let sampleRender = new SampleRender();
    TraceRow.range = jest.fn(() => true);
    TraceRow.range!.startNS = jest.fn(() => 0);
    expect(sampleRender.renderMainThread(data, new TraceRow<SampleStruct>())).toBeUndefined();
  });
});