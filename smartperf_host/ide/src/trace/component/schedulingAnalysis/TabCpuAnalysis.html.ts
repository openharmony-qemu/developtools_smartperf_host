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
export const TabCpuAnalysisHtml = `
        <style>
        :host {
            width: 100%;
            height: 100%;
            background-color: var(--dark-background,#FFFFFF);
        }
        .cpu_usage{
            display: flex;
            flex-direction: row;
            box-sizing: border-box;
            padding: 15px;
            background-color: var(--dark-background,#FFFFFF);
        }
        .usage_item{
            height: 50px;
            line-height: 50px;
            text-align: center;
            border: solid 1px var(--dark-border1,#f0f0f0);
        }
        .usage_item_box{
            border: solid 1px var(--dark-border1,#f0f0f0);
            flex: 1;
        }
        .usage_chart{
            height: 360px;
            color: var(--dark-color1,#252525);
            background-color: var(--dark-background,#FFFFFF);
        }
        .pie-chart{
            display: flex;
            box-sizing: border-box;
            height: 300px;
        }
        .grid_usage{
            display: grid;
            width: 100%;
            box-sizing: border-box;
            grid-template-columns: repeat(4,calc((100% - 30px) / 4));
            grid-column-gap: 10px;
            grid-row-gap: 10px;
            padding: 10px;
            background-color: var(--dark-background5,#F6F6F6);
        }
        .cpu-statistics{
            height: 50px;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            padding:0px 15px;
            background-color: var(--dark-background,#FFFFFF);
        }
        </style>
        <div style="display: flex;flex-direction: column;overflow-x: hidden;overflow-y: auto;height: 100%">
            <lit-progress-bar id="loading" style="height: 1px;width: 100%"></lit-progress-bar>
            <div class="cpu_usage" id="cpu_usage_table"></div>
            <div class="cpu-statistics">
                <div>CPU Statistics By Duration</div>
                <lit-select default-value="1" id="scheduling_select" tabselect>
                    <lit-select-option value="1">CPU Idle</lit-select-option>
                    <lit-select-option value="2">CPU Frequency</lit-select-option>
                    <lit-select-option value="3">CPU Irq</lit-select-option>
                </lit-select>
            </div>
            <div class="grid_usage" id="cpu_usage_chart"></div>
        </div>
        <lit-drawer id="drawer-right" drawer-title="CPU：0" content-width="65vw" placement="right" style="position: fixed" fixed mask mask-closeable closeable content-padding="0">
            <drawer-cpu-tabs id="drawer-cpu-tabs"></drawer-cpu-tabs>
        </lit-drawer>
        `;
