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
import { FileSysEvent } from '../../../../database/logic-worker/ProcedureLogicWorkerFileSystem';
import { FilterData, TabPaneFilter } from '../TabPaneFilter';
import '../TabPaneFilter';
import { TabPaneFileSystemEventsHtml } from './TabPaneFileSystemEvents.html';

@element('tabpane-filesystem-event')
export class TabPaneFileSystemEvents extends BaseElement {
  private fsSysEventTbl: LitTable | null | undefined;
  private fsSysEventTblData: LitTable | null | undefined;
  private fsSysEventProgressEL: LitProgressBar | null | undefined;
  private fsSysEventFilter: TabPaneFilter | null | undefined;
  private fsSysEventLoadingList: number[] = [];
  private loadingPage: unknown;
  private fsSysEventSource: Array<FileSysEvent> = [];
  private fsSysEventFilterSource: Array<FileSysEvent> = [];
  private fsSysEventSortKey: string = 'startTs';
  private fsSysEventSortType: number = 0;
  private currentSelection: SelectionParam | undefined | null;
  private filterEventType: string = '0';
  private filterProcess: string = '0';
  private filterPath: string = '0';
  private eventList: string[] | null | undefined;
  private processList: string[] | null | undefined;
  private pathList: string[] | null | undefined;

  set data(fsSysEventSelection: SelectionParam | null | undefined) {
    if (fsSysEventSelection === this.currentSelection) {
      return;
    }
    this.currentSelection = fsSysEventSelection;
    if (this.fsSysEventTbl) {
      // @ts-ignore
      this.fsSysEventTbl.shadowRoot.querySelector('.table').style.height = `${
        this.parentElement!.clientHeight - 20 - 31
      }px`;
    }
    if (this.fsSysEventTblData) {
      // @ts-ignore
      this.fsSysEventTblData.shadowRoot.querySelector('.table').style.height = `${
        this.parentElement!.clientHeight - 20 - 31
      }px`;
    }
    this.filterEventType = '0';
    this.filterProcess = '0';
    this.queryData(fsSysEventSelection);
  }

  queryData(fsEventParam: SelectionParam | null | undefined): void {
    this.fsSysEventTbl!.recycleDataSource = [];
    this.fsSysEventTblData!.recycleDataSource = [];
    if (fsEventParam) {
      this.fsSysEventLoadingList.push(1);
      this.fsSysEventProgressEL!.loading = true; // @ts-ignore
      this.loadingPage.style.visibility = 'visible';
      this.fsSysEventSource = [];
      procedurePool.submitWithName(
        'logic0',
        'fileSystem-queryFileSysEvents',
        {
          leftNs: fsEventParam.leftNs,
          rightNs: fsEventParam.rightNs,
          typeArr: fsEventParam.fileSystemType,
          tab: 'events',
        },
        undefined,
        (res: unknown) => {
          // @ts-ignore
          this.fsSysEventSource = this.fsSysEventSource.concat(res.data); // @ts-ignore
          res.data = null; // @ts-ignore
          if (!res.isSending) {
            this.setProcessFilter();
            this.filterData();
            this.fsSysEventLoadingList.splice(0, 1);
            if (this.fsSysEventLoadingList.length === 0) {
              this.fsSysEventProgressEL!.loading = false; // @ts-ignore
              this.loadingPage.style.visibility = 'hidden';
            }
          }
        }
      );
    }
  }

  setProcessFilter(): void {
    this.processList = ['All Process'];
    this.pathList = ['All Path'];
    this.fsSysEventSource.map((it): void => {
      if (this.processList!.findIndex((a): boolean => a === it.process) === -1) {
        this.processList!.push(it.process);
      }
      if (this.pathList!.findIndex((a): boolean => a === it.path) === -1) {
        this.pathList!.push(it.path);
      }
    });
    this.fsSysEventFilter!.setSelectList(this.eventList, this.processList, '', '', this.pathList, '');
    if (this.filterProcess === '-1') {
      this.filterProcess = `${this.processList.indexOf(
        // @ts-ignore
        `${this.currentSelection?.fileSystemFsData.name}[${this.currentSelection?.fileSystemFsData.pid}]`
      )}`;
    }
    this.fsSysEventFilter!.firstSelect = this.filterEventType;
    this.fsSysEventFilter!.secondSelect = this.filterProcess;
    this.fsSysEventFilter!.thirdSelect = this.filterPath;
  }

  filterData(): void {
    let pfv = parseInt(this.filterProcess);
    let pathIndex = parseInt(this.filterPath);
    let eventType = parseInt(this.filterEventType) - 1;
    this.fsSysEventFilterSource = this.fsSysEventSource.filter((fsEvent: FileSysEvent) => {
      let pathFilter = true;
      let eventFilter = fsEvent.type === eventType || eventType === -1;
      let processFilter = true;
      if (this.filterPath !== '0') {
        pathFilter = fsEvent.path === this.pathList![pathIndex];
      }
      if (this.filterProcess !== '0') {
        processFilter = fsEvent.process === this.processList![pfv];
      }
      return pathFilter && eventFilter && processFilter;
    });
    this.fsSysEventTblData!.recycleDataSource = [];
    this.sortFsSysEventTable(this.fsSysEventSortKey, this.fsSysEventSortType);
  }

  initElements(): void {
    this.loadingPage = this.shadowRoot?.querySelector('.loading');
    this.fsSysEventProgressEL = this.shadowRoot?.querySelector('.fs-event-progress') as LitProgressBar;
    this.fsSysEventTbl = this.shadowRoot?.querySelector<LitTable>('#tbl-filesystem-event');
    this.fsSysEventTblData = this.shadowRoot?.querySelector<LitTable>('#tbr-filesystem-event');
    this.fsSysEventTbl!.addEventListener('row-click', (fsEventRowClick): void => {
      // @ts-ignore
      let data = fsEventRowClick.detail.data as FileSysEvent; // @ts-ignore
      (data as unknown).isSelected = true;
      // @ts-ignore
      if ((fsEventRowClick.detail as unknown).callBack) {
        // @ts-ignore
        (fsEventRowClick.detail as unknown).callBack(true);
      }
      procedurePool.submitWithName(
        'logic0',
        'fileSystem-queryStack',
        { callchainId: data.callchainId },
        undefined,
        (res: unknown) => {
          // @ts-ignore
          this.fsSysEventTblData!.recycleDataSource = res;
        }
      );
    });
    this.fsSysEventTbl!.addEventListener('column-click', (evt): void => {
      // @ts-ignore
      this.fsSysEventSortKey = evt.detail.key;
      // @ts-ignore
      this.fsSysEventSortType = evt.detail.sort;
      // @ts-ignore
      this.sortFsSysEventTable(evt.detail.key, evt.detail.sort);
    });
    this.fsSysEventFilter = this.shadowRoot?.querySelector<TabPaneFilter>('#fs-event-filter');
    this.eventList = ['All Event', 'All Open Event', 'All Close Event', 'All Read Event', 'All Write Event'];
    this.processList = ['All Process'];
    this.pathList = ['All Path'];
    this.fsSysEventFilter!.setSelectList(this.eventList, this.processList, '', '', this.pathList, '');
    this.fsSysEventFilter!.firstSelect = '0';
    this.fsSysEventFilter!.getFilterData((data: FilterData): void => {
      this.filterEventType = data.firstSelect || '0';
      this.filterProcess = data.secondSelect || '0';
      this.filterPath = data.thirdSelect || '0';
      this.filterData();
    });
  }

  fromStastics(val: SelectionParam | unknown): void {
    // @ts-ignore
    if (val.fileSystemFsData === undefined) {
      return;
    } // @ts-ignore
    if (val.fileSystemFsData.title === 'All') {
      this.filterEventType = '0';
      this.filterProcess = '0'; // @ts-ignore
    } else if (val.fileSystemFsData.pid === undefined) {
      // @ts-ignore
      this.filterEventType = `${val.fileSystemFsData.type + 1}`;
      this.filterProcess = '0';
    } else {
      // @ts-ignore
      this.filterEventType = `${val.fileSystemFsData.type + 1}`;
      this.filterProcess = '-1';
    }
    this.filterPath = '0';
    if (this.currentSelection === val) {
      if (this.filterProcess === '-1') {
        this.filterProcess =
          // @ts-ignore
          `${this.processList?.indexOf(`${val.fileSystemFsData.name}[${val.fileSystemFsData.pid}]`)}`;
      }
      this.fsSysEventFilter!.firstSelect = this.filterEventType;
      this.fsSysEventFilter!.secondSelect = this.filterProcess;
      this.fsSysEventFilter!.thirdSelect = this.filterPath;
      this.filterData();
    } else {
      // @ts-ignore
      this.currentSelection = val; // @ts-ignore
      this.queryData(val);
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    new ResizeObserver((): void => {
      if (this.parentElement?.clientHeight !== 0) {
        if (this.fsSysEventTbl) {
          // @ts-ignore
          this.fsSysEventTbl.shadowRoot.querySelector('.table').style.height = `${
            this.parentElement!.clientHeight - 10 - 33
          }px`;
          this.fsSysEventTbl.reMeauseHeight();
        }
        if (this.fsSysEventTblData) {
          // @ts-ignore
          this.fsSysEventTblData.shadowRoot.querySelector('.table').style.height = `${
            this.parentElement!.clientHeight - 10 - 33
          }px`;
          this.fsSysEventTblData.reMeauseHeight();
        } // @ts-ignore
        this.loadingPage.style.height = `${this.parentElement!.clientHeight - 24}px`;
      }
    }).observe(this.parentElement!);
  }

  sortFsSysEventTable(key: string, type: number): void {
    if (type === 0) {
      this.fsSysEventTbl!.recycleDataSource = this.fsSysEventFilterSource;
    } else {
      let arr = Array.from(this.fsSysEventFilterSource);
      arr.sort((fsEventA, fsEventB): number => {
        if (key === 'startTsStr') {
          return type === 1 ? fsEventA.startTs - fsEventB.startTs : fsEventB.startTs - fsEventA.startTs;
        } else if (key === 'durStr') {
          return type === 1 ? fsEventA.dur - fsEventB.dur : fsEventB.dur - fsEventA.dur;
        } else if (key === 'process') {
          return this.sortProcessCase(fsEventA, fsEventB, type);
        } else if (key === 'thread') {
          return this.sortThreadCase(fsEventA, fsEventB, type);
        } else if (key === 'typeStr') {
          return this.sortTypeCase(fsEventA, fsEventB, type);
        } else if (key === 'fd') {
          return type === 1 ? (fsEventA.fd || 0) - (fsEventB.fd || 0) : (fsEventB.fd || 0) - (fsEventA.fd || 0);
        } else if (key === 'path') {
          return this.sortPathCase(fsEventA, fsEventB, type);
        } else {
          return 0;
        }
      });
      this.fsSysEventTbl!.recycleDataSource = arr;
    }
  }

  private sortPathCase(fsEventA: FileSysEvent, fsEventB: FileSysEvent, type: number): number {
    if (fsEventA.path > fsEventB.path) {
      return type === 2 ? 1 : -1;
    } else if (fsEventA.path === fsEventB.path) {
      return 0;
    } else {
      return type === 2 ? -1 : 1;
    }
  }

  private sortTypeCase(fsEventA: FileSysEvent, fsEventB: FileSysEvent, type: number): number {
    if (fsEventA.typeStr > fsEventB.typeStr) {
      return type === 2 ? 1 : -1;
    } else if (fsEventA.typeStr === fsEventB.typeStr) {
      return 0;
    } else {
      return type === 2 ? -1 : 1;
    }
  }

  private sortThreadCase(fsEventA: FileSysEvent, fsEventB: FileSysEvent, type: number): number {
    if (fsEventA.thread > fsEventB.thread) {
      return type === 2 ? 1 : -1;
    } else if (fsEventA.thread === fsEventB.thread) {
      return 0;
    } else {
      return type === 2 ? -1 : 1;
    }
  }

  private sortProcessCase(fsEventA: FileSysEvent, fsEventB: FileSysEvent, type: number): number {
    if (fsEventA.process > fsEventB.process) {
      return type === 2 ? 1 : -1;
    } else if (fsEventA.process === fsEventB.process) {
      return 0;
    } else {
      return type === 2 ? -1 : 1;
    }
  }

  initHtml(): string {
    return TabPaneFileSystemEventsHtml;
  }
}
