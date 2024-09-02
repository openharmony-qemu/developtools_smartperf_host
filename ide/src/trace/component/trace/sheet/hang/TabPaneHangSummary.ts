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
import { ColorUtils } from '../../base/ColorUtils';
import { LitTable } from '../../../../../base-ui/table/lit-table';
import { LitIcon } from '../../../../../base-ui/icon/LitIcon';
import { TabPaneHangSummaryHtml } from '../hang/TabPaneHangSummary.html';
import { NUM_30, NUM_40 } from '../../../../bean/NumBean';
import { HangStruct } from '../../../../database/ui-worker/ProcedureWorkerHang';
import { HangType, SpHangChart } from '../../../chart/SpHangChart';
import { queryAllHangs } from '../../../../database/sql/Hang.sql';

/// Hangs 框选Tab页2
@element('tab-hang-summary')
export class TabPaneHangSummary extends BaseElement {
  private hangSummaryTable: HTMLDivElement | undefined | null;
  private summaryDownLoadTbl: LitTable | undefined | null;
  private systemHangSource: HangStruct[] = [];
  private hangTreeNodes: HangTreeNode[] = [];
  private expansionDiv: HTMLDivElement | undefined | null;
  private expansionUpIcon: LitIcon | undefined | null;
  private expansionDownIcon: LitIcon | undefined | null;
  private expandedNodeList: Set<number> = new Set();
  private hangLevel: string[] = ['Instant', 'Circumstantial', 'Micro', 'Severe'];
  private selectTreeDepth: number = 0;
  private currentSelection: SelectionParam | undefined;

  /// 框选时段范围时触发
  set data(selectionParam: SelectionParam) {
    if (selectionParam === this.currentSelection) {
      return;
    }
    this.currentSelection = selectionParam;
    this.expandedNodeList.clear();
    this.expansionUpIcon!.name = 'up';
    this.expansionDownIcon!.name = 'down';
    this.hangSummaryTable!.innerHTML = '';
    this.summaryDownLoadTbl!.recycleDataSource = [];
    queryAllHangs().then((ret) => {
      const filter = new Set([...selectionParam.hangMapData.keys()].map(key => key.split(' ').at(-1)));
      ret = ret.filter(struct => (
        filter.has(`${struct.pid ?? 0}`) &&
        ((struct.startNS ?? 0) <= selectionParam.rightNs) &&
        (selectionParam.leftNs <= ((struct.startNS ?? 0) + (struct.dur ?? 0)))
      ));
      this.systemHangSource = ret;
      if (filter.size > 0 && selectionParam) {
        this.refreshRowNodeTable();
      }
    });
  }

  initElements(): void {
    this.hangSummaryTable = this.shadowRoot?.querySelector<HTMLDivElement>('#tab-summary');
    this.summaryDownLoadTbl = this.shadowRoot?.querySelector<LitTable>('#tb-hang-summary');
    this.expansionDiv = this.shadowRoot?.querySelector<HTMLDivElement>('.expansion-div');
    this.expansionUpIcon = this.shadowRoot?.querySelector<LitIcon>('.expansion-up-icon');
    this.expansionDownIcon = this.shadowRoot?.querySelector<LitIcon>('.expansion-down-icon');
    let summaryTreeLevel: string[] = ['Type', '/Process', '/Hang'];
    this.shadowRoot?.querySelectorAll<HTMLLabelElement>('.head-label').forEach((summaryTreeHead): void => {
      summaryTreeHead.addEventListener('click', (): void => {
        this.selectTreeDepth = summaryTreeLevel.indexOf(summaryTreeHead.textContent!);
        this.expandedNodeList.clear();
        this.refreshSelectDepth(this.hangTreeNodes);
        this.refreshRowNodeTable(true);
      });
    });
    this.hangSummaryTable!.onscroll = (): void => {
      let hangTreeTableEl = this.shadowRoot?.querySelector<HTMLDivElement>('.hang-tree-table');
      if (hangTreeTableEl) {
        hangTreeTableEl.scrollTop = this.hangSummaryTable?.scrollTop || 0;
      }
    };
  }

  initHtml(): string {
    return TabPaneHangSummaryHtml;
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
    this.refreshSelectDepth(this.hangTreeNodes);
    this.refreshRowNodeTable(true);
  };

  private refreshSelectDepth(hangTreeNodes: HangTreeNode[]): void {
    hangTreeNodes.forEach((item): void => {
      if (item.depth < this.selectTreeDepth) {
        this.expandedNodeList.add(item.id);
        if (item.children.length > 0) {
          this.refreshSelectDepth(item.children);
        }
      }
    });
  }

  private createRowNodeTableEL(
    rowNodeList: HangTreeNode[],
    tableTreeEl: HTMLDivElement,
    tableCountEl: HTMLDivElement,
    rowColor: string = '',
  ): void {
    let unitPadding: number = 20;
    let leftPadding: number = 5;
    rowNodeList.forEach((rowNode): void => {
      let tableTreeRowEl: HTMLElement = document.createElement('tr');
      tableTreeRowEl.className = 'tree-row-tr';
      tableTreeRowEl.title = rowNode.name + '';
      let leftSpacingEl: HTMLElement = document.createElement('td');
      leftSpacingEl.style.paddingLeft = `${rowNode.depth * unitPadding + leftPadding}px`;
      tableTreeRowEl.appendChild(leftSpacingEl);
      this.addToggleIconEl(rowNode, tableTreeRowEl);
      let rowNodeTextEL: HTMLElement = document.createElement('td');
      rowNodeTextEL.textContent = rowNode.name + '';
      rowNodeTextEL.className = 'row-name-td';
      tableTreeRowEl.appendChild(rowNodeTextEL);
      tableTreeEl.appendChild(tableTreeRowEl);
      let tableCountRowEl: HTMLElement = document.createElement('tr');
      tableCountRowEl.title = rowNode.count.toString();
      let countEL: HTMLElement = document.createElement('td');
      countEL.textContent = rowNode.count.toString();
      countEL.className = 'count-column-td';
      if (rowNode.depth === 0) {
        rowNodeTextEL.style.color = ColorUtils.getHangColor((rowNode.name as HangType) ?? '');
        countEL.style.color = ColorUtils.getHangColor((rowNode.name as HangType) ?? '');
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

  private addToggleIconEl(rowNode: HangTreeNode, tableRowEl: HTMLElement): void {
    let toggleIconEl: HTMLElement = document.createElement('td');
    let expandIcon = document.createElement('lit-icon');
    expandIcon.classList.add('tree-icon');
    if (rowNode.children && rowNode.children.length > 0) {
      toggleIconEl.appendChild(expandIcon);
      // @ts-ignore
      expandIcon.name = this.expandedNodeList.has(rowNode.id) ? 'minus-square' : 'plus-square';
      toggleIconEl.classList.add('expand-icon');
      toggleIconEl.addEventListener('click', (): void => {
        let scrollTop = this.hangSummaryTable?.scrollTop ?? 0;
        this.changeNode(rowNode.id);
        this.hangSummaryTable!.scrollTop = scrollTop;
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
    this.refreshRowNodeTable(true);
  }

  private refreshRowNodeTable(useCacheRefresh: boolean = false): void {
    this.hangSummaryTable!.innerHTML = '';
    if (this.hangSummaryTable && this.parentElement) {
      this.hangSummaryTable.style.height = `${this.parentElement!.clientHeight - NUM_30}px`;
    }
    if (!useCacheRefresh) {
      this.hangTreeNodes = this.buildTreeTbhNodes(this.systemHangSource);
      if (this.hangTreeNodes.length > 0) {
        this.summaryDownLoadTbl!.recycleDataSource = this.hangTreeNodes;
      } else {
        this.summaryDownLoadTbl!.recycleDataSource = [];
      }
    }
    let tableFragmentEl: DocumentFragment = document.createDocumentFragment();
    let tableTreeEl: HTMLDivElement = document.createElement('div');
    tableTreeEl.className = 'hang-tree-table';
    let tableCountEl: HTMLDivElement = document.createElement('div');
    if (this.parentElement) {
      tableTreeEl.style.height = `${this.parentElement!.clientHeight - NUM_40}px`;
    }
    this.createRowNodeTableEL(this.hangTreeNodes, tableTreeEl, tableCountEl, '');
    let emptyTr = document.createElement('tr');
    emptyTr.className = 'tree-row-tr';
    tableTreeEl?.appendChild(emptyTr);
    let emptyCountTr = document.createElement('tr');
    emptyCountTr.className = 'tree-row-tr';
    tableCountEl?.appendChild(emptyCountTr);
    tableFragmentEl.appendChild(tableTreeEl);
    tableFragmentEl.appendChild(tableCountEl);
    this.hangSummaryTable!.appendChild(tableFragmentEl);
  }

  private buildTreeTbhNodes(hangTreeNodes: HangStruct[]): HangTreeNode[] {
    let root: HangTreeNode = {
      id: 0, depth: 0, children: [],
      name: 'All', count: 0,
    };
    let id = 1;
    hangTreeNodes = hangTreeNodes.map(node => ({
      ...node,
      type: SpHangChart.calculateHangType(node.dur ?? 0),
    }));
    for (const item of hangTreeNodes) {
      let typeNode = root.children.find((node) => node.name === item.type);
      if (typeNode) {
        typeNode.count += 1;
      } else {
        typeNode = {
          id: id += 1, depth: 0, children: [], count: 1,
          name: item.type ?? 'Undefined Type?',
        };
        root.children.push(typeNode);
      }

      let processNode = typeNode.children.find((node) => node.name === item.pname);
      if (processNode) {
        processNode.count += 1;
      } else {
        processNode = {
          id: id += 1, depth: 1, children: [], count: 1,
          name: item.pname ?? 'Process',
        };
        typeNode.children.push(processNode);
      }

      let contentNode = {
        id: id += 1, depth: 2, children: [], count: 1,
        name: item.content ?? '',
      };
      processNode.children.push(contentNode);
    }

    root.children.sort((a, b) => this.hangLevel.indexOf(b.name) - this.hangLevel.indexOf(a.name));
    return root.children;
  }
}

export interface HangTreeNode {
  id: number;
  depth: number;
  children: HangTreeNode[];
  name: string;
  count: number;
};
