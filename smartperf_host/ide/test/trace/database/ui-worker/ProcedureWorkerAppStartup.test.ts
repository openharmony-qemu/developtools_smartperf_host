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
import {
  AppStartupRender,
  AppStartupStruct,
} from '../../../../src/trace/database/ui-worker/ProcedureWorkerAppStartup';

jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../src/js-heap/model/DatabaseStruct', () => {
  return {};
});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
describe('ProcedureWorkerAppStartup Test', () => {
  it('AppStartupStructTest01', () => {
    const data = {
      frame: {
        x: 20,
        y: 20,
        width: 9,
        height: 3,
      },
      dur: 1,
      value: 'aa',
      startTs: 12,
      pid: 1,
      process: 'null',
      itid: 12,
      endItid: 13,
      tid: 1,
      startName: '23',
      stepName: 'st',
    };
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    expect(AppStartupStruct.draw(ctx, data)).toBeUndefined();
  });

  it('AppStartupStructTest02', () => {
    expect(AppStartupStruct.getStartupName(12)).toBe('Unknown Start Step');
  });
  it('AppStartupStructTest03', () => {
    expect(AppStartupStruct).not.toBeUndefined();
  });
  it('AppStartupStructTest04 ', function () {
    let appStartupRender = new AppStartupRender();
    let appStartReq = {
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
        globalAlpha: 0,
        measureText: jest.fn(() => true),
        clearRect: jest.fn(() => true),
        stroke: jest.fn(() => true),
        closePath: jest.fn(() => false),
        beginPath: jest.fn(() => true),
        fillRect: jest.fn(() => false),
        fillText: jest.fn(() => true),
      },
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
    expect(appStartupRender.renderMainThread(appStartReq, new TraceRow<AppStartupStruct>())).toBeUndefined();
  });
});
