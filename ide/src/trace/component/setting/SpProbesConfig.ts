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
import { SpCheckDesBox } from './SpCheckDesBox';
import { LitCheckBox, LitCheckBoxChangeEvent } from '../../../base-ui/checkbox/LitCheckBox';
import { LitRadioGroup } from '../../../base-ui/radiobox/LitRadioGroup';
import { info, log } from '../../../log/Log';
import { LitSlider } from '../../../base-ui/slider/LitSlider';
import LitSwitch from '../../../base-ui/switch/lit-switch';
import { SpProbesConfigHtml } from './SpProbesConfig.html';

@element('probes-config')
export class SpProbesConfig extends BaseElement {
  private hitrace: SpCheckDesBox | undefined;
  private _traceConfig: HTMLElement | undefined;
  private _memoryConfig: HTMLElement | undefined | null;
  private _abilityConfig: HTMLElement | undefined | null;
  private ftraceBufferSizeResult: HTMLDivElement | null | undefined;
  private ftraceSlider: LitSlider | null | undefined;

  private ftraceBuffSizeResultInput: HTMLInputElement | null | undefined;

  set startSamp(allocationStart: boolean) {
    if (allocationStart) {
      this.setAttribute('startSamp', '');
    } else {
      this.removeAttribute('startSamp');
    }
  }

  get startSamp(): boolean {
    return this.hasAttribute('startSamp');
  }

  get traceConfig() {
    let selectedTrace = this._traceConfig?.
      querySelectorAll<SpCheckDesBox>('check-des-box[checked]') || [];
    let values = [];
    for (const litCheckBoxElement of selectedTrace) {
      values.push(litCheckBoxElement.value);
    }
    if (this.hitrace && this.hitrace.checked) {
      values.push(this.hitrace.value);
    }
    info('traceConfig is :', values);
    return values;
  }

  get ftraceBufferSize(): number {
    if (this.ftraceBufferSizeResult?.hasAttribute('percent')) {
      return Number(this.ftraceBufferSizeResult?.getAttribute('percent'));
    }
    return 20480;
  }

  get memoryConfig() {
    let values = [];
    let selectedMemory = this._memoryConfig?.querySelectorAll<SpCheckDesBox>(
      'check-des-box[checked]'
    ) as NodeListOf<SpCheckDesBox>;
    for (const litCheckBoxElement of selectedMemory) {
      values.push(litCheckBoxElement.value);
    }
    log(`memoryConfig size is :${values.length}`);
    return values;
  }

  get recordAbility(): boolean {
    let selectedMemory = this._abilityConfig?.querySelectorAll<SpCheckDesBox>(
      'check-des-box[checked]'
    ) as NodeListOf<SpCheckDesBox>;
    return selectedMemory.length > 0;
  }

  get traceEvents() {
    let values = [];
    if (this.hitrace && this.hitrace.checked) {
      let parent = this.shadowRoot?.querySelector('.user-events') as Element;
      const siblingNode = parent?.querySelectorAll<LitCheckBox>('lit-check-box[name=userEvents][checked]');
      for (const litCheckBoxElement of siblingNode) {
        values.push(litCheckBoxElement.value);
      }
    }
    log(`traceEvents size is :${values.length}`);
    return values;
  }

  get hilogConfig() {
    let logLevel = this.shadowRoot?.getElementById('logLevel') as LitCheckBox;
    if (logLevel.checked) {
      let logRadio = this.shadowRoot?.getElementById('log-radio') as LitRadioGroup;
      return logRadio.value;
    } else {
      return [];
    }
  }

  private initTraceConfigList(): void {
    this._traceConfig = this.shadowRoot?.querySelector('.trace-config') as HTMLElement;
    traceConfigList.forEach((configBean) => {
      let checkDesBox = new SpCheckDesBox();
      checkDesBox.value = configBean.value;
      checkDesBox.checked = configBean.isSelect;
      checkDesBox.des = configBean.des;
      checkDesBox.addEventListener('onchange', () => {
        this.dispatchEvent(new CustomEvent('addProbe', {}));
      });
      this._traceConfig?.appendChild(checkDesBox);
    });
  }

  private initMemoryConfigList(): void {
    this._memoryConfig = this.shadowRoot?.querySelector('.memory-config');
    memoryConfigList.forEach((configBean) => {
      let checkDesBox = new SpCheckDesBox();
      checkDesBox.value = configBean.value;
      checkDesBox.checked = configBean.isSelect;
      checkDesBox.des = configBean.des;
      checkDesBox.addEventListener('onchange', () => {
        this.dispatchEvent(new CustomEvent('addProbe', {}));
      });
      this._memoryConfig?.appendChild(checkDesBox);
    });
  }

  private initAbilityConfigList(): void {
    this._abilityConfig = this.shadowRoot?.querySelector('.ability-config');
    abilityConfigList.forEach((configBean) => {
      let checkDesBox = new SpCheckDesBox();
      checkDesBox.value = configBean.value;
      checkDesBox.checked = configBean.isSelect;
      checkDesBox.des = configBean.des;
      checkDesBox.addEventListener('onchange', () => {
        this.dispatchEvent(new CustomEvent('addProbe', {}));
      });
      this._abilityConfig?.appendChild(checkDesBox);
    });
  }

  private initHiTraceConfigList(): void {
    this.hitrace = this.shadowRoot?.getElementById('hitrace') as SpCheckDesBox;
    let parent = this.shadowRoot?.querySelector('.user-events') as Element;
    hiTraceConfigList.forEach((hitraceConfig: any) => {
      let litCheckBox = new LitCheckBox();
      litCheckBox.setAttribute('name', 'userEvents');
      litCheckBox.value = hitraceConfig.value;
      litCheckBox.checked = hitraceConfig.isSelect;
      litCheckBox.addEventListener('change', (ev: CustomEventInit<LitCheckBoxChangeEvent>) => {
        let detail = ev.detail;
        if (this.hitrace?.checked === false) {
          this.hitrace.checked = detail!.checked;
        }
        if (!detail!.checked && this.hitrace?.checked === true) {
          let hasChecked = false;
          const nodes = parent?.querySelectorAll<LitCheckBox>('lit-check-box[name=userEvents]');
          nodes.forEach((vv) => {
            if (vv.checked) {
              hasChecked = true;
            }
          });
          if (!hasChecked) {
            this.hitrace.checked = hasChecked;
          }
        }
        this.dispatchEvent(new CustomEvent('addProbe', {}));
      });
      parent.append(litCheckBox);
    });
  }

  initElements(): void {
    this.ftraceBuffSizeResultInput = this.shadowRoot?.querySelector('.ftrace-buff-size-result') as HTMLInputElement;
    this.ftraceBuffSizeResultInput!.addEventListener('keydown', (ev: any) => {
      if (ev.key === '0' && ev.target.value.length === 1 && ev.target.value === '0') {
        ev.preventDefault();
      }
    });
    this.initTraceConfigList();
    this.initMemoryConfigList();
    this.initAbilityConfigList();
    this.initHiTraceConfigList();
    this.bufferSizeSliderInit();
    let litSwitch = this.shadowRoot?.querySelector('lit-switch') as LitSwitch;
    this.ftraceSlider = this.shadowRoot?.querySelector<LitSlider>('#ftrace-buff-size-slider');
    litSwitch.addEventListener('change', (event: any) => {
      let detail = event.detail;
      if (detail!.checked) {
        this.unDisable();
      } else {
        this.disable();
      }
    });
  }

  private bufferSizeSliderInit(): void {
    let bufferSizeSlider = this.shadowRoot?.querySelector<LitSlider>('#ftrace-buff-size-slider') as LitSlider;
    this.ftraceBufferSizeResult = this.shadowRoot?.querySelector('#ftrace-buff-size-div') as HTMLDivElement;
    bufferSizeSlider.sliderStyle = {
      minRange: 2048,
      maxRange: 307200,
      defaultValue: '20480',
      resultUnit: 'KB',
      stepSize: 2,
      lineColor: 'var(--dark-color3,#46B1E3)',
      buttonColor: '#999999',
    };
    let bufferSizeSliderParent = bufferSizeSlider!.parentNode as Element;
    let buffSizeResult = this.shadowRoot?.querySelector('.ftrace-buff-size-result') as HTMLInputElement;
    buffSizeResult!.onkeydown = (ev): void => {
      // @ts-ignore
      if (ev.key === '0' && ev.target.value.length === 1 && ev.target.value === '0') {
        ev.preventDefault();
      }
    };
    buffSizeResult.value = bufferSizeSlider.sliderStyle.defaultValue;
    bufferSizeSlider.addEventListener('input', () => {
      buffSizeResult.parentElement!.classList.remove('border-red');
      if (this.ftraceBufferSizeResult!.hasAttribute('percent')) {
        buffSizeResult.value = Number(this.ftraceBufferSizeResult!.getAttribute('percent')).toString();
      } else {
        buffSizeResult.value = '20480';
      }
    });
    bufferSizeSliderParent.setAttribute('percent', '20480');
    buffSizeResult.style.color = 'var(--dark-color1,#000000)';
    buffSizeResult.addEventListener('input', () => {
      this.ftraceBuffSizeResultInputHandler(buffSizeResult, bufferSizeSliderParent, bufferSizeSlider);
    });
    buffSizeResult.addEventListener('focusout', () => {
      if (buffSizeResult.value.trim() === '') {
        buffSizeResult.parentElement!.classList.remove('border-red');
        bufferSizeSliderParent.setAttribute('percent', '20480');
        buffSizeResult.value = '20480';
        buffSizeResult.style.color = 'var(--dark-color,#6a6f77)';
        bufferSizeSliderParent.setAttribute('percent', buffSizeResult.value);
        bufferSizeSliderParent.setAttribute('percentValue', buffSizeResult.value);
        bufferSizeSlider!.percent = buffSizeResult.value;
        let htmlInputElement = bufferSizeSlider!.shadowRoot?.querySelector('#slider') as HTMLInputElement;
        htmlInputElement.value = buffSizeResult.value;
      }
    });
  }

  private ftraceBuffSizeResultInputHandler(
    buffSizeResultEl: HTMLInputElement,
    bufferSizeSliderParentEl: Element,
    bufferSizeSliderEl: LitSlider
  ): void {
    if (this.ftraceBufferSizeResult!.hasAttribute('percent')) {
      this.ftraceBufferSizeResult!.removeAttribute('percent');
    }
    buffSizeResultEl.style.color = 'var(--dark-color1,#000000)';
    buffSizeResultEl.parentElement!.style.backgroundColor = 'var(--dark-background5,#F2F2F2)';
    buffSizeResultEl.style.backgroundColor = 'var(--dark-background5,#F2F2F2)';
    if (buffSizeResultEl.value.trim() === '') {
      buffSizeResultEl.style.color = 'red';
      bufferSizeSliderParentEl.setAttribute('percent', '20480');
      return;
    }
    let ftraceBufferSize = Number(buffSizeResultEl.value);
    if (
      ftraceBufferSize < bufferSizeSliderEl!.sliderStyle.minRange ||
      ftraceBufferSize > bufferSizeSliderEl!.sliderStyle.maxRange
    ) {
      buffSizeResultEl.parentElement!.classList.add('border-red');
      bufferSizeSliderParentEl.setAttribute('percent', '20480');
    } else {
      buffSizeResultEl.parentElement!.classList.remove('border-red');
      bufferSizeSliderEl!.percent = buffSizeResultEl.value;
      let htmlInputElement = bufferSizeSliderEl!.shadowRoot?.querySelector('#slider') as HTMLInputElement;
      htmlInputElement.value = buffSizeResultEl.value;
      bufferSizeSliderParentEl.setAttribute('percent', buffSizeResultEl.value);
      bufferSizeSliderParentEl.setAttribute('percentValue', buffSizeResultEl.value);
    }
  }

  private unDisable(): void {
    this.startSamp = true;
    let checkDesBoxDis = this.shadowRoot?.querySelectorAll<SpCheckDesBox>('check-des-box');
    let litCheckBoxDis = this.shadowRoot?.querySelectorAll<LitCheckBox>('lit-check-box');
    let defaultSelected: any = [];
    defaultSelected = defaultSelected.concat(
      traceConfigList,
      memoryConfigList,
      abilityConfigList,
      hiTraceConfigList
    );
    this.shadowRoot?.querySelector<SpCheckDesBox>('[value=\'Hitrace categories\']')?.setAttribute('checked', 'true');
    this.ftraceSlider!.removeAttribute('disabled');
    checkDesBoxDis?.forEach((item: SpCheckDesBox) => {
      item.removeAttribute('disabled');
    });
    litCheckBoxDis?.forEach((item: LitCheckBox) => {
      item.removeAttribute('disabled');
    });
    defaultSelected.filter((item: any) => {
      if (item.isSelect) {
        this.shadowRoot?.querySelector<SpCheckDesBox>(`[value='${item.value}']`)?.
          setAttribute('checked', 'true');
      }
    });
  }

  private disable(): void {
    this.startSamp = false;
    let checkDesBoxDis = this.shadowRoot?.querySelectorAll<SpCheckDesBox>('check-des-box');
    let litCheckBoxDis = this.shadowRoot?.querySelectorAll<LitCheckBox>('lit-check-box');

    this.ftraceSlider!.setAttribute('disabled', '');

    checkDesBoxDis?.forEach((item: SpCheckDesBox) => {
      item.setAttribute('disabled', '');
      item.checked = false;
    });

    litCheckBoxDis?.forEach((item: LitCheckBox) => {
      item.setAttribute('disabled', '');
      item.checked = false;
    });
  }

  initHtml(): string {
    return SpProbesConfigHtml;
  }

  //当 custom element首次被插入文档DOM时，被调用。
  public connectedCallback(): void {
    let parent = this.shadowRoot?.querySelector('.user-events') as Element;
    const siblingNode = parent?.querySelectorAll<LitCheckBox>('lit-check-box[name=userEvents]');
    this.hitrace!.addEventListener('onchange', (ev: CustomEventInit<LitCheckBoxChangeEvent>) => {
      let detail = ev.detail;
      siblingNode.forEach((node) => {
        node.checked = detail!.checked;
      });
      this.dispatchEvent(new CustomEvent('addProbe', {}));
    });
  }
}

const hiTraceConfigList = [
  {value: 'ability', isSelect: true},
  {value: 'accesscontrol', isSelect: false},
  {value: 'accessibility', isSelect: false},
  {value: 'account', isSelect: false},
  {value: 'ace', isSelect: true},
  {value: 'app', isSelect: true},
  {value: 'ark', isSelect: true},
  {value: 'binder', isSelect: true},
  {value: 'bluetooth', isSelect: false},
  {value: 'cloud', isSelect: false},
  {value: 'commonlibrary', isSelect: false},
  {value: 'daudio', isSelect: false},
  {value: 'dcamera', isSelect: false},
  {value: 'deviceauth', isSelect: false},
  {value: 'devicemanager', isSelect: false},
  {value: 'deviceprofile', isSelect: false},
  {value: 'dhfwk', isSelect: false},
  {value: 'dinput', isSelect: false},
  {value: 'disk', isSelect: true},
  {value: 'distributeddatamgr', isSelect: false},
  {value: 'dlpcre', isSelect: false},
  {value: 'dsched', isSelect: false},
  {value: 'dscreen', isSelect: false},
  {value: 'dslm', isSelect: false},
  {value: 'dsoftbus', isSelect: false},
  {value: 'ffrt', isSelect: false},
  {value: 'filemanagement', isSelect: false},
  {value: 'freq', isSelect: true},
  {value: 'graphic', isSelect: true},
  {value: 'gresource', isSelect: false},
  {value: 'hdcd', isSelect: false},
  {value: 'hdf', isSelect: false},
  {value: 'huks', isSelect: false},
  {value: 'i2c', isSelect: false},
  {value: 'idle', isSelect: true},
  {value: 'interconn', isSelect: false},
  {value: 'irq', isSelect: true},
  {value: 'mdfs', isSelect: false},
  {value: 'memory', isSelect: false},
  {value: 'memreclaim', isSelect: true},
  {value: 'misc', isSelect: false},
  {value: 'mmc', isSelect: true},
  {value: 'msdp', isSelect: false},
  {value: 'multimodalinput', isSelect: true},
  {value: 'musl', isSelect: false},
  {value: 'net', isSelect: false},
  {value: 'notification', isSelect: false},
  {value: 'nweb', isSelect: false},
  {value: 'ohos', isSelect: true},
  {value: 'pagecache', isSelect: true},
  {value: 'power', isSelect: false},
  {value: 'regulators', isSelect: false},
  {value: 'rpc', isSelect: true},
  {value: 'samgr', isSelect: false},
  {value: 'sched', isSelect: true},
  {value: 'sensors', isSelect: false},
  {value: 'sync', isSelect: true},
  {value: 'usb', isSelect: false},
  {value: 'ufs', isSelect: false},
  {value: 'useriam', isSelect: false},
  {value: 'virse', isSelect: false},
  {value: 'window', isSelect: true},
  {value: 'workq', isSelect: true},
  {value: 'zaudio', isSelect: true},
  {value: 'zcamera', isSelect: true},
  {value: 'zimage', isSelect: true},
  {value: 'zmedia', isSelect: true},
];

const traceConfigList = [
  {
    value: 'Scheduling details',
    isSelect: true,
    des: 'enables high-detailed tracking of scheduling events',
  },
  {
    value: 'CPU Frequency and idle states',
    isSelect: true,
    des: 'Records cpu frequency and idle state change viaftrace',
  },
  {
    value: 'Advanced ftrace config',
    isSelect: false,
    des:
      'Enable individual events and tune the kernel-tracing(ftrace) module.' +
      'The events enabled here are in addition to those from' +
      ' enabled by other probes.',
  },
];

const memoryConfigList = [
  {
    value: 'Kernel meminfo',
    isSelect: false,
    des: 'polling of /proc/meminfo',
  },
  {
    value: 'Virtual memory stats',
    isSelect: false,
    des:
      'Periodically polls virtual memory stats from /proc/vmstat.' +
      ' Allows to gather statistics about swap,' +
      'eviction, compression and pagecache efficiency',
  },
];

const abilityConfigList = [
  {
    value: 'AbilityMonitor',
    isSelect: false,
    des: 'Tracks the AbilityMonitor',
  },
];
