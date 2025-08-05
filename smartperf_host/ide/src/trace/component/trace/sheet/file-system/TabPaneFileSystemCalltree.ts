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
import '../../../chart/FrameChart';
import { SelectionParam } from '../../../../bean/BoxSelection';
import { ChartMode } from '../../../../bean/FrameChartStruct';
import { FilterData, TabPaneFilter } from '../TabPaneFilter';
import '../TabPaneFilter';
import { procedurePool } from '../../../../database/Procedure';
import { FileMerageBean } from '../../../../database/logic-worker/ProcedureLogicWorkerFileSystem';
import { showButtonMenu } from '../SheetUtils';
import { CallTreeLevelStruct } from '../../../../bean/EbpfStruct';
import '../../../../../base-ui/headline/lit-headline';
import { LitHeadLine } from '../../../../../base-ui/headline/lit-headline';
import { TabPaneFileSystemCalltreeHtml } from './TabPaneFileSystemCalltree.html';

const InvertOptionIndex: number = 0;
const hideEventOptionIndex: number = 2;
const hideThreadOptionIndex: number = 3;

@element('tabpane-filesystem-calltree')
export class TabpaneFilesystemCalltree extends BaseElement {
  private fsCallTreeTbl: LitTable | null | undefined;
  private fsCallTreeTbr: LitTable | null | undefined;
  private fsCallTreeProgressEL: LitProgressBar | null | undefined;
  private fsCallTreeRightSource: Array<FileMerageBean> = [];
  private fsCallTreeFilter: unknown;
  private fsCallTreeDataSource: unknown[] = [];
  private fsCallTreeSortKey = 'weight';
  private fsCallTreeSortType: number = 0;
  private fsCallTreeCurrentSelectedData: unknown = undefined;
  private frameChart: FrameChart | null | undefined;
  private isChartShow: boolean = false;
  private systmeRuleName: string = '/system/';
  private fsCallTreeNumRuleName: string = '/max/min/';
  private needShowMenu: boolean = true;
  private searchValue: string = '';
  private loadingList: number[] = [];
  private loadingPage: unknown;
  private currentSelection: SelectionParam | undefined;
  private currentFsCallTreeDataSource: Array<FileMerageBean> = [];

  private currentRowClickData: unknown;
  private initWidth: number = 0;
  private _pieTitle: string = '';
  private _cWidth: number = 0;
  private _currentFsCallTreeLevel: number = 0;
  private _fsRowClickData: unknown = undefined;
  private FsCallTreeLevel: CallTreeLevelStruct | undefined | null;
  private fileSystemHeadLine: LitHeadLine | null | undefined;

  set pieTitle(value: string) {
    this._pieTitle = value;
    if (this._pieTitle.length > 0) {
      this.fileSystemHeadLine!.isShow = true;
      this.fileSystemHeadLine!.titleTxt = this._pieTitle;
      this.fileSystemHeadLine!.closeCallback = (): void => {
        this.restore();
      };
    }
  }

  set cWidth(value: number) {
    this._cWidth = value;
  }

  set currentFsCallTreeLevel(value: number) {
    this._currentFsCallTreeLevel = value;
  }

  set fsRowClickData(value: unknown) {
    this._fsRowClickData = value;
  }

  set data(fsCallTreeSelection: SelectionParam | unknown) {
    if (fsCallTreeSelection !== this.currentSelection && this._fsRowClickData === this.currentRowClickData) {
      this._fsRowClickData = undefined;
    }
    if (fsCallTreeSelection === this.currentSelection && !this.currentSelection?.isRowClick) {
      return;
    }
    this.searchValue = ''; // @ts-ignore
    this.currentSelection = fsCallTreeSelection;
    this.currentRowClickData = this._fsRowClickData;
    this.fsCallTreeTbl!.style.visibility = 'visible'; // @ts-ignore
    if (this.parentElement!.clientHeight > this.fsCallTreeFilter!.clientHeight) {
      // @ts-ignore
      this.fsCallTreeFilter!.style.display = 'flex';
    } else {
      // @ts-ignore
      this.fsCallTreeFilter!.style.display = 'none';
    }
    procedurePool.submitWithName('logic0', 'fileSystem-reset', [], undefined, (): void => {}); // @ts-ignore
    this.fsCallTreeFilter!.initializeFilterTree(true, true, true); // @ts-ignore
    this.fsCallTreeFilter!.filterValue = '';
    this.fsCallTreeProgressEL!.loading = true; // @ts-ignore
    this.loadingPage.style.visibility = 'visible'; // @ts-ignore
    this.getDataByWorkAndUpDateCanvas(fsCallTreeSelection);
  }

  getDataByWorkAndUpDateCanvas(fsCallTreeSelection: SelectionParam): void {
    if (this.clientWidth === 0) {
      this.initWidth = this._cWidth;
    } else {
      this.initWidth = this.clientWidth;
    }
    if (this._fsRowClickData && this.currentRowClickData !== undefined && this.currentSelection?.isRowClick) {
      this.getFsCallTreeDataByPieLevel();
    } else {
      this.fileSystemHeadLine!.isShow = false;
      this.getFsCallTreeData(fsCallTreeSelection, this.initWidth);
    }
  }

  private getFsCallTreeData(fsCallTreeSelection: SelectionParam | unknown, initWidth: number): void {
    this.getDataByWorker(
      [
        {
          funcName: 'setSearchValue',
          funcArgs: [''],
        },
        {
          funcName: 'getCurrentDataFromDb', // @ts-ignore
          funcArgs: [{ queryFuncName: 'fileSystem', ...fsCallTreeSelection }],
        },
      ],
      (fsCallTreeResults: unknown[]): void => {
        this.setLTableData(fsCallTreeResults);
        this.fsCallTreeTbr!.recycleDataSource = [];
        this.frameChart!.mode = ChartMode.Duration;
        this.frameChart?.updateCanvas(true, initWidth); // @ts-ignore
        this.frameChart!.data = this.fsCallTreeDataSource; // @ts-ignore
        this.currentFsCallTreeDataSource = this.fsCallTreeDataSource;
        this.switchFlameChart(); // @ts-ignore
        this.fsCallTreeFilter.icon = 'block';
      }
    );
  }

  /**
   * 根据Analysis Tab饼图跳转过来的层级绘制对应的CallTree Tab火焰图和表格
   */
  private getFsCallTreeDataByPieLevel(): void {
    this.FsCallTreeLevel = new CallTreeLevelStruct();
    this.FsCallTreeLevel = {
      // @ts-ignore
      processId: this._fsRowClickData.pid, // @ts-ignore
      threadId: this._fsRowClickData.tid, // @ts-ignore
      typeId: this._fsRowClickData.type, // @ts-ignore
      libId: this._fsRowClickData.libId, // @ts-ignore
      symbolId: this._fsRowClickData.symbolId,
    };
    let args = [];
    args.push({
      funcName: 'getCurrentDataFromDb',
      funcArgs: [this.currentSelection, this.FsCallTreeLevel],
    });
    // @ts-ignore
    if (this._fsRowClickData && this._fsRowClickData.libId !== undefined && this._currentFsCallTreeLevel === 3) {
      // @ts-ignore
      this.FsCallTreeLevel.libName = this._fsRowClickData.tableName;
      args.push({
        funcName: 'showLibLevelData',
        funcArgs: [this.FsCallTreeLevel.libId, this.FsCallTreeLevel.libName],
      });
    } else if (
      this._fsRowClickData && // @ts-ignore
      this._fsRowClickData.symbolId !== undefined &&
      this._currentFsCallTreeLevel === 4
    ) {
      // @ts-ignore
      this.FsCallTreeLevel.symbolName = this._fsRowClickData.tableName;
      args.push({
        funcName: 'showFunLevelData',
        funcArgs: [this.FsCallTreeLevel.symbolId, this.FsCallTreeLevel.symbolName],
      });
    }

    this.getDataByWorker(args, (fsCallTreeResults: unknown[]) => {
      this.setLTableData(fsCallTreeResults);
      this.fsCallTreeTbr!.recycleDataSource = [];
      this.frameChart!.mode = ChartMode.Duration;
      this.frameChart?.updateCanvas(true, this.initWidth); // @ts-ignore
      this.frameChart!.data = this.fsCallTreeDataSource; // @ts-ignore
      this.currentFsCallTreeDataSource = this.fsCallTreeDataSource;
      this.switchFlameChart(); // @ts-ignore
      this.fsCallTreeFilter.icon = 'block';
    });
  }

  private restore(): void {
    this.searchValue = ''; // @ts-ignore
    this.fsCallTreeFilter.filterValue = '';
    this.fileSystemHeadLine!.isShow = false;
    this._fsRowClickData = undefined;
    this.getFsCallTreeData(this.currentSelection, this.initWidth);
  }

  getParentTree(
    fsCallTreeSrc: Array<FileMerageBean>,
    fsCallTreeTarget: FileMerageBean,
    parents: Array<FileMerageBean>
  ): boolean {
    for (let fsCallTreeBean of fsCallTreeSrc) {
      if (fsCallTreeBean.id === fsCallTreeTarget.id) {
        parents.push(fsCallTreeBean);
        return true;
      } else {
        if (this.getParentTree(fsCallTreeBean.children as Array<FileMerageBean>, fsCallTreeTarget, parents)) {
          parents.push(fsCallTreeBean);
          return true;
        }
      }
    }
    return false;
  }

  getChildTree(fsCallTreeSrc: Array<FileMerageBean>, id: string, children: Array<FileMerageBean>): boolean {
    for (let fsCallTreeBean of fsCallTreeSrc) {
      if (fsCallTreeBean.id === id && fsCallTreeBean.children.length === 0) {
        children.push(fsCallTreeBean);
        return true;
      } else {
        if (this.getChildTree(fsCallTreeBean.children as Array<FileMerageBean>, id, children)) {
          children.push(fsCallTreeBean);
          return true;
        }
      }
    }
    return false;
  }

  setRightTableData(merageBean: FileMerageBean): void {
    let parents: Array<FileMerageBean> = [];
    let children: Array<FileMerageBean> = []; // @ts-ignore
    this.getParentTree(this.fsCallTreeDataSource, merageBean, parents);
    let maxId: string = merageBean.id;
    let maxDur: number = 0;

    function findMaxStack(fsMerageBean: FileMerageBean): void {
      if (fsMerageBean.children.length === 0) {
        if (fsMerageBean.dur > maxDur) {
          maxDur = fsMerageBean.dur;
          maxId = fsMerageBean.id;
        }
      } else {
        fsMerageBean.children.map((callChild: unknown): void => {
          findMaxStack(<FileMerageBean>callChild);
        });
      }
    }

    findMaxStack(merageBean);
    this.getChildTree(merageBean.children as Array<FileMerageBean>, maxId, children);
    let fsMerageParentsList = parents.reverse().concat(children.reverse());
    for (let data of fsMerageParentsList) {
      data.type = data.lib.endsWith('.so.1') || data.lib.endsWith('.dll') || data.lib.endsWith('.so') ? 0 : 1;
    }
    let len = fsMerageParentsList.length;
    this.fsCallTreeRightSource = fsMerageParentsList;
    this.fsCallTreeTbr!.dataSource = len === 0 ? [] : fsMerageParentsList;
  }

  initElements(): void {
    this.fileSystemHeadLine = this.shadowRoot?.querySelector('.titleBox');
    this.fsCallTreeTbl = this.shadowRoot?.querySelector<LitTable>('#tb-filesystem-calltree');
    this.fsCallTreeProgressEL = this.shadowRoot?.querySelector('.fs-call-tree-progress') as LitProgressBar;
    this.frameChart = this.shadowRoot?.querySelector<FrameChart>('#framechart');
    this.loadingPage = this.shadowRoot?.querySelector('.fs-call-tree-loading');
    this.addEventListener('contextmenu', (event) => {
      event.preventDefault(); // 阻止默认的上下文菜单弹框
    });
    this.frameChart!.addChartClickListener((needShowMenu: boolean) => {
      this.parentElement!.scrollTo(0, 0);
      showButtonMenu(this.fsCallTreeFilter, needShowMenu);
      this.needShowMenu = needShowMenu;
    });
    this.fsCallTreeTbl!.rememberScrollTop = true;
    this.fsCallTreeFilter = this.shadowRoot?.querySelector<TabPaneFilter>('#filter'); // @ts-ignore
    this.fsCallTreeFilter!.disabledTransfer(true);
    this.tblRowClickEvent();
    this.fsCallTreeTbr = this.shadowRoot?.querySelector<LitTable>('#tb-filesystem-list');
    this.tbrRowClickEvent();
    let boundFilterFunc = this.filterFunc.bind(this); // @ts-ignore
    this.fsCallTreeFilter!.getDataLibrary(boundFilterFunc); // @ts-ignore
    this.fsCallTreeFilter!.getDataMining(boundFilterFunc);
    this.handleCallTreeData();
    this.handleConstraintsData();
    this.handleFilterData();
    this.callTreeColumnClick();
  }

  private filterFunc(data: unknown): void {
    let fsCallTreeFuncArgs: unknown[] = []; // @ts-ignore
    if (data.type === 'check') {
      this.handleCheckType(data, fsCallTreeFuncArgs); // @ts-ignore
    } else if (data.type === 'select') {
      this.handleSelectType(fsCallTreeFuncArgs, data); // @ts-ignore
    } else if (data.type === 'button') {
      // @ts-ignore
      if (data.item === 'symbol') {
        // @ts-ignore
        if (this.fsCallTreeCurrentSelectedData && !this.fsCallTreeCurrentSelectedData.canCharge) {
          return;
        }
        if (this.fsCallTreeCurrentSelectedData !== undefined) {
          this.handleSymbolCase(data, fsCallTreeFuncArgs);
        } else {
          return;
        } // @ts-ignore
      } else if (data.item === 'library') {
        // @ts-ignore
        if (this.fsCallTreeCurrentSelectedData && !this.fsCallTreeCurrentSelectedData.canCharge) {
          return;
        } // @ts-ignore
        if (this.fsCallTreeCurrentSelectedData !== undefined && this.fsCallTreeCurrentSelectedData.lib !== '') {
          this.handleLibraryCase(data, fsCallTreeFuncArgs);
        } else {
          return;
        } // @ts-ignore
      } else if (data.item === 'restore') {
        this.handleRestoreCase(data, fsCallTreeFuncArgs);
      }
    }
    this.performDataProcessing(fsCallTreeFuncArgs);
  }

  private handleSymbolCase(data: unknown, fsCallTreeFuncArgs: unknown[]): void {
    // @ts-ignore
    this.fsCallTreeFilter!.addDataMining({ name: this.fsCallTreeCurrentSelectedData.symbol }, data.item);
    fsCallTreeFuncArgs.push({
      funcName: 'splitTree', // @ts-ignore
      funcArgs: [this.fsCallTreeCurrentSelectedData.symbol, false, true],
    });
  }

  private handleLibraryCase(data: unknown, fsCallTreeFuncArgs: unknown[]): void {
    // @ts-ignore
    this.fsCallTreeFilter!.addDataMining({ name: this.fsCallTreeCurrentSelectedData.lib }, data.item);
    fsCallTreeFuncArgs.push({
      funcName: 'splitTree', // @ts-ignore
      funcArgs: [this.fsCallTreeCurrentSelectedData.lib, false, false],
    });
  }

  private callTreeColumnClick(): void {
    this.fsCallTreeTbl!.addEventListener('column-click', (evt): void => {
      // @ts-ignore
      this.fsCallTreeSortKey = evt.detail.key;
      // @ts-ignore
      this.fsCallTreeSortType = evt.detail.sort;
      // @ts-ignore
      this.setLTableData(this.fsCallTreeDataSource); // @ts-ignore
      this.frameChart!.data = this.fsCallTreeDataSource;
    });
  }

  private handleFilterData(): void {
    // @ts-ignore
    this.fsCallTreeFilter!.getFilterData((data: FilterData): void => {
      if ((this.isChartShow && data.icon === 'tree') || (!this.isChartShow && data.icon === 'block')) {
        this.switchFlameChart(data); // @ts-ignore
      } else if (this.searchValue !== this.fsCallTreeFilter!.filterValue) {
        // @ts-ignore
        this.searchValue = this.fsCallTreeFilter!.filterValue;
        let fileArgs = [
          {
            funcName: 'setSearchValue',
            funcArgs: [this.searchValue],
          },
          {
            funcName: 'resetAllNode',
            funcArgs: [],
          },
        ];
        this.getDataByWorker(fileArgs, (result: unknown[]): void => {
          this.fsCallTreeTbl!.isSearch = true;
          this.fsCallTreeTbl!.setStatus(result, true);
          this.setLTableData(result); // @ts-ignore
          this.frameChart!.data = this.fsCallTreeDataSource;
          this.switchFlameChart(data);
        });
      } else {
        this.fsCallTreeTbl!.setStatus(this.fsCallTreeDataSource, true);
        this.setLTableData(this.fsCallTreeDataSource);
        this.switchFlameChart(data);
      }
    });
  }

  private handleConstraintsData(): void {
    // @ts-ignore
    this.fsCallTreeFilter!.getCallTreeConstraintsData((data: unknown): void => {
      let fsCallTreeConstraintsArgs: unknown[] = [
        {
          funcName: 'resotreAllNode',
          funcArgs: [[this.fsCallTreeNumRuleName]],
        },
        {
          funcName: 'clearSplitMapData',
          funcArgs: [this.fsCallTreeNumRuleName],
        },
      ]; // @ts-ignore
      if (data.checked) {
        fsCallTreeConstraintsArgs.push({
          funcName: 'hideNumMaxAndMin', // @ts-ignore
          funcArgs: [parseInt(data.min), data.max],
        });
      }
      fsCallTreeConstraintsArgs.push({
        funcName: 'resetAllNode',
        funcArgs: [],
      });
      this.getDataByWorker(fsCallTreeConstraintsArgs, (result: unknown[]): void => {
        this.setLTableData(result); // @ts-ignore
        this.frameChart!.data = this.fsCallTreeDataSource;
        if (this.isChartShow) {
          this.frameChart?.calculateChartData();
        }
      });
    });
  }

  private handleCallTreeData(): void {
    // @ts-ignore
    this.fsCallTreeFilter!.getCallTreeData((data: unknown): void => {
      // @ts-ignore
      if ([InvertOptionIndex, hideThreadOptionIndex, hideEventOptionIndex].includes(data.value)) {
        this.refreshAllNode({
          // @ts-ignore
          ...this.fsCallTreeFilter!.getFilterTreeData(), // @ts-ignore
          callTree: data.checks,
        });
      } else {
        let fileSysCallTreeArgs: unknown[] = []; // @ts-ignore
        if (data.checks[1]) {
          fileSysCallTreeArgs.push({
            funcName: 'hideSystemLibrary',
            funcArgs: [],
          });
          fileSysCallTreeArgs.push({
            funcName: 'resetAllNode',
            funcArgs: [],
          });
        } else {
          fileSysCallTreeArgs.push({
            funcName: 'resotreAllNode',
            funcArgs: [[this.systmeRuleName]],
          });
          fileSysCallTreeArgs.push({
            funcName: 'resetAllNode',
            funcArgs: [],
          });
          fileSysCallTreeArgs.push({
            funcName: 'clearSplitMapData',
            funcArgs: [this.systmeRuleName],
          });
        }
        this.getDataByWorker(fileSysCallTreeArgs, (result: unknown[]): void => {
          this.setLTableData(result); // @ts-ignore
          this.frameChart!.data = this.fsCallTreeDataSource;
          if (this.isChartShow) {
            this.frameChart?.calculateChartData();
          }
        });
      }
    });
  }

  private performDataProcessing(fsCallTreeFuncArgs: unknown[]): void {
    this.getDataByWorker(fsCallTreeFuncArgs, (result: unknown[]): void => {
      this.setLTableData(result); // @ts-ignore
      this.frameChart!.data = this.fsCallTreeDataSource;
      if (this.isChartShow) {
        this.frameChart?.calculateChartData();
      }
      this.fsCallTreeTbl!.move1px();
      if (this.fsCallTreeCurrentSelectedData) {
        // @ts-ignore
        this.fsCallTreeCurrentSelectedData.isSelected = false;
        this.fsCallTreeTbl?.clearAllSelection(this.fsCallTreeCurrentSelectedData);
        this.fsCallTreeTbr!.recycleDataSource = [];
        this.fsCallTreeCurrentSelectedData = undefined;
      }
    });
  }

  private handleRestoreCase(data: unknown, fsCallTreeFuncArgs: unknown[]): void {
    // @ts-ignore
    if (data.remove !== undefined && data.remove.length > 0) {
      // @ts-ignore
      let list = data.remove.map((item: unknown) => {
        // @ts-ignore
        return item.name;
      });
      fsCallTreeFuncArgs.push({
        funcName: 'resotreAllNode',
        funcArgs: [list],
      });
      fsCallTreeFuncArgs.push({
        funcName: 'resetAllNode',
        funcArgs: [],
      });
      list.forEach((symbol: string): void => {
        fsCallTreeFuncArgs.push({
          funcName: 'clearSplitMapData',
          funcArgs: [symbol],
        });
      });
    }
  }

  private handleSelectType(fsCallTreeFuncArgs: unknown[], data: unknown): void {
    fsCallTreeFuncArgs.push({
      funcName: 'resotreAllNode', // @ts-ignore
      funcArgs: [[data.item.name]],
    });
    fsCallTreeFuncArgs.push({
      funcName: 'clearSplitMapData', // @ts-ignore
      funcArgs: [data.item.name],
    });
    fsCallTreeFuncArgs.push({
      funcName: 'splitTree', // @ts-ignore
      funcArgs: [data.item.name, data.item.select === '0', data.item.type === 'symbol'],
    });
  }

  private handleCheckType(data: unknown, fsCallTreeFuncArgs: unknown[]): void {
    // @ts-ignore
    if (data.item.checked) {
      fsCallTreeFuncArgs.push({
        funcName: 'splitTree', // @ts-ignore
        funcArgs: [data.item.name, data.item.select === '0', data.item.type === 'symbol'],
      });
    } else {
      fsCallTreeFuncArgs.push({
        funcName: 'resotreAllNode', // @ts-ignore
        funcArgs: [[data.item.name]],
      });
      fsCallTreeFuncArgs.push({
        funcName: 'resetAllNode',
        funcArgs: [],
      });
      fsCallTreeFuncArgs.push({
        funcName: 'clearSplitMapData', // @ts-ignore
        funcArgs: [data.item.name],
      });
    }
  }

  private tbrRowClickEvent(): void {
    this.fsCallTreeTbr!.addEventListener('row-click', (evt: unknown): void => {
      // @ts-ignore
      let data = evt.detail.data as FileMerageBean;
      this.fsCallTreeTbl?.clearAllSelection(data); // @ts-ignore
      (data as unknown).isSelected = true;
      this.fsCallTreeTbl!.scrollToData(data);
      // @ts-ignore
      if ((evt.detail as unknown).callBack) {
        // @ts-ignore
        (evt.detail as unknown).callBack(true);
      }
    });
  }

  private tblRowClickEvent(): void {
    this.fsCallTreeTbl!.addEventListener('row-click', (evt: unknown): void => {
      // @ts-ignore
      let data = evt.detail.data as FileMerageBean;
      document.dispatchEvent(
        new CustomEvent('number_calibration', {
          detail: { time: data.tsArray, durations: data.durArray },
        })
      );
      this.setRightTableData(data);
      data.isSelected = true;
      this.fsCallTreeCurrentSelectedData = data;
      this.fsCallTreeTbr?.clearAllSelection(data);
      this.fsCallTreeTbr?.setCurrentSelection(data);
      // @ts-ignore
      if ((evt.detail as unknown).callBack) {
        // @ts-ignore
        (evt.detail as unknown).callBack(true);
      }
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    let filterHeight = 0;
    new ResizeObserver((entries: ResizeObserverEntry[]): void => {
      let fsCallTreeTabFilter = this.shadowRoot!.querySelector('#filter') as HTMLElement;
      if (fsCallTreeTabFilter.clientHeight > 0) {
        filterHeight = fsCallTreeTabFilter.clientHeight;
      }
      if (this.parentElement!.clientHeight > filterHeight) {
        fsCallTreeTabFilter.style.display = 'flex';
      } else {
        fsCallTreeTabFilter.style.display = 'none';
      }
      if (this.fsCallTreeTbl!.style.visibility === 'hidden') {
        fsCallTreeTabFilter.style.display = 'none';
      }
      if (this.parentElement?.clientHeight !== 0) {
        if (this.isChartShow) {
          this.frameChart?.updateCanvas(false, entries[0].contentRect.width);
          this.frameChart?.calculateChartData();
        }
        let headLineHeight = 0;
        if (this.fileSystemHeadLine?.isShow) {
          headLineHeight = this.fileSystemHeadLine!.clientHeight;
        }
        if (this.fsCallTreeTbl) {
          // @ts-ignore
          this.fsCallTreeTbl.shadowRoot.querySelector('.table').style.height = `${
            this.parentElement!.clientHeight - 10 - 35 - headLineHeight
          }px`;
          this.fsCallTreeTbl.reMeauseHeight();
        }
        if (this.fsCallTreeTbr) {
          // @ts-ignore
          this.fsCallTreeTbr.shadowRoot.querySelector('.table').style.height = `${
            this.parentElement!.clientHeight - 45 - 21 - headLineHeight
          }px`;
          this.fsCallTreeTbr.reMeauseHeight();
        } // @ts-ignore
        this.loadingPage.style.height = `${this.parentElement!.clientHeight - 24}px`;
      }
    }).observe(this.parentElement!);
    this.parentElement!.onscroll = (): void => {
      this.frameChart!.tabPaneScrollTop = this.parentElement!.scrollTop;
    };
  }

  switchFlameChart(data?: unknown): void {
    let fsCallTreePageTab = this.shadowRoot?.querySelector('#show_table');
    let fsCallTreePageChart = this.shadowRoot?.querySelector('#show_chart'); // @ts-ignore
    if (!data || data.icon === 'block') {
      fsCallTreePageChart?.setAttribute('class', 'show');
      fsCallTreePageTab?.setAttribute('class', '');
      this.isChartShow = true; // @ts-ignore
      this.fsCallTreeFilter!.disabledMining = true;
      showButtonMenu(this.fsCallTreeFilter, this.needShowMenu);
      this.frameChart?.calculateChartData(); // @ts-ignore
    } else if (data.icon === 'tree') {
      fsCallTreePageChart?.setAttribute('class', '');
      fsCallTreePageTab?.setAttribute('class', 'show');
      showButtonMenu(this.fsCallTreeFilter, true);
      this.isChartShow = false; // @ts-ignore
      this.fsCallTreeFilter!.disabledMining = false;
      this.frameChart!.clearCanvas();
      this.fsCallTreeTbl!.reMeauseHeight();
    }
  }

  refreshAllNode(filterData: unknown): void {
    let fileSysCallTreeArgs: unknown[] = []; // @ts-ignore
    let isTopDown: boolean = !filterData.callTree[0]; // @ts-ignore
    let isHideSystemLibrary = filterData.callTree[1]; // @ts-ignore
    let isHideEvent: boolean = filterData.callTree[2]; // @ts-ignore
    let isHideThread: boolean = filterData.callTree[3]; // @ts-ignore
    let list = filterData.dataMining.concat(filterData.dataLibrary);
    fileSysCallTreeArgs.push({ funcName: 'hideThread', funcArgs: [isHideThread] });
    fileSysCallTreeArgs.push({ funcName: 'hideEvent', funcArgs: [isHideEvent] });
    fileSysCallTreeArgs.push({ funcName: 'getCallChainsBySampleIds', funcArgs: [isTopDown, 'fileSystem'] });
    this.fsCallTreeTbr!.recycleDataSource = [];
    if (isHideSystemLibrary) {
      fileSysCallTreeArgs.push({ funcName: 'hideSystemLibrary', funcArgs: [] });
    } // @ts-ignore
    if (filterData.callTreeConstraints.checked) {
      fileSysCallTreeArgs.push({
        funcName: 'hideNumMaxAndMin', // @ts-ignore
        funcArgs: [parseInt(filterData.callTreeConstraints.inputs[0]), filterData.callTreeConstraints.inputs[1]],
      });
    }
    fileSysCallTreeArgs.push({ funcName: 'splitAllProcess', funcArgs: [list] });
    fileSysCallTreeArgs.push({ funcName: 'resetAllNode', funcArgs: [] }); // @ts-ignore
    if (this._fsRowClickData && this._fsRowClickData.libId !== undefined && this._currentFsCallTreeLevel === 3) {
      fileSysCallTreeArgs.push({
        funcName: 'showLibLevelData',
        funcArgs: [this.FsCallTreeLevel!.libId, this.FsCallTreeLevel!.libName],
      });
    } else if (
      this._fsRowClickData && // @ts-ignore
      this._fsRowClickData.symbolId !== undefined &&
      this._currentFsCallTreeLevel === 4
    ) {
      fileSysCallTreeArgs.push({
        funcName: 'showFunLevelData',
        funcArgs: [this.FsCallTreeLevel!.symbolId, this.FsCallTreeLevel!.symbolName],
      });
    }
    this.getDataByWorker(fileSysCallTreeArgs, (result: unknown[]): void => {
      this.setLTableData(result); // @ts-ignore
      this.frameChart!.data = this.fsCallTreeDataSource;
      if (this.isChartShow) {
        this.frameChart?.calculateChartData();
      }
    });
  }

  setLTableData(resultData: unknown[]): void {
    this.fsCallTreeDataSource = this.sortTree(resultData);
    this.fsCallTreeTbl!.recycleDataSource = this.fsCallTreeDataSource;
  }

  sortTree(arr: Array<unknown>): Array<unknown> {
    let fsCallTreeSortArr = arr.sort((fsCallTreeA, fsCallTreeB) => {
      if (this.fsCallTreeSortKey === 'self') {
        if (this.fsCallTreeSortType === 0) {
          // @ts-ignore
          return fsCallTreeB.dur - fsCallTreeA.dur;
        } else if (this.fsCallTreeSortType === 1) {
          // @ts-ignore
          return fsCallTreeA.selfDur - fsCallTreeB.selfDur;
        } else {
          // @ts-ignore
          return fsCallTreeB.selfDur - fsCallTreeA.selfDur;
        }
      } else {
        if (this.fsCallTreeSortType === 0) {
          // @ts-ignore
          return fsCallTreeB.dur - fsCallTreeA.dur;
        } else if (this.fsCallTreeSortType === 1) {
          // @ts-ignore
          return fsCallTreeA.dur - fsCallTreeB.dur;
        } else {
          // @ts-ignore
          return fsCallTreeB.dur - fsCallTreeA.dur;
        }
      }
    });
    fsCallTreeSortArr.map((call): void => {
      // @ts-ignore
      call.children = this.sortTree(call.children);
    });
    return fsCallTreeSortArr;
  }

  getDataByWorker(args: unknown[], handler: Function): void {
    this.loadingList.push(1);
    this.fsCallTreeProgressEL!.loading = true; // @ts-ignore
    this.loadingPage.style.visibility = 'visible';
    procedurePool.submitWithName(
      'logic0',
      'fileSystem-action',
      { args, callType: 'fileSystem' },
      undefined,
      (fsCallTreeResults: unknown): void => {
        handler(fsCallTreeResults);
        this.loadingList.splice(0, 1);
        if (this.loadingList.length === 0) {
          this.fsCallTreeProgressEL!.loading = false; // @ts-ignore
          this.loadingPage.style.visibility = 'hidden';
        }
      }
    );
  }

  initHtml(): string {
    return TabPaneFileSystemCalltreeHtml;
  }
}
