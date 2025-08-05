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

import { TraficEnum } from './utils/QueryEnum';
import { FrameAnimationStruct } from '../ui-worker/ProcedureWorkerFrameAnimation';
import { FrameSpacingStruct } from '../ui-worker/ProcedureWorkerFrameSpacing';
import { Args } from './CommonArgs';

export const chartFrameAnimationDataProtoSql = (args: Args): string => {
  return `
      SELECT
          a.id AS animationId,
          0 AS status,
          ( 
              CASE WHEN a.input_time NOT NULL 
                  THEN ( a.input_time - ${args.recordStartNS} ) 
                  ELSE ( a.start_point - ${args.recordStartNS} ) 
              END 
          ) AS startTs,
          ( a.start_point - ${args.recordStartNS} ) AS endTs,
          a.name AS name
      FROM
          animation AS a 
      UNION
      SELECT
          a.id AS animationId,
          1 AS status,
          ( 
              CASE WHEN a.input_time NOT NULL 
                  THEN ( a.input_time - ${args.recordStartNS} ) 
                  ELSE ( a.start_point - ${args.recordStartNS} ) 
              END 
          ) AS startTs,
          ( a.end_point - ${args.recordStartNS} ) AS endTs,
          a.name AS name
      FROM
          animation AS a;`;
};

export const chartFrameDynamicDataMemSql = (args: Args): string => {
  return `
        SELECT
           dy.id,
           dy.x,
           dy.y,
           dy.width,
           dy.height,
           dy.alpha,
           (dy.end_time - ${args.recordStartNS}) AS ts,
           dy.name as appName
        FROM 
            dynamic_frame AS dy
        WHERE ts >= ${Math.floor(args.startNS)}
          and ts <= ${Math.floor(args.endNS)}`;
};

export const chartFrameSpacingDataMemSql = (args: Args): string => {
  return `
      SELECT
          d.id,
          d.x,
          d.y,
          d.width AS currentFrameWidth,
          d.height AS currentFrameHeight,
          (d.end_time - ${args.recordStartNS}) AS currentTs,
          d.name AS nameId
      FROM
          dynamic_frame AS d
      WHERE currentTs >= ${Math.floor(args.startNS)}
          and currentTs <= ${Math.floor(args.endNS)};`;
};

export function frameAnimationReceiver(data: unknown, proc: Function): void {
  // @ts-ignore
  let res = proc(chartFrameAnimationDataProtoSql(data.params));
  // @ts-ignore
  let transfer = data.params.trafic !== TraficEnum.SharedArrayBuffer;
  let frameAnimation = new FrameAnimation(data, res, transfer);
  let unitIndex: number = 1;
  let isIntersect = (a: FrameAnimationStruct, b: FrameAnimationStruct): boolean =>
    Math.max(a.startTs! + a.dur!, b.startTs! + b.dur!) - Math.min(a.startTs!, b.startTs!) < a.dur! + b.dur!;
  let depths: unknown[] = [];
  for (let index: number = 0; index < res.length; index++) {
    let itemData = res[index];
    // @ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (itemData = itemData.frameAnimationData);
    itemData.dur = itemData.endTs - itemData.startTs;
    if (!itemData.dur || itemData.dur < 0) {
      continue;
    }
    if (depths.length === 0) {
      itemData.depth = 0;
      depths[0] = itemData;
    } else {
      let depthIndex: number = 0;
      let isContinue: boolean = true;
      while (isContinue) {
        // @ts-ignore
        if (isIntersect(depths[depthIndex], itemData)) {
          if (depths[depthIndex + unitIndex] === undefined || !depths[depthIndex + unitIndex]) {
            itemData.depth = depthIndex + unitIndex;
            depths[depthIndex + unitIndex] = itemData;
            isContinue = false;
          }
        } else {
          itemData.depth = depthIndex;
          depths[depthIndex] = itemData;
          isContinue = false;
        }
        depthIndex++;
      }
    }
    frameAnimation.animationId[index] = itemData.animationId;
    frameAnimation.status[index] = itemData.status;
    frameAnimation.startTs[index] = itemData.startTs;
    frameAnimation.endTs[index] = itemData.endTs;
    frameAnimation.dur[index] = itemData.dur;
    frameAnimation.depth[index] = itemData.depth;
  }
  postFrameAnimationMessage(data, transfer, frameAnimation, res.length);
}
function postFrameAnimationMessage(
  data: unknown,
  transfer: boolean,
  frameAnimation: FrameAnimation,
  len: number
): void {
  (self as unknown as Worker).postMessage(
    {
      // @ts-ignore
      id: data.id,
      // @ts-ignore
      action: data.action,
      results: transfer
        ? {
            animationId: frameAnimation.animationId.buffer,
            status: frameAnimation.status.buffer,
            startTs: frameAnimation.startTs.buffer,
            endTs: frameAnimation.endTs.buffer,
            dur: frameAnimation.dur.buffer,
            depth: frameAnimation.depth.buffer,
          }
        : {},
      len: len,
      transfer: transfer,
    },
    transfer
      ? [
          frameAnimation.animationId.buffer,
          frameAnimation.status.buffer,
          frameAnimation.startTs.buffer,
          frameAnimation.endTs.buffer,
          frameAnimation.dur.buffer,
          frameAnimation.depth.buffer,
        ]
      : []
  );
}
class FrameAnimation {
  animationId: Uint16Array;
  status: Uint16Array;
  startTs: Float64Array;
  endTs: Float64Array;
  dur: Float64Array;
  depth: Uint16Array;

  constructor(data: unknown, res: unknown[], transfer: boolean) {
    // @ts-ignore
    this.animationId = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.animationId);
    // @ts-ignore
    this.status = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.status);
    // @ts-ignore
    this.startTs = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startTs);
    // @ts-ignore
    this.endTs = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.endTs);
    // @ts-ignore
    this.dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
    // @ts-ignore
    this.depth = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.depth);
  }
}

let frameSpacingList: Array<unknown> = [];
let frameDynamic: Array<unknown> = [];
export function resetDynamicEffect(): void {
  frameSpacingList = [];
  frameDynamic = [];
}
export function frameDynamicReceiver(data: unknown, proc: Function): void {
  if (frameDynamic.length === 0) {
    // @ts-ignore
    frameDynamic = proc(chartFrameDynamicDataMemSql(data.params));
  }
  // @ts-ignore
  let transfer = data.params.trafic !== TraficEnum.SharedArrayBuffer;
  // @ts-ignore
  let id = new Uint16Array(transfer ? frameDynamic.length : data.params.sharedArrayBuffers.id);
  // @ts-ignore
  let x = new Float32Array(transfer ? frameDynamic.length : data.params.sharedArrayBuffers.x);
  // @ts-ignore
  let y = new Float32Array(transfer ? frameDynamic.length : data.params.sharedArrayBuffers.y);
  // @ts-ignore
  let width = new Float32Array(transfer ? frameDynamic.length : data.params.sharedArrayBuffers.width);
  // @ts-ignore
  let height = new Float32Array(transfer ? frameDynamic.length : data.params.sharedArrayBuffers.height);
  // @ts-ignore
  let alpha = new Float32Array(transfer ? frameDynamic.length : data.params.sharedArrayBuffers.alpha);
  // @ts-ignore
  let ts = new Float64Array(transfer ? frameDynamic.length : data.params.sharedArrayBuffers.ts);
  for (let index: number = 0; index < frameDynamic.length; index++) {
    let itemData = frameDynamic[index];
    // @ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (itemData = itemData.frameDynamicData);
    // @ts-ignore
    id[index] = itemData.id;
    // @ts-ignore
    x[index] = Number(itemData.x);
    // @ts-ignore
    y[index] = Number(itemData.y);
    // @ts-ignore
    width[index] = Number(itemData.width);
    // @ts-ignore
    height[index] = Number(itemData.height);
    // @ts-ignore
    alpha[index] = Number(itemData.alpha);
    // @ts-ignore
    ts[index] = itemData.ts;
  }
  (self as unknown as Worker).postMessage(
    {
      // @ts-ignore
      id: data.id,
      // @ts-ignore
      action: data.action,
      results: transfer
        ? {
            id: id.buffer,
            x: x.buffer,
            y: y.buffer,
            width: width.buffer,
            height: height.buffer,
            alpha: alpha.buffer,
            ts: ts.buffer,
          }
        : {},
      len: frameDynamic.length,
      transfer: transfer,
    },
    transfer ? [id.buffer, x.buffer, y.buffer, width.buffer, height.buffer, alpha.buffer, ts.buffer] : []
  );
}
export function frameSpacingReceiver(data: unknown, proc: Function): void {
  if (frameSpacingList.length === 0) {
    // @ts-ignore
    frameSpacingList = proc(chartFrameSpacingDataMemSql(data.params));
  }
  // @ts-ignore
  let transfer = data.params.trafic !== TraficEnum.SharedArrayBuffer;
  let frameSpacing = new FrameSpacing(data, frameSpacingList, transfer);
  let nameDataMap: Map<string, Array<FrameSpacingStruct>> = new Map();
  for (let index: number = 0; index < frameSpacingList.length; index++) {
    let itemData = frameSpacingList[index];
    // @ts-ignore
    data.params.trafic === TraficEnum.ProtoBuffer && (itemData = itemData.frameSpacingData);
    // @ts-ignore
    if (nameDataMap.has(itemData.nameId)) {
      // @ts-ignore
      setSpacingStructs(nameDataMap, itemData, data);
    } else {
      // @ts-ignore
      setNameDataMap(nameDataMap, itemData);
    }
    // @ts-ignore
    frameSpacing.id[index] = itemData.id;
    // @ts-ignore
    frameSpacing.x[index] = Number(itemData.x);
    // @ts-ignore
    frameSpacing.y[index] = Number(itemData.y);
    // @ts-ignore
    frameSpacing.currentFrameWidth[index] = Number(itemData.currentFrameWidth);
    // @ts-ignore
    frameSpacing.currentFrameHeight[index] = Number(itemData.currentFrameHeight);
    // @ts-ignore
    frameSpacing.currentTs[index] = itemData.currentTs;
    // @ts-ignore
    frameSpacing.frameSpacingResult[index] = Number(itemData.frameSpacingResult);
    // @ts-ignore
    frameSpacing.preTs[index] = itemData.preTs;
    // @ts-ignore
    frameSpacing.preFrameWidth[index] = Number(itemData.preFrameWidth);
    // @ts-ignore
    frameSpacing.preFrameHeight[index] = Number(itemData.preFrameHeight);
    // @ts-ignore
    frameSpacing.preX[index] = Number(itemData.preX);
    // @ts-ignore
    frameSpacing.preY[index] = Number(itemData.preY);
  }
  postFrameSpacingMessage(data, transfer, frameSpacing, frameSpacingList.length);
}
function postFrameSpacingMessage(data: unknown, transfer: boolean, frameSpacing: FrameSpacing, len: number): void {
  (self as unknown as Worker).postMessage(
    {
      // @ts-ignore
      id: data.id,
      // @ts-ignore
      action: data.action,
      results: transfer
        ? {
            id: frameSpacing.id.buffer,
            x: frameSpacing.x.buffer,
            y: frameSpacing.y.buffer,
            currentFrameWidth: frameSpacing.currentFrameWidth.buffer,
            currentFrameHeight: frameSpacing.currentFrameHeight.buffer,
            currentTs: frameSpacing.currentTs.buffer,
            frameSpacingResult: frameSpacing.frameSpacingResult.buffer,
            preTs: frameSpacing.preTs.buffer,
            preFrameWidth: frameSpacing.preFrameWidth.buffer,
            preFrameHeight: frameSpacing.preFrameHeight.buffer,
            preX: frameSpacing.preX.buffer,
            preY: frameSpacing.preY.buffer,
          }
        : {},
      len: len,
      transfer: transfer,
    },
    transfer
      ? [
          frameSpacing.id.buffer,
          frameSpacing.x.buffer,
          frameSpacing.y.buffer,
          frameSpacing.currentFrameWidth.buffer,
          frameSpacing.currentFrameHeight.buffer,
          frameSpacing.currentTs.buffer,
          frameSpacing.frameSpacingResult.buffer,
          frameSpacing.preTs.buffer,
          frameSpacing.preFrameWidth.buffer,
          frameSpacing.preFrameHeight.buffer,
          frameSpacing.preX.buffer,
          frameSpacing.preY.buffer,
        ]
      : []
  );
}
function setSpacingStructs(
  nameDataMap: Map<string, Array<FrameSpacingStruct>>,
  itemData: FrameSpacingStruct,
  data: unknown
): void {
  let unitIndex: number = 1;
  let secondToNanosecond: number = 1000_000_000;
  let spacingStructs = nameDataMap.get(itemData.nameId!);
  if (spacingStructs) {
    let lastIndexData = spacingStructs[spacingStructs.length - 1];
    let intervalTime = (itemData.currentTs - lastIndexData.currentTs) / secondToNanosecond;
    let widthDifference = Number(itemData.currentFrameWidth!) - Number(lastIndexData.currentFrameWidth!);
    let heightDifference = Number(itemData.currentFrameHeight!) - Number(lastIndexData.currentFrameHeight!);
    let xDifference = Number(itemData.x!) - Number(lastIndexData.x!);
    let yDifference = Number(itemData.y!) - Number(lastIndexData.y!);
    // @ts-ignore
    let frameWidth = Math.abs(widthDifference / data.params.physicalWidth / intervalTime);
    // @ts-ignore
    let frameHeight = Math.abs(heightDifference / data.params.physicalHeight / intervalTime);
    // @ts-ignore
    let frameX = Math.abs(xDifference / data.params.physicalWidth / intervalTime);
    // @ts-ignore
    let frameY = Math.abs(yDifference / data.params.physicalHeight / intervalTime);
    let result = Math.max(frameWidth, frameHeight, frameX, frameY);
    itemData.frameSpacingResult = Number(result.toFixed(unitIndex));
    itemData.preTs = lastIndexData.currentTs;
    itemData.preFrameWidth = Number(lastIndexData.currentFrameWidth);
    itemData.preFrameHeight = Number(lastIndexData.currentFrameHeight);
    itemData.preX = Number(lastIndexData.x);
    itemData.preY = Number(lastIndexData.y);
    spacingStructs.push(itemData);
  }
}
function setNameDataMap(nameDataMap: Map<string, Array<FrameSpacingStruct>>, itemData: FrameSpacingStruct): void {
  itemData.frameSpacingResult = 0;
  itemData.preTs = 0;
  itemData.preFrameWidth = 0;
  itemData.preFrameHeight = 0;
  itemData.preX = 0;
  itemData.preY = 0;
  nameDataMap.set(itemData.nameId!, [itemData]);
}
class FrameSpacing {
  id: Uint16Array;
  x: Float32Array;
  y: Float32Array;
  currentFrameWidth: Float32Array;
  currentFrameHeight: Float32Array;
  currentTs: Float64Array;
  frameSpacingResult: Float32Array;
  preTs: Float64Array;
  preFrameWidth: Float32Array;
  preFrameHeight: Float32Array;
  preX: Float32Array;
  preY: Float32Array;

  constructor(data: unknown, len: unknown[], transfer: boolean) {
    // @ts-ignore
    this.id = new Uint16Array(transfer ? len : data.params.sharedArrayBuffers.animationId);
    // @ts-ignore
    this.x = new Float32Array(transfer ? len : data.params.sharedArrayBuffers.animationId);
    // @ts-ignore
    this.y = new Float32Array(transfer ? len : data.params.sharedArrayBuffers.animationId);
    // @ts-ignore
    this.currentFrameWidth = new Float32Array(transfer ? len : data.params.sharedArrayBuffers.animationId);
    // @ts-ignore
    this.currentFrameHeight = new Float32Array(transfer ? len : data.params.sharedArrayBuffers.animationId);
    // @ts-ignore
    this.currentTs = new Float64Array(transfer ? len : data.params.sharedArrayBuffers.animationId);
    // @ts-ignore
    this.frameSpacingResult = new Float32Array(transfer ? len : data.params.sharedArrayBuffers.animationId);
    // @ts-ignore
    this.preTs = new Float64Array(transfer ? len : data.params.sharedArrayBuffers.animationId);
    // @ts-ignore
    this.preFrameWidth = new Float32Array(transfer ? len : data.params.sharedArrayBuffers.animationId);
    // @ts-ignore
    this.preFrameHeight = new Float32Array(transfer ? len : data.params.sharedArrayBuffers.animationId);
    // @ts-ignore
    this.preX = new Float32Array(transfer ? len : data.params.sharedArrayBuffers.animationId);
    // @ts-ignore
    this.preY = new Float32Array(transfer ? len : data.params.sharedArrayBuffers.animationId);
  }
}
