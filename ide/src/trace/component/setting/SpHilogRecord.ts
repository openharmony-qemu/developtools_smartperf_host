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
import { SpRecordTrace } from '../SpRecordTrace';
import { Cmd } from '../../../command/Cmd';
import { LitAllocationSelect } from '../../../base-ui/select/LitAllocationSelect';
import { LitSelect } from '../../../base-ui/select/LitSelect';
import { SpHiLogRecordHtml } from './SpHilogRecord.html';
import { LitSelectV } from '../../../base-ui/select/LitSelectV';

@element('sp-hi-log')
export class SpHilogRecord extends BaseElement {
  private vmTrackerSwitch: LitSwitch | undefined | null;
  private processSelectEl: LitSelectV | undefined | null;
  private logsSelectEl: LitSelect | undefined | null;

  get recordHilog(): boolean {
    return this.vmTrackerSwitch!.checked;
  }

  get appProcess(): string {
    return this.processSelectEl!.value || '';
  }

  get appLogLevel(): string {
    if (this.logsSelectEl!.value.trim() === '' || this.logsSelectEl!.value === 'ALL-Level') {
      return 'LEVEL_UNSPECIFIED';
    }
    return this.logsSelectEl!.value || '';
  }

  initElements(): void {
    this.vmTrackerSwitch = this.shadowRoot?.querySelector('.hilog-switch') as LitSwitch;
    this.processSelectEl = this.shadowRoot?.querySelector('.record-process-select') as LitSelectV;
    this.logsSelectEl = this.shadowRoot?.querySelector('.record-logs-select') as LitSelect;
    let hiLogConfigList = this.shadowRoot?.querySelectorAll<HTMLDivElement>('.hilog-config-top');
    this.vmTrackerSwitch.addEventListener('change', () => {
      let configVisibility = 'none';
      if (this.vmTrackerSwitch?.checked) {
        configVisibility = 'block';
      }
      if (hiLogConfigList) {
        console.log(configVisibility);
        hiLogConfigList!.forEach((configEl) => {
          configEl.style.display = configVisibility;
        });
      }
    });
    let processInputEl = this.processSelectEl.shadowRoot?.querySelector('input') as HTMLInputElement;
    processInputEl.addEventListener('mousedown', () => {
      if (this.recordHilog) {
        if ((SpRecordTrace.serialNumber === '')) {
          this.processSelectEl!.dataSource([], '');
        } else {
          Cmd.getProcess().then((processList) => {
            if (processList.length > 0) {
              this.processSelectEl!.dataSource(processList, 'ALL-Process', true);
            } else {
              this.processSelectEl!.dataSource([], '');
            }
          });
        }
        processInputEl!.removeAttribute('readonly');
      } else {
        processInputEl!.setAttribute('readonly', 'readonly');
        return;
      }
    });
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  initHtml(): string {
    return SpHiLogRecordHtml;
  }
}
