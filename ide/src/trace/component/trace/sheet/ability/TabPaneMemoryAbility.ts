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
import { SelectionParam } from '../../../../bean/BoxSelection';
import { SystemMemorySummary } from '../../../../bean/AbilityMonitor';
import { Utils } from '../../base/Utils';
import { log } from '../../../../../log/Log';
import { resizeObserver } from '../SheetUtils';
import { queryStartTime } from '../../../../database/sql/SqlLite.sql';
import { getTabMemoryAbilityData } from '../../../../database/sql/Ability.sql';

@element('tabpane-memory-ability')
export class TabPaneMemoryAbility extends BaseElement {
  private memoryAbilityTbl: LitTable | null | undefined;
  private memoryAbilitySource: Array<SystemMemorySummary> = [];
  private queryMemoryResult: Array<SystemMemorySummary> = [];
  private search: HTMLInputElement | undefined | null;

  set data(memoryAbilityValue: SelectionParam | any) {
    if (this.memoryAbilityTbl) {
      // @ts-ignore
      this.memoryAbilityTbl.shadowRoot.querySelector('.table').style.height =
        this.parentElement!.clientHeight - 45 + 'px';
    }
    this.queryDataByDB(memoryAbilityValue);
  }

  initElements(): void {
    this.memoryAbilityTbl = this.shadowRoot?.querySelector<LitTable>('#tb-memory-ability');
    this.memoryAbilityTbl!.addEventListener('column-click', (evt) => {
      // @ts-ignore
      this.sortByColumn(evt.detail);
    });
  }

  connectedCallback() {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.memoryAbilityTbl!);
  }

  filterData() {
    if (this.queryMemoryResult.length > 0) {
      let filterMemory = this.queryMemoryResult.filter((item) => {
        let array = this.toMemoryAbilityArray(item);
        let isInclude = array.filter((value) => value.indexOf(this.search!.value) > -1);
        return isInclude.length > 0;
      });
      if (filterMemory.length > 0) {
        this.memoryAbilitySource = filterMemory;
        this.memoryAbilityTbl!.recycleDataSource = this.memoryAbilitySource;
      } else {
        this.memoryAbilitySource = [];
        this.memoryAbilityTbl!.recycleDataSource = [];
      }
    }
  }

  toMemoryAbilityArray(systemMemorySummary: SystemMemorySummary): any[] {
    let array: Array<string> = [];
    array.push(systemMemorySummary.startTimeStr);
    array.push(systemMemorySummary.durationStr);
    array.push(systemMemorySummary.memoryTotal);
    array.push(systemMemorySummary.cached);
    array.push(systemMemorySummary.swapTotal);
    return array;
  }

  getMemoryKeys() {
    return {
      'sys.mem.total': 'memoryTotal',
      'sys.mem.free': 'memFree',
      'sys.mem.buffers': 'buffers',
      'sys.mem.cached': 'cached',
      'sys.mem.shmem': 'shmem',
      'sys.mem.slab': 'slab',
      'sys.mem.swap.total': 'swapTotal',
      'sys.mem.swap.free': 'swapFree',
      'sys.mem.mapped': 'mapped',
      'sys.mem.vmalloc.used': 'vmallocUsed',
      'sys.mem.page.tables': 'pageTables',
      'sys.mem.kernel.stack': 'kernelStack',
      'sys.mem.active': 'active',
      'sys.mem.inactive': 'inactive',
      'sys.mem.unevictable': 'unevictable',
      'sys.mem.vmalloc.total': 'vmallocTotal',
      'sys.mem.slab.unreclaimable': 'sUnreclaim',
      'sys.mem.cma.total': 'cmaTotal',
      'sys.mem.cma.free': 'cmaFree',
      'sys.mem.kernel.reclaimable': 'kReclaimable',
      'sys.mem.zram': 'zram'
    };
  }

  queryDataByDB(val: SelectionParam | any) {
    queryStartTime().then((res) => {
      let startTime = res[0].start_ts;
      getTabMemoryAbilityData(val.leftNs + startTime, val.rightNs + startTime).then((items) => {
        log('getTabMemoryAbilityData result size : ' + items.length);
        this.memoryAbilitySource = [];
        this.queryMemoryResult = [];
        if (items.length != null && items.length > 0) {
          let lastTime = 0;
          for (const item of items) {
            let systemMemorySummary = new SystemMemorySummary();
            systemMemorySummary.startTimeStr = (item.startTime - startTime <= 0) ? '0:000.000.000'
              : Utils.getTimeStampHMS(item.startTime - startTime);
            systemMemorySummary.durationNumber = (lastTime !== 0) ? item.startTime - lastTime : 0;
            systemMemorySummary.durationStr = (lastTime !== 0) ? Utils.getDurString(systemMemorySummary.durationNumber) : '-';
            lastTime = item.startTime;
            let memorys = item.value.split(',');
            let names = item.name.split(',');
            if (memorys.length != names.length) {
              continue;
            }
            let memoryKeys: { [key: string]: string } = this.getMemoryKeys();
            for (let i = 0; i < names.length; i++) {
              let key = memoryKeys[names[i]];
              if (key) {
                // @ts-ignore
                systemMemorySummary[key] = Utils.getBinaryKBWithUnit(Number(memorys[i]));
              }
            }
            ;
            this.memoryAbilitySource.push(systemMemorySummary);
          }
          this.memoryAbilityTbl!.recycleDataSource = this.memoryAbilitySource;
        } else {
          this.memoryAbilitySource = [];
          this.memoryAbilityTbl!.recycleDataSource = [];
        }
      });
    });
    if (this.memoryAbilityTbl) {
      let th = this.memoryAbilityTbl.shadowRoot?.querySelector<HTMLDivElement>('.th');
      if (th) {
        th.style.gridColumnGap = '5px';
      }
    }
  }

  initHtml(): string {
    return `
<style>
#tb-memory-ability{
    overflow-x:auto;     
}
:host{
    flex-direction: column;
    display: flex;
    padding: 10px 10px;
}
</style>
   <lit-table id="tb-memory-ability" style="height: auto">
    <lit-table-column order width="150px" title="StartTime" data-index="startTimeStr" key="startTimeStr" align="flex-start"></lit-table-column>
    <lit-table-column order width="100px" title="Duration" data-index="durationStr" key="durationStr" align="flex-start" ></lit-table-column>
    <lit-table-column order width="100px" title="MemTotal" data-index="memoryTotal" key="memoryTotal" align="flex-start" ></lit-table-column>
    <lit-table-column order width="100px" title="MemFree" data-index="memFree" key="memFree" align="flex-start" ></lit-table-column>
    <lit-table-column order width="100px" title="Buffers" data-index="buffers" key="buffers" align="flex-start" ></lit-table-column>
    <lit-table-column order width="100px" title="Cached" data-index="cached" key="cached" align="flex-start" ></lit-table-column>
    <lit-table-column order width="100px" title="Shmem" data-index="shmem" key="shmem" align="flex-start" ></lit-table-column>
    <lit-table-column order width="100px" title="Slab" data-index="slab" key="slab" align="flex-start" ></lit-table-column>
    <lit-table-column order width="120px" title="SUnreclaim" data-index="sUnreclaim" key="sUnreclaim" align="flex-start" ></lit-table-column>
    <lit-table-column order width="100px" title="SwapTotal" data-index="swapTotal" key="swapTotal" align="flex-start" ></lit-table-column>
    <lit-table-column order width="100px" title="SwapFree" data-index="swapFree" key="swapFree" align="flex-start" ></lit-table-column>
    <lit-table-column order width="100px" title="Mapped" data-index="mapped" key="mapped" align="flex-start" ></lit-table-column>
    <lit-table-column order width="120px" title="VmallocUsed" data-index="vmallocUsed" key="vmallocUsed" align="flex-start" ></lit-table-column>
    <lit-table-column order width="100px" title="PageTables" data-index="pageTables" key="pageTables" align="flex-start" ></lit-table-column>
    <lit-table-column order width="120px" title="KernelStack" data-index="kernelStack" key="kernelStack" align="flex-start" ></lit-table-column>
    <lit-table-column order width="120px" title="KReclaimable" data-index="kReclaimable" key="kReclaimable" align="flex-start" ></lit-table-column>
    <lit-table-column order width="100px" title="Active" data-index="active" key="active" align="flex-start" ></lit-table-column>
    <lit-table-column order width="100px" title="Inactive" data-index="inactive" key="inactive" align="flex-start" ></lit-table-column>
    <lit-table-column order width="120px" title="Unevictable" data-index="unevictable" key="unevictable" align="flex-start" ></lit-table-column>
    <lit-table-column order width="120px" title="VmallocTotal" data-index="vmallocTotal" key="vmallocTotal" align="flex-start" ></lit-table-column>
    <lit-table-column order width="100px" title="CmaTotal" data-index="cmaTotal" key="cmaTotal" align="flex-start" ></lit-table-column>
    <lit-table-column order width="100px" title="CmaFree" data-index="cmaFree" key="cmaFree" align="flex-start" ></lit-table-column>
    <lit-table-column order width="100px" title="Zram" data-index="zram" key="zram" align="flex-start" ></lit-table-column>
</lit-table>
        `;
  }

  sortByColumn(detail: any) {
    // @ts-ignore
    function compare(property, sort, type) {
      return function (memoryAbilityLeftData: SystemMemorySummary, memoryAbilityRightData: SystemMemorySummary) {
        if (type === 'number') {
          return sort === 2
            ? // @ts-ignore
            parseFloat(memoryAbilityRightData[property]) - parseFloat(memoryAbilityLeftData[property])
            : // @ts-ignore
            parseFloat(memoryAbilityLeftData[property]) - parseFloat(memoryAbilityRightData[property]);
        } else if (type === 'durationStr') {
          return sort === 2
            ? memoryAbilityRightData.durationNumber - memoryAbilityLeftData.durationNumber
            : memoryAbilityLeftData.durationNumber - memoryAbilityRightData.durationNumber;
        } else {
          // @ts-ignore
          if (memoryAbilityRightData[property] > memoryAbilityLeftData[property]) {
            return sort === 2 ? 1 : -1;
          } else {
            // @ts-ignore
            if (memoryAbilityRightData[property] == memoryAbilityLeftData[property]) {
              return 0;
            } else {
              return sort === 2 ? -1 : 1;
            }
          }
        }
      };
    }

    if (detail.key === 'startTime') {
      this.memoryAbilitySource.sort(compare(detail.key, detail.sort, 'string'));
    } else if (detail.key === 'durationStr') {
      this.memoryAbilitySource.sort(compare(detail.key, detail.sort, 'durationStr'));
    } else {
      this.memoryAbilitySource.sort(compare(detail.key, detail.sort, 'number'));
    }
    this.memoryAbilityTbl!.recycleDataSource = this.memoryAbilitySource;
  }
}
