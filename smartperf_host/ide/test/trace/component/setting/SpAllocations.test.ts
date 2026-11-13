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

import { SpAllocations } from '../../../../src/trace/component/setting/SpAllocations';

describe('SpAllocations Test', () => {
  beforeAll(() => {
    document.body.innerHTML = `
            <sp-allocations id = "sp"><sp-allocations>
        `;
  });

  it(' SpAllocations get Default attrValue', function () {
    let spEle = document.querySelector('#sp') as SpAllocations;
    spEle.unwindEL = jest.fn(() => true);
    spEle.unwindEL.value = jest.fn(() => true);
    spEle.shareMemory = jest.fn(() => true);
    spEle.shareMemory.value = jest.fn(() => true);
    spEle.shareMemoryUnit = jest.fn(() => true);
    spEle.shareMemoryUnit.value = jest.fn(() => true);
    spEle.filterMemory = jest.fn(() => true);
    spEle.filterMemory.value = jest.fn(() => true);
    spEle.filterMemoryUnit = jest.fn(() => true);
    spEle.filterMemoryUnit.value = jest.fn(() => true);
    expect(spEle.pid).toEqual(undefined);
    expect(spEle.unwind).toBeUndefined();
    expect(spEle.shared).toBeUndefined();
    expect(spEle.filter).toBeUndefined();
  });
  it('SpAllocations test01', function () {
    let spAllocations = document.querySelector('#sp') as SpAllocations;
    expect(spAllocations.appProcess).toBeUndefined();
  });

  it('SpAllocations test02', function () {
    let spAllocations = document.querySelector('#sp') as SpAllocations;
    expect(spAllocations.fp_unwind).toBeUndefined();
  });
  it('SpAllocations test03', function () {
    let spAllocations = document.querySelector('#sp') as SpAllocations;
    expect(spAllocations.record_accurately).toBeUndefined();
  });
  it('SpAllocations test04', function () {
    let spAllocations = document.querySelector('#sp') as SpAllocations;
    expect(spAllocations.offline_symbolization).toBeUndefined();
  });
  it('SpAllocations test05', function () {
    let spAllocations = document.querySelector('#sp') as SpAllocations;
    expect(spAllocations.record_statistics).toBeUndefined();
  });
  it('SpAllocations test06', function () {
    let spAllocations = document.querySelector('#sp') as SpAllocations;
    expect(spAllocations.statistics_interval).toBeUndefined();
  });
  it('SpAllocations test07', function () {
    let spAllocations = document.querySelector('#sp') as SpAllocations;
    expect(spAllocations.startup_mode).toBeFalsy();
  });
});
