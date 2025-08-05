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

import { BaseElement, element } from '../../../../base-ui/BaseElement';
import { LitTable } from '../../../../base-ui/table/lit-table';
import { procedurePool } from '../../../database/Procedure';
import { info } from '../../../../log/Log';
import { TableNoData } from '../TableNoData';
import '../TableNoData';
import { LitProgressBar } from '../../../../base-ui/progress-bar/LitProgressBar';
import '../../../../base-ui/progress-bar/LitProgressBar';
import { LitChartColumn } from '../../../../base-ui/chart/column/LitChartColumn';
import '../../../../base-ui/chart/column/LitChartColumn';
import { Utils } from '../../trace/base/Utils';

@element('top10-longest-runtime-process')
export class Top10LongestRunTimeProcess extends BaseElement {
  traceChange: boolean = false;
  private processRunTimeTbl: LitTable | null | undefined;
  private threadRunTimeTbl: LitTable | null | undefined;
  private processRunTimeProgress: LitProgressBar | null | undefined;
  private nodataPro: TableNoData | null | undefined;
  private processRunTimeData: Array<Top10RunTimeData> = [];
  private threadRunTimeData: Array<Top10RunTimeData> = [];
  private processSwitchCountChart: LitChartColumn | null | undefined;
  private threadSwitchCountChart: LitChartColumn | null | undefined;
  private nodataThr: TableNoData | null | undefined;
  private display_pro: HTMLDivElement | null | undefined;
  private display_thr: HTMLDivElement | null | undefined;
  private processId: number | undefined;
  private display_flag: boolean = true;
  private back: HTMLDivElement | null | undefined;
  private processMap: Map<number, string> = new Map();
  private threadMap: Map<number, string> = new Map();

  /**
   * 初始化操作，若trace发生改变，将所有变量设置为默认值并重新请求数据。若trace未改变，跳出初始化
   */
  init(): void {
    if (!this.traceChange) {
      if (this.processRunTimeTbl!.recycleDataSource.length > 0) {
        this.processRunTimeTbl?.reMeauseHeight();
      }
      return;
    }
    this.traceChange = false;
    this.processRunTimeProgress!.loading = true;
    this.display_flag = true;
    this.display_pro!.style.display = 'block';
    this.display_thr!.style.display = 'none';
    this.processMap = Utils.getInstance().getProcessMap();
    this.threadMap = Utils.getInstance().getThreadMap();
    this.queryLogicWorker(
      'scheduling-Process Top10RunTime',
      'query Process Top10 Run Time Analysis Time:',
      this.callBack.bind(this)
    );
  }

  /**
   * 清除已存储数据
   */
  clearData(): void {
    this.traceChange = true;
    this.processSwitchCountChart!.dataSource = [];
    this.processRunTimeTbl!.recycleDataSource = [];
    this.threadSwitchCountChart!.dataSource = [];
    this.threadRunTimeTbl!.recycleDataSource = [];
    this.processRunTimeData = [];
    this.threadRunTimeData = [];
    this.processMap = new Map();
    this.threadMap = new Map();
  }

  /**
   * 提交worker线程，进行数据库查询
   * @param option 操作的key值，用于找到并执行对应方法
   * @param log 日志打印内容
   * @param handler 结果回调函数
   * @param pid 需要查询某一进程下线程数据的进程id
   */
  queryLogicWorker(option: string, log: string, handler: (res: Array<Top10RunTimeData>) => void, pid?: number): void {
    let processThreadCountTime = new Date().getTime();
    procedurePool.submitWithName('logic0', option, { pid: pid }, undefined, handler);
    let durTime = new Date().getTime() - processThreadCountTime;
    info(log, durTime);
  }

  /**
   * 提交worker线程，进行数据库查询
   * @param option 操作的key值，用于找到并执行对应方法
   * @param log 日志打印内容
   * @param handler 结果回调函数
   * @param pid 需要查询某一进程下线程数据的进程id
   */
  organizationData(arr: Array<Top10RunTimeData>): Array<Top10RunTimeData> {
    let result: Array<Top10RunTimeData> = [];
    for (let i = 0; i < arr.length; i++) {
      const pStr: string | null = this.processMap.get(arr[i].pid!)!;
      const tStr: string | null = this.threadMap.get(arr[i].tid!)!;
      result.push({
        no: i + 1,
        pid: arr[i].pid || this.processId,
        pName: pStr === null ? 'Process ' : pStr,
        dur: arr[i].dur,
        tid: arr[i].tid,
        tName: tStr === null ? 'Thread ' : tStr
      });
    }
    return result;
  }

  /**
   * 提交线程后，结果返回后的回调函数
   * @param res 数据库查询结果
   */
  callBack(res: Array<Top10RunTimeData>): void {
    let result: Array<Top10RunTimeData> = this.organizationData(res);
    if (this.display_flag === true) {
      this.processCallback(result);
    } else {
      this.threadCallback(result);
    }
    this.processRunTimeProgress!.loading = false;
  }

  /**
   * 大函数块拆解分为两部分，此部分为Top10进程数据
   * @param result 需要显示在表格中的数据
   */
  processCallback(result: Array<Top10RunTimeData>): void {
    this.nodataPro!.noData = result === undefined || result.length === 0;
    this.processRunTimeTbl!.recycleDataSource = result;
    this.processRunTimeTbl!.reMeauseHeight();
    this.processRunTimeData = result;
    this.processSwitchCountChart!.config = {
      data: result,
      appendPadding: 10,
      xField: 'pid',
      yField: 'dur',
      seriesField: 'size',
      color: (a): string => {
        return '#0a59f7';
      },
      hoverHandler: (no): void => {
        let data: unknown = result.find((it) => it.no === no);
        if (data) {
          // @ts-ignore
          data.isHover = true;
          this.processRunTimeTbl!.setCurrentHover(data);
        } else {
          this.processRunTimeTbl!.mouseOut();
        }
      },
      tip: (obj): string => {
        return `
          <div>
            <div>Process_Id:${
          // @ts-ignore
          obj[0].obj.pid}</div> 
            <div>Process_Name:${
          // @ts-ignore
          obj[0].obj.pName}</div> 
            <div>Run_Time:${
          // @ts-ignore
          obj[0].obj.dur}</div> 
          </div>
        `;
      },
      label: null,
    };
  }

  /**
   * 大函数块拆解分为两部分，此部分为Top10线程数据
   * @param result 需要显示在表格中的数据
   */
  threadCallback(result: Array<Top10RunTimeData>): void {
    this.nodataThr!.noData = result === undefined || result.length === 0;
    this.threadRunTimeTbl!.recycleDataSource = result;
    this.threadRunTimeTbl!.reMeauseHeight();
    this.threadRunTimeData = result;
    this.threadSwitchCountChart!.config = {
      data: result,
      appendPadding: 10,
      xField: 'tid',
      yField: 'dur',
      seriesField: 'size',
      color: (a): string => {
        return '#0a59f7';
      },
      hoverHandler: (no): void => {
        let data: unknown = result.find((it) => it.no === no);
        if (data) {
          // @ts-ignore
          data.isHover = true;
          this.threadRunTimeTbl!.setCurrentHover(data);
        } else {
          this.threadRunTimeTbl!.mouseOut();
        }
      },
      tip: (obj): string => {
        return `
          <div>
            <div>Process_Id:${
          // @ts-ignore
          obj[0].obj.pid}</div> 
            <div>Thread_Id:${
          // @ts-ignore
          obj[0].obj.tid}</div> 
            <div>Thread_Name:${
          // @ts-ignore
          obj[0].obj.tName}</div> 
            <div>Run_Time:${
          // @ts-ignore
          obj[0].obj.dur}</div> 
          </div>
        `;
      },
      label: null,
    };
  }

  /**
   * 元素初始化，将html节点与内部变量进行绑定
   */
  initElements(): void {
    this.processRunTimeProgress = this.shadowRoot!.querySelector<LitProgressBar>('#loading');
    this.nodataPro = this.shadowRoot!.querySelector<TableNoData>('#nodata_Pro');
    this.processRunTimeTbl = this.shadowRoot!.querySelector<LitTable>('#tb-process-run-time');
    this.processSwitchCountChart = this.shadowRoot!.querySelector<LitChartColumn>('#chart_pro');
    this.nodataThr = this.shadowRoot!.querySelector<TableNoData>('#nodata_Thr');
    this.threadRunTimeTbl = this.shadowRoot!.querySelector<LitTable>('#tb-thread-run-time');
    this.threadSwitchCountChart = this.shadowRoot!.querySelector<LitChartColumn>('#chart_thr');
    this.display_pro = this.shadowRoot!.querySelector<HTMLDivElement>('#display_pro');
    this.display_thr = this.shadowRoot!.querySelector<HTMLDivElement>('#display_thr');
    this.back = this.shadowRoot!.querySelector<HTMLDivElement>('#back');
    this.clickEventListener();
    this.hoverEventListener();
  }

  /**
   * 点击监听事件函数块
   */
  clickEventListener(): void {
    // @ts-ignore
    this.processRunTimeTbl!.addEventListener('row-click', (evt: CustomEvent) => {
      this.display_flag = false;
      let data = evt.detail.data;
      this.processId = data.pid;
      this.display_thr!.style.display = 'block';
      this.display_pro!.style.display = 'none';
      this.queryLogicWorker(
        'scheduling-Process Top10RunTime',
        'query Thread Top10 Run Time Analysis Time:',
        this.callBack.bind(this),
        data.pid
      );
    });
    this.processRunTimeTbl!.addEventListener('column-click', (evt) => {
      // @ts-ignore
      this.sortByColumn(evt.detail, this.processRunTimeData);
      this.processRunTimeTbl!.recycleDataSource = this.processRunTimeData;
    });
    this.threadRunTimeTbl!.addEventListener('column-click', (evt) => {
      // @ts-ignore
      this.sortByColumn(evt.detail, this.threadRunTimeData);
      this.threadRunTimeTbl!.recycleDataSource = this.threadRunTimeData;
    });
    this.processRunTimeTbl!.addEventListener('contextmenu', (ev) => { 
      ev.preventDefault();
    });
    this.threadRunTimeTbl!.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
    });
    this.back?.addEventListener('click', (event) => {
      this.display_flag = true;
      this.display_pro!.style.display = 'block';
      this.display_thr!.style.display = 'none';
    });
  }

  /**
   * 移入事件监听函数块
   */
  hoverEventListener(): void {
    // @ts-ignore
    this.processRunTimeTbl!.addEventListener('row-hover', (evt: CustomEvent) => {
      if (evt.detail.data) {
        let data = evt.detail.data;
        data.isHover = true;
        if (evt.detail.callBack) {
          evt.detail.callBack(true);
        }
        this.processSwitchCountChart?.showHoverColumn(data.no);
      }
    });
    // @ts-ignore
    this.threadRunTimeTbl!.addEventListener('row-hover', (evt: CustomEvent) => {
      if (evt.detail.data) {
        let data = evt.detail.data;
        data.isHover = true;
        if (evt.detail.callBack) {
          evt.detail.callBack(true);
        }
        this.threadSwitchCountChart?.showHoverColumn(data.no);
      }
    });
  }

  /**
   * 表格数据排序
   * @param detail 点击的列名，以及排序状态0 1 2分别代表不排序、升序排序、降序排序
   * @param data 表格中需要排序的数据
   */
  sortByColumn(detail: unknown, data: Array<Top10RunTimeData>): void {
    // @ts-ignore
    function compare(processThreadCountProperty, sort, type) {
      return function (a: unknown, b: unknown) {
        if (type === 'number') {
          // @ts-ignore
          return sort === 2
          // @ts-ignore
            ? parseFloat(b[processThreadCountProperty]) -
            // @ts-ignore
            parseFloat(a[processThreadCountProperty])
            // @ts-ignore
            : parseFloat(a[processThreadCountProperty]) -
            // @ts-ignore
            parseFloat(b[processThreadCountProperty]);
        } else {
          if (sort === 2) {
            // @ts-ignore
            return b[processThreadCountProperty]
              .toString()
              // @ts-ignore
              .localeCompare(a[processThreadCountProperty].toString());
          } else {
            // @ts-ignore
            return a[processThreadCountProperty]
              .toString()
              // @ts-ignore
              .localeCompare(b[processThreadCountProperty].toString());
          }
        }
      };
    }
    // @ts-ignore
    if (detail.key === 'pName' || detail.key === 'tName') {
      data.sort(
        // @ts-ignore
        compare(detail.key, detail.sort, 'string')
      );
    } else {
      data.sort(
        // @ts-ignore
        compare(detail.key, detail.sort, 'number')
      );
    }
  }

  /**
   * 用于将元素节点挂载，大函数块拆分为样式、节点
   * @returns 返回字符串形式的元素节点
   */
  initHtml(): string {
    return this.initStyleHtml() + this.initTagHtml();
  }

  /**
   * 样式html代码块
   * @returns 返回样式代码块字符串
   */
  initStyleHtml(): string {
    return `
      <style>
        .content_grid{
            display: grid;
            padding: 15px;
            grid-column-gap: 15px;
            grid-row-gap: 15px;
            grid-template-columns: 1fr 1fr;
            background-color: var(--dark-background,#FFFFFF);
        }
        .chart_div{
            display: flex;
            flex-direction: column;
            background-color: var(--dark-background,#FFFFFF);
            align-items: center;
            height: 370px;
            padding-left: 5px;
            padding-right: 5px;
            border-radius: 5px
        }
        :host {
            width: 100%;
            height: 100%;
            background: var(--dark-background5,#F6F6F6);
        }
        .tb_run_time{
            overflow: auto;
            background-color: var(--dark-background,#FFFFFF);
            border-radius: 5px;
            border: solid 1px var(--dark-border1,#e0e0e0);
            display: flex;
        }
        .bg{
            background-color: var(--dark-background,#FFFFFF);
            padding-left: 10px;
        }
        .labels{
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            font-size: 9pt;
            padding-right: 15px;
        }
      </style>
    `;
  }

  /**
   * 节点html代码块
   * @returns 返回节点代码块字符串
   */
  initTagHtml(): string {
    return `
      <lit-progress-bar id="loading" style="height: 1px;width: 100%"></lit-progress-bar>
      <div id='display_pro'>
        <table-no-data id="nodata_Pro" contentHeight="500px">
          <div class="root">
            <div style="width:100%;height: 45px;"></div>
            <div class="content_grid" id="total">
              <div class="chart_div">
                <div style="line-height: 40px;height: 40px;width: 100%;text-align: center;">Top10运行超长进程</div>
                <lit-chart-column id="chart_pro" style="width:100%;height:300px"></lit-chart-column>
              </div>
              <div class="tb_run_time" >
                <lit-table id='tb-process-run-time' hideDownload style='height: auto'>
                  <lit-table-column width='1fr' title='NO' data-index='no' key='no' align='flex-start' order></lit-table-column>
                  <lit-table-column width='1fr' title='Process_Id' data-index='pid' key='pid' align='flex-start' order></lit-table-column>
                  <lit-table-column width='1fr' title='Process_Name' data-index='pName' key='pName' align='flex-start' order></lit-table-column>
                  <lit-table-column width='1fr' title='Run_Time(ns)' data-index='dur' key='dur' align='flex-start' order></lit-table-column>        
                </lit-table>
              </div>
            </div>
          </div>
        </table-no-data>
      </div>
      <div id='display_thr' style='display: none'>
        <table-no-data id="nodata_Thr" contentHeight="500px">
          <div class="root">
            <div class="bg" style="display: flex;flex-direction: row;">
              <div id="back" style="height: 45px;display: flex;flex-direction: row;align-items: center;cursor: pointer" title="Back Previous Level">
                <span style="width: 10px"></span>Previous Level<span style="width: 10px"></span><lit-icon name="vertical-align-top" size="20"></lit-icon>
              </div>
            </div>
            <div class="content_grid" id="total">
              <div class="chart_div">
                <div style="line-height: 40px;height: 40px;width: 100%;text-align: center;">Top10运行超长线程</div>
                <lit-chart-column id="chart_thr" style="width:100%;height:300px"></lit-chart-column>
              </div>
              <div class="tb_run_time" >
                <lit-table id='tb-thread-run-time' hideDownload style='height: auto'>
                  <lit-table-column width='1fr' title='NO' data-index='no' key='no' align='flex-start' order></lit-table-column>
                  <lit-table-column width='1fr' title='Process_Id' data-index='pid' key='pid' align='flex-start' order></lit-table-column>
                  <lit-table-column width='1fr' title='Thread_Id' data-index='tid' key='tid' align='flex-start' order></lit-table-column>
                  <lit-table-column width='1fr' title='Thread_Name' data-index='tName' key='tName' align='flex-start' order></lit-table-column>
                  <lit-table-column width='1fr' title='Run_Time(ns)' data-index='dur' key='dur' align='flex-start' order></lit-table-column>        
                </lit-table>
              </div>
            </div>
          </div>
        </table-no-data>
      </div>
    `;
  }
}

interface Top10RunTimeData {
  no?: number,
  pid?: number,
  tid?: number,
  pName?: string,
  tName?: string,
  switchCount?: number,
  dur?: number
}