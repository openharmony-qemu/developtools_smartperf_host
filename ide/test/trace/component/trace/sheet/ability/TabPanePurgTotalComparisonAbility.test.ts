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
import { TabPanePurgTotalComparisonAbility } from '../../../../../../src/trace/component/trace/sheet/ability/TabPanePurgTotalComparisonAbility';
const sqlite = require('../../../../../../src/trace/database/SqlLite');
jest.mock('../../../../../../src/trace/database/SqlLite');
jest.mock('../../../../../../src/base-ui/select/LitSelect', () => {
  return {};
});
jest.mock('../../../../../../src/trace/bean/NativeHook', () => {
  return {};
});
jest.mock('../../../../../../src/base-ui/table/lit-table', () => {
  return {
    snapshotDataSource: () => {},
    removeAttribute: () => {},
  };
});
jest.mock('../../../../../../src/js-heap/model/DatabaseStruct', () => {});
// @ts-ignore
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

describe('TabPanePurgTotalComparisonAbility Test', () => {
  let tabPanePurgTotalComparisonAbility = new TabPanePurgTotalComparisonAbility();
  let querySysPurgeableSelectionTab = sqlite.querySysPurgeableSelectionTab;
  querySysPurgeableSelectionTab.mockResolvedValue([
    {
      value: 47865824,
      name: '22.00MB',
    },
    {
      value: 345165824,
      name: '21.00MB',
    },
    {
      value: 23465824,
      name: '786.00MB',
    },
  ]);
  let data = [
    {
      name: 'Snapshot1',
      startNs: 4546114061,
      type: 'ability',
      value: 0,
    },
  ];
  let datalist = [
    {
      name: 'Snapshot2',
      startNs: 765526561,
      type: 'ability',
      value: 0,
    },
    {
      name: 'Snapshot1',
      startNs: 476533061,
      type: 'ability',
      value: 0,
    },
  ];
  tabPanePurgTotalComparisonAbility.init = jest.fn(() => true);
  it('TabPanePurgTotalComparisonAbility01', function () {
    expect(tabPanePurgTotalComparisonAbility.updateComparisonData(0, 1000)).toBeTruthy();
  });
  it('TabPanePurgTotalComparisonAbility02', function () {
    expect(tabPanePurgTotalComparisonAbility.queryTableData(0, 1000)).toBeTruthy();
  });
  it('TabPanePurgTotalComparisonAbility03', function () {
    tabPanePurgTotalComparisonAbility.initSelect = jest.fn(() => true);
    expect(tabPanePurgTotalComparisonAbility.totalData(data, datalist)).toBeUndefined();
  });
});
