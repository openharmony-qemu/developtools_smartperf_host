/*
 * Copyright (C) 2023 Huawei Device Co., Ltd.
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

export class TabPaneFreqUsageConfig {
  thread: string = "";
  ts: number | string;
  pid: number | string;
  tid: number | string;
  count: number = 0;
  cpu: number | string;
  freq: number | string;
  dur: number = 0;
  cdur: string = "";
  percent: number | string;
  flag: string = "";
  id: number = -1;
  children: Array<TabPaneFreqUsageConfig> | undefined;
  constructor(
    thread: string,
    ts: number | string,
    pid: number | string,
    tid: number | string,
    count: number,
    cpu: number | string,
    freq: number | string,
    dur: number,
    cdur: string,
    percent: number | string,
    flag: string,
    id: number,
    children: Array<TabPaneFreqUsageConfig> | undefined
  ) {
    this.thread = thread;
    this.ts = ts;
    this.pid = pid;
    this.tid = tid;
    this.count = count;
    this.cpu = cpu;
    this.freq = freq;
    this.dur = dur;
    this.cdur = cdur;
    this.percent = percent;
    this.flag = flag;
    this.id = id;
    this.children = children;
  }
}

export class TabPaneRunningConfig {
  thread: string = "";
  process: string = "";
  ts: number = 0;
  pid: number = 0;
  tid: number = 0;
  cpu: number = -1;
  dur: number = 0;
  constructor(
    process: string,
    thread: string,
    ts: number,
    pid: number,
    tid: number,
    cpu: number,
    dur: number
  ) {
    this.process = process;
    this.thread = thread;
    this.ts = ts;
    this.pid = pid;
    this.tid = tid;
    this.cpu = cpu;
    this.dur = dur;
  }
}
export class TabPaneCpuFreqConfig {
  startNS: number = 0;
  value: number = 0;
  cpu: number = 0;
  dur: number = 0;
  constructor(startNS: number, cpu: number, value: number, dur: number) {
    this.startNS = startNS;
    this.cpu = cpu;
    this.value = value;
    this.dur = dur;
  }
}