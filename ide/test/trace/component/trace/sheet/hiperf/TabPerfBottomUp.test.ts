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

import { TabpanePerfBottomUp } from '../../../../../../src/trace/component/trace/sheet/hiperf/TabPerfBottomUp';

jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../../../src/trace/component/trace/base/TraceRow', () => {
  return {};
});
jest.mock('../../../../../../src/base-ui/table/lit-table', () => {
  return {
    snapshotDataSource: () => {},
    removeAttribute: () => {},
  };
});
jest.mock('../../../../../../src/js-heap/model/DatabaseStruct', () => {});
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));
describe('TabPanePerfBottomUp Test', () => {
  let tabPanePerfBottomUp = new TabpanePerfBottomUp();
  let data = {
    leftNs: 1222,
    rightNs: 5286,
  };
  it('TabPanePerfBottomUp02 ', function () {
    tabPanePerfBottomUp.data = data;
    expect(tabPanePerfBottomUp.data).toBeUndefined();
  });
  it('TabPanePerfBottomUp03 ', function () {
    expect(tabPanePerfBottomUp.setBottomUpTableData([])).toBeUndefined();
  });
});
