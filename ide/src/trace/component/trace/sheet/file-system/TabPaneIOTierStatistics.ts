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
import { SpSystemTrace } from '../../../SpSystemTrace';
import { getTabPaneIOTierStatisticsData } from '../../../../database/sql/SqlLite.sql';

@element('tabpane-io-tier-statistics')
export class TabPaneIOTierStatistics extends BaseElement {
  private ioTierStatisticsTbl: LitTable | null | undefined;
  private ioTierStatisticsSelectionParam: SelectionParam | null | undefined;
  private ioTierStatisticsProgressEL: LitProgressBar | null | undefined;
  private loadingPage: unknown;
  private loadingList: number[] = [];
  private ioTierStatisticsSource: Array<unknown> = [];
  private ioTierStatisticsSortKey: string = '';
  private ioTierStatisticsSortType: number = 0;

  set data(ioTierStatisticsSelection: SelectionParam | unknown) {
    if (ioTierStatisticsSelection === this.ioTierStatisticsSelectionParam) {
      return;
    }
    this.ioTierStatisticsProgressEL!.loading = true;
    // @ts-ignore
    this.loadingPage.style.visibility = 'visible';
    // @ts-ignore
    this.ioTierStatisticsSelectionParam = ioTierStatisticsSelection;
    // @ts-ignore
    this.ioTierStatisticsTbl!.shadowRoot!.querySelector('.table').style.height = `${this.parentElement!.clientHeight - 20
      }px`;
    this.queryDataByDB(ioTierStatisticsSelection);
  }

  initElements(): void {
    this.ioTierStatisticsProgressEL = this.shadowRoot!.querySelector<LitProgressBar>('.progress');
    this.loadingPage = this.shadowRoot!.querySelector('.loading');
    this.ioTierStatisticsTbl = this.shadowRoot!.querySelector<LitTable>('#tb-io-tier-statistics');
    this.ioTierStatisticsTbl!.addEventListener('column-click', (evt) => {
      // @ts-ignore
      this.ioTierStatisticsSortKey = evt.detail.key;
      // @ts-ignore
      this.ioTierStatisticsSortType = evt.detail.sort;
      if (this.ioTierStatisticsSortType !== 0 && this.ioTierStatisticsSource.length > 0) {
        this.sortTable(this.ioTierStatisticsSource[0], this.ioTierStatisticsSortKey);
      }
      this.ioTierStatisticsTbl!.recycleDataSource = this.ioTierStatisticsSource;
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    new ResizeObserver((): void => {
      if (this.parentElement!.clientHeight !== 0) {
        // @ts-ignore
        this.ioTierStatisticsTbl!.shadowRoot!.querySelector('.table').style.height = `${this.parentElement!.clientHeight - 25
          }px`;
        this.ioTierStatisticsTbl!.reMeauseHeight();
        // @ts-ignore
        this.loadingPage.style.height = `${this.parentElement!.clientHeight - 24}px`;
      }
    }).observe(this.parentElement!);
  }

  getInitData(initIoTierItem: unknown, nameTitle: unknown = 'pname', subtitle: unknown = null): unknown {
    if (nameTitle === 'path') {
      // @ts-ignore
      initIoTierItem.path =
        // @ts-ignore
        initIoTierItem.path !== null ? SpSystemTrace.DATA_DICT.get(parseInt(initIoTierItem.path)) : '-';
    }
    return {
      // @ts-ignore
      ...initIoTierItem,
      // @ts-ignore
      title: initIoTierItem[nameTitle] + (subtitle ? `(${initIoTierItem[subtitle]})` : ''),
      // @ts-ignore
      allDuration: Utils.getProbablyTime(initIoTierItem.allDuration),
      // @ts-ignore
      minDuration: Utils.getProbablyTime(initIoTierItem.minDuration),
      // @ts-ignore
      maxDuration: Utils.getProbablyTime(initIoTierItem.maxDuration),
      // @ts-ignore
      avgDuration: Utils.getProbablyTime(initIoTierItem.avgDuration),
      // @ts-ignore
      node: { ...initIoTierItem, children: [] },
    };
  }

  queryDataByDB(ioTierParam: SelectionParam | unknown): void {
    this.loadingList.push(1);
    this.ioTierStatisticsProgressEL!.loading = true;
    // @ts-ignore
    this.loadingPage.style.visibility = 'visible';
    getTabPaneIOTierStatisticsData(
      // @ts-ignore
      ioTierParam.leftNs + ioTierParam.recordStartNs,
      // @ts-ignore
      ioTierParam.rightNs + ioTierParam.recordStartNs,
      // @ts-ignore
      ioTierParam.diskIOipids
    ).then((result): void => {
      this.loadingList.splice(0, 1);
      if (this.loadingList.length === 0) {
        this.ioTierStatisticsProgressEL!.loading = false;
        // @ts-ignore
        this.loadingPage.style.visibility = 'hidden';
      }
      this.sortioTierStatisticsStatus(result, 'tier', 'ipid');
    });
  }
  private theadClick(res: Array<unknown>): void {
    let labels = this.ioTierStatisticsTbl?.shadowRoot?.querySelector('.th > .td')!.querySelectorAll('label');
    if (labels) {
      for (let i = 0; i < labels.length; i++) {
        let label = labels[i].innerHTML;
        labels[i].addEventListener('click', (): void => {
          if (label.includes('Tier') && i === 0) {
            this.ioTierStatisticsTbl!.setStatus(res, false, 0, 1);
            this.ioTierStatisticsTbl!.recycleDs = this.ioTierStatisticsTbl!.meauseTreeRowElement(
              res,
              RedrawTreeForm.Retract
            );
          } else if (label.includes('Process') && i === 1) {
            this.ioTierStatisticsTbl!.setStatus(res, false, 0, 2);
            this.ioTierStatisticsTbl!.recycleDs = this.ioTierStatisticsTbl!.meauseTreeRowElement(
              res,
              RedrawTreeForm.Retract
            );
          } else if (label.includes('Path') && i === 2) {
            this.ioTierStatisticsTbl!.setStatus(res, true);
            this.ioTierStatisticsTbl!.recycleDs = this.ioTierStatisticsTbl!.meauseTreeRowElement(
              res,
              RedrawTreeForm.Expand
            );
          }
        });
      }
    }
  }

  sortioTierStatisticsStatus(result: Array<unknown>, firstLevel: string, secondLevel: string): void {
    let ioTierFatherMap = new Map<unknown, unknown>();
    let ioTierChildMap = new Map<unknown, unknown>();
    let ioTierAllNode: unknown = {
      title: 'All',
      count: 0,
      allDuration: 0,
      minDuration: 0,
      maxDuration: 0,
      avgDuration: '',
      children: [],
    };
    result.forEach((resultItem, idx): void => {
      this.updateIoTierChildMap(ioTierChildMap, resultItem, firstLevel, secondLevel);
      this.updateIoTierFatherMap(ioTierFatherMap, resultItem, firstLevel);
      if (idx === 0) {
        // @ts-ignore
        ioTierAllNode.minDuration = resultItem.minDuration;
      } else {
        // @ts-ignore
        ioTierAllNode.minDuration =
          // @ts-ignore
          ioTierAllNode.minDuration <= resultItem.minDuration ? ioTierAllNode.minDuration : resultItem.minDuration;
      } // @ts-ignore
      ioTierAllNode.count += resultItem.count;
      // @ts-ignore
      ioTierAllNode.allDuration += resultItem.allDuration;
      // @ts-ignore
      ioTierAllNode.maxDuration =
        // @ts-ignore
        ioTierAllNode.maxDuration >= resultItem.maxDuration ? ioTierAllNode.maxDuration : resultItem.maxDuration;
    });
    this.calculateAvgDuration(ioTierFatherMap, ioTierChildMap, ioTierAllNode);
    ioTierAllNode = this.getInitData(ioTierAllNode);
    // @ts-ignore
    ioTierAllNode.title = 'All';
    // @ts-ignore
    ioTierAllNode.path = { tier: null, pid: null, path: null, value: 'All' };
    this.ioTierStatisticsSource = result.length > 0 ? [ioTierAllNode] : [];
    if (this.ioTierStatisticsSortType !== 0 && result.length > 0) {
      this.sortTable(this.ioTierStatisticsSource[0], this.ioTierStatisticsSortKey);
    }
    this.theadClick(this.ioTierStatisticsSource);
    this.ioTierStatisticsTbl!.recycleDataSource = this.ioTierStatisticsSource;
  }

  private updateIoTierFatherMap(ioTierFatherMap: Map<unknown, unknown>, resultItem: unknown, firstLevel: string): void {
    // @ts-ignore
    if (ioTierFatherMap.has(resultItem[firstLevel])) {
      // @ts-ignore
      let currentFatherObject = ioTierFatherMap.get(resultItem[firstLevel]);
      // @ts-ignore
      currentFatherObject.count += resultItem.count;
      // @ts-ignore
      currentFatherObject.allDuration += resultItem.allDuration;
      // @ts-ignore
      currentFatherObject.minDuration =
        // @ts-ignore
        currentFatherObject.minDuration <= resultItem.minDuration
          ? // @ts-ignore
          currentFatherObject.minDuration
          : // @ts-ignore
          resultItem.minDuration;
      // @ts-ignore
      currentFatherObject.maxDuration =
        // @ts-ignore
        currentFatherObject.maxDuration >= resultItem.maxDuration
          ? // @ts-ignore
          currentFatherObject.maxDuration
          : // @ts-ignore
          resultItem.maxDuration;
      // @ts-ignore
      currentFatherObject.children.push(this.getInitData(resultItem));
    } else {
      // @ts-ignore
      ioTierFatherMap.set(resultItem[firstLevel], {
        // @ts-ignore
        ...resultItem,
        children: [this.getInitData(resultItem)],
      });
    }
  }

  private updateIoTierChildMap(
    ioTierChildMap: Map<unknown, unknown>,
    resultItem: unknown,
    firstLevel: string,
    secondLevel: string
  ): void {
    // @ts-ignore
    if (ioTierChildMap.has(`${resultItem[firstLevel]}_${resultItem[secondLevel]}`)) {
      // @ts-ignore
      let currentChildObject = ioTierChildMap.get(`${resultItem[firstLevel]}_${resultItem[secondLevel]}`);
      // @ts-ignore
      currentChildObject.count += resultItem.count;
      // @ts-ignore
      currentChildObject.allDuration += resultItem.allDuration; // @ts-ignore
      currentChildObject.minDuration = // @ts-ignore
        currentChildObject.minDuration <= resultItem.minDuration // @ts-ignore
          ? currentChildObject.minDuration // @ts-ignore
          : resultItem.minDuration; // @ts-ignore
      currentChildObject.maxDuration = // @ts-ignore
        currentChildObject.maxDuration >= resultItem.maxDuration // @ts-ignore
          ? currentChildObject.maxDuration // @ts-ignore
          : resultItem.maxDuration; // @ts-ignore
      currentChildObject.children.push(this.getInitData(resultItem, 'path', null));
    } else {
      // @ts-ignore
      ioTierChildMap.set(`${resultItem[firstLevel]}_${resultItem[secondLevel]}`, {
        // @ts-ignore
        ...resultItem,
        children: [this.getInitData(resultItem, 'path', null)],
      });
    }
  }

  private calculateAvgDuration(
    ioTierFatherMap: Map<unknown, unknown>,
    ioTierChildMap: Map<unknown, unknown>,
    ioTierAllNode: unknown
  ): void {
    for (let ks of ioTierFatherMap.keys()) {
      let sp = ioTierFatherMap.get(ks); // @ts-ignore
      sp!.children = []; // @ts-ignore
      sp.avgDuration = sp.allDuration / sp.count;
      let ioTierNode = this.getInitData(sp, 'tier', null); // @ts-ignore
      ioTierNode.path = {
        // @ts-ignore
        tier: ioTierNode.tier,
        pid: null,
        path: null, // @ts-ignore
        value: ioTierNode.title,
      };
      for (let kst of ioTierChildMap.keys()) {
        // @ts-ignore
        if (kst.startsWith(`${ks}_`)) {
          let spt = ioTierChildMap.get(kst); // @ts-ignore
          spt.avgDuration = spt.allDuration / spt.count;
          let data = this.getInitData(spt!, 'pname', 'pid'); // @ts-ignore
          data.path = {
            // @ts-ignore
            tier: ioTierNode.tier, // @ts-ignore
            pid: data.pid,
            path: null, // @ts-ignore
            value: `All-${ioTierNode.title}-${data.title}`,
          }; // @ts-ignore
          data.children.forEach((e: unknown): void => {
            // @ts-ignore
            e.path = {
              // @ts-ignore
              tier: ioTierNode.tier, // @ts-ignore
              pid: data.pid, // @ts-ignore
              path: e.path, // @ts-ignore
              value: `All-${ioTierNode.title}-${data.title}-${e.title}`,
            };
          }); // @ts-ignore
          sp!.children.push(data);
        }
      } // @ts-ignore
      ioTierAllNode.children.push(ioTierNode);
    }
    // @ts-ignore
    ioTierAllNode.avgDuration = ioTierAllNode.allDuration / ioTierAllNode.count;
  }

  sortTable(allNode: unknown, key: string): void {
    // @ts-ignore
    allNode.children.sort((ioTierStatNodeA: unknown, ioTierStatNodeB: unknown) => {
      return this.ioTierStatisticsSortType === 1 ?
        // @ts-ignore
        ioTierStatNodeA.node[key] - ioTierStatNodeB.node[key] :
        this.ioTierStatisticsSortType === 2 ?
          // @ts-ignore
          ioTierStatNodeB.node[key] - ioTierStatNodeA.node[key] : 0;

    }); // @ts-ignore
    allNode.children.forEach((item: unknown): void => {
      // @ts-ignore
      item.children.sort((ioTierStatItemA: unknown, ioTierStatItemB: unknown) => {
        return this.ioTierStatisticsSortType === 1 ?
          // @ts-ignore
          ioTierStatItemA.node[key] - ioTierStatItemB.node[key] :
          this.ioTierStatisticsSortType === 2 ?
            // @ts-ignore
            ioTierStatItemB.node[key] - ioTierStatItemA.node[key] : 0;
      }); // @ts-ignore
      item.children.forEach((ioTierStatItem: unknown): void => {
        // @ts-ignore
        ioTierStatItem.children.sort((ioTierStatItemA: unknown, ioTierStatItemB: unknown) => {
          return this.ioTierStatisticsSortType === 1 ?
            // @ts-ignore
            ioTierStatItemA.node[key] - ioTierStatItemB.node[key] :
            this.ioTierStatisticsSortType === 2 ?
              // @ts-ignore
              ioTierStatItemB.node[key] - ioTierStatItemA.node[key] : 0;
        });
      });
    });
  }

  initHtml(): string {
    return `
        <style>
        .io-tier-stat-progress{
            bottom: 5px;
            position: absolute;
            height: 1px;
            left: 0;
            right: 0;
        }
        :host{
            padding: 10px 10px 0 10px;
            display: flex;
            flex-direction: column;
        }
        .io-tier-stat-loading{
            bottom: 0;
            position: absolute;
            left: 0;
            right: 0;
            width:100%;
            background:transparent;
            z-index: 999999;
        }
        </style>
        <lit-table id="tb-io-tier-statistics" style="height: auto" tree>
            <lit-table-column class="io-tier-stat-column" width="20%" title="Tier/Process/Path" data-index="title" key="title" align="flex-start"retract>
            </lit-table-column>
            <lit-table-column class="io-tier-stat-column" width="1fr" title="Count" data-index="count" key="count" align="flex-start" order>
            </lit-table-column>
            <lit-table-column class="io-tier-stat-column" width="1fr" title="Total Latency" data-index="allDuration" key="allDuration" align="flex-start" order>
            </lit-table-column>
            <lit-table-column class="io-tier-stat-column" width="1fr" title="Min Total Latency" data-index="minDuration" key="minDuration" align="flex-start" order>
            </lit-table-column>
            <lit-table-column class="io-tier-stat-column" width="1fr" title="Avg Total Latency" data-index="avgDuration" key="avgDuration" align="flex-start" order>
            </lit-table-column>
            <lit-table-column class="io-tier-stat-column" width="1fr" title="Max Total Latency" data-index="maxDuration" key="maxDuration" align="flex-start" order>
            </lit-table-column>
        </lit-table>
        <lit-progress-bar class="progress io-tier-stat-progress"></lit-progress-bar>
        <div class="loading io-tier-stat-loading"></div>
        `;
  }
}
