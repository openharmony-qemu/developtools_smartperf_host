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

import { BaseStruct, dataFilterHandler, drawLoadingFrame, isFrameContainPoint, Render } from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';
import { ColorUtils } from '../../component/trace/base/ColorUtils';
import { SpSystemTrace } from '../../component/SpSystemTrace';

export class XpowerGpuFreqCountRender extends Render {
  renderMainThread(
    xpowerReq: {
      context: CanvasRenderingContext2D;
      useCache: boolean;
    },
    row: TraceRow<XpowerGpuFreqCountStruct>
  ): void {
    let xpowerGpuFreqCountList = row.dataList;
    let xpowerGpuFreqCountFilter = row.dataListCache;
    let maxValue = 0;
    if (xpowerGpuFreqCountFilter.length > 0) { // @ts-ignore
      maxValue = xpowerGpuFreqCountFilter.map((item) => item.value).reduce((a: unknown, b: unknown) => Math.max(a, b));
    }
    dataFilterHandler(xpowerGpuFreqCountList, xpowerGpuFreqCountFilter, {
      startKey: 'startNS',
      durKey: 'dur',
      startNS: TraceRow.range?.startNS ?? 0,
      endNS: TraceRow.range?.endNS ?? 0,
      totalNS: TraceRow.range?.totalNS ?? 0,
      frame: row.frame,
      paddingTop: 5,
      useCache: xpowerReq.useCache || !(TraceRow.range?.refresh ?? false),
    });
    drawLoadingFrame(xpowerReq.context, xpowerGpuFreqCountFilter, row);
    xpowerReq.context.beginPath();
    let find = false;
    for (let re of xpowerGpuFreqCountFilter) {
      XpowerGpuFreqCountStruct.draw(xpowerReq.context, re, maxValue);
      if (row.isHover && re.frame && isFrameContainPoint(re.frame, row.hoverX, row.hoverY)) {
        XpowerGpuFreqCountStruct.hoverXpowerStruct = re;
        find = true;
      }
    }
    if (!find) {
      XpowerGpuFreqCountStruct.hoverXpowerStruct = undefined;
    }
    xpowerReq.context.closePath();
    let maxValueStr = String(maxValue);
    let textMetrics = xpowerReq.context.measureText(maxValueStr);
    xpowerReq.context.globalAlpha = 0.8;
    xpowerReq.context.fillStyle = '#f0f0f0';
    xpowerReq.context.fillRect(0, 5, textMetrics.width + 8, 18);
    xpowerReq.context.globalAlpha = 1;
    xpowerReq.context.fillStyle = '#333';
    xpowerReq.context.textBaseline = 'middle';
    xpowerReq.context.fillText(maxValueStr, 4, 5 + 9);
  }
}

export class XpowerGpuFreqCountStruct extends BaseStruct {
  static maxValue: number = 0;
  static hoverXpowerStruct: XpowerGpuFreqCountStruct | undefined;
  static selectXpowerStruct: XpowerGpuFreqCountStruct | undefined;
  static index = 0;
  value: number = 0;
  startNS: number = 0;
  dur: number = 0; //自补充，数据库没有返回

  static draw(xpowerContext: CanvasRenderingContext2D, data: XpowerGpuFreqCountStruct, maxValue: number): void {
    if (data.frame) {
      const width = data.frame.width || 0;
      const drawHeight = this.calculateDrawHeight(data, maxValue);
      const cutHeight = 0;

      if (XpowerGpuFreqCountStruct.isHover(data)) {
        this.drawHoverState(xpowerContext, data, width, drawHeight, cutHeight);
      } else {
        this.drawNormalState(xpowerContext, data, width, drawHeight, cutHeight);
      }
    }
    this.resetCanvasContext(xpowerContext);
  }

  private static calculateDrawHeight(data: XpowerGpuFreqCountStruct, maxValue: number): number {
    let drawHeight = Math.floor(((data.value || 0) * (data.frame!.height || 0) * 1.0) / maxValue);
    return drawHeight === 0 ? 1 : drawHeight;
  }

  private static drawHoverState(
    xpowerContext: CanvasRenderingContext2D,
    data: XpowerGpuFreqCountStruct,
    width: number,
    drawHeight: number,
    cutHeight: number
  ): void {
    xpowerContext.lineWidth = 1;
    xpowerContext.globalAlpha = 0.6;
    xpowerContext.fillStyle = ColorUtils.colorForTid(XpowerGpuFreqCountStruct.index);
    xpowerContext.fillRect(
      data.frame!.x,
      data.frame!.y + data.frame!.height - drawHeight - cutHeight,
      width,
      drawHeight
    );
    xpowerContext.beginPath();
    xpowerContext.arc(
      data.frame!.x,
      data.frame!.y + data.frame!.height - drawHeight - cutHeight,
      3,
      0,
      2 * Math.PI,
      true
    );
    xpowerContext.fill();
    xpowerContext.globalAlpha = 1.0;
    xpowerContext.strokeStyle = ColorUtils.colorForTid(XpowerGpuFreqCountStruct.index);
    xpowerContext.stroke();
    xpowerContext.beginPath();
    xpowerContext.moveTo(data.frame!.x + 3, data.frame!.y + data.frame!.height - drawHeight - cutHeight);
    xpowerContext.lineWidth = 3;
    xpowerContext.lineTo(data.frame!.x + width, data.frame!.y + data.frame!.height - drawHeight - cutHeight);
    xpowerContext.stroke();
  }

  private static drawNormalState(
    xpowerContext: CanvasRenderingContext2D,
    data: XpowerGpuFreqCountStruct,
    width: number,
    drawHeight: number,
    cutHeight: number
  ): void {
    xpowerContext.lineWidth = 1;
    xpowerContext.globalAlpha = 1.0;
    xpowerContext.strokeStyle = ColorUtils.colorForTid(XpowerGpuFreqCountStruct.index);
    xpowerContext.strokeRect(
      data.frame!.x,
      data.frame!.y + data.frame!.height - drawHeight - cutHeight,
      width,
      drawHeight
    );
    xpowerContext.globalAlpha = 0.6;
    xpowerContext.fillStyle = ColorUtils.colorForTid(XpowerGpuFreqCountStruct.index);
    xpowerContext.fillRect(
      data.frame!.x,
      data.frame!.y + data.frame!.height - drawHeight - cutHeight,
      width,
      drawHeight
    );
  }

  private static resetCanvasContext(xpowerContext: CanvasRenderingContext2D): void {
    xpowerContext.globalAlpha = 1.0;
    xpowerContext.lineWidth = 1;
  }

  static isHover(xpower: XpowerGpuFreqCountStruct): boolean {
    return (
      xpower === XpowerGpuFreqCountStruct.hoverXpowerStruct || xpower === XpowerGpuFreqCountStruct.selectXpowerStruct
    );
  }
}
