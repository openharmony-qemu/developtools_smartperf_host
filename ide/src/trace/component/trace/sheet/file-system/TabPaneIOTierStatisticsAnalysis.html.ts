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
export const TabPaneIOTierStatisticsAnalysisHtml = `
        <style>
        :host {
            display: flex;
            flex-direction: column;
        }
        #io-tier-chart-pie{
            height: 300px;
            margin-bottom: 31px;
        }
         .io-tier-go-back{
            display:flex;
            align-items: center;
            cursor: pointer;
            margin-left: 20px;
            visibility: hidden;
        }
        .io-tier-table-box{
          width: 60%;
          border-left: solid 1px var(--dark-border1,#e0e0e0);
          border-radius: 5px;
          padding: 10px;
          margin-bottom: 31px;
        }
        #filter{
            position: absolute;
            bottom: 0px;
        }
        .io-tier-back-box{
            height: 20px;
            justify-content: center;
            align-items: center;
            background-color: var(--bark-expansion,#0C65D1);
            border-radius: 5px;
            color: #fff;
            display: flex;
            margin-right: 10px;
            width: 40px;
        }
        .io-tier-subheading{
            font-weight: bold;
            text-align: center;
        }
        .progress{
            left: 0;
            right: 0;
            position: absolute;
            height: 1px;
        }
        </style>
        <label id="time-range" style="width: 100%;height: 20px;text-align: end;margin-bottom: 5px;font-size: 10pt;">Selected range:0.0 ms</label> 
        <div style="display: flex;flex-direction: row;"class="d-box">
            <lit-progress-bar class="progress"></lit-progress-bar>
            <div id="left_table" style="width: 40%;height:auto;">
                <div style="display: flex;margin-bottom: 10px">
                    <div class="io-tier-go-back">
                        <div class="io-tier-back-box">
                            <lit-icon name="arrowleft"></lit-icon>
                        </div>
                    </div>
                    <div class="title"></div>
                </div>
                <div class="io-tier-subheading"></div>                       
                <lit-chart-pie  id="io-tier-chart-pie"></lit-chart-pie>     
            </div>
            <div class="io-tier-table-box" style="height:auto;overflow: auto">
                <lit-table id="tb-process-usage" style="max-height:565px;min-height: 350px">
                    <lit-table-column width="1fr" title="ProcessName" data-index="tableName" key="tableName" align="flex-start"order></lit-table-column>
                    <lit-table-column width="1fr" title="Duration" data-index="durFormat" key="durFormat" align="flex-start" order></lit-table-column>
                    <lit-table-column width="1fr" title="%" data-index="percent" key="percent" align="flex-start"order></lit-table-column>
                </lit-table>
                <lit-table id="tb-type-usage" class="io-analysis" style="max-height:565px;min-height: 350px"hideDownload>
                    <lit-table-column width="1fr" title="Type" data-index="tableName" key="tableName" align="flex-start"order></lit-table-column>
                    <lit-table-column width="1fr" title="Duration" data-index="durFormat" key="durFormat" align="flex-start" order></lit-table-column>
                    <lit-table-column width="1fr" title="%" data-index="percent" key="percent" align="flex-start"order></lit-table-column>
                </lit-table>
                <lit-table id="tb-thread-usage" class="io-analysis" style="max-height:565px;display: none;min-height: 350px"hideDownload>
                    <lit-table-column width="1fr" title="ThreadName" data-index="tableName" key="tableName" align="flex-start"order></lit-table-column>
                    <lit-table-column width="1fr" title="Duration" data-index="durFormat" key="durFormat" align="flex-start" order></lit-table-column>
                    <lit-table-column width="1fr" title="%" data-index="percent" key="percent" align="flex-start"order></lit-table-column>
                </lit-table>
                    <lit-table id="tb-so-usage" class="io-analysis" style="max-height:565px;display: none;min-height: 350px"hideDownload>
                    <lit-table-column width="1fr" title="Library" data-index="tableName" key="tableName" align="flex-start"order></lit-table-column>
                    <lit-table-column width="1fr" title="Duration" data-index="durFormat" key="durFormat" align="flex-start" order></lit-table-column>
                    <lit-table-column width="1fr" title="%" data-index="percent" key="percent" align="flex-start"order></lit-table-column>
                </lit-table>
                <lit-table id="tb-function-usage" class="io-analysis" style="max-height:565px;display: none;min-height: 350px"hideDownload>
                    <lit-table-column title="Function" data-index="tableName"  key="tableName" width="1fr" align="flex-start"order></lit-table-column>
                    <lit-table-column data-index="durFormat" order key="durFormat" align="flex-start" width="1fr" title="Duration"></lit-table-column>
                    <lit-table-column width="1fr" key="percent" align="flex-start" order title="%" data-index="percent" ></lit-table-column>
                </lit-table>
            </div>
        </div>
        <tab-pane-filter id="filter" options></tab-pane-filter>
`;