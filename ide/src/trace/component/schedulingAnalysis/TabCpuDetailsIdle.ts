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
import { pieChartColors } from '../../../base-ui/chart/pie/LitChartPieData';
import { TabCpuDetailsIdleHtml } from './TabCpuDetailsIdle.html';

@element('tab-cpu-details-idle')
export class TabCpuDetailsIdle extends BaseElement {
  private tableNoData: TableNoData | null | undefined;
  private cpuDetailsLdlUsageTbl: LitTable | null | undefined;
  private cpuDetailsLdlProgress: LitProgressBar | null | undefined;
  traceChange: boolean = false;
  private cpuDetailsLdlPie: LitChartPie | null | undefined;
  private cpuDetailsLdlData: Array<any> = [];
  private cpuDetailsLdlSortColumn: string = '';
  private sortType: number = 0;

  initElements(): void {
    this.tableNoData = this.shadowRoot!.querySelector<TableNoData>('#table-no-data');
    this.cpuDetailsLdlProgress = this.shadowRoot!.querySelector<LitProgressBar>('#loading');
    this.cpuDetailsLdlPie = this.shadowRoot!.querySelector<LitChartPie>('#cpu_idle_chart-pie');
    this.cpuDetailsLdlUsageTbl = this.shadowRoot!.querySelector<LitTable>('#idle-tb-cpu-usage');

    this.cpuDetailsLdlUsageTbl!.addEventListener('row-click', (evt: any) => {
      // @ts-ignore
      let data = evt.detail.data;
      data.isSelected = true;
      // @ts-ignore
      if ((evt.detail as any).callBack) {
        // @ts-ignore
        (evt.detail as any).callBack(true);
      }
    });

    this.cpuDetailsLdlUsageTbl!.addEventListener('column-click', (evt: any) => {
      this.cpuDetailsLdlSortColumn = evt.detail.key;
      this.sortType = evt.detail.sort;
      // @ts-ignore
      this.sortByColumn(evt.detail);
    });
    this.cpuDetailsLdlUsageTbl!.addEventListener('row-hover', (evt: any) => {
      if (evt.detail.data) {
        let data = evt.detail.data;
        data.isHover = true;
        if ((evt.detail as any).callBack) {
          (evt.detail as any).callBack(true);
        }
      }
      this.cpuDetailsLdlPie?.showHover();
    });
  }

  init(cpu: number) {
    this.queryPieChartDataByType('CPU Idle', cpu);
  }

  queryPieChartDataByType(type: string, cpu: number) {
    if (this.traceChange) {
      return;
    }
    this.cpuDetailsLdlProgress!.loading = true;
    this.queryLoginWorker(`scheduling-${type}`, 'query Cpu Frequency Analysis Time:', (res) => {
      this.traceChange = true;
      this.cpuDetailsLdlProgress!.loading = false;
      this.cpuDetailsLdlData = res.get(cpu) || [];
      this.cpuDetailsLdlData = getDataNo(this.cpuDetailsLdlData);
      this.tableNoData!.noData = this.cpuDetailsLdlData.length == 0;
      this.noData(this.cpuDetailsLdlData.length == 0);
      this.setLdlPieConfig(type);
      if (this.cpuDetailsLdlSortColumn != '') {
        this.sortByColumn({
          key: this.cpuDetailsLdlSortColumn,
          sort: this.sortType,
        });
      } else {
        this.cpuDetailsLdlUsageTbl!.recycleDataSource = this.cpuDetailsLdlData;
      }
      this.cpuDetailsLdlUsageTbl?.reMeauseHeight();
    });
  }

  private setLdlPieConfig(type: string): void {
    this.cpuDetailsLdlPie!.config = {
      appendPadding: 0,
      data: this.cpuDetailsLdlData,
      angleField: 'sum',
      colorField: 'value',
      radius: 1,
      label: {
        type: 'outer',
        color:
          type !== 'CPU Idle'
            ? undefined
            : (it) => {
              return pieChartColors[(it as any).value];
            },
      },
      hoverHandler: (data) => {
        if (data) {
          this.cpuDetailsLdlUsageTbl!.setCurrentHover(data);
        } else {
          this.cpuDetailsLdlUsageTbl!.mouseOut();
        }
      },
      tip: (idleObj) => {
        return `<div>
                                <div>idle:${idleObj.obj.value}</div> 
                                <div>min:${idleObj.obj.min}</div>
                                <div>max:${idleObj.obj.max}</div>
                                <div>average:${idleObj.obj.avg}</div>
                                <div>duration:${idleObj.obj.sumTimeStr}</div>
                                <div>ratio:${idleObj.obj.ratio}%</div>
                            </div>
                                `;
      },
      interactions: [
        {
          type: 'element-active',
        },
      ],
    };
  }

  noData(value: boolean) {
    this.shadowRoot!.querySelector<HTMLDivElement>('.idle-chart-box')!.style.display = value ? 'none' : 'block';
    this.shadowRoot!.querySelector<HTMLDivElement>('.cpu_idle_table-box')!.style.width = value ? '100%' : '60%';
  }

  clearData() {
    this.traceChange = false;
    this.cpuDetailsLdlPie!.dataSource = [];
    this.cpuDetailsLdlUsageTbl!.recycleDataSource = [];
    this.noData(false);
  }

  queryLoginWorker(idleType: string, log: string, handler: (res: any) => void) {
    let cpuDetailsldleTime = new Date().getTime();
    procedurePool.submitWithName(
      'logic0',
      idleType,
      {
        endTs: SpSchedulingAnalysis.endTs,
        total: SpSchedulingAnalysis.totalDur,
      },
      undefined,
      handler
    );
    let durTime = new Date().getTime() - cpuDetailsldleTime;
    info(log, durTime);
  }

  sortByColumn(detail: any) {
    // @ts-ignore
    function compare(cpuDetailsLdlProperty, sort, type) {
      return function (a: any, b: any) {
        if (type === 'number') {
          // @ts-ignore
          return sort === 2
            ? parseFloat(b[cpuDetailsLdlProperty]) - parseFloat(a[cpuDetailsLdlProperty])
            : parseFloat(a[cpuDetailsLdlProperty]) - parseFloat(b[cpuDetailsLdlProperty]);
        } else {
          if (sort === 2) {
            return b[cpuDetailsLdlProperty].toString().localeCompare(a[cpuDetailsLdlProperty].toString());
          } else {
            return a[cpuDetailsLdlProperty].toString().localeCompare(b[cpuDetailsLdlProperty].toString());
          }
        }
      };
    }

    if (detail.key === 'min') {
      detail.key = 'minValue';
      this.cpuDetailsLdlData.sort(compare(detail.key, detail.sort, 'number'));
    } else if (detail.key === 'max') {
      detail.key = 'maxValue';
      this.cpuDetailsLdlData.sort(compare(detail.key, detail.sort, 'number'));
    } else if (detail.key === 'avg') {
      detail.key = 'avgValue';
      this.cpuDetailsLdlData.sort(compare(detail.key, detail.sort, 'number'));
    } else if (detail.key === 'sumTimeStr') {
      detail.key = 'sum';
      this.cpuDetailsLdlData.sort(compare(detail.key, detail.sort, 'number'));
    } else if (detail.key === 'value' || detail.key === 'ratio' || detail.key === 'index') {
      this.cpuDetailsLdlData.sort(compare(detail.key, detail.sort, 'number'));
    } else {
      this.cpuDetailsLdlData.sort(compare(detail.key, detail.sort, 'string'));
    }
    this.cpuDetailsLdlUsageTbl!.recycleDataSource = this.cpuDetailsLdlData;
  }

  initHtml(): string {
    return TabCpuDetailsIdleHtml;
  }
}
