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
import { HiSysEventStruct } from '../../../../database/ui-worker/ProcedureWorkerHiSysEvent';
import { ns2x, Rect } from '../../../../database/ui-worker/ProcedureWorkerCommon';
import { LitPageTable } from '../../../../../base-ui/table/LitPageTable';
import { LitTable } from '../../../../../base-ui/table/lit-table';
import { LitSlicerTrack } from '../../../../../base-ui/slicer/lit-slicer';
import { TraceRow } from '../../base/TraceRow';
import { Flag } from '../../timer-shaft/Flag';
import { TraceSheet } from '../../base/TraceSheet';
import { SpSystemTrace } from '../../../SpSystemTrace';
import { ColorUtils } from '../../base/ColorUtils';
import { queryHiSysEventTabData } from '../../../../database/sql/Perf.sql';
import { queryRealTime } from '../../../../database/sql/Clock.sql';
import { TabPaneHiSysEventsHtml } from './TabPaneHisysEvents.html';

@element('tab-hisysevents')
export class TabPaneHisysEvents extends BaseElement {
  private hisysEventSource: Array<HiSysEventStruct> = [];
  private filterDataList: HiSysEventStruct[] = [];
  private hiSysEventTable: LitPageTable | undefined | null;
  private currentSelection: SelectionParam | undefined;
  private domainFilterInput: HTMLInputElement | undefined | null;
  private eventNameFilterInput: HTMLInputElement | undefined | null;
  private levelFilter: HTMLSelectElement | undefined | null;
  private contentFilterInput: HTMLInputElement | undefined | null;
  private domainTag: Set<string> = new Set();
  private domainTagDiv: HTMLDivElement | undefined | null;
  private eventNameTag: Set<string> = new Set();
  private eventNameTagDiv: HTMLDivElement | undefined | null;
  private traceSheetEl: TraceSheet | undefined | null;
  private spSystemTrace: SpSystemTrace | undefined | null;
  private detailsTbl: LitTable | null | undefined;
  private boxDetails: HTMLDivElement | null | undefined;
  private slicerTrack: LitSlicerTrack | null | undefined;
  private tableElement: HTMLDivElement | undefined | null;
  private detailbox: HTMLDivElement | null | undefined;
  private changeInput: HTMLInputElement | null | undefined;
  private eventTableTitle: HTMLLabelElement | undefined | null;
  tableTitleTimeHandle: (() => void) | undefined;
  private currentDetailList: Array<{ key: string; value: string }> = [];
  private realTime: number = -1;
  private bootTime: number = -1;
  private baseTime: string = '';

  set data(systemEventParam: SelectionParam) {
    if (systemEventParam === this.currentSelection) {
      return;
    }
    if (this.hiSysEventTable) {
      this.hiSysEventTable.recycleDataSource = [];
      this.filterDataList = [];
    }
    if (this.detailsTbl) {
      this.detailsTbl!.recycleDataSource = [];
    }
    this.initTabSheetEl();
    queryRealTime().then((result) => {
      if (result && result.length > 0) {
        result.forEach((item) => {
          if (item.name === 'realtime') {
            this.realTime = item.ts;
          } else {
            this.bootTime = item.ts;
          }
        });
      }
      queryHiSysEventTabData(systemEventParam.leftNs, systemEventParam.rightNs).then((res) => {
        this.currentSelection = systemEventParam;
        systemEventParam.sysAllEventsData = res;
        this.hiSysEventTable!.recycleDataSource = res;
        this.hisysEventSource = res;
        this.updateData();
      });
    });
  }

  queryElements(): void {
    this.boxDetails = this.shadowRoot?.querySelector<HTMLDivElement>('.box-details');
    this.hiSysEventTable = this.shadowRoot?.querySelector<LitPageTable>('#tb-hisysevent');
    this.hiSysEventTable!.getItemTextColor = (data): string => {
      // @ts-ignore
      return ColorUtils.getHisysEventColor(data.level);
    };
    this.domainTagDiv = this.shadowRoot?.querySelector<HTMLDivElement>('#domainTagFilter');
    this.eventNameTagDiv = this.shadowRoot?.querySelector<HTMLDivElement>('#eventNameTagFilter');
    this.domainFilterInput = this.shadowRoot?.querySelector<HTMLInputElement>('#domain-filter');
    this.eventNameFilterInput = this.shadowRoot?.querySelector<HTMLInputElement>('#event-name-filter');
    this.levelFilter = this.shadowRoot?.querySelector<HTMLSelectElement>('#level-filter');
    this.spSystemTrace = document
      .querySelector('body > sp-application')
      ?.shadowRoot?.querySelector<SpSystemTrace>('#sp-system-trace');
    this.traceSheetEl = this.spSystemTrace?.shadowRoot?.querySelector('.trace-sheet');
    this.contentFilterInput = this.shadowRoot?.querySelector<HTMLInputElement>('#contents-filter');
    this.changeInput = this.shadowRoot?.querySelector<HTMLInputElement>('#contents-change');
    this.detailsTbl = this.shadowRoot?.querySelector<LitTable>('#tb-hisysevent-data');
    this.slicerTrack = this.shadowRoot?.querySelector<LitSlicerTrack>('lit-slicer-track');
    this.detailbox = this.shadowRoot?.querySelector<HTMLDivElement>('.detail-content');
    this.tableElement = this.hiSysEventTable?.shadowRoot?.querySelector('.table') as HTMLDivElement;
    this.eventTableTitle = this.shadowRoot?.querySelector<HTMLLabelElement>('#event-title');
    this.tableTitleTimeHandle = this.delayedRefresh(this.refreshEventsTitle);
    this.initHiSysEventListener();
  }

  /**
   * 按ns去补0
   *
   * @param timestamp
   * @private
   */
  private timestampToNS(timestamp: string): number {
    return Number(timestamp.toString().padEnd(19, '0'));
  }

  private initHiSysEventListener(): void {
    this.hiSysEventTable!.addEventListener('row-click', (event) => {
      this.changeInput!.value = '';
      // @ts-ignore
      const data = event.detail.data;
      this.convertData(data);
      this.hiSysEventTable?.clearAllSelection();
      data.isSelected = true;
      this.hiSysEventTable?.setCurrentSelection(data);
      this.updateDetail(this.baseTime);
    });
    this.boxDetails!.addEventListener('click', (ev) => {
      if (ev.target !== this.hiSysEventTable) {
        this.hiSysEventTable?.clearAllSelection();
        this.detailsTbl!.dataSource = [];
        this.boxDetails!.style.width = '100%';
        this.detailbox!.style.display = 'none';
        this.slicerTrack!.style.visibility = 'hidden';
        this.detailsTbl!.style.paddingLeft = '0px';
      }
    });
    this.hiSysEventTable!.addEventListener('row-hover', (e) => {
      // @ts-ignore
      let data = e.detail.data;
      if (data) {
        this.drawFlag(data.startTs, '#999999');
      }
    });
    this.hiSysEventTable!.addEventListener('column-click', (evt) => {
      // @ts-ignore
      this.sortByColumn(evt.detail);
    });
    this.tableElement?.addEventListener('mouseout', () => {
      this.traceSheetEl!.systemLogFlag = undefined;
      this.spSystemTrace?.refreshCanvas(false);
    });
  }

  initElements(): void {
    this.queryElements();
    this.detailsTbl!.addEventListener('row-hover', (e) => {
      // @ts-ignore
      let data = e.detail.data;
      if (data && data.key && this.realTime >= 0) {
        if (data.key.endsWith('_TIME') || data.key.endsWith('_LATENCY')) {
          this.drawFlag(data.value, '#999999');
          return;
        }
      }
      this.traceSheetEl!.systemLogFlag = undefined;
      this.spSystemTrace?.refreshCanvas(false);
    });
  }

  private delayedRefresh(optionFn: Function, dur: number = 50): () => void {
    let timeOutId: number;
    return (...args: []): void => {
      window.clearTimeout(timeOutId);
      timeOutId = window.setTimeout((): void => {
        optionFn.apply(this, ...args);
      }, dur);
    };
  }

  private refreshEventsTitle(): void {
    let tbl = this.hiSysEventTable?.shadowRoot?.querySelector<HTMLDivElement>('.table');
    let height = 0;
    let firstRowHeight = 27;
    let tableHeadHeight = 26;
    if (this.hiSysEventTable && this.hiSysEventTable.currentRecycleList.length > 0) {
      let startDataIndex = this.hiSysEventTable.startSkip + 1;
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
      if (endDataIndex >= this.filterDataList.length) {
        endDataIndex = this.filterDataList.length;
      } else {
        endDataIndex = this.hiSysEventTable.startSkip === 0 ? endDataIndex - 1 : endDataIndex;
      }
      this.eventTableTitle!.textContent = `HisysEvents [${this.hiSysEventTable.startSkip === 0 ? 1 : startDataIndex}, 
        ${endDataIndex}] / ${this.filterDataList.length || 0}`;
    } else {
      this.eventTableTitle!.textContent = 'HisysEvents [0, 0] / 0';
    }
  }

  initTabSheetEl(): void {
    this.levelFilter!.selectedIndex = 0;
    this.domainFilterInput!.value = '';
    this.domainTagDiv!.innerHTML = '';
    this.domainTag.clear();
    this.eventNameFilterInput!.value = '';
    this.eventNameTagDiv!.innerHTML = '';
    this.eventNameTag.clear();
    this.contentFilterInput!.value = '';
    this.boxDetails!.style.width = '100%';
    this.detailbox!.style.display = 'none';
    this.slicerTrack!.style.visibility = 'hidden';
    this.detailsTbl!.style.paddingLeft = '0px';
  }

  initHtml(): string {
    return TabPaneHiSysEventsHtml;
  }

  connectedCallback(): void {
    this.domainFilterInput?.addEventListener('keyup', this.domainKeyEvent);
    this.eventNameFilterInput?.addEventListener('keyup', this.eventNameKeyEvent);
    this.contentFilterInput?.addEventListener('input', this.filterInputEvent);
    this.levelFilter?.addEventListener('change', this.filterInputEvent);
    this.domainTagDiv?.addEventListener('click', this.domainDivClickEvent);
    this.eventNameTagDiv?.addEventListener('click', this.eventNameDivClickEvent);
    this.changeInput?.addEventListener('input', this.changeInputEvent);
    new ResizeObserver(() => {
      this.tableElement!.style.height = `${this.parentElement!.clientHeight - 20 - 35}px`;
      this.hiSysEventTable?.reMeauseHeight();
      this.detailsTbl!.style.height = `${this.parentElement!.clientHeight - 30}px`;
      this.parentElement!.style.overflow = 'hidden';
      this.detailsTbl?.reMeauseHeight();
      this.updateData();
      this.tableTitleTimeHandle?.();
    }).observe(this.parentElement!);
    let tbl = this.hiSysEventTable?.shadowRoot?.querySelector<HTMLDivElement>('.table');
    tbl!.addEventListener('scroll', () => {
      this.tableTitleTimeHandle?.();
    });
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.domainFilterInput?.removeEventListener('keyup', this.domainKeyEvent);
    this.eventNameFilterInput?.removeEventListener('keyup', this.eventNameKeyEvent);
    this.contentFilterInput?.removeEventListener('input', this.filterInputEvent);
    this.levelFilter?.addEventListener('change', this.filterInputEvent);
    this.changeInput?.addEventListener('input', this.changeInputEvent);
    this.domainTagDiv?.removeEventListener('click', this.domainDivClickEvent);
    this.eventNameTagDiv?.removeEventListener('click', this.eventNameDivClickEvent);
  }

  filterInputEvent = (): void => {
    this.updateData();
  };

  domainDivClickEvent = (ev: Event): void => {
    // @ts-ignore
    let parentNode = ev.target.parentNode;
    if (parentNode && this.domainTagDiv!.contains(parentNode)) {
      this.domainTagDiv!.removeChild(parentNode);
      this.domainTag.delete(parentNode.textContent.trim().toLowerCase());
    }
    this.updateData();
  };

  eventNameDivClickEvent = (ev: Event): void => {
    // @ts-ignore
    let parentNode = ev.target.parentNode;
    if (parentNode && this.eventNameTagDiv!.contains(parentNode)) {
      this.eventNameTagDiv!.removeChild(parentNode);
      this.eventNameTag.delete(parentNode.textContent.trim().toLowerCase());
    }
    this.updateData();
  };

  domainKeyEvent = (e: KeyboardEvent): void => {
    let domainValue = this.domainFilterInput!.value.trim();
    if (e.key === 'Enter') {
      if (domainValue !== '' && !this.domainTag.has(domainValue.toLowerCase()) && this.domainTag.size < 10) {
        let tagElement = this.buildTag(domainValue);
        this.domainTag.add(domainValue.toLowerCase());
        this.domainTagDiv!.append(tagElement);
        this.domainFilterInput!.value = '';
      }
    } else if (e.key === 'Backspace') {
      let index = this.domainTagDiv!.childNodes.length - 1;
      if (index >= 0 && domainValue === '') {
        let childNode = this.domainTagDiv!.childNodes[index];
        this.domainTagDiv!.removeChild(childNode);
        this.domainTag.delete(childNode.textContent!.trim().toLowerCase());
      }
    }
    this.updateData();
  };

  private buildTag(domainValue: string): HTMLDivElement {
    let tagElement = document.createElement('div');
    tagElement.className = 'tagElement';
    tagElement.id = domainValue;
    let tag = document.createElement('div');
    tag.className = 'tag';
    tag.innerHTML = domainValue;
    let closeButton = document.createElement('lit-icon');
    closeButton.setAttribute('name', 'close-light');
    closeButton.style.color = '#FFFFFF';
    tagElement.append(tag);
    tagElement.append(closeButton);
    return tagElement;
  }

  eventNameKeyEvent = (e: KeyboardEvent): void => {
    let eventNameValue = this.eventNameFilterInput!.value.trim();
    if (e.key === 'Enter') {
      if (
        eventNameValue !== '' &&
        !this.eventNameTag.has(eventNameValue.toLowerCase()) &&
        this.eventNameTag.size < 10
      ) {
        let tagElement = this.buildTag(eventNameValue);
        this.eventNameTag!.add(eventNameValue.toLowerCase());
        this.eventNameTagDiv!.append(tagElement);
        this.eventNameFilterInput!.value = '';
      }
    } else if (e.key === 'Backspace') {
      let index = this.eventNameTagDiv!.childNodes.length - 1;
      if (index >= 0 && eventNameValue === '') {
        let childNode = this.eventNameTagDiv!.childNodes[index];
        this.eventNameTagDiv!.removeChild(childNode);
        this.eventNameTag.delete(childNode.textContent!.trim().toLowerCase());
      }
    }
    this.updateData();
  };

  updateData(): void {
    if (this.hisysEventSource.length > 0) {
      this.filterDataList = this.hisysEventSource.filter((data) => this.filterData(data));
    }
    if (this.filterDataList.length > 0) {
      this.hiSysEventTable!.recycleDataSource = this.filterDataList;
    } else {
      this.hiSysEventTable!.recycleDataSource = [];
    }
    this.refreshEventsTitle();
  }

  filterData(data: HiSysEventStruct): boolean {
    let level = this.levelFilter?.value;
    let contentsValue = this.contentFilterInput?.value.toLowerCase() || '';
    contentsValue = contentsValue.replace(/\s/g, '');
    return (
      (level === 'ALL' || data.level! === level) &&
      (this.domainTag.size === 0 || this.domainTag.has(data.domain!.toLowerCase())) &&
      (this.eventNameTag.size === 0 || this.eventNameTag.has(data.eventName!.toLowerCase())) &&
      (contentsValue === '' || data.contents!.toLowerCase().replace(/\s/g, '').indexOf(contentsValue) >= 0)
    );
  }

  changeInputEvent = (): void => {
    const changeValue = this.changeInput!.value;
    const currentValue = changeValue;
    if (!/^[0-9]*$/.test(changeValue) || isNaN(Number(currentValue))) {
      this.changeInput!.value = '';
      this.updateDetail(this.baseTime);
    } else {
      this.updateDetail(this.changeInput!.value);
    }
  };

  updateDetail(baseTime: string): void {
    const latencySuffix = '_LATENCY';
    let detailList: Array<{ key: string; value: string }> = [];
    this.currentDetailList.forEach((item) => {
      const latencyValue = item.key && item.key.endsWith(latencySuffix) ? item.value + Number(baseTime) : item.value;
      detailList.push({
        key: item.key,
        value: latencyValue,
      });
    });
    this.detailsTbl!.recycleDataSource = detailList;
  }

  convertData = (data: HiSysEventStruct): void => {
    this.baseTime = '';
    this.currentDetailList = [
      {
        key: 'key',
        value: 'value',
      },
    ];
    const content = JSON.parse(data.contents ?? '{}');
    if (content && typeof content === 'object') {
      let isFirstTime = true;
      let keyList = Object.keys(content);
      keyList.forEach((key) => {
        const value: string = content[key];
        let contentValue = value;
        if (key.endsWith('_TIME')) {
          if (!isNaN(Number(value))) {
            contentValue = (this.timestampToNS(value) - this.realTime + this.bootTime).toString();
            if (this.realTime < 0) {
              contentValue = value;
            }
            if (isFirstTime) {
              this.baseTime = contentValue;
              isFirstTime = false;
            }
          }
          if (key === 'INPUT_TIME') {
            this.baseTime = contentValue;
            isFirstTime = false;
          }
        }
        this.currentDetailList.push({
          key: key,
          value: contentValue,
        });
      });
    }
    this.changeInput!.value = `${this.baseTime}`;
    this.detailsTbl!.recycleDataSource = this.currentDetailList;
    this.slicerTrack!.style.visibility = 'visible';
    this.detailsTbl!.style.paddingLeft = '20px';
    this.boxDetails!.style.width = '65%';
    this.detailbox!.style.display = 'block';
  };

  sortByColumn(framesDetail: { sort: number; key: string }): void {
    let compare = function (property: string, sort: number, type: string) {
      return function (eventLeftData: HiSysEventStruct, eventRightData: HiSysEventStruct): number {
        let firstSortNumber: number = -1;
        let SecondSortNumber: number = 1;
        let thirdSortNumber: number = 2;
        // @ts-ignore
        let rightEventData = eventRightData[property];
        // @ts-ignore
        let leftEventData = eventLeftData[property];
        if (type === 'number') {
          return sort === thirdSortNumber
            ? parseFloat(rightEventData) - parseFloat(leftEventData)
            : parseFloat(leftEventData) - parseFloat(rightEventData);
        } else {
          if (rightEventData > leftEventData) {
            return sort === thirdSortNumber ? SecondSortNumber : firstSortNumber;
          } else {
            if (rightEventData === leftEventData) {
              return 0;
            } else {
              return sort === thirdSortNumber ? firstSortNumber : SecondSortNumber;
            }
          }
        }
      };
    };
    this.hisysEventSource.sort(compare(framesDetail.key, framesDetail.sort, 'number'));
    this.hiSysEventTable!.recycleDataSource = this.hisysEventSource;
  }

  drawFlag(value: number, color: string): void {
    let pointX: number = ns2x(
      value || 0,
      TraceRow.range!.startNS,
      TraceRow.range!.endNS,
      TraceRow.range!.totalNS,
      new Rect(0, 0, TraceRow.FRAME_WIDTH, 0)
    );
    this.traceSheetEl!.systemLogFlag = new Flag(Math.floor(pointX), 0, 0, 0, value!, color, '', true, '');
    this.spSystemTrace?.refreshCanvas(false);
  }
}

const millisecond = 1000_000;
