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
import '../base-ui/loading/LitLoading';
import '../base-ui/like/LitLike';
import { SpMetrics } from './component/SpMetrics';
import { SpHelp } from './component/SpHelp';
import './component/SpHelp';
import { SpQuerySQL } from './component/SpQuerySQL';
import './component/SpQuerySQL';
import { SpSystemTrace } from './component/SpSystemTrace';
import { LitMainMenu, MenuGroup, MenuItem } from '../base-ui/menu/LitMainMenu';
import { SpInfoAndStats } from './component/SpInfoAndStas';
import '../base-ui/progress-bar/LitProgressBar';
import { LitProgressBar } from '../base-ui/progress-bar/LitProgressBar';
import { SpRecordTrace } from './component/SpRecordTrace';
import { SpWelcomePage } from './component/SpWelcomePage';
import { LitSearch } from './component/trace/search/Search';
import {
  getThreadPoolTraceBuffer,
  getThreadPoolTraceBufferCacheKey,
  setThreadPoolTraceBuffer,
  threadPool,
  threadPool2,
} from './database/SqlLite';
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
  addExportDBToParentEvent,
  applicationHtml,
  clearTraceFileCache,
  findFreeSizeAlgorithm,
  getCurrentDataTime,
  indexedDataToBufferData,
  isZipFile,
  isZlibFile,
  loadTraceCompleteEvent,
  postLog,
  readTraceFileBuffer,
  TraceMode
} from './SpApplicationPublicFunc';
import { queryExistFtrace } from './database/sql/SqlLite.sql';
import '../base-ui/chart/scatter/LitChartScatter';
import { SpThirdParty } from './component/SpThirdParty';
import './component/SpThirdParty';
import { cancelCurrentTraceRowHighlight } from './component/SpSystemTrace.init';
import './component/SpAiAnalysisPage';
import './component/SpSnapShotView';
import { WebSocketManager } from '../webSocket/WebSocketManager';
import { SpAiAnalysisPage } from './component/SpAiAnalysisPage';
import './component/SpAdvertisement';
import { ShadowRootInput } from './component/trace/base/ShadowRootInput';
import { SpSnapShotView } from './component/SpSnapShotView';
import { SnapShotStruct } from './database/ui-worker/ProcedureWorkerSnaps';
import { InterfaceConfigManager } from '../utils/interfaceConfiguration';

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
  static isTraceLoaded: Boolean = false;
  skinChangeArray: Array<Function> = [];
  private rootEL: HTMLDivElement | undefined | null;
  private headerDiv: HTMLDivElement | undefined | null;
  private spWelcomePage: SpWelcomePage | undefined | null;
  private spMetrics: SpMetrics | undefined | null;
  private spQuerySQL: SpQuerySQL | undefined | null;
  private spInfoAndStats: SpInfoAndStats | undefined | null;
  private spSystemTrace: SpSystemTrace | undefined | null;
  private spHelp: SpHelp | undefined | null;
  private spKeyboard: SpKeyboard | undefined | null;
  private spFlags: SpFlags | undefined | null;
  private spRecordTrace: SpRecordTrace | undefined | null;
  private spSchedulingAnalysis: SpSchedulingAnalysis | undefined | null;
  private mainMenu: LitMainMenu | undefined | null;
  private menu: HTMLDivElement | undefined | null;
  private progressEL: LitProgressBar | undefined | null;
  private litSearch: LitSearch | undefined | null;
  private litRecordSearch: LitSearch | undefined | null;
  private sidebarButton: HTMLDivElement | undefined | null;
  private chartFilter: TraceRowConfig | undefined | null;
  private cutTraceFile: HTMLImageElement | undefined | null;
  private exportRecord: LitIcon | undefined | null;
  private longTracePage: HTMLDivElement | undefined | null;
  private customColor: CustomThemeColor | undefined | null;
  private filterConfig: LitIcon | undefined | null;
  private configClose: LitIcon | undefined | null;
  private spThirdParty: SpThirdParty | undefined | null;
  // 关键路径标识
  private importConfigDiv: HTMLInputElement | undefined | null;
  private closeKeyPath: HTMLDivElement | undefined | null;
  private importFileBt: HTMLInputElement | undefined | null;
  private contentLeftOption: HTMLDivElement | undefined | null;
  private contentCenterOption: HTMLDivElement | undefined | null;
  private contentRightOption: HTMLDivElement | undefined | null;
  private childComponent: Array<unknown> | undefined | null;
  private spAiAnalysisPage: SpAiAnalysisPage | undefined | null;
  private aiAnalysis: HTMLImageElement | undefined | null;
  private keyCodeMap = {
    61: true,
    107: true,
    109: true,
    173: true,
    187: true,
    189: true,
  };
  private traceFileName: string | undefined;
  private markJson: string | undefined;
  colorTransiton?: NodeJS.Timeout;
  static isLongTrace: boolean = false;
  fileTypeList: string[] = ['ebpf', 'arkts', 'hiperf'];
  private pageTimStamp: number = 0;
  private currentPageNum: number = 1;
  private currentDataTime: string[] = [];
  static traceType: String = '';
  private isZipFile: boolean = false;
  isClear: boolean = false;
  isOpenTrace: boolean = false;
  static spSnapShotView: SpSnapShotView | undefined | null;
  private spBulletinPage: HTMLDivElement | undefined | null;
  private isUrlOpen: boolean = false;

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

  set wasm(isWasm: boolean) {
    if (isWasm) {
      this.setAttribute('wasm', '');
    } else {
      this.hasAttribute('wasm') && this.removeAttribute('wasm');
    }
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

  initElements(): void {
    this.wasm = true;
    this.querySql = true;
    this.rootEL = this.shadowRoot!.querySelector<HTMLDivElement>('.root');
    this.headerDiv = this.shadowRoot!.querySelector<HTMLDivElement>('.search-vessel');
    this.spWelcomePage = this.shadowRoot!.querySelector('#sp-welcome') as SpWelcomePage;
    this.spBulletinPage = this.spWelcomePage.shadowRoot?.querySelector('.home-page');
    this.spMetrics = this.shadowRoot!.querySelector<SpMetrics>('#sp-metrics') as SpMetrics; // new SpMetrics();
    this.spQuerySQL = this.shadowRoot!.querySelector<SpQuerySQL>('#sp-query-sql') as SpQuerySQL; // new SpQuerySQL();
    this.spInfoAndStats = this.shadowRoot!.querySelector<SpInfoAndStats>('#sp-info-and-stats'); // new SpInfoAndStats();
    this.spSystemTrace = this.shadowRoot!.querySelector<SpSystemTrace>('#sp-system-trace');
    this.spHelp = this.shadowRoot!.querySelector<SpHelp>('#sp-help');
    this.spKeyboard = this.shadowRoot!.querySelector<SpKeyboard>('#sp-keyboard') as SpKeyboard;
    this.spFlags = this.shadowRoot!.querySelector<SpFlags>('#sp-flags') as SpFlags;
    this.spRecordTrace = this.shadowRoot!.querySelector<SpRecordTrace>('#sp-record-trace');
    this.spSchedulingAnalysis = this.shadowRoot!.querySelector<SpSchedulingAnalysis>('#sp-scheduling-analysis');
    this.mainMenu = this.shadowRoot?.querySelector('#main-menu') as LitMainMenu;
    this.menu = this.mainMenu.shadowRoot?.querySelector('.menu-button') as HTMLDivElement;
    this.progressEL = this.shadowRoot?.querySelector('.progress') as LitProgressBar;
    this.litSearch = this.shadowRoot?.querySelector('#lit-search') as LitSearch;
    this.litRecordSearch = this.shadowRoot?.querySelector('#lit-record-search') as LitSearch;
    this.sidebarButton = this.shadowRoot?.querySelector('.sidebar-button');
    this.chartFilter = this.shadowRoot?.querySelector('.chart-filter') as TraceRowConfig;
    this.aiAnalysis = this.shadowRoot?.querySelector('.ai_analysis') as HTMLImageElement;
    this.cutTraceFile = this.shadowRoot?.querySelector('.cut-trace-file') as HTMLImageElement;
    this.exportRecord = this.shadowRoot?.querySelector('.export-record') as LitIcon;
    this.longTracePage = this.shadowRoot!.querySelector('.long_trace_page') as HTMLDivElement;
    this.customColor = this.shadowRoot?.querySelector('.custom-color') as CustomThemeColor;
    this.filterConfig = this.shadowRoot?.querySelector('.filter-config') as LitIcon;
    this.spThirdParty = this.shadowRoot!.querySelector('#sp-third-party') as SpThirdParty;
    this.configClose = this.shadowRoot
      ?.querySelector<HTMLElement>('.chart-filter')!
      .shadowRoot?.querySelector<LitIcon>('.config-close');
    this.importConfigDiv = this.shadowRoot?.querySelector<HTMLInputElement>('#import-key-path');
    this.closeKeyPath = this.shadowRoot?.querySelector<HTMLDivElement>('#close-key-path');
    this.importFileBt = this.shadowRoot?.querySelector<HTMLInputElement>('#import-config');
    this.contentRightOption = this.shadowRoot?.querySelector<HTMLDivElement>('.content-right-option');
    this.contentLeftOption = this.shadowRoot?.querySelector<HTMLDivElement>('.content-left-option');
    this.contentCenterOption = this.shadowRoot?.querySelector<HTMLDivElement>('.content-center-option');
    this.spAiAnalysisPage = this.shadowRoot!.querySelector('#sp-ai-analysis') as SpAiAnalysisPage;
    SpApplication.spSnapShotView = this.shadowRoot!.querySelector('#sp-snapshot-view') as SpSnapShotView;
    this.initElementsAttr();
    this.initEvents();
    this.initRecordEvents();
    this.initCustomEvents();
    this.initCustomColorHandler();
    this.initImportConfigEvent();
    this.initSlideMenuEvents();
    this.resetMenus();
    this.initGlobalEvents();
    this.initDocumentListener();
    this.initElementsEnd();
    this.connectWebSocket();
    this.initPlugin();
    SpApplication.spSnapShotView!.addEventListener('mousemove', () => {
      this.clearSnapShot();
    })
    SpApplication.spSnapShotView!.addEventListener('mouseout', () => {
      this.clearSnapShot();
      setTimeout(() => {
        SnapShotStruct.isClear = false;
      }, 0);
    })

  }

  private clearSnapShot(): void {
    SnapShotStruct.hoverSnapShotStruct = undefined;
    SnapShotStruct.isClear = true;
    this.spSystemTrace?.refreshCanvas(true);
  }

  async initPlugin(): Promise<void> {
    try {
      await SpStatisticsHttpUtil.getServerInfo();
      this.spBulletinPage = this.spWelcomePage!.shadowRoot?.querySelector('.home-page');
      const litIcon = this.spWelcomePage!.shadowRoot?.querySelector('.lit-icon');
      let urlParams = new URL(window.location.href).searchParams;
      const currentConfig = InterfaceConfigManager.getConfig();
      if (urlParams && urlParams.get('trace') && urlParams.get('link')) {
        this.isUrlOpen = true;
      }
      if (currentConfig?.bulletinConfig?.switch && currentConfig?.bulletinConfig?.content && !this.isUrlOpen) {
        this.spBulletinPage!.innerHTML = currentConfig.bulletinConfig.content;
        this.spBulletinPage!.style.visibility = 'visible';
        litIcon!.classList.add('adjust');
      } else {
        this.spBulletinPage!.style.visibility = 'hidden';
        litIcon!.classList.remove('adjust');
      }
      if (currentConfig?.reportConfig.switch) {
        SpStatisticsHttpUtil.requestServerInfo = currentConfig?.reportConfig.url;
        SpStatisticsHttpUtil.initStatisticsServerConfig();
        SpStatisticsHttpUtil.addUserVisitAction('visit');
      }

      let aiAnalysisShow = this.shadowRoot?.querySelector('lit-main-menu')!.shadowRoot!.querySelector('.ai_analysis') as HTMLDivElement;
      if (currentConfig?.aiAssistantConfig.switch) {
        aiAnalysisShow.style.display = 'block';
      } else {
        aiAnalysisShow.style.display = 'none';
      }
      LongTraceDBUtils.getInstance().createDBAndTable().then();
    } catch (e) {
      console.error(e);
    }
  }
  private connectWebSocket(): void {
    document.addEventListener('DOMContentLoaded', function () {//
      WebSocketManager.getInstance();
    });
  }
  private initElementsEnd(): void {
    let urlParams = new URL(window.location.href).searchParams;
    let jsonStr = '';
    if (urlParams && urlParams.get('json')) {
      jsonStr = decodeURIComponent(window.location.href.split('&').reverse()[0].split('=')[1]);
    }
    if (urlParams && urlParams.get('trace') && urlParams.get('link')) {
      this.openLineFileHandler(urlParams, jsonStr);
    } else if (urlParams && urlParams.get('action')) {
      this.helpClick(urlParams!);
    } else {
      this.openMenu(true);
    }
  }

  private helpClick(urlParams: URLSearchParams): void {
    if (urlParams.get('action') === 'help') {
      SpStatisticsHttpUtil.addOrdinaryVisitAction({
        event: 'help_page',
        action: 'help_doc',
      });
      this.spHelp!.dark = this.dark;
      this.showContent(this.spHelp!);
    } else if (urlParams.get('action')!.length > 4) {
      this.showContent(this.spHelp!);
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
      this.spBulletinPage,
      this.spAiAnalysisPage,
      this.spMetrics,
      this.spQuerySQL,
      this.spSchedulingAnalysis,
      this.spInfoAndStats,
      this.spHelp,
      this.spFlags,
      this.spKeyboard,
      this.spThirdParty,
    ];
  }

  private openLongTraceFile(ev: CustomEvent, isRecordTrace: boolean = false): void {
    this.returnOriginalUrl();
    this.wasm = true;
    this.openFileInit(true);
    let detail = ev.detail;
    let initRes = this.longTraceFileInit(isRecordTrace, detail);
    if (!isRecordTrace && initRes) {
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
      ): Promise<unknown> => {
        const promises = Array.from(files).map((file) => {
          if (normalNames.indexOf(file.name.toLowerCase()) >= 0) {
            return this.longTraceFileRead(file, true, traceTypePage, readSize, timStamp, allFileSize);
          } else if (specialNames.indexOf(file.name.toLowerCase()) >= 0) {
            return this.longTraceFileRead(file, false, traceTypePage, readSize, timStamp, allFileSize);
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
    file: File,
    isNormalType: boolean,
    traceTypePage: Array<number>,
    readSize: number,
    timStamp: number,
    allFileSize: number
  ): Promise<boolean> => {
    info('reading long trace file ', file.name);
    return new Promise((resolve, reject) => {
      let fr = new FileReader();
      let message = { fileType: '', startIndex: 0, endIndex: 0, size: 0 };
      info('Parse long trace using wasm mode ');
      const { fileType, pageNumber } = this.getFileTypeAndPages(file.name, isNormalType, traceTypePage);
      let chunk = 48 * 1024 * 1024;
      let offset = 0;
      let sliceLen = 0;
      let index = 1;
      fr.onload = (): void => {
        let data = fr.result as ArrayBuffer;
        LongTraceDBUtils.getInstance()
          .addLongTableData(data, fileType, timStamp, pageNumber, index, offset, sliceLen)
          .then(() => {
            this.longTraceFileReadMessagePush(index, isNormalType, pageNumber, offset, sliceLen, fileType, data);
            offset += sliceLen;
            if (offset < file.size) {
              index++;
            }
            continueReading();
          });
      };
      const continueReading = (): void => {
        if (offset >= file.size) {
          message.endIndex = index;
          message.size = file.size;
          this.longTraceFileReadMessageHandler(pageNumber, message);
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
        this.litSearch!.setPercent('Read in file: ', Number(percentValue));
        fr.readAsArrayBuffer(slice);
      };
      continueReading();
      fr.onerror = (): void => reject(false);
      info('read over long trace file ', file.name);
    });
  };

  getFileTypeAndPages(
    fileName: string,
    isNormalType: boolean,
    traceTypePage: Array<number>
  ): {
    fileType: string;
    pageNumber: number;
  } {
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

  private longTraceFileInit(
    isRecordTrace: boolean,
    detail: unknown
  ):
    | {
      traceTypePage: number[];
      allFileSize: number;
      normalTraceNames: string[];
      specialTraceNames: string[];
    }
    | undefined {
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
      //@ts-ignore
      this.sendCutFileMessage(detail.timeStamp);
      return undefined;
    } else {
      this.longTraceHeadMessageList = [];
      this.longTraceTypeMessageMap = undefined;
      this.longTraceDataList = [];
      let traceTypePage: Array<number> = [];
      let allFileSize = 0;
      let normalTraceNames: Array<string> = [];
      let specialTraceNames: Array<string> = []; //@ts-ignore
      for (let index = 0; index < detail.length; index++) {
        //@ts-ignore
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
  ): void {
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

  longTraceFileReadMessageHandler(pageNumber: number, message: unknown): void {
    if (this.longTraceTypeMessageMap) {
      if (this.longTraceTypeMessageMap?.has(pageNumber)) {
        let oldTypeList = this.longTraceTypeMessageMap?.get(pageNumber);
        //@ts-ignore
        oldTypeList?.push(message);
        this.longTraceTypeMessageMap?.set(pageNumber, oldTypeList!);
      } else {
        //@ts-ignore
        this.longTraceTypeMessageMap?.set(pageNumber, [message]);
      }
    } else {
      this.longTraceTypeMessageMap = new Map();
      //@ts-ignore
      this.longTraceTypeMessageMap.set(pageNumber, [message]);
    }
  }

  private openTraceFile(ev: File): void {
    SpApplication.isTraceLoaded = false;
    this.isOpenTrace = true;
    this.returnOriginalUrl();
    this.removeAttribute('custom-color');
    this.chartFilter!.setAttribute('hidden', '');
    this.customColor!.setAttribute('hidden', '');
    this.longTracePage!.style.display = 'none';
    this.litSearch!.style.marginLeft = '0px';
    // 诊断的db标记重置
    SpAiAnalysisPage.isRepeatedly = false;
    this.spAiAnalysisPage!.style.display = 'none';
    let pageListDiv = this.shadowRoot?.querySelector('.page-number-list') as HTMLDivElement;
    pageListDiv.innerHTML = '';
    this.openFileInit();
    if (this.importConfigDiv && this.closeKeyPath) {
      this.importConfigDiv.style.display = 'none';
      this.closeKeyPath.style.display = 'none';
    }
    let fileName = ev.name;
    this.traceFileName = fileName;
    let showFileName = fileName.lastIndexOf('.') === -1 ? fileName : fileName.substring(0, fileName.lastIndexOf('.'));
    window.sessionStorage.setItem('fileName', showFileName);
    TraceRow.rangeSelectObject = undefined;
    let typeStr = ev.slice(0, 100);
    let reader: FileReader | null = new FileReader();
    reader.readAsText(typeStr);
    reader.onloadend = (event): void => {
      let isIncludeMark = `${reader?.result}`.includes('MarkPositionJSON');
      let typeHeader;
      if (isIncludeMark) {
        let markLength = `${reader?.result}`.split('->')[0].replace('MarkPositionJSON', '');
        typeHeader = ev.slice(markLength.length + parseInt(markLength), markLength.length + parseInt(markLength) + 6);
      } else {
        typeHeader = ev.slice(0, 6);
      }
      this.judgeDBOrWasm(ev, typeHeader, showFileName);
      this.judgeZip(typeHeader);
    };
    if (!SpRecordTrace.isSnapShotCapture) {
      SpApplication.spSnapShotView!.style.visibility = 'hidden';
      SpApplication.spSnapShotView!.style.display = 'none';
      SnapShotStruct.hoverSnapShotStruct = undefined;
      SnapShotStruct.selectSnapShotStruct = undefined;
      SnapShotStruct.isClear = true;
      setTimeout(() => {
        SnapShotStruct.isClear = false;
      }, 0);
      this.spSystemTrace!.refreshCanvas(true);
    }
  }

  private judgeDBOrWasm(ev: File, typeHeader: Blob, showFileName: string): void {
    let fileReader: FileReader | null = new FileReader();
    fileReader.readAsText(typeHeader);
    fileReader.onload = (event): void => {
      let headerStr: string = `${fileReader?.result}`;
      SpApplication.traceType = headerStr;
      if (headerStr.indexOf('SQLite') === 0) {
        info('Parse trace headerStr sql mode');
        this.wasm = false;
        this.handleSqliteMode(ev, showFileName, ev.size, ev.name);
      } else {
        info('Parse trace using wasm mode ');
        this.wasm = true;
        this.handleWasmMode(ev, showFileName, ev.size, ev.name);
      }
    };
  }

  private judgeZip(typeHeader: Blob): void {
    const fileReader = new FileReader();
    fileReader.readAsArrayBuffer(typeHeader);
    fileReader.onload = (event): void => {
      const uint8Array = new Uint8Array(event.target!.result as ArrayBuffer);
      this.isZipFile = isZipFile(uint8Array) || isZlibFile(uint8Array);
      if (this.isZipFile) {
        this.cutTraceFile!.style.display = this.isZipFile ? 'none' : 'block';
      }
    };
  }

  private openDistributedTraceFile(ev: InputEvent): void {
    this.openFileInit(true);
    this.importConfigDiv!.style.display = 'none';
    this.closeKeyPath!.style.display = 'none';
    // @ts-ignore
    let fileList = ev.detail as FileList;
    if (fileList.length === 2) {
      this.handleDistributedWasmMode(fileList.item(0)!, fileList.item(1)!);
    } else {
      this.progressEL!.loading = false;
      this.litSearch!.setPercent('load distributed trace error', -1);
      this.resetMenus();
      this.freshMenuDisable(false);
      this.headerDiv!.style.pointerEvents = 'auto';
    }
  }

  private openLineFileHandler(urlParams: URLSearchParams, jsonStr: string): void {
    Utils.currentTraceMode = TraceMode.NORMAL;
    this.openFileInit();
    this.openMenu(false);
    let downloadLineFile = urlParams.get('local') ? false : true;
    this.setProgress(downloadLineFile ? 'download trace file' : 'open trace file');
    let traceUrl = urlParams.get('trace') as string;
    let keyId = urlParams.get('AWSAccessKeyId') as string;
    let signature = urlParams.get('Signature') as string;
    let fullUrl = '';
    if (keyId && keyId.length && signature && signature.length) {
      const extractedString = this.extractTraceParams(window.location.href!);
      fullUrl = extractedString!
    } else {
      fullUrl = traceUrl;
    }

    this.downloadOnLineFile(
      fullUrl,
      downloadLineFile,
      (arrayBuf, fileName, showFileName, fileSize) => {
        if (fileName.split('.').reverse()[0] === 'db') {
          this.wasm = false;
          this.handleSqliteMode(new File([arrayBuf], fileName), showFileName, fileSize, fileName, jsonStr);
        } else {
          this.handleWasmMode(new File([arrayBuf], fileName), showFileName, fileSize, fileName, jsonStr);
        }
      },
      (localPath) => {
        let path = fullUrl;
        let fileName: string = '';
        let showFileName: string = '';
        if (urlParams.get('local')) {
          this.openMenu(true);
          fileName = urlParams.get('traceName') as string;
        } else {
          fileName = path.split('/').reverse()[0];
        }
        localPath = localPath.substr(1);
        this.traceFileName = fileName;
        showFileName = fileName.lastIndexOf('.') === -1 ? fileName : fileName.substring(0, fileName.lastIndexOf('.'));
        TraceRow.rangeSelectObject = undefined;
        let localUrl = downloadLineFile ? `${window.location.origin}${window.location.pathname}${localPath}` : fullUrl!;
        fetch(localUrl)
          .then((res) => {
            res.arrayBuffer().then((arrayBuf) => {
              if (urlParams.get('local')) {
                URL.revokeObjectURL(localUrl);
              }
              if (fileName.split('.').reverse()[0] === 'db') {
                this.wasm = false;
                this.handleSqliteMode(new File([arrayBuf], fileName), showFileName, arrayBuf.byteLength, fileName, jsonStr);
              } else {
                this.handleWasmMode(new File([arrayBuf], fileName), showFileName, arrayBuf.byteLength, fileName, jsonStr);
              }
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

  private extractTraceParams(url: string) {
    const traceIndex = url.indexOf('trace=');
    if (traceIndex !== -1) {
      return url.substring(traceIndex + 6);
    } else {
      return '';
    }
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
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.rootEL!.classList.contains('filedrag')) {
          this.rootEL!.classList.remove('filedrag');
        }
        //@ts-ignore
        if (e.dataTransfer.items !== undefined && e.dataTransfer.items.length > 0) {
          //@ts-ignore
          let item = e.dataTransfer.items[0];
          if (item.webkitGetAsEntry()?.isFile) {
            this.openTraceFile(item.getAsFile()!);
          } else if (item.webkitGetAsEntry()?.isDirectory) {
            this.litSearch!.setPercent('This File is not supported!', -1);
            this.progressEL!.loading = false;
            this.freshMenuDisable(false);
            this.mainMenu!.menus!.splice(2, 1);
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
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        //@ts-ignore
        if (e.dataTransfer.items.length > 0 && e.dataTransfer.items[0].kind === 'file') {
          //@ts-ignore
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
    document.addEventListener('file-error', () => {
      this.litSearch!.setPercent('This File is Error!', -1);
    });
    document.addEventListener('file-correct', () => {
      this.litSearch!.setPercent('', 101);
    });
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
      //@ts-ignore
      if (ctrlKey && this.keyCodeMap[e.keyCode]) {
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

  private initNavigationMenu(multiTrace: boolean): MenuGroup[] {
    return [
      {
        collapsed: false,
        title: 'Navigation',
        second: false,
        icon: 'caret-down',
        describe: 'Open or record a new trace',
        children: [
          {
            title: 'Open trace file',
            icon: 'folder',
            fileChoose: true,
            fileHandler: (ev: CustomEvent): void => {
              Utils.currentTraceMode = TraceMode.NORMAL;
              this.openTraceFile(ev.detail);
            },
          },
          {
            title: 'Record new trace',
            icon: 'copyhovered',
            clickHandler: (item: MenuItem): void => this.clickHandleByRecordNewTrace(),
          },
          {
            title: 'Record template',
            icon: 'copyhovered',
            clickHandler: (item: MenuItem): void => this.clickHandleByRecordTemplate(),
          },
        ],
      },
      {
        collapsed: !multiTrace,
        title: 'Open multiple trace',
        second: false,
        icon: 'caret-down',
        describe: 'long trace or distributed trace',
        children: [
          {
            title: 'Open long trace',
            icon: 'folder',
            fileChoose: true,
            clickHandler: (ev: CustomEvent): void => {
              Utils.currentTraceMode = TraceMode.LONG_TRACE;
              this.openLongTraceFile(ev, true);
            },
            fileHandler: (ev: CustomEvent): void => {
              Utils.currentTraceMode = TraceMode.LONG_TRACE;
              this.openLongTraceFile(ev);
            },
          },
          {
            title: 'Open distributed trace',
            icon: 'folder',
            multi: true,
            fileChoose: true,
            fileHandler: (ev: InputEvent): void => {
              Utils.currentTraceMode = TraceMode.DISTRIBUTED;
              this.openDistributedTraceFile(ev);
            },
          },
        ],
      },
    ];
  }

  private initSupportMenus(): MenuGroup {
    return {
      collapsed: false,
      title: 'Support',
      second: false,
      icon: 'caret-down',
      describe: 'Support',
      children: [
        {
          title: 'Help Documents',
          icon: 'smart-help',
          clickHandler: (item: MenuItem): void => this.clickHandleByHelpDocuments(),
        },
        {
          title: 'Flags',
          icon: 'menu',
          clickHandler: (item: MenuItem): void => this.clickHandleByFlags(),
        },
        {
          title: 'Keyboard Shortcuts',
          icon: 'smart-help',
          clickHandler: (item: MenuItem): void => this.clickHandleByKeyboardShortcuts(),
        }
      ],
    };
  }

  private clickHandleByHelpDocuments(): void {
    this.spHelp!.dark = this.dark;
    this.search = false;
    this.showContent(this.spHelp!);
    SpStatisticsHttpUtil.addOrdinaryVisitAction({
      event: 'help_page',
      action: 'help_doc',
    });
    this.changeUrl();
  }

  private clickHandleByFlags(): void {
    this.returnOriginalUrl();
    this.search = false;
    this.showContent(this.spFlags!);
    SpStatisticsHttpUtil.addOrdinaryVisitAction({
      event: 'flags',
      action: 'flags',
    });
  }

  private clickHandleByKeyboardShortcuts(): void {
    this.returnOriginalUrl();
    document
      .querySelector('body > sp-application')!
      .shadowRoot!.querySelector<HTMLDivElement>('#sp-keyboard')!.style.visibility = 'visible';
    SpSystemTrace.keyboardFlar = false;
    SpStatisticsHttpUtil.addOrdinaryVisitAction({
      event: 'Keyboard Shortcuts',
      action: 'Keyboard Shortcuts',
    });
  }

  private clickHandleByRecordNewTrace(): void {
    this.returnOriginalUrl();
    this.spRecordTrace!.synchronizeDeviceList();
    this.spRecordTrace!.record_template = 'false';
    this.spRecordTrace!.reConfigPage();
    this.spRecordTrace!.refreshConfig(true);
    this.showContent(this.spRecordTrace!);
  }

  private clickHandleByRecordTemplate(): void {
    this.returnOriginalUrl();
    this.spRecordTrace!.refreshHint();
    this.spRecordTrace!.record_template = 'true';
    this.spRecordTrace!.reConfigPage();
    this.spRecordTrace!.refreshConfig(false);
    this.spRecordTrace!.synchronizeDeviceList();
    this.showContent(this.spRecordTrace!);
  }

  private changeUrl(): void {
    let url = new URL(window.location.href);
    let actionParam = url.searchParams.get('action');
    let newActionValue = 'help';
    if (actionParam) {
      url.searchParams.set('action', newActionValue);
    } else {
      url.searchParams.append('action', newActionValue);
    }
    let newURL = url.href;
    history.pushState({}, '', newURL);
  }

  private returnOriginalUrl(): void {
    history.pushState({}, '', window.location.origin + window.location.pathname);
  }

  private handleSqliteMode(ev: unknown, showFileName: string, fileSize: number, fileName: string, jsonStr?: string): void {
    let fileSizeStr = (fileSize / 1048576).toFixed(1);
    postLog(fileName, fileSizeStr);
    document.title = `${showFileName} (${fileSizeStr}M)`;
    this.litSearch!.setPercent('', 0);
    threadPool.init('sqlite').then((res) => {
      let reader = new FileReader();
      reader.readAsArrayBuffer(ev as Blob);
      reader.onloadend = (ev): void => {
        SpApplication.loadingProgress = 0;
        SpApplication.progressStep = 3;
        let data = this.markPositionHandler(reader.result as ArrayBuffer);
        this.spSystemTrace!.loadDatabaseArrayBuffer(
          data,
          '', '',
          (command: string, _: number) => {
            this.setProgress(command);
          },
          false,
          () => {
            if (this.markJson) {
              window.publish(window.SmartEvent.UI.ImportRecord, this.markJson);
            }
            if (jsonStr) {
              window.publish(window.SmartEvent.UI.ImportRecord, jsonStr);
            }
            this.mainMenu!.menus!.splice(2, this.mainMenu!.menus!.length > 2 ? 1 : 0, {
              collapsed: false,
              title: 'Current Trace',
              second: false,
              icon: 'caret-down',
              describe: 'Actions on the current trace',
              children: this.getTraceOptionMenus(showFileName, fileSizeStr, fileName, true, false),
            });
            this.mainMenu!.menus!.splice(3, 1, {
              collapsed: false,
              title: 'Support',
              second: false,
              icon: 'caret-down',
              describe: 'Support',
              children: this.getTraceSupportMenus(),
            });
            this.litSearch!.setPercent('', 101);
            this.chartFilter!.setAttribute('mode', '');
            this.progressEL!.loading = false;
            this.freshMenuDisable(false);
            this.spInfoAndStats!.initInfoAndStatsData();
            this.cutTraceFile!.style.display = 'none';
            this.exportRecord!.style.display = 'none';
            this.headerDiv!.style.pointerEvents = 'auto';
          }
        );
      };
    });
  }

  private handleDistributedWasmMode(file1: File, file2: File): void {
    this.litSearch!.setPercent('', 1);
    document.title = 'Distributed Trace';
    let completeHandler = async (res: unknown): Promise<void> => {
      await this.traceLoadCompleteHandler(res, '', '', file1.name, true, file2.name);
    };
    let typeHeader = file1.slice(0, 6);
    let reader: FileReader | null = new FileReader();
    reader.readAsText(typeHeader);
    reader.onloadend = (event): void => {
      let headerStr: string = `${reader?.result}`;
      let traceType = 'wasm';
      if (headerStr.indexOf('SQLite') === 0) {
        traceType = 'sqlite';
      }
      Promise.all([threadPool.init(traceType), threadPool2.init(traceType)]).then(() => {
        let wasmUrl = `https://${window.location.host.split(':')[0]}:${window.location.port}${window.location.pathname}wasm.json`;
        let configUrl = `https://${window.location.host.split(':')[0]}:${window.location.port}${window.location.pathname}config/config.json`;
        Promise.all([file1.arrayBuffer(), file2.arrayBuffer()]).then((bufArr) => {
          this.litSearch!.setPercent('ArrayBuffer loaded  ', 2);
          SpApplication.loadingProgress = 0;
          SpApplication.progressStep = 2;
          let buf1 = this.markPositionHandler(bufArr[0]);
          let buf2 = this.markPositionHandler(bufArr[1]);
          info('initData start Parse Data');
          this.spSystemTrace!.loadDatabaseArrayBuffer(
            buf1,
            wasmUrl, configUrl,
            (command: string, _: number) => this.setProgress(command),
            true,
            completeHandler,
            buf2,
            file1.name,
            file2.name
          );
        });
      });
    };
  }

  private handleWasmMode(ev: unknown, showFileName: string, fileSize: number, fileName: string, jsonStr?: string): void {
    this.litSearch!.setPercent('', 1);
    if (fileName.endsWith('.json')) {
      this.progressEL!.loading = true;
      //@ts-ignore
      self.spSystemTrace!.loadSample(ev).then(() => {
        this.showContent(this.spSystemTrace!);
        this.litSearch!.setPercent('', 101);
        this.freshMenuDisable(false);
        this.chartFilter!.setAttribute('mode', '');
        this.progressEL!.loading = false;
      });
    } else if (fileName.endsWith('.csv')) {
      this.progressEL!.loading = true;
      this.spSystemTrace!.loadGpuCounter(ev as File).then(() => {
        this.showContent(this.spSystemTrace!);
        this.litSearch!.setPercent('', 101);
        this.freshMenuDisable(false);
        this.chartFilter!.setAttribute('mode', '');
        this.progressEL!.loading = false;
      });
    } else {
      let fileSizeStr = (fileSize / 1048576).toFixed(1);
      postLog(fileName, fileSizeStr);
      document.title = `${showFileName} (${fileSizeStr}M)`;
      info('Parse trace using wasm mode ');
      let completeHandler = async (res: unknown): Promise<void> => {
        await this.traceLoadCompleteHandler(res, fileSizeStr, showFileName, fileName, false);
        if (this.markJson) {
          window.publish(window.SmartEvent.UI.ImportRecord, this.markJson);
        }
        if (jsonStr) {
          window.publish(window.SmartEvent.UI.ImportRecord, jsonStr);
        }
      };
      threadPool.init('wasm').then((res) => {
        let reader: FileReader = new FileReader();
        //@ts-ignore
        reader.readAsArrayBuffer(ev);
        reader.onloadend = (ev): void => {
          info('read file onloadend');
          this.litSearch!.setPercent('ArrayBuffer loaded  ', 2);
          let wasmUrl = `https://${window.location.host.split(':')[0]}:${window.location.port}${window.location.pathname}wasm.json`;
          let configUrl = `https://${window.location.host.split(':')[0]}:${window.location.port}${window.location.pathname}config/config.json`;
          SpApplication.loadingProgress = 0;
          SpApplication.progressStep = 3;
          let data = this.markPositionHandler(reader.result as ArrayBuffer);
          info('initData start Parse Data');
          this.spSystemTrace!.loadDatabaseArrayBuffer(
            data,
            wasmUrl, configUrl,
            (command: string, _: number) => this.setProgress(command),
            false,
            completeHandler
          );
        };
      });
    }
  }

  private markPositionHandler(buf: ArrayBuffer): ArrayBuffer {
    const decoder = new TextDecoder('utf-8');
    const headText = decoder.decode(buf.slice(0, 100));
    let hasMark = headText.includes('MarkPositionJSON');
    if (hasMark) {
      let markLength = headText.split('->')[0].replace('MarkPositionJSON', '');
      let mark = decoder.decode(buf.slice(0, markLength.length + parseInt(markLength)));
      if (mark.includes('->')) {
        this.markJson = mark.split('->')[1];
      }
      return buf.slice(markLength.length + parseInt(markLength));
    } else {
      return buf;
    }
  }

  private async traceLoadCompleteHandler(
    res: unknown,
    fileSize: string,
    showFileName: string,
    fileName: string,
    isDistributed: boolean,
    fileName2?: string
  ): Promise<void> {
    let index = 3;
    if (isDistributed) {
      //分布式，隐藏 裁剪 trace 和 导出带记录的收藏trace 功能
      this.cutTraceFile!.style.display = 'none';
      this.exportRecord!.style.display = 'none';
      this.litSearch?.setAttribute('distributed', '');
      setThreadPoolTraceBuffer('1', null);
      setThreadPoolTraceBuffer('2', null);
    } else {
      let existFtrace = await queryExistFtrace();
      let isAllowTrace = true;
      let sharedBuffer = getThreadPoolTraceBuffer('1');
      if (sharedBuffer) {
        let traceHeadData = new Uint8Array(sharedBuffer!.slice(0, 10));
        let enc = new TextDecoder();
        let headerStr = enc.decode(traceHeadData);
        let rowTraceStr = Array.from(new Uint8Array(sharedBuffer!.slice(0, 2)))
          .map((byte) => byte.toString(16).padStart(2, '0'))
          .join('');
        if (headerStr.indexOf('OHOSPROF') !== 0 && rowTraceStr.indexOf('49df') !== 0) {
          isAllowTrace = false;
        }
        this.cutTraceFile!.style.display = this.isZipFile ? 'none' : 'block';
        this.exportRecord!.style.display = 'block';
        setThreadPoolTraceBuffer('1', null);
      }
      if (existFtrace.length > 0 && isAllowTrace) {
        this.showConvertTraceMenu(fileName);
        index = 4;
      }
    }

    this.loadTraceCompleteMenuHandler(index);
    //@ts-ignore
    if (res.status) {
      info('loadDatabaseArrayBuffer success');
      if (isDistributed) {
        Utils.distributedTrace.push(fileName || 'trace1');
        Utils.distributedTrace.push(fileName2 || 'trace2');
        this.litSearch!.setTraceSelectOptions();
      } else {
        //@ts-ignore
        (window as unknown).traceFileName = fileName;
      }
      this.showCurrentTraceMenu(fileSize, showFileName, fileName, isDistributed);
      SpApplication.isTraceLoaded = true;
      if (!isDistributed) {
        this.importConfigDiv!.style.display = Utils.getInstance().getSchedSliceMap().size > 0 ? 'block' : 'none';
      } 
      this.showContent(this.spSystemTrace!);
      this.litSearch!.setPercent('', 101);
      this.chartFilter!.setAttribute('mode', '');
      this.freshMenuDisable(false);
      Utils.currentTraceName = fileName;
    } else {
      
      info('loadDatabaseArrayBuffer failed');
      //@ts-ignore
      this.litSearch!.setPercent(res.msg || 'This File is not supported!', -1);
      this.resetMenus();
      Utils.currentTraceName = '';
      this.freshMenuDisable(false);
    }
    loadTraceCompleteEvent();
    this.progressEL!.loading = false;
    this.headerDiv!.style.pointerEvents = 'auto';
    this.spInfoAndStats!.initInfoAndStatsData();
  }

  private resetMenus(multiTrace: boolean = false): void {
    this.mainMenu!.menus = [...this.initNavigationMenu(multiTrace), this.initSupportMenus()];
  }

  private showConvertTraceMenu(fileName: string): void {
    this.mainMenu!.menus!.splice(3, 1, {
      collapsed: false,
      title: 'Convert trace',
      second: false,
      icon: 'caret-down',
      describe: 'Convert to other formats',
      children: this.pushConvertTrace(fileName),
    });
  }

  private showCurrentTraceMenu(fileSize: string, showFileName: string, fileName: string, isDistributed: boolean): void {
    this.mainMenu!.menus!.splice(2, this.mainMenu!.menus!.length > 2 ? 1 : 0, {
      collapsed: false,
      title: 'Current Trace',
      second: false,
      icon: 'caret-down',
      describe: 'Actions on the current trace',
      children: this.getTraceOptionMenus(showFileName, fileSize, fileName, false, isDistributed),
    });
  }

  private loadTraceCompleteMenuHandler(index: number): void {
    this.mainMenu!.menus!.splice(index, 1, {
      collapsed: false,
      title: 'Support',
      second: false,
      icon: 'caret-down',
      describe: 'Support',
      children: [
        {
          title: 'Help Documents',
          icon: 'smart-help',
          clickHandler: (item: MenuItem): void => this.clickHandleByHelpDocuments(),
        },
        {
          title: 'Flags',
          icon: 'menu',
          clickHandler: (item: MenuItem): void => this.clickHandleByFlags(),
        },
        {
          title: 'Keyboard Shortcuts',
          icon: 'smart-help',
          clickHandler: (item: MenuItem): void => this.clickHandleByKeyboardShortcuts(),
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
  ): void {
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
        let timeStamp =
          this.currentDataTime[0] +
          this.currentDataTime[1] +
          this.currentDataTime[2] +
          '_' +
          this.currentDataTime[3] +
          this.currentDataTime[4] +
          this.currentDataTime[5];
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
        this.refreshLongTraceButtonStyle();
        this.longTracePage!.style.display = 'flex';
      });
    });
  }

  private refreshLongTraceButtonStyle(): void {
    let pageListDiv = this.shadowRoot?.querySelector('.page-number-list') as HTMLDivElement;
    let pageNodeList = pageListDiv.querySelectorAll<HTMLDivElement>('div');
    let pageInput = this.shadowRoot?.querySelector<HTMLInputElement>('.page-input');
    let previewButton: HTMLDivElement | null | undefined =
      this.shadowRoot?.querySelector<HTMLDivElement>('#preview-button');
    let nextButton: HTMLDivElement | null | undefined = this.shadowRoot?.querySelector<HTMLDivElement>('#next-button');
    let pageConfirmEl = this.shadowRoot?.querySelector<HTMLDivElement>('.confirm-button');
    pageInput!.style.pointerEvents = 'auto';
    pageNodeList.forEach((pageItem) => {
      pageItem.style.pointerEvents = 'auto';
    });
    nextButton!.style.pointerEvents = 'auto';
    nextButton!.style.opacity = '1';
    previewButton!.style.pointerEvents = 'auto';
    previewButton!.style.opacity = '1';
    if (this.currentPageNum === 1) {
      previewButton!.style.pointerEvents = 'none';
      previewButton!.style.opacity = '0.7';
    } else if (this.currentPageNum === this.longTraceHeadMessageList.length) {
      nextButton!.style.pointerEvents = 'none';
      nextButton!.style.opacity = '0.7';
    }
    //
    pageConfirmEl!.style.pointerEvents = 'auto';
  }

  private getTraceFileByPage(pageNumber: number): void {
    this.openFileInit(true);
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
        (res: Array<unknown>) => {
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

  private openFileInit(multiTrace: boolean = false): void {
    clearTraceFileCache();
    this.litSearch!.clear();
    this.spAiAnalysisPage!.clear();
    Utils.currentSelectTrace = undefined;
    this.markJson = undefined;
    if (!multiTrace) {
      this.longTracePage!.style.display = 'none';
    }
    this.litSearch?.removeAttribute('distributed');
    SpStatisticsHttpUtil.addOrdinaryVisitAction({
      event: 'open_trace',
      action: 'open_trace',
    });
    info('openTraceFile');
    this.headerDiv!.style.pointerEvents = 'none';
    this.spSystemTrace!.clearPointPair();
    this.spSystemTrace!.reset((command: string, percent: number): void => {
      this.setProgress(command);
    });
    threadPool2.reset().then();
    window.publish(window.SmartEvent.UI.MouseEventEnable, {
      mouseEnable: false,
    });
    window.clearTraceRowComplete();
    SpSchedulingAnalysis.resetCpu();
    this.resetMenus(multiTrace);
    this.freshMenuDisable(true);
    this.showContent(this.spSystemTrace!);
    this.progressEL!.loading = true;
  }

  private restoreDownLoadIcons(): void {
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

  private pushConvertTrace(fileName: string): Array<MenuItem> {
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
                  if (fileName.indexOf('.htrace') > 0) {
                    SpStatisticsHttpUtil.addOrdinaryVisitAction({
                      event: 'convert_systrace',
                      action: 'convert_systrace',
                    });
                  }
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
    isDistributed: boolean,
    dbName?: string
  ): Array<MenuItem> {
    let menus = [
      {
        title: isDistributed ? 'Distributed Trace' : `${showFileName} (${fileSize}M)`,
        icon: 'file-fill',
        clickHandler: (): void => {
          this.search = true;
          this.showContent(this.spSystemTrace!);
        },
      },
    ];
    if (
      !isDistributed &&
      Utils.getInstance().getWinCpuCount() > 0 &&
      FlagsConfig.getFlagsConfigEnableStatus('SchedulingAnalysis')
    ) {
      menus.push({
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
      });
    }
    if (!isDistributed) {
      menus.push({
        title: 'Download File',
        icon: 'download', // @ts-ignore
        fileModel: this.wasm ? 'wasm' : 'db',
        clickHandler: (): void => {
          this.download(this.mainMenu!, fileName, isServer, dbName);
          SpStatisticsHttpUtil.addOrdinaryVisitAction({
            event: 'download',
            action: 'download',
          });
        },
      });
      menus.push({
        title: 'Download Database',
        icon: 'download', // @ts-ignore
        fileModel: this.wasm ? 'wasm' : 'db',
        clickHandler: (): void => {
          this.downloadDB(this.mainMenu!, fileName);
          SpStatisticsHttpUtil.addOrdinaryVisitAction({
            event: 'download_db',
            action: 'download',
          });
        },
      });
      this.getTraceQuerySqlMenus(menus);
    }
    return menus;
  }

  private getTraceSupportMenus(): Array<MenuItem> {
    return [
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
        fileModel: this.wasm ? 'wasm' : 'db',
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
        title: 'Keyboard Shortcuts',
        icon: 'smart-help',
        clickHandler: (item: MenuItem): void => {
          document
            .querySelector('body > sp-application')!
            .shadowRoot!.querySelector<HTMLDivElement>('#sp-keyboard')!.style.visibility = 'visible';
          SpStatisticsHttpUtil.addOrdinaryVisitAction({
            event: 'Keyboard Shortcuts',
            action: 'Keyboard Shortcuts',
          });
        },
      },
      {
        title: '第三方文件',
        icon: 'file-fill',
        fileModel: this.wasm ? 'wasm' : 'db',
        clickHandler: (item: MenuItem): void => {
          this.search = false;
          this.showContent(this.spThirdParty!);
        },
      },
    ];
  }

  private getTraceQuerySqlMenus(menus: Array<unknown>): void {
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
          fileModel: this.wasm ? 'wasm' : 'db',
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
      if (this.sidebarButton) {
        this.sidebarButton.style.width = '0px';
        this.importConfigDiv!.style.left = '5px';
        this.contentLeftOption!.style.left = '5px';
        this.closeKeyPath!.style.left = '25px';
      }
      if (this.mainMenu) {
        this.mainMenu.style.width = '248px';
        this.mainMenu.style.zIndex = '2000';
        this.mainMenu.style.display = 'flex';
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
        this.contentLeftOption!.style.left = '45px';
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
      //@ts-ignore
      this.litSearch!.setPercent(err, -1);
      this.progressEL!.loading = false;
      this.freshMenuDisable(false);
    }); //@ts-ignore
    window.subscribe(window.SmartEvent.UI.Loading, (arg: { loading: boolean; text?: string }) => {
      if (arg.text) {
        this.litSearch!.setPercent(arg.text || '', arg.loading ? -1 : 101);
      }
      if (this.headerDiv) {
        this.headerDiv.style.pointerEvents = arg.loading ? 'none' : 'auto';
      }
      window.publish(window.SmartEvent.UI.MouseEventEnable, {
        mouseEnable: !arg.loading,
      });
      this.progressEL!.loading = arg.loading;
    });
  }

  private initEvents(): void {
    this.addEventListener('copy', function (event) {
      SpSystemTrace.isMouseLeftDown = false;
      let clipdata = event.clipboardData;
      let value = clipdata!.getData('text/plain');
      let searchValue = value.toString().trim();
      clipdata!.setData('text/plain', searchValue);
    });
    this.initSearchEvents();
    this.initSystemTraceEvents();
    this.filterConfig!.addEventListener('click', (ev) => {
      SpSystemTrace.isMouseLeftDown = false;
      this.filterRowConfigClickHandle();
    });
    this.configClose!.addEventListener('click', (ev) => {
      this.filterRowConfigClickHandle();
    });
    this.cutTraceFile!.addEventListener('click', (ev) => {
      this.validateFileCacheLost();
      if (this.isClear && !this.isOpenTrace) {
        let search = document.querySelector('body > sp-application')!.shadowRoot!.querySelector<LitSearch>('#lit-search');
        let progressEL = document.querySelector("body > sp-application")!.shadowRoot!.querySelector<LitProgressBar>("div > div.search-vessel > lit-progress-bar");
        progressEL!.loading = false;
        search!.setPercent('import the trace file again...', -3);
      } else {
        this.croppingFile(this.progressEL!, this.litSearch!);
      }
    });

    let aiAnalysis = this.shadowRoot
      ?.querySelector('lit-main-menu')!
      .shadowRoot!.querySelector('.ai_analysis') as HTMLDivElement;
    aiAnalysis!.addEventListener('click', (ev) => {
      if (this.spAiAnalysisPage!.style.visibility === 'hidden' || this.spAiAnalysisPage!.style.display === 'none') {
        this.spAiAnalysisPage!.style.display = 'block';
        this.spAiAnalysisPage!.style.visibility = 'visible';
      } else {
        this.spAiAnalysisPage!.style.visibility = 'hidden';
        this.spAiAnalysisPage!.style.display = 'none';
      }
    })

    this.spAiAnalysisPage!.valueChangeHandler = (value: string, id: number): void => {
      this.litSearch!.valueChangeHandler!(this.litSearch!.trimSideSpace(value), id);
    };

    // 鼠标拖动改变大小
    this.aiPageResize();
    addExportDBToParentEvent();
  }

  private aiPageResize(): void {
    const resizableDiv = this.spAiAnalysisPage!;
    let isResizing = false;
    resizableDiv.addEventListener('mousemove', (e) => {
      if (Math.abs(e.clientX - resizableDiv.getBoundingClientRect().left) < 5) {
        resizableDiv.style.cursor = 'e-resize';
      } else {
        resizableDiv.style.cursor = 'default';
      }
    })

    resizableDiv.addEventListener('mousedown', function (e) {
      isResizing = true;
      let iframe = document.querySelector('body > sp-application')?.shadowRoot!.querySelector<SpHelp>('#sp-help')?.shadowRoot?.querySelector('#myIframe');
      // @ts-ignore
      let iframeWindow = iframe?.contentWindow;
      if (e.clientX - resizableDiv.getBoundingClientRect().left < 5) {
        document.addEventListener('mousemove', changeAiWidth);
        iframeWindow?.addEventListener('mousemove', iframeChangeAiWidth);
      }
      document.addEventListener('mouseup', mouseUp);
      iframeWindow?.addEventListener('mouseup', mouseUp);
    });

    function iframeChangeAiWidth(e: unknown): void {
      let iframe = document.querySelector('body > sp-application')?.shadowRoot!.querySelector<SpHelp>('#sp-help')?.shadowRoot?.querySelector('#myIframe');
      // @ts-ignore
      let iframeWindow = iframe?.contentWindow;
      resizableDiv.style.cursor = 'e-resize';
      // @ts-ignore
      resizableDiv.style.width = iframeWindow.innerWidth - e.clientX + 'px';
    }

    function changeAiWidth(e: unknown): void {
      resizableDiv.style.cursor = 'e-resize';
      // @ts-ignore
      resizableDiv.style.width = window.innerWidth - e.clientX + 'px';
    }

    function mouseUp(): void {
      isResizing = false;
      document.removeEventListener('mousemove', changeAiWidth);
      document.removeEventListener('mouseup', mouseUp);

      let iframe = document.querySelector('body > sp-application')?.shadowRoot!.querySelector<SpHelp>('#sp-help')?.shadowRoot?.querySelector('#myIframe');
      // @ts-ignore
      let iframeWindow = iframe?.contentWindow;
      iframeWindow?.removeEventListener('mousemove', iframeChangeAiWidth);
      iframeWindow?.removeEventListener('mouseup', mouseUp);
    }
  }

  private filterRowConfigClickHandle(): void {
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
  }

  private initRecordEvents(): void {
    this.exportRecord?.addEventListener('click', () => {
      this.headerDiv!.style.pointerEvents = 'none';
      window.publish(window.SmartEvent.UI.Loading, { loading: true, text: 'Downloading trace file with mark' });
      window.publish(window.SmartEvent.UI.ExportRecord, { bt: this.exportRecord });
    });
  }

  private initSearchChangeEvents(): void {
    let timer: NodeJS.Timeout;
    this.litSearch!.valueChangeHandler = (value: string, id: number = -1): void => {
      Utils.currentSelectTrace = this.litSearch?.getSearchTraceId();
      this.litSearch!.currenSearchValue = value;
      if (value.length > 0) {
        this.progressEL!.loading = true;
      } else {
        this.progressEL!.loading = false;
      }
      if (this.litSearch!.list.length > 0) {
        let currentEntry = this.litSearch!.list[this.litSearch!.index];
        cancelCurrentTraceRowHighlight(this.spSystemTrace!, currentEntry);
      }
      this.litSearch!.list = [];
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        this.litSearch!.isClearValue = false;
        if (value.length > 0) {
          let list = [];
          this.spSystemTrace!.searchCPU(value).then((cpus) => {
            list = cpus;
            let asyncFuncArr = this.spSystemTrace!.seachAsyncFunc(value);
            this.spSystemTrace!.searchFunction(list, asyncFuncArr, value).then((mixedResults) => {
              if (this.litSearch!.searchValue !== '' || id > -1) {
                if (!Utils.isDistributedMode()) {
                  this.litSearch!.list = this.spSystemTrace!.searchSdk(mixedResults, value);
                } else {
                  this.litSearch!.list = mixedResults;
                }
                if (id > -1) {
                  this.litSearch!.list = this.litSearch!.list.filter((v: unknown) => {
                    // @ts-ignore
                    return v.id === id;
                  });
                  let input = this.litSearch!.shadowRoot?.querySelector('input') as HTMLInputElement;
                  // @ts-ignore
                  input.value = this.litSearch!.list[0]!.funName;
                }
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
      }, 1000);
    };
  }
  private initSearchEvents(): void {
    this.litSearch!.addEventListener('previous-data', (ev) => {
      if (this.progressEL!.loading) {
        return;
      }
      this.litSearch!.index = this.spSystemTrace!.showStruct(true, this.litSearch!.index, this.litSearch!.list);
      this.litSearch!.blur();
    });
    this.litSearch!.addEventListener('next-data', (ev) => {
      if (this.progressEL!.loading) {
        return;
      }
      this.litSearch!.index = this.spSystemTrace!.showStruct(false, this.litSearch!.index, this.litSearch!.list);
      this.litSearch!.blur();
    });
    // 翻页事件
    this.litSearch!.addEventListener('retarget-data', (ev) => {
      if (this.progressEL!.loading) {
        return;
      }
      this.litSearch!.index = this.spSystemTrace!.showStruct(
        false,
        //@ts-ignore
        ev.detail.value,
        this.litSearch!.list,
        //@ts-ignore
        ev.detail.value
      );
      this.litSearch!.blur();
    });
    this.litSearch!.addEventListener('trace-change', (e): void => {
      this.spSystemTrace?.clickEmptyArea();
      this.spSystemTrace!.searchTargetTraceHandler();
    });
    this.initSearchChangeEvents();
  }

  private initSystemTraceEvents(): void {
    this.spSystemTrace?.addEventListener('trace-previous-data', (ev) => {
      if (this.progressEL!.loading) {
        return;
      }
      this.litSearch!.index = this.spSystemTrace!.showStruct(true, this.litSearch!.index, this.litSearch!.list);
    });
    this.spSystemTrace?.addEventListener('trace-next-data', (ev) => {
      if (this.progressEL!.loading) {
        return;
      }
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
      this.contentRightOption!.style.display = 'flex';
      this.contentLeftOption!.style.display = 'flex';
      this.contentCenterOption!.style.display = 'flex';
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
      this.contentRightOption!.style.display = 'none';
      this.contentLeftOption!.style.display = 'none';
      this.contentCenterOption!.style.display = 'none';
      if (!this.search) {
        this.litSearch!.style.display = 'none';
        this.litRecordSearch!.style.display = 'block';
      }
      window.publish(window.SmartEvent.UI.KeyboardEnable, {
        enable: false,
      });
      this.filterConfig!.style.visibility = 'hidden';
      this.removeAttribute('chart_filter');
      this.chartFilter!.setAttribute('hidden', '');
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
        let recordSetting = document.querySelector('body > sp-application')?.shadowRoot?.querySelector('#sp-record-trace')?.shadowRoot?.querySelector('#app-content > record-setting');
        ShadowRootInput.preventBubbling(recordSetting!);
        //@ts-ignore
      } else if (node.id! === 'sp-ai-analysis' && node.style!.visibility! === 'visible') {
        return;
      } else {
        (node! as HTMLElement).style.visibility = 'hidden';
      }
    });
  }

  private validateFileCacheLost(): void {
    caches.has(getThreadPoolTraceBufferCacheKey('1')).then((exist): void => {
      if (!exist) {
        this.mainMenu!.menus?.forEach((mg) => {
          mg.children.forEach((mi: MenuItem) => {
            if (mi.title === 'Download File') {
              mi.disabled = true;
            }
          });
        });
        this.isClear = true;
        this.isOpenTrace = false;
        this.mainMenu!.menus = this.mainMenu!.menus;
      } else {
        this.isClear = false;
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
      pageInput.style.pointerEvents = 'none';
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
          //@ts-ignore
          if (res.ok || res.success) {
            res.arrayBuffer().then((arrayBuf) => {
              let urlParams = new URL(url).searchParams;
              let fileName = urlParams.get('name') ? decodeURIComponent(urlParams.get('name')!) : url.split('/').reverse()[0];
              this.traceFileName = fileName;
              let showFileName =
                fileName.lastIndexOf('.') === -1 ? fileName : fileName.substring(0, fileName.lastIndexOf('.'));
              openUrl(arrayBuf, fileName, showFileName, arrayBuf.byteLength);
            });
          } else {
            let api = `${window.location.origin}${window.location.pathname}download-file`;
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
          }
        })
        .catch((e) => {
          let api = `${window.location.origin}${window.location.pathname}download-file`;
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
    let recordStartNS = window.recordStartNS;
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
        if (cutBuffer !== undefined && cutBuffer.byteLength <= 12) {
          this.litSearch!.setPercent('The cut is empty data. Select a time range for valid data!', -1);
          this.progressEL!.loading = false;
          this.freshMenuDisable(false);
          return;
        }
        let blobUrl = URL.createObjectURL(new Blob([cutBuffer!]));
        window.open(
          `index.html?link=true&local=true&traceName=${encodeURIComponent(
            traceName
          )}_cut_${cutLeftTs}${fileType}&trace=${encodeURIComponent(blobUrl)}`
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
      async (reqBufferDB: ArrayBuffer) => {
        let a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([reqBufferDB]));
        a.download = fileName;
        a.click();
        this.itemIconLoading(mainMenu, 'Current Trace', 'Download Database', true);
        let timer = setInterval(async () => {
          this.itemIconLoading(mainMenu, 'Current Trace', 'Download Database', false);
          clearInterval(timer);
        }, 4000);
        // 存入缓存
        const blob = new Blob([reqBufferDB]);
        const response = new Response(blob);
        caches.open('DB-file').then(cache => {
          return cache.put(`/${fileName}`, response);
        });
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
    this.itemIconLoading(mainMenu, 'Current Trace', 'Download File', true);
    let timer = setInterval(() => {
      this.itemIconLoading(mainMenu, 'Current Trace', 'Download File', false);
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

  static displaySnapShot(selectSnapShotStruct: SnapShotStruct | undefined) {
    this.spSnapShotView!.style.display = 'block';
    this.spSnapShotView!.style.visibility = 'visible';
    this.spSnapShotView?.init(selectSnapShotStruct!)
  }
}
