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
import { SpFFRTConfigHtml } from './SpFFRTConfig.html';
import { log } from '../../../log/Log';
import { NUM_16384, NUM_5 } from '../../bean/NumBean';
import { LitSelectV } from '../../../base-ui/select/LitSelectV';
import LitSwitch from '../../../base-ui/switch/lit-switch';
import { LitSelect } from '../../../base-ui/select/LitSelect';
import { Cmd } from '../../../command/Cmd';
import { SpRecordTrace } from '../SpRecordTrace';

@element('sp-record-ffrt')
export class SpFFRTConfig extends BaseElement {
  private processIdEl: LitSelectV | undefined;
  private processIdInputEl: HTMLInputElement | undefined;
  private startupProcessNameEl: LitSelectV | undefined;
  private restartProcessNameEl: LitSelectV | undefined;
  private restartProcessNameInputEl: HTMLInputElement | undefined;
  private useBlockSwitchEl: LitSwitch | undefined;
  private smbPagesInputEl: HTMLInputElement | undefined;
  private flushIntervalInputEl: HTMLInputElement | undefined;
  private clockTypeSelectEl: LitSelect | undefined;
  private selectProcessNameList: Array<string> = [];

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

  get processList(): string {
    return this.processIdEl!.value || '';
  }

  get processIds(): number[] {
    let allPidList: number[] = [];
    if (this.processIdEl!.value.trim() !== '') {
      let result = this.processIdEl?.value.match(/\((.+?)\)/g);
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

  get processNames(): string[] {
    let allPNameList: string[] = [];
    if (this.processIdEl!.value.trim() !== '') {
      let result = this.processIdEl?.value.replace(/[$(\d+)$]/g, '');
      if (result) {
        allPNameList = result.split(',');
      }
    }
    if (this.restartProcessNameEl!.value.trim() !== '') {
      let result = this.restartProcessNameEl?.value.replace(/[$(\d+)$]/g, '');
      if (result) {
        allPNameList.push(...result.split(','));
      }
    }
    return allPNameList;
  }

  get startupProcessNames(): string[] {
    let allPNameList: string[] = [];
    if (this.startupProcessNameEl!.value.trim() !== '') {
      allPNameList = this.startupProcessNameEl!.value.trim().split(',');
      if (allPNameList.length === 0) {
        allPNameList = this.startupProcessNameEl!.value.trim().split(';');
      }
    }
    return allPNameList;
  }

  get restartProcessNames(): string[] {
    let allPNameList: string[] = [];
    if (this.restartProcessNameEl!.value.trim() !== '') {
      let result = this.restartProcessNameEl?.value.replace(/[$(\d+)$]/g, '');
      if (result) {
        allPNameList = result.split(',');
      }
    }
    return allPNameList;
  }

  get useBlock(): boolean {
    let value = this.useBlockSwitchEl?.checked;
    if (value !== undefined) {
      return value;
    }
    return true;
  }

  get smbPages(): number {
    let value = this.smbPagesInputEl?.value || '';
    log(`smbPages value is :${value}`);
    if (value !== '') {
      return Number(this.smbPagesInputEl?.value) || NUM_16384;
    }
    return NUM_16384;
  }

  get flushInterval(): number {
    let value = this.flushIntervalInputEl?.value || '';
    log(`flushInterval value is :${value}`);
    if (value !== '') {
      return Number(this.flushIntervalInputEl?.value) || NUM_5;
    }
    return NUM_5;
  }

  get clockType(): string {
    return this.clockTypeSelectEl?.value || 'BOOTTIME';
  }

  initElements(): void {
    this.processIdEl = this.shadowRoot?.getElementById('process-ids') as LitSelectV;
    this.startupProcessNameEl = this.shadowRoot?.getElementById('startup-process-names') as LitSelectV;
    this.restartProcessNameEl = this.shadowRoot?.getElementById('restart-process-names') as LitSelectV;
    this.useBlockSwitchEl = this.shadowRoot?.getElementById('use_block_switch') as LitSwitch;
    this.smbPagesInputEl = this.shadowRoot?.getElementById('smb-pages') as HTMLInputElement;
    this.flushIntervalInputEl = this.shadowRoot?.getElementById('flush-interval') as HTMLInputElement;
    this.clockTypeSelectEl = this.shadowRoot?.getElementById('clock-type') as LitSelect;
    this.processIdInputEl = this.processIdEl!.shadowRoot?.querySelector('input') as HTMLInputElement;
    this.restartProcessNameInputEl = this.restartProcessNameEl!.shadowRoot?.querySelector('input') as HTMLInputElement;
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
    let packageInput = this.startupProcessNameEl!.shadowRoot?.querySelector('input') as HTMLInputElement;
    packageInput.addEventListener('mousedown', (): void => {
      this.startupProcessMouseDownHandler(this.startupProcessNameEl, packageInput);
    });
    packageInput.value = '';
    this.disable();
  }

  initHtml(): string {
    return SpFFRTConfigHtml;
  }

  connectedCallback(): void {
    this.processIdInputEl?.addEventListener('mousedown', this.processMouseDownHandler);
    this.restartProcessNameInputEl?.addEventListener('mousedown', this.restartProcessMouseDownHandler);
    this.smbPagesInputEl?.addEventListener('keydown', this.handleInputChangeEvent);
    this.flushIntervalInputEl?.addEventListener('keydown', this.handleInputChangeEvent);
  }

  disconnectedCallback(): void {
    this.processIdInputEl?.removeEventListener('mousedown', this.processMouseDownHandler);
    this.restartProcessNameInputEl?.removeEventListener('mousedown', this.restartProcessMouseDownHandler);
    this.smbPagesInputEl?.removeEventListener('keydown', this.handleInputChangeEvent);
    this.flushIntervalInputEl?.removeEventListener('keydown', this.handleInputChangeEvent);
  }

  processMouseDownHandler = (): void => {
    this.setData(this.processIdEl);
  };

  startupProcessMouseDownHandler(startupPNameEl: LitSelectV | undefined, packageInput: HTMLInputElement): void {
    if (!startupPNameEl) {
      return;
    }
    let processInputEl = startupPNameEl.shadowRoot?.querySelector('input') as HTMLInputElement;
    if (this.startSamp) {
      Cmd.getPackage().then((packageList: string[]): void => {
        let finalDataList = packageList.map(str => str.replace(/\t/g, ''));
        if (finalDataList.length > 0) {
          processInputEl.readOnly = true;
          startupPNameEl.dataSource(finalDataList, 'ALL-Process');
        } else {
          startupPNameEl.dataSource([], '');
        }
      });
      processInputEl.readOnly = false;
    } else {
      processInputEl.readOnly = true;
      return;
    }
    if (this.startSamp && (SpRecordTrace.serialNumber === '')) {
      startupPNameEl.dataSource([], '');
    }
  };

  restartProcessMouseDownHandler = (): void => {
    this.setData(this.restartProcessNameEl);
  };

  handleInputChangeEvent = (ev: KeyboardEvent): void => {
    // @ts-ignore
    if (ev.key === '0' && ev.target.value.length === 1 && ev.target.value === '0') {
      ev.preventDefault();
    }
  };

  private unDisable(): void {
    this.startSamp = true;
    if (this.useBlockSwitchEl) {
      this.useBlockSwitchEl.disabled = false;
    }
    this.processIdEl!.removeAttribute('disabled');
    this.startupProcessNameEl!.removeAttribute('disabled');
    this.restartProcessNameEl!.removeAttribute('disabled');
    this.clockTypeSelectEl!.removeAttribute('disabled');
    let inputBoxes = this.shadowRoot?.querySelectorAll<HTMLInputElement>('.input-content');
    inputBoxes!.forEach((item: HTMLInputElement): void => {
      item.disabled = false;
    });
  }

  private disable(): void {
    this.startSamp = false;
    if (this.useBlockSwitchEl) {
      this.useBlockSwitchEl.disabled = true;
    }
    this.processIdEl!.setAttribute('disabled', '');
    this.startupProcessNameEl!.setAttribute('disabled', '');
    this.restartProcessNameEl!.setAttribute('disabled', '');
    this.clockTypeSelectEl!.setAttribute('disabled', '');
    let inputBoxes = this.shadowRoot?.querySelectorAll<HTMLInputElement>('.input-content');
    inputBoxes!.forEach((item: HTMLInputElement): void => {
      item.disabled = true;
    });
  }

  private setData(selectInputEl: LitSelectV | undefined): void {
    if (!selectInputEl) {
      return;
    }
    let processInputEl = selectInputEl.shadowRoot?.querySelector('input') as HTMLInputElement;
    if (this.startSamp) {
      Cmd.getProcess().then((processList: string[]): void => {
        selectInputEl.dataSource(processList, '');
        if (processList.length > 0) {
          processInputEl.readOnly = true;
          selectInputEl.dataSource(processList, 'ALL-Process');
        } else {
          selectInputEl.dataSource([], '');
        }
      });
      processInputEl.readOnly = false;
    } else {
      processInputEl.readOnly = true;
      return;
    }
    if (this.startSamp && (SpRecordTrace.serialNumber === '')) {
      selectInputEl.dataSource([], '');
    }
  }
}
