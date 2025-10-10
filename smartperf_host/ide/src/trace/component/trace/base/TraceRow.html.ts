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
export const TraceRowHtml = `
        <style>
        *{
            box-sizing: border-box;
        }
        :host(:not([row-hidden])){
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            width: 100%;
            height: min-content;
        }
        :host([row-hidden]){
            width: 100%;
            display: none;
        }
        .root{
            height: 100%;
            width: 100%;
            display: grid;
            grid-template-rows: 100%;
            grid-template-columns: 248px 1fr;
            border-bottom: 1px solid var(--dark-border1,#dadada);
            border-right: 1px solid var(--dark-border1,#ffffff);
            box-sizing: border-box;
        }
        .root .drag{
            background-color: var(--dark-background1,#eee);
            box-shadow: 0 4px 12px -4px #999 inset;
        }
        .root .line-top{
            box-shadow: 0 4px 2px -1px #4d7ab3 inset; 
            transition: all 0.2s;
        }
        .root .line-bottom{
            box-shadow: 0 -4px 2px -1px #4d7ab3 inset; 
            transition: all 0.2s;
        }
        .describe{
            box-sizing: border-box;
            border-right: 1px solid var(--dark-border1,#c9d0da);
            background-color: var(--dark-background5,#ffffff);
            align-items: center;
            position: relative;
        }
        .panel{
            width: 100%;
            height: 100%;
            overflow: visible;
            background-color: transparent;
            display: block;
        }
        .panel-vessel{
            width: 100%;
            position: relative;
            pointer-events: none;
        }
        .name{
            color: var(--dark-color1,#4b5766);
            margin-left: 10px;
            font-size: .9rem;
            font-weight: normal;
            font-family: Roboto,verdana,sans-serif;
            flex: 1;
            max-height: 100%;
            text-align: left;
            overflow: hidden;
            user-select: none;
            text-overflow: ellipsis;
            white-space:nowrap;
            max-width: 190px;
        }
        :host([highlight]) .name{
            color: #4b5766;
        }
        .icon{
            color: var(--dark-color1,#151515);
            margin-left: 10px;
        }
        .describe:hover {
            cursor: pointer;
        }
        :host([folder]) .describe:hover > .icon{
            color:#ecb93f;
            margin-left: 10px;
        }
        :host([folder]){
            /*background-color: var(--dark-background1,#f5fafb);*/
        }
        :host(:not([folder])){
            /*background-color: var(--dark-background,#FFFFFF);*/
        }
        :host(:not([folder]):not([children])) {
        }
        :host(:not([folder]):not([children])) .icon{
            display: none;
        }
        :host(:not([folder])[children]) .icon{
            display: none;
            color:#fff
        }

        :host(:not([folder])[children]) .name{
        }
        :host([sticky]) {
            position: sticky;
            top: 0;
            z-index: 1;
        }
        :host([expansion]) {
            background-color: var(--bark-expansion,#0C65D1);
            opacity:0.8;
        }
        :host([expansion]) .name,:host([expansion]) .icon{
            color: #fff;
        }
        :host([expansion]) .describe{
            border-right: 0px;
            background-color: var(--bark-expansion,#0C65D1);
        }
        :host([expansion]:not(sleeping)) .panel-vessel{
            display: none;
        }
        :host([expansion]) .children{
            flex-direction: column;
            width: 100%;
        }
        :host([expansion]) .icon{
            transform: rotateZ(0deg);
        }
        :host(:not([expansion])) .children{
            display: none;
            flex-direction: column;
            width: 100%;
        }
        :host(:not([expansion])) .icon{
            transform: rotateZ(-90deg);
        }
        :host([sleeping]) .describe{
            display: none;
        }
        :host([sleeping]) .panel-vessel{
            display: none;
        }
        :host([sleeping]) .children{
            display: none;
        }
        :host(:not([sleeping])) .describe{
            display: flex;;
        }
        :host(:not([sleeping])) .panel-vessel{
            display: block;
        }
        :host(:not([sleeping])) .children{
            display: flex;
        }
        :host([folder]) .lit-check-box{
            display: none;
        }
        :host(:not([check-type])) .lit-check-box{
            display: none;
        }
        :host(:not([collect-type])) {
            /*position:static;*/
        }
        :host([collect-type][collect-group='1']) .collect{
            display: block;
            color: #5291FF;
        }
        :host([collect-type][collect-group='2']) .collect{
            display: block;
            color: #f56940;
        }
        :host(:not([collect-type])) .collect{
            display: none;
            color: var(--dark-icon,#666666);
        }
        .collect{
            margin-right: 5px;
        }
        :host(:not([folder])) .describe:hover .collect{
            display: block;
        }
        .popover{
            color: var(--dark-color1,#4b5766);
            display: none;
            justify-content: center;
            align-items: center;
            margin-right: 5px;
        }
        .setting{
            position:absolute;
            left: 225px;
        }
        .radio{
            margin-right: 10px;
        }
        #setting{
            color: var(--dark-color1,#606060);
        }
        :host([expansion]) #setting{
            color: #FFFFFF;
        }
        :host([highlight]) .flash{
            background-color: #ffe263;
        }
         #listprocess::-webkit-scrollbar{
         width: 6px;
        }
        /*定义滑块 内阴影+圆角*/
        #listprocess::-webkit-scrollbar-thumb
        {
          border-radius: 6px;
          background-color: var(--dark-background7,#e7c9c9);
        }
        /*func expand css*/
        :host([row-type="func"]) .name{
            cursor: pointer;
        }
        :host([func-expand='false']) .name{
            color: #00a3f5;
        }
        .lit-check-box{
            margin-right: 25px;
        }
        :host([row-setting='enable'][check-type]) .lit-check-box{
            margin-right: 25px;
        }
        :host([row-setting='enable'][check-type='-1']) .collect{
            margin-right: 20px;
        }
        :host([row-setting='enable']) #rowSetting{
            display: flex;
        } 
        :host([row-setting='enable']:not([check-type='-1'])) .collect{
            margin-right: 5px;
        }
        :host([row-setting='checkFile']) #rowCheckFile{
          display:flex;
        }
        :host([row-setting='checkFile']) #myfolder{
          color:#4b5766;
        }
        .upload {
            position: absolute;
            color: var(--dark-icon,#333333);
            right: 5px;
            margin-top: 4px;
        } 
        </style>
        <div class="root">
            <div class="describe flash" style="position: relative">
                <label class="name"></label>
                <lit-icon class="collect" name="star-fill" size="19"></lit-icon>
                <lit-check-box class="lit-check-box"></lit-check-box>
            </div>
        </div>
        `;
