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

export const SpArkTsHtml = `<style>
:host{
    display: inline-block;
    width: 100%;
    height: 100%;
    background: var(--dark-background3,#FFFFFF);
    border-radius: 0px 16px 16px 0px;
}
.root {
    padding-top: 30px;
    padding-left: 54px;
    margin-right: 30px;
    font-size:16px;
    margin-bottom: 30px;
}
.config-div {
   width: 80%;
   display: flex;
   flex-direction: column;
   margin-top: 5vh;
   margin-bottom: 5vh;
   gap: 25px;
}
.title {
  opacity: 0.9;
  font-family: Helvetica-Bold;
  font-size: 18px;
  text-align: center;
  line-height: 40px;
  font-weight: 700;
  margin-right: 10px;
}
.config-title{
    margin-left: 20px;
    font-weight: 700;
    line-height: 48px;
}
.memory {
    margin-left: 40px;
}
.des {
  color: #242424;
    font-family: Helvetica;
    font-size: 14px;
    text-align: left;
    line-height: 16px;
    font-weight: 400;
}
.select {
  border-radius: 15px;
}
input {
   width: 35%;
   height: 25px;
   border:0;
   outline:none;
   border-radius: 16px;
   text-indent:2%
}
input::-webkit-input-placeholder{
    color:var(--bark-prompt,#999999);
}
.inputstyle{
    background: var(--dark-background5,#FFFFFF);
    border: 1px solid var(--dark-background5,#999999);
    font-family: Helvetica;
    font-size: 14px;
    color: var(--dark-color1,#212121);
    text-align: left;
    line-height: 16px;
    font-weight: 400;
}
.inputstyle::-webkit-input-placeholder {
   background: var(--dark-background5,#FFFFFF);
}
.radio {
    font-family: Helvetica-Bold;
    font-size: 16px;
    color: #000000;
    line-height: 28px;
    font-weight: 700;
}
.unit {
    font-family: Helvetica;
    font-size: 14px;
    color: #000000;
    line-height: 28px;
    font-weight: 400;
}
lit-switch {
  display:inline;
  float: right;
  height: 38px;
  margin-top: 10px;
}
:host([startSamp]) .inputBoxes {
    background: var(--dark-background5,#FFFFFF);
}
:host(:not([startSamp])) .inputBoxes {
    color: #b7b7b7;
    background: var(--dark-background1,#f5f5f5);
}
</style>
<div class="root">
    <div class="title" id="traceMode" style="text-align:left;">
        <span style='color: red'>Long trace mode! If current data Trace is too large, it may not open!</span>
    </div>
    <div class="config-div">
        <div>
          <span class="title">Start Ark Ts Record</span>
          <lit-switch></lit-switch>
        </div>
    </div>
    <div class="config-div">
        <div>
            <span class="title">Process</span>
            <span class="des">Record process</span>
        </div>
        <lit-select-v style="width: 100%;" rounded="" default-value="" class="select inputBoxes" 
        placement="bottom" ></lit-select-v>
    </div>
    <div class="config-div">
        <div>
            <span class="title">Select profiling type</span>
        </div>
        <div>
            <span class="config-title">Start cpu profiler</span>
            <lit-switch class="switch" id='cpu-switch'></lit-switch>
        </div>
        <div style="margin-left: 40px;">
            <span class="des">Interval(Available on recent OpenHarmony 4.0)</span>
            <div style="margin-top: 12px;">
                <input class="inputstyle inputBoxes" id='cpuInterval' type="text" id="interval" 
                placeholder="" onkeyup="this.value=this.value.replace(/\\D/g,'').replace(/^0{1,}/g,'')" value="1000">
                <span class="unit">μs</span>
            </div>
        </div>
        <div>
            <span class="config-title">Start memory profiler</span>
            <lit-switch class="switch" id='memory-switch'></lit-switch>
        </div>
        <div class='memory'>
            <lit-radio dis="round" class="radio" name="litRadio" checked type="0" id="heapsnapshot">Heap snapshot</lit-radio>
            <div style="margin-left: 10px;">
                <span class="des">Heap snapshot profiles show memory distribution among your page’s 
                JavaScript objects and related DOM nodes.</span>
                <div style="display: flex;margin-bottom: 12px;margin-top: 12px;">
                    <check-des-box checked="true" value ="lnclude numerical values in capture" id="snapshot">
                    </check-des-box>
                </div>
                <span class="des">Interval(Available on recent OpenHarmony 4.0)</span>
                <div style="margin-top: 12px;">
                    <input class="inputstyle inputBoxes" type="text" id="interval" placeholder="" 
                    onkeyup="this.value=this.value.replace(/\\D/g,'').replace(/^0{1,}/g,'')" value="10">
                    <span class="unit">S</span>
                </div>
            </div>
            <lit-radio dis="round" name="litRadio" class="radio" type="1" id="allcotimeline">
            Allocation insteumentation on timeline</lit-radio>
            <div style="margin-left: 10px;">
                <span class="des">Allocation timelines show insturmented Javascript memory allocations 
                over time. Once profile is recorded you can select a time interval to see objects that 
                werre allocated within it and still alive by the end of recording. Use this profile 
                type to isolate memory leaks.</span>
                <div style="display: flex;margin-top: 12px;">
                <check-des-box value ="record stack traces of allocations(extra performance overhead)" id="timeline">
                </check-des-box>
                </div>
            </div>
        </div>
    </、div>
</div>
`;
