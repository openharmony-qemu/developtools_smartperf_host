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
  filterId: string = '';
  freq: string = '';
  count: string = '';
  value: string = '';
  ts: string = '';
  startNS: string = '';
  dur: string = '';
  endTime: string = '';
  thread: string = '';
  parentIndex: number = 0;
  level?: number = 0;
  name?: string = '';
  constructor(
    filterId: string,
    freq: string,
    count: string,
    value: string,
    ts: string,
    dur: string,
    startNS: string,
    endTime: string,
    thread: string,
    parentIndex: number
  ) {
    this.filterId = filterId;
    this.freq = freq;
    this.count = count;
    this.value = value;
    this.ts = ts;
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
  depth: number | undefined;
  threadName: string | undefined;
  pid: number | undefined;
}
export class TreeDataBean {
  thread?: string = '';
  count: string = '';
  freq?: string = '';
  gpufreq?: string = '';
  dur: string = '';
  value?: string = '';
  percent?: string = '';
  children: TreeDataBean[] = [];
  status?: boolean = false;
  ts?: string = '';
  startTime?: string = '';
  startNS?: string = '';
  level?: number;
  cycle?: number;
}
