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

export const SpQuerySQLHtml = `
<style>
:host{
  width: 100%;
  height: 100%;
  font-size: 16px;
  background-color: var(--dark-background5,#F6F6F6);
  margin: 0;
  padding: 0;
}
.sql-select{
  box-sizing: border-box;
  width: 95%;
  font-family: Helvetica,serif;
  font-size: inherit;
  color: var(--dark-color1,#212121);
  text-align: left;
  line-height: 1.2em;
  font-weight: 400;
  height: 3.2em;
  margin-left: 10px;
  resize: vertical;
  border-width: 2px;
}
.query{
  display: flex;
  flex-direction: column;
  background-color: var(--dark-background5,#F6F6F6);
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}
.query-message{
  background-color: var(--dark-background3,#FFFFFF);
  padding: 1% 2%;
  margin: 2% 2.5% 0 2.5%;
  border-radius: 16px;
  width: 90%;
}
.request{
  display: flex;
  flex-direction: column;
  position: relative;
}
.response{
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  min-height: inherit;
  max-height: 70vh;
}
#dataResult{
  flex-grow: 1;
  overflow-y: auto;
  overflow-x: visible;
  margin-bottom: 1%;
  border-radius: 16px;
  background-color: #F6F6F6;
  padding: 0px 0px 0px 30px;
  min-height: inherit;
  max-height: 70vh;
}
p{
  display: table-cell;
  padding: 7px 10px;
  font-size:0.875em;
  line-height: 20px;
  font-weight: 400;
  text-align: left;
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis;
}
#response-json{
  margin-top: 20px;
  background-color: var(--dark-background5,#F6F6F6);
  margin-left: 10px;
  flex-grow: 1;
  scroll-y: visible;
}
.sql-select{
  background-color: var(--dark-background5, #F6F6F6);
}
::-webkit-scrollbar{
  width: 8px;
  background-color: var(--dark-background3,#FFFFFF);
}
::-webkit-scrollbar-thumb{
  border-radius: 6px;
  background-color: var(--dark-background7,rgba(0,0,0,0.1));
}
.load-query-sql{
  width: 95%;
  bottom: 0;
}
#copy-button{
  margin-right: 10%;
  cursor:pointer;
  opacity: 0.6;
}
#close-button{
  margin-right: 5%;
  cursor:pointer;
  opacity: 0.6;
}
.button-option{
  border-radius: 15px;
  background-color: #0A59F7;
  width: 120px;
  height: 25px;
  font-family: Helvetica-Bold;
  color: var(--dark-background3,#FFFFFF);
  text-align: center;
  line-height: 20px;
  font-weight: 400;
  border:0 solid;
}
.pagination-box {
  opacity: 0;
}
.sql-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0px;
  font-size: 14px;
}
.sql {
  width: 90%;
}
.query-sql {
  background-color: var(--dark-background3,#FFFFFF);
  padding: 1% 2%;
  margin: 0% 2.5% 0 2.5%;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
  width: 90%;
}
.query-result {
  background-color: var(--dark-background3,#FFFFFF);
  padding: 1% 2%;
  margin: 2% 2.5% 0 2.5%;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  width: 90%;
}
#sqlList {
  background-color:#F6F6F6;
  padding: 10px;
  border-radius: 16px;
}
lit-icon {
  text-overflow: ellipsis;
}
.runButton:hover {
   cursor: pointer;
}
</style>
<div class="query">
    <div class="query-message request">
        <p class="query_select" style="color: #999999">Enter query and press command/ctrl + Enter</p>
        <textarea class="sql-select"></textarea>
        <lit-progress-bar class="load-query-sql"></lit-progress-bar>
    </div>
      <div class="response query-result">
         <div style="display: flex;justify-content: space-between">
             <p class="query_size" style="color: #999999">Query result - 0 counts</p>
             <div style="display: flex; align-items: center">
                 <button id="copy-button" class="button-option">Copy as.tsv</button>
                 <button id="close-button" class="button-option">Close</button>
              </div>
          </div>
         <div id="dataResult">
            <lit-table></lit-table>
          </div>
         <pagination-box class="pagination-box"></pagination-box>
      </div>
      <div class="query-sql">
        <div id="sqlList"></div>
      </div>
`;
