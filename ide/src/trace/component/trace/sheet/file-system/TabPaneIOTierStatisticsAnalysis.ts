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
import '../../../../../base-ui/chart/pie/LitChartPie';
import { SelectionParam } from '../../../../bean/BoxSelection';
import { LitProgressBar } from '../../../../../base-ui/progress-bar/LitProgressBar';
import { Utils } from '../../base/Utils';
import { procedurePool } from '../../../../database/Procedure';
import { LitCheckBox } from '../../../../../base-ui/checkbox/LitCheckBox';
import { TabPaneFilter } from '../TabPaneFilter';
import { initSort } from '../SheetUtils';
import { TabPaneIOCallTree } from './TabPaneIOCallTree';
import { TabPaneIOTierStatisticsAnalysisHtml } from './TabPaneIOTierStatisticsAnalysis.html';

@element('tabpane-tb-vm-statistics')
export class TabPaneIOTierStatisticsAnalysis extends BaseElement {
  private ioPieChart: LitChartPie | null | undefined;
  private currentSelection: SelectionParam | null | undefined;
  private processData: unknown;
  private pidData!: unknown[];
  private threadData!: unknown[];
  private soData!: unknown[];
  private functionData!: unknown[];
  private typeData!: unknown[];
  private ioTierTableProcess: LitTable | null | undefined;
  private ioTierTableThread: LitTable | null | undefined;
  private tierTableType: LitTable | null | undefined;
  private ioTierTableSo: LitTable | null | undefined;
  private tableFunction: LitTable | null | undefined;
  private sumDur: number = 0;
  private range: HTMLLabelElement | null | undefined;
  private iOTierStatisticsAnalysisBack: HTMLDivElement | null | undefined;
  private tabName: HTMLDivElement | null | undefined;
  private progressEL: LitProgressBar | null | undefined;
  private processName: string = '';
  private threadName: string = '';
  private ioSortColumn: string = '';
  private ioSortType: number = 0;
  private typeName: string = '';
  private currentLevel = -1;
  private currentLevelData!: Array<unknown>;
  private processStatisticsData!: {};
  private typeStatisticsData!: {};
  private threadStatisticsData!: {};
  private libStatisticsData!: {};
  private functionStatisticsData!: {};
  private tierTitleEl: HTMLDivElement | undefined | null;
  private tierFilterEl: TabPaneFilter | undefined | null;
  private hideProcessCheckBox: LitCheckBox | undefined | null;
  private hideThreadCheckBox: LitCheckBox | undefined | null;
  private checkBoxs: NodeListOf<LitCheckBox> | undefined | null;
  private ioTableArray: NodeListOf<LitTable> | undefined | null;

  set data(ioTierStatisticsAnalysisSelection: SelectionParam) {
    if (ioTierStatisticsAnalysisSelection === this.currentSelection) {
      this.pidData.unshift(this.processStatisticsData);
      this.ioTierTableProcess!.recycleDataSource = this.pidData;
      // @ts-ignore
      this.pidData.shift(this.processStatisticsData);
      return;
    }
    if (this.ioTableArray && this.ioTableArray.length > 0) {
      for (let ioTable of this.ioTableArray) {
        initSort(ioTable!, this.ioSortColumn, this.ioSortType);
      }
    }
    this.reset(this.ioTierTableProcess!, false);
    this.hideProcessCheckBox!.checked = false;
    this.hideThreadCheckBox!.checked = false;
    this.currentSelection = ioTierStatisticsAnalysisSelection;
    this.tierTitleEl!.textContent = '';
    this.tabName!.textContent = '';
    this.range!.textContent = `Selected range: ${parseFloat(
      ((ioTierStatisticsAnalysisSelection.rightNs - ioTierStatisticsAnalysisSelection.leftNs) / 1000000.0).toFixed(5)
    )}  ms`;
    this.progressEL!.loading = true;
    this.getIoTierDataByWorker(
      [
        {
          funcName: 'setSearchValue',
          funcArgs: [''],
        },
        {
          funcName: 'getCurrentDataFromDb',
          funcArgs: [{ queryFuncName: 'io', ...ioTierStatisticsAnalysisSelection }],
        },
      ],
      (results: unknown[]) => {
        this.processData = JSON.parse(JSON.stringify(results));
        this.disableCheckBox(); // @ts-ignore
        this.getIOTierProcess(this.processData);
      }
    );
  }

  initElements(): void {
    this.range = this.shadowRoot?.querySelector('#time-range');
    this.ioPieChart = this.shadowRoot!.querySelector<LitChartPie>('#io-tier-chart-pie');
    this.ioTierTableProcess = this.shadowRoot!.querySelector<LitTable>('#tb-process-usage');
    this.ioTierTableThread = this.shadowRoot!.querySelector<LitTable>('#tb-thread-usage');
    this.ioTierTableSo = this.shadowRoot!.querySelector<LitTable>('#tb-so-usage');
    this.tableFunction = this.shadowRoot!.querySelector<LitTable>('#tb-function-usage');
    this.tierTableType = this.shadowRoot!.querySelector<LitTable>('#tb-type-usage');
    this.iOTierStatisticsAnalysisBack = this.shadowRoot!.querySelector<HTMLDivElement>('.io-tier-go-back');
    this.tabName = this.shadowRoot!.querySelector<HTMLDivElement>('.io-tier-subheading');
    this.progressEL = this.shadowRoot?.querySelector('.progress') as LitProgressBar;
    this.goBack();
    this.tierTitleEl = this.shadowRoot!.querySelector<HTMLDivElement>('.title');
    this.tierFilterEl = this.shadowRoot?.querySelector('#filter');
    this.tierFilterEl!.setOptionsList(['Hide Process', 'Hide Thread']);
    let popover = this.tierFilterEl!.shadowRoot!.querySelector('#check-popover');
    this.hideProcessCheckBox = popover!!.querySelector<LitCheckBox>('div > #hideProcess');
    this.hideThreadCheckBox = popover!!.querySelector<LitCheckBox>('div > #hideThread');
    this.checkBoxs = popover!.querySelectorAll<LitCheckBox>('.check-wrap > lit-check-box');
    this.ioTableArray = this.shadowRoot!.querySelectorAll('lit-table') as NodeListOf<LitTable>;
    for (let ioTable of this.ioTableArray) {
      ioTable.shadowRoot!.querySelector<HTMLDivElement>('.table')!.style.height = 'calc(100% - 31px)';
      this.columnClickEvent(ioTable);
      this.rowHoverEvent(ioTable);
      this.rowClickEvent(ioTable);
    }
    for (let box of this.checkBoxs) {
      this.checkBoxEvent(box);
    }

    const addRowClickEventListener = (ioTable: LitTable, clickEvent: Function): void => {
      ioTable.addEventListener('row-click', (evt: Event): void => {
        // @ts-ignore
        const detail = evt.detail;
        if (detail.button === 0 && detail.data.tableName !== '' && detail.data.duration !== 0) {
          clickEvent(detail.data, this.currentSelection);
        }
      });
    };

    addRowClickEventListener(this.ioTierTableProcess!, this.ioTierProcessLevelClickEvent.bind(this));
    addRowClickEventListener(this.tierTableType!, this.ioTierTypeLevelClickEvent.bind(this));
    addRowClickEventListener(this.ioTierTableThread!, this.ioTierThreadLevelClickEvent.bind(this));
    addRowClickEventListener(this.ioTierTableSo!, this.ioTierSoLevelClickEvent.bind(this));
  }
  private disableCheckBox(): void {
    // @ts-ignore
    if (this.processData.length === 0) {
      this.hideProcessCheckBox?.setAttribute('disabled', 'disabled');
      this.hideThreadCheckBox?.setAttribute('disabled', 'disabled');
    } else {
      this.hideProcessCheckBox?.removeAttribute('disabled');
      this.hideThreadCheckBox?.removeAttribute('disabled');
    }
  }

  private columnClickEvent(ioTable: LitTable): void {
    ioTable!.addEventListener('column-click', (evt: Event): void => {
      // @ts-ignore
      this.ioSortColumn = evt.detail.key;
      // @ts-ignore
      this.ioSortType = evt.detail.sort;
      this.sortByColumn();
    });
    ioTable!.addEventListener('contextmenu', function (event: MouseEvent): void {
      event.preventDefault(); // 阻止默认的上下文菜单弹框
    });
  }

  private checkBoxEvent(box: LitCheckBox): void {
    box!.addEventListener('change', (): void => {
      if (this.hideProcessCheckBox!.checked && this.hideThreadCheckBox!.checked) {
        this.hideThread();
        this.iOTierStatisticsAnalysisBack!.style.visibility = 'hidden';
      } else if (this.hideProcessCheckBox!.checked && !this.hideThreadCheckBox!.checked) {
        this.hideProcess();
      } else {
        this.reset(this.ioTierTableProcess!, false);
        this.showAssignLevel(
          this.ioTierTableProcess!,
          this.ioTierTableThread!,
          1,
          this.tierTableType!.recycleDataSource
        ); // @ts-ignore
        this.getIOTierProcess(this.processData);
      }
    });
  }

  private rowClickEvent(ioTable: LitTable): void {
    ioTable!.addEventListener('row-click', (evt: Event): void => {
      // @ts-ignore
      let detail = evt.detail;
      if (detail.button === 2) {
        let ioTab = this.parentElement?.parentElement?.querySelector<TabPaneIOCallTree>(
          '#box-io-calltree > tabpane-io-calltree'
        );
        if (detail.button === 2) {
          ioTab!.cWidth = this.clientWidth;
          ioTab!.currentCallTreeLevel = this.currentLevel;
          if (this.hideProcessCheckBox?.checked) {
            detail.data.pid = undefined;
          }
          if (this.hideThreadCheckBox?.checked) {
            detail.data.tid = undefined;
          }
          ioTab!.rowClickData = detail.data;
          let ioTitle = '';
          if (this.tierTitleEl?.textContent === '') {
            ioTitle = detail.data.tableName;
          } else {
            ioTitle = `${this.tierTitleEl?.textContent} / ${detail.data.tableName}`;
          }
          ioTab!.pieTitle = ioTitle;
          //  是否是在表格上右键点击跳转到火焰图的
          this.currentSelection!.isRowClick = true;
          ioTab!.data = this.currentSelection;
        }
      }
    });
  }

  private rowHoverEvent(ioTable: LitTable): void {
    ioTable!.addEventListener('row-hover', (evt: Event): void => {
      // @ts-ignore
      let detail = evt.detail;
      if (detail.data) {
        let tableData = detail.data;
        tableData.isHover = true;
        if (detail.callBack) {
          detail.callBack(true);
        }
      }
      this.ioPieChart?.showHover();
      this.ioPieChart?.hideTip();
    });
  }

  private reset(showTable: LitTable, isShowBack: boolean): void {
    this.clearData();
    if (isShowBack) {
      this.iOTierStatisticsAnalysisBack!.style.visibility = 'visible';
    } else {
      this.iOTierStatisticsAnalysisBack!.style.visibility = 'hidden';
      this.tierTitleEl!.textContent = '';
    }
    if (this.ioTableArray) {
      for (let tierTable of this.ioTableArray) {
        if (tierTable === showTable) {
          initSort(tierTable!, this.ioSortColumn, this.ioSortType);
          tierTable.style.display = 'grid';
          tierTable!.removeAttribute('hideDownload');
        } else {
          tierTable!.style.display = 'none';
          tierTable.setAttribute('hideDownload', '');
        }
      }
    }
  }

  private clearData(): void {
    this.ioPieChart!.dataSource = [];
    this.ioTierTableProcess!.recycleDataSource = [];
    this.tierTableType!.recycleDataSource = [];
    this.ioTierTableThread!.recycleDataSource = [];
    this.ioTierTableSo!.recycleDataSource = [];
    this.tableFunction!.recycleDataSource = [];
  }

  private showAssignLevel(
    showIoTable: LitTable,
    hideIoTable: LitTable,
    currentLevel: number,
    currentLevelData: Array<unknown>
  ): void {
    showIoTable!.style.display = 'grid';
    hideIoTable!.style.display = 'none';
    hideIoTable.setAttribute('hideDownload', '');
    showIoTable?.removeAttribute('hideDownload');
    this.currentLevel = currentLevel;
    this.currentLevelData = currentLevelData;
  }

  private goBack(): void {
    this.iOTierStatisticsAnalysisBack!.addEventListener('click', (): void => {
      if (this.tabName!.textContent === 'Statistic By type AllDuration') {
        this.iOTierStatisticsAnalysisBack!.style.visibility = 'hidden';
        this.showAssignLevel(
          this.ioTierTableProcess!,
          this.tierTableType!,
          0,
          this.ioTierTableProcess!.recycleDataSource
        );
        this.processPieChart();
      } else if (this.tabName!.textContent === 'Statistic By Thread AllDuration') {
        if (this.hideProcessCheckBox?.checked) {
          this.iOTierStatisticsAnalysisBack!.style.visibility = 'hidden';
        } else {
          this.iOTierStatisticsAnalysisBack!.style.visibility = 'visible';
        }
        this.showAssignLevel(this.tierTableType!, this.ioTierTableThread!, 1, this.tierTableType!.recycleDataSource);
        this.typePieChart();
      } else if (this.tabName!.textContent === 'Statistic By Library AllDuration') {
        if (this.hideThreadCheckBox?.checked) {
          if (this.hideProcessCheckBox?.checked) {
            this.iOTierStatisticsAnalysisBack!.style.visibility = 'hidden';
          }
          this.showAssignLevel(this.tierTableType!, this.ioTierTableSo!, 1, this.tierTableType!.recycleDataSource);
          this.typePieChart();
        } else {
          this.showAssignLevel(
            this.ioTierTableThread!,
            this.ioTierTableSo!,
            2,
            this.ioTierTableThread!.recycleDataSource
          );
          this.threadPieChart();
        }
      } else if (this.tabName!.textContent === 'Statistic By Function AllDuration') {
        this.showAssignLevel(this.ioTierTableSo!, this.tableFunction!, 3, this.ioTierTableSo!.recycleDataSource);
        this.libraryPieChart();
      }
    });
  }

  private hideProcess(): void {
    this.reset(this.tierTableType!, false);
    this.showAssignLevel(this.tierTableType!, this.ioTierTableProcess!, 1, this.tierTableType!.recycleDataSource);
    this.processName = '';
    this.getIOTierType(null);
  }

  private hideThread(it?: unknown): void {
    this.reset(this.tierTableType!, true);
    this.showAssignLevel(this.tierTableType!, this.ioTierTableThread!, 1, this.tierTableType!.recycleDataSource);
    this.processName = '';
    this.threadName = '';
    if (it) {
      this.getIOTierType(it);
    } else {
      this.getIOTierType(null);
    }
  }

  private processPieChart(): void {
    // @ts-ignore
    this.sumDur = this.processStatisticsData.allDuration;
    this.ioPieChart!.config = {
      appendPadding: 0,
      data: this.getIOTierPieChartData(this.pidData),
      angleField: 'duration',
      colorField: 'tableName',
      radius: 1,
      label: {
        type: 'outer',
      }, // @ts-ignore
      tip: this.getTip(),
      angleClick: (ioTierPieItem): void => {
        // @ts-ignore
        if (ioTierPieItem.tableName !== 'other') {
          this.ioTierProcessLevelClickEvent(ioTierPieItem);
        }
      },
      hoverHandler: (ioTierPieData): void => {
        if (ioTierPieData) {
          this.ioTierTableProcess!.setCurrentHover(ioTierPieData);
        } else {
          this.ioTierTableProcess!.mouseOut();
        }
      },
      interactions: [
        {
          type: 'element-active',
        },
      ],
    };
    this.tierTitleEl!.textContent = '';
    this.tabName!.textContent = 'Statistic By Process AllDuration';
    this.pidData.unshift(this.processStatisticsData);
    this.ioTierTableProcess!.recycleDataSource = this.pidData;
    // @ts-ignore
    this.pidData.shift(this.processStatisticsData);
    this.currentLevelData = this.pidData;
    this.ioTierTableProcess?.reMeauseHeight();
  }

  private ioTierProcessLevelClickEvent(it: unknown): void {
    this.reset(this.tierTableType!, true);
    this.showAssignLevel(this.tierTableType!, this.ioTierTableProcess!, 1, this.tierTableType!.recycleDataSource);
    this.getIOTierType(it); // @ts-ignore
    this.processName = it.tableName;
    this.ioPieChart?.hideTip();
    this.tierTitleEl!.textContent = this.processName;
  }

  private typePieChart(): void {
    this.ioPieChart!.config = {
      appendPadding: 0,
      data: this.typeData,
      angleField: 'duration',
      colorField: 'tableName',
      radius: 1,
      label: {
        type: 'outer',
      },
      tip: (obj): string => {
        // @ts-ignore
        return this.getIoTierTip(obj);
      },
      angleClick: (it): void => {
        this.ioTierTypeLevelClickEvent(it);
      },
      hoverHandler: (ioTierData): void => {
        if (ioTierData) {
          this.tierTableType!.setCurrentHover(ioTierData);
        } else {
          this.tierTableType!.mouseOut();
        }
      },
      interactions: [
        {
          type: 'element-active',
        },
      ],
    };
    this.tierTitleEl!.textContent = this.processName;
    this.tabName!.textContent = 'Statistic By type AllDuration';
    this.typeData.unshift(this.typeStatisticsData);
    this.tierTableType!.recycleDataSource = this.typeData;
    // @ts-ignore
    this.typeData.shift(this.typeStatisticsData);
    this.currentLevelData = this.typeData;
    this.tierTableType?.reMeauseHeight();
  }

  private ioTierTypeLevelClickEvent(it: unknown): void {
    if (this.hideThreadCheckBox!.checked) {
      this.reset(this.ioTierTableSo!, true);
      this.showAssignLevel(this.ioTierTableSo!, this.tierTableType!, 2, this.ioTierTableThread!.recycleDataSource);
      this.getIOTierSo(it);
    } else {
      this.reset(this.ioTierTableThread!, true);
      this.showAssignLevel(this.ioTierTableThread!, this.tierTableType!, 2, this.ioTierTableThread!.recycleDataSource);
      this.getIOTierThread(it);
    } // @ts-ignore
    this.typeName = it.tableName;
    this.ioPieChart?.hideTip();
    let tierTitle = '';
    if (this.processName.length > 0) {
      tierTitle += `${this.processName} / `;
    }
    if (this.typeName.length > 0) {
      tierTitle += this.typeName;
    }
    this.tierTitleEl!.textContent = tierTitle;
  }

  private threadPieChart(): void {
    // @ts-ignore
    this.sumDur = this.threadStatisticsData.allDuration;
    this.ioPieChart!.config = {
      appendPadding: 0,
      data: this.getIOTierPieChartData(this.threadData),
      angleField: 'duration',
      colorField: 'tableName',
      radius: 1,
      label: {
        type: 'outer',
      },
      tip: (obj): string => {
        // @ts-ignore
        return this.getIoTierTip(obj);
      },
      angleClick: (it): void => {
        // @ts-ignore
        if (it.tableName !== 'other') {
          this.ioTierThreadLevelClickEvent(it);
        }
      },
      hoverHandler: (data): void => {
        if (data) {
          this.ioTierTableThread!.setCurrentHover(data);
        } else {
          this.ioTierTableThread!.mouseOut();
        }
      },
      interactions: [
        {
          type: 'element-active',
        },
      ],
    };
    let title = '';
    if (this.processName.length > 0) {
      title += `${this.processName} / `;
    }
    if (this.typeName.length > 0) {
      title += this.typeName;
    }
    this.tierTitleEl!.textContent = title;
    this.tabName!.textContent = 'Statistic By Thread AllDuration';
    this.threadData.unshift(this.threadStatisticsData);
    this.ioTierTableThread!.recycleDataSource = this.threadData;
    // @ts-ignore
    this.threadData.shift(this.threadStatisticsData);
    this.currentLevelData = this.threadData;
    this.ioTierTableThread?.reMeauseHeight();
  }

  private getIoTierTip(obj: { obj: { tableName: unknown; durFormat: unknown; percent: unknown } }): string {
    return `<div>
                <div>ThreadName:${obj.obj.tableName}</div>
                <div>Duration:${obj.obj.durFormat}</div>
                <div>Percent:${obj.obj.percent}%</div> 
            </div>
        `;
  }

  private ioTierThreadLevelClickEvent(it: unknown): void {
    this.reset(this.ioTierTableSo!, true);
    this.showAssignLevel(this.ioTierTableSo!, this.ioTierTableThread!, 3, this.ioTierTableSo!.recycleDataSource);
    this.getIOTierSo(it); // @ts-ignore
    this.threadName = it.tableName;
    this.ioPieChart?.hideTip();
    let title = '';
    if (this.processName.length > 0) {
      title += `${this.processName} / `;
    }
    if (this.typeName.length > 0) {
      title += `${this.typeName} / `;
    }
    if (this.threadName.length > 0) {
      title += this.threadName;
    }
    this.tierTitleEl!.textContent = title;
  }

  private libraryPieChart(): void {
    // @ts-ignore
    this.sumDur = this.libStatisticsData.allDuration;
    this.ioPieChart!.config = {
      appendPadding: 0,
      data: this.getIOTierPieChartData(this.soData),
      angleField: 'duration',
      colorField: 'tableName',
      radius: 1,
      label: {
        type: 'outer',
      },
      tip: (ioTierObj): string => {
        return `<div>
                    <div>Library:${
                      // @ts-ignore
                      ioTierObj.obj.tableName
                    }</div>
                    <div>Duration:${
                      // @ts-ignore
                      ioTierObj.obj.durFormat
                    }</div>
                    <div>Percent:${
                      // @ts-ignore
                      ioTierObj.obj.percent
                    }%</div> 
                </div>
            `;
      },
      angleClick: (ioTierBean): void => {
        // @ts-ignore
        if (ioTierBean.tableName !== 'other') {
          this.ioTierSoLevelClickEvent(ioTierBean);
        }
      },
      hoverHandler: (data): void => {
        if (data) {
          this.ioTierTableSo!.setCurrentHover(data);
        } else {
          this.ioTierTableSo!.mouseOut();
        }
      },
      interactions: [
        {
          type: 'element-active',
        },
      ],
    };
    this.ioTierTitle();
    this.tabName!.textContent = 'Statistic By Library AllDuration';
    this.soData.unshift(this.libStatisticsData);
    this.ioTierTableSo!.recycleDataSource = this.soData;
    // @ts-ignore
    this.soData.shift(this.libStatisticsData);
    this.currentLevelData = this.soData;
    this.ioTierTableSo?.reMeauseHeight();
  }

  private ioTierTitle(): void {
    let title = '';
    if (this.processName.length > 0) {
      title += `${this.processName} / `;
    }
    if (this.typeName.length > 0) {
      if (this.hideThreadCheckBox?.checked) {
        title += this.typeName;
      } else {
        title += `${this.typeName} / `;
      }
    }
    if (this.threadName.length > 0) {
      title += this.threadName;
    }
    this.tierTitleEl!.textContent = title;
  }

  private ioTierSoLevelClickEvent(it: unknown): void {
    this.reset(this.tableFunction!, true);
    this.showAssignLevel(this.tableFunction!, this.ioTierTableSo!, 4, this.tableFunction!.recycleDataSource);
    this.getIOTierFunction(it);
    this.ioPieChart?.hideTip();
    let title = '';
    if (this.processName.length > 0) {
      title += `${this.processName} / `;
    }
    if (this.typeName.length > 0) {
      title += `${this.typeName} / `;
    }
    if (this.threadName.length > 0 && !this.hideThreadCheckBox!.checked) {
      title += `${this.threadName} / `;
    } // @ts-ignore
    if (it.tableName.length > 0) {
      // @ts-ignore
      title += it.tableName;
    }
    this.tierTitleEl!.textContent = title;
  }

  private sortByColumn(): void {
    let ioTierCurrentTable: LitTable | null | undefined;
    switch (this.currentLevel) {
      case 0:
        ioTierCurrentTable = this.ioTierTableProcess;
        break;
      case 1:
        ioTierCurrentTable = this.tierTableType;
        break;
      case 2:
        ioTierCurrentTable = this.ioTierTableThread;
        break;
      case 3:
        ioTierCurrentTable = this.ioTierTableSo;
        break;
      case 4:
        ioTierCurrentTable = this.tableFunction;
        break;
    }
    if (!ioTierCurrentTable) {
      return;
    }
    this.sortByType(ioTierCurrentTable);
  }

  private sortByType(ioTierCurrentTable: LitTable): void {
    if (this.ioSortType === 0) {
      let sortZeroIoArr = [...this.currentLevelData];
      switch (this.currentLevel) {
        case 0:
          sortZeroIoArr.unshift(this.processStatisticsData);
          break;
        case 1:
          sortZeroIoArr.unshift(this.typeStatisticsData);
          break;
        case 2:
          sortZeroIoArr.unshift(this.threadStatisticsData);
          break;
        case 3:
          sortZeroIoArr.unshift(this.libStatisticsData);
          break;
        case 4:
          sortZeroIoArr.unshift(this.functionStatisticsData);
          break;
      }
      ioTierCurrentTable!.recycleDataSource = sortZeroIoArr;
    } else {
      let sortIoArr = [...this.currentLevelData];
      if (this.ioSortColumn === 'tableName') {
        this.sortTableNameCase(ioTierCurrentTable, sortIoArr);
      } else if (this.ioSortColumn === 'durFormat' || this.ioSortColumn === 'percent') {
        ioTierCurrentTable!.recycleDataSource = sortIoArr.sort((a, b): number => {
          // @ts-ignore
          return this.ioSortType === 1 ? a.duration - b.duration : b.duration - a.duration;
        });
      }
      switch (this.currentLevel) {
        case 0:
          sortIoArr.unshift(this.processStatisticsData);
          break;
        case 1:
          sortIoArr.unshift(this.typeStatisticsData);
          break;
        case 2:
          sortIoArr.unshift(this.threadStatisticsData);
          break;
        case 3:
          sortIoArr.unshift(this.libStatisticsData);
          break;
        case 4:
          sortIoArr.unshift(this.functionStatisticsData);
          break;
      }
      ioTierCurrentTable!.recycleDataSource = sortIoArr;
    }
  }

  private sortTableNameCase(ioTierCurrentTable: LitTable, sortIoArr: unknown[]): void {
    ioTierCurrentTable!.recycleDataSource = sortIoArr.sort((firstIOElement, secondIOElement): number => {
      if (this.ioSortType === 1) {
        // @ts-ignore
        if (firstIOElement.tableName > secondIOElement.tableName) {
          return 1; // @ts-ignore
        } else if (firstIOElement.tableName === secondIOElement.tableName) {
          return 0;
        } else {
          return -1;
        }
      } else {
        // @ts-ignore
        if (secondIOElement.tableName > firstIOElement.tableName) {
          return 1; // @ts-ignore
        } else if (firstIOElement.tableName === secondIOElement.tableName) {
          return 0;
        } else {
          return -1;
        }
      }
    });
  }

  private getIOTierProcess(result: Array<unknown>): void {
    // @ts-ignore
    if (!this.processData || this.processData.length === 0) {
      this.pidData = [];
      this.processStatisticsData = [];
      this.processPieChart();
      return;
    }
    let allDur = 0;
    let ioMap = new Map<string, Array<number | string>>();
    for (let itemData of result) {
      // @ts-ignore
      allDur += itemData.dur; // @ts-ignore
      if (ioMap.has(itemData.pid)) {
        // @ts-ignore
        ioMap.get(itemData.pid)?.push(itemData);
      } else {
        let itemArray = [];
        itemArray.push(itemData); // @ts-ignore
        ioMap.set(itemData.pid, itemArray);
      }
    }
    this.pidData = [];
    ioMap.forEach((value: Array<unknown>, key: string): void => {
      let ioPidDataDur = 0;
      let pName = '';
      for (let item of value) {
        // @ts-ignore
        if (item.processName && item.processName.length > 0) {
          // @ts-ignore
          if (!item.processName.endsWith(`(${item.pid})`)) {
            // @ts-ignore
            item.processName = `${item.processName}(${item.pid})`;
          }
        } else {
          // @ts-ignore
          item.processName = `Process(${item.pid})`;
        } // @ts-ignore
        pName = item.processName; // @ts-ignore
        ioPidDataDur += item.dur;
      }
      this.pidData.push({
        tableName: pName,
        pid: key,
        percent: ((ioPidDataDur / allDur) * 100).toFixed(2),
        durFormat: Utils.getProbablyTime(ioPidDataDur),
        duration: ioPidDataDur,
      });
    });
    // @ts-ignore
    this.pidData.sort((a, b) => b.duration - a.duration);
    this.processStatisticsData = this.totalDurationData(allDur);
    this.currentLevel = 0;
    this.progressEL!.loading = false;
    this.processPieChart();
  }

  private getIOTierType(item: unknown): void {
    this.progressEL!.loading = true;
    let ioTypeMap = new Map<number, Array<number | string>>();
    let allDur = 0; // @ts-ignore
    if (!this.processData || this.processData.length === 0) {
      return;
    } // @ts-ignore
    for (let processItem of this.processData) {
      // @ts-ignore
      if (item && processItem.pid !== item.pid && !this.hideProcessCheckBox?.checked) {
        continue;
      }
      allDur += processItem.dur;
      if (ioTypeMap.has(processItem.type)) {
        ioTypeMap.get(processItem.type)?.push(processItem);
      } else {
        let itemArray = [];
        itemArray.push(processItem);
        ioTypeMap.set(processItem.type, itemArray);
      }
    }
    this.typeData = [];
    ioTypeMap.forEach((value: Array<unknown>, key: number): void => {
      let dur = 0;
      for (let ioItem of value) {
        // @ts-ignore
        dur += ioItem.dur;
      }
      const ioTypeData = {
        tableName: this.typeIdToString(key), // @ts-ignore
        pid: item === null ? value[0].pid : item.pid, // @ts-ignore
        tid: item === null ? value[0].tid : item.tid,
        type: key,
        percent: ((dur / allDur) * 100).toFixed(2),
        durFormat: Utils.getProbablyTime(dur),
        duration: dur,
      };
      this.typeData.push(ioTypeData);
    }); // @ts-ignore
    this.typeData.sort((a, b) => b.duration - a.duration);
    this.typeStatisticsData = this.totalDurationData(allDur);
    this.currentLevel = 1;
    this.typePieChart();
    this.progressEL!.loading = false;
  }

  private getIOTierThread(item: unknown): void {
    this.progressEL!.loading = true;
    let threadMap = new Map<string, Array<number | string>>(); // @ts-ignore
    let pid = item.pid; // @ts-ignore
    let type = item.type;
    let allDur = 0; // @ts-ignore
    if (!this.processData || this.processData.length === 0) {
      return;
    } // @ts-ignore
    for (let itemData of this.processData) {
      if (
        (!this.hideProcessCheckBox?.checked && itemData.pid !== pid) ||
        itemData.type !== type ||
        (itemData.type !== type && this.hideProcessCheckBox?.checked)
      ) {
        continue;
      }
      allDur += itemData.dur;
      if (threadMap.has(itemData.tid)) {
        threadMap.get(itemData.tid)?.push(itemData);
      } else {
        let itemArray = [];
        itemArray.push(itemData);
        threadMap.set(itemData.tid, itemArray);
      }
    }
    this.calculateThreadData(threadMap, item, allDur); // @ts-ignore
    this.threadData.sort((a, b) => b.duration - a.duration);
    this.threadStatisticsData = this.totalDurationData(allDur);
    this.currentLevel = 2;
    this.progressEL!.loading = false;
    this.threadPieChart();
  }

  private calculateThreadData(threadMap: Map<string, Array<number | string>>, item: unknown, allDur: number): void {
    this.threadData = [];
    threadMap.forEach((value: Array<unknown>, key: string): void => {
      let dur = 0;
      let tName = '';
      for (let item of value) {
        // @ts-ignore
        dur += item.dur; // @ts-ignore
        tName = item.threadName =
          // @ts-ignore
          item.threadName === null || item.threadName === undefined
            ? // @ts-ignore
              `Thread(${item.tid})`
            : // @ts-ignore
              `${item.threadName}(${item.tid})`;
      }
      const threadData = {
        tableName: tName,
        // @ts-ignore
        pid: item.pid,
        // @ts-ignore
        type: item.type,
        tid: key,
        percent: ((dur / allDur) * 100).toFixed(2),
        durFormat: Utils.getProbablyTime(dur),
        duration: dur,
      };
      this.threadData.push(threadData);
    });
  }

  private getIOTierSo(item: unknown): void {
    this.progressEL!.loading = true;
    let allDur = 0;
    let libMap = new Map<number, Array<number | string>>(); // @ts-ignore
    if (!this.processData || this.processData.length === 0) {
      return;
    } // @ts-ignore
    for (let processItemData of this.processData) {
      if (this.tierSoIsAccumulationData(item, processItemData)) {
        continue;
      }
      allDur += processItemData.dur;
      if (libMap.has(processItemData.libId)) {
        libMap.get(processItemData.libId)?.push(processItemData);
      } else {
        let dataArray = [];
        dataArray.push(processItemData);
        libMap.set(processItemData.libId, dataArray);
      }
    }
    this.updateSoData(libMap, item, allDur);
    this.libStatisticsData = this.totalDurationData(allDur);
    this.currentLevel = 3;
    this.progressEL!.loading = false;
    this.libraryPieChart();
  }

  private tierSoIsAccumulationData(item: unknown, processItemData: unknown): boolean {
    if (!this.hideProcessCheckBox?.checked && !this.hideThreadCheckBox?.checked) {
      // @ts-ignore
      return (
        item && // @ts-ignore
        (processItemData.pid !== item.pid || processItemData.tid !== item.tid || processItemData.type !== item.type)
      );
    } else if (!this.hideProcessCheckBox?.checked && this.hideThreadCheckBox?.checked) {
      // @ts-ignore
      return item && (processItemData.pid !== item.pid || processItemData.type !== item.type);
    } else if (this.hideProcessCheckBox?.checked && !this.hideThreadCheckBox?.checked) {
      // @ts-ignore
      return (item && processItemData.tid !== item.tid) || processItemData.type !== item.type;
    } else if (this.hideProcessCheckBox?.checked && this.hideThreadCheckBox?.checked) {
      // @ts-ignore
      return item && processItemData.type !== item.type;
    }
    return false;
  }

  private updateSoData(libMap: Map<number, Array<number | string>>, item: unknown, allDur: number): void {
    this.soData = [];
    libMap.forEach((value: unknown[], key: number): void => {
      let dur = 0;
      let libName = '';
      for (let item of value) {
        // @ts-ignore
        dur += item.dur;
        if (key === null) {
          // @ts-ignore
          item.libName = 'unknown';
        } // @ts-ignore
        libName = item.libName;
      }
      let libPath = libName?.split('/');
      if (libPath) {
        libName = libPath[libPath.length - 1];
      }
      const soData = {
        tableName: libName, // @ts-ignore
        pid: item === null ? value[0].pid : item.pid,
        // @ts-ignore
        type: item === null ? value[0].type : item.type,
        // @ts-ignore
        tid: item === null ? value[0].tid : item.tid,
        libId: key,
        percent: ((dur / allDur) * 100).toFixed(2),
        durFormat: Utils.getProbablyTime(dur),
        duration: dur,
      };
      this.soData.push(soData);
    }); // @ts-ignore
    this.soData.sort((a, b) => b.duration - a.duration);
  }

  private getIOTierFunction(item: unknown): void {
    this.progressEL!.loading = true;
    this.shadowRoot!.querySelector<HTMLDivElement>('.io-tier-subheading')!.textContent =
      'Statistic By Function AllDuration';
    // @ts-ignore
    let tid = item.tid;
    // @ts-ignore
    let pid = item.pid;
    // @ts-ignore
    let type = item.type;
    // @ts-ignore
    let libId = item.libId;
    let allDur = 0;
    let symbolMap = new Map<number, Array<unknown>>();
    // @ts-ignore
    if (!this.processData || this.processData.length === 0) {
      return;
    }
    // @ts-ignore
    for (let processData of this.processData) {
      if (this.functionIsAccumulationData(processData, tid, pid, type, libId)) {
        continue;
      }
      allDur += processData.dur;
      if (symbolMap.has(processData.symbolId)) {
        symbolMap.get(processData.symbolId)?.push(processData);
      } else {
        let dataArray = [];
        dataArray.push(processData);
        symbolMap.set(processData.symbolId, dataArray);
      }
    }
    this.updateFunctionData(symbolMap, item, allDur);
    this.functionStatisticsData = this.totalDurationData(allDur);
    this.currentLevel = 4;
    this.progressEL!.loading = false;
    // @ts-ignore
    this.sumDur = this.functionStatisticsData.allDuration;
    this.setIoPieChartConfig();
    this.functionData.unshift(this.functionStatisticsData);
    this.tableFunction!.recycleDataSource = this.functionData;
    this.tableFunction?.reMeauseHeight();
    // @ts-ignore
    this.functionData.shift(this.functionStatisticsData);
    this.currentLevelData = this.functionData;
  }

  private setIoPieChartConfig(): void {
    this.ioPieChart!.config = {
      appendPadding: 0,
      data: this.getIOTierPieChartData(this.functionData),
      angleField: 'duration',
      colorField: 'tableName',
      radius: 1,
      label: {
        type: 'outer',
      }, // @ts-ignore
      tip: this.getTip(),
      hoverHandler: (tierData): void => {
        if (tierData) {
          this.tableFunction!.setCurrentHover(tierData);
        } else {
          this.tableFunction!.mouseOut();
        }
      },
      interactions: [
        {
          type: 'element-active',
        },
      ],
    };
  }

  private functionIsAccumulationData(
    processData: unknown,
    tid: number,
    pid: number,
    type: string,
    libId: number
  ): boolean {
    if (!processData) {
      return false;
    }
    if (!this.hideProcessCheckBox?.checked && !this.hideThreadCheckBox?.checked) {
      return (
        // @ts-ignore
        processData.pid !== pid || processData.tid !== tid || processData.type !== type || processData.libId !== libId
      );
    } else if (!this.hideProcessCheckBox?.checked && this.hideThreadCheckBox?.checked) {
      // @ts-ignore
      return processData.pid !== pid || processData.type !== type || processData.libId !== libId;
    } else if (this.hideProcessCheckBox?.checked && !this.hideThreadCheckBox?.checked) {
      // @ts-ignore
      return processData.tid !== tid || processData.type !== type || processData.libId !== libId;
    } else if (this.hideProcessCheckBox?.checked && this.hideThreadCheckBox?.checked) {
      // @ts-ignore
      return processData.type !== type || processData.libId !== libId;
    }
    return false;
  }

  private updateFunctionData(symbolMap: Map<number, Array<unknown>>, item: unknown, allDur: number): void {
    this.functionData = [];
    symbolMap.forEach((symbolItems, key): void => {
      let dur = 0;
      let funSymbolName = '';
      for (let symbolItem of symbolItems) {
        // @ts-ignore
        funSymbolName = symbolItem.symbolName;
        // @ts-ignore
        dur += symbolItem.dur;
      }
      let symbolPath = funSymbolName?.split('/');
      if (symbolPath) {
        funSymbolName = symbolPath[symbolPath.length - 1];
      }
      const symbolData = {
        // @ts-ignore
        pid: item.pid,
        // @ts-ignore
        tid: item.tid,
        // @ts-ignore
        type: item.type,
        // @ts-ignore
        libId: item.libId,
        symbolId: key,
        percent: ((dur / allDur) * 100).toFixed(2),
        tableName: funSymbolName,
        durFormat: Utils.getProbablyTime(dur),
        duration: dur,
      };
      this.functionData.push(symbolData);
    });
    // @ts-ignore
    this.functionData.sort((a, b) => b.duration - a.duration);
  }

  private getTip() {
    return (obj: { obj: { tableName: unknown; durFormat: unknown; percent: unknown } }): string => {
      return `<div>
                    <div>Function:${obj.obj.tableName}</div>
                    <div>Duration:${obj.obj.durFormat}</div>
                    <div>percent:${obj.obj.percent}</div>
                </div>
            `;
    };
  }

  private typeIdToString(type: number): string {
    let ioTierReleaseType: string;
    if (type === 1) {
      ioTierReleaseType = 'DATA_READ';
    } else if (type === 2) {
      ioTierReleaseType = 'DATA_WRITE';
    } else if (type === 3) {
      ioTierReleaseType = 'METADATA_READ';
    } else if (type === 4) {
      ioTierReleaseType = 'METADATA_WRITE';
    }
    // @ts-ignore
    return ioTierReleaseType;
  }

  private totalDurationData(duration: number): {
    durFormat: string;
    percent: string;
    tableName: string;
    duration: number;
    allDuration: number;
  } {
    let allDuration;
    allDuration = {
      durFormat: Utils.getProbablyTime(duration),
      percent: ((duration / duration) * 100).toFixed(2),
      tableName: '',
      duration: 0,
      allDuration: duration,
    };
    return allDuration;
  }

  private getIOTierPieChartData(res: unknown[]): unknown[] {
    if (res.length > 20) {
      let IOTierPieChartArr: string[] = [];
      let other: unknown = {
        tableName: 'other',
        duration: 0,
        percent: 0,
        durFormat: 0,
      };
      for (let i = 0; i < res.length; i++) {
        if (i < 19) {
          // @ts-ignore
          IOTierPieChartArr.push(res[i]);
        } else {
          // @ts-ignore
          other.duration += res[i].duration;
          // @ts-ignore
          other.durFormat = Utils.getProbablyTime(other.duration);
          // @ts-ignore
          other.percent = ((other.duration / this.sumDur) * 100).toFixed(2);
        }
      }
      // @ts-ignore
      IOTierPieChartArr.push(other);
      return IOTierPieChartArr;
    }
    return res;
  }

  private getIoTierDataByWorker(args: unknown[], handler: Function): void {
    procedurePool.submitWithName(
      'logic0',
      'fileSystem-action',
      { args, callType: 'io', isAnalysis: true },
      undefined,
      (results: unknown): void => {
        handler(results);
        this.progressEL!.loading = false;
      }
    );
  }

  public connectedCallback(): void {
    new ResizeObserver((): void => {
      if (this.parentElement?.clientHeight !== 0) {
        this.ioTierTableProcess!.style.height = `${this.parentElement!.clientHeight - 50}px`;
        this.ioTierTableProcess?.reMeauseHeight();
        this.ioTierTableThread!.style.height = `${this.parentElement!.clientHeight - 50}px`;
        this.ioTierTableThread?.reMeauseHeight();
        this.ioTierTableSo!.style.height = `${this.parentElement!.clientHeight - 50}px`;
        this.ioTierTableSo?.reMeauseHeight();
        this.tableFunction!.style.height = `${this.parentElement!.clientHeight - 50}px`;
        this.tableFunction?.reMeauseHeight();
        this.tierTableType!.style.height = `${this.parentElement!.clientHeight - 50}px`;
        this.tierTableType?.reMeauseHeight();
        if (this.parentElement!.clientHeight >= 0 && this.parentElement!.clientHeight <= 31) {
          this.tierFilterEl!.style.display = 'none';
        } else {
          this.tierFilterEl!.style.display = 'flex';
        }
      }
    }).observe(this.parentElement!);
  }

  initHtml(): string {
    return TabPaneIOTierStatisticsAnalysisHtml;
  }
}
