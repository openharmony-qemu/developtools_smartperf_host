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

import { ffrtEnumList } from './utils/PluginConvertUtils';

export const SpFFRTConfigHtml = `
<style>
:host{
  display: block;
  width: 100%;
  border-radius: 0 16px 16px 0;
  height: 100%;
}
.root {
  padding-top: 30px;
  padding-left: 54px;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: min-content 1fr min-content;
  width: 81%;
  border-radius: 0 16px 16px 0;
  margin-bottom: 30px;
  margin-right: 30px;
}
.input-select-item-content{
  display: flex;
  flex-direction: column;
  grid-gap: 15px;
  margin-top: 40px;
  grid-column: 1 / 3;
  width: 100%;
}

.switch-item-content{
  margin-top: 40px;
  width: 92%;
}
input {
  width: 72%;
  height: 25px;
  border:0;
  outline:none;
  border-radius: 16px;
  text-indent:2%
}
input::-webkit-input-placeholder{
  color:var(--bark-prompt,#999999);
}

input::-webkit-input-placeholder{
  background: var(--dark-background5,#FFFFFF);
}
.item-title {
  font-family: Helvetica,serif;
  text-align: left;
  line-height: 40px;
  font-weight: 700;
  margin-right: 10px;
  opacity: 0.9;
  font-size: 18px;
}
input:disabled {
  cursor: no-drop;
}
.title {
  grid-column: span 2 / auto;
  margin-top: 5vh;
}
#switch-disabled, .lts {
  display: inline;
  float: right;
}
.processSelect {
  border-radius: 15px;
  width: 92%;
  height: 27px;
}
.input-item-content {
  flex-wrap: wrap;
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 92%;
  grid-column: 1 / 3;
  margin-top: 40px;
}
.clock-type-select {
  border-radius: 15px;
  width: 50%;
}
.clock-item-content {
  flex-wrap: wrap;
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 40px;
  width: 92%;
  grid-column: 1 / 3;
}
.item-description {
  opacity: 0.6;
  font-family: Helvetica;
  line-height: 35px;
  text-align: left;
  font-weight: 400;
  font-size: 14px;
}
.input-content{
  background: var(--dark-background5,#FFFFFF);
  border: 1px solid var(--dark-background5,#ccc);
  font-family: Helvetica;
  font-size: 14px;
  color: var(--dark-color1,#212121);
  text-align: left;
  line-height: 16px;
  font-weight: 400;
}

input::-webkit-input-placeholder{
  background: var(--dark-background5,#FFFFFF);
}

:host([startSamp]) .input-content {
  background: var(--dark-background5,#FFFFFF);
}

:host(:not([startSamp])) .input-content {
  color: #b7b7b7;
  background: var(--dark-background1,#f5f5f5);
}

</style>
<div class="root">
  <div class="title" style="width: 92%;">
    <span class="item-title">Start FFRT Record</span>
    <lit-switch id="switch-disabled"></lit-switch>
  </div>
  <!-- process id -->
  <div class="input-select-item-content" id="process-div" style="grid-column: 1 / 3;">
    <div>
      <span class="item-title">Process</span>
      <span class="item-description">Record process id</span>
    </div>
    <lit-select-v class="processSelect" id="process-ids" rounded mode="multiple" default-value="" id="pid"
    placement="bottom" title="process" placeholder="please select process id">
    </lit-select-v>
  </div>
  <!-- Startup Process -->
  <div class="input-select-item-content" id="startup-process-div" style="grid-column: 1 / 3;">
    <div>
      <span class="item-title">Startup Process</span>
      <span class="item-description">Record startup package name</span>
    </div>
    <lit-select-v default-value="" rounded="" class="processSelect" canInsert="" id="startup-process-names"
    title="package" rounded placement = "bottom" placeholder="please select package name" showSearchInput>
    </lit-select-v>
  </div>
  <!-- Restart Process -->
  <div class="input-select-item-content" id="restart-process-div" style="grid-column: 1 / 3;">
    <div>
      <span class="item-title">Restart Process</span>
      <span class="item-description">Record restart process name</span>
    </div>
    <lit-select-v class="processSelect" id="restart-process-names" rounded mode="multiple" default-value="" id="pid"
    placement="bottom" title="process" placeholder="please select restart process name">
    </lit-select-v>
  </div>
  <!-- Use block -->
  <div class="switch-item-content" id="block-div" style="align-items: center;grid-column: 1 / 3;">
    <span class="item-title">Use Block</span>
    <lit-switch class="lts" id="use_block_switch" title="block model" checked="true"></lit-switch>
  </div>
  <!-- Smb Pages -->
  <div class="input-item-content" id="smb-pages-div">
    <span class="item-title">Smb Pages Size</span>
    <span class="item-description" style="margin-right: auto;">Range is 0 - 131072, default 16384 page (One page equals 4 KB)</span>
    <input id = "smb-pages" style="width: auto;" class="input-content" type="text"
      placeholder="Enter the Smb Pages Size" 
      oninput="if(this.value > 131072){this.value = '131072'} if(this.value > 0 &&
      this.value.toString().startsWith('0')){ this.value = Number(this.value) }"
      onkeyup="this.value=this.value.replace(/\\D/g,'')" value="16384">
  </div>
  <!-- Flush Interval -->
  <div class="input-item-content" id="flush-interval-div">
    <span class="item-title" >flush interval</span>
    <span class="item-description" style="margin-right: auto;">Rang is 0 - 20, default 5</span>
    <input id= "flush-interval" style="width: auto;" class="input-content" type="text"
    placeholder="Enter the flush interval" 
    oninput="if(this.value > 20){this.value = '20'} if(this.value > 0 && 
    this.value.toString().startsWith('0')){ this.value = Number(this.value) }"
    onkeyup="this.value=this.value.replace(/\\D/g,'')" value="5">
  </div>
  <!-- Clock Id -->
  <div class="clock-item-content">
    <div style="margin-right: auto;">
      <span class="item-title">Clock Id</span>
      <span class="item-description">Record clock type id</span>
    </div>
    <lit-select default-value="" rounded="" id="clock-type" class="clock-type-select" canInsert="" 
    title="Select Clock Id" rounded placement = "top" placeholder="BOOTTIME">
      ${ffrtEnumList.map((clockId): string => `<lit-select-option class="div-button" 
      value="${clockId}">${clockId}</lit-select-option>`).join('')}
    </lit-select>
  </div>
</div>
`;

