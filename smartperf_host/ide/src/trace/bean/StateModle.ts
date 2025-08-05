/*
 * Copyright (C) 2024 Huawei Device Co., Ltd.
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
export class StateGroup {
  SleepingCount: number = 0;
  RunningCount: number = 0;
  RunnableCount: number = 0;
  DCount: number = 0;
  RunningDur: number = 0;
  RunnableDur: number = 0;
  SleepingDur: number = 0;
  DDur: number = 0;
  title?: string = '';
  pid: number = 0;
  tid: number = 0;
  ts: number = 0;
  dur?: number = 0;
  type: string = '';
  state?: string = '';
  children?: Array<StateGroup>;
  isSelected?: boolean = false;
  totalCount?: number = 0;
  cycleDur?: number | string = 0;
  cycle: number = 0;
  id?: number;
  cpu?: number = 0;
  startTs?: number = 0;
  chartDur?: number = 0;
}

export class FuncNameCycle {
  funcName: string = '';
  cycleStartTime: number = 0;
  cycleDur: number = 0;
  startTime: number = 0;
  endTime: number = 0;
  id: number = 0;
  tid: number = 0;
  pid: number = 0;
}
