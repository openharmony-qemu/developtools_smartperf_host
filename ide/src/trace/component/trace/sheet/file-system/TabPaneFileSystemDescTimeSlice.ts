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
import { FileSysEvent } from '../../../../database/logic-worker/ProcedureLogicWorkerFileSystem';
import { procedurePool } from '../../../../database/Procedure';
import { TabPaneFileSystemDescTimeSliceHtml } from './TabPaneFileSystemDescTimeSlice.html';

@element('tabpane-filesystem-desc-time-slice')
export class TabPaneFileSystemDescTimeSlice extends BaseElement {
  private fsDescTimeSliceTbl: LitTable | null | undefined;
  private fsDescTimeSliceTblData: LitTable | null | undefined;
  private fsDescTimeSliceProgressEL: LitProgressBar | null | undefined;
  private fsDescTimeSliceLoadingList: number[] = [];
  private fsDescTimeSliceLoadingPage: unknown;
  private fsDescTimeSliceSource: Array<FileSysEvent> = [];
  private fsDescTimeSliceSortKey: string = 'startTs';
  private fsDescTimeSliceSortType: number = 0;
  private currentSelection: SelectionParam | undefined | null;

  set data(fsDescTimeSliceSelection: SelectionParam | null | undefined) {
    if (fsDescTimeSliceSelection === this.currentSelection) {
      return;
    }
    this.currentSelection = fsDescTimeSliceSelection;
    if (this.fsDescTimeSliceTbl) {
      // @ts-ignore
      this.fsDescTimeSliceTbl.shadowRoot.querySelector('.table').style.height = `${
        this.parentElement!.clientHeight - 20 - 31
      }px`;
    }
    if (this.fsDescTimeSliceTblData) {
      // @ts-ignore
      this.fsDescTimeSliceTblData.shadowRoot.querySelector('.table').style.height = `${
        this.parentElement!.clientHeight - 20 - 31
      }px`;
    }
    this.fsDescTimeSliceTbl!.recycleDataSource = [];
    this.fsDescTimeSliceTblData!.recycleDataSource = [];
    if (fsDescTimeSliceSelection) {
      this.fsDescTimeSliceLoadingList.push(1);
      this.fsDescTimeSliceProgressEL!.loading = true; // @ts-ignore
      this.fsDescTimeSliceLoadingPage.style.visibility = 'visible'; // @ts-ignore
      let startNs = (window as unknown).recordStartNS ?? 0;
      this.fsDescTimeSliceSource = [];
      procedurePool.submitWithName(
        'logic0',
        'fileSystem-queryFileSysEvents',
        {
          leftNs: startNs + fsDescTimeSliceSelection.leftNs,
          rightNs: startNs + fsDescTimeSliceSelection.rightNs,
          typeArr: [0],
          tab: 'time-slice',
        },
        undefined,
        (res: unknown): void => {
          // @ts-ignore
          this.fsDescTimeSliceSource = this.fsDescTimeSliceSource.concat(res.data); // @ts-ignore
          res.data = null; // @ts-ignore
          if (!res.isSending) {
            this.fsDescTimeSliceTbl!.recycleDataSource = this.fsDescTimeSliceSource;
            this.fsDescTimeSliceLoadingList.splice(0, 1);
            if (this.fsDescTimeSliceLoadingList.length === 0) {
              this.fsDescTimeSliceProgressEL!.loading = false; // @ts-ignore
              this.fsDescTimeSliceLoadingPage.style.visibility = 'hidden';
            }
          }
        }
      );
    }
  }

  initElements(): void {
    this.fsDescTimeSliceLoadingPage = this.shadowRoot?.querySelector('.loading');
    this.fsDescTimeSliceProgressEL = this.shadowRoot?.querySelector('.fs-slice-progress') as LitProgressBar;
    this.fsDescTimeSliceTbl = this.shadowRoot?.querySelector<LitTable>('#tbl-filesystem-desc-time-slice');
    this.fsDescTimeSliceTblData = this.shadowRoot?.querySelector<LitTable>('#tbr-filesystem-desc-time-slice');
    this.fsDescTimeSliceTbl!.addEventListener('row-click', (fsTimeSliceRowClickEvent): void => {
      // @ts-ignore
      let data = fsTimeSliceRowClickEvent.detail.data as FileSysEvent; // @ts-ignore
      (data as unknown).isSelected = true;
      // @ts-ignore
      if ((fsTimeSliceRowClickEvent.detail as unknown).callBack) {
        // @ts-ignore
        (fsTimeSliceRowClickEvent.detail as unknown).callBack(true);
      }
      procedurePool.submitWithName(
        'logic0',
        'fileSystem-queryStack',
        { callchainId: data.callchainId },
        undefined,
        (res: unknown): void => {
          // @ts-ignore
          this.fsDescTimeSliceTblData!.recycleDataSource = res;
        }
      );
    });
    this.fsDescTimeSliceTbl!.addEventListener('column-click', (evt): void => {
      // @ts-ignore
      this.fsDescTimeSliceSortKey = evt.detail.key;
      // @ts-ignore
      this.fsDescTimeSliceSortType = evt.detail.sort;
      // @ts-ignore
      this.sortFsDescTimeSliceTable(evt.detail.key, evt.detail.sort);
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    new ResizeObserver((): void => {
      if (this.parentElement?.clientHeight !== 0) {
        if (this.fsDescTimeSliceTbl) {
          // @ts-ignore
          this.fsDescTimeSliceTbl.shadowRoot.querySelector('.table').style.height = `${
            this.parentElement!.clientHeight - 10 - 31
          }px`;
          this.fsDescTimeSliceTbl.reMeauseHeight();
        }
        if (this.fsDescTimeSliceTblData) {
          // @ts-ignore
          this.fsDescTimeSliceTblData.shadowRoot.querySelector('.table').style.height = `${
            this.parentElement!.clientHeight - 10 - 31
          }px`;
          this.fsDescTimeSliceTblData.reMeauseHeight(); // @ts-ignore
          this.fsDescTimeSliceLoadingPage.style.height = `${this.parentElement!.clientHeight - 24}px`;
        }
      }
    }).observe(this.parentElement!);
  }

  sortFsDescTimeSliceTable(key: string, type: number): void {
    if (type === 0) {
      this.fsDescTimeSliceTbl!.recycleDataSource = this.fsDescTimeSliceSource;
    } else {
      let arr = Array.from(this.fsDescTimeSliceSource);
      arr.sort((fsTimeSliceA, fsTimeSliceB): number => {
        if (key === 'startTsStr') {
          if (type === 1) {
            return fsTimeSliceA.startTs - fsTimeSliceB.startTs;
          } else {
            return fsTimeSliceB.startTs - fsTimeSliceA.startTs;
          }
        } else if (key === 'durStr') {
          if (type === 1) {
            return fsTimeSliceA.dur - fsTimeSliceB.dur;
          } else {
            return fsTimeSliceB.dur - fsTimeSliceA.dur;
          }
        } else if (key === 'process') {
          if (fsTimeSliceA.process > fsTimeSliceB.process) {
            return type === 2 ? 1 : -1;
          } else if (fsTimeSliceA.process === fsTimeSliceB.process) {
            return 0;
          } else {
            return type === 2 ? -1 : 1;
          }
        } else if (key === 'fd') {
          if (type === 1) {
            return fsTimeSliceA.fd - fsTimeSliceB.fd;
          } else {
            return fsTimeSliceB.fd - fsTimeSliceA.fd;
          }
        } else {
          return 0;
        }
      });
      this.fsDescTimeSliceTbl!.recycleDataSource = arr;
    }
  }

  initHtml(): string {
    return TabPaneFileSystemDescTimeSliceHtml;
  }
}
