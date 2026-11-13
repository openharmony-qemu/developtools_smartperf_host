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
import { info } from '../../../log/Log';
import { LitTable } from '../../../base-ui/table/lit-table';
import '../../../base-ui/progress-bar/LitProgressBar';
import { LitProgressBar } from '../../../base-ui/progress-bar/LitProgressBar';
import { getDataNo } from './utils/Utils';
import './TableNoData';
import { TableNoData } from './TableNoData';
import { TabCpuDetailsIrqHtml } from './TabCpuDetailsIrq.html';

@element('tab-cpu-details-irq')
export class TabCpuDetailsIrq extends BaseElement {
  private tableNoData: TableNoData | null | undefined;
  private cpuDetailsLrqUsageTbl: LitTable | null | undefined;
  private cpuDetailsLrqProgress: LitProgressBar | null | undefined;
  traceChange: boolean = false;
  private cpuDetailsLrqPie: LitChartPie | null | undefined;
  private cpuDetailsLrqData: Array<unknown> = [];
  private cpuDetailsLrqSortColumn: string = '';
  private sortType: number = 0;

  initElements(): void {
    this.tableNoData = this.shadowRoot!.querySelector<TableNoData>('#table-no-data');
    this.cpuDetailsLrqProgress = this.shadowRoot!.querySelector<LitProgressBar>('#loading');
    this.cpuDetailsLrqPie = this.shadowRoot!.querySelector<LitChartPie>('#chart-pie');
    this.cpuDetailsLrqUsageTbl = this.shadowRoot!.querySelector<LitTable>('#tb-cpu-irq');

    this.cpuDetailsLrqUsageTbl!.addEventListener('row-click', (evt: unknown) => {
      // @ts-ignore
      let data = evt.detail.data;
      data.isSelected = true;
      // @ts-ignore
      if ((evt.detail as unknown).callBack) {
        // @ts-ignore
        (evt.detail as unknown).callBack(true);
      }
    });

    this.cpuDetailsLrqUsageTbl!.addEventListener('column-click', (evt: unknown) => {
      //@ts-ignore
      this.cpuDetailsLrqSortColumn = evt.detail.key; //@ts-ignore
      this.sortType = evt.detail.sort;
      // @ts-ignore
      this.sortByColumn(evt.detail);
    });
    this.cpuDetailsLrqUsageTbl!.addEventListener('row-hover', (evt: unknown) => {
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
      this.cpuDetailsLrqPie?.showHover();
    });
  }

  init(cpu: number): void {
    this.queryPieChartDataByType('CPU Irq', cpu);
  }

  queryPieChartDataByType(type: string, cpu: number): void {
    if (this.traceChange) {
      return;
    }
    this.cpuDetailsLrqProgress!.loading = true;
    this.queryLoginWorker(`scheduling-${type}`, 'query Cpu Frequency Analysis Time:', (res) => {
      this.traceChange = true;
      this.cpuDetailsLrqProgress!.loading = false; //@ts-ignore
      this.cpuDetailsLrqData = res.get(cpu) || [];
      this.cpuDetailsLrqData = getDataNo(this.cpuDetailsLrqData);
      this.tableNoData!.noData = this.cpuDetailsLrqData.length === 0;
      this.noData(this.cpuDetailsLrqData.length === 0);
      this.setLrqPieConfig();
      if (this.cpuDetailsLrqSortColumn !== '') {
        this.sortByColumn({
          key: this.cpuDetailsLrqSortColumn,
          sort: this.sortType,
        });
      } else {
        this.cpuDetailsLrqUsageTbl!.recycleDataSource = this.cpuDetailsLrqData;
      }
      this.cpuDetailsLrqUsageTbl?.reMeauseHeight();
    });
  }

  private setLrqPieConfig(): void {
    this.cpuDetailsLrqPie!.config = {
      appendPadding: 0,
      data: this.cpuDetailsLrqData,
      angleField: 'sum',
      colorField: 'value',
      radius: 1,
      label: {
        type: 'outer',
      },
      tip: (irqObj): string => {
        return `<div>
                                <div>block:${
                                  // @ts-ignore
                                  irqObj.obj.block
                                }</div> 
                                <div>name:${
                                  // @ts-ignore
                                  irqObj.obj.value
                                }</div>
                                <div>min:${
                                  // @ts-ignore
                                  irqObj.obj.min
                                }</div>
                                <div>max:${
                                  // @ts-ignore
                                  irqObj.obj.max
                                }</div>
                                <div>average:${
                                  // @ts-ignore
                                  irqObj.obj.avg
                                }</div>
                                <div>duration:${
                                  // @ts-ignore
                                  irqObj.obj.sumTimeStr
                                }</div>
                                <div>ratio:${
                                  // @ts-ignore
                                  irqObj.obj.ratio
                                }%</div>
                            </div>
                                `;
      },
      hoverHandler: (data): void => {
        if (data) {
          this.cpuDetailsLrqUsageTbl!.setCurrentHover(data);
        } else {
          this.cpuDetailsLrqUsageTbl!.mouseOut();
        }
      },
      interactions: [
        {
          type: 'element-active',
        },
      ],
    };
  }

  noData(value: boolean): void {
    this.shadowRoot!.querySelector<HTMLDivElement>('.irq-chart-box')!.style.display = value ? 'none' : 'block';
    this.shadowRoot!.querySelector<HTMLDivElement>('.table-box')!.style.width = value ? '100%' : '60%';
  }

  clearData(): void {
    this.traceChange = false;
    this.cpuDetailsLrqPie!.dataSource = [];
    this.cpuDetailsLrqUsageTbl!.recycleDataSource = [];
    this.noData(false);
  }

  queryLoginWorker(irqType: string, log: string, handler: (res: unknown) => void): void {
    let cpuDetailsLrqTime = new Date().getTime();
    procedurePool.submitWithName(
      'logic0',
      irqType,
      {
        endTs: SpSchedulingAnalysis.endTs,
        total: SpSchedulingAnalysis.totalDur,
      },
      undefined,
      handler
    );
    let durTime = new Date().getTime() - cpuDetailsLrqTime;
    info(log, durTime);
  }

  sortByColumn(detail: unknown): void {
    // @ts-ignore
    function compare(cpuDetailsLrqProperty, sort, type) {
      return function (a: unknown, b: unknown) {
        if (type === 'number') {
          return sort === 2
            ? // @ts-ignore
              parseFloat(b[cpuDetailsLrqProperty]) - parseFloat(a[cpuDetailsLrqProperty]) //@ts-ignore
            : parseFloat(a[cpuDetailsLrqProperty]) - parseFloat(b[cpuDetailsLrqProperty]);
        } else {
          if (sort === 2) {
            //@ts-ignore
            return b[cpuDetailsLrqProperty].toString().localeCompare(a[cpuDetailsLrqProperty].toString());
          } else {
            //@ts-ignore
            return a[cpuDetailsLrqProperty].toString().localeCompare(b[cpuDetailsLrqProperty].toString());
          }
        }
      };
    }

    //@ts-ignore
    if (detail.key === 'min') {
      //@ts-ignore
      detail.key = 'minValue'; //@ts-ignore
      this.cpuDetailsLrqData.sort(compare(detail.key, detail.sort, 'number')); //@ts-ignore
    } else if (detail.key === 'max') {
      //@ts-ignore
      detail.key = 'maxValue'; //@ts-ignore
      this.cpuDetailsLrqData.sort(compare(detail.key, detail.sort, 'number')); //@ts-ignore
    } else if (detail.key === 'avg') {
      //@ts-ignore
      detail.key = 'avgValue'; //@ts-ignore
      this.cpuDetailsLrqData.sort(compare(detail.key, detail.sort, 'number')); //@ts-ignore
    } else if (detail.key === 'sumTimeStr') {
      //@ts-ignore
      detail.key = 'sum'; //@ts-ignore
      this.cpuDetailsLrqData.sort(compare(detail.key, detail.sort, 'number')); //@ts-ignore
    } else if (detail.key === 'ratio' || detail.key === 'index') {
      //@ts-ignore
      this.cpuDetailsLrqData.sort(compare(detail.key, detail.sort, 'number'));
    } else {
      //@ts-ignore
      this.cpuDetailsLrqData.sort(compare(detail.key, detail.sort, 'string'));
    }
    this.cpuDetailsLrqUsageTbl!.recycleDataSource = this.cpuDetailsLrqData;
  }

  initHtml(): string {
    return TabCpuDetailsIrqHtml;
  }
}
