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

import { BaseStruct } from '../../../../src/trace/bean/BaseStruct';
import { SpXpowerChart, convertHoverValue, convertTitle } from '../../../../src/trace/component/chart/SpXpowerChart';
import { TraceRow } from '../../../../src/trace/component/trace/base/TraceRow';
import { XpowerStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerXpower';
import { XpowerAppDetailStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerXpowerAppDetail';
import { XpowerGpuFreqStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerXpowerGpuFreq';
import { XpowerGpuFreqCountStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerXpowerGpuFreqCount';
import { XpowerStatisticStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerXpowerStatistic';
import { XpowerThreadCountStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerXpowerThreadCount';
import { XpowerThreadInfoStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerXpowerThreadInfo';
import { XpowerWifiStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerXpowerWifi';
jest.mock('../../../../src/js-heap/model/DatabaseStruct');
const XpowerSql = require('../../../../src/trace/database/sql/Xpower.sql');
jest.mock('../../../../src/trace/database/sql/Xpower.sql');
jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
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
describe('spXpowerChart Test', () => {
  let htmlElement: any = document.createElement('sp-system-trace');
  let spXpowerChart = new SpXpowerChart(htmlElement);
  let xPowerMeasureData = XpowerSql.queryXpowerMeasureData;
  xPowerMeasureData.mockResolvedValue([
    {
      name: 'Battery.Capacity',
    },
    {
      name: 'Battery.Level',
    },
    {
      name: 'Battery.GasGauge',
    },
    {
      name: 'Battery.Screen',
    },
    {
      name: 'Battery.RealCurrent',
    },
    {
      name: 'ThermalReport.ShellTemp',
    },
    {
      name: 'ThermalReport.ThermalLevel',
    },
  ]);
  xPowerMeasureData.mockResolvedValue([]);
  let xPowerData = XpowerSql.queryXpowerData;
  xPowerData.mockResolvedValue([
    {
      name: 'ThermalReport.ShellTemp',
      num: 10,
      maxValue: 100,
      minValue: 10,
    },
    {
      name: 'Battery.RealCurrent',
      num: 20,
      maxValue: 200,
      minValue: 20,
    },
  ]);
  xPowerData.mockResolvedValue([]);
  let traceConfig = XpowerSql.queryTraceConfig;
  traceConfig.mockResolvedValue([
    {
      traceSource: 'xpower_config',
      key: 'bundleName',
      value: 'com.sina.weibo.stage',
    },
    {
      traceSource: 'xpower_config',
      key: 'bundleName',
      value: 'com.sina.weibo.stage',
    },
  ]);

  let xPowerComponentTop = XpowerSql.queryXpowerComponentTop;
  xPowerComponentTop.mockResolvedValue([
    {
      structType: 'xpower component',
      startTime: 10,
      startTimeStr: '10',
      componentTypeId: 10,
      componentTypeName: '10',
      appNameStr: '10',
      appName: 10,
      backgroundDuration: 10,
      backgroundEnergy: '10',
      foregroundDuration: 10,
      foregroundEnergy: '10',
      screenOffDuration: 10,
      screenOffEnergy: '10',
      screenOnDuration: 10,
      screenOnEnergy: '10',
      backgroundDurationStr: '10',
      foregroundDurationStr: '10',
      screenOffDurationStr: '10',
      screenOnDurationStr: '10',
      cameraId: 10,
      uId: 10,
      load: '10',
      appUsageDuration: 10,
      appUsageDurationStr: '10',
      appUsageEnergy: '10',
    },
    {
      structType: 'xpower component',
      startTime: 10,
      startTimeStr: '10',
      componentTypeId: 10,
      componentTypeName: '10',
      appNameStr: '10',
      appName: 10,
      backgroundDuration: 10,
      backgroundEnergy: '10',
      foregroundDuration: 10,
      foregroundEnergy: '10',
      screenOffDuration: 10,
      screenOffEnergy: '10',
      screenOnDuration: 10,
      screenOnEnergy: '10',
      backgroundDurationStr: '10',
      foregroundDurationStr: '10',
      screenOffDurationStr: '10',
      screenOnDurationStr: '10',
      cameraId: 10,
      uId: 10,
      load: '10',
      appUsageDuration: 10,
      appUsageDurationStr: '10',
      appUsageEnergy: '10',
    },
  ]);
  spXpowerChart.bundleNameFolder = TraceRow.skeleton<BaseStruct>();
  let threadInfoStructArray = [
    {
      value: 10,
      valueStr: '10',
      startNS: 0,
      startTimeStr: '0',
      dur: 10,
      threadTime: 10,
      threadTimeStr: '10',
      threadName: 'stage_CompositorGpuTh',
      threadNameId: 320,
      valueType: 'thread_energy',
      translateY: 10,
      frame: undefined,
      isHover: true,
    },
    {
      value: 10,
      valueStr: '10',
      startNS: 10,
      startTimeStr: '10',
      dur: 10,
      threadTime: 10,
      threadTimeStr: '10',
      threadName: 'stage_CompositorGpuTh',
      threadNameId: 320,
      valueType: 'thread_loads',
      translateY: 10,
      frame: undefined,
      isHover: true,
    },
  ];
  let gpuFreqStructArray = [
    {
      value: 10,
      valueStr: '10',
      startNS: 0,
      startTimeStr: '0',
      dur: 10,
      runTime: 10,
      idleTime: 10,
      runTimeStr: '10',
      idleTimeStr: '10',
      frequency: 10,
      count: 10,
      valueType: '',
      translateY: 10,
      frame: undefined,
      isHover: true,
    },
    {
      value: 10,
      valueStr: '10',
      startNS: 0,
      startTimeStr: '0',
      dur: 10,
      runTime: 100,
      idleTime: 100,
      runTimeStr: '100',
      idleTimeStr: '100',
      frequency: 100,
      count: 100,
      valueType: '',
      translateY: 10,
      frame: undefined,
      isHover: true,
    },
  ];

  it('spXpowerChart01', function () {
    expect(spXpowerChart.init()).toBeDefined();
  });
  it('spXpowerChart02', function () {
    expect(spXpowerChart.initXpowerFolder()).toBeDefined();
  });
  it('spXpowerChart03', function () {
    expect(spXpowerChart.initFolder('system', TraceRow.ROW_TYPE_XPOWER_SYSTEM_GROUP, 'System', '0')).toBeDefined();
    expect(
      spXpowerChart.initFolder('bundleName', TraceRow.ROW_TYPE_XPOWER_BUNDLE_NAME_GROUP, 'com.sina.weibo.stage', '0')
    ).toBeDefined();
  });
  it('spXpowerChart04', function () {
    let xpowerList = [
      {
        name: '',
        num: 10,
        maxValue: 100,
        minValue: 10,
      },
    ];
    expect(spXpowerChart.initSystemData(spXpowerChart.systemFolder, xpowerList)).toBeDefined();
  });
  it('spXpowerChart05', function () {
    expect(convertTitle('Battery.Capacity')).toBe('电池容量(单位mAh)');
    expect(convertTitle('Battery.Charge')).toBe('充电状态(充电1,非充电0)');
    expect(convertTitle('Battery.GasGauge')).toBe('电池剩余电量(单位mAh)');
    expect(convertTitle('Battery.Level')).toBe('电池百分比');
    expect(convertTitle('Battery.RealCurrent')).toBe('实时电流(单位mAh,充电时为正数,耗电时为负数)');
    expect(convertTitle('Battery.Screen')).toBe('屏幕状态(亮屏1,灭屏0)');
    expect(convertTitle('ThermalReport.ShellTemp')).toBe('外壳温度(单位℃)');
    expect(convertTitle('ThermalReport.ThermalLevel')).toBe('温度等级');
    expect(convertTitle('aaa')).toBe('aaa');
  });
  it('spXpowerChart06', function () {
    expect(convertHoverValue('0')).toBe('COOL');
    expect(convertHoverValue('1')).toBe('WARM');
    expect(convertHoverValue('2')).toBe('HOT');
    expect(convertHoverValue('3')).toBe('OVERHEATED');
    expect(convertHoverValue('aaa')).toBe('aaa');
  });
  it('spXpowerChart07', function () {
    expect(spXpowerChart.initXpowerStatisticData(spXpowerChart.bundleNameFolder)).toBeDefined();
    expect(spXpowerChart.initXpowerWifiData(spXpowerChart.bundleNameFolder)).toBeDefined();
    expect(spXpowerChart.initXpowerAppDetatilDisplayData(spXpowerChart.bundleNameFolder)).toBeDefined();
    expect(spXpowerChart.initThreadCountData(spXpowerChart.bundleNameFolder)).toBeDefined();
    expect(spXpowerChart.initThreadInfoData(spXpowerChart.bundleNameFolder, 'thread_energy')).toBeDefined();
    expect(spXpowerChart.initThreadInfoData(spXpowerChart.bundleNameFolder, 'thread_loads')).toBeDefined();
    expect(spXpowerChart.initGpuFreqCountData(spXpowerChart.bundleNameFolder)).toBeDefined();
    expect(spXpowerChart.initGpuFreqData(spXpowerChart.bundleNameFolder)).toBeDefined();
  });
  it('spXpowerChart08', function () {
    let XpowerStatisticTraceRow = TraceRow.skeleton<XpowerStatisticStruct>();
    expect(spXpowerChart.xpowerStatisticThreadHandler(XpowerStatisticTraceRow)).not.toBeDefined();
    let XpowerTraceRow = TraceRow.skeleton<XpowerStruct>();
    let it = {
      name: 'Battery.Capacity',
      num: 10,
      maxValue: 100,
      minValue: 10,
    };
    expect(spXpowerChart.xpowerThreadHandler(XpowerTraceRow, it, 0)).not.toBeDefined();
    let XpowerThreadInfoTraceRow = TraceRow.skeleton<XpowerThreadInfoStruct>();
    expect(spXpowerChart.xpowerThreadInfoThreadHandler(XpowerThreadInfoTraceRow, 'thread_energy')).not.toBeDefined();
    expect(spXpowerChart.xpowerThreadInfoThreadHandler(XpowerThreadInfoTraceRow, 'thread_loads')).not.toBeDefined();
    let XpowerAppDetailTraceRow = TraceRow.skeleton<XpowerAppDetailStruct>();
    expect(spXpowerChart.xpowerAppDetailThreadHandler(XpowerAppDetailTraceRow)).not.toBeDefined();
    let XpowerWifiTraceRow = TraceRow.skeleton<XpowerWifiStruct>();
    expect(spXpowerChart.xpowerWifiThreadHandler(XpowerWifiTraceRow, 'WIFIBytes')).not.toBeDefined();
    expect(spXpowerChart.xpowerWifiThreadHandler(XpowerWifiTraceRow, 'WIFIPackets')).not.toBeDefined();
    let XpowerGpuFreqTraceRow = TraceRow.skeleton<XpowerGpuFreqStruct>();
    expect(spXpowerChart.xpowerGpuFreqThreadHandler(XpowerGpuFreqTraceRow)).not.toBeDefined();
  });
  it('spXpowerChart09', function () {
    expect(spXpowerChart.setDataMap(threadInfoStructArray));
  });
  it('spXpowerChart10', function () {
    expect(spXpowerChart.getThreadInfoDrawData(threadInfoStructArray, 'thread_loads')).toBeDefined();
    expect(spXpowerChart.getThreadInfoDrawData(threadInfoStructArray, 'thread_energy')).toBeDefined();
    expect(spXpowerChart.getGpuFreqDrawData(gpuFreqStructArray)).toBeDefined();
  });
  it('spXpowerChart11', function () {
    let XpowerTraceRow = TraceRow.skeleton<XpowerStruct>();
    let it = {
      name: 'Battery.Capacity',
      num: 10,
      maxValue: 100,
      minValue: 10,
    };
    expect(spXpowerChart.xpowerSupplierFrame(XpowerTraceRow, it)).not.toBeDefined();
    let XpowerThreadCountTraceRow = TraceRow.skeleton<XpowerThreadCountStruct>();
    expect(spXpowerChart.xpowerThreadCountSupplierFrame(XpowerThreadCountTraceRow)).not.toBeDefined();
    let XpowerThreadInfoTraceRow = TraceRow.skeleton<XpowerThreadInfoStruct>();
    expect(spXpowerChart.xpowerThreadInfoSupplierFrame(XpowerThreadInfoTraceRow, 'thread_energy')).not.toBeDefined();
    expect(spXpowerChart.xpowerThreadInfoSupplierFrame(XpowerThreadInfoTraceRow, 'thread_loads')).not.toBeDefined();
    let XpowerGpuFreqCountTraceRow = TraceRow.skeleton<XpowerGpuFreqCountStruct>();
    expect(spXpowerChart.xpowerGpuFreqCountSupplierFrame(XpowerGpuFreqCountTraceRow)).not.toBeDefined();
    let XpowerGpuFreqTraceRow = TraceRow.skeleton<XpowerGpuFreqStruct>();
    expect(spXpowerChart.xpowerGpuFreqSupplierFrame(XpowerGpuFreqTraceRow)).not.toBeDefined();
  });
});
