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
export const TabCpuDetailsThreadsHtml = `
        <style>
        :host {
            width: 100%;
            height: 100%;
            background-color: var(--dark-background,#FFFFFF);
            display: none;
        }
        .cpu-thread-d-box{
            display: flex;
            margin: 20px;
            height: calc(100vh - 165px);
        }
        .cpu-thread-chart-box{
            width: 40%;
        }
        .cpu-thread-subheading{
            font-weight: bold;
        }
        #tb-cpu-usage{
            height: 100%;
        }
        .cpu-thread-back-box{
            color: #fff;
            background-color: var(--bark-expansion,#0C65D1);
            border-radius: 5px;
            display: flex;
            margin-right: 10px;
            justify-content: center;
            align-items: center;
            width: 40px;
            height: 20px;
        }
        .cpu-thread-table-box{
            width: 60%;
            max-height: calc(100vh - 165px);
            border: solid 1px var(--dark-border1,#e0e0e0);
            border-radius: 5px;
            padding: 10px;
        }
        #cpu-thread-chart-pie{
            height: 360px;
        }
        .cpu-thread-go-back{
            display:flex;
            align-items: center;
            cursor: pointer;
        }
        </style>
        <lit-progress-bar id="loading" style="height: 1px;width: 100%"></lit-progress-bar>
        <div class="cpu-thread-d-box">
            <div class="cpu-thread-chart-box">
                <div class="cpu-thread-go-back">
                    <div class="cpu-thread-back-box">
                        <lit-icon name="arrowleft"></lit-icon>
                    </div>
                    <!--<lit-icon name="arrowleft"></lit-icon>-->
                    <div class="cpu-thread-subheading">Threads in Freq</div>
                </div>
                <div style="margin-top:15px;text-align: center">Statistics By Duration</div>
                <lit-chart-pie  id="cpu-thread-chart-pie"></lit-chart-pie>
            </div>
            <div class="cpu-thread-table-box">
                <table-no-data id="table-no-data">
                    <lit-table id="tb-cpu-usage" hideDownload>
                        <lit-table-column width="100px" title="No" data-index="index" key="index" align="flex-start" order></lit-table-column>
                        <lit-table-column width="200px" title="t_name" data-index="tName" key="tName" align="flex-start" order></lit-table-column>
                        <lit-table-column width="100px" title="tid" data-index="tid" key="tid" align="flex-start" order></lit-table-column>
                        <lit-table-column width="200px" title="p_name" data-index="pName" key="pName" align="flex-start" order></lit-table-column>
                        <lit-table-column width="100px" title="p_pid" data-index="pid" key="pid" align="flex-start" order></lit-table-column>
                        <lit-table-column width="100px" title="duration" data-index="durStr" key="durStr" align="flex-start" order></lit-table-column>
                        <lit-table-column width="100px" title="%" data-index="ratio" key="ratio" align="flex-start" order></lit-table-column>
                    </lit-table>
                </table-no-data>
            </div>
        </div>
        `;
