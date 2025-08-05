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

import { SpRecordTrace } from '../../../src/trace/component/SpRecordTrace';
import { EventCenter } from '../../../src/trace/component/trace/base/EventCenter';
import '../../../src/trace/SpApplication';
import { LitButton } from '../../../src/base-ui/button/LitButton';
import { SpApplication } from '../../../src/trace/SpApplication';
import { HdcDeviceManager } from '../../../src/hdc/HdcDeviceManager';
declare global {
  interface Window {
    SmartEvent: {
      UI: {
        DeviceConnect: string;
        DeviceDisConnect: string;
      };
    };
    subscribe(evt: string, fn: (b: any) => void): void;
    unsubscribe(evt: string, fn: (b: any) => void): void;
    subscribeOnce(evt: string, fn: (b: any) => void): void;
    publish(evt: string, data: any): void;
    clearTraceRowComplete(): void;
  }
}

window.SmartEvent = {
  UI: {
    DeviceConnect: 'SmartEvent-DEVICE_CONNECT',
    DeviceDisConnect: 'SmartEvent-DEVICE_DISCONNECT',
  },
};

Window.prototype.subscribe = (ev, fn) => EventCenter.subscribe(ev, fn);
Window.prototype.unsubscribe = (ev, fn) => EventCenter.unsubscribe(ev, fn);
Window.prototype.publish = (ev, data) => EventCenter.publish(ev, data);
Window.prototype.subscribeOnce = (ev, data) => EventCenter.subscribeOnce(ev, data);
Window.prototype.clearTraceRowComplete = () => EventCenter.clearTraceRowComplete();
// @ts-ignore
window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

const intersectionObserverMock = () => ({
  observe: () => null,
});
window.IntersectionObserver = jest.fn().mockImplementation(intersectionObserverMock);

describe('SpRecordTrace Test', () => {
  SpRecordTrace.patentNode = jest.fn(()=> document.createElement('div'))
  let spRecordTrace = new SpRecordTrace();
  it('SpRecordTraceTest01', function () {
    expect(SpRecordTrace.initHtml).not.toBe('');
  });

  it('SpRecordTraceTest02', function () {
    SpRecordTrace.patentNode = jest.fn(() => true);
    expect(SpRecordTrace.initElements).toBeUndefined();
  });

  it('SpRecordTraceTest03', function () {
    let traceEvents = (SpRecordTrace.createTraceEvents = [
      'Scheduling details',
      'CPU Frequency and idle states',
      'High frequency memory',
      'Advanced ftrace config',
      'Syscalls',
      'Board voltages & frequency',
    ]);
    expect(traceEvents[0].indexOf('binder/binder_lock')).toBe(-1);
  });

  it('SpRecordTraceTest04', function () {
    expect(spRecordTrace.vs).not.toBeUndefined();
  });
  it('SpRecordTraceTest05', function () {
    spRecordTrace.vs = true;
    expect(spRecordTrace.vs).toBeTruthy();
  });

  it('SpRecordTraceTest06', function () {
    let devs = {
      length: 0,
    };
    spRecordTrace.deviceSelect = document.createElement('select');
    let option = document.createElement('option');
    spRecordTrace.deviceSelect.add(option)
    expect(spRecordTrace.compareArray(devs)).toBeTruthy();
  });
  it('SpRecordTraceTest07', function () {
    spRecordTrace.vs = false;
    expect(spRecordTrace.vs).toBeFalsy();
  });
  it('SpRecordTraceTest08', function () {
    let devs = {
      length: 1,
    };
    expect(spRecordTrace.compareArray(!devs)).toBeTruthy();
  });
  it('SpRecordTraceTest09', function () {
    spRecordTrace.showHint = true;
    expect(spRecordTrace.showHint).toBeTruthy();
  });
  it('SpRecordTraceTest10', function () {
    spRecordTrace.showHint = false;
    expect(spRecordTrace.showHint).toBeFalsy();
  });
  it('SpRecordTraceTest11', function () {
    let event = {
      isTrusted: true,
      device: {
        serialNumber: 'string',
      },
    };
    expect(spRecordTrace.usbDisConnectionListener(event)).toBeUndefined();
  });
  it('SpRecordTraceTest12', function () {
    let traceResult = {
      indexOf: jest.fn(() => undefined),
    };

    expect(spRecordTrace.isSuccess(traceResult)).toBe(1);
  });
  it('SpRecordTraceTest13', function () {
    expect(spRecordTrace.isSuccess('Signal')).toBe(2);
  });

  it('SpRecordTraceTest14', function () {
    expect(spRecordTrace.isSuccess('The device is abnormal')).toBe(-1);
  });

  it('SpRecordTraceTest15', function () {
    expect(spRecordTrace.isSuccess('')).toBe(0);
  });
  it('SpRecordTraceTest16', function () {
    expect(spRecordTrace.synchronizeDeviceList()).toBeUndefined();
  });
  it('SpRecordTraceTest17', function () {
    expect(spRecordTrace.freshMenuItemsStatus('Trace command')).toBeUndefined();
  });
  it('SpRecordTraceTest18', function () {
    spRecordTrace.recordButtonText = document.createElement('span');
    spRecordTrace.deviceVersion = document.createElement('select');
    spRecordTrace.cancelButton = new LitButton();
    spRecordTrace.disconnectButton = new LitButton();
    spRecordTrace.addButton = new LitButton();
    expect(spRecordTrace.buttonDisable(true)).toBeUndefined();
  });
  it('SpRecordTraceTest19', function () {
    expect(spRecordTrace.startRefreshDeviceList()).toBeUndefined();
  });
  it('SpRecordTraceTest20', function () {
    expect(spRecordTrace.freshConfigMenuDisable(true)).toBeUndefined();
  });
  it('SpRecordTraceTest21', function () {
    spRecordTrace.record_template = 'record_template';
    expect(spRecordTrace.record_template).toBeTruthy();
  });

  it('SpRecordTraceTest22', function () {
    spRecordTrace.initConfigPage();
    spRecordTrace.makeRequest();
    expect(spRecordTrace.spVmTracker).not.toBeUndefined();
  });

  it('SpRecordTraceTest23', function () {
    let addButtonClick = new CustomEvent('click', <CustomEventInit>{
      detail: {
        ...{},
        data: {
        },
      }
    });
    spRecordTrace.addButton.dispatchEvent(addButtonClick);
    let deviceSelectMousedown = new CustomEvent('mousedown', <CustomEventInit>{
      detail: {
        ...{},
        data: {
        },
      }
    });
    spRecordTrace.deviceSelect.dispatchEvent(deviceSelectMousedown);
    let deviceSelectChange = new CustomEvent('change', <CustomEventInit>{
      detail: {
        ...{},
        data: {
        },
      }
    });
    spRecordTrace.deviceSelect.dispatchEvent(deviceSelectChange);
    let deviceVersionChange = new CustomEvent('change', <CustomEventInit>{
      detail: {
        ...{},
        data: {
        },
      }
    });
    spRecordTrace.deviceVersion.dispatchEvent(deviceVersionChange);
    let disconnectButtonClick = new CustomEvent('click', <CustomEventInit>{
      detail: {
        ...{},
        data: {
        },
      }
    });
    spRecordTrace.disconnectButton.dispatchEvent(disconnectButtonClick);
    let cancelButtonClick = new CustomEvent('click', <CustomEventInit>{
      detail: {
        ...{},
        data: {
        },
      }
    });
    spRecordTrace.cancelButton.dispatchEvent(cancelButtonClick);
    let itemAddProbe = new CustomEvent('addProbe', <CustomEventInit>{
      detail: {
        ...{},
        data: {
        },
      }
    });
    spRecordTrace.spRecordPerf.dispatchEvent(itemAddProbe);
    spRecordTrace.spAllocations.dispatchEvent(itemAddProbe);
    spRecordTrace.probesConfig.dispatchEvent(itemAddProbe);
    spRecordTrace.spRecordTemplate.dispatchEvent(itemAddProbe);

    let spRecordTemplateDelProbe = new CustomEvent('delProbe', <CustomEventInit>{
      detail: {
        ...{},
        data: {
        },
      }
    });
    SpRecordTrace.selectVersion = '4.0';
    SpApplication.isLongTrace = true;
    spRecordTrace.spRecordTemplate.dispatchEvent(spRecordTemplateDelProbe);
    spRecordTrace.record_template = false;
    spRecordTrace.probesConfig = {
      traceEvents: ['input'],
      traceConfig: ['Scheduling details', 'CPU Frequency and idle states', 'High frequency memory', 'Advanced ftrace config',
        'Syscalls', 'Board voltages & frequency'],
      recordAbility: true,
      memoryConfig: ['Kernel meminfo', 'Virtual memory stats']
    }
    spRecordTrace.spAllocations = {
      appProcess: 'process',
      startSamp: true,
      startup_mode: true,
      record_statistics: true,
      response_lib_mode: true,
      sample_interval: true,
      recordJsStack: true,
      expandPids: ['dsad', 'fgt', 'yu']
    }
    spRecordTrace.spRecordPerf.getPerfConfig = jest.fn(()=> ['12,gtr', '15,frehtr', '24,init']);
    spRecordTrace.spRecordPerf.startSamp = true;
    spRecordTrace.spFileSystem.getSystemConfig = jest.fn(()=> ['12,gtr', '15,frehtr', '24,init']);
    spRecordTrace.spFileSystem.startFileSystem = true;
    spRecordTrace.spFileSystem.startVirtualMemory = true;
    spRecordTrace.spFileSystem.startIo = true;
    spRecordTrace.spSdkConfig.getPlugName = jest.fn(()=> 'cpu');
    spRecordTrace.spSdkConfig.startSamp = true;
    spRecordTrace.spHiSysEvent.startSamp = true;
    spRecordTrace.spArkTs = {
      startSamp: true,
      process: 'init'
    }
    spRecordTrace.spHiLog = {
      recordHilog: 'init',
      appProcess: 'init',
    }
    expect(spRecordTrace.makeRequest().pluginConfigs).not.toBeUndefined();
  });

  it('SpRecordTraceTest24', function () {
    let evData = {
      detail: {
        elementId: 'TaskPool'
      },
      preventDefault: ()=>{}
    };
    HdcDeviceManager.findDevice = jest.fn(() => {
      return {
        then: ()=>{}
      }
    });
    HdcDeviceManager.connect = jest.fn(() => {
      return {
        then: ()=>{}
      }
    });
    spRecordTrace.hintEl = document.createElement('span') as HTMLSpanElement;
    spRecordTrace.devicePrompt = document.createElement('span') as HTMLSpanElement;
    spRecordTrace.recordButton = document.createElement('lit-button') as LitButton;

    spRecordTrace.deviceSelect = document.createElement('select') as HTMLSelectElement;
    let optionEl = document.createElement('option') as HTMLOptionElement;
    spRecordTrace.deviceSelect.add(optionEl);
    spRecordTrace.deviceSelect.selectedIndex = 0;

    spRecordTrace.deviceVersion = document.createElement('select') as HTMLSelectElement;
    let versionOptionEl = document.createElement('option') as HTMLOptionElement;
    spRecordTrace.deviceVersion.add(versionOptionEl);
    spRecordTrace.deviceVersion.selectedIndex = 0;
    spRecordTrace.sp = {
      search: false
    }
    spRecordTrace.recordTempAddProbe(evData);
    spRecordTrace.recordTempDelProbe(evData);
    spRecordTrace.recordAddProbeEvent();
    spRecordTrace.addButtonClickEvent(evData);
    spRecordTrace.deviceSelectMouseDownEvent(evData);
    spRecordTrace.deviceSelectChangeEvent();
    spRecordTrace.deviceVersionChangeEvent();
    spRecordTrace.disconnectButtonClickEvent();
    spRecordTrace.recordButtonMouseDownEvent(evData);
    spRecordTrace.cancelRecordListener();
  });
});
