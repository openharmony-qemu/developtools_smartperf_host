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

jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});

import { FrameAnimationRender } from '../../../../src/trace/database/ui-worker/ProcedureWorkerFrameAnimation';
import { Rect } from '../../../../src/trace/component/trace/timer-shaft/Rect';
import { TraceRow } from '../../../../src/trace/component/trace/base/TraceRow';
import { FrameAnimationStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerFrameAnimation';

jest.mock('../../../../src/trace/component/SpSystemTrace', () => {
  return {};
});
describe('FrameAnimation Test', () => {
  let frameAnimationRender = new FrameAnimationRender();
  let rect = new Rect(341, 2, 10, 10);
  let canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  let ctx = canvas.getContext('2d');
  let dataList = [
    {
      animationId: 1,
      dur: 0,
      dynamicEndTs: 4774481414,
      dynamicStartTs: 4091445476,
      frame: rect,
      status: 'Response delay',
      textMetricsWidth: 115.44140625,
      ts: 4091445476,
    },
    {
      animationId: 1,
      dur: 683035938,
      dynamicEndTs: 4774481414,
      dynamicStartTs: 4091445476,
      frame: rect,
      status: 'Completion delay',
      textMetricsWidth: 133.0703125,
      ts: 4091445476,
    },
  ];
  TraceRow.range = {
    startNS: 0,
    endNS: 16868000000,
    totalNS: 16868000000,
  };

  it('FrameAnimationTest01', function () {
    frameAnimationRender.frameAnimation(
      dataList,
      [],
      TraceRow.range.startNS,
      TraceRow.range.endNS,
      TraceRow.range.totalNS,
      TraceRow.skeleton(),
      false
    );
    let node = {
      animationId: 1,
      dur: 0,
      dynamicEndTs: 4774481414,
      dynamicStartTs: 4091445476,
      frame: rect,
      status: 'Response delay',
      textMetricsWidth: 115.44140625,
      ts: 4091445476,
    };
    expect(FrameAnimationStruct.draw(ctx!, 1, node, TraceRow.skeleton())).toBeUndefined();
  });
  it('FrameAnimationTest02 ', function () {
    let frameAnimationRender = new FrameAnimationRender();
    let frameAnimationReq = {
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
      context: {
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
    expect(frameAnimationRender.renderMainThread(frameAnimationReq,new TraceRow<FrameAnimationStruct>())).toBeUndefined()
  });
});
