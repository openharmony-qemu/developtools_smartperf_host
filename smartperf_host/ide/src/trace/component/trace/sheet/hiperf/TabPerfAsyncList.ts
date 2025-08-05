/*
 * Copyright (C) 2024 Huawei Device Co., Ltd.
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
import { SelectionParam } from '../../../../bean/BoxSelection';
import { LitTable, RedrawTreeForm } from '../../../../../base-ui/table/lit-table';
import '../../../../../base-ui/slicer/lit-slicer';
import '../../../../../base-ui/progress-bar/LitProgressBar';
import { LitProgressBar } from '../../../../../base-ui/progress-bar/LitProgressBar';
import { procedurePool } from '../../../../database/Procedure';
import { Utils } from '../../base/Utils';
import { FrameChart } from '../../../chart/FrameChart';
import { FilterData, TabPaneFilter } from '../TabPaneFilter';
import { ChartMode } from '../../../../bean/FrameChartStruct';

@element('tabpane-perf-async')
export class TabPanePerfAsync extends BaseElement {
  private mainTable: LitTable | undefined | null;
  private showTable: LitTable | undefined | null;
  private callStackTable: LitTable | undefined | null;
  private progressEl: LitProgressBar | undefined;
  private currentSelection: SelectionParam | undefined | null;
  private currentData: Array<perfAsyncList> = [];
  private simpleData: Array<perfAsyncList> = [];
  private isChartShow: boolean = false;
  private asyncFilter: TabPaneFilter | null | undefined;
  private asyncFrameChart: FrameChart | null | undefined;
  private searchValue: string = '';
  private isSearch: boolean = false;
  private processMap: Map<number, string> = new Map();
  private threadMap: Map<number, string> = new Map();

  /**
   * 标签页点击后的入口
   */
  set data(perfAsyncSelection: SelectionParam | null | undefined) {
    if (perfAsyncSelection === this.currentSelection) {
      return;
    }
    this.searchValue = '';
    // 保存当前的框选区域
    this.currentSelection = perfAsyncSelection;
    // 设置筛选框内容为空，切换图标显示成对应火焰图的
    this.asyncFilter!.filterValue = '';
    this.asyncFilter!.icon = 'block';
    // 私有变量存储进程与线程的Map，后续根据id找对应的名字
    this.processMap = Utils.getInstance().getProcessMap();
    this.threadMap = Utils.getInstance().getThreadMap();
    // 设置加载动画
    this.progressEl!.loading = true;
    // 提交子线程进行数据查询
    this.submitQueryData(
      {
        tid: perfAsyncSelection?.perfThread!,
        cpu: perfAsyncSelection?.perfCpus!,
        pid: perfAsyncSelection?.perfProcess!,
        leftNs: perfAsyncSelection?.leftNs!,
        rightNs: perfAsyncSelection?.rightNs!,
        eventId: perfAsyncSelection?.perfEventTypeId,
        searchValue: this.searchValue
      }
    );
  }

  /**
   * 提交线程查询数据库获取数据
   * @param args 框选的perf泳道线程id等相关数据构成的对象
   */
  submitQueryData(args: {
    tid?: Array<number>,
    cpu?: Array<number>,
    pid?: Array<number>,
    leftNs: number,
    rightNs: number,
    eventId: number | undefined,
    searchValue: string
  }): void {
    // 清空数据，保证筛选后没有数据时，相关的表格火焰图不会显示上次的结果
    this.mainTable!.recycleDataSource = [];
    this.showTable!.recycleDataSource = [];
    this.callStackTable!.recycleDataSource = [];
    this.asyncFrameChart!.data = [];
    procedurePool.submitWithName('logic0', 'perf-async', args, undefined, this.callBack.bind(this));
  }

  /**
   * worker线程返回查询结果后执行的回调函数
   * @param result 数据库查询结果
   */
  callBack(result: Array<perfAsyncList>): void {
    // 若返回数据为空，跳出函数
    if (result.length === 0) {
      this.progressEl!.loading = false;
      // 切换显示火焰图还是表格
      this.switchTableOrChart();
      return;
    }
    // 用临时变量接收处理完的数据
    this.currentData = this.organizeData(result);
    // 简表使用数据
    this.simpleData = this.generateSimpleData(this.simpleData);
    // 设置表格数据
    // 设置表格展开
    if (this.isSearch) {
      this.showTable!.isSearch = true;
      this.showTable!.setStatus(this.simpleData, true);
      this.isSearch = false;
    }
    this.tHeadClick(this.simpleData);
    // 设置简表数据
    this.showTable!.recycleDataSource = this.simpleData;
    // 设置详表数据
    this.mainTable!.recycleDataSource = this.currentData;
    // 更新火焰图canvas
    this.asyncFrameChart?.updateCanvas(true, this.clientWidth);
    // 设置火焰图根据sampleCount还是eventCount分布绘制
    if (this.currentSelection!.perfEventTypeId === undefined) {
      this.asyncFrameChart!.mode = ChartMode.Count;
    } else {
      this.asyncFrameChart!.mode = ChartMode.EventCount;
    }
    // 设置火焰图数据
    // @ts-ignore
    this.asyncFrameChart!.data = this.currentData;
    // 切换显示火焰图还是表格
    this.switchTableOrChart();
    this.progressEl!.loading = false;
  };

  /**
   * 合并规则，进程->线程->callerStack_Id->栈顶->第一非相同栈->AsyncWorkCallback下一层结束
   * @param result 数据库查询结果
   * @returns 整理好的结果
   */
  organizeData(result: Array<perfAsyncList>): Array<perfAsyncList> {
    // 最终显示到表格上的数组数据
    let finalResult: Array<perfAsyncList> = [];
    for (let i = 0; i < result.length; i++) {
      // 处理每一条数据，配置基本项，并进行被调用栈切割，只保留asynccallback后的数据
      this.dealEveryData(result[i]);
      // 拷贝临时数组处理，否则会清掉引用类型变量原址的数据
      let callStack: Array<perfAsyncList> = result[i].callerCallStack?.concat(result[i].calleeCallStack!)!;
      // 进程数据
      let processItem: perfAsyncList = { ...result[i] };
      processItem.isProcess = true;
      processItem.symbol = this.processMap.get(result[i].pid!) === null ?
        'Process[' + result[i].pid! + ']' : this.processMap.get(result[i].pid!)! + '[' + result[i].pid! + ']';
      // 线程数据
      let threadItem: perfAsyncList = { ...result[i] };
      threadItem.isThread = true;
      threadItem.symbol = this.threadMap.get(result[i].tid!) === null ?
        'Thread[' + result[i].tid! + ']' : this.threadMap.get(result[i].tid!)! + '[' + result[i].tid! + ']';
      // @ts-ignore
      callStack.unshift(threadItem);
      // @ts-ignore
      callStack.unshift(processItem);
      // 递归将一维数组整理成链表
      let callStackList: Array<perfAsyncList> = this.recursionToTree(callStack!, result[i])!;
      // 如果两条数据calleechainid相同，则只保留前一条，并让sampleCount+1。如果不同，则找到被调用栈一样的的最后一层，将该条数据及其子数据插入进去
      // 查找相同进程分组
      const index: number = finalResult.findIndex((item) => item.pid === callStackList[0].pid);
      if (index >= 0) {
        finalResult[index].parent = undefined;
        // 如果两条数据calleechainid相同，则只保留前一条，并让sampleCount+1。如果不同，则找到被调用栈一样的的最后一层，将该条数据及其子数据插入进去
        recusion(callStackList[0], finalResult[index]);
      } else {
        finalResult.push(...callStackList);
      }
    }
    // 保存数据，火焰图生成后处理简表数据
    this.simpleData = [...result];
    return finalResult;
  }


  /**
   * 修改每一条数据的对应字段显示值
   * @param data 数据库查询结果中的每一条数据
   */
  dealEveryData(data: perfAsyncList): void {
    data.eventType = data.eventType + '[' + data.eventTypeId + ']';
    data.sampleCount = 1;
    data.symbol = Utils.getTimeString(data.time!);
    const index: number | undefined = data.calleeCallStack?.findIndex((item) =>
      item.symbolName!.indexOf('AsyncWorkCallback') !== -1
    );
    // 若不保留AsyncWorkCallback这一层，则在截取时让index+1
    data.calleeCallStack = data.calleeCallStack?.slice(index!)!;
    data.callStackList = data.callerCallStack?.concat(data.calleeCallStack!);
    data.jsFuncName = data.callerCallStack![data.callerCallStack!.length - 1].symbolName;
    data.asyncFuncName = data.calleeCallStack!.length > 1 ? data.calleeCallStack![1].symbolName : data.calleeCallStack![0].symbolName;
    data.drawCount = 0;
    data.drawDur = 0;
    data.drawEventCount = 0;
    data.drawSize = 0;
    data.searchCount = 0;
    data.searchDur = 0;
    data.searchEventCount = 0;
    data.searchSize = 0;
    data.isChartSelect = false;
    data.isChartSelectParent = false;
    data.isDraw = false;
    data.isJsStack = false;
    data.isProcess = false;
    data.isThread = false;
    if (data.isSearch === undefined) {
      data.isSearch = false;
    }
    data.count = 1;
    data.size = 0;
    data.dur = 1;
    data.isCharged = false;
  }

  /**
   * 用于设置右侧调用栈与被调用栈表格信息
   * @param data 当前主表点击的行数据
   */
  setRightTableData(data: perfAsyncList): void {
    const callStackList: Array<{
      head: string,
      eventTypeId: number,
      symbolName: string,
      children: Array<perfAsyncList>
    }> = [];
    if (!(data.isProcess || data.isThread)) {
      if (data.callerCallchainid) {
        callStackList.push({
          head: '',
          eventTypeId: 0,
          symbolName: 'callerStack',
          children: []
        });
        callStackList[0].children.push(...data.callerCallStack!);
        if (data.calleeCallchainid) {
          callStackList.push({
            head: '',
            eventTypeId: 0,
            symbolName: 'calleeStack',
            children: []
          });
          callStackList[1].children.push(...data.calleeCallStack!);
        }
      }
    }
    this.callStackTable!.recycleDataSource = callStackList;
  }

  /**
   * 过滤工具栏的功能函数
   * @param data 过滤工具栏相关数据
   */
  asyncListFilterGetFilter(data: FilterData): void {
    if ((this.isChartShow && data.icon === 'tree') || (!this.isChartShow && data.icon === 'block')) {
      this.switchTableOrChart();
    } else if (this.searchValue !== this.asyncFilter!.filterValue) {
      this.searchValue = this.asyncFilter!.filterValue;
      this.submitQueryData(
        {
          tid: this.currentSelection?.perfThread!,
          cpu: this.currentSelection?.perfCpus!,
          pid: this.currentSelection?.perfProcess!,
          leftNs: this.currentSelection?.leftNs!,
          rightNs: this.currentSelection?.rightNs!,
          eventId: this.currentSelection?.perfEventTypeId,
          searchValue: this.searchValue
        }
      );
      this.isSearch = true;
    } else {
      this.showTable!.setStatus(this.simpleData, true);
      this.switchTableOrChart();
    }
  }

  /**
   * 点击按钮进行表格与火焰图的切换
   * @param data 过滤工具栏相关数据
   */
  switchTableOrChart(): void {
    let perfProfilerPageTab = this.shadowRoot?.querySelector('#show_table');
    let perfProfilerPageChart = this.shadowRoot?.querySelector('#show_chart');
    // 根据过滤工具栏的切换图标，显示火焰图或者表格
    if (this.asyncFilter!.icon === 'block') {
      perfProfilerPageChart?.setAttribute('class', 'show');
      perfProfilerPageTab?.setAttribute('class', '');
      this.isChartShow = true;
      this.asyncFilter!.disabledMining = false;
      this.asyncFrameChart?.calculateChartData();
    } else if (this.asyncFilter!.icon === 'tree') {
      perfProfilerPageChart?.setAttribute('class', '');
      perfProfilerPageTab?.setAttribute('class', 'show');
      this.isChartShow = false;
      this.asyncFilter!.disabledMining = false;
      this.asyncFrameChart!.clearCanvas();
      this.showTable!.reMeauseHeight();
    }
  }

  /**
 * 递归，将一维数组的每一项作为上一项的子项整理成链表结构
 * @param list 待整理的一维数组
 * @param data 每一项增加属性值时需要读取内容的数据
 * @param flag 待传入的每一个节点
 * @returns 返回数组结构，一项套一项，例：原数据为长度12的数组，返回则为嵌套深度为12的单项数组
 */
  recursionToTree(
    list: Array<perfAsyncList>,
    data: perfAsyncList,
    flag: Array<perfAsyncList> | null = null
  ): Array<perfAsyncList> | undefined {
    if (list.length === 0) {
      return;
    }
    // 最后返回的数组，内容是一个链表
    const tree: Array<perfAsyncList> = flag || [];
    // 链表的每一层数据结构
    let item: perfAsyncList = { ...data };
    item.children = [];
    // 此处定义tsArray是为了避免引用类型变量在进行数据合并，出现最底层栈却有多条数据的问题
    item.tsArray = [item.time!];
    item.parent = data;
    // 循环一维数组，将每一项填充到其父级数组中
    // @ts-ignore
    item.symbol = list[0].symbolName || list[0].symbol;
    // @ts-ignore
    item.lib = list[0].lib || list[0].symbol;
    // @ts-ignore
    item.addr = list[0].addr || '';
    // @ts-ignore
    item.isProcess = list[0].isProcess;
    // @ts-ignore
    item.isThread = list[0].isThread;
    // 符合搜索字符串匹配的火焰图及表格特殊处理
    if (this.searchValue !== '' && item.symbol!.toLocaleLowerCase().indexOf(this.searchValue.toLocaleLowerCase()) !== -1) {
      item.isSearch = true;
    } else {
      item.isSearch = false;
    }
    tree.push(item);
    // 处理完的数据进行删除，每次循环只会拿到首项，也就是需要处理的子项
    list.splice(0, 1);
    // 递归调用
    this.recursionToTree(list, item, tree[0].children!);
    return tree;
  }

  /**
   * 将数据库返回数据进行整理，生成简表展示数据
   * @param data 数据库返回数据
   * @returns 简表展示的数据
   */
  generateSimpleData(data: Array<perfAsyncList>): Array<perfAsyncList> {
    let result = new Array<perfAsyncList>();
    for (let i = 0; i < data.length; i++) {
      let list = new Array<perfAsyncList>();
      // 进程数据
      let processItem: perfAsyncList = { ...data[i] };
      processItem.isProcess = true;
      processItem.symbol = this.processMap.get(data[i].pid!) === null ?
        'Process[' + data[i].pid! + ']' : this.processMap.get(data[i].pid!)! + '[' + data[i].pid! + ']';
      // 线程数据
      let threadItem: perfAsyncList = { ...data[i] };
      threadItem.isThread = true;
      threadItem.symbol = this.threadMap.get(data[i].tid!) === null ?
        'Thread[' + data[i].tid! + ']' : this.threadMap.get(data[i].tid!)! + '[' + data[i].tid! + ']';
      // js栈层
      let jsFuncItem: perfAsyncList = { ...data[i] };
      jsFuncItem.symbol = jsFuncItem.jsFuncName;
      // asyncWorkCallBack下一层
      let asyncFuncItem: perfAsyncList = { ...data[i] };
      asyncFuncItem.symbol = asyncFuncItem.asyncFuncName;
      // 被调用栈最底层
      let bottomItem: perfAsyncList = { ...data[i] };
      bottomItem.asyncFuncName = bottomItem.calleeCallStack![bottomItem.calleeCallStack!.length - 1].symbolName;
      bottomItem.symbol = bottomItem.asyncFuncName;
      // 填充到数组，整理成链表结构
      list.push(processItem, threadItem, jsFuncItem, asyncFuncItem, bottomItem);
      // @ts-ignore
      list = this.recursionToTree(list, data[i])!;
      // 查找相同进程分组
      const index: number = result.findIndex((item) => item.pid === list[0].pid);
      if (index >= 0) {
        result[index].parent = undefined;
        // 合并栈
        recusion(list[0], result[index], true);
      } else {
        result.push(...list);
      }
    }
    return result;
  }

  /**
   * 表头点击事件
   */
  private tHeadClick(data: Array<perfAsyncList>): void {
    let labels = this.showTable?.shadowRoot?.querySelector('.th > .td')!.querySelectorAll('label');
    if (labels) {
      for (let i = 0; i < labels.length; i++) {
        let label = labels[i].innerHTML;
        labels[i].addEventListener('click', (e) => {
          if (label.includes('Process') && i === 0) {
            this.showTable!.setStatus(data, false);
            this.showTable!.recycleDs = this.showTable!.meauseTreeRowElement(data, RedrawTreeForm.Retract);
          } else if (label.includes('Thread') && i === 1) {
            this.showTable!.setStatus(data, false, 0, 1);
            this.showTable!.recycleDs = this.showTable!.meauseTreeRowElement(data, RedrawTreeForm.Retract);
          } else if (label.includes('Js_Func') && i === 2) {
            this.showTable!.setStatus(data, false, 0, 2);
            this.showTable!.recycleDs = this.showTable!.meauseTreeRowElement(data, RedrawTreeForm.Retract);
          } else if (label.includes('Async_Func') && i === 3) {
            this.showTable!.setStatus(data, false, 0, 3);
            this.showTable!.recycleDs = this.showTable!.meauseTreeRowElement(data, RedrawTreeForm.Retract);
          } else if (label.includes('Bottom') && i === 4) {
            this.showTable!.setStatus(data, true);
            this.showTable!.recycleDs = this.showTable!.meauseTreeRowElement(data, RedrawTreeForm.Expand);
          }
        });
      }
    }
  }

  /**
   * 初始化元素，并进行变量绑定，监听事件添加
   */
  initElements(): void {
    this.mainTable = this.shadowRoot?.querySelector<LitTable>('#tb-perf-async');
    this.showTable = this.shadowRoot?.querySelector<LitTable>('#tb-perf-show');
    this.callStackTable = this.shadowRoot?.querySelector<LitTable>('#call-stack-list');
    this.progressEl = this.shadowRoot?.querySelector('.perf-async-progress') as LitProgressBar;
    this.asyncFilter = this.shadowRoot?.querySelector<TabPaneFilter>('#filter');
    this.asyncFrameChart = this.shadowRoot?.querySelector<FrameChart>('#framechart');
    this.asyncFilter!.getFilterData(this.asyncListFilterGetFilter.bind(this));
    // 将主表绑定行点击事件，根据点击数据更新右侧的调用栈与被调用栈表格信息
    // @ts-ignore
    this.showTable?.addEventListener('row-click', (evt: CustomEvent) => {
      let data = evt.detail.data;
      data.isSelected = true;
      this.showTable?.clearAllSelection(data);
      this.showTable?.setCurrentSelection(data);
      this.setRightTableData(data);
      document.dispatchEvent(
        new CustomEvent('number_calibration', {
          detail: { time: data.tsArray },
        })
      );
      if (evt.detail.callBack) {
        evt.detail.callBack(true);
      }
    });
    // @ts-ignore
    this.callStackTable?.addEventListener('row-click', (evt: CustomEvent) => {
      let data = evt.detail.data;
      data.isSelected = true;
      this.callStackTable?.clearAllSelection(data);
      this.callStackTable?.setCurrentSelection(data);
      if (evt.detail.callBack) {
        evt.detail.callBack(true);
      }
    });
  }

  /**
   * 生命周期函数，用于调整表格高度
   */
  connectedCallback(): void {
    super.connectedCallback();
    // 设置火焰图滚动高度，更新火焰图时会
    this.parentElement!.onscroll = (): void => {
      this.asyncFrameChart!.tabPaneScrollTop = this.parentElement!.scrollTop;
    };
    let filterHeight = 0;
    // 动态监听视图窗口变化
    new ResizeObserver((entries): void => {
      let asyncTabFilter = this.shadowRoot!.querySelector('#filter') as HTMLElement;
      // 获取过滤工具栏高度
      if (asyncTabFilter.clientHeight > 0) {
        filterHeight = asyncTabFilter.clientHeight;
      }
      // 动态调整过滤工具栏的显隐
      if (this.parentElement!.clientHeight > filterHeight) {
        asyncTabFilter.style.display = 'flex';
      } else {
        asyncTabFilter.style.display = 'none';
      }
      // 如果数据表隐藏，则让过滤工具栏也隐藏
      if (this.showTable!.style.visibility === 'hidden') {
        asyncTabFilter.style.display = 'none';
      }
      if (this.parentElement?.clientHeight !== 0) {
        // 更新火焰图
        if (this.isChartShow) {
          this.asyncFrameChart?.updateCanvas(false, entries[0].contentRect.width);
          this.asyncFrameChart?.calculateChartData();
        }
        // 调整表格高度
        // @ts-ignore
        this.showTable?.shadowRoot.querySelector('.table').style.height =
          // @ts-ignore
          `${this.parentElement.clientHeight - 45}px`;
        this.showTable?.reMeauseHeight();
        // @ts-ignore
        this.callStackTable?.shadowRoot.querySelector('.table').style.height =
          `${this.parentElement!.clientHeight - 45}px`;
        this.callStackTable?.reMeauseHeight();
      }
    }).observe(this.parentElement!);
  }

  /**
   * 前端渲染的节点及样式
   * @returns html元素字符串
   */
  initHtml(): string {
    return this.initStyle() + `
      <div class="perf-async-content" style="display: flex;flex-direction: column">
        <lit-progress-bar class="progress perf-async-progress"></lit-progress-bar>
        <selector id='show_table' class="show">
          <lit-slicer style="width:100%">
            <div id="left_table" style="width: 65%">
              <lit-table id="tb-perf-async" style="height: 100%; overflow: auto; display: none" tree>
                <lit-table-column width="550px" title="CallStack" data-index="symbol" key="symbol" align="flex-start" retract></lit-table-column>
                <lit-table-column width="150px" title="Event_Count" data-index="eventCount" key="eventCount" align="flex-start"></lit-table-column>
                <lit-table-column width="100px" title="Sample_Count" data-index="sampleCount" key="sampleCount" align="flex-start"></lit-table-column>
                <lit-table-column width="150px" title="Js_Func_Name" data-index="jsFuncName" key="jsFuncName" align="flex-start"></lit-table-column>
                <lit-table-column width="150px" title="Async_Func_Name" data-index="asyncFuncName" key="asyncFuncName" align="flex-start"></lit-table-column>
                <lit-table-column width="150px" title="Trace_Id" data-index="traceid" key="traceid" align="flex-start"></lit-table-column>
                <lit-table-column width="150px" title="CallerStack_Id" data-index="callerCallchainid" key="callerCallchainid" align="flex-start"></lit-table-column>
                <lit-table-column width="150px" title="CalleeStack_Id" data-index="calleeCallchainid" key="calleeCallchainid" align="flex-start"></lit-table-column>
              </lit-table>
              <lit-table id="tb-perf-show" style="height: 100%; overflow: auto;" tree hideDownload>
                <lit-table-column width="550px" title="Process/Thread/Js_Func/Async_Func/Bottom" data-index="symbol" key="symbol" align="flex-start" retract></lit-table-column>
                <lit-table-column width="150px" title="Event_Count" data-index="eventCount" key="eventCount" align="flex-start"></lit-table-column>
                <lit-table-column width="100px" title="Sample_Count" data-index="sampleCount" key="sampleCount" align="flex-start"></lit-table-column>
                <lit-table-column width="150px" title="Js_Func_Name" data-index="jsFuncName" key="jsFuncName" align="flex-start"></lit-table-column>
                <lit-table-column width="150px" title="Async_Func_Name" data-index="asyncFuncName" key="asyncFuncName" align="flex-start"></lit-table-column>
                <lit-table-column width="150px" title="Trace_Id" data-index="traceid" key="traceid" align="flex-start"></lit-table-column>
                <lit-table-column width="150px" title="CallerStack_Id" data-index="callerCallchainid" key="callerCallchainid" align="flex-start"></lit-table-column>
                <lit-table-column width="150px" title="CalleeStack_Id" data-index="calleeCallchainid" key="calleeCallchainid" align="flex-start"></lit-table-column>
              </lit-table>
            </div>
            <lit-slicer-track ></lit-slicer-track>
            <div id='right_table' style='height: 100%; overflow: auto;width: 35%'>
              <lit-table id="call-stack-list" hideDownload tree>
                <lit-table-column width="35px" title="" data-index="head" key="head" align="flex-start" retract></lit-table-column>
                <lit-table-column width="30px" title="" data-index="eventTypeId" key="eventTypeId"  align="flex-start">
                  <template>
                    <img src="img/library.png" size="20" v-if=" eventTypeId == 1 "> <img src="img/function.png" size="20" v-if=" eventTypeId == 0 ">
                  </template>
                </lit-table-column>
                <lit-table-column width="1fr" title="Call_Stack" data-index="symbolName" key="symbolName" align="flex-start">
                </lit-table-column>
              </lit-table>
            </div>
          </lit-slicer>
        </selector>
        <tab-pane-filter id="filter" input inputLeftText icon perf></tab-pane-filter>
        <selector id='show_chart'>
            <tab-framechart id='framechart' style='width: 100%;height: auto'> </tab-framechart>
        </selector>  
      </div>
    `;
  }

  /**
   * 前端渲染节点的样式
   * @returns style标签
   */
  initStyle(): string {
    return `
      <style>
        :host{
          display: flex;
          flex-direction: column;
          padding: 10px 10px 0 10px;
          height: calc(100% - 20px);
        }
        .perf-async-progress{
          position: absolute;
          height: 1px;
          left: 0;
          right: 0;
        }
        selector{
          display: none;
        }
        .show{
          display: flex;
          flex: 1;
        }
        #perf-async-menu {
          position: fixed;
          bottom: 0;
          width: 100%;
          border: solid rgb(216,216,216) 1px;
          float: left;
          background: #f3f3f3;
          height: 30px;
        }
        .refresh {
          padding-left: 5px;
          padding-top: 5px;
        }
        tab-pane-filter {
            position: fixed;
            bottom: 0;
            width: 100%;
            border: solid rgb(216,216,216) 1px;
            float: left;
        }
        .perf-profile-progress{
            bottom: 33px;
            position: absolute;
            height: 1px;
            left: 0;
            right: 0;
        }
      </style>
     `;
  }
}

interface perfAsyncList {
  tid?: number;
  pid?: number;
  time?: number;
  symbol?: string;
  traceid?: string;
  eventCount?: number;
  sampleCount?: number;
  jsFuncName?: string;
  callerCallchainid?: number;
  calleeCallchainid?: number;
  asyncFuncName?: string;
  eventType?: string;
  children?: Array<perfAsyncList>;
  eventTypeId?: number;
  symbolName?: string;
  callerCallStack?: Array<perfAsyncList>;
  calleeCallStack?: Array<perfAsyncList>;
  callStackList?: Array<perfAsyncList>;
  parent?: perfAsyncList;
  isProcess?: boolean;
  isThread?: boolean;
  depth?: number;
  isSearch?: boolean;
  isJsStack?: boolean;
  lib?: string;
  isChartSelectParent?: boolean;
  isChartSelect?: boolean;
  isDraw?: boolean;
  drawDur?: number;
  drawEventCount?: number;
  drawCount?: number;
  drawSize?: number;
  searchEventCount?: number;
  searchCount?: number;
  searchDur?: number;
  searchSize?: number;
  size?: number;
  count?: number;
  dur?: number;
  tsArray?: Array<number>;
  isCharged?: boolean;
  addr?: string;
}

/**
   * 递归整理合并相同调用栈与被调用栈
   * @param data 需要合并给目标数据的数据
   * @param targetData 目标数据
   * @param index 递归次数
   */
export function recusion(data: perfAsyncList, targetData: perfAsyncList, flag?: boolean): void {
  // 将新元素合并到目标元素时，将目标元素的sampleCount和eventCount进行累加,每次进来都是要合并的值
  targetData.sampleCount! += data.sampleCount!;
  targetData.count! += data.count!;
  targetData.dur! += data.dur!;
  targetData.eventCount! += data.eventCount!;
  targetData.tsArray?.push(data.time!);
  targetData.tsArray = [...new Set(targetData.tsArray)];
  data.parent = targetData.parent;
  targetData.children?.sort((a, b) => b.count! - a.count!);
  if (data.callerCallchainid !== targetData.callerCallchainid) {
    targetData.jsFuncName = '';
    // @ts-ignore
    targetData.callerCallchainid = '';
    targetData.traceid = '';
  }
  if (data.calleeCallchainid !== targetData.calleeCallchainid) {
    targetData.asyncFuncName = '';
    // @ts-ignore
    targetData.calleeCallchainid = '';
  }
  // 需要根据子级是否有值判断如何合并，两者都有子级
  if (data.children!.length !== 0 && targetData.children!.length !== 0) {
    // 目标栈可能已经保存了多条数据，需要找到合并栈子级与被合并栈子级相同的分支进行栈合并
    // 筛选出子项最多的那个
    const num: number = targetData?.children?.findIndex((item) => item.symbol === data.children![0].symbol)!;
    // 去重
    targetData.tsArray = [...new Set(targetData.tsArray)];
    // 若存在symbol相同的子级，则进入下一层合并。若不存在，则证明是新的分支，将新的子级填充到目标元素子级中
    if (num >= 0) {
      //此处是为了区分简表和详表。简表只有5层，存在首尾相同，中间不同的情况
      if (flag && targetData.children![num].calleeCallchainid !== data.children![0].calleeCallchainid && data.children![0].children!.length === 0) {
        targetData.children!.push(data.children![0]);
        data.children![0].parent = targetData;
      } else {
        recusion(data.children![0], targetData.children![num], flag);
      }
    } else {
      targetData.children?.push(data.children![0]);
      data.children![0].parent = targetData;
      targetData.children?.sort((a, b) => b.count! - a.count!);
    }
  } else if (data.children!.length !== 0 && targetData.children!.length === 0) {
    // 若目标元素不存在子级，当前元素存在子级。证明目标元素中需要添加一个子级更多的元素，并将其填充到队首，方便查找相同分支时拿到的是子级更多的分支。
    const num: number = targetData?.children?.findIndex((item) => item.symbol === data.children![0].symbol)!;
    targetData.children?.splice(num, 0, data.children![0]);
    data.children![0].parent = targetData;
  }
}