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
import { procedurePool } from '../../../../database/Procedure';
import { LitCheckBox } from '../../../../../base-ui/checkbox/LitCheckBox';
import { TabPaneFilter } from '../TabPaneFilter';
import { initSort } from '../SheetUtils';
import { TabPaneVMCallTree } from './TabPaneIOCallTree';
import { TabPaneVirtualMemoryStatisticsAnalysisHtml } from './TabPaneVirtualMemoryStatisticsAnalysis.html';

@element('tabpane-virtual-memory-statistics-analysis')
export class TabPaneVirtualMemoryStatisticsAnalysis extends BaseElement {
  private vmPieChart: LitChartPie | null | undefined;
  private vmCurrentSelection: SelectionParam | null | undefined;
  private vmStatisticsAnalysisProcessData: unknown;
  private vmStatisticsAnalysisPidData!: unknown[];
  private vmStatisticsAnalysisThreadData!: unknown[];
  private vmStatisticsAnalysisSoData!: unknown[];
  private vmStatisticsAnalysisFunctionData!: unknown[];
  private vmStatisticsAnalysisTypeData!: unknown[];
  private vmStatisticsAnalysisTableProcess: LitTable | null | undefined;
  private vmStatisticsAnalysisTableType: LitTable | null | undefined;
  private vmStatisticsAnalysisTableThread: LitTable | null | undefined;
  private vmStatisticsAnalysisTableSo: LitTable | null | undefined;
  private vmStatisticsAnalysisTableFunction: LitTable | null | undefined;
  private sumDur: number = 0;
  private vmStatisticsAnalysisRange: HTMLLabelElement | null | undefined;
  private vmBack: HTMLDivElement | null | undefined;
  private tabName: HTMLDivElement | null | undefined;
  private vmStatisticsAnalysisProgressEL: LitProgressBar | null | undefined;
  private vmProcessName: string = '';
  private vmtypeName: string = '';
  private vmThreadName: string = '';
  private vmSortColumn: string = '';
  private vmSortType: number = 0;
  private currentLevel = -1;
  private currentLevelData!: Array<unknown>;
  private processStatisticsData!: {};
  private typeStatisticsData!: {};
  private threadStatisticsData!: {};
  private libStatisticsData!: {};
  private functionStatisticsData!: {};
  private virtualMemoryTitleEl: HTMLDivElement | undefined | null;
  private virtualMemoryFilterEl: TabPaneFilter | undefined | null;
  private hideProcessCheckBox: LitCheckBox | undefined | null;
  private hideThreadCheckBox: LitCheckBox | undefined | null;
  private checkBoxs: NodeListOf<LitCheckBox> | undefined | null;
  private vmTableArray: NodeListOf<LitTable> | undefined | null;

  set data(vmStatisticsAnalysisSelection: SelectionParam) {
    if (vmStatisticsAnalysisSelection === this.vmCurrentSelection) {
      this.vmStatisticsAnalysisPidData.unshift(this.processStatisticsData);
      this.vmStatisticsAnalysisTableProcess!.recycleDataSource = this.vmStatisticsAnalysisPidData;
      // @ts-ignore
      this.vmStatisticsAnalysisPidData.shift(this.processStatisticsData);
      return;
    }
    if (this.vmTableArray && this.vmTableArray.length > 0) {
      for (let vmTable of this.vmTableArray) {
        initSort(vmTable!, this.vmSortColumn, this.vmSortType);
      }
    }
    this.reset(this.vmStatisticsAnalysisTableProcess!, false);
    this.hideProcessCheckBox!.checked = false;
    this.hideThreadCheckBox!.checked = false;
    this.vmCurrentSelection = vmStatisticsAnalysisSelection;
    this.virtualMemoryTitleEl!.textContent = '';
    this.tabName!.textContent = '';
    this.vmStatisticsAnalysisRange!.textContent = `Selected range: ${parseFloat(
      ((vmStatisticsAnalysisSelection.rightNs - vmStatisticsAnalysisSelection.leftNs) / 1000000.0).toFixed(5)
    )}  ms`;
    this.vmStatisticsAnalysisProgressEL!.loading = true;
    this.getVmDataByWorker(
      [
        {
          funcName: 'setSearchValue',
          funcArgs: [''],
        },
        {
          funcName: 'getCurrentDataFromDb',
          funcArgs: [{ queryFuncName: 'virtualMemory', ...vmStatisticsAnalysisSelection }],
        },
      ],
      (results: unknown[]): void => {
        this.disableCheckBox(results);
        this.getVirtualMemoryProcess(results);
      }
    );
  }

  initElements(): void {
    this.vmStatisticsAnalysisRange = this.shadowRoot?.querySelector('#time-range');
    this.vmPieChart = this.shadowRoot!.querySelector<LitChartPie>('#vm-chart-pie');
    this.vmStatisticsAnalysisTableProcess = this.shadowRoot!.querySelector<LitTable>('#tb-process-usage');
    this.vmStatisticsAnalysisTableType = this.shadowRoot!.querySelector<LitTable>('#tb-type-usage');
    this.vmStatisticsAnalysisTableThread = this.shadowRoot!.querySelector<LitTable>('#tb-thread-usage');
    this.vmStatisticsAnalysisTableSo = this.shadowRoot!.querySelector<LitTable>('#tb-so-usage');
    this.vmStatisticsAnalysisTableFunction = this.shadowRoot!.querySelector<LitTable>('#tb-function-usage');
    this.vmBack = this.shadowRoot!.querySelector<HTMLDivElement>('.vm-go-back');
    this.tabName = this.shadowRoot!.querySelector<HTMLDivElement>('.vm-subheading');
    this.vmStatisticsAnalysisProgressEL = this.shadowRoot?.querySelector('.vm-progress') as LitProgressBar;
    this.goBack();
    this.virtualMemoryTitleEl = this.shadowRoot!.querySelector<HTMLDivElement>('.title');
    this.virtualMemoryFilterEl = this.shadowRoot?.querySelector('#filter');
    this.virtualMemoryFilterEl!.setOptionsList(['Hide Process', 'Hide Thread']);
    let popover = this.virtualMemoryFilterEl!.shadowRoot!.querySelector('#check-popover');
    this.hideProcessCheckBox = popover!!.querySelector<LitCheckBox>('div > #hideProcess');
    this.hideThreadCheckBox = popover!!.querySelector<LitCheckBox>('div > #hideThread');
    this.checkBoxs = popover!.querySelectorAll<LitCheckBox>('.check-wrap > lit-check-box');
    this.vmTableArray = this.shadowRoot!.querySelectorAll('lit-table') as NodeListOf<LitTable>;
    for (let vmTable of this.vmTableArray) {
      this.columnClickEvent(vmTable);
      vmTable!.addEventListener('contextmenu', function (event: MouseEvent): void {
        event.preventDefault(); // 阻止默认的上下文菜单弹框
      });
      this.rowHoverEvent(vmTable);
      this.rowClickEvent(vmTable);
    }
    for (let box of this.checkBoxs) {
      this.checkBoxEvent(box);
    }
    const addRowClickEventListener = (vmTable: LitTable, clickEvent: Function): void => {
      vmTable.addEventListener('row-click', (evt: Event): void => {
        // @ts-ignore
        const detail = evt.detail;
        if (detail.button === 0 && detail.data.tableName !== '' && detail.data.duration !== 0) {
          clickEvent(detail.data, this.vmCurrentSelection);
        }
      });
    };

    addRowClickEventListener(this.vmStatisticsAnalysisTableProcess!, this.vmProcessLevelClickEvent.bind(this));
    addRowClickEventListener(this.vmStatisticsAnalysisTableType!, this.vmTypeLevelClickEvent.bind(this));
    addRowClickEventListener(this.vmStatisticsAnalysisTableThread!, this.vmThreadLevelClickEvent.bind(this));
    addRowClickEventListener(this.vmStatisticsAnalysisTableSo!, this.vmSoLevelClickEvent.bind(this));
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

  private columnClickEvent(vmTable: LitTable): void {
    vmTable!.addEventListener('column-click', (evt: Event): void => {
      // @ts-ignore
      this.vmSortColumn = evt.detail.key;
      // @ts-ignore
      this.vmSortType = evt.detail.sort;
      this.sortByColumn();
    });
  }

  private checkBoxEvent(box: LitCheckBox): void {
    box!.addEventListener('change', (): void => {
      if (this.hideProcessCheckBox!.checked && this.hideThreadCheckBox!.checked) {
        this.hideThread();
        this.vmBack!.style.visibility = 'hidden';
      } else if (this.hideProcessCheckBox!.checked && !this.hideThreadCheckBox!.checked) {
        this.hideProcess();
      } else {
        this.reset(this.vmStatisticsAnalysisTableProcess!, false); // @ts-ignore
        this.getVirtualMemoryProcess(this.vmStatisticsAnalysisProcessData);
      }
    });
  }

  private rowClickEvent(vmTable: LitTable): void {
    vmTable!.addEventListener('row-click', (evt: Event): void => {
      // @ts-ignore
      let detail = evt.detail;
      if (detail.button === 2) {
        let vmTab = this.parentElement?.parentElement?.querySelector<TabPaneVMCallTree>(
          '#box-vm-calltree > tabpane-vm-calltree'
        );
        vmTab!.cWidth = this.clientWidth;
        vmTab!.currentCallTreeLevel = this.currentLevel;
        if (this.hideProcessCheckBox?.checked) {
          detail.data.pid = undefined;
        }
        if (this.hideThreadCheckBox?.checked) {
          detail.data.tid = undefined;
        }
        vmTab!.rowClickData = detail.data;
        let title = '';
        if (this.virtualMemoryTitleEl?.textContent === '') {
          title = detail.data.tableName;
        } else {
          title = `${this.virtualMemoryTitleEl?.textContent} / ${detail.data.tableName}`;
        }
        vmTab!.pieTitle = title;
        //  是否是在表格上右键点击跳转到火焰图的
        this.vmCurrentSelection!.isRowClick = true;
        vmTab!.data = this.vmCurrentSelection;
      }
    });
  }

  private rowHoverEvent(vmTable: LitTable): void {
    vmTable!.addEventListener('row-hover', (evt: Event): void => {
      // @ts-ignore
      let detail = evt.detail;
      if (detail.data) {
        let tableData = detail.data;
        tableData.isHover = true;
        if (detail.callBack) {
          detail.callBack(true);
        }
      }
      this.vmPieChart?.showHover();
      this.vmPieChart?.hideTip();
    });
  }

  private reset(showTable: LitTable, isShowBack: boolean): void {
    this.clearData();
    if (isShowBack) {
      this.vmBack!.style.visibility = 'visible';
    } else {
      this.vmBack!.style.visibility = 'hidden';
      this.virtualMemoryTitleEl!.textContent = '';
    }
    if (this.vmTableArray) {
      for (let virtualMemoryTable of this.vmTableArray) {
        if (virtualMemoryTable === showTable) {
          initSort(virtualMemoryTable!, this.vmSortColumn, this.vmSortType);
          virtualMemoryTable.style.display = 'grid';
          virtualMemoryTable!.removeAttribute('hideDownload');
        } else {
          virtualMemoryTable!.style.display = 'none';
          virtualMemoryTable.setAttribute('hideDownload', '');
        }
      }
    }
  }

  private clearData(): void {
    this.vmPieChart!.dataSource = [];
    this.vmStatisticsAnalysisTableProcess!.recycleDataSource = [];
    this.vmStatisticsAnalysisTableType!.recycleDataSource = [];
    this.vmStatisticsAnalysisTableThread!.recycleDataSource = [];
    this.vmStatisticsAnalysisTableSo!.recycleDataSource = [];
    this.vmStatisticsAnalysisTableFunction!.recycleDataSource = [];
  }

  private showAssignLevel(showVmTable: LitTable, hideVmTable: LitTable, currentLevel: number): void {
    showVmTable!.style.display = 'grid';
    hideVmTable!.style.display = 'none';
    hideVmTable.setAttribute('hideDownload', '');
    showVmTable?.removeAttribute('hideDownload');
    this.currentLevel = currentLevel;
  }

  private goBack(): void {
    this.vmBack!.addEventListener('click', () => {
      if (this.tabName!.textContent === 'Statistic By type AllDuration') {
        this.vmBack!.style.visibility = 'hidden';
        this.showAssignLevel(this.vmStatisticsAnalysisTableProcess!, this.vmStatisticsAnalysisTableType!, 0);
        this.processPieChart();
      } else if (this.tabName!.textContent === 'Statistic By Thread AllDuration') {
        if (this.hideProcessCheckBox?.checked) {
          this.vmBack!.style.visibility = 'hidden';
        } else {
          this.vmBack!.style.visibility = 'visible';
        }
        this.showAssignLevel(this.vmStatisticsAnalysisTableType!, this.vmStatisticsAnalysisTableThread!, 1);
        this.typePieChart();
      } else if (this.tabName!.textContent === 'Statistic By Library AllDuration') {
        if (this.hideThreadCheckBox?.checked) {
          if (this.hideProcessCheckBox?.checked) {
            this.vmBack!.style.visibility = 'hidden';
          }
          this.showAssignLevel(this.vmStatisticsAnalysisTableType!, this.vmStatisticsAnalysisTableSo!, 1);
          this.typePieChart();
        } else {
          this.showAssignLevel(this.vmStatisticsAnalysisTableThread!, this.vmStatisticsAnalysisTableSo!, 2);
          this.threadPieChart();
        }
      } else if (this.tabName!.textContent === 'Statistic By Function AllDuration') {
        this.showAssignLevel(this.vmStatisticsAnalysisTableSo!, this.vmStatisticsAnalysisTableFunction!, 3);
        this.libraryPieChart();
      }
    });
  }

  private hideProcess(): void {
    this.reset(this.vmStatisticsAnalysisTableType!, false);
    this.vmProcessName = '';
    this.getVirtualMemoryType(null);
  }

  private hideThread(it?: unknown): void {
    this.reset(this.vmStatisticsAnalysisTableType!, true);
    this.vmProcessName = '';
    this.vmThreadName = '';
    if (it) {
      this.getVirtualMemoryType(it);
    } else {
      this.getVirtualMemoryType(null);
    }
  }

  private processPieChart(): void {
    // @ts-ignore
    this.sumDur = this.processStatisticsData.allDuration;
    this.vmPieChart!.config = {
      appendPadding: 0,
      data: this.getVmPieChartData(this.vmStatisticsAnalysisPidData),
      angleField: 'duration',
      colorField: 'tableName',
      radius: 1,
      label: {
        type: 'outer',
      }, // @ts-ignore
      tip: this.getVmTip(),
      angleClick: (it: Object): void => {
        // @ts-ignore
        if (it.tableName !== 'other') {
          this.vmProcessLevelClickEvent(it);
        }
      },
      hoverHandler: (data): void => {
        if (data) {
          this.vmStatisticsAnalysisTableProcess!.setCurrentHover(data);
        } else {
          this.vmStatisticsAnalysisTableProcess!.mouseOut();
        }
      },
      interactions: [
        {
          type: 'element-active',
        },
      ],
    };
    this.virtualMemoryTitleEl!.textContent = '';
    this.tabName!.textContent = 'Statistic By Process AllDuration';
    this.vmStatisticsAnalysisPidData.unshift(this.processStatisticsData);
    this.vmStatisticsAnalysisTableProcess!.recycleDataSource = this.vmStatisticsAnalysisPidData;
    // @ts-ignore
    this.vmStatisticsAnalysisPidData.shift(this.processStatisticsData);
    this.currentLevelData = this.vmStatisticsAnalysisPidData;
    this.vmStatisticsAnalysisTableProcess?.reMeauseHeight();
  }

  private getVmTip() {
    return (obj: { obj: { tableName: unknown; durFormat: unknown; percent: unknown } }): string => {
      return `<div>
                    <div>ProcessName:${obj.obj.tableName}</div>
                    <div>Duration:${obj.obj.durFormat}</div>
                    <div>Percent:${obj.obj.percent}%</div> 
                </div>
                    `;
    };
  }

  private vmProcessLevelClickEvent(it: unknown): void {
    this.reset(this.vmStatisticsAnalysisTableType!, true);
    this.getVirtualMemoryType(it); // @ts-ignore
    this.vmProcessName = it.tableName;
    this.virtualMemoryTitleEl!.textContent = this.vmProcessName;
    this.vmPieChart?.hideTip();
  }

  private typePieChart(): void {
    this.vmPieChart!.config = {
      appendPadding: 0,
      data: this.vmStatisticsAnalysisTypeData,
      angleField: 'duration',
      colorField: 'tableName',
      radius: 1,
      label: {
        type: 'outer',
      }, // @ts-ignore
      tip: this.getVmTip(),
      angleClick: (it): void => {
        this.vmTypeLevelClickEvent(it);
      },
      hoverHandler: (data): void => {
        if (data) {
          this.vmStatisticsAnalysisTableType!.setCurrentHover(data);
        } else {
          this.vmStatisticsAnalysisTableType!.mouseOut();
        }
      },
      interactions: [
        {
          type: 'element-active',
        },
      ],
    };
    this.virtualMemoryTitleEl!.textContent = this.vmProcessName;
    this.tabName!.textContent = 'Statistic By type AllDuration';
    this.vmStatisticsAnalysisTypeData.unshift(this.typeStatisticsData);
    this.vmStatisticsAnalysisTableType!.recycleDataSource = this.vmStatisticsAnalysisTypeData;
    // @ts-ignore
    this.vmStatisticsAnalysisTypeData.shift(this.typeStatisticsData);
    this.currentLevelData = this.vmStatisticsAnalysisTypeData;
    this.vmStatisticsAnalysisTableType?.reMeauseHeight();
  }

  private vmTypeLevelClickEvent(it: unknown): void {
    if (this.hideThreadCheckBox!.checked) {
      this.reset(this.vmStatisticsAnalysisTableSo!, true);
      this.getVirtualMemorySo(it);
    } else {
      this.reset(this.vmStatisticsAnalysisTableThread!, true);
      this.getVirtualMemoryThread(it);
    } // @ts-ignore
    this.vmtypeName = it.tableName;
    this.vmPieChart?.hideTip();
    let title = '';
    if (this.vmProcessName.length > 0) {
      title += `${this.vmProcessName} / `;
    }
    if (this.vmtypeName.length > 0) {
      title += this.vmtypeName;
    }
    this.virtualMemoryTitleEl!.textContent = title;
  }

  private threadPieChart(): void {
    // @ts-ignore
    this.sumDur = this.threadStatisticsData.allDuration;
    this.vmPieChart!.config = {
      appendPadding: 0,
      data: this.getVmPieChartData(this.vmStatisticsAnalysisThreadData),
      angleField: 'duration',
      colorField: 'tableName',
      radius: 1,
      label: {
        type: 'outer',
      }, // @ts-ignore
      tip: this.getVmTip(),
      angleClick: (it: Object): void => {
        // @ts-ignore
        if (it.tableName !== 'other') {
          this.vmThreadLevelClickEvent(it);
        }
      },
      hoverHandler: (data): void => {
        if (data) {
          this.vmStatisticsAnalysisTableThread!.setCurrentHover(data);
        } else {
          this.vmStatisticsAnalysisTableThread!.mouseOut();
        }
      },
      interactions: [
        {
          type: 'element-active',
        },
      ],
    };
    let title = '';
    if (this.vmProcessName.length > 0) {
      title += `${this.vmProcessName} / `;
    }
    if (this.vmtypeName.length > 0) {
      title += this.vmtypeName;
    }
    this.virtualMemoryTitleEl!.textContent = title;
    this.tabName!.textContent = 'Statistic By Thread AllDuration';
    this.vmStatisticsAnalysisThreadData.unshift(this.threadStatisticsData);
    this.vmStatisticsAnalysisTableThread!.recycleDataSource = this.vmStatisticsAnalysisThreadData;
    // @ts-ignore
    this.vmStatisticsAnalysisThreadData.shift(this.threadStatisticsData);
    this.currentLevelData = this.vmStatisticsAnalysisThreadData;
    this.vmStatisticsAnalysisTableThread?.reMeauseHeight();
  }

  private vmThreadLevelClickEvent(it: unknown): void {
    this.reset(this.vmStatisticsAnalysisTableSo!, true);
    this.getVirtualMemorySo(it); // @ts-ignore
    this.vmThreadName = it.tableName;
    this.vmPieChart?.hideTip();
    let virtualMemoryTitleTitle = '';
    if (this.vmProcessName.length > 0) {
      virtualMemoryTitleTitle += `${this.vmProcessName} / `;
    }
    if (this.vmtypeName.length > 0) {
      virtualMemoryTitleTitle += `${this.vmtypeName} / `;
    }
    if (this.vmThreadName.length > 0) {
      virtualMemoryTitleTitle += this.vmThreadName;
    }
    this.virtualMemoryTitleEl!.textContent = virtualMemoryTitleTitle;
  }

  private libraryPieChart(): void {
    // @ts-ignore
    this.sumDur = this.libStatisticsData.allDuration;
    this.setVmPieConfig();
    let title = '';
    if (this.vmProcessName.length > 0) {
      title += `${this.vmProcessName} / `;
    }
    if (this.vmtypeName.length > 0) {
      if (this.hideThreadCheckBox?.checked) {
        title += this.vmtypeName;
      } else {
        title += `${this.vmtypeName} / `;
      }
    }
    if (this.vmThreadName.length > 0) {
      title += this.vmThreadName;
    }
    this.virtualMemoryTitleEl!.textContent = title;
    this.tabName!.textContent = 'Statistic By Library AllDuration';
    this.vmStatisticsAnalysisSoData.unshift(this.libStatisticsData);
    this.vmStatisticsAnalysisTableSo!.recycleDataSource = this.vmStatisticsAnalysisSoData;
    // @ts-ignore
    this.vmStatisticsAnalysisSoData.shift(this.libStatisticsData);
    this.currentLevelData = this.vmStatisticsAnalysisSoData;
    this.vmStatisticsAnalysisTableSo?.reMeauseHeight();
  }

  private setVmPieChartConfig(): void {
    this.vmPieChart!.config = {
      appendPadding: 0,
      data: this.getVmPieChartData(this.vmStatisticsAnalysisFunctionData),
      angleField: 'duration',
      colorField: 'tableName',
      radius: 1,
      label: {
        type: 'outer',
      },
      tip: (vmLibraryObj): string => {
        return `<div>
                    <div>Library:${
                      // @ts-ignore
                      vmLibraryObj.obj.tableName
                    }</div>
                    <div>Duration:${
                      // @ts-ignore
                      vmLibraryObj.obj.durFormat
                    }</div>
                    <div>percent:${
                      // @ts-ignore
                      vmLibraryObj.obj.percent
                    }%</div> 
                </div>
                    `;
      },
      hoverHandler: (data): void => {
        if (data) {
          this.vmStatisticsAnalysisTableSo!.setCurrentHover(data);
        } else {
          this.vmStatisticsAnalysisTableSo!.mouseOut();
        }
      },
      interactions: [
        {
          type: 'element-active',
        },
      ],
    };
  }

  private vmSoLevelClickEvent(it: unknown): void {
    this.reset(this.vmStatisticsAnalysisTableFunction!, true);
    this.getVirtualMemoryFunction(it);
    this.vmPieChart?.hideTip();
    let title = '';
    if (this.vmProcessName.length > 0) {
      title += `${this.vmProcessName} / `;
    }
    if (this.vmtypeName.length > 0) {
      title += `${this.vmtypeName} / `;
    }
    if (this.vmThreadName.length > 0 && !this.hideThreadCheckBox!.checked) {
      title += `${this.vmThreadName} / `;
    } // @ts-ignore
    if (it.tableName.length > 0) {
      // @ts-ignore
      title += it.tableName;
    }
    this.virtualMemoryTitleEl!.textContent = title;
  }

  private sortByColumn(): void {
    let vmsCurrentTable: LitTable | null | undefined;
    switch (this.currentLevel) {
      case 0:
        vmsCurrentTable = this.vmStatisticsAnalysisTableProcess;
        break;
      case 1:
        vmsCurrentTable = this.vmStatisticsAnalysisTableType;
        break;
      case 2:
        vmsCurrentTable = this.vmStatisticsAnalysisTableThread;
        break;
      case 3:
        vmsCurrentTable = this.vmStatisticsAnalysisTableSo;
        break;
      case 4:
        vmsCurrentTable = this.vmStatisticsAnalysisTableFunction;
        break;
    }
    if (!vmsCurrentTable) {
      return;
    }
    this.sortByType(vmsCurrentTable);
  }

  private sortByType(vmsCurrentTable: LitTable): void {
    if (this.vmSortType === 0) {
      let vmsArr = [...this.currentLevelData];
      switch (this.currentLevel) {
        case 0:
          vmsArr.unshift(this.processStatisticsData);
          break;
        case 1:
          vmsArr.unshift(this.typeStatisticsData);
          break;
        case 2:
          vmsArr.unshift(this.threadStatisticsData);
          break;
        case 3:
          vmsArr.unshift(this.libStatisticsData);
          break;
        case 4:
          vmsArr.unshift(this.functionStatisticsData);
          break;
      }
      vmsCurrentTable!.recycleDataSource = vmsArr;
    } else {
      let vmsArray = [...this.currentLevelData];
      if (this.vmSortColumn === 'tableName') {
        this.sortTableNameCase(vmsCurrentTable, vmsArray);
      } else if (this.vmSortColumn === 'durFormat' || this.vmSortColumn === 'percent') {
        vmsCurrentTable!.recycleDataSource = vmsArray.sort((a, b) => {
          // @ts-ignore
          return this.vmSortType === 1 ? a.duration - b.duration : b.duration - a.duration;
        });
      }
      switch (this.currentLevel) {
        case 0:
          vmsArray.unshift(this.processStatisticsData);
          break;
        case 1:
          vmsArray.unshift(this.typeStatisticsData);
          break;
        case 2:
          vmsArray.unshift(this.threadStatisticsData);
          break;
        case 3:
          vmsArray.unshift(this.libStatisticsData);
          break;
        case 4:
          vmsArray.unshift(this.functionStatisticsData);
          break;
      }
      vmsCurrentTable!.recycleDataSource = vmsArray;
    }
  }

  private sortTableNameCase(vmsCurrentTable: LitTable, vmsArray: unknown[]): void {
    vmsCurrentTable!.recycleDataSource = vmsArray.sort((firstVMElement, secondVMElement): number => {
      if (this.vmSortType === 1) {
        // @ts-ignore
        if (firstVMElement.tableName > secondVMElement.tableName) {
          return 1; // @ts-ignore
        } else if (firstVMElement.tableName === secondVMElement.tableName) {
          return 0;
        } else {
          return -1;
        }
      } else {
        // @ts-ignore
        if (secondVMElement.tableName > firstVMElement.tableName) {
          return 1; // @ts-ignore
        } else if (firstVMElement.tableName === secondVMElement.tableName) {
          return 0;
        } else {
          return -1;
        }
      }
    });
  }

  private getVirtualMemoryProcess(result: Array<unknown>): void {
    this.vmStatisticsAnalysisProgressEL!.loading = true;
    this.vmStatisticsAnalysisProcessData = JSON.parse(JSON.stringify(result)); // @ts-ignore
    if (!this.vmStatisticsAnalysisProcessData || this.vmStatisticsAnalysisProcessData.length === 0) {
      this.vmStatisticsAnalysisPidData = [];
      this.processStatisticsData = [];
      this.processPieChart();
      return;
    }
    let allDur = 0;
    let vmMap = new Map<string, Array<number | string>>();
    for (let itemData of result) {
      // @ts-ignore
      allDur += itemData.dur; // @ts-ignore
      if (vmMap.has(itemData.pid)) {
        // @ts-ignore
        vmMap.get(itemData.pid)?.push(itemData);
      } else {
        let itemArray = [];
        itemArray.push(itemData); // @ts-ignore
        vmMap.set(itemData.pid, itemArray);
      }
    }
    this.vmStatisticsAnalysisPidData = [];
    vmMap.forEach((value: Array<unknown>, key: string): void => {
      let vmPidDataDur = 0;
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
        vmPidDataDur += item.dur;
      }
      this.vmStatisticsAnalysisPidData.push({
        tableName: pName,
        pid: key,
        percent: ((vmPidDataDur / allDur) * 100).toFixed(2),
        durFormat: Utils.getProbablyTime(vmPidDataDur),
        duration: vmPidDataDur,
      });
    }); // @ts-ignore
    this.vmStatisticsAnalysisPidData.sort((a, b) => b.duration - a.duration);
    this.processStatisticsData = this.totalDurationData(allDur);
    this.currentLevel = 0;
    this.vmStatisticsAnalysisProgressEL!.loading = false;
    this.processPieChart();
  }

  private getVirtualMemoryType(item: unknown): void {
    this.vmStatisticsAnalysisProgressEL!.loading = true;
    let vmTypeMap = new Map<number, Array<number | string>>();
    let allDur = 0; // @ts-ignore
    if (!this.vmStatisticsAnalysisProcessData || this.vmStatisticsAnalysisProcessData.length === 0) {
      return;
    } // @ts-ignore
    for (let vmsItem of this.vmStatisticsAnalysisProcessData) {
      // @ts-ignore
      if (item && vmsItem.pid !== item.pid && !this.hideProcessCheckBox?.checked) {
        continue;
      }
      allDur += vmsItem.dur;
      if (vmTypeMap.has(vmsItem.type)) {
        vmTypeMap.get(vmsItem.type)?.push(vmsItem);
      } else {
        let itemArray = [];
        itemArray.push(vmsItem);
        vmTypeMap.set(vmsItem.type, itemArray);
      }
    }
    this.vmStatisticsAnalysisTypeData = [];
    vmTypeMap.forEach((value: Array<unknown>, key: number): void => {
      let dur = 0;
      for (let vmItem of value) {
        // @ts-ignore
        dur += vmItem.dur;
      }
      const vmTypeData = {
        tableName: this.typeIdToString(key), // @ts-ignore
        pid: item === null ? value[0].pid : item.pid,
        type: key,
        percent: ((dur / allDur) * 100).toFixed(2),
        durFormat: Utils.getProbablyTime(dur),
        duration: dur,
      };
        this.vmStatisticsAnalysisTypeData.push(vmTypeData);
    }); // @ts-ignore
    this.vmStatisticsAnalysisTypeData.sort((a, b) => b.duration - a.duration);
    this.typeStatisticsData = this.totalDurationData(allDur);
    this.currentLevel = 1;
    this.typePieChart();
    this.vmStatisticsAnalysisProgressEL!.loading = false;
  }

  private getVirtualMemoryThread(item: unknown): void {
    this.vmStatisticsAnalysisProgressEL!.loading = true;
    let threadMap = new Map<string, Array<number | string>>(); // @ts-ignore
    let pid = item.pid; // @ts-ignore
    let type = item.type;
    let allDur = 0; // @ts-ignore
    if (!this.vmStatisticsAnalysisProcessData || this.vmStatisticsAnalysisProcessData.length === 0) {
      return;
    } // @ts-ignore
    for (let vmapItem of this.vmStatisticsAnalysisProcessData) {
      if (
        (!this.hideProcessCheckBox?.checked && vmapItem.pid !== pid) ||
        vmapItem.type !== type ||
        (vmapItem.type !== type && this.hideProcessCheckBox?.checked)
      ) {
        continue;
      }
      allDur += vmapItem.dur;
      if (threadMap.has(vmapItem.tid)) {
        threadMap.get(vmapItem.tid)?.push(vmapItem);
      } else {
        let itemArray = [];
        itemArray.push(vmapItem);
        threadMap.set(vmapItem.tid, itemArray);
      }
    }
    this.updateVmThreadData(threadMap, item, allDur);
    this.threadStatisticsData = this.totalDurationData(allDur);
    this.currentLevel = 2;
    this.vmStatisticsAnalysisProgressEL!.loading = false;
    this.threadPieChart();
  }

  private updateVmThreadData(threadMap: Map<string, Array<number | string>>, item: unknown, allDur: number): void {
    this.vmStatisticsAnalysisThreadData = [];
    threadMap.forEach((value: Array<unknown>, key: string): void => {
      let vmThreadDur = 0;
      let tName = '';
      for (let item of value) {
        // @ts-ignore
        vmThreadDur += item.dur; // @ts-ignore
        tName = item.threadName = // @ts-ignore
          item.threadName === null || item.threadName === undefined // @ts-ignore
            ? `Thread(${item.tid})` // @ts-ignore
            : `${item.threadName}(${item.tid})`;
      }
      const threadData = {
        tableName: tName, // @ts-ignore
        pid: item.pid, // @ts-ignore
        type: item.type,
        tid: key,
        percent: ((vmThreadDur / allDur) * 100).toFixed(2),
        durFormat: Utils.getProbablyTime(vmThreadDur),
        duration: vmThreadDur,
      };
      this.vmStatisticsAnalysisThreadData.push(threadData);
    }); // @ts-ignore
    this.vmStatisticsAnalysisThreadData.sort((a, b) => b.duration - a.duration);
  }

  private getVirtualMemorySo(item: unknown): void {
    this.vmStatisticsAnalysisProgressEL!.loading = true;
    let allDur = 0;
    let libMap = new Map<number, Array<number | string>>(); // @ts-ignore
    if (!this.vmStatisticsAnalysisProcessData || this.vmStatisticsAnalysisProcessData.length === 0) {
      return;
    } // @ts-ignore
    for (let vmItemData of this.vmStatisticsAnalysisProcessData) {
      if (this.soIsAccumulationData(item, vmItemData)) {
        continue;
      }
      allDur += vmItemData.dur;
      if (libMap.has(vmItemData.libId)) {
        libMap.get(vmItemData.libId)?.push(vmItemData);
      } else {
        let dataArray = [];
        dataArray.push(vmItemData);
        libMap.set(vmItemData.libId, dataArray);
      }
    }
    this.updateVmSoData(libMap, item, allDur);
    this.libStatisticsData = this.totalDurationData(allDur);
    this.currentLevel = 3;
    this.vmStatisticsAnalysisProgressEL!.loading = false;
    this.libraryPieChart();
  }

  private soIsAccumulationData(item: unknown, vmItemData: unknown): boolean {
    if (!this.hideProcessCheckBox?.checked && !this.hideThreadCheckBox?.checked) {
      // @ts-ignore
      return item && (vmItemData.pid !== item.pid || vmItemData.tid !== item.tid || vmItemData.type !== item.type);
    } else if (!this.hideProcessCheckBox?.checked && this.hideThreadCheckBox?.checked) {
      // @ts-ignore
      return item && (vmItemData.pid !== item.pid || vmItemData.type !== item.type);
    } else if (this.hideProcessCheckBox?.checked && !this.hideThreadCheckBox?.checked) {
      // @ts-ignore
      return (item && vmItemData.tid !== item.tid) || vmItemData.type !== item.type;
    } else if (this.hideProcessCheckBox?.checked && this.hideThreadCheckBox?.checked) {
      // @ts-ignore
      return item && vmItemData.type !== item.type;
    }
    return false;
  }

  private updateVmSoData(libMap: Map<number, Array<number | string>>, item: unknown, allDur: number): void {
    this.vmStatisticsAnalysisSoData = [];
    libMap.forEach((value: unknown[], key: number): void => {
      let dur = 0;
      let vmLibName = '';
      for (let item of value) {
        // @ts-ignore
        dur += item.dur;
        if (key === null) {
          // @ts-ignore
          item.libName = 'unknown';
        } // @ts-ignore
        vmLibName = item.libName;
      }
      let libPath = vmLibName?.split('/');
      if (libPath) {
        vmLibName = libPath[libPath.length - 1];
      }
      const soData = {
        tableName: vmLibName, // @ts-ignore
        pid: item === null ? value[0].pid : item.pid, // @ts-ignore
        type: item === null ? value[0].type : item.type, // @ts-ignore
        tid: item === null ? value[0].tid : item.tid,
        libId: key,
        percent: ((dur / allDur) * 100).toFixed(2),
        durFormat: Utils.getProbablyTime(dur),
        duration: dur,
      };
      this.vmStatisticsAnalysisSoData.push(soData);
    }); // @ts-ignore
    this.vmStatisticsAnalysisSoData.sort((a, b) => b.duration - a.duration);
  }

  private getVirtualMemoryFunction(item: unknown): void {
    this.vmStatisticsAnalysisProgressEL!.loading = true;
    this.shadowRoot!.querySelector<HTMLDivElement>('.vm-subheading')!.textContent = 'Statistic By Function AllDuration'; // @ts-ignore
    let tid = item.tid; // @ts-ignore
    let pid = item.pid; // @ts-ignore
    let type = item.type; // @ts-ignore
    let libId = item.libId;
    let allDur = 0;
    let symbolMap = new Map<number, Array<unknown>>(); // @ts-ignore
    if (!this.vmStatisticsAnalysisProcessData || this.vmStatisticsAnalysisProcessData.length === 0) {
      return;
    } // @ts-ignore
    for (let vmProcessData of this.vmStatisticsAnalysisProcessData) {
      if (this.vmFunctionIsAccumulationData(vmProcessData, tid, pid, type, libId)) {
        continue;
      }
      allDur += vmProcessData.dur;
      if (symbolMap.has(vmProcessData.symbolId)) {
        symbolMap.get(vmProcessData.symbolId)?.push(vmProcessData);
      } else {
        let dataArray = [];
        dataArray.push(vmProcessData);
        symbolMap.set(vmProcessData.symbolId, dataArray);
      }
    }
    this.updateVmFunctionData(symbolMap, item, allDur);
    this.functionStatisticsData = this.totalDurationData(allDur);
    this.currentLevel = 4;
    // @ts-ignore
    this.sumDur = this.libStatisticsData.allDuration;
    this.vmStatisticsAnalysisProgressEL!.loading = false;
    this.setVmPieChartConfig();
    this.vmStatisticsAnalysisFunctionData.unshift(this.functionStatisticsData);
    this.vmStatisticsAnalysisTableFunction!.recycleDataSource = this.vmStatisticsAnalysisFunctionData;
    this.vmStatisticsAnalysisTableFunction?.reMeauseHeight();
    // @ts-ignore
    this.vmStatisticsAnalysisFunctionData.shift(this.functionStatisticsData);
    this.currentLevelData = this.vmStatisticsAnalysisFunctionData;
  }

  private setVmPieConfig(): void {
    this.vmPieChart!.config = {
      appendPadding: 0,
      data: this.getVmPieChartData(this.vmStatisticsAnalysisSoData),
      angleField: 'duration',
      colorField: 'tableName',
      radius: 1,
      label: {
        type: 'outer',
      },
      tip: (vmObj): string => {
        return `<div>
                    <div>Function:${
                      // @ts-ignore
                      vmObj.obj.tableName
                    }</div>
                    <div>Duration:${
                      // @ts-ignore
                      vmObj.obj.durFormat
                    }</div>
                    <div>percent:${
                      // @ts-ignore
                      vmObj.obj.percent
                    }</div>
                </div>
                    `;
      },
      angleClick: (it): void => {
        this.vmSoLevelClickEvent(it);
      },
      hoverHandler: (vmPieData): void => {
        if (vmPieData) {
          this.vmStatisticsAnalysisTableFunction!.setCurrentHover(vmPieData);
        } else {
          this.vmStatisticsAnalysisTableFunction!.mouseOut();
        }
      },
      interactions: [
        {
          type: 'element-active',
        },
      ],
    };
  }

  private vmFunctionIsAccumulationData(
    vmProcessData: unknown,
    tid: number,
    pid: number,
    type: string,
    libId: number
  ): boolean {
    if (!this.hideProcessCheckBox?.checked && !this.hideThreadCheckBox?.checked) {
      return (
        // @ts-ignore
        vmProcessData.pid !== pid || // @ts-ignore
        vmProcessData.tid !== tid || // @ts-ignore
        vmProcessData.type !== type || // @ts-ignore
        vmProcessData.libId !== libId
      ); // @ts-ignore
    } else if (!this.hideProcessCheckBox?.checked && this.hideThreadCheckBox?.checked) {
      // @ts-ignore
      return vmProcessData.pid !== pid || vmProcessData.type !== type || vmProcessData.libId !== libId;
    } else if (this.hideProcessCheckBox?.checked && !this.hideThreadCheckBox?.checked) {
      // @ts-ignore
      return vmProcessData.tid !== tid || vmProcessData.type !== type || vmProcessData.libId !== libId;
    } else if (this.hideProcessCheckBox?.checked && this.hideThreadCheckBox?.checked) {
      // @ts-ignore
      return vmProcessData.type !== type || vmProcessData.libId !== libId;
    }
    return false;
  }

  private updateVmFunctionData(symbolMap: Map<number, Array<unknown>>, item: unknown, allDur: number): void {
    this.vmStatisticsAnalysisFunctionData = [];
    symbolMap.forEach((symbolItems, key): void => {
      let dur = 0;
      let symbolName = '';
      for (let symbolItem of symbolItems) {
        // @ts-ignore
        symbolName = symbolItem.symbolName; // @ts-ignore
        dur += symbolItem.dur;
      }
      let symbolPath = symbolName?.split('/');
      if (symbolPath) {
        symbolName = symbolPath[symbolPath.length - 1];
      }
      const symbolData = {
        // @ts-ignore
        pid: item.pid, // @ts-ignore
        type: item.type, // @ts-ignore
        tid: item.tid, // @ts-ignore
        libId: item.libId,
        symbol: key,
        percent: ((dur / allDur) * 100).toFixed(2),
        tableName: symbolName,
        durFormat: Utils.getProbablyTime(dur),
        duration: dur,
      };
      this.vmStatisticsAnalysisFunctionData.push(symbolData);
    }); // @ts-ignore
    this.vmStatisticsAnalysisFunctionData.sort((a, b) => b.duration - a.duration);
  }

  private typeIdToString(type: number): string {
    let vmReleaseType: string;
    if (type === 1) {
      vmReleaseType = 'File Backed In';
    } else if (type === 7) {
      vmReleaseType = 'Copy On Writer';
    } else {
      vmReleaseType = 'Other';
    }
    // @ts-ignore
    return vmReleaseType;
  }

  private totalDurationData(duration: number): {
    durFormat: string;
    percent: string;
    tableName: string;
    duration: number;
  } {
    return {
      durFormat: Utils.getProbablyTime(duration),
      percent: ((duration / duration) * 100).toFixed(2),
      tableName: '',
      duration: 0,
    };
  }

  private getVmPieChartData(vmRes: unknown[]): unknown[] {
    if (vmRes.length > 20) {
      let vmPieChartArr: string[] = [];
      let other: unknown = {
        tableName: 'other',
        duration: 0,
        percent: 0,
        durFormat: 0,
      };
      for (let i = 0; i < vmRes.length; i++) {
        if (i < 19) {
          // @ts-ignore
          vmPieChartArr.push(vmRes[i]);
        } else {
          // @ts-ignore
          other.duration += vmRes[i].duration; // @ts-ignore
          other.durFormat = Utils.getProbablyTime(other.duration); // @ts-ignore
          other.percent = ((other.duration / this.sumDur) * 100).toFixed(2);
        }
      } // @ts-ignore
      vmPieChartArr.push(other);
      return vmPieChartArr;
    }
    return vmRes;
  }

  private getVmDataByWorker(args: unknown[], handler: Function): void {
    procedurePool.submitWithName(
      'logic0',
      'fileSystem-action',
      { args, callType: 'virtualMemory', isAnalysis: true },
      undefined,
      (results: unknown) => {
        handler(results);
        this.vmStatisticsAnalysisProgressEL!.loading = false;
      }
    );
  }

  public connectedCallback(): void {
    new ResizeObserver((): void => {
      if (this.parentElement?.clientHeight !== 0) {
        this.vmStatisticsAnalysisTableProcess!.style.height = `${this.parentElement!.clientHeight - 50}px`;
        this.vmStatisticsAnalysisTableProcess?.reMeauseHeight();
        this.vmStatisticsAnalysisTableType!.style.height = `${this.parentElement!.clientHeight - 50}px`;
        this.vmStatisticsAnalysisTableType?.reMeauseHeight();
        this.vmStatisticsAnalysisTableThread!.style.height = `${this.parentElement!.clientHeight - 50}px`;
        this.vmStatisticsAnalysisTableThread?.reMeauseHeight();
        this.vmStatisticsAnalysisTableSo!.style.height = `${this.parentElement!.clientHeight - 50}px`;
        this.vmStatisticsAnalysisTableSo?.reMeauseHeight();
        this.vmStatisticsAnalysisTableFunction!.style.height = `${this.parentElement!.clientHeight - 50}px`;
        this.vmStatisticsAnalysisTableFunction?.reMeauseHeight();
        if (this.parentElement!.clientHeight >= 0 && this.parentElement!.clientHeight <= 31) {
          this.virtualMemoryFilterEl!.style.display = 'none';
        } else {
          this.virtualMemoryFilterEl!.style.display = 'flex';
        }
      }
    }).observe(this.parentElement!);
  }

  initHtml(): string {
    return TabPaneVirtualMemoryStatisticsAnalysisHtml;
  }
}
