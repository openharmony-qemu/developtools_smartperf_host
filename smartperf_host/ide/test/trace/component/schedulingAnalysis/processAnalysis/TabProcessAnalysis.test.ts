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

import { TabProcessAnalysis } from '../../../../../src/trace/component/schedulingAnalysis/processAnalysis/TabProcessAnalysis';
import { LitTable } from '../../../../../src/base-ui/table/lit-table';

// @ts-ignore
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));
jest.spyOn(LitTable.prototype, 'reMeauseHeight').mockReturnValue(undefined);
jest.mock('../../../../../src/base-ui/chart/pie/LitChartPie', () => {
    return jest.fn().mockImplementation(() => {
      return {
        initHtml: jest.fn(),
        initElements: jest.fn(),
        updateData: jest.fn(),
        measureInitialize: jest.fn(),
      };
    });
  });
describe('TabProcessAnalysis Test', () => {
  it('TabProcessAnalysisTest01', () => {
    let tabpane = new TabProcessAnalysis();
    tabpane.initHtml();
    tabpane.initElements();
    expect(tabpane.initElements()).toBeUndefined();
    tabpane.currentTabID = '1';
    expect(tabpane.initHtml()).not.toBeUndefined();
  });
});
