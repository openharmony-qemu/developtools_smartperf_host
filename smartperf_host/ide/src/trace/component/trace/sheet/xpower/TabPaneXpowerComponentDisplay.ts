/*
 * Copyright (C) 2023 Huawei Device Co., Ltd.
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

import { element, BaseElement } from '../../../../../base-ui/BaseElement';
import { LitTable } from '../../../../../base-ui/table/lit-table';
import { XpowerComponentTopStruct } from './TabPaneXpowerComponentTop';
import { sortByColumn } from './XpowerUtil';

@element('tabpane-xpower-component-display')
export class TabPaneXpowerComponentDisplay extends BaseElement {
  private xpowerComponentDisplayTbl: LitTable | null | undefined;
  private currentDataList: Array<XpowerComponentTopStruct> = [];

  set data(selectionDataList: Array<XpowerComponentTopStruct>) {
    this.currentDataList = selectionDataList;
    this.xpowerComponentDisplayTbl!.loading = true;
    this.xpowerComponentDisplayTbl!.recycleDataSource = selectionDataList;
    this.xpowerComponentDisplayTbl!.loading = false;
  }

  initElements(): void {
    this.xpowerComponentDisplayTbl = this.shadowRoot?.querySelector<LitTable>('#lit-table');
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.xpowerComponentDisplayTbl!.addEventListener('column-click', (evt): void => {
      // @ts-ignore
      sortByColumn(evt.detail, this.currentDataList, this.xpowerComponentDisplayTbl!);
    });

    new ResizeObserver((entries) => {
      let clientHeight = this.xpowerComponentDisplayTbl!.shadowRoot?.querySelector('.table')!.clientHeight;
      let scrollHeight = this.xpowerComponentDisplayTbl!.shadowRoot?.querySelector('.table')!.scrollHeight;
      if (clientHeight === scrollHeight) {
        this.style.height = 'calc(100% - 22px)';
      } else {
        this.style.height = 'calc(100% - 42px)';
      }
    }).observe(this.xpowerComponentDisplayTbl!.shadowRoot?.querySelector('.table')!);
  }

  initHtml(): string {
    return `
          <style>
          :host{
              padding: 10px 10px;
              display: flex;
              flex-direction: column;
              overflow-y: auto;
              width: calc(100% - 20px);
              height: calc(100% - 42px);
          }
          </style>
          <lit-table id="lit-table" style="height: 100%">
            <lit-table-column order title="TimeStamp(ms)" data-index="startMS" key="startMS"  align="flex-start" width="1fr">
            </lit-table-column>
            <lit-table-column title="AppName" data-index="appNameStr" order key="appNameStr"  align="flex-start" width="1fr">
            </lit-table-column>
            <lit-table-column title="Usage Duration(ms)" key="appUsageDuration" order data-index="appUsageDuration" align="flex-start" width="1fr">
            </lit-table-column>
            <lit-table-column title="Usage Energy(mAh)" order data-index="appUsageEnergy" key="appUsageEnergy"  align="flex-start" width="1fr">
          </lit-table>
          `;
  }
}
