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

export const SpVmTrackerHtml = `
<style>
:host{
    background: var(--dark-background3,#FFFFFF);
    border-radius: 0 16px 16px 0;
    display: inline-block;
    width: 100%;
    height: 100%;
}

.vm-tracker {
    font-size:16px;
    margin-bottom: 30px;
    padding-top: 30px;
    padding-left: 54px;
    margin-right: 30px;
}

.title {
  text-align: center;
  line-height: 40px;
  font-weight: 700;
  margin-right: 10px;
  opacity: 0.9;
  font-family: Helvetica-Bold;
  font-size: 18px;
}

.vm-config-div {
   width: 80%;
   display: flex;
   flex-direction: column;
   margin-top: 5vh;
   margin-bottom: 5vh;
   gap: 25px;
}

.des {
  text-align: center;
  line-height: 35px;
  font-weight: 400;
  opacity: 0.6;
  font-family: Helvetica;
  font-size: 14px;
}

.select {
  border-radius: 15px;
}

lit-switch {
  display:inline;
  float: right;
  height: 38px;
  margin-top: 10px;
}

input::-webkit-input-placeholder{
    color:var(--bark-prompt,#999999);
}

.input {
    text-align: left;
    line-height: 20px;
    font-weight: 400;
    border: 1px solid var(--dark-background5,#ccc);
    font-family: Helvetica;
    font-size: 14px;
    color: var(--dark-color1,#212121);
}

:host([startSamp]) .input {
    background: var(--dark-background5,#FFFFFF);
}

input {
   outline:none;
   border-radius: 16px;
   height: 25px;
   text-indent:2%
}

:host(:not([startSamp])) .input {
    color: #999999;
}
</style>
<div class="root vm-tracker">
    <div class="vm-config-div">
      <div>
         <span class="title">Start VM Tracker Record</span>
         <lit-switch></lit-switch>
      </div>
    </div>
    <div class="vm-config-div">
      <div>
         <span class="title">Process</span>
         <span class="des">Record process</span>
      </div>
      <lit-select-v style="width: 100%;" rounded="" default-value="" 
      class="select config" placement="bottom" title="Process"></lit-select-v>
  </div>
</div>
`;
