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
  ThreadInitConfig,
  SchedSwitchCountBean,
  TreeSwitchConfig,
  HistogramSourceConfig,
  CutDataObjConfig,
} from '../../../src/trace/bean/SchedSwitchStruct';
describe('PerfStruct', () => {
  it('PerfStructTest01', () => {
    let threadInitConfig = new ThreadInitConfig();
    let struct = {
      endTs: 0,
      pid: -1,
      state: '',
      tid: -1,
      ts: -1,
      dur: -1,
      duration: -1,
      cycleStartTime: -1,
      cycleEndTime: -1,
    };
    expect(threadInitConfig).toEqual(struct);
  });
  it('PerfStructTest02', () => {
    let schedSwitchCountBean = new SchedSwitchCountBean('', 0, '', '', 2, 3, '', 4, '', 5, []);
    let struct = {
      children: [],
      colorIndex: 5,
      cycle: 3,
      cycleStartTime: '',
      dur: '',
      duration: 2,
      level: '',
      nodeFlag: '',
      startNS: 0,
      title: '',
      value: 4,
    };

    expect(schedSwitchCountBean).toEqual(struct);
  });
  it('PerfStructTest03', () => {
    let treeSwitchConfig = new TreeSwitchConfig();
    let struct = {
      children: [],
      cycle: 0,
      isHover: false,
      isSelected: false,
      level: '',
      pid: -1,
      status: false,
      tid: -1,
      title: '',
      value: 0,
    };
    expect(treeSwitchConfig).toEqual(struct);
  });
  it('PerfStructTest04', () => {
    let histogramSourceConfig = new HistogramSourceConfig();
    let struct = {
      average: 0,
      color: '',
      cycleNum: 0,
      isHover: false,
      size: '',
      value: 0,
    };
    expect(histogramSourceConfig).toEqual(struct);
  });
  it('PerfStructTest05', () => {
    let cutDataObjConfig = new CutDataObjConfig();
    let struct = {
      cyclesArr: [],
      pid: -1,
      processTitle: '',
      threadCountTotal: 0,
      threadTitle: '',
      tid: -1,
    };
    expect(cutDataObjConfig).toEqual(struct);
  });
});
