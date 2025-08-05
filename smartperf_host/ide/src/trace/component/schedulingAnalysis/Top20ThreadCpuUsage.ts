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
import { LitChartColumn } from '../../../base-ui/chart/column/LitChartColumn';
import '../../../base-ui/chart/column/LitChartColumn';
import './CheckCpuSetting';
import '../../../base-ui/icon/LitIcon';
import { CheckCpuSetting } from './CheckCpuSetting';
import { procedurePool } from '../../database/Procedure';
import { info } from '../../../log/Log';
import '../../../base-ui/progress-bar/LitProgressBar';
import { LitProgressBar } from '../../../base-ui/progress-bar/LitProgressBar';
import './TableNoData';
import { TableNoData } from './TableNoData';
import { getProbablyTime } from '../../database/logic-worker/ProcedureLogicWorkerCommon';
import { SpSchedulingAnalysis } from './SpSchedulingAnalysis';
import { Top20ThreadCpuUsageHtml } from './Top20ThreadCpuUsage.html';

@element('top20-thread-cpu-usage')
export class Top20ThreadCpuUsage extends BaseElement {
  traceChange: boolean = false;
  private table: LitTable | null | undefined;
  private tableBig: LitTable | null | undefined;
  private tableMid: LitTable | null | undefined;
  private tableLittle: LitTable | null | undefined;
  private chartTotal: LitChartColumn | null | undefined;
  private chart2: LitChartColumn | null | undefined;
  private chart3: LitChartColumn | null | undefined;
  private chart4: LitChartColumn | null | undefined;
  private cpuSetting: CheckCpuSetting | undefined | null;
  private setting: HTMLDivElement | null | undefined;
  private progress: LitProgressBar | null | undefined;
  private nodata: TableNoData | null | undefined;
  private map: Map<string, { chart: LitChartColumn; table: LitTable }> | undefined;
  private data: Array<unknown> = [];
  private dataBig: Array<unknown> = [];
  private dataMid: Array<unknown> = [];
  private dataLittle: Array<unknown> = [];
  private sort: unknown = {
    total: { key: '', sort: 0 },
    little: { key: '', sort: 0 },
    mid: { key: '', sort: 0 },
    big: { key: '', sort: 0 },
  };

  private publicColumns = `
                <lit-table-column width="50px" title=" " data-index="no" key="no" align="flex-start"></lit-table-column>
                <lit-table-column width="50px" title="" data-index="visible" key="visible" align="flex-start">
                    <template>
                        <lit-icon name="{{ visible === 1 ? 'eye':'eye-close' }}" onclick="{
                            let data = this.parentElement.parentElement.data;
                            data.visible = data.visible === 1 ? 0 : 1
                            this.name = data.visible === 1 ? 'eye':'eye-close'
                            data.hideHandler()
                        }" size="20"></lit-icon>
                    </template>
                </lit-table-column>
                <lit-table-column width="100px" title="tid" data-index="tid" key="tid" align="flex-start" order></lit-table-column>
                <lit-table-column width="200px" title="t_name" data-index="tName" key="tName" align="flex-start" order></lit-table-column>
                <lit-table-column width="100px" title="pid" data-index="pid" key="pid" align="flex-start" order></lit-table-column>
                <lit-table-column width="200px" title="p_name" data-index="pName" key="pName" align="flex-start" order></lit-table-column>
        `;
  private bigColumn = `
                <lit-table-column width="100px" title="big core" data-index="bigTimeStr" key="bigTimeStr" align="flex-start" order></lit-table-column>
                <lit-table-column width="100px" title="%" data-index="bigPercent" key="bigPercent" align="flex-start" order></lit-table-column>
        `;
  private midColumn = `
                <lit-table-column width="100px" title="middle core" data-index="midTimeStr" key="midTimeStr" align="flex-start" order></lit-table-column>
                <lit-table-column width="100px" title="%" data-index="midPercent" key="midPercent" align="flex-start" order></lit-table-column>
        `;
  private littleColumn = `
                <lit-table-column width="100px" title="little core" data-index="littleTimeStr" key="littleTimeStr" align="flex-start" order></lit-table-column>
                <lit-table-column width="100px" title="%" data-index="littlePercent" key="littlePercent" align="flex-start" order></lit-table-column>
        `;

  initElements(): void {
    this.nodata = this.shadowRoot!.querySelector<TableNoData>('#nodata');
    this.progress = this.shadowRoot!.querySelector<LitProgressBar>('#loading');
    this.table = this.shadowRoot!.querySelector<LitTable>('#tb-thread-usage');
    this.tableBig = this.shadowRoot!.querySelector<LitTable>('#tb-thread-big');
    this.tableMid = this.shadowRoot!.querySelector<LitTable>('#tb-thread-mid');
    this.tableLittle = this.shadowRoot!.querySelector<LitTable>('#tb-thread-little');
    this.chartTotal = this.shadowRoot!.querySelector<LitChartColumn>('#chart_total');
    this.chart2 = this.shadowRoot!.querySelector<LitChartColumn>('#chart_2');
    this.chart3 = this.shadowRoot!.querySelector<LitChartColumn>('#chart_3');
    this.chart4 = this.shadowRoot!.querySelector<LitChartColumn>('#chart_4');
    this.map = new Map<string, { chart: LitChartColumn; table: LitTable }>();
    this.map.set('total', { chart: this.chartTotal!, table: this.table! });
    this.map.set('little', { chart: this.chart2!, table: this.tableLittle! });
    this.map.set('mid', { chart: this.chart3!, table: this.tableMid! });
    this.map.set('big', { chart: this.chart4!, table: this.tableBig! });
    this.setting = this.shadowRoot!.querySelector<HTMLDivElement>('#setting');
    this.cpuSetting = this.shadowRoot!.querySelector<CheckCpuSetting>('#cpu_setting');
    this.cpuSetting!.cpuSetListener = (): void => {
      this.cpuSetting!.style.display = 'none';
      //@ts-ignore
      (this.shadowRoot!.querySelector('#total')! as unknown).style.display = 'grid';
      //@ts-ignore
      (this.shadowRoot!.querySelector('#little')! as unknown).style.display =
        CheckCpuSetting.little_cores.length > 0 ? 'grid' : 'none';
      //@ts-ignore
      (this.shadowRoot!.querySelector('#mid')! as unknown).style.display =
        CheckCpuSetting.mid_cores.length > 0 ? 'grid' : 'none';
      //@ts-ignore
      (this.shadowRoot!.querySelector('#big')! as unknown).style.display =
        CheckCpuSetting.big_cores.length > 0 ? 'grid' : 'none';
      this.queryData();
    };
    this.setting?.addEventListener('click', (): void => {
      for (let node of this.shadowRoot!.querySelectorAll('.content_grid')) {
        //@ts-ignore
        (node as unknown).style.display = 'none';
      }
      this.cpuSetting!.style.display = 'inline';
      this.cpuSetting?.init();
    });
    this.tabListener();
  }

  private tabListener(): void {
    for (let key of this.map!.keys()) {
      let tab = this.map!.get(key)!.table;
      let chart = this.map!.get(key)!.chart;
      tab!.addEventListener('row-click', (evt: unknown): void => {
        //@ts-ignore
        let data = evt.detail.data;
        data.isSelected = true;
        // @ts-ignore
        if ((evt.detail as unknown).callBack) {
          // @ts-ignore
          (evt.detail as unknown).callBack(true);
        }
      });
      tab!.addEventListener('column-click', (evt: unknown): void => {
        //@ts-ignore
        this.sort[key].key = evt.detail.key;
        //@ts-ignore
        this.sort[key].sort = evt.detail.sort;
        if (key === 'total') {
          //@ts-ignore
          this.sortByColumn(evt.detail, tab, this.data);
        } else if (key === 'little') {
          //@ts-ignore
          this.sortByColumn(evt.detail, tab, this.dataLittle);
        } else if (key === 'mid') {
          //@ts-ignore
          this.sortByColumn(evt.detail, tab, this.dataMid);
        } else if (key === 'big') {
          //@ts-ignore
          this.sortByColumn(evt.detail, tab, this.dataBig);
        }
      });
      tab!.addEventListener('row-hover', (evt: unknown): void => {
        //@ts-ignore
        if (evt.detail.data) {
          //@ts-ignore
          let data = evt.detail.data;
          data.isHover = true;
          //@ts-ignore
          if ((evt.detail as unknown).callBack) {
            //@ts-ignore
            (evt.detail as unknown).callBack(true);
          }
          chart.showHoverColumn(data.no);
        }
      });
    }
  }

  sortByColumn(detail: unknown, table: LitTable | null | undefined, data: Array<unknown>): void {
    // @ts-ignore
    function compare(threadCpuUsageProperty, sort, type) {
      return function (a: unknown, b: unknown) {
        if (type === 'number') {
          return sort === 2
            ? // @ts-ignore
              parseFloat(b[threadCpuUsageProperty]) - parseFloat(a[threadCpuUsageProperty])
            : //@ts-ignore
              parseFloat(a[threadCpuUsageProperty]) - parseFloat(b[threadCpuUsageProperty]);
        } else {
          if (sort === 2) {
            //@ts-ignore
            return b[threadCpuUsageProperty].toString().localeCompare(a[threadCpuUsageProperty].toString());
          } else {
            //@ts-ignore
            return a[threadCpuUsageProperty].toString().localeCompare(b[threadCpuUsageProperty].toString());
          }
        }
      };
    }

    let type = 'number';
    //@ts-ignore
    let key = detail.key;

    if (key === 'bigTimeStr') {
      key = 'big';
    } else if (key === 'midTimeStr') {
      key = 'mid';
    } else if (key === 'littleTimeStr') {
      key = 'little';
    } else if (
      key === 'bigPercent' ||
      key === 'ratio' ||
      key === 'tid' ||
      key === 'pid' ||
      key === 'midPercent' ||
      key.includes('cpu')
    ) {
    } else {
      type = 'string';
    }
    //@ts-ignore
    data.sort(compare(key, detail.sort, type));
    table!.recycleDataSource = data;
  }

  init(): void {
    if (!this.traceChange) {
      for (let key of this.map!.keys()) {
        this.map!.get(key)!.table.reMeauseHeight();
      }
      return;
    }
    this.traceChange = false;
    for (let key of this.map!.keys()) {
      let table = this.map!.get(key)!.table;
      table.innerHTML = '';
      let columns = this.getTableColumns(key);
      for (let i = 0; i < SpSchedulingAnalysis.cpuCount; i++) {
        columns = `
                ${columns}
                <lit-table-column width="120px" title="cpu${i}(us)" data-index="cpu${i}" key="cpu${i}" align="flex-start" order></lit-table-column>
            `;
      }
      table.innerHTML = columns;
    }

    if (!CheckCpuSetting.init_setting) {
      for (let node of this.shadowRoot!.querySelectorAll('.content_grid')) {
        //@ts-ignore
        (node as unknown).style.display = 'none';
      }
      this.cpuSetting!.style.display = 'inline';
      this.cpuSetting?.init();
    } else {
      this.queryData();
    }
  }

  clearData(): void {
    this.traceChange = true;
    for (let key of this.map!.keys()) {
      this.map!.get(key)!.chart.dataSource = [];
      this.map!.get(key)!.table.recycleDataSource = [];
    }
  }

  queryData(): void {
    this.progress!.loading = true;
    this.queryLogicWorker('scheduling-Thread CpuUsage', 'query Thread Cpu Usage Analysis Time:', (res): void => {
      //@ts-ignore
      this.nodata!.noData = res.keys().length === 0;
      for (let key of this.map!.keys()) {
        let obj = this.map!.get(key)!;
        //@ts-ignore
        let source: unknown[] = res.get(key) || [];
        source = source.map((it: unknown, index: number) => {
          let data: unknown = {
            //@ts-ignore
            pid: it.pid,
            //@ts-ignore
            pName: it.pName,
            //@ts-ignore
            tid: it.tid,
            //@ts-ignore
            tName: it.tName,
            //@ts-ignore
            total: it.total,
            //@ts-ignore
            big: it.big,
            //@ts-ignore
            mid: it.mid,
            //@ts-ignore
            little: it.little,
            no: index + 1,
            visible: 1,
            //@ts-ignore
            bigPercent: it.bigPercent,
            //@ts-ignore
            midPercent: it.midPercent,
            //@ts-ignore
            littlePercent: it.littlePercent,
            //@ts-ignore
            bigTimeStr: it.bigTimeStr,
            //@ts-ignore
            midTimeStr: it.midTimeStr,
            //@ts-ignore
            littleTimeStr: it.littleTimeStr,
            hideHandler: (): void => {
              //@ts-ignore
              let arr = source.filter((o) => o.visible === 1);
              obj.chart.dataSource = this.getArrayDataBySize(key, arr);
            },
          };
          for (let i = 0; i < SpSchedulingAnalysis.cpuCount; i++) {
            //@ts-ignore
            data[`cpu${i}`] = (it[`cpu${i}`] || 0) / 1000;
          }
          return data;
        });
        this.setChartConfig(obj, key, source);
        this.assignmentData(key, source, obj);
      }
      this.progress!.loading = false;
    });
  }

  private assignmentData(key: string, source: unknown[], obj: { chart: LitChartColumn; table: LitTable }): void {
    if (key === 'total') {
      this.data = source;
    } else if (key === 'little') {
      this.dataLittle = source;
    } else if (key === 'mid') {
      this.dataMid = source;
    } else if (key === 'big') {
      this.dataBig = source;
    }
    //@ts-ignore
    if (this.sort[key].key !== '') {
      //@ts-ignore
      this.sortByColumn(this.sort[key], obj.table, source);
    } else {
      obj.table.recycleDataSource = source;
    }
  }

  private setChartConfig(obj: { chart: LitChartColumn; table: LitTable }, key: string, source: unknown[]): void {
    obj.chart.config = {
      data: this.getArrayDataBySize(key, source),
      appendPadding: 10,
      xField: 'tid',
      yField: 'total',
      seriesField: key === 'total' ? 'size' : '',
      color: (a): string => {
        //@ts-ignore
        if (a.size === 'big core') {
          return '#2f72f8'; //@ts-ignore
        } else if (a.size === 'middle core') {
          return '#ffab67'; //@ts-ignore
        } else if (a.size === 'little core') {
          return '#a285d2';
        } else {
          return '#0a59f7';
        }
      },
      hoverHandler: (no): void => {
        this.setHover(source, no, obj);
      },
      tip: (a): string => {
        //@ts-ignore
        if (a && a[0]) {
          let tip = '';
          let total = 0; //@ts-ignore
          for (let obj of a) {
            total += obj.obj.total;
            tip = `${tip}
                                <div style="display:flex;flex-direction: row;align-items: center;">
                                    <div style="width: 10px;height: 5px;background-color: ${obj.color};
                                    margin-right: 5px"></div>
                                    <div>${obj.type || key}:${obj.obj.timeStr}</div>
                                </div>
                            `;
          }
          tip = `<div>
                                        <div>tid:${
                                          //@ts-ignore
                                          a[0].obj.tid
                                        }</div>
                                        ${tip}
                                        ${
                                          //@ts-ignore
                                          a.length > 1 ? `<div>total:${getProbablyTime(total)}</div>` : ''
                                        }
                                    </div>`;
          return tip;
        } else {
          return '';
        }
      },
      label: null,
    };
  }

  private setHover(source: unknown[], no: number, obj: { chart: LitChartColumn; table: LitTable }): void {
    //@ts-ignore
    let data = source.find((it) => it.no === no);
    if (data) {
      //@ts-ignore
      data.isHover = true;
      obj.table!.setCurrentHover(data);
    } else {
      obj.table!.mouseOut();
    }
  }

  getArrayDataBySize(type: string, arr: Array<unknown>): unknown[] {
    let data: unknown[] = [];
    for (let obj of arr) {
      if (type === 'total') {
        data.push({
          //@ts-ignore
          pid: obj.pid, //@ts-ignore
          pName: obj.pName, //@ts-ignore
          tid: obj.tid, //@ts-ignore
          tName: obj.tName, //@ts-ignore
          total: obj.big,
          size: 'big core', //@ts-ignore
          no: obj.no, //@ts-ignore
          timeStr: obj.bigTimeStr,
        });
        data.push({
          //@ts-ignore
          pid: obj.pid, //@ts-ignore
          pName: obj.pName, //@ts-ignore
          tid: obj.tid, //@ts-ignore
          tName: obj.tName, //@ts-ignore
          total: obj.mid,
          size: 'middle core', //@ts-ignore
          no: obj.no, //@ts-ignore
          timeStr: obj.midTimeStr,
        });
        data.push({
          //@ts-ignore
          pid: obj.pid, //@ts-ignore
          pName: obj.pName, //@ts-ignore
          tid: obj.tid, //@ts-ignore
          tName: obj.tName, //@ts-ignore
          total: obj.little,
          size: 'little core', //@ts-ignore
          no: obj.no, //@ts-ignore
          timeStr: obj.littleTimeStr,
        });
      } else {
        data.push({
          //@ts-ignore
          pid: obj.pid, //@ts-ignore
          pName: obj.pName, //@ts-ignore
          tid: obj.tid, //@ts-ignore
          tName: obj.tName, //@ts-ignore
          total: obj[type], //@ts-ignore
          no: obj.no, //@ts-ignore
          timeStr: obj[`${type}TimeStr`],
        });
      }
    }
    return data;
  }

  queryLogicWorker(option: string, log: string, handler: (res: unknown) => void): void {
    let time = new Date().getTime();
    procedurePool.submitWithName(
      'logic0',
      option,
      {
        bigCores: CheckCpuSetting.big_cores,
        midCores: CheckCpuSetting.mid_cores,
        littleCores: CheckCpuSetting.little_cores,
      },
      undefined,
      handler
    );
    let durTime = new Date().getTime() - time;
    info(log, durTime);
  }

  getTableColumns(type: string): string {
    if (type === 'total') {
      return `${this.publicColumns}${this.bigColumn}${this.midColumn}${this.littleColumn}`;
    } else if (type === 'big') {
      return `${this.publicColumns}${this.bigColumn}`;
    } else if (type === 'mid') {
      return `${this.publicColumns}${this.midColumn}`;
    } else if (type === 'little') {
      return `${this.publicColumns}${this.littleColumn}`;
    } else {
      return '';
    }
  }

  initHtml(): string {
    return Top20ThreadCpuUsageHtml;
  }
}
