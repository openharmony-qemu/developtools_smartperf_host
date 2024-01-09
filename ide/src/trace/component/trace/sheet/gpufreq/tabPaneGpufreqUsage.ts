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
import { type SelectionParam } from '../../../../bean/BoxSelection';
import { getGpufreqData } from '../../../../database/sql/Perf.sql';
import { resizeObserver } from '../SheetUtils';
import { type GpuCountBean, TreeDataBean } from '../../../../bean/GpufreqBean'

@element('tabpane-gpufreq')
export class TabPaneGpufreq extends BaseElement {
  private threadStatesTbl: LitTable | null | undefined;
  private currentSelectionParam: SelectionParam | undefined;
  private SUB_LENGTH: number = 3;
  private PERCENT_SUB_LENGTH: number = 2;

  set data(clockCounterValue: SelectionParam) {
    let finalGpufreqData: Array<TreeDataBean> = [];
    if (this.currentSelectionParam === clockCounterValue) {
      return;
    };
    this.currentSelectionParam = clockCounterValue;
    this.threadStatesTbl!.recycleDataSource = [];
    this.threadStatesTbl!.loading = true;
    getGpufreqData(clockCounterValue.leftNs, clockCounterValue.rightNs, false).then((result: Array<GpuCountBean>): void => {
      if (result !== null && result.length > 0) {
        let resultList: Array<GpuCountBean> = JSON.parse(JSON.stringify(result));
        if (result.length === 1) {
          resultList[0].dur = String(clockCounterValue.rightNs - clockCounterValue.leftNs);
          resultList[0].count = String(Number(resultList[0].dur) * Number(resultList[0].value));
        } else {
          resultList[0].dur = String(Number(resultList[1].startNS) - clockCounterValue.leftNs);
          resultList[0].count = String(Number(resultList[0].dur) * Number(resultList[0].value));

          resultList[resultList.length - 1].dur = String(clockCounterValue.rightNs - Number(resultList[resultList.length - 1].startNS));
          resultList[resultList.length - 1].count = String(Number(resultList[resultList.length - 1].dur) * Number(resultList[resultList.length - 1].value));
        };
        let tree: TreeDataBean = this.createTree(resultList);
        finalGpufreqData.push(tree);
        this.threadStatesTbl!.recycleDataSource = finalGpufreqData;
        this.threadStatesTbl!.loading = false;
        this.clickTableHeader(finalGpufreqData);
      } else {
        this.threadStatesTbl!.recycleDataSource = [];
        this.threadStatesTbl!.loading = false;
      };

    });
  };

  initElements(): void {
    this.threadStatesTbl = this.shadowRoot?.querySelector<LitTable>('#tb-gpufreq-percent');
  };

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.threadStatesTbl!);
  };

  initHtml(): string {
    return `
        <style>
        :host{
            padding: 10px 10px;
            display: flex;
            flex-direction: column;
        }
        </style>
        <lit-table id="tb-gpufreq-percent" style="height: auto; overflow-x:auto;width:calc(100vw - 270px)" tree>
            <lit-table-column class="gpufreq-percent-column" width='25%' title="Thread/Freq" data-index="thread" key="thread" align="flex-start" retract>
            </lit-table-column>
            <lit-table-column class="gpufreq-percent-column" width='1fr' title="consumption(MHz·ms)" data-index="count" key="count" align="flex-start">
            </lit-table-column>
            <lit-table-column class="gpufreq-percent-column" width='1fr' title="Freq(MHz)" data-index="freq" key="freq" align="flex-start">
            </lit-table-column>
            <lit-table-column class="gpufreq-percent-column" width='1fr' title="dur(ms)" data-index="dur" key="dur" align="flex-start">
            </lit-table-column>
            <lit-table-column class="gpufreq-percent-column" width='1fr' title="Percent(%)" data-index="percent" key="percent" align="flex-start">
            </lit-table-column>
        </lit-table>
        `;
  };

  private createTree(data: Array<GpuCountBean>): TreeDataBean {
    if (data.length > 0) {
      const root = {
        thread: 'gpufreq Frequency',
        count: '0',
        freq: '',
        dur: '0',
        percent: '100',
        children: [],
      };

      const valueMap: { [freq: string]: TreeDataBean } = {};
      data.forEach((item: GpuCountBean) => {
        let freq: string = item.freq;
        let UNIT: number = 1000000;
        const KUNIT: number = 1000000000000;
        let _dur: number = Number(item.dur);
        let _count: number = Number(item.count);
        let _freq: number = Number(item.freq);
        item.dur = (_dur / UNIT).toFixed(this.SUB_LENGTH);
        item.count = (_count / KUNIT).toFixed(this.SUB_LENGTH);
        item.freq = _freq.toFixed(this.SUB_LENGTH);
        item.thread = `${item.thread} Frequency`;
        this.updateValueMap(item, freq, valueMap);
      });
      Object.values(valueMap).forEach((node: TreeDataBean) => {
        const parentNode: TreeDataBean = valueMap[Number(node.value) - 1];
        if (parentNode) {
          this.updateChildNode(node, parentNode);
        } else {
          this.updateRootNode(node, root);
        };
      });

      this.calculatePercent(root, root);

      return root;

    };
    return new TreeDataBean();
  };

  private updateValueMap(item: GpuCountBean, freq: string, valueMap: { [freq: string]: TreeDataBean }): void {
    if (!valueMap[freq]) {
      valueMap[freq] = {
        thread: 'gpufreq Frequency',
        count: item.count,
        gpufreq: item.freq,
        dur: item.dur,
        percent: '100',
        children: [],
      };
    } else {
      let fdur: number = Number(valueMap[freq].dur);
      let fcount: number = Number(valueMap[freq].count);
      let idur: number = Number(item.dur);
      let icount: number = Number(item.count);
      fdur += idur;
      valueMap[freq].dur = fdur.toFixed(this.SUB_LENGTH);
      fcount += icount;
      valueMap[freq].count = fcount.toFixed(this.SUB_LENGTH);
    };
    valueMap[freq].children.push(item as unknown as TreeDataBean);
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
    parentNode.count = pcount.toFixed(this.SUB_LENGTH);
  };

  private updateRootNode(node: TreeDataBean, root: TreeDataBean): void {
    root.children.push(<TreeDataBean>node);
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
    node.percent = (Number(node.count) / Number(root.count) * UNIT).toFixed(this.PERCENT_SUB_LENGTH);

    if (node.children && node.children.length > 0) {
      node.children.forEach((childNode) => this.calculatePercent(childNode, root));
    } else {
      return;
    };
  };

  private clickTableHeader(data: Array<TreeDataBean>): void {
    let labels = this.threadStatesTbl?.shadowRoot?.querySelector('.th > .td')!.querySelectorAll('label');
    const THREAD_INDEX: number = 0;
    const FREQ_INDEX: number = 1;
    if (labels) {
      for (let i = 0; i < labels.length; i++) {
        let label = labels[i].innerHTML;
        labels[i].addEventListener('click', (e) => {

          if (label.includes('Thread') && i === THREAD_INDEX) {
            this.threadStatesTbl!.setStatus(data, false);
            this.threadStatesTbl!.recycleDs = this.threadStatesTbl!.meauseTreeRowElement(data, RedrawTreeForm.Retract);

          } else if (label.includes('Freq') && i === FREQ_INDEX) {

            for (let item of data) {
              item.status = true;
              if (item.children !== undefined && item.children.length > 0) {
                this.threadStatesTbl!.setStatus(item.children, false);
              };
            };
            this.threadStatesTbl!.recycleDs = this.threadStatesTbl!.meauseTreeRowElement(data, RedrawTreeForm.Expand);

          };
        });
      };
    };
  };
}