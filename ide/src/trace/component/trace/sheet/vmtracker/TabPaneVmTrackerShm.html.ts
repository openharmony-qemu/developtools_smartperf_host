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

export const TabPaneVmTrackerShmHtml = `
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
 <label id="time-range" style="width: 100%;height: 20px;text-align: end;font-size: 10pt;margin-bottom: 5px">Selected range:0.0 ms</label>
                <lit-table id="tb-shm" style="height: auto">
                    <lit-table-column width="1fr" title="AvgSize" data-index="avgSizeStr" key="avgSizeStr" align="flex-start"  order>
                    </lit-table-column>
                    <lit-table-column width="1fr" title="MinSize" data-index="minSizeStr" key="minSizeStr" align="flex-start" order>
                    </lit-table-column>
                    <lit-table-column width="1fr" title="MaxSize" data-index="maxSizeStr" key="maxSizeStr" align="flex-start"  order>
                    </lit-table-column>
                </lit-table>
`;
