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
});
