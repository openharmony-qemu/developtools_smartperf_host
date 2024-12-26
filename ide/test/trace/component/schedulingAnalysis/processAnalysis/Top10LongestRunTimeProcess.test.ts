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

import { Top10LongestRunTimeProcess } from '../../../../../src/trace/component/schedulingAnalysis/processAnalysis/Top10LongestRunTimeProcess';
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
describe('Top10LongestRunTimeProcess Test', () => {
  it('Top10LongestRunTimeProcessTest01', () => {
    let topProcess = new Top10LongestRunTimeProcess();
    topProcess.initHtml();
    topProcess.initElements();
    topProcess.processRunTimeTbl.recycleDataSource = [1, 5, 7, 8];
    expect(topProcess.clearData()).toBeUndefined();
    let fu = (res: unknown) => {};
    expect(topProcess.queryLogicWorker('1', '1', fu)).toBeUndefined();
    expect(topProcess.initElements()).toBeUndefined();
    expect(topProcess.sortByColumn({ key: 'pName', sort: 2 }, [])).toBeUndefined();
    expect(topProcess.initHtml()).not.toBeUndefined();
    expect(topProcess.initStyleHtml()).not.toBeUndefined();
    expect(topProcess.initTagHtml()).not.toBeUndefined();
    let data = [{ no: 5, pid: 9, tid: 10, pName: 'oo', tName: 'sdf', switchCount: 5, dur: 7 }];
    expect(topProcess.sortByColumn({ key: 'pName', sort: 2 }, data)).toBeUndefined();
    expect(topProcess.sortByColumn({ key: 'tName', sort: 2 }, data)).toBeUndefined();
    expect(topProcess.sortByColumn({ key: 'dur', sort: 2 }, data)).toBeUndefined();
    expect(topProcess.organizationData(data)).not.toBeUndefined();
    expect(topProcess.clearData()).toBeUndefined();
  });
});
