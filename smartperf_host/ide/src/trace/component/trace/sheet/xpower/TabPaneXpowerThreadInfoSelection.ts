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
import { XpowerThreadInfoStruct } from '../../../../database/ui-worker/ProcedureWorkerXpowerThreadInfo';
import { THREAD_ENERGY } from '../../../chart/SpXpowerChart';
import { SortDetail, resizeObserver } from '../SheetUtils';

@element('tabpane-xpower-thread-info-selection')
export class TabPaneXpowerThreadInfoSelection extends BaseElement {
  private tableEl: LitTable | undefined | null;
  private threadInfoData: Array<XpowerThreadInfoStruct> = [];
  private tabTitle: HTMLDivElement | undefined | null;
  private valueType: string = '';

  setThreadInfoData(dataList: Array<XpowerThreadInfoStruct>): void {
    this.tableEl!.recycleDataSource = [];
    this.init();
    if (dataList.length >= 1) {
      dataList[0].valueType === THREAD_ENERGY ? (this.valueType = 'Energy(mAh)') : (this.valueType = 'Load(%)');
    }
    dataList.forEach((data) => {
      data.startMS = data.startNS / 1_000_000;
    });
    if (this.tabTitle && this.tabTitle!.querySelectorAll('.td')[2]) {
      this.tabTitle!.querySelectorAll('.td')[2]!.querySelector('label')!.innerHTML = this.valueType;
    }
    this.threadInfoData = dataList;
    this.tableEl!.recycleDataSource = this.threadInfoData;
  }

  initElements(): void {
    this.tableEl = this.shadowRoot!.querySelector<LitTable>('.tb-thread-info-selection') as LitTable;
    this.tabTitle = this.tableEl!.shadowRoot?.querySelector('.thead') as HTMLDivElement;
    this.tableEl!.addEventListener('column-click', (evt) => {
      // @ts-ignore
      this.sortByColumn(evt.detail);
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.tableEl!);
  }

  private init(): void {
    const thTable = this.tabTitle!.querySelector('.th');
    const list = thTable!.querySelectorAll('div');
    if (this.tabTitle!.hasAttribute('sort')) {
      this.tabTitle!.removeAttribute('sort');
      list.forEach((item) => {
        item.querySelectorAll('svg').forEach((svg) => {
          svg.style.display = 'none';
        });
      });
    }
  }

  private sortByColumn(detail: SortDetail): void {
    function compare(property: string, sort: number, type: string) {
      return function (
        XpowerThreadInfoLeftData: XpowerThreadInfoStruct,
        XpowerThreadInfoRightData: XpowerThreadInfoStruct
      ): number {
        if (type === 'number') {
          return sort === 2 // @ts-ignore
            ? parseFloat(XpowerThreadInfoRightData[property]) - parseFloat(XpowerThreadInfoLeftData[property]) // @ts-ignore
            : parseFloat(XpowerThreadInfoLeftData[property]) - parseFloat(XpowerThreadInfoRightData[property]);
        } else {
          // @ts-ignore
          if (XpowerThreadInfoRightData[property] > XpowerThreadInfoLeftData[property]) {
            return sort === 2 ? 1 : -1;
          } else {
            // @ts-ignore
            if (XpowerThreadInfoRightData[property] === XpowerThreadInfoLeftData[property]) {
              return 0;
            } else {
              return sort === 2 ? -1 : 1;
            }
          }
        }
      };
    }
    if (detail.key === 'threadName') {
      this.threadInfoData.sort(compare(detail.key, detail.sort, 'string'));
    } else {
      this.threadInfoData.sort(compare(detail.key, detail.sort, 'number'));
    }
    this.tableEl!.recycleDataSource = this.threadInfoData;
  }

  initHtml(): string {
    return `<style>
    :host{
        padding: 10px 10px;
        display: flex;
        flex-direction: column;
    }
    </style>
    <lit-table class="tb-thread-info-selection" style="height: auto">
        <lit-table-column width="1fr" title="ThreadName" data-index="threadName" key="threadName" align="flex-start" order>
        </lit-table-column>
        <lit-table-column width="1fr" title="TimeStamp(ms)" data-index="startMS" key="startMS"  align="flex-start" order>
        </lit-table-column>
        <lit-table-column width="1fr" title=${this.valueType} data-index="value" key="value" align="flex-start" order>
        </lit-table-column>
        <lit-table-column width="1fr" title="Duration(ms)" data-index="threadTime" key="threadTime" align="flex-start" order>
        </lit-table-column>
    </lit-table>
    `;
  }
}
