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
const sqlite = require('../../../../src/trace/database/sql/Irq.sql');
jest.mock('../../../../src/trace/database/sql/Irq.sql');
jest.mock('../../../../src/js-heap/model/DatabaseStruct');
// @ts-ignore
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

import { SpArkTsChart } from '../../../../src/trace/component/chart/SpArkTsChart';

jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});

describe('SpIrqChart Test', () => {
  let htmlElement: any = document.createElement('sp-system-trace');
  let spArkTsChart = new SpArkTsChart(htmlElement);
  let irqList = sqlite.queryIrqList;
  let irqListData = [
    {
      name: 'test',
      cpu: 0,
    },
  ];
  irqList.mockResolvedValue(irqListData);
  it('SpArkTsChart01', function () {
    expect(spArkTsChart).not.toBe({ initChart: [], loadJsDatabase: {}, trace: undefined });
  });
});
