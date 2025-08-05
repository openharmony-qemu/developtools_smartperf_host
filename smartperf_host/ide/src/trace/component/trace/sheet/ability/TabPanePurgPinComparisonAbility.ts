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
import { type LitTable } from '../../../../../base-ui/table/lit-table';
import { LitSelectOption } from '../../../../../base-ui/select/LitSelectOption';
import { type SelectionParam } from '../../../../bean/BoxSelection';
import { Utils } from '../../base/Utils';
import { CompareStruct, compare, resizeObserverFromMemory } from '../SheetUtils';
import { type TabPaneJsMemoryFilter } from '../TabPaneJsMemoryFilter';
import { querySysPurgeableSelectionTab } from '../../../../database/sql/Ability.sql';

@element('tabpane-purgeable-pin-comparison-ability')
export class TabPanePurgPinComparisonAbility extends BaseElement {
  private purgeablePinTable: LitTable | null | undefined;
  private purgeablePinSource: Array<unknown> = [];
  private filterEl: TabPaneJsMemoryFilter | undefined | null;
  private selectEl: LitSelect | undefined | null;

  public initElements(): void {
    this.purgeablePinTable = this.shadowRoot?.querySelector<LitTable>('#tb-purgeable-pin');
    this.filterEl = this.shadowRoot!.querySelector<TabPaneJsMemoryFilter>('#filter');
    this.selectEl = this.filterEl?.shadowRoot?.querySelector<LitSelect>('lit-select');
  }

  public totalData(purgePinComParam: SelectionParam | unknown, dataList: unknown): void {
    if (this.purgeablePinTable) {
      //@ts-ignore
      this.purgeablePinTable.shadowRoot?.querySelector('.table').style.height = `${this.parentElement!.clientHeight - 45
        }px`;
    }
    this.purgeablePinSource = [];
    let fileArr: unknown[] = []; // @ts-ignore
    for (let file of dataList) {
      // @ts-ignore
      if (file.startNs !== purgePinComParam.startNs) {
        fileArr.push(file);
      }
    }
    fileArr = fileArr.sort(); // @ts-ignore
    this.initSelect(purgePinComParam.startNs, fileArr); // @ts-ignore
    this.updateComparisonData(purgePinComParam.startNs, fileArr[0].startNs);
  }

  private initSelect(fileStartNs: number, purgePinComFileArr: Array<unknown>): void {
    let input = this.selectEl!.shadowRoot?.querySelector('input') as HTMLInputElement;
    this.selectEl!.innerHTML = '';
    let option = new LitSelectOption();
    option.innerHTML = 'File Name';
    option.setAttribute('disabled', 'disabled');
    this.selectEl?.appendChild(option); // @ts-ignore
    if (purgePinComFileArr[0].name) {
      // @ts-ignore
      option.setAttribute('value', purgePinComFileArr[0].name);
    } // @ts-ignore
    this.selectEl!.defaultValue = purgePinComFileArr[0].name; // @ts-ignore
    this.selectEl!.placeholder = purgePinComFileArr[0].name;
    this.selectEl!.dataSource = purgePinComFileArr;
    let selectOption = this.selectEl!.querySelectorAll('lit-select-option');
    for (const item of selectOption) {
      item.addEventListener('onSelected', (e: unknown) => {
        for (let f of purgePinComFileArr) {
          // @ts-ignore
          if (input.value === f.name) {
            // @ts-ignore
            this.updateComparisonData(fileStartNs, f.startNs);
          }
        } // @ts-ignore
        e.stopPropagation();
      });
    }
  }
  // @ts-ignore
  private async updateComparisonData(baseTime: number, targetTime: number): Promise<unknown> {
    this.purgeablePinSource = [];
    let tableData = await this.queryTableData(baseTime, targetTime);
    this.purgeablePinSource.push(tableData);
    if (this.purgeablePinSource.length > 0) {
      this.purgeablePinTable!.recycleDataSource = this.purgeablePinSource;
    } else {
      this.purgeablePinTable!.recycleDataSource = [];
    }
  }

  private async queryTableData(baseTime: number, targetTime: number): Promise<unknown> {
    let delta = {
      purgPinedDelta: '0Bytes',
      shmPurgPinDelta: '0Bytes',
    };
    const baseArr: CompareStruct[] = [];
    const targetArr: CompareStruct[] = [];
    // 点击的
    await querySysPurgeableSelectionTab(baseTime, true).then(async (results) => {
      for (let i = 0; i < results.length; i++) {
        //@ts-ignore
        baseArr.push(new CompareStruct(results[i].name, results[i].value));
      }
      // 被比较的
      await querySysPurgeableSelectionTab(targetTime, true).then((results) => {
        for (let i = 0; i < results.length; i++) {
          //@ts-ignore
          targetArr.push(new CompareStruct(results[i].name, results[i].value));
        }
        let compareData = compare(baseArr, targetArr);
        for (let data of compareData) {
          if (data.key === 'PinedPurg') {
            delta.purgPinedDelta = Utils.getBinaryByteWithUnit(data.value);
          } else {
            delta.shmPurgPinDelta = Utils.getBinaryByteWithUnit(data.value);
          }
        }
      });
    });
    return delta;
  }

  public connectedCallback(): void {
    super.connectedCallback();
    resizeObserverFromMemory(this.parentElement!, this.purgeablePinTable!, this.filterEl!);
  }

  public initHtml(): string {
    return `
    <style>
        :host{
            display: flex;
            flex-direction: column;
            padding: 10px 10px;
        }
    </style>
    <lit-table id="tb-purgeable-pin" style="height: auto">
        <lit-table-column width="1fr" title="PurgPinedDelta" data-index="purgPinedDelta" align="flex-start">
        </lit-table-column>
        <lit-table-column width="1fr" title="ShmPurgPinDelta" data-index="shmPurgPinDelta" align="flex-start">
        </lit-table-column>
    </lit-table>
    <lit-progress-bar class="progress"></lit-progress-bar>
    <tab-pane-js-memory-filter id="filter" first hideFilter></tab-pane-js-memory-filter>
    `;
  }
}
