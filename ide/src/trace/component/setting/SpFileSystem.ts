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
import { LitSelectV } from '../../../base-ui/select/LitSelectV';
import LitSwitch, { LitSwitchChangeEvent } from '../../../base-ui/switch/lit-switch';
import '../../../base-ui/select/LitSelectV';
import '../../../base-ui/select/LitSelect';

import '../../../base-ui/switch/lit-switch';
import { SpRecordTrace } from '../SpRecordTrace';
import { Cmd } from '../../../command/Cmd';
import { SpApplication } from '../../SpApplication';
import { SpFIleSystemHtml } from './SpFIleSystem.html';

@element('sp-file-system')
export class SpFileSystem extends BaseElement {
  private processInput: LitSelectV | undefined | null;
  private maximum: HTMLInputElement | undefined | null;
  private selectProcess: HTMLInputElement | undefined | null;

  set startRecord(start: boolean) {
    if (start) {
      this.unDisable();
      this.setAttribute('startRecord', '');
      this.selectProcess!.removeAttribute('readonly');
    } else {
      if (!this.startFileSystem && !this.startVirtualMemory && !this.startIo) {
        this.removeAttribute('startRecord');
        this.disable();
        this.selectProcess!.setAttribute('readonly', 'readonly');
      }
    }
  }

  get startRecord(): boolean {
    return this.hasAttribute('startRecord');
  }

  set startFileSystem(start: boolean) {
    if (start) {
      this.setAttribute('startSamp', '');
    } else {
      this.removeAttribute('startSamp');
    }
    this.startRecord = start;
  }

  get startFileSystem(): boolean {
    return this.hasAttribute('startSamp');
  }

  set startVirtualMemory(start: boolean) {
    if (start) {
      this.setAttribute('virtual', '');
    } else {
      this.removeAttribute('virtual');
    }
    this.startRecord = start;
  }

  get startVirtualMemory(): boolean {
    return this.hasAttribute('virtual');
  }

  set startIo(start: boolean) {
    if (start) {
      this.setAttribute('io', '');
    } else {
      this.removeAttribute('io');
    }
    this.startRecord = start;
  }

  get startIo(): boolean {
    return this.hasAttribute('io');
  }

  getSystemConfig(): SystemConfig | undefined {
    let configVal = this.shadowRoot?.querySelectorAll<HTMLElement>('.config');
    let systemConfig: SystemConfig = {
      process: '',
      unWindLevel: 0,
    };
    configVal!.forEach((value) => {
      switch (value.title) {
        case 'Process':
          let processSelect = value as LitSelectV;
          if (processSelect.all) {
            systemConfig.process = 'ALL';
            break;
          }
          if (processSelect.value.length > 0) {
            let result = processSelect.value.match(/\((.+?)\)/g);
            if (result) {
              systemConfig.process = result.toString().replaceAll('(', '').replaceAll(')', '');
            } else {
              systemConfig.process = processSelect.value;
            }
          }
          break;
        case 'Max Unwind Level':
          let maxUnwindLevel = value as HTMLInputElement;
          if (maxUnwindLevel.value !== '') {
            systemConfig.unWindLevel = Number(maxUnwindLevel.value);
          }
      }
    });
    return systemConfig;
  }

  initElements(): void {
    this.switchChange();
    this.processInput = this.shadowRoot?.querySelector<LitSelectV>('lit-select-v');
    this.maximum = this.shadowRoot?.querySelector<HTMLInputElement>('#maxUnwindLevel');
    this.maximum?.addEventListener('keyup', () => {
      this.maximum!.value = this.maximum!.value.replace(/\D/g, '');
      if (this.maximum!.value !== '') {
        let mun = parseInt(this.maximum!.value);
        if (mun > 64 || mun < 0) {
          this.maximum!.value = '10';
        }
      }
    });
    this.selectProcess = this.processInput!.shadowRoot?.querySelector('input') as HTMLInputElement;
    this.selectProcess!.addEventListener('mousedown', () => {
      if (SpRecordTrace.serialNumber === '') {
        this.processInput!.dataSource([], '');
      } else {
        Cmd.getProcess().then((processList) => {
          if (processList.length > 0 && this.startRecord) {
            this.selectProcess!.setAttribute('readonly', 'readonly');
          }
          this.processInput?.dataSource(processList, 'ALL-Process');
        });
      }
    });
    this.disable();
  }

  private switchChange(): void {
    let fileSystemSwitch = this.shadowRoot?.querySelector<LitSwitch>('#fileSystem');
    fileSystemSwitch!.addEventListener('change', (event: CustomEventInit<LitSwitchChangeEvent>) => {
      let detail = event.detail;
      this.startFileSystem = detail!.checked;
    });
    let pageFaultSwitch = this.shadowRoot?.querySelector<LitSwitch>('#pageFault');
    pageFaultSwitch!.addEventListener('change', (event: CustomEventInit<LitSwitchChangeEvent>) => {
      let detail = event.detail;
      this.startVirtualMemory = detail!.checked;
    });
    let bioLatencySwitch = this.shadowRoot?.querySelector<LitSwitch>('#bioLatency');
    bioLatencySwitch!.addEventListener('change', (event: CustomEventInit<LitSwitchChangeEvent>) => {
      let detail = event.detail;
      this.startIo = detail!.checked;
    });
  }

  private unDisable(): void {
    let fileSystemConfigVals = this.shadowRoot?.querySelectorAll<HTMLElement>('.config');
    fileSystemConfigVals!.forEach((fileSystemConfigVal) => {
      fileSystemConfigVal.removeAttribute('disabled');
    });
  }

  private disable(): void {
    let fileSystemConfigVals = this.shadowRoot?.querySelectorAll<HTMLElement>('.config');
    fileSystemConfigVals!.forEach((fileSystemConfigVal) => {
      if (
        fileSystemConfigVal.title === 'Start FileSystem Record' ||
        fileSystemConfigVal.title === 'Start Page Fault Record' ||
        fileSystemConfigVal.title === 'Start BIO Latency Record'
      ) {
      } else {
        fileSystemConfigVal.setAttribute('disabled', '');
      }
    });
  }

  connectedCallback(): void {
    let traceMode = this.shadowRoot!.querySelector('#traceMode') as HTMLDivElement;
    this.maximum!.onkeydown = (ev): void => {
      // @ts-ignore
      if (ev.key === '0' && ev.target.value.length === 1 && ev.target.value === '0') {
        ev.preventDefault();
      }
    };
    let isLongTrace = SpApplication.isLongTrace;
    if (isLongTrace) {
      traceMode!.style.display = 'block';
    } else {
      traceMode!.style.display = 'none';
    }
  }

  initHtml(): string {
    return SpFIleSystemHtml;
  }
}

export interface SystemConfig {
  process: string;
  unWindLevel: number;
}
