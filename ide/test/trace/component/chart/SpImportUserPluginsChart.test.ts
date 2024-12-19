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

import '../../../../src/trace/component/chart/SpUserPluginChart';
import { SpImportUserPluginsChart } from '../../../../src/trace/component/chart/SpImportUserPluginsChart';
import { SpSystemTrace } from '../../../../src/trace/component/SpSystemTrace';
import { TraceRow } from '../../../../src/trace/component/trace/base/TraceRow';
import { SampleStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerBpftrace';
jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../src/js-heap/model/DatabaseStruct', () => {});

const intersectionObserverMock = () => ({
  observe: () => null,
});
window.IntersectionObserver = jest.fn().mockImplementation(intersectionObserverMock);
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));
describe('SpImportUserPluginsChart Test', () => {
  global.Worker = jest.fn();
  let htmlElement: SpSystemTrace = document.createElement('sp-system-trace') as SpSystemTrace;
  let traceRow = TraceRow.skeleton<SampleStruct>();
  it('SpImportUserPluginsChart Test01 ', function () {
    let chart = new SpImportUserPluginsChart(htmlElement);
    expect(chart.init()).not.toBeUndefined();
  });
  it('SpImportUserPluginsChart Test02 ', function () {
    let chart = new SpImportUserPluginsChart(htmlElement);
    expect(chart.addTraceRowEventListener(traceRow)).toBeUndefined();
  });
  it('SpImportUserPluginsChart Test03 ', function () {
    let chart = new SpImportUserPluginsChart(htmlElement);
    let item = { rowType: '', threadName: '' };
    expect(chart.addDrawAttributes(item, traceRow, traceRow)).toBeUndefined();
  });
});
