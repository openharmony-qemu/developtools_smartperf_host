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
import { LitTable, RedrawTreeForm } from '../../../../../base-ui/table/lit-table';
import { SelectionParam } from '../../../../bean/BoxSelection';
import { Utils } from '../../base/Utils';
import { LitProgressBar } from '../../../../../base-ui/progress-bar/LitProgressBar';
import { getTabPaneFilesystemStatistics } from '../../../../database/sql/SqlLite.sql';

@element('tabpane-file-statistics')
export class TabPaneFileStatistics extends BaseElement {
  private fileStatisticsTbl: LitTable | null | undefined;
  private selectionParam: SelectionParam | null | undefined;
  private fileStatisticsProgressEL: LitProgressBar | null | undefined;
  private fileStatisticsLoadingPage: unknown;
  private fileStatisticsLoadingList: number[] = [];
  private fileStatisticsSource: Array<unknown> = [];
  private typeList: Array<string> = ['OPEN', 'CLOSE', 'READ', 'WRITE'];
  private fileStatisticsSortKey: string = '';
  private fileStatisticsSortType: number = 0;

  set data(fileStatisticsSelection: SelectionParam | unknown) {
    if (fileStatisticsSelection === this.selectionParam) {
      return;
    }
    this.fileStatisticsProgressEL!.loading = true; // @ts-ignore
    this.fileStatisticsLoadingPage.style.visibility = 'visible'; // @ts-ignore
    this.selectionParam = fileStatisticsSelection;
    // @ts-ignore
    this.fileStatisticsTbl!.shadowRoot!.querySelector('.table').style.height = `${this.parentElement!.clientHeight - 25
      }px`;
    this.queryDataByDB(fileStatisticsSelection);
  }

  initElements(): void {
    this.fileStatisticsProgressEL = this.shadowRoot!.querySelector<LitProgressBar>('.file-statistics-progress');
    this.fileStatisticsLoadingPage = this.shadowRoot!.querySelector('.file-statistics-loading');
    this.fileStatisticsTbl = this.shadowRoot!.querySelector<LitTable>('#tb-file-statistics');
    this.fileStatisticsTbl!.addEventListener('column-click', (evt: Event): void => {
      // @ts-ignore
      this.fileStatisticsSortKey = evt.detail.key;
      // @ts-ignore
      this.fileStatisticsSortType = evt.detail.sort;
      if (this.fileStatisticsSortType !== 0 && this.fileStatisticsSource.length > 0) {
        this.sortTable(this.fileStatisticsSource[0], this.fileStatisticsSortKey);
      }
      this.fileStatisticsTbl!.recycleDataSource = this.fileStatisticsSource;
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    new ResizeObserver((): void => {
      if (this.parentElement!.clientHeight !== 0) {
        // @ts-ignore
        this.fileStatisticsTbl!.shadowRoot!.querySelector('.table').style.height = `${this.parentElement!.clientHeight - 25
          }px`;
        this.fileStatisticsTbl!.reMeauseHeight(); // @ts-ignore
        this.fileStatisticsLoadingPage.style.height = `${this.parentElement!.clientHeight - 24}px`;
      }
    }).observe(this.parentElement!);
  }

  getInitData(item: unknown): unknown {
    return {
      // @ts-ignore
      ...item, // @ts-ignore
      title: `${item.name}(${item.pid})`, // @ts-ignore
      logicalWrites: Utils.getBinaryByteWithUnit(item.logicalWrites), // @ts-ignore
      logicalReads: Utils.getBinaryByteWithUnit(item.logicalReads), // @ts-ignore
      otherFile: Utils.getBinaryByteWithUnit(item.otherFile), // @ts-ignore
      allDuration: Utils.getProbablyTime(item.allDuration), // @ts-ignore
      minDuration: Utils.getProbablyTime(item.minDuration), // @ts-ignore
      maxDuration: Utils.getProbablyTime(item.maxDuration), // @ts-ignore
      avgDuration: Utils.getProbablyTime(item.avgDuration), // @ts-ignore
      node: { ...item, children: [] },
    };
  }

  queryDataByDB(val: SelectionParam | unknown): void {
    this.fileStatisticsLoadingList.push(1);
    this.fileStatisticsProgressEL!.loading = true; // @ts-ignore
    this.fileStatisticsLoadingPage.style.visibility = 'visible';
    getTabPaneFilesystemStatistics(
      // @ts-ignore
      val.leftNs + val.recordStartNs, // @ts-ignore
      val.rightNs + val.recordStartNs, // @ts-ignore
      val.fileSystemType
    ).then((result): void => {
      this.fileStatisticsLoadingList.splice(0, 1);
      if (this.fileStatisticsLoadingList.length === 0) {
        this.fileStatisticsProgressEL!.loading = false; // @ts-ignore
        this.fileStatisticsLoadingPage.style.visibility = 'hidden';
      }
      let fileStatisticsFatherMap = new Map<unknown, unknown>();
      let fileStatisticsAllNode: unknown = {
        title: 'All',
        count: 0,
        logicalReads: 0,
        logicalWrites: 0,
        otherFile: 0,
        allDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        avgDuration: '',
        children: [],
      };
      this.handleResult(result, fileStatisticsFatherMap, fileStatisticsAllNode);
      fileStatisticsFatherMap.forEach((item): void => {
        // @ts-ignore
        item.avgDuration = item.allDuration / item.count;
        let node = this.getInitData(item); // @ts-ignore
        if (item.type < 4) {
          // @ts-ignore
          node.title = this.typeList[item.type];
        } else {
          // @ts-ignore
          node.title = item.type;
        } // @ts-ignore
        fileStatisticsAllNode.children.push(node);
      }); // @ts-ignore
      fileStatisticsAllNode.avgDuration = fileStatisticsAllNode.allDuration / fileStatisticsAllNode.count;
      fileStatisticsAllNode = this.getInitData(fileStatisticsAllNode); // @ts-ignore
      fileStatisticsAllNode.title = 'All';
      this.fileStatisticsSource = result.length > 0 ? [fileStatisticsAllNode] : [];
      if (this.fileStatisticsSortType !== 0 && result.length > 0) {
        this.sortTable(this.fileStatisticsSource[0], this.fileStatisticsSortKey);
      }
      this.theadClick(this.fileStatisticsSource);
      this.fileStatisticsTbl!.recycleDataSource = this.fileStatisticsSource;
    });
  }
  private theadClick(res: Array<unknown>): void {
    let labels = this.fileStatisticsTbl?.shadowRoot?.querySelector('.th > .td')!.querySelectorAll('label');
    if (labels) {
      for (let i = 0; i < labels.length; i++) {
        let label = labels[i].innerHTML;
        labels[i].addEventListener('click', (): void => {
          if (label.includes('Syscall') && i === 0) {
            this.fileStatisticsTbl!.setStatus(res, false, 0, 1);
            this.fileStatisticsTbl!.recycleDs = this.fileStatisticsTbl!.meauseTreeRowElement(
              res,
              RedrawTreeForm.Retract
            );
          } else if (label.includes('Process') && i === 1) {
            this.fileStatisticsTbl!.setStatus(res, true);
            this.fileStatisticsTbl!.recycleDs = this.fileStatisticsTbl!.meauseTreeRowElement(
              res,
              RedrawTreeForm.Retract
            );
          }
        });
      }
    }
  }

  private handleResult(
    result: Array<unknown>,
    fileStatisticsFatherMap: Map<unknown, unknown>,
    fileStatisticsAllNode: unknown
  ): void {
    result.forEach((item, idx): void => {
      // @ts-ignore
      if (fileStatisticsFatherMap.has(item.type)) {
        // @ts-ignore
        let fileStatisticsObj = fileStatisticsFatherMap.get(item.type); // @ts-ignore
        fileStatisticsObj.count += item.count; // @ts-ignore
        fileStatisticsObj.logicalReads += item.logicalReads; // @ts-ignore
        fileStatisticsObj.logicalWrites += item.logicalWrites; // @ts-ignore
        fileStatisticsObj.otherFile += item.otherFile; // @ts-ignore
        fileStatisticsObj.allDuration += item.allDuration; // @ts-ignore
        fileStatisticsObj.minDuration = // @ts-ignore
          fileStatisticsObj.minDuration <= item.minDuration ? fileStatisticsObj.minDuration : item.minDuration; // @ts-ignore
        fileStatisticsObj.maxDuration = // @ts-ignore
          fileStatisticsObj.maxDuration >= item.maxDuration ? fileStatisticsObj.maxDuration : item.maxDuration; // @ts-ignore
        fileStatisticsObj.children.push(this.getInitData(item));
      } else {
        // @ts-ignore
        fileStatisticsFatherMap.set(item.type, {
          // @ts-ignore
          type: item.type, // @ts-ignore
          count: item.count, // @ts-ignore
          logicalReads: item.logicalReads, // @ts-ignore
          logicalWrites: item.logicalWrites, // @ts-ignore
          otherFile: item.otherFile, // @ts-ignore
          allDuration: item.allDuration, // @ts-ignore
          minDuration: item.minDuration, // @ts-ignore
          maxDuration: item.maxDuration, // @ts-ignore
          children: [this.getInitData(item)],
        });
      }
      if (idx === 0) {
        // @ts-ignore
        fileStatisticsAllNode.minDuration = item.minDuration;
      } else {
        // @ts-ignore
        fileStatisticsAllNode.minDuration = // @ts-ignore
          fileStatisticsAllNode.minDuration <= item.minDuration ? fileStatisticsAllNode.minDuration : item.minDuration;
      } // @ts-ignore
      fileStatisticsAllNode.count += item.count; // @ts-ignore
      fileStatisticsAllNode.logicalReads += item.logicalReads; // @ts-ignore
      fileStatisticsAllNode.logicalWrites += item.logicalWrites; // @ts-ignore
      fileStatisticsAllNode.otherFile += item.otherFile; // @ts-ignore
      fileStatisticsAllNode.allDuration += item.allDuration; // @ts-ignore
      fileStatisticsAllNode.maxDuration = // @ts-ignore
        fileStatisticsAllNode.maxDuration >= item.maxDuration ? fileStatisticsAllNode.maxDuration : item.maxDuration;
    });
  }

  sortTable(fileStatisticsAllNode: unknown, key: string): void {
    // @ts-ignore
    fileStatisticsAllNode.children.sort((fileStatisticsA: unknown, fileStatisticsB: unknown) => {
      return this.fileStatisticsSortType === 1 ?
        // @ts-ignore
        fileStatisticsA.node[key] - fileStatisticsB.node[key] :
        this.fileStatisticsSortType === 2 ?
          // @ts-ignore
          fileStatisticsB.node[key] - fileStatisticsA.node[key] : 0;
    }); // @ts-ignore
    fileStatisticsAllNode.children.forEach((item: unknown): void => {
      // @ts-ignore
      item.children.sort((fileStatisticsA: unknown, fileStatisticsB: unknown) => {
        return this.fileStatisticsSortType === 1 ?
          // @ts-ignore
          fileStatisticsA.node[key] - fileStatisticsB.node[key] :
          this.fileStatisticsSortType === 2 ?
            // @ts-ignore
            fileStatisticsB.node[key] - fileStatisticsA.node[key] : 0;
      });
    });
  }

  initHtml(): string {
    return `
        <style>
        :host{
            display: flex;
            flex-direction: column;
            padding: 10px 10px;
        }
        .file-statistics-progress{
            bottom: 5px;
            position: absolute;
            height: 1px;
            left: 0;
            right: 0;
        }
        .file-statistics-loading{
            bottom: 0;
            position: absolute;
            left: 0;
            right: 0;
            width:100%;
            background:transparent;
            z-index: 999999;
        }
        </style>
        <lit-table id="tb-file-statistics" style="height: auto" tree>
            <lit-table-column class="fs-stat-column" width="20%" title="Syscall/Process" data-index="title" key="title" align="flex-start" retract>
            </lit-table-column>
            <lit-table-column class="fs-stat-column" width="1fr" title="Count" data-index="count" key="count" align="flex-start" order>
            </lit-table-column>
            <lit-table-column class="fs-stat-column" width="1fr" title="Logical Writes" data-index="logicalWrites" key="logicalWrites" align="flex-start" order>
            </lit-table-column>
            <lit-table-column class="fs-stat-column" width="1fr" title="Logical Reads" data-index="logicalReads" key="logicalReads" align="flex-start" order>
            </lit-table-column>
            <lit-table-column class="fs-stat-column" width="1fr" title="Other Filesystem Bytes" data-index="otherFile" key="otherFile" align="flex-start" order>
            </lit-table-column>
            <lit-table-column class="fs-stat-column" width="1fr" title="Duration" data-index="allDuration" key="allDuration" align="flex-start" order>
            </lit-table-column>
            <lit-table-column class="fs-stat-column" width="1fr" title="Min Duration" data-index="minDuration" key="minDuration" align="flex-start" order>
            </lit-table-column>
            <lit-table-column class="fs-stat-column" width="1fr" title="Avg Duration" data-index="avgDuration" key="avgDuration" align="flex-start" order>
            </lit-table-column>
            <lit-table-column class="fs-stat-column" width="1fr" title="Max Duration" data-index="maxDuration" key="maxDuration" align="flex-start" order>
            </lit-table-column>
        </lit-table>
        <lit-progress-bar class="file-statistics-progress"></lit-progress-bar>
        <div class="file-statistics-loading"></div>
        `;
  }
}
