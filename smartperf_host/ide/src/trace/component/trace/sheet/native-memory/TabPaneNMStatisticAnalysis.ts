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
import { TabPaneFilter } from '../TabPaneFilter';
import { LitCheckBox } from '../../../../../base-ui/checkbox/LitCheckBox';
import { initSort } from '../SheetUtils';
import { TabpaneNMCalltree } from './TabPaneNMCallTree';
import { FilterByAnalysis } from '../../../../bean/NativeHook';
import { InitAnalysis } from '../../../../database/logic-worker/ProcedureLogicWorkerCommon';
import { TabPaneNMStatisticAnalysisHtml } from './TabPaneNMStatisticAnalysis.html';
import { MemoryTraceRowType, MemoryType } from '../../../../bean/MemoryEnum';
import { AnalysisObj } from '../../../../bean/MemoryAnalysisStruct';
import { AnalysisUICallback, MemoryAnalysisDataLogic } from '../../base/MemoryAnalysisData';

// Mmap存在子类型，没有子类型的Mmap事件记为OtherMmap
const TYPE_MAP_STRING = MemoryType.MEMORY_M_MAP_NAME;
const TYPE_OTHER_MMAP = 'Other MmapEvent';

@element('tabpane-nm-statistic-analysis')
export class TabPaneNMStatisticAnalysis extends BaseElement implements AnalysisUICallback {
  private currentSelection: SelectionParam | undefined;
  private nmPieChart: LitChartPie | null | undefined; // 饼图
  private nmTableBox: HTMLDivElement | undefined | null; // 父容器
  private typeUsageTbl: LitTable | null | undefined; // 类型页
  private threadUsageTbl: LitTable | null | undefined; // 线程页
  private soUsageTbl: LitTable | null | undefined; // lib页
  private functionUsageTbl: LitTable | null | undefined; // 函数页
  private range: HTMLLabelElement | null | undefined; // 右上角时间范围
  private nmBack: HTMLDivElement | null | undefined; // 返回按钮
  private tabName: HTMLDivElement | null | undefined; // 饼图上方标题
  private progressEL: LitProgressBar | null | undefined;
  private titleEl: HTMLDivElement | undefined | null; // 饼图左上角标题
  private filterEl: TabPaneFilter | undefined | null; // 左下Options 选项
  private hideThreadCheckBox: LitCheckBox | undefined | null; // 隐藏线程选项
  private nmTableArray: NodeListOf<LitTable> | undefined | null;  // [类型页,线程页,Lib页.函数页]


  private threadName: string = '';
  private type: string = ''; // 当前层级的EventType
  private isStatistic = false; // 是否统计模式
  private currentLevel = -1;  // 当前选中的层级，类型为0，线程为1。。。

  private nmSortColumn: string = ''; // 右侧列表页排序列
  private nmSortType: number = 0; // 列表页排序方式

  private typeStatisticsData!: AnalysisObj; // 点击的类型统计数据
  private threadStatisticsData!: AnalysisObj; // 点击的线程统计数据
  private libStatisticsData!: AnalysisObj; // 点击的Lib统计数据
  private functionStatisticsData!: AnalysisObj; // 点击的函数统计数据
  private currentLevelData!: Array<AnalysisObj>; // 当前层级所有数据

  private dataLogic?: MemoryAnalysisDataLogic;

  get titleTxt(): string | null {
    return this.titleEl!.textContent;
  }

  set data(analysisParam: SelectionParam) {
    this.isStatistic = analysisParam.nativeMemory.length === 0;
    if (!this.dataLogic) {
      this.dataLogic = new MemoryAnalysisDataLogic();
    }
    this.dataLogic.setUiInterface(this);
    this.dataLogic.init(MemoryTraceRowType.ROW_TYPE_NATIVE_MEMORY, this.isStatistic);
    if (analysisParam === this.currentSelection) {
      this.hideThreadCheckBox!.checked = false;
      const eventTypeData = this.dataLogic.getEventTypeData();
      if (eventTypeData) {
        eventTypeData.unshift(this.typeStatisticsData);
        this.typeUsageTbl!.recycleDataSource = eventTypeData;
        eventTypeData.shift();
      }
      return;
    }
    this.dataLogic.setCurrentSelectIPid(analysisParam.nativeMemoryCurrentIPid);
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
    this.typeUsageTbl!.addEventListener('row-click', (evt) => {
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
    this.typeUsageTbl = this.shadowRoot!.querySelector<LitTable>('#tb-eventtype-usage');
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
      this.reset(this.typeUsageTbl!, false);
      this.showAssignLevel(this.typeUsageTbl!, this.functionUsageTbl!, 0, this.dataLogic!.getEventTypeData());
      this.dataLogic!.getTypeSize();
    });
    this.initNmTableArray();
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
      let treeTab = this.parentElement?.parentElement?.querySelector<TabpaneNMCalltree>(
        '#box-native-calltree > tabpane-nm-calltree'
      );
      treeTab!.analysisTabWidth = this.clientWidth; // @ts-ignore
      const data = evt.detail.data as AnalysisObj;
      let typeName = data.typeName;
      if (MemoryType.APPLY_NM_EVENTS.includes(data.typeName as string)) {
        typeName = `Other ${data.typeName}`;
      }

      treeTab!.filterData = new FilterByAnalysis(
        data.typeId,
        typeName,
        data.tName,
        data.tid,
        data.libId,
        data.libName,
        data.symbolId,
        data.symbolName
      );
      // 首次打开初始化数据 非首次初始化UI
      if (!InitAnalysis.getInstance().isInitAnalysis) {
        treeTab?.initUI(this.currentSelection!);
        treeTab?.filterByAnalysis();
      } else {
        treeTab!.initFromAnalysis = true;
        treeTab!.data = this.currentSelection!;
        InitAnalysis.getInstance().isInitAnalysis = false;
      }

      treeTab!.banTypeAndLidSelect();
      treeTab!.titleBoxShow = true;
      treeTab!.titleTxt = title;
    }
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
          table!.removeAttribute('hideDownload');
        } else {
          table!.style.display = 'none';
          table.setAttribute('hideDownload', '');
        }
      }
    }
  }

  private clearData(): void {
    this.nmPieChart!.dataSource = [];
    this.typeUsageTbl!.recycleDataSource = [];
    this.threadUsageTbl!.recycleDataSource = [];
    this.soUsageTbl!.recycleDataSource = [];
    this.functionUsageTbl!.recycleDataSource = [];
  }

  private showAssignLevel(
    showNMTable: LitTable,
    hideNMTable: LitTable,
    currentLevel: number,
    currentLevelData: Array<AnalysisObj>
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
      const eventTypeData = this.dataLogic!.getEventTypeData()

      if (this.tabName!.textContent === 'Statistic By Thread Existing') {
        this.showAssignLevel(this.typeUsageTbl!, this.threadUsageTbl!, 0, eventTypeData);
        this.nmBack!.style.visibility = 'hidden';
        this.typePieChart(eventTypeData);
      } else if (this.tabName!.textContent === 'Statistic By Library Existing') {
        if (this.hideThreadCheckBox?.checked || this.isStatistic) {
          this.showAssignLevel(this.typeUsageTbl!, this.soUsageTbl!, 0, eventTypeData);
          this.nmBack!.style.visibility = 'hidden';
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

  private typePieChart(typeData: Array<AnalysisObj>): void {
    this.nmPieChart!.config = {
      appendPadding: 0,
      data: this.dataLogic!.getPieChartData(typeData),
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
          this.nativeProcessLevelClickEvent(it as AnalysisObj);
        }
      },
      hoverHandler: (nmData): void => {
        if (nmData) {
          this.typeUsageTbl!.setCurrentHover(nmData);
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
    this.nmPieChart!.config = {
      appendPadding: 0,
      data: this.dataLogic!.getPieChartData(threadData),
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
    threadData.unshift(this.threadStatisticsData);
    this.threadUsageTbl!.recycleDataSource = threadData;
    threadData.shift();
    this.currentLevelData = threadData;
    this.threadUsageTbl?.reMeauseHeight();
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

  private libraryPieChart(soData: Array<AnalysisObj>): void {
    this.nmPieChart!.config = {
      appendPadding: 0,
      data: this.dataLogic!.getPieChartData(soData),
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
          this.nativeSoLevelClickEvent(it as AnalysisObj);
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
    soData.unshift(this.libStatisticsData);
    this.soUsageTbl!.recycleDataSource = soData;
    soData.shift();
    this.currentLevelData = soData;
    this.soUsageTbl?.reMeauseHeight();
  }

  private functionPieChart(functionData: Array<AnalysisObj>): void {
    this.nmPieChart!.config = {
      appendPadding: 0,
      data: this.dataLogic!.getPieChartData(functionData),
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
    this.titleEl!.textContent = this.type;
    this.tabName!.textContent = 'Statistic By Function Existing';
    functionData.unshift(this.functionStatisticsData);
    this.functionUsageTbl!.recycleDataSource = functionData;
    functionData.shift();
    this.currentLevelData = functionData;
    this.functionUsageTbl?.reMeauseHeight();
  }

  private nativeProcessLevelClickEvent(it: AnalysisObj): void {
    if (this.hideThreadCheckBox?.checked || this.isStatistic) {
      this.reset(this.soUsageTbl!, true);
      this.showAssignLevel(this.soUsageTbl!, this.typeUsageTbl!, 1, this.dataLogic!.getEventTypeData());
      this.dataLogic?.getLibSize(it);
    } else {
      this.reset(this.threadUsageTbl!, true);
      this.showAssignLevel(this.threadUsageTbl!, this.typeUsageTbl!, 1, this.dataLogic!.getEventTypeData());
      this.dataLogic?.getThreadSize(it);
    }
    // @ts-ignore
    this.titleEl!.textContent = it.typeName;
    this.type = it.typeName!;
    this.nmPieChart?.hideTip();
  }

  private nativeThreadLevelClickEvent(it: AnalysisObj): void {
    this.reset(this.soUsageTbl!, true);
    this.showAssignLevel(this.soUsageTbl!, this.threadUsageTbl!, 2, this.dataLogic!.getEventTypeData());
    this.dataLogic?.getLibSize(it);
    const typeName = this.type === TYPE_MAP_STRING ? TYPE_OTHER_MMAP : this.type;

    let title = typeName;
    if (!this.hideThreadCheckBox?.checked) {
      this.threadName = `${it.tableName}`;
      title += ` / ${this.threadName}`;
    }
    this.titleEl!.textContent = title;
    this.nmPieChart?.hideTip();
  }

  private nativeSoLevelClickEvent(it: AnalysisObj): void {
    this.reset(this.functionUsageTbl!, true);
    this.showAssignLevel(this.functionUsageTbl!, this.soUsageTbl!, 3, this.dataLogic!.getEventTypeData());
    this.dataLogic!.getFunctionSize(it);
    const typeName = this.type === TYPE_MAP_STRING ? TYPE_OTHER_MMAP : this.type;
    let title = typeName || '';
    if (!this.hideThreadCheckBox?.checked && this.threadName.length > 0) {
      title += ` / ${this.threadName}`;

    }
    if (it.libName && it.libName.length > 0) {
      title += ` / ${it.libName}`;
    }
    this.titleEl!.textContent = title;
    this.nmPieChart?.hideTip();
  }

  private getNmCurrentTable(): LitTable | null | undefined {
    let nmCurrentTable: LitTable | null | undefined;
    switch (this.currentLevel) {
      case 0:
        nmCurrentTable = this.typeUsageTbl;
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

  private caseTableName(
    statisticAnalysisLeftData: { tableName: number },
    statisticAnalysisRightData: { tableName: number }
  ): number {
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
          // @ts-ignore
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

  public connectedCallback(): void {
    new ResizeObserver(() => {
      this.resizeTable();
      // @ts-ignore
      if (this.parentElement?.clientHeight !== 0) {
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
