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
import '../TabPaneFilter';
import { FilterData, TabPaneFilter } from '../TabPaneFilter';
import { SelectionParam } from '../../../../bean/BoxSelection';
import { PerfCallChainMerageData, PerfLevelStruct } from '../../../../bean/PerfProfile';
import '../../../chart/FrameChart';
import { FrameChart } from '../../../chart/FrameChart';
import { ChartMode } from '../../../../bean/FrameChartStruct';
import '../../../../../base-ui/slicer/lit-slicer';
import '../../../../../base-ui/progress-bar/LitProgressBar';
import { LitProgressBar } from '../../../../../base-ui/progress-bar/LitProgressBar';
import { procedurePool } from '../../../../database/Procedure';
import { showButtonMenu } from '../SheetUtils';
import '../../../../../base-ui/headline/lit-headline';
import { LitHeadLine } from '../../../../../base-ui/headline/lit-headline';
import { TabPerfProfileHtml } from './TabPerfProfile.html';

const InvertOptionIndex: number = 0;
const hideSystemLibraryOptionIndex: number = 1;
const hideThreadOptionIndex: number = 3;
const hideThreadStateOptionIndex: number = 4;
const isOnlyKernelOptionIndex: number = 5;
const callTreeValueNoSample: number[] = [InvertOptionIndex, hideSystemLibraryOptionIndex, hideThreadOptionIndex,
  hideThreadStateOptionIndex, isOnlyKernelOptionIndex];

@element('tabpane-perf-profile')
export class TabpanePerfProfile extends BaseElement {
  private perfProfilerTbl: LitTable | null | undefined;
  private perfProfilerList: LitTable | null | undefined;
  private perfProfileProgressEL: LitProgressBar | null | undefined;
  private perfProfilerRightSource: Array<PerfCallChainMerageData> = [];
  private perfProfilerFilter: TabPaneFilter | null | undefined;
  private perfProfilerDataSource: unknown[] = [];
  private perfProfileSortKey: string = 'weight';
  private perfProfileSortType: number = 0;
  private perfSelectedData: unknown = undefined;
  private perfProfileFrameChart: FrameChart | null | undefined;
  private isChartShow: boolean = false;
  private systemRuleName: string = '/system/';
  private perfProfileNumRuleName: string = '/max/min/';
  private needShowMenu: boolean = true;
  private searchValue: string = '';
  private perfProfileLoadingPage: unknown;
  private currentSelection: SelectionParam | undefined;
  private currentRowClickData: unknown;
  private initWidth: number = 0;
  private _pieTitle: string = '';
  private _cWidth: number = 0;
  private _currentLevel: number = 0;
  private _rowClickData: unknown = undefined;
  private perfLevel: PerfLevelStruct | undefined | null;
  private headLine: LitHeadLine | null | undefined;

  set pieTitle(value: string) {
    this._pieTitle = value;
    if (this._pieTitle.length > 0) {
      this.headLine!.isShow = true;
      this.headLine!.titleTxt = this._pieTitle;
      this.headLine!.closeCallback = (): void => {
        this.restore();
      };
    }
  }

  set cWidth(value: number) {
    this._cWidth = value;
  }

  set currentLevel(value: number) {
    this._currentLevel = value;
  }

  set rowClickData(value: unknown) {
    this._rowClickData = value;
  }

  set data(perfProfilerSelection: SelectionParam | unknown) {
    if (perfProfilerSelection !== this.currentSelection && this._rowClickData === this.currentRowClickData) {
      this._rowClickData = undefined;
    }
    if (perfProfilerSelection === this.currentSelection && !this.currentSelection?.isRowClick) {
      return;
    }
    this.searchValue = ''; // @ts-ignore
    this.currentSelection = perfProfilerSelection;
    this.currentRowClickData = this._rowClickData;
    this.perfProfilerTbl!.style.visibility = 'visible';
    if (this.parentElement!.clientHeight > this.perfProfilerFilter!.clientHeight) {
      this.perfProfilerFilter!.style.display = 'flex';
    } else {
      this.perfProfilerFilter!.style.display = 'none';
    }
    procedurePool.submitWithName('logic0', 'perf-reset', [], undefined, () => { });
    this.perfProfilerFilter!.disabledTransfer(true);
    this.perfProfilerFilter!.initializeFilterTree(true, true, true);
    this.perfProfilerFilter!.filterValue = '';
    this.perfProfileProgressEL!.loading = true; // @ts-ignore
    this.perfProfileLoadingPage.style.visibility = 'visible';
    const newPerfProfilerSelection = Object.fromEntries(// @ts-ignore
      Object.entries(perfProfilerSelection).filter(([key, value]) =>
        !['clockMapData', 'xpowerMapData', 'hangMapData'].includes(key)
      )
    ) as Partial<SelectionParam>;
    // @ts-ignore
    this.getDataByWorkAndUpDateCanvas(newPerfProfilerSelection);
  }

  getDataByWorkAndUpDateCanvas(perfProfilerSelection: SelectionParam): void {
    if (this.clientWidth === 0) {
      this.initWidth = this._cWidth;
    } else {
      this.initWidth = this.clientWidth;
    }
    if (this._rowClickData && this.currentRowClickData !== undefined && this.currentSelection?.isRowClick) {
      // 点击表格的某一行跳转到火焰图
      this.getDataByPieLevel(perfProfilerSelection.perfEventTypeId);
    } else {
      this.headLine!.isShow = false;
      this.initGetData(perfProfilerSelection, this.initWidth, perfProfilerSelection.perfEventTypeId);
    }
  }

  initGetData(
    perfProfilerSelection: SelectionParam | unknown,
    initWidth: number,
    eventTypeId: undefined | number
  ): void {
    let perfProfileArgs: unknown[] = [];
    perfProfileArgs.push(
      {
        funcName: 'setSearchValue',
        funcArgs: [''],
      },
      {
        funcName: 'getCurrentDataFromDbProfile',
        funcArgs: [perfProfilerSelection],
      }
    );

    this.getDataByWorker(perfProfileArgs, (results: unknown[]) => {
      this.setPerfProfilerLeftTableData(results);
      this.perfProfilerList!.recycleDataSource = [];
      if (eventTypeId === undefined) {
        this.perfProfileFrameChart!.mode = ChartMode.Count;
      } else {
        this.perfProfileFrameChart!.mode = ChartMode.EventCount;
      }
      this.perfProfileFrameChart?.updateCanvas(true, initWidth); // @ts-ignore
      this.perfProfileFrameChart!.totalRootData = this.perfProfilerDataSource;// @ts-ignore  
      this.perfProfileFrameChart!.data = this.perfProfilerDataSource;
      this.switchFlameChart();
      this.perfProfilerFilter!.icon = 'block';
    });
  }

  private restore(): void {
    this.searchValue = '';
    this.perfProfilerFilter!.filterValue = '';
    this.headLine!.isShow = false;
    this._rowClickData = undefined;
    this.initGetData(this.currentSelection, this.initWidth, this.currentSelection?.perfEventTypeId);
  }

  /**
   * 根据饼图跳转过来的层级绘制对应的火焰图和表格
   */
  private getDataByPieLevel(eventTypeId: number | undefined): void {
    this.perfLevel = new PerfLevelStruct();
    this.perfLevel = {
      // @ts-ignore
      processId: this._rowClickData.pid, // @ts-ignore
      threadId: this._rowClickData.tid, // @ts-ignore
      libId: this._rowClickData.libId,
    };
    let args = [];
    args.push({
      funcName: 'getCurrentDataFromDbProfile',
      funcArgs: [this.currentSelection, this.perfLevel],
    });
    // @ts-ignore
    if (this._rowClickData && this._rowClickData.libId !== undefined && this._currentLevel === 2) {
      // @ts-ignore
      this.perfLevel!.libName = this._rowClickData.tableName;
      args.push({
        funcName: 'showLibLevelData',
        funcArgs: [this.perfLevel!.libId, this.perfLevel!.libName],
      }); // @ts-ignore
    } else if (this._rowClickData && this._rowClickData.symbolId !== undefined && this._currentLevel === 3) {
      // @ts-ignore
      this.perfLevel!.symbolId = this._rowClickData.symbolId; // @ts-ignore
      this.perfLevel!.symbolName = this._rowClickData.tableName;
      args.push({
        funcName: 'showFunLevelData',
        funcArgs: [this.perfLevel!.symbolId, this.perfLevel!.symbolName],
      });
    }

    this.getDataByWorker(args, (results: unknown[]) => {
      this.perfProfileProgressEL!.loading = false; // @ts-ignore
      this.perfProfileLoadingPage.style.visibility = 'hidden';
      this.setPerfProfilerLeftTableData(results);
      this.perfProfilerList!.recycleDataSource = [];
      if (eventTypeId === undefined) {
        this.perfProfileFrameChart!.mode = ChartMode.Count;
      } else {
        this.perfProfileFrameChart!.mode = ChartMode.EventCount;
      }
      this.perfProfileFrameChart?.updateCanvas(true, this.initWidth); // @ts-ignore
      this.perfProfileFrameChart!.data = this.perfProfilerDataSource;
      this.switchFlameChart();
      this.perfProfilerFilter!.icon = 'block';
    });
  }

  getParentTree(
    perfCallSrc: Array<PerfCallChainMerageData>,
    target: PerfCallChainMerageData,
    parentsData: Array<PerfCallChainMerageData>
  ): boolean {
    for (let perfCall of perfCallSrc) {
      if (perfCall.id === target.id) {
        parentsData.push(perfCall);
        return true;
      } else {
        if (this.getParentTree(perfCall.children as Array<PerfCallChainMerageData>, target, parentsData)) {
          parentsData.push(perfCall);
          return true;
        }
      }
    }
    return false;
  }

  getChildTree(
    perfCallSrc: Array<PerfCallChainMerageData>,
    id: string,
    children: Array<PerfCallChainMerageData>
  ): boolean {
    for (let perfCall of perfCallSrc) {
      if (perfCall.id === id && perfCall.children.length === 0) {
        children.push(perfCall);
        return true;
      } else {
        if (this.getChildTree(perfCall.children as Array<PerfCallChainMerageData>, id, children)) {
          children.push(perfCall);
          return true;
        }
      }
    }
    return false;
  }

  setRightTableData(chainMerageData: PerfCallChainMerageData): void {
    let parentsMerageData: Array<PerfCallChainMerageData> = [];
    let childrenMerageData: Array<PerfCallChainMerageData> = []; // @ts-ignore
    this.getParentTree(this.perfProfilerDataSource, chainMerageData, parentsMerageData);
    let maxId = chainMerageData.id;
    let maxDur = 0;

    function findMaxStack(call: PerfCallChainMerageData): void {
      if (call.children.length === 0) {
        if (call.dur > maxDur) {
          maxDur = call.dur;
          maxId = call.id;
        }
      } else {
        call.children.map((callChild): void => {
          findMaxStack(<PerfCallChainMerageData>callChild);
        });
      }
    }

    findMaxStack(chainMerageData);
    this.getChildTree(chainMerageData.children as Array<PerfCallChainMerageData>, maxId, childrenMerageData);
    let perfProfileParentsList = parentsMerageData.reverse().concat(childrenMerageData.reverse());
    for (let data of perfProfileParentsList) {
      data.type = data.lib.endsWith('.so.1') || data.lib.endsWith('.dll') || data.lib.endsWith('.so') ? 0 : 1;
    }
    let len = perfProfileParentsList.length;
    this.perfProfilerRightSource = perfProfileParentsList;
    let rightSource: Array<unknown> = [];
    if (len !== 0) {
      rightSource = this.perfProfilerRightSource.filter((item): boolean => {
        return item.canCharge;
      });
    }
    this.perfProfilerList!.dataSource = rightSource;
  }

  initElements(): void {
    this.headLine = this.shadowRoot?.querySelector<LitHeadLine>('.titleBox');
    this.perfProfilerTbl = this.shadowRoot?.querySelector<LitTable>('#tb-perf-profile');
    this.perfProfileProgressEL = this.shadowRoot?.querySelector('.perf-profile-progress') as LitProgressBar;
    this.perfProfileFrameChart = this.shadowRoot?.querySelector<FrameChart>('#framechart');
    this.perfProfileLoadingPage = this.shadowRoot?.querySelector('.perf-profile-loading');
    this.addEventListener('contextmenu', (event) => {
      event.preventDefault(); // 阻止默认的上下文菜单弹框
    });
    this.perfProfileFrameChart!.addChartClickListener((needShowMenu: boolean): void => {
      this.parentElement!.scrollTo(0, 0);
      showButtonMenu(this.perfProfilerFilter, needShowMenu);
      this.needShowMenu = needShowMenu;
    });
    this.perfProfilerTbl!.rememberScrollTop = true;
    this.perfProfilerFilter = this.shadowRoot?.querySelector<TabPaneFilter>('#filter');
    this.perfProfilerList = this.shadowRoot?.querySelector<LitTable>('#tb-perf-list');
    this.initPerfProfilerDataAndListener();
  }

  private initPerfProfilerDataAndListener(): void {
    this.perfProfilerTbl!.addEventListener('row-click', (evt: unknown): void => {
      // @ts-ignore
      let data = evt.detail.data as PerfCallChainMerageData;
      document.dispatchEvent(
        new CustomEvent('number_calibration', {
          detail: { time: data.tsArray },
        })
      );
      this.setRightTableData(data);
      data.isSelected = true;
      this.perfSelectedData = data;
      this.perfProfilerList?.clearAllSelection(data);
      this.perfProfilerList?.setCurrentSelection(data);
      // @ts-ignore
      if ((evt.detail as unknown).callBack) {
        // @ts-ignore
        (evt.detail as unknown).callBack(true);
      }
    });
    this.perfProfilerList!.addEventListener('row-click', (evt: unknown): void => {
      // @ts-ignore
      let data = evt.detail.data as PerfCallChainMerageData;
      this.perfProfilerTbl?.clearAllSelection(data); // @ts-ignore
      (data as unknown).isSelected = true;
      this.perfProfilerTbl!.scrollToData(data);
      // @ts-ignore
      if ((evt.detail as unknown).callBack) {
        // @ts-ignore
        (evt.detail as unknown).callBack(true);
      }
    });
    this.perfProfilerFilter!.getDataLibrary(this.filterFunc.bind(this));
    this.perfProfilerFilter!.getDataMining(this.filterFunc.bind(this));
    this.perfProfilerFilter!.getCallTreeData(this.perfProfilerFilterGetCallTree.bind(this));
    this.perfProfilerFilter!.getCallTreeConstraintsData(this.perfProfilerFilterGetCallTreeConstraints.bind(this));
    this.perfProfilerFilter!.getFilterData(this.perfProfilerFilterGetFilter.bind(this));
    this.perfProfilerTbl!.addEventListener('column-click', (evt): void => {
      // @ts-ignore
      this.perfProfileSortKey = evt.detail.key;
      // @ts-ignore
      this.perfProfileSortType = evt.detail.sort;
      // @ts-ignore
      this.setPerfProfilerLeftTableData(this.perfProfilerDataSource); // @ts-ignore
      this.perfProfileFrameChart!.data = this.perfProfilerDataSource;
    });
  }

  private filterFuncByCheckType(data: unknown, perfProfileFuncArgs: unknown[]): void {
    // @ts-ignore
    if (data.item.checked) {
      perfProfileFuncArgs.push({
        funcName: 'splitTree', // @ts-ignore
        funcArgs: [data.item.name, data.item.select === '0', data.item.type === 'symbol'],
      });
    } else {
      perfProfileFuncArgs.push({
        funcName: 'resotreAllNode', // @ts-ignore
        funcArgs: [[data.item.name]],
      });
      perfProfileFuncArgs.push({
        funcName: 'resetAllNode',
        funcArgs: [],
      });
      perfProfileFuncArgs.push({
        funcName: 'clearSplitMapData', // @ts-ignore
        funcArgs: [data.item.name],
      });
    }
  }

  private filterFuncBySelect(data: unknown, perfProfileFuncArgs: unknown[]): void {
    perfProfileFuncArgs.push({
      funcName: 'resotreAllNode', // @ts-ignore
      funcArgs: [[data.item.name]],
    });
    perfProfileFuncArgs.push({
      funcName: 'clearSplitMapData', // @ts-ignore
      funcArgs: [data.item.name],
    });
    perfProfileFuncArgs.push({
      funcName: 'splitTree', // @ts-ignore
      funcArgs: [data.item.name, data.item.select === '0', data.item.type === 'symbol'],
    });
  }

  private filterFuncByButton(data: unknown, perfProfileFuncArgs: unknown[]): void {
    // @ts-ignore
    if (data.item === 'symbol') {
      // @ts-ignore
      if (this.perfSelectedData && !this.perfSelectedData.canCharge) {
        return;
      }
      if (this.perfSelectedData !== undefined) {
        // @ts-ignore
        this.perfProfilerFilter!.addDataMining({ name: this.perfSelectedData.symbolName }, data.item);
        perfProfileFuncArgs.push({
          funcName: 'splitTree', // @ts-ignore
          funcArgs: [this.perfSelectedData.symbolName, false, true],
        });
      } else {
        return;
      } // @ts-ignore
    } else if (data.item === 'library') {
      // @ts-ignore
      if (this.perfSelectedData && !this.perfSelectedData.canCharge) {
        return;
      } // @ts-ignore
      if (this.perfSelectedData !== undefined && this.perfSelectedData.libName !== '') {
        // @ts-ignore
        this.perfProfilerFilter!.addDataMining({ name: this.perfSelectedData.libName }, data.item);
        perfProfileFuncArgs.push({
          funcName: 'splitTree', // @ts-ignore
          funcArgs: [this.perfSelectedData.libName, false, false],
        });
      } else {
        return;
      } // @ts-ignore
    } else if (data.item === 'restore') {
      // @ts-ignore
      if (data.remove !== undefined && data.remove.length > 0) {
        // @ts-ignore
        let list = data.remove.map((item: unknown) => {
          // @ts-ignore
          return item.name;
        });
        perfProfileFuncArgs.push({
          funcName: 'resotreAllNode',
          funcArgs: [list],
        });
        perfProfileFuncArgs.push({
          funcName: 'resetAllNode',
          funcArgs: [],
        });
        list.forEach((symbolName: string): void => {
          perfProfileFuncArgs.push({
            funcName: 'clearSplitMapData',
            funcArgs: [symbolName],
          });
        });
      }
    }
  }

  private filterFunc(data: unknown): void {
    let perfProfileFuncArgs: unknown[] = []; // @ts-ignore
    if (data.type === 'check') {
      this.filterFuncByCheckType(data, perfProfileFuncArgs); // @ts-ignore
    } else if (data.type === 'select') {
      this.filterFuncBySelect(data, perfProfileFuncArgs); // @ts-ignore
    } else if (data.type === 'button') {
      this.filterFuncByButton(data, perfProfileFuncArgs);
    }
    this.getDataByWorker(perfProfileFuncArgs, (result: unknown[]): void => {
      this.setPerfProfilerLeftTableData(result); // @ts-ignore
      this.perfProfileFrameChart!.data = this.perfProfilerDataSource;
      if (this.isChartShow) {
        this.perfProfileFrameChart?.calculateChartData();
      }
      this.perfProfilerTbl!.move1px();
      if (this.perfSelectedData) {
        // @ts-ignore
        this.perfSelectedData.isSelected = false;
        this.perfProfilerTbl?.clearAllSelection(this.perfSelectedData);
        this.perfProfilerList!.recycleDataSource = [];
        this.perfSelectedData = undefined;
      }
    });
  }

  private perfProfilerFilterGetFilter(data: FilterData): void {
    if ((this.isChartShow && data.icon === 'tree') || (!this.isChartShow && data.icon === 'block')) {
      this.switchFlameChart(data);
    } else if (this.searchValue !== this.perfProfilerFilter!.filterValue) {
      this.searchValue = this.perfProfilerFilter!.filterValue;
      let perfArgs = [
        {
          funcName: 'setSearchValue',
          funcArgs: [this.searchValue],
        },
        {
          funcName: 'resetAllNode',
          funcArgs: [],
        },
      ];
      this.getDataByWorker(perfArgs, (result: unknown[]): void => {
        this.perfProfilerTbl!.isSearch = true;
        this.perfProfilerTbl!.setStatus(result, true);
        this.setPerfProfilerLeftTableData(result); // @ts-ignore
        this.perfProfileFrameChart!.data = this.perfProfilerDataSource;
        this.switchFlameChart(data);
      });
    } else {
      this.perfProfilerTbl!.setStatus(this.perfProfilerDataSource, true);
      this.setPerfProfilerLeftTableData(this.perfProfilerDataSource);
      this.switchFlameChart(data);
    }
  }

  private perfProfilerFilterGetCallTreeConstraints(data: unknown): void {
    let perfProfilerConstraintsArgs: unknown[] = [
      {
        funcName: 'resotreAllNode',
        funcArgs: [[this.perfProfileNumRuleName]],
      },
      {
        funcName: 'clearSplitMapData',
        funcArgs: [this.perfProfileNumRuleName],
      },
    ]; // @ts-ignore
    if (data.checked) {
      perfProfilerConstraintsArgs.push({
        funcName: 'hideNumMaxAndMin', // @ts-ignore
        funcArgs: [parseInt(data.min), data.max],
      });
    }
    perfProfilerConstraintsArgs.push({
      funcName: 'resetAllNode',
      funcArgs: [],
    });
    this.getDataByWorker(perfProfilerConstraintsArgs, (result: unknown[]): void => {
      this.setPerfProfilerLeftTableData(result); // @ts-ignore
      this.perfProfileFrameChart!.data = this.perfProfilerDataSource;
      if (this.isChartShow) {
        this.perfProfileFrameChart?.calculateChartData();
      }
    });
  }

  private perfProfilerFilterGetCallTree(data: unknown): void {
    // @ts-ignore
    if (callTreeValueNoSample.includes(data.value)) {
      this.refreshAllNode({
        ...this.perfProfilerFilter!.getFilterTreeData(), // @ts-ignore
        callTree: data.checks,
      });
    } else {
      let perfProfileArgs: unknown[] = []; // @ts-ignore
      if (data.checks[1]) {
        perfProfileArgs.push({
          funcName: 'hideSystemLibrary',
          funcArgs: [],
        });
      } else {
        perfProfileArgs.push({
          funcName: 'resotreAllNode',
          funcArgs: [[this.systemRuleName]],
        });
        perfProfileArgs.push({
          funcName: 'clearSplitMapData',
          funcArgs: [this.systemRuleName],
        });
      }
      perfProfileArgs.push({
        funcName: 'resetAllNode',
        funcArgs: [],
      });
      this.getDataByWorker(perfProfileArgs, (result: unknown[]): void => {
        this.setPerfProfilerLeftTableData(result); // @ts-ignore
        this.perfProfileFrameChart!.data = this.perfProfilerDataSource;
        if (this.isChartShow) {
          this.perfProfileFrameChart?.calculateChartData();
        }
      });
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.parentElement!.onscroll = (): void => {
      this.perfProfileFrameChart!.tabPaneScrollTop = this.parentElement!.scrollTop;
    };
    let filterHeight = 0;
    new ResizeObserver((entries): void => {
      let perfProfileTabFilter = this.shadowRoot!.querySelector('#filter') as HTMLElement;
      if (perfProfileTabFilter.clientHeight > 0) {
        filterHeight = perfProfileTabFilter.clientHeight;
      }
      if (this.parentElement!.clientHeight > filterHeight) {
        perfProfileTabFilter.style.display = 'flex';
      } else {
        perfProfileTabFilter.style.display = 'none';
      }
      if (this.perfProfilerTbl!.style.visibility === 'hidden') {
        perfProfileTabFilter.style.display = 'none';
      }
      if (this.parentElement?.clientHeight !== 0) {
        if (this.isChartShow) {
          this.perfProfileFrameChart?.updateCanvas(false, entries[0].contentRect.width);
          this.perfProfileFrameChart?.calculateChartData();
        }
        let headLineHeight = 0;
        if (this.headLine?.isShow) {
          headLineHeight = this.headLine!.clientHeight;
        }
        // @ts-ignore
        this.perfProfilerTbl?.shadowRoot.querySelector('.table').style.height =
          // @ts-ignore
          `${this.parentElement.clientHeight - 10 - 35 - headLineHeight}px`;
        this.perfProfilerTbl?.reMeauseHeight();
        // @ts-ignore
        this.perfProfilerList?.shadowRoot.querySelector('.table').style.height =
          // @ts-ignore
          `${this.parentElement.clientHeight - 45 - 21 - headLineHeight}px`;
        this.perfProfilerList?.reMeauseHeight(); // @ts-ignore
        this.perfProfileLoadingPage.style.height = `${this.parentElement!.clientHeight - 24}px`;
      }
    }).observe(this.parentElement!);
  }

  switchFlameChart(data?: unknown): void {
    let perfProfilerPageTab = this.shadowRoot?.querySelector('#show_table');
    let perfProfilerPageChart = this.shadowRoot?.querySelector('#show_chart'); // @ts-ignore
    if (!data || data.icon === 'block') {
      perfProfilerPageChart?.setAttribute('class', 'show');
      perfProfilerPageTab?.setAttribute('class', '');
      this.isChartShow = true;
      this.perfProfilerFilter!.disabledMining = true;
      showButtonMenu(this.perfProfilerFilter, this.needShowMenu);
      this.perfProfileFrameChart?.calculateChartData(); // @ts-ignore
    } else if (data.icon === 'tree') {
      perfProfilerPageChart?.setAttribute('class', '');
      perfProfilerPageTab?.setAttribute('class', 'show');
      showButtonMenu(this.perfProfilerFilter, true);
      this.isChartShow = false;
      this.perfProfilerFilter!.disabledMining = false;
      this.perfProfileFrameChart!.clearCanvas();
      this.perfProfilerTbl!.reMeauseHeight();
    }
  }

  refreshAllNode(filterData: unknown): void {
    let perfProfileArgs: unknown[] = []; // @ts-ignore
    let isTopDown: boolean = !filterData.callTree[0]; // @ts-ignore
    let isHideSystemLibrary: boolean = filterData.callTree[1]; // @ts-ignore
    let isHideThread: boolean = filterData.callTree[3]; // @ts-ignore
    let isHideThreadState: boolean = filterData.callTree[4]; // @ts-ignore
    let isOnlyKernel: boolean = filterData.callTree[5]; // @ts-ignore
    let list = filterData.dataMining.concat(filterData.dataLibrary);
    perfProfileArgs.push({
      funcName: 'hideThread',
      funcArgs: [isHideThread],
    });

    perfProfileArgs.push({
      funcName: 'hideThreadState',
      funcArgs: [isHideThreadState],
    });
    perfProfileArgs.push({
      funcName: 'onlyKernel',
      funcArgs: [isOnlyKernel],
    });
    perfProfileArgs.push({
      funcName: 'getCallChainsBySampleIds',
      funcArgs: [isTopDown],
    });
    this.perfProfilerList!.recycleDataSource = [];
    if (isHideSystemLibrary) {
      perfProfileArgs.push({
        funcName: 'hideSystemLibrary',
        funcArgs: [],
      });
    } // @ts-ignore
    if (filterData.callTreeConstraints.checked) {
      perfProfileArgs.push({
        funcName: 'hideNumMaxAndMin', // @ts-ignore
        funcArgs: [parseInt(filterData.callTreeConstraints.inputs[0]), filterData.callTreeConstraints.inputs[1]],
      });
    }
    perfProfileArgs.push({
      funcName: 'splitAllProcess',
      funcArgs: [list],
    });
    perfProfileArgs.push({
      funcName: 'resetAllNode',
      funcArgs: [],
    });
    // @ts-ignore
    this.refreshAllNodeExtend(perfProfileArgs);
  }

  refreshAllNodeExtend(perfProfileArgs: unknown[]): void {
    // @ts-ignore
    if (this._rowClickData && this._rowClickData.libId !== undefined && this._currentLevel === 2) {
      perfProfileArgs.push({
        funcName: 'showLibLevelData',
        funcArgs: [this.perfLevel!.libId, this.perfLevel!.libName],
      }); // @ts-ignore
    } else if (this._rowClickData && this._rowClickData.symbolId && this._currentLevel === 3) {
      perfProfileArgs.push({
        funcName: 'showFunLevelData',
        funcArgs: [this.perfLevel!.symbolId, this.perfLevel!.symbolName],
      });
    }
    this.getDataByWorker(perfProfileArgs, (result: unknown[]): void => {
      this.setPerfProfilerLeftTableData(result); // @ts-ignore
      this.perfProfileFrameChart!.data = this.perfProfilerDataSource;
      if (this.isChartShow) {
        this.perfProfileFrameChart?.calculateChartData();
      }
    });
  }

  setPerfProfilerLeftTableData(resultData: unknown[]): void {
    this.perfProfilerDataSource = this.sortTree(resultData);
    this.perfProfilerTbl!.recycleDataSource = this.perfProfilerDataSource;
  }

  sortTree(arr: Array<unknown>): Array<unknown> {
    let perfProfileSortArr = arr.sort((perfProfileA, perfProfileB): number => {
      if (this.perfProfileSortKey === 'selfDur') {
        if (this.perfProfileSortType === 0) {
          // @ts-ignore
          return perfProfileB.dur - perfProfileA.dur;
        } else if (this.perfProfileSortType === 1) {
          // @ts-ignore
          return perfProfileA.selfDur - perfProfileB.selfDur;
        } else {
          // @ts-ignore
          return perfProfileB.selfDur - perfProfileA.selfDur;
        }
      } else {
        if (this.perfProfileSortType === 0) {
          // @ts-ignore
          return perfProfileB.dur - perfProfileA.dur;
        } else if (this.perfProfileSortType === 1) {
          // @ts-ignore
          return perfProfileA.dur - perfProfileB.dur;
        } else {
          // @ts-ignore
          return perfProfileB.dur - perfProfileA.dur;
        }
      }
    });
    perfProfileSortArr.map((call: unknown): void => {
      // @ts-ignore
      call.children = this.sortTree(call.children);
    });
    return perfProfileSortArr;
  }

  getDataByWorker(args: unknown[], handler: Function): void {
    this.perfProfileProgressEL!.loading = true; // @ts-ignore
    this.perfProfileLoadingPage.style.visibility = 'visible';
    procedurePool.submitWithName('logic0', 'perf-action', args, undefined, (results: unknown): void => {
      handler(results);
      this.perfProfileProgressEL!.loading = false; // @ts-ignore
      this.perfProfileLoadingPage.style.visibility = 'hidden';
    });
  }

  initHtml(): string {
    return TabPerfProfileHtml;
  }
}
