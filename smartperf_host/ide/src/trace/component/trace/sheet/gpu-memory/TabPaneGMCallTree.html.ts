/*
 * Copyright (C) 2025 Huawei Device Co., Ltd.
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

export const TabPaneGMCallTreeHtml = `
        <style>
        :host{
            padding: 10px 10px 0 10px;
            display: flex;
            flex-direction: column;
        }
        .show{
            display: flex;
            flex: 1;
        }
        #gm-call-tree-filter {
            border: solid rgb(216,216,216) 1px;
            float: left;
            position: fixed;
            bottom: 0;
            width: 100%;
        }
        selector{
            display: none;
        }
        .gm-call-tree-progress{
            bottom: 33px;
            position: absolute;
            height: 1px;
            left: 0;
            right: 0;
        }
        .gm-call-tree-loading{
            bottom: 0;
            position: absolute;
            left: 0;
            right: 0;
            width:100%;
            background:transparent;
            z-index: 999999;
        }
    </style>
    <lit-headline class="titleBox"></lit-headline>
    <div class="gm-call-tree-content" style="display: flex;flex-direction: row">
    <selector id='show_table' class="show">
        <lit-slicer style="width:100%">
        <div id="left_table" style="width: 65%">
            <tab-native-data-modal id="modal"></tab-native-data-modal>
            <lit-table id="tb-gpuMemory-calltree" style="height: auto" tree>
                <lit-table-column class="gm-call-tree-column" width="60%" title="Symbol Name" 
                data-index="symbol" key="symbol"  align="flex-start" retract>
                </lit-table-column>
                <lit-table-column class="gm-call-tree-column" width="1fr" title="Size" 
                data-index="heapSizeStr" key="heapSizeStr"  align="flex-start" order>
                </lit-table-column>
                <lit-table-column class="gm-call-tree-column" width="1fr" title="%" 
                data-index="heapPercent" key="heapPercent" align="flex-start"  order>
                </lit-table-column>
                <lit-table-column class="gm-call-tree-column" width="1fr" title="Count" 
                data-index="countValue" key="countValue" align="flex-start" order>
                </lit-table-column>
                <lit-table-column class="gm-call-tree-column" width="1fr" title="%" 
                data-index="countPercent" key="countPercent" align="flex-start" order>
                </lit-table-column>
                <lit-table-column class="gm-call-tree-column" width="1fr" title="  " 
                data-index="type" key="type"  align="flex-start" >
                    <template>
                        <img src="img/library.png" size="20" v-if=" type == 1 ">
                        <img src="img/function.png" size="20" v-if=" type == 0 ">
                        <div v-if=" type == - 1 "></div>
                    </template>
                </lit-table-column>
            </lit-table>
            
        </div>
        <lit-slicer-track class="gm-call-tree-slicer-track" ></lit-slicer-track>
        <lit-table id="tb-gpuMemory-list" no-head 
        style="height: auto;border-left: 1px solid var(--dark-border1,#e2e2e2)" hideDownload>
            <span slot="head">Heaviest Stack Trace</span>
            <lit-table-column class="gm-call-tree-column" width="30px" title="" 
            data-index="type" key="type"  align="flex-start" >
                <template>
                    <img src="img/library.png" size="20" v-if=" type == 1 ">
                    <img src="img/function.png" size="20" v-if=" type == 0 ">
                </template>
            </lit-table-column>
            <lit-table-column class="gm-call-tree-column" width="1fr" title="" 
            data-index="symbol" key="symbol"  align="flex-start"></lit-table-column>
        </lit-table>
        </div>
        </lit-slicer>
     </selector>
     <tab-pane-filter id="gm-call-tree-filter" first second icon gpuMemory></tab-pane-filter>
     <lit-progress-bar class="progress gm-call-tree-progress"></lit-progress-bar>
    <selector class="gm-call-tree-selector" id='show_chart'>
        <tab-framechart id='framechart' style='width: 100%;height: auto'> </tab-framechart>
    </selector>  
    <div class="loading gm-call-tree-loading"></div>
    </div>`;