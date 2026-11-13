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
import { LitChartPie } from '../../../../../base-ui/chart/pie/LitChartPie';
import { SelectionParam } from '../../../../bean/BoxSelection';
import '../../../../../base-ui/chart/pie/LitChartPie';
import { LitProgressBar } from '../../../../../base-ui/progress-bar/LitProgressBar';
import { Utils } from '../../base/Utils';
import { procedurePool } from '../../../../database/Procedure';
import { LitCheckBox } from '../../../../../base-ui/checkbox/LitCheckBox';
import { TabPaneFilter } from '../TabPaneFilter';
import { initSort } from '../SheetUtils';
import { TabpaneFilesystemCalltree } from './TabPaneFileSystemCalltree';
import { NUM_5, NUM_MILLON } from '../../../../bean/NumBean';
import { TabPaneFilesystemStatisticsAnalysisHtml } from './TabPaneFilesystemStatisticsAnalysis.html';

@element('tabpane-file-statistics-analysis')
export class TabPaneFilesystemStatisticsAnalysis extends BaseElement {
  private fsPieChart: LitChartPie | null | undefined;
  private fsCurrentSelection: SelectionParam | null | undefined;
  private fileStatisticsAnalysisProcessData: unknown;
  private fileStatisticsAnalysisThreadData!: unknown[];
  private fileStatisticsAnalysisSoData!: unknown[];
  private fileStatisticsAnalysisPidData!: unknown[];
  private fileStatisticsAnalysisTypeData!: unknown[];
  private fileStatisticsAnalysisFunctionData!: unknown[];
  private fileStatisticsAnalysisTableProcess: LitTable | null | undefined;
  private fileStatisticsAnalysisTableType: LitTable | null | undefined;
  private fileStatisticsAnalysisTableThread: LitTable | null | undefined;
  private fileStatisticsAnalysisTableSo: LitTable | null | undefined;
  private fileStatisticsAnalysisTableFunction: LitTable | null | undefined;
  private sumDur: number = 0;
  private fileStatisticsAnalysisRange: HTMLLabelElement | null | undefined;
  private fsBack: HTMLDivElement | null | undefined;
  private tabName: HTMLDivElement | null | undefined;
  private fileStatisticsAnalysisProgressEL: LitProgressBar | null | undefined;
  private fsProcessName: string = '';
  private fileStatisticsAnalysisThreadName: string = '';
  private fsSortColumn: string = '';
  private fsSortType: number = 0;
  private typeName: string = '';
  private currentLevel = -1;
  private currentLevelData!: Array<unknown>;
  private processStatisticsData!: {};
  private typeStatisticsData!: {};
  private threadStatisticsData!: {};
  private libStatisticsData!: {};
  private functionStatisticsData!: {};
  private fileSystemTitleEl: HTMLDivElement | undefined | null;
  private fileSystemFilterEl: TabPaneFilter | undefined | null;
  private hideProcessCheckBox: LitCheckBox | undefined | null;
  private hideThreadCheckBox: LitCheckBox | undefined | null;
  private checkBoxs: NodeListOf<LitCheckBox> | undefined | null;
  private fsTableArray: NodeListOf<LitTable> | undefined | null;

  set data(val: SelectionParam) {
    if (val === this.fsCurrentSelection) {
      this.fileStatisticsAnalysisPidData.unshift(this.processStatisticsData);
      this.fileStatisticsAnalysisTableProcess!.recycleDataSource = this.fileStatisticsAnalysisPidData;
      // @ts-ignore
      this.fileStatisticsAnalysisPidData.shift(this.processStatisticsData);
      return;
    }
    this.fsCurrentSelection = val;
    if (this.fsTableArray && this.fsTableArray.length > 0) {
      for (let fsTable of this.fsTableArray) {
        initSort(fsTable!, this.fsSortColumn, this.fsSortType);
      }
    }
    this.reset(this.fileStatisticsAnalysisTableProcess!, false);
    this.hideProcessCheckBox!.checked = false;
    this.hideThreadCheckBox!.checked = false;
    this.fileSystemTitleEl!.textContent = '';
    this.tabName!.textContent = '';
    this.fileStatisticsAnalysisRange!.textContent = `Selected range: ${parseFloat(
      ((val.rightNs - val.leftNs) / NUM_MILLON).toFixed(NUM_5)
    )} ms`;
    this.fileStatisticsAnalysisProgressEL!.loading = true;
    this.getDataByWorker(
      [
        {
          funcName: 'setSearchValue',
          funcArgs: [''],
        },
        {
          funcName: 'getCurrentDataFromDb',
          funcArgs: [{ queryFuncName: 'fileSystem', ...val }],
        },
      ],
      (results: unknown[]): void => {
        this.disableCheckBox(results);
        this.getFilesystemProcess(results);
      }
    );
  }

  initElements(): void {
    this.fileStatisticsAnalysisRange = this.shadowRoot?.querySelector('#time-range');
    this.fsPieChart = this.shadowRoot!.querySelector<LitChartPie>('#fs-chart-pie');
    this.fileStatisticsAnalysisTableProcess = this.shadowRoot!.querySelector<LitTable>('#tb-process-usage');
    this.fileStatisticsAnalysisTableThread = this.shadowRoot!.querySelector<LitTable>('#tb-thread-usage');
    this.fileStatisticsAnalysisTableSo = this.shadowRoot!.querySelector<LitTable>('#tb-so-usage');
    this.fileStatisticsAnalysisTableFunction = this.shadowRoot!.querySelector<LitTable>('#tb-function-usage');
    this.fsBack = this.shadowRoot!.querySelector<HTMLDivElement>('.fs-go-back');
    this.tabName = this.shadowRoot!.querySelector<HTMLDivElement>('.fs-subheading');
    this.fileStatisticsAnalysisTableType = this.shadowRoot!.querySelector<LitTable>('#tb-type-usage');
    this.fileStatisticsAnalysisProgressEL = this.shadowRoot?.querySelector('.progress') as LitProgressBar;
    this.goBack();
    this.fileSystemTitleEl = this.shadowRoot!.querySelector<HTMLDivElement>('.title');
    this.fileSystemFilterEl = this.shadowRoot?.querySelector('#filter');
    this.fileSystemFilterEl!.setOptionsList(['Hide Process', 'Hide Thread']);
    let popover = this.fileSystemFilterEl!.shadowRoot!.querySelector('#check-popover');
    this.hideProcessCheckBox = popover!!.querySelector<LitCheckBox>('div > #hideProcess');
    this.hideThreadCheckBox = popover!!.querySelector<LitCheckBox>('div > #hideThread');
    this.checkBoxs = popover!.querySelectorAll<LitCheckBox>('.check-wrap > lit-check-box');
    this.fsTableArray = this.shadowRoot!.querySelectorAll('lit-table') as NodeListOf<LitTable>;
    for (let fsTable of this.fsTableArray) {
      this.columnClickListeners(fsTable);
      fsTable!.addEventListener('contextmenu', function (event: MouseEvent): void {
        event.preventDefault(); // 阻止默认的上下文菜单弹框
      });
      this.initTableRowHoverListeners(fsTable);
      this.initTableRowClickListeners(fsTable);
    }
    for (let box of this.checkBoxs) {
      this.checkBoxListener(box);
    }
    const addRowClickEventListener = (fsTable: LitTable, clickEvent: Function): void => {
      fsTable.addEventListener('row-click', (evt: Event): void => {
        // @ts-ignore
        const detail = evt.detail;
        if (detail.button === 0 && detail.data.tableName !== '' && detail.data.duration !== 0) {
          clickEvent(detail.data, this.fsCurrentSelection);
        }
      });
    };
    addRowClickEventListener(this.fileStatisticsAnalysisTableProcess!, this.fileProcessLevelClickEvent.bind(this));
    addRowClickEventListener(this.fileStatisticsAnalysisTableType!, this.fileTypeLevelClickEvent.bind(this));
    addRowClickEventListener(this.fileStatisticsAnalysisTableThread!, this.fileThreadLevelClickEvent.bind(this));
    addRowClickEventListener(this.fileStatisticsAnalysisTableSo!, this.fileSoLevelClickEvent.bind(this));
  }
  private disableCheckBox(results: Array<unknown>): void {
    if (results.length === 0) {
      this.hideProcessCheckBox?.setAttribute('disabled', 'disabled');
      this.hideThreadCheckBox?.setAttribute('disabled', 'disabled');
    } else {
      this.hideProcessCheckBox?.removeAttribute('disabled');
      this.hideThreadCheckBox?.removeAttribute('disabled');
    }
  }

  private checkBoxListener(box: LitCheckBox): void {
    box!.addEventListener('change', (): void => {
      if (this.hideProcessCheckBox!.checked && this.hideThreadCheckBox!.checked) {
        this.hideThread();
        this.fsBack!.style.visibility = 'hidden';
      } else if (this.hideProcessCheckBox!.checked && !this.hideThreadCheckBox!.checked) {
        this.hideProcess();
      } else {
        this.reset(this.fileStatisticsAnalysisTableProcess!, false); // @ts-ignore
        this.getFilesystemProcess(this.fileStatisticsAnalysisProcessData);
      }
    });
  }

  private initTableRowClickListeners(fsTable: LitTable): void {
    fsTable!.addEventListener('row-click', (evt: Event): void => {
      // @ts-ignore
      let detail = evt.detail;
      if (detail.button === 2) {
        let fsTab = this.parentElement?.parentElement?.querySelector<TabpaneFilesystemCalltree>(
          '#box-file-system-calltree > tabpane-filesystem-calltree'
        );
        fsTab!.cWidth = this.clientWidth;
        fsTab!.currentFsCallTreeLevel = this.currentLevel;
        if (this.hideProcessCheckBox?.checked) {
          detail.data.pid = undefined;
        }
        if (this.hideThreadCheckBox?.checked) {
          detail.data.tid = undefined;
        }
        fsTab!.fsRowClickData = detail.data;
        let title = '';
        if (this.fileSystemTitleEl?.textContent === '') {
          title = detail.data.tableName;
        } else {
          title = `${this.fileSystemTitleEl?.textContent} / ${detail.data.tableName}`;
        }
        fsTab!.pieTitle = title;
        //  是否是在表格上右键点击跳转到火焰图的
        this.fsCurrentSelection!.isRowClick = true;
        fsTab!.data = this.fsCurrentSelection;
      }
    });
  }

  private initTableRowHoverListeners(fsTable: LitTable): void {
    fsTable!.addEventListener('row-hover', (evt) => {
      // @ts-ignore
      let detail = evt.detail;
      if (detail.data) {
        let tableData = detail.data;
        tableData.isHover = true;
        if (detail.callBack) {
          detail.callBack(true);
        }
      }
      this.fsPieChart?.showHover();
      this.fsPieChart?.hideTip();
    });
  }

  private columnClickListeners(fsTable: LitTable): void {
    fsTable!.addEventListener('column-click', (evt) => {
      // @ts-ignore
      this.fsSortColumn = evt.detail.key;
      // @ts-ignore
      this.fsSortType = evt.detail.sort;
      this.sortByColumn();
    });
  }

  private reset(showTable: LitTable, isShowBack: boolean): void {
    this.clearData();
    if (isShowBack) {
      this.fsBack!.style.visibility = 'visible';
    } else {
      this.fsBack!.style.visibility = 'hidden';
      this.fileSystemTitleEl!.textContent = '';
    }
    if (this.fsTableArray) {
      for (let fileSystemTable of this.fsTableArray) {
        if (fileSystemTable === showTable) {
          initSort(fileSystemTable!, this.fsSortColumn, this.fsSortType);
          fileSystemTable.style.display = 'grid';
          fileSystemTable!.removeAttribute('hideDownload');
        } else {
          fileSystemTable!.style.display = 'none';
          fileSystemTable.setAttribute('hideDownload', '');
        }
      }
    }
  }

  private clearData(): void {
    this.fsPieChart!.dataSource = [];
    this.fileStatisticsAnalysisTableProcess!.recycleDataSource = [];
    this.fileStatisticsAnalysisTableThread!.recycleDataSource = [];
    this.fileStatisticsAnalysisTableType!.recycleDataSource = [];
    this.fileStatisticsAnalysisTableSo!.recycleDataSource = [];
    this.fileStatisticsAnalysisTableFunction!.recycleDataSource = [];
  }

  private showAssignLevel(showFsTable: LitTable, hideFsTable: LitTable, currentLevel: number): void {
    showFsTable!.style.display = 'grid';
    hideFsTable!.style.display = 'none';
    hideFsTable.setAttribute('hideDownload', '');
    showFsTable?.removeAttribute('hideDownload');
    this.currentLevel = currentLevel;
  }

  private goBack(): void {
    this.fsBack!.addEventListener('click', () => {
      if (this.tabName!.textContent === 'Statistic By type AllDuration') {
        this.fsBack!.style.visibility = 'hidden';
        this.showAssignLevel(this.fileStatisticsAnalysisTableProcess!, this.fileStatisticsAnalysisTableType!, 0);
        this.processPieChart();
      } else if (this.tabName!.textContent === 'Statistic By Thread AllDuration') {
        if (this.hideProcessCheckBox?.checked) {
          this.fsBack!.style.visibility = 'hidden';
        } else {
          this.fsBack!.style.visibility = 'visible';
        }
        this.showAssignLevel(this.fileStatisticsAnalysisTableType!, this.fileStatisticsAnalysisTableThread!, 1);
        this.typePieChart();
      } else if (this.tabName!.textContent === 'Statistic By Library AllDuration') {
        if (this.hideThreadCheckBox?.checked) {
          if (this.hideProcessCheckBox?.checked) {
            this.fsBack!.style.visibility = 'hidden';
          }
          this.showAssignLevel(this.fileStatisticsAnalysisTableType!, this.fileStatisticsAnalysisTableSo!, 1);
          this.typePieChart();
        } else {
          this.showAssignLevel(this.fileStatisticsAnalysisTableThread!, this.fileStatisticsAnalysisTableSo!, 2);
          this.threadPieChart();
        }
      } else if (this.tabName!.textContent === 'Statistic By Function AllDuration') {
        this.showAssignLevel(this.fileStatisticsAnalysisTableSo!, this.fileStatisticsAnalysisTableFunction!, 3);
        this.libraryPieChart();
      }
    });
  }

  private hideProcess(): void {
    this.reset(this.fileStatisticsAnalysisTableType!, false);
    this.fsProcessName = '';
    this.getFilesystemType(null);
  }

  private hideThread(it?: unknown): void {
    this.reset(this.fileStatisticsAnalysisTableType!, true);
    this.fsProcessName = '';
    this.fileStatisticsAnalysisThreadName = '';
    if (it) {
      this.getFilesystemType(it);
    } else {
      this.getFilesystemType(null);
    }
  }

  private processPieChart(): void {
    // @ts-ignore
    this.sumDur = this.processStatisticsData.allDuration;
    this.fsPieChart!.config = {
      appendPadding: 0,
      data: this.getFsPieChartData(this.fileStatisticsAnalysisPidData),
      angleField: 'duration',
      colorField: 'tableName',
      radius: 1,
      label: {
        type: 'outer',
      }, // @ts-ignore
      tip: this.getFsTip(),
      angleClick: (fsPieClickItem): void => {
        // @ts-ignore
        if (fsPieClickItem.tableName !== 'other') {
          this.fileProcessLevelClickEvent(fsPieClickItem);
        }
      },
      hoverHandler: (fsPieData): void => {
        if (fsPieData) {
          this.fileStatisticsAnalysisTableProcess!.setCurrentHover(fsPieData);
        } else {
          this.fileStatisticsAnalysisTableProcess!.mouseOut();
        }
      },
      interactions: [
        {
          type: 'element-active',
        },
      ],
    };
    this.fileSystemTitleEl!.textContent = '';
    this.tabName!.textContent = 'Statistic By Process AllDuration';
    this.fileStatisticsAnalysisPidData.unshift(this.processStatisticsData);
    this.fileStatisticsAnalysisTableProcess!.recycleDataSource = this.fileStatisticsAnalysisPidData;
    // @ts-ignore
    this.fileStatisticsAnalysisPidData.shift(this.processStatisticsData);
    this.currentLevelData = this.fileStatisticsAnalysisPidData;
    this.fileStatisticsAnalysisTableProcess?.reMeauseHeight();
  }

  private fileProcessLevelClickEvent(it: unknown): void {
    this.reset(this.fileStatisticsAnalysisTableType!, true);
    this.getFilesystemType(it);
    // @ts-ignore
    this.fsProcessName = it.tableName;
    this.fileSystemTitleEl!.textContent = this.fsProcessName;
    this.fsPieChart?.hideTip();
  }

  private typePieChart(): void {
    this.fsPieChart!.config = {
      appendPadding: 0,
      data: this.fileStatisticsAnalysisTypeData,
      angleField: 'duration',
      colorField: 'tableName',
      radius: 1,
      label: {
        type: 'outer',
      }, // @ts-ignore
      tip: this.getFileTypeTip(),
      angleClick: (it): void => {
        this.fileTypeLevelClickEvent(it);
      },
      hoverHandler: (data): void => {
        if (data) {
          this.fileStatisticsAnalysisTableType!.setCurrentHover(data);
        } else {
          this.fileStatisticsAnalysisTableType!.mouseOut();
        }
      },
      interactions: [
        {
          type: 'element-active',
        },
      ],
    };
    this.fileSystemTitleEl!.textContent = this.fsProcessName;
    this.tabName!.textContent = 'Statistic By type AllDuration';
    this.fileStatisticsAnalysisTypeData.unshift(this.typeStatisticsData);
    this.fileStatisticsAnalysisTableType!.recycleDataSource = this.fileStatisticsAnalysisTypeData;
    // @ts-ignore
    this.fileStatisticsAnalysisTypeData.shift(this.typeStatisticsData);
    this.currentLevelData = this.fileStatisticsAnalysisTypeData;
    this.fileStatisticsAnalysisTableType?.reMeauseHeight();
  }

  private getFileTypeTip() {
    return (obj: { obj: { tableName: unknown; durFormat: unknown; percent: unknown } }): string => {
      return `<div>
                    <div>Type:${obj.obj.tableName}</div>
                    <div>Duration:${obj.obj.durFormat}</div>
                    <div>Percent:${obj.obj.percent}%</div> 
                </div>
                `;
    };
  }

  private fileTypeLevelClickEvent(it: unknown): void {
    if (this.hideThreadCheckBox!.checked) {
      this.reset(this.fileStatisticsAnalysisTableSo!, true);
      this.getFilesystemSo(it);
    } else {
      this.reset(this.fileStatisticsAnalysisTableThread!, true);
      this.getFilesystemThread(it);
    }
    // @ts-ignore
    this.typeName = it.tableName;
    let title = '';
    if (this.fsProcessName.length > 0) {
      title += `${this.fsProcessName} / `;
    }
    if (this.typeName.length > 0) {
      title += this.typeName;
    }
    this.fileSystemTitleEl!.textContent = title;
    this.fsPieChart?.hideTip();
  }

  private threadPieChart(): void {
    // @ts-ignore
    this.sumDur = this.threadStatisticsData.allDuration;
    this.fsPieChart!.config = {
      appendPadding: 0,
      data: this.getFsPieChartData(this.fileStatisticsAnalysisThreadData),
      angleField: 'duration',
      colorField: 'tableName',
      radius: 1,
      label: {
        type: 'outer',
      }, // @ts-ignore
      tip: this.getFileTypeTip(),
      angleClick: (it): void => {
        // @ts-ignore
        if (it.tableName !== 'other') {
          this.fileThreadLevelClickEvent(it);
        }
      },
      hoverHandler: (data): void => {
        if (data) {
          this.fileStatisticsAnalysisTableThread!.setCurrentHover(data);
        } else {
          this.fileStatisticsAnalysisTableThread!.mouseOut();
        }
      },
      interactions: [
        {
          type: 'element-active',
        },
      ],
    };
    let title = '';
    if (this.fsProcessName.length > 0) {
      title += `${this.fsProcessName} / `;
    }
    if (this.typeName.length > 0) {
      title += this.typeName;
    }
    this.fileSystemTitleEl!.textContent = title;
    this.tabName!.textContent = 'Statistic By Thread AllDuration';
    this.fileStatisticsAnalysisThreadData.unshift(this.threadStatisticsData);
    this.fileStatisticsAnalysisTableThread!.recycleDataSource = this.fileStatisticsAnalysisThreadData;
    // @ts-ignore
    this.fileStatisticsAnalysisThreadData.shift(this.threadStatisticsData);
    this.currentLevelData = this.fileStatisticsAnalysisThreadData;
    this.fileStatisticsAnalysisTableThread?.reMeauseHeight();
  }

  private getFsTip() {
    return (obj: { obj: { tableName: unknown; durFormat: unknown; percent: unknown } }): string => {
      return `<div>
                    <div>ThreadName:${obj.obj.tableName}</div>
                    <div>Duration:${obj.obj.durFormat}</div>
                    <div>Percent:${obj.obj.percent}%</div> 
                </div>
                    `;
    };
  }

  private fileThreadLevelClickEvent(it: unknown): void {
    this.reset(this.fileStatisticsAnalysisTableSo!, true);
    this.getFilesystemSo(it);
    // @ts-ignore
    this.fileStatisticsAnalysisThreadName = it.tableName;
    let title = '';
    if (this.fsProcessName.length > 0) {
      title += `${this.fsProcessName} / `;
    }
    if (this.typeName.length > 0) {
      title += `${this.typeName} / `;
    }
    if (this.fileStatisticsAnalysisThreadName.length > 0) {
      title += this.fileStatisticsAnalysisThreadName;
    }
    this.fileSystemTitleEl!.textContent = title;
    this.fsPieChart?.hideTip();
  }

  private libraryPieChart(): void {
    // @ts-ignore
    this.sumDur = this.libStatisticsData.allDuration;
    this.setFsPieChartConfig();
    let fileSystemTitle = '';
    if (this.fsProcessName.length > 0) {
      fileSystemTitle += `${this.fsProcessName} / `;
    }
    if (this.typeName.length > 0) {
      if (this.hideThreadCheckBox?.checked) {
        fileSystemTitle += this.typeName;
      } else {
        fileSystemTitle += `${this.typeName} / `;
      }
    }
    if (this.fileStatisticsAnalysisThreadName.length > 0) {
      fileSystemTitle += this.fileStatisticsAnalysisThreadName;
    }
    this.fileSystemTitleEl!.textContent = fileSystemTitle;
    this.tabName!.textContent = 'Statistic By Library AllDuration';
    this.fileStatisticsAnalysisSoData.unshift(this.libStatisticsData);
    this.fileStatisticsAnalysisTableSo!.recycleDataSource = this.fileStatisticsAnalysisSoData;
    // @ts-ignore
    this.fileStatisticsAnalysisSoData.shift(this.libStatisticsData);
    this.currentLevelData = this.fileStatisticsAnalysisSoData;
    this.fileStatisticsAnalysisTableSo?.reMeauseHeight();
  }

  private setFsPieChartConfig(): void {
    this.fsPieChart!.config = {
      appendPadding: 0,
      data: this.getFsPieChartData(this.fileStatisticsAnalysisSoData),
      angleField: 'duration',
      colorField: 'tableName',
      radius: 1,
      label: {
        type: 'outer',
      },
      tip: (fileSysObj): string => {
        return `<div>
                    <div>Library:${
                      // @ts-ignore
                      fileSysObj.obj.tableName
                    }</div>
                    <div>Duration:${
                      // @ts-ignore
                      fileSysObj.obj.durFormat
                    }</div>
                    <div>Percent:${
                      // @ts-ignore
                      fileSysObj.obj.percent
                    }%</div> 
                </div>
                    `;
      },
      angleClick: (fileSysBean): void => {
        // @ts-ignore
        if (fileSysBean.tableName !== 'other') {
          this.fileSoLevelClickEvent(fileSysBean);
        }
      },
      hoverHandler: (data): void => {
        if (data) {
          this.fileStatisticsAnalysisTableSo!.setCurrentHover(data);
        } else {
          this.fileStatisticsAnalysisTableSo!.mouseOut();
        }
      },
      interactions: [
        {
          type: 'element-active',
        },
      ],
    };
  }

  private fileSoLevelClickEvent(it: unknown): void {
    this.reset(this.fileStatisticsAnalysisTableFunction!, true);
    this.fileStatisticsAnalysisProgressEL!.loading = true;
    this.shadowRoot!.querySelector<HTMLDivElement>('.fs-subheading')!.textContent = 'Statistic By Function AllDuration'; // @ts-ignore
    if (!this.fileStatisticsAnalysisProcessData || this.fileStatisticsAnalysisProcessData.length === 0) {
      return;
    }
    let allDur = 0;
    let symbolMap = new Map<number, Array<unknown>>();
    allDur = this.symbolMapProcessData(it, allDur, symbolMap);
    this.updateFunctionData(symbolMap, it, allDur);
    this.getFilesystemFunction(allDur);
    let title = '';
    if (this.fsProcessName.length > 0) {
      title += `${this.fsProcessName} / `;
    }
    if (this.typeName.length > 0) {
      title += `${this.typeName} / `;
    }
    if (this.fileStatisticsAnalysisThreadName.length > 0 && !this.hideThreadCheckBox!.checked) {
      title += `${this.fileStatisticsAnalysisThreadName} / `;
    } // @ts-ignore
    if (it.tableName.length > 0) {
      // @ts-ignore
      title += it.tableName;
    }
    this.fileSystemTitleEl!.textContent = title;
    this.fsPieChart?.hideTip();
  }

  private getFilesystemFunction(allDur: number): void {
    // @ts-ignore
    this.fileStatisticsAnalysisFunctionData.sort((a, b) => b.duration - a.duration);
    this.functionStatisticsData = this.totalDurationData(allDur);
    this.currentLevel = 4;
    this.fileStatisticsAnalysisProgressEL!.loading = false;
    // @ts-ignore
    this.sumDur = this.functionStatisticsData.allDuration;
    this.fsPieChart!.config = {
      appendPadding: 0,
      data: this.getFsPieChartData(this.fileStatisticsAnalysisFunctionData),
      angleField: 'duration',
      colorField: 'tableName',
      radius: 1,
      label: {
        type: 'outer',
      },
      tip: (fsaObj): string => {
        return `<div>
                    <div>Function:${
                      // @ts-ignore
                      fsaObj.obj.tableName
                    }</div>
                    <div>Duration:${
                      // @ts-ignore
                      fsaObj.obj.durFormat
                    }</div>
                    <div>percent:${
                      // @ts-ignore
                      fsaObj.obj.percent
                    }</div>
                </div>
                `;
      },
      hoverHandler: (data): void => {
        if (data) {
          this.fileStatisticsAnalysisTableFunction!.setCurrentHover(data);
        } else {
          this.fileStatisticsAnalysisTableFunction!.mouseOut();
        }
      },
      interactions: [
        {
          type: 'element-active',
        },
      ],
    };
    this.fileStatisticsAnalysisFunctionData.unshift(this.functionStatisticsData);
    this.fileStatisticsAnalysisTableFunction!.recycleDataSource = this.fileStatisticsAnalysisFunctionData;
    this.fileStatisticsAnalysisTableFunction?.reMeauseHeight();
    // @ts-ignore
    this.fileStatisticsAnalysisFunctionData.shift(this.functionStatisticsData);
    this.currentLevelData = this.fileStatisticsAnalysisFunctionData;
  }

  private sortByColumn(): void {
    let fsaCurrentTable: LitTable | null | undefined;
    switch (this.currentLevel) {
      case 0:
        fsaCurrentTable = this.fileStatisticsAnalysisTableProcess;
        break;
      case 1:
        fsaCurrentTable = this.fileStatisticsAnalysisTableType;
        break;
      case 2:
        fsaCurrentTable = this.fileStatisticsAnalysisTableThread;
        break;
      case 3:
        fsaCurrentTable = this.fileStatisticsAnalysisTableSo;
        break;
      case 4:
        fsaCurrentTable = this.fileStatisticsAnalysisTableFunction;
        break;
    }
    if (!fsaCurrentTable) {
      return;
    }
    if (this.fsSortType === 0) {
      this.sortAndRefreshTable(fsaCurrentTable);
    } else {
      this.sortAndRefreshTableByColumn(fsaCurrentTable);
    }
  }

  private sortAndRefreshTableByColumn(fsaCurrentTable: LitTable): void {
    let fsaArray = [...this.currentLevelData];
    if (this.fsSortColumn === 'tableName') {
      this.sortTableNameCase(fsaCurrentTable, fsaArray);
    } else if (this.fsSortColumn === 'durFormat' || this.fsSortColumn === 'percent') {
      fsaCurrentTable!.recycleDataSource = fsaArray.sort((a, b) => {
        // @ts-ignore
        return this.fsSortType === 1 ? a.duration - b.duration : b.duration - a.duration;
      });
    }
    switch (this.currentLevel) {
      case 0:
        fsaArray.unshift(this.processStatisticsData);
        break;
      case 1:
        fsaArray.unshift(this.typeStatisticsData);
        break;
      case 2:
        fsaArray.unshift(this.threadStatisticsData);
        break;
      case 3:
        fsaArray.unshift(this.libStatisticsData);
        break;
      case 4:
        fsaArray.unshift(this.functionStatisticsData);
        break;
    }
    fsaCurrentTable!.recycleDataSource = fsaArray;
  }

  private sortAndRefreshTable(fsaCurrentTable: LitTable): void {
    let fsaArr = [...this.currentLevelData];
    switch (this.currentLevel) {
      case 0:
        fsaArr.unshift(this.processStatisticsData);
        break;
      case 1:
        fsaArr.unshift(this.typeStatisticsData);
        break;
      case 2:
        fsaArr.unshift(this.threadStatisticsData);
        break;
      case 3:
        fsaArr.unshift(this.libStatisticsData);
        break;
      case 4:
        fsaArr.unshift(this.functionStatisticsData);
        break;
    }
    fsaCurrentTable!.recycleDataSource = fsaArr;
  }

  private sortTableNameCase(fsaCurrentTable: LitTable, fsaArray: unknown[]): void {
    fsaCurrentTable!.recycleDataSource = fsaArray.sort((firstElement, secondElement): number => {
      if (this.fsSortType === 1) {
        // @ts-ignore
        if (firstElement.tableName > secondElement.tableName) {
          return 1; // @ts-ignore
        } else if (firstElement.tableName === secondElement.tableName) {
          return 0;
        } else {
          return -1;
        }
      } else {
        // @ts-ignore
        if (secondElement.tableName > firstElement.tableName) {
          return 1; // @ts-ignore
        } else if (firstElement.tableName === secondElement.tableName) {
          return 0;
        } else {
          return -1;
        }
      }
    });
  }

  private getFilesystemProcess(result: Array<unknown>): void {
    this.fileStatisticsAnalysisProcessData = JSON.parse(JSON.stringify(result)); // @ts-ignore
    if (!this.fileStatisticsAnalysisProcessData || this.fileStatisticsAnalysisProcessData.length === 0) {
      this.fileStatisticsAnalysisPidData = [];
      this.processStatisticsData = [];
      this.processPieChart();
      return;
    }
    let allDur = 0;
    let pidMap = new Map<string, Array<number | string>>();
    for (let itemData of result) {
      // @ts-ignore
      allDur += itemData.dur; // @ts-ignore
      if (pidMap.has(itemData.pid)) {
        // @ts-ignore
        pidMap.get(itemData.pid)?.push(itemData);
      } else {
        let itemArray = [];
        itemArray.push(itemData); // @ts-ignore
        pidMap.set(itemData.pid, itemArray);
      }
    }
    this.fileStatisticsAnalysisPidData = [];
    pidMap.forEach((value: Array<unknown>, key: string): void => {
      let analysisPidDataDur = 0;
      let pName = '';
      for (let fileSysStatPidItem of value) {
        // @ts-ignore
        if (fileSysStatPidItem.processName && fileSysStatPidItem.processName.length > 0) {
          // @ts-ignore
          if (!fileSysStatPidItem.processName.endsWith(`(${fileSysStatPidItem.pid})`)) {
            // @ts-ignore
            fileSysStatPidItem.processName = `${fileSysStatPidItem.processName}(${fileSysStatPidItem.pid})`;
          }
        } else {
          // @ts-ignore
          fileSysStatPidItem.processName = `Process(${fileSysStatPidItem.pid})`;
        } // @ts-ignore
        pName = fileSysStatPidItem.processName; // @ts-ignore
        analysisPidDataDur += fileSysStatPidItem.dur;
      }
      this.fileStatisticsAnalysisPidData.push({
        tableName: pName,
        pid: key,
        percent: ((analysisPidDataDur / allDur) * 100).toFixed(2),
        durFormat: Utils.getProbablyTime(analysisPidDataDur),
        duration: analysisPidDataDur,
      });
    }); // @ts-ignore
    this.fileStatisticsAnalysisPidData.sort((a, b) => b.duration - a.duration);
    this.processStatisticsData = this.totalDurationData(allDur);
    this.currentLevel = 0;
    this.fileStatisticsAnalysisProgressEL!.loading = false;
    this.processPieChart();
  }

  private getFilesystemType(fileSysStatTypeItem: unknown): void {
    this.fileStatisticsAnalysisProgressEL!.loading = true;
    let typeMap = new Map<number, Array<number | string>>();
    let allDur = 0; // @ts-ignore
    if (!this.fileStatisticsAnalysisProcessData || this.fileStatisticsAnalysisProcessData.length === 0) {
      return;
    } // @ts-ignore
    for (let fsItem of this.fileStatisticsAnalysisProcessData) {
      // @ts-ignore
      if (fileSysStatTypeItem && fsItem.pid !== fileSysStatTypeItem.pid && !this.hideProcessCheckBox?.checked) {
        continue;
      }
      allDur += fsItem.dur;
      if (typeMap.has(fsItem.type)) {
        typeMap.get(fsItem.type)?.push(fsItem);
      } else {
        let itemArray = [];
        itemArray.push(fsItem);
        typeMap.set(fsItem.type, itemArray);
      }
    }
    this.fileStatisticsAnalysisTypeData = [];
    typeMap.forEach((value: Array<unknown>, key: number): void => {
      let dur = 0;
      for (let item of value) {
        // @ts-ignore
        dur += item.dur;
      }
      const typeData = {
        tableName: this.typeIdToString(key), // @ts-ignore
        pid: fileSysStatTypeItem === null ? value[0].pid : fileSysStatTypeItem.pid,
        type: key,
        percent: ((dur / allDur) * 100).toFixed(2),
        durFormat: Utils.getProbablyTime(dur),
        duration: dur,
      };
      this.fileStatisticsAnalysisTypeData.push(typeData);
    }); // @ts-ignore
    this.fileStatisticsAnalysisTypeData.sort((a, b) => b.duration - a.duration);
    this.typeStatisticsData = this.totalDurationData(allDur);
    this.currentLevel = 1;
    this.typePieChart();
    this.fileStatisticsAnalysisProgressEL!.loading = false;
  }

  private getFilesystemThread(fileSysStatThreadItem: unknown): void {
    this.fileStatisticsAnalysisProgressEL!.loading = true;
    let threadMap = new Map<string, Array<number | string>>(); // @ts-ignore
    let pid = fileSysStatThreadItem.pid; // @ts-ignore
    let type = fileSysStatThreadItem.type;
    let allDur = 0; // @ts-ignore
    if (!this.fileStatisticsAnalysisProcessData || this.fileStatisticsAnalysisProcessData.length === 0) {
      return;
    } // @ts-ignore
    for (let fspItem of this.fileStatisticsAnalysisProcessData) {
      if (
        (!this.hideProcessCheckBox?.checked && fspItem.pid !== pid) ||
        fspItem.type !== type ||
        (fspItem.type !== type && this.hideProcessCheckBox?.checked)
      ) {
        continue;
      }
      allDur += fspItem.dur;
      if (threadMap.has(fspItem.tid)) {
        threadMap.get(fspItem.tid)?.push(fspItem);
      } else {
        let itemArray = [];
        itemArray.push(fspItem);
        threadMap.set(fspItem.tid, itemArray);
      }
    }
    this.updateThreadData(threadMap, fileSysStatThreadItem, allDur); // @ts-ignore
    this.fileStatisticsAnalysisThreadData.sort((a, b) => b.duration - a.duration);
    this.threadStatisticsData = this.totalDurationData(allDur);
    this.currentLevel = 2;
    this.fileStatisticsAnalysisProgressEL!.loading = false;
    this.threadPieChart();
  }

  private updateThreadData(
    threadMap: Map<string, Array<number | string>>,
    fileSysStatThreadItem: unknown,
    allDur: number
  ): void {
    this.fileStatisticsAnalysisThreadData = [];
    threadMap.forEach((value: Array<unknown>, key: string): void => {
      let dur = 0;
      let tName = '';
      for (let fileSysStatThreadItem of value) {
        // @ts-ignore
        dur += fileSysStatThreadItem.dur; // @ts-ignore
        tName = fileSysStatThreadItem.threadName = // @ts-ignore
          fileSysStatThreadItem.threadName === null || fileSysStatThreadItem.threadName === undefined // @ts-ignore
            ? `Thread(${fileSysStatThreadItem.tid})` // @ts-ignore
            : `${fileSysStatThreadItem.threadName}(${fileSysStatThreadItem.tid})`;
      }
      const threadData = {
        tableName: tName, // @ts-ignore
        pid: fileSysStatThreadItem.pid, // @ts-ignore
        type: fileSysStatThreadItem.type,
        tid: key,
        percent: ((dur / allDur) * 100).toFixed(2),
        durFormat: Utils.getProbablyTime(dur),
        duration: dur,
      };
      this.fileStatisticsAnalysisThreadData.push(threadData);
    });
  }

  private getFilesystemSo(item: unknown): void {
    this.fileStatisticsAnalysisProgressEL!.loading = true;
    let allDur = 0;
    let libMap = new Map<number, Array<number | string>>(); // @ts-ignore
    if (!this.fileStatisticsAnalysisProcessData || this.fileStatisticsAnalysisProcessData.length === 0) {
      return;
    }
    allDur = this.libMapProcessData(item, allDur, libMap);
    this.updateSoData(libMap, item, allDur);
    this.libStatisticsData = this.totalDurationData(allDur);
    this.currentLevel = 3;
    this.fileStatisticsAnalysisProgressEL!.loading = false;
    this.libraryPieChart();
  }

  private libMapProcessData(item: unknown, allDur: number, libMap: Map<number, Array<number | string>>): number {
    // @ts-ignore
    for (let itemData of this.fileStatisticsAnalysisProcessData) {
      if (this.libIsAccumulationData(item, itemData)) {
        continue;
      }
      allDur += itemData.dur;
      if (libMap.has(itemData.libId)) {
        libMap.get(itemData.libId)?.push(itemData);
      } else {
        let dataArray = [];
        dataArray.push(itemData);
        libMap.set(itemData.libId, dataArray);
      }
    }
    return allDur;
  }

  private libIsAccumulationData(item: unknown, itemData: unknown): boolean {
    if (!item) {
      return false;
    }
    if (!this.hideProcessCheckBox?.checked && !this.hideThreadCheckBox?.checked) {
      // @ts-ignore
      return itemData.pid !== item.pid || itemData.tid !== item.tid || itemData.type !== item.type;
    }
    if (!this.hideProcessCheckBox?.checked && this.hideThreadCheckBox?.checked) {
      // @ts-ignore
      return itemData.pid !== item.pid || itemData.type !== item.type;
    }
    if (this.hideProcessCheckBox?.checked && !this.hideThreadCheckBox?.checked) {
      // @ts-ignore
      return itemData.tid !== item.tid || itemData.type !== item.type;
    }
    if (this.hideProcessCheckBox?.checked && this.hideThreadCheckBox?.checked) {
      // @ts-ignore
      return itemData.type !== item.type;
    }
    return false;
  }

  private updateSoData(libMap: Map<number, Array<number | string>>, item: unknown, allDur: number): void {
    this.fileStatisticsAnalysisSoData = [];
    libMap.forEach((value: unknown[], key: number): void => {
      let dur = 0;
      let soName = '';
      for (let item of value) {
        // @ts-ignore
        dur += item.dur;
        if (key === null) {
          // @ts-ignore
          item.libName = 'unknown';
        } // @ts-ignore
        soName = item.libName;
      }
      let libPath = soName?.split('/');
      if (libPath) {
        soName = libPath[libPath.length - 1];
      }
      const soData = {
        tableName: soName, // @ts-ignore
        pid: item === null ? value[0].pid : item.pid, // @ts-ignore
        type: item === null ? value[0].type : item.type, // @ts-ignore
        tid: item === null ? value[0].tid : item.tid,
        libId: key,
        percent: ((dur / allDur) * 100).toFixed(2),
        durFormat: Utils.getProbablyTime(dur),
        duration: dur,
      };
      this.fileStatisticsAnalysisSoData.push(soData);
    }); // @ts-ignore
    this.fileStatisticsAnalysisSoData.sort((a, b) => b.duration - a.duration);
  }

  private symbolMapProcessData(item: unknown, allDur: number, symbolMap: Map<number, Array<unknown>>): number {
    // @ts-ignore
    let tid = item.tid; // @ts-ignore
    let pid = item.pid; // @ts-ignore
    let type = item.type; // @ts-ignore
    let libId = item.libId; // @ts-ignore
    for (let fsProcessData of this.fileStatisticsAnalysisProcessData) {
      if (this.symbolIsAccumulationData(fsProcessData, tid, pid, type, libId)) {
        continue;
      }
      allDur += fsProcessData.dur;
      if (symbolMap.has(fsProcessData.symbolId)) {
        symbolMap.get(fsProcessData.symbolId)?.push(fsProcessData);
      } else {
        let dataArray = [];
        dataArray.push(fsProcessData);
        symbolMap.set(fsProcessData.symbolId, dataArray);
      }
    }
    return allDur;
  }

  private symbolIsAccumulationData(
    fsProcessData: unknown,
    tid: number,
    pid: number,
    type: string,
    libId: number
  ): boolean {
    if (!fsProcessData) {
      return false;
    }
    if (!this.hideProcessCheckBox?.checked && !this.hideThreadCheckBox?.checked) {
      return (
        // @ts-ignore
        fsProcessData.pid !== pid || // @ts-ignore
        fsProcessData.tid !== tid || // @ts-ignore
        fsProcessData.type !== type || // @ts-ignore
        fsProcessData.libId !== libId
      );
    }
    if (!this.hideProcessCheckBox?.checked && this.hideThreadCheckBox?.checked) {
      // @ts-ignore
      return fsProcessData.pid !== pid || fsProcessData.type !== type || fsProcessData.libId !== libId;
    }
    if (this.hideProcessCheckBox?.checked && !this.hideThreadCheckBox?.checked) {
      // @ts-ignore
      return fsProcessData.tid !== tid || fsProcessData.type !== type || fsProcessData.libId !== libId;
    }
    if (this.hideProcessCheckBox?.checked && this.hideThreadCheckBox?.checked) {
      // @ts-ignore
      return fsProcessData.type !== type || fsProcessData.libId !== libId;
    }
    return false;
  }

  private updateFunctionData(symbolMap: Map<number, Array<unknown>>, item: unknown, allDur: number): void {
    this.fileStatisticsAnalysisFunctionData = [];
    symbolMap.forEach((symbolItems, key): void => {
      let dur = 0;
      let fsSymbolName = '';
      for (let symbolItem of symbolItems) {
        // @ts-ignore
        fsSymbolName = symbolItem.symbolName; // @ts-ignore
        dur += symbolItem.dur;
      }
      let symbolPath = fsSymbolName?.split('/');
      if (symbolPath) {
        fsSymbolName = symbolPath[symbolPath.length - 1];
      }
      const symbolData = {
        // @ts-ignore
        pid: item.pid, // @ts-ignore
        type: item.type, // @ts-ignore
        tid: item.tid, // @ts-ignore
        libId: item.libId,
        symbolId: key,
        percent: ((dur / allDur) * 100).toFixed(2),
        tableName: fsSymbolName,
        durFormat: Utils.getProbablyTime(dur),
        duration: dur,
      };
      this.fileStatisticsAnalysisFunctionData.push(symbolData);
    });
  }

  private typeIdToString(transformType: number): string {
    let fsReleaseType: string;
    if (transformType === 0) {
      fsReleaseType = 'OPEN';
    } else if (transformType === 2) {
      fsReleaseType = 'READ';
    } else if (transformType === 3) {
      fsReleaseType = 'WRITE';
    } else if (transformType === 1) {
      fsReleaseType = 'CLOSE';
    }
    // @ts-ignore
    return fsReleaseType;
  }

  private totalDurationData(durationTS: number): {
    durFormat: string;
    percent: string;
    tableName: string;
    duration: number;
  } {
    return {
      durFormat: Utils.getProbablyTime(durationTS),
      percent: ((durationTS / durationTS) * 100).toFixed(2),
      tableName: '',
      duration: 0,
    };
  }

  private getFsPieChartData(fsPieChartData: unknown[]): unknown[] {
    if (fsPieChartData.length > 20) {
      let fsPieChartArr: string[] = [];
      let other: unknown = {
        tableName: 'other',
        duration: 0,
        percent: 0,
        durFormat: 0,
      };
      for (let pieDataIndex = 0; pieDataIndex < fsPieChartData.length; pieDataIndex++) {
        if (pieDataIndex < 19) {
          // @ts-ignore
          fsPieChartArr.push(fsPieChartData[pieDataIndex]);
        } else {
          // @ts-ignore
          other.duration += fsPieChartData[pieDataIndex].duration; // @ts-ignore
          other.durFormat = Utils.getProbablyTime(other.duration); // @ts-ignore
          other.percent = ((other.duration / this.sumDur) * 100).toFixed(2);
        }
      } // @ts-ignore
      fsPieChartArr.push(other);
      return fsPieChartArr;
    }
    return fsPieChartData;
  }

  private getDataByWorker(args: unknown[], handler: Function): void {
    procedurePool.submitWithName(
      'logic0',
      'fileSystem-action',
      { args, callType: 'fileSystem', isAnalysis: true },
      undefined,
      (results: unknown) => {
        handler(results);
        this.fileStatisticsAnalysisProgressEL!.loading = false;
      }
    );
  }

  public connectedCallback(): void {
    new ResizeObserver(() => {
      if (this.parentElement?.clientHeight !== 0) {
        this.fileStatisticsAnalysisTableProcess!.style.height = `${this.parentElement!.clientHeight - 50}px`;
        this.fileStatisticsAnalysisTableProcess?.reMeauseHeight();
        this.fileStatisticsAnalysisTableThread!.style.height = `${this.parentElement!.clientHeight - 50}px`;
        this.fileStatisticsAnalysisTableThread?.reMeauseHeight();
        this.fileStatisticsAnalysisTableSo!.style.height = `${this.parentElement!.clientHeight - 50}px`;
        this.fileStatisticsAnalysisTableSo?.reMeauseHeight();
        this.fileStatisticsAnalysisTableFunction!.style.height = `${this.parentElement!.clientHeight - 50}px`;
        this.fileStatisticsAnalysisTableFunction?.reMeauseHeight();
        this.fileStatisticsAnalysisTableType!.style.height = `${this.parentElement!.clientHeight - 50}px`;
        this.fileStatisticsAnalysisTableType?.reMeauseHeight();
        if (this.parentElement!.clientHeight >= 0 && this.parentElement!.clientHeight <= 31) {
          this.fileSystemFilterEl!.style.display = 'none';
        } else {
          this.fileSystemFilterEl!.style.display = 'flex';
        }
      }
    }).observe(this.parentElement!);
  }

  initHtml(): string {
    return TabPaneFilesystemStatisticsAnalysisHtml;
  }
}
