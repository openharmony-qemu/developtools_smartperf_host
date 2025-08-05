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
import { SelectionData, SelectionParam } from '../../../../bean/BoxSelection';
import { XpowerThreadInfoStruct } from '../../../../database/ui-worker/ProcedureWorkerXpowerThreadInfo';
import { SortDetail, resizeObserver } from '../SheetUtils';

@element('tabpane-xpower-thread-energy')
export class TabPaneXpowerThreadEnergy extends BaseElement {
  private XpowerThreadEnergyTbl: LitTable | null | undefined;
  private XpowerThreadEnergyRange: HTMLLabelElement | null | undefined;
  private XpowerThreadEnergySource: Array<SelectionData> = [];
  private sumCount: number = 0;
  private tabTitle: HTMLDivElement | undefined | null;

  set data(XpowerThreadEnergyValue: SelectionParam) {
    this.init();
    this.XpowerThreadEnergyTbl!.shadowRoot!.querySelector<HTMLDivElement>('.table')!.style!.height = `${
      this.parentElement!.clientHeight - 45
    }px`;
    this.XpowerThreadEnergyRange!.textContent = `Selected range: ${parseFloat(
      ((XpowerThreadEnergyValue.rightNs - XpowerThreadEnergyValue.leftNs) / 1000000.0).toFixed(5)
    )} ms`;
    this.getThreadEnergyData(XpowerThreadEnergyValue).then();
  }

  async getThreadEnergyData(XpowerThreadEnergyValue: SelectionParam): Promise<void> {
    this.sumCount = 0;
    let dataSource: SelectionData[] = [];
    let collect = XpowerThreadEnergyValue.xpowerThreadEnergyMapData;
    this.XpowerThreadEnergyTbl!.loading = true;
    for (let key of collect.keys()) {
      let threadEnergys = collect.get(key);
      let res = (await threadEnergys?.({
        startNS: XpowerThreadEnergyValue.leftNs,
        endNS: XpowerThreadEnergyValue.rightNs,
        queryAll: true,
      })) as XpowerThreadInfoStruct[];
      let sd = this.createSelectThreadEnergyData(res || []);
      dataSource = dataSource.concat(sd);
    }
    this.XpowerThreadEnergyTbl!.loading = false;
    this.XpowerThreadEnergySource = dataSource;
    this.XpowerThreadEnergyTbl!.recycleDataSource = dataSource;
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

  initElements(): void {
    this.XpowerThreadEnergyTbl = this.shadowRoot?.querySelector<LitTable>('#tb-threadEnergy');
    this.tabTitle = this.XpowerThreadEnergyTbl!.shadowRoot?.querySelector('.thead') as HTMLDivElement;
    this.XpowerThreadEnergyRange = this.shadowRoot?.querySelector('#time-range');
    this.XpowerThreadEnergyTbl!.addEventListener('column-click', (evt): void => {
      // @ts-ignore
      this.sortByColumn(evt.detail);
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.XpowerThreadEnergyTbl!);
  }

  initHtml(): string {
    return `
        <style>
        .xpower-thread-energy-label{
            margin-bottom: 5px;
        }
        :host{
            padding: 10px 10px;
            display: flex;
            flex-direction: column;
        }
        </style>
        <label id="time-range" class="xpower-thread-energy-label" style="width: 100%;height: 20px;text-align: end;font-size: 10pt;">Selected range:0.0 ms</label>
        <lit-table id="tb-threadEnergy" style="height: auto">
            <lit-table-column order title="ThreadName" data-index="name" key="name"  align="flex-start" width="25%">
            </lit-table-column>
            <lit-table-column data-index="count" title="Count" order key="count"  align="flex-start" width="1fr">
            </lit-table-column>
            <lit-table-column title="Avg Energy(mAh)" data-index="avgNumber" order key="avgNumber" align="flex-start" width="1fr">
            </lit-table-column>
            <lit-table-column title="Max Energy(mAh)" align="flex-start" order data-index="maxNumber" key="maxNumber" width="1fr">
            </lit-table-column>
            <lit-table-column title="Min Energy(mAh)" key="minNumber" data-index="minNumber" order align="flex-start" width="1fr">
            </lit-table-column>
        </lit-table>
        `;
  }

  private createSelectThreadEnergyData(list: Array<XpowerThreadInfoStruct>): SelectionData[] {
    let SelectThreadEnergyArray: SelectionData[] = [];
    if (list.length > 0) {
      let threadEnergyMap = new Map();
      list.forEach((item) => {
        if (item.value > 0) {
          if (threadEnergyMap.has(item.threadName)) {
            const data = threadEnergyMap.get(item.threadName)!;
            data.push(item);
          } else {
            const data: XpowerThreadInfoStruct[] = [];
            data.push(item);
            threadEnergyMap.set(item.threadName, data);
          }
        }
      });
      for (let itemArray of threadEnergyMap.values()) {
        let SelectThreadEnergyData = new SelectionData();
        let max = 0;
        let min = 0;
        let sum = 0;
        SelectThreadEnergyData.name = itemArray[0].threadName;
        SelectThreadEnergyData.count = itemArray.length;
        if (itemArray.length > 1) {
          max = itemArray.map((item: { value: unknown }) => item.value).reduce((a: number, b: number) => Math.max(a, b));
          min = itemArray.map((item: { value: unknown }) => item.value).reduce((a: number, b: number) => Math.min(a, b));
          // @ts-ignore
          sum = itemArray.reduce((acc: unknown, obj: { value: unknown }) => acc + obj.value, 0);
          SelectThreadEnergyData.avgNumber = parseFloat((sum / itemArray.length).toFixed(2));
          SelectThreadEnergyData.maxNumber = max;
          SelectThreadEnergyData.minNumber = min;
        } else if (itemArray.length === 1) {
          let value = itemArray[0].value;
          SelectThreadEnergyData.avgNumber = value;
          SelectThreadEnergyData.maxNumber = value;
          SelectThreadEnergyData.minNumber = value;
        }
        this.sumCount += itemArray.length;
        SelectThreadEnergyArray.push(SelectThreadEnergyData);
      }
    }
    return SelectThreadEnergyArray;
  }

  private sortByColumn(detail: SortDetail): void {
    function compare(property: string, sort: number, type: string) {
      return function (xpowerThreadEnergyLeftData: SelectionData, xpowerThreadEnergyRightData: SelectionData): number {
        if (xpowerThreadEnergyLeftData.process === ' ' || xpowerThreadEnergyRightData.process === ' ') {
          return 0;
        }
        if (type === 'number') {
          return sort === 2 // @ts-ignore
            ? parseFloat(xpowerThreadEnergyRightData[property]) - parseFloat(xpowerThreadEnergyLeftData[property]) // @ts-ignore
            : parseFloat(xpowerThreadEnergyLeftData[property]) - parseFloat(xpowerThreadEnergyRightData[property]);
        } else {
          // @ts-ignore
          if (xpowerThreadEnergyRightData[property] > xpowerThreadEnergyLeftData[property]) {
            return sort === 2 ? 1 : -1;
          } else {
            // @ts-ignore
            if (xpowerThreadEnergyRightData[property] === xpowerThreadEnergyLeftData[property]) {
              return 0;
            } else {
              return sort === 2 ? -1 : 1;
            }
          }
        }
      };
    }
    if (detail.key === 'name') {
      this.XpowerThreadEnergySource.sort(compare(detail.key, detail.sort, 'string'));
    } else {
      this.XpowerThreadEnergySource.sort(compare(detail.key, detail.sort, 'number'));
    }
    this.XpowerThreadEnergyTbl!.recycleDataSource = this.XpowerThreadEnergySource;
  }
}
