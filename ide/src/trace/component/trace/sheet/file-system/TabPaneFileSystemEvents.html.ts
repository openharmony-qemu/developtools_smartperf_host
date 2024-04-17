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
export const TabPaneFileSystemEventsHtml = `
    <style>
        :host{
            padding: 10px 10px 0 10px;
            display: flex;
            flex-direction: column;
        }
        .fs-event-loading{
            bottom: 0;
            position: absolute;
            left: 0;
            right: 0;
            width:100%;
            background:transparent;
            z-index: 999999;
        }
        .fs-event-progress{
            bottom: 33px;
            position: absolute;
            height: 1px;
            z-index: 99;
            left: 0;
            right: 0;
        }
        #fs-event-filter {
            border: solid rgb(216,216,216) 1px;
            float: left;
            position: fixed;
            bottom: 0;
            width: 100%;
        }
        </style>
        <div class="fs-event-content" style="display: flex;flex-direction: column">
            <div style="display: flex;flex-direction: row;">
                <lit-slicer style="width:100%">
                    <div style="width: 65%">
                        <lit-table id="tbl-filesystem-event" style="height: auto">
                            <lit-table-column class="fs-event-column" width="200px" title="Start" data-index="startTsStr" key="startTsStr" align="flex-start" order></lit-table-column>
                            <lit-table-column class="fs-event-column" width="160px" title="Duration" data-index="durStr" key="durStr" align="flex-start" order></lit-table-column>
                            <lit-table-column class="fs-event-column" width="240px" title="Process" data-index="process" key="process" align="flex-start" order></lit-table-column>
                            <lit-table-column class="fs-event-column" width="240px" title="Thread" data-index="thread" key="thread" align="flex-start" order></lit-table-column>
                            <lit-table-column class="fs-event-column" width="120px" title="Type" data-index="typeStr" key="typeStr" align="flex-start" order></lit-table-column>
                            <lit-table-column class="fs-event-column" width="120px" title="File Descriptor" data-index="fd" key="fd" align="flex-start" order></lit-table-column>
                            <lit-table-column class="fs-event-column" width="160px" title="File Path" data-index="path" key="path" align="flex-start" order></lit-table-column>
                            <lit-table-column class="fs-event-column" width="160px" title="First Argument" data-index="firstArg" key="firstArg" align="flex-start" ></lit-table-column>
                            <lit-table-column class="fs-event-column" width="160px" title="Second Argument" data-index="secondArg" key="secondArg" align="flex-start" ></lit-table-column>
                            <lit-table-column class="fs-event-column" width="160px" title="Third Argument" data-index="thirdArg" key="thirdArg" align="flex-start" ></lit-table-column>
                            <lit-table-column class="fs-event-column" width="160px" title="Fourth Argument" data-index="fourthArg" key="fourthArg" align="flex-start" ></lit-table-column>
                            <lit-table-column class="fs-event-column" width="160px" title="Return" data-index="returnValue" key="returnValue" align="flex-start" ></lit-table-column>
                            <lit-table-column class="fs-event-column" width="160px" title="Error" data-index="error" key="error" align="flex-start" ></lit-table-column>
                            <lit-table-column class="fs-event-column" width="600px" title="Backtrace" data-index="backtrace" key="backtrace" align="flex-start" >
                                <template>
                                    <div>
                                        <span>{{backtrace[0]}}</span>
                                        <span v-if="backtrace.length > 1">⬅</span>
                                        <span v-if="backtrace.length > 1"style="color: #565656;"> {{backtrace[1]}}</span>
                                    </div>
                                </template>
                            </lit-table-column>
                        </lit-table>
                    </div>
                    <lit-slicer-track class="fs-evnet-slicer-tracker"></lit-slicer-track>
                    <lit-table id="tbr-filesystem-event" no-head style="height: auto;border-left: 1px solid var(--dark-border1,#e2e2e2)" hideDownload>
                        <lit-table-column class="fs-event-column" width="60px" title="" data-index="type" key="type"  align="flex-start" >
                            <template>
                                <div v-if=" type == -1 ">Thread:</div>
                                <img src="img/library.png" size="20" v-if=" type == 1 ">
                                <img src="img/function.png" size="20" v-if=" type == 0 ">
                            </template>
                        </lit-table-column>
                        <lit-table-column class="fs-event-column" width="1fr" title="" data-index="symbol" key="symbol"  align="flex-start">
                        </lit-table-column>
                    </lit-table>
                </lit-slicer>
            </div>
            <lit-progress-bar class="progress fs-event-progress"></lit-progress-bar>
            <tab-pane-filter id="fs-event-filter" first second></tab-pane-filter>
            <div class="loading fs-event-loading"></div>
        </div>
`;