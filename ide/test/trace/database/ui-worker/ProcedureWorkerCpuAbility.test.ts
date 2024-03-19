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
import {
  CpuAbilityMonitorStruct,
  CpuAbilityRender,
} from '../../../../src/trace/database/ui-worker/ProcedureWorkerCpuAbility';
import { dataFilterHandler } from "../../../../src/trace/database/ui-worker/ProcedureWorkerCommon";

describe('CpuAbilityMonitorStruct Test', () => {
  const canvas = document.createElement('canvas');
  canvas.width = 14;
  canvas.height = 11;
  const ctx = canvas.getContext('2d');

  const data = {
    frame: {
      x: 201,
      y: 204,
      width: 100,
      height: 100,
    },
    startNS: 200,
    value: 50,
  };
  let frame = {
    x: 20,
    y: 20,
    width: 100,
    height: 100,
  };

  const Sourcedata = {
    frame: {
      x: 20,
      y: 20,
      width: 100,
      height: 100,
    },
    maxCpuUtilization: 200,
    value: 50,
  };
  it('CpuAbilityMonitorStructTest01', function () {
    expect(CpuAbilityMonitorStruct.draw(ctx, data)).toBeUndefined();
  });
  it('CpuAbilityMonitorStructTest03', function () {
    expect(CpuAbilityMonitorStruct.draw(ctx, Sourcedata)).toBeUndefined();
  });

  it('CpuAbilityMonitorStructTest05', function () {
    let dataList = new Array();
    dataList.push({
      startNs: 0,
      dur: 10,
      frame: { x: 0, y: 9, width: 10, height: 10 },
    });
    dataList.push({ startNs: 1, dur: 111 });
    dataFilterHandler(dataList, [{ length: 0 }], {
      startKey: 'startNS',
      durKey: 'dur',
      startNS: TraceRow.range?.startNS ?? 0,
      endNS: TraceRow.range?.endNS ?? 0,
      totalNS: TraceRow.range?.totalNS ?? 0,
      frame: frame,
      paddingTop: 5,
      useCache: false,
    });
  });

  it('CpuAbilityMonitorStructTest06', function () {
    let cpuAbilityRender = new CpuAbilityRender();
    let cpuAbilityReq = {
      lazyRefresh: true,
      type: '',
      startNS: 2,
      endNS: 3,
      totalNS: 1,
      frame: {
        x: 11,
        y: 11,
        width: 90,
        height: 90,
      },
      useCache: false,
      range: {
        refresh: 'refresh',
      },
      canvas: '',
      context: {
        font: '11px sans-serif',
        fillStyle: '#ec407a',
        globalAlpha: 0.7,
      },
      lineColor: '#ec407a',
      isHover: '',
      hoverX: 0,
      params: '',
      wakeupBean: undefined,
      flagMoveInfo: '',
      flagSelectedInfo: 'k',
      slicesTime: 1,
      id: 1,
      x: 12,
      y: 12,
      width: 102,
      height: 102,
    };
    window.postMessage = jest.fn(() => true);
    expect(cpuAbilityRender.render(cpuAbilityReq, [], [])).toBeUndefined();
  });
  it('CpuAbilityMonitorStructTest07', function () {
    let cpuAbilityRender = new CpuAbilityRender();
    let canvas = document.createElement('canvas') as HTMLCanvasElement;
    let context = canvas.getContext('2d');
    const data = {
      context: context!,
      useCache: true,
      type: '',
      traceRange: [],
    };
    window.postMessage = jest.fn(() => true);
    expect(cpuAbilityRender.renderMainThread(data, new TraceRow())).toBeUndefined();
  });
});
