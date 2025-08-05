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

import { BaseElement, element } from '../../base-ui/BaseElement';
import '../../base-ui/popover/LitPopover';
import '../../base-ui/button/LitButton';
import { LitMainMenuGroup } from '../../base-ui/menu/LitMainMenuGroup';
import { LitMainMenuItem } from '../../base-ui/menu/LitMainMenuItem';
import { SpRecordSetting } from './setting/SpRecordSetting';
import { LitMainMenu, MenuGroup, MenuItem } from '../../base-ui/menu/LitMainMenu';
import { SpProbesConfig } from './setting/SpProbesConfig';
import { SpTraceCommand } from './setting/SpTraceCommand';
import { HdcStream } from '../../hdc/hdcclient/HdcStream';
import { FlagsConfig } from './SpFlags';
import LitSwitch from '../../base-ui/switch/lit-switch';
import { LitSlider } from '../../base-ui/slider/LitSlider';

import { CreateSessionRequest } from './setting/bean/ProfilerServiceTypes';
import { PluginConvertUtils } from './setting/utils/PluginConvertUtils';
import { SpAllocations } from './setting/SpAllocations';
import { SpRecordPerf } from './setting/SpRecordPerf';
import { HdcDeviceManager } from '../../hdc/HdcDeviceManager';
import { LitButton } from '../../base-ui/button/LitButton';
import { SpApplication } from '../SpApplication';
import { LitSearch } from './trace/search/Search';
import { LitProgressBar } from '../../base-ui/progress-bar/LitProgressBar';
import { log } from '../../log/Log';
import { CmdConstant } from '../../command/CmdConstant';
import { Cmd } from '../../command/Cmd';
import { SpFileSystem } from './setting/SpFileSystem';
import { SpSdkConfig } from './setting/SpSdkConfig';
import { SpVmTracker } from './setting/SpVmTracker';
import { SpHisysEvent } from './setting/SpHisysEvent';
import { SpRecordTemplate } from './setting/SpRecordTemplate';
import { SpStatisticsHttpUtil } from '../../statistics/util/SpStatisticsHttpUtil';
import { SpArkTs } from './setting/SpArkTs';
import { SpWebHdcShell } from './setting/SpWebHdcShell';
import { SpHilogRecord } from './setting/SpHilogRecord';
import { SpXPowerRecord } from './setting/SpXPowerRecord';
import { LongTraceDBUtils } from '../database/LongTraceDBUtils';
import {
  createFpsPluginConfig,
  createHTracePluginConfig,
  createHiPerfConfig,
  createMemoryPluginConfig,
  createMonitorPlugin,
  createNativePluginConfig,
  createSessionRequest,
  createSystemConfig,
  createSdkConfig,
  createHiSystemEventPluginConfig,
  createArkTsConfig,
  createHiLogConfig, createFFRTPluginConfig,
  createXPowerConfig,
} from './SpRecordConfigModel';
import { SpRecordTraceHtml } from './SpRecordTrace.html';
import { SpFFRTConfig } from './setting/SpFFRTConfig';
import { ShadowRootInput } from './trace/base/ShadowRootInput';
import { WebSocketManager } from '../../webSocket/WebSocketManager';
import { TypeConstants } from '../../webSocket/Constants';
import { LitCheckBox } from '../../base-ui/checkbox/LitCheckBox';
const DEVICE_NOT_CONNECT =
  '<div>1.请确认抓取设备上是否已勾选并确认总是允许smartPerf-Host调试的弹窗</div>' +
  '<div>2.请关闭DevEco Studio,DevEco Testing等会占用hdc端口的应用</div>' +
  '<div>3.确保PC端任务管理器中没有hdc进程。方法1、请使用系统管理员权限打开cmd窗口，并执行hdc kill；<br/>方法2、打开任务管理器，进入详情信息页面，找到 hdc.exe 然后结束此进程；</div>' +
  '<div>4.若没有效果，请重新插拔一下手机。紧急情况可拷贝trace命令，在cmd窗口离线抓取</div>';

@element('sp-record-trace')
export class SpRecordTrace extends BaseElement {
  public static serialNumber: string = '';
  public static selectVersion: string | null;
  public static isVscode = false;
  public static cancelRecord = false;
  static supportVersions = ['3.2', '4.0+', '5.0+'];
  public deviceSelect: HTMLSelectElement | undefined;
  public deviceVersion: HTMLSelectElement | undefined;
  private _menuItems: Array<MenuItem> | undefined;
  private recordButtonText: HTMLSpanElement | undefined;
  private devicePrompt: HTMLSpanElement | undefined;
  private recordButton: LitButton | undefined;
  private cancelButton: LitButton | undefined;
  private sp: SpApplication | undefined;
  private progressEL: LitProgressBar | undefined;
  private litSearch: LitSearch | undefined;
  private addButton: LitButton | undefined | null;
  private disconnectButton: LitButton | undefined | null;
  private recordSetting: SpRecordSetting | undefined;
  private probesConfig: SpProbesConfig | undefined;
  private traceCommand: SpTraceCommand | undefined;
  private spAllocations: SpAllocations | undefined;
  private spRecordPerf: SpRecordPerf | undefined;
  private spFileSystem: SpFileSystem | undefined;
  private spSdkConfig: SpSdkConfig | undefined;
  private spVmTracker: SpVmTracker | undefined;
  private spHiSysEvent: SpHisysEvent | undefined;
  private spRecordTemplate: SpRecordTemplate | undefined;
  private spArkTs: SpArkTs | undefined;
  private spHiLog: SpHilogRecord | undefined;
  private spXPower: SpXPowerRecord | undefined;
  private spFFRTConfig: SpFFRTConfig | undefined;
  private ftraceSlider: LitSlider | undefined | null;
  private spWebShell: SpWebHdcShell | undefined;
  private menuGroup: LitMainMenuGroup | undefined | null;
  private appContent: HTMLElement | undefined | null;
  private optionNum: number = 0;
  private record = 'Record';
  private stop = 'StopRecord';
  private nowChildItem: HTMLElement | undefined;
  private longTraceList: Array<string> = [];
  private fileList: Array<{
    fileName: string,
    file: File
  }> = [];
  private refreshDeviceTimer: number | undefined;
  private hintEl: HTMLSpanElement | undefined;
  private selectedTemplate: Map<string, number> = new Map();
  private hintTimeOut: number = -1;
  private MenuItemArkts: MenuItem | undefined | null;
  private MenuItemArktsHtml: LitMainMenuItem | undefined | null;
  private hdcList: Array<unknown> = [];
  public useExtendCheck: LitCheckBox | undefined | null;
  public static useExtend = false;
  private useExtentTip: HTMLElement | undefined | null;
  private usbSerialNum: Array<string> = [];
  public static allProcessListStr: string;
  public static usbGetCpuCount: string;
  public static usbGetEvent: string;
  public static usbGetApp: string;
  private static usbGetVersion: string;
  public static usbGetHisystem: string;
  static snapShotList: Array<unknown> = [];
  static snapShotDuration: number = 0;
  static isSnapShotCapture: boolean = false;

  set record_template(re: string) {
    if (re === 'true') {
      this.setAttribute('record_template', 'true');
    } else {
      this.setAttribute('record_template', 'false');
    }
    if (this.recordSetting) {
      this.recordSetting.isRecordTemplate = re === 'true' ? true : false;
    }
  }

  get record_template(): string {
    return this.getAttribute('record_template')!;
  }

  set vs(vs: boolean) {
    if (vs) {
      SpRecordTrace.isVscode = true;
      this.setAttribute('vs', '');
    } else {
      SpRecordTrace.isVscode = false;
      this.removeAttribute('vs');
    }
  }

  get vs(): boolean {
    return this.hasAttribute('vs');
  }

  private compareArray(devs: Array<string>): boolean {
    let clearFlag: boolean = false;
    if (devs.length !== this.deviceSelect!.options.length) {
      clearFlag = true;
    } else {
      let optionArray: string[] = [];
      for (let index = 0; index < this.deviceSelect!.options.length; index++) {
        optionArray.push(this.deviceSelect!.options[index].value);
      }
      devs.forEach((value): void => {
        if (optionArray.indexOf(value) === -1) {
          clearFlag = true;
        }
      });
    }
    return clearFlag;
  }

  private async refreshDeviceList(sn?: unknown): Promise<void> {
    if (this.vs) {
      this.refreshDeviceListByVs();
    } else {
      this.deviceSelect!.innerHTML = '';
      // @ts-ignore
      HdcDeviceManager.getDevices().then(async (devs: USBDevice[]) => {
        if (devs.length === 0) {
          this.recordButton!.hidden = true;
          this.disconnectButton!.hidden = true;
          this.cancelButton!.hidden = true;
          this.devicePrompt!.innerText = 'Device not connected';
          this.hintEl!.innerHTML = DEVICE_NOT_CONNECT;
          if (!this.showHint) {
            this.showHint = true;
          }
        }
        this.hdcList = devs;
        let optionNum = 0;
        for (let len = 0; len < devs.length; len++) {
          let dev = devs[len];
          let option = document.createElement('option');
          option.className = 'select';
          if (typeof dev.serialNumber === 'string') {
            optionNum++;
            option.value = dev.serialNumber;
            option.textContent = dev!.serialNumber ? dev!.serialNumber!.toString() : 'hdc Device';
            this.deviceSelect!.appendChild(option);
            if (dev.serialNumber === sn) {
              option.selected = true;
              this.recordButton!.hidden = false;
              this.disconnectButton!.hidden = false;
              this.cancelButton!.hidden = true;
              this.showHint = false;
              this.devicePrompt!.innerText = '';
              this.hintEl!.textContent = '';
              SpRecordTrace.serialNumber = option.value;
              this.refreshDeviceVersion(option);
            }
          }
        }
        if (!optionNum) {
          this.deviceSelect!.style!.border = '2px solid red';
          setTimeout(() => {
            this.deviceSelect!.style!.border = '1px solid #4D4D4D';
          }, 3000);
          this.recordButton!.hidden = true;
          this.disconnectButton!.hidden = true;
          this.cancelButton!.hidden = true;
          this.devicePrompt!.innerText = 'Device not connected';
          this.hintEl!.innerHTML = DEVICE_NOT_CONNECT;
          if (!this.showHint) {
            this.showHint = true;
          }
        }
      });
    }
  }
  private refreshDeviceVersion(option: HTMLOptionElement): void {
    HdcDeviceManager.connect(option.value).then(async (result) => {
      if (result) {
        if (this.MenuItemArkts && this.MenuItemArktsHtml) {//连接成功后，arkts开关置灰不能点击
          this.MenuItemArktsHtml.style.color = 'gray';
          this.MenuItemArktsHtml.disabled = true;
          if (this.MenuItemArkts.clickHandler) {
            this.MenuItemArkts.clickHandler = undefined;
          }
        }
        HdcDeviceManager.shellResultAsString(CmdConstant.CMD_GET_VERSION, false).then((version) => {
          SpRecordTrace.selectVersion = this.getDeviceVersion(version);
          this.setDeviceVersionSelect(SpRecordTrace.selectVersion);
          this.nativeMemoryHideBySelectVersion();
          this.traceCommand!.hdcCommon = PluginConvertUtils.createHdcCmd(
            PluginConvertUtils.BeanToCmdTxt(this.makeRequest(), false),
            this.recordSetting!.output,
            this.recordSetting!.maxDur
          );
          if (this.nowChildItem === this.spWebShell) {
            window.publish(window.SmartEvent.UI.DeviceConnect, option.value);
          }
        });
      } else {
        SpRecordTrace.selectVersion = SpRecordTrace.supportVersions[0];
        this.setDeviceVersionSelect(SpRecordTrace.selectVersion);
        this.nativeMemoryHideBySelectVersion();
        let cmdTxt = PluginConvertUtils.BeanToCmdTxt(this.makeRequest(), false);
        this.traceCommand!.hdcCommon = PluginConvertUtils.createHdcCmd(
          cmdTxt,
          this.recordSetting!.output,
          this.recordSetting!.maxDur
        );
      }
    });
  }
  private refreshDeviceListByVs(): void {
    Cmd.execHdcCmd(CmdConstant.CMD_HDC_DEVICES, (res: string) => {
      let devs: string[] = res.trim().replace(/\r\n/g, '\r').replace(/\n/g, '\r').split(/\r/);
      if (devs.length === 1 && devs[0].indexOf('Empty') !== -1) {
        this.deviceSelect!.innerHTML = '';
        return;
      }
      let clearFlag = this.compareArray(devs);
      if (clearFlag) {
        this.deviceSelect!.innerHTML = '';
        if (devs.length === 0) {
          this.recordButton!.hidden = true;
          this.disconnectButton!.hidden = true;
          this.devicePrompt!.innerText = 'Device not connected';
        }
        for (let i = 0; i < devs.length; i++) {
          let dev = devs[i];
          let option = document.createElement('option');
          option.className = 'select';
          option.textContent = dev;
          this.deviceSelect!.appendChild(option);
          if (i === 0) {
            option.selected = true;
            this.recordButton!.hidden = false;
            this.disconnectButton!.hidden = false;
            SpRecordTrace.serialNumber = option.value;
            this.devicePrompt!.innerText = '';
          }
        }
      }
    });
  }

  private getDeviceVersion(version: string): string {
    if (version.indexOf('3.2') !== -1) {
      return '3.2';
    } else if (version.indexOf('4.') !== -1) {
      return '4.0+';
    } else if (version.indexOf('5.') !== -1) {
      return '5.0+';
    }
    return '3.2';
  }

  private freshMenuDisable(disable: boolean): void {
    let mainMenu = this.sp!.shadowRoot?.querySelector('#main-menu') as LitMainMenu;
    mainMenu.menus?.forEach((men): void => {
      // @ts-ignore
      men.children.forEach((child: HTMLElement): void => {
        // @ts-ignore
        child.disabled = disable;
      });
    });
    mainMenu.menus = mainMenu.menus;
  }

  refreshConfig(isTraceConfig: boolean): void {
    let recordSettingEl = this.shadowRoot?.querySelector('record-setting') as SpRecordSetting;
    if (recordSettingEl) {
      if (isTraceConfig) {
        recordSettingEl.setAttribute('trace_config', '');
      } else {
        if (recordSettingEl.hasAttribute('trace_config')) {
          recordSettingEl.removeAttribute('trace_config');
        }
      }
    }
  }

  refreshHint(): void {
    let flags = FlagsConfig.getAllFlagConfig();
    let showHint = false;
    for (let i = 0; i < flags.length; i++) {
      let flag = flags[i];
      if (this.selectedTemplate.has(flag.title)) {
        let selectedOption = flag.switchOptions.filter((option) => {
          return option.selected;
        });
        if (selectedOption[0].option === 'Disabled') {
          showHint = true;
          break;
        }
      }
    }
    this.showHint = showHint;
  }

  get showHint(): boolean {
    return this.hasAttribute('show_hint');
  }

  set showHint(bool: boolean) {
    if (bool) {
      if (this.hasAttribute('show_hint')) {
        this.removeAttribute('show_hint');
        this.hintTimeOut = window.setTimeout(() => {
          this.setAttribute('show_hint', '');
        }, timeOut);
      } else {
        this.setAttribute('show_hint', '');
      }
    } else {
      if (this.hintTimeOut !== -1) {
        window.clearTimeout(this.hintTimeOut);
        this.hintTimeOut = -1;
      }
      this.removeAttribute('show_hint');
    }
  }

  initElements(): void {
    let parentElement = this.parentNode as HTMLElement;
    if (parentElement) {
      parentElement.style.overflow = 'hidden';
    }
    this.sp = document.querySelector('sp-application') as SpApplication;
    if (!this.shadowRoot || !this.sp) {
      return;
    }
    this.initConfigPage();
    this.hintEl = this.shadowRoot.querySelector('#hint') as HTMLSpanElement;
    this.deviceSelect = this.shadowRoot.querySelector('#device-select') as HTMLSelectElement;
    this.deviceVersion = this.shadowRoot.querySelector('#device-version') as HTMLSelectElement;
    this.devicePrompt = this.shadowRoot.querySelector('.prompt') as HTMLSpanElement;
    this.disconnectButton = this.shadowRoot.querySelector<LitButton>('.disconnect');
    this.recordButton = this.shadowRoot.querySelector('.record') as LitButton;
    this.recordButtonText = this.shadowRoot.querySelector('.record_text') as HTMLSpanElement;
    this.cancelButton = this.shadowRoot.querySelector('.cancel') as LitButton;
    this.progressEL = this.sp.shadowRoot?.querySelector('.progress') as LitProgressBar;
    this.litSearch = this.sp.shadowRoot?.querySelector('#lit-record-search') as LitSearch;
    this.menuGroup = this.shadowRoot.querySelector('#menu-group') as LitMainMenuGroup;
    this.addButton = this.shadowRoot.querySelector<LitButton>('.add');
    if (this.record_template === 'true') {
      this.buildTemplateTraceItem();
    } else {
      this.buildNormalTraceItem();
    }
    this.initMenuItems();
    this.appendDeviceVersion();
    if (this.deviceSelect.options && this.deviceSelect.options.length > 0) {
      this.disconnectButton!.hidden = false;
      this.recordButton.hidden = false;
      this.cancelButton!.hidden = false;
      this.devicePrompt.innerText = '';
    } else {
      this.disconnectButton!.hidden = true;
      this.recordButton.hidden = true;
      this.cancelButton!.hidden = true;
      this.devicePrompt.innerText = 'Device not connected';
    }
    this.useExtendCheck = this.shadowRoot?.querySelector('#use-extend-check') as LitCheckBox;
    this.useExtentTip = this.shadowRoot?.querySelector('#record_tip') as HTMLElement;
    this.useExtendCheck?.addEventListener('change', (ev): void => {
      // @ts-ignore
      let detail = ev.detail;
      SpRecordTrace.useExtend = detail.checked;
      this.initMenuItems();
      this.buildNormalTraceItem();
      this.usbSerialNum = [];
      SpRecordTrace.serialNumber = '';
      this.recordButton!.hidden = true;
      this.disconnectButton!.hidden = true;
      this.cancelButton!.hidden = true;
      // @ts-ignore
      while (this.deviceSelect!.firstChild) {
        this.deviceSelect!.removeChild(this.deviceSelect!.firstChild); // 删除子节点
      }
      this.devicePrompt!.innerText = 'Device not connected';
      if (!detail.checked) {
        this.spArkTs!.litSwitch!.checked = false;
        this.spArkTs!.memoryDisable();
        this.spArkTs!.disable();
        this.useExtentTip!.style.display = 'none';
        this.useExtentTip!.innerHTML = '';
      }
    });
    this.spArkTs?.addEventListener('showTip', () => {
      this.isShowTipFunc('Ark Ts', this.spArkTs!.isStartArkts);
    });
    this.recordSetting?.addEventListener('showTip', (event) => {// @ts-ignore
      this.isShowTipFunc(event.detail.value, event.detail.isShow);
    });
  }

  isShowTipFunc(text: string, isShow: boolean): void {
    if (isShow) {
      let guideSrc = `https://${window.location.host.split(':')[0]}:${window.location.port}${window.location.pathname}?action=help_27`;
      this.useExtentTip!.style.display = 'block';
      // @ts-ignore
      this.useExtentTip!.innerHTML = `若要抓取${text}，请勾选 Use local hdc 开关，启动后台扩展服务进行抓取，相关指导: [</span style="cursor: pointer;"><a href=${guideSrc} style="color: blue;" target="_blank">指导</a><span>]`;
    } else {
      this.useExtentTip!.style.display = 'none';
      this.useExtentTip!.innerHTML = '';
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.addButton!.addEventListener('click', this.addButtonClickEvent);
    this.deviceSelect!.addEventListener('mousedown', this.deviceSelectMouseDownEvent);
    this.deviceSelect!.addEventListener('change', this.deviceSelectChangeEvent);
    this.deviceVersion!.addEventListener('change', this.deviceVersionChangeEvent);
    this.disconnectButton?.addEventListener('click', this.disconnectButtonClickEvent);
    this.recordButton?.addEventListener('mousedown', this.recordButtonMouseDownEvent);
    this.cancelButton?.addEventListener('click', this.cancelRecordListener);
    this.spRecordPerf?.addEventListener('addProbe', this.recordAddProbeEvent);
    this.spAllocations?.addEventListener('addProbe', this.recordAddProbeEvent);
    this.probesConfig?.addEventListener('addProbe', this.recordAddProbeEvent);
    this.spRecordTemplate?.addEventListener('addProbe', this.recordTempAddProbe);
    this.spRecordTemplate?.addEventListener('delProbe', this.recordTempDelProbe);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.addButton!.removeEventListener('click', this.addButtonClickEvent);
    this.deviceSelect!.removeEventListener('mousedown', this.deviceSelectMouseDownEvent);
    this.deviceSelect!.removeEventListener('change', this.deviceSelectChangeEvent);
    this.deviceVersion!.removeEventListener('change', this.deviceVersionChangeEvent);
    this.disconnectButton?.removeEventListener('click', this.disconnectButtonClickEvent);
    this.recordButton?.removeEventListener('mousedown', this.recordButtonMouseDownEvent);
    this.cancelButton?.removeEventListener('click', this.cancelRecordListener);
    this.spRecordPerf?.removeEventListener('addProbe', this.recordAddProbeEvent);
    this.spAllocations?.removeEventListener('addProbe', this.recordAddProbeEvent);
    this.probesConfig?.removeEventListener('addProbe', this.recordAddProbeEvent);
    this.spRecordTemplate?.removeEventListener('addProbe', this.recordTempAddProbe);
    this.spRecordTemplate?.removeEventListener('delProbe', this.recordTempDelProbe);
  }

  recordPluginFunc = (): void => {
    this.useExtentTip!.style.display = 'none';
    this.useExtentTip!.innerHTML = '';

    this.sp!.search = true;
    this.progressEL!.loading = true;
    this.litSearch!.setPercent('Waiting to record...', -1);
    this.initRecordCmdStatus();
    let request = this.makeRequest(false);
    let htraceCmd = PluginConvertUtils.createHdcCmd(
      PluginConvertUtils.BeanToCmdTxt(request, false),
      this.recordSetting!.output,
      this.recordSetting!.maxDur
    );

    let encoder = new TextEncoder();
    let processName = this.spArkTs!.process.trim();
    let isRecordArkTs = (this.spArkTs!.isStartArkts && processName !== '') ? true : false; //是否抓取arkts trace
    let isRecordHitrace = request.pluginConfigs.length > 0 ? true : false; // 是否抓取其他模块 hitrace

    let isStartCpuProfiler = this.spArkTs!.isStartCpuProfiler; //cpu Profiler 开关是否打开
    let isStartMemoryProfiler = this.spArkTs!.isStartMemoryProfiler; //memory Profiler 开关是否打开
    let isCheckSnapshot = this.spArkTs!.radioBoxType === 0 ? true : false; // 是否check snapshot
    let isCheckTimeLine = this.spArkTs!.radioBoxType === 1 ? true : false; // 是否 check timeline

    let isLongTrace = SpApplication.isLongTrace;
    let maxDur = this.recordSetting!.maxDur; // 抓取trace的时长
    let snapShotDur = this.recordSetting!.snapShot;//截图
    SpRecordTrace.snapShotDuration = snapShotDur;
    let snapshotTimeInterval = this.spArkTs!.intervalValue;
    let cpuProfTimeInt = this.spArkTs!.intervalCpuValue;
    let captureNumericValue = this.spArkTs!.grabNumeric; // snapshot check box
    let trackAllocations = this.spArkTs!.grabAllocations; // timeline check box
    let enableCpuProfiler = this.spArkTs!.isStartCpuProfiler;

    let params: unknown = {
      isLongTrace: isLongTrace,
      isRecordArkTs: isRecordArkTs,
      isRecordHitrace: isRecordHitrace,
      type: '',
      processName: processName,
      maxDur: maxDur,
      snapShotDur: snapShotDur,
      snapshotTimeInterval: snapshotTimeInterval,
      cpuProfilerInterval: cpuProfTimeInt,
      captureNumericValue: captureNumericValue,
      trackAllocations: trackAllocations,
      enableCpuProfiler: enableCpuProfiler,
      htraceCmd: htraceCmd,
      output: this.recordSetting!.output,
      serialNum: SpRecordTrace.serialNumber
    };

    if (isStartCpuProfiler && !isStartMemoryProfiler) { // @ts-ignore
      params.type = 'cpuProf';
    } else if (!isStartCpuProfiler && isStartMemoryProfiler && isCheckSnapshot) {// @ts-ignore
      params.type = 'snapshot';
    } else if (!isStartCpuProfiler && isStartMemoryProfiler && isCheckTimeLine) {// @ts-ignore
      params.type = 'timeline';
    } else if (isStartCpuProfiler && isStartMemoryProfiler && isCheckSnapshot) {// @ts-ignore
      params.type = 'cpuProf_snapshot';
    } else if (isStartCpuProfiler && isStartMemoryProfiler && isCheckTimeLine) {// @ts-ignore
      params.type = 'cpuProf_timeline';
    }

    let onmessageCallBack = (cmd: number, result: unknown): void => {// @ts-ignore
      if (cmd === 2 && result.byteLength > 0) {
        let name = this.recordSetting!.output.split('/').reverse()[0];// @ts-ignore
        let file = new File([result], name);
        let main = this!.parentNode!.parentNode!.querySelector('lit-main-menu') as LitMainMenu;
        let children = main.menus as Array<MenuGroup>;
        let child = children[0].children as Array<MenuItem>;
        let fileHandler = child[0].fileHandler;
        if (fileHandler) {
          this.refreshDisableStyle(false, false);
          this.recordButton!.hidden = false;
          this.cancelButton!.hidden = true;
          fileHandler({
            detail: file,
          });
        }
      } else if (cmd === 3) {
        this.sp!.search = false;
        this.progressEL!.loading = false;// @ts-ignore
        let errorMsg = new TextDecoder().decode(result);
        this.useExtentTip!.style.display = 'block';
        let urlAsciiArr = [104, 116, 116, 112, 115, 58, 47, 47, 119, 105, 107, 105, 46, 104, 117, 97, 119, 101, 105, 46, 99, 111, 109, 47, 100, 111, 109, 97, 105, 110, 115, 47, 55, 54, 57, 49, 49, 47, 119, 105, 107, 105, 47, 49, 50, 53, 52, 56, 48, 47, 87, 73, 75, 73, 50, 48, 50, 53, 48, 49, 49, 54, 53, 55, 53, 48, 52, 53, 52];
        let exceptGuid = String.fromCodePoint(...urlAsciiArr);
        this.useExtentTip!.innerHTML = `抓取trace异常：${errorMsg} 可根据[<span style='cursor:pointer;'><a href=${exceptGuid} syule = 'color:blue;' target='_blank'>常见异常处理</a></span>]解决异常`;
        this.refreshDisableStyle(false, false);
        this.recordButton!.hidden = false;
        this.cancelButton!.hidden = true;
        this.sp!.search = false;
        this.progressEL!.loading = false;
      } else if (cmd === 4) {
        let aElement = document.createElement('a');// @ts-ignore
        aElement.href = URL.createObjectURL(new Blob([result!]));
        aElement.download = 'arkts.htrace';
        aElement.click();
      } else if (cmd === 5) {// @ts-ignore
        SpRecordTrace.snapShotList = JSON.parse(new TextDecoder('utf-8').decode(result)) as string[];
        SpRecordTrace.isSnapShotCapture = true;
      } else if (cmd === 6) {
        this.litSearch!.setPercent('Start to record...', -1);
      } else if (cmd === 7) {
        this.litSearch!.setPercent('Tracing htrace down', -1);
      } else if (cmd === 8) {
        this.litSearch!.setPercent('Downloading Hitrace file...', -1);
      } else if (cmd === 9) {// @ts-ignore
        let re = JSON.parse(new TextDecoder('utf-8').decode(result));
        let binaryString = window.atob(re.data);
        let len = binaryString.length;
        let bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        re.data = bytes.buffer;
        let fileInfo = {
          fileName: re.fileName,
          file: new File([re.data], re.fileName)
        };
        this.fileList.push(fileInfo);
        this.longTraceList.push(fileInfo.fileName);
        if (this.fileList.length === re.total) {
          this.openLongTraceHandle();
        }
      }
    };
    WebSocketManager.getInstance()!.registerMessageListener(TypeConstants.ARKTS_TYPE, onmessageCallBack, this.eventCallBack);
    WebSocketManager.getInstance()!.sendMessage(TypeConstants.ARKTS_TYPE, 1, encoder.encode(JSON.stringify(params)));
  };

  async openLongTraceHandle() {
    this.fileList.sort((a, b) => {
      const getNumber = (name: string) => {
        const match = name.match(/_(\d+)\.htrace$/);
        return match ? parseInt(match[1]) : 0;
      };
      return getNumber(a.fileName) - getNumber(b.fileName);
    });
    let timStamp = new Date().getTime();
    this.sp!.longTraceHeadMessageList = [];
    for (const fileInfo of this.fileList) {
      await this.saveLongTrace(fileInfo.file, timStamp);
    }
    await this.openLongTrace(timStamp);
    this.fileList = [];
    this.longTraceList = [];
  }

  async saveLongTrace(file: File, timStamp: number) {
    let traceTypePage = this.getLongTraceTypePage();
    let types = this.sp!.fileTypeList.filter(type =>
      file.name.toLowerCase().includes(type.toLowerCase())
    );
    let pageNumber = 0;
    let fileType = types[0] || 'trace';
    if (types.length === 0) {
      let searchNumber = Number(
        file.name.substring(
          file.name.lastIndexOf('_') + 1,
          file.name.lastIndexOf('.')
        )
      ) - 1;
      pageNumber = traceTypePage.lastIndexOf(searchNumber);
    }
    this.litSearch!.setPercent(`downloading ${fileType} file`, 101);
    await this.saveIndexDBByLongTrace(file, fileType, pageNumber, timStamp);
  }

  async openLongTrace(timStamp: number) {
    let main = this.parentNode!.parentNode!.querySelector('lit-main-menu') as LitMainMenu;
    let children = main.menus as Array<MenuGroup>;
    let child = children[1].children as Array<MenuItem>;
    let fileHandler = child[0].clickHandler;
    if (fileHandler && !SpRecordTrace.cancelRecord) {
      this.freshConfigMenuDisable(false);
      this.freshMenuDisable(false);
      this.buttonDisable(false);
      this.recordButtonDisable(false);
      fileHandler({
        detail: {
          timeStamp: timStamp
        }
      }, true);
    } else {
      SpRecordTrace.cancelRecord = false;
    }
  }

  recordTempAddProbe = (ev: CustomEventInit<{ elementId: string }>): void => {
    if (
      FlagsConfig.DEFAULT_CONFIG.find((flagItem) => {
        return flagItem.title === ev.detail!.elementId;
      })
    ) {
      this.selectedTemplate.set(ev.detail!.elementId, 1);
      let flagConfig = FlagsConfig.getFlagsConfig(ev.detail!.elementId);
      if (flagConfig![ev.detail!.elementId] !== 'Enabled') {
        this.hintEl!.textContent = 'Please open the corresponding Flags tag when parsing';
        if (!this.showHint) {
          this.showHint = true;
        }
      }
    }
  };

  recordTempDelProbe = (ev: CustomEventInit<{ elementId: string }>): void => {
    if (
      FlagsConfig.DEFAULT_CONFIG.find((flagItem): boolean => {
        return flagItem.title === ev.detail!.elementId;
      })
    ) {
      this.selectedTemplate.delete(ev.detail!.elementId);
      if (this.selectedTemplate.size === 0) {
        this.showHint = false;
      }
    }
  };

  recordAddProbeEvent = (): void => {
    this.showHint = false;
  };

  addButtonClickEvent = (event: MouseEvent): void => {
    if (SpRecordTrace.useExtend) {
      this.useExtentTip!.innerHTML = '';
      this.useExtentTip!.style.display = 'none';
      WebSocketManager.getInstance()!.registerMessageListener(TypeConstants.USB_TYPE, this.webSocketCallBackasync, this.eventCallBack);
      WebSocketManager.getInstance()!.sendMessage(TypeConstants.USB_TYPE, TypeConstants.USB_SN_CMD);
    } else if (this.vs) {
      this.refreshDeviceList();
    } else {
      // @ts-ignore
      HdcDeviceManager.findDevice().then((usbDevices): void => {
        log(usbDevices);
        HdcDeviceManager.connect(usbDevices.serialNumber).then((res) => {
          if (res) {
            this.refreshDeviceList(usbDevices.serialNumber);
          } else {
            this.recordButton!.hidden = true;
            this.disconnectButton!.hidden = true;
            this.cancelButton!.hidden = true;
            this.devicePrompt!.innerText = 'Device not connected';
            this.hintEl!.innerHTML = DEVICE_NOT_CONNECT;
            if (!this.showHint) {
              this.showHint = true;
            }
          }
        });
      });
    }
  };

  eventCallBack = (result: string): void => {
    this.recordButton!.hidden = true;
    this.disconnectButton!.hidden = true;
    this.cancelButton!.hidden = true;
    this.disconnectButtonClickEvent();
    this.useExtentTip!.style.display = 'block';
    // @ts-ignore
    this.useExtentTip!.innerHTML = this.getStatusesPrompt()[result].prompt;
  };

  getStatusesPrompt(): unknown {
    let guideSrc = `https://${window.location.host.split(':')[0]}:${window.location.port
      }${window.location.pathname}?action=help_27`;
    return {
      unconnected: {
        prompt: `未连接，请启动本地扩展程序再试！[</span style="cursor: pointer;"><a href=${guideSrc} style="color: blue;" target="_blank">指导</a><span>]`
      }, // 重连
      connected: {
        prompt: '扩展程序连接中，请稍后再试'
      }, // 中间
      logined: {
        prompt: '扩展程序连接中，请稍后再试'
      }, // 中间
      loginFailedByLackSession: {
        prompt: '当前所有会话都在使用中，请释放一些会话再试！'
      }, // 重连
      upgrading: {
        prompt: '扩展程序连接中，请稍后再试！'
      }, // 中间
      upgradeSuccess: {
        prompt: '扩展程序已完成升级，重启中，请稍后再试！'
      }, // 重连
      upgradeFailed: {
        prompt: '刷新页面触发升级，或卸载扩展程序重装！'
      }, // 重连
    };
  };

  usbGetVersion(dev: string) {
    let option = document.createElement('option');
    option.className = 'select';
    this.optionNum++;
    // @ts-ignore
    option.value = dev;
    // @ts-ignore
    option.textContent = dev.toString();
    this.deviceSelect!.appendChild(option);
    if (dev.toString() === SpRecordTrace.serialNumber || SpRecordTrace.serialNumber === '') {
      SpRecordTrace.serialNumber = dev;
      option.selected = true;
      this.recordButton!.hidden = false;
      this.disconnectButton!.hidden = false;
      this.cancelButton!.hidden = true;
      this.devicePrompt!.innerText = '';
      this.hintEl!.textContent = '';
      // @ts-ignore
      WebSocketManager.getInstance()!.sendMessage(TypeConstants.USB_TYPE, TypeConstants.USB_GET_VERSION, new TextEncoder().encode(dev));
      setTimeout(() => {
        if (SpRecordTrace.usbGetVersion) {
          SpRecordTrace.selectVersion = this.getDeviceVersion(SpRecordTrace.usbGetVersion);
          this.setDeviceVersionSelect(SpRecordTrace.selectVersion);
          this.nativeMemoryHideBySelectVersion();
        }
      }, 1000);
    }
  }

  webSocketCallBackasync = (cmd: number, result: Uint8Array): void => {
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(result);
    let jsonRes = JSON.parse(jsonString);
    if (cmd === TypeConstants.USB_SN_CMD) {
      this.hdcList = jsonRes.resultMessage;
      HdcDeviceManager.findDevice().then((usbDevices): void => {
        SpRecordTrace.serialNumber = usbDevices.serialNumber;
        this.usbSerialNum = jsonRes.resultMessage;
        this.optionNum = 0;
        if (this.usbSerialNum.length === 1) {
          if (this.usbSerialNum[0].includes('Empty')) {
            this.usbSerialNum.shift();
            this.recordButton!.hidden = true;
            this.disconnectButton!.hidden = true;
            this.cancelButton!.hidden = true;
            this.devicePrompt!.innerText = 'Device not connected';
            this.deviceSelect!.style!.border = '2px solid red';
            setTimeout(() => {
              this.deviceSelect!.style!.border = '1px solid #4D4D4D';
            }, 3000);
            this.useExtentTip!.style.display = 'block';
            this.useExtentTip!.innerHTML = '手机连接有问题，请重新插拔一下手机，或者请使用系统管理员权限打开cmd窗口，并执行hdc shell';
            return;
          }else{
            this.usbGetVersion(this.usbSerialNum[0]);
          }
        }else if(this.usbSerialNum.length > 1 && usbDevices.serialNumber === ''){
          this.usbSerialNum.shift();
            this.recordButton!.hidden = true;
            this.disconnectButton!.hidden = true;
            this.cancelButton!.hidden = true;
            this.devicePrompt!.innerText = 'Device not connected';
            this.deviceSelect!.style!.border = '2px solid red';
            setTimeout(() => {
              this.deviceSelect!.style!.border = '1px solid #4D4D4D';
            }, 3000);
            this.useExtentTip!.style.display = 'block';
            this.useExtentTip!.innerHTML = '加密设备仅限连接一台';
            return;
        }
        // @ts-ignore
        while (this.deviceSelect!.firstChild) {
          this.deviceSelect!.removeChild(this.deviceSelect!.firstChild); // 删除子节点
        }
        for (let len = 0; len < this.usbSerialNum.length; len++) {
          let dev = this.usbSerialNum[len];
          this.usbGetVersion(dev);
        }
        if (!this.optionNum) {
          this.deviceSelect!.style!.border = '2px solid red';
          setTimeout(() => {
            this.deviceSelect!.style!.border = '1px solid #4D4D4D';
          }, 3000);
          this.recordButton!.hidden = true;
          this.disconnectButton!.hidden = true;
          this.cancelButton!.hidden = true;
          this.devicePrompt!.innerText = 'Device not connected';
          this.useExtentTip!.style.display = 'block';
          this.useExtentTip!.innerHTML = '手机连接有问题，请重新插拔一下手机，或者请使用系统管理员权限打开cmd窗口，并执行hdc shell';
        }
      });
    } else if (cmd === TypeConstants.USB_GET_PROCESS) {
      // @ts-ignore
      SpRecordTrace.allProcessListStr = jsonRes.resultMessage;
    } else if (cmd === TypeConstants.USB_GET_CPU_COUNT) {
      SpRecordTrace.usbGetCpuCount = jsonRes.resultMessage;
    } else if (cmd === TypeConstants.USB_GET_EVENT) {
      SpRecordTrace.usbGetEvent = jsonRes.resultMessage;
    } else if (cmd === TypeConstants.USB_GET_APP) {
      SpRecordTrace.usbGetApp = jsonRes.resultMessage;
    } else if (cmd === TypeConstants.USB_GET_VERSION) {
      SpRecordTrace.usbGetVersion = jsonRes.resultMessage;
    } else if (cmd === TypeConstants.USB_GET_HISYSTEM) {
      SpRecordTrace.usbGetHisystem = jsonRes.resultMessage;
    }
  };

  deviceSelectMouseDownEvent = (evt: MouseEvent): void => {
    if (this.deviceSelect!.options.length === 0) {
      evt.preventDefault();
    }
  };

  deviceSelectChangeEvent = (): void => {
    if (this.deviceSelect!.options.length > 0) {
      this.recordButton!.hidden = false;
      this.disconnectButton!.hidden = false;
      this.cancelButton!.hidden = false;
      this.devicePrompt!.innerText = '';
    } else {
      this.recordButton!.hidden = true;
      this.disconnectButton!.hidden = true;
      this.cancelButton!.hidden = true;
      this.devicePrompt!.innerText = 'Device not connected';
    }

    if (SpRecordTrace.useExtend) {
      let deviceItem = this.deviceSelect!.options[this.deviceSelect!.selectedIndex];
      let value = deviceItem.value;
      SpRecordTrace.serialNumber = value;
      return;
    }

    let deviceItem = this.deviceSelect!.options[this.deviceSelect!.selectedIndex];
    let value = deviceItem.value;
    SpRecordTrace.serialNumber = value;
    if (this.vs) {
      let cmd = Cmd.formatString(CmdConstant.CMD_GET_VERSION_DEVICES, [SpRecordTrace.serialNumber]);
      Cmd.execHdcCmd(cmd, (deviceVersion: string) => {
        this.selectedDevice(deviceVersion);
        this.traceCommand!.hdcCommon = PluginConvertUtils.createHdcCmd(
          PluginConvertUtils.BeanToCmdTxt(this.makeRequest(), false),
          this.recordSetting!.output,
          this.recordSetting!.maxDur
        );
      });
    } else {
      HdcDeviceManager.connect(value).then((result): void => {
        if (result) {
          HdcDeviceManager.shellResultAsString(CmdConstant.CMD_GET_VERSION, true).then((deviceVersion) => {
            this.selectedDevice(deviceVersion);
            this.traceCommand!.hdcCommon = PluginConvertUtils.createHdcCmd(
              PluginConvertUtils.BeanToCmdTxt(this.makeRequest(), false),
              this.recordSetting!.output,
              this.recordSetting!.maxDur
            );
            if (this.nowChildItem === this.spWebShell) {
              window.publish(window.SmartEvent.UI.DeviceConnect, value);
            }
          });
        } else {
          SpRecordTrace.selectVersion = SpRecordTrace.supportVersions[0];
          this.setDeviceVersionSelect(SpRecordTrace.selectVersion);
          this.traceCommand!.hdcCommon = PluginConvertUtils.createHdcCmd(
            PluginConvertUtils.BeanToCmdTxt(this.makeRequest(), false),
            this.recordSetting!.output,
            this.recordSetting!.maxDur
          );
        }
      });
    }
  };

  deviceVersionChangeEvent = (): void => {
    let versionItem = this.deviceVersion!.options[this.deviceVersion!.selectedIndex];
    SpRecordTrace.selectVersion = versionItem.getAttribute('device-version');
    this.spAllocations!.startup_mode = false;
    this.spAllocations!.recordJsStack = false;
    this.nativeMemoryHideBySelectVersion();
    this.traceCommand!.hdcCommon = PluginConvertUtils.createHdcCmd(
      PluginConvertUtils.BeanToCmdTxt(this.makeRequest(), false),
      this.recordSetting!.output,
      this.recordSetting!.maxDur
    );
  };

  disconnectButtonClickEvent = (): void => {
    this.setDeviceVersionSelect('5.0+');
    let index = this.deviceSelect!.selectedIndex;
    if (index !== -1 && this.deviceSelect!.options.length > 0) {
      for (let i = 0; i < this.deviceSelect!.options.length; i++) {
        let selectOption = this.deviceSelect!.options[i];
        let value = selectOption.value;
        HdcDeviceManager.disConnect(value).then((): void => {
          this.deviceSelect!.removeChild(selectOption);
          if (this.nowChildItem === this.spWebShell) {
            window.publish(window.SmartEvent.UI.DeviceDisConnect, value);
          }
          let options = this.deviceSelect!.options;
          if (options.length <= 0) {
            this.recordButton!.hidden = true;
            this.disconnectButton!.hidden = true;
            this.cancelButton!.hidden = true;
            this.devicePrompt!.innerText = 'Device not connected';
            this.sp!.search = false;
            SpRecordTrace.serialNumber = '';
          }
        });
      }
    }
  };

  recordButtonMouseDownEvent = (event: MouseEvent): void => {
    if (event.button === 0) {
      if (this.recordButtonText!.textContent === this.record) {
        this.recordButtonListener();
      } else {
        this.stopRecordListener();
      }
    }
  };

  private initConfigPage(): void {
    this.recordSetting = new SpRecordSetting();
    this.probesConfig = new SpProbesConfig();
    this.traceCommand = new SpTraceCommand();
    this.spAllocations = new SpAllocations();
    this.spRecordPerf = new SpRecordPerf();
    this.spFileSystem = new SpFileSystem();
    this.spSdkConfig = new SpSdkConfig();
    this.spVmTracker = new SpVmTracker();
    this.spHiSysEvent = new SpHisysEvent();
    this.spArkTs = new SpArkTs();
    this.spHiLog = new SpHilogRecord();
    this.spXPower = new SpXPowerRecord();
    this.spFFRTConfig = new SpFFRTConfig();
    this.spWebShell = new SpWebHdcShell();
    this.spRecordTemplate = new SpRecordTemplate(this);
    this.appContent = this.shadowRoot?.querySelector('#app-content') as HTMLElement;
    if (this.record_template === 'true') {
      this.appContent.append(this.spRecordTemplate);
    } else {
      this.appContent.append(this.recordSetting);
    }
    // @ts-ignore
    if (navigator.usb) {
      // @ts-ignore
      navigator.usb.addEventListener(
        'disconnect',
        // @ts-ignore
        (ev: USBConnectionEvent) => {
          this.usbDisConnectionListener(ev);
        }
      );
    }
  }

  reConfigPage(): void {
    this.appContent = this.shadowRoot?.querySelector('#app-content') as HTMLElement;
    this.appContent.innerHTML = '';
    this._menuItems = [];
    if (this.record_template === 'true') {
      this.appContent.append(this.spRecordTemplate!);
      this.buildTemplateTraceItem();
    } else {
      this.appContent.append(this.recordSetting!);
      this.buildNormalTraceItem();
    }
    this.initMenuItems();
  }

  private nativeMemoryHideBySelectVersion(): void {
    let divConfigs = this.spAllocations?.shadowRoot?.querySelectorAll<HTMLDivElement>('.version-controller');
    if (divConfigs) {
      if (SpRecordTrace.selectVersion !== '3.2') {
        for (let divConfig of divConfigs) {
          divConfig!.style.zIndex = '1';
        }
      } else {
        for (let divConfig of divConfigs) {
          divConfig!.style.zIndex = '-1';
        }
      }
    }
  }

  private selectedDevice(deviceVersion: string): void {
    SpRecordTrace.selectVersion = this.getDeviceVersion(deviceVersion);
    this.setDeviceVersionSelect(SpRecordTrace.selectVersion);
  }

  private appendDeviceVersion(): void {
    SpRecordTrace.supportVersions.forEach((supportVersion) => {
      let option = document.createElement('option');
      option.className = 'select';
      option.selected = supportVersion === '5.0+';
      option.textContent = `OpenHarmony-${supportVersion}`;
      option.setAttribute('device-version', supportVersion);
      this.deviceVersion!.append(option);
      SpRecordTrace.selectVersion = '5.0+';
      this.nativeMemoryHideBySelectVersion();
    });
  }

  private setDeviceVersionSelect(selected: string): void {
    let children = this.deviceVersion!.children;
    for (let i = 0; i < children.length; i++) {
      let child = children[i] as HTMLOptionElement;
      if (child.getAttribute('device-version') === selected) {
        child.selected = true;
        break;
      }
    }
  }

  stopRecordListener(): void {
    this.recordButtonText!.textContent = this.record;
    this.recordButtonDisable(true);
    this.cancelButtonShow(false);
    if (this.vs) {
      let cmd = Cmd.formatString(CmdConstant.CMS_HDC_STOP, [SpRecordTrace.serialNumber]);
      Cmd.execHdcCmd(cmd, (): void => { });
    } else {
      let selectedOption = this.deviceSelect!.options[this.deviceSelect!.selectedIndex] as HTMLOptionElement;
      HdcDeviceManager.connect(selectedOption.value).then((result) => {
        if (result) {
          try {
            HdcDeviceManager.shellResultAsString(CmdConstant.CMS_STOP, true).then((): void => { });
          } catch (exception) {
            this.recordButtonDisable(false);
            log(exception);
          }
        }
      });
    }
  }

  cancelRecordListener = (): void => {
    this.recordButtonText!.textContent = this.record;
    this.cancelButtonShow(false);
    if (this.vs) {
      let cmd = Cmd.formatString(CmdConstant.CMS_HDC_CANCEL, [SpRecordTrace.serialNumber]);
      Cmd.execHdcCmd(cmd, () => {
        this.freshMenuDisable(false);
        this.freshConfigMenuDisable(false);
        this.progressEL!.loading = false;
        this.sp!.search = false;
        this.litSearch!.clear();
        this.addButton!.style.pointerEvents = 'auto';
        this.deviceSelect!.style.pointerEvents = 'auto';
        this.disconnectButton!.style.pointerEvents = 'auto';
        this.deviceVersion!.style.pointerEvents = 'auto';
      });
    } else {
      let selectedOption = this.deviceSelect!.options[this.deviceSelect!.selectedIndex] as HTMLOptionElement;
      HdcDeviceManager.connect(selectedOption.value).then((result) => {
        if (result) {
          this.freshMenuDisable(false);
          this.freshConfigMenuDisable(false);
          try {
            this.progressEL!.loading = false;
            this.sp!.search = false;
            this.litSearch!.clear();
            this.disconnectButton!.style.pointerEvents = 'auto';
            this.addButton!.style.pointerEvents = 'auto';
            this.deviceSelect!.style.pointerEvents = 'auto';
            this.deviceVersion!.style.pointerEvents = 'auto';
            SpRecordTrace.cancelRecord = true;
            HdcDeviceManager.stopHiprofiler(CmdConstant.CMS_CANCEL).then((): void => { });
          } catch (exception) {
            log(exception);
          }
        }
      });
    }
  };

  private cancelButtonShow(show: boolean): void {
    if (show) {
      this.cancelButton!.style.visibility = 'visible';
    } else {
      this.cancelButton!.style.visibility = 'hidden';
    }
  }

  private traceCommandClickHandler(recordTrace: SpRecordTrace): void {
    recordTrace.appContent!.innerHTML = '';
    recordTrace.appContent!.append(recordTrace.traceCommand!);
    recordTrace.traceCommand!.hdcCommon = PluginConvertUtils.createHdcCmd(
      PluginConvertUtils.BeanToCmdTxt(recordTrace.makeRequest(), false),
      recordTrace.recordSetting!.output,
      recordTrace.recordSetting!.maxDur
    );
    recordTrace.freshMenuItemsStatus('Trace command');
  }

  private initMenuItems(): void {
    this.menuGroup!.innerHTML = '';
    this._menuItems?.forEach((item): void => {
      let th = new LitMainMenuItem();
      th.setAttribute('icon', item.icon || '');
      th.setAttribute('title', item.title || '');
      th.style.height = '60px';
      th.style.fontFamily = 'Helvetica-Bold';
      th.style.fontSize = '16px';
      th.style.lineHeight = '28px';
      th.style.fontWeight = '700';
      th.removeAttribute('file');
      th.addEventListener('click', (): void => {
        if (item.clickHandler) {
          item.clickHandler(item);
        }
      });
      if (item.title === 'eBPF Config') {
        if (th && item) {//ebpf开关置灰不能点击
          th.style.color = 'gray';
          th.disabled = true;
          if (item.clickHandler) {
            item.clickHandler = undefined;
          }
        }
      }
      if (SpRecordTrace.useExtend && item.title === 'Hdc Shell') {
        if (th && item) {
          th.style.color = 'gray';
          th.disabled = true;
          if (item.clickHandler) {
            item.clickHandler = undefined;
          }
        }
      }
      this.menuGroup!.appendChild(th);
    });
  }

  private recordCommandClickHandler(recordTrace: SpRecordTrace): void {
    let request = recordTrace.makeRequest();
    recordTrace.traceCommand!.hdcCommon = PluginConvertUtils.createHdcCmd(
      PluginConvertUtils.BeanToCmdTxt(request, false),
      recordTrace.recordSetting!.output,
      recordTrace.recordSetting!.maxDur
    );
  }

  private hdcShellClickHandler(recordTrace: SpRecordTrace): void {
    recordTrace.spWebShell!.shellDiv!.scrollTop = recordTrace.spWebShell!.currentScreenRemain;
    setTimeout(() => {
      recordTrace.spWebShell!.hdcShellFocus();
    }, 100);
    recordTrace.nowChildItem = recordTrace.spWebShell!;
  }

  private nativeMemoryClickHandler(recordTrace: SpRecordTrace): void {
    let startNativeSwitch = recordTrace.spAllocations?.shadowRoot?.getElementById('switch-disabled') as LitSwitch;
    let recordModeSwitch = recordTrace.probesConfig?.shadowRoot?.querySelector('lit-switch') as LitSwitch;
    let checkDesBoxDis = recordTrace.probesConfig?.shadowRoot?.querySelectorAll('check-des-box');
    let litCheckBoxDis = recordTrace.probesConfig?.shadowRoot?.querySelectorAll('lit-check-box');
    recordTrace.ftraceSlider =
      recordTrace.probesConfig?.shadowRoot?.querySelector<LitSlider>('#ftrace-buff-size-slider');
    startNativeSwitch.addEventListener('change', (event: unknown): void => {
      //@ts-ignore
      let detail = event.detail;
      if (detail!.checked) {
        recordModeSwitch.removeAttribute('checked');
        checkDesBoxDis?.forEach((item: unknown): void => {
          //@ts-ignore
          item.setAttribute('disabled', '');
          //@ts-ignore
          item.checked = false;
        });
        litCheckBoxDis?.forEach((item: unknown): void => {
          //@ts-ignore
          item.setAttribute('disabled', '');
          //@ts-ignore
          item.checked = false;
        });
        recordTrace.ftraceSlider!.setAttribute('disabled', '');
      }
    });
    let divConfigs = recordTrace.spAllocations?.shadowRoot?.querySelectorAll<HTMLDivElement>('.version-controller');
    if ((!SpRecordTrace.selectVersion || SpRecordTrace.selectVersion === '3.2') && divConfigs) {
      for (let divConfig of divConfigs) {
        divConfig!.style.zIndex = '-1';
      }
    }
  }

  private eBPFConfigClickHandler(recordTrace: SpRecordTrace): void {
    recordTrace.spFileSystem!.setAttribute('long_trace', '');
  }

  private buildMenuItem(
    title: string,
    icon: string,
    configPage: BaseElement,
    clickHandlerFun?: Function,
    fileChoose: boolean = false
  ): MenuItem {
    return {
      title: title,
      icon: icon,
      fileChoose: fileChoose,
      clickHandler: (): void => {
        this.appContent!.innerHTML = '';
        this.appContent!.append(configPage);
        ShadowRootInput.preventBubbling(configPage);
        this.freshMenuItemsStatus(title);
        if (clickHandlerFun) {
          clickHandlerFun(this);
        }
      },
    };
  }

  private buildTemplateTraceItem(): void {
    this._menuItems = [
      this.buildMenuItem('Record setting', 'properties', this.recordSetting!),
      this.buildMenuItem('Trace template', 'realIntentionBulb', this.spRecordTemplate!),
      this.buildMenuItem('Trace command', 'dbsetbreakpoint', this.spRecordTemplate!, this.traceCommandClickHandler),
    ];
  }

  private buildNormalTraceItem(): void {
    this._menuItems = [
      this.buildMenuItem('Record setting', 'properties', this.recordSetting!),
      this.buildMenuItem('Trace command', 'dbsetbreakpoint', this.traceCommand!, this.recordCommandClickHandler),
      this.buildMenuItem('Hdc Shell', 'file-config', this.spWebShell!, this.hdcShellClickHandler),
      this.buildMenuItem('Probes config', 'realIntentionBulb', this.probesConfig!),
      this.buildMenuItem('Native Memory', 'externaltools', this.spAllocations!, this.nativeMemoryClickHandler),
      this.buildMenuItem('Hiperf', 'realIntentionBulb', this.spRecordPerf!),
      this.buildMenuItem('eBPF Config', 'file-config', this.spFileSystem!, this.eBPFConfigClickHandler),
      this.buildMenuItem('VM Tracker', 'vm-tracker', this.spVmTracker!),
      this.buildMenuItem('HiSystemEvent', 'externaltools', this.spHiSysEvent!),
      this.buildMenuItem('Ark Ts', 'file-config', this.spArkTs!),
      this.buildMenuItem('FFRT', 'file-config', this.spFFRTConfig!),
      this.buildMenuItem('Hilog', 'realIntentionBulb', this.spHiLog!),
      this.buildMenuItem('Xpower', 'externaltools', this.spXPower!),
    ];
  }

  // @ts-ignore
  usbDisConnectionListener(event: USBConnectionEvent): void {
    // @ts-ignore
    let disConnectDevice: USBDevice = event.device;
    for (let index = 0; index < this.deviceSelect!.children.length; index++) {
      let option = this.deviceSelect!.children[index] as HTMLOptionElement;
      if (option.value === disConnectDevice.serialNumber) {
        let optValue = option.value;
        HdcDeviceManager.disConnect(optValue).then(() => { });
        this.deviceSelect!.removeChild(option);
        if (SpRecordTrace.serialNumber === optValue) {
          if (this.nowChildItem === this.spWebShell) {
            window.publish(window.SmartEvent.UI.DeviceDisConnect, optValue);
          }
          let options = this.deviceSelect!.options;
          if (options.length > 0) {
            let selectedOpt = options[this.deviceSelect!.selectedIndex];
            SpRecordTrace.serialNumber = selectedOpt.value;
          } else {
            this.recordButton!.hidden = true;
            this.disconnectButton!.hidden = true;
            this.cancelButton!.hidden = true;
            this.devicePrompt!.innerText = 'Device not connected';
            SpRecordTrace.serialNumber = '';
          }
        }
      }
    }
  }

  private vsCodeRecordCmd(traceCommandStr: string): void {
    Cmd.execHdcCmd(Cmd.formatString(CmdConstant.CMS_HDC_STOP, [SpRecordTrace.serialNumber]), (stopRes: string) => {
      let cmd = Cmd.formatString(CmdConstant.CMD_MOUNT_DEVICES, [SpRecordTrace.serialNumber]);
      Cmd.execHdcCmd(cmd, (res: string) => {
        this.sp!.search = true;
        this.progressEL!.loading = true;
        this.litSearch!.clear();
        this.litSearch!.setPercent(`tracing  ${this.recordSetting!.maxDur * 1000}ms`, -1);
        this.initRecordUIState();
        this.recordButtonText!.textContent = this.stop;
        this.cancelButtonShow(true);
        Cmd.execHdcTraceCmd(traceCommandStr, SpRecordTrace.serialNumber, (traceResult: string): void => {
          if (traceResult.indexOf('DestroySession done') !== -1) {
            this.litSearch!.setPercent('tracing htrace down', -1);
            let cmd = Cmd.formatString(CmdConstant.CMD_FIEL_RECV_DEVICES, [
              SpRecordTrace.serialNumber,
              this.recordSetting!.output,
            ]);
            Cmd.execFileRecv(cmd, this.recordSetting!.output, (rt: ArrayBuffer): void => {
              this.litSearch!.setPercent('downloading Hitrace file ', 101);
              let fileName = this.recordSetting!.output.substring(this.recordSetting!.output.lastIndexOf('/') + 1);
              let file = new File([rt], fileName);
              let main = this!.parentNode!.parentNode!.querySelector('lit-main-menu') as LitMainMenu;
              let children = main.menus as Array<MenuGroup>;
              let child = children[0].children as Array<MenuItem>;
              let fileHandler = child[0].fileHandler;
              if (fileHandler && !SpRecordTrace.cancelRecord) {
                this.recordButtonText!.textContent = this.record;
                this.cancelButtonShow(false);
                this.freshMenuDisable(false);
                this.freshConfigMenuDisable(false);
                fileHandler({ detail: file });
              } else {
                SpRecordTrace.cancelRecord = false;
              }
            });
          } else {
            this.litSearch!.setPercent('tracing htrace failed, please check your config ', -2);
            this.recordButtonText!.textContent = this.record;
            this.freshMenuDisable(false);
            this.freshConfigMenuDisable(false);
            this.progressEL!.loading = false;
          }
          this.buttonDisable(false);
        });
      });
    });
  }

  private initRecordCmdStatus(): void {
    this.appContent!.innerHTML = '';
    this.appContent!.append(this.traceCommand!);
    let config = this.makeRequest();
    this.traceCommand!.hdcCommon = PluginConvertUtils.createHdcCmd(
      PluginConvertUtils.BeanToCmdTxt(config, false),
      this.recordSetting!.output,
      this.recordSetting!.maxDur
    );
    this.freshMenuItemsStatus('Trace command');
  }

  private webRecordCmd(traceCommandStr: string, selectedOption: HTMLOptionElement): void {
    HdcDeviceManager.connect(selectedOption.value).then((result) => {
      log(`result is ${result}`);
      if (result) {
        this.initRecordCmdStatus();
        try {
          HdcDeviceManager.stopHiprofiler(CmdConstant.CMS_CANCEL).then(() => {
            HdcDeviceManager.shellResultAsString(CmdConstant.CMD_MOUNT, true).then(() => {
              this.sp!.search = true;
              this.progressEL!.loading = true;
              this.litSearch!.clear();
              this.litSearch!.setPercent(`tracing  ${this.recordSetting!.maxDur * 1000}ms`, -1);
              this.buttonDisable(true);
              this.cancelButton!.hidden = false;
              this.freshMenuDisable(true);
              this.freshConfigMenuDisable(true);
              if (SpApplication.isLongTrace) {
                HdcDeviceManager.shellResultAsString(
                  `${CmdConstant.CMD_CLEAR_LONG_FOLD + this.recordSetting!.longOutPath}*`,
                  false
                ).then(() => {
                  HdcDeviceManager.shellResultAsString(
                    CmdConstant.CMD_MKDIR_LONG_FOLD + this.recordSetting!.longOutPath,
                    false
                  ).then(() => {
                    HdcDeviceManager.shellResultAsString(
                      CmdConstant.CMD_SET_FOLD_AUTHORITY + this.recordSetting!.longOutPath,
                      false
                    ).then(() => {
                      this.recordLongTraceCmd(traceCommandStr);
                    });
                  });
                });
              } else {
                this.recordTraceCmd(traceCommandStr);
              }
            });
          });
        } catch (e) {
          this.freshMenuDisable(false);
          this.freshConfigMenuDisable(false);
          this.buttonDisable(false);
        }
      } else {
        this.sp!.search = true;
        this.litSearch!.clear();
        this.litSearch!.setPercent('please kill other hdc-server !', -2);
      }
    });
  }

  recordButtonListener(): void {
    SpRecordTrace.cancelRecord = false;
    let request = this.makeRequest();
    let isRecordArkTs = (this.spArkTs!.isStartArkts && this.spArkTs!.process.trim() !== '') ? true : false;
    if (request.pluginConfigs.length === 0 && !isRecordArkTs) {
      this.useExtentTip!.style.display = 'block';
      this.useExtentTip!.innerHTML = "It looks like you didn't add any probes. Please add at least one";
      return;
    }
    this.useExtentTip!.style.display = 'none';
    this.useExtentTip!.innerHTML = '';
    if (SpRecordTrace.useExtend) {
      this.recordButton!.hidden = true;
      this.buttonDisable(true, true);
      this.freshMenuDisable(true);
      this.freshConfigMenuDisable(true);
      this.recordPluginFunc();
      return;
    }

    let traceCommandStr = PluginConvertUtils.createHdcCmd(
      PluginConvertUtils.BeanToCmdTxt(request, false),
      this.recordSetting!.output,
      this.recordSetting!.maxDur
    );
    let pluginList: Array<string> = [];
    request.pluginConfigs.forEach((pluginConfig) => {
      pluginList.push(pluginConfig.pluginName);
    });
    SpStatisticsHttpUtil.addOrdinaryVisitAction({
      action: 'config_page',
      event: 'online_record',
      eventData: {
        plugin: pluginList,
      },
    });
    let selectedOption = this.deviceSelect!.options[this.deviceSelect!.selectedIndex] as HTMLOptionElement;
    if (selectedOption) {
      SpRecordTrace.serialNumber = selectedOption.value;
    } else {
      this.sp!.search = true;
      this.litSearch!.clear();
      this.progressEL!.loading = false;
      this.litSearch!.setPercent('please connect device', -2);
    }
    if (this.vs) {
      this.appContent!.innerHTML = '';
      this.appContent!.append(this.traceCommand!);
      this.traceCommand!.hdcCommon = PluginConvertUtils.createHdcCmd(
        PluginConvertUtils.BeanToCmdTxt(this.makeRequest(), false),
        this.recordSetting!.output,
        this.recordSetting!.maxDur
      );
      this.freshMenuItemsStatus('Trace command');
      this.vsCodeRecordCmd(traceCommandStr);
    } else {
      this.webRecordCmd(traceCommandStr, selectedOption);
    }
  }

  private recordTraceCmd(traceCommandStr: string): void {
    let executeCmdCallBack = (cmdStateResult: string): void => {
      if (cmdStateResult.includes('tracing ')) {
        this.litSearch!.setPercent('Start to record...', -1);
      }
    };
    this.litSearch!.setPercent('Waiting to record...', -1);
    HdcDeviceManager.shellResultAsString(CmdConstant.CMD_SHELL + traceCommandStr, false, executeCmdCallBack).then((traceResult) => {
      let re = this.isSuccess(traceResult);
      if (re === 0) {
        this.litSearch!.setPercent('Tracing htrace down', -1);
        HdcDeviceManager.shellResultAsString(CmdConstant.CMD_TRACE_FILE_SIZE + this.recordSetting!.output, false).then(
          (traceFileSize) => {
            this.litSearch!.setPercent(`TraceFileSize is ${traceFileSize}`, -1);
            if (traceFileSize.indexOf('No such') !== -1) {
              this.refreshDisableStyle(false, true, 'No such file or directory', -2);
            } else if (Number(traceFileSize) <= MaxFileSize) {
              HdcDeviceManager.fileRecv(this.recordSetting!.output, (perNumber: number) => {
                this.litSearch!.setPercent('Downloading Hitrace file ', perNumber);
              }).then((pullRes) => {
                this.litSearch!.setPercent('Downloading Hitrace file ', 101);
                pullRes.arrayBuffer().then((buffer) => {
                  let fileName = this.recordSetting!.output.substring(this.recordSetting!.output.lastIndexOf('/') + 1);
                  let file = new File([buffer], fileName);
                  let main = this!.parentNode!.parentNode!.querySelector('lit-main-menu') as LitMainMenu;
                  let children = main.menus as Array<MenuGroup>;
                  let child = children[0].children as Array<MenuItem>;
                  let fileHandler = child[0].fileHandler;
                  if (fileHandler && !SpRecordTrace.cancelRecord) {
                    this.refreshDisableStyle(false, false);
                    fileHandler({
                      detail: file,
                    });
                  } else {
                    SpRecordTrace.cancelRecord = false;
                  }
                });
              });
            } else {
              this.recordButtonText!.textContent = this.record;
              this.refreshDisableStyle(false, true, 'Htrace file is too big', -2);
            }
          }
        );
      } else if (re === 2) {
        this.refreshDisableStyle(false, true, 'Stop tracing htrace ', -1);
      } else if (re === -1) {
        this.refreshDisableStyle(false, true, 'The device is abnormal', -2);
        this.progressEL!.loading = false;
      } else {
        this.refreshDisableStyle(false, true, 'Tracing htrace failed, please check your config ', -2);
      }
    });
  }

  private recordLongTraceCmd(traceCommandStr: string): void {
    HdcDeviceManager.shellResultAsString(CmdConstant.CMD_SHELL + traceCommandStr, false).then((traceResult) => {
      let re = this.isSuccess(traceResult);
      if (re === 0) {
        this.litSearch!.setPercent('tracing htrace down', -1);
        HdcDeviceManager.shellResultAsString(
          CmdConstant.CMD_TRACE_FILE_SIZE + this.recordSetting!.longOutPath,
          false
        ).then((traceFileSize) => {
          this.litSearch!.setPercent(`traceFileSize is ${traceFileSize}`, -1);
          if (traceFileSize.indexOf('No such') !== -1) {
            this.litSearch!.setPercent('No such file or directory', -2);
            this.buttonDisable(false);
            this.freshConfigMenuDisable(false);
            this.freshMenuDisable(false);
          } else {
            this.recordLongTrace();
          }
        });
      } else if (re === 2) {
        this.refreshDisableStyle(false, true, 'stop tracing htrace ', -1);
      } else if (re === -1) {
        this.refreshDisableStyle(false, true, 'The device is abnormal', -2);
        this.progressEL!.loading = false;
      } else {
        this.refreshDisableStyle(false, true, 'tracing htrace failed, please check your config ', -2);
      }
    });
  }

  private refreshDisableStyle(
    disable: boolean,
    isFreshSearch: boolean,
    percentName?: string,
    percentValue?: number
  ): void {
    if (isFreshSearch) {
      this.litSearch!.setPercent(percentName, percentValue!);
    }
    this.recordButtonDisable(disable);
    this.freshConfigMenuDisable(disable);
    this.freshMenuDisable(disable);
    this.buttonDisable(disable);
  }

  private getLongTraceTypePage(): Array<number> {
    let traceTypePage: Array<number> = [];
    for (let fileIndex = 0; fileIndex < this.longTraceList.length; fileIndex++) {
      let traceFileName = this.longTraceList[fileIndex];
      if (this.sp!.fileTypeList.some((fileType) => traceFileName.toLowerCase().includes(fileType))) {
        continue;
      }
      let firstLastIndexOf = traceFileName.lastIndexOf('.');
      let firstText = traceFileName.slice(0, firstLastIndexOf);
      let resultLastIndexOf = firstText.lastIndexOf('_');
      traceTypePage.push(Number(firstText.slice(resultLastIndexOf + 1, firstText.length)) - 1);
    }
    traceTypePage.sort((leftNum: number, rightNum: number) => leftNum - rightNum);
    return traceTypePage;
  }

  private loadLongTraceFile(timStamp: number): Promise<unknown> {
    return new Promise(async (resolve): Promise<void> => {
      let traceTypePage = this.getLongTraceTypePage();
      for (let fileIndex = 0; fileIndex < this.longTraceList.length; fileIndex++) {
        if (this.longTraceList[fileIndex] !== '') {
          let types = this.sp!.fileTypeList.filter((type) =>
            this.longTraceList[fileIndex].toLowerCase().includes(type.toLowerCase())
          );
          let pageNumber = 0;
          let fileType = types[0];
          if (types.length === 0) {
            fileType = 'trace';
            let searchNumber =
              Number(
                this.longTraceList[fileIndex].substring(
                  this.longTraceList[fileIndex].lastIndexOf('_') + 1,
                  this.longTraceList[fileIndex].lastIndexOf('.')
                )
              ) - 1;
            pageNumber = traceTypePage.lastIndexOf(searchNumber);
          }
          let pullRes = await HdcDeviceManager.fileRecv(
            this.recordSetting!.longOutPath + this.longTraceList[fileIndex],
            (perNumber: number) => {
              this.litSearch!.setPercent(`downloading ${fileType} file `, perNumber);
            }
          );
          this.litSearch!.setPercent(`downloading ${fileType} file `, 101);
          await this.saveIndexDBByLongTrace(pullRes, fileType, pageNumber, timStamp);
        }
      }
      resolve(1);
    });
  }

  private async saveIndexDBByLongTrace(
    pullRes: Blob,
    fileType: string,
    pageNumber: number,
    timStamp: number
  ): Promise<void> {
    let buffer = await pullRes.arrayBuffer();
    let chunks = Math.ceil(buffer.byteLength / indexDBMaxSize);
    let offset = 0;
    let sliceLen = 0;
    let message = { fileType: '', startIndex: 0, endIndex: 0, size: 0 };
    for (let chunkIndex = 0; chunkIndex < chunks; chunkIndex++) {
      let start = chunkIndex * indexDBMaxSize;
      let end = Math.min(start + indexDBMaxSize, buffer.byteLength);
      let chunk = buffer.slice(start, end);
      if (chunkIndex === 0) {
        message.fileType = fileType;
        message.startIndex = chunkIndex;
      }
      sliceLen = Math.min(buffer.byteLength - offset, indexDBMaxSize);
      if (chunkIndex === 0 && fileType === 'trace') {
        this.sp!.longTraceHeadMessageList.push({ pageNum: pageNumber, data: buffer.slice(offset, kbSize) });
      }
      this.sp!.longTraceDataList.push({
        index: chunkIndex,
        fileType: fileType,
        pageNum: pageNumber,
        startOffsetSize: offset,
        endOffsetSize: offset + sliceLen,
      });
      await LongTraceDBUtils.getInstance().indexedDBHelp.add(LongTraceDBUtils.getInstance().tableName, {
        buf: chunk,
        id: `${fileType}_${timStamp}_${pageNumber}_${chunkIndex}`,
        fileType: fileType,
        pageNum: pageNumber,
        startOffset: offset,
        endOffset: offset + sliceLen,
        index: chunkIndex,
        timStamp: timStamp,
      });
      offset += sliceLen;
      if (offset >= buffer.byteLength) {
        message.endIndex = chunkIndex;
        message.size = buffer.byteLength;
        this.longTraceFileMapHandler(pageNumber, message);
      }
    }
  }

  private longTraceFileMapHandler(
    pageNumber: number,
    message: {
      fileType: string;
      startIndex: number;
      endIndex: number;
      size: number;
    }
  ): void {
    if (this.sp!.longTraceTypeMessageMap) {
      if (this.sp!.longTraceTypeMessageMap?.has(pageNumber)) {
        let oldTypeList = this.sp!.longTraceTypeMessageMap?.get(pageNumber);
        oldTypeList?.push(message);
        this.sp!.longTraceTypeMessageMap?.set(pageNumber, oldTypeList!);
      } else {
        this.sp!.longTraceTypeMessageMap?.set(pageNumber, [message]);
      }
    } else {
      this.sp!.longTraceTypeMessageMap = new Map();
      this.sp!.longTraceTypeMessageMap.set(pageNumber, [message]);
    }
  }

  private recordLongTrace(): void {
    let querySelector = this.sp!.shadowRoot?.querySelector('.long_trace_page') as HTMLDivElement;
    if (querySelector) {
      querySelector.style.display = 'none';
    }
    HdcDeviceManager.shellResultAsString(CmdConstant.CMD_GET_LONG_FILES + this.recordSetting!.longOutPath, false).then(
      (result) => {
        this.longTraceList = result.split('\n').filter((fileName) => Boolean(fileName));
        if (this.longTraceList.length > 0) {
          this.sp!.longTraceHeadMessageList = [];
          this.sp!.longTraceDataList = [];
          this.sp!.longTraceTypeMessageMap = undefined;
          let timStamp = new Date().getTime();
          this.loadLongTraceFile(timStamp).then(() => {
            let main = this!.parentNode!.parentNode!.querySelector('lit-main-menu') as LitMainMenu;
            let children = main.menus as Array<MenuGroup>;
            let child = children[1].children as Array<MenuItem>;
            let fileHandler = child[0].clickHandler;
            if (fileHandler && !SpRecordTrace.cancelRecord) {
              this.freshConfigMenuDisable(false);
              this.freshMenuDisable(false);
              this.buttonDisable(false);
              this.recordButtonDisable(false);
              fileHandler(
                {
                  detail: {
                    timeStamp: timStamp,
                  },
                },
                true
              );
            } else {
              SpRecordTrace.cancelRecord = false;
            }
          });
        }
      }
    );
  }

  private initRecordUIState(): void {
    this.buttonDisable(true);
    this.freshMenuDisable(true);
    this.freshConfigMenuDisable(true);
  }

  private isSuccess(traceResult: string): number {
    if (traceResult.indexOf('CreateSession FAIL') !== -1 || traceResult.indexOf('failed') !== -1) {
      return 1;
    } else if (traceResult.indexOf('Signal') !== -1) {
      return 2;
    } else if (traceResult.indexOf('signal(2)') !== -1) {
      return 0;
    } else if (traceResult.indexOf('The device is abnormal') !== -1) {
      return -1;
    } else {
      return 0;
    }
  }

  private makeRequest = (isCreateArkTsConfig = true): CreateSessionRequest => {
    let request = createSessionRequest(this.recordSetting!);
    if (this.record_template === 'true') {
      let templateConfigs = this.spRecordTemplate?.getTemplateConfig();
      templateConfigs?.forEach((config) => {
        request.pluginConfigs.push(config);
      });
    } else {
      if (SpApplication.isLongTrace && request.sessionConfig) {
        request.sessionConfig.splitFile = true;
        request.sessionConfig!.splitFileMaxSizeMb = this.recordSetting!.longTraceSingleFileMaxSize;
        request.sessionConfig!.splitFileMaxNum = 20;
      }
      let reportingFrequency: number = 5;
      if (this.recordSetting!.maxDur <= 20) {
        reportingFrequency = 2;
      }
      createHTracePluginConfig(this.probesConfig!, request);
      createFpsPluginConfig(this.probesConfig!, request);
      createMonitorPlugin(this.probesConfig!, request);
      createMemoryPluginConfig(reportingFrequency, this.spVmTracker!, this.probesConfig!, request);
      createNativePluginConfig(reportingFrequency, this.spAllocations!, SpRecordTrace.selectVersion, request);
      createHiPerfConfig(reportingFrequency, this.spRecordPerf!, this.recordSetting!, request);
      createSystemConfig(this.spFileSystem!, this.recordSetting!, request);
      createSdkConfig(this.spSdkConfig!, request);
      createHiSystemEventPluginConfig(this.spHiSysEvent!, request);
      if (isCreateArkTsConfig) {
        createArkTsConfig(this.spArkTs!, this.recordSetting!, request);
      }
      createHiLogConfig(reportingFrequency, this.spHiLog!, request);
      createFFRTPluginConfig(this.spFFRTConfig!, SpRecordTrace.selectVersion, request);
      createXPowerConfig(this.spXPower!, request);
    }
    return request;
  };

  initHtml(): string {
    return SpRecordTraceHtml;
  }

  private freshConfigMenuDisable(disable: boolean): void {
    let querySelectors = this.shadowRoot?.querySelectorAll<LitMainMenuItem>('lit-main-menu-item');
    querySelectors!.forEach((item) => {
      if (item.title !== 'Hdc Shell') {
        if (disable) {
          item.style.pointerEvents = 'none';
        } else {
          item.style.pointerEvents = 'auto';
        }
        item.disabled = disable;
      }
    });
  }

  public startRefreshDeviceList(): void {
    if (this.refreshDeviceTimer === undefined) {
      this.refreshDeviceTimer = window.setInterval((): void => {
        this.refreshDeviceList();
      }, 5000);
    }
  }

  private recordButtonDisable(disable: boolean): void {
    this.recordButton!.style.pointerEvents = disable ? 'none' : 'auto';
  }

  private buttonDisable(disable: boolean, isUseExtend = false): void {
    let pointerEventValue = 'auto';
    this.recordButtonText!.textContent = this.record;
    if (disable) {
      pointerEventValue = 'none';
      if (!isUseExtend) {
        this.recordButtonText!.textContent = this.stop;
      }
    }
    if (!isUseExtend) {
      this.cancelButtonShow(disable);
    }
    this.disconnectButton!.style.pointerEvents = pointerEventValue;
    this.addButton!.style.pointerEvents = pointerEventValue;
    this.deviceSelect!.style.pointerEvents = pointerEventValue;
    this.deviceVersion!.style.pointerEvents = pointerEventValue;
    this.useExtendCheck!.style.pointerEvents = pointerEventValue;// arkts trace 
  }

  private freshMenuItemsStatus(currentValue: string): void {
    let litMainMenuGroup = this.shadowRoot?.querySelector<LitMainMenuGroup>('lit-main-menu-group');
    let litMainMenuItemNodeListOf = litMainMenuGroup!.querySelectorAll<LitMainMenuItem>('lit-main-menu-item');
    litMainMenuItemNodeListOf.forEach((item) => {
      item.back = item.title === currentValue;
    });
  }

  synchronizeDeviceList(): void {
    this.deviceSelect!.innerHTML = '';
    if (SpRecordTrace.serialNumber !== '') {
      for (let i = 0; i < this.hdcList.length; i++) {
        let dev = this.hdcList[i];
        // @ts-ignore
        let serialNumber = typeof (dev) === 'string' ? dev : dev.serialNumber;
        let option = document.createElement('option');
        option.className = 'select';
        //@ts-ignore
        option.selected = serialNumber === SpRecordTrace.serialNumber;
        //@ts-ignore
        option.value = serialNumber;
        //@ts-ignore
        option.textContent = serialNumber;
        this.deviceSelect!.appendChild(option);
        this.recordButton!.hidden = false;
        this.disconnectButton!.hidden = false;
        this.cancelButton!.hidden = false;
        this.devicePrompt!.innerText = '';
      }
      if (SpRecordTrace.selectVersion && SpRecordTrace.selectVersion !== '') {
        this.setDeviceVersionSelect(SpRecordTrace.selectVersion);
      }
    }
  }
}

const kbSize = 1024;
const timeOut = 200;
const unitSize = 48;
const indexDBMaxSize = unitSize * kbSize * kbSize;
export const MaxFileSize: number = kbSize * kbSize * kbSize;
