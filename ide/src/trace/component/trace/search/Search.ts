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

import { BaseElement, element } from '../../../../base-ui/BaseElement';
import { LitIcon } from '../../../../base-ui/icon/LitIcon';
import { SearchHtml } from './Search.html';
import '../../../../base-ui/select/LitSelect';
import '../../../../base-ui/select/LitSelectOption';
import { LitSelect } from '../../../../base-ui/select/LitSelect';
import { Utils } from '../base/Utils';
import { SpSystemTrace } from '../../SpSystemTrace';

const LOCAL_STORAGE_SEARCH_KEY = 'search_key';
let timerId: unknown = null;
@element('lit-search')
export class LitSearch extends BaseElement {
  valueChangeHandler: ((str: string) => void) | undefined | null;
  private search: HTMLInputElement | undefined | null;
  private _total: number = 0;
  private _index: number = 0;
  private _list: Array<unknown> = [];
  private _value: boolean = false;
  private totalEL: HTMLSpanElement | null | undefined;
  private indexEL: HTMLSpanElement | null | undefined;
  private searchHistoryListEL: HTMLUListElement | null | undefined;
  private historyMaxCount = 100;
  private lastSearch = '';
  private searchList: Array<SearchInfo> = [];
  private searchELList: Array<HTMLElement> = [];
  //定义翻页index
  private retarget_index: number = 0;
  private _retarge_index: HTMLInputElement | null | undefined;
  private traceSelector: LitSelect | null | undefined;
  public currenSearchValue: string | undefined | null;

  get list(): Array<unknown> {
    return this._list;
  }

  set list(value: Array<unknown>) {
    this._list = value;
    this.total = value.length;
  }

  get index(): number {
    return this._index;
  }

  set index(value: number) {
    this._index = value;
    this.indexEL!.textContent = `${value + 1}`;
  }

  get searchValue(): string {
    return this.search?.value || '';
  }

  get total(): number {
    return this._total;
  }

  set total(value: number) {
    if (value > 0) {
      this.setAttribute('show-search-info', '');
    } else {
      this.removeAttribute('show-search-info');
    }
    this._total = value;
    this.totalEL!.textContent = value.toString();
  }

  get isLoading(): boolean {
    return this.hasAttribute('isLoading');
  }

  set isLoading(va) {
    if (va) {
      this.setAttribute('isLoading', '');
    } else {
      this.removeAttribute('isLoading');
      window.localStorage.setItem(LOCAL_STORAGE_SEARCH_KEY, '');
    }
  }

  set isClearValue(value: boolean) {
    this._value = value;
  }

  get isClearValue(): boolean {
    return this._value;
  }

  setPercent(name: string = '', value: number): void {
    let searchHide = this.shadowRoot!.querySelector<HTMLElement>('.root');
    let searchIcon = this.shadowRoot!.querySelector<HTMLElement>('#search-icon');
    if (this.hasAttribute('textRoll')) {
      this.removeAttribute('textRoll');
    }
    this.isLoading = false;
    if (value > 0 && value <= 100) {
      searchHide!.style.display = 'flex';
      searchHide!.style.backgroundColor = 'var(--dark-background5,#e3e3e3)';
      searchIcon?.setAttribute('name', 'cloud-sync');
      this.search!.setAttribute('placeholder', `${name}${value}%`);
      this.search!.setAttribute('readonly', '');
      this.search!.className = 'readonly';
      this.isLoading = true;
    } else if (value > 100) {
      searchHide!.style.display = 'flex';
      searchHide!.style.backgroundColor = 'var(--dark-background5,#fff)';
      searchIcon?.setAttribute('name', 'search');
      this.search?.setAttribute('placeholder', 'search');
      this.search?.removeAttribute('readonly');
      this.search!.className = 'write';
    } else if (value === -1) {
      searchHide!.style.display = 'flex';
      searchHide!.style.backgroundColor = 'var(--dark-background5,#e3e3e3)';
      searchIcon?.setAttribute('name', 'cloud-sync');
      this.search!.setAttribute('placeholder', `${name}`);
      this.search!.setAttribute('readonly', '');
      this.search!.className = 'readonly';
    } else if (value === -2) {
      searchHide!.style.display = 'flex';
      searchHide!.style.backgroundColor = 'var(--dark-background5,#e3e3e3)';
      searchIcon?.setAttribute('name', 'cloud-sync');
      this.search!.setAttribute('placeholder', `${name}`);
      this.search!.setAttribute('readonly', '');
      this.search!.className = 'text-Roll';
      setTimeout((): void => {
        this.setAttribute('textRoll', '');
      }, 200);
    } else {
      searchHide!.style.display = 'none';
    }
  }

  clear(): void {
    this.search = this.shadowRoot!.querySelector<HTMLInputElement>('input');
    this.search!.value = '';
    if (!Utils.isDistributedMode()) {
      this.removeAttribute('distributed');
    }
    this.list = [];
  }

  blur(): void {
    this.search?.blur();
  }

  updateSearchList(searchStr: string | null): void {
    if (searchStr === null || searchStr.length === 0 || searchStr.trim().length === 0) {
      return;
    }
    let searchInfo = this.searchList.find((searchInfo): boolean => searchInfo.searchContent === searchStr);
    if (searchInfo !== undefined) {
      let index = this.searchList.indexOf(searchInfo);
      this.searchList.splice(index, 1);
      this.searchList.unshift({ searchContent: searchStr, useCount: 1 });
    } else {
      this.searchList.unshift({ searchContent: searchStr, useCount: 1 });
    }
  }

  getSearchHistory(): Array<SearchInfo> {
    let searchString = window.localStorage.getItem(LOCAL_STORAGE_SEARCH_KEY);
    if (searchString) {
      let searHistory = JSON.parse(searchString);
      if (Array.isArray(searHistory)) {
        this.searchList = searHistory;
        return searHistory;
      }
    }
    return [];
  }

  private searchFocusListener(): void {
    if (!this.search?.hasAttribute('readonly')) {
      this.showSearchHistoryList();
    }
  }

  private searchBlurListener(): void {
    setTimeout((): void => {
      this.hideSearchHistoryList();
    }, 200);
  }

  private searchKeyupListener(e: KeyboardEvent): void {
    timerId = null;
    if (e.code === 'Enter' || e.code === 'NumpadEnter') {
      this.updateSearchList(this.search!.value);
      if (e.shiftKey) {
        this.dispatchEvent(
          new CustomEvent('previous-data', {
            detail: {
              value: this.search!.value,
            },
            composed: false,
          })
        );
      } else {
        this.dispatchEvent(
          new CustomEvent('next-data', {
            detail: {
              value: this.search!.value,
            },
            composed: false,
          })
        );
      }
    } else {
      this.updateSearchHistoryList(this.search!.value);
      this.valueChangeHandler?.(this.trimSideSpace(this.search!.value));
    }
    e.stopPropagation();
  }

  trimSideSpace(str: string): string {
    return str.replace(/(^\s*)|(\s*$)/g, '');
  }

  initElements(): void {
    this.initTraceSelectHandler();
    this.search = this.shadowRoot!.querySelector<HTMLInputElement>('input');
    this.totalEL = this.shadowRoot!.querySelector<HTMLSpanElement>('#total');
    this.indexEL = this.shadowRoot!.querySelector<HTMLSpanElement>('#index');
    this.searchHistoryListEL = this.shadowRoot!.querySelector<HTMLUListElement>('.search-history-list');
    this._retarge_index = this.shadowRoot!.querySelector<HTMLInputElement>("input[name='retarge_index']");
    this.search!.addEventListener('focus', (): void => {
      this.searchFocusListener();
    });
    this.search!.addEventListener('blur', (): void => {
      this.searchBlurListener();
    });
    this.search!.addEventListener('keyup', (e: KeyboardEvent) => {
      SpSystemTrace.isKeyUp = true;
      this._retarge_index!.value = '';
      this.searchKeyupListener(e);
    });
    //阻止事件冒泡
    this.search!.addEventListener('keydown', (e: KeyboardEvent) => {
      SpSystemTrace.isKeyUp = false;
      e.stopPropagation();
    });

    this.search!.addEventListener('keypress', (e: KeyboardEvent) => {
      SpSystemTrace.isKeyUp = false;
      e.stopPropagation();
    });
    this.shadowRoot?.querySelector('#arrow-left')?.addEventListener('click', (): void => {
      this.dispatchEvent(
        new CustomEvent('previous-data', {
          detail: {
            value: this.search!.value,
          },
        })
      );
    });
    this.shadowRoot?.querySelector('#arrow-right')?.addEventListener('click', (): void => {
      this.dispatchEvent(
        new CustomEvent('next-data', {
          detail: {
            value: this.search!.value,
          },
        })
      );
    });
    this.keyUpListener();
    //阻止事件冒泡
    this.shadowRoot?.querySelector("input[name='retarge_index']")?.addEventListener('keydown', (e: unknown) => {
      SpSystemTrace.isKeyUp = false;
      // @ts-ignore
      e.stopPropagation();
    });
    this.shadowRoot?.querySelector("input[name='retarge_index']")?.addEventListener('keypress', (e: unknown) => {
      SpSystemTrace.isKeyUp = false;
      // @ts-ignore
      e.stopPropagation();
    });
  }

  private initTraceSelectHandler(): void {
    this.traceSelector = this.shadowRoot!.querySelector<LitSelect>('#trace_selector');
    let selectorBody = this.traceSelector?.shadowRoot!.querySelector<HTMLDivElement>('.body');
    if (selectorBody) {
      selectorBody.style.width = '200px';
      selectorBody.style.overflow = 'hidden';
    }
    this.traceSelector?.addEventListener('change', (): void => {
      if (Utils.currentSelectTrace !== this.traceSelector!.value) {
        Utils.currentSelectTrace = this.traceSelector!.value;
        this.clear();
        this.dispatchEvent(new CustomEvent('trace-change', {
          detail: {
            value: this.traceSelector?.value,
          },
        }));
      }
    });
    this.traceSelector?.addEventListener('focus', (e): void => {
      e.stopPropagation();
    });
  }

  setTraceSelectOptions(): void {
    this.traceSelector!.dataSource = Utils.distributedTrace.map((trace, index) => ({
      value: `${index + 1}`,
      name: trace
    }));
  }

  getSearchTraceId(): string | null | undefined {
    if (this.hasAttribute('distributed')) {
      return this.traceSelector?.value;
    }
    return undefined;
  }

  private keyUpListener(): void {
    let _root = this.shadowRoot!.querySelector<HTMLInputElement>('.root');
    let _prompt = this.shadowRoot!.querySelector<HTMLInputElement>('#prompt');
    // 添加翻页监听事件
    this.shadowRoot?.querySelector("input[name='retarge_index']")?.addEventListener('keyup', (e: unknown): void => {
      // @ts-ignore
      if (e.keyCode === 13) {
        this.retarget_index = Number(this._retarge_index!.value);
        if (this.retarget_index <= this._list.length && this.retarget_index !== 0) {
          this.dispatchEvent(
            new CustomEvent('retarget-data', {
              detail: {
                value: this.retarget_index,
              },
            })
          );
        } else if (this.retarget_index === 0) {
          return;
        } else {
          _prompt!.style.display = 'block';
          _root!.style.display = 'none';
          _prompt!.innerHTML = `${this._list.length} pages in total, please re-enter`;
          setTimeout(() => {
            _prompt!.style.display = 'none';
            _root!.style.display = 'flex';
            this._retarge_index!.value = '';
          }, 2000);
        }
        // @ts-ignore
        e.target.blur();
      }
      // @ts-ignore
      e.stopPropagation();
    });
  }

  initHtml(): string {
    return SearchHtml;
  }

  showSearchHistoryList(): void {
    this.searchHistoryListEL!.innerHTML = '';
    let historyInfos = this.getSearchHistory();
    let fragment = document.createElement('div');
    historyInfos.forEach((historyInfo) => {
      let searchVessel = document.createElement('div');
      searchVessel.className = 'search-list';
      let searchInfoOption = document.createElement('li');
      let closeOption = document.createElement('lit-icon');
      closeOption.setAttribute('name', 'close');
      closeOption.className = 'close-option';
      closeOption.setAttribute('size', '20');
      searchInfoOption.className = 'search-history-list-item';
      searchInfoOption.textContent = historyInfo.searchContent;
      searchInfoOption.addEventListener('click', (): void => {
        if (searchInfoOption.textContent) {
          let flag = this.search!.value;
          this.search!.value = searchInfoOption.textContent;
          this.valueChangeHandler?.(this.search!.value);
          if (flag !== searchInfoOption.textContent) {
            this._retarge_index!.value = '';
            this.index = -1;
          }
        }
      });
      searchVessel.append(searchInfoOption);
      searchVessel.append(closeOption);
      this.searchELList.push(searchInfoOption);
      this.searchELList.push(closeOption);
      fragment.append(searchVessel);
    });
    this.searchHistoryListEL?.append(fragment);
    if (this.searchList.length > 0) {
      this.searchHistoryListEL!.style.display = 'block';
    }
    let closeOptionList = this.searchHistoryListEL!.querySelectorAll<LitIcon>('.close-option');
    closeOptionList.forEach((item): void => {
      item.addEventListener('click', (): void => {
        let currentHistory = item.previousSibling!.textContent;
        let index = this.searchList.findIndex((element): boolean => element.searchContent === currentHistory);
        if (index !== -1) {
          this.searchList.splice(index, 1);
        }
        let historyStr = JSON.stringify(this.searchList);
        window.localStorage.setItem(LOCAL_STORAGE_SEARCH_KEY, historyStr);
      });
    });
  }

  hideSearchHistoryList(): void {
    this.searchHistoryListEL!.style.display = 'none';
    if (this.searchList.length > this.historyMaxCount) {
      this.searchList = this.searchList.slice(0, this.historyMaxCount);
    }
    if (this.searchList.length === 0) {
      return;
    }
    let historyStr = JSON.stringify(this.searchList);
    window.localStorage.setItem(LOCAL_STORAGE_SEARCH_KEY, historyStr);
    this.searchList = [];
    this.searchELList = [];
  }

  updateSearchHistoryList(searchValue: string): void {
    const keyword = searchValue.toLowerCase();
    this.searchELList.forEach((item) => {
      if (item.textContent!.toLowerCase().includes(keyword)) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  }
}

export interface SearchInfo {
  searchContent: string;
  useCount: number;
}
