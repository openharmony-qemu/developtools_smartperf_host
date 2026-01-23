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
import LitSwitch from '../../../base-ui/switch/lit-switch';
import '../../../base-ui/select/LitAllocationSelect';
import '../../../base-ui/switch/lit-switch';
import { SpGpuCountersRecordHtml } from './SpGpuCountersRecord.html';
import { LitSelectV } from '../../../base-ui/select/LitSelectV';
import { SpApplication } from '../../SpApplication';
import { Cmd } from '../../../command/Cmd';
import { SpRecordTrace } from '../SpRecordTrace';
import {
  messageTypeAll,
  realBattery,
  thermalReport,
  appDetail,
  appStatistic,
  componentTop,
} from './utils/PluginConvertUtils';
@element('sp-gpu-counters')
export class SpGpuCountersRecord extends BaseElement {
  private gpuCountersSwitch: LitSwitch | undefined | null;
  private periodValue: string = '';
  get periodCurrentValue(): string {
    return this.periodValue;
  }
  get recordCpuCounters(): boolean {
    return this.gpuCountersSwitch!.checked;
  }
  initElements(): void {
    this.gpuCountersSwitch = this.shadowRoot?.querySelector('.gpu-counters-switch') as LitSwitch;
    let gpuCountersConfig = this.shadowRoot?.querySelector<HTMLDivElement>('.gpu-counters-config');
    let inputInner = this.shadowRoot?.querySelector<HTMLDivElement>('.gpu-counters-config > #cpuCounters_p');
    let prompt = this.shadowRoot?.querySelector<HTMLDivElement>('.gpu-counters-config > .prompt');
    this.gpuCountersSwitch.addEventListener('change', () => {
      if (this.gpuCountersSwitch!.checked) {
        gpuCountersConfig!.style.display = 'block';
      } else {
        gpuCountersConfig!.style.display = 'none';
      }
    })
    inputInner?.addEventListener('input', () => {
      // @ts-ignore
      const numericValue = inputInner.value.replace(/[^0-9]/g, '');
      // @ts-ignore
      if (numericValue !== inputInner.value) {
        // @ts-ignore
        inputInner.value = numericValue;
      }
      // @ts-ignore
      if (Number(inputInner.value) > 1000) {
        // @ts-ignore
        prompt?.style.display = 'block';
      } else {
        // @ts-ignore
        prompt?.style.display = 'none';
      }
        // @ts-ignore
      this.periodValue =  inputInner.value;
      // @ts-ignore
      console.log(inputInner.value)
    })
  }
  initHtml(): string {
    return SpGpuCountersRecordHtml;
  }

}