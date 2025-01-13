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
import { LitSelect } from '../../../base-ui/select/LitSelect';
import { LitSlider } from '../../../base-ui/slider/LitSlider';
import LitSwitch, { LitSwitchChangeEvent } from '../../../base-ui/switch/lit-switch';
import '../../../base-ui/select/LitSelectV';
import '../../../base-ui/select/LitSelect';

import '../../../base-ui/switch/lit-switch';
import { info } from '../../../log/Log';
import { HdcDeviceManager } from '../../../hdc/HdcDeviceManager';
import { SpRecordTrace } from '../SpRecordTrace';
import { SpApplication } from '../../SpApplication';
import { LitSearch } from '../trace/search/Search';
import { Cmd } from '../../../command/Cmd';
import { CmdConstant } from '../../../command/CmdConstant';
import { SpRecordPerfHtml } from './SpRecordPerf.html';
import { WebSocketManager } from '../../../webSocket/WebSocketManager';
import { TypeConstants } from '../../../webSocket/Constants';

@element('sp-record-perf')
export class SpRecordPerf extends BaseElement {
  private addOptionButton: HTMLButtonElement | undefined | null;
  private processSelect: LitSelectV | undefined | null;
  private processInput: HTMLInputElement | undefined | null;
  private cpuSelect: LitSelectV | undefined | null;
  private eventSelect: LitSelectV | undefined | null;

  private frequencySetInput: HTMLInputElement | undefined | null;
  private recordProcessInput: HTMLInputElement | undefined | null;
  private offCPUSwitch: LitSwitch | undefined | null;
  private kernelChainSwitch: LitSwitch | undefined | null;
  private callSelect: LitSelect | undefined | null;
  private sp: SpApplication | undefined;
  private recordPerfSearch: LitSearch | undefined;
  private inputCpu: HTMLInputElement | undefined;
  private inputEvent: HTMLInputElement | undefined;
  private cpuData: Array<string> = [];
  private eventData: Array<string> = [];

  get show(): boolean {
    return this.hasAttribute('show');
  }

  set show(perfShow: boolean) {
    if (perfShow) {
      this.setAttribute('show', '');
    } else {
      this.removeAttribute('show');
    }
  }

  set startSamp(perfStart: boolean) {
    if (perfStart) {
      this.setAttribute('startSamp', '');
      this.recordProcessInput!.removeAttribute('readonly');
    } else {
      this.removeAttribute('startSamp');
      this.recordProcessInput!.setAttribute('readonly', 'readonly');
    }
  }

  get startSamp(): boolean {
    return this.hasAttribute('startSamp');
  }

  getPerfConfig(): PerfConfig | undefined {
    let recordPerfConfigVal = this.shadowRoot?.querySelectorAll<HTMLElement>('.config');
    let perfConfig: PerfConfig = {
      process: 'ALL',
      cpu: 'select ALL',
      eventList: 'NONE',
      cpuPercent: 100,
      frequency: 1000,
      period: 1,
      isOffCpu: true,
      noInherit: false,
      isKernelChain: true,
      callStack: 'dwarf',
      branch: 'none',
      mmap: 256,
      clockType: 'monotonic',
    };
    recordPerfConfigVal!.forEach((value) => {
      perfConfig = this.getPerfConfigData(value, perfConfig);
    });
    info('perfConfig  is : ', perfConfig);
    return perfConfig;
  }

  private getPerfConfigData(value: HTMLElement, perfConfig: PerfConfig): PerfConfig {
    switch (value.title) {
      case 'Process':
        let processSelect = value as LitSelectV;
        if (processSelect.all) {
          perfConfig.process = 'ALL';
          break;
        }
        perfConfig = this.perfConfigByProcess(processSelect, perfConfig);
        break;
      case 'CPU':
        perfConfig = this.perfConfigByCPU(perfConfig, value as LitSelectV);
        break;
      case 'Event List':
        perfConfig = this.perfConfigByEventList(perfConfig, value as LitSelectV);
        break;
      case 'CPU Percent':
        perfConfig = this.perfConfigCpuPercent(perfConfig, value.parentElement!);
        break;
      case 'Frequency':
        perfConfig = this.perfConfigByFrequency(perfConfig, value as HTMLInputElement);
        break;
      case 'Period':
        perfConfig = this.perfConfigByPeriod(perfConfig, value as HTMLInputElement);
        break;
      case 'Off CPU':
        perfConfig.isOffCpu = (value as LitSwitch).checked;
        break;
      case 'Kernel Chain':
        perfConfig.isKernelChain = (value as LitSwitch).checked;
        break;
      case 'No Inherit':
        perfConfig.noInherit = (value as LitSwitch).checked;
        break;
      case 'Call Stack':
        perfConfig = this.perfConfigByCallStack(perfConfig, value as LitSelect);
        break;
      case 'Branch':
        perfConfig = this.perfConfigByBranch(perfConfig, value as LitSelect);
        break;
      case 'Mmap Pages':
        perfConfig = this.perfConfigByMmapPages(perfConfig, value.parentElement!);
        break;
      case 'Clock Type':
        perfConfig = this.perfConfigByClockType(perfConfig, value as LitSelect);
        break;
    }
    return perfConfig;
  }

  private perfConfigByProcess(processSelect: LitSelectV, perfConfig: PerfConfig): PerfConfig {
    if (processSelect.value.length > 0) {
      let result = processSelect.value.match(/\((.+?)\)/g);
      if (result) {
        perfConfig.process = result.toString().replace(/[()]/g, '');
      } else {
        perfConfig.process = processSelect.value;
      }
    }
    return perfConfig;
  }

  private perfConfigByCPU(perfConfig: PerfConfig, selectValue: LitSelectV): PerfConfig {
    if (selectValue.value.length > 0) {
      perfConfig.cpu = selectValue.value;
    }
    return perfConfig;
  }

  private perfConfigByEventList(perfConfig: PerfConfig, selectValue: LitSelectV): PerfConfig {
    if (selectValue.value.length > 0) {
      perfConfig.eventList = selectValue.value.replace(/\s/g, ',');
    }
    return perfConfig;
  }

  private perfConfigCpuPercent(perfConfig: PerfConfig, parEle: HTMLElement): PerfConfig {
    if (parEle!.hasAttribute('percent')) {
      let percent = parEle!.getAttribute('percent');
      perfConfig.cpuPercent = Number(percent);
    }
    return perfConfig;
  }

  private perfConfigByFrequency(perfConfig: PerfConfig, elValue: HTMLInputElement): PerfConfig {
    if (elValue.value !== '') {
      perfConfig.frequency = Number(elValue.value);
    }
    return perfConfig;
  }

  private perfConfigByPeriod(perfConfig: PerfConfig, elValue: HTMLInputElement): PerfConfig {
    if (elValue.value !== '') {
      perfConfig.period = Number(elValue.value);
    }
    return perfConfig;
  }

  private perfConfigByCallStack(perfConfig: PerfConfig, callStack: LitSelect): PerfConfig {
    if (callStack.value !== '') {
      perfConfig.callStack = callStack.value;
    }
    return perfConfig;
  }

  private perfConfigByBranch(perfConfig: PerfConfig, branch: LitSelect): PerfConfig {
    if (branch.value !== '') {
      perfConfig.branch = branch.value;
    }
    return perfConfig;
  }

  private perfConfigByMmapPages(perfConfig: PerfConfig, parent: HTMLElement): PerfConfig {
    if (parent!.hasAttribute('percent')) {
      let pagesPercent = parent!.getAttribute('percent');
      perfConfig.mmap = Math.pow(2, Number(pagesPercent));
    }
    return perfConfig;
  }

  private perfConfigByClockType(perfConfig: PerfConfig, clock: LitSelect): PerfConfig {
    if (clock.value !== '') {
      perfConfig.clockType = clock.value;
    }
    return perfConfig;
  }

  private initRecordPerfConfig(): void {
    let recordPerfConfigList = this.shadowRoot?.querySelector<HTMLDivElement>('.configList');
    this.addOptionButton = this.shadowRoot?.querySelector<HTMLButtonElement>('#addOptions');
    perfConfigList.forEach((config) => {
      let recordPerfDiv = document.createElement('div');
      if (config.hidden) {
        recordPerfDiv.className = 'record-perf-config-div hidden';
      } else {
        recordPerfDiv.className = 'record-perf-config-div';
      }
      let recordPerfHeadDiv = document.createElement('div');
      recordPerfDiv.appendChild(recordPerfHeadDiv);
      let recordPerfTitle = document.createElement('span');
      recordPerfTitle.className = 'record-perf-title';
      recordPerfTitle.textContent = config.title;
      recordPerfHeadDiv.appendChild(recordPerfTitle);
      let recordPerfDes = document.createElement('span');
      recordPerfDes.textContent = config.des;
      recordPerfDes.className = 'record-perf-des';
      recordPerfHeadDiv.appendChild(recordPerfDes);
      switch (config.type) {
        case 'select-multiple':
          this.configTypeBySelectMultiple(config, recordPerfDiv);
          break;
        case 'lit-slider':
          this.configTypeByLitSlider(config, recordPerfDiv);
          break;
        case 'Mmap-lit-slider':
          this.configTypeByMmapLitSlider(config, recordPerfDiv);
          break;
        case 'input':
          this.configTypeByInput(config, recordPerfDiv);
          break;
        case 'select':
          this.configTypeBySelect(config, recordPerfDiv);
          break;
        case 'switch':
          this.configTypeBySwitch(config, recordPerfHeadDiv);
          break;
        default:
          break;
      }
      recordPerfConfigList!.appendChild(recordPerfDiv);
    });
  }

  processSelectMousedownHandler = (): void => {
    if (SpRecordTrace.serialNumber === '') {
      this.processSelect!.dataSource([], 'ALL-Process');
    } else {
      if (this.sp!.search) {
        this.sp!.search = false;
        this.recordPerfSearch!.clear();
      }
      Cmd.getProcess().then(
        (processList) => {
          this.processSelect?.dataSource(processList, 'ALL-Process');
        },
        () => {
          this.sp!.search = true;
          this.recordPerfSearch!.clear();
          this.recordPerfSearch!.setPercent('please kill other hdc-server !', -2);
        }
      );
    }
  };

  cpuSelectMouseDownHandler = (): void => {
    if (SpRecordTrace.serialNumber === '') {
      this.cpuSelect!.dataSource([], 'ALL-CPU');
    }
  };

  cpuSelectMouseUpHandler = (): void => {
    if (SpRecordTrace.serialNumber === '') {
      this.cpuSelect?.dataSource([], '');
    } else {
      if (this.sp!.search) {
        this.sp!.search = false;
        this.recordPerfSearch!.clear();
      }

      if (SpRecordTrace.isVscode) {
        let cmd = Cmd.formatString(CmdConstant.CMD_GET_CPU_COUNT_DEVICES, [SpRecordTrace.serialNumber]);
        Cmd.execHdcCmd(cmd, (res: string) => {
          this.cpuData = [];
          let cpuCount = res!.trim();
          let cpus = Number(cpuCount);
          for (let index = 0; index < cpus; index++) {
            this.cpuData.push(String(index));
          }
          this.cpuSelect?.dataSource(this.cpuData, 'ALL-CPU');
        });
      } else if (SpRecordTrace.useExtend) {
        WebSocketManager.getInstance()!.sendMessage(
          TypeConstants.USB_TYPE, 
          TypeConstants.USB_GET_CPU_COUNT, 
          new TextEncoder().encode(SpRecordTrace.serialNumber));
        setTimeout(() => {
          if (SpRecordTrace.usbGetCpuCount) {
            let cpuCount = SpRecordTrace.usbGetCpuCount!.trim();
            let cpus = Number(cpuCount);
            for (let index = 0; index < cpus; index++) {
              this.cpuData.push(String(index));
            }
            this.cpuSelect?.dataSource(this.cpuData, 'ALL-CPU');
          }
        }, 1000);
      } else {
        HdcDeviceManager.connect(SpRecordTrace.serialNumber).then((conn) => {
          this.cpuData = [];
          if (conn) {
            HdcDeviceManager.shellResultAsString(CmdConstant.CMD_GET_CPU_COUNT, false).then((res) => {
              let cpuCount = res!.trim();
              let cpus = Number(cpuCount);
              for (let index = 0; index < cpus; index++) {
                this.cpuData.push(String(index));
              }
              this.cpuSelect?.dataSource(this.cpuData, 'ALL-CPU');
            });
          } else {
            this.recordPerfSearch!.clear();
            this.sp!.search = true;
            this.recordPerfSearch!.setPercent('please kill other hdc-server !', -2);
          }
        });
      }
    }
  };

  eventSelectMousedownHandler = (): void => {
    if (SpRecordTrace.serialNumber === '') {
      this.eventSelect!.dataSource([], '');
    }
  };

  eventSelectClickHandler = (): void => {
    if (SpRecordTrace.serialNumber === '') {
      this.eventSelect?.dataSource(eventSelect, '');
    } else {
      if (this.sp!.search) {
        this.sp!.search = false;
        this.recordPerfSearch!.clear();
      }
      if (SpRecordTrace.isVscode) {
        let cmd = Cmd.formatString(CmdConstant.CMD_GET_HIPERF_EVENTS_DEVICES, [SpRecordTrace.serialNumber]);
        Cmd.execHdcCmd(cmd, (res: string) => {
          let eventMap = this.parseEvent(res);
          let eventList = this.getSoftHardWareEvents(eventMap);
          if (eventList) {
            for (let eventListElement of eventList) {
              this.eventData.push(eventListElement.trim());
            }
          }
          this.eventSelect!.dataSource(this.eventData, '');
        });
      } else if (SpRecordTrace.useExtend) {
        WebSocketManager.getInstance()!.sendMessage(TypeConstants.USB_TYPE, TypeConstants.USB_GET_EVENT, new TextEncoder().encode(SpRecordTrace.serialNumber));
        setTimeout(() => {
          if (SpRecordTrace.usbGetEvent) {
            let eventMap = this.parseEvent(SpRecordTrace.usbGetEvent);
            let eventList = this.getSoftHardWareEvents(eventMap);
            if (eventList) {
              for (let eventListElement of eventList) {
                this.eventData.push(eventListElement.trim());
              }
            }
            this.eventSelect!.dataSource(this.eventData, '');
          }
        }, 1000);
      } else {
        HdcDeviceManager.connect(SpRecordTrace.serialNumber).then((conn) => {
          this.eventData = [];
          if (SpRecordTrace.allProcessListStr) {
            // @ts-ignore
            if (SpRecordTrace.allProcessListStr.event) {
              // @ts-ignore
              let eventMap = this.parseEvent(SpRecordTrace.allProcessListStr.event);
              let eventList = this.getSoftHardWareEvents(eventMap);
              if (eventList) {
                for (let eventListElement of eventList) {
                  this.eventData.push(eventListElement.trim());
                }
              }
              this.eventSelect!.dataSource(this.eventData, '');
            }
          } else {
            if (conn) {
              HdcDeviceManager.shellResultAsString(CmdConstant.CMD_GET_HIPERF_EVENTS, false).then((res) => {
                if (res) {
                  let eventMap = this.parseEvent(res);
                  let eventList = this.getSoftHardWareEvents(eventMap);
                  if (eventList) {
                    for (let eventListElement of eventList) {
                      this.eventData.push(eventListElement.trim());
                    }
                  }
                  this.eventSelect!.dataSource(this.eventData, '');
                }
              });
            } else {
              this.sp!.search = true;
              this.recordPerfSearch!.clear();
              this.recordPerfSearch!.setPercent('please kill other hdc-server !', -2);
            }
          }
        });
      }
    }
  };

  initElements(): void {
    this.cpuData = [];
    this.eventData = [];
    this.initRecordPerfConfig();
    this.sp = document.querySelector('sp-application') as SpApplication;
    this.recordPerfSearch = this.sp?.shadowRoot?.querySelector('#lit-record-search') as LitSearch;
    this.processSelect = this.shadowRoot?.querySelector<LitSelectV>("lit-select-v[title='Process']");
    this.recordProcessInput = this.processSelect?.shadowRoot?.querySelector<HTMLInputElement>('input');
    this.processInput = this.processSelect!.shadowRoot?.querySelector('input') as HTMLInputElement;
    this.cpuSelect = this.shadowRoot?.querySelector<LitSelectV>("lit-select-v[title='CPU']");
    this.inputCpu = this.cpuSelect!.shadowRoot?.querySelector('input') as HTMLInputElement;
    this.eventSelect = this.shadowRoot?.querySelector<LitSelectV>("lit-select-v[title='Event List']");
    this.inputEvent = this.eventSelect!.shadowRoot?.querySelector('input') as HTMLInputElement;
    this.frequencySetInput = this.shadowRoot?.querySelector<HTMLInputElement>("input[title='Frequency']");
    this.frequencySetInput!.onkeydown = (ev): void => {
      // @ts-ignore
      if (ev.key === '0' && ev.target.value.length === 1 && ev.target.value === '0') {
        ev.preventDefault();
      }
    };
    this.offCPUSwitch = this.shadowRoot?.querySelector<LitSwitch>("lit-switch[title='Off CPU']");
    this.kernelChainSwitch = this.shadowRoot?.querySelector<LitSwitch>("lit-switch[title='Kernel Chain']");
    this.callSelect = this.shadowRoot?.querySelector<LitSelect>("lit-select[title='Call Stack']");
    this.addOptionButton!.addEventListener('click', () => {
      if (!this.startSamp) {
        return;
      }
      this.addOptionButton!.style.display = 'none';
      this.show = true;
    });
    this.disable();
  }

  private configTypeBySwitch(config: unknown, recordPerfHeadDiv: HTMLDivElement): void {
    let recordPerfSwitch = document.createElement('lit-switch') as LitSwitch;
    recordPerfSwitch.className = 'config';
    //@ts-ignore
    recordPerfSwitch.title = config.title;
    //@ts-ignore
    recordPerfSwitch.checked = !!config.value;
    //@ts-ignore
    if (config.title === 'Start Hiperf Sampling') {
      recordPerfSwitch.addEventListener('change', (event: CustomEventInit<LitSwitchChangeEvent>) => {
        let detail = event.detail;
        if (detail!.checked) {
          this.startSamp = true;
          this.unDisable();
          this.dispatchEvent(new CustomEvent('addProbe', {}));
        } else {
          this.startSamp = false;
          this.addOptionButton!.style.display = 'unset';
          this.disable();
          this.show = false;
        }
      });
    }
    recordPerfHeadDiv.appendChild(recordPerfSwitch);
  }

  private configTypeBySelect(config: unknown, recordPerfDiv: HTMLDivElement): void {
    let recordPerfSelect = '';
    recordPerfSelect += `<lit-select rounded="" default-value="" class="record-perf-select config" 
placement="bottom" title="${
      //@ts-ignore
      config.title
      }"  placeholder="${
      //@ts-ignore
      config.selectArray[0]
      }">`;
    //@ts-ignore
    config.selectArray.forEach((value: string) => {
      recordPerfSelect += `<lit-select-option value="${value}">${value}</lit-select-option>`;
    });
    recordPerfSelect += '</lit-select>';
    recordPerfDiv.innerHTML = recordPerfDiv.innerHTML + recordPerfSelect;
  }

  private configTypeByInput(config: unknown, recordPerfDiv: HTMLDivElement): void {
    let recordPerfInput = document.createElement('input');
    recordPerfInput.className = 'record-perf-input config';
    //@ts-ignore
    recordPerfInput.textContent = config.value;
    //@ts-ignore
    recordPerfInput.value = config.value;
    //@ts-ignore
    recordPerfInput.title = config.title;
    recordPerfInput.oninput = (): void => {
      recordPerfInput.value = recordPerfInput.value.replace(/\D/g, '');
    };
    recordPerfDiv.appendChild(recordPerfInput);
  }

  private configTypeByMmapLitSlider(config: unknown, recordPerfDiv: HTMLDivElement): void {
    //@ts-ignore
    let defaultValue = Math.pow(2, config.litSliderStyle.defaultValue);
    let mapsilder = `
<div class="sliderBody"><lit-slider defaultColor="var(--dark-color3,#46B1E3)" open dir="right" 
class="silderclass config" title="${
      //@ts-ignore
      config.title
      }"></lit-slider><input readonly class="sliderInput" 
type="text" value = '    ${defaultValue} ${
      //@ts-ignore
      config.litSliderStyle.resultUnit
      }' ></div>`;
    recordPerfDiv.innerHTML = recordPerfDiv.innerHTML + mapsilder;
    let maplitSlider = recordPerfDiv.querySelector<LitSlider>('.silderclass');
    //@ts-ignore
    maplitSlider!.percent = config.litSliderStyle.defaultValue;
    let mapsliderBody = recordPerfDiv.querySelector<HTMLDivElement>('.sliderBody');
    let mapbufferInput = recordPerfDiv?.querySelector('.sliderInput') as HTMLInputElement;
    maplitSlider!.addEventListener('input', () => {
      let percnet = mapsliderBody!.getAttribute('percent');
      if (percnet !== null) {
        //@ts-ignore
        mapbufferInput.value = Math.pow(2, Number(percnet)) + config.litSliderStyle.resultUnit;
      }
    });
    //@ts-ignore
    maplitSlider!.sliderStyle = config.litSliderStyle;
  }

  private configTypeByLitSlider(config: unknown, recordPerfDiv: HTMLDivElement): void {
    let sliderEl = `
<div class="sliderBody"><lit-slider defaultColor="var(--dark-color3,#46B1E3)" open dir="right" 
class="silderclass config" title="${
      //@ts-ignore
      config.title
      }"></lit-slider><input readonly class="sliderInput" 
type="text" value = '    ${
      //@ts-ignore
      config.litSliderStyle.defaultValue
      } ${
      //@ts-ignore
      config.litSliderStyle.resultUnit
      }' >
</div>`;
    recordPerfDiv.innerHTML = recordPerfDiv.innerHTML + sliderEl;
    let litSlider = recordPerfDiv.querySelector<LitSlider>('.silderclass');
    //@ts-ignore
    litSlider!.percent = config.litSliderStyle.defaultValue;
    let sliderBody = recordPerfDiv.querySelector<HTMLDivElement>('.sliderBody');
    let bufferInput = recordPerfDiv?.querySelector('.sliderInput') as HTMLInputElement;
    litSlider!.addEventListener('input', () => {
      //@ts-ignore
      bufferInput.value = sliderBody!.getAttribute('percent') + config.litSliderStyle.resultUnit;
    });
    //@ts-ignore
    litSlider!.sliderStyle = config.litSliderStyle;
  }

  private configTypeBySelectMultiple(config: unknown, recordPerfDiv: HTMLDivElement): void {
    let html = '';
    //@ts-ignore
    let placeholder = config.selectArray[0];
    //@ts-ignore
    if (config.title === 'Event List') {
      placeholder = 'NONE';
    }
    html += `<lit-select-v default-value="" rounded="" class="record-perf-select config" 
mode="multiple" canInsert="" title="${
      //@ts-ignore
      config.title
      }" rounded placement = "bottom" placeholder="${placeholder}">`;
    //@ts-ignore
    config.selectArray.forEach((value: string) => {
      html += `<lit-select-option value="${value}">${value}</lit-select-option>`;
    });
    html += '</lit-select-v>';
    recordPerfDiv.innerHTML = recordPerfDiv.innerHTML + html;
  }

  getSoftHardWareEvents(eventListResult: Map<string, string[]>): string[] {
    let shEvents = [];
    let hardwareEvents = eventListResult.get('hardware');
    if (hardwareEvents) {
      for (let hardwareEvent of hardwareEvents) {
        shEvents.push(hardwareEvent);
      }
    }
    let softwareEvents = eventListResult.get('software');
    if (softwareEvents) {
      for (let softwareEvent of softwareEvents) {
        shEvents.push(softwareEvent);
      }
    }
    return shEvents;
  }

  parseEvent(eventListResult: string): Map<string, Array<string>> {
    let eventMap: Map<string, Array<string>> = new Map<string, Array<string>>();
    let events: Array<string> = [];
    let type: string = '';
    let lineValues: string[] = eventListResult.replace(/\r\n/g, '\r').replace(/\n/g, '\r').split(/\r/);
    for (let line of lineValues) {
      if (line.startsWith('Supported')) {
        let startSign: string = 'for';
        type = line.substring(line.indexOf(startSign) + startSign.length, line.lastIndexOf(':')).trim();
        events = [];
        eventMap.set(type, events);
      } else if (
        line.indexOf('not support') !== -1 ||
        line.trim().length === 0 ||
        line.indexOf('Text file busy') !== -1
      ) {
        // do not need deal with it
      } else {
        let event: string = line.split(' ')[0];
        let ventMap = eventMap.get(type);
        if (ventMap !== null) {
          ventMap!.push(event);
        }
      }
    }
    return eventMap;
  }

  private unDisable(): void {
    if (this.processSelect) {
      this.processSelect.removeAttribute('disabled');
    }
    if (this.frequencySetInput) {
      this.frequencySetInput!.disabled = false;
    }
    if (this.offCPUSwitch) {
      this.offCPUSwitch!.disabled = false;
    }
    if (this.kernelChainSwitch) {
      this.kernelChainSwitch!.disabled = false;
    }
    if (this.callSelect) {
      this.callSelect!.removeAttribute('disabled');
    }
    if (this.addOptionButton) {
      this.addOptionButton.disabled = false;
    }
  }

  private disable(): void {
    if (this.processSelect) {
      this.processSelect.setAttribute('disabled', '');
    }
    if (this.frequencySetInput) {
      this.frequencySetInput!.disabled = true;
    }
    if (this.offCPUSwitch) {
      this.offCPUSwitch!.disabled = true;
    }
    if (this.kernelChainSwitch) {
      this.kernelChainSwitch!.disabled = true;
    }
    if (this.callSelect) {
      this.callSelect!.setAttribute('disabled', '');
    }
    if (this.addOptionButton) {
      this.addOptionButton.disabled = true;
    }
  }

  connectedCallback(): void {
    let traceMode = this.shadowRoot!.querySelector('#traceMode') as HTMLDivElement;
    let isLongTrace = SpApplication.isLongTrace;
    if (isLongTrace) {
      traceMode!.style.display = 'block';
    } else {
      traceMode!.style.display = 'none';
    }
    this.processInput?.addEventListener('mousedown', this.processSelectMousedownHandler);
    this.inputCpu?.addEventListener('mousedown', this.cpuSelectMouseDownHandler);
    this.inputCpu?.addEventListener('mouseup', this.cpuSelectMouseUpHandler);
    this.inputEvent?.addEventListener('mousedown', this.eventSelectMousedownHandler);
    this.inputEvent?.addEventListener('click', this.eventSelectClickHandler);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.processInput?.removeEventListener('mousedown', this.processSelectMousedownHandler);
    this.inputCpu?.removeEventListener('mousedown', this.cpuSelectMouseDownHandler);
    this.inputCpu?.removeEventListener('mouseup', this.cpuSelectMouseUpHandler);
    this.inputEvent?.removeEventListener('mousedown', this.eventSelectMousedownHandler);
    this.inputEvent?.removeEventListener('click', this.eventSelectClickHandler);
  }

  initHtml(): string {
    return SpRecordPerfHtml;
  }
}

export interface PerfConfig {
  process: string;
  cpu: string;
  eventList: string;
  cpuPercent: number;
  frequency: number;
  period: number;
  isOffCpu: boolean;
  noInherit: boolean;
  callStack: string;
  branch: string;
  mmap: number;
  clockType: string;
  isKernelChain: boolean;
}

const eventSelect = [
  'hw-cpu-cycles',
  'hw-instructions',
  'hw-cache-references',
  'hw-cache-misses',
  'hw-branch-instructions',
  'hw-branch-misses',
  'hw-bus-cycles',
  'hw-stalled-cycles-backend',
  'hw-stalled-cycles-frontend',
  'sw-cpu-clock',
  'sw-task-clock',
  'sw-page-faults',
  'sw-context-switches',
  'sw-cpu-migrations',
  'sw-page-faults-min',
  'sw-page-faults-maj',
  'sw-alignment-faults',
  'sw-emulation-faults',
  'sw-dummy',
  'sw-bpf-output',
];

const perfConfigList = [
  {
    title: 'Start Hiperf Sampling',
    des: '',
    hidden: false,
    type: 'switch',
    value: false,
  },
  {
    type: 'select-multiple',
    title: 'Process',
    des: 'Record process',
    hidden: false,
    selectArray: [''],
  },
  {
    title: 'CPU',
    des: 'Record assign cpu num such as 0,1,2',
    hidden: true,
    type: 'select-multiple',
    selectArray: [''],
  },
  {
    title: 'Event List',
    des: 'Event type Default is cpu cycles',
    hidden: true,
    type: 'select-multiple',
    selectArray: [''],
  },
  {
    title: 'CPU Percent',
    des: 'Set the max percent of cpu time used for recording',
    hidden: true,
    type: 'lit-slider',
    litSliderStyle: {
      minRange: 0,
      maxRange: 100,
      defaultValue: '100',
      resultUnit: '%',
      stepSize: 1,
      lineColor: 'var(--dark-color3,#a88888)',
      buttonColor: '#a88888',
    },
  },
  {
    title: 'Frequency',
    des: 'Set event sampling frequency',
    hidden: false,
    type: 'input',
    value: '1000',
  },
  {
    title: 'Period',
    des: 'Set event sampling period for trace point events2',
    hidden: true,
    type: 'input',
    value: '1',
  },
  {
    title: 'Off CPU',
    des: 'Trace when threads are scheduled off cpu',
    hidden: false,
    type: 'switch',
    value: false,
  },
  {
    title: 'Kernel Chain',
    des: '',
    hidden: false,
    type: 'switch',
    value: false,
  },
  {
    title: 'No Inherit',
    des: "Don't trace child processes",
    hidden: true,
    type: 'switch',
    value: false,
  },
  {
    title: 'Call Stack',
    des: 'Setup and enable call stack recording',
    hidden: false,
    type: 'select',
    selectArray: ['dwarf', 'fp', 'none'],
  },
  {
    title: 'Branch',
    des: 'Taken branch stack sampling',
    hidden: true,
    type: 'select',
    selectArray: ['none', 'any', 'any_call', 'any_ret', 'ind_call', 'call', 'user', 'kernel'],
  },
  {
    title: 'Mmap Pages',
    des: 'Used to receiving record data from kernel',
    hidden: true,
    type: 'Mmap-lit-slider',
    litSliderStyle: {
      minRange: 1,
      maxRange: 10,
      defaultValue: '8',
      resultUnit: 'MB',
      stepSize: 1,
      lineColor: 'var(--dark-color3,#46B1E3)',
      buttonColor: '#999999',
    },
  },
  {
    title: 'Clock Type',
    des: 'Set the clock id to use for the various time fields in the perf_event_type records',
    hidden: true,
    type: 'select',
    selectArray: ['monotonic', 'realtime', 'monotonic_raw', 'boottime', 'perf'],
  },
];
