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

import { TabPaneSmapsRecord } from '../../../../../../src/trace/component/trace/sheet/smaps/TabPaneSmapsRecord';
import { Smaps } from '../../../../../../src/trace/bean/SmapsStruct';

const sqlit = require('../../../../../../src/trace/database/SqlLite');
jest.mock('../../../../../../src/trace/database/SqlLite');
jest.mock('../../../../../../src/base-ui/table/lit-table', () => {
  return {};
});
jest.mock('../../../../../../src/js-heap/model/DatabaseStruct', () => {});

jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../../../src/trace/component/trace/base/TraceRow', () => {
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
describe('TabPaneSmapsRecord Test', () => {
  let MockgetTabSmapsData = sqlit.getTabSmapsData;
  MockgetTabSmapsData.mockResolvedValue([
    {
      tsNS: 0,
      start_addr: 'start_addr',
      end_addr: 'end_addr',
      dirty: 0,
      swap: 0,
      rss: 0,
      pss: 0,
      size: 1,
      reside: 1,
      permission: 'rw-',
      path: 'path',
      shared_dirty: 1,
      private_clean: 1,
      shared_clean: 2,
      private_dirty: 1,
      swap_pss: 2,
    },
  ]);

  let tabPaneSmapsRecord = new TabPaneSmapsRecord();
  tabPaneSmapsRecord.init = jest.fn(() => true);
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
  smaps.type = 'Dta';
  smaps.dirtyStr = '1212';
  smaps.swapperStr = '222';
  smaps.rssStr = '333';
  smaps.pssStr = '444';
  smaps.sizeStr = '555';
  smaps.resideStr = '666';
  smaps.pss = 2;
  smaps.typeName = 'aaa';
  smaps.sharedCleanStr = 'aaa';
  smaps.sharedDirtyStr = 'aaa';
  smaps.privateCleanStr = 'ab';
  smaps.type = 1;
  smaps.sharedClean = 1;
  smaps.sharedDirty = 2;
  smaps.privateClean = 3;
  let result = [smaps, smaps];

  it('tabPaneSmapsRecord02', () => {
    expect(tabPaneSmapsRecord.initElements()).toBeUndefined();
  });
});
