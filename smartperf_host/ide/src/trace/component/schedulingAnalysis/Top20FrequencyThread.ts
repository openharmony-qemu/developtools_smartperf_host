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

import { BaseElement, element } from '../../../base-ui/BaseElement';
import { LitTable } from '../../../base-ui/table/lit-table';
import { procedurePool } from '../../database/Procedure';
import { info } from '../../../log/Log';
import '../../../base-ui/chart/pie/LitChartPie';
import { LitChartPie } from '../../../base-ui/chart/pie/LitChartPie';
import { LitSelect } from '../../../base-ui/select/LitSelect';
import { LitSelectOption } from '../../../base-ui/select/LitSelectOption';
import '../../../base-ui/progress-bar/LitProgressBar';
import { LitProgressBar } from '../../../base-ui/progress-bar/LitProgressBar';
import './TableNoData';
import { TableNoData } from './TableNoData';
import { getProbablyTime } from '../../database/logic-worker/ProcedureLogicWorkerCommon';
import { queryThreads } from '../../database/sql/ProcessThread.sql';
import { Top20FrequencyThreadHtml } from './Top20FrequencyThread.html';
import { LitSelectV } from '../../../base-ui/select/LitSelectV';

@element('top20-frequency-thread')
export class Top20FrequencyThread extends BaseElement {
  static threads: { id: number; tid: number; name: string }[] | undefined;
  traceChange: boolean = false;
  private frequencyThreadTbl: LitTable | null | undefined;
  private threadSelect: LitSelectV | null | undefined;
  private frequencyThreadPie: LitChartPie | null | undefined;
  private currentThread: HTMLDivElement | null | undefined;
  private frequencyThreadProgress: LitProgressBar | null | undefined;
  private nodata: TableNoData | null | undefined;
  private currentTid: number = 0;
  private frequencyThreadData: Array<unknown> = [];
  private sortColumn: string = '';
  private sortType: number = 0;

  initElements(): void {
    this.nodata = this.shadowRoot!.querySelector<TableNoData>('#nodata');
    this.frequencyThreadProgress = this.shadowRoot!.querySelector<LitProgressBar>('#loading');
    this.frequencyThreadTbl = this.shadowRoot!.querySelector<LitTable>('#tb-process-thread-count');
    this.currentThread = this.shadowRoot!.querySelector<HTMLDivElement>('#current_thread');
    this.threadSelect = this.shadowRoot!.querySelector<LitSelectV>('#thread_select');
    this.frequencyThreadPie = this.shadowRoot!.querySelector<LitChartPie>('#pie');
    this.threadSelect!.addEventListener('mousedown', (): void => {
      if (Top20FrequencyThread.threads === undefined) {
        queryThreads().then((res) => {
          Top20FrequencyThread.threads = res || [];
          if (Top20FrequencyThread.threads && Top20FrequencyThread.threads!.length && Top20FrequencyThread.threads!.length > 0) {
            const nameArray = Top20FrequencyThread.threads!.map(item => item.name);
            this.threadSelect!.dataSource(nameArray!, '', true);
          } else {
            this.threadSelect!.dataSource([], '');
          }
        });
      }
    })
    this.threadSelect!.addEventListener('valueChange', (event) => {
      //@ts-ignore
      const newValue = event.detail.value;
      const regex = /\(([\d]+)\)/;
      const match = newValue.match(regex);
      if (match) {
        const numberInsideBrackets = match[1];
        this.currentThread!.textContent = newValue;
        this.currentTid = parseInt(numberInsideBrackets);
        this.frequencyThreadProgress!.loading = true;
        this.queryData();
      } else {
        this.frequencyThreadProgress!.loading = false;
        console.log('No match found');
      }
    });

    this.frequencyThreadTbl!.addEventListener('row-click', (evt: unknown): void => {
      //@ts-ignore
      let data = evt.detail.data;
      data.isSelected = true; //@ts-ignore
      if ((evt.detail as unknown).callBack) {
        //@ts-ignore
        (evt.detail as unknown).callBack(true);
      }
    });

    this.frequencyThreadTbl!.addEventListener('column-click', (evt: unknown): void => {
      //@ts-ignore
      this.sortColumn = evt.detail.key; //@ts-ignore
      this.sortType = evt.detail.sort;
      // @ts-ignore
      this.sortByColumn(evt.detail);
    });
    this.frequencyThreadTbl!.addEventListener('row-hover', (evt: unknown): void => {
      //@ts-ignore
      if (evt.detail.data) {
        //@ts-ignore
        let data = evt.detail.data;
        data.isHover = true; //@ts-ignore
        if ((evt.detail as unknown).callBack) {
          //@ts-ignore
          (evt.detail as unknown).callBack(true);
        }
      }
      this.frequencyThreadPie?.showHover();
    }); // @ts-ignore
    this.frequencyThreadTbl!.itemTextHandleMap.set('freq', (value) => (value === -1 ? 'unknown' : value));
  }

  sortByColumn(detail: unknown): void {
    // @ts-ignore
    function compare(frequencyThreadProperty, sort, type) {
      return function (a: unknown, b: unknown) {
        if (type === 'number') {
          // @ts-ignore
          return sort === 2
            ? // @ts-ignore
              parseFloat(b[frequencyThreadProperty]) - parseFloat(a[frequencyThreadProperty])
            : //@ts-ignore
              parseFloat(a[frequencyThreadProperty]) - parseFloat(b[frequencyThreadProperty]);
        } else {
          if (sort === 2) {
            //@ts-ignore
            return b[frequencyThreadProperty].toString().localeCompare(a[frequencyThreadProperty].toString());
          } else {
            //@ts-ignore
            return a[frequencyThreadProperty].toString().localeCompare(b[frequencyThreadProperty].toString());
          }
        }
      };
    }

    //@ts-ignore
    if (detail.key === 'timeStr') {
      //@ts-ignore
      detail.key = 'time'; //@ts-ignore
      this.frequencyThreadData.sort(compare(detail.key, detail.sort, 'number')); //@ts-ignore
    } else if (detail.key === 'no' || detail.key === 'cpu' || detail.key === 'freq' || detail.key === 'ratio') {
      //@ts-ignore
      this.frequencyThreadData.sort(compare(detail.key, detail.sort, 'number'));
    } else {
      //@ts-ignore
      this.frequencyThreadData.sort(compare(detail.key, detail.sort, 'string'));
    }
    this.frequencyThreadTbl!.recycleDataSource = this.frequencyThreadData;
  }

  async init(): Promise<void> {
    if (!this.traceChange) {
      if (this.frequencyThreadTbl!.recycleDataSource.length > 0) {
        this.frequencyThreadTbl?.reMeauseHeight();
      }
      return;
    }
    this.traceChange = false;
    this.frequencyThreadProgress!.loading = false;
    this.threadSelect!.clearVal();
    this.nodata!.style.opacity = '0';
  }

  queryData(): void {
    this.queryLogicWorker('scheduling-Thread Freq', 'query Thread Top 20 Frequency Time:', (res): void => {
      this.nodata!.style.opacity = '1';
      this.nodata!.noData =
        Top20FrequencyThread.threads === undefined ||
        Top20FrequencyThread.threads.length === 0 ||
        res === undefined || //@ts-ignore
        res.length === 0;
      (res as unknown[]).map((it: unknown, index: number): void => {
        //@ts-ignore
        it.no = index + 1;
      }); //@ts-ignore
      this.frequencyThreadData = res;
      if (this.sortColumn !== '') {
        this.sortByColumn({
          key: this.sortColumn,
          sort: this.sortType,
        });
      } else {
        //@ts-ignore
        this.frequencyThreadTbl!.recycleDataSource = res;
      }
      this.frequencyThreadTbl!.reMeauseHeight();
      this.setThreadPieConfig(res);
      this.frequencyThreadProgress!.loading = false;
      this.shadowRoot!.querySelector('#tb_vessel')!.scrollTop = 0;
    });
  }

  private setThreadPieConfig(res: unknown): void {
    this.frequencyThreadPie!.config = {
      appendPadding: 10, //@ts-ignore
      data: this.getPieChartData(res),
      angleField: 'time',
      colorField: 'freq',
      colorFieldTransferHandler: (value) => (value === -1 ? 'unknown' : value),
      radius: 0.8,
      label: {
        type: 'outer',
      },
      tip: (obj): string => {
        return `<div>
                             <div>freq:${
                               // @ts-ignore
                               obj.obj.freq === -1 ? 'unknown' : obj.obj.freq
                             }</div> 
                             <div>cpu:${
                               // @ts-ignore
                               obj.obj.cpu
                             }</div> 
                             <div>time:${
                               // @ts-ignore
                               obj.obj.timeStr
                             }</div> 
                             <div>ratio:${
                               // @ts-ignore
                               obj.obj.ratio
                             }%</div>
                        </div>
                `;
      },
      hoverHandler: (data): void => {
        if (data) {
          this.frequencyThreadTbl!.setCurrentHover(data);
        } else {
          this.frequencyThreadTbl!.mouseOut();
        }
      },
      interactions: [
        {
          type: 'element-active',
        },
      ],
    };
  }

  getPieChartData(res: unknown[]): unknown[] {
    if (res.length > 20) {
      let pieChartArr: unknown[] = [];
      let other: unknown = {
        cpu: '-',
        freq: 'other',
        time: 0,
        ratio: '0',
        totalDur: 0,
      };
      for (let i = 0; i < res.length; i++) {
        if (i < 19) {
          pieChartArr.push(res[i]);
        } else {
          //@ts-ignore
          other.time += res[i].time; //@ts-ignore
          other.timeStr = getProbablyTime(other.time); //@ts-ignore
          other.totalDur = res[i].totalDur; //@ts-ignore
          other.ratio = ((other.time / other.totalDur) * 100).toFixed(2);
        }
      }
      pieChartArr.push(other);
      return pieChartArr;
    }
    return res;
  }

  clearData(): void {
    this.traceChange = true;
    this.threadSelect!.innerHTML = '';
    this.frequencyThreadPie!.dataSource = [];
    this.frequencyThreadTbl!.recycleDataSource = [];
  }

  queryLogicWorker(option: string, log: string, handler: (res: unknown) => void): void {
    let frequencyThreadTime = new Date().getTime();
    procedurePool.submitWithName('logic0', option, { tid: this.currentTid }, undefined, handler);
    let durTime = new Date().getTime() - frequencyThreadTime;
    info(log, durTime);
  }

  initHtml(): string {
    return Top20FrequencyThreadHtml;
  }
}
