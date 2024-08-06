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

import { replacePlaceholders } from '../../../../base-ui/utils/Template';

let html = `
<style>
:host{
    height: 30px;
    background: var(--dark-background4,#F2F2F2);
    border-top: 1px solid var(--dark-border1,#c9d0da);display: flex;align-items: center;z-index: 2;
    margin-left: -10px;
    width: calc(100% + 20px);
}

.chosen-single {
    position: relative;
    display: block;
    overflow: hidden;
    text-decoration: none;
    white-space: nowrap;
    height: 34px;
    padding: 3px 6px;
    font-size: 14px;
    line-height: 1.42857143;
    color: #555;
    background-color: #fff;
    background-image: none;
    border: 1px solid #ccc;
    border-radius: 4px;
    transition: border-color ease-in-out .15s,box-shadow ease-in-out .15s;
    box-shadow: inset 0 1px 1px rgba(0,0,0,.075);    
}
.disabled{
color: rgba(0,0,0,0.4);
}
#pane-filter-input{
background: var(--dark-background4,#FFFFFF);
border: 1px solid var(--dark-border,rgba(0,0,0,0.60));
color: var(--dark-color2,#000000);
border-radius: 8px;
width: 200px;
}
#pane-filter-input:focus{
    outline: none;
    box-shadow: 1px 1px 1px var(--dark-color,#bebebe);
}
#pane-filter-input::-webkit-input-placeholder {
        color: var(--dark-color,#aab2bd);
    }
.describe{
    /*display: inline-block*/
    font-size: 0.8rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 50px;
}

#mark{
    border: 1px solid var(--bark-prompt,#999999);
    border-radius: 1px;
    background: var(--dark-background4,#F2F2F2);
    color: var(--dark-color2,rgba(0,0,0,0.9));
    transition: all 0.1s;
}
#mark:hover{
    background: var(--dark-background1,#dfdfdf);
}
#mark:active{
    background: var(--dark-background4,#F2F2F2);
    transition: all 0.05s;
}
#first-select{
width: 200px;
}
#second-select{
width: 200px;
}
.spacing{
margin-left: 10px;
}
.max-spacing{
margin-left: 15px;
}

:host(:not([inputLeftText])) .left-text{
    display: none;
}
:host(:not([input])) #pane-filter-input{
    display: none;
}
:host(:not([fileSystem])) .popover .tree-check:nth-child(3){
  display: none;
}
:host([fileSystem]) .popover .tree-check:nth-child(5){
  display: none;
}
:host([fileSystem]) .popover .tree-check:nth-child(6){
    display: none;
  }
:host([nativeMemory]) .popover .tree-check:nth-child(3){
  display:none;
}
:host([nativeMemory]) .popover .tree-check:nth-child(5){
  display:none;
}
:host([nativeMemory]) .popover .tree-check:nth-child(6){
    display:none;
  }
:host([isStatisticsMemory]) .popover .tree-check:nth-child(4){
  display:none;
}
:host(:not([mark])) #mark{
    display: none;
}
:host(:not([first])) #first-select{
    display: none;
}
:host(:not([second])) #second-select{
    display: none;
}
:host(:not([third])) #third-select{
    display: none;
}
:host(:not([tree])) .tree{
    display: none;
}
:host([disabledMining]) #data-mining{
    display: none;
}
:host([disabledMining]) #data-library{
    display: none;
}
:host([disableTransfer]) .transfer-text{
  display: none;
}
:host(:not([icon])) #icon{
    display: none;
}
:host(:not([options])) #check-popover{
    display: none;
}

:host(:not([cpu_config])) #data-core-popover{
    display: none;
}

:host(:not([group_config])) #group-mining-popover{
    display: none;
}
#icon[name="statistics"]{
    margin-left: 12px;
}

.constraints-input{
    background: var(--dark-border,#ffffff);
    color: var(--dark-color1,rgba(0,0,0,0.86));
    border: 1px solid var(--dark-border,rgba(0,0,0,0.60));
    border-radius: 10px;
    width: 40px;
    margin-left: 10px;
    outline: none;
}
.constraints-input[disabled]{
    background: var(--dark-background5,#ededed);
}
.reset-button{
    opacity: 0.9;
    font-size: 13px;
    color: #0A59F7;
    text-align: center;
    line-height: 16px;
    background: var(--dark-background3,#F4F3F4);
    border: 1px solid var(--dark-background8,#F4F3F4);
    border-radius: 16px;
    padding: 2px 18px;
}
#tb_core_setting, #tb_cpu, #tb_add_group{
    height: 135px;
    width: 250px;
    background: var(--dark-background4,#F2F2F2);
    overflow-y: auto ;
    border-radius: 5px;
    border: solid 1px var(--dark-border1,#e0e0e0);
}
#tb_core_setting {
    display: grid;
    grid-template-columns: auto auto auto auto;
}

.button{
    opacity: 0.9;
    font-size: 13px;
    color: #0A59F7;
    text-align: center;
    line-height: 16px;
    background: var(--dark-background3,#F4F3F4);
    border: 1px solid var(--dark-background8,#F4F3F4);
    border-radius: 16px;
    padding: 2px 18px;
}

.core_line{
    position: fixed;
    bottom: 0;
    height: 35px;
    line-height: 35px;
    position: sticky;
    top: 0;
    background: var(--dark-background4,#F2F2F2);
    z-index: 1;
    width: 100%;
    font-Weight:bold;
    font-style:12px;
    text-align:center;
}
.tb_setting_content {
    display: flex;
    justify-content: space-between;
}
#move {
    display: flex;
    flex-direction: column;
    width: 50px;
    justify-content: space-evenly;
    height: 135px;
}
.check-content{
    display: flex;
    align-content: center;
    justify-content: center;
} 

#call-tree-popover[visible="true"] #call-tree{
    color: #0A59F7;
}
#check-popover[visible="true"] #check-des{
    color: #0A59F7;
}
#tree-constraints-popover[visible="true"] #tree-constraints{
    color: #0A59F7;
}
#data-mining-popover[visible="true"] #data-mining{
    color: #0A59F7;
}
#data-core-popover[visible="true"] #core-mining{
    color: #0A59F7;
}
#group-mining-popover[visible="true"] #group-mining{
    color: #0A59F7;
}

.mining-checked[highlight]{
    color: #FFFFFF;
    background: #0C65D1;
}
#data-library-popover[visible="true"] #data-library{
    color: #0A59F7;
}
.library-checked[highlight]{
    color: #FFFFFF;
    background: #0C65D1;
}
#title{
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    flex: 1;
    text-align: left;
}
#mining-row{
    background: var(--dark-background4,#F2F2F2);
    border-radius: 2px;
    height: 135px;
    width: 250px;
    overflow-y: auto;
}
#library-row{
    background: var(--dark-background4,#F2F2F2);
    border-radius: 2px;
    height: 135px;
    width: 250px;
    overflow-y: auto;
}
.check-wrap, .tree-check{
    margin-bottom: 5px;
    display: flex;
    align-content: center;
}
.sort{
    display: flex;
    align-items: center;
    cursor: pointer;
}
:host(:not([sort])) .sort{
    display: none;
}
.popover{
    display: flex;
}
.lit-check-box{
    margin-right: 5px;
}
.transfer-list{
  display: flex;
  flex-derection: column;
}
.tree-radio{
  margin: 5px 0;
  cursor: pointer;
}
.radio{
  cursor: pointer;
}
.hide{
  display: none;
}
</style>
<lit-icon name="menu" class="spacing" id="icon" size="20"></lit-icon>
<span class="describe left-text spacing">Input Filter</span>
<input id="pane-filter-input" class="spacing" placeholder={1}/>
<button id="mark" class="spacing">Mark Snapshot</button>
<div id="load" style="display: flex">

</div>
<lit-popover placement="topLeft" class="popover" haveRadio="true" trigger="click" id="call-tree-popover">
     <div slot="content">
         <div class="tree-check"><lit-check-box class="lit-check-box" not-close></lit-check-box><div>Invert</div></div>
         <div class="tree-check"><lit-check-box class="lit-check-box" not-close></lit-check-box><div>Hide System so</div></div>
         <div class="tree-check"><lit-check-box class="lit-check-box" not-close></lit-check-box><div>Hide Event</div></div>
         <div class="tree-check"><lit-check-box class="lit-check-box" not-close></lit-check-box><div>Hide Thread</div></div>
         <div class="tree-check"><lit-check-box class="lit-check-box" not-close></lit-check-box><div>Hide Thread State</div></div>
         <div class="tree-check"><lit-check-box class="lit-check-box" not-close></lit-check-box><div>Only Kernel</div></div>
     </div>
     <span class="describe tree max-spacing" id="call-tree">Options</span>
</lit-popover>
<lit-popover placement="topLeft" class="popover" haveRadio="true" trigger="click" id="check-popover">
     <div slot="content"></div>
     <span class="describe max-spacing" id="check-des">Options</span>
</lit-popover>
<lit-popover placement="topLeft" class="popover" haveRadio="true" trigger="click" id="tree-constraints-popover">
     <div slot="content" style="display: flex; align-items: flex-end">
         <lit-check-box id="constraints-check" not-close></lit-check-box>
         <input class="constraints-input" disabled value="0" not-close/>
         <lit-popover placement="topLeft" class="popover" haveRadio="true" not-close>
             <div slot="content">
                 <div style="font-size: 0.7rem">Constraints：Only enabled with data and while stopped；</div>
                 <div style="font-size: 0.7rem">filters data to thresholds. </div>
             </div>
             <input class="constraints-input" disabled value="∞" not-close/>
          </lit-popover>
     </div>
     <span class="describe tree max-spacing" id="tree-constraints">Sample Count Filter</span>
</lit-popover>
 <lit-popover placement="topLeft" class="popover" haveRadio="true" trigger="click" id="data-mining-popover">
    <div slot="content">
         <div id="mining-row">
             
         </div>
         <div style="display: flex;justify-content: space-around; margin-top: 8px">
             <div class="mining-button reset-button">Reset</div>
         </div>
    </div>
    <span class="describe tree max-spacing" id="data-mining">Symbol Filter</span>
</lit-popover>
<lit-popover placement="topLeft" class="popover transfer-area" haveRadio="true" trigger="click" id="call-tree-popover">
<div slot="content" id="transfer-list" style="display:block; height:auto; max-height: 200px; overflow-y:auto;">
    
</div>
<span class="describe tree max-spacing transfer-text" id="call-tree">Transfer</span>
</lit-popover>
<lit-popover placement="topLeft" class="popover" haveRadio="true" trigger="click" id="data-library-popover">
    <div slot="content">
         <div id="library-row">
             
         </div>
         <div style="display: flex;justify-content: space-around; margin-top: 8px">
             <div class="library-button reset-button">Reset</div>
         </div>
    </div>
    <span class="describe tree max-spacing" id="data-library">Library Filter</span>
</lit-popover>
<lit-popover placement="topLeft" class="popover" haveRadio="true" trigger="click" id="data-core-popover">
    <div slot="content">
        <div class="core_setting_div" id="tb_core_setting" ></div>
        <div style="display: flex;justify-content: space-around; margin-top: 8px">
            <div class="button reset-button">Reset</div>
            <div class="button confirm-button">Confirm</div>
        </div>
    </div>
    <span class="describe max-spacing" id="core-mining">CPU Setting</span>
</lit-popover>
<lit-popover placement="topLeft" class="popover" haveRadio="true" trigger="click" id="group-mining-popover">
    <div slot="content">
        <div class='tb_setting_content'>
            <div id="tb_cpu" style="width: 140px;"></div>
            <div id="move">
                <div class="button add_group_button"> > </div>
                <div class="button cut_group_button"> < </div>
            </div>
            <div id="tb_add_group" style="width: 140px;">
                <div class="core_line">Group</div>
                <div class="add_content" style="text-align: center"></div>
            </div>
        </div>
        <div style="display: flex;justify-content: space-around; margin-top: 8px">
            <div class="button reset-group-button">Reset</div>
            <div class="button confirm-group-button">Confirm</div>
        </div>
    </div>
    <span class="describe max-spacing" id="group-mining">Group Setting</span>
</lit-popover>
<div class="sort">
    <lit-icon name="swap" class="spacing" size="16"></lit-icon>
    <div style="margin-left: 5px" class="describe statistics-name">Statistics by Thread</div>
</div>
`;
export const TabPaneFilterHtml = (input: string): string => {
  return replacePlaceholders(html, input);
};
