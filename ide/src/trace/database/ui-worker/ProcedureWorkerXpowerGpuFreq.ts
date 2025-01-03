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
import { SpSystemTrace } from '../../component/SpSystemTrace';
import { ColorUtils } from '../../component/trace/base/ColorUtils';

export class XpowerGpuFreqRender extends Render {
  renderMainThread(
    xpowerStasticReq: {
      context: CanvasRenderingContext2D;
      useCache: boolean;
    },
    row: TraceRow<XpowerGpuFreqStruct>
  ): void {
    // offsetW控制图例的横向偏移量 确保图例不超过画布边界 因收藏和非收藏时泳道的宽度不一致 offsetW根据情况调整
    let offsetW: number = row.collect ? 160 : 400;
    let checkedType = row.rowSettingCheckedBoxList;
    let checkedValue = row.rowSettingCheckBoxList;
    checkedValue!.forEach((item, index) => {
      if (!XpowerGpuFreqStruct.colorMap.has(Number(item))) {
        XpowerGpuFreqStruct.colorMap.set(Number(item), ColorUtils.MD_PALETTE[index]);
      }
    });
    let xpowerGpuFreqList = row.dataListCache.filter(
      // @ts-ignore
      (item) => checkedType[checkedValue?.indexOf(item.frequency.toString())]
    );
    let xpowerMap = new Map<number, XpowerGpuFreqStruct[]>();
    setGroupByTime(xpowerMap, xpowerGpuFreqList);
    XpowerGpuFreqStruct.xpowerMap = xpowerMap;
    setDataFrameAndHoverHtml(xpowerGpuFreqList, row);
    drawLoadingFrame(xpowerStasticReq.context, xpowerGpuFreqList, row);
    setMaxEnergyInfo(xpowerStasticReq.context, xpowerMap);

    xpowerStasticReq.context.beginPath();
    let find = false;
    for (let re of xpowerGpuFreqList) {
      XpowerGpuFreqStruct.draw(xpowerStasticReq, re, row, xpowerGpuFreqList.length);
      if (row.isHover && re.frame && isFrameContainPoint(re.frame, row.hoverX, row.hoverY)) {
        XpowerGpuFreqStruct.hoverXpowerStruct = re;
        find = true;
      }
    }
    if (!find) {
      XpowerGpuFreqStruct.hoverXpowerStruct = undefined;
    }
    xpowerStasticReq.context.closePath();
    let spApplication = document.getElementsByTagName('sp-application')[0];
    let isDark = spApplication && spApplication.hasAttribute('dark');
    drawLegend(xpowerStasticReq, checkedType!, checkedValue!, offsetW, isDark);
  }
}

function setGroupByTime(xpowerMap: Map<number, XpowerGpuFreqStruct[]>, xpowerGpuFreqList: XpowerGpuFreqStruct[]): void {
  xpowerGpuFreqList.forEach((item, index) => {
    if (xpowerMap.has(item.startNS)) {
      let data = xpowerMap.get(item.startNS);
      data!.push(item);
      xpowerMap.set(item.startNS, data!);
    } else {
      xpowerMap.set(item.startNS, []);
      let data = xpowerMap.get(item.startNS);
      data!.push(item);
      xpowerMap.set(item.startNS, data!);
    }
  });
}

function setDataFrameAndHoverHtml(filter: XpowerGpuFreqStruct[], row: TraceRow<XpowerGpuFreqStruct>): void {
  filter.forEach((item) => {
    XpowerGpuFreqStruct.setXPowerGpuFreqFrame(
      item,
      5,
      TraceRow.range?.startNS ?? 0,
      TraceRow.range?.endNS ?? 0,
      TraceRow.range?.totalNS ?? 0,
      row.frame
    );
  });
  let hoverMap: Map<number, string> = new Map();
  filter.forEach((item) => {
    if (hoverMap.has(item.startNS)) {
      hoverMap.set(item.startNS, hoverMap.get(item.startNS) + item.hoverHtml);
    } else {
      hoverMap.set(item.startNS, item.hoverHtml);
    }
  });
  XpowerGpuFreqStruct.hoverMap = hoverMap;
}

function setMaxEnergyInfo(context: CanvasRenderingContext2D, xpowerMap: Map<number, XpowerGpuFreqStruct[]>): void {
  XpowerGpuFreqStruct.computeMaxEnergy(xpowerMap);
  let s = XpowerGpuFreqStruct.max + ' ms';
  let textMetrics = context.measureText(s);
  context.globalAlpha = 0.8;
  context.fillStyle = '#f0f0f0';
  context.fillRect(0, 5, textMetrics.width + 8, 18);
  context.globalAlpha = 1;
  context.fillStyle = '#333';
  context.textBaseline = 'middle';
  context.fillText(s, 4, 5 + 9);
}

export function drawLegend(
  req: { context: CanvasRenderingContext2D; useCache: boolean },
  checked: boolean[],
  checkedValue: string[],
  offsetW: number,
  isDark?: boolean
): void {
  let textList: string[] = [];
  checkedValue.forEach((item, index) => {
    if (checked[index]) {
      textList.push(item.toUpperCase());
    }
  });
  for (let index = 0; index < textList.length; index++) {
    let text = req.context.measureText(textList[index]);
    req.context.fillStyle = XpowerGpuFreqStruct.colorMap.get(Number(textList[index]))!;
    req.context.globalAlpha = 1;
    let canvasEndX = req.context.canvas.clientWidth - offsetW;
    let textColor = isDark ? '#FFFFFF' : '#333';
    if (index === 0) {
      req!.context.fillRect(canvasEndX - textList.length * 80, 12, 8, 8);
      req.context.globalAlpha = 0.8;
      req.context.fillStyle = textColor;
      req.context.textBaseline = 'middle';
      req.context.fillText(textList[index], canvasEndX - textList.length * 80 + 10, 18);
      XpowerGpuFreqStruct.currentTextWidth = canvasEndX - textList.length * 80 + 40 + text.width;
    } else {
      req!.context.fillRect(XpowerGpuFreqStruct.currentTextWidth, 12, 8, 8);
      req.context.globalAlpha = 0.8;
      req.context.fillStyle = textColor;
      req.context.textBaseline = 'middle';
      req!.context.fillText(textList[index], XpowerGpuFreqStruct.currentTextWidth + 12, 18);
      XpowerGpuFreqStruct.currentTextWidth = XpowerGpuFreqStruct.currentTextWidth + 40 + text.width;
    }
  }
  req.context.fillStyle = '#333';
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
      XpowerGpuFreqStruct.xpowerMap.get(startNs)!.length > 0 &&
        sp.traceSheetEL?.displayXpowerGpuFreqData(XpowerGpuFreqStruct.xpowerMap.get(startNs) || []);
      sp.timerShaftEL?.modifyFlagList(undefined);
      reject(new Error());
    } else {
      resolve(null);
    }
  });
}

export class XpowerGpuFreqStruct extends BaseStruct {
  static rowHeight: number = 200;
  static currentTextWidth: number = 0;
  static hoverXpowerStruct: XpowerGpuFreqStruct | undefined;
  static selectXpowerStruct: XpowerGpuFreqStruct | undefined;

  startNS: number = 0;
  startMS: number = 0;
  runTime: number = 0;
  idleTime: number = 0;
  frequency: number = 0;
  count: number = 0;
  static max: number = 0;
  hoverHtml: string = '';

  static xpowerMap = new Map<number, XpowerGpuFreqStruct[]>();
  static hoverMap: Map<number, string> = new Map();
  static histogramHeightMap = new Map<number, number>();

  static flagTime: number = 0;
  static height: number = -1;
  static drawY: number = 0;
  static colorMap: Map<number, string> = new Map();
  static gpuFreqStructMap = new Map<number, Array<XpowerGpuFreqStruct>>();

  static draw(
    req: { useCache: boolean; context: CanvasRenderingContext2D },
    data: XpowerGpuFreqStruct,
    row: TraceRow<XpowerGpuFreqStruct>,
    length: number
  ): void {
    if (data.frame) {
      req.context.globalAlpha = 0.8;
      if (data.startNS !== XpowerGpuFreqStruct.flagTime || length === 1) {
        this.height = -1;
      } else {
        this.height = this.drawY;
      }
      XpowerGpuFreqStruct.flagTime = data.startNS;
      this.drawY = this.drawHistogram(req, data, row.frame);
    }
    XpowerGpuFreqStruct.drawStroke(req, data, row);
  }

  static equals(baseStruct: XpowerGpuFreqStruct, targetStruct: XpowerGpuFreqStruct): boolean {
    return baseStruct === targetStruct;
  }

  static drawStroke(
    req: { useCache: boolean; context: CanvasRenderingContext2D },
    data: XpowerGpuFreqStruct,
    row: TraceRow<XpowerGpuFreqStruct>
  ): void {
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

  static drawHoverFrame(
    data: XpowerGpuFreqStruct,
    isHover: boolean,
    wifiHeight: number,
    req: { context: CanvasRenderingContext2D; useCache: boolean },
    row: TraceRow<XpowerGpuFreqStruct>
  ): void {
    let startNS = TraceRow.range!.startNS;
    let endNS = TraceRow.range!.endNS;
    let totalNS = TraceRow.range!.totalNS;
    if (
      (data.startNS === XpowerGpuFreqStruct.hoverXpowerStruct?.startNS && isHover) ||
      (XpowerGpuFreqStruct.selectXpowerStruct && data.startNS === XpowerGpuFreqStruct.selectXpowerStruct?.startNS)
    ) {
      let endPointX = ns2x((data.startNS || 0) + 3000000000, startNS, endNS, totalNS, row.frame);
      let startPointX = ns2x(data.startNS || 0, startNS, endNS, totalNS, row.frame);
      let frameWidth = endPointX - startPointX <= 1 ? 1 : endPointX - startPointX;
      req.context.globalAlpha = 1;
      req!.context.lineWidth = 2;
      req.context.strokeStyle = '#9899a0';
      req!.context.strokeRect(startPointX, wifiHeight, frameWidth, data.frame!.height);
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
    let histogramColor = this.colorMap.get(data.frequency)!;
    req!.context.fillStyle = histogramColor;
    let drawStartY = 0;
    let dataHeight: number = ((data.runTime || 0) * (this.rowHeight - 28)) / XpowerGpuFreqStruct.max;

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

  static computeMaxEnergy(map: Map<number, XpowerGpuFreqStruct[]>): void {
    let maxRunTime = 0;
    map.forEach((list, key) => {
      let total = 0;
      list.forEach((item) => {
        total += item.runTime;
      });
      if (maxRunTime < total) {
        maxRunTime = total;
      }
      let mapValue = Math.ceil(((total || 0) * (XpowerGpuFreqStruct.rowHeight - 28)) / XpowerGpuFreqStruct.max);
      XpowerGpuFreqStruct.histogramHeightMap.set(list[0].startNS, mapValue);
    });
    XpowerGpuFreqStruct.max = maxRunTime;
  }

  static setXPowerGpuFreqFrame(
    node: XpowerGpuFreqStruct,
    padding: number,
    startNS: number,
    endNS: number,
    totalNS: number,
    frame: Rect
  ): void {
    let startPointX: number;
    let endPointX: number;
    if ((node.startNS || 0) < startNS) {
      startPointX = 0;
    } else {
      startPointX = ns2x(node.startNS, startNS, endNS, totalNS, frame);
    }
    if (node.startNS + 3000000000 > endNS) {
      endPointX = frame.width;
    } else {
      endPointX = ns2x(node.startNS + 3000000000, startNS, endNS, totalNS, frame);
    }
    let frameWidth = endPointX - startPointX <= 1 ? 1 : endPointX - startPointX;
    if (!node.frame) {
      node.frame = new Rect(0, 0, 0, 0);
    }
    node.frame.x = Math.floor(startPointX);
    node.frame.y = frame.y + padding;
    node.frame.width = Math.ceil(frameWidth);
    node.frame.height = Math.floor(frame.height - padding * 2);
  }
}
