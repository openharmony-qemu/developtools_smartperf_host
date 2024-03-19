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

import { BaseElement, element } from '../../../../base-ui/BaseElement';
import { type LitTabs } from '../../../../base-ui/tabs/lit-tabs';
import { LitTabpane } from '../../../../base-ui/tabs/lit-tabpane';
import { BoxJumpParam, SelectionParam } from '../../../bean/BoxSelection';
import { type TabPaneCurrentSelection } from '../sheet/TabPaneCurrentSelection';
import { type TabPaneFlag } from '../timer-shaft/TabPaneFlag';
import { type Flag } from '../timer-shaft/Flag';
import { type WakeupBean } from '../../../bean/WakeupBean';
import { type LitIcon } from '../../../../base-ui/icon/LitIcon';
import { tabConfig } from './TraceSheetConfig';
import { type TabPaneBoxChild } from '../sheet/cpu/TabPaneBoxChild';
import { type CpuStruct } from '../../../database/ui-worker/cpu/ProcedureWorkerCPU';
import { CpuFreqStruct } from '../../../database/ui-worker/ProcedureWorkerFreq';
import { CpuFreqLimitsStruct } from '../../../database/ui-worker/cpu/ProcedureWorkerCpuFreqLimits';
import { type ThreadStruct } from '../../../database/ui-worker/ProcedureWorkerThread';
import { type FuncStruct } from '../../../database/ui-worker/ProcedureWorkerFunc';
import { ProcessMemStruct } from '../../../database/ui-worker/ProcedureWorkerMem';
import { CpuStateStruct } from '../../../database/ui-worker/cpu/ProcedureWorkerCpuState';
import { type ClockStruct } from '../../../database/ui-worker/ProcedureWorkerClock';
import { type IrqStruct } from '../../../database/ui-worker/ProcedureWorkerIrq';
import { type JankStruct } from '../../../database/ui-worker/ProcedureWorkerJank';
import { type HeapStruct } from '../../../database/ui-worker/ProcedureWorkerHeap';
import { type LitTable } from '../../../../base-ui/table/lit-table';
import { threadPool } from '../../../database/SqlLite';
import { type HeapSnapshotStruct } from '../../../database/ui-worker/ProcedureWorkerHeapSnapshot';
import { type TabPaneNMStatisticAnalysis } from '../sheet/native-memory/TabPaneNMStatisticAnalysis';
import { type TabPaneCurrent } from '../sheet/TabPaneCurrent';
import { type SlicesTime } from '../timer-shaft/SportRuler';
import { type AppStartupStruct } from '../../../database/ui-worker/ProcedureWorkerAppStartup';
import { type AllAppStartupStruct } from '../../../database/ui-worker/ProcedureWorkerAllAppStartup';
import { type SoStruct } from '../../../database/ui-worker/ProcedureWorkerSoInit';
import { type FrameAnimationStruct } from '../../../database/ui-worker/ProcedureWorkerFrameAnimation';
import { type TraceRow } from './TraceRow';
import { type FrameDynamicStruct } from '../../../database/ui-worker/ProcedureWorkerFrameDynamic';
import { type TabPaneFrameDynamic } from '../sheet/frame/TabPaneFrameDynamic';
import { type FrameSpacingStruct } from '../../../database/ui-worker/ProcedureWorkerFrameSpacing';
import { type TabFrameSpacing } from '../sheet/frame/TabFrameSpacing';
import { type JsCpuProfilerChartFrame } from '../../../bean/JsStruct';
import { type TabPaneComparison } from '../sheet/ark-ts/TabPaneComparison';
import { type TabPaneSummary } from '../sheet/ark-ts/TabPaneSummary';
import { type TabPaneGpuClickSelect } from '../sheet/gpu/TabPaneGpuClickSelect';
import { type TabPanePurgTotalSelection } from '../sheet/ability/TabPanePurgTotalSelection';
import { type TabPanePurgPinSelection } from '../sheet/ability/TabPanePurgPinSelection';
import { type TabPaneVmTrackerShmSelection } from '../sheet/vmtracker/TabPaneVmTrackerShmSelection';
import { type TabPaneSmapsStatistics } from '../sheet/smaps/TabPaneSmapsStatistics';
import { type TabPaneSmapsComparison } from '../sheet/smaps/TabPaneSmapsComparison';
import { type SnapshotStruct } from '../../../database/ui-worker/ProcedureWorkerSnapshot';
import { type TabPaneDmaSelectAbility } from '../sheet/ability/TabPaneDmaSelectAbility';
import { type TabPaneGpuMemorySelectAbility } from '../sheet/ability/TabPaneGpuMemorySelectAbility';
import { type TabPaneDmaSelectVmTracker } from '../sheet/vmtracker/TabPaneDmaSelectVmTracker';
import { type TabPanePurgTotalComparisonAbility } from '../sheet/ability/TabPanePurgTotalComparisonAbility';
import { type TabPanePurgPinComparisonAbility } from '../sheet/ability/TabPanePurgPinComparisonAbility';
import { type TabPanePurgTotalComparisonVM } from '../sheet/vmtracker/TabPanePurgTotalComparisonVM';
import { type TabPanePurgPinComparisonVM } from '../sheet/vmtracker/TabPanePurgPinComparisonVM';
import { type TabPaneDmaAbilityComparison } from '../sheet/ability/TabPaneDmaAbilityComparison';
import { type TabPaneGpuMemoryComparison } from '../sheet/ability/TabPaneGpuMemoryComparison';
import { type TabPaneDmaVmTrackerComparison } from '../sheet/vmtracker/TabPaneDmaVmTrackerComparison';
import { type TabPaneGpuMemorySelectVmTracker } from '../sheet/vmtracker/TabPaneGpuMemorySelectVmTracker';
import { type TabPaneGpuMemoryVmTrackerComparison } from '../sheet/vmtracker/TabPaneGpuMemoryVmTrackerComparison';
import { type TabPaneVmTrackerShmComparison } from '../sheet/vmtracker/TabPaneVmTrackerShmComparison';
import { type TabPaneJsCpuStatistics } from '../sheet/ark-ts/TabPaneJsCpuStatistics';
import { type TabPaneGpuClickSelectComparison } from '../sheet/gpu/TabPaneGpuClickSelectComparison';
import { Utils } from './Utils';
import { TabPaneHiLogs } from '../sheet/hilog/TabPaneHiLogs';
import { TabPaneGpuResourceVmTracker } from '../sheet/vmtracker/TabPaneGpuResourceVmTracker';
import { type LitPageTable } from '../../../../base-ui/table/LitPageTable';
import '../../../../base-ui/popover/LitPopoverV';
import { LitPopover } from '../../../../base-ui/popover/LitPopoverV';
import { LitTree, TreeItemData } from '../../../../base-ui/tree/LitTree';

@element('trace-sheet')
export class TraceSheet extends BaseElement {
  systemLogFlag: Flag | undefined | null;
  private litTabs: LitTabs | undefined | null;
  private switchDiv: LitPopover | undefined | null;
  private processTree: LitTree | undefined | null;
  private importDiv: HTMLDivElement | undefined | null;
  private exportBt: LitIcon | undefined | null;
  private nav: HTMLDivElement | undefined | null;
  private tabs: HTMLDivElement | undefined | null;
  private navRoot: HTMLDivElement | null | undefined;
  private search: HTMLDivElement | undefined | null;
  private timerShaft: HTMLDivElement | undefined | null;
  private spacer: HTMLDivElement | undefined | null;
  private rowsPaneEL: HTMLDivElement | undefined | null;
  private selection: SelectionParam | undefined | null;
  private currentPaneID: string = 'current-selection';
  private fragment: DocumentFragment | undefined;
  private lastSelectIPid: number = -1;
  private lastProcessSet: Set<number> = new Set<number>();

  static get observedAttributes(): string[] {
    return ['mode'];
  }

  buildTabs(litTabs: LitTabs | undefined | null): void {
    this.fragment = document.createDocumentFragment();
    Reflect.ownKeys(tabConfig).forEach((key, index) => {
      let pane = new LitTabpane();
      pane.id = key.toString();
      pane.className = 'tabHeight';
      pane.tab = tabConfig[key].title;
      pane.hidden = true;
      pane.key = `${tabConfig[key].key || index}`;
      let cls = tabConfig[key].type;
      let node = new cls();
      pane.append(node);
      this.fragment?.appendChild(pane);
    });
    litTabs!.appendChild(this.fragment);
  }

  displayTab<T>(...names: string[]): T {
    this.setAttribute('mode', 'max');
    this.showUploadSoBt(null);
    this.showSwitchProcessBt(null);
    this.shadowRoot
      ?.querySelectorAll<LitTabpane>('#tabs lit-tabpane')
      .forEach((it) => (it.hidden = !names.some((k) => k === it.id)));
    let litTabpane = this.shadowRoot?.querySelector<LitTabpane>(`#tabs lit-tabpane[id='${names[0]}']`);
    if (names[0] === 'current-selection') {
      this.exportBt!.style.display = 'none';
    } else {
      this.exportBt!.style.display = 'flex';
    }
    this.shadowRoot?.querySelector<LitTabs>('#tabs')?.activePane(litTabpane!.key);
    return litTabpane!.children.item(0) as unknown as T;
  }

  getComponentByID<T>(id: string): T {
    return this.getPaneByID(id)?.children.item(0) as unknown as T;
  }

  getPaneByID(id: string): LitTabpane {
    return this.shadowRoot!.querySelector(`#${id}`)!;
  }

  initElements(): void {
    this.litTabs = this.shadowRoot?.querySelector('#tabs');
    this.litTabs!.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
    this.importDiv = this.shadowRoot?.querySelector('#import_div');
    this.switchDiv = this.shadowRoot?.querySelector('#select-process');
    this.processTree = this.shadowRoot?.querySelector('#processTree');
    this.processTree!.onChange = (e: any): void => {
      const select = this.processTree!.getCheckdKeys();
      const selectIPid = Number(select[0]);
      this.switchDiv!.visible = 'false';
      this.updateRangeSelect(selectIPid);
      this.lastSelectIPid = selectIPid;
    };
    this.buildTabs(this.litTabs);
    this.litTabs!.onTabClick = (e: any): void => this.loadTabPaneData(e.detail.key);
    this.tableCloseHandler();
    this.rowClickEvent();
  }
  private rowClickEvent(): void {
    this.getComponentByID<any>('box-spt')?.addEventListener('row-click', this.rowClickHandler.bind(this));
    this.getComponentByID<any>('box-pts')?.addEventListener('row-click', this.rowClickHandler.bind(this));
    this.getComponentByID<any>('box-perf-analysis')?.addEventListener('row-click', (evt: MouseEvent) => {
      this.perfAnalysisListener(evt);
    });
    this.getComponentByID<any>('box-native-statistic-analysis')?.addEventListener('row-click', (e: MouseEvent) => {
      this.nativeAnalysisListener(e);
    });
    this.getComponentByID<any>('box-io-tier-statistics-analysis')?.addEventListener('row-click', (evt: MouseEvent) => {
      // @ts-ignore
      if (evt.detail.button === 2) {
        let pane = this.getPaneByID('box-io-calltree');
        this.litTabs!.activeByKey(pane.key);
      }
    });
    this.getComponentByID<any>('box-virtual-memory-statistics-analysis')?.addEventListener(
      'row-click',
      (evt: MouseEvent) => {
        // @ts-ignore
        if (evt.detail.button === 2) {
          let pane = this.getPaneByID('box-vm-calltree');
          this.litTabs!.activeByKey(pane.key);
        }
      }
    );
    this.getComponentByID<any>('box-file-system-statistics-analysis')?.addEventListener(
      'row-click',
      (evt: MouseEvent) => {
        // @ts-ignore
        if (evt.detail.button === 2) {
          let pane = this.getPaneByID('box-file-system-calltree');
          this.litTabs!.activeByKey(pane.key);
        }
      }
    );
    this.getComponentByID<any>('box-native-statstics')?.addEventListener('row-click', (e: any) => {
      this.nativeStatsticsListener(e);
    });
    this.getComponentByID<any>('box-virtual-memory-statistics')?.addEventListener('row-click', (e: any) => {
      this.virtualMemoryListener(e);
    });
    this.getComponentByID<any>('box-io-tier-statistics')?.addEventListener('row-click', (e: any) => {
      this.ioTierListener(e);
    });
    this.getComponentByID<any>('box-file-system-statistics')?.addEventListener('row-click', (e: any) => {
      this.fileSystemListener(e);
    });
  }

  private perfAnalysisListener(evt: MouseEvent): void {
    // @ts-ignore
    if (evt.detail.button === 2) {
      let pane = this.getPaneByID('box-perf-profile');
      this.litTabs!.activeByKey(pane.key);
    }
  }

  private nativeAnalysisListener(e: MouseEvent):void {
    //@ts-ignore
    if (e.detail.button === 2) {
      let pane = this.getPaneByID('box-native-calltree');
      pane.hidden = false;
      this.litTabs!.activeByKey(pane.key);
    }
  }

  private nativeStatsticsListener(e: any): void {
    if (e.detail.button === 0) {
      this.selection!.statisticsSelectData = e.detail;
      let pane = this.getPaneByID('box-native-memory');
      this.litTabs?.activeByKey(pane.key);
      (pane.children.item(0) as any)!.fromStastics(this.selection);
    }
  }

  private virtualMemoryListener(e: any): void {
    if (e.detail.button === 0) {
      this.selection!.fileSystemVMData = {path: e.detail.path};
      let pane = this.getPaneByID('box-vm-events');
      this.litTabs?.activeByKey(pane.key);
      if (e.detail.path) {
        (pane.children.item(0) as any)!.fromStastics(this.selection);
      }
    }
  }

  private ioTierListener(e: any):void {
    if (e.detail.button === 0) {
      this.selection!.fileSystemIoData = {path: e.detail.path};
      let pane = this.getPaneByID('box-io-events');
      this.litTabs?.activeByKey(pane.key);
      if (e.detail.path) {
        (pane.children.item(0) as any)!.fromStastics(this.selection);
      }
    }
  }

  private fileSystemListener(e: any): void {
    if (e.detail.button === 0) {
      this.selection!.fileSystemFsData = e.detail.data;
      let pane = this.getPaneByID('box-file-system-event');
      this.litTabs?.activeByKey(pane.key);
      if (e.detail.data) {
        (pane.children.item(0) as any)!.fromStastics(this.selection);
      }
    }
  }

  private tableCloseHandler(): void {
    this.litTabs!.addEventListener('close-handler', () => {
      Reflect.ownKeys(tabConfig)
        .reverse()
        .forEach((id) => {
          let element = tabConfig[id];
          let pane = this.shadowRoot!.querySelector<LitTabpane>(`#${id as string}`);
          if (element.require) {
            pane!.hidden = !element.require(this.selection);
          } else {
            pane!.hidden = true;
          }
        });
      this.litTabs?.activeByKey(`${this.getPaneByID(this.currentPaneID).key}`);
    });
  }

  connectedCallback(): void {
    this.nav = this.shadowRoot?.querySelector('#tabs')?.shadowRoot?.querySelector('.tab-nav-vessel');
    this.tabs = this.shadowRoot?.querySelector('#tabs');
    this.navRoot = this.shadowRoot?.querySelector('#tabs')?.shadowRoot?.querySelector('.nav-root');
    this.search = document.querySelector('body > sp-application')
      ?.shadowRoot?.querySelector('div > div.search-vessel');
    this.timerShaft = this.parentElement?.querySelector('.timer-shaft');
    this.spacer = this.parentElement?.querySelector('.spacer');
    this.rowsPaneEL = this.parentElement?.querySelector('.rows-pane');
    let tabsOpenUp: LitIcon | undefined | null = this.shadowRoot?.querySelector<LitIcon>('#max-btn');
    let tabsPackUp: LitIcon | undefined | null = this.shadowRoot?.querySelector<LitIcon>('#min-btn');
    let borderTop: number = 1;
    let initialHeight = { tabs: `calc(30vh + 39px)`, node: '30vh' };
    this.initNavElements(tabsPackUp!, borderTop, initialHeight);
    this.exportBt = this.shadowRoot?.querySelector<LitIcon>('#export-btn');
    tabsOpenUp!.onclick = (): void => {
      this.tabs!.style.height = window.innerHeight - this.search!.offsetHeight - this.timerShaft!.offsetHeight - borderTop + 'px';
      let litTabpane: NodeListOf<HTMLDivElement> | undefined | null =
        this.shadowRoot?.querySelectorAll('#tabs > lit-tabpane');
      litTabpane!.forEach((node: HTMLDivElement): void => {
        node!.style.height =
          window.innerHeight -
          this.search!.offsetHeight -
          this.timerShaft!.offsetHeight -
          this.navRoot!.offsetHeight -
          borderTop +
          'px';
        initialHeight.node = node!.style.height;
      });
      initialHeight.tabs = this.tabs!.style.height;
      tabsPackUp!.name = 'down';
    };
    tabsPackUp!.onclick = (): void => {
      let litTabpane: NodeListOf<HTMLDivElement> | undefined | null =
        this.shadowRoot?.querySelectorAll('#tabs > lit-tabpane');
      if (tabsPackUp!.name == 'down') {
        this.tabs!.style.height = this.navRoot!.offsetHeight + 'px';
        litTabpane!.forEach((node: HTMLDivElement) => (node!.style.height = '0px'));
        tabsPackUp!.name = 'up';
        tabsPackUp!.title = 'Reset Tab';
        (window as any).isPackUpTable = true;
      } else {
        tabsPackUp!.name = 'down';
        tabsPackUp!.title = 'Minimize Tab';
        this.tabs!.style.height = initialHeight.tabs;
        litTabpane!.forEach((node: HTMLDivElement) => (node!.style.height = initialHeight.node));
      }
    };
    this.importClickEvent();
    this.exportClickEvent();
  }

  private initNavElements(tabsPackUp: LitIcon, borderTop: number, initialHeight: { node: string; tabs: string }): void {
    let that = this;
    this.nav!.onmousedown = (event): void => {
      (window as any).isSheetMove = true;
      let litTabpane: NodeListOf<HTMLDivElement> | undefined | null =
        this.shadowRoot?.querySelectorAll('#tabs > lit-tabpane');
      this.navMouseMove(event, litTabpane!, that, tabsPackUp, borderTop);
      document.onmouseup = function (): void {
        setTimeout(() => {
          (window as any).isSheetMove = false;
        }, 100);
        litTabpane!.forEach((node: HTMLDivElement): void => {
          if (node!.style.height !== '0px' && that.tabs!.style.height !== '') {
            initialHeight.node = node!.style.height;
            initialHeight.tabs = that.tabs!.style.height;
          }
        });
        this.onmousemove = null;
        this.onmouseup = null;
      };
    };
  }

  private navMouseMove(event: MouseEvent, litTabpane: NodeListOf<HTMLDivElement>,
    that: this, tabsPackUp: LitIcon, borderTop: number): void {
    let preY = event.pageY;
    let preHeight = this.tabs!.offsetHeight;
    document.onmousemove = function (event): void {
      let moveY: number = preHeight - (event.pageY - preY);
      litTabpane!.forEach((node: HTMLDivElement) => {
        if (that.spacer!.offsetHeight > that.rowsPaneEL!.offsetHeight) {
          that.tabs!.style.height = moveY + 'px';
          node!.style.height = moveY - that.navRoot!.offsetHeight + 'px';
          tabsPackUp!.name = 'down';
        } else if (
          that.navRoot!.offsetHeight <= moveY &&
          that.search!.offsetHeight + that.timerShaft!.offsetHeight + borderTop + that.spacer!.offsetHeight <=
          window.innerHeight - moveY
        ) {
          that.tabs!.style.height = moveY + 'px';
          node!.style.height = moveY - that.navRoot!.offsetHeight + 'px';
          tabsPackUp!.name = 'down';
        } else if (that.navRoot!.offsetHeight >= moveY) {
          that.tabs!.style.height = that.navRoot!.offsetHeight + 'px';
          node!.style.height = '0px';
          tabsPackUp!.name = 'up';
        } else if (
          that.search!.offsetHeight + that.timerShaft!.offsetHeight + borderTop + that.spacer!.offsetHeight >=
          window.innerHeight - moveY
        ) {
          that.tabs!.style.height =
            window.innerHeight -
            that.search!.offsetHeight -
            that.timerShaft!.offsetHeight -
            borderTop -
            that.spacer!.offsetHeight +
            'px';
          node!.style.height =
            window.innerHeight -
            that.search!.offsetHeight -
            that.timerShaft!.offsetHeight -
            that.navRoot!.offsetHeight -
            borderTop -
            that.spacer!.offsetHeight +
            'px';
          tabsPackUp!.name = 'down';
        }
      });
    };
  }

  private importClickEvent(): void {
    let importFileBt: HTMLInputElement | undefined | null =
      this.shadowRoot?.querySelector<HTMLInputElement>('#import-file');
    importFileBt!.addEventListener('change', (event): void => {
      let files = importFileBt?.files;
      if (files) {
        let fileList: Array<File> = [];
        for (let file of files) {
          if (file.name.endsWith('.so')) {
            fileList.push(file);
          }
        }
        if (fileList.length > 0) {
          importFileBt!.disabled = true;
          window.publish(window.SmartEvent.UI.Loading, { loading: true, text: 'Import So File' });
          threadPool.submit(
            'upload-so',
            '',
            fileList,
            (res: string) => {
              importFileBt!.disabled = false;
              if (res === 'ok') {
                window.publish(window.SmartEvent.UI.UploadSOFile, {});
              } else {
                window.publish(window.SmartEvent.UI.Error, 'parse so file failed!');
              }
            },
            'upload-so'
          );
        }
        fileList.length = 0;
      }
      importFileBt!.files = null;
      importFileBt!.value = '';
    });
  }

  private exportClickEvent(): void {
    this.exportBt!.onclick = (): void => {
      let currentTab = this.getTabpaneByKey(this.litTabs?.activekey!);
      if (currentTab) {
        let table1 = Array.from(
          (currentTab.firstChild as BaseElement).shadowRoot?.querySelectorAll<LitPageTable>('lit-page-table') || []
        );
        let table2 = Array.from(
          (currentTab.firstChild as BaseElement).shadowRoot?.querySelectorAll<LitTable>('lit-table') || []
        );
        let tables = [...table1, ...table2];

        for (let table of tables) {
          if (!table.hasAttribute('hideDownload')) {
            table.exportData();
          }
        }
      }
    };
  }

  getTabpaneByKey(key: string): LitTabpane | undefined {
    let tabs = Array.from(this.shadowRoot?.querySelectorAll<LitTabpane>('#tabs lit-tabpane').values() || []);
    return tabs.find((it) => it.key === key);
  }

  initHtml(): string {
    return `
            <style>
                :host([mode='hidden']){
                    display: none;
                }
                :host{
                    display: block;
                    background-color: rebeccapurple;
                }
                .tabHeight{
                    height: 30vh;
                    background-color: var(--dark-background,#FFFFFF);
                }
                #check-popover[visible="true"] #check-des{
                    color: #0A59F7;
                }
                .popover{
                  color: var(--dark-color1,#4b5766);
                  justify-content: center;
                  align-items: center;
                  margin-right: 10px;
                  z-index: 2;
              }
            </style>
            <div id="vessel" style="border-top: 1px solid var(--dark-border1,#D5D5D5);">
                <lit-tabs id="tabs" position="top-left" activekey="1" mode="card" >
                    <div slot="right" style="margin: 0 10px; color: var(--dark-icon,#606060);display: flex;align-items: center;">
                        <lit-popover placement="bottomRight" class="popover" haveRadio="true" trigger="click" id="select-process">
                              <div slot="content">
                                <lit-tree id="processTree" checkable="true"></lit-tree>
                              </div>
                              <lit-icon name="setting" size="20" id="setting"></lit-icon>
                        </lit-popover>
                        <div title="Import SO" id="import_div" style="width: 20px;height: 20px;display: flex;flex-direction: row;margin-right: 10px">
                            <input id="import-file" style="display: none;pointer-events: none" type="file" webkitdirectory>
                            <label style="width: 20px;height: 20px;cursor: pointer;" for="import-file">
                                <lit-icon id="import-btn" name="copy-csv" style="pointer-events: none" size="20">
                                </lit-icon>
                            </label>
                        </div>
                        <lit-icon title="Download Table" id="export-btn" name="import-so" style="font-weight: bold;cursor: pointer;margin-right: 10px" size="20">
                        </lit-icon>
                        <lit-icon title="Maximize Tab" id="max-btn" name="vertical-align-top" style="font-weight: bold;cursor: pointer;margin-right: 10px" size="20">
                        </lit-icon>
                        <lit-icon title="Minimize Tab" id="min-btn" name="down" style="font-weight: bold;cursor: pointer;" size="20">
                        </lit-icon>
                    </div>
                </lit-tabs>
            </div>`;
  }
  displayCurrent = (data: SlicesTime): void =>
    this.displayTab<TabPaneCurrent>('tabpane-current').setCurrentSlicesTime(data);
  displayThreadData = (
    data: ThreadStruct,
    scrollCallback: ((e: ThreadStruct) => void) | undefined,
    scrollWakeUp: (d: any) => void | undefined,
    callback: ((data: Array<any>) => void) | undefined = undefined
  ) =>
    this.displayTab<TabPaneCurrentSelection>('current-selection').setThreadData(
      data,
      scrollCallback,
      scrollWakeUp,
      callback
    );
  displayMemData = (data: ProcessMemStruct): void =>
    this.displayTab<TabPaneCurrentSelection>('current-selection').setMemData(data);
  displayClockData = (data: ClockStruct): void =>
    this.displayTab<TabPaneCurrentSelection>('current-selection').setClockData(data);
  displayIrqData = (data: IrqStruct): void =>
    this.displayTab<TabPaneCurrentSelection>('current-selection').setIrqData(data);
  displayStartupData = (data: AppStartupStruct, scrollCallback: Function): void =>
    this.displayTab<TabPaneCurrentSelection>('current-selection').setStartupData(data, scrollCallback);
  displayAllStartupData = (data: AllAppStartupStruct, scrollCallback: Function): void =>
    this.displayTab<TabPaneCurrentSelection>('current-selection').setAllStartupData(data, scrollCallback);
  displayStaticInitData = (data: SoStruct, scrollCallback: Function): void =>
    this.displayTab<TabPaneCurrentSelection>('current-selection').setStaticInitData(data, scrollCallback);

  displayNativeHookData = (data: HeapStruct, rowType: string, ipid: number): void => {
    let val = new SelectionParam();
    val.nativeMemoryStatistic.push(rowType);
    val.nativeMemoryCurrentIPid = ipid;
    val.nativeMemory = [];
    val.leftNs = data.startTime!;
    val.rightNs = data.dur === 0 ? data.startTime! : data.startTime! + data.dur! - 1;
    this.selection = val;
    this.displayTab<TabPaneNMStatisticAnalysis>('box-native-statistic-analysis', 'box-native-calltree').data = val;
    this.showUploadSoBt(val);
    this.showSwitchProcessBt(val);
  };

  displayGpuSelectedData = (type: string, startTs: number, dataList: Array<SnapshotStruct>): void => {
    this.displayTab<TabPaneGpuClickSelectComparison>('gpu-click-select-comparison').getGpuClickDataByDB(
      type,
      startTs,
      dataList
    );
    let dataObject = { type: type, startTs: startTs };
    this.displayTab<TabPaneGpuClickSelect>('gpu-click-select', 'gpu-click-select-comparison').gpuClickData(dataObject);
  };

  displayFuncData = (names: string[], data: FuncStruct, scrollCallback: Function): void =>
    this.displayTab<TabPaneCurrentSelection>(...names).setFunctionData(data, scrollCallback);
  displayCpuData = (
    data: CpuStruct,
    callback: ((data: WakeupBean | null) => void) | undefined = undefined,
    scrollCallback?: (data: CpuStruct) => void
  ): void => this.displayTab<TabPaneCurrentSelection>('current-selection').setCpuData(data, callback, scrollCallback);
  displayJankData = (
    data: JankStruct,
    callback: ((data: Array<any>) => void) | undefined = undefined,
    scrollCallback: ((e: JankStruct) => void) | undefined
  ): void => this.displayTab<TabPaneCurrentSelection>('current-selection').setJankData(data, callback, scrollCallback);
  displayShmData = (data: SnapshotStruct, dataList: Array<SnapshotStruct>): void => {
    this.displayTab<TabPaneVmTrackerShmComparison>('box-vmtracker-shm-comparison').setShmData(data, dataList);
    this.displayTab<TabPaneVmTrackerShmSelection>(
      'box-vmtracker-shm-selection',
      'box-vmtracker-shm-comparison'
    ).setShmData(data, dataList);
  };
  displaySmapsData = (data: SnapshotStruct, dataList: Array<SnapshotStruct>): void => {
    let val = new SelectionParam();
    val.smapsType = [];
    val.leftNs = data.startNs;
    this.selection = val;
    val.smapsType = [];
    this.displayTab<TabPaneSmapsComparison>('box-smaps-comparison').setData(val, dataList);
    this.displayTab<TabPaneSmapsStatistics>(
      'box-smaps-statistics',
      'box-smaps-sample',
      'box-smaps-comparison',
      'box-smaps-record'
    ).data = val;
  };
  displaySnapshotData = (
    data: HeapSnapshotStruct,
    dataListCache: Array<HeapSnapshotStruct>,
    scrollCallback?: (data: HeapSnapshotStruct, dataListCache: Array<HeapSnapshotStruct>) => void
  ): void => {
    if (dataListCache.length > 1) {
      this.displayTab<TabPaneSummary>('box-heap-summary', 'box-heap-comparison').setSnapshotData(
        data,
        dataListCache,
        scrollCallback
      );
      let nav = this.shadowRoot!.querySelector('#tabs')!.shadowRoot!.querySelector(
        '#nav > #nav-comparison'
      ) as HTMLDivElement;
      let tabPaneComparison = this.shadowRoot!.querySelector(
        '#box-heap-comparison > tabpane-comparison'
      ) as TabPaneComparison;
      nav!.onclick = (): void => {
        tabPaneComparison.initComparison(data, dataListCache);
      };
    } else {
      this.displayTab<TabPaneSummary>('box-heap-summary').setSnapshotData(data, dataListCache, scrollCallback);
    }
  };
  displayFlagData = (flagObj: Flag): void => this.displayTab<TabPaneFlag>('box-flag').setCurrentFlag(flagObj);
  displayFreqData = (): CpuFreqStruct | undefined =>
    (this.displayTab<TabPaneCurrentSelection>('box-freq').data = CpuFreqStruct.selectCpuFreqStruct);
  displayCpuStateData = (): CpuStateStruct | undefined =>
    (this.displayTab<TabPaneCurrentSelection>('cpu-state-click').data = CpuStateStruct.selectStateStruct);
  displayFreqLimitData = (): CpuFreqLimitsStruct | undefined =>
    (this.displayTab<TabPaneCurrentSelection>('box-freq-limit').data = CpuFreqLimitsStruct.selectCpuFreqLimitsStruct);

  displayFrameAnimationData = (data: FrameAnimationStruct): Promise<void> =>
    this.displayTab<TabPaneCurrentSelection>('current-selection').setFrameAnimationData(data);
  displayFrameDynamicData = (row: TraceRow<FrameDynamicStruct>, data: FrameDynamicStruct): void =>
    this.displayTab<TabPaneFrameDynamic>('box-frame-dynamic').buildDynamicTable([data], true);
  displayFrameSpacingData = (data: FrameSpacingStruct): void =>
    this.displayTab<TabFrameSpacing>('box-frames-spacing').setFrameSpacingData(data);
  displayJsProfilerData = (data: Array<JsCpuProfilerChartFrame>): void => {
    let val = new SelectionParam();
    val.jsCpuProfilerData = data;
    this.selection = val;
    this.displayTab<TabPaneJsCpuStatistics>(
      'box-js-Profiler-statistics',
      'box-js-Profiler-bottom-up',
      'box-js-Profiler-top-down'
    ).data = data;
  };
  displayPurgTotalAbilityData = (data: SnapshotStruct, dataList: Array<SnapshotStruct>): void => {
    data.type = 'ability';
    this.displayTab<TabPanePurgTotalComparisonAbility>('box-purgeable-total-comparison-ability').totalData(
      data,
      dataList
    );
    this.displayTab<TabPanePurgTotalSelection>(
      'box-purgeable-total-selection',
      'box-purgeable-total-comparison-ability'
    ).data = data;
  };
  displayPurgPinAbilityData = (data: SnapshotStruct, dataList: Array<SnapshotStruct>): void => {
    data.type = 'ability';
    this.displayTab<TabPanePurgPinComparisonAbility>('box-purgeable-pin-comparison-ability').totalData(data, dataList);
    this.displayTab<TabPanePurgPinSelection>(
      'box-purgeable-pin-selection',
      'box-purgeable-pin-comparison-ability'
    ).data = data;
  };
  displayPurgTotalVMData = (data: SnapshotStruct, dataListCache: Array<SnapshotStruct>): void => {
    data.type = 'VM';
    this.displayTab<TabPanePurgTotalComparisonVM>('box-purgeable-total-comparison-vm').totalData(data, dataListCache);
    this.displayTab<TabPanePurgTotalSelection>(
      'box-purgeable-total-selection',
      'box-purgeable-total-comparison-vm'
    ).data = data;
  };
  displayPurgPinVMData = (data: SnapshotStruct, dataListCache: Array<SnapshotStruct>): void => {
    data.type = 'VM';
    this.displayTab<TabPanePurgPinComparisonVM>('box-purgeable-pin-comparison-vm').totalData(data, dataListCache);
    this.displayTab<TabPanePurgPinSelection>('box-purgeable-pin-selection', 'box-purgeable-pin-comparison-vm').data =
      data;
  };
  displayDmaAbility = (data: number, dataList: Array<SnapshotStruct>): void => {
    if (dataList.length > 0) {
      this.displayTab<TabPaneDmaAbilityComparison>('box-dma-ability-comparison').comparisonDataByDB(data, dataList);
      this.displayTab<TabPaneDmaSelectAbility>(
        'box-dma-selection-ability',
        'box-dma-ability-comparison'
      ).queryDmaClickDataByDB(data);
    } else {
      this.displayTab<TabPaneDmaSelectAbility>('box-dma-selection-ability').queryDmaClickDataByDB(data);
    }
  };
  displayDmaVmTracker = (data: number, dataListCache: Array<SnapshotStruct>): void => {
    if (dataListCache.length > 0) {
      this.displayTab<TabPaneDmaVmTrackerComparison>('box-vmTracker-comparison').comparisonDataByDB(
        data,
        dataListCache
      );
      this.displayTab<TabPaneDmaSelectVmTracker>(
        'box-dma-selection-vmTracker',
        'box-vmTracker-comparison'
      ).queryDmaVmTrackerClickDataByDB(data);
    } else {
      this.displayTab<TabPaneDmaSelectVmTracker>('box-dma-selection-vmTracker').queryDmaVmTrackerClickDataByDB(data);
    }
  };
  displayGpuMemoryAbility = (data: number, dataList: Array<SnapshotStruct>): void => {
    if (dataList.length > 0) {
      this.displayTab<TabPaneGpuMemoryComparison>('box-gpu-memory-comparison').comparisonDataByDB(data, dataList);
      this.displayTab<TabPaneGpuMemorySelectAbility>(
        'box-gpu-memory-selection-ability',
        'box-gpu-memory-comparison'
      ).queryGpuMemoryClickDataByDB(data);
    } else {
      this.displayTab<TabPaneGpuMemorySelectAbility>('box-gpu-memory-selection-ability').data = data;
    }
  };
  displayGpuMemoryVmTracker = (data: number, dataListCache: Array<SnapshotStruct>): void => {
    if (dataListCache.length > 0) {
      this.displayTab<TabPaneGpuMemoryVmTrackerComparison>('box-gpu-memory-vmTracker-comparison').comparisonDataByDB(
        data,
        dataListCache
      );
      this.displayTab<TabPaneGpuMemorySelectVmTracker>(
        'box-gpu-memory-selection-vmTracker',
        'box-gpu-memory-vmTracker-comparison'
      ).queryGpuMemoryVmTrackerClickDataByDB(data);
    } else {
      this.displayTab<TabPaneGpuMemorySelectVmTracker>(
        'box-gpu-memory-selection-vmTracker'
      ).queryGpuMemoryVmTrackerClickDataByDB(data);
    }
  };
  displayGpuResourceVmTracker = (data: number) => {
    this.displayTab<TabPaneGpuResourceVmTracker>('box-smaps-gpu-resource').data = data;
  };

  displaySystemLogsData = (): void => {
    let tblHiLogPanel = this.shadowRoot?.querySelector<LitTabpane>("lit-tabpane[id='box-hilogs']");
    if (tblHiLogPanel) {
      let tblHiLog = tblHiLogPanel.querySelector<TabPaneHiLogs>('tab-hi-log');
      if (tblHiLog) {
        tblHiLog.initTabSheetEl(this);
      }
    }
  };

  rangeSelect(selection: SelectionParam, restore = false): boolean {
    this.selection = selection;
    this.exportBt!.style.display = 'flex';
    this.showUploadSoBt(selection);
    this.showSwitchProcessBt(selection);
    Reflect.ownKeys(tabConfig)
      .reverse()
      .forEach((id) => {
        let element = tabConfig[id];
        let pane = this.shadowRoot!.querySelector<LitTabpane>(`#${id as string}`);
        if (pane) {
          pane.hidden = !(element.require && element.require(selection));
        }
      });
    if (restore) {
      if (this.litTabs?.activekey) {
        this.loadTabPaneData(this.litTabs?.activekey);
        this.setAttribute('mode', 'max');
        return true;
      } else {
        this.setAttribute('mode', 'hidden');
        return false;
      }
    } else {
      let firstPane = this.shadowRoot!.querySelector<LitTabpane>(`lit-tabpane[hidden='false']`);
      if (firstPane) {
        this.litTabs?.activeByKey(firstPane.key);
        this.loadTabPaneData(firstPane.key);
        this.setAttribute('mode', 'max');
        return true;
      } else {
        this.setAttribute('mode', 'hidden');
        return false;
      }
    }
  }

  updateRangeSelect(ipid?: number): boolean {
    if (
      this.selection &&
      (this.selection.nativeMemory.length > 0 ||
        this.selection.nativeMemoryStatistic.length > 0 ||
        this.selection.perfSampleIds.length > 0 ||
        this.selection.fileSystemType.length > 0 ||
        this.selection.fsCount > 0 ||
        this.selection.fileSysVirtualMemory ||
        this.selection.vmCount > 0 ||
        this.selection.diskIOLatency ||
        this.selection.diskIOipids.length > 0)
    ) {
      let param: SelectionParam = new SelectionParam();
      Object.assign(param, this.selection);
      if (param.nativeMemory.length > 0 || param.nativeMemoryStatistic.length > 0) {
        Utils.getInstance().initResponseTypeList(param);
        if (ipid) {
          Utils.getInstance().setCurrentSelectIPid(ipid);
          param.nativeMemoryCurrentIPid = ipid;
        }
      }
      this.rangeSelect(param, true);
      return true;
    } else {
      return false;
    }
  }

  showUploadSoBt(selection: SelectionParam | null | undefined): void {
    if (
      selection &&
      (selection.nativeMemory.length > 0 ||
        selection.nativeMemoryStatistic.length > 0 ||
        selection.perfSampleIds.length > 0 ||
        selection.fileSystemType.length > 0 ||
        selection.fsCount > 0 ||
        selection.fileSysVirtualMemory ||
        selection.vmCount > 0 ||
        selection.diskIOLatency ||
        selection.diskIOipids.length > 0)
    ) {
      this.importDiv!.style.display = 'flex';
    } else {
      this.importDiv!.style.display = 'none';
    }
  }
  isProcessEqual(treeData: Array<{ pid: number; ipid: number }>): boolean {
    if (treeData.length !== this.lastProcessSet.size) {
      return false;
    }
    for (let process of treeData) {
      if (!this.lastProcessSet.has(process.pid)) {
        return false;
      }
    }
    return true;
  }

  showSwitchProcessBt(selection: SelectionParam | null | undefined): void {
    // 2个及以上进程再显示
    if (selection && selection.nativeMemoryAllProcess.length > 1) {
      this.switchDiv!.style.display = 'flex';
      if (this.isProcessEqual(selection.nativeMemoryAllProcess)) {
        if (this.processTree) {
          for (const data of this.processTree.treeData) {
            if (data.key === `${selection.nativeMemoryCurrentIPid}`) {
              data.checked = true;
            } else {
              data.checked = false;
            }
          }
          //调用set重新更新界面
          this.processTree.treeData = this.processTree.treeData;
        }
        return;
      }
      this.lastProcessSet = new Set<number>();
      const processArray: Array<TreeItemData> = [];
      let isFirst: boolean = true;
      for (let process of selection.nativeMemoryAllProcess) {
        const treeData: TreeItemData = {
          key: `${process.ipid}`,
          title: `Process ${process.pid}`,
          checked: isFirst,
        };
        if (isFirst) {
          this.lastSelectIPid = process.ipid;
          isFirst = false;
        }
        processArray.push(treeData);
        this.lastProcessSet.add(process.pid);
      }
      this.processTree!.treeData = processArray;
    } else {
      this.switchDiv!.style.display = 'none';
    }
  }

  loadTabPaneData(key: string): void {
    let component: any = this.shadowRoot
      ?.querySelector<LitTabpane>(`#tabs lit-tabpane[key='${key}']`)
      ?.children.item(0);
    if (component) {
      component.data = this.selection;
      if (this.selection) {
        this.selection.isRowClick = false;
      }
    }
  }

  rowClickHandler(e: any): void {
    this.currentPaneID = e.target.parentElement.id;
    this.shadowRoot!.querySelectorAll<LitTabpane>(`lit-tabpane`).forEach((it) =>
      it.id !== this.currentPaneID ? (it.hidden = true) : (it.hidden = false)
    );
    let pane = this.getPaneByID('box-cpu-child');
    pane.closeable = true;
    pane.hidden = false;
    this.litTabs!.activeByKey(pane.key);
    pane.tab = Utils.transferPTSTitle(e.detail.title);
    let param = new BoxJumpParam();
    param.leftNs = this.selection!.leftNs;
    param.rightNs = this.selection!.rightNs;
    param.cpus = this.selection!.cpus;
    param.state = e.detail.state;
    param.processId = e.detail.pid;
    param.threadId = e.detail.tid;
    (pane.children.item(0) as TabPaneBoxChild).data = param;
  }

  clearMemory(): void {
    let allTabs = Array.from(this.shadowRoot?.querySelectorAll<LitTabpane>('#tabs lit-tabpane').values() || []);
    allTabs.forEach((tab) => {
      if (tab) {
        let tables = Array.from(
          (tab.firstChild as BaseElement).shadowRoot?.querySelectorAll<LitTable>('lit-table') || []
        );
        for (let table of tables) {
          table.recycleDataSource = [];
        }
      }
    });
  }
}
