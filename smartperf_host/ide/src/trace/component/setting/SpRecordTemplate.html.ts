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

export const SpRecordTemplateHtml = `
<style>
.template-config-div {
  flex-direction: column;
  margin-bottom: 3vh;
  width: 80%;
  display: flex;
}
.template-title {
    line-height: 40px;
    font-weight: 700;
    margin-right: 10px;
    opacity: 0.9;
    font-family: Helvetica-Bold;
    font-size: 18px;
    text-align: center;
}
:host{
    background: var(--dark-background3,#FFFFFF);
    border-radius: 0 16px 16px 0;
    display: inline-block;
    width: 100%;
    height: 100%;
 }
 .root {
    font-size:16px;
    width: 100%;
    height: 95%;
    padding-top: 50px;
    padding-left: 54px;
    margin-right: 30px;
    margin-bottom: 30px;
}
.config_switch {
     display: inline;
     float: right;
     height: 38px;
     margin-top: 10px;
}
.napi-option, .napi_packageSelect {
     border-radius: 15px;
     width: 50%;
     height: 27px;
}
</style>
<div class="root">
    <div class="template-config-div">
       <div>
         <span class="template-title">FrameTimeline</span>
         <lit-switch class="config_switch" id="frame_timeline" name="FrameTimeline"></lit-switch>
       </div>
    </div>
     <div class="template-config-div">
       <div>
         <span class="template-title">SchedulingAnalysis</span>
         <lit-switch class="config_switch" id="scheduling_analysis" name="SchedulingAnalysis"></lit-switch>
       </div>
    </div>
    <div class="template-config-div">
       <div>
         <span class="template-title">AppStartup</span>
         <lit-switch class="config_switch" id="app_startup" name="AppStartup"></lit-switch>
       </div>
    </div>
    <div class="template-config-div">
       <div>
         <span class="template-title">TaskPool</span>
         <lit-switch class="config_switch" id="task_pool" name="TaskPool"></lit-switch>
       </div>
    </div>
    <div class="template-config-div">
       <div>
         <span class="template-title">AnimationAnalysis</span>
         <lit-switch class="config_switch" id="dynamic_effect" name="AnimationAnalysis"></lit-switch>
       </div>
    </div> 
    <div class="template-config-div">
         <div>
           <span class="template-title">Napi</span>
           <lit-switch class="config_switch" id="Napi" name="Napi"></lit-switch>
         </div>
         <div class="napi-option">
            <lit-select-v default-value="" class="napi_packageSelect" id="napi_packageName" title="package" rounded placement = "bottom" placeholder="please select package">
            </lit-select-v>
         </div>
    </div>
</div>
`;
