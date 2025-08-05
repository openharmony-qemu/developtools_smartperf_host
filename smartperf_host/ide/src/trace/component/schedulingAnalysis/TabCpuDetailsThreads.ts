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
import { LitTable } from '../../../base-ui/table/lit-table';
import { LitProgressBar } from '../../../base-ui/progress-bar/LitProgressBar';
import '../../../base-ui/progress-bar/LitProgressBar';
import { getDataNo } from './utils/Utils';
import './TableNoData';
import { TableNoData } from './TableNoData';
import { TabCpuDetailsThreadsHtml } from './TabCpuDetailsThreads.html';

@element('tab-cpu-details-threads')
export class TabCpuDetailsThreads extends BaseElement {
  private tableNoData: TableNoData | null | undefined;
  private cpuDetailsThreadUsageTbl: LitTable | null | undefined;
  private progress: LitProgressBar | null | undefined;
  private cpuDetailsThreadPie: LitChartPie | null | undefined;
  private data: Array<unknown> = [];
  private cpuDetailsThreadSortColumn: string = '';
  private sortType: number = 0;

  initElements(): void {
    this.tableNoData = this.shadowRoot!.querySelector<TableNoData>('#table-no-data');
    this.progress = this.shadowRoot!.querySelector<LitProgressBar>('#loading');
    this.cpuDetailsThreadPie = this.shadowRoot!.querySelector<LitChartPie>('#cpu-thread-chart-pie');
    this.cpuDetailsThreadUsageTbl = this.shadowRoot!.querySelector<LitTable>('#tb-cpu-usage');

    this.shadowRoot!.querySelector<HTMLDivElement>('.cpu-thread-go-back')!.onclick = (e): void => {
      if (!this.progress!.loading) {
        this.parentNode!.querySelector<HTMLDivElement>('.d-box')!.style.display = 'flex';
        this.setShow = false;
      }
    };

    this.cpuDetailsThreadUsageTbl!.addEventListener('row-click', (evt: unknown): void => {
      // @ts-ignore
      let data = evt.detail.data;
      data.isSelected = true;
      // @ts-ignore
      if ((evt.detail as unknown).callBack) {
        // @ts-ignore
        (evt.detail as unknown).callBack(true);
      }
    });

    this.cpuDetailsThreadUsageTbl!.addEventListener('column-click', (evt: unknown): void => {
      //@ts-ignore
      this.cpuDetailsThreadSortColumn = evt.detail.key; //@ts-ignore
      this.sortType = evt.detail.sort;
      // @ts-ignore
      this.sortByColumn(evt.detail);
    });
    this.cpuDetailsThreadUsageTbl!.addEventListener('row-hover', (evt: unknown): void => {
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
      this.cpuDetailsThreadPie?.showHover();
    });
  }

  init(cpu: number, it: unknown): void {
    this.shadowRoot!.querySelector<HTMLDivElement>('.cpu-thread-subheading')!.textContent =
      //@ts-ignore
      `Threads in Freq ${it.value}`;
    this.progress!.loading = true;
    procedurePool.submitWithName(
      'logic0',
      'scheduling-CPU Frequency Thread', //@ts-ignore
      { cpu: cpu, freq: (it as unknown).value },
      undefined,
      (res: unknown): void => {
        this.progress!.loading = false;
        this.queryPieChartDataByType(res);
      }
    );
  }

  set setShow(v: boolean) {
    if (v) {
      this.style.display = 'flex';
    } else {
      this.clearData();
      this.style.display = 'none';
    }
  }

  queryPieChartDataByType(res: unknown): void {
    //@ts-ignore
    this.data = res || [];
    this.data = getDataNo(this.data);
    this.tableNoData!.noData = this.data.length === 0;
    this.noData(this.data.length === 0);
    this.cpuDetailsThreadPie!.config = {
      appendPadding: 0,
      data: this.data,
      angleField: 'dur',
      colorField: 'tName',
      radius: 1,
      label: {
        type: 'outer',
      },
      tip: (obj): string => {
        return `<div>
                                <div>t_name:${
          // @ts-ignore
          obj.obj.tName
          }</div> 
                                <div>tid:${
          // @ts-ignore
          obj.obj.tid
          }</div>
                                <div>p_name:${
          // @ts-ignore
          obj.obj.pName
          }</div>
                                <div>p_pid:${
          // @ts-ignore
          obj.obj.pid
          }</div>
                                <div>duration:${
          // @ts-ignore
          obj.obj.durStr
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
          this.cpuDetailsThreadUsageTbl!.setCurrentHover(data);
        } else {
          this.cpuDetailsThreadUsageTbl!.mouseOut();
        }
      },
      interactions: [
        {
          type: 'element-active',
        },
      ],
    };
    if (this.cpuDetailsThreadSortColumn !== '') {
      this.sortByColumn({ key: this.cpuDetailsThreadSortColumn, sort: this.sortType });
    } else {
      this.cpuDetailsThreadUsageTbl!.recycleDataSource = this.data;
    }
    this.cpuDetailsThreadUsageTbl?.reMeauseHeight();
  }

  noData(value: boolean): void {
    this.shadowRoot!.querySelector<HTMLDivElement>('.cpu-thread-chart-box')!.style.display = value ? 'none' : 'block';
    this.shadowRoot!.querySelector<HTMLDivElement>('.cpu-thread-table-box')!.style.width = value ? '100%' : '60%';
  }

  clearData(): void {
    this.cpuDetailsThreadPie!.dataSource = [];
    this.cpuDetailsThreadUsageTbl!.recycleDataSource = [];
    this.noData(false);
  }

  sortByColumn(detail: unknown): void {
    // @ts-ignore
    function compare(cpuDetailsThreadProperty, sort, type) {
      return function (a: unknown, b: unknown) {
        if (type === 'number') {
          // @ts-ignore
          return sort === 2
            // @ts-ignore
            ? parseFloat(b[cpuDetailsThreadProperty]) - parseFloat(a[cpuDetailsThreadProperty])
            // @ts-ignore
            : parseFloat(a[cpuDetailsThreadProperty]) - parseFloat(b[cpuDetailsThreadProperty]);
        } else {
          if (sort === 2) {
            // @ts-ignore
            return b[cpuDetailsThreadProperty].toString().localeCompare(a[cpuDetailsThreadProperty].toString());
          } else {
            // @ts-ignore
            return a[cpuDetailsThreadProperty].toString().localeCompare(b[cpuDetailsThreadProperty].toString());
          }
        }
      };
    }

    // @ts-ignore
    if (detail.key === 'durStr') {
      // @ts-ignore
      detail.key = 'dur';
      // @ts-ignore
      this.data.sort(compare(detail.key, detail.sort, 'number'));
    } else if (
      // @ts-ignore
      detail.key === 'value' ||
      // @ts-ignore
      detail.key === 'ratio' ||
      // @ts-ignore
      detail.key === 'index' ||
      // @ts-ignore
      detail.key === 'tid' ||
      // @ts-ignore
      detail.key === 'pid'
    ) {
      // @ts-ignore
      this.data.sort(compare(detail.key, detail.sort, 'number'));
    } else {
      // @ts-ignore
      this.data.sort(compare(detail.key, detail.sort, 'string'));
    }
    this.cpuDetailsThreadUsageTbl!.recycleDataSource = this.data;
  }

  initHtml(): string {
    return TabCpuDetailsThreadsHtml;
  }
}
