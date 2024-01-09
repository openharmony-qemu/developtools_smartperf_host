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
import '../../../base-ui/select/LitAllocationSelect';

import '../../../base-ui/switch/lit-switch';
import { LitAllocationSelect } from '../../../base-ui/select/LitAllocationSelect';
import { SpRecordTrace } from '../SpRecordTrace';
import { Cmd } from '../../../command/Cmd';
import { LitRadioBox } from '../../../base-ui/radiobox/LitRadioBox';
import { SpCheckDesBox } from './SpCheckDesBox';
import LitSwitch from '../../../base-ui/switch/lit-switch';
import { SpApplication } from '../../SpApplication';
import { SpArkTsHtml } from './SpArkTs.html';

@element('sp-ark-ts')
export class SpArkTs extends BaseElement {
  private processInput: LitAllocationSelect | undefined | null;
  private spCheckDesBox: SpCheckDesBox | undefined | null;
  private radioBox: LitRadioBox | undefined | null;
  private interval: HTMLInputElement | undefined | null;
  private memorySwitch: LitSwitch | undefined | null;
  private cpuSwitch: LitSwitch | undefined | null;
  private litSwitch: LitSwitch | undefined | null;

  set startSamp(jsHeapStart: boolean) {
    if (jsHeapStart) {
      this.setAttribute('startSamp', '');
    } else {
      this.removeAttribute('startSamp');
    }
  }

  get startSamp(): boolean {
    return this.hasAttribute('startSamp');
  }

  get process(): string {
    if (this.processInput!.value.length > 0) {
      return this.processInput!.value;
    }
    return '';
  }

  get radioBoxType(): number {
    let memorySwitch = this.shadowRoot?.querySelector('#memory-switch');
    let type: string;
    if (memorySwitch!.getAttribute('checked') !== null) {
      this.radioBox = this.shadowRoot?.querySelector('lit-radio[checked]');
      type = this.radioBox?.getAttribute('type') || '';
    } else {
      type = '-1';
    }
    return Number(type);
  }

  get grabNumeric(): boolean {
    if (this.radioBoxType === 0) {
      this.spCheckDesBox = this.shadowRoot?.querySelector('#snapshot');
      let isChecked = this.spCheckDesBox?.getAttribute('checked');
      return isChecked === 'true';
    } else {
      return false;
    }
  }

  get grabAllocations(): boolean {
    if (this.radioBoxType === 1) {
      this.spCheckDesBox = this.shadowRoot?.querySelector('#timeline');
      let isChecked = this.spCheckDesBox?.getAttribute('checked');
      return isChecked === 'true';
    } else {
      return false;
    }
  }

  get intervalValue(): number {
    if (this.radioBoxType === 0) {
      return Number(this.interval!.value);
    } else {
      return 0;
    }
  }

  get grabCpuProfiler(): boolean {
    let isChecked = this.cpuSwitch?.getAttribute('checked');
    return isChecked !== null;
  }

  get intervalCpuValue(): number {
    let interval = this.shadowRoot?.querySelector<HTMLInputElement>('#cpuInterval');
    if (interval) {
      return Number(interval!.value);
    } else {
      return 0;
    }
  }

  initElements(): void {
    this.interval = this.shadowRoot?.querySelector('#interval');
    this.processInput = this.shadowRoot?.querySelector<LitAllocationSelect>('lit-allocation-select');
    let processInput = this.processInput?.shadowRoot?.querySelector('.multipleSelect') as HTMLDivElement;
    this.cpuSwitch = this.shadowRoot?.querySelector('#cpu-switch') as LitSwitch;
    processInput!.addEventListener('mousedown', () => {
      if (SpRecordTrace.serialNumber === '') {
        this.processInput!.processData = [];
        this.processInput!.initData();
      }
    });
    processInput!.addEventListener('mouseup', () => {
      if (SpRecordTrace.serialNumber === '') {
        this.processInput!.processData = [];
        this.processInput!.initData();
      } else {
        Cmd.getDebugProcess().then((processList) => {
          this.processInput!.processData = processList;
          this.processInput!.initData();
        });
      }
    });
    this.litSwitch = this.shadowRoot?.querySelector('lit-switch') as LitSwitch;
    this.memorySwitch = this.shadowRoot?.querySelector('#memory-switch') as LitSwitch;
    this.cpuSwitch = this.shadowRoot?.querySelector('#cpu-switch') as LitSwitch;
    this.disable();
    this.memoryDisable();
  }

  intervalFocusoutHandler = (): void => {
    if (this.interval!.value === '') {
      this.interval!.value = '10';
    }
  };

  litSwitchChangeHandler = (event: Event): void => {
    // @ts-ignore
    let detail = event.detail;
    if (detail.checked) {
      this.unDisable();
      this.unMemoryDisable();
    } else {
      this.disable();
      this.memoryDisable();
    }
  };

  memorySwitchChangeHandler = (event: Event): void => {
    // @ts-ignore
    let detail = event.detail;
    if (detail.checked) {
      this.unMemoryDisable();
    } else {
      if (!this.cpuSwitch?.checked) {
        this.litSwitch!.checked = false;
        this.disable();
      }
      this.memoryDisable();
    }
  };

  cpuSwitchChangeHandler = (event: Event): void => {
    // @ts-ignore
    let detail = event.detail;
    let interval = this.shadowRoot?.querySelectorAll<HTMLInputElement>('#cpuInterval');
    if (!detail.checked && !this.memorySwitch?.checked) {
      this.litSwitch!.checked = false;
      this.disable();
    } else if (detail.checked) {
      interval!.forEach((item) => {
        item.disabled = false;
        item.style.background = 'var(--dark-background5,#FFFFFF)';
      });
    } else {
      interval!.forEach((item) => {
        item.disabled = true;
        item.style.color = '#b7b7b7';
        item.style.background = 'var(--dark-background1,#f5f5f5)';
      });
      this.litSwitch!.checked = true;
      this.startSamp = true;
    }
  };

  private memoryDisable(): void {
    let interval = this.shadowRoot?.querySelectorAll<HTMLInputElement>('#interval');
    interval!.forEach((item) => {
      item.disabled = true;
      item.style.color = '#b7b7b7';
      item.style.background = 'var(--dark-background1,#f5f5f5)';
    });
    let radioBoxes = this.shadowRoot?.querySelectorAll<LitRadioBox>('lit-radio');
    radioBoxes!.forEach((item) => {
      item.disabled = true;
    });
    let checkBoxes = this.shadowRoot?.querySelectorAll<SpCheckDesBox>('check-des-box');
    checkBoxes!.forEach((item) => {
      item.disabled = true;
    });
  }

  private unMemoryDisable(): void {
    let interval = this.shadowRoot?.querySelectorAll<HTMLInputElement>('#interval');
    interval!.forEach((item) => {
      item.disabled = false;
      item.style.background = 'var(--dark-background5,#FFFFFF)';
    });
    let radioBoxes = this.shadowRoot?.querySelectorAll<LitRadioBox>('lit-radio');
    radioBoxes!.forEach((item) => {
      item.disabled = false;
    });
    let checkBoxes = this.shadowRoot?.querySelectorAll<SpCheckDesBox>('check-des-box');
    checkBoxes!.forEach((item) => {
      item.disabled = false;
    });
  }

  private disable(): void {
    this.startSamp = false;
    this.processInput!.setAttribute('disabled', '');
    let heapConfigs = this.shadowRoot?.querySelectorAll<HTMLInputElement>('.select');
    heapConfigs!.forEach((item) => {
      item.disabled = true;
    });
    let switches = this.shadowRoot?.querySelectorAll<LitSwitch>('.switch');
    switches!.forEach((item) => {
      item.disabled = true;
      item.checked = false;
    });
    let interval = this.shadowRoot?.querySelectorAll<HTMLInputElement>('.inputstyle');
    interval!.forEach((item) => {
      item.disabled = true;
      item.style.color = '#b7b7b7';
      item.style.background = 'var(--dark-background1,#f5f5f5)';
    });
  }

  private unDisable(): void {
    this.startSamp = true;
    this.processInput!.removeAttribute('disabled');
    let heapConfigs = this.shadowRoot?.querySelectorAll<HTMLInputElement>('.select');
    heapConfigs!.forEach((item) => {
      item.disabled = false;
    });
    let switches = this.shadowRoot?.querySelectorAll<LitSwitch>('.switch');
    switches!.forEach((item) => {
      item.disabled = false;
      item.checked = true;
    });
    let interval = this.shadowRoot?.querySelectorAll<HTMLInputElement>('.inputstyle');
    interval!.forEach((item) => {
      item.disabled = false;
      item.style.background = 'var(--dark-background5,#FFFFFF)';
    });
  }

  connectedCallback(): void {
    let traceMode = this.shadowRoot!.querySelector('#traceMode') as HTMLDivElement;
    let isLongTrace = SpApplication.isLongTrace;
    if (isLongTrace) {
      traceMode!.style.display = 'block';
    } else {
      traceMode!.style.display = 'none';
    }
    this.interval!.addEventListener('focusout', this.intervalFocusoutHandler);
    this.litSwitch!.addEventListener('change', this.litSwitchChangeHandler);
    this.memorySwitch!.addEventListener('change', this.memorySwitchChangeHandler);
    this.cpuSwitch!.addEventListener('change', this.cpuSwitchChangeHandler);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.interval!.removeEventListener('focusout', this.intervalFocusoutHandler);
    this.litSwitch!.removeEventListener('change', this.litSwitchChangeHandler);
    this.memorySwitch!.removeEventListener('change', this.memorySwitchChangeHandler);
    this.cpuSwitch!.removeEventListener('change', this.cpuSwitchChangeHandler);
  }

  initHtml(): string {
    return SpArkTsHtml;
  }
}
