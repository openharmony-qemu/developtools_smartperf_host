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
export interface BinderGroup {
  title: string | null | undefined;
  totalCount: number;
  binderAsyncRcvCount?: number;
  binderReplyCount?: number;
  binderTransactionAsyncCount?: number;
  binderTransactionCount?: number;
  tid: number;
  pid: number;
  children?: Array<BinderGroup>;
  status?: boolean;
}

export class CycleBinderItem {
  title: string = '';
  tid: number = 0;
  pid: number = 0;
  durNs: number = 0;
  tsNs: number = 0;
  cycleDur: number = 0;
  cycleStartTime: number = 0;
  totalCount: number = 0;
  binderTransactionCount: number = 0;
  binderAsyncRcvCount: number = 0;
  binderReplyCount: number = 0;
  binderTransactionAsyncCount: number = 0;
  idx: number = -1;
  type: string = 'Cycle';
}

export interface ThreadBinderItem {
  title: string;
  tid: number;
  pid: number;
  totalCount: number;
  type: string;
  children: Array<CycleBinderItem>;
}

export interface ProcessBinderItem {
  title: string;
  pid: number;
  totalCount: number;
  type: string;
  children: Array<ThreadBinderItem>;
}

export interface DataSource {
  xName: string;
  yAverage: number;
}

export interface FunctionItem {
  cycleStartTime: number;
  cycleDur: number;
  dur: number;
  id: number;
  tid: number;
  pid: number;
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

export interface BinderDataStruct {
  name: string;
  value: number;
  dur: number;
  startNS: number;
  cycle: number;
  depth?: number;
}

export interface BinderItem {
  name: string;
  ts: number;
  dur: number;
  tid: number;
  pid: number;
}
