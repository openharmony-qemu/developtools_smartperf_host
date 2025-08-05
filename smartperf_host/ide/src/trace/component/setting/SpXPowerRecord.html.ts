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

export const SpXPowerRecordHtml = `
<style>
:host{
    background: var(--dark-background3,#FFFFFF);
    border-radius: 0 16px 16px 0;
    display: inline-block;
    width: 100%;
    height: 100%;
}
.xpower-tracker {
    font-size:16px;
    margin-bottom: 30px;
    padding-top: 30px;
    padding-left: 54px;
    margin-right: 30px;
}
.xpower-config-div {
   width: 80%;
   display: flex;
   flex-direction: column;
   margin-top: 5vh;
   margin-bottom: 5vh;
   gap: 25px;
}

.xpower-title {
  text-align: center;
  line-height: 40px;
  font-weight: 700;
  margin-right: 10px;
  opacity: 0.9;
  font-family: Helvetica-Bold;
  font-size: 18px;
}
.xpower-switch {
  display:inline;
  float: right;
  height: 38px;
  margin-top: 10px;
}
.xpower-config-top {
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
.xpower-config-package-title{
  line-height: 40px;
}
.xpower-config-top-title{
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
</style>

<div class="xpower-tracker">
    <div class="xpower-config-div">
        <div>
            <span class="xpower-title">Start Xpower Record</span>
            <lit-switch class="xpower-switch"></lit-switch>
        </div>
        <div class="xpower-config-top">
            <div class="xpower-config-package-title">
                <span class="xpower-title">Package</span>
                <span class="config-title-des">Record package</span>
            </div>
            <lit-select-v rounded="" default-value=""
            class="record-type-select select config" placement="bottom" title="Package" placeholder="please select package"></lit-select-v>
        </div>
        <div class="xpower-config-top">
            <div class="xpower-config-top-title">
                <span class="xpower-title config-title">MessageType</span>
                <span class="config-title-des">Record MessageType</span>
            </div>
        </div>
    </div>
</div>
        `;