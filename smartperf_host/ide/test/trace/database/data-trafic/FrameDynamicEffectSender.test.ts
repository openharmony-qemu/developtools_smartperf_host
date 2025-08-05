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

import { threadPool } from '../../../../src/trace/database/SqlLite';
import { FrameAnimationStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerFrameAnimation';
import { TraceRow } from '../../../../src/trace/component/trace/base/TraceRow';
import {
  frameAnimationSender,
  frameDynamicSender,
  frameSpacingSender
} from '../../../../src/trace/database/data-trafic/FrameDynamicEffectSender';
import { FrameDynamicStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerFrameDynamic';
import { FrameSpacingStruct } from '../../../../src/trace/database/ui-worker/ProcedureWorkerFrameSpacing';
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorkerSnapshot', () => {
  return {};
});
jest.mock('../../../../src/trace/database/ui-worker/ProcedureWorker', () => {
  return {};
});
jest.mock('../../../../src/js-heap/model/DatabaseStruct', () => {
});
describe('FrameDynamicEffectSender Test', () => {
  let animationData =
    {
      animationId: 0,
      depth: 0,
      dur: 79379,
      endTs: 145133,
      frame: {x: 204, y: 2, width: 12, height: 16},
      frameInfo: "0",
      name: "H:APP_LIST_FLING, com.tencent.mm",
      startTs: 137,
      status: "Response delay",
      textMetricsWidth: 120.1328125
    }

  let dynamicCurveData = {
    alpha: 1,
    appName: "WindowScene_mm37",
    frame: {x: 295, y: 97, width: 0, height: 100},
    groupId: 1371974481,
    height: 2772,
    id: 100,
    ts: 197,
    typeValue: 0,
    width: 1344,
    x: 0,
    y: 0
  }

  let frameSpacingData = {
    currentFrameHeight: 2772,
    currentFrameWidth: 1344,
    currentTs: 32952,
    frame: {x: 491, y: 137, width: 0, height: 0},
    frameSpacingResult: [2.33],
    groupId: 1371974481,
    id: 218,
    nameId: "WindowScene_mm37",
    physicalHeight: 2772,
    physicalWidth: 1344,
    preFrameHeight: 2772,
    preFrameWidth: 1344,
    preTs: 32811,
    preX: 0,
    preY: 0,
    x: 0,
    y: 0
  }
  it('FrameDynamicEffectSenderTest01', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(animationData, 1, true);
    });
    let animationTraceRow = TraceRow.skeleton<FrameAnimationStruct>();
    frameAnimationSender(animationTraceRow).then(result => {
      expect(result).toHaveLength(1);
    });
  });

  it('FrameDynamicEffectSenderTest02', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(dynamicCurveData, 1, true);
    });
    let frameDynamicTraceRow = TraceRow.skeleton<FrameDynamicStruct>();
    frameDynamicSender(frameDynamicTraceRow).then(result => {
      expect(result).toHaveLength(1);
    });
  });

  it('FrameDynamicEffectSenderTest03', () => {
    threadPool.submitProto = jest.fn((query: number, params: any, callback: Function) => {
      callback(frameSpacingData, 1, true);
    });
    let frameSpacingTraceRow = TraceRow.skeleton<FrameSpacingStruct>();
    frameSpacingSender(1255, 5255, frameSpacingTraceRow).then(result => {
      expect(result).toHaveLength(1);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
