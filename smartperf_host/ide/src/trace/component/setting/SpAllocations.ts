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
import { NUM_16384, NUM_1800, NUM_30, NUM_300, NUM_3600, NUM_450, NUM_60, NUM_600 } from '../../bean/NumBean';
import { LitSelect } from '../../../base-ui/select/LitSelect';
import { gpuTypeAll, resGpuVk, resGpuGlesImage, resGpuGlesBuffer, resGpuClImage, resGpuClBuffer } from './utils/PluginConvertUtils';

@element('sp-allocations')
export class SpAllocations extends BaseElement {
  // normal option
  private nativeStartSwitch: LitSwitch | undefined | null;
  private processId: LitSelectV | null | undefined;
  private packageName: LitSelect | null | undefined;
  private unwindEL: HTMLInputElement | null | undefined;
  private intervalResultInput: HTMLInputElement | null | undefined;
  private fpUnWind: LitSwitch | null | undefined;
  private statisticsSlider: LitSlider | null | undefined;
  private useStatisticsEl: LitSwitch | null | undefined;
  private recordStatisticsResult: HTMLDivElement | null | undefined;
  private addOptionButton: HTMLButtonElement | undefined | null;
  // advance option
  private recordAccuratelyDivEl: HTMLDivElement | undefined | null;
  private offlineSymbolizationDivEl: HTMLDivElement | undefined | null;
  private maxUnwindLevelEl: HTMLDivElement | undefined | null;
  private sharedMemorySizeEl: HTMLDivElement | undefined | null;
  private filterMemorySizeEl: HTMLDivElement | undefined | null;
  private sampleIntervalEl: HTMLDivElement | undefined | null;
  private useStartupEl: HTMLDivElement | undefined | null;
  private useResponseLibEl: HTMLDivElement | undefined | null;
  private jsStackRecordDepthEl: HTMLDivElement | undefined | null;
  private napiRecordEl: HTMLDivElement | undefined | null;
  private advanceItems: Array<HTMLDivElement | undefined | null> = [];
  private shareMemory: HTMLInputElement | null | undefined;
  private shareMemoryUnit: HTMLSelectElement | null | undefined;
  private filterMemory: HTMLInputElement | null | undefined;
  private recordAccurately: LitSwitch | null | undefined;
  private offlineSymbol: LitSwitch | null | undefined;
  private startupMode: LitSwitch | null | undefined;
  private jsStackModel: LitSwitch | null | undefined;
  private responseLibMode: LitSwitch | null | undefined;
  private napiName: HTMLInputElement | null | undefined;
  private jsStackDepth: HTMLInputElement | null | undefined;
  private statisticsIntervalInput: HTMLInputElement | null | undefined;
  private statisticsIntervalName: HTMLSpanElement | null | undefined;
  private statisticsIntervalRange: HTMLSpanElement | null | undefined;
  private gpuMemorySwitch: LitSwitch | undefined | null;
  private cpuMemorySwitch: LitSwitch | undefined | null;
  private configType: HTMLDivElement | undefined | null;
  private typeSelect: LitSelectV | undefined | null;
  private typeInput: HTMLInputElement | undefined;

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

  get recordCpuMemory(): boolean {
    return this.cpuMemorySwitch!.checked;
  }

  get recordGpuMemory(): boolean {
    return this.gpuMemorySwitch!.checked;
  }

  get appProcess(): string {
    return this.processId!.value || this.packageName!.value || '';
  }

  get unwind(): number {
    log(`unwind value is :${this.unwindEL!.value}`);
    return Number(this.unwindEL!.value);
  }

  get shared(): number {
    let value = this.shareMemory?.value || '';
    log(`shareMemory value is :${value}`);
    if (value !== '') {
      return Number(this.shareMemory?.value) || NUM_16384;
    }
    return NUM_16384;
  }

  get filter(): number {
    let value = this.filterMemory?.value || '';
    log(`filter value is :${value}`);
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
    let value = this.useStatisticsEl!.checked;
    if (value !== undefined) {
      return value;
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

  get recordJsStack(): boolean {
    let value = this.jsStackModel?.checked;
    if (value !== undefined) {
      return value;
    }
    return false;
  }

  set recordJsStack(value: boolean) {
    if (this.jsStackModel) {
      this.jsStackModel.checked = value;
    }
  }

  get expandPids(): number[] {
    let allPidList: number[] = [];
    const processIdValue = this.processId?.value;
    if (processIdValue && processIdValue.length > 0) {
      if (/^(?:\d+(?:,\d+)*)?$/.test(processIdValue)) {
        allPidList = processIdValue.split(',').map(pid => pid.trim()).map(Number);
      } else if (/\((\d+)\)(?:,\((\d+)\))*$/.test(processIdValue)) {
        let result = processIdValue.match(/\((.+?)\)/g);
        if (result) {
          for (let index = 0; index < result.length; index++) {
            let item = result[index];
            let currentPid = item!.replace('(', '').replace(')', '');
            allPidList.push(Number(currentPid));
          }
        }
      } else {
        return [];
      }
    }
    return allPidList;
  }

  get sample_interval(): number {
    return Number(this.statisticsIntervalInput!.value);
  }

  get filter_napi_name(): string {
    if (this.jsStackModel?.checked && !this.fp_unwind) {
      return this.napiName!.value || '';
    }
    return '';
  }

  get max_js_stack_depth(): number {
    if (this.jsStackModel?.checked) {
      return Number(this.jsStackDepth!.value) || 10;
    }
    return 0;
  }

  initElements(): void {
    this.initRecordGpuConfig();
    // normal option
    this.nativeStartSwitch = this.shadowRoot?.querySelector('#switch-disabled') as LitSwitch;
    this.processId = this.shadowRoot?.getElementById('pid') as LitSelectV;
    this.packageName = this.shadowRoot?.getElementById('packageName') as LitSelect;
    this.unwindEL = this.shadowRoot?.getElementById('unwind') as HTMLInputElement;
    this.fpUnWind = this.shadowRoot?.getElementById('use_fp_unwind') as LitSwitch;
    this.statisticsSlider = this.shadowRoot?.querySelector<LitSlider>('#interval-slider') as LitSlider;
    this.recordStatisticsResult = this.shadowRoot?.querySelector<HTMLDivElement>('.record-statistics-result');
    this.addOptionButton = this.shadowRoot?.querySelector<HTMLButtonElement>('#addOptions');
    this.intervalResultInput = this.shadowRoot?.querySelector('.interval-result') as HTMLInputElement;
    // advance option
    this.recordAccuratelyDivEl = this.shadowRoot?.getElementById('record_accurately_div') as HTMLDivElement;
    this.offlineSymbolizationDivEl = this.shadowRoot?.getElementById('offline_symbolization_div') as HTMLDivElement;
    this.jsStackRecordDepthEl = this.shadowRoot?.getElementById('js-stack-depth-div') as HTMLDivElement;
    this.napiRecordEl = this.shadowRoot?.getElementById('napi-div') as HTMLDivElement;
    this.maxUnwindLevelEl = this.shadowRoot?.getElementById('max-unwind-level-el') as HTMLDivElement;
    this.sharedMemorySizeEl = this.shadowRoot?.getElementById('shared-memory-size-el') as HTMLDivElement;
    this.filterMemorySizeEl = this.shadowRoot?.getElementById('filter-memory-size-el') as HTMLDivElement;
    this.sampleIntervalEl = this.shadowRoot?.getElementById('sample-interval-el') as HTMLDivElement;
    this.useStartupEl = this.shadowRoot?.getElementById('use-startup-el') as HTMLDivElement;
    this.useResponseLibEl = this.shadowRoot?.getElementById('use-response-lib-el') as HTMLDivElement;

    this.recordAccurately = this.shadowRoot?.getElementById('use_record_accurately') as LitSwitch;
    this.shareMemory = this.shadowRoot?.getElementById('shareMemory') as HTMLInputElement;
    this.shareMemoryUnit = this.shadowRoot?.getElementById('shareMemoryUnit') as HTMLSelectElement;
    this.filterMemory = this.shadowRoot?.getElementById('filterSized') as HTMLInputElement;
    this.offlineSymbol = this.shadowRoot?.getElementById('use_offline_symbolization') as LitSwitch;
    this.startupMode = this.shadowRoot?.getElementById('use_startup_mode') as LitSwitch;
    this.jsStackModel = this.shadowRoot?.getElementById('use_js-stack') as LitSwitch;
    this.responseLibMode = this.shadowRoot?.getElementById('response_lib_mode') as LitSwitch;
    this.useStatisticsEl = this.shadowRoot?.getElementById('use_statistics') as LitSwitch;
    this.statisticsIntervalInput = this.shadowRoot?.getElementById('statistics-interval-input') as HTMLInputElement;
    this.napiName = this.shadowRoot?.getElementById('napiName') as HTMLInputElement;
    this.jsStackDepth = this.shadowRoot?.getElementById('jsStackDepth') as HTMLInputElement;
    this.statisticsIntervalName = this.shadowRoot?.getElementById('statistics-interval-name') as HTMLSpanElement;
    this.statisticsIntervalRange = this.shadowRoot?.getElementById('statistics-interval-range') as HTMLSpanElement;
    let gpuConfigList = this.shadowRoot?.querySelectorAll<HTMLDivElement>('.gpu-type-div');
    this.cpuMemorySwitch = this.shadowRoot?.querySelector('#cpuMemory_switch') as LitSwitch;
    this.gpuMemorySwitch = this.shadowRoot?.querySelector('#gpuMemory_switch') as LitSwitch;
    this.typeSelect = this.shadowRoot?.querySelector<LitSelectV>("lit-select-v[title='Gpu Type']");
    this.typeSelect!.showItems = [resGpuVk, resGpuGlesImage, resGpuGlesBuffer, resGpuClImage, resGpuClBuffer];
    this.typeInput = this.typeSelect!.shadowRoot?.querySelector('input') as HTMLInputElement;

    this.gpuMemorySwitch.addEventListener('change', () => {
      let configVisibility = 'none';
      if (this.gpuMemorySwitch?.checked) {
        configVisibility = 'block';
        this.offlineSymbol!.checked = false;
        this.offlineSymbol!.disabled = true;
      } else {
        if (!this.cpuMemorySwitch?.checked) {
          this.nativeStartSwitch!.checked = false;
          this.disable();
        }
        this.offlineSymbol!.checked = true;
        this.offlineSymbol!.disabled = false;
      }
      if (gpuConfigList) {
        gpuConfigList!.forEach((configEl) => {
          configEl.style.display = configVisibility;
        });
      }
    });

    this.cpuMemorySwitch.addEventListener('change', () => {
      if (!this.cpuMemorySwitch?.checked && !this.gpuMemorySwitch?.checked) {
        this.nativeStartSwitch!.checked = false;
        this.disable();
      }
    });
    this.initNativeSwitchOption();
  }

  initHtml(): string {
    return SpAllocationHtml;
  }

  connectedCallback(): void {
    this.unwindEL?.addEventListener('keydown', this.handleInputChangeEvent);
    this.shareMemory?.addEventListener('keydown', this.handleInputChangeEvent);
    this.shareMemoryUnit?.addEventListener('keydown', this.handleInputChangeEvent);
    this.filterMemory?.addEventListener('keydown', this.handleInputChangeEvent);
    this.intervalResultInput?.addEventListener('keydown', this.handleInputChangeEvent);
    this.statisticsSlider?.addEventListener('input', this.statisticsSliderInputEvent);
    this.intervalResultInput?.addEventListener('input', this.statisticsValueInputEvent);
    this.intervalResultInput?.addEventListener('focusout', this.statisticsFocusOutEvent);
    this.statisticsSlider?.shadowRoot
      ?.querySelector('#slider')!
      .addEventListener('mouseup', this.statisticsSliderMouseupEvent);
    this.startupMode?.addEventListener('change', this.startupModeChangeEvent);
    this.jsStackModel?.addEventListener('change', this.jsStackModelChangeEvent);
    this.addOptionButton?.addEventListener('click', this.advanceOptionClickEvent);
    this.fpUnWind?.addEventListener('change', this.fpUnWindChangeEvent);
    this.useStatisticsEl?.addEventListener('change', this.useStatisticsChangeEvent);
    this.statisticsIntervalInput?.addEventListener('input', this.statisticsIntervalInputEvent);
    this.statisticsIntervalInput?.addEventListener('keyup', this.statisticsIntervalKeyUpEvent);
    this.typeInput?.addEventListener('mousedown', this.typeSelectMousedownHandler);
    this.typeInput?.addEventListener('click', this.typeSelectClickHandler);
  }

  disconnectedCallback(): void {
    this.unwindEL?.removeEventListener('keydown', this.handleInputChangeEvent);
    this.shareMemory?.removeEventListener('keydown', this.handleInputChangeEvent);
    this.shareMemoryUnit?.removeEventListener('keydown', this.handleInputChangeEvent);
    this.filterMemory?.removeEventListener('keydown', this.handleInputChangeEvent);
    this.intervalResultInput?.removeEventListener('keydown', this.handleInputChangeEvent);
    this.statisticsSlider?.removeEventListener('input', this.statisticsSliderInputEvent);
    this.intervalResultInput?.removeEventListener('input', this.statisticsValueInputEvent);
    this.intervalResultInput?.removeEventListener('focusout', this.statisticsFocusOutEvent);
    this.statisticsSlider?.shadowRoot
      ?.querySelector('#slider')!
      .removeEventListener('mouseup', this.statisticsSliderMouseupEvent);
    this.startupMode?.removeEventListener('change', this.startupModeChangeEvent);
    this.jsStackModel?.removeEventListener('change', this.jsStackModelChangeEvent);
    this.addOptionButton?.removeEventListener('click', this.advanceOptionClickEvent);
    this.fpUnWind?.removeEventListener('change', this.fpUnWindChangeEvent);
    this.useStatisticsEl?.removeEventListener('change', this.useStatisticsChangeEvent);
    this.statisticsIntervalInput?.removeEventListener('input', this.statisticsIntervalInputEvent);
    this.statisticsIntervalInput?.removeEventListener('keyup', this.statisticsIntervalKeyUpEvent);
    this.typeInput?.removeEventListener('mousedown', this.typeSelectMousedownHandler);
    this.typeInput?.removeEventListener('click', this.typeSelectClickHandler);
  }

  handleInputChangeEvent = (ev: KeyboardEvent): void => {
    // @ts-ignore
    if (ev.key === '0' && ev.target.value.length === 1 && ev.target.value === '0') {
      ev.preventDefault();
    }
  };

  statisticsSliderInputEvent = (): void => {
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

  statisticsValueInputEvent = (): void => {
    if (this.intervalResultInput!.value === '0') {
      this.useStatisticsEl!.checked = false;
      this.useStatisticsChangeHandle(false);
    } else {
      this.statisticsIntervalHandle();
    }
  };

  statisticsFocusOutEvent = (): void => {
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

  useStatisticsChangeEvent = (): void => {
    let useStatistics = this.useStatisticsEl!.checked;
    this.useStatisticsChangeHandle(useStatistics);
  };

  fpUnWindChangeEvent = (): void => {
    this.napiName!.disabled = !(!this.fp_unwind && this.recordJsStack);
  };

  private initRecordGpuConfig(): void {
    this.configType = this.shadowRoot?.querySelector<HTMLDivElement>('.gpu-type-div');
    gpuConfigList.forEach((config) => {
      switch (config.type) {
        case 'select-multiple':
          this.configTypeBySelectMultiple(config, this.configType!);
          break;
        default:
          break;
      }
    });
  }

  private configTypeBySelectMultiple(config: unknown, recordGpuDiv: HTMLDivElement): void {
    let html = '';
    //@ts-ignore
    let placeholder = config.selectArray[0];
    //@ts-ignore
    if (config.title === 'Gpu Type') {
      placeholder = 'please select gpu type';
    }
    html += `<lit-select-v default-value="" rounded="" class="record-type-select config"
      mode="multiple" canInsert="" title="${
      //@ts-ignore
      config.title
      }" rounded placement = "bottom" placeholder="${placeholder}">`;
    //@ts-ignore
    config.selectArray.forEach((value: string) => {
      html += `<lit-select-option value="${value}">${value}</lit-select-option>`;
    });
    html += '</lit-select-v>';
    recordGpuDiv.innerHTML = recordGpuDiv.innerHTML + html;
  }

  getGpuConfig(): string | undefined {
    let gpuConfigVal = this.shadowRoot?.querySelectorAll<HTMLElement>('.config');
    let gpuConfig: string = '';
    gpuConfigVal!.forEach((value) => {
      gpuConfig = this.getGpuConfigData(value, gpuConfig);
    });
    return gpuConfig;
  }

  private getGpuConfigData(value: HTMLElement, gpuConfig: string): string {
    switch (value.title) {
      case 'Gpu Type':
        gpuConfig = this.gpuConfigByTypeList(gpuConfig, value as LitSelectV);
        break;
    }
    return gpuConfig;
  }

  private gpuConfigByTypeList(gpuConfig: string, selectValue: LitSelectV): string {
    gpuConfig = selectValue.value;
    return gpuConfig;
  }

  typeSelectClickHandler = (): void => {
    if (!this.startSamp) {
      return;
    }
    let messageType = [];
    messageType = gpuTypeAll;
    this.typeSelect?.dataSource(messageType, '');
    this.typeInput!.value = this.typeSelect!.showItems.join(',');
    this.typeSelect?.shadowRoot?.querySelectorAll('lit-select-option').forEach((option) => {
      if (this.typeInput!.value.includes(option.getAttribute('value') || '')) {
        option.setAttribute('selected', '');
      } else {
        option.removeAttribute('selected');
        let number = this.typeSelect!.showItems.indexOf(option.getAttribute('value') || '');
        if (number > -1) {
          this.typeSelect!.showItems!.splice(number, 1);
        }
      }
      option.addEventListener('onSelected', (e: unknown) => {
        if (this.typeSelect!.showItems.length === 0) {
          this.typeInput!.placeholder = 'NONE';
        }
      });
    });
  };

  typeSelectMousedownHandler = (): void => {
    this.typeSelect!.dataSource([], '');
  };

  advanceOptionClickEvent = (): void => {
    if (!this.startSamp) {
      return;
    }
    this.advanceOptionHandle(this.addOptionButton!.textContent!);
  };

  startupModeChangeEvent = (): void => {
    let process = this.processId?.shadowRoot?.querySelector('input') as HTMLInputElement;
    let processDiv = this.processId?.shadowRoot?.querySelector('.root') as HTMLDivElement;
    process.value = '';
    let packageInput = this.packageName?.shadowRoot?.querySelector('input') as HTMLInputElement;
    let packageDiv = this.packageName?.shadowRoot?.querySelector('.root') as HTMLDivElement;
    packageInput.value = '';
    if (this.startup_mode) {
      this.packageName!.showItem = '';
      this.packageName!.style.display = 'block';
      this.processId!.style.display = 'none';
      packageDiv.style.width = 'auto';
      packageInput!.placeholder = 'please select package';
      this.processId!.dataSource([], '');
    } else {
      this.processId!.showItems = [];
      this.packageName!.style.display = 'none';
      this.processId!.style.display = 'block';
      processDiv.style.width = 'auto';
      process!.placeholder = 'please select process';
      this.packageName!.dataSource = [];
    }
  };

  jsStackModelChangeEvent = (): void => {
    this.jsStackDepth!.disabled = !this.recordJsStack;
    this.napiName!.disabled = !(!this.fp_unwind && this.recordJsStack);
  };

  statisticsSliderMouseupEvent = (): void => {
    setTimeout((): void => {
      let percentValue = this.recordStatisticsResult!.getAttribute('percent');
      let index = Math.round(Number(percentValue) / NUM_450);
      index = index < 1 ? 0 : index;
      this.intervalResultInput!.value = `${stepValue[index]}`;
      this.recordStatisticsResult!.setAttribute('percentValue', `${stepValue[index]}`);
      if (this.intervalResultInput!.value === '0') {
        this.useStatisticsEl!.checked = false;
        this.useStatisticsChangeHandle(false);
      }
    });
  };

  statisticsIntervalInputEvent = (): void => {
    let intervalValue = Number(this.statisticsIntervalInput!.value);
    if (intervalValue > 65535) {
      this.statisticsIntervalInput!.value = '65535';
    }
    if (intervalValue === 0 || this.statisticsIntervalInput!.value.startsWith('0')) {
      let resultValue = parseInt(this.statisticsIntervalInput!.value, 10);
      this.statisticsIntervalInput!.value = `${resultValue}`;
    }
  };

  statisticsIntervalKeyUpEvent = (): void => {
    this.statisticsIntervalInput!.value = this.statisticsIntervalInput!.value.replace(/\D/g, '');
  };

  private useStatisticsChangeHandle(useStatistics: boolean): void {
    if (useStatistics) {
      this.intervalResultInput!.value = '10';
      this.statisticsIntervalHandle();
      this.statisticsIntervalName!.textContent = 'Sample Interval';
      this.statisticsIntervalRange!.textContent = 'Rang is 0 - 65535, default 0 byte';
      this.statisticsIntervalInput!.value = '0';
      this.statisticsSlider!.disabled = false;
      this.intervalResultInput!.disabled = false;
    } else {
      this.intervalResultInput!.value = '0';
      this.statisticsIntervalHandle();
      this.statisticsIntervalName!.textContent = 'Malloc Free Matching Interval';
      this.statisticsIntervalRange!.textContent = 'Rang is 0 - 65535, default 10 s';
      this.statisticsIntervalInput!.value = '10';
      this.statisticsSlider!.disabled = true;
      this.intervalResultInput!.disabled = true;
    }
  }

  private advanceOptionHandle(textValue: string): void {
    this.resetAdvanceItems();
    let displayStyle = 'none';
    if (textValue === 'Advance Options') {
      this.addOptionButton!.textContent = 'Normal Options';
      displayStyle = 'flex';
    } else {
      this.addOptionButton!.textContent = 'Advance Options';
    }
    this.advanceItems.forEach((itemEl) => {
      if (itemEl) {
        itemEl.style.display = displayStyle;
      }
    });
    this.jsStackDepth!.disabled = !this.recordJsStack;
    this.napiName!.disabled = !(!this.fp_unwind && this.recordJsStack);
  }

  private resetAdvanceItems(): void {
    this.advanceItems = [
      this.recordAccuratelyDivEl,
      this.recordAccuratelyDivEl,
      this.offlineSymbolizationDivEl,
      this.jsStackRecordDepthEl,
      this.napiRecordEl,
      this.maxUnwindLevelEl,
      this.sharedMemorySizeEl,
      this.filterMemorySizeEl,
      this.sampleIntervalEl,
      this.useStartupEl,
      this.useResponseLibEl,
    ];
  }

  private initNativeSwitchOption(): void {
    this.packageName!.style.display = 'none';
    let processInputEl = this.processId!.shadowRoot?.querySelector('input') as HTMLInputElement;
    processInputEl.addEventListener('mousedown', (): void => {
      this.processMouseDownHandler(processInputEl);
    });
    let packageInput = this.packageName!.shadowRoot?.querySelector('input') as HTMLInputElement;
    packageInput.addEventListener('mousedown', (): void => {
      this.packageMouseDownHandler(packageInput);
    });
    this.statisticsSlider!.sliderStyle = {
      minRange: 0,
      maxRange: 3600,
      defaultValue: '900',
      resultUnit: 'S',
      stepSize: 450,
      lineColor: 'var(--dark-color3,#46B1E3)',
      buttonColor: '#999999',
    };
    let parentElement = this.statisticsSlider!.parentNode as Element;
    this.intervalResultInput!.value = '10';
    parentElement.setAttribute('percent', '3600');
    this.intervalResultInput!.style.color = 'var(--dark-color1,#000000)';
    let litSwitch = this.shadowRoot?.querySelector('#switch-disabled') as LitSwitch;
    litSwitch.addEventListener('change', (event: Event): void => {
      // @ts-ignore
      let detail = event.detail;
      if (detail.checked) {
        this.cpuMemorySwitch!.checked = true;
        this.unDisable();
      } else {
        this.disable();
      }
      this.addOptionButton!.textContent = 'Advance Options';
    });
    this.packageName!.style.display = 'none';
    this.processId!.style.display = 'block';
    let processDivEl = this.processId?.shadowRoot?.querySelector('.root') as HTMLDivElement;
    if (processDivEl) {
      processDivEl.style.width = 'auto';
    }
    this.disable();
  }

  private processMouseDownHandler(process: HTMLInputElement): void {
    if (this.startSamp && !this.startup_mode) {
      Cmd.getProcess().then((processList: string[]): void => {
        this.processId?.dataSource(processList, '');
        if (processList.length > 0) {
          this.processId?.dataSource(processList, '');
        } else {
          this.processId?.dataSource([], '');
        }
      });
      process.readOnly = false;
    } else {
      process.readOnly = true;
      return;
    }
    if (this.startSamp && (SpRecordTrace.serialNumber === '' || this.startup_mode)) {
      this.processId?.dataSource([], '');
    } else {
    }
  }

  private packageMouseDownHandler(packageInput: HTMLInputElement): void {
    if (this.startSamp && this.startup_mode) {
      Cmd.getPackage().then((packageList: string[]): void => {
        let finalDataList = packageList.map(str => str.replace(/\t/g, ''));
        if (finalDataList.length > 0) {
          this.packageName!.dataSource = finalDataList;
        } else {
          this.packageName!.dataSource = [];
        }
      });
      packageInput.readOnly = false;
    } else {
      packageInput.readOnly = true;
      return;
    }
  }

  private statisticsIntervalHandle(): void {
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
    if (
      Number(this.intervalResultInput!.value) < this.statisticsSlider!.sliderStyle.minRange ||
      Number(this.intervalResultInput!.value) > this.statisticsSlider!.sliderStyle.maxRange
    ) {
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
  }

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
    if (this.jsStackModel) {
      this.jsStackModel.disabled = false;
    }
    if (this.responseLibMode) {
      this.responseLibMode.disabled = false;
    }
    if (this.statisticsIntervalInput) {
      this.statisticsIntervalInput.disabled = false;
    }
    if (this.useStatisticsEl) {
      this.useStatisticsEl.disabled = false;
    }
    if (this.cpuMemorySwitch) {
      this.cpuMemorySwitch.disabled = false;
    }
    if (this.gpuMemorySwitch) {
      this.gpuMemorySwitch.disabled = false;
    }
    if (this.typeSelect) {
      this.typeSelect.removeAttribute('disabled');
    }
    this.processId!.removeAttribute('disabled');
    let inputBoxes = this.shadowRoot?.querySelectorAll<HTMLInputElement>('.inputBoxes');
    inputBoxes!.forEach((item: HTMLInputElement): void => {
      item.disabled = false;
    });
    if (this.startup_mode) {
      this.packageName!.removeAttribute('disabled');
    } else {
      this.processId!.removeAttribute('disabled');
    }
    this.statisticsSlider!.disabled = false;
  }

  private disable(): void {
    this.startSamp = false;
    this.advanceOptionHandle('Normal Options');
    if (this.fpUnWind) {
      this.fpUnWind.disabled = true;
    }
    if (this.recordAccurately) {
      this.recordAccurately.disabled = true;
    }
    if (this.startupMode) {
      this.startupMode.disabled = true;
    }
    if (this.jsStackModel) {
      this.jsStackModel.disabled = true;
    }
    if (this.offlineSymbol) {
      this.offlineSymbol.disabled = true;
    }
    if (this.responseLibMode) {
      this.responseLibMode.disabled = true;
    }
    if (this.statisticsIntervalInput) {
      this.statisticsIntervalInput.disabled = true;
    }
    if (this.useStatisticsEl) {
      this.useStatisticsEl.disabled = true;
    }
    if (this.cpuMemorySwitch) {
      this.cpuMemorySwitch.disabled = true;
    }
    if (this.gpuMemorySwitch) {
      this.gpuMemorySwitch.disabled = true;
    }
    if (this.typeSelect) {
      this.typeSelect.setAttribute('disabled', '');
    }
    this.processId!.setAttribute('disabled', '');
    let inputBoxes = this.shadowRoot?.querySelectorAll<HTMLInputElement>('.inputBoxes');
    inputBoxes!.forEach((item: HTMLInputElement): void => {
      item.disabled = true;
    });
    if (this.startup_mode) {
      this.packageName!.setAttribute('disabled', '');
    } else {
      this.processId!.setAttribute('disabled', '');
    }
    this.statisticsSlider!.disabled = true;
  }
}

const stepValue: number[] = [0, 1, 10, NUM_30, NUM_60, NUM_300, NUM_600, NUM_1800, NUM_3600];

const gpuConfigList = [
  {
    title: 'Gpu Type',
    des: 'Record GpuType',
    hidden: true,
    type: 'select-multiple',
    selectArray: [''],
  },
];