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
import { log } from '../../../../../log/Log';
import { getProbablyTime } from '../../../../database/logic-worker/ProcedureLogicWorkerCommon';
import { resizeObserver } from '../SheetUtils';
import { querySysCallEventWithBoxSelect } from '../../../../database/sql/ProcessThread.sql';
import { Utils } from '../../base/Utils';
import { SysCallMap } from '../../base/SysCallUtils';

interface SysCallItem {
  nameId: number;
  name: string;
  pName: string;
  tName: string;
  tid: number;
  pid: number;
  totalCount: number;
  sumDur: number;
  durStr?: string;
}

interface SysCallTreeItem {
  name: string;
  id: number;
  parentId?: number;
  totalCount: number;
  sumDur: number;
  durStr: string;
  level: string;
  children: SysCallTreeItem[]
}

@element('tabpane-syscall')
export class TabPaneSysCall extends BaseElement {
  private sysCallTbl: LitTable | null | undefined;
  private range: HTMLLabelElement | null | undefined;
  private sysCallSource: Array<SysCallTreeItem> = [];
  private currentSelectionParam: SelectionParam | undefined;

  set data(sysCallParam: SelectionParam | unknown) {
    if (this.currentSelectionParam === sysCallParam) {
      return;
    } // @ts-ignore
    this.currentSelectionParam = sysCallParam;
    //@ts-ignore
    this.sysCallTbl?.shadowRoot?.querySelector('.table')?.style?.height = `${this.parentElement!.clientHeight - 45}px`; // @ts-ignore
    this.range!.textContent = `Selected range: ${((sysCallParam.rightNs - sysCallParam.leftNs) / 1000000.0).toFixed(
      5
    )} ms`;
    this.sysCallTbl!.loading = true;
    let ipidArr: number[] = [];
    Array.from(Utils.getInstance().sysCallEventTidsMap.values()).forEach(it => {
      //@ts-ignore
      if (sysCallParam?.processSysCallIds?.includes(it.pid)) {
        ipidArr.push(it.ipid);
      }
    })
    //@ts-ignore
    querySysCallEventWithBoxSelect(ipidArr, sysCallParam.threadSysCallIds, sysCallParam.leftNs, sysCallParam.rightNs).then(
      (retult) => {
        this.flatternToTree(retult as SysCallItem[]);
      }
    );
  }

  private flatternToTree(result: SysCallItem[]): void {
    this.sysCallTbl!.loading = false;
    if (result !== null && result.length > 0) {
      log(`getTabsysCalls result  size : ${result.length}`);
      let map: Map<number, SysCallTreeItem> = new Map<number, SysCallTreeItem>();
      result.forEach((item) => {
        item.name = SysCallMap.get(item.nameId) || '';
        item.durStr = getProbablyTime(item.sumDur);
        this.processSysCallItem(item, map);
      });
      let sysCalls: SysCallTreeItem[] = Array.from(map.values());
      this.sysCallSource = sysCalls;
      this.sysCallTbl!.recycleDataSource = this.sysCallSource;
    } else {
      this.sysCallSource = [];
      this.sysCallTbl!.recycleDataSource = [];
    }
  }

  private processSysCallItem(item: SysCallItem, map: Map<number, SysCallTreeItem>): void {
    const treeItem: SysCallTreeItem = {
      id: item.nameId,
      name: item.name,
      level: 'SysCall',
      parentId: item.tid,
      totalCount: item.totalCount,
      sumDur: item.sumDur,
      durStr: item.durStr!,
      children:[]
    };
    let ps = map.get(item.pid!);
    if (ps) {
      ps.sumDur += item.sumDur || 0;
      ps.durStr = getProbablyTime(ps.sumDur);
      ps.totalCount += item.totalCount || 0;
      let ts = ps.children?.find(it => it.id === item.tid);
      if (ts) {
        ts.sumDur += item.sumDur || 0;
        ts.durStr = getProbablyTime(ts.sumDur);
        ts.totalCount += item.totalCount || 0;
        ts.children.push(treeItem);
      } else {
        ps.children.push({
          id: item.tid,
          name: item.tName,
          parentId: item.pid,
          level: 'Thread',
          totalCount: item.totalCount,
          sumDur: item.sumDur,
          durStr: item.durStr!,
          children: [treeItem]
        })
      }
    } else {
      map.set(item.pid!, {
        id: item.pid,
        level: 'Process',
        name: `${item.pName} [${item.pid}]`,
        totalCount: item.totalCount,
        sumDur: item.sumDur,
        durStr: item.durStr!,
        children: [{
          id: item.tid,
          level: 'Thread',
          parentId: item.pid,
          name: `${item.tName} [${item.tid}]`,
          durStr: item.durStr!,
          totalCount: item.totalCount,
          sumDur: item.sumDur,
          children: [treeItem]
        }]
      });
    }
  }

  initElements(): void {
    this.sysCallTbl = this.shadowRoot?.querySelector<LitTable>('#tb-syscall');
    this.range = this.shadowRoot?.querySelector('#syscall-time-range');
    this.sysCallTbl!.addEventListener('column-click', (evt: unknown) => {
      // @ts-ignore
      this.sortByColumn(evt.detail);
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.sysCallTbl!);
  }

  initHtml(): string {
    return `
        <style>
        .syscall-table{
          flex-direction: row;
          margin-bottom: 5px;
        }
        :host{
            display: flex;
            flex-direction: column;
            padding: 10px 10px;
        }
        </style>
        <div class="syscall-table" style="display: flex;height: 20px;align-items: center;
        flex-direction: row;margin-bottom: 5px">
            <div style="flex: 1"></div>
            <label id="syscall-time-range"  style="width: auto;text-align: end;font-size: 10pt;">
            Selected range:0.0 ms</label>
        </div>
        <div style="overflow: auto">
            <lit-table id="tb-syscall" style="height: auto" tree >
                <lit-table-column width="600px" title="Process / Thread / SysCall"  data-index="name" 
                key="name"  align="flex-start" retract>
                </lit-table-column>
                <lit-table-column width="200px" title="Duration" data-index="durStr" 
                key="durStr"  align="flex-start" order >
                </lit-table-column>
                <lit-table-column width="200px" title="Count" data-index="totalCount" 
                key="totalCount"  align="flex-start" order tdJump>
                </lit-table-column>
            </lit-table>
        </div>
        `;
  }

  sortByColumn(sortDetail: unknown): void {
    let compare = (itemA: SysCallTreeItem, itemB: SysCallTreeItem): number => {
      // @ts-ignore
      if (sortDetail.key === 'durStr') {
        // @ts-ignore
        if (sortDetail.sort === 0) {
          return itemA.sumDur - itemB.sumDur; // @ts-ignore
        } else if (sortDetail.sort === 1) {
          return itemA.sumDur - itemB.sumDur;
        } else {
          return itemB.sumDur - itemA.sumDur;
        }
      } else {
         // @ts-ignore
        if (sortDetail.sort === 0) {
          return itemA.totalCount - itemB.totalCount; // @ts-ignore
        } else if (sortDetail.sort === 1) {
          return itemA.totalCount - itemB.totalCount;
        } else {
          return itemB.totalCount - itemA.totalCount;
        }
      }
    };
    this.sysCallSource.forEach((syscall) => {
      syscall.children?.sort(compare);
    });
    const deepSort = (arr: SysCallTreeItem[]) => {
      arr.sort(compare);
      arr.forEach(item => {
        if (item.children) {
          deepSort(item.children);
        }
      })
    };
    deepSort(this.sysCallSource);
    this.sysCallTbl!.recycleDataSource = this.sysCallSource;
  }
}
