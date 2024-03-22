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
import { SpArkTsChart } from '../../../../src/trace/component/chart/SpArkTsChart';
jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});

jest.mock('../../../../src/js-heap/model/DatabaseStruct');
const sqlite = require('../../../../src/trace/database/sql/Cpu.sql');
jest.mock('../../../../src/trace/database/sql/Cpu.sql');
const JsMemory = require('../../../../src/trace/database/sql/Memory.sql');
jest.mock('../../../../src/trace/database/sql/Memory.sql');
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

describe('SpArkTsChart Test', () => {
  let htmlElement: any = document.createElement('sp-system-trace');
  let arkTsChart = new SpArkTsChart(htmlElement);
  let jsCpuProfilerConfig = sqlite.queryJsCpuProfilerConfig;
  let cpuProfilerConfigData = [
    {
      enableCpuProfiler: 1,
      pid: 1553,
      type: -1,
    },
  ];
  jsCpuProfilerConfig.mockResolvedValue(cpuProfilerConfigData);

  let jsCpuProfiler = sqlite.queryJsCpuProfilerData;
  let cpuProfilerData = [
    {
      1: 1,
    },
  ];
  jsCpuProfiler.mockResolvedValue(cpuProfilerData);

  let jsMemory = JsMemory.queryJsMemoryData;
  let jsMemoryData = [{}];
  jsMemory.mockResolvedValue(jsMemoryData);

  it('SpArkTsChart01', function () {
    expect(arkTsChart.initFolder()).not.toBeUndefined();
  });
  it('SpArkTsChart02', function () {
    expect(arkTsChart.initTimelineChart()).not.toBeUndefined();
  });
  it('SpArkTsChart03', function () {
    expect(arkTsChart.initSnapshotChart()).not.toBeUndefined();
  });
});
