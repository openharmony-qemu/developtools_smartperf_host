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
} from './SpRecordConfigModel';
import { SpRecordTraceHtml } from './SpRecordTrace.html';
import { SpFFRTConfig } from './setting/SpFFRTConfig';

const DEVICE_NOT_CONNECT =
  '<div>1.请确认抓取设备上是否已勾选并确认总是允许smartPerf-Host调试的弹窗</div>' +
  '<div>2.请关闭DevEco Studio,DevEco Testing等会占用hdc端口的应用</div>' +
  '<div>3.请使用系统管理员权限打开cmd窗口，并执行hdc kill，确保PC端任务管理器中没有hdc进程</div>' +
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
  private spFFRTConfig: SpFFRTConfig | undefined;
  private ftraceSlider: LitSlider | undefined | null;
  private spWebShell: SpWebHdcShell | undefined;
  private menuGroup: LitMainMenuGroup | undefined | null;
  private appContent: HTMLElement | undefined | null;
  private record = 'Record';
  private stop = 'StopRecord';
  private nowChildItem: HTMLElement | undefined;
  private longTraceList: Array<string> = [];
  private refreshDeviceTimer: number | undefined;
  private hintEl: HTMLSpanElement | undefined;
  private selectedTemplate: Map<string, number> = new Map();
  private hintTimeOut: number = -1;
  private MenuItemArkts: MenuItem | undefined | null;
  private MenuItemArktsHtml: LitMainMenuItem | undefined | null;
  private MenuItemEbpf: MenuItem | undefined | null;
  private MenuItemEbpfHtml: LitMainMenuItem | undefined | null;

  set record_template(re: boolean) {
    if (re) {
      this.setAttribute('record_template', '');
    } else {
      this.removeAttribute('record_template');
    }
    if (this.recordSetting) {
      this.recordSetting.isRecordTemplate = re;
    }
  }

  get record_template(): boolean {
    return this.hasAttribute('record_template');
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

  private async refreshDeviceList(): Promise<void> {
    if (this.vs) {
      this.refreshDeviceListByVs();
    } else {
      this.deviceSelect!.innerHTML = '';
      // @ts-ignore
      HdcDeviceManager.getDevices().then(async (devs: USBDevice[]) => {
        if (devs.length === 0) {
          this.recordButton!.hidden = true;
          this.disconnectButton!.hidden = true;
          this.devicePrompt!.innerText = 'Device not connected';
          this.hintEl!.innerHTML = DEVICE_NOT_CONNECT;
          if (!this.showHint) {
            this.showHint = true;
          }
        }
        let optionNum = 0;
        for (let len = 0; len < devs.length; len++) {
          let dev = devs[len];
          let option = document.createElement('option');
          option.className = 'select';
          if (typeof dev.serialNumber === 'string') {
            let res = await HdcDeviceManager.connect(dev.serialNumber);
            if (res) {
              optionNum++;
              option.value = dev.serialNumber;
              option.textContent = dev!.serialNumber ? dev!.serialNumber!.toString() : 'hdc Device';
              this.deviceSelect!.appendChild(option);
            }
            if (len === 0 && res) {
              option.selected = true;
              this.recordButton!.hidden = false;
              this.disconnectButton!.hidden = false;
              this.showHint = false;
              this.devicePrompt!.innerText = '';
              this.hintEl!.textContent = '';
              SpRecordTrace.serialNumber = option.value;
              if (this.MenuItemArkts && this.MenuItemArktsHtml) {//连接成功后，arkts开关置灰不能点击
                this.MenuItemArktsHtml.style.color = 'gray';
                this.MenuItemArktsHtml.disabled = true;
                if (this.MenuItemArkts.clickHandler) {
                  this.MenuItemArkts.clickHandler = undefined;
                }
              }
              try {
                let kernelInfo = await HdcDeviceManager.shellResultAsString(CmdConstant.CMD_UNAME, false);
                if (kernelInfo.includes('HongMeng')) {
                  if (this.MenuItemEbpf && this.MenuItemEbpfHtml) {//如果为鸿蒙内核，ebpf开关置灰不能点击
                    this.MenuItemEbpfHtml.style.color = 'gray';
                    this.MenuItemEbpfHtml.disabled = true;
                    if (this.MenuItemEbpf.clickHandler) {
                      this.MenuItemEbpf.clickHandler = undefined;
                    }
                  }
                }
              } catch (error) {
                console.error('Failed to get kernel info:', error);
              }
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
    HdcDeviceManager.connect(option.value).then((result) => {
      if (result) {
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
    if (this.record_template) {
      this.buildTemplateTraceItem();
    } else {
      this.buildNormalTraceItem();
    }
    this.initMenuItems();
    this.appendDeviceVersion();
    if (this.deviceSelect.options && this.deviceSelect.options.length > 0) {
      this.disconnectButton!.hidden = false;
      this.recordButton.hidden = false;
      this.devicePrompt.innerText = '';
    } else {
      this.disconnectButton!.hidden = true;
      this.recordButton.hidden = true;
      this.devicePrompt.innerText = 'Device not connected';
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
    if (this.vs) {
      this.refreshDeviceList();
    } else {
      // @ts-ignore
      HdcDeviceManager.findDevice().then((usbDevices): void => {
        log(usbDevices);
        this.refreshDeviceList();
      });
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
      this.devicePrompt!.innerText = '';
    } else {
      this.recordButton!.hidden = true;
      this.disconnectButton!.hidden = true;
      this.devicePrompt!.innerText = 'Device not connected';
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
    let index = this.deviceSelect!.selectedIndex;
    if (index !== -1) {
      let selectOption = this.deviceSelect!.options[index];
      let value = selectOption.value;
      HdcDeviceManager.disConnect(value).then((): void => {
        this.deviceSelect!.removeChild(selectOption);
        if (this.nowChildItem === this.spWebShell) {
          window.publish(window.SmartEvent.UI.DeviceDisConnect, value);
        }
        if (this.deviceSelect!.selectedIndex !== -1) {
          let item = this.deviceSelect!.options[this.deviceSelect!.selectedIndex];
          SpRecordTrace.serialNumber = item.value;
        } else {
          this.recordButton!.hidden = true;
          this.disconnectButton!.hidden = true;
          this.devicePrompt!.innerText = 'Device not connected';
          this.sp!.search = false;
          SpRecordTrace.serialNumber = '';
        }
      });
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
    this.spFFRTConfig = new SpFFRTConfig();
    this.spWebShell = new SpWebHdcShell();
    this.spRecordTemplate = new SpRecordTemplate(this);
    this.appContent = this.shadowRoot?.querySelector('#app-content') as HTMLElement;
    if (this.record_template) {
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
      option.selected = supportVersion === '4.0+';
      option.textContent = `OpenHarmony-${supportVersion}`;
      option.setAttribute('device-version', supportVersion);
      this.deviceVersion!.append(option);
      SpRecordTrace.selectVersion = '4.0+';
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
      if (item.title === 'Ark Ts') {
        this.MenuItemArkts = item;
        this.MenuItemArktsHtml = th;
      } else if (item.title === 'eBPF Config') {
        this.MenuItemEbpf = item;
        this.MenuItemEbpfHtml = th;
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
    this.showHint = true;
    if (request.pluginConfigs.length === 0) {
      this.hintEl!.textContent = "It looks like you didn't add any probes. Please add at least one";
      return;
    }
    this.showHint = false;
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

  private makeRequest = (): CreateSessionRequest => {
    let request = createSessionRequest(this.recordSetting!);
    if (this.record_template) {
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
      createArkTsConfig(this.spArkTs!, this.recordSetting!, request);
      createHiLogConfig(reportingFrequency, this.spHiLog!, request);
      createFFRTPluginConfig(this.spFFRTConfig!, SpRecordTrace.selectVersion, request);
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

  private buttonDisable(disable: boolean): void {
    let pointerEventValue = 'auto';
    this.recordButtonText!.textContent = this.record;
    if (disable) {
      pointerEventValue = 'none';
      this.recordButtonText!.textContent = this.stop;
    }
    this.cancelButtonShow(disable);
    this.disconnectButton!.style.pointerEvents = pointerEventValue;
    this.addButton!.style.pointerEvents = pointerEventValue;
    this.deviceSelect!.style.pointerEvents = pointerEventValue;
    this.deviceVersion!.style.pointerEvents = pointerEventValue;
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
      let option = document.createElement('option');
      option.className = 'select';
      option.selected = true;
      option.value = SpRecordTrace.serialNumber;
      option.textContent = SpRecordTrace.serialNumber;
      this.deviceSelect!.appendChild(option);
      this.recordButton!.hidden = false;
      this.disconnectButton!.hidden = false;
      this.devicePrompt!.innerText = '';
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
