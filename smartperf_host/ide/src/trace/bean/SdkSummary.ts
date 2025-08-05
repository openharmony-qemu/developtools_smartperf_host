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

export class CounterSummary {
  value: number = 0;
  ts: number = 0;
  counter_id: number = 0;
}

export class SdkSliceSummary {
  start_ts: number = 0;
  startTime: number = 0;
  end_ts: number = 0;
  endTime: number = 0;
  value: number = 0;
  slice_id: number = 0;
  slice_name: string = '';
  slice_message: string = '';
}
