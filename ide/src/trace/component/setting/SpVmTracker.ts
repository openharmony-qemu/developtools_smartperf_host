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
import LitSwitch, { LitSwitchChangeEvent } from '../../../base-ui/switch/lit-switch';
import '../../../base-ui/select/LitAllocationSelect';

import '../../../base-ui/switch/lit-switch';
import { LitAllocationSelect } from '../../../base-ui/select/LitAllocationSelect';
import { SpRecordTrace } from '../SpRecordTrace';
import { Cmd } from '../../../command/Cmd';
import { SpVmTrackerHtml } from './SpVmTracker.html';
import { LitSelectV } from '../../../base-ui/select/LitSelectV';

@element('sp-vm-tracker')
export class SpVmTracker extends BaseElement {
  private vmTrackerProcessInput: LitSelectV | undefined | null;

  set startSamp(start: boolean) {
    if (start) {
      this.setAttribute('startSamp', '');
    } else {
      this.removeAttribute('startSamp');
      let input = this.vmTrackerProcessInput?.shadowRoot?.querySelector<HTMLInputElement>('#singleInput');
      input!.value = '';
    }
  }

  get process(): string {
    if (this.vmTrackerProcessInput!.value.length > 0) {
      let result = this.vmTrackerProcessInput!.value.match(/\((.+?)\)/g);
      if (result) {
        return result.toString().replace('(', '').replace(')', '');
      } else {
        return this.vmTrackerProcessInput!.value;
      }
    }
    return '';
  }

  get startSamp(): boolean {
    return this.hasAttribute('startSamp');
  }

  initElements(): void {
    let vmTrackerSwitch = this.shadowRoot?.querySelector('lit-switch') as LitSwitch;
    vmTrackerSwitch.addEventListener('change', (event: CustomEventInit<LitSwitchChangeEvent>) => {
      let detail = event.detail;
      if (detail!.checked) {
        this.startSamp = true;
        this.unDisable();
      } else {
        this.startSamp = false;
        this.disable();
      }
    });
    this.vmTrackerProcessInput = this.shadowRoot?.querySelector<LitSelectV>('lit-select-v');
    let vmTrackerMul = this.vmTrackerProcessInput?.shadowRoot?.querySelector('input') as HTMLDivElement;
    vmTrackerMul!.addEventListener('mousedown', () => {
      if (this.startSamp && (SpRecordTrace.serialNumber === '')) {
        this.vmTrackerProcessInput!.dataSource([], '');
      }
    });
    vmTrackerMul!.addEventListener('mouseup', () => {
      if (this.startSamp) {
        if (SpRecordTrace.serialNumber === '') {
          this.vmTrackerProcessInput!.dataSource([], '');
        } else {
          Cmd.getProcess().then((processList) => {
            if (processList.length > 0) {
              this.vmTrackerProcessInput!.dataSource(processList, '');
            } else {
              this.vmTrackerProcessInput!.dataSource([], '');
            }
          });
        }
        vmTrackerMul!.removeAttribute('readonly');
      } else {
        vmTrackerMul!.setAttribute('readonly', 'readonly');
        return;
      }
    });
    this.disable();
  }

  private unDisable(): void {
    let configVal = this.shadowRoot?.querySelectorAll<HTMLElement>('.config');
    configVal!.forEach((configVal1) => {
      configVal1.removeAttribute('disabled');
    });
  }

  private disable(): void {
    let configVal = this.shadowRoot?.querySelectorAll<HTMLElement>('.config');
    configVal!.forEach((configVal1) => {
      if (configVal1.title !== 'Start VM Tracker Record') {
        configVal1.setAttribute('disabled', '');
      }
    });
  }

  initHtml(): string {
    return SpVmTrackerHtml;
  }
}
