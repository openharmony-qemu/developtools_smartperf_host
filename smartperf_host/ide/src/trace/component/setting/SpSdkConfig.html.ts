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

export const SpSdkConfigHtml = `
<style>
.sdk-config-div {
   flex-direction: column;
   width: 80%;
   display: flex;
   gap: 15px;
}
:host{
    display: inline-block;
    width: 100%;
    height: 100%;
    background: var(--dark-background3,#FFFFFF);
    border-radius: 0 16px 16px 0;
}
.root {
    font-size:16px;
    padding-left: 54px;
    margin-right: 30px;
    padding-top: 30px;
    margin-bottom: 30px;
}
:host([show]) .sdk-config-div {
   display: flex;
   flex-direction: column;
   margin-bottom: 1vh;
}

:host(:not([show])) .sdk-config-div {
   margin-top: 5vh;
   margin-bottom: 5vh;
   gap: 25px;
}

:host(:not([show])) .hidden {
   display: none;
}

.sdk-config-title {
  opacity: 0.9;
  line-height: 40px;
  font-family: Helvetica-Bold;
  font-size: 18px;
  text-align: center;
  font-weight: 700;
  margin-right: 10px;
}

.sdk-config-des {
  opacity: 0.6;
  font-family: Helvetica;
  font-size: 14px;
  text-align: center;
  line-height: 35px;
  font-weight: 400;
}

.sdk-config-select {
  border-radius: 15px;
}

input {
   height: 25px;
   outline:none;
   border-radius: 16px;
   text-indent:2%
}
input::-webkit-input-placeholder{
    color:var(--bark-prompt,#999999);
}
lit-switch {
  display:inline;
  float: right;
  height: 38px;
  margin-top: 10px;
}
.sdk-config-input {
    border: 1px solid var(--dark-background5,#ccc);
    font-family: Helvetica;
    font-size: 14px;
    color: var(--dark-color1,#212121);
    text-align: left;
    line-height: 20px;
    font-weight: 400;
}

:host([startSamp]) .sdk-config-input {
    background: var(--dark-background5,#FFFFFF);
}

:host(:not([startSamp])) .sdk-config-input {
    color: var(--dark-color1,#212121);
}

</style>
<div class="root">
    <div class="sdk-config-div">
        <div>
            <span class="sdk-config-title">Start Custom Config</span>
            <lit-switch class="config_switch" ></lit-switch>
        </div>
    </div>
    <div class="sdk-config-div" id="select_config">
        <lit-select-v show-search class="processSelect" rounded default-value="" 
        id="pid" placement="bottom" style="width:100%"></lit-select-v>
    </div>
    <div class="configList">
    </div>
</div>
`;
