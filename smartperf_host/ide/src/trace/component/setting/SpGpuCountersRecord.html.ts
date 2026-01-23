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
export const SpGpuCountersRecordHtml = `
<style>
:host{
    background: var(--dark-background3,#FFFFFF);
    border-radius: 0 16px 16px 0;
    display: inline-block;
    width: 100%;
    height: 100%;
}
.gpu-counters-tracker {
    font-size:16px;
    margin-bottom: 30px;
    padding-top: 30px;
    padding-left: 54px;
    margin-right: 30px;
}
.gpu-counters-config-div {
   width: 80%;
   display: flex;
   flex-direction: column;
   margin-top: 5vh;
   margin-bottom: 5vh;
   gap: 25px;
}

.gpu-counters-title {
  text-align: center;
  line-height: 40px;
  font-weight: 700;
  margin-right: 10px;
  opacity: 0.9;
  font-family: Helvetica-Bold;
  font-size: 18px;
}
.gpu-counters-switch {
  display:inline;
  float: right;
  height: 38px;
  margin-top: 10px;
}
.gpu-counters-config {
   display: none;
   flex-direction: column;
   margin-top: 5vh;
   gap: 25px;
}
.config-title {
  line-height: 40px;
  font-weight: 700;
  margin-right: 10px;
  opacity: 0.9;
  font-family: Helvetica-Bold;
  font-size: 18px;
  text-align: center;
}
.config-title-des {
  line-height: 35px;
  font-weight: 400;
  opacity: 0.6;
  font-family: Helvetica;
  font-size: 14px;
  text-align: center;
}
.gpu-counters-config-package-title{
  line-height: 40px;
}
.gpu-counters-config-top-title{
  margin-bottom: 15px;
}
.record-type-input {
    line-height: 20px;
    font-weight: 400;
    border: 1px solid var(--dark-background5,#ccc);
    font-family: Helvetica;
    font-size: 14px;
    color: var(--dark-color1,#212121);
    text-align: left;
}
.record-type-select {
  border-radius: 15px;
  width: 100%;
}
.select{
  width: 100%;
  height: 27px;
}
#cpuCounters_p{
  background-color: var(--dark-background5,#FFFFFF)
   font-family: Helvetica-Bold;
   color:  var(--dark-color1,#8f8c8c);
   margin: 0;
   width: 100%;
   height: 25px;
   border-radius: 8px;
   outline: none;
   border: 1px solid #ccc;
   padding-left: 10px;
}
   .prompt{
    display: none;
    line-height: 35px;
    font-weight: 400;
    font-family: Helvetica;
    font-size: 14px;
    text-align: left;
    color: red;
   }
</style>

<div class="gpu-counters-tracker">
    <div class="gpu-counters-config-div">
        <div>
            <span class="gpu-counters-title">Start gpu-counters Record</span>
            <lit-switch class="gpu-counters-switch"></lit-switch>
        </div>
        <div class="gpu-counters-config">
            <div class="gpu-counters-config-package-title">
                <span class="gpu-counters-title">Period</span>
                <span class="config-title-des">(sampling period in milliseconds,range:1 - 1000,default to 100)</span>
            </div>
            <input id="cpuCounters_p" type="text" value='' maxlength = '4'>
            <span class="prompt">The value atmosphere is 1-1000</span>
            </div>
        </div>
    </div>
</div>
        `;