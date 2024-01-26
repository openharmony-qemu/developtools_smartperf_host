/*
 * Copyright (C) 2022 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this data except in compliance with the License.
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
import { type SelectionParam } from '../../../../bean/BoxSelection';
import { MemoryConfig } from '../../../../bean/MemoryConfig';
import { Utils } from '../../base/Utils';
import { CompareStruct, compare, resizeObserverFromMemory } from '../SheetUtils';
import { type TabPaneJsMemoryFilter } from '../TabPaneJsMemoryFilter';
import { queryProcessPurgeableSelectionTab } from '../../../../database/sql/ProcessThread.sql';

@element('tabpane-purgeable-total-comparison-vm')
export class TabPanePurgTotalComparisonVM extends BaseElement {
  private purgeableTotalTables: LitTable | null | undefined;
  private purgeableTotalSource: Array<unknown> = [];
  private filterEl: TabPaneJsMemoryFilter | undefined | null;
  private selectEl: LitSelect | undefined | null;

  public initElements(): void {
    this.purgeableTotalTables = this.shadowRoot?.querySelector<LitTable>('#tb-purgeable-total');
    this.filterEl = this.shadowRoot!.querySelector<TabPaneJsMemoryFilter>('#filter');
    this.selectEl = this.filterEl?.shadowRoot?.querySelector<LitSelect>('lit-select');
  }

  public totalData(data: SelectionParam | any, dataList: any): void {
    //@ts-ignore
    this.purgeableTotalTables?.shadowRoot?.querySelector('.table')?.style?.height = `${
      this.parentElement!.clientHeight - 45
    }px`;
    this.purgeableTotalSource = [];
    let fileArr: any[] = [];
    for (let file of dataList) {
      if (file.startNs !== data.startNs) {
        fileArr.push(file);
      }
    }
    fileArr = fileArr.sort();
    this.initSelect(data.startNs, fileArr);
    this.updateComparisonsData(data.startNs, fileArr[0].startNs);
  }

  private initSelect(fileStartNs: number, purgeTotalComList: Array<any>): void {
    let that = this;
    let input = this.selectEl!.shadowRoot?.querySelector('input') as HTMLInputElement;
    this.selectEl!.innerHTML = '';
    let option = new LitSelectOption();
    option.innerHTML = 'File Name';
    option.setAttribute('disabled', 'disabled');
    this.selectEl?.appendChild(option);
    if (purgeTotalComList[0].name) {
      option.setAttribute('value', purgeTotalComList[0].name);
    }
    this.selectEl!.defaultValue = purgeTotalComList[0].name;
    this.selectEl!.placeholder = purgeTotalComList[0].name;
    this.selectEl!.dataSource = purgeTotalComList;
    this.selectEl!.querySelectorAll('lit-select-option').forEach((a) => {
      a.addEventListener('onSelected', (e: any) => {
        for (let f of purgeTotalComList) {
          if (input.value === f.name) {
            that.updateComparisonsData(fileStartNs, f.startNs);
          }
        }
        e.stopPropagation();
      });
    });
  }

  private async updateComparisonsData(baseTime: number, targetTime: number): Promise<void> {
    this.purgeableTotalSource = [];
    let tableData = await this.queryTotalVMData(baseTime, targetTime);
    this.purgeableTotalSource.push(tableData);
    if (this.purgeableTotalSource.length > 0) {
      this.purgeableTotalTables!.recycleDataSource = this.purgeableTotalSource;
    } else {
      this.purgeableTotalTables!.recycleDataSource = [];
    }
  }

  private async queryTotalVMData(baseTime: number, targetTime: number): Promise<any> {
    let deltas = {
      purgSumDelta: '0Bytes',
      shmPurgDelta: '0Bytes',
    };
    const baseArr: CompareStruct[] = [];
    const targetArr: CompareStruct[] = [];
    // 点击的
    await queryProcessPurgeableSelectionTab(baseTime, MemoryConfig.getInstance().iPid).then(async (results) => {
      for (let i = 0; i < results.length; i++) {
        baseArr.push(new CompareStruct(results[i].name, results[i].value));
      }
      // 被比较的
      await queryProcessPurgeableSelectionTab(targetTime, MemoryConfig.getInstance().iPid).then((results) => {
        for (let i = 0; i < results.length; i++) {
          targetArr.push(new CompareStruct(results[i].name, results[i].value));
        }
        let compareData = compare(targetArr, baseArr);
        for (let data of compareData) {
          if (data.key === 'TotalPurg') {
            deltas.purgSumDelta = Utils.getBinaryByteWithUnit(data.value);
          } else if (data.key === 'ShmPurg') {
            deltas.shmPurgDelta = Utils.getBinaryByteWithUnit(data.value);
          }
        }
      });
    });
    return deltas;
  }

  public connectedCallback(): void {
    super.connectedCallback();
    resizeObserverFromMemory(this.parentElement!, this.purgeableTotalTables!, this.filterEl!);
  }

  public initHtml(): string {
    return `
    <style>
        :host{
            display: flex;
            padding: 10px 10px;
            flex-direction: column;
        }
    </style>
    <lit-table id="tb-purgeable-total" style="height: auto">
        <lit-table-column width="1fr" title="PurgSumDelta" data-index="purgSumDelta" align="flex-start">
        </lit-table-column>
        <lit-table-column width="1fr" title="ShmPurgDelta" data-index="shmPurgDelta" align="flex-start">
        </lit-table-column>
    </lit-table>
    <lit-progress-bar class="progress"></lit-progress-bar>
    <tab-pane-js-memory-filter id="filter" first hideFilter></tab-pane-js-memory-filter>
    `;
  }
}
