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
  chartXpowerWifiMemoryDataSql,
  xpowerWifiDataReceiver,
} from '../../../../../src/trace/database/data-trafic/xpower/XpowerWifiDataReceiver';

describe('xpowerWifiDataReceiver Test', () => {
  let data = {
    id: 'd460ac73-bcff-4021-9680-f4672b083e25',
    name: 162,
    action: 'exec-proto',
    params: {
      startNS: 0,
      endNS: 40008564984,
      recordStartNS: 303639498442,
      recordEndNS: 433748028469,
      width: 590,
      trafic: 0,
    },
  };

  it('xpowerWifiDataReceiverTest01', () => {
    const args = {
      xpowerName: 'WIFIPackets',
      recordStartNS: 10000,
      endNS: 30000,
      startNS: 20000,
      width: 100,
    };
    expect(chartXpowerWifiMemoryDataSql(args)).toBeTruthy();
  });

  it('xpowerWifiDataReceiverTest02', () => {
    const args = {
      xpowerName: 'WIFIBytes',
      recordStartNS: 10000,
      endNS: 30000,
      startNS: 20000,
      width: 100,
    };
    expect(chartXpowerWifiMemoryDataSql(args)).toBeTruthy();
  });

  it('xpowerWifiDataReceiverTest03', () => {
    (self as unknown as Worker).postMessage = jest.fn(() => true);
    expect(
      xpowerWifiDataReceiver(data, () => {
        return [5, 9, 1000];
      })
    ).toBeUndefined();
  });
});
