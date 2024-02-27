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

jest.mock('../../../../../src/trace/component/trace/base/TraceRow', () => {
  return {};
});

jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
    return {};
});
jest.mock('../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
import { TabPaneFlag } from '../../../../../src/trace/component/trace/timer-shaft/TabPaneFlag';

describe('TabPaneFlag Test', () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  let tabPaneFlag = new TabPaneFlag();

  it('TabPaneFlagTest01', function () {
    document.body.innerHTML = '<tabpane-flag id="remove-flag"> </tabpane-flag>';
    tabPaneFlag = document.querySelector('#remove-flag') as TabPaneFlag;
    let htmlButtonElement = document.createElement('button') as HTMLButtonElement;
    document.body.appendChild(htmlButtonElement);
    htmlButtonElement.dispatchEvent(new Event('click'));
    expect(tabPaneFlag.initElements()).toBeUndefined();
  });

  it('TabPaneFlagTest02', function () {
    expect(tabPaneFlag.initHtml()).not.toBe('');
  });
});
