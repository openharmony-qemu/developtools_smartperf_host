/*
 * Copyright (C) 2022 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
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
import { LitChartPie } from '../../../../base-ui/chart/pie/LitChartPie';
import '../../../../base-ui/chart/pie/LitChartPie';
import { Utils } from '../../trace/base/Utils';

@element('top10-process-switch-count')
export class Top10ProcessSwitchCount extends BaseElement {
  traceChange: boolean = false;
  private processSwitchCountTbl: LitTable | null | undefined;
  private threadSwitchCountTbl: LitTable | null | undefined;
  private nodataPro: TableNoData | null | undefined;
  private nodataThr: TableNoData | null | undefined;
  private processSwitchCountData: Array<Top10ProcSwiCount> = [];
  private threadSwitchCountData: Array<Top10ProcSwiCount> = [];
  private threadSwitchCountPie: LitChartPie | null | undefined;
  private processSwitchCountPie: LitChartPie | null | undefined;
  private display_pro: HTMLDivElement | null | undefined;
  private display_thr: HTMLDivElement | null | undefined;
  private processSwitchCountProgress: LitProgressBar | null | undefined;
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
      if (this.processSwitchCountTbl!.recycleDataSource.length > 0) {
        this.processSwitchCountTbl?.reMeauseHeight();
      }
      return;
    }
    this.traceChange = false;
    this.processSwitchCountProgress!.loading = true;
    this.display_flag = true;
    this.display_pro!.style.display = 'block';
    this.display_thr!.style.display = 'none';
    this.processMap = Utils.getInstance().getProcessMap();
    this.threadMap = Utils.getInstance().getThreadMap();
    this.queryLogicWorker(
      'scheduling-Process Top10Swicount',
      'query Process Top10 Switch Count Analysis Time:',
      this.callBack.bind(this)
    );
  }

  /**
   * 清除已存储数据
   */
  clearData(): void {
    this.traceChange = true;
    this.processSwitchCountPie!.dataSource = [];
    this.processSwitchCountTbl!.recycleDataSource = [];
    this.threadSwitchCountPie!.dataSource = [];
    this.threadSwitchCountTbl!.recycleDataSource = [];
    this.processSwitchCountData = [];
    this.threadSwitchCountData = [];
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
  queryLogicWorker(option: string, log: string, handler: (res: Array<Top10ProcSwiCount>) => void, pid?: number): void {
    let processThreadCountTime = new Date().getTime();
    procedurePool.submitWithName('logic0', option, { pid: pid }, undefined, handler);
    let durTime = new Date().getTime() - processThreadCountTime;
    info(log, durTime);
  }

  /**
   * 抽取公共方法，提取数据，用于展示到表格中
   * @param arr 数据库查询结果
   * @returns 整理好的数据，包含进程名，线程名等相关信息
   */
  organizationData(arr: Array<Top10ProcSwiCount>): Array<Top10ProcSwiCount> {
    let result: Array<Top10ProcSwiCount> = [];
    for (let i = 0; i < arr.length; i++) {
      const pStr: string | null = this.processMap.get(arr[i].pid!)!;
      const tStr: string | null = this.threadMap.get(arr[i].tid!)!;
      result.push({
        NO: i + 1,
        pid: arr[i].pid || this.processId,
        pName: pStr === null ? 'Process ' : pStr,
        switchCount: arr[i].occurrences,
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
  callBack(res: Array<Top10ProcSwiCount>): void {
    let result: Array<Top10ProcSwiCount> = this.organizationData(res);
    // 判断当前显示的是进程组还是线程组
    if (this.display_flag === true) {
      this.processCallback(result);
    } else {
      this.threadCallback(result);
    }
    this.processSwitchCountProgress!.loading = false;
  }

  /**
   * 大函数块拆解分为两部分，此部分为Top10进程数据
   * @param result 需要显示在表格中的数据
   */
  processCallback(result: Array<Top10ProcSwiCount>): void {
    this.nodataPro!.noData = result === undefined || result.length === 0;
    this.processSwitchCountData = result;
    this.processSwitchCountPie!.config = {
      appendPadding: 10,
      data: result,
      angleField: 'switchCount',
      colorField: 'pid',
      radius: 0.8,
      label: {
        type: 'outer',
      },
      hoverHandler: (data): void => {
        if (data) {
          this.processSwitchCountTbl!.setCurrentHover(data);
        } else {
          this.processSwitchCountTbl!.mouseOut();
        }
      },
      tip: (obj): string => {
        return `
          <div>
            <div>Process_Id:${
          // @ts-ignore
          obj.obj.pid}</div> 
            <div>Process_Name:${
          // @ts-ignore
          obj.obj.pName}</div> 
            <div>Switch Count:${
          // @ts-ignore
          obj.obj.switchCount}</div> 
          </div>
        `;
      },
      interactions: [
        {
          type: 'element-active',
        },
      ],
    };
    this.processSwitchCountTbl!.recycleDataSource = result;
    this.processSwitchCountTbl!.reMeauseHeight();
  }

  /**
   * 大函数块拆解分为两部分，此部分为Top10线程数据
   * @param result 需要显示在表格中的数据
   */
  threadCallback(result: Array<Top10ProcSwiCount>): void {
    this.nodataThr!.noData = result === undefined || result.length === 0;
    this.threadSwitchCountTbl!.recycleDataSource = result;
    this.threadSwitchCountTbl!.reMeauseHeight();
    this.threadSwitchCountData = result;
    this.threadSwitchCountPie!.config = {
      appendPadding: 10,
      data: result,
      angleField: 'switchCount',
      colorField: 'tid',
      radius: 0.8,
      label: {
        type: 'outer',
      },
      hoverHandler: (data): void => {
        if (data) {
          this.threadSwitchCountTbl!.setCurrentHover(data);
        } else {
          this.threadSwitchCountTbl!.mouseOut();
        }
      },
      tip: (obj): string => {
        return `
          <div>
            <div>Thread_Id:${
          // @ts-ignore
          obj.obj.tid}</div> 
            <div>Thread_Name:${
          // @ts-ignore
          obj.obj.tName}</div> 
            <div>Switch Count:${
          // @ts-ignore
          obj.obj.switchCount}</div> 
            <div>Process_Id:${
          // @ts-ignore
          obj.obj.pid}</div> 
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

  /**
   * 元素初始化，将html节点与内部变量进行绑定
   */
  initElements(): void {
    this.processSwitchCountProgress = this.shadowRoot!.querySelector<LitProgressBar>('#loading');
    this.processSwitchCountTbl = this.shadowRoot!.querySelector<LitTable>('#tb-process-switch-count');
    this.threadSwitchCountTbl = this.shadowRoot!.querySelector<LitTable>('#tb-thread-switch-count');
    this.processSwitchCountPie = this.shadowRoot!.querySelector<LitChartPie>('#pie_pro');
    this.threadSwitchCountPie = this.shadowRoot!.querySelector<LitChartPie>('#pie_thr');
    this.nodataPro = this.shadowRoot!.querySelector<TableNoData>('#nodata_pro');
    this.nodataThr = this.shadowRoot!.querySelector<TableNoData>('#nodata_thr');
    this.display_pro = this.shadowRoot!.querySelector<HTMLDivElement>('#display_pro');
    this.display_thr = this.shadowRoot!.querySelector<HTMLDivElement>('#display_thr');
    this.back = this.shadowRoot!.querySelector<HTMLDivElement>('#back');
    this.clickEventListener();
    this.hoverEventListener();
    this.addEventListener('contextmenu', (event) => {
      event.preventDefault(); // 阻止默认的上下文菜单弹框
    });
  }

  /**
   * 点击监听事件函数块
   */
  clickEventListener(): void {
    // @ts-ignore
    this.processSwitchCountTbl!.addEventListener('row-click', (evt: CustomEvent) => {
      this.display_flag = false;
      let data = evt.detail.data;
      this.processId = data.pid;
      this.display_thr!.style.display = 'block';
      this.display_pro!.style.display = 'none';
      this.queryLogicWorker(
        'scheduling-Process Top10Swicount',
        'query Process Top10 Switch Count Analysis Time:',
        this.callBack.bind(this),
        data.pid
      );
    });
    this.processSwitchCountTbl!.addEventListener('column-click', (evt) => {
      // @ts-ignore
      this.sortByColumn(evt.detail, this.processSwitchCountData);
      this.processSwitchCountTbl!.recycleDataSource = this.processSwitchCountData;
    });
    this.threadSwitchCountTbl!.addEventListener('column-click', (evt) => {
      // @ts-ignore
      this.sortByColumn(evt.detail, this.threadSwitchCountData);
      this.threadSwitchCountTbl!.recycleDataSource = this.threadSwitchCountData;
    });
    
    this.back!.addEventListener('click', (event) => {
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
    this.processSwitchCountTbl!.addEventListener('row-hover', (evt: CustomEvent) => {
      if (evt.detail.data) {
        let data = evt.detail.data;
        data.isHover = true;
        if (evt.detail.callBack) {
          evt.detail.callBack(true);
        }
      }
      this.processSwitchCountPie?.showHover();
    });
    // @ts-ignore
    this.threadSwitchCountTbl!.addEventListener('row-hover', (evt: CustomEvent) => {
      if (evt.detail.data) {
        let data = evt.detail.data;
        data.isHover = true;
        if (evt.detail.callBack) {
          evt.detail.callBack(true);
        }
      }
      this.threadSwitchCountPie?.showHover();
    });
    this.addEventListener('mouseenter', () => {
      if (this.processSwitchCountTbl!.recycleDataSource.length > 0) {
        this.processSwitchCountTbl?.reMeauseHeight();
      }
    });
  }

  /**
   * 表格数据排序
   * @param detail 点击的列名，以及排序状态0 1 2分别代表不排序、升序排序、降序排序
   * @param data 表格中需要排序的数据
   */
  sortByColumn(detail: { key: string, sort: number }, data: Array<Top10ProcSwiCount>): void {
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
    if (detail.key === 'pName' || detail.key === 'tName') {
      data.sort(
        compare(detail.key, detail.sort, 'string')
      );
    } else {
      data.sort(
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
        :host {
            width: 100%;
            height: 100%;
            background-color: var(--dark-background5,#F6F6F6);
        }
        .pie-chart{
            display: flex;
            box-sizing: border-box;
            width: 500px;
            height: 500px;
        }
        .tb_switch_count{
            flex: 1;
            overflow: auto ;
            border-radius: 5px;
            border: solid 1px var(--dark-border1,#e0e0e0);
            margin: 15px;
            padding: 5px 15px
        }
        .switchcount-root{
            width: 100%;
            height: 100%;
            box-sizing: border-box;
            display: flex;
            flex-direction: row;
        }
        .bg{
            background-color: var(--dark-background,#FFFFFF);
            padding-left: 10px;
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
      <lit-progress-bar id='loading' style='height: 1px;width: 100%' loading></lit-progress-bar>
      <div id='display_pro'>
        <table-no-data id='nodata_pro' contentHeight='500px'>
          <div class="root">
            <div style="width:100%;height: 45px;"></div>
            <div class='switchcount-root'>
              <div style='display: flex;flex-direction: column;align-items: center'>
                <div>Statistics By Process's Switch Count</div>
                <lit-chart-pie id='pie_pro' class='pie-chart'></lit-chart-pie>
              </div>
              <div class='tb_switch_count'>
                <lit-table id='tb-process-switch-count' hideDownload style='height: auto'>
                  <lit-table-column width='1fr' title='NO' data-index='NO' key='NO' align='flex-start' order></lit-table-column>
                  <lit-table-column width='1fr' title='Process_Id' data-index='pid' key='pid' align='flex-start' order></lit-table-column>
                  <lit-table-column width='1fr' title='Process_Name' data-index='pName' key='pName' align='flex-start' order></lit-table-column>
                  <lit-table-column width='1fr' title='Switch Count' data-index='switchCount' key='switchCount' align='flex-start' order></lit-table-column>        
                </lit-table>
              </div>
            </div>
          </div>
        </table-no-data>
      </div>
      <div id='display_thr' style='display: none'>
        <table-no-data id='nodata_thr' contentHeight='500px'>
          <div class="root">
            <div class="bg" style="display: flex;flex-direction: row;">
              <div id="back" style="height: 45px;display: flex;flex-direction: row;align-items: center;cursor: pointer" title="Back Previous Level">
                <span style="width: 10px"></span>Previous Level<span style="width: 10px"></span><lit-icon name="vertical-align-top" size="20"></lit-icon>
              </div>
            </div>
            <div class='switchcount-root'>
              <div style='display: flex;flex-direction: column;align-items: center'>
                <div>Statistics By Thread's Switch Count</div>
                <lit-chart-pie id='pie_thr' class='pie-chart'></lit-chart-pie>
              </div>
              <div class='tb_switch_count'>
                <lit-table id='tb-thread-switch-count' hideDownload style='height: auto'>
                  <lit-table-column width='1fr' title='NO' data-index='NO' key='NO' align='flex-start' order></lit-table-column>
                  <lit-table-column width='1fr' title='Process_Id' data-index='pid' key='pid' align='flex-start' order></lit-table-column>
                  <lit-table-column width='1fr' title='Thread_Id' data-index='tid' key='tid' align='flex-start' order></lit-table-column>
                  <lit-table-column width='1fr' title='Thread_Name' data-index='tName' key='tName' align='flex-start' order></lit-table-column>
                  <lit-table-column width='1fr' title='Switch Count' data-index='switchCount' key='switchCount' align='flex-start' order></lit-table-column>        
                </lit-table>
              </div>
            </div>
          </div>
        </table-no-data>
      </div>
    `;
  }
}

interface Top10ProcSwiCount {
  NO?: number,
  pid?: number,
  tid?: number,
  pName?: string,
  tName?: string,
  switchCount?: number,
  occurrences?: number
}