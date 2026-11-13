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
import { SelectionParam } from '../../../../bean/BoxSelection';
import { LogStruct } from '../../../../database/ui-worker/ProcedureWorkerLog';
import { ColorUtils } from '../../base/ColorUtils';
import { LitTable } from '../../../../../base-ui/table/lit-table';
import { LitIcon } from '../../../../../base-ui/icon/LitIcon';
import { TabPaneHiLogSummaryHtml } from './TabPaneHiLogSummary.html';
import { NUM_30, NUM_40 } from '../../../../bean/NumBean';
import { queryLogAllData } from '../../../../database/sql/SqlLite.sql';

@element('tab-hi-log-summary')
export class TabPaneHiLogSummary extends BaseElement {
  private logSummaryTable: HTMLDivElement | undefined | null;
  private summaryDownLoadTbl: LitTable | undefined | null;
  private systemLogSource: LogStruct[] = [];
  private logTreeNodes: LogTreeNode[] = [];
  private expansionDiv: HTMLDivElement | undefined | null;
  private expansionUpIcon: LitIcon | undefined | null;
  private expansionDownIcon: LitIcon | undefined | null;
  private expandedNodeList: Set<number> = new Set();
  private logLevel: string[] = ['Debug', 'Info', 'Warn', 'Error', 'Fatal'];
  private selectTreeDepth: number = 0;
  private currentSelection: SelectionParam | undefined;

  set data(systemLogDetailParam: SelectionParam) {
    if (systemLogDetailParam === this.currentSelection) {
      return;
    }
    this.currentSelection = systemLogDetailParam;
    this.systemLogSource = [];
    this.expandedNodeList.clear();
    this.expansionUpIcon!.name = 'up';
    this.expansionDownIcon!.name = 'down';
    this.logSummaryTable!.innerHTML = '';
    this.summaryDownLoadTbl!.recycleDataSource = [];
    // @ts-ignore
    let oneDayTime = (window as unknown).recordEndNS - 86400000000000;
    if (systemLogDetailParam.hiLogs.length > 0) {
      queryLogAllData(oneDayTime, systemLogDetailParam.leftNs, systemLogDetailParam.rightNs).then((res) => {
        this.systemLogSource = res;
        if (this.systemLogSource?.length !== 0 && systemLogDetailParam) {
          this.refreshRowNodeTable();
        }
      });
    }
  }

  initElements(): void {
    this.logSummaryTable = this.shadowRoot?.querySelector<HTMLDivElement>('#tab-summary');
    this.summaryDownLoadTbl = this.shadowRoot?.querySelector<LitTable>('#tb-hilog-summary');
    this.expansionDiv = this.shadowRoot?.querySelector<HTMLDivElement>('.expansion-div');
    this.expansionUpIcon = this.shadowRoot?.querySelector<LitIcon>('.expansion-up-icon');
    this.expansionDownIcon = this.shadowRoot?.querySelector<LitIcon>('.expansion-down-icon');
    let summaryTreeLevel: string[] = ['Level', '/Process', '/Tag', '/Message'];
    this.shadowRoot?.querySelectorAll<HTMLLabelElement>('.head-label').forEach((summaryTreeHead): void => {
      summaryTreeHead.addEventListener('click', (): void => {
        this.selectTreeDepth = summaryTreeLevel.indexOf(summaryTreeHead.textContent!);
        this.expandedNodeList.clear();
        this.refreshSelectDepth(this.logTreeNodes);
        this.refreshRowNodeTable(true);
      });
    });
    this.logSummaryTable!.onscroll = (): void => {
      let logTreeTableEl = this.shadowRoot?.querySelector<HTMLDivElement>('.log-tree-table');
      if (logTreeTableEl) {
        logTreeTableEl.scrollTop = this.logSummaryTable?.scrollTop || 0;
      }
    };
  }

  initHtml(): string {
    return TabPaneHiLogSummaryHtml;
  }

  connectedCallback(): void {
    super.connectedCallback();
    new ResizeObserver((): void => {
      this.parentElement!.style.overflow = 'hidden';
      this.refreshRowNodeTable();
    }).observe(this.parentElement!);
    this.expansionDiv?.addEventListener('click', this.expansionClickEvent);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.expansionDiv?.removeEventListener('click', this.expansionClickEvent);
  }

  expansionClickEvent = (): void => {
    this.expandedNodeList.clear();
    if (this.expansionUpIcon?.name === 'down') {
      this.selectTreeDepth = 0;
      this.expansionUpIcon!.name = 'up';
      this.expansionDownIcon!.name = 'down';
    } else {
      this.selectTreeDepth = 4;
      this.expansionUpIcon!.name = 'down';
      this.expansionDownIcon!.name = 'up';
    }
    this.refreshSelectDepth(this.logTreeNodes);
    this.refreshRowNodeTable(true);
  };

  private refreshSelectDepth(logTreeNodes: LogTreeNode[]): void {
    logTreeNodes.forEach((item): void => {
      if (item.depth < this.selectTreeDepth) {
        this.expandedNodeList.add(item.id);
        if (item.children.length > 0) {
          this.refreshSelectDepth(item.children);
        }
      }
    });
  }

  private createRowNodeTableEL(
    rowNodeList: LogTreeNode[],
    tableTreeEl: HTMLDivElement,
    tableCountEl: HTMLDivElement,
    rowColor: string = ''
  ): void {
    let unitPadding: number = 20;
    let leftPadding: number = 5;
    rowNodeList.forEach((rowNode): void => {
      let tableTreeRowEl: HTMLElement = document.createElement('tr');
      tableTreeRowEl.className = 'tree-row-tr';
      tableTreeRowEl.title = rowNode.logName + '';
      let leftSpacingEl: HTMLElement = document.createElement('td');
      leftSpacingEl.style.paddingLeft = `${rowNode.depth * unitPadding + leftPadding}px`;
      tableTreeRowEl.appendChild(leftSpacingEl);
      this.addToggleIconEl(rowNode, tableTreeRowEl);
      let rowNodeTextEL: HTMLElement = document.createElement('td');
      rowNodeTextEL.textContent = rowNode.logName + '';
      rowNodeTextEL.className = 'row-name-td';
      tableTreeRowEl.appendChild(rowNodeTextEL);
      tableTreeEl.appendChild(tableTreeRowEl);
      let tableCountRowEl: HTMLElement = document.createElement('tr');
      tableCountRowEl.title = rowNode.count.toString();
      let countEL: HTMLElement = document.createElement('td');
      countEL.textContent = rowNode.count.toString();
      countEL.className = 'count-column-td';
      if (rowNode.depth === 0) {
        rowNodeTextEL.style.color = ColorUtils.getHilogColor(rowNode.logName!);
        countEL.style.color = ColorUtils.getHilogColor(rowNode.logName!);
      } else {
        rowNodeTextEL.style.color = rowColor;
        countEL.style.color = rowColor;
      }
      tableCountRowEl.appendChild(countEL);
      tableCountEl.appendChild(tableCountRowEl);
      if (rowNode.children && this.expandedNodeList.has(rowNode.id)) {
        this.createRowNodeTableEL(rowNode.children, tableTreeEl, tableCountEl, countEL.style.color);
      }
    });
  }

  private addToggleIconEl(rowNode: LogTreeNode, tableRowEl: HTMLElement): void {
    let toggleIconEl: HTMLElement = document.createElement('td');
    let expandIcon = document.createElement('lit-icon');
    expandIcon.classList.add('tree-icon');
    if (rowNode.children && rowNode.children.length > 0) {
      toggleIconEl.appendChild(expandIcon);
      // @ts-ignore
      expandIcon.name = this.expandedNodeList.has(rowNode.id) ? 'minus-square' : 'plus-square';
      toggleIconEl.classList.add('expand-icon');
      toggleIconEl.addEventListener('click', (): void => {
        let scrollTop = this.logSummaryTable?.scrollTop ?? 0;
        this.changeNode(rowNode.id);
        this.logSummaryTable!.scrollTop = scrollTop;
      });
    }
    tableRowEl.appendChild(toggleIconEl);
  }

  private changeNode(currentNode: number): void {
    if (this.expandedNodeList.has(currentNode)) {
      this.expandedNodeList.delete(currentNode);
    } else {
      this.expandedNodeList.add(currentNode);
    }
    this.refreshRowNodeTable();
  }

  private refreshRowNodeTable(useCacheRefresh: boolean = false): void {
    this.logSummaryTable!.innerHTML = '';
    if (this.logSummaryTable && this.parentElement) {
      this.logSummaryTable.style.height = `${this.parentElement!.clientHeight - NUM_30}px`;
    }
    if (!useCacheRefresh) {
      this.logTreeNodes = this.buildTreeTblNodes(this.systemLogSource);
      if (this.logTreeNodes.length > 0) {
        this.summaryDownLoadTbl!.recycleDataSource = this.logTreeNodes;
      } else {
        this.summaryDownLoadTbl!.recycleDataSource = [];
      }
    }
    let tableFragmentEl: DocumentFragment = document.createDocumentFragment();
    let tableTreeEl: HTMLDivElement = document.createElement('div');
    tableTreeEl.className = 'log-tree-table';
    let tableCountEl: HTMLDivElement = document.createElement('div');
    if (this.parentElement) {
      tableTreeEl.style.height = `${this.parentElement!.clientHeight - NUM_40}px`;
    }
    this.createRowNodeTableEL(this.logTreeNodes, tableTreeEl, tableCountEl, '');
    let emptyTr = document.createElement('tr');
    emptyTr.className = 'tree-row-tr';
    tableTreeEl?.appendChild(emptyTr);
    let emptyCountTr = document.createElement('tr');
    emptyCountTr.className = 'tree-row-tr';
    tableCountEl?.appendChild(emptyCountTr);
    tableFragmentEl.appendChild(tableTreeEl);
    tableFragmentEl.appendChild(tableCountEl);
    this.logSummaryTable!.appendChild(tableFragmentEl);
  }

  private buildTreeTblNodes(logTreeNodes: LogStruct[]): LogTreeNode[] {
    let id = 0;
    let root: LogTreeNode = { id: id, depth: 0, children: [], logName: 'All', count: 0 };
    logTreeNodes.forEach((item) => {
      id++;
      let levelNode = root.children.find((node) => node.logName === item.level);
      if (levelNode) {
        levelNode.count++;
      } else {
        id++;
        levelNode = { id: id, depth: 0, children: [], logName: item.level, count: 1 };
        root.children.push(levelNode);
      }
      let processNode = levelNode.children.find((node) => node.logName === item.processName);
      if (processNode) {
        processNode.count++;
      } else {
        id++;
        processNode = { id: id, depth: 1, children: [], logName: item.processName, count: 1 };
        levelNode.children.push(processNode);
      }
      let tagNode = processNode.children.find((node) => node.logName === item.tag);
      if (tagNode) {
        tagNode.count++;
      } else {
        id++;
        tagNode = { id: id, depth: 2, children: [], logName: item.tag, count: 1 };
        processNode.children.push(tagNode);
      }
      let messageNode = tagNode.children.find((node) => node.logName === item.context);
      if (messageNode) {
        messageNode.count++;
      } else {
        id++;
        tagNode.children.push({ id: id, depth: 3, children: [], logName: item.context, count: 1 });
      }
      root.count++;
    });
    return root.children.sort((leftData, rightData) => {
      return this.logLevel.indexOf(leftData.logName!) - this.logLevel.indexOf(rightData.logName!);
    });
  }
}

export interface LogTreeNode {
  id: number;
  depth: number;
  children: LogTreeNode[];
  logName: string | undefined;
  count: number;
}
