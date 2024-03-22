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

import { SpCpuChart } from '../../../../src/trace/component/chart/SpCpuChart';
import { HeapNode } from '../../../../src/js-heap/model/DatabaseStruct';
jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});

jest.mock('../../../../src/js-heap/model/DatabaseStruct');
const sqlit = require('../../../../src/trace/database/sql/Cpu.sql');
jest.mock('../../../../src/trace/database/sql/Cpu.sql');
const intersectionObserverMock = () => ({
  observe: () => null,
});
window.IntersectionObserver = jest.fn().mockImplementation(intersectionObserverMock);
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

jest.mock('../../../../src/js-heap/utils/Utils', () => {
  return {
    HeapNodeToConstructorItem: (node: HeapNode) => {
    },
  };
});
describe('SpCpuChart Test', () => {
  let MockqueryCpuMax = sqlit.queryCpuMax;
  MockqueryCpuMax.mockResolvedValue([{cpu: 1}]);

  let mockCpuSlice = sqlit.queryCpuSchedSlice;
  mockCpuSlice.mockResolvedValue([]);
  let queryCpuData = sqlit.queryCpuDataCount;
  queryCpuData.mockResolvedValue([
    {
      count: 2,
      cpu: 3,
    },
  ]);
  let htmlElement: any = document.createElement('sp-system-trace');
  let trace = new SpCpuChart(htmlElement);
  it('SpMpsChart01', async function () {
    await trace.init();
    expect(trace).toBeDefined();
  });
});
