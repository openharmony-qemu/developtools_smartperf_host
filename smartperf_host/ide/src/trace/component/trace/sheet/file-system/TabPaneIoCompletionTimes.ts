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
import '../../../../../base-ui/slicer/lit-slicer';
import { LitProgressBar } from '../../../../../base-ui/progress-bar/LitProgressBar';
import { procedurePool } from '../../../../database/Procedure';
import {
  FileSysEvent,
  IoCompletionTimes,
  VM_TYPE_MAP,
} from '../../../../database/logic-worker/ProcedureLogicWorkerFileSystem';
import { FilterData, TabPaneFilter } from '../TabPaneFilter';
import { getTabIoCompletionTimesType } from '../../../../database/sql/SqlLite.sql';
import { TabPaneIoCompletionTimesHtml } from './TabPaneIoCompletionTimes.html';

@element('tabpane-io-completiontimes')
export class TabPaneIoCompletionTimes extends BaseElement {
  // @ts-ignore
  private defaultNativeTypes = ['All', ...Object.values(VM_TYPE_MAP)];
  private native_type: Array<string> = [...this.defaultNativeTypes];
  private ioCompletionTimesTbl: LitTable | null | undefined;
  private ioCompletionTimesTblData: LitTable | null | undefined;
  private ioCompletionTimesProgressEL: LitProgressBar | null | undefined;
  private ioCompletionTimesLoadingList: number[] = [];
  private ioCompletionTimesLoadingPage: unknown;
  private currentSelection: SelectionParam | undefined | null;
  private ioCompletionTimesSource: Array<IoCompletionTimes> = [];
  private ioCompletionTimesQueryDataSource: Array<IoCompletionTimes> = [];
  private ioCompletionTimesSelection: Array<unknown> = [];

  set data(ioCompletionTimesSelection: SelectionParam | null | undefined) {
    if (ioCompletionTimesSelection === this.currentSelection) {
      return;
    }
    this.currentSelection = ioCompletionTimesSelection;
    this.initFilterTypes(ioCompletionTimesSelection!).then((): void => {
      this.queryData(ioCompletionTimesSelection!);
    });
    if (this.ioCompletionTimesTbl) {
      // @ts-ignore
      this.ioCompletionTimesTbl.shadowRoot.querySelector('.table').style.height = `${
        this.parentElement!.clientHeight - 20 - 31
      }px`;
      this.ioCompletionTimesTbl.recycleDataSource = [];
    }
    if (this.ioCompletionTimesTblData) {
      // @ts-ignore
      this.ioCompletionTimesTblData.shadowRoot.querySelector('.table').style.height = `${
        this.parentElement!.clientHeight - 20 - 31
      }px`;
      this.ioCompletionTimesTblData.recycleDataSource = [];
    }
  }

  connectedCallback(): void {
    new ResizeObserver((): void => {
      if (this.parentElement?.clientHeight !== 0) {
        if (this.ioCompletionTimesTbl) {
          // @ts-ignore
          this.ioCompletionTimesTbl.shadowRoot.querySelector('.table').style.height = `${
            this.parentElement!.clientHeight - 10 - 33
          }px`;
          this.ioCompletionTimesTbl.reMeauseHeight();
        }
        if (this.ioCompletionTimesTblData) {
          // @ts-ignore
          this.ioCompletionTimesTblData.shadowRoot.querySelector('.table').style.height = `${
            this.parentElement!.clientHeight - 10 - 33
          }px`;
          this.ioCompletionTimesTblData.reMeauseHeight();
        } // @ts-ignore
        this.ioCompletionTimesLoadingPage.style.height = `${this.parentElement!.clientHeight - 24}px`;
      }
    }).observe(this.parentElement!);
  }

  initElements(): void {
    this.ioCompletionTimesLoadingPage = this.shadowRoot?.querySelector('.io-completiontimes-loading');
    this.ioCompletionTimesProgressEL = this.shadowRoot?.querySelector('.io-completion-progress') as LitProgressBar;
    this.ioCompletionTimesTbl = this.shadowRoot?.querySelector<LitTable>('#tbl-io-completion-times');
    this.ioCompletionTimesTblData = this.shadowRoot?.querySelector<LitTable>('#tbr-io-completion-times');
    this.ioCompletionTimesTbl!.addEventListener('row-click', (e) => {
      // @ts-ignore
      let ioCompletionTimeData = e.detail.data as FileSysEvent;
      procedurePool.submitWithName(
        'logic0',
        'fileSystem-queryStack',
        { callchainId: ioCompletionTimeData.callchainId },
        undefined,
        (res: unknown) => {
          // @ts-ignore
          this.ioCompletionTimesTblData!.recycleDataSource = res;
        }
      );
    });
    this.ioCompletionTimesTbl!.addEventListener('column-click', (evt: Event): void => {
      // @ts-ignore
      this.ioCompletionTimesSortKey = evt.detail.key;
      // @ts-ignore
      this.ioCompletionTimesSortType = evt.detail.sort;
      // @ts-ignore
      this.sortioCompletionTimesTable(evt.detail.key, evt.detail.sort);
    });
    this.shadowRoot?.querySelector<TabPaneFilter>('#io-completion-filter')!.getFilterData((data: FilterData): void => {
      let index = parseInt(data.firstSelect || '0');
      if (index > this.defaultNativeTypes.length - 1) {
        this.filterTypeData(this.ioCompletionTimesSelection[index - this.defaultNativeTypes.length]);
      } else {
        this.filterTypeData(undefined);
      }
      this.ioCompletionTimesTbl!.recycleDataSource = this.ioCompletionTimesSource;
    });
  }

  async initFilterTypes(ioCompletionTimeParam: SelectionParam): Promise<void> {
    let filter = this.shadowRoot?.querySelector<TabPaneFilter>('#io-completion-filter');
    let typeKeys = await getTabIoCompletionTimesType(ioCompletionTimeParam.leftNs, ioCompletionTimeParam.rightNs);
    this.defaultNativeTypes = ['All'];
    this.ioCompletionTimesSelection = [];
    typeKeys.forEach((item: string): void => {
      // @ts-ignore
      this.defaultNativeTypes.push(`${item.tier}`);
    });
    this.native_type = [...this.defaultNativeTypes];
    filter!.setSelectList([...this.defaultNativeTypes], null, 'Tier');
    filter!.firstSelect = '0';
  }

  async fromStastics(ioCompletionTimeParam: SelectionParam | unknown): Promise<void> {
    // @ts-ignore
    if (ioCompletionTimeParam.fileSystemIoData === undefined) {
      return;
    }
    this.ioCompletionTimesTblData!.recycleDataSource = [];
    this.ioCompletionTimesTblData?.clearAllSelection(undefined);
    let filter = this.shadowRoot?.querySelector<TabPaneFilter>('#io-completion-filter');
    if (this.currentSelection !== ioCompletionTimeParam) {
      // @ts-ignore
      await this.initFilterTypes(ioCompletionTimeParam);
    } // @ts-ignore
    let typeIndexOf = this.native_type.indexOf(ioCompletionTimeParam.fileSystemIoData.path.value);
    if (typeIndexOf === -1) {
      // @ts-ignore
      this.ioCompletionTimesSelection.push(ioCompletionTimeParam.fileSystemIoData.path); // @ts-ignore
      this.native_type.push(ioCompletionTimeParam.fileSystemIoData.path.value);
      typeIndexOf = this.native_type.length - 1;
    }
    if (this.currentSelection !== ioCompletionTimeParam) {
      // @ts-ignore
      this.currentSelection = ioCompletionTimeParam;
      filter!.setSelectList(this.native_type, null, 'Tier');
      filter!.firstSelect = `${typeIndexOf}`; // @ts-ignore
      this.queryData(ioCompletionTimeParam);
    } else {
      if (typeIndexOf === parseInt(filter!.firstSelect)) {
        return;
      }
      filter!.setSelectList(this.native_type, null, 'Tier');
      filter!.firstSelect = `${typeIndexOf}`; // @ts-ignore
      this.filterTypeData(ioCompletionTimeParam?.fileSystemIoData?.path || undefined); // @ts-ignore
      ioCompletionTimeParam.fileSystemIoData = undefined;
      this.ioCompletionTimesTbl!.recycleDataSource = this.ioCompletionTimesSource;
    }
  }

  queryData(ioCompletionTimeParam: SelectionParam): void {
    this.ioCompletionTimesLoadingList.push(1);
    this.ioCompletionTimesProgressEL!.loading = true; // @ts-ignore
    this.ioCompletionTimesLoadingPage.style.visibility = 'visible';
    this.ioCompletionTimesSource = [];
    this.ioCompletionTimesQueryDataSource = [];
    procedurePool.submitWithName(
      'logic0',
      'fileSystem-queryIOEvents',
      {
        leftNs: ioCompletionTimeParam.leftNs,
        rightNs: ioCompletionTimeParam.rightNs,
        diskIOipids: ioCompletionTimeParam.diskIOipids,
      },
      undefined,
      (res: unknown): void => {
        // @ts-ignore
        this.ioCompletionTimesSource = this.ioCompletionTimesSource.concat(res.data); // @ts-ignore
        this.ioCompletionTimesQueryDataSource = this.ioCompletionTimesQueryDataSource.concat(res.data);
        // @ts-ignore
        this.filterTypeData(ioCompletionTimeParam?.fileSystemIoData?.path || undefined);
        ioCompletionTimeParam.fileSystemIoData = undefined; // @ts-ignore
        res.data = null; // @ts-ignore
        if (!res.isSending) {
          this.ioCompletionTimesTbl!.recycleDataSource = this.ioCompletionTimesSource;
          this.ioCompletionTimesLoadingList.splice(0, 1);
          if (this.ioCompletionTimesLoadingList.length === 0) {
            this.ioCompletionTimesProgressEL!.loading = false; // @ts-ignore
            this.ioCompletionTimesLoadingPage.style.visibility = 'hidden';
          }
        }
      }
    );
  }

  filterTypeData(pathTypeData: unknown): void {
    let filter = this.shadowRoot?.querySelector<TabPaneFilter>('#io-completion-filter');
    let firstSelect = filter!.firstSelect;
    let tier = -1;
    let path = '';
    let pid = -1;
    if (parseInt(firstSelect) <= this.defaultNativeTypes.length - 1) {
      let index = parseInt(firstSelect);
      tier = index === 0 ? -1 : parseInt(this.defaultNativeTypes[index]);
    } else if (pathTypeData !== undefined) {
      // @ts-ignore
      tier = parseInt(pathTypeData.tier); // @ts-ignore
      path = pathTypeData.path || ''; // @ts-ignore
      pid = pathTypeData.pid || -1;
    } else {
      return;
    }
    let isTierFilter = false;
    let isPidFilter = false;
    let isPathFilter = false;
    this.ioCompletionTimesSource = this.ioCompletionTimesQueryDataSource.filter((ioCompletionTimesQueryData) => {
      if (tier === -1) {
        isTierFilter = true;
      } else {
        isTierFilter = ioCompletionTimesQueryData.tier === tier;
      }
      if (pid === -1) {
        isPidFilter = true;
      } else {
        isPidFilter = ioCompletionTimesQueryData.pid === pid;
      }
      isPathFilter = path === '' || ioCompletionTimesQueryData.path === path;
      return isTierFilter && isPidFilter && isPathFilter;
    });
  }

  sortioCompletionTimesTable(ioCompletionTimesKey: string, type: number): void {
    if (type === 0) {
      this.ioCompletionTimesTbl!.recycleDataSource = this.ioCompletionTimesSource;
    } else {
      let arr = Array.from(this.ioCompletionTimesSource);
      this.sortHandle(arr, ioCompletionTimesKey, type);
      this.ioCompletionTimesTbl!.recycleDataSource = arr;
    }
  }

  private sortHandle(arr: IoCompletionTimes[], ioCompletionTimesKey: string, type: number): void {
    arr.sort((ioCompletionTimesA, ioCompletionTimesB): number => {
      if (ioCompletionTimesKey === 'startTsStr') {
        return type === 1
          ? ioCompletionTimesA.startTs - ioCompletionTimesB.startTs
          : ioCompletionTimesB.startTs - ioCompletionTimesA.startTs;
      } else if (ioCompletionTimesKey === 'durStr') {
        return type === 1
          ? ioCompletionTimesA.dur - ioCompletionTimesB.dur
          : ioCompletionTimesB.dur - ioCompletionTimesA.dur;
      } else if (ioCompletionTimesKey === 'process') {
        return this.sortProcessCase(ioCompletionTimesA, ioCompletionTimesB, type);
      } else if (ioCompletionTimesKey === 'durPer4kStr') {
        return type === 1
          ? ioCompletionTimesA.durPer4k - ioCompletionTimesB.durPer4k
          : ioCompletionTimesB.durPer4k - ioCompletionTimesA.durPer4k;
      } else if (ioCompletionTimesKey === 'thread') {
        return this.sortThreadCase(ioCompletionTimesA, ioCompletionTimesB, type);
      } else if (ioCompletionTimesKey === 'operation') {
        return this.sortOperationCase(ioCompletionTimesA, ioCompletionTimesB, type);
      } else if (ioCompletionTimesKey === 'sizeStr') {
        return type === 1
          ? ioCompletionTimesA.size - ioCompletionTimesB.size
          : ioCompletionTimesB.size - ioCompletionTimesA.size;
      } else if (ioCompletionTimesKey === 'tier') {
        return type === 1
          ? ioCompletionTimesA.tier - ioCompletionTimesB.tier
          : ioCompletionTimesB.tier - ioCompletionTimesA.tier;
      } else {
        return 0;
      }
    });
  }

  private sortOperationCase(
    ioCompletionTimesA: IoCompletionTimes,
    ioCompletionTimesB: IoCompletionTimes,
    type: number
  ): number {
    if (ioCompletionTimesA.operation > ioCompletionTimesB.operation) {
      return type === 2 ? 1 : -1;
    } else if (ioCompletionTimesA.operation === ioCompletionTimesB.operation) {
      return 0;
    } else {
      return type === 2 ? -1 : 1;
    }
  }

  private sortThreadCase(
    ioCompletionTimesA: IoCompletionTimes,
    ioCompletionTimesB: IoCompletionTimes,
    type: number
  ): number {
    if (ioCompletionTimesA.thread > ioCompletionTimesB.thread) {
      return type === 2 ? 1 : -1;
    } else if (ioCompletionTimesA.thread === ioCompletionTimesB.thread) {
      return 0;
    } else {
      return type === 2 ? -1 : 1;
    }
  }

  private sortProcessCase(
    ioCompletionTimesA: IoCompletionTimes,
    ioCompletionTimesB: IoCompletionTimes,
    type: number
  ): number {
    if (ioCompletionTimesA.process > ioCompletionTimesB.process) {
      return type === 2 ? 1 : -1;
    } else if (ioCompletionTimesA.process === ioCompletionTimesB.process) {
      return 0;
    } else {
      return type === 2 ? -1 : 1;
    }
  }

  initHtml(): string {
    return TabPaneIoCompletionTimesHtml;
  }
}
