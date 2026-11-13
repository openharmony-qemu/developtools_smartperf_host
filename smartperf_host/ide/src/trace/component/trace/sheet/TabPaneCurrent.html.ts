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
export const TabPaneCurrentHtml = `
        <style>
        :host{
            display: flex;
            flex-direction: column;
            padding: 10px 10px;
        }
        </style>
        <lit-table class="notes-editor-panel" style="height: auto">
            <lit-table-column width="15%" data-index="startTimeStr" key="startTimeStr" align="flex-start" title="StartTime">
            </lit-table-column>
            <lit-table-column width="15%" data-index="endTimeStr" key="endTimeStr" align="flex-start" title="EndTime">
            </lit-table-column>
            <lit-table-column width="10%" data-index="color" key="color" align="flex-start" title="Color">
                <template>
                    <div style='width:50px; height: 21px; position: relative;overflow: hidden;'>
                        <input type="color" id="color-input" style='
                            background: var(--dark-background5,#FFFFFF);
                            padding: 0px;
                            border: none;
                            width: 60px;
                            height: 31px;
                            position: absolute;
                            top: -5px;
                            left: -5px;'/>
                    </div>
                </template>
            </lit-table-column>
            <lit-table-column width="40%" data-index="text" key="text" align="flex-start" title="Remarks">
              <template>
                  <input type="text" id="text-input"  style="width: 100%; border: none" /> 
              </template>
            </lit-table-column>
            <lit-table-column width="10%" data-index="operate" key="operate" align="flex-start" title="Operate">
                <template>
                    <button class="remove" style='
                        background: var(--dark-border1,#262f3c);
                        color: white;
                        border-radius: 10px;
                        font-size: 10px;
                        height: 21px;
                        line-height: 21px;
                        min-width: 7em;
                        border: none;
                        cursor: pointer;
                        outline: inherit;
                    '>Remove</button>
                </template>
            </lit-table-column>
        </lit-table>
        `;
