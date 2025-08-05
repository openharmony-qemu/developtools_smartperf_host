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
import { procedurePool } from '../../../../database/Procedure';
import { TabPaneFilter } from '../TabPaneFilter';
import { LitCheckBox } from '../../../../../base-ui/checkbox/LitCheckBox';
import { initSort } from '../SheetUtils';
import { TabpanePerfProfile } from './TabPerfProfile';
import { TabPanePerfAnalysisHtml } from './TabPanePerfAnalysis.html';
import { WebSocketManager } from '../../../../../webSocket/WebSocketManager';
import { Constants, TypeConstants } from '../../../../../webSocket/Constants';

@element('tabpane-perf-analysis')
export class TabPanePerfAnalysis extends BaseElement {
  private currentSelection: SelectionParam | unknown;
  private perfAnalysisPie: LitChartPie | null | undefined;
  private processData!: Array<unknown>;
  private pidData!: unknown[];
  private threadData!: unknown[];
  private soData!: unknown[];
  private functionData!: unknown[];
  private perfTableThread: LitTable | null | undefined;
  private perfTableProcess: LitTable | null | undefined;
  private perfTableSo: LitTable | null | undefined;
  private tableFunction: LitTable | null | undefined;
  private sumCount: number | undefined | null;
  private sumEventCount: number | undefined | null;
  private perfAnalysisRange: HTMLLabelElement | null | undefined;
  private perfAnalysisHeadTips: HTMLLabelElement | null | undefined;
  private back: HTMLDivElement | null | undefined;
  private tabName: HTMLDivElement | null | undefined;
  private progressEL: LitProgressBar | null | undefined;
  private processName: string = '';
  private threadName: string = '';
  private callChainMap!: Map<number, unknown>;
  private sortColumn: string = '';
  private sortType: number = 0;
  private allProcessCount!: {};
  private allThreadCount!: {};
  private allLibCount!: {};
  private allSymbolCount!: {};
  private currentLevel = -1;
  private currentLevelData!: Array<unknown>;
  private titleEl: HTMLDivElement | undefined | null;
  private filterEl: TabPaneFilter | undefined | null;
  private hideProcessCheckBox: LitCheckBox | undefined | null;
  private hideThreadCheckBox: LitCheckBox | undefined | null;
  private checkBoxs: NodeListOf<LitCheckBox> | undefined | null;
  private tableArray: NodeListOf<LitTable> | undefined | null;
  private isComplete: boolean = true;
  private currentSelectionParam: SelectionParam | undefined | null;
  static tabLoadingList: Array<string> = [];
  
  private vaddrList: Array<unknown> = [];
  private selectedTabfileName: string = '';
  private clickFuncVaddrList: Array<unknown> = [];
  private functionListener!: Function | undefined | null;
  private currentSoName: string = '';
  private currentProcessItem: unknown;
  private currentThreadItem: unknown;
  private currentLibrayItem: unknown;

  set data(val: SelectionParam) {
    if (val.isImportSo && this.currentLevel > 0) {
      this.disableHomeRedirectAfterSoLoad(val);
      return;
    }
    if (val === this.currentSelection) {
      this.pidData.unshift(this.allProcessCount);
      this.perfTableProcess!.recycleDataSource = this.pidData;
      // @ts-ignore
      this.pidData.shift(this.allProcessCount);
      return;
    }
    if (this.tableArray) {
      for (let table of this.tableArray) {
        initSort(table!, this.sortColumn, this.sortType);
      }
    }
    TabPanePerfAnalysis.tabLoadingList = [];
    this.currentSelection = val;
    this.tabName!.textContent = '';
    // @ts-ignore
    this.perfAnalysisHeadTips?.innerHTML = '';
    this.hideProcessCheckBox!.checked = false;
    this.hideThreadCheckBox!.checked = false;
    this.reset(this.perfTableProcess!, false);
    this.titleEl!.textContent = '';
    this.perfAnalysisRange!.textContent = `Selected range: ${parseFloat(
      ((val.rightNs - val.leftNs) / 1000000.0).toFixed(5)
    )} ms`;
    this.currentSelectionParam = val;
    if (!this.callChainMap && this.isComplete) {
      this.isComplete = false;
      TabPanePerfAnalysis.tabLoadingList.push('analysis');
      this.getCallChainDataFromWorker(val);
    }
  }

  private disableHomeRedirectAfterSoLoad(val: SelectionParam): void {
    this.getDataByWorker(val, (results: unknown) => {
      this.isComplete = true;
      // @ts-ignore
      this.processData = results;
      // @ts-ignore
      if (this.currentLevel === 3) {
        this.reset(this.tableFunction!, true);
        this.getHiperfFunction(this.currentLibrayItem);
        let title = '';
        if (this.processName.length > 0) {
          title += `${this.processName} / `;
        }
        if (this.threadName.length > 0) {
          title += `${this.threadName} / `;
        }
        if (this.currentSoName.length > 0) {
          title += this.currentSoName;
        }
        this.titleEl!.textContent = title;
        this.perfAnalysisPie?.hideTip();
        this.selectedTabfileName = this.currentSoName;
      } else if (this.currentLevel === 1) {
        if (this.hideThreadCheckBox!.checked) {
          this.hideThread(this.currentProcessItem);
        } else {
          this.reset(this.perfTableThread!, true);
          this.getHiperfThread(this.currentProcessItem, val);
        }
        // @ts-ignore
        this.titleEl!.textContent = this.currentProcessItem.tableName;
        // @ts-ignore
        this.processName = this.currentProcessItem.tableName;
        this.perfAnalysisPie?.hideTip();
      } else if (this.currentLevel === 2) {
        this.reset(this.perfTableSo!, true);
        this.getHiperfSo(this.currentThreadItem, val);
        let pName = this.processName;
        // @ts-ignore
        if (this.processName.length > 0 && this.currentThreadItem.tableName.length > 0) {
          pName = `${this.processName} / `;
        }
        // @ts-ignore
        this.titleEl!.textContent = pName + this.currentThreadItem.tableName;
        // @ts-ignore
        this.threadName = this.currentThreadItem.tableName;
        this.perfAnalysisPie?.hideTip();
      }
      const args = [
        {
          funcName: 'getVaddrToFile',
          funcArgs: [val],
        },
      ];
      procedurePool.submitWithName('logic0', 'perf-vaddr', args, undefined, (results: Array<unknown>) => {
        this.vaddrList = results;
      });
    });
  }

  private initPerfTableListener(): void {
    for (let perfTable of this.tableArray!) {
      let querySelector = perfTable.shadowRoot?.querySelector<HTMLDivElement>('.table');
      if (querySelector) {
        querySelector.style.height = 'calc(100% - 31px)';
      }
      perfTable!.addEventListener('column-click', (evt) => {
        // @ts-ignore
        this.sortColumn = evt.detail.key;
        // @ts-ignore
        this.sortType = evt.detail.sort;
        this.sortByColumn();
      });
      perfTable!.addEventListener('contextmenu', function (event) {
        event.preventDefault(); // 阻止默认的上下文菜单弹框
      });
      perfTable!.addEventListener('row-hover', (evt) => {
        this.perfTableRowHover(evt);
      });
      perfTable!.addEventListener('row-click', (evt) => {
        // @ts-ignore
        let detail = evt.detail;
        let perfProfileTab = this.parentElement?.parentElement?.querySelector<TabpanePerfProfile>(
          '#box-perf-profile > tabpane-perf-profile'
        );
        if (detail.button === 2 && detail.tableName && detail.tableName !== '') {
          perfProfileTab!.cWidth = this.clientWidth;
          perfProfileTab!.currentLevel = this.currentLevel;
          if (this.hideProcessCheckBox?.checked && this.hideThreadCheckBox?.checked) {
            detail.data.pid = undefined;
            detail.data.tid = undefined;
          }
          perfProfileTab!.rowClickData = detail.data;
          let title;
          if (this.titleEl?.textContent === '') {
            title = detail.data.tableName;
          } else {
            title = `${this.titleEl?.textContent} / ${detail.data.tableName}`;
          }
          perfProfileTab!.pieTitle = title;
          //  是否是在表格上右键点击跳转到火焰图的
          // @ts-ignore
          this.currentSelection.isRowClick = true;
          perfProfileTab!.data = this.currentSelection;
        }
      });
    }
  }

  private perfTableRowHover(evt: Event): void {
    // @ts-ignore
    let detail = evt.detail;
    if (detail.data) {
      let data = detail.data;
      data.isHover = true;
      if (detail.callBack) {
        detail.callBack(true);
      }
    }
    this.perfAnalysisPie?.showHover();
    this.perfAnalysisPie?.hideTip();
  }

  initElements(): void {
    this.perfAnalysisPie = this.shadowRoot!.querySelector<LitChartPie>('#perf-chart-pie');
    this.perfAnalysisRange = this.shadowRoot?.querySelector('#time-range');
    this.perfAnalysisHeadTips = this.shadowRoot?.querySelector('#SO-err-tips');
    this.perfTableProcess = this.shadowRoot!.querySelector<LitTable>('#tb-process-usage');
    this.perfTableSo = this.shadowRoot!.querySelector<LitTable>('#tb-so-usage');
    this.tableFunction = this.shadowRoot!.querySelector<LitTable>('#tb-function-usage');
    this.perfTableThread = this.shadowRoot!.querySelector<LitTable>('#tb-thread-usage');
    this.back = this.shadowRoot!.querySelector<HTMLDivElement>('.perf-go-back');
    this.tabName = this.shadowRoot!.querySelector<HTMLDivElement>('.perf-subheading');
    this.progressEL = this.shadowRoot?.querySelector('.perf-progress') as LitProgressBar;
    this.titleEl = this.shadowRoot!.querySelector<HTMLDivElement>('.title');
    this.filterEl = this.shadowRoot?.querySelector('#filter');
    this.filterEl!.setOptionsList(['Hide Process', 'Hide Thread']);
    let popover = this.filterEl!.shadowRoot!.querySelector('#check-popover');
    this.hideProcessCheckBox = popover!!.querySelector<LitCheckBox>('div > #hideProcess');
    this.hideThreadCheckBox = popover!!.querySelector<LitCheckBox>('div > #hideThread');
    this.checkBoxs = popover!.querySelectorAll<LitCheckBox>('.check-wrap > lit-check-box');
    this.tableArray = this.shadowRoot!.querySelectorAll('lit-table') as NodeListOf<LitTable>;
    this.initPerfTableListener();
    for (let box of this.checkBoxs) {
      box!.addEventListener('change', () => {
        if (
          (this.hideProcessCheckBox!.checked && this.hideThreadCheckBox!.checked) ||
          (this.hideThreadCheckBox!.checked &&
            // @ts-ignore
            this.currentSelection.perfThread.length > 0 &&
            // @ts-ignore
            this.currentSelection.perfProcess.length === 0)
        ) {
          this.processName = '';
          this.hideThread();
          this.back!.style.visibility = 'hidden';
        } else if (this.hideProcessCheckBox!.checked && !this.hideThreadCheckBox!.checked) {
          this.hideProcess();
        } else {
          // @ts-ignore
          this.getHiperfProcess(this.currentSelection);
        }
      });
    }
    this.getBack();
    this.addRowClickEventListener(this.perfTableProcess!, this.perfProcessLevelClickEvent.bind(this));
    this.addRowClickEventListener(this.perfTableThread!, this.perfThreadLevelClickEvent.bind(this));
    this.addRowClickEventListener(this.perfTableSo!, this.perfSoLevelClickEvent.bind(this));
    this.addRowClickEventListener(this.tableFunction!, this.functionClickEvent.bind(this));
  }

  private addRowClickEventListener(table: LitTable, clickEvent: Function): void {
    table.addEventListener('row-click', (evt) => {
      // @ts-ignore
      const detail = evt.detail;
      // @ts-ignore
      const data = detail.data;
      if (detail.button === 0 && data.tableName && data.count !== 0) {
        clickEvent(data, this.currentSelection);
      }
    });
  }

  private reset(showTable: LitTable, isShowBack: boolean): void {
    this.clearData();
    if (isShowBack) {
      this.back!.style.visibility = 'visible';
    } else {
      this.back!.style.visibility = 'hidden';
      this.titleEl!.textContent = '';
    }
    if (this.tableArray) {
      for (let table of this.tableArray) {
        if (table === showTable) {
          initSort(table!, this.sortColumn, this.sortType);
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
    this.perfAnalysisPie!.dataSource = [];
    this.perfTableProcess!.recycleDataSource = [];
    this.perfTableThread!.recycleDataSource = [];
    this.perfTableSo!.recycleDataSource = [];
    this.tableFunction!.recycleDataSource = [];
  }

  private showAssignLevel(
    showTable: LitTable,
    hideTable: LitTable,
    currentLevel: number,
    currentLevelData: Array<unknown>
  ): void {
    showTable!.style.display = 'grid';
    hideTable!.style.display = 'none';
    hideTable.setAttribute('hideDownload', '');
    showTable?.removeAttribute('hideDownload');
    this.currentLevel = currentLevel;
    this.currentLevelData = currentLevelData;
  }

  private getBack(): void {
    this.back!.addEventListener('click', () => {
      // @ts-ignore
      this.perfAnalysisHeadTips?.innerHTML = '';
      if (this.tabName!.textContent === 'Statistic By Thread Count') {
        this.showAssignLevel(this.perfTableProcess!, this.perfTableThread!, 0, this.pidData);
        this.back!.style.visibility = 'hidden';
        // @ts-ignore
        this.processPieChart(this.currentSelection);
      } else if (this.tabName!.textContent === 'Statistic By Library Count') {
        if (this.hideThreadCheckBox?.checked) {
          this.showAssignLevel(this.perfTableProcess!, this.perfTableSo!, 0, this.pidData);
          this.back!.style.visibility = 'hidden';
          // @ts-ignore
          this.processPieChart(this.currentSelection);
        } else {
          this.showAssignLevel(this.perfTableThread!, this.perfTableSo!, 1, this.threadData);
          // @ts-ignore
          this.threadPieChart(this.currentSelection);
        }
      } else if (this.tabName!.textContent === 'Statistic By Function Count') {
        this.showAssignLevel(this.perfTableSo!, this.tableFunction!, 2, this.soData);
        this.libraryPieChart();
      }
      if (
        (this.hideProcessCheckBox?.checked && this.hideThreadCheckBox?.checked) ||
        (this.hideProcessCheckBox?.checked && this.tabName!.textContent === 'Statistic By Thread Count') ||
        (this.hideThreadCheckBox?.checked &&
          this.tabName!.textContent === 'Statistic By Library Count' &&
          // @ts-ignore
          this.currentSelection.perfThread.length > 0 &&
          // @ts-ignore
          this.currentSelection.perfProcess.length === 0)
      ) {
        this.back!.style.visibility = 'hidden';
        this.titleEl!.textContent = '';
      }
    });
  }

  private hideProcess(): void {
    this.reset(this.perfTableThread!, false);
    this.showAssignLevel(this.perfTableThread!, this.perfTableProcess!, 1, this.perfTableThread!.recycleDataSource);
    this.processName = '';
    this.titleEl!.textContent = '';
    // @ts-ignore
    this.getHiperfThread(null, this.currentSelection);
  }

  private hideThread(it?: unknown): void {
    this.reset(this.perfTableSo!, true);
    this.showAssignLevel(this.perfTableSo!, this.perfTableProcess!, 1, this.soData);
    this.threadName = '';
    if (it) {
      // @ts-ignore
      this.getHiperfSo(it, this.currentSelection);
    } else {
      // @ts-ignore
      this.getHiperfSo(null, this.currentSelection);
    }
  }

  private processPieChart(val: SelectionParam): void {
    // @ts-ignore
    this.sumCount = this.allProcessCount.allCount;
    // @ts-ignore
    this.sumEventCount = this.allProcessCount.allEventCount;
    this.perfAnalysisPie!.config = {
      appendPadding: 0,
      data: this.getPerfPieChartData(this.pidData),
      angleField: 'count',
      colorField: 'tableName',
      radius: 1,
      label: {
        type: 'outer',
      },
      tip: (perfObj): string => {
        return `<div>
                                <div>Process:${
          // @ts-ignore
          perfObj.obj.tableName
          }</div>
                                <div>Sample Count:${
          // @ts-ignore
          perfObj.obj.count
          }</div>
                                <div>Percent:${
          // @ts-ignore
          perfObj.obj.percent
          }%</div> 
                                <div>Event Count:${
          // @ts-ignore
          perfObj.obj.eventCount
          }</div>
                                <div>Percent:${
          // @ts-ignore
          perfObj.obj.eventPercent
          }%</div> 
                            </div>
                               `;
      },
      angleClick: (it): void => {
        // @ts-ignore
        if (it.tableName !== 'other') {
          this.perfProcessLevelClickEvent(it, val);
        }
      },
      hoverHandler: (perfAnalyData): void => {
        if (perfAnalyData) {
          this.perfTableProcess!.setCurrentHover(perfAnalyData);
        } else {
          this.perfTableProcess!.mouseOut();
        }
      },
      interactions: [
        {
          type: 'element-active',
        },
      ],
    };
    this.titleEl!.textContent = '';
    this.tabName!.textContent = 'Statistic By Process Count';
    if (this.pidData.length > 0) {
      this.pidData.unshift(this.allProcessCount);
    }
    this.perfTableProcess!.recycleDataSource = this.pidData;
    this.perfTableProcess?.reMeauseHeight();
    // @ts-ignore
    this.pidData.shift(this.allProcessCount);
    this.currentLevelData = this.pidData;
  }

  private perfProcessLevelClickEvent(it: unknown, val: SelectionParam): void {
    this.currentProcessItem = it;
    if (this.hideThreadCheckBox!.checked) {
      this.hideThread(it);
      this.showAssignLevel(this.perfTableSo!, this.perfTableProcess!, 1, this.soData);
    } else {
      this.reset(this.perfTableThread!, true);
      this.showAssignLevel(this.perfTableThread!, this.perfTableProcess!, 1, this.threadData);
      this.getHiperfThread(it, val);
    }
    // @ts-ignore
    this.titleEl!.textContent = it.tableName;
    // @ts-ignore
    this.processName = it.tableName;
    this.perfAnalysisPie?.hideTip();
  }

  private threadPieChart(val: SelectionParam): void {
    if (val.perfThread.length > 0 && val.perfProcess.length === 0) {
      this.back!.style.visibility = 'hidden';
      this.titleEl!.textContent = '';
      this.perfTableThread!.style.display = 'grid';
    } else {
      // @ts-ignore
      this.titleEl!.textContent = this.processName;
    }
    // @ts-ignore
    this.sumCount = this.allThreadCount.allCount;
    // @ts-ignore
    this.sumEventCount = this.allThreadCount.allEventCount;
    this.perfAnalysisPie!.config = {
      appendPadding: 0,
      data: this.getPerfPieChartData(this.threadData),
      angleField: 'count',
      colorField: 'tableName',
      radius: 1,
      label: {
        type: 'outer',
      },
      tip: (threadObj): string => {
        // @ts-ignore
        const obj = threadObj.obj as AnalysisObj;
        return `<div><div>Thread:${obj.tableName}</div>
        <div>Sample Count:${obj.count}</div>
        <div>Percent:${obj.percent}%</div>
        <div>Event Count:${obj.eventCount}</div>
        <div>Percent:${obj.eventPercent}%</div>  </div>`;
      },
      angleClick: (it): void => {
        // @ts-ignore
        if (it.tableName !== 'other') {
          this.perfThreadLevelClickEvent(it, val);
        }
      },
      hoverHandler: (data): void => {
        if (data) {
          this.perfTableThread!.setCurrentHover(data);
        } else {
          this.perfTableThread!.mouseOut();
        }
      },
      interactions: [{ type: 'element-active' }],
    };
    this.tabName!.textContent = 'Statistic By Thread Count';
    this.threadData.unshift(this.allThreadCount);
    this.perfTableThread!.recycleDataSource = this.threadData;
    this.perfTableThread?.reMeauseHeight();
    // @ts-ignore
    this.threadData.shift(this.allThreadCount);
    this.currentLevelData = this.threadData;
  }

  private perfThreadLevelClickEvent(it: unknown, val: SelectionParam): void {
    this.currentThreadItem = it;
    this.reset(this.perfTableSo!, true);
    this.showAssignLevel(this.perfTableSo!, this.perfTableThread!, 2, this.soData);
    this.getHiperfSo(it, val);
    let pName = this.processName;
    // @ts-ignore
    if (this.processName.length > 0 && it.tableName.length > 0) {
      pName = `${this.processName} / `;
    }
    // @ts-ignore
    this.titleEl!.textContent = pName + it.tableName;
    // @ts-ignore
    this.threadName = it.tableName;
    this.perfAnalysisPie?.hideTip();
  }

  private initPerfAnalysisPieConfig(): void {
    this.perfAnalysisPie!.config = {
      appendPadding: 0,
      data: this.getPerfPieChartData(this.soData),
      angleField: 'count',
      colorField: 'tableName',
      radius: 1,
      label: {
        type: 'outer',
      },
      tip: (processObj): string => {
        // @ts-ignore
        const obj = processObj.obj as AnalysisObj;
        return `<div>
                <div>Library:${obj.tableName}</div>
                <div>Sample Count:${obj.count}</div>
                <div>Percent:${obj.percent}%</div> 
                <div>Event Count:${obj.eventCount}</div>
                <div>Percent:${obj.eventPercent}%</div>  
                </div>`;
      },
      angleClick: (it): void => {
        // @ts-ignore
        if (it.tableName !== 'other') {
          this.perfSoLevelClickEvent(it);
        }
      },
      hoverHandler: (data): void => {
        if (data) {
          this.perfTableSo!.setCurrentHover(data);
        } else {
          this.perfTableSo!.mouseOut();
        }
      },
      interactions: [
        {
          type: 'element-active',
        },
      ],
    };
  }

  private libraryPieChart(): void {
    // @ts-ignore
    this.sumCount = this.allLibCount.allCount;
    // @ts-ignore
    this.sumEventCount = this.allLibCount.allEventCount;
    this.initPerfAnalysisPieConfig();
    let pName = this.processName;
    if (this.processName.length > 0 && this.threadName.length > 0) {
      pName = `${this.processName} / `;
    }
    this.titleEl!.textContent = pName + this.threadName;
    this.tabName!.textContent = 'Statistic By Library Count';
    this.soData.unshift(this.allLibCount);
    this.perfTableSo!.recycleDataSource = this.soData;
    this.perfTableSo?.reMeauseHeight();
    // @ts-ignore
    this.soData.shift(this.allLibCount);
    this.currentLevelData = this.soData;
  }

  private perfSoLevelClickEvent(it: unknown): void {
    this.currentLibrayItem = it;
    this.reset(this.tableFunction!, true);
    this.showAssignLevel(this.tableFunction!, this.perfTableSo!, 3, this.functionData);
    // @ts-ignore
    this.currentSoName = it.tableName;
    this.getHiperfFunction(it);
    let title = '';
    if (this.processName.length > 0) {
      title += `${this.processName} / `;
    }
    if (this.threadName.length > 0) {
      title += `${this.threadName} / `;
    }
    // @ts-ignore
    if (it.tableName.length > 0) {
      // @ts-ignore
      title += it.tableName;
    }
    this.titleEl!.textContent = title;
    this.perfAnalysisPie?.hideTip();
    // @ts-ignore
    this.selectedTabfileName = it.tableName;
  }
  // @ts-ignore
  callback = (cmd: number, e: Uint8Array): unknown => {
    if (cmd === Constants.DISASSEMBLY_QUERY_ELF_CMD) {
      const result = JSON.parse(new TextDecoder().decode(e));
      if (result.resultCode !== 0) {
        // @ts-ignore
        this.perfAnalysisHeadTips?.innerHTML = result.resultMessage;
      }
      WebSocketManager.getInstance()?.unregisterCallback(TypeConstants.DISASSEMBLY_TYPE, this.callback);
    }
  }

  private functionClickEvent(it: unknown) {
    // @ts-ignore
    this.perfAnalysisHeadTips?.innerHTML = '';
    if (this.selectedTabfileName.indexOf('.an') === -1 && this.selectedTabfileName.indexOf('.so') === -1) {
      // @ts-ignore
      this.perfAnalysisHeadTips?.innerHTML = 'Call stack assembly-level parsing of non-.an and .so files is not supported.';
      return;
    }
    // @ts-ignore
    let encodedData = null;
    this.clickFuncVaddrList = this.vaddrList.filter((item: unknown) => {
      // @ts-ignore
      return item.process_id === it.pid &&
        // @ts-ignore
        item.thread_id === it.tid &&
        // @ts-ignore
        item.libName === this.selectedTabfileName &&
        // @ts-ignore
        item.symbolName === it.tableName;
    });
    if (this.clickFuncVaddrList.length > 0) {
      const textEncoder = new TextEncoder();
      const queryData = {
        elf_name: this.currentSoName,
        //@ts-ignore
        vaddr: this.clickFuncVaddrList[0].vaddrInFile,
        //@ts-ignore
        func: it.tableName
      };
      const dataString = JSON.stringify(queryData);
      encodedData = textEncoder.encode(dataString);
      WebSocketManager.getInstance()?.registerMessageListener(TypeConstants.DISASSEMBLY_TYPE, this.callback, () => { }, true);
      WebSocketManager.getInstance()?.sendMessage(TypeConstants.DISASSEMBLY_TYPE, Constants.DISASSEMBLY_QUERY_ELF_CMD, encodedData);
      if (WebSocketManager.getInstance()!.status !== 'ready') {
        // @ts-ignore
        this.perfAnalysisHeadTips?.innerHTML = 'Request timed out.Install the extended service according to the help document.';
        return;
      }
    }
    setTimeout(() => {
      if (this.perfAnalysisHeadTips?.innerHTML === '') {
        // @ts-ignore
        WebSocketManager.getInstance()?.sendMessage(TypeConstants.DISASSEMBLY_TYPE, Constants.DISASSEMBLY_QUERY_CMD, encodedData);
        this.functionListener!(it, this.clickFuncVaddrList);
      }
    }, 100);
  }

  private sortByColumn(): void {
    let currentTable: LitTable | null | undefined;
    switch (this.currentLevel) {
      case 0:
        currentTable = this.perfTableProcess;
        break;
      case 1:
        currentTable = this.perfTableThread;
        break;
      case 2:
        currentTable = this.perfTableSo;
        break;
      case 3:
        currentTable = this.tableFunction;
        break;
    }
    if (!currentTable) {
      return;
    }
    if (this.sortType === 0) {
      let arr = [...this.currentLevelData];
      switch (this.currentLevel) {
        case 0:
          arr.unshift(this.allProcessCount);
          break;
        case 1:
          arr.unshift(this.allThreadCount);
          break;
        case 2:
          arr.unshift(this.allLibCount);
          break;
        case 3:
          arr.unshift(this.allSymbolCount);
          break;
      }
      currentTable!.recycleDataSource = arr;
    } else {
      this.sortTypeNoZero(currentTable);
    }
  }

  private sortTypeNoZero(currentTable: LitTable): void {
    let array = [...this.currentLevelData];
    if (this.sortColumn === 'tableName') {
      currentTable!.recycleDataSource = array.sort((leftA, rightB) => {
        if (this.sortType === 1) {
          // @ts-ignore
          if (leftA.tableName > rightB.tableName) {
            return 1;
            // @ts-ignore
          } else if (leftA.tableName === rightB.tableName) {
            return 0;
          } else {
            return -1;
          }
        } else {
          // @ts-ignore
          if (rightB.tableName > leftA.tableName) {
            return 1;
            // @ts-ignore
          } else if (leftA.tableName === rightB.tableName) {
            return 0;
          } else {
            return -1;
          }
        }
      });
    } else if (this.sortColumn === 'count' || this.sortColumn === 'percent') {
      currentTable!.recycleDataSource = array.sort((a, b) => {
        // @ts-ignore
        return this.sortType === 1 ? a.count - b.count : b.count - a.count;
      });
    } else if (this.sortColumn === 'eventCount' || this.sortColumn === 'eventPercent') {
      currentTable!.recycleDataSource = array.sort((a, b) => {
        // @ts-ignore
        return this.sortType === 1 ? a.eventCount - b.eventCount : b.eventCount - a.eventCount;
      });
    }
    switch (this.currentLevel) {
      case 0:
        array.unshift(this.allProcessCount);
        break;
      case 1:
        array.unshift(this.allThreadCount);
        break;
      case 2:
        array.unshift(this.allLibCount);
        break;
      case 3:
        array.unshift(this.allSymbolCount);
        break;
    }
    currentTable!.recycleDataSource = array;
  }

  private initHiPerfProcessSelect(val: SelectionParam): void {
    this.reset(this.perfTableProcess!, false);
    this.progressEL!.loading = true;
    if (!this.processData || this.processData.length === 0) {
      this.progressEL!.loading = false;
      if (val.perfThread.length > 0 && val.perfProcess.length === 0) {
        this.threadData = [];
        this.allThreadCount = [];
        this.perfTableProcess!.style.display = 'none';
        this.threadPieChart(val);
      } else {
        this.pidData = [];
        this.allProcessCount = [];
        this.processPieChart(val);
      }
      return;
    }
  }

  async getHiperfProcess(val: SelectionParam): Promise<void> {
    this.initHiPerfProcessSelect(val);
    let allCount = 0;
    let allEventCount = 0;
    let pidMap = new Map<number, Array<number | string>>();
    if (val.perfThread.length > 0 && val.perfProcess.length === 0) {
      this.perfTableProcess!.style.display = 'none';
      this.getHiperfThread(null, val);
    } else {
      for (let itemData of this.processData) {
        // @ts-ignore
        allCount += itemData.count;
        // @ts-ignore
        allEventCount += itemData.eventCount;
        // @ts-ignore
        if (pidMap.has(itemData.pid)) {
          // @ts-ignore
          pidMap.get(itemData.pid)?.push(itemData);
        } else {
          let itemArray: Array<number | string> = [];
          // @ts-ignore
          itemArray.push(itemData);
          // @ts-ignore
          pidMap.set(itemData.pid, itemArray);
        }
      }
      this.pidData = [];
      pidMap.forEach((arr: Array<unknown>, pid: number) => {
        let count = 0;
        let eventCount = 0;
        for (let item of arr) {
          // @ts-ignore
          count += item.count;
          // @ts-ignore
          eventCount += item.eventCount;
        }
        // @ts-ignore
        const pName = `${arr[0].processName}(${pid})`;
        const pidData = {
          tableName: pName,
          pid: pid,
          percent: ((count / allCount) * 100).toFixed(2),
          count: count,
          eventCount: eventCount,
          eventPercent: ((eventCount / allEventCount) * 100).toFixed(2),
        };
        this.pidData.push(pidData);
      });
      // @ts-ignore
      this.pidData.sort((a, b) => b.count - a.count);
      this.allProcessCount = this.totalCountData(allCount, allEventCount);
      this.currentLevel = 0;
      this.progressEL!.loading = false;
      this.processPieChart(val);
    }
  }

  private getHiperfThread(item: unknown, val: SelectionParam): void {
    this.progressEL!.loading = true;
    let threadMap = new Map<number, Array<number | string>>();
    let allCount = 0;
    let allEventCount = 0;
    if (!this.processData || this.processData.length === 0) {
      return;
    }
    for (let itemData of this.processData) {
      // @ts-ignore
      if (item && itemData.pid !== item.pid && !this.hideProcessCheckBox?.checked) {
        continue;
      }
      // @ts-ignore
      allCount += itemData.count;
      // @ts-ignore
      allEventCount += itemData.eventCount;
      // @ts-ignore
      if (threadMap.has(itemData.tid)) {
        // @ts-ignore
        threadMap.get(itemData.tid)?.push(itemData);
      } else {
        let itemArray: Array<number | string> = [];
        // @ts-ignore
        itemArray.push(itemData);
        // @ts-ignore
        threadMap.set(itemData.tid, itemArray);
      }
    }
    this.threadData = [];
    threadMap.forEach((arr: Array<unknown>, tid: number) => {
      let threadCount = 0;
      let threadEventCount = 0;
      // @ts-ignore
      let tName = `${arr[0].threadName}(${tid})`;
      for (let item of arr) {
        // @ts-ignore
        threadCount += item.count;
        // @ts-ignore
        threadEventCount += item.eventCount;
      }
      const threadData = {
        // @ts-ignore
        pid: item === null ? arr[0].pid : item.pid,
        tid: tid,
        tableName: tName,
        count: threadCount,
        percent: ((threadCount / allCount) * 100).toFixed(2),
        eventCount: threadEventCount,
        eventPercent: ((threadEventCount / allEventCount) * 100).toFixed(2),
      };
      this.threadData.push(threadData);
    });
    this.allThreadCount = this.totalCountData(allCount, allEventCount);
    this.currentLevel = 1;
    // @ts-ignore
    this.threadData.sort((a, b) => b.count - a.count);
    this.progressEL!.loading = false;
    this.threadPieChart(val);
  }

  private getHiPerfSoIdByProcessData(item: unknown, itemData: unknown): boolean {
    if (!this.hideProcessCheckBox?.checked && !this.hideThreadCheckBox?.checked) {
      // @ts-ignore
      if (item && (itemData.pid !== item.pid || itemData.tid !== item.tid)) {
        return true;
      }
    } else if (!this.hideProcessCheckBox?.checked && this.hideThreadCheckBox?.checked) {
      // @ts-ignore
      if (item && itemData.pid !== item.pid) {
        return true;
      }
    } else if (this.hideProcessCheckBox?.checked && !this.hideThreadCheckBox?.checked) {
      // @ts-ignore
      if (item && itemData.tid !== item.tid) {
        return true;
      }
    }
    return false;
  }

  private getHiperfSo(item: unknown, val: SelectionParam): void {
    this.progressEL!.loading = true;
    let parentEventCount = 0;
    let allCount = 0;
    let allEventCount = 0;
    let libMap = new Map<string, Array<number | string>>();
    if (!this.processData || this.processData.length === 0) {
      return;
    }
    for (let itemData of this.processData) {
      if (this.getHiPerfSoIdByProcessData(item, itemData)) {
        continue;
      }
      // @ts-ignore
      allCount += itemData.count;
      // @ts-ignore
      allEventCount += itemData.eventCount;
      // @ts-ignore
      if (libMap.has(`${itemData.libId}-${itemData.libName}`)) {
        // @ts-ignore
        libMap.get(`${itemData.libId}-${itemData.libName}`)?.push(itemData);
      } else {
        let dataArray: Array<number | string> = [];
        // @ts-ignore
        dataArray.push(itemData);
        // @ts-ignore
        libMap.set(`${itemData.libId}-${itemData.libName}`, dataArray);
      }
    }
    // @ts-ignore
    item ? (parentEventCount = item.eventCount) : (parentEventCount = allEventCount);
    this.soData = [];
    libMap.forEach((arr: Array<unknown>) => {
      let libCount = 0;
      let libEventCount = 0;
      // @ts-ignore
      let libName = arr[0].libName;
      // @ts-ignore
      let libId = arr[0].libId;
      for (let item of arr) {
        // @ts-ignore
        libCount += item.count;
        // @ts-ignore
        libEventCount += item.eventCount;
      }
      const libData = {
        // @ts-ignore
        pid: item === null ? arr[0].pid : item.pid,
        // @ts-ignore
        tid: item === null ? arr[0].tid : item.tid,
        percent: ((libCount / allCount) * 100).toFixed(2),
        count: libCount,
        eventPercent: ((libEventCount / parentEventCount) * 100).toFixed(2),
        eventCount: libEventCount,
        tableName: libName,
        libId: libId,
      };
      this.soData.push(libData);
    });
    this.initPerfSoData(allCount, allEventCount);
  }

  private initPerfSoData(allCount: number, allEventCount: number): void {
    this.allLibCount = this.totalCountData(allCount, allEventCount);
    // @ts-ignore
    this.soData.sort((a, b) => b.count - a.count);
    this.currentLevel = 2;
    this.progressEL!.loading = false;
    this.libraryPieChart();
  }

  private getHiperfFunction(item: unknown): void {
    this.progressEL!.loading = true;
    this.shadowRoot!.querySelector<HTMLDivElement>('.perf-subheading')!.textContent = 'Statistic By Function Count';
    // @ts-ignore
    let parentCount = item.count;
    // @ts-ignore
    let parentEventCount = item.eventCount;
    let allCount = 0;
    let allEventCount = 0;
    let symbolMap = new Map<string, Array<unknown>>();
    if (!this.processData || this.processData.length === 0) {
      return;
    }
    for (let itemData of this.processData) {
      if (this.getIdByProcessData(itemData, item)) {
        continue;
      }
      // @ts-ignore
      allCount += itemData.count;
      // @ts-ignore
      allEventCount += itemData.eventCount;
      // @ts-ignore
      if (symbolMap.has(`${itemData.symbolId}-${itemData.symbolName}`)) {
        // @ts-ignore
        symbolMap.get(`${itemData.symbolId}-${itemData.symbolName}`)?.push(itemData);
      } else {
        let dataArray: Array<number | string> = [];
        // @ts-ignore
        dataArray.push(itemData);
        // @ts-ignore
        symbolMap.set(`${itemData.symbolId}-${itemData.symbolName}`, dataArray);
      }
    }
    this.functionData = [];
    symbolMap.forEach((arr) => {
      let symbolCount = 0;
      let symbolEventCount = 0;
      for (let item of arr) {
        // @ts-ignore
        symbolCount += item.count;
        // @ts-ignore
        symbolEventCount += item.eventCount;
      }
      // @ts-ignore
      let symbolName = arr[0].symbolName;
      // @ts-ignore
      let symbolId = arr[0].symbolId;
      const symbolData = {
        // @ts-ignore
        pid: item.pid,
        // @ts-ignore
        tid: item.tid,
        // @ts-ignore
        libId: item.libId,
        percent: ((symbolCount / parentCount) * 100).toFixed(2),
        count: symbolCount,
        symbolId: symbolId,
        eventPercent: ((symbolEventCount / parentEventCount) * 100).toFixed(2),
        eventCount: symbolEventCount,
        tableName: symbolName,
      };
      this.functionData.push(symbolData);
    });
    this.initPerfFunData(allCount, allEventCount);
  }

  private getIdByProcessData(itemData: unknown, item: unknown): boolean {
    // @ts-ignore
    let tid = item.tid;
    // @ts-ignore
    let pid = item.pid;
    // @ts-ignore
    let libId = item.libId;
    let isContinue = false;
    if (!this.hideProcessCheckBox?.checked && !this.hideThreadCheckBox?.checked) {
      // @ts-ignore
      if (itemData.pid !== pid || itemData.tid !== tid || itemData.libId !== libId) {
        isContinue = true;
      }
    } else if (!this.hideProcessCheckBox?.checked && this.hideThreadCheckBox?.checked) {
      // @ts-ignore
      if (itemData.pid !== pid || itemData.libId !== libId) {
        isContinue = true;
      }
    } else if (this.hideProcessCheckBox?.checked && !this.hideThreadCheckBox?.checked) {
      // @ts-ignore
      if (itemData.tid !== tid || itemData.libId !== libId) {
        isContinue = true;
      }
    } else if (this.hideProcessCheckBox?.checked && this.hideThreadCheckBox?.checked) {
      // @ts-ignore
      if (itemData.libId !== libId) {
        isContinue = true;
      }
    }
    return isContinue;
  }

  private initPerfFunData(allCount: number, allEventCount: number): void {
    // @ts-ignore
    this.functionData.sort((a, b) => b.count - a.count);
    this.allSymbolCount = this.totalCountData(allCount, allEventCount);
    this.currentLevel = 3;
    this.progressEL!.loading = false;
    // @ts-ignore
    this.sumCount = this.allSymbolCount.allCount;
    // @ts-ignore
    this.sumEventCount = this.allSymbolCount.allEventCount;
    this.perfAnalysisPie!.config = {
      appendPadding: 0,
      data: this.getPerfPieChartData(this.functionData),
      angleField: 'count',
      colorField: 'tableName',
      radius: 1,
      label: {
        type: 'outer',
      },
      // @ts-ignore
      tip: this.getTip(),
      hoverHandler: (data): void => {
        if (data) {
          this.tableFunction!.setCurrentHover(data);
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
    this.functionData.unshift(this.allSymbolCount);
    this.tableFunction!.recycleDataSource = this.functionData;
    this.tableFunction?.reMeauseHeight();
    // @ts-ignore
    this.functionData.shift(this.allSymbolCount);
    this.currentLevelData = this.functionData;
  }

  private getTip() {
    return (obj: {
      obj: { tableName: unknown; count: unknown; percent: unknown; eventCount: unknown; eventPercent: unknown };
    }): string => {
      return `<div>
                    <div>Function:${obj.obj.tableName}</div>
                    <div>Sample Count:${obj.obj.count}</div>
                    <div>Percent:${obj.obj.percent}%</div>
                    <div>Event Count:${obj.obj.eventCount}</div>
                    <div>Percent:${obj.obj.eventPercent}%</div>
                </div>`;
    };
  }

  totalCountData(
    count: number,
    eventCount: number
  ): {
    percent: string;
    count: number;
    allCount: number;
    eventCount: number;
    eventPercent: string;
    allEventCount: number;
    pid: string;
  } {
    let allCount;
    allCount = {
      percent: ((count / count) * 100).toFixed(2),
      count: count,
      allCount: count,
      eventCount: eventCount,
      allEventCount: eventCount,
      eventPercent: '100.00',
      pid: '',
    };
    return allCount;
  }

  private getPerfPieChartData(res: unknown[]): unknown[] {
    if (res.length > 20) {
      let pieChartArr: string[] = [];
      let other: unknown = {
        tableName: 'other',
        count: 0,
        percent: 0,
        eventCount: 0,
        eventPercent: 0,
      };
      for (let i = 0; i < res.length; i++) {
        if (i < 19) {
          // @ts-ignore
          pieChartArr.push(res[i]);
        } else {
          // @ts-ignore
          other.count += res[i].count;
          // @ts-ignore
          other.percent = ((other.count / this.sumCount!) * 100).toFixed(2);
          // @ts-ignore
          other.eventCount += res[i].eventCount;
          // @ts-ignore
          other.eventPercent = ((other.eventCount / this.sumEventCount!) * 100).toFixed(2);
        }
      }
      // @ts-ignore
      pieChartArr.push(other);
      return pieChartArr;
    }
    return res;
  }

  private getCallChainDataFromWorker(val: SelectionParam): void {
    this.getDataByWorker(val, (results: unknown) => {
      this.isComplete = true;
      if (this.currentSelectionParam !== val) {
        this.getCallChainDataFromWorker(this.currentSelectionParam!);
        return;
      }
      // @ts-ignore
      this.processData = results;
      if (this.processData.length === 0) {
        this.hideProcessCheckBox?.setAttribute('disabled', 'disabled');
        this.hideThreadCheckBox?.setAttribute('disabled', 'disabled');
      } else {
        this.hideProcessCheckBox?.removeAttribute('disabled');
        this.hideThreadCheckBox?.removeAttribute('disabled');
      }
      this.progressEL!.loading = false;
      this.getHiperfProcess(val);
      if (TabPanePerfAnalysis.tabLoadingList[0] === 'analysis') {
        TabPanePerfAnalysis.tabLoadingList.shift();
      }
    });
    const args = [
      {
        funcName: 'getVaddrToFile',
        funcArgs: [val],
      },
    ];
    procedurePool.submitWithName('logic0', 'perf-vaddr', args, undefined, (results: Array<unknown>) => {
      this.vaddrList = results;
    });
  }

  private getDataByWorker(val: SelectionParam, handler: Function): void {
    this.progressEL!.loading = true;
    const args = [
      {
        funcName: 'setSearchValue',
        funcArgs: [''],
      },
      {
        funcName: 'getCurrentDataFromDbAnalysis',
        funcArgs: [val],
      },
    ];
    procedurePool.submitWithName('logic0', 'perf-action', args, undefined, (results: unknown) => {
      handler(results);
    });
  }

  public connectedCallback(): void {
    new ResizeObserver(() => {
      this.perfTableProcess!.style.height = `${this.parentElement!.clientHeight - 50}px`;
      this.perfTableProcess?.reMeauseHeight();
      this.perfTableThread!.style.height = `${this.parentElement!.clientHeight - 50}px`;
      this.perfTableThread?.reMeauseHeight();
      this.tableFunction!.style.height = `${this.parentElement!.clientHeight - 50}px`;
      this.tableFunction?.reMeauseHeight();
      this.perfTableSo!.style.height = `${this.parentElement!.clientHeight - 50}px`;
      this.perfTableSo?.reMeauseHeight();
      if (this.parentElement!.clientHeight >= 0 && this.parentElement!.clientHeight <= 31) {
        this.filterEl!.style.display = 'none';
      } else {
        this.filterEl!.style.display = 'flex';
      }
    }).observe(this.parentElement!);
  }

  public addFunctionRowClickEventListener(clickEvent: Function): void {
    this.functionListener = clickEvent;
  }

  initHtml(): string {
    return TabPanePerfAnalysisHtml;
  }
}
