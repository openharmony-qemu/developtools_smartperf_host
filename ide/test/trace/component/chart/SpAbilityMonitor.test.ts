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
import { SpAbilityMonitorChart } from '../../../../src/trace/component/chart/SpAbilityMonitorChart';
import '../../../../src/trace/component/chart/SpAbilityMonitorChart';
const sqlit = require('../../../../src/trace/database/sql/Ability.sql');
jest.mock('../../../../src/trace/database/sql/Ability.sql');
const MemorySqlite = require('../../../../src/trace/database/sql/Memory.sql');
jest.mock('../../../../src/trace/database/sql/Memory.sql');
const sqlite = require('../../../../src/trace/database/sql/SqlLite.sql');
jest.mock('../../../../src/trace/database/sql/SqlLite.sql');
jest.mock('../../../../src/trace/component/chart/SpNativeMemoryChart', () => {
  return {};
});
const intersectionObserverMock = () => ({
  observe: () => null,
});
jest.mock('../../../../src/js-heap/model/DatabaseStruct');
jest.mock('../../../../src/trace/component/trace/base/TraceSheet', () => {
  return true;
});
window.IntersectionObserver = jest.fn().mockImplementation(intersectionObserverMock);
// @ts-ignore
window.ResizeObserver = window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
describe('SpAbilityMonitorChart Test', () => {
  let MockqueryAbilityExits = sqlit.queryAbilityExits;
  MockqueryAbilityExits.mockResolvedValue([
    {
      event_name: 'trace_cpu_usage',
      stat_type: 'received',
      count: 1,
    },
    {
      event_name: 'sys_memory',
      stat_type: 'received',
      count: 1,
    },
    {
      event_name: 'trace_diskio',
      stat_type: 'received',
      count: 1,
    },
    {
      event_name: 'trace_diskio',
      stat_type: 'received',
      count: 1,
    },
  ]);
  let cpudata = sqlit.queryCPuAbilityMaxData;
  cpudata.mockResolvedValue([
    {
      totalLoad: 1,
      userLoad: 1,
      systemLoad: 1,
    },
  ]);
  let memorydata = MemorySqlite.queryMemoryMaxData;
  memorydata.mockResolvedValue([
    {
      maxValue: 1,
      filter_id: 1,
    },
  ]);
  let queryDiskIo = sqlite.queryDiskIoMaxData;
  queryDiskIo.mockResolvedValue([
    {
      bytesRead: 1,
      bytesWrite: 1,
      readOps: 1,
      writeOps: 1,
    },
  ]);

  let netWorkDiskIo = sqlite.queryNetWorkMaxData;
  netWorkDiskIo.mockResolvedValue([
    {
      maxIn: 1,
      maxOut: 1,
      maxPacketIn: 1,
      maxPacketOut: 1,
    },
  ]);
  let queryDmaAbilityData = sqlit.queryDmaAbilityData;
  queryDmaAbilityData.mockResolvedValue([
    {
      startNs: 1,
      value: 1,
      flag: 1,
      ipid: 1,
      expTaskComm: '',
    },
  ]);
  let queryGpuMemoryAbilityData = sqlit.queryGpuMemoryAbilityData;
  queryGpuMemoryAbilityData.mockResolvedValue([
    {
      startNs: 1,
      value: 1,
    },
  ]);
  let queryPurgeableSysData = sqlit.queryPurgeableSysData;
  queryPurgeableSysData.mockResolvedValue([
    {
      startNs: 1,
      value: 1,
    },
  ]);

  let purgeableSysData = sqlit.queryPurgeableSysData;
  purgeableSysData.mockResolvedValue([
    {
      name: 'test',
      startNs: 15255,
      value: 0,
    },
  ]);

  let dmaAbilityData = sqlit.queryDmaAbilityData;
  dmaAbilityData.mockResolvedValue([
    {
      startNs: 15255,
      value: 2,
      expTaskComm: 'allocator_host',
      flag: 0,
      name: 'test',
    },
  ]);

  let gpuMemoryAbilityData = sqlit.queryGpuMemoryAbilityData;
  gpuMemoryAbilityData.mockResolvedValue([
    {
      name: 'test',
      startNs: 15255,
      value: 0,
    },
  ]);
  it('SpAbilityMonitorChart01', function () {
    let htmlElement: any = document.createElement('sp-system-trace');
    let spAbilityMonitor = new SpAbilityMonitorChart(htmlElement);
    spAbilityMonitor.init();
    expect(spAbilityMonitor).toBeDefined();
  });
});
