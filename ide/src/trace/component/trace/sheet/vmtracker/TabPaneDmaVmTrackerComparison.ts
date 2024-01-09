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
import { type LitSelect } from '../../../../../base-ui/select/LitSelect';
import { LitSelectOption } from '../../../../../base-ui/select/LitSelectOption';
import { type LitTable } from '../../../../../base-ui/table/lit-table';
import { type DmaComparison } from '../../../../bean/AbilityMonitor';
import { MemoryConfig } from '../../../../bean/MemoryConfig';
import { type SnapshotStruct } from '../../../../database/ui-worker/ProcedureWorkerSnapshot';
import { Utils } from '../../base/Utils';
import { resizeObserverFromMemory } from '../SheetUtils';
import '../TabPaneJsMemoryFilter';
import { type TabPaneJsMemoryFilter } from '../TabPaneJsMemoryFilter';
import {getTabDmaVmTrackerComparisonData} from "../../../../database/sql/Dma.sql";

@element('tabpane-dma-vmtracker-comparison')
export class TabPaneDmaVmTrackerComparison extends BaseElement {
  private damClickTables: LitTable | null | undefined;
  private comparisonSelect: TabPaneJsMemoryFilter | null | undefined;
  private selectEl: LitSelect | null | undefined;
  private selfData: Array<DmaComparison> = [];
  private comparisonSource: Array<DmaComparison> = [];

  initElements(): void {
    this.damClickTables = this.shadowRoot?.querySelector<LitTable>('#damClickTables');
    this.comparisonSelect = this.shadowRoot?.querySelector('#filter') as TabPaneJsMemoryFilter;
    this.selectEl = this.comparisonSelect?.shadowRoot?.querySelector<LitSelect>('lit-select');
    this.damClickTables!.addEventListener('column-click', (e) => {
      // @ts-ignore
      this.sortDmaByColumn(e.detail.key, e.detail.sort);
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserverFromMemory(this.parentElement!, this.damClickTables!, this.comparisonSelect!);
  }

  async queryDataByDB(startNs: number): Promise<DmaComparison[]> {
    let timeStampData: Array<DmaComparison> = [];
    await getTabDmaVmTrackerComparisonData(startNs, MemoryConfig.getInstance().iPid).then((data) => {
      timeStampData = data;
    });
    return timeStampData;
  }

  async comparisonDataByDB(startNs: number, dataList: Array<SnapshotStruct>): Promise<void> {
    this.selfData = [];
    const dataArray = [];
    this.selfData = await this.queryDataByDB(startNs);
    for (let item of dataList) {
      if (item.startNs !== startNs) {
        dataArray.push(item);
      }
    }
    this.selectStamps(dataArray);
    this.getComparisonData(dataArray[0].startNs);
  }

  selectStamps(dmaVmTrackerComList: Array<SnapshotStruct>): void {
    let input = this.selectEl!.shadowRoot?.querySelector('input') as HTMLInputElement;
    this.selectEl!.innerHTML = '';
    let option = new LitSelectOption();
    option.innerHTML = 'File Name';
    option.setAttribute('disabled', 'disabled');
    this.selectEl?.appendChild(option);
    if (dmaVmTrackerComList[0].name) {
      option.setAttribute('value', dmaVmTrackerComList[0].name);
    }
    option.setAttribute('value', dmaVmTrackerComList[0].name);
    this.selectEl!.defaultValue = dmaVmTrackerComList[0].name || '';
    this.selectEl!.placeholder = dmaVmTrackerComList[0].name || '';
    this.selectEl!.dataSource = dmaVmTrackerComList;
    this.selectEl!.querySelectorAll('lit-select-option').forEach((option) => {
      option.addEventListener('onSelected', async (e) => {
        for (let f of dmaVmTrackerComList) {
          if (input.value === f.name) {
            this.getComparisonData(f.startNs);
          }
        }
        e.stopPropagation();
      });
    });
  }

  async getComparisonData(targetStartNs: number): Promise<void> {
    let comparison: Array<DmaComparison> = [];
    comparison = await this.queryDataByDB(targetStartNs);
    comparison[0].value = this.selfData[0].value - comparison[0].value;
    comparison[0].sizes = Utils.getBinaryByteWithUnit(comparison[0].value);
    this.comparisonSource = comparison;
    this.damClickTables!.recycleDataSource = comparison;
  }

  sortDmaByColumn(column: string, sort: number): void {
    switch (sort) {
      case 0:
        this.damClickTables!.recycleDataSource = this.comparisonSource;
        break;
      default:
        let array = [...this.comparisonSource];
        switch (column) {
          case 'sizeDelta':
            this.damClickTables!.recycleDataSource = array.sort((dmaComparisonLeftData, dmaComparisonRightData) => {
              return sort === 1
                ? dmaComparisonLeftData.value - dmaComparisonRightData.value
                : dmaComparisonRightData.value - dmaComparisonLeftData.value;
            });
            break;
        }
        break;
    }
  }

  initHtml(): string {
    return `
<style>
.damClickTables{
    height: auto;
}
:host{
    display: flex;
    flex-direction: column;
    padding: 10px 10px;
}
</style>
<lit-table id="damClickTables" class="damClickTables">
    <lit-table-column order title="SizeDelta" data-index="sizes" key="size" align="flex-start" width="1fr" >
    </lit-table-column>
</lit-table>
<tab-pane-js-memory-filter id="filter" first hideFilter ></tab-pane-js-memory-filter>
        `;
  }
}
