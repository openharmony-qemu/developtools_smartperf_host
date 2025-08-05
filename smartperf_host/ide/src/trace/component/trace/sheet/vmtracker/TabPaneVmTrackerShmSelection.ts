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
import { SpSystemTrace } from '../../../SpSystemTrace';
import { Utils } from '../../base/Utils';
import { SnapshotStruct } from '../../../../database/ui-worker/ProcedureWorkerSnapshot';
import { MemoryConfig } from '../../../../bean/MemoryConfig';
import { ns2s } from '../../../../database/ui-worker/ProcedureWorkerCommon';
import { queryVmTrackerShmSelectionData } from '../../../../database/sql/Memory.sql';
import { TabPaneVmTrackerShmSelectionHtml } from './TabPaneVmTrackerShmSelection.html';

@element('tabpane-vmtracker-shm-selection')
export class TabPaneVmTrackerShmSelection extends BaseElement {
  private TableEl: LitTable | undefined | null;
  private shmData: Array<unknown> = [];
  private memoryConfig: MemoryConfig = MemoryConfig.getInstance();
  private tabTitle: HTMLDivElement | undefined | null;

  setShmData(data: SnapshotStruct, dataList: Array<SnapshotStruct>): void {
    this.init();
    this.clear();
    this.queryDataByDB(data);
  }

  initElements(): void {
    this.TableEl = this.shadowRoot!.querySelector<LitTable>('#tb-shm-selection') as LitTable;
    this.tabTitle = this.TableEl!.shadowRoot?.querySelector('.thead') as HTMLDivElement;
    this.TableEl!.addEventListener('column-click', (evt) => {
      // @ts-ignore
      this.sortByColumn(evt.detail.key, evt.detail.sort);
    });
  }

  queryDataByDB(data: SnapshotStruct): void {
    queryVmTrackerShmSelectionData(data.startNs, this.memoryConfig.iPid).then((result) => {
      if (result.length > 0) {
        for (let filter of result) {
          //@ts-ignore
          filter.name = SpSystemTrace.DATA_DICT.get(filter.name)?.split('/'); //@ts-ignore
          filter.ts = ns2s(filter.startNS); //@ts-ignore
          filter.sizeStr = Utils.getBinaryByteWithUnit(filter.size);
          // @ts-ignore
          this.TableEl!.getItemTextColor = (filter): unknown => {
            // @ts-ignore
            if (filter.flag === 1) {
              return '#d4b550'; // @ts-ignore
            } else if (filter.flag === 2) {
              return '#f86b6b';
            } else {
              return '#000000';
            }
          };
        } //@ts-ignore
        this.shmData = result.sort((a, b) => b.size - a.size);
        this.TableEl!.recycleDataSource = this.shmData;
      }
    });
  }

  clear(): void {
    this.TableEl!.recycleDataSource = [];
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

  private compareValues(a: unknown, b: unknown, sort: number): number {
    if (sort === 1) {
      // @ts-ignore
      return a > b ? 1 : a < b ? -1 : 0;
    } else {
      // @ts-ignore
      return a < b ? 1 : a > b ? -1 : 0;
    }
  }

  sortByColumn(column: string, sort: number): void {
    const comparisonFunctions: { [key: string]: (a: unknown, b: unknown) => number } = {
      // @ts-ignore
      ts: (a, b) => this.compareValues(a.startNS, b.startNS, sort),
      // @ts-ignore
      fd: (a, b) => this.compareValues(a.fd, b.fd, sort),
      // @ts-ignore
      sizeStr: (a, b) => this.compareValues(a.size, b.size, sort),
      // @ts-ignore
      adj: (a, b) => this.compareValues(a.adj, b.adj, sort),
      // @ts-ignore
      name: (a, b) => this.compareValues(a.name, b.name, sort),
      // @ts-ignore
      id: (a, b) => this.compareValues(a.id, b.id, sort),
      // @ts-ignore
      time: (a, b) => this.compareValues(a.time, b.time, sort),
      // @ts-ignore
      count: (a, b) => this.compareValues(a.count, b.count, sort),
      // @ts-ignore
      purged: (a, b) => this.compareValues(a.purged, b.purged, sort),
      // @ts-ignore
      flag: (a, b) => this.compareValues(a.flag, b.flag, sort),
    };

    if (sort === 0) {
      this.TableEl!.snapshotDataSource = this.shmData;
    } else {
      const array = [...this.shmData];
      const comparisonFunction = comparisonFunctions[column] || ((): number => 0);
      this.TableEl!.snapshotDataSource = array.sort(comparisonFunction);
    }
  }

  initHtml(): string {
    return TabPaneVmTrackerShmSelectionHtml;
  }
}
