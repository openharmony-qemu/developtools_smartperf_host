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

export class CpuUsage {
  cpu: number = 0;
  usage: number = 0;
  usageStr: string = '';
  top1: number = 0;
  top2: number = 0;
  top3: number = 0;
  top1Percent: number = 0;
  top1PercentStr: string = '';
  top2Percent: number = 0;
  top2PercentStr: string = '';
  top3Percent: number = 0;
  top3PercentStr: string = '';
}

export class Freq {
  cpu: number = 0;
  value: number = 0;
  startNs: number = 0;
  dur: number = 0;
}
