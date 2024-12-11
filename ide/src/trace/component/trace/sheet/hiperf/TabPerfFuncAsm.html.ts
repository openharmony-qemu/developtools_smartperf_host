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

export const TabPerfFuncAsmHtml = `
<style>
:host {
    display: flex;
    flex-direction: column;
}
.perf-table-box{
    width: 100%;
    border-left: solid 1px var(--dark-border1,#e0e0e0);
    border-radius: 5px;
    padding: 10px;
}
.title-box {
    margin-bottom: 10px;
    padding: 5px;
}
.title-item {
    margin: 5px 0;
    color: var(--dark-color1,#212121);
}
.title-label {
    font-weight: bold;
}
.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.error-message {
  color: red;
  margin-top: 5px;
  display: none;  /* 默认隐藏 */
}
</style>
<div style="display: flex; flex-direction: row;" class="d-box">
    <div class="perf-table-box" style="height:auto;overflow: auto;position: relative">
        <div class="title-box">
            <div class="title-item" id="function-name"><span class="title-label">Function Name:</span> </div>
            <div class="title-item" id="total-count"><span class="title-label">Total Count:</span> </div>
            <div class="title-item error-message" id="error-message"></div>
        </div>
        <lit-loading id="loading" class="loading" hidden></lit-loading>
        <lit-table id="perf-function-asm-table" style="display: grid;min-height: 380px" hideDownload>
            <lit-table-column width="1fr" title="Self Count" data-index="selfcount" key="selfcount" align="flex-start" order></lit-table-column>
            <lit-table-column width="1fr" title="%" data-index="percent" key="percent" align="flex-start" order></lit-table-column>
            <lit-table-column width="1fr" title="Virtual Addr" data-index="addr" key="addr" align="flex-start" order></lit-table-column>
            <lit-table-column width="1fr" title="Assembler" data-index="instruction" key="instruction" align="flex-start" order></lit-table-column>
        </lit-table>
    </div>
</div>
`;
