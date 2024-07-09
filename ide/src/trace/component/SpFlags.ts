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
      let title = configSelect.getAttribute('title');
      FlagsConfig.updateFlagsConfig(title!, configSelect.selectedOptions[0].value);
      if (title === 'VSync' && configSelect.selectedOptions[0].value === 'Enabled') {
        let vsyncSelect = this.shadowRoot?.querySelector('#vsyncSelect');
        vsyncSelect?.removeAttribute('disabled');
      }
      if (title === 'VSync' && configSelect.selectedOptions[0].value === 'Disabled') {
        let vsyncSelect = this.shadowRoot?.querySelector('#vsyncSelect');
        vsyncSelect?.childNodes.forEach((child: ChildNode) => {
          let selectEl = child as HTMLOptionElement;
          if (child.textContent === 'VsyncGenerator') {
            selectEl.selected = true;
            FlagsConfig.updateFlagsConfig('vsyncValue', selectEl.value);
          } else {
            selectEl.selected = false;
          }
        });

        vsyncSelect?.setAttribute('disabled', 'disabled');
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
        let configFooterDiv = this.createVsyncOption();
        configDiv.appendChild(configFooterDiv);
      }

      this.bodyEl!.appendChild(configDiv);
    });
  }

  private createVsyncOption(): HTMLDivElement {
    let configFooterDiv = document.createElement('div');
    configFooterDiv.className = 'config_footer';
    let vsyncLableEl = document.createElement('lable');
    vsyncLableEl.className = 'vsync_lable';
    let vsyncTypeEl = document.createElement('select');
    vsyncTypeEl.setAttribute('id', 'vsyncSelect');
    vsyncTypeEl.className = 'flag-select';
    let vsyncGenOption = document.createElement('option'); // VsyncGeneratior = H:VsyncGenerator
    vsyncGenOption.value = 'H:VsyncGenerator';
    vsyncGenOption.textContent = 'VsyncGenerator';
    vsyncGenOption.selected = true;
    vsyncTypeEl.appendChild(vsyncGenOption);

    let vsyncRsOption = document.createElement('option'); // Vsync-rs = H:rs_SendVsync
    vsyncRsOption.value = 'H:rs_SendVsync';
    vsyncRsOption.textContent = 'Vsync-rs';
    vsyncTypeEl.appendChild(vsyncRsOption);

    let vsyncAppOption = document.createElement('option'); // Vsync-app = H:app_SendVsync
    vsyncAppOption.value = 'H:app_SendVsync';
    vsyncAppOption.textContent = 'Vsync-app';
    vsyncTypeEl.appendChild(vsyncAppOption);

    FlagsConfig.updateFlagsConfig('vsyncValue', vsyncGenOption.value);
    vsyncTypeEl.addEventListener('change', function () {
      let selectValue = this.selectedOptions[0].value;
      console.log(this);
      console.log(this.selectedOptions[0]);
      console.log(this.selectedOptions[0].value);
      FlagsConfig.updateFlagsConfig('vsyncValue', selectValue);
    });

    let flagsItem = window.localStorage.getItem(FlagsConfig.FLAGS_CONFIG_KEY);
    let flagsItemJson = JSON.parse(flagsItem!);
    let vsync = flagsItemJson.VSync;
    if (vsync === 'Enabled') {
      vsyncTypeEl.removeAttribute('disabled');
    } else {
      vsyncTypeEl.setAttribute('disabled', 'disabled');
      FlagsConfig.updateFlagsConfig('vsyncValue', vsyncGenOption.value);
    }
    configFooterDiv.appendChild(vsyncLableEl);
    configFooterDiv.appendChild(vsyncTypeEl);
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
      title: 'Bpftrace',
      switchOptions: [{ option: 'Enabled' }, { option: 'Disabled', selected: true }],
      describeContent: '',
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
    },
    {
      title: 'LTPO',
      switchOptions: [{ option: 'Enabled' }, { option: 'Disabled', selected: true }],
      describeContent: 'Lost Frame and HitchTime templates',
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
