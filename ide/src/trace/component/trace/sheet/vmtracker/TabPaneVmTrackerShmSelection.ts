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
import {queryVmTrackerShmSelectionData} from '../../../../database/sql/Memory.sql';
import { TabPaneVmTrackerShmSelectionHtml } from './TabPaneVmTrackerShmSelection.html';

@element('tabpane-vmtracker-shm-selection')
export class TabPaneVmTrackerShmSelection extends BaseElement {
  private TableEl: LitTable | undefined | null;
  private shmData: Array<any> = [];
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
          filter.name = SpSystemTrace.DATA_DICT.get(filter.name)?.split('/');
          filter.ts = ns2s(filter.startNS);
          filter.sizeStr = Utils.getBinaryByteWithUnit(filter.size);
          this.TableEl!.getItemTextColor = (filter): any => {
            if (filter.flag === 1) {
              return '#d4b550';
            } else if (filter.flag === 2) {
              return '#f86b6b';
            } else {
              return '#000000';
            }
          };
        }
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

  private compareValues(a: any, b: any, sort: number): number {
    if (sort === 1) {
      return a > b ? 1 : a < b ? -1 : 0;
    } else {
      return a < b ? 1 : a > b ? -1 : 0;
    }
  }

  sortByColumn(column: string, sort: number): void {
    const comparisonFunctions: { [key: string]: (a: any, b: any) => number } = {
      'ts': (a, b) => this.compareValues(a.startNS, b.startNS, sort),
      'fd': (a, b) => this.compareValues(a.fd, b.fd, sort),
      'sizeStr': (a, b) => this.compareValues(a.size, b.size, sort),
      'adj': (a, b) => this.compareValues(a.adj, b.adj, sort),
      'name': (a, b) => this.compareValues(a.name, b.name, sort),
      'id': (a, b) => this.compareValues(a.id, b.id, sort),
      'time': (a, b) => this.compareValues(a.time, b.time, sort),
      'count': (a, b) => this.compareValues(a.count, b.count, sort),
      'purged': (a, b) => this.compareValues(a.purged, b.purged, sort),
      'flag': (a, b) => this.compareValues(a.flag, b.flag, sort)
    };

    if (sort === 0) {
      this.TableEl!.snapshotDataSource = this.shmData;
    } else {
      const array = [...this.shmData];
      const comparisonFunction = comparisonFunctions[column] || (() => 0);
      this.TableEl!.snapshotDataSource = array.sort(comparisonFunction);
    }
  }

  initHtml(): string {
    return TabPaneVmTrackerShmSelectionHtml;
  }
}
