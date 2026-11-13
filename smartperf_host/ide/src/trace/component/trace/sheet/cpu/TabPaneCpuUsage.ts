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
import { LitTable } from '../../../../../base-ui/table/lit-table';
import { SelectionParam } from '../../../../bean/BoxSelection';
import { CpuUsage, Freq } from '../../../../bean/CpuUsage';
import { resizeObserver } from '../SheetUtils';
import { getTabCpuFreq, getTabCpuUsage } from '../../../../database/sql/Cpu.sql';

@element('tabpane-cpu-usage')
export class TabPaneCpuUsage extends BaseElement {
  private cpuUsageTbl: LitTable | null | undefined;
  private range: HTMLLabelElement | null | undefined;
  private orderByOldList: unknown[] = [];
  private currentSelectionParam: SelectionParam | undefined;

  set data(cpuUsageValue: SelectionParam | unknown) {
    if (this.currentSelectionParam === cpuUsageValue) {
      return;
    }
    // @ts-ignore
    this.currentSelectionParam = cpuUsageValue;
    this.range!.textContent =
      // @ts-ignore
      `Selected range: ${parseFloat(((cpuUsageValue.rightNs - cpuUsageValue.leftNs) / 1000000.0).toFixed(5))} ms`;
    this.cpuUsageTbl!.loading = true;
    Promise.all([
      // @ts-ignore
      getTabCpuUsage(cpuUsageValue.cpus, cpuUsageValue.leftNs, cpuUsageValue.rightNs, cpuUsageValue.traceId),
      // @ts-ignore
      getTabCpuFreq(cpuUsageValue.cpus, cpuUsageValue.leftNs, cpuUsageValue.rightNs, cpuUsageValue.traceId),
    ]).then((result): void => {
      this.cpuUsageTbl!.loading = false;
      let usages = result[0];
      let freqMap = this.groupByCpuToMap(result[1]);
      let data = [];
      // @ts-ignore
      let range = cpuUsageValue.rightNs - cpuUsageValue.leftNs;
      // @ts-ignore
      for (let cpu of cpuUsageValue.cpus) {
        let usage = new CpuUsage();
        usage.cpu = cpu;
        let u = usages.find((e): boolean => e.cpu === cpu);
        if (u) {
          usage.usage = u.usage;
        } else {
          usage.usage = 0;
        }
        if (usage.usage > 1) {
          usage.usage = 1;
        }
        usage.usageStr = `${(usage.usage * 100.0).toFixed(2)}%`;
        this.handleUsage(freqMap, usage, cpuUsageValue, range);
        data.push(usage);
      }
      this.cpuUsageTbl!.recycleDataSource = data;
      this.orderByOldList = [...data];
    });
  }

  private handleUsage(freqMap: Map<number, Array<Freq>>, usage: CpuUsage, cpuUsageValue: unknown, range: number): void {
    let arr = [];
    if (freqMap.has(usage.cpu)) {
      let freqList = freqMap.get(usage.cpu);
      let list = [];
      for (let i = 0; i < freqList!.length; i++) {
        let freq = freqList![i];
        if (i === freqList!.length - 1) {
          // @ts-ignore
          freq.dur = cpuUsageValue.rightNs - freq.startNs;
        } else {
          freq.dur = freqList![i + 1].startNs - freq.startNs;
        }
        // @ts-ignore
        if (freq.startNs + freq.dur > cpuUsageValue.leftNs) {
          list.push(freq);
        }
      }
      if (list.length > 0) {
        // @ts-ignore
        if (list[0].startNs < cpuUsageValue.leftNs) {
          // @ts-ignore
          list[0].dur = list[0].startNs + list[0].dur - cpuUsageValue.leftNs;
          // @ts-ignore
          list[0].startNs = cpuUsageValue.leftNs;
        }
      }
      arr = this.sortFreq(list);
      this.getFreqTop3(usage, arr[0], arr[1], arr[2], range);
    }
  }

  initElements(): void {
    this.cpuUsageTbl = this.shadowRoot?.querySelector<LitTable>('#tb-cpu-usage');
    this.range = this.shadowRoot?.querySelector('#time-range');
    this.cpuUsageTbl?.addEventListener('column-click', (event): void => {
      // @ts-ignore
      let orderType = event.detail;
      if (orderType.sort === 1) {
        //倒序   注意  sort会改变原数组，需要传入table上的数组 不能传入缓存排序数组
        this.sortTable(this.cpuUsageTbl!.recycleDataSource, orderType.key, false);
      } else if (orderType.sort === 2) {
        //正序
        this.sortTable(this.cpuUsageTbl!.recycleDataSource, orderType.key, true);
      } else {
        //默认排序
        this.cpuUsageTbl!.recycleDataSource = [...this.orderByOldList];
      }
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.cpuUsageTbl!);
  }

  sortTable(arr: unknown[], key: string, sort: boolean): void {
    this.cpuUsageTbl!.recycleDataSource = arr.sort((item1, item2): number => {
      // @ts-ignore
      let cpuUsageLeftData = Number(item1[key].toString().replace('%', ''));
      // @ts-ignore
      let cpuUsageRightData = Number(item2[key].toString().replace('%', ''));
      if (cpuUsageLeftData > cpuUsageRightData) {
        return sort ? -1 : 1;
      } else if (cpuUsageLeftData < cpuUsageRightData) {
        return sort ? 1 : -1;
      } else {
        return 0;
      }
    });
  }

  sortFreq(arr: Array<Freq>): Array<Array<number>> {
    let cpuUsageMap = new Map<number, number>();
    for (let freq of arr) {
      if (cpuUsageMap.has(freq.value)) {
        let sumDur = cpuUsageMap.get(freq.value)! + freq.dur;
        cpuUsageMap.set(freq.value, sumDur);
      } else {
        cpuUsageMap.set(freq.value, freq.dur);
      }
    }
    let array = Array.from(cpuUsageMap);
    array.sort((a, b) => b[1] - a[1]);
    return array;
  }

  getFreqTop3(usage: CpuUsage, top1: Array<number>, top2: Array<number>, top3: Array<number>, range: number): void {
    // @ts-ignore
    usage.top1 = top1 === undefined ? '-' : top1[0];
    usage.top1Percent = top1 === undefined ? 0 : (top1[1] * 1.0) / range;
    usage.top1PercentStr = top1 === undefined ? '-' : `${(usage.top1Percent * 100).toFixed(2)}%`;
    // @ts-ignore
    usage.top2 = top2 === undefined ? '-' : top2[0];
    usage.top2Percent = top2 === undefined ? 0 : (top2[1] * 1.0) / range;
    usage.top2PercentStr = top2 === undefined ? '-' : `${(usage.top2Percent * 100).toFixed(2)}%`;
    // @ts-ignore
    usage.top3 = top3 === undefined ? '-' : top3[0];
    usage.top3Percent = top3 === undefined ? 0 : (top3[1] * 1.0) / range;
    usage.top3PercentStr = top3 === undefined ? '-' : `${(usage.top3Percent * 100).toFixed(2)}%`;
  }

  groupByCpuToMap(arr: Array<Freq>): Map<number, Array<Freq>> {
    let cpuUsageMap = new Map<number, Array<Freq>>();
    for (let spt of arr) {
      if (cpuUsageMap.has(spt.cpu)) {
        cpuUsageMap.get(spt.cpu)!.push(spt);
      } else {
        let list: Array<Freq> = [];
        list.push(spt);
        cpuUsageMap.set(spt.cpu, list);
      }
    }
    return cpuUsageMap;
  }

  initHtml(): string {
    return `
        <style>
        .cpu-usage-label{
            width: 100%;
            height: 20px;
        }
        :host{
            padding: 10px 10px;
            display: flex;
            flex-direction: column;
        }
        </style>
        <label id="time-range" class="cpu-usage-label" style="text-align: end;font-size: 10pt;margin-bottom: 5px">Selected range:0.0 ms</label>
        <lit-table id="tb-cpu-usage" style="height: auto">
            <lit-table-column class="cpu-usage-column" order width="1fr" title="CPU" data-index="cpu" key="cpu" align="flex-start">
            </lit-table-column>
            <lit-table-column class="cpu-usage-column" order width="1fr" title="Usage" data-index="usageStr" key="usageStr" align="flex-start" >
            </lit-table-column>
            <lit-table-column class="cpu-usage-column" order width="1fr" title="CPU Freq Top1(K)" data-index="top1" key="top1" align="flex-start" >
            </lit-table-column>
            <lit-table-column class="cpu-usage-column" order width="1fr" title="Top1 percent(%)" data-index="top1PercentStr" key="top1PercentStr" align="flex-start" >
            </lit-table-column>
            <lit-table-column class="cpu-usage-column" order width="1fr" title="CPU Freq Top2(K)" data-index="top2" key="top2" align="flex-start" >
            </lit-table-column>
            <lit-table-column class="cpu-usage-column" order width="1fr" title="Top2 percent(%)" data-index="top2PercentStr" key="top2PercentStr" align="flex-start" >
            </lit-table-column>
            <lit-table-column class="cpu-usage-column" order width="1fr" title="CPU Freq Top3(K)" data-index="top3" key="top3" align="flex-start" >
            </lit-table-column>
            <lit-table-column class="cpu-usage-column" order width="1fr" title="Top3 percent(%)" data-index="top3PercentStr" key="top3PercentStr" align="flex-start" >
            </lit-table-column>
        </lit-table>
        `;
  }
}
