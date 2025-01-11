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
import { XpowerGpuFreqStruct } from '../../../../database/ui-worker/ProcedureWorkerXpowerGpuFreq';
import { SortDetail, resizeObserver } from '../SheetUtils';

@element('tabpane-xpower-gpu-freq-selection')
export class TabPaneXpowerGpuFreqSelection extends BaseElement {
  private TableEl: LitTable | undefined | null;
  private gpuFreqData: Array<XpowerGpuFreqStruct> = [];
  private tabTitle: HTMLDivElement | undefined | null;

  setGpuFreqData(dataList: Array<XpowerGpuFreqStruct>): void {
    this.TableEl!.recycleDataSource = [];
    this.init();
    dataList.forEach((data) => {
      data.startMS = data.startNS / 1_000_000;
    });
    this.gpuFreqData = dataList;
    this.TableEl!.recycleDataSource = this.gpuFreqData;
  }

  initElements(): void {
    this.TableEl = this.shadowRoot!.querySelector<LitTable>('.tb-gpu-freq-selection') as LitTable;
    this.tabTitle = this.TableEl!.shadowRoot?.querySelector('.thead') as HTMLDivElement;
    this.TableEl!.addEventListener('column-click', (evt) => {
      // @ts-ignore
      this.sortByColumn(evt.detail);
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.TableEl!);
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
        XpowerGpuFreqLeftData: XpowerGpuFreqStruct,
        XpowerGpuFreqRightData: XpowerGpuFreqStruct
      ): number {
        if (type === 'number') {
          return sort === 2 // @ts-ignore
            ? parseFloat(XpowerGpuFreqRightData[property]) - parseFloat(XpowerGpuFreqLeftData[property]) // @ts-ignore
            : parseFloat(XpowerGpuFreqLeftData[property]) - parseFloat(XpowerGpuFreqRightData[property]);
        } else {
          // @ts-ignore
          if (XpowerGpuFreqRightData[property] > XpowerGpuFreqLeftData[property]) {
            return sort === 2 ? 1 : -1;
          } else {
            // @ts-ignore
            if (XpowerGpuFreqRightData[property] === XpowerGpuFreqLeftData[property]) {
              return 0;
            } else {
              return sort === 2 ? -1 : 1;
            }
          }
        }
      };
    }
    this.gpuFreqData.sort(compare(detail.key, detail.sort, 'number'));
    this.TableEl!.recycleDataSource = this.gpuFreqData;
  }

  initHtml(): string {
    return `<style>
    :host{
        padding: 10px 10px;
        display: flex;
        flex-direction: column;
    }
    </style>
    <lit-table class="tb-gpu-freq-selection" style="height: auto">
        <lit-table-column width="1fr" title="Frequency" data-index="frequency" key="frequency" align="flex-start" order>
        </lit-table-column>
        <lit-table-column width="1fr" title="TimeStamp(ms)" data-index="startMS" key="startMS"  align="flex-start" order>
        </lit-table-column>
        <lit-table-column width="1fr" title="RunTime(ms)" data-index="runTime" key="runTime" align="flex-start" order>
        </lit-table-column>
        <lit-table-column width="1fr" title="IdleTime(ms)" data-index="idleTime" key="idleTime" align="flex-start" order>
        </lit-table-column>
    </lit-table>
    `;
  }
}
