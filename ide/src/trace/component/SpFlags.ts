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
const VSYNC_VAL = {
  'VsyncGeneratior': 'H:VsyncGenerator',
  'Vsync-rs': 'H:rs_SendVsync',
  'Vsync-app': 'H:app_SendVsync'
};

const CAT_SORT = {
  'Business first': 'business',
  'Thread first': 'thread'
};

const CONFIG_STATE: unknown = {
  'VSync': ['vsyncValue', 'VsyncGeneratior'],
  'Start&Finish Trace Category': ['catValue', 'Business first'],
  'Hangs': ['hangsSelect', 'Instant'],
};

@element('sp-flags')
export class SpFlags extends BaseElement {
  private bodyEl: HTMLElement | undefined | null;

  initElements(): void {
    let parentElement = this.parentNode as HTMLElement;
    parentElement.style.overflow = 'hidden';
    this.bodyEl = this.shadowRoot?.querySelector('.body');
    this.initConfigList();
  }

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

      if (config.title === 'VSync') {
        //@ts-ignore
        let configKey = CONFIG_STATE[config.title]?.[0];
        let configFooterDiv = this.createPersonOption(VSYNC_VAL, configKey, <string>config.addInfo!.vsyncValue, config.title);
        configDiv.appendChild(configFooterDiv);
      }

      if (config.title === 'Start&Finish Trace Category') {
        //@ts-ignore
        let configKey = CONFIG_STATE[config.title]?.[0];
        let configFooterDiv = this.createPersonOption(CAT_SORT, configKey, <string>config.addInfo!.catValue, config.title);
        configDiv.appendChild(configFooterDiv);
      }

      if (config.title === 'Hangs') {
        let configFooterDiv = this.createHangsOption();
        configDiv.appendChild(configFooterDiv);
      }

      this.bodyEl!.appendChild(configDiv);
    });
  }

  private createPersonOption(list: unknown, key: string, defaultKey: string, parentOption: string): HTMLDivElement {
    let configFooterDiv = document.createElement('div');
    configFooterDiv.className = 'config_footer';
    let vsyncLableEl = document.createElement('lable');
    vsyncLableEl.className = 'list_lable';
    let vsyncTypeEl = document.createElement('select');
    vsyncTypeEl.setAttribute('id', key);
    vsyncTypeEl.className = 'flag-select';
    //根据给出的list遍历添加option下来选框
    // @ts-ignore
    for (let k of Object.keys(list)) {
      let option = document.createElement('option'); // VsyncGeneratior = H:VsyncGenerator
      // @ts-ignore
      option.value = list[k];
      option.textContent = k;
      // @ts-ignore
      if (list[k] === defaultKey) {
        option.selected = true;
        FlagsConfig.updateFlagsConfig(key, option.value);
      }
      vsyncTypeEl.appendChild(option);
    }
    vsyncTypeEl.addEventListener('change', function () {
      let selectValue = this.selectedOptions[0].value;
      FlagsConfig.updateFlagsConfig(key, selectValue);
    });

    let flagsItem = window.localStorage.getItem(FlagsConfig.FLAGS_CONFIG_KEY);
    let flagsItemJson = JSON.parse(flagsItem!);
    let vsync = flagsItemJson[parentOption];
    if (vsync === 'Enabled') {
      vsyncTypeEl.removeAttribute('disabled');
    } else {
      vsyncTypeEl.setAttribute('disabled', 'disabled');
      FlagsConfig.updateFlagsConfig(key, defaultKey);
    }
    configFooterDiv.appendChild(vsyncLableEl);
    configFooterDiv.appendChild(vsyncTypeEl);
    return configFooterDiv;
  }

  /// Flags新增Hangs下拉框
  private createHangsOption(): HTMLDivElement {
    let configFooterDiv = document.createElement('div');
    configFooterDiv.className = 'config_footer';
    let hangsLableEl = document.createElement('lable');
    hangsLableEl.className = 'hangs_lable';
    let hangsTypeEl = document.createElement('select');
    hangsTypeEl.setAttribute('id', 'hangsSelect');
    hangsTypeEl.className = 'flag-select';

    let hangOptions: Array<HTMLElementTagNameMap['option']> = [];
    for (const settings of [
      { value: '33', content: 'Instant' },
      { value: '100', content: 'Circumstantial' },
      { value: '250', content: 'Micro' },
      { value: '500', content: 'Severe' }
    ]) {
      let hangOption = document.createElement('option');
      hangOption.value = settings.value + '000000';
      hangOption.textContent = settings.content;
      hangOption.selected = false;
      hangOptions.push(hangOption);
      hangsTypeEl.appendChild(hangOption);
    }

    FlagsConfig.updateFlagsConfig('hangValue', hangOptions[0].value);
    hangOptions[0].selected = true;
    hangsTypeEl.addEventListener('change', function () {
      let selectValue = this.selectedOptions[0].value;
      FlagsConfig.updateFlagsConfig('hangValue', selectValue);
    });

    let flagsItem = window.localStorage.getItem(FlagsConfig.FLAGS_CONFIG_KEY);
    let flagsItemJson = JSON.parse(flagsItem!);
    let hangs = flagsItemJson.Hangs;
    if (hangs === 'Enabled') {
      hangsTypeEl.removeAttribute('disabled');
    } else {
      hangsTypeEl.setAttribute('disabled', 'disabled');
    }
    configFooterDiv.appendChild(hangsLableEl);
    configFooterDiv.appendChild(hangsTypeEl);
    return configFooterDiv;
  }
}

export type Params = {
  [key: string]: unknown;
};

export class FlagsConfig {
  static FLAGS_CONFIG_KEY = 'FlagsConfig';
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
      switchOptions: [{ option: 'Enabled' }, { option: 'Disabled', selected: true }],
      describeContent: '',
    },
    {
      title: 'VSync',
      switchOptions: [{ option: 'Enabled' }, { option: 'Disabled', selected: true }],
      describeContent: 'VSync Signal drawing',
      addInfo: { vsyncValue: VSYNC_VAL.VsyncGeneratior },
    },
    {
      title: 'Hangs',
      switchOptions: [{ option: 'Enabled' }, { option: 'Disabled', selected: true }],
      describeContent: '',
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
      addInfo: { catValue: CAT_SORT['Business first'] },
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
