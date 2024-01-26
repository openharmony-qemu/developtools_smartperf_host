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

import { BaseElement, element } from '../../base-ui/BaseElement';
import { LitTable } from '../../base-ui/table/lit-table';
import '../../base-ui/table/lit-table';
import { LitTableColumn } from '../../base-ui/table/lit-table-column';
import { info } from '../../log/Log';
import { LitProgressBar } from '../../base-ui/progress-bar/LitProgressBar';
import { PageNation } from '../../base-ui/chart/pagenation/PageNation';
import { PaginationBox } from '../../base-ui/chart/pagenation/PaginationBox';
import { SpStatisticsHttpUtil } from '../../statistics/util/SpStatisticsHttpUtil';
import { getAllSql } from './trace/base/CommonSql';
import { LitIcon } from '../../base-ui/icon/LitIcon';
import {queryCustomizeSelect} from "../database/sql/SqlLite.sql";
import { SpQuerySQLHtml } from './SpQuerySQL.html';

@element('sp-query-sql')
export class SpQuerySQL extends BaseElement {
  private queryTableEl: LitTable | undefined;
  private notSupportList: Array<string> | undefined = [];
  private querySize: HTMLElement | undefined;
  private keyList: Array<string> | undefined;
  private selector: HTMLTextAreaElement | undefined;
  private isSupportSql: boolean = true;
  private response: HTMLDivElement | undefined;
  private statDataArray: unknown[] = [];
  private sliceData: unknown[] = [];
  private querySqlErrorText: string = '';
  private progressLoad: LitProgressBar | undefined;
  private pagination: PaginationBox | undefined;
  private sqlListDiv: HTMLDivElement | undefined;

  initElements(): void {
    this.progressLoad = this.shadowRoot?.querySelector('.load-query-sql') as LitProgressBar;
    this.selector = this.shadowRoot?.querySelector('.sql-select') as HTMLTextAreaElement;
    this.queryTableEl = this.shadowRoot?.querySelector('lit-table') as LitTable;
    this.queryTableEl.setAttribute('data-query-scene', '');
    this.querySize = this.shadowRoot?.querySelector('.query_size') as HTMLElement;
    this.response = this.shadowRoot?.querySelector('#dataResult') as HTMLDivElement;
    this.pagination = this.shadowRoot?.querySelector('.pagination-box') as PaginationBox;
    this.notSupportList?.push('insert', 'delete', 'update', 'drop', 'alter', 'truncate', 'create');
    this.sqlListDiv = this.shadowRoot?.querySelector('#sqlList') as HTMLDivElement;
    let htmlDivElement = this.queryTableEl.shadowRoot?.querySelector('.table') as HTMLDivElement;
    htmlDivElement.style.overflowX = 'scroll';
    window.addEventListener('resize', () => {
      this.freshTableHeadResizeStyle();
    });
    let copyButtonEl = this.shadowRoot?.querySelector('#copy-button') as HTMLButtonElement;
    copyButtonEl.addEventListener('click', () => {
      this.copyTableData();
    });
    let closeButtonEl = this.shadowRoot?.querySelector('#close-button') as HTMLButtonElement;
    closeButtonEl.addEventListener('click', () => {
      this.pagination!.style.display = 'none';
      this.querySize!.textContent = 'Query result - 0 counts.';
      this.queryTableEl!.dataSource = [];
      this.response!.innerHTML = '';
    });
    this.initCommonList();
  }

  private initCommonList(): void {
    let commonSqlList = getAllSql();
    if (commonSqlList.length > 0) {
      for (let i = 0; i < commonSqlList.length; i++) {
        let commonSqlDiv = document.createElement('div');
        commonSqlDiv.className = 'sql-item';
        let sql = document.createElement('div');
        sql.className = 'sql';
        sql.textContent = commonSqlList[i].sql;
        let runButton = document.createElement('lit-icon');
        runButton.className = 'runButton';
        runButton.title = commonSqlList[i].title;
        runButton.setAttribute('size', '20');
        runButton.setAttribute('name', 'run-sql');
        commonSqlDiv.appendChild(sql);
        commonSqlDiv.appendChild(runButton);
        this.sqlListDiv?.append(commonSqlDiv);
      }
    }
  }

  private freshTableHeadResizeStyle(): void {
    let th = this.queryTableEl!.shadowRoot?.querySelector<HTMLDivElement>('.th');
    if (th) {
      let td = th.querySelectorAll<HTMLDivElement>('.td');
      let firstChild = this.queryTableEl!.shadowRoot?.querySelector<HTMLDivElement>('.body')!.firstElementChild;
      if (firstChild) {
        let bodyList = firstChild.querySelectorAll<HTMLDivElement>('.td');
        for (let index = 0; index < bodyList.length; index++) {
          td[index].style.width = `${bodyList[index].offsetWidth}px`;
          td[index].style.overflow = 'hidden';
        }
      }
    }
    let tableHeadStyle: HTMLDivElement | undefined | null = this.queryTableEl?.shadowRoot?.querySelector(
      'div.th'
    ) as HTMLDivElement;
    if (tableHeadStyle && tableHeadStyle.hasChildNodes()) {
      for (let index = 0; index < tableHeadStyle.children.length; index++) {
        // @ts-ignore
        tableHeadStyle.children[index].style.gridArea = null;
      }
    }
    this.queryTableEl!.style.height = '100%';
  }

  private async copyTableData(): Promise<void> {
    let copyResult = '';
    for (let keyListKey of this.keyList!) {
      copyResult += `${keyListKey}\t`;
    }
    copyResult += '\n';
    let copyData: unknown[];
    if (this.statDataArray.length > maxPageSize) {
      copyData = this.sliceData;
    } else {
      copyData = this.statDataArray;
    }
    for (const value of copyData) {
      this.keyList?.forEach((key) => {
        // @ts-ignore
        copyResult += `${value[key]}\t`;
      });
      copyResult += '\n';
    }
    await navigator.clipboard.writeText(copyResult);
  }

  selectEventListener = (event: KeyboardEvent): void => {
    let enterKey = 13;
    if (event.ctrlKey && event.keyCode === enterKey) {
      SpStatisticsHttpUtil.addOrdinaryVisitAction({
        event: 'query',
        action: 'query',
      });
      this.statDataArray = [];
      this.keyList = [];
      this.response!.innerHTML = '';
      this.queryTableEl!.innerHTML = '';
      this.pagination!.style.display = 'none';
      if (this.isSupportSql) {
        this.executeSql(this.selector!.value);
      } else {
        this.querySize!.textContent = this.querySqlErrorText;
        this.queryTableEl!.dataSource = [];
        this.response!.innerHTML = '';
        return;
      }
    }
  };

  private executeSql(sql: string): void {
    this.progressLoad!.loading = true;
    if (this.querySize) {
      this.querySize!.title = `${sql}`;
    }
    queryCustomizeSelect(sql).then((resultList): void => {
      if (resultList && resultList.length > 0) {
        this.statDataArray = resultList;
        this.keyList = Object.keys(resultList[0]);
        this.querySize!.textContent = `Query result - ${this.statDataArray.length} counts.` + `(${sql})`;
        this.initDataElement();
        this.response!.appendChild(this.queryTableEl!);
        this.setPageNationTableEl();
        setTimeout(() => {
          if (this.parentElement?.clientHeight !== 0) {
            this.queryTableEl!.style.height = '100%';
            this.queryTableEl!.reMeauseHeight();
          }
        }, 300);
      } else {
        this.querySize!.textContent = `Query result - ${this.statDataArray.length} counts.` + `(${sql})`;
        this.progressLoad!.loading = false;
      }
    });
  }

  private setPageNationTableEl(): void {
    let that = this;
    let timeOutTs: number = 200;
    let indexNumber = 1;
    setTimeout(() => {
      let total = this.statDataArray.length;
      if (total > maxPageSize) {
        that.pagination!.style.display = 'block';
        that.pagination!.style.opacity = '1';
        new PageNation(this.pagination, {
          current: 1,
          total: total,
          pageSize: pageSize,
          change(num: number): void {
            that.sliceData = that.statDataArray!.slice((num - indexNumber) * pageSize, num * pageSize);
            that.queryTableEl!.recycleDataSource = that.sliceData;
          },
        });
      } else {
        that.pagination!.style.opacity = '0';
        this.queryTableEl!.recycleDataSource = this.statDataArray;
      }
      this.freshTableHeadResizeStyle();
      this.progressLoad!.loading = false;
    }, timeOutTs);
  }

  reset(): void {
    this.pagination!.style.opacity = '0';
    this.response!.innerHTML = '';
    this.keyList = [];
    this.statDataArray = [];
    this.selector!.value = '';
    this.querySize!.textContent = 'Please enter a query.';
    this.resizeSqlHeight().then();
  }

  private checkSafetySelectSql(): boolean {
    if (this.selector?.value.trim() === '') {
      this.querySqlErrorText = 'Please enter a query.';
      this.querySize!.textContent = this.querySqlErrorText;
      return false;
    } else {
      let queryNormalLength = 15;
      if (
        this.selector!.value.length < queryNormalLength ||
        !this.selector?.value.toLowerCase().trim().startsWith('select')
      ) {
        this.querySqlErrorText = `Query result - (Error):  
        ${this.selector!.value}.`;
        return false;
      }
      if (this.notSupportList && this.notSupportList.length > 0) {
        for (let index = 0; index < this.notSupportList.length; index++) {
          let regexStr = new RegExp(this.notSupportList[index], 'i');
          if (regexStr.test(this.selector!.value)) {
            this.querySqlErrorText = `Query result - (Error):  
            ${this.selector!.value}.`;
            return false;
          }
        }
      }
    }
    return true;
  }

  private initDataElement(): void {
    if (this.keyList) {
      info('Metric query Table Colum size is: ', this.keyList.length);
      this.keyList.forEach((item) => {
        let htmlElement = document.createElement('lit-table-column') as LitTableColumn;
        htmlElement.setAttribute('title', item);
        htmlElement.setAttribute('data-index', item);
        htmlElement.setAttribute('key', item);
        htmlElement.setAttribute('align', 'flex-start');
        htmlElement.setAttribute('height', '32px');
        this.queryTableEl!.appendChild(htmlElement);
      });
    }
  }

  connectedCallback(): void {
    // Listen to the sql execution of the query
    this.addEventListener('keydown', this.selectEventListener);
    this.selector!.addEventListener('input', this.inputSqlListener);
    this.selector!.addEventListener('change', this.inputSqlListener);
    this.selector!.addEventListener('keydown', this.deleteSqlListener);
    this.shadowRoot
      ?.querySelectorAll<LitIcon>('.runButton')
      .forEach((it) => it.addEventListener('click', this.runSqlListener));
  }

  runSqlListener = (e: Event): void => {
    this.scrollTo(0, 0);
    this.statDataArray = [];
    this.keyList = [];
    this.response!.innerHTML = '';
    this.queryTableEl!.innerHTML = '';
    this.pagination!.style.display = 'none';
    let previousSibling = (e.target as HTMLDivElement).previousElementSibling;
    if (previousSibling && previousSibling instanceof HTMLDivElement) {
      const content = previousSibling.textContent;
      this.executeSql(content!);
    }
  };

  private deleteSqlListener = (event: KeyboardEvent): void => {
    if (event.key === 'Backspace') {
      this.resizeSqlHeight().then();
      this.isSupportSql = this.checkSafetySelectSql();
    }
  };

  private async resizeSqlHeight(): Promise<void> {
    let minRowNumber = 10;
    let indexNumber = 1;
    let multipleNumber = 1.2;
    let paddingNumber = 2;
    let valueLength = this.selector?.value.split('\n').length;
    let rowNumber = Number(valueLength) - indexNumber;
    let selectHeight = '3.2em';
    if (rowNumber > 0) {
      if (rowNumber <= minRowNumber) {
        let allLength = multipleNumber * rowNumber + paddingNumber;
        selectHeight = `${allLength}em`;
      } else {
        selectHeight = '14em';
      }
    }
    // @ts-ignore
    this.selector?.style.height = selectHeight;
  }

  private inputSqlListener = async (): Promise<void> => {
    this.resizeSqlHeight().then();
    this.isSupportSql = this.checkSafetySelectSql();
  };

  disconnectedCallback(): void {
    this.removeEventListener('keydown', this.selectEventListener);
    this.selector!.removeEventListener('input', this.inputSqlListener);
    this.selector!.removeEventListener('change', this.inputSqlListener);
    this.selector!.removeEventListener('keydown', this.deleteSqlListener);
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    let queryDataSty: HTMLDivElement | undefined | null = this.queryTableEl?.shadowRoot?.querySelector(
      'div.tbody'
    ) as HTMLDivElement;
    if (queryDataSty && queryDataSty.hasChildNodes()) {
      for (let index = 0; index < queryDataSty.children.length; index++) {
        // @ts-ignore
        queryDataSty.children[index].style.backgroundColor = 'var(--dark-background5,#F6F6F6)';
      }
    }
  }

  initHtml(): string {
    return SpQuerySQLHtml;
  }
}

const pageSize: number = 200000;
const maxPageSize: number = 500000;
