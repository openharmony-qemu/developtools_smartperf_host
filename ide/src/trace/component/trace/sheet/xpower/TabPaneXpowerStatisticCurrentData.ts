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
import '../../../../../base-ui/chart/pie/LitChartPie';
import { resizeObserver } from '../SheetUtils';
import { XpowerStatisticStruct } from '../../../../database/ui-worker/ProcedureWorkerXpowerStatistic';

@element('tabpane-xpower-statistic-current-data')
export class TabPaneXpowerStatisticCurrentData extends BaseElement {
  private xpowerCounterTbl: LitTable | null | undefined;
  private xpowerStatisticSource: Array<SelectionData> = [];
  private tabTitle: HTMLDivElement | undefined | null;

  setXpowerStatisticCurrentData(data: XpowerStatisticStruct): void {
    this.init();
    //@ts-ignore
    this.xpowerCounterTbl?.shadowRoot?.querySelector('.table')?.style?.height = `${
      this.parentElement!.clientHeight - 45
    }px`;
    this.xpowerCounterTbl!.loading = true;
    let dataSource: Array<SelectionData> = [];
    let list = [
      'audio',
      'bluetooth',
      'camera',
      'cpu',
      'display',
      'flashlight',
      'gpu',
      'location',
      'wifiscan',
      'wifi',
      'modem',
    ];
    let dataMap = new Map<string, { dur: number; energy: number; startStamp: number }>();
    list.forEach((item) => {
      // @ts-ignore
      if (data[item] !== 0) {
        // @ts-ignore
        dataMap.set(item, { dur: data[item + 'Dur'], energy: data[item], startStamp: data.startTime });
      }
    });
    dataMap.forEach((value, key) => {
      let tableRow = this.createSelectCounterData(value, key);
      dataSource.push(tableRow);
    });
    this.xpowerCounterTbl!.loading = false;
    dataSource.sort(this.compare('energy', 2, 'number'));
    this.xpowerStatisticSource = dataSource;
    this.xpowerCounterTbl!.recycleDataSource = dataSource;
  }

  initElements(): void {
    this.xpowerCounterTbl = this.shadowRoot?.querySelector<LitTable>('#tb-counter');
    this.tabTitle = this.xpowerCounterTbl!.shadowRoot?.querySelector('.thead') as HTMLDivElement;
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
        <lit-table id="tb-counter" style="height: auto">
            <lit-table-column order title="Name" data-index="name" key="name"  align="flex-start" width="25%">
            </lit-table-column>
            <lit-table-column data-index="timeStamp" order title="TimeStamp(ms)"  key="timeStamp"  align="flex-start" width="1fr">
            </lit-table-column>
            <lit-table-column data-index="dur" title="Duration(ms)" order key="dur"  align="flex-start" width="1fr">
            </lit-table-column>
            <lit-table-column title="Energy(mAh)" order data-index="energy" key="energy"  align="flex-start" width="1fr">
            </lit-table-column>
        </lit-table>
        `;
  }

  createSelectCounterData(data: { dur: number; energy: number; startStamp: number }, key: string): SelectionData {
    let selectCounterData = new SelectionData();
    selectCounterData.name = key;
    selectCounterData.timeStamp = (data.startStamp / 1000000).toString();
    selectCounterData.energy = data.energy.toString();
    selectCounterData.dur = data.dur;
    return selectCounterData;
  }

  compare(property: string, sort: number, type: string) {
    return function (xpowerStatisticLeftData: SelectionData, xpowerStatisticRightData: SelectionData): number {
      if (xpowerStatisticLeftData.process === ' ' || xpowerStatisticRightData.process === ' ') {
        return 0;
      }
      if (type === 'number') {
        return sort === 2 // @ts-ignore
          ? parseFloat(xpowerStatisticRightData[property]) - parseFloat(xpowerStatisticLeftData[property]) // @ts-ignore
          : parseFloat(xpowerStatisticLeftData[property]) - parseFloat(xpowerStatisticRightData[property]);
      } else {
        // @ts-ignore
        if (xpowerStatisticRightData[property] > xpowerStatisticLeftData[property]) {
          return sort === 2 ? 1 : -1;
        } else {
          // @ts-ignore
          if (xpowerStatisticRightData[property] === xpowerStatisticLeftData[property]) {
            return 0;
          } else {
            return sort === 2 ? -1 : 1;
          }
        }
      }
    };
  }
  sortByColumn(detail: { key: string; sort: number }): void {
    // @ts-ignore
    if (detail.key === 'name') {
      // @ts-ignore
      this.xpowerStatisticSource.sort(this.compare(detail.key, detail.sort, 'string'));
    } else {
      this.xpowerStatisticSource.sort(this.compare(detail.key, detail.sort, 'number'));
    }
    this.xpowerCounterTbl!.recycleDataSource = this.xpowerStatisticSource;
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
}
