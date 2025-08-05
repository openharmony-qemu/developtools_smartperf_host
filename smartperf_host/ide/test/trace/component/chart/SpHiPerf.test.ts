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

import { SpHiPerf } from '../../../../src/trace/component/chart/SpHiPerf';
jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});
import { TraceRow } from '../../../../src/trace/component/trace/base/TraceRow';
import { HiPerfStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerCommon';
import { HiPerfCallChartStruct } from '../../../../src/trace/database/ui-worker/hiperf/ProcedureWorkerHiPerfCallChart';
jest.mock('../../../../src/js-heap/model/DatabaseStruct');
const sqlit = require('../../../../src/trace/database/sql/Perf.sql');
jest.mock('../../../../src/trace/database/sql/Perf.sql');
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../src/trace/component/chart/PerfDataQuery', () => {
  return {};
});
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

describe('SpHiPerf Test', () => {
  let perfDataQuery = sqlit.perfDataQuery;
  let queryPerfCmdline = sqlit.queryPerfCmdline;
  queryPerfCmdline.mockResolvedValue([
    {
      report_value:
        'hiperf record --control prepare -o /data/local/tmp…e sched:sched_waking -a -s dwarf -f 1000 --offcpu',
    },
  ]);

  let queryPerfThread = sqlit.queryPerfThread;
  queryPerfThread.mockResolvedValue([
    {
      tid: 11,
      threadName: 'ksoftirqd/0',
      pid: 11,
      processName: 'ksoftirqd/0',
    },
    {
      tid: 1,
      threadName: 'threadName111',
      pid: 1,
      processName: 'processNam111e',
    },
  ]);

  let queryHiPerfEventList = sqlit.queryHiPerfEventList;
  queryHiPerfEventList.mockResolvedValue([
    {
      id: 0,
      report_value: 'sched:sched_waking',
    },
    {
      id: 1,
      report_value: 'sched:sched_switch',
    },
  ]);

  let queryHiPerfCpuMergeData2 = sqlit.queryHiPerfCpuMergeData2;
  queryHiPerfCpuMergeData2.mockResolvedValue([
    {
      id: 0,
      callchain_id: 1,
      timestamp: 3468360924674,
      thread_id: 2469,
      event_count: 1,
      event_type_id: 0,
      timestamp_trace: 3468360965799,
      cpu_id: 2,
      thread_state: 'Running',
      startNS: 0,
    },
    {
      id: 4,
      callchain_id: 1,
      timestamp: 3468361000799,
      thread_id: 2469,
      event_count: 1,
      event_type_id: 0,
      timestamp_trace: 3468361041924,
      cpu_id: 2,
      thread_state: 'Running',
      startNS: 76125,
    },
    {
      id: 8,
      callchain_id: 1,
      timestamp: 3468361045716,
      thread_id: 2469,
      event_count: 1,
      event_type_id: 0,
      timestamp_trace: 3468361086841,
      cpu_id: 2,
      thread_state: 'Running',
      startNS: 121042,
    },
    {
      id: 9,
      callchain_id: 4,
      timestamp: 3468361054466,
      thread_id: 1336,
      event_count: 1,
      event_type_id: 1,
      timestamp_trace: 3468361095591,
      cpu_id: 3,
      thread_state: 'Suspend',
      startNS: 129792,
    },
  ]);
  let getPerfEventType = sqlit.queryPerfEventType;
  getPerfEventType.mockResolvedValue([
    {
      id: 1,
      report_value: 'sched:sched_waking',
    },
  ]);
  let htmlElement: any = document.createElement('sp-system-trace');
  let spHiPerf = new SpHiPerf(htmlElement);
  it('SpHiPerf01', function () {
    spHiPerf.init();
    expect(spHiPerf).toBeDefined();
  });
  it('SpHiPerf02', function () {
    let cpuData = [
      {
        cpu_id: 0,
      },
    ];
    let threadData = [
      {
        tid: 11,
        threadName: 'ksoftirqd/0',
        pid: 11,
        processName: 'ksoftirqd/0',
      },
    ];
    expect(spHiPerf.setCallTotalRow(new TraceRow<any>(), cpuData, threadData)).not.toBeUndefined();
  });
  it('SpHiPerf03', function () {
    let traceRow = new TraceRow<HiPerfCallChartStruct>();
    let cpuData = [
      {
        cpu_id: 0,
      },
      {
        cpu_id: 1,
      },
    ];
    let map = new Map();
    expect(spHiPerf.setCallChartRowSetting(traceRow, cpuData, map)).toBeUndefined();
  });
  it('SpHiPerf04', function () {
    let traceRow = new TraceRow<HiPerfStruct>();
    let arr = [
      {
        tid: 0,
        pid: 1,
        threadName: 'threadName',
        processName: 'processName',
      },
    ];
    expect(spHiPerf.addHiPerfThreadRow(arr, traceRow)).toBeUndefined();
  });
  it('SpHiPerf05', function () {
    let traceRow = new TraceRow<HiPerfStruct>();
    expect(spHiPerf.resetChartData(traceRow)).toBeUndefined();
  });
  it('SpHiPerf06', function () {
    expect(spHiPerf.resetAllChartData()).toBeUndefined();
  });
});
