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
    margin-left: 40px;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: min-content 1fr min-content;
    width: 90%;
    border-radius: 0 16px 16px 0;
    margin-bottom: 30px;
}
.allocation-inner-font-style {
    font-family: Helvetica,serif;
    font-size: 1em;
    color: var(--dark-color1,#000000);
    text-align: left;
    line-height: 20px;
    font-weight: 400;
    display:flex;
    width:75%; 
    margin-top: 3px;
   
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
    border: 0;
    border-radius: 3px;
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
}
.allocation-switchstyle{
   margin-top: 40px;
   display: flex;
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
.processSelect {
  border-radius: 15px;
  width: 84%;
}
.value-range {
  opacity: 0.6;
  font-family: Helvetica;
  font-size: 1em;
  color: var(--dark-color,#000000);
  text-align: left;
  line-height: 20px;
  font-weight: 400;
}
.record-title{
    margin-bottom: 16px;
    grid-column: span 3;
}
#interval-slider {
    margin: 0 8px;
    grid-column: span 2;
}
.resultSize{
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: min-content min-content;
    background-color: var(--dark-background5,#F2F2F2);
    -webkit-appearance:none;
    color: var(--dark-color,#6a6f77);
    width: 150px;
    margin: 0 30px 0 0;
    height: 40px;
    border-radius:20px;
    outline:0;
    border:1px solid var(--dark-border,#c8cccf);
}
.record-mode{
    font-family: Helvetica-Bold;
    font-size: 1em;
    color: var(--dark-color1,#000000);
    line-height: 28px;
    font-weight: 400;
    margin-bottom: 16px;
    grid-column: span 1;
}
.allocation-record-prompt{
      opacity: 0.6;
      font-family: Helvetica;
      font-size: 14px;
      text-align: center;
      line-height: 35px;
      font-weight: 400;
}
.interval-result{
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
  height: 38px;
  margin-top: 10px;
  display: inline;
  float: right;
}

</style>
<div class="root">
  <div class = "title" style="width: 92%;">
    <span class="allocation-title">Start Native Memory Record</span>
    <lit-switch id="switch-disabled"></lit-switch>
  </div>
  <div class="allocation-application">
     <span class="allocation-inner-font-style">ProcessId or ProcessName</span>
     <span class="value-range">Record process</span>
     <lit-select-v class="processSelect" rounded mode="multiple" default-value="" id="pid" 
     placement="bottom" title="process" placeholder="please select process">
     </lit-select-v>
  </div>
  <div class="allocation-application">
    <span class="allocation-inner-font-style" >Max unwind level</span>
    <span class="value-range">Max Unwind Level Rang is 0 - 512, default 10</span>
    <input id= "unwind"  class="allocation-inputstyle inputBoxes" type="text" 
    placeholder="Enter the Max Unwind Level" 
    oninput="if(this.value > 512){this.value = '512'} if(this.value > 0 && 
    this.value.toString().startsWith('0')){ this.value = Number(this.value) }"  
    onkeyup="this.value=this.value.replace(/\\D/g,'')" value="10">
  </div>
  <div class="allocation-application">
    <span class="allocation-inner-font-style">Shared Memory Size (One page equals 4 KB)</span>
    <span class="value-range">Shared Memory Size Range is 0 - 131072 page, default 16384 page</span>
    <div>
      <input id = "shareMemory" class="allocation-inputstyle inputBoxes" type="text" 
      placeholder="Enter the Shared Memory Size" 
      oninput="if(this.value > 131072){this.value = '131072'} if(this.value > 0 && 
      this.value.toString().startsWith('0')){ this.value = Number(this.value) }" 
      onkeyup="this.value=this.value.replace(/\\D/g,'')" value="16384">
      <span>Page</span>
    </div>
  </div>
  <div class="allocation-application">
    <span class="allocation-inner-font-style" >Filter Memory Size </span>
    <span class="value-range">Filter size Range is 0 - 65535 byte, default 0 byte</span> 
    <div>
         <input id = "filterSized" class="allocation-inputstyle inputBoxes" type="text" 
         placeholder="Enter the Filter Memory Size" 
         oninput="if(this.value > 65535){this.value = '65535'} if(this.value > 0 && 
         this.value.toString().startsWith('0')){ this.value = Number(this.value) }" 
         onkeyup="this.value=this.value.replace(/\\D/g,'')" value="0">
         <span>Byte</span>
    </div>
  </div>
  <div class="allocation-switchstyle">
      <span class="allocation-inner-font-style" id="fp-unwind">Use Fp Unwind</span>               
      <lit-switch class="lts" id="use_fp_unwind" title="fp unwind" checked="true"></lit-switch>
  </div>
  <div class="allocation-switchstyle version-controller" style="flex-wrap: wrap;grid-gap: 15px;">
    <span class="allocation-inner-font-style" >Sample Interval (Available on recent OpenHarmony 4.0)</span>
    <span class="value-range">Max Sample Interval Rang is 0 - 65535, default 0</span>
    <input id= "sample-interval-input"  class="allocation-inputstyle inputBoxes" type="text" 
    placeholder="Enter the sample interval" 
    oninput="if(this.value > 65535){this.value = '65535'} if(this.value < 0 && 
    this.value.toString().startsWith('0')){ this.value = '1'}"  
    onkeyup="this.value=this.value.replace(/\\D/g,'')" value="0">
  </div>
  <div class="allocation-switchstyle version-controller">
      <span class="allocation-inner-font-style" id="record_accurately ">
      Use Record Accurately (Available on recent OpenHarmony 4.0)</span> 
      <lit-switch   class="lts" id="use_record_accurately" title="record_accurately" checked="true"></lit-switch>
  </div>
  <div class="allocation-switchstyle version-controller">
      <span class="allocation-inner-font-style" id="offline_symbolization">
      Use Offline Symbolization (Available on recent OpenHarmony 4.0)</span> 
      <lit-switch class="lts" id="use_offline_symbolization" title="offline_symbolization" checked="true"></lit-switch>
  </div>
   <div class="allocation-switchstyle version-controller">
      <span class="allocation-inner-font-style" id="startup_mode">
      Use Startup Mode (Available on recent OpenHarmony 4.0)</span> 
      <lit-switch class="lts" id="use_startup_mode" title="startup_mode"></lit-switch>
  </div>   
  <div class="allocation-switchstyle version-controller">
      <span class="allocation-inner-font-style" id="response_lib_mode_span">
      Use Response Lib Mode (Available on recent OpenHarmony 4.0)</span> 
      <lit-switch class="lts" id="response_lib_mode" title="response_lib_mode"></lit-switch>
  </div>
  <div class="allocation-switchstyle record-statistics-result version-controller" 
  style="grid-row: 8; grid-column: 1 / 3;height: min-content;display: grid;grid-template-rows: 1fr;
  grid-template-columns: 1fr min-content;">
    <div class="record-title">
        <span class="record-mode">Use Record Statistics (Available on recent OpenHarmony 4.0)</span> 
        <span class="allocation-record-prompt"> Time between following interval (0 = disabled) </span>
    </div>
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
</div>
`;
