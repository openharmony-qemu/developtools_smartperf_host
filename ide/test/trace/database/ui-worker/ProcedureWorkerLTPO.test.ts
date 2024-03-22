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
import { LtpoRender, LtpoStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerLTPO';

jest.mock('../../../../src/trace/database/ui-worker/cpu/ProcedureWorkerCPU', () => {
  return {};
});
jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});
describe('ProcedureWorkerLTPO Test', () => {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 2;
  const ctx = canvas.getContext('2d');
  it('ProcedureWorkerLTPOTest01 ', function () {

    const data = {
      frame: {
        x: 10,
        y: 10,
        width: 110,
        height: 10,
      },
    };
    expect(LtpoStruct.draw(ctx, data)).toBeUndefined();
  });
  it('ProcedureWorkerLTPOTest02 ', function () {
    let ltpoRender = new LtpoRender();
    let  ltpoReq = {
      ltpoContext: ctx,
      lazyRefresh: true,
      type: '',
      startNS: 5,
      endNS: 9,
      totalNS: 4,
      frame: {
        x: 32,
        y: 20,
        width: 180,
        height: 180,
      },
      useCache: true,
      range: {
        refresh: '',
      },
      canvas: 'a',
      appStartupContext: {
        font: '12px sans-serif',
        fillStyle: '#a1697d',
        globalAlpha: 0.3,
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
    }
    window.postMessage = jest.fn(() => true);
    expect(ltpoRender.renderMainThread(ltpoReq,new TraceRow())).toBeUndefined()
  });
});
