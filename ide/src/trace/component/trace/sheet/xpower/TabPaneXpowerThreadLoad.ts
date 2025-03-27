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

@element('tabpane-xpower-thread-load')
export class TabPaneXpowerThreadLoad extends BaseElement {
  private XpowerThreadLoadTbl: LitTable | null | undefined;
  private XpowerThreadLoadRange: HTMLLabelElement | null | undefined;
  private XpowerThreadLoadSource: Array<SelectionData> = [];
  private sumCount: number = 0;
  private tabTitle: HTMLDivElement | undefined | null;

  set data(XpowerThreadLoadValue: SelectionParam) {
    this.init();
    this.XpowerThreadLoadTbl!.shadowRoot!.querySelector<HTMLDivElement>('.table')!.style!.height = `${
      this.parentElement!.clientHeight - 45
    }px`;
    this.XpowerThreadLoadRange!.textContent = `Selected range: ${parseFloat(
      ((XpowerThreadLoadValue.rightNs - XpowerThreadLoadValue.leftNs) / 1000000.0).toFixed(5)
    )} ms`;
    this.getThreadLoadData(XpowerThreadLoadValue).then();
  }

  async getThreadLoadData(XpowerThreadLoadValue: SelectionParam): Promise<void> {
    this.sumCount = 0;
    let dataSource: SelectionData[] = [];
    let collect = XpowerThreadLoadValue.xpowerThreadLoadMapData;
    this.XpowerThreadLoadTbl!.loading = true;
    for (let key of collect.keys()) {
      let threadInfos = collect.get(key);
      let res = (await threadInfos?.({
        startNS: XpowerThreadLoadValue.leftNs,
        endNS: XpowerThreadLoadValue.rightNs,
        queryAll: true,
      })) as XpowerThreadInfoStruct[];
      let sd = this.createSelectThreadLoadData(res || []);
      dataSource = dataSource.concat(sd);
    }
    this.XpowerThreadLoadTbl!.loading = false;
    this.XpowerThreadLoadSource = dataSource;
    this.XpowerThreadLoadTbl!.recycleDataSource = dataSource;
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
    this.XpowerThreadLoadTbl = this.shadowRoot?.querySelector<LitTable>('#tb-thread-info');
    this.tabTitle = this.XpowerThreadLoadTbl!.shadowRoot?.querySelector('.thead') as HTMLDivElement;
    this.XpowerThreadLoadRange = this.shadowRoot?.querySelector('#time-range');
    this.XpowerThreadLoadTbl!.addEventListener('column-click', (evt): void => {
      // @ts-ignore
      this.sortByColumn(evt.detail);
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.XpowerThreadLoadTbl!);
  }

  initHtml(): string {
    return `
        <style>
        .xpower-thread-info-label{
            margin-bottom: 5px;
        }
        :host{
            padding: 10px 10px;
            display: flex;
            flex-direction: column;
        }
        </style>
        <label id="time-range" class="xpower-thread-info-label" style="width: 100%;height: 20px;text-align: end;font-size: 10pt;">Selected range:0.0 ms</label>
        <lit-table id="tb-thread-info" style="height: auto">
            <lit-table-column order title="ThreadName" data-index="name" key="name"  align="flex-start" width="25%">
            </lit-table-column>
            <lit-table-column data-index="count" title="Count" order key="count"  align="flex-start" width="1fr">
            </lit-table-column>
            <lit-table-column title="Avg Load(%)" data-index="avgNumber" order key="avgNumber"  align="flex-start" width="1fr">
            </lit-table-column>
            <lit-table-column title="Max Load(%)" align="flex-start" order data-index="maxNumber" key="maxNumber" width="1fr">
            </lit-table-column>
            <lit-table-column title="Min Load(%)" key="minNumber" data-index="minNumber" order align="flex-start" width="1fr">
            </lit-table-column>
        </lit-table>
        `;
  }

  private createSelectThreadLoadData(list: Array<XpowerThreadInfoStruct>): SelectionData[] {
    let SelectThreadLoadArray: SelectionData[] = [];
    if (list.length > 0) {
      let threadInfoMap = new Map();
      list.forEach((item) => {
        // 如果value为0，泳道不显示，tab也不显示该线程
        if (item.value > 0) {
          if (threadInfoMap.has(item.threadName)) {
            const data = threadInfoMap.get(item.threadName)!;
            data.push(item);
          } else {
            const data: XpowerThreadInfoStruct[] = [];
            data.push(item);
            threadInfoMap.set(item.threadName, data);
          }
        }
      });
      for (let itemArray of threadInfoMap.values()) {
        let SelectThreadLoadData = new SelectionData();
        let max = 0;
        let min = 0;
        let sum = 0;
        SelectThreadLoadData.name = itemArray[0].threadName;
        SelectThreadLoadData.count = itemArray.length;
        if (itemArray.length > 1) {
          max = itemArray.map((item: { value: number }) => item.value).reduce((a: number, b: number) => Math.max(a, b));
          min = itemArray.map((item: { value: number }) => item.value).reduce((a: number, b: number) => Math.min(a, b));
          sum = itemArray.reduce((acc: number, obj: { value: number }) => acc + obj.value, 0);
          SelectThreadLoadData.avgNumber = parseFloat((sum / itemArray.length).toFixed(2));
          SelectThreadLoadData.maxNumber = max;
          SelectThreadLoadData.minNumber = min;
        } else if (itemArray.length === 1) {
          let value = itemArray[0].value;
          SelectThreadLoadData.avgNumber = value;
          SelectThreadLoadData.maxNumber = value;
          SelectThreadLoadData.minNumber = value;
        }
        this.sumCount += itemArray.length;
        SelectThreadLoadArray.push(SelectThreadLoadData);
      }
    }
    return SelectThreadLoadArray;
  }

  private sortByColumn(detail: SortDetail): void {
    function compare(property: string | number, sort: number, type: string) {
      return function (xpowerThreadLoadLeftData: SelectionData, xpowerThreadLoadRightData: SelectionData): number {
        if (xpowerThreadLoadLeftData.process === ' ' || xpowerThreadLoadRightData.process === ' ') {
          return 0;
        }
        if (type === 'number') {
          return sort === 2 // @ts-ignore
            ? parseFloat(xpowerThreadLoadRightData[property]) - parseFloat(xpowerThreadLoadLeftData[property]) // @ts-ignore
            : parseFloat(xpowerThreadLoadLeftData[property]) - parseFloat(xpowerThreadLoadRightData[property]);
        } else {
          // @ts-ignore
          if (xpowerThreadLoadRightData[property] > xpowerThreadLoadLeftData[property]) {
            return sort === 2 ? 1 : -1;
          } else {
            // @ts-ignore
            if (xpowerThreadLoadRightData[property] === xpowerThreadLoadLeftData[property]) {
              return 0;
            } else {
              return sort === 2 ? -1 : 1;
            }
          }
        }
      };
    }
    if (detail.key === 'name') {
      this.XpowerThreadLoadSource.sort(compare(detail.key, detail.sort, 'string'));
    } else {
      this.XpowerThreadLoadSource.sort(compare(detail.key, detail.sort, 'number'));
    }
    this.XpowerThreadLoadTbl!.recycleDataSource = this.XpowerThreadLoadSource;
  }
}
