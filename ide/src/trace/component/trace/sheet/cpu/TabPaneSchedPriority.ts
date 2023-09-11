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

import { BaseElement, element } from '../../../../../base-ui/BaseElement.js';
import { LitTable } from '../../../../../base-ui/table/lit-table.js';
import { SelectionParam } from '../../../../bean/BoxSelection.js';
import { resizeObserver } from '../SheetUtils.js';
import { procedurePool } from '../../../../database/Procedure.js';
import { Utils } from '../../base/Utils.js';
import { queryThreadStateArgsByName } from '../../../../database/SqlLite.js';
import { Priority } from '../../../../bean/StateProcessThread.js';

@element('tabpane-sched-priority')
export class TabPaneSchedPriority extends BaseElement {
  private priorityTbl: LitTable | null | undefined;
  private range: HTMLLabelElement | null | undefined;
  private selectionParam: SelectionParam | null | undefined;

  set data(sptValue: SelectionParam) {
    if (sptValue == this.selectionParam) {
      return;
    }
    this.selectionParam = sptValue;
    // @ts-ignore
    this.sptTbl?.shadowRoot?.querySelector('.table').style.height = this.parentElement!.clientHeight - 45 + 'px';
    this.range!.textContent =
      'Selected range: ' + parseFloat(((sptValue.rightNs - sptValue.leftNs) / 1000000.0).toFixed(5)) + ' ms';
    this.queryDataByDB(sptValue);
  }

  public initElements(): void {
    this.priorityTbl = this.shadowRoot?.querySelector<LitTable>('#priority-tbl');
    this.range = this.shadowRoot?.querySelector('#priority-time-range');
  }

  public connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.priorityTbl!);
  }

  private async queryDataByDB(sptParam: SelectionParam | any): Promise<void> {
    this.priorityTbl!.loading = true;
    const resultData: Array<Priority> = [];
    const strValueMap: Map<number, string> = new Map<number, string>();
    await queryThreadStateArgsByName('next_info').then((value) => {
      for (const item of value) {
        strValueMap.set(item.argset, item.strValue);
      }
    });
    const filterList = ['0', '0x0'];
    function setPriority(item: any, strArg: string[]) {
      if (item.priority >= 0 && item.priority <= 88) {
        item.priorityType = 'RT';
      } else if (item.priority >= 89 && item.priority <= 99) {
        item.priorityType = 'VIP2.0';
      } else if (
        item.priority >= 100 &&
        strArg.length > 1 &&
        (!filterList.includes(strArg[1]) || !filterList.includes(strArg[2]))
      ) {
        item.priorityType = 'STATIC_VIP';
      } else {
        item.priorityType = 'CFS';
      }
    }
    const runnableMap = new Map<string, Priority>();
    procedurePool.submitWithName(
      'logic1',
      'spt-getCpuPriorityByTime',
      { leftNs: sptParam.leftNs, rightNs: sptParam.rightNs },
      undefined,
      async (res: Array<any>) => {
        for (const item of res) {
          if (['R', 'R+'].includes(item.state)) {
            runnableMap.set(`${item.itid}_${item.endTs}`, item);
          }
          if (item.cpu === null || !sptParam.cpus.includes(item.cpu)) {
            continue;
          }
          let strArg: string[] = [];
          const args = strValueMap.get(item.argSetID);
          if (args) {
            strArg = args!.split(',');
          }

          const slice = Utils.SCHED_SLICE_MAP.get(`${item.itId}-${item.startTs}`);
          if (slice) {
            item.priority = slice!.priority;
            item.state = 'Running';
            setPriority(item, strArg);
            const runnableItem = runnableMap.get(`${item.itid}_${item.startTs}`);
            resultData.push(item);
            if (runnableItem) {
              runnableItem.priority = slice.priority;
              runnableItem.state = 'Runnable';
              setPriority(runnableItem, strArg);
              resultData.push(runnableItem);
            }
          }
        }
        this.getDataByPriority(resultData);
      }
    );
  }

  private getDataByPriority(source: Array<Priority>): void {
    const priorityMap: Map<string, Priority> = new Map<string, Priority>();
    const stateMap: Map<string, Priority> = new Map<string, Priority>();
    source.map((d) => {
      if (priorityMap.has(d.priorityType + '')) {
        const priorityMapObj = priorityMap.get(d.priorityType + '');
        priorityMapObj!.count++;
        priorityMapObj!.wallDuration += d.dur;
        priorityMapObj!.avgDuration = (priorityMapObj!.wallDuration / priorityMapObj!.count).toFixed(2);
        if (d.dur > priorityMapObj!.maxDuration) {
          priorityMapObj!.maxDuration = d.dur;
        }
        if (d.dur < priorityMapObj!.minDuration) {
          priorityMapObj!.minDuration = d.dur;
        }
      } else {
        const stateMapObj = new Priority();
        stateMapObj.title = d.priorityType;
        stateMapObj.minDuration = d.dur;
        stateMapObj.maxDuration = d.dur;
        stateMapObj.count = 1;
        stateMapObj.avgDuration = d.dur + '';
        stateMapObj.wallDuration = d.dur;
        priorityMap.set(d.priorityType + '', stateMapObj);
      }
      if (stateMap.has(d.priorityType + '_' + d.state)) {
        const ptsPtMapObj = stateMap.get(d.priorityType + '_' + d.state);
        ptsPtMapObj!.count++;
        ptsPtMapObj!.wallDuration += d.dur;
        ptsPtMapObj!.avgDuration = (ptsPtMapObj!.wallDuration / ptsPtMapObj!.count).toFixed(2);
        if (d.dur > ptsPtMapObj!.maxDuration) {
          ptsPtMapObj!.maxDuration = d.dur;
        }
        if (d.dur < ptsPtMapObj!.minDuration) {
          ptsPtMapObj!.minDuration = d.dur;
        }
      } else {
        const ptsPtMapObj = new Priority();
        ptsPtMapObj.title = d.state;
        ptsPtMapObj.minDuration = d.dur;
        ptsPtMapObj.maxDuration = d.dur;
        ptsPtMapObj.count = 1;
        ptsPtMapObj.avgDuration = d.dur + '';
        ptsPtMapObj.wallDuration = d.dur;
        stateMap.set(d.priorityType + '_' + d.state, ptsPtMapObj);
      }
    });

    const priorityArr: Array<Priority> = [];
    for (const key of priorityMap.keys()) {
      const ptsValues = priorityMap.get(key);
      ptsValues!.children = [];
      for (const itemKey of stateMap.keys()) {
        if (itemKey.startsWith(key + '_')) {
          const sp = stateMap.get(itemKey);
          ptsValues!.children.push(sp!);
        }
      }
      priorityArr.push(ptsValues!);
    }
    this.priorityTbl!.loading = false;
    this.priorityTbl!.recycleDataSource = priorityArr;
  }

  public initHtml(): string {
    return `
        <style>
        :host{
            display: flex;
            flex-direction: column;
            padding: 10px 10px;
        }
        </style>
        <label id="priority-time-range" style="width: 100%;height: 20px;text-align: end;font-size: 10pt;margin-bottom: 5px">Selected range:0.0 ms</label>
        <lit-table id="priority-tbl" style="height: auto" tree>
            <lit-table-column width="27%" data-index="title" key="title" align="flex-start" title="Priority/State"retract>
            </lit-table-column>
            <lit-table-column width="1fr" data-index="count" key="count" align="flex-start" title="Count">
            </lit-table-column>
            <lit-table-column width="1fr" data-index="wallDuration" key="wallDuration" align="flex-start" title="Duration(ns)">
            </lit-table-column>
            <lit-table-column width="1fr" data-index="minDuration" key="minDuration" align="flex-start" title="Min Duration(ns)">
            </lit-table-column>
            <lit-table-column width="1fr" data-index="avgDuration" key="avgDuration" align="flex-start" title="Avg Duration(ns)">
            </lit-table-column>
            <lit-table-column width="1fr" data-index="maxDuration" key="maxDuration" align="flex-start" title="Max Duration(ns)">
            </lit-table-column>
        </lit-table>
        `;
  }
}
