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
import { log } from '../../../log/Log';
import { SpRecordTrace } from '../SpRecordTrace';
import { Cmd } from '../../../command/Cmd';
import LitSwitch from '../../../base-ui/switch/lit-switch';
import { LitSlider } from '../../../base-ui/slider/LitSlider';
import { LitSelectV } from '../../../base-ui/select/LitSelectV';
import { SpAllocationHtml } from './SpAllocation.html';
import {
  NUM_16384,
  NUM_1800,
  NUM_30,
  NUM_300,
  NUM_3600,
  NUM_450,
  NUM_60,
  NUM_600
} from '../../bean/NumBean';

@element('sp-allocations')
export class SpAllocations extends BaseElement {
  private processId: LitSelectV | null | undefined;
  private unwindEL: HTMLInputElement | null | undefined;
  private shareMemory: HTMLInputElement | null | undefined;
  private shareMemoryUnit: HTMLSelectElement | null | undefined;
  private filterMemory: HTMLInputElement | null | undefined;
  private intervalResultInput: HTMLInputElement | null | undefined;
  private fpUnWind: LitSwitch | null | undefined;
  private statisticsSlider: LitSlider | null | undefined;
  private recordAccurately: LitSwitch | null | undefined;
  private offlineSymbol: LitSwitch | null | undefined;
  private startupMode: LitSwitch | null | undefined;
  private responseLibMode: LitSwitch | null | undefined;
  private recordStatisticsResult: HTMLDivElement | null | undefined;
  private sampleInterval: HTMLInputElement | null | undefined;

  private filterSize: HTMLInputElement | null | undefined;

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

  get appProcess(): string {
    return this.processId!.value || '';
  }

  get unwind(): number {
    log(`unwind value is :${  this.unwindEL!.value}`);
    return Number(this.unwindEL!.value);
  }

  get shared(): number {
    let value = this.shareMemory?.value || '';
    log(`shareMemory value is :${  value}`);
    if (value !== '') {
      return Number(this.shareMemory?.value) || NUM_16384;
    }
    return NUM_16384;
  }

  get filter(): number {
    let value = this.filterMemory?.value || '';
    log(`filter value is :${  value}`);
    if (value !== '') {
      return Number(value);
    }
    return 0;
  }

  get fp_unwind(): boolean {
    let value = this.fpUnWind?.checked;
    if (value !== undefined) {
      return value;
    }
    return true;
  }

  get record_accurately(): boolean {
    let value = this.recordAccurately?.checked;
    if (value !== undefined) {
      return value;
    }
    return true;
  }

  get offline_symbolization(): boolean {
    let value = this.offlineSymbol?.checked;
    if (value !== undefined) {
      return value;
    }
    return true;
  }

  get record_statistics(): boolean {
    if (this.recordStatisticsResult?.hasAttribute('percent')) {
      let value = Number(this.recordStatisticsResult?.getAttribute('percent'));
      return value > 0;
    }
    return true;
  }

  get statistics_interval(): number {
    if (this.recordStatisticsResult?.hasAttribute('percentValue')) {
      return Number(this.recordStatisticsResult?.getAttribute('percentValue'));
    }
    return 10;
  }

  get response_lib_mode(): boolean {
    let value = this.responseLibMode?.checked;
    if (value !== undefined) {
      return value;
    }
    return false;
  }

  get startup_mode(): boolean {
    let value = this.startupMode?.checked;
    if (value !== undefined) {
      return value;
    }
    return false;
  }

  set startup_mode(value: boolean) {
    if (this.startupMode) {
      this.startupMode.checked = value;
    }
  }

  get expandPids(): number[] {
    let allPidList: number[] = [];
    if (this.processId?.value.length > 0) {
      let result = this.processId?.value.match(/\((.+?)\)/g);
      if (result) {
        for (let index = 0; index < result.length; index++) {
          let item = result[index];
          let currentPid = item!.replace('(', '').replace(')', '');
          allPidList.push(Number(currentPid));
        }
      }
    }
    return allPidList;
  }

  get sample_interval(): number {
    return Number(this.sampleInterval!.value);
  }

  connectedCallback(): void {
    this.unwindEL?.addEventListener('keydown', this.handleInputChange);
    this.shareMemory?.addEventListener('keydown', this.handleInputChange);
    this.shareMemoryUnit?.addEventListener('keydown', this.handleInputChange);
    this.filterMemory?.addEventListener('keydown', this.handleInputChange);
    this.intervalResultInput?.addEventListener('keydown', this.handleInputChange);
    this.filterSize?.addEventListener('keydown', this.handleInputChange);
    this.statisticsSlider?.addEventListener('input', this.statisticsSliderInputHandler);
    this.intervalResultInput?.addEventListener('input', this.intervalResultInputHandler);
    this.intervalResultInput?.addEventListener('focusout', this.intervalResultFocusOutHandler);
    this.statisticsSlider?.shadowRoot?.querySelector<HTMLElement>('#slider')!.
      addEventListener('mouseup', this.statisticsSliderMouseupHandler);
    this.startupMode?.addEventListener('change',this.startupModeChangeHandler);
  }

  disconnectedCallback(): void {
    this.unwindEL?.removeEventListener('keydown', this.handleInputChange);
    this.shareMemory?.removeEventListener('keydown', this.handleInputChange);
    this.shareMemoryUnit?.removeEventListener('keydown', this.handleInputChange);
    this.filterMemory?.removeEventListener('keydown', this.handleInputChange);
    this.intervalResultInput?.removeEventListener('keydown', this.handleInputChange);
    this.filterSize?.removeEventListener('keydown', this.handleInputChange);
    this.statisticsSlider?.removeEventListener('input', this.statisticsSliderInputHandler);
    this.intervalResultInput?.removeEventListener('input', this.intervalResultInputHandler);
    this.intervalResultInput?.removeEventListener('focusout', this.intervalResultFocusOutHandler);
    this.statisticsSlider?.shadowRoot?.querySelector<HTMLElement>('#slider')!.
      removeEventListener('mouseup', this.statisticsSliderMouseupHandler);
    this.startupMode?.removeEventListener('change',this.startupModeChangeHandler);
  }

  handleInputChange = (ev: KeyboardEvent): void => {
    // @ts-ignore
    if (ev.key === '0' && ev.target.value.length === 1 && ev.target.value === '0') {
      ev.preventDefault();
    }
  };

  initElements(): void {
    this.filterSize = this.shadowRoot?.querySelector('#filterSized');
    this.processId = this.shadowRoot?.getElementById('pid') as LitSelectV;
    let process = this.processId.shadowRoot?.querySelector('input') as HTMLInputElement;
    process!.addEventListener('mousedown', () => {
      this.processMouseDownHandler(process);
    });
    this.unwindEL = this.shadowRoot?.getElementById('unwind') as HTMLInputElement;
    this.shareMemory = this.shadowRoot?.getElementById('shareMemory') as HTMLInputElement;
    this.shareMemoryUnit = this.shadowRoot?.getElementById('shareMemoryUnit') as HTMLSelectElement;
    this.filterMemory = this.shadowRoot?.getElementById('filterSized') as HTMLInputElement;
    this.fpUnWind = this.shadowRoot?.getElementById('use_fp_unwind') as LitSwitch;
    this.recordAccurately = this.shadowRoot?.getElementById('use_record_accurately') as LitSwitch;
    this.offlineSymbol = this.shadowRoot?.getElementById('use_offline_symbolization') as LitSwitch;
    this.startupMode = this.shadowRoot?.getElementById('use_startup_mode') as LitSwitch;
    this.responseLibMode = this.shadowRoot?.getElementById('response_lib_mode') as LitSwitch;
    this.sampleInterval = this.shadowRoot?.getElementById('sample-interval-input') as HTMLInputElement;
    this.statisticsSlider = this.shadowRoot?.querySelector<LitSlider>('#interval-slider') as LitSlider;
    this.recordStatisticsResult = this.shadowRoot?.querySelector<HTMLDivElement>(
      '.record-statistics-result'
    ) as HTMLDivElement;
    this.statisticsSlider.sliderStyle = {
      minRange: 0,
      maxRange: 3600,
      defaultValue: '900',
      resultUnit: 'S',
      stepSize: 450,
      lineColor: 'var(--dark-color3,#46B1E3)',
      buttonColor: '#999999',
    };
    let parentElement = this.statisticsSlider!.parentNode as Element;
    this.intervalResultInput = this.shadowRoot?.querySelector('.interval-result') as HTMLInputElement;
    this.intervalResultInput.value = '10';
    parentElement.setAttribute('percent', '3600');
    this.intervalResultInput.style.color = 'var(--dark-color1,#000000)';
    let litSwitch = this.shadowRoot?.querySelector('#switch-disabled') as LitSwitch;
    litSwitch.addEventListener('change', (event: Event): void => {
      // @ts-ignore
      let detail = event.detail;
      if (detail.checked) {
        this.unDisable();
      } else {
        this.disable();
      }
    });
    this.disable();
  }

  startupModeChangeHandler = (): void => {
    let process = this.processId?.shadowRoot?.querySelector('input') as HTMLInputElement;
    process.value = '';
    if (this.startup_mode) {
      process!.placeholder = 'please input process';
    } else {
      process!.placeholder = 'please select process';
    }
  };

  statisticsSliderMouseupHandler = (): void => {
    setTimeout(() => {
      let percentValue = this.recordStatisticsResult!.getAttribute('percent');
      let index = Math.round(Number(percentValue) / NUM_450);
      index = index < 1 ? 0 : index;
      this.intervalResultInput!.value = `${stepValue[index]  }`;
      this.recordStatisticsResult!.setAttribute('percentValue', `${stepValue[index]  }`);
    });
  };

  intervalResultFocusOutHandler = (): void => {
    let parentElement = this.statisticsSlider!.parentNode as Element;
    if (this.intervalResultInput!.value.trim() === '') {
      parentElement.setAttribute('percent', '3600');
      this.intervalResultInput!.value = '3600';
      this.intervalResultInput!.style.color = 'var(--dark-color,#6a6f77)';
      parentElement.setAttribute('percent', this.intervalResultInput!.value);
      parentElement.setAttribute('percentValue', this.intervalResultInput!.value);
      this.statisticsSlider!.percent = this.intervalResultInput!.value;
      let htmlInputElement = this.statisticsSlider!.shadowRoot?.querySelector('#slider') as HTMLInputElement;
      htmlInputElement.value = this.intervalResultInput!.value;
    }
  };

  statisticsSliderInputHandler = (): void => {
    this.statisticsSlider!.sliderStyle = {
      minRange: 0,
      maxRange: 3600,
      defaultValue: `${this.recordStatisticsResult!.getAttribute('percent')}`,
      resultUnit: 'S',
      stepSize: 450,
      lineColor: 'var(--dark-color3,#46B1E3)',
      buttonColor: '#999999',
    };
    this.intervalResultInput!.style.color = 'var(--dark-color1,#000000)';
    if (this.recordStatisticsResult!.hasAttribute('percent')) {
      let step = Math.round(Number(this.recordStatisticsResult!.getAttribute('percent')) / NUM_450);
      this.recordStatisticsResult!.setAttribute('percentValue', `${stepValue[step]}`);
      this.intervalResultInput!.value = `${stepValue[step]}`;
    }
  };

  private processMouseDownHandler(process: HTMLInputElement): void {
    if (this.startSamp) {
      process.readOnly = false;
      Cmd.getProcess().then((processList) => {
        this.processId?.dataSource(processList, '');
        if (processList.length > 0 && !this.startup_mode) {
          this.processId?.dataSource(processList, 'ALL-Process');
        } else {
          this.processId?.dataSource([], '');
        }
      });
    } else {
      process.readOnly = true;
      return;
    }
    if (this.startSamp && (SpRecordTrace.serialNumber === '' || this.startup_mode)) {
      this.processId?.dataSource([], '');
    } else {
    }
  }

  intervalResultInputHandler = (): void => {
    let parentElement = this.statisticsSlider!.parentNode as Element;
    if (this.recordStatisticsResult!.hasAttribute('percent')) {
      this.recordStatisticsResult!.removeAttribute('percent');
    }
    this.intervalResultInput!.style.color = 'var(--dark-color1,#000000)';
    this.intervalResultInput!.parentElement!.style.backgroundColor = 'var(--dark-background5,#F2F2F2)';
    this.intervalResultInput!.style.backgroundColor = 'var(--dark-background5,#F2F2F2)';
    if (this.intervalResultInput!.value.trim() === '') {
      this.intervalResultInput!.style.color = 'red';
      parentElement.setAttribute('percent', '3600');
      return;
    }
    if (Number(this.intervalResultInput!.value) < this.statisticsSlider!.sliderStyle.minRange ||
      Number(this.intervalResultInput!.value) > this.statisticsSlider!.sliderStyle.maxRange) {
      this.intervalResultInput!.style.color = 'red';
      parentElement.setAttribute('percent', '3600');
    } else {
      let defaultSize = 0;
      let stepSize = 450;
      let inputValue = Number(this.intervalResultInput!.value);
      for (let stepIndex = 0; stepIndex < stepValue.length; stepIndex++) {
        let currentValue = stepValue[stepIndex];
        if (inputValue === currentValue) {
          defaultSize = stepIndex * stepSize;
          break;
        } else if (inputValue < currentValue && stepIndex !== 0) {
          defaultSize =
            ((inputValue - stepValue[stepIndex - 1]) / (currentValue - stepValue[stepIndex - 1])) * stepSize +
            stepSize * (stepIndex - 1);
          break;
        }
      }
      this.statisticsSlider!.percent = `${defaultSize}`;
      let htmlInputElement = this.statisticsSlider!.shadowRoot?.querySelector('#slider') as HTMLInputElement;
      this.statisticsSlider!.sliderStyle = {
        minRange: 0,
        maxRange: 3600,
        defaultValue: `${defaultSize}`,
        resultUnit: 'S',
        stepSize: 1,
        lineColor: 'var(--dark-color3,#46B1E3)',
        buttonColor: '#999999',
      };
      htmlInputElement.value = `${defaultSize}`;
      parentElement.setAttribute('percent', this.intervalResultInput!.value);
      parentElement.setAttribute('percentValue', this.intervalResultInput!.value);
    }
  };

  private unDisable(): void {
    this.startSamp = true;
    if (this.fpUnWind) {
      this.fpUnWind.disabled = false;
    }
    if (this.recordAccurately) {
      this.recordAccurately.disabled = false;
    }
    if (this.offlineSymbol) {
      this.offlineSymbol.disabled = false;
    }
    if (this.startupMode) {
      this.startupMode.disabled = false;
    }
    if (this.responseLibMode) {
      this.responseLibMode.disabled = false;
    }
    if (this.sampleInterval) {
      this.sampleInterval.disabled = false;
    }
    this.processId!.removeAttribute('disabled');
    let inputBoxes = this.shadowRoot?.querySelectorAll<HTMLInputElement>('.inputBoxes');
    inputBoxes!.forEach((item) => {
      item.disabled = false;
    });
    this.statisticsSlider!.disabled = false;
  }

  private disable(): void {
    this.startSamp = false;
    if (this.fpUnWind) {
      this.fpUnWind.disabled = true;
    }
    if (this.recordAccurately) {
      this.recordAccurately.disabled = true;
    }
    if (this.startupMode) {
      this.startupMode.disabled = true;
    }
    if (this.offlineSymbol) {
      this.offlineSymbol.disabled = true;
    }
    if (this.responseLibMode) {
      this.responseLibMode.disabled = true;
    }
    if (this.sampleInterval) {
      this.sampleInterval.disabled = true;
    }
    this.processId!.setAttribute('disabled', '');
    let inputBoxes = this.shadowRoot?.querySelectorAll<HTMLInputElement>('.inputBoxes');
    inputBoxes!.forEach((item) => {
      item.disabled = true;
    });
    this.statisticsSlider!.disabled = true;
  }

  initHtml(): string {
    return SpAllocationHtml;
  }
}

const stepValue = [0, 1, 10, NUM_30, NUM_60, NUM_300, NUM_600, NUM_1800, NUM_3600];
