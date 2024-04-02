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

import { TraceRow } from '../../../../src/trace/component/trace/base/TraceRow';

jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
import { ClockStruct, ClockRender } from '../../../../src/trace/database/ui-worker/ProcedureWorkerClock';
jest.mock('../../../../src/js-heap/model/DatabaseStruct', () => {
  return {};
});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
describe('ProcedureWorkerClock Test', () => {
  it('ProcedureWorkerClock01', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 12;
    canvas.height = 12;
    const ctx = canvas.getContext('2d');

    const data = {
      frame: {
        x: 202,
        y: 202,
        width: 100,
        height: 100,
      },
      filterId: 125,
      value: 556,
      startNS: 15454,
      dur: 14552,
      delta: 125,
    };
    expect(ClockStruct.draw(ctx!, data, 2)).toBeUndefined();
  });
  it('ProcedureWorkerClock02 ', function () {
    let clockRender = new ClockRender();
    let clockReq = {
      lazyRefresh: true,
      type: '',
      startNS: 5,
      endNS: 9,
      totalNS: 3,
      frame: {
        x: 32,
        y: 18,
        width: 180,
        height: 180,
      },
      useCache: true,
      range: {
        refresh: '',
      },
      canvas: 'b',
      context: {
        font: '12px sans-serif',
        fillStyle: '#a1697d',
        globalAlpha: 0.6,
        measureText: jest.fn(() => true),
        clearRect: jest.fn(() => true),
        stroke: jest.fn(() => true),
        closePath: jest.fn(() => false),
        beginPath: jest.fn(() => true),
        fillRect: jest.fn(() => false),
        fillText: jest.fn(() => true),
      },
      lineColor: '',
      isHover: 'true',
      hoverX: 0,
      params: '',
      wakeupBean: undefined,
      flagMoveInfo: '',
      flagSelectedInfo: '',
      slicesTime: 4,
      id: 1,
      x: 24,
      y: 24,
      width: 100,
      height: 100,
    };
    expect(clockRender.renderMainThread(clockReq,new TraceRow<ClockStruct>())).toBeUndefined()
  });
});
