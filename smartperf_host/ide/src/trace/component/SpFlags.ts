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
import { SpFlagHtml } from './SpFlag.html';
import { LitSelectV } from '../../base-ui/select/LitSelectV';
import { SysCallMap } from './trace/base/SysCallUtils';

const NUM = '000000';
//vsync二级下拉选框对应的value和content
const VSYNC_CONTENT = [
  { value: 'H:VsyncGenerator', content: 'VsyncGeneratior' },
  { value: 'H:rs_SendVsync', content: 'Vsync-rs' },
  { value: 'H:app_SendVsync', content: 'Vsync-app' }
];
//cat二级下拉选框对应的value和content
const CAT_CONTENT = [
  { value: 'business', content: 'Business first' },
  { value: 'thread', content: 'Thread first' }
];
//hang二级下拉选框对应的value和content
const HANG_CONTENT = [
  { value: `33${NUM}`, content: 'Instant' },
  { value: `100${NUM}`, content: 'Circumstantial' },
  { value: `250${NUM}`, content: 'Micro' },
  { value: `500${NUM}`, content: 'Severe' }
];

//整合默认值
const CONFIG_STATE: unknown = {
  'VSync': ['vsyncValue', 'VsyncGeneratior'],
  'Start&Finish Trace Category': ['catValue', 'Business first'],
  'Hangs Detection': ['hangValue', 'Instant'],
};

@element('sp-flags')
export class SpFlags extends BaseElement {
  private bodyEl: HTMLElement | undefined | null;
  private systemCallSelect: LitSelectV | undefined | null;
  private systemCallInput: HTMLInputElement | undefined | null;
  private systemCallEventId: number[] = [];
  private systemCallSwitch: HTMLSelectElement | undefined | null;


  connectedCallback(): void {
    this.systemCallSelect?.addEventListener('blur', this.systemCallSelectBlurHandler);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.systemCallSelect?.removeEventListener('blur', this.systemCallSelectBlurHandler);
  }

  initElements(): void {
    let parentElement = this.parentNode as HTMLElement;
    parentElement.style.overflow = 'hidden';
    this.bodyEl = this.shadowRoot?.querySelector('.body');
    this.initConfigList();
    this.systemCallSelect = this.shadowRoot?.querySelector<LitSelectV>("lit-select-v[title='SystemCall']");
    this.systemCallSwitch = this.shadowRoot?.querySelector("select[title='System Calls']");
    this.systemCallInput = this.systemCallSelect!.shadowRoot?.querySelector('input') as HTMLInputElement;
    this.updateSystemCallSelect();
  }

   private updateSystemCallSelect(): void {
    const selectedArr = FlagsConfig.getSystemcallEventId('SystemParsing');
    let checkAll = true;
    systemCallConfigList[0].selectArray = Array.from(SysCallMap.entries())
          .map(([id, name]) => {
            if (!selectedArr.includes(id)) {
              checkAll = false;
            }
            return `${name}`;
          });
    this.systemCallSelect?.dataSource(systemCallConfigList[0].selectArray, 'ALL-SystemCall');
    this.systemCallSelect?.setIgnoreValues(['ALL-SystemCall']);
    if (this.systemCallSwitch?.title === 'System Calls' && this.systemCallSwitch.selectedOptions[0].value === 'Enabled') {
      this.systemCallSelect?.removeAttribute('disabled');
      const arr = checkAll ? ['ALL-SystemCall' ] : [];
      FlagsConfig.getSystemcallEventId('SystemParsing').forEach(it => arr.push(SysCallMap.get(it) || ''));
      this.systemCallSelect?.setSelectedOptions(arr);
    } else {
      this.systemCallSelect?.setAttribute('disabled', 'disabled');
      this.systemCallSelect?.setSelectedOptions([]);
    }
  }

  private systemCallSelectBlurHandler = () => {
    let systemCallSelectOptions = this.systemCallSelect!.shadowRoot?.querySelectorAll('.option');
    this.systemCallEventId = [];
    systemCallSelectOptions!.forEach((option) => {
      if (option.hasAttribute('selected')) {
        const systemCallEventItem = Array.from(SysCallMap.entries())
            .find(([id, name]) => name === option.getAttribute('value'));
        if (systemCallEventItem) {
          this.handleSystemCallEventId(systemCallEventItem[0]);
        }
      }
    });
    FlagsConfig.updateSystemcallEventId(this.systemCallEventId, 'SystemParsing');
    return this.systemCallEventId;
  };

  private handleSystemCallEventId = (systemCallEventId: number): void => {
    this.systemCallEventId.push(systemCallEventId);
  };

  initHtml(): string {
    return SpFlagHtml;
  }

  private createConfigDiv(): HTMLDivElement {
    let configDiv = document.createElement('div');
    configDiv.className = 'flag-widget';
    return configDiv;
  }
  //控制按钮设置为'Disabled'时，我们需要给一个默认值
  private createCustomDiv(config: FlagConfigItem, configDiv: HTMLDivElement): void {
    let configHadDiv = document.createElement('div');
    configHadDiv.className = 'flag-head-div';
    let titleLabel = document.createElement('label');
    titleLabel.textContent = config.title;
    titleLabel.className = 'flag-title-label';
    let configSelect = document.createElement('select');
    configSelect.className = 'flag-select';
    configSelect.setAttribute('title', config.title);
    config.switchOptions.forEach((optionItem) => {
      let configOption = document.createElement('option');
      configOption.value = optionItem.option;
      configOption.textContent = optionItem.option;
      if (optionItem.selected) {
        configOption.selected = true;
      }
      configSelect.appendChild(configOption);
    });
    configSelect.addEventListener('change', () => {
      this.flagSelectListener(configSelect);
      if (configSelect.title === 'System Calls') {
        if (configSelect.selectedOptions[0].value === 'Enabled') {
          this.systemCallSelect?.removeAttribute('disabled');
        } else {
          this.systemCallSelect?.setAttribute('disabled', 'disabled');
          this.systemCallEventId = [];
          FlagsConfig.updateSystemcallEventId([], 'SystemParsing');
          this.systemCallSelect?.setSelectedOptions([]);
        }
      }
    });
    let description = document.createElement('div');
    description.className = 'flag-des-div';
    description.textContent = config.describeContent;
    configHadDiv.appendChild(titleLabel);
    configHadDiv.appendChild(configSelect);
    configDiv.appendChild(configHadDiv);
    configDiv.appendChild(description);
  }
  //监听flag-select的状态选择
  private flagSelectListener(configSelect: HTMLSelectElement): void {
    // @ts-ignore
    let title = configSelect.getAttribute('title');
    //@ts-ignore
    let listSelect = this.shadowRoot?.querySelector(`#${CONFIG_STATE[title]?.[0]}`);
    // @ts-ignore
    FlagsConfig.updateFlagsConfig(title!, configSelect.selectedOptions[0].value);
    //@ts-ignore
    if (listSelect) {
      // @ts-ignore
      if (configSelect.selectedOptions[0].value === 'Enabled') {
        listSelect?.removeAttribute('disabled');
      } else {
        listSelect?.childNodes.forEach((child: ChildNode) => {
          let selectEl = child as HTMLOptionElement;
          //@ts-ignore
          if (child.textContent === CONFIG_STATE[title]?.[1]) {
            selectEl.selected = true;
            //@ts-ignore
            FlagsConfig.updateFlagsConfig(CONFIG_STATE[title]?.[0], selectEl.value);
          } else {
            selectEl.selected = false;
          }
        });
        listSelect?.setAttribute('disabled', 'disabled');
      }
    }
  }

  //初始化Flag对应的内容
  private initConfigList(): void {
    let allConfig = FlagsConfig.getAllFlagConfig();
    allConfig.forEach((config) => {
      let configDiv = this.createConfigDiv();
      this.createCustomDiv(config, configDiv);
      if (config.title === 'AnimationAnalysis') {
        let configFooterDiv = document.createElement('div');
        configFooterDiv.className = 'config_footer';
        let deviceWidthLabelEl = document.createElement('label');
        deviceWidthLabelEl.className = 'device_label';
        deviceWidthLabelEl.textContent = 'PhysicalWidth :';
        let deviceWidthEl = document.createElement('input');
        deviceWidthEl.value = <string>config.addInfo!.physicalWidth;
        deviceWidthEl.addEventListener('keyup', () => {
          deviceWidthEl.value = deviceWidthEl.value.replace(/\D/g, '');
        });
        deviceWidthEl.addEventListener('blur', () => {
          if (deviceWidthEl.value !== '') {
            FlagsConfig.updateFlagsConfig('physicalWidth', Number(deviceWidthEl.value));
          }
        });
        deviceWidthEl.className = 'device_input';
        let deviceHeightLabelEl = document.createElement('label');
        deviceHeightLabelEl.textContent = 'PhysicalHeight :';
        deviceHeightLabelEl.className = 'device_label';
        let deviceHeightEl = document.createElement('input');
        deviceHeightEl.className = 'device_input';
        deviceHeightEl.value = <string>config.addInfo!.physicalHeight;
        deviceHeightEl.addEventListener('keyup', () => {
          deviceHeightEl.value = deviceHeightEl.value.replace(/\D/g, '');
        });
        deviceHeightEl.addEventListener('blur', () => {
          if (deviceWidthEl.value !== '') {
            FlagsConfig.updateFlagsConfig('physicalHeight', Number(deviceHeightEl.value));
          }
        });
        configFooterDiv.appendChild(deviceWidthLabelEl);
        configFooterDiv.appendChild(deviceWidthEl);
        configFooterDiv.appendChild(deviceHeightLabelEl);
        configFooterDiv.appendChild(deviceHeightEl);
        configDiv.appendChild(configFooterDiv);
      }
      //@ts-ignore
      let configKey = CONFIG_STATE[config.title]?.[0];
      if (config.title === 'VSync') {//初始化Vsync
        let configFooterDiv = this.createPersonOption(VSYNC_CONTENT, configKey, config);
        configDiv.appendChild(configFooterDiv);
      }

      if (config.title === 'Start&Finish Trace Category') {//初始化Start&Finish Trace Category
        let configFooterDiv = this.createPersonOption(CAT_CONTENT, configKey, config);
        configDiv.appendChild(configFooterDiv);
      }

      if (config.title === 'Hangs Detection') {//初始化Hangs Detection
        let configFooterDiv = this.createPersonOption(HANG_CONTENT, configKey, config);
        configDiv.appendChild(configFooterDiv);
      }
      if (config.title === 'System Calls') {
        let configFooterDiv = document.createElement('div');
        configFooterDiv.className = 'config_footer';
        let systemCallConfigEl = document.createElement('div');
        systemCallConfigEl.className = 'system-call-config';
        systemCallConfigList.forEach((config) => {
          let systemCallConfigDiv = document.createElement('div');
          if (config.hidden) {
            systemCallConfigDiv.className = 'systemCall-config-div hidden';
          } else {
            systemCallConfigDiv.className = 'systemCall-config-div';
          }
          switch (config.type) {
            case 'select-multiple':
              this.configTypeBySelectMultiple(config, systemCallConfigDiv);
              break;
            default:
              break;
          }
          systemCallConfigEl.appendChild(systemCallConfigDiv);
        })
        configFooterDiv.appendChild(systemCallConfigEl);
        configDiv.appendChild(configFooterDiv);
      }
      this.bodyEl!.appendChild(configDiv);
    });
  }

  private configTypeBySelectMultiple(config: unknown, systemCallConfigDiv: HTMLDivElement): void {
    let html = '';
    //@ts-ignore
    let placeholder = config.selectArray[0];
    html += `<lit-select-v default-value='' rounded='' class='systemCall-config-select config' 
mode='multiple' canInsert='' title='${
        //@ts-ignore
        config.title
    }' rounded placement = 'bottom' placeholder='${placeholder}'>`;
    //@ts-ignore
    config.selectArray.forEach((value: string) => {
      html += `<lit-select-option value='${value}'>${value}</lit-select-option>`;
    });
    html += '</lit-select-v>';
    systemCallConfigDiv.innerHTML = systemCallConfigDiv.innerHTML + html;
  }

  private createPersonOption(list: unknown, key: string, config: unknown): HTMLDivElement {
    let configFooterDiv = document.createElement('div');
    configFooterDiv.className = 'config_footer';
    let lableEl = document.createElement('lable');
    lableEl.className = 'list_lable';
    let typeEl = document.createElement('select');
    typeEl.setAttribute('id', key);
    typeEl.className = 'flag-select';
    //根据给出的list遍历添加option下来选框
    //@ts-ignore
    for (const settings of list) {
      let option = document.createElement('option');
      option.value = settings.value;
      option.textContent = settings.content;
      //初始化二级按钮状态
      //@ts-ignore
      if (option.value === config.addInfo?.[key]) {
        option.selected = true;
        FlagsConfig.updateFlagsConfig(key, option.value);
      }
      typeEl.appendChild(option);
    }
    typeEl.addEventListener('change', function () {
      let selectValue = this.selectedOptions[0].value;
      FlagsConfig.updateFlagsConfig(key, selectValue);
    });
    let flagsItem = window.localStorage.getItem(FlagsConfig.FLAGS_CONFIG_KEY);
    let flagsItemJson = JSON.parse(flagsItem!);
    //@ts-ignore
    let vsync = flagsItemJson[config.title];
    if (vsync === 'Enabled') {
      typeEl.removeAttribute('disabled');
    } else {
      typeEl.setAttribute('disabled', 'disabled');
      //@ts-ignore
      FlagsConfig.updateFlagsConfig(key, config.addInfo?.[key]);
    }
    configFooterDiv.appendChild(lableEl);
    configFooterDiv.appendChild(typeEl);
    return configFooterDiv;
  }
}

export type Params = {
  [key: string]: unknown;
};

export class FlagsConfig {
  static FLAGS_CONFIG_KEY = 'FlagsConfig';
  static SYSTEM_PRASE = 'SystemParsing';
  static DEFAULT_CONFIG: Array<FlagConfigItem> = [
    {
      title: 'TaskPool',
      switchOptions: [{ option: 'Enabled' }, { option: 'Disabled', selected: true }],
      describeContent: 'Analyze TaskPool templates',
    },
    {
      title: 'AnimationAnalysis',
      switchOptions: [{ option: 'Enabled' }, { option: 'Disabled', selected: true }],
      describeContent: 'Analyze Animation effect templates',
      addInfo: { physicalWidth: 0, physicalHeight: 0 },
    },
    {
      title: 'AppStartup',
      switchOptions: [{ option: 'Enabled' }, { option: 'Disabled', selected: true }],
      describeContent: 'App Startup templates',
    },
    {
      title: 'SchedulingAnalysis',
      switchOptions: [{ option: 'Enabled' }, { option: 'Disabled', selected: true }],
      describeContent: 'Scheduling analysis templates',
    },
    {
      title: 'BinderRunnable',
      switchOptions: [{ option: 'Enabled' }, { option: 'Disabled', selected: true }],
      describeContent: 'support Cpu State Binder-Runnable',
    },
    {
      title: 'FfrtConvert',
      switchOptions: [{ option: 'Enabled' }, { option: 'Disabled', selected: true }],
      describeContent: 'Ffrt Convert templates',
    },
    {
      title: 'HMKernel',
      switchOptions: [{ option: 'Enabled', selected: true }, { option: 'Disabled' }],
      describeContent: '',
    },
    {
      title: 'VSync',
      switchOptions: [{ option: 'Enabled' }, { option: 'Disabled', selected: true }],
      describeContent: 'VSync Signal drawing',
      addInfo: { vsyncValue: VSYNC_CONTENT[0].value },
    },
    {
      title: 'Hangs Detection',
      switchOptions: [{ option: 'Enabled' }, { option: 'Disabled', selected: true }],
      describeContent: 'hangs type:Instant(33ms~100ms),Circumstantial(100ms~250ms),Micro(250ms~500ms),Severe(>=500ms)',
      addInfo: { hangValue: HANG_CONTENT[0].value },
    },
    {
      title: 'LTPO',
      switchOptions: [{ option: 'Enabled' }, { option: 'Disabled', selected: true }],
      describeContent: 'Lost Frame and HitchTime templates',
    },
    {
      title: 'Start&Finish Trace Category',
      switchOptions: [{ option: 'Enabled' }, { option: 'Disabled', selected: true }],
      describeContent: 'Asynchronous trace aggregation',
      addInfo: { catValue: CAT_CONTENT[0].value },
    },
    {
      title: 'UserPluginsRow',
      switchOptions: [{ option: 'Enabled' }, { option: 'Disabled', selected: true }],
      describeContent: 'User Upload Plugin To Draw',
    },
    {
      title: 'CPU by Irq',
      switchOptions: [{ option: 'Enabled' }, { option: 'Disabled', selected: true }],
      describeContent: 'The real CPU after being split by irq and softirq',
    },
    {
      title: 'RawTraceCutStartTs',
      switchOptions: [{ option: 'Enabled', selected: true }, { option: 'Disabled' }],
      describeContent: 'Raw Trace Cut By StartTs, StartTs = Max(Cpu1 StartTs, Cpu2 StartTs, ..., CpuN StartTs)',
    },
    {
      title: 'System Calls',
      switchOptions: [{ option: 'Enabled' }, { option: 'Disabled', selected: true }],
      describeContent: 'Start System Call Parsing',
      addInfo: { userId: '' },
    }
  ];

  static getAllFlagConfig(): Array<FlagConfigItem> {
    let flagsConfigStr = window.localStorage.getItem(FlagsConfig.FLAGS_CONFIG_KEY);
    if (flagsConfigStr === null) {
      let flagConfigObj: Params = {};
      FlagsConfig.DEFAULT_CONFIG.forEach((config) => {
        let selectedOption = config.switchOptions.filter((option) => {
          return option.selected;
        });
        let value = config.switchOptions[0].option;
        if (selectedOption[0] !== undefined) {
          value = selectedOption[0].option;
        }
        flagConfigObj[config.title] = value;
        if (config.addInfo) {
          for (const [key, value] of Object.entries(config.addInfo)) {
            flagConfigObj[key] = value;
          }
        }
      });
      window.localStorage.setItem(FlagsConfig.FLAGS_CONFIG_KEY, JSON.stringify(flagConfigObj));
      return FlagsConfig.DEFAULT_CONFIG;
    } else {
      let flagsConfig = JSON.parse(flagsConfigStr);
      FlagsConfig.DEFAULT_CONFIG.forEach((config) => {
        let cfg = flagsConfig[config.title];
        if (cfg) {
          config.switchOptions.forEach((option) => {
            if (option.option === cfg) {
              option.selected = true;
            } else {
              option.selected = false;
            }
          });
        }
        if (config.addInfo) {
          for (const [key, value] of Object.entries(config.addInfo)) {
            let cfg = flagsConfig[key];
            if (cfg) {
              config.addInfo[key] = cfg;
            }
          }
        }
      });
    }
    return FlagsConfig.DEFAULT_CONFIG;
  }

  static getSpTraceStreamParseConfig(): string {
    let parseConfig = {};
    FlagsConfig.getAllFlagConfig().forEach((configItem) => {
      let selectedOption = configItem.switchOptions.filter((option) => {
        return option.selected;
      });
      // @ts-ignore
      parseConfig[configItem.title] = selectedOption[0].option === 'Enabled' ? 1 : 0;
      // @ts-ignore
      if (configItem.title === 'System Calls') {
        // @ts-ignore
        parseConfig[configItem.title] =  selectedOption[0].option === 'Enabled' ? FlagsConfig.getSystemcallEventId('SystemParsing').join(';') : '';
      }
    });
    return JSON.stringify({ config: parseConfig });
  }

  static getFlagsConfig(flagName: string): Params | undefined {
    let flagConfigObj: Params = {};
    let configItem = FlagsConfig.getAllFlagConfig().find((config) => {
      return config.title === flagName;
    });
    if (configItem) {
      let selectedOption = configItem.switchOptions.filter((option) => {
        return option.selected;
      });
      let value = configItem.switchOptions[0].option;
      if (selectedOption[0] !== undefined) {
        value = selectedOption[0].option;
      }
      flagConfigObj[configItem.title] = value;
      if (configItem.addInfo) {
        for (const [key, value] of Object.entries(configItem.addInfo)) {
          flagConfigObj[key] = value;
        }
      }
      return flagConfigObj;
    } else {
      return configItem;
    }
  }

  static getFlagsConfigEnableStatus(flagName: string): boolean {
    let config = FlagsConfig.getFlagsConfig(flagName);
    let enable: boolean = false;
    if (config && config[flagName]) {
      enable = config[flagName] === 'Enabled';
    }
    return enable;
  }
  //获取Cat的二级下拉选框所选的内容
  static getSecondarySelectValue(value: string): string {
    let list = window.localStorage.getItem(FlagsConfig.FLAGS_CONFIG_KEY);
    let listJson = JSON.parse(list!);
    let catSelectValue = listJson[value];
    return catSelectValue;
  }

  static updateFlagsConfig(key: string, value: unknown): void {
    let flagsConfigStr = window.localStorage.getItem(FlagsConfig.FLAGS_CONFIG_KEY);
    let flagConfigObj: Params = {};
    if (flagsConfigStr !== null) {
      flagConfigObj = JSON.parse(flagsConfigStr);
    }
    flagConfigObj[key] = value;
    window.localStorage.setItem(FlagsConfig.FLAGS_CONFIG_KEY, JSON.stringify(flagConfigObj));
  }


  static getSystemcallEventId(value: string): number[] {
    let list = window.localStorage.getItem(FlagsConfig.SYSTEM_PRASE);
    return JSON.parse(list!) || [];
  }

  static updateSystemcallEventId(systemCallEventId: number[], value: unknown): void {
    let systemCallEventIdArray:number[] = [];
    if (systemCallEventId !== null) {
      systemCallEventIdArray = systemCallEventId;
    }
    window.localStorage.setItem(FlagsConfig.SYSTEM_PRASE, JSON.stringify(systemCallEventIdArray));
  }
}

export interface FlagConfigItem {
  title: string;
  switchOptions: OptionItem[];
  describeContent: string;
  addInfo?: Params;
}

export interface OptionItem {
  option: string;
  selected?: boolean;
}

const systemCallConfigList = [
  {
    title: 'SystemCall',
    des: '',
    hidden: true,
    type: 'select-multiple',
    selectArray: [''],
  }]
