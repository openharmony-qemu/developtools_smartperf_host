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
import { type SelectionParam } from '../../../../bean/BoxSelection';
import { Utils } from '../../base/Utils';
import { MemoryConfig } from '../../../../bean/MemoryConfig';
import { ns2s } from '../../../../database/ui-worker/ProcedureWorkerCommon';
import {queryVmTrackerShmSizeData} from "../../../../database/sql/Memory.sql";
import { TabPaneVmTrackerShmHtml } from './TabPaneVmTrackerShm.html';

@element('tabpane-vmtracker-shm')
export class TabPaneVmTrackerShm extends BaseElement {
  private TableEl: LitTable | undefined | null;
  private shmData: Array<number | string> = [];
  private sortArray: Array<any> = [];
  private memoryConfig: MemoryConfig = MemoryConfig.getInstance();
  private tabTitle: HTMLDivElement | undefined | null;
  private range: HTMLLabelElement | null | undefined;

  set data(valVmTrackerShm: SelectionParam | any) {
    if (valVmTrackerShm.vmtrackershm.length > 0) {
      this.init();
      this.clear();
      this.range!.textContent =
        'Selected range: ' +
        parseFloat(((valVmTrackerShm.rightNs - valVmTrackerShm.leftNs) / 1000000.0).toFixed(5)) +
        '  ms';
      this.queryDataByDB(valVmTrackerShm);
    }
  }

  initElements(): void {
    this.TableEl = this.shadowRoot!.querySelector<LitTable>('#tb-shm') as LitTable;
    this.range = this.shadowRoot?.querySelector('#time-range');
    this.tabTitle = this.TableEl!.shadowRoot?.querySelector('.thead') as HTMLDivElement;
    this.TableEl!.addEventListener('column-click', (evt) => {
      // @ts-ignore
      this.sortByColumn(evt.detail.key, evt.detail.sort);
    });
  }

  queryDataByDB(srVal: SelectionParam | any): void {
    queryVmTrackerShmSizeData(
      srVal.leftNs,
      srVal.rightNs,
      this.memoryConfig.iPid,
      (MemoryConfig.getInstance().interval * 1000_000) / 5
    ).then((result) => {
      if (result.length > 0) {
        for (let filter of result) {
          filter.time = ns2s(filter.startNS);
          filter.sumSizeStr = Utils.getBinaryByteWithUnit(filter.sum);
          filter.avgSizeStr = Utils.getBinaryByteWithUnit(filter.avg);
          filter.minSizeStr = Utils.getBinaryByteWithUnit(filter.min);
          filter.maxSizeStr = Utils.getBinaryByteWithUnit(filter.max);
        }
        this.shmData = result.sort((a, b) => b.avg - a.avg);
        this.TableEl!.recycleDataSource = this.shmData;
      }
    });
  }

  clear(): void {
    this.TableEl!.recycleDataSource = [];
  }

  private init(): void {
    const thTable = this.tabTitle!.querySelector('.th');
    const vmTrackerShmTblNodes = thTable!.querySelectorAll('div');
    if (this.tabTitle!.hasAttribute('sort')) {
      this.tabTitle!.removeAttribute('sort');
      vmTrackerShmTblNodes.forEach((item) => {
        item.querySelectorAll('svg').forEach((svg) => {
          svg.style.display = 'none';
        });
      });
    }
  }

  sortByColumn(column: string, sort: number): void {
    switch (sort) {
      case 0:
        this.TableEl!.snapshotDataSource = this.shmData;
        break;
      default:
        this.sortArray = [...this.shmData];
        switch (column) {
          case 'time':
            this.TableEl!.snapshotDataSource = this.sortArray.sort((leftStartNS, rightStartNS) => {
              return sort === 1
                ? leftStartNS.startNS - rightStartNS.startNS
                : rightStartNS.startNS - leftStartNS.startNS;
            });
            break;
          case 'flag':
            this.TableEl!.snapshotDataSource = this.sortArray.sort((leftFlag, rightFlag) => {
              return sort === 1 ? leftFlag.flag - rightFlag.flag : rightFlag.flag - leftFlag.flag;
            });
            break;
          case 'minSizeStr':
            this.TableEl!.snapshotDataSource = this.sortArray.sort((leftMin, rightMin) => {
              return sort === 1 ? leftMin.min - rightMin.min : rightMin.min - leftMin.min;
            });
            break;
          case 'avgSizeStr':
            this.TableEl!.snapshotDataSource = this.sortArray.sort((leftAvg, rightAvg) => {
              return sort === 1 ? leftAvg.avg - rightAvg.avg : rightAvg.avg - leftAvg.avg;
            });
            break;
          case 'maxSizeStr':
            this.TableEl!.snapshotDataSource = this.sortArray.sort((leftMax, rightMax) => {
              return sort === 1 ? leftMax.max - rightMax.max : rightMax.max - leftMax.max;
            });
            break;
        }
        break;
    }
  }

  initHtml(): string {
    return TabPaneVmTrackerShmHtml;
  }
}
