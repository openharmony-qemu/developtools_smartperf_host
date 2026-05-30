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

import { BaseStruct, isFrameContainPoint, ns2x, Render, Rect, drawLoadingFrame } from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';

export class NetworkCountRender extends Render {
  renderMainThread(
    req: {
      context: CanvasRenderingContext2D;
      useCache: boolean;
      type: string;
    },
    row: TraceRow<NetworkCountStruct>
  ): void {
    let networkCountList = row.dataList;
    let networkCountFilter = row.dataListCache;
    this.counter(
      networkCountList,
      networkCountFilter,
      TraceRow.range?.startNS ?? 0,
      TraceRow.range?.endNS ?? 0,
      TraceRow.range?.totalNS ?? 0,
      row.frame,
      req.useCache || (TraceRow.range?.refresh ?? false)
    );
    drawLoadingFrame(req.context, networkCountFilter, row);
    req.context.beginPath();
    let networkCountFind = false;
    for (let re of networkCountFilter) {
      if (row.isHover && re.frame && isFrameContainPoint(re.frame, row.hoverX, row.hoverY)) {
        NetworkCountStruct.hoverNetworkCountStruct = re;
        networkCountFind = true;
      }
      NetworkCountStruct.draw(req.context, re, NetworkCountStruct.maxCount);
    }
    if (!networkCountFind && row.isHover) {
      NetworkCountStruct.hoverNetworkCountStruct = undefined;
    }
    req.context.closePath();
  }

  counter(
    networkCountList: Array<unknown>,
    networkCountFilters: Array<unknown>,
    startNS: number,
    endNS: number,
    totalNS: number,
    frame: Rect,
    use: boolean
  ): void {
    if (use && networkCountFilters.length > 0) {
      for (let index = 0; index < networkCountFilters.length; index++) {
        let item = networkCountFilters[index];
        //@ts-ignore
        if ((item.ts || 0) + (item.dur || 0) > startNS && (item.ts || 0) < endNS) {
          NetworkCountStruct.setCounterFrame(networkCountFilters[index], 5, startNS, endNS, totalNS, frame);
        } else {
          //@ts-ignore
          networkCountFilters[index].frame = null;
        }
      }
      return;
    }
    networkCountFilters.length = 0;
    setNetworkCountFilter(networkCountList, networkCountFilters, startNS, endNS, totalNS, frame);
  }
}

function setNetworkCountFilter(
  list: Array<unknown>,
  networkCountFilters: Array<unknown>,
  startNS: number,
  endNS: number,
  totalNS: number,
  frame: Rect
): void {
  if (list) {
    for (let index = 0; index < list.length; index++) {
      let item = list[index];
      //@ts-ignore
      if ((item.ts || 0) + (item.dur || 0) > startNS && (item.ts || 0) < endNS) {
        NetworkCountStruct.setCounterFrame(list[index], 5, startNS, endNS, totalNS, frame);
        networkCountFilters.push(item);
      }
    }
  }
}

export class NetworkCountStruct extends BaseStruct {
  static maxCount: number = 0;
  static hoverNetworkCountStruct: NetworkCountStruct | undefined;
  static selectNetworkCountStruct: NetworkCountStruct | undefined;

  ts: number | undefined;
  dur: number | undefined;
  count: number | undefined;

  static draw(sdkCounterContext: CanvasRenderingContext2D, data: NetworkCountStruct, maxCount: number): void {
    if (data.frame && maxCount > 0) {
      let width = data.frame.width || 0;
      sdkCounterContext.fillStyle = '#67B0FC';
      sdkCounterContext.strokeStyle = '#67B0FC';
      if (data.ts === NetworkCountStruct.hoverNetworkCountStruct?.ts) {
        sdkCounterContext.lineWidth = 1;
        let drawHeight = Math.floor(((data.count || 0) * (data.frame.height || 0)) / maxCount);
        sdkCounterContext.fillRect(data.frame.x, data.frame.y + data.frame.height - drawHeight + 4, width, drawHeight);
        sdkCounterContext.beginPath();
        sdkCounterContext.arc(data.frame.x, data.frame.y + data.frame.height - drawHeight + 4, 3, 0, 2 * Math.PI, true);
        sdkCounterContext.fill();
        sdkCounterContext.globalAlpha = 1.0;
        sdkCounterContext.stroke();
        sdkCounterContext.beginPath();
        sdkCounterContext.moveTo(data.frame.x + 3, data.frame.y + data.frame.height - drawHeight + 4);
        sdkCounterContext.lineWidth = 3;
        sdkCounterContext.lineTo(data.frame.x + width, data.frame.y + data.frame.height - drawHeight + 4);
        sdkCounterContext.stroke();
      } else {
        sdkCounterContext.lineWidth = 1;
        let drawHeight = Math.floor(((data.count || 0) * (data.frame.height || 0)) / maxCount);
        sdkCounterContext.fillRect(data.frame.x, data.frame.y + data.frame.height - drawHeight + 4, width, drawHeight);
      }
    }
    sdkCounterContext.globalAlpha = 1.0;
    sdkCounterContext.lineWidth = 1;
  }

  static setCounterFrame(
    counterNode: unknown,
    padding: number,
    startNS: number,
    endNS: number,
    totalNS: number,
    frame: Rect
  ): void {
    let networkCountStartPointX: number;
    let networkCountEndPointX: number;
    //@ts-ignore
    if ((counterNode.ts || 0) < startNS) {
      networkCountStartPointX = 0;
    } else {
      //@ts-ignore
      networkCountStartPointX = ns2x(counterNode.ts || 0, startNS, endNS, totalNS, frame);
    }
    //@ts-ignore
    if ((counterNode.ts || 0) + (counterNode.dur || 0) > endNS) {
      networkCountEndPointX = frame.width;
    } else {
      //@ts-ignore
      networkCountEndPointX = ns2x((counterNode.ts || 0) + (counterNode.dur || 0), startNS, endNS, totalNS, frame);
    }
    let frameWidth: number =
    networkCountEndPointX - networkCountStartPointX <= 1 ? 1 : networkCountEndPointX - networkCountStartPointX;
    //@ts-ignore
    if (!counterNode.frame) {
      //@ts-ignore
      counterNode.frame = {};
    }
    //@ts-ignore
    counterNode.frame.x = Math.floor(networkCountStartPointX);
    //@ts-ignore
    counterNode.frame.y = frame.y + padding;
    //@ts-ignore
    counterNode.frame.width = Math.ceil(frameWidth);
    //@ts-ignore
    counterNode.frame.height = Math.floor(frame.height - padding * 2);
  }
}
