/*
 * Copyright (C) 2025 Huawei Device Co., Ltd.
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

export const TabPaneOSAnalysisHtml = `
        <style>
        :host {
            flex-direction: column;
            display: flex;
        }
        #os-chart-pie{
            height: 300px;
            margin-bottom: 31px;
        }
        .os-table-box{
            width: 60%;
            border-left: solid 1px var(--dark-border1,#e0e0e0);
            border-radius: 5px;
            padding: 10px;
            margin-bottom: 31px;
        }
        .os-go-back{
            display:flex;
            align-items: center;
            cursor: pointer;
            margin-left: 20px;
            visibility: hidden;
        }
        .os-back-box{
            background-color: var(--bark-expansion,#0C65D1);
            border-radius: 5px;
            color: #fff;
            display: flex;
            margin-right: 10px;
            width: 40px;
            height: 20px;
            justify-content: center;
            align-items: center;
        }
        .os-subheading{
            font-weight: bold;
            text-align: center;
        }
        .os-progress{
            position: absolute;
            height: 1px;
            left: 0;
            right: 0;
        }
        lit-table{
            min-height: 380px;
        }
        #filter{
            position: absolute;
            bottom: 0;
        }
        </style>
        <label id="time-range"
        style="width: 100%;height: 20px;text-align: end;font-size: 10pt;margin-bottom: 5px">Selected range:0.0 ms
        </label>
        <div style="display: flex;flex-direction: row;" class="d-box">
            <lit-progress-bar class="os-progress"></lit-progress-bar>
            <div id="left_table" style="width: 40%; height:auto;">
                <div style="display: flex; margin-bottom: 10px">
                    <div class="os-go-back">
                        <div class="os-back-box">
                            <lit-icon name="arrowleft"></lit-icon>
                        </div>
                    </div>
                    <div class="title"></div>
                </div>
                <div class="os-subheading"></div>
                <lit-chart-pie  id="os-chart-pie"></lit-chart-pie>
            </div>
            <div class="os-table-box" style="height:auto;">
                <lit-table id="tb-eventtype-usage">
                    <lit-table-column width="250px" class="event-class" title="Memory Type" 
                    data-index="tableName" key="tableName" align="flex-start" order></lit-table-column>
                    <lit-table-column width="100px" class="event-class" title="# Existing" 
                    data-index="existCount" key="existCount" align="flex-start" order></lit-table-column>
                    <lit-table-column width="100px" class="event-class" title="%" 
                    data-index="existCountPercent" key="existCountPercent" align="flex-start" order></lit-table-column>
                    <lit-table-column width="100px" class="event-class" title="# Total" 
                    data-index="applyCount" key="applyCount" align="flex-start" order></lit-table-column>
                    <lit-table-column width="100px" class="event-class" title="%" 
                    data-index="applyCountPercent" key="applyCountPercent" align="flex-start" order></lit-table-column>
                    <lit-table-column width="100px" class="event-class" title="# Transient" 
                    data-index="releaseCount" key="releaseCount" align="flex-start" order></lit-table-column>
                    <lit-table-column width="100px" class="event-class" title="%" 
                    data-index="releaseCountPercent" key="releaseCountPercent" align="flex-start" order>
                    </lit-table-column>
                </lit-table>
                <lit-table id="tb-thread-usage" style="display: none;" hideDownload>
                    <lit-table-column width="250px" class="thread-class" title="Thread" 
                    data-index="tableName" key="tableName" align="flex-start" order></lit-table-column>
                    <lit-table-column width="100px" class="thread-class" title="# Existing" data-index="existCount" 
                    key="existCount" align="flex-start" order></lit-table-column>
                    <lit-table-column width="100px" class="thread-class" title="%" data-index="existCountPercent" 
                    key="existCountPercent" align="flex-start" order></lit-table-column>
                    <lit-table-column width="100px" class="thread-class" title="# Total" data-index="applyCount" 
                    key="applyCount" align="flex-start" order></lit-table-column>
                    <lit-table-column width="100px" class="thread-class" title="%" data-index="applyCountPercent" 
                    key="applyCountPercent" align="flex-start" order></lit-table-column>
                    <lit-table-column width="100px" class="thread-class" title="# Transient" data-index="releaseCount" 
                    key="releaseCount" align="flex-start" order></lit-table-column>
                    <lit-table-column width="100px" class="thread-class" title="%" data-index="releaseCountPercent" 
                    key="releaseCountPercent" align="flex-start" order></lit-table-column>
                </lit-table>
                <lit-table id="tb-so-usage" style="display: none;" hideDownload>
                    <lit-table-column width="250px" class="so-class" title="Library" data-index="tableName" 
                    key="tableName" align="flex-start" order></lit-table-column>
                    <lit-table-column width="100px" class="so-class" title="# Existing" data-index="existCount" 
                    key="existCount" align="flex-start" order></lit-table-column>
                    <lit-table-column width="100px" class="so-class" title="%" data-index="existCountPercent" 
                    key="existCountPercent" align="flex-start" order></lit-table-column>
                    <lit-table-column width="100px" class="so-class" title="# Total" data-index="applyCount" 
                    key="applyCount" align="flex-start" order></lit-table-column>
                    <lit-table-column width="100px" class="so-class" title="%" data-index="applyCountPercent" 
                    key="applyCountPercent" align="flex-start" order></lit-table-column>
                    <lit-table-column width="100px" class="so-class" title="# Transient" data-index="releaseCount" 
                    key="releaseCount" align="flex-start" order></lit-table-column>
                    <lit-table-column width="100px" class="so-class" title="%" data-index="releaseCountPercent" 
                    key="releaseCountPercent" align="flex-start" order></lit-table-column>
                </lit-table>
                <lit-table id="tb-function-usage" style="display: none;" hideDownload>
                    <lit-table-column width="250px" class="function-class" title="Function" data-index="tableName"
                    key="tableName" align="flex-start" order></lit-table-column>
                    <lit-table-column width="100px" class="function-class" title="# Existing" data-index="existCount" 
                    key="existCount" align="flex-start" order></lit-table-column>
                    <lit-table-column width="100px" class="function-class" title="%" data-index="existCountPercent" 
                    key="existCountPercent" align="flex-start" order></lit-table-column>
                    <lit-table-column width="100px" class="function-class" title="# Total" data-index="applyCount" 
                    key="applyCount" align="flex-start" order></lit-table-column>
                    <lit-table-column width="100px" class="function-class" title="%" data-index="applyCountPercent" 
                    key="applyCountPercent" align="flex-start" order></lit-table-column>
                    <lit-table-column width="100px" class="function-class" title="# Transient" 
                    data-index="releaseCount" 
                    key="releaseCount" align="flex-start" order></lit-table-column>
                    <lit-table-column width="100px" class="function-class" title="%" data-index="releaseCountPercent" 
                    key="releaseCountPercent" align="flex-start" order></lit-table-column>
                </lit-table>
            </div>
        </div>
        <tab-pane-filter id="filter" options></tab-pane-filter>
`;