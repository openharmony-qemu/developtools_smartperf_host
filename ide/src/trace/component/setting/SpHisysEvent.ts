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
import { SpRecordTrace } from '../SpRecordTrace';
import { HdcDeviceManager } from '../../../hdc/HdcDeviceManager';
import { LitAllocationSelect } from '../../../base-ui/select/LitAllocationSelect';
import { SpHiSysEventHtml } from './SpHisysEvent.html';

@element('sp-hisys-event')
export class SpHisysEvent extends BaseElement {
  private domainInputEL: LitAllocationSelect | undefined | null;
  private eventNameInputEL: LitAllocationSelect | undefined | null;
  private sysEventConfigList: NodeListOf<LitAllocationSelect> | undefined | null;
  private sysEventSwitch: LitSwitch | undefined | null;
  private domainInputEl: HTMLInputElement | undefined | null;
  private nameInputEl: HTMLInputElement | undefined | null;
  private eventConfig: unknown = {};

  set startSamp(start: boolean) {
    if (start) {
      this.setAttribute('startSamp', '');
      this.domainInputEL!.removeAttribute('readonly');
      this.eventNameInputEL!.removeAttribute('readonly');
    } else {
      this.removeAttribute('startSamp');
      this.domainInputEL!.setAttribute('readonly', 'readonly');
      this.eventNameInputEL!.setAttribute('readonly', 'readonly');
      this.domainInputEL!.value = '';
      this.eventNameInputEL!.value = '';
    }
  }

  get domain(): string {
    if (this.domainInputEL!.value.length > 0 && this.domainInputEL!.value !== 'ALL-Domain') {
      return this.domainInputEL!.value;
    }
    return '';
  }

  get eventName(): string {
    if (this.eventNameInputEL!.value.length > 0 && this.eventNameInputEL!.value !== 'ALL-Event') {
      return this.eventNameInputEL!.value;
    }
    return '';
  }

  get startSamp(): boolean {
    return this.hasAttribute('startSamp');
  }

  get sysEventConfigPath(): string {
    return '/system/etc/hiview/hisysevent.def';
  }

  initElements(): void {
    this.domainInputEL = this.shadowRoot?.querySelector<LitAllocationSelect>('.record-domain-input');
    this.eventNameInputEL = this.shadowRoot?.querySelector<LitAllocationSelect>('.record-event-input');
    this.sysEventConfigList = this.shadowRoot?.querySelectorAll<LitAllocationSelect>('.record-input');
    this.sysEventSwitch = this.shadowRoot?.querySelector('lit-switch') as LitSwitch;
    this.sysEventSwitch?.addEventListener('change', (event: CustomEventInit<LitSwitchChangeEvent>) => {
      let detail = event.detail;
      this.startSamp = detail!.checked;
      this.updateDisable(detail!.checked);
    });
    this.updateDisable(false);
    this.domainInputEl = this.domainInputEL?.shadowRoot?.querySelector('.multipleSelect') as HTMLInputElement;
    this.nameInputEl = this.eventNameInputEL?.shadowRoot?.querySelector('.multipleSelect') as HTMLInputElement;
    this.domainInputEl.addEventListener('valuable', () => {
      this.eventNameInputEL!.value = '';
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.domainInputEl?.addEventListener('mousedown', this.domainInputEvent);
    this.nameInputEl?.addEventListener('mousedown', this.nameInputEvent);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.domainInputEl?.removeEventListener('mousedown', this.domainInputEvent);
    this.nameInputEl?.removeEventListener('mousedown', this.nameInputEvent);
  }

  domainInputEvent = (): void => {
    if (SpRecordTrace.serialNumber === '') {
      this.domainInputEL!.processData = [];
      this.domainInputEL!.initData();
    } else {
      HdcDeviceManager.fileRecv(this.sysEventConfigPath, () => {}).then((pullRes) => {
        pullRes.arrayBuffer().then((buffer) => {
          if (buffer.byteLength > 0) {
            let dec = new TextDecoder();
            this.eventConfig = JSON.parse(dec.decode(buffer));
            let domainList = Object.keys(this.eventConfig!);
            if (domainList.length > 0 && this.startSamp) {
              this.domainInputEl!.setAttribute('readonly', 'readonly');
              domainList.unshift('ALL-Domain');
            }
            this.domainInputEL!.processData = domainList;
            this.domainInputEL!.initData();
          }
        });
      });
    }
  };

  nameInputEvent = (): void => {
    if (SpRecordTrace.serialNumber === '') {
      this.eventNameInputEL!.processData = [];
      this.eventNameInputEL!.initData();
    } else {
      let domain = this.domainInputEL?.value;
      // @ts-ignore
      let eventConfigElement = this.eventConfig[domain];
      if (eventConfigElement) {
        let eventNameList = Object.keys(eventConfigElement);
        if (eventNameList?.length > 0 && this.startSamp) {
          this.nameInputEl!.setAttribute('readonly', 'readonly');
          eventNameList.unshift('ALL-Event');
          this.eventNameInputEL!.processData = eventNameList;
          this.eventNameInputEL!.initData();
        }
      } else {
        let currentData: string[] = [];
        if (domain === '' || domain === 'ALL-Domain') {
          //@ts-ignore
          let domainKey = Object.keys(this.eventConfig);
          domainKey.forEach((item) => {
            //@ts-ignore
            let currentEvent = this.eventConfig[item];
            let eventList = Object.keys(currentEvent);
            currentData.push(...eventList);
          });
          currentData.unshift('ALL-Event');
        }
        this.eventNameInputEL!.processData = currentData;
        this.eventNameInputEL!.initData();
      }
    }
  };

  private updateDisable(isDisable: boolean): void {
    this.sysEventConfigList!.forEach((configEL) => {
      if (isDisable) {
        configEL.removeAttribute('disabled');
      } else {
        configEL.setAttribute('disabled', '');
      }
    });
  }

  initHtml(): string {
    return SpHiSysEventHtml;
  }
}
