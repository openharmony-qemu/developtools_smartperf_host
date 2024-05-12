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

export const TabPaneHiSysEventsHtml = `
        <style>
        :host{
            padding: 10px 10px;
            display: flex;
            flex-direction: column;
        }
        .sys-detail-progress{
            bottom: 33px;
            position: absolute;
            height: 1px;
            left: 0;
            right: 0;
        }
        .title-content {
          display: flex;
          flex-wrap: wrap;
          width: 100%;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #D5D5D5;
          padding-bottom: 10px;
          padding-left: 10px;
        }
        .detail-content {
          display: flex;
          flex-wrap: wrap;
          width: 100%;
          padding-left: 20px;
          align-items: center;
          justify-content: right;
          border-bottom: 1px solid #D5D5D5;
          padding-bottom: 10px;
        }
        .level-content {
          margin-right: 20px;
        }
        #level-filter {
          padding: 1px 12px;
          opacity: 0.6;
          font-size: 14px;
          line-height: 20px;
          font-weight: 400;
        }
        select {
          border: 1px solid rgba(0,0,0,0.60);
          border-radius: 10px;
          margin-bottom: 4px;
        }
        option {
          font-weight: 400;
          font-size: 14px;
        }
        .change-input {
          width: 40%;
          line-height: 16px;
          margin-right: 20px;
          padding: 3px 12px;
          height: 16px;
        }
        .filter-input {
          line-height: 16px;
          margin-right: 20px;
          padding: 3px 12px;
          height: 16px;
          margin-bottom: 4px;
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
        .tagElement {
          display: flex;
          background-color: #0A59F7;
          align-items: center;
          margin-right: 5px;
          border-radius: 10px;
          font-size: 14px;
          height: 22px;
          margin-bottom: 4px;
        }
        .tag {
          line-height: 14px;
          padding: 4px 8px;
          color: #FFFFFF;
        }
        #tb-hisysevent-data {
          height: auto;
          width: auto;
          border-left: 1px solid var(--dark-border1,#e2e2e2);
          display:flex;
        }
        </style>
        <div style="display: flex;flex-direction: row">
          <div class="box-details" style="width: auto">
            <div class="title-content">
                <label id="event-title">HisysEvents [0, 0] / 0</label>
                <div style="display: flex;flex-wrap: wrap;">
                   <div style="display: flex;">
                     <div id="domainTagFilter" style='display: flex;width: auto; height: 100%;flex-wrap: wrap;'>
                     </div>
                     <input type="text" id="domain-filter" class="filter-input" placeholder="Filter by Domain…">
                  </div>
                   <div style="display: flex;">
                    <div id="eventNameTagFilter" style='display: flex;width: auto; height: 100%;flex-wrap: wrap;'>
                    </div>
                    <input type="text" id="event-name-filter" class="filter-input" placeholder="Filter by eventname…">
                  </div>
                   <div class="level-content">
                       <select id="level-filter">
                        <option>ALL</option>
                        <option>MINOR</option>
                        <option>CRITICAL</option>
                       </select>
                    </div>
                   <input type="text" id="contents-filter" class="filter-input" placeholder="Filter by contents…">
                </div>
            </div>
        <lit-page-table id="tb-hisysevent" style="height: auto">
           <lit-table-column title="id" width="0.5fr" data-index="id" key="id"  align="flex-start" order>
           </lit-table-column>
           <lit-table-column title="domain" width="1.5fr" data-index="domain" key="domain"  align="flex-start" >
           </lit-table-column>
           <lit-table-column title="eventname" width="3fr" data-index="eventName" key="eventName" align="flex-start" >
           </lit-table-column>
           <lit-table-column title="type" width="0.5fr" data-index="eventType" key="eventType"  align="flex-start" >
           </lit-table-column>
           <lit-table-column title="time" width="1.5fr" data-index="startTs" key="startTs"  align="flex-start" order>
           </lit-table-column>
           <lit-table-column title="pid" width="1fr" data-index="pid" key="pid"  align="flex-start" order >
           </lit-table-column>
           <lit-table-column title="tid" width="1fr" data-index="tid" key="tid"  align="flex-start" order >
           </lit-table-column>
           <lit-table-column title="uid" width="1fr" data-index="uid" key="uid"  align="flex-start" order >
           </lit-table-column>
            <lit-table-column title="info" width="1fr" data-index="info" key="info"  align="flex-start" >
           </lit-table-column>
           <lit-table-column title="level" width="1fr" data-index="level" key="level"  align="flex-start" >
           </lit-table-column>
           <lit-table-column title="seq" width="1fr" data-index="seq" key="seq"  align="flex-start" >
           </lit-table-column>
           <lit-table-column title="contents" width="5fr" data-index="contents" key="contents"  align="flex-start">
           </lit-table-column>
        </lit-page-table>
     </div>
     <lit-slicer-track></lit-slicer-track>
     <div class="detail-box" style="flex-grow: 1;" > 
        <div class="detail-content">
          <input type="text" id="contents-change" class="change-input" placeholder="base time">
        </div>
        <lit-table id="tb-hisysevent-data" no-head hideDownload>
          <lit-table-column class="sys-detail-column" width="50%" title="key" 
          data-index="key" key="key" align="flex-start" style="flex: 1">
          </lit-table-column>
          <lit-table-column class="sys-detail-column" width="50%" 
          title="value" data-index="value" key="value"  align="flex-start" style="flex: 1">
          </lit-table-column> 
        </lit-table> 
     </div>
    </div>`;
