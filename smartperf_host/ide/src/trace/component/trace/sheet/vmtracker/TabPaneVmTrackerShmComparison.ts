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
import { type LitTable } from '../../../../../base-ui/table/lit-table';
import { type SnapshotStruct } from '../../../../database/ui-worker/ProcedureWorkerSnapshot';
import { MemoryConfig } from '../../../../bean/MemoryConfig';
import { Utils } from '../../base/Utils';
import { LitSelectOption } from '../../../../../base-ui/select/LitSelectOption';
import { type LitSelect } from '../../../../../base-ui/select/LitSelect';
import { type TabPaneJsMemoryFilter } from '../TabPaneJsMemoryFilter';
import { resizeObserverFromMemory } from '../SheetUtils';
import { queryVmTrackerShmSelectionData } from '../../../../database/sql/Memory.sql';
import { TabPaneVmTrackerShmComparisonHtml } from './TabPaneVmTrackerShmComparison.html';

@element('tabpane-vmtracker-shm-comparison')
export class TabPaneVmTrackerShmComparison extends BaseElement {
  private comparisonTableEl: LitTable | undefined | null;
  private baseFileTs: number | undefined | null;
  private targetFileTs: number | undefined | null;
  private comparisonData!: unknown[];
  private baseFileData: Array<unknown> = [];
  private targetFileData: Array<unknown> = [];
  private memoryConfig: MemoryConfig = MemoryConfig.getInstance();
  private selectEl: LitSelect | undefined | null;
  private filterEl: TabPaneJsMemoryFilter | undefined | null;
  private comparisonSource: Array<ShmObj> = [];

  initElements(): void {
    this.comparisonTableEl = this.shadowRoot!.querySelector<LitTable>('#tb-comparison') as LitTable;
    this.filterEl = this.shadowRoot!.querySelector<TabPaneJsMemoryFilter>('#filter');
    this.selectEl = this.filterEl?.shadowRoot?.querySelector<LitSelect>('lit-select');
    this.comparisonTableEl!.addEventListener('column-click', (e) => {
      // @ts-ignore
      this.sortShmByColumn(e.detail.key, e.detail.sort);
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserverFromMemory(this.parentElement!, this.comparisonTableEl!, this.filterEl!);
  }

  setShmData(data: SnapshotStruct, dataList: Array<SnapshotStruct>): void {
    let fileArr: SnapshotStruct[] = [];
    for (let file of dataList) {
      if (file.startNs !== data.startNs) {
        fileArr.push(file);
      }
    }
    fileArr = fileArr.sort();
    this.baseFileTs = data.startNs;
    this.initSelect(data.startNs, fileArr);
    this.targetFileTs = fileArr[0].startNs;
    this.updateComparisonData(data.startNs, fileArr[0].startNs);
  }

  async updateComparisonData(baseFileTs: number, targetFileTs: number): Promise<void> {
    await queryVmTrackerShmSelectionData(baseFileTs, this.memoryConfig.iPid).then((result) => {
      this.baseFileData = result;
    });
    await queryVmTrackerShmSelectionData(targetFileTs, this.memoryConfig.iPid).then((result) => {
      this.targetFileData = result;
    });
    let sizeData = this.calSizeObj(this.baseFileData, this.targetFileData);
    this.comparisonData = [];
    this.comparisonData.push(sizeData);
    // @ts-ignore
    this.comparisonSource = this.comparisonData;
    this.comparisonTableEl!.snapshotDataSource = this.comparisonData;
  }

  calSizeObj(baseFileData: Array<unknown>, targetFileData: Array<unknown>): ShmObj {
    let sizeObj = new ShmObj();
    let baseSumSize = 0;
    let targetSumSize = 0;
    for (let file of baseFileData) {
      // @ts-ignore
      baseSumSize += file.size;
    }
    for (let file of targetFileData) {
      // @ts-ignore
      targetSumSize += file.size;
    }
    sizeObj.sizeDelta = baseSumSize - targetSumSize;
    sizeObj.sizeDeltaStr = Utils.getBinaryByteWithUnit(sizeObj.sizeDelta);
    return sizeObj;
  }

  initSelect(fileId: number, fileArr: Array<SnapshotStruct>): void {
    let input = this.selectEl!.shadowRoot?.querySelector('input') as HTMLInputElement;
    this.selectEl!.innerHTML = '';
    let option = new LitSelectOption();
    option.innerHTML = 'File Name';
    option.setAttribute('disabled', 'disabled');
    this.selectEl?.appendChild(option);
    if (fileArr[0].name) {
      option.setAttribute('value', fileArr[0].name);
    }
    this.selectEl!.defaultValue = fileArr[0].name || '';
    this.selectEl!.placeholder = fileArr[0].name || '';
    this.selectEl!.dataSource = fileArr;
    let selectOption = this.selectEl!.querySelectorAll('lit-select-option');
    for (const item of selectOption) {
      item.addEventListener('onSelected', (e) => {
        this.comparisonTableEl!.scrollTop = 0;
        for (let f of fileArr) {
          if (input.value === f.name) {
            this.updateComparisonData(fileId, f.startNs);
          }
        }
        e.stopPropagation();
      });
    }
  }

  sortShmByColumn(column: string, sort: number): void {
    switch (sort) {
      case 0:
        this.comparisonTableEl!.snapshotDataSource = this.comparisonSource;
        break;
      default:
        let array = [...this.comparisonSource];
        switch (column) {
          case 'sizeDelta':
            this.comparisonTableEl!.snapshotDataSource = array.sort((shmComparisonLeftData, shmComparisonRightData) => {
              return sort === 1
                ? shmComparisonLeftData.sizeDelta - shmComparisonRightData.sizeDelta
                : shmComparisonRightData.sizeDelta - shmComparisonLeftData.sizeDelta;
            });
            break;
        }
        break;
    }
  }

  initHtml(): string {
    return TabPaneVmTrackerShmComparisonHtml;
  }
}

class ShmObj {
  sizeDelta = 0;
  sizeDeltaStr: string = '';
}
