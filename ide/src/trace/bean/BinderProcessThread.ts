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

export class BinderGroup {
  title: string | null | undefined = '';
  count: number = 0;
  totalCount: number = 0;
  binderAsyncRcvCount?: number = 0;
  binderReplyCount?: number = 0;
  binderTransactionAsyncCount?: number = 0;
  binderTransactionCount?: number = 0;
  tid: number = 0;
  pid: number = 0;
  thread: string = '';
  process: string = '';
  name: string = '';
  cycleStartTime: number = 0;
  cycleDur: number = 0;
  id: number = 0;
  children?: Array<BinderGroup>;
  type?: string = '';
  status?: boolean = false;
  idx: number = 0;
}

export class DataSource {
  xName: string = '';
  yAverage: number = 0;
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

export class BinderColumn {
   name: string = ''; 
   count: number = 0; 
   dur: number = 0; 
   startNS: number = 0; 
   idx: number = 0
}