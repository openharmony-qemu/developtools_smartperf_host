// Copyright (c) 2021 Huawei Device Co., Ltd.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { CHART_OFFSET_LEFT, MAX_COUNT, QueryEnum, TraficEnum } from './utils/QueryEnum';
import { threadPool } from '../SqlLite';
import { TraceRow } from '../../component/trace/base/TraceRow';
import { FrameAnimationStruct } from '../ui-worker/ProcedureWorkerFrameAnimation';
import { FrameDynamicStruct } from '../ui-worker/ProcedureWorkerFrameDynamic';
import { FrameSpacingStruct } from '../ui-worker/ProcedureWorkerFrameSpacing';

export function frameAnimationSender(row: TraceRow<FrameAnimationStruct>): Promise<FrameAnimationStruct[]> {
  let transferAnimationDataType: number = TraficEnum.ProtoBuffer;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (transferAnimationDataType === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      animationId: new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT * MAX_COUNT),
      status: new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT * MAX_COUNT),
      startTs: new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT * MAX_COUNT),
      endTs: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      dur: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      depth: new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve): void => {
    threadPool.submitProto(
        QueryEnum.FrameAnimationData,
        {
          startNS: TraceRow.range?.startNS || 0,
          endNS: TraceRow.range?.endNS || 0,
          recordStartNS: window.recordStartNS,
          recordEndNS: window.recordEndNS,
          width: width,
          t: new Date().getTime(),
          trafic: transferAnimationDataType,
          sharedArrayBuffers: row.sharedArrayBuffers,
        },
        (res: any, len: number, transfer: boolean): void => {
          resolve(animationBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
        }
    );
  });
}

function animationBufferHandler(res: any, len: number): any[] {
  let outArr = [];
  let animationId = new Uint16Array(res.animationId);
  let status = new Uint16Array(res.status);
  let startTs = new Float64Array(res.startTs);
  let endTs = new Float64Array(res.endTs);
  let dur = new Float64Array(res.dur);
  let depth = new Uint16Array(res.depth);
  for (let index = 0; index < len; index++) {
    outArr.push({
      animationId: animationId[index],
      status: status[index],
      startTs: startTs[index],
      endTs: endTs[index],
      dur: dur[index],
      depth: depth[index],
    });
  }
  return outArr;
}

export function frameDynamicSender(row: TraceRow<FrameDynamicStruct>): Promise<FrameDynamicStruct[]> {
  let transferDynamicDataType: number = TraficEnum.ProtoBuffer;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (transferDynamicDataType === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      id: new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT * MAX_COUNT),
      x: new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      y: new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      width: new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      height: new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      alpha: new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      ts: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve): void => {
    threadPool.submitProto(
        QueryEnum.FrameDynamicData,
        {
          startNS: TraceRow.range?.startNS || 0,
          endNS: TraceRow.range?.endNS || 0,
          recordStartNS: window.recordStartNS,
          recordEndNS: window.recordEndNS,
          width: width,
          t: new Date().getTime(),
          trafic: transferDynamicDataType,
          sharedArrayBuffers: row.sharedArrayBuffers,
        },
        (res: any, len: number, transfer: boolean): void => {
          resolve(dynamicBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
        }
    );
  });
}

function dynamicBufferHandler(res: any, len: number): any[] {
  let outArr = [];
  let id = new Uint16Array(res.id);
  let x = new Float32Array(res.x);
  let y = new Float32Array(res.y);
  let width = new Float32Array(res.width);
  let height = new Float32Array(res.height);
  let alpha = new Float32Array(res.alpha);
  let ts = new Float64Array(res.ts);
  for (let index = 0; index < len; index++) {
    outArr.push({
      id: id[index],
      x: x[index],
      y: y[index],
      width: width[index],
      height: height[index],
      alpha: alpha[index],
      ts: ts[index],
    });
  }
  return outArr;
}

export function frameSpacingSender(
    physicalWidth: number,
    physicalHeight: number,
    row: TraceRow<FrameSpacingStruct>
): Promise<FrameSpacingStruct[]> {
  let transferSpacingDataType: number = TraficEnum.ProtoBuffer;
  let width = row.clientWidth - CHART_OFFSET_LEFT;
  if (transferSpacingDataType === TraficEnum.SharedArrayBuffer && !row.sharedArrayBuffers) {
    row.sharedArrayBuffers = {
      id: new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT * MAX_COUNT),
      x: new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      y: new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      currentFrameWidth: new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      currentFrameHeight: new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      currentTs: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      frameSpacingResult: new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      preTs: new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * MAX_COUNT),
      preFrameWidth: new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      preFrameHeight: new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      preX: new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * MAX_COUNT),
      preY: new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * MAX_COUNT),
    };
  }
  return new Promise((resolve): void => {
    threadPool.submitProto(
        QueryEnum.FrameSpacingData,
        {
          physicalWidth: physicalWidth,
          physicalHeight: physicalHeight,
          startNS: TraceRow.range?.startNS || 0,
          endNS: TraceRow.range?.endNS || 0,
          recordStartNS: window.recordStartNS,
          recordEndNS: window.recordEndNS,
          width: width,
          t: new Date().getTime(),
          trafic: transferSpacingDataType,
          sharedArrayBuffers: row.sharedArrayBuffers,
        },
        (res: any, len: number, transfer: boolean): void => {
          resolve(spacingBufferHandler(transfer ? res : row.sharedArrayBuffers, len));
        }
    );
  });
}

function spacingBufferHandler(res: any, len: number): any[] {
  let outArr = [];
  let id = new Uint16Array(res.id);
  let x = new Float32Array(res.x);
  let y = new Float32Array(res.y);
  let currentFrameWidth = new Float32Array(res.currentFrameWidth);
  let currentFrameHeight = new Float32Array(res.currentFrameHeight);
  let currentTs = new Float64Array(res.currentTs);
  let frameSpacingResult = new Float32Array(res.frameSpacingResult);
  let preTs = new Float64Array(res.preTs);
  let preFrameWidth = new Float32Array(res.preFrameWidth);
  let preFrameHeight = new Float32Array(res.preFrameHeight);
  let preX = new Float32Array(res.preX);
  let preY = new Float32Array(res.preY);
  for (let index = 0; index < len; index++) {
    outArr.push({
      id: id[index],
      x: x[index],
      y: y[index],
      currentFrameWidth: currentFrameWidth[index],
      currentFrameHeight: currentFrameHeight[index],
      currentTs: currentTs[index],
      frameSpacingResult: frameSpacingResult[index],
      preTs: preTs[index],
      preFrameWidth: preFrameWidth[index],
      preFrameHeight: preFrameHeight[index],
      preX: preX[index],
      preY: preY[index],
    });
  }
  return outArr;
}
