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

export const SpRecordTraceHtml = `
    <style>
    :host{
        display: block;
        height: 100%;
        width: 100%;
        background-color: var(--dark-background5,#F6F6F6);
    }
    .vessel {
        background-color: var(
        --dark-background5,#F6F6F6);
        height:100%;
    }

    .header {
      display: flex;
      background-color: var(--dark-background3,#FFFFFF);
      width: 100%;
      height: 90px;
    }

    .span-col-2{
        margin-right: 20px;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .header-right {
       display: flex;
       margin-left: auto;
       margin-right: 5%;
    }
    .header-des{
      font-family: PingFangSC-Regular;
      font-size: 1em;
      color:  #999999;
      text-align: left;
      font-weight: 400;
    }

    .target {
       opacity: 0.9;
       font-family: Helvetica;
       font-size: 14px;
       color: var(--dark-color2,#000000);
       line-height: 16px;
       font-weight: 400;
       white-space:nowrap;
       align-self: center;
    }

    .select{
       width: 300px;
       height: 32px;
       margin-left: 14px;
       margin-right: 10px;
       border: 1px solid var(--dark-color1,#4D4D4D);
       background: var(--dark-background1,#ffffff);
       font-size: 14px;
       border-radius: 16px;
       opacity: 0.6;
       -webkit-appearance: none;
       font-family: Helvetica;
       color: var(--dark-color1,#000000);
       line-height: 20px;
       font-weight: 400;
       padding: 5px 10px 5px 10px;
       text-align: center;
       background: url('img/down.png') no-repeat 96% center;
    }
    .device_version {
       width: 200px;
       height: 32px;
       margin-left: 5px;
       margin-right: 24px;
       background: var(--dark-background1,#ffffff);
       border: 1px solid var(--dark-color1,#4D4D4D);
       border-radius: 16px;
       opacity: 0.6;
       font-family: Helvetica;
       font-size: 14px;
       color: var(--dark-color1,#000000);
       text-align: center;
       line-height: 20px;
       font-weight: 400;
       padding: 5px 10px 5px 10px;
       -webkit-appearance: none;
       background: url('img/down.png') no-repeat 96% center;
    }
    .body{
        width: 90%;
        height:80vh;
        margin-left: 3%;
        margin-top: 2%;
        margin-bottom: 2%;
        display: grid;
        grid-template-columns: min-content  1fr;
        background-color: var(--dark-background3,#FFFFFF);
        border-radius: 16px 16px 16px 16px;
    }

    .menugroup{
       height: 100%;
       background: var(--dark-background3,#FFFFFF);
    }
    .menuitem{
      background: var(--dark-background3,#FFFFFF);
    }
    .content{
      background: var(--dark-background3,#FFFFFF);
      border-style: none none none solid;
      border-width: 1px;
      border-color: rgba(166,164,164,0.2);
      border-radius: 0px 16px 16px 0px;
    }
    :host([show_hint]) #hint {
      color: #DB5860;
      font-weight: 700;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: block;

    }
    #hint {
       display: none;
    }
    
    @keyframes textRoll {
        0% {
            left: 1%;
            
        }
        100% {
            left:100%;
        }
    }
    .cancel {
      visibility: hidden;
    }
    .prompt {
      position: absolute;
      margin-left: 35px;
      line-height: 32px;
      font-family: Helvetica;
      font-size: 14px;
      opacity: 0.6;
    }
    </style>
    <div class="vessel">
     <div class="header">
       <div style="display: flex;margin-left:20px;align-items: center; flex: 1;">
         <span class="target">Target Platform:</span>
           <div id="device-prompt">
              <span class="prompt"></span>
              <select class="select" id = "device-select"></select>
           </div>
           <select class="device_version" id = "device-version">
           </select>
          <lit-button style="width: 180px; height:32px" class="add" height="32px" width="164px" color="#0A59F7" 
          font_size="14px" border="1px solid #0A59F7" 
          padding="0 0 0 12px" justify_content="left" icon="add" margin_icon="0 10px 0 8px">Add HDC Device</lit-button>
          <div class="header-right">
          <lit-button class="disconnect" style="margin-right: 30px" height="32px" width="96px" font_size="14px" 
          justify_content="center" color="#FFFFFF"
          border_radius="16px" back='#0A59F7' opacity="0.6" border="0 solid">Disconnect</lit-button>
          <lit-button class="record" style="margin-right: 30px" height="32px" width="96px" font_size="14px" 
          justify_content="center" color="#FFFFFF"
          border_radius="16px" back='#0A59F7' opacity="0.6" border="0 solid">
            <span class="record_text">Record</span>
          </lit-button>
          <lit-button class="cancel" height="32px" width="96px" font_size="14px" justify_content="center" 
          color="#FFFFFF" border_radius="16px" back='#0A59F7' opacity="0.6" border="0 solid">
            <span class="record_text">Cancel</span>
          </lit-button>
          </div>
         </div>
          <div class="span-col-2" >
             <span class="header-des" id="hint">It looks like you didn't add any probes. Please add at least one</span>
          </div>
     </div>
     <div class="body">
        <lit-main-menu-group class="menugroup" id= "menu-group" title="" nocollapsed radius></lit-main-menu-group>
        <div id="app-content" class="content">
        </div>
     </div>
    </div>
    `;
