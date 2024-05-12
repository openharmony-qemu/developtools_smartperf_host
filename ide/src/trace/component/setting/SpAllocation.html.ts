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

export const SpAllocationHtml = `
<style>
:host{
  display: block;
  width: 100%;
  border-radius: 0 16px 16px 0;
  height: 100%;
}
.title {
  grid-column: span 2 / auto;
  margin-top: 5vh;
}
.allocation-font-style{
  font-family: Helvetica-Bold;
  font-size: 1em;
  color: var(--dark-color1,#000000);
  line-height: 28px;
  font-weight: 700;
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
.allocation-inner-font-style {
  font-family: Helvetica,serif;
  text-align: left;
  line-height: 40px;
  font-weight: 700;
  margin-right: 10px;
  opacity: 0.9;
  font-size: 18px;
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
.allocation-select {
  height: 30px;
  outline: none;
  border: 1px solid var(--dark-border,#B3B3B3);
  width: 60px;
  background-color:var(--dark-background5, #FFFFFF)
  font-family: Helvetica;
  font-size: 14px;
  color: var(--dark-color,#212121)
  text-align: center;
  line-height: 16px;
  font-weight: 400;
  border-radius: 16px;
}
.allocation-application{
  display: flex;
  flex-direction: column;
  grid-gap: 15px;
  margin-top: 40px;
  grid-column: 1 / 3;
}
.allocation-switchstyle{
  margin-top: 40px;
  width: 92%;
}
.allocation-inputstyle{
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

:host([startSamp]) .allocation-inputstyle {
  background: var(--dark-background5,#FFFFFF);
}

:host(:not([startSamp])) .allocation-inputstyle {
  color: #b7b7b7;
  background: var(--dark-background1,#f5f5f5);
}

#one_mb{
  background-color:var(--dark-background5, #FFFFFF)
}
#one_kb{
  background-color:var(--dark-background5, #FFFFFF)
}
#two_mb{
  background-color:var(--dark-background5, #FFFFFF)
}
#two_kb{
  background-color:var(--dark-background5, #FFFFFF)
}
.processSelect, .packageSelect {
  border-radius: 15px;
  width: 92%;
  height: 27px;
}
.value-range {
  opacity: 0.6;
  font-family: Helvetica;
  line-height: 35px;
  text-align: center;
  font-weight: 400;
  font-size: 14px;
}
.record-title{
  margin-bottom: 16px;
  grid-column: 1 / 3;
  width: auto;
}
#interval-slider {
  margin: 0 8px;
  grid-column: 1 / 2;
}
.resultSize{
  display: grid;
  grid-template-rows: 1fr;
  grid-template-columns: min-content min-content;
  background-color: var(--dark-background5,#F2F2F2);
  -webkit-appearance:none;
  color: var(--dark-color,#6a6f77);
  width: 150px;
  height: 40px;
  border-radius:20px;
  outline:0;
  border:1px solid var(--dark-border,#c8cccf);
}
.record-mode{
  font-family: Helvetica,serif;
  font-size: 18px;
  color: var(--dark-color1,#000000);
  line-height: 40px;
  font-weight: 700;
  margin-bottom: 16px;
  grid-column: span 1;
  text-align: left;
  margin-right: 10px;
  opacity: 0.9;
}
.record-mode-available {
  opacity: 0.6;
  font-family: Helvetica;
  line-height: 35px;
  text-align: left;
  font-weight: 400;
  font-size: 14px;
}
.allocation-record-prompt{
  opacity: 0.6;
  font-family: Helvetica;
  font-size: 14px;
  line-height: 35px;
  font-weight: 400;
  grid-column: 1 / 3;
  text-align: left;
  width: 50%;
}
.interval-result {
  -webkit-appearance:none;
  border: none;
  text-align: center;
  width: 90px;
  font-size:14px;
  outline:0;
  margin: 5px 0 5px 5px;
  background-color: var(--dark-background5,#F2F2F2);
  color:var(--dark-color,#6a6f77);
}

.allocation-title {
  opacity: 0.9;
  font-family: Helvetica-Bold;
  margin-right: 10px;
  font-size: 18px;
  text-align: center;
  line-height: 40px;
  font-weight: 700;
}

lit-switch {
  display: inline;
  float: right;
}

#addOptions {
  border-radius: 15px;
  border-color:rgb(0,0,0,0.1);
  width: 150px;
  height: 40px;
  font-family: Helvetica;
  font-size: 1em;
  color: #FFFFFF;
  text-align: center;
  line-height: 20px;
  font-weight: 400;
  margin-right: 5%;
  float: right;
  grid-column: 2;
  justify-self: end;
}

:host(:not([startSamp])) #addOptions {
  background: #999999;
  cursor: no-drop;
}
:host([startSamp]) #addOptions {
  background: #3391FF;
  cursor: default;
}

.divider {
  position: absolute;
  border-top: 1px dashed rgba(0, 0, 0, 0.5);
  width: 80%;
  opacity: 0.3;
  align-self: center;
}
.advance-option-div {
  display: none;
  flex-direction: row;
  grid-column: 1 / 3;
  align-items: center;
  width: 92%;
}

input:disabled {
  cursor: no-drop;
}

</style>
<div class="root">
  <div class = "title" style="width: 92%;">
    <span class="allocation-title">Start Native Memory Record</span>
    <lit-switch id="switch-disabled"></lit-switch>
  </div>
  <!-- ProcessId or ProcessName(default) -->
  <div class="allocation-application" style="grid-column: 1 / 3;">
    <div>
      <span class="allocation-inner-font-style">Process</span>
      <span class="value-range">Record process id or process name</span>
    </div>
    <lit-select-v class="processSelect" rounded mode="multiple" default-value="" id="pid"
    placement="bottom" title="process" placeholder="please select process">
    </lit-select-v>
    <lit-select default-value="" rounded="" class="packageSelect" canInsert="" id="packageName"
    title="package" rounded placement = "bottom" placeholder="please select package" showSearchInput>
    </lit-select>
  </div>
  <!-- Use Fp Unwind(default) -->
  <div class="allocation-switchstyle" id="max_stack_depth_div" style="align-items: center;grid-column: 1 / 3;">
    <span class="allocation-inner-font-style" id="fp-unwind">Use Fp Unwind</span>
    <lit-switch class="lts" id="use_fp_unwind" title="fp unwind model" checked="true"></lit-switch>
  </div>
  <!-- Use Record Js Stack(default) -->
  <div class="allocation-switchstyle" style="align-items: center;grid-column: 1 / 3;">
    <span class="allocation-inner-font-style" id="record-js-stack">Use Record Js Stack</span>
    <lit-switch class="lts" id="use_js-stack" title="js stack model"></lit-switch>
  </div>
  <!-- Use statistics slide(default) -->
  <div class="allocation-switchstyle record-statistics-result version-controller"
  style="grid-row: 5; grid-column: 1 / 3;height: min-content;display: grid;grid-template-rows: 2fr;
  grid-template-columns: 1fr min-content;">
    <div class="record-title">
      <span class="record-mode">Use Record Statistics</span>
      <span class="record-mode-available">(Available on recent OpenHarmony 4.0)</span>
      <lit-switch class="lts" id="use_statistics" title="statistics model" checked="true"></lit-switch>
    </div>
    <span class="allocation-record-prompt"> Time between following interval (0 = disabled) </span>
    <lit-slider id="interval-slider" defaultColor="var(--dark-color3,#46B1E3)" open dir="right">
    </lit-slider>
    <div class='resultSize'>
      <input class="interval-result inputBoxes" type="text" value='0'
      onkeyup="this.value=this.value.replace(/\\D/g,'')"
      oninput="if(this.value > 3600){this.value = '3600'} if(this.value > 0 &&
      this.value.toString().startsWith('0')){ this.value = Number(this.value) }" >
      <span style="text-align: center; margin: 8px"> S </span>
    </div>
  </div>
  <!-- Advance Options(default) -->
  <div style="position: relative; display: grid; grid-column: 1 / 3;margin-top: 30px">
    <button id ="addOptions">Advance Options</button>
    <div class="divider"></div>
  </div>
  <!-- Use Startup Mode(advance) -->
   <div class="allocation-switchstyle version-controller advance-option-div" id="use-startup-el">
    <span class="allocation-inner-font-style" id="startup_mode">Use Startup Mode</span>
    <span class="record-mode-available" style="margin-right: auto;">(Available on recent OpenHarmony 4.0)</span>
    <lit-switch class="lts" id="use_startup_mode" title="startup_mode"></lit-switch>
  </div>
  <!-- Use Response Lib Mode(advance) -->
  <div class="allocation-switchstyle version-controller advance-option-div" id="use-response-lib-el">
    <span class="allocation-inner-font-style" id="response_lib_mode_span">Use Response Lib Mode</span>
    <span class="record-mode-available" style="margin-right: auto;">(Available on recent OpenHarmony 4.0)</span>
    <lit-switch class="lts" id="response_lib_mode" title="response_lib_mode"></lit-switch>
  </div>
  <!-- record_accurately(advance) -->
  <div class="allocation-switchstyle version-controller advance-option-div" id="record_accurately_div">
    <span class="allocation-inner-font-style" id="record_accurately ">Use Record Accurately</span>
    <span class="record-mode-available" style="margin-right: auto;">(Available on recent OpenHarmony 4.0)</span>
    <lit-switch class="lts" id="use_record_accurately" title="record_accurately" checked="true"></lit-switch>
  </div>
  <!-- offline_symbolization(advance) -->
  <div class="allocation-switchstyle version-controller advance-option-div" id="offline_symbolization_div">
    <span class="allocation-inner-font-style" id="offline_symbolization">Use Offline Symbolization</span>
    <span class="record-mode-available" style="margin-right: auto;">(Available on recent OpenHarmony 4.0)</span>
    <lit-switch class="lts" id="use_offline_symbolization" title="offline_symbolization" checked="true"></lit-switch>
  </div>
  <!-- Max Sample Interval Rang(advance) -->
  <div class="allocation-switchstyle version-controller advance-option-div" id="sample-interval-el" style="flex-wrap: wrap;">
    <span class="allocation-inner-font-style" id="statistics-interval-name">Sample Interval</span>
    <span class="record-mode-available" style="margin-right: auto;">(Available on recent OpenHarmony 4.0)</span>
    <span class="value-range" style="margin-right: auto;" id="statistics-interval-range">Rang is 0 - 65535, default 0 byte</span>
    <input id= "statistics-interval-input" style="width: auto;" class="allocation-inputstyle inputBoxes" type="text"
    placeholder="Enter the interval" value="0">
  </div>
  <!-- Shared Memory Size(advance) -->
  <div class="allocation-application advance-option-div" id="shared-memory-size-el">
    <span class="allocation-inner-font-style">Shared Memory Size</span>
    <span class="value-range" style="margin-right: auto;">Range is 0 - 131072, default 16384 page (One page equals 4 KB)</span>
    <input id = "shareMemory" style="width: auto;" class="allocation-inputstyle inputBoxes" type="text"
      placeholder="Enter the Shared Memory Size" 
      oninput="if(this.value > 131072){this.value = '131072'} if(this.value > 0 &&
      this.value.toString().startsWith('0')){ this.value = Number(this.value) }"
      onkeyup="this.value=this.value.replace(/\\D/g,'')" value="16384">
  </div>
  <!-- Max unwind level(advance) -->
  <div class="allocation-application advance-option-div" id="max-unwind-level-el">
    <span class="allocation-inner-font-style" >Max unwind level</span>
    <span class="value-range" style="margin-right: auto;">Rang is 0 - 512, default 20</span>
    <input id= "unwind" style="width: auto;" class="allocation-inputstyle inputBoxes" type="text"
    placeholder="Enter the Max Unwind Level" 
    oninput="if(this.value > 512){this.value = '512'} if(this.value > 0 && 
    this.value.toString().startsWith('0')){ this.value = Number(this.value) }"
    onkeyup="this.value=this.value.replace(/\\D/g,'')" value="20">
  </div>
  <!-- Max Js Stack Depth(advance) -->
  <div id="js-stack-depth-div" class="allocation-application advance-option-div">
    <span class="allocation-inner-font-style" >Max Js Stack Depth </span>
    <span class="value-range" style="margin-right: auto;">Range 0 - 128, default 20 </span>
    <input id = "jsStackDepth" class="allocation-inputstyle inputBoxes" style="width: auto;" type="text"
       placeholder="0"
       oninput="if(this.value > 128){this.value = '128'} if(this.value > 0 &&
       this.value.toString().startsWith('0')){ this.value = Number(this.value) }"
       onkeyup="this.value=this.value.replace(/\\D/g,'')" value="20">
  </div>
  <!-- Filter Memory Size(advance) -->
  <div class="allocation-application advance-option-div" id="filter-memory-size-el">
    <span class="allocation-inner-font-style" >Filter Memory Size </span>
    <span class="value-range" style="margin-right: auto;">Range is 0 - 65535, default 0 byte</span>
    <input id = "filterSized" style="width: auto;" class="allocation-inputstyle inputBoxes" type="text"
       placeholder="Enter the Filter Memory Size"
       oninput="if(this.value > 65535){this.value = '65535'} if(this.value > 0 &&
       this.value.toString().startsWith('0')){ this.value = Number(this.value) }"
       onkeyup="this.value=this.value.replace(/\\D/g,'')" value="0">
  </div>
  <!-- Filter Napi Name(advance) -->
  <div id="napi-div" class="allocation-application advance-option-div" style="margin-bottom: 40px;">
    <span class="allocation-inner-font-style" >Filter Napi Name </span>
    <span class="value-range" style="margin-right: auto;">napi name to filter</span>
    <input id = "napiName" class="allocation-inputstyle inputBoxes" style="width: 50%;" type="text"
       placeholder="enter the napi name" value="">
  </div>
</div>
`;
