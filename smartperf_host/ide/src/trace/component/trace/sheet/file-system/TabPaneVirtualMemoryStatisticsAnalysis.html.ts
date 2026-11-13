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
export const TabPaneVirtualMemoryStatisticsAnalysisHtml = `
        <style>
        :host {
            display: flex;
            flex-direction: column;
        }
        #vm-chart-pie{
            height: 300px;
            margin-bottom: 31px;
        }
        .vm-table-box{
            width: 60%;
            border-left: solid 1px var(--dark-border1,#e0e0e0);
            border-radius: 5px;
            padding: 10px;
            margin-bottom: 31px;
        }
        .vm-go-back{
            display:flex;
            align-items: center;
            cursor: pointer;
            margin-left: 20px;
            visibility: hidden;
        }
        .vm-back-box{
            display: flex;
            background-color: var(--bark-expansion,#0C65D1);
            border-radius: 5px;
            justify-content: center;
            align-items: center;
            color: #fff;
            margin-right: 10px;
            width: 40px;
            height: 20px;
        }
        .vm-subheading{
            font-weight: bold;
            text-align: center;
        }
        .vm-progress{
            height: 1px;
            left: 0;
            position: absolute;
        }
        #filter{
            position: absolute;
            bottom: 0px;
        }
        </style>
        <label id="time-range" style="text-align: end;font-size: 10pt;margin-bottom: 5px;width: 100%;height: 20px;">Selected range:0.0 ms</label> 
        <div style="display: flex;flex-direction: row;"class="d-box">
            <lit-progress-bar class="vm-progress"></lit-progress-bar>
            <div id="left_table" style="width: 40%;height:auto;">
                <div style="display: flex;margin-bottom: 10px">
                    <div class="vm-go-back">
                        <div class="vm-back-box">
                            <lit-icon name="arrowleft"></lit-icon>
                        </div>
                    </div>
                    <div class="title"></div>
                </div>
                <div class="vm-subheading"></div>                     
                <lit-chart-pie  id="vm-chart-pie"></lit-chart-pie>     
            </div>
            <div class="vm-table-box" style="height:auto;overflow: auto">
                <lit-table id="tb-process-usage" style="max-height:565px;min-height: 350px">
                    <lit-table-column width="1fr" title="ProcessName" data-index="tableName" key="tableName" align="flex-start"order></lit-table-column>
                    <lit-table-column width="1fr" title="Duration" data-index="durFormat" key="durFormat" align="flex-start" order></lit-table-column>
                    <lit-table-column width="1fr" title="%" data-index="percent" key="percent" align="flex-start"order></lit-table-column>
                </lit-table>
                <lit-table id="tb-type-usage" class="vm-analysis" style="max-height:565px;min-height: 350px"hideDownload>
                    <lit-table-column width="1fr" title="Type" data-index="tableName" key="tableName" align="flex-start"order></lit-table-column>
                    <lit-table-column width="1fr" title="Duration" data-index="durFormat" key="durFormat" align="flex-start" order></lit-table-column>
                    <lit-table-column width="1fr" title="%" data-index="percent" key="percent" align="flex-start"order></lit-table-column>
                </lit-table>
                <lit-table id="tb-thread-usage" class="vm-analysis" style="max-height:565px;display: none;min-height: 350px"hideDownload>
                    <lit-table-column width="1fr" title="ThreadName" data-index="tableName" key="tableName" align="flex-start"order></lit-table-column>
                    <lit-table-column width="1fr" title="Duration" data-index="durFormat" key="durFormat" align="flex-start" order></lit-table-column>
                    <lit-table-column width="1fr" title="%" data-index="percent" key="percent" align="flex-start"order></lit-table-column>
                </lit-table>
                    <lit-table id="tb-so-usage" class="vm-analysis" style="max-height:565px;display: none;min-height: 350px"hideDownload>
                    <lit-table-column width="1fr" title="Library" data-index="tableName" key="tableName" align="flex-start"order></lit-table-column>
                    <lit-table-column width="1fr" title="Duration" data-index="durFormat" key="durFormat" align="flex-start" order></lit-table-column>
                    <lit-table-column width="1fr" title="%" data-index="percent" key="percent" align="flex-start"order></lit-table-column>
                </lit-table>
                <lit-table id="tb-function-usage" class="vm-analysis" style="max-height:565px;display: none;min-height: 350px"hideDownload>
                    <lit-table-column order width="1fr" title="Function" data-index="tableName" key="tableName" align="flex-start"></lit-table-column>
                    <lit-table-column order width="1fr" title="Duration" data-index="durFormat" key="durFormat" align="flex-start"></lit-table-column>
                    <lit-table-column width="1fr" title="%" data-index="percent" key="percent" order align="flex-start"></lit-table-column>
                </lit-table>
            </div>
        </div>
        <tab-pane-filter id="filter" options></tab-pane-filter>
`;
