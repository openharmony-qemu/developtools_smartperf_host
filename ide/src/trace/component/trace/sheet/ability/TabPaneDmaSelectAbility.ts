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
import { type Dma } from '../../../../bean/AbilityMonitor';
import { ns2s } from '../../../../database/ui-worker/ProcedureWorkerCommon';
import { SpSystemTrace } from '../../../SpSystemTrace';
import { Utils } from '../../base/Utils';
import { getTabDmaAbilityClickData } from '../../../../database/sql/Dma.sql';

@element('tabpane-dma-selection-ability')
export class TabPaneDmaSelectAbility extends BaseElement {
  private damClickTable: LitTable | null | undefined;
  private dmaClickSource: Array<Dma> = [];
  private tableThead: HTMLDivElement | undefined | null;
  private table: HTMLDivElement | undefined | null;

  initElements(): void {
    this.damClickTable = this.shadowRoot?.querySelector<LitTable>('#damClickTable');
    this.tableThead = this.damClickTable?.shadowRoot?.querySelector('.thead') as HTMLDivElement;
    this.damClickTable!.addEventListener('column-click', (e) => {
      // @ts-ignore
      this.sortDmaByColumn(e.detail.key, e.detail.sort);
    });
  }

  private init(): void {
    const thTable = this.tableThead!.querySelector('.th');
    const dmaSelectTblNodes = thTable!.querySelectorAll('div');
    if (this.tableThead!.hasAttribute('sort')) {
      this.tableThead!.removeAttribute('sort');
      dmaSelectTblNodes.forEach((item) => {
        item.querySelectorAll('svg').forEach((svg) => {
          svg.style.display = 'none';
        });
      });
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    new ResizeObserver(() => {
      if (this.parentElement?.clientHeight !== 0 && this.damClickTable) {
        // @ts-ignore
        this.damClickTable.shadowRoot.querySelector('.table').style.height =
          this.parentElement!.clientHeight - 18 + 'px';
        this.parentElement!.style.overflow = 'hidden';
        this.damClickTable?.reMeauseHeight();
      }
    }).observe(this.parentElement!);
  }

  queryDmaClickDataByDB(startNs: number): void {
    this.init();
    getTabDmaAbilityClickData(startNs).then((data) => {
      if (data.length !== null && data.length > 0) {
        data.forEach((item) => {
          item.bufName = SpSystemTrace.DATA_DICT.get(item.bufName as number) || '-';
          item.expName = SpSystemTrace.DATA_DICT.get(item.expName as number) || '-';
          item.expTaskComm = SpSystemTrace.DATA_DICT.get(item.expTaskComm as number) || '-';
          if (item.processName !== null) {
            item.process = `${item.processName}(${item.processId})`;
          } else {
            item.process = `Process(${item.processId})`;
          }
          item.sizes = Utils.getBinaryByteWithUnit(item.size);
          item.timeStamp = ns2s(item.startNs);
          // @ts-ignore
          this.damClickTable!.getItemTextColor = (dmaItem: Dma): unknown => {
            if (dmaItem.flag === 1) {
              return '#d4b550';
            } else if (dmaItem.flag === 2) {
              return '#f86b6b';
            } else {
              return '#000000';
            }
          };
        });
        this.damClickTable!.snapshotDataSource = data.sort(function (
          dmaAbilityLeftData: Dma,
          dmaAbilityRightData: Dma
        ) {
          return dmaAbilityRightData.size - dmaAbilityLeftData.size;
        });
        this.dmaClickSource = data;
      } else {
        this.damClickTable!.snapshotDataSource = [];
        this.dmaClickSource = [];
      }
    });
  }

  initHtml(): string {
    return `
<style>
.damClickTable{
    height: auto;
}
:host{
    display: flex;
    padding: 10px 10px;
    flex-direction: column;
}
</style>
<lit-table id="damClickTable" class="damClickTable">
    <lit-table-column order title="TimeStamp" data-index="timeStamp" key="startNs" align="flex-start" width="1fr" >
    </lit-table-column>
    <lit-table-column order title="Process(pid)" data-index="process" key="process" align="flex-start" width="2fr" >
    </lit-table-column>
    <lit-table-column order title="Fd" data-index="fd" key="fd" align="flex-start" width="1fr" >
    </lit-table-column>
    <lit-table-column order title="Size" data-index="sizes" key="size" align="flex-start" width="1fr" >
    </lit-table-column>
    <lit-table-column order title="Ino" data-index="ino" key="ino" align="flex-start" width="1fr" >
    </lit-table-column>
    <lit-table-column order title="ExpPid" data-index="expPid" key="expPid" align="flex-start" width="1fr" >
    </lit-table-column>
    <lit-table-column order title="ExpTaskComm" data-index="expTaskComm" key="expTaskComm" align="flex-start" width="2fr" >
    </lit-table-column>
    <lit-table-column order title="BufName" data-index="bufName" key="bufName" align="flex-start" width="2fr" >
    </lit-table-column>
    <lit-table-column order title="ExpName" data-index="expName" key="expName" align="flex-start" width="2fr" >
    </lit-table-column>
    <lit-table-column order title="Flag" data-index="flag" key="flag" align="flex-start" width="1fr" >
    </lit-table-column>
</lit-table>
        `;
  }

  sortDmaByColumn(column: string, sort: number): void {
    const sortFunction = function (leftData: unknown, rightData: unknown, sortType: number, property: string): number {
      if (sortType === 1) {
        // @ts-ignore
        return typeof leftData[property] === 'string' // @ts-ignore
          ? `${leftData[property]}`.localeCompare(`${rightData[property]}`) // @ts-ignore
          : leftData[property] - rightData[property];
      } else {
        // @ts-ignore
        return typeof rightData[property] === 'string' // @ts-ignore
          ? `${rightData[property]}`.localeCompare(`${leftData[property]}`) // @ts-ignore
          : rightData[property] - leftData[property];
      }
    };

    switch (sort) {
      case 0:
        this.damClickTable!.recycleDataSource = this.dmaClickSource;
        break;
      default:
        this.sortByColumn(column, sort, sortFunction);
        break;
    }
  }

  sortByColumn(column: string, sort: number, sortFunction: Function): void {
    let array = [...this.dmaClickSource];
    switch (column) {
      case 'process':
      case 'expTaskComm':
      case 'bufName':
      case 'expName':
        this.damClickTable!.recycleDataSource = array.sort((leftData, rightData) =>
          sortFunction(leftData, rightData, sort, column)
        );
        break;
      case 'startNs':
      case 'fd':
      case 'size':
      case 'ino':
      case 'expPid':
      case 'flag':
        this.damClickTable!.recycleDataSource = array.sort((leftData, rightData) =>
          sortFunction(leftData, rightData, sort, column)
        );
        break;
    }
  }
}
