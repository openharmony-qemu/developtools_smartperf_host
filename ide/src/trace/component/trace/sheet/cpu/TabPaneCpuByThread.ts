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
import { SelectionData, SelectionParam } from '../../../../bean/BoxSelection';
import { log } from '../../../../../log/Log';
import { getProbablyTime } from '../../../../database/logic-worker/ProcedureLogicWorkerCommon';
import { Utils } from '../../base/Utils';
import { resizeObserver } from '../SheetUtils';
import { getTabCpuByThread } from '../../../../database/sql/Cpu.sql';

@element('tabpane-cpu-thread')
export class TabPaneCpuByThread extends BaseElement {
  private cpuByThreadTbl: LitTable | null | undefined;
  private range: HTMLLabelElement | null | undefined;
  private cpuByThreadSource: Array<SelectionData> = [];
  private currentSelectionParam: SelectionParam | undefined;
  private pubColumns = `
            <lit-table-column order width="250px" title="Process" data-index="process" key="process" align="flex-start" order >
            </lit-table-column>
            <lit-table-column order width="120px" title="PID" data-index="pid" key="pid" align="flex-start" order >
            </lit-table-column>
            <lit-table-column order width="250px" title="Thread" data-index="thread" key="thread" align="flex-start" order >
            </lit-table-column>
            <lit-table-column order width="120px" title="TID" data-index="tid" key="tid" align="flex-start" order >
            </lit-table-column>
            <lit-table-column order width="200px" title="Wall duration(ms)" data-index="wallDuration" key="wallDuration" align="flex-start" order >
            </lit-table-column>
            <lit-table-column order width="200px" title="Avg Wall duration(ms)" data-index="avgDuration" key="avgDuration" align="flex-start" order >
            </lit-table-column>
            <lit-table-column order width="120px" title="Occurrences" data-index="occurrences" key="occurrences" align="flex-start" order >
            </lit-table-column>
    `;

  set data(cpuByThreadValue: SelectionParam | unknown) {
    if (this.currentSelectionParam === cpuByThreadValue) {
      return;
    }
    // @ts-ignore
    this.currentSelectionParam = cpuByThreadValue;
    // @ts-ignore
    this.cpuByThreadTbl!.innerHTML = this.getTableColumns(cpuByThreadValue.cpus);
    this.cpuByThreadTbl!.injectColumns();
    this.range!.textContent =
    // @ts-ignore
      `Selected range: ${parseFloat(((cpuByThreadValue.rightNs - cpuByThreadValue.leftNs) / 1000000.0).
        toFixed(5))} ms`;
    this.cpuByThreadTbl!.loading = true;
    this.handleAsyncRequest(cpuByThreadValue);
  }

  private handleAsyncRequest(cpuByThreadValue: unknown): void {
    // @ts-ignore
    getTabCpuByThread(cpuByThreadValue.cpus, cpuByThreadValue.leftNs, cpuByThreadValue.rightNs).then((result): void => {
      this.cpuByThreadTbl!.loading = false;
      if (result !== null && result.length > 0) {
        log(`getTabCpuByThread size :${  result.length}`);
        this.processResult(result, cpuByThreadValue);
      } else {
        this.cpuByThreadSource = [];
        this.cpuByThreadTbl!.recycleDataSource = this.cpuByThreadSource;
      }
    });
  }

  private processResult(result: Array<unknown>, cpuByThreadValue: unknown): void {
    let sumWall = 0.0;
    let sumOcc = 0;
    let map: Map<string, unknown> = new Map<string, unknown>();
    for (let e of result) {
      // @ts-ignore
      sumWall += e.wallDuration;
      // @ts-ignore
      sumOcc += e.occurrences;
      this.updateThreadMap(e, cpuByThreadValue, map);
    }
    this.calculateCount(map, sumWall, sumOcc);
  }

  private updateThreadMap(e: unknown, cpuByThreadValue: unknown, map: Map<string, unknown>): void {
    // @ts-ignore
    if (map.has(`${e.tid}`)) {
      this.updateExistingThread(e, cpuByThreadValue, map);
    } else {
      this.createThread(e, cpuByThreadValue, map);
    }
  }

  private updateExistingThread(e: unknown, cpuByThreadValue: unknown, map: Map<string, unknown>): void {
    // @ts-ignore
    let thread = map.get(`${e.tid}`)!;
    // @ts-ignore
    thread.wallDuration += e.wallDuration;
    // @ts-ignore
    thread.occurrences += e.occurrences;
    this.updateCpuValues(e, cpuByThreadValue, thread);
  }

  private createThread(e: unknown, cpuByThreadValue: unknown, map: Map<string, unknown>): void {
    // @ts-ignore
    let process = Utils.PROCESS_MAP.get(e.pid);
    // @ts-ignore
    let thread = Utils.THREAD_MAP.get(e.tid);
    let cpuByThreadObject: unknown = {
      // @ts-ignore
      tid: e.tid,
      // @ts-ignore
      pid: e.pid,
      thread: !thread || thread.length === 0 ? '[NULL]' : thread,
      process: !process || process.length === 0 ? '[NULL]' : process,
      // @ts-ignore
      wallDuration: e.wallDuration || 0,
      // @ts-ignore
      occurrences: e.occurrences || 0,
      avgDuration: 0,
    };
    this.initializeCpuValues(cpuByThreadValue, cpuByThreadObject);
    this.updateCpuValues(e, cpuByThreadValue, cpuByThreadObject);
    // @ts-ignore
    map.set(`${e.tid}`, cpuByThreadObject);
  }

  private initializeCpuValues(cpuByThreadValue: unknown, cpuByThreadObject: unknown): void {
    // @ts-ignore
    for (let i of cpuByThreadValue.cpus) {
      // @ts-ignore
      cpuByThreadObject[`cpu${i}`] = 0;
      // @ts-ignore
      cpuByThreadObject[`cpu${i}TimeStr`] = '0';
      // @ts-ignore
      cpuByThreadObject[`cpu${i}Ratio`] = '0';
    }
  }

  private updateCpuValues(e: unknown, cpuByThreadValue: unknown, cpuByThreadObject: unknown): void {
    // @ts-ignore
    cpuByThreadObject[`cpu${e.cpu}`] = e.wallDuration || 0;
    // @ts-ignore
    cpuByThreadObject[`cpu${e.cpu}TimeStr`] = getProbablyTime(e.wallDuration || 0);
    // @ts-ignore
    let ratio = ((100.0 * (e.wallDuration || 0)) / (cpuByThreadValue.rightNs - cpuByThreadValue.leftNs)).toFixed(2);
    if (ratio === '0.00') {
      ratio = '0';
    }
    // @ts-ignore
    cpuByThreadObject[`cpu${e.cpu}Ratio`] = ratio;
  }

  private calculateCount(map: Map<string, unknown>, sumWall: number, sumOcc: number): void {
    // @ts-ignore
    let arr = Array.from(map.values()).sort((a, b) => b.wallDuration - a.wallDuration);
    for (let e of arr) {
      // @ts-ignore
      e.avgDuration = (e.wallDuration / (e.occurrences || 1.0) / 1000000.0).toFixed(5);
      // @ts-ignore
      e.wallDuration = parseFloat((e.wallDuration / 1000000.0).toFixed(5));
    }
    let count: unknown = {};
    // @ts-ignore
    count.process = ' ';
    // @ts-ignore
    count.wallDuration = parseFloat((sumWall / 1000000.0).toFixed(7));
    // @ts-ignore
    count.occurrences = sumOcc;
    // @ts-ignore
    arr.splice(0, 0, count);
    // @ts-ignore
    this.cpuByThreadSource = arr;
    this.cpuByThreadTbl!.recycleDataSource = arr;
  }

  getTableColumns(cpus: Array<number>): string {
    let cpuByThreadTblHtml = `${this.pubColumns}`;
    let cpuByThreadList = cpus.sort((cpuByThreadA, cpuByThreadB) => cpuByThreadA - cpuByThreadB);
    for (let index of cpuByThreadList) {
      cpuByThreadTblHtml = `${cpuByThreadTblHtml}
            <lit-table-column width="100px" title="cpu${index}" data-index="cpu${index}TimeStr" key="cpu${index}TimeStr"  align="flex-start" order>
            </lit-table-column>
            <lit-table-column width="100px" title="%" data-index="cpu${index}Ratio" key="cpu${index}Ratio"  align="flex-start" order>
            </lit-table-column>
            `;
    }
    return cpuByThreadTblHtml;
  }

  initElements(): void {
    this.cpuByThreadTbl = this.shadowRoot?.querySelector<LitTable>('#tb-cpu-thread');
    this.range = this.shadowRoot?.querySelector('#time-range');
    this.cpuByThreadTbl!.addEventListener('column-click', (evt): void => {
      // @ts-ignore
      this.sortByColumn(evt.detail);
    });
    this.cpuByThreadTbl!.addEventListener('row-click', (evt: unknown): void => {
      // @ts-ignore
      let data = evt.detail.data;
      data.isSelected = true;
      this.cpuByThreadTbl?.clearAllSelection(data);
      this.cpuByThreadTbl?.setCurrentSelection(data);
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.cpuByThreadTbl!);
  }

  initHtml(): string {
    return `
        <style>
        .cpu-by-thread-label{
            width: 100%;
            height: 20px;
        }
        :host{
            width: auto;
            display: flex;
            flex-direction: column;
            padding: 10px 10px;
        }
        </style>
        <label id="time-range" class="cpu-by-thread-label" style="text-align: end;font-size: 10pt;margin-bottom: 5px">Selected range:0.0 ms</label>
        <lit-table id="tb-cpu-thread" style="height:calc( 30vh - 25px )" >
            
        </lit-table>
        `;
  }
  compare(property: unknown, sort: unknown, type: string) {
    return function (cpuByThreadLeftData: SelectionData, cpuByThreadRightData: SelectionData): number {
      if (cpuByThreadLeftData.process === ' ' || cpuByThreadRightData.process === ' ') {
        return 0;
      }
      if (type === 'number') {
        return sort === 2 ? // @ts-ignore
          parseFloat(cpuByThreadRightData[property]) - parseFloat(cpuByThreadLeftData[property]) : // @ts-ignore
          parseFloat(cpuByThreadLeftData[property]) - parseFloat(cpuByThreadRightData[property]);
      } else {
        // @ts-ignore
        if (cpuByThreadRightData[property] > cpuByThreadLeftData[property]) {
          return sort === 2 ? 1 : -1;
        } else {
          // @ts-ignore
          if (cpuByThreadRightData[property] === cpuByThreadLeftData[property]) {
            return 0;
          } else {
            return sort === 2 ? -1 : 1;
          }
        }
      }
    };
  }
  sortByColumn(detail: unknown): void {
    // @ts-ignore
    if ((detail.key as string).includes('cpu')) {
      // @ts-ignore
      if ((detail.key as string).includes('Ratio')) {
        // @ts-ignore
        this.cpuByThreadSource.sort(this.compare(detail.key, detail.sort, 'string'));
      } else {
        // @ts-ignore
        this.cpuByThreadSource.sort(this.compare((detail.key as string).replace('TimeStr', ''), detail.sort, 'number'));
      }
    } else {
      if (
        // @ts-ignore
        detail.key === 'pid' ||
        // @ts-ignore
        detail.key === 'tid' ||
        // @ts-ignore
        detail.key === 'wallDuration' ||
        // @ts-ignore
        detail.key === 'avgDuration' ||
        // @ts-ignore
        detail.key === 'occurrences'
      ) {
        // @ts-ignore
        this.cpuByThreadSource.sort(this.compare(detail.key, detail.sort, 'number'));
      } else {
        // @ts-ignore
        this.cpuByThreadSource.sort(this.compare(detail.key, detail.sort, 'string'));
      }
    }

    this.cpuByThreadTbl!.recycleDataSource = this.cpuByThreadSource;
  }
}
