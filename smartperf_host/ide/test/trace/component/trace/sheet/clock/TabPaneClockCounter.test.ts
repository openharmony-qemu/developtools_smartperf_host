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

import { TabPaneClockCounter } from '../../../../../../src/trace/component/trace/sheet/clock/TabPaneClockCounter';
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

describe('TabPaneClockCounter Test', () => {
  let map = new Map();
  map.set('clock', [
    {
      filterId: 255,
      value: 1252,
      startNS: 4515,
      dur: 5255,
      delta: 415,
    },
  ]);
  let clockCounterData = {
    leftNs: 253,
    rightNs: 1252,
    clockMapData: map,
  };
  document.body.innerHTML = `<lit-table id="tb-counter"></lit-table>`;
  let clockCounter = document.querySelector('#tb-counter') as TabPaneClockCounter;

  it('TabPaneClockCounterTest01', function () {
    clockCounter.data = clockCounterData;
    expect(clockCounter.data).toEqual(clockCounterData);
  });

  it('TabPaneClockCounterTest02', function () {
    let clockCounter = new TabPaneClockCounter();
    expect(
      clockCounter.sortByColumn({
        key: 'number',
        sort: 2,
      })
    ).toBeUndefined();
    expect(
      clockCounter.sortByColumn({
        key: 'string',
        sort: 2,
      })
    ).toBeUndefined();
    expect(
      clockCounter.sortByColumn({
        key: 'name',
        sort: 0,
      })
    ).toBeUndefined();
  });
  it('TabPaneClockCounterTest02', function () {
    let clockCounter = new TabPaneClockCounter();
    let list = [
      {
        value: 10,
        filterId: 0,
        asyncCatNames: [],
        asyncNames: [],
        average: '',
        avg: '10',
        avgDuration: '',
        avgNumber: 0,
        avgWeight: '',
        count: 1,
        cpu: 0,
        delta: '',
        dur: 0,
        duration: '',
        energy: '',
        first: '',
        last: '',
        leftNs: 0,
        max: '10',
        maxDuration: 0,
        maxDurationFormat: '',
        maxNumber: 0,
        min: '11',
        minNumber: 0,
        name: '10',
        occurrences: 0,
        pid: '',
        process: '',
        rate: '',
        recordStartNs: 0,
        rightNs: 0,
        state: '',
        stateJX: '',
        tabTitle: '',
        thread: '',
        threadIds: [],
        tid: '',
        timeStamp: '',
        trackId: 0,
        ts: 0,
        wallDuration: 0,
        wallDurationFormat: '',
      },
      {
        value: 20,
        filterId: 0,
        asyncCatNames: [],
        asyncNames: [],
        average: '',
        avg: '10',
        avgDuration: '',
        avgNumber: 0,
        avgWeight: '',
        count: 1,
        cpu: 0,
        delta: '',
        dur: 0,
        duration: '',
        energy: '',
        first: '',
        last: '',
        leftNs: 0,
        max: '10',
        maxDuration: 0,
        maxDurationFormat: '',
        maxNumber: 0,
        min: '10',
        minNumber: 0,
        name: '10',
        occurrences: 0,
        pid: '',
        process: '',
        rate: '',
        recordStartNs: 0,
        rightNs: 0,
        state: '',
        stateJX: '',
        tabTitle: '',
        thread: '',
        threadIds: [],
        tid: '',
        timeStamp: '',
        trackId: 0,
        ts: 0,
        wallDuration: 0,
        wallDurationFormat: '',
      },
    ];
    let returnValue = {
      asyncCatNames: [],
      asyncNames: [],
      average: '',
      avg: '',
      avgDuration: '',
      avgNumber: 0,
      avgWeight: 'NaN',
      count: '2',
      cpu: 0,
      delta: '10',
      dur: 0,
      duration: '',
      energy: '',
      first: '10',
      last: '20',
      leftNs: 0,
      max: '20',
      maxDuration: 0,
      maxDurationFormat: '',
      maxNumber: 0,
      min: '10',
      minNumber: 0,
      name: 'name',
      occurrences: 0,
      pid: '',
      process: '',
      rate: '10000.0000',
      recordStartNs: 0,
      rightNs: 0,
      state: '',
      stateJX: '',
      tabTitle: '',
      thread: '',
      threadIds: [],
      tid: '',
      timeStamp: '',
      trackId: 0,
      ts: 0,
      wallDuration: 0,
      wallDurationFormat: '',
    };

    expect(clockCounter.createSelectCounterData('name', list, 0, 1000000)).toEqual(returnValue);
  });
});
