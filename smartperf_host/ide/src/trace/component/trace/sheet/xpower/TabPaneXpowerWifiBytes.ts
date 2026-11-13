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
import { TraceRow } from '../../base/TraceRow';
import { SpSystemTrace } from '../../../SpSystemTrace';
import { XpowerAppDetailStruct } from '../../../../database/ui-worker/ProcedureWorkerXpowerAppDetail';
import { SpChartList } from '../../SpChartList';

@element('tabpane-xpower-wifibytes')
export class TabPaneXpowerWifiBytes extends BaseElement {
  private xpowerCounterTbl: LitTable | null | undefined;
  private xpowerCounterRange: HTMLLabelElement | null | undefined;
  private xpowerBytesSource: Array<SelectionData> = [];
  private systemTrace: SpSystemTrace | undefined | null;
  private spChartList: SpChartList | undefined | null;
  private traceRow: TraceRow<XpowerAppDetailStruct> | undefined | null;
  private tabTitle: HTMLDivElement | undefined | null;
  private checked: boolean[] = [];
  private checkedValue: string[] = [];

  set data(xpowerCounterValue: SelectionParam) {
    this.init();
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
    let collect = xpowerCounterValue.xpowerWifiBytesMapData;
    this.xpowerCounterTbl!.loading = true;
    let dataSourceBytes: Array<SelectionData> = [];
    for (let key of collect.keys()) {
      this.traceRow = this.systemTrace!.shadowRoot?.querySelector<TraceRow<XpowerAppDetailStruct>>(
        `trace-row[row-id=${key}]`
      );
      if (!this.traceRow) {
        this.spChartList = this.systemTrace!.shadowRoot?.querySelector('div > sp-chart-list');
        this.traceRow = this.spChartList?.shadowRoot!.querySelector(`.root > div > trace-row[row-id=${key}]`);
      }
      this.checked = this.traceRow!.rowSettingCheckedBoxList!;
      this.checkedValue = this.traceRow!.rowSettingCheckBoxList!;
      let counters = collect.get(key);
      let res = await counters?.({
        startNS: xpowerCounterValue.leftNs,
        endNS: xpowerCounterValue.rightNs,
        queryAll: true,
      });
      let xpowerWifiMap = new Map<string, number[]>();
      this.checkedValue.forEach((key) => {
        res!.forEach((item) => {
          // @ts-ignore
          let val = item[key];
          if (xpowerWifiMap.has(key) && val !== 0) {
            let data = xpowerWifiMap.get(key);
            data!.push(val);
            xpowerWifiMap.set(key, data!);
          } else if (val !== 0) {
            xpowerWifiMap.set(key, []);
            let data = xpowerWifiMap.get(key);
            data!.push(val);
            xpowerWifiMap.set(key, data!);
          }
        });
      });
      xpowerWifiMap.forEach((value, key) => {
        !this.checked[this.checkedValue.indexOf(key)] && xpowerWifiMap.has(key) && xpowerWifiMap.delete(key);
      });
      xpowerWifiMap.forEach((value, mapKey) => {
        let sd = this.createSelectCounterData(value, mapKey, key);
        dataSourceBytes.push(sd);
      });
      this.xpowerCounterTbl!.loading = false;
      this.xpowerBytesSource = dataSourceBytes;
      this.xpowerCounterTbl!.recycleDataSource = dataSourceBytes;
    }
  }

  initElements(): void {
    this.systemTrace = document
      .querySelector('body > sp-application')
      ?.shadowRoot!.querySelector<SpSystemTrace>('#sp-system-trace');
    this.xpowerCounterTbl = this.shadowRoot?.querySelector<LitTable>('#tb-counter');
    this.tabTitle = this.xpowerCounterTbl!.shadowRoot?.querySelector('.thead') as HTMLDivElement;
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
            <lit-table-column order title="Name" data-index="name" key="name"  align="flex-start" width="20%">
            </lit-table-column>
            <lit-table-column data-index="count" order title="Count"  key="count"  align="flex-start" width="1fr">
            </lit-table-column>
            <lit-table-column title="Max(B)" order data-index="max" key="max"  align="flex-start" width="1fr">
            </lit-table-column>
            <lit-table-column data-index="min" title="Min(B)" order key="min"  align="flex-start" width="1fr">
            </lit-table-column>
            <lit-table-column title="Avg(B)" key="average" order data-index="average" align="flex-start" width="1fr">
            </lit-table-column>
        </lit-table>
        `;
  }

  createSelectCounterData(list: number[], key: string, type: string): SelectionData {
    let selectCounterData = new SelectionData();
    if (list.length > 0) {
      selectCounterData.name = key === 'tx' ? 'send' : 'receiver';
      selectCounterData.count = list.length.toString();
      let max = list[0];
      let min = list[0];
      let total = 0;
      list.forEach((item) => {
        max < item && (max = item);
        min > item && (min = item);
        total += item;
      });
      selectCounterData.max = max.toString();
      selectCounterData.min = min.toString();
      selectCounterData.average = (total / list.length).toFixed(2);
    }
    return selectCounterData;
  }

  sortByColumn(detail: { key: string; sort: number }): void {
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
    if (detail.key === 'name') {
      this.xpowerBytesSource.sort(compare(detail.key, detail.sort, 'string'));
    } else {
      this.xpowerBytesSource.sort(compare(detail.key, detail.sort, 'number'));
    }
    this.xpowerCounterTbl!.recycleDataSource = this.xpowerBytesSource;
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
