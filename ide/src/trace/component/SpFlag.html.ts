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

export const SpFlagHtml = `<style>
        .sp-flags-vessel {
          background-color: var(--dark-background5,#F6F6F6);
          min-height: 100%;
          display: grid;
          grid-template-columns: 1fr;
          grid-template-rows:1fr;
        }
        :host{
          width: 100%;
          height: 100%;
          background-color: var(--dark-background5,#F6F6F6);
          display: block;
        }
        .body{
          width: 85%;
          margin: 2% 5% 2% 5%;
          background-color: var(--dark-background3,#FFFFFF);
          border-radius: 16px 16px 16px 16px;
          padding-left: 2%;
          padding-right: 4%;
        }
        .title {
          padding-left: 2%;
          margin-left: 8%;
        }
        .flag-widget {
          width: 80%;
          padding: 1% 2% 1% 2%;
          margin-left: 8%;
          margin-right: 8%;
          border-radius: 10px 10px 10px 10px;
        }
        .flag-widget:nth-child(2n+1) {
          background-color: #F5F5F5;
        }
        .flag-title-label {
          margin-right: 10px;
          flex-grow: 1;
          text-align: left;
          opacity: 0.9;
          font-family: Helvetica-Bold;
          font-size: 16px;
          color: #000000;
          line-height: 28px;
          font-weight: 700;
        }
        .flag-head-div {
          display: flex;
          align-items: center;
        }
        .flag-des-div {
          opacity: 0.6;
          font-family: Helvetica;
          font-size: 12px;
          color: var(--dark-color,#000000);
          text-align: left;
          line-height: 20px;
          font-weight: 400;
          margin-top: 0.1%;
        }
        .config_footer {
          margin-top: 1%;
        }
        .flag-select {
          width: 12rem;
          border: 1px solid var(--dark-color1,#4D4D4D);
          border-radius: 16px;
          opacity: 0.6;
          font-family: Helvetica;
          font-size: 12px;
          color: var(--dark-color1,#000000);
          text-align: center;
          line-height: 20px;
          font-weight: 400;
          -webkit-appearance: none;
          background: url(img/down.png) no-repeat 96% center;
        }
        .device_label {
          font-weight: 500;
          margin-right: 10px;
          opacity: 0.9;
          font-family: Helvetica-Bold;
          font-size: 14px;
        }
        .device_input {
          line-height: 20px;
          font-weight: 400;
          margin-right: 2%;
          border-radius: 16px;
          border: 1px solid #ccc;
          padding-left: 10px;
        }
        </style>
        <div class="sp-flags-vessel">
         <div class="body">
           <h3 class="title">Feature flags</h3>
         </div>
        </div>
    `;
