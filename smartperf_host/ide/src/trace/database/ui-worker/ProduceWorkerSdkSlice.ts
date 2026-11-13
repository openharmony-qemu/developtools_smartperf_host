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

import { Render, BaseStruct, isFrameContainPoint, ns2x, Rect } from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';

export class SdkSliceRender extends Render {
  renderMainThread(
    req: {
      context: CanvasRenderingContext2D;
      useCache: boolean;
      type: string;
      maxName: string;
      maxValue: number;
    },
    row: TraceRow<SdkSliceStruct>
  ): void {
    let sdkList = row.dataList;
    let sdkFilter = row.dataListCache;
    SdkSliceStruct.maxSdkSlice = req.maxValue;
    SdkSliceStruct.maxSdkSliceName = req.maxName;
    this.sdkSlice(
      sdkList,
      sdkFilter,
      TraceRow.range?.startNS ?? 0,
      TraceRow.range?.endNS ?? 0,
      TraceRow.range?.totalNS ?? 0, // @ts-ignore
      row.frame,
      req.useCache || (TraceRow.range?.refresh ?? false)
    );
    req.context.beginPath();
    let sdkSliceFind = false;
    for (let re of sdkFilter) {
      if (row.isHover && re.frame && isFrameContainPoint(re.frame, row.hoverX, row.hoverY)) {
        SdkSliceStruct.hoverSdkSliceStruct = re;
        sdkSliceFind = true;
      }
      SdkSliceStruct.draw(req.context, re);
    }
    if (!sdkSliceFind && row.isHover) {
      SdkSliceStruct.hoverSdkSliceStruct = undefined;
    }
    req.context.closePath();
  }

  sdkSlice(
    sdkList: Array<unknown>,
    sdkSliceFilters: Array<unknown>,
    startNS: number,
    endNS: number,
    totalNS: number,
    frame: Rect,
    use: boolean
  ): void {
    if (use && sdkSliceFilters.length > 0) {
      for (let index = 0; index < sdkSliceFilters.length; index++) {
        let item = sdkSliceFilters[index];
        //@ts-ignore
        if ((item.end_ts || 0) > startNS && (item.start_ts || 0) < endNS) {
          SdkSliceStruct.setSdkSliceFrame(sdkSliceFilters[index], 5, startNS, endNS, totalNS, frame);
        } else {
          //@ts-ignore
          sdkSliceFilters[index].frame = null;
        }
      }
      return;
    }
    sdkSliceFilters.length = 0;
    if (sdkList) {
      setSdkSliceFilter(sdkList, sdkSliceFilters, startNS, endNS, totalNS, frame);
    }
  }
}
function setSdkSliceFilter(
  sdkList: Array<unknown>,
  sdkSliceFilters: Array<unknown>,
  startNS: number,
  endNS: number,
  totalNS: number,
  frame: Rect
): void {
  for (let index = 0; index < sdkList.length; index++) {
    let item = sdkList[index];
    //@ts-ignore
    if (item.start_ts >= startNS && item.end_ts === 0) {
      //@ts-ignore
      item.end_ts = endNS;
    }
    //@ts-ignore
    if ((item.end_ts || 0) > startNS && (item.start_ts || 0) < endNS) {
      SdkSliceStruct.setSdkSliceFrame(sdkList[index], 5, startNS, endNS, totalNS, frame);
      if (
        !(
          index > 0 &&
          //@ts-ignore
          (sdkList[index - 1].frame?.x || 0) === (sdkList[index].frame?.x || 0) &&
          //@ts-ignore
          (sdkList[index - 1].frame?.width || 0) === (sdkList[index].frame?.width || 0)
        )
      ) {
        sdkSliceFilters.push(item);
      }
    }
  }
}

export class SdkSliceStruct extends BaseStruct {
  static maxSdkSlice: number = 0;
  static maxSdkSliceName: string = '';
  static hoverSdkSliceStruct: SdkSliceStruct | undefined;
  static selectSdkSliceStruct: SdkSliceStruct | undefined;

  startTs: number | undefined;
  endTs: number | undefined;

  value: number | undefined;
  slice_message: string | undefined;

  static draw(ctx: CanvasRenderingContext2D, data: SdkSliceStruct): void {
    if (data.frame) {
      let width = data.frame.width || 0;
      ctx.fillStyle = '#6DC0DC';
      ctx.strokeStyle = '#6DC0DC';
      if (data.startTs === SdkSliceStruct.hoverSdkSliceStruct?.startTs) {
        ctx.lineWidth = 1;
        ctx.fillRect(data.frame.x, data.frame.y + 4, width, data.frame.height - 10);
        ctx.beginPath();
        ctx.arc(data.frame.x, data.frame.y + 4, 3, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(data.frame.x + 3, data.frame.y + 4);
        ctx.lineWidth = 3;
        ctx.lineTo(data.frame.x + width, data.frame.y + 4);
        ctx.stroke();
      } else {
        ctx.lineWidth = 1;
        ctx.fillRect(data.frame.x, data.frame.y + 4, width, data.frame.height - 10);
      }
    }
  }

  static setSdkSliceFrame(
    SdkSliceNode: unknown,
    padding: number,
    startNS: number,
    endNS: number,
    totalNS: number,
    frame: Rect
  ): void {
    let sdkSliceStartPointX: number;
    let sdkSliceEndPointX: number;
    //@ts-ignore
    if ((SdkSliceNode.start_ts || 0) < startNS) {
      sdkSliceStartPointX = 0;
    } else {
      //@ts-ignore
      sdkSliceStartPointX = ns2x(SdkSliceNode.start_ts || 0, startNS, endNS, totalNS, frame);
    }
    //@ts-ignore
    if ((SdkSliceNode.end_ts || 0) > endNS) {
      sdkSliceEndPointX = frame.width;
    } else {
      //@ts-ignore
      sdkSliceEndPointX = ns2x(SdkSliceNode.end_ts || 0, startNS, endNS, totalNS, frame);
    }
    let frameWidth: number = sdkSliceEndPointX - sdkSliceStartPointX <= 1 ? 1 : sdkSliceEndPointX - sdkSliceStartPointX;
    //@ts-ignore
    if (!SdkSliceNode.frame) {
      //@ts-ignore
      SdkSliceNode.frame = {};
    }
    //@ts-ignore
    SdkSliceNode.frame.x = Math.floor(sdkSliceStartPointX);
    //@ts-ignore
    SdkSliceNode.frame.y = frame.y + padding;
    //@ts-ignore
    SdkSliceNode.frame.width = Math.ceil(frameWidth);
    //@ts-ignore
    SdkSliceNode.frame.height = Math.floor(frame.height - padding * 2);
  }
}
