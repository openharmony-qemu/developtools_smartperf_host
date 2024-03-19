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

import '../../../../src/trace/component/chart/SpHiSysEnergyChart';
import { SpChartManager } from '../../../../src/trace/component/chart/SpChartManager';
import '../../../../src/trace/component/chart/SpChartManager';
import '../../../../src/trace/component/SpSystemTrace';
import { LitPopover } from '../../../../src/base-ui/popover/LitPopoverV';
import { SpHiSysEnergyChart } from '../../../../src/trace/component/chart/SpHiSysEnergyChart';

jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});

window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

const sqlite = require('../../../../src/trace/database/SqlLite');
jest.mock('../../../../src/trace/database/SqlLite');

describe('SpHiSysEnergyChart Test', () => {
  let ss = new SpChartManager();
  let spHiSysEnergyChart = new SpHiSysEnergyChart(ss);

  let htmlDivElement = document.createElement<LitPopover>('div');
  htmlDivElement.setAttribute('id', 'appNameList');

  let anomalyData = sqlite.queryAnomalyData;
  anomalyData.mockResolvedValue([]);

  let maxStateValue = sqlite.queryMaxStateValue;
  let max = [
    {
      maxValue: 200,
      type: 'state',
    },
    {
      maxValue: 300,
      type: 'sensor',
    },
  ];
  maxStateValue.mockResolvedValue(max);
  let MockExits = sqlite.queryEnergyEventExits;
  MockExits.mockResolvedValue(['trace_hisys_event']);
  let powerData = sqlite.queryPowerData;
  let power = [
    {
      startNS: 5999127351,
      eventName: 'POWER_IDE_AUDIO',
      appKey: 'APPNAME',
      eventValue: 'com.example.himusicdemo,com.example.himusicdemo_js,com.example.himusicdemo_app',
    },
    {
      startNS: 1291120516,
      eventName: 'POWER_IDE_AUDIO',
      appKey: 'BACKGROUND_ENERGY',
      eventValue: '854,258,141',
    },
  ];
  powerData.mockResolvedValue(power);

  let stateData = sqlite.queryStateData;
  stateData.mockResolvedValue([]);

  let sysEventAppName = sqlite.queryEnergyAppName;
  let appName = [
    {
      string_value: 'app_name',
    },
  ];
  sysEventAppName.mockResolvedValue(appName);

  let querySystemLocationData = sqlite.querySystemLocationData;
  let querySystemLockData = sqlite.querySystemLockData;
  let querySystemSchedulerData = sqlite.querySystemSchedulerData;
  let queryConfigSysEventAppName = sqlite.queryConfigEnergyAppName;
  let location = [
    {
      ts: 100652222,
      eventName: 'GNSS_STATE',
      appKey: 'TYPE',
      Value: '1',
    },
    {
      ts: 3333332224,
      eventName: 'GNSS_STATE',
      appKey: 'TAG',
      Value: '2',
    },
  ];

  let lock = [
    {
      ts: 96555551,
      eventName: 'POWER_RUNNINGLOCK',
      appKey: 'TYPE',
      Value: '1',
    },
    {
      ts: 333234222,
      eventName: 'POWER_RUNNINGLOCK',
      appKey: 'TAG',
      Value: '2',
    },
  ];

  let work = [
    {
      ts: 100593835619,
      eventName: 'WORK_ADD',
      appKey: 'TYPE',
      Value: '1',
    },
    {
      ts: 2315652241,
      eventName: 'WORK_STOP',
      appKey: 'TAG',
      Value: '2',
    },
  ];

  let process = [
    {
      process_name: 'process1',
    },
  ];
  querySystemLocationData.mockResolvedValue(location);
  querySystemLockData.mockResolvedValue(lock);
  querySystemSchedulerData.mockResolvedValue(work);
  queryConfigSysEventAppName.mockResolvedValue(process);

  it('SpHiSysEnergyChartTest01', function () {
    spHiSysEnergyChart.init();
    expect(SpHiSysEnergyChart.app_name).toBeUndefined();
  });

  it('SpHiSysEnergyChartTest04', function () {
    let result = [
      {
        startNS: 33255112,
        eventName: 'POWER_IDE_AUDIO',
        appKey: 'APPNAME',
        eventValue: 'com.example.himusicdemo,com.example.himusicdemo_js,com.example.himusicdemo_app',
      },
      {
        startNS: 5999127352,
        eventName: 'POWER_IDE_AUDIO',
        appKey: 'BACKGROUND_ENERGY',
        eventValue: '854,258,141',
      },
      {
        startNS: 223224352,
        eventName: 'POWER_IDE_BLUETOOTH',
        appKey: 'APPNAME',
        eventValue: 'com.ohos.settings,bt_switch,bt_switch_js,bt_switch_app',
      },
      {
        startNS: 86222222,
        eventName: 'POWER_IDE_BLUETOOTH',
        appKey: 'BACKGROUND_ENERGY',
        eventValue: '76,12,43,431',
      },
      {
        startNS: 5999127382,
        eventName: 'POWER_IDE_CAMERA',
        appKey: 'APPNAME',
        eventValue: 'com.ohos.camera,com.ohos.camera_app,com.ohos.camera_js,com.ohos.camera_ts',
      },
      {
        startNS: 264166822,
        eventName: 'POWER_IDE_CAMERA',
        appKey: 'BACKGROUND_ENERGY',
        eventValue: '375,475,255,963',
      },
    ];
    expect(spHiSysEnergyChart.getPowerData(result)).toStrictEqual(Promise.resolve());
  });

  it('SpHiSysEnergyChartTest05', function () {
    expect(spHiSysEnergyChart.getPowerData([])).toStrictEqual(Promise.resolve());
  });

  it('SpHiSysEnergyChartTest6', function () {
    expect(spHiSysEnergyChart.initHtml).toMatchInlineSnapshot(`undefined`);
  });

  it('SpHiSysEnergyChartTest7', function () {
    expect(htmlDivElement.onclick).toBe(null);
  });
});
