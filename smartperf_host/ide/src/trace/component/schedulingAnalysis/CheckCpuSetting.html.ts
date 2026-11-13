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
export const CheckCpuSettingHtml = `
        <style>
        :host {
            width: 100%;
            height: 100%;
        }
        .cpu_setting_div{
            overflow: auto ;
            border-radius: 5px;
            border: solid 1px var(--dark-border1,#e0e0e0);
            display: grid;
            margin: 10px;
            padding-right: 10px;
            padding-left: 10px;
            grid-template-columns: auto auto auto auto;
        }
        .setting_line{
            height: 35px;
            line-height: 35px;
        }
        .title_div{
            display: flex;
            flex-direction: row;
            align-items: center;
            height: 50px;
            padding-left: 15px;
            padding-right: 15px;
            justify-content: space-between;
            border-bottom: 1px solid var(--dark-border1,#e0e0e0);
        }
        .upload_bt{
            height: 35px;
            color: #ffffff;
            cursor: pointer;
            background-color: #0A59F7;
            border-radius: 5px;
            padding-left: 15px;
            padding-right: 15px;
            line-height: 35px;
            text-align: center;
        }
        .bg{
            display: flex;
            flex-direction: column;
            margin: 10px;
            background-color: var(--dark-background,#FFFFFF);
        }
        </style>
        <div class="bg" >
            <div class="title_div">
                <div>CPU 大小核分类</div>
                <div id="set_upload" class="upload_bt">Upload</div>
            </div>
            <div class="cpu_setting_div" id="tb_cpu_setting" >
            </div>
        </div>
        
        `;
