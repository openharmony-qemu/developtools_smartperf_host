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
import { type LitTable, RedrawTreeForm } from '../../../../../base-ui/table/lit-table';
import { SelectionParam } from '../../../../bean/BoxSelection';
import { getGpufreqData, getGpufreqDataCut } from '../../../../database/sql/Perf.sql';
import { resizeObserver } from '../SheetUtils';
import { SpSegmentationChart } from '../../../chart/SpSegmentationChart';
import { GpuCountBean, TreeDataBean, type SearchGpuFuncBean, CycleDataBean, TreeDataStringBean } from '../../../../bean/GpufreqBean';

@element('tabpane-gpufreqdatacut')
export class TabPaneGpufreqDataCut extends BaseElement {
  private threadStatesTbl: LitTable | null | undefined;
  private currentSelectionParam: SelectionParam | undefined;
  private _single: Element | null | undefined;
  private _loop: Element | null | undefined;
  private _threadId: HTMLInputElement | null | undefined;
  private _threadFunc: HTMLInputElement | null | undefined;
  private threadIdValue: string = '';
  private threadFuncName: string = '';
  private initData: Array<GpuCountBean> = [];
  private SUB_LENGTH: number = 3;
  private PERCENT_SUB_LENGTH: number = 2;
  private UNIT: number = 1000000;
  private KUNIT: number = 1000000000000;

  set data(threadStatesParam: SelectionParam) {
    if (this.currentSelectionParam === threadStatesParam) {
      return;
    } else {
      SpSegmentationChart.setChartData('GPU-FREQ', []);
    };
    this.currentSelectionParam = threadStatesParam;
    this.threadStatesTbl!.recycleDataSource = [];
    this.threadStatesTbl!.loading = true;
    this.getGpufreqData(threadStatesParam.leftNs, threadStatesParam.rightNs, false).then((result) => {
      if (result !== null && result.length > 0) {
        let resultList: Array<GpuCountBean> = JSON.parse(JSON.stringify(result));
        resultList[0].dur = resultList[1] ? resultList[1].startNS - threadStatesParam.leftNs : threadStatesParam.rightNs - threadStatesParam.leftNs;
        resultList[0].value = resultList[0].dur * resultList[0].val;
        resultList[resultList.length - 1].dur = resultList.length - 1 !== 0 ? threadStatesParam.rightNs - resultList[resultList.length - 1].startNS : resultList[0].dur;
        resultList[resultList.length - 1].value = resultList.length - 1 !== 0 ? resultList[resultList.length - 1].dur * resultList[resultList.length - 1].val : resultList[0].value;
        this.initData = resultList;
        this.threadStatesTbl!.loading = false;
      } else {
        this.threadStatesTbl!.recycleDataSource = [];
        this.threadStatesTbl!.loading = false;
      };
    });
    this._threadId!.style.border = '1px solid rgb(151, 151, 151)';
    this._threadFunc!.style.border = '1px solid rgb(151, 151, 151)';
    this.isChangeSingleBtn(false);
    this.isChangeLoopBtn(false);
  };

  initElements(): void {
    this.threadStatesTbl = this.shadowRoot?.querySelector<LitTable>('#tb-gpufreq-percent');
    this._single = this.shadowRoot?.querySelector('#single');
    this._loop = this.shadowRoot?.querySelector('#loop');
    this._threadId = this.shadowRoot?.querySelector('#dataCutThreadId');
    this._threadFunc = this.shadowRoot?.querySelector('#dataCutThreadFunc');
    this.threadIdValue = this._threadId!.value.trim();
    this.threadFuncName = this._threadFunc!.value.trim();
    //点击single
    this._single?.addEventListener('click', (e) => {
      this.isChangeSingleBtn(true);
      this.isChangeLoopBtn(false);
      this.clickFun(this._single!.innerHTML);
    });
    //点击loop
    this._loop?.addEventListener('click', (e) => {
      this.isChangeSingleBtn(false);
      this.isChangeLoopBtn(true);
      this.clickFun(this._loop!.innerHTML);
    });
    //点击周期，算力泳道对应周期实现高亮效果
    this.threadStatesTbl?.addEventListener('row-click', (event: Event) => {
      const EVENT_LEVEL: string = '2';
      // @ts-ignore
      if (event.detail.level === EVENT_LEVEL && event.detail.thread.includes('cycle')) {
        // @ts-ignore
        SpSegmentationChart.tabHover('GPU-FREQ', true, event.detail.data.cycle);
      };
    });
    this.addInputBorderEvent(this._threadId!);
    this.addInputBorderEvent(this._threadFunc!);
  };
  async getGpufreqData(leftNs: number, rightNs: number, isTrue: boolean): Promise<Array<GpuCountBean>> {
    let result: Array<GpuCountBean> = await getGpufreqData(leftNs, rightNs, isTrue);
    return result;
  };
  async getGpufreqDataCut(tIds: string, funcName: string, leftNS: number, rightNS: number, single: boolean, loop: boolean): Promise<Array<SearchGpuFuncBean>> {
    let result: Array<SearchGpuFuncBean> = await getGpufreqDataCut(tIds, funcName, leftNS, rightNS, single, loop);
    return result;
  };
  //是否改变single按钮颜色
  private isChangeSingleBtn(flag: boolean): void {
    if (flag) {
      this.setAttribute('single', '');
    } else {
      this.removeAttribute('single');
    };
  }
  //是否改变loop按钮颜色
  private isChangeLoopBtn(flag: boolean): void {
    if (flag) {
      this.setAttribute('loop', '');
    } else {
      this.removeAttribute('loop');
    };
  }
  private clickFun(fun: string): void {
    this.threadIdValue = this._threadId!.value.trim();
    this.threadFuncName = this._threadFunc!.value.trim();
    this.threadStatesTbl!.loading = true;
    SpSegmentationChart.tabHover('GPU-FREQ', false, -1);
    this.validationFun(this.threadIdValue, this.threadFuncName, fun);
  };
  private addInputBorderEvent(inputElement: HTMLInputElement): void {
    if (inputElement) {
      inputElement.addEventListener('change', function () {
        if (this.value.trim() !== '') {
          this.style.border = '1px solid rgb(151, 151, 151)';
        }
      });
    }
  };
  private validationFun(threadIdValue: string, threadFuncName: string, fun: string): void {
    if (threadIdValue === '') {
      this.handleEmptyInput(this._threadId!);
    } else if (threadFuncName === '') {
      this.handleEmptyInput(this._threadFunc!);
    } else {
      this._threadId!.style.border = '1px solid rgb(151, 151, 151)';
      this._threadFunc!.style.border = '1px solid rgb(151, 151, 151)';
      if (fun === 'Single') {
        this.isTrue(threadIdValue, threadFuncName, true, false);
      };
      if (fun === 'Loop') {
        this.isTrue(threadIdValue, threadFuncName, false, true);
      };
    };
  };
  private handleEmptyInput(input: HTMLInputElement): void {
    this.threadStatesTbl!.loading = false;
    input!.style.border = '1px solid rgb(255,0,0)';
    this.threadStatesTbl!.recycleDataSource = [];
  };
  private isTrue(threadIdValue: string, threadFuncName: string, single: boolean, loop: boolean): void {
    this.getGpufreqDataCut(threadIdValue, threadFuncName,
      this.currentSelectionParam!.leftNs,
      this.currentSelectionParam!.rightNs,
      single, loop
    ).then((result: Array<SearchGpuFuncBean>) => {
      let _initData = JSON.parse(JSON.stringify(this.initData));
      this.handleDataCut(_initData, result);
    });
  };
  private handleDataCut(initData: Array<GpuCountBean>, dataCut: Array<SearchGpuFuncBean>): void {
    if (initData.length > 0 && dataCut.length > 0) {
      let finalGpufreqData: Array<TreeDataStringBean> = new Array();
      let startPoint: number = initData[0].startNS;
      let _dataCut: Array<SearchGpuFuncBean> = dataCut.filter((i) => i.startTime >= startPoint);
      let _lastList: Array<GpuCountBean> = [];
      let i: number = 0;
      let j: number = 0;
      let currentIndex: number = 0;
      while (i < _dataCut.length) {
        let dataItem: SearchGpuFuncBean = _dataCut[i];
        let initItem: GpuCountBean = initData[j];
        _lastList.push(...this.segmentationData(initItem, dataItem, i));
        j++;
        currentIndex++;
        if (currentIndex === initData.length) {
          i++;
          j = 0;
          currentIndex = 0;
        };
      };
      let tree: TreeDataStringBean = this.createTree(_lastList);
      finalGpufreqData.push(tree);
      this.threadStatesTbl!.recycleDataSource = finalGpufreqData;
      this.threadStatesTbl!.loading = false;
      this.clickTableHeader(finalGpufreqData);

    } else {
      this.threadStatesTbl!.recycleDataSource = [];
      this.threadStatesTbl!.loading = false;
      SpSegmentationChart.setChartData('GPU-FREQ', []);
    };
  };
  private segmentationData(j: GpuCountBean, e: SearchGpuFuncBean, i: number): Array<GpuCountBean> {
    let lastList: Array<GpuCountBean> = [];
    if (j.startNS <= e.startTime && j.endTime >= e.startTime) {
      if (j.endTime >= e.endTime) {
        lastList.push(
          new GpuCountBean(
            j.freq,
            (e.endTime - e.startTime) * j.val,
            j.val,
            e.endTime - e.startTime,
            e.startTime,
            e.endTime,
            j.thread,
            i
          )
        );
      } else {
        lastList.push(
          new GpuCountBean(
            j.freq,
            (j.endTime - e.startTime) * j.val,
            j.val,
            j.endTime - e.startTime,
            e.startTime,
            j.endTime,
            j.thread,
            i
          )
        );
      };
    } else if (j.startNS >= e.startTime && j.endTime <= e.endTime) {
      lastList.push(
        new GpuCountBean(
          j.freq,
          (j.endTime - j.startNS) * j.val,
          j.val,
          j.endTime - j.startNS,
          j.startNS,
          j.endTime,
          j.thread,
          i
        )
      );
    } else if (j.startNS <= e.endTime && j.endTime >= e.endTime) {
      lastList.push(
        new GpuCountBean(
          j.freq,
          (e.endTime - j.startNS) * j.val,
          j.val,
          e.endTime - j.startNS,
          j.startNS,
          e.endTime,
          j.thread,
          i
        )
      );
    };
    return lastList;
  };
  // 创建树形结构 
  private createTree(data: Array<GpuCountBean>): TreeDataStringBean {
    if (data.length > 0) {
      const root: {
        thread: string;
        value: number;
        dur: number;
        percent: number;
        level: number;
        children: TreeDataBean[];
      } = {
        thread: 'gpufreq Frequency',
        value: 0,
        dur: 0,
        percent: 100,
        level: 1,
        children: [],
      };
      const valueMap: { [parentIndex: number]: TreeDataBean } = {};
      data.forEach((item: GpuCountBean) => {
        let parentIndex: number = item.parentIndex !== undefined ? item.parentIndex : 0;
        let freq: number = item.freq;
        item.thread = `${item.thread} Frequency`;
        item.level = 4;
        this.updateValueMap(item, parentIndex, freq, valueMap);
      });
      Object.values(valueMap).forEach((node: TreeDataBean) => {
        const parentNode: TreeDataBean = valueMap[node.freq! - 1];
        if (parentNode) {
          parentNode.children.push(node);
          parentNode.dur += node.dur;
          parentNode.value += node.value;
        } else {
          root.children.push(node);
          root.dur += node.dur;
          root.value += node.value;
        }
      });
      this.flattenAndCalculate(root, root);
      const firstLevelChildren = this.getFirstLevelChildren(root);
      SpSegmentationChart.setChartData('GPU-FREQ', firstLevelChildren);
      let _root = this.RetainDecimals(root)
      return _root;
    } else {
      return new TreeDataStringBean('', '', '', '', '', '');
    };
  };
  private updateValueMap(item: GpuCountBean, parentIndex: number, freq: number, valueMap: { [parentIndex: string]: TreeDataBean }): void {
    if (!valueMap[parentIndex]) {
      valueMap[parentIndex] = {
        thread: `cycle ${parentIndex + 1} ${item.thread}`,
        value: item.value,
        dur: item.dur,
        startNS: item.startNS,
        percent: 100,
        level: 2,
        cycle: parentIndex + 1,
        children: [],
      };
    } else {
      valueMap[parentIndex].dur += item.dur;
      valueMap[parentIndex].value += item.value;
    };
    if (!valueMap[parentIndex].children[freq]) {
      valueMap[parentIndex].children[freq] = {
        thread: item.thread,
        value: item.value,
        dur: item.dur,
        percent: 100,
        level: 3,
        children: [],
      };
    } else {
      valueMap[parentIndex].children[freq].dur += item.dur;
      valueMap[parentIndex].children[freq].value += item.value;
    };
    valueMap[parentIndex].children[freq].children.push(item as unknown as TreeDataBean);
  };
  private getFirstLevelChildren(obj: TreeDataBean): Array<CycleDataBean> {
    const result: Array<CycleDataBean> = [];
    if (Array.isArray(obj.children)) {
      obj.children.forEach((child) => {
        if (child.cycle !== undefined && child.dur !== undefined && child.value !== undefined && child.startNS !== undefined) {
          result.push(new CycleDataBean(7, child.dur, Number((child.value / this.KUNIT).toFixed(3)), child.startNS, child.cycle, '', 1));
        };
      });
    };
    return result;
  };
  private flattenAndCalculate(node: TreeDataBean, root: TreeDataBean): void {
    node.percent = node.value / root.value * 100;
    if (node.children) {
      node.children = node.children.flat();
      node.children.forEach((childNode) => this.flattenAndCalculate(childNode, root));
    };
  };
  private RetainDecimals(root: TreeDataBean): TreeDataStringBean {
    const treeDataString: TreeDataStringBean = new TreeDataStringBean(root.thread!, (root.value / this.KUNIT).toFixed(this.SUB_LENGTH), (root.dur / this.UNIT).toFixed(this.SUB_LENGTH), root.percent!.toFixed(this.PERCENT_SUB_LENGTH), String(root.level), '', 0, [], '', false);
    if (root.children) {
      for (const child of root.children) {
        treeDataString.children!.push(this.convertChildToString(child) as TreeDataStringBean);
      };
    };
    return treeDataString;
  };
  private convertChildToString(child: TreeDataBean | TreeDataBean[]): TreeDataStringBean | TreeDataStringBean[] {
    if (Array.isArray(child)) {
      if (child.length > 0) {
        return child.map(c => this.convertChildToString(c) as TreeDataStringBean);
      } else {
        return [];
      }
    } else if (child && child.children) {
      return {
        thread: child.thread as string,
        value: (child.value / this.KUNIT).toFixed(this.SUB_LENGTH),
        freq: '',
        cycle: child.cycle ? child.cycle : 0,
        dur: (child.dur / this.UNIT).toFixed(this.SUB_LENGTH),
        percent: child.percent ? child.percent.toFixed(this.PERCENT_SUB_LENGTH) : '',
        level: String(child.level),
        startNS: child.startNS ? (child.startNS / this.UNIT).toFixed(this.SUB_LENGTH) : '',
        children: this.convertChildToString(child.children) as unknown as TreeDataStringBean[],
      };
    } else {
      return {
        thread: child.thread as string,
        value: (child.value / this.KUNIT).toFixed(this.SUB_LENGTH),
        freq: child.freq ? child.freq!.toFixed(this.SUB_LENGTH) : '',
        dur: (child.dur / this.UNIT).toFixed(this.SUB_LENGTH),
        percent: child.percent ? child.percent.toFixed(this.PERCENT_SUB_LENGTH) : '',
        level: String(child.level)
      };
    }

  };
  // 表头点击事件 
  private clickTableHeader(data: Array<TreeDataStringBean>): void {
    let labels = this.threadStatesTbl?.shadowRoot?.querySelector('.th > .td')!.querySelectorAll('label');
    const THREAD_INDEX: number = 0;
    const CYCLE_INDEX: number = 1;
    const FREQ_INDEX: number = 2;
    if (labels) {
      for (let i = 0; i < labels.length; i++) {
        let label = labels[i].innerHTML;
        labels[i].addEventListener('click', (e) => {
          if (label.includes('Thread') && i === THREAD_INDEX) {
            this.threadStatesTbl!.setStatus(data, false);
            this.threadStatesTbl!.recycleDs = this.threadStatesTbl!.meauseTreeRowElement(data, RedrawTreeForm.Retract);
          } else if (label.includes('Cycle') && i === CYCLE_INDEX) {
            for (let item of data) {
              item.status = true;
              if (item.children !== undefined && item.children.length > 0) {
                this.threadStatesTbl!.setStatus(item.children, false);
              };
            };
            this.threadStatesTbl!.recycleDs = this.threadStatesTbl!.meauseTreeRowElement(data, RedrawTreeForm.Retract);
          } else if (label.includes('Freq') && i === FREQ_INDEX) {
            for (let item of data) {
              item.status = true;
              for (let e of item.children ? item.children : []) {
                e.status = true;
                if (e.children !== undefined && e.children.length > 0) {
                  this.threadStatesTbl!.setStatus(e.children, true);
                };
              };
            };

            this.threadStatesTbl!.recycleDs = this.threadStatesTbl!.meauseTreeRowElement(data, RedrawTreeForm.Expand);
          };
        });
      };
    };
  };
  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.threadStatesTbl!);
  };

  initHtml(): string {
    return `<style>
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
        button:hover{
            background-color:#666666;
            color:white;
        }
        :host([single]) #single {
          background-color: #666666;
          color: white
        }
        :host([loop]) #loop {
          background-color: #666666;
          color: white
        }
        </style>
        <div id='dataCut'>
            <input id="dataCutThreadId" type="text" style="width: 15%;height:90%;border-radius:10px;border:solid 1px #979797;font-size:15px;text-indent:3%" placeholder="Please input thread id" onkeyup="this.value=this.value.replace(/\\D/g,'')"/>
            <input id="dataCutThreadFunc" type="text" style="width: 20%;height:90%;border-radius:10px;border:solid 1px #979797;font-size:15px;text-indent:3%" placeholder="Please input function name"/>
            <div style="width:20%;height: 100%;display:flex;justify-content: space-around;">
                <button id="single">Single</button>
                <button id="loop">Loop</button>
            </div>
        </div>
        <lit-table id="tb-gpufreq-percent" style="height: auto; overflow-x:auto;width:calc(100vw - 270px)" tree>
            <lit-table-column class="running-percent-column" width="25%" title="Thread/Cycle/Freq" data-index="thread" key="thread" align="flex-start" retract>
            </lit-table-column>
            <lit-table-column class="running-percent-column" width="1fr" title="Cycle_st(ms)" data-index="startNS" key="startNS" align="flex-start">
            </lit-table-column>
            <lit-table-column class="running-percent-column" width="1fr" title="consumption(MHz·ms)" data-index="value" key="value" align="flex-start">
            </lit-table-column>
            <lit-table-column class="running-percent-column" width="1fr" title="Freq(MHz)" data-index="freq" key="freq" align="flex-start">
            </lit-table-column>
            <lit-table-column class="running-percent-column" width="1fr" title="dur(ms)" data-index="dur" key="dur" align="flex-start">
            </lit-table-column>
            <lit-table-column class="running-percent-column" width="1fr" title="Percent(%)" data-index="percent" key="percent" align="flex-start">
            </lit-table-column>
        </lit-table>`;
  };
}
