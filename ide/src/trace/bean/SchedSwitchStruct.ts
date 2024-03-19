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

export class TreeSwitchConfig {
  count: number = 0;
  cycleNum: number = 1;
  duration!: number | string | undefined;
  isHover?: boolean = false;
  isSelected?: boolean = false;
  cycle?: number = 0;
  level: string = '';
  pid: number = -1;
  process: string | undefined;
  state?: string = '';
  status?: boolean = false;
  thread: string | undefined;
  tid: number = -1;
  title: string = '';
  ts?: string = '';
  cycleStartTime!: number | string | undefined;
  children: Array<TreeSwitchConfig> = [];
}

export class HistogramSourceConfig {
  average: number = 0;
  color: string = '';
  count: number = 0;
  cycleNum: number = 0;
  isHover: boolean = false;
  size: string = '';
}

export class ThreadInitConfig {
  dur: number = 0;
  endTs: number = 0;
  id: number = 0;
  pid: number = -1;
  state: string = '';
  tid: number = -1;
  ts: number = -1;
  type: string = '';
}

export class SchedThreadCutConfig {
  cycleEndTime: number = 0;
  cycleStartTime: number = 0;
  funId: number = 0;
  name: string = '';
  pid: number = -1;
  runningCnt: number = 0;
  state: string = '';
  tid: number = -1;
  process?: string = '';
  thread?: string = '';
  dur?: number = 0;
  leftNS?: number = 0;
}
