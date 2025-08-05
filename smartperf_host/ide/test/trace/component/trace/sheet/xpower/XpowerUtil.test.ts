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

import { LitTable } from '../../../../../../src/base-ui/table/lit-table';
import { setSortKey } from '../../../../../../src/trace/component/trace/sheet/xpower/XpowerUtil';
jest.mock('../../../../../../src/js-heap/model/DatabaseStruct', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorkerCommon', () => {
  return {};
});
jest.mock('../../../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));
const intersectionObserverMock = () => ({
  observe: () => null,
});
window.IntersectionObserver = jest.fn().mockImplementation(intersectionObserverMock);
describe('XpowerUtil', () => {
  it('TabPaneXpowerGpuFreqTest01', () => {
    expect(setSortKey('backgroundDurationStr')).toBe('backgroundDuration');
    expect(setSortKey('foregroundDurationStr')).toBe('foregroundDuration');
    expect(setSortKey('screenOffDurationStr')).toBe('screenOffDuration');
    expect(setSortKey('screenOnDurationStr')).toBe('screenOnDuration');
    expect(setSortKey('startTimeStr')).toBe('startTime');
    expect(setSortKey('appUsageDurationStr')).toBe('appUsageDuration');
  });
});
