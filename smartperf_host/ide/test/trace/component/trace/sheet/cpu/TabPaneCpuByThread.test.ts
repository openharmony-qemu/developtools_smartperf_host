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

import { CpuAndIrqBean } from '../../../../../../src/trace/component/trace/sheet/cpu/CpuAndIrqBean';
import { TabPaneCpuByThread } from '../../../../../../src/trace/component/trace/sheet/cpu/TabPaneCpuByThread';

window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

const sqlit = require('../../../../../../src/trace/database/sql/Cpu.sql');
jest.mock('../../../../../../src/trace/database/sql/Cpu.sql');
jest.mock('../../../../../../src/trace/bean/NativeHook', () => {
  return {};
});

describe('TabPaneCpuByThread Test', () => {
  let tabPaneCpuByThread = new TabPaneCpuByThread();
  tabPaneCpuByThread.cpuByThreadTbl!.injectColumns = jest.fn(() => true);
  let val = [
    {
      leftNs: 11,
      rightNs: 34,
      state: true,
      processId: 3,
      threadId: 1,
      traceId: 0,
      cpus: '0, 1, 2',
      isJumpPage: 0,
      currentId: 0,
    },
  ];
  let cpuAndIrqBean = new CpuAndIrqBean();
  it('TabPaneCpuByThreadTest01', function () {
    expect(
      tabPaneCpuByThread.sortByColumn({
        key: 'number',
        sort: () => {},
      })
    ).toBeUndefined();
  });

  it('TabPaneCpuByThreadTest02', function () {
    expect(
      tabPaneCpuByThread.sortByColumn({
        key: 'pid' || 'wallDuration' || 'avgDuration' || 'occurrences',
      })
    ).toBeUndefined();
  });

  it('TabPaneCpuByThreadTest03', function () {
    let mockgetTabCpuByThread = sqlit.getTabCpuByThread;
    mockgetTabCpuByThread.mockResolvedValue([
      { process: 'test', wallDuration: 10, occurrences: 10, thread: '' },
      { process: 'test2', wallDuration: 11, occurrences: 11, thread: '' },
    ]);
    let a = { rightNs: 1, cpus: [11, 12, 13] };
    expect((tabPaneCpuByThread.data = a)).toBeTruthy();
  });

  it('TabPaneCpuByThreadTest04', function () {
    let mockgetTabCpuByThread = sqlit.getTabCpuByThread;
    mockgetTabCpuByThread.mockResolvedValue([]);
    let a = { rightNs: 1, cpus: [11, 12, 13] };
    expect((tabPaneCpuByThread.data = a)).toBeTruthy();
  });
  it('TabPaneCpuByThreadTest06', function () {
    let finalResultBean = [
      {
        dur: 0,
        cat: '',
        cpu: 0,
        occurrences: 1,
        pid: '[NULL]',
        tid: '[NULL]',
      },
    ];
    expect(tabPaneCpuByThread.groupByCpu([cpuAndIrqBean])).toStrictEqual(finalResultBean);
    expect(tabPaneCpuByThread.cpuByIrq([cpuAndIrqBean])).toStrictEqual(finalResultBean);
  });
  it('TabPaneCpuByThreadTest07', function () {
    expect(tabPaneCpuByThread.findMaxPriority([cpuAndIrqBean])).toStrictEqual(cpuAndIrqBean);
    expect(tabPaneCpuByThread.findMaxPriority([cpuAndIrqBean])).toStrictEqual(cpuAndIrqBean);
  });
  it('TabPaneCpuByThreadTest08', function () {
    expect(tabPaneCpuByThread.reSortByColum('process', 0)).toBeUndefined();
    expect(tabPaneCpuByThread.reSortByColum('thread', 1)).toBeUndefined();
  });
  it('TabPaneCpuByThreadTest09', function () {
    let e = [
      {
        pis: 0,
        tid: 0,
        cpu: 0,
        wallDuration: 100,
        occurrences: 20,
      },
    ];
    let cpuByThreadValue = [
      {
        cpus: [0, 1],
      },
    ];
    let cpuByThreadObject = {
      cpu0: 0,
      cpu0TimeStr: '0',
      cpu0Ratio: '0',
    };
    expect(tabPaneCpuByThread.updateCpuValues(e, cpuByThreadValue, cpuByThreadObject)).toBeUndefined();
  });
  it('TabPaneCpuByThreadTest10', function () {
    expect(tabPaneCpuByThread.getTableColumns([0, 1, 2])).not.toBeUndefined();
  });
});
