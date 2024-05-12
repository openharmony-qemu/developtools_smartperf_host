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
export class GpuCountBean {
  freq: number = 0;
  val: number = 0;
  value: number = 0;
  startNS: number = 0;
  dur: number = 0;
  endTime: number = 0;
  thread: string = '';
  parentIndex: number = 0;
  level?: number = 0;
  constructor(
    freq: number,
    value: number,
    val: number,
    dur: number,
    startNS: number,
    endTime: number,
    thread: string,
    parentIndex: number
  ) {
    this.freq = freq;
    this.value = value;
    this.val = val;
    this.dur = dur;
    this.startNS = startNS;
    this.endTime = endTime;
    this.thread = thread;
    this.parentIndex = parentIndex;
  }
}
export class SearchGpuFuncBean {
  funName: string | undefined;
  startTime: number = 0;
  dur: number | undefined;
  endTime: number = 0;
  threadName: string | undefined;
  pid: number | undefined;
}
export class TreeDataBean {
  thread?: string = '';
  val?: number = 0;
  freq?: number = 0;
  gpufreq?: number = 0;
  dur: number = 0;
  value: number = 0;
  percent?: number = 0;
  children: TreeDataBean[] = [];
  ts?: number = 0;
  startTime?: number = 0;
  startNS?: number = 0;
  level?: number;
  cycle?: number;
}

export class CycleDataBean {
  colorIndex: number = 0;
  dur: number = 0;
  value: number = 0;
  startNS: number = 0;
  cycle: number = 0;
  name: string = '';
  depth: number = 1;
  constructor(
    colorIndex: number,
    dur: number,
    value: number,
    startNS: number,
    cycle: number,
    name: string,
    depth: number
  ) {
    this.colorIndex = colorIndex;
    this.dur = dur;
    this.value = value;
    this.startNS = startNS;
    this.cycle = cycle;
    this.name = name;
    this.depth = this.depth;
  }
}

export class TreeDataStringBean {
  thread: string = '';
  value: string = '';
  dur: string = '';
  percent: string = '';
  level?: string = '';
  cycle?: number = 0;
  startNS?: string = '';
  freq?: string = '';
  children?: TreeDataStringBean[] = [];
  status?: boolean = false;
  constructor(
    thread: string,
    value: string,
    dur: string,
    percent: string,
    level?: string,
    freq?: string,
    cycle?: number,
    children?: TreeDataStringBean[],
    startNS?: string,
    status?: boolean
  ) {
    this.thread = thread;
    this.value = value;
    this.dur = dur;
    this.percent = percent;
    this.level = level;
    this.freq = freq;
    this.cycle = cycle;
    this.children = children;
    this.startNS = startNS;
    this.status = status;
  }
}
