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

export interface BurialPointRequestBody {
  action: string;
  event: string;
  ts?: number;
  eventData?: EventData;
}

export interface EventData {
  plugin?: Array<string>;
}

export interface pluginUsage {
  eventData: {
    plugin: Array<string>;
  }
}

export interface GeneralRecordRequest {
  ts: number,
  category: string, //'AI_STATISTIC'
  /*
    smart_luban:小鲁班
    large_model_q&a:AI问答
    large_model_detect:AI诊断
    user_feedback:用户反馈
  */
  /*
     'feedback_good,feedback_bad':诊断反馈
  */
  secondCat: string,
  thirdCat: Array<string>
}
