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
export const TabPaneVmTrackerShmSelectionHtml = `
        <style>
        :host{
            display: flex;
            flex-direction: column;
            padding: 10px 10px 0 10px;
            height: calc(100% - 10px - 31px);
        }
        tab-pane-filter {
            border: solid rgb(216,216,216) 1px;
            float: left;
            position: fixed;
            bottom: 0;
            width: 100%;
        }
        selector{
            display: none;
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
                        <lit-table id="tb-shm-selection" style="height: auto">
                            <lit-table-column width="100px" title="TimeStamp" data-index="ts" key="ts"  align="flex-start" order>
                            </lit-table-column>
                            <lit-table-column width="1fr" title="Fd" data-index="fd" key="fd" align="flex-start"  order>
                            </lit-table-column>
                            <lit-table-column width="1fr" title="Size" data-index="sizeStr" key="sizeStr" align="flex-start"  order>
                            </lit-table-column>
                            <lit-table-column width="1fr" title="Adj" data-index="adj" key="adj" align="flex-start" order>
                            </lit-table-column>
                            <lit-table-column width="250px" title="AshmName" data-index="name" key="name" align="flex-start"  order>
                            </lit-table-column>
                            <lit-table-column width="1fr" title="Id" data-index="id" key="id" align="flex-start"  order>
                            </lit-table-column>
                            <lit-table-column width="200px" title="Time" data-index="time" key="time" align="flex-start"  order>
                            </lit-table-column>
                            <lit-table-column width="1fr" title="Refcount" data-index="count" key="count" align="flex-start"  order>
                            </lit-table-column>
                            <lit-table-column width="1fr" title="Purged" data-index="purged" key="purged" align="flex-start"  order>
                            </lit-table-column>
                            <lit-table-column width="1fr" title="Flag" data-index="flag" key="flag" align="flex-start"  order>
                            </lit-table-column>
                        </lit-table>
        `;