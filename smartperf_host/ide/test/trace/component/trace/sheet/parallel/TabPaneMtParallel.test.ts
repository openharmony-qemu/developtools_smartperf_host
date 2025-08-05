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

import { SelectionParam } from '../../../../../../src/trace/bean/BoxSelection';
import { TraceRow } from '../../../../../../src/trace/component/trace/base/TraceRow';
import {
  CpuStatus,
  TabPaneMtParallel,
} from '../../../../../../src/trace/component/trace/sheet/parallel/TabPaneMtParallel';
jest.mock('../../../../../../src/js-heap/model/DatabaseStruct', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest
  .spyOn(require('../../../../../../src/trace/component/trace/sheet/parallel/ParallelUtil'), 'MeterHeaderClick')
  .mockReturnValue(1);
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));
const intersectionObserverMock = () => ({
  observe: () => null,
});
describe('TabPaneMtParallel Test', () => {
  let tabpane = new TabPaneMtParallel();
  let selectionParam = new SelectionParam();
  selectionParam.processIds = [1, 2, 3];
  selectionParam.threadIds = [1, 2, 3];
  selectionParam.leftNs = 5000;
  selectionParam.rightNs = 50000;
  selectionParam.recordStartNs = 0;
  selectionParam.recordStartNs = 0;
  tabpane.initElements();
  it('TabPaneMtParallelt01', function () {
    tabpane.cpuSettingElListener = jest.fn();
    tabpane.groupSettingElListener = jest.fn();
    expect(tabpane.initElements()).toBeUndefined();
  });

  it('TabPaneMtParallelt02', function () {
    expect(tabpane.resetGroup(true)).toBeUndefined();
  });

  it('TabPaneMtParallelt03', function () {
    expect(tabpane.resetSomeConfig(true)).toBeUndefined();
  });

  it('TabPaneMtParallelt04', function () {
    expect(tabpane.handleSamePhysicsCore([], { L: [1, 2, 3], M: [1, 2, 3], S: [1, 2, 3] })).not.toBeUndefined();
  });

  it('TabPaneMtParallelt05', function () {
    let result = [{ pid: 8, endTs: 88, ts: 7, tid: 8, pName: 'dsf' }];
    let key = 'fs';
    let gourpKey = 'fs';
    let gourp = [45, 8, 9];
    expect(tabpane.handleTreeProcessData(result, key, gourpKey, gourp)).toBeUndefined();
  });

  it('TabPaneMtParallelt06', function () {
    let result = [{ pid: 8, endTs: 88, ts: 7, tid: 8, pName: 'dsf' }];
    let key = 'fs';
    let gourpKey = 'fs';
    let gourp = [45, 8, 9];
    let map: Map<string, unknown> = new Map();
    map.set(`${result[0].pid}`, {
      pid: result[0].pid,
      tid: result[0].tid,
      gourpDur: 81,
      tidArr: [result[0].tid],
      stateItem: [result[0]],
    });
    expect(tabpane.mergeTreeCoreData(map, key, gourpKey, gourp)).toBeUndefined();
  });

  it('TabPaneMtParallelt07', function () {
    expect(tabpane.hanldMapLogic({ endTs: 80, ts: 10 }, 5, 5)).toEqual(75);
  });

  it('TabPaneMtParallelt08', function () {
    tabpane.isCreateCpu = true;
    expect(tabpane.initDefaultConfig()).toBeUndefined();
  });

  it('TabPaneMtParallelt09', function () {
    tabpane.isCreateCpu = false;
    expect(tabpane.initDefaultConfig()).toBeUndefined();
  });

  it('TabPaneMtParallelt10', function () {
    expect(tabpane.initGroupFn([4, 7, 8])).toBeUndefined();
  });

  it('TabPaneMtParallelt11', function () {
    expect(tabpane.getGroupTableLine()).toBeUndefined();
  });

  it('TabPaneMtParallelt12', function () {
    expect(tabpane.creatCpuHeaderDiv()).toBeUndefined();
  });

  it('TabPaneMtParallelt13', function () {
    expect(tabpane.creatGroupLineDIv({ cpu: 4, isCheck: true, disabled: true })).toBeUndefined();
  });

  it('TabPaneMtParallelt14', function () {
    expect(tabpane.connectedCallback()).toBeUndefined();
    expect(tabpane.initHtml()).not.toBeUndefined();
  });
});
