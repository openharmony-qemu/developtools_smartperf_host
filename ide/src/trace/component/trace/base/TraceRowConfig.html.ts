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
export const TraceRowConfigHtml = `
            <style>
                :host([hidden]) {
                    visibility: hidden;
                }
                :host{
                    visibility: visible;
                    background-color: #F6F6F6;
                    cursor: auto;
                }
                .config-title {
                    height: 100px;
                    border-top: 1px solid #D5D5D5;
                    background-color: #0A59F7;
                    display: flex;
                    align-items: center;
                    padding: 0 20px;
                }
                .title-text {
                    font-family: Helvetica-Bold;
                    font-size: 16px;
                    color: #FFFFFF;
                    text-align: left;
                    font-weight: 700;
                    margin-right: auto;
                }
                .config-close {
                    text-align: right;
                    cursor: pointer;
                    opacity: 1;
                }
                .config-close:hover {
                    opacity: 0.7;
                }
                .title_div{
                  display: flex;
                  flex-direction: row;
                  align-items: center;
                  padding-left: 15px;
                  padding-right: 20px;
                  background-color: #F6F6F6;
                  height: 3.4em;
                  flex-wrap: nowrap;
                }
                .config-scene-select {
                  height: auto;
                  max-height: 120px;
                  overflow-y: auto;
                  background: #FFFFFF;
                  overflow-x: hidden;
                  border-radius: 5px;
                  border: solid 1px #e0e0e0;
                }
                :host([temp_config]) .config-chart-select {
                  height: auto;
                  overflow-y: auto;
                  display: block;
                  padding: 0px;
                }
                .config-chart-select {
                  display: grid;
                  height: inherit;
                  padding: 10px 30px;
                  background: #FFFFFF;
                  overflow-y: scroll; 
                  overflow-x: hidden;
                  border-radius: 5px;
                  border: solid 1px #e0e0e0;
                  grid-template-columns: auto auto;
                  grid-template-rows: repeat(auto-fit, 35px);
                }
                .config-img {
                    margin-right: 12px;
                } 
                .chart-option-div {
                    height: 35px;
                    line-height: 35px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .scene-option-div {
                    height: 35px;
                    line-height: 35px;
                    margin-left: 28px;
                }
                .subsystem-div {
                    height: 35px;
                    line-height: 35px;
                    margin-left: 10px;
                    text-overflow: ellipsis;
                    overflow: hidden;
                }
                .chart-option {
                    height: 35px;
                    line-height: 35px;
                    margin-left: 75px;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    overflow: hidden;
                }
                input{
                    border: 0;
                    outline: none;
                    background-color: transparent;
                    cursor: pointer;
                    -webkit-user-select:none;
                    -moz-user-select:none;
                    user-select:none;
                    display: inline-flex;
                    width:100%;
                    color: rgba(0,0,0,0.6);
                }
                .multipleSelect{
                    outline: none;
                    font-size: 1rem;
                    -webkit-user-select:none;
                    -moz-user-select:none;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    user-select:none;
                    width: 80%;
                    margin-top: 2px;
                    color: #ffffff;
                    cursor: pointer;
                    line-height: 40px;
                    text-align: center;
                    border:1px solid #dcdcdc;
                    border-radius:16px;
                    background-color: #FFFFFF;
                    height: 30px;
                }
                .expand-icon:not([expansion]) {
                    transform: rotateZ(-90deg);
                }
                .layout {
                  display: grid; 
                  grid-template-columns: 80% 20%;
                }
                .scene-check-box {
                  justify-self: center; 
                  height: 100%;
                }
                .temp-icon {
                  padding-top:6px;
                  margin-left: 20px;
                  width: 20px;
                }
                #resetTemplate {
                  color:#999;
                  margin-left: 20px;
                  border:1px solid #d9caca;
                  border-radius: 10px;
                }
                #resetTemplate:hover {
                  background-color:#999;
                  color:#666;
                }
            </style>
            <div class="config-title">
               <span class="title-text">Display Template</span>
               <lit-icon class="config-close" name="close" title="Config Close" size="20">
               </lit-icon>
            </div>
            <div class="config-scene" style="display: contents;">
                <div class="title_div">
                  <img class="config-img" title="Template Select" src="img/config_scene.png">
                  <div>Template Select</div>
                </div>
            </div>
            <div class="config-select config-scene-select" id="scene-select"></div>
            <div class="config-chart" style="display: contents;">
                 <div class="title_div" style='justify-content: space-between;'>
                    <div style='display: flex;align-items: center'>
                      <img class="config-img" title="Timeline Details" src="img/config_chart.png" style="width:24px;height: 24px">
                      <div id="config_title">Timeline Details</div>
                      <button class="resetTemplate" id="resetTemplate">reset</button> 
                    </div>
                    <div style='display: flex;'>
                      <div class="multipleSelect" tabindex="0">
                          <div class="multipleRoot" id="select" style="width:100%">
                              <input id="singleInput"/> 
                          </div>
                          <lit-icon class="icon" name='search' color="#c3c3c3" style="margin-right: 10px;"></lit-icon>
                      </div>
                      <div style='display: flex;align-items: center;'>
                        <lit-icon id="switch-button" class="temp-icon" title="Show subSystem template" name="restore" size="30"></lit-icon>
                        <lit-icon id="open-file-icon" class="temp-icon" style="margin-left: 20px;display: none;" 
                        name="open-file" title="upload json" size="30"></lit-icon>
                        <input id="open-temp-file" style="display:none;pointer-events: none;" type="file"/>
                        <lit-icon id="export-file-icon" class="temp-icon" title="export json" style="margin-left: 20px;
                        display: none;" size="30" name="download-file"></lit-icon>
                      </div>
                    </div>
                </div>
            </div>
            <div class="config-select config-chart-select" id="chart-select">
            </div>
`;
