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

import { BaseStruct, drawLoadingFrame, isFrameContainPoint, ns2x, Rect, Render } from './ProcedureWorkerCommon';
import { TraceRow } from '../../component/trace/base/TraceRow';
import { ColorUtils } from '../../component/trace/base/ColorUtils';
import { SpSystemTrace } from '../../component/SpSystemTrace';

export class XpowerGpuFreqRender extends Render {
  renderMainThread(
    xpowerReq: {
      context: CanvasRenderingContext2D;
      useCache: boolean;
    },
    row: TraceRow<XpowerGpuFreqStruct>
  ): void {
    let xpowerGpuFreqList = row.dataList;
    let xpowerGpuFreqFilter = row.dataListCache;
    gpuFreq(
      xpowerGpuFreqList,
      xpowerGpuFreqFilter,
      TraceRow.range!.startNS,
      TraceRow.range!.endNS,
      TraceRow.range!.totalNS,
      row.frame,
      xpowerReq.useCache || !TraceRow.range!.refresh
    );
    drawLoadingFrame(xpowerReq.context, xpowerGpuFreqFilter, row);
    xpowerReq.context.beginPath();
    let find = false;
    for (let i = 0; i < xpowerGpuFreqFilter.length; i++) {
      XpowerGpuFreqStruct.draw(xpowerReq, xpowerGpuFreqFilter[i], row);
      if (
        row.isHover &&
        xpowerGpuFreqFilter[i].frame &&
        isFrameContainPoint(xpowerGpuFreqFilter[i].frame!, row.hoverX, row.hoverY)
      ) {
        XpowerGpuFreqStruct.hoverXpowerStruct = xpowerGpuFreqFilter[i];
        XpowerGpuFreqStruct.drawStroke(xpowerReq, xpowerGpuFreqFilter[i], row);
        find = true;
      }
    }
    if (!find) {
      XpowerGpuFreqStruct.hoverXpowerStruct = undefined;
    }
    xpowerReq.context.closePath();
    let maxValueStr = String(XpowerGpuFreqStruct.maxValue) + ' ms';
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

export function gpuFreq(
  list: Array<XpowerGpuFreqStruct>,
  res: Array<XpowerGpuFreqStruct>,
  startNS: number,
  endNS: number,
  totalNS: number,
  frame: Rect,
  use: boolean
): void {
  list.length = 0;
  if (use && res.length > 0) {
    for (let index = 0; index < res.length; index++) {
      let item = res[index];
      XpowerGpuFreqStruct.setGpuFreqFrame(item, 5, startNS || 0, endNS || 0, totalNS || 0, frame);
    }
  }
}

export function XpowerGpuFreqStructOnClick(
  clickRowType: string,
  sp: SpSystemTrace,
  entry?: XpowerGpuFreqStruct
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (clickRowType === TraceRow.ROW_TYPE_XPOWER_GPU_FREQUENCY && (XpowerGpuFreqStruct.hoverXpowerStruct || entry)) {
      XpowerGpuFreqStruct.selectXpowerStruct = entry || XpowerGpuFreqStruct.hoverXpowerStruct;
      let startNs = XpowerGpuFreqStruct.selectXpowerStruct!.startNS;
      sp.traceSheetEL?.displayXpowerGpuFreqData(XpowerGpuFreqStruct.gpuFreqStructMap.get(startNs) || []);
      sp.timerShaftEL?.modifyFlagList(undefined);
      reject(new Error());
    } else {
      resolve(null);
    }
  });
}

export class XpowerGpuFreqStruct extends BaseStruct {
  static maxValue: number = 0;
  static hoverXpowerStruct: XpowerGpuFreqStruct | undefined;
  static selectXpowerStruct: XpowerGpuFreqStruct | undefined;
  static histogramHeightMap = new Map<number, number>();
  static gpuFreqStructMap = new Map<number, Array<XpowerGpuFreqStruct>>();
  static rowHeight: number = 200;
  value: number = 0;
  startNS: number = 0;
  dur: number = 0;
  valueType: string = '';
  runTime: number = 0;
  idleTime: number = 0;
  runTimeStr: string = '';
  idleTimeStr: string = '';
  startTimeStr: string = '';
  frequency: number = 0;
  count: number = 0;
  static flagTime: number = 0;
  static height: number = -1;
  static drawY: number = 0;

  static setGpuFreqFrame(
    powerNode: XpowerGpuFreqStruct,
    padding: number,
    startNS: number,
    endNS: number,
    totalNS: number,
    frame: Rect
  ): void {
    let startPointX: number;
    let endPointX: number;
    //@ts-ignore
    if ((powerNode.startNS || 0) < startNS) {
      startPointX = 0;
    } else {
      startPointX = ns2x(powerNode.startNS || 0, startNS, endNS, totalNS, frame);
    }
    //@ts-ignore
    if (powerNode.startNS + 3000000000 > endNS) {
      //@ts-ignore
      endPointX = frame.width;
    } else {
      //@ts-ignore
      endPointX = ns2x(powerNode.startNS + 3000000000, startNS, endNS, totalNS, frame);
    }
    let frameWidth = endPointX - startPointX <= 1 ? 1 : endPointX - startPointX;
    //@ts-ignore
    if (!powerNode.frame) {
      //@ts-ignore
      powerNode.frame = {};
    }
    //@ts-ignore
    powerNode.frame.x = Math.floor(startPointX);
    //@ts-ignore
    powerNode.frame.y = frame.y + padding;
    //@ts-ignore
    powerNode.frame.width = Math.ceil(frameWidth);
    //@ts-ignore
    powerNode.frame.height = Math.floor(frame.height - padding * 2);
  }

  static draw(
    req: { useCache: boolean; context: CanvasRenderingContext2D },
    data: XpowerGpuFreqStruct,
    row: TraceRow<XpowerGpuFreqStruct>
  ): void {
    if (data.frame) {
      req.context.globalAlpha = 0.8;
      if (data.startNS !== XpowerGpuFreqStruct.flagTime) {
        this.height = -1;
      } else {
        this.height = this.drawY;
      }
      XpowerGpuFreqStruct.flagTime = data.startNS;
      this.drawY = this.drawHistogram(req, data, row.frame);
    }
    XpowerGpuFreqStruct.drawStroke(req, data, row);
  }

  static drawStroke(
    req: { useCache: boolean; context: CanvasRenderingContext2D },
    data: XpowerGpuFreqStruct,
    row: TraceRow<XpowerGpuFreqStruct>
  ) {
    let startNS = TraceRow.range!.startNS;
    let endNS = TraceRow.range!.endNS;
    let totalNS = TraceRow.range!.totalNS;
    if (
      XpowerGpuFreqStruct.equals(XpowerGpuFreqStruct.hoverXpowerStruct!, data) ||
      XpowerGpuFreqStruct.equals(XpowerGpuFreqStruct.selectXpowerStruct!, data)
    ) {
      let startPointX = ns2x(data.startNS || 0, startNS, endNS, totalNS, row.frame);
      let endPointX = ns2x((data.startNS || 0) + 3000000000, startNS, endNS, totalNS, row.frame);
      let frameWidth = endPointX - startPointX <= 1 ? 1 : endPointX - startPointX;
      req!.context.lineWidth = 1;
      req!.context.strokeStyle = '#9899a0';
      let height = this.histogramHeightMap.get(data.startNS)! || 0;
      req!.context.strokeRect(startPointX, this.rowHeight - height, Math.ceil(frameWidth), height + 1);
    }
  }

  static drawHistogram(
    req: { useCache: boolean; context: CanvasRenderingContext2D },
    data: XpowerGpuFreqStruct,
    rowFrame: Rect
  ): number {
    let endPointX = Math.ceil(
      ns2x(
        (data.startNS || 0) + 3000000000,
        TraceRow.range!.startNS,
        TraceRow.range!.endNS,
        TraceRow.range!.totalNS,
        rowFrame
      )
    );
    let startPointX = Math.ceil(
      ns2x(data.startNS || 0, TraceRow.range!.startNS, TraceRow.range!.endNS, TraceRow.range!.totalNS, rowFrame)
    );
    let frameWidth = endPointX - startPointX <= 1 ? 1 : endPointX - startPointX;
    let histogramColor = ColorUtils.colorForTid(data.frequency || 0);
    req!.context.fillStyle = histogramColor;
    let drawStartY = 0;
    let dataHeight: number = ((data.runTime || 0) * (this.rowHeight - 28)) / XpowerGpuFreqStruct.maxValue;

    if (data.runTime !== 0 && dataHeight < 1) {
      dataHeight = 1;
    }
    data.frame!.x = startPointX;
    data.frame!.width = frameWidth;
    data.frame!.height = dataHeight;
    if (this.height === -1) {
      drawStartY = this.rowHeight - dataHeight;
      data.frame!.y = drawStartY;
      req!.context.fillRect(startPointX, drawStartY, Math.floor(frameWidth), dataHeight);
      return drawStartY;
    } else {
      drawStartY = this.height - dataHeight;
      data.frame!.y = drawStartY;
      req!.context.fillRect(startPointX, drawStartY, Math.floor(frameWidth), dataHeight);
      return drawStartY;
    }
  }

  static isHover(xpower: XpowerGpuFreqStruct): boolean {
    return xpower === XpowerGpuFreqStruct.hoverXpowerStruct || xpower === XpowerGpuFreqStruct.selectXpowerStruct;
  }
  static equals(baseStruct: XpowerGpuFreqStruct, targetStruct: XpowerGpuFreqStruct): boolean {
    return baseStruct === targetStruct;
  }
}
