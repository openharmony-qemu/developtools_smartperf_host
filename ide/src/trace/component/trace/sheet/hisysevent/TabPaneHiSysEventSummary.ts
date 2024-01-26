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
import { LitIcon } from '../../../../../base-ui/icon/LitIcon';
import { HiSysEventStruct } from '../../../../database/ui-worker/ProcedureWorkerHiSysEvent';
import { LitTable } from '../../../../../base-ui/table/lit-table';
import { ColorUtils } from '../../base/ColorUtils';
import { TabPaneHiSysEventSummaryHtml } from './TabPaneHiSysEventSummary.html';
import { NUM_30, NUM_40 } from '../../../../bean/NumBean';

@element('tab-hi-sysevent-summary')
export class TabPaneHiSysEventSummary extends BaseElement {
  private summarySource: Array<HiSysEventStruct> = [];
  private eventSummaryTable: HTMLDivElement | undefined | null;
  private summaryTable: LitTable | undefined | null;
  private eventTreeNodes: HiSysEventTreeNode[] = [];
  private expansionDiv: HTMLDivElement | undefined | null;
  private expansionUpIcon: LitIcon | undefined | null;
  private expansionDownIcon: LitIcon | undefined | null;
  private expandedNodeList: Set<number> = new Set();
  private selectTreeDepth: number = 0;
  private currentSelection: SelectionParam | undefined;

  set data(systemEventParam: SelectionParam) {
    if (systemEventParam === this.currentSelection) {
      return;
    }
    this.summarySource = [];
    this.expandedNodeList.clear();
    this.expansionUpIcon!.name = 'up';
    this.expansionDownIcon!.name = 'down';
    this.eventSummaryTable!.innerHTML = '';
    this.summaryTable!.recycleDataSource = [];
    this.summarySource = systemEventParam.sysAllEventsData;
    if (this.summarySource?.length !== 0 && systemEventParam) {
      this.refreshRowNodeTable();
    }
  }

  initElements(): void {
    this.eventSummaryTable = this.shadowRoot?.querySelector<HTMLDivElement>('#tab-summary');
    this.summaryTable = this.shadowRoot?.querySelector<LitTable>('#tb-event-summary');
    this.expansionDiv = this.shadowRoot?.querySelector<HTMLDivElement>('.expansion-div');
    this.expansionUpIcon = this.shadowRoot?.querySelector<LitIcon>('.expansion-up-icon');
    this.expansionDownIcon = this.shadowRoot?.querySelector<LitIcon>('.expansion-down-icon');
    let summaryTreeLevel: string[] = ['Level', '/Domain', '/EventName'];
    this.shadowRoot?.querySelectorAll<HTMLLabelElement>('.head-label').forEach((summaryTreeHead) => {
      summaryTreeHead.addEventListener('click', () => {
        this.selectTreeDepth = summaryTreeLevel.indexOf(summaryTreeHead.textContent!);
        this.expandedNodeList.clear();
        this.refreshSelectDepth(this.eventTreeNodes);
        this.refreshRowNodeTable(true);
      });
    });
    this.eventSummaryTable?.addEventListener('scroll', () => {
      let treeTableEl = this.shadowRoot?.querySelector<HTMLDivElement>('.event-tree-table');
      if (treeTableEl) {
        treeTableEl.scrollTop = this.eventSummaryTable?.scrollTop || 0;
      }
    });
  }

  initHtml(): string {
    return TabPaneHiSysEventSummaryHtml;
  }

  connectedCallback(): void {
    super.connectedCallback();
    new ResizeObserver(() => {
      this.parentElement!.style.overflow = 'hidden';
      this.refreshRowNodeTable();
    }).observe(this.parentElement!);
    this.expansionDiv?.addEventListener('click', this.expansionClickEvent);
  }

  expansionClickEvent = (): void => {
    this.expandedNodeList.clear();
    if (this.expansionUpIcon?.name === 'down') {
      this.selectTreeDepth = 0;
      this.expansionUpIcon!.name = 'up';
      this.expansionDownIcon!.name = 'down';
    } else {
      this.selectTreeDepth = 2;
      this.expansionUpIcon!.name = 'down';
      this.expansionDownIcon!.name = 'up';
    }
    this.refreshSelectDepth(this.eventTreeNodes);
    this.refreshRowNodeTable(true);
  };

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.expansionDiv?.removeEventListener('click', this.expansionClickEvent);
  }

  private refreshSelectDepth(eventTreeNodes: HiSysEventTreeNode[]): void {
    eventTreeNodes.forEach((item) => {
      if (item.depth < this.selectTreeDepth) {
        this.expandedNodeList.add(item.id);
        if (item.children.length > 0) {
          this.refreshSelectDepth(item.children);
        }
      }
    });
  }

  private createRowNodeTableEL(
    rowNodeList: HiSysEventTreeNode[],
    tableTreeEl: HTMLDivElement,
    tableCountEl: HTMLDivElement,
    rowColor: string = ''
  ): void {
    let unitPadding: number = 20;
    let leftPadding: number = 5;
    rowNodeList.forEach((rowNode) => {
      let tableRowEl: HTMLElement = document.createElement('tr');
      tableRowEl.className = 'tree-row-tr';
      tableRowEl.title = rowNode.summaryName!;
      let tdEl: HTMLElement = document.createElement('td');
      tdEl.style.paddingLeft = `${rowNode.depth * unitPadding + leftPadding}px`;
      tableRowEl.appendChild(tdEl);
      this.addToggleIconEl(rowNode, tableRowEl);
      let rowNodeTextEL: HTMLElement = document.createElement('td');
      rowNodeTextEL.textContent = rowNode.summaryName!;
      rowNodeTextEL.className = 'row-name-td';
      tableRowEl.appendChild(rowNodeTextEL);
      tableTreeEl.appendChild(tableRowEl);
      let tableCountRowEl: HTMLElement = document.createElement('tr');
      let countEle: HTMLElement = document.createElement('td');
      countEle.textContent = rowNode.count.toString();
      countEle.className = 'count-column-td';
      if (rowNode.depth === 0) {
        rowNodeTextEL.style.color = ColorUtils.getHisysEventColor(rowNode.summaryName!);
        countEle.style.color = ColorUtils.getHisysEventColor(rowNode.summaryName!);
      } else {
        rowNodeTextEL.style.color = rowColor;
        countEle.style.color = rowColor;
      }
      tableCountRowEl.appendChild(countEle);
      tableCountEl.appendChild(tableCountRowEl);
      if (rowNode.children && this.expandedNodeList.has(rowNode.id)) {
        this.createRowNodeTableEL(rowNode.children, tableTreeEl, tableCountEl, countEle.style.color);
      }
    });
  }

  private addToggleIconEl(rowNode: HiSysEventTreeNode, tableRowEl: HTMLElement): void {
    let toggleIconEl: HTMLElement = document.createElement('td');
    let expandIcon = document.createElement('lit-icon');
    expandIcon.classList.add('tree-icon');
    if (rowNode.children && rowNode.children.length > 0) {
      toggleIconEl.appendChild(expandIcon);
      // @ts-ignore
      expandIcon.name = this.expandedNodeList.has(rowNode.id) ? 'minus-square' : 'plus-square';
      toggleIconEl.classList.add('expand-icon');
      toggleIconEl.addEventListener('click', () => {
        let scrollTop = this.eventSummaryTable?.scrollTop ?? 0;
        this.changeNode(rowNode.id);
        this.eventSummaryTable!.scrollTop = scrollTop;
      });
    }
    tableRowEl.appendChild(toggleIconEl);
  }

  private refreshRowNodeTable(useCacheRefresh: boolean = false): void {
    this.eventSummaryTable!.innerHTML = '';
    if (this.eventSummaryTable && this.parentElement) {
      this.eventSummaryTable.style.height = `${this.parentElement.clientHeight - NUM_30}px`;
    }
    if (!useCacheRefresh) {
      this.eventTreeNodes = this.buildTreeTblNodes(this.summarySource);
      if (this.eventTreeNodes.length > 0) {
        this.summaryTable!.recycleDataSource = this.eventTreeNodes;
      } else {
        this.summaryTable!.recycleDataSource = [];
      }
    }
    let tableFragmentEl: DocumentFragment = document.createDocumentFragment();
    let tableTreeEl: HTMLDivElement = document.createElement('div');
    tableTreeEl.className = 'event-tree-table';
    let tableCountEl: HTMLDivElement = document.createElement('div');
    if (this.parentElement) {
      tableTreeEl.style.height = `${this.parentElement!.clientHeight - NUM_40}px`;
    }
    this.createRowNodeTableEL(this.eventTreeNodes, tableTreeEl, tableCountEl, '');
    const emptyTr = document.createElement('tr');
    emptyTr.className = 'tree-row-tr';
    tableTreeEl?.appendChild(emptyTr);
    const emptyCountTr = document.createElement('tr');
    emptyCountTr.className = 'tree-row-tr';
    tableCountEl?.appendChild(emptyCountTr);
    tableFragmentEl.appendChild(tableTreeEl);
    tableFragmentEl.appendChild(tableCountEl);
    this.eventSummaryTable!.appendChild(tableFragmentEl);
  }

  private changeNode(currentNode: number): void {
    if (this.expandedNodeList.has(currentNode)) {
      this.expandedNodeList['delete'](currentNode);
    } else {
      this.expandedNodeList.add(currentNode);
    }
    this.refreshRowNodeTable();
  }

  private buildTreeTblNodes(eventTreeNodes: HiSysEventStruct[]): HiSysEventTreeNode[] {
    let id = 0;
    let root: HiSysEventTreeNode = {id: id, depth: 0, children: [], summaryName: '', count: 0};
    eventTreeNodes.forEach((item) => {
      id++;
      let levelNode = root.children.find((node) => node.summaryName === item.level);
      if (levelNode) {
        levelNode.count++;
      } else {
        id++;
        levelNode = {id: id, depth: 0, children: [], summaryName: item.level, count: 1};
        root.children.push(levelNode);
      }
      let domainNode = levelNode.children.find((node) => node.summaryName === item.domain);
      if (domainNode) {
        domainNode.count++;
      } else {
        id++;
        domainNode = {id: id, depth: 1, children: [], summaryName: item.domain, count: 1};
        levelNode.children.push(domainNode);
      }
      let eventNameNode = domainNode.children.find((node) => node.summaryName === item.eventName);
      if (eventNameNode) {
        eventNameNode.count++;
      } else {
        id++;
        eventNameNode = {id: id, depth: 2, children: [], summaryName: item.eventName, count: 1};
        domainNode.children.push(eventNameNode);
      }
      root.count++;
    });
    return root.children.sort((leftData, rightData) => {
      return leftData.summaryName!.length - rightData.summaryName!.length;
    });
  }
}

export interface HiSysEventTreeNode {
  id: number;
  depth: number;
  children: HiSysEventTreeNode[];
  summaryName: string | undefined;
  count: number;
}
