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
export interface Args {
  id: number;
  startNS: number;
  endNS: number;
  recordStartNS: number;
  recordEndNS: number;
  cpu: number;
  width: number;
  maxId: number;
  minId: number;
  filterId: number;
  drawType: number;
  ipid: number;
  pid: number;
  itid: number;
  tid: number;
  trackId: number;
  clockName: string;
  sqlType: string;
  type: number | string;
  typeArr: Array<number>;
  all: boolean;
  eventName: string;
  name: string;
  oneDayTime: number;
  moduleId: number;
  windowId: number;
  isPin: number;
  scratchId: number;
  minDur: number;
  xpowerName: string;
  valueType: string
}
