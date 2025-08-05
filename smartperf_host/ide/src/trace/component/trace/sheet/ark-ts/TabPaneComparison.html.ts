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

export const TabPaneComparisonHtml = `
<style>
:host{
    display: flex;
    flex-direction: column;
    padding: 10px 10px 0 10px;
    height: calc(100% - 10px - 31px);
}
.show{
    display: flex;
    flex: 1;
}
.progress{
    bottom: 33px;
    position: absolute;
    height: 1px;
    left: 0;
    right: 0;
}
selector{
    display: none;
}
tab-pane-filter {
    border: solid rgb(216,216,216) 1px;
    float: left;
    position: fixed;
    bottom: 0;
    width: 100%;
}
.loading{
    bottom: 0;
    position: absolute;
    left: 0;
    right: 0;
    width:100%;
    background:transparent;
    z-index: 999999;
}
</style>
<div style="display: flex;flex-direction: row;height: 100%;">
    <selector id='show_table' class="show">
        <lit-slicer style="width:100%">
            <div style="width: 65%">
                <lit-table id="tb-comparison" style="height: auto" tree>
                    <lit-table-column width="30%" title="#Constructor" data-index="objectName" key="objectName"  align="flex-start" order>
                    </lit-table-column>
                    <lit-table-column width="1fr" title="#New" data-index="addedCount" key="addedCount"  align="flex-start" order>
                    </lit-table-column>
                    <lit-table-column width="1fr" title="#Deleted" data-index="removedCount" key="removedCount" align="flex-start"  order>
                    </lit-table-column>
                    <lit-table-column width="1fr" title="#Delta" data-index="deltaCount" key="deltaCount" align="flex-start"  order>
                    </lit-table-column>
                    <lit-table-column width="1fr" title="Alloc.Size" data-index="addedSize" key="addedSize" align="flex-start" order>
                    </lit-table-column>
                    <lit-table-column width="1fr" title="Freed Size" data-index="removedSize" key="removedSize" align="flex-start"  order>
                    </lit-table-column>
                    <lit-table-column width="1fr" title="Size Delta" data-index="deltaSize" key="deltaSize" align="flex-start"  order>
                    </lit-table-column>
                </lit-table>
            </div>
            <lit-slicer-track ></lit-slicer-track>
            <div style="flex: 1;display: flex; flex-direction: row;">
                <div style="flex: 1;display: flex; flex-direction: column;">
                    <span slot="head" >Retainers</span>
                    <lit-table id="tb-retainer" style="height: calc(100% - 21px);" tree>
                        <lit-table-column width="30%" title="Object" data-index="objectName" key="objectName"  align="flex-start" order>
                        </lit-table-column>
                        <lit-table-column width="1fr" title="distance" data-index="distance" key="distance"  align="flex-start" order>
                        </lit-table-column>
                        <lit-table-column width="1fr" title="ShallowSize" data-index="shallowSize" key="shallowSize" align="flex-start"  order>
                        </lit-table-column>
                        <lit-table-column width="1fr" title="" data-index="shallowPercent" key="shallowPercent" align="flex-start">
                        </lit-table-column>
                        <lit-table-column width="1fr" title="RetainedSize" data-index="retainedSize" key="retainedSize" align="flex-start" order>
                        </lit-table-column>
                        <lit-table-column width="1fr" title="" data-index="retainedPercent" key="retainedPercent" align="flex-start">
                        </lit-table-column>
                    </div>
                </div>
            </lit-table>
        </lit-slicer>
    </selector>
    <lit-progress-bar class="progress"></lit-progress-bar>
    <tab-pane-js-memory-filter id="filter" input inputLeftText first ></tab-pane-js-memory-filter>
    <div class="loading"></div>
</div>
`;
