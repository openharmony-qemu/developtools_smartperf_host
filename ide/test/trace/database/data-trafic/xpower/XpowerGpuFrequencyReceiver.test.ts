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
  chartXpowerGpuFreqCountDataSql,
  chartXpowerGpuFreqDataSql,
  xpowerDataGpuFreqCountReceiver,
  xpowerDataGpuFreqReceiver,
} from '../../../../../src/trace/database/data-trafic/xpower/XpowerGpuFrequencyRecevier';
import { TraficEnum } from '../../../../../src/trace/database/data-trafic/utils/QueryEnum';

describe('xpowerDataGpuFreqCountReceiver Test', () => {
  let data = {
    id: 'd460ac73-bcff-4021-9680-f4672b083e25',
    name: 162,
    action: 'exec-proto',
    params: {
      startNS: 0,
      endNS: 30108569984,
      recordStartNS: 203939463442,
      recordEndNS: 233758028426,
      width: 597,
      trafic: 0,
    },
  };

  it('xpowerDataGpuFreqCountReceiverTest01', () => {
    const args = {
      recordStartNS: 1001,
      endNS: 3000,
      startNS: 2000,
      width: 110,
    };
    expect(chartXpowerGpuFreqCountDataSql(args)).toBeTruthy();
  });
  it('xpowerDataGpuFreqCountReceiverTest02', () => {
    (self as unknown as Worker).postMessage = jest.fn(() => true);
    expect(
      xpowerDataGpuFreqCountReceiver(data, () => {
        return 0;
      })
    ).toBeUndefined();
  });
  it('xpowerDataGpuFreqCountReceiverTest03', () => {
    const args = {
      recordStartNS: 1000,
      endNS: 3000,
      startNS: 2000,
      width: 10,
    };
    expect(chartXpowerGpuFreqDataSql(args)).toBeTruthy();
  });
  it('xpowerDataGpuFreqCountReceiverTest04', () => {
    (self as unknown as Worker).postMessage = jest.fn(() => true);
    expect(
      xpowerDataGpuFreqReceiver(data, () => {
        return [{ dur: 88 }];
      })
    ).toBeUndefined();
  });
});
