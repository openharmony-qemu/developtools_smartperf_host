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

import { BaseElement, element } from '../../../base-ui/BaseElement';
import '../../../base-ui/select/LitSelectV';
import '../../../base-ui/select/LitSelect';

import '../../../base-ui/switch/lit-switch';
import LitSwitch, { LitSwitchChangeEvent } from '../../../base-ui/switch/lit-switch';
import { LitSelectV } from '../../../base-ui/select/LitSelectV';
import { LitAllocationSelect } from '../../../base-ui/select/LitAllocationSelect';
import { SpSdkConfigHtml } from './SpSdkConfig.html';

@element('sp-sdk-config')
export class SpSdkConfig extends BaseElement {
  private worker: Worker | undefined;
  private sdkConfigList: unknown;
  private customConfig: HTMLDivElement | undefined | null;
  private selectConfig: LitSelectV | undefined | null;
  private list: Array<HTMLElement> | undefined;
  private pluginName: string = '';
  private sampleInterval: number = 5000;

  static get observedAttributes(): string[] {
    return ['configName', 'value', 'type'];
  }

  get show(): boolean {
    return this.hasAttribute('show');
  }

  set show(sdkConfigShow: boolean) {
    if (sdkConfigShow) {
      this.setAttribute('show', '');
    } else {
      this.removeAttribute('show');
    }
  }

  set startSamp(sdkConfigStart: boolean) {
    if (sdkConfigStart) {
      this.setAttribute('startSamp', '');
    } else {
      this.removeAttribute('startSamp');
    }
  }

  get startSamp(): boolean {
    return this.hasAttribute('startSamp');
  }

  set configName(configName: string) {
    if (configName !== '') {
      this.setAttribute('configName', configName);
    } else {
      this.removeAttribute('configName');
    }
  }

  get configName(): string {
    return this.getAttribute('configName') || '';
  }

  get type(): string {
    return this.getAttribute('type') || '';
  }

  set type(type: string) {
    if (type !== '') {
      this.setAttribute('type', type);
    } else {
      this.removeAttribute('type');
    }
  }

  private wasmMap: Map<string, unknown> = new Map<string, unknown>();
  private wasmList: Array<string> = [];

  private changGpu(gpuName: string): void {
    let config = this.wasmMap.get(gpuName);
    //@ts-ignore
    this.pluginName = config?.pluginName;
    //@ts-ignore
    this.sampleInterval = config?.sampleInterval;
    let pam = {
      action: 'open',
      //@ts-ignore
      componentId: config.componentId,
      //@ts-ignore
      wasmJsName: config.wasmJsName,
      //@ts-ignore
      WasmName: config.wasmName,
    };
    this.worker!.postMessage(pam);
    this.worker!.onmessage = (event: MessageEvent): void => {
      let results = event.data.results;
      this.sdkConfigList = results.settingConfig;
      this.initConfig();
    };
  }

  getPlugName(): string {
    return this.pluginName;
  }

  getSampleInterval(): number {
    return this.sampleInterval;
  }

  getGpuConfig(): {} {
    let configVal = this.shadowRoot?.querySelectorAll<HTMLElement>('.config');
    let gpuConfig = {};
    for (let i = 0; i < configVal!.length; i++) {
      let configName = configVal![i].getAttribute('configName');
      let type = configVal![i].getAttribute('type');
      if (type === 'enum') {
        let enumValue = configVal![i].getAttribute('value');
        if (enumValue !== undefined && enumValue !== 'undefined') {
          // @ts-ignore
          gpuConfig[configName!] = enumValue;
        }
      } else if (type === 'number' || type === 'integer' || type === 'num') {
        // @ts-ignore
        gpuConfig[configName!] = Number(configVal![i].value);
      } else if (type === 'boolean') {
        let attribute = configVal![i].getAttribute('value');
        // @ts-ignore
        gpuConfig[configName!] = attribute === 'true';
      } else {
        // @ts-ignore
        gpuConfig[configName!] = configVal![i].value;
      }
    }
    return gpuConfig;
  }

  private initSdkWasm(): void {
    try {
      let spApplication = document.querySelector<HTMLElement>('sp-application');
      let wasmJsonUrl = `https://${window.location.host.split(':')[0]}:${window.location.port}/application/wasm.json`;
      if (spApplication!.hasAttribute('vs')) {
        wasmJsonUrl = `http://${window.location.host.split(':')[0]}:${window.location.port}/wasm.json`;
      }
      fetch(wasmJsonUrl)
        .then((res): void => {
          if (res.ok) {
            res.text().then((text) => {
              this.wasmMap = new Map();
              this.wasmList = [];
              let wasmJson = JSON.parse(text);
              let wasmFiles = wasmJson.WasmFiles;
              wasmFiles.forEach((wasmFile: unknown) => {
                //@ts-ignore
                this.wasmMap.set(wasmFile.disPlayName, wasmFile);
                //@ts-ignore
                this.wasmList.push(wasmFile.disPlayName);
              });
            });
          }
        })
        .catch(() => { });
      if (this.worker === null) {
        // @ts-ignore
        if (window.useWb) {
          return;
        }
        this.worker = new Worker(new URL('../../database/ConfigWorker', import.meta.url));
      }
    } catch (e) { }
  }

  initElements(): void {
    this.initSdkWasm();
    this.customConfig = this.shadowRoot?.querySelector<HTMLDivElement>('.configList');
    let switchButton = this.shadowRoot?.querySelector('.config_switch') as LitSwitch;
    switchButton.addEventListener('change', (event: CustomEventInit<LitSwitchChangeEvent>) => {
      let detail = event.detail;
      if (detail!.checked) {
        this.startSamp = true;
        this.isAbleShowConfig(false);
      } else {
        this.startSamp = false;
        this.isAbleShowConfig(true);
      }
    });
    this.selectConfig = this.shadowRoot?.querySelector<LitSelectV>('lit-select-v');
    let inputDiv = this.selectConfig?.shadowRoot?.querySelector('input') as HTMLDivElement;
    inputDiv.addEventListener('mousedown', () => {
      if (this.startSamp) {
        inputDiv!.removeAttribute('readonly');
        this.selectConfig!.dataSource(this.wasmList, '', true);
      } else {
        inputDiv!.setAttribute('readonly', 'readonly');
        return;
      }
    });
    this.list = [];
    this.list.push(this.selectConfig!);
    this.isAbleShowConfig(true);
  }

  private sdkConfigByBooleanType(key: string, sdkConfigSwitch: LitSwitch, sdkConfigHeadDiv: HTMLDivElement): void {
    sdkConfigSwitch.className = 'switch1 config';
    sdkConfigSwitch.setAttribute('configName', key);
    //@ts-ignore
    sdkConfigSwitch.setAttribute('type', this.sdkConfigList.configuration[key].type);
    //@ts-ignore
    if (this.sdkConfigList.configuration[key].default === 'true') {
      sdkConfigSwitch.setAttribute('checked', '');
      sdkConfigSwitch.setAttribute('value', 'true');
    } else {
      sdkConfigSwitch.removeAttribute('checked');
      sdkConfigSwitch.setAttribute('value', 'false');
    }
    sdkConfigHeadDiv.appendChild(sdkConfigSwitch);
    this.list!.push(sdkConfigSwitch);
  }

  private sdkConfigByIntegerType(key: string, sdkConfigDiv: HTMLDivElement, sdkConfigTitle: HTMLSpanElement): void {
    let input = document.createElement('input');
    input.className = 'sdk-config-input config';
    //@ts-ignore
    if (this.sdkConfigList.configuration[key].default) {
      //@ts-ignore
      input.value = this.sdkConfigList.configuration[key].default;
    }
    input.setAttribute('configName', key);
    //@ts-ignore
    input.setAttribute('type', this.sdkConfigList.configuration[key].type);
    input.oninput = (): void => {
      input.value = this.checkIntegerInput(input.value);
      sdkConfigTitle.setAttribute('value', input.value);
    };
    sdkConfigDiv.appendChild(input);
    this.list!.push(input);
  }

  private sdkConfigByNumberType(key: string, sdkConfigDiv: HTMLDivElement): void {
    let numberInput = document.createElement('input');
    numberInput.className = 'sdk-config-input config';
    //@ts-ignore
    if (this.sdkConfigList.configuration[key].default) {
      //@ts-ignore
      numberInput.value = this.sdkConfigList.configuration[key].default;
    }
    numberInput.setAttribute('configName', key);
    numberInput.setAttribute('type', 'num');
    numberInput.oninput = (): void => {
      numberInput.value = this.checkFloatInput(numberInput.value);
    };
    sdkConfigDiv.appendChild(numberInput);
    this.list!.push(numberInput);
  }

  private sdkConfigByStringType(key: string, sdkConfigDiv: HTMLDivElement): void {
    let html = '';
    //@ts-ignore
    if (this.sdkConfigList.configuration[key].enum) {
      let placeholder = '';
      //@ts-ignore
      if (this.sdkConfigList.configuration[key].default) {
        //@ts-ignore
        placeholder = this.sdkConfigList.configuration[key].default;
      }
      //@ts-ignore
      html += `<lit-select-v id="${key}" type="${this.sdkConfigList.configuration[key].type}" 
default-value="" rounded="" class="sdk-config-select config" mode="multiple" canInsert="" 
rounded placement = "bottom" configName ="${key}" placeholder="${placeholder}"></lit-select-v>`;
      sdkConfigDiv.innerHTML = sdkConfigDiv.innerHTML + html;
    } else {
      let inputElement = document.createElement('input');
      inputElement.className = 'sdk-config-input config';
      //@ts-ignore
      if (this.sdkConfigList.configuration[key].default) {
        //@ts-ignore
        inputElement.value = this.sdkConfigList.configuration[key].default;
      }
      inputElement.setAttribute('configName', key);
      //@ts-ignore
      inputElement.setAttribute('type', this.sdkConfigList.configuration[key].type);
      sdkConfigDiv.appendChild(inputElement);
      this.list!.push(inputElement);
    }
  }

  initConfig(): void {
    this.customConfig!.innerHTML = '';
    this.list = [];
    this.list.push(this.selectConfig!);
    let sdkConfigSwitch = document.createElement('lit-switch') as LitSwitch;
    //@ts-ignore
    for (let key in this.sdkConfigList.configuration) {
      let sdkConfigDiv = document.createElement('div');
      sdkConfigDiv.className = 'sdk-config-div';
      let sdkConfigHeadDiv = document.createElement('div');
      sdkConfigDiv.appendChild(sdkConfigHeadDiv);
      let sdkConfigTitle = document.createElement('span');
      sdkConfigTitle.className = 'sdk-config-title';
      sdkConfigTitle.textContent = key;
      sdkConfigHeadDiv.appendChild(sdkConfigTitle);
      let sdkConfigDes = document.createElement('span');
      //@ts-ignore
      sdkConfigDes.textContent = this.sdkConfigList.configuration[key].description;
      sdkConfigDes.className = 'sdk-config-des';
      sdkConfigHeadDiv.appendChild(sdkConfigDes);
      //@ts-ignore
      switch (this.sdkConfigList.configuration[key].type) {
        case 'string':
          this.sdkConfigByStringType(key, sdkConfigDiv);
          break;
        case 'number':
          this.sdkConfigByNumberType(key, sdkConfigDiv);
          break;
        case 'integer':
          this.sdkConfigByIntegerType(key, sdkConfigDiv, sdkConfigTitle);
          break;
        case 'boolean':
          this.sdkConfigByBooleanType(key, sdkConfigSwitch, sdkConfigHeadDiv);
          break;
      }
      this.customConfig!.appendChild(sdkConfigDiv);
      //@ts-ignore
      if (this.sdkConfigList.configuration[key].enum) {
        let select = this.shadowRoot!.querySelector<LitSelectV>(`#${key}`);
        select!.setAttribute('type', 'enum');
        //@ts-ignore
        select!.setAttribute('value', this.sdkConfigList.configuration.key.default);
        //@ts-ignore
        select!.dataSource(this.sdkConfigList.configuration.key.enum, '');
        this.list.push(select!);
        select!.addEventListener('click', () => {
          select!.setAttribute('value', select!.value);
        });
      }
    }
    sdkConfigSwitch.addEventListener('change', () => {
      sdkConfigSwitch.setAttribute('value', `${sdkConfigSwitch.hasAttribute('checked')}`);
    });
  }

  checkIntegerInput(value: string): string {
    let inputValue = value
      .replace(/[^\-\d]|\-{2,}/g, '')
      .replace(/(\d)\-|-(0+)|^0+(\d)/g, '$1')
      .replace(/(-?\d{15})\d*/, '$1');
    return inputValue;
  }

  checkFloatInput(value: string): string {
    let inputValue = value
      .replace(/[^\d.]/g, '')
      .replace(/^\.|^0+(\d)/g, '')
      .replace(/(\.\d+)\.|(-)\.|(\d+|\.)-/g, '$1')
      .replace(/(-?\d{9})\d*/, '$1');
    return inputValue.replace(/\.{2,}|-(0){2,}|(-)0+(\d+)/g, '.');
  }

  isAbleShowConfig(isAbleShow: boolean): void {
    if (this.list!) {
      if (isAbleShow) {
        this.list!.forEach((item) => {
          item.setAttribute('disabled', '');
        });
      } else {
        this.list!.forEach((item) => {
          item.removeAttribute('disabled');
        });
      }
    }
  }

  initHtml(): string {
    return SpSdkConfigHtml;
  }
}
