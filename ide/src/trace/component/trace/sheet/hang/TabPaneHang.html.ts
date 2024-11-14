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

export const TabPaneHangHtml = `
<style>
:host{
  padding: 10px 10px;
  display: flex;
  flex-direction: column;
}
.hangs-title-content {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #D5D5D5;
  padding: 10px 0px;
}
#hang-title {
  flex-grow: 1;
}
.filter-input {
  line-height: 16px;
  margin-right: 20px;
  padding: 3px 12px;
  height: 16px;
}
.level-content {
  margin-right: 20px;
}
input {
  background: #FFFFFF;
  font-size: 14px;
  color: #212121;
  text-align: left;
  line-height: 16px;
  font-weight: 400;
  text-indent: 2%;
  border: 1px solid #979797;
  border-radius: 10px;
}
select {
  border: 1px solid rgba(0,0,0,0.60);
  border-radius: 10px;
}
option {
  font-weight: 400;
  font-size: 14px;
}
.tagElement {
  display: flex;
  background-color: #0A59F7;
  align-items: center;
  margin-right: 5px;
  border-radius: 10px;
  font-size: 14px;
  height: 22px;
  margin-bottom: 5px;
}
.tag {
  line-height: 14px;
  padding: 4px 8px;
  color: #FFFFFF;
}
#level-filter {
  padding: 1px 12px;
  opacity: 0.6;
  font-size: 14px;
  line-height: 20px;
  font-weight: 400;
}
</style>
<div class="hangs-title-content">
  <label id="hang-title">Hang [0, 0] / 0</label>
  <div style="display: flex;flex-wrap: wrap;">
    <div class="level-content">
    <select id="level-filter">
      <option>Instant</option>
      <option>Circumstantial</option>
      <option>Micro</option>
      <option>Severe</option>
    </select>
  </div>
    <input type="text" id="process-filter" class="filter-input" placeholder="Search process...">
    <input type="text" id="search-filter" class="filter-input" placeholder="Search sender...">
  </div>
</div>
<lit-progress-bar class="progress"></lit-progress-bar>
<lit-page-table id="tb-hang">
    <lit-table-column order title="StartTime" width="15%" data-index="startTime" key="startTime">
    </lit-table-column>
    <lit-table-column order title="Duration" width="1fr" data-index="durStr" key="durStr">
    </lit-table-column>
    <lit-table-column order title="Hang type" width="1fr" data-index="type" key="type">
    </lit-table-column>
    <lit-table-column order title="Process" width="1fr" data-index="pname" key="pname">
    </lit-table-column>
    <lit-table-column order title="Sender tid" width="1fr" data-index="sendEventTid" key="sendEventTid">
    </lit-table-column>
    <lit-table-column order title="Send time" width="1fr" data-index="sendTime" key="sendTime">
    </lit-table-column>
    <lit-table-column order title="Expect handle time" width="1fr" data-index="expectHandleTime" key="expectHandleTime">
    </lit-table-column>
    <lit-table-column order title="Task name/Id" width="1fr" data-index="taskNameId" key="taskNameId">
    </lit-table-column>
    <lit-table-column order title="Prio" width="5%" data-index="prio" key="prio">
    </lit-table-column>
    <lit-table-column order title="Sender" width="15%" data-index="caller" key="caller">
    </lit-table-column>
</lit-page-table>
`;
