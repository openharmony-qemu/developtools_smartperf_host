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
import { XpowerGpuFreqStruct } from '../../../../database/ui-worker/ProcedureWorkerXpowerGpuFreq';
import { SpSystemTrace } from '../../../SpSystemTrace';
import { SpChartList } from '../../SpChartList';
import { TraceRow } from '../../base/TraceRow';
import { SortDetail, resizeObserver } from '../SheetUtils';

@element('tabpane-xpower-gpu-freq')
export class TabPaneXpowerGpuFreq extends BaseElement {
  private XpowerGpuFreqTbl: LitTable | null | undefined;
  private XpowerGpuFreqRange: HTMLLabelElement | null | undefined;
  private XpowerGpuFreqSource: Array<TabXpowerGpuFreqStruct> = [];
  private sumCount: number = 0;
  private tabTitle: HTMLDivElement | undefined | null;
  private traceRow: TraceRow<XpowerGpuFreqStruct> | undefined | null;
  private checked: boolean[] = [];
  private checkedValue: string[] = [];
  private systemTrace: SpSystemTrace | undefined | null;
  private spChartList: SpChartList | undefined | null;

  set data(XpowerGpuFreqValue: SelectionParam) {
    this.init();
    this.XpowerGpuFreqTbl!.shadowRoot!.querySelector<HTMLDivElement>('.table')!.style!.height = `${
      this.parentElement!.clientHeight - 45
    }px`;
    this.XpowerGpuFreqRange!.textContent = `Selected range: ${parseFloat(
      ((XpowerGpuFreqValue.rightNs - XpowerGpuFreqValue.leftNs) / 1000000.0).toFixed(5)
    )} ms`;
    this.traceRow = this.systemTrace!.shadowRoot?.querySelector<TraceRow<XpowerGpuFreqStruct>>(
      "trace-row[row-id='gpu-frequency']"
    );
    if (!this.traceRow) {
      this.spChartList = this.systemTrace!.shadowRoot?.querySelector('div > sp-chart-list');
      this.traceRow = this.spChartList?.shadowRoot!.querySelector(".root > div > trace-row[row-id='gpu-frequency']");
    }
    this.checked = this.traceRow!.rowSettingCheckedBoxList!;
    this.checkedValue = this.traceRow!.rowSettingCheckBoxList!;
    this.getGpuFreqData(XpowerGpuFreqValue).then();
  }

  async getGpuFreqData(XpowerGpuFreqValue: SelectionParam): Promise<void> {
    this.sumCount = 0;
    let dataSource: Array<TabXpowerGpuFreqStruct> = [];
    let collect = XpowerGpuFreqValue.xpowerGpuFreqMapData;
    this.XpowerGpuFreqTbl!.loading = true;
    for (let key of collect.keys()) {
      let gpuFreqs = collect.get(key);
      let res = (await gpuFreqs?.({
        startNS: XpowerGpuFreqValue.leftNs,
        endNS: XpowerGpuFreqValue.rightNs,
        queryAll: true,
      })) as XpowerGpuFreqStruct[];
      res = res.filter((item) => this.checked[this.checkedValue?.indexOf(item.frequency.toString())]);
      let sd = this.createTabXpowerGpuFreqStruct(res || []);
      dataSource = dataSource.concat(sd);
    }
    this.XpowerGpuFreqTbl!.loading = false;
    this.XpowerGpuFreqSource = dataSource;
    this.XpowerGpuFreqTbl!.recycleDataSource = dataSource;
  }

  private init(): void {
    const thTable = this.tabTitle!.querySelector('.th');
    const list = thTable!.querySelectorAll('div');
    if (this.tabTitle!.hasAttribute('sort')) {
      this.tabTitle!.removeAttribute('sort');
      list.forEach((item) => {
        item.querySelectorAll('svg').forEach((svg) => {
          svg.style.display = 'none';
        });
      });
    }
  }

  initElements(): void {
    this.systemTrace = document
      .querySelector('body > sp-application')
      ?.shadowRoot!.querySelector<SpSystemTrace>('#sp-system-trace');
    this.XpowerGpuFreqTbl = this.shadowRoot?.querySelector<LitTable>('#tb-gpu-freq');
    this.tabTitle = this.XpowerGpuFreqTbl!.shadowRoot?.querySelector('.thead') as HTMLDivElement;
    this.XpowerGpuFreqRange = this.shadowRoot?.querySelector('#time-range');
    this.XpowerGpuFreqTbl!.addEventListener('column-click', (evt): void => {
      // @ts-ignore
      this.sortByColumn(evt.detail);
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.XpowerGpuFreqTbl!);
  }

  initHtml(): string {
    return `
        <style>
        .xpower-gpu-freq-label{
            margin-bottom: 5px;
        }
        :host{
            padding: 10px 10px;
            display: flex;
            flex-direction: column;
        }
        </style>
        <label id="time-range" class="xpower-gpu-freq-label" style="width: 100%;height: 20px;text-align: end;font-size: 10pt;">Selected range:0.0 ms</label>
        <lit-table id="tb-gpu-freq" style="height: auto">
            <lit-table-column title="Frequency" data-index="frequency" key="frequency" align="flex-start" width="25%" order>
            </lit-table-column>
            <lit-table-column  title="Count" data-index="count" key="count" align="flex-start" width="1fr" order>
            </lit-table-column>
            <lit-table-column title="Avg RunTime(ms)" data-index="avgRunTime" key="avgRunTime" align="flex-start" width="1fr" order>
            </lit-table-column>
            <lit-table-column title="Max RunTime(ms)"  data-index="maxRunTime" key="maxRunTime" align="flex-start" width="1fr" order>
            </lit-table-column>
            <lit-table-column title="Min RunTime(ms)" data-index="minRunTime" key="minRunTime" align="flex-start" width="1fr" order>
            </lit-table-column>
            <lit-table-column title="Avg IdleTime(ms)" data-index="avgIdleTime" key="avgIdleTime" align="flex-start" width="1fr" order>
            </lit-table-column>
            <lit-table-column title="Max IdleTime(ms)"  data-index="maxIdleTime" key="maxIdleTime" align="flex-start" width="1fr" order>
            </lit-table-column>
            <lit-table-column title="Min IdleTime(ms)" data-index="minIdleTime" key="minIdleTime" align="flex-start" width="1fr" order>
            </lit-table-column>
        </lit-table>
        `;
  }

  private setGpuFreqMap(list: Array<XpowerGpuFreqStruct>): Map<number, XpowerGpuFreqStruct[]> {
    let gpuFreqMap = new Map();
    list.forEach((item) => {
      if (gpuFreqMap.has(item.frequency)) {
        const data = gpuFreqMap.get(item.frequency)!;
        data.push(item);
      } else {
        const data: XpowerGpuFreqStruct[] = [];
        data.push(item);
        gpuFreqMap.set(item.frequency, data);
      }
    });
    return gpuFreqMap;
  }

  private setTabXpowerGpuFreqStruct(
    runTimeValue: number,
    idleTimeValue: number,
    tabXpowerGpuFreqStruct: TabXpowerGpuFreqStruct
  ): TabXpowerGpuFreqStruct {
    tabXpowerGpuFreqStruct.avgRunTime = parseFloat(runTimeValue.toFixed(2));
    tabXpowerGpuFreqStruct.maxRunTime = runTimeValue;
    tabXpowerGpuFreqStruct.minRunTime = runTimeValue;
    tabXpowerGpuFreqStruct.avgIdleTime = parseFloat(idleTimeValue.toFixed(2));
    tabXpowerGpuFreqStruct.maxIdleTime = idleTimeValue;
    tabXpowerGpuFreqStruct.minIdleTime = idleTimeValue;
    return tabXpowerGpuFreqStruct;
  }
  private getRunTimeMax(itemArray: XpowerGpuFreqStruct[]): number {
    let max = itemArray
      .map((item: { runTime: number }) => item.runTime)
      .reduce((a: number, b: number) => Math.max(a, b));
    return max;
  }

  private getRunTimeMin(itemArray: XpowerGpuFreqStruct[]): number {
    let min = itemArray
      .map((item: { runTime: number }) => item.runTime)
      .reduce((a: number, b: number) => Math.min(a, b));
    return min;
  }

  private getIdleTimeMax(itemArray: XpowerGpuFreqStruct[]): number {
    let max = itemArray
      .map((item: { idleTime: number }) => item.idleTime)
      .reduce((a: number, b: number) => Math.max(a, b));
    return max;
  }

  private getIdleTimeMin(itemArray: XpowerGpuFreqStruct[]): number {
    let min = itemArray
      .map((item: { idleTime: number }) => item.idleTime)
      .reduce((a: number, b: number) => Math.min(a, b));
    return min;
  }

  createTabXpowerGpuFreqStruct(list: Array<XpowerGpuFreqStruct>): TabXpowerGpuFreqStruct[] {
    let SelectGpuFreqArray: TabXpowerGpuFreqStruct[] = [];
    if (list.length > 0) {
      let gpuFreqMap = this.setGpuFreqMap(list);
      for (let itemArray of gpuFreqMap.values()) {
        let tabXpowerGpuFreqStruct = new TabXpowerGpuFreqStruct();
        tabXpowerGpuFreqStruct.frequency = itemArray[0].frequency;
        tabXpowerGpuFreqStruct.count = itemArray.length;
        if (itemArray.length > 1) {
          let maxRunTime = this.getRunTimeMax(itemArray);
          let minRunTime = this.getRunTimeMin(itemArray); // @ts-ignore
          let sumRunTime: unknown = itemArray.reduce((acc: unknown, obj: { runTime: unknown }) => acc + obj.runTime, 0); // @ts-ignore
          tabXpowerGpuFreqStruct.avgRunTime = parseFloat((sumRunTime / itemArray.length).toFixed(2));
          tabXpowerGpuFreqStruct.maxRunTime = maxRunTime;
          tabXpowerGpuFreqStruct.minRunTime = minRunTime;
          let maxIdleTime = this.getIdleTimeMax(itemArray);
          let minIdleTime = this.getIdleTimeMin(itemArray); // @ts-ignore
          let sumIdleTime: unknown = itemArray.reduce((acc: unknown, obj: { idleTime: unknown }) => acc + obj.idleTime, 0); // @ts-ignore
          tabXpowerGpuFreqStruct.avgIdleTime = parseFloat((sumIdleTime / itemArray.length).toFixed(2));
          tabXpowerGpuFreqStruct.maxIdleTime = maxIdleTime;
          tabXpowerGpuFreqStruct.minIdleTime = minIdleTime;
        } else if (itemArray.length === 1) {
          tabXpowerGpuFreqStruct = this.setTabXpowerGpuFreqStruct(
            itemArray[0].runTime,
            itemArray[0].idleTime,
            tabXpowerGpuFreqStruct
          );
        }
        this.sumCount += itemArray.length;
        SelectGpuFreqArray.push(tabXpowerGpuFreqStruct);
      }
    }
    return SelectGpuFreqArray;
  }

  private sortByColumn(detail: SortDetail): void {
    function compare(property: string, sort: number, type: string) {
      return function (
        xpowerCounterLeftData: TabXpowerGpuFreqStruct,
        xpowerCounterRightData: TabXpowerGpuFreqStruct
      ): number {
        if (!xpowerCounterLeftData.frequency || !xpowerCounterRightData.frequency) {
          return 0;
        }
        if (type === 'number') {
          return sort === 2 // @ts-ignore
            ? parseFloat(xpowerCounterRightData[property]) - parseFloat(xpowerCounterLeftData[property]) // @ts-ignore
            : parseFloat(xpowerCounterLeftData[property]) - parseFloat(xpowerCounterRightData[property]);
        } else {
          // @ts-ignore
          if (xpowerCounterRightData[property] > xpowerCounterLeftData[property]) {
            return sort === 2 ? 1 : -1;
          } else {
            // @ts-ignore
            if (xpowerCounterRightData[property] === xpowerCounterLeftData[property]) {
              return 0;
            } else {
              return sort === 2 ? -1 : 1;
            }
          }
        }
      };
    }
    this.XpowerGpuFreqSource.sort(compare(detail.key, detail.sort, 'number'));
    this.XpowerGpuFreqTbl!.recycleDataSource = this.XpowerGpuFreqSource;
  }
}

export class TabXpowerGpuFreqStruct {
  frequency: number = 0;
  count: number = 0;
  avgRunTime: number = 0;
  maxRunTime: number = 0;
  minRunTime: number = 0;
  avgIdleTime: number = 0;
  maxIdleTime: number = 0;
  minIdleTime: number = 0;
}
