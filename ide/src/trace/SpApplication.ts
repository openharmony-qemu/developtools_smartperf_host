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
import {
  applicationHtml,
  clearTraceFileCache,
  findFreeSizeAlgorithm, getCurrentDataTime,
  indexedDataToBufferData,
  postLog,
  readTraceFileBuffer,
} from './SpApplicationPublicFunc';
import { queryExistFtrace } from './database/sql/SqlLite.sql';

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
  private spWelcomePage: SpWelcomePage | undefined | null;
  private spMetrics: SpMetrics | undefined | null;
  private spQuerySQL: SpQuerySQL | undefined | null;
  private spInfoAndStats: SpInfoAndStats | undefined | null;
  private spSystemTrace: SpSystemTrace | undefined | null;
  private spHelp: SpHelp | undefined | null;
  private spKeyboard: SpKeyboard | undefined | null;
  private spFlags: SpFlags | undefined | null;
  private spRecordTrace: SpRecordTrace | undefined | null;
  private spRecordTemplate: SpRecordTrace | undefined | null;
  private spSchedulingAnalysis: SpSchedulingAnalysis | undefined | null;
  private mainMenu: LitMainMenu | undefined | null;
  private menu: HTMLDivElement | undefined | null;
  private progressEL: LitProgressBar | undefined | null;
  private litSearch: LitSearch | undefined | null;
  private litRecordSearch: LitSearch | undefined | null;
  private sidebarButton: HTMLDivElement | undefined | null;
  private chartFilter: TraceRowConfig | undefined | null;
  private cutTraceFile: HTMLImageElement | undefined | null;
  private longTracePage: HTMLDivElement | undefined | null;
  private customColor: CustomThemeColor | undefined | null;
  private filterConfig: LitIcon | undefined | null;
  private configClose: LitIcon | undefined | null;
  // 关键路径标识
  private importConfigDiv: HTMLInputElement | undefined | null;
  private closeKeyPath: HTMLDivElement | undefined | null;
  private importFileBt: HTMLInputElement | undefined | null;
  private childComponent: Array<any> | undefined | null;
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
  private currentDataTime: string[] = [];

  static get observedAttributes(): Array<string> {
    return ['server', 'sqlite', 'wasm', 'dark', 'vs', 'query-sql', 'subsection'];
  }

  get dark(): boolean {
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

  addSkinListener(handler: Function): void {
    this.skinChangeArray.push(handler);
  }

  removeSkinListener(handler: Function): void {
    this.skinChangeArray.splice(this.skinChangeArray.indexOf(handler), 1);
  }

  initHtml(): string {
    return applicationHtml;
  }

  initPlugin(): void {
    SpStatisticsHttpUtil.initStatisticsServerConfig();
    SpStatisticsHttpUtil.addUserVisitAction('visit');
    LongTraceDBUtils.getInstance().createDBAndTable().then();
  }

  initElements(): void {
    this.initPlugin();
    this.querySql = true;
    this.rootEL = this.shadowRoot!.querySelector<HTMLDivElement>('.root');
    this.spWelcomePage = this.shadowRoot!.querySelector('#sp-welcome') as SpWelcomePage;
    this.spMetrics = this.shadowRoot!.querySelector<SpMetrics>('#sp-metrics') as SpMetrics; // new SpMetrics();
    this.spQuerySQL = this.shadowRoot!.querySelector<SpQuerySQL>('#sp-query-sql') as SpQuerySQL; // new SpQuerySQL();
    this.spInfoAndStats = this.shadowRoot!.querySelector<SpInfoAndStats>('#sp-info-and-stats'); // new SpInfoAndStats();
    this.spSystemTrace = this.shadowRoot!.querySelector<SpSystemTrace>('#sp-system-trace');
    this.spHelp = this.shadowRoot!.querySelector<SpHelp>('#sp-help');
    this.spKeyboard = this.shadowRoot!.querySelector<SpKeyboard>('#sp-keyboard') as SpKeyboard;
    this.spFlags = this.shadowRoot!.querySelector<SpFlags>('#sp-flags') as SpFlags;
    this.spRecordTrace = this.shadowRoot!.querySelector<SpRecordTrace>('#sp-record-trace');
    this.spRecordTemplate = this.shadowRoot!.querySelector<SpRecordTrace>('#sp-record-template');
    this.spSchedulingAnalysis = this.shadowRoot!.querySelector<SpSchedulingAnalysis>('#sp-scheduling-analysis');
    this.mainMenu = this.shadowRoot?.querySelector('#main-menu') as LitMainMenu;
    this.menu = this.mainMenu.shadowRoot?.querySelector('.menu-button') as HTMLDivElement;
    this.progressEL = this.shadowRoot?.querySelector('.progress') as LitProgressBar;
    this.litSearch = this.shadowRoot?.querySelector('#lit-search') as LitSearch;
    this.litRecordSearch = this.shadowRoot?.querySelector('#lit-record-search') as LitSearch;
    this.sidebarButton = this.shadowRoot?.querySelector('.sidebar-button');
    this.chartFilter = this.shadowRoot?.querySelector('.chart-filter') as TraceRowConfig;
    this.cutTraceFile = this.shadowRoot?.querySelector('.cut-trace-file') as HTMLImageElement;
    this.longTracePage = this.shadowRoot!.querySelector('.long_trace_page') as HTMLDivElement;
    this.customColor = this.shadowRoot?.querySelector('.custom-color') as CustomThemeColor;
    this.filterConfig = this.shadowRoot?.querySelector('.filter-config') as LitIcon;
    this.configClose = this.shadowRoot
      ?.querySelector<HTMLElement>('.chart-filter')!
      .shadowRoot?.querySelector<LitIcon>('.config-close');
    // 关键路径标识
    this.importConfigDiv = this.shadowRoot?.querySelector<HTMLInputElement>('#import-key-path');
    this.closeKeyPath = this.shadowRoot?.querySelector<HTMLDivElement>('#close-key-path');
    this.importFileBt = this.shadowRoot?.querySelector<HTMLInputElement>('#import-config');
    this.initElementsAttr();
    this.initEvents();
    this.initCustomEvents();
    this.initCustomColorHandler();
    this.initImportConfigEvent();
    this.initSlideMenuEvents();
    this.initMenus();
    this.initGlobalEvents();
    this.initDocumentListener();
    let urlParams = new URL(window.location.href).searchParams;
    if (urlParams && urlParams.get('trace') && urlParams.get('link')) {
      this.openLineFileHandler(urlParams);
    } else {
      this.openMenu(true);
    }
  }

  private initElementsAttr(): void {
    this.mainMenu!.setAttribute('main_menu', '1');
    this.chartFilter!.setAttribute('mode', '');
    this.chartFilter!.setAttribute('hidden', '');
    this.customColor!.setAttribute('mode', '');
    this.customColor!.setAttribute('hidden', '');
    this.childComponent = [
      this.spSystemTrace,
      this.spRecordTrace,
      this.spWelcomePage,
      this.spMetrics,
      this.spQuerySQL,
      this.spSchedulingAnalysis,
      this.spInfoAndStats,
      this.spHelp,
      this.spRecordTemplate,
      this.spFlags,
      this.spKeyboard,
    ];
  }

  private openLongTraceFile(ev: any, isRecordTrace: boolean = false) {
    this.openFileInit();
    let detail = (ev as any).detail;
    let initRes = this.longTraceFileInit(isRecordTrace, detail);
    if (!isRecordTrace && initRes) {
      let that = this;
      let readSize = 0;
      let timStamp = new Date().getTime();
      const { traceTypePage, allFileSize, normalTraceNames, specialTraceNames } = initRes;
      if (normalTraceNames.length <= 0) {
        return;
      }
      const readFiles = async (
        files: FileList,
        traceTypePage: Array<number>,
        normalNames: Array<string>,
        specialNames: Array<string>
      ): Promise<any> => {
        const promises = Array.from(files).map((file) => {
          if (normalNames.indexOf(file.name.toLowerCase()) >= 0) {
            return that.longTraceFileRead(file, true, traceTypePage, readSize, timStamp, allFileSize);
          } else if (specialNames.indexOf(file.name.toLowerCase()) >= 0) {
            return that.longTraceFileRead(file, false, traceTypePage, readSize, timStamp, allFileSize);
          } else {
            return;
          }
        });
        return Promise.all(promises);
      };
      this.litSearch!.setPercent('Read in file: ', 1);
      readFiles(detail, traceTypePage, normalTraceNames, specialTraceNames).then(() => {
        this.litSearch!.setPercent('Cut in file: ', 1);
        this.sendCutFileMessage(timStamp);
      });
    }
  }

  private longTraceFileRead = async (
    file: any,
    isNormalType: boolean,
    traceTypePage: Array<number>,
    readSize: number,
    timStamp: number,
    allFileSize: number
  ): Promise<boolean> => {
    info('reading long trace file ', file.name);
    let that = this;
    return new Promise((resolve, reject) => {
      let fr = new FileReader();
      let message = { fileType: '', startIndex: 0, endIndex: 0, size: 0 };
      info('Parse long trace using wasm mode ');
      const { fileType, pageNumber } = this.getFileTypeAndPages(file.name, isNormalType, traceTypePage);
      let chunk = 48 * 1024 * 1024;
      let offset = 0;
      let sliceLen = 0;
      let index = 1;
      fr.onload = function (): void {
        let data = fr.result as ArrayBuffer;
        LongTraceDBUtils.getInstance()
          .addLongTableData(data, fileType, timStamp, pageNumber, index, offset, sliceLen)
          .then(() => {
            that.longTraceFileReadMessagePush(index, isNormalType, pageNumber, offset, sliceLen, fileType, data);
            offset += sliceLen;
            if (offset < file.size) {
              index++;
            }
            continueReading();
          });
      };
      function continueReading(): void {
        if (offset >= file.size) {
          message.endIndex = index;
          message.size = file.size;
          that.longTraceFileReadMessageHandler(pageNumber, message);
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
        that.litSearch!.setPercent('Read in file: ', Number(percentValue));
        fr.readAsArrayBuffer(slice);
      }
      continueReading();
      fr.onerror = (): void => reject(false);
      info('read over long trace file ', file.name);
    });
  };

  getFileTypeAndPages(fileName: string, isNormalType: boolean, traceTypePage: Array<number>): any {
    let fileType = 'trace';
    let pageNumber = 0;
    let firstLastIndexOf = fileName.lastIndexOf('.');
    let firstText = fileName.slice(0, firstLastIndexOf);
    let resultLastIndexOf = firstText.lastIndexOf('_');
    let searchResult = firstText.slice(resultLastIndexOf + 1, firstText.length);
    if (isNormalType) {
      pageNumber = traceTypePage.lastIndexOf(Number(searchResult));
    } else {
      fileType = searchResult;
    }
    return { fileType, pageNumber };
  }

  private longTraceFileInit(isRecordTrace: boolean, detail: any): any {
    if (!this.wasm) {
      this.progressEL!.loading = false;
      return;
    }
    if (this.longTracePage) {
      this.longTracePage.style.display = 'none';
      this.litSearch!.style.marginLeft = '0px';
      this.shadowRoot!.querySelector('.page-number-list')!.innerHTML = '';
    }
    this.currentPageNum = 1;
    if (isRecordTrace) {
      this.sendCutFileMessage(detail.timeStamp);
      return undefined;
    } else {
      this.longTraceHeadMessageList = [];
      this.longTraceTypeMessageMap = undefined;
      this.longTraceDataList = [];
      let traceTypePage: Array<number> = [];
      let allFileSize = 0;
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
        this.traceFileLoadFailedHandler('No large trace files exists in the folder!');
      }
      traceTypePage.sort((leftNum: number, rightNum: number) => leftNum - rightNum);
      return { traceTypePage, allFileSize, normalTraceNames, specialTraceNames };
    }
  }

  longTraceFileReadMessagePush(
    index: number,
    isNormalType: boolean,
    pageNumber: number,
    offset: number,
    sliceLen: number,
    fileType: string,
    data: ArrayBuffer
  ) {
    if (index === 1 && isNormalType) {
      this.longTraceHeadMessageList.push({
        pageNum: pageNumber,
        data: data.slice(offset, 1024),
      });
    }
    this.longTraceDataList.push({
      index: index,
      fileType: fileType,
      pageNum: pageNumber,
      startOffsetSize: offset,
      endOffsetSize: offset + sliceLen,
    });
  }

  longTraceFileReadMessageHandler(pageNumber: number, message: any): void {
    if (this.longTraceTypeMessageMap) {
      if (this.longTraceTypeMessageMap?.has(pageNumber)) {
        let oldTypeList = this.longTraceTypeMessageMap?.get(pageNumber);
        oldTypeList?.push(message);
        this.longTraceTypeMessageMap?.set(pageNumber, oldTypeList!);
      } else {
        this.longTraceTypeMessageMap?.set(pageNumber, [message]);
      }
    } else {
      this.longTraceTypeMessageMap = new Map();
      this.longTraceTypeMessageMap.set(pageNumber, [message]);
    }
  }

  private openTraceFile(ev: any, isClickHandle?: boolean) {
    this.removeAttribute('custom-color');
    this.customColor!.setAttribute('hidden', '');
    this.longTracePage!.style.display = 'none';
    this.litSearch!.style.marginLeft = '0px';
    let pageListDiv = this.shadowRoot?.querySelector('.page-number-list') as HTMLDivElement;
    pageListDiv.innerHTML = '';
    this.openFileInit();
    if (this.importConfigDiv && this.closeKeyPath) {
      this.importConfigDiv.style.display = 'none';
      this.closeKeyPath.style.display = 'none';
    }
    let fileName = (ev as any).name;
    this.traceFileName = fileName;
    let showFileName = fileName.lastIndexOf('.') === -1 ? fileName : fileName.substring(0, fileName.lastIndexOf('.'));
    TraceRow.rangeSelectObject = undefined;
    if (this.sqlite) {
      info('Parse trace using sql mode');
      this.handleSqliteMode(ev, showFileName, (ev as any).size, fileName);
    }
    if (this.wasm) {
      info('Parse trace using wasm mode ');
      this.handleWasmMode(ev, showFileName, (ev as any).size, fileName);
    }
  }

  private openLineFileHandler(urlParams: URLSearchParams): void {
    this.openFileInit();
    this.openMenu(false);
    let downloadLineFile = urlParams.get('local') ? false : true;
    this.setProgress(downloadLineFile ? 'download trace file' : 'open trace file');
    this.downloadOnLineFile(
      urlParams.get('trace') as string,
      downloadLineFile,
      (arrayBuf, fileName, showFileName, fileSize) => {
        this.handleWasmMode(new File([arrayBuf], fileName), showFileName, fileSize, fileName);
      },
      (localPath) => {
        let path = urlParams.get('trace') as string;
        let fileName: string = '';
        let showFileName: string = '';
        if (urlParams.get('local')) {
          this.openMenu(true);
          fileName = urlParams.get('traceName') as string;
        } else {
          fileName = path.split('/').reverse()[0];
        }
        this.traceFileName = fileName;
        showFileName = fileName.lastIndexOf('.') === -1 ? fileName : fileName.substring(0, fileName.lastIndexOf('.'));
        TraceRow.rangeSelectObject = undefined;
        let localUrl = downloadLineFile ? `${window.location.origin}${localPath}` : urlParams.get('trace')!;
        fetch(localUrl)
          .then((res) => {
            res.arrayBuffer().then((arrayBuf) => {
              if (urlParams.get('local')) {
                URL.revokeObjectURL(localUrl);
              }
              this.handleWasmMode(new File([arrayBuf], fileName), showFileName, arrayBuf.byteLength, fileName);
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
  }

  private openMenu(open: boolean): void {
    if (this.mainMenu) {
      this.mainMenu.style.width = open ? '248px' : '0px';
      this.mainMenu.style.zIndex = open ? '2000' : '0';
    }
    if (this.sidebarButton) {
      this.sidebarButton.style.width = open ? '0px' : '48px';
      this.importConfigDiv!.style.left = open ? '5px' : '45px';
      this.closeKeyPath!.style.left = open ? '25px' : '65px';
    }
  }

  private initGlobalDropEvents(): void {
    let body = document.querySelector('body');
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
            this.openTraceFile(item.getAsFile());
          } else if (item.webkitGetAsEntry()?.isDirectory) {
            this.litSearch!.setPercent('This File is not supported!', -1);
            this.progressEL!.loading = false;
            this.freshMenuDisable(false);
            this.mainMenu!.menus!.splice(1, 1);
            this.mainMenu!.menus = this.mainMenu!.menus!;
            this.spSystemTrace!.reset(null);
          }
        }
      },
      false
    );
  }
  private initGlobalEvents(): void {
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
    this.initGlobalDropEvents();
  }

  private initDocumentListener(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.validateFileCacheLost();
        if (window.localStorage.getItem('Theme') === 'dark') {
          this.changeTheme(Theme.DARK);
        } else {
          this.changeTheme(Theme.LIGHT);
        }
      }
    });
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
  }

  private initMenus(): void {
    this.mainMenu!.menus = [
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
            fileChoose: true,
            fileHandler: (ev: InputEvent): void => {
              this.openTraceFile(ev.detail as any);
            },
            clickHandler: (hand: any) => {
              this.openTraceFile(hand, true);
            },
          },
          {
            title: 'Open long trace file',
            icon: 'folder',
            fileChoose: true,
            fileHandler: (ev: InputEvent): void => {
              this.openLongTraceFile(ev);
            },
            clickHandler: (hand: any): void => {
              this.openLongTraceFile(hand, true);
            },
          },
          {
            title: 'Record new trace',
            icon: 'copyhovered',
            clickHandler: (item: MenuItem): void => {
              this.spRecordTrace!.synchronizeDeviceList();
              this.spRecordTemplate!.record_template = false;
              this.spRecordTrace!.refreshConfig(true);
              this.showContent(this.spRecordTrace!);
            },
          },
          {
            title: 'Record template',
            icon: 'copyhovered',
            clickHandler: (item: MenuItem): void => {
              this.spRecordTemplate!.refreshHint();
              this.spRecordTemplate!.record_template = true;
              this.spRecordTemplate!.refreshConfig(false);
              this.spRecordTemplate!.synchronizeDeviceList();
              this.showContent(this.spRecordTemplate!);
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
            clickHandler: (item: MenuItem): void => {
              this.spHelp!.dark = this.dark;
              this.search = false;
              this.showContent(this.spHelp!);
              SpStatisticsHttpUtil.addOrdinaryVisitAction({
                event: 'help_page',
                action: 'help_doc',
              });
            },
          },
          {
            title: 'Flags',
            icon: 'menu',
            clickHandler: (item: MenuItem): void => {
              this.search = false;
              this.showContent(this.spFlags!);
              SpStatisticsHttpUtil.addOrdinaryVisitAction({
                event: 'flags',
                action: 'flags',
              });
            },
          },
          {
            title: 'Keyboard shortcuts',
            icon: 'smart-help',
            clickHandler: (item: MenuItem): void => {
              this.search = false;
              this.showContent(this.spKeyboard!);
              SpStatisticsHttpUtil.addOrdinaryVisitAction({
                event: 'Keyboard shortcuts',
                action: 'Keyboard shortcuts',
              });
            },
          },
        ],
      },
    ];
  }

  private handleSqliteMode(ev: any, showFileName: string, fileSize: number, fileName: string): void {
    let that = this;
    let fileSizeStr = (fileSize / 1048576).toFixed(1);
    postLog(fileName, fileSizeStr);
    document.title = `${showFileName} (${fileSizeStr}M)`;
    this.litSearch!.setPercent('', 0);
    threadPool.init('sqlite').then((res) => {
      let reader = new FileReader();
      reader.readAsArrayBuffer(ev as any);
      reader.onloadend = function (ev): void {
        SpApplication.loadingProgress = 0;
        SpApplication.progressStep = 3;
        that.spSystemTrace!.loadDatabaseArrayBuffer(
          this.result as ArrayBuffer,
          '',
          (command: string, _: number) => {
            that.setProgress(command);
          },
          () => {
            that.mainMenu!.menus!.splice(1, that.mainMenu!.menus!.length > 2 ? 1 : 0, {
              collapsed: false,
              title: 'Current Trace',
              second: false,
              icon: '',
              describe: 'Actions on the current trace',
              children: that.getTraceOptionMenus(showFileName, fileSizeStr, fileName, false),
            });
            that.litSearch!.setPercent('', 101);
            that.chartFilter!.setAttribute('mode', '');
            that.progressEL!.loading = false;
            that.freshMenuDisable(false);
          }
        );
      };
    });
  }

  private handleWasmMode(ev: any, showFileName: string, fileSize: number, fileName: string): void {
    let that = this;
    let fileSizeStr = (fileSize / 1048576).toFixed(1);
    postLog(fileName, fileSizeStr);
    document.title = `${showFileName} (${fileSizeStr}M)`;
    info('Parse trace using wasm mode ');
    this.litSearch!.setPercent('', 1);
    let completeHandler = async (res: any): Promise<void> => {
      await this.traceLoadCompleteHandler(res, fileSizeStr, showFileName, fileName);
    };
    threadPool.init('wasm').then((res) => {
      let reader: FileReader | null = new FileReader();
      reader.readAsArrayBuffer(ev as any);
      reader.onloadend = function (ev): void {
        info('read file onloadend');
        that.litSearch!.setPercent('ArrayBuffer loaded  ', 2);
        let wasmUrl = `https://${window.location.host.split(':')[0]}:${window.location.port}/application/wasm.json`;
        SpApplication.loadingProgress = 0;
        SpApplication.progressStep = 3;
        let data = this.result as ArrayBuffer;
        info('initData start Parse Data');
        that.spSystemTrace!.loadDatabaseArrayBuffer(
          data,
          wasmUrl,
          (command: string, _: number) => that.setProgress(command),
          completeHandler
        );
      };
    });
  }

  private async traceLoadCompleteHandler(
    res: any,
    fileSize: string,
    showFileName: string,
    fileName: string
  ): Promise<void> {
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
      this.cutTraceFile!.style.display = 'block';
      DbPool.sharedBuffer = null;
    }
    let index = 2;
    if (existFtrace.length > 0 && isAllowTrace) {
      this.showConvertTraceMenu(fileName);
      index = 3;
    }
    this.loadTraceCompleteMenuHandler(index);
    if (res.status) {
      info('loadDatabaseArrayBuffer success');
      this.showCurrentTraceMenu(fileSize, showFileName, fileName);
      this.importConfigDiv!.style.display = Utils.SCHED_SLICE_MAP.size > 0 ? 'block' : 'none';
      this.showContent(this.spSystemTrace!);
      this.litSearch!.setPercent('', 101);
      this.chartFilter!.setAttribute('mode', '');
      this.freshMenuDisable(false);
    } else {
      info('loadDatabaseArrayBuffer failed');
      this.litSearch!.setPercent(res.msg || 'This File is not supported!', -1);
      this.freshMenuDisable(false);
      this.mainMenu!.menus!.splice(1, 1);
      this.mainMenu!.menus = this.mainMenu!.menus!;
    }
    this.progressEL!.loading = false;
    this.spInfoAndStats!.initInfoAndStatsData();
  }

  private showConvertTraceMenu(fileName: string): void {
    this.mainMenu!.menus!.splice(2, 1, {
      collapsed: false,
      title: 'Convert trace',
      second: false,
      icon: '',
      describe: 'Convert to other formats',
      children: this.pushConvertTrace(fileName),
    });
  }

  private showCurrentTraceMenu(fileSize: string, showFileName: string, fileName: string): void {
    this.mainMenu!.menus!.splice(1, this.mainMenu!.menus!.length > 2 ? 1 : 0, {
      collapsed: false,
      title: 'Current Trace',
      second: false,
      icon: '',
      describe: 'Actions on the current trace',
      children: this.getTraceOptionMenus(showFileName, fileSize, fileName, false),
    });
  }

  private loadTraceCompleteMenuHandler(index: number): void {
    let that = this;
    this.mainMenu!.menus!.splice(index, 1, {
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
            that.showContent(that.spHelp!);
          },
        },
        {
          title: 'Flags',
          icon: 'menu',
          clickHandler: function (item: MenuItem): void {
            SpStatisticsHttpUtil.addOrdinaryVisitAction({
              event: 'flags',
              action: 'flags',
            });
            that.search = false;
            that.showContent(that.spFlags!);
          },
        },
        {
          title: 'Keyboard shortcuts',
          icon: 'smart-help',
          clickHandler: function (item: MenuItem): void {
            SpStatisticsHttpUtil.addOrdinaryVisitAction({
              event: 'Keyboard shortcuts',
              action: 'Keyboard shortcuts',
            });
            that.search = false;
            that.showContent(that.spKeyboard!);
          },
        },
      ],
    });
  }

  private validateGetTraceFileByPage(): boolean {
    if (!this.wasm) {
      this.progressEL!.loading = false;
      return false;
    }
    return this.pageTimStamp !== 0;
  }

  private queryFileByPage(
    instance: LongTraceDBUtils,
    indexedDbPageNum: number,
    maxTraceFileLength: number,
    traceRange: IDBKeyRange
  ) {
    instance.indexedDBHelp.get(instance.tableName, traceRange, 'QueryFileByPage').then((result) => {
      let traceData = indexedDataToBufferData(result);
      let ebpfRange = this.getIDBKeyRange(indexedDbPageNum, 'ebpf_new');
      let arkTsRange = this.getIDBKeyRange(indexedDbPageNum, 'arkts_new');
      let hiperfRange = this.getIDBKeyRange(indexedDbPageNum, 'hiperf_new');
      Promise.all([
        instance.getByRange(ebpfRange),
        instance.getByRange(arkTsRange),
        instance.getByRange(hiperfRange),
      ]).then((otherResult) => {
        let ebpfData = indexedDataToBufferData(otherResult[0]);
        let arkTsData = indexedDataToBufferData(otherResult[1]);
        let hiperfData = indexedDataToBufferData(otherResult[2]);
        let traceArray = new Uint8Array(traceData);
        let ebpfArray = new Uint8Array(ebpfData);
        let arkTsArray = new Uint8Array(arkTsData);
        let hiPerfArray = new Uint8Array(hiperfData);
        let allOtherData = [ebpfData, arkTsData, hiperfData];
        let otherDataLength = traceData.byteLength + ebpfData.byteLength + arkTsData.byteLength + hiperfData.byteLength;
        let timeStamp = this.currentDataTime[0] + this.currentDataTime[1] + this.currentDataTime[2] + '_' +
          this.currentDataTime[3] + this.currentDataTime[4] + this.currentDataTime[5];
        this.traceFileName = `hiprofiler_long_${timeStamp}_${indexedDbPageNum}.htrace`;
        if (otherDataLength > maxTraceFileLength) {
          if (traceData.byteLength > maxTraceFileLength) {
            this.traceFileLoadFailedHandler('hitrace file too big!');
          } else {
            let freeDataLength = maxTraceFileLength - traceData.byteLength;
            let freeDataIndex = findFreeSizeAlgorithm(
              [ebpfData.byteLength, arkTsData.byteLength, hiperfData.byteLength],
              freeDataLength
            );
            let finalData = [traceData];
            freeDataIndex.forEach((dataIndex) => {
              finalData.push(allOtherData[dataIndex]);
            });
            const file = new File([new Blob(finalData)], this.traceFileName);
            this.handleWasmMode(file, file.name, file.size, this.traceFileName);
          }
        } else {
          let fileBlob = new Blob([traceArray, ebpfArray, arkTsArray, hiPerfArray]);
          const file = new File([fileBlob], this.traceFileName);
          this.handleWasmMode(file, file.name, file.size, file.name);
        }
      });
    });
  }

  private getTraceFileByPage(pageNumber: number): void {
    this.openFileInit();
    if (this.validateGetTraceFileByPage()) {
      let indexedDbPageNum = pageNumber - 1;
      let maxTraceFileLength = 400 * 1024 * 1024;
      let traceRange = this.getIDBKeyRange(indexedDbPageNum, 'trace');
      let instance = LongTraceDBUtils.getInstance();
      this.queryFileByPage(instance, indexedDbPageNum, maxTraceFileLength, traceRange);
    }
  }

  private traceFileLoadFailedHandler(reason: string): void {
    this.litSearch!.isLoading = false;
    this.litSearch!.setPercent(reason, -1);
    this.progressEL!.loading = false;
    this.freshMenuDisable(false);
  }

  private getIDBKeyRange(indexedDbPageNum: number, key: string): IDBKeyRange {
    return IDBKeyRange.bound(
      [this.pageTimStamp, key, indexedDbPageNum],
      [this.pageTimStamp, key, indexedDbPageNum],
      false,
      false
    );
  }

  private refreshPageListHandler(
    pageListDiv: HTMLDivElement,
    previewButton: HTMLDivElement,
    nextButton: HTMLDivElement,
    pageInput: HTMLInputElement
  ): void {
    this.progressEL!.loading = true;
    this.refreshPageList(
      pageListDiv,
      previewButton!,
      nextButton!,
      pageInput!,
      this.currentPageNum,
      this.longTraceHeadMessageList.length
    );
    this.getTraceFileByPage(this.currentPageNum);
  }

  private sendCutFileMessage(timStamp: number): void {
    this.pageTimStamp = timStamp;
    threadPool.init('wasm').then(() => {
      let headUintArray = new Uint8Array(this.longTraceHeadMessageList.length * 1024);
      let headOffset = 0;
      this.longTraceHeadMessageList = this.longTraceHeadMessageList.sort(
        (leftMessage, rightMessage) => leftMessage.pageNum - rightMessage.pageNum
      );
      for (let index = 0; index < this.longTraceHeadMessageList.length; index++) {
        let currentUintArray = new Uint8Array(this.longTraceHeadMessageList[index].data);
        headUintArray.set(currentUintArray, headOffset);
        headOffset += currentUintArray.length;
      }
      threadPool.submit(
        'ts-cut-file',
        '',
        {
          headArray: headUintArray,
          timeStamp: timStamp,
          splitFileInfo: this.longTraceTypeMessageMap?.get(0),
          splitDataList: this.longTraceDataList,
        },
        (res: Array<any>) => {
          this.litSearch!.setPercent('Cut in file ', 100);
          this.currentDataTime = getCurrentDataTime();
          if (this.longTraceHeadMessageList.length > 0) {
            this.getTraceFileByPage(this.currentPageNum);
            this.litSearch!.style.marginLeft = '80px';
            this.longTracePage!.style.display = 'flex';
            this.initCutFileEvent();
          } else {
            this.progressEL!.loading = false;
            this.litSearch!.setPercent('Missing basic trace in the large-file scenario!', -1);
            this.freshMenuDisable(false);
            return;
          }
        },
        'long_trace'
      );
    });
  }

  private initCutFileEvent(): void {
    let pageListDiv = this.shadowRoot?.querySelector('.page-number-list') as HTMLDivElement;
    let previewButton: HTMLDivElement | null | undefined =
      this.shadowRoot?.querySelector<HTMLDivElement>('#preview-button');
    let nextButton: HTMLDivElement | null | undefined = this.shadowRoot?.querySelector<HTMLDivElement>('#next-button');
    let pageInput = this.shadowRoot?.querySelector<HTMLInputElement>('.page-input');
    pageListDiv.innerHTML = '';
    this.refreshPageList(
      pageListDiv,
      previewButton!,
      nextButton!,
      pageInput!,
      this.currentPageNum,
      this.longTraceHeadMessageList.length
    );
    this.initCutFileNextOrPreEvents(previewButton!, nextButton!, pageListDiv, pageInput!);
    let nodeListOf = pageListDiv.querySelectorAll<HTMLDivElement>('div');
    nodeListOf.forEach((divEL, index) => {
      divEL.addEventListener('click', () => {
        if (this.progressEL!.loading) {
          return;
        }
        if (divEL.textContent === '...') {
          let freeSize = Number(nodeListOf[index + 1].textContent) - Number(nodeListOf[index - 1].textContent);
          this.currentPageNum = Math.floor(freeSize / 2 + Number(nodeListOf[index - 1].textContent));
        } else {
          this.currentPageNum = Number(divEL.textContent);
        }
        this.refreshPageListHandler(pageListDiv, previewButton!, nextButton!, pageInput!);
      });
    });
    pageInput!.addEventListener('input', () => {
      let value = pageInput!.value;
      value = value.replace(/\D/g, '');
      if (value) {
        value = Math.min(this.longTraceHeadMessageList.length, parseInt(value)).toString();
      }
      pageInput!.value = value;
    });
    let pageConfirmEl = this.shadowRoot?.querySelector<HTMLDivElement>('.confirm-button');
    pageConfirmEl!.addEventListener('click', () => {
      if (this.progressEL!.loading) {
        return;
      }
      this.currentPageNum = Number(pageInput!.value);
      this.refreshPageListHandler(pageListDiv, previewButton!, nextButton!, pageInput!);
    });
  }

  private initCutFileNextOrPreEvents(
    previewButton: HTMLDivElement,
    nextButton: HTMLDivElement,
    pageListDiv: HTMLDivElement,
    pageInput: HTMLInputElement
  ): void {
    if (previewButton) {
      previewButton.addEventListener('click', () => {
        if (this.progressEL!.loading || this.currentPageNum === 1) {
          return;
        }
        if (this.currentPageNum > 1) {
          this.currentPageNum--;
          this.refreshPageListHandler(pageListDiv, previewButton!, nextButton!, pageInput!);
        }
      });
    }
    nextButton!.addEventListener('click', () => {
      if (this.progressEL!.loading || this.currentPageNum === this.longTraceHeadMessageList.length) {
        return;
      }
      if (this.currentPageNum < this.longTraceHeadMessageList.length) {
        this.currentPageNum++;
        this.refreshPageListHandler(pageListDiv, previewButton!, nextButton!, pageInput!);
      }
    });
  }

  private initCustomColorHandler(): void {
    let customColorShow = this.shadowRoot
      ?.querySelector('lit-main-menu')!
      .shadowRoot!.querySelector('.customColor') as HTMLDivElement;
    customColorShow.addEventListener('click', (ev) => {
      if (this!.hasAttribute('custom-color')) {
        this!.removeAttribute('custom-color');
        this.customColor!.setAttribute('hidden', '');
        this.customColor!.cancelOperate();
      } else {
        this!.removeAttribute('chart_filter');
        this.chartFilter!.setAttribute('hidden', '');
        this!.setAttribute('custom-color', '');
        this.customColor!.removeAttribute('hidden');
      }
    });
  }

  private openFileInit(): void {
    clearTraceFileCache();
    this.litSearch!.clear();
    SpStatisticsHttpUtil.addOrdinaryVisitAction({
      event: 'open_trace',
      action: 'open_trace',
    });
    info('openTraceFile');
    this.spSystemTrace!.clearPointPair();
    this.spSystemTrace!.reset((command: string, percent: number) => {
      this.setProgress(command);
    });
    window.publish(window.SmartEvent.UI.MouseEventEnable, {
      mouseEnable: false,
    });
    window.clearTraceRowComplete();
    this.freshMenuDisable(true);
    SpSchedulingAnalysis.resetCpu();
    if (this.mainMenu!.menus!.length > 3) {
      this.mainMenu!.menus!.splice(1, 2);
      this.mainMenu!.menus = this.mainMenu!.menus!;
    } else if (this.mainMenu!.menus!.length > 2) {
      this.mainMenu!.menus!.splice(1, 1);
      this.mainMenu!.menus = this.mainMenu!.menus!;
    }
    this.showContent(this.spSystemTrace!);
    this.progressEL!.loading = true;
  }

  private restoreDownLoadIcons() {
    let querySelectorAll = this.mainMenu!.shadowRoot?.querySelectorAll<LitMainMenuGroup>('lit-main-menu-group');
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

  private postConvert(fileName: string): void {
    let newFileName = fileName.substring(0, fileName.lastIndexOf('.')) + '.systrace';
    let aElement = document.createElement('a');
    convertPool.submitWithName('getConvertData', (status: boolean, msg: string, results: Blob) => {
      aElement.href = URL.createObjectURL(results);
      aElement.download = newFileName;
      let timeoutId = 0;
      aElement.addEventListener('click', (ev) => {
        clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
          this.restoreDownLoadIcons();
        }, 2000);
      });
      aElement.click();
      window.URL.revokeObjectURL(aElement.href);
    });
  }

  private pushConvertTrace(fileName: string): Array<any> {
    let instance = this;
    let menus = [];
    menus.push({
      title: 'Convert to .systrace',
      icon: 'download',
      clickHandler: function () {
        convertPool.init('convert').then((item) => {
          let querySelectorAll =
            instance.mainMenu!.shadowRoot?.querySelectorAll<LitMainMenuGroup>('lit-main-menu-group');
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
          instance.postConvert(fileName);
        });
      },
    });
    return menus;
  }

  private setProgress(command: string): void {
    if (command === 'database ready' && SpApplication.loadingProgress < 50) {
      SpApplication.progressStep = 6;
    }
    if (command === 'process' && SpApplication.loadingProgress < 92) {
      SpApplication.loadingProgress = 92 + Math.round(Math.random() * SpApplication.progressStep);
    } else {
      SpApplication.loadingProgress += Math.round(Math.random() * SpApplication.progressStep + Math.random());
    }
    if (SpApplication.loadingProgress > 99) {
      SpApplication.loadingProgress = 99;
    }
    info('setPercent :' + command + 'percent :' + SpApplication.loadingProgress);
    this.litSearch!.setPercent(command + '  ', SpApplication.loadingProgress);
  }

  private getTraceOptionMenus(
    showFileName: string,
    fileSize: string,
    fileName: string,
    isServer: boolean,
    dbName?: string
  ): Array<any> {
    let menus = [
      {
        title: `${showFileName} (${fileSize}M)`,
        icon: 'file-fill',
        clickHandler: (): void => {
          this.search = true;
          this.showContent(this.spSystemTrace!);
        },
      },
      {
        title: 'Scheduling Analysis',
        icon: 'piechart-circle-fil',
        clickHandler: (): void => {
          SpStatisticsHttpUtil.addOrdinaryVisitAction({
            event: 'Scheduling Analysis',
            action: 'scheduling_analysis',
          });
          this.showContent(this.spSchedulingAnalysis!);
          this.spSchedulingAnalysis!.init();
        },
      },
      {
        title: 'Download File',
        icon: 'download',
        clickHandler: (): void => {
          this.download(this.mainMenu!, fileName, isServer, dbName);
          SpStatisticsHttpUtil.addOrdinaryVisitAction({
            event: 'download',
            action: 'download',
          });
        },
      },
      {
        title: 'Download Database',
        icon: 'download',
        clickHandler: (): void => {
          this.downloadDB(this.mainMenu!, fileName);
          SpStatisticsHttpUtil.addOrdinaryVisitAction({
            event: 'download_db',
            action: 'download',
          });
        },
      },
    ];
    this.getTraceQuerySqlMenus(menus);
    if ((window as any).cpuCount === 0 || !FlagsConfig.getFlagsConfigEnableStatus('SchedulingAnalysis')) {
      menus.splice(1, 1);
    }
    return menus;
  }

  private getTraceQuerySqlMenus(menus: Array<any>): void {
    if (this.querySql) {
      if (this.spQuerySQL) {
        this.spQuerySQL!.reset();
        menus.push({
          title: 'Query (SQL)',
          icon: 'filesearch',
          clickHandler: () => {
            this.showContent(this.spQuerySQL!);
          },
        });
      }
      if (this.spMetrics) {
        this.spMetrics!.reset();
        menus.push({
          title: 'Metrics',
          icon: 'metric',
          clickHandler: () => {
            this.showContent(this.spMetrics!);
          },
        });
      }
      if (this.spInfoAndStats) {
        menus.push({
          title: 'Info and stats',
          icon: 'info',
          clickHandler: () => {
            SpStatisticsHttpUtil.addOrdinaryVisitAction({
              event: 'info',
              action: 'info_stats',
            });
            this.showContent(this.spInfoAndStats!);
          },
        });
      }
    }
  }

  private initSlideMenuEvents(): void {
    //打开侧边栏
    this.sidebarButton!.onclick = (e): void => {
      if (this.mainMenu) {
        this.mainMenu.style.width = '248px';
        this.mainMenu.style.zIndex = '2000';
        this.mainMenu.style.display = 'flex';
      }
      if (this.sidebarButton) {
        this.sidebarButton.style.width = '0px';
        this.importConfigDiv!.style.left = '5px';
        this.closeKeyPath!.style.left = '25px';
      }
    };
    let icon: HTMLDivElement | undefined | null = this.mainMenu?.shadowRoot?.querySelector('div.header > div');
    icon!.style.pointerEvents = 'none';
    icon!.onclick = (e): void => {
      if (this.mainMenu) {
        this.mainMenu.style.width = '0px';
        this.mainMenu.style.display = 'flex';
        this.mainMenu.style.zIndex = '0';
      }
      if (this.sidebarButton) {
        this.sidebarButton.style.width = '48px';
        this.importConfigDiv!.style.left = '45px';
        this.closeKeyPath!.style.left = '65px';
      }
    };
  }

  private initImportConfigEvent(): void {
    this.importFileBt?.addEventListener('change', (): void => {
      let files = this.importFileBt!.files;
      if (files && files.length === 1) {
        const reader = new FileReader();
        reader.readAsText(files[0], 'UTF-8');
        reader.onload = (e): void => {
          if (e.target?.result) {
            try {
              const result = parseKeyPathJson(e.target.result as string);
              window.publish(window.SmartEvent.UI.KeyPath, result);
              this.closeKeyPath!.style.display = 'block';
            } catch {
              error('json Parse Failed');
              this.litSearch!.setPercent('Json Parse Failed!', -1);
              window.setTimeout(() => {
                this.litSearch!.setPercent('Json Parse Failed!', 101);
              }, 1000);
            }
          } else {
            window.publish(window.SmartEvent.UI.KeyPath, []);
            this.closeKeyPath!.style.display = 'none';
          }
        };
      }
      this.importFileBt!.files = null;
      this.importFileBt!.value = '';
    });
    if (this.closeKeyPath) {
      this.closeKeyPath.addEventListener('click', (): void => {
        window.publish(window.SmartEvent.UI.KeyPath, []);
        this.closeKeyPath!.style.display = 'none';
      });
    }
  }

  private initCustomEvents(): void {
    window.subscribe(window.SmartEvent.UI.MenuTrace, () => this.showContent(this.spSystemTrace!));
    window.subscribe(window.SmartEvent.UI.Error, (err) => {
      this.litSearch!.setPercent(err, -1);
      this.progressEL!.loading = false;
      this.freshMenuDisable(false);
    });
    window.subscribe(window.SmartEvent.UI.Loading, (arg: { loading: boolean; text?: string }) => {
      if (arg.text) {
        this.litSearch!.setPercent(arg.text || '', arg.loading ? -1 : 101);
      }
      window.publish(window.SmartEvent.UI.MouseEventEnable, {
        mouseEnable: !arg.loading,
      });
      this.progressEL!.loading = arg.loading;
    });
  }

  private initEvents(): void {
    this.addEventListener('copy', function (event) {
      let clipdata = event.clipboardData;
      let value = clipdata!.getData('text/plain');
      let searchValue = value.toString().trim();
      clipdata!.setData('text/plain', searchValue);
    });
    this.initSearchEvents();
    this.initSystemTraceEvents();
    this.filterConfig!.addEventListener('click', (ev) => {
      if (this!.hasAttribute('chart_filter')) {
        this!.removeAttribute('chart_filter');
        this.chartFilter!.setAttribute('hidden', '');
      } else {
        this!.removeAttribute('custom-color');
        this.customColor!.setAttribute('hidden', '');
        this.customColor!.cancelOperate();
        this!.setAttribute('chart_filter', '');
        this.chartFilter!.removeAttribute('hidden');
      }
    });
    this.configClose!.addEventListener('click', (ev) => {
      if (this.hasAttribute('chart_filter')) {
        this!.removeAttribute('chart_filter');
      }
    });
    this.cutTraceFile!.addEventListener('click', () => {
      this.croppingFile(this.progressEL!, this.litSearch!);
    });
  }

  private initSearchChangeEvents(): void {
    this.litSearch!.valueChangeHandler = (value: string): void => {
      this.litSearch!.isClearValue = false;
      if (value.length > 0) {
        let list: any[] = [];
        this.progressEL!.loading = true;
        this.spSystemTrace!.searchCPU(value).then((cpus) => {
          list = cpus;
          this.spSystemTrace!.searchFunction(list, value).then((mixedResults) => {
            if (this.litSearch!.searchValue !== '') {
              this.litSearch!.list = this.spSystemTrace!.searchSdk(mixedResults, value);
              this.litSearch!.index = this.spSystemTrace!.showStruct(false, -1, this.litSearch!.list);
            }
            this.progressEL!.loading = false;
          });
        });
      } else {
        let indexEL = this.litSearch!.shadowRoot!.querySelector<HTMLSpanElement>('#index');
        indexEL!.textContent = '0';
        this.litSearch!.list = [];
        this.spSystemTrace?.visibleRows.forEach((it) => {
          it.highlight = false;
          it.draw();
        });
        this.spSystemTrace?.timerShaftEL?.removeTriangle('inverted');
      }
    };
  }
  private initSearchEvents(): void {
    this.litSearch!.addEventListener('focus', () => {
      window.publish(window.SmartEvent.UI.KeyboardEnable, {
        enable: false,
      });
    });
    this.litSearch!.addEventListener('blur', () => {
      window.publish(window.SmartEvent.UI.KeyboardEnable, {
        enable: true,
      });
    });
    this.litSearch!.addEventListener('previous-data', (ev: any) => {
      this.litSearch!.index = this.spSystemTrace!.showStruct(true, this.litSearch!.index, this.litSearch!.list);
      this.litSearch!.blur();
    });
    this.litSearch!.addEventListener('next-data', (ev: any) => {
      this.litSearch!.index = this.spSystemTrace!.showStruct(false, this.litSearch!.index, this.litSearch!.list);
      this.litSearch!.blur();
    });
    // 翻页事件
    this.litSearch!.addEventListener('retarget-data', (ev: any) => {
      this.litSearch!.index = this.spSystemTrace!.showStruct(
        true,
        ev.detail.value,
        this.litSearch!.list,
        ev.detail.value
      );
      this.litSearch!.blur();
    });
    this.initSearchChangeEvents();
  }

  private initSystemTraceEvents(): void {
    this.spSystemTrace?.addEventListener('trace-previous-data', (ev: any) => {
      this.litSearch!.index = this.spSystemTrace!.showStruct(true, this.litSearch!.index, this.litSearch!.list);
    });
    this.spSystemTrace?.addEventListener('trace-next-data', (ev: any) => {
      this.litSearch!.index = this.spSystemTrace!.showStruct(false, this.litSearch!.index, this.litSearch!.list);
    });
  }

  private showContent(showNode: HTMLElement): void {
    if (showNode === this.spSystemTrace) {
      this.menu!.style.pointerEvents = 'auto';
      this.sidebarButton!.style.pointerEvents = 'auto';
      this.search = true;
      this.litRecordSearch!.style.display = 'none';
      this.litSearch!.style.display = 'block';
      window.publish(window.SmartEvent.UI.KeyboardEnable, {
        enable: true,
      });
      this.filterConfig!.style.visibility = 'visible';
    } else {
      this.removeAttribute('custom-color');
      this.customColor!.setAttribute('hidden', '');
      this.customColor!.cancelOperate();
      this.menu!.style.pointerEvents = 'none';
      this.sidebarButton!.style.pointerEvents = 'none';
      this.search = this.litSearch!.isLoading;
      if (!this.search) {
        this.litSearch!.style.display = 'none';
        this.litRecordSearch!.style.display = 'block';
      }
      window.publish(window.SmartEvent.UI.KeyboardEnable, {
        enable: false,
      });
      this.filterConfig!.style.visibility = 'hidden';
    }
    this.childComponent!.forEach((node) => {
      if (this.hasAttribute('chart_filter')) {
        this.removeAttribute('chart_filter');
      }
      if (this.hasAttribute('custom-color')) {
        this.removeAttribute('custom-color');
        this.customColor!.setAttribute('hidden', '');
        this.customColor!.cancelOperate();
      }
      if (node === showNode) {
        showNode.style.visibility = 'visible';
      } else {
        (node! as HTMLElement).style.visibility = 'hidden';
      }
    });
  }

  private validateFileCacheLost(): void {
    caches.has(DbPool.fileCacheKey).then((exist) => {
      if (!exist) {
        this.mainMenu!.menus?.forEach((mg) => {
          mg.children.forEach((mi: any) => {
            if (mi.title === 'Download File') {
              mi.disabled = true;
            }
          });
        });
        this.cutTraceFile!.style.display = 'none';
        this.mainMenu!.menus = this.mainMenu!.menus;
      }
    });
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
      pageText = this.largePageHandler(currentPageNum, maxPageNumber, previewButton, nextButton);
    } else {
      pageText = [];
      for (let index = 0; index < maxPageNumber; index++) {
        pageText.push((index + 1).toString());
      }
    }
    this.pageNodeHandler(pageListDiv, pageText, currentPageNum);
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

  private pageNodeHandler(pageListDiv: HTMLDivElement, pageText: Array<string>, currentPageNum: number): void {
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
  }

  private largePageHandler(
    currentPageNum: number,
    maxPageNumber: number,
    previewButton: HTMLDivElement,
    nextButton: HTMLDivElement
  ): Array<string> {
    switch (currentPageNum) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        return ['1', '2', '3', '4', '5', '...', maxPageNumber.toString()];
      case maxPageNumber:
      case maxPageNumber - 1:
      case maxPageNumber - 2:
      case maxPageNumber - 3:
      case maxPageNumber - 4:
        return [
          '1',
          '...',
          (maxPageNumber - 4).toString(),
          (maxPageNumber - 3).toString(),
          (maxPageNumber - 2).toString(),
          (maxPageNumber - 1).toString(),
          maxPageNumber.toString(),
        ];
      default:
        nextButton.style.pointerEvents = 'auto';
        previewButton!.style.pointerEvents = 'auto';
        nextButton.style.opacity = '1';
        previewButton!.style.opacity = '1';
        return [
          '1',
          '...',
          (currentPageNum - 1).toString(),
          currentPageNum.toString(),
          (currentPageNum + 1).toString(),
          '...',
          maxPageNumber.toString(),
        ];
    }
  }

  /**
   * 修改颜色或者主题，重新绘制侧边栏和泳道图
   * @param theme 当前主题（深色和浅色）
   * @param colorsArray 预览的情况下传入
   */
  changeTheme(theme: Theme, colorsArray?: Array<string>): void {
    if (!colorsArray) {
      this.customColor!.setRadioChecked(theme);
    }
    if (theme === Theme.DARK) {
      this.changeDarkTheme(colorsArray);
    } else {
      this.changeLightTheme(colorsArray);
    }
    this.spSystemTrace!.timerShaftEL!.rangeRuler!.draw();
    if (this.colorTransiton) {
      clearTimeout(this.colorTransiton);
    }
    this.colorTransiton = setTimeout(() => (this.mainMenu!.style.transition = '0s'), 1000);
  }

  private changeDarkTheme(colorsArray?: Array<string>): void {
    let menuGroup = this.mainMenu!.shadowRoot?.querySelectorAll<LitMainMenuGroup>('lit-main-menu-group');
    let menuItem = this.mainMenu!.shadowRoot?.querySelectorAll<LitMainMenuItem>('lit-main-menu-item');
    this.mainMenu!.style.backgroundColor = '#262f3c';
    this.mainMenu!.style.transition = '1s';
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
  }

  private changeLightTheme(colorsArray?: Array<string>): void {
    let menuGroup = this.mainMenu!.shadowRoot?.querySelectorAll<LitMainMenuGroup>('lit-main-menu-group');
    let menuItem = this.mainMenu!.shadowRoot?.querySelectorAll<LitMainMenuItem>('lit-main-menu-item');
    this.mainMenu!.style.backgroundColor = 'white';
    this.mainMenu!.style.transition = '1s';
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

  private downloadOnLineFile(
    url: string,
    download: boolean,
    openUrl: (buffer: ArrayBuffer, fileName: string, showFileName: string, fileSize: number) => void,
    openFileHandler: (path: string) => void
  ): void {
    if (download) {
      fetch(url)
        .then((res) => {
          res.arrayBuffer().then((arrayBuf) => {
            let fileName = url.split('/').reverse()[0];
            let showFileName =
              fileName.lastIndexOf('.') === -1 ? fileName : fileName.substring(0, fileName.lastIndexOf('.'));
            openUrl(arrayBuf, fileName, showFileName, arrayBuf.byteLength);
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

  private croppingFile(progressEL: LitProgressBar, litSearch: LitSearch): void {
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
        if (cutIndex !== -1) {
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

  private downloadDB(mainMenu: LitMainMenu, fileDbName: string): void {
    let fileName = `${fileDbName?.substring(0, fileDbName?.lastIndexOf('.'))}.db`;
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

  private async download(mainMenu: LitMainMenu, fileName: string, isServer: boolean, dbName?: string): Promise<void> {
    let a = document.createElement('a');
    if (isServer) {
      if (dbName !== '') {
        let file = dbName?.substring(0, dbName?.lastIndexOf('.')) + fileName.substring(fileName.lastIndexOf('.'));
        a.href = `https://${window.location.host.split(':')[0]}:${window.location.port}${file}`;
      } else {
        return;
      }
    } else {
      let buffer = await readTraceFileBuffer();
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

  private itemIconLoading(mainMenu: LitMainMenu, groupName: string, itemName: string, start: boolean): void {
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

  freshMenuDisable(disable: boolean): void {
    // @ts-ignore
    this.mainMenu!.menus[0].children[0].disabled = disable;
    // @ts-ignore
    this.mainMenu!.menus[0].children[1].disabled = disable;
    if (this.mainMenu!.menus!.length > 2) {
      // @ts-ignore
      this.mainMenu!.menus[1].children.map((it) => (it.disabled = disable));
    }
    this.mainMenu!.menus = this.mainMenu!.menus;
    this.filterConfig!.style.visibility = disable ? 'hidden' : 'visible';
  }
}
