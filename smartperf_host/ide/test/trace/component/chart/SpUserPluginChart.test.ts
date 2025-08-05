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
import { SpUserFileChart } from '../../../../src/trace/component/chart/SpUserPluginChart';
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

const sqlite = require('../../../../src/trace/database/sql/SqlLite.sql');
jest.mock('../../../../src/trace/database/sql/SqlLite.sql');

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
describe('SpUserFileChart Test', () => {
  global.Worker = jest.fn();
  let startTimeData = sqlite.queryStartTime;
  let mockStartTime = [
    {
      start_ts: 10,
    },
  ];
  startTimeData.mockResolvedValue([]);
  startTimeData.mockResolvedValue(mockStartTime);
  let htmlElement: SpSystemTrace = document.createElement('sp-system-trace') as SpSystemTrace;

  let file = new File([], 'test.js');
  let traceRow = TraceRow.skeleton<SampleStruct>();
  let children = [
    {
      function_name: 'func1',
      children: [],
      detail: '',
      depth: 1,
      name: '1',
      parentName: 'p0',
      property: [],
    },
  ];
  let treeData = [
    {
      function_name: 'func0',
      children: children,
      detail: '',
      depth: 0,
      name: '0',
      parentName: '1',
      property: [],
    },
  ];
  it('SpUserFileChart Test01 ', function () {
    let segmentationChart = new SpUserFileChart(htmlElement);
    expect(segmentationChart.init(null)).not.toBeUndefined();
    expect(segmentationChart.init(file)).not.toBeUndefined();
  });
  it('SpUserFileChart Test02 ', function () {
    let segmentationChart = new SpUserFileChart(htmlElement);
    expect(segmentationChart.initSample(10, null)).not.toBeUndefined;
    expect(segmentationChart.initSample(10, file)).not.toBeUndefined;
  });
  it('SpUserFileChart Test03 ', function () {
    let segmentationChart = new SpUserFileChart(htmlElement);
    expect(segmentationChart.addTraceRowEventListener(traceRow, 10)).toBeUndefined();
  });
  it('SpUserFileChart Test04 ', function () {
    let returnValue = [
      { depth: 0, detail: '', name: 'func0', parentName: 'p0', property: [] },
      { depth: 1, detail: '', name: 'func1', parentName: 'func0', property: [] },
    ];
    let segmentationChart = new SpUserFileChart(htmlElement);
    expect(segmentationChart.getFlattenTreeData(treeData, 0, 'p0')).toStrictEqual(returnValue);
  });
  it('SpUserFileChart Test05 ', function () {
    let segmentationChart = new SpUserFileChart(htmlElement);
    expect(segmentationChart.resetChartData(traceRow)).toBeUndefined();
  });
});
