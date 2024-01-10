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

export const LitTreeNodeHtmlStyle = `
        <style>
        :host{
            display: flex;
            margin: 0;
            align-items: center;
         }
         :host(:hover) #item{
            background-color: #f5f5f5;
            border-radius: 4px;
         }
         
         :host(:not([arrow]))  #arrow{
            display: none;
         }
         
         :host(:not([arrow]))  #item{
            margin-left: 15px;
         }
         
         :host([top-depth])  #item{
            margin-left: 0;
         }
         
         #title{
            padding: 4px 6px;
         }
         
         #arrow{
            width: 0;
            height: 0;
            border-top: 8px solid #262626;
            border-bottom: 0px solid transparent;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            transition: all .3s ;
            transform: translateX(-50%) rotateZ(0deg);
            margin-left: 5px;
         }
            
         #icon{
            display: none;
            margin-left: 5px;
         }
      
         /*画拖动辅助线*/
         #item[line-top]{
            position: relative;
            width: 100%;
         }
         
         #item[line-top]::before{
            content: '';
            position: absolute;
            top: 5px;
            left: 0;
            transform: translateY(-50%);
            width: 6px;
            height: 6px;
            overflow: visible;
            z-index: 999;
            background-color: #fff;
            border-radius: 6px;
            border: 2px solid #42b983;
         }
         #item[line-top]::after{
            content: '';
            overflow: visible;
            position: absolute;
            z-index: 999;
            top: 4px;
            left: 10px;
            width: 100%;
            height: 2px;
            background-color: #42b983;
         }
         
         #item[line-bottom]{
            position: relative;
            width: 100%;
         }
         #item[line-bottom]::before{
            content: '';
            position: absolute;
            bottom: 5px;
            left: 0;
            transform: translateY(50%);
            width: 6px;
            height: 6px;
            overflow: visible;
            z-index: 999;
            background-color: #fff;
            border-radius: 6px;
            border: 2px solid #42b983;
         }
         #item[line-bottom]::after{
            content: '';
            overflow: visible;
            position: absolute;
            z-index: 999;
            bottom: 4px;
            left: 10px;
            width: 100%;
            height: 2px;
            background-color: #42b983;
         }
         #item[line-bottom-right]{
            position: relative;
            width: 100%;
         }
         #item[line-bottom-right]::before{
            content: '';
            position: absolute;
            bottom: 5px;
            left: 20px;
            transform: translateY(50%);
            width: 6px;
            height: 6px;
            overflow: visible;
            z-index: 999;
            background-color: #fff;
            border-radius: 6px;
            border: 2px solid #42b983;
         }
         #item[line-bottom-right]::after{
            content: '';
            overflow: visible;
            position: absolute;
            z-index: 999;
            bottom: 4px;
            left: 30px;
            width: 100%;
            height: 2px;
            background-color: #42b983;
         }
         :host([missing]) #checkbox{
            position: relative;
         }
       
         :host([missing]) #checkbox::after{
            content: '';
            width: calc(100% - 20px);
            height: calc(100% - 8px);
            box-sizing: border-box;
            top: 0;
            left: 0;
            margin: 4px;
            background-color: #3391FF;
            position: absolute;
         }
         
        </style>
        `;