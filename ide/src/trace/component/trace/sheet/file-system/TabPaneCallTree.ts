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
import { LitProgressBar } from '../../../../../base-ui/progress-bar/LitProgressBar';
import { FrameChart } from '../../../chart/FrameChart';
import { SelectionParam } from '../../../../bean/BoxSelection';
import { ChartMode } from '../../../../bean/FrameChartStruct';
import { FilterData, TabPaneFilter } from '../TabPaneFilter';
import { procedurePool } from '../../../../database/Procedure';
import { MerageBean } from '../../../../database/logic-worker/ProcedureLogicWorkerCommon';
import { showButtonMenu } from '../SheetUtils';
import { CallTreeLevelStruct } from '../../../../bean/EbpfStruct';
import '../../../../../base-ui/headline/lit-headline';
import { LitHeadLine } from '../../../../../base-ui/headline/lit-headline';
import { NUM_3, NUM_4 } from '../../../../bean/NumBean';
import { TabPaneCallTreeHtml } from './TabPaneCallTree.html';

const InvertOptionIndex: number = 0;
const hideEventOptionIndex: number = 2;
const hideThreadOptionIndex: number = 3;

@element('tabpane-calltree')
export class TabPaneCallTree extends BaseElement {
  public queryFuncName: string = '';
  public procedureAction: string = '';
  private callTreeTbl: LitTable | null | undefined;
  private callTreeTbr: LitTable | null | undefined;
  private callTreeProgressEL: LitProgressBar | null | undefined;
  private callTreeRightSource: Array<MerageBean> = [];
  private callTreeFilter: TabPaneFilter | null | undefined;
  private callTreeDataSource: unknown[] = [];
  private callTreeSortKey: string = 'weight';
  private callTreeSortType: number = 0;
  private callTreeSelectedData: unknown = undefined;
  private frameChart: FrameChart | null | undefined;
  private isChartShow: boolean = false;
  private systmeRuleName: string = '/system/';
  private callTreeNumRuleName: string = '/max/min/';
  private needShowMenu: boolean = true;
  private searchValue: string = '';
  private loadingList: number[] = [];
  private loadingPage: unknown;
  private currentSelection: SelectionParam | undefined;
  private flameChartMode: ChartMode = ChartMode.Duration;
  private currentCallTreeDataSource: Array<MerageBean> = [];
  private currentRowClickData: unknown;
  private initWidth: number = 0;
  private _pieTitle: string = '';
  private _cWidth: number = 0;
  private _currentCallTreeLevel: number = 0;
  private _rowClickData: unknown = undefined;
  private callTreeLevel: CallTreeLevelStruct | undefined | null;
  private callTreeHeadLine: LitHeadLine | null | undefined;

  set pieTitle(value: string) {
    this._pieTitle = value;
    if (this._pieTitle.length > 0) {
      this.callTreeHeadLine!.isShow = true;
      this.callTreeHeadLine!.titleTxt = this._pieTitle;
      this.callTreeHeadLine!.closeCallback = (): void => {
        this.restore();
      };
    }
  }

  set cWidth(value: number) {
    this._cWidth = value;
  }

  set currentCallTreeLevel(value: number) {
    this._currentCallTreeLevel = value;
  }

  set rowClickData(value: unknown) {
    this._rowClickData = value;
  }

  set data(callTreeSelection: SelectionParam | unknown) {
    if (callTreeSelection !== this.currentSelection && this._rowClickData === this.currentRowClickData) {
      this._rowClickData = undefined;
    }
    if (callTreeSelection === this.currentSelection && !this.currentSelection?.isRowClick) {
      return;
    }
    this.searchValue = '';
    this.initModeAndAction(); // @ts-ignore
    this.currentSelection = callTreeSelection;
    this.currentRowClickData = this._rowClickData;
    this.callTreeTbl!.style.visibility = 'visible';
    if (this.parentElement!.clientHeight > this.callTreeFilter!.clientHeight) {
      this.callTreeFilter!.style.display = 'flex';
    } else {
      this.callTreeFilter!.style.display = 'none';
    }
    procedurePool.submitWithName('logic0', 'fileSystem-reset', [], undefined, () => {});
    this.callTreeFilter!.initializeFilterTree(true, true, true);
    this.callTreeFilter!.filterValue = '';
    this.callTreeProgressEL!.loading = true; // @ts-ignore
    this.loadingPage.style.visibility = 'visible'; // @ts-ignore
    this.getDataByWorkAndUpDateCanvas(callTreeSelection);
  }

  getDataByWorkAndUpDateCanvas(callTreeSelection: SelectionParam): void {
    if (this.clientWidth === 0) {
      this.initWidth = this._cWidth;
    } else {
      this.initWidth = this.clientWidth;
    }
    if (this._rowClickData && this.currentRowClickData !== undefined && this.currentSelection?.isRowClick) {
      this.getCallTreeDataByPieLevel();
    } else {
      this.callTreeHeadLine!.isShow = false;
      this.getCallTreeData(callTreeSelection, this.initWidth);
    }
  }

  private getCallTreeData(callTreeSelection: SelectionParam | unknown, initWidth: number): void {
    this.getDataByWorker(
      [
        {
          funcName: 'setSearchValue',
          funcArgs: [''],
        },
        {
          funcName: 'getCurrentDataFromDb', // @ts-ignore
          funcArgs: [{ queryFuncName: this.queryFuncName, ...callTreeSelection }],
        },
      ],
      (results: unknown[]): void => {
        this.setLTableData(results);
        this.callTreeTbr!.recycleDataSource = [];
        this.frameChart!.mode = this.flameChartMode;
        this.frameChart?.updateCanvas(true, initWidth); // @ts-ignore
        this.frameChart!.data = this.callTreeDataSource; // @ts-ignore
        this.currentCallTreeDataSource = this.callTreeDataSource;
        this.switchFlameChart();
        this.callTreeFilter!.icon = 'block';
      }
    );
  }

  /**
   * 根据Analysis Tab饼图跳转过来的层级绘制对应的CallTree Tab火焰图和表格
   */
  private getCallTreeDataByPieLevel(): void {
    this.callTreeLevel = new CallTreeLevelStruct();
    this.callTreeLevel = {
      // @ts-ignore
      processId: this._rowClickData.pid, // @ts-ignore
      threadId: this._rowClickData.tid, // @ts-ignore
      typeId: this._rowClickData.type, // @ts-ignore
      libId: this._rowClickData.libId, // @ts-ignore
      symbolId: this._rowClickData.symbolId,
    };
    let args = [];
    args.push({
      funcName: 'getCurrentDataFromDb',
      funcArgs: [this.currentSelection, this.callTreeLevel],
    });
    // @ts-ignore
    if (this._rowClickData && this._rowClickData.libId !== undefined && this._currentCallTreeLevel === NUM_3) {
      // @ts-ignore
      this.callTreeLevel.libName = this._rowClickData.tableName;
      args.push({
        funcName: 'showLibLevelData',
        funcArgs: [this.callTreeLevel.libId, this.callTreeLevel.libName],
      });
    } else if (
      this._rowClickData && // @ts-ignore
      this._rowClickData.symbolId !== undefined &&
      this._currentCallTreeLevel === NUM_4
    ) {
      // @ts-ignore
      this.callTreeLevel.symbolName = this._rowClickData.tableName;
      args.push({
        funcName: 'showFunLevelData',
        funcArgs: [this.callTreeLevel.symbolId, this.callTreeLevel.symbolName],
      });
    }

    this.getDataByWorker(args, (results: unknown[]): void => {
      this.callTreeProgressEL!.loading = false; // @ts-ignore
      this.loadingPage.style.visibility = 'hidden';
      this.setLTableData(results);
      this.callTreeTbr!.recycleDataSource = [];
      this.frameChart!.mode = this.flameChartMode;
      this.frameChart?.updateCanvas(true, this.initWidth); // @ts-ignore
      this.frameChart!.data = this.callTreeDataSource; // @ts-ignore
      this.currentCallTreeDataSource = this.callTreeDataSource;
      this.switchFlameChart();
      this.callTreeFilter!.icon = 'block';
    });
  }

  private restore(): void {
    this.searchValue = '';
    this.callTreeFilter!.filterValue = '';
    this.callTreeHeadLine!.isShow = false;
    this._rowClickData = undefined;
    this.getCallTreeData(this.currentSelection, this.initWidth);
  }

  initModeAndAction(): void {
    if (this.procedureAction === '' && this.hasAttribute('action')) {
      this.procedureAction = this.getAttribute('action') || '';
    }
    if (this.hasAttribute('flame-mode')) {
      let callTreeFlameMode = this.getAttribute('flame-mode');
      switch (callTreeFlameMode) {
        case 'Byte':
          this.flameChartMode = ChartMode.Byte;
          break;
        case 'Count':
          this.flameChartMode = ChartMode.Count;
          break;
        case 'Duration':
          this.flameChartMode = ChartMode.Duration;
          break;
      }
    }
    if (this.hasAttribute('query')) {
      this.queryFuncName = this.getAttribute('query') || '';
    }
  }

  getParentTree(callTreeSrc: Array<MerageBean>, target: MerageBean, parents: Array<MerageBean>): boolean {
    for (let callTreeBean of callTreeSrc) {
      if (callTreeBean.id === target.id) {
        parents.push(callTreeBean);
        return true;
      } else {
        if (this.getParentTree(callTreeBean.children as Array<MerageBean>, target, parents)) {
          parents.push(callTreeBean);
          return true;
        }
      }
    }
    return false;
  }

  getChildTree(callTreeSrc: Array<MerageBean>, id: string, children: Array<MerageBean>): boolean {
    for (let callTreeBean of callTreeSrc) {
      if (callTreeBean.id === id && callTreeBean.children.length === 0) {
        children.push(callTreeBean);
        return true;
      } else {
        if (this.getChildTree(callTreeBean.children as Array<MerageBean>, id, children)) {
          children.push(callTreeBean);
          return true;
        }
      }
    }
    return false;
  }

  setRightTableData(bean: MerageBean): void {
    let parents: Array<MerageBean> = [];
    let children: Array<MerageBean> = []; // @ts-ignore
    this.getParentTree(this.callTreeDataSource, bean, parents);
    let maxId: string = bean.id;
    let maxDur: number = 0;

    function findMaxStack(bean: MerageBean): void {
      if (bean.children.length === 0) {
        if (bean.dur > maxDur) {
          maxDur = bean.dur;
          maxId = bean.id;
        }
      } else {
        bean.children.map((callChild: unknown) => {
          findMaxStack(<MerageBean>callChild);
        });
      }
    }

    findMaxStack(bean);
    this.getChildTree(bean.children as Array<MerageBean>, maxId, children);
    let callTreeArr = parents.reverse().concat(children.reverse());
    for (let data of callTreeArr) {
      data.type = data.lib.endsWith('.so.1') || data.lib.endsWith('.dll') || data.lib.endsWith('.so') ? 0 : 1;
    }
    let len = callTreeArr.length;
    this.callTreeRightSource = callTreeArr;
    this.callTreeTbr!.dataSource = len === 0 ? [] : callTreeArr;
  }

  connectedCallback(): void {
    this.parentElement!.onscroll = (): void => {
      this.frameChart!.tabPaneScrollTop = this.parentElement!.scrollTop;
    };
    this.frameChart!.addChartClickListener((needShowMenu: boolean) => {
      this.parentElement!.scrollTo(0, 0);
      showButtonMenu(this.callTreeFilter, needShowMenu);
      this.needShowMenu = needShowMenu;
    });
    let filterHeight = 0;
    new ResizeObserver((entries: ResizeObserverEntry[]): void => {
      let callTreeTabFilter = this.shadowRoot!.querySelector('#filter') as HTMLElement;
      if (callTreeTabFilter.clientHeight > 0) {
        filterHeight = callTreeTabFilter.clientHeight;
      }
      if (this.parentElement!.clientHeight > filterHeight) {
        callTreeTabFilter.style.display = 'flex';
      } else {
        callTreeTabFilter.style.display = 'none';
      }
      if (this.callTreeTbl!.style.visibility === 'hidden') {
        callTreeTabFilter.style.display = 'none';
      }
      if (this.parentElement?.clientHeight !== 0) {
        if (this.isChartShow) {
          this.frameChart?.updateCanvas(false, entries[0].contentRect.width);
          this.frameChart?.calculateChartData();
        }
        let headLineHeight = 0;
        if (this.callTreeHeadLine?.isShow) {
          headLineHeight = this.callTreeHeadLine!.clientHeight;
        }
        if (this.callTreeTbl) {
          // @ts-ignore
          this.callTreeTbl.shadowRoot.querySelector('.table').style.height = `${
            this.parentElement!.clientHeight - 10 - 35 - headLineHeight
          }px`;
          this.callTreeTbl.reMeauseHeight();
        }
        if (this.callTreeTbr) {
          // @ts-ignore
          this.callTreeTbr.shadowRoot.querySelector('.table').style.height = `${
            this.parentElement!.clientHeight - 45 - 21 - headLineHeight
          }px`;
          this.callTreeTbr.reMeauseHeight();
        } // @ts-ignore
        this.loadingPage.style.height = `${this.parentElement!.clientHeight - 24}px`;
      }
    }).observe(this.parentElement!);
  }

  initElements(): void {
    this.callTreeHeadLine = this.shadowRoot?.querySelector<LitHeadLine>('.titleBox');
    this.callTreeTbl = this.shadowRoot?.querySelector<LitTable>('#tb-calltree');
    this.callTreeProgressEL = this.shadowRoot?.querySelector('.call-tree-progress') as LitProgressBar;
    this.frameChart = this.shadowRoot?.querySelector<FrameChart>('#framechart');
    this.loadingPage = this.shadowRoot?.querySelector('.call-tree-loading');
    this.callTreeTbl!.rememberScrollTop = true;
    this.callTreeFilter = this.shadowRoot?.querySelector<TabPaneFilter>('#filter');
    this.callTreeFilter!.disabledTransfer(true);
    this.addEventListener('contextmenu', (event): void => {
      event.preventDefault(); // 阻止默认的上下文菜单弹框
    });
    this.rowClickEvent();
    let boundFilterFunc = this.filterFunc.bind(this);
    this.callTreeFilter!.getDataLibrary(boundFilterFunc);
    this.callTreeFilter!.getDataMining(boundFilterFunc);
    this.handleCallTreeData();
    this.handleConstraintsData();
    this.handleFilterData();
    this.callTreeColumnClick();
  }

  private filterFunc(data: unknown): void {
    let callTreeFuncArgs: unknown[] = []; // @ts-ignore
    if (data.type === 'check') {
      this.handleCheckType(data, callTreeFuncArgs); // @ts-ignore
    } else if (data.type === 'select') {
      this.handleSelectType(callTreeFuncArgs, data); // @ts-ignore
    } else if (data.type === 'button') {
      // @ts-ignore
      if (data.item === 'symbol') {
        // @ts-ignore
        if (this.callTreeSelectedData && !this.callTreeSelectedData.canCharge) {
          return;
        }
        if (this.callTreeSelectedData !== undefined) {
          this.handleSymbolCase(data, callTreeFuncArgs);
        } else {
          return;
        } // @ts-ignore
      } else if (data.item === 'library') {
        // @ts-ignore
        if (this.callTreeSelectedData && !this.callTreeSelectedData.canCharge) {
          return;
        } // @ts-ignore
        if (this.callTreeSelectedData !== undefined && this.callTreeSelectedData.lib !== '') {
          this.handleLibraryCase(data, callTreeFuncArgs);
        } else {
          return;
        } // @ts-ignore
      } else if (data.item === 'restore') {
        this.handleRestoreCase(data, callTreeFuncArgs);
      }
    }
    this.performDataProcessing(callTreeFuncArgs);
  }

  private handleLibraryCase(data: unknown, callTreeFuncArgs: unknown[]): void {
    // @ts-ignore
    this.callTreeFilter!.addDataMining({ name: this.callTreeSelectedData.lib }, data.item);
    callTreeFuncArgs.push({
      funcName: 'splitTree', // @ts-ignore
      funcArgs: [this.callTreeSelectedData.lib, false, false],
    });
  }

  private handleSymbolCase(data: unknown, callTreeFuncArgs: unknown[]): void {
    // @ts-ignore
    this.callTreeFilter!.addDataMining({ name: this.callTreeSelectedData.symbol }, data.item);
    callTreeFuncArgs.push({
      funcName: 'splitTree', // @ts-ignore
      funcArgs: [this.callTreeSelectedData.symbol, false, true],
    });
  }

  private callTreeColumnClick(): void {
    this.callTreeTbl!.addEventListener('column-click', (evt: Event): void => {
      // @ts-ignore
      this.callTreeSortKey = evt.detail.key;
      // @ts-ignore
      this.callTreeSortType = evt.detail.sort;
      // @ts-ignore
      this.setLTableData(this.callTreeDataSource); // @ts-ignore
      this.frameChart!.data = this.callTreeDataSource;
    });
  }

  private performDataProcessing(callTreeFuncArgs: unknown[]): void {
    this.getDataByWorker(callTreeFuncArgs, (result: unknown[]): void => {
      this.setLTableData(result); // @ts-ignore
      this.frameChart!.data = this.callTreeDataSource;
      if (this.isChartShow) {
        this.frameChart?.calculateChartData();
      }
      this.callTreeTbl!.move1px();
      if (this.callTreeSelectedData) {
        // @ts-ignore
        this.callTreeSelectedData.isSelected = false;
        this.callTreeTbl?.clearAllSelection(this.callTreeSelectedData);
        this.callTreeTbr!.recycleDataSource = [];
        this.callTreeSelectedData = undefined;
      }
    });
  }

  private handleRestoreCase(data: unknown, callTreeFuncArgs: unknown[]): void {
    // @ts-ignore
    if (data.remove !== undefined && data.remove.length > 0) {
      // @ts-ignore
      let list = data.remove.map((item: unknown) => {
        // @ts-ignore
        return item.name;
      });
      callTreeFuncArgs.push({
        funcName: 'resotreAllNode',
        funcArgs: [list],
      });
      callTreeFuncArgs.push({
        funcName: 'resetAllNode',
        funcArgs: [],
      });
      list.forEach((symbol: string) => {
        callTreeFuncArgs.push({
          funcName: 'clearSplitMapData',
          funcArgs: [symbol],
        });
      });
    }
  }

  private handleFilterData(): void {
    this.callTreeFilter!.getFilterData((callTreeFilterData: FilterData) => {
      if (
        (this.isChartShow && callTreeFilterData.icon === 'tree') ||
        (!this.isChartShow && callTreeFilterData.icon === 'block')
      ) {
        this.switchFlameChart(callTreeFilterData);
      } else if (this.searchValue !== this.callTreeFilter!.filterValue) {
        this.searchValue = this.callTreeFilter!.filterValue;
        let callTreeArgs = [
          {
            funcName: 'setSearchValue',
            funcArgs: [this.searchValue],
          },
          {
            funcName: 'resetAllNode',
            funcArgs: [],
          },
        ];
        this.getDataByWorker(callTreeArgs, (result: unknown[]): void => {
          this.callTreeTbl!.isSearch = true;
          this.callTreeTbl!.setStatus(result, true);
          this.setLTableData(result); // @ts-ignore
          this.frameChart!.data = this.callTreeDataSource;
          this.switchFlameChart(callTreeFilterData);
        });
      } else {
        this.callTreeTbl!.setStatus(this.callTreeDataSource, true);
        this.setLTableData(this.callTreeDataSource);
        this.switchFlameChart(callTreeFilterData);
      }
    });
  }

  private handleConstraintsData(): void {
    this.callTreeFilter!.getCallTreeConstraintsData((data: unknown) => {
      let callTreeConstraintsArgs: unknown[] = [
        {
          funcName: 'resotreAllNode',
          funcArgs: [[this.callTreeNumRuleName]],
        },
        {
          funcName: 'clearSplitMapData',
          funcArgs: [this.callTreeNumRuleName],
        },
      ]; // @ts-ignore
      if (data.checked) {
        callTreeConstraintsArgs.push({
          funcName: 'hideNumMaxAndMin', // @ts-ignore
          funcArgs: [parseInt(data.min), data.max],
        });
      }
      callTreeConstraintsArgs.push({
        funcName: 'resetAllNode',
        funcArgs: [],
      });
      this.getDataByWorker(callTreeConstraintsArgs, (result: unknown[]) => {
        this.setLTableData(result); // @ts-ignore
        this.frameChart!.data = this.callTreeDataSource;
        if (this.isChartShow) {
          this.frameChart?.calculateChartData();
        }
      });
    });
  }

  private handleCallTreeData(): void {
    this.callTreeFilter!.getCallTreeData((data: unknown) => {
      // @ts-ignore
      if ([InvertOptionIndex, hideThreadOptionIndex, hideEventOptionIndex].includes(data.value)) {
        this.refreshAllNode({
          ...this.callTreeFilter!.getFilterTreeData(), // @ts-ignore
          callTree: data.checks,
        });
      } else {
        let callTreeArgs: unknown[] = []; // @ts-ignore
        if (data.checks[1]) {
          callTreeArgs.push({
            funcName: 'hideSystemLibrary',
            funcArgs: [true],
          });
          callTreeArgs.push({
            funcName: 'resetAllNode',
            funcArgs: [],
          });
        } else {
          callTreeArgs.push({
            funcName: 'resotreAllNode',
            funcArgs: [[this.systmeRuleName]],
          });
          callTreeArgs.push({
            funcName: 'resetAllNode',
            funcArgs: [],
          });
          callTreeArgs.push({
            funcName: 'clearSplitMapData',
            funcArgs: [this.systmeRuleName],
          });
        }
        this.getDataByWorker(callTreeArgs, (result: unknown[]) => {
          this.setLTableData(result); // @ts-ignore
          this.frameChart!.data = this.callTreeDataSource;
          if (this.isChartShow) {
            this.frameChart?.calculateChartData();
          }
        });
      }
    });
  }

  private handleSelectType(callTreeFuncArgs: unknown[], data: unknown): void {
    callTreeFuncArgs.push({
      funcName: 'resotreAllNode', // @ts-ignore
      funcArgs: [[data.item.name]],
    });
    callTreeFuncArgs.push({
      funcName: 'clearSplitMapData', // @ts-ignore
      funcArgs: [data.item.name],
    });
    callTreeFuncArgs.push({
      funcName: 'splitTree', // @ts-ignore
      funcArgs: [data.item.name, data.item.select === '0', data.item.type === 'symbol'],
    });
  }

  private handleCheckType(data: unknown, callTreeFuncArgs: unknown[]): void {
    // @ts-ignore
    if (data.item.checked) {
      callTreeFuncArgs.push({
        funcName: 'splitTree', // @ts-ignore
        funcArgs: [data.item.name, data.item.select === '0', data.item.type === 'symbol'],
      });
    } else {
      callTreeFuncArgs.push({
        funcName: 'resotreAllNode', // @ts-ignore
        funcArgs: [[data.item.name]],
      });
      callTreeFuncArgs.push({
        funcName: 'resetAllNode',
        funcArgs: [],
      });
      callTreeFuncArgs.push({
        funcName: 'clearSplitMapData', // @ts-ignore
        funcArgs: [data.item.name],
      });
    }
  }

  private rowClickEvent(): void {
    this.callTreeTbl!.addEventListener('row-click', (evt: unknown) => {
      // @ts-ignore
      let data = evt.detail.data as MerageBean;
      document.dispatchEvent(
        new CustomEvent('number_calibration', {
          detail: { time: data.tsArray, durations: data.durArray },
        })
      );
      this.setRightTableData(data);
      data.isSelected = true;
      this.callTreeSelectedData = data;
      this.callTreeTbr?.clearAllSelection(data);
      this.callTreeTbr?.setCurrentSelection(data);
      // @ts-ignore
      if ((evt.detail as unknown).callBack) {
        // @ts-ignore
        (evt.detail as unknown).callBack(true);
      }
    });
    this.callTreeTbr = this.shadowRoot?.querySelector<LitTable>('#tb-list');
    this.callTreeTbr!.addEventListener('row-click', (evt: unknown): void => {
      // @ts-ignore
      let data = evt.detail.data as MerageBean;
      this.callTreeTbl?.clearAllSelection(data); // @ts-ignore
      (data as unknown).isSelected = true;
      this.callTreeTbl!.scrollToData(data);
      // @ts-ignore
      if ((evt.detail as unknown).callBack) {
        // @ts-ignore
        (evt.detail as unknown).callBack(true);
      }
    });
  }

  switchFlameChart(data?: unknown): void {
    let callTreePageTab = this.shadowRoot?.querySelector('#show_table');
    let callTreePageChart = this.shadowRoot?.querySelector('#show_chart'); // @ts-ignore
    if (!data || data.icon === 'block') {
      callTreePageChart?.setAttribute('class', 'show');
      callTreePageTab?.setAttribute('class', '');
      this.isChartShow = true;
      this.callTreeFilter!.disabledMining = true;
      showButtonMenu(this.callTreeFilter, this.needShowMenu);
      this.frameChart?.calculateChartData(); // @ts-ignore
    } else if (data.icon === 'tree') {
      callTreePageChart?.setAttribute('class', '');
      callTreePageTab?.setAttribute('class', 'show');
      showButtonMenu(this.callTreeFilter, true);
      this.isChartShow = false;
      this.callTreeFilter!.disabledMining = false;
      this.frameChart!.clearCanvas();
      this.callTreeTbl!.reMeauseHeight();
    }
  }

  refreshAllNode(filterData: unknown): void {
    let callTreeArgs: unknown[] = []; // @ts-ignore
    let isTopDown: boolean = !filterData.callTree[0]; // @ts-ignore
    let isHideSystemLibrary = filterData.callTree[1]; // @ts-ignore
    let isHideEvent: boolean = filterData.callTree[2]; // @ts-ignore
    let isHideThread: boolean = filterData.callTree[3]; // @ts-ignore
    let list = filterData.dataMining.concat(filterData.dataLibrary);
    callTreeArgs.push({ funcName: 'hideThread', funcArgs: [isHideThread] });
    callTreeArgs.push({ funcName: 'hideEvent', funcArgs: [isHideEvent] });
    callTreeArgs.push({ funcName: 'getCallChainsBySampleIds', funcArgs: [isTopDown, this.queryFuncName] });
    this.callTreeTbr!.recycleDataSource = [];
    if (isHideSystemLibrary) {
      callTreeArgs.push({ funcName: 'hideSystemLibrary', funcArgs: [true] });
    } // @ts-ignore
    if (filterData.callTreeConstraints.checked) {
      callTreeArgs.push({
        funcName: 'hideNumMaxAndMin', // @ts-ignore
        funcArgs: [parseInt(filterData.callTreeConstraints.inputs[0]), filterData.callTreeConstraints.inputs[1]],
      });
    }
    callTreeArgs.push({ funcName: 'splitAllProcess', funcArgs: [list] });
    callTreeArgs.push({
      funcName: 'resetAllNode',
      funcArgs: [],
    }); // @ts-ignore
    if (this._rowClickData && this._rowClickData.libId !== undefined && this._currentCallTreeLevel === 3) {
      callTreeArgs.push({
        funcName: 'showLibLevelData',
        funcArgs: [this.callTreeLevel!.libId, this.callTreeLevel!.libName],
      }); // @ts-ignore
    } else if (this._rowClickData && this._rowClickData.symbolId !== undefined && this._currentCallTreeLevel === 4) {
      callTreeArgs.push({
        funcName: 'showFunLevelData',
        funcArgs: [this.callTreeLevel!.symbolId, this.callTreeLevel!.symbolName],
      });
    }
    this.getDataByWorker(callTreeArgs, (result: unknown[]): void => {
      this.setLTableData(result); // @ts-ignore
      this.frameChart!.data = this.callTreeDataSource;
      if (this.isChartShow) {
        this.frameChart?.calculateChartData();
      }
    });
  }

  setLTableData(resultData: unknown[]): void {
    this.callTreeDataSource = this.sortCallFnTree(resultData);
    this.callTreeTbl!.recycleDataSource = this.callTreeDataSource;
  }

  sortCallFnTree(arr: Array<unknown>): Array<unknown> {
    let sortArr = arr.sort((compareFnA: unknown, compareFnB: unknown): number => {
      if (this.callTreeSortKey === 'self') {
        if (this.callTreeSortType === 0) {
          // @ts-ignore
          return compareFnB.dur - compareFnA.dur;
        } else if (this.callTreeSortType === 1) {
          // @ts-ignore
          return compareFnA.selfDur - compareFnB.selfDur;
        } else {
          // @ts-ignore
          return compareFnB.selfDur - compareFnA.selfDur;
        }
      } else {
        if (this.callTreeSortType === 0) {
          // @ts-ignore
          return compareFnB.dur - compareFnA.dur;
        } else if (this.callTreeSortType === 1) {
          // @ts-ignore
          return compareFnA.dur - compareFnB.dur;
        } else {
          // @ts-ignore
          return compareFnB.dur - compareFnA.dur;
        }
      }
    });
    sortArr.map((call: unknown): void => {
      // @ts-ignore
      call.children = this.sortCallFnTree(call.children);
    });
    return sortArr;
  }

  getDataByWorker(args: unknown[], handler: Function): void {
    this.loadingList.push(1); // @ts-ignore
    this.loadingPage.style.visibility = 'visible';
    this.callTreeProgressEL!.loading = true;
    procedurePool.submitWithName(
      'logic0',
      this.procedureAction,
      { args, callType: this.queryFuncName },
      undefined,
      (callTreeResults: unknown): void => {
        handler(callTreeResults);
        this.loadingList.splice(0, 1);
        if (this.loadingList.length === 0) {
          this.callTreeProgressEL!.loading = false; // @ts-ignore
          this.loadingPage.style.visibility = 'hidden';
        }
      }
    );
  }

  initHtml(): string {
    return TabPaneCallTreeHtml;
  }
}
