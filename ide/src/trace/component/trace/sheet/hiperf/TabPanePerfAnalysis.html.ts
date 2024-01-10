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

export const TabPanePerfAnalysisHtml = `
<style>
:host {
    display: flex;
    flex-direction: column;
}
#perf-chart-pie{
    height: 300px;
}
.perf-table-box{
    width: 60%;
    border-left: solid 1px var(--dark-border1,#e0e0e0);
    border-radius: 5px;
    padding: 10px;
}
.perf-go-back{
    display:flex;
    align-items: center;
    cursor: pointer;
    margin-left: 20px;
    visibility: hidden;
}
.perf-back-box{
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
.perf-subheading{
    font-weight: bold;
    text-align: center;
}
.perf-progress{
    position: absolute;
    height: 1px;
    left: 0;
    right: 0;
}
#filter{
    position: absolute;
    bottom: 0px;
}
</style>
<label id="time-range" style="width: 100%;height: 20px;text-align: end;font-size: 10pt;margin-bottom: 5px">Selected range:0.0 ms</label> 
<div style="display: flex; flex-direction: row;" class="d-box">
    <lit-progress-bar class="perf-progress"></lit-progress-bar>
    <div id="left_table" style="width: 40%;height:auto;">
        <div style="display: flex;margin-bottom: 10px">
            <div class="perf-go-back">
                <div class="perf-back-box">
                    <lit-icon name="arrowleft"></lit-icon>
                </div>
            </div>
            <div class="title"></div>
        </div>
        <div class="perf-subheading"></div>
        <lit-chart-pie  id="perf-chart-pie"></lit-chart-pie>
    </div>
    <div class="perf-table-box" style="height:auto;overflow: auto">
        <lit-table id="tb-process-usage" style="display: none;min-height: 380px" >
            <lit-table-column width="1fr" title="ProcessName" data-index="tableName" key="tableName" 
            align="flex-start" order></lit-table-column>
            <lit-table-column width="1fr" title="Sample Count" data-index="count" key="count" 
            align="flex-start" order></lit-table-column>
            <lit-table-column width="1fr" title="%" data-index="percent" key="percent" 
            align="flex-start" order></lit-table-column>
                <lit-table-column width="1fr" title="Event Count" data-index="eventCount" key="eventCount" 
                align="flex-start" order></lit-table-column>
                <lit-table-column width="1fr" title="%" data-index="eventPercent" key="eventPercent" 
                align="flex-start" order></lit-table-column>
        </lit-table>
        <lit-table id="tb-thread-usage" style="display: none;min-height: 380px" hideDownload>
            <lit-table-column width="1fr" title="ThreadName" data-index="tableName" key="tableName" 
            align="flex-start" order></lit-table-column>
            <lit-table-column width="1fr" title="Sample Count" data-index="count" key="count" 
            align="flex-start" order></lit-table-column>
            <lit-table-column width="1fr" title="%" data-index="percent" key="percent" 
            align="flex-start" order></lit-table-column>
                <lit-table-column width="1fr" title="Event Count" data-index="eventCount" key="eventCount" 
                align="flex-start" order></lit-table-column>
                <lit-table-column width="1fr" title="%" data-index="eventPercent" key="eventPercent" 
                align="flex-start" order></lit-table-column>
        </lit-table>
        <lit-table id="tb-so-usage" style="display: none;min-height: 380px" hideDownload>
            <lit-table-column width="1fr" title="Library" data-index="tableName" key="tableName" align="flex-start" order></lit-table-column>
            <lit-table-column width="1fr" title="Sample Count" data-index="count" key="count" align="flex-start" order></lit-table-column>
            <lit-table-column width="1fr" title="%" data-index="percent" key="percent" align="flex-start" order></lit-table-column>
                <lit-table-column width="1fr" title="Event Count" data-index="eventCount" key="eventCount" align="flex-start" order></lit-table-column>
                <lit-table-column width="1fr" title="%" data-index="eventPercent" key="eventPercent" align="flex-start" order></lit-table-column>
        </lit-table>
        <lit-table id="tb-function-usage" style="display: none;min-height: 380px" hideDownload>
            <lit-table-column width="1fr" title="Function" data-index="tableName" key="tableName" align="flex-start" order></lit-table-column>
            <lit-table-column width="1fr" title="Sample Count" data-index="count" key="count" align="flex-start" order></lit-table-column>
            <lit-table-column width="1fr" title="%" data-index="percent" key="percent" align="flex-start" order></lit-table-column>
                <lit-table-column width="1fr" title="Event Count" data-index="eventCount" key="eventCount" align="flex-start" order></lit-table-column>
                <lit-table-column width="1fr" title="%" data-index="eventPercent" key="eventPercent" align="flex-start" order></lit-table-column>
        </lit-table>
    </div>
</div>
<tab-pane-filter id="filter" options></tab-pane-filter>
`;
