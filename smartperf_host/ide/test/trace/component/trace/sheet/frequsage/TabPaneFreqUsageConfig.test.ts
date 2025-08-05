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
  TabPaneCpuFreqConfig,
  TabPaneFreqUsageConfig, TabPaneRunningConfig
} from '../../../../../../src/trace/component/trace/sheet/frequsage/TabPaneFreqUsageConfig';

describe('TabPaneFreqUsageConfig Test', () => {
  it('TabPaneFreqUsageConfigTest01 ', function () {
    const thread = 'thread';
    const ts = Date.now();
    const pid = 1;
    const tid = 2;
    const count = 3;
    const cpu = 0.5;
    const freq = 1000;
    const dur = 2000;
    const cdur = 'cdur';
    const percent = 50;
    const flag = 'flag';
    const id = 10;
    const children = [];
    const config = new TabPaneFreqUsageConfig(thread, ts, pid, tid, count, cpu, freq, dur, cdur, percent, flag, id, children);
    expect(config.cpu).toBe(0.5);
  });
  it('TabPaneFreqUsageConfigTest02 ', function () {
    const thread = '';
    const process = '';
    const ts = 0;
    const pid = 0;
    const tid = 0;
    const cpu = -1;
    const dur = 0;
    const config = new TabPaneRunningConfig(thread, process, ts, pid, tid, cpu, dur);
    expect(config.dur).toBe(0)
  });
  it('TabPaneFreqUsageConfigTest03 ', function () {
    const startNS = 1000;
    const cpu = 0.5;
    const value = 2000;
    const dur = 500;
    const config = new TabPaneCpuFreqConfig(startNS, cpu, value, dur);
    expect(config.startNS).toBe(startNS);
  });
});