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
import { type LitChartPie } from '../../../../../base-ui/chart/pie/LitChartPie';
import { type LitProgressBar } from '../../../../../base-ui/progress-bar/LitProgressBar';
import { type LitTable } from '../../../../../base-ui/table/lit-table';
import { SelectionParam } from '../../../../bean/BoxSelection';
import { type JsCpuProfilerChartFrame, JsCpuProfilerStatisticsStruct } from '../../../../bean/JsStruct';
import { procedurePool } from '../../../../database/Procedure';
import { type SampleType } from '../../../../database/logic-worker/ProcedureLogicWorkerJsCpuProfiler';
import { ns2s } from '../../../../database/ui-worker/ProcedureWorkerCommon';
import { resizeObserver } from '../SheetUtils';
import { TabPaneJsCpuStatisticsHtml } from './TabPaneJsCpuStatistics.html';

@element('tabpane-js-cpu-statistics')
export class TabPaneJsCpuStatistics extends BaseElement {
  private progress: LitProgressBar | null | undefined;
  private statisticsTable: LitTable | null | undefined;
  private statisticsSource: Array<JsCpuProfilerStatisticsStruct> = [];
  private tabTitle: HTMLDivElement | undefined | null;
  private sortKey = 'timeStr';
  private sortType = 2;
  private statisticsPie: LitChartPie | null | undefined;
  private currentSelection: SelectionParam | undefined;

  set data(data: SelectionParam | Array<JsCpuProfilerChartFrame>) {
    if (data instanceof SelectionParam) {
      if (data === this.currentSelection) {
        return;
      }
      this.currentSelection = data;
    }

    this.init();
    this.clearData();
    this.progress!.loading = true;

    this.getDataByWorker(data, (results: Map<SampleType, number>) => {
      this.progress!.loading = false;
      this.statisticsSource = results.size > 0 ? this.setStatisticsData(results) : [];
      this.queryPieChartDataByType(this.statisticsSource || []);
    });
  }

  private init(): void {
    const thTable = this.tabTitle!.querySelector('.th');
    const jsCpuStatTblNodes = thTable!.querySelectorAll('div');
    if (this.tabTitle!.hasAttribute('sort')) {
      this.tabTitle!.removeAttribute('sort');
      jsCpuStatTblNodes.forEach((item) => {
        item.querySelectorAll('svg').forEach((svg) => {
          svg.style.display = 'none';
        });
      });
    }
    this.sortKey = 'timeStr';
    this.sortType = 2;
  }

  private getDataByWorker(data: SelectionParam | Array<JsCpuProfilerChartFrame>, handler: Function): void {
    let params;
    if (data instanceof SelectionParam) {
      params = {
        data: data.jsCpuProfilerData,
        leftNs: data.leftNs,
        rightNs: data.rightNs,
      };
    } else {
      params = {
        data: data,
      };
    }
    procedurePool.submitWithName(
      'logic0',
      'jsCpuProfiler-statistics',
      params,
      undefined,
      (results: Map<SampleType, number>) => {
        handler(results);
      }
    );
  }

  private queryPieChartDataByType(res: Array<JsCpuProfilerStatisticsStruct>): void {
    this.statisticsPie!.config = {
      appendPadding: 0,
      data: res,
      angleField: 'time',
      colorField: 'type',
      radius: 1,
      label: {
        type: 'outer',
      },
      tip: (obj): string => {
        return `<div>
                    <div>type: ${
                      // @ts-ignore
                      obj.obj.type
                    }</div>
                    <div>total: ${
                      // @ts-ignore
                      ns2s(obj.obj.time)
                    } (${
          // @ts-ignore
          obj.obj.percentage
        }%)</div>
                </div> `;
      },
      hoverHandler: (data): void => {
        if (data) {
          this.statisticsTable!.setCurrentHover(data);
        } else {
          this.statisticsTable!.mouseOut();
        }
      },
      interactions: [
        {
          type: 'element-active',
        },
      ],
    };
    this.statisticsTable!.addEventListener('row-hover', (statisticsRowHover: unknown) => {
      // @ts-ignore
      if (statisticsRowHover.detail.data) {
        // @ts-ignore
        let data = statisticsRowHover.detail.data; // @ts-ignore
        data.isHover = true; // @ts-ignore
        if ((statisticsRowHover.detail as unknown).callBack) {
          // @ts-ignore
          (statisticsRowHover.detail as unknown).callBack(true);
        }
      }
      this.statisticsPie?.showHover();
      this.statisticsPie?.hideTip();
    });

    if (this.statisticsSource.length > 0) {
      this.sortByColumn({ key: this.sortKey, sort: this.sortType });
      let total = this.totalData(this.statisticsSource);
      this.statisticsSource.unshift(total);
      this.statisticsTable!.recycleDataSource = this.statisticsSource;
      this.statisticsSource.shift();
    }
    this.statisticsTable?.reMeauseHeight();
  }

  private totalData(source: Array<JsCpuProfilerStatisticsStruct>): JsCpuProfilerStatisticsStruct {
    // 计算总的time作为表格的第一行显示
    let totalTime = 0;
    for (let item of source) {
      totalTime += item.time;
    }
    return this.toStatisticsStruct('', totalTime, totalTime);
  }

  private clearData(): void {
    this.statisticsPie!.dataSource = [];
    this.statisticsTable!.recycleDataSource = [];
  }

  private setStatisticsData(results: Map<SampleType, number>): Array<JsCpuProfilerStatisticsStruct> {
    this.statisticsTable!.recycleDataSource = [];
    this.statisticsSource = [];
    let statisticsData: JsCpuProfilerStatisticsStruct;
    const totalTime = [...results.values()].reduce((prev, curr) => prev + curr);
    for (let [key, value] of results.entries()) {
      statisticsData = this.toStatisticsStruct(key, value, totalTime);
      this.statisticsSource.push(statisticsData);
    }
    return this.statisticsSource.sort((a, b) => b.time - a.time);
  }

  private toStatisticsStruct(
    type: string | SampleType,
    time: number,
    percentage: number
  ): JsCpuProfilerStatisticsStruct {
    return new JsCpuProfilerStatisticsStruct(type, time, ns2s(time), ((time / percentage || 0) * 100).toFixed(1));
  }

  private sortByColumn(detail: unknown): void {
    // @ts-ignore
    function compare(key, sort, type) {
      return function (a: unknown, b: unknown) {
        // 不管哪一列的排序方式是0（默认排序），都按照time列从大到小排序
        if (sort === 0) {
          sort = 2;
          key = 'time';
          type = 'number';
        }
        if (type === 'number') {
          // @ts-ignore
          return sort === 2 ? parseFloat(b[key]) - parseFloat(a[key]) : parseFloat(a[key]) - parseFloat(b[key]);
        } else {
          if (sort === 2) {
            // @ts-ignore
            return b[key].toString().localeCompare(a[key].toString());
          } else {
            // @ts-ignore
            return a[key].toString().localeCompare(b[key].toString());
          }
        }
      };
    } // @ts-ignore
    if (detail.key === 'timeStr' || detail.key === 'percentage') {
      // @ts-ignore
      this.statisticsSource.sort(compare('time', detail.sort, 'number')); // @ts-ignore
    } else if (detail.key === 'type') {
      // @ts-ignore
      this.statisticsSource.sort(compare(detail.key, detail.sort, 'string'));
    }
    if (this.statisticsSource.length > 0) {
      let total = this.totalData(this.statisticsSource);
      this.statisticsSource.unshift(total);
      this.statisticsTable!.recycleDataSource = this.statisticsSource;
      this.statisticsSource.shift();
    }
  }

  public connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.statisticsTable!);
  }

  public initElements(): void {
    this.progress = this.shadowRoot!.querySelector<LitProgressBar>('#loading');
    this.statisticsTable = this.shadowRoot?.querySelector('#statistics-table') as LitTable;
    this.statisticsPie = this.shadowRoot?.querySelector('#chart-pie') as LitChartPie;
    this.tabTitle = this.statisticsTable!.shadowRoot?.querySelector('.thead') as HTMLDivElement;

    this.statisticsTable!.addEventListener('column-click', (evt: unknown) => {
      // @ts-ignore
      this.sortKey = evt.detail.key; // @ts-ignore
      this.sortType = evt.detail.sort;
      // @ts-ignore
      this.sortByColumn(evt.detail);
    });
  }

  public initHtml(): string {
    return TabPaneJsCpuStatisticsHtml;
  }
}
