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
import { resizeObserver } from '../SheetUtils';

@element('tabpane-xpower-counter')
export class TabPaneXpowerCounter extends BaseElement {
  private xpowerCounterTbl: LitTable | null | undefined;
  private xpowerCounterRange: HTMLLabelElement | null | undefined;
  private xpowerCounterSource: Array<SelectionData> = [];

  set data(xpowerCounterValue: SelectionParam) {
    //@ts-ignore
    this.xpowerCounterTbl?.shadowRoot?.querySelector('.table')?.style?.height = `${
      this.parentElement!.clientHeight - 45
    }px`;
    this.xpowerCounterRange!.textContent = `Selected range: ${parseFloat(
      ((xpowerCounterValue.rightNs - xpowerCounterValue.leftNs) / 1000000.0).toFixed(5)
    )} ms`;
    this.getCounterData(xpowerCounterValue).then();
  }

  async getCounterData(xpowerCounterValue: SelectionParam): Promise<void> {
    let dataSource: Array<SelectionData> = [];
    let collect = xpowerCounterValue.xpowerMapData;
    let sumCount = 0;
    this.xpowerCounterTbl!.loading = true;
    for (let key of collect.keys()) {
      let counters = collect.get(key);
      let res = await counters?.({
        startNS: xpowerCounterValue.leftNs,
        endNS: xpowerCounterValue.rightNs,
        queryAll: true,
      });
      let sd = this.createSelectCounterData(key, res || [], xpowerCounterValue.leftNs, xpowerCounterValue.rightNs);
      sumCount += Number.parseInt(sd.count || '0');
      dataSource.push(sd);
    }
    this.xpowerCounterTbl!.loading = false;
    this.xpowerCounterSource = dataSource;
    this.xpowerCounterTbl!.recycleDataSource = dataSource;
  }

  initElements(): void {
    this.xpowerCounterTbl = this.shadowRoot?.querySelector<LitTable>('#tb-counter');
    this.xpowerCounterRange = this.shadowRoot?.querySelector('#time-range');
    this.xpowerCounterTbl!.addEventListener('column-click', (evt): void => {
      // @ts-ignore
      this.sortByColumn(evt.detail);
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.xpowerCounterTbl!);
  }

  initHtml(): string {
    return `
        <style>
        .xpower-counter-label{
            margin-bottom: 5px;
        }
        :host{
            padding: 10px 10px;
            display: flex;
            flex-direction: column;
        }
        </style>
        <label id="time-range" class="xpower-counter-label" style="width: 100%;height: 20px;text-align: end;font-size: 10pt;">Selected range:0.0 ms</label>
        <lit-table id="tb-counter" style="height: auto">
            <lit-table-column order title="Name" data-index="name" key="name"  align="flex-start" width="25%">
            </lit-table-column>
            <lit-table-column data-index="delta" order title="Delta value"  key="delta"  align="flex-start" width="1fr">
            </lit-table-column>
            <lit-table-column title="Rate /s" key="rate" order data-index="rate" align="flex-start" width="1fr">
            </lit-table-column>
            <lit-table-column title="Weighted avg value" order data-index="avgWeight" key="avgWeight"  align="flex-start" width="1fr">
            </lit-table-column>
            <lit-table-column data-index="count" title="Count" order key="count"  align="flex-start" width="1fr">
            </lit-table-column>
            <lit-table-column title="First value" data-index="first" order key="first"  align="flex-start" width="1fr">
            </lit-table-column>
            <lit-table-column title="Last value" align="flex-start" order data-index="last" key="last" width="1fr">
            </lit-table-column>
            <lit-table-column title="Min value" key="min" data-index="min" order align="flex-start" width="1fr">
            </lit-table-column>
            <lit-table-column data-index="max" title="Max value" key="max"  order align="flex-start" width="1fr">
            </lit-table-column>
        </lit-table>
        `;
  }

  createSelectCounterData(name: string, list: Array<unknown>, leftNs: number, rightNs: number): SelectionData {
    let selectCounterData = new SelectionData();
    if (list.length > 0) {
      let range = rightNs - leftNs;
      let first = list[0];
      // @ts-ignore
      selectCounterData.trackId = first.filterId;
      selectCounterData.name = name;
      // @ts-ignore
      selectCounterData.first = `${first.value}`;
      selectCounterData.count = `${list.length}`;
      // @ts-ignore
      selectCounterData.last = `${list[list.length - 1].value}`;
      selectCounterData.delta = `${(Number(selectCounterData.last) - Number(selectCounterData.first)).toFixed(4)}`;
      selectCounterData.rate = (Number(selectCounterData.delta) / ((range * 1.0) / 1000000000)).toFixed(4);
      // @ts-ignore
      selectCounterData.min = `${first.value}`;
      // @ts-ignore
      selectCounterData.max = `${first.value}`;
      let weightAvg = 0.0;
      for (let i = 0; i < list.length; i++) {
        let counter = list[i];
        // @ts-ignore
        if (counter.value < Number(selectCounterData.min)) {
          // @ts-ignore
          selectCounterData.min = counter.value.toString();
        }
        // @ts-ignore
        if (counter.value > Number(selectCounterData.max)) {
          // @ts-ignore
          selectCounterData.max = counter.value.toString();
        }
        // @ts-ignore
        let start = i === 0 ? leftNs : counter.startNS;
        // @ts-ignore
        let end = i === list.length - 1 ? rightNs : list[i + 1].startNS;
        // @ts-ignore
        weightAvg += counter.value * (((end - start) * 1.0) / range);
      }
      selectCounterData.avgWeight = weightAvg.toFixed(2);
    }
    return selectCounterData;
  }

  sortByColumn(detail: unknown): void {
    // @ts-ignore
    function compare(property, sort, type) {
      return function (xpowerCounterLeftData: SelectionData, xpowerCounterRightData: SelectionData): number {
        if (xpowerCounterLeftData.process === ' ' || xpowerCounterRightData.process === ' ') {
          return 0;
        }
        if (type === 'number') {
          return sort === 2 // @ts-ignore
            ? parseFloat(xpowerCounterRightData[property]) - parseFloat(xpowerCounterLeftData[property]) // @ts-ignore
            : parseFloat(xpowerCounterLeftData[property]) - parseFloat(xpowerCounterRightData[property]);
        } else {
          // @ts-ignore
          if (xpowerCounterRightData[property] > xpowerCounterLeftData[property]) {
            return sort === 2 ? 1 : -1;
          } else {
            // @ts-ignore
            if (xpowerCounterRightData[property] === xpowerCounterLeftData[property]) {
              return 0;
            } else {
              return sort === 2 ? -1 : 1;
            }
          }
        }
      };
    }
    // @ts-ignore
    if (detail.key === 'name') {
      // @ts-ignore
      this.xpowerCounterSource.sort(compare(detail.key, detail.sort, 'string'));
    } else {
      // @ts-ignore
      this.xpowerCounterSource.sort(compare(detail.key, detail.sort, 'number'));
    }
    this.xpowerCounterTbl!.recycleDataSource = this.xpowerCounterSource;
  }
}
