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
export const TabPaneCurrentSelectionHtml = `
        <style>
            .table-title{
                top: 0;
                background: var(--dark-background,#ffffff);
                position: sticky;
                width: 100%;
                display: flex;
            }
            .table-title > h2{
                font-size: 16px;
                font-weight: 400;
                visibility: visible;
                width: 50%;
                padding: 0 10px;
            }
            #rightTitle{
                width: 50%;
                display: flex;
                justify-content: space-between;
                padding: 0 10px;
                font-size: 16px;
                font-weight: 400;
                visibility: visible;
            }
            #rightTitle > h2{
                font-size: 16px;
                font-weight: 400;
            }           
            #rightButton{
                padding-top:12px;
            }
            .right{
                display: flex;
            }
            #right-star{
                padding-top: 10px;
                visibility: hidden;
            }
            .scroll-area{
                display: flex;
                flex-direction: row;
                flex: 1;
            }
            .table-left{
                width: 50%;
                height: auto;
                padding: 0 10px;
            }
            .table-right{
                width: 50%;
                display: flex;
                height: 650px;
                flex-direction: column;
            }
        </style>
        <div id="scroll_view" style="display: flex;flex-direction: column;width: 100%;height: 100%;overflow: auto">
            <div style="width: 100%;height: auto;position: relative">
                <div class="table-title">
                    <h2 id="leftTitle"></h2>
                    <div id="rightTitle" >
                        <h2 id="rightText">Scheduling Latency</h2>
                        <div class="right">
                        <lit-button id="rightButton"  height="32px" width="164px" color="black" font_size="14px" border="1px solid black" 
                        >GetWakeupList</lit-button>
                        <lit-icon id="right-star" class="collect" name="star-fill" size="30"></lit-icon>
                        </div>
                    </div>
                </div>
            </div>
            <div class="scroll-area">
                <lit-table id="selectionTbl" class="table-left" no-head hideDownload noRecycle>
                        <lit-table-column title="name" data-index="name" key="name" align="flex-start"  width="180px">
                            <template><div>{{name}}</div></template>
                        </lit-table-column>
                        <lit-table-column title="value" data-index="value" key="value" align="flex-start" >
                            <template><div style="display: flex;">{{value}}</div></template>
                        </lit-table-column>
                </lit-table>
                <div class="table-right">
                    <canvas id="rightDraw" style="width: 100%;height: 200px;"></canvas>
                    <lit-table id="wakeupListTbl" style="height: 300px;display: none;overflow: auto" hideDownload>
                        <lit-table-column title="Process" data-index="process" key="process" align="flex-start"  width="180px">
                        </lit-table-column>
                        <lit-table-column title="Thread" data-index="thread" key="thread" align="flex-start"  width="180px">
                        </lit-table-column>
                        <lit-table-column title="CPU" data-index="cpu" key="cpu" align="flex-start"  width="60px">
                        </lit-table-column>
                        <lit-table-column title="Duration(ns)" data-index="dur" key="dur" align="flex-start"  width="120px">
                        </lit-table-column>
                        <lit-table-column title="Priority" data-index="priority" key="priority" align="flex-start"  width="80px">
                        </lit-table-column>
                    </lit-table>
                </div>
            </div>
        </div>
        </div>
        `;
