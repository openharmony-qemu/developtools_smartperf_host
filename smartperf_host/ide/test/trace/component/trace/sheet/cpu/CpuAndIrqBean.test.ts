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
  CpuAndIrqBean,
  byCpuGroupBean,
  finalResultBean,
  softirqAndIrq,
} from '../../../../../../src/trace/component/trace/sheet/cpu/CpuAndIrqBean';
describe('PerfStruct', () => {
  it('PerfStructTest01', () => {
    let cpuAndIrqBean = new CpuAndIrqBean();
    let struct = {
      cat: '',
      cpu: 0,
      dur: 0,
      endTime: 0,
      isFirstObject: 1,
      occurrences: 1,
      priority: 0,
      startTime: 0,
    };
    expect(cpuAndIrqBean).toEqual(struct);
  });
  it('PerfStructTest02', () => {
    let finalResultBeanData = new finalResultBean();
    let struct = {
      cat: '',
      cpu: 0,
      dur: 0,
      occurrences: 1,
    };
    expect(finalResultBeanData).toEqual(struct);
  });
  it('PerfStructTest02', () => {
    let byCpuGroupBeanData = new byCpuGroupBean();
    let struct = {
      CPU: [],
    };
    expect(byCpuGroupBeanData).toEqual(struct);
  });
  it('PerfStructTest02', () => {
    let softirqAndIrqData = new softirqAndIrq();
    let struct = {
      avgDuration: 0,
      cpus: {},
      occurrences: 0,
      wallDuration: 0,
    };
    expect(softirqAndIrqData).toEqual(struct);
  });
});
