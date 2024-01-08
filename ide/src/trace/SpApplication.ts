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

import { BaseElement, element } from '../base-ui/BaseElement';
import '../base-ui/menu/LitMainMenu';
import '../base-ui/icon/LitIcon';
import { SpMetrics } from './component/SpMetrics';
import { SpHelp } from './component/SpHelp';
import './component/SpHelp';
import { SpQuerySQL } from './component/SpQuerySQL';
import './component/SpQuerySQL';
import { SpSystemTrace } from './component/SpSystemTrace';
import { LitMainMenu, MenuItem } from '../base-ui/menu/LitMainMenu';
import { SpInfoAndStats } from './component/SpInfoAndStas';
import '../base-ui/progress-bar/LitProgressBar';
import { LitProgressBar } from '../base-ui/progress-bar/LitProgressBar';
import { SpRecordTrace } from './component/SpRecordTrace';
import { SpWelcomePage } from './component/SpWelcomePage';
import { LitSearch } from './component/trace/search/Search';
import { DbPool, threadPool } from './database/SqlLite';
import './component/trace/search/Search';
import './component/SpWelcomePage';
import './component/SpSystemTrace';
import './component/SpRecordTrace';
import './component/SpMetrics';
import './component/SpInfoAndStas';
import './component/trace/base/TraceRow';
import './component/schedulingAnalysis/SpSchedulingAnalysis';
import { error, info, log } from '../log/Log';
import { LitMainMenuGroup } from '../base-ui/menu/LitMainMenuGroup';
import { LitMainMenuItem } from '../base-ui/menu/LitMainMenuItem';
import { LitIcon } from '../base-ui/icon/LitIcon';
import { Cmd } from '../command/Cmd';
import { TraceRow } from './component/trace/base/TraceRow';
import { SpSchedulingAnalysis } from './component/schedulingAnalysis/SpSchedulingAnalysis';
import './component/trace/base/TraceRowConfig';
import { TraceRowConfig } from './component/trace/base/TraceRowConfig';
import { ColorUtils } from './component/trace/base/ColorUtils';
import { SpStatisticsHttpUtil } from '../statistics/util/SpStatisticsHttpUtil';
import { FlagsConfig, SpFlags } from './component/SpFlags';
import './component/SpFlags';
import './component/trace/base/CustomThemeColor';
import { CustomThemeColor, Theme } from './component/trace/base/CustomThemeColor';
import { convertPool } from './database/Convert';
import { LongTraceDBUtils } from './database/LongTraceDBUtils';
import { type SpKeyboard } from './component/SpKeyboard';
import './component/SpKeyboard';
import { parseKeyPathJson } from './component/Utils';
import { Utils } from './component/trace/base/Utils';
import "../base-ui/chart/scatter/LitChartScatter";
import {SpApplicationHtml} from "./SpApplication.html";
import {queryExistFtrace} from "./database/sql/SqlLite.sql";

@element('sp-application')
export class SpApplication extends BaseElement {
  private static loadingProgress: number = 0;
  private static progressStep: number = 2;
  longTraceHeadMessageList: Array<{
    pageNum: number;
    data: ArrayBuffer;
  }> = [];

  longTraceDataList: Array<{
    fileType: string;
    index: number;
    pageNum: number;
    startOffsetSize: number;
    endOffsetSize: number;
  }> = [];

  longTraceTypeMessageMap:
    | Map<
        number,
        Array<{
          fileType: string;
          startIndex: number;
          endIndex: number;
          size: number;
        }>
      >
    | undefined
    | null;
  static skinChange: Function | null | undefined = null;
  static skinChange2: Function | null | undefined = null;
  skinChangeArray: Array<Function> = [];
  private rootEL: HTMLDivElement | undefined | null;
  private spHelp: SpHelp | undefined | null;
  private keyCodeMap = {
    61: true,
    107: true,
    109: true,
    173: true,
    187: true,
    189: true,
  };
  private traceFileName: string | undefined;
  colorTransiton: any;
  static isLongTrace: boolean = false;
  fileTypeList: string[] = ['ebpf', 'arkts', 'hiperf'];
  private pageTimStamp: number = 0;
  private currentPageNum: number = 1;

  static get observedAttributes() {
    return ['server', 'sqlite', 'wasm', 'dark', 'vs', 'query-sql', 'subsection'];
  }

  get dark() {
    return this.hasAttribute('dark');
  }

  set dark(value) {
    if (value) {
      this.rootEL!.classList.add('dark');
      this.setAttribute('dark', '');
    } else {
      this.rootEL!.classList.remove('dark');
      this.removeAttribute('dark');
    }
    if (this.skinChangeArray.length > 0) {
      this.skinChangeArray.forEach((item) => item(value));
    }
    if (SpApplication.skinChange) {
      SpApplication.skinChange(value);
    }
    if (SpApplication.skinChange2) {
      SpApplication.skinChange2(value);
    }

    if (this.spHelp) {
      this.spHelp.dark = value;
    }
  }

  get vs(): boolean {
    return this.hasAttribute('vs');
  }

  set vs(isVs: boolean) {
    if (isVs) {
      this.setAttribute('vs', '');
    }
  }

  get sqlite(): boolean {
    return this.hasAttribute('sqlite');
  }

  get wasm(): boolean {
    return this.hasAttribute('wasm');
  }

  set wasm(d: any) {
    this.setAttribute('wasm', '');
  }

  get server(): boolean {
    return this.hasAttribute('server');
  }

  set server(s: boolean) {
    if (s) {
      this.setAttribute('server', '');
    } else {
      this.removeAttribute('server');
    }
  }

  get querySql(): boolean {
    return this.hasAttribute('query-sql');
  }

  set querySql(isShowMetric) {
    if (isShowMetric) {
      this.setAttribute('query-sql', '');
    } else {
      this.removeAttribute('query-sql');
    }
  }

  set search(search: boolean) {
    if (search) {
      this.setAttribute('search', '');
    } else {
      this.removeAttribute('search');
    }
  }

  get search(): boolean {
    return this.hasAttribute('search');
  }

  addSkinListener(handler: Function) {
    this.skinChangeArray.push(handler);
  }

  removeSkinListener(handler: Function) {
    this.skinChangeArray.splice(this.skinChangeArray.indexOf(handler), 1);
  }

  initHtml(): string {
    return SpApplicationHtml;
  }

  initElements() {
    SpStatisticsHttpUtil.initStatisticsServerConfig();
    SpStatisticsHttpUtil.addUserVisitAction('visit');
    LongTraceDBUtils.getInstance().createDBAndTable().then();
    let that = this;
    this.querySql = true;
    this.rootEL = this.shadowRoot!.querySelector<HTMLDivElement>('.root');
    let spWelcomePage = this.shadowRoot!.querySelector('#sp-welcome') as SpWelcomePage;
    let spMetrics = this.shadowRoot!.querySelector<SpMetrics>('#sp-metrics') as SpMetrics; // new SpMetrics();
    let spQuerySQL = this.shadowRoot!.querySelector<SpQuerySQL>('#sp-query-sql') as SpQuerySQL; // new SpQuerySQL();
    let spInfoAndStats = this.shadowRoot!.querySelector<SpInfoAndStats>('#sp-info-and-stats') as SpInfoAndStats; // new SpInfoAndStats();
    let spSystemTrace = this.shadowRoot!.querySelector<SpSystemTrace>('#sp-system-trace');
    this.spHelp = this.shadowRoot!.querySelector<SpHelp>('#sp-help');
    let SpKeyboard = this.shadowRoot!.querySelector<SpKeyboard>('#sp-keyboard') as SpKeyboard;
    let spFlags = this.shadowRoot!.querySelector<SpFlags>('#sp-flags') as SpFlags;
    let spRecordTrace = this.shadowRoot!.querySelector<SpRecordTrace>('#sp-record-trace');
    let spRecordTemplate = this.shadowRoot!.querySelector<SpRecordTrace>('#sp-record-template');
    let spSchedulingAnalysis = this.shadowRoot!.querySelector<SpSchedulingAnalysis>(
      '#sp-scheduling-analysis'
    ) as SpSchedulingAnalysis;
    let mainMenu = this.shadowRoot?.querySelector('#main-menu') as LitMainMenu;
    let menu = mainMenu.shadowRoot?.querySelector('.menu-button') as HTMLDivElement;
    let progressEL = this.shadowRoot?.querySelector('.progress') as LitProgressBar;
    let litSearch = this.shadowRoot?.querySelector('#lit-search') as LitSearch;
    let litRecordSearch = this.shadowRoot?.querySelector('#lit-record-search') as LitSearch;
    let sidebarButton: HTMLDivElement | undefined | null = this.shadowRoot?.querySelector('.sidebar-button');
    let chartFilter = this.shadowRoot?.querySelector('.chart-filter') as TraceRowConfig;
    let cutTraceFile = this.shadowRoot?.querySelector('.cut-trace-file') as HTMLImageElement;
    let longTracePage = that.shadowRoot!.querySelector('.long_trace_page') as HTMLDivElement;
    cutTraceFile.addEventListener('click', () => {
      this.croppingFile(progressEL, litSearch);
    });
    let customColor = this.shadowRoot?.querySelector('.custom-color') as CustomThemeColor;
    mainMenu!.setAttribute('main_menu', '1');
    chartFilter!.setAttribute('mode', '');
    chartFilter!.setAttribute('hidden', '');
    customColor!.setAttribute('mode', '');
    customColor!.setAttribute('hidden', '');
    let childNodes = [
      spSystemTrace,
      spRecordTrace,
      spWelcomePage,
      spMetrics,
      spQuerySQL,
      spSchedulingAnalysis,
      spInfoAndStats,
      this.spHelp,
      spRecordTemplate,
      spFlags,
      SpKeyboard,
    ];
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') {
        validateFileCacheLost();
        if (window.localStorage.getItem('Theme') == 'dark') {
          that.changeTheme(Theme.DARK);
        } else {
          that.changeTheme(Theme.LIGHT);
        }
      }
    });
    this.addEventListener('copy', function (event) {
      let clipdata = event.clipboardData;
      let value = clipdata!.getData('text/plain');
      let searchValue = value.toString().trim();
      clipdata!.setData('text/plain', searchValue);
    });
    window.subscribe(window.SmartEvent.UI.MenuTrace, () => showContent(spSystemTrace!));
    window.subscribe(window.SmartEvent.UI.Error, (err) => {
      litSearch.setPercent(err, -1);
      progressEL.loading = false;
      that.freshMenuDisable(false);
    });
    window.subscribe(window.SmartEvent.UI.Loading, (arg: { loading: boolean; text?: string }) => {
      if (arg.text) {
        litSearch.setPercent(arg.text || '', arg.loading ? -1 : 101);
      }
      window.publish(window.SmartEvent.UI.MouseEventEnable, {
        mouseEnable: !arg.loading,
      });
      progressEL.loading = arg.loading;
    });

    litSearch.addEventListener('focus', () => {
      window.publish(window.SmartEvent.UI.KeyboardEnable, {
        enable: false,
      });
    });
    litSearch.addEventListener('blur', () => {
      window.publish(window.SmartEvent.UI.KeyboardEnable, {
        enable: true,
      });
    });
    litSearch.addEventListener('previous-data', (ev: any) => {
      litSearch.index = spSystemTrace!.showStruct(true, litSearch.index, litSearch.list);
      litSearch.blur();
    });
    litSearch.addEventListener('next-data', (ev: any) => {
      litSearch.index = spSystemTrace!.showStruct(false, litSearch.index, litSearch.list);
      litSearch.blur();
    });
    // 翻页事件
    litSearch.addEventListener('retarget-data', (ev: any) => {
      litSearch.index = spSystemTrace!.showStruct(true, ev.detail.value, litSearch.list, ev.detail.value);
      litSearch.blur();
    });
    litSearch.valueChangeHandler = (value: string) => {
      litSearch!.isClearValue = false;
      if (value.length > 0) {
        let list: any[] = [];
        progressEL.loading = true;
        spSystemTrace!.searchCPU(value).then((cpus) => {
          list = cpus;
          spSystemTrace!.searchFunction(list, value).then((mixedResults) => {
            if (litSearch.searchValue != '') {
              litSearch.list = spSystemTrace!.searchSdk(mixedResults, value);
              litSearch.index = spSystemTrace!.showStruct(false, -1, litSearch.list);
            }
            progressEL.loading = false;
          });
        });
      } else {
        let indexEL = litSearch.shadowRoot!.querySelector<HTMLSpanElement>('#index');
        indexEL!.textContent = '0';
        litSearch.list = [];
        spSystemTrace?.visibleRows.forEach((it) => {
          it.highlight = false;
          it.draw();
        });
        spSystemTrace?.timerShaftEL?.removeTriangle('inverted');
      }
    };
    spSystemTrace?.addEventListener('trace-previous-data', (ev: any) => {
      litSearch.index = spSystemTrace!.showStruct(true, litSearch.index, litSearch.list);
    });
    spSystemTrace?.addEventListener('trace-next-data', (ev: any) => {
      litSearch.index = spSystemTrace!.showStruct(false, litSearch.index, litSearch.list);
    });

    let filterConfig = this.shadowRoot?.querySelector('.filter-config') as LitIcon;
    let configClose = this.shadowRoot
      ?.querySelector<HTMLElement>('.chart-filter')!
      .shadowRoot?.querySelector<LitIcon>('.config-close');
    filterConfig.addEventListener('click', (ev) => {
      if (this!.hasAttribute('chart_filter')) {
        this!.removeAttribute('chart_filter');
        chartFilter!.setAttribute('hidden', '');
      } else {
        this!.removeAttribute('custom-color');
        customColor!.setAttribute('hidden', '');
        customColor.cancelOperate();
        this!.setAttribute('chart_filter', '');
        chartFilter!.removeAttribute('hidden');
      }
    });
    configClose!.addEventListener('click', (ev) => {
      if (this.hasAttribute('chart_filter')) {
        this!.removeAttribute('chart_filter');
      }
    });

    let customColorShow = this.shadowRoot
      ?.querySelector('lit-main-menu')!
      .shadowRoot!.querySelector('.customColor') as HTMLDivElement;
    customColorShow.addEventListener('click', (ev) => {
      if (this!.hasAttribute('custom-color')) {
        this!.removeAttribute('custom-color');
        customColor!.setAttribute('hidden', '');
        customColor.cancelOperate();
      } else {
        this!.removeAttribute('chart_filter');
        chartFilter!.setAttribute('hidden', '');
        this!.setAttribute('custom-color', '');
        customColor!.removeAttribute('hidden');
      }
    });

    // 关键路径标识
    const importConfigDiv = this.shadowRoot?.querySelector<HTMLInputElement>('#import-key-path');
    const closeKeyPath = this.shadowRoot?.querySelector<HTMLDivElement>('#close-key-path');

    const importFileBt = this.shadowRoot?.querySelector<HTMLInputElement>('#import-config');
    importFileBt?.addEventListener('change', (): void => {
      let files = importFileBt!.files;
      if (files && files.length === 1) {
        const reader = new FileReader();
        reader.readAsText(files[0], 'UTF-8');
        reader.onload = (e) => {
          if (e.target?.result) {
            try {
              const result = parseKeyPathJson(e.target.result as string);
              window.publish(window.SmartEvent.UI.KeyPath, result);
              closeKeyPath!.style.display = 'block';
            } catch {
              error('json Parse Failed');
              litSearch.setPercent('Json Parse Failed!', -1);
              window.setTimeout(() => {
                litSearch.setPercent('Json Parse Failed!', 101);
              }, 1000);
            }
          } else {
            window.publish(window.SmartEvent.UI.KeyPath, []);
            closeKeyPath!.style.display = 'none';
          }
        };
      }
      importFileBt!.files = null;
      importFileBt!.value = '';
    });

    if (closeKeyPath) {
      closeKeyPath.addEventListener('click', (): void => {
        window.publish(window.SmartEvent.UI.KeyPath, []);
        closeKeyPath.style.display = 'none';
      });
    }

    //打开侧边栏
    sidebarButton!.onclick = (e) => {
      let menu: HTMLDivElement | undefined | null = this.shadowRoot?.querySelector('#main-menu');
      let menuButton: HTMLElement | undefined | null = this.shadowRoot?.querySelector('.sidebar-button');
      if (menu) {
        menu.style.width = `248px`;
        // @ts-ignore
        menu.style.zIndex = 2000;
        menu.style.display = `flex`;
      }
      if (menuButton) {
        menuButton.style.width = `0px`;
        importConfigDiv!.style.left = '5px';
        closeKeyPath!.style.left = '25px';
      }
    };
    let icon: HTMLDivElement | undefined | null = this.shadowRoot
      ?.querySelector('#main-menu')
      ?.shadowRoot?.querySelector('div.header > div');
    icon!.style.pointerEvents = 'none';
    icon!.onclick = (e) => {
      let menu: HTMLElement | undefined | null = this.shadowRoot?.querySelector('#main-menu');
      let menuButton: HTMLElement | undefined | null = this.shadowRoot?.querySelector('.sidebar-button');
      if (menu) {
        menu.style.width = `0px`;
        menu.style.display = `flex`;
        // @ts-ignore
        menu.style.zIndex = 0;
      }
      if (menuButton) {
        menuButton.style.width = `48px`;
        importConfigDiv!.style.left = '45px';
        closeKeyPath!.style.left = '65px';
      }
    };

    function showContent(showNode: HTMLElement) {
      if (showNode === spSystemTrace) {
        menu!.style.pointerEvents = 'auto';
        sidebarButton!.style.pointerEvents = 'auto';
        that.search = true;
        litRecordSearch.style.display = 'none';
        litSearch.style.display = 'block';
        window.publish(window.SmartEvent.UI.KeyboardEnable, {
          enable: true,
        });
        filterConfig.style.visibility = 'visible';
      } else {
        that.removeAttribute('custom-color');
        customColor!.setAttribute('hidden', '');
        customColor.cancelOperate();
        menu!.style.pointerEvents = 'none';
        sidebarButton!.style.pointerEvents = 'none';
        that.search = litSearch.isLoading;
        if (!that.search) {
          litSearch.style.display = 'none';
          litRecordSearch.style.display = 'block';
        }
        window.publish(window.SmartEvent.UI.KeyboardEnable, {
          enable: false,
        });
        filterConfig.style.visibility = 'hidden';
      }
      log('show pages' + showNode.id);
      childNodes.forEach((node) => {
        if (that.hasAttribute('chart_filter')) {
          that!.removeAttribute('chart_filter');
        }
        if (that!.hasAttribute('custom-color')) {
          that!.removeAttribute('custom-color');
          customColor!.setAttribute('hidden', '');
          customColor.cancelOperate();
        }
        if (node === showNode) {
          showNode.style.visibility = 'visible';
        } else {
          node!.style.visibility = 'hidden';
        }
      });
    }

    function postLog(filename: string, fileSize: string) {
      log('postLog filename is: ' + filename + ' fileSize: ' + fileSize);
      fetch(`https://${window.location.host.split(':')[0]}:${window.location.port}/logger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: filename,
          fileSize: fileSize,
        }),
      })
        .then((response) => response.json())
        .then((data) => {})
        .catch((error) => {});
    }

    function getTraceOptionMenus(
      showFileName: string,
      fileSize: string,
      fileName: string,
      isServer: boolean,
      dbName?: string
    ) {
      let menus = [
        {
          title: `${showFileName} (${fileSize}M)`,
          icon: 'file-fill',
          clickHandler: function () {
            that.search = true;
            showContent(spSystemTrace!);
          },
        },
        {
          title: 'Scheduling Analysis',
          icon: 'piechart-circle-fil',
          clickHandler: function () {
            SpStatisticsHttpUtil.addOrdinaryVisitAction({
              event: 'Scheduling Analysis',
              action: 'scheduling_analysis',
            });
            showContent(spSchedulingAnalysis!);
            spSchedulingAnalysis.init();
          },
        },
        {
          title: 'Download File',
          icon: 'download',
          clickHandler: function () {
            that.download(mainMenu, fileName, isServer, dbName);
            SpStatisticsHttpUtil.addOrdinaryVisitAction({
              event: 'download',
              action: 'download',
            });
          },
        },
        {
          title: 'Download Database',
          icon: 'download',
          clickHandler: function () {
            that.downloadDB(mainMenu, fileName);
            SpStatisticsHttpUtil.addOrdinaryVisitAction({
              event: 'download_db',
              action: 'download',
            });
          },
        },
      ];
      if (that.querySql) {
        if (spQuerySQL) {
          spQuerySQL.reset();
          menus.push({
            title: 'Query (SQL)',
            icon: 'filesearch',
            clickHandler: () => {
              showContent(spQuerySQL);
            },
          });
        }

        if (spMetrics) {
          spMetrics.reset();
          menus.push({
            title: 'Metrics',
            icon: 'metric',
            clickHandler: () => {
              showContent(spMetrics);
            },
          });
        }

        if (spInfoAndStats) {
          menus.push({
            title: 'Info and stats',
            icon: 'info',
            clickHandler: () => {
              SpStatisticsHttpUtil.addOrdinaryVisitAction({
                event: 'info',
                action: 'info_stats',
              });
              showContent(spInfoAndStats);
            },
          });
        }
      }
      if ((window as any).cpuCount === 0 || !FlagsConfig.getFlagsConfigEnableStatus('SchedulingAnalysis')) {
        //if cpu count > 1 or SchedulingAnalysis config 'enable'  then show Scheduling-Analysis menu else hide it
        menus.splice(1, 1);
      }

      return menus;
    }

    function restoreDownLoadIcons() {
      let querySelectorAll = mainMenu.shadowRoot?.querySelectorAll<LitMainMenuGroup>('lit-main-menu-group');
      querySelectorAll!.forEach((menuGroup) => {
        let attribute = menuGroup.getAttribute('title');
        if (attribute === 'Convert trace') {
          let querySelectors = menuGroup.querySelectorAll<LitMainMenuItem>('lit-main-menu-item');
          querySelectors.forEach((item) => {
            if (item.getAttribute('title') === 'Convert to .systrace') {
              item!.setAttribute('icon', 'download');
              let querySelector = item!.shadowRoot?.querySelector('.icon') as LitIcon;
              querySelector.removeAttribute('spin');
            }
          });
        }
      });
    }

    function postConvert(fileName: string): void {
      let newFileName = fileName.substring(0, fileName.lastIndexOf('.')) + '.systrace';
      let aElement = document.createElement('a');
      convertPool.submitWithName('getConvertData', (status: boolean, msg: string, results: Blob) => {
        aElement.href = URL.createObjectURL(results);
        aElement.download = newFileName;
        let timeoutId = 0;
        aElement.addEventListener('click', (ev) => {
          clearTimeout(timeoutId);
          timeoutId = window.setTimeout(() => {
            restoreDownLoadIcons();
          }, 2000);
        });
        aElement.click();
        window.URL.revokeObjectURL(aElement.href);
      });
    }

    function pushConvertTrace(fileName: string): Array<any> {
      let menus = [];
      menus.push({
        title: 'Convert to .systrace',
        icon: 'download',
        clickHandler: function () {
          convertPool.init('convert').then((item) => {
            let querySelectorAll = mainMenu.shadowRoot?.querySelectorAll<LitMainMenuGroup>('lit-main-menu-group');
            querySelectorAll!.forEach((menuGroup) => {
              let attribute = menuGroup.getAttribute('title');
              if (attribute === 'Convert trace') {
                let querySelectors = menuGroup.querySelectorAll<LitMainMenuItem>('lit-main-menu-item');
                querySelectors.forEach((item) => {
                  if (item.getAttribute('title') === 'Convert to .systrace') {
                    item!.setAttribute('icon', 'convert-loading');
                    item!.classList.add('pending');
                    item!.style.fontKerning = '';
                    let querySelector = item!.shadowRoot?.querySelector('.icon') as LitIcon;
                    querySelector.setAttribute('spin', '');
                  }
                });
              }
            });
            postConvert(fileName);
          });
        },
      });
      return menus;
    }

    function setProgress(command: string) {
      if (command == 'database ready' && SpApplication.loadingProgress < 50) {
        SpApplication.progressStep = 6;
      }
      if (command == 'process' && SpApplication.loadingProgress < 92) {
        SpApplication.loadingProgress = 92 + Math.round(Math.random() * SpApplication.progressStep);
      } else {
        SpApplication.loadingProgress += Math.round(Math.random() * SpApplication.progressStep + Math.random());
      }
      if (SpApplication.loadingProgress > 99) {
        SpApplication.loadingProgress = 99;
      }
      info('setPercent ：' + command + 'percent :' + SpApplication.loadingProgress);
      litSearch.setPercent(command + '  ', SpApplication.loadingProgress);
    }

    function sendCutFileMessage(timStamp: number) {
      that.pageTimStamp = timStamp;
      threadPool.init('wasm').then(() => {
        let headUintArray = new Uint8Array(that.longTraceHeadMessageList.length * 1024);
        let headOffset = 0;
        that.longTraceHeadMessageList = that.longTraceHeadMessageList.sort(
          (leftMessage, rightMessage) => leftMessage.pageNum - rightMessage.pageNum
        );
        for (let index = 0; index < that.longTraceHeadMessageList.length; index++) {
          let currentUintArray = new Uint8Array(that.longTraceHeadMessageList[index].data);
          headUintArray.set(currentUintArray, headOffset);
          headOffset += currentUintArray.length;
        }
        threadPool.submit(
          'ts-cut-file',
          '',
          {
            headArray: headUintArray,
            timeStamp: timStamp,
            splitFileInfo: that.longTraceTypeMessageMap?.get(0),
            splitDataList: that.longTraceDataList,
          },
          (res: Array<any>) => {
            litSearch.setPercent('Cut in file ', 100);
            if (that.longTraceHeadMessageList.length > 0) {
              getTraceFileByPage(that.currentPageNum);
              litSearch.style.marginLeft = '80px';
              longTracePage.style.display = 'flex';
              let pageListDiv = that.shadowRoot?.querySelector('.page-number-list') as HTMLDivElement;
              let previewButton: HTMLDivElement | null | undefined =
                that.shadowRoot?.querySelector<HTMLDivElement>('#preview-button');
              let nextButton: HTMLDivElement | null | undefined =
                that.shadowRoot?.querySelector<HTMLDivElement>('#next-button');
              let pageInput = that.shadowRoot?.querySelector<HTMLInputElement>('.page-input');
              pageListDiv.innerHTML = '';
              that.refreshPageList(
                pageListDiv,
                previewButton!,
                nextButton!,
                pageInput!,
                that.currentPageNum,
                that.longTraceHeadMessageList.length
              );
              if (previewButton) {
                previewButton.addEventListener('click', () => {
                  if (progressEL.loading || that.currentPageNum === 1) {
                    return;
                  }
                  if (that.currentPageNum > 1) {
                    that.currentPageNum--;
                    progressEL.loading = true;
                    that.refreshPageList(
                      pageListDiv,
                      previewButton!,
                      nextButton!,
                      pageInput!,
                      that.currentPageNum,
                      that.longTraceHeadMessageList.length
                    );
                    getTraceFileByPage(that.currentPageNum);
                  }
                });
              }
              nextButton!.addEventListener('click', () => {
                if (progressEL.loading || that.currentPageNum === that.longTraceHeadMessageList.length) {
                  return;
                }
                if (that.currentPageNum < that.longTraceHeadMessageList.length) {
                  that.currentPageNum++;
                  progressEL.loading = true;
                  that.refreshPageList(
                    pageListDiv,
                    previewButton!,
                    nextButton!,
                    pageInput!,
                    that.currentPageNum,
                    that.longTraceHeadMessageList.length
                  );
                  getTraceFileByPage(that.currentPageNum);
                }
              });
              let nodeListOf = pageListDiv.querySelectorAll<HTMLDivElement>('div');
              nodeListOf.forEach((divEL, index) => {
                divEL.addEventListener('click', () => {
                  if (progressEL.loading) {
                    return;
                  }
                  if (divEL.textContent === '...') {
                    let freeSize =
                      Number(nodeListOf[index + 1].textContent) - Number(nodeListOf[index - 1].textContent);
                    that.currentPageNum = Math.floor(freeSize / 2 + Number(nodeListOf[index - 1].textContent));
                  } else {
                    that.currentPageNum = Number(divEL.textContent);
                  }
                  progressEL.loading = true;
                  that.refreshPageList(
                    pageListDiv,
                    previewButton!,
                    nextButton!,
                    pageInput!,
                    that.currentPageNum,
                    that.longTraceHeadMessageList.length
                  );
                  getTraceFileByPage(that.currentPageNum);
                });
              });
              pageInput!.addEventListener('input', () => {
                let value = pageInput!.value;
                value = value.replace(/\D/g, '');
                if (value) {
                  value = Math.min(that.longTraceHeadMessageList.length, parseInt(value)).toString();
                }
                pageInput!.value = value;
              });
              let pageConfirmEl = that.shadowRoot?.querySelector<HTMLDivElement>('.confirm-button');
              pageConfirmEl!.addEventListener('click', () => {
                if (progressEL.loading) {
                  return;
                }
                that.currentPageNum = Number(pageInput!.value);
                progressEL.loading = true;
                that.refreshPageList(
                  pageListDiv,
                  previewButton!,
                  nextButton!,
                  pageInput!,
                  that.currentPageNum,
                  that.longTraceHeadMessageList.length
                );
                getTraceFileByPage(that.currentPageNum);
              });
            } else {
              progressEL.loading = false;
              litSearch.setPercent('The basic trace file in the large-file scenario is missing!', -1);
              that.freshMenuDisable(false);
              return;
            }
          },
          'long_trace'
        );
      });
    }

    function getTraceFileByPage(pageNumber: number): void {
      openFileInit();
      litSearch.clear();
      showContent(spSystemTrace!);
      that.search = true;
      progressEL.loading = true;
      if (!that.wasm) {
        progressEL.loading = false;
        return;
      }
      if (that.pageTimStamp === 0) {
        return;
      }
      let indexedDbPageNum = pageNumber - 1;
      let maxTraceFileLength = 400 * 1024 * 1024;
      let traceRange = IDBKeyRange.bound(
        [that.pageTimStamp, 'trace', indexedDbPageNum],
        [that.pageTimStamp, 'trace', indexedDbPageNum],
        false,
        false
      );
      LongTraceDBUtils.getInstance()
        .indexedDBHelp.get(LongTraceDBUtils.getInstance().tableName, traceRange, 'QueryFileByPage')
        .then((result) => {
          let traceData = indexedDataToBufferData(result);
          let traceLength = traceData.byteLength;
          let ebpfRange = IDBKeyRange.bound(
            [that.pageTimStamp, 'ebpf_new', indexedDbPageNum],
            [that.pageTimStamp, 'ebpf_new', indexedDbPageNum],
            false,
            false
          );
          let arkTsRange = IDBKeyRange.bound(
            [that.pageTimStamp, 'arkts_new', indexedDbPageNum],
            [that.pageTimStamp, 'arkts_new', indexedDbPageNum],
            false,
            false
          );
          let hiperfRange = IDBKeyRange.bound(
            [that.pageTimStamp, 'hiperf_new', indexedDbPageNum],
            [that.pageTimStamp, 'hiperf_new', indexedDbPageNum],
            false,
            false
          );
          Promise.all([
            LongTraceDBUtils.getInstance().indexedDBHelp.get(
              LongTraceDBUtils.getInstance().tableName,
              ebpfRange,
              'QueryFileByPage'
            ),
            LongTraceDBUtils.getInstance().indexedDBHelp.get(
              LongTraceDBUtils.getInstance().tableName,
              arkTsRange,
              'QueryFileByPage'
            ),
            LongTraceDBUtils.getInstance().indexedDBHelp.get(
              LongTraceDBUtils.getInstance().tableName,
              hiperfRange,
              'QueryFileByPage'
            ),
          ]).then((otherResult) => {
            let ebpfData = indexedDataToBufferData(otherResult[0]);
            let arkTsData = indexedDataToBufferData(otherResult[1]);
            let hiperfData = indexedDataToBufferData(otherResult[2]);
            let traceArray = new Uint8Array(traceData);
            let ebpfArray = new Uint8Array(ebpfData);
            let arkTsArray = new Uint8Array(arkTsData);
            let hiPerfArray = new Uint8Array(hiperfData);
            let allOtherData = [ebpfData, arkTsData, hiperfData];
            let otherDataLength = traceLength + ebpfData.byteLength + arkTsData.byteLength + hiperfData.byteLength;
            let fileName = `hiprofiler_long_trace_${indexedDbPageNum}.htrace`;
            if (otherDataLength > maxTraceFileLength) {
              if (traceLength > maxTraceFileLength) {
                litSearch.isLoading = false;
                litSearch.setPercent('hitrace file too big!', -1);
                progressEL.loading = false;
                that.freshMenuDisable(false);
              } else {
                let freeDataLength = maxTraceFileLength - traceLength;
                let freeDataIndex = findFreeSizeAlgorithm(
                  [ebpfData.byteLength, arkTsData.byteLength, hiperfData.byteLength],
                  freeDataLength
                );
                let finalData = [traceData];
                freeDataIndex.forEach((dataIndex) => {
                  finalData.push(allOtherData[dataIndex]);
                });
                let fileBlob = new Blob(finalData);
                const file = new File([fileBlob], fileName);
                let fileSize = (file.size / 1048576).toFixed(1);
                document.title = `${fileName}(${fileSize})`;
                handleWasmMode(file, file.name, `${fileSize}`, fileName);
              }
            } else {
              let fileBlob = new Blob([traceArray, ebpfArray, arkTsArray, hiPerfArray]);
              const file = new File([fileBlob], fileName);
              let fileSize = (file.size / 1048576).toFixed(1);
              document.title = `${fileName}(${fileSize})`;
              handleWasmMode(file, file.name, `${fileSize}`, file.name);
            }
            that.traceFileName = fileName;
          });
        });
    }

    function indexedDataToBufferData(sourceData: any): ArrayBuffer {
      let uintArrayLength = 0;
      let uintDataList = sourceData.map((item: any) => {
        let currentBufData = new Uint8Array(item.buf);
        uintArrayLength += currentBufData.length;
        return currentBufData;
      });
      let resultArrayBuffer = new ArrayBuffer(uintArrayLength);
      let resultUintArray = new Uint8Array(resultArrayBuffer);
      let offset = 0;
      uintDataList.forEach((currentArray: Uint8Array) => {
        resultUintArray.set(currentArray, offset);
        offset += currentArray.length;
      });
      return resultArrayBuffer;
    }

    function findFreeSizeAlgorithm(numbers: Array<number>, freeSize: number): Array<number> {
      let closestSize = 0;
      let currentSize = 0;
      let finalIndex: Array<number> = [];
      let currentSelectIndex: Array<number> = [];

      function reBackFind(index: number): void {
        if (index === numbers.length) {
          const sumDifference = Math.abs(currentSize - freeSize);
          if (currentSize <= freeSize && sumDifference < Math.abs(closestSize - freeSize)) {
            closestSize = currentSize;
            finalIndex = [...currentSelectIndex];
          }
          return;
        }
        currentSize += numbers[index];
        currentSelectIndex.push(index);
        reBackFind(index + 1);
        currentSize -= numbers[index];
        currentSelectIndex.pop();
        reBackFind(index + 1);
      }

      reBackFind(0);
      return finalIndex;
    }

    function handleWasmMode(ev: any, showFileName: string, fileSize: string, fileName: string) {
      litSearch.setPercent('', 1);
      threadPool.init('wasm').then((res) => {
        let reader: FileReader | null = new FileReader();
        reader.readAsArrayBuffer(ev as any);
        reader.onloadend = function (ev) {
          info('read file onloadend');
          litSearch.setPercent('ArrayBuffer loaded  ', 2);
          let wasmUrl = `https://${window.location.host.split(':')[0]}:${window.location.port}/application/wasm.json`;
          if (that.vs) {
            wasmUrl = `http://${window.location.host.split(':')[0]}:${window.location.port}/wasm.json`;
          }
          SpApplication.loadingProgress = 0;
          SpApplication.progressStep = 3;
          let data = this.result as ArrayBuffer;
          info('initData start Parse Data');
          spSystemTrace!.loadDatabaseArrayBuffer(
            data,
            wasmUrl,
            (command: string, percent: number) => {
              setProgress(command);
            },
            async (res) => {
              let existFtrace = await queryExistFtrace();
              let isAllowTrace = true;
              if (DbPool.sharedBuffer) {
                let traceHeadData = new Uint8Array(DbPool.sharedBuffer!.slice(0, 10));
                let enc = new TextDecoder();
                let headerStr = enc.decode(traceHeadData);
                let rowTraceStr = Array.from(new Uint8Array(DbPool.sharedBuffer!.slice(0, 2)))
                  .map((byte) => byte.toString(16).padStart(2, '0'))
                  .join('');
                if (headerStr.indexOf('OHOSPROF') !== 0 && rowTraceStr.indexOf('49df') !== 0) {
                  isAllowTrace = false;
                }
                cutTraceFile.style.display = 'block';
                DbPool.sharedBuffer = null;
              }
              let index = 2;
              if (existFtrace.length > 0 && isAllowTrace) {
                mainMenu.menus!.splice(2, 1, {
                  collapsed: false,
                  title: 'Convert trace',
                  second: false,
                  icon: '',
                  describe: 'Convert to other formats',
                  children: pushConvertTrace(fileName),
                });
                index = 3;
              }
              mainMenu.menus!.splice(index, 1, {
                collapsed: false,
                title: 'Support',
                second: false,
                icon: '',
                describe: 'Support',
                children: [
                  {
                    title: 'Help Documents',
                    icon: 'smart-help',
                    clickHandler: function (item: MenuItem) {
                      SpStatisticsHttpUtil.addOrdinaryVisitAction({
                        event: 'help_page',
                        action: 'help_doc',
                      });
                      that.search = false;
                      that.spHelp!.dark = that.dark;
                      showContent(that.spHelp!);
                    },
                  },
                  {
                    title: 'Flags',
                    icon: 'menu',
                    clickHandler: function (item: MenuItem) {
                      SpStatisticsHttpUtil.addOrdinaryVisitAction({
                        event: 'flags',
                        action: 'flags',
                      });
                      that.search = false;
                      showContent(spFlags);
                    },
                  },
                  {
                    title: 'Keyboard shortcuts',
                    icon: 'smart-help',
                    clickHandler: function (item: MenuItem) {
                      SpStatisticsHttpUtil.addOrdinaryVisitAction({
                        event: 'Keyboard shortcuts',
                        action: 'Keyboard shortcuts',
                      });
                      that.search = false;
                      showContent(SpKeyboard);
                    },
                  },
                ],
              });
              if (res.status) {
                info('loadDatabaseArrayBuffer success');
                mainMenu.menus!.splice(1, mainMenu.menus!.length > 2 ? 1 : 0, {
                  collapsed: false,
                  title: 'Current Trace',
                  second: false,
                  icon: '',
                  describe: 'Actions on the current trace',
                  children: getTraceOptionMenus(showFileName, fileSize, fileName, false),
                });
                if (Utils.SCHED_SLICE_MAP.size > 0) {
                  importConfigDiv!.style.display = 'block';
                } else {
                  importConfigDiv!.style.display = 'none';
                }
                showContent(spSystemTrace!);
                litSearch.setPercent('', 101);
                chartFilter!.setAttribute('mode', '');
                progressEL.loading = false;
                that.freshMenuDisable(false);
              } else {
                info('loadDatabaseArrayBuffer failed');
                litSearch.setPercent(res.msg || 'This File is not supported!', -1);
                progressEL.loading = false;
                that.freshMenuDisable(false);
                mainMenu.menus!.splice(1, 1);
                mainMenu.menus = mainMenu.menus!;
              }
              spInfoAndStats.initInfoAndStatsData();
              reader = null;
            }
          );
        };
      });
    }

    const validateFileCacheLost = () => {
      caches.has(DbPool.fileCacheKey).then((exist) => {
        if (!exist) {
          //todo 缓存文件丢失，则禁止下载文件功能
          mainMenu.menus?.forEach((mg) => {
            mg.children.forEach((mi: any) => {
              if (mi.title === 'Download File') {
                mi.disabled = true;
              }
            });
          });
          cutTraceFile.style.display = 'none';
          mainMenu.menus = mainMenu.menus;
        }
      });
    };

    let openFileInit = () => {
      this.clearTraceFileCache();
      SpStatisticsHttpUtil.addOrdinaryVisitAction({
        event: 'open_trace',
        action: 'open_trace',
      });
      info('openTraceFile');
      spSystemTrace!.clearPointPair();
      spSystemTrace!.reset((command: string, percent: number) => {
        setProgress(command);
      });
      window.publish(window.SmartEvent.UI.MouseEventEnable, {
        mouseEnable: false,
      });
      window.clearTraceRowComplete();
      that.freshMenuDisable(true);
      SpSchedulingAnalysis.resetCpu();
      if (mainMenu.menus!.length > 3) {
        mainMenu.menus!.splice(1, 2);
        mainMenu.menus = mainMenu.menus!;
      } else if (mainMenu.menus!.length > 2) {
        mainMenu.menus!.splice(1, 1);
        mainMenu.menus = mainMenu.menus!;
      }
    };

    function openLongTraceFile(ev: any, isRecordTrace: boolean = false) {
      openFileInit();
      litSearch.clear();
      showContent(spSystemTrace!);
      that.search = true;
      progressEL.loading = true;
      if (!that.wasm) {
        progressEL.loading = false;
        return;
      }
      if (longTracePage) {
        longTracePage.style.display = 'none';
        litSearch.style.marginLeft = '0px';
        let pageListDiv = that.shadowRoot?.querySelector('.page-number-list') as HTMLDivElement;
        pageListDiv.innerHTML = '';
      }
      that.currentPageNum = 1;
      if (isRecordTrace) {
        let detail = (ev as any).detail;
        sendCutFileMessage(detail.timeStamp);
      } else {
        that.longTraceHeadMessageList = [];
        that.longTraceTypeMessageMap = undefined;
        that.longTraceDataList = [];
        let detail = (ev as any).detail;
        let timStamp = new Date().getTime();
        let traceTypePage: Array<number> = [];
        let allFileSize = 0;
        let readSize = 0;
        let normalTraceNames: Array<string> = [];
        let specialTraceNames: Array<string> = [];
        for (let index = 0; index < detail.length; index++) {
          let file = detail[index];
          let fileName = file.name as string;
          allFileSize += file.size;
          let specialMatch = fileName.match(/_(arkts|ebpf|hiperf)\.htrace$/);
          let normalMatch = fileName.match(/_\d{8}_\d{6}_\d+\.htrace$/);
          if (normalMatch) {
            normalTraceNames.push(fileName);
            let fileNameStr = fileName.split('.')[0];
            let pageMatch = fileNameStr.match(/\d+$/);
            if (pageMatch) {
              traceTypePage.push(Number(pageMatch[0]));
            }
          } else if (specialMatch) {
            specialTraceNames.push(fileName);
          }
        }
        if (normalTraceNames.length <= 0) {
          progressEL.loading = false;
          litSearch.setPercent('No large trace files exists in the folder!', -1);
          that.freshMenuDisable(false);
          return;
        }
        traceTypePage.sort((leftNum: number, rightNum: number) => leftNum - rightNum);
        const readFiles = async (files: FileList, traceTypePage: Array<number>, normalNames: Array<string>, specialNames: Array<string>) => {
          const promises = Array.from(files).map((file) => {
            if (normalNames.indexOf(file.name.toLowerCase()) >= 0) {
              return readFile(file, true, traceTypePage);
            } else if (specialNames.indexOf(file.name.toLowerCase()) >= 0) {
              return readFile(file, false, traceTypePage);
            } else {
              return;
            }
          });
          return Promise.all(promises);
        };
        const readFile = async (file: any, isNormalType: boolean, traceTypePage: Array<number>) => {
          info('reading long trace file ', file.name);
          return new Promise((resolve, reject) => {
            let fileName = file.name;
            let fr = new FileReader();
            let message = {
              fileType: '',
              startIndex: 0,
              endIndex: 0,
              size: 0,
            };
            info('Parse long trace using wasm mode ');
            let maxSize = 48 * 1024 * 1024;
            let fileType = 'trace';
            let pageNumber = 0;
            let firstLastIndexOf = fileName.lastIndexOf('.');
            let firstText = fileName.slice(0, firstLastIndexOf);
            let resultLastIndexOf = firstText.lastIndexOf('_');
            let searchResult = firstText.slice(resultLastIndexOf + 1, firstText.length)
            if (isNormalType) {
              pageNumber = traceTypePage.lastIndexOf(Number(searchResult));
            } else {
              fileType = searchResult;
            }
            let chunk = maxSize;
            let offset = 0;
            let sliceLen = 0;
            let index = 1;
            fr.onload = function () {
              let data = fr.result as ArrayBuffer;
              LongTraceDBUtils.getInstance()
                .indexedDBHelp.add(LongTraceDBUtils.getInstance().tableName, {
                  buf: data,
                  id: `${fileType}_${timStamp}_${pageNumber}_${index}`,
                  fileType: fileType,
                  pageNum: pageNumber,
                  startOffset: offset,
                  endOffset: offset + sliceLen,
                  index: index,
                  timStamp: timStamp,
                })
                .then(() => {
                  if (index === 1 && isNormalType) {
                    that.longTraceHeadMessageList.push({
                      pageNum: pageNumber,
                      data: data.slice(offset, 1024),
                    });
                  }
                  that.longTraceDataList.push({
                    index: index,
                    fileType: fileType,
                    pageNum: pageNumber,
                    startOffsetSize: offset,
                    endOffsetSize: offset + sliceLen,
                  });
                  offset += sliceLen;
                  if (offset < file.size) {
                    index++;
                  }
                  continue_reading();
                });
            };

            function continue_reading() {
              if (offset >= file.size) {
                message.endIndex = index;
                message.size = file.size;
                if (that.longTraceTypeMessageMap) {
                  if (that.longTraceTypeMessageMap?.has(pageNumber)) {
                    let oldTypeList = that.longTraceTypeMessageMap?.get(pageNumber);
                    oldTypeList?.push(message);
                    that.longTraceTypeMessageMap?.set(pageNumber, oldTypeList!);
                  } else {
                    that.longTraceTypeMessageMap?.set(pageNumber, [message]);
                  }
                } else {
                  that.longTraceTypeMessageMap = new Map();
                  that.longTraceTypeMessageMap.set(pageNumber, [message]);
                }
                resolve(true);
                return;
              }
              if (index === 1) {
                message.fileType = fileType;
                message.startIndex = index;
              }
              sliceLen = Math.min(file.size - offset, chunk);
              let slice = file.slice(offset, offset + sliceLen);
              readSize += slice.size;
              let percentValue = ((readSize * 100) / allFileSize).toFixed(2);
              litSearch.setPercent('Read in file: ', Number(percentValue));
              fr.readAsArrayBuffer(slice);
            }
            continue_reading();
            fr.onerror = function () {
              reject(false);
            };
            info('read over long trace file ', file.name);
          });
        };
        litSearch.setPercent('Read in file: ', 1);
        readFiles(detail, traceTypePage, normalTraceNames, specialTraceNames).then(() => {
          litSearch.setPercent('Cut in file: ', 1);
          sendCutFileMessage(timStamp);
        });
      }
    }

    function openTraceFile(ev: any, isClickHandle?: boolean) {
      that.removeAttribute('custom-color');
      customColor!.setAttribute('hidden', '');
      longTracePage.style.display = 'none';
      litSearch.style.marginLeft = '0px';
      let pageListDiv = that.shadowRoot?.querySelector('.page-number-list') as HTMLDivElement;
      pageListDiv.innerHTML = '';
      openFileInit();
      if (importConfigDiv && closeKeyPath) {
        importConfigDiv.style.display = 'none';
        closeKeyPath.style.display = 'none';
      }
      if (that.vs && isClickHandle) {
        Cmd.openFileDialog().then((res: string) => {
          if (res != '') {
            litSearch.clear();
            showContent(spSystemTrace!);
            that.search = true;
            progressEL.loading = true;
            let openResult = JSON.parse(res);
            let fileName = openResult.fileName;
            let fileSize = (openResult.fileSize / 1048576).toFixed(1);
            let showFileName =
              fileName.lastIndexOf('.') == -1 ? fileName : fileName.substring(0, fileName.lastIndexOf('.'));
            document.title = `${showFileName} (${fileSize}M)`;
            TraceRow.rangeSelectObject = undefined;
            if (that.wasm) {
              info('Parse trace using wasm mode ');
              const vsUpload = new FormData();
              vsUpload.append('convertType', 'vsUpload');
              vsUpload.append('isTransform', '');
              vsUpload.append('filePath', openResult.filePath);
              info('openResult.filePath   ', openResult.filePath);
              litSearch.setPercent('upload file ', 1);
              Cmd.uploadFile(vsUpload, (response: Response) => {
                if (response.ok) {
                  response.text().then((traceFile) => {
                    let traceFilePath =
                      `http://${window.location.host.split(':')[0]}:${window.location.port}` + traceFile;
                    fetch(traceFilePath).then((res) => {
                      res.arrayBuffer().then((arrayBuf) => {
                        handleWasmMode(new File([arrayBuf], fileName), showFileName, fileSize, fileName);
                      });
                    });
                  });
                }
              });
              return;
            }
          } else {
            return;
          }
        });
      } else {
        litSearch.clear();
        showContent(spSystemTrace!);
        that.search = true;
        progressEL.loading = true;
        let fileName = (ev as any).name;
        that.traceFileName = fileName;
        let fileSize = ((ev as any).size / 1048576).toFixed(1);
        postLog(fileName, fileSize);
        let showFileName =
          fileName.lastIndexOf('.') == -1 ? fileName : fileName.substring(0, fileName.lastIndexOf('.'));
        document.title = `${showFileName} (${fileSize}M)`;
        TraceRow.rangeSelectObject = undefined;
        if (that.sqlite) {
          info('Parse trace using sql mode');
          litSearch.setPercent('', 0);
          threadPool.init('sqlite').then((res) => {
            let reader = new FileReader();
            reader.readAsArrayBuffer(ev as any);
            reader.onloadend = function (ev) {
              SpApplication.loadingProgress = 0;
              SpApplication.progressStep = 3;
              spSystemTrace!.loadDatabaseArrayBuffer(
                this.result as ArrayBuffer,
                '',
                (command: string, percent: number) => {
                  setProgress(command);
                },
                () => {
                  mainMenu.menus!.splice(1, mainMenu.menus!.length > 2 ? 1 : 0, {
                    collapsed: false,
                    title: 'Current Trace',
                    second: false,
                    icon: '',
                    describe: 'Actions on the current trace',
                    children: getTraceOptionMenus(showFileName, fileSize, fileName, false),
                  });
                  litSearch.setPercent('', 101);
                  chartFilter!.setAttribute('mode', '');
                  progressEL.loading = false;
                  that.freshMenuDisable(false);
                }
              );
            };
          });
          return;
        }
        if (that.wasm) {
          info('Parse trace using wasm mode ');
          handleWasmMode(ev, showFileName, fileSize, fileName);
          return;
        }
      }
    }

    mainMenu.menus = [
      {
        collapsed: false,
        title: 'Navigation',
        second: false,
        icon: '',
        describe: 'Open or record a new trace',
        children: [
          {
            title: 'Open trace file',
            icon: 'folder',
            fileChoose: !that.vs,
            fileHandler: function (ev: InputEvent) {
              openTraceFile(ev.detail as any);
            },
            clickHandler: function (hand: any) {
              openTraceFile(hand, true);
            },
          },
          {
            title: 'Open long trace file',
            icon: 'folder',
            fileChoose: !that.vs,
            fileHandler: function (ev: InputEvent) {
              openLongTraceFile(ev);
            },
            clickHandler: function (hand: any) {
              openLongTraceFile(hand, true);
            },
          },
          {
            title: 'Record new trace',
            icon: 'copyhovered',
            clickHandler: function (item: MenuItem) {
              if (that.vs) {
                spRecordTrace!.vs = true;
                spRecordTrace!.startRefreshDeviceList();
              }
              spRecordTrace!.synchronizeDeviceList();
              spRecordTemplate!.record_template = false;
              spRecordTrace!.refreshConfig(true);
              showContent(spRecordTrace!);
            },
          },
          {
            title: 'Record template',
            icon: 'copyhovered',
            clickHandler: function (item: MenuItem) {
              if (that.vs) {
                spRecordTemplate!.vs = true;
                spRecordTemplate!.startRefreshDeviceList();
              }
              spRecordTemplate!.refreshHint();
              spRecordTemplate!.record_template = true;
              spRecordTemplate!.refreshConfig(false);
              spRecordTemplate!.synchronizeDeviceList();
              showContent(spRecordTemplate!);
            },
          },
        ],
      },
      {
        collapsed: false,
        title: 'Support',
        second: false,
        icon: '',
        describe: 'Support',
        children: [
          {
            title: 'Help Documents',
            icon: 'smart-help',
            clickHandler: function (item: MenuItem) {
              that.spHelp!.dark = that.dark;
              that.search = false;
              showContent(that.spHelp!);
              SpStatisticsHttpUtil.addOrdinaryVisitAction({
                event: 'help_page',
                action: 'help_doc',
              });
            },
          },
          {
            title: 'Flags',
            icon: 'menu',
            clickHandler: function (item: MenuItem) {
              that.search = false;
              showContent(spFlags);
              SpStatisticsHttpUtil.addOrdinaryVisitAction({
                event: 'flags',
                action: 'flags',
              });
            },
          },
          {
            title: 'Keyboard shortcuts',
            icon: 'smart-help',
            clickHandler: function (item: MenuItem) {
              that.search = false;
              showContent(SpKeyboard);
              SpStatisticsHttpUtil.addOrdinaryVisitAction({
                event: 'Keyboard shortcuts',
                action: 'Keyboard shortcuts',
              });
            },
          },
        ],
      },
    ];

    let body = document.querySelector('body');
    body!.addEventListener(
      'dragover',
      (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.items.length > 0 && e.dataTransfer.items[0].kind === 'file') {
          e.dataTransfer.dropEffect = 'copy';
          if (!this.rootEL!.classList.contains('filedrag')) {
            this.rootEL!.classList.add('filedrag');
          }
        }
      },
      false
    );
    body!.addEventListener(
      'dragleave',
      (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (this.rootEL!.classList.contains('filedrag')) {
          this.rootEL!.classList.remove('filedrag');
        }
      },
      false
    );
    body!.addEventListener(
      'drop',
      (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.rootEL!.classList.contains('filedrag')) {
          this.rootEL!.classList.remove('filedrag');
        }
        if (e.dataTransfer.items !== undefined && e.dataTransfer.items.length > 0) {
          let item = e.dataTransfer.items[0];
          if (item.webkitGetAsEntry()?.isFile) {
            openTraceFile(item.getAsFile());
          } else if (item.webkitGetAsEntry()?.isDirectory) {
            litSearch.setPercent('This File is not supported!', -1);
            progressEL.loading = false;
            that.freshMenuDisable(false);
            mainMenu.menus!.splice(1, 1);
            mainMenu.menus = mainMenu.menus!;
            spSystemTrace!.reset(null);
          }
        }
      },
      false
    );
    document.addEventListener('keydown', (event) => {
      const e = event || window.event;
      const ctrlKey = e.ctrlKey || e.metaKey;
      if (ctrlKey && (this.keyCodeMap as any)[e.keyCode]) {
        e.preventDefault();
      } else if (e.detail) {
        // Firefox
        event.returnValue = false;
      }
    });
    document.body.addEventListener(
      'wheel',
      (e) => {
        if (e.ctrlKey) {
          if (e.deltaY < 0) {
            e.preventDefault();
            return false;
          }
          if (e.deltaY > 0) {
            e.preventDefault();
            return false;
          }
        }
      },
      { passive: false }
    );

    const openMenu = (open: boolean) => {
      if (mainMenu) {
        mainMenu.style.width = open ? `248px` : '0px';
        mainMenu.style.zIndex = open ? '2000' : '0';
      }
      if (sidebarButton) {
        sidebarButton.style.width = open ? `0px` : '48px';
        importConfigDiv!.style.left = open ? '5px' : '45px';
        closeKeyPath!.style.left = open ? '25px' : '65px';
      }
    };
    let urlParams = new URL(window.location.href).searchParams;
    if (urlParams && urlParams.get('trace') && urlParams.get('link')) {
      openFileInit();
      openMenu(false);
      litSearch.clear();
      showContent(spSystemTrace!);
      that.search = true;
      progressEL.loading = true;
      let downloadLineFile = false;
      if (urlParams.get('local')) {
        downloadLineFile = false;
      } else {
        downloadLineFile = true;
      }
      setProgress(downloadLineFile ? 'download trace file' : 'open trace file');
      this.downloadOnLineFile(
        urlParams.get('trace') as string,
        downloadLineFile,
        (arrayBuf, fileName, showFileName, fileSize) => {
          handleWasmMode(new File([arrayBuf], fileName), showFileName, fileSize, fileName);
        },
        (localPath) => {
          let path = urlParams.get('trace') as string;
          let fileName: string = '';
          let showFileName: string = '';
          if (urlParams.get('local')) {
            openMenu(true);
            fileName = urlParams.get('traceName') as string;
          } else {
            fileName = path.split('/').reverse()[0];
          }
          that.traceFileName = fileName;
          showFileName = fileName.lastIndexOf('.') == -1 ? fileName : fileName.substring(0, fileName.lastIndexOf('.'));
          TraceRow.rangeSelectObject = undefined;
          let localUrl = downloadLineFile ? `${window.location.origin}${localPath}` : urlParams.get('trace')!;
          fetch(localUrl)
            .then((res) => {
              res.arrayBuffer().then((arrayBuf) => {
                if (urlParams.get('local')) {
                  URL.revokeObjectURL(localUrl);
                }
                let fileSize = (arrayBuf.byteLength / 1048576).toFixed(1);
                postLog(fileName, fileSize);
                document.title = `${showFileName} (${fileSize}M)`;
                info('Parse trace using wasm mode ');
                handleWasmMode(new File([arrayBuf], fileName), showFileName, fileSize, fileName);
              });
            })
            .catch((e) => {
              if (!downloadLineFile) {
                const firstQuestionMarkIndex = window.location.href.indexOf('?');
                location.replace(window.location.href.substring(0, firstQuestionMarkIndex));
              }
            });
        }
      );
    } else {
      openMenu(true);
    }
  }

  private refreshPageList(
    pageListDiv: HTMLDivElement,
    previewButton: HTMLDivElement,
    nextButton: HTMLDivElement,
    pageInput: HTMLInputElement,
    currentPageNum: number,
    maxPageNumber: number
  ): void {
    if (pageInput) {
      pageInput.textContent = currentPageNum.toString();
      pageInput.value = currentPageNum.toString();
    }
    let pageText: string[] = [];
    if (maxPageNumber > 7) {
      switch (currentPageNum) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
          pageText = ['1', '2', '3', '4', '5', '...', maxPageNumber.toString()];
          break;
        case maxPageNumber:
        case maxPageNumber - 1:
        case maxPageNumber - 2:
        case maxPageNumber - 3:
        case maxPageNumber - 4:
          pageText = [
            '1',
            '...',
            (maxPageNumber - 4).toString(),
            (maxPageNumber - 3).toString(),
            (maxPageNumber - 2).toString(),
            (maxPageNumber - 1).toString(),
            maxPageNumber.toString(),
          ];
          break;
        default:
          nextButton.style.pointerEvents = 'auto';
          previewButton!.style.pointerEvents = 'auto';
          nextButton.style.opacity = '1';
          previewButton!.style.opacity = '1';
          pageText = [
            '1',
            '...',
            (currentPageNum - 1).toString(),
            currentPageNum.toString(),
            (currentPageNum + 1).toString(),
            '...',
            maxPageNumber.toString(),
          ];
          break;
      }
    } else {
      pageText = [];
      for (let index = 0; index < maxPageNumber; index++) {
        pageText.push((index + 1).toString());
      }
    }
    let pageNodeList = pageListDiv.querySelectorAll<HTMLDivElement>('div');
    if (pageNodeList.length > 0) {
      pageNodeList.forEach((page, index) => {
        page.textContent = pageText[index].toString();
        page.title = pageText[index];
        if (currentPageNum.toString() === pageText[index]) {
          page.setAttribute('selected', '');
        } else {
          if (page.hasAttribute('selected')) {
            page.removeAttribute('selected');
          }
        }
      });
    } else {
      pageListDiv.innerHTML = '';
      pageText.forEach((page) => {
        let element = document.createElement('div');
        element.className = 'page-number pagination';
        element.textContent = page.toString();
        element.title = page.toString();
        if (currentPageNum.toString() === page.toString()) {
          element.setAttribute('selected', '');
        }
        pageListDiv.appendChild(element);
      });
    }
    nextButton.style.pointerEvents = 'auto';
    nextButton.style.opacity = '1';
    previewButton.style.pointerEvents = 'auto';
    previewButton.style.opacity = '1';
    if (currentPageNum === 1) {
      previewButton.style.pointerEvents = 'none';
      previewButton.style.opacity = '0.7';
    } else if (currentPageNum === maxPageNumber) {
      nextButton.style.pointerEvents = 'none';
      nextButton.style.opacity = '0.7';
    }
  }

  /**
   * 修改颜色或者主题，重新绘制侧边栏和泳道图
   * @param theme 当前主题（深色和浅色）
   * @param colorsArray 预览的情况下传入
   */
  changeTheme(theme: Theme, colorsArray?: Array<string>) {
    let systemTrace = this.shadowRoot!.querySelector<SpSystemTrace>('#sp-system-trace');
    let menu: HTMLDivElement | undefined | null = this.shadowRoot?.querySelector('#main-menu');
    let menuGroup = menu!.shadowRoot?.querySelectorAll<LitMainMenuGroup>('lit-main-menu-group');
    let menuItem = menu!.shadowRoot?.querySelectorAll<LitMainMenuItem>('lit-main-menu-item');
    let customColor = this.shadowRoot?.querySelector('.custom-color') as CustomThemeColor;
    if (!colorsArray) {
      customColor.setRadioChecked(theme);
    }
    if (theme === Theme.DARK) {
      menu!.style.backgroundColor = '#262f3c';
      menu!.style.transition = '1s';
      menuGroup!.forEach((item) => {
        let groupName = item!.shadowRoot!.querySelector('.group-name') as LitMainMenuGroup;
        let groupDescribe = item!.shadowRoot!.querySelector('.group-describe') as LitMainMenuGroup;
        groupName.style.color = 'white';
        groupDescribe.style.color = 'white';
      });
      menuItem!.forEach((item) => {
        item.style.color = 'white';
      });
      if (
        !colorsArray &&
        window.localStorage.getItem('DarkThemeColors') &&
        ColorUtils.FUNC_COLOR_B !== JSON.parse(window.localStorage.getItem('DarkThemeColors')!)
      ) {
        ColorUtils.MD_PALETTE = JSON.parse(window.localStorage.getItem('DarkThemeColors')!);
        ColorUtils.FUNC_COLOR = JSON.parse(window.localStorage.getItem('DarkThemeColors')!);
      } else if (colorsArray) {
        ColorUtils.MD_PALETTE = colorsArray;
        ColorUtils.FUNC_COLOR = colorsArray;
      } else {
        ColorUtils.MD_PALETTE = ColorUtils.FUNC_COLOR_B;
        ColorUtils.FUNC_COLOR = ColorUtils.FUNC_COLOR_B;
      }
    } else {
      menu!.style.backgroundColor = 'white';
      menu!.style.transition = '1s';
      menuGroup!.forEach((item) => {
        let groupName = item!.shadowRoot!.querySelector('.group-name') as LitMainMenuGroup;
        let groupDescribe = item!.shadowRoot!.querySelector('.group-describe') as LitMainMenuGroup;
        groupName.style.color = 'black';
        groupDescribe.style.color = '#92959b';
      });
      menuItem!.forEach((item) => {
        item.style.color = 'black';
      });
      if (
        !colorsArray &&
        window.localStorage.getItem('LightThemeColors') &&
        ColorUtils.FUNC_COLOR_A !== JSON.parse(window.localStorage.getItem('LightThemeColors')!)
      ) {
        ColorUtils.MD_PALETTE = JSON.parse(window.localStorage.getItem('LightThemeColors')!);
        ColorUtils.FUNC_COLOR = JSON.parse(window.localStorage.getItem('LightThemeColors')!);
      } else if (colorsArray) {
        ColorUtils.MD_PALETTE = colorsArray;
        ColorUtils.FUNC_COLOR = colorsArray;
      } else {
        ColorUtils.MD_PALETTE = ColorUtils.FUNC_COLOR_A;
        ColorUtils.FUNC_COLOR = ColorUtils.FUNC_COLOR_A;
      }
    }
    systemTrace!.timerShaftEL!.rangeRuler!.draw();
    if (this.colorTransiton) {
      clearTimeout(this.colorTransiton);
    }
    this.colorTransiton = setTimeout(() => {
      menu!.style.transition = '0s';
    }, 1000);
  }

  private downloadOnLineFile(
    url: string,
    download: boolean,
    openUrl: (buffer: ArrayBuffer, fileName: string, showFileName: string, fileSize: string) => void,
    openFileHandler: (path: string) => void
  ) {
    if (download) {
      fetch(url)
        .then((res) => {
          res.arrayBuffer().then((arrayBuf) => {
            let fileSize = (arrayBuf.byteLength / 1048576).toFixed(1);
            let fileName = url.split('/').reverse()[0];
            document.title = `${fileName} (${fileSize}M)`;
            info('Parse trace using wasm mode ');
            let showFileName =
              fileName.lastIndexOf('.') == -1 ? fileName : fileName.substring(0, fileName.lastIndexOf('.'));
            openUrl(arrayBuf, fileName, showFileName, fileSize);
          });
        })
        .catch((e) => {
          let api = `${window.location.origin}/application/download-file`;
          fetch(api, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              url: url,
            }),
          })
            .then((response) => response.json())
            .then((res) => {
              if (res.code === 0 && res.success) {
                let resultUrl = res.data.url;
                if (resultUrl) {
                  openFileHandler(resultUrl.toString().replace(/\\/g, '/'));
                }
              }
            });
        });
    } else {
      openFileHandler(url);
    }
  }

  private croppingFile(progressEL: LitProgressBar, litSearch: LitSearch) {
    let cutLeftNs = TraceRow.rangeSelectObject?.startNS || 0;
    let cutRightNs = TraceRow.rangeSelectObject?.endNS || 0;
    if (cutRightNs === cutLeftNs) {
      return;
    }
    let recordStartNS = (window as any).recordStartNS;
    let cutLeftTs = recordStartNS + cutLeftNs;
    let cutRightTs = recordStartNS + cutRightNs;
    let minCutDur = 1_000_000;
    if (cutRightTs - cutLeftTs < minCutDur) {
      let unitTs = (cutRightTs - cutLeftTs) / 2;
      let midTs = cutLeftTs + unitTs;
      cutLeftTs = midTs - minCutDur / 2;
      cutRightTs = midTs + minCutDur / 2;
    }
    progressEL.loading = true;
    threadPool.cutFile(cutLeftTs, cutRightTs, (status: boolean, msg: string, cutBuffer?: ArrayBuffer) => {
      progressEL.loading = false;
      if (status) {
        FlagsConfig.updateFlagsConfig('FfrtConvert', 'Disabled');
        let traceFileName = this.traceFileName as string;
        let cutIndex = traceFileName.indexOf('_cut_');
        let fileType = traceFileName.substring(traceFileName.lastIndexOf('.'));
        let traceName = document.title.replace(/\s*\([^)]*\)/g, '').trim();
        if (cutIndex != -1) {
          traceName = traceName.substring(0, cutIndex);
        }
        let blobUrl = URL.createObjectURL(new Blob([cutBuffer!]));
        window.open(
          `index.html?link=true&local=true&traceName=${traceName}_cut_${cutLeftTs}${fileType}&trace=${encodeURIComponent(
            blobUrl
          )}`
        );
      } else {
        litSearch.setPercent(msg, -1);
        window.setTimeout(() => {
          litSearch.setPercent(msg, 101);
        }, 1000);
      }
    });
  }

  private downloadDB(mainMenu: LitMainMenu, fileDbName: string) {
    let fileName = fileDbName?.substring(0, fileDbName?.lastIndexOf('.')) + '.db';
    threadPool.submit(
      'download-db',
      '',
      {},
      (reqBufferDB: any) => {
        let a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([reqBufferDB]));
        a.download = fileName;
        a.click();
        this.itemIconLoading(mainMenu, 'Current Trace', 'Download Database', true);
        let that = this;
        let timer = setInterval(function () {
          that.itemIconLoading(mainMenu, 'Current Trace', 'Download Database', false);
          clearInterval(timer);
        }, 4000);
      },
      'download-db'
    );
  }

  readTraceFileBuffer(): Promise<ArrayBuffer | undefined> {
    return new Promise((resolve) => {
      caches.match(DbPool.fileCacheKey).then((res) => {
        if (res) {
          res.arrayBuffer().then((buffer) => {
            resolve(buffer);
          });
        } else {
          resolve(undefined);
        }
      });
    });
  }

  clearTraceFileCache(): void {
    caches.keys().then((keys) => {
      keys.forEach((key) => {
        if (key === DbPool.fileCacheKey) {
          caches.delete(key).then();
        } else if (key.includes('/') && key.includes('-')) {
          let splits = key.split('/');
          let keyStr = splits[splits.length - 1];
          let time = keyStr.split('-')[0];
          let fileDate = new Date(parseInt(time));
          if (fileDate.toLocaleDateString() !== new Date().toLocaleDateString()) {
            //如果不是当天的缓存则删去缓存文件
            caches.delete(key).then();
          }
        } else {
          caches.delete(key).then();
        }
      });
    });
  }

  private async download(mainMenu: LitMainMenu, fileName: string, isServer: boolean, dbName?: string) {
    let a = document.createElement('a');
    if (isServer) {
      if (dbName != '') {
        let file = dbName?.substring(0, dbName?.lastIndexOf('.')) + fileName.substring(fileName.lastIndexOf('.'));
        a.href = `https://${window.location.host.split(':')[0]}:${window.location.port}` + file;
      } else {
        return;
      }
    } else {
      let buffer = await this.readTraceFileBuffer();
      if (buffer) {
        a.href = URL.createObjectURL(new Blob([buffer]));
      }
    }
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(a.href);
    let that = this;
    this.itemIconLoading(mainMenu, 'Current Trace', 'Download File', true);
    let timer = setInterval(function () {
      that.itemIconLoading(mainMenu, 'Current Trace', 'Download File', false);
      clearInterval(timer);
    }, 4000);
  }

  private itemIconLoading(mainMenu: LitMainMenu, groupName: string, itemName: string, start: boolean) {
    let currentTraceGroup = mainMenu.shadowRoot?.querySelector<LitMainMenuGroup>(
      `lit-main-menu-group[title='${groupName}']`
    );
    let downloadItem = currentTraceGroup!.querySelector<LitMainMenuItem>(`lit-main-menu-item[title='${itemName}']`);
    let downloadIcon = downloadItem!.shadowRoot?.querySelector('.icon') as LitIcon;
    if (start) {
      downloadItem!.setAttribute('icon', 'convert-loading');
      downloadIcon.setAttribute('spin', '');
    } else {
      downloadItem!.setAttribute('icon', 'download');
      downloadIcon.removeAttribute('spin');
    }
  }

  freshMenuDisable(disable: boolean) {
    let mainMenu = this.shadowRoot?.querySelector('#main-menu') as LitMainMenu;
    // @ts-ignore
    mainMenu.menus[0].children[0].disabled = disable;
    // @ts-ignore
    mainMenu.menus[0].children[1].disabled = disable;
    if (mainMenu.menus!.length > 2) {
      // @ts-ignore
      mainMenu.menus[1].children.map((it) => (it.disabled = disable));
    }
    mainMenu.menus = mainMenu.menus;
    let litIcon = this.shadowRoot?.querySelector('.filter-config') as LitIcon;
    if (disable) {
      litIcon.style.visibility = 'hidden';
    } else {
      litIcon.style.visibility = 'visible';
    }
  }
}
