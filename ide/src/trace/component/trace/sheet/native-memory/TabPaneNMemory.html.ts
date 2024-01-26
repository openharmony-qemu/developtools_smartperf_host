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

export const TabPaneNMemoryHtml = `
        <style>
        .nm-memory-loading{
            bottom: 0;
            position: absolute;
            left: 0;
            right: 0;
            width:100%;
            background:transparent;
            z-index: 999999;
        }
        :host{
            display: flex;
            flex-direction: column;
            padding: 10px 10px 0 10px;
        }
        .nm-memory-progress{
            bottom: 33px;
            position: absolute;
            height: 1px;
            left: 0;
            right: 0;
        }
        .nm-memory-filter {
            border: solid rgb(216,216,216) 1px;
            float: left;
            position: fixed;
            bottom: 0;
            width: 100%;
        }
        </style>
        <div class="nm-memory-content" style="display: flex;flex-direction: column">
            <div style="display: flex;flex-direction: row">
                <lit-slicer style="width:100%">
                    <div style="width: 65%">
                        <lit-page-table id="tb-native-memory" style="height: auto">
                            <lit-table-column class="nm-memory-column" width="60px" title="#" 
                            data-index="index" key="index"  align="flex-start" order>
                            </lit-table-column>
                            <lit-table-column class="nm-memory-column" width="1fr" title="Address" 
                            data-index="addr" key="addr"  align="flex-start" order>
                            </lit-table-column>
                            <lit-table-column class="nm-memory-column" width="1fr" title="Memory Type" 
                            data-index="eventType" key="eventType"  align="flex-start">
                            </lit-table-column>
                            <lit-table-column class="nm-memory-column" width="1fr" title="Timestamp" 
                            data-index="startTs" key="startTs"  align="flex-start" order>
                            </lit-table-column>
                            <lit-table-column class="nm-memory-column" width="1fr" title="State" 
                            data-index="endTs" key="endTs"  align="flex-start">
                            </lit-table-column>
                            <lit-table-column class="nm-memory-column" width="1fr" title="Size" 
                            data-index="heapSize" key="heapSize"  align="flex-start" order>
                            </lit-table-column>
                            <lit-table-column class="nm-memory-column" width="20%" title="Responsible Library" 
                            data-index="library" key="library"  align="flex-start">
                            </lit-table-column>
                            <lit-table-column class="nm-memory-column" width="20%" title="Responsible Caller" 
                            data-index="symbol" key="symbol"  align="flex-start">
                            </lit-table-column>
                        </lit-page-table>
                    </div>
                    <lit-slicer-track></lit-slicer-track>
                    <lit-table id="tb-native-data" no-head 
                    style="height: auto;border-left: 1px solid var(--dark-border1,#e2e2e2)" hideDownload>
                        <lit-table-column class="nm-memory-column" width="80px" title="" 
                        data-index="type" key="type"  align="flex-start" >
                            <template>
                                <div v-if=" type == -1 ">Thread:</div>
                                <img src="img/library.png" size="20" v-if=" type == 1 ">
                                <img src="img/function.png" size="20" v-if=" type == 0 ">
                            </template>
                        </lit-table-column>
                        <lit-table-column class="nm-memory-column" width="1fr" title="" 
                        data-index="title" key="title"  align="flex-start">
                        </lit-table-column>
                    </lit-table>
                </lit-slicer>
            </div>
            <lit-progress-bar class="progress nm-memory-progress"></lit-progress-bar>
            <tab-pane-filter id="filter" class="nm-memory-filter" mark first second></tab-pane-filter>
            <div class="loading nm-memory-loading"></div>
        </div>`;