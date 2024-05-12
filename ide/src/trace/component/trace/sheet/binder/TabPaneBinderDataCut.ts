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
import { type LitTable, RedrawTreeForm } from '../../../../../base-ui/table/lit-table';
import { Utils } from '../../base/Utils';
import { type SelectionParam } from '../../../../bean/BoxSelection';
import {
  type BinderItem,
  type ProcessBinderItem,
  type ThreadBinderItem,
  type DataSource,
  type FunctionItem,
  type BinderDataStruct,
  CycleBinderItem,
} from '../../../../bean/BinderProcessThread';
import { queryFuncNameCycle, queryLoopFuncNameCycle } from '../../../../../trace/database/sql/Func.sql';
import { queryBinderByThreadId } from '../../../../../trace/database/sql/ProcessThread.sql';
import { resizeObserver } from '../SheetUtils';
import { type LitChartColumn } from '../../../../../base-ui/chart/column/LitChartColumn';
import '../../../../../base-ui/chart/column/LitChartColumn';
import { SpSegmentationChart } from '../../../chart/SpSegmentationChart';
import { SliceGroup } from '../../../../bean/StateProcessThread';

const MILLIONS: number = 1000000;
const THREE: number = 3;
@element('tabpane-binder-datacut')
export class TabPaneBinderDataCut extends BaseElement {
  private threadBindersTbl: LitTable | null | undefined;
  private currentSelectionParam: SelectionParam | any;
  private threadStatesDIV: Element | null | undefined;
  private cycleColumnDiv: HTMLDivElement | null | undefined;
  private cycleARangeArr: CycleBinderItem[] = [];
  private cycleBRangeArr: CycleBinderItem[] = [];
  private cycleAStartRangeDIV: HTMLInputElement | null | undefined;
  private cycleAEndRangeDIV: HTMLInputElement | null | undefined;
  private cycleBStartRangeDIV: HTMLInputElement | null | undefined;
  private cycleBEndRangeDIV: HTMLInputElement | null | undefined;
  private chartTotal: LitChartColumn | null | undefined;
  private dataSource: DataSource[] = [];
  private rowCycleData: CycleBinderItem[] = [];
  private currentThreadId: string = '';
  private threadArr: Array<ThreadBinderItem> = [];
  private threadBinderMap: Map<string, Array<BinderItem>> = new Map();
  private processIds: Array<number> = [];
  private funcCycleArr: Array<FunctionItem> = [];

  set data(threadStatesParam: SelectionParam) {
    if (this.currentSelectionParam === threadStatesParam) {
      return;
    }
    this.currentSelectionParam = threadStatesParam;
    SpSegmentationChart.setBinderChartData([]);
    SpSegmentationChart.tabHover('BINDER', false, -1);
    // @ts-ignore
    this.processIds = [...new Set(this.currentSelectionParam.processIds)];
    this.threadArr = [];
    this.threadBinderMap.clear();
    this.hideQueryArea(true);
    this.clickLoop(false);
    this.clickSingle(false);
    this.threadBindersTbl!.recycleDataSource = [];
    // @ts-ignore
    this.tHeadClick(this.threadBindersTbl!.recycleDataSource);
    this.parentElement!.style.overflow = 'hidden';
    new ResizeObserver(() => {
      // @ts-ignore
      let lastHeight: number = this.threadBindersTbl.tableElement!.offsetHeight;
      this.cycleColumnDiv!.style.height = lastHeight + 'px';
    }).observe(this.threadBindersTbl!);
  }

  hideQueryArea(b: boolean): void {
    if (b) {
      this.setAttribute('hideQueryArea', '');
    } else {
      this.removeAttribute('hideQueryArea');
    }
  }

  clickSingle(b: boolean): void {
    if (b) {
      this.setAttribute('clickSingle', '');
    } else {
      this.removeAttribute('clickSingle');
    }
  }

  clickLoop(b: boolean): void {
    if (b) {
      this.setAttribute('clickLoop', '');
    } else {
      this.removeAttribute('clickLoop');
    }
  }

  // 查询数据库，binder和Function查询
  async queryDataFromDb(
    threadIdValue: string,
    threadFuncName: string,
    threadIds: Array<number>,
    leftNS: number,
    rightNS: number,
    type: string
  ): Promise<void> {
    let binderArr: Array<BinderItem> = await queryBinderByThreadId(this.processIds, threadIds, leftNS, rightNS);
    if (binderArr.length > 0) {
      this.structureThreadBinderMap(binderArr);
    }
    if (type === 'loop') {
      //@ts-ignore
      this.funcCycleArr = await queryLoopFuncNameCycle(threadFuncName, threadIdValue, leftNS, rightNS);
    } else {
      this.funcCycleArr = await queryFuncNameCycle(threadFuncName, threadIdValue, leftNS, rightNS);
    }
  }

  //点击single loop 切割按钮方法
  async dataCutFunc(threadId: HTMLInputElement, threadFunc: HTMLInputElement, type: string): Promise<void> {
    this.currentThreadId = '';
    let threadIdValue = threadId.value.trim();
    let threadFuncName = threadFunc.value.trim();

    this.clickLoop(type === 'loop' ? true : false);
    this.clickSingle(type === 'loop' ? false : true);
    //清空泳道图
    SpSegmentationChart.setBinderChartData([]);
    SpSegmentationChart.tabHover('BINDER', false, -1);
    if (threadIdValue !== '' && threadFuncName !== '') {
      this.threadBindersTbl!.loading = true;
      threadId.style.border = '1px solid rgb(151,151,151)';
      threadFunc.style.border = '1px solid rgb(151,151,151)';
      let threadIds = this.currentSelectionParam.threadIds;
      let leftNS = this.currentSelectionParam.leftNs;
      let rightNS = this.currentSelectionParam.rightNs;
      this.threadArr = [];
      this.threadBinderMap.clear();
      await this.queryDataFromDb(threadIdValue, threadFuncName, threadIds, leftNS, rightNS, type);
      if (this.funcCycleArr.length !== 0) {
        let cycleMap: Map<string, Array<CycleBinderItem>> = type === 'loop'
          ? this.loopDataCutCycleMap(this.funcCycleArr)
          : this.singleDataCutCycleMap(this.funcCycleArr);
        this.threadBindersTbl!.recycleDataSource = this.mergeData(cycleMap);
        this.threadBindersTbl!.loading = false; // @ts-ignore
        this.tHeadClick(this.threadBindersTbl!.recycleDataSource);
      } else {
        this.threadBindersTbl!.recycleDataSource = [];
        this.threadBindersTbl!.loading = false; // @ts-ignore
        this.tHeadClick(this.threadBindersTbl!.recycleDataSource);
      }
    } else {
      this.verifyInputIsEmpty(threadIdValue, threadFuncName, threadId, threadFunc);
    }
  }

  verifyInputIsEmpty(
    threadIdValue: string,
    threadFuncName: string,
    threadId: HTMLInputElement,
    threadFunc: HTMLInputElement
  ): void {
    if (threadIdValue === '') {
      threadId.style.border = '1px solid rgb(255,0,0)';
      threadId.setAttribute('placeholder', 'Please input thread id');
      this.threadBindersTbl!.recycleDataSource = [];
      this.threadBindersTbl!.loading = false; // @ts-ignore
      this.tHeadClick(this.threadBindersTbl!.recycleDataSource);
    } else {
      threadId.style.border = '1px solid rgb(151,151,151)';
    }
    if (threadFuncName === '') {
      threadFunc.style.border = '1px solid rgb(255,0,0)';
      threadFunc.setAttribute('placeholder', 'Please input function name');
      this.threadBindersTbl!.recycleDataSource = [];
      this.threadBindersTbl!.loading = false; // @ts-ignore
      this.tHeadClick(this.threadBindersTbl!.recycleDataSource);
    } else {
      threadFunc.style.border = '1px solid rgb(151,151,151)';
    }
  }

  // 构建线程 binder Map数据
  structureThreadBinderMap(binderArr: Array<BinderItem>): void {
    for (let b of binderArr) {
      if (!this.threadBinderMap.has(b.pid + '_' + b.tid)) {
        this.threadArr.push({
          title:
            Utils.getInstance().getThreadMap().get(b.tid) === null
              ? 'Thread' + ' ' + '[' + b.tid + ']'
              : Utils.getInstance().getThreadMap().get(b.tid) + ' ' + '[' + b.tid + ']',
          totalCount: 0,
          tid: b.tid,
          pid: b.pid,
          children: [],
          type: 'Thread',
        });
        this.threadBinderMap.set(b.pid + '_' + b.tid, new Array());
      }
      let arr: Array<BinderItem> | undefined = this.threadBinderMap.get(b.pid + '_' + b.tid);
      arr?.push(b);
    }
  }

  deepCloneThreadBinderMap(threadBinderMap: Map<string, Array<BinderItem>>): Map<string, Array<BinderItem>> {
    let cloneThreadBinderMap: Map<string, Array<BinderItem>> = new Map();
    if (cloneThreadBinderMap instanceof Map) {
      threadBinderMap.forEach((val, key) => {
        const k = key;
        const v = JSON.parse(JSON.stringify(val));
        cloneThreadBinderMap.set(k, v);
      });
    }
    return cloneThreadBinderMap;
  }

  // 构建single切割cycle Map数据
  singleDataCutCycleMap(funcNameArr: Array<FunctionItem>): Map<string, Array<CycleBinderItem>> {
    let cloneThreadBinderMap: Map<string, Array<BinderItem>> = this.deepCloneThreadBinderMap(this.threadBinderMap);
    let cycleMap: Map<string, Array<CycleBinderItem>> = new Map();
    cloneThreadBinderMap.forEach((tBinder: Array<BinderItem>) => {
      funcNameArr.forEach((func, idx) => {
        let cycleArr: Array<CycleBinderItem> | undefined = [];
        let countBinder: CycleBinderItem = new CycleBinderItem();
        let cid = func.id;
        for (let j: number = 0; j < tBinder.length; j++) {
          if (!cycleMap.has(tBinder[j].tid + '_' + cid)) {
            cycleMap.set(tBinder[j].tid + '_' + cid, new Array());
          }
          cycleArr = cycleMap.get(tBinder[j].tid + '_' + cid);
          let thread: string = Utils.getInstance().getThreadMap().get(tBinder[j].tid) || 'Thread';
          countBinder.title = 'cycle ' + (idx + 1) + '_' + thread;
          countBinder.tid = tBinder[j].tid;
          countBinder.pid = tBinder[j].pid;
          countBinder.durNs = func.dur;
          countBinder.tsNs = func.cycleStartTime;
          countBinder.cycleDur = Number((func.dur / MILLIONS).toFixed(THREE));
          countBinder.cycleStartTime = Number((func.cycleStartTime / MILLIONS).toFixed(THREE));
          if (
            tBinder[j].ts + tBinder[j].dur > func.cycleStartTime &&
            tBinder[j].ts + tBinder[j].dur < func.cycleStartTime + func!.dur
          ) {
            countBinder.totalCount += 1;
            countBinder.binderTransactionCount += tBinder[j].name === 'binder transaction' ? 1 : 0;
            countBinder.binderAsyncRcvCount += tBinder[j].name === 'binder async rcv' ? 1 : 0;
            countBinder.binderReplyCount += tBinder[j].name === 'binder reply' ? 1 : 0;
            countBinder.binderTransactionAsyncCount += tBinder[j].name === 'binder transaction async' ? 1 : 0;
            countBinder.idx = idx + 1;
            tBinder.splice(j, 1);
            j--;
          }
        }
        cycleArr?.push(countBinder);
      });
    });
    return cycleMap;
  }

  // 构建loop切割cycle Map数据
  loopDataCutCycleMap(funcNameArr: Array<FunctionItem>): Map<string, Array<CycleBinderItem>> {
    let cloneThreadBinderMap: Map<string, Array<BinderItem>> = this.deepCloneThreadBinderMap(this.threadBinderMap);
    let cycleMap: Map<string, Array<CycleBinderItem>> = new Map();
    cloneThreadBinderMap.forEach((tBinder: Array<BinderItem>) => {
      for (let i: number = 0; i < funcNameArr.length - 1; i++) {
        let cycleArr: Array<CycleBinderItem> | undefined = [];
        let countBinder: CycleBinderItem = new CycleBinderItem();
        let cid: number = funcNameArr[i].id;
        for (let j: number = 0; j < tBinder.length; j++) {
          if (!cycleMap.has(tBinder[j].tid + '_' + cid)) {
            cycleMap.set(tBinder[j].tid + '_' + cid, new Array());
          }
          cycleArr = cycleMap.get(tBinder[j].tid + '_' + cid);
          let thread: string = Utils.getInstance().getThreadMap().get(tBinder[j].tid) || 'Thread';
          countBinder.title = 'cycle ' + (i + 1) + '_' + thread;
          countBinder.tid = tBinder[j].tid;
          countBinder.pid = tBinder[j].pid;
          countBinder.durNs = funcNameArr[i + 1].cycleStartTime - funcNameArr[i].cycleStartTime;
          countBinder.tsNs = funcNameArr[i].cycleStartTime;
          countBinder.cycleDur = Number(
            ((funcNameArr[i + 1].cycleStartTime - funcNameArr[i].cycleStartTime) / MILLIONS).toFixed(THREE)
          );
          countBinder.cycleStartTime = Number((funcNameArr[i].cycleStartTime / MILLIONS).toFixed(THREE));
          if (
            tBinder[j].ts + tBinder[j].dur > funcNameArr[i].cycleStartTime &&
            tBinder[j].ts + tBinder[j].dur < funcNameArr[i + 1].cycleStartTime
          ) {
            countBinder.totalCount += 1;
            countBinder!.binderTransactionCount += tBinder[j].name === 'binder transaction' ? 1 : 0;
            countBinder!.binderAsyncRcvCount += tBinder[j].name === 'binder async rcv' ? 1 : 0;
            countBinder.binderReplyCount += tBinder[j].name === 'binder reply' ? 1 : 0;
            countBinder.binderTransactionAsyncCount += tBinder[j].name === 'binder transaction async' ? 1 : 0;
            countBinder.idx = i + 1;
            tBinder.splice(j, 1);
            j--;
          }
        }
        cycleArr?.push(countBinder);
      }
    });
    return cycleMap;
  }

  //组成树结构数据
  mergeData(cycleMap: Map<string, Array<CycleBinderItem>>): Array<ProcessBinderItem> {
    let processArr: Array<ProcessBinderItem> = [];
    let processIds: Array<number> = [];
    // 将thread级下的周期数据放入对应的thread下。树结构的第二层thread数据
    for (let thread of this.threadArr) {
      if (!processIds.includes(thread.pid)) {
        processIds.push(thread.pid);
      }
      thread.totalCount = 0;
      thread.children = [];
      for (let key of cycleMap!.keys()) {
        let cycle: Array<CycleBinderItem> | undefined = cycleMap.get(key);
        if (key.split('_')[0] === thread.tid + '') {
          thread.totalCount += cycle![0].totalCount;
          thread.children.push(cycle![0]);
        }
      }
    }
    // process级的数组数据，也就是树结构的根数据层
    processIds.forEach((pid) => {
      processArr.push({
        pid: pid,
        title:
          Utils.getInstance().getProcessMap().get(pid) === null
            ? 'Process' + ' ' + '[' + pid + ']'
            : Utils.getInstance().getProcessMap().get(pid) + ' ' + '[' + pid + ']',
        totalCount: 0,
        type: 'Process',
        children: [],
      });
    });
    // 将process级下的thread数据放入对应的process下
    for (let process of processArr) {
      for (let thread of this.threadArr) {
        if (thread.pid === process.pid) {
          process.totalCount += thread.totalCount;
          process.children.push(thread);
        }
      }
    }
    return processArr;
  }

  // 构建画泳道图的数据
  structuredLaneChartData(rowCycleData: CycleBinderItem[]): Array<BinderDataStruct[]> {
    let laneChartData: Array<BinderDataStruct[]> = [];
    rowCycleData.forEach((it) => {
      if (it.totalCount !== 0) {
        let cycleDataArr: BinderDataStruct[] = [];
        if (it.binderTransactionCount !== 0) {
          cycleDataArr.push({
            name: 'binder transaction',
            value: it.binderTransactionCount!,
            dur: it.durNs,
            startNS: it.tsNs,
            cycle: it.idx,
          });
        }
        if (it.binderTransactionAsyncCount !== 0) {
          cycleDataArr.push({
            name: 'binder transaction async',
            value: it.binderTransactionAsyncCount!,
            dur: it.durNs,
            startNS: it.tsNs,
            cycle: it.idx,
          });
        }
        if (it.binderReplyCount !== 0) {
          cycleDataArr.push({
            name: 'binder reply',
            value: it.binderReplyCount!,
            dur: it.durNs,
            startNS: it.tsNs,
            cycle: it.idx,
          });
        }
        if (it.binderAsyncRcvCount !== 0) {
          cycleDataArr.push({
            name: 'binder async rcv',
            value: it.binderAsyncRcvCount!,
            dur: it.durNs,
            startNS: it.tsNs,
            cycle: it.idx,
          });
        }
        laneChartData.push(cycleDataArr);
      }
    });
    return laneChartData;
  }

  clearCycleRange(): void {
    this.cycleAStartRangeDIV!.value = '';
    this.cycleAEndRangeDIV!.value = '';
    this.cycleBStartRangeDIV!.value = '';
    this.cycleBEndRangeDIV!.value = '';
  }

  drawColumn(): void {
    this.chartTotal!.dataSource = this.dataSource!;
    this.chartTotal!.config = {
      data: this.dataSource!,
      appendPadding: 10,
      xField: 'xName',
      yField: 'yAverage',
      seriesField: '',
      removeUnit: true,
      notSort: true,
      color: (a) => {
        //@ts-ignore
        if (a.xName === 'Total') {
          return '#2f72f8'; //@ts-ignore
        } else if (a.xName === 'cycleA') {
          return '#ffab67'; //@ts-ignore
        } else if (a.xName === 'cycleB') {
          return '#a285d2';
        } else {
          return '#0a59f7';
        }
      },
      tip: (a) => {
        //@ts-ignore
        if (a && a[0]) {
          let tip: string = '';
          tip = `<div>
                    <div>Average count: ${
                      //@ts-ignore
                      a[0].obj.yAverage
                    }</div>
                </div>`;
          return tip;
        } else {
          return '';
        }
      },
      label: null,
    };
  }

  tHeadClick(data: Array<SliceGroup>): void {
    let labels = this.threadBindersTbl?.shadowRoot?.querySelector('.th > .td')?.querySelectorAll('label');
    if (labels) {
      for (let i = 0; i < labels.length; i++) {
        let label = labels[i].innerHTML;
        labels[i].addEventListener('click', (e) => {
          if (label.includes('Process')) {
            this.threadBindersTbl!.setStatus(data, false);
            this.threadBindersTbl!.recycleDs = this.threadBindersTbl!.meauseTreeRowElement(
              data,
              RedrawTreeForm.Retract
            );
          } else if (label.includes('Thread')) {
            for (let item of data) {
              item.status = true;
              if (item.children !== undefined && item.children.length > 0) {
                this.threadBindersTbl!.setStatus(item.children, false);
              }
            }
            this.threadBindersTbl!.recycleDs = this.threadBindersTbl!.meauseTreeRowElement(
              data,
              RedrawTreeForm.Retract
            );
          } else if (label.includes('Cycle')) {
            this.threadBindersTbl!.setStatus(data, true);
            this.threadBindersTbl!.recycleDs = this.threadBindersTbl!.meauseTreeRowElement(data, RedrawTreeForm.Expand);
          }
        });
      }
    }
  }

  //点击Thread行表格数据时
  tableRowClickFunc(): void {
    this.threadBindersTbl!.addEventListener('row-click', (evt: any) => {
      let currentData = evt.detail.data;
      if (currentData.type === 'Process') {
        currentData.isSelected = true;
        this.threadBindersTbl!.clearAllSelection(currentData);
        this.threadBindersTbl!.setCurrentSelection(currentData);
        this.hideQueryArea(true);
        SpSegmentationChart.setBinderChartData([]);
        SpSegmentationChart.tabHover('BINDER', false, -1);
      }
      if (currentData.type === 'Thread') {
        SpSegmentationChart.tabHover('BINDER', false, -1);
        this.currentThreadId = currentData.tid + '' + currentData.pid;
        this.clearCycleRange();
        currentData.isSelected = true;
        this.threadBindersTbl!.clearAllSelection(currentData);
        this.threadBindersTbl!.setCurrentSelection(currentData);
        this.rowCycleData = currentData.children;
        this.hideQueryArea(false);
        let totalCount = currentData.totalCount;
        this.dataSource = [];
        this.dataSource.push({
          xName: 'Total',
          yAverage: totalCount > 0 ? Math.ceil(totalCount / this.rowCycleData!.length) : 0,
        });
        //绘制柱状图
        this.drawColumn();
        let laneChartData: Array<BinderDataStruct[]> = this.structuredLaneChartData(currentData.children!);
        //绘制泳道图
        SpSegmentationChart.setBinderChartData(laneChartData);
      }

      if (currentData.type === 'Cycle' && currentData.tid + '' + currentData.pid === this.currentThreadId) {
        currentData.isSelected = true;
        this.threadBindersTbl!.clearAllSelection(currentData);
        this.threadBindersTbl!.setCurrentSelection(currentData);
        //泳道图的鼠标悬浮
        SpSegmentationChart.tabHover('BINDER', true, currentData.idx);
      }
    });
  }

  //点击query按钮绘制柱状图
  queryBtnClick(): void {
    this.shadowRoot?.querySelector('#query-btn')?.addEventListener('click', () => {
      this.cycleARangeArr = this.rowCycleData?.filter((it: CycleBinderItem) => {
        return (
          it.cycleDur >= Number(this.cycleAStartRangeDIV!.value) && it.cycleDur < Number(this.cycleAEndRangeDIV!.value)
        );
      });
      this.cycleBRangeArr = this.rowCycleData?.filter((it: CycleBinderItem) => {
        return (
          it.cycleDur >= Number(this.cycleBStartRangeDIV!.value) && it.cycleDur < Number(this.cycleBEndRangeDIV!.value)
        );
      });
      let cycleACount: number = 0;
      this.cycleARangeArr?.forEach((it: CycleBinderItem) => {
        cycleACount += it.totalCount;
      });
      let cycleBCount: number = 0;
      this.cycleBRangeArr?.forEach((it: CycleBinderItem) => {
        cycleBCount += it.totalCount;
      });
      this.dataSource!.length > 1 && this.dataSource?.splice(1);
      this.dataSource!.push({
        xName: 'cycleA',
        yAverage: cycleACount !== 0 ? Math.ceil(cycleACount / this.cycleARangeArr!.length) : 0,
      });
      this.dataSource!.push({
        xName: 'cycleB',
        yAverage: cycleBCount !== 0 ? Math.ceil(cycleBCount / this.cycleBRangeArr!.length) : 0,
      });
      this.drawColumn();
    });
  }

  initElements(): void {
    this.threadBindersTbl = this.shadowRoot?.querySelector<LitTable>('#tb-binder-count');
    this.chartTotal = this.shadowRoot!.querySelector<LitChartColumn>('#chart_cycle');
    this.cycleAStartRangeDIV = this.shadowRoot?.querySelector('#cycle-a-start-range');
    this.cycleAEndRangeDIV = this.shadowRoot?.querySelector('#cycle-a-end-range');
    this.cycleBStartRangeDIV = this.shadowRoot?.querySelector('#cycle-b-start-range');
    this.cycleBEndRangeDIV = this.shadowRoot?.querySelector('#cycle-b-end-range');
    this.cycleColumnDiv = this.shadowRoot?.querySelector('#cycleColumn');
    this.threadStatesDIV = this.shadowRoot!.querySelector('#dataCut');
    this.threadStatesDIV?.children[2].children[0].addEventListener('click', (e) => {
      this.hideQueryArea(true);
      this.dataSource = [];
      // @ts-ignore
      this.dataCutFunc(this.threadStatesDIV!.children[0], this.threadStatesDIV?.children[1], 'single');
    });
    this.threadStatesDIV?.children[2].children[1].addEventListener('click', (e) => {
      this.hideQueryArea(true);
      this.dataSource = [];
      // @ts-ignore
      this.dataCutFunc(this.threadStatesDIV?.children[0], this.threadStatesDIV?.children[1], 'loop');
    });
    this.tableRowClickFunc();
    this.queryBtnClick();
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.threadBindersTbl!);
  }

  initHtml(): string {
    return `
        <style>
        :host{
            padding: 10px 10px;
            display: flex;
            flex-direction: column;
        }
        #dataCut{
            display: flex;
            justify-content: space-between;
            width:100%;
            height:20px;
            padding:auto;
            align-items:center;
        }
        button{
            width:40%;
            min-width:90px;
            height:100%;
            border: solid 1px #666666;
            background-color: rgba(0,0,0,0);
            border-radius:10px;
            cursor: pointer;
        }
        button:hover{
            background-color:#666666;
            color:white;
        }
        :host([clickSingle]) .click_single{
            background-color:#666666;
            color:white;
        }
        :host([clickLoop]) .click_loop{
            background-color:#666666;
            color:white;
        }
        .thread-id-input{
            width: 15%;
            height:90%;
            border-radius:10px;
            border:solid 1px #979797;
            font-size:15px;
            text-indent:3%
        }
        .cycle-name-input{
            width: 20%;
            height:90%;
            border-radius:10px;
            border:solid 1px #979797;
            font-size:15px;
            text-indent:3%
        }
        .data-cut-area{
            width:20%;
            height: 100%;
            display:flex;
            justify-content: space-around;
        }
        .main-area{
            width:100%;
            display:flex;
            margin-top:5px;
        }
        lit-table{
            height: auto;
            overflow-x:auto;
            width:100%
        }
        #query-btn{
            width:90px;
        }
        .cycle-range-input {
            width: 24%;
            height: 18px;
            padding: 1px 5px;
            border-radius: 12px;
            border: solid 1px #979797;
            font-size: 15px;
            text-indent: 3%
        }
        :host([hideQueryArea]) .query-cycle-area{
            display: none;
        }
        #chart_cycle{
            width:100%;
            height:300px;
        }
        .chart_labels{
            height: 30px;
            width: 100%;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            margin-top:12px;
            margin-bottom:20px;
        }
        .labels{
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            font-size: 9pt;
            padding-right: 15px;
        }
        .labels_item{
            width: 20px;
            height: 10px;
            background-color: #2f72f8;
            margin-right: 5px;
        }
        .chart_area{
            margin-top:20px;
        }
        .chart_title{
            line-height: 40px;
            height: 40px;
            width: 100%;
            text-align: center;
        }
        </style>
        <div id='dataCut'>
            <input id="dataCutThreadId" type="text" class="thread-id-input" placeholder="Please input thread id" value='' onblur="this.value=this.value.replace(/[^0-9.]/g,'')" />
            <input id="dataCutThreadFunc" type="text" class="cycle-name-input" placeholder="Please input function name" value='' />
            <div class="data-cut-area">
                <button id="single-btn" class="click_single">Single</button>
                <button id="loop-btn" class="click_loop">Loop</button>
            </div>
        </div>
        <div class="main-area">
            <lit-slicer style="width:100%">
                <div style="width:65%;">
                    <lit-table id="tb-binder-count" style="height: auto; overflow-x:auto;width:100%" tree>
                        <lit-table-column width="250px" title="Process/Thread/Cycle" data-index="title" key="title"  align="flex-start" retract>
                        </lit-table-column>
                        <lit-table-column width="100px" title="Total count" data-index="totalCount" key="totalCount" align="center">
                        </lit-table-column>
                        <lit-table-column width="100px" title="Binder transaction count" data-index="binderTransactionCount" key="binderTransactionCount" align="center">
                        </lit-table-column>
                        <lit-table-column width="100px" title="Binder transaction async count" data-index="binderTransactionAsyncCount" key="binderTransactionAsyncCount" align="center">
                        </lit-table-column>
                        <lit-table-column width="100px" title="Binder reply count" data-index="binderReplyCount" key="binderReplyCount" align="center">
                        </lit-table-column>
                        <lit-table-column width="100px" title="Binder async rcv count" data-index="binderAsyncRcvCount" key="binderAsyncRcvCount" align="center">
                        </lit-table-column>
                        <lit-table-column width="100px" title="Cycle start time(ms)" data-index="cycleStartTime" key="cycleStartTime" align="flex-start">
                        </lit-table-column>
                        <lit-table-column width="110px" title="Duration(ms)" data-index="cycleDur" key="cycleDur" align="flex-start">
                        </lit-table-column>
                    </lit-table>
                </div>
                <lit-slicer-track ></lit-slicer-track>
                <div style="width:35%;min-width:350px;padding:16px;overflow:auto;" id="cycleColumn" class="query-cycle-area">
                    <div id="cycle-a"  style="width:84%">
                        <span>Cycle A: </span>
                        <input id="cycle-a-start-range" type="text" class="cycle-range-input" placeholder="Duration(ms)" value='' onblur="this.value=this.value.replace(/[^0-9.]/g,'')" />
                        <span>~</span>
                        <input id="cycle-a-end-range" type="text" class="cycle-range-input" placeholder="Duration(ms)" value='' onblur="this.value=this.value.replace(/[^0-9.]/g,'')" />
                    </div>
                    <div style="margin-top: 10px; display:flex; flex-derection:row; justify-content:space-between;width:100%">
                        <div id="cycle-b" style="width:84%">
                            <span>Cycle B: </span>
                            <input id="cycle-b-start-range" type="text" class="cycle-range-input" placeholder="Duration(ms)" value='' onblur="this.value=this.value.replace(/[^0-9.]/g,'')" />
                            <span>~</span>
                            <input id="cycle-b-end-range" type="text" class="cycle-range-input" placeholder="Duration(ms)" value='' onblur="this.value=this.value.replace(/[^0-9.]/g,'')" />
                        </div>
                        <div>
                            <button id="query-btn">Query</button>
                        </div>
                    </div>
                    <div class="chart_area">
                        <div class="chart_title">Average Binder Count</div>
                        <lit-chart-column id="chart_cycle"></lit-chart-column>
                        <div class="chart_labels">
                            <div class="labels"><div class="labels_item"></div>Total</div>
                            <div class="labels"><div class="labels_item" style="background-color: #ffab67;"></div>Cycle A</div>
                            <div class="labels"><div class="labels_item" style="background-color: #a285d2;"></div>Cycle B</div>
                        </div>
                    </div>
                </div>
            </lit-slicer>
        </div>
        `;
  }
}
