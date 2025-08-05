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

import { BaseElement } from '../../../../../base-ui/BaseElement';
import { type LitTable, TableMode } from '../../../../../base-ui/table/lit-table';
import { SelectionParam } from '../../../../bean/BoxSelection';
import { type JsCpuProfilerChartFrame, JsCpuProfilerTabStruct } from '../../../../bean/JsStruct';
import { procedurePool } from '../../../../database/Procedure';
import { findSearchNode, ns2s } from '../../../../database/ui-worker/ProcedureWorkerCommon';
import { SpSystemTrace } from '../../../SpSystemTrace';
import { TabPaneFilter } from '../TabPaneFilter';
import '../TabPaneFilter';
import { TabPaneJsCpuHtml } from './TabPaneJsCpu.html';

export class TabPaneJsCpuCallTree extends BaseElement {
  protected TYPE_TOP_DOWN = 0;
  protected TYPE_BOTTOM_UP = 1;
  private treeTable: HTMLDivElement | undefined | null;
  private callTreeTable: LitTable | null | undefined;
  private stackTable: LitTable | null | undefined;
  private sortKey = '';
  private sortType = 0;
  private callTreeSource: Array<JsCpuProfilerTabStruct> = [];
  private currentType = 0;
  private profilerFilter: TabPaneFilter | undefined | null;
  private searchValue: string = '';
  private totalNs: number = 0;
  private currentSelection: SelectionParam | undefined;
  private getDataByWorker(args: Array<JsCpuProfilerChartFrame>, handler: Function): void {
    const key = this.currentType === this.TYPE_TOP_DOWN ? 'jsCpuProfiler-call-tree' : 'jsCpuProfiler-bottom-up';
    this.callTreeTable!.mode = TableMode.Retract;
    procedurePool.submitWithName('logic0', key, args, undefined, (results: Array<JsCpuProfilerTabStruct>) => {
      handler(results);
    });
  }

  set data(data: SelectionParam | Array<JsCpuProfilerChartFrame>) {
    if (data instanceof SelectionParam) {
      if (data === this.currentSelection) {
        return;
      }
      this.currentSelection = data;
      let chartData;
      chartData = data.jsCpuProfilerData;
      this.totalNs = chartData.reduce((acc, struct) => acc + struct.totalTime, 0);
      if (data.rightNs && data.leftNs) {
        this.totalNs = Math.min(data.rightNs - data.leftNs, this.totalNs);
      }

      this.init();
      this.getDataByWorker(chartData, (results: Array<JsCpuProfilerTabStruct>): void => {
        this.setCallTreeTableData(results);
      });
    }
  }

  protected setCurrentType(type: number): void {
    this.currentType = type;
  }

  private init(): void {
    this.sortKey = '';
    this.sortType = 0;
    this.profilerFilter!.filterValue = '';
    const thTable = this.treeTable!.querySelector('.th');
    const list = thTable!.querySelectorAll('div');
    if (this.treeTable!.hasAttribute('sort')) {
      this.treeTable!.removeAttribute('sort');
      list.forEach((item) => {
        item.querySelectorAll('svg').forEach((svg): void => {
          svg.style.display = 'none';
        });
      });
    }
  }

  private setCallTreeTableData(results: Array<JsCpuProfilerTabStruct>): void {
    this.stackTable!.recycleDataSource = [];
    const callTreeMap = new Map<number, JsCpuProfilerTabStruct>();
    const setTabData = (data: Array<JsCpuProfilerTabStruct>): void => {
      data.forEach((item) => {
        if (item.children && item.children.length > 0) {
          item.children.forEach((it) => {
            it.parentId = item.id;
          });
        }
        item.name = SpSystemTrace.DATA_DICT.get(item.nameId) || '';
        callTreeMap.set(item.id, item);
        item.scriptName === 'unknown'
          ? (item.symbolName = item.name)
          : (item.symbolName = `${item.name} ${item.scriptName}`);
        item.totalTimePercent = `${((item.totalTime / this.totalNs) * 100).toFixed(1)}%`;
        item.selfTimePercent = `${((item.selfTime / this.totalNs) * 100).toFixed(1)}%`;
        item.selfTimeStr = ns2s(item.selfTime);
        item.totalTimeStr = ns2s(item.totalTime);
        item.parent = callTreeMap.get(item.parentId!);
        setTabData(item.children);
      });
    };
    setTabData(results);
    this.callTreeSource = this.sortTree(results);
    this.callTreeTable!.recycleDataSource = this.callTreeSource;
  }

  private callTreeRowClickHandler(evt: Event): void {
    const heaviestStack: JsCpuProfilerTabStruct[] = [];
    const getHeaviestChildren = (children: Array<JsCpuProfilerTabStruct>): void => {
      if (children.length === 0) {
        return;
      }
      const heaviestChild = children.reduce(
        (max, struct): JsCpuProfilerTabStruct =>
          Math.max(max.totalTime, struct.totalTime) === max.totalTime ? max : struct
      );
      heaviestStack?.push(heaviestChild);
      getHeaviestChildren(heaviestChild.children);
    };
    const getParent = (list: JsCpuProfilerTabStruct): void => {
      if (list.parent) {
        heaviestStack.push(list.parent!);
        getParent(list.parent!);
      }
    };
    //@ts-ignore
    const data = evt.detail.data as JsCpuProfilerTabStruct;
    heaviestStack!.push(data);
    if (data.parent) {
      heaviestStack.push(data.parent!);
      getParent(data.parent!);
    }
    heaviestStack.reverse();
    getHeaviestChildren(data.children);
    this.stackTable!.recycleDataSource = heaviestStack;
    data.isSelected = true;
    this.stackTable?.clearAllSelection(data);
    this.stackTable?.setCurrentSelection(data);
    // @ts-ignore
    if (evt.detail.callBack) {
      // @ts-ignore
      evt.detail.callBack(true);
    }
  }

  public initElements(): void {
    this.callTreeTable = this.shadowRoot?.querySelector('#callTreeTable') as LitTable;
    this.stackTable = this.shadowRoot?.querySelector('#stackTable') as LitTable;
    this.treeTable = this.callTreeTable!.shadowRoot?.querySelector('.thead') as HTMLDivElement;
    this.profilerFilter = this.shadowRoot?.querySelector('#filter') as TabPaneFilter;
    this.callTreeTable!.addEventListener('row-click', (evt): void => {
      this.callTreeRowClickHandler(evt);
    });
    this.stackTable!.addEventListener('row-click', (evt) => {
      //@ts-ignore
      const data = evt.detail.data as JsCpuProfilerTabStruct;
      data.isSelected = true;
      this.callTreeTable!.clearAllSelection(data);
      this.callTreeTable!.scrollToData(data);
      // @ts-ignore
      if (evt.detail.callBack) {
        // @ts-ignore
        evt.detail.callBack(true);
      }
    });
    this.callTreeTable!.addEventListener('column-click', (evt) => {
      // @ts-ignore
      this.sortKey = evt.detail.key;
      // @ts-ignore
      this.sortType = evt.detail.sort;
      this.setCallTreeTableData(this.callTreeSource);
    });
    this.profilerFilter!.getFilterData((): void => {
      if (this.searchValue !== this.profilerFilter!.filterValue) {
        this.searchValue = this.profilerFilter!.filterValue;
        findSearchNode(this.callTreeSource, this.searchValue, false);
      }
      this.callTreeTable!.setStatus(this.callTreeSource, true);
      this.setCallTreeTableData(this.callTreeSource);
    });
  }

  public connectedCallback(): void {
    super.connectedCallback();
    new ResizeObserver(() => {
      // @ts-ignore
      this.callTreeTable?.shadowRoot.querySelector('.table').style.height = `${
        this.parentElement!.clientHeight - 32
      }px`;
      this.callTreeTable?.reMeauseHeight();
      // @ts-ignore
      this.stackTable?.shadowRoot.querySelector('.table').style.height = `${
        this.parentElement!.clientHeight - 32 - 22
      }px`;
      this.stackTable?.reMeauseHeight();
    }).observe(this.parentElement!);
  }

  private sortTree(arr: Array<JsCpuProfilerTabStruct>): Array<JsCpuProfilerTabStruct> {
    const defaultSort = (callTreeLeftData: JsCpuProfilerTabStruct, callTreeRightData: JsCpuProfilerTabStruct): number => {
      if (this.currentType === this.TYPE_TOP_DOWN) {
        return callTreeRightData.totalTime - callTreeLeftData.totalTime;
      } else {
        return callTreeRightData.selfTime - callTreeLeftData.selfTime;
      }
    };
    const CallTreeSortArr = arr.sort((callTreeLeftData, callTreeRightData) => {
      if (this.sortKey === 'selfTimeStr' || this.sortKey === 'selfTimePercent') {
        if (this.sortType === 0) {
          return defaultSort(callTreeLeftData, callTreeRightData);
        } else if (this.sortType === 1) {
          return callTreeLeftData.selfTime - callTreeRightData.selfTime;
        } else {
          return callTreeRightData.selfTime - callTreeLeftData.selfTime;
        }
      } else if (this.sortKey === 'symbolName') {
        if (this.sortType === 0) {
          return defaultSort(callTreeLeftData, callTreeRightData);
        } else if (this.sortType === 1) {
          return `${callTreeLeftData.symbolName}`.localeCompare(`${callTreeRightData.symbolName}`);
        } else {
          return `${callTreeRightData.symbolName}`.localeCompare(`${callTreeLeftData.symbolName}`);
        }
      } else {
        if (this.sortType === 0) {
          return defaultSort(callTreeLeftData, callTreeRightData);
        } else if (this.sortType === 1) {
          return callTreeLeftData.totalTime - callTreeRightData.totalTime;
        } else {
          return callTreeRightData.totalTime - callTreeLeftData.totalTime;
        }
      }
    });

    CallTreeSortArr.map((call) => {
      call.children = this.sortTree(call.children);
    });
    return CallTreeSortArr;
  }

  private clearTab(): void {
    this.stackTable!.recycleDataSource = [];
    this.callTreeTable!.recycleDataSource = [];
  }

  public initHtml(): string {
    return TabPaneJsCpuHtml;
  }
}
