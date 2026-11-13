/*
 * Copyright (C) 2025 Huawei Device Co., Ltd.
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

import { BaseElement, element } from "../../../../../base-ui/BaseElement";
import { LitChartPie } from "../../../../../base-ui/chart/pie/LitChartPie";
import { LitCheckBox } from "../../../../../base-ui/checkbox/LitCheckBox";
import { LitProgressBar } from "../../../../../base-ui/progress-bar/LitProgressBar";
import { LitTable } from "../../../../../base-ui/table/lit-table";
import { SelectionParam } from "../../../../bean/BoxSelection";
import { MemoryTraceRowType, MemoryType } from "../../../../bean/MemoryEnum";
import { FilterByAnalysis } from "../../../../bean/NativeHook";
import { InitAnalysis } from "../../../../database/logic-worker/ProcedureLogicWorkerCommon";
import { AnalysisUICallback, MemoryAnalysisDataLogic } from "../../base/MemoryAnalysisData";
import { initSort } from "../SheetUtils";
import { TabPaneFilter } from "../TabPaneFilter";
import { TabPaneOSAnalysisHtml } from "./TabPaneOSAnalysisHtml";
import { TabpaneOSCalltree } from "./TabpaneOSCalltree";
import { AnalysisObj } from "../../../../bean/MemoryAnalysisStruct";

@element('tabpane-other-source-analysis')
export class TabPaneOSAnalysis extends BaseElement implements AnalysisUICallback {

  private currentSelection: SelectionParam | undefined;
  private typeUsageTbl: LitTable | null | undefined; // 类型页
  private threadUsageTbl: LitTable | null | undefined; // 线程页
  private soUsageTbl: LitTable | null | undefined; // Lib页
  private functionUsageTbl: LitTable | null | undefined; // 函数页
  private osPieChart: LitChartPie | null | undefined; // 饼图
  private osBack: HTMLDivElement | null | undefined; // 返回按钮
  private osTableArray: NodeListOf<LitTable> | undefined | null; // [类型页,线程页,Lib页.函数页]
  private titleEl: HTMLDivElement | undefined | null; // 饼图左上角标题
  private tabName: HTMLDivElement | null | undefined; // 饼图上方标题
  private range: HTMLLabelElement | null | undefined; // 右上角时间范围
  private progressEL: LitProgressBar | null | undefined; // loading条
  private hideThreadCheckBox: LitCheckBox | undefined | null; // 隐藏线程选项
  private filterEl: TabPaneFilter | undefined | null; // 左下Options 选项
  private osTableBox: HTMLDivElement | undefined | null; // 父容器

  private osSortColumn: string = ''; // 右侧列表页排序列
  private osSortType: number = 0; // 列表页排序方式
  private isStatistic = false; // 是否统计模式
  private threadName: string = '';

  private currentLevel = -1; // 当前选中的层级，类型为0，线程为1。。。
  private type: string = ''; // 当前层级的EventType

  private typeStatisticsData!: AnalysisObj; // 点击的类型统计数据
  private threadStatisticsData!: AnalysisObj; // 点击的线程统计数据
  private libStatisticsData!: AnalysisObj; // 点击的Lib统计数据
  private functionStatisticsData!: AnalysisObj; // 点击的函数统计数据

  private currentLevelData!: Array<AnalysisObj>; // 当前层级所有数据
  private dataLogic?: MemoryAnalysisDataLogic;


  set data(analysisParam: SelectionParam) {
    this.isStatistic = analysisParam.otherSource.length === 0;
    if (!this.dataLogic) {
      this.dataLogic = new MemoryAnalysisDataLogic();
    }
    this.dataLogic.setUiInterface(this);
    this.dataLogic.init(MemoryTraceRowType.ROW_TYPE_OTHER_SOURCE, this.isStatistic);
    if (this.currentSelection === analysisParam) {
      this.hideThreadCheckBox!.checked = false;

      const eventTypeData = this.dataLogic.getEventTypeData();
      if (eventTypeData) {
        eventTypeData.unshift(this.typeStatisticsData);
        this.typeUsageTbl!.recycleDataSource = eventTypeData;
        eventTypeData.shift();
      }
      return;
    };
    this.dataLogic.setCurrentSelectIPid(analysisParam.otherSourceCurrentIPid);
    this.dataLogic.initResponseTypeList(analysisParam);

    this.resizeTable();
    this.reset(this.typeUsageTbl!, false);
    this.currentSelection = analysisParam;
    this.titleEl!.textContent = '';
    this.tabName!.textContent = '';
    this.range!.textContent = `Selected range: ${parseFloat(
      ((analysisParam.rightNs - analysisParam.leftNs) / 1000000.0).toFixed(5)
    )}  ms`;
    if (this.isStatistic) {
      this.threadName = '';
    }
    this.dataLogic.getEventTypeSize(analysisParam);
    this.showAssignLevel(this.typeUsageTbl!, this.functionUsageTbl!, 0, this.dataLogic.getEventTypeData());
  }

  initElements(): void {
    this.range = this.shadowRoot?.querySelector('#time-range');
    this.osPieChart = this.shadowRoot!.querySelector<LitChartPie>('#os-chart-pie');
    this.osTableBox = this.shadowRoot!.querySelector<HTMLDivElement>('.os-table-box');
    this.typeUsageTbl = this.shadowRoot!.querySelector<LitTable>('#tb-eventtype-usage');
    this.threadUsageTbl = this.shadowRoot!.querySelector<LitTable>('#tb-thread-usage');
    this.soUsageTbl = this.shadowRoot!.querySelector<LitTable>('#tb-so-usage');
    this.functionUsageTbl = this.shadowRoot!.querySelector<LitTable>('#tb-function-usage');
    this.osBack = this.shadowRoot!.querySelector<HTMLDivElement>('.os-go-back');
    this.getBack();
    this.titleEl = this.shadowRoot!.querySelector<HTMLDivElement>('.title');
    this.tabName = this.shadowRoot!.querySelector<HTMLDivElement>('.os-subheading');
    this.progressEL = this.shadowRoot?.querySelector('.os-progress') as LitProgressBar;
    this.filterEl = this.shadowRoot?.querySelector('#filter');
    this.filterEl!.setOptionsList(['Hide Thread']);
    let popover = this.filterEl!.shadowRoot!.querySelector('#check-popover');
    this.hideThreadCheckBox = popover!!.querySelector<LitCheckBox>('div > #hideThread');
    this.hideThreadCheckBox?.addEventListener('change', () => {
      this.reset(this.typeUsageTbl!, false);
      this.showAssignLevel(this.typeUsageTbl!, this.functionUsageTbl!, 0, this.dataLogic!.getEventTypeData());
      this.dataLogic!.getTypeSize();
    });
    this.initOSTableArray();
    this.initTable();
    this.functionUsageTbl?.addEventListener('row-click', (evt) => {
      // @ts-ignore
      let title = `${this.titleEl!.textContent}/${evt.detail.data.symbolName}`;
      this.clickRight(evt, title);
    });
    let exportHandlerMap = new Map<string, (value: unknown) => string>();
    exportHandlerMap.set('existSizeFormat', (value) => {
      // @ts-ignore
      return `${value.existSize}`;
    });
    exportHandlerMap.set('applySizeFormat', (value) => {
      // @ts-ignore
      return `${value.applySize}`;
    });
    exportHandlerMap.set('releaseSizeFormat', (value) => {
      // @ts-ignore
      return `${value.releaseSize}`;
    });
    this.typeUsageTbl!.exportTextHandleMap = exportHandlerMap;
    this.threadUsageTbl!.exportTextHandleMap = exportHandlerMap;
    this.soUsageTbl!.exportTextHandleMap = exportHandlerMap;
    this.functionUsageTbl!.exportTextHandleMap = exportHandlerMap;
  }

  private clickRight(evt: unknown, title: string): void {
    // @ts-ignore
    if (evt.detail.button === 2 && evt.detail.tableName && evt.detail.tableName !== '') {
      let treeTab = this.parentElement?.parentElement?.querySelector<TabpaneOSCalltree>(
        '#box-os-calltree > tabpane-os-calltree'
      );
      treeTab!.analysisTabWidth = this.clientWidth;
      // @ts-ignore
      const data = evt.detail.data as AnalysisObj;
      // Other情况
      let callTreeType = data.typeName
      if (data.typeName === MemoryType.FD_SIMPLE_NAME || data.typeName === MemoryType.THREAD_SIMPLE_NAME) {
        callTreeType = `Other ${data.typeName}`;
      } 
      treeTab!.filterData = new FilterByAnalysis(
        data.typeId,
        callTreeType,
        data.tName,
        data.tid,
        data.libId,
        data.libName,
        data.symbolId,
        data.symbolName
      );
      // 首次打开初始化数据 非首次初始化UI
      if (!InitAnalysis.getInstance().isInitOSAnalysis) {
        treeTab?.initUI(this.currentSelection!);
        treeTab?.filterByAnalysis();
      } else {
        treeTab!.initFromAnalysis = true;
        treeTab!.data = this.currentSelection!;
        InitAnalysis.getInstance().isInitOSAnalysis = false;
      }

      treeTab!.banTypeAndLidSelect();
      treeTab!.titleBoxShow = true;
      treeTab!.titleTxt = title;
    }
  }

  private getBack(): void {
    this.osBack!.addEventListener('click', () => {
      const eventTypeData = this.dataLogic!.getEventTypeData()
      if (this.tabName!.textContent === 'Statistic By Thread Existing') {
        this.showAssignLevel(this.typeUsageTbl!, this.threadUsageTbl!, 0, eventTypeData);
        this.osBack!.style.visibility = 'hidden';
        this.typePieChart(eventTypeData);
      } else if (this.tabName!.textContent === 'Statistic By Library Existing') {
        if (this.hideThreadCheckBox?.checked || this.isStatistic) {
          this.showAssignLevel(this.typeUsageTbl!, this.soUsageTbl!, 0, eventTypeData);
          this.osBack!.style.visibility = 'hidden';
          this.typePieChart(eventTypeData);
        } else {
          this.showAssignLevel(this.threadUsageTbl!, this.soUsageTbl!, 1, this.dataLogic!.getThreadData());
          this.threadPieChart(this.dataLogic!.getThreadData());
        }
      } else if (this.tabName!.textContent === 'Statistic By Function Existing') {
        this.showAssignLevel(this.soUsageTbl!, this.functionUsageTbl!, 2, this.dataLogic!.getLibData());
        this.libraryPieChart(this.dataLogic!.getLibData());
      }
    });
  }

  initTable(): void {
    this.typeUsageTbl!.addEventListener('row-click', (evt) => {
      // @ts-ignore
      let button = evt.detail.button;
      // @ts-ignore
      let data = evt.detail.data;
      if (button === 0) {
        if (data.tableName !== '' && data.existSize !== 0) {
          this.otherSourceProcessLevelClickEvent(data);
        }
      } else if (button === 2) {
        const typeName = data.typeName;
        this.clickRight(evt, typeName);
      }
    });
    this.soUsageTbl!.addEventListener('row-click', (evt) => {
      // @ts-ignore
      let button = evt.detail.button;
      // @ts-ignore
      let data = evt.detail.data;
      if (button === 0) {
        if (data.tableName !== '' && data.existSize !== 0) {
          this.otherSourceSoLevelClickEvent(data);
        }
      } else if (button === 2) {
        let title = `${this.titleEl!.textContent}/${data.libName}`;
        this.clickRight(evt, title);
      }
    });
  }

  initOSTableArray(): void {
    this.osTableArray = this.shadowRoot!.querySelectorAll('lit-table') as NodeListOf<LitTable>;
    for (let osTable of this.osTableArray) {
      osTable!.addEventListener('contextmenu', function (event) {
        event.preventDefault(); // 阻止默认的上下文菜单弹框
      });
      osTable!.addEventListener('column-click', (evt) => {
        // @ts-ignore
        this.osSortColumn = evt.detail.key;
        // @ts-ignore
        this.osSortType = evt.detail.sort;
        this.sortByColumn();
      });
      osTable!.addEventListener('row-hover', (evt) => {
        // @ts-ignore
        let detail = evt.detail;
        if (detail.data) {
          let data = detail.data;
          data.isHover = true;
          if (detail.callBack) {
            detail.callBack(true);
          }
        }
        this.osPieChart?.showHover();
        this.osPieChart?.hideTip();
      });
    }
    this.threadUsageTbl!.addEventListener('row-click', (evt) => {
      // @ts-ignore
      let button = evt.detail.button;
      // @ts-ignore
      let data = evt.detail.data;
      if (button === 0) {
        if (data.tableName !== '' && data.existSize !== 0) {
          this.osThreadLevelClickEvent(data);
        }
      } else if (button === 2) {
        let title = `${this.titleEl!.textContent}/${data.tName}`;
        this.clickRight(evt, title);
      }
    });
  }

  private osThreadLevelClickEvent(it: AnalysisObj): void {
    this.reset(this.soUsageTbl!, true);
    this.showAssignLevel(this.soUsageTbl!, this.threadUsageTbl!, 2, this.dataLogic!.getEventTypeData());
    this.dataLogic?.getLibSize(it)
    const typeName = this.type;

    let title = typeName;
    if (!this.hideThreadCheckBox?.checked) {
      this.threadName = `${it.tableName}`;
      title += ` / ${this.threadName}`;
    }
    this.titleEl!.textContent = title;
    this.osPieChart?.hideTip();
  }

  private sortByColumn(): void {
    let osCurrentTable = this.getOSCurrentTable();
    if (!osCurrentTable) {
      return;
    }
    if (this.osSortType === 0) {
      osCurrentTable!.recycleDataSource = this.getSortedColumnZeroArr(this.currentLevelData);
    } else {
      let sortColumnArr = [...this.currentLevelData];
      switch (this.osSortColumn) {
        case 'tableName':
          // @ts-ignore
          osCurrentTable!.recycleDataSource = sortColumnArr.sort(this.caseTableName);
          break;
        case 'existSizeFormat':
        case 'existSizePercent':
          osCurrentTable!.recycleDataSource = this.sortDataByExistSize(this.osSortType, sortColumnArr);
          break;
        case 'existCount':
        case 'existCountPercent':
          osCurrentTable!.recycleDataSource = this.sortDataByExistCount(this.osSortType, sortColumnArr);
          break;
        case 'releaseSizeFormat':
        case 'releaseSizePercent':
          osCurrentTable!.recycleDataSource = this.sortDataByReleaseSize(this.osSortType, sortColumnArr);
          break;
        case 'releaseCount':
        case 'releaseCountPercent':
          osCurrentTable!.recycleDataSource = this.sortDataByReleaseCount(this.osSortType, sortColumnArr);
          break;
        case 'applySizeFormat':
        case 'applySizePercent':
          osCurrentTable!.recycleDataSource = this.sortDataByApplySize(this.osSortType, sortColumnArr);
          break;
        case 'applyCount':
        case 'applyCountPercent':
          osCurrentTable!.recycleDataSource = this.sortDataByApplyCount(this.osSortType, sortColumnArr);
          break;
      }
      sortColumnArr = this.updateSortColumnArr(sortColumnArr);
      osCurrentTable!.recycleDataSource = sortColumnArr;
    }
  }

  private sortDataByExistSize(sortType: number, sortColumnArr: Array<AnalysisObj>): AnalysisObj[] {
    return sortColumnArr.sort((statisticAnalysisLeftData, statisticAnalysisRightData) => {
      return sortType === 1
        ? statisticAnalysisLeftData.existSize - statisticAnalysisRightData.existSize
        : statisticAnalysisRightData.existSize - statisticAnalysisLeftData.existSize;
    });
  }

  private sortDataByExistCount(sortType: number, sortColumnArr: Array<AnalysisObj>): AnalysisObj[] {
    return sortColumnArr.sort((statisticAnalysisLeftData, statisticAnalysisRightData) => {
      return sortType === 1
        ? statisticAnalysisLeftData.existCount - statisticAnalysisRightData.existCount
        : statisticAnalysisRightData.existCount - statisticAnalysisLeftData.existCount;
    });
  }

  private sortDataByReleaseSize(sortType: number, sortColumnArr: Array<AnalysisObj>): AnalysisObj[] {
    return sortColumnArr.sort((statisticAnalysisLeftData, statisticAnalysisRightData) => {
      return sortType === 1
        ? statisticAnalysisLeftData.releaseSize - statisticAnalysisRightData.releaseSize
        : statisticAnalysisRightData.releaseSize - statisticAnalysisLeftData.releaseSize;
    });
  }

  private sortDataByReleaseCount(sortType: number, sortColumnArr: Array<AnalysisObj>): AnalysisObj[] {
    return sortColumnArr.sort((statisticAnalysisLeftData, statisticAnalysisRightData) => {
      return sortType === 1
        ? statisticAnalysisLeftData.releaseCount - statisticAnalysisRightData.releaseCount
        : statisticAnalysisRightData.releaseCount - statisticAnalysisLeftData.releaseCount;
    });
  }

  private sortDataByApplySize(sortType: number, sortColumnArr: Array<AnalysisObj>): AnalysisObj[] {
    return sortColumnArr.sort((statisticAnalysisLeftData, statisticAnalysisRightData) => {
      return sortType === 1
        ? statisticAnalysisLeftData.applySize - statisticAnalysisRightData.applySize
        : statisticAnalysisRightData.applySize - statisticAnalysisLeftData.applySize;
    });
  }

  private sortDataByApplyCount(sortType: number, sortColumnArr: Array<AnalysisObj>): AnalysisObj[] {
    return sortColumnArr.sort((statisticAnalysisLeftData, statisticAnalysisRightData) => {
      return sortType === 1
        ? statisticAnalysisLeftData.applyCount - statisticAnalysisRightData.applyCount
        : statisticAnalysisRightData.applyCount - statisticAnalysisLeftData.applyCount;
    });
  }

  private updateSortColumnArr(sortColumnArr: AnalysisObj[]): AnalysisObj[] {
    switch (this.currentLevel) {
      case 0:
        sortColumnArr.unshift(this.typeStatisticsData);
        break;
      case 1:
        sortColumnArr.unshift(this.threadStatisticsData);
        break;
      case 2:
        sortColumnArr.unshift(this.libStatisticsData);
        break;
      case 3:
        sortColumnArr.unshift(this.functionStatisticsData);
        break;
    }
    return sortColumnArr;
  }

  private getSortedColumnZeroArr(data: AnalysisObj[]): AnalysisObj[] {
    let sortColumnZeroArr = [...data];
    switch (this.currentLevel) {
      case 0:
        sortColumnZeroArr.unshift(this.typeStatisticsData);
        break;
      case 1:
        sortColumnZeroArr.unshift(this.threadStatisticsData);
        break;
      case 2:
        sortColumnZeroArr.unshift(this.libStatisticsData);
        break;
      case 3:
        sortColumnZeroArr.unshift(this.functionStatisticsData);
        break;
    }
    return sortColumnZeroArr;
  }

  private getOSCurrentTable(): LitTable | null | undefined {
    let osCurrentTable: LitTable | null | undefined;
    switch (this.currentLevel) {
      case 0:
        osCurrentTable = this.typeUsageTbl;
        break;
      case 1:
        osCurrentTable = this.threadUsageTbl;
        break;
      case 2:
        osCurrentTable = this.soUsageTbl;
        break;
      case 3:
        osCurrentTable = this.functionUsageTbl;
        break;
    }
    return osCurrentTable;
  }


  loading(isLoading: boolean): void {
    this.progressEL!.loading = isLoading;
  }
  setTypeChartData(data: Array<AnalysisObj>, statisticData: AnalysisObj): void {
    this.currentLevel = 0;
    this.typeStatisticsData = statisticData;
    this.typePieChart(data);
  }
  setThreadChartData(data: Array<AnalysisObj>, statisticData: AnalysisObj): void {
    this.currentLevel = 1;
    this.threadStatisticsData = statisticData;
    this.threadPieChart(data);
  }
  setLibChartData(data: Array<AnalysisObj>, statisticData: AnalysisObj): void {
    this.currentLevel = 2;
    this.libStatisticsData = statisticData;
    this.libraryPieChart(data);

  }
  setFunctionChartData(data: Array<AnalysisObj>, statisticData: AnalysisObj): void {
    this.currentLevel = 3;
    this.functionStatisticsData = statisticData;
    this.functionPieChart(data)
  }
  private typePieChart(typeData: Array<AnalysisObj>): void {
    this.osPieChart!.config = {
      appendPadding: 0,
      data: this.dataLogic!.getPieChartData(typeData),
      angleField: 'existCount',
      colorField: 'tableName',
      radius: 1,
      label: {
        type: 'outer',
      },
      tip: (typeTipValue): string => {
        // @ts-ignore
        const obj = typeTipValue.obj as AnalysisObj;
        return `<div>   
                  <div>Memory Type:${obj.tableName}</div>
                  <div># Existing:${obj.existCount} (${obj.existCountPercent}%)</div>
                  <div># Total:${obj.applyCount} (${obj.applyCountPercent}%)</div>
                  <div># Transient:${obj.releaseCount} (${obj.releaseCountPercent}%)</div>
                </div>`;
      },
      angleClick: (it): void => {
        // @ts-ignore
        if (it.tableName !== 'other') {
          this.otherSourceProcessLevelClickEvent(it as AnalysisObj);
        }
      },
      hoverHandler: (osData): void => {
        if (osData) {
          this.typeUsageTbl!.setCurrentHover(osData);
        } else {
          this.typeUsageTbl!.mouseOut();
        }
      },
      interactions: [
        {
          type: 'element-active',
        },
      ],
    };

    this.titleEl!.textContent = '';
    this.tabName!.textContent = 'Statistic By Event Type Existing';
    typeData.unshift(this.typeStatisticsData);
    this.typeUsageTbl!.recycleDataSource = typeData;
    typeData.shift();
    this.typeUsageTbl?.reMeauseHeight();
    this.currentLevelData = typeData;
  }

  private threadPieChart(threadData: Array<AnalysisObj>): void {
    this.osPieChart!.config = {
      appendPadding: 0,
      data: this.dataLogic!.getPieChartData(threadData),
      angleField: 'existCount',
      colorField: 'tableName',
      radius: 1,
      label: {
        type: 'outer',
      },
      tip: (threadTipValue): string => {
        // @ts-ignore
        const obj = threadTipValue.obj as AnalysisObj;
        return `<div>
                    <div>Thread:${obj.tableName}</div>
                    <div># Existing:${obj.existCount} (${obj.existCountPercent}%)</div>
                    <div># Total:${obj.applyCount} (${obj.applyCountPercent}%)</div>
                    <div># Transient:${obj.releaseCount} (${obj.releaseCountPercent}%)</div>
                </div>`;
      },
      angleClick: (it): void => {
        // @ts-ignore
        if (it.tid !== 'other') {
          this.osThreadLevelClickEvent(it as AnalysisObj);
        }
      },
      hoverHandler: (data): void => {
        if (data) {
          this.threadUsageTbl!.setCurrentHover(data);
        } else {
          this.threadUsageTbl!.mouseOut();
        }
      },
      interactions: [
        {
          type: 'element-active',
        },
      ],
    };
    this.titleEl!.textContent = this.type + '';
    this.tabName!.textContent = 'Statistic By Thread Existing';
    threadData.unshift(this.threadStatisticsData);
    this.threadUsageTbl!.recycleDataSource = threadData;
    threadData.shift();
    this.currentLevelData = threadData;
    this.threadUsageTbl?.reMeauseHeight();
  }

  private libraryPieChart(soData: Array<AnalysisObj>): void {
    this.osPieChart!.config = {
      appendPadding: 0,
      data: this.dataLogic!.getPieChartData(soData),
      angleField: 'existCount',
      colorField: 'tableName',
      radius: 1,
      label: {
        type: 'outer',
      },
      tip: (libraryTipValue): string => {
        return this.getLibraryTipValue(libraryTipValue);
      },
      angleClick: (it): void => {
        // @ts-ignore
        if (it.tableName !== 'other') {
          this.otherSourceSoLevelClickEvent(it as AnalysisObj);
        }
      },
      hoverHandler: (data): void => {
        if (data) {
          this.soUsageTbl!.setCurrentHover(data);
        } else {
          this.soUsageTbl!.mouseOut();
        }
      },
      interactions: [
        {
          type: 'element-active',
        },
      ],
    };
    if (!this.hideThreadCheckBox?.checked && this.threadName.length > 0) {
      this.type += ' / ' + this.threadName;
    }
    this.titleEl!.textContent = this.type;
    this.tabName!.textContent = 'Statistic By Library Existing';
    soData.unshift(this.libStatisticsData);
    this.soUsageTbl!.recycleDataSource = soData;
    soData.shift();
    this.currentLevelData = soData;
    this.soUsageTbl?.reMeauseHeight();
  }

  private functionPieChart(functionData: Array<AnalysisObj>): void {
    this.osPieChart!.config = {
      appendPadding: 0,
      data: this.dataLogic!.getPieChartData(functionData),
      angleField: 'existCount',
      colorField: 'tableName',
      radius: 1,
      label: {
        type: 'outer',
      },
      tip: (functionTipValue): string => {
        // @ts-ignore
        const obj = functionTipValue.obj as AnalysisObj;
        return `<div>
                    <div>Function:${obj.symbolName}</div>
                    <div># Existing:${obj.existCount} 
                    (${obj.existCountPercent}%)</div>
                    <div># Total:${obj.applyCount} 
                    (${obj.applyCountPercent}%)</div>
                    <div># Transient:${obj.releaseCount} 
                    (${obj.releaseCountPercent}%)</div>
                </div>`;
      },
      hoverHandler: (data): void => {
        if (data) {
          this.functionUsageTbl!.setCurrentHover(data);
        } else {
          this.functionUsageTbl!.mouseOut();
        }
      },
      interactions: [
        {
          type: 'element-active',
        },
      ],
    };
    this.titleEl!.textContent = this.type;
    this.tabName!.textContent = 'Statistic By Function Existing';
    functionData.unshift(this.functionStatisticsData);
    this.functionUsageTbl!.recycleDataSource = functionData;
    functionData.shift();
    this.currentLevelData = functionData;
    this.functionUsageTbl?.reMeauseHeight();
  }

  private otherSourceSoLevelClickEvent(it: AnalysisObj): void {
    this.reset(this.functionUsageTbl!, true);
    this.showAssignLevel(this.functionUsageTbl!, this.soUsageTbl!, 3, this.dataLogic!.getEventTypeData());
    this.dataLogic?.getFunctionSize(it)
    const typeName = this.type;
    let title = typeName || '';
    if (!this.hideThreadCheckBox?.checked && this.threadName.length > 0) {
      title += ` / ${this.threadName}`;
    }
    if (it.libName && it.libName.length > 0) {
      title += ` / ${it.libName}`;
    }
    this.titleEl!.textContent = title;
    this.osPieChart?.hideTip();
  }

  private getLibraryTipValue(libraryTipValue: unknown): string {
    // @ts-ignore
    const obj = libraryTipValue.obj as AnalysisObj;
    return `<div>
                    <div>Library:${obj.libName}</div>
                    <div># Existing:${obj.existCount} 
                    (${obj.existCountPercent}%)</div>
                    <div># Total:${obj.applyCount} 
                    (${obj.applyCountPercent}%)</div>
                    <div># Transient:${obj.releaseCount} 
                    (${obj.releaseCountPercent}%)</div>
                </div>`;
  }

  private otherSourceProcessLevelClickEvent(it: AnalysisObj): void {
    if (this.hideThreadCheckBox?.checked || this.isStatistic) {
      this.reset(this.soUsageTbl!, true);
      this.showAssignLevel(this.soUsageTbl!, this.typeUsageTbl!, 1, this.dataLogic!.getEventTypeData());
      this.dataLogic?.getLibSize(it)
    } else {
      this.reset(this.threadUsageTbl!, true);
      this.showAssignLevel(this.threadUsageTbl!, this.typeUsageTbl!, 1, this.dataLogic!.getEventTypeData());
      this.dataLogic?.getThreadSize(it)
    }
    // @ts-ignore
    this.titleEl!.textContent = it.typeName;
    this.type = it.typeName!;
    this.osPieChart?.hideTip();
  }


  private showAssignLevel(
    showOSTable: LitTable,
    hideOSTable: LitTable,
    currentLevel: number,
    currentLevelData: Array<AnalysisObj>
  ): void {
    showOSTable!.style.display = 'grid';
    hideOSTable!.style.display = 'none';
    hideOSTable.setAttribute('hideDownload', '');
    showOSTable?.removeAttribute('hideDownload');
    this.currentLevel = currentLevel;
    this.currentLevelData = currentLevelData;
  }

  resizeTable(): void {
    this.resize(this.typeUsageTbl);
    this.resize(this.threadUsageTbl);
    this.resize(this.soUsageTbl);
    this.resize(this.functionUsageTbl);
  }

  resize(table?: LitTable | null): void {
    if (table) {
      // @ts-ignore
      table.shadowRoot.querySelector('.table').style.height = `${this.parentElement.clientHeight - 65}px`;
      table.reMeauseHeight();
    }
  }

  private reset(showTable: LitTable, isShowBack: boolean): void {
    this.clearData();
    if (isShowBack) {
      this.osBack!.style.visibility = 'visible';
    } else {
      this.osBack!.style.visibility = 'hidden';
    }
    if (this.osTableArray) {
      for (let table of this.osTableArray) {
        if (table === showTable) {
          initSort(table, this.osSortColumn, this.osSortType);
          table.style.display = 'grid';
          table!.removeAttribute('hideDownload');
        } else {
          table!.style.display = 'none';
          table.setAttribute('hideDownload', '');
        }
      }
    }
  }

  private clearData(): void {
    this.osPieChart!.dataSource = [];
    this.typeUsageTbl!.recycleDataSource = [];
    this.threadUsageTbl!.recycleDataSource = [];
    this.soUsageTbl!.recycleDataSource = [];
    this.functionUsageTbl!.recycleDataSource = [];
  }

  public connectedCallback(): void {
    new ResizeObserver(() => {
      this.resizeTable();
      // @ts-ignore
      if (this.parentElement?.clientHeight !== 0) {
        if ((this.parentElement!.clientHeight >= 0 && this.parentElement!.clientHeight <= 31) || this.isStatistic) {
          this.filterEl!.style.display = 'none';
          this.osPieChart!.style.marginBottom = '0px';
          this.osTableBox!.style.marginBottom = '0px';
        } else {
          this.filterEl!.style.display = 'flex';
        }
      }
    }).observe(this.parentElement!);
  }

  initHtml(): string {
    return TabPaneOSAnalysisHtml;
  }
}