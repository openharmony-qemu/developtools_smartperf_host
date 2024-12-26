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

const intersectionObserverMock = () => ({
  observe: () => null,
});
window.IntersectionObserver = jest.fn().mockImplementation(intersectionObserverMock);
jest.mock('../../../../src/js-heap/model/DatabaseStruct');
import { trace } from 'console';
import {
  SpChartManager,
  folderSupplier,
  getRowContext,
  rowThreadHandler,
} from '../../../../src/trace/component/chart/SpChartManager';
import { TraceRow } from '../../../../src/trace/component/trace/base/TraceRow';
import { BaseStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerCommon';
jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});

const sqlite = require('../../../../src/trace/database/sql/ProcessThread.sql');
jest.mock('../../../../src/trace/database/sql/ProcessThread.sql');

// @ts-ignore
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));
describe('SpChartManager Test', () => {
  let htmlElement: any = document.createElement('sp-system-trace');
  let chartManager = new SpChartManager(htmlElement);
  let queryDataDICT = sqlite.queryDataDICT;
  let dataDICT = [
    {
      id: 251,
      data: 'delay',
    },
    {
      id: 251,
      data: 'caller',
    },
  ];
  queryDataDICT.mockResolvedValue(dataDICT);
  let funcNameArr = [
    {
      id: 1,
      name: 'test1',
      colorIndex: 1,
    },
    {
      id: 2,
      name: 'test2',
      colorIndex: 2,
    },
  ];
  let arr = [
    {
      id: 1,
      name: 'test1',
      type: 't',
    },
    {
      id: 2,
      name: 'test2',
      type: 'p',
    },
  ];
  it('SpChartManager01', function () {
    expect(chartManager).not.toBeUndefined();
  });
  it('SpChartManager02', function () {
    expect(chartManager.handleFuncName(funcNameArr)).toBeUndefined();
    expect(chartManager.handleFuncName(funcNameArr, '1')).toBeUndefined();
  });
  it('SpChartManager03', function () {
    expect(chartManager.handleProcessThread(arr, '1')).toBeUndefined();
  });
  it('SpChartManager04', function () {
    let traceRow = new TraceRow<BaseStruct>();
    traceRow.name = 'test';
    traceRow.rowId = 'trace-1-1';
    traceRow.rowType = 'trace-1';
    traceRow.traceId = '1';
    traceRow.setAttribute('disabled-check', '');
    traceRow.folder = true;
    traceRow.rowParentId = '';
    traceRow.style.height = '40px';
    expect(chartManager.createFolderRow('trace-1', 'trace-1', 'test', '1')).toStrictEqual(traceRow);
  });
  it('SpChartManager05', function () {
    let obj = [{ id: 0, cat: '', seqno: 0, driver: '', context: '' }];
    expect(chartManager.handleDmaFenceName(obj)).toBeUndefined();
  });
  it('SpChartManager06', function () {
    expect(folderSupplier()).not.toBeUndefined();
  });
});
