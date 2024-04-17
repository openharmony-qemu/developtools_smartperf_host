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

export const TabPaneHiSysEventSummaryHtml = `<style>
        :host{
          padding: 10px 10px;
          display: flex;
          flex-direction: column;
        }
        .tree-row-tr {
          display: flex;
          height: 30px;
          line-height: 30px;
          align-items: center;
          background-color: white;
          width: 100%;
        }
        .tab-summary-head {
          display: grid;
          grid-template-columns: 69% 25%;
          height: 30px;
          line-height: 30px;
          align-items: center;
          background-color: white;
        }
         .head-label, .head-count {
          white-space: nowrap;
          overflow: hidden;
        }
        .head-label, .head-count {
          font-weight: bold;
        }
        .tree-row-tr:hover {
          background-color: #DEEDFF;
        }
        .tree-row-tr:nth-last-child(1):hover {
          background-color: white;
        }
        .row-name-td {
          height: 30px;
          white-space: nowrap;
          display: inline-block;
          overflow-y: hidden;
          margin-right: 15px;
        }
        tr {
          height: 30px;
        }
        .row-name-td::-webkit-scrollbar {
          display: none;
        }
        .event-tree-table {
          display: grid;
          overflow: hidden;
          grid-template-rows: repeat(auto-fit, 30px);
          position: sticky;
          top: 0;
        }
        .event-tree-table:hover{
          overflow: auto hidden;
        }
        </style>
        <div class="tab-summary-head">
          <div style="justify-content: flex-start; display: flex">
            <div class="expansion-div" style="display: grid;">
              <lit-icon class="expansion-up-icon" name="up"></lit-icon>
              <lit-icon class="expansion-down-icon" name="down"></lit-icon>
            </div>
            <label class="head-label" style="cursor: pointer;">Level</label>
            <label class="head-label" style="cursor: pointer;">/Domain</label>
            <label class="head-label" style="cursor: pointer;">/EventName</label>
          </div>
          <label class="head-count">Count</label> 
        </div>
        <div id="tab-summary" style="overflow: auto;display: grid; grid-template-columns: 70% 25%;"></div>
        <lit-table id="tb-event-summary" style="display: none" tree>
          <lit-table-column title="Level/Domain/EventName" data-index="summaryName" key="summaryName">
          </lit-table-column>
          <lit-table-column title="Count" data-index="count" key="count"></lit-table-column>
        </lit-table>
        `;