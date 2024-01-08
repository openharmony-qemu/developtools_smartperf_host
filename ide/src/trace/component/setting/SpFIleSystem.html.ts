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

export const SpFIleSystemHtml = `
<style>
.root {
    font-size:16px;
    margin-bottom: 30px;
    padding-top: 30px;
    padding-left: 54px;
    margin-right: 30px;
}
:host{
    display: inline-block;
    background: var(--dark-background3,#FFFFFF);
    border-radius: 0 16px 16px 0;
     width: 100%;
    height: 100%;
}
.file-system-config-div {
   display: flex;
   flex-direction: column;
   width: 80%;
   margin-top: 5vh;
   margin-bottom: 5vh;
   gap: 25px;
}

.file-system-title {
  line-height: 40px;
  font-weight: 700;
  margin-right: 10px;
  opacity: 0.9;
  font-family: Helvetica-Bold;
  font-size: 18px;
  text-align: center;
}

input {
   border-radius: 16px;
   text-indent:2%;
   height: 25px;
   outline:none;
}

.file-system-select {
  border-radius: 15px;
}

.file-system-des {
  line-height: 35px;
  font-weight: 400;
  opacity: 0.6;
  font-family: Helvetica;
  font-size: 14px;
  text-align: center;
}

lit-switch {
  height: 38px;
  margin-top: 10px;
  display:inline;
  float: right;
}

.fileSystem-input {
    color: var(--dark-color1,#212121);
    text-align: left;
    line-height: 20px;
    font-weight: 400;
    border: 1px solid var(--dark-background5,#ccc);
    font-family: Helvetica;
    font-size: 14px;
}

:host(:not([startSamp])) .fileSystem-input {
    color: #999999;
}

 :host([startSamp]) .fileSystem-input {
    background: var(--dark-background5,#FFFFFF);
}

input::-webkit-input-placeholder{
    color:var(--bark-prompt,#999999);
}
</style>
<div class="root">
  <div class="file-system-title" id="traceMode" style="text-align:left;">
    <span style='color: red'>Long trace mode! If current data Trace is too large, it may not open!</span>
  </div>
  <div class="file-system-config-div">
    <div>
       <span class="file-system-title">Start FileSystem Record</span>
       <lit-switch id="fileSystem"></lit-switch>
    </div>
  </div>
  <div class="file-system-config-div">
    <div>
       <span class="file-system-title">Start Page Fault Record</span>
       <lit-switch id="pageFault"></lit-switch>
    </div>
  </div>
  <div class="file-system-config-div">
    <div>
       <span class="file-system-title">Start BIO Latency Record</span>
       <lit-switch id="bioLatency"></lit-switch>
    </div>
  </div>
  <div class="file-system-config-div">
     <div>
         <span class="file-system-title">Process</span>
         <span class="file-system-des">Record process</span>
      </div>
    <lit-select-v default-value="" rounded="" class="file-system-select config" mode="multiple" canInsert="" 
    rounded placement = "bottom" title="Process"></lit-select-v>
  </div>
  <div class="file-system-config-div">
     <div>
         <span class="file-system-title">Max Unwind Level</span>
      </div>
    <input class="fileSystem-input config" title="Max Unwind Level" id="maxUnwindLevel" value="10"/>
  </div>
</div>
`;
