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

@element('tabpane-xpower-component-audio')
export class TabPaneXpowerComponentAudio extends BaseElement {
  private xpowerComponentAudioTbl: LitTable | null | undefined;
  private currentDataList: Array<XpowerComponentTopStruct> = [];

  set data(selectionDataList: Array<XpowerComponentTopStruct>) {
    this.currentDataList = selectionDataList;
    this.xpowerComponentAudioTbl!.loading = true;
    this.xpowerComponentAudioTbl!.recycleDataSource = selectionDataList;
    this.xpowerComponentAudioTbl!.loading = false;
  }

  initElements(): void {
    this.xpowerComponentAudioTbl = this.shadowRoot?.querySelector<LitTable>('#lit-table');
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
      if (clientHeight === scrollHeight) {
        this.style.height = 'calc(100% - 22px)';
      } else {
        this.style.height = 'calc(100% - 42px)';
      }
    }).observe(this.xpowerComponentAudioTbl!.shadowRoot?.querySelector('.table')!);
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
            <lit-table-column order title="TimeStamp(ms)" data-index="startMS" key="startMS"  align="flex-start" width="120px">
            </lit-table-column>
            <lit-table-column title="AppName" data-index="appNameStr" order key="appNameStr"  align="flex-start" width="250px">
            </lit-table-column>
            <lit-table-column title="Background Duration(ms)" key="backgroundDuration" order data-index="backgroundDuration" align="flex-start" width="190px">
            </lit-table-column>
            <lit-table-column title="Background Energy(mAh)" order data-index="backgroundEnergy" key="backgroundEnergy"  align="flex-start" width="190px">
            </lit-table-column>
            <lit-table-column title="Foreground Duration(ms)" data-index="foregroundDuration"  order key="foregroundDuration"  align="flex-start" width="190px">
            </lit-table-column>
            <lit-table-column title="Foreground Energy(mAh)" data-index="foregroundEnergy" order key="foregroundEnergy"  align="flex-start" width="190px">
            </lit-table-column>
            <lit-table-column title="ScreenOff Duration(ms)" align="flex-start" order data-index="screenOffDuration" key="screenOffDuration" width="190px">
            </lit-table-column>
            <lit-table-column title="ScreenOff Energy(mAh)" key="screenOffEnergy" data-index="screenOffEnergy" order align="flex-start" width="190px">
            </lit-table-column>
            <lit-table-column title="ScreenOn Duration(ms)" key="screenOnDuration" data-index="screenOnDuration" order align="flex-start" width="190px">
            </lit-table-column>
            <lit-table-column title="ScreenOn Energy(mAh)" key="screenOnEnergy" data-index="screenOnEnergy" order align="flex-start" width="190px">
            </lit-table-column>
          </lit-table>
          `;
  }
}
