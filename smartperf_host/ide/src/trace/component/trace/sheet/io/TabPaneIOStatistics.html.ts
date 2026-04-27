/*
 * Copyright (C) 2026 Huawei Device Co., Ltd.
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

export const TabPaneIoStatisticsHtml = `
        <style>
        :host{
            display: flex;
            flex-direction: column;
            padding: 10px 10px;
        }
        .tree-row-tr {
          display: flex;
          height: 30px;
          line-height: 30px;
          align-items: center;
          background-color: white;
          width: 100%;
        }
        .tree-row-tr:hover {
          background-color: #DEEDFF;
        }
        .tree-row-tr:nth-last-child(1):hover {
          background-color: white;
        }
        .head-label, .head-count {
          white-space: nowrap;
          overflow: hidden;
          font-weight: bold;
        }
        .row-name-td {
          white-space: nowrap;
          overflow-y: hidden;
          display: inline-block;
          margin-right: 15px;
          height: 30px;
        }
        tr {
          height: 30px;
        }
        .row-name-td::-webkit-scrollbar {
          display: none;
        }
        </style>
        <div class="container">
        <lit-progress-bar class="progress"></lit-progress-bar>
        <lit-table id="tb-io-statistics" style="display: none">
          <lit-table-column title="Process" data-index="process" key="process" width="1fr" align="flex-start" order>
          </lit-table-column>
          <lit-table-column title="Thread" data-index="thread" key="thread" width="1fr" align="flex-start" order>
          </lit-table-column>
          <lit-table-column title="Start Time" data-index="startTime" key="startTime" width="1fr" align="flex-start" order>
          </lit-table-column>
          <lit-table-column title="Duration(ms)" data-index="duration" key="duration" width="1fr" align="flex-start" order>
          </lit-table-column>
          <lit-table-column title="Min Duration(ms)" data-index="minDuration" key="minDuration" width="1fr" align="flex-start" order>
          </lit-table-column>
          <lit-table-column title="Avg Duration(ms)" data-index="avgDuration" key="avgDuration" width="1fr" align="flex-start" order>
          </lit-table-column>
          <lit-table-column title="Max Duration(ms)" data-index="maxDuration" key="maxDuration" width="1fr" align="flex-start" order>
          </lit-table-column>
          <lit-table-column title="Operation" data-index="isWrite" key="isWrite" width="1fr" align="flex-start" order>
          </lit-table-column>
          <lit-table-column title="Request Bytes(bytes)" data-index="requestBytes" key="requestBytes" width="1fr" align="flex-start" order>
          </lit-table-column>
          <lit-table-column title="Physical/Logical" data-index="isPhysical" key="isPhysical" width="1fr" align="flex-start" order>
          </lit-table-column>
          <lit-table-column title="Actual Bytes(bytes)" data-index="actualBytes" key="actualBytes" width="1fr" order>
          </lit-table-column>
        </lit-table>
      </div>`;
