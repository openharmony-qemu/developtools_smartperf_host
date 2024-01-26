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
import { FilterData, TabPaneFilter } from '../TabPaneFilter';
import { FileSysEvent } from '../../../../database/logic-worker/ProcedureLogicWorkerFileSystem';
import { procedurePool } from '../../../../database/Procedure';
import { TabPaneFileSystemDescHistoryHtml } from './TabPaneFileSystemDescHistory.html';

@element('tabpane-filesystem-desc-history')
export class TabPaneFileSystemDescHistory extends BaseElement {
  private fsDescHistoryTbl: LitTable | null | undefined;
  private fsDescHistoryTblData: LitTable | null | undefined;
  private fsDescHistoryFilter: TabPaneFilter | null | undefined;
  private fsDescHistoryProgressEL: LitProgressBar | null | undefined;
  private fsDescHistoryLoadingList: number[] = [];
  private fsDescHistoryLoadingPage: any;
  private fsDescHistorySource: Array<FileSysEvent> = [];
  private fsDescHistoryFilterSource: Array<FileSysEvent> = [];
  private fsDescHistorySortKey: string = 'startTs';
  private fsDescHistorySortType: number = 0;
  private filterEventType: string = '0';
  private filterProcess: string = '0';
  private filterPath: string = '0';
  private currentSelection: SelectionParam | undefined | null;
  private eventList: string[] | null | undefined;
  private processList: string[] | null | undefined;
  private pathList: string[] | null | undefined;

  set data(fsDescHistorySelection: SelectionParam | null | undefined) {
    if (fsDescHistorySelection == this.currentSelection) {
      return;
    }
    this.currentSelection = fsDescHistorySelection;
    if (this.fsDescHistoryTbl) {
      // @ts-ignore
      this.fsDescHistoryTbl.shadowRoot.querySelector('.table').style.height =
        this.parentElement!.clientHeight - 20 - 31 + 'px';
      this.fsDescHistoryTbl.recycleDataSource = [];
    }
    if (this.fsDescHistoryTblData) {
      // @ts-ignore
      this.fsDescHistoryTblData.shadowRoot.querySelector('.table').style.height =
        this.parentElement!.clientHeight - 20 - 31 + 'px';
      this.fsDescHistoryTblData.recycleDataSource = [];
    }
    if (fsDescHistorySelection) {
      this.fsDescHistoryLoadingList.push(1);
      this.fsDescHistoryProgressEL!.loading = true;
      this.fsDescHistoryLoadingPage.style.visibility = 'visible';
      this.fsDescHistorySource = [];
      procedurePool.submitWithName(
        'logic0',
        'fileSystem-queryFileSysEvents',
        {
          leftNs: fsDescHistorySelection.leftNs,
          rightNs: fsDescHistorySelection.rightNs,
          typeArr: [0, 1],
          tab: 'history',
        },
        undefined,
        (res: any) => {
          this.fsDescHistorySource = this.fsDescHistorySource.concat(res.data);
          res.data = null;
          if (!res.isSending) {
            this.fsDescHistoryTbl!.recycleDataSource = this.fsDescHistorySource;
            this.fsDescHistoryFilterSource = this.fsDescHistorySource;
            this.setProcessFilter();
            this.fsDescHistoryLoadingList.splice(0, 1);
            if (this.fsDescHistoryLoadingList.length == 0) {
              this.fsDescHistoryProgressEL!.loading = false;
              this.fsDescHistoryLoadingPage.style.visibility = 'hidden';
            }
          }
        }
      );
    }
  }

  setProcessFilter() {
    this.processList = ['All Process'];
    this.pathList = ['All Path'];
    this.fsDescHistorySource.map((historyItem) => {
      if (this.processList!.findIndex((processItem) => processItem === historyItem.process) == -1) {
        this.processList!.push(historyItem.process);
      }
      if (this.pathList!.findIndex((pathItem) => pathItem === historyItem.path) == -1) {
        this.pathList!.push(historyItem.path);
      }
    });
    this.fsDescHistoryFilter!.setSelectList(this.eventList, this.processList, '', '', this.pathList, '');
    this.fsDescHistoryFilter!.firstSelect = '0';
    this.fsDescHistoryFilter!.secondSelect = '0';
    this.fsDescHistoryFilter!.thirdSelect = '0';
    this.filterProcess = '0';
    this.filterPath = '0';
    this.filterEventType = '0';
  }

  filterData() {
    let pfv = parseInt(this.filterProcess);
    let pathIndex = parseInt(this.filterPath);
    this.fsDescHistoryFilterSource = this.fsDescHistorySource.filter((fsHistoryEvent) => {
      let pathFilter = true;
      let eventFilter = true;
      let processFilter = true;
      if (this.filterPath != '0') {
        pathFilter = fsHistoryEvent.path == this.pathList![pathIndex];
      }
      if (this.filterEventType == '1') {
        eventFilter = fsHistoryEvent.type == 0;
      } else if (this.filterEventType == '2') {
        eventFilter = fsHistoryEvent.type == 1;
      }
      if (this.filterProcess != '0') {
        processFilter = fsHistoryEvent.process == this.processList![pfv];
      }
      return pathFilter && eventFilter && processFilter;
    });
    this.fsDescHistoryTblData!.recycleDataSource = [];
    this.sortFsDescHistoryTable(this.fsDescHistorySortKey, this.fsDescHistorySortType);
  }

  initElements(): void {
    this.fsDescHistoryLoadingPage = this.shadowRoot?.querySelector('.filesystem-desc-history-loading');
    this.fsDescHistoryProgressEL = this.shadowRoot?.querySelector(
      '.filesystem-desc-history-progress'
    ) as LitProgressBar;
    this.fsDescHistoryTbl = this.shadowRoot?.querySelector<LitTable>('#tbl-file-system-desc-history');
    this.fsDescHistoryTblData = this.shadowRoot?.querySelector<LitTable>('#tbr-file-system-desc-history');
    this.fsDescHistoryTbl!.addEventListener('row-click', (e) => {
      // @ts-ignore
      let data = e.detail.data as FileSysEvent;
      (data as any).isSelected = true;
      // @ts-ignore
      if ((e.detail as any).callBack) {
        // @ts-ignore
        (e.detail as any).callBack(true);
      }
      procedurePool.submitWithName(
        'logic0',
        'fileSystem-queryStack',
        { callchainId: data.callchainId },
        undefined,
        (res: any) => {
          this.fsDescHistoryTblData!.recycleDataSource = res;
        }
      );
    });
    this.fsDescHistoryTbl!.addEventListener('column-click', (evt) => {
      // @ts-ignore
      this.fsDescHistorySortKey = evt.detail.key;
      // @ts-ignore
      this.fsDescHistorySortType = evt.detail.sort;
      // @ts-ignore
      this.sortFsDescHistoryTable(evt.detail.key, evt.detail.sort);
    });
    this.fsDescHistoryFilter = this.shadowRoot?.querySelector<TabPaneFilter>('#filesystem-desc-history-filter');
    this.eventList = ['All FD Event', 'All Open Event', 'All Close Event'];
    this.processList = ['All Process'];
    this.pathList = ['All Path'];
    this.fsDescHistoryFilter!.setSelectList(this.eventList, this.processList, '', '', this.pathList, '');
    this.fsDescHistoryFilter!.firstSelect = '0';
    this.fsDescHistoryFilter!.getFilterData((data: FilterData) => {
      this.filterEventType = data.firstSelect || '0';
      this.filterProcess = data.secondSelect || '0';
      this.filterPath = data.thirdSelect || '0';
      this.filterData();
    });
  }

  connectedCallback() {
    super.connectedCallback();
    new ResizeObserver((entries) => {
      if (this.parentElement?.clientHeight != 0) {
        if (this.fsDescHistoryTbl) {
          // @ts-ignore
          this.fsDescHistoryTbl.shadowRoot.querySelector('.table').style.height =
            this.parentElement!.clientHeight - 10 - 31 + 'px';
          this.fsDescHistoryTbl.reMeauseHeight();
        }
        if (this.fsDescHistoryTblData) {
          // @ts-ignore
          this.fsDescHistoryTblData.shadowRoot.querySelector('.table').style.height =
            this.parentElement!.clientHeight - 10 - 31 + 'px';
          this.fsDescHistoryTblData.reMeauseHeight();
        }
        this.fsDescHistoryLoadingPage.style.height = this.parentElement!.clientHeight - 24 + 'px';
      }
    }).observe(this.parentElement!);
  }

  sortFsDescHistoryTable(key: string, type: number): void {
    if (type == 0) {
      this.fsDescHistoryTbl!.recycleDataSource = this.fsDescHistoryFilterSource;
    } else {
      let arr = Array.from(this.fsDescHistoryFilterSource);
      arr.sort((fsHistoryA, fsHistoryB): number => {
        if (key == 'startTsStr') {
          return this.compareStartTs(fsHistoryA, fsHistoryB, type);
        } else if (key == 'durStr') {
          return this.compareDur(fsHistoryA, fsHistoryB, type);
        } else if (key == 'process') {
          return this.compareProcess(fsHistoryA, fsHistoryB, type);
        } else if (key == 'typeStr') {
          return this.compareTypeStr(fsHistoryA, fsHistoryB, type);
        } else if (key == 'fd') {
          return this.compareFd(fsHistoryA, fsHistoryB, type);
        } else {
          return 0;
        }
      });
      this.fsDescHistoryTbl!.recycleDataSource = arr;
    }
  }

  compareStartTs(fsHistoryA: any, fsHistoryB: any, type: number): number {
    if (type == 1) {
      return fsHistoryA.startTs - fsHistoryB.startTs;
    } else {
      return fsHistoryB.startTs - fsHistoryA.startTs;
    }
  }

  compareDur(fsHistoryA: any, fsHistoryB: any, type: number): number {
    if (type == 1) {
      return fsHistoryA.dur - fsHistoryB.dur;
    } else {
      return fsHistoryB.dur - fsHistoryA.dur;
    }
  }

  compareProcess(fsHistoryA: any, fsHistoryB: any, type: number): number {
    if (fsHistoryA.process > fsHistoryB.process) {
      return type === 2 ? 1 : -1;
    } else if (fsHistoryA.process == fsHistoryB.process) {
      return 0;
    } else {
      return type === 2 ? -1 : 1;
    }
  }

  compareTypeStr(fsHistoryA: any, fsHistoryB: any, type: number): number {
    if (fsHistoryA.typeStr > fsHistoryB.typeStr) {
      return type === 2 ? 1 : -1;
    } else if (fsHistoryA.typeStr == fsHistoryB.typeStr) {
      return 0;
    } else {
      return type === 2 ? -1 : 1;
    }
  }

  compareFd(fsHistoryA: any, fsHistoryB: any, type: number): number {
    if (type == 1) {
      return fsHistoryA.fd - fsHistoryB.fd;
    } else {
      return fsHistoryB.fd - fsHistoryA.fd;
    }
  }

  initHtml(): string {
    return TabPaneFileSystemDescHistoryHtml;
  }
}
