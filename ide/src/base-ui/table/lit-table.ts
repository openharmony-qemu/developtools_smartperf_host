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
import { element } from '../BaseElement';
import '../utils/Template';
import { TableRowObject } from './TableRowObject';
import { ExcelFormater } from '../utils/ExcelFormater';
import { LitIcon } from '../icon/LitIcon';
import { NodeType } from '../../js-heap/model/DatabaseStruct';
import { ConstructorType } from '../../js-heap/model/UiStruct';
import { JsCpuProfilerStatisticsStruct } from '../../trace/bean/JsStruct';
import {
  iconPadding,
  iconWidth,
  createDownUpSvg,
  litTableHtml,
  exportData,
  formatExportData,
  recursionExportTableData,
  addCopyEventListener,
  addSelectAllBox,
  fixed,
  formatName
} from './LitTableHtml';

@element('lit-table')
export class LitTable extends HTMLElement {
  meauseRowElement: HTMLDivElement | undefined;
  currentRecycleList: HTMLDivElement[] = [];
  currentTreeDivList: HTMLDivElement[] = [];
  public rememberScrollTop = false;
  public getItemTextColor?: (data: any) => string;
  public itemTextHandleMap: Map<string, (value: any) => string> = new Map<string, (value: any) => string>();
  public exportTextHandleMap: Map<string, (value: any) => string> = new Map<string, (value: any) => string>();
  public ds: Array<any> = [];
  public recycleDs: Array<any> = [];
  public gridTemplateColumns: Array<string> = [];
  public tableColumns: NodeListOf<LitTableColumn> | undefined;
  public treeElement: HTMLDivElement | undefined | null;
  public columns: Array<Element> | null | undefined;
  public exportLoading: boolean = false;
  public exportProgress: LitProgressBar | null | undefined;
  public tableElement: HTMLDivElement | null | undefined;
  private normalDs: Array<any> = [];
  /*Grid css layout descriptions are obtained according to the clustern[] nested structure*/
  private st: HTMLSlotElement | null | undefined;
  private theadElement: HTMLDivElement | null | undefined;
  private tbodyElement: HTMLDivElement | undefined | null;
  private colCount: number = 0;
  private isRecycleList: boolean = true;
  private isScrollXOutSide: boolean = false;
  private value: Array<any> = [];
  private _mode = TableMode.Expand;
  private columnResizeEnable: boolean = true;
  private _isSearch: boolean = false;

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.innerHTML = litTableHtml;
  }

  static get observedAttributes(): string[] {
    return [
      'scroll-y',
      'selectable',
      'no-head',
      'grid-line',
      'defaultOrderColumn',
      'hideDownload',
      'noRecycle',
      'loading',
      'expand',
    ];
  }

  set mode(mode: TableMode) {
    this._mode = mode;
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

  get dataSource(): any[] {
    return this.ds || [];
  }

  set dataSource(value) {
    if (this.hasAttribute('noRecycle')) {
      this.ds = value;
      this.isRecycleList = false;
      this.renderTable();
    } else {
      this.columnResizeEnable = false;
      this.recycleDataSource = value;
    }
  }

  set noRecycle(value) {
    if (value) {
      this.setAttribute('noRecycle', '');
    } else {
      this.removeAttribute('noRecycle');
    }
  }

  get noRecycle(): boolean {
    return this.hasAttribute('noRecycle');
  }

  get recycleDataSource(): any[] {
    return this.ds || [];
  }

  set isSearch(value: boolean) {
    this._isSearch = value;
  }

  set recycleDataSource(value) {
    if (this.tableElement) {
      this.isScrollXOutSide = this.tableElement!.scrollWidth > this.tableElement!.clientWidth;
      this.isRecycleList = true;
      this.ds = value;
      if (this.rememberScrollTop) {
        this.tableElement!.scrollTop = 0;
        this.tableElement!.scrollLeft = 0;
      } else {
        this.tableElement!.scrollTop = 0;
        this.tableElement!.scrollLeft = 0;
      }
      if (this.hasAttribute('tree')) {
        if (value.length === 0) {
          this.value = [];
          this.recycleDs = this.meauseTreeRowElement(value);
        } else {
          if (
            value !== this.value &&
            this.value.length !== 0 &&
            !this._isSearch &&
            this.querySelector('lit-table-column')?.hasAttribute('retract')
          ) {
            this.shadowRoot!.querySelector<LitIcon>('.top')!.name = 'up';
            this.shadowRoot!.querySelector<LitIcon>('.bottom')!.name = 'down';
          }
          this._isSearch = false;
          this.value = value;
          this.recycleDs = this.meauseTreeRowElement(value, RedrawTreeForm.Retract);
        }
      } else {
        this.recycleDs = this.meauseAllRowHeight(value);
      }
    }
  }

  get snapshotDataSource(): any[] {
    return this.ds || [];
  }

  set snapshotDataSource(value) {
    this.ds = value;
    if (this.hasAttribute('tree')) {
      this.recycleDs = this.meauseTreeRowElement(value, RedrawTreeForm.Default);
    } else {
      this.recycleDs = this.meauseAllRowHeight(value);
    }
  }

  move1px(): void {
    this.tableElement!.scrollTop = this.tableElement!.scrollTop + 1;
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

  exportExcelData(): void {
    let now = Date.now();
    ExcelFormater.testExport(
      [
        {
          columns: this.columns as any[],
          tables: this.ds,
          sheetName: `${now}`,
        },
      ],
      `${now}`
    );
  }

  formatExportData(dataSource: any[]): any[] {
    return formatExportData(dataSource, this);
  }

  formatExportCsvData(dataSource: any[]): string {
    if (dataSource === undefined || dataSource.length === 0) {
      return '';
    }
    if (this.columns == undefined) {
      return '';
    }
    let str = '';
    str += this.columns!.map((column) => {
      let dataIndex = column.getAttribute('data-index');
      let columnName = column.getAttribute('title');
      if (columnName === '') {
        columnName = dataIndex;
      }
      return columnName;
    }).join(',');
    str += recursionExportTableData(this.columns, dataSource);
    return str;
  }

  injectColumns(): void {
    this.columns = this.st!.assignedElements();
    this.columns.forEach((column) => {
      if (column.tagName === 'LIT-TABLE-COLUMN') {
        this.gridTemplateColumns.push(column.getAttribute('width') || '1fr');
      }
    });
  }

  setStatus(list: any, status: boolean, depth: number = 0): void {
    this.tableElement!.scrollTop = 0;
    // 添加depth参数，让切换图标的代码在递归中只走一遍
    if (depth === 0) {
      if (status) {
        this.shadowRoot!.querySelector<LitIcon>('.top')!.name = 'down';
        this.shadowRoot!.querySelector<LitIcon>('.bottom')!.name = 'up';
      } else {
        this.shadowRoot!.querySelector<LitIcon>('.top')!.name = 'up';
        this.shadowRoot!.querySelector<LitIcon>('.bottom')!.name = 'down';
      }
    }
    for (let item of list) {
      item.status = status;
      if (item.children !== undefined && item.children.length > 0) {
        this.setStatus(item.children, status, depth + 1);
      }
    }
  }

  //当 custom element首次被插入文档DOM时，被调用。
  connectedCallback(): void {
    this.st = this.shadowRoot?.querySelector('#slot');
    this.tableElement = this.shadowRoot?.querySelector('.table');
    this.exportProgress = this.shadowRoot?.querySelector('#export_progress_bar');
    this.theadElement = this.shadowRoot?.querySelector('.thead');
    this.treeElement = this.shadowRoot?.querySelector('.tree');
    this.tbodyElement = this.shadowRoot?.querySelector('.body');
    this.tableColumns = this.querySelectorAll<LitTableColumn>('lit-table-column');
    this.colCount = this.tableColumns!.length;
    this.dataExportInit();
    addCopyEventListener(this);
    this.st?.addEventListener('slotchange', () => {
      this.theadElement!.innerHTML = '';
      setTimeout(() => {
        this.columns = this.st!.assignedElements();
        let rowElement = document.createElement('div');
        rowElement.classList.add('th');
        addSelectAllBox(rowElement, this);
        let area: Array<any> = [];
        this.gridTemplateColumns = [];
        this.resolvingArea(this.columns, 0, 0, area, rowElement);
        area.forEach((rows, j, array) => {
          for (let i = 0; i < this.colCount; i++) {
            if (!rows[i]) rows[i] = array[j - 1][i];
          }
        });
        if (this.selectable) {
          let s = area.map((a) => '"_checkbox_ ' + a.map((aa: any) => aa.t).join(' ') + '"').join(' ');
          rowElement.style.gridTemplateColumns = '60px ' + this.gridTemplateColumns.join(' ');
          rowElement.style.gridTemplateRows = `repeat(${area.length},1fr)`;
          rowElement.style.gridTemplateAreas = s;
        } else {
          let s = area.map((a) => '"' + a.map((aa: any) => aa.t).join(' ') + '"').join(' ');
          rowElement.style.gridTemplateColumns = this.gridTemplateColumns.join(' ');
          rowElement.style.gridTemplateRows = `repeat(${area.length},1fr)`;
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
        let len = a.querySelectorAll('lit-table-column').length;
        let children = [...a.children].filter((a) => a.tagName !== 'TEMPLATE');
        if (children.length > 0) {
          this.resolvingArea(children, x, y + 1, area, rowElement);
        }
        for (let j = 0; j < len; j++) {
          area[y][x] = { x, y, t: key };
          x++;
        }
        let h = document.createElement('div');
        h.classList.add('td');
        h.style.justifyContent = a.getAttribute('align');
        h.style.borderBottom = '1px solid #f0f0f0';
        h.style.gridArea = key;
        h.innerText = a.title;
        if (a.hasAttribute('fixed')) {
          fixed(h, a.getAttribute('fixed'), '#42b983');
        }
        rowElement.append(h);
      } else if (a.tagName === 'LIT-TABLE-COLUMN') {
        area[y][x] = { x, y, t: key };
        x++;
        let head = this.resolvingAreaColumn(rowElement, a, i, key);
        this.gridTemplateColumns.push(a.getAttribute('width') || '1fr');
        let labelArr = a.title.split('/');
        for (let i = 0; i < labelArr.length; i++) {
          let titleLabel = document.createElement('label');
          titleLabel.style.cursor = 'pointer';
          i == 0 ? (titleLabel.textContent = labelArr[i]) : (titleLabel.textContent = '/' + labelArr[i]);
          head.appendChild(titleLabel);
        }
        if (a.hasAttribute('fixed')) {
          fixed(head, a.getAttribute('fixed'), '#42b983');
        }
        rowElement.append(head);
      }
    });
  };

  resolvingAreaColumn(rowElement: HTMLDivElement, column: any, index: number, key: string): HTMLDivElement {
    let head: any = document.createElement('div');
    head.classList.add('td');
    if ((this.hasAttribute('tree') && index > 1) || (!this.hasAttribute('tree') && index > 0)) {
      let resizeDiv: HTMLDivElement = document.createElement('div');
      resizeDiv.classList.add('resize');
      head.appendChild(resizeDiv);
      this.resizeEventHandler(rowElement, resizeDiv, index);
    }
    this.resolvingAreaColumnRetract(column, head);
    this.resolvingAreaColumnOrder(column, index, key, head);
    this.resolvingAreaColumnButton(column, key, head);
    head.style.justifyContent = column.getAttribute('align');
    head.style.gridArea = key;
    return head;
  }

  resolvingAreaColumnRetract(column: any, columnHead: HTMLDivElement): void {
    if (column.hasAttribute('retract')) {
      let expand = document.createElement('div');
      expand.classList.add('expand');
      expand.style.display = 'grid';
      columnHead.append(expand);
      let top = document.createElement('lit-icon') as LitIcon;
      top.classList.add('top');
      top.name = 'up';
      expand.append(top);
      let bottom = document.createElement('lit-icon') as LitIcon;
      bottom.classList.add('bottom');
      bottom.name = 'down';
      expand.append(bottom);
      expand.addEventListener('click', (e) => {
        if (top.name == 'up' && bottom.name == 'down') {
          top.name = 'down';
          bottom.name = 'up';
          // 一键展开
          this.setStatus(this.value, true);
          this.recycleDs = this.meauseTreeRowElement(this.value, RedrawTreeForm.Expand);
        } else {
          top.name = 'up';
          bottom.name = 'down';
          // 一键收起
          this.setStatus(this.value, false);
          this.recycleDs = this.meauseTreeRowElement(this.value, RedrawTreeForm.Retract);
        }
        e.stopPropagation();
      });
    }
  }

  resolvingAreaColumnButton(column: any, key: string, head: HTMLDivElement) {
    if (column.hasAttribute('button')) {
      let buttonIcon = document.createElement('button');
      buttonIcon.innerHTML = 'GetBusyTime(ms)';
      buttonIcon.classList.add('button-icon');
      head.appendChild(buttonIcon);
      buttonIcon.addEventListener('click', (event) => {
        this.dispatchEvent(
          new CustomEvent('button-click', {
            detail: {
              key: key,
            },
            composed: true,
          })
        );
        event.stopPropagation();
      });
    }
  }

  resolvingAreaColumnOrder(column: any, index: number, key: string,columnHead: any): void {
    if (column.hasAttribute('order')) {
      (columnHead as any).sortType = 0;
      columnHead.classList.add('td-order');
      columnHead.style.position = 'relative';
      let { upSvg, downSvg } = createDownUpSvg(index, columnHead);
      columnHead.onclick = () => {
        if (this.isResize || this.resizeColumnIndex !== -1) {
          return;
        }
        this?.shadowRoot?.querySelectorAll('.td-order svg').forEach((it: any) => {
          it.setAttribute('fill', 'let(--dark-color1,#212121)');
          it.sortType = 0;
          it.style.display = 'none';
        });
        if (columnHead.sortType == undefined || columnHead.sortType == null) {
          columnHead.sortType = 0;
        } else if (columnHead.sortType === 2) {
          columnHead.sortType = 0;
        } else {
          columnHead.sortType += 1;
        }
        upSvg.setAttribute('fill', 'let(--dark-color1,#212121)');
        downSvg.setAttribute('fill', 'let(--dark-color1,#212121)');
        upSvg.style.display = columnHead.sortType === 1 ? 'block' : 'none';
        downSvg.style.display = columnHead.sortType === 2 ? 'block' : 'none';
        switch (columnHead.sortType) {
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
              sort: columnHead.sortType,
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

  resizeEventHandler(header: HTMLDivElement, element: HTMLDivElement, index: number): void {
   this.resizeMouseMoveEventHandler(header);
    header.addEventListener('mouseup', (event) => {
      if (!this.columnResizeEnable) return;
      this.isResize = false;
      this.resizeDownX = 0;
      header.style.cursor = 'pointer';
      setTimeout(() => {
        this.resizeColumnIndex = -1;
      }, 100);
      event.stopPropagation();
      event.preventDefault();
    });
    header.addEventListener('mouseleave', (event) => {
      if (!this.columnResizeEnable) return;
      event.stopPropagation();
      event.preventDefault();
      this.isResize = false;
      this.resizeDownX = 0;
      this.resizeColumnIndex = -1;
      header.style.cursor = 'pointer';
    });
    element.addEventListener('mousedown', (event) => {
      if (event.button === 0) {
        if (!this.columnResizeEnable) return;
        this.isResize = true;
        this.resizeColumnIndex = index;
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

  resizeMouseMoveEventHandler(header: HTMLDivElement) {
    header.addEventListener('mousemove', (event) => {
      if (!this.columnResizeEnable) return;
      if (this.isResize) {
        let width = event.clientX - this.resizeDownX;
        header.style.cursor = 'col-resize';
        let preWidth = Math.max(this.beforeResizeWidth + width, this.columnMinWidth);
        for (let i = 0; i < header.childNodes.length; i++) {
          let node = header.childNodes.item(i) as HTMLDivElement;
          this.gridTemplateColumns[i] = `${node.clientWidth}px`;
        }
        this.gridTemplateColumns[this.resizeColumnIndex - 1] = `${preWidth}px`;
        header.style.gridTemplateColumns = this.gridTemplateColumns.join(' ');
        let preNode = header.childNodes.item(this.resizeColumnIndex - 1) as HTMLDivElement;
        preNode.style.width = `${preWidth}px`;
        this.shadowRoot!.querySelectorAll<HTMLDivElement>('.tr').forEach((tr) => {
          if (this.hasAttribute('tree')) {
            tr.style.gridTemplateColumns = this.gridTemplateColumns.slice(1).join(' ');
          } else {
            tr.style.gridTemplateColumns = this.gridTemplateColumns.join(' ');
          }
        });
        event.preventDefault();
        event.stopPropagation();
      } else {
        header.style.cursor = 'pointer';
      }
    });
  }

  adoptedCallback(): void {}

  getCheckRows(): any[] {
    // @ts-ignore
    return [...this.shadowRoot!.querySelectorAll('div[class=tr][checked]')]
      .map((a) => (a as any).data)
      .map((a) => {
        delete a['children'];
        return a;
      });
  }

  deleteRowsCondition(fn: any): void {
    this.shadowRoot!.querySelectorAll('div[class=tr]').forEach((tr) => {
      // @ts-ignore
      if (fn(tr.data)) {
        tr.remove();
      }
    });
  }

  meauseElementHeight(rowData: any): number {
    return 27;
  }

  meauseTreeElementHeight(rowData: any, depth: number): number {
    return 27;
  }

  getVisibleObjects(list: any[]) {
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
        let newTableElement = this.addTableElement(tableRowObject, false,false, true, totalHeight);
        let td = newTableElement?.querySelectorAll('.td');
        if (tableRowObject.data.rowName === 'cpu-profiler') {
          td[0].innerHTML = '';
          this.createTextColor(tableRowObject, td[0]);
        }
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
    return { visibleObjects, totalHeight };
  }

  meauseAllRowHeight(list: any[]): TableRowObject[] {
    this.tbodyElement!.innerHTML = '';
    this.meauseRowElement = undefined;
    let head = this.shadowRoot!.querySelector('.th');
    this.tbodyElement && (this.tbodyElement.style.width = head?.clientWidth + 'px');
    this.currentRecycleList = [];
    let { visibleObjects, totalHeight } = this.getVisibleObjects(list);
    this.tbodyElement && (this.tbodyElement.style.height = totalHeight + (this.isScrollXOutSide ? 0 : 0) + 'px');
    this.tableElement &&
      (this.tableElement.onscroll = (event) => {
        let tblScrollTop = this.tableElement!.scrollTop;
        let skip = 0;
        for (let i = 0; i < visibleObjects.length; i++) {
          if (
            visibleObjects[i].top <= tblScrollTop &&
            visibleObjects[i].top + visibleObjects[i].height >= tblScrollTop
          ) {
            skip = i;
            break;
          }
        }
        let reduce = this.currentRecycleList.map((item) => item.clientHeight).reduce((a, b) => a + b, 0);
        if (reduce == 0) {
          return;
        }
        while (reduce <= this.tableElement!.clientHeight) {
          let newTableElement = this.addTableElement(visibleObjects[skip], false,false, false);
          reduce += newTableElement.clientHeight;
        }
        for (let i = 0; i < this.currentRecycleList.length; i++) {
          this.freshLineHandler(i, skip, visibleObjects);
        }
      });
    return visibleObjects;
  }

  freshLineHandler(index: number, skip: number, visibleObjects: TableRowObject[]){
    this.freshCurrentLine(this.currentRecycleList[index], visibleObjects[index + skip]);
    if (visibleObjects[index + skip]) {
      if (visibleObjects[index + skip].data.rowName === 'cpu-profiler') {
        this.createTextColor(visibleObjects[index + skip], this.currentRecycleList[index].childNodes[0]);
      }
    }
  }

  newTableRowObject(item: any, totalHeight: number, depth: number, parentNode?: TableRowObject): TableRowObject {
    let tableRowObject = new TableRowObject();
    tableRowObject.depth = depth;
    tableRowObject.data = item;
    tableRowObject.top = totalHeight;
    tableRowObject.height = this.meauseTreeElementHeight(tableRowObject, depth);
    if (parentNode) {
      parentNode!.children.push(tableRowObject);
    }
    return tableRowObject;
  }

  resetAllHeight(
    list: any[],
    depth: number,
    totalHeight: number,
    visibleObjects: TableRowObject[],
    parentNode?: TableRowObject,
    form?: RedrawTreeForm
  ) {
    let headHeight = this.theadElement?.clientHeight || 0;
    list.forEach((item) => {
      let tableRowObject = this.newTableRowObject(item, totalHeight, depth, parentNode);
      if (this._mode === TableMode.Expand && form === RedrawTreeForm.Retract && !item.status) {
        tableRowObject.expanded = false;
      } else if (this._mode === TableMode.Expand && form === RedrawTreeForm.Default) {
        tableRowObject.expanded = true;
      }
      if (
        (this._mode === TableMode.Retract && !item.status) ||
        (this._mode === TableMode.Expand && !item.status && form !== RedrawTreeForm.Expand)
      ) {
        tableRowObject.expanded = false;
        if (item.children != undefined && item.children.length > 0) {
          this.newTableRowObject(item, totalHeight, depth, tableRowObject);
        }
      }
      if (
        Math.max(totalHeight, this.tableElement!.scrollTop) <=
        Math.min(
          totalHeight + tableRowObject.height,
          this.tableElement!.scrollTop + this.tableElement!.clientHeight - headHeight
        )
      ) {
        this.addTableElement(tableRowObject,true, false, true, totalHeight);
      }
      totalHeight += tableRowObject.height;
      visibleObjects.push(tableRowObject);
      this.resetAllHeightChildrenHandler(item, depth, totalHeight, visibleObjects, tableRowObject, form);
    });
  }

  resetAllHeightChildrenHandler(
    item: any,
    depth: number,
    totalHeight: number,
    visibleObjects: TableRowObject[],
    tableRowObject?: TableRowObject,
    form?: RedrawTreeForm
  ) {
    if (item.hasNext) {
      // js memory的表格
      if (item.parents != undefined && item.parents.length > 0 && item.status) {
        this.resetAllHeight(item.parents, depth + 1, totalHeight, visibleObjects, tableRowObject);
      } else if (item.children != undefined && item.children.length > 0 && item.status) {
        this.resetAllHeight(item.children, depth + 1, totalHeight, visibleObjects, tableRowObject);
      }
    } else {
      // 其他数据
      if (
        item.children != undefined &&
        item.children.length > 0 &&
        form === RedrawTreeForm.Expand &&
        this._mode === TableMode.Expand
      ) {
        item.status = true;
        this.resetAllHeight(item.children, depth + 1, totalHeight, visibleObjects, tableRowObject);
      } else if (item.children != undefined && item.children.length > 0 && item.status) {
        this.resetAllHeight(item.children, depth + 1, totalHeight, visibleObjects, tableRowObject);
      }
    }
  }

  measureReset(): void {
    this.meauseRowElement = undefined;
    this.tbodyElement!.innerHTML = '';
    this.treeElement!.innerHTML = '';
    this.currentRecycleList = [];
    this.currentTreeDivList = [];
  }

  meauseTreeRowElement(list: any[], form?: RedrawTreeForm): TableRowObject[] {
    this.measureReset();
    let visibleObjects: TableRowObject[] = [];
    let totalHeight = 0;
    this.resetAllHeight(list,0, totalHeight, visibleObjects);
    this.tbodyElement && (this.tbodyElement.style.height = totalHeight + 'px');
    this.treeElement!.style.height = this.tableElement!.clientHeight - this.theadElement!.clientHeight + 'px';
    this.tableElement &&
      (this.tableElement.onscroll = (event) => {
        let visibleObjects = this.recycleDs.filter((item) => {
          return !item.rowHidden;
        });
        let top = this.tableElement!.scrollTop;
        this.treeElement!.style.transform = `translateY(${top}px)`;
        let skip = 0;
        for (let index = 0; index < visibleObjects.length; index++) {
          if (visibleObjects[index].top <= top && visibleObjects[index].top + visibleObjects[index].height >= top) {
            skip = index;
            break;
          }
        }
        // 如果滚动高度大于数据全部收起的高度，并且this.currentRecycleList数组长度为0要给this.currentRecycleList赋值，不然tab页没有数据
        if (
          visibleObjects[0] &&
          this.tableElement!.scrollTop >= this.value.length * visibleObjects[0].height &&
          this.currentRecycleList.length === 0
        ) {
          this.addTableElement(visibleObjects[skip], true, false, false);
        }
        let reduce = this.currentRecycleList.map((item) => item.clientHeight).reduce((a, b) => a + b, 0);
        if (reduce == 0) {
          return;
        }
        while (reduce <= this.tableElement!.clientHeight) {
          let newTableElement = this.addTableElement(visibleObjects[skip], true, false, false);
          reduce += newTableElement.clientHeight;
        }
        for (let i = 0; i < this.currentRecycleList.length; i++) {
          this.freshCurrentLine(
            this.currentRecycleList[i],
            visibleObjects[i + skip],
            this.treeElement?.children[i] as HTMLElement
          );
        }
      });
    return visibleObjects;
  }

  private addTableElement(
    rowData: TableRowObject,
    isTree: boolean,
    last: boolean,
    translate: boolean,
    totalHeight?: number
  ) {
    let newTableElement;
    if (isTree) {
      newTableElement = this.createNewTreeTableElement(rowData);
    } else {
      newTableElement = this.createNewTableElement(rowData);
    }
    if (translate) {
      newTableElement.style.transform = `translateY(${totalHeight}px)`;
    }
    this.tbodyElement?.append(newTableElement);
    if (last) {
      if (this.hasAttribute('tree')) {
        if (this.treeElement?.lastChild) {
          (this.treeElement?.lastChild as HTMLElement).style.height = rowData.height + 'px';
        }
      }
    }
    this.currentRecycleList.push(newTableElement);
    return newTableElement;
  }

  createNewTreeTableElement(rowData: TableRowObject): any {
    let rowTreeElement = document.createElement('div');
    rowTreeElement.classList.add('tr');
    let treeTop = 0;
    if (this.treeElement!.children?.length > 0) {
      let transX = Number((this.treeElement?.lastChild as HTMLElement).style.transform.replace(/[^0-9]/gi, ''));
      treeTop += transX + rowData.height;
    }
    this?.columns?.forEach((column: any, index) => {
      let dataIndex = column.getAttribute('data-index') || '1';
      let td: any;
      if (index === 0) {
        td = this.firstElementTdHandler(rowTreeElement, dataIndex, rowData, column);
      } else {
        td = this.otherElementHandler(dataIndex, rowData, column);
        rowTreeElement.append(td);
      }
    });
    let lastChild = this.treeElement?.lastChild as HTMLElement;
    if (lastChild) {
      lastChild.style.transform = `translateY(${treeTop}px)`;
    }
    (rowTreeElement as any).data = rowData.data;
    rowTreeElement.style.gridTemplateColumns = this.gridTemplateColumns.slice(1).join(' ');
    rowTreeElement.style.position = 'absolute';
    rowTreeElement.style.top = '0px';
    rowTreeElement.style.left = '0px';
    rowTreeElement.style.cursor = 'pointer';
    this.setHighLight(rowData.data.isSearch, rowTreeElement);
    this.addRowElementEvent(rowTreeElement, rowData);
    return rowTreeElement;
  }

  addRowElementEvent(rowTreeElement: HTMLDivElement, rowData: any): void {
    rowTreeElement.onmouseenter = () => {
      if ((rowTreeElement as any).data.isSelected) return;
      let indexOf = this.currentRecycleList.indexOf(rowTreeElement);
      this.currentTreeDivList.forEach((row) => {
        row.classList.remove('mouse-in');
      });
      if (indexOf >= 0 && indexOf < this.treeElement!.children.length) {
        this.setMouseIn(true, [this.treeElement?.children[indexOf] as HTMLElement]);
      }
    };
    rowTreeElement.onmouseleave = () => {
      if ((rowTreeElement as any).data.isSelected) return;
      let indexOf = this.currentRecycleList.indexOf(rowTreeElement);
      if (indexOf >= 0 && indexOf < this.treeElement!.children.length) {
        this.setMouseIn(false, [this.treeElement?.children[indexOf] as HTMLElement]);
      }
    };
    rowTreeElement.onmouseup = (e: MouseEvent) => {
      let indexOf = this.currentRecycleList.indexOf(rowTreeElement);
      this.dispatchRowClickEvent(rowData, [this.treeElement?.children[indexOf] as HTMLElement, rowTreeElement], e);
    };
  }

  firstElementTdHandler(tr: HTMLDivElement, dataIndex: string, row: any, column: any) {
    let td: any;
    let text = formatName(dataIndex, row.data[dataIndex], this);
    if (column.template) {
      td = column.template.render(row.data).content.cloneNode(true);
      td.template = column.template;
      td.title = row.data[dataIndex];
    } else {
      td = document.createElement('div');
      if (row.data.rowName === 'js-memory' || row.data.rowName === 'cpu-profiler') {
        td.innerHTML = '';
      } else {
        td.innerHTML = text;
      }
      td.dataIndex = dataIndex;
      if (text.indexOf('&lt;') === -1) {
        td.title = text;
      }
    }
    if (row.data.children && row.data.children.length > 0 && !row.data.hasNext) {
      let btn = this.createExpandBtn(row);
      td.insertBefore(btn, td.firstChild);
    }
    if (row.data.hasNext) {
      td.title = row.data.objectName;
      let btn = this.createBtn(row);
      td.insertBefore(btn, td.firstChild);
    }
    td.style.paddingLeft = row.depth * iconWidth + 'px';
    if (!row.data.children || row.data.children.length === 0) {
      td.style.paddingLeft = iconWidth * row.depth + iconWidth + iconPadding * 2 + 'px';
    }
    this.jsMemoryHandler(row, td);
    if (row.data.rowName === 'cpu-profiler') {
      this.createTextColor(row, td);
    }
    (td as any).data = row.data;
    td.classList.add('tree-first-body');
    td.style.position = 'absolute';
    td.style.top = '0px';
    td.style.left = '0px';
    this.addFirstElementEvent(td, tr, row);
    this.setHighLight(row.data.isSearch, td);
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
        this.setMouseIn(true, [tr]);
      }
    };
    td.onmouseleave = () => {
      let indexOf = this.currentTreeDivList.indexOf(td);
      if (indexOf >= 0 && indexOf < this.currentRecycleList.length) {
        this.setMouseIn(false, [tr]);
      }
    };
    td.onmouseup = (e: MouseEvent) => {
      let indexOf = this.currentTreeDivList.indexOf(td);
      this.dispatchRowClickEvent(rowData, [td, tr], e);
    };
  }

  otherElementHandler(dataIndex: string, rowData: any, column: any) {
    let tdDiv: any = document.createElement('div');
    tdDiv.classList.add('td');
    tdDiv.style.overflow = 'hidden';
    tdDiv.style.textOverflow = 'ellipsis';
    tdDiv.style.whiteSpace = 'nowrap';
    let text = formatName(dataIndex, rowData.data[dataIndex], this);
    if (text.indexOf('&lt;') === -1) {
      if (dataIndex === 'selfTimeStr' && rowData.data.chartFrameChildren) {
        tdDiv.title = rowData.data.selfTime + 'ns';
      } else if (dataIndex === 'totalTimeStr' && rowData.data.chartFrameChildren) {
        tdDiv.title = rowData.data.totalTime + 'ns';
      } else {
        tdDiv.title = text;
      }
    }
    tdDiv.dataIndex = dataIndex;
    tdDiv.style.justifyContent = column.getAttribute('align') || 'flex-start';
    if (column.template) {
      tdDiv.appendChild(column.template.render(rowData.data).content.cloneNode(true));
      tdDiv.template = column.template;
    } else {
      tdDiv.innerHTML = text;
    }
    return tdDiv;
  }

  createNewTableElement(rowData: any): any {
    let newTableElement = document.createElement('div');
    newTableElement.classList.add('tr');
    this?.columns?.forEach((column: any) => {
      let dataIndex = column.getAttribute('data-index') || '1';
      let td = this.createColumnTd(dataIndex, column, rowData);
      newTableElement.append(td);
    });
    newTableElement.onmouseup = (e: MouseEvent) => {
      this.dispatchRowClickEvent(rowData, [newTableElement], e);
    };
    newTableElement.onmouseenter = () => {
      this.dispatchRowHoverEvent(rowData, [newTableElement]);
    };
    if (rowData.data.isSelected != undefined) {
      this.setSelectedRow(rowData.data.isSelected, [newTableElement]);
    }
    (newTableElement as any).data = rowData.data;
    newTableElement.style.cursor = 'pointer';
    newTableElement.style.gridTemplateColumns = this.gridTemplateColumns.join(' ');
    newTableElement.style.position = 'absolute';
    newTableElement.style.top = '0px';
    newTableElement.style.left = '0px';
    if (this.getItemTextColor) {
      newTableElement.style.color = this.getItemTextColor(rowData.data);
    }
    return newTableElement;
  }

  createColumnTd(dataIndex: string, column: any, rowData: any): any {
    let td: any;
    td = document.createElement('div');
    td.classList.add('td');
    td.style.overflow = 'hidden';
    td.style.textOverflow = 'ellipsis';
    td.style.whiteSpace = 'nowrap';
    td.dataIndex = dataIndex;
    td.style.justifyContent = column.getAttribute('align') || 'flex-start';
    let text = formatName(dataIndex, rowData.data[dataIndex], this);
    if (text.indexOf('&lt;') === -1) {
      if (dataIndex === 'totalTimeStr' && rowData.data.chartFrameChildren) {
        td.title = rowData.data.totalTime + 'ns';
      } else {
        td.title = text;
      }
    }
    //   如果表格中有模板的情况，将模板中的数据放进td中，没有模板，直接将文本放进td
    //  但是对于Current Selection tab页来说，表格前两列是时间，第三列是input标签，第四列是button标签
    //  而第一行的数据只有第四列一个button，和模板中的数据并不一样，所以要特别处理一下
    if (column.template) {
      if (dataIndex === 'color' && rowData.data.colorEl === undefined) {
        td.innerHTML = '';
        td.template = '';
      } else if (dataIndex === 'operate' && rowData.data.operate && rowData.data.operate.innerHTML === 'RemoveAll') {
        let removeAll = document.createElement('button');
        removeAll.className = 'removeAll';
        removeAll.innerHTML = 'RemoveAll';
        removeAll.style.background = 'var(--dark-border1,#262f3c)';
        removeAll.style.color = 'white';
        removeAll.style.borderRadius = '10px';
        removeAll.style.fontSize = '10px';
        removeAll.style.height = '18px';
        removeAll.style.lineHeight = '18px';
        removeAll.style.minWidth = '7em';
        removeAll.style.border = 'none';
        removeAll.style.cursor = 'pointer';
        removeAll.style.outline = 'inherit';
        td.appendChild(removeAll);
      } else {
        td.appendChild(column.template.render(rowData.data).content.cloneNode(true));
        td.template = column.template;
      }
    } else {
      td.innerHTML = text;
    }
    return td;
  }

  createBtn(rowData: any): any {
    let btn: any = document.createElement('lit-icon');
    btn.classList.add('tree-icon');
    if (rowData.data.expanded) {
      btn.name = 'plus-square';
    } else {
      btn.name = 'minus-square';
    }
    btn.addEventListener('mouseup', (e: MouseEvent) => {
      if (e.button === 0) {
        rowData.data.status = false;
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

        if (rowData.data.expanded) {
          rowData.data.status = true;
          this.dispatchRowClickEventIcon(rowData, [btn]);
          rowData.data.expanded = false;
          resetNodeHidden(true, rowData);
        } else {
          rowData.data.expanded = true;
          rowData.data.status = false;
          resetNodeHidden(false, rowData);
        }
        this.reMeauseHeight();
      }
      e.stopPropagation();
    });
    return btn;
  }

  resetExpandNodeHidden = (hidden: boolean, rowData: any) => {
    if (rowData.children.length > 0) {
      if (hidden) {
        rowData.children.forEach((child: any) => {
          child.rowHidden = true;
          this.resetExpandNodeHidden(hidden, child);
        });
      } else {
        rowData.children.forEach((child: any) => {
          child.rowHidden = !rowData.expanded;
          if (rowData.expanded) {
            this.resetExpandNodeHidden(hidden, child);
          }
        });
      }
    }
  };

  setChildrenStatus(rowData:any, data: any) {
    for (let d of data) {
      if (rowData.data === d) {
        d.status = false;
      }
      if (d.children != undefined && d.children.length > 0) {
        this.setChildrenStatus(rowData, d.children);
      }
    }
  }
  createExpandBtn(rowData: any): any {
    let btn: any = document.createElement('lit-icon');
    btn.classList.add('tree-icon');
    // @ts-ignore
    if (rowData.expanded) {
      btn.name = 'minus-square';
    } else {
      btn.name = 'plus-square';
    }
    btn.onmouseup = (e: MouseEvent) => {
      if (e.button === 0) {
        if (rowData.expanded && this._mode === TableMode.Retract) {
          rowData.data.status = false;
          rowData.expanded = false;
          this.resetExpandNodeHidden(true, rowData);
        } else if (!rowData.expanded && this._mode === TableMode.Retract) {
          rowData.expanded = true;
          rowData.data.status = true;
          this.recycleDs = this.meauseTreeRowElement(this.value, RedrawTreeForm.Retract);
          this.resetExpandNodeHidden(false, rowData);
        }
        if (this._mode === TableMode.Expand && rowData.expanded) {
          // 点击收起的时候将点击的那条数据的status改为false
          this.setChildrenStatus(rowData, this.value);
          rowData.expanded = false;
          this.resetExpandNodeHidden(true, rowData);
        } else if (this._mode === TableMode.Expand && !rowData.expanded) {
          if (rowData.data.children) {
            rowData.data.status = true;
          }
          this.recycleDs = this.meauseTreeRowElement(this.value, RedrawTreeForm.Default);
          rowData.expanded = true;
          this.resetExpandNodeHidden(false, rowData);
        }
        this.reMeauseHeight();
      }
      e.stopPropagation();
    };
    return btn;
  }

  reMeauseHeight(): void {
    if (this.currentRecycleList.length === 0) {
      return;
    }
    let totalHeight = 0;
    this.recycleDs.forEach((it) => {
      if (!it.rowHidden) {
        it.top = totalHeight;
        totalHeight += it.height;
      }
    });
    this.tbodyElement && (this.tbodyElement.style.height = totalHeight + (this.isScrollXOutSide ? 0 : 0) + 'px');
    this.treeElement!.style.height = this.tableElement!.clientHeight - this.theadElement!.clientHeight + 'px';
    let visibleObjects = this.recycleDs.filter((item) => {
      return !item.rowHidden;
    });
    let top = this.tableElement!.scrollTop;
    let skip = 0;
    for (let i = 0; i < visibleObjects.length; i++) {
      if (visibleObjects[i].top <= top && visibleObjects[i].top + visibleObjects[i].height >= top) {
        skip = i;
        break;
      }
    }
    let reduce = this.currentRecycleList.map((item) => item.clientHeight).reduce((a, b) => a + b, 0);
    if (reduce === 0) {
      return;
    }
    while (reduce <= this.tableElement!.clientHeight + 1) {
      let isTree = this.hasAttribute('tree');
      let newTableElement = this.addTableElement(visibleObjects[skip], isTree, isTree, false);
      reduce += newTableElement.clientHeight;
    }
    for (let i = 0; i < this.currentRecycleList.length; i++) {
      if (this.hasAttribute('tree')) {
        this.freshCurrentLine(
          this.currentRecycleList[i],
          visibleObjects[i + skip],
          this.treeElement?.children[i] as HTMLElement
        );
      } else {
        this.freshLineHandler(i, skip, visibleObjects);
      }
    }
  }

  getWheelStatus(element: any): void {
    element.addEventListener('wheel', (event: WheelEvent) => {
      if (element.scrollWidth !== element.offsetWidth) {
        event.preventDefault();
      }
      element.scrollLeft += event.deltaY;
    });
  }

  renderTable(): void {
    if (!this.columns) {
      return;
    }
    if (!this.ds) {
      return;
    } // If no data source is set, it is returned directly
    this.normalDs = [];
    this.tbodyElement!.innerHTML = ''; // Clear the table contents
    this.ds.forEach((rowData: any) => {
      let tblRowElement = document.createElement('div');
      tblRowElement.classList.add('tr');
      // @ts-ignore
      tblRowElement.data = rowData;
      let gridTemplateColumns: Array<any> = [];
      // If the table is configured with selectable (select row mode) add a checkbox at the head of the line alone
      this.renderTableRowSelect(tblRowElement);
      this.tableColumns!.forEach((tblColumn) => {
        tblColumn.addEventListener('contextmenu', (e) => {
          e.preventDefault();
        });
        let dataIndex = tblColumn.getAttribute('data-index') || '1';
        gridTemplateColumns.push(tblColumn.getAttribute('width') || '1fr');
        this.renderTableRowColumnElement(tblColumn, tblRowElement, dataIndex, rowData);
      });
      if (this.selectable) {
        // If the table with selection is preceded by a 60px column
        tblRowElement.style.gridTemplateColumns = '60px ' + gridTemplateColumns.join(' ');
      } else {
        tblRowElement.style.gridTemplateColumns = gridTemplateColumns.join(' ');
      }
      this.renderTableRowElementEvent(tblRowElement, rowData);
      this.normalDs.push(tblRowElement);
      this.tbodyElement!.append(tblRowElement);
    });
  }

  renderTableRowSelect(tblRowElement: HTMLDivElement): void {
    if (this.selectable) {
      let tblBox = document.createElement('div');
      tblBox.style.display = 'flex';
      tblBox.style.justifyContent = 'center';
      tblBox.style.alignItems = 'center';
      tblBox.classList.add('td');
      let checkbox = document.createElement('lit-checkbox');
      checkbox.classList.add('row-checkbox');
      checkbox.onchange = (e: any) => {
        // Checkbox checking affects whether the div corresponding to the row has a checked attribute for marking
        if (e.detail.checked) {
          tblRowElement.setAttribute('checked', '');
        } else {
          tblRowElement.removeAttribute('checked');
        }
      };
      this.getWheelStatus(tblBox);
      tblBox.appendChild(checkbox);
      tblRowElement.appendChild(tblBox);
    }
  }

  renderTableRowColumnElement(tblColumn: LitTableColumn, tblRowElement: HTMLDivElement, dataIndex: string, rowData: any): void {
    if (tblColumn.template) {
      // If you customize the rendering, you get the nodes from the template
      // @ts-ignore
      let cloneNode = tblColumn.template.render(rowData).content.cloneNode(true);
      let tblCustomDiv = document.createElement('div');
      tblCustomDiv.classList.add('td');
      tblCustomDiv.style.wordBreak = 'break-all';
      tblCustomDiv.style.whiteSpace = 'pre-wrap';
      tblCustomDiv.style.justifyContent = tblColumn.getAttribute('align') || '';
      if (tblColumn.hasAttribute('fixed')) {
        fixed(tblCustomDiv, tblColumn.getAttribute('fixed') || '', '#ffffff');
      }
      this.getWheelStatus(tblCustomDiv);
      tblCustomDiv.append(cloneNode);
      tblRowElement.append(tblCustomDiv);
    } else {
      let tblDiv = document.createElement('div');
      tblDiv.classList.add('td');
      tblDiv.style.wordBreak = 'break-all';
      tblDiv.style.whiteSpace = 'pre-wrap';
      tblDiv.title = rowData[dataIndex];
      tblDiv.style.justifyContent = tblColumn.getAttribute('align') || '';
      if (tblColumn.hasAttribute('fixed')) {
        fixed(tblDiv, tblColumn.getAttribute('fixed') || '', '#ffffff');
      }
      this.getWheelStatus(tblDiv);
      tblDiv.innerHTML = formatName(dataIndex, rowData[dataIndex], this);
      tblRowElement.append(tblDiv);
    }
  }

  renderTableRowElementEvent(tblRowElement: HTMLDivElement, rowData: any): void {
    tblRowElement.onmouseup = (e: MouseEvent) => {
      this.dispatchEvent(
        new CustomEvent('row-click', {
          detail: {
            rowData,
            data: rowData,
            callBack: (isSelected: boolean) => {
              //是否爲单选
              if (isSelected) {
                this.clearAllSelection(rowData);
              }
              this.setSelectedRow(rowData.isSelected, [tblRowElement]);
            },
          },
          composed: true,
        })
      );
    };
  }

  freshCurrentLine(element: HTMLElement, rowObject: TableRowObject, firstElement?: HTMLElement): void {
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
      if (idx < this.columns!.length) {
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
          if (dataIndex === 'selfTimeStr' && rowObject.data.chartFrameChildren) {
            (child as HTMLElement).title = rowObject.data.selfTime + 'ns';
          } else if (dataIndex === 'totalTimeStr' && rowObject.data.chartFrameChildren) {
            (child as HTMLElement).title = rowObject.data.totalTime + 'ns';
          } else if (dataIndex === 'timeStr' && rowObject.data instanceof JsCpuProfilerStatisticsStruct) {
            (child as HTMLElement).title = rowObject.data.time + 'ns';
          } else {
            (child as HTMLElement).title = text;
          }
        }
      }
    });
    this.freshLineStyleAndEvents(element, rowObject, firstElement);
  }

  freshLineStyleAndEvents(element: HTMLElement, rowObject: TableRowObject, firstElement?: HTMLElement): void {
    if (element.style.display === 'none') {
      element.style.display = 'grid';
    }
    element.style.transform = `translateY(${rowObject.top}px)`;
    if (firstElement && firstElement.style.display === 'none') {
      firstElement.style.display = 'flex';
    }
    element.onmouseup = (e: MouseEvent) => {
      if (firstElement !== undefined) {
        this.dispatchRowClickEvent(rowObject, [firstElement, element], e);
      } else {
        this.dispatchRowClickEvent(rowObject, [element], e);
      }
    };
    element.onmouseenter = () => {
      this.dispatchRowHoverEvent(rowObject, [element]);
    };
    (element as any).data = rowObject.data;
    if (rowObject.data.isSelected !== undefined) {
      this.setSelectedRow(rowObject.data.isSelected, [element]);
    } else {
      this.setSelectedRow(false, [element]);
    }
    if (rowObject.data.isHover !== undefined) {
      this.setMouseIn(rowObject.data.isHover, [element]);
    } else {
      this.setMouseIn(false, [element]);
    }
    if (this.getItemTextColor) {
      element.style.color = this.getItemTextColor((element as any).data);
    }
  }

  freshLineFirstElementHandler(firstElement: any, rowObject: TableRowObject, childIndex: number): void {
    if (firstElement !== undefined && childIndex === 0) {
      this.setHighLight(rowObject.data.isSearch, firstElement);
      (firstElement as any).data = rowObject.data;
      if ((this.columns![0] as any).template) {
        firstElement.innerHTML = (this.columns![0] as any).template
          .render(rowObject.data)
          .content.cloneNode(true).innerHTML;
      } else {
        let dataIndex = this.columns![0].getAttribute('data-index') || '1';
        let text = formatName(dataIndex, rowObject.data[dataIndex], this);
        if (rowObject.data.rowName === 'js-memory' || rowObject.data.rowName === 'cpu-profiler') {
          firstElement.innerHTML = '';
        } else {
          firstElement.innerHTML = text;
        }
        firstElement.title = text;
      }
      if (rowObject.children && rowObject.children.length > 0 && !rowObject.data.hasNext) {
        let btn = this.createExpandBtn(rowObject);
        firstElement.insertBefore(btn, firstElement.firstChild);
      }
      firstElement.style.paddingLeft = iconWidth * rowObject.depth + 'px';
      if (!rowObject.children || rowObject.children.length === 0) {
        firstElement.style.paddingLeft = iconWidth * rowObject.depth + iconWidth + iconPadding * 2 + 'px';
      }
      if (rowObject.data.hasNext) {
        let btn = this.createBtn(rowObject);
        firstElement.title = rowObject.data.objectName;
        firstElement.insertBefore(btn, firstElement.firstChild);
        firstElement.style.paddingLeft = iconWidth * rowObject.depth + 'px';
      }
      this.jsMemoryHandler(rowObject, firstElement);
      if (rowObject.data.rowName === 'cpu-profiler') {
        this.createTextColor(rowObject, firstElement);
      }
      firstElement.onmouseup = (e: MouseEvent) => {
        this.dispatchRowClickEvent(rowObject, [firstElement, element], e);
      };
      firstElement.style.transform = `translateY(${rowObject.top - this.tableElement!.scrollTop}px)`;
      if (rowObject.data.isSelected !== undefined) {
        this.setSelectedRow(rowObject.data.isSelected, [firstElement]);
      } else {
        this.setSelectedRow(false, [firstElement]);
      }
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
    if (this.isRecycleList) {
      if (this.recycleDs.length > 0) {
        let filter = this.recycleDs.filter((item) => {
          return item.data === data;
        });
        if (filter.length > 0) {
          this.tableElement!.scrollTop = filter[0].top;
        }
        this.setCurrentSelection(data);
      }
    } else {
      if (this.normalDs.length > 0) {
        let filter = this.normalDs.filter((item) => {
          return item.data === data;
        });
        if (filter.length > 0) {
          this.tableElement!.scrollTop = filter[0].top;
        }
      }
    }
  }

  expandList(datasource: any[]): void {
    let filter = this.recycleDs.filter((item) => {
      return datasource.indexOf(item.data) != -1;
    });
    if (filter.length > 0) {
      filter.forEach((item) => {
        item.expanded = true;
        item.rowHidden = false;
      });
    }
    this.reMeauseHeight();
  }

  clearAllSelection(rowObjectData: any): void {
    if (this.isRecycleList) {
      this.recycleDs.forEach((item) => {
        if (item.data != rowObjectData && item.data.isSelected) {
          item.data.isSelected = false;
        }
      });
      this.setSelectedRow(false, this.currentTreeDivList);
      this.setSelectedRow(false, this.currentRecycleList);
    } else {
      this.dataSource.forEach((item) => {
        if (item != rowObjectData && item.isSelected) {
          item.isSelected = false;
        }
      });
      this.setSelectedRow(false, this.normalDs);
    }
  }

  clearAllHover(rowObjectData: any): void {
    if (this.isRecycleList) {
      this.recycleDs.forEach((item) => {
        if (item.data != rowObjectData && item.data.isHover) {
          item.data.isHover = false;
        }
      });
      this.setMouseIn(false, this.currentTreeDivList);
      this.setMouseIn(false, this.currentRecycleList);
    } else {
      this.dataSource.forEach((item) => {
        if (item != rowObjectData && item.isHover) {
          item.isHover = false;
        }
      });
      this.setMouseIn(false, this.normalDs);
    }
  }

  mouseOut(): void {
    if (this.isRecycleList) {
      this.recycleDs.forEach((item) => (item.data.isHover = false));
      this.setMouseIn(false, this.currentTreeDivList);
      this.setMouseIn(false, this.currentRecycleList);
    } else {
      this.dataSource.forEach((item) => (item.isHover = false));
      this.setMouseIn(false, this.normalDs);
    }
    this.dispatchEvent(
      new CustomEvent('row-hover', {
        detail: {
          data: undefined,
        },
        composed: true,
      })
    );
  }

  setCurrentSelection(selectionData: any): void {
    if (this.isRecycleList) {
      if (selectionData.isSelected !== undefined) {
        this.currentTreeDivList.forEach((itemEl) => {
          if ((itemEl as any).data === selectionData) {
            this.setSelectedRow(selectionData.isSelected, [itemEl]);
          }
        });
        this.currentRecycleList.forEach((recycleItem) => {
          if ((recycleItem as any).data === selectionData) {
            this.setSelectedRow(selectionData.isSelected, [recycleItem]);
          }
        });
      }
    } else {
      if (selectionData.isSelected !== undefined) {
        this.normalDs.forEach((item) => {
          if ((item as any).data === selectionData) {
            this.setSelectedRow(selectionData.isSelected, [item]);
          }
        });
      }
    }
  }

  setCurrentHover(data: any): void {
    if (this.isRecycleList) {
      this.setMouseIn(false, this.currentTreeDivList);
      this.setMouseIn(false, this.currentRecycleList);
      if (data.isHover !== undefined) {
        this.currentTreeDivList.forEach((hoverItem) => {
          if ((hoverItem as any).data === data) {
            this.setMouseIn(data.isHover, [hoverItem]);
          }
        });
        this.currentRecycleList.forEach((hoverItem) => {
          if ((hoverItem as any).data === data) {
            this.setMouseIn(data.isHover, [hoverItem]);
          }
        });
      }
    } else {
      this.setMouseIn(false, this.normalDs);
      if (data.isHover !== undefined) {
        this.normalDs.forEach((item): void => {
          if ((item as any).data === data) {
            this.setMouseIn(data.isHover, [item]);
          }
        });
      }
    }
  }

  dispatchRowClickEventIcon(rowData: any, elements: any[]): void {
    this.dispatchEvent(
      new CustomEvent('icon-click', {
        detail: {
          ...rowData.data,
          data: rowData.data,
          callBack: (isSelected: boolean): void => {
            //是否爲单选
            if (isSelected) {
              this.clearAllSelection(rowData.data);
            }
            this.setSelectedRow(rowData.data.isSelected, elements);
          },
        },
        composed: true,
      })
    );
  }

  dispatchRowClickEvent(rowObject: any, elements: any[], event: MouseEvent): void {
    this.dispatchEvent(
      new CustomEvent('row-click', {
        detail: {
          button: event.button,
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

  createTextColor(rowData: any, divElement: any): void {
    let nodeText = document.createElement('text');
    nodeText.classList.add('functionName');
    nodeText.textContent = rowData.data.name;
    divElement.append(nodeText);
    if (rowData.data.scriptName !== 'unknown') {
      let scriptText = document.createElement('text');
      scriptText.classList.add('scriptName');
      scriptText.textContent = rowData.data.scriptName;
      divElement.append(scriptText);
      scriptText.style.color = '#a1a1a1';
    }
    divElement.title = rowData.data.symbolName;
  }

  jsMemoryHandler(rowData: any, td: any) {
    if (rowData.data.rowName === 'js-memory') {
      let nodeText = document.createElement('text');
      nodeText.classList.add('nodeName');
      nodeText.textContent = rowData.data.nodeName;
      td.append(nodeText);
      let countText = document.createElement('text');
      countText.classList.add('countName');
      countText.textContent = rowData.data.count;
      td.append(countText);
      let nodeIdText = document.createElement('text');
      nodeIdText.classList.add('nodeIdText');
      nodeIdText.textContent = rowData.data.nodeId;
      td.append(nodeIdText);
      if (rowData.data.edgeName != '') {
        let edgeNameText = document.createElement('text');
        edgeNameText.classList.add('edgeNameText');
        edgeNameText.textContent = rowData.data.edgeName;
        td.insertBefore(edgeNameText, nodeText);
        let span = document.createElement('span');
        span.classList.add('span');
        if (rowData.data.type === ConstructorType.RetainersType) {
          span.textContent = '\xa0' + 'in' + '\xa0';
          nodeIdText.textContent = ` @${rowData.data.id}`;
        } else {
          span.textContent = '\xa0' + '::' + '\xa0';
        }
        edgeNameText.append(span);
      }
      if (
        (rowData.data.nodeType === NodeType.STRING ||
          rowData.data.nodeType === NodeType.CONCATENATED_STRING ||
          rowData.data.nodeType === NodeType.SLICED_STRING) &&
        rowData.data.type !== ConstructorType.ClassType
      ) {
        nodeText.style.color = '#d53d3d';
        nodeText.textContent = '"' + rowData.data.nodeName + '"';
      }
      td.title = rowData.data.objectName;
    }
  }
}

// 表格默认是展开还是收起的
export enum TableMode {
  Expand, // 默认展开
  Retract, // 默认收起
}

// 重绘的表格是要全部展开，全部收起，还是一层一层手动打开
export enum RedrawTreeForm {
  Expand, // 一键展开
  Retract, // 一键收起
  Default, //点击加号，逐层展开
}
