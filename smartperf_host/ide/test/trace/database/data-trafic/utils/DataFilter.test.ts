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

import {
  filterDataByGroup,
  filterDataByGroupLayer,
  filterDataByLayer
} from '../../../../../src/trace/database/data-trafic/utils/DataFilter';

describe('DataFilter Test', () => {
  it('DataFilterTest01', () => {
    let list = [
      {startKey: 0, durKey: 100, startNS: 0, endNS: 1000},
      {startKey: 100, durKey: 200, startNS: 1001, endNS: 2000},
    ];
    let layerKey = 'layerKey';
    let startKey = 'startKey';
    let durKey = 'durKey';
    let startNS = 0;
    let endNS = 2000;
    let width = 100;
    let result = filterDataByLayer(list, layerKey, startKey, durKey, startNS, endNS, width);
    expect(result).toEqual([
      {startKey: 0, durKey: 100, startNS: 0, endNS: 1000, v: true},
      {startKey: 100, durKey: 200, startNS: 1001, endNS: 2000, v: true},
    ]);
  });
  it('DataFilterTest02', () => {
    let list = [
      {startKey: 0, durKey: 100, startNS: 0, endNS: 1000},
      {startKey: 100, durKey: 200, startNS: 1001, endNS: 2000},
    ];
    let startKey = 'startKey';
    let durKey = 'durKey';
    let startNS = 0;
    let endNS = 2000;
    let width = 100;
    let result = filterDataByGroup(list, startKey, durKey, startNS, endNS, width, null);
    expect(result).toEqual([
      {startKey: 0, durKey: 100, startNS: 0, endNS: 1000, px: 0,},
      {startKey: 100, durKey: 200, startNS: 1001, endNS: 2000, px: 5,},
    ]);
  });
  it('DataFilterTest03', () => {
    let list = [
      {layerKey: 1, startKey: 0, durKey: 100, startNS: 0, endNS: 1000},
      {layerKey: 2, startKey: 100, durKey: 200, startNS: 1001, endNS: 2000},
    ];
    let layerKey = 'layerKey';
    let startKey = 'startKey';
    let durKey = 'durKey';
    let startNS = 0;
    let endNS = 2000;
    let width = 100;
    let result = filterDataByGroupLayer(list, layerKey, startKey, durKey, startNS, endNS, width);
    expect(result).toEqual([
      {startKey: 0, durKey: 100, startNS: 0, endNS: 1000, px: 100, durTmp: 100, layerKey: 1,},
      {startKey: 100, durKey: 200, startNS: 1001, endNS: 2000, px: 205, durTmp: 200, layerKey: 2,},
    ]);
  });
});
