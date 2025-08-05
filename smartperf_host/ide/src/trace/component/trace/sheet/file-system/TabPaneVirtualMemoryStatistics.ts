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
import { LitTable, RedrawTreeForm } from '../../../../../base-ui/table/lit-table';
import { SelectionParam } from '../../../../bean/BoxSelection';
import { Utils } from '../../base/Utils';
import { LitProgressBar } from '../../../../../base-ui/progress-bar/LitProgressBar';
import { TabPaneFilter } from '../TabPaneFilter';
import '../TabPaneFilter';
import { VM_TYPE_MAP } from '../../../../database/logic-worker/ProcedureLogicWorkerFileSystem';
import { getTabPaneVirtualMemoryStatisticsData } from '../../../../database/sql/Memory.sql';

@element('tabpane-virtual-memory-statistics')
export class TabPaneVirtualMemoryStatistics extends BaseElement {
  private vmStatisticsTbl: LitTable | null | undefined;
  private vmStatisticsSelectionParam: SelectionParam | null | undefined;
  private vmStatisticsProgressEL: LitProgressBar | null | undefined;
  private vmStatisticsFilter: TabPaneFilter | null | undefined;
  private loadingPage: unknown;
  private loadingList: number[] = [];
  private vmStatisticsSource: Array<unknown> = [];
  private vmStatisticsSortKey: string = '';
  private vmStatisticsSortType: number = 0;
  private vmStatisticsResultData: Array<unknown> = [];

  set data(vmStatisticsSelection: SelectionParam | unknown) {
    if (vmStatisticsSelection === this.vmStatisticsSelectionParam) {
      return;
    }
    this.vmStatisticsProgressEL!.loading = true;
    // @ts-ignore
    this.loadingPage.style.visibility = 'visible';
    // @ts-ignore
    this.vmStatisticsSelectionParam = vmStatisticsSelection;
    // @ts-ignore
    this.vmStatisticsTbl!.shadowRoot!.querySelector('.table').style.height = `${this.parentElement!.clientHeight - 20
      }px`;
    this.queryDataByDB(vmStatisticsSelection);
  }

  initElements(): void {
    this.vmStatisticsProgressEL = this.shadowRoot!.querySelector<LitProgressBar>('.progress');
    this.loadingPage = this.shadowRoot!.querySelector('.loading');
    this.vmStatisticsTbl = this.shadowRoot!.querySelector<LitTable>('#tb-vm-statistics');
    this.vmStatisticsTbl!.addEventListener('column-click', (evt) => {
      // @ts-ignore
      this.vmStatisticsSortKey = evt.detail.key;
      // @ts-ignore
      this.vmStatisticsSortType = evt.detail.sort;
      if (this.vmStatisticsSortType !== 0 && this.vmStatisticsSource.length > 0) {
        this.sortVmStatisticsTable(this.vmStatisticsSource[0], this.vmStatisticsSortKey);
      }
      this.vmStatisticsTbl!.recycleDataSource = this.vmStatisticsSource;
    });
    this.vmStatisticsFilter = this.shadowRoot!.querySelector<TabPaneFilter>('#filter');
    this.vmStatisticsFilter!.getStatisticsTypeData((type) => {
      if (type === 'operation') {
        this.sortStatus(this.vmStatisticsResultData, 'ipid', 'itid');
      } else {
        this.sortStatus(this.vmStatisticsResultData, 'type', 'ipid');
      }
      const labels = this.vmStatisticsTbl?.shadowRoot?.querySelector('.th > .td')!.querySelectorAll('label') as NodeListOf<HTMLLabelElement>;
      labels.forEach((label, index) => {
        if (type === 'operation') {
          switch (index) {
            case 0:
              label.textContent = 'Process';
              break;
            case 1:
              label.textContent = '/Thread';
              break;
            case 2:
              label.textContent = '/Operation';
              break;
          }
        } else {
          switch (index) {
            case 0:
              label.textContent = 'Operation';
              break;
            case 1:
              label.textContent = '/Process';
              break;
            case 2:
              label.textContent = '/Thread';
              break;
          }
        }
      });
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    new ResizeObserver((): void => {
      if (this.parentElement!.clientHeight !== 0) {
        // @ts-ignore
        this.vmStatisticsTbl!.shadowRoot!.querySelector('.table').style.height = `${this.parentElement!.clientHeight - 10 - 32
          }px`;
        this.vmStatisticsTbl!.reMeauseHeight();
        // @ts-ignore
        this.loadingPage.style.height = `${this.parentElement!.clientHeight - 24}px`;
      }
    }).observe(this.parentElement!);
  }

  getInitData(initVmMemoryStatItem: unknown, nameTitle: unknown = 'pname', subtitle: unknown = null): unknown {
    // @ts-ignore
    let title = nameTitle === 'type' ? VM_TYPE_MAP[initVmMemoryStatItem[nameTitle]] : initVmMemoryStatItem[nameTitle];
    return {
      // @ts-ignore
      ...initVmMemoryStatItem,
      // @ts-ignore
      title: title + (subtitle ? `(${initVmMemoryStatItem[subtitle]})` : ''),
      // @ts-ignore
      allDuration: Utils.getProbablyTime(initVmMemoryStatItem.allDuration),
      // @ts-ignore
      minDuration: Utils.getProbablyTime(initVmMemoryStatItem.minDuration),
      // @ts-ignore
      maxDuration: Utils.getProbablyTime(initVmMemoryStatItem.maxDuration),
      // @ts-ignore
      avgDuration: Utils.getProbablyTime(initVmMemoryStatItem.avgDuration),
      // @ts-ignore
      node: { ...initVmMemoryStatItem, children: [] },
    };
  }

  queryDataByDB(vmMemoryStatParam: SelectionParam | unknown): void {
    this.loadingList.push(1);
    this.vmStatisticsProgressEL!.loading = true;
    // @ts-ignore
    this.loadingPage.style.visibility = 'visible';
    getTabPaneVirtualMemoryStatisticsData(
      // @ts-ignore
      vmMemoryStatParam.leftNs + vmMemoryStatParam.recordStartNs,
      // @ts-ignore
      vmMemoryStatParam.rightNs + vmMemoryStatParam.recordStartNs
    ).then((result) => {
      this.loadingList.splice(0, 1);
      if (this.loadingList.length === 0) {
        this.vmStatisticsProgressEL!.loading = false;
        // @ts-ignore
        this.loadingPage.style.visibility = 'hidden';
      }
      this.vmStatisticsResultData = JSON.parse(JSON.stringify(result));
      this.sortStatus(result, 'type', 'ipid');
    });
  }

  sortStatus(result: Array<unknown>, firstLevel: string, secondLevel: string): void {
    let vmMemoryStatFatherMap = new Map<unknown, unknown>();
    let vmMemoryStatChildMap = new Map<unknown, unknown>();
    let vmMemoryStatAllNode: unknown = {
      title: 'All',
      count: 0,
      allDuration: 0,
      minDuration: 0,
      maxDuration: 0,
      avgDuration: '',
      children: [],
    };
    result.forEach((item, idx) => {
      this.processChildMap(vmMemoryStatChildMap, item, firstLevel, secondLevel);
      this.processFatherMap(vmMemoryStatFatherMap, item, firstLevel);
      if (idx === 0) {
        // @ts-ignore
        vmMemoryStatAllNode.minDuration = item.minDuration;
      } else {
        // @ts-ignore
        vmMemoryStatAllNode.minDuration =
          // @ts-ignore
          vmMemoryStatAllNode.minDuration <= item.minDuration ? vmMemoryStatAllNode.minDuration : item.minDuration;
      }
      // @ts-ignore
      vmMemoryStatAllNode.count += item.count;
      // @ts-ignore
      vmMemoryStatAllNode.allDuration += item.allDuration;
      // @ts-ignore
      vmMemoryStatAllNode.maxDuration =
        // @ts-ignore
        vmMemoryStatAllNode.maxDuration >= item.maxDuration ? vmMemoryStatAllNode.maxDuration : item.maxDuration;
    });
    this.handleFatherMap(vmMemoryStatFatherMap, firstLevel, vmMemoryStatChildMap, vmMemoryStatAllNode);

    // @ts-ignore
    vmMemoryStatAllNode.avgDuration = vmMemoryStatAllNode.allDuration / vmMemoryStatAllNode.count;
    vmMemoryStatAllNode = this.getInitData(vmMemoryStatAllNode);
    // @ts-ignore
    vmMemoryStatAllNode.title = 'All';
    // @ts-ignore
    vmMemoryStatAllNode.path = { type: null, tid: null, pid: null, value: 'All' };
    this.vmStatisticsSource = result.length > 0 ? [vmMemoryStatAllNode] : [];
    if (this.vmStatisticsSortType !== 0 && result.length > 0) {
      this.sortVmStatisticsTable(this.vmStatisticsSource[0], this.vmStatisticsSortKey);
    }
    this.theadClick(this.vmStatisticsSource);
    this.vmStatisticsTbl!.recycleDataSource = this.vmStatisticsSource;
  }
  private theadClick(res: Array<unknown>): void {
    let labels = this.vmStatisticsTbl?.shadowRoot?.querySelector('.th > .td')!.querySelectorAll('label');
    if (labels) {
      for (let i = 0; i < labels.length; i++) {
        let label = labels[i].innerHTML;
        labels[i].addEventListener('click', (): void => {
          if (i === 0) {
            this.vmStatisticsTbl!.setStatus(res, false, 0, 1);
            this.vmStatisticsTbl!.recycleDs = this.vmStatisticsTbl!.meauseTreeRowElement(res, RedrawTreeForm.Retract);
          } else if (i === 1) {
            this.vmStatisticsTbl!.setStatus(res, false, 0, 2);
            this.vmStatisticsTbl!.recycleDs = this.vmStatisticsTbl!.meauseTreeRowElement(res, RedrawTreeForm.Retract);
          } else if (i === 2) {
            this.vmStatisticsTbl!.setStatus(res, true);
            this.vmStatisticsTbl!.recycleDs = this.vmStatisticsTbl!.meauseTreeRowElement(res, RedrawTreeForm.Expand);
          }
        });
      }
    }
  }
  private handleFatherMap(
    vmMemoryStatFatherMap: Map<unknown, unknown>,
    firstLevel: string,
    vmMemoryStatChildMap: Map<unknown, unknown>,
    vmMemoryStatAllNode: unknown
  ): void {
    for (let ks of vmMemoryStatFatherMap.keys()) {
      let sp = vmMemoryStatFatherMap.get(ks);
      // @ts-ignore
      sp!.children = [];
      // @ts-ignore
      sp.avgDuration = sp.allDuration / sp.count;
      let vmMemoryStatNode = this.getInitData(
        sp,
        firstLevel === 'type' ? 'type' : 'pname',
        firstLevel === 'type' ? null : 'pid'
      );
      // @ts-ignore
      vmMemoryStatNode.path = { type: null, tid: null, pid: null, value: vmMemoryStatNode.title };
      // @ts-ignore
      vmMemoryStatNode.path[firstLevel === 'type' ? 'type' : 'pid'] =
        // @ts-ignore
        vmMemoryStatNode[firstLevel === 'type' ? 'type' : 'pid'];
      this.handleChildMap(vmMemoryStatChildMap, ks, firstLevel, vmMemoryStatNode, sp);
      // @ts-ignore
      vmMemoryStatAllNode.children.push(vmMemoryStatNode);
    }
  }

  private handleChildMap(
    vmMemoryStatChildMap: Map<unknown, unknown>,
    ks: unknown,
    firstLevel: string,
    vmMemoryStatNode: unknown,
    sp: unknown
  ): void {
    for (let kst of vmMemoryStatChildMap.keys()) {
      // @ts-ignore
      if (kst.startsWith(`${ks}_`)) {
        let spt = vmMemoryStatChildMap.get(kst);
        let data = this.getInitData(
          spt!,
          firstLevel === 'type' ? 'pname' : 'tname',
          firstLevel === 'type' ? 'pid' : 'tid'
        );
        this.handleData(data, vmMemoryStatNode, firstLevel);
        // @ts-ignore
        sp!.children.push(data);
      }
    }
  }

  private handleData(data: unknown, vmMemoryStatNode: unknown, firstLevel: string): void {
    // @ts-ignore
    data.path = {
      type: null,
      tid: null,
      pid: null,
      // @ts-ignore
      value: `All-${vmMemoryStatNode.title}-${data.title}`,
    };
    // @ts-ignore
    data.path[firstLevel === 'type' ? 'type' : 'pid'] = vmMemoryStatNode[firstLevel === 'type' ? 'type' : 'pid'];
    // @ts-ignore
    data.path[firstLevel === 'type' ? 'pid' : 'tid'] = data[firstLevel === 'type' ? 'pid' : 'tid'];
    // @ts-ignore
    data.children.forEach((e: unknown) => {
      // @ts-ignore
      e.path = {
        type: null,
        tid: null,
        pid: null,
        // @ts-ignore
        value: `All-${vmMemoryStatNode.title}-${data.title}-${e.title}`,
      };
      // @ts-ignore
      e.path[firstLevel === 'type' ? 'type' : 'pid'] = vmMemoryStatNode[firstLevel === 'type' ? 'type' : 'pid'];
      // @ts-ignore
      e.path[firstLevel === 'type' ? 'pid' : 'tid'] = data[firstLevel === 'type' ? 'pid' : 'tid'];
      // @ts-ignore
      e.path[firstLevel === 'type' ? 'tid' : 'type'] = e[firstLevel === 'type' ? 'tid' : 'type'];
    });
  }

  private processFatherMap(vmMemoryStatFatherMap: Map<unknown, unknown>, item: unknown, firstLevel: string): void {
    // @ts-ignore
    if (vmMemoryStatFatherMap.has(item[firstLevel])) {
      // @ts-ignore
      let vmMemoryStatFatherObj = vmMemoryStatFatherMap.get(item[firstLevel]);
      // @ts-ignore
      vmMemoryStatFatherObj.count += item.count;
      // @ts-ignore
      vmMemoryStatFatherObj.allDuration += item.allDuration;
      // @ts-ignore
      vmMemoryStatFatherObj.minDuration =
        // @ts-ignore
        vmMemoryStatFatherObj.minDuration <= item.minDuration ? vmMemoryStatFatherObj.minDuration : item.minDuration;
      // @ts-ignore
      vmMemoryStatFatherObj.maxDuration =
        // @ts-ignore
        vmMemoryStatFatherObj.maxDuration >= item.maxDuration ? vmMemoryStatFatherObj.maxDuration : item.maxDuration;
      // @ts-ignore
      vmMemoryStatFatherObj.children.push(this.getInitData(item));
    } else {
      // @ts-ignore
      vmMemoryStatFatherMap.set(item[firstLevel], {
        // @ts-ignore
        ...item,
        children: [this.getInitData(item)],
      });
    }
  }

  private processChildMap(
    vmMemoryStatChildMap: Map<unknown, unknown>,
    item: unknown,
    firstLevel: string,
    secondLevel: string
  ): void {
    // @ts-ignore
    if (vmMemoryStatChildMap.has(`${item[firstLevel]}_${item[secondLevel]}`)) {
      // @ts-ignore
      let vmMemoryStatChildObj = vmMemoryStatChildMap.get(`${item[firstLevel]}_${item[secondLevel]}`);
      // @ts-ignore
      vmMemoryStatChildObj.count += item.count;
      // @ts-ignore
      vmMemoryStatChildObj.allDuration += item.allDuration;
      // @ts-ignore
      vmMemoryStatChildObj.minDuration =
        // @ts-ignore
        vmMemoryStatChildObj.minDuration <= item.minDuration ? vmMemoryStatChildObj.minDuration : item.minDuration;
      // @ts-ignore
      vmMemoryStatChildObj.maxDuration =
        // @ts-ignore
        vmMemoryStatChildObj.maxDuration >= item.maxDuration ? vmMemoryStatChildObj.maxDuration : item.maxDuration;
      // @ts-ignore
      vmMemoryStatChildObj.children.push(
        this.getInitData(item, firstLevel === 'type' ? 'tname' : 'type', firstLevel === 'type' ? 'tid' : null)
      );
    } else {
      // @ts-ignore
      vmMemoryStatChildMap.set(`${item[firstLevel]}_${item[secondLevel]}`, {
        // @ts-ignore
        ...item,
        children: [
          this.getInitData(item, firstLevel === 'type' ? 'tname' : 'type', firstLevel === 'type' ? 'tid' : null),
        ],
      });
    }
  }

  sortVmStatisticsTable(allNode: unknown, key: string): void {
    // @ts-ignore
    allNode.children.sort((vmStatNodeA: unknown, vmStatNodeB: unknown) => {
      // @ts-ignore
      return this.vmStatisticsSortType === 1 ? vmStatNodeA.node[key] - vmStatNodeB.node[key] : vmStatNodeB.node[key] - vmStatNodeA.node[key];
    });
    // @ts-ignore
    allNode.children.forEach((item: unknown): void => {
      // @ts-ignore
      item.children.sort((vmStatNodeA: unknown, vmStatNodeB: unknown) => {
        let backData;
        if (this.vmStatisticsSortType === 1) {
          // @ts-ignore
          backData = vmStatNodeA.node[key] - vmStatNodeB.node[key];
        } else if (this.vmStatisticsSortType === 2) {
          // @ts-ignore
          backData = vmStatNodeB.node[key] - vmStatNodeA.node[key];
        }
        return backData;
      });
      // @ts-ignore
      item.children.forEach((vmStatItem: unknown) => {
        // @ts-ignore
        vmStatItem.children.sort((vmStatItemA: unknown, vmStatItemB: unknown) => {
          let backData;
          if (this.vmStatisticsSortType === 1) {
            // @ts-ignore
            backData = vmStatItemA.node[key] - vmStatItemB.node[key];
          } else if (this.vmStatisticsSortType === 2) {
            // @ts-ignore
            backData = vmStatItemB.node[key] - vmStatItemA.node[key];
          }
          return backData;
        });
      });
    });
  }

  initHtml(): string {
    return `
        <style>
        .vm-stat-progress{
            bottom: 5px;
            position: absolute;
            height: 1px;
            left: 0;
            right: 0;
        }
        :host{
            display: flex;
            flex-direction: column;
            padding: 10px 10px 0 10px;
        }
        .vm-stat-loading{
            bottom: 0;
            position: absolute;
            left: 0;
            right: 0;
            width:100%;
            background:transparent;
            z-index: 999999;
        }
        </style>
        <lit-table id="tb-vm-statistics" style="height: auto" tree>
            <lit-table-column class="vm-memory-stat-column" width="20%" title="Operation/Process/Thread" data-index="title" key="title" align="flex-start"retract>
            </lit-table-column>
            <lit-table-column class="vm-memory-stat-column" width="1fr" title="Count" data-index="count" key="count" align="flex-start" order>
            </lit-table-column>
            <lit-table-column class="vm-memory-stat-column" width="1fr" title="Duration" data-index="allDuration" key="allDuration" align="flex-start" order>
            </lit-table-column>
            <lit-table-column class="vm-memory-stat-column" width="1fr" title="Min Duration" data-index="minDuration" key="minDuration" align="flex-start" order>
            </lit-table-column>
            <lit-table-column class="vm-memory-stat-column" width="1fr" title="Avg Duration" data-index="avgDuration" key="avgDuration" align="flex-start" order>
            </lit-table-column>
            <lit-table-column class="vm-memory-stat-column" width="1fr" title="Max Duration" data-index="maxDuration" key="maxDuration" align="flex-start" order>
            </lit-table-column>
        </lit-table>
        <lit-progress-bar class="progress vm-stat-progress"></lit-progress-bar>
        <tab-pane-filter id="filter" sort></tab-pane-filter>
        <div class="loading vm-stat-loading"></div>
        `;
  }
}
