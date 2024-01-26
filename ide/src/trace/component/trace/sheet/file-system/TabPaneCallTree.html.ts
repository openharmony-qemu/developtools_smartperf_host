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
export const TabPaneCallTreeHtml = `
        <style>
        .call-tree-filter {
            border: solid rgb(216,216,216) 1px;
            float: left;
            position: fixed;
            bottom: 0;
            width: 100%;
        }
        .call-tree-progress{
            position: absolute;
            height: 1px;
            left: 0;
            right: 0;
            bottom: 33px;
        }
        :host{
            display: flex;
            padding: 10px 10px 0 10px;
            flex-direction: column;
        }
        selector{
            display: none;
        }
        .call-tree-loading{
            background:transparent;
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            width:100%;
            z-index: 999999;
        }
         .show{
            display: flex;
            flex: 1;
        }
    </style>
    <div class="call-tree-content" style="display: flex;flex-direction: column">
    <lit-headline class="titleBox"></lit-headline>
    <selector id='show_table' class="show">
        <lit-slicer style="width:100%">
        <div id="left_table" style="width: 65%">
            <lit-table id="tb-calltree" style="height: auto" tree>
                <lit-table-column class="call-tree-column" width="70%" title="Call Stack" data-index="symbolName" key="symbolName"  align="flex-start" retract></lit-table-column>
                <lit-table-column class="call-tree-column" width="1fr" title="Local" data-index="self" key="self"  align="flex-start"  order></lit-table-column>
                <lit-table-column class="call-tree-column" width="1fr" title="Weight" data-index="weight" key="weight"  align="flex-start"  order></lit-table-column>
                <lit-table-column class="call-tree-column" width="1fr" title="%" data-index="weightPercent" key="weightPercent"  align="flex-start"  order></lit-table-column>
            </lit-table>
        </div>
        <lit-slicer-track ></lit-slicer-track>
        <lit-table id="tb-list" no-head style="height: auto;border-left: 1px solid var(--dark-border1,#e2e2e2)" hideDownload>
            <span slot="head">Heaviest Stack Trace</span>
            <lit-table-column class="call-tree-column" width="30px" title="" data-index="type" key="type"  align="flex-start" >
                <template>
                    <img src="img/library.png" size="20" v-if=" type == 1 ">
                    <img src="img/function.png" size="20" v-if=" type == 0 ">
                </template>
            </lit-table-column>
            <lit-table-column class="call-tree-column" width="60px" title="" data-index="count" key="count"  align="flex-start"></lit-table-column>
            <lit-table-column class="call-tree-column" width="1fr" title="" data-index="symbolName" key="symbolName"  align="flex-start"></lit-table-column>
        </lit-table>
        </div>
        </lit-slicer>
     </selector>
     <tab-pane-filter id="filter" class="call-tree-filter" input inputLeftText icon tree fileSystem></tab-pane-filter>
     <lit-progress-bar class="progress call-tree-progress"></lit-progress-bar>
    <selector id='show_chart' class="call-tree-selector" >
        <tab-framechart id='framechart' style='width: 100%;height: auto'> </tab-framechart>
    </selector>
    <div class="loading call-tree-loading"></div>
    </div>`;