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
export const TabCpuDetailsFrequencyHtml = `
        <style>
        #loading{
            height: 1px;
            width: 100%
        }
        :host {
            width: 100%;
            height: 100%;
            background-color: var(--dark-background,#FFFFFF);
        }
        .d-box{
            display: flex;
            margin: 20px;
            height: calc(100vh - 165px);
        }
        .fre-chart-box{
            width: 40%;
        }
        #fre-tb-cpu-usage{
            height: 100%;
        }
        .table-box{
            width: 60%;
            max-height: calc(100vh - 165px);
            padding: 10px;
            border: solid 1px var(--dark-border1,#e0e0e0);
            border-radius: 5px;
        }
        #chart-pie{
            height: 360px;
        }
        </style>
        <lit-progress-bar id="loading"></lit-progress-bar>
        <div class="d-box">
            <div class="fre-chart-box">
                <div style="text-align: center">Statistics By Duration</div>
                <lit-chart-pie  id="chart-pie"></lit-chart-pie>
            </div>
            <div class="table-box">
                <table-no-data id="table-no-data">
                    <lit-table id="fre-tb-cpu-usage" hideDownload>
                        <lit-table-column width="100px" title="No" data-index="index" key="index" align="flex-start" order></lit-table-column>
                        <lit-table-column width="150px" title="frequency" data-index="value" key="value" align="flex-start" order></lit-table-column>
                        <lit-table-column width="100px" title="min" data-index="min" key="min" align="flex-start" order></lit-table-column>
                        <lit-table-column width="100px" title="max" data-index="max" key="max" align="flex-start" order></lit-table-column>
                        <lit-table-column width="100px" title="average" data-index="avg" key="avg" align="flex-start" order></lit-table-column>
                        <lit-table-column width="100px" title="duration" data-index="sumTimeStr" key="sumTimeStr" align="flex-start" order></lit-table-column>
                        <lit-table-column width="100px" title="%" data-index="ratio" key="ratio" align="flex-start" order></lit-table-column>
                    </lit-table>
                </table-no-data>
            </div>
        </div>
        <tab-cpu-details-threads id="tab-cpu-details-threads"></tab-cpu-details-threads>
        `;
