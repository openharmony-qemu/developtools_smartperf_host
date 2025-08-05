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

import { TraceSheet } from '../../../../../../src/trace/component/trace/base/TraceSheet';
import { HangStructInPane, TabPaneHang } from '../../../../../../src/trace/component/trace/sheet/hang/TabPaneHang';
import { HangStruct } from '../../../../../../src/trace/database/ui-worker/ProcedureWorkerHang';
jest.mock('../../../../../../src/trace/component/trace/base/TraceRow', () => {
  return {};
});
jest.mock('../../../../../../src/js-heap/model/DatabaseStruct', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
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
global.Worker = jest.fn();
describe('TabPaneHang Test', () => {
  it('TabPaneHangTest01', function () {
    let tabPane = new TabPaneHang();
    expect(tabPane.initElements()).toBeUndefined();
  });

  it('TabPaneHangTest02', function () {
    let tabPane = new TabPaneHang();
    expect(tabPane.connectedCallback()).toBeUndefined();
  });

  it('TabPaneHangTest03', function () {
    let tabPane = new TabPaneHang();
    expect(tabPane.initHtml()).not.toBeUndefined();
    expect(tabPane.disconnectedCallback()).toBeUndefined();
  });

  it('TabPaneHangTest04', function () {
    let tabPane = new TabPaneHang();
    tabPane.initElements();
    expect(tabPane.refreshHangTab()).toBeUndefined();
  });

  it('TabPaneHangTest05', function () {
    let tabPane = new TabPaneHang();
    tabPane.initElements();
    expect(tabPane.refreshHangsTitle()).toBeUndefined();
    let traceSheet = new TraceSheet();
    expect(tabPane.initTabSheetEl(traceSheet)).toBeUndefined();
  });

  it('TabPaneHangTest06', function () {
    let tabPane = new TabPaneHang();
    let parent = new HangStruct();
    let data = new HangStructInPane(parent);
    expect(tabPane.isFilterHang(data)).not.toBeUndefined();
  });

  it('TabPaneHangTest07', function () {
    let tabPane = new TabPaneHang();
    tabPane.initElements();
    expect(tabPane.refreshTable()).toBeUndefined();
  });

  it('TabPaneHangTest08', function () {
    let tabPane = new TabPaneHang();
    tabPane.initElements();
    expect(tabPane.delayedRefresh(() => {}, 100)).not.toBeUndefined();
  });

  it('TabPaneHangTest09', function () {
    let tabPane = new TabPaneHang();
    tabPane.initElements();
    expect(tabPane.sortByColumn('startTime', 1)).toBeUndefined();
  });

  it('TabPaneHangTest10', function () {
    let parent = new HangStruct();
    let tabPane = new HangStructInPane(parent);
    tabPane.startTime = 50;
    expect(tabPane.startTime).toEqual(50);
  });

  it('TabPaneHangTest11', function () {
    let tabPane = new TabPaneHang();
    tabPane.initElements();
    expect(tabPane.sortByColumn('startTime', 2)).toBeUndefined();
    expect(tabPane.sortByColumn('durStr', 2)).toBeUndefined();
    expect(tabPane.sortByColumn('type', 2)).toBeUndefined();
    expect(tabPane.sortByColumn('pname', 2)).toBeUndefined();
    expect(tabPane.sortByColumn('sendEventTid', 2)).toBeUndefined();
    expect(tabPane.sortByColumn('sendTime', 2)).toBeUndefined();
    expect(tabPane.sortByColumn('expectHandleTime', 2)).toBeUndefined();
    expect(tabPane.sortByColumn('taskNameId', 2)).toBeUndefined();
    expect(tabPane.sortByColumn('prio', 2)).toBeUndefined();
    expect(tabPane.sortByColumn('caller', 2)).toBeUndefined();
    expect(tabPane.sortByColumn('fds', 2)).toBeUndefined();
  });
});
