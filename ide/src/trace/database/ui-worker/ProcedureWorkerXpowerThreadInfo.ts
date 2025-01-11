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
import { THREAD_ENERGY, THREAD_LOAD } from '../../component/chart/SpXpowerChart';
import { SpSystemTrace } from '../../component/SpSystemTrace';

export class XpowerThreadInfoRender extends Render {
  renderMainThread(
    xpowerReq: {
      context: CanvasRenderingContext2D;
      useCache: boolean;
      type: string;
    },
    row: TraceRow<XpowerThreadInfoStruct>
  ): void {
    let xpowerThreadInfoList = row.dataList;
    let xpowerThreadInfoFilter = row.dataListCache;
    threadInfo(
      xpowerThreadInfoList,
      xpowerThreadInfoFilter,
      TraceRow.range!.startNS,
      TraceRow.range!.endNS,
      TraceRow.range!.totalNS,
      row.frame,
      xpowerReq.useCache || !TraceRow.range!.refresh
    );
    drawLoadingFrame(xpowerReq.context, xpowerThreadInfoFilter, row);
    xpowerReq.context.beginPath();
    let find = false;
    let maxValue = 0;
    let maxValueStr = '';
    if (xpowerReq.type === THREAD_ENERGY) {
      maxValue = XpowerThreadInfoStruct.energyMaxValue;
      maxValueStr = String(maxValue) + ' mAh';
    } else if (xpowerReq.type === THREAD_LOAD) {
      maxValue = XpowerThreadInfoStruct.loadMaxValue;
      maxValueStr = String(maxValue) + ' %';
    }
    for (let i = 0; i < xpowerThreadInfoFilter.length; i++) {
      XpowerThreadInfoStruct.draw(xpowerReq, xpowerThreadInfoFilter[i], maxValue, row);
      if (
        row.isHover &&
        xpowerThreadInfoFilter[i].frame &&
        isFrameContainPoint(xpowerThreadInfoFilter[i].frame!, row.hoverX, row.hoverY)
      ) {
        XpowerThreadInfoStruct.hoverXpowerStruct = xpowerThreadInfoFilter[i];
        XpowerThreadInfoStruct.drawStroke(xpowerReq, xpowerThreadInfoFilter[i], row);
        find = true;
      }
    }
    if (!find) {
      XpowerThreadInfoStruct.hoverXpowerStruct = undefined;
    }
    drawMaxValue(xpowerReq, maxValueStr);
  }
}

export function threadInfo(
  list: Array<XpowerThreadInfoStruct>,
  res: Array<XpowerThreadInfoStruct>,
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
      XpowerThreadInfoStruct.setThreadInfoFrame(item, 5, startNS || 0, endNS || 0, totalNS || 0, frame);
    }
  }
}

export function drawMaxValue(
  xpowerReq: {
    context: CanvasRenderingContext2D;
    useCache: boolean;
    type: string;
  },
  maxValueStr: string
): void {
  xpowerReq.context.closePath();
  let textMetrics = xpowerReq.context.measureText(maxValueStr);
  xpowerReq.context.globalAlpha = 0.8;
  xpowerReq.context.fillStyle = '#f0f0f0';
  xpowerReq.context.fillRect(0, 5, textMetrics.width + 8, 18);
  xpowerReq.context.globalAlpha = 1;
  xpowerReq.context.fillStyle = '#333';
  xpowerReq.context.textBaseline = 'middle';
  xpowerReq.context.fillText(maxValueStr, 4, 5 + 9);
}

export function XpowerThreadInfoStructOnClick(
  clickRowType: string,
  sp: SpSystemTrace,
  entry?: XpowerThreadInfoStruct
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (clickRowType === TraceRow.ROW_TYPE_XPOWER_THREAD_INFO && (XpowerThreadInfoStruct.hoverXpowerStruct || entry)) {
      XpowerThreadInfoStruct.selectXpowerStruct = entry || XpowerThreadInfoStruct.hoverXpowerStruct;
      let startNs = XpowerThreadInfoStruct.selectXpowerStruct!.startNS;
      let map = new Map();
      if (XpowerThreadInfoStruct.selectXpowerStruct?.valueType === THREAD_ENERGY) {
        map = XpowerThreadInfoStruct.threadEnergyStructMap;
      } else if (XpowerThreadInfoStruct.selectXpowerStruct?.valueType === THREAD_LOAD) {
        map = XpowerThreadInfoStruct.threadLoadStructMap;
      }
      sp.traceSheetEL?.displayXpowerThreadInfoData(map.get(startNs) || []);
      sp.timerShaftEL?.modifyFlagList(undefined);
      reject(new Error());
    } else {
      resolve(null);
    }
  });
}

export class XpowerThreadInfoStruct extends BaseStruct {
  static energyMaxValue: number = 0;
  static loadMaxValue: number = 0;
  static hoverXpowerStruct: XpowerThreadInfoStruct | undefined;
  static selectXpowerStruct: XpowerThreadInfoStruct | undefined;
  static histogramHeightMap = new Map<string, number>();
  static threadEnergyStructMap = new Map<number, Array<XpowerThreadInfoStruct>>();
  static threadLoadStructMap = new Map<number, Array<XpowerThreadInfoStruct>>();
  static rowHeight: number = 200;
  static flagTime: number = -1;
  static flagType: string = '';
  static height: number = -1;
  static drawY: number = 0;
  value: number = 0;
  startNS: number = 0;
  startMS: number = 0;
  dur: number = 0;
  threadTime: number = 0;
  threadName: string = '';
  threadNameId: number = -1;
  valueType: string = '';

  static setThreadInfoFrame(
    powerNode: XpowerThreadInfoStruct,
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
    data: XpowerThreadInfoStruct,
    maxValue: number,
    row: TraceRow<XpowerThreadInfoStruct>
  ): void {
    if (data.frame) {
      req!.context.globalAlpha = 0.8;
      if (data.startNS !== XpowerThreadInfoStruct.flagTime) {
        this.height = -1;
        if (XpowerThreadInfoStruct.flagTime > -1) {
          this.histogramHeightMap.set(XpowerThreadInfoStruct.flagTime + this.flagType, this.rowHeight - this.drawY);
        }
      } else {
        this.height = this.drawY;
      }
      XpowerThreadInfoStruct.flagTime = data.startNS;
      this.flagType = data.valueType;
      this.drawY = this.drawHistogram(req, data, maxValue, row);
      XpowerThreadInfoStruct.drawStroke(req, data, row);
    }
  }

  static drawStroke(
    req: { useCache: boolean; context: CanvasRenderingContext2D },
    data: XpowerThreadInfoStruct,
    row: TraceRow<XpowerThreadInfoStruct>
  ): void {
    let startNS = TraceRow.range!.startNS;
    let endNS = TraceRow.range!.endNS;
    let totalNS = TraceRow.range!.totalNS;
    if (
      (XpowerThreadInfoStruct.hoverXpowerStruct &&
        XpowerThreadInfoStruct.equals(XpowerThreadInfoStruct.hoverXpowerStruct!, data)) ||
      (XpowerThreadInfoStruct.selectXpowerStruct &&
        XpowerThreadInfoStruct.equals(XpowerThreadInfoStruct.selectXpowerStruct!, data))
    ) {
      let startPointX = ns2x(data.startNS || 0, startNS, endNS, totalNS, row.frame);
      let endPointX = ns2x((data.startNS || 0) + 3000000000, startNS, endNS, totalNS, row.frame);
      let frameWidth = endPointX - startPointX <= 1 ? 1 : endPointX - startPointX;
      req!.context.lineWidth = 1;
      req!.context.strokeStyle = '#9899a0';
      let height = this.histogramHeightMap.get(data.startNS + data.valueType) || 0;
      req!.context.strokeRect(startPointX, this.rowHeight - height - 1, Math.floor(frameWidth), height);
    }
  }

  static drawHistogram(
    req: { useCache: boolean; context: CanvasRenderingContext2D },
    data: XpowerThreadInfoStruct,
    maxValue: number,
    row: TraceRow<XpowerThreadInfoStruct>
  ): number {
    let endPointX = ns2x(
      (data.startNS || 0) + 3000000000,
      TraceRow.range!.startNS,
      TraceRow.range!.endNS,
      TraceRow.range!.totalNS,
      row.frame
    );
    let startPointX = ns2x(
      data.startNS || 0,
      TraceRow.range!.startNS,
      TraceRow.range!.endNS,
      TraceRow.range!.totalNS,
      row.frame
    );
    let frameWidth = endPointX - startPointX <= 1 ? 1 : endPointX - startPointX;
    let histogramColor = ColorUtils.colorForTid(data.threadNameId);
    req!.context.fillStyle = histogramColor;
    let drawStartY = 0;
    let dataHeight: number = ((data.value || 0) * (this.rowHeight - 28)) / maxValue;
    if (data.value !== 0 && dataHeight < 1) {
      dataHeight = 1;
    }
    data.frame!.x = startPointX;
    data.frame!.width = frameWidth;
    data.frame!.height = dataHeight;
    if (this.height === -1) {
      drawStartY = this.rowHeight - dataHeight;
      data.frame!.y = drawStartY;
      req!.context.fillRect(startPointX, drawStartY, frameWidth, dataHeight);
      return drawStartY;
    } else {
      drawStartY = this.height - dataHeight;
      data.frame!.y = drawStartY;
      req!.context.fillRect(startPointX, drawStartY, frameWidth, dataHeight);
      return drawStartY;
    }
  }

  static isHover(xpower: XpowerThreadInfoStruct): boolean {
    return xpower === XpowerThreadInfoStruct.hoverXpowerStruct || xpower === XpowerThreadInfoStruct.selectXpowerStruct;
  }

  static equals(baseStruct: XpowerThreadInfoStruct, targetStruct: XpowerThreadInfoStruct): boolean {
    return baseStruct === targetStruct;
  }
}
