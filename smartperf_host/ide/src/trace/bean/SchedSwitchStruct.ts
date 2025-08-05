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

export class ThreadInitConfig {
  endTs: number = 0;
  pid: number = -1;
  state: string = '';
  tid: number = -1;
  ts: number = -1;
  dur: number = -1;
  duration: number = -1;
  cycleStartTime: number = -1;
  cycleEndTime: number = -1;
}
export class SchedSwitchCountBean {
  nodeFlag: string | undefined;
  startNS: number;
  cycleStartTime: string = '';
  dur: number | string;
  duration: number | string;
  cycle: number = -1;
  title: string = '';
  value: number = 0;
  level: string = '';
  colorIndex: number = -1;
  children: Array<SchedSwitchCountBean> = [];
  constructor(
    nodeFlag: string | undefined,
    startNS: number,
    cycleStartTime: string,
    dur: number | string,
    duration: number | string,
    cycle: number,
    title: string,
    value: number,
    level: string,
    colorIndex: number,
    children: Array<SchedSwitchCountBean>
  ) {
    this.nodeFlag = nodeFlag;
    this.startNS = startNS;
    this.cycleStartTime = cycleStartTime;
    this.dur = dur;
    this.duration = duration;
    this.cycle = cycle;
    this.title = title;
    this.value = value;
    this.level = level;
    this.colorIndex = colorIndex;
    this.children = children;
  }
}
export class TreeSwitchConfig {
  value: number = 0;
  dur!: number | string | undefined;
  duration!: number | string | undefined;
  isHover?: boolean = false;
  isSelected?: boolean = false;
  cycle?: number = 0;
  level: string = '';
  pid: number = -1;
  process: string | undefined;
  status?: boolean = false;
  thread: string | undefined;
  tid: number = -1;
  title: string = '';
  cycleStartTime!: number | string | undefined;
  children: Array<TreeSwitchConfig> = [];
}
export class HistogramSourceConfig {
  average: number = 0;
  color: string = '';
  value: number = 0;
  cycleNum: number = 0;
  isHover: boolean = false;
  size: string = '';
}
export class CutDataObjConfig {
  cyclesArr: Array<SchedSwitchCountBean> = [];
  pid: number = -1;
  tid: number = -1;
  process: string | undefined;
  thread: string | undefined;
  processTitle: string = '';
  threadTitle: string = '';
  threadCountTotal: number = 0;
  threadDurTotal!: number | string;
}
