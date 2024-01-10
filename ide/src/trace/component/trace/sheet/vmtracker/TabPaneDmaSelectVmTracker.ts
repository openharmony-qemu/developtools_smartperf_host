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
import { MemoryConfig } from '../../../../bean/MemoryConfig';
import { SpSystemTrace } from '../../../SpSystemTrace';
import { Utils } from '../../base/Utils';
import { ns2s } from '../../TimerShaftElement';
import {getTabDmaVMTrackerClickData} from "../../../../database/sql/Dma.sql";

@element('tabpane-dma-selection-vmtracker')
export class TabPaneDmaSelectVmTracker extends BaseElement {
  private damClickTable: LitTable | null | undefined;
  private dmaClickSource: Array<Dma> = [];
  private tableThead: HTMLDivElement | undefined | null;

  initElements(): void {
    this.damClickTable = this.shadowRoot?.querySelector<LitTable>('#damClickTable');
    this.tableThead = this.damClickTable?.shadowRoot?.querySelector('.thead') as HTMLDivElement;
    this.damClickTable!.addEventListener('column-click', (e) => {
      // @ts-ignore
      this.sortDmaByColumn(e.detail.key, e.detail.sort);
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    new ResizeObserver(() => {
      if (this.parentElement?.clientHeight !== 0) {
        if (this.damClickTable) {
          // @ts-ignore
          this.damClickTable.shadowRoot.querySelector('.table').style.height =
            this.parentElement!.clientHeight - 18 + 'px';
          this.damClickTable.reMeauseHeight();
        }
        this.parentElement!.style.overflow = 'hidden';
      }
    }).observe(this.parentElement!);
  }

  private init(): void {
    const thTable = this.tableThead!.querySelector('.th');
    const dmaSelectVmTrackerTblNodes = thTable!.querySelectorAll('div');
    if (this.tableThead!.hasAttribute('sort')) {
      this.tableThead!.removeAttribute('sort');
      dmaSelectVmTrackerTblNodes.forEach((item) => {
        item.querySelectorAll('svg').forEach((svg) => {
          svg.style.display = 'none';
        });
      });
    }
  }

  queryDmaVmTrackerClickDataByDB(startNs: number): void {
    this.init();
    getTabDmaVMTrackerClickData(startNs, MemoryConfig.getInstance().iPid).then((data) => {
      if (data.length !== null && data.length > 0) {
        data.forEach((item) => {
          item.bufName = SpSystemTrace.DATA_DICT.get(item.bufName as number) || '-';
          item.expName = SpSystemTrace.DATA_DICT.get(item.expName as number) || '-';
          item.expTaskComm = SpSystemTrace.DATA_DICT.get(item.expTaskComm as number) || '-';
          item.timeStamp = ns2s(item.startNs);
          item.sizes = Utils.getBinaryByteWithUnit(item.size);
          this.damClickTable!.getItemTextColor = (item: Dma): any => {
            if (item.flag === 1) {
              return '#d4b550';
            } else if (item.flag === 2) {
              return '#f86b6b';
            } else {
              return '#000000';
            }
          };
        });
        this.damClickTable!.recycleDataSource = data.sort(function (dmaVmLeftData: Dma, dmaVmRightData: Dma) {
          return dmaVmRightData.size - dmaVmLeftData.size;
        });
        this.dmaClickSource = data;
      } else {
        this.damClickTable!.recycleDataSource = [];
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
    flex-direction: column;
    padding: 10px 10px;
}
</style>
<lit-table id="damClickTable" class="damClickTable">
    <lit-table-column order title="TimeStamp" data-index="timeStamp" key="startNs" align="flex-start" width="1fr" >
    </lit-table-column>
    <lit-table-column order title="Fd" data-index="fd" key="fd" align="flex-start" width="1fr" >
    </lit-table-column>
    <lit-table-column order title="Size" data-index="sizes" key="size" align="flex-start" width="1fr" >
    </lit-table-column>
    <lit-table-column order title="Ino" data-index="ino" key="ino" align="flex-start" width="1fr" >
    </lit-table-column>
    <lit-table-column order title="ExpPid" data-index="expPid" key="expPid" align="flex-start" width="1fr" >
    </lit-table-column>
    <lit-table-column order title="ExpTaskComm" data-index="expTaskComm" key="expTaskComm" align="flex-start" width="1fr" >
    </lit-table-column>
    <lit-table-column order title="BufName" data-index="bufName" key="bufName" align="flex-start" width="1fr" >
    </lit-table-column>
    <lit-table-column order title="ExpName" data-index="expName" key="expName" align="flex-start" width="1fr" >
    </lit-table-column>
    <lit-table-column order title="Flag" data-index="flag" key="flag" align="flex-start" width="1fr" >
    </lit-table-column>
</lit-table>
        `;
  }

  private compareValues(a: any, b: any, sort: number): number {
    if (sort === 1) {
      return a > b ? 1 : a < b ? -1 : 0;
    } else {
      return a < b ? 1 : a > b ? -1 : 0;
    }
  }

  sortDmaByColumn(column: string, sort: number): void {
    const comparisonFunctions: { [key: string]: (a: any, b: any) => number } = {
      'startNs': (a, b) => this.compareValues(a.startNs, b.startNs, sort),
      'expTaskComm': (a, b) => this.compareValues(`${a.expTaskComm}`, `${b.expTaskComm}`, sort),
      'fd': (a, b) => this.compareValues(a.fd, b.fd, sort),
      'size': (a, b) => this.compareValues(a.size, b.size, sort),
      'ino': (a, b) => this.compareValues(a.ino, b.ino, sort),
      'expPid': (a, b) => this.compareValues(a.expPid, b.expPid, sort),
      'flag': (a, b) => this.compareValues(a.flag, b.flag, sort),
      'bufName': (a, b) => this.compareValues(`${a.bufName}`, `${b.bufName}`, sort),
      'expName': (a, b) => this.compareValues(`${a.expName}`, `${b.expName}`, sort)
    };

    if (sort === 0) {
      this.damClickTable!.recycleDataSource = this.dmaClickSource;
    } else {
      const array = [...this.dmaClickSource];
      const comparisonFunction = comparisonFunctions[column] || (() => 0);
      this.damClickTable!.recycleDataSource = array.sort(comparisonFunction);
    }
  }
}
