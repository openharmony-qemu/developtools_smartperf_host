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
jest.mock('../../../../../../src/base-ui/table/lit-table', () => {
  return {
    snapshotDataSource: () => {},
    removeAttribute: () => {},
  };
});
import { TabPanePurgPinComparisonAbility } from '../../../../../../src/trace/component/trace/sheet/ability/TabPanePurgPinComparisonAbility';
import '../../../../../../src/trace/component/trace/sheet/ability/TabPanePurgPinComparisonAbility';
const sqlite = require('../../../../../../src/trace/database/SqlLite');
jest.mock('../../../../../../src/trace/database/SqlLite');
jest.mock('../../../../../../src/base-ui/select/LitSelect', () => {
  return {};
});
jest.mock('../../../../../../src/js-heap/model/DatabaseStruct', () => {});
jest.mock('../../../../../../src/trace/bean/NativeHook', () => {
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

describe('TabPanePurgPinComparisonAbility Test', () => {
  let tabPanePurgPinComparisonAbility = new TabPanePurgPinComparisonAbility();
  let querySysPurgeableSelectionTab = sqlite.querySysPurgeableSelectionTab;
  querySysPurgeableSelectionTab.mockResolvedValue([
    {
      value: 24265824,
      name: '353.00MB',
    },
    {
      value: 21456824,
      name: '3.00MB',
    },
    {
      value: 2321134,
      name: '354.00MB',
    },
  ]);
  let data = [
    {
      name: 'Snapshot1',
      startNs: 4778214061,
      type: 'ability',
      value: 0,
    },
  ];
  let datalist = [
    {
      name: 'Snapshot2',
      startNs: 9800526561,
      type: 'ability',
      value: 0,
    },
    {
      name: 'Snapshot1',
      startNs: 212387543,
      type: 'ability',
      value: 0,
    },
  ];
  tabPanePurgPinComparisonAbility.init = jest.fn(() => true);
  it('TabPanePurgPinComparisonAbility02', function () {
    expect(tabPanePurgPinComparisonAbility.updateComparisonData(0, 1000)).toBeTruthy();
  });
  it('TabPanePurgPinComparisonAbility03', function () {
    expect(tabPanePurgPinComparisonAbility.queryTableData(0, 1000)).toBeTruthy();
  });
  it('TabPanePurgPinComparisonAbility01', function () {
    tabPanePurgPinComparisonAbility.initSelect = jest.fn(() => true);
    expect(tabPanePurgPinComparisonAbility.totalData(data, datalist)).toBeUndefined();
  });
});
