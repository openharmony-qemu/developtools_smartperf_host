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
import { FilterByAnalysis } from "../../../../bean/NativeHook";
import { InitAnalysis } from "../../../../database/logic-worker/ProcedureLogicWorkerCommon";
import { procedurePool } from "../../../../database/Procedure";
import { SpSystemTrace } from "../../../SpSystemTrace";
import { Utils } from "../../base/Utils";
import { initSort } from "../SheetUtils";
import { TabPaneFilter } from "../TabPaneFilter";
import { TabPaneOSAnalysisHtml } from "./TabPaneOSAnalysisHtml";
import { TabpaneOSCalltree } from "./TabpaneOSCalltree";

const TYPE_FD = 4;
const TYPE_THREAD = 5;
const PIE_CHART_LIMIT = 20;

const TYPE_FD_STRING = 'FD';
const TYPE_THREAD_STRING = 'THREAD';

class AnalysisObj {
  tName?: string;
  tid?: number;
  typeName?: string;
  typeId?: number;
  libName?: string;
  libId?: number;
  symbolName?: string;
  symbolId?: number;

  tableName = '';

  applySize: number;
  applySizeFormat: string;
  applyCount: number;
  releaseSize: number;
  releaseSizeFormat: string;
  releaseCount: number;
  existSize: number;
  existSizeFormat: string;
  existCount: number;

  applySizePercent?: string;
  applyCountPercent?: string;
  releaseSizePercent?: string;
  releaseCountPercent?: string;
  existSizePercent?: string;
  existCountPercent?: string;

  constructor(applySize: number, applyCount: number, releaseSize: number, releaseCount: number) {
    this.applySize = applySize;
    this.applyCount = applyCount;
    this.releaseSize = releaseSize;
    this.releaseCount = releaseCount;
    this.existSize = applySize - releaseSize;
    this.existCount = applyCount - releaseCount;
    this.applySizeFormat = Utils.getBinaryByteWithUnit(this.applySize);
    this.releaseSizeFormat = Utils.getBinaryByteWithUnit(this.releaseSize);
    this.existSizeFormat = Utils.getBinaryByteWithUnit(this.existSize);
  }
}

class SizeObj {
  applySize = 0;
  applyCount = 0;
  releaseSize = 0;
  releaseCount = 0;
}

@element('tabpane-other-source-analysis')
export class TabPaneOSAnalysis extends BaseElement {
  private currentSelection: SelectionParam | undefined;
  private typeUsageTbl: LitTable | null | undefined;
  private threadUsageTbl: LitTable | null | undefined;
  private soUsageTbl: LitTable | null | undefined;
  private functionUsageTbl: LitTable | null | undefined;
  private osPieChart: LitChartPie | null | undefined;
  private osBack: HTMLDivElement | null | undefined;
  private osTableArray: NodeListOf<LitTable> | undefined | null;
  private osSortColumn: string = '';
  private osSortType: number = 0;
  private titleEl: HTMLDivElement | undefined | null;
  private tabName: HTMLDivElement | null | undefined;
  private range: HTMLLabelElement | null | undefined;
  private isStatistic = false;
  private threadName: string = '';
  private progressEL: LitProgressBar | null | undefined;
  private eventTypeData!: Array<AnalysisObj>;
  private typeStatisticsData!: {};
  private threadStatisticsData!: {};
  private libStatisticsData!: {};
  private functionStatisticsData!: {};
  private currentLevel = -1;
  private hideThreadCheckBox: LitCheckBox | undefined | null;
  private processData!: Array<unknown>;
  private threadData!: Array<AnalysisObj>;
  private soData!: Array<AnalysisObj>;
  private functionData!: Array<AnalysisObj>;
  private currentLevelApplySize = 0;
  private currentLevelReleaseSize = 0;
  private currentLevelExistSize = 0;
  private currentLevelApplyCount = 0;
  private currentLevelReleaseCount = 0;
  private currentLevelExistCount = 0;
  private typeMap!: Map<number, Array<unknown>>;
  private currentLevelData!: Array<unknown>;
  private type: string = '';
  private filterEl: TabPaneFilter | undefined | null;
  private osTableBox: HTMLDivElement | undefined | null;

  set data(analysisParam: SelectionParam) {
    if (this.currentSelection === analysisParam) {
      if (this.eventTypeData) {
        // @ts-ignore
        this.eventTypeData.unshift(this.typeStatisticsData);
        this.typeUsageTbl!.recycleDataSource = this.eventTypeData;
        // @ts-ignore
        this.eventTypeData.shift(this.typeStatisticsData);
      }
      return;
    };
    this.hideThreadCheckBox!.checked = false;
    if (analysisParam.otherSourceStatistic.length > 0) {
      Utils.getInstance().setOherSourceCurrentSelectIPid(analysisParam.otherSourceCurrentIPid);
      Utils.getInstance().initOtherSourceResponseTypeList(analysisParam);
    }
    this.resizeTable();
    this.reset(this.typeUsageTbl!, false);
    this.currentSelection = analysisParam;
    this.titleEl!.textContent = '';
    this.tabName!.textContent = '';
    this.range!.textContent = `Selected range: ${parseFloat(
      ((analysisParam.rightNs - analysisParam.leftNs) / 1000000.0).toFixed(5)
    )}  ms`;
    this.isStatistic = analysisParam.otherSource.length === 0;
    if (this.isStatistic) {
      this.threadName = '';
    }
    this.getOSEventTypeSize(analysisParam);
    this.showAssignLevel(this.typeUsageTbl!, this.functionUsageTbl!, 0, this.eventTypeData);
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
      this.showAssignLevel(this.typeUsageTbl!, this.functionUsageTbl!, 0, this.eventTypeData); // @ts-ignore
      this.getOSTypeSize(this.currentSelection, this.processData);
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
      treeTab!.analysisTabWidth = this.clientWidth; // @ts-ignore
      const data = evt.detail.data as AnalysisObj;
      treeTab!.filterData = new FilterByAnalysis(
        data.typeId,
        data.typeName,
        data.tName,
        data.tid,
        data.libId,
        data.libName,
        data.symbolId,
        data.symbolName
      );
      // 首次打开初始化数据 非首次初始化UI
      if (!InitAnalysis.getInstance().isInitOSAnalysis) {
        treeTab?.initUI();
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
      if (this.tabName!.textContent === 'Statistic By Thread Existing') {
        this.showAssignLevel(this.typeUsageTbl!, this.threadUsageTbl!, 0, this.eventTypeData);
        this.osBack!.style.visibility = 'hidden';
        this.typePieChart();
      } else if (this.tabName!.textContent === 'Statistic By Library Existing') {
        if (this.hideThreadCheckBox?.checked || this.isStatistic) {
          this.showAssignLevel(this.typeUsageTbl!, this.soUsageTbl!, 0, this.eventTypeData);
          this.osBack!.style.visibility = 'hidden';
          this.typePieChart();
        } else {
          this.showAssignLevel(this.threadUsageTbl!, this.soUsageTbl!, 1, this.threadData);
          this.threadPieChart();
        }
      } else if (this.tabName!.textContent === 'Statistic By Function Existing') {
        this.showAssignLevel(this.soUsageTbl!, this.functionUsageTbl!, 2, this.soData);
        this.libraryPieChart();
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
    this.showAssignLevel(this.soUsageTbl!, this.threadUsageTbl!, 2, this.eventTypeData);
    this.getOSLibSize(it);
    const typeName = this.type;

    // @ts-ignore
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

  private sortDataByExistSize(sortType: number, sortColumnArr: Array<unknown>): unknown[] {
    return sortColumnArr.sort((statisticAnalysisLeftData, statisticAnalysisRightData) => {
      return sortType === 1 // @ts-ignore
        ? statisticAnalysisLeftData.existSize - statisticAnalysisRightData.existSize // @ts-ignore
        : statisticAnalysisRightData.existSize - statisticAnalysisLeftData.existSize;
    });
  }

  private sortDataByExistCount(sortType: number, sortColumnArr: Array<unknown>): unknown[] {
    return sortColumnArr.sort((statisticAnalysisLeftData, statisticAnalysisRightData) => {
      return sortType === 1 // @ts-ignore
        ? statisticAnalysisLeftData.existCount - statisticAnalysisRightData.existCount // @ts-ignore
        : statisticAnalysisRightData.existCount - statisticAnalysisLeftData.existCount;
    });
  }

  private sortDataByReleaseSize(sortType: number, sortColumnArr: Array<unknown>): unknown[] {
    return sortColumnArr.sort((statisticAnalysisLeftData, statisticAnalysisRightData) => {
      return sortType === 1 // @ts-ignore
        ? statisticAnalysisLeftData.releaseSize - statisticAnalysisRightData.releaseSize // @ts-ignore
        : statisticAnalysisRightData.releaseSize - statisticAnalysisLeftData.releaseSize;
    });
  }

  private sortDataByReleaseCount(sortType: number, sortColumnArr: Array<unknown>): unknown[] {
    return sortColumnArr.sort((statisticAnalysisLeftData, statisticAnalysisRightData) => {
      return sortType === 1 // @ts-ignore
        ? statisticAnalysisLeftData.releaseCount - statisticAnalysisRightData.releaseCount // @ts-ignore
        : statisticAnalysisRightData.releaseCount - statisticAnalysisLeftData.releaseCount;
    });
  }

  private sortDataByApplySize(sortType: number, sortColumnArr: Array<unknown>): unknown[] {
    return sortColumnArr.sort((statisticAnalysisLeftData, statisticAnalysisRightData) => {
      return sortType === 1 // @ts-ignore
        ? statisticAnalysisLeftData.applySize - statisticAnalysisRightData.applySize // @ts-ignore
        : statisticAnalysisRightData.applySize - statisticAnalysisLeftData.applySize;
    });
  }

  private sortDataByApplyCount(sortType: number, sortColumnArr: Array<unknown>): unknown[] {
    return sortColumnArr.sort((statisticAnalysisLeftData, statisticAnalysisRightData) => {
      return sortType === 1 // @ts-ignore
        ? statisticAnalysisLeftData.applyCount - statisticAnalysisRightData.applyCount // @ts-ignore
        : statisticAnalysisRightData.applyCount - statisticAnalysisLeftData.applyCount;
    });
  }

  private updateSortColumnArr(sortColumnArr: unknown[]): unknown[] {
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

  private getSortedColumnZeroArr(data: unknown[]): unknown[] {
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

  private getOSEventTypeSize(val: SelectionParam): void {
    this.progressEL!.loading = true;
    let typeFilter: number[] = [];
    if (this.isStatistic) {
      for (let type of val.otherSourceStatistic) {
        if (type === 'FD') {
          typeFilter.push(1);
        } else if (type === 'THREAD') {
          typeFilter.push(2);
        }
      }
      this.getDataFromWorker(val, typeFilter);
    } else {
     //非统计模式
    }
  }

  private getDataFromWorker(val: SelectionParam, typeFilter: Array<number | string>): void {
    this.getDataByWorkerQuery(
      {
        leftNs: val.leftNs,
        rightNs: val.rightNs,
        types: typeFilter,
        isStatistic: this.isStatistic,
      },
      (results: unknown) => {
        this.processData = JSON.parse(JSON.stringify(results));
        this.getOSTypeSize(val, this.processData);
      }
    );
  }

  private getOSTypeSize(val: SelectionParam, result: unknown): void {
    this.resetCurrentLevelData();// @ts-ignore
    this.typeMap = this.typeSizeGroup(this.processData);
    this.currentLevelExistSize = this.currentLevelApplySize - this.currentLevelReleaseSize;
    this.currentLevelExistCount = this.currentLevelApplyCount - this.currentLevelReleaseCount;
    this.eventTypeData = [];
    if (this.isStatistic) {
      if (this.typeMap.has(TYPE_FD)) {
        let fdType = this.setTypeMap(this.typeMap, TYPE_FD, TYPE_FD_STRING);
        if (fdType) {
          this.calPercent(fdType);
          this.eventTypeData.push(fdType);
        }
      }
      if (this.typeMap.has(TYPE_THREAD)) {
        let subTypeMap = new Map<string, Array<number | string>>();
        for (let item of this.typeMap.get(TYPE_THREAD)!) {
          // @ts-ignore
          if (item.subType) {
            // @ts-ignore
            if (subTypeMap.has(item.subType)) {
              // @ts-ignore
              subTypeMap.get(item.subType)?.push(item);
            } else {
              let dataArray: Array<number | string> = []; // @ts-ignore
              dataArray.push(item); // @ts-ignore
              subTypeMap.set(item.subType, dataArray);
            }
          } else {
            if (subTypeMap.has(TYPE_THREAD_STRING)) {
              // @ts-ignore
              subTypeMap.get(TYPE_THREAD_STRING)?.push(item);
            } else {
              let dataArray: Array<number | string> = []; // @ts-ignore
              dataArray.push(item);
              subTypeMap.set(TYPE_THREAD_STRING, dataArray);
            }
          }
        }
        subTypeMap.forEach((arr: Array<number | string>, subType: string) => {
          let mapType = this.setTypeMap(this.typeMap, TYPE_THREAD, subType);
          if (mapType) {
            this.calPercent(mapType);
            this.eventTypeData.push(mapType);
          }
        });
      }
      
    } else {
    }
    this.eventTypeData.sort((a, b) => b.existSize - a.existSize);
    this.typeStatisticsData = this.totalData(this.typeStatisticsData);
    this.progressEL!.loading = false;
    this.currentLevel = 0;
    this.typePieChart();
  }

  private typePieChart(): void {
    this.osPieChart!.config = {
      appendPadding: 0,
      data: this.getPieChartData(this.eventTypeData),
      angleField: 'existSize',
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
                    <div>Existing:${obj.existSizeFormat} (${obj.existSizePercent}%)</div>
                    <div># Existing:${obj.existCount} (${obj.existCountPercent}%)</div>
                    <div>Total Bytes:${obj.applySizeFormat} (${obj.applySizePercent}%)</div>
                    <div># Total:${obj.applyCount} (${obj.applyCountPercent}%)</div>
                    <div>Transient:${obj.releaseSizeFormat} (${obj.releaseSizePercent}%)</div>
                    <div># Transient:${obj.releaseCount} (${obj.releaseCountPercent}%)</div>
                </div>`;
      },
      angleClick: (it): void => {
        // @ts-ignore
        if (it.tableName !== 'other') {
          this.otherSourceProcessLevelClickEvent(it);
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
    // @ts-ignore
    this.eventTypeData.unshift(this.typeStatisticsData);
    this.typeUsageTbl!.recycleDataSource = this.eventTypeData;
    // @ts-ignore
    this.eventTypeData.shift(this.typeStatisticsData);
    this.typeUsageTbl?.reMeauseHeight();
    this.currentLevelData = this.eventTypeData;
  }

  private threadPieChart(): void {
    this.osPieChart!.config = {
      appendPadding: 0,
      data: this.getPieChartData(this.threadData),
      angleField: 'existSize',
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
                    <div>Existing:${obj.existSizeFormat} (${obj.existSizePercent}%)</div>
                    <div># Existing:${obj.existCount} (${obj.existCountPercent}%)</div>
                    <div>Total Bytes:${obj.applySizeFormat} (${obj.applySizePercent}%)</div>
                    <div># Total:${obj.applyCount} (${obj.applyCountPercent}%)</div>
                    <div>Transient:${obj.releaseSizeFormat} (${obj.releaseSizePercent}%)</div>
                    <div># Transient:${obj.releaseCount} (${obj.releaseCountPercent}%)</div>
                </div>`;
      },
      angleClick: (it: unknown): void => {
        // @ts-ignore
        if (it.tid !== 'other') {
         // @ts-ignore
          this.osThreadLevelClickEvent(it);
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
    const typeName = this.type;
    this.titleEl!.textContent = typeName + '';
    this.tabName!.textContent = 'Statistic By Thread Existing';
    // @ts-ignore
    this.threadData.unshift(this.threadStatisticsData);
    this.threadUsageTbl!.recycleDataSource = this.threadData;
    // @ts-ignore
    this.threadData.shift(this.threadStatisticsData);
    this.currentLevelData = this.threadData;
    this.threadUsageTbl?.reMeauseHeight();
  }

  private libraryPieChart(item?: unknown): void {
    this.osPieChart!.config = {
      appendPadding: 0,
      data: this.getPieChartData(this.soData),
      angleField: 'existSize',
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
          this.otherSourceSoLevelClickEvent(it);
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
    const typeName = this.type;
    let title = typeName;
    if (!this.hideThreadCheckBox?.checked && this.threadName.length > 0) {
      title += ' / ' + this.threadName;
    }
    this.titleEl!.textContent = title;
    this.tabName!.textContent = 'Statistic By Library Existing';
    // @ts-ignore
    this.soData.unshift(this.libStatisticsData);
    this.soUsageTbl!.recycleDataSource = this.soData;
    // @ts-ignore
    this.soData.shift(this.libStatisticsData);
    this.currentLevelData = this.soData;
    this.soUsageTbl?.reMeauseHeight();
  }

  private functionPieChart(): void {
    this.osPieChart!.config = {
      appendPadding: 0,
      data: this.getPieChartData(this.functionData),
      angleField: 'existSize',
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
                    <div>Existing:${obj.existSizeFormat} 
                    (${obj.existSizePercent}%)</div>
                    <div># Existing:${obj.existCount} 
                    (${obj.existCountPercent}%)</div>
                    <div>Total Bytes:${obj.applySizeFormat} 
                    (${obj.applySizePercent}%)</div>
                    <div># Total:${obj.applyCount} 
                    (${obj.applyCountPercent}%)</div>
                    <div>Transient:${obj.releaseSizeFormat} 
                    (${obj.releaseSizePercent}%)</div>
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
    // @ts-ignore
    this.functionData.unshift(this.functionStatisticsData);
    this.functionUsageTbl!.recycleDataSource = this.functionData;
    // @ts-ignore
    this.functionData.shift(this.functionStatisticsData);
    this.currentLevelData = this.functionData;
    this.functionUsageTbl?.reMeauseHeight();
  }

  private otherSourceSoLevelClickEvent(it: unknown): void {
    this.reset(this.functionUsageTbl!, true);
    this.showAssignLevel(this.functionUsageTbl!, this.soUsageTbl!, 3, this.eventTypeData);
    this.getOSFunctionSize(it);
    const typeName = this.type;
    // @ts-ignore
    let title = typeName || '';
    if (!this.hideThreadCheckBox?.checked && this.threadName.length > 0) {
      title += ` / ${this.threadName}`;
    } // @ts-ignore
    if (it.libName.length > 0) {
      // @ts-ignore
      title += ` / ${it.libName}`;
    }
    this.titleEl!.textContent = title;
    this.osPieChart?.hideTip();
  }

  private getOSFunctionSize(item: unknown): void {
    this.progressEL!.loading = true;
    this.shadowRoot!.querySelector<HTMLDivElement>('.os-subheading')!.textContent = 'Statistic By Function Existing';
    // @ts-ignore
    let typeId = item.typeId; // @ts-ignore
    let typeName = item.typeName; // @ts-ignore
    let tid = item.tid; // @ts-ignore
    let libId = item.libId; // @ts-ignore
    let symbolMap = new Map<number, Array<number | string>>();
    this.resetCurrentLevelData(item); // @ts-ignore
    let types = this.getTypes(item);
    if (!this.processData) {
      return;
    }
    for (let data of this.processData) {
      if (this.skipItemByType(typeName, types, data, libId)) {
        continue;
      } // @ts-ignore
      if (tid !== undefined && tid !== data.tid) {
        continue;
      } // @ts-ignore
      if (symbolMap.has(data.symbolId)) {
        // @ts-ignore
        symbolMap.get(data.symbolId)?.push(data);
      } else {
        let dataArray: Array<number | string> = []; // @ts-ignore
        dataArray.push(data); // @ts-ignore
        symbolMap.set(data.symbolId, dataArray);
      }
    }
    this.functionData = [];
    symbolMap.forEach((symbolItems, symbolId) => {
      let symbolPath = SpSystemTrace.DATA_DICT.get(symbolId)?.split('/');
      let symbolName = symbolPath ? symbolPath[symbolPath.length - 1] : 'null';
      const sizeObj = this.calSizeObj(symbolItems);
      let analysis = new AnalysisObj(sizeObj.applySize, sizeObj.applyCount, sizeObj.releaseSize, sizeObj.releaseCount);
      this.calPercent(analysis);
      analysis.typeId = typeId;
      analysis.typeName = typeName;
      analysis.tid = tid;
      analysis.tName = 'Thread ' + tid;
      analysis.libId = libId; // @ts-ignore
      analysis.libName = item.libName;
      analysis.symbolId = symbolId;
      analysis.symbolName = symbolName;
      analysis.tableName = analysis.symbolName;
      this.functionData.push(analysis);
    });
    this.baseSort(this.functionData);
    this.functionPieChart();
  }

  private skipItemByType(typeName: string, types: Array<string | number>, data: unknown, libId: number): boolean {
    if (typeName === TYPE_FD_STRING) {
      // @ts-ignore
      if (!types.includes(data.type) || data.libId !== libId) {
        return true;
      }
    } else if (typeName === TYPE_THREAD_STRING) {
      if (this.isStatistic) {
        // @ts-ignore
        if (data.subType) {
          // @ts-ignore
          if (!types.includes(data.subType) || !types.includes(data.type) || data.libId !== libId) {
            return true;
          }
        } else {
          return true;
        }
      } else {
        // @ts-ignore
        if (!data.subType) {
          // @ts-ignore
          if (!types.includes(data.type) || data.libId !== libId) {
            return true;
          }
        } else {
          return true;
        }
      }
    } else {
      // @ts-ignore
      if (data.subType) {
        // @ts-ignore
        if (!types.includes(data.subType) || !types.includes(data.type) || data.libId !== libId) {
          return true;
        }
      } else {
        return true;
      }
    }
    return false;
  }

  private getLibraryTipValue(libraryTipValue: unknown): string {
    // @ts-ignore
    const obj = libraryTipValue.obj as AnalysisObj;
    return `<div>
                    <div>Library:${obj.libName}</div>
                    <div>Existing:${obj.existSizeFormat} 
                    (${obj.existSizePercent}%)</div>
                    <div># Existing:${obj.existCount} 
                    (${obj.existCountPercent}%)</div>
                    <div>Total Bytes:${obj.applySizeFormat} 
                    (${obj.applySizePercent}%)</div>
                    <div># Total:${obj.applyCount} 
                    (${obj.applyCountPercent}%)</div>
                    <div>Transient:${obj.releaseSizeFormat} 
                    (${obj.releaseSizePercent}%)</div>
                    <div># Transient:${obj.releaseCount} 
                    (${obj.releaseCountPercent}%)</div>
                </div>`;
  }

  private otherSourceProcessLevelClickEvent(it: unknown): void {
    if (this.hideThreadCheckBox?.checked || this.isStatistic) {
      this.reset(this.soUsageTbl!, true);
      this.showAssignLevel(this.soUsageTbl!, this.typeUsageTbl!, 1, this.eventTypeData);
      this.getOSLibSize(it);
    } else {
      this.reset(this.threadUsageTbl!, true);
      this.showAssignLevel(this.threadUsageTbl!, this.typeUsageTbl!, 1, this.eventTypeData);
      this.getOSThreadSize(it);
    } // @ts-ignore
    this.titleEl!.textContent = it.typeName;
    // @ts-ignore
    this.type = it.typeName;
    this.osPieChart?.hideTip();
  }

  private getOSThreadSize(item: unknown): void {
    this.progressEL!.loading = true;
    let threadMap = new Map<number, Array<number | string>>(); // @ts-ignore
    let types = this.getTypes(item); // @ts-ignore
    let typeName = item.typeName;
    this.resetCurrentLevelData(item);
    for (let itemData of this.processData) {
      // @ts-ignore
      if (this.shouldSkipItem(typeName, types, itemData)) {
        continue;
      } // @ts-ignore
      if (threadMap.has(itemData.tid)) {
        // @ts-ignore
        threadMap.get(itemData.tid)?.push(itemData);
      } else {
        let itemArray: Array<number | string> = []; // @ts-ignore
        itemArray.push(itemData); // @ts-ignore
        threadMap.set(itemData.tid, itemArray);
      }
    }
    this.threadData = [];
    threadMap.forEach((dbData: Array<unknown>, tid: number) => {
      const sizeObj = this.calSizeObj(dbData);
      let analysis = new AnalysisObj(sizeObj.applySize, sizeObj.applyCount, sizeObj.releaseSize, sizeObj.releaseCount);
      this.calPercent(analysis); // @ts-ignore
      analysis.typeId = item.typeId; // @ts-ignore
      analysis.typeName = item.typeName;
      analysis.tid = tid; // @ts-ignore
      if (dbData[0].threadName && dbData[0].threadName.length > 0) {
        // @ts-ignore
        analysis.tName = `${dbData[0].threadName}(${tid})`;
      } else {
        analysis.tName = `Thread ${tid}`;
      }
      analysis.tableName = analysis.tName;
      this.threadData.push(analysis);
    });
    this.threadData.sort((a, b) => b.existSize - a.existSize);
    this.threadStatisticsData = this.totalData(this.threadStatisticsData);
    this.currentLevel = 1;
    this.currentLevelData = this.threadData;
    this.progressEL!.loading = false;
    this.threadPieChart();
  }

  private getTypes(parent: AnalysisObj): Array<number | string> {
    let types: Array<number | string> = [];
    types.push(parent.typeId!);
    types.push(parent.typeName!);
    return types;
  }

  private getOSLibSize(item: unknown): void {
    this.progressEL!.loading = true; // @ts-ignore
    let typeId = item.typeId; // @ts-ignore
    let typeName = item.typeName; // @ts-ignore
    let tid = item.tid;
    let libMap = new Map<number, Array<number | string>>();
    this.resetCurrentLevelData(item); // @ts-ignore
    let types = this.getTypes(item);
    this.soData = [];
    if (!this.processData) {
      return;
    }
    for (let itemData of this.processData) {
      if (this.shouldSkipItem(typeName, types, itemData)) {
        continue;
      } // @ts-ignore
      if (tid !== undefined && tid !== itemData.tid) {
        continue;
      } // @ts-ignore
      let libId = itemData.libId;
      if (libMap.has(libId)) {
        // @ts-ignore
        libMap.get(libId)?.push(itemData);
      } else {
        let dataArray: Array<number | string> = []; // @ts-ignore
        dataArray.push(itemData);
        libMap.set(libId, dataArray);
      }
    }
    this.soData = [];
    libMap.forEach((libItems, libId) => {
      let libPath = SpSystemTrace.DATA_DICT.get(libId)?.split('/');
      let libName = '';
      if (libPath) {
        libName = libPath[libPath.length - 1];
      }
      const sizeObj = this.calSizeObj(libItems);
      let analysis = new AnalysisObj(sizeObj.applySize, sizeObj.applyCount, sizeObj.releaseSize, sizeObj.releaseCount);
      this.calPercent(analysis);
      analysis.typeId = typeId;
      analysis.typeName = typeName;
      analysis.tid = tid;
      analysis.tName = 'Thread ' + tid;
      analysis.libId = libId;
      analysis.libName = libName;
      analysis.tableName = analysis.libName;
      this.soData.push(analysis);
    });
    this.baseSort(this.soData);
    this.libraryPieChart(item);
  }

  private baseSort(data: Array<AnalysisObj>): void {
    if (data === this.functionData) {
      this.functionData.sort((a, b) => b.existSize - a.existSize);
      // @ts-ignore
      this.functionStatisticsData = this.totalData(this.functionStatisticsData);
      this.currentLevel = 3;
      this.progressEL!.loading = false;
    }
    if (data === this.soData) {
      this.soData.sort((a, b) => b.existSize - a.existSize);
      this.libStatisticsData = this.totalData(this.libStatisticsData);
      this.currentLevel = 2;
      this.progressEL!.loading = false;
    }
  }

  private calSizeObj(dbData: Array<unknown>): SizeObj {
    let sizeObj = new SizeObj();
    for (let item of dbData) {
      if (this.isStatistic) {
        // @ts-ignore
        sizeObj.applyCount += item.count; // @ts-ignore
        sizeObj.applySize += item.size; // @ts-ignore
        sizeObj.releaseCount += item.releaseCount; // @ts-ignore
        sizeObj.releaseSize += item.releaseSize;
      } else {
        // @ts-ignore
        sizeObj.applyCount += item.count; // @ts-ignore
        sizeObj.applySize += item.size; // @ts-ignore
        if (item.isRelease) {
          // @ts-ignore
          sizeObj.releaseCount += item.count; // @ts-ignore
          sizeObj.releaseSize += item.size;
        }
      }
    }
    return sizeObj;
  }

  private shouldSkipItem(typeName: string, types: Array<number | string>, itemData: unknown): boolean {//需要做修改
    if (typeName === TYPE_FD_STRING) {
      // @ts-ignore
      return !types.includes(itemData.type);
    } else if (typeName === TYPE_THREAD_STRING) {
      if (this.isStatistic) {
        // @ts-ignore
        if (itemData.subType) {
          // @ts-ignore
          return !types.includes(itemData.subType) || !types.includes(itemData.type);
        } else {
          return true;
        }
      } else {
        // @ts-ignore
        if (!itemData.subType) {
          // @ts-ignore
          return !types.includes(itemData.type);
        } else {
          return true;
        }
      }
    } else {
      // @ts-ignore
      if (itemData.subType) {
        // @ts-ignore
        return !types.includes(itemData.subType) || !types.includes(itemData.type);
      } else {
        return true;
      }
    }
  }

  private showAssignLevel(
    showOSTable: LitTable,
    hideOSTable: LitTable,
    currentLevel: number,
    currentLevelData: Array<unknown>
  ): void {
    showOSTable!.style.display = 'grid';
    hideOSTable!.style.display = 'none';
    hideOSTable.setAttribute('hideDownload', '');
    showOSTable?.removeAttribute('hideDownload');
    this.currentLevel = currentLevel;
    this.currentLevelData = currentLevelData;
  }

  private getPieChartData(res: unknown[]): unknown[] {
    if (res.length > PIE_CHART_LIMIT) {
      let pieChartArr: string[] = [];
      let other: unknown = {
        tableName: 'other',
        tName: 'other',
        libName: 'other',
        symbolName: 'other',
        existSizePercent: 0,
        existSize: 0,
        existSizeFormat: '',
        existCount: 0,
        existCountPercent: 0,
        applySizeFormat: '',
        applySize: 0,
        applySizePercent: 0,
        applyCount: 0,
        applyCountPercent: 0,
        releaseSizeFormat: '',
        releaseSize: 0,
        releaseSizePercent: 0,
        releaseCount: 0,
        releaseCountPercent: 0,
      };
      for (let i = 0; i < res.length; i++) {
        if (i < PIE_CHART_LIMIT - 1) {
          // @ts-ignore
          pieChartArr.push(res[i]);
        } else {
          // @ts-ignore
          other.existCount += res[i].existCount; // @ts-ignore
          other.existSize += res[i].existSize; // @ts-ignore
          other.applySize += res[i].applySize; // @ts-ignore
          other.applyCount += res[i].applyCount; // @ts-ignore
          other.releaseSize += res[i].releaseSize; // @ts-ignore
          other.releaseCount += res[i].releaseCount; // @ts-ignore
          other.existSizeFormat = Utils.getBinaryByteWithUnit(other.existSize); // @ts-ignore
          other.applySizeFormat = Utils.getBinaryByteWithUnit(other.applySize); // @ts-ignore
          other.releaseSizeFormat = Utils.getBinaryByteWithUnit(other.releaseSize); // @ts-ignore
          other.existSizePercent = this.currentLevelExistSize === 0 ? 0 : ((other.existSize / this.currentLevelExistSize) * 100).toFixed(2); // @ts-ignore
          other.existCountPercent = this.currentLevelExistCount === 0 ? 0 : ((other.existCount / this.currentLevelExistCount) * 100).toFixed(2); // @ts-ignore
          other.applySizePercent = this.currentLevelApplySize === 0 ? 0 : ((other.applySize / this.currentLevelApplySize) * 100).toFixed(2); // @ts-ignore
          other.applyCountPercent = this.currentLevelApplyCount === 0 ? 0 : ((other.applyCount / this.currentLevelApplyCount) * 100).toFixed(2);
          // @ts-ignore
          other.releaseSizePercent = this.currentLevelReleaseSize === 0 ? 0 :
            // @ts-ignore
            ((other.releaseSize / this.currentLevelReleaseSize) * 100).toFixed(2); // @ts-ignore
          other.releaseCountPercent = this.currentLevelReleaseCount === 0 ? 0 : ((other.releaseCount / this.currentLevelReleaseCount) * 100).toFixed(2);
        }
      } // @ts-ignore
      pieChartArr.push(other);
      return pieChartArr;
    }
    return res;
  }

private totalData(total: {}): {} {
  total = {
    existSizeFormat: Utils.getBinaryByteWithUnit(this.currentLevelExistSize),
    existSizePercent: this.currentLevelExistSize === 0 ? 0 : ((this.currentLevelExistSize / this.currentLevelExistSize) * 100).toFixed(2),
    existCount: this.currentLevelExistCount,
    existCountPercent: this.currentLevelExistCount === 0 ? 0 : ((this.currentLevelExistCount / this.currentLevelExistCount) * 100).toFixed(2),
    releaseSizeFormat: Utils.getBinaryByteWithUnit(this.currentLevelReleaseSize),
    releaseSizePercent: this.currentLevelReleaseSize === 0 ? 0 : ((this.currentLevelReleaseSize / this.currentLevelReleaseSize) * 100).toFixed(2),
    releaseCount: this.currentLevelReleaseCount,
    releaseCountPercent: this.currentLevelReleaseCount === 0 ? 0 : ((this.currentLevelReleaseCount / this.currentLevelReleaseCount) * 100).toFixed(2),
    applySizeFormat: Utils.getBinaryByteWithUnit(this.currentLevelApplySize),
    applySizePercent: this.currentLevelApplySize === 0 ? 0 : ((this.currentLevelApplySize / this.currentLevelApplySize) * 100).toFixed(2),
    applyCount: this.currentLevelApplyCount,
    applyCountPercent: this.currentLevelApplyCount === 0 ? 0 : ((this.currentLevelApplyCount / this.currentLevelApplyCount) * 100).toFixed(2),
    existSize: 0,
    tableName: '',
    tName: '',
    libName: '',
    symbolName: '',
  };
  return total;
}

private calPercent(item: AnalysisObj): void {
  item.applySizePercent = this.currentLevelApplySize === 0 ? '0' : ((item.applySize / this.currentLevelApplySize) * 100).toFixed(2);
  item.applyCountPercent = this.currentLevelApplyCount === 0 ? '0' : ((item.applyCount / this.currentLevelApplyCount) * 100).toFixed(2);
  item.releaseSizePercent = this.currentLevelReleaseSize === 0 ? '0' : ((item.releaseSize / this.currentLevelReleaseSize) * 100).toFixed(2);
  item.releaseCountPercent = this.currentLevelReleaseCount === 0 ? '0' : ((item.releaseCount / this.currentLevelReleaseCount) * 100).toFixed(2);
  item.existSizePercent = this.currentLevelExistSize === 0 ? '0' : ((item.existSize / this.currentLevelExistSize) * 100).toFixed(2);
  item.existCountPercent = this.currentLevelExistCount === 0 ? '0' : ((item.existCount / this.currentLevelExistCount) * 100).toFixed(2);
}

  private setTypeMap(typeMap: Map<number, unknown>, tyeId: number, typeName: string): AnalysisObj | null {
    let applySize = 0;
    let releaseSize = 0;
    let applyCount = 0;
    let releaseCount = 0;
    let currentType = typeMap.get(tyeId);
    if (!currentType) {
      return null;
    }

    // @ts-ignore
    for (let applySample of typeMap.get(tyeId)!) {
      if (
        (tyeId === TYPE_FD || tyeId === TYPE_THREAD) ||
        (applySample.subType && applySample.subType === typeName) ||
        (!applySample.subType && typeName === TYPE_FD_STRING) ||
        (!applySample.subType && typeName === TYPE_THREAD_STRING)
      ) {
        applySize += applySample.size;
        applyCount += applySample.count;
        if (this.isStatistic) {
          releaseSize += applySample.releaseSize;
          releaseCount += applySample.releaseCount;
        } else {
          if (applySample.isRelease) {
            releaseSize += applySample.size;
            releaseCount += applySample.count;
          }
        }
      }
    }
    let typeItem = new AnalysisObj(applySize, applyCount, releaseSize, releaseCount);
    typeItem.typeId = tyeId;
    typeItem.typeName = typeName;
    typeItem.tableName = typeName;
    return typeItem;
  }

  private resetCurrentLevelData(parent?: unknown): void {
    if (parent) {
      // @ts-ignore
      this.currentLevelApplySize = parent.applySize; // @ts-ignore
      this.currentLevelApplyCount = parent.applyCount; // @ts-ignore
      this.currentLevelExistSize = parent.existSize; // @ts-ignore
      this.currentLevelExistCount = parent.existCount; // @ts-ignore
      this.currentLevelReleaseSize = parent.releaseSize; // @ts-ignore
      this.currentLevelReleaseCount = parent.releaseCount;
    } else {
      this.currentLevelApplySize = 0;
      this.currentLevelApplyCount = 0;
      this.currentLevelExistSize = 0;
      this.currentLevelExistCount = 0;
      this.currentLevelReleaseSize = 0;
      this.currentLevelReleaseCount = 0;
    }
  }

  private typeSizeGroup(dbArray: Array<number | string>): Map<number, Array<number | string>> {
    let typeMap = new Map<number, Array<number | string>>();
    if (!dbArray || dbArray.length === 0) {
      return typeMap;
    }

    const setSize = (item: unknown): void => {
      // @ts-ignore
      this.currentLevelApplySize += item.size; // @ts-ignore
      this.currentLevelApplyCount += item.count;
      if (this.isStatistic) {
        // @ts-ignore
        this.currentLevelReleaseSize += item.releaseSize; // @ts-ignore
        this.currentLevelReleaseCount += item.releaseCount;
      } else {
      }
    };

    for (let itemData of dbArray) {
      // @ts-ignore
      switch (itemData.type) {
        case TYPE_FD:
          setSize(itemData);
          if (typeMap.has(TYPE_FD)) {
            typeMap.get(TYPE_FD)?.push(itemData);
          } else {
            let itemArray: Array<number | string> = [];
            itemArray.push(itemData);
            typeMap.set(TYPE_FD, itemArray);
          }
          break;
        case TYPE_THREAD:
          setSize(itemData);
          if (typeMap.has(TYPE_THREAD)) {
            typeMap.get(TYPE_THREAD)?.push(itemData);
          } else {
            let itemArray: Array<number | string> = [];
            itemArray.push(itemData);
            typeMap.set(TYPE_THREAD, itemArray);
          }
          break;
      }
    }
    return typeMap;
  }

  private getDataByWorkerQuery(args: unknown, handler: Function): void {
    this.progressEL!.loading = true;
    procedurePool.submitWithName('logic0', 'other-source-queryAnalysis', args, undefined, (results: unknown) => {
      handler(results);
      this.progressEL!.loading = false;
    });
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