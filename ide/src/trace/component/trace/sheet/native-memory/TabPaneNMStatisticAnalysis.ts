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
import { LitChartPie } from '../../../../../base-ui/chart/pie/LitChartPie';
import '../../../../../base-ui/chart/pie/LitChartPie';
import { LitProgressBar } from '../../../../../base-ui/progress-bar/LitProgressBar';
import { Utils } from '../../base/Utils';
import { SpSystemTrace } from '../../../SpSystemTrace';
import { procedurePool } from '../../../../database/Procedure';
import { TabPaneFilter } from '../TabPaneFilter';
import { LitCheckBox } from '../../../../../base-ui/checkbox/LitCheckBox';
import { initSort } from '../SheetUtils';
import { TabpaneNMCalltree } from './TabPaneNMCallTree';
import { FilterByAnalysis } from '../../../../bean/NativeHook';
import { InitAnalysis } from '../../../../database/logic-worker/ProcedureLogicWorkerCommon';
import { TabPaneNMStatisticAnalysisHtml } from './TabPaneNMStatisticAnalysis.html';

const TYPE_ALLOC_STRING = 'AllocEvent';
const TYPE_MAP_STRING = 'MmapEvent';
const TYPE_OTHER_MMAP = 'Other MmapEvent';

const TYPE_ALLOC = 0;
const TYPE_MAP = 1;
const TYPE_FREE = 2;
const TYPE_UN_MAP = 3;
const PIE_CHART_LIMIT = 20;

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

@element('tabpane-nm-statistic-analysis')
export class TabPaneNMStatisticAnalysis extends BaseElement {
  private currentSelection: SelectionParam | any;
  private nmPieChart: LitChartPie | null | undefined;
  private nmTableBox: HTMLDivElement | undefined | null;
  private processData!: Array<any>;
  private eventTypeData!: Array<AnalysisObj>;
  private threadData!: Array<AnalysisObj>;
  private soData!: Array<AnalysisObj>;
  private functionData!: Array<AnalysisObj>;
  private tableType: LitTable | null | undefined;
  private threadUsageTbl: LitTable | null | undefined;
  private soUsageTbl: LitTable | null | undefined;
  private functionUsageTbl: LitTable | null | undefined;
  private range: HTMLLabelElement | null | undefined;
  private nmBack: HTMLDivElement | null | undefined;
  private threadName: string = '';
  private tabName: HTMLDivElement | null | undefined;
  private progressEL: LitProgressBar | null | undefined;
  private type: string = '';
  private isStatistic = false;
  private typeMap!: Map<number, Array<any>>;
  private currentLevel = -1;
  private currentLevelApplySize = 0;
  private currentLevelReleaseSize = 0;
  private currentLevelExistSize = 0;
  private currentLevelApplyCount = 0;
  private currentLevelReleaseCount = 0;
  private currentLevelExistCount = 0;
  private currentLevelData!: Array<any>;
  private typeStatisticsData!: {};
  private threadStatisticsData!: {};
  private libStatisticsData!: {};
  private functionStatisticsData!: {};
  private nmTableArray: NodeListOf<LitTable> | undefined | null;
  private nmSortColumn: string = '';
  private nmSortType: number = 0;
  private titleEl: HTMLDivElement | undefined | null;
  private filterEl: TabPaneFilter | undefined | null;
  private hideThreadCheckBox: LitCheckBox | undefined | null;

  get titleTxt(): string | null {
    return this.titleEl!.textContent;
  }

  set data(statisticAnalysisParam: SelectionParam) {
    if (statisticAnalysisParam === this.currentSelection) {
      // @ts-ignore
      this.eventTypeData.unshift(this.typeStatisticsData);
      this.tableType!.recycleDataSource = this.eventTypeData;
      // @ts-ignore
      this.eventTypeData.shift(this.typeStatisticsData);
      return;
    }
    if (this.nmTableArray) {
      for (let table of this.nmTableArray) {
        initSort(table!, this.nmSortColumn, this.nmSortType);
      }
    }
    this.hideThreadCheckBox!.checked = false;
    if (statisticAnalysisParam.nativeMemoryStatistic.length > 0) {
      Utils.getInstance().setCurrentSelectIPid(statisticAnalysisParam.nativeMemoryCurrentIPid);
      Utils.getInstance().initResponseTypeList(statisticAnalysisParam);
    }
    if (this.tableType) {
      // @ts-ignore
      this.tableType.shadowRoot.querySelector('.table').style.height = this.parentElement.clientHeight - 30 + 'px';
    }
    if (this.soUsageTbl) {
      // @ts-ignore
      this.soUsageTbl.shadowRoot.querySelector('.table').style.height = this.parentElement.clientHeight - 30 + 'px';
    }
    if (this.functionUsageTbl) {
      // @ts-ignore
      this.functionUsageTbl.shadowRoot.querySelector('.table').style.height = `${this.parentElement!.clientHeight - 30
      }px`;
    }
    this.clearData();
    this.currentSelection = statisticAnalysisParam;
    this.reset(this.tableType!, false);
    this.titleEl!.textContent = '';
    this.tabName!.textContent = '';
    this.range!.textContent = `Selected range: ${parseFloat(
      ((statisticAnalysisParam.rightNs - statisticAnalysisParam.leftNs) / 1000000.0).toFixed(5)
    )}  ms`;
    this.isStatistic = statisticAnalysisParam.nativeMemory.length === 0;
    if (this.isStatistic) {
      this.threadName = '';
    }
    this.getNMEventTypeSize(statisticAnalysisParam);
  }

  initNmTableArray(): void {
    this.nmTableArray = this.shadowRoot!.querySelectorAll('lit-table') as NodeListOf<LitTable>;
    for (let nmTable of this.nmTableArray) {
      nmTable!.addEventListener('contextmenu', function (event) {
        event.preventDefault(); // 阻止默认的上下文菜单弹框
      });
      nmTable!.addEventListener('column-click', (evt) => {
        // @ts-ignore
        this.nmSortColumn = evt.detail.key;
        // @ts-ignore
        this.nmSortType = evt.detail.sort;
        this.sortByColumn();
      });
      nmTable!.addEventListener('row-hover', (evt) => {
        // @ts-ignore
        let detail = evt.detail;
        if (detail.data) {
          let data = detail.data;
          data.isHover = true;
          if (detail.callBack) {
            detail.callBack(true);
          }
        }
        this.nmPieChart?.showHover();
        this.nmPieChart?.hideTip();
      });
    }
    this.threadUsageTbl!.addEventListener('row-click', (evt) => {
      // @ts-ignore
      let button = evt.detail.button;
      // @ts-ignore
      let data = evt.detail.data;
      if (button === 0) {
        if (data.tableName !== '' && data.existSize !== 0) {
          this.nativeThreadLevelClickEvent(data);
        }
      } else if (button === 2) {
        let title = `${this.titleEl!.textContent}/${data.tName}`;
        this.clickRight(evt, title);
      }
    });
  }

  initTable(): void {
    this.tableType!.addEventListener('row-click', (evt) => {
      // @ts-ignore
      let button = evt.detail.button;
      // @ts-ignore
      let data = evt.detail.data;
      if (button === 0) {
        if (data.tableName !== '' && data.existSize !== 0) {
          this.nativeProcessLevelClickEvent(data);
        }
      } else if (button === 2) {
        const typeName = data.typeName === TYPE_MAP_STRING ? TYPE_OTHER_MMAP : data.typeName;
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
          this.nativeSoLevelClickEvent(data);
        }
      } else if (button === 2) {
        let title = `${this.titleEl!.textContent}/${data.libName}`;
        this.clickRight(evt, title);
      }
    });
  }

  initElements(): void {
    this.range = this.shadowRoot?.querySelector('#time-range');
    this.nmPieChart = this.shadowRoot!.querySelector<LitChartPie>('#nm-chart-pie');
    this.nmTableBox = this.shadowRoot!.querySelector<HTMLDivElement>('.nm-table-box');
    this.tableType = this.shadowRoot!.querySelector<LitTable>('#tb-eventtype-usage');
    this.threadUsageTbl = this.shadowRoot!.querySelector<LitTable>('#tb-thread-usage');
    this.soUsageTbl = this.shadowRoot!.querySelector<LitTable>('#tb-so-usage');
    this.functionUsageTbl = this.shadowRoot!.querySelector<LitTable>('#tb-function-usage');
    this.nmBack = this.shadowRoot!.querySelector<HTMLDivElement>('.nm-go-back');
    this.tabName = this.shadowRoot!.querySelector<HTMLDivElement>('.nm-subheading');
    this.progressEL = this.shadowRoot?.querySelector('.nm-progress') as LitProgressBar;
    this.getBack();
    this.titleEl = this.shadowRoot!.querySelector<HTMLDivElement>('.title');
    this.filterEl = this.shadowRoot?.querySelector('#filter');
    this.filterEl!.setOptionsList(['Hide Thread']);
    let popover = this.filterEl!.shadowRoot!.querySelector('#check-popover');
    this.hideThreadCheckBox = popover!!.querySelector<LitCheckBox>('div > #hideThread');
    this.hideThreadCheckBox?.addEventListener('change', () => {
      this.reset(this.tableType!, false);
      this.getNMTypeSize(this.currentSelection, this.processData);
    });
    this.initNmTableArray();
    this.initTable();
    this.functionUsageTbl?.addEventListener('row-click', (evt) => {
      // @ts-ignore
      let title = `${this.titleEl!.textContent}/${evt.detail.data.symbolName}`;
      this.clickRight(evt, title);
    });
    let exportHandlerMap = new Map<string, (value: any) => string>();
    exportHandlerMap.set('existSizeFormat', (value) => {
      return `${value['existSize']}`;
    });
    exportHandlerMap.set('applySizeFormat', (value) => {
      return `${value['applySize']}`;
    });
    exportHandlerMap.set('releaseSizeFormat', (value) => {
      return `${value['releaseSize']}`;
    });
    this.tableType!.exportTextHandleMap = exportHandlerMap;
    this.threadUsageTbl!.exportTextHandleMap = exportHandlerMap;
    this.soUsageTbl!.exportTextHandleMap = exportHandlerMap;
    this.functionUsageTbl!.exportTextHandleMap = exportHandlerMap;
  }

  private clickRight(evt: any, title: string): void {
    if (evt.detail.button === 2) {
      let treeTab = this.parentElement?.parentElement?.querySelector<TabpaneNMCalltree>(
        '#box-native-calltree > tabpane-nm-calltree'
      );
      treeTab!.analysisTabWidth = this.clientWidth;
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
      if (!InitAnalysis.getInstance().isInitAnalysis) {
        treeTab?.initUI();
        treeTab?.filterByAnalysis();
      } else {
        treeTab!.initFromAnalysis = true;
        treeTab!.data = this.currentSelection;
        InitAnalysis.getInstance().isInitAnalysis = false;
      }

      treeTab!.banTypeAndLidSelect();
      treeTab!.titleBoxShow = true;
      treeTab!.titleTxt = title;
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
      (results: any) => {
        this.processData = JSON.parse(JSON.stringify(results));
        this.getNMTypeSize(val, this.processData);
      }
    );
  }

  private getDataByWorkerQuery(args: any, handler: Function): void {
    this.progressEL!.loading = true;
    procedurePool.submitWithName('logic0', 'native-memory-queryAnalysis', args, undefined, (results: any) => {
      handler(results);
      this.progressEL!.loading = false;
    });
  }

  private reset(showTable: LitTable, isShowBack: boolean): void {
    this.clearData();
    if (isShowBack) {
      this.nmBack!.style.visibility = 'visible';
    } else {
      this.nmBack!.style.visibility = 'hidden';
    }
    if (this.nmTableArray) {
      for (let table of this.nmTableArray) {
        if (table === showTable) {
          initSort(table, this.nmSortColumn, this.nmSortType);
          table.style.display = 'grid';
          table.setAttribute('hideDownload', '');
        } else {
          table!.style.display = 'none';
          table!.removeAttribute('hideDownload');
        }
      }
    }
  }

  private clearData(): void {
    this.nmPieChart!.dataSource = [];
    this.tableType!.recycleDataSource = [];
    this.threadUsageTbl!.recycleDataSource = [];
    this.soUsageTbl!.recycleDataSource = [];
    this.functionUsageTbl!.recycleDataSource = [];
  }

  private showAssignLevel(
    showNMTable: LitTable,
    hideNMTable: LitTable,
    currentLevel: number,
    currentLevelData: Array<any>
  ): void {
    showNMTable!.style.display = 'grid';
    hideNMTable!.style.display = 'none';
    hideNMTable.setAttribute('hideDownload', '');
    showNMTable?.removeAttribute('hideDownload');
    this.currentLevel = currentLevel;
    this.currentLevelData = currentLevelData;
  }

  private getBack(): void {
    this.nmBack!.addEventListener('click', () => {
      if (this.tabName!.textContent === 'Statistic By Thread Existing') {
        this.showAssignLevel(this.tableType!, this.threadUsageTbl!, 0, this.eventTypeData);
        this.nmBack!.style.visibility = 'hidden';
        this.typePieChart();
      } else if (this.tabName!.textContent === 'Statistic By Library Existing') {
        if (this.hideThreadCheckBox?.checked || this.isStatistic) {
          this.showAssignLevel(this.tableType!, this.soUsageTbl!, 0, this.eventTypeData);
          this.nmBack!.style.visibility = 'hidden';
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

  private typePieChart(): void {
    this.nmPieChart!.config = {
      appendPadding: 0,
      data: this.getPieChartData(this.eventTypeData),
      angleField: 'existSize',
      colorField: 'tableName',
      radius: 1,
      label: {
        type: 'outer',
      },
      tip: (typeTipValue): string => {
        return `<div>   
                    <div>Memory Type:${typeTipValue.obj.tableName}</div>
                    <div>Existing:${typeTipValue.obj.existSizeFormat} (${typeTipValue.obj.existSizePercent}%)</div>
                    <div># Existing:${typeTipValue.obj.existCount} (${typeTipValue.obj.existCountPercent}%)</div>
                    <div>Total Bytes:${typeTipValue.obj.applySizeFormat} (${typeTipValue.obj.applySizePercent}%)</div>
                    <div># Total:${typeTipValue.obj.applyCount} (${typeTipValue.obj.applyCountPercent}%)</div>
                    <div>Transient:${typeTipValue.obj.releaseSizeFormat} (${typeTipValue.obj.releaseSizePercent}%)</div>
                    <div># Transient:${typeTipValue.obj.releaseCount} (${typeTipValue.obj.releaseCountPercent}%)</div>
                </div>`;
      },
      angleClick: (it): void => {
        // @ts-ignore
        if (it.tableName != 'other') {
          this.nativeProcessLevelClickEvent(it);
        }
      },
      hoverHandler: (nmData): void => {
        if (nmData) {
          this.tableType!.setCurrentHover(nmData);
        } else {
          this.tableType!.mouseOut();
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
    this.tableType!.recycleDataSource = this.eventTypeData;
    // @ts-ignore
    this.eventTypeData.shift(this.typeStatisticsData);
    this.tableType?.reMeauseHeight();
    this.currentLevelData = this.eventTypeData;
  }

  private threadPieChart(): void {
    this.nmPieChart!.config = {
      appendPadding: 0,
      data: this.getPieChartData(this.threadData),
      angleField: 'existSize',
      colorField: 'tableName',
      radius: 1,
      label: {
        type: 'outer',
      },
      tip: (threadTipValue): string => {
        return `<div>
                    <div>Thread:${threadTipValue.obj.tableName}</div>
                    <div>Existing:${threadTipValue.obj.existSizeFormat} (${threadTipValue.obj.existSizePercent}%)</div>
                    <div># Existing:${threadTipValue.obj.existCount} (${threadTipValue.obj.existCountPercent}%)</div>
                    <div>Total Bytes:${threadTipValue.obj.applySizeFormat} (${threadTipValue.obj.applySizePercent}%)</div>
                    <div># Total:${threadTipValue.obj.applyCount} (${threadTipValue.obj.applyCountPercent}%)</div>
                    <div>Transient:${threadTipValue.obj.releaseSizeFormat} (${threadTipValue.obj.releaseSizePercent}%)</div>
                    <div># Transient:${threadTipValue.obj.releaseCount} (${threadTipValue.obj.releaseCountPercent}%)</div>
                </div>`;
      },
      angleClick: (it: any): void => {
        // @ts-ignore
        if (it.tid != 'other') {
          this.nativeThreadLevelClickEvent(it);
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
    const typeName = this.type === TYPE_MAP_STRING ? TYPE_OTHER_MMAP : this.type;
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

  private getLibraryTipValue(libraryTipValue: any): string {
    return `<div>
                    <div>Library:${libraryTipValue.obj.libName}</div>
                    <div>Existing:${libraryTipValue.obj.existSizeFormat} 
                    (${libraryTipValue.obj.existSizePercent}%)</div>
                    <div># Existing:${libraryTipValue.obj.existCount} 
                    (${libraryTipValue.obj.existCountPercent}%)</div>
                    <div>Total Bytes:${libraryTipValue.obj.applySizeFormat} 
                    (${libraryTipValue.obj.applySizePercent}%)</div>
                    <div># Total:${libraryTipValue.obj.applyCount} 
                    (${libraryTipValue.obj.applyCountPercent}%)</div>
                    <div>Transient:${libraryTipValue.obj.releaseSizeFormat} 
                    (${libraryTipValue.obj.releaseSizePercent}%)</div>
                    <div># Transient:${libraryTipValue.obj.releaseCount} 
                    (${libraryTipValue.obj.releaseCountPercent}%)</div>
                </div>`;
  }

  private libraryPieChart(item?: any): void {
    this.nmPieChart!.config = {
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
        if (it.tableName != 'other') {
          this.nativeSoLevelClickEvent(it);
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
    const typeName = this.type === TYPE_MAP_STRING ? TYPE_OTHER_MMAP : this.type;
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
    this.nmPieChart!.config = {
      appendPadding: 0,
      data: this.getPieChartData(this.functionData),
      angleField: 'existSize',
      colorField: 'tableName',
      radius: 1,
      label: {
        type: 'outer',
      },
      tip: (functionTipValue): string => {
        return `<div>
                    <div>Function:${functionTipValue.obj.symbolName}</div>
                    <div>Existing:${functionTipValue.obj.existSizeFormat} 
                    (${functionTipValue.obj.existSizePercent}%)</div>
                    <div># Existing:${functionTipValue.obj.existCount} 
                    (${functionTipValue.obj.existCountPercent}%)</div>
                    <div>Total Bytes:${functionTipValue.obj.applySizeFormat} 
                    (${functionTipValue.obj.applySizePercent}%)</div>
                    <div># Total:${functionTipValue.obj.applyCount} 
                    (${functionTipValue.obj.applyCountPercent}%)</div>
                    <div>Transient:${functionTipValue.obj.releaseSizeFormat} 
                    (${functionTipValue.obj.releaseSizePercent}%)</div>
                    <div># Transient:${functionTipValue.obj.releaseCount} 
                    (${functionTipValue.obj.releaseCountPercent}%)</div>
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

  private nativeProcessLevelClickEvent(it: any): void {
    if (this.hideThreadCheckBox?.checked || this.isStatistic) {
      this.reset(this.soUsageTbl!, true);
      this.getNMLibSize(it);
    } else {
      this.reset(this.threadUsageTbl!, true);
      this.getNMThreadSize(it);
    }
    const typeName = it.typeName === TYPE_MAP_STRING ? TYPE_OTHER_MMAP : it.typeName;
    this.titleEl!.textContent = typeName;
    // @ts-ignore
    this.type = it.typeName;
    this.nmPieChart?.hideTip();
  }

  private nativeThreadLevelClickEvent(it: AnalysisObj): void {
    this.reset(this.soUsageTbl!, true);
    this.getNMLibSize(it);
    const typeName = this.type === TYPE_MAP_STRING ? TYPE_OTHER_MMAP : this.type;

    // @ts-ignore
    let title = typeName;
    if (!this.hideThreadCheckBox?.checked) {
      this.threadName = `Thread(${it.tid})`;
      title += ` / ${this.threadName}`;
    }
    this.titleEl!.textContent = title;
    this.nmPieChart?.hideTip();
  }

  private nativeSoLevelClickEvent(it: any): void {
    this.reset(this.functionUsageTbl!, true);
    this.getNMFunctionSize(it);
    const typeName = this.type === TYPE_MAP_STRING ? TYPE_OTHER_MMAP : this.type;
    // @ts-ignore
    let title = typeName || '';
    if (!this.hideThreadCheckBox?.checked && this.threadName.length > 0) {
      title += ` / ${this.threadName}`;
    }
    if (it.libName.length > 0) {
      title += ` / ${it.libName}`;
    }
    this.titleEl!.textContent = title;
    this.nmPieChart?.hideTip();
  }

  private getNMEventTypeSize(val: SelectionParam): void {
    this.progressEL!.loading = true;
    let typeFilter = [];
    if (this.isStatistic) {
      for (let type of val.nativeMemoryStatistic) {
        if (type === 'All Heap & Anonymous VM') {
          typeFilter = [0, 1];
          break;
        } else if (type === 'All Heap') {
          typeFilter.push(0);
        } else {
          typeFilter.push(1);
        }
      }
      this.getDataFromWorker(val, typeFilter);
    } else {
      for (let type of val.nativeMemory) {
        if (type === 'All Heap & Anonymous VM') {
          typeFilter = [];
          typeFilter.push(...['\'AllocEvent\'', '\'FreeEvent\'', '\'MmapEvent\'', '\'MunmapEvent\'']);
          break;
        } else if (type === 'All Heap') {
          typeFilter.push(...['\'AllocEvent\'', '\'FreeEvent\'']);
        } else {
          typeFilter.push(...['\'MmapEvent\'', '\'MunmapEvent\'']);
        }
      }
      this.getDataFromWorker(val, typeFilter);
    }
  }

  private getNMTypeSize(val: SelectionParam, result: any): void {
    this.resetCurrentLevelData();
    this.typeMap = this.typeSizeGroup(this.processData);
    this.currentLevelExistSize = this.currentLevelApplySize - this.currentLevelReleaseSize;
    this.currentLevelExistCount = this.currentLevelApplyCount - this.currentLevelReleaseCount;
    this.eventTypeData = [];
    if (this.typeMap.has(TYPE_ALLOC)) {
      let allocType = this.setTypeMap(this.typeMap, TYPE_ALLOC, TYPE_ALLOC_STRING);
      if (allocType) {
        this.calPercent(allocType);
        this.eventTypeData.push(allocType);
      }
    }
    if (this.typeMap.has(TYPE_MAP)) {
      let subTypeMap = new Map<string, Array<number | string>>();
      for (let item of this.typeMap.get(TYPE_MAP)!) {
        if (item.subType) {
          if (subTypeMap.has(item.subType)) {
            subTypeMap.get(item.subType)?.push(item);
          } else {
            let dataArray = new Array<number | string>();
            dataArray.push(item);
            subTypeMap.set(item.subType, dataArray);
          }
        } else {
          if (subTypeMap.has(TYPE_MAP_STRING)) {
            subTypeMap.get(TYPE_MAP_STRING)?.push(item);
          } else {
            let dataArray = new Array<number | string>();
            dataArray.push(item);
            subTypeMap.set(TYPE_MAP_STRING, dataArray);
          }
        }
      }
      subTypeMap.forEach((arr: Array<number | string>, subType: string) => {
        let mapType = this.setTypeMap(this.typeMap, TYPE_MAP, subType);
        if (mapType) {
          this.calPercent(mapType);
          this.eventTypeData.push(mapType);
        }
      });
    }
    this.eventTypeData.sort((a, b) => b.existSize - a.existSize);
    this.typeStatisticsData = this.totalData(this.typeStatisticsData);
    this.progressEL!.loading = false;
    this.currentLevel = 0;
    this.typePieChart();
  }

  private getNMThreadSize(item: any): void {
    this.progressEL!.loading = true;
    let threadMap = new Map<number, Array<number | string>>();
    let types = this.getTypes(item);
    let typeName = item.typeName;
    this.resetCurrentLevelData(item);
    for (let itemData of this.processData) {
      // @ts-ignore
      if (this.shouldSkipItem(typeName, types, itemData)) {
        continue;
      }
      if (threadMap.has(itemData.tid)) {
        threadMap.get(itemData.tid)?.push(itemData);
      } else {
        let itemArray = new Array<number | string>();
        itemArray.push(itemData);
        threadMap.set(itemData.tid, itemArray);
      }
    }
    this.threadData = [];
    threadMap.forEach((dbData: Array<any>, tid: number) => {
      const sizeObj = this.calSizeObj(dbData);
      let analysis = new AnalysisObj(sizeObj.applySize, sizeObj.applyCount, sizeObj.releaseSize, sizeObj.releaseCount);
      this.calPercent(analysis);
      analysis.typeId = item.typeId;
      analysis.typeName = item.typeName;
      analysis.tid = tid;
      if (dbData[0].threadName && dbData[0].threadName.length > 0) {
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

  private shouldSkipItem(typeName: string, types: Array<number | string>, itemData: any): boolean {
    if (typeName === TYPE_ALLOC_STRING) {
      // @ts-ignore
      return !types.includes(itemData.type);
    } else if (typeName === TYPE_MAP_STRING) {
      if (this.isStatistic) {
        if (itemData.subType) {
          // @ts-ignore
          return !types.includes(itemData.subType) || !types.includes(itemData.type);
        } else {
          return true;
        }
      } else {
        if (!itemData.subType) {
          // @ts-ignore
          return !types.includes(itemData.type);
        } else {
          return true;
        }
      }
    } else {
      if (itemData.subType) {
        // @ts-ignore
        return !types.includes(itemData.subType) || !types.includes(itemData.type);
      } else {
        return true;
      }
    }
  }


  private getNMLibSize(item: any): void {
    this.progressEL!.loading = true;
    let typeId = item.typeId;
    let typeName = item.typeName;
    let tid = item.tid;
    let libMap = new Map<number, Array<number | string>>();
    this.resetCurrentLevelData(item);
    let types = this.getTypes(item);
    this.soData = [];
    if (!this.processData) return;
    for (let itemData of this.processData) {
      if (this.shouldSkipItem(typeName, types, itemData)) {
        continue;
      }
      if (tid !== undefined && tid !== itemData.tid) {
        continue;
      }
      let libId = itemData.libId;
      if (libMap.has(libId)) {
        libMap.get(libId)?.push(itemData);
      } else {
        let dataArray = new Array<number | string>();
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

  private getNMFunctionSize(item: any): void {
    this.progressEL!.loading = true;
    this.shadowRoot!.querySelector<HTMLDivElement>('.nm-subheading')!.textContent = 'Statistic By Function Existing';
    let typeId = item.typeId;
    let typeName = item.typeName;
    let tid = item.tid;
    let libId = item.libId;
    let symbolMap = new Map<number, Array<number | string>>();
    this.resetCurrentLevelData(item);
    let types = this.getTypes(item);
    if (!this.processData) {
      return;
    }
    for (let data of this.processData) {
      if (this.shouldSkipItem(typeName, types, data)) {
        continue;
      }
      if (tid !== undefined && tid !== data.tid) {
        continue;
      }
      if (symbolMap.has(data.symbolId)) {
        symbolMap.get(data.symbolId)?.push(data);
      } else {
        let dataArray = new Array<number | string>();
        dataArray.push(data);
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
      analysis.libId = libId;
      analysis.libName = item.libName;
      analysis.symbolId = symbolId;
      analysis.symbolName = symbolName;
      analysis.tableName = analysis.symbolName;
      this.functionData.push(analysis);
    });
    this.baseSort(this.functionData);
    this.functionPieChart();
  }

  private baseSort(data: Array<AnalysisObj>): void {
    if (data === this.functionData) {
      this.functionData.sort((a, b) => b.existSize - a.existSize);
      // @ts-ignore
      this.functionStatisticsData = this.totalData(this.functionStatisticsData);
      this.currentLevel = 3;
      this.progressEL!.loading = false;
    }
    ;
    if (data === this.soData) {
      this.soData.sort((a, b) => b.existSize - a.existSize);
      this.libStatisticsData = this.totalData(this.libStatisticsData);
      this.currentLevel = 2;
      this.progressEL!.loading = false;
    }
  }

  private getPieChartData(res: any[]): unknown[] {
    if (res.length > PIE_CHART_LIMIT) {
      let pieChartArr: string[] = [];
      let other: any = {
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
          pieChartArr.push(res[i]);
        } else {
          other.existCount += res[i].existCount;
          other.existSize += res[i].existSize;
          other.applySize += res[i].applySize;
          other.applyCount += res[i].applyCount;
          other.releaseSize += res[i].releaseSize;
          other.releaseCount += res[i].releaseCount;
          other.existSizeFormat = Utils.getBinaryByteWithUnit(other.existSize);
          other.applySizeFormat = Utils.getBinaryByteWithUnit(other.applySize);
          other.releaseSizeFormat = Utils.getBinaryByteWithUnit(other.releaseSize);
          other.existSizePercent = ((other.existSize / this.currentLevelExistSize) * 100).toFixed(2);
          other.existCountPercent = ((other.existCount / this.currentLevelExistCount) * 100).toFixed(2);
          other.applySizePercent = ((other.applySize / this.currentLevelApplySize) * 100).toFixed(2);
          other.applyCountPercent = ((other.applyCount / this.currentLevelApplyCount) * 100).toFixed(2);
          other.releaseSizePercent = ((other.releaseSize / this.currentLevelReleaseSize) * 100).toFixed(2);
          other.releaseCountPercent = ((other.releaseCount / this.currentLevelReleaseCount) * 100).toFixed(2);
        }
      }
      pieChartArr.push(other);
      return pieChartArr;
    }
    return res;
  }

  private setTypeMap(typeMap: Map<number, any>, tyeId: number, typeName: string): AnalysisObj | null {
    let applySize = 0;
    let releaseSize = 0;
    let applyCount = 0;
    let releaseCount = 0;
    let currentType = typeMap.get(tyeId);
    if (!currentType) {
      return null;
    }

    for (let applySample of typeMap.get(tyeId)!) {
      if (
        tyeId === TYPE_ALLOC ||
        (applySample.subType && applySample.subType === typeName) ||
        (!applySample.subType && typeName === TYPE_MAP_STRING)
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
    typeItem.tableName = typeName === TYPE_MAP_STRING ? TYPE_OTHER_MMAP : typeName;
    return typeItem;
  }

  private calPercent(item: AnalysisObj): void {
    item.applySizePercent = ((item.applySize / this.currentLevelApplySize) * 100).toFixed(2);
    item.applyCountPercent = ((item.applyCount / this.currentLevelApplyCount) * 100).toFixed(2);
    item.releaseSizePercent = ((item.releaseSize / this.currentLevelReleaseSize) * 100).toFixed(2);
    item.releaseCountPercent = ((item.releaseCount / this.currentLevelReleaseCount) * 100).toFixed(2);
    item.existSizePercent = ((item.existSize / this.currentLevelExistSize) * 100).toFixed(2);
    item.existCountPercent = ((item.existCount / this.currentLevelExistCount) * 100).toFixed(2);
  }

  private resetCurrentLevelData(parent?: any): void {
    if (parent) {
      this.currentLevelApplySize = parent.applySize;
      this.currentLevelApplyCount = parent.applyCount;
      this.currentLevelExistSize = parent.existSize;
      this.currentLevelExistCount = parent.existCount;
      this.currentLevelReleaseSize = parent.releaseSize;
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

    let that = this;

    function setSize(item: any): void {
      that.currentLevelApplySize += item.size;
      that.currentLevelApplyCount += item.count;
      if (that.isStatistic) {
        that.currentLevelReleaseSize += item.releaseSize;
        that.currentLevelReleaseCount += item.releaseCount;
      } else {
        if (item.isRelease) {
          that.currentLevelReleaseSize += item.size;
          that.currentLevelReleaseCount += item.count;
        }
      }
    }

    for (let itemData of dbArray) {
      // @ts-ignore
      switch (itemData.type) {
        case TYPE_ALLOC:
          setSize(itemData);
          if (typeMap.has(TYPE_ALLOC)) {
            typeMap.get(TYPE_ALLOC)?.push(itemData);
          } else {
            let itemArray = new Array<number | string>();
            itemArray.push(itemData);
            typeMap.set(TYPE_ALLOC, itemArray);
          }
          break;
        case TYPE_MAP:
          setSize(itemData);
          if (typeMap.has(TYPE_MAP)) {
            typeMap.get(TYPE_MAP)?.push(itemData);
          } else {
            let itemArray = new Array<number | string>();
            itemArray.push(itemData);
            typeMap.set(TYPE_MAP, itemArray);
          }
          break;
      }
    }
    return typeMap;
  }

  private calSizeObj(dbData: Array<any>): SizeObj {
    let sizeObj = new SizeObj();
    for (let item of dbData) {
      if (this.isStatistic) {
        sizeObj.applyCount += item.count;
        sizeObj.applySize += item.size;
        sizeObj.releaseCount += item.releaseCount;
        sizeObj.releaseSize += item.releaseSize;
      } else {
        // @ts-ignore
        sizeObj.applyCount += item.count;
        sizeObj.applySize += item.size;
        if (item.isRelease) {
          sizeObj.releaseCount += item.count;
          sizeObj.releaseSize += item.size;
        }
      }
    }
    return sizeObj;
  }

  private getTypes(parent: AnalysisObj): Array<number | string> {
    let types = new Array<number | string>();
    types.push(parent.typeId!);
    types.push(parent.typeName!);
    if (!this.isStatistic) {
      let releaseType;
      if (parent.typeId === TYPE_ALLOC) {
        releaseType = TYPE_FREE;
      } else {
        releaseType = TYPE_UN_MAP;
      }
      types.push(releaseType);
    }
    return types;
  }

  private totalData(total: {}): {} {
    total = {
      existSizeFormat: Utils.getBinaryByteWithUnit(this.currentLevelExistSize),
      existSizePercent: ((this.currentLevelExistSize / this.currentLevelExistSize) * 100).toFixed(2),
      existCount: this.currentLevelExistCount,
      existCountPercent: ((this.currentLevelExistCount / this.currentLevelExistCount) * 100).toFixed(2),
      releaseSizeFormat: Utils.getBinaryByteWithUnit(this.currentLevelReleaseSize),
      releaseSizePercent: ((this.currentLevelReleaseSize / this.currentLevelReleaseSize) * 100).toFixed(2),
      releaseCount: this.currentLevelReleaseCount,
      releaseCountPercent: ((this.currentLevelReleaseCount / this.currentLevelReleaseCount) * 100).toFixed(2),
      applySizeFormat: Utils.getBinaryByteWithUnit(this.currentLevelApplySize),
      applySizePercent: ((this.currentLevelApplySize / this.currentLevelApplySize) * 100).toFixed(2),
      applyCount: this.currentLevelApplyCount,
      applyCountPercent: ((this.currentLevelApplyCount / this.currentLevelApplyCount) * 100).toFixed(2),
      existSize: 0,
      tableName: '',
      tName: '',
      libName: '',
      symbolName: '',
    };
    return total;
  }

  private getNmCurrentTable(): LitTable | null | undefined {
    let nmCurrentTable: LitTable | null | undefined;
    switch (this.currentLevel) {
      case 0:
        nmCurrentTable = this.tableType;
        break;
      case 1:
        nmCurrentTable = this.threadUsageTbl;
        break;
      case 2:
        nmCurrentTable = this.soUsageTbl;
        break;
      case 3:
        nmCurrentTable = this.functionUsageTbl;
        break;
    }
    return nmCurrentTable;
  }

  private getSortedColumnZeroArr(data: any[]): any[] {
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

  private updateSortColumnArr(sortColumnArr: any[]): any[] {
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


  private caseTableName(statisticAnalysisLeftData: { tableName: number; }, statisticAnalysisRightData: { tableName: number; }): number {
    if (this.nmSortType === 1) {
      if (statisticAnalysisLeftData.tableName > statisticAnalysisRightData.tableName) {
        return 1;
      } else if (statisticAnalysisLeftData.tableName === statisticAnalysisRightData.tableName) {
        return 0;
      } else {
        return -1;
      }
    } else {
      if (statisticAnalysisRightData.tableName > statisticAnalysisLeftData.tableName) {
        return 1;
      } else if (statisticAnalysisLeftData.tableName === statisticAnalysisRightData.tableName) {
        return 0;
      } else {
        return -1;
      }
    }
  }

  private sortDataByExistSize(sortType: number, sortColumnArr: Array<any>): any[] {
    return sortColumnArr.sort((statisticAnalysisLeftData, statisticAnalysisRightData) => {
      return sortType === 1
        ? statisticAnalysisLeftData.existSize - statisticAnalysisRightData.existSize
        : statisticAnalysisRightData.existSize - statisticAnalysisLeftData.existSize;
    });
  }

  private sortDataByExistCount(sortType: number, sortColumnArr: Array<any>): any[] {
    return sortColumnArr.sort((statisticAnalysisLeftData, statisticAnalysisRightData) => {
      return sortType === 1
        ? statisticAnalysisLeftData.existCount - statisticAnalysisRightData.existCount
        : statisticAnalysisRightData.existCount - statisticAnalysisLeftData.existCount;
    });
  }

  private sortDataByReleaseSize(sortType: number, sortColumnArr: Array<any>): any[] {
    return sortColumnArr.sort((statisticAnalysisLeftData, statisticAnalysisRightData) => {
      return sortType === 1
        ? statisticAnalysisLeftData.releaseSize - statisticAnalysisRightData.releaseSize
        : statisticAnalysisRightData.releaseSize - statisticAnalysisLeftData.releaseSize;
    });
  }

  private sortDataByReleaseCount(sortType: number, sortColumnArr: Array<any>): any[] {
    return sortColumnArr.sort((statisticAnalysisLeftData, statisticAnalysisRightData) => {
      return sortType === 1
        ? statisticAnalysisLeftData.releaseCount - statisticAnalysisRightData.releaseCount
        : statisticAnalysisRightData.releaseCount - statisticAnalysisLeftData.releaseCount;
    });
  }

  private sortDataByApplySize(sortType: number, sortColumnArr: Array<any>): any[] {
    return sortColumnArr.sort((statisticAnalysisLeftData, statisticAnalysisRightData) => {
      return sortType === 1
        ? statisticAnalysisLeftData.applySize - statisticAnalysisRightData.applySize
        : statisticAnalysisRightData.applySize - statisticAnalysisLeftData.applySize;
    });
  }

  private sortDataByApplyCount(sortType: number, sortColumnArr: Array<any>): any[] {
    return sortColumnArr.sort((statisticAnalysisLeftData, statisticAnalysisRightData) => {
      return sortType === 1
        ? statisticAnalysisLeftData.applyCount - statisticAnalysisRightData.applyCount
        : statisticAnalysisRightData.applyCount - statisticAnalysisLeftData.applyCount;
    });
  }

  private sortByColumn(): void {
    let nmCurrentTable = this.getNmCurrentTable();
    if (!nmCurrentTable) {
      return;
    }
    if (this.nmSortType === 0) {
      nmCurrentTable!.recycleDataSource = this.getSortedColumnZeroArr(this.currentLevelData);
    } else {
      let sortColumnArr = [...this.currentLevelData];
      switch (this.nmSortColumn) {
        case 'tableName':
          nmCurrentTable!.recycleDataSource = sortColumnArr.sort(this.caseTableName);
          break;
        case 'existSizeFormat':
        case 'existSizePercent':
          nmCurrentTable!.recycleDataSource = this.sortDataByExistSize(this.nmSortType, sortColumnArr);
          break;
        case 'existCount':
        case 'existCountPercent':
          nmCurrentTable!.recycleDataSource = this.sortDataByExistCount(this.nmSortType, sortColumnArr);
          break;
        case 'releaseSizeFormat':
        case 'releaseSizePercent':
          nmCurrentTable!.recycleDataSource = this.sortDataByReleaseSize(this.nmSortType, sortColumnArr);
          break;
        case 'releaseCount':
        case 'releaseCountPercent':
          nmCurrentTable!.recycleDataSource = this.sortDataByReleaseCount(this.nmSortType, sortColumnArr);
          break;
        case 'applySizeFormat':
        case 'applySizePercent':
          nmCurrentTable!.recycleDataSource = this.sortDataByApplySize(this.nmSortType, sortColumnArr);
          break;
        case 'applyCount':
        case 'applyCountPercent':
          nmCurrentTable!.recycleDataSource = this.sortDataByApplyCount(this.nmSortType, sortColumnArr);
          break;
      }
      sortColumnArr = this.updateSortColumnArr(sortColumnArr);
      nmCurrentTable!.recycleDataSource = sortColumnArr;
    }
  }

  public connectedCallback(): void {
    new ResizeObserver(() => {
      // @ts-ignore
      if (this.parentElement?.clientHeight != 0) {
        if (this.tableType) {
          // @ts-ignore
          this.tableType.shadowRoot.querySelector('.table').style.height = this.parentElement.clientHeight - 40 + 'px';
        }
        this.tableType?.reMeauseHeight();
        if (this.soUsageTbl) {
          // @ts-ignore
          this.soUsageTbl.shadowRoot.querySelector('.table').style.height = this.parentElement.clientHeight - 40 + 'px';
        }
        if (this.functionUsageTbl) {
          // @ts-ignore
          this.functionUsageTbl.shadowRoot.querySelector('.table').style.height =
            this.parentElement!.clientHeight - 40 + 'px';
        }
        this.soUsageTbl?.reMeauseHeight();
        this.functionUsageTbl?.reMeauseHeight();
        if ((this.parentElement!.clientHeight >= 0 && this.parentElement!.clientHeight <= 31) || this.isStatistic) {
          this.filterEl!.style.display = 'none';
          this.nmPieChart!.style.marginBottom = '0px';
          this.nmTableBox!.style.marginBottom = '0px';
        } else {
          this.filterEl!.style.display = 'flex';
        }
      }
    }).observe(this.parentElement!);
  }

  initHtml(): string {
    return TabPaneNMStatisticAnalysisHtml;
  }
}
