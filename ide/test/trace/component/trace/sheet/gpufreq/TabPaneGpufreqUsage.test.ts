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

import { TabPaneGpufreq } from '../../../../../../src/trace/component/trace/sheet/gpufreq/tabPaneGpufreqUsage';
import { LitTable } from '../../../../../../src/base-ui/table/lit-table';

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

const sqlite = require('../../../../../../src/trace/database/sql/Perf.sql');
jest.mock('../../../../../../src/trace/database/sql/Perf.sql');

describe('tabPaneGpufreqUsage Test', () => {
  let tabGpuFreq = new TabPaneGpufreq();
  tabGpuFreq.threadStatesTbl = jest.fn(() => {
    return new LitTable();
  });
  let gpuCountBean = {
    filterId: '12',
    freq: 'freq',
    count: '4',
    value: '45',
    ts: '2255',
    startNS: '4455',
    dur: '58547',
    endTime: '1255858',
    thread: 'thread',
    parentIndex: 0,
    leve: 0,
    name: 'name',
    leftNs: 48555,
    rightNs: 58555
  }
  let threadStatesParam = {
    cpus: [],
    threadIds: [1, 2, 3],
    trackIds: [23, 56, 77],
    funTids: [675, 75],
    heapIds: [11, 223],
    processIds: [114, 23],
    nativeMemory: [],
    leftNs: 12222,
    rightNs: 654233,
    hasFps: false,
    statisticsSelectData: undefined,
  }

  let gpufreq = sqlite.getGpufreqData;
  let gpufreqData = [{
    filterId: '12',
    freq: 'freq',
    count: '4',
    value: '45',
    ts: '2255',
    startNS: '4455',
    dur: '58547',
    endTime: '1255858',
    thread: 'thread',
    parentIndex: 0,
    leve: 0,
    name: 'name'
  }];
  gpufreq.mockResolvedValue(gpufreqData);

  it('tabPaneGpufreqUsageTest01', function () {
    expect(tabGpuFreq.updateValueMap(gpuCountBean, '', {})).toBeUndefined();
  });
});
