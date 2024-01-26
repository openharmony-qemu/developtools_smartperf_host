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

import { BaseStruct, isFrameContainPoint, ns2x, Render } from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';

export class SdkCounterRender extends Render {
  renderMainThread(
    req: {
      context: CanvasRenderingContext2D;
      useCache: boolean;
      type: string;
      maxName: string;
      maxValue: number;
    },
    row: TraceRow<CounterStruct>
  ): void {
    let counterList = row.dataList;
    let counterFilter = row.dataListCache;
    let maxCounter = req.maxValue;
    let maxCounterName = req.maxName;
    this.counter(
      counterList,
      counterFilter,
      TraceRow.range?.startNS ?? 0,
      TraceRow.range?.endNS ?? 0,
      TraceRow.range?.totalNS ?? 0,
      row.frame,
      req.useCache || (TraceRow.range?.refresh ?? false)
    );
    req.context.beginPath();
    let sdkCounterFind = false;
    for (let re of counterFilter) {
      if (row.isHover && re.frame && isFrameContainPoint(re.frame, row.hoverX, row.hoverY)) {
        CounterStruct.hoverCounterStruct = re;
        sdkCounterFind = true;
      }
      CounterStruct.draw(req.context, re, maxCounter);
    }
    if (!sdkCounterFind && row.isHover) {
      CounterStruct.hoverCounterStruct = undefined;
    }
    req.context.closePath();
    let textMetrics = req.context.measureText(maxCounterName);
    req.context.globalAlpha = 0.8;
    req.context.fillStyle = '#f0f0f0';
    req.context.fillRect(0, 5, textMetrics.width + 8, 18);
    req.context.globalAlpha = 1;
    req.context.fillStyle = '#333';
    req.context.textBaseline = 'middle';
    req.context.fillText(maxCounterName, 4, 5 + 9);
  }

  counter(
    sdkCounterList: Array<any>,
    sdkCounterFilters: Array<any>,
    startNS: number,
    endNS: number,
    totalNS: number,
    frame: any,
    use: boolean
  ) {
    if (use && sdkCounterFilters.length > 0) {
      for (let index = 0; index < sdkCounterFilters.length; index++) {
        let item = sdkCounterFilters[index];
        if ((item.ts || 0) + (item.dur || 0) > startNS && (item.ts || 0) < endNS) {
          CounterStruct.setCounterFrame(sdkCounterFilters[index], 5, startNS, endNS, totalNS, frame);
        } else {
          sdkCounterFilters[index].frame = null;
        }
      }
      return;
    }
    sdkCounterFilters.length = 0;
    setSdkCounterFilter(sdkCounterList, sdkCounterFilters, startNS, endNS, totalNS, frame);
  }
}
function setSdkCounterFilter(
  sdkCounterList: Array<any>,
  sdkCounterFilters: Array<any>,
  startNS: number,
  endNS: number,
  totalNS: number,
  frame: any
) {
  if (sdkCounterList) {
    for (let index = 0; index < sdkCounterList.length; index++) {
      let item = sdkCounterList[index];
      item.dur =
        index === sdkCounterList.length - 1
          ? endNS - (item.ts || 0)
          : (sdkCounterList[index + 1].ts || 0) - (item.ts || 0);
      if ((item.ts || 0) + (item.dur || 0) > startNS && (item.ts || 0) < endNS) {
        CounterStruct.setCounterFrame(sdkCounterList[index], 5, startNS, endNS, totalNS, frame);
        if (
          !(
            index > 0 &&
            (sdkCounterList[index - 1].frame?.x || 0) === (sdkCounterList[index].frame?.x || 0) &&
            (sdkCounterList[index - 1].frame?.width || 0) === (sdkCounterList[index].frame?.width || 0)
          )
        ) {
          sdkCounterFilters.push(item);
        }
      }
    }
  }
}

export class CounterStruct extends BaseStruct {
  static maxCounter: number = 0;
  static maxCounterName: string = '';
  static hoverCounterStruct: CounterStruct | undefined;
  static selectCounterStruct: CounterStruct | undefined;

  value: number | undefined;
  ts: number | undefined;
  counter_id: number | undefined;

  static draw(sdkCounterContext: CanvasRenderingContext2D, data: CounterStruct, maxCounter: number) {
    if (data.frame) {
      let width = data.frame.width || 0;
      sdkCounterContext.fillStyle = '#67B0FC';
      sdkCounterContext.strokeStyle = '#67B0FC';
      if (data.ts === CounterStruct.hoverCounterStruct?.ts) {
        sdkCounterContext.lineWidth = 1;
        let drawHeight: number = Math.floor(((data.value || 0) * (data.frame.height || 0) * 1.0) / maxCounter);
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
        let drawHeight: number = Math.floor(((data.value || 0) * (data.frame.height || 0)) / maxCounter);
        sdkCounterContext.fillRect(data.frame.x, data.frame.y + data.frame.height - drawHeight + 4, width, drawHeight);
      }
    }
    sdkCounterContext.globalAlpha = 1.0;
    sdkCounterContext.lineWidth = 1;
  }

  static setCounterFrame(
    counterNode: any,
    padding: number,
    startNS: number,
    endNS: number,
    totalNS: number,
    frame: any
  ) {
    let sdkCounterStartPointX: number, sdkCountEndPointX: number;

    if ((counterNode.ts || 0) < startNS) {
      sdkCounterStartPointX = 0;
    } else {
      sdkCounterStartPointX = ns2x(counterNode.ts || 0, startNS, endNS, totalNS, frame);
    }
    if ((counterNode.ts || 0) + (counterNode.dur || 0) > endNS) {
      sdkCountEndPointX = frame.width;
    } else {
      sdkCountEndPointX = ns2x((counterNode.ts || 0) + (counterNode.dur || 0), startNS, endNS, totalNS, frame);
    }
    let frameWidth: number =
      sdkCountEndPointX - sdkCounterStartPointX <= 1 ? 1 : sdkCountEndPointX - sdkCounterStartPointX;
    if (!counterNode.frame) {
      counterNode.frame = {};
    }
    counterNode.frame.x = Math.floor(sdkCounterStartPointX);
    counterNode.frame.y = frame.y + padding;
    counterNode.frame.width = Math.ceil(frameWidth);
    counterNode.frame.height = Math.floor(frame.height - padding * 2);
  }
}
