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

import { PerfFireChartStruct, HiPerfChartFrame } from '../../../src/trace/bean/PerfStruct';
describe('PerfStruct', () => {
  it('PerfStructTest01', () => {
    let perfFireChartStruct = new PerfFireChartStruct(0, '1', 2, 3, 4, 5);
    let struct = {
      depth: 2,
      id: 0,
      name: '1',
      selfTime: 3,
      thread_id: 5,
      totalTime: 4,
    };
    expect(perfFireChartStruct).toEqual(struct);
  });
  it('PerfStructTest02', () => {
    let hiPerfChartFrame = new HiPerfChartFrame(0, '1', 2, 3, 4, 5, 6);
    let struct = {
      children: [],
      column: 0,
      depth: 5,
      endTime: 3,
      id: 0,
      isSelect: false,
      line: 0,
      name: '1',
      selfTime: 0,
      startTime: 2,
      thread_id: 6,
      totalTime: 4,
    };
    expect(hiPerfChartFrame).toEqual(struct);
  });
});
