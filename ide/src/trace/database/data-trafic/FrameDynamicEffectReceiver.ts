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

import { TraficEnum } from './QueryEnum';
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
  let animationId = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.animationId);
  let status = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.status);
  let startTs = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.startTs);
  let endTs = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.endTs);
  let dur = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.dur);
  let depth = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.depth);
  let unitIndex: number = 1;
  let isIntersect = (a: FrameAnimationStruct, b: FrameAnimationStruct): boolean =>
      Math.max(a.startTs! + a.dur!, b.startTs! + b.dur!) - Math.min(a.startTs!, b.startTs!) < a.dur! + b.dur!;
  let depths = [];
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
    animationId[index] = itemData.animationId;
    status[index] = itemData.status;
    startTs[index] = itemData.startTs;
    endTs[index] = itemData.endTs;
    dur[index] = itemData.dur;
    depth[index] = itemData.depth;
  }
  (self as unknown as Worker).postMessage(
      {
        id: data.id,
        action: data.action,
        results: transfer
            ? {
              animationId: animationId.buffer,
              status: status.buffer,
              startTs: startTs.buffer,
              endTs: endTs.buffer,
              dur: dur.buffer,
              depth: depth.buffer,
            }
            : {},
        len: res.length,
        transfer: transfer,
      },
      transfer ? [animationId.buffer, status.buffer, startTs.buffer, endTs.buffer, dur.buffer, depth.buffer] : []
  );
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
  let id = new Uint16Array(transfer ? res.length : data.params.sharedArrayBuffers.id);
  let x = new Float32Array(transfer ? res.length : data.params.sharedArrayBuffers.x);
  let y = new Float32Array(transfer ? res.length : data.params.sharedArrayBuffers.y);
  let currentFrameWidth = new Float32Array(transfer ? res.length : data.params.sharedArrayBuffers.currentFrameWidth);
  let currentFrameHeight = new Float32Array(transfer ? res.length : data.params.sharedArrayBuffers.currentFrameHeight);
  let currentTs = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.currentTs);
  let frameSpacingResult = new Float32Array(transfer ? res.length : data.params.sharedArrayBuffers.frameSpacingResult);
  let preTs = new Float64Array(transfer ? res.length : data.params.sharedArrayBuffers.preTs);
  let preFrameWidth = new Float32Array(transfer ? res.length : data.params.sharedArrayBuffers.preFrameWidth);
  let preFrameHeight = new Float32Array(transfer ? res.length : data.params.sharedArrayBuffers.preFrameHeight);
  let preX = new Float32Array(transfer ? res.length : data.params.sharedArrayBuffers.preX);
  let preY = new Float32Array(transfer ? res.length : data.params.sharedArrayBuffers.preY);
  let unitIndex: number = 1;
  let secondToNanosecond: number = 1000_000_000;
  let nameDataMap: Map<string, Array<FrameSpacingStruct>> = new Map();
  for (let index: number = 0; index < res.length; index++) {
    let itemData = res[index];
    data.params.trafic === TraficEnum.ProtoBuffer && (itemData = itemData.frameSpacingData);
    if (nameDataMap.has(itemData.nameId)) {
      let spacingStructs = nameDataMap.get(itemData.nameId);
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
    } else {
      itemData.frameSpacingResult = 0;
      itemData.preTs = 0;
      itemData.preFrameWidth = 0;
      itemData.preFrameHeight = 0;
      itemData.preX = 0;
      itemData.preY = 0;
      nameDataMap.set(itemData.nameId, [itemData]);
    }
    id[index] = itemData.id;
    x[index] = Number(itemData.x);
    y[index] = Number(itemData.y);
    currentFrameWidth[index] = Number(itemData.currentFrameWidth);
    currentFrameHeight[index] = Number(itemData.currentFrameHeight);
    currentTs[index] = itemData.currentTs;
    frameSpacingResult[index] = Number(itemData.frameSpacingResult);
    preTs[index] = itemData.preTs;
    preFrameWidth[index] = Number(itemData.preFrameWidth);
    preFrameHeight[index] = Number(itemData.preFrameHeight);
    preX[index] = Number(itemData.preX);
    preY[index] = Number(itemData.preY);
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
              currentFrameWidth: currentFrameWidth.buffer,
              currentFrameHeight: currentFrameHeight.buffer,
              currentTs: currentTs.buffer,
              frameSpacingResult: frameSpacingResult.buffer,
              preTs: preTs.buffer,
              preFrameWidth: preFrameWidth.buffer,
              preFrameHeight: preFrameHeight.buffer,
              preX: preX.buffer,
              preY: preY.buffer,
            }
            : {},
        len: res.length,
        transfer: transfer,
      },
      transfer
          ? [
            id.buffer,
            x.buffer,
            y.buffer,
            currentFrameWidth.buffer,
            currentFrameHeight.buffer,
            currentTs.buffer,
            frameSpacingResult.buffer,
            preTs.buffer,
            preFrameWidth.buffer,
            preFrameHeight.buffer,
            preX.buffer,
            preY.buffer,
          ]
          : []
  );
}
