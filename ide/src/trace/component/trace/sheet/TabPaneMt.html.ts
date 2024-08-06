/*
 * Copyright (C) 2024 Huawei Device Co., Ltd.
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
export const MtSettingHtml = `
    <style>
    :host{
        display: flex;
        padding: 0px 10px 0 10px;
        flex-direction: column;
        height: 100%;
    }
    tab-pane-filter {
        border: solid rgb(216,216,216) 1px;
        float: left;
        position: fixed;
        bottom: 0;
        width: 100%;
    }
    </style>
    <lit-table id="tb-parallel" style="height: auto" tree>
        <lit-table-column class="freq-sample-column" width="20%" title="Process/Core" data-index="title" key="title" align="flex-start" retract>
        </lit-table-column>
        <lit-table-column class="freq-sample-column" width="1fr" title="T count" data-index="tCount" key="tCount" align="flex-start">
        </lit-table-column>
        <lit-table-column class="freq-sample-column" width="1fr" title="Group" data-index="group" key="group" align="flex-start" >
        </lit-table-column>
        <lit-table-column class="freq-sample-column" width="1fr" title="T parallel num" data-index="parallelNum" key="parallelNum" align="flex-start" >
        </lit-table-column>
        <lit-table-column class="freq-sample-column" width="1fr" title="Running dur(ms)" data-index="dur" key="dur" align="flex-start" >
        </lit-table-column>
        <lit-table-column class="freq-sample-column" width="1fr" title="Parallel dur(ms)" data-index="parallelDur" key="parallelDur" align="flex-start" >
        </lit-table-column>
        <lit-table-column class="freq-sample-column" width="1fr" title="Parallelism(%)" data-index="allParallel" key="allParallel" align="flex-start" >
        </lit-table-column>
        <lit-table-column class="freq-sample-column" width="1fr" title="Payload" data-index="load" key="load" align="flex-start" >
        </lit-table-column>
    </lit-table>
    <tab-pane-filter id="filter" cpu_config group_config></tab-pane-filter>
`;