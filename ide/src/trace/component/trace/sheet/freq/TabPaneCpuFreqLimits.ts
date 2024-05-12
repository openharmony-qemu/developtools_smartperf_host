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
import { Utils } from '../../base/Utils';
import { ColorUtils } from '../../base/ColorUtils';
import { CpuFreqLimitsStruct } from '../../../../database/ui-worker/cpu/ProcedureWorkerCpuFreqLimits';
import { resizeObserver } from '../SheetUtils';
import { getCpuLimitFreqBoxSelect } from '../../../../database/sql/Cpu.sql';

@element('tabpane-cpu-freq-limits')
export class TabPaneCpuFreqLimits extends BaseElement {
  private cpuFreqLimitsTbl: LitTable | null | undefined;
  private selectionParam: SelectionParam | null | undefined;
  private cpuFreqLimitSource: CpuFreqLimit[] = [];
  private cpuFreqLimitSortKey: string = 'cpu';
  private cpuFreqLimitSortType: number = 0;

  set data(cpuFreqLimitSelection: SelectionParam | unknown) {
    if (cpuFreqLimitSelection === this.selectionParam) {
      return;
    }
    // @ts-ignore
    this.selectionParam = cpuFreqLimitSelection;
    // @ts-ignore
    this.cpuFreqLimitsTbl!.shadowRoot!.querySelector('.table').style.height =
      this.parentElement!.clientHeight - 25 + 'px';
    let list: unknown[] = [];
    // @ts-ignore
    getCpuLimitFreqBoxSelect(cpuFreqLimitSelection.cpuFreqLimit, cpuFreqLimitSelection.rightNs).then((res) => {
      for (let it of res) {
        //@ts-ignore
        if (!it.dur || it.startNs + it.dur > cpuFreqLimitSelection.rightNs) {
          //@ts-ignore
          it.dur = (cpuFreqLimitSelection.rightNs || 0) - (it.startNs || 0);
        }
      }
      //@ts-ignore
      this.formatData(res, cpuFreqLimitSelection.leftNs, cpuFreqLimitSelection.rightNs);
    });
  }

  initElements(): void {
    this.cpuFreqLimitsTbl = this.shadowRoot!.querySelector<LitTable>('#tb-cpu-freq-limit');
    this.cpuFreqLimitsTbl!.addEventListener('column-click', (evt) => {
      // @ts-ignore
      this.cpuFreqLimitSortKey = evt.detail.key;
      // @ts-ignore
      this.cpuFreqLimitSortType = evt.detail.sort;
      // @ts-ignore
      this.sortCpuFreqLimitTable(evt.detail.key, evt.detail.sort);
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.cpuFreqLimitsTbl!, 25);
  }

  formatData(list: CpuFreqLimitsStruct[], start: number, end: number): void {
    let limitsMap = new Map<string, CpuFreqLimit>();
    let groupMapData = (time: number, id: string, item: CpuFreqLimitsStruct): void => {
      if (limitsMap.has(id)) {
        limitsMap.get(id)!.time += time;
      } else {
        let isMax = id.endsWith('max');
        let limit = new CpuFreqLimit();
        limit.cpu = `Cpu ${item.cpu}`;
        limit.time = time;
        limit.type = isMax ? 'Max Freqency' : 'Min Frequency';
        limit.value = isMax ? item.max! : item.min!;
        limitsMap.set(id, limit);
      }
    };
    list.forEach((item) => {
      if (item.startNs! > end) {
        return;
      }
      let max = Math.max(item.startNs || 0, start);
      let min = Math.min((item.startNs || 0) + item.dur, end);
      if (max < min) {
        let maxId = `${item.cpu}-${item.max}-max`;
        let minId = `${item.cpu}-${item.min}-min`;
        groupMapData(min - max, maxId, item);
        groupMapData(min - max, minId, item);
      }
    });
    this.cpuFreqLimitSource = Array.from(limitsMap.values()).map((item) => {
      item.timeStr = Utils.getProbablyTime(item.time);
      item.valueStr = `${ColorUtils.formatNumberComma(item.value!)} kHz`;
      return item;
    });
    this.sortCpuFreqLimitTable(this.cpuFreqLimitSortKey, this.cpuFreqLimitSortType);
  }

  sortCpuFreqLimitTable(key: string, type: number): void {
    if (type === 0) {
      this.cpuFreqLimitsTbl!.recycleDataSource = this.cpuFreqLimitSource;
    } else {
      let cpuFreqLimitsArr = Array.from(this.cpuFreqLimitSource);
      cpuFreqLimitsArr.sort((cpuFreqLimitA, cpuFreqLimitB): number => {
        if (key === 'timeStr') {
          return this.compareTime(cpuFreqLimitA, cpuFreqLimitB, type);
        } else if (key === 'valueStr') {
          return this.compareValue(cpuFreqLimitA, cpuFreqLimitB, type);
        } else if (key === 'cpu') {
          return this.compareCpu(cpuFreqLimitA, cpuFreqLimitB, type);
        } else if (key === 'type') {
          return this.compareType(cpuFreqLimitA, cpuFreqLimitB, type);
        } else {
          return 0;
        }
      });
      this.cpuFreqLimitsTbl!.recycleDataSource = cpuFreqLimitsArr;
    }
  }

  compareTime(cpuFreqLimitA: unknown, cpuFreqLimitB: unknown, type: number): number {
    if (type === 1) {
      // @ts-ignore
      return cpuFreqLimitA.time - cpuFreqLimitB.time;
    } else {
      // @ts-ignore
      return cpuFreqLimitB.time - cpuFreqLimitA.time;
    }
  }

  compareValue(cpuFreqLimitA: unknown, cpuFreqLimitB: unknown, type: number): number {
    if (type === 1) {
      // @ts-ignore
      return cpuFreqLimitA.value - cpuFreqLimitB.value;
    } else {
      // @ts-ignore
      return cpuFreqLimitB.value - cpuFreqLimitA.value;
    }
  }

  compareCpu(cpuFreqLimitA: unknown, cpuFreqLimitB: unknown, type: number): number {
    // @ts-ignore
    if (cpuFreqLimitA.cpu > cpuFreqLimitB.cpu) {
      return type === 2 ? -1 : 1; // @ts-ignore
    } else if (cpuFreqLimitA.cpu === cpuFreqLimitB.cpu) {
      return 0;
    } else {
      return type === 2 ? 1 : -1;
    }
  }

  compareType(cpuFreqLimitA: unknown, cpuFreqLimitB: unknown, type: number): number {
    // @ts-ignore
    if (cpuFreqLimitA.type > cpuFreqLimitB.type) {
      return type === 2 ? 1 : -1; // @ts-ignore
    } else if (cpuFreqLimitA.type === cpuFreqLimitB.type) {
      return 0;
    } else {
      return type === 2 ? -1 : 1;
    }
  }

  initHtml(): string {
    return `
        <style>
        .cpu-freq-limit-tbl {
            height: auto;
        }
        :host{
            display: flex;
            flex-direction: column;
            padding: 10px 10px;
        }
        </style>
        <lit-table id="tb-cpu-freq-limit" class="cpu-freq-limit-tbl">
            <lit-table-column class="cpu-freq-limit-column" width="20%" title="Cpu" data-index="cpu" key="cpu" align="flex-start" order>
            </lit-table-column>
            <lit-table-column class="cpu-freq-limit-column" width="1fr" title="Type" data-index="type" key="type" align="flex-start" order>
            </lit-table-column>
            <lit-table-column class="cpu-freq-limit-column" width="1fr" title="Time" data-index="timeStr" key="timeStr" align="flex-start" order>
            </lit-table-column>
            <lit-table-column class="cpu-freq-limit-column" width="1fr" title="Value" data-index="valueStr" key="valueStr" align="flex-start" order>
            </lit-table-column>
        </lit-table>
        `;
  }
}

class CpuFreqLimit {
  cpu: string = '';
  type: string = '';
  time: number = 0;
  value: number = 0;
  timeStr: string = '';
  valueStr: string = '';
}
