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
export const TabCpuDetailsIrqHtml = `
        <style>
        .irq-box{
            display: flex;
            margin: 20px;
            height: calc(100vh - 165px);
        }
        .irq-chart-box{
            width: 40%;
        }
        #tb-cpu-irq{
            height: 100%;
        }
        .table-box{
            border: solid 1px var(--dark-border1,#e0e0e0);
            border-radius: 5px;
            width: 60%;
            max-height: calc(100vh - 165px);
            padding: 10px;
        }
        :host {
            width: 100%;
            height: 100%;
            background-color: var(--dark-background,#FFFFFF);
        }
        #chart-pie{
            height: 360px;
        }
        </style>
        <lit-progress-bar id="loading" style="height: 1px;width: 100%"></lit-progress-bar>
        <div class="irq-box">
            <div class="irq-chart-box">
                <div style="text-align: center">Statistics By Duration</div>
                <lit-chart-pie  id="chart-pie"></lit-chart-pie>
            </div>
            <div class="table-box">
                <table-no-data id="table-no-data">
                    <lit-table id="tb-cpu-irq" hideDownload>
                        <lit-table-column width="100px" title="No" data-index="index" key="index" align="flex-start" order></lit-table-column>
                        <lit-table-column width="150px" title="block" data-index="block" key="block" align="flex-start" order></lit-table-column>
                        <!--<lit-table-column width="100px" title="id" data-index="id" key="id" align="flex-start" order></lit-table-column>-->
                        <lit-table-column title="name" data-index="value" key="value" align="flex-start" order width="150px"></lit-table-column>
                        <lit-table-column title="min" data-index="min" key="min" align="flex-start" order width="100px"></lit-table-column>
                        <lit-table-column title="max" data-index="max" key="max" align="flex-start" order width="100px"></lit-table-column>
                        <lit-table-column title="average" data-index="avg" key="avg" align="flex-start" order width="100px"></lit-table-column>
                        <lit-table-column title="duration" data-index="sumTimeStr" key="sumTimeStr" align="flex-start" order width="100px"></lit-table-column>
                        <lit-table-column title="%" data-index="ratio" key="ratio" align="flex-start" order width="100px"></lit-table-column>
                    </lit-table>
                </table-no-data>
            </div>
        </div>
        `;