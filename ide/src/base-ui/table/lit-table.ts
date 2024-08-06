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
  formatName,
} from './LitTableHtml';

@element('lit-table')
export class LitTable extends HTMLElement {
  meauseRowElement: HTMLDivElement | undefined;
  currentRecycleList: HTMLDivElement[] = [];
  currentTreeDivList: HTMLDivElement[] = [];
  public rememberScrollTop = false;
  public getItemTextColor?: (data: unknown) => string;
  public itemTextHandleMap: Map<string, (value: unknown) => string> = new Map<string, (value: unknown) => string>();
  public exportTextHandleMap: Map<string, (value: unknown) => string> = new Map<string, (value: unknown) => string>();
  public ds: Array<unknown> = [];
  public recycleDs: Array<unknown> = [];
  public gridTemplateColumns: Array<string> = [];
  public tableColumns: NodeListOf<LitTableColumn> | undefined;
  public treeElement: HTMLDivElement | undefined | null;
  public columns: Array<Element> | null | undefined;
  public exportLoading: boolean = false;
  public exportProgress: LitProgressBar | null | undefined;
  public tableElement: HTMLDivElement | null | undefined;
  private normalDs: Array<unknown> = [];
  /*Grid css layout descriptions are obtained according to the clustern[] nested structure*/
  private st: HTMLSlotElement | null | undefined;
  private theadElement: HTMLDivElement | null | undefined;
  private tbodyElement: HTMLDivElement | undefined | null;
  private colCount: number = 0;
  private isRecycleList: boolean = true;
  private isScrollXOutSide: boolean = false;
  private value: Array<unknown> = [];
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

  get dataSource(): unknown[] {
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

  get recycleDataSource(): unknown[] {
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
      }
      if (this.hasAttribute('tree') && this.querySelector('lit-table-column')?.hasAttribute('retract')) {
        if ((value.length === 0 || this.value.length !== 0) && value !== this.value && !this._isSearch) {
          if (this.shadowRoot!.querySelector<LitIcon>('.top')) {
            this.shadowRoot!.querySelector<LitIcon>('.top')!.name = 'up';
          }
          if (this.shadowRoot!.querySelector<LitIcon>('.bottom')) {
            this.shadowRoot!.querySelector<LitIcon>('.bottom')!.name = 'down';
          }
        }
        this.value = value;
        this._isSearch = false;
        this.recycleDs = this.meauseTreeRowElement(value, RedrawTreeForm.Retract);
      } else {
        this.recycleDs = this.meauseAllRowHeight(value);
      }
    }
  }

  get snapshotDataSource(): unknown[] {
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
          columns: this.columns as unknown[],
          tables: this.ds,
          sheetName: `${now}`,
        },
      ],
      `${now}`
    );
  }

  formatExportData(dataSource: unknown[]): unknown[] {
    return formatExportData(dataSource, this);
  }

  formatExportCsvData(dataSource: unknown[]): string {
    if (dataSource === undefined || dataSource.length === 0) {
      return '';
    }
    if (this.columns === undefined) {
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
    str += recursionExportTableData(this.columns || [], dataSource);
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
  /**
   * 设置表格每条数据的展开/收起状态
   * @param list 表格数据
   * @param status 展开/收起状态
   * @param depth 展开深度，用来实现和图标的联动
   * @param profundity 展开深度，用来实现逐级展开
   */
  public setStatus(list: unknown, status: boolean, depth: number = 0, profundity?: number): void {
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
    } // @ts-ignore
    for (let item of list) {
      if (profundity) {
        if (depth < profundity) {
          item.status = true;
          status = true;
        } else {
          item.status = false;
          status = false;
        }
      } else {
        item.status = status;
      }
      if (item.children !== undefined && item.children.length > 0) {
        this.setStatus(item.children, status, depth + 1, profundity);
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
        let area: Array<unknown> = [];
        this.gridTemplateColumns = [];
        this.resolvingArea(this.columns, 0, 0, area, rowElement);
        area.forEach((rows, j, array) => {
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
          let s = area.map((a) => '"_checkbox_ ' + a.map((aa: unknown) => aa.t).join(' ') + '"').join(' ');
          rowElement.style.gridTemplateColumns = '60px ' + this.gridTemplateColumns.join(' ');
          rowElement.style.gridTemplateRows = `repeat(${area.length},1fr)`;
          rowElement.style.gridTemplateAreas = s;
        } else {
          // @ts-ignore
          let s = area.map((a) => '"' + a.map((aa: unknown) => aa.t).join(' ') + '"').join(' ');
          rowElement.style.gridTemplateColumns = this.gridTemplateColumns.join(' ');
          rowElement.style.gridTemplateRows = `repeat(${area.length},1fr)`;
          rowElement.style.gridTemplateAreas = s;
        }
        this.theadElement!.innerHTML = '';
        this.theadElement!.append(rowElement);
      });
    });
    this.shadowRoot!.addEventListener('load', function (event) { });
    this.tableElement!.addEventListener('mouseout', (ev) => this.mouseOut());
    this.treeElement && (this.treeElement!.style.transform = 'translateY(0px)');
    this.tbodyElement && (this.tbodyElement!.style.transform = 'translateY(0px)');
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
        let len = a.querySelectorAll('lit-table-column').length; // @ts-ignore
        let children = [...a.children].filter((a) => a.tagName !== 'TEMPLATE');
        if (children.length > 0) {
          // @ts-ignore
          this.resolvingArea(children, x, y + 1, area, rowElement);
        }
        for (let j = 0; j < len; j++) {
          // @ts-ignore
          area[y][x] = { x, y, t: key }; // @ts-ignore
          x++;
        }
        let h = document.createElement('div');
        h.classList.add('td'); // @ts-ignore
        h.style.justifyContent = a.getAttribute('align');
        h.style.borderBottom = '1px solid #f0f0f0';
        h.style.gridArea = key; // @ts-ignore
        h.innerText = a.title; // @ts-ignore
        if (a.hasAttribute('fixed')) {
          // @ts-ignore
          fixed(h, a.getAttribute('fixed'), '#42b983');
        }
        rowElement.append(h); // @ts-ignore
      } else if (a.tagName === 'LIT-TABLE-COLUMN') {
        // @ts-ignore
        area[y][x] = { x, y, t: key }; // @ts-ignore
        x++; // @ts-ignore
        let head = this.resolvingAreaColumn(rowElement, a, i, key); // @ts-ignore
        this.gridTemplateColumns.push(a.getAttribute('width') || '1fr'); // @ts-ignore
        let labelArr = a.title.split('/');
        for (let i = 0; i < labelArr.length; i++) {
          let titleLabel = document.createElement('label');
          titleLabel.style.cursor = 'pointer';
          i === 0 ? (titleLabel.textContent = labelArr[i]) : (titleLabel.textContent = '/' + labelArr[i]);
          head.appendChild(titleLabel);
        } // @ts-ignore
        if (a.hasAttribute('fixed')) {
          // @ts-ignore
          fixed(head, a.getAttribute('fixed'), '#42b983');
        }
        rowElement.append(head);
      }
    });
  }

  resolvingAreaColumn(rowElement: HTMLDivElement, column: unknown, index: number, key: string): HTMLDivElement {
    let head: unknown = document.createElement('div'); // @ts-ignore
    head.classList.add('td');
    if ((this.hasAttribute('tree') && index > 1) || (!this.hasAttribute('tree') && index > 0)) {
      let resizeDiv: HTMLDivElement = document.createElement('div');
      resizeDiv.classList.add('resize'); // @ts-ignore
      head.appendChild(resizeDiv);
      this.resizeEventHandler(rowElement, resizeDiv, index);
    } // @ts-ignore
    this.resolvingAreaColumnRetract(column, head);
    this.resolvingAreaColumnOrder(column, index, key, head); // @ts-ignore
    this.resolvingAreaColumnButton(column, key, head); // @ts-ignore
    head.style.justifyContent = column.getAttribute('align'); // @ts-ignore
    head.style.gridArea = key; // @ts-ignore
    return head;
  }

  resolvingAreaColumnRetract(column: unknown, columnHead: HTMLDivElement): void {
    // @ts-ignore
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
        if (top.name === 'up' && bottom.name === 'down') {
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

  resolvingAreaColumnButton(column: unknown, key: string, head: HTMLDivElement): void {
    // @ts-ignore
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

  resolvingAreaColumnOrder(column: unknown, index: number, key: string, columnHead: unknown): void {
    // @ts-ignore
    if (column.hasAttribute('order')) {
      // @ts-ignore
      (columnHead as unknown).sortType = 0; // @ts-ignore
      columnHead.classList.add('td-order'); // @ts-ignore
      columnHead.style.position = 'relative'; // @ts-ignore
      let { upSvg, downSvg } = createDownUpSvg(index, columnHead); // @ts-ignore
      columnHead.onclick = (): void => {
        if (this.isResize || this.resizeColumnIndex !== -1) {
          return;
        }
        this?.shadowRoot?.querySelectorAll('.td-order svg').forEach((it: unknown) => {
          // @ts-ignore
          it.setAttribute('fill', 'let(--dark-color1,#212121)'); // @ts-ignore
          it.sortType = 0; // @ts-ignore
          it.style.display = 'none';
        }); // @ts-ignore
        if (columnHead.sortType === undefined || columnHead.sortType === null) {
          // @ts-ignore
          columnHead.sortType = 0; // @ts-ignore
        } else if (columnHead.sortType === 2) {
          // @ts-ignore
          columnHead.sortType = 0;
        } else {
          // @ts-ignore
          columnHead.sortType += 1;
        }
        upSvg.setAttribute('fill', 'let(--dark-color1,#212121)');
        downSvg.setAttribute('fill', 'let(--dark-color1,#212121)'); // @ts-ignore
        upSvg.style.display = columnHead.sortType === 1 ? 'block' : 'none'; // @ts-ignore
        downSvg.style.display = columnHead.sortType === 2 ? 'block' : 'none'; // @ts-ignore
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
              // @ts-ignore
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
      if (!this.columnResizeEnable) {
        return;
      }
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
      if (!this.columnResizeEnable) {
        return;
      }
      event.stopPropagation();
      event.preventDefault();
      this.isResize = false;
      this.resizeDownX = 0;
      this.resizeColumnIndex = -1;
      header.style.cursor = 'pointer';
    });
    element.addEventListener('mousedown', (event) => {
      if (event.button === 0) {
        if (!this.columnResizeEnable) {
          return;
        }
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

  resizeMouseMoveEventHandler(header: HTMLDivElement): void {
    header.addEventListener('mousemove', (event) => {
      if (!this.columnResizeEnable) {
        return;
      }
      if (this.isResize) {
        let width = event.clientX - this.resizeDownX;
        header.style.cursor = 'col-resize';
        let preWidth = Math.max(this.beforeResizeWidth + width, this.columnMinWidth);
        this.gridTemplateColumns[header.childNodes.length - 1] = '1fr';
        for (let i = 0; i < header.childNodes.length; i++) {
          let node = header.childNodes.item(i) as HTMLDivElement;
          this.gridTemplateColumns[i] = `${node.clientWidth}px`;
        }
        this.gridTemplateColumns[this.resizeColumnIndex - 1] = `${preWidth}px`;
        let lastNode = header.childNodes.item(header.childNodes.length - 1) as HTMLDivElement;
        let totalWidth = 0;
        this.gridTemplateColumns.forEach((it) => {
          totalWidth += parseInt(it);
        });
        totalWidth = Math.max(totalWidth, this.shadowRoot!.querySelector<HTMLDivElement>('.table')!.scrollWidth);
        this.gridTemplateColumns[this.gridTemplateColumns.length - 1] = `${totalWidth - lastNode.offsetLeft}px`;
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

  adoptedCallback(): void { }

  getCheckRows(): unknown[] {
    // @ts-ignore
    return [...this.shadowRoot!.querySelectorAll('div[class=tr][checked]')] // @ts-ignore
      .map((a) => (a as unknown).data)
      .map((a) => {
        if ('children' in a) {
          Reflect.deleteProperty(a, 'chlidren');
        }
        return a;
      });
  }

  deleteRowsCondition(fn: unknown): void {
    this.shadowRoot!.querySelectorAll('div[class=tr]').forEach((tr) => {
      // @ts-ignore
      if (fn(tr.data)) {
        tr.remove();
      }
    });
  }

  meauseElementHeight(rowData: unknown): number {
    return 27;
  }

  meauseTreeElementHeight(rowData: unknown, depth: number): number {
    return 27;
  }

  getVisibleObjects(list: unknown[]): { visibleObjects: TableRowObject[]; totalHeight: number } {
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
        let newTableElement = this.addTableElement(tableRowObject, false, false, true, totalHeight);
        let td = newTableElement?.querySelectorAll('.td'); //@ts-ignore
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

  meauseAllRowHeight(list: unknown[]): TableRowObject[] {
    this.tbodyElement!.innerHTML = '';
    this.meauseRowElement = undefined;
    let head = this.shadowRoot!.querySelector('.th');
    this.tbodyElement && (this.tbodyElement.style.width = head?.clientWidth + 'px');
    this.currentRecycleList = [];
    let { visibleObjects, totalHeight } = this.getVisibleObjects(list);
    this.tbodyElement && (this.tbodyElement.style.height = totalHeight + (this.isScrollXOutSide ? 0 : 0) + 'px');
    this.tableElement &&
      (this.tableElement.onscroll = (event): void => {
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
        if (reduce === 0) {
          return;
        }
        while (reduce <= this.tableElement!.clientHeight) {
          let newTableElement = this.addTableElement(visibleObjects[skip], false, false, false);
          reduce += newTableElement.clientHeight;
        }
        for (let i = 0; i < this.currentRecycleList.length; i++) {
          this.freshLineHandler(i, skip, visibleObjects);
        }
      });
    return visibleObjects;
  }

  freshLineHandler(index: number, skip: number, visibleObjects: TableRowObject[]): void {
    this.freshCurrentLine(this.currentRecycleList[index], visibleObjects[index + skip]);
    if (visibleObjects[index + skip]) {
      //@ts-ignore
      if (visibleObjects[index + skip].data.rowName === 'cpu-profiler') {
        this.createTextColor(visibleObjects[index + skip], this.currentRecycleList[index].childNodes[0]);
      }
    }
  }

  newTableRowObject(item: unknown, totalHeight: number, depth: number, parentNode?: TableRowObject): TableRowObject {
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
    list: unknown[],
    depth: number,
    totalHeight: number,
    visibleObjects: TableRowObject[],
    parentNode?: TableRowObject,
    form?: RedrawTreeForm
  ): number {
    let th = totalHeight;
    let headHeight = this.theadElement?.clientHeight || 0;
    list.forEach((item) => {
      let tableRowObject = this.newTableRowObject(item, th, depth, parentNode); // @ts-ignore
      if (this._mode === TableMode.Expand && form === RedrawTreeForm.Retract && !item.status) {
        tableRowObject.expanded = false;
      } else if (this._mode === TableMode.Expand && form === RedrawTreeForm.Default) {
        tableRowObject.expanded = true;
      }
      if (
        // @ts-ignore
        (this._mode === TableMode.Retract && !item.status) || // @ts-ignore
        (this._mode === TableMode.Expand && !item.status && form !== RedrawTreeForm.Expand)
      ) {
        tableRowObject.expanded = false; // @ts-ignore
        if (item.children !== undefined && item.children.length > 0) {
          this.newTableRowObject(item, th, depth, tableRowObject);
        }
      }
      if (
        Math.max(th, this.tableElement!.scrollTop) <=
        Math.min(
          th + tableRowObject.height,
          this.tableElement!.scrollTop + this.tableElement!.clientHeight - headHeight
        )
      ) {
        this.addTableElement(tableRowObject, true, false, true, th);
      }
      th += tableRowObject.height;
      visibleObjects.push(tableRowObject);
      th = this.resetAllHeightChildrenHandler(item, depth, th, visibleObjects, tableRowObject, form);
    });
    return th;
  }

  resetAllHeightChildrenHandler(
    item: unknown,
    depth: number,
    totalHeight: number,
    visibleObjects: TableRowObject[],
    tableRowObject?: TableRowObject,
    form?: RedrawTreeForm
  ): number {
    let th = totalHeight; // @ts-ignore
    if (item.hasNext) {
      // js memory的表格
      // @ts-ignore
      if (item.parents !== undefined && item.parents.length > 0 && item.status) {
        // @ts-ignore
        th = this.resetAllHeight(item.parents, depth + 1, totalHeight, visibleObjects, tableRowObject); // @ts-ignore
      } else if (item.children !== undefined && item.children.length > 0 && item.status) {
        // @ts-ignore
        th = this.resetAllHeight(item.children, depth + 1, totalHeight, visibleObjects, tableRowObject);
      }
    } else {
      // 其他数据
      if (
        // @ts-ignore
        item.children !== undefined && // @ts-ignore
        item.children.length > 0 &&
        form === RedrawTreeForm.Expand &&
        this._mode === TableMode.Expand
      ) {
        // @ts-ignore
        item.status = true; // @ts-ignore
        th = this.resetAllHeight(item.children, depth + 1, totalHeight, visibleObjects, tableRowObject); // @ts-ignore
      } else if (item.children !== undefined && item.children.length > 0 && item.status) {
        // @ts-ignore
        th = this.resetAllHeight(item.children, depth + 1, totalHeight, visibleObjects, tableRowObject);
      }
    }
    return th;
  }

  measureReset(): void {
    this.meauseRowElement = undefined;
    this.tbodyElement!.innerHTML = '';
    this.treeElement!.innerHTML = '';
    this.currentRecycleList = [];
    this.currentTreeDivList = [];
  }

  meauseTreeRowElement(list: unknown[], form?: RedrawTreeForm): TableRowObject[] {
    this.measureReset();
    let visibleObjects: TableRowObject[] = [];
    let totalHeight = 0;
    totalHeight = this.resetAllHeight(list, 0, totalHeight, visibleObjects);
    this.tbodyElement && (this.tbodyElement.style.height = totalHeight + 'px');
    this.treeElement!.style.height = this.tableElement!.clientHeight - this.theadElement!.clientHeight + 'px';
    this.tableElement &&
      (this.tableElement.onscroll = (event): void => {
        let visibleObjects = this.recycleDs.filter((item) => {
          // @ts-ignore
          return !item.rowHidden;
        });
        let top = this.tableElement!.scrollTop;
        this.treeElement && (this.treeElement!.style.transform = `translateY(${top}px)`);
        let skip = 0;
        for (let index = 0; index < visibleObjects.length; index++) {
          // @ts-ignore
          if (visibleObjects[index].top <= top && visibleObjects[index].top + visibleObjects[index].height >= top) {
            skip = index;
            break;
          }
        }
        // 如果滚动高度大于数据全部收起的高度，并且this.currentRecycleList数组长度为0要给this.currentRecycleList赋值，不然tab页没有数据
        if (
          visibleObjects[0] && // @ts-ignore
          this.tableElement!.scrollTop >= this.value.length * visibleObjects[0].height &&
          this.currentRecycleList.length === 0
        ) {
          // @ts-ignore
          this.addTableElement(visibleObjects[skip], true, false, false);
        }
        let reduce = this.currentRecycleList.map((item) => item.clientHeight).reduce((a, b) => a + b, 0);
        if (reduce === 0) {
          return;
        }
        while (reduce <= this.tableElement!.clientHeight) {
          // @ts-ignore
          let newTableElement = this.addTableElement(visibleObjects[skip], true, false, false);
          reduce += newTableElement.clientHeight;
        }
        for (let i = 0; i < this.currentRecycleList.length; i++) {
          this.freshCurrentLine(
            this.currentRecycleList[i], // @ts-ignore
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
  ): HTMLDivElement {
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

  createNewTreeTableElement(rowData: TableRowObject): HTMLDivElement {
    let rowTreeElement = document.createElement('div');
    rowTreeElement.classList.add('tr');
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
        td = this.firstElementTdHandler(rowTreeElement, dataIndex, rowData, column);
      } else {
        td = this.otherElementHandler(dataIndex, rowData, column); // @ts-ignore
        this.dispatchTdClickEvent(td, column, rowData);// @ts-ignore
        rowTreeElement.append(td);
      }
    });
    let lastChild = this.treeElement?.lastChild as HTMLElement;
    if (lastChild) {
      lastChild.style.transform = `translateY(${treeTop}px)`;
    } // @ts-ignore
    (rowTreeElement as unknown).data = rowData.data;
    rowTreeElement.style.gridTemplateColumns = this.gridTemplateColumns.slice(1).join(' ');
    rowTreeElement.style.position = 'absolute';
    rowTreeElement.style.top = '0px';
    rowTreeElement.style.left = '0px';
    rowTreeElement.style.cursor = 'pointer'; //@ts-ignore
    this.setHighLight(rowData.data.isSearch, rowTreeElement);
    this.addRowElementEvent(rowTreeElement, rowData);
    return rowTreeElement;
  }

  addRowElementEvent(rowTreeElement: HTMLDivElement, rowData: unknown): void {
    rowTreeElement.onmouseenter = (): void => {
      // @ts-ignore
      if ((rowTreeElement as unknown).data.isSelected) {
        return;
      }
      let indexOf = this.currentRecycleList.indexOf(rowTreeElement);
      this.currentTreeDivList.forEach((row) => {
        row.classList.remove('mouse-in');
      });
      if (indexOf >= 0 && indexOf < this.currentTreeDivList.length) {
        this.setMouseIn(true, [this.currentTreeDivList[indexOf]]);
      }
    };
    rowTreeElement.onmouseleave = (): void => {
      // @ts-ignore
      if ((rowTreeElement as unknown).data.isSelected) {
        return;
      }
      let indexOf = this.currentRecycleList.indexOf(rowTreeElement);
      if (indexOf >= 0 && indexOf < this.treeElement!.children.length) {
        this.setMouseIn(false, [this.treeElement?.children[indexOf] as HTMLElement]);
      }
    };
    rowTreeElement.onmouseup = (e: MouseEvent): void => {
      let indexOf = this.currentRecycleList.indexOf(rowTreeElement);
      this.dispatchRowClickEvent(rowData, [this.treeElement?.children[indexOf] as HTMLElement, rowTreeElement], e);
      e.stopPropagation();
    };
  }

  firstElementTdHandler(tr: HTMLDivElement, dataIndex: string, row: unknown, column: unknown): HTMLElement {
    let td: unknown; // @ts-ignore
    let text = formatName(dataIndex, row.data[dataIndex], this); // @ts-ignore
    if (column.template) {
      // @ts-ignore
      td = column.template.render(row.data).content.cloneNode(true); // @ts-ignore
      td.template = column.template; // @ts-ignore
      td.title = row.data[dataIndex];
    } else {
      td = document.createElement('div'); // @ts-ignore
      if (row.data.rowName === 'js-memory' || row.data.rowName === 'cpu-profiler') {
        // @ts-ignore
        td.innerHTML = '';
      } else {
        // @ts-ignore
        td.innerHTML = text;
      } // @ts-ignore
      td.dataIndex = dataIndex; //@ts-ignore
      if (text.indexOf('&lt;') === -1) {
        // @ts-ignore
        td.title = text;
      }
    } // @ts-ignore
    if (row.data.children && row.data.children.length > 0 && !row.data.hasNext) {
      let btn = this.createExpandBtn(row); // @ts-ignore
      td.insertBefore(btn, td.firstChild);
    } // @ts-ignore
    if (row.data.hasNext) {
      // @ts-ignore
      td.title = row.data.objectName;
      let btn = this.createBtn(row); // @ts-ignore
      td.insertBefore(btn, td.firstChild);
    } // @ts-ignore
    td.style.paddingLeft = row.depth * iconWidth + 'px'; // @ts-ignore
    if (!row.data.children || row.data.children.length === 0) {
      // @ts-ignore
      td.style.paddingLeft = iconWidth * row.depth + iconWidth + iconPadding * 2 + 'px';
    }
    this.jsMemoryHandler(row, td); // @ts-ignore
    if (row.data.rowName === 'cpu-profiler') {
      this.createTextColor(row, td);
    } // @ts-ignore
    (td as unknown).data = row.data; // @ts-ignore
    td.classList.add('tree-first-body'); // @ts-ignore
    td.style.position = 'absolute'; // @ts-ignore
    td.style.top = '0px'; // @ts-ignore
    td.style.left = '0px'; // @ts-ignore
    td.style.height = `${row.height}px`; // @ts-ignore
    this.addFirstElementEvent(td, tr, row); // @ts-ignore
    this.setHighLight(row.data.isSearch, td); // @ts-ignore
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
        this.setMouseIn(true, [tr]);
      }
    };
    td.onmouseleave = (): void => {
      let indexOf = this.currentTreeDivList.indexOf(td);
      if (indexOf >= 0 && indexOf < this.currentRecycleList.length) {
        this.setMouseIn(false, [tr]);
      }
    };
    td.onmouseup = (e: MouseEvent): void => {
      let indexOf = this.currentTreeDivList.indexOf(td);
      this.dispatchRowClickEvent(rowData, [td, tr], e);
      e.stopPropagation();
    };
  }

  otherElementHandler(dataIndex: string, rowData: unknown, column: unknown): HTMLDivElement {
    // @ts-ignore
    let tdDiv: unknown = document.createElement('div'); // @ts-ignore
    tdDiv.classList.add('td'); // @ts-ignore
    tdDiv.style.overflow = 'hidden'; // @ts-ignore
    tdDiv.style.textOverflow = 'ellipsis'; // @ts-ignore
    tdDiv.style.whiteSpace = 'nowrap'; // @ts-ignore
    let text = formatName(dataIndex, rowData.data[dataIndex], this); //@ts-ignore
    if (text.indexOf('&lt;') === -1) {
      // @ts-ignore
      if (dataIndex === 'selfTimeStr' && rowData.data.chartFrameChildren) {
        // @ts-ignore
        tdDiv.title = rowData.data.selfTime + 'ns'; // @ts-ignore
      } else if (dataIndex === 'totalTimeStr' && rowData.data.chartFrameChildren) {
        // @ts-ignore
        tdDiv.title = rowData.data.totalTime + 'ns';
      } else {
        // @ts-ignore
        tdDiv.title = text;
      }
    } // @ts-ignore
    tdDiv.dataIndex = dataIndex; // @ts-ignore
    tdDiv.style.justifyContent = column.getAttribute('align') || 'flex-start'; // @ts-ignore
    if (column.template) {
      // @ts-ignore
      tdDiv.appendChild(column.template.render(rowData.data).content.cloneNode(true)); // @ts-ignore
      tdDiv.template = column.template;
    } else {
      // @ts-ignore
      tdDiv.innerHTML = text;
    } // @ts-ignore
    return tdDiv;
  }

  createNewTableElement(rowData: unknown): HTMLDivElement {
    let newTableElement = document.createElement('div');
    newTableElement.classList.add('tr');
    this?.columns?.forEach((column: unknown) => {
      // @ts-ignore
      let dataIndex = column.getAttribute('data-index') || '1';
      let td = this.createColumnTd(dataIndex, column, rowData);
      //@ts-ignore
      this.dispatchTdClickEvent(td, column, rowData);
      newTableElement.append(td);
    });
    newTableElement.onmouseup = (e: MouseEvent): void => {
      this.dispatchRowClickEvent(rowData, [newTableElement], e);
      e.stopPropagation();
    };
    newTableElement.onmouseenter = (): void => {
      this.dispatchRowHoverEvent(rowData, [newTableElement]);
    }; // @ts-ignore
    if (rowData.data.isSelected !== undefined) {
      // @ts-ignore
      this.setSelectedRow(rowData.data.isSelected, [newTableElement]);
    } // @ts-ignore
    (newTableElement as unknown).data = rowData.data;
    newTableElement.style.cursor = 'pointer';
    newTableElement.style.gridTemplateColumns = this.gridTemplateColumns.join(' ');
    newTableElement.style.position = 'absolute';
    newTableElement.style.top = '0px';
    newTableElement.style.left = '0px';
    if (this.getItemTextColor) {
      // @ts-ignore
      newTableElement.style.color = this.getItemTextColor(rowData.data);
    }
    return newTableElement;
  }

  createColumnTd(dataIndex: string, column: unknown, rowData: unknown): HTMLDivElement {
    let td: unknown;
    td = document.createElement('div'); // @ts-ignore
    td.classList.add('td'); // @ts-ignore
    td.style.overflow = 'hidden'; // @ts-ignore
    td.style.textOverflow = 'ellipsis'; // @ts-ignore
    td.style.whiteSpace = 'nowrap'; // @ts-ignore
    td.dataIndex = dataIndex; // @ts-ignore
    td.style.justifyContent = column.getAttribute('align') || 'flex-start'; // @ts-ignore
    let text = formatName(dataIndex, rowData.data[dataIndex], this); //@ts-ignore
    if (text.indexOf('&lt;') === -1) {
      // @ts-ignore
      if (dataIndex === 'totalTimeStr' && rowData.data.chartFrameChildren) {
        // @ts-ignore
        td.title = rowData.data.totalTime + 'ns';
      } else {
        // @ts-ignore
        td.title = text;
      }
    }
    //   如果表格中有模板的情况，将模板中的数据放进td中，没有模板，直接将文本放进td
    //  但是对于Current Selection tab页来说，表格前两列是时间，第三列是input标签，第四列是button标签
    //  而第一行的数据只有第四列一个button，和模板中的数据并不一样，所以要特别处理一下
    // @ts-ignore
    if (column.template) {
      if (
        // @ts-ignore
        (dataIndex === 'color' && rowData.data.color === undefined) || // @ts-ignore
        (dataIndex === 'text' && rowData.data.text === undefined)
      ) {
        // @ts-ignore
        td.innerHTML = ''; // @ts-ignore
        td.template = ''; // @ts-ignore
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
        removeAll.style.outline = 'inherit'; // @ts-ignore
        td.appendChild(removeAll);
      } else {
        // @ts-ignore
        td.appendChild(column.template.render(rowData.data).content.cloneNode(true)); // @ts-ignore
        td.template = column.template;
      }
    } else {
      // @ts-ignore
      td.innerHTML = text;
    } // @ts-ignore
    return td;
  }

  createBtn(rowData: unknown): unknown {
    let btn: unknown = document.createElement('lit-icon'); // @ts-ignore
    btn.classList.add('tree-icon'); // @ts-ignore
    if (rowData.data.expanded) {
      // @ts-ignore
      btn.name = 'plus-square';
    } else {
      // @ts-ignore
      btn.name = 'minus-square';
    } // @ts-ignore
    btn.addEventListener('mouseup', (e: MouseEvent): void => {
      if (e.button === 0) {
        // @ts-ignore
        rowData.data.status = false;
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
        if (rowData.data.expanded) {
          // @ts-ignore
          rowData.data.status = true;
          this.dispatchRowClickEventIcon(rowData, [btn]); // @ts-ignore
          rowData.data.expanded = false;
          resetNodeHidden(true, rowData);
        } else {
          // @ts-ignore
          rowData.data.expanded = true; // @ts-ignore
          rowData.data.status = false;
          resetNodeHidden(false, rowData);
        }
        this.reMeauseHeight();
      }
      e.stopPropagation();
    });
    return btn;
  }

  resetExpandNodeHidden = (hidden: boolean, rowData: unknown): void => {
    // @ts-ignore
    if (rowData.children.length > 0) {
      if (hidden) {
        // @ts-ignore
        rowData.children.forEach((child: unknown) => {
          // @ts-ignore
          child.rowHidden = true;
          this.resetExpandNodeHidden(hidden, child);
        });
      } else {
        // @ts-ignore
        rowData.children.forEach((child: unknown) => {
          // @ts-ignore
          child.rowHidden = !rowData.expanded; // @ts-ignore
          if (rowData.expanded) {
            this.resetExpandNodeHidden(hidden, child);
          }
        });
      }
    }
  };

  setChildrenStatus(rowData: unknown, data: unknown): void {
    // @ts-ignore
    for (let d of data) {
      // @ts-ignore
      if (rowData.data === d) {
        d.status = false;
      }
      if (d.children !== undefined && d.children.length > 0) {
        this.setChildrenStatus(rowData, d.children);
      }
    }
  }
  createExpandBtn(rowData: unknown): LitIcon {
    // @ts-ignore
    let btn: unknown = document.createElement('lit-icon'); // @ts-ignore
    btn.classList.add('tree-icon');
    // @ts-ignore
    if (rowData.expanded) {
      // @ts-ignore
      btn.name = 'minus-square';
    } else {
      // @ts-ignore
      btn.name = 'plus-square';
    } // @ts-ignore
    btn.onmouseup = (e: MouseEvent): void => {
      if (e.button === 0) {
        // @ts-ignore
        if (rowData.expanded && this._mode === TableMode.Retract) {
          // @ts-ignore
          rowData.data.status = false; // @ts-ignore
          rowData.expanded = false;
          this.resetExpandNodeHidden(true, rowData); // @ts-ignore
        } else if (!rowData.expanded && this._mode === TableMode.Retract) {
          // @ts-ignore
          rowData.expanded = true; // @ts-ignore
          rowData.data.status = true;
          this.recycleDs = this.meauseTreeRowElement(this.value, RedrawTreeForm.Retract);
          this.resetExpandNodeHidden(false, rowData);
        } // @ts-ignore
        if (this._mode === TableMode.Expand && rowData.expanded) {
          // 点击收起的时候将点击的那条数据的status改为false
          this.setChildrenStatus(rowData, this.value); // @ts-ignore
          rowData.expanded = false;
          this.resetExpandNodeHidden(true, rowData); // @ts-ignore
        } else if (this._mode === TableMode.Expand && !rowData.expanded) {
          // @ts-ignore
          if (rowData.data.children) {
            // @ts-ignore
            rowData.data.status = true;
          }
          this.recycleDs = this.meauseTreeRowElement(this.value, RedrawTreeForm.Default); // @ts-ignore
          rowData.expanded = true;
          this.resetExpandNodeHidden(false, rowData);
        }
        this.reMeauseHeight();
      }
      e.stopPropagation();
    }; // @ts-ignore
    return btn;
  }

  reMeauseHeight(): void {
    if (this.currentRecycleList.length === 0 && this.ds.length !== 0) {
      this.recycleDataSource = this.ds;
      return;
    }
    let totalHeight = 0;
    this.recycleDs.forEach((it) => {
      // @ts-ignore
      if (!it.rowHidden) {
        // @ts-ignore
        it.top = totalHeight; // @ts-ignore
        totalHeight += it.height;
      }
    });
    this.tbodyElement && (this.tbodyElement.style.height = totalHeight + (this.isScrollXOutSide ? 0 : 0) + 'px');
    this.treeElement &&
      (this.treeElement.style.height = this.tableElement!.clientHeight - this.theadElement!.clientHeight + 'px');
    let visibleObjects = this.recycleDs.filter((item) => {
      // @ts-ignore
      return !item.rowHidden;
    });
    if (this.tableElement) {
      let top = this.tableElement!.scrollTop;
      let skip = 0;
      for (let i = 0; i < visibleObjects.length; i++) {
        // @ts-ignore
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
        let isTree = this.hasAttribute('tree'); // @ts-ignore
        let newTableElement = this.addTableElement(visibleObjects[skip], isTree, isTree, false);
        reduce += newTableElement.clientHeight;
      }
      for (let i = 0; i < this.currentRecycleList.length; i++) {
        if (this.hasAttribute('tree')) {
          this.freshCurrentLine(
            this.currentRecycleList[i], // @ts-ignore
            visibleObjects[i + skip],
            this.treeElement?.children[i] as HTMLElement
          );
        } else {
          // @ts-ignore
          this.freshLineHandler(i, skip, visibleObjects);
        }
      }
    }
  }

  getWheelStatus(element: unknown): void {
    // @ts-ignore
    element.addEventListener('wheel', (event: WheelEvent) => {
      // @ts-ignore
      if (element.scrollWidth !== element.offsetWidth) {
        event.preventDefault();
      } // @ts-ignore
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
    this.ds.forEach((rowData: unknown) => {
      let tblRowElement = document.createElement('div');
      tblRowElement.classList.add('tr');
      // @ts-ignore
      tblRowElement.data = rowData;
      let gridTemplateColumns: Array<unknown> = [];
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
      checkbox.onchange = (e: unknown): void => {
        // Checkbox checking affects whether the div corresponding to the row has a checked attribute for marking
        // @ts-ignore
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

  renderTableRowColumnElement(
    tblColumn: LitTableColumn,
    tblRowElement: HTMLDivElement,
    dataIndex: string,
    rowData: unknown
  ): void {
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
      tblDiv.style.whiteSpace = 'pre-wrap'; // @ts-ignore
      tblDiv.title = rowData[dataIndex];
      tblDiv.style.justifyContent = tblColumn.getAttribute('align') || '';
      if (tblColumn.hasAttribute('fixed')) {
        fixed(tblDiv, tblColumn.getAttribute('fixed') || '', '#ffffff');
      }
      this.getWheelStatus(tblDiv); // @ts-ignore
      tblDiv.innerHTML = formatName(dataIndex, rowData[dataIndex], this);
      tblRowElement.append(tblDiv);
    }
  }

  renderTableRowElementEvent(tblRowElement: HTMLDivElement, rowData: unknown): void {
    tblRowElement.onmouseup = (e: MouseEvent): void => {
      e.stopPropagation();
      this.dispatchEvent(
        new CustomEvent('row-click', {
          detail: {
            rowData,
            data: rowData,
            callBack: (isSelected: boolean): void => {
              //是否爲单选
              if (isSelected) {
                this.clearAllSelection(rowData);
              } // @ts-ignore
              this.setSelectedRow(rowData.isSelected, [tblRowElement]);
            },
          },
          composed: true,
        })
      );
      e.stopPropagation();
    };
  }

  //自定义td点击事件
  dispatchTdClickEvent(td: unknown, column: unknown, rowData: unknown): void {
    // @ts-ignore
    if (column.hasAttribute('tdJump')) {
      //@ts-ignore
      td.style.color = '#208aed';
      //@ts-ignore
      td.style.textDecoration = 'underline';
      //@ts-ignore
      td.onclick = (event: unknown): void => {
        this.dispatchEvent(
          new CustomEvent('td-click', {
            detail: {
              //@ts-ignore
              ...rowData.data,
            },
            composed: true,
          })
        );
        // @ts-ignore
        event.stopPropagation();
      };
    }
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
      if (idx < this.columns!.length) {
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
          if (rowObject.data.rowName === 'cpu-profiler' && dataIndex === 'symbolName') {
            (child as HTMLElement).innerHTML = '';
          } else {
            //@ts-ignore
            (child as HTMLElement).innerHTML = text;
          } //@ts-ignore
          if (dataIndex === 'selfTimeStr' && rowObject.data.chartFrameChildren) {
            //@ts-ignore
            (child as HTMLElement).title = rowObject.data.selfTime + 'ns'; //@ts-ignore
          } else if (dataIndex === 'totalTimeStr' && rowObject.data.chartFrameChildren) {
            //@ts-ignore
            (child as HTMLElement).title = rowObject.data.totalTime + 'ns';
          } else if (dataIndex === 'timeStr' && rowObject.data instanceof JsCpuProfilerStatisticsStruct) {
            (child as HTMLElement).title = rowObject.data.time + 'ns';
          } else {
            //@ts-ignore
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
    element.onmouseup = (e: MouseEvent): void => {
      if (firstElement !== undefined) {
        this.dispatchRowClickEvent(rowObject, [firstElement, element], e);
      } else {
        this.dispatchRowClickEvent(rowObject, [element], e);
      }
      e.stopPropagation();
    };
    element.onmouseenter = (): void => {
      this.dispatchRowHoverEvent(rowObject, [element]); // @ts-ignore
      if ((element as unknown).data.isSelected) {
        return;
      }
      let indexOf = this.currentRecycleList.indexOf(element as HTMLDivElement);
      this.currentTreeDivList.forEach((row) => {
        row.classList.remove('mouse-in');
      });
      if (indexOf >= 0 && indexOf < this.currentTreeDivList.length) {
        this.setMouseIn(true, [this.currentTreeDivList[indexOf]]);
      }
    };
    this.querySelectorAll('lit-table-column').forEach((item, i) => {
      if (this.hasAttribute('tree')) {
        this.dispatchTdClickEvent(element.childNodes[i - 1], item, rowObject);
      } else {
        this.dispatchTdClickEvent(element.childNodes[i], item, rowObject);
      }
    });
    // @ts-ignore
    (element as unknown).data = rowObject.data; //@ts-ignore
    if (rowObject.data.isSelected !== undefined) {
      //@ts-ignore
      this.setSelectedRow(rowObject.data.isSelected, [element]);
    } else {
      this.setSelectedRow(false, [element]);
    } //@ts-ignore
    if (rowObject.data.isHover !== undefined) {
      //@ts-ignore
      this.setMouseIn(rowObject.data.isHover, [element]);
    } else {
      this.setMouseIn(false, [element]);
    }
    if (this.getItemTextColor) {
      // @ts-ignore
      element.style.color = this.getItemTextColor((element as unknown).data);
    }
  }

  freshLineFirstElementHandler(firstElement: unknown, rowObject: TableRowObject, childIndex: number): void {
    if (firstElement !== undefined && childIndex === 0) {
      //@ts-ignore
      this.setHighLight(rowObject.data.isSearch, firstElement); // @ts-ignore
      (firstElement as unknown).data = rowObject.data; // @ts-ignore
      if ((this.columns![0] as unknown).template) {
        // @ts-ignore
        firstElement.innerHTML = (this.columns![0] as unknown).template
          .render(rowObject.data)
          .content.cloneNode(true).innerHTML;
      } else {
        let dataIndex = this.columns![0].getAttribute('data-index') || '1'; //@ts-ignore
        let text = formatName(dataIndex, rowObject.data[dataIndex], this); //@ts-ignore
        if (rowObject.data.rowName === 'js-memory' || rowObject.data.rowName === 'cpu-profiler') {
          // @ts-ignore
          firstElement.innerHTML = '';
        } else {
          // @ts-ignore
          firstElement.innerHTML = text;
        } // @ts-ignore
        firstElement.title = text;
      } //@ts-ignore
      if (rowObject.children && rowObject.children.length > 0 && !rowObject.data.hasNext) {
        let btn = this.createExpandBtn(rowObject); // @ts-ignore
        firstElement.insertBefore(btn, firstElement.firstChild);
      } // @ts-ignore
      firstElement.style.paddingLeft = iconWidth * rowObject.depth + 'px';
      if (!rowObject.children || rowObject.children.length === 0) {
        // @ts-ignore
        firstElement.style.paddingLeft = iconWidth * rowObject.depth + iconWidth + iconPadding * 2 + 'px';
      } //@ts-ignore
      if (rowObject.data.hasNext) {
        let btn = this.createBtn(rowObject); // @ts-ignore
        firstElement.title = rowObject.data.objectName; // @ts-ignore
        firstElement.insertBefore(btn, firstElement.firstChild); // @ts-ignore
        firstElement.style.paddingLeft = iconWidth * rowObject.depth + 'px';
      }
      this.jsMemoryHandler(rowObject, firstElement); //@ts-ignore
      if (rowObject.data.rowName === 'cpu-profiler') {
        this.createTextColor(rowObject, firstElement);
      } // @ts-ignore
      firstElement.onmouseup = (e: MouseEvent): void => {
        this.dispatchRowClickEvent(rowObject, [firstElement, element], e);
        e.stopPropagation();
      }; // @ts-ignore
      firstElement.style.transform = `translateY(${rowObject.top - this.tableElement!.scrollTop}px)`; //@ts-ignore
      if (rowObject.data.isSelected !== undefined) {
        //@ts-ignore
        this.setSelectedRow(rowObject.data.isSelected, [firstElement]);
      } else {
        this.setSelectedRow(false, [firstElement]);
      }
    }
  }

  setSelectedRow(isSelected: boolean, rows: unknown[]): void {
    if (isSelected) {
      rows.forEach((row) => {
        // @ts-ignore
        if (row.classList) {
          // @ts-ignore
          if (row.classList.contains('mouse-in')) {
            // @ts-ignore
            row.classList.remove('mouse-in');
          } // @ts-ignore
          row.classList.add('mouse-select');
        }
      });
    } else {
      rows.forEach((row) => {
        // @ts-ignore
        row.classList && row.classList.remove('mouse-select');
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
    if (this.isRecycleList) {
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
    } else {
      if (this.normalDs.length > 0) {
        let filter = this.normalDs.filter((item) => {
          // @ts-ignore
          return item.data === data;
        });
        if (filter.length > 0) {
          // @ts-ignore
          this.tableElement!.scrollTop = filter[0].top;
        }
      }
    }
  }

  expandList(datasource: unknown[]): void {
    let filter = this.recycleDs.filter((item) => {
      // @ts-ignore
      return datasource.indexOf(item.data) !== -1;
    });
    if (filter.length > 0) {
      filter.forEach((item) => {
        // @ts-ignore
        item.expanded = true; // @ts-ignore
        item.rowHidden = false;
      });
    }
    this.reMeauseHeight();
  }

  clearAllSelection(rowObjectData: unknown): void {
    if (this.isRecycleList) {
      this.recycleDs.forEach((item) => {
        // @ts-ignore
        if (item.data !== rowObjectData && item.data.isSelected) {
          // @ts-ignore
          item.data.isSelected = false;
        }
      });
      this.setSelectedRow(false, this.currentTreeDivList);
      this.setSelectedRow(false, this.currentRecycleList);
    } else {
      this.dataSource.forEach((item) => {
        // @ts-ignore
        if (item !== rowObjectData && item.isSelected) {
          // @ts-ignore
          item.isSelected = false;
        }
      });
      this.setSelectedRow(false, this.normalDs);
    }
  }

  clearAllHover(rowObjectData: unknown): void {
    if (this.isRecycleList) {
      this.recycleDs.forEach((item) => {
        // @ts-ignore
        if (item.data !== rowObjectData && item.data.isHover) {
          // @ts-ignore
          item.data.isHover = false;
        }
      });
      this.setMouseIn(false, this.currentTreeDivList);
      this.setMouseIn(false, this.currentRecycleList);
    } else {
      this.dataSource.forEach((item) => {
        // @ts-ignore
        if (item !== rowObjectData && item.isHover) {
          // @ts-ignore
          item.isHover = false;
        }
      });
      this.setMouseIn(false, this.normalDs);
    }
  }

  mouseOut(): void {
    if (this.isRecycleList) {
      // @ts-ignore
      this.recycleDs.forEach((item) => (item.data.isHover = false));
      this.setMouseIn(false, this.currentTreeDivList);
      this.setMouseIn(false, this.currentRecycleList);
    } else {
      // @ts-ignore
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

  setCurrentSelection(selectionData: unknown): void {
    if (this.isRecycleList) {
      // @ts-ignore
      if (selectionData.isSelected !== undefined) {
        this.currentTreeDivList.forEach((itemEl) => {
          // @ts-ignore
          if ((itemEl as unknown).data === selectionData) {
            // @ts-ignore
            this.setSelectedRow(selectionData.isSelected, [itemEl]);
          }
        });
        this.currentRecycleList.forEach((recycleItem) => {
          // @ts-ignore
          if ((recycleItem as unknown).data === selectionData) {
            // @ts-ignore
            this.setSelectedRow(selectionData.isSelected, [recycleItem]);
          }
        });
      }
    } else {
      // @ts-ignore
      if (selectionData.isSelected !== undefined) {
        this.normalDs.forEach((item) => {
          // @ts-ignore
          if ((item as unknown).data === selectionData) {
            // @ts-ignore
            this.setSelectedRow(selectionData.isSelected, [item]);
          }
        });
      }
    }
  }

  setCurrentHover(data: unknown): void {
    if (this.isRecycleList) {
      this.setMouseIn(false, this.currentTreeDivList);
      this.setMouseIn(false, this.currentRecycleList); // @ts-ignore
      if (data.isHover !== undefined) {
        this.currentTreeDivList.forEach((hoverItem) => {
          // @ts-ignore
          if ((hoverItem as unknown).data === data) {
            // @ts-ignore
            this.setMouseIn(data.isHover, [hoverItem]);
          }
        });
        this.currentRecycleList.forEach((hoverItem) => {
          // @ts-ignore
          if ((hoverItem as unknown).data === data) {
            // @ts-ignore
            this.setMouseIn(data.isHover, [hoverItem]);
          }
        });
      }
    } else {
      this.setMouseIn(false, this.normalDs); // @ts-ignore
      if (data.isHover !== undefined) {
        this.normalDs.forEach((item): void => {
          // @ts-ignore
          if ((item as unknown).data === data) {
            // @ts-ignore
            this.setMouseIn(data.isHover, [item]);
          }
        });
      }
    }
  }

  dispatchRowClickEventIcon(rowData: unknown, elements: unknown[]): void {
    this.dispatchEvent(
      new CustomEvent('icon-click', {
        detail: {
          // @ts-ignore
          ...rowData.data,
          // @ts-ignore
          data: rowData.data,
          callBack: (isSelected: boolean): void => {
            //是否爲单选
            if (isSelected) {
              // @ts-ignore
              this.clearAllSelection(rowData.data);
            } // @ts-ignore
            this.setSelectedRow(rowData.data.isSelected, elements);
          },
        },
        composed: true,
      })
    );
  }

  dispatchRowClickEvent(rowObject: unknown, elements: unknown[], event: MouseEvent): void {
    this.dispatchEvent(
      new CustomEvent('row-click', {
        detail: {
          button: event.button, // @ts-ignore
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
    event.stopPropagation();
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

  createTextColor(rowData: unknown, divElement: unknown): void {
    let nodeText = document.createElement('text');
    nodeText.classList.add('functionName'); // @ts-ignore
    nodeText.textContent = rowData.data.name; // @ts-ignore
    divElement.append(nodeText); // @ts-ignore
    if (rowData.data.scriptName !== 'unknown') {
      let scriptText = document.createElement('text');
      scriptText.classList.add('scriptName'); // @ts-ignore
      scriptText.textContent = rowData.data.scriptName; // @ts-ignore
      divElement.append(scriptText);
      scriptText.style.color = '#a1a1a1';
    } // @ts-ignore
    divElement.title = rowData.data.symbolName;
  }

  jsMemoryHandler(rowData: unknown, td: unknown): void {
    // @ts-ignore
    if (rowData.data.rowName === 'js-memory') {
      let nodeText = document.createElement('text');
      nodeText.classList.add('nodeName'); // @ts-ignore
      nodeText.textContent = rowData.data.nodeName; // @ts-ignore
      td.append(nodeText);
      let countText = document.createElement('text');
      countText.classList.add('countName'); // @ts-ignore
      countText.textContent = rowData.data.count; // @ts-ignore
      td.append(countText);
      let nodeIdText = document.createElement('text');
      nodeIdText.classList.add('nodeIdText'); // @ts-ignore
      nodeIdText.textContent = rowData.data.nodeId; // @ts-ignore
      td.append(nodeIdText); // @ts-ignore
      if (rowData.data.edgeName !== '') {
        let edgeNameText = document.createElement('text');
        edgeNameText.classList.add('edgeNameText'); // @ts-ignore
        edgeNameText.textContent = rowData.data.edgeName; // @ts-ignore
        td.insertBefore(edgeNameText, nodeText);
        let span = document.createElement('span');
        span.classList.add('span'); // @ts-ignore
        if (rowData.data.type === ConstructorType.RetainersType) {
          // @ts-ignore
          span.textContent = '\xa0' + 'in' + '\xa0'; // @ts-ignore
          nodeIdText.textContent = ` @${rowData.data.id}`;
        } else {
          span.textContent = '\xa0' + '::' + '\xa0';
        }
        edgeNameText.append(span);
      }
      if (
        // @ts-ignore
        (rowData.data.nodeType === NodeType.STRING || // @ts-ignore
          rowData.data.nodeType === NodeType.CONCATENATED_STRING || // @ts-ignore
          rowData.data.nodeType === NodeType.SLICED_STRING) && // @ts-ignore
        rowData.data.type !== ConstructorType.ClassType
      ) {
        nodeText.style.color = '#d53d3d'; // @ts-ignore
        nodeText.textContent = '"' + rowData.data.nodeName + '"';
      } // @ts-ignore
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
