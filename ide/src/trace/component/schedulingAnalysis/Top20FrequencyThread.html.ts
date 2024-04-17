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
export const Top20FrequencyThreadHtml = `
        <style>
        :host {
            width: 100%;
            height: 100%;
            background-color: var(--dark-background5,#F6F6F6);
        }
        .tb_thread_count{
            width: calc(100% - 100px);
            border-radius: 5px;
            border: solid 1px var(--dark-border1,#e0e0e0);
            margin: 15px;
            padding: 5px 15px
        }
        .pie-chart{
            display: flex;
            box-sizing: border-box;
            width: 80%;
            height: 500px;
        }
        .root{
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: row;
            overflow-x: hidden;
            overflow-y: auto;
            box-sizing: border-box;
        }
        </style>
        <lit-progress-bar id="loading" style="height: 1px;width: 100%" loading></lit-progress-bar>
        <div style="padding: 15px">
                    Thread Search
                    <lit-select default-value="1" id="thread_select" show-search placement="bottom"></lit-select>
        </div>
        <table-no-data id="nodata" contentHeight="500px">
        <div class="root">
            <div style="width: 40%;padding: 15px;display: flex;flex-direction: column;align-items: center">
                <div>Statistics By Duration</div>
                <lit-chart-pie id="pie" class="pie-chart"></lit-chart-pie>
            </div>
            <div style="flex: 1;display: flex;flex-direction: column;align-items: center;padding-top: 15px;height: 60vh">
                <div id="current_thread" style="font-weight: bold;height: 40px"></div>
                <div id="tb_vessel" class="tb_thread_count">
                    <lit-table id="tb-process-thread-count" hideDownload style="height: calc(60vh - 60px)">
                        <lit-table-column width="1fr" title="NO" data-index="no" key="no" align="flex-start" order></lit-table-column>
                        <lit-table-column width="1fr" title="cpu" data-index="cpu" key="cpu" align="flex-start" order></lit-table-column>
                        <lit-table-column width="1fr" title="frequency" data-index="freq" key="freq" align="flex-start" order></lit-table-column>
                        <lit-table-column width="1fr" title="duration" data-index="timeStr" key="timeStr" align="flex-start" order></lit-table-column>
                        <lit-table-column width="1fr" title="%" data-index="ratio" key="ratio" align="flex-start" order></lit-table-column>        
                    </lit-table>
                </div>
            </div>
        </div>
        </table-no-data>
        `;