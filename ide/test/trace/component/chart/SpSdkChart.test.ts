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

import { SpSdkChart } from '../../../../src/trace/component/chart/SpSdkChart';
import { SpSystemTrace } from '../../../../src/trace/component/SpSystemTrace';

jest.mock('../../../../src/js-heap/model/DatabaseStruct');
const sqlit = require('../../../../src/trace/database/sql/SqlLite.sql');
jest.mock('../../../../src/trace/database/sql/SqlLite.sql');
const sdkSqlite = require('../../../../src/trace/database/sql/Sdk.sql');
jest.mock('../../../../src/trace/database/sql/Sdk.sql');
const intersectionObserverMock = () => ({
  observe: () => null,
});
global.Worker = jest.fn();
window.IntersectionObserver = jest.fn().mockImplementation(intersectionObserverMock);
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

describe('SpSdkChart Test', () => {
  let spSdkChart = new SpSdkChart(new SpSystemTrace());
  let MockStartTime = sqlit.queryStartTime;
  MockStartTime.mockResolvedValue([
    {
      start_ts: 0,
    },
  ]);

  let counterMax = sdkSqlite.queryCounterMax;
  counterMax.mockResolvedValue([
    {
      startTime: 12,
      tableName: '',
      columns: ''
    },
  ]);

  let sdkCount = sdkSqlite.querySdkCount;
  sdkCount.mockResolvedValue([
    {
      startTime: 15,
      tableName: 'tableName',
      columns: ''
    },
  ]);

  let sdkCounterData = sdkSqlite.querySdkCounterData;
  sdkCounterData.mockResolvedValue([
    {
      startTime: 15,
      tableName: 'tableName',
      columns: ''
    },
  ]);

  let sdkSliceData = sdkSqlite.querySdkSliceData;
  sdkSliceData.mockResolvedValue([
    {
      startTime: 152,
      tableName: 'tableName',
      columns: ''
    },
  ]);
  let map = new Map();
  let jsoSdknCofigStr =
    '{"settingConfig":{"configuration":{"counters":{"enum":["ARM_Mali-TTRx_JS1_ACTIVE","ARM_Mali-TTRx_JS0_ACTIVE","ARM_Mali-TTRx_GPU_ACTIVE","ARM_Mali-TTRx_FRAG_ACTIVE"],\n' +
    '    "type":"string"},"stop_gator":{"default":"true","description":"stop_gator","type":"boolean"},"version":{"default":"7","description":"gatordversion","type":"number"}},"name":"mailG77"},\n' +
    '    "tableConfig":{"showType":[{"columns":[{"column":"ts","displayName":"TimeStamp","showType":[1,3],"type":"INTEGER"},{"column":"counter_id","displayName":"MonitorValue","showType":[1,3],"type":"INTEGER"},\n' +
    '    {"column":"value","displayName":"Value","showType":[1,3],"type":"INTEGER"}],"inner":{"columns":[{"column":"counter_name","displayName":"","showType":[0],"type":"STRING"},\n' +
    '    {"column":"counter_id","displayName":"","showType":[96,6],"type":"INTEGER"}],"tableName":"mock_plugin_counterobj_table"},"tableName":"mock_plugin_counter_table"},\n' +
    '    {"columns":[{"column":"start_ts","displayName":"startts","showType":[2,3],"type":"INTEGER"},{"column":"end_ts","displayName":"endts","showType":[2,3],"type":"INTEGER"},\n' +
    '    {"column":"slice_id","displayName":"slice_id","showType":[2,154,3],"type":"INTEGER"},{"column":"value","displayName":"Value","showType":[2,3],"type":"INTEGER"}],\n' +
    '    "inner":{"columns":[{"column":"slice_name","displayName":"","showType":[313],"type":"STRING"},{"column":"slice_id","displayName":"","showType":[0],"type":"INTEGER"}],\n' +
    '    "tableName":"mock_plugin_sliceobj_table"},"tableName":"mock_plugin_slice_table"}]}}';
  let dataSdkMap = {
    jsonConfig: jsoSdknCofigStr,
    disPlayName: 'common_mock',
    pluginName: 'mock-plugin',
  };
  map.set('1', dataSdkMap);
  SpSystemTrace.SDK_CONFIG_MAP = map;
  it('SpSdkChartTest01', function () {
    expect(spSdkChart.createSliceSql(10, 8, [{length: 5}], '')).toBe('select undefined from 8 ');
  });

  it('SpSdkChartTest02', function () {
    expect(spSdkChart.createMaxValueSql('', '')).toBe('select max(value) as max_value from  ');
  });

  it('SpSdkChartTest03', function () {
    expect(spSdkChart.createMaxValueSql('a', 'c')).toBe('select max(value) as max_value from a c');
  });

  it('SpSdkChartTest04', function () {
    expect(spSdkChart.createSql(3, 'c', [{length: 3}], 'a')).toBe('select undefined from c a');
  });

  it('SpSdkChartTest05', function () {
    expect(spSdkChart.createSql(0, 'c', [{length: 3}], '')).toBe('select undefined from c ');
  });

  it('SpSdkChartTest06', function () {
    spSdkChart.init();
    expect(spSdkChart).toBeDefined();
  });

  it('SpSdkChartTest07', function () {
    spSdkChart.parseJson(58512, map);
  });

  it('SpSdkChartTest08', function () {
    expect(spSdkChart.initSliceChartRow(true, 2, 3, 'name', 2)).not.toBeUndefined();
  });

  it('SpSdkChartTest09', function () {
    expect(spSdkChart.initCounterChartRow(5, true, 2, 'name')).not.toBeUndefined();
  });
});
