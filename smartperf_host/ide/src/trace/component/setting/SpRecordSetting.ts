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
import '../../../base-ui/radiobox/LitRadioBox';
import { LitRadioBox } from '../../../base-ui/radiobox/LitRadioBox';
import '../../../base-ui/slider/LitSlider';
import { LitSlider } from '../../../base-ui/slider/LitSlider';
import '../../../base-ui/popover/LitPopover';
import { info } from '../../../log/Log';
import { SpApplication } from '../../SpApplication';
import { NUM_200, NUM_30, NUM_3600, NUM_60, NUM_64 } from '../../bean/NumBean';
import { SpRecordSettingHtml } from './SpRecordSetting.html';

@element('record-setting')
export class SpRecordSetting extends BaseElement {
  private memoryBufferSlider: LitSlider | undefined;
  private maxDurationSliders: LitSlider | undefined;
  private snapShotSlider: LitSlider | undefined;
  private radioBox: LitRadioBox | undefined;
  private longTraceRadio: LitRadioBox | undefined;
  private bufferNumber: HTMLElement | undefined;
  private durationNumber: HTMLElement | undefined;
  private snapShotNumber: HTMLElement | undefined;
  private outputPath: HTMLInputElement | undefined;
  private lastMemoryValue: string | undefined;
  private lastDurationValue: string | undefined;
  private maxSizeInput: HTMLInputElement | undefined;
  isRecordTemplate: boolean = false;

  get longTraceSingleFileMaxSize(): number {
    let maxFileSizeEl = this.shadowRoot?.querySelector<HTMLInputElement>('.max_size_result');
    if (maxFileSizeEl) {
      return Number(maxFileSizeEl.value);
    }
    return NUM_200;
  }

  get recordMod(): boolean {
    if (this.radioBox) {
      return this.radioBox.checked;
    }
    return false;
  }

  get longOutPath(): string {
    if (this.outputPath && this.outputPath.value !== '' && this.outputPath.value !== 'long_trace') {
      return `/data/local/tmp/${this.outputPath.value}/`;
    }
    return '/data/local/tmp/long_trace/';
  }

  get output(): string {
    if (SpApplication.isLongTrace && !this.isRecordTemplate) {
      if (this.outputPath && this.outputPath.value !== 'long_trace/' && this.outputPath.value !== '') {
        return `/data/local/tmp/${this.outputPath.value}/hiprofiler_data.htrace`;
      }
      return '/data/local/tmp/long_trace/hiprofiler_data.htrace';
    } else {
      if (this.outputPath && this.outputPath.value !== '') {
        return `/data/local/tmp/${this.outputPath.value}`;
      }
      return '/data/local/tmp/hiprofiler_data.htrace';
    }
  }

  get bufferSize(): number {
    if (this.bufferNumber?.hasAttribute('percent')) {
      info('bufferSize  is : ', this.bufferNumber!.getAttribute('percent'));
      return Number(this.bufferNumber!.getAttribute('percent'));
    }
    return NUM_64;
  }

  get maxDur(): number {
    if (this.durationNumber?.hasAttribute('percent')) {
      info('maxDur  is : ', this.durationNumber!.getAttribute('percent'));
      return Number(this.durationNumber!.getAttribute('percent'));
    }
    return NUM_30;
  }

  get snapShot(): number {
    if (this.snapShotNumber?.hasAttribute('percent')) {
      info('snapShot  is : ', this.snapShotNumber!.getAttribute('percent'));
      let snapShot = Number(this.snapShotNumber!.getAttribute('percent')) < 200 ? '0' : this.snapShotNumber!.getAttribute('percent');
      return Number(snapShot);
    }
    return NUM_200;
  }

  resetValue(): void {
    let bufferInput = this.shadowRoot?.querySelector('.memory_buffer_result') as HTMLInputElement;
    let parentElement = this.memoryBufferSlider!.parentNode as Element;
    if (bufferInput.style.color !== 'var(--dark-color1,#000000)' && this.lastMemoryValue) {
      bufferInput.value = `${this.lastMemoryValue}`;
      this.memoryBufferSlider!.percent = `${this.lastMemoryValue}`;
      this.memoryBufferSlider!.sliderStyle = {
        minRange: 4,
        maxRange: 512,
        defaultValue: `${this.lastMemoryValue}`,
        resultUnit: 'MB',
        stepSize: 2,
        lineColor: 'var(--dark-color3,#46B1E3)',
        buttonColor: '#999999',
      };
      parentElement.setAttribute('percent', `${this.lastMemoryValue}`);
      this.lastMemoryValue = `${this.lastMemoryValue}`;
      bufferInput.style.color = 'var(--dark-color1,#000000)';
    }

    let durationInput = this.shadowRoot?.querySelector('.max_duration_result') as HTMLInputElement;
    let durationEl = this.maxDurationSliders!.parentNode as Element;
    if (durationInput.style.color !== 'var(--dark-color1,#000000)' && this.lastDurationValue) {
      durationInput.style.color = 'var(--dark-color1,#000000)';
      let durationList = this.lastDurationValue.split(':');
      let resultDuration =
        Number(durationList[0]) * NUM_3600 + Number(durationList[1]) * NUM_60 + Number(durationList[2]);
      durationInput.value = this.lastDurationValue;
      this.maxDurationSliders!.sliderStyle = {
        minRange: 10,
        maxRange: 3600,
        defaultValue: this.lastDurationValue!,
        resultUnit: 'h:m:s',
        stepSize: 1,
        lineColor: 'var(--dark-color4,#61CFBE)',
        buttonColor: '#999999',
      };
      durationEl.setAttribute('percent', resultDuration.toString());
    }
  }

  initElements(): void {
    this.bufferNumber = this.shadowRoot?.querySelector('.buffer-size') as HTMLElement;
    this.durationNumber = this.shadowRoot?.querySelector('.max-duration') as HTMLElement;
    this.snapShotNumber = this.shadowRoot?.querySelector('.snapShot') as HTMLElement;
    let inputs = this.shadowRoot?.querySelectorAll('input');
    inputs!.forEach((item) => {
      item.addEventListener('keydown', (ev) => {
        // @ts-ignore
        if (ev.key === '0' && ev.target.value.length === 1 && ev.target.value === '0') {
          ev.preventDefault();
        }
      });
    });
    this.shadowRoot?.querySelectorAll<HTMLButtonElement>('.MenuButton').forEach((button) => {
      button!.addEventListener('mouseenter', () => {
        button.style.backgroundColor = '#EFEFEF';
      });
      button!.addEventListener('mouseout', () => {
        button.style.backgroundColor = '#E4E3E9';
      });
    });
    this.radioBox = this.shadowRoot?.querySelector('#litradio') as LitRadioBox;
    this.addLongTraceConfig();
    this.initLitSlider();
  }

  private getLongTraceSlideHTML(): string {
    return `<div class="max-single-file-size">
        <div class="record-title">
            <span class="record-mode" >Single file max size</span>
            <span class="record-prompt"> (single file size after cutting is 200MB - 300MB) </span>
        </div>
        <lit-slider id="max-size" defaultColor="var(--dark-color4,#86C5E3)" open dir="right">
        </lit-slider>
        <div class='resultValue'>
            <input class="max_size_result" type="text" value = '200' 
            oninput="if(this.value > 300){this.value = '300'} 
            if (this.value < 200) { 
              this.parentElement.style.border = '1px solid red'
            } else { 
              this.parentElement.style.border = '1px solid #ccc'
            } 
            if (this.value > 0 && this.value.toString().startsWith('0')){
              this.value = Number(this.value) 
            }" >
            <span style="text-align: center; margin: 8px 8px 8px 0"> MB </span>
        </div>
      </div>`;
  }

  private addLongTraceConfig(): void {
    this.longTraceRadio = this.shadowRoot?.querySelector('#longTraceRadio') as LitRadioBox;
    this.outputPath = this.shadowRoot?.querySelector<HTMLInputElement>('#trace_path') as HTMLInputElement;
    let rootEl = this.shadowRoot?.querySelector('.root') as HTMLDivElement;
    let longTraceMaxSlide = document.createElement('div');
    longTraceMaxSlide.innerHTML = this.getLongTraceSlideHTML();
    let maxSingleFileEl = longTraceMaxSlide.querySelector<HTMLDivElement>('.max-single-file-size');
    let maxSizeSliders = longTraceMaxSlide.querySelector('#max-size') as LitSlider;
    this.maxSizeInput = longTraceMaxSlide.querySelector('.max_size_result') as HTMLInputElement;
    this.maxSizeInput.onkeydown = (ev): void => {
      // @ts-ignore
      if (ev.key === '0' && ev.target.value.length === 1 && ev.target.value === '0') {
        ev.preventDefault();
      }
    };
    let maxSizeParentElement = maxSizeSliders.parentNode as Element;
    maxSizeSliders.sliderStyle = {
      minRange: 200,
      maxRange: 300,
      defaultValue: '200',
      resultUnit: 'MB',
      stepSize: 2,
      lineColor: 'var(--dark-color3,#46B1E3)',
      buttonColor: '#999999',
    };
    maxSizeSliders.addEventListener('input', () => {
      if (maxSingleFileEl?.hasAttribute('percent')) {
        this.maxSizeInput!.value = `${maxSingleFileEl?.getAttribute('percent')}`;
      } else {
        this.maxSizeInput!.value = maxSizeSliders.sliderStyle.defaultValue;
      }
    });
    this.maxSizeInput.value = maxSizeSliders.sliderStyle.defaultValue;
    maxSizeParentElement.setAttribute('percent', '50');
    this.maxSizeInput.style.color = 'var(--dark-color1,#000000)';
    this.maxSizeInput.addEventListener('input', () => {
      this.maxSizeInputHandler(maxSizeSliders, maxSizeParentElement);
    });
    this.radioBox!.addEventListener('click', () => {
      this.normalModelRadioHandler(rootEl, longTraceMaxSlide);
    });
    this.longTraceRadio.addEventListener('click', () => {
      this.longTraceModelRadioHandler(rootEl, longTraceMaxSlide);
    });
  }

  private normalModelRadioHandler(rootEl: HTMLDivElement, longTraceMaxSlide: HTMLDivElement): void {
    SpApplication.isLongTrace = false;
    if (rootEl.lastChild === longTraceMaxSlide) {
      rootEl.removeChild(longTraceMaxSlide);
    }
    this.outputPath!.value = 'hiprofiler_data.htrace';
    this.snapShotNumber!.style.display = 'grid';
  }

  private longTraceModelRadioHandler(rootEl: HTMLDivElement, longTraceMaxSlide: HTMLDivElement): void {
    SpApplication.isLongTrace = true;
    rootEl.appendChild(longTraceMaxSlide);
    this.outputPath!.value = 'long_trace';
    this.snapShotNumber!.style.display = 'none';
  }

  private maxSizeInputHandler(maxSizeSliders: LitSlider, maxSizeParentElement: Element): void {
    maxSizeSliders!.percent = this.maxSizeInput!.value;
    let htmlInputElement = maxSizeSliders!.shadowRoot?.querySelector('#slider') as HTMLInputElement;
    htmlInputElement.value = this.maxSizeInput!.value;
    maxSizeSliders!.sliderStyle = {
      minRange: 200,
      maxRange: 300,
      defaultValue: this.maxSizeInput!.value,
      resultUnit: 'MB',
      stepSize: 2,
      lineColor: 'var(--dark-color3,#46B1E3)',
      buttonColor: '#999999',
    };
    maxSizeParentElement.setAttribute('percent', this.maxSizeInput!.value);
  }

  initLitSlider(): void {
    this.memoryBufferSlider = this.shadowRoot?.querySelector<LitSlider>('#memory-buffer') as LitSlider;
    this.memoryBufferSlider.sliderStyle = {
      minRange: 4,
      maxRange: 512,
      defaultValue: '64',
      resultUnit: 'MB',
      stepSize: 2,
      lineColor: 'var(--dark-color3,#46B1E3)',
      buttonColor: '#999999',
    };
    this.lastMemoryValue = '64';
    this.initMemoryBufferEl();
    this.maxDurationSliders = this.shadowRoot?.querySelector<LitSlider>('#max-duration') as LitSlider;
    this.maxDurationSliders.sliderStyle = {
      minRange: 10,
      maxRange: 3600,
      defaultValue: '00:00:30',
      resultUnit: 'h:m:s',
      stepSize: 1,
      lineColor: 'var(--dark-color4,#61CFBE)',
      buttonColor: '#999999',
    };
    this.lastDurationValue = '00:00:30';
    let durationParentElement = this.maxDurationSliders!.parentNode as Element;
    let durationInput = this.shadowRoot?.querySelector('.max_duration_result') as HTMLInputElement;
    durationInput.value = this.maxDurationSliders.sliderStyle.defaultValue;
    this.maxDurationSliders.addEventListener('input', () => {
      durationInput.value = this.maxDurationSliders!.formatSeconds(this.maxDur.toString());
    });
    durationInput.style.color = 'var(--dark-color1,#000000)';
    durationInput.addEventListener('input', () => {
      this.maxDurationInputHandler(durationInput, durationParentElement);
    });
    let maxDurationInput = this.maxDurationSliders!.shadowRoot?.querySelector('#slider') as HTMLInputElement;
    maxDurationInput.addEventListener('input', () => {
      durationInput.style.color = 'var(--dark-color1,#000000)';
      durationInput.parentElement!.style.backgroundColor = 'var(--dark-background5,#F2F2F2)';
      durationInput.style.backgroundColor = 'var(--dark-background5,#F2F2F2)';
    });
    this.snapShotSlider = this.shadowRoot?.querySelector<LitSlider>('#snapShot') as LitSlider;
    this.snapShotSlider.sliderStyle = {
      minRange: 0,
      maxRange: 1000,
      defaultValue: '0',
      resultUnit: 'MS',
      stepSize: 1,
      lineColor: 'var(--dark-color3,#46B1E3)',
      buttonColor: '#999999',
    };
    this.initSnapShotEl();
  }

  private initSnapShotEl(): void {
    let parentElement = this.snapShotSlider!.parentNode as Element;
    let snapShotInput = this.shadowRoot?.querySelector('.snapShot_result') as HTMLInputElement;
    snapShotInput.value = this.snapShotSlider!.sliderStyle.defaultValue;
    this.snapShotSlider!.addEventListener('input', () => {
      snapShotInput.value = this.snapShot.toString();
      this.isUseLocalhdc(snapShotInput.value);
    });
    parentElement.setAttribute('percent', '0');
    snapShotInput.style.color = 'var(--dark-color1,#000000)';
    snapShotInput.addEventListener('input', () => {
      this.snapShotInputHandler(snapShotInput, parentElement);
      this.isUseLocalhdc(snapShotInput.value);
    });
    let memoryBufferInput = this.snapShotSlider!.shadowRoot?.querySelector('#slider') as HTMLInputElement;
    memoryBufferInput.addEventListener('input', () => {
      snapShotInput.style.color = 'var(--dark-color1,#000000)';
      snapShotInput.parentElement!.style.backgroundColor = 'var(--dark-background5,#F2F2F2)';
      snapShotInput.style.backgroundColor = 'var(--dark-background5,#F2F2F2)';
    });
  }

  private isUseLocalhdc(val: string): void {
    this.dispatchEvent(new CustomEvent('showTip', {
      detail: {
        value: 'snapshot',
        isShow:!(Number(val) < 200)
      }
    }));
  }

  private initMemoryBufferEl(): void {
    let parentElement = this.memoryBufferSlider!.parentNode as Element;
    let bufferInput = this.shadowRoot?.querySelector('.memory_buffer_result') as HTMLInputElement;
    bufferInput.value = this.memoryBufferSlider!.sliderStyle.defaultValue;
    this.memoryBufferSlider!.addEventListener('input', () => {
      bufferInput.value = this.bufferSize.toString();
    });
    parentElement.setAttribute('percent', '64');
    bufferInput.style.color = 'var(--dark-color1,#000000)';
    bufferInput.addEventListener('input', () => {
      this.memoryBufferInputHandler(bufferInput, parentElement);
    });
    let memoryBufferInput = this.memoryBufferSlider!.shadowRoot?.querySelector('#slider') as HTMLInputElement;
    memoryBufferInput.addEventListener('input', () => {
      bufferInput.style.color = 'var(--dark-color1,#000000)';
      bufferInput.parentElement!.style.backgroundColor = 'var(--dark-background5,#F2F2F2)';
      bufferInput.style.backgroundColor = 'var(--dark-background5,#F2F2F2)';
    });
  }

  private maxDurationInputHandler(durationInput: HTMLInputElement, durationParentElement: Element): void {
    if (this.durationNumber!.hasAttribute('percent')) {
      this.durationNumber!.removeAttribute('percent');
    }
    durationInput.style.color = 'var(--dark-color1,#000000)';
    durationInput.parentElement!.style.backgroundColor = 'var(--dark-background5,#F2F2F2)';
    durationInput.style.backgroundColor = 'var(--dark-background5,#F2F2F2)';
    let regExpMatchArray = durationInput.value.trim();
    if (regExpMatchArray === '') {
      durationInput.style.color = 'red';
      durationParentElement.setAttribute('percent', '30');
      return;
    }
    let regExpMatch = durationInput.value.trim().match('^\\d{1,2}\\:\\d{1,2}\\:\\d{1,2}$');
    if (regExpMatch) {
      let durationList = regExpMatchArray.split(':');
      let resultDuration =
        Number(durationList[0]) * NUM_3600 + Number(durationList[1]) * NUM_60 + Number(durationList[2]);
      if (
        Number(durationList[0]) > NUM_60 ||
        Number(durationList[1]) > NUM_60 ||
        Number(durationList[2]) > NUM_60 ||
        resultDuration > this.maxDurationSliders!.sliderStyle.maxRange ||
        resultDuration < this.maxDurationSliders!.sliderStyle.minRange
      ) {
        durationInput.style.color = 'red';
        durationParentElement.setAttribute('percent', '30');
      } else {
        durationInput.style.color = 'var(--dark-color1,#000000)';
        durationInput.parentElement!.style.backgroundColor = 'var(--dark-background5,#F2F2F2)';
        durationInput.style.backgroundColor = 'var(--dark-background5,#F2F2F2)';
        let htmlInputElement = this.maxDurationSliders!.shadowRoot?.querySelector('#slider') as HTMLInputElement;
        htmlInputElement.value = `${resultDuration}`;
        this.maxDurationSliders!.sliderStyle = {
          minRange: 10,
          maxRange: 3600,
          defaultValue: `${Number(durationList[0])}:${Number(durationList[1])}:${Number(durationList[2])}`,
          resultUnit: 'h:m:s',
          stepSize: 1,
          lineColor: 'var(--dark-color4,#61CFBE)',
          buttonColor: '#999999',
        };
        durationParentElement.setAttribute('percent', resultDuration.toString());
        this.lastDurationValue = regExpMatchArray;
      }
    } else {
      durationInput.style.color = 'red';
      durationParentElement.setAttribute('percent', '30');
    }
  }

  private memoryBufferInputHandler(bufferInput: HTMLInputElement, parentElement: Element): void {
    if (this.bufferNumber!.hasAttribute('percent')) {
      this.bufferNumber!.removeAttribute('percent');
    }
    bufferInput.style.color = 'var(--dark-color1,#000000)';
    bufferInput.parentElement!.style.backgroundColor = 'var(--dark-background5,#F2F2F2)';
    bufferInput.style.backgroundColor = 'var(--dark-background5,#F2F2F2)';
    if (bufferInput.value.trim() === '') {
      bufferInput.style.color = 'red';
      parentElement.setAttribute('percent', '64');
      return;
    }
    let memorySize = Number(bufferInput.value);
    if (
      !memorySize ||
      memorySize < this.memoryBufferSlider!.sliderStyle.minRange ||
      memorySize > this.memoryBufferSlider!.sliderStyle.maxRange
    ) {
      bufferInput.style.color = 'red';
      parentElement.setAttribute('percent', '64');
    } else {
      this.memoryBufferSlider!.percent = bufferInput.value;
      let htmlInputElement = this.memoryBufferSlider!.shadowRoot?.querySelector('#slider') as HTMLInputElement;
      htmlInputElement.value = bufferInput.value;
      this.memoryBufferSlider!.sliderStyle = {
        minRange: 4,
        maxRange: 512,
        defaultValue: bufferInput.value,
        resultUnit: 'MB',
        stepSize: 2,
        lineColor: 'var(--dark-color3,#46B1E3)',
        buttonColor: '#999999',
      };
      parentElement.setAttribute('percent', bufferInput.value);
      this.lastMemoryValue = bufferInput.value;
    }
  }

  private snapShotInputHandler(snapShotInput: HTMLInputElement, parentElement: Element): void {
    if (this.snapShotNumber!.hasAttribute('percent')) {
      this.snapShotNumber!.removeAttribute('percent');
    }
    snapShotInput.style.color = 'var(--dark-color1,#000000)';
    snapShotInput.parentElement!.style.backgroundColor = 'var(--dark-background5,#F2F2F2)';
    snapShotInput.style.backgroundColor = 'var(--dark-background5,#F2F2F2)';
    if (snapShotInput.value.trim() === '') {
      snapShotInput.style.color = 'red';
      parentElement.setAttribute('percent', '0');
      return;
    }
    let snapShotSize = Number(snapShotInput.value);
    if (
      0 < snapShotSize && snapShotSize < 200
    ) {
      snapShotInput.style.color = 'red';
      parentElement.setAttribute('percent', '0');
      this.snapShotSlider!.percent = '0';
      let htmlInputElement = this.snapShotSlider!.shadowRoot?.querySelector('#slider') as HTMLInputElement;
      htmlInputElement.value = '0';
    } else {
      this.snapShotSlider!.percent = snapShotInput.value;
      let htmlInputElement = this.snapShotSlider!.shadowRoot?.querySelector('#slider') as HTMLInputElement;
      htmlInputElement.value = snapShotInput.value;
      this.snapShotSlider!.sliderStyle = {
        minRange: 0,
        maxRange: 1000,
        defaultValue: snapShotInput.value,
        resultUnit: 'MS',
        stepSize: 1,
        lineColor: 'var(--dark-color3,#46B1E3)',
        buttonColor: '#999999',
      };
      parentElement.setAttribute('percent', snapShotInput.value);
    }
  }

  initHtml(): string {
    return SpRecordSettingHtml;
  }
}
