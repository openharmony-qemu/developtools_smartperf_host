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
import { initSort, resizeObserver } from '../SheetUtils';
import { queryIrqDataBoxSelect, querySoftIrqDataBoxSelect } from '../../../../database/sql/Irq.sql';

@element('tabpane-irq-counter')
export class TabPaneIrqCounter extends BaseElement {
  private irqCounterTbl: LitTable | null | undefined;
  private irqRange: HTMLLabelElement | null | undefined;
  private irqCounterSource: Array<SelectionData> = [];
  private sortColumn: string = 'wallDurationFormat';
  private sortType: number = 2;

  set data(irqParam: SelectionParam | any) {
    if (this.irqCounterTbl) {
      //@ts-ignore
      this.irqCounterTbl.shadowRoot.querySelector('.table').style.height = `${this.parentElement!.clientHeight - 45
      }px`;
    }
    this.irqRange!.textContent = `Selected range: ${parseFloat(
      ((irqParam.rightNs - irqParam.leftNs) / 1000000.0).toFixed(5)
    )} ms`;
    let dataSource: Array<SelectionData> = [];
    Promise.all([
      queryIrqDataBoxSelect(irqParam.irqCallIds, irqParam.leftNs, irqParam.rightNs),
      querySoftIrqDataBoxSelect(irqParam.softIrqCallIds, irqParam.leftNs, irqParam.rightNs),
    ]).then((resArr) => {
      resArr.forEach((res) => {
        res.forEach((item) => {
          let selectData = new SelectionData();
          selectData.name = item.irqName;
          selectData.count = item.count;
          selectData.wallDuration = item.wallDuration;
          selectData.wallDurationFormat = (item.wallDuration / 1000).toFixed(2);
          selectData.maxDuration = item.wallDuration;
          selectData.maxDurationFormat = (item.maxDuration / 1000).toFixed(2);
          selectData.avgDuration = (item.avgDuration / 1000).toFixed(2);
          dataSource.push(selectData);
        });
      });
      initSort(this.irqCounterTbl!, this.sortColumn, this.sortType);
      this.irqCounterSource = dataSource;
      this.irqCounterTbl!.recycleDataSource = dataSource;
      this.sortByColumn(this.sortColumn, this.sortType);
    });
  }

  initElements(): void {
    this.irqCounterTbl = this.shadowRoot?.querySelector<LitTable>('#tb-irq-counter');
    this.irqRange = this.shadowRoot?.querySelector('#time-range');
    this.irqCounterTbl!.addEventListener('column-click', (event) => {
      // @ts-ignore
      this.sortByColumn(event.detail.key, event.detail.sort);
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.irqCounterTbl!);
  }

  initHtml(): string {
    return `
        <style>
        .irq-counter-label{
            font-size: 10pt;
        }
        :host{
            display: flex;
            flex-direction: column;
            padding: 10px 10px;
        }
        </style>
        <label id="time-range" class="irq-counter-label" style="width: 100%;height: 20px;text-align: end;margin-bottom: 5px;">Selected range:0.0 ms</label>
        <lit-table id="tb-irq-counter" style="height: auto">
            <lit-table-column width="30%" title="Name" data-index="name" key="name"  align="flex-start" order>
            </lit-table-column>
            <lit-table-column width="1fr" title="Duration(μs)" data-index="wallDurationFormat" key="wallDurationFormat"  align="flex-start" order >
            </lit-table-column>
            <lit-table-column width="1fr" title="Max Duration(μs)" data-index="maxDurationFormat" key="maxDurationFormat"  align="flex-start" order >
            </lit-table-column>
            <lit-table-column width="1fr" title="Average Duration(μs)" data-index="avgDuration" key="avgDuration"  align="flex-start" order >
            </lit-table-column>
            <lit-table-column width="1fr" title="Occurrences" data-index="count" key="count"  align="flex-start" order >
            </lit-table-column>
        </lit-table>
        `;
  }

  sortByColumn(sortColumn: string, sortType: number): void {
    let key = sortColumn;
    let type = sortType;
    let arr = Array.from(this.irqCounterSource);
    arr.sort((irqCounterLeftData, irqCounterRightData): number => {
      if (key === 'wallDurationFormat' || type === 0) {
        return (type === 1 ? 1 : -1) * (irqCounterLeftData.wallDuration - irqCounterRightData.wallDuration);
      } else if (key === 'count') {
        return (type === 1 ? 1 : -1) *
          (parseInt(irqCounterLeftData.count) - parseInt(irqCounterRightData.count));
      } else if (key === 'maxDurationFormat') {
        return (type === 1 ? 1 : -1) * (irqCounterLeftData.maxDuration - irqCounterRightData.maxDuration);
      } else if (key === 'avgDuration') {
        const avgDiff =
          irqCounterLeftData.wallDuration / parseInt(irqCounterLeftData.count) -
          irqCounterRightData.wallDuration / parseInt(irqCounterRightData.count);
        return (type === 1 ? 1 : -1) * avgDiff;
      } else if (key === 'name') {
        const nameDiff = irqCounterLeftData.name.localeCompare(irqCounterRightData.name);
        return (type === 2 ? -1 : 1) * nameDiff;
      } else {
        return 0;
      }
    });
    this.irqCounterTbl!.recycleDataSource = arr;
  }
}
