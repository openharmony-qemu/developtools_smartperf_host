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

export const TabPaneJsCpuHtml = `
<style>
:host{
    display: flex;
    flex-direction: column;
    padding: 0 10px 0 10px;
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
</style>
<div class="perf-profile-content">
<selector id='show_table' class="show">
    <lit-slicer style="width:100%">
    <div id="left_table" style="width: 65%">
        <lit-table id="callTreeTable" style="height: 100%" tree>
            <lit-table-column width="60%" title="Symbol" data-index="symbolName" key="symbolName"
            align="flex-start" order retract></lit-table-column>
            <lit-table-column width="1fr" title="SelfTime" data-index="selfTimeStr" key="selfTimeStr"
            align="flex-start"  order></lit-table-column>
            <lit-table-column width="1fr" title="%" data-index="selfTimePercent" key="selfTimePercent"
            align="flex-start"  order></lit-table-column>
            <lit-table-column width="1fr" title="TotalTime" data-index="totalTimeStr" key="totalTimeStr"
            align="flex-start"  order></lit-table-column>
            <lit-table-column width="1fr" title="%" data-index="totalTimePercent" key="totalTimePercent"
            align="flex-start"  order></lit-table-column>
        </lit-table>
    </div>
    <lit-slicer-track ></lit-slicer-track>
    <div class="right" style="flex: 1;display: flex; flex-direction: row;">
        <div style="flex: 1;display: block;">
          <span slot="head" style="height: 22px">Heaviest Stack</span>
          <lit-table id="stackTable" style="height: auto;">
              <lit-table-column width="50%" title="Symbol" data-index="symbolName" key="symbolName"
              align="flex-start"></lit-table-column>
              <lit-table-column width="1fr" title="TotalTime" data-index="totalTimeStr" key="totalTimeStr"
              align="flex-start" ></lit-table-column>
              <lit-table-column width="1fr" title="%" data-index="totalTimePercent" key="totalTimePercent"
              align="flex-start"></lit-table-column>
          </lit-table>
      </div>
    </div>
    </lit-slicer>
 </selector>
 <tab-pane-filter id="filter" input inputLeftText ></tab-pane-filter>
 <lit-progress-bar class="progress perf-profile-progress"></lit-progress-bar>
</div>
    `;
