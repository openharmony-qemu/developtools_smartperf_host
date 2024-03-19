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
  exportData, fixed,
  formatExportData,
  formatName,
  iconPadding,
  iconWidth,
  litPageTableHtml
} from './LitTableHtml';

@element('lit-page-table')
export class LitPageTable extends BaseElement {
  meauseRowElement: HTMLDivElement | undefined;
  currentRecycleList: HTMLDivElement[] = [];
  currentTreeDivList: HTMLDivElement[] = [];
  public rememberScrollTop = false;
  public getItemTextColor?: (data: any) => string;
  public itemTextHandleMap: Map<string, (value: any) => string> = new Map<string, (value: any) => string>();
  public exportLoading: boolean = false;
  public exportTextHandleMap: Map<string, (value: any) => string> = new Map<string, (value: any) => string>();
  public ds: Array<any> = [];
  public recycleDs: Array<any> = [];
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

  static get observedAttributes() {
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

  get hideDownload() {
    return this.hasAttribute('hideDownload');
  }

  set hideDownload(value) {
    if (value) {
      this.setAttribute('hideDownload', '');
    } else {
      this.removeAttribute('hideDownload');
    }
  }

  get selectable() {
    return this.hasAttribute('selectable');
  }

  set selectable(value) {
    if (value) {
      this.setAttribute('selectable', '');
    } else {
      this.removeAttribute('selectable');
    }
  }

  get scrollY() {
    return this.getAttribute('scroll-y') || 'auto';
  }

  set scrollY(value) {
    this.setAttribute('scroll-y', value);
  }
  get recycleDataSource() {
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

  get pagination() {
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
  }

  initPageEventListener(): void {
    this.previousDiv!.onclick = () => {
      if (this.currentPage > 0) {
        this.currentPage = Math.max(this.currentPage - 1, 0);
        this.showCurrentPageData();
      }
    };
    this.nextDiv!.onclick = () => {
      if (this.currentPage < this.ds.length - 1) {
        this.currentPage = Math.min(this.currentPage + 1, this.ds.length - 1);
        this.showCurrentPageData();
      }
    };
    this.jumpDiv!.onclick = () => {
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

  toTop() {
    if (this.rememberScrollTop) {
      this.tableElement!.scrollTop = 0;
      this.tableElement!.scrollLeft = 0;
    } else {
      this.tableElement!.scrollTop = 0;
      this.tableElement!.scrollLeft = 0;
    }
  }

  showCurrentPageData() {
    this.toTop();
    this.currentPageDiv!.textContent = `第 ${(this.currentPage || 0) + 1} 页，共 ${this.ds.length} 页`;
    if (this.hasAttribute('tree')) {
      this.recycleDs = this.meauseTreeRowElement(this.ds[this.currentPage]);
    } else {
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

  formatExportData(dataSource: any[]): any[] {
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
        let pageArea: Array<any> = [];
        addSelectAllBox(rowElement, this);
        this.resolvingArea(this.columns, 0, 0, pageArea, rowElement);
        pageArea.forEach((rows, j, array) => {
          for (let i = 0; i < this.colCount; i++) {
            if (!rows[i]) rows[i] = array[j - 1][i];
          }
        });
        if (this.selectable) {
          let s = pageArea.map((a) => '"_checkbox_ ' + a.map((aa: any) => aa.t).join(' ') + '"').join(' ');
          rowElement.style.gridTemplateColumns = '60px ' + this.gridTemplateColumns.join(' ');
          rowElement.style.gridTemplateRows = `repeat(${pageArea.length},1fr)`;
          rowElement.style.gridTemplateAreas = s;
        } else {
          let s = pageArea.map((a) => '"' + a.map((aa: any) => aa.t).join(' ') + '"').join(' ');
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

  resolvingArea(columns: any, x: any, y: any, area: Array<any>, rowElement: HTMLDivElement) {
    columns.forEach((a: any, i: any) => {
      if (!area[y]) area[y] = [];
      let key = a.getAttribute('key') || a.getAttribute('title');
      if (a.tagName === 'LIT-TABLE-GROUP') {
        let childList = [...a.children].filter((a) => a.tagName !== 'TEMPLATE');
        let len = a.querySelectorAll('lit-table-column').length;
        if (childList.length > 0) {
          this.resolvingArea(childList, x, y + 1, area, rowElement);
        }
        for (let j = 0; j < len; j++) {
          area[y][x] = { x, y, t: key };
          x++;
        }
        let head = document.createElement('div');
        head.classList.add('td');
        head.style.justifyContent = a.getAttribute('align');
        head.style.borderBottom = '1px solid #f0f0f0';
        head.style.gridArea = key;
        head.innerText = a.title;
        if (a.hasAttribute('fixed')) {
          fixed(head, a.getAttribute('fixed'), '#42b983');
        }
        rowElement.append(head);
      } else if (a.tagName === 'LIT-TABLE-COLUMN') {
        area[y][x] = { x, y, t: key };
        x++;
        let h: any = document.createElement('div');
        h.classList.add('td');
        if (i > 0) {
          let resizeDiv: HTMLDivElement = document.createElement('div');
          resizeDiv.classList.add('resize');
          h.appendChild(resizeDiv);
          this.resizeEventHandler(rowElement, resizeDiv, i);
        }
        this.resolvingAreaColumnOrder(a, i, key, h);
        h.style.justifyContent = a.getAttribute('align');
        this.gridTemplateColumns.push(a.getAttribute('width') || '1fr');
        h.style.gridArea = key;
        let titleLabel = document.createElement('label');
        titleLabel.textContent = a.title;
        h.appendChild(titleLabel);
        if (a.hasAttribute('fixed')) {
          fixed(h, a.getAttribute('fixed'), '#42b983');
        }
        rowElement.append(h);
      }
    });
  };

  resolvingAreaColumnOrder(column: any, index: number, key: string,head: any): void {
    if (column.hasAttribute('order')) {
      (head as any).sortType = 0;
      head.classList.add('td-order');
      head.style.position = 'relative';
      let { upSvg, downSvg } = createDownUpSvg(index, head);
      head.onclick = () => {
        if (this.isResize || this.resizeColumnIndex !== -1) {
          return;
        }
        this?.shadowRoot?.querySelectorAll('.td-order svg').forEach((it: any) => {
          it.setAttribute('fill', 'let(--dark-color1,#212121)');
          it.sortType = 0;
          it.style.display = 'none';
        });
        if (head.sortType == undefined || head.sortType == null) {
          head.sortType = 0;
        } else if (head.sortType === 2) {
          head.sortType = 0;
        } else {
          head.sortType += 1;
        }
        upSvg.setAttribute('fill', 'let(--dark-color1,#212121)');
        downSvg.setAttribute('fill', 'let(--dark-color1,#212121)');
        upSvg.style.display = head.sortType === 1 ? 'block' : 'none';
        downSvg.style.display = head.sortType === 2 ? 'block' : 'none';
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

  resizeMouseMoveEventHandler(header: HTMLDivElement) {
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
      this.resizeColumnIndex = index;
      this.isResize = true;
      this.resizeDownX = event.clientX;
      let pre = header.childNodes.item(this.resizeColumnIndex - 1) as HTMLDivElement;
      this.beforeResizeWidth = pre.clientWidth;
      event.stopPropagation();
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

  meauseElementHeight(rowData: any): number {
    return 27;
  }

  meauseTreeElementHeight(rowData: any, depth: number): number {
    return 27;
  }

  meauseAllRowHeight(list: any[]): TableRowObject[] {
    this.tbodyElement!.innerHTML = '';
    this.meauseRowElement = undefined;
    this.startSkip = 0;
    let head = this.shadowRoot!.querySelector('.th');
    this.tbodyElement && (this.tbodyElement.style.width = head?.clientWidth + 'px');
    this.currentRecycleList = [];
    let headHeight = 0;
    let totalHeight = headHeight;
    let visibleObjects: TableRowObject[] = [];
    let itemHandler = (rowData: any, index: number) => {
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
    (this.tableElement.onscroll = (event) => {
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
      if (reduce == 0) {
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

  meauseTreeRowElement(list: any[]): TableRowObject[] {
    this.measureReset();
    let headHeight = this.theadElement?.clientHeight || 0;
    let totalHeight = 0;
    let visibleObjects: TableRowObject[] = [];
    let resetAllHeight = (list: any[], depth: number, parentNode?: TableRowObject) => {
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
          let newTableElement = this.createNewTreeTableElement(tableRowObject);
          newTableElement.style.transform = `translateY(${totalHeight}px)`;
          this.tbodyElement?.append(newTableElement);
          if (this.treeElement?.lastChild) {
            (this.treeElement?.lastChild as HTMLElement).style.height = tableRowObject.height + 'px';
          }
          this.currentRecycleList.push(newTableElement);
        }
        totalHeight += tableRowObject.height;
        visibleObjects.push(tableRowObject);
        if (item.hasNext) {
          if (item.parents != undefined && item.parents.length > 0 && item.status) {
            resetAllHeight(item.parents, depth + 1, tableRowObject);
          } else if (item.children != undefined && item.children.length > 0 && item.status) {
            resetAllHeight(item.children, depth + 1, tableRowObject);
          }
        } else {
          if (item.children !== undefined && item.children.length > 0) {
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
    (this.tableElement.onscroll = (event) => {
      let visibleObjs = this.recycleDs.filter((item) => {
        return !item.rowHidden;
      });
      let top = this.tableElement!.scrollTop;
      this.treeElement!.style.transform = `translateY(${top}px)`;
      let skip = 0;
      for (let index = 0; index < visibleObjs.length; index++) {
        if (visibleObjs[index].top <= top && visibleObjs[index].top + visibleObjs[index].height >= top) {
          skip = index;
          break;
        }
      }
      let reduce = this.currentRecycleList.map((item) => item.clientHeight).reduce((a, b) => a + b, 0);
      if (reduce == 0) {
        return;
      }
      while (reduce <= this.tableElement!.clientHeight) {
        let newTableElement = this.createNewTreeTableElement(visibleObjs[skip]);
        this.tbodyElement?.append(newTableElement);
        if (this.treeElement?.lastChild) {
          (this.treeElement?.lastChild as HTMLElement).style.height = visibleObjs[skip].height + 'px';
        }
        this.currentRecycleList.push(newTableElement);
        reduce += newTableElement.clientHeight;
      }
      for (let i = 0; i < this.currentRecycleList.length; i++) {
        this.freshCurrentLine(
          this.currentRecycleList[i],
          visibleObjs[i + skip],
          this.treeElement?.children[i] as HTMLElement
        );
      }
    });
  }

  createNewTreeTableElement(rowData: TableRowObject): any {
    let newTableElement = document.createElement('div');
    newTableElement.classList.add('tr');
    let treeTop = 0;
    if (this.treeElement!.children?.length > 0) {
      let transX = Number((this.treeElement?.lastChild as HTMLElement).style.transform.replace(/[^0-9]/gi, ''));
      treeTop += transX + rowData.height;
    }
    this?.columns?.forEach((column: any, index) => {
      let dataIndex = column.getAttribute('data-index') || '1';
      let td: any;
      if (index === 0) {
        td = this.firstElementTdHandler(newTableElement, dataIndex, rowData, column);
      } else {
        td = this.otherElementHandler(dataIndex, rowData, column);
        newTableElement.append(td);
      }
    });
    let lastChild = this.treeElement?.lastChild as HTMLElement;
    if (lastChild) {
      lastChild.style.transform = `translateY(${treeTop}px)`;
    }
    (newTableElement as any).data = rowData.data;
    newTableElement.style.gridTemplateColumns = this.gridTemplateColumns.join(' ');
    newTableElement.style.position = 'absolute';
    newTableElement.style.top = '0px';
    newTableElement.style.left = '0px';
    newTableElement.style.cursor = 'pointer';
    this.setHighLight(rowData.data.isSearch, newTableElement);
    this.addRowElementEvent(newTableElement, rowData);
    return newTableElement;
  }

  addRowElementEvent(newTableElement: HTMLDivElement, rowData: any): void {
    newTableElement.onmouseenter = () => {
      if ((newTableElement as any).data.isSelected) return;
      let indexOf = this.currentRecycleList.indexOf(newTableElement);
      this.currentTreeDivList.forEach((row) => {
        row.classList.remove('mouse-in');
      });
      if (indexOf >= 0 && indexOf < this.treeElement!.children.length) {
        this.setMouseIn(true, [this.treeElement?.children[indexOf] as HTMLElement]);
      }
    };
    newTableElement.onmouseleave = () => {
      if ((newTableElement as any).data.isSelected) return;
      let indexOf = this.currentRecycleList.indexOf(newTableElement);
      if (indexOf >= 0 && indexOf < this.treeElement!.children.length) {
        this.setMouseIn(false, [this.treeElement?.children[indexOf] as HTMLElement]);
      }
    };
    newTableElement.onclick = (e) => {
      let indexOf = this.currentRecycleList.indexOf(newTableElement);
      this.dispatchRowClickEvent(rowData, [this.treeElement?.children[indexOf] as HTMLElement, newTableElement]);
    };
  }

  firstElementTdHandler(newTableElement: HTMLDivElement, dataIndex: string, rowData: any, column: any) {
    let td: any;
    let text = formatName(dataIndex, rowData.data[dataIndex], this);
    if (column.template) {
      td = column.template.render(rowData.data).content.cloneNode(true);
      td.template = column.template;
      td.title = text;
    } else {
      td = document.createElement('div');
      td.innerHTML = text;
      td.dataIndex = dataIndex;
      td.title = text;
    }
    if (rowData.data.children && rowData.data.children.length > 0 && !rowData.data.hasNext) {
      let btn = this.createExpandBtn(rowData);
      td.insertBefore(btn, td.firstChild);
    }
    if (rowData.data.hasNext) {
      td.title = rowData.data.objectName;
      let btn = this.createBtn(rowData);
      td.insertBefore(btn, td.firstChild);
    }
    td.style.paddingLeft = rowData.depth * iconWidth + 'px';
    if (!rowData.data.children || rowData.data.children.length === 0) {
      td.style.paddingLeft = iconWidth * rowData.depth + iconWidth + iconPadding * 2 + 'px';
    }
    (td as any).data = rowData.data;
    td.classList.add('tree-first-body');
    td.style.position = 'absolute';
    td.style.top = '0px';
    td.style.left = '0px';
    this.addFirstElementEvent(td, newTableElement, rowData);
    this.setHighLight(rowData.data.isSearch, td);
    this.treeElement!.style.width = column.getAttribute('width');
    this.treeElement?.append(td);
    this.currentTreeDivList.push(td);
    return td;
  }

  addFirstElementEvent(td: HTMLDivElement, tr: HTMLDivElement, rowData: any): void {
    td.onmouseenter = () => {
      let indexOf = this.currentTreeDivList.indexOf(td);
      this.currentRecycleList.forEach((row) => {
        row.classList.remove('mouse-in');
      });
      if (indexOf >= 0 && indexOf < this.currentRecycleList.length && td.innerHTML != '') {
        this.setMouseIn(true, [td]);
      }
    };
    td.onmouseleave = () => {
      let indexOf = this.currentTreeDivList.indexOf(td);
      if (indexOf >= 0 && indexOf < this.currentRecycleList.length) {
        this.setMouseIn(false, [td]);
      }
    };
    td.onclick = () => {
      let indexOf = this.currentTreeDivList.indexOf(td);
      this.dispatchRowClickEvent(rowData, [td, tr]);
    };
  }

  otherElementHandler(dataIndex: string, rowData: any, column: any) {
    let text = formatName(dataIndex, rowData.data[dataIndex], this);
    let td: any = document.createElement('div');
    td = document.createElement('div');
    td.classList.add('td');
    td.style.overflow = 'hidden';
    td.style.textOverflow = 'ellipsis';
    td.style.whiteSpace = 'nowrap';
    td.title = text;
    td.dataIndex = dataIndex;
    td.style.justifyContent = column.getAttribute('align') || 'flex-start';
    if (column.template) {
      td.appendChild(column.template.render(rowData.data).content.cloneNode(true));
      td.template = column.template;
    } else {
      td.innerHTML = text;
    }
    return td;
  }

  createBtn(row: any): any {
    let btn: any = document.createElement('lit-icon');
    btn.classList.add('tree-icon');
    if (row.data.expanded) {
      btn.name = 'plus-square';
    } else {
      btn.name = 'minus-square';
    }
    btn.addEventListener('click', (e: any) => {
      row.data.status = false;
      const resetNodeHidden = (hidden: boolean, rowData: any) => {
        if (hidden) {
          rowData.children.forEach((child: any) => {
            child.rowHidden = false;
          });
        } else {
          rowData.children.forEach((child: any) => {
            child.rowHidden = true;
            resetNodeHidden(hidden, child);
          });
        }
      };

      if (row.data.expanded) {
        row.data.status = true;
        this.dispatchRowClickEventIcon(row, [btn]);
        row.data.expanded = false;
        resetNodeHidden(true, row);
      } else {
        row.data.expanded = true;
        row.data.status = false;
        resetNodeHidden(false, row);
      }
      this.reMeauseHeight();
      e.stopPropagation();
    });
    return btn;
  }

  createExpandBtn(row: any): any {
    let btn: any = document.createElement('lit-icon');
    btn.classList.add('tree-icon');
    // @ts-ignore
    if (row.expanded) {
      btn.name = 'minus-square';
    } else {
      btn.name = 'plus-square';
    }
    btn.onclick = (e: Event) => {
      const resetNodeHidden = (hidden: boolean, rowData: any) => {
        if (rowData.children.length > 0) {
          if (hidden) {
            rowData.children.forEach((child: any) => {
              child.rowHidden = true;
              resetNodeHidden(hidden, child);
            });
          } else {
            rowData.children.forEach((child: any) => {
              child.rowHidden = !rowData.expanded;
              if (rowData.expanded) {
                resetNodeHidden(hidden, child);
              }
            });
          }
        }
      };

      if (row.expanded) {
        row.expanded = false;
        resetNodeHidden(true, row);
      } else {
        row.expanded = true;
        resetNodeHidden(false, row);
      }
      this.reMeauseHeight();
      e.stopPropagation();
    };
    return btn;
  }

  getVisibleObjs() {
    let totalH = 0;
    this.recycleDs.forEach((it) => {
      if (!it.rowHidden) {
        it.top = totalH;
        totalH += it.height;
      }
    });
    this.tbodyElement && (this.tbodyElement.style.height = totalH + (this.isScrollXOutSide ? 0 : 0) + 'px');
    this.treeElement!.style.height = this.tableElement!.clientHeight - this.theadElement!.clientHeight + 'px';
    let visibleObjs = this.recycleDs.filter((item) => {
      return !item.rowHidden;
    });
    let top = this.tableElement!.scrollTop;
    let skip = 0;
    for (let i = 0; i < visibleObjs.length; i++) {
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
    while (reduce <= this.tableElement!.clientHeight) {
      let rowElement;
      if (this.hasAttribute('tree')) {
        rowElement = this.createNewTreeTableElement(visibleObjs[skip]);
      } else {
        rowElement = this.createNewTableElement(visibleObjs[skip]);
      }
      this.tbodyElement?.append(rowElement);
      if (this.hasAttribute('tree')) {
        if (this.treeElement?.lastChild) {
          (this.treeElement?.lastChild as HTMLElement).style.height = visibleObjs[skip].height + 'px';
        }
      }
      this.currentRecycleList.push(rowElement);
      reduce += rowElement.clientHeight;
    }
    for (let i = 0; i < this.currentRecycleList.length; i++) {
      if (this.hasAttribute('tree')) {
        this.freshCurrentLine(
          this.currentRecycleList[i],
          visibleObjs[i + skip],
          this.treeElement?.children[i] as HTMLElement
        );
      } else {
        this.freshCurrentLine(this.currentRecycleList[i], visibleObjs[i + skip]);
      }
    }
  }

  createNewTableElement(rowData: any): any {
    let rowElement = document.createElement('div');
    rowElement.classList.add('tr');
    this?.columns?.forEach((column: any) => {
      let dataIndex = column.getAttribute('data-index') || '1';
      let td: any;
      td = document.createElement('div');
      td.classList.add('td');
      td.style.overflow = 'scroll hidden';
      td.style.textOverflow = 'ellipsis';
      td.style.whiteSpace = 'nowrap';
      td.dataIndex = dataIndex;
      td.style.justifyContent = column.getAttribute('align') || 'flex-start';
      let text = formatName(dataIndex, rowData.data[dataIndex], this);
      td.title = text;
      if (column.template) {
        td.appendChild(column.template.render(rowData.data).content.cloneNode(true));
        td.template = column.template;
      } else {
        td.innerHTML = text;
      }
      rowElement.append(td);
    });
    rowElement.onclick = () => {
      this.dispatchRowClickEvent(rowData, [rowElement]);
    };
    rowElement.onmouseover = () => {
      this.dispatchRowHoverEvent(rowData, [rowElement]);
    };
    if (rowData.data.isSelected != undefined) {
      this.setSelectedRow(rowData.data.isSelected, [rowElement]);
    }
    (rowElement as any).data = rowData.data;
    rowElement.style.cursor = 'pointer';
    rowElement.style.gridTemplateColumns = this.gridTemplateColumns.join(' ');
    rowElement.style.position = 'absolute';
    rowElement.style.top = '0px';
    rowElement.style.left = '0px';
    if (this.getItemTextColor) {
      rowElement.style.color = this.getItemTextColor(rowData.data);
    }
    return rowElement;
  }

  freshCurrentLine(element: HTMLElement, rowObject: TableRowObject, firstElement?: HTMLElement) {
    if (!rowObject) {
      if (firstElement) {
        firstElement.style.display = 'none';
      }
      element.style.display = 'none';
      return;
    }
    let childIndex = -1;
    this.setHighLight(rowObject.data.isSearch, element);
    element.childNodes.forEach((child) => {
      if (child.nodeType != 1) return;
      childIndex++;
      let idx = firstElement !== undefined ? childIndex + 1 : childIndex;
      this.freshLineFirstElementHandler(firstElement, rowObject, childIndex);
      let dataIndex = this.columns![idx].getAttribute('data-index') || '1';
      let text = formatName(dataIndex, rowObject.data[dataIndex], this);
      if ((this.columns![idx] as any).template) {
        (child as HTMLElement).innerHTML = '';
        (child as HTMLElement).appendChild(
          (this.columns![idx] as any).template.render(rowObject.data).content.cloneNode(true)
        );
        (child as HTMLElement).title = text;
      } else {
        (child as HTMLElement).innerHTML = text;
        (child as HTMLElement).title = text;
      }
    });
    this.freshLineStyleAndEvents(element, rowObject, firstElement);
  }

  freshLineFirstElementHandler(rowFirstElement: any, rowObject: TableRowObject, childIndex: number): void {
    if (rowFirstElement !== undefined && childIndex === 0) {
      this.setHighLight(rowObject.data.isSearch, rowFirstElement);
      (rowFirstElement as any).data = rowObject.data;
      if ((this.columns![0] as any).template) {
        rowFirstElement.innerHTML = (this.columns![0] as any).template
          .render(rowObject.data)
          .content.cloneNode(true).innerHTML;
      } else {
        let dataIndex = this.columns![0].getAttribute('data-index') || '1';
        let text = formatName(dataIndex, rowObject.data[dataIndex], this);
        rowFirstElement.innerHTML = text;
        rowFirstElement.title = text;
      }
      if (rowObject.children && rowObject.children.length > 0 && !rowObject.data.hasNext) {
        let btn = this.createExpandBtn(rowObject);
        rowFirstElement.insertBefore(btn, rowFirstElement.firstChild);
      }
      rowFirstElement.style.paddingLeft = iconWidth * rowObject.depth + 'px';
      if (!rowObject.children || rowObject.children.length === 0) {
        rowFirstElement.style.paddingLeft = iconWidth * rowObject.depth + iconWidth + iconPadding * 2 + 'px';
      }
      if (rowObject.data.hasNext) {
        let btn = this.createBtn(rowObject);
        rowFirstElement.title = rowObject.data.objectName;
        rowFirstElement.insertBefore(btn, rowFirstElement.firstChild);
        rowFirstElement.style.paddingLeft = iconWidth * rowObject.depth + 'px';
      }
      rowFirstElement.onclick = () => {
        this.dispatchRowClickEvent(rowObject, [rowFirstElement, element]);
      };
      rowFirstElement.style.transform = `translateY(${rowObject.top - this.tableElement!.scrollTop}px)`;
      if (rowObject.data.isSelected !== undefined) {
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
    element.onclick = (e) => {
      if (firstElement !== undefined) {
        this.dispatchRowClickEvent(rowData, [firstElement, element]);
      } else {
        this.dispatchRowClickEvent(rowData, [element]);
      }
    };
    element.onmouseenter = () => {
      this.dispatchRowHoverEvent(rowData, [element]);
    };
    (element as any).data = rowData.data;
    if (rowData.data.isSelected !== undefined) {
      this.setSelectedRow(rowData.data.isSelected, [element]);
    } else {
      this.setSelectedRow(false, [element]);
    }
    if (rowData.data.isHover !== undefined) {
      this.setMouseIn(rowData.data.isHover, [element]);
    } else {
      this.setMouseIn(false, [element]);
    }
    if (this.getItemTextColor) {
      element.style.color = this.getItemTextColor((element as any).data);
    }
  }

  setSelectedRow(isSelected: boolean, rows: any[]): void {
    if (isSelected) {
      rows.forEach((row) => {
        if (row.classList.contains('mouse-in')) {
          row.classList.remove('mouse-in');
        }
        row.classList.add('mouse-select');
      });
    } else {
      rows.forEach((row) => {
        row.classList.remove('mouse-select');
      });
    }
  }

  setMouseIn(isMouseIn: boolean, rows: any[]): void {
    if (isMouseIn) {
      rows.forEach((row) => {
        row.classList.add('mouse-in');
      });
    } else {
      rows.forEach((row) => {
        row.classList.remove('mouse-in');
      });
    }
  }

  scrollToData(data: any): void {
    if (this.recycleDs.length > 0) {
      let filter = this.recycleDs.filter((item) => {
        return item.data == data;
      });
      if (filter.length > 0) {
        this.tableElement!.scrollTop = filter[0].top;
      }
      this.setCurrentSelection(data);
    }
  }

  expandList(datasource: any[]): void {
    let source = this.recycleDs.filter((item) => {
      return datasource.indexOf(item.data) != -1;
    });
    if (source.length > 0) {
      source.forEach((item) => {
        item.expanded = true;
        item.rowHidden = false;
      });
    }
    this.reMeauseHeight();
  }

  clearAllSelection(rowObjectData: any = undefined): void {
    this.recycleDs.forEach((item) => {
      if (rowObjectData || (item.data != rowObjectData && item.data.isSelected)) {
        item.data.isSelected = false;
      }
    });
    this.setSelectedRow(false, this.currentTreeDivList);
    this.setSelectedRow(false, this.currentRecycleList);
  }

  clearAllHover(rowObjectData: any): void {
    this.recycleDs.forEach((item) => {
      if (item.data != rowObjectData && item.data.isHover) {
        item.data.isHover = false;
      }
    });
    this.setMouseIn(false, this.currentTreeDivList);
    this.setMouseIn(false, this.currentRecycleList);
  }

  mouseOut(): void {
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

  setCurrentSelection(data: any): void {
    if (data.isSelected != undefined) {
      this.currentTreeDivList.forEach((item) => {
        if ((item as any).data == data) {
          this.setSelectedRow(data.isSelected, [item]);
        }
      });
      this.currentRecycleList.forEach((item) => {
        if ((item as any).data == data) {
          this.setSelectedRow(data.isSelected, [item]);
        }
      });
    }
  }

  setCurrentHover(data: any): void {
    this.setMouseIn(false, this.currentTreeDivList);
    this.setMouseIn(false, this.currentRecycleList);
    if (data.isHover != undefined) {
      this.currentTreeDivList.forEach((item) => {
        if ((item as any).data == data) {
          this.setMouseIn(data.isHover, [item]);
        }
      });
      this.currentRecycleList.forEach((item) => {
        if ((item as any).data == data) {
          this.setMouseIn(data.isHover, [item]);
        }
      });
    }
  }

  dispatchRowClickEventIcon(rowObject: any, elements: any[]) {
    this.dispatchEvent(
      new CustomEvent('icon-click', {
        detail: {
          ...rowObject.data,
          data: rowObject.data,
          callBack: (isSelected: boolean) => {
            //是否爲单选
            if (isSelected) {
              this.clearAllSelection(rowObject.data);
            }
            this.setSelectedRow(rowObject.data.isSelected, elements);
          },
        },
        composed: true,
      })
    );
  }

  dispatchRowClickEvent(rowObject: any, elements: any[]): void {
    this.dispatchEvent(
      new CustomEvent('row-click', {
        detail: {
          ...rowObject.data,
          data: rowObject.data,
          callBack: (isSelected: boolean): void => {
            //是否爲单选
            if (isSelected) {
              this.clearAllSelection(rowObject.data);
            }
            this.setSelectedRow(rowObject.data.isSelected, elements);
          },
        },
        composed: true,
      })
    );
  }

  dispatchRowHoverEvent(rowObject: any, elements: any[]): void {
    this.dispatchEvent(
      new CustomEvent('row-hover', {
        detail: {
          data: rowObject.data,
          callBack: (): void => {
            this.clearAllHover(rowObject.data);
            this.setMouseIn(rowObject.data.isHover, elements);
          },
        },
        composed: true,
      })
    );
  }
  setHighLight(isSearch: boolean, element: any): void {
    if (isSearch) {
      element.setAttribute('high-light', '');
    } else {
      element.removeAttribute('high-light');
    }
  }
}

if (!customElements.get('lit-page-table')) {
  customElements.define('lit-page-table', LitPageTable);
}
