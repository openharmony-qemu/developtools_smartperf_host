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
import { ColorUtils } from '../../base/ColorUtils';
import { LitPageTable } from '../../../../../base-ui/table/LitPageTable';
import { LitProgressBar } from '../../../../../base-ui/progress-bar/LitProgressBar';
import { TabPaneHangHtml } from './TabPaneHang.html';
import { HangStruct } from '../../../../database/ui-worker/ProcedureWorkerHang';
import { queryAllHangs } from '../../../../database/sql/Hang.sql';
import { HangType, SpHangChart } from '../../../chart/SpHangChart';
import { getTimeString } from '../TabPaneCurrentSelection';

/// Hangs 框选Tab页1
@element('tab-hang')
export class TabPaneHang extends BaseElement {
  // Elements
  private spSystemTrace: SpSystemTrace | undefined | null;
  private traceSheetEl: TraceSheet | undefined | null;
  private levelFilterInput: HTMLSelectElement | undefined | null;
  private searchFilterInput: HTMLInputElement | undefined | null;
  private processFilter: HTMLInputElement | undefined | null;
  private hangTableTitle: HTMLDivElement | undefined | null;
  private hangTbl: LitPageTable | undefined | null;

  private tableTimeHandle: (() => void) | undefined;
  private tableTitleTimeHandle: (() => void) | undefined;
  private systemHangSource: HangStructInPane[] = [];
  private filterData: HangStructInPane[] = [];

  private optionLevel: string[] = ['Instant', 'Circumstantial', 'Micro', 'Severe'];
  private allowTag: Set<string> = new Set();
  private progressEL: LitProgressBar | null | undefined;
  private timeOutId: number | undefined;

  /// 框选时段范围时触发
  set data(selectionParam: SelectionParam) {
    if (this.hangTbl) {
      this.hangTbl.recycleDataSource = [];
      this.filterData = [];
    }
    window.clearTimeout(this.timeOutId);
    queryAllHangs().then((ret) => {
      const filter = new Set([...selectionParam.hangMapData.keys()].map(key => key.split(' ').at(-1)));
      ret = ret.filter(struct => (
        filter.has(`${struct.pid ?? 0}`) &&
        ((struct.startNS ?? 0) <= selectionParam.rightNs) &&
        (selectionParam.leftNs <= ((struct.startNS ?? 0) + (struct.dur ?? 0)))
      ));

      if (ret.length === 0) {
        this.progressEL!.loading = false;
      }
      this.systemHangSource = ret.map(HangStructInPane.new);
      this.refreshTable();
    });
  }

  init(): void {
    this.levelFilterInput = this.shadowRoot?.querySelector<HTMLSelectElement>('#level-filter');
    this.hangTableTitle = this.shadowRoot?.querySelector<HTMLDivElement>('#hang-title');
    this.searchFilterInput = this.shadowRoot?.querySelector<HTMLInputElement>('#search-filter');
    this.processFilter = this.shadowRoot?.querySelector<HTMLInputElement>('#process-filter');
    this.spSystemTrace = document.querySelector('body > sp-application')?.shadowRoot?.querySelector<SpSystemTrace>('#sp-system-trace');
    this.tableTimeHandle = this.delayedRefresh(this.refreshTable);
    this.tableTitleTimeHandle = this.delayedRefresh(this.refreshHangsTitle);
    this.hangTbl = this.shadowRoot?.querySelector<LitPageTable>('#tb-hang');
    this.progressEL = this.shadowRoot?.querySelector('.progress') as LitProgressBar;
    this.hangTbl!.getItemTextColor = (data): string => {
      const hangData = data as HangStructInPane;
      return ColorUtils.getHangColor(hangData.type as HangType);
    };
    this.hangTbl!.itemTextHandleMap.set('startNS', (startTs) => {
      // @ts-ignore
      return ns2Timestamp(startTs);
    });
    this.hangTbl!.addEventListener('row-hover', (e): void => {
      // @ts-ignore
      let data = e.detail.data as HangStructInPane;
      if (data) {
        let pointX: number = ns2x(
          data.startNS || 0,
          TraceRow.range!.startNS,
          TraceRow.range!.endNS,
          TraceRow.range!.totalNS,
          new Rect(0, 0, TraceRow.FRAME_WIDTH, 0),
        );
        this.traceSheetEl!.systemLogFlag = new Flag(
          Math.floor(pointX), 0, 0, 0, data.startNS, '#999999', '', true, '',
        );
        this.spSystemTrace?.refreshCanvas(false);
      }
    });
    let tbl = this.hangTbl?.shadowRoot?.querySelector<HTMLDivElement>('.table');
    tbl!.addEventListener('scroll', () => {
      this.tableTitleTimeHandle?.();
    });
  }

  initElements(): void {
    this.init();
    this.searchFilterInput!.oninput = (): void => {
      this.tableTimeHandle?.();
    };
    this.processFilter!.oninput = (): void => {
      this.tableTimeHandle?.();
    };
    this.levelFilterInput!.onchange = (): void => {
      this.tableTimeHandle?.();
    };
  }

  connectedCallback(): void {
    super.connectedCallback();
    new ResizeObserver((): void => {
      this.parentElement!.style.overflow = 'hidden';
      if (this.hangTbl) {
        // @ts-ignore
        this.hangTbl.shadowRoot.querySelector('.table').style.height =
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
  }

  initHtml(): string {
    return TabPaneHangHtml;
  }

  refreshHangTab(): void {
    let tbl = this.hangTbl?.shadowRoot?.querySelector<HTMLDivElement>('.table');
    let height = 0;
    if (tbl) {
      const trs = tbl.querySelectorAll<HTMLElement>('.tr');
      trs.forEach((trEl: HTMLElement, index: number): void => {
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
      });
    }
  }

  refreshHangsTitle(): void {
    let tbl = this.hangTbl?.shadowRoot?.querySelector<HTMLDivElement>('.table');
    let height = 0;
    let firstRowHeight = 27;
    let tableHeadHeight = 26;
    this.refreshHangTab();
    if (this.hangTbl && this.hangTbl.currentRecycleList.length > 0) {
      let startDataIndex = this.hangTbl.startSkip + 1;
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
        endDataIndex = this.hangTbl.startSkip === 0 ? endDataIndex - 1 : endDataIndex;
      }
      this.hangTableTitle!.textContent = `Hangs [${this.hangTbl.startSkip === 0 ? 1 : startDataIndex}, 
        ${endDataIndex}] / ${this.filterData.length || 0}`;
    } else {
      this.hangTableTitle!.textContent = 'Hangs [0, 0] / 0';
    }
    if (this.hangTbl!.recycleDataSource.length > 0) {
      this.progressEL!.loading = false;
    }
  }

  initTabSheetEl(traceSheet: TraceSheet): void {
    this.traceSheetEl = traceSheet;
    this.levelFilterInput!.selectedIndex = 0;
    this.allowTag.clear();
    this.processFilter!.value = '';
    this.searchFilterInput!.value = '';
  }

  private updateFilterData(): void {
    if (this.systemHangSource?.length > 0) {
      this.filterData = this.systemHangSource.filter((data) => this.isFilterHang(data));
    }
    if (this.hangTbl) {
      // @ts-ignore
      this.hangTbl.shadowRoot.querySelector('.table').style.height = this.parentElement.clientHeight - 20 - 45 + 'px';
    }
    if (this.filterData.length > 0) {
      this.hangTbl!.recycleDataSource = this.filterData;
    } else {
      this.hangTbl!.recycleDataSource = [];
    }
    this.refreshHangsTitle();
  }

  private isFilterHang(data: HangStructInPane): boolean {
    let type = this.levelFilterInput?.selectedIndex ?? 0;
    let search = this.searchFilterInput?.value.toLocaleLowerCase() ?? '';
    let process = this.processFilter?.value.toLocaleLowerCase() ?? '';
    return (
      (type === 0 || this.optionLevel.indexOf(data.type) >= type) &&
      (search === '' || data.caller.toLocaleLowerCase().indexOf(search) >= 0) &&
      (process === '' || data.pname.toLocaleLowerCase().indexOf(process) >= 0)
    );
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

export class HangStructInPane {
  startNS: number = 0;
  dur: string = '0';
  pname: string = 'Process';
  type: string;

  sendEventTid: string;
  sendTime: string;
  expectHandleTime: string;
  taskNameId: string;
  caller: string;

  constructor(parent: HangStruct) {
    this.startNS = parent.startNS ?? this.startNS;
    this.dur = getTimeString(parent.dur ?? 0);
    this.pname = `${parent.pname ?? this.pname} ${parent.pid ?? ''}`.trim();
    this.type = SpHangChart.calculateHangType(parent.dur ?? 0);
    [this.sendEventTid, this.sendTime, this.expectHandleTime, this.taskNameId, this.caller] = (parent.content ?? ',0,0,,').split(',').map(i => i.trim());
    this.sendEventTid = this.sendEventTid.split(':').at(-1)!;
  }

  static new(parent: HangStruct): HangStructInPane {
    return new HangStructInPane(parent);
  }
}