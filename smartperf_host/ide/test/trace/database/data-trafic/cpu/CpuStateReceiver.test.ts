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
  chartCpuStateDataSql,
  chartCpuStateDataSqlMem, cpuStateReceiver
} from '../../../../../src/trace/database/data-trafic/cpu/CpuStateReceiver';

describe('CpuStateReceiver Test', () => {
  let data = {
    id: '55348b85-5aa9-4e99-86fc-acb2d6f438fe',
    name: 1,
    action: 'exec-proto',
    params: {
      startTs: 1,
      filterId: 3,
      startNS: 0,
      endNS: 9427688540,
      recordStartNS: 4049847357191,
      recordEndNS: 4059275045731,
      width: 491,
      trafic: 2,
    }
  };
  let CpuStateData = [{
      value: 0,
      dur: 193229,
      height: 4,
      startTs: 6992644791,
      cpu: 1,
      frame: {
        y: 5,
        height: 30,
        x: 364,
        width: 1
      }
  }]
  it('CpuStateReceiverTest01 ', function () {
    const args = {
      recordStartNS: 1000,
      endNS: 3000,
      startNS: 2000,
      width: 10,
      filterId: 1,
    };
    expect(chartCpuStateDataSql(args)).toBeTruthy();
    expect(chartCpuStateDataSqlMem(args)).toBeTruthy();
  });
  it('CpuStateReceiverTest02 ', function () {
    (self as unknown as Worker).postMessage = jest.fn(() => true);
    expect(cpuStateReceiver(data, () => {
      return CpuStateData;
    })).toBeUndefined();
  });
});