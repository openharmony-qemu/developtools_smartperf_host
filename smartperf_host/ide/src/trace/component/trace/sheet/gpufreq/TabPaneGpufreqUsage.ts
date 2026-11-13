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
import { type GpuCountBean, TreeDataBean, TreeDataStringBean } from '../../../../bean/GpufreqBean';

@element('tabpane-gpufreq')
export class TabPaneGpufreq extends BaseElement {
  private threadStatesTbl: LitTable | null | undefined;
  private currentSelectionParam: SelectionParam | undefined;
  private SUB_LENGTH: number = 3;
  private PERCENT_SUB_LENGTH: number = 2;
  private UNIT: number = 1000000;
  private KUNIT: number = 1000000000000;

  set data(clockCounterValue: SelectionParam) {
    let finalGpufreqData: Array<TreeDataStringBean> = new Array();
    if (this.currentSelectionParam === clockCounterValue) {
      return;
    }
    this.currentSelectionParam = clockCounterValue;
    this.threadStatesTbl!.recycleDataSource = [];
    this.threadStatesTbl!.loading = true;
    getGpufreqData(clockCounterValue.leftNs, clockCounterValue.rightNs, false).then(
      (result: Array<GpuCountBean>): void => {
        if (result !== null && result.length > 0) {
          let resultList: Array<GpuCountBean> = JSON.parse(JSON.stringify(result));
          resultList[0].dur = resultList[1]
            ? resultList[1].startNS - clockCounterValue.leftNs
            : clockCounterValue.rightNs - clockCounterValue.leftNs;
          resultList[0].value = resultList[0].dur * resultList[0].val;
          resultList[resultList.length - 1].dur =
            resultList.length - 1 !== 0
              ? clockCounterValue.rightNs - resultList[resultList.length - 1].startNS
              : resultList[0].dur;
          resultList[resultList.length - 1].value =
            resultList.length - 1 !== 0
              ? resultList[resultList.length - 1].dur * resultList[resultList.length - 1].val
              : resultList[0].value;
          // 将切割完成后的数据整理成树形
          let tree: TreeDataStringBean = this.createTree(resultList);
          finalGpufreqData.push(tree);
          this.threadStatesTbl!.recycleDataSource = finalGpufreqData;
          this.threadStatesTbl!.loading = false;
          this.clickTableHeader(finalGpufreqData);
        } else {
          this.threadStatesTbl!.recycleDataSource = [];
          this.threadStatesTbl!.loading = false;
        }
      }
    );
  }

  initElements(): void {
    this.threadStatesTbl = this.shadowRoot?.querySelector<LitTable>('#tb-gpufreq-percent');
  }

  // 创建树形结构
  private createTree(data: Array<GpuCountBean>): TreeDataStringBean {
    if (data.length > 0) {
      const root: {
        thread: string;
        value: number;
        dur: number;
        percent: number;
        children: TreeDataBean[];
      } = {
        thread: 'gpufreq Frequency',
        value: 0,
        dur: 0,
        percent: 100,
        children: [],
      };
      const valueMap: { [freq: string]: TreeDataBean } = {};
      data.forEach((item: GpuCountBean) => {
        let freq: number = item.freq;
        item.thread = `${item.thread} Frequency`;
        this.updateValueMap(item, freq, valueMap);
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
      let _root = this.RetainDecimals(root);
      return _root;
    }
    return new TreeDataStringBean('', '', '', '', '', '');
  }
  // 更新valueMap，用于整理相同频点的数据
  private updateValueMap(item: GpuCountBean, freq: number, valueMap: { [freq: string]: TreeDataBean }): void {
    if (!valueMap[freq]) {
      valueMap[freq] = {
        thread: 'gpufreq Frequency',
        value: item.value,
        freq: item.freq,
        dur: item.dur,
        percent: 100,
        children: [],
      };
    } else {
      valueMap[freq].dur += item.dur;
      valueMap[freq].value += item.value;
    }
    valueMap[freq].children.push(item as unknown as TreeDataBean);
  }
  // 对树进行扁平化处理和计算
  private flattenAndCalculate(node: TreeDataBean, root: TreeDataBean): void {
    //处理百分比计算问题并保留两位小数
    node.percent = (node.value / root.value) * 100;
    if (node.children) {
      node.children = node.children.flat();
      node.children.forEach((childNode) => this.flattenAndCalculate(childNode, root));
    }
  }
  // 将树形数据进行保留小数操作
  private RetainDecimals(root: TreeDataBean): TreeDataStringBean {
    const treeDataString: TreeDataStringBean = new TreeDataStringBean(
      root.thread!,
      (root.value / this.KUNIT).toFixed(this.SUB_LENGTH),
      (root.dur / this.UNIT).toFixed(this.SUB_LENGTH),
      root.percent!.toFixed(this.PERCENT_SUB_LENGTH),
      String(root.level),
      '',
      0,
      [],
      '',
      false
    );
    if (root.children) {
      for (const child of root.children) {
        treeDataString.children!.push(this.convertChildToString(child) as TreeDataStringBean);
      }
    }
    return treeDataString;
  }
  // 将树形数据进行保留小数的具体操作
  private convertChildToString(child: TreeDataBean | TreeDataBean[]): TreeDataStringBean | TreeDataStringBean[] {
    if (Array.isArray(child)) {
      if (child.length > 0) {
        return child.map((c) => this.convertChildToString(c) as TreeDataStringBean);
      } else {
        return [];
      }
    } else if (child && child.children) {
      return {
        thread: child.thread as string,
        value: (child.value / this.KUNIT).toFixed(this.SUB_LENGTH),
        freq: '',
        dur: (child.dur / this.UNIT).toFixed(this.SUB_LENGTH),
        percent: child.percent ? child.percent.toFixed(this.PERCENT_SUB_LENGTH) : '',
        children: this.convertChildToString(child.children) as unknown as TreeDataStringBean[],
      };
    } else {
      return {
        thread: child.thread as string,
        value: (child.value / this.KUNIT).toFixed(this.SUB_LENGTH),
        freq: child.freq ? child.freq!.toFixed(this.SUB_LENGTH) : '',
        dur: (child.dur / this.UNIT).toFixed(this.SUB_LENGTH),
        percent: child.percent ? child.percent.toFixed(this.PERCENT_SUB_LENGTH) : '',
        level: String(child.level),
      };
    }
  }
  // 表头点击事件
  private clickTableHeader(data: Array<TreeDataStringBean>): void {
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
                this.threadStatesTbl!.setStatus(item.children, true);
              }
            }
            this.threadStatesTbl!.recycleDs = this.threadStatesTbl!.meauseTreeRowElement(data, RedrawTreeForm.Expand);
          }
        });
      }
    }
  }
  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.threadStatesTbl!);
  }

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
            <lit-table-column class="gpufreq-percent-column" width='1fr' title="consumption(MHz·ms)" data-index="value" key="value" align="flex-start">
            </lit-table-column>
            <lit-table-column class="gpufreq-percent-column" width='1fr' title="Freq(MHz)" data-index="freq" key="freq" align="flex-start">
            </lit-table-column>
            <lit-table-column class="gpufreq-percent-column" width='1fr' title="dur(ms)" data-index="dur" key="dur" align="flex-start">
            </lit-table-column>
            <lit-table-column class="gpufreq-percent-column" width='1fr' title="Percent(%)" data-index="percent" key="percent" align="flex-start">
            </lit-table-column>
        </lit-table>
        `;
  }
}
