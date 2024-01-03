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

// @ts-ignore

import {
  TabPaneSmapsComparison,
  SmapsCompareStruct,
} from '../../../../../../src/trace/component/trace/sheet/smaps/TabPaneSmapsComparison';
import { Smaps, SmapsTreeObj } from '../../../../../../src/trace/bean/SmapsStruct';
const sqlit = require('../../../../../../src/trace/database/SqlLite');
jest.mock('../../../../../../src/trace/database/SqlLite');
jest.mock('../../../../../../src/base-ui/table/lit-table', () => {
  return {
    snapshotDataSource: () => {},
    removeAttribute: () => {},
  };
});
jest.mock('../../../../../../src/js-heap/model/DatabaseStruct', () => {});

jest.mock('../../../../../../src/base-ui/select/LitSelect', () => {
  return {};
});
jest.mock('../../../../../../src/trace/bean/NativeHook', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

describe('TabPaneSmapsStatistics Test', () => {
  let MockgetTabSmapsData = sqlit.getTabSmapsStatisticData;
  let smaps = new Smaps();
  smaps.tsNS = -1;
  smaps.start_addr = 'aaaaa';
  smaps.end_addr = 'bbbbb';
  smaps.permission = 'dddd';
  smaps.path = '/asdasdas';
  smaps.size = 0;
  smaps.rss = 0;
  smaps.pss = 0;
  smaps.reside = 0;
  smaps.dirty = 0;
  smaps.swapper = 0;
  smaps.address = 'aaaaa-bbbbb';
  smaps.type = '1';
  smaps.dirtyStr = '1212';
  smaps.swapperStr = '222';
  smaps.rssStr = '333';
  smaps.pssStr = '444';
  smaps.sizeStr = '555';
  smaps.resideStr = '666';
  smaps.pss = 2;
  let result = [smaps, smaps];
  MockgetTabSmapsData.mockResolvedValue([smaps]);
  let tabPaneSmapsComparison = new TabPaneSmapsComparison();
  it('TabPaneSmapsStatistics01', () => {
    let result = [
      {
        name: 'Snapshot1',
        startNs: 4778214061,
        value: 0,
      },
    ];
    let datalist = [
      {
        name: 'Snapshot2',
        startNs: 9800526561,
        value: 0,
      },
      {
        name: 'Snapshot1',
        startNs: 4778214061,
        value: 0,
      },
    ];
    expect(tabPaneSmapsComparison.initSelect(result, datalist)).toBeUndefined();
  });
});
