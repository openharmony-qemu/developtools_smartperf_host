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

jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});
import { VmTrackerChart } from '../../../../src/trace/component/chart/SpVmTrackerChart';
import { SpChartManager } from '../../../../src/trace/component/chart/SpChartManager';

jest.mock('../../../../src/js-heap/model/DatabaseStruct');
const sqlite = require('../../../../src/trace/database/sql/Dma.sql');
jest.mock('../../../../src/trace/database/sql/Dma.sql');
const memorySqlite = require('../../../../src/trace/database/sql/Memory.sql');
jest.mock('../../../../src/trace/database/sql/Memory.sql');
const smapsSql = require('../../../../src/trace/database/sql/Smaps.sql');
jest.mock('../../../../src/trace/database/sql/Smaps.sql');
const gpuSql = require('../../../../src/trace/database/sql/Gpu.sql');
jest.mock('../../../../src/trace/database/sql/Gpu.sql');
jest.mock('../../../../src/trace/component/chart/SpHiPerf');


// @ts-ignore
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

describe('SpVmTrackerChart Test', () => {
  let dmaSmapsData = sqlite.queryDmaSampsData;
  let smapsDmaData = [
    {
      startNs: 0,
      value: 1024,
      flag: 1,
      ipid: 1,
      expTaskComm: 'delay',
    },
  ];
  dmaSmapsData.mockResolvedValue(smapsDmaData);
  let gpuMemoryData = memorySqlite.queryGpuMemoryData;
  let gpuData = [
    {
      startNs: 0,
      value: 1024,
      ipid: 1,
    },
  ];
  gpuMemoryData.mockResolvedValue(gpuData);
  let smapsExits = smapsSql.querySmapsExits;
  let exits = [
    {
      event_name: 'trace_smaps',
    },
  ];
  smapsExits.mockResolvedValue(exits);
  let vmTrackerShmData = memorySqlite.queryVmTrackerShmData;
  let shmData = [
    {
      startNs: 0,
      value: 1024,
    },
  ];
  vmTrackerShmData.mockResolvedValue(shmData);
  let purgeableProcessData = memorySqlite.queryPurgeableProcessData;
  let processData = [
    {
      startNs: 0,
      value: 1024,
    },
  ];
  purgeableProcessData.mockResolvedValue(processData);
  let gpuGlData = gpuSql.queryGpuData;
  let glData = [
    {
      startNs: 0,
      value: 1024,
    },
  ];
  gpuGlData.mockResolvedValue(glData);
  let gpuTotalData = gpuSql.queryGpuTotalData;
  let totalData = [
    {
      startNs: 0,
      value: 1024,
    },
  ];
  gpuTotalData.mockResolvedValue(totalData);
  let gpuTotalType = gpuSql.queryGpuTotalType;
  let totalType = [
    {
      id: 1,
      data: 'delay',
    },
  ];
  gpuTotalType.mockResolvedValue(totalType);
  let gpuWindowData = gpuSql.queryGpuWindowData;
  let windowsData = [
    {
      startNs: 0,
      value: 1024,
    },
  ];
  gpuWindowData.mockResolvedValue(windowsData);
  let gpuWindowType = gpuSql.queryGpuWindowType;
  let windowsType = [
    {
      id: 1,
      data: 'delay',
      pid: 1,
    },
  ];
  gpuWindowType.mockResolvedValue(windowsType);
  let htmlElement: any = document.createElement('sp-system-trace');
  let manager = new SpChartManager(htmlElement);
  let spVmTrackerChart = new VmTrackerChart(htmlElement);
  let memoryData = [
    {
      startNs: 0,
      endNs: 0,
      dur: 0,
      name: '',
      textWidth: 0,
      value: 0,
      type: '',
    },
  ];
  it('SpVmTrackerChart01', function () {
    spVmTrackerChart.initVmTrackerFolder();
    expect(spVmTrackerChart).toBeDefined();
  });
  it('SpVmTrackerChart02', function () {
    expect(spVmTrackerChart.getSmapsKeyName('USS')).toBeDefined();
  });
  it('SpVmTrackerChart07', function () {
    expect(spVmTrackerChart.getSmapsKeyName('RSS')).toBeDefined();
  });
  it('SpVmTrackerChart08', function () {
    expect(spVmTrackerChart.getSmapsKeyName('')).toBeDefined();
  });
  it('SpVmTrackerChart03', function () {
    expect(spVmTrackerChart.initTraceRow('dirty', 'smaps', 'VmTracker')).toBeDefined();
  });
  it('SpVmTrackerChart04', function () {
    expect(spVmTrackerChart.initPurgeablePin()).toBeDefined();
  });
  it('SpVmTrackerChart05', function () {
    expect(spVmTrackerChart.initPurgeableTotal()).toBeDefined();
  });
  it('SpVmTrackerChart06', function () {
    expect(spVmTrackerChart.showTip).toBeDefined();
  });
  it('SpVmTrackerChart09', function () {
    expect(spVmTrackerChart.initGpuFolder()).toBeDefined();
  });
  it('SpVmTrackerChart09', function () {
    expect(spVmTrackerChart.initSMapsFolder()).toBeDefined();
  });
  it('SpVmTrackerChart10', function () {
    expect(spVmTrackerChart.initVmTrackerFolder()).toBeDefined();
  });
  it('SpVmTrackerChart11', function () {
    expect(spVmTrackerChart.initDmaRow()).toBeDefined();
  });
  it('SpVmTrackerChart12', function () {
    expect(spVmTrackerChart.initSmapsRows('Swapped')).toBeDefined();
  });
  it('SpVmTrackerChart13', function () {
    expect(spVmTrackerChart.initShmRows()).toBeDefined();
  });
  it('SpVmTrackerChart14', function () {
    expect(spVmTrackerChart.initGpuMemoryRow(memoryData)).toBeDefined();
  });
  it('SpVmTrackerChart15', function () {
    expect(spVmTrackerChart.addGpuGLRow(memoryData)).toBeDefined();
  });
  it('SpVmTrackerChart16', function () {
    expect(spVmTrackerChart.addGpuTotalRow()).toBeDefined();
  });
});
