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
  private tableSmall: LitTable | null | undefined;
  private chartTotal: LitChartColumn | null | undefined;
  private chart2: LitChartColumn | null | undefined;
  private chart3: LitChartColumn | null | undefined;
  private chart4: LitChartColumn | null | undefined;
  private cpuSetting: CheckCpuSetting | undefined | null;
  private setting: HTMLDivElement | null | undefined;
  private progress: LitProgressBar | null | undefined;
  private nodata: TableNoData | null | undefined;
  private map: Map<string, { chart: LitChartColumn; table: LitTable }> | undefined;
  private data: Array<any> = [];
  private dataBig: Array<any> = [];
  private dataMid: Array<any> = [];
  private dataSmall: Array<any> = [];
  private sort: any = {
    total: { key: '', sort: 0 },
    small: { key: '', sort: 0 },
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
  private smallColumn = `
                <lit-table-column width="100px" title="small core" data-index="smallTimeStr" key="smallTimeStr" align="flex-start" order></lit-table-column>
                <lit-table-column width="100px" title="%" data-index="smallPercent" key="smallPercent" align="flex-start" order></lit-table-column>
        `;

  initElements(): void {
    this.nodata = this.shadowRoot!.querySelector<TableNoData>('#nodata');
    this.progress = this.shadowRoot!.querySelector<LitProgressBar>('#loading');
    this.table = this.shadowRoot!.querySelector<LitTable>('#tb-thread-usage');
    this.tableBig = this.shadowRoot!.querySelector<LitTable>('#tb-thread-big');
    this.tableMid = this.shadowRoot!.querySelector<LitTable>('#tb-thread-mid');
    this.tableSmall = this.shadowRoot!.querySelector<LitTable>('#tb-thread-small');
    this.chartTotal = this.shadowRoot!.querySelector<LitChartColumn>('#chart_total');
    this.chart2 = this.shadowRoot!.querySelector<LitChartColumn>('#chart_2');
    this.chart3 = this.shadowRoot!.querySelector<LitChartColumn>('#chart_3');
    this.chart4 = this.shadowRoot!.querySelector<LitChartColumn>('#chart_4');
    this.map = new Map<string, { chart: LitChartColumn; table: LitTable }>();
    this.map.set('total', { chart: this.chartTotal!, table: this.table! });
    this.map.set('small', { chart: this.chart2!, table: this.tableSmall! });
    this.map.set('mid', { chart: this.chart3!, table: this.tableMid! });
    this.map.set('big', { chart: this.chart4!, table: this.tableBig! });
    this.setting = this.shadowRoot!.querySelector<HTMLDivElement>('#setting');
    this.cpuSetting = this.shadowRoot!.querySelector<CheckCpuSetting>('#cpu_setting');
    this.cpuSetting!.cpuSetListener = () => {
      this.cpuSetting!.style.display = 'none';
      (this.shadowRoot!.querySelector('#total')! as any).style.display = 'grid';
      (this.shadowRoot!.querySelector('#small')! as any).style.display =
        CheckCpuSetting.small_cores.length > 0 ? 'grid' : 'none';
      (this.shadowRoot!.querySelector('#mid')! as any).style.display =
        CheckCpuSetting.mid_cores.length > 0 ? 'grid' : 'none';
      (this.shadowRoot!.querySelector('#big')! as any).style.display =
        CheckCpuSetting.big_cores.length > 0 ? 'grid' : 'none';
      this.queryData();
    };
    this.setting?.addEventListener('click', (event) => {
      for (let node of this.shadowRoot!.querySelectorAll('.content_grid')) {
        (node as any).style.display = 'none';
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
      tab!.addEventListener('row-click', (evt: any) => {
        let data = evt.detail.data;
        data.isSelected = true;
        // @ts-ignore
        if ((evt.detail as any).callBack) {
          // @ts-ignore
          (evt.detail as any).callBack(true);
        }
      });
      tab!.addEventListener('column-click', (evt: any) => {
        this.sort[key].key = evt.detail.key;
        this.sort[key].sort = evt.detail.sort;
        if (key == 'total') {
          this.sortByColumn(evt.detail, tab, this.data);
        } else if (key == 'small') {
          this.sortByColumn(evt.detail, tab, this.dataSmall);
        } else if (key == 'mid') {
          this.sortByColumn(evt.detail, tab, this.dataMid);
        } else if (key == 'big') {
          this.sortByColumn(evt.detail, tab, this.dataBig);
        }
      });
      tab!.addEventListener('row-hover', (evt: any) => {
        if (evt.detail.data) {
          let data = evt.detail.data;
          data.isHover = true;
          if ((evt.detail as any).callBack) {
            (evt.detail as any).callBack(true);
          }
          chart.showHoverColumn(data.no);
        }
      });
    }
  }

  sortByColumn(detail: any, table: LitTable | null | undefined, data: Array<any>) {
    // @ts-ignore
    function compare(threadCpuUsageProperty, sort, type) {
      return function (a: any, b: any) {
        if (type === 'number') {
          // @ts-ignore
          return sort === 2
            ? parseFloat(b[threadCpuUsageProperty]) - parseFloat(a[threadCpuUsageProperty])
            : parseFloat(a[threadCpuUsageProperty]) - parseFloat(b[threadCpuUsageProperty]);
        } else {
          if (sort === 2) {
            return b[threadCpuUsageProperty].toString().localeCompare(a[threadCpuUsageProperty].toString());
          } else {
            return a[threadCpuUsageProperty].toString().localeCompare(b[threadCpuUsageProperty].toString());
          }
        }
      };
    }

    let type = 'number';

    if (detail.key === 'bigTimeStr') {
      detail.key = 'big';
    } else if (detail.key === 'midTimeStr') {
      detail.key = 'mid';
    } else if (detail.key === 'smallTimeStr') {
      detail.key = 'small';
    } else if (
      detail.key === 'bigPercent' ||
      detail.key === 'ratio' ||
      detail.key === 'tid' ||
      detail.key === 'pid' ||
      detail.key === 'midPercent' ||
      detail.key.includes('cpu')
    ) {
    } else {
      type = 'string';
    }
    data.sort(compare(detail.key, detail.sort, type));
    table!.recycleDataSource = data;
  }

  init() {
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
        (node as any).style.display = 'none';
      }
      this.cpuSetting!.style.display = 'inline';
      this.cpuSetting?.init();
    } else {
      this.queryData();
    }
  }

  clearData() {
    this.traceChange = true;
    for (let key of this.map!.keys()) {
      this.map!.get(key)!.chart.dataSource = [];
      this.map!.get(key)!.table.recycleDataSource = [];
    }
  }

  queryData(): void {
    this.progress!.loading = true;
    this.queryLogicWorker(`scheduling-Thread CpuUsage`, `query Thread Cpu Usage Analysis Time:`, (res) => {
      this.nodata!.noData = res.keys().length === 0;
      for (let key of this.map!.keys()) {
        let obj = this.map!.get(key)!;
        let source: any[] = res.get(key) || [];
        source = source.map((it: any, index: number) => {
          let data: any = {
            pid: it.pid,
            pName: it.pName,
            tid: it.tid,
            tName: it.tName,
            total: it.total,
            big: it.big,
            mid: it.mid,
            small: it.small,
            no: index + 1,
            visible: 1,
            bigPercent: it.bigPercent,
            midPercent: it.midPercent,
            smallPercent: it.smallPercent,
            bigTimeStr: it.bigTimeStr,
            midTimeStr: it.midTimeStr,
            smallTimeStr: it.smallTimeStr,
            hideHandler: () => {
              let arr = source.filter((o) => o.visible === 1);
              obj.chart.dataSource = this.getArrayDataBySize(key, arr);
            },
          };
          for (let i = 0; i < SpSchedulingAnalysis.cpuCount; i++) {
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

  private assignmentData(key: string, source: any[], obj: { chart: LitChartColumn; table: LitTable }): void {
    if (key == 'total') {
      this.data = source;
    } else if (key == 'small') {
      this.dataSmall = source;
    } else if (key == 'mid') {
      this.dataMid = source;
    } else if (key == 'big') {
      this.dataBig = source;
    }
    if (this.sort[key].key != '') {
      this.sortByColumn(this.sort[key], obj.table, source);
    } else {
      obj.table.recycleDataSource = source;
    }
  }

  private setChartConfig(obj: { chart: LitChartColumn; table: LitTable }, key: string, source: any[]): void {
    obj.chart.config = {
      data: this.getArrayDataBySize(key, source),
      appendPadding: 10,
      xField: 'tid',
      yField: 'total',
      seriesField: key === 'total' ? 'size' : '',
      color: (a) => {
        if (a.size === 'big core') {
          return '#2f72f8';
        } else if (a.size === 'middle core') {
          return '#ffab67';
        } else if (a.size === 'small core') {
          return '#a285d2';
        } else {
          return '#0a59f7';
        }
      },
      hoverHandler: (no) => {
        this.setHover(source, no, obj);
      },
      tip: (a) => {
        if (a && a[0]) {
          let tip = '';
          let total = 0;
          for (let obj of a) {
            total += obj.obj.total;
            tip = `${tip}
                                <div style="display:flex;flex-direction: row;align-items: center;">
                                    <div style="width: 10px;height: 5px;background-color: ${
                                      obj.color
                                    };margin-right: 5px"></div>
                                    <div>${obj.type || key}:${obj.obj.timeStr}</div>
                                </div>
                            `;
          }
          tip = `<div>
                                        <div>tid:${a[0].obj.tid}</div>
                                        ${tip}
                                        ${a.length > 1 ? `<div>total:${getProbablyTime(total)}</div>` : ''}
                                    </div>`;
          return tip;
        } else {
          return '';
        }
      },
      label: null,
    };
  }

  private setHover(source: any[], no: number, obj: { chart: LitChartColumn; table: LitTable }): void {
    let data = source.find((it) => it.no === no);
    if (data) {
      data.isHover = true;
      obj.table!.setCurrentHover(data);
    } else {
      obj.table!.mouseOut();
    }
  }

  getArrayDataBySize(type: string, arr: Array<any>) {
    let data: any[] = [];
    for (let obj of arr) {
      if (type === 'total') {
        data.push({
          pid: obj.pid,
          pName: obj.pName,
          tid: obj.tid,
          tName: obj.tName,
          total: obj.big,
          size: 'big core',
          no: obj.no,
          timeStr: obj.bigTimeStr,
        });
        data.push({
          pid: obj.pid,
          pName: obj.pName,
          tid: obj.tid,
          tName: obj.tName,
          total: obj.mid,
          size: 'middle core',
          no: obj.no,
          timeStr: obj.midTimeStr,
        });
        data.push({
          pid: obj.pid,
          pName: obj.pName,
          tid: obj.tid,
          tName: obj.tName,
          total: obj.small,
          size: 'small core',
          no: obj.no,
          timeStr: obj.smallTimeStr,
        });
      } else {
        data.push({
          pid: obj.pid,
          pName: obj.pName,
          tid: obj.tid,
          tName: obj.tName,
          total: obj[type],
          no: obj.no,
          timeStr: obj[`${type}TimeStr`],
        });
      }
    }
    return data;
  }

  queryLogicWorker(option: string, log: string, handler: (res: any) => void) {
    let time = new Date().getTime();
    procedurePool.submitWithName(
      'logic0',
      option,
      {
        bigCores: CheckCpuSetting.big_cores,
        midCores: CheckCpuSetting.mid_cores,
        smallCores: CheckCpuSetting.small_cores,
      },
      undefined,
      handler
    );
    let durTime = new Date().getTime() - time;
    info(log, durTime);
  }

  getTableColumns(type: string) {
    if (type === 'total') {
      return `${this.publicColumns}${this.bigColumn}${this.midColumn}${this.smallColumn}`;
    } else if (type === 'big') {
      return `${this.publicColumns}${this.bigColumn}`;
    } else if (type === 'mid') {
      return `${this.publicColumns}${this.midColumn}`;
    } else if (type === 'small') {
      return `${this.publicColumns}${this.smallColumn}`;
    } else {
      return '';
    }
  }

  initHtml(): string {
    return Top20ThreadCpuUsageHtml;
  }
}
