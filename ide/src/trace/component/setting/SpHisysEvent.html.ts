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

export const SpHiSysEventHtml = `<style>
        :host{
          background: var(--dark-background3,#FFFFFF);
          display: inline-block;
          width: 100%;
          height: 100%;
          border-radius: 0px 16px 16px 0px;
        }
        :host([startSamp]) .record-input {
          background: var(--dark-background5,#FFFFFF);
        }
        :host(:not([startSamp])) .record-input {
          color: #999999;
        }
        .root {
          margin-bottom: 30px;
          padding-top: 30px;
          padding-left: 54px;
          margin-right: 30px;
          font-size:16px;
        }
        .hisys-event-config {
          width: 80%;
          display: flex;
          flex-direction: column;
          gap: 25px;
          margin-top: 5vh;
          margin-bottom: 5vh;
        }
        .event-title {
          font-weight: 700;
          opacity: 0.9;
          font-family: Helvetica-Bold;
          font-size: 18px;
          text-align: center;
          line-height: 40px;
          margin-right: 10px;
        }
        .event-des {
          font-size: 14px;
          opacity: 0.6;
          line-height: 35px;
          font-family: Helvetica;
          text-align: center;
          font-weight: 400;
        }
        lit-switch {
          height: 38px;
          margin-top: 10px;
          display:inline;
          float: right;
        }
        .record-input {
          line-height: 20px;
          font-weight: 400;
          border: 1px solid var(--dark-background5,#ccc);
          font-family: Helvetica;
          font-size: 14px;
          color: var(--dark-color1,#212121);
          text-align: left;
          width: auto;
        }
        </style>
        <div class="root">
          <div class="hisys-event-config">
              <div>
                 <span class="event-title">Start Hisystem Event Tracker Record</span>
                 <lit-switch></lit-switch>
              </div>
          </div>
          <div class="hisys-event-config">
              <div>
                 <span class="event-title">Domain</span>
                 <span class="event-des">Record Domain Name</span>
              </div>
              <lit-select-v default-value="" rounded="" class="record-domain-input record-input" 
              mode="multiple" canInsert="" title="Select Proces" placement="bottom" placeholder="ALL-Domain" readonly="readonly">
              </lit-select-v>
          </div>
          <div class="hisys-event-config">
              <div>
                 <span class="event-title">EventName</span>
                 <span class="event-des">Record Event Name</span>
              </div>
              <lit-select-v default-value="" rounded="" class="record-event-input record-input" 
              mode="multiple" canInsert="" title="Select Proces" placement="bottom" placeholder="ALL-Event" readonly="readonly">
              </lit-select-v>
          </div>
        </div>`;
