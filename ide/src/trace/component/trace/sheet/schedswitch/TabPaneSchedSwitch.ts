/*
 * Copyright (C) 2023 Huawei Device Co., Ltd.
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
import { LitButton } from '../../../../../base-ui/button/LitButton';
import { LitTable, RedrawTreeForm } from '../../../../../base-ui/table/lit-table';
import { SelectionData, SelectionParam } from '../../../../bean/BoxSelection';
import {
  querySchedThreadStates,
  querySingleCutData,
  queryLoopCutData,
} from '../../../../database/sql/ProcessThread.sql';
import { Utils } from '../../base/Utils';
import { resizeObserver } from '../SheetUtils';
import { LitChartColumn } from '../../../../../base-ui/chart/column/LitChartColumn';
import { SpSegmentationChart } from '../../../../../trace/component/chart/SpSegmentationChart';
import {
  type TreeSwitchConfig,
  HistogramSourceConfig,
  ThreadInitConfig,
  CutDataObjConfig,
  SchedSwitchCountBean,
} from '../../../../bean/SchedSwitchStruct';
const UNIT: number = 1000000.0;
const NUM_DIGITS: number = 3;
const SINGLE_BUTTON_TEXT: string = 'Single';
const LOOP_BUTTON_TEXT: string = 'Loop';
@element('tabpane-schedswitch')
export class TabPaneSchedSwitch extends BaseElement {
  private schedSwitchTbl: LitTable | null | undefined;
  private threadQueryDIV: Element | null | undefined;
  private rightDIV: HTMLDivElement | null | undefined;
  private threadIdInput: HTMLInputElement | null | undefined;
  private funcNameInput: HTMLInputElement | null | undefined;
  private singleBtn: LitButton | null | undefined;
  private loopBtn: LitButton | null | undefined;
  private cycleALeftInput: HTMLInputElement | null | undefined;
  private cycleARightInput: HTMLInputElement | null | undefined;
  private cycleBLeftInput: HTMLInputElement | null | undefined;
  private cycleBRightInput: HTMLInputElement | null | undefined;
  private queryButton: LitButton | null | undefined;
  private selectionParam: SelectionParam | undefined;
  private canvansName: HTMLDivElement | null | undefined;
  private threadMap: Map<string, Array<ThreadInitConfig>> = new Map<string, Array<ThreadInitConfig>>();
  private chartTotal: LitChartColumn | null | undefined;
  private histogramSource: Array<HistogramSourceConfig> = [];
  private rangeA: HistogramSourceConfig = new HistogramSourceConfig();
  private rangeB: HistogramSourceConfig = new HistogramSourceConfig();
  private rangeTotal: HistogramSourceConfig = new HistogramSourceConfig();
  private getThreadChildren: Array<TreeSwitchConfig> = [];
  private hasThreadStatesData: boolean = false;
  private clickThreadName: string = '';

  set data(threadStatesParam: SelectionParam) {
    if (this.selectionParam === threadStatesParam) {
      return;
    }
    let tabpaneSwitch = this.parentElement as HTMLElement;
    tabpaneSwitch.style.overflow = 'hidden';
    this.schedSwitchTbl!.recycleDataSource = [];
    this.queryButton!.style.pointerEvents = 'none';
    this.schedSwitchTbl!.loading = false;
    this.hasThreadStatesData = false;
    // @ts-ignore
    this.schedSwitchTbl!.value = [];
    this.funcNameInput!.style.border = '1px solid rgb(151,151,151)';
    this.threadIdInput!.style.border = '1px solid rgb(151,151,151)';
    SpSegmentationChart.setChartData('SCHED-SWITCH', []);
    SpSegmentationChart.tabHover('SCHED-SWITCH', false, -1);
    this.canvansName!.textContent = 'sched switch平均分布图';
    this.selectionParam = threadStatesParam;
    this.canQueryButtonClick(false);
    this.isSingleBtnColor(false);
    this.isLoopBtnColor(false);
    this.isCanvansHidden(true);
    //当Tab页发生变化时，ResizeObserver会被通知并且检测到Tab页布局和大小的变化，可以按需求调整页面UI
    new ResizeObserver((entries) => {
      // @ts-ignore
      let lastHeight = this.schedSwitchTbl!.tableElement!.offsetHeight;
      //控制右侧区域高度实时变化与左侧区域Div保持一致，避免滚动滚动条时出现空白的情况
      this.rightDIV!.style.height = String(lastHeight) + 'px';
    }).observe(this.schedSwitchTbl!);
  }
  initElements(): void {
    this.schedSwitchTbl = this.shadowRoot!.querySelector<LitTable>('#tb-running');
    this.threadQueryDIV = this.shadowRoot?.querySelector('#data-cut');
    this.rightDIV = this.shadowRoot?.querySelector('#right');
    this.canvansName = this.shadowRoot!.querySelector<HTMLDivElement>('.sched-subheading');
    this.chartTotal = this.shadowRoot!.querySelector<LitChartColumn>('#chart_total');
    this.threadIdInput = this.shadowRoot?.getElementById('cut-threadid') as HTMLInputElement;
    this.funcNameInput = this.shadowRoot?.querySelector('#cut-thread-func') as HTMLInputElement;
    this.singleBtn = this.shadowRoot?.querySelector<LitButton>('.single-btn');
    this.loopBtn = this.shadowRoot?.querySelector<LitButton>('.loop-btn');
    this.cycleALeftInput = this.shadowRoot?.getElementById('leftA') as HTMLInputElement;
    this.cycleARightInput = this.shadowRoot?.getElementById('rightA') as HTMLInputElement;
    this.cycleBLeftInput = this.shadowRoot?.getElementById('leftB') as HTMLInputElement;
    this.cycleBRightInput = this.shadowRoot?.getElementById('rightB') as HTMLInputElement;
    this.queryButton = this.shadowRoot?.querySelector<LitButton>('.query-btn');
    this.singleBtn?.addEventListener('click', (e) => {
      this.queryCutInfoFn(this.singleBtn!.innerHTML);
    });
    this.loopBtn?.addEventListener('click', (e) => {
      this.queryCutInfoFn(this.loopBtn!.innerHTML);
    });
    this.queryButton!.addEventListener('click', (e) => {
      this.queryCycleRangeData();
    });
    this.threadIdInput!.addEventListener('keyup', (ev) => {
      if (ev.key.toLocaleLowerCase() === String.fromCharCode(47)) {
        ev.stopPropagation();
      }
    });
    this.funcNameInput!.addEventListener('keyup', (ev) => {
      if (ev.key.toLocaleLowerCase() === String.fromCharCode(47)) {
        ev.stopPropagation();
      }
    });
    this.schedSwitchTbl!.addEventListener('row-click', (evt) => {
      this.clickTreeRowEvent(evt);
    });
    this.listenInputEvent();
  }
  //监听周期A、B对应输入框的值
  listenInputEvent(): void {
    this.cycleALeftInput!.addEventListener('input', (evt) => {
      this.checkInputRangeFn(
        this.cycleALeftInput,
        this.cycleARightInput,
        this.cycleBLeftInput,
        this.cycleBRightInput,
        this.cycleALeftInput!.value,
        this.cycleARightInput!.value
      );
    });
    this.cycleARightInput!.addEventListener('input', (evt) => {
      this.checkInputRangeFn(
        this.cycleARightInput,
        this.cycleALeftInput,
        this.cycleBLeftInput,
        this.cycleBRightInput,
        this.cycleALeftInput!.value,
        this.cycleARightInput!.value
      );
    });
    this.cycleBLeftInput!.addEventListener('input', (evt) => {
      this.checkInputRangeFn(
        this.cycleBLeftInput,
        this.cycleBRightInput,
        this.cycleALeftInput,
        this.cycleARightInput,
        this.cycleBLeftInput!.value,
        this.cycleBRightInput!.value
      );
    });
    this.cycleBRightInput!.addEventListener('input', (evt) => {
      this.checkInputRangeFn(
        this.cycleBRightInput,
        this.cycleBLeftInput,
        this.cycleALeftInput,
        this.cycleARightInput,
        this.cycleBLeftInput!.value,
        this.cycleBRightInput!.value
      );
    });
  }
  //校验周期A、B对应输入框的值是否符合要求，不符合时给出相应提示
  checkInputRangeFn(
    firstInput: HTMLInputElement | null | undefined,
    secondInput: HTMLInputElement | null | undefined,
    thirdInput: HTMLInputElement | null | undefined,
    fourInput: HTMLInputElement | null | undefined,
    lVal: string,
    rVal: string
  ): void {
    let leftVal: number = Number(lVal);
    let rightVal: number = Number(rVal);
    if (firstInput!.value !== '' && secondInput!.value !== '') {
      if (firstInput!.value !== '' && secondInput!.value !== '') {
        if (leftVal >= rightVal) {
          firstInput!.style.color = 'red';
          this.queryButton!.style.pointerEvents = 'none';
          this.canQueryButtonClick(false);
        } else if (leftVal < rightVal) {
          firstInput!.style.color = 'black';
          secondInput!.style.color = 'black';
          this.queryButton!.style.pointerEvents = 'auto';
          this.canQueryButtonClick(true);
        }
      }
    } else if (
      (firstInput!.value === '' && secondInput!.value !== '') ||
      (firstInput!.value !== '' && secondInput!.value === '')
    ) {
      this.queryButton!.style.pointerEvents = 'none';
      this.canQueryButtonClick(false);
    } else if (
      firstInput!.value === '' &&
      secondInput!.value === '' &&
      thirdInput!.value !== '' &&
      fourInput!.value !== ''
    ) {
      this.queryButton!.style.pointerEvents = 'auto';
      this.canQueryButtonClick(true);
    }
    if (
      (thirdInput!.value === '' && fourInput!.value !== '') ||
      (thirdInput!.value !== '' && fourInput!.value === '')
    ) {
      this.queryButton!.style.pointerEvents = 'none';
      this.canQueryButtonClick(false);
    }
  }
  //点击树节点不同层级触发相应的功能
  clickTreeRowEvent(evt: Event): void {
    //@ts-ignore
    let data = evt.detail.data;
    if (data.level === 'process') {
      //点击树节点时节点高亮
      data.isSelected = true;
      this.schedSwitchTbl!.clearAllSelection(data);
      this.schedSwitchTbl!.setCurrentSelection(data);
      //点击进程canvans相关内容隐藏
      this.isCanvansHidden(true);
      SpSegmentationChart.setChartData('SCHED-SWITCH', []);
      SpSegmentationChart.tabHover('SCHED-SWITCH', false, -1);
      this.clickThreadName = data.nodeFlag;
    } else if (data.level === 'thread') {
      //点击线程绘制canvans，相同线程canvans不会重新绘制，切换线程时清空周期输入框等相关内容
      if (this.clickThreadName !== data.nodeFlag) {
        this.cycleALeftInput!.value = '';
        this.cycleARightInput!.value = '';
        this.cycleBLeftInput!.value = '';
        this.cycleBRightInput!.value = '';
        this.histogramSource = [];
        SpSegmentationChart.tabHover('SCHED-SWITCH', false, -1); //清空上一次的泳道高亮
        this.getThreadChildren = data.children;
        this.queryButton!.style.pointerEvents = 'none';
        this.isCanvansHidden(false);
        this.canQueryButtonClick(false);
        this.clickThreadName = data.nodeFlag;
        //绘制canvans柱状图需要的数据
        this.rangeTotal = {
          value: data.value,
          cycleNum: data.children.length,
          average: data.children.length ? Math.ceil(data.value / data.children.length) : 0,
          size: 'Total',
          isHover: false,
          color: '#2f72f8',
        };
        this.histogramSource.push(this.rangeTotal);
        //清空高亮的树节点
        this.schedSwitchTbl!.clearAllSelection(data);
        this.drawHistogramChart();
      }
      //点击树节点时高亮
      data.isSelected = true;
      this.schedSwitchTbl!.setCurrentSelection(data);
      //点击线程绘制对应泳道图
      SpSegmentationChart.setChartData('SCHED-SWITCH', data.children);
    } else if (data.level === 'cycle') {
      if (this.clickThreadName === data.nodeFlag) {
        data.isSelected = true;
        this.schedSwitchTbl!.clearAllSelection(data);
        this.schedSwitchTbl!.setCurrentSelection(data);
        SpSegmentationChart.tabHover('SCHED-SWITCH', true, data!.cycle);
      }
    }
  }
  //点击single或loop按钮时触发
  async queryCutInfoFn(btnHtml: string): Promise<void> {
    let funcData: Array<ThreadInitConfig> = [];
    let threadId: string = this.threadIdInput!.value.trim();
    let threadFunName: string = this.funcNameInput!.value.trim();
    let leftStartNs: number = this.selectionParam!.leftNs + this.selectionParam!.recordStartNs;
    let rightEndNs: number = this.selectionParam!.rightNs + this.selectionParam!.recordStartNs;
    if (threadId !== '' && threadFunName !== '') {
      this.threadIdInput!.style.border = '1px solid rgb(151,151,151)';
      this.funcNameInput!.style.border = '1px solid rgb(151,151,151)';
      //@ts-ignore
      this.schedSwitchTbl!.value = [];
      this.isCanvansHidden(true);
      this.schedSwitchTbl!.loading = true;
      this.clickThreadName = '';
      SpSegmentationChart.setChartData('SCHED-SWITCH', []);
      SpSegmentationChart.tabHover('SCHED-SWITCH', false, -1);
      //首次点击single或loop时去查询数据
      if (!this.hasThreadStatesData) {
        this.initThreadStateData(this.selectionParam);
      }
      if (btnHtml === SINGLE_BUTTON_TEXT) {
        this.isSingleBtnColor(true);
        this.isLoopBtnColor(false); //@ts-ignore
        funcData = await querySingleCutData(threadFunName, threadId, leftStartNs, rightEndNs);
      }
      if (btnHtml === LOOP_BUTTON_TEXT) {
        this.isSingleBtnColor(false);
        this.isLoopBtnColor(true); //@ts-ignore
        funcData = await queryLoopCutData(threadFunName, threadId, leftStartNs, rightEndNs);
      }
      //获取到线程数据和方法数据，处理周期
      this.handleCycleLogic(funcData, btnHtml);
    } else {
      if (threadId === '') {
        this.threadIdInput!.style.border = '2px solid rgb(255,0,0)';
        this.threadIdInput!.setAttribute('placeholder', 'Please input thread id');
      } else {
        this.threadIdInput!.style.border = '1px solid rgb(151,151,151)';
      }
      if (threadFunName === '') {
        this.funcNameInput!.style.border = '2px solid rgb(255,0,0)';
        this.funcNameInput!.setAttribute('placeholder', 'Please input function name');
      } else {
        this.funcNameInput!.style.border = '1px solid rgb(151,151,151)';
      }
    }
  }

  //获取每次被框选线程对应的state数据
  async initThreadStateData(threadParam: SelectionParam | null | undefined): Promise<void> {
    let threadSourceData: Array<ThreadInitConfig> = [];
    let leftStartNs: number = threadParam!.leftNs + threadParam!.recordStartNs;
    let rightEndNs: number = threadParam!.rightNs + threadParam!.recordStartNs;
    let processIds: Array<number> = [...new Set(threadParam!.processIds)]; //@ts-ignore
    let res: Array<ThreadInitConfig> = await querySchedThreadStates(
      processIds,
      threadParam!.threadIds,
      leftStartNs,
      rightEndNs
    );
    threadSourceData = JSON.parse(JSON.stringify(res));
    //每次新款选线程时清空Map对象
    this.threadMap.clear();
    //state数据转换成以pid+tid为key值的Map对象
    for (let i = 0; i < threadSourceData.length; i++) {
      let stateItem = threadSourceData[i];
      if (this.threadMap.has(`${stateItem.pid} - ${stateItem.tid}`)) {
        let obj = this.threadMap.get(`${stateItem.pid} - ${stateItem.tid}`);
        obj!.push(stateItem);
      } else {
        this.threadMap.set(`${stateItem.pid} - ${stateItem.tid}`, [stateItem]);
      }
    }
    this.hasThreadStatesData = true;
  }

  //线程下周期的处理逻辑
  handleCycleLogic(res: Array<ThreadInitConfig>, btnHtml: string): void {
    //处理sql查询数据为0条，或者当loop切割获取的数据时1条
    if (res.length === 0 || this.threadMap.size === 0 || (btnHtml === LOOP_BUTTON_TEXT && res.length === 1)) {
      this.schedSwitchTbl!.recycleDataSource = [];
      this.schedSwitchTbl!.loading = false; // @ts-ignore
      this.clickTableLabel(this.schedSwitchTbl!.recycleDataSource);
      return;
    }
    let group: { [key: number]: SchedSwitchCountBean } = {};
    for (let value of this.threadMap.values()) {
      let cyclesArr: Array<SchedSwitchCountBean> = [];
      let processInfo: string | undefined = Utils.getInstance().getProcessMap().get(value[0].pid);
      let process: string | undefined = processInfo === null || processInfo!.length === 0 ? '[NULL]' : processInfo;
      let threadInfo: string | undefined = Utils.getInstance().getThreadMap().get(value[0].tid);
      let thread: string | undefined = threadInfo === null || threadInfo!.length === 0 ? '[NULL]' : threadInfo;
      //整理出一个对象并将周期空数组放进对象里
      let cutDataObj: CutDataObjConfig = {
        cyclesArr: cyclesArr,
        pid: value[0].pid,
        tid: value[0].tid,
        process: process,
        thread: thread,
        processTitle: `${process}[${value[0].pid}]`,
        threadTitle: `${thread}[${[value[0].tid]}]`,
        threadCountTotal: 0,
        threadDurTotal: 0,
      };
      //此处根据切割方法不同处理一下方法循环长度
      for (let idx = 0; idx < (btnHtml === LOOP_BUTTON_TEXT ? res.length - 1 : res.length); idx++) {
        if (btnHtml === LOOP_BUTTON_TEXT) {
          res[idx].cycleEndTime = res[idx + 1].cycleStartTime;
        } //当切割方法为loop时，处理出周期结束时间
        let duration = ((res[idx].cycleEndTime - res[idx].cycleStartTime) / UNIT).toFixed(NUM_DIGITS);
        let dur = Number(duration) * UNIT;
        value.map((item: ThreadInitConfig) => {
          //当idx变化时添加周期
          if (cyclesArr.length !== idx + 1) {
            let nodeFlag = `${process} - ${item.pid} - ${thread} - ${item.tid}`;
            let startNS = res[idx].cycleStartTime - this.selectionParam!.recordStartNs;
            let cycleStartTime = (startNS / UNIT).toFixed(NUM_DIGITS);
            let title = `cycle ${idx + 1}-` + thread; //周期名称
            cyclesArr.push(
              new SchedSwitchCountBean(
                nodeFlag,
                startNS,
                cycleStartTime,
                dur,
                duration,
                idx + 1,
                title,
                0,
                'cycle',
                9,
                []
              )
            );
            cutDataObj!.threadDurTotal = (Number(duration) + Number(cutDataObj.threadDurTotal)).toFixed(NUM_DIGITS); //本次线程下所有周期的dur和
          }
          //判断数据是否符合这个周期，符合的进入判断累加count
          if (res[idx].cycleEndTime > item.endTs && item.endTs > res[idx].cycleStartTime) {
            let index = cyclesArr.length - 1;
            if (index === idx) {
              cyclesArr[index].value += 1;
            }
            cutDataObj.threadCountTotal += 1;
          }
        });
      }
      //本轮线程处理过的数据传入并处理成树结构，放入group对象中
      this.translateIntoTree(cutDataObj, group);
    }
    this.schedSwitchTbl!.recycleDataSource = Object.values(group);
    this.schedSwitchTbl!.loading = false; // @ts-ignore
    this.clickTableLabel(this.schedSwitchTbl!.recycleDataSource);
  }
  //根据处理好的单个线程对应的周期数据、count总数、dur总数以及所属进程、线程相关信息，转换成树结构数据
  translateIntoTree(data: CutDataObjConfig, group: { [key: number]: SchedSwitchCountBean }): void {
    //给进程节点、线程节点添加节点标志
    let nodeFlag = `${data.process} - ${data.pid} - ${data.thread} - ${data.tid}`;
    //将线程放到对应的进程节点下
    let dur = Number(data.threadDurTotal) * UNIT;
    if (group[data.pid]) {
      let process = group[data.pid];
      process.value += data.threadCountTotal;
      process.duration = (Number(data.threadDurTotal) + Number(process.duration)).toFixed(NUM_DIGITS);
      process.children.push(
        new SchedSwitchCountBean(
          nodeFlag,
          -1,
          '',
          dur,
          data.threadDurTotal,
          -1,
          data.threadTitle,
          data.threadCountTotal,
          'thread',
          9,
          data.cyclesArr
        )
      );
    } else {
      group[data.pid] = new SchedSwitchCountBean(
        '',
        -1,
        '',
        dur,
        data.threadDurTotal,
        -1,
        data.processTitle,
        data.threadCountTotal,
        'process',
        9,
        [
          new SchedSwitchCountBean(
            nodeFlag,
            -1,
            '',
            dur,
            data.threadDurTotal,
            -1,
            data.threadTitle,
            data.threadCountTotal,
            'thread',
            9,
            data.cyclesArr
          ),
        ]
      );
    }
  }
  //点击表格标签，判断点击的是那个标签，进而展开或收缩对应的节点
  clickTableLabel(data: Array<TreeSwitchConfig>): void {
    let labelList = this.schedSwitchTbl!.shadowRoot?.querySelector('.th > .td')!.querySelectorAll('label');
    if (labelList) {
      for (let i = 0; i < labelList.length; i++) {
        let lable = labelList[i].innerHTML;
        labelList[i].addEventListener('click', (e) => {
          if (lable.includes('Process')) {
            this.schedSwitchTbl!.setStatus(data, false);
            this.schedSwitchTbl!.recycleDs = this.schedSwitchTbl!.meauseTreeRowElement(data, RedrawTreeForm.Retract);
          } else if (lable.includes('Thread')) {
            for (let item of data) {
              item.status = true;
              if (item.children !== undefined && item.children.length > 0) {
                this.schedSwitchTbl!.setStatus(item.children, false);
              }
            }
            this.schedSwitchTbl!.recycleDs = this.schedSwitchTbl!.meauseTreeRowElement(data, RedrawTreeForm.Retract);
          } else if (lable.includes('Cycle')) {
            this.schedSwitchTbl!.setStatus(data, true);
            this.schedSwitchTbl!.recycleDs = this.schedSwitchTbl!.meauseTreeRowElement(data, RedrawTreeForm.Expand);
          }
        });
      }
    }
  }
  //根据A、B周期输入的dur的范围值，计算对应周期的数据
  queryCycleRangeData(): void {
    let cycleALeft: string = this.cycleALeftInput!.value.trim();
    let cycleARight: string = this.cycleARightInput!.value.trim();
    let cycleBLeft: string = this.cycleBLeftInput!.value.trim();
    let cycleBRight: string = this.cycleBRightInput!.value.trim();
    this.histogramSource = [];
    this.histogramSource.push(this.rangeTotal);
    //周期A处理
    if (cycleALeft !== '' && cycleARight !== '' && cycleALeft !== cycleARight) {
      let countA: number = 0;
      let rangeFilterA: Array<TreeSwitchConfig> = this.getThreadChildren.filter(
        (it: TreeSwitchConfig) => Number(it.duration) >= Number(cycleALeft) && Number(it.duration) < Number(cycleARight)
      );
      rangeFilterA.forEach((item: TreeSwitchConfig) => {
        countA += item.value;
      });
      this.rangeA = {
        value: countA,
        cycleNum: rangeFilterA.length,
        average: rangeFilterA.length ? Math.ceil(countA / rangeFilterA.length) : 0,
        size: 'Cycle A',
        isHover: false,
        color: '#ffab67',
      };
      this.histogramSource.push(this.rangeA);
    }
    //周期B处理
    if (cycleBLeft !== '' && cycleBRight !== '' && cycleBLeft !== cycleBRight) {
      let countB: number = 0;
      let rangeFilterB: Array<TreeSwitchConfig> = this.getThreadChildren.filter(
        (it: TreeSwitchConfig) => Number(it.duration) >= Number(cycleBLeft) && Number(it.duration) < Number(cycleBRight)
      );
      rangeFilterB.forEach((item: TreeSwitchConfig) => {
        countB += item.value;
      });
      this.rangeB = {
        value: countB,
        cycleNum: rangeFilterB.length,
        average: rangeFilterB.length ? Math.ceil(countB / rangeFilterB.length) : 0,
        size: 'Cycle B',
        isHover: false,
        color: '#a285d2',
      };
      this.histogramSource.push(this.rangeB);
    }
    this.drawHistogramChart();
  }
  //绘制柱状图
  drawHistogramChart(): void {
    let source = [];
    source = this.histogramSource.map((it: HistogramSourceConfig, index: number) => {
      let data = {
        cycle: it.size,
        average: it.average,
        visible: 1,
        color: it.color,
      };
      return data;
    });
    this.chartTotal!.config = {
      data: source, //画柱状图的数据源
      appendPadding: 10,
      xField: 'cycle', //x轴代表属于那个周期
      yField: 'average', //y轴代表count/周期个数的值
      notSort: true, //绘制的柱状图不排序
      removeUnit: true, //移除单位换算
      seriesField: '',
      //设置柱状图的颜色
      color(a): string {
        //@ts-ignore
        if (a.cycle === 'Total') {
          return '#2f72f8'; //@ts-ignore
        } else if (a.cycle === 'Cycle A') {
          return '#ffab67'; //@ts-ignore
        } else if (a.cycle === 'Cycle B') {
          return '#a285d2';
        } else {
          return '#0a59f7';
        }
      },
      //鼠标悬浮柱状图上方时显示对应的提示信息
      tip(a): string {
        //@ts-ignore
        if (a && a[0]) {
          let tip = ''; //@ts-ignore
          for (let obj of a) {
            tip = `${tip}
              <div>Average count:${obj.obj.average}</div>
            `;
          }
          return tip;
        } else {
          return '';
        }
      },
      label: null,
    };
  }
  //canvans涉及的区域是否被隐藏
  isCanvansHidden(flag: boolean): void {
    if (flag) {
      this.setAttribute('canvans-hidden', '');
    } else {
      this.removeAttribute('canvans-hidden');
    }
  }
  //切换single按钮时颜色是否变化
  isSingleBtnColor(flag: boolean): void {
    if (flag) {
      this.setAttribute('single', '');
    } else {
      this.removeAttribute('single');
    }
  }
  //切换single按钮时颜色是否变化
  isLoopBtnColor(flag: boolean): void {
    if (flag) {
      this.setAttribute('loop', '');
    } else {
      this.removeAttribute('loop');
    }
  }
  //Query按钮能不能被点击，即在此处设置符合条件时鼠标箭头为手的样式表示可点击，反之表示禁止触发点击事件
  canQueryButtonClick(flag: boolean): void {
    if (flag) {
      this.setAttribute('query-button', '');
    } else {
      this.removeAttribute('query-button');
    }
  }
  //回调函数，this.schedSwitchTbl首次插入DOM时执行的初始化回调
  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.schedSwitchTbl!);
  }
  initHtml(): string {
    return (
      `
      <style>
      :host{
          padding: 10px 10px;
          display: flex;
          flex-direction: column;
      }
      #data-cut{
          display: flex;
          justify-content: space-between;
          width:100%;
          height:20px;
          margin-bottom:2px;
          align-items:center;
      }
      button{
          width:40%;
          height:100%;
          border: solid 1px #666666;
          background-color: rgba(0,0,0,0);
          border-radius:10px;
      }
      #content-section{
          display: flex;
          width: 100%;
      }
      #query-section{
          height: 78px;
          display: flex;
          flex-direction: column;
          justify-content: space-evenly;
          padding: 20px 0px 10px 20px;
      }
      .sched-subheading{
          font-weight: bold;
          text-align: center;
      }
      .labels{
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          font-size: 9pt;
          padding-right: 15px;
      }
    ` +
      this.initStyleContent() +
      this.initTopContent() +
      this.initMainContent()
    );
  }
  initStyleContent(): string {
    return `
      #right {
        padding-right: 10px;
        flex-grow: 1;
        overflow: auto;
      }
      .range-input {
          width: 120px; 
          height: 18px;
          border-radius:10px;
          border:solid 1px #979797;
          font-size:15px;
          text-indent:3%; 
      }
      #cut-threadid {
          width: 15%;
          height:90%;
          border-radius:10px;
          border:solid 1px #979797;
          font-size:15px;
          text-indent:3% 
      }
      #cut-thread-func {
          width: 20%;
          height:90%;
          border-radius:10px;
          border:solid 1px #979797;
          font-size:15px;
          text-indent:3%
      }
      .hint-label {
          width: 20px;
          height: 10px;
          margin-right: 5px
      }
      .cycle-title {
          display: inline-block;
          width: 61px;
          height: 100%;
      }
      .range {
          display:flex;
          align-items: center;
      }
    `;
  }
  initTopContent(): string {
    return `
      .query-btn{
        height: 20px;
        width: 90px;
        border: solid 1px #666666;
        background-color: rgba(0,0,0,0);
        border-radius:10px;
      }
      button:hover{
          background-color:#666666;
          color:white;
      }
      :host([canvans-hidden]) #right {
          display: none
      }
      :host([single]) .single-btn {
          background-color: #666666;
          color: white
      }
      :host([loop]) .loop-btn {
          background-color: #666666;
          color: white
      }
      :host([query-button]) .query-btn:hover {
          cursor: pointer;
      }
      </style>
      <div id='data-cut'>
        <input id="cut-threadid" type="text" placeholder="Please input threadId" value='' oninput="this.value=this.value.replace(/\\D/g,'')"/>
        <input id="cut-thread-func" type="text" placeholder="Please input funcName" value='' />
        <div style="width:20%;height: 100%;display:flex;justify-content: space-around;">
            <button class="single-btn cut-button">Single</button>
            <button class="loop-btn cut-button">Loop</button>
        </div>
      </div>
    `;
  }
  initMainContent(): string {
    return `
      <div id="content-section">
        <div style="height: auto; width: 60%; overflow: auto">
          <lit-table id="tb-running" style="min-height: 380px; width: 100%" tree>
            <lit-table-column class="running-percent-column" width="300px" title="Process/Thread/Cycle" data-index="title" key="title" align="flex-start" width="27%" retract>
            </lit-table-column>
            <lit-table-column class="running-percent-column" width="160px" title="Cycle start time(ms)" data-index="cycleStartTime" key="cycleStartTime" align="flex-start">
            </lit-table-column>
            <lit-table-column class="running-percent-column" width="130px" title="duration(ms)" data-index="duration" key="duration" align="flex-start">
            </lit-table-column>
            <lit-table-column class="running-percent-column" width="1fr" title="value" data-index="value" key="value" align="flex-start">
            </lit-table-column>
          </lit-table>
        </div>
        <lit-slicer-track ></lit-slicer-track>
        <div id="right">
          <div id="query-section">
            <div>
              <span class="cycle-title">Cycle A:</span>
              <input id="leftA" type="text" class="range-input" value='' oninput="this.value=this.value.replace(/[^0-9\.]/g,'')" placeholder="duration(ms)"/>
              <span>~</span>
              <input id="rightA" type="text" class="range-input" value='' oninput="this.value=this.value.replace(/[^0-9\.]/g,'')" placeholder="duration(ms)"/>
            </div>
            <div style="display: flex; justify-content: space-between">
              <div>
                <span class="cycle-title">Cycle B:</span>
                <input id="leftB" type="text" class="range-input" value='' oninput="this.value=this.value.replace(/[^0-9\.]/g,'')" placeholder="duration(ms)"/> 
                <span>~</span>
                <input id="rightB" type="text" class="range-input" value='' oninput="this.value=this.value.replace(/[^0-9\.]/g,'')" placeholder="duration(ms)"/>
              </div>
              <button class="query-btn">Query</button>
            </div>
          </div>
          <div class="sched-subheading"></div>
          <lit-chart-column id="chart_total" style="width:100%;height:300px"></lit-chart-column>
          <div style="height: 30px;width: 100%;display: flex;flex-direction: row;align-items: center;justify-content: center">
            <div class="labels"><div class="hint-label" style="background-color: #2f72f8"></div>Total</div>
            <div class="labels"><div class="hint-label" style="background-color: #ffab67"></div>Cycle A</div>
            <div class="labels"><div class="hint-label" style="background-color: #a285d2"></div>Cycle B</div>
          </div>
        </div>
      </div>
    `;
  }
}
