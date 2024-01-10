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

export const TabPaneJsCpuStatisticsHtml = `
<style>
:host{
    height: 100%;
    background-color: var(--dark-background,#FFFFFF);
    display: flex;
    flex-direction: column;
}
.d-box{
    display: flex;
    margin: 20px;
    height: calc(100vh - 165px);
}
.chart-box{
    width: 40%;
}
.table-box{
    width: 60%;
    max-height: calc(100vh - 165px);
    border-left: solid 1px var(--dark-border1,#e0e0e0);
    border-radius: 5px;
    padding: 10px;
}
#chart-pie{
    height: 360px;
}
.js-cpu-statistics-tbl {
    height: auto
}
.statistics-column{
    min-width: 130px;
}
</style>
<lit-progress-bar id="loading" style="height: 1px;width: 100%"></lit-progress-bar>
<div class="d-box">
    <div class="chart-box">
        <div style="text-align: center">Statistics By Total</div>
        <lit-chart-pie id="chart-pie"></lit-chart-pie>
    </div>
    <div class="table-box">
        <lit-table id="statistics-table" class="js-cpu-statistics-tbl">
            <lit-table-column class="statistics-column" width="1fr" title="Type" 
            data-index="type" key="type"  align="flex-start" order></lit-table-column>
            <lit-table-column class="statistics-column" width="1fr" title="Total" 
            data-index="timeStr" key="timeStr"  align="flex-start" order></lit-table-column>
            <lit-table-column class="statistics-column" width="1fr" title="%" 
            data-index="percentage" key="percentage"  align="flex-start" order></lit-table-column>
        </lit-table>
    </div>
</div>
`;
