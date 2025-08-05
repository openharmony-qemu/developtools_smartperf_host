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
import { LitChartPie } from '../../../base-ui/chart/pie/LitChartPie';
import { procedurePool } from '../../database/Procedure';
import { SpSchedulingAnalysis } from './SpSchedulingAnalysis';
import { TabCpuDetailsThreads } from './TabCpuDetailsThreads';
import './TabCpuDetailsThreads';
import { info } from '../../../log/Log';
import { LitTable } from '../../../base-ui/table/lit-table';
import { getDataNo } from './utils/Utils';
import '../../../base-ui/progress-bar/LitProgressBar';
import { LitProgressBar } from '../../../base-ui/progress-bar/LitProgressBar';
import './TableNoData';
import { TableNoData } from './TableNoData';
import { TabCpuDetailsFrequencyHtml } from './TabCpuDetailsFrequency.html';

@element('tab-cpu-details-frequency')
export class TabCpuDetailsFrequency extends BaseElement {
  private tableNoData: TableNoData | null | undefined;
  private cpuDetailsFrequencyProgress: LitProgressBar | null | undefined;
  traceChange: boolean = false;
  private cpuDetailsFrequencyPie: LitChartPie | null | undefined;
  private cpuDetailsFrequencyUsageTbl: LitTable | null | undefined;
  private tabCpuDetailsThreads: TabCpuDetailsThreads | null | undefined;
  private cpu: number = 0;
  private cpuDetailsFrequencyData: Array<unknown> = [];
  private cpuDetailsFrequencySortColumn: string = '';
  private sortType: number = 0;

  initElements(): void {
    this.tableNoData = this.shadowRoot!.querySelector<TableNoData>('#table-no-data');
    this.cpuDetailsFrequencyProgress = this.shadowRoot!.querySelector<LitProgressBar>('#loading');
    this.cpuDetailsFrequencyPie = this.shadowRoot!.querySelector<LitChartPie>('#chart-pie');
    this.cpuDetailsFrequencyUsageTbl = this.shadowRoot!.querySelector<LitTable>('#fre-tb-cpu-usage');
    this.tabCpuDetailsThreads = this.shadowRoot!.querySelector<TabCpuDetailsThreads>('#tab-cpu-details-threads');

    this.cpuDetailsFrequencyUsageTbl!.addEventListener('row-click', (evt: unknown): void => {
      //@ts-ignore
      let data = evt.detail.data;
      data.isSelected = true;
      // @ts-ignore
      if ((evt.detail as unknown).callBack) {
        // @ts-ignore
        (evt.detail as unknown).callBack(true);
      }
    });

    this.cpuDetailsFrequencyUsageTbl!.addEventListener('column-click', (evt: unknown): void => {
      //@ts-ignore
      this.cpuDetailsFrequencySortColumn = evt.detail.key; //@ts-ignore
      this.sortType = evt.detail.sort;
      // @ts-ignore
      this.sortByColumn(evt.detail);
    });
    this.cpuDetailsFrequencyUsageTbl!.addEventListener('row-hover', (evt: unknown): void => {
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
      this.cpuDetailsFrequencyPie?.showHover();
    });
  }

  init(cpu: number): void {
    this.cpu = cpu;
    this.queryPieChartDataByType('CPU Frequency', cpu);
  }

  queryPieChartDataByType(type: string, cpu: number): void {
    if (this.traceChange) {
      return;
    }
    this.cpuDetailsFrequencyProgress!.loading = true;
    this.queryLoginWorker(`scheduling-${type}`, 'query Cpu Frequency Analysis Time:', (res) => {
      this.traceChange = true;
      this.cpuDetailsFrequencyProgress!.loading = false; //@ts-ignore
      this.cpuDetailsFrequencyData = res.get(cpu) || [];
      this.cpuDetailsFrequencyData = getDataNo(this.cpuDetailsFrequencyData);
      this.tableNoData!.noData = this.cpuDetailsFrequencyData.length === 0;
      this.noData(this.cpuDetailsFrequencyData.length === 0);
      this.setFrequencyPieConfig(cpu);
      if (this.cpuDetailsFrequencySortColumn !== '') {
        this.sortByColumn({
          key: this.cpuDetailsFrequencySortColumn,
          sort: this.sortType,
        });
      } else {
        this.cpuDetailsFrequencyUsageTbl!.recycleDataSource = this.cpuDetailsFrequencyData;
      }
      this.cpuDetailsFrequencyUsageTbl?.reMeauseHeight();
    });
  }

  private setFrequencyPieConfig(cpu: number): void {
    this.cpuDetailsFrequencyPie!.config = {
      appendPadding: 0,
      data: this.cpuDetailsFrequencyData,
      angleField: 'sum',
      colorField: 'value',
      radius: 1,
      label: {
        type: 'outer',
      },
      tip: (freObj): string => {
        return `<div>
                                <div>frequency:${
                                  // @ts-ignore
                                  freObj.obj.value
                                }</div> 
                                <div>min:${
                                  // @ts-ignore
                                  freObj.obj.min
                                }</div>
                                <div>max:${
                                  // @ts-ignore
                                  freObj.obj.max
                                }</div>
                                <div>average:${
                                  // @ts-ignore
                                  freObj.obj.avg
                                }</div>
                                <div>duration:${
                                  // @ts-ignore
                                  freObj.obj.sumTimeStr
                                }</div>
                                <div>ratio:${
                                  // @ts-ignore
                                  freObj.obj.ratio
                                }%</div>
                            </div>
                                `;
      },
      hoverHandler: (cpuDetailsFreqData): void => {
        if (cpuDetailsFreqData) {
          this.cpuDetailsFrequencyUsageTbl!.setCurrentHover(cpuDetailsFreqData);
        } else {
          this.cpuDetailsFrequencyUsageTbl!.mouseOut();
        }
      },
      angleClick: (it): void => {
        this.tabCpuDetailsThreads!.setShow = true;
        this.shadowRoot!.querySelector<HTMLDivElement>('.d-box')!.style.display = 'none';
        this.tabCpuDetailsThreads!.init(cpu, it);
      },
      interactions: [
        {
          type: 'element-active',
        },
      ],
    };
  }

  noData(value: boolean): void {
    this.shadowRoot!.querySelector<HTMLDivElement>('.fre-chart-box')!.style.display = value ? 'none' : 'block';
    this.shadowRoot!.querySelector<HTMLDivElement>('.table-box')!.style.width = value ? '100%' : '60%';
  }

  clearData(): void {
    this.traceChange = false;
    this.cpuDetailsFrequencyPie!.dataSource = [];
    this.cpuDetailsFrequencyUsageTbl!.recycleDataSource = [];
    this.shadowRoot!.querySelector<HTMLDivElement>('.d-box')!.style.display = 'flex';
    this.tabCpuDetailsThreads!.setShow = false;
    this.noData(false);
  }

  set setShow(v: boolean) {
    if (v) {
      this.shadowRoot!.querySelector<HTMLDivElement>('.d-box')!.style.display = 'flex';
    } else {
      this.shadowRoot!.querySelector<HTMLDivElement>('.d-box')!.style.display = 'none';
    }
  }

  queryLoginWorker(cpuFrequencyType: string, log: string, handler: (res: unknown) => void): void {
    let cpuDetailsFrequencyTime = new Date().getTime();
    procedurePool.submitWithName(
      'logic0',
      cpuFrequencyType,
      {
        endTs: SpSchedulingAnalysis.endTs,
        total: SpSchedulingAnalysis.totalDur,
      },
      undefined,
      handler
    );
    let durTime = new Date().getTime() - cpuDetailsFrequencyTime;
    info(log, durTime);
  }

  sortByColumn(detail: unknown): void {
    // @ts-ignore
    function compare(cpuDetailsFrequencyProperty, sort, type) {
      return function (a: unknown, b: unknown) {
        if (type === 'number') {
          return sort === 2
            ? // @ts-ignore
              parseFloat(b[cpuDetailsFrequencyProperty]) - parseFloat(a[cpuDetailsFrequencyProperty])
            : //@ts-ignore
              parseFloat(a[cpuDetailsFrequencyProperty]) - parseFloat(b[cpuDetailsFrequencyProperty]);
        } else {
          if (sort === 2) {
            //@ts-ignore
            return b[cpuDetailsFrequencyProperty].toString().localeCompare(a[cpuDetailsFrequencyProperty].toString());
          } else {
            //@ts-ignore
            return a[cpuDetailsFrequencyProperty].toString().localeCompare(b[cpuDetailsFrequencyProperty].toString());
          }
        }
      };
    }

    //@ts-ignore
    if (detail.key === 'min') {
      //@ts-ignore
      detail.key = 'minValue'; //@ts-ignore
      this.cpuDetailsFrequencyData.sort(compare(detail.key, detail.sort, 'number')); //@ts-ignore
    } else if (detail.key === 'max') {
      //@ts-ignore
      detail.key = 'maxValue'; //@ts-ignore
      this.cpuDetailsFrequencyData.sort(compare(detail.key, detail.sort, 'number')); //@ts-ignore
    } else if (detail.key === 'avg') {
      //@ts-ignore
      detail.key = 'avgValue'; //@ts-ignore
      this.cpuDetailsFrequencyData.sort(compare(detail.key, detail.sort, 'number')); //@ts-ignore
    } else if (detail.key === 'sumTimeStr') {
      //@ts-ignore
      detail.key = 'sum'; //@ts-ignore
      this.cpuDetailsFrequencyData.sort(compare(detail.key, detail.sort, 'number')); //@ts-ignore
    } else if (detail.key === 'value' || detail.key === 'ratio' || detail.key === 'index') {
      //@ts-ignore
      this.cpuDetailsFrequencyData.sort(compare(detail.key, detail.sort, 'number'));
    } else {
      //@ts-ignore
      this.cpuDetailsFrequencyData.sort(compare(detail.key, detail.sort, 'string'));
    }
    this.cpuDetailsFrequencyUsageTbl!.recycleDataSource = this.cpuDetailsFrequencyData;
  }

  initHtml(): string {
    return TabCpuDetailsFrequencyHtml;
  }
}
