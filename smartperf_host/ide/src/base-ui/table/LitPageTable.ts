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

import { LitTableColumn } from './lit-table-column';
import { LitProgressBar } from './../progress-bar/LitProgressBar';
import { BaseElement, element } from '../BaseElement';
import '../utils/Template';
import { TableRowObject } from './TableRowObject';
import {
  addCopyEventListener,
  addSelectAllBox,
  createDownUpSvg,
  exportData,
  fixed,
  formatExportData,
  formatName,
  iconPadding,
  iconWidth,
  litPageTableHtml,
} from './LitTableHtml';
import { LitIcon } from '../icon/LitIcon';

@element('lit-page-table')
export class LitPageTable extends BaseElement {
  meauseRowElement: HTMLDivElement | undefined;
  currentRecycleList: HTMLDivElement[] = [];
  currentTreeDivList: HTMLDivElement[] = [];
  public rememberScrollTop = false;
  public getItemTextColor?: (data: unknown) => string;
  public itemTextHandleMap: Map<string, (value: unknown) => string> = new Map<string, (value: unknown) => string>();
  public exportLoading: boolean = false;
  public exportTextHandleMap: Map<string, (value: unknown) => string> = new Map<string, (value: unknown) => string>();
  public ds: Array<unknown> = [];
  public recycleDs: Array<unknown> = [];
  public tableColumns: NodeListOf<LitTableColumn> | undefined;
  public tableElement: HTMLDivElement | null | undefined;
  public columns: Array<Element> | null | undefined;
  public exportProgress: LitProgressBar | null | undefined;
  private gridTemplateColumns: Array<string> = [];
  private st: HTMLSlotElement | null | undefined;
  private theadElement: HTMLDivElement | null | undefined;
  private tbodyElement: HTMLDivElement | undefined | null;
  private treeElement: HTMLDivElement | undefined | null;
  private previousDiv: HTMLDivElement | undefined | null;
  private nextDiv: HTMLDivElement | undefined | null;
  private currentPageDiv: HTMLDivElement | undefined | null;
  private targetPageInput: HTMLInputElement | undefined | null;
  private jumpDiv: HTMLDivElement | undefined | null;
  private colCount: number = 0;
  private isScrollXOutSide: boolean = false;
  private currentPage: number = 0;
  startSkip: number = 0;

  static get observedAttributes(): string[] {
    return [
      'scroll-y',
      'selectable',
      'no-head',
      'grid-line',
      'defaultOrderColumn',
      'hideDownload',
      'loading',
      'pagination',
    ];
  }

  set loading(value: boolean) {
    this.exportProgress!.loading = value;
  }

  get hideDownload(): boolean {
    return this.hasAttribute('hideDownload');
  }

  set hideDownload(value) {
    if (value) {
      this.setAttribute('hideDownload', '');
    } else {
      this.removeAttribute('hideDownload');
    }
  }

  get selectable(): boolean {
    return this.hasAttribute('selectable');
  }

  set selectable(value) {
    if (value) {
      this.setAttribute('selectable', '');
    } else {
      this.removeAttribute('selectable');
    }
  }

  get scrollY(): string {
    return this.getAttribute('scroll-y') || 'auto';
  }

  set scrollY(value) {
    this.setAttribute('scroll-y', value);
  }
  get recycleDataSource(): unknown[] {
    return this.ds || [];
  }

  set recycleDataSource(value) {
    this.isScrollXOutSide = this.tableElement!.scrollWidth > this.tableElement!.clientWidth;
    this.ds = value;
    this.toTop();
    this.currentPage = 0;
    this.pagination = value.length > 0 && Array.isArray(value[0]);
    if (this.pagination) {
      this.currentPageDiv!.textContent = `第 ${this.currentPage + 1} 页，共 ${this.ds.length} 页`;
      this.targetPageInput!.value = '';
    }
    if (this.hasAttribute('tree')) {
      this.recycleDs = this.meauseTreeRowElement(value);
    } else {
      // @ts-ignore
      this.recycleDs = this.meauseAllRowHeight(this.pagination ? value[0] : value);
    }
  }

  set pagination(value: boolean) {
    if (value) {
      this.setAttribute('pagination', '');
    } else {
      this.removeAttribute('pagination');
    }
  }

  get pagination(): boolean {
    return this.hasAttribute('pagination');
  }

  initElements(): void {
    this.tableElement = this.shadowRoot?.querySelector('.table');
    this.st = this.shadowRoot?.querySelector('#slot');
    this.theadElement = this.shadowRoot?.querySelector('.thead');
    this.exportProgress = this.shadowRoot?.querySelector('#export_progress_bar');
    this.treeElement = this.shadowRoot?.querySelector('.tree');
    this.tbodyElement = this.shadowRoot?.querySelector('.body');
    this.tableColumns = this.querySelectorAll<LitTableColumn>('lit-table-column');
    this.previousDiv = this.shadowRoot?.querySelector<HTMLDivElement>('#previousPage');
    this.nextDiv = this.shadowRoot?.querySelector<HTMLDivElement>('#nextPage');
    this.currentPageDiv = this.shadowRoot?.querySelector<HTMLDivElement>('#currentPage');
    this.targetPageInput = this.shadowRoot?.querySelector<HTMLInputElement>('#targetPage');
    this.jumpDiv = this.shadowRoot?.querySelector<HTMLDivElement>('#jumpPage');
    this.initPageEventListener();
    this.targetPageInput!.addEventListener('input', ()=>{
      let maxPage = this.ds.length!;
      this.targetPageInput!.max = String(maxPage);
      let currentValue = parseInt(this.targetPageInput!.value, 10);
      let max = parseInt(this.targetPageInput!.max, 10);
      if (currentValue > max) {
        this.targetPageInput!.value = String(max);
    }
    });
  }

  initPageEventListener(): void {
    this.previousDiv!.onclick = (): void => {
      if (this.currentPage > 0) {
        this.currentPage = Math.max(this.currentPage - 1, 0);
        this.showCurrentPageData();
      }
    };
    this.nextDiv!.onclick = (): void => {
      if (this.currentPage < this.ds.length - 1) {
        this.currentPage = Math.min(this.currentPage + 1, this.ds.length - 1);
        this.showCurrentPageData();
      }
    };
    this.jumpDiv!.onclick = (): void => {
      let value = this.targetPageInput!.value;
      let reg = /^[0-9]*$/;
      if (value.length > 0 && reg.test(value)) {
        let target = parseInt(value);
        if (target < 1) {
          target = 1;
        }
        if (target > this.ds.length) {
          target = this.ds.length;
        }
        this.targetPageInput!.value = `${target}`;
        if (this.currentPage !== target - 1) {
          this.currentPage = target - 1;
          this.showCurrentPageData();
        }
      } else {
        this.targetPageInput!.value = '';
      }
    };
  }

  toTop(): void {
    if (this.rememberScrollTop) {
      this.tableElement!.scrollTop = 0;
      this.tableElement!.scrollLeft = 0;
    } else {
      this.tableElement!.scrollTop = 0;
    }
  }

  showCurrentPageData(): void {
    this.toTop();
    this.currentPageDiv!.textContent = `第 ${(this.currentPage || 0) + 1} 页，共 ${this.ds.length} 页`;
    if (this.hasAttribute('tree')) {
      // @ts-ignore
      this.recycleDs = this.meauseTreeRowElement(this.ds[this.currentPage]);
    } else {
      // @ts-ignore
      this.recycleDs = this.meauseAllRowHeight(this.ds[this.currentPage]);
    }
  }

  initHtml(): string {
    return litPageTableHtml;
  }

  dataExportInit(): void {
    let exportDiv = this.shadowRoot!.querySelector<HTMLDivElement>('.export');
    exportDiv &&
      (exportDiv.onclick = (): void => {
        this.exportData();
      });
  }

  exportData(): void {
    exportData(this);
  }

  formatExportData(dataSource: unknown[]): unknown[] {
    return formatExportData(dataSource, this);
  }

  //当 custom element首次被插入文档DOM时，被调用。
  connectedCallback(): void {
    this.dataExportInit();
    addCopyEventListener(this);
    this.colCount = this.tableColumns!.length;
    this.st?.addEventListener('slotchange', () => {
      this.theadElement!.innerHTML = '';
      setTimeout(() => {
        this.columns = this.st!.assignedElements();
        let rowElement = document.createElement('div');
        rowElement.classList.add('th');
        this.gridTemplateColumns = [];
        let pageArea: Array<unknown> = [];
        addSelectAllBox(rowElement, this);
        this.resolvingArea(this.columns, 0, 0, pageArea, rowElement);
        pageArea.forEach((rows, j, array) => {
          for (let i = 0; i < this.colCount; i++) {
            // @ts-ignore
            if (!rows[i]) {
              // @ts-ignore
              rows[i] = array[j - 1][i];
            }
          }
        });
        if (this.selectable) {
          // @ts-ignore
          let s = pageArea.map((a) => '"_checkbox_ ' + a.map((aa: unknown) => aa.t).join(' ') + '"').join(' ');
          rowElement.style.gridTemplateColumns = '60px ' + this.gridTemplateColumns.join(' ');
          rowElement.style.gridTemplateRows = `repeat(${pageArea.length},1fr)`;
          rowElement.style.gridTemplateAreas = s;
        } else {
          // @ts-ignore
          let s = pageArea.map((a) => '"' + a.map((aa: unknown) => aa.t).join(' ') + '"').join(' ');
          rowElement.style.gridTemplateColumns = this.gridTemplateColumns.join(' ');
          rowElement.style.gridTemplateRows = `repeat(${pageArea.length},1fr)`;
          rowElement.style.gridTemplateAreas = s;
        }
        this.theadElement!.innerHTML = '';
        this.theadElement!.append(rowElement);
        this.treeElement!.style.top = this.theadElement?.clientHeight + 'px';
      });
    });
    this.shadowRoot!.addEventListener('load', function (event) {});
    this.tableElement!.addEventListener('mouseout', (ev) => this.mouseOut());
  }

  resolvingArea(columns: unknown, x: unknown, y: unknown, area: Array<unknown>, rowElement: HTMLDivElement): void {
    // @ts-ignore
    columns.forEach((a: unknown, i: unknown) => {
      // @ts-ignore
      if (!area[y]) {
        // @ts-ignore
        area[y] = [];
      } // @ts-ignore
      let key = a.getAttribute('key') || a.getAttribute('title'); // @ts-ignore
      if (a.tagName === 'LIT-TABLE-GROUP') {
        // @ts-ignore
        let childList = [...a.children].filter((a) => a.tagName !== 'TEMPLATE'); // @ts-ignore
        let len = a.querySelectorAll('lit-table-column').length;
        if (childList.length > 0) {
          // @ts-ignore
          this.resolvingArea(childList, x, y + 1, area, rowElement);
        }
        for (let j = 0; j < len; j++) {
          // @ts-ignore
          area[y][x] = { x, y, t: key }; // @ts-ignore
          x++;
        }
        let head = document.createElement('div');
        head.classList.add('td'); // @ts-ignore
        head.style.justifyContent = a.getAttribute('align');
        head.style.borderBottom = '1px solid #f0f0f0';
        head.style.gridArea = key; // @ts-ignore
        head.innerText = a.title; // @ts-ignore
        if (a.hasAttribute('fixed')) {
          // @ts-ignore
          fixed(head, a.getAttribute('fixed'), '#42b983');
        }
        rowElement.append(head); // @ts-ignore
      } else if (a.tagName === 'LIT-TABLE-COLUMN') {
        // @ts-ignore
        area[y][x] = { x, y, t: key }; // @ts-ignore
        x++;
        let h: unknown = document.createElement('div'); // @ts-ignore
        h.classList.add('td'); // @ts-ignore
        if (i > 0) {
          let resizeDiv: HTMLDivElement = document.createElement('div');
          resizeDiv.classList.add('resize'); // @ts-ignore
          h.appendChild(resizeDiv); // @ts-ignore
          this.resizeEventHandler(rowElement, resizeDiv, i);
        } // @ts-ignore
        this.resolvingAreaColumnOrder(a, i, key, h); // @ts-ignore
        h.style.justifyContent = a.getAttribute('align'); // @ts-ignore
        this.gridTemplateColumns.push(a.getAttribute('width') || '1fr'); // @ts-ignore
        h.style.gridArea = key;
        let titleLabel = document.createElement('label'); // @ts-ignore
        titleLabel.textContent = a.title; // @ts-ignore
        h.appendChild(titleLabel); // @ts-ignore
        if (a.hasAttribute('fixed')) {
          // @ts-ignore
          fixed(h, a.getAttribute('fixed'), '#42b983');
        } // @ts-ignore
        rowElement.append(h);
      }
    });
  }

  resolvingAreaColumnOrder(column: unknown, index: number, key: string, head: unknown): void {
    // @ts-ignore
    if (column.hasAttribute('order')) {
      // @ts-ignore
      (head as unknown).sortType = 0; // @ts-ignore
      head.classList.add('td-order'); // @ts-ignore
      head.style.position = 'relative';
      let { upSvg, downSvg } = createDownUpSvg(index, head); // @ts-ignore
      head.onclick = (): void => {
        if (this.isResize || this.resizeColumnIndex !== -1) {
          return;
        }
        this?.shadowRoot?.querySelectorAll('.td-order svg').forEach((it: unknown) => {
          // @ts-ignore
          it.setAttribute('fill', 'let(--dark-color1,#212121)'); // @ts-ignore
          it.sortType = 0; // @ts-ignore
          it.style.display = 'none';
        }); // @ts-ignore
        if (head.sortType === undefined || head.sortType === null) {
          // @ts-ignore
          head.sortType = 0; // @ts-ignore
        } else if (head.sortType === 2) {
          // @ts-ignore
          head.sortType = 0;
        } else {
          // @ts-ignore
          head.sortType += 1;
        }
        upSvg.setAttribute('fill', 'let(--dark-color1,#212121)');
        downSvg.setAttribute('fill', 'let(--dark-color1,#212121)'); // @ts-ignore
        upSvg.style.display = head.sortType === 1 ? 'block' : 'none'; // @ts-ignore
        downSvg.style.display = head.sortType === 2 ? 'block' : 'none'; // @ts-ignore
        switch (head.sortType) {
          case 1:
            this.theadElement!.setAttribute('sort', '');
            break;
          case 2:
            break;
          default:
            this.theadElement!.removeAttribute('sort');
            break;
        }
        this.dispatchEvent(
          new CustomEvent('column-click', {
            detail: {
              // @ts-ignore
              sort: head.sortType,
              key: key,
            },
            composed: true,
          })
        );
      };
    }
  }

  private isResize: boolean = false;
  private resizeColumnIndex: number = -1;
  private resizeDownX: number = 0;
  private columnMinWidth: number = 50;
  private beforeResizeWidth: number = 0;

  resizeMouseMoveEventHandler(header: HTMLDivElement): void {
    header.addEventListener('mousemove', (event) => {
      if (this.isResize) {
        header.style.cursor = 'col-resize';
        let width = event.clientX - this.resizeDownX;
        let prePageWidth = Math.max(this.beforeResizeWidth + width, this.columnMinWidth);
        for (let i = 0; i < header.childNodes.length; i++) {
          let node = header.childNodes.item(i) as HTMLDivElement;
          this.gridTemplateColumns[i] = `${node.clientWidth}px`;
        }
        this.gridTemplateColumns[this.resizeColumnIndex - 1] = `${prePageWidth}px`;
        let lastNode = header.childNodes.item(header.childNodes.length - 1) as HTMLDivElement;
        let totalWidth = 0;
        this.gridTemplateColumns.forEach((it) => {
          totalWidth += parseInt(it);
        });
        totalWidth = Math.max(totalWidth, this.shadowRoot!.querySelector<HTMLDivElement>('.table')!.scrollWidth);
        this.gridTemplateColumns[this.gridTemplateColumns.length - 1] = `${totalWidth - lastNode.offsetLeft - 1}px`;
        header.style.gridTemplateColumns = this.gridTemplateColumns.join(' ');
        let preNode = header.childNodes.item(this.resizeColumnIndex - 1) as HTMLDivElement;
        preNode.style.width = `${prePageWidth}px`;
        this.shadowRoot!.querySelectorAll<HTMLDivElement>('.tr').forEach((tr) => {
          tr.style.gridTemplateColumns = this.gridTemplateColumns.join(' ');
        });
        event.preventDefault();
        event.stopPropagation();
      } else {
        header.style.cursor = 'pointer';
      }
    });
  }

  resizeEventHandler(header: HTMLDivElement, element: HTMLDivElement, index: number): void {
    this.resizeMouseMoveEventHandler(header);
    header.addEventListener('mouseup', (event) => {
      this.resizeDownX = 0;
      this.isResize = false;
      header.style.cursor = 'pointer';
      setTimeout(() => {
        this.resizeColumnIndex = -1;
      }, 100);
      event.stopPropagation();
      event.preventDefault();
    });
    header.addEventListener('mouseleave', (event) => {
      event.stopPropagation();
      event.preventDefault();
      this.isResize = false;
      this.resizeDownX = 0;
      this.resizeColumnIndex = -1;
      header.style.cursor = 'pointer';
    });
    element.addEventListener('mousedown', (event) => {
      if (event.button === 0) {
        this.resizeColumnIndex = index;
        this.isResize = true;
        this.resizeDownX = event.clientX;
        let pre = header.childNodes.item(this.resizeColumnIndex - 1) as HTMLDivElement;
        this.beforeResizeWidth = pre.clientWidth;
        event.stopPropagation();
      }
    });
    element.addEventListener('click', (event) => {
      event.stopPropagation();
    });
  }

  // Is called when the custom element is removed from the document DOM.
  disconnectedCallback(): void {}

  // It is called when the custom element is moved to a new document.
  adoptedCallback(): void {}

  // It is called when a custom element adds, deletes, or modifies its own properties.
  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {}

  meauseElementHeight(rowData: unknown): number {
    return 27;
  }

  meauseTreeElementHeight(rowData: unknown, depth: number): number {
    return 27;
  }

  meauseAllRowHeight(list: unknown[]): TableRowObject[] {
    this.tbodyElement!.innerHTML = '';
    this.meauseRowElement = undefined;
    this.startSkip = 0;
    let head = this.shadowRoot!.querySelector('.th');
    this.tbodyElement && (this.tbodyElement.style.width = head?.clientWidth + 'px');
    this.currentRecycleList = [];
    let headHeight = 0;
    let totalHeight = headHeight;
    let visibleObjects: TableRowObject[] = [];
    let itemHandler = (rowData: unknown, index: number): void => {
      let height = this.meauseElementHeight(rowData);
      let tableRowObject = new TableRowObject();
      tableRowObject.height = height;
      tableRowObject.top = totalHeight;
      tableRowObject.data = rowData;
      tableRowObject.rowIndex = index;
      if (
        Math.max(totalHeight, this.tableElement!.scrollTop + headHeight) <=
        Math.min(totalHeight + height, this.tableElement!.scrollTop + this.tableElement!.clientHeight + headHeight)
      ) {
        let newTableElement = this.createNewTableElement(tableRowObject);
        newTableElement.style.transform = `translateY(${totalHeight}px)`;
        this.tbodyElement?.append(newTableElement);
        this.currentRecycleList.push(newTableElement);
      }
      totalHeight += height;
      visibleObjects.push(tableRowObject);
    };
    let realIndex = 0;
    list.forEach((item, index) => {
      if (Array.isArray(item)) {
        item.forEach((rowData, childIndex) => {
          itemHandler(rowData, realIndex);
          realIndex++;
        });
      } else {
        itemHandler(item, index);
      }
    });
    this.tbodyElement && (this.tbodyElement.style.height = totalHeight + (this.isScrollXOutSide ? 0 : 0) + 'px');
    this.addOnScrollListener(visibleObjects);
    return visibleObjects;
  }

  addOnScrollListener(visibleObjList: TableRowObject[]): void {
    this.tableElement &&
      (this.tableElement.onscroll = (event): void => {
        let tblScrollTop = this.tableElement!.scrollTop;
        let skip = 0;
        for (let i = 0; i < visibleObjList.length; i++) {
          if (
            visibleObjList[i].top <= tblScrollTop &&
            visibleObjList[i].top + visibleObjList[i].height >= tblScrollTop
          ) {
            skip = i;
            break;
          }
        }
        let reduce = this.currentRecycleList.map((item) => item.clientHeight).reduce((a, b) => a + b, 0);
        if (reduce === 0) {
          return;
        }
        while (
          reduce <= this.tableElement!.clientHeight &&
          this.currentRecycleList.length + skip < visibleObjList.length
        ) {
          let newTableElement = this.createNewTableElement(visibleObjList[skip]);
          this.tbodyElement?.append(newTableElement);
          this.currentRecycleList.push(newTableElement);
          reduce += newTableElement.clientHeight;
        }
        this.startSkip = skip;
        for (let i = 0; i < this.currentRecycleList.length; i++) {
          this.freshCurrentLine(this.currentRecycleList[i], visibleObjList[i + skip]);
        }
      });
  }

  measureReset(): void {
    this.meauseRowElement = undefined;
    this.tbodyElement!.innerHTML = '';
    this.treeElement!.innerHTML = '';
    this.currentRecycleList = [];
    this.currentTreeDivList = [];
  }

  meauseTreeRowElement(list: unknown[]): TableRowObject[] {
    this.measureReset();
    let headHeight = this.theadElement?.clientHeight || 0;
    let totalHeight = 0;
    let visibleObjects: TableRowObject[] = [];
    let resetAllHeight = (list: unknown[], depth: number, parentNode?: TableRowObject): void => {
      list.forEach((item) => {
        let tableRowObject = new TableRowObject();
        tableRowObject.depth = depth;
        tableRowObject.data = item;
        tableRowObject.top = totalHeight;
        tableRowObject.height = this.meauseTreeElementHeight(tableRowObject, depth);
        if (parentNode !== undefined) {
          parentNode.children.push(tableRowObject);
        }
        let maxHeight = Math.max(totalHeight, this.tableElement!.scrollTop);
        let minHeight = Math.min(
          totalHeight + tableRowObject.height,
          this.tableElement!.scrollTop + this.tableElement!.clientHeight - headHeight
        );
        if (maxHeight <= minHeight) {
          let newTableElement = this.createNewTreeTableElement(tableRowObject); // @ts-ignore
          newTableElement.style.transform = `translateY(${totalHeight}px)`; // @ts-ignore
          this.tbodyElement?.append(newTableElement);
          if (this.treeElement?.lastChild) {
            (this.treeElement?.lastChild as HTMLElement).style.height = tableRowObject.height + 'px';
          } // @ts-ignore
          this.currentRecycleList.push(newTableElement);
        }
        totalHeight += tableRowObject.height;
        visibleObjects.push(tableRowObject); // @ts-ignore
        if (item.hasNext) {
          // @ts-ignore
          if (item.parents !== undefined && item.parents.length > 0 && item.status) {
            // @ts-ignore
            resetAllHeight(item.parents, depth + 1, tableRowObject); // @ts-ignore
          } else if (item.children !== undefined && item.children.length > 0 && item.status) {
            // @ts-ignore
            resetAllHeight(item.children, depth + 1, tableRowObject);
          }
        } else {
          // @ts-ignore
          if (item.children !== undefined && item.children.length > 0) {
            // @ts-ignore
            resetAllHeight(item.children, depth + 1, tableRowObject);
          }
        }
      });
    };
    resetAllHeight(list, 0);
    this.tbodyElement && (this.tbodyElement.style.height = totalHeight + 'px');
    this.treeElement!.style.height = this.tableElement!.clientHeight - this.theadElement!.clientHeight + 'px';
    this.addTreeRowScrollListener();
    return visibleObjects;
  }

  addTreeRowScrollListener(): void {
    this.tableElement &&
      (this.tableElement.onscroll = (event): void => {
        let visibleObjs = this.recycleDs.filter((item) => {
          // @ts-ignore
          return !item.rowHidden;
        });
        let top = this.tableElement!.scrollTop;
        this.treeElement!.style.transform = `translateY(${top}px)`;
        let skip = 0;
        for (let index = 0; index < visibleObjs.length; index++) {
          // @ts-ignore
          if (visibleObjs[index].top <= top && visibleObjs[index].top + visibleObjs[index].height >= top) {
            skip = index;
            break;
          }
        }
        let reduce = this.currentRecycleList.map((item) => item.clientHeight).reduce((a, b) => a + b, 0);
        if (reduce === 0) {
          return;
        }
        while (reduce <= this.tableElement!.clientHeight) {
          // @ts-ignore
          let newTableElement = this.createNewTreeTableElement(visibleObjs[skip]); // @ts-ignore
          this.tbodyElement?.append(newTableElement);
          if (this.treeElement?.lastChild) {
            // @ts-ignore
            (this.treeElement?.lastChild as HTMLElement).style.height = visibleObjs[skip].height + 'px';
          } // @ts-ignore
          this.currentRecycleList.push(newTableElement); // @ts-ignore
          reduce += newTableElement.clientHeight;
        }
        for (let i = 0; i < this.currentRecycleList.length; i++) {
          this.freshCurrentLine(
            this.currentRecycleList[i], // @ts-ignore
            visibleObjs[i + skip],
            this.treeElement?.children[i] as HTMLElement
          );
        }
      });
  }

  createNewTreeTableElement(rowData: TableRowObject): unknown {
    let newTableElement = document.createElement('div');
    newTableElement.classList.add('tr');
    let treeTop = 0;
    if (this.treeElement!.children?.length > 0) {
      let transX = Number((this.treeElement?.lastChild as HTMLElement).style.transform.replace(/[^0-9]/gi, ''));
      treeTop += transX + rowData.height;
    }
    this?.columns?.forEach((column: unknown, index) => {
      // @ts-ignore
      let dataIndex = column.getAttribute('data-index') || '1';
      let td: unknown;
      if (index === 0) {
        td = this.firstElementTdHandler(newTableElement, dataIndex, rowData, column);
      } else {
        td = this.otherElementHandler(dataIndex, rowData, column); // @ts-ignore
        newTableElement.append(td);
      }
    });
    let lastChild = this.treeElement?.lastChild as HTMLElement;
    if (lastChild) {
      lastChild.style.transform = `translateY(${treeTop}px)`;
    } // @ts-ignore
    (newTableElement as unknown).data = rowData.data;
    newTableElement.style.gridTemplateColumns = this.gridTemplateColumns.join(' ');
    newTableElement.style.position = 'absolute';
    newTableElement.style.top = '0px';
    newTableElement.style.left = '0px';
    newTableElement.style.cursor = 'pointer'; //@ts-ignore
    this.setHighLight(rowData.data.isSearch, newTableElement);
    this.addRowElementEvent(newTableElement, rowData);
    return newTableElement;
  }

  addRowElementEvent(newTableElement: HTMLDivElement, rowData: unknown): void {
    newTableElement.onmouseenter = (): void => {
      // @ts-ignore
      if ((newTableElement as unknown).data.isSelected) {
        return;
      }
      let indexOf = this.currentRecycleList.indexOf(newTableElement);
      this.currentTreeDivList.forEach((row) => {
        row.classList.remove('mouse-in');
      });
      if (indexOf >= 0 && indexOf < this.treeElement!.children.length) {
        this.setMouseIn(true, [this.treeElement?.children[indexOf] as HTMLElement]);
      }
    };
    newTableElement.onmouseleave = (): void => {
      // @ts-ignore
      if ((newTableElement as unknown).data.isSelected) {
        return;
      }
      let indexOf = this.currentRecycleList.indexOf(newTableElement);
      if (indexOf >= 0 && indexOf < this.treeElement!.children.length) {
        this.setMouseIn(false, [this.treeElement?.children[indexOf] as HTMLElement]);
      }
    };
    newTableElement.onclick = (e): void => {
      let indexOf = this.currentRecycleList.indexOf(newTableElement);
      this.dispatchRowClickEvent(rowData, [this.treeElement?.children[indexOf] as HTMLElement, newTableElement]);
    };
  }

  firstElementTdHandler(
    newTableElement: HTMLDivElement,
    dataIndex: string,
    rowData: unknown,
    column: unknown
  ): HTMLDivElement {
    let td: unknown; // @ts-ignore
    let text = formatName(dataIndex, rowData.data[dataIndex], this); // @ts-ignore
    if (column.template) {
      // @ts-ignore
      td = column.template.render(rowData.data).content.cloneNode(true); // @ts-ignore
      td.template = column.template; // @ts-ignore
      td.title = text;
    } else {
      td = document.createElement('div'); // @ts-ignore
      td.innerHTML = text; // @ts-ignore
      td.dataIndex = dataIndex; // @ts-ignore
      td.title = text;
    } // @ts-ignore
    if (rowData.data.children && rowData.data.children.length > 0 && !rowData.data.hasNext) {
      let btn = this.createExpandBtn(rowData); // @ts-ignore
      td.insertBefore(btn, td.firstChild);
    } // @ts-ignore
    if (rowData.data.hasNext) {
      // @ts-ignore
      td.title = rowData.data.objectName;
      let btn = this.createBtn(rowData); // @ts-ignore
      td.insertBefore(btn, td.firstChild);
    } // @ts-ignore
    td.style.paddingLeft = rowData.depth * iconWidth + 'px'; // @ts-ignore
    if (!rowData.data.children || rowData.data.children.length === 0) {
      // @ts-ignore
      td.style.paddingLeft = iconWidth * rowData.depth + iconWidth + iconPadding * 2 + 'px';
    } // @ts-ignore
    (td as unknown).data = rowData.data; // @ts-ignore
    td.classList.add('tree-first-body'); // @ts-ignore
    td.style.position = 'absolute'; // @ts-ignore
    td.style.top = '0px'; // @ts-ignore
    td.style.left = '0px'; // @ts-ignore
    this.addFirstElementEvent(td, newTableElement, rowData); // @ts-ignore
    this.setHighLight(rowData.data.isSearch, td); // @ts-ignore
    this.treeElement!.style.width = column.getAttribute('width'); // @ts-ignore
    this.treeElement?.append(td); // @ts-ignore
    this.currentTreeDivList.push(td); // @ts-ignore
    return td;
  }

  addFirstElementEvent(td: HTMLDivElement, tr: HTMLDivElement, rowData: unknown): void {
    td.onmouseenter = (): void => {
      let indexOf = this.currentTreeDivList.indexOf(td);
      this.currentRecycleList.forEach((row) => {
        row.classList.remove('mouse-in');
      });
      if (indexOf >= 0 && indexOf < this.currentRecycleList.length && td.innerHTML !== '') {
        this.setMouseIn(true, [td]);
      }
    };
    td.onmouseleave = (): void => {
      let indexOf = this.currentTreeDivList.indexOf(td);
      if (indexOf >= 0 && indexOf < this.currentRecycleList.length) {
        this.setMouseIn(false, [td]);
      }
    };
    td.onclick = (): void => {
      let indexOf = this.currentTreeDivList.indexOf(td);
      this.dispatchRowClickEvent(rowData, [td, tr]);
    };
  }

  otherElementHandler(dataIndex: string, rowData: unknown, column: unknown): HTMLDivElement {
    // @ts-ignore
    let text = formatName(dataIndex, rowData.data[dataIndex], this);
    let td: unknown = document.createElement('div');
    td = document.createElement('div'); // @ts-ignore
    td.classList.add('td'); // @ts-ignore
    td.style.overflow = 'hidden'; // @ts-ignore
    td.style.textOverflow = 'ellipsis'; // @ts-ignore
    td.style.whiteSpace = 'nowrap'; // @ts-ignore
    td.title = text; // @ts-ignore
    td.dataIndex = dataIndex; // @ts-ignore
    td.style.justifyContent = column.getAttribute('align') || 'flex-start'; // @ts-ignore
    if (column.template) {
      // @ts-ignore
      td.appendChild(column.template.render(rowData.data).content.cloneNode(true)); // @ts-ignore
      td.template = column.template;
    } else {
      // @ts-ignore
      td.innerHTML = text;
    } // @ts-ignore
    return td;
  }

  createBtn(row: unknown): unknown {
    let btn: unknown = document.createElement('lit-icon'); // @ts-ignore
    btn.classList.add('tree-icon'); // @ts-ignore
    if (row.data.expanded) {
      // @ts-ignore
      btn.name = 'plus-square';
    } else {
      // @ts-ignore
      btn.name = 'minus-square';
    } // @ts-ignore
    btn.addEventListener('click', (e: unknown) => {
      // @ts-ignore
      row.data.status = false;
      const resetNodeHidden = (hidden: boolean, rowData: unknown): void => {
        if (hidden) {
          // @ts-ignore
          rowData.children.forEach((child: unknown) => {
            // @ts-ignore
            child.rowHidden = false;
          });
        } else {
          // @ts-ignore
          rowData.children.forEach((child: unknown) => {
            // @ts-ignore
            child.rowHidden = true;
            resetNodeHidden(hidden, child);
          });
        }
      };
      // @ts-ignore
      if (row.data.expanded) {
        // @ts-ignore
        row.data.status = true;
        this.dispatchRowClickEventIcon(row, [btn]); // @ts-ignore
        row.data.expanded = false;
        resetNodeHidden(true, row);
      } else {
        // @ts-ignore
        row.data.expanded = true; // @ts-ignore
        row.data.status = false;
        resetNodeHidden(false, row);
      }
      this.reMeauseHeight(); // @ts-ignore
      e.stopPropagation();
    });
    return btn;
  }

  createExpandBtn(row: unknown): LitIcon {
    let btn: unknown = document.createElement('lit-icon'); // @ts-ignore
    btn.classList.add('tree-icon');
    // @ts-ignore
    if (row.expanded) {
      // @ts-ignore
      btn.name = 'minus-square';
    } else {
      // @ts-ignore
      btn.name = 'plus-square';
    } // @ts-ignore
    btn.onclick = (e: Event): void => {
      const resetNodeHidden = (hidden: boolean, rowData: unknown): void => {
        // @ts-ignore
        if (rowData.children.length > 0) {
          if (hidden) {
            // @ts-ignore
            rowData.children.forEach((child: unknown) => {
              // @ts-ignore
              child.rowHidden = true;
              resetNodeHidden(hidden, child);
            });
          } else {
            // @ts-ignore
            rowData.children.forEach((child: unknown) => {
              // @ts-ignore
              child.rowHidden = !rowData.expanded; // @ts-ignore
              if (rowData.expanded) {
                resetNodeHidden(hidden, child);
              }
            });
          }
        }
      };
      // @ts-ignore
      if (row.expanded) {
        // @ts-ignore
        row.expanded = false;
        resetNodeHidden(true, row);
      } else {
        // @ts-ignore
        row.expanded = true;
        resetNodeHidden(false, row);
      }
      this.reMeauseHeight();
      e.stopPropagation();
    }; // @ts-ignore
    return btn;
  }

  getVisibleObjs(): { visibleObjs: unknown[]; skip: number; reduce: number } {
    let totalH = 0;
    this.recycleDs.forEach((it) => {
      // @ts-ignore
      if (!it.rowHidden) {
        // @ts-ignore
        it.top = totalH; // @ts-ignore
        totalH += it.height;
      }
    });
    this.tbodyElement && (this.tbodyElement.style.height = totalH + (this.isScrollXOutSide ? 0 : 0) + 'px');
    this.treeElement!.style.height = this.tableElement!.clientHeight - this.theadElement!.clientHeight + 'px';
    let visibleObjs = this.recycleDs.filter((item) => {
      // @ts-ignore
      return !item.rowHidden;
    });
    let top = this.tableElement!.scrollTop;
    let skip = 0;
    for (let i = 0; i < visibleObjs.length; i++) {
      // @ts-ignore
      if (visibleObjs[i].top <= top && visibleObjs[i].top + visibleObjs[i].height >= top) {
        skip = i;
        break;
      }
    }
    let reduce = this.currentRecycleList.map((item) => item.clientHeight).reduce((a, b) => a + b, 0);
    return { visibleObjs, skip, reduce };
  }

  reMeauseHeight(): void {
    if (this.currentRecycleList.length === 0) {
      return;
    }
    let { visibleObjs, skip, reduce } = this.getVisibleObjs();
    if (reduce === 0) {
      return;
    }
    while (reduce <= this.tableElement!.clientHeight + 1) {
      let rowElement;
      if (this.hasAttribute('tree')) {
        // @ts-ignore
        rowElement = this.createNewTreeTableElement(visibleObjs[skip]);
      } else {
        rowElement = this.createNewTableElement(visibleObjs[skip]);
      } // @ts-ignore
      this.tbodyElement?.append(rowElement);
      if (this.hasAttribute('tree')) {
        if (this.treeElement?.lastChild) {
          // @ts-ignore
          (this.treeElement?.lastChild as HTMLElement).style.height = visibleObjs[skip].height + 'px';
        }
      } // @ts-ignore
      this.currentRecycleList.push(rowElement); // @ts-ignore
      reduce += rowElement.clientHeight;
    }
    for (let i = 0; i < this.currentRecycleList.length; i++) {
      if (this.hasAttribute('tree')) {
        this.freshCurrentLine(
          this.currentRecycleList[i], // @ts-ignore
          visibleObjs[i + skip],
          this.treeElement?.children[i] as HTMLElement
        );
      } else {
        // @ts-ignore
        this.freshCurrentLine(this.currentRecycleList[i], visibleObjs[i + skip]);
      }
    }
  }

  createNewTableElement(rowData: unknown): HTMLDivElement {
    let rowElement = document.createElement('div');
    rowElement.classList.add('tr');
    this?.columns?.forEach((column: unknown) => {
      // @ts-ignore
      let dataIndex = column.getAttribute('data-index') || '1';
      let td: unknown;
      td = document.createElement('div'); // @ts-ignore
      td.classList.add('td'); // @ts-ignore
      td.style.overflow = 'hidden'; // @ts-ignore
      td.style.textOverflow = 'ellipsis'; // @ts-ignore
      td.style.whiteSpace = 'nowrap'; // @ts-ignore
      td.dataIndex = dataIndex; // @ts-ignore
      td.style.justifyContent = column.getAttribute('align') || 'flex-start'; // @ts-ignore
      let text = formatName(dataIndex, rowData.data[dataIndex], this); // @ts-ignore
      td.title = text; // @ts-ignore
      if (column.template) {
        // @ts-ignore
        td.appendChild(column.template.render(rowData.data).content.cloneNode(true)); // @ts-ignore
        td.template = column.template;
      } else {
        // @ts-ignore
        td.innerHTML = text;
      } // @ts-ignore
      rowElement.append(td);
    });
    rowElement.onclick = (): void => {
      this.dispatchRowClickEvent(rowData, [rowElement]);
    };
    rowElement.onmouseover = (): void => {
      this.dispatchRowHoverEvent(rowData, [rowElement]);
    }; // @ts-ignore
    if (rowData.data.isSelected !== undefined) {
      // @ts-ignore
      this.setSelectedRow(rowData.data.isSelected, [rowElement]);
    } // @ts-ignore
    (rowElement as unknown).data = rowData.data;
    rowElement.style.cursor = 'pointer';
    rowElement.style.gridTemplateColumns = this.gridTemplateColumns.join(' ');
    rowElement.style.position = 'absolute';
    rowElement.style.top = '0px';
    rowElement.style.left = '0px'; // @ts-ignore
    rowElement.style.height = `${rowData.height}px`;
    if (this.getItemTextColor) {
      // @ts-ignore
      rowElement.style.color = this.getItemTextColor(rowData.data);
    }
    return rowElement;
  }

  freshCurrentLine(element: HTMLElement, rowObject: TableRowObject, firstElement?: HTMLElement): void {
    if (!rowObject) {
      if (firstElement) {
        firstElement.style.display = 'none';
      }
      element.style.display = 'none';
      return;
    }
    let childIndex = -1; //@ts-ignore
    this.setHighLight(rowObject.data.isSearch, element);
    element.childNodes.forEach((child) => {
      if (child.nodeType !== 1) {
        return;
      }
      childIndex++;
      let idx = firstElement !== undefined ? childIndex + 1 : childIndex;
      this.freshLineFirstElementHandler(firstElement, rowObject, childIndex);
      //@ts-ignore
      let dataIndex = this.columns![idx].getAttribute('data-index') || '1'; //@ts-ignore
      let text = formatName(dataIndex, rowObject.data[dataIndex], this); // @ts-ignore
      if ((this.columns![idx] as unknown).template) {
        (child as HTMLElement).innerHTML = '';
        (child as HTMLElement).appendChild(
          // @ts-ignore
          (this.columns![idx] as unknown).template.render(rowObject.data).content.cloneNode(true)
        );
        // @ts-ignore
        (child as HTMLElement).title = text;
      } else {
        //@ts-ignore
        (child as HTMLElement).innerHTML = text; //@ts-ignore
        (child as HTMLElement).title = text;
      }
    });
    this.freshLineStyleAndEvents(element, rowObject, firstElement);
  }

  freshLineFirstElementHandler(rowFirstElement: unknown, rowObject: TableRowObject, childIndex: number): void {
    if (rowFirstElement !== undefined && childIndex === 0) {
      //@ts-ignore
      this.setHighLight(rowObject.data.isSearch, rowFirstElement); // @ts-ignore
      (rowFirstElement as unknown).data = rowObject.data; // @ts-ignore
      if ((this.columns![0] as unknown).template) {
        // @ts-ignore
        rowFirstElement.innerHTML = (this.columns![0] as unknown).template
          .render(rowObject.data)
          .content.cloneNode(true).innerHTML;
      } else {
        let dataIndex = this.columns![0].getAttribute('data-index') || '1'; //@ts-ignore
        let text = formatName(dataIndex, rowObject.data[dataIndex], this); // @ts-ignore
        rowFirstElement.innerHTML = text; // @ts-ignore
        rowFirstElement.title = text;
      } //@ts-ignore
      if (rowObject.children && rowObject.children.length > 0 && !rowObject.data.hasNext) {
        let btn = this.createExpandBtn(rowObject); // @ts-ignore
        rowFirstElement.insertBefore(btn, rowFirstElement.firstChild);
      } // @ts-ignore
      rowFirstElement.style.paddingLeft = iconWidth * rowObject.depth + 'px';
      if (!rowObject.children || rowObject.children.length === 0) {
        // @ts-ignore
        rowFirstElement.style.paddingLeft = iconWidth * rowObject.depth + iconWidth + iconPadding * 2 + 'px';
      } //@ts-ignore
      if (rowObject.data.hasNext) {
        let btn = this.createBtn(rowObject); // @ts-ignore
        rowFirstElement.title = rowObject.data.objectName; // @ts-ignore
        rowFirstElement.insertBefore(btn, rowFirstElement.firstChild); // @ts-ignore
        rowFirstElement.style.paddingLeft = iconWidth * rowObject.depth + 'px';
      } // @ts-ignore
      rowFirstElement.onclick = (): void => {
        this.dispatchRowClickEvent(rowObject, [rowFirstElement, element]);
      }; // @ts-ignore
      rowFirstElement.style.transform = `translateY(${rowObject.top - this.tableElement!.scrollTop}px)`; //@ts-ignore
      if (rowObject.data.isSelected !== undefined) {
        //@ts-ignore
        this.setSelectedRow(rowObject.data.isSelected, [rowFirstElement]);
      } else {
        this.setSelectedRow(false, [rowFirstElement]);
      }
    }
  }

  freshLineStyleAndEvents(element: HTMLElement, rowData: TableRowObject, firstElement?: HTMLElement): void {
    if (element.style.display === 'none') {
      element.style.display = 'grid';
    }
    element.style.transform = `translateY(${rowData.top}px)`;
    if (firstElement && firstElement.style.display === 'none') {
      firstElement.style.display = 'flex';
    }
    element.onclick = (e): void => {
      if (firstElement !== undefined) {
        this.dispatchRowClickEvent(rowData, [firstElement, element]);
      } else {
        this.dispatchRowClickEvent(rowData, [element]);
      }
    };
    element.onmouseenter = (): void => {
      this.dispatchRowHoverEvent(rowData, [element]);
    };
    // @ts-ignore
    (element as unknown).data = rowData.data; //@ts-ignore
    if (rowData.data.isSelected !== undefined) {
      //@ts-ignore
      this.setSelectedRow(rowData.data.isSelected, [element]);
    } else {
      this.setSelectedRow(false, [element]);
    } //@ts-ignore
    if (rowData.data.isHover !== undefined) {
      //@ts-ignore
      this.setMouseIn(rowData.data.isHover, [element]);
    } else {
      this.setMouseIn(false, [element]);
    }
    if (this.getItemTextColor) {
      // @ts-ignore
      element.style.color = this.getItemTextColor((element as unknown).data);
    }
  }

  setSelectedRow(isSelected: boolean, rows: unknown[]): void {
    if (isSelected) {
      rows.forEach((row) => {
        // @ts-ignore
        if (row.classList.contains('mouse-in')) {
          // @ts-ignore
          row.classList.remove('mouse-in');
        } // @ts-ignore
        row.classList.add('mouse-select');
      });
    } else {
      rows.forEach((row) => {
        // @ts-ignore
        row.classList.remove('mouse-select');
      });
    }
  }

  setMouseIn(isMouseIn: boolean, rows: unknown[]): void {
    if (isMouseIn) {
      rows.forEach((row) => {
        // @ts-ignore
        row.classList.add('mouse-in');
      });
    } else {
      rows.forEach((row) => {
        // @ts-ignore
        row.classList.remove('mouse-in');
      });
    }
  }

  scrollToData(data: unknown): void {
    if (this.recycleDs.length > 0) {
      let filter = this.recycleDs.filter((item) => {
        // @ts-ignore
        return item.data === data;
      });
      if (filter.length > 0) {
        // @ts-ignore
        this.tableElement!.scrollTop = filter[0].top;
      }
      this.setCurrentSelection(data);
    }
  }

  expandList(datasource: unknown[]): void {
    let source = this.recycleDs.filter((item) => {
      // @ts-ignore
      return datasource.indexOf(item.data) !== -1;
    });
    if (source.length > 0) {
      source.forEach((item) => {
        // @ts-ignore
        item.expanded = true; // @ts-ignore
        item.rowHidden = false;
      });
    }
    this.reMeauseHeight();
  }

  clearAllSelection(rowObjectData: unknown = undefined): void {
    this.recycleDs.forEach((item) => {
      // @ts-ignore
      if (rowObjectData || (item.data !== rowObjectData && item.data.isSelected)) {
        // @ts-ignore
        item.data.isSelected = false;
      }
    });
    this.setSelectedRow(false, this.currentTreeDivList);
    this.setSelectedRow(false, this.currentRecycleList);
  }

  clearAllHover(rowObjectData: unknown): void {
    this.recycleDs.forEach((item) => {
      // @ts-ignore
      if (item.data !== rowObjectData && item.data.isHover) {
        // @ts-ignore
        item.data.isHover = false;
      }
    });
    this.setMouseIn(false, this.currentTreeDivList);
    this.setMouseIn(false, this.currentRecycleList);
  }

  mouseOut(): void {
    // @ts-ignore
    this.recycleDs.forEach((item) => (item.data.isHover = false));
    this.setMouseIn(false, this.currentTreeDivList);
    this.setMouseIn(false, this.currentRecycleList);
    this.dispatchEvent(
      new CustomEvent('row-hover', {
        detail: {
          data: undefined,
        },
        composed: true,
      })
    );
  }

  setCurrentSelection(data: unknown): void {
    // @ts-ignore
    if (data.isSelected !== undefined) {
      this.currentTreeDivList.forEach((item) => {
        // @ts-ignore
        if ((item as unknown).data === data) {
          // @ts-ignore
          this.setSelectedRow(data.isSelected, [item]);
        }
      });
      this.currentRecycleList.forEach((item) => {
        // @ts-ignore
        if ((item as unknown).data === data) {
          // @ts-ignore
          this.setSelectedRow(data.isSelected, [item]);
        }
      });
    }
  }

  setCurrentHover(data: unknown): void {
    this.setMouseIn(false, this.currentTreeDivList);
    this.setMouseIn(false, this.currentRecycleList); // @ts-ignore
    if (data.isHover !== undefined) {
      this.currentTreeDivList.forEach((item) => {
        // @ts-ignore
        if ((item as unknown).data === data) {
          // @ts-ignore
          this.setMouseIn(data.isHover, [item]);
        }
      });
      this.currentRecycleList.forEach((item) => {
        // @ts-ignore
        if ((item as unknown).data === data) {
          // @ts-ignore
          this.setMouseIn(data.isHover, [item]);
        }
      });
    }
  }

  dispatchRowClickEventIcon(rowObject: unknown, elements: unknown[]): void {
    this.dispatchEvent(
      new CustomEvent('icon-click', {
        detail: {
          // @ts-ignore
          ...rowObject.data, // @ts-ignore
          data: rowObject.data,
          callBack: (isSelected: boolean): void => {
            //是否爲单选
            if (isSelected) {
              // @ts-ignore
              this.clearAllSelection(rowObject.data);
            } // @ts-ignore
            this.setSelectedRow(rowObject.data.isSelected, elements);
          },
        },
        composed: true,
      })
    );
  }

  dispatchRowClickEvent(rowObject: unknown, elements: unknown[]): void {
    this.dispatchEvent(
      new CustomEvent('row-click', {
        detail: {
          // @ts-ignore
          ...rowObject.data, // @ts-ignore
          data: rowObject.data,
          callBack: (isSelected: boolean): void => {
            //是否爲单选
            if (isSelected) {
              // @ts-ignore
              this.clearAllSelection(rowObject.data);
            }
            // @ts-ignore
            rowObject.data.isSelected = true;
            // @ts-ignore
            this.setSelectedRow(rowObject.data.isSelected, elements);
          },
        },
        composed: true,
      })
    );
  }

  dispatchRowHoverEvent(rowObject: unknown, elements: unknown[]): void {
    this.dispatchEvent(
      new CustomEvent('row-hover', {
        detail: {
          // @ts-ignore
          data: rowObject.data,
          callBack: (): void => {
            // @ts-ignore
            this.clearAllHover(rowObject.data); // @ts-ignore
            this.setMouseIn(rowObject.data.isHover, elements);
          },
        },
        composed: true,
      })
    );
  }
  setHighLight(isSearch: boolean, element: unknown): void {
    if (isSearch) {
      // @ts-ignore
      element.setAttribute('high-light', '');
    } else {
      // @ts-ignore
      element.removeAttribute('high-light');
    }
  }
}

if (!customElements.get('lit-page-table')) {
  customElements.define('lit-page-table', LitPageTable);
}
