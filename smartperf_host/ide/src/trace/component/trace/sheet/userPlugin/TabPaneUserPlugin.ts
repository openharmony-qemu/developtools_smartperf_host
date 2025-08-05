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

import { BaseElement, element } from '../../../../../base-ui/BaseElement';
import { LitTable } from '../../../../../base-ui/table/lit-table';

@element('tab-pane-userplugin')
export class TabPaneUserPlugin extends BaseElement {
  static isStateTabHover: boolean = false;
  private currentSelectionTbl: LitTable | null | undefined;

  // tab页入口函数
  set data(selectionData: any) {
    let list = new Array();
    for (let key in selectionData) {
      list.push({
        name: key,
        value: selectionData[key]
      })
    }
    this.currentSelectionTbl!.dataSource = list;
  }

  initElements(): void {
    this.currentSelectionTbl = this.shadowRoot?.querySelector<LitTable>('#selectionTbl');
  }
  // 页面结构

  initHtml(): string {
    return `
          <style>
            .table-title{
                top: 0;
                background: var(--dark-background,#ffffff);
                position: sticky;
                width: 100%;
                display: flex;
            }
            .table-title > h2{
                font-size: 16px;
                font-weight: 400;
                visibility: visible;
                width: 50%;
                padding: 0 10px;
            }
            .scroll-area{
                display: flex;
                flex-direction: row;
                flex: 1;
            }
            #selectionTbl{
              height:100%;
              margin-left:20px;
            }
        </style>
        <div id="scroll_view" style="display: flex;flex-direction: column;width: 100%;height: 100%;overflow: auto">
            <div style="width: 100%;height: auto;position: relative">
                <div class="table-title">
                    <h2 id="leftTitle">Data Flow</h2>
                </div>
            </div>
            <div class="scroll-area">
                <lit-table id="selectionTbl" class="table-left" no-head hideDownload noRecycle>
                        <lit-table-column title="name" data-index="name" key="name" align="flex-start"  width="180px">
                            <template><div>{{name}}</div></template>
                        </lit-table-column>
                        <lit-table-column title="value" data-index="value" key="value" align="flex-start" >
                            <template><div style="display: flex;">{{value}}</div></template>
                        </lit-table-column>
                </lit-table>
            </div>
        </div>`
  }
}