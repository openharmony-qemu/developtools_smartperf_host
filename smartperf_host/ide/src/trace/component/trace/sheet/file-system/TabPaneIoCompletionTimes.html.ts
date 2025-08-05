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
export const TabPaneIoCompletionTimesHtml = `
    <style>
        :host{
            display: flex;
            flex-direction: column;
            padding: 10px 10px 0 10px;
        }
        .io-completiontimes-loading{
            bottom: 0;
            position: absolute;
            left: 0;
            right: 0;
            width:100%;
            background:transparent;
            z-index: 999999;
        }
        .io-completion-progress{
            bottom: 33px;
            position: absolute;
            height: 1px;
            z-index: 99;
            left: 0;
            right: 0;
        }
        #io-completion-filter {
            border: solid rgb(216,216,216) 1px;
            float: left;
            position: fixed;
            bottom: 0;
            width: 100%;
        }
        </style>
        <div class="io-completion-content" style="display: flex;flex-direction: column">
            <div style="display: flex;flex-direction: row;">
                <lit-slicer style="width:100%">
                    <div style="width: 65%">
                        <lit-table id="tbl-io-completion-times" style="height: auto">
                            <lit-table-column class="io-completion-column" width="200px" title="Start" data-index="startTsStr" key="startTsStr" align="flex-start" order></lit-table-column>
                            <lit-table-column class="io-completion-column" width="260px" title="Total Latency" data-index="durStr" key="durStr" align="flex-start" order></lit-table-column>
                            <lit-table-column class="io-completion-column" width="200px" title="Process" data-index="process" key="process" align="flex-start" order></lit-table-column>
                            <lit-table-column class="io-completion-column" width="200px" title="Latency per 4KB" data-index="durPer4kStr" key="durPer4kStr" align="flex-start" order></lit-table-column>
                            <lit-table-column class="io-completion-column" width="200px" title="Thread" data-index="thread" key="thread" align="flex-start" order></lit-table-column>
                            <lit-table-column class="io-completion-column" width="200px" title="Operation" data-index="operation" key="operation" align="flex-start" order></lit-table-column>
                            <lit-table-column class="io-completion-column" width="200px" title="Bytes" data-index="sizeStr" key="sizeStr" align="flex-start" order></lit-table-column>
                            <lit-table-column class="io-completion-column" width="280px" title="Path" data-index="path" key="path" align="flex-start" ></lit-table-column>
                            <lit-table-column class="io-completion-column" width="200px" title="Block number" data-index="blockNumber" key="blockNumber" align="flex-start" ></lit-table-column>
                            <lit-table-column class="io-completion-column" width="240px" title="Tier" data-index="tier" key="tier" align="flex-start" order></lit-table-column>
                            <lit-table-column class="io-completion-column" width="600px" title="Backtrace" data-index="backtrace" key="backtrace" align="flex-start" >
                                <template>
                                    <div>
                                        <span>{{backtrace[0]}}</span>
                                        <span v-if="backtrace.length > 1">⬅</span>
                                        <span v-if="backtrace.length > 1"style="color: #565656"> {{backtrace[1]}}</span>
                                    </div>
                                </template>
                            </lit-table-column>
                        </lit-table>
                    </div>
                    <lit-slicer-track class="io-completion-slicer-tracker"></lit-slicer-track>
                    <lit-table id="tbr-io-completion-times" no-head style="height: auto;border-left: 1px solid var(--dark-border1,#e2e2e2)" hideDownload>
                        <lit-table-column class="io-completion-column" width="60px" title="" data-index="type" key="type"  align="flex-start" >
                            <template>
                                <div v-if=" type == -1 ">Thread:</div>
                                <img src="img/library.png" size="20" v-if=" type == 1 ">
                                <img src="img/function.png" size="20" v-if=" type == 0 ">
                            </template>
                        </lit-table-column>
                        <lit-table-column class="io-completion-column" width="1fr" title="" data-index="symbol" key="symbol"  align="flex-start">
                        </lit-table-column>
                    </lit-table>
                </lit-slicer>
            </div>
            <lit-progress-bar class="progress io-completion-progress"></lit-progress-bar>
            <tab-pane-filter id="io-completion-filter" first></tab-pane-filter>
            <div class="io-completiontimes-loading"></div>
        </div>
`;
