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

export const chartFrameAnimationDataProtoSql = (args: any): string => {
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

export const chartFrameDynamicDataProtoSql = (args: any): string => {
  return `
        SELECT
           dy.id,
           dy.x,
           dy.y,
           dy.width,
           dy.height,
           dy.alpha,
           (dy.end_time - ${args.recordStartNS}) AS ts,
           dy.name as appName,
           ((dy.end_time - ${args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)})) AS px
        FROM 
            dynamic_frame AS dy
        WHERE ts >= ${Math.floor(args.startNS)}
          and ts <= ${Math.floor(args.endNS)}`;
};

export const chartFrameSpacingDataProtoSql = (args: any): string => {
  return `
      SELECT
          d.id,
          d.x,
          d.y,
          d.width AS currentFrameWidth,
          d.height AS currentFrameHeight,
          (d.end_time - ${args.recordStartNS}) AS currentTs,
          d.name AS nameId,
          ((d.end_time - ${args.recordStartNS}) / (${Math.floor((args.endNS - args.startNS) / args.width)})) AS px
      FROM
          dynamic_frame AS d
      WHERE currentTs >= ${Math.floor(args.startNS)}
          and currentTs <= ${Math.floor(args.endNS)}
      group by px;`;
};

export function frameAnimationReceiver(data: any, proc: Function): void {
  let res = proc(chartFrameAnimationDataProtoSql(data.params));
  let transfer = data.params.trafic !== TraficEnum.SharedArrayBuffer;
  let frameAnimation = new FrameAnimation(data, res, transfer);
  let unitIndex: number = 1;
  let isIntersect = (a: FrameAnimationStruct, b: FrameAnimationStruct): boolean =>
    Math.max(a.startTs! + a.dur!, b.startTs! + b.dur!) - Math.min(a.startTs!, b.startTs!) < a.dur! + b.dur!;
  let depths: any[] = [];
  for (let index: number = 0; index < res.length; index++) {
    let itemData = res[index];
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
function postFrameAnimationMessage(data: any, transfer: boolean, frameAnimation: FrameAnimation, len: number) {
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
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

  constructor(data: any, res: any[], transfer: boolean) {
    this.animationId = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.animationId);
    this.status = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.status);
    this.startTs = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startTs);
    this.endTs = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.endTs);
    this.dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
    this.depth = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.depth);
  }
}

export function frameDynamicReceiver(data: any, proc: Function): void {
  let res = proc(chartFrameDynamicDataProtoSql(data.params));
  let transfer = data.params.trafic !== TraficEnum.SharedArrayBuffer;
  let id = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.id);
  let x = new Float32Array(transfer ? res.length : data.params.sharedArrayBuffers.x);
  let y = new Float32Array(transfer ? res.length : data.params.sharedArrayBuffers.y);
  let width = new Float32Array(transfer ? res.length : data.params.sharedArrayBuffers.width);
  let height = new Float32Array(transfer ? res.length : data.params.sharedArrayBuffers.height);
  let alpha = new Float32Array(transfer ? res.length : data.params.sharedArrayBuffers.alpha);
  let ts = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.ts);
  for (let index: number = 0; index < res.length; index++) {
    let itemData = res[index];
    data.params.trafic === TraficEnum.ProtoBuffer && (itemData = itemData.frameDynamicData);
    id[index] = itemData.id;
    x[index] = Number(itemData.x);
    y[index] = Number(itemData.y);
    width[index] = Number(itemData.width);
    height[index] = Number(itemData.height);
    alpha[index] = Number(itemData.alpha);
    ts[index] = itemData.ts;
  }
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
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
      len: res.length,
      transfer: transfer,
    },
    transfer ? [id.buffer, x.buffer, y.buffer, width.buffer, height.buffer, alpha.buffer, ts.buffer] : []
  );
}

export function frameSpacingReceiver(data: any, proc: Function): void {
  let res = proc(chartFrameSpacingDataProtoSql(data.params));
  let transfer = data.params.trafic !== TraficEnum.SharedArrayBuffer;
  let frameSpacing = new FrameSpacing(data, res.length, transfer);
  let nameDataMap: Map<string, Array<FrameSpacingStruct>> = new Map();
  for (let index: number = 0; index < res.length; index++) {
    let itemData = res[index];
    data.params.trafic === TraficEnum.ProtoBuffer && (itemData = itemData.frameSpacingData);
    if (nameDataMap.has(itemData.nameId)) {
      setSpacingStructs(nameDataMap, itemData, data);
    } else {
      setNameDataMap(nameDataMap, itemData);
    }
    frameSpacing.id[index] = itemData.id;
    frameSpacing.x[index] = Number(itemData.x);
    frameSpacing.y[index] = Number(itemData.y);
    frameSpacing.currentFrameWidth[index] = Number(itemData.currentFrameWidth);
    frameSpacing.currentFrameHeight[index] = Number(itemData.currentFrameHeight);
    frameSpacing.currentTs[index] = itemData.currentTs;
    frameSpacing.frameSpacingResult[index] = Number(itemData.frameSpacingResult);
    frameSpacing.preTs[index] = itemData.preTs;
    frameSpacing.preFrameWidth[index] = Number(itemData.preFrameWidth);
    frameSpacing.preFrameHeight[index] = Number(itemData.preFrameHeight);
    frameSpacing.preX[index] = Number(itemData.preX);
    frameSpacing.preY[index] = Number(itemData.preY);
  }
  postFrameSpacingMessage(data, transfer, frameSpacing, res.length);
}
function postFrameSpacingMessage(data: any, transfer: boolean, frameSpacing: FrameSpacing, len: number) {
  (self as unknown as Worker).postMessage(
    {
      id: data.id,
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
  data: any
) {
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
    let frameWidth = Math.abs(widthDifference / data.params.physicalWidth / intervalTime);
    let frameHeight = Math.abs(heightDifference / data.params.physicalHeight / intervalTime);
    let frameX = Math.abs(xDifference / data.params.physicalWidth / intervalTime);
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
function setNameDataMap(nameDataMap: Map<string, Array<FrameSpacingStruct>>, itemData: FrameSpacingStruct) {
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

  constructor(data: any, len: any[], transfer: boolean) {
    this.id = new Uint16Array(transfer ? len : data.params.sharedArrayBuffers.animationId);
    this.x = new Float32Array(transfer ? len : data.params.sharedArrayBuffers.animationId);
    this.y = new Float32Array(transfer ? len : data.params.sharedArrayBuffers.animationId);
    this.currentFrameWidth = new Float32Array(transfer ? len : data.params.sharedArrayBuffers.animationId);
    this.currentFrameHeight = new Float32Array(transfer ? len : data.params.sharedArrayBuffers.animationId);
    this.currentTs = new Float64Array(transfer ? len : data.params.sharedArrayBuffers.animationId);
    this.frameSpacingResult = new Float32Array(transfer ? len : data.params.sharedArrayBuffers.animationId);
    this.preTs = new Float64Array(transfer ? len : data.params.sharedArrayBuffers.animationId);
    this.preFrameWidth = new Float32Array(transfer ? len : data.params.sharedArrayBuffers.animationId);
    this.preFrameHeight = new Float32Array(transfer ? len : data.params.sharedArrayBuffers.animationId);
    this.preX = new Float32Array(transfer ? len : data.params.sharedArrayBuffers.animationId);
    this.preY = new Float32Array(transfer ? len : data.params.sharedArrayBuffers.animationId);
  }
}
