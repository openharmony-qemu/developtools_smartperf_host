/*
 * Copyright (C) 2024 Huawei Device Co., Ltd.
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
import { PerfBottomUpStruct } from '../../../src/trace/bean/PerfBottomUpStruct';
describe('PerfBottomUpStruct', () => {
  it('test PerfBottomUpStruct 01', () => {
    let data = new PerfBottomUpStruct('sfd');
    data.selfTime = 5;
    expect(data.selfTime).toEqual(5);
  });

  it('test PerfBottomUpStruct 02', () => {
    let data = new PerfBottomUpStruct('sfd');
    let son = new PerfBottomUpStruct('sfdf');
    data.selfTime = 5;
    expect(data.addChildren(son)).toBeUndefined();
  });

  it('test PerfBottomUpStruct 03', () => {
    let data = new PerfBottomUpStruct('sfd');
    let son = new PerfBottomUpStruct('sfdf');
    data.selfTime = 5;
    data.addChildren(son);
    expect(son.notifyParentUpdateSelfTime()).toBeUndefined();
  });

  it('test PerfBottomUpStruct 04', () => {
    let data = new PerfBottomUpStruct('sfd');
    let son = new PerfBottomUpStruct('sfdf');
    data.selfTime = 5;
    data.addChildren(son);
    expect(data.calculateSelfTime()).toBeUndefined();
  });
});
