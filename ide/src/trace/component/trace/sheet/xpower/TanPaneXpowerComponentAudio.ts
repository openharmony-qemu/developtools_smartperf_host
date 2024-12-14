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
import { XpowerComponentTopStruct } from './TanPaneXpowerComponentTop';
import { sortByColumn } from './XpowerUtil';

@element('tabpane-xpower-component-audio')
export class TabPaneXpowerComponentAudio extends BaseElement {
  private xpowerComponentAudioTbl: LitTable | null | undefined;
  private currentDataList: Array<XpowerComponentTopStruct> = [];
  private theadEl: HTMLDivElement | undefined | null;

  set data(selectionDataList: Array<XpowerComponentTopStruct>) {
    this.currentDataList = selectionDataList;
    this.xpowerComponentAudioTbl!.loading = true;
    setTimeout(() => {
      this.xpowerComponentAudioTbl!.recycleDataSource = selectionDataList;
      this.xpowerComponentAudioTbl!.loading = false;
    }, 100);
  }

  initElements(): void {
    this.xpowerComponentAudioTbl = this.shadowRoot?.querySelector<LitTable>('#lit-table');
    this.theadEl = this.xpowerComponentAudioTbl!.shadowRoot?.querySelector('.thead') as HTMLDivElement;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.xpowerComponentAudioTbl!.addEventListener('column-click', (evt): void => {
      // @ts-ignore
      sortByColumn(evt.detail, this.currentDataList, this.xpowerComponentAudioTbl!);
    });

    new ResizeObserver((entries) => {
      let clientHeight = this.xpowerComponentAudioTbl!.shadowRoot?.querySelector('.table')!.clientHeight;
      let scrollHeight = this.xpowerComponentAudioTbl!.shadowRoot?.querySelector('.table')!.scrollHeight;
      if (clientHeight == scrollHeight) {
        this.style.height = 'calc(100% - 22px)';
      } else {
        this.style.height = 'calc(100% - 42px)';
      }
    }).observe(this.xpowerComponentAudioTbl!.shadowRoot?.querySelector('.table')!);
    this.xpowerComponentAudioTbl!.recycleDataSource = new Array().fill('');
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
            <lit-table-column order title="TimeStamp" data-index="startTimeStr" key="startTimeStr"  align="flex-start" width="100px">
            </lit-table-column>
            <lit-table-column title="AppName" data-index="appNameStr" order key="appNameStr"  align="flex-start" width="250px">
            </lit-table-column>
            <lit-table-column title="Background Duration" key="backgroundDurationStr" order data-index="backgroundDurationStr" align="flex-start" width="170px">
            </lit-table-column>
            <lit-table-column title="Background Energy" order data-index="backgroundEnergy" key="backgroundEnergy"  align="flex-start" width="160px">
            </lit-table-column>
            <lit-table-column title="Foreground Duration" data-index="foregroundDurationStr"  order key="foregroundDurationStr"  align="flex-start" width="170px">
            </lit-table-column>
            <lit-table-column title="Foreground Energy" data-index="foregroundEnergy" order key="foregroundEnergy"  align="flex-start" width="160px">
            </lit-table-column>
            <lit-table-column title="ScreenOff Duration" align="flex-start" order data-index="screenOffDurationStr" key="screenOffDurationStr" width="160px">
            </lit-table-column>
            <lit-table-column title="ScreenOff Energy" key="screenOffEnergy" data-index="screenOffEnergy" order align="flex-start" width="160px">
            </lit-table-column>
            <lit-table-column title="ScreenOn Duration" key="screenOnDurationStr" data-index="screenOnDurationStr" order align="flex-start" width="160px">
            </lit-table-column>
            <lit-table-column title="ScreenOn Energy" key="screenOnEnergy" data-index="screenOnEnergy" order align="flex-start" width="160px">
            </lit-table-column>
          </lit-table>
          `;
  }
}
