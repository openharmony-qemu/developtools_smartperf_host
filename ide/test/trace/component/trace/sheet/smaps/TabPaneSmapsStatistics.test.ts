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

import { TabPaneSmapsStatistics } from '../../../../../../src/trace/component/trace/sheet/smaps/TabPaneSmapsStatistics';
import { Smaps, SmapsTreeObj } from '../../../../../../src/trace/bean/SmapsStruct';
jest.mock('../../../../../../src/trace/component/trace/sheet/smaps/TabPaneSmapsComparison', () => {
  return {};
});
const sqlit = require('../../../../../../src/trace/database/sql/Smaps.sql');
jest.mock('../../../../../../src/trace/database/sql/Smaps.sql');
jest.mock('../../../../../../src/base-ui/table/lit-table', () => {
  return {};
});
jest.mock('../../../../../../src/js-heap/model/DatabaseStruct', () => {});
jest.mock('.../../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../../../src/base-ui/select/LitSelect', () => {
  return {};
});

jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../../../src/trace/component/trace/base/TraceRow', () => {
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
  let MockgetTabSmapsMaxRss = sqlit.getTabSmapsMaxSize;
  MockgetTabSmapsMaxRss.mockResolvedValue([
    {
      startNS: 0,
      max_value: 100,
    },
  ]);
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
  let MockgetTabSmapsData = sqlit.getTabSmapsData;
  MockgetTabSmapsData.mockResolvedValue([smaps]);

  let tabPaneSmapsStatistics = new TabPaneSmapsStatistics();
  let dataTree: SmapsTreeObj = new SmapsTreeObj('DATA', '', 'DATA');

  it('TabPaneSmapsStatisticsTest01', () => {
    tabPaneSmapsStatistics.handleSmapsTreeObj(dataTree, 2);
    expect(dataTree.rsspro).toBeUndefined();
  });

  it('TabPaneSmapsStatisticsTest02', () => {
    tabPaneSmapsStatistics.handleAllDataTree(new Smaps(), 0, 'All', dataTree, 3);
    expect(dataTree.children.length).toBe(0);
  });

  it('TabPaneSmapsStatisticsTest03', () => {
    tabPaneSmapsStatistics.handleTree(smaps, 0, 'TEXT', dataTree, 4);
    expect(dataTree.pss).toBe(2);
  });
  it('TabPaneSmapsStatisticsTest1', () => {
    tabPaneSmapsStatistics.tblSmapsStatistics.reMeauseHeight = jest.fn(() => true);
    let result = [smaps, smaps];
    expect(
      tabPaneSmapsStatistics.filteredData(result, tabPaneSmapsStatistics.tblSmapsStatistics, 1000)
    ).toBeUndefined();
  });
});
