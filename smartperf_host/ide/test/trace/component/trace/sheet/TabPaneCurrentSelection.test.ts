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

import { SpApplication } from '../../../../../src/trace/SpApplication';
import { SpSystemTrace } from '../../../../../src/trace/component/SpSystemTrace';
import {
  getTimeString,
  JankTreeNode,
  TabPaneCurrentSelection,
  ThreadTreeNode,
} from '../../../../../src/trace/component/trace/sheet/TabPaneCurrentSelection';
import { AllAppStartupStruct } from '../../../../../src/trace/database/ui-worker/ProcedureWorkerAllAppStartup';
import { ClockStruct } from '../../../../../src/trace/database/ui-worker/ProcedureWorkerClock';
import { DmaFenceStruct } from '../../../../../src/trace/database/ui-worker/ProcedureWorkerDmaFence';
import { FuncStruct } from '../../../../../src/trace/database/ui-worker/ProcedureWorkerFunc';
import { HangStruct } from '../../../../../src/trace/database/ui-worker/ProcedureWorkerHang';
import { JankStruct } from '../../../../../src/trace/database/ui-worker/ProcedureWorkerJank';
import { PerfToolStruct } from '../../../../../src/trace/database/ui-worker/ProcedureWorkerPerfTool';
import { SoStruct } from '../../../../../src/trace/database/ui-worker/ProcedureWorkerSoInit';
import { ThreadStruct } from '../../../../../src/trace/database/ui-worker/ProcedureWorkerThread';
import { XpowerStruct } from '../../../../../src/trace/database/ui-worker/ProcedureWorkerXpower';
import { XpowerAppDetailStruct } from '../../../../../src/trace/database/ui-worker/ProcedureWorkerXpowerAppDetail';
import { XpowerWifiStruct } from '../../../../../src/trace/database/ui-worker/ProcedureWorkerXpowerWifi';
import { CpuStruct, WakeupBean } from '../../../../../src/trace/database/ui-worker/cpu/ProcedureWorkerCPU';
const processSqlite = require('../../../../../src/trace/database/sql/ProcessThread.sql');
jest.mock('../../../../../src/trace/database/sql/ProcessThread.sql');
const sqlite = require('../../../../../src/trace/database/sql/SqlLite.sql');
jest.mock('../../../../../src/trace/database/sql/SqlLite.sql');
const gpuSqlite = require('../../../../../src/trace/database/sql/Gpu.sql');
jest.mock('../../../../../src/trace/database/sql/Gpu.sql');
const clockSqlite = require('../../../../../src/trace/database/sql/Clock.sql');
jest.mock('../../../../../src/trace/database/sql/Clock.sql');
const cpuSqlite = require('../../../../../src/trace/database/sql/Cpu.sql');
jest.mock('../../../../../src/trace/database/sql/Cpu.sql');
jest.mock('../../../../../src/js-heap/model/DatabaseStruct', () => {
  return {};
});
jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
global.caches = {
  match: jest.fn(),
} as any;
describe('TabPaneCurrentSelection Test', () => {
  let tabPaneCurrentSelection = new TabPaneCurrentSelection();
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  let context = canvas.getContext('2d');

  it('TabPaneCurrentSelectionTest01', function () {
    expect(tabPaneCurrentSelection.getDate(1732017213)).not.toBeUndefined;
  });

  it('TabPaneCurrentSelectionTest02', function () {
    let memData = [
      {
        trackId: 100,
        processName: 'processName',
        pid: 11,
        upid: 1,
        trackName: 'trackName',
        type: 'type',
        track_id: 'track_id',
        value: 111,
        startTime: 0,
        duration: 1000,
        maxValue: 4000,
        delta: 2,
      },
    ];
    expect(tabPaneCurrentSelection.setMemData(memData)).toBeUndefined;
  });

  it('TabPaneCurrentSelectionTest03', function () {
    let result = getTimeString(3600_000_000_002);
    expect(result).toBe('1h 2ns ');
  });

  it('TabPaneCurrentSelectionTest04', function () {
    let result = getTimeString(60000000001);
    expect(result).toBe('1m 1ns ');
  });

  it('TabPaneCurrentSelectionTest05', function () {
    let result = getTimeString(1000000001);
    expect(result).toBe('1s 1ns ');
  });

  it('TabPaneCurrentSelectionTest06', function () {
    let result = getTimeString(1000001);
    expect(result).toBe('1ms 1ns ');
  });

  it('TabPaneCurrentSelectionTest07', function () {
    let result = getTimeString(1001);
    expect(result).toBe('1μs 1ns ');
  });

  it('TabPaneCurrentSelectionTest08', function () {
    let result = getTimeString(101);
    expect(result).toBe('101ns ');
  });

  let queryRunnableTimeByRunning = processSqlite.queryRunnableTimeByRunning;
  let queryRunnableTimeByRunningData = [
    {
      ts: 5564,
    },
    {
      ts: 764,
    },
  ];
  queryRunnableTimeByRunning.mockResolvedValue(queryRunnableTimeByRunningData);

  let queryThreadWakeUpFrom = processSqlite.queryThreadWakeUpFrom;
  let queryThreadWakeUpFromData = [
    {
      ts: 5564,
      tid: 88,
      itid: 48,
      pid: 756,
      cpu: 4,
      dur: 8456,
      argSetID: 5,
    },
  ];
  queryThreadWakeUpFrom.mockResolvedValue(queryThreadWakeUpFromData);

  let queryRealTime = clockSqlite.queryRealTime;
  let queryRealTimeData = [
    {
      ts: 5564,
      name: 'ds5f',
    },
    {
      ts: 5584,
      name: 'ddsdd',
    },
  ];
  queryRealTime.mockResolvedValue(queryRealTimeData);

  let queryThreadStateArgs = processSqlite.queryThreadStateArgs;
  let queryThreadStateArgsData = [
    {
      argset: 5,
      keyName: 'f5',
      id: 985,
      desc: 'dg4d',
      strValue: 'dsfsfdf',
    },
  ];
  queryThreadStateArgs.mockResolvedValue(queryThreadStateArgsData);

  it('TabPaneCurrentSelectionTest09', function () {
    tabPaneCurrentSelection.setCpuData = jest.fn(() => true);
    tabPaneCurrentSelection.data = jest.fn(() => true);
    expect(tabPaneCurrentSelection.data).toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest10', function () {
    let cpuData = [
      {
        cpu: 2,
        dur: 2,
        end_state: 'string',
        id: 14,
        name: 'name',
        priority: 11,
        processCmdLine: 'processCmdLine',
        processId: 1115,
        processName: 'processName',
        schedId: 221,
        startTime: 5,
        tid: 1081,
        type: 'type',
      },
    ];
    expect(tabPaneCurrentSelection.setCpuData(cpuData, undefined, 1)).toBeTruthy();
  });

  it('TabPaneCurrentSelectionTest11', function () {
    expect(tabPaneCurrentSelection.initCanvas()).not.toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest12', function () {
    expect(tabPaneCurrentSelection.transferString('')).toBe('');
  });

  it('TabPaneCurrentSelectionTest13', function () {
    expect(tabPaneCurrentSelection.drawRight(null, null)).toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest14', function () {
    let jankData = {
      id: 10,
      ts: 25415,
      dur: 1200,
      name: '1523',
      depth: 1,
      jank_tag: true,
      cmdline: 'com.test',
      type: '0',
      pid: 20,
      frame_type: 'app',
      app_dur: 110,
      dst_slice: 488,
    };
    let result = tabPaneCurrentSelection.setJankData(jankData, undefined, 1);
    expect(result).toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest15', function () {
    let jankDataRender = {
      id: 22,
      ts: 254152,
      dur: 1202,
      name: '1583',
      depth: 1,
      jank_tag: true,
      cmdline: 'render.test',
      type: '0',
      pid: 22,
      frame_type: 'render_service',
      src_slice: '525',
      rs_ts: 2562,
      rs_vsync: '2562',
      rs_dur: 1528,
      rs_pid: 1252,
      rs_name: 'name',
      gpu_dur: 2568,
    };
    let result = tabPaneCurrentSelection.setJankData(jankDataRender, undefined, 1);
    expect(result).toBeUndefined();
  });

  let irqData = new SoStruct();
  irqData.id = 25;
  irqData.startTs = 1526;
  irqData.soName = 'test';
  irqData.dur = 125;
  irqData.tid = 500;

  it('TabPaneCurrentSelectionTest16', function () {
    let argsetTest = processSqlite.queryBinderArgsByArgset;
    let argsetData = [
      {
        argset: 12,
        keyName: 'test',
        id: 123,
        desc: 'desc',
        strValue: 'value',
      },
      {
        argset: 11,
        keyName: 'test',
        id: 113,
        desc: 'desc',
        strValue: 'value',
      },
    ];
    argsetTest.mockResolvedValue(argsetData);
    let result = tabPaneCurrentSelection.setIrqData(irqData);
    expect(result).toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest17', function () {
    let result = tabPaneCurrentSelection.setStartupData(irqData, 1, []);
    expect(result).toBeUndefined();
  });
  it('TabPaneCurrentSelectionTest18', function () {
    tabPaneCurrentSelection.startIconClickEvent = jest.fn();
    let result = tabPaneCurrentSelection.setStaticInitData(irqData, () => {});
    expect(result).toBeUndefined();
  });
  it('TabPaneCurrentSelectionTest19', function () {
    let list: never[] = [];
    let data = [
      {
        jank_tag: 1,
        frame_type: 'render_service',
      },
    ];
    let result = tabPaneCurrentSelection.setJankType(data, list);
    expect(result).toBeUndefined();
  });
  it('TabPaneCurrentSelectionTest20', function () {
    let queryFpsSourceList = sqlite.queryFpsSourceList;
    let queryFpsSourceListData = [
      {
        tid: 5564,
        dur: 854,
        depth: 84,
        ts: 998,
        name: 'ds8f',
      },
    ];
    queryFpsSourceList.mockResolvedValue(queryFpsSourceListData);

    let data = [
      {
        startTime: 22,
      },
    ];
    let result = tabPaneCurrentSelection.setFrameAnimationData(data);
    expect(result).toBeTruthy();
  });

  it('TabPaneCurrentSelectionTest21', function () {
    let data = new CpuStruct();
    data.id = 555;
    data.startTime = 84;
    data.tid = 84;
    let result = tabPaneCurrentSelection.queryCPUWakeUpFromData(data);
    expect(result).toBeTruthy();
  });

  it('TabPaneCurrentSelectionTest22', function () {
    let data = {
      argsetid: 1,
      depth: 2,
      dur: 50,
      funName: 'efs',
      id: 8,
      callid: 8,
      is_main_thread: 74,
    };
    expect(tabPaneCurrentSelection.handleNonBinder(data, [], 'sfe', 'effe')).toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest23', function () {
    expect(tabPaneCurrentSelection.initElements()).toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest24', function () {
    let data = [
      {
        thread: 'fds',
        wakeupTime: 54,
        cpu: 85,
        dur: 848,
        process: 'fdsf',
        pid: 847,
        tid: 48,
        schedulingDesc: 'sdf',
        ts: 774,
        itid: 87,
        state: 'sfd',
        argSetID: 48785,
        schedulingLatency: 747,
      },
    ];
    let queryWakeupListPriority = cpuSqlite.queryWakeupListPriority;
    let queryWakeupListPriorityData = [
      {
        itid: 5564,
        priority: 854,
        dur: 84,
        ts: 998,
        cpu: 'ds8f',
      },
    ];
    queryWakeupListPriority.mockResolvedValue(queryWakeupListPriorityData);
    expect(tabPaneCurrentSelection.showWakeupListTableData(data)).toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest24', function () {
    expect(tabPaneCurrentSelection.getRealTimeStr(74512)).not.toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest25', function () {
    let data = new ClockStruct();
    tabPaneCurrentSelection.initElements();
    expect(tabPaneCurrentSelection.setClockData(data)).not.toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest26', function () {
    let data = new XpowerStruct();
    tabPaneCurrentSelection.initElements();
    expect(tabPaneCurrentSelection.setXpowerData(data)).not.toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest27', function () {
    let data = new XpowerAppDetailStruct();
    tabPaneCurrentSelection.initElements();
    expect(tabPaneCurrentSelection.setXpowerDisplayData(data)).not.toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest28', function () {
    let data = new XpowerWifiStruct();
    tabPaneCurrentSelection.initElements();
    expect(tabPaneCurrentSelection.setXpowerWifiBytesData(data)).not.toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest29', function () {
    let data = new XpowerWifiStruct();
    tabPaneCurrentSelection.initElements();
    expect(tabPaneCurrentSelection.setXpowerWifiPacketsData(data)).not.toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest30', function () {
    let data = new CpuStruct();
    data.name = 'fd0';
    data.pid = 9;
    data.ts = 9366;
    data.dur = 9366;
    tabPaneCurrentSelection.initElements();
    expect(
      tabPaneCurrentSelection.setCpuData(
        data,
        (data: WakeupBean | null) => {}
      )
    ).not.toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest31', function () {
    let data = new PerfToolStruct();
    tabPaneCurrentSelection.initElements();
    expect(tabPaneCurrentSelection.setPerfToolsData(data)).toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest32', function () {
    let data = new ThreadStruct();
    tabPaneCurrentSelection.initElements();
    expect(
      tabPaneCurrentSelection.setThreadData(
        data,
        () => {},
        () => {},
        () => {}
      )
    ).not.toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest33', function () {
    let data = new ThreadStruct();
    tabPaneCurrentSelection.initElements();
    expect(tabPaneCurrentSelection.sortByNearData([], data, [])).not.toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest34', function () {
    let fromBean = new WakeupBean();
    let wakeUps = [fromBean];
    tabPaneCurrentSelection.initElements();
    expect(tabPaneCurrentSelection.setWakeupData(fromBean, wakeUps, [])).toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest35', function () {
    let data = new JankStruct();
    data.rs_name = 'fd0';
    data.rs_pid = 9;
    data.rs_ts = 9366;
    data.rs_dur = 9366;
    let list = [];
    tabPaneCurrentSelection.initElements();
    expect(tabPaneCurrentSelection.addRenderServiceFrameDetails(data, list)).toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest36', function () {
    let data = new JankStruct();
    data.name = 'fd0';
    data.rs_pid = 9;
    data.rs_ts = 9366;
    data.rs_dur = 9366;
    data.cmdline = 'ef';
    let list = [];
    tabPaneCurrentSelection.initElements();
    expect(tabPaneCurrentSelection.addFollowingDetails(list, data)).toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest37', function () {
    let data = new JankStruct();
    data.name = 'fd0';
    data.pid = 9;
    data.ts = 9366;
    data.dur = 9366;
    data.cmdline = 'ef';
    let list = [];
    tabPaneCurrentSelection.initElements();
    expect(tabPaneCurrentSelection.addAppFrameDetails(data, list)).toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest38', function () {
    let data = new JankStruct();
    data.name = 'fd0';
    data.pid = 9;
    data.ts = 9366;
    data.dur = 9366;
    data.cmdline = 'ef';
    let list = [];
    tabPaneCurrentSelection.initElements();
    expect(tabPaneCurrentSelection.handleAppJank(list, data, [], () => {}, undefined)).toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest39', function () {
    let data = new AllAppStartupStruct();
    data.dur = 9366;
    tabPaneCurrentSelection.initElements();
    expect(tabPaneCurrentSelection.setAllStartupData(data, () => {})).toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest40', function () {
    let data = new FuncStruct();
    data.name = 'fd0';
    data.pid = 9;
    data.ts = 9366;
    data.dur = 9366;
    data.cmdline = 'ef';
    let list = [];
    tabPaneCurrentSelection.initElements();
    expect(tabPaneCurrentSelection.handleBinder(data, list, [], 'dfs', () => {}, 'fds')).toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest41', function () {
    let data = new DmaFenceStruct();
    data.dur = 9366;
    let list = [];
    tabPaneCurrentSelection.initElements();
    expect(tabPaneCurrentSelection.setDmaFenceData(data, list)).toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest42', function () {
    let data = new JankStruct();
    data.dur = 9366;
    let list = [];
    tabPaneCurrentSelection.initElements();
    expect(tabPaneCurrentSelection.setJankType(data, list)).toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest43', function () {
    let data = new WakeupBean();
    data.dur = 9566;
    let wakeup = new WakeupBean();
    tabPaneCurrentSelection.drawVerticalLine = jest.fn(() => {});
    tabPaneCurrentSelection.initElements();
    let canvas = tabPaneCurrentSelection.initCanvas();
    expect(tabPaneCurrentSelection.drawRight(canvas, wakeup)).toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest44', function () {
    let data = new JankStruct();
    data.dur = 9566;
    let jankTreeNode = new JankTreeNode('fs', 5, 's');
    tabPaneCurrentSelection.initElements();
    expect(
      tabPaneCurrentSelection.handleRenderServiceJank(
        data,
        [],
        [jankTreeNode],
        () => {},
        () => {}
      )
    ).toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest45', function () {
    let data = new JankStruct();
    data.dur = 9366;
    data.jank_tag = 1;
    data.frameType = 'render_service';
    let list = [];
    tabPaneCurrentSelection.initElements();
    expect(tabPaneCurrentSelection.setJankType(data, list)).toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest46', function () {
    let data = new JankStruct();
    data.dur = 9366;
    data.jank_tag = 1;
    data.frameType = 'app';
    let list = [];
    tabPaneCurrentSelection.initElements();
    expect(tabPaneCurrentSelection.setJankType(data, list)).toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest47', function () {
    let data = new JankStruct();
    data.dur = 9366;
    data.jank_tag = 1;
    data.frameType = 'frameTime';
    let list = [];
    tabPaneCurrentSelection.initElements();
    expect(tabPaneCurrentSelection.setJankType(data, list)).toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest48', function () {
    let data = new JankStruct();
    data.dur = 9366;
    data.jank_tag = 3;
    data.frameType = 'frameTime';
    let list = [];
    tabPaneCurrentSelection.initElements();
    expect(tabPaneCurrentSelection.setJankType(data, list)).toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest49', function () {
    expect(tabPaneCurrentSelection.transferString('frrfsdsd')).not.toBeUndefined();
  });

  it('TabPaneCurrentSelectionTest50', function () {
    let threadTreeNode = new ThreadTreeNode(5, 9, 1000);
    expect(threadTreeNode.tid).toEqual(5);
  });
});
