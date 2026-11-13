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

import {
  xpowerDataThreadInfoReceiver,
  xpowerDataThreadCountReceiver,
  chartXpowerThreadCountDataSql,
  chartXpowerThreadInfoDataSql,
} from '../../../../../src/trace/database/data-trafic/xpower/XpowerThreadReceiver';

describe('xpowerDataThreadReceiver Test', () => {
  let data = {
    id: 'd460ac73-bcff-4021-9680-f4672b083e25',
    name: 162,
    action: 'exec-proto',
    params: {
      startNS: 0,
      endNS: 30108564984,
      recordStartNS: 203639463442,
      recordEndNS: 233748028426,
      width: 507,
      trafic: 0,
    },
  };

  it('xpowerDataThreadReceiverTest01', () => {
    const args = {
      recordStartNS: 1000,
      endNS: 3000,
      startNS: 2000,
      width: 10,
    };
    expect(chartXpowerThreadCountDataSql(args)).toBeTruthy();
  });

  it('xpowerDataThreadReceiverTest02', () => {
    (self as unknown as Worker).postMessage = jest.fn(() => true);
    expect(
      xpowerDataThreadInfoReceiver(data, () => {
        return [{dur: 8}];
      })
    ).toBeUndefined();
  });

  it('xpowerDataThreadReceiverTest03', () => {
    const args = {
      recordStartNS: 1000,
      endNS: 3000,
      startNS: 2000,
      width: 10,
    };
    expect(chartXpowerThreadInfoDataSql(args)).toBeTruthy();
  });

  it('xpowerDataThreadReceiverTest04', () => {
    (self as unknown as Worker).postMessage = jest.fn(() => true);
    expect(
      xpowerDataThreadCountReceiver(data, () => {
        return [{dur: 80}];
      })
    ).toBeUndefined();
  });
});
