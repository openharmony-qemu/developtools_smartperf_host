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

import { SpXPowerRecord } from '../../../../src/trace/component/setting/SpXPowerRecord';
import { messageTypeAll } from '../../../../src/trace/component/setting/utils/PluginConvertUtils';

describe('SpXPowerRecord Test', () => {
  let spXPowerRecord = new SpXPowerRecord();
  let config = {
    title: 'MessageType',
    selectArray: messageTypeAll,
  };
  let div = document.createElement('div');
  let valueEl = document.createElement('div') as HTMLElement;
  it('SpXPowerRecordTest01', function () {
    spXPowerRecord.xpowerSwitch!.checked = true;
    expect(spXPowerRecord.xpowerSwitch!.checked).toBeTruthy();
  });
  it('SpXPowerRecordTest02', function () {
    spXPowerRecord.xpowerSwitch!.checked = false;
    expect(spXPowerRecord.xpowerSwitch!.checked).toBeFalsy();
  });
  it('SpXPowerRecordTest03', function () {
    expect(spXPowerRecord.initRecordXpowerConfig()).toBeUndefined();
  });
  it('SpXPowerRecordTest04', function () {
    expect(spXPowerRecord.configTypeBySelectMultiple(config, div)).toBeUndefined();
  });
  it('SpXPowerRecordTest05', function () {
    expect(spXPowerRecord.getXpowerConfig()).toBeDefined();
  });
  it('SpXPowerRecordTest06', function () {
    valueEl.title = 'MessageType';
    expect(spXPowerRecord.getXpowerConfigData(valueEl, 'realBattery')).toBeUndefined();
  });
  it('SpXPowerRecordTest07', function () {
    expect(spXPowerRecord.initElements()).toBeUndefined();
    expect(spXPowerRecord.connectedCallback()).toBeUndefined();
    expect(spXPowerRecord.disconnectedCallback()).toBeUndefined();
    expect(spXPowerRecord.attributeChangedCallback('', 'a', 'b')).toBeUndefined();
    expect(spXPowerRecord.initHtml()).not.toBeUndefined();
  });
  it('SpXPowerRecordTest08', function () {
    expect(spXPowerRecord.typeSelectMousedownHandler()).toBeUndefined();
    expect(spXPowerRecord.typeSelectClickHandler()).toBeUndefined();
  });
  it('SpXPowerRecordTest09', function () {
    expect(spXPowerRecord.getSelectedOption()).toBeUndefined();
  });
  it('SpXPowerRecordTest10', function () {
    expect(spXPowerRecord.xpowerConfigByTypeList('realBattery', spXPowerRecord.typeSelect!)).toBe('');
  });
});
