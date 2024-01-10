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

export const TabPaneSummaryHtml = `
<style>
:host{
    display: flex;
    flex-direction: column;
    padding: 10px 1px 0 0;
    height: calc(100% - 25px);
}
.vessel {
    /* overflow: hidden; */
    width: 100%;
    height: 100%;
}
.vessel-left {
    height: 79.5vh;
    position: relative;
    float: left;
    max-width: 70%
}
.vessel-right {
    height: 70vh;
    box-sizing: border-box;
    overflow: hidden;
}
.text{
    opacity: 0.9;
    font-family: Helvetica;
    font-size: 16px;
    color: #000000;
    line-height: 28px;
    font-weight: 400;
    margin-left: 70%;
}
ul{
    display: inline-flex;
    margin-top: 0;
    width: 40%;
    position: absolute;
    padding-left: 5px;
}
li{
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    opacity: 0.9;
    font-family: Helvetica;
    font-size: 16px;
    color: #000000;
    line-height: 28px;
    font-weight: 400;
    cursor: pointer;
}
.active{
    border-bottom:2px solid #6C9BFA;
}
.stackText{
    opacity: 0.9;
    font-family: Helvetica;
    font-size: 16px;
    color: #000000;
    line-height: 28px;
    font-weight: 400;
}
tab-pane-filter {
    border: solid rgb(216,216,216) 1px;
    float: left;
    position: fixed;
    bottom: 0;
    width: 100%;
}
.summary_progress{
    bottom: 33px;
    position: absolute;
    height: 1px;
    left: 0;
    right: 0;
}
selector{
    display: none;
}
.summary_show{
    display: flex;
    flex: 1;
}
.summary_retainers{
    height: 30px;
    width: 100%;
    display: flex;
}
#summary_right{
    height: calc(100% - 30px);
}
</style>
<div style="display: flex;flex-direction: row;height: 100%;">
<selector id='show_table' class="summary_show">
    <lit-slicer style="width:100%">
    <div id="summary_left_table" style="width: 65%;">
        <lit-table id="summary_left" style="height: 100%" tree>
            <lit-table-column width="40%" title="Constructor" data-index="objectName" key="objectName" 
            align="flex-start" order>
            </lit-table-column>
            <lit-table-column width="2fr" title="Distance" data-index="distance" key="distance" 
            align="flex-start" order>
            </lit-table-column>
            <lit-table-column width="2fr" title="ShallowSize" data-index="shallowSize" key="shallowSize" 
            align="flex-start" order>
            </lit-table-column>
            <lit-table-column width="1fr" title="" data-index="shallowPercent" key="shallowPercent" 
            align="flex-start">
            </lit-table-column>
            <lit-table-column width="2fr" title="RetainedSize" data-index="retainedSize" key="retainedSize" 
            align="flex-start" order>
            </lit-table-column>
            <lit-table-column width="1fr" title="" data-index="retainedPercent" key="retainedPercent" 
            align="flex-start">
            </lit-table-column>
        </lit-table>
    </div>
    <lit-slicer-track ></lit-slicer-track>
    <div style="flex: 1;display: flex; flex-direction: row;">
        <div style="flex: 1;display: block;">
            <div class="summary_retainers">
                <ul>
                    <li href="#" id="retainers" style="width: 80px; text-align: center;" 
                    class="active">Retainers</li>
                    <li href="#" id="stack" style="width: 120px; text-align: center; display: none; 
                    padding-left: 10px;">Allocation stack</li>
                </ul>
            </div>
            <lit-table id="summary_right" tree>
                <lit-table-column width="40%" title="Object" data-index="objectName" key="objectName" 
                align="flex-start" order>
                </lit-table-column>
                <lit-table-column width="2fr" title="Distance" data-index="distance" key="distance" 
                align="flex-start" order>
                </lit-table-column>
                <lit-table-column width="2fr" title="ShallowSize" data-index="shallowSize" key="shallowSize" 
                align="flex-start" order>
                </lit-table-column>
                <lit-table-column width="1fr" title="" data-index="shallowPercent" key="shallowPercent" 
                align="flex-start">
                </lit-table-column>
                <lit-table-column width="2fr" title="RetainedSize" data-index="retainedSize" key="retainedSize" 
                align="flex-start" order>
                </lit-table-column>
                <lit-table-column width="1fr" title="" data-index="retainedPercent" key="retainedPercent" 
                align="flex-start">
                </lit-table-column>
            </lit-table>
            <text class="stackText" style="display: none;"></text>
            <lit-table id="stackTable" style="height: auto; display: none" hideDownload>
                <lit-table-column width="100%" title="" data-index="name" key="name" align="flex-start" order>
                </lit-table-column>
            </lit-table>
        </div>
    </div>
    </lit-slicer>
</selector>
<tab-pane-js-memory-filter id="filter" input inputLeftText></tab-pane-js-memory-filter>
<lit-progress-bar class="summary_progress"></lit-progress-bar>
</div>
`;
