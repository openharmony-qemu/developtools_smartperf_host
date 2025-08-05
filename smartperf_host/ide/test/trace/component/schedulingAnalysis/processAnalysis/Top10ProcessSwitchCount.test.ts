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

import { Top10ProcessSwitchCount } from '../../../../../src/trace/component/schedulingAnalysis/processAnalysis/Top10ProcessSwitchCount';
import { LitTable } from '../../../../../src/base-ui/table/lit-table';

// @ts-ignore
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));
jest.spyOn(LitTable.prototype, 'reMeauseHeight').mockReturnValue(undefined);
jest.mock('../../../../../src/base-ui/chart/pie/LitChartPie', () => {
    return jest.fn().mockImplementation(() => {
      return {
        initHtml: jest.fn(),
        initElements: jest.fn(),
        updateData: jest.fn(),
        measureInitialize: jest.fn(),
      };
    });
  });
describe('Top10ProcessSwitchCount Test', () => {
  it('Top10ProcessSwitchCountTest01', () => {
    let topProcess = new Top10ProcessSwitchCount();
    topProcess.initHtml();
    topProcess.initElements();
    topProcess.traceChange = true;
    topProcess.queryLogicWorker = jest.fn();
    topProcess.processSwitchCountTbl.recycleDataSource = [1, 5, 7, 8];
    expect(topProcess.clearData()).toBeUndefined();
    let fu = (res: unknown) => {};
    expect(topProcess.queryLogicWorker('1', '1', fu)).toBeUndefined();
    expect(topProcess.init()).toBeUndefined();
    expect(topProcess.initElements()).toBeUndefined();
    expect(topProcess.sortByColumn({ key: 'pName', sort: 2 }, [])).toBeUndefined();
    expect(topProcess.initHtml()).not.toBeUndefined();
    expect(topProcess.initStyleHtml()).not.toBeUndefined();
    expect(topProcess.initTagHtml()).not.toBeUndefined();
    let data = [{ NO: 5, pid: 9, tid: 10, pName: 'oo', tName: 'sdf', switchCount: 5, occurrences: 7 }];
    expect(topProcess.sortByColumn({ key: 'pName', sort: 2 }, data)).toBeUndefined();
    expect(topProcess.sortByColumn({ key: 'tName', sort: 2 }, data)).toBeUndefined();
    expect(topProcess.sortByColumn({ key: 'tid', sort: 2 }, data)).toBeUndefined();
    expect(topProcess.threadCallback(data)).toBeUndefined();
    expect(topProcess.organizationData(data)).not.toBeUndefined();
    expect(topProcess.clearData()).toBeUndefined();
  });
  it('Top10ProcessSwitchCountTest02', () => {
    let topProcess = new Top10ProcessSwitchCount();
    topProcess.initHtml();
    topProcess.initElements();
    topProcess.traceChange = false;
    topProcess.queryLogicWorker = jest.fn();
    topProcess.processSwitchCountTbl.recycleDataSource = [1, 5, 7, 8];
    expect(topProcess.init()).toBeUndefined();
  });
});
