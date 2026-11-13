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
import { LitTable } from '../../../../../base-ui/table/lit-table';
import { SelectionParam } from '../../../../bean/BoxSelection';
import { LitProgressBar } from '../../../../../base-ui/progress-bar/LitProgressBar';
import { resizeObserver } from '../SheetUtils';
import { SpSystemTrace } from '../../../SpSystemTrace';
import { drawLines } from '../../../../database/ui-worker/ProcedureWorkerCommon';
import { TraceRow } from '../../base/TraceRow';
import { CpuFreqStruct } from '../../../../database/ui-worker/ProcedureWorkerFreq';
import { CpuStateStruct } from '../../../../database/ui-worker/cpu/ProcedureWorkerCpuState';
import { getTabPaneCounterSampleData } from '../../../../database/sql/Cpu.sql';

@element('tabpane-counter-sample')
export class TabPaneCounterSample extends BaseElement {
  private counterSampleTbl: LitTable | null | undefined;
  private range: HTMLLabelElement | null | undefined;
  private loadDataInCache: boolean = true;
  private selectionParam: SelectionParam | null | undefined;
  private sampleProgressEL: LitProgressBar | null | undefined;
  private counterLoadingPage: unknown;
  private counterLoadingList: number[] = [];
  private counterSampleSource: unknown[] = [];
  private counterSortKey: string = 'counter';
  private counterSortType: number = 0;
  private systemTrace: SpSystemTrace | undefined | null;
  // @ts-ignore
  private _rangeRow: Array<TraceRow<unknown>> | undefined | null;

  set data(counterSampleValue: SelectionParam | unknown) {
    if (counterSampleValue === this.selectionParam) {
      return;
    }
    this.sampleProgressEL!.loading = true;
    // @ts-ignore
    this.counterLoadingPage.style.visibility = 'visible';
    // @ts-ignore
    this.selectionParam = counterSampleValue;
    if (this.counterSampleTbl) {
      // @ts-ignore
      this.counterSampleTbl.shadowRoot.querySelector('.table').style.height = `${
        this.parentElement!.clientHeight - 25
      }px`;
    }
    this.queryDataByDB(counterSampleValue);
  }
  // @ts-ignore
  set rangeTraceRow(rangeRow: Array<TraceRow<unknown>> | undefined) {
    this._rangeRow = rangeRow;
  }

  initElements(): void {
    this.sampleProgressEL = this.shadowRoot!.querySelector<LitProgressBar>('.progressCounter');
    this.counterLoadingPage = this.shadowRoot!.querySelector('.loadingCounter');
    this.counterSampleTbl = this.shadowRoot!.querySelector<LitTable>('#tb-counter-sample');
    this.systemTrace = document
      .querySelector('body > sp-application')
      ?.shadowRoot!.querySelector<SpSystemTrace>('#sp-system-trace');
    this.counterSampleTbl!.addEventListener('column-click', (evt): void => {
      // @ts-ignore
      this.counterSortKey = evt.detail.key;
      // @ts-ignore
      this.counterSortType = evt.detail.sort;
      // @ts-ignore
      this.sortTable(evt.detail.key, evt.detail.sort);
    });
    this.rowClickEvent();
  }

  private rowClickEvent(): void {
    this.counterSampleTbl!.addEventListener('row-click', (evt): void => {
      // @ts-ignore
      let data = evt.detail.data;
      let path = new Path2D();
      if (this._rangeRow && this._rangeRow!.length > 0) {
        let rangeTraceRow = this._rangeRow!.filter(function (item) {
          return item.name.includes('State');
        });
        let cpuStateFilter = [];
        for (let row of rangeTraceRow!) {
          let context = row.collect ? this.systemTrace!.canvasFavoritePanelCtx! : this.systemTrace!.canvasPanelCtx!;
          cpuStateFilter.push(...row.dataListCache);
          row.canvasSave(context); // @ts-ignore
          context.clearRect(row.frame.x, row.frame.y, row.frame.width, row.frame.height); // @ts-ignore
          drawLines(context!, TraceRow.range?.xs || [], row.frame.height, this.systemTrace!.timerShaftEL!.lineColor());
          if (row.name.includes('State') && parseInt(row.name.replace(/[^\d]/g, ' ')) === data.cpu) {
            CpuFreqStruct.hoverCpuFreqStruct = undefined;
            for (let i = 0; i < cpuStateFilter!.length; i++) {
              if (
                // @ts-ignore
                cpuStateFilter[i].value === data.value &&
                // @ts-ignore
                cpuStateFilter[i].cpu === data.cpu &&
                // @ts-ignore
                Math.max(TraceRow.rangeSelectObject?.startNS!, cpuStateFilter[i].startTs!) <
                  // @ts-ignore
                  Math.min(TraceRow.rangeSelectObject?.endNS!, cpuStateFilter[i].startTs! + cpuStateFilter[i].dur!)
              ) {
                // @ts-ignore
                CpuStateStruct.hoverStateStruct = cpuStateFilter[i];
              }
              // @ts-ignore
              if (cpuStateFilter[i].cpu === data.cpu) {
                // @ts-ignore
                CpuStateStruct.draw(context, path, cpuStateFilter[i]);
              }
            }
          } else {
            for (let i = 0; i < cpuStateFilter!.length; i++) {
              if (
                row.name.includes('State') &&
                // @ts-ignore
                cpuStateFilter[i].cpu !== data.cpu &&
                // @ts-ignore
                cpuStateFilter[i].cpu === parseInt(row.name.replace(/[^\d]/g, ' '))
              ) {
                // @ts-ignore
                CpuStateStruct.draw(context, path, cpuStateFilter[i]);
              }
            }
          }
          row.canvasRestore(context, this.systemTrace);
        }
      }
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    // @ts-ignore
    resizeObserver(this.parentElement!, this.counterSampleTbl!, 25, this.counterLoadingPage, 24);
  }

  queryDataByDB(counterSampleParam: SelectionParam | unknown): void {
    this.counterLoadingList.push(1);
    this.sampleProgressEL!.loading = true;
    // @ts-ignore
    this.counterLoadingPage.style.visibility = 'visible';

    getTabPaneCounterSampleData(
      // @ts-ignore
      counterSampleParam.leftNs + counterSampleParam.recordStartNs,
      // @ts-ignore
      counterSampleParam.rightNs + counterSampleParam.recordStartNs,
      // @ts-ignore
      counterSampleParam.cpuStateFilterIds
    ).then((result) => {
      this.counterLoadingList.splice(0, 1);
      if (this.counterLoadingList.length === 0) {
        this.sampleProgressEL!.loading = false;
        // @ts-ignore
        this.counterLoadingPage.style.visibility = 'hidden';
      }
      let sampleMap = new Map<unknown, unknown>();
      // @ts-ignore
      counterSampleParam.cpuStateFilterIds.forEach((a: number): void => {
        this.getInitTime(
          //@ts-ignore
          result.filter((f) => f.filterId === a),
          sampleMap,
          // @ts-ignore
          counterSampleParam
        );
      });
      // @ts-ignore
      let counterSampleList: Array<unknown> = [];
      sampleMap.forEach((a) => {
        // @ts-ignore
        a.timeStr = parseFloat((a.time / 1000000.0).toFixed(6));
        counterSampleList.push(a);
      });
      counterSampleList.sort((a, b): number => {
        // @ts-ignore
        let countLeftData = Number(a.counter.toString().replace('Cpu', ''));
        // @ts-ignore
        let countRightData = Number(b.counter.toString().replace('Cpu', ''));
        if (countLeftData > countRightData) {
          return 1;
        } else {
          return -1;
        }
      });
      this.counterSampleSource = counterSampleList;
      this.sortTable(this.counterSortKey, this.counterSortType);
    });
  }
  // @ts-ignore
  getInitTime(initCounterResultList: Array<unknown>, sampleMap: Map<unknown, unknown>, val: SelectionParam): void {
    let leftNs = val.leftNs + val.recordStartNs;
    let rightNs = val.rightNs + val.recordStartNs;
    if (initCounterResultList.length === 0) {
      return;
    }
    // @ts-ignore
    let idx = initCounterResultList.findIndex((a) => a.ts >= leftNs);
    if (idx !== 0) {
      initCounterResultList = initCounterResultList.slice(
        idx === -1 ? initCounterResultList.length - 1 : idx - 1,
        initCounterResultList.length
      );
    }
    // @ts-ignore
    if (initCounterResultList[0].ts < leftNs && idx !== 0) {
      // @ts-ignore
      initCounterResultList[0].ts = leftNs;
    }
    initCounterResultList.forEach((item, idx): void => {
      if (idx + 1 === initCounterResultList.length) {
        // @ts-ignore
        item.time = rightNs - item.ts;
      } else {
        // @ts-ignore
        item.time = initCounterResultList[idx + 1].ts - item.ts;
      }
      // @ts-ignore
      if (sampleMap.has(`${item.filterId}-${item.value}`)) {
        // @ts-ignore
        let obj = sampleMap.get(`${item.filterId}-${item.value}`);
        // @ts-ignore
        obj.time += item.time;
      } else {
        // @ts-ignore
        sampleMap.set(`${item.filterId}-${item.value}`, {
          // @ts-ignore
          ...item,
          // @ts-ignore
          counter: `Cpu ${item.cpu}`,
          // @ts-ignore
          count: initCounterResultList.filter((ele) => ele.value === item.value).length,
        });
      }
    });
  }

  sortTable(key: string, type: number): void {
    if (type === 0) {
      this.counterSampleTbl!.recycleDataSource = this.counterSampleSource;
    } else {
      let arr = Array.from(this.counterSampleSource);
      arr.sort((sortByColumnLeftData, sortByColumnRightData): number => {
        if (key === 'timeStr') {
          if (type === 1) {
            // @ts-ignore
            return sortByColumnLeftData.time - sortByColumnRightData.time;
          } else {
            // @ts-ignore
            return sortByColumnRightData.time - sortByColumnLeftData.time;
          }
        } else if (key === 'counter') {
          // @ts-ignore
          let countLeftData = Number(sortByColumnLeftData.counter.toString().replace('Cpu', ''));
          // @ts-ignore
          let countRightData = Number(sortByColumnRightData.counter.toString().replace('Cpu', ''));
          if (type === 1) {
            return countLeftData - countRightData;
          } else {
            return countRightData - countLeftData;
          }
        } else if (key === 'value') {
          if (type === 1) {
            // @ts-ignore
            return sortByColumnLeftData.value - sortByColumnRightData.value;
          } else {
            // @ts-ignore
            return sortByColumnRightData.value - sortByColumnLeftData.value;
          }
        } else if (key === 'count') {
          if (type === 1) {
            // @ts-ignore
            return sortByColumnLeftData.count - sortByColumnRightData.count;
          } else {
            // @ts-ignore
            return sortByColumnRightData.count - sortByColumnLeftData.count;
          }
        } else {
          return 0;
        }
      });
      this.counterSampleTbl!.recycleDataSource = arr;
    }
  }

  initHtml(): string {
    return `
        <style>
        .progressCounter{
            height: 1px;
            left: 0;
            right: 0;
            bottom: 5px;
            position: absolute;
        }
        :host{
            display: flex;
            padding: 10px 10px;
            flex-direction: column;
        }
        .loadingCounter{
            left: 0;
            right: 0;
            width:100%;
            bottom: 0;
            position: absolute;
            background:transparent;
            z-index: 999999;
        }
        .counter-sample-table{
            height: auto;
        }
        </style>
        <lit-table id="tb-counter-sample" class="counter-sample-table">
            <lit-table-column class="counter-sample-column" width="20%" order data-index="counter" key="counter" align="flex-start" title="Cpu" >
            </lit-table-column>
            <lit-table-column class="counter-sample-column" width="1fr" order data-index="timeStr" key="timeStr" align="flex-start" title="Time(ms)" >
            </lit-table-column>
            <lit-table-column class="counter-sample-column" width="1fr" order data-index="value" key="value" align="flex-start" title="Value" >
            </lit-table-column>
            <lit-table-column class="counter-sample-column" width="1fr" order data-index="count" key="count" align="flex-start" title="Count" >
            </lit-table-column>
        </lit-table>
        <lit-progress-bar class="progressCounter"></lit-progress-bar>
        <div class="loadingCounter"></div>
        `;
  }
}
