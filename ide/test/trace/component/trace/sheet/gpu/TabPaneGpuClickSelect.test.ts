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
import { TabPaneGpuClickSelect } from '../../../../../../src/trace/component/trace/sheet/gpu/TabPaneGpuClickSelect';

jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../../../src/trace/bean/NativeHook', () => {
  return {};
});
const sqlite = require('../../../../../../src/trace/database/SqlLite');
jest.mock('../../../../../../src/trace/database/SqlLite');
jest.mock('../../../../../../src/trace/component/trace/sheet/gpu/TabPaneGpuClickSelectComparison', () => {
  return {};
});

// @ts-ignore
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

describe('TabPaneGpuClickSelect Test', () => {
  let tabPaneGpuClickSelect = null;
  let tbGpu = null
  beforeAll(() => {
    document.body.innerHTML = `<div><lit-table id="tb-gpu"></lit-table></div>`;
    tbGpu = document.querySelector('#tb-gpu');
    tabPaneGpuClickSelect = new TabPaneGpuClickSelect(tbGpu);
  });
  let queryGpuDataByTs = sqlite.queryGpuDataByTs;
  queryGpuDataByTs.mockResolvedValue([
    {
      windowId: 1,
      moduleId: 2,
      categoryId: 0,
      size: 123,
    },
    {
      windowId: 7,
      moduleId: 8,
      categoryId: 2,
      size: 1213,
    },
  ]);
  it('TabPaneGpuClickSelectTest01', () => {
    expect(sqlite.queryGpuDataByTs).toHaveBeenCalledTimes(0);
  });
  it('TabPaneGpuClickSelectTest02', () => {
    let tabPaneGpuClickSelects = new TabPaneGpuClickSelect();
    tabPaneGpuClickSelects.gpuTbl = jest.fn(() => true);
    expect(
      tabPaneGpuClickSelects.sortByColumn({
        sort: 0,
      })
    ).toBeUndefined();
  });
});
