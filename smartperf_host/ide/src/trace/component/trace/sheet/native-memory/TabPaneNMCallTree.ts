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
import { FileMerageBean } from '../../../../database/logic-worker/ProcedureLogicWorkerFileSystem';
import { ParseExpression } from '../SheetUtils';
import { FilterByAnalysis, NativeMemoryExpression } from '../../../../bean/NativeHook';
import { SpSystemTrace } from '../../../SpSystemTrace';
import '../../../../../base-ui/headline/lit-headline';
import { LitHeadLine } from '../../../../../base-ui/headline/lit-headline';
import { TabPaneNMCallTreeHtml } from './TabPaneNMCallTree.html';
import { queryNativeHookStatisticSubType, queryNativeHookSubType } from '../../../../database/sql/NativeHook.sql';

const InvertOpyionIndex: number = 0;
const HideSystemSoOptionIndex: number = 1;
const HideThreadOptionIndex: number = 3;

@element('tabpane-nm-calltree')
export class TabpaneNMCalltree extends BaseElement {
  private nmCallTreeTbl: LitTable | null | undefined;
  private filesystemTbr: LitTable | null | undefined;
  private nmCallTreeProgressEL: LitProgressBar | null | undefined;
  private nmCallTreeFilter: TabPaneFilter | null | undefined;
  private nmCallTreeSource: unknown[] = [];
  private nativeType: Array<string> = ['All Heap & Anonymous VM', 'All Heap', 'All Anonymous VM'];
  private sortKey: string = 'heapSizeStr';
  private sortType: number = 0;
  private currentSelectedData: unknown = undefined;
  private nmCallTreeFrameChart: FrameChart | null | undefined;
  private isChartShow: boolean = false;
  private systmeRuleName: string = '/system/';
  private numRuleName: string = '/max/min/';
  private needShowMenu: boolean = true;
  private searchValue: string = '';
  private loadingList: number[] = [];
  private nmCallTreeLoadingPage: unknown;
  private currentSelection: SelectionParam | undefined;
  private filterAllocationType: string = '0';
  private filterNativeType: string = '0';
  private filterResponseType: number = -1;
  private filterResponseSelect: string = '0';
  private responseTypes: unknown[] = [];
  private subTypeArr: number[] = [];
  private lastIsExpression = false;
  private currentNMCallTreeFilter: TabPaneFilter | undefined | null;
  private expressionStruct: NativeMemoryExpression | null = null;
  private isHideThread: boolean = false;
  private currentSelectIPid = 1;
  private headLine: LitHeadLine | null | undefined;
  private _filterData: FilterByAnalysis | undefined;
  private _analysisTabWidth: number = 0;
  private _initFromAnalysis = false;

  set analysisTabWidth(width: number) {
    this._analysisTabWidth = width;
  }

  set titleTxt(value: string) {
    this.headLine!.titleTxt = value;
  }

  set filterData(data: FilterByAnalysis) {
    // click from analysis
    this._filterData = data;
  }

  set titleBoxShow(value: Boolean) {
    this.headLine!.isShow = value;
  }

  set initFromAnalysis(flag: boolean) {
    this._initFromAnalysis = flag;
  }

  set data(nmCallTreeParam: SelectionParam) {
    const isShow = nmCallTreeParam.nativeMemory.length > 0;
    this.nmCallTreeFrameChart!.dispatchEvent(
      new CustomEvent('show-calibration', {
        detail: {
          isShow: isShow
        },
        bubbles: false
      })
    );
    if (nmCallTreeParam === this.currentSelection) {
      return;
    }
    // 火焰图数据
    this.nmCallTreeSource = [];
    // 框选内容赋值
    this.currentSelection = nmCallTreeParam;
    // 拿到框选的pid
    this.currentSelectIPid = nmCallTreeParam.nativeMemoryCurrentIPid;
    this.init(nmCallTreeParam);
  }

  private async init(nmCallTreeParam: SelectionParam): Promise<void> {
    // 初始化样式
    this.initUI();
    // 初始化选择框内容
    await this.initFilterTypes();
    let types: Array<string | number> = [];
    this.initTypes(nmCallTreeParam, types);
    const initWidth = this._analysisTabWidth > 0 ? this._analysisTabWidth : this.clientWidth;
    // 获取tab页数据
    this.getDataByWorkerQuery(
      {
        leftNs: nmCallTreeParam.leftNs,
        rightNs: nmCallTreeParam.rightNs,
        // ['AllocEvent','MmapEvent']
        types,
      },
      (results: unknown[]): void => {
        this.setLTableData(results);
        this.filesystemTbr!.recycleDataSource = [];

        this.nmCallTreeFrameChart?.updateCanvas(true, initWidth);
        if (this._initFromAnalysis) {
          this.filterByAnalysis();
        } else {
          // @ts-ignore
          this.nmCallTreeFrameChart!.data = this.nmCallTreeSource;
          this.switchFlameChart();
          this.nmCallTreeFilter!.icon = 'block';
        }
      }
    );
  }

  initUI(): void {
    this.headLine!.clear();
    this.isHideThread = false;
    this.searchValue = '';
    this.nmCallTreeTbl!.style.visibility = 'visible';
    if (this.parentElement!.clientHeight > this.nmCallTreeFilter!.clientHeight) {
      this.nmCallTreeFilter!.style.display = 'flex';
    } else {
      this.nmCallTreeFilter!.style.display = 'none';
    }
    procedurePool.submitWithName('logic0', 'native-memory-reset', [], undefined, () => { });
    this.nmCallTreeFilter!.disabledTransfer(true);
    this.nmCallTreeFilter!.initializeFilterTree(true, true, this.currentSelection!.nativeMemory.length > 0);
    this.nmCallTreeFilter!.filterValue = '';

    this.nmCallTreeProgressEL!.loading = true; // @ts-ignore
    this.nmCallTreeLoadingPage.style.visibility = 'visible';
  }

  initTypes(nmCallTreeParam: SelectionParam, types: Array<string | number>): void {
    if (nmCallTreeParam.nativeMemory.length > 0) {
      this.nmCallTreeFilter!.isStatisticsMemory = false;
      if (nmCallTreeParam.nativeMemory.indexOf(this.nativeType[0]) !== -1) {
        types.push("'AllocEvent'");
        types.push("'MmapEvent'");
      } else {
        if (nmCallTreeParam.nativeMemory.indexOf(this.nativeType[1]) !== -1) {
          types.push("'AllocEvent'");
        }
        if (nmCallTreeParam.nativeMemory.indexOf(this.nativeType[2]) !== -1) {
          types.push("'MmapEvent'");
        }
      }
    } else {
      this.nmCallTreeFilter!.isStatisticsMemory = true;
      if (nmCallTreeParam.nativeMemoryStatistic.indexOf(this.nativeType[0]) !== -1) {
        types.push(0);
      } else {
        if (nmCallTreeParam.nativeMemoryStatistic.indexOf(this.nativeType[1]) !== -1) {
          types.push(1);
        }
        if (nmCallTreeParam.nativeMemoryStatistic.indexOf(this.nativeType[2]) !== -1) {
          types.push(2);
        }
      }
    }
  }

  setFilterType(selections: Array<unknown>, data: FilterByAnalysis): void {
    if (data.type === 'AllocEvent') {
      data.type = '1';
    }
    if (this.subTypeArr.length > 0) {
      this.subTypeArr.map((memory): void => {
        selections.push({
          memoryTap: memory,
        });
        if (this.currentSelection?.nativeMemory && this.currentSelection.nativeMemory.length > 0) {
          const typeName = SpSystemTrace.DATA_DICT.get(memory);
          if ((data.type === 'MmapEvent' && memory === -1) || data.type === typeName) {
            data.type = `${selections.length + 2}`;
          }
        } else {
          if (
            (data.type === 'MmapEvent' && memory === 1) ||
            (data.type === 'FILE_PAGE_MSG' && memory === 2) ||
            (data.type === 'MEMORY_USING_MSG' && memory === 3)
          ) {
            data.type = `${selections.length + 2}`;
          }
        }
      });
    }
  }

  filterByAnalysis(): void {
    let filterContent: unknown[] = [];
    let param = new Map<string, unknown>();
    let selections: Array<unknown> = [];
    this.setFilterType(selections, this._filterData!);
    param.set('filterByTitleArr', this._filterData);
    param.set('filterAllocType', '0');
    param.set('statisticsSelection', selections);
    param.set('leftNs', this.currentSelection?.leftNs);
    param.set('rightNs', this.currentSelection?.rightNs);
    filterContent.push(
      {
        funcName: 'groupCallchainSample',
        funcArgs: [param],
      },
      {
        funcName: 'getCallChainsBySampleIds',
        funcArgs: [true],
      }
    );
    this.getDataByWorker(filterContent, (result: unknown[]) => {
      this.setLTableData(result); // @ts-ignore
      this.nmCallTreeFrameChart!.data = this.nmCallTreeSource;
      this.switchFlameChart();
      this.nmCallTreeFilter!.icon = 'block';
      this.initFromAnalysis = false;
    });
    this.banTypeAndLidSelect();
  }

  banTypeAndLidSelect(): void {
    this.currentNMCallTreeFilter!.firstSelect = '0';
    let secondSelect = this.shadowRoot
      ?.querySelector('#nm-call-tree-filter')!
      .shadowRoot!.querySelector('#second-select');
    let thirdSelect = this.shadowRoot
      ?.querySelector('#nm-call-tree-filter')!
      .shadowRoot!.querySelector('#third-select');
    thirdSelect?.setAttribute('disabled', '');
    secondSelect?.setAttribute('disabled', '');
  }

  getParentTree(
    nmCallTreeSrc: Array<FileMerageBean>,
    nmCallTreeTarget: FileMerageBean,
    parents: Array<FileMerageBean>
  ): boolean {
    for (let nmCallTreeBean of nmCallTreeSrc) {
      if (nmCallTreeBean.id === nmCallTreeTarget.id) {
        parents.push(nmCallTreeBean);
        return true;
      } else {
        if (this.getParentTree(nmCallTreeBean.children as Array<FileMerageBean>, nmCallTreeTarget, parents)) {
          parents.push(nmCallTreeBean);
          return true;
        }
      }
    }
    return false;
  }

  getChildTree(nmCallTreeSrc: Array<FileMerageBean>, id: string, children: Array<FileMerageBean>): boolean {
    for (let nmCallTreeBean of nmCallTreeSrc) {
      if (nmCallTreeBean.id === id && nmCallTreeBean.children.length === 0) {
        children.push(nmCallTreeBean);
        return true;
      } else {
        if (this.getChildTree(nmCallTreeBean.children as Array<FileMerageBean>, id, children)) {
          children.push(nmCallTreeBean);
          return true;
        }
      }
    }
    return false;
  }

  setRightTableData(fileMerageBean: FileMerageBean): void {
    let parents: Array<FileMerageBean> = [];
    let children: Array<FileMerageBean> = []; // @ts-ignore
    this.getParentTree(this.nmCallTreeSource, fileMerageBean, parents);
    let maxId = fileMerageBean.id;
    let maxDur = 0;

    function findMaxStack(merageBean: unknown): void {
      // @ts-ignore
      if (merageBean.children.length === 0) {
        // @ts-ignore
        if (merageBean.heapSize > maxDur) {
          // @ts-ignore
          maxDur = merageBean.heapSize; // @ts-ignore
          maxId = merageBean.id;
        }
      } else {
        // @ts-ignore
        merageBean.children.map((callChild: unknown): void => {
          findMaxStack(<FileMerageBean>callChild);
        });
      }
    }

    findMaxStack(fileMerageBean);
    this.getChildTree(fileMerageBean.children as Array<FileMerageBean>, maxId, children);
    let resultValue = parents.reverse().concat(children.reverse());
    for (let data of resultValue) {
      data.type = data.lib.endsWith('.so.1') || data.lib.endsWith('.dll') || data.lib.endsWith('.so') ? 0 : 1;
    }
    let resultLength = resultValue.length;
    this.filesystemTbr!.dataSource = resultLength === 0 ? [] : resultValue;
  }

  //底部的筛选菜单
  showBottomMenu(isShow: boolean): void {
    if (isShow) {
      this.nmCallTreeFilter?.showThird(true);
      this.nmCallTreeFilter?.setAttribute('first', '');
      this.nmCallTreeFilter?.setAttribute('second', '');
      this.nmCallTreeFilter?.setAttribute('tree', '');
      this.nmCallTreeFilter?.setAttribute('input', '');
      this.nmCallTreeFilter?.setAttribute('inputLeftText', '');
    } else {
      this.nmCallTreeFilter?.showThird(false);
      this.nmCallTreeFilter?.removeAttribute('first');
      this.nmCallTreeFilter?.removeAttribute('second');
      this.nmCallTreeFilter?.removeAttribute('tree');
      this.nmCallTreeFilter?.removeAttribute('input');
      this.nmCallTreeFilter?.removeAttribute('inputLeftText');
    }
  }

  async initFilterTypes(): Promise<void> {
    this.currentNMCallTreeFilter = this.shadowRoot?.querySelector<TabPaneFilter>('#nm-call-tree-filter');
    let secondFilterList = ['All Heap & Anonymous VM', 'AllocEvent', 'All Anonymous VM'];
    const addSubType = (subTypeList: unknown): void => {
      if (!subTypeList) {
        return;
      }
      this.subTypeArr = []; // @ts-ignore
      for (let data of subTypeList) {
        secondFilterList.push(data.subType);
        this.subTypeArr.push(data.subTypeId);
      }
    };
    if (this.currentSelection!.nativeMemory!.length > 0) {
      let subTypeList = await queryNativeHookSubType(
        this.currentSelection!.leftNs,
        this.currentSelection!.rightNs,
        this.currentSelectIPid
      );
      addSubType(subTypeList);
    } else {
      let subTypeList = await queryNativeHookStatisticSubType(
        this.currentSelection!.leftNs,
        this.currentSelection!.rightNs,
        this.currentSelectIPid
      );
      addSubType(subTypeList);
    }
    this.nMCallTreeFilterExtend(secondFilterList);
  }

  private nMCallTreeFilterExtend(secondFilterList: string[]): void {
    procedurePool.submitWithName('logic0', 'native-memory-get-responseType', {}, undefined, (res: unknown) => {
      // @ts-ignore
      this.responseTypes = res;
      let nullIndex = this.responseTypes.findIndex((item) => {
        // @ts-ignore
        return item.key === 0;
      });
      if (nullIndex !== -1) {
        this.responseTypes.splice(nullIndex, 1);
      }
      this.currentNMCallTreeFilter!.setSelectList(
        null,
        secondFilterList,
        'Allocation Lifespan',
        'Allocation Type',
        this.responseTypes.map((item: unknown) => {
          // @ts-ignore
          return item.value;
        })
      );
      this.currentNMCallTreeFilter!.setFilterModuleSelect('#first-select', 'width', '150px');
      this.currentNMCallTreeFilter!.setFilterModuleSelect('#second-select', 'width', '150px');
      this.currentNMCallTreeFilter!.setFilterModuleSelect('#third-select', 'width', '150px');
      this.currentNMCallTreeFilter!.firstSelect = '0';
      this.currentNMCallTreeFilter!.secondSelect = '0';
      this.currentNMCallTreeFilter!.thirdSelect = '0';
      this.filterAllocationType = '0';
      this.filterNativeType = '0';
      this.filterResponseSelect = '0';
      this.filterResponseType = -1;
    });
  }

  initElements(): void {
    this.headLine = this.shadowRoot?.querySelector<LitHeadLine>('.titleBox');
    this.nmCallTreeTbl = this.shadowRoot?.querySelector<LitTable>('#tb-filesystem-calltree');
    this.nmCallTreeProgressEL = this.shadowRoot?.querySelector('.nm-call-tree-progress') as LitProgressBar;
    this.nmCallTreeFrameChart = this.shadowRoot?.querySelector<FrameChart>('#framechart');
    this.nmCallTreeFrameChart!.mode = ChartMode.Byte;
    this.nmCallTreeLoadingPage = this.shadowRoot?.querySelector('.nm-call-tree-loading');
    this.nmCallTreeFrameChart!.addChartClickListener((needShowMenu: boolean): void => {
      this.parentElement!.scrollTo(0, 0);
      this.showBottomMenu(needShowMenu);
      this.needShowMenu = needShowMenu;
    });
    this.nmCallTreeTbl!.rememberScrollTop = true;
    this.nmCallTreeTbl!.exportTextHandleMap.set('heapSizeStr', (value) => {
      // @ts-ignore
      return `${value.size}`;
    });
    this.nmCallTreeFilter = this.shadowRoot?.querySelector<TabPaneFilter>('#nm-call-tree-filter');
    this.filesystemTbr = this.shadowRoot?.querySelector<LitTable>('#tb-filesystem-list');
    let filterFunc = (nmCallTreeFuncData: unknown): void => {
      let nmCallTreeFuncArgs: unknown[] = []; // @ts-ignore
      if (nmCallTreeFuncData.type === 'check') {
        nmCallTreeFuncArgs = this.filterFuncByCheckType(nmCallTreeFuncData, nmCallTreeFuncArgs); // @ts-ignore
      } else if (nmCallTreeFuncData.type === 'select') {
        nmCallTreeFuncArgs = this.filterFuncBySelectType(nmCallTreeFuncData, nmCallTreeFuncArgs); // @ts-ignore
      } else if (nmCallTreeFuncData.type === 'button') {
        nmCallTreeFuncArgs = this.filterFuncByButtonType(nmCallTreeFuncData, nmCallTreeFuncArgs);
      }
      this.getDataByWorker(nmCallTreeFuncArgs, (result: unknown[]): void => {
        this.setLTableData(result); // @ts-ignore
        this.nmCallTreeFrameChart!.data = this.nmCallTreeSource;
        if (this.isChartShow) {
          this.nmCallTreeFrameChart?.calculateChartData();
        }
        this.nmCallTreeTbl!.move1px();
        if (this.currentSelectedData) {
          // @ts-ignore
          this.currentSelectedData.isSelected = false;
          this.nmCallTreeTbl?.clearAllSelection(this.currentSelectedData);
          this.filesystemTbr!.recycleDataSource = [];
          this.currentSelectedData = undefined;
        }
      });
    };
    this.nmCallTreeFilter!.getDataLibrary(filterFunc.bind(this));
    this.nmCallTreeFilter!.getDataMining(filterFunc.bind(this));
    this.nmCallTreeFilter!.getCallTreeData(this.getCallTreeByNMCallTreeFilter.bind(this));
    this.nmCallTreeFilter!.getCallTreeConstraintsData(this.getCallTreeConByNMCallTreeFilter.bind(this));
    this.nmCallTreeFilter!.getFilterData(this.getFilterDataByNMCallTreeFilter.bind(this));
    this.initCloseCallBackByHeadLine();
  }

  private getFilterDataByNMCallTreeFilter(nmCallTreeData: FilterData): void {
    if (
      (this.isChartShow && nmCallTreeData.icon === 'tree') ||
      (!this.isChartShow && nmCallTreeData.icon === 'block')
    ) {
      this.switchFlameChart(nmCallTreeData);
    } else {
      this.initGetFilterByNMCallTreeFilter(nmCallTreeData);
    }
  }

  private getCallTreeConByNMCallTreeFilter(nmCallTreeConstraintsData: unknown): void {
    let nmCallTreeConstraintsArgs: unknown[] = [
      {
        funcName: 'resotreAllNode',
        funcArgs: [[this.numRuleName]],
      },
      {
        funcName: 'clearSplitMapData',
        funcArgs: [this.numRuleName],
      },
    ]; // @ts-ignore
    if (nmCallTreeConstraintsData.checked) {
      nmCallTreeConstraintsArgs.push({
        funcName: 'hideNumMaxAndMin',
        // @ts-ignore
        funcArgs: [parseInt(nmCallTreeConstraintsData.min), nmCallTreeConstraintsData.max],
      });
    }
    nmCallTreeConstraintsArgs.push({
      funcName: 'resetAllNode',
      funcArgs: [],
    });
    this.getDataByWorker(nmCallTreeConstraintsArgs, (result: unknown[]): void => {
      this.setLTableData(result); // @ts-ignore
      this.nmCallTreeFrameChart!.data = this.nmCallTreeSource;
      if (this.isChartShow) {
        this.nmCallTreeFrameChart?.calculateChartData();
      }
    });
  }

  private getCallTreeByNMCallTreeFilter(callTreeData: unknown): void {
    // @ts-ignore
    if ([InvertOpyionIndex, HideSystemSoOptionIndex, HideThreadOptionIndex].includes(callTreeData.value)) {
      this.refreshAllNode({
        ...this.nmCallTreeFilter!.getFilterTreeData(),
        // @ts-ignore
        callTree: callTreeData.checks,
      });
    } else {
      let resultArgs: unknown[] = [];
      // @ts-ignore
      if (callTreeData.checks[1]) {
        resultArgs.push({
          funcName: 'hideSystemLibrary',
          funcArgs: [],
        });
        resultArgs.push({
          funcName: 'resetAllNode',
          funcArgs: [],
        });
      } else {
        resultArgs.push({
          funcName: 'resotreAllNode',
          funcArgs: [[this.systmeRuleName]],
        });
        resultArgs.push({
          funcName: 'resetAllNode',
          funcArgs: [],
        });
        resultArgs.push({
          funcName: 'clearSplitMapData',
          funcArgs: [this.systmeRuleName],
        });
      }
      this.getDataByWorker(resultArgs, (result: unknown[]): void => {
        this.setLTableData(result); // @ts-ignore
        this.nmCallTreeFrameChart!.data = this.nmCallTreeSource;
        if (this.isChartShow) {
          this.nmCallTreeFrameChart?.calculateChartData();
        }
      });
    }
  }

  private filterFuncByButtonType(nmCallTreeFuncData: unknown, nmCallTreeFuncArgs: unknown[]): unknown[] {
    // @ts-ignore
    if (nmCallTreeFuncData.item === 'symbol') {
      // @ts-ignore
      if (this.currentSelectedData && !this.currentSelectedData.canCharge) {
        return nmCallTreeFuncArgs;
      }
      if (this.currentSelectedData !== undefined) {
        // @ts-ignore
        this.nmCallTreeFilter!.addDataMining({ name: this.currentSelectedData.symbol }, nmCallTreeFuncData.item);
        nmCallTreeFuncArgs.push({
          funcName: 'splitTree',
          // @ts-ignore
          funcArgs: [this.currentSelectedData.symbol, false, true],
        });
      } else {
        return nmCallTreeFuncArgs;
      } // @ts-ignore
    } else if (nmCallTreeFuncData.item === 'library') {
      // @ts-ignore
      if (this.currentSelectedData && !this.currentSelectedData.canCharge) {
        return nmCallTreeFuncArgs;
      } // @ts-ignore
      if (this.currentSelectedData !== undefined && this.currentSelectedData.libName !== '') {
        // @ts-ignore
        this.nmCallTreeFilter!.addDataMining({ name: this.currentSelectedData.libName }, nmCallTreeFuncData.item);
        nmCallTreeFuncArgs.push({
          funcName: 'splitTree',
          // @ts-ignore
          funcArgs: [this.currentSelectedData.libName, false, false],
        });
      } else {
        return nmCallTreeFuncArgs;
      } // @ts-ignore
    } else if (nmCallTreeFuncData.item === 'restore') {
      // @ts-ignore
      if (nmCallTreeFuncData.remove !== undefined && nmCallTreeFuncData.remove.length > 0) {
        // @ts-ignore
        let list = nmCallTreeFuncData.remove.map((item: unknown): unknown => {
          // @ts-ignore
          return item.name;
        });
        nmCallTreeFuncArgs.push({ funcName: 'resotreAllNode', funcArgs: [list] });
        nmCallTreeFuncArgs.push({ funcName: 'resetAllNode', funcArgs: [] });
        list.forEach((symbol: string): void => {
          nmCallTreeFuncArgs.push({ funcName: 'clearSplitMapData', funcArgs: [symbol] });
        });
      }
    }
    return nmCallTreeFuncArgs;
  }

  private filterFuncBySelectType(nmCallTreeFuncData: unknown, nmCallTreeFuncArgs: unknown[]): unknown[] {
    nmCallTreeFuncArgs.push({
      funcName: 'resotreAllNode',
      // @ts-ignore
      funcArgs: [[nmCallTreeFuncData.item.name]],
    });
    nmCallTreeFuncArgs.push({
      funcName: 'clearSplitMapData',
      // @ts-ignore
      funcArgs: [nmCallTreeFuncData.item.name],
    });
    nmCallTreeFuncArgs.push({
      funcName: 'splitTree',
      funcArgs: [
        // @ts-ignore
        nmCallTreeFuncData.item.name, // @ts-ignore
        nmCallTreeFuncData.item.select === '0', // @ts-ignore
        nmCallTreeFuncData.item.type === 'symbol',
      ],
    });
    return nmCallTreeFuncArgs;
  }

  private filterFuncByCheckType(nmCallTreeFuncData: unknown, nmCallTreeFuncArgs: unknown[]): unknown[] {
    // @ts-ignore
    if (nmCallTreeFuncData.item.checked) {
      nmCallTreeFuncArgs.push({
        funcName: 'splitTree',
        funcArgs: [
          // @ts-ignore
          nmCallTreeFuncData.item.name, // @ts-ignore
          nmCallTreeFuncData.item.select === '0', // @ts-ignore
          nmCallTreeFuncData.item.type === 'symbol',
        ],
      });
    } else {
      nmCallTreeFuncArgs.push({
        funcName: 'resotreAllNode', // @ts-ignore
        funcArgs: [[nmCallTreeFuncData.item.name]],
      });
      nmCallTreeFuncArgs.push({
        funcName: 'resetAllNode',
        funcArgs: [],
      });
      nmCallTreeFuncArgs.push({
        funcName: 'clearSplitMapData', // @ts-ignore
        funcArgs: [nmCallTreeFuncData.item.name],
      });
    }
    return nmCallTreeFuncArgs;
  }

  private initGetFilterByNMCallTreeFilter(nmCallTreeData: FilterData): void {
    if (
      this.filterAllocationType !== nmCallTreeData.firstSelect ||
      this.filterNativeType !== nmCallTreeData.secondSelect ||
      this.filterResponseSelect !== nmCallTreeData.thirdSelect
    ) {
      this.filterAllocationType = nmCallTreeData.firstSelect || '0';
      this.filterNativeType = nmCallTreeData.secondSelect || '0';
      this.filterResponseSelect = nmCallTreeData.thirdSelect || '0';
      let thirdIndex = parseInt(nmCallTreeData.thirdSelect || '0');
      if (this.responseTypes.length > thirdIndex) {
        // @ts-ignore
        this.filterResponseType = this.responseTypes[thirdIndex].key || -1;
      }
      this.searchValue = this.nmCallTreeFilter!.filterValue;
      this.expressionStruct = new ParseExpression(this.searchValue).parse();
      this.refreshAllNode(this.nmCallTreeFilter!.getFilterTreeData());
    } else if (this.searchValue !== this.nmCallTreeFilter!.filterValue) {
      this.searchValue = this.nmCallTreeFilter!.filterValue;
      this.expressionStruct = new ParseExpression(this.searchValue).parse();
      let nmArgs = [];
      if (this.expressionStruct) {
        this.refreshAllNode(this.nmCallTreeFilter!.getFilterTreeData());
        this.lastIsExpression = true;
        return;
      } else {
        if (this.lastIsExpression) {
          this.refreshAllNode(this.nmCallTreeFilter!.getFilterTreeData());
          this.lastIsExpression = false;
          return;
        }
        nmArgs.push({ funcName: 'setSearchValue', funcArgs: [this.searchValue] });
        nmArgs.push({ funcName: 'resetAllNode', funcArgs: [] });
        this.lastIsExpression = false;
      }
      this.getDataByWorker(nmArgs, (result: unknown[]): void => {
        this.nmCallTreeTbl!.isSearch = true;
        this.nmCallTreeTbl!.setStatus(result, true);
        this.setLTableData(result); // @ts-ignore
        this.nmCallTreeFrameChart!.data = this.nmCallTreeSource;
        this.switchFlameChart(nmCallTreeData);
        result = [];
      });
    } else {
      this.nmCallTreeTbl!.setStatus(this.nmCallTreeSource, true);
      this.setLTableData(this.nmCallTreeSource);
      this.switchFlameChart(nmCallTreeData);
    }
  }

  private initCloseCallBackByHeadLine(): void {
    //点击之后删除掉筛选条件  将所有重置  将目前的title隐藏 高度恢复
    this.headLine!.closeCallback = (): void => {
      this.headLine!.clear();
      this.searchValue = '';
      this.currentNMCallTreeFilter!.filterValue = '';
      this._filterData = undefined;
      this.currentNMCallTreeFilter!.firstSelect = '0';
      this.currentNMCallTreeFilter!.secondSelect = '0';
      this.currentNMCallTreeFilter!.thirdSelect = '0';
      this.filterAllocationType = '0';
      this.refreshAllNode(this.nmCallTreeFilter!.getFilterTreeData(), true);
      this.initFilterTypes();
      this.nmCallTreeFrameChart?.resizeChange();
    };
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.nmCallTreeTbl!.addEventListener('row-click', this.nmCallTreeTblRowClickHandler);
    this.filesystemTbr!.addEventListener('row-click', this.filesystemTbrRowClickHandler);
    this.nmCallTreeTbl!.addEventListener('column-click', this.nmCallTreeTblColumnClickHandler);
    let filterHeight = 0;
    new ResizeObserver((entries: ResizeObserverEntry[]): void => {
      let nmCallTreeTabFilter = this.shadowRoot!.querySelector('#nm-call-tree-filter') as HTMLElement;
      if (nmCallTreeTabFilter.clientHeight > 0) {
        filterHeight = nmCallTreeTabFilter.clientHeight;
      }
      if (this.parentElement!.clientHeight > filterHeight) {
        nmCallTreeTabFilter.style.display = 'flex';
      } else {
        nmCallTreeTabFilter.style.display = 'none';
      }
      if (this.nmCallTreeTbl!.style.visibility === 'hidden') {
        nmCallTreeTabFilter.style.display = 'none';
      }
      if (this.parentElement?.clientHeight !== 0) {
        if (this.isChartShow) {
          this.nmCallTreeFrameChart?.updateCanvas(false, entries[0].contentRect.width);
          this.nmCallTreeFrameChart?.calculateChartData();
        }
        let headLineHeight = 0;
        if (this.headLine?.isShow) {
          headLineHeight = this.headLine!.clientHeight;
        }
        if (this.nmCallTreeTbl) {
          // @ts-ignore
          this.nmCallTreeTbl.shadowRoot.querySelector('.table').style.height = `${this.parentElement!.clientHeight - 10 - 35 - headLineHeight
            }px`;
        }
        this.nmCallTreeTbl?.reMeauseHeight();
        if (this.filesystemTbr) {
          // @ts-ignore
          this.filesystemTbr.shadowRoot.querySelector('.table').style.height = `${this.parentElement!.clientHeight - 45 - 21 - headLineHeight
            }px`;
        }
        this.filesystemTbr?.reMeauseHeight(); // @ts-ignore
        this.nmCallTreeLoadingPage.style.height = `${this.parentElement!.clientHeight - 24}px`;
      }
    }).observe(this.parentElement!);
    this.parentElement!.onscroll = (): void => {
      this.nmCallTreeFrameChart!.tabPaneScrollTop = this.parentElement!.scrollTop;
    };
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.nmCallTreeTbl!.removeEventListener('row-click', this.nmCallTreeTblRowClickHandler);
    this.filesystemTbr!.removeEventListener('row-click', this.filesystemTbrRowClickHandler);
    this.nmCallTreeTbl!.removeEventListener('column-click', this.nmCallTreeTblColumnClickHandler);
  }

  filesystemTbrRowClickHandler = (event: unknown): void => {
    // @ts-ignore
    let data = event.detail.data as FileMerageBean;
    this.nmCallTreeTbl?.clearAllSelection(data); // @ts-ignore
    (data as unknown).isSelected = true;
    this.nmCallTreeTbl!.scrollToData(data); // @ts-ignore
    if ((event.detail as unknown).callBack) {
      // @ts-ignore
      (event.detail as unknown).callBack(true);
    }
  };

  nmCallTreeTblColumnClickHandler = (event: unknown): void => {
    // @ts-ignore
    this.sortKey = event.detail.key; // @ts-ignore
    this.sortType = event.detail.sort;
    this.setLTableData(this.nmCallTreeSource, true); // @ts-ignore
    this.nmCallTreeFrameChart!.data = this.nmCallTreeSource;
  };

  nmCallTreeTblRowClickHandler = (event: unknown): void => {
    // @ts-ignore
    let nmCallTreeData = event.detail.data as FileMerageBean;
    this.setRightTableData(nmCallTreeData);
    nmCallTreeData.isSelected = true;
    this.currentSelectedData = nmCallTreeData;
    this.filesystemTbr?.clearAllSelection(nmCallTreeData);
    this.filesystemTbr?.setCurrentSelection(nmCallTreeData);
    // @ts-ignore
    if ((event.detail as unknown).callBack) {
      // @ts-ignore
      (event.detail as unknown).callBack(true);
    }
    document.dispatchEvent(
      new CustomEvent('number_calibration', {
        // @ts-ignore
        detail: { time: event.detail.tsArray, counts: event.detail.countArray },
      })
    );
  };

  private switchFlameChart(flameChartData?: unknown): void {
    // 树状图
    let nmCallTreePageTab = this.shadowRoot?.querySelector('#show_table');
    // 火焰图
    let nmCallTreePageChart = this.shadowRoot?.querySelector('#show_chart'); // @ts-ignore
    if (!flameChartData || flameChartData.icon === 'block') {
      nmCallTreePageChart?.setAttribute('class', 'show');
      nmCallTreePageTab?.setAttribute('class', '');
      this.isChartShow = true;
      this.nmCallTreeFilter!.disabledMining = true;
      this.showBottomMenu(this.needShowMenu);
      this.nmCallTreeFrameChart?.calculateChartData(); // @ts-ignore
    } else if (flameChartData.icon === 'tree') {
      nmCallTreePageChart?.setAttribute('class', '');
      nmCallTreePageTab?.setAttribute('class', 'show');
      this.showBottomMenu(true);
      this.isChartShow = false;
      this.nmCallTreeFilter!.disabledMining = false;
      this.nmCallTreeFrameChart!.clearCanvas();
      this.nmCallTreeTbl!.reMeauseHeight();
    }
  }

  private refreshAllNode(filterData: unknown, isAnalysisReset?: boolean): void {
    let nmCallTreeArgs: unknown[] = []; // @ts-ignore
    let isTopDown: boolean = !filterData.callTree[0]; // @ts-ignore
    let isHideSystemLibrary = filterData.callTree[1]; // @ts-ignore
    this.isHideThread = filterData.callTree[3]; // @ts-ignore
    let list = filterData.dataMining.concat(filterData.dataLibrary);
    let groupArgs = this.setGroupArgsByRefreshAllNode();
    if ((this.lastIsExpression && !this.expressionStruct) || isAnalysisReset) {
      nmCallTreeArgs.push({ funcName: 'setSearchValue', funcArgs: [this.searchValue] });
    }
    nmCallTreeArgs.push({ funcName: 'hideThread', funcArgs: [this.isHideThread] });
    nmCallTreeArgs.push(
      {
        funcName: 'groupCallchainSample',
        funcArgs: [groupArgs],
      },
      {
        funcName: 'getCallChainsBySampleIds',
        funcArgs: [isTopDown],
      }
    );
    this.filesystemTbr!.recycleDataSource = [];
    if (isHideSystemLibrary) {
      nmCallTreeArgs.push({
        funcName: 'hideSystemLibrary',
        funcArgs: [],
      });
    } // @ts-ignore
    if (filterData.callTreeConstraints.checked) {
      nmCallTreeArgs.push({
        funcName: 'hideNumMaxAndMin', // @ts-ignore
        funcArgs: [parseInt(filterData.callTreeConstraints.inputs[0]), filterData.callTreeConstraints.inputs[1]],
      });
    }
    nmCallTreeArgs.push({ funcName: 'splitAllProcess', funcArgs: [list] });
    nmCallTreeArgs.push({ funcName: 'resetAllNode', funcArgs: [] });
    this.getDataByWorker(nmCallTreeArgs, (result: unknown[]) => {
      this.setLTableData(result); // @ts-ignore
      this.nmCallTreeFrameChart!.data = this.nmCallTreeSource;
      if (this.isChartShow) {
        this.nmCallTreeFrameChart?.calculateChartData();
      }
    });
  }

  private setGroupArgsByRefreshAllNode(): Map<string, unknown> {
    let groupArgs = new Map<string, unknown>();
    groupArgs.set('filterAllocType', this.filterAllocationType);
    groupArgs.set('filterEventType', this.filterNativeType);
    if (this.expressionStruct) {
      groupArgs.set('filterExpression', this.expressionStruct);
      groupArgs.set('filterResponseType', -1);
      this.currentNMCallTreeFilter!.thirdSelect = '0';
    } else {
      groupArgs.set('filterResponseType', this.filterResponseType);
    }
    groupArgs.set('leftNs', this.currentSelection?.leftNs || 0);
    groupArgs.set('rightNs', this.currentSelection?.rightNs || 0);
    let selections: Array<unknown> = [];
    if (this.subTypeArr.length > 0) {
      this.subTypeArr.map((memory): void => {
        selections.push({
          memoryTap: memory,
        });
      });
    }
    groupArgs.set('statisticsSelection', selections);
    if (this._filterData) {
      groupArgs.set('filterByTitleArr', this._filterData);
    }
    groupArgs.set(
      'nativeHookType',
      this.currentSelection!.nativeMemory.length > 0 ? 'native-hook' : 'native-hook-statistic'
    );
    return groupArgs;
  }

  setLTableData(resultData: unknown[], sort?: boolean): void {
    if (sort) {
      this.nmCallTreeSource = this.sortTree(resultData);
    } else {
      if (resultData && resultData[0]) {
        this.nmCallTreeSource =
          this.currentSelection!.nativeMemory.length > 0 && !this.isHideThread
            ? this.sortTree(resultData) // @ts-ignore
            : this.sortTree(resultData[0].children || []);
      } else {
        this.nmCallTreeSource = [];
      }
    }
    this.nmCallTreeTbl!.recycleDataSource = this.nmCallTreeSource;
  }

  sortTree(arr: Array<unknown>): Array<unknown> {
    let nmCallTreeSortArr = arr.sort((callTreeLeftData, callTreeRightData): number => {
      if (this.sortKey === 'heapSizeStr' || this.sortKey === 'heapPercent') {
        if (this.sortType === 0) {
          // @ts-ignore
          return callTreeRightData.size - callTreeLeftData.size;
        } else if (this.sortType === 1) {
          // @ts-ignore
          return callTreeLeftData.size - callTreeRightData.size;
        } else {
          // @ts-ignore
          return callTreeRightData.size - callTreeLeftData.size;
        }
      } else {
        if (this.sortType === 0) {
          // @ts-ignore
          return callTreeRightData.count - callTreeLeftData.count;
        } else if (this.sortType === 1) {
          // @ts-ignore
          return callTreeLeftData.count - callTreeRightData.count;
        } else {
          // @ts-ignore
          return callTreeRightData.count - callTreeLeftData.count;
        }
      }
    });
    nmCallTreeSortArr.map((call): void => {
      // @ts-ignore
      call.children = this.sortTree(call.children);
    });
    return nmCallTreeSortArr;
  }

  getDataByWorker(args: unknown[], handler: Function): void {
    this.loadingList.push(1);
    this.nmCallTreeProgressEL!.loading = true; // @ts-ignore
    this.nmCallTreeLoadingPage.style.visibility = 'visible';
    procedurePool.submitWithName(
      'logic0',
      'native-memory-calltree-action',
      args,
      undefined,
      (callTreeActionResults: unknown): void => {
        handler(callTreeActionResults);
        this.loadingList.splice(0, 1);
        if (this.loadingList.length === 0) {
          this.nmCallTreeProgressEL!.loading = false; // @ts-ignore
          this.nmCallTreeLoadingPage.style.visibility = 'hidden';
        }
      }
    );
  }

  getDataByWorkerQuery(args: unknown, handler: Function): void {
    // 加载中样式设置
    this.loadingList.push(1);
    this.nmCallTreeProgressEL!.loading = true; // @ts-ignore
    this.nmCallTreeLoadingPage.style.visibility = 'visible';
    procedurePool.submitWithName(
      'logic0',
      this.currentSelection!.nativeMemory!.length > 0
        ? 'native-memory-queryCallchainsSamples'
        : 'native-memory-queryStatisticCallchainsSamples',
      args,
      undefined,
      (callChainsResults: unknown): void => {
        handler(callChainsResults);
        this.loadingList.splice(0, 1);
        if (this.loadingList.length === 0) {
          this.nmCallTreeProgressEL!.loading = false; // @ts-ignore
          this.nmCallTreeLoadingPage.style.visibility = 'hidden';
        }
      }
    );
  }

  initHtml(): string {
    return TabPaneNMCallTreeHtml;
  }
}
