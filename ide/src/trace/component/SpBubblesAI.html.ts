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

export const SpBubblesAIHtml = `<style>
        #xiao-luban-help {
          visibility: hidden;
          width: 30px;
          height: 30px;
          border-radius: 15px;
          box-shadow: 0px 0px 10px #d9d9d9;
          background-color: var(--dark-background3,#FFFFFF);
          cursor: pointer;
          background-image: url('img/xiaoluban.jpg');
          background-repeat:no-repeat;
          background-position:center;
          background-size: 30px;
        }
        #xiao-luban-help[enabled] {
          visibility: visible;
        }
        </style>
        <div class="sp-bubbles-vessel">
         <div class="body" id="xiao-luban-help">
         </div>
        </div>
    `;
