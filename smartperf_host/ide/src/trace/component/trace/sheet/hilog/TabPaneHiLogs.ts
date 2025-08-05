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
import { TraceRow } from '../../base/TraceRow';
import { TraceSheet } from '../../base/TraceSheet';
import { Flag } from '../../timer-shaft/Flag';
import { SpSystemTrace } from '../../../SpSystemTrace';
import { ns2Timestamp, ns2x, Rect } from '../../../../database/ui-worker/ProcedureWorkerCommon';
import { LogStruct } from '../../../../database/ui-worker/ProcedureWorkerLog';
import { ColorUtils } from '../../base/ColorUtils';
import { LitPageTable } from '../../../../../base-ui/table/LitPageTable';
import { LitProgressBar } from '../../../../../base-ui/progress-bar/LitProgressBar';
import { queryLogAllData } from '../../../../database/sql/SqlLite.sql';
import { TabPaneHiLogsHtml } from './TabPaneHiLogs.html';

@element('tab-hi-log')
export class TabPaneHiLogs extends BaseElement {
  tableTimeHandle: (() => void) | undefined;
  tableTitleTimeHandle: (() => void) | undefined;
  private systemLogSource: LogStruct[] = [];
  private spSystemTrace: SpSystemTrace | undefined | null;
  private traceSheetEl: TraceSheet | undefined | null;
  private levelFilterInput: HTMLSelectElement | undefined | null;
  private tagFilterInput: HTMLInputElement | undefined | null;
  private searchFilterInput: HTMLInputElement | undefined | null;
  private processFilter: HTMLInputElement | undefined | null;
  private logTableTitle: HTMLDivElement | undefined | null;
  private tagFilterDiv: HTMLDivElement | undefined | null;
  private hiLogsTbl: LitPageTable | undefined | null;
  private filterData: LogStruct[] = [];
  private optionLevel: string[] = ['Debug', 'Info', 'Warn', 'Error', 'Fatal'];
  private allowTag: Set<string> = new Set();
  private ONE_DAY_NS = 86400000000000;
  private progressEL: LitProgressBar | null | undefined;
  private timeOutId: number | undefined;
  private currentSelection: SelectionParam | undefined;

  set data(systemLogParam: SelectionParam) {
    if (systemLogParam === this.currentSelection) {
      return;
    }
    this.currentSelection = systemLogParam;
    if (this.hiLogsTbl) {
      this.hiLogsTbl.recycleDataSource = [];
      this.filterData = [];
    }
    window.clearTimeout(this.timeOutId);
    // @ts-ignore
    let oneDayTime = (window as unknown).recordEndNS - this.ONE_DAY_NS;
    if (systemLogParam && systemLogParam.hiLogs.length > 0) {
      this.progressEL!.loading = true;
      queryLogAllData(oneDayTime, systemLogParam.leftNs, systemLogParam.rightNs).then((res) => {
        if (res.length === 0) {
          this.progressEL!.loading = false;
        }
        systemLogParam.sysAlllogsData = res;
        this.systemLogSource = res;
        this.refreshTable();
      });
    }
  }

  init(): void {
    this.levelFilterInput = this.shadowRoot?.querySelector<HTMLSelectElement>('#level-filter');
    this.logTableTitle = this.shadowRoot?.querySelector<HTMLDivElement>('#log-title');
    this.tagFilterInput = this.shadowRoot?.querySelector<HTMLInputElement>('#tag-filter');
    this.searchFilterInput = this.shadowRoot?.querySelector<HTMLInputElement>('#search-filter');
    this.processFilter = this.shadowRoot?.querySelector<HTMLInputElement>('#process-filter');
    this.spSystemTrace = document
      .querySelector('body > sp-application')
      ?.shadowRoot?.querySelector<SpSystemTrace>('#sp-system-trace');
    this.tableTimeHandle = this.delayedRefresh(this.refreshTable);
    this.tableTitleTimeHandle = this.delayedRefresh(this.refreshLogsTitle);
    this.tagFilterDiv = this.shadowRoot!.querySelector<HTMLDivElement>('#tagFilter');
    this.hiLogsTbl = this.shadowRoot!.querySelector<LitPageTable>('#tb-hilogs');
    this.progressEL = this.shadowRoot?.querySelector('.progress') as LitProgressBar;
    this.hiLogsTbl!.getItemTextColor = (data): string => {
      // @ts-ignore
      return ColorUtils.getHilogColor(data.level);
    };
    this.hiLogsTbl!.itemTextHandleMap.set('startTs', (startTs) => {
      // @ts-ignore
      return ns2Timestamp(startTs);
    });
    this.hiLogsTbl!.addEventListener('row-hover', (e): void => {
      // @ts-ignore
      let data = e.detail.data;
      if (data) {
        let pointX: number = ns2x(
          data.startTs || 0,
          TraceRow.range!.startNS,
          TraceRow.range!.endNS,
          TraceRow.range!.totalNS,
          new Rect(0, 0, TraceRow.FRAME_WIDTH, 0)
        );
        this.traceSheetEl!.systemLogFlag = new Flag(
          Math.floor(pointX),
          0,
          0,
          0,
          data.startTs!,
          '#999999',
          '',
          true,
          ''
        );
        this.spSystemTrace?.refreshCanvas(false);
      }
    });
    let tbl = this.hiLogsTbl?.shadowRoot?.querySelector<HTMLDivElement>('.table');
    tbl!.addEventListener('scroll', () => {
      this.tableTitleTimeHandle?.();
    });
  }

  initElements(): void {
    this.init();
    this.tagFilterDiv!.onclick = (ev): void => {
      // @ts-ignore
      let parentNode = ev.target.parentNode;
      if (parentNode && this.tagFilterDiv!.contains(parentNode)) {
        this.tagFilterDiv!.removeChild(parentNode);
        this.allowTag.delete(parentNode.textContent.trim().toLowerCase());
      }
      this.tableTimeHandle?.();
    };
    this.tagFilterInput!.addEventListener('keyup', (ev) => {
      if (ev.key.toLocaleLowerCase() === String.fromCharCode(47)) {
        ev.stopPropagation();
      }
    });
    this.searchFilterInput!.oninput = (): void => {
      this.tableTimeHandle?.();
    };
    this.searchFilterInput!.addEventListener('keyup', (ev) => {
      if (ev.key.toLocaleLowerCase() === String.fromCharCode(47)) {
        ev.stopPropagation();
      }
    });
    this.processFilter!.oninput = (): void => {
      this.tableTimeHandle?.();
    };
    this.processFilter!.addEventListener('keyup', (ev) => {
      if (ev.key.toLocaleLowerCase() === String.fromCharCode(47)) {
        ev.stopPropagation();
      }
    });
    this.levelFilterInput!.onchange = (): void => {
      this.tableTimeHandle?.();
    };
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.tagFilterInput?.addEventListener('keyup', this.tagFilterKeyEvent);
    new ResizeObserver((): void => {
      this.parentElement!.style.overflow = 'hidden';
      if (this.hiLogsTbl) {
        // @ts-ignore
        this.hiLogsTbl.shadowRoot.querySelector('.table').style.height =
          this.parentElement!.clientHeight - 20 - 45 + 'px';
      }
      if (this.filterData.length > 0) {
        this.refreshTable();
        this.tableTitleTimeHandle?.();
      }
    }).observe(this.parentElement!);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.tagFilterInput?.removeEventListener('keyup', this.tagFilterKeyEvent);
  }

  initHtml(): string {
    return TabPaneHiLogsHtml;
  }

  rerefreshLogsTab(): void {
    let tbl = this.hiLogsTbl?.shadowRoot?.querySelector<HTMLDivElement>('.table');
    let height = 0;
    if (tbl) {
      tbl.querySelectorAll<HTMLElement>('.tr').forEach((trEl: HTMLElement, index: number): void => {
        if (index === 0) {
          let frontTotalRowSize = Math.round((tbl!.scrollTop / trEl.clientHeight) * 100) / 100;
          if (frontTotalRowSize.toString().indexOf('.') >= 0) {
            let rowCount = frontTotalRowSize.toString().split('.');
            height += trEl.clientHeight - (Number(rowCount[1]) / 100) * trEl.clientHeight;
          }
        }
        let allTdEl = trEl.querySelectorAll<HTMLElement>('.td');
        allTdEl[0].style.color = '#3D88C7';
        allTdEl[0].style.textDecoration = 'underline';
        allTdEl[0].style.textDecorationColor = '#3D88C7';
        trEl.addEventListener('mouseout', (): void => {
          this.traceSheetEl!.systemLogFlag = undefined;
          this.spSystemTrace?.refreshCanvas(false);
        });
      });
    }
  }

  refreshLogsTitle(): void {
    let tbl = this.hiLogsTbl?.shadowRoot?.querySelector<HTMLDivElement>('.table');
    let height = 0;
    let firstRowHeight = 27;
    let tableHeadHeight = 26;
    this.rerefreshLogsTab();
    if (this.hiLogsTbl && this.hiLogsTbl.currentRecycleList.length > 0) {
      let startDataIndex = this.hiLogsTbl.startSkip + 1;
      let endDataIndex = startDataIndex;
      let crossTopHeight = tbl!.scrollTop % firstRowHeight;
      let topShowHeight = crossTopHeight === 0 ? 0 : firstRowHeight - crossTopHeight;
      if (topShowHeight < firstRowHeight * 0.3) {
        startDataIndex++;
      }
      let tableHeight = Number(tbl!.style.height.replace('px', '')) - tableHeadHeight;
      while (height < tableHeight) {
        if (firstRowHeight <= 0 || height + firstRowHeight > tableHeight) {
          break;
        }
        height += firstRowHeight;
        endDataIndex++;
      }
      if (tableHeight - height - topShowHeight > firstRowHeight * 0.3) {
        endDataIndex++;
      }
      if (endDataIndex >= this.filterData.length) {
        endDataIndex = this.filterData.length;
      } else {
        endDataIndex = this.hiLogsTbl.startSkip === 0 ? endDataIndex - 1 : endDataIndex;
      }
      this.logTableTitle!.textContent = `Hilogs [${this.hiLogsTbl.startSkip === 0 ? 1 : startDataIndex}, 
        ${endDataIndex}] / ${this.filterData.length || 0}`;
    } else {
      this.logTableTitle!.textContent = 'Hilogs [0, 0] / 0';
    }
    if (this.hiLogsTbl!.recycleDataSource.length > 0) {
      this.progressEL!.loading = false;
    }
  }

  initTabSheetEl(traceSheet: TraceSheet): void {
    this.traceSheetEl = traceSheet;
    this.levelFilterInput!.selectedIndex = 0;
    this.tagFilterInput!.value = '';
    this.tagFilterDiv!.innerHTML = '';
    this.allowTag.clear();
    this.processFilter!.value = '';
    this.searchFilterInput!.value = '';
  }

  tagFilterKeyEvent = (e: KeyboardEvent): void => {
    let inputValue = this.tagFilterInput!.value.trim();
    if (e.key === 'Enter') {
      if (inputValue !== '' && !this.allowTag.has(inputValue.toLowerCase()) && this.allowTag.size < 10) {
        let tagElement = document.createElement('div');
        tagElement.className = 'tagElement';
        tagElement.id = inputValue;
        let tag = document.createElement('div');
        tag.className = 'tag';
        tag.innerHTML = inputValue;
        this.allowTag.add(inputValue.toLowerCase());
        let closeButton = document.createElement('lit-icon');
        closeButton.setAttribute('name', 'close-light');
        closeButton.style.color = '#FFFFFF';
        tagElement.append(tag);
        tagElement.append(closeButton);
        this.tagFilterDiv!.append(tagElement);
      }
    }
    this.tableTimeHandle?.();
  };

  private updateFilterData(): void {
    if (this.systemLogSource?.length > 0) {
      this.filterData = this.systemLogSource.filter((data) => this.isFilterLog(data));
    }
    if (this.hiLogsTbl) {
      // @ts-ignore
      this.hiLogsTbl.shadowRoot.querySelector('.table').style.height = this.parentElement.clientHeight - 20 - 45 + 'px';
    }
    if (this.filterData.length > 0) {
      this.hiLogsTbl!.recycleDataSource = this.filterData;
    } else {
      this.hiLogsTbl!.recycleDataSource = [];
    }
    this.refreshLogsTitle();
  }

  private isFilterLog(data: LogStruct): boolean {
    let level = this.levelFilterInput?.selectedIndex || 0;
    let search = this.searchFilterInput?.value.toLowerCase() || '';
    let tagData = this.tagFilterInput?.value.toLowerCase() || '';
    tagData = tagData.replace(/\s/g, '');
    search = search.replace(/\s/g, '');
    let processSearch = this.processFilter?.value.toLowerCase() || '';
    processSearch = processSearch.replace(/\s/g, '');
    // @ts-ignore
    return (
      (data.startTs || 0) >= TraceRow.range!.startNS &&
      (data.startTs || 0) <= TraceRow.range!.endNS &&
      (level === 0 || this.optionLevel.indexOf(data.level!) >= level) &&
      (this.allowTag.size === 0 || this.filterTag(data.tag!.toLowerCase().replace(/\s/g, ''))) &&
      (search === '' || data.context!.toLowerCase().replace(/\s/g, '').indexOf(search) >= 0) &&
      (processSearch === '' ||
        (data.processName !== null && data.processName!.toLowerCase().replace(/\s/g, '').indexOf(processSearch) >= 0))
    );
  }

  // 模糊过滤tag
  private filterTag(tagAllName: unknown): boolean | undefined {
    let flag = false;
    if (this.allowTag.size === 0) {
      return;
    }
    for (const value of this.allowTag) {
      // @ts-ignore
      if (tagAllName.indexOf(value) >= 0) {
        flag = true;
        return flag;
      }
    }
    return flag;
  }

  private refreshTable(): void {
    if (this.traceSheetEl) {
      this.traceSheetEl.systemLogFlag = undefined;
      this.spSystemTrace?.refreshCanvas(false);
      this.updateFilterData();
    }
  }

  private delayedRefresh(optionFn: Function, dur: number = tableTimeOut): () => void {
    return (...args: []): void => {
      window.clearTimeout(this.timeOutId);
      this.timeOutId = window.setTimeout((): void => {
        optionFn.apply(this, ...args);
      }, dur);
    };
  }
}

let defaultIndex: number = 1;
let tableTimeOut: number = 50;
