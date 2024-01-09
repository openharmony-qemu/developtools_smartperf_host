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
import { type LitTable, RedrawTreeForm } from '../../../../../base-ui/table/lit-table';
import { SelectionParam } from '../../../../bean/BoxSelection';
import { getGpufreqData, getGpufreqDataCut } from '../../../../database/sql/Perf.sql';
import { resizeObserver } from '../SheetUtils';
import { SpSegmentationChart } from '../../../chart/SpSegmentationChart';
import { GpuCountBean, TreeDataBean, type SearchGpuFuncBean } from '../../../../bean/GpufreqBean';

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
        if (result.length === 1) {
          resultList[0].dur = String(threadStatesParam.rightNs - threadStatesParam.leftNs);
          resultList[0].count = String(Number(resultList[0].dur) * Number(resultList[0].value));
        } else {
          resultList[0].dur = String(Number(resultList[1].startNS) - threadStatesParam.leftNs);
          resultList[0].count = String(Number(resultList[0].dur) * Number(resultList[0].value));

          resultList[resultList.length - 1].dur = String(
            threadStatesParam.rightNs - Number(resultList[resultList.length - 1].startNS)
          );
          resultList[resultList.length - 1].count = String(
            Number(resultList[resultList.length - 1].dur) * Number(resultList[resultList.length - 1].value)
          );
        };

        this.initData = resultList;
        this.threadStatesTbl!.loading = false;
      } else {
        this.threadStatesTbl!.recycleDataSource = [];
        this.threadStatesTbl!.loading = false;
      };
    });
    this._threadId!.style.border = '1px solid rgb(151, 151, 151)';
    this._threadFunc!.style.border = '1px solid rgb(151, 151, 151)';
  };

  initElements(): void {
    this.threadStatesTbl = this.shadowRoot?.querySelector<LitTable>('#tb-gpufreq-percent');
    this._single = this.shadowRoot?.querySelector<LitButton>('#single');
    this._loop = this.shadowRoot?.querySelector<LitButton>('#loop');
    this._threadId = this.shadowRoot?.querySelector<HTMLInputElement>('#dataCutThreadId');
    this._threadFunc = this.shadowRoot?.querySelector<HTMLInputElement>('#dataCutThreadFunc');
    this.threadIdValue = this._threadId!.value.trim();
    this.threadFuncName = this._threadFunc!.value.trim();
    //点击single
    this._single?.addEventListener('click', (e) => {
      this.clickFun(this._single!.innerHTML);
    });
    //点击loop
    this._loop?.addEventListener('click', (e) => {
      this.clickFun(this._loop!.innerHTML);
    });
    this.threadStatesTbl?.addEventListener('row-click', (event: Event) => {
      const EVENT_LEVEL: number = 2;
      // @ts-ignore
      if (event.detail.level === EVENT_LEVEL && event.detail.thread.includes('cycle')) {
        // @ts-ignore
        SpSegmentationChart.tabHover('GPU-FREQ', true, event.detail.data.cycle);
      };
    });

    this.addInputBorderEvent(this._threadId!);
    this.addInputBorderEvent(this._threadFunc!);
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
            <lit-table-column class="running-percent-column" width="1fr" title="Cycle_st(ms)" data-index="startTime" key="ts" align="flex-start">
            </lit-table-column>
            <lit-table-column class="running-percent-column" width="1fr" title="consumption(MHz·ms)" data-index="count" key="count" align="flex-start">
            </lit-table-column>
            <lit-table-column class="running-percent-column" width="1fr" title="Freq(MHz)" data-index="freq" key="freq" align="flex-start">
            </lit-table-column>
            <lit-table-column class="running-percent-column" width="1fr" title="dur(ms)" data-index="dur" key="dur" align="flex-start">
            </lit-table-column>
            <lit-table-column class="running-percent-column" width="1fr" title="Percent(%)" data-index="percent" key="percent" align="flex-start">
            </lit-table-column>
        </lit-table>`;
  };

  private clickFun(fun: string): void {
    this.threadIdValue = this._threadId!.value.trim();
    this.threadFuncName = this._threadFunc!.value.trim();
    this.threadStatesTbl!.loading = true;
    SpSegmentationChart.tabHover('GPU-FREQ', false, -1);
    this.validationFun(this.threadIdValue, this.threadFuncName, fun);
  }

  private addInputBorderEvent(inputElement: HTMLInputElement): void {
    if (inputElement) {
      inputElement.addEventListener('change', function () {
        if (this.value.trim() !== '') {
          this.style.border = '1px solid rgb(151, 151, 151)';
        }
      });
    }
  }

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
      this.getGpufreqData(this.currentSelectionParam!.leftNs, this.currentSelectionParam!.rightNs, true).then(
        (result: Array<GpuCountBean>) => {
          if (result !== null && result.length > 0 && dataCut.length > 0) {
            this.filterData(initData, dataCut, result);
          } else {
            this.threadStatesTbl!.recycleDataSource = [];
            this.threadStatesTbl!.loading = false;
          };
        }
      );
    } else {
      this.threadStatesTbl!.recycleDataSource = [];
      this.threadStatesTbl!.loading = false;
      SpSegmentationChart.setChartData('GPU-FREQ', []);
    };
  };

  async getGpufreqData(leftNs: number, rightNs: number, isTrue: boolean): Promise<Array<GpuCountBean>> {
    let result: Array<GpuCountBean> = await getGpufreqData(leftNs, rightNs, isTrue);
    return result;
  };

  async getGpufreqDataCut(
    tIds: string,
    funcName: string,
    leftNS: number,
    rightNS: number,
    single: boolean,
    loop: boolean
  ): Promise<Array<SearchGpuFuncBean>> {
    let result: Array<SearchGpuFuncBean> = await getGpufreqDataCut(tIds, funcName, leftNS, rightNS, single, loop);
    return result;
  };

  private filterData(
    initData: Array<GpuCountBean>,
    dataCut: Array<SearchGpuFuncBean>,
    result: Array<GpuCountBean>
  ): void {
    let finalGpufreqData: Array<TreeDataBean> = new Array();
    let earliest: number = Number(result[0].startNS);
    let _dataCut: Array<SearchGpuFuncBean> = dataCut.filter((i) => i.startTime >= earliest);
    let _lastList: Array<GpuCountBean> = [];
    for (let i = 0; i < _dataCut.length; i++) {
      let e: SearchGpuFuncBean = _dataCut[i];
      for (let j of initData) {
        _lastList.push(...this.segmentationData(j, e, i));
      };
    };
    let tree: TreeDataBean = this.createTree(_lastList);
    finalGpufreqData.push(tree);
    this.threadStatesTbl!.recycleDataSource = finalGpufreqData;
    this.threadStatesTbl!.loading = false;
    this.clickTableHeader(finalGpufreqData);
  };

  private segmentationData(j: GpuCountBean, e: SearchGpuFuncBean, i: number): Array<GpuCountBean> {
    let lastList: Array<GpuCountBean> = [];
    if (e.startTime >= Number(j.startNS) && e.startTime <= Number(j.endTime)) {
      if (e.endTime <= Number(j.endTime)) {
        lastList.push(
          new GpuCountBean(
            j.filterId, j.freq, String((e.endTime - e.startTime) * Number(j.value)),
            j.value, String(e.startTime + this.currentSelectionParam!.recordStartNs),
            String(e.endTime - e.startTime), String(e.startTime), String(e.endTime),
            j.thread, i
          )
        );
      } else {
        lastList.push(
          new GpuCountBean(
            j.filterId, j.freq, String((Number(j.endTime) - e.startTime) * Number(j.value)),
            j.value, String(e.startTime + this.currentSelectionParam!.recordStartNs),
            String(Number(j.endTime) - e.startTime), String(e.startTime), String(j.endTime),
            j.thread, i
          )
        );
      };
    } else if (e.startTime <= Number(j.startNS) && Number(j.endTime) <= e.endTime) {
      lastList.push(
        new GpuCountBean(
          j.filterId, j.freq, String((Number(j.endTime) - Number(j.startNS)) * Number(j.value)),
          j.value, String(Number(j.startNS) + this.currentSelectionParam!.recordStartNs),
          String(Number(j.endTime) - Number(j.startNS)), String(j.startNS), String(j.endTime),
          j.thread, i
        )
      );
    } else if (Number(j.startNS) <= e.endTime && e.endTime <= Number(j.endTime)) {
      lastList.push(
        new GpuCountBean(
          j.filterId, j.freq, String((e.endTime - Number(j.startNS)) * Number(j.value)),
          j.value, String(Number(j.startNS) + this.currentSelectionParam!.recordStartNs),
          String(e.endTime - Number(j.startNS)), String(j.startNS), String(e.endTime),
          j.thread, i
        )
      );
    };
    return lastList;
  };

  private createTree(data: Array<GpuCountBean>): TreeDataBean {
    if (data.length > 0) {
      const root = {
        thread: 'gpufreq Frequency',
        count: '0',
        freq: '',
        dur: '0',
        percent: '100',
        level: 1,
        children: [],
      };
      const valueMap: { [parentIndex: string]: TreeDataBean } = {};
      data.forEach((item: GpuCountBean) => {
        let parentIndex: number = item.parentIndex !== undefined ? item.parentIndex : 0;
        let freq: string = item.freq;
        const UNIT: number = 1000000;
        const KUNIT: number = 1000000000000;
        let _dur: number = Number(item.dur);
        let _count: number = Number(item.count);
        let _freq: number = Number(item.freq);
        item.thread = `${item.thread} Frequency`;
        item.level = 4;
        item.dur = (_dur / UNIT).toFixed(this.SUB_LENGTH);
        item.count = (_count / KUNIT).toFixed(this.SUB_LENGTH);
        item.freq = _freq.toFixed(this.SUB_LENGTH);
        this.updateValueMap(item, parentIndex, freq, valueMap, UNIT);
      });
      Object.values(valueMap).forEach((node: TreeDataBean) => {
        const parentNode: TreeDataBean = valueMap[Number(node.value) - 1];
        if (parentNode) {
          this.updateChildNode(node, parentNode);
        } else {
          this.updateRootNode(node, root);
        };
      });
      // 移除 key 值
      root.children.forEach((item: TreeDataBean) => {
        item.children = Object.values(item.children);
      });
      this.calculatePercent(root, root);
      SpSegmentationChart.setChartData('GPU-FREQ', root.children);
      return root;
    } else {
      return new TreeDataBean();
    };
  };

  private updateValueMap(item: GpuCountBean, parentIndex: number, freq: string,
    valueMap: { [parentIndex: string]: TreeDataBean }, UNIT: number
  ): void {
    if (!valueMap[parentIndex]) {
      valueMap[parentIndex] = {
        thread: `cycle ${parentIndex + 1} ${item.thread}`,
        count: item.count,
        dur: item.dur,
        ts: item.ts,
        startTime: (Number(item.startNS) / UNIT).toFixed(this.SUB_LENGTH),
        startNS: item.startNS,
        percent: '100',
        level: 2,
        cycle: parentIndex + 1,
        children: [],
      };
    } else {
      let fdur: number = Number(valueMap[parentIndex].dur);
      let fcount: number = Number(valueMap[parentIndex].count);
      let idur: number = Number(item.dur);
      let icount: number = Number(item.count);
      fdur += idur;
      valueMap[parentIndex].dur = fdur.toFixed(this.SUB_LENGTH);
      fcount += icount;
      valueMap[parentIndex].count = fcount.toFixed(this.SUB_LENGTH);
    };
    if (!valueMap[parentIndex].children[Number(freq)]) {
      valueMap[parentIndex].children[Number(freq)] = {
        thread: item.thread,
        count: item.count,
        gpufreq: item.freq,
        dur: item.dur,
        percent: '100',
        level: 3,
        children: [],
      };
    } else {
      let zdur: number = Number(valueMap[parentIndex].children[Number(freq)].dur);
      let zcount: number = Number(valueMap[parentIndex].children[Number(freq)].count);
      let idur: number = Number(item.dur);
      let icount: number = Number(item.count);
      zdur += idur;
      valueMap[parentIndex].children[Number(freq)].dur = zdur.toFixed(this.SUB_LENGTH);
      zcount += icount;
      valueMap[parentIndex].children[Number(freq)].count = zcount.toFixed(this.SUB_LENGTH);
    };
    valueMap[parentIndex].children[Number(freq)].children.push(item as unknown as TreeDataBean);
  };

  private updateChildNode(node: TreeDataBean, parentNode: TreeDataBean): void {
    parentNode.children.push(node);
    let pdur: number = Number(parentNode.dur);
    let pcount: number = Number(parentNode.count);
    let ndur: number = Number(node.dur);
    let ncount: number = Number(node.count);
    pdur += ndur;
    parentNode.dur = pdur.toFixed(this.SUB_LENGTH);
    pcount += ncount;
    parentNode.count += pcount.toFixed(this.SUB_LENGTH);
  };

  private updateRootNode(node: TreeDataBean, root: TreeDataBean): void {
    root.children.push(node);
    let rdur: number = Number(root.dur);
    let rcount: number = Number(root.count);
    let ndur: number = Number(node.dur);
    let ncount: number = Number(node.count);
    rdur += ndur;
    root.dur = rdur.toFixed(this.SUB_LENGTH);
    rcount += ncount;
    root.count = rcount.toFixed(this.SUB_LENGTH);
  };

  private calculatePercent(node: TreeDataBean, root: TreeDataBean): void {
    const UNIT: number = 100
    node.percent = ((Number(node.count) / Number(root.count)) * UNIT).toFixed(this.PERCENT_SUB_LENGTH);

    if (node.children && node.children.length > 0) {
      node.children.forEach((childNode) => this.calculatePercent(childNode, root));
    } else {
      return;
    };
  };

  private clickTableHeader(data: Array<TreeDataBean>): void {
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
                  this.threadStatesTbl!.setStatus(e.children, false, 0);
                };
              };
            };

            this.threadStatesTbl!.recycleDs = this.threadStatesTbl!.meauseTreeRowElement(data, RedrawTreeForm.Expand);
          };
        });
      };
    };
  };
};
