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

export const CustomThemeColorHtml = `
        <style>
        :host([hidden]) {
            visibility: hidden;
        }
        :host {
            width:100%;
            visibility: visible;
            overflow: auto;
            background-color: #fff;
            display: flex;
            flex-direction: column;
        }
        .config-title {
            height: 72px;
            background-color: #0a59f7;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .title-text {
            font-family: Helvetica-Bold;
            font-size: 16px;
            color: #ffffff;
            text-align: left;
            font-weight: 700;
            margin-left: 40px;
        }
        .page-close {
            text-align: right;
            cursor: pointer;
            opacity: 1;
            font-size: 24px;
            margin-right: 20px;
        }
        .page-close:hover {
            opacity: 0.7;
        }
        .theme {
            opacity: 0.9;
            font-family: Helvetica-Bold;
            font-size: 16px;
            color: #000000;
            line-height: 28px;
            font-weight: 700;
            margin: 60px 40px 40px 40px;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: flex-start;
            flex-flow: row wrap;
        }
        .theme span {
            margin-right: 40px;
            font-weight: 700;
        }
        .litRadio {
            margin: 0px 40px 0px 0px;
        }
        #lightRadio([dis=round]) #lightRadio(:focus-within) .selected label:hover .selected{
            border-color: #0a59f7;
        }
        #lightRadio([dis=round]) .selected::before {
            background: #0a59f7;
        }
        .describe {
            font-family: Helvetica;
            color: #000000;
            line-height: 28px;
            margin: 0px 0px 40px 40px;
        }
        .describe text:nth-child(1) {
            opacity: 0.9;
            font-size: 16px;
            font-weight: 700;
        }
        .describe text:nth-child(2) {
            opacity: 0.6;
            font-size: 14px;
            font-weight: 400;
            margin-left: 12px;
        }
        .colors {
            width: 50%;
            display: flex;
            flex-flow: row wrap;
            align-content: space-around;
            flex: 0 0 9%;
            margin: 20px auto;
        }
        .color-wrap {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            margin: 30px 10px;
            overflow: hidden;
            position: relative;
        }
        .color {
            border: none;
            outline: none;
            width: 150%;
            height: 150%;
            padding: 0;
            border-radius: 50%;
            position: absolute;
            top: -25%;
            left: -25%;
        }
        .btns {
            width: 60%;
            max-width: 70%;
            display: flex;
            flex: 0 0 9%;
            justify-content: space-around;
            margin: 40px auto;
        }
        .btn {
            width: 96px;
            height: 32px;
            font-size:14px;
            text-align: center;
            line-height: 20px;
            color: #0a59f7;
            background-color: #fff;
            border-radius: 16px;
            border: 1px solid #0a59f7; 
        }
        .btn:hover {
            background-color: #0a59f7;
            color: #fff;
        }
        button.active {
            background-color: blue;
            color: white;
        }
        </style>
        <div class="vessel">
         <div class="config-title">
            <span class="title-text">Color Setting</span>
            <lit-icon class="page-close" name="close-light" title="Page Close" color='#fff'></lit-icon>
         </div>
         <div class="text-wrap">
            <div class="theme">
               <span>Appearance</span>
               <lit-radio name='litRadio' dis="round" class='litRadio' id="lightRadio" type="0">light</lit-radio>
               <lit-radio name='litRadio' dis="round" class='litRadio' id="darkRadio type="1">dark</lit-radio>
            </div>
            <div class="describe">
               <text>Color Customization</text>
               <text> Please customize colors according to your preferences</text>
            </div>
         </div>
         <div class="colors">
         </div>
         <div class="btns">
            <button class="btn" id='reset'>Reset</button>
            <button class="btn" id='preview'>Preview</button>
            <button class="btn" id='confirm'>Confirm</button>
         </div>
        </div>
    `;
