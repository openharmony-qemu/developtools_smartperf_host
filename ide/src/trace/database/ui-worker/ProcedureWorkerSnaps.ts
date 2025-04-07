/*
 * Copyright (C) 2024 Huawei Device Co., Ltd.
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

import { BaseStruct, dataFilterHandler, drawLoadingFrame, drawString, Rect } from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';
import { SpSystemTrace } from '../../component/SpSystemTrace';
import { SpApplication } from '../../SpApplication';

export class SnapShotRender {
  renderMainThread(
    req: {
      snapShotContext: CanvasRenderingContext2D;
      useCache: boolean;
      type: string;
      translateY: number;
    },
    snapShotRow: TraceRow<SnapShotStruct>,
    trace: SpSystemTrace
  ): void {
    let list = snapShotRow.dataList;
    let filter = snapShotRow.dataListCache;
    dataFilterHandler(list, filter, {
      startKey: 'startTime',
      durKey: 'dur',
      startNS: TraceRow.range?.startNS ?? 0,
      endNS: TraceRow.range?.endNS ?? 0,
      totalNS: TraceRow.range?.totalNS ?? 0,
      frame: snapShotRow.frame,
      paddingTop: 5,
      useCache: req.useCache || !(TraceRow.range?.refresh ?? false),
    });
    req.snapShotContext.globalAlpha = 0.6;
    let find = false;
    let offset = 3;
    for (let re of filter) {
      snapShotRow.isHover = SnapShotStruct.isClear && SnapShotStruct.hoverSnapShotStruct === undefined ? false : snapShotRow.isHover;
      SnapShotStruct.draw(req.snapShotContext, re, snapShotRow.translateY, snapShotRow.isHover);
      if (snapShotRow.isHover) {
        if (
          re.frame &&
          snapShotRow.hoverX >= re.frame.x - offset &&
          snapShotRow.hoverX <= re.frame.x + re.frame.width + offset
        ) {
          SnapShotStruct.hoverSnapShotStruct = re;
          find = true;
        }
      }
    }
    if (!find && snapShotRow.isHover) {
      SnapShotStruct.hoverSnapShotStruct = undefined;
    }
  }
}

export function SnapShotOnClick(
  rowType: string,
  sp: SpSystemTrace,
  entry?: SnapShotStruct,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (rowType === TraceRow.ROW_TYPE_SNAPSHOT && (SnapShotStruct.hoverSnapShotStruct || entry)) {
      SnapShotStruct.selectSnapShotStruct = entry || SnapShotStruct.hoverSnapShotStruct;
      SpApplication.displaySnapShot(SnapShotStruct.selectSnapShotStruct);
      reject(new Error());
    } else {
      resolve(null);
    }
  });
}

export class SnapShotStruct extends BaseStruct {
  static hoverSnapShotStruct: SnapShotStruct | undefined;
  static selectSnapShotStruct: SnapShotStruct | undefined;
  static maxVal: number | undefined = 0;
  static index = 0;
  static maxDepth: number = 0;
  static imageCache: { [img: string]: Promise<HTMLImageElement> } = {};
  static isClear: boolean;

  value: number | undefined = 20;
  startTime: number | undefined;
  dur: number | undefined;
  img: string = '';

  static async draw(
    ctx: CanvasRenderingContext2D,
    data: SnapShotStruct,
    translateY: number,
    isHover: boolean
  ): Promise<void> {
    if (data.frame && data.img) {
      const imagePromise = SnapShotStruct.getImageFromCache(data.img);
      try {
        const image = await imagePromise;
        ctx.drawImage(
          image,
          data.frame.x,
          data.frame.y + translateY,
          data.frame.width,
          data.frame.height
        );
        if (data.startTime === SnapShotStruct.selectSnapShotStruct?.startTime) {
          ctx.strokeStyle = 'red';
          ctx.lineWidth = 1;
          ctx.strokeRect(data.frame.x, data.frame.y + translateY + 1, data.frame.width - 2, data.frame.height - 2);
        }
        if (isHover && SnapShotStruct.hoverSnapShotStruct && data.startTime === SnapShotStruct.hoverSnapShotStruct?.startTime) {
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 1;
          ctx.strokeRect(data.frame.x, data.frame.y + translateY + 1, data.frame.width - 2, data.frame.height - 2);
        }
      } catch (error) {
        console.error('Error loading image:', error);
      }
    }
  }
  private static async getImageFromCache(img: string): Promise<HTMLImageElement> {
    if (!SnapShotStruct.imageCache[img]) {
      SnapShotStruct.imageCache[img] = new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = (): void => resolve(image);
        image.onerror = (error): void => reject(new Error(`Failed to load image: ${img},${error}`));
        image.src = img;
      });
    }
    return SnapShotStruct.imageCache[img];
  }
}