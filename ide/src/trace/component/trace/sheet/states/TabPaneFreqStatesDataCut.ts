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
import { LitTable, RedrawTreeForm } from '../../../../../base-ui/table/lit-table';
import { Utils } from '../../base/Utils';
import { SelectionParam } from '../../../../bean/BoxSelection';
import { BinderGroup, DataSource } from '../../../../bean/BinderProcessThread';
import {
  querySingleFuncNameCycleStates,
  queryStatesCut,
  queryLoopFuncNameCycle,
} from '../../../../database/sql/Func.sql';
import { FuncNameCycle } from '../../../../bean/BinderProcessThread';
import { resizeObserver } from '../SheetUtils';
import { LitChartColumn } from '../../../../../base-ui/chart/column/LitChartColumn';
import '../../../../../base-ui/chart/column/LitChartColumn';
import { SpSegmentationChart } from '../../../chart/SpSegmentationChart';
import { StateGroup } from '../../../../bean/StateModle';
import { TraceSheet } from '../../base/TraceSheet';
import { Flag } from '../../timer-shaft/Flag';
import { TraceRow } from '../../base/TraceRow';
import { Rect, ns2x } from '../../../../database/ui-worker/ProcedureWorkerCommon';
import { SpSystemTrace } from '../../../SpSystemTrace';

@element('tabpane-states-datacut')
export class TabPaneFreqStatesDataCut extends BaseElement {
  private threadBindersTbl: LitTable | null | undefined;
  private currentSelectionParam: SelectionParam | any;
  private threadStatesDIV: Element | null | undefined;
  private cycleARangeArr: StateGroup[] | undefined;
  private cycleBRangeArr: StateGroup[] | undefined;
  private cycleAStartRangeDIV: HTMLInputElement | null | undefined;
  private cycleAEndRangeDIV: HTMLInputElement | null | undefined;
  private cycleBStartRangeDIV: HTMLInputElement | null | undefined;
  private cycleBEndRangeDIV: HTMLInputElement | null | undefined;
  private chartTotal: LitChartColumn | null | undefined;
  private dataSource: DataSource[] | undefined;
  private rowCycleData: StateGroup[] | undefined;
  private funcNameCycleArr: FuncNameCycle[] | undefined;
  private currentThreadId: string | undefined;
  private cycleStartTime: number | undefined;
  private cycleEndTime: number | undefined;
  private filterState: Array<StateGroup> = [];
  private traceSheetEl: TraceSheet | undefined | null;
  private spSystemTrace: SpSystemTrace | undefined | null;
  private lineCycleNum: number = -1;
  private cycleIsClick: Boolean = false;
  static isStateTabHover: boolean = false;

  // tab页入口函数
  set data(threadStatesParam: SelectionParam | any) {
    // 获取输入框
    let threadIdDIV = this.shadowRoot!.querySelector('.thread-id-input') as HTMLElement;
    threadIdDIV.style.border = '1px solid rgb(151,151,151)';
    let cycleNameDIV = this.shadowRoot!.querySelector('.cycle-name-input') as HTMLElement;
    cycleNameDIV.style.border = '1px solid rgb(151,151,151)';
    if (this.currentSelectionParam === threadStatesParam) {
      return;
    }
    // 隐藏右半边区域
    this.dispalyQueryArea(true);
    // 清空切割按钮状态
    this.clickLoop(false);
    this.clickSingle(false);
    this.currentSelectionParam = threadStatesParam;
    // 清空表格数据
    this.threadBindersTbl!.recycleDataSource = [];
    this.theadClick(this.threadBindersTbl!.recycleDataSource as Array<BinderGroup>);
  }

  initTabSheetEl(traceSheet: TraceSheet): void {
    this.traceSheetEl = traceSheet;
  }

  dispalyQueryArea(b: boolean) {
    if (b) {
      this.setAttribute('dispalyQueryArea', '');
    } else {
      this.removeAttribute('dispalyQueryArea');
    }
  }

  clickSingle(b: boolean) {
    if (b) {
      this.setAttribute('clickSingle', '');
    } else {
      this.removeAttribute('clickSingle');
    }
  }

  clickLoop(b: boolean) {
    if (b) {
      this.setAttribute('clickLoop', '');
    } else {
      this.removeAttribute('clickLoop');
    }
  }

  // LOOP切割方法
  async dataLoopCut(threadId: HTMLInputElement, threadFunc: HTMLInputElement): Promise<void> {
    // 清除表格数据
    SpSegmentationChart.setStateChartData([]);
    // 获取框选范围内包含的进程和线程ID
    let threadIds: number[] = this.currentSelectionParam.threadIds;
    let processIds: number[] = this.currentSelectionParam.processIds;
    // 获取输入的进程号和方法名
    let threadIdValue: string = threadId.value.trim();
    let threadFuncName: string = threadFunc.value.trim();
    // 获取框选的左右边界
    let leftNS: number = this.currentSelectionParam.leftNs;
    let rightNS: number = this.currentSelectionParam.rightNs;
    // 判断进程号和方法名是否都输入了内容
    if (threadIdValue !== '' && threadFuncName !== '') {
      // 修改按钮样式
      this.clickLoop(true);
      this.clickSingle(false);
      threadId.style.border = '1px solid rgb(151,151,151)';
      threadFunc.style.border = '1px solid rgb(151,151,151)';
      this.threadBindersTbl!.loading = true;
      this.funcNameCycleArr = await queryLoopFuncNameCycle(threadFuncName, threadIdValue, leftNS, rightNS);
      this.cycleStartTime = this.funcNameCycleArr!.length > 0 ? this.funcNameCycleArr![0].cycleStartTime : undefined;
      this.cycleEndTime =
        this.funcNameCycleArr!.length > 1
          ? this.funcNameCycleArr![this.funcNameCycleArr!.length - 1].cycleStartTime
          : undefined;
      // 遍历设置周期的起始时间
      for (let i = 0; i < this.funcNameCycleArr!.length - 1; i++) {
        this.funcNameCycleArr![i].endTime = this.funcNameCycleArr![i + 1].cycleStartTime;
      }
      // 框选范围内的状态数据
      let stateItemArr = await queryStatesCut(threadIds, leftNS, rightNS);
      // 周期数组里的最后一项不满足loop要求,直接删除
      this.funcNameCycleArr!.pop();
      if (this.funcNameCycleArr!.length !== 0) {
        let stateCutArr: StateGroup[] = [];
        // pid数组去重
        processIds = Array.from(new Set(processIds));
        // 去除切割范围以外的数据
        this.filterState = new Array<StateGroup>();
        stateItemArr.map((stateItem) => {
          for (let i = 0; i < this.funcNameCycleArr!.length; i++) {
            if (
              ((stateItem.ts > this.funcNameCycleArr![i].cycleStartTime && stateItem.ts < this.funcNameCycleArr![i].endTime) ||
                (stateItem.ts + stateItem.dur! > this.funcNameCycleArr![i].cycleStartTime && 
                  stateItem.ts + stateItem.dur! < this.funcNameCycleArr![i].endTime) ||
                (this.funcNameCycleArr![i].cycleStartTime > stateItem.ts && this.funcNameCycleArr![i].endTime < stateItem.ts + stateItem.dur!)) &&
              (stateItem.state === 'S' ||
                stateItem.state === 'R' ||
                stateItem.state === 'D' ||
                stateItem.state === 'Running')
            ) {
              stateItem.startTs = stateItem.ts;
              stateItem.chartDur = stateItem.dur;
              this.filterState!.push(stateItem);
            }
          }
        });
        this.filterState = Array.from(new Set(this.filterState));
        // 周期内有数据
        if (this.filterState.length !== 0) {
          for (let i = 0; i < processIds.length; i++) {
            this.setProcessData(this.filterState, processIds[i], stateCutArr);
          }
        }
        this.threadBindersTbl!.recycleDataSource = stateCutArr;
        this.threadBindersTbl!.loading = false;
        // 表格添加点击事件
        this.theadClick(this.threadBindersTbl!.recycleDataSource as Array<BinderGroup>);
      } else {
        this.threadBindersTbl!.recycleDataSource = [];
        this.threadBindersTbl!.loading = false;
        this.theadClick(this.threadBindersTbl!.recycleDataSource as Array<BinderGroup>);
      }
    } else {
      this.verifyInputIsEmpty(threadIdValue, threadFuncName, threadId, threadFunc);
    }
  }

  async dataSingleCut(threadId: HTMLInputElement, threadFunc: HTMLInputElement): Promise<void> {
    SpSegmentationChart.setStateChartData([]);
    this.currentThreadId = '';
    let threadIds: number[] = this.currentSelectionParam.threadIds;
    let processIds: number[] = this.currentSelectionParam.processIds;
    let threadIdValue: string = threadId.value.trim();
    let threadFuncName: string = threadFunc.value.trim();
    let leftNS: number = this.currentSelectionParam.leftNs;
    let rightNS: number = this.currentSelectionParam.rightNs;
    if (threadIdValue !== '' && threadFuncName !== '') {
      this.clickLoop(false);
      this.clickSingle(true);
      threadId.style.border = '1px solid rgb(151,151,151)';
      threadFunc.style.border = '1px solid rgb(151,151,151)';
      this.threadBindersTbl!.loading = true;
      this.funcNameCycleArr = await querySingleFuncNameCycleStates(threadFuncName, threadIdValue, leftNS, rightNS);
      this.cycleStartTime = this.funcNameCycleArr!.length > 0 ? this.funcNameCycleArr![0].cycleStartTime : undefined;
      this.cycleEndTime =
        this.funcNameCycleArr!.length > 0
          ? this.funcNameCycleArr![this.funcNameCycleArr!.length - 1].endTime
          : undefined;
      let stateItemArr = await queryStatesCut(threadIds, leftNS, rightNS);
      if (this.funcNameCycleArr!.length !== 0) {
        let stateCutArr: StateGroup[] = [];
        // pid数组去重
        processIds = Array.from(new Set(processIds));
        // 去除切割范围以外的数据
        this.filterState = new Array<StateGroup>();
        stateItemArr.map((stateItem) => {
          for (let i = 0; i < this.funcNameCycleArr!.length; i++) {
            if (
              ((stateItem.ts > this.funcNameCycleArr![i].cycleStartTime && stateItem.ts < this.funcNameCycleArr![i].endTime) ||
                (stateItem.ts + stateItem.dur! > this.funcNameCycleArr![i].cycleStartTime && 
                  stateItem.ts + stateItem.dur! < this.funcNameCycleArr![i].endTime) ||
                (this.funcNameCycleArr![i].cycleStartTime > stateItem.ts && this.funcNameCycleArr![i].endTime < stateItem.ts + stateItem.dur!)) &&
              (stateItem.state === 'S' ||
                stateItem.state === 'R' ||
                stateItem.state === 'D' ||
                stateItem.state === 'Running')
            ) {
              stateItem.startTs = stateItem.ts;
              stateItem.chartDur = stateItem.dur;
              // @ts-ignore 周期第一条数据开始时间设置为周期开始时间
              if (stateItem.ts + stateItem.dur > this.funcNameCycleArr[i].cycleStartTime && stateItem.ts < this.funcNameCycleArr[i].cycleStartTime) {
                stateItem.dur = stateItem.ts + stateItem.dur! - this.funcNameCycleArr![i].cycleStartTime;
                stateItem.ts = this.funcNameCycleArr![i].cycleStartTime;
              }
              this.filterState!.push(stateItem);
            }
          }
        });
        if (this.filterState.length > 0) {
          for (let i = 0; i < processIds.length; i++) {
            this.setProcessData(this.filterState, processIds[i], stateCutArr);
          }
        }
        this.threadBindersTbl!.recycleDataSource = stateCutArr;
        this.threadBindersTbl!.loading = false;
        this.theadClick(this.threadBindersTbl!.recycleDataSource as BinderGroup[]);
      } else {
        this.threadBindersTbl!.recycleDataSource = [];
        this.threadBindersTbl!.loading = false;
        this.theadClick(this.threadBindersTbl!.recycleDataSource as BinderGroup[]);
      }
    } else {
      this.verifyInputIsEmpty(threadIdValue, threadFuncName, threadId, threadFunc);
    }
  }

  // 处理进程数据
  setProcessData(filterState: StateGroup[], processId: number, stateCutArr: StateGroup[]): void {
    // 当前进程级别的数据
    let filterObj = new StateGroup();
    // 筛选出当前进程下的所有数据
    let processArr = new Array<StateGroup>();
    filterState.map((filterItem) => {
      if (filterItem.pid === processId) {
        processArr.push(filterItem);
        filterObj.totalCount! += 1;
        filterItem.state === 'R'
          ? (filterObj.RunnableCount += 1, filterObj.RunnableDur += filterItem.dur!)
          : filterItem.state === 'Running'
            ? (filterObj.RunningCount += 1, filterObj.RunningDur += filterItem.dur!)
            : filterItem.state === 'D'
              ? (filterObj.DCount += 1, filterObj.DDur += filterItem.dur!)
              : (filterObj.SleepingCount += 1, filterObj.SleepingDur += filterItem.dur!);
        filterObj.title = (Utils.getInstance().getProcessMap().get(processId) || 'Process') + processId;
        filterObj.pid = processId;
        filterObj.type = 'process';
        // @ts-ignore
        filterObj.cycleDur! += filterItem.dur!;
      }
    });
    // @ts-ignore
    filterObj.RunningDur = this.formatNumber(filterObj.RunningDur / 1000000);
    // @ts-ignore
    filterObj.RunnableDur = this.formatNumber(filterObj.RunnableDur / 1000000);
    // @ts-ignore
    filterObj.DDur = this.formatNumber(filterObj.DDur / 1000000);
    // @ts-ignore
    filterObj.SleepingDur = this.formatNumber(filterObj.SleepingDur / 1000000);
    // @ts-ignore
    filterObj.cycleDur = this.formatNumber(filterObj.cycleDur! / 1000000);
    if (processArr.length > 0) {
      filterObj.children = this.setThreadData(processArr);
    }
    stateCutArr.push(filterObj);
  }

  // 是0为0，非0保留三位小数
  formatNumber(num: number): string | 0 {
    return num === 0 ? 0 : num.toFixed(3);
  }

  // 处理线程数据
  setThreadData(threadData: Array<StateGroup>) {
    // 进程下面的线程,相当于process的children
    let threadArr = new Array<StateGroup>();
    let threads = this.currentSelectionParam.threadIds;
    for (let i = 0; i < threads.length; i++) {
      // 单个线程
      let threadObj = new StateGroup();
      threadObj.tid = threads[i];
      threadObj.pid = threadData[0].pid;
      threadObj.children = new Array<StateGroup>();
      threadObj.type = 'thread';
      (threadObj.title = (Utils.getInstance().getProcessMap().get(threads[i]) || 'Process') + threads[i]),
        threadArr.push(threadObj);
    }
    for (let i = 0; i < threadArr.length; i++) {
      let threadList = new Array<StateGroup>();
      threadData.map((threadItem) => {
        if (threadItem.tid === threadArr[i].tid) {
          threadList.push(threadItem);
          threadArr[i].totalCount! += 1;
          threadItem.state === 'R'
            ? ((threadArr[i].RunnableCount += 1), (threadArr[i].RunnableDur += threadItem.dur!))
            : threadItem.state === 'Running'
              ? ((threadArr[i].RunningCount += 1), (threadArr[i].RunningDur += threadItem.dur!))
              : threadItem.state === 'S'
                ? ((threadArr[i].SleepingCount += 1), (threadArr[i].SleepingDur += threadItem.dur!))
                : ((threadArr[i].DCount += 1), (threadArr[i].DDur += threadItem.dur!));
          // @ts-ignore
          threadArr[i].cycleDur! += threadItem.dur!;
        }
      });
      // @ts-ignore
      threadArr[i].SleepingDur = this.formatNumber(threadArr[i].SleepingDur / 1000000);
      // @ts-ignore
      threadArr[i].RunnableDur = this.formatNumber(threadArr[i].RunnableDur / 1000000);
      // @ts-ignore
      threadArr[i].RunningDur = this.formatNumber(threadArr[i].RunningDur / 1000000);
      // @ts-ignore
      threadArr[i].DDur = this.formatNumber(threadArr[i].DDur / 1000000);
      // @ts-ignore
      threadArr[i].cycleDur = this.formatNumber(threadArr[i].cycleDur / 1000000);
      if (threadList.length > 0) {
        threadArr[i].children = this.setCycleData(threadList);
      }
    }
    threadArr = threadArr.filter((V) => {
      return V.totalCount! > 0;
    });
    return threadArr;
  }

  // 处理周期数据
  setCycleData(threadData: Array<StateGroup>): Array<StateGroup> {
    let cycleArr = new Array<StateGroup>();
    if (this.funcNameCycleArr !== undefined && this.funcNameCycleArr.length > 0) {
      for (let i = 0; i < this.funcNameCycleArr!.length; i++) {
        let cycleItem = new StateGroup();
        cycleItem.title = `cycle-${i + 1}`;
        cycleItem.cycle = i;
        threadData.map((v) => {
          if (
            (v.ts > this.funcNameCycleArr![i].cycleStartTime && v.ts < this.funcNameCycleArr![i].endTime) ||
            (v.ts + v.dur! > this.funcNameCycleArr![i].cycleStartTime && v.ts + v.dur! < this.funcNameCycleArr![i].endTime) ||
            (this.funcNameCycleArr![i].cycleStartTime > v.ts && this.funcNameCycleArr![i].endTime < v.ts + v.dur!)
          ) {
            cycleItem.totalCount! += 1;
            v.state === 'R'
              ? ((cycleItem.RunnableCount += 1), (cycleItem.RunnableDur += v.dur!))
              : v.state === 'Running'
                ? ((cycleItem.RunningCount += 1), (cycleItem.RunningDur += v.dur!))
                : v.state === 'S'
                  ? ((cycleItem.SleepingCount += 1), (cycleItem.SleepingDur += v.dur!))
                  : ((cycleItem.DCount += 1), (cycleItem.DDur += v.dur!));
          }
        });
        // @ts-ignore
        cycleItem.SleepingDur = this.formatNumber(cycleItem.SleepingDur / 1000000);
        // @ts-ignore
        cycleItem.RunningDur = this.formatNumber(cycleItem.RunningDur / 1000000);
        // @ts-ignore
        cycleItem.RunnableDur = this.formatNumber(cycleItem.RunnableDur / 1000000);
        // @ts-ignore
        cycleItem.DDur = this.formatNumber(cycleItem.DDur / 1000000);
        cycleItem.cycleDur! = this.formatNumber((this.funcNameCycleArr[i].endTime - this.funcNameCycleArr[i].cycleStartTime) / 1000000);
        cycleItem.type = 'cycle';
        cycleArr.push(cycleItem);
      }
    }
    return cycleArr;
  }

  // 输入框为空点击按钮之后的样式
  verifyInputIsEmpty(
    threadIdValue: string,
    threadFuncName: string,
    threadId: HTMLInputElement,
    threadFunc: HTMLInputElement
  ): void {
    if (threadIdValue === '') {
      threadId.style.border = '1px solid rgb(255,0,0)';
      threadId.setAttribute('placeholder', 'Please input thread id');
    } else {
      threadId.style.border = '1px solid rgb(151,151,151)';
    }

    if (threadFuncName === '') {
      threadFunc.style.border = '1px solid rgb(255,0,0)';
      threadFunc.setAttribute('placeholder', 'Please input function name');
    } else {
      threadFunc.style.border = '1px solid rgb(151,151,151)';
    }
  }

  // 线程点击
  private theadClick(data: Array<BinderGroup>): void {
    let labels = this.threadBindersTbl?.shadowRoot?.querySelector('.th > .td')?.querySelectorAll('label');
    if (labels) {
      for (let i = 0; i < labels.length; i++) {
        let label = labels[i].innerHTML;
        labels[i].addEventListener('click', (e) => {
          if (label.includes('Process') && i === 0) {
            // 数据递归设置status
            this.threadBindersTbl!.setStatus(data, false);
            this.threadBindersTbl!.recycleDs = this.threadBindersTbl!.meauseTreeRowElement(
              data,
              RedrawTreeForm.Retract
            );
          } else if (label.includes('Thread') && i === 1) {
            for (let item of data) {
              item.status = true;
              if (item.children != undefined && item.children.length > 0) {
                this.threadBindersTbl!.setStatus(item.children, false);
              }
            }
            this.threadBindersTbl!.recycleDs = this.threadBindersTbl!.meauseTreeRowElement(
              data,
              RedrawTreeForm.Retract
            );
          } else if (label.includes('Cycle') && i === 2) {
            this.threadBindersTbl!.setStatus(data, true);
            this.threadBindersTbl!.recycleDs = this.threadBindersTbl!.meauseTreeRowElement(data, RedrawTreeForm.Expand);
          }
        });
      }
    }
  }

  initElements(): void {
    this.threadBindersTbl = this.shadowRoot?.querySelector<LitTable>('#tb-binder-count');
    this.chartTotal = this.shadowRoot!.querySelector<LitChartColumn>('#chart_cycle');
    this.cycleAStartRangeDIV = this.shadowRoot?.querySelector('#cycle-a-start-range');
    this.cycleAEndRangeDIV = this.shadowRoot?.querySelector('#cycle-a-end-range');
    this.cycleBStartRangeDIV = this.shadowRoot?.querySelector('#cycle-b-start-range');
    this.cycleBEndRangeDIV = this.shadowRoot?.querySelector('#cycle-b-end-range');

    this.threadStatesDIV = this.shadowRoot!.querySelector('#dataCut');
    this.threadStatesDIV?.children[2].children[0].addEventListener('click', (e) => {
      this.dispalyQueryArea(true);
      this.dataSource = [];
      // @ts-ignore
      this.dataSingleCut(this.threadStatesDIV!.children[0], this.threadStatesDIV?.children[1]);
    });
    this.threadStatesDIV?.children[2].children[1].addEventListener('click', (e) => {
      this.dispalyQueryArea(true);
      this.dataSource = [];
      // @ts-ignore
      this.dataLoopCut(this.threadStatesDIV?.children[0], this.threadStatesDIV?.children[1]);
    });

    this.threadBindersTbl!.addEventListener('mouseout', (): void => {
      this.cycleIsClick = false;
      this.lineCycleNum = -1;
      this.traceSheetEl!.systemLogFlag = undefined;
      SpSegmentationChart.tabHoverObj = { key: '', cycle: -1 };
      TabPaneFreqStatesDataCut.isStateTabHover = false;
      this.spSystemTrace?.refreshCanvas(false);
    });

    this.threadBindersTbl!.addEventListener('row-click', (evt: any) => {
      let currentData: StateGroup = evt.detail.data;
      if (currentData.type === 'thread') {
        this.currentThreadId = currentData.tid + '' + currentData.pid;
        this.clearCycleRange();
        currentData.isSelected = true;
        this.threadBindersTbl!.clearAllSelection(currentData);
        this.threadBindersTbl!.setCurrentSelection(currentData);
        this.rowCycleData = currentData.children;
        this.dispalyQueryArea(false);
        let totalCount =
          currentData.SleepingCount + currentData.RunnableCount + currentData.DCount + currentData.RunningCount;
        this.dataSource = [];
        this.dataSource.push({
          xName: 'Total',
          yAverage: totalCount !== 0 ? Math.ceil(totalCount! / this.rowCycleData!.length) : 0,
        });
        if (this.dataSource!.length !== 0) {
          this.drawColumn();
        }
        let statesChartData = this.filCycleData(currentData.pid, currentData.tid);
        SpSegmentationChart.setStateChartData(statesChartData);
      }
      if (currentData.type === 'cycle') {
        currentData.isSelected = true;
        this.threadBindersTbl!.clearAllSelection(currentData);
        this.threadBindersTbl!.setCurrentSelection(currentData);
        if (currentData.cycle === this.lineCycleNum && this.cycleIsClick === true) {
          this.traceSheetEl!.systemLogFlag = undefined;
          SpSegmentationChart.tabHoverObj = { key: '', cycle: -1 };
          TabPaneFreqStatesDataCut.isStateTabHover = false;
          this.cycleIsClick = false;
        } else {
          SpSegmentationChart.tabHoverObj = { key: '', cycle: -1 };
          let pointX: number = ns2x(
            this.funcNameCycleArr![currentData.cycle].cycleStartTime || 0,
            TraceRow.range!.startNS,
            TraceRow.range!.endNS,
            TraceRow.range!.totalNS,
            new Rect(0, 0, TraceRow.FRAME_WIDTH, 0)
          );
          SpSegmentationChart.tabHoverObj.key = 'STATES';
          SpSegmentationChart.trace.traceSheetEL!.systemLogFlag = new Flag(
            Math.floor(pointX),
            0,
            0,
            0,
            this.funcNameCycleArr![currentData.cycle].cycleStartTime!,
            '#000000',
            '',
            true,
            ''
          );
          TabPaneFreqStatesDataCut.isStateTabHover = true;
          this.lineCycleNum = currentData.cycle;
          this.cycleIsClick = true;
        }
        SpSegmentationChart.trace.refreshCanvas(false);
      }
    });

    // 筛选柱状图数据
    this.shadowRoot?.querySelector('#query-btn')?.addEventListener('click', () => {
      this.cycleARangeArr = this.rowCycleData?.filter((it: StateGroup) => {
        return (
          // @ts-ignore
          it.cycleDur! >= Number(this.cycleAStartRangeDIV!.value) &&
          // @ts-ignore
          it.cycleDur! < Number(this.cycleAEndRangeDIV!.value)
        );
      });
      this.cycleBRangeArr = this.rowCycleData?.filter((it: StateGroup) => {
        return (
          // @ts-ignore
          it.cycleDur! >= Number(this.cycleBStartRangeDIV!.value) &&
          // @ts-ignore
          it.cycleDur! < Number(this.cycleBEndRangeDIV!.value)
        );
      });
      let cycleACount: number = 0;
      this.cycleARangeArr?.forEach((it: StateGroup) => {
        cycleACount += it.totalCount!;
      });
      let cycleBCount: number = 0;
      this.cycleBRangeArr?.forEach((it: StateGroup) => {
        cycleBCount += it.totalCount!;
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
      if (this.dataSource!.length !== 0) {
        this.drawColumn();
      }
    });
  }

  // 筛选出点击的线程数据
  filCycleData(pid: number, tid: number): Array<StateGroup> {
    return this.filterState?.filter((v: StateGroup) => {
      return v.pid === pid && v.tid === tid && (
        (v.ts > this.cycleStartTime! && v.ts < this.cycleEndTime!) ||
        (v.ts + v.dur! > this.cycleStartTime! && v.ts + v.dur! < this.cycleEndTime!) ||
        (this.cycleStartTime! > v.ts && this.cycleEndTime! < v.ts + v.dur!));
    })
  };

  // 清空dur筛选输入框内容
  clearCycleRange(): void {
    this.cycleAStartRangeDIV!.value = '';
    this.cycleAEndRangeDIV!.value = '';
    this.cycleBStartRangeDIV!.value = '';
    this.cycleBEndRangeDIV!.value = '';
  }

  // 画柱状图
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
        const xName = a.xName;
        if (xName === 'Total') {
          return '#2f72f8';
        } else if (xName === 'cycleA') {
          return '#ffab67';
        } else if (xName === 'cycleB') {
          return '#a285d2';
        } else {
          return '#0a59f7';
        }
      },
      tip: (a) => {
        //@ts-ignore
        if (a && a[0]) {
          //@ts-ignore
          const obj = a[0];
          let tip: string = '';
          tip = `<div>
                    <div>Average count: ${obj.obj.yAverage}</div>
                </div>`;
          return tip;
        } else {
          return '';
        }
      },
      label: null,
    };
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.threadBindersTbl!);
  }

  // 页面结构

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
            width: 120px;
            height: 18px;
            padding: 1px 5px;
            border-radius: 12px;
            border: solid 1px #979797;
            font-size: 15px;
            text-indent: 3%
        }
        :host([dispalyQueryArea]) .query-cycle-area{
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
            margin-top:40px;
            height:0;
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
                <div style="width:70%;">
                    <lit-table id="tb-binder-count" style="height: auto; overflow-x:auto;width:100%;" tree>
                        <lit-table-column width="250px" title="Process/Thread/Cycle" data-index="title" key="title"  align="flex-start" retract>
                        </lit-table-column>
                        <lit-table-column width="80px" title="Running count" data-index="RunningCount" key="RunningCoung" align="center">
                        </lit-table-column>
                        <lit-table-column width="80px" title="Running dur(ms)" data-index="RunningDur" key="RunningDur" align="center">
                        </lit-table-column>
                        <lit-table-column width="80px" title="Runnable count" data-index="RunnableCount" key="RunnableCount" align="center">
                        </lit-table-column>
                        <lit-table-column width="80px" title="Runnable dur(ms)" data-index="RunnableDur" key="RunnableDur" align="center">
                        </lit-table-column>
                        <lit-table-column width="80px" title="Sleeping count" data-index="SleepingCount" key="SleepingCount" align="center">
                        </lit-table-column>
                        <lit-table-column width="80px" title="Sleeping dur(ms)" data-index="SleepingDur" key="SleepingDur" align="center">
                        </lit-table-column>
                        <lit-table-column width="80px" title="D count" data-index="DCount" key="DCount" align="center">
                        </lit-table-column>
                        <lit-table-column width="80px" title="D dur(ms)" data-index="DDur" key="DDUR" align="center">
                        </lit-table-column>
                        <lit-table-column width="80px" title="Duration(ms)" data-index="cycleDur" key="cycleDur" align="center">
                        </lit-table-column>
                        <lit-table-column width="80px"  title="Total" data-index="totalCount" key="totalCount" align="center">
                        </lit-table-column>
                    </lit-table>
                </div>
                <lit-slicer-track ></lit-slicer-track>
                <div style="width:30%;padding: 16px;height:auto;overflow:auto;" class="query-cycle-area">
                    <div >
                        <div id="cycle-a">
                            <span>Cycle A: </span>
                            <input id="cycle-a-start-range" type="text" class="cycle-range-input" placeholder="Duration(ms)" value='' onblur="this.value=this.value.replace(/[^0-9.]/g,'')" />
                            <span>~</span>
                            <input id="cycle-a-end-range" type="text" class="cycle-range-input" placeholder="Duration(ms)" value='' onblur="this.value=this.value.replace(/[^0-9.]/g,'')" />
                        </div>
                        <div style="margin-top: 10px; display:flex; flex-derection:row; justify-content:space-between">
                            <div id="cycle-b">
                                <span>Cycle B: </span>
                                <input id="cycle-b-start-range" type="text" class="cycle-range-input" placeholder="Duration(ms)" value='' onblur="this.value=this.value.replace(/[^0-9.]/g,'')" />
                                <span>~</span>
                                <input id="cycle-b-end-range" type="text" class="cycle-range-input" placeholder="Duration(ms)" value='' onblur="this.value=this.value.replace(/[^0-9.]/g,'')" />
                            </div>
                            <div>
                                <button id="query-btn">Query</button>
                            </div>
                        </div>
                    </div>
                    <div class="chart_area">
                        <div class="chart_title">Average State Count</div>
                        <lit-chart-column id="chart_cycle"></lit-chart-column>
                        <div class="chart_labels">
                            <div class="labels"><div class="labels_item"></div>Total</div>
                            <div class="labels"><div class="labels_item" style="background-color: #ffab67;"></div>CycleA</div>
                            <div class="labels"><div class="labels_item" style="background-color: #a285d2;"></div>CycleB</div>
                        </div>
                    </div>
                </div>
            </lit-slicer>
        </div>
        `;
  }
}
